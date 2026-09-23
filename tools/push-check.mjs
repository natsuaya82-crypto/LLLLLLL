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
     - お題は全員宛てで、鳴らせるのは service role の鍵だけ
     - **種類は `PUSH` が一箇所**で、www/ の二つの手書き（`PUSH_KINDS` と
       `SET_PREFS`）と i18n の `push.<種類>` がそれと揃っていること
   --------------------------------------------------------------------------- */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pushWhat, pushTo, pushPlan, pushMay, pushBy, pushSay, pushWants, pushLang,
         pushGone, pushRead, PUSH, KINDS, SERVICE, LANGS, SAY, TITLE, TOPIC } from
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
const DEV = [{ token: TOK }];
const WHO = { handle: 'iri', prefs: { ui: 'ja' } };

/* ---- 何が起きたか、を request から取り出す ---------------------------- */
console.log('push: request から取り出すのは「どの表の、どの行か」だけ');

const hook = (table, record) => ({ type: 'INSERT', schema: 'public', table, record });

say('follow は二つの uid',
    JSON.stringify(pushWhat(hook('follow', { follower: B, followed: A, created_at: 'x' }))),
    JSON.stringify({ table: 'follow', key: { follower: B, followed: A } }));
say('post は id 一つ',
    JSON.stringify(pushWhat(hook('post', { id: Q, author: B, body: { line: 'ほげ' } }))),
    JSON.stringify({ table: 'post', key: { id: Q } }));
say('react は投稿と人と種類',
    JSON.stringify(pushWhat(hook('react', { post: P, actor: B, kind: 'boost' }))),
    JSON.stringify({ table: 'react', key: { post: P, actor: B, kind: 'boost' } }));
say('知らない表は捨てる', pushWhat(hook('profile', { id: A })), 'null');
say('uuid でない鍵は捨てる', pushWhat(hook('post', { id: '../../etc' })), 'null');
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

/* ---- 宛先 ------------------------------------------------------------- */
console.log('push: device の行が無ければ何もしない');
say('行が一つも無ければ送らない', pushPlan(lik, WHO, [], B).send, 'false');
say('理由は「宛先が無い」', pushPlan(lik, WHO, [], B).why, 'no device');
say('送らないと決めた答えに payload は無い', pushPlan(lik, WHO, [], B).payload, 'undefined');
say('undefined でも落ちない', pushPlan(lik, WHO, undefined, B).send, 'false');
say('二台持っていれば二台とも', many(pushPlan(lik, WHO, [{ token: TOK }, { token: TOK2 }], B)), '2');
say('空の token は数えない', many(pushPlan(lik, WHO, [{ token: '' }, { token: TOK }], B)), '1');

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

  /* 叩いた人。service role の鍵そのものだけが SERVICE。 */
  say('service role の鍵なら SERVICE', pushBy('Bearer ' + SVC, SVC), SERVICE);
  say('違う鍵なら誰でもない', pushBy('Bearer ' + SVC + 'x', SVC), '');
  say('サインインした人の JWT は誰でもない', pushBy('Bearer eyJhbGciOi.user.sig', SVC), '');
  say('鍵が函数に無ければ誰でもない', pushBy('Bearer ', ''), '');
  say('何も無ければ誰でもない', pushBy('', SVC), '');

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

/* ---- そのほか、名前が合っていること ---------------------------------- */
console.log('push: 語と topic');
say('通知タブの四つ、そしてお題', KINDS.join(','), 'follow,reply,like,boost,prompt');
say('topic は bundle id', TOPIC, 'com.tokinets.lingua');
say('知らない種類は送らない',
    pushPlan({ kind: 'hug', to: A, from: B, post: null }, WHO, DEV, B).send, 'false');
say('相手がいなければ送らない',
    pushPlan({ kind: 'like', to: '', from: B, post: P }, WHO, DEV, B).send, 'false');
say('何も無ければ送らない', pushPlan(null, WHO, DEV, B).send, 'false');

console.log('push: ' + said + ' claims about a notice nobody would see go wrong');
if (bad) { console.error('push-check: ' + bad + ' failed'); process.exit(1); }
