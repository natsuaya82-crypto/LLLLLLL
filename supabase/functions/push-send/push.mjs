/* ---------------------------------------------------------------------------
   supabase/functions/push-send/push.mjs — 誰に、何と、送るのか。

   これは **plain ESM JavaScript** です。この函数は Deno で動き、検査
   (tools/push-check.mjs) は Node で動く ── その二つが同じ一枚を読むために、
   どちらもそのまま import できる形にしてあります。verify-plan/verify.mjs と
   同じ理由で、同じ形です：**検査が試験対象を書き直したら、それは写しであって、
   写しは必ず一致します**（CLAUDE.md § 10, § 12）。

   ここには I/O が一つもありません。表を読むのも、Apple に送るのも index.ts。
   ここにあるのは**判断**だけで、判断は全部ここにあります ── 署名した本人の
   操作でなければ送らない、自分には送らない、スイッチが切れていれば送らない、
   宛先が無ければ送らない、何と書くか、そしてどの token を消すか。

   なぜ判断を切り離すか。通知は**何も投げない種類の仕事**です。相手を間違えても、
   スイッチを裏返しに読んでも、文面が空でも、Apple は 200 を返します。壊れている
   ことが分かるのは、切ったはずの通知が鳴った日か、許可したのに一通も来ない日で、
   どちらも人が気づくまで誰も知りません。

   種類は下の `PUSH` が一箇所です。`follow` `reply` `like` `boost` の四つは
   `supabase/schema.sql` の `notices()` が返すのと同じ四つです。
   --------------------------------------------------------------------------- */

/* ---- 通知の種類 ── **ここが一箇所です** -----------------------------
   一行が一つの種類で、その種類について問われることは全部その行が答えます
   ── どの表の insert から来るか、その行を何で見分けるか（`key`）、読み直す
   列、返信やいいねのように相手が**親の投稿**にしか書いていないならその列
   （`parent`）、誰に（`to`）、誰がやったことか（`from`）、開く先（`post`）、
   文の `{0}` に何が入るか（`fill`）。

   下の函数はどれも**この表を読むだけ**で、種類の名前を一つも知りません。 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const PUSH = [
  { kind: 'follow', table: 'follow', cols: 'follower,followed',
    key: { follower: UUID, followed: UUID }, parent: null,
    to: (r) => r.followed, from: (r) => r.follower, post: () => null, fill: 'handle' },
  { kind: 'reply', table: 'post', cols: 'id,author,reply_to',
    key: { id: UUID }, parent: 'reply_to',
    to: (r, p) => p.author, from: (r) => r.author, post: (r) => r.id, fill: 'handle' },
  { kind: 'like', table: 'react', cols: 'post,actor,kind',
    key: { post: UUID, actor: UUID, kind: 'like' }, parent: 'post',
    to: (r, p) => p.author, from: (r) => r.actor, post: (r) => r.post, fill: 'handle' },
  { kind: 'boost', table: 'react', cols: 'post,actor,kind',
    key: { post: UUID, actor: UUID, kind: 'boost' }, parent: 'post',
    to: (r, p) => p.author, from: (r) => r.actor, post: (r) => r.post, fill: 'handle' },
];

/* 種類の名前。通知タブと同じ語、同じ順。 */
export const KINDS = PUSH.map((e) => e.kind);
/* 行を入れると鳴る表。schema.sql の push 節のトリガーは、この全部に一つずつ。 */
export const TABLES = PUSH.map((e) => e.table).filter((t, i, a) => a.indexOf(t) === i);

/* アプリの表示言語、www/i18n/ と同じ十。`en` が既定。 */
export const LANGS = ['en', 'es', 'pt', 'fr', 'de', 'it', 'ru', 'zh', 'ko', 'ja'];

/* APNs の topic ＝ bundle id。ios/App/App/Info.plist と同じもの。 */
export const TOPIC = 'com.tokinets.lingua';

/* ---- 文面 ---------------------------------------------------------------
   **これは二つ目の置き場です。**四種類 × 十言語の同じ文が
   `www/i18n/{en,…,ja}.js` の `notif.like` `notif.boost` `notif.reply`
   `notif.follow` にあり、この函数は Deno で動くので **`www/` を読めません**
   ── `ios/App/LinguaKeyboard/Shared.swift` の `Say` が同じ理由で同じことを
   しています。

   だから**訳し直していません**：上の四つの鍵の値をそのまま持ってきてあります。
   二箇所あることは避けられませんが、二つの文言があることは避けられます。
   `{0}` は、`fill: 'handle'` の種類ではやった人の `@handle`
   （`profile.handle`）。

   `docs/DUPLICATES.md` に載せる一件です。 */
