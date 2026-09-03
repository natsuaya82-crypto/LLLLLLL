/* ---------------------------------------------------------------------------
   tools/order-check.mjs — nothing is CALLED before the file that defines it.

   Run it:   node tools/order-check.mjs   (npm run order)

   There is no bundler. www/index.html loads 54 script tags one after another,
   so a name is there when its file has been read and not one line before. A
   function that RUNS while the page is still loading may therefore only reach
   what is above it.

   THIS ALREADY BLANKED A PHONE. `migratePos()` sat at the top level of
   www/shell.js and called `save()`; `save()` opens with `bkTouch()`; and
   www/backup.js is loaded AFTER www/shell.js. So on any handset carrying one
   old part-of-speech label, shell.js threw on that line and EVERY DEFINITION
   BELOW IT was never made. Nothing was on the screen. Nothing was in the log
   about a migration. The fix was to move the call to www/boot.js, which is
   loaded last -- and nothing was left behind that would catch the next one.

   Rule 9 in CLAUDE.md holds the halves of this that a grep can see: every .js
   is in index.html, every file index.html names is tracked, and glyph.js goes
   last. What none of them asks is the question that actually broke the app:
   at the moment this line runs, does everything it can reach exist yet?

   WHY IT IS TRANSITIVE. The three call sites in shell.js all looked innocent
   -- `migratePos()` names nothing from backup.js. It was three steps down.
   A check that only compared a call against its own file would have been
   green with the bug in.

   WHAT IT IS NOT. It does not ask whether a path is really taken; it asks
   whether one exists. That is deliberate: a path taken only by a phone that
   has an old key on it is exactly the path nobody walks and everybody ships.
   The cost is that a load-time function which merely MENTIONS a later name in
   a branch it will not take on a fresh install is still refused. That is the
   right trade -- the fix is to move the call out of load time (www/boot.js is
   loaded last and exists for this) or to move the definition up.

   Comments and strings are stripped before anything is read. The first
   version of this was written without that and reported `planMigrate ->
   bkTouch` in www/core.js, where the only `bkTouch` on the page is the word
   inside the comment WARNING about this very trap.
   --------------------------------------------------------------------------- */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WWW  = path.join(HERE, '..', 'www');

/* Comments and string bodies become spaces, so every line number and column
   still lines up with the file on disk. A check that names the wrong line is
   worse than one that names none -- box-check learnt that the same way. */
function strip(s) {
  let o = '', i = 0;
  const n = s.length;
  while (i < n) {
    const c = s[i], d = s[i + 1];
    if (c === '/' && d === '*') {
      let j = s.indexOf('*/', i + 2);
      if (j < 0) j = n;
      o += s.slice(i, Math.min(j + 2, n)).replace(/[^\n]/g, ' ');
      i = j + 2;
      continue;
    }
    if (c === '/' && d === '/') {
      let j = s.indexOf('\n', i);
      if (j < 0) j = n;
      o += ' '.repeat(j - i);
      i = j;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && s[j] !== c) { if (s[j] === '\\') j++; j++; }
      o += ' '.repeat(Math.min(j, n) - i + 1);
      i = j + 1;
      continue;
    }
    o += c;
    i++;
  }
  return o;
}

const html = fs.readFileSync(path.join(WWW, 'index.html'), 'utf8');
const ORDER = [...html.matchAll(/<script src="([^"]+\.js)"/g)]
  .map((m) => m[1].replace(/^\.\//, ''));
const idxOf = Object.create(null);
ORDER.forEach((f, i) => { idxOf[f] = i; });

const src = Object.create(null);
for (const f of ORDER) {
  const p = path.join(WWW, f);
  if (fs.existsSync(p)) src[f] = strip(fs.readFileSync(p, 'utf8'));
}

/* Where every top-level function is declared. Object.create(null), because a
   file that declares `function toString()` would otherwise be answered by
   Object.prototype and every name would look defined. */
const defAt = Object.create(null);
for (const f of ORDER) {
  if (!src[f]) continue;
  src[f].split('\n').forEach((l, i) => {
    const m = l.match(/^function\s+([A-Za-z_$][\w$]*)/);
    if (m) defAt[m[1]] = { f, line: i + 1, idx: idxOf[f] };
  });
}

function body(f, name) {
  const s = src[f];
  const m = new RegExp('^function\\s+' + name + '\\s*\\(', 'm').exec(s);
  if (!m) return '';
  let i = s.indexOf('{', m.index), d = 0, j = i;
  for (; j < s.length; j++) {
    if (s[j] === '{') d++;
    else if (s[j] === '}') { d--; if (!d) break; }
  }
  return s.slice(i, j + 1);
}

const cache = Object.create(null);
function callees(n) {
  if (cache[n]) return cache[n];
  const d = defAt[n];
  if (!d) return (cache[n] = []);
  const out = Object.create(null);
  for (const m of body(d.f, n).matchAll(/([A-Za-z_$][\w$]*)\s*\(/g))
    if (defAt[m[1]] && m[1] !== n) out[m[1]] = 1;
  return (cache[n] = Object.keys(out));
}

const fails = [];
let sites = 0;
for (const f of ORDER) {
  if (!src[f]) continue;
  src[f].split('\n').forEach((l, i) => {
    if (/^\s/.test(l)) return;                 /* indented: inside something */
    const m = l.match(/^(?:if\s*\(.*\)\s*)?([A-Za-z_$][\w$]*)\s*\(/);
    if (!m || !defAt[m[1]]) return;
    sites++;
    const root = m[1];
    const seen = Object.create(null);
    seen[root] = 1;
    const q = [[root, [root]]];
    while (q.length) {
      const [n, trail] = q.shift();
      if (defAt[n].idx > idxOf[f]) {
        fails.push('www/' + f + ':' + (i + 1) + '  runs while the page is still ' +
          'loading and reaches ' + defAt[n].f + ', which is loaded after it.\n' +
          '    ' + trail.join(' -> ') + '\n' +
          '    Move the call to www/boot.js (loaded last, and there for this), ' +
          'or move the definition above ' + f + ' in www/index.html.');
        return;
      }
      for (const c of callees(n)) if (!seen[c]) { seen[c] = 1; q.push([c, trail.concat(c)]); }
    }
  });
}

if (fails.length) {
  console.error('order: something runs before the thing it needs exists.\n');
  for (const x of fails) console.error('  ' + x + '\n');
  console.error('This is how www/shell.js once stopped loading and left the ' +
                'app with a blank screen: everything below the throwing line ' +
                'was never defined.');
  process.exit(1);
}

console.log('order: ' + sites + ' calls that run while the page is loading, ' +
            'across ' + ORDER.length + ' script tags — every name each one can ' +
            'reach is already defined');
