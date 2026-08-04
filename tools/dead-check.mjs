/* ---------------------------------------------------------------------------
   tools/dead-check.mjs — a function nothing reaches.

   Run it:   node tools/dead-check.mjs

   tools/act-check.mjs already refuses an entry in the action table that no
   screen ever names, on the grounds that it is a button which used to exist.
   This is the same rule one step further out: a *function* nothing calls.

   The two are not the same check, and the gap between them is where 26 of
   these were found. clearCh(lid) was the clearest of them — it cleared the
   character on a letter, it read exactly like a working feature, and the
   button that used to press it had been replaced by setCh(lid, ""). It was
   not in the action table, so act-check could not see it. Nothing called it,
   so nothing failed. It would have sat there being read, maintained, and
   translated around forever.

   What it checks
     every function declared in www/ is named somewhere other than its own
     declaration — by the app, by index.html, by one of the ten languages, or
     by a tool. Anything else is deleted, not kept "just in case": git has it.

   Comments and the insides of strings do not count as a mention. A name that
   survives only in a comment describing what used to happen is precisely the
   thing being looked for, and a name that survives only inside a string is
   not a call — www/act-map.js binds the function itself, `act('go', go)`, so
   every live name is there as an identifier too.

   What it cannot see, so that nobody mistakes silence for safety:
     - a function called only through a computed name, window[x](). The tools
       reach the views that way, but render() also calls each by name, so
       they are covered. Something reached ONLY that way would look dead here
     - a function that is called, from another function that is itself dead.
       Delete the outer one and the inner turns up on the next run
     - anything outside www/. The tools are read for mentions, never judged

   Exit code is 0 only when nothing is unreachable.
   --------------------------------------------------------------------------- */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const WWW = path.join(ROOT, 'www');

/* Blank out comments and the insides of strings, keeping the newlines so a
   line number still means what it says. */
function bare(s){
  let out = '', i = 0, prev = '';
  const AFTER_VALUE = /[A-Za-z0-9_$)\]]$/;
  while (i < s.length){
    const c = s[i], d = s[i + 1];
    if (c === '/' && d === '/'){ while (i < s.length && s[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*'){
      i += 2;
      while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')){ if (s[i] === '\n') out += '\n'; i++; }
      i += 2; continue;
    }
    if (c === '"' || c === "'" || c === '`'){
      i++;
      while (i < s.length && s[i] !== c){
        if (s[i] === '\\'){ i += 2; continue; }
        if (s[i] === '\n') out += '\n';
        i++;
      }
      i++; out += '""'; prev = '"'; continue;
    }
    /* a regex literal can hold anything at all; skip its body */
    if (c === '/' && !AFTER_VALUE.test(prev.replace(/\s+$/, ''))){
      i++;
      let cls = false;
      while (i < s.length){
        if (s[i] === '\\'){ i += 2; continue; }
        if (s[i] === '[') cls = true;
        else if (s[i] === ']') cls = false;
        else if (s[i] === '/' && !cls) break;
        else if (s[i] === '\n') break;
        i++;
      }
      i++; out += ' '; continue;
    }
    out += c;
    if (c.trim() !== '') prev += c;
    if (c === '\n') prev = '';
    i++;
  }
  return out;
}

const jsIn = (dir) => fs.readdirSync(dir)
  .filter(f => f.endsWith('.js') && !f.startsWith('_'))
  .map(f => path.join(dir, f));

const appFiles = jsIn(WWW);
/* Everywhere a mention counts from: the app itself, the page that loads it,
   the ten languages, and every tool. */
const mentionFiles = appFiles
  .concat(jsIn(path.join(WWW, 'i18n')))
  .concat([path.join(WWW, 'index.html')])
  .concat(fs.readdirSync(path.join(ROOT, 'tools'))
    .filter(f => f.endsWith('.mjs'))
    .map(f => path.join(ROOT, 'tools', f)));

const decls = [];
appFiles.forEach(f => {
  const src = bare(fs.readFileSync(f, 'utf8'));
  src.split('\n').forEach((line, i) => {
    const m = /^function\s+([A-Za-z_$][\w$]*)\s*\(/.exec(line);
    if (m) decls.push({ name: m[1], file: path.relative(ROOT, f), line: i + 1 });
  });
});

const haystack = mentionFiles.map(f => bare(fs.readFileSync(f, 'utf8'))).join('\n');
const dead = decls.filter(d => {
  const re = new RegExp('(?<![\\w$.])' + d.name + '(?![\\w$])', 'g');
  return (haystack.match(re) || []).length <= 1;   /* its own declaration */
});

if (dead.length){
  console.error(dead.length + ' function' + (dead.length === 1 ? '' : 's') +
                ' nothing reaches:\n');
  dead.forEach(d => console.error('  ' + d.file + ':' + d.line + '  ' + d.name));
  console.error('\nDelete them. git remembers, and a reader of this code cannot ' +
                'tell\nthem apart from the ones that still do something.');
  process.exit(1);
}
console.log('dead code: ' + decls.length + ' functions in www/, every one of them reached.');