export const SAY = {
  en: { like: '{0} liked this',      boost: '{0} reposted this',
        reply: '{0} replied',        follow: '{0} followed you' },
  es: { like: 'A {0} le gustó',      boost: '{0} lo compartió',
        reply: '{0} respondió',      follow: '{0} te sigue' },
  pt: { like: '{0} gostou',          boost: '{0} republicou',
        reply: '{0} respondeu',      follow: '{0} começou a seguir-te' },
  fr: { like: '{0} a aimé',          boost: '{0} a republié',
        reply: '{0} a répondu',      follow: '{0} vous suit' },
  de: { like: '{0} gefällt das',     boost: '{0} hat das geteilt',
        reply: '{0} hat geantwortet', follow: '{0} folgt dir' },
  it: { like: 'A {0} piace',         boost: '{0} l’ha ripubblicato',
        reply: '{0} ha risposto',    follow: '{0} ti segue' },
  ru: { like: '{0} оценил это',      boost: '{0} поделился этим',
        reply: '{0} ответил',        follow: '{0} читает вас' },
  zh: { like: '{0} 点了赞',           boost: '{0} 转发了',
        reply: '{0} 回复了',          follow: '{0} 关注了你' },
  ko: { like: '{0} 님이 좋아합니다',   boost: '{0} 님이 다시 올렸습니다',
        reply: '{0} 님이 답했습니다',  follow: '{0} 님이 팔로우했습니다' },
  ja: { like: '{0} がいいね',         boost: '{0} がリポスト',
        reply: '{0} が返信',          follow: '{0} がフォロー' },
};

/* 通知の頭。「Lingua」は訳しません（CLAUDE.md 規則 2）。 */
export const TITLE = 'Lingua';

/* ---- request をここで捨てる -------------------------------------------
   トリガー（`push_ping()`）は `{table, record}` を送ってきます。**この函数は
   そのうち二つしか受け取りません** ── どの表の、どの行か。文面に使える文字は
   一つも通しません。

   なぜそこまでするか。この口を叩けるのは署名した人ですが、署名した人が本当の
   ことを言っているとは限りません。届いた JSON から一文字でも文面に流れれば、
   それは他人の iPhone に好きな文を出せるということです。鍵は `PUSH` の行が
   言う形をしていなければ捨てます ── URL に入る値なので、形が違うものは
   そこで終わりです。文字列の鍵（react の `kind`）は**その値でなければ**
   捨てます。

   返すのは `{table, key}` か `null`。`null` は「読めなかった」で、`index.ts`
   はそこで何もせずに終わります。 */
function keyOf(e, r) {
  const out = {};
  for (const f of Object.keys(e.key)) {
    const want = e.key[f];
    const v = r[f];
    const s = (typeof v === 'string' || typeof v === 'number') ? String(v) : '';
    if (typeof want === 'string' ? s !== want : !want.test(s)) return null;
    out[f] = s;
  }
  return out;
}
export function pushWhat(body) {
  const b = (body && typeof body === 'object') ? body : {};
  const r = (b.record && typeof b.record === 'object') ? b.record : {};
  const table = String(b.table || '');
  for (const e of PUSH) {
    if (e.table !== table) continue;
    const k = keyOf(e, r);
    if (k) return { table: table, key: k };
  }
  return null;
}

/* その表のその行が、どの種類か。同じ表に二つの種類がある（react の like と
   boost）ので、表の名前だけでは決まらず、鍵が合う行を選びます。 */
function kindOf(table, row) {
  for (const e of PUSH) if (e.table === table && keyOf(e, row)) return e;
  return null;
}
/* 読み直す列と、親の列。index.ts はこれを訊くだけで種類を知りません。 */
export function pushRead(table, key) {
  const e = kindOf(table, key || {});
  return e ? { cols: e.cols, parent: e.parent } : null;
}

/* ---- 誰への、どの知らせか ----------------------------------------------
   `row` は**データベースから読み直した行**、`parent` は返信といいねに要る
   もう一枚（返信なら返された投稿、react ならその投稿）。どちらも DB の行で、
   request のものではありません。

   相手が親の行にしか無い種類は、親が読めなければ何もしません（消された投稿
   への返信は、誰への知らせでもない）。

   `post` は開く先。無い種類には載せません（載せるところが無いのと、無い物を
   空文字で埋めるのは同じではない）。 */
export function pushTo(table, row, parent) {
  if (!row || typeof row !== 'object') return null;
  const e = kindOf(table, row);
  if (!e) return null;
  if (e.parent && (!parent || typeof parent !== 'object')) return null;
  return {
    kind: e.kind,
    to: e.to(row, parent) || '',
    from: e.from(row, parent) || '',
    post: e.post(row, parent) || null,
  };
}

/* ---- そのスイッチ -------------------------------------------------------
   `profile.prefs` の中の `push_<種類>`。**無いのはオン**で、これは既定ではなく
   仕様です ── 前から居る人の `prefs` にこれらは無く、無いことを「切ってある」
   と読むと許可を出した人に一通も届きません。切ってあるのは `false` と書いて
   ある時だけ。 */
export function pushSwitch(kind) { return 'push_' + kind; }
export function pushWants(prefs, kind) {
  const p = (prefs && typeof prefs === 'object') ? prefs : {};
  return p[pushSwitch(kind)] !== false;
}

