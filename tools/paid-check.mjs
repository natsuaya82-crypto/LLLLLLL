/* ---------------------------------------------------------------------------
   tools/paid-check.mjs — docs/PAID_FEATURES.md against www/core.js.

   Run it:  node tools/paid-check.mjs        (it is in gate.mjs's FAST list)

   WHY THIS EXISTS. `docs/PAID_FEATURES.md` is the price list, and every
   sentence in it is a claim about `www/core.js`. Nothing held one of them. On
   2026-09-03 the capability table in that file said `plus` for six of the
   twelve capabilities that are `pro`, named a thirteenth (`write`) that has
   never existed in `CAN`, and gave the download ceiling as Pro 2 where
   `dlCap()` answers 3. Every check in the gate was green, because none of
   them reads a document.

   That is the dangerous half of stale writing rather than the harmless half:
   CLAUDE.md says so in its own words -- a stale RULE reads as odd and gets
   questioned, a stale statement of FACT is simply believed. A session sent to
   put a feature on Plus reads the table, and the table is what it obeys.

   `dead-check` already holds the SHAPE of `CAN` from the code side -- every
   capability asked for by name, every `can()` naming one that exists. What it
   cannot ask is whether the price list says the same thing. This does, and it
   needs no browser, so it costs about as long as reading two files.

   TWO CLAIMS, and both are read out of the source rather than restated here:

   1. the capability table in PAID_FEATURES names exactly the capabilities
      `CAN` has, at exactly the levels `CAN` gives them
   2. § The four numbers carries exactly the ceiling constants `core.js`
      declares -- FREE_LIMIT, PLUS_LIMIT, FREE_KB, PLUS_KB, FREE_LANGS,
      PRO_LANGS, PLUS_DL, PRO_DL

   Nothing here decides what a level or a number OUGHT to be. Those are the
   owner's (`docs/FEATURE_RULES.md` § Deciding). All this says is that the two
   places saying it say the same thing, and it names both when they do not.
   --------------------------------------------------------------------------- */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORE = fs.readFileSync(path.join(ROOT, 'www/core.js'), 'utf8');
const DOC  = fs.readFileSync(path.join(ROOT, 'docs/PAID_FEATURES.md'), 'utf8');

const fails = [];

/* ---- 1. CAN, out of the code ------------------------------------------
   The same read dead-check does, and deliberately the same: two ways of
   finding `CAN` is two answers to where the price list is. */
const tbl = CORE.match(/\bvar\s+CAN\s*=\s*\{([\s\S]*?)\n\}/);
if (!tbl){
  console.error('www/core.js has no `var CAN={...}` table. It is the one place\n' +
                'that says what each plan opens, and nothing else may say it.');
  process.exit(1);
}
/* The level is a literal beside the name. A level built from anything else
   could not be read here and could not be written in a document either. */
const code = new Map();
[...tbl[1].matchAll(/^\s*([A-Za-z_$][\w$]*)\s*:\s*'([a-z]+)'/gm)]
  .forEach(m => code.set(m[1], m[2]));
if (!code.size){
  console.error('www/core.js has a CAN table with no `name: \'level\'` lines in it.');
  process.exit(1);
}

/* ---- and out of the document ------------------------------------------
   The capability table is the one whose header is `| capability | level |`.
   Found by that header rather than by a line number, so the section may move.
   Rows are `| `name` | level | what it opens |`. */
const head = DOC.indexOf('| capability | level |');
if (head < 0){
  fails.push('docs/PAID_FEATURES.md has no `| capability | level |` table.\n' +
             '  That table is the price list. Without it this file makes no\n' +
             '  claim anything can be held to.');
}
const doc = new Map();
if (head >= 0){
  const lines = DOC.slice(head).split('\n');
  for (let i = 2; i < lines.length; i++){        /* 0 header, 1 the dashes */
    const l = lines[i];
    if (!l.startsWith('|')) break;               /* the table ends at the blank line */
    const m = l.match(/^\|\s*`([\w$]+)`\s*\|\s*([a-z]+)\s*\|/);
    if (!m){
      fails.push('a row of the capability table is not `| `name` | level | … |`:\n' +
                 '  ' + l.trim());
      continue;
    }
    if (doc.has(m[1]))
      fails.push('`' + m[1] + '` is in the capability table twice. Two rows is two\n' +
                 '  answers to one question, and the second one wins silently.');
    doc.set(m[1], m[2]);
  }
}

