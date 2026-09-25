// push-send — フォロー・返信・いいね・リポスト、そしてその日のお題を、アプリを
// 閉じている iPhone へ。
//
// OWNER 2026-09-23「通知なんだけど、今日のお題が変わった時にも出るようにできる？」
//
// OWNER 2026-09-22「通知作ろう。アップルのネイティブ通知で、フォローされた時、
// 返信きた時みたいな感じでSNS部分であるやつ。それに加えて設定で個別通知のオンオフ
// できるように。」
//
// 誰が叩くか：`supabase/schema.sql` の push 節にある after insert トリガーが、
// `push_ping()` を通してここを叩きます。どの表にトリガーがあるかは
// `push.mjs` の `PUSH` が言い、tools/rls-check.mjs がその全部にあることを
// 数えます。
//
// **この函数は種類の名前を一つも知りません。**どの列を読み直すか、親の行が
// 要るか、一人宛てか全員宛てか ── 全部 `push.mjs` の `PUSH` に訊きます。
//
// **サインインしていない人には何も起こせません。**
// 「サインインなしで勧めるものないけど」 OWNER 2026-09-22 ── このアプリに、
// サインインなしで進むものは一つもありません。
//
// 扉は三枚あり、三枚とも要ります。
//
//   一枚目 ── Supabase の JWT 検証。この函数は `--no-verify-jwt` なしで置かれ、
//     トリガーは**行を入れた人の Authorization をそのまま持って行きます**
//     （`push_ping()`、supabase/schema.sql の push 節）。署名の無い呼び出しは、
//     この行が走る前に断られます。
//   二枚目 ── **その人がやったことか。**一枚目が言えるのは「サインインして
//     いる誰か」までで、サインインした他人が他人の行を指して他人の iPhone を
//     鳴らせます。だから下で**誰から来たかを確かめ**（service role の鍵その
//     ものか、そうでなければ `/auth/v1/user` に訊いた uid）、`push.mjs` の
//     `pushMay()` が行の actor と突き合わせます。お題の actor は service role
//     なので、全員を鳴らせるのはお題の行を書いた daily-prompt だけです。
//     publishable キーで叩かれた時もここで止まります ── あの鍵に user の sub
//     はありません。
//   三枚目 ── **その行で、まだ鳴っていないか。**二枚目が言えるのは「その人が
//     やったこと」までで、同じ行を何度指しても通りました。行に `rung_at` を
//     書くのは `push_once()`（supabase/schema.sql）一つで、一つの行で鳴るのは
//     一回です。tools/rls-check.mjs が、同じ行を二回叩いて二回目が何も鳴らさない
//     ことと、署名した人にはその印が書けないことを数えます。
//
// **それでも request の中身は一文字も信じません。**受け取るのは「どの表の、
// どの行か」だけ（`pushWhat()`）で、その行を service role で**読み直し**、文面は
// 全部データベースが答えたものから組みます。署名した人であることと、その人が
// 本当のことを言っていることは、別の話です。
//
// **ブロックの間では鳴りません、そしてそれはここで訊いていません。**
// 「通知も来ない（サーバーで止める）」 OWNER 2026-09-25。人に向かう四種類
// （follow reply like boost）はどれも、その行が入った時のトリガーです。ブロックの
// 間ではその行が書けない（schema.sql の follow_make・post_make・react_make が
// `block_hides()`・`post_blocks()` を訊く）ので、鳴らす行がそもそも来ません。
// ここでもう一度訊けば、一つの問いに二箇所が答えることになります。
//
// 判断は一つもここにありません ── 自分には送らない、スイッチが切れていれば
// 送らない、宛先が無ければ送らない、何と書くか、どの token を消すか、全部
// `push.mjs` です。そこが Node からそのまま読めて、tools/push-check.mjs が
// 検査します（verify-plan/verify.mjs と tools/verify-check.mjs と同じ形 ──
// **検査が試験対象を書き直したら、それは写しであって、写しは必ず一致します**）。
//
// 秘密は repo にありません。`SUPABASE_SERVICE_ROLE_KEY` は Supabase が函数に
// 持たせるもの、`APNS_KEY_ID`・`APNS_P8`・`APPLE_TEAM_ID` は Supabase の Secrets
// から来ます（.github/workflows/supabase-deploy.yml が入れる、docs/apple.md § 8）。
// **一つでも無ければ 500 で止まり、何も送りません。**送れないのと、間違った所へ
// 送るのとでは、間違ってよい側が決まっています。

