// push-send — フォロー・返信・いいね・リポストを、アプリを閉じている iPhone へ。
//
// OWNER 2026-09-22「通知作ろう。アップルのネイティブ通知で、フォローされた時、
// 返信きた時みたいな感じでSNS部分であるやつ。それに加えて設定で個別通知のオンオフ
// できるように。」
//
// 誰が叩くか：`supabase/schema.sql` の末尾にある三つの after insert トリガーが、
// Supabase の Database Webhook と同じ道（`supabase_functions.http_request`）で
// ここを叩きます。
//
// **この函数は request の中身を一文字も信じません。**受け取るのは「どの表の、
// どの行か」だけ（`pushWhat()`）で、その行を service role で**読み直し**、文面は
// 全部データベースが答えたものから組みます。理由は口の形です：トリガーは秘密を
// 持って行けない（schema に秘密は置かない）ので、この函数は JWT の検証なしで
// 置くしかなく、**誰でも叩けます**。届いた JSON から一文字でも文面に流れれば、
// 知らない人が他人の iPhone に好きな文を出せるということになります。
//
// 知らない人に出来ることは、**本当に起きたことの通知をもう一度鳴らす**ことだけ
// です。それが困るかどうかはオーナーの決めごとで、
// docs/scope/r47-push-server.md § オーナーへ に選択肢が二つ書いてあります。
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

import { pushWhat, pushTo, pushPlan, pushGone, TOPIC } from './push.mjs';

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
   有効なのは一時間までで、ここは呼び出しごとに一枚作ります ── 一回の呼び出しで
   送るのは一人の iPhone の台数ぶんだけなので、貯める値打ちがありません。 */
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
                   ['APNS_KEY_ID', kid], ['APPLE_TEAM_ID', team], ['APNS_P8', p8]]
    .filter(([, v]) => !v).map(([n]) => n);
  if (missing.length) return said({ why: 'not set: ' + missing.join(', ') }, 500);

  let raw: unknown;
  try { raw = await req.json(); } catch { raw = null; }
  const ev = pushWhat(raw);
  /* 知っている三つの表の、鍵の読める行でなければ、ここで終わりです。 */
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
     消された投稿について、起きなかったことを知らせる道はありません。 */
  const k = ev.key as Record<string, string>;
  let row: Record<string, unknown> | null = null;
  let parent: Record<string, unknown> | null = null;
  if (ev.table === 'follow') {
    row = await one(`follow?select=follower,followed&follower=${eq(k.follower)}` +
                    `&followed=${eq(k.followed)}`);
  } else if (ev.table === 'post') {
    row = await one(`post?select=id,author,reply_to&id=${eq(k.id)}`);
    /* 返信でない投稿は誰への知らせでもありません（トリガーは `reply_to is not
       null` の行だけを通しますが、それは**送る側の都合**で、ここは自分で
       確かめます ── 一つのことを二箇所で信じないため）。 */
    const to = row && typeof row.reply_to === 'string' ? row.reply_to : '';
    if (to) parent = await one(`post?select=id,author&id=${eq(to)}`);
    if (!parent) row = null;
  } else if (ev.table === 'react') {
    row = await one(`react?select=post,actor,kind&post=${eq(k.post)}` +
                    `&actor=${eq(k.actor)}&kind=${eq(k.kind)}`);
    if (row) parent = await one(`post?select=id,author&id=${eq(k.post)}`);
    if (!parent) row = null;
  }
  if (!row) return said({ sent: 0, why: 'no such row' });

  const aim = pushTo(ev.table, row, parent);
  if (!aim || !aim.to || !aim.from) return said({ sent: 0, why: 'no such event' });

  /* ---- 相手と、やった人 ------------------------------------------------
     相手からは設定を、やった人からは @ を。**二人を一度に読みません** ──
     `id=in.(a,b)` は行の順を約束しないので、どちらの設定かを取り違えます。 */
  const you = await one(`profile?select=prefs&id=${eq(aim.to)}`);
  const them = await one(`profile?select=handle&id=${eq(aim.from)}`);
  if (!you || !them) return said({ sent: 0, why: 'no such account' });

  const devs = await rows(`device?select=token&uid=${eq(aim.to)}`);
  /* `push.mjs` は素の JavaScript なので、ここで形を言います ── 送らないと
     決めた答えには `to` も `payload` もありません。三つ全部を見てから先へ
     進むのは、型を黙らせるためではなく、**片方だけ在る答えは無い**と言って
     おくためです。 */
  const plan = pushPlan(aim, { handle: them.handle, prefs: you.prefs }, devs) as
    { send: boolean; why?: string; to?: string[]; payload?: unknown };
  if (!plan.send || !plan.to || !plan.payload) return said({ sent: 0, why: plan.why });

  /* ---- そして Apple へ ------------------------------------------------- */
  let jwt: string;
  try { jwt = await apnsJwt(kid, team, p8); }
  catch (e) { return said({ why: 'APNS_P8 will not read: ' + (e as Error).message }, 500); }

  const body = JSON.stringify(plan.payload);
  const sent: { token: string; status: number }[] = [];
  for (const token of plan.to) {
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
    sent.push({ token: token, status: status });
  }

  /* Apple が 410 Unregistered と答えた token だけ落とします。
     DELETE REVIEW は docs/CHANGELOG.md 2026-09-22。 */
  const gone = pushGone(sent);
  for (const token of gone) {
    await fetch(`${url}/rest/v1/device?uid=${eq(aim.to)}&token=${eq(token)}`,
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
