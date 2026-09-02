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

const phone = Object.keys(ROADS).filter(k => ROADS[k].phone).length;
const up = Object.keys(ROADS).filter(k => ROADS[k].to).length;
console.log('what this phone keeps: ' + found.size + ' keys — ' + up +
            ' with a road to the server, ' + phone + ' the phone\'s own and said why');
if (bad.length) {
  console.log('\nFAILED (' + bad.length + '):');
  bad.forEach(b => console.log('  ' + b));
  process.exit(1);
}
console.log('nothing is kept on this phone alone: every key either goes up, or\n' +
            'is one of the phone\'s own and says which and why.');
