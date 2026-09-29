/* ---------------------------------------------------------------------------
   tools/push-check.mjs — 誰に何を送るかの判断を、一つずつ。

   実行:  npm run push          (browser は要りません。一瞬です)

   なぜ要るか。通知は**何も投げない種類の仕事**です。相手を取り違えても、
   スイッチを裏返しに読んでも、文面が空でも、Apple は 200 を返し、画面は正しく、
   npm test は緑です。壊れていることが分かるのは、**切ったはずの通知が鳴った日**
   か、**許可したのに一通も来ない日**で、どちらも人が気づくまで誰も知りません。

   だから supabase/functions/push-send は二枚に分かれています ── `index.ts` は
   表を読んで Apple に送るだけ、判断は全部 `push.mjs`。そしてここは**その一枚を
   そのまま import します**。検査が自分で判断を書き直したら、それは写しであって、
   写しは必ず一致します（CLAUDE.md § 10, § 12、verify-check と同じ理由）。

   ここが押さえるもの：
     - 自分がやったことは自分に送らない
     - スイッチが false なら送らない
     - **スイッチが無いのはオン**（前から居る人に一通も届かない、の側）
     - device の行が無ければ送らない
     - 410 だけで token が落ち、他のどの答えでも落ちない
     - **request の文字が payload に一文字も混ざらない**
     - 種類 × 十言語の文が全部あり、どれも {0} を持っている
     - お題は全員宛てで、鳴らせるのは入口が確かめた JWT の role が service_role の時だけ
     - **種類は `PUSH` が一箇所**で、www/ の二つの手書き（`PUSH_KINDS` と
       `SET_PREFS`）と i18n の `push.<種類>` がそれと揃っていること
   --------------------------------------------------------------------------- */
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';
import { pushWhat, pushTo, pushPlan, pushMay, pushBy, pushTok, pushSay, pushWants, pushLang,
         pushGone, pushRead, pushFcm, pushFcmWhy, pushFcmSa, pushFcmClaim,
         PUSH, KINDS, SERVICE, LANGS, SAY, TITLE, TOPIC, CHANNEL, ROADS, FCM_SCOPE } from
  '../supabase/functions/push-send/push.mjs';
const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');

let bad = 0, said = 0;
function say(name, got, want) {
  said++;
  const ok = String(got) === String(want);
  if (!ok) { bad++; console.log('  ✗ ' + name + '\n      got ' + got + '\n      want ' + want); }
  else console.log('  ✓ ' + name);
}

/* 送らないと決めた plan には `payload` も `to` もありません。**バグを入れた
   ときこそ**そうなるので、そこを直に触ると検査が例外で死に、**その先の claim が
   一つも走らないまま赤が一つだけ出ます** ── tools/gate.mjs が `&&` の連鎖に
   ついて書いているのと同じことで、実際にこの検査を書いた日に起きました。だから
   plan には必ずこの三つを通して触ります。 */
const pay = (p) => (p && p.payload) ? p.payload : { aps: { alert: {} } };
const line = (p) => (pay(p).aps.alert.body === undefined) ? '(何も送らない)'
                                                         : pay(p).aps.alert.body;
const many = (p) => (p && p.to) ? p.to.length : -1;

const A = 'a0000000-0000-4000-8000-000000000001';   /* 書いた人 */
const B = 'b0000000-0000-4000-8000-000000000002';   /* やった人 */
const C = 'c0000000-0000-4000-8000-000000000003';   /* サインインした他人 */
const P = 'd0000000-0000-4000-8000-000000000004';   /* その投稿 */
const Q = 'd0000000-0000-4000-8000-000000000009';   /* その返信 */
const TOK = 'a1'.repeat(32);
const TOK2 = 'b2'.repeat(32);
const DEV = [{ token: TOK, platform: 'ios' }];
/* Android の住所は Google が出したもの。16 進ではない。 */
const FCM = 'dQw4w9WgXcQ:APA91bH_' + 'Qz-9'.repeat(35);
const FCM2 = 'eXa_mple:APA91bG-' + 'Rt8_'.repeat(35);
const fcms = (p) => (p && p.fcm) ? p.fcm.length : -1;
const WHO = { handle: 'iri', prefs: { ui: 'ja' } };

/* ---- 何が起きたか、を request から取り出す ---------------------------- */
console.log('push: request から取り出すのは「どの表の、どの行か」だけ');

const hook = (table, record) => ({ type: 'INSERT', schema: 'public', table, record });

say('follow は二つの uid',
    JSON.stringify(pushWhat(hook('follow', { follower: B, followed: A, created_at: 'x' }))),
    JSON.stringify({ table: 'follow', key: { follower: B, followed: A } }));
say('返信は id と何への返信か',
    JSON.stringify(pushWhat(hook('post', { id: Q, author: B, reply_to: P, quote_of: null, body: { line: 'ほげ' } }))),
    JSON.stringify({ table: 'post', key: { id: Q, reply_to: P } }));
say('引用は id と何の引用か ── 返信と取り違えない',
    JSON.stringify(pushWhat(hook('post', { id: Q, author: B, reply_to: null, quote_of: P }))),
    JSON.stringify({ table: 'post', key: { id: Q, quote_of: P } }));
say('どちらでもない投稿は何でもない',
    pushWhat(hook('post', { id: Q, author: B, reply_to: null, quote_of: null })), 'null');
