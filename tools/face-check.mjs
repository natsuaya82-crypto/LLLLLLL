/* ---------------------------------------------------------------------------
   tools/face-check.mjs — a face is named in one place.

   Run it:   node tools/face-check.mjs

   www/index.html has said for a long time that "every colour lives in these
   two blocks and nowhere else; the views only ever touch the variables." Type
   was never held to it. 'Cinzel',Georgia,serif was written out 37 times in
   that stylesheet, 'Cormorant Garamond',Georgia,serif 33 times, and both
   again in card.js because a canvas cannot inherit a font. Seventy-nine
   places restating five facts.

   That is not a tidiness complaint. A face in this app has been rebuilt more
   than once, and the way a rebuild goes wrong is that 78 of the 79 are found:
   the app looks right on every screen somebody thought to open, and the one
   that was missed is the card -- the only thing here meant to be seen by
   people who do not have the app. Three of the four faults this check was
   written after were of exactly that shape:

     onboard.js measured whether a script's characters exist against
     '24px -apple-system, system-ui, sans-serif', a SHORTER list than the body
     actually uses, with no 'Noto Sans JP' on it -- so a script was measured
     in one font and shown in another.

     card.js held its own copies of the two display faces, so changing one in
     the stylesheet would have moved every screen except the picture that
     leaves the phone.

     otf5.js -- a standalone font writer -- defaulted its family to
     'LinguaScript', which made a library that knows nothing about this app
     the fourth place naming this app's face.

   So, four rules, and all four are held here:

     1  Only :root may name a family. Every other font-family declaration in
        the stylesheet resolves to var(--face-*), inherit, or a generic
        keyword.
     2  Both directions on the variables, the way act-map's names are held:
        no var(--face-x) that :root does not declare, and no face declared
        that no rule uses. A face nothing wears is one that was replaced and
        left behind.
     3  No family named on :root appears as a literal anywhere in www/*.js.
        The one exception is the font the person drew, which JavaScript builds
        and therefore has to name: glyph.js's SFONT_FAMILY must be exactly the
        family in --face-script. Those two are what make a drawn letter
        appear, and when they disagree nothing throws -- the font builds, the
        rule installs, and every .sfont element quietly falls back to roman.
     4  Anything that sets a canvas font asks the page for the family. A
        canvas has no inheritance, so a literal there is the one kind of face
        the stylesheet cannot reach.

   No browser: this reads the source. Exit code is 0 only when all four hold.
   --------------------------------------------------------------------------- */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const fails = [];

/* Comments are prose and may say anything; only declarations are held. */
const decomment = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ');

/* EVERY <style> block, not the first: index.html has more than one, and a
   check that read one of them would hold half the stylesheet and report
   success. */
const css = decomment([...HTML.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
  .map(m => m[1]).join('\n'));
if (!css.trim()) fails.push('index.html has no <style> block to read');

const FACES = new Map();
for (const m of css.matchAll(/(--face-[\w-]+)\s*:\s*([^;}]+)/g)) FACES.set(m[1], m[2].trim());
if (!FACES.size) fails.push('index.html declares no --face-* variable, so there is no one place to be');

/* Where those declarations sit, so rule 1 can ignore them and only them. */
let elsewhere = css;
for (const m of css.matchAll(/:root\s*\{[^}]*\}/g)) {
  if (m[0].indexOf('--face-') >= 0) elsewhere = elsewhere.replace(m[0], ' ');
}

/* ---- 1. no rule but :root names a family ------------------------------- */
const GENERIC = ['inherit', 'initial', 'unset', 'revert', 'serif', 'sans-serif', 'monospace',
                 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif',
                 'ui-monospace', 'ui-rounded', 'none', 'important'];
