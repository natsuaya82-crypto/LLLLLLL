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
     - anything about what happens after the read: the mapping screen, the
       duplicate policy and the undo are the app's, and press.mjs walks those
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
  is('excel paste: the row', r.rows[0], { hw: 'kano', mn: '山', pos: '名詞', ph: [] });
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
  is('headless: the row', r.rows[1], { hw: 'tir', mn: 'to see', pos: 'v', ph: [] });
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
  is('mdf: the row', r.rows[1], { hw: 'tir', mn: 'to see', pos: 'v', ph: ['t', 'i', 'r'] });
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
  is('lines: dash', r.rows[0], { hw: 'kano', mn: 'mountain', pos: '', ph: [] });
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
  is('meanings only: nothing became a spelling', r.rows[0], { hw: '', mn: 'mountain', pos: '', ph: [] });
}

/* ---- 10. the awkward edges ---------------------------------------------- */
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

if (fails.length){
  console.error('\nimport: ' + fails.length + ' problem' + (fails.length > 1 ? 's' : '') + '.\n');
  fails.forEach(f => console.error('  ' + f + '\n'));
  process.exit(1);
}
console.log('import: every shape a list arrives in — a spreadsheet with any columns in any\n' +
            '        order, Excel pasted straight in, semicolon CSV, backslash-coded\n' +
            '        lexicons, JSON, plain lines, and a bare list of meanings.');