say('react は投稿と人と種類',
    JSON.stringify(pushWhat(hook('react', { post: P, actor: B, kind: 'boost' }))),
    JSON.stringify({ table: 'react', key: { post: P, actor: B, kind: 'boost' } }));
say('知らない表は捨てる', pushWhat(hook('profile', { id: A })), 'null');
say('uuid でない鍵は捨てる', pushWhat(hook('post', { id: '../../etc', reply_to: P })), 'null');
say('react の知らない kind は捨てる',
    pushWhat(hook('react', { post: P, actor: B, kind: 'hug' })), 'null');
say('body が無ければ捨てる', pushWhat(null), 'null');
say('record が無ければ捨てる', pushWhat({ table: 'follow' }), 'null');

/* ---- そして、request の文字は一文字も外に出ない --------------------- */
console.log('push: request が持ってきた文字は payload に混ざらない');
{
  /* 知らない人がこの口を叩ける前提で、届く JSON の全部に印を付けます。 */
  const EVIL = 'ZZEVILZZ';
  const dirty = {
    type: EVIL, schema: EVIL, table: 'follow',
    record: { follower: B, followed: A, created_at: EVIL,
              handle: EVIL, display: EVIL, body: EVIL, title: EVIL, aps: EVIL },
    old_record: { anything: EVIL },
  };
  const ev = pushWhat(dirty);
  say('取り出したものに request の文字は無い',
      JSON.stringify(ev).indexOf(EVIL), '-1');
  /* そして、**行はデータベースから**。ここで渡すのが「読み直した行」です。 */
  const aim = pushTo(ev.table, { follower: B, followed: A }, null);
  const plan = pushPlan(aim, WHO, DEV, B);
  say('組み上がった payload にも無い',
      JSON.stringify(pay(plan)).indexOf(EVIL), '-1');
  say('それでも本物の通知にはなっている', plan.send, 'true');
  say('文面は DB の @ から', line(plan), '@iri がフォロー');
}

/* ---- 誰への知らせか -------------------------------------------------- */
console.log('push: 相手は行が言う人で、返信といいねは親の行にしかいない');

const fol = pushTo('follow', { follower: B, followed: A }, null) || {};
say('follow の相手はフォローされた人', fol.to + ' ' + fol.from + ' ' + fol.kind,
    A + ' ' + B + ' follow');
say('follow に開く先は無い', fol.post, 'null');

const rep = pushTo('post', { id: Q, author: B, reply_to: P }, { id: P, author: A }) || {};
say('返信の相手は返された投稿を書いた人', rep.to + ' ' + rep.from + ' ' + rep.kind,
    A + ' ' + B + ' reply');
say('返信の開く先はその返信', rep.post, Q);
say('親の行が無ければ何も起きない', pushTo('post', { id: Q, author: B, reply_to: P }, null), 'null');

const quo = pushTo('post', { id: Q, author: B, quote_of: P }, { id: P, author: A }) || {};
say('引用の相手は引用された投稿を書いた人', quo.to + ' ' + quo.from + ' ' + quo.kind,
    A + ' ' + B + ' quote');
say('引用の開く先はその引用', quo.post, Q);
say('引用の文面', line(pushPlan(quo, WHO, DEV, B)), '@iri が引用');

const lik = pushTo('react', { post: P, actor: B, kind: 'like' }, { id: P, author: A }) || {};
say('いいねの相手は投稿を書いた人', lik.to + ' ' + lik.from + ' ' + lik.kind,
    A + ' ' + B + ' like');
say('いいねの開く先はその投稿', lik.post, P);
const boo = pushTo('react', { post: P, actor: B, kind: 'boost' }, { id: P, author: A }) || {};
say('リポストは boost', boo.kind, 'boost');
say('react の親が無ければ何も起きない',
    pushTo('react', { post: P, actor: B, kind: 'like' }, null), 'null');

/* ---- 自分がやったことは自分に送らない -------------------------------- */
console.log('push: 自分には送らない');
{
  /* 自分の投稿に自分でいいね。notices() が `r.actor <> auth.uid()` と書いて
     いるのと同じ一行で、こちらだけ抜けていると自分の操作で自分が鳴ります。 */
  const mine = pushTo('react', { post: P, actor: A, kind: 'like' }, { id: P, author: A }) || {};
  const plan = pushPlan(mine, { handle: 'aya', prefs: {} }, DEV, A);
  say('自分の投稿への自分のいいねは送らない', plan.send, 'false');
  say('理由は「自分の」', plan.why, 'their own');
  /* follow は表の check 制約が自分自身を禁じていますが、判断はここにもあります
     ── 制約はデータの形の話で、これは誰に送るかの話です。 */
  const self = pushTo('follow', { follower: A, followed: A }, null) || {};
  say('自分で自分をフォローしても送らない',
      pushPlan(self, { handle: 'aya', prefs: {} }, DEV, A).send, 'false');
}

/* ---- スイッチ -------------------------------------------------------- */
console.log('push: スイッチ ── 無いのはオン、false だけが切れている');

for (const k of KINDS) {
  say('無い ' + k + ' はオン', pushWants({}, k), 'true');
  say('false の ' + k + ' は切れている', pushWants({ ['push_' + k]: false }, k), 'false');
  say('true の ' + k + ' はオン', pushWants({ ['push_' + k]: true }, k), 'true');
}
/* **前から居る人の prefs にはこの四つがありません。**無いのを「切ってある」と
   読むと、許可を出した人に一通も届かず、そのことは誰の画面にも出ません。 */
