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
   nothing here went red for it. `SET.plan` is the worked example and it is
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
  'core.js:slGotKey(k)': { phone: 'what the server last said this slice was, kept so a launch with no signal draws the language instead of nothing. It belongs to the account the slice does -- filed under `lingua.<id>.<slice>`, so wipeLangsGo() takes it with the language and lsWipeAcct(), which counts the namespace, takes it with the account. It has no road UP and must not be given one: `slMine()` in www/core.js is what keeps it out of netSlice1(), netSaveUpGo() and both of the 「fills in and stops」 reads' },
  /* AND ONE WRITE THAT ADDS NO KEY, because it is the same keys put back.
     keepSave() in www/shell.js takes a copy of the `lingua.` namespace before
     a save writes anything and writes it back when the send does not land
     (「先にサーバーじゃないの？」 OWNER 2026-09-06), so every key this can
     touch is a key that was already on this phone a moment earlier and has
     its own row somewhere in this table. It cannot invent one: a key that is
     not in the copy is REMOVED rather than written. */
  'shell.js:k': { phone: 'nothing of its own. It is keepBack() in www/shell.js putting the `lingua.` namespace back exactly as it was before a save that did not reach the server, so each key it writes is one of the others in this table, with the value it already had' },
  /* the timeline */
  'post.js:LS_POSTS':  { to: 'netPush' },
  'post.js:LS_DRAFTS': { to: 'netDraftUp' },
  /* the face and the line about yourself go up on their own timers; the
     handle and the display name are written when the account is made */
  'me.js:LS_ME':       { to: 'netAvSync' },
  /* and the four that are the phone's, each for its own reason */
  'core.js:LS_S':    { phone: 'the settings. Everything in them is an account\'s and is parked under `lingua.set.<uid>` by setFor() EXCEPT what `SET_PHONE` in www/core.js names; what that names is how this handset is set up -- the theme, the interface language, the marks that a migration has run here -- and follows the handset because there is nothing else for it to follow' },
  'core.js:LS_LANGS':{ phone: 'the index of which languages are on THIS phone; what they ARE is `language` on the server, and netLangsDown() writes this from it' },
  'core.js:LS_CUR':  { phone: 'which language is open -- where somebody is standing, not what they made' },
  'net.js:LS_SESS':  { phone: 'the tokens. They are what talks to the server; they cannot be kept on it' },
  /* もう一つの預け。meParkKey / postParkKey と同じ形で、SET のうち
     アカウントのものだけ ── 段、その前の段、まだ送れていない段、保存した検索、
     それを一度上げたか、通知をどこまで読んだか。テーマや表示言語はこの端末の
     設え方なので入っていません。 */
  'core.js:setParkKey(was)': { phone: 'another account\'s plan, starred searches and notice marker, parked while this one is signed in. They came from `plan`, `saved_search` and the notices RPC, and go back there' },
  'me.js:meParkKey(had)': { phone: 'another account\'s `me`, parked while this one is signed in. It came from `profile` and goes back there' },
  /* The same shape as meParkKey, one file over and for the same fault: a new
     account\'s own page was showing the last one\'s timeline, because the copy
     kept for working with no signal had no owner on it. Parked and not
     deleted -- what is in it came from `post` and `draft` and goes back there
     the moment that account signs in again. */
  'post.js:postParkKey(had': { phone: 'another account\'s posts and drafts, parked while this one is signed in. They came from `post` and `draft` and go back there' }
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

/* Every field of `SET` that anything WRITES, and where it goes. Same two
   answers as ROADS: `to` is the function in www/net.js that takes it up, and
   `phone` is a sentence saying why it is this handset's own.

   `to` is a road and `phone` is a reason. The reason has to name an account or
   say why the question does not arise -- 「the settings」 is not a reason any
   more, because the settings are an account's too (CLAUDE.md § Online,
   2026-09-03). The point of the table is the ones whose sentence names a gap. */
