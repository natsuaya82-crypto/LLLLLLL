// verify-plan — 段（plus/pro）を決める一箇所。
//
// OWNER 2026-09-06「アカウントごとなんだから、違うアカウントで復元できるのおかしい
// だろ。検証して」。そして 2026-09-03「だから端末でやるわけねえだろ」。
//
// ここより前は、端末が `/rest/v1/plan` に自分の段を POST し、サーバーはそれを
// 書き留めるだけでした。supabase/schema.sql の注記が自分でそう言っていました
// ──「anybody who can send this database a request can set their OWN plan to
// 'pro'」。電話はその人であって、その人は Pro と言えばよかった。
//
// 今は、端末が送るのは**段ではなく Apple が署名した取引**（`jwsRepresentation`）
// で、段を決めるのはここです。
//
//   1. 誰から来たか ── その人の JWT を Supabase 自身に照らす。名乗りではなく。
//   2. 何が来たか ── verify.mjs が x5c 鎖を Apple の根まで辿り、署名を見る。
//   3. 誰のものか ── `appAccountToken` が uid と一致するか、`purchase` が
//      既にその取引を誰かに束縛しているか。**別のアカウントの購入は付きません。**
//   4. 段 ── その uid の `purchase` の行**全部**から決め、service role で `plan`
//      に書く。
//
// 3 と 4 の間の線が、この函数の一番大事なところです。**段はこの呼び出しで届いた
// ものからではなく、この uid について今までに検証できたもの全部から決まります。**
// 届いたものだけで決めると、StoreKit がまだ追いついていない起動が「何も持って
// いない人」と同じ形になり、払った段がその瞬間に free になります。それは既に
// 二度この app で起きていて、ios/App/App/LinguaStore.swift が長々と書いています
// ──「空」と「読めていない」は枝を分けてはいけない。空の呼び出しは、蓄えた行を
// 読み直すだけで、何も失いません。期限の切れた行は数えられないので、lapse は
// 同じ一本の道で起きます。
//
// 秘密は repo にありません。`SUPABASE_SERVICE_ROLE_KEY` は Supabase が函数に
// 持たせるもの、`APPLE_ROOT_CA_G3` は公開の証明書ですが**値であって推測しては
// いけないもの**なので環境変数から来ます ── supabase/setup.md § verify-plan に
// どこから取るかが書いてあります。根が無ければこの函数は誰にも段を付けません。
// free の側に間違えるのが、間違えてよい側です。