import { pushWhat, pushRead, pushTo, pushMay, pushPlan, pushBy, pushGone, TOPIC } from './push.mjs';

const APNS = 'https://api.push.apple.com/3/device/';

function said(body: unknown, status = 200) {
  return new Response(JSON.stringify(body),
    { status, headers: { 'Content-Type': 'application/json' } });
}

/* Apple の .p8 は PKCS#8 の PEM。DER に戻して WebCrypto に渡します。 */
function derOf(pem: string): Uint8Array {
  const body = String(pem || '')
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
  const bin = atob(body);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const b64u = (u8: Uint8Array) =>
  btoa(String.fromCharCode.apply(null, Array.from(u8) as unknown as number[]))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/* APNs の鍵は JWT 一枚：ES256、header に kid、payload に iss と iat。
   有効なのは一時間までで、ここは呼び出しごとに一枚作ります ── 一回の呼び出し
   は一人の iPhone の台数ぶんか、一日一回のお題なので、貯める値打ちがありません。 */
async function apnsJwt(kid: string, team: string, p8: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'pkcs8', derOf(p8), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const enc = new TextEncoder();
  const head = b64u(enc.encode(JSON.stringify({ alg: 'ES256', kid: kid })));
  const body = b64u(enc.encode(JSON.stringify(
    { iss: team, iat: Math.floor(Date.now() / 1000) })));
  const sig = new Uint8Array(await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(head + '.' + body)));
  return head + '.' + body + '.' + b64u(sig);
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return said({ why: 'POST' }, 405);

  const url = Deno.env.get('SUPABASE_URL') || '';
  const svc = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const kid = Deno.env.get('APNS_KEY_ID') || '';
  const team = Deno.env.get('APPLE_TEAM_ID') || '';
  const p8 = Deno.env.get('APNS_P8') || '';
  /* 名前を挙げて返します ── 実機で「来ない」と言われた時に、どれが入っていない
     のかを分けられるのはここだけです。値は返しません。 */
  const missing = [['SUPABASE_URL', url], ['SUPABASE_SERVICE_ROLE_KEY', svc],
                   ['SUPABASE_ANON_KEY', Deno.env.get('SUPABASE_ANON_KEY') || ''],
                   ['APNS_KEY_ID', kid], ['APPLE_TEAM_ID', team], ['APNS_P8', p8]]
    .filter(([, v]) => !v).map(([n]) => n);
  if (missing.length) return said({ why: 'not set: ' + missing.join(', ') }, 500);

  /* 誰から。名乗りではなく、Supabase 自身に聞きます ── verify-plan と同じ一行で、
     同じ理由です。この函数は service role を持っているので、uid を body から
     取ったら誰でも誰の iPhone でも鳴らせます。

     先に**service role の鍵そのものか**を見ます（`pushBy()`）。お題の行を
     入れるのは daily-prompt で、トリガーはその Authorization を持って来るので、
     全員宛てを鳴らせるのはこの鍵を持っている者だけです。そうでなければ
     `/auth/v1/user` に訊き、返ってきた uid が `by`。

     `SUPABASE_ANON_KEY` が無ければ訊けないので、その時も 401 ── 訊けないことを
     「誰でもよい」と読まないためです。 */
  const anon = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const auth = req.headers.get('Authorization') || '';
  if (!anon || !/^Bearer .+/.test(auth)) return said({ why: 'no session' }, 401);
  let by = pushBy(auth, svc);
  if (!by) {
    const who = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: auth } });
    if (!who.ok) return said({ why: 'no session' }, 401);
    by = String(((await who.json()) || {}).id || '');
  }
  if (!by) return said({ why: 'no session' }, 401);

  let raw: unknown;
  try { raw = await req.json(); } catch { raw = null; }
  const ev = pushWhat(raw);
  /* `PUSH` が知っている表の、鍵の読める行でなければ、ここで終わりです。 */
  if (!ev) return said({ why: 'not an event' }, 400);

  const head = { apikey: svc, Authorization: `Bearer ${svc}`, 'Content-Type': 'application/json' };
  const eq = (v: string) => 'eq.' + encodeURIComponent(v);
  async function rows(q: string): Promise<Record<string, unknown>[]> {
    const r = await fetch(`${url}/rest/v1/${q}`, { headers: head });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j) ? j : [];
  }
  async function one(q: string): Promise<Record<string, unknown> | null> {
    const l = await rows(q + '&limit=1');
    return l.length ? l[0] : null;
  }

  /* ---- その行を、データベースから ------------------------------------
     主キーで読み直します。**無ければ何もしません** ── 取り消されたいいねや
     消された投稿について、起きなかったことを知らせる道はありません。

     読む列と親の列は `PUSH` の行が言います。親が要る種類で親が読めなければ、
     それも「無い」です（返信でない投稿は `reply_to` が空で、親は読めません
     ── トリガーは `reply_to is not null` の行だけを通しますが、それは**送る
     側の都合**で、ここは自分で確かめます。一つのことを二箇所で信じないため）。 */
  const k = ev.key as Record<string, string>;
  const how = pushRead(ev.table, k) as { cols: string; parent: string | null; all: boolean } | null;
  if (!how) return said({ why: 'not an event' }, 400);
  let q = `${ev.table}?select=${how.cols}`;
  for (const f of Object.keys(k)) q += `&${f}=${eq(k[f])}`;
  let row = await one(q);
  let parent: Record<string, unknown> | null = null;
  if (row && how.parent) {
    const pid = typeof row[how.parent] === 'string' ? row[how.parent] as string : '';
    if (pid) parent = await one(`post?select=id,author&id=${eq(pid)}`);
    if (!parent) row = null;
  }
  if (!row) return said({ sent: 0, why: 'no such row' });

  const aim = pushTo(ev.table, row, parent) as
    { kind: string; to: string | null; from: string; post: string | null } | null;
  if (!aim || !aim.from) return said({ sent: 0, why: 'no such event' });
  /* 鳴らしてよいか。`pushPlan()` が一人ずつ訊くのと同じ函数を、全員を読みに
     行く**前に**一度 ── サインインした誰かがお題の行を指して叩いても、device
     の表を一枚も読まずにここで終わります。 */
  const may = pushMay(aim, by);
  if (may) return said({ sent: 0, why: may });

  /* **一つの行で鳴るのは一回。**ここまでで言えるのは「その人がやったこと」
     までで、同じ行を指して何度叩いても毎回ここを通っていました ── B が自分の
     フォローの行で A の iPhone を何度でも鳴らせた（r63-audit SQ2）。
     `push_once()`（supabase/schema.sql）がその行に `rung_at` を書き、書いたのが
     この呼び出しかどうかを答えます。**`pushMay()` の後**なのは、その人でない
     叩きがその行の一回を使ってしまわないためです。読めなかったのは「もう
     鳴った」ではないので、枝を分けます（CLAUDE.md 一枚目）。 */
  const once = await fetch(`${url}/rest/v1/rpc/push_once`, {
    method: 'POST', headers: head, body: JSON.stringify({ tbl: ev.table, k }),
  });
  if (!once.ok) return said({ sent: 0, why: 'could not mark: ' + (await once.text()) }, 500);
  if ((await once.json()) !== true) return said({ sent: 0, why: 'already rung' });

  /* ---- 相手 ------------------------------------------------------------
     一人宛てなら、相手からは設定を、やった人からは @ を。**二人を一度に
     読みません** ── `id=in.(a,b)` は行の順を約束しないので、どちらの設定かを
     取り違えます。

     全員宛てなら、iPhone を登録している全員を device から読み、その人の
     設定を profile から一緒に持って来ます（device.uid → profile.id）。相手が
     一人でも千人でも、決めるのは下の同じ `pushPlan()` を一人ずつ ── スイッチも
     言語も、フォローの通知と同じ一行が答えます。 */
  type One = { uid: string; prefs: unknown; tokens: string[] };
  const them: One[] = [];
  let fill: Record<string, unknown> = {};
  if (!how.all) {
    if (!aim.to) return said({ sent: 0, why: 'no such event' });
    const you = await one(`profile?select=prefs&id=${eq(aim.to)}`);
    const doer = await one(`profile?select=handle&id=${eq(aim.from)}`);
    if (!you || !doer) return said({ sent: 0, why: 'no such account' });
    const devs = await rows(`device?select=token&uid=${eq(aim.to)}`);
    them.push({ uid: aim.to, prefs: you.prefs,
                tokens: devs.map((d) => String(d.token || '')) });
    fill = { handle: doer.handle };
  } else {
    fill = { says: row.says, text: row.text };
    const by_uid: Record<string, One> = {};
    /* 千行ずつ。PostgREST は一度に返す数に上限を持つので、読み切るまで。 */
    for (let from = 0; ; from += 1000) {
      const page = await rows(`device?select=uid,token,profile(prefs)` +
                              `&order=uid,token&limit=1000&offset=${from}`);
      for (const d of page) {
        const uid = String(d.uid || '');
        if (!uid) continue;
        const p = (d.profile && typeof d.profile === 'object') ?
          (d.profile as Record<string, unknown>).prefs : null;
        if (!by_uid[uid]) { by_uid[uid] = { uid, prefs: p, tokens: [] }; them.push(by_uid[uid]); }
        by_uid[uid].tokens.push(String(d.token || ''));
      }
      if (page.length < 1000) break;
    }
  }

  const sends: { uid: string; to: string[]; payload: unknown }[] = [];
  let why = '';
  for (const t of them) {
    /* `push.mjs` は素の JavaScript なので、ここで形を言います ── 送らないと
       決めた答えには `to` も `payload` もありません。三つ全部を見てから先へ
       進むのは、型を黙らせるためではなく、**片方だけ在る答えは無い**と言って
       おくためです。 */
    const plan = pushPlan({ ...aim, to: t.uid }, { ...fill, prefs: t.prefs }, t.tokens, by) as
      { send: boolean; why?: string; to?: string[]; payload?: unknown };
    if (!plan.send || !plan.to || !plan.payload) { why = plan.why || why; continue; }
    sends.push({ uid: t.uid, to: plan.to, payload: plan.payload });
  }
  if (!sends.length) return said({ sent: 0, why: why || 'no device' });

  /* ---- そして Apple へ ------------------------------------------------- */
  let jwt: string;
  try { jwt = await apnsJwt(kid, team, p8); }
  catch (e) { return said({ why: 'APNS_P8 will not read: ' + (e as Error).message }, 500); }

  const sent: { uid: string; token: string; status: number }[] = [];
  for (const one_ of sends) {
    const body = JSON.stringify(one_.payload);
    for (const token of one_.to) {
      let status = 0;
      try {
        const r = await fetch(APNS + token, {
          method: 'POST',
          headers: {
            authorization: 'bearer ' + jwt,
            'apns-topic': TOPIC,
            'apns-push-type': 'alert',
            'apns-priority': '10',
            'Content-Type': 'application/json',
          },
          body: body,
        });
        status = r.status;
        await r.text();
      } catch (e) {
        /* 届かなかった。**token は消しません** ── 「読めなかった」と「無い」は
           枝を分けない（CLAUDE.md 一枚目）。 */
        status = 0;
      }
      sent.push({ uid: one_.uid, token: token, status: status });
    }
  }

  /* Apple が 410 Unregistered と答えた token だけ落とします。その token を
     持っていた**その人の行だけ**で、同じ iPhone の別のアカウントの行には
     触りません。DELETE REVIEW は docs/CHANGELOG.md 2026-09-22。 */
  const gone = pushGone(sent);
  for (const s of sent) {
    if (gone.indexOf(s.token) === -1) continue;
    await fetch(`${url}/rest/v1/device?uid=${eq(s.uid)}&token=${eq(s.token)}`,
                { method: 'DELETE', headers: head });
  }

  /* 数えたもので、説明ではありません ── 実機で「来ない」と言われた時に、
     送ったのか、送らなかったのか、Apple が断ったのかを分けられるのはここだけ。 */
  return said({
    kind: aim.kind,
    sent: sent.filter((s) => s.status === 200).length,
    tried: sent.length,
    dropped: gone.length,
    left: sent.filter((s) => s.status !== 200).map((s) => s.status),
  });
});