say('2026-09-08 からある prefs（テーマと言語だけ）は全部オン',
    KINDS.filter((k) => pushWants({ theme: 'dark', ui: 'ja' }, k)).length, String(KINDS.length));
say('prefs が丸ごと無い人も全部オン',
    KINDS.filter((k) => pushWants(null, k)).length, String(KINDS.length));
/* そして**切れているのはその一つだけ**。一つ切ったら全部止まった、はこの逆側。 */
say('like を切っても他は生きている',
    KINDS.filter((k) => pushWants({ push_like: false }, k)).join(','),
    KINDS.filter((k) => k !== 'like').join(','));
{
  const off = pushPlan(lik, { handle: 'iri', prefs: { push_like: false } }, DEV, B);
  say('切れていれば送らない', off.send, 'false');
  say('理由は「切ってある」', off.why, 'switched off');
  const on = pushPlan(lik, { handle: 'iri', prefs: { push_boost: false } }, DEV, B);
  say('別の種類を切ってもいいねは届く', on.send, 'true');
}

/* ---- ミュートした人からは届かない ------------------------------------
   「ミュートした人の物は届かない」 ── notices() が `not mute_hides(ev.actor)`
   で一覧から外すのと同じ答えを、iPhone の通知にも。種類ごとではなく送る道の
   一か所（pushPlan）で、やった人（actor）がいる種類は全部。 */
console.log('push: ミュートした人からの通知は鳴らない');
for (const [nm, aim] of [['フォロー', fol], ['返信', rep], ['引用', quo], ['いいね', lik], ['リポスト', boo]]) {
  const m = pushPlan(aim, { ...WHO, muted: true }, DEV, B);
  say(nm + ': ミュートした人からは送らない', m.send + ' ' + m.why, 'false muted');
  say(nm + ': ミュートしていない人からは送る', pushPlan(aim, { ...WHO, muted: false }, DEV, B).send, 'true');
}
/* 道を問わない ── Android の行にも同じ一行が効く。 */
{
  const droid = [{ token: FCM, platform: 'android' }];
  const m = pushPlan(lik, { ...WHO, muted: true }, droid, B);
  say('Android の行でも、ミュートした人からは送らない',
      m.send + ' ' + m.why + ' ' + (m.fcm || []).length, 'false muted 0');
  say('Android の行でも、ミュートしていない人からは送る',
      pushPlan(lik, { ...WHO, muted: false }, droid, B).fcm.length, '1');
}
/* そして index.ts が、その一人について mute の行を読んで渡していること ──
   push.mjs は DB を読めないので、読まなければ上の一行は空回りする。 */
{
  const ix = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)),
                            '..', 'supabase', 'functions', 'push-send', 'index.ts'), 'utf8');
  say('index.ts は受け取る人が送り手をミュートしているかを mute から読む',
      /mute\?select=[^`]*actor=\$\{eq\(aim\.to\)\}[^`]*muted=\$\{eq\(aim\.from\)\}/.test(ix) &&
      /muted:/.test(ix), true);
}

/* ---- 宛先 ------------------------------------------------------------- */
console.log('push: device の行が無ければ何もしない');
say('行が一つも無ければ送らない', pushPlan(lik, WHO, [], B).send, 'false');
say('理由は「宛先が無い」', pushPlan(lik, WHO, [], B).why, 'no device');
say('送らないと決めた答えに payload は無い', pushPlan(lik, WHO, [], B).payload, 'undefined');
say('undefined でも落ちない', pushPlan(lik, WHO, undefined, B).send, 'false');
say('二台持っていれば二台とも',
    many(pushPlan(lik, WHO, [{ token: TOK, platform: 'ios' }, { token: TOK2, platform: 'ios' }], B)), '2');
say('空の token は数えない',
    many(pushPlan(lik, WHO, [{ token: '', platform: 'ios' }, { token: TOK, platform: 'ios' }], B)), '1');

/* ---- どの道か ──  device.platform ------------------------------------ */
console.log('push: iPhone は Apple へ、Android は Google へ（device.platform）');
say('道は二つ', ROADS.join(','), 'ios,android');
{
  const both = pushPlan(lik, WHO, [{ token: TOK, platform: 'ios' }, { token: FCM, platform: 'android' },
                                   { token: FCM2, platform: 'android' }], B);
  say('iPhone と Android を持つ人には両方へ', both.send, 'true');
  say('iPhone の行は Apple の宛先に', (both.to || []).join(','), TOK);
  say('Android の行は Google の宛先に', (both.fcm || []).join(','), FCM + ',' + FCM2);
  const droid = pushPlan(lik, WHO, [{ token: FCM, platform: 'android' }], B);
  say('Android だけの人にも送る', droid.send, 'true');
  say('Android だけなら Apple には一台も', many(droid), '0');
  say('iPhone だけなら Google には一台も', fcms(pushPlan(lik, WHO, DEV, B)), '0');
  /* 列は not null で既定が ios。データベースから来る行には必ずどちらかが
     あり、ここで「無いのは ios」と読めば既定が二箇所になる。 */
  say('道を言わない行には送らない', pushPlan(lik, WHO, [{ token: TOK }], B).why, 'no device');
  say('知らない道の行には送らない',
      pushPlan(lik, WHO, [{ token: TOK, platform: 'web' }], B).why, 'no device');
  say('素の文字列は行ではない', pushPlan(lik, WHO, [TOK], B).why, 'no device');
  say('送らない答えに Google の宛先も無い', pushPlan(lik, WHO, [], B).fcm, 'undefined');
  say('スイッチを切れば Android にも送らない',
      pushPlan(lik, { handle: 'iri', prefs: { push_like: false } },
               [{ token: FCM, platform: 'android' }], B).why, 'switched off');
  say('自分がやったことは Android にも送らない',
      pushPlan({ kind: 'like', to: B, from: B, post: P }, WHO,
               [{ token: FCM, platform: 'android' }], B).why, 'their own');
}

