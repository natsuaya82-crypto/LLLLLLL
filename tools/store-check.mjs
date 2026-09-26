/* Nothing is kept on this phone alone.
   ---------------------------------------------------------------------
   「最初からオンライン前提で作れ」「SNSは全部サーバー」「基本は全部サーバー管理」

   The app is online. The server is where things live, and `localStorage` is
   the copy that runs with no signal -- CLAUDE.md § Online. **NOTHING IS THE
   PHONE'S. EVERYTHING IS THE ACCOUNT'S** (OWNER 2026-09-03): the backup file
   and an exported sheet are that account's language in a form a person can
   hold, and the settings are that account's settings. The question a new key
   has to answer is not 「is this the phone's」 -- there is no answer to that --
   it is 「which account is this」.

   So `phone` below does not mean 「nobody's」. It means the key is not a copy
   of a row on the server, and the sentence beside it has to say which account
   it belongs to or why the question does not arise (`lingua.sess` is the only
   one where it does not: it IS which account this phone is).

   WRITING ALONE STOPS NOTHING. The
   timeline was local for a week with every check green, and the languages
   were local for as long again after that, and both were found by a person
   holding a phone rather than by anything here. 「書いていて止めないの本当に
   何？」 OWNER 2026-09-01.

   So: every key this app writes into localStorage is named below, with WHERE
   IT GOES. A key with a road has the function that takes it there, and that
   function has to exist. A key with no road says why it is the phone's, and
   there are four of those and they are the decision, not an oversight.

   A NEW KEY FAILS until somebody writes down which of the two it is. That is
   the whole of what this holds: it cannot tell whether the road is walked --
   acct-check and again-check do that -- only that nobody added a place to
   keep somebody's work without saying how it gets off the phone.

   AND IT LOOKS INSIDE `lingua.set`, WHICH IT DID NOT UNTIL 2026-09-02.

   The table above is keyed on `localStorage.setItem` -- so `lingua.set` is
   ONE line in it, answered once, years ago, with 「the settings」. Everything
   the settings CONTAIN was therefore invisible: a field added to `SET` is a
   new place to keep something, it is written to disk with every save, and
   nothing here went red for it. `plan()` is the worked example and it is
   not a small one -- what somebody PAYS sat inside a key whose whole entry
   says 「one of the three things that are the phone's」.

   That is the same shape as every fault this file exists for: a sentence
   that covers a thing, read as covering everything inside it. **It has one
   more layer under it**, and that is why `setDefaults()` is read below: a
   field does not have to be assigned anywhere to be written to disk. One
   returned from that literal is in `lingua.set` on the first save this app
   ever makes, and the `SET.x =` search never sees it.
   「書いていて止めないの本当に何？」 OWNER 2026-09-01.

   So FIELDS below is ROADS one level in, and it is asked the same two ways:
   a field written and not named here is red, and a field named here that
   nothing writes any more is red.

   Run: node tools/store-check.mjs                                        */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WWW = path.join(HERE, '..', 'www');

/* `file:key expression as it is written there` -> where it goes. The FILE is
   part of the name because `k` is a loop variable in two files about two
   different things -- the slices in core.js and the notices in sns.js -- and a
   table keyed on the expression alone would have said one road for both.
   `to` names the function in www/net.js that puts it on the server.
   `phone` is the reason it is the phone's own, and is a sentence. */
