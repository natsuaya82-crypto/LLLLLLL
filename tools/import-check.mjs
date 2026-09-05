/* ---------------------------------------------------------------------------
   tools/import-check.mjs — one sample per format, read the way a person's
   file will be read.

   Run it:   node tools/import-check.mjs

   "We can import from anywhere" is a claim, and a claim with nothing holding
   it is a claim that stops being true quietly. Every other check in this repo
   opens the app and presses things; none of them can open somebody's
   spreadsheet, because there isn't one. So this holds a sample of each shape
   that exists in the wild and asserts what came out of it.

   www/import.js touches no global and no document on purpose, so this runs it
   directly in Node rather than through a browser -- which makes it fast
   enough to run on every commit, which is the only reason it will be run.
   ipa.js comes along for ipaAll(), which is how a phonetic string is cut into
   sounds; both are ES5 with nothing but data at the top level.

   What it does NOT prove, so that nobody mistakes silence for safety:
     - that a real ConWorkShop or PolyGlot export looks like the sample here.
       Nobody in this repo has one. The samples are built from what those
       formats are documented to be, and the reader is deliberately written
       against column NAMES rather than against a table of services, so a
       heading nobody predicted still lands
     - the mapping screen, the duplicate policy and the undo: those are the
       app's and press.mjs walks them. What § 12 below DOES ask about, and it
       is the only thing after the read that is asked here, is whether the
       letters a file made can be typed at all -- a file that got in and then
       cannot be written did not get in
   --------------------------------------------------------------------------- */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WWW = path.join(HERE, '..', 'www');

/* The files, evaluated into one scope, in the order index.html loads them.
   The ten languages come too, because what a column is called is read off
   what this app already calls it -- 「つづり」 and 「品詞」 are understood
   because ja.js says so, not because they are typed into import.js. defLang
   is the three lines of core.js they register through; the rest of core.js
   wants a browser and none of it is needed here. */
/* The two things a language file touches while it is registering. defLang is
   core.js's three lines verbatim; mkApprox only has to exist, because what it
   returns is a pair of closures nothing here ever calls. The rest of core.js
   wants a browser and none of it is needed.

   If a language file ever needs a third, this throws by name and says so --
   which is the right outcome: a language file that grew a dependency at
   registration time is worth knowing about. */
const REG = 'var LANG={}, UI_LANGS=[];\n' +
            'function defLang(code, def){ LANG[code]=def; UI_LANGS.push(code); return def; }\n' +
            'function mkApprox(){ return {word:function(){return "";}, syl:function(){return "";}}; }\n';
const I18N = fs.readdirSync(path.join(WWW, 'i18n')).filter(f => f.endsWith('.js')).sort()
  .map(f => fs.readFileSync(path.join(WWW, 'i18n', f), 'utf8')).join('\n');
/* Only the half of import.js above the line: below it is the screen, which
   wants FORM_OPEN and a document and belongs to press.mjs. The line is in the
   file rather than a line number here, so moving code across it is a thing
   somebody has to do on purpose. */
const MARK = '/* ==== below this line the app begins ==== */';
const IMPSRC = fs.readFileSync(path.join(WWW, 'import.js'), 'utf8');
if (IMPSRC.indexOf(MARK) < 0){
  console.error('\nimport: www/import.js has lost the line that separates the reader from\n' +
                '  the app. Put it back:\n\n    ' + MARK + '\n\n' +
                '  Everything above it must run with no globals and no document,\n' +
                '  or none of the samples below can be read at all.\n');
  process.exit(1);
}
const src = REG + I18N + '\n' +
  fs.readFileSync(path.join(WWW, 'ipa.js'), 'utf8') + '\n' +
  IMPSRC.slice(0, IMPSRC.indexOf(MARK));
const names = ['impRead', 'impGuess', 'impRows', 'impShape', 'impDelim', 'impCells', 'impPh'];
let IMP;
try {
  IMP = new Function(src + '\nreturn {' + names.map(n => n + ':' + n).join(',') + '};')();
} catch (e) {
  console.error('\nimport: the ten language files no longer register on their own.\n' +
                '  ' + e.message + '\n' +
                '  Add it to REG at the top of this file, or move it out of the\n' +
                '  language files. Nothing can read a column heading in ten\n' +
                '  languages until they load.\n');
  process.exit(1);
}