const missing = [...code.keys()].filter(c => !doc.has(c));
const extra   = [...doc.keys()].filter(c => !code.has(c));
const wrong   = [...code.keys()].filter(c => doc.has(c) && doc.get(c) !== code.get(c));

if (missing.length)
  fails.push(missing.length + ' capabilit' + (missing.length === 1 ? 'y is' : 'ies are') +
             ' in CAN and not in the price list:\n' +
             missing.map(c => '  CAN.' + c + '  (' + code.get(c) + ')').join('\n') +
             '\n  Something is being charged for and the file that says what money\n' +
             '  buys does not know about it.');
if (extra.length)
  fails.push(extra.length + ' capabilit' + (extra.length === 1 ? 'y is' : 'ies are') +
             ' in the price list and not in CAN:\n' +
             extra.map(c => '  `' + c + '`  (' + doc.get(c) + ')').join('\n') +
             '\n  A name no code asks is a locked door nobody can open. Either it\n' +
             '  goes into CAN with its first can(), or the row comes out.');
if (wrong.length)
  fails.push(wrong.length + ' capabilit' + (wrong.length === 1 ? 'y is' : 'ies are') +
             ' on a different rung in the two places:\n' +
             wrong.map(c => '  `' + c + '`  CAN says ' + code.get(c) +
                            ', the price list says ' + doc.get(c)).join('\n') +
             '\n  Which is right is the OWNER\'s (docs/FEATURE_RULES.md § Deciding).\n' +
             '  Do not pick one here.');

/* ---- 2. the four ceilings ---------------------------------------------
   Eight constants, declared once in core.js and written out once in the
   document. A number that is two facts is what wordCap() exists to say, and
   a number in two FILES is the thing that drifts. */
const NUMS = ['FREE_LIMIT', 'PLUS_LIMIT', 'FREE_KB', 'PLUS_KB',
              'FREE_LANGS', 'PRO_LANGS', 'PLUS_DL', 'PRO_DL'];
const block = DOC.match(/## The four numbers[\s\S]*?```\n([\s\S]*?)```/);
if (!block){
  fails.push('docs/PAID_FEATURES.md has no `## The four numbers` block.\n' +
             '  The ceilings are the half of the price list that is a number\n' +
             '  rather than a door, and they have been wrong here twice.');
} else {
  const said = new Map();
  block[1].split('\n').forEach(l => {
    const m = l.match(/^\s*([A-Z_]+)\s+(\d+)\b/);
    if (m) said.set(m[1], m[2]);
  });
  NUMS.forEach(n => {
    const m = CORE.match(new RegExp('\\b' + n + '\\s*=\\s*(\\d+)'));
    if (!m){
      fails.push(n + ' is named in docs/PAID_FEATURES.md and is not declared in\n' +
                 '  www/core.js. A ceiling written down and not in the code is a\n' +
                 '  promise nothing keeps.');
      return;
    }
    if (!said.has(n)){
      fails.push(n + ' = ' + m[1] + ' is in www/core.js and is not in\n' +
                 '  § The four numbers. Every ceiling goes in that block, or the\n' +
                 '  block stops meaning "these are the numbers".');
      return;
    }
    if (said.get(n) !== m[1])
      fails.push(n + ' disagrees: www/core.js says ' + m[1] +
                 ', docs/PAID_FEATURES.md says ' + said.get(n) + '.\n' +
                 '  Which is right is the OWNER\'s. Do not pick one here.');
  });
}

if (fails.length){
  console.error('docs/PAID_FEATURES.md and www/core.js do not say the same thing.\n');
  fails.forEach(f => console.error(f + '\n'));
  console.error('The price list is read by every session that is sent to put something\n' +
                'behind a plan, and a stale statement of fact is simply believed.');
  process.exit(1);
}

console.log('what money buys, said twice and agreeing: ' + code.size +
            ' capabilities and ' + NUMS.length + ' ceilings,');
console.log('           the same in www/core.js and in docs/PAID_FEATURES.md.');
