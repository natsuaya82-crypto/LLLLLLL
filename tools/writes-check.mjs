/* One field of SET or ME is decided in one place, and what a person decided
   is not quietly written over by something else they did.
   ---------------------------------------------------------------------
   「バグが起きないように一つの穴を塞ぐ、スパゲティコード式の修正は今後一切
   禁止」 OWNER 2026-09-23, and CLAUDE.md § Simple: 「no question is answered
   in two places」.

   It was found as one hole: the switch on the alphabet turned the drawn
   letters off (setMyFont), and saving any letter turned them back on
   (geKeep) and sent the `true` to the account -- the person's `off` lasted
   until they next drew. Measured by r61-face. The same afternoon showed
   `SET.ui` written by two functions that were one line each and the same
   line (obLang and setUi), and the name and the @ put onto ME from the
   server's answer by the door while bio, link and place were put there by
   the launch.

   The surface is not those three. It is EVERY assignment to a field of SET
   or ME anywhere in www/, and this counts it: which function each write is
   in, for every field. A field written by ONE function is decided in one
   place and needs nothing said about it. A field written by two or more is
   named below, with every function that writes it and the sentence that
   says why that function is a different MOMENT and not a second answer --
   the walk's first value before anybody has decided anything, the server's
   answer arriving, an old field moved once. A field whose writers stop
   matching the table fails, both ways: a new writer nobody wrote down, and a
   named writer that no longer writes it (a line left standing is permission
   for a writer that is gone).

   And the writes whose field is not written in the source -- `SET[k]=`,
   `ME[k]=` -- can write ANY field, so each function that does it is named in
   DYNAMIC with what it is: a copy arriving from the server or going to the
   account it belongs to, never a decision.

   What it cannot see, said so silence is not read as a check: whether a
   sentence below is TRUE. A person reads it. It holds that one is written.

   Run: node tools/writes-check.mjs                                       */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');

/* field -> { function: why this is a different moment } */
const WRITERS = {
  'SET.myfont': {
    setMyFont: 'the switch on the alphabet -- the person deciding',
    obDone: 'the walk: the first letter somebody draws, before there is a switch they could have touched',
  },
  'SET.showScript': {
    pkKeepSave: "a character borrowed on a letter's own page. There is no switch for this field and nothing sets it false, so nothing a person decided is written over",
    obTakeCh: 'a character borrowed in the walk -- the same moment, before the app is open',
  },
  'SET.walked': {
    walkedMigrate: 'the old field `done` moved once, on this phone, before anything reads it',
    obFinish: 'the walk ending at its last step',
    obIn: 'the door, reached from inside the app by somebody already through the walk',
    wipeHere: 'this language deleted: somebody who has been through the walk is not sent back to it',
  },
  'SET.obback': {
    obDoor: 'the door opened from somewhere: where to go back to is written down',
    obReturn: 'gone back there: the note is cleared',
  },
  'SET.recent': {
    askRecent: "the account's list arriving from the server",
    snsRecentAdd: 'a search made',
    snsDropRecent: 'the person taking one off',
  },
  'SET.saved': {
    askSaved: "the account's list arriving from the server",
    snsSaveQ: 'the person saving or unsaving a search',
    wipeHere: 'the account deleted on a phone whose settings carry no stamp (SET.acct absent), where lsWipeAcct() takes nothing. A HAND LIST and a plug: it takes four fields and leaves `recent`. The cover is lsWipeAcct() answering for an unstamped SET (www/core.js) -- docs/scope/r61-face.md. Take this line out with it',
  },
  'SET.savedUp': {
    askSaved: "this phone's list handed to the account once",
    wipeHere: 'the account deleted on a phone whose settings carry no stamp (SET.acct absent), where lsWipeAcct() takes nothing. A HAND LIST and a plug: it takes four fields and leaves `recent`. The cover is lsWipeAcct() answering for an unstamped SET (www/core.js) -- docs/scope/r61-face.md. Take this line out with it',
  },
  'SET.notAt': {
    notSeen: 'how far down the notices the person has read',
    wipeHere: 'the account deleted on a phone whose settings carry no stamp (SET.acct absent), where lsWipeAcct() takes nothing. A HAND LIST and a plug: it takes four fields and leaves `recent`. The cover is lsWipeAcct() answering for an unstamped SET (www/core.js) -- docs/scope/r61-face.md. Take this line out with it',
  },
  'SET.acct': {
    setFor: 'which account these settings are, stamped as that account arrives',
    lsWipeAcct: 'that account deleted: the stamp goes with its fields',
    wipeHere: 'the account deleted on a phone whose settings carry no stamp (SET.acct absent), where lsWipeAcct() takes nothing. A HAND LIST and a plug: it takes four fields and leaves `recent`. The cover is lsWipeAcct() answering for an unstamped SET (www/core.js) -- docs/scope/r61-face.md. Take this line out with it',
  },
  'ME.name': {
    meKeepPut: 'the profile editor -- the person deciding, written once the server has taken it',
    obIn: "the door: the account's own answer arriving at sign-in",
    obWhoGo: 'the door: the account made, with the name that was just sent and landed',
  },
  'ME.handle': {
    meKeepPut: 'the profile editor -- the person deciding, written once the server has taken it',
    obIn: "the door: the account's own answer arriving at sign-in",
    obWhoGo: 'the door: the account made, with the @ that was just sent and landed',
  },
  'ME.av': {
    meAvSet: 'the face, set once from the letter the walk drew',
    meAvGot: "the account's own face as the server holds it -- at sign-in, on a launch, and once a photograph chosen or taken off has landed (r46-audit § A1)",
  },
};