const fails = [];
function is(what, got, want){
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) fails.push(what + '\n      got  ' + g + '\n      want ' + w);
}
/* Every sample goes through the same three calls the app makes. */
function read(sample){
  const r = IMP.impRead(sample);
  const roles = IMP.impGuess(r);
  return { shape: r.shape, roles: roles, rows: IMP.impRows(r, roles) };
}

/* ---- 1. the app's own export, which it could not read back -------------- */
/* Both of these shipped: a comma inside a quoted meaning became the part of
   speech, and a spelling that is not roman had its sounds guessed away. */
{
  const s = 'spelling,meaning,pos,ipa,sounds,from\n' +
            '"kano","mountain, hill","n","kano","k a n o",""\n' +
            '"ʃaŋ","river","n","ʃaŋ","ʃ a ŋ",""\n';
  const r = read(s);
  is('own export: the comma stays inside the meaning',
     r.rows[0].mn, 'mountain, hill');
  is('own export: the part of speech is the part of speech',
     r.rows[0].pos, 'n');
  is('own export: the sounds come from the file, not from the spelling',
     r.rows[1].ph, ['ʃ', 'a', 'ŋ']);
  is('own export: the spelling survives', r.rows[1].hw, 'ʃaŋ');
}

/* ---- 2. Excel, pasted straight in --------------------------------------- */
/* What the clipboard actually holds: tabs, the person's own headings, in
   whatever language they wrote them in, and a column the app has no use for. */
{
  const s = 'つづり\t意味\t品詞\t作った日\n' +
            'kano\t山\t名詞\t2024-01-02\n' +
            'tir\t見る\t動詞\t2024-01-03\n';
  const r = read(s);
  is('excel paste: tab wins', IMP.impDelim(s), '\t');
  is('excel paste: the date is not a meaning', r.roles, ['hw', 'mn', 'pos', 'skip']);
  is('excel paste: the row', r.rows[0], { hw: 'kano', mn: '山', pos: '名詞', ph: [], phRaw: '', ch: '', nm: '' });
}

/* ---- 3. a European Excel, which writes semicolons ----------------------- */
{
  const s = 'Word;Definition;Part of Speech\n' +
            'kano;mountain;noun\n' +
            'mos;tall;adjective\n';
  const r = read(s);
  is('semicolon csv: the delimiter', IMP.impDelim(s), ';');
  is('semicolon csv: the roles', r.roles, ['hw', 'mn', 'pos']);
}

/* ---- 4. no heading at all ----------------------------------------------- */
/* A spreadsheet somebody keeps for themselves has no headings, so the columns
   have to be read rather than named. */
{
  const s = 'kano,mountain,n\ntir,to see,v\nmos,tall,adj\n';
  const r = read(s);
  is('headless: read off the contents', r.roles, ['hw', 'mn', 'pos']);
  is('headless: the row', r.rows[1], { hw: 'tir', mn: 'to see', pos: 'v', ph: [], phRaw: '', ch: '', nm: '' });
}

/* ---- 5. a pronunciation column, named and unnamed ----------------------- */
{
  const named = 'Word,Pronunciation,Meaning\nkano,/kaˈno/,mountain\n';
  is('ipa column, named', read(named).rows[0].ph, ['k', 'a', 'n', 'o']);
  const bare = 'kano,ʃaŋɡu,mountain\n';
  is('ipa column, recognised by what is in it',
     read(bare).roles, ['hw', 'ph', 'mn']);
}

/* ---- 6. backslash-coded: SIL Toolbox, FLEx, Lexique Pro ----------------- */
{
  const s = '\\lx kano\n\\ph kano\n\\ps n\n\\ge mountain\n\\ge hill\n\n' +
            '\\lx tir\n\\ph tir\n\\ps v\n\\ge to see\n';
  const r = read(s);
  is('mdf: recognised', r.shape, 'mdf');
  is('mdf: two records', r.rows.length, 2);
  is('mdf: two senses join', r.rows[0].mn, 'mountain / hill');
  is('mdf: the row', r.rows[1], { hw: 'tir', mn: 'to see', pos: 'v', ph: ['t', 'i', 'r'], phRaw: 'tir', ch: '', nm: '' });
}