const FIELDS = {
  /* what somebody pays. It is the ACCOUNT's -- 「課金とアカウントとキーボードは
     アカウントに結びつく」 -- and `SET.plan` is where the value sits on this
     phone while it travels. */
  /* The road is netPlanVerify(), and it goes the other way from every other
     row in this table: what goes UP is the signed receipt, and the plan comes
     BACK. `SET.plan` is where the answer sits on this phone until the next
     one. 「だから端末でやるわけねえだろ」 OWNER 2026-09-03 -- there is no road
     from here to the `plan` table any more, and `planPend`, which held what
     this phone had not managed to tell the server, went with it: a phone that
     holds no opinion has nothing left unsent. */
  plan:     { to: 'netPlanVerify' },
  /* the searches somebody starred. The server is the record and this is the
     copy the screen draws in the first frame -- www/sns.js says so. */
  saved:    { to: 'netSearchSave' },
  /* and the words somebody merely TYPED, which is a different table and a
     different road -- www/sns.js says why the two are never one. Five of
     them, newest first, the copy the list draws in the first frame. */
  recent:   { to: 'netRecentAdd' },

  /* --- and the phone's own, each for its own reason --------------------- */
  savedUp:  { phone: 'whether this phone has sent its starred searches up ONCE. A mark about the road above, not a thing travelling on it' },
  planWas:  { phone: 'the plan this phone last SAW, which is the only thing capLapse() has to compare against. Not what anybody paid -- a fact about this launch and the one before it' },
  planV:    { phone: 'which of the two worlds the plan WORD was written in, before the 2026-08-23 rename. Absent means 「written before it」, and that is the only signal there is' },
  /* WHOSE the plan above is. It goes NOWHERE, and that is the answer rather
     than a gap: the account already knows what it pays -- that is the `plan`
     row this table sends `SET.plan` to -- so sending this up would be telling
     an account its own name. What it answers is the question only a HANDSET
     can be asked: 「is the plan sitting on me the one that was bought by the
     person signed in now?」 On a phone the real copy is in the Keychain
     (ios/App/App/LinguaPlan.swift) and setOnDisk() keeps this out of the
     settings file entirely, for the reason it keeps the plan out -- an owner
     written in a file that goes into a PC backup is an owner anybody with a
     cable can forge, and forging it takes somebody else's subscription rather
     than raising your own. In a browser, and in every check under tools/,
     there is no Keychain and it stays here, exactly as the plan does. */
  planUid:  { phone: 'the account that bought the plan this phone is holding. A mark about WHOSE the copy above is, not a second place the plan lives — and the one thing here that a handset can be asked and an account cannot' },
  notAt:    { phone: 'how far down the notices somebody has read. THE SERVER HOLDS NO READ MARKER and that is a decision — 「サーバーの既読の表は要りません」, www/sns.js' },
  done:     { phone: 'whether the walk has been finished on this install. It is what tells the onboarding from the app' },
  obback:   { phone: 'where to come back to after the door, held between two screens of one journey' },
  ui:       { phone: 'which of the ten interface languages this handset reads in' },
  theme:    { phone: 'light or dark' },
  myfont:   { phone: 'whether the font built from the drawn letters is used on screen' },
  showScript: { phone: 'whether the drawn letters are shown rather than the roman ones' },
  kbrom:    { phone: 'whether the keyboard shows its roman face' },
  vvkb:     { phone: 'how much of THIS screen the phone\'s own keyboard covers. A measurement of one handset and meaningless on another' },
  wldMoved: { phone: 'the mark that 「what the language is for」 has been moved out of the settings and into the language. A migration mark' },
  /* NAMED AS A GAP RATHER THAN BLESSED. www/home.js says it in its own words:
     「the writing system is SET.wsys -- the PERSON's settings, not the
     language's -- so it is on no server and there is nothing to say」, which
     is why somebody else's language page cannot show one. A writing system is
     part of a language. It is here because that is where the code keeps it
     today, and it is written down so the gap is visible rather than covered
     by 「the settings」. */
  wsys:     { phone: 'the writing system. www/home.js names this as a GAP: it belongs to the language and is in the settings, so it is on no server and a published language cannot show one' },

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
  /* setFor() handing an account its own fields back. The name it writes is a
     name it has just read out of the parked copy, so there is no field here
     that FIELDS does not already answer for -- what could be parked is what
     `SET` held, and every one of those is in the table. */
  'core.js:SET[k]=got[k]': true
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
   to a table whose whole job is that nothing is kept unnamed. `SET.plan` is
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
