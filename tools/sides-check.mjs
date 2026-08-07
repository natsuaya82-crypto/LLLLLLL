/* ---------------------------------------------------------------------------
   tools/sides-check.mjs — the two sides do not reach into each other.

   Run it:   node tools/sides-check.mjs

   This app is two things now. On one side somebody is making a language: one
   dictionary, one alphabet, one writing system, all open at once and all
   global, because 290 places say WORDS meaning "the one in front of me". On
   the other side is a timeline, where a post was written by somebody else, in
   a language this phone has never seen, by a person who is not you.

   Every global on the making side is a lie on the reading side, and it is a
   lie that tells the truth for as long as you are the only person here. That
   is what makes it dangerous: it will test green, screenshot right, and demo
   perfectly, and the day the second person arrives every post in the timeline
   will be signed with your name, wear your font and carry your letter.

   Four of them were live when this was written:

     postFace  took the post and ignored it, drawing the OPEN language's
               first letter -- so every post had my letter on it
     postRow   read the account for the name and handle -- so every post
               was by me
     .pline    was given myFontOn() -- so every post was in my font
     cardSrc   stamped langName across the foot of a card of anybody's post

   So www/post.js has a line across it, and below that line a post is rendered
   out of the post and nothing else. What travels with a post is put ON it when
   it is written, above the line, where the making side still exists: the name,
   the handle, the language's name, and the SHAPE of a letter rather than a
   reference to one.

   What the line cannot catch is the composer, which is above it and has to be:
   it is on the making side, and it renders one thing belonging to somebody
   else -- whom you are replying to. That said meName(), so every reply
   announced you were replying to yourself. Above the line, read it off the
   post you pressed reply on; there is no rule that can tell you so.

   The second rule here is smaller and is the other half of the same afternoon.
   postRow grew a second argument and the timeline still said list.map(postRow)
   -- which hands each row its index, so post 0 was fine and every post after
   it wore my font. Passing a two-argument function to map is never what was
   meant, and it reads as correct.
   --------------------------------------------------------------------------- */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WWW = path.join(HERE, '..', 'www');

/* Comments and string bodies blanked, newlines kept so line numbers survive.
   Without this the prose above -- which names every banned global in order --
   would fail the check it is explaining. */
function stripped(s) {
  let out = '', i = 0;
  while (i < s.length) {
    const c = s[i], d = s[i + 1];
    if (c === '/' && d === '/') { while (i < s.length && s[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') {
      i += 2;
      while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) { if (s[i] === '\n') out += '\n'; i++; }
      i += 2; continue;
    }
    if (c === '"' || c === "'") {
      out += c; i++;
      while (i < s.length && s[i] !== c) { if (s[i] === '\\') { out += ' '; i++; } out += ' '; i++; }
      out += c; i++; continue;
    }
    out += c; i++;
  }
  return out;
}

const fail = [];

/* ---- rule one: below the line, a post renders from the post -------------- */

const MARK = '==== below this line a post renders from the post ====';

/* The open language, the open dictionary, the drawn letters, the writing
   system, this phone's settings, and the account. Every one of these is
   "mine", and a timeline has no such thing. */
const MINE = [
  'WORDS', 'LETTERS', 'SND', 'STG', 'SET', 'NOTES', 'TALK',
  'langName', 'langId', 'langKey',
  'findWord', 'spOf', 'wMns', 'wPh', 'addedSnd', 'exGloss',
  'myFontOn', 'ltById', 'ltMain', 'ltHasShape', 'wsStrokes', 'chOf', 'inkOf',
  'ME', 'meName', 'meHandle', 'postAvatar', 'postGloss', 'postGlossLine'
];

const src = fs.readFileSync(path.join(WWW, 'post.js'), 'utf8');
const at = src.indexOf(MARK);
if (at < 0) {
  fail.push('www/post.js has lost the line that separates the two sides:\n' +
            '  ' + MARK);
} else {
  const before = src.slice(0, at);
  const lineNo = before.split('\n').length;
  const body = stripped(src).split('\n').slice(lineNo - 1);
  let n = 0;
  body.forEach((line, i) => {
    for (const name of MINE) {
      if (new RegExp('\\b' + name + '\\b').test(line)) {
        fail.push('www/post.js line ' + (lineNo + i) + ' renders a post out of ' +
                  name + ', which is the open language and not the post:\n' +
                  '  ' + line.trim());
        n++;
      }
    }
  });
  if (!n) console.log('post.js: ' + body.length + ' lines below the line, none of them yours');
}

/* ---- rule two: a two-argument function is never a map callback ------------
   map and forEach hand their callback (item, index, array). A function that
   takes one argument does not notice; a function that takes two is silently
   given a number where it expected a setting, a flag or an options object. */

const files = fs.readdirSync(WWW).filter((f) => f.endsWith('.js')).sort();
const arity = {};
for (const f of files) {
  const s = stripped(fs.readFileSync(path.join(WWW, f), 'utf8'));
  const re = /function\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)/g;
  let m;
  while ((m = re.exec(s))) {
    const args = m[2].split(',').map((a) => a.trim()).filter(Boolean);
    arity[m[1]] = args.length;
  }
}
let checked = 0;
for (const f of files) {
  const lines = stripped(fs.readFileSync(path.join(WWW, f), 'utf8')).split('\n');
  lines.forEach((line, i) => {
    const re = /\.(map|forEach|filter|some|every)\(\s*([A-Za-z0-9_$]+)\s*\)/g;
    let m;
    while ((m = re.exec(line))) {
      checked++;
      if (arity[m[2]] > 1)
        fail.push('www/' + f + ' line ' + (i + 1) + ': ' + m[2] + ' takes ' +
                  arity[m[2]] + ' arguments and ' + m[1] +
                  ' will hand it the index as the second:\n  ' + line.trim());
    }
  });
}
console.log('bare callbacks checked: ' + checked);

if (fail.length) {
  console.error('\nthe two sides have run into each other:\n');
  for (const f of fail) console.error('  ' + f + '\n');
  process.exit(1);
}
console.log('sides: the making side and the reading side are separate');