/* ---- 7. json, wrapped in something -------------------------------------- */
{
  const s = JSON.stringify({ name: 'Shango', words: [
    { word: 'kano', definition: 'mountain', pos: 'n' },
    { word: 'tir', definition: ['to see', 'to watch'], pos: 'v' }
  ]});
  const r = read(s);
  is('json: recognised', r.shape, 'json');
  is('json: found inside the wrapper', r.rows.length, 2);
  is('json: a list of senses joins', r.rows[1].mn, 'to see / to watch');
}

/* ---- 8. a text file of lines -------------------------------------------- */
{
  const s = 'kano - mountain\ntir: to see\nmos   tall\n';
  const r = read(s);
  is('lines: recognised', r.shape, 'lines');
  is('lines: three of them', r.rows.length, 3);
  is('lines: dash', r.rows[0], { hw: 'kano', mn: 'mountain', pos: '', ph: [], phRaw: '', ch: '', nm: '' });
  is('lines: colon', r.rows[1].mn, 'to see');
  is('lines: two spaces', r.rows[2].hw, 'mos');
}

/* ---- 9. a bare list of meanings ----------------------------------------- */
/* The commonest thing anybody has: no words yet, only what the words are for.
   These become coined words, so reading them as spellings would be the worst
   possible outcome -- two hundred English words entering the dictionary as if
   they were somebody's language. */
{
  const s = 'mountain\nto see\ntall\nriver\n';
  const r = read(s);
  is('meanings only: one column of meanings', r.roles, ['mn']);
  is('meanings only: nothing became a spelling', r.rows[0], { hw: '', mn: 'mountain', pos: '', ph: [], phRaw: '', ch: '', nm: '' });
}

/* ---- 10. an alphabet rather than a dictionary --------------------------- */
/* Somebody keeping their script in a spreadsheet has a table of character,
   sound and name. It is the same act of importing, so it is the same screen
   -- what comes out is decided by what is in the file. */
{
  const s = 'Letter,Sound,Name\nϘ,k,qoppa\nᛗ,m,mannaz\nϠ,sh,sampi\n';
  const r = read(s);
  is('alphabet: the roles', r.roles, ['ch', 'ph', 'nm']);
  is('alphabet: the character', r.rows[0].ch, 'Ϙ');
  is('alphabet: what it reads is kept as written, for the chart to read',
     r.rows[2].phRaw, 'sh');
  is('alphabet: the name', r.rows[1].nm, 'mannaz');
  is('alphabet: nothing became a word', r.rows[0].hw, '');
}
/* The same table with no headings at all: one column of single characters
   makes it an alphabet, and what sits beside a character is what it reads. */
{
  const r = read('Ϙ,k,qoppa\nᛗ,m,mannaz\nϠ,s,sampi\n');
  is('alphabet with no headings', r.roles, ['ch', 'ph', 'nm']);
}
/* And a column of single ROMAN letters is a spelling, not an alphabet --
   otherwise every one-letter word list would arrive as a writing system. */
{
  const r = read('a,first\nb,second\nc,third\n');
  is('single roman letters are not characters', r.roles, ['hw', 'mn']);
}

/* ---- 11. the awkward edges ---------------------------------------------- */
{
  is('a newline inside a quoted field',
     IMP.impCells('a,"one\ntwo",c\n', ',')[0], ['a', 'one\ntwo', 'c']);
  is('a doubled quote is one quote',
     IMP.impCells('a,"he said ""hi""",c\n', ',')[0], ['a', 'he said "hi"', 'c']);
  is('a byte order mark is not part of the first heading',
     IMP.impCells('﻿word,meaning\n', ',')[0], ['word', 'meaning']);
  is('CRLF', IMP.impCells('a,b\r\nc,d\r\n', ',').length, 2);
  is('blank rows at the bottom of a sheet',
     IMP.impCells('a,b\n,\n,\n', ',').length, 1);
  is('nothing at all', read('').rows, []);
  is('stress marks are not sounds', IMP.impPh('/kaˈno/'), ['k', 'a', 'n', 'o']);
  is('sounds already cut stay cut', IMP.impPh('t ʃ a'), ['t', 'ʃ', 'a']);
  /* tʃ is two symbols on the chart and one sound in a language that has it,
     so the language's own inventory is what decides. */
  is('a digraph is one sound in a language that has it',
     IMP.impPh('tʃa', ['tʃ']), ['tʃ', 'a']);
  is('and is not one in a language that does not',
     IMP.impPh('tʃa', []), ['t', 'ʃ', 'a']);
}

