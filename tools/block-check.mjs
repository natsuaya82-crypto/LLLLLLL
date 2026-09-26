/* A SYLLABLE'S LETTERS IN ONE SQUARE, AND THE LETTERS OUT AS SVG.
   ------------------------------------------------------------------------
   「組み合わせてやるのも作ろう svgも足そう」 OWNER 2026-09-26.

   Nothing here throws. A piece drawn into the wrong part of the square, a
   cut that is chosen and not kept, an abugida whose letter moved because the
   block was built beside it, a file with a letter missing -- every one of
   them is a font that installs and a screen that renders. So this drives the
   real app and asks:

   1. THE SQUARE. In a block the pieces of a syllable stand where the cut puts
      them: side by side (ka), side by side over the final (kan), one over the
      other (ko), one over the other over the final (kon), and the square in
      four, 田 (kant, and kan with its one final in the left quarter alone).
      Four parts at most: a syllable of five letters is not put together.
      「4分割までで作れればいいんちゃう？」 OWNER 2026-09-26. Asked of where
      the ink IS -- every point of a piece inside its part -- and never of the
      boxes wsBlockBoxes() answers, because a check that asks the function
      under test is a copy of it.
   2. THE PEN IS NOT SHRUNK, because the pen is not on a stroke: a piece is
      its strokes moved, and the strokes carry nothing else that changed.
   3. AN ABUGIDA IS WHAT IT WAS: the consonant's strokes and then the mark's,
      the same objects, which is what it was before it shared the mechanism.
   4. THE FONT CARRIES IT: LinguaFont.build is handed the square for a
      syllable a word says, under the unit's own glyph name.
   5. THE CUT IS KEPT: chosen on the vowel's own letter page (the list and
      the vowel screen it replaced are gone), saved by the Save in the bar,
      and still there after the language is read back out of its slice --
      langRead() used to copy four fields of `script` by name and drop the
      rest.
   6. SVG: the share mark on the letters goes to the export screen -- no pop
      「そのポップでフォントとsvg出すのはやめてくれ」 -- and SVG there hands the
      share sheet a file with one group per drawn letter, each a path inside
      its own square, and nothing else; one letter's page hands over that
      letter alone.
   --------------------------------------------------------------------------- */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{width:390,height:844} });