/* ---- payload ---------------------------------------------------------- */
console.log('push: Apple に渡す形');
{
  const plan = pushPlan(rep, { handle: 'iri', prefs: { ui: 'en' } }, DEV, B);
  say('alert は title と body', Object.keys(pay(plan).aps.alert).join(','), 'title,body');
  say('title は Lingua（訳さない）', pay(plan).aps.alert.title, TITLE);
  say('body は相手の言語で', line(plan), '@iri replied');
  say('音は既定', pay(plan).aps.sound, 'default');
  say('種類が載っている', pay(plan).kind, 'reply');
  say('開く先が載っている', pay(plan).post, Q);
  /* **無い物は載せない。**空文字の `post` は「開く先が無い」ではなく、
     「どこにも無い所を開け」です。 */
  const f = pushPlan(fol, WHO, DEV, B);
  say('follow には開く先の欄そのものが無い',
      Object.prototype.hasOwnProperty.call(pay(f), 'post'), 'false');
}

/* ---- Android に渡す形 ── Apple に渡す形の写し ------------------------ */
console.log('push: Google に渡す形は、Apple に渡す形から写すだけ');
{
  const plan = pushPlan(rep, { handle: 'iri', prefs: { ui: 'ja' } },
                        [{ token: FCM, platform: 'android' }], B);
  const m = pushFcm(plan.payload, FCM).message;
  say('宛先はその token', m.token, FCM);
  say('title は Apple と同じ', m.notification.title, pay(plan).aps.alert.title);
  say('body は Apple と同じ（相手の言語）', m.notification.body, line(plan));
  say('押した時に渡るのは種類と開く先', Object.keys(m.data).join(','), 'kind,post');
  say('種類', m.data.kind, 'reply');
  say('開く先', m.data.post, Q);
  say('data はどれも文字列（FCM の決まり）',
      Object.values(m.data).every((v) => typeof v === 'string'), 'true');
  say('チャンネルは Android 側と同じ名前', m.android.notification.channel_id, CHANNEL);
  say('すぐ届く', m.android.priority, 'HIGH');
  const f = pushFcm(pushPlan(fol, WHO, [{ token: FCM, platform: 'android' }], B).payload, FCM).message;
  say('follow には開く先の欄そのものが無い',
      Object.prototype.hasOwnProperty.call(f.data, 'post'), 'false');
  /* request に何を書いて寄越しても、Google への文は DB の行から。 */
  const evil = pushWhat(hook('follow', { follower: B, followed: A, handle: 'EVIL', body: 'EVIL' }));
  say('request の文字は Google への文にも混ざらない',
      JSON.stringify(pushFcm(pushPlan(pushTo('follow', evil.key, null), WHO,
                                      [{ token: FCM, platform: 'android' }], B).payload, FCM))
        .indexOf('EVIL'), '-1');
}
console.log('push: Google が断った理由と、鍵');
{
  const un = { error: { code: 404, status: 'NOT_FOUND', details: [
    { '@type': 'type.googleapis.com/google.firebase.fcm.v1.FcmError', errorCode: 'UNREGISTERED' }] } };
  say('UNREGISTERED は details の errorCode から', pushFcmWhy(un), 'UNREGISTERED');
  say('errorCode が無ければ status', pushFcmWhy({ error: { status: 'INVALID_ARGUMENT' } }),
      'INVALID_ARGUMENT');
  say('読めなければ空', pushFcmWhy('nonsense'), '');
  say('無ければ空', pushFcmWhy(null), '');
  const SA = JSON.stringify({ type: 'service_account', project_id: 'lingua-1', client_email: 'x@y.iam',
                              private_key: '-----BEGIN PRIVATE KEY-----\nAA\n-----END PRIVATE KEY-----\n',
                              token_uri: 'https://oauth2.googleapis.com/token' });
  const sa = pushFcmSa(SA);
  say('鍵の JSON から四つ', sa && [sa.project, sa.email, sa.tokenUri].join(' '),
      'lingua-1 x@y.iam https://oauth2.googleapis.com/token');
  say('鍵が無ければ null', pushFcmSa(''), 'null');
  say('JSON でなければ null', pushFcmSa('{not json'), 'null');
  say('秘密鍵が無ければ null', pushFcmSa(JSON.stringify({ project_id: 'p', client_email: 'e' })), 'null');
  const c = pushFcmClaim(sa, 1700000000000);
  say('JWT は scope と aud と一時間', [c.iss, c.scope, c.aud, c.exp - c.iat].join(' '),
      'x@y.iam ' + FCM_SCOPE + ' https://oauth2.googleapis.com/token 3600');
}

