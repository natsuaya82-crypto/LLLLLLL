// Does the hand-written ES5 font writer produce the SAME font as the opentype.js
// one that was already measured and shown to the user?
//
// Three independent checks, in increasing order of "could this still be wrong":
//
//   1. numbers      otf5's own placement (dx, advance, sidebearings) vs build5's
//   2. parse        opentype.js READS otf5's file back and its glyph paths are
//                   compared, point for point, with the ones build5 wrote
//   3. pixels       Chromium loads both .otf files and renders the same words;
//                   the bitmaps must be byte-identical, and the cell grid, the
//                   uniform advances and the s+h ligature must all still hold
//
// Check 2 is the one that catches a malformed table: opentype.js will not parse a
// CFF with a bad INDEX or a broken charset, and it does not share a line of code
// with otf5.js.
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
const ot = require('opentype.js');
const LinguaFont = require('../../www/otf5.js');
const HERE = new URL('.', import.meta.url).pathname;

const realLog = console.log;
console.log = function () {};
const v5 = await import('./build5.mjs');
console.log = realLog;
const { buildFont, GLYPHS, BASE } = v5;

const PEN = { width: 60, angleDeg: 0, contrast: 1.0 };
const ref = buildFont('center', { pen: PEN });
const mine = LinguaFont.build(GLYPHS, {
  mode: 'center', pen: PEN,
  ligatures: [{ sub: ['s', 'h'], by: 's_h' }],
});
fs.writeFileSync(HERE + 'LS7-center-60.otf', Buffer.from(mine.bytes));

let fail = 0;
const ok = (name, cond, detail) => {
  if (!cond) fail++;
  console.log('  ' + (cond ? 'ok  ' : 'FAIL') + '  ' + name.padEnd(46)
    + (detail === undefined ? '' : detail));
};

// ---- 1. placement numbers --------------------------------------------------
console.log('\n1. placement, otf5 vs build5');
let worstDx = 0, worstAdv = 0, worstLsb = 0;
GLYPHS.forEach(g => {
  const a = ref.metrics[g.name], b = mine.metrics[g.name];
  worstDx = Math.max(worstDx, Math.abs(a.dx - b.dx));
  worstAdv = Math.max(worstAdv, Math.abs(a.adv - b.adv));
  worstLsb = Math.max(worstLsb, Math.abs(a.lsb - b.lsb));
});
ok('dx identical for all ' + GLYPHS.length + ' glyphs', worstDx === 0, 'max diff ' + worstDx);
ok('advance identical', worstAdv === 0, 'max diff ' + worstAdv);
ok('lsb identical', worstLsb === 0, 'max diff ' + worstLsb);
ok('advance is the cell (800)', GLYPHS.every(g => mine.metrics[g.name].adv === 800));
ok('space is one cell', mine.spaceAdv === 800);

// ---- 2. opentype.js parses it back -----------------------------------------
console.log('\n2. opentype.js reads otf5\'s file back');
let parsed = null, parseErr = '';
try {
  parsed = ot.parse(mine.bytes.buffer.slice(mine.bytes.byteOffset,
                                            mine.bytes.byteOffset + mine.bytes.byteLength));
} catch (e) { parseErr = e.message; }
ok('parses without error', !!parsed, parseErr);
if (parsed) {
  const refFont = ot.parse(ref.buf.buffer.slice(ref.buf.byteOffset,
                                                ref.buf.byteOffset + ref.buf.length));
  ok('unitsPerEm 1000', parsed.unitsPerEm === 1000);
  ok('ascender/descender 800/-200',
    parsed.ascender === 800 && parsed.descender === -200);
  ok('glyph count matches build5',
    parsed.glyphs.length === refFont.glyphs.length,
    parsed.glyphs.length + ' vs ' + refFont.glyphs.length);

  // point-for-point path comparison, per glyph, via the cmap so gid order cannot
  // silently paper over a mismatch
  let worstPt = 0, cmapMiss = [];
  'aiklsht'.split('').forEach(ch => {
    const gi = parsed.charToGlyphIndex(ch), gr = refFont.charToGlyphIndex(ch);
    if (gi <= 0) { cmapMiss.push(ch); return; }
    const A = parsed.glyphs.get(gi).path.commands.filter(c => c.type !== 'Z');
    const B = refFont.glyphs.get(gr).path.commands.filter(c => c.type !== 'Z');
    if (A.length !== B.length) { worstPt = Infinity; return; }
    for (let i = 0; i < A.length; i++) {
      worstPt = Math.max(worstPt, Math.abs(A[i].x - B[i].x), Math.abs(A[i].y - B[i].y));
    }
  });
  ok('cmap resolves every roman letter', cmapMiss.length === 0, cmapMiss.join(''));
  ok('outline points identical to build5', worstPt === 0,
    worstPt === Infinity ? 'different point counts' : 'max diff ' + worstPt);
  ok('advanceWidth from hmtx is 800',
    'aiklsht'.split('').every(ch => parsed.glyphs.get(parsed.charToGlyphIndex(ch)).advanceWidth === 800));
  const contours = 'aiklsht'.split('').reduce((n, ch) =>
    n + parsed.glyphs.get(parsed.charToGlyphIndex(ch)).path.commands.filter(c => c.type === 'Z').length, 0);
  ok('contours closed (Z commands present)', contours > 0, contours + ' contours');
}

// ---- 3. Chromium renders both and the pixels agree -------------------------
console.log('\n3. Chromium: both faces, same pixels');
const b64 = buf => Buffer.from(buf).toString('base64');
const page = '<!doctype html><meta charset="utf-8"><style>'
  + '@font-face{font-family:REF;src:url(data:font/otf;base64,' + b64(ref.buf) + ') format("opentype")}'
  + '@font-face{font-family:NEW;src:url(data:font/otf;base64,' + b64(mine.bytes) + ') format("opentype")}'
  + 'body{margin:0;background:#fff}</style><body></body>';

