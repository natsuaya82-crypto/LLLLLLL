/* ---------------------------------------------------------------------------
   tools/box-check.mjs — NO ROUNDED BOX, and it does not grow back.

   Run it:   node tools/box-check.mjs
   Rebase:   node tools/box-check.mjs --write     (see below; not casual)

   「角丸やめろ」「文字書いて四角で囲ったみたいなボタン全部やめてくれ。ダサすぎる」

   The rule is in CLAUDE.md three times over, the class comment on `.btn.ghost`
   has carried it since the day it was written, and it was still broken three
   times in one afternoon after being pointed out twice -- a gold pill on the
   frozen screen, a bordered strip across Home, a gold pill on the password
   screen. Prose does not hold a rule. CLAUDE.md says so itself: "a comment
   saying 'this is the one place' is worth nothing on its own... Either a check
   holds the claim, or do not make it." Nothing held this one.

   ── What it is NOT ──────────────────────────────────────────────────────
   It is not "no corner radius in this stylesheet". There are 153 of them and
   `.btn` is on about thirty older screens; deleting all of it is a redesign,
   not a check, and the rule as written is about what is added: "Nothing NEW
   gets a corner radius, a border, or a filled panel."

   ── So it is a ratchet ──────────────────────────────────────────────────
   `tools/box-baseline.txt` is what the stylesheet looked like on the day the
   rule was written. Every corner and every border in it is listed by selector.
   The check fails when a pair appears that is NOT on the list. That is the
   whole statement, and it is the same shape as `buttons pressed: 8683` -- a
   number nobody may move by accident.

   It fails the other way too: a line in the baseline that matches nothing any
   more is removed, and the check says so. Otherwise the list rots into
   permission for a corner somebody deleted years ago, and the ratchet stops
   ratcheting. Taking a line OUT is progress and needs nobody's approval.
   Putting one IN is a diff on this file, in its own commit, and it is the
   owner's -- which is the point: it stops being something a session can do
   without noticing.

   ── And JavaScript may not do it at all ─────────────────────────────────
   There are zero corners set from `www/*.js` today. A style set from
   JavaScript is not in the stylesheet at all, so nothing above would ever see
   it -- that is the one hole a baseline cannot cover, and zero is the only
   number that closes it.

   ── One side is a LINE, and a line is what was asked for ────────────────
   `border-bottom` and its three siblings are NOT counted, and that is not an
   oversight. index.html carries the sentence itself, over the field rules:
   「かくまるみたいなのでくくるのやめて欲しい。基本下線だけ」 -- stop boxing
   things in, basically just an underline. A single side is the shape the
   owner asked FOR. Counting it would make this check fail the alternative it
   exists to push people towards, which is the worst thing a check can do:
   it would be read as "the rule is unworkable" and then ignored.

   What makes a box is four sides (`border`) or a corner (`border-radius`).
   Those two, and nothing else.

   ── What it deliberately does not check ─────────────────────────────────
   "A filled panel" is the third thing the rule names and it is not held here.
   A background colour is not a panel -- the bar, the sheet and the body all
   have one and always did -- and no mechanical reading tells a panel from a
   surface. Inventing a rule the owner did not write is worse than holding two
   of the three. It is named here so nobody reads silence as approval.

   No browser: this reads the source. Exit 0 only when every one holds.
   --------------------------------------------------------------------------- */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const BASELINE = path.join(HERE, 'box-baseline.txt');
const WRITE = process.argv.indexOf('--write') >= 0;

const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const fails = [];

/* Comments are prose and may say anything; only declarations are held.
   The newlines are kept: a comment collapsed to one space slides every line
   after it, and rule 3 below reports a line NUMBER. The first version did
   collapse them and sent the reader to shell.js:8, which is not where the
   corner was. A check that names the wrong line is worse than one that names
   none -- it is believed. */
const decomment = (s) => s.replace(/\/\*[\s\S]*?\*\//g,
  (m) => ' ' + m.replace(/[^\n]/g, ''));

/* EVERY <style> block, not the first -- index.html has more than one, and a
   check that read one of them would hold half the stylesheet and report
   success. (face-check learned this one first.) */
