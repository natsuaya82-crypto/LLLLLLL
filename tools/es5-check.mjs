/* ---------------------------------------------------------------------------
   tools/es5-check.mjs — the app must stay ES5.

   Run it:   node tools/es5-check.mjs

   Everything under www/ runs inside WKWebView on whatever iPhone the person
   already owns. An arrow function there is not a lint complaint; it is a blank
   screen on a real phone that no desktop browser and no CI runner would ever
   show us, because both of those are modern.

   This used to guard one file. tools/inline-otf5.mjs copied the font writer
   into www/index.html and gated that copy on ES5 along the way — so the font
   writer was checked and the other 8,000 lines of the app never were. The app
   is several files now and there is no copying left to do, so the gate moved
   here and widened to cover all of them.

   What it cannot see: anything that is ES5 syntax but a modern *runtime*
   feature reached through a string, e.g. el.closest(...) or Promise via a
   library. Syntax and the named builtins below are all this reads.
   --------------------------------------------------------------------------- */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WWW = path.join(HERE, '..', 'www');

function jsFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...jsFiles(p));
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out.sort();
}

/* Blank out comments, string bodies and regex bodies, keeping newlines so line
   numbers survive. Without this, prose like "no Math.hypot in ES5" trips the
   very check that sentence is explaining.

   Telling a regex literal from a division needs the previous token, and this
   is the whole of that judgement: after a value (identifier, number, `)`, `]`)
   a slash divides; after anything else it opens a regex. `return /x/` is the
   one that would fool a simpler rule, so the keywords are listed. */
const AFTER_VALUE = /[A-Za-z0-9_$)\]]$/;
const KEYWORD_BEFORE_REGEX = /\b(return|typeof|instanceof|in|of|new|delete|void|case|do|else)$/;

function stripped(s) {
  let out = '', i = 0, prev = '';
  const push = (c) => { out += c; if (c.trim() !== '') prev += c; };
  while (i < s.length) {
    const c = s[i], d = s[i + 1];
    if (c === '/' && d === '/') { while (i < s.length && s[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') {
      i += 2;
      while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) { if (s[i] === '\n') out += '\n'; i++; }
      i += 2; continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      out += c; i++;
      while (i < s.length && s[i] !== c) {
        if (s[i] === '\\') { i += 2; continue; }
        if (s[i] === '\n') out += '\n';
        i++;
      }
      out += c; i++; prev += c; continue;
    }
    if (c === '/') {
      const t = prev.replace(/\s+$/, '');
      const divides = AFTER_VALUE.test(t) && !KEYWORD_BEFORE_REGEX.test(t);
      if (!divides) {
        out += '/'; i++;
        let cls = false;
        while (i < s.length) {
          if (s[i] === '\\') { i += 2; continue; }
          if (s[i] === '[') cls = true;
          else if (s[i] === ']') cls = false;
          else if (s[i] === '/' && !cls) break;
          else if (s[i] === '\n') break;      /* not a regex after all; bail out */
          i++;
        }
        out += '/'; i++; prev += '/'; continue;
      }
    }
    if (c === '\n') { out += c; i++; prev = ''; continue; }
    push(c); i++;
  }
  return out;
}

/* Each rule is [pattern, what it is]. The builtins are the ones this app has
   actually reached for by mistake; add to the list the next time one bites. */
const RULES = [
  [/=>/, 'arrow function'],
  [/\b(const|let)\s/, 'const/let'],
  [/`/, 'template literal'],
  [/\bclass\s+[A-Za-z_$]/, 'class'],
  [/\bnew (Set|Map|WeakSet|WeakMap|Promise|Proxy)\b/, 'Set/Map/Promise'],
  [/\bSymbol\s*\(/, 'Symbol'],
  [/\.\.\./, 'spread'],
  [/\bMath\.(hypot|trunc|sign|cbrt|log2|log10)\b/, 'ES2015 Math'],
  [/\bObject\.(assign|entries|values|fromEntries)\b/, 'ES2015+ Object'],
  [/\bArray\.(from|of)\b/, 'Array.from / Array.of'],
  [/\.(includes|padStart|padEnd|find|findIndex|startsWith|endsWith|repeat|flat|flatMap|trimStart|trimEnd)\s*\(/, 'ES2015+ method'],
  [/\basync\s+function|\bawait\s/, 'async/await'],
  [/\?\./, 'optional chaining'],
  [/\?\?/, 'nullish coalescing'],
];

const files = jsFiles(WWW);
let bad = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  stripped(src).split('\n').forEach((line, i) => {
    for (const [re, what] of RULES) {
      if (re.test(line)) {
        bad++;
        console.error(path.relative(path.join(HERE, '..'), f) + ':' + (i + 1) +
          '  ' + what + '\n      ' + src.split('\n')[i].trim().slice(0, 90));
        break;
      }
    }
  });
}

const kb = (n) => (n / 1024).toFixed(1) + ' KB';
if (bad) {
  console.error('\n' + bad + ' place' + (bad === 1 ? '' : 's') + ' where the app is not ES5.');
  console.error('Every one of them is a blank screen on an old iPhone. Rewrite, do not silence.');
  process.exit(1);
}
console.log('ES5: ' + files.length + ' files under www/ are clean (' +
  kb(files.reduce((n, f) => n + fs.statSync(f).size, 0)) + ' of script)');
for (const f of files) {
  console.log('  ' + String(kb(fs.statSync(f).size)).padStart(9) + '  ' +
    path.relative(WWW, f));
}