/* 相手の表示言語。知らない語と、何も言っていない人は `en`。 */
export function pushLang(prefs) {
  const p = (prefs && typeof prefs === 'object') ? prefs : {};
  const v = typeof p.ui === 'string' ? p.ui : '';
  return LANGS.indexOf(v) === -1 ? 'en' : v;
}

/* `{0}` に入るもの。`who` は index.ts が DB から組んだもので、
   `handle` はやった人の @。 */
function fillOf(kind, who, lang) {
  const e = PUSH.find((x) => x.kind === kind);
  if (!e) return '';
  const w = (who && typeof who === 'object') ? who : {};
  if (e.fill === 'handle') return '@' + String(w.handle || '');
  return '';
}

/* 文面。`who` は `{handle}`、あるいは古い呼び方で handle の文字列そのもの。 */
export function pushSay(prefs, kind, who) {
  const lang = pushLang(prefs);
  const one = SAY[lang] || SAY.en;
  const line = one[kind] || '';
  if (!line) return null;
  const w = (typeof who === 'string') ? { handle: who } : who;
  const fill = fillOf(kind, w, lang);
  if (!fill) return null;
  return { title: TITLE, body: line.replace('{0}', fill) };
}

/* ---- 鳴らしてよいか ---------------------------------------------------
   **サインインしていない人には何も起こせない。**
   「サインインなしで勧めるものないけど」 OWNER 2026-09-22。

   `by` は名乗りではありません（index.ts）。無ければそこで終わり ──
   publishable キーで叩かれた時もここに来ます（あの鍵に user の sub は無い）。

   そして **その人がやったことでなければ鳴らさない**。JWT の検証だけでは
   「サインインしている誰か」までしか言えず、サインインした他人が、他人の
   フォローの行を指して他人の iPhone を鳴らせます。行の actor と一致して
   初めて、これは**その人自身の操作の通知**です。

   `pushPlan()` が最初にこれを訊き、index.ts も相手を読みに行く**前に**
   これを訊きます ── 同じ函数を二度呼ぶのであって、二つ目の判断ではありません。
   返すのは断る理由か `''`。 */
export function pushMay(aim, by) {
  if (!aim || !aim.kind || !aim.from) return 'no such event';
  if (KINDS.indexOf(aim.kind) === -1) return 'no such kind';
  if (!by) return 'no session';
  if (by !== aim.from) return 'not theirs to ring';
  return '';
}

/* ---- 送るか、送らないか -------------------------------------------------
   送らない理由はいくつかあり、**どれも黙って終わります** ── 通知が出ないことは
   エラーではありません。理由を文字で返すのは、実機で「来ない」と言われた時に
   どれだったかを分けるためです（verify-plan の `left` と同じ）。

   一回の呼び出しは**一人の相手**について。

   `who` は `{handle, prefs}` ── `prefs` は**相手の**
   設定。`devices` は相手の token の配列。どれも DB から来ます。`by` は
   **叩いた人**で、提示された JWT を Supabase に照らして返ってきた uid。 */
export function pushPlan(aim, who, devices, by) {
  const may = pushMay(aim, by);
  if (may) return { send: false, why: may };
  if (!aim.to) return { send: false, why: 'no such event' };
  /* 自分がやったことは自分に知らせない。notices() が
     `r.actor <> auth.uid()` と書いているのと同じ一行。 */
  if (aim.to === aim.from) return { send: false, why: 'their own' };
  const w = (who && typeof who === 'object') ? who : {};
  if (!pushWants(w.prefs, aim.kind)) return { send: false, why: 'switched off' };
  const to = [];
  for (let i = 0; i < (devices || []).length; i++) {
    const t = devices[i];
    const s = (t && typeof t === 'object') ? t.token : t;
    if (typeof s === 'string' && s) to.push(s);
  }
  /* 許可していない人、アプリを消した人。**行が無いのは切ってあるのとは別**
     ですが、どちらも送る先が無いので同じ終わり方をします。 */
  if (!to.length) return { send: false, why: 'no device' };
  const say = pushSay(w.prefs, aim.kind, w);
  if (!say) return { send: false, why: 'nothing to say' };
  const payload = { aps: { alert: say, sound: 'default' }, kind: aim.kind };
  /* 開く先。無ければ**載せない** ── 空の値は「無い」ではありません。 */
  if (aim.post) payload.post = aim.post;
  return { send: true, to: to, payload: payload };
}

/* ---- Apple が「もう無い」と答えた token -------------------------------
   410 Unregistered は、その token が指していたアプリがその iPhone から消えた
   ということです。**410 だけ**：400 も 429 も 500 もタイムアウトも「読めな
   かった」であって「無い」ではなく、枝を分けません（CLAUDE.md 一枚目）。

   `sent` は `[{token, status}]`。返すのは消す
   token。DELETE REVIEW は docs/CHANGELOG.md 2026-09-22。 */
export function pushGone(sent) {
  const out = [];
  for (let i = 0; i < (sent || []).length; i++) {
    const r = sent[i] || {};
    if (Number(r.status) === 410 && typeof r.token === 'string' && r.token) out.push(r.token);
  }
  return out;
}