/* ---- 12. and the letters it made can be typed --------------------------- */
/* A file gets in, and then nothing of it can be written. That is not a
   reading fault and no sample above can see it: the reader answered
   correctly, the letters were made, and the font they went into has no way in.

   The road is the NAME. A letter arrives carrying one in two different
   places and they are not the same field:

     `ab`   what somebody typed in the box on the letter's own page
     `nm`   the name the letter ARRIVED with -- www/import.js's impPut()
            puts the file's name column there, and www/sheet.js's shTakeIn()
            puts the name printed over the box there

   ltName() answers with `nm` first, so the app calls the letter by it
   everywhere. ltCodes() is what turns a name into a code point on the glyph,
   and it is asked by scriptGlyphDefs() in www/glyph.js and by shareMapLts()
   in www/share.js. If those two disagree about what a letter is called, the
   glyph is built with no character on it: the font installs, `.sfont` matches
   it, and every word still comes out roman. Nothing throws and no screen
   looks wrong. 「描いた文字がそもそもフォントになってないけど。」

   So the two roads a NAME comes in by are both asked here. It is in this file
   rather than in a browser because ltCodes() wants no document -- and because
   a font with no way into it is the thing that decides whether an imported
   alphabet was worth importing.

   www/letters.js reads its letters off storage as it loads and www/numbers.js
   is what tells a digit from a letter, so both come in, in the order
   index.html loads them, with the three things they touch on the way past. */
/* WHERE A SLICE IS KEPT IS core.js's ANSWER, AND IT IS TAKEN FROM THERE.
   -------------------------------------------------------------------------
   The first line of this used to be a hand-written `localStorage` stub, and
   saveLetters() wrote through it. Rule 22 moved the slices into memory --
   `LSL`, `slRd`, `slWr`, `slRm` in www/core.js -- and this harness went on
   describing the disk, so `slWr` was a name nothing here had. The check died
   inside ltNew(), the gate went red, and there was nothing wrong with the
   app: on a phone core.js is loaded before letters.js and all three are
   there. That is 「a list of keys, written by hand, that nobody remembered to
   add to」 (CLAUDE.md rule 6) wearing a harness.

   So the store is not restated here. The block is CUT OUT of www/core.js and
   run, which leaves one answer to 「where does a slice live」 -- and a rename
   there fails by name below instead of quietly agreeing with itself.

   `localStorage` stays a stub, and that is not the same kind of thing: it is
   the BROWSER's, not this app's. slRd() falls back to it for what a version
   before 2026-09-04 left on the disk, and in Node there is no disk to fall
   back to. */
const CORE = fs.readFileSync(path.join(WWW, 'core.js'), 'utf8');
function coreBlock(from, fn){
  const a = CORE.indexOf(from), b = CORE.indexOf(fn, a);
  let i = (a < 0 || b < 0) ? -1 : CORE.indexOf('{', b), d = 0;
  for (; i >= 0 && i < CORE.length; i++){
    if (CORE[i] === '{') d++;
    else if (CORE[i] === '}' && --d === 0) return CORE.slice(a, i + 1);
  }
  console.error('\nimport: www/core.js no longer holds the slice store this harness runs.\n' +
                '  Looked for `' + from + '` and the end of `' + fn + '`.\n' +
                '  It is cut out rather than copied on purpose: find what it is\n' +
                '  called now and say so here. Do not write a second store.\n');
  process.exit(1);
}
const SLSRC = coreBlock('var LSL={};', 'function slRm(');
const LTREG = 'var localStorage={getItem:function(){return null;},removeItem:function(){}};\n' +
              SLSRC + '\n' +
              'function langKey(k){ return String(k); }\n' +
              'function bkTouch(){}\n' +
              /* Whether the open language may be written to -- www/core.js, and
                 there is no open language here. False is 「it is yours」, which
                 is what every other harness in this file assumes. */
              'function langLocked(){ return false; }\n' +
              'var LETTERS=[];\n';