/* ---- 言語 ------------------------------------------------------------- */
console.log('push: 文面は相手の表示言語で、種類 × 十言語');
say('十言語ある', LANGS.length, '10');
say('言語の数だけ表がある', Object.keys(SAY).length, String(LANGS.length));
{
  let holes = [];
  for (const l of LANGS) {
    for (const k of KINDS) {
      const s = SAY[l] && SAY[l][k];
      if (typeof s !== 'string' || !s.trim() || s.indexOf('{0}') === -1) holes.push(l + '.' + k);
    }
  }
  /* 全部在って、全部 {0} を持っている。持っていない一つは「誰が」や「何が」の
     消えた通知で、鳴っても何のことか分かりません。 */
  say('種類 × 十言語の文が全部あり、全部 {0} を持っている', holes.join(' ') || 'none', 'none');
  const seen = {};
  let same = [];
  for (const l of LANGS) {
    const key = KINDS.map((k) => SAY[l][k]).join('|');
    if (seen[key]) same.push(seen[key] + '=' + l); else seen[key] = l;
  }
  /* 十言語のうち二つが一字一句同じなら、片方は訳されずに en のまま残った物です。 */
  say('同じ文の組を持つ言語は二つと無い', same.join(' ') || 'none', 'none');
}
say('知らない言語は en', pushLang({ ui: 'sv' }), 'en');
say('何も言っていない人は en', pushLang({}), 'en');
say('prefs が無い人も en', pushLang(null), 'en');
say('ja と言っている人は ja', pushLang({ ui: 'ja' }), 'ja');
for (const l of LANGS) {
  say(l + ' の follow は ' + l + ' の文',
      (pushSay({ ui: l }, 'follow', 'iri') || {}).body, SAY[l].follow.replace('{0}', '@iri'));
}
say('知らない種類には文が無い', pushSay({ ui: 'ja' }, 'hug', 'iri'), 'null');

/* ---- サインインしていない人には何も起こせない ------------------------
   「サインインなしで勧めるものないけど」 OWNER 2026-09-22。

   この口はデータベースのトリガーが叩き、トリガーは**行を入れた人の
   Authorization をそのまま持って行きます**。だから叩いた人は必ず署名済みで、
   `by` はその JWT を Supabase 自身に照らして返ってきた uid です。

   JWT の検証だけでは足りません ── それが言えるのは「サインインしている誰か」
   までで、サインインした他人が他人の行を指して他人の iPhone を鳴らせます。
   **行の actor と一致して初めて、これはその人自身の操作の通知**です。 */
console.log('push: 署名した本人の操作でなければ、何も送らない');
say('署名が無ければ送らない', pushPlan(lik, WHO, DEV, '').send, 'false');
say('理由は「session が無い」', pushPlan(lik, WHO, DEV, '').why, 'no session');
say('publishable キー（user の sub が無い）も同じ',
    pushPlan(lik, WHO, DEV, undefined).why, 'no session');
/* サインインした**他人**。A の投稿に B がいいねした行を、C が叩く。 */
say('サインインした他人は鳴らせない', pushPlan(lik, WHO, DEV, C).send, 'false');
say('理由は「その人のものではない」', pushPlan(lik, WHO, DEV, C).why, 'not theirs to ring');
say('やった本人なら送る', pushPlan(lik, WHO, DEV, B).send, 'true');
/* 三つの表で同じこと。鳴らされる側が自分で自分の通知を起こせるわけでも
   ありません。 */
say('follow も本人だけ', pushPlan(fol, WHO, DEV, B).send, 'true');
say('follow を他人が叩いても送らない', pushPlan(fol, WHO, DEV, C).send, 'false');
say('返信も本人だけ', pushPlan(rep, WHO, DEV, B).send, 'true');
say('返信を鳴らされる側が叩いても送らない', pushPlan(rep, WHO, DEV, A).send, 'false');

/* ---- Apple が「もう無い」と答えた token ------------------------------ */
console.log('push: 410 だけで token が落ちる');
say('410 は落ちる', pushGone([{ token: TOK, status: 410 }]).join(','), TOK);
say('200 は落ちない', pushGone([{ token: TOK, status: 200 }]).length, '0');
/* 400 も 429 も 500 も 0（届かなかった）も「読めなかった」であって「無い」では
   ありません ── CLAUDE.md 一枚目、「空」と「壊れている」は枝を分けない。 */
for (const s of [0, 400, 403, 429, 500, 503]) {
  say(s + ' では落ちない', pushGone([{ token: TOK, status: s }]).length, '0');
}
say('二台のうち 410 の方だけ落ちる',
    pushGone([{ token: TOK, status: 200 }, { token: TOK2, status: 410 }]).join(','), TOK2);
say('何も送っていなければ何も落ちない', pushGone([]).length, '0');
say('undefined でも落ちない', pushGone(undefined).length, '0');
/* Android。FCM は 410 を返さず、「もう無い」は 404 の UNREGISTERED だけ。 */
say('Android の 404 UNREGISTERED は落ちる',
    pushGone([{ token: FCM, status: 404, reason: 'UNREGISTERED', platform: 'android' }]).join(','), FCM);
say('Android の 404 で理由が無ければ落ちない',
    pushGone([{ token: FCM, status: 404, reason: '', platform: 'android' }]).length, '0');