const errs = [];
pg.on('pageerror', e => errs.push(e.message));
await pg.goto('file://' + path.join(dir,'..','www','index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:10000 });

const r = await pg.evaluate(async ({s}) => {
  eval('(' + s + ')()');
  SET.walked = true;
  var out = {};
  planGot('pro');
  /* the fixture's k is drawn; a, o and n are slots with nothing on them */
  var K = [{pts:[[112,112],[688,112],[400,688]]}];
  inkSet(ltMain('k'), K);
  inkSet(ltMain('a'), [{pts:[[400,112],[400,688]]}]);
  inkSet(ltMain('o'), [{pts:[[112,400],[688,400]], rd:1}]);
  inkSet(ltMain('n'), [{pts:[[112,112],[112,688],[688,688]]}]);
  inkSet(ltMain('t'), [{pts:[[112,112],[688,112]]}]);

  /* the part of the square each piece's ink stands in */
  function span(st){
    var x0=1e9, x1=-1e9, y0=1e9, y1=-1e9;
    st.forEach(function(k){ k.pts.forEach(function(p){
      if(p[0]<x0) x0=p[0]; if(p[0]>x1) x1=p[0]; if(p[1]<y0) y0=p[1]; if(p[1]>y1) y1=p[1]; }); });
    return {x0:x0, x1:x1, y0:y0, y1:y1};
  }
  function pieces(unit, n){
    var st = wsStrokes(unit) || [], ls = [K.length, 1, 1, 1], o = [], i = 0;
    for (var j = 0; j < n; j++){ o.push(span(st.slice(i, i+ls[j]))); i += ls[j]; }
    return { n: st.length, p: o, st: st };
  }
  langWsysGot(langId, 'block');
  out.wsys = wsys();
  wsBlkSet('o', 'tb'); wsBlkSet('a', 'lr');
  out.ka = pieces('ka', 2); out.kan = pieces('kan', 3);
  out.ko = pieces('ko', 2); out.kon = pieces('kon', 3);
  out.oflag = out.ko.st[1] && out.ko.st[1].rd === 1;
  wsBlkSet('a', 'q');
  out.qa = pieces('ka', 2); out.qan = pieces('kan', 3); out.qant = pieces('kant', 4);
  wsBlkSet('o', 'lr'); wsBlkSet('a', 'lr');
  /* asked side by side: 田 would refuse it on its own shape, and what is
     held here is the four for every cut */
  out.five = wsStrokes('knant');

  /* 3 -- an abugida */
  langWsysGot(langId, 'abugida');
  var ab = wsStrokes('ka');
  out.ab = !!ab && ab.length === 2 && ab[0] === inkGeo(ltMain('k'))[0] && ab[1] === inkGeo(ltMain('a'))[0];

  /* 4 -- the font */
  langWsysGot(langId, 'block');
  var handed = null, b0 = LinguaFont.build;
  LinguaFont.build = function(defs){ if (!handed) handed = defs; return b0.apply(this, arguments); };
  SFONT.sig = null; installScriptFont();
  LinguaFont.build = b0;
  var want = JSON.stringify(inkDef(wsStrokes('ka')).strokes), got = null;
  (handed || []).forEach(function(d){ if (d.name === glyphKey('ka')) got = JSON.stringify(d.strokes); });
  out.fontHanded = !!handed;
  out.font = got === want;

  /* 5 -- the cut, chosen, saved and read back */
  var realSN = window.netSaveNow;
  window.netSaveNow = function(cb){ if (cb) cb(true); };
  out.gone = !PAGES.blk && !PAGES.blkv;
  function cutOn(k){
    window.route = 'letter'; NAV = [{ r:'letters' }, { r:'letter', a: ltMain('o').id }]; render();
    var row = document.querySelector('#app [data-do="ltCutPick"][data-a*="' + k + '"]');
    var rows = document.querySelectorAll('#app [data-do="ltCutPick"]').length;
    if (row) row.click();
    var sv = document.querySelector('.navtop [data-do="keepPress"]');
    var lit = !!(sv && sv.classList.contains('navon'));
    if (sv) sv.click();
    return { row: !!row, rows: rows, lit: lit };
  }
  out.cutQ = cutOn('q');
  await new Promise(function(f){ setTimeout(f, 50); });
  out.keptQ = wsBlkOf('o');
  out.cutTb = cutOn('tb');
  await new Promise(function(f){ setTimeout(f, 50); });
  window.route = 'letter'; NAV = [{ r:'letters' }, { r:'letter', a: ltMain('k').id }]; render();
  out.consRows = document.querySelectorAll('#app [data-do="ltCutPick"]').length;
  window.netSaveNow = realSN;
  out.kept = wsBlkOf('o');
  langRead();
  out.reread = wsBlkOf('o');
  out.sliceHas = JSON.stringify((slRd(langKey('script')) && JSON.parse(slRd(langKey('script'))).blk) || null);

  /* 6 -- SVG */
  var sent = [], sp0 = window.sharePlug;
  window.sharePlug = function(){ return function(plug, m, o){
    sent.push({ m: m, o: o }); return Promise.resolve({ file: 'x' }); }; };
  function file(i){
    var o = sent[i] && sent[i].o;
    return (o && o.ext === 'svg') ? decodeURIComponent(escape(atob(o.b64))) : '';
  }
  function read(txt){
    var d = new DOMParser().parseFromString(txt, 'image/svg+xml');
    if (d.getElementsByTagName('parsererror').length) return null;
    var gs = [].slice.call(d.getElementsByTagName('g'));
    return gs.map(function(g){
      var tr = (g.getAttribute('transform') || '').match(/-?[\d.]+/g) || [0, 0];
      var pd = (g.getElementsByTagName('path')[0] || { getAttribute: function(){ return ''; } }).getAttribute('d') || '';
      var nums = (pd.match(/-?[\d.]+/g) || []).map(Number), inside = nums.length > 0;
      nums.forEach(function(v){ if (v < -40 || v > 840) inside = false; });
      var tt = g.getElementsByTagName('title')[0];
      return { at: tr.map(Number), inside: inside, title: tt ? tt.textContent : '' };
    });
  }
  window.route = 'letters'; NAV = [{ r:'letters' }]; render();
  var mk = document.querySelector('.navtop [data-do="go"][data-a*="ltout"]');
  out.mark = !!mk;
  if (mk) mk.click();
  render();
  out.at = here().r;
  out.pop = typeof popOn === 'function' && popOn();
  out.outRows = [].slice.call(document.querySelectorAll('#app [data-do="ltFontOut"], #app [data-do="ltSvgOut"]')).map(function(b){ return b.textContent; });
  var svg = document.querySelector('#app [data-do="ltSvgOut"]');
  if (svg) svg.click();
  await new Promise(function(f){ setTimeout(f, 50); });
  out.drawn = ltPuaOrder().map(ltName);
  out.all = read(file(0));
  out.allShare = sent[1] && sent[1].m === 'shareFile';
  sent = [];
  window.route = 'letter'; NAV = [{ r:'letter', a: ltMain('k').id }]; render();
  var one = document.querySelector('.navtop [data-do="ltSvgOne"]');
  out.oneMark = !!one;
  if (one) one.click();
  await new Promise(function(f){ setTimeout(f, 50); });
  out.one = read(file(0));
  out.oneName = ltName(ltMain('k'));
  window.sharePlug = sp0;
  return out;
}, { s: seed.toString() });
await br.close();

const bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }
const M = 400;   /* the middle of the square */
const q = x => x.p.map(p => '[' + [p.x0, p.x1, p.y0, p.y1].join(' ') + ']').join(' ');

say(r.wsys === 'block', 'the language is written in blocks (' + r.wsys + ')');
say(r.ka.n === 2 && r.ka.p[0].x1 < M && r.ka.p[1].x0 > M && r.ka.p[0].y0 === 112 && r.ka.p[0].y1 === 688,
    'ka: the consonant left, the vowel right, both as tall as they were drawn -- ' + q(r.ka));
say(r.kan.n === 3 && r.kan.p[0].x1 < M && r.kan.p[1].x0 > M && r.kan.p[2].y0 > Math.max(r.kan.p[0].y1, r.kan.p[1].y1),
    'kan: the same row over the final -- ' + q(r.kan));
say(r.ko.n === 2 && r.ko.p[0].y1 < M && r.ko.p[1].y0 > M,
    'ko: a vowel cut under -- the consonant over it -- ' + q(r.ko));
say(r.kon.n === 3 && r.kon.p[0].y1 < r.kon.p[1].y0 && r.kon.p[1].y1 < r.kon.p[2].y0,
    'kon: consonant, vowel, final, one under another -- ' + q(r.kon));
say(r.qa.n === 2 && r.qa.p[0].x1 < M && r.qa.p[1].x0 > M && r.qa.p[0].y1 === 688,
    'ka in four: nothing under it, so it is side by side -- ' + q(r.qa));
say(r.qan.n === 3 && r.qan.p[0].x1 < M && r.qan.p[0].y1 < M && r.qan.p[1].x0 > M && r.qan.p[1].y1 < M &&
    r.qan.p[2].x1 < M && r.qan.p[2].y0 > M,
    'kan in four: consonant top left, vowel top right, the one final in the left quarter alone -- ' + q(r.qan));
say(r.qant.n === 4 && r.qant.p[2].x1 < M && r.qant.p[2].y0 > M && r.qant.p[3].x0 > M && r.qant.p[3].y0 > M &&
    r.qant.p[0].y1 < M && r.qant.p[1].x0 > M && r.qant.p[1].y1 < M,
    'kant in four: 田, each letter in its own quarter -- ' + q(r.qant));
say(r.five === null, 'a syllable of five letters is not put together (' + JSON.stringify(r.five && r.five.length) + ')');
say(r.oflag, 'a piece keeps what its strokes carry (the round on o), only moved');
say(r.ab, 'an abugida\'s letter is the consonant\'s strokes and then the mark\'s, the same objects as before');
say(r.fontHanded && r.font, 'the font is handed the square for ka under the unit\'s own glyph');
say(r.gone, 'the list of cuts and the vowel screen are gone -- one road');
say(r.cutQ.rows === 3 && r.cutQ.row && r.cutQ.lit, 'the vowel o\'s letter page: three cuts, 田 pressed, the Save lit');
say(r.keptQ === 'q', 'saved: o is cut in four (' + r.keptQ + ')');
say(r.cutTb.row && r.cutTb.lit, 'and then under, pressed and saved on the same page');
say(r.kept === 'tb', 'saved: o is cut under (' + r.kept + ')');
say(r.consRows === 0, 'a consonant\'s page has no cut on it (' + r.consRows + ')');
say(r.reread === 'tb' && /"o":"tb"/.test(r.sliceHas), 'and read back out of the slice it is still under (' + r.reread + ', ' + r.sliceHas + ')');
say(r.mark && r.at === 'ltout' && !r.pop, 'the share mark on the letters goes to the export screen, and nothing pops (' + r.at + ')');
say(r.outRows.length === 2 && /SVG/.test(r.outRows[1]), 'it is two rows, font and SVG (' + r.outRows.join(' / ') + ')');
say(!!r.all && r.all.length === r.drawn.length && r.all.length > 0,
    'SVG: one group per drawn letter -- ' + (r.all ? r.all.length : 'no file') + ' of ' + r.drawn.length);
say(!!r.all && r.all.every(g => g.inside) && r.all.every((g, i) => g.at[0] === (i % 8) * 800 && g.at[1] === Math.floor(i / 8) * 800),
    'each a path inside its own square, eight across');
say(!!r.all && r.all.every((g, i) => g.title === r.drawn[i]), 'each named by its letter, in the alphabet\'s order');
say(r.allShare, 'and handed to the share sheet');
say(r.oneMark && !!r.one && r.one.length === 1 && r.one[0].title === r.oneName && r.one[0].inside,
    'one letter\'s page: that letter, alone');
say(!errs.length, 'nothing threw' + (errs.length ? ' -- ' + errs.join(' | ') : ''));

if (bad.length) { console.error('\nblock: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nblock: seven squares, five letters refused, an abugida unchanged, the font, the cut kept on the vowel\'s page, and SVG out.');