for (const m of elsewhere.matchAll(/font-family\s*:\s*([^;}]+)/g)) {
  const val = m[1].trim();
  if (/['"]/.test(val)) {
    fails.push(`a rule sets font-family:${val} — a family may only be named on :root`);
    continue;
  }
  const bad = val.replace(/var\(--face-[\w-]+\)/g, ' ').replace(/!\s*important/g, ' ')
                 .split(/[\s,]+/).filter(w => w && GENERIC.indexOf(w.toLowerCase()) < 0);
  if (bad.length) fails.push(`a rule sets font-family:${val} — ${bad.join(', ')} is not a face variable`);
}

/* ---- 2. both directions on the variables ------------------------------- */
const used = new Set([...css.matchAll(/var\(\s*(--face-[\w-]+)\s*\)/g)].map(m => m[1]));
for (const n of used) if (!FACES.has(n)) fails.push(`a rule wears var(${n}) and :root does not declare it`);
for (const n of FACES.keys()) if (!used.has(n)) fails.push(`:root declares ${n} and no rule wears it`);

/* ---- 3. no family named in JavaScript ---------------------------------- */
const familyNames = new Set();
for (const v of FACES.values()) {
  for (const part of v.split(',')) {
    const w = part.trim().replace(/^['"]|['"]$/g, '');
    if (w && GENERIC.indexOf(w.toLowerCase()) < 0) familyNames.add(w);
  }
}
const scriptFamily = (FACES.get('--face-script') || '').split(',')[0].trim().replace(/^['"]|['"]$/g, '');
const jsFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.js'));
let declared = null;
for (const f of jsFiles) {
  const src = decomment(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const d = /var\s+SFONT_FAMILY\s*=\s*'([^']*)'/.exec(src);
  if (d) declared = { f, name: d[1] };
  for (const name of familyNames) {
    const re = new RegExp("['\"]" + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "['\"]", 'g');
    if (re.test(src)) {
      if (d && name === scriptFamily) continue;        /* SFONT_FAMILY itself, held below */
      fails.push(`${f} names the family "${name}" — it is index.html's to say, and a canvas ` +
                 `should ask the page for it through cssVar()`);
    }
  }
}
if (!scriptFamily) fails.push(':root declares no --face-script, so nothing says what the drawn font is called');
else if (!declared) fails.push(`no file declares SFONT_FAMILY, so nothing builds a font called "${scriptFamily}"`);
else if (declared.name !== scriptFamily)
  fails.push(`${declared.f} builds a font called "${declared.name}" and index.html asks for ` +
             `"${scriptFamily}". Nothing throws when these disagree: the font builds, the ` +
             `@font-face installs, and every drawn letter falls back to roman.`);

/* ---- 4. a canvas font comes off the page ------------------------------- */
for (const f of jsFiles) {
  const src = decomment(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  src.split('\n').forEach((line, i) => {
    if (!/\.font\s*=/.test(line)) return;
    /* built from a variable read, or from a family handed in as an argument */
    if (/cssVar\(|card(Caps|Ital)\(|\+\s*fam\b|\bfam\s*;/.test(line)) return;
    fails.push(`${f}:${i + 1} sets a canvas font without asking the page for the family:\n      ${line.trim()}`);
  });
}

if (fails.length) {
  console.error('\nfaces: ' + fails.length + ' place' + (fails.length === 1 ? '' : 's') +
                ' name type outside the one place that may:\n');
  fails.forEach(m => console.error('  ' + m));
  console.error('\nEvery face lives in the :root block in www/index.html. Everything else\n' +
                'wears var(--face-x); a canvas asks the page through cssVar(). A face is\n' +
                'rebuilt often enough here that finding 78 of 79 has to be impossible.\n');
  process.exit(1);
}

console.log('faces: ' + FACES.size + ' declared on :root, ' +
            [...css.matchAll(/font-family\s*:/g)].length + ' rules wearing them, none named twice');
console.log('       ' + [...FACES.keys()].sort().join('  '));
console.log('       the drawn font is "' + scriptFamily + '", built and asked for under one name');