const srv = http.createServer((rq, rs) => {
  if (rq.url !== '/') { rs.writeHead(204); rs.end(); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  rs.end(page);
}).listen(8195);

let pw;
try { pw = require('playwright'); }
catch (e) { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const br = await pw.chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 900, height: 300 } });
const errs = [];
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
await pg.goto('http://127.0.0.1:8195/', { waitUntil: 'load' });

const r = await pg.evaluate(async () => {
  const WORD = 'ashi kilt hasa talish shakil';
  for (const f of ['REF', 'NEW']) await document.fonts.load('100px "' + f + '"', WORD);
  const loaded = {
    REF: document.fonts.check('100px "REF"', WORD),
    NEW: document.fonts.check('100px "NEW"', WORD),
  };
  const cnv = document.createElement('canvas');
  cnv.width = 3200; cnv.height = 260;
  const cx = cnv.getContext('2d');
  const shot = fam => {
    cx.clearRect(0, 0, cnv.width, cnv.height);
    cx.fillStyle = '#fff'; cx.fillRect(0, 0, cnv.width, cnv.height);
    cx.fillStyle = '#000'; cx.font = '100px "' + fam + '"';
    cx.fillText(WORD, 20, 190);
    return cx.getImageData(0, 0, cnv.width, cnv.height).data;
  };
  const A = shot('REF'), B = shot('NEW');
  let diff = 0, ink = 0;
  for (let i = 0; i < A.length; i += 4) {
    if (A[i] < 250) ink++;
    if (A[i] !== B[i]) diff++;
  }
  const wid = (fam, s, px) => { cx.font = px + 'px "' + fam + '"'; return cx.measureText(s).width; };
  const L = ['a', 'i', 'k', 'l', 's', 't'];
  const grid = fam => {
    const cell = wid(fam, 'a', 17);
    let worst = 0;
    for (const p of L) for (const q of L) {
      worst = Math.max(worst, Math.abs(wid(fam, p + q, 17) - 2 * cell));
    }
    const uniq = {};
    L.forEach(c => { uniq[wid(fam, c, 17).toFixed(3)] = 1; });
    return {
      cell17: +cell.toFixed(3),
      uniform: Object.keys(uniq).length === 1,
      worstPairErr: +worst.toFixed(3),
      lineErr: +(wid(fam, 'kalitass', 17) - 8 * cell).toFixed(3),
      ligCells: +((wid(fam, 's', 17) + wid(fam, 'h', 17) - wid(fam, 'sh', 17)) / cell).toFixed(3),
    };
  };
  return { loaded, diff, ink, ref: grid('REF'), neu: grid('NEW') };
});
await br.close();
srv.close();

ok('both faces really loaded (not fallback)', r.loaded.REF && r.loaded.NEW,
  JSON.stringify(r.loaded));
ok('ink actually drawn', r.ink > 5000, r.ink + ' inked subpixels');
ok('rendered pixels identical to opentype.js font', r.diff === 0, r.diff + ' differing');
ok('cell uniform across letters', r.neu.uniform);
ok('cell 17px matches reference', r.neu.cell17 === r.ref.cell17,
  r.neu.cell17 + ' vs ' + r.ref.cell17);
ok('worst pair error 0px', r.neu.worstPairErr === 0, r.neu.worstPairErr + 'px');
ok('8-letter line is 8 cells', r.neu.lineErr === 0, r.neu.lineErr + 'px');
ok('s+h ligature costs exactly 1 cell', Math.abs(r.neu.ligCells - 1) < 0.02,
  r.neu.ligCells + ' cells');
ok('no console errors', errs.length === 0, errs.join(' | '));

// ---- 4. one glyph, several codepoints --------------------------------------
// Headwords are stored capitalised ("Aelin"), and a script with no case
// distinction wants 'A' and 'a' to be the same drawing. The app therefore passes
// roman: 'aA'. Without this, an initial capital silently falls back to the
// system font, which is the failure the user would notice first.
console.log('\n4. one drawing, both cases');
const cased = LinguaFont.build(
  GLYPHS.map(g => ({ ...g, roman: g.roman ? g.roman + g.roman.toUpperCase() : null })),
  { mode: 'center', pen: PEN });
let casedFont = null, casedErr = '';
try {
  casedFont = ot.parse(cased.bytes.buffer.slice(cased.bytes.byteOffset,
                       cased.bytes.byteOffset + cased.bytes.byteLength));
} catch (e) { casedErr = e.message; }
ok('still parses with 2x the cmap entries', !!casedFont, casedErr);
if (casedFont) {
  const pairs = 'aiklsht'.split('').map(ch => [
    casedFont.charToGlyphIndex(ch), casedFont.charToGlyphIndex(ch.toUpperCase())]);
  ok('lowercase still resolves', pairs.every(p => p[0] > 0));
  ok('uppercase resolves to the SAME gid', pairs.every(p => p[0] === p[1]),
    pairs.map(p => p[0] + '/' + p[1]).join(' '));
  ok('glyph count unchanged (no duplicate glyphs)',
    casedFont.glyphs.length === parsed.glyphs.length,
    casedFont.glyphs.length + ' vs ' + parsed.glyphs.length);
}

console.log('\nLS7-center-60.otf ' + mine.bytes.length + ' bytes'
  + '   (opentype.js build: ' + ref.buf.length + ' bytes)');
console.log(fail ? '\n' + fail + ' FAILED' : '\nall checks passed');
process.exit(fail ? 1 : 0);