import { verifyJws, bindOf, decidePlan, b64ToBytes, ORDER } from './verify.mjs';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
function said(body: unknown, status = 200) {
  return new Response(JSON.stringify(body),
    { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

/* 信じる根。複数書けるのは、Apple が根を更新する日に古いものと新しいものが
   並ぶからで、そのとき repo を触らずに済みます。カンマ区切り、base64 の DER。 */
function roots(): Uint8Array[] {
  const raw = (Deno.env.get('APPLE_ROOT_CA_G3') || '').trim();
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean).map((s) => b64ToBytes(s));
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return said({ why: 'POST' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const svc = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const root = roots();
  if (!root.length) return said({ why: 'APPLE_ROOT_CA_G3 is not set' }, 500);

  /* 誰から。名乗りではなく、Supabase 自身に聞きます ── この函数は service role
     を持っているので、uid を body から取ったら誰でも誰の段でも書けます。 */
  const auth = req.headers.get('Authorization') || '';
  if (!/^Bearer .+/.test(auth)) return said({ why: 'no session' }, 401);
  const who = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: auth } });
  if (!who.ok) return said({ why: 'no session' }, 401);
  const uid = String(((await who.json()) || {}).id || '');
  if (!uid) return said({ why: 'no session' }, 401);

  let body: { jws?: unknown };
  try { body = await req.json(); } catch { body = {}; }
  const list = Array.isArray(body.jws) ? body.jws.slice(0, 50) : [];

  const head = { apikey: svc, Authorization: `Bearer ${svc}`, 'Content-Type': 'application/json' };
  const now = new Date();
  const took: string[] = [];
  const left: string[] = [];

  for (const one of list) {
    const r = await verifyJws(one, { roots: root, now });
    if (!r.ok) { left.push(r.why); continue; }
    const p = r.payload;
    const orig = String(p.originalTransactionId || p.transactionId || '');
    if (!orig) { left.push('no transaction id'); continue; }

    /* 既にこの取引を誰かが検証しているか。`appAccountToken` の無い古い取引は、
       これが束縛です。 */
    const got = await fetch(
      `${url}/rest/v1/purchase?orig_tx=eq.${encodeURIComponent(orig)}&select=uid`,
      { headers: head });
    const rows = got.ok ? await got.json() : [];
    const why = bindOf(p, uid, rows.length ? rows[0] : null);
    if (why !== 'ok') { left.push(orig + ': ' + why); continue; }

    const row = {
      orig_tx: orig,
      uid,
      product: String(p.productId || ''),
      until: p.expiresDate ? new Date(Number(p.expiresDate)).toISOString() : null,
      revoked: p.revocationDate ? new Date(Number(p.revocationDate)).toISOString() : null,
      env: String(p.environment || ''),
      at: now.toISOString(),
    };
    const put = await fetch(`${url}/rest/v1/purchase`, {
      method: 'POST',
      headers: { ...head, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(row),
    });
    if (put.ok) took.push(orig); else left.push(orig + ': ' + (await put.text()));
  }

  /* そして段。**この呼び出しで来たものではなく、この uid について蓄えたもの全部
     から。** 上の長い注記がその理由です。 */
  const mine = await fetch(
    `${url}/rest/v1/purchase?uid=eq.${uid}&select=product,until,revoked`, { headers: head });
  const held = mine.ok ? await mine.json() : [];
  const { plan, until } = decidePlan(held.map((r: {
    product: string; until: string | null; revoked: string | null;
  }) => ({
    productId: r.product,
    expiresDate: r.until ? Date.parse(r.until) : 0,
    revocationDate: r.revoked ? Date.parse(r.revoked) : 0,
  })), { now });

  /* そして**下がったなら、下がる前の段を行に書きます。**
     -----------------------------------------------------------------------
     OWNER 2026-09-12「オンラインで出してね流石に」「4 起動の時に表示して
     ☑️今後表示しない 閉じる みたいなポップにしたくない？」。

     「プランが終了しました」は端末で決めていました ── `SET.planWas`（その端末が
     最後に見せた語）と比べる形で、Keychain の読めなかった実機では、契約したこと
     の無い人に「解約されました」と言いました。端末の語は 2026-09-11 に消えて、
     この表は `(id, plan, at)` だったので**誰も答えられなくなりました**。
     ここがその答えです。

     三つの場合があり、**同じ時に何も書かないのが要**です：

       下がる   `was` に今の行の段、`lapse_seen_at` は null ── 新しい終了は
                新しく知らせる物
       上がる   両方 null ── 終了はもう終わっている
       同じ     **この二列を body に載せない。** PostgREST の merge-duplicates は
                載っている列だけを更新するので、行はそのまま残ります。
                載せて null にすると、**起動が書いた知らせを、その起動の値段の頁
                がもう一度呼んだ時に消します** ── まだ見ていない知らせが消える。
                「☑ を付けずに閉じたら次の起動でまた出る」が要求しているのは
                この場合に触らないことです。

     段の梯子は `verify.mjs` の `ORDER` 一つ。ここで並べ直しません。 */
  const cur = await fetch(
    `${url}/rest/v1/plan?id=eq.${uid}&select=plan`, { headers: head });
  const have = cur.ok ? await cur.json() : [];
  const had = have.length ? String(have[0].plan || '') : '';
  const row: Record<string, unknown> = { id: uid, plan, at: now.toISOString() };
  if (had && ORDER.indexOf(plan) < ORDER.indexOf(had)) {
    row.was = had; row.lapse_seen_at = null;
  } else if (had && ORDER.indexOf(plan) > ORDER.indexOf(had)) {
    row.was = null; row.lapse_seen_at = null;
  }

  /* 書いた行を返してもらいます（`return=representation`）。**答えに載せる段も
     `was` も `lapse_seen` も、行が今持っているもの**で、ここで組み立て直した
     ものではありません。

     **段がそうでなければならない理由**：「スタッフは消えないんじゃねえの？」
     OWNER 2026-09-12、実機。段は `purchase` の行から決まり、staff の人には
     purchase がありません ── ここが決めるのは 'free' です。行は 'pro' に
     なります（`plan_staff_hold()`、supabase/schema.sql、2026-09-05「管理の画面
     でスタッフ設定を@でできるでしょ？そこに記載されてる人だけずっとプロに」）。
     自分の計算を返すと、**表とトリガーが持っている事実と違う語が端末に届きます**
     ── 156 までは端末が自分の写しを持っていたので隠れていて、答えだけを信じる
     ようになった 156 から、staff の端末に free が届きました。
     **段を決める場所は表とトリガーの一箇所で、この函数は自分の計算を返さない。**
     staff の条件をここに足さないのも同じ理由です（足すと二箇所になる）。

     `was` と `lapse_seen` も同じ一行から。「同じ」の場合は何も書いていないので
     組み立て直すと嘘になり、staff の場合はトリガーが両方を落とします。

     `until` だけは行にありません ── Apple の日付で、この表の列ではないので、
     決めたものをそのまま返します。staff の 'pro' には日付が無く、それは
     「期限が分からない」であって「期限が無い」ではない（www/store.js）。 */
  const wrote = await fetch(`${url}/rest/v1/plan?select=plan,was,lapse_seen_at`, {
    method: 'POST',
    headers: { ...head, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(row),
  });
  if (!wrote.ok) return said({ why: 'could not write the plan: ' + (await wrote.text()) }, 500);
  const back = await wrote.json();
  const after = back && back.length ? back[0] : {};
  /* 行が読めなかったときだけ、決めた段に落ちます。答えを返さない道より、
     free の側に間違える道のほうがまし ── この函数の頭の注記のとおり。 */
  const rung = after.plan ? String(after.plan) : plan;
  const was = after.was ? String(after.was) : null;
  const lapseSeen = !!after.lapse_seen_at;

  /* `took` と `left` は数えたもので、説明ではありません ── 実機で「復元したのに
     付かない」が起きたとき、鎖が落ちたのか、別のアカウントのものだったのか、
     何も来なかったのかを分けられるのはここだけです。 */
  /* `was` と `lapse_seen` は端末が起動のポップを出すかどうかの全部で、端末は
     どちらも憶えません（www/settings.js § capLapseSaw）。答えに無ければ出ない
     ── free の側に間違えるのが、間違えてよい側です。 */
  return said({ plan: rung, until, was, lapse_seen: lapseSeen,
                took: took.length, left });
});
