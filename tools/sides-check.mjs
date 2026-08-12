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

/* ---- rule one again, on the other place a post is drawn -------------------
   The card is the second renderer of a post and had none of this. cardPaint()
   called cardUnits(), which asks findWord() for the spelling, ltById() for
   the letter and wsStrokes() for a shape the writing system composes: the
   open language, three times over, for a line written by somebody else in an
   alphabet this phone has never seen.

   Same line, same list, same statement -- so it is the same loop, over both
   files, rather than a second one written out. */

const CARD_MARK = '==== below this line a card of a post renders from the post ====';

for (const [file, mark] of [['post.js', MARK], ['card.js', CARD_MARK]]) {
  const s2 = fs.readFileSync(path.join(WWW, file), 'utf8');
  const at2 = s2.indexOf(mark);
  if (at2 < 0) {
    fail.push('www/' + file + ' has lost the line that separates the two sides:\n' +
              '  ' + mark);
    continue;
  }
  const lineNo2 = s2.slice(0, at2).split('\n').length;
  const body2 = stripped(s2).split('\n').slice(lineNo2 - 1);
  let n2 = 0;
  body2.forEach((line, i) => {
    for (const name of MINE) {
      if (new RegExp('\\b' + name + '\\b').test(line)) {
        fail.push('www/' + file + ' line ' + (lineNo2 + i) + ' renders a post out of ' +
                  name + ', which is the open language and not the post:\n' +
                  '  ' + line.trim());
        n2++;
      }
    }
  });
  if (!n2) console.log(file + ': ' + body2.length + ' lines below the line, none of them yours');
}

/* ---- rule one, one step further out --------------------------------------
   Naming WORDS below the line is caught above. CALLING something that names
   WORDS is not, and that is the same bug with one function in front of it:

     below the line:   trHTML(p)                     <- reads clean
     above the line:   function trHTML(p){ ... WORDS ... }

   So: mark every function whose body names one of MINE, propagate to whoever
   calls it until nothing moves, and then read the BUILDERS again -- the
   functions below the line whose job is to produce a post's HTML. Those are
   the ones the rule is about. postLike() calling render() is not a post being
   drawn out of my dictionary; it is a button, and render() reaches everything
   by construction, so following it proves nothing about anybody.

   A builder is a function below the line named *HTML, or postRow itself.

   TR_ALLOW is the exception, and it is two names with one reason. Layer three
   -- the post said again in the READER's own words -- is the one errand that
   is supposed to reach for this dictionary: it starts from a natural sentence
   the author already confirmed and re-expresses it in mine, so the guessing
   is about my vocabulary and I am the one who can see it is wrong. It touches
   `mn`/`tr` and never `ln` or `ink`. Anything added here needs that sentence
   written out, or it does not belong here. */

const TR_ALLOW = new Set(['trHTML', 'trBtnHTML']);

const bodies = {};
for (const f of fs.readdirSync(WWW).filter((x) => x.endsWith('.js')).sort()) {
  const src2 = stripped(fs.readFileSync(path.join(WWW, f), 'utf8'));
  const re = /function\s+([A-Za-z0-9_$]+)\s*\(/g;
  let m; const marks = [];
  while ((m = re.exec(src2))) marks.push([m[1], m.index]);
  marks.forEach(([name, at], i) => {
    const end = (i + 1 < marks.length) ? marks[i + 1][1] : src2.length;
    bodies[name] = src2.slice(at, end);
  });
}
/* a call, and not a method: `.push(` is the language's, not this app's */
const calls = (body) => {
  const out = new Set(); const re = /(^|[^.\w$])([A-Za-z0-9_$]+)\s*\(/g;
  let m; while ((m = re.exec(body))) out.add(m[2]);
  return out;
};
const taints = new Set();
for (const [name, body] of Object.entries(bodies))
  for (const g of MINE)
    if (new RegExp('\\b' + g + '\\b').test(body)) { taints.add(name); break; }
/* render() reaches every screen in the app, so it taints everything and says
   nothing. It is not a way of drawing a post. */
taints.delete('render');
for (let moved = true; moved;) {
  moved = false;
  for (const [name, body] of Object.entries(bodies)) {
    if (taints.has(name) || name === 'render') continue;
    for (const c of calls(body))
      if (c !== name && taints.has(c)) { taints.add(name); moved = true; break; }
  }
}
let built = 0;
for (const [file, mark] of [['post.js', MARK], ['card.js', CARD_MARK]]) {
  const s3 = fs.readFileSync(path.join(WWW, file), 'utf8');
  const at3 = s3.indexOf(mark);
  if (at3 < 0) continue;
  /* by LINE, not by index: stripped() blanks comments, and the marker itself
     lives in one -- slicing the stripped text at an index taken from the raw
     text found nothing, and "0 builders checked" reads exactly like "nothing
     to complain about". */
  const lineNo4 = s3.slice(0, at3).split('\n').length;
  const below = stripped(s3).split('\n').slice(lineNo4 - 1).join('\n');
  const re = /function\s+([A-Za-z0-9_$]+)\s*\(/g;
  let m; const marks = [];
  while ((m = re.exec(below))) marks.push([m[1], m.index]);
  marks.forEach(([name, at], i) => {
    if (!(/HTML$/.test(name) || name === 'postRow')) return;
    built++;
    const end = (i + 1 < marks.length) ? marks[i + 1][1] : below.length;
    for (const c of calls(below.slice(at, end))) {
      if (c === name || !taints.has(c) || TR_ALLOW.has(c)) continue;
      fail.push('www/' + file + ': ' + name + '() builds a post and calls ' + c +
                '(), which reaches the open language.\n' +
                '  Either it belongs above the line, or its name belongs in ' +
                'TR_ALLOW with the reason written out.');
    }
  });
}
console.log('post builders checked: ' + built +
            ' (reaching the making side by name, allowed: ' +
            [...TR_ALLOW].join(', ') + ')');

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
