/* ---------------------------------------------------------------------------
   supabase/functions/push-send/push.mjs — 誰に、何と、送るのか。

   これは **plain ESM JavaScript** です。この函数は Deno で動き、検査
   (tools/push-check.mjs) は Node で動く ── その二つが同じ一枚を読むために、
   どちらもそのまま import できる形にしてあります。verify-plan/verify.mjs と
   同じ理由で、同じ形です：**検査が試験対象を書き直したら、それは写しであって、
   写しは必ず一致します**（CLAUDE.md § 10, § 12）。

   ここには I/O が一つもありません。表を読むのも、Apple に送るのも index.ts。
   ここにあるのは**判断**だけで、判断は全部ここにあります ── 自分には送らない、
   スイッチが切れていれば送らない、宛先が無ければ送らない、何と書くか、そして
   どの token を消すか。

   なぜ判断を切り離すか。通知は**何も投げない種類の仕事**です。相手を間違えても、
   スイッチを裏返しに読んでも、文面が空でも、Apple は 200 を返します。壊れている
   ことが分かるのは、切ったはずの通知が鳴った日か、許可したのに一通も来ない日で、
   どちらも人が気づくまで誰も知りません。

   四つの語 ── `follow` `reply` `like` `boost` ── は
   `supabase/schema.sql` の `notices()` が返すのと同じ四つです。五つ目はあり
   ません。
   --------------------------------------------------------------------------- */

/* 通知の四種類。通知タブと同じ語、同じ順。 */
export const KINDS = ['follow', 'reply', 'like', 'boost'];

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
   `{0}` は `@handle`（`profile.handle`）。

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
   Database Webhook は `{type, table, schema, record, old_record}` を送って
   きます。**この函数はそのうち二つしか受け取りません** ── どの表の、どの行か。
   文面に使える文字は一つも通しません。

   なぜそこまでするか。この口は JWT の検証なしで置かれます（トリガーは秘密を
   持って行けないので ── supabase/schema.sql 末尾）。つまり**誰でも叩けます**。
   届いた JSON から一文字でも文面に流れれば、それは知らない人が他人の iPhone に
   好きな文を出せるということです。鍵は uuid の形をしていなければ捨てます
   ── URL に入る値なので、形が違うものはそこで終わりです。

   返すのは `{table, key}` か `null`。`null` は「読めなかった」で、`index.ts`
   はそこで何もせずに終わります。 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function id(v) {
  const s = typeof v === 'string' ? v : '';
  return UUID.test(s) ? s : '';
}
export function pushWhat(body) {
  const b = (body && typeof body === 'object') ? body : {};
  const r = (b.record && typeof b.record === 'object') ? b.record : {};
  const table = String(b.table || '');
  if (table === 'follow') {
    const a = id(r.follower), c = id(r.followed);
    return (a && c) ? { table: table, key: { follower: a, followed: c } } : null;
  }
  if (table === 'post') {
    const a = id(r.id);
    return a ? { table: table, key: { id: a } } : null;
  }
  if (table === 'react') {
    const a = id(r.post), c = id(r.actor);
    /* `kind` は鍵の一部なので通しますが、**閉じた集合のどちらかでなければ
       捨てます**。行は主キーで読み直すので、返ってきた行が答えです。 */
    const k = (r.kind === 'like' || r.kind === 'boost') ? r.kind : '';
    return (a && c && k) ? { table: table, key: { post: a, actor: c, kind: k } } : null;
  }
  return null;
}

/* ---- 誰への、どの知らせか ----------------------------------------------
   `row` は**データベースから読み直した行**、`parent` は返信といいねに要る
   もう一枚（返信なら返された投稿、react ならその投稿）。どちらも DB の行で、
   request のものではありません。

   `follow` は相手がそのまま書いてある。`reply` と `like` と `boost` は、
   相手は**その投稿を書いた人**で、それは親の行にしかありません ── だから
   親が読めなければ何もしません（消された投稿への返信は、誰への知らせでも
   ない）。

   `post` は開く先。follow には無いので載せません（載せるところが無いのと、
   無い物を空文字で埋めるのは同じではない）。 */
export function pushTo(table, row, parent) {
  if (!row || typeof row !== 'object') return null;
  if (table === 'follow') {
    return { kind: 'follow', to: row.followed || '', from: row.follower || '', post: null };
  }
  if (table === 'post') {
    if (!parent || typeof parent !== 'object') return null;
    return { kind: 'reply', to: parent.author || '', from: row.author || '', post: row.id || null };
  }
  if (table === 'react') {
    if (!parent || typeof parent !== 'object') return null;
    if (row.kind !== 'like' && row.kind !== 'boost') return null;
    return { kind: row.kind, to: parent.author || '', from: row.actor || '', post: row.post || null };
  }
  return null;
}

/* ---- そのスイッチ -------------------------------------------------------
   `profile.prefs` の中の四つ。**無いのはオン**で、これは既定ではなく仕様です
   ── 前から居る人の `prefs` にこの四つは無く、無いことを「切ってある」と読むと
   許可を出した人に一通も届きません。切ってあるのは `false` と書いてある時だけ。 */
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

/* 文面。`handle` は**相手ではなく、やった人**の @。 */
export function pushSay(prefs, kind, handle) {
  const one = SAY[pushLang(prefs)] || SAY.en;
  const line = one[kind] || '';
  if (!line) return null;
  return { title: TITLE, body: line.replace('{0}', '@' + String(handle || '')) };
}

/* ---- 送るか、送らないか -------------------------------------------------
   送らない理由は四つあり、**どれも黙って終わります** ── 通知が出ないことは
   エラーではありません。理由を文字で返すのは、実機で「来ない」と言われた時に
   どれだったかを分けるためです（verify-plan の `left` と同じ）。

   `who` は `{handle, prefs}` ── `handle` はやった人の @、`prefs` は**相手の**
   設定。`devices` は相手の token の配列。どれも DB から来ます。 */
export function pushPlan(aim, who, devices) {
  if (!aim || !aim.kind || !aim.to || !aim.from) return { send: false, why: 'no such event' };
  if (KINDS.indexOf(aim.kind) === -1) return { send: false, why: 'no such kind' };
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
  const say = pushSay(w.prefs, aim.kind, w.handle);
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

   `sent` は `[{token, status}]`。返すのは消す token。DELETE REVIEW は
   docs/CHANGELOG.md 2026-09-22。 */
export function pushGone(sent) {
  const out = [];
  for (let i = 0; i < (sent || []).length; i++) {
    const r = sent[i] || {};
    if (Number(r.status) === 410 && typeof r.token === 'string' && r.token) out.push(r.token);
  }
  return out;
}