for (const r of ['INVALID_ARGUMENT', 'SENDER_ID_MISMATCH', 'QUOTA_EXCEEDED', 'UNAVAILABLE',
                 'not set: FCM_SERVICE_ACCOUNT'])
  say('Android の ' + r + ' では落ちない',
      pushGone([{ token: FCM, status: r.indexOf('not set') === 0 ? 0 : 400, reason: r,
                  platform: 'android' }]).length, '0');
say('iPhone の行は UNREGISTERED と書いてあっても 404 では落ちない',
    pushGone([{ token: TOK, status: 404, reason: 'UNREGISTERED', platform: 'ios' }]).length, '0');

/* ---- 今日のお題 ── 全員宛て -----------------------------------------
   「通知なんだけど、今日のお題が変わった時にも出るようにできる？」
   OWNER 2026-09-23。

   一人宛ての四つと**同じ一本の道**を通ります。違うのは表の一行だけ ──
   相手は全員（`to: null`、index.ts が一人ずつ入れる）、やったのは service
   role（`from: SERVICE`）、`{0}` はその日の一文。 */
console.log('push: お題は全員へ、鳴らせるのは service role の鍵だけ');
{
  const SVC = 'sb-service-role-key-of-this-project';
  const ROW = { id: 42, text: 'It rained.', says: { ja: '雨が降った。', en: 'It rained.' } };
  say('prompt の行は id で取り出す',
      JSON.stringify(pushWhat(hook('prompt', { id: 42, on_day: '2026-09-23', text: 'ZZ' }))),
      JSON.stringify({ table: 'prompt', key: { id: '42' } }));
  say('数でない id は捨てる', pushWhat(hook('prompt', { id: '../x' })), 'null');
  say('読み直すのは id と文と十言語', JSON.stringify(pushRead('prompt', { id: '42' })),
      JSON.stringify({ cols: 'id,text,says', parent: null, all: true }));
  say('follow は一人宛て', pushRead('follow', { follower: B, followed: A }).all, 'false');
  const aim = pushTo('prompt', ROW, null) || {};
  say('相手は決めない（全員）', aim.to, 'null');
  say('やったのは service role', aim.from, SERVICE);
  say('開く先は無い', aim.post, 'null');

  /* 叩いた人。**Supabase の入口が署名を確かめた JWT の role** が
     service_role の時だけ SERVICE（`pushBy()`）。2026-09-28 本番で、
     daily-prompt の insert から来た Authorization は函数の env の鍵と
     一字一句同じではなく、お題の通知が 401 だった ── 鍵の文字を比べる
     問いは、入口が鍵を JWT に替えた日に黙って外れる。role を読む。
     署名はここでは作らない：確かめるのは入口で、下の「入口が確かめて
     いる」がそれを数える。 */
  const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const jwt = (claims) => b64u({ alg: 'ES256', typ: 'JWT' }) + '.' + b64u(claims) + '.c2ln';
  say('role が service_role の JWT なら SERVICE',
      pushBy('Bearer ' + jwt({ iss: 'supabase', role: 'service_role', exp: 9e9 })), SERVICE);
  say('サインインした人の JWT は誰でもない',
      pushBy('Bearer ' + jwt({ role: 'authenticated', sub: B })), '');
  say('publishable の JWT は誰でもない', pushBy('Bearer ' + jwt({ role: 'anon' })), '');
  say('role の無い JWT は誰でもない', pushBy('Bearer ' + jwt({ sub: B })), '');
  say('JWT でない鍵そのものは誰でもない', pushBy('Bearer ' + SVC), '');
  say('sb_secret の鍵そのものも誰でもない', pushBy('Bearer sb_secret_abc'), '');
  say('読めない JWT は誰でもない', pushBy('Bearer eyJhbGciOi.user.sig'), '');
  say('Bearer でなければ誰でもない',
      pushBy(jwt({ role: 'service_role' })), '');
  say('何も無ければ誰でもない', pushBy(''), '');

  /* 断った時に何が来ていたかを答えに載せる形（`pushTok()`）。値は一文字も
     載せない ── 種類と role と sub の有無だけ。 */
  say('JWT の形', JSON.stringify(pushTok('Bearer ' + jwt({ role: 'service_role', sub: '' }))),
      JSON.stringify({ kind: 'jwt', role: 'service_role', sub: false }));
  say('利用者の JWT の形', JSON.stringify(pushTok('Bearer ' + jwt({ role: 'authenticated', sub: B }))),
      JSON.stringify({ kind: 'jwt', role: 'authenticated', sub: true }));
  say('sb_secret の形', JSON.stringify(pushTok('Bearer sb_secret_zzz')), JSON.stringify({ kind: 'sb_secret' }));
  say('sb_publishable の形', JSON.stringify(pushTok('Bearer sb_publishable_zzz')),
      JSON.stringify({ kind: 'sb_publishable' }));
  say('それ以外の形', JSON.stringify(pushTok('Bearer ' + SVC)), JSON.stringify({ kind: 'other' }));
  say('無い', JSON.stringify(pushTok('')), JSON.stringify({ kind: 'none' }));
  say('形に値は載らない', JSON.stringify(pushTok('Bearer ' + jwt({ role: 'x', sub: 'SECRET-SUB' }))).indexOf('SECRET'), '-1');

  /* **入口が確かめている。**role を信じてよいのは、Supabase の入口が JWT の
     署名を確かめてから函数を走らせるからで、それは push-send を
     `--no-verify-jwt` なしで置くことで決まる。その一語がどこかの置き方に
     入った日に、role は誰にでも書ける文字になる。 */
  const ROOT = path.join(WWW, '..');
  const WF = path.join(ROOT, '.github', 'workflows');
  /* 注釈の行（`#`）は数えない ── supabase-deploy.yml が「付けません」と書いている。 */
  const noVerify = fs.readdirSync(WF).filter((f) => fs.readFileSync(path.join(WF, f), 'utf8')
    .split('\n').some((l) => !/^\s*#/.test(l) && /no-verify-jwt/.test(l)));
  const toml = path.join(ROOT, 'supabase', 'config.toml');
  if (fs.existsSync(toml) && /verify_jwt\s*=\s*false/.test(fs.readFileSync(toml, 'utf8'))) noVerify.push('supabase/config.toml');
  say('どの置き方も JWT の検証を外さない', noVerify.join(',') || 'none', 'none');

  /* **全員宛てを鳴らせるのは service role だけ。**サインインした B が
     お題の行を指して叩いても、`pushMay()` が一人も読まないうちに断る。 */
  say('サインインした人はお題を鳴らせない', pushMay(aim, B), 'not theirs to ring');
  say('publishable キーでも鳴らせない', pushMay(aim, ''), 'no session');
  say('service role なら鳴らせる', pushMay(aim, SERVICE), '');

  const ja = pushPlan({ ...aim, to: A }, { ...ROW, prefs: { ui: 'ja' } }, DEV, SERVICE);
  say('一人ずつ、同じ pushPlan で送る', ja.send, 'true');
  say('文はその人の言語のお題', line(ja), '今日のお題：雨が降った。');
  say('種類は prompt', pay(ja).kind, 'prompt');
  say('お題に開く先の欄は無い', Object.prototype.hasOwnProperty.call(pay(ja), 'post'), 'false');
  say('B が叩いた同じ行では一通も出ない',
      pushPlan({ ...aim, to: A }, { ...ROW, prefs: {} }, DEV, B).send, 'false');
  /* その言語の文がお題の行に無ければ英語の `text`。アプリがお題を出す時と
     同じ落ち方。 */
  const ko = pushPlan({ ...aim, to: A }, { ...ROW, prefs: { ui: 'ko' } }, DEV, SERVICE);
  say('お題の行に無い言語は text に落ちる', line(ko), '오늘의 주제: It rained.');
  say('一文が無いお題は送らない',
      pushPlan({ ...aim, to: A }, { says: {}, text: '', prefs: {} }, DEV, SERVICE).why,
      'nothing to say');
  say('push_prompt を切った人には送らない',
      pushPlan({ ...aim, to: A }, { ...ROW, prefs: { push_prompt: false } }, DEV, SERVICE).why,
      'switched off');
  say('お題を切ってもいいねは届く',
      pushPlan(lik, { handle: 'iri', prefs: { push_prompt: false } }, DEV, B).send, 'true');
  say('iPhone を登録していない人には送らない',
      pushPlan({ ...aim, to: A }, { ...ROW, prefs: {} }, [], SERVICE).why, 'no device');
  /* 一人宛ての種類に service role の鍵を持って来ても、行の actor ではない。 */
  say('service role でもフォローは鳴らせない', pushPlan(fol, WHO, DEV, SERVICE).why,
      'not theirs to ring');
}

/* ---- 種類は一箇所、www/ の手書きはそれと揃っている ------------------
   `PUSH` は Deno の一枚で、www/ は ES5 の script なのでそれを読めません。
   だから www/ には手で書いた語が残ります ── `www/push.js` の `PUSH_KINDS`
   （設定の部屋が並べる行）、`www/core.js` の `SET_PREFS`（`profile.prefs` に
   上がる欄。tools/store-check.mjs が欄の名前を字で読むので、ここは計算で
   作れません）、そして十言語の `push.<種類>`。**ここがその全部を `PUSH` と
   突き合わせます** ── 種類を一つ足して一箇所忘れると、ここが名前を挙げて
   落ちます。数えるのは面の方で、手書きの箇所を覚えておく人ではありません。 */
console.log('push: 種類は PUSH が一箇所、www/ の手書きはそれと揃っている');
{
  const src = (f) => fs.readFileSync(path.join(WWW, f), 'utf8');
  const list = (re, f) => {
    const m = re.exec(src(f));
    return m ? (m[1].match(/'([A-Za-z0-9_]+)'/g) || []).map((x) => x.slice(1, -1)) : null;
  };
  const kinds = list(/var PUSH_KINDS=\[([^\]]*)\]/, 'push.js');
  say('www/push.js の PUSH_KINDS は PUSH と同じ語、同じ順',
      (kinds || ['(無い)']).join(','), KINDS.join(','));
  const prefs = (list(/var SET_PREFS=\[([\s\S]*?)\];/, 'core.js') || [])
    .filter((k) => k.indexOf('push_') === 0);
  say('www/core.js の SET_PREFS の push_ は PUSH の全部',
      prefs.slice().sort().join(','), KINDS.map((k) => 'push_' + k).sort().join(','));
  const holes = [];
  for (const l of LANGS) {
    const t = src('i18n/' + l + '.js');
    for (const k of KINDS) if (t.indexOf("'push." + k + "'") === -1) holes.push(l + '.' + k);
  }
  say('十言語に push.<種類> の行がある', holes.join(' ') || 'none', 'none');
  /* 一つの種類が二つの表から来ることはあっても、一つの表の一つの行が二つの
     種類であってはいけません ── どちらの通知かを表の順が決めることになる。 */
  const dup = [];
  for (const a of PUSH) for (const b of PUSH)
    if (a !== b && a.table === b.table && JSON.stringify(Object.keys(a.key)) ===
        JSON.stringify(Object.keys(b.key)) &&
        !Object.keys(a.key).some((f) => typeof a.key[f] === 'string' &&
                                       typeof b.key[f] === 'string' && a.key[f] !== b.key[f]))
      dup.push(a.kind + '=' + b.kind);
  say('一つの行が二つの種類になることは無い', dup.join(' ') || 'none', 'none');
}

/* ---- 電話は、どちらの電話かを自分で言う ------------------------------
   `device.platform` を決めるのはネイティブの答えで、www/ は写すだけ。
   **本物の pushAsk()（www/push.js）と netDevicePut()（www/net.js）を**
   そのまま切り出して vm で走らせ、`device` へ出る体を数えます ── ここで
   判断を書き直したら写しで、写しはいつも合う。Android の LinguaPushPlugin.kt
   は `platform: "android"` を付けて答え、iPhone の LinguaPush.swift は何も
   付けない（列の既定 `ios` が答える）。 */
console.log('push: 電話は、どちらの電話かを device の行に載せる');
{
  const src = (f) => fs.readFileSync(path.join(WWW, f), 'utf8');
  const fn = (s, name) => {
    const at = s.search(new RegExp('^function ' + name + '\\(', 'm'));
    if (at < 0) return '';
    let d = 0, i = s.indexOf('{', at);
    for (; i < s.length; i++) { if (s[i] === '{') d++; else if (s[i] === '}' && --d === 0) break; }
    return s.slice(at, i + 1);
  };
  const code = ['pushPlug', 'pushStGot', 'pushStAsk', 'pushAsk'].map((n) => fn(src('push.js'), n))
    .concat([fn(src('net.js'), 'netDevicePut')]).join('\n');
  const ask = async (answer) => {
    const sent = [];
    const box = {
      SESS: { rt: 'r', at: 'a', uid: A }, PUSH_ST: '', NET_TOK: '', Promise, setTimeout,
      render() {}, netSignedIn() { return true; }, netUid() { return A; }, netTok() { return 'a'; },
      netSend(m, p, body) { if (String(p).indexOf('/rest/v1/device') === 0) sent.push(body); },
      Capacitor: { nativePromise: (plug, m) =>
        plug !== 'LinguaPush' ? Promise.reject('wrong') :
        m === 'status' ? Promise.resolve({ status: 'authorized' }) : Promise.resolve(answer) },
    };
    box.window = box;
    vm.createContext(box);
    vm.runInContext(code + '\npushAsk();', box);
    for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
    return sent;
  };
  const droid = await ask({ token: FCM, platform: 'android' });
  say('Android の答えは platform: android として device へ',
      droid.length + ' ' + (droid[0] && droid[0].platform), '1 android');
  say('その行の token は FCM の物', droid[0] && droid[0].token, FCM);
  const ios = await ask({ token: TOK });
  say('iPhone の答えは platform を載せない（列の既定 ios が答える）',
      ios.length + ' ' + (ios[0] && Object.prototype.hasOwnProperty.call(ios[0], 'platform')), '1 false');
  const odd = await ask({ token: FCM, platform: 'windows' });
  say('知らない platform は載せない（検査で落ちる行を出さない）',
      odd.length + ' ' + (odd[0] && Object.prototype.hasOwnProperty.call(odd[0], 'platform')), '1 false');
  /* Android の通知のチャンネルは、push-send が名指す物と同じ名前。違えば
     Android 8 以降は黙って捨てる。Kotlin の文字をそのまま読みます。 */
  const kt = fs.readFileSync(path.join(WWW, '..', 'android', 'app', 'src', 'main', 'java', 'com',
                                       'tokinets', 'lingua', 'LinguaPushPlugin.kt'), 'utf8');
  say('LinguaPushPlugin.kt の CHANNEL は push-send の CHANNEL',
      (kt.match(/const val CHANNEL = "([^"]*)"/) || [])[1], CHANNEL);
}

/* ---- そのほか、名前が合っていること ---------------------------------- */
console.log('push: 語と topic');
say('通知タブの五つ、そしてお題', KINDS.join(','), 'follow,reply,quote,like,boost,prompt');
say('topic は bundle id', TOPIC, 'com.tokinets.lingua');
say('知らない種類は送らない',
    pushPlan({ kind: 'hug', to: A, from: B, post: null }, WHO, DEV, B).send, 'false');
say('相手がいなければ送らない',
    pushPlan({ kind: 'like', to: '', from: B, post: P }, WHO, DEV, B).send, 'false');
say('何も無ければ送らない', pushPlan(null, WHO, DEV, B).send, 'false');

console.log('push: ' + said + ' claims about a notice nobody would see go wrong');
if (bad) { console.error('push-check: ' + bad + ' failed'); process.exit(1); }
