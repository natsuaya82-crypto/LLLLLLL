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
     3  A family in www/*.js is one that file BUILDS, and :root asks for it by
        that name. A file that builds a font has to name it -- JavaScript makes
        it -- but a font installed under a name no rule wants is a font nothing
        wears, and nothing throws: it builds, it installs, and every element
        falls back to roman. A file that does NOT build it may not name it;
        that is a copy of a face the stylesheet owns, going stale on the next
        rebuild. It counts to N, not to one: there are two drawn fonts now.
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

/* ---- 3. a family in JavaScript is one JavaScript BUILDS, and the page asks
        for it by that name ------------------------------------------------

   This used to say "no family in www/*.js at all, except SFONT_FAMILY, which
   must equal --face-script" -- one drawn font, one name. That held while
   there was one. claude/save is adding a second, LinguaType, for the fields
   you type into: the drawn letters are unreadable to somebody who has just
   drawn their first eight, so a field is set in a face that holds only the
   private use area. A rule that can only count to one would have to be
   rewritten the day it lands, which is the day nobody has time.

   So it counts to N. Two questions instead of one name:

     a  a file that BUILDS a font (@font-face, or family: passed to the OTF
        writer) may name it -- JavaScript makes it, so JavaScript has to say
        what it is called. But :root must declare that same family under some
        --face-*, or the font is built and installed under a name no rule ever
        asks for. Nothing throws; every element quietly falls back to roman.

     b  a file that does NOT build it may not name it. That is card.js's old
        bug: a copy of a face the stylesheet owns, in a file the stylesheet
        cannot reach, going stale the first time the face is rebuilt. Ask the
        page: cssVar('--face-x', 'serif').

   otf5.js is exempt from (a) and only from (a). It is a font writer that
   knows nothing about this app, and its DEFAULTS.family is a name so that a
   font built without one is still a valid file. What it may NOT do is default
   to a face this app declares -- it said 'LinguaScript' once, which made a
   standalone library the fourth place naming this app's face. */
const familyNames = new Set();
for (const v of FACES.values()) {
  for (const part of v.split(',')) {
    const w = part.trim().replace(/^['"]|['"]$/g, '');
    if (w && GENERIC.indexOf(w.toLowerCase()) < 0) familyNames.add(w);
  }
}
const jsFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.js'));
const built = new Map();        /* family -> the file that builds it */

for (const f of jsFiles) {
  const src = decomment(fs.readFileSync(path.join(ROOT, f), 'utf8'));

  /* What this file builds. A name reached through a variable is followed:
     family:SFONT_FAMILY with var SFONT_FAMILY='X' builds X. */
  const vars = new Map();
  for (const m of src.matchAll(/var\s+([A-Z_][A-Z0-9_]*)\s*=\s*'([^']+)'/g)) vars.set(m[1], m[2]);
  const mine = new Set();
  for (const m of src.matchAll(/@font-face\{font-family:'(?:"\s*\+\s*)?([A-Za-z_][\w$]*)/g)) {
    mine.add(vars.get(m[1]) || m[1]);
  }
  /* A plain literal only. `font-family:'"+SFONT_FAMILY+"'` is a concatenation
     and its name came from the variable above, not from these characters. */
  const plain = (n) => n && !/["+$\\]/.test(n);
  for (const m of src.matchAll(/@font-face\{font-family:'([^']+)'/g)) if (plain(m[1])) mine.add(m[1]);
  for (const m of src.matchAll(/\bfamily\s*:\s*'([^']+)'/g)) if (plain(m[1])) mine.add(m[1]);
  for (const m of src.matchAll(/\bfamily\s*:\s*([A-Z_][A-Z0-9_]*)/g)) {
    if (vars.has(m[1])) mine.add(vars.get(m[1]));
  }

  if (f === 'otf5.js') {
    /* exempt from (a); held to the one thing that matters */
    for (const n of mine) {
      if (familyNames.has(n))
        fails.push(`otf5.js defaults its family to "${n}", which is a face index.html ` +
                   `declares. It is a font writer and knows nothing about this app; ` +
                   `naming this app's face makes it one more place to keep in step.`);
    }
    continue;
  }

  for (const n of mine) {
    built.set(n, f);
    if (!familyNames.has(n))
      fails.push(`${f} builds a font called "${n}" and :root declares no --face-* that ` +
                 `asks for it. Nothing throws when these disagree: the font builds, the ` +
                 `@font-face installs, and every element wanting it falls back to roman.`);
  }

  /* (b) naming a face this file does not build */
  for (const name of familyNames) {
    if (mine.has(name)) continue;
    const re = new RegExp("['\"]" + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "['\"]");
    if (re.test(src))
      fails.push(`${f} names the family "${name}" and does not build it — it is ` +
                 `index.html's to say. Ask the page: cssVar('--face-x', 'serif').`);
  }
}

/* Every face the stylesheet declares is either a webfont index.html loads, or
   one this app builds. A --face-* naming a family nobody builds and no <link>
   fetches would install nothing and say nothing about it. */
const linked = HTML.slice(0, HTML.indexOf('<style')).replace(/\+/g, ' ');
for (const n of familyNames) {
  if (built.has(n)) continue;
  if (linked.indexOf(n) >= 0) continue;                 /* a webfont, fetched */
  if (/^(-apple-system|BlinkMacSystemFont|Menlo|Georgia)$/i.test(n)) continue;  /* the platform's */
  fails.push(`:root declares the family "${n}" and nothing builds it or fetches it — ` +
             `no @font-face in www/*.js and no <link> in the head.`);
}

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
const drawn = [...built.entries()].map(([n, f]) => n + ' (' + f + ')').sort();
console.log('       ' + (drawn.length
  ? 'built here and asked for by name: ' + drawn.join(', ')
  : 'nothing here builds a font'));