/* function -> what it is. A write through a computed key, or of the whole
   object at once: either can be any field. */
const DYNAMIC = {
  'SET': {
    '(top)': 'the load: a fresh install, every field its default',
    keepBack: 'a save that did not land: the snapshot from before it put back',
  },
  'SET[]': {
    '(top)': 'the load: what is on the disk read in over the defaults',
    setFor: "this account's own settings brought back, the one before it parked",
    lsWipeAcct: "the account deleted: its fields taken off the live copy",
    netPrefsPull: "the account's settings arriving from the server",
  },
  'ME': {
    '(top)': 'the load: nobody yet',
    meRead: 'what is on the disk read in',
    meFor: "this account's own copy brought back, the one before it parked",
    wipeHere: 'this language and this account deleted: back to nobody',
    keepBack: 'a save that did not land: the snapshot from before it put back',
  },
  'ME[]': {
    netProfSync: "the account's profile arriving at launch",
  },
};

/* ---- read -------------------------------------------------------------- */
/* Comments out, keeping every newline so a line number is a line number
   (box-check's lesson: a check that names the wrong line is believed). Then
   the insides of strings, so a brace or a `SET.x=` inside one is not code. */
function strip(src) {
  let out = '', i = 0, n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '*') {
      const e = src.indexOf('*/', i + 2), end = e < 0 ? n : e + 2;
      out += src.slice(i, end).replace(/[^\n]/g, ' '); i = end; continue;
    }
    if (c === '/' && d === '/') {
      const e = src.indexOf('\n', i), end = e < 0 ? n : e;
      out += ' '.repeat(end - i); i = end; continue;
    }
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < n && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      out += c + src.slice(i + 1, j).replace(/[^\n]/g, ' ') + c; i = j + 1; continue;
    }
    out += c; i++;
  }
  return out;
}

const found = {};   /* field -> { fn: [file:line] } */
let writes = 0, files = 0;
for (const f of fs.readdirSync(WWW).filter((x) => x.endsWith('.js')).sort()) {
  files++;
  const lines = strip(fs.readFileSync(path.join(WWW, f), 'utf8')).split('\n');
  let depth = 0, fn = '(top)';
  lines.forEach((ln, i) => {
    const m = depth === 0 && /^function\s+([A-Za-z_$][\w$]*)\s*\(/.exec(ln);
    if (m) fn = m[1];
    const re = /\b(SET|ME)\s*(?:\.\s*([A-Za-z_$][\w$]*)|(\[[^\]]*\]))\s*(=(?!=)|\+=|-=|\+\+|--)/g;
    let w;
    const put = (key) => {
      ((found[key] = found[key] || {})[fn] = found[key][fn] || []).push(f + ':' + (i + 1));
      writes++;
    };
    while ((w = re.exec(ln))) put(w[1] + (w[3] ? '[]' : '.' + w[2]));
    /* Taking a field away decides it as much as setting it does. */
    const del = /\bdelete\s+(SET|ME)\s*(?:\.\s*([A-Za-z_$][\w$]*)|(\[[^\]]*\]))/g;
    while ((w = del.exec(ln))) put(w[1] + (w[3] ? '[]' : '.' + w[2]));
    /* And the whole object at once, which is every field. */
    const all = /(^|[^.\w$])(SET|ME)\s*=(?!=)/g;
    while ((w = all.exec(ln))) put(w[2]);
    for (const ch of ln) { if (ch === '{') depth++; else if (ch === '}') depth--; }
    if (depth === 0) fn = '(top)';
  });
}

/* ---- ask ---------------------------------------------------------------- */
const fails = [];
let multi = 0;
const table = Object.assign({}, WRITERS, DYNAMIC);
for (const key of Object.keys(found).sort()) {
  const fns = Object.keys(found[key]).sort();
  const said = table[key];
  if (fns.length < 2 && !/\]$|^(SET|ME)$/.test(key) && !said) continue;
  multi++;
  if (!said) {
    fails.push(key + ' is written by ' + fns.length + ' functions and nothing says why:\n      ' +
               fns.map((x) => x + ' (' + found[key][x].join(' ') + ')').join('\n      '));
    continue;
  }
  for (const x of fns)
    if (!said[x])
      fails.push(key + ' is written by ' + x + ' (' + found[key][x].join(' ') +
                 ') and the table does not name it -- a second place deciding this field');
  for (const x of Object.keys(said))
    if (!found[key][x])
      fails.push(key + ': the table names ' + x + ' and it writes no ' + key +
                 ' any more -- take the line out');
}
for (const key of Object.keys(table))
  if (!found[key]) fails.push(key + ' is in the table and nothing writes it -- take the entry out');

if (fails.length) {
  console.error('\nwrites: ' + fails.length + ' field' + (fails.length > 1 ? 's' : '') +
                ' of SET or ME decided in more than one place with nothing saying why:\n');
  for (const f of fails) console.error('  ' + f + '\n');
  process.exit(1);
}
console.log('writes: ' + writes + ' writes to ' + Object.keys(found).length + ' fields of SET and ME in ' +
            files + ' files; ' + multi + ' are written from more than one place and every one\n' +
            '        of those places is named, with the moment it is.');