let LT;
try {
  LT = new Function(LTREG +
    fs.readFileSync(path.join(WWW, 'numbers.js'), 'utf8') + '\n' +
    fs.readFileSync(path.join(WWW, 'letters.js'), 'utf8') +
    '\nreturn {ltNew:ltNew, ltName:ltName, ltCodes:ltCodes, LETTERS:LETTERS};')();
} catch (e) {
  console.error('\nimport: www/letters.js and www/numbers.js no longer run on their own.\n' +
                '  ' + e.message + '\n' +
                '  Add what they now touch to LTREG above, or move it out of them.\n' +
                '  Nothing can ask what a letter is typed as until they load.\n');
  process.exit(1);
}
{
  /* Somebody's own A B C D, kept in a spreadsheet, with nothing to say about
     sound -- which is the case § One place, not fifteen was written after. */
  const s = 'Letter,Name\nϘ,qoppa\nᛗ,mannaz\nϠ,sampi\n';
  const r = read(s);
  is('an alphabet of names and no sounds: the roles', r.roles, ['ch', 'nm']);
  is('an alphabet of names and no sounds: the name', r.rows[0].nm, 'qoppa');
  is('an alphabet of names and no sounds: no sound was invented', r.rows[0].ph, []);

  /* through the REAL ltNew, with the fields impPut() puts on it */
  const l = LT.ltNew({ ch: r.rows[0].ch, nm: r.rows[0].nm, snd: [] });
  is('an imported letter is called what the file called it', LT.ltName(l), 'qoppa');

  /* The road that matters, and the one the owner met: a box on a sheet, whose
     printed name is ONE character. The picture is the letter and there is no
     reading at all, so the name is the only thing that can carry a code
     point. www/sheet.js's shTakeIn() makes exactly this. */
  const w = LT.ltNew({ nm: 'a', sh: [[[200, 200], [600, 200], [600, 600]]], via: 'write' });
  is('a letter off a sheet is called what was printed over its box',
     LT.ltName(w), 'a');
  is('and a one-character name is a way to type it, in both cases',
     [LT.ltCodes(w).indexOf('a') >= 0, LT.ltCodes(w).indexOf('A') >= 0], [true, true]);

  /* And a LONGER name is not, on purpose and at a price that was measured.
     A code of more than one character is reached by a ligature over the
     characters it is spelled with, and an OpenType rule fires only over
     glyphs that exist -- so www/glyph.js makes one for every component no
     letter holds, and that glyph is the dashed placeholder box. One imported
     letter called `qoppa` would put a box on q, o, p and a, in every word, on
     every screen. A reading and a name somebody TYPED here keep the ligature
     road they have always had; a name that arrived off paper or out of a file
     may not spend the roman alphabet to become typeable. */
  is('a name of more than one character is NOT a code point',
     LT.ltCodes(l).indexOf('qoppa') >= 0, false);
  is('and neither are the letters it is spelled with',
     LT.ltCodes(l).filter(c => 'qopa'.indexOf(c) >= 0), []);

  /* What it reads is still a way to type it -- the name did not replace it. */
  const k = LT.ltNew({ nm: 'ka', snd: ['k'] });
  is('a letter answers to its reading',
     [LT.ltCodes(k).indexOf('k') >= 0, LT.ltCodes(k).indexOf('K') >= 0], [true, true]);

  /* A name of two words would be written as a ligature over the characters it
     is spelled with, and one of those characters is a SPACE -- which has no
     glyph, so scriptGlyphDefs() would make one and every space in the app
     would come out as the dashed placeholder box. A name a font cannot reach
     is a letter that is not in the font; a space that draws a box is every
     screen in the app. */
  const two = LT.ltNew({ nm: 'my letter', snd: [] });
  is('a name with a space in it is not made into a ligature over a space',
     LT.ltCodes(two).filter(c => /\s/.test(c)), []);
}

if (fails.length){
  console.error('\nimport: ' + fails.length + ' problem' + (fails.length > 1 ? 's' : '') + '.\n');
  fails.forEach(f => console.error('  ' + f + '\n'));
  process.exit(1);
}
console.log('import: every shape a list arrives in — a spreadsheet with any columns in any\n' +
            '        order, Excel pasted straight in, semicolon CSV, backslash-coded\n' +
            '        lexicons, JSON, plain lines, and a bare list of meanings —\n' +
            '        and a one-character name a file gave a letter is a way to type it.');
