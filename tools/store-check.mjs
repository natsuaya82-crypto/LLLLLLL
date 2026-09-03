/* Nothing is kept on this phone alone.
   ---------------------------------------------------------------------
   「最初からオンライン前提で作れ」「SNSは全部サーバー」「基本は全部サーバー管理」

   The app is online. The server is where things live, and `localStorage` is
   the copy that runs with no signal -- CLAUDE.md § Online. Three things are
   the phone's own and that is the whole list: a language's backup file, an
   exported sheet, and the settings.

   THAT SENTENCE WAS WRITING ONLY, and writing does not stop anything. The
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
   that covers a thing, read as covering everything inside it.
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
  /* the language: every slice, up and down, once a launch */
  "core.js:langKey('words')":   { to: 'netSlicePut' },
  "core.js:langKey('lines')":   { to: 'netSlicePut' },
  "core.js:langKey('lang')":    { to: 'netSlicePut' },
  "core.js:langKey('script')":  { to: 'netSlicePut' },
  "letters.js:langKey('letters')": { to: 'netSlicePut' },
  "notes.js:langKey('notes')":  { to: 'netSlicePut' },
  "phases.js:langKey('phases')":{ to: 'netSlicePut' },
  "sound.js:langKey('snd')":    { to: 'netSlicePut' },
  "keyboard.js:langKey('kb')":  { to: 'netSlicePut' },
  "home.js:langKey('wld')":     { to: 'netSlicePut' },
  'core.js:langKey(k)':         { to: 'netSlicePut' },
  'backup.js:langKey(k)':       { to: 'netSlicePut' },
  'home.js:langKeyOf(id':       { to: 'netSlicePut' },
  'net.js:langKeyOf(id':        { to: 'netSlicePut' },
  'net.js:langKeyOf(sid':       { to: 'netSlicePut' },
  /* the timeline */
  'post.js:LS_POSTS':  { to: 'netPush' },
  'post.js:LS_DRAFTS': { to: 'netDraftUp' },
  /* the face and the line about yourself go up on their own timers; the
     handle and the display name are written when the account is made */
  'me.js:LS_ME':       { to: 'netAvSync' },
  /* and the four that are the phone's, each for its own reason */
  'core.js:LS_S':    { phone: 'the settings -- one of the three things that are the phone\'s' },
  'core.js:LS_LANGS':{ phone: 'the index of which languages are on THIS phone; what they ARE is `language` on the server, and netLangsDown() writes this from it' },
  'core.js:LS_CUR':  { phone: 'which language is open -- where somebody is standing, not what they made' },
  'net.js:LS_SESS':  { phone: 'the tokens. They are what talks to the server; they cannot be kept on it' },
  "backup.js:langKey('bkn')": { phone: 'which generation the backup FILE is on. The file is the phone\'s by decision (CLAUDE.md § Online)' },
  'me.js:meParkKey(had)': { phone: 'another account\'s `me`, parked while this one is signed in. It came from `profile` and goes back there' },
  /* The notices are the server's own answer (`notices()` in schema.sql) --
     nothing here writes one, and the copy is what the screen draws in the
     first frame. netNotices() is the road, downward. */
  'sns.js:k': { to: 'netNotices' },
  /* `key` and `k` are the loops that walk the two above -- langKeyOf() in
     www/backup.js and langKey() in www/core.js -- so they are those roads
     and not a key of their own. */
  'net.js:key':     { to: 'netSlicePut' },
  'phases.js:key':  { to: 'netSlicePut' },
  /* The stage somebody wrote about, which used to live in the settings and
     belongs to the language. phases.js writes both while it moves them. */
  'phases.js:LS_S': { phone: 'the settings -- the same key core.js keeps, written from the migration that takes a stage OUT of it' }
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

   `lingua.set` is the phone's by decision -- CLAUDE.md § Online names the
   settings as one of the three -- so most of these say so. The point of the
   table is the ones that DO NOT, and the ones whose sentence names a gap. */
const FIELDS = {
  /* what somebody pays. It is the ACCOUNT's -- 「課金とアカウントとキーボードは
     アカウントに結びつく」 -- and `SET.plan` is where the value sits on this
     phone while it travels. */
  plan:     { to: 'netPlanUp' },
  /* and the one this phone is holding that the server has NOT been told:
     a launch opened with no signal, or closed before the answer came back.
     It is written before the send and cleared when the send lands, so it is
     an unfinished road rather than a second place the plan lives. */
  planPend: { to: 'netPlanUp' },
  /* the searches somebody starred. The server is the record and this is the
     copy the screen draws in the first frame -- www/sns.js says so. */
  saved:    { to: 'netSearchSave' },

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
  gramLang: { phone: 'the mark that the grammar was given its language once. A migration mark, not a thing somebody made' },
  wldMoved: { phone: 'the mark that 「what the language is for」 has been moved out of the settings and into the language. A migration mark' },
  /* NAMED AS A GAP RATHER THAN BLESSED. www/home.js says it in its own words:
     「the writing system is SET.wsys -- the PERSON's settings, not the
     language's -- so it is on no server and there is nothing to say」, which
     is why somebody else's language page cannot show one. A writing system is
     part of a language. It is here because that is where the code keeps it
     today, and it is written down so the gap is visible rather than covered
     by 「the settings」. */
  wsys:     { phone: 'the writing system. www/home.js names this as a GAP: it belongs to the language and is in the settings, so it is on no server and a published language cannot show one' }
};
/* The settings being READ BACK from the file is not a write of anybody's
   work, and it is the one computed one there is. Named by its expression the
   way ROADS names `core.js:langKey(k)`, so a second computed write -- which
   nothing here could name a field for -- is red. */
const SET_LOADER = { 'core.js:SET[sk]=s[sk]': true };

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