const ROADS = {
  /* NOT ONE LANGUAGE KEY, AND THAT IS THE POINT OF THIS BLOCK BEING EMPTY.
     「オンラインは一本化ね？」「保存としたらオンラインおしまい」「今ファイルも
     いらん。オンラインのみで行こうってことになってる」 OWNER 2026-09-04.

     Twelve slices used to be twelve lines here, each naming netSlicePut() as
     the road that took it up. They are in MEMORY now -- `LSL` in www/core.js,
     reached by slRd/slWr -- and the server is the only place a language is
     kept. A `lingua.<id>.<slice>` key appearing under this comment again is
     the copy coming back, which is the whole of what that decision removed,
     so it fails as a key nobody wrote down rather than being quietly allowed.

     ONE KEY UNDER THIS COMMENT, AND IT IS A PICTURE RATHER THAN A COPY.
     「前に読み込んだ分は出て欲しい。制作も眺めたい人はいるだろうし、」
     OWNER 2026-09-05. With the slices in memory, an app that has been closed
     holds nothing, so a launch with no signal opened somebody's own language
     to find it empty. `lingua.<id>.<slice>.got` is what the SERVER last said
     that slice was, written down so the screens have something to draw.

     It is not the copy coming back, and the difference is mechanical rather
     than careful: it is on NO road up. www/core.js asks two questions where
     it used to ask one -- `slRd()` for the screens, which sees it, and
     `slMine()` for everything that sends, which does not -- so it can be
     drawn and can never be merged, sent, or preferred to an answer that has
     just arrived. */
  'core.js:slGotKey(k)': { whose: 'lang', phone: 'what the server last said this slice was, kept so a launch with no signal draws the language instead of nothing. It belongs to the account the slice does -- filed under `lingua.<id>.<slice>`, so wipeLangsGo() takes it with the language and lsWipeAcct(), which counts the `lingua.<id>.` namespace rather than walking SLICES, takes it with the account (acct-check 66; until 2026-09-11 it walked SLICES and left the `name`/`wsys`/`owner` pictures behind, because those are columns of the `language` row and were born after that loop). It has no road UP and must not be given one: `slMine()` in www/core.js is what keeps it out of netSlice1(), netSaveNow() and both of the 「fills in and stops」 reads' },
  /* AND ONE WRITE THAT ADDS NO KEY EITHER, for the opposite reason: it is a
     key this phone already has, written down again under the language's own
     number. langsCarry() in www/core.js is the 2026-09-10 migration -- a
     language had two numbers and has one now, so everything filed under the
     old one is copied to the new one and nothing under the old one is
     removed. The destination is `lingua.<id>.<something>` with the id being
     the same language's server id, so every key it can write is a key ROADS
     already names above; what it copies keeps the road the original had. */
  'core.js:dst': { whose: 'lang', phone: 'the same keys under the language\'s own number, written by the 2026-09-10 migration (langsCarry, www/core.js). It copies and removes nothing, and a key already holding something is never written over, so this adds no kind of key and no road: `lingua.<id>.<slice>` and its `.was` and the pictures beside them are each on the road their own row above names' },
  /* AND ONE WRITE THAT ADDS NO KEY, because it is the same keys put back.
     keepSave() in www/shell.js takes a copy of the `lingua.` namespace before
     a save writes anything and writes it back when the send does not land
     (「先にサーバーじゃないの？」 OWNER 2026-09-06), so every key this can
     touch is a key that was already on this phone a moment earlier and has
     its own row somewhere in this table. It cannot invent one: a key that is
     not in the copy is REMOVED rather than written. */
  'shell.js:k': { whose: 'same', phone: 'nothing of its own. It is keepBack() in www/shell.js putting the `lingua.` namespace back exactly as it was before a save that did not reach the server, so each key it writes is one of the others in this table, with the value it already had' },
  /* EVERYTHING AN ACCOUNT HAS ON THIS PHONE, AND IT IS ONE ROW.
     「端末ごとにやることなんてねえよ」「アカウントごとってずっと言ってるよな？」
     OWNER 2026-09-03. The posts, the drafts, `me`, the account's fields of
     the settings, the index of languages, the open one and what it took were
     seven rows here, each a live key with no owner on it plus a PARKED copy
     under `…<uid>` -- and a copy with no owner on it was adopted by whoever
     signed in first (r73 § 2-7). They are written under the account the
     moment they are written now, by one function (acctPut, www/core.js
     § ACCT), so the key carries the uid by construction. Which of them goes
     up, and by what road, is ACCT_ROADS below -- one row per thing an
     account holds, counted off the `acctKeep('…')` calls in www/. */
  'core.js:acctKey(name': { whose: 'acct', phone: 'an account\'s things, each under `lingua.<name>.<uid>` -- ACCT_ROADS below says where each one goes' },
  /* and the same keys written once by the move from an older version, for
     the account `lingua.set`'s stamp named (acctMoved) */
  'core.js:acctKey(e.name': { whose: 'acct', phone: 'the move (acctMoved, www/core.js): an older version\'s live copy, written under the account its stamp named. It copies and removes nothing' },
  /* and the one write that is not an account's: deleting an account takes its
     part of an older version's shared key -- the rows of the one index every
     account shared, the fields of `lingua.set` beside the handset's setup --
     and writes the rest back exactly as it was */
  'core.js:e.old': { whose: 'old', phone: 'an older version\'s key with the deleted account\'s part taken out and the rest -- nobody\'s, read by nobody -- written back as it was (lsWipeAcct, www/core.js)' },
  /* and the settings written back without the keyboard's measurement
     (setVvkbDrop, OWNER 2026-09-26) -- `lingua.set` and each
     `lingua.set.<uid>`, one field fewer, nothing else moved */
  'core.js:k': { whose: 'same', phone: 'nothing of its own. It is setVvkbDrop() in www/core.js writing `lingua.set` and each account\'s `lingua.set.<uid>` back with `vvkb` -- a measurement of this screen\'s keyboard that nothing reads since 2026-09-25 -- taken out and every other field as it was, so each key it writes is `LS_S` or `acctKey(name` above (DELETE REVIEW docs/CHANGELOG.md 2026-09-25, 「1 消す」 OWNER 2026-09-26)' },
  'core.js:LS_S':    { whose: 'handset', phone: 'how this handset is set up -- exactly what `SET_PHONE` in www/core.js names and nothing else. The account\'s fields are `lingua.set.<uid>` (acctKey above); what an older version left in this key beside the setup is kept as it was and read by nobody' },
  'net.js:LS_SESS':  { whose: 'sess', phone: 'the tokens. They are what talks to the server; they cannot be kept on it' }
  /* `sns.js:k` -- the notices, kept under the account -- STOOD HERE AND IS
     GONE. The copy was what the notices screen drew in its first frame, and
     drawing it meant drawing last session's faces and swapping them a second
     later 「アイコンも1秒遅れ表示」 OWNER 2026-09-05. The notices are asked
     for when the app opens now (www/sns.js § WHAT AN OPEN ASKS FOR), so the
     answer is here before anybody presses the bell and there is no second of
     blank for a stale copy to cover. Nothing on this phone keeps them. */
};