const css = decomment([...HTML.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
  .map((m) => m[1]).join('\n'));
if (!css.trim()) fails.push('index.html has no <style> block to read');

/* A declaration that draws nothing is not a box. `border-radius:0` is how a
   rule TAKES a corner off something that would otherwise have one, so it is
   the opposite of a breach and must never be reported as one. */
const draws = (prop, val) => {
  const v = val.trim().toLowerCase().replace(/!\s*important/g, '').trim();
  if (!v) return false;
  if (prop === 'border-radius') return !/^(0|0px|0%|none)(\s+(0|0px|0%))*$/.test(v);
  if (v === 'none' || v === '0' || v === '0px') return false;
  if (/\bnone\b/.test(v)) return false;
  if (/^0(px)?\s/.test(v)) return false;          /* border:0 solid X */
  return true;
};

/* Every `selector { declarations }` in the sheet. `[^{}]` cannot cross a
   brace, so an @media wrapper is stepped over rather than read as a selector,
   and the rules inside it are found on their own. */
const found = new Map();                          /* "selector | prop" -> count */
for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const sel = m[1].trim().replace(/\s+/g, ' ');
  if (!sel || sel.charAt(0) === '@') continue;    /* @font-face, @keyframes step */
  for (const d of m[2].split(';')) {
    const i = d.indexOf(':');
    if (i < 0) continue;
    const prop = d.slice(0, i).trim().toLowerCase();
    const val = d.slice(i + 1);
    if (prop !== 'border-radius' && prop !== 'border') continue;
    if (!draws(prop, val)) continue;
    const key = sel + ' | ' + prop;
    found.set(key, (found.get(key) || 0) + 1);
  }
}

const list = [...found.keys()].sort();

if (WRITE) {
  fs.writeFileSync(BASELINE,
    '# What the stylesheet looked like when NO ROUNDED BOX was written down.\n' +
    '# tools/box-check.mjs fails on anything here that is not on this list.\n' +
    '# Taking a line OUT is progress and needs nobody. Putting one IN is the\n' +
    '# owner\'s, in its own commit. 「角丸やめろ」\n' +
    list.join('\n') + '\n');
  console.log('baseline written: ' + list.length + ' lines');
  process.exit(0);
}

if (!fs.existsSync(BASELINE)) {
  console.error('no tools/box-baseline.txt — run: node tools/box-check.mjs --write');
  process.exit(2);
}
const allowed = new Set(fs.readFileSync(BASELINE, 'utf8').split('\n')
  .map((l) => l.trim()).filter((l) => l && l.charAt(0) !== '#'));

/* ---- 1. nothing new ---------------------------------------------------- */
const added = list.filter((k) => !allowed.has(k));
for (const k of added) {
  const [sel, prop] = k.split(' | ');
  fails.push('NEW ' + prop + ' on `' + sel + '` — 「角丸やめろ」. A button is ' +
    '`.btn.ghost`; a row that is not a button is a plain row. If this is ' +
    'genuinely the owner\'s, the line goes in tools/box-baseline.txt in a ' +
    'commit of its own.');
}

/* ---- 2. and the list may not rot -------------------------------------- */
const stale = [...allowed].filter((k) => !found.has(k)).sort();
for (const k of stale) {
  fails.push('tools/box-baseline.txt allows `' + k + '` and the stylesheet no ' +
    'longer has it — delete the line. A baseline that outlives what it ' +
    'described is permission nobody asked for.');
}

/* ---- 3. JavaScript sets no corner and no border ----------------------- */
for (const f of fs.readdirSync(ROOT)) {
  if (!f.endsWith('.js')) continue;
  const src = decomment(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  for (const m of src.matchAll(/borderRadius|border-radius/g)) {
    const line = src.slice(0, m.index).split('\n').length;
    fails.push(f + ':' + line + ' sets a corner from JavaScript. A style set ' +
      'here is in no stylesheet, so the baseline above can never see it. Zero ' +
      'is the only number that closes that.');
  }
}

console.log('corners and borders in index.html: ' + list.length +
  '  (baseline ' + allowed.size + ')');
console.log('set from www/*.js: 0 — a style the stylesheet cannot see');

if (fails.length) {
  console.log('');
  console.log('FAILED — NO ROUNDED BOX (' + fails.length + '):');
  fails.slice(0, 40).forEach((x) => console.log('  ' + x));
  if (fails.length > 40) console.log('  ...and ' + (fails.length - 40) + ' more');
  process.exit(1);
}
console.log('\nno rounded box was added: every corner and every border in the ' +
  'stylesheet\nwas already there the day the rule was written, and none is set ' +
  'from JavaScript.');
