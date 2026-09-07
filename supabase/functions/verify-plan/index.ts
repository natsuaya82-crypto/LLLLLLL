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

import { verifyJws, bindOf, decidePlan, b64ToBytes } from './verify.mjs';

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

  const wrote = await fetch(`${url}/rest/v1/plan`, {
    method: 'POST',
    headers: { ...head, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ id: uid, plan, at: now.toISOString() }),
  });
  if (!wrote.ok) return said({ why: 'could not write the plan: ' + (await wrote.text()) }, 500);

  /* `took` と `left` は数えたもので、説明ではありません ── 実機で「復元したのに
     付かない」が起きたとき、鎖が落ちたのか、別のアカウントのものだったのか、
     何も来なかったのかを分けられるのはここだけです。 */
  return said({ plan, until, took: took.length, left });
});