const files = fs.readdirSync(WWW).filter(f => f.endsWith('.js'));
const found = new Map();
for (const f of files) {
  const src = fs.readFileSync(path.join(WWW, f), 'utf8');
  const re = /localStorage\.setItem\(([^,]+),/g;
  let m;
  while ((m = re.exec(src))) {
    const k = f + ':' + m[1].trim();
    if (!found.has(k)) found.set(k, []);
    found.get(k).push(f + ':' + src.slice(0, m.index).split('\n').length);
  }
}

const net = fs.readFileSync(path.join(WWW, 'net.js'), 'utf8');
const bad = [];
for (const [k, where] of found) {
  const road = ROADS[k];
  if (!road) {
    bad.push('`' + k + '` is written to localStorage (' + where[0] + ') and ' +
      'tools/store-check.mjs does not say where it goes. Every key is either ' +
      'on a road to the server or one of the phone\'s own with a reason — ' +
      'add it to ROADS. A key nobody wrote down is somebody\'s work living on ' +
      'one handset.');
    continue;
  }
  if (road.to && net.indexOf('function ' + road.to + '(') < 0)
    bad.push('`' + k + '` says it goes up through ' + road.to + '() and ' +
      'www/net.js has no such function. A road that is named and not built ' +
      'is the shape every one of these faults has had.');
}
/* And the other way: a road written down for a key nothing writes any more is
   permission that outlived what it described -- the same rot box-check names
   in tools/box-baseline.txt. */
for (const k of Object.keys(ROADS))
  if (!found.has(k))
    bad.push('ROADS names `' + k + '` and nothing writes it any more — delete ' +
      'the line.');

/* WHOSE EVERY KEY IS, and the answer is one of four (r73 § 2-7): an ACCOUNT's
   -- and then it is built by acctKey(), which puts the uid on it, because
   that is the only way a key can answer 「which account」 from its first
   byte -- a LANGUAGE's (`lingua.<id>.…`, whose account its `owner` says),
   this HANDSET's setup, or the SESSION, which is which account this phone
   is. `same` is keepBack() writing a key back as it was a moment ago, and
   `old` is an older version's key with a deleted account's part taken out.
   A row with none of these is a thing nobody said whose it is. */
const WHOSE = ['acct', 'lang', 'handset', 'sess', 'same', 'old'];
const whoseN = {};
for (const [k, road] of Object.entries(ROADS)) {
  if (WHOSE.indexOf(road.whose) < 0) {
    bad.push('ROADS row `' + k + '` does not say whose it is (`whose`: ' +
      WHOSE.join(' / ') + '). 「a thing that cannot answer 『which account』 is ' +
      'a thing that must not be written down」 CLAUDE.md § Online.');
    continue;
  }
  if (road.whose === 'acct' && k.split(':')[1].indexOf('acctKey(') !== 0)
    bad.push('ROADS row `' + k + '` says it is an account\'s and is not built ' +
      'by acctKey() -- a key of an account\'s that does not carry its uid is ' +
      'the copy that was adopted by whoever signed in first (r73 § 2-7).');
  if (found.has(k)) whoseN[road.whose] = (whoseN[road.whose] || 0) + found.get(k).length;
}

/* AND WHAT EACH OF THOSE ACCOUNT KEYS IS, one row per `acctKeep('<name>'`
   in www/ -- the container's own list (www/core.js § ACCT), read off the
   source rather than restated, and held both ways like ROADS. */
const ACCT_ROADS = {
  me:     { to: 'netProfPut' },
  posts:  { to: 'netPush' },
  drafts: { to: 'netDraftUp' },
  set:    { phone: 'the account\'s fields of the settings -- FIELDS below answers for each one, and the ones with a road go up by it' },
  langs:  { phone: 'a picture, for looking at, of which languages this account had the last time the server answered -- 「前に読み込んだの出していいよ」 OWNER 2026-09-12. What they ARE is the `language` table, and `owner=eq.<me>` is the whole of the list: netLangsDown() REPLACES this from that answer (www/net.js § netLangsGone, 2026-09-15). No road UP and nothing counts from it (www/core.js § LMINE)' },
  cur:    { phone: 'which of this account\'s languages is open -- where somebody is standing, not what they made' },
  take:   { phone: 'which of somebody else\'s languages this account had TAKEN, as the `language_take` table last answered (www/core.js § LTAKE). A picture of a server answer so a launch with no signal draws them: 「前に読み込んだの出していいよ。何か更新するならクルクルが必要」 OWNER 2026-09-12. No road UP -- netTakes() is what asks' }
};
const kept = new Map();
for (const f of files) {
  const src = fs.readFileSync(path.join(WWW, f), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const re = /acctKeep\('([A-Za-z0-9_]+)'/g;
  let m;
  while ((m = re.exec(src))) kept.set(m[1], f);
}
for (const [n, f] of kept) {
  const road = ACCT_ROADS[n];
  if (!road) bad.push('`acctKeep(\'' + n + '\')` in ' + f + ' is an account\'s thing ' +
    'kept on this phone and tools/store-check.mjs does not say where it goes -- add it ' +
    'to ACCT_ROADS.');
  else if (road.to && net.indexOf('function ' + road.to + '(') < 0)
    bad.push('ACCT_ROADS says `' + n + '` goes up through ' + road.to + '() and ' +
      'www/net.js has no such function.');
}
for (const n of Object.keys(ACCT_ROADS))
  if (!kept.has(n))
    bad.push('ACCT_ROADS names `' + n + '` and nothing keeps it any more — delete the line.');

/* Every field of `SET` that anything WRITES, and where it goes. Same two
   answers as ROADS: `to` is the function in www/net.js that takes it up, and
   `phone` is a sentence saying why it is this handset's own.

   `to` is a road and `phone` is a reason. The reason has to name an account or
   say why the question does not arise -- 「the settings」 is not a reason any
   more, because the settings are an account's too (CLAUDE.md § Online,
   2026-09-03). The point of the table is the ones whose sentence names a gap. */
const FIELDS = {
  /* WHAT SOMEBODY PAYS IS NOT IN THIS FILE AT ALL (2026-09-11).
     「オンラインで 1 端末に 1 アカウント…段 ── 答えは全部サーバー」 OWNER.
     `SET.plan` was a row here, with `netPlanVerify` as its road; the answer
     that road brings back is held in MEMORY now (www/core.js § PLAN) and
     never written down, so there is no key for this table to ask about.
     A slice-shaped thing in memory is rule 22's shape, and the plan is the
     last of the four fields that used to sit on the disk beside it. */
  /* the searches somebody starred. The server is the record and this is the
     copy the screen draws in the first frame -- www/sns.js says so. */
  saved:    { to: 'netSearchSave' },
  /* and the words somebody merely TYPED, which is a different table and a
     different road -- www/sns.js says why the two are never one. Five of
     them, newest first, the copy the list draws in the first frame. */
  recent:   { to: 'netRecentAdd' },

  /* --- and the phone's own, each for its own reason --------------------- */
  /* `savedUp` STOOD HERE: whether this phone had handed its ☆ up once. The
     hand-over is gone (r79 -- 「オンラインのみ」 2026-09-04 and rule 22 over
     「次つながった時に更新される」) and nothing writes it; a phone that has it
     keeps it. What a phone that never handed over had is kept instead: */
  savedWas: { phone: 'the ☆ list a phone had before `saved_search` existed and never handed over, copied ONCE when the server\'s answer is written over `saved` -- read by nothing, removed by nothing (「読まない、消さない」 2026-09-03). The account\'s, under `lingua.set.<uid>`' },
  /* `plan`, `planWas`, `planV` and `planUid` STOOD HERE AND ARE GONE
     (2026-09-11). 「オンラインで 1 端末に 1 アカウント…段 ── 答えは全部
     サーバー」 OWNER: what an account pays is `verify-plan`'s answer and it is
     held in MEMORY (www/core.js § PLAN), so there is no field of the settings
     about money at all. A phone that has them keeps them and nothing reads
     them (docs/DATA_SAFETY.md rule 2); a new one never writes one.

     WHICH ACCOUNT'S THINGS WERE LIVE HERE is what an older version wrote in
     `acct`, and it is READ now and written by nobody: it names whose the
     live keys with no owner on them were, and the move from that shape
     (acctMoved, www/core.js) copies those under that account's name. Nothing
     is parked any more -- an account's things are written under its uid the
     moment they are written (§ ACCT). */
  acct:     { phone: 'what an older version wrote to say whose the live copies were. Read by the move that files them under that account (acctMoved) and by the deletion of that account; written by nothing' },
  acctMoved: { phone: 'which of an older version\'s live copies have been moved under the account `acct` named -- a migration mark, once per thing, so the move never runs a second time over a copy that has moved on since' },
  /* How far down the notices somebody has read -- one time, not a table of
     read notices (「サーバーの既読の表は要りません」 2026-09-01), and the
     account's, so it goes up with the other settings (r79). */
  notAt:    { to: 'netPrefsPut' },
  /* THE ONE THING ABOUT THE ONBOARDING THAT IS THIS HANDSET'S, and the owner
     put it here (2026-09-09, choice A). It was `done` and answered two
     questions: 「has this ACCOUNT been through」, which is the `profile` row on
     the server and is asked there now (www/me.js § ME_ROW), and this one --
     「which screen does a phone with NO SESSION open on」. Nothing on a server
     can answer that: signed out there is nobody to ask, and after an account
     is deleted the row is gone. Read by ONE line (appIs, www/shell.js),
     written by two (the door and wipeHere). */
  walked:   { phone: 'whether this HANDSET has been past the walk. It decides one thing and nothing else: a phone with no session opens on the door rather than on the drawing screen — 「ログアウトしたら普通にログイン画面だけ出せばいいやろ」 OWNER 2026-08-26 and 「アカウント削除した後オンボーディングから始まるのはなぜ？」 OWNER 2026-09-03' },
  obback:   { phone: 'where to come back to after the door, held between two screens of one journey' },
  /* THE FIVE THAT WENT WITH THE ACCOUNT ON 2026-09-09. Every one of them
     said 「this handset」 above this line until then, and that sentence was
     wrong about all five: signing in on a second phone gave somebody the app
     arranged the way that PHONE happened to be, not the way they arrange it.
     `SET_PREFS` in www/core.js is the list and `profile.prefs` is the one
     jsonb column that carries it. 「アカウントごとってずっと言ってるよな？」 */
  ui:       { to: 'netPrefsPut' },
  theme:    { to: 'netPrefsPut' },
  myfont:   { to: 'netPrefsPut' },
  showScript: { to: 'netPrefsPut' },
  kbrom:    { to: 'netPrefsPut' },
  /* AND THE NOTIFICATIONS (2026-09-22). 「それに加えて設定で個別通知の
     オンオフできるように。」 OWNER. Which kinds somebody wants told to them
     is theirs and follows them to the next phone; the PERMISSION, which is
     the handset's, is iOS's and is written down nowhere in this app --
     www/push.js says why a copy of it would be wrong. `absent` is ON, on
     both sides, so nothing is minted into setDefaults() and a phone that
     has never opened the room has none of these. */
  push_follow: { to: 'netPrefsPut' },
  push_reply:  { to: 'netPrefsPut' },
  push_quote:  { to: 'netPrefsPut' },
  push_like:   { to: 'netPrefsPut' },
  push_boost:  { to: 'netPrefsPut' },
  /* And the day's prompt (OWNER 2026-09-23). The kinds are push-send's
     `PUSH`; tools/push-check.mjs holds `SET_PREFS` to it, and this table has
     to name each field by hand because it reads `SET.x =` off the source. */
  push_prompt: { to: 'netPrefsPut' },
  /* `vvkb` STOOD HERE AND IS GONE (2026-09-25). It was how much of this
     screen the keyboard covered, measured by the page; the phone ends the
     screen at the keyboard itself now (ios/App/App/MainViewController.swift
     § keepStill) and nothing writes or reads it. A phone that has it has it
     taken off at launch -- setVvkbDrop() in www/core.js, 「1 消す」 OWNER
     2026-09-26, the DELETE REVIEW in docs/CHANGELOG.md 2026-09-25. */
  opened:   { phone: 'how many times this ACCOUNT has opened the app, counted by rateOpen() (www/core.js) so the fifth asks the App Store for a rating (OWNER 2026-09-25). Filed under `lingua.set.<uid>` with the rest of the account\'s settings, and sent nowhere: a launch sends nothing' },
  wldMoved: { phone: 'the mark that 「what the language is for」 has been moved out of the settings and into the language. A migration mark, and the ACCOUNT\'s like `SET.world` it marks: kept with it under `lingua.set.<uid>`, so the next account to sign in has its own moved (r73 § 2-7)' },
  doneMoved: { phone: 'the mark that the old `done` has been copied into `walked` (walkedMigrate, www/core.js). A migration mark -- it is what the old field\'s absence used to say, now that the migration copies and removes nothing' },
  sndMoved: { phone: 'the mark that SET.snd -- the sounds from when there was one list per person -- has been copied into the language. A migration mark; SET.snd itself is left where it was, and this sits beside it under the same account' },
  /* `wsys` STOOD HERE AS A GAP AND IS GONE (2026-09-09). It was named rather
     than blessed -- 「言語のものなのに人の設定に入っているので、公開した言語は
     書記体系を見せられない」 -- and that is what closed: it is
     `language.wsys`, a column, read through langWsysOf() (www/core.js §
     LWSYS). Somebody with two languages had one answer for both of them
     until today. The field is not written any more and this check is what
     said so: 「FIELDS names SET.wsys and nothing writes it any more」. */

  /* --- and the four `setDefaults()` mints that nothing assigns ----------
     Every one of these is written to `lingua.set` on the first save of a
     fresh install, and every one is a shape from before the thing that
     replaced it. They are named rather than removed: taking a key out of
     setDefaults() is a change to what is stored, and www/ still reads two of
     them to migrate what is already on somebody's phone. */
  order:    { phone: 'the word order, from before a stage had one. phases.js copies it INTO the language\'s `phases` slice and leaves it standing (docs/DATA_SAFETY.md § 2), so this is the source of a migration rather than a setting anything reads' },
  script:   { phone: 'roman -> a borrowed character, from before LETTERS existed. letters.js migrateLetters() reads it to build the letters that were only ever characters, and leaves it standing. `false` is what a phone that never had one holds' },
  read:     { phone: 'NAMED AS A GAP. Nothing in www/ reads it — it is minted by setDefaults() on every fresh install and read by nobody. It is here so the key is not invisible; whether it goes is a deletion and needs the DELETE REVIEW in docs/DATA_SAFETY.md' },
  voice:    { phone: 'NAMED AS A GAP. The same as `read`: minted by setDefaults(), read by nothing in www/. Written down rather than quietly removed' }
};
/* The settings being READ BACK from the file is not a write of anybody's
   work, and it is the one computed one there is. Named by its expression the
   way ROADS names `core.js:langKey(k)`, so a second computed write -- which
   nothing here could name a field for -- is red. */
const SET_LOADER = {
  'core.js:SET[sk]=s[sk]': true,
  /* setGot() handing an account its own fields -- the defaults, then what
     `lingua.set.<uid>` holds (www/core.js § ACCT). Every name it writes is a
     name `SET` itself holds or setDefaults() mints, and every one of those is
     in FIELDS. */
  'core.js:SET[k]=d[k]': true,
  'core.js:SET[k]=v[k]': true,
  /* netMyProfile() handing this account back how it has the app set up.
     The names it writes are `SET_PREFS` in www/core.js and nothing else --
     it walks that list -- so every field it can touch is one FIELDS answers
     for below, each with `netPrefsPut` as its road. Writing the five out by
     name here would be that list a second time, which is the fault the list
     exists to end. */
  'net.js:SET[k]=p[k]': true
};

/* Comments carry `SET.x` in prose all over www/, so they come off first --
   the same reason act-check strips them before counting names. */
function nocomment(src){
  return src.replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}
const fields = new Map();
const computed = [];
for (const f of files) {
  const src = nocomment(fs.readFileSync(path.join(WWW, f), 'utf8'));
  let m;
  const re = /SET\.([A-Za-z0-9_]+)\s*(?:=[^=]|\+\+|--)/g;
  while ((m = re.exec(src))) {
    if (!fields.has(m[1])) fields.set(m[1], []);
    fields.get(m[1]).push(f);
  }
  const rc = /SET\[[^\]]+\]\s*=\s*[^=][^;\n]*/g;
  while ((m = rc.exec(src))) computed.push(f + ':' + m[0].replace(/\s+/g, ''));
}

/* AND THE ONES NOTHING ASSIGNS. `setDefaults()` in www/core.js is what a
   person's settings ARE before they touch anything, and every key in its
   literal is written to `lingua.set` by the first save this app makes --
   without any `SET.x =` anywhere for the search above to find. So a field can
   be on every handset, in every export and in every backup, and be invisible
   to a table whose whole job is that nothing is kept unnamed. `plan()` is
   the worked example one level up; these are the same fault one level further
   in, and `order` `read` `voice` `script` sat there. */
{
  const core = fs.readFileSync(path.join(WWW, 'core.js'), 'utf8');
  const m = /function setDefaults\(\)\s*\{\s*return\s*\{([\s\S]*?)\};/.exec(core);
  if (!m)
    bad.push('www/core.js has no `function setDefaults(){ return { … }; }` for ' +
      'tools/store-check.mjs to read. It is what a settings key is before ' +
      'anybody touches it, so every name in it is a place something is kept — ' +
      'if it moved, point this at where it moved to.');
  else {
    const re = /(^|[,{\s])([A-Za-z0-9_]+)\s*:/g;
    let d;
    while ((d = re.exec(m[1]))) {
      const k = d[2];
      if (!fields.has(k)) fields.set(k, []);
      fields.get(k).push('core.js:setDefaults()');
    }
  }
}
for (const c of computed)
  if (!SET_LOADER[c])
    bad.push('`' + c + '` writes a field of the settings whose NAME cannot be ' +
      'read here, so nothing can say where it goes. Write it as `SET.<name> =` ' +
      'and add the name to FIELDS, or say here why it is not a place anything ' +
      'is kept.');
for (const [k, where] of fields) {
  const road = FIELDS[k];
  if (!road) {
    bad.push('`SET.' + k + '` is written (' + where[0] + ') and ' +
      'tools/store-check.mjs does not say where it goes. `lingua.set` is one ' +
      'key with one answer and everything inside it is a place to keep ' +
      'something — add it to FIELDS, on a road or as the phone\'s own with a ' +
      'reason.');
    continue;
  }
  if (road.to && net.indexOf('function ' + road.to + '(') < 0)
    bad.push('`SET.' + k + '` says it goes up through ' + road.to + '() and ' +
      'www/net.js has no such function.');
}
for (const k of Object.keys(FIELDS))
  if (!fields.has(k))
    bad.push('FIELDS names `SET.' + k + '` and nothing writes it any more — ' +
      'delete the line.');
for (const k of Object.keys(SET_LOADER))
  if (computed.indexOf(k) < 0)
    bad.push('SET_LOADER names `' + k + '` and nothing writes it any more — ' +
      'delete the line.');

/* AND THE OTHER TABLE THAT ANSWERS THE SAME QUESTION, HELD AGAINST THIS ONE.
   「全部アカウントだって言ってるやん おかしいだろお前一本化しろって。」
   OWNER 2026-09-04.

   FIELDS above says where a settings field GOES. `SET_PHONE` in www/core.js
   says whose it IS -- whether signing in as somebody else parks it and
   deleting an account takes it. Two tables about one key, and they drifted:
   `recent`, the words somebody typed into the search field, was written down
   here on the day it was added and never reached the other one, so a person
   deleted their account and their search history was still on the screen.

   The other table is now the SHORT one -- what this handset's own setup is --
   and everything not in it is an account's, which is why a field added
   tomorrow travels without anybody remembering. What is left to go wrong is
   this table and that one disagreeing about a NAME, and that is what is asked
   here, both ways:

     named as the handset's there  ->  has to be `phone` here, with a reason
     on a road to the server here  ->  may not be named there at all

   A field on a road is a thing an account has; naming it as this handset's
   setup would be handing one account's belongings to the next person, which
   is the shape of every fault this file exists for. */
{
  const core = fs.readFileSync(path.join(WWW, 'core.js'), 'utf8');
  const m = /var SET_PHONE=\[([\s\S]*?)\];/.exec(core);
  if (!m)
    bad.push('www/core.js has no `var SET_PHONE=[ … ];` for tools/store-check.mjs ' +
      'to read. It is the list of settings fields that are this HANDSET\'s setup, ' +
      'and everything not in it is an account\'s — if it moved, point this at ' +
      'where it moved to. If it became a list of what IS an account\'s again, ' +
      'that is the 2026-09-04 fault coming back: a field added tomorrow would ' +
      'be left behind.');
  else {
    const named = (m[1].match(/'([A-Za-z0-9_]+)'/g) || []).map(x => x.slice(1, -1));
    for (const k of named) {
      const road = FIELDS[k];
      if (!road)
        bad.push('`SET_PHONE` in www/core.js names `' + k + '` and ' +
          'tools/store-check.mjs does not say where it goes. A field called ' +
          'this handset\'s setup in one place and unnamed in the other is the ' +
          'drift that left the search history behind — add it to FIELDS.');
      else if (road.to)
        bad.push('`SET_PHONE` in www/core.js names `' + k + '` as this ' +
          'handset\'s setup, and FIELDS says it goes up through ' + road.to +
          '(). A field that goes to the server is an ACCOUNT\'s: named there, ' +
          'it is not parked when somebody else signs in and not taken when ' +
          'the account is deleted — it is handed to the next person.');
    }
    const acct = Object.keys(FIELDS).filter(k => named.indexOf(k) < 0);
    console.log('and whose they are: ' + named.length + ' this handset\'s setup, ' +
                acct.length + ' an account\'s — counted, not listed (SET_PHONE, www/core.js)');
  }
}

const phone = Object.keys(ROADS).filter(k => ROADS[k].phone).length;
const up = Object.keys(ROADS).filter(k => ROADS[k].to).length;
const fPhone = Object.keys(FIELDS).filter(k => FIELDS[k].phone).length;
const fUp = Object.keys(FIELDS).filter(k => FIELDS[k].to).length;
console.log('whose every key is: ' + WHOSE.map(w => (whoseN[w] || 0) + ' ' + w).join(', ') +
  ' — and an account\'s things: ' + kept.size + ' (' + [...kept.keys()].join(' ') +
  '), each under its uid');
console.log('what this phone keeps: ' + found.size + ' keys — ' + up +
            ' with a road to the server, ' + phone + ' the phone\'s own and said why');
console.log('and inside lingua.set: ' + fields.size + ' fields — ' + fUp +
            ' with a road, ' + fPhone + ' the phone\'s own and said why');
if (bad.length) {
  console.log('\nFAILED (' + bad.length + '):');
  bad.forEach(b => console.log('  ' + b));
  process.exit(1);
}
console.log('nothing is kept on this phone alone: every key either goes up, or\n' +
            'is one of the phone\'s own and says which and why — and that is\n' +
            'asked of the fields inside the settings too, not just of the key.');
