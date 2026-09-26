/* A SYLLABLE'S LETTERS IN ONE SQUARE, AND THE LETTERS OUT AS SVG.
   ------------------------------------------------------------------------
   「組み合わせてやるのも作ろう svgも足そう」 OWNER 2026-09-26.

   Nothing here throws. A piece drawn into the wrong part of the square, a
   cut that is chosen and not kept, an abugida whose letter moved because the
   block was built beside it, a file with a letter missing -- every one of
   them is a font that installs and a screen that renders. So this drives the
   real app and asks:

   1. THE SQUARE. In a block every piece of a syllable stands where it was
      DRAWN, as large as it was drawn, laid over the others -- the drawing
      square is already cut in four (田), so the quarter a letter is drawn in
      is where it goes. 「せっかく4つに区切ってるから、それうまく利用しない？
      そうすれば置き場所指定しなくても入れるやん？」 OWNER 2026-09-26. The one
      exception is a final: drawn in the top half it moves half the square
      down -- the first into the lower left, a second into the lower right --
      and one already drawn low is not moved. Asked of the ink: each piece is
      the drawn strokes point for point, or the drawn strokes moved by one
      constant, into the quarter asked for. Four letters at most, two finals
      at most.
   2. THE PEN IS NOT SHRUNK, because the pen is not on a stroke: a piece is
      its strokes (moved, for a final), and the strokes carry nothing else
      that changed.
   3. AN ABUGIDA IS WHAT IT WAS: the consonant's strokes and then the mark's,
      the same objects, which is what it was before it shared the mechanism.
   4. THE FONT CARRIES IT: LinguaFont.build is handed the square for a
      syllable a word says, under the unit's own glyph name.
   5. NOBODY CHOOSES A CUT: the vowel's letter page has no placement on it,
      the name that chose one is gone, and a `blk` already in the `script`
      slice is not read -- ka is side by side with {"a":"tb"} in it -- and
      is not dropped either: it is still in the slice after a save and a
      read back.
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
  /* k, a, n and t drawn in the top half, o in the bottom half */
  var K = [{pts:[[130,130],[370,130],[370,370]]}],
      A = [{pts:[[560,120],[560,380]]}, {pts:[[560,250],[680,250]]}],
      O = [{pts:[[180,560],[620,560]], rd:1}],
      N = [{pts:[[140,130],[140,370],[370,370]]}],
      T = [{pts:[[130,140],[370,140]]}, {pts:[[250,140],[250,370]]}];
  inkSet(ltMain('k'), K); inkSet(ltMain('a'), A); inkSet(ltMain('o'), O);
  inkSet(ltMain('n'), N); inkSet(ltMain('t'), T);

  /* how a piece stands against what was drawn: the same points (0,0), the
     same points moved by one constant [dx,dy], or not the drawing at all
     (null); and whether every point is inside the quarter asked for */
  function moved(piece, drawn){
    var d = null, ok = piece.length === drawn.length;
    drawn.forEach(function(k, i){
      if (!ok || !piece[i] || piece[i].pts.length !== k.pts.length) { ok = false; return; }
      k.pts.forEach(function(p, j){
        var q = piece[i].pts[j], e = [q[0]-p[0], q[1]-p[1]];
        if (!d) d = e; else if (d[0] !== e[0] || d[1] !== e[1]) ok = false;
      });
    });
    return ok ? d : null;
  }
  function inQ(piece, qx, qy){
    return piece.every(function(k){ return k.pts.every(function(p){
      return (qx ? p[0] >= 400 : p[0] <= 400) && (qy ? p[1] >= 400 : p[1] <= 400); }); });
  }
  function pieces(unit, drawn){
    var st = wsStrokes(unit), o = [], i = 0;
    if (!st) return null;
    drawn.forEach(function(g){ o.push(st.slice(i, i + g.length)); i += g.length; });
    return { n: st.length, want: i, p: o, mv: o.map(function(x, j){ return moved(x, drawn[j]); }) };
  }
  langWsysGot(langId, 'block');
  out.wsys = wsys();
  out.ka = pieces('ka', [K, A]);
  out.ko = pieces('ko', [K, O]);
  out.kan = pieces('kan', [K, A, N]);
  out.kanQ = out.kan && inQ(out.kan.p[2], 0, 1);
  out.kant = pieces('kant', [K, A, N, T]);
  out.kantQ = out.kant && inQ(out.kant.p[2], 0, 1) && inQ(out.kant.p[3], 1, 1);
  out.kon = pieces('kon', [K, O, N]);
  out.oflag = out.ko && out.ko.p[1][0] && out.ko.p[1][0].rd === 1;
  /* a final already drawn low stays where it was drawn */
  var NL = [{pts:[[140,500],[140,700],[370,700]]}];
  inkSet(ltMain('n'), NL);
  out.kanLow = pieces('kan', [K, A, NL]);
  /* and a second final drawn across the middle is moved down, not across */
  var TW = [{pts:[[130,140],[600,140]]}];
  inkSet(ltMain('n'), N); inkSet(ltMain('t'), TW);
  out.kantWide = pieces('kant', [K, A, N, TW]);
  inkSet(ltMain('t'), T);
  out.five = wsStrokes('knant');
  out.three = wsStrokes('ankt');
  out.after = wsStrokes('kana');

  /* 3 -- an abugida */
  langWsysGot(langId, 'abugida');
  var ab = wsStrokes('ka');
  out.ab = !!ab && ab.length === 3 && ab[0] === inkGeo(ltMain('k'))[0] &&
           ab[1] === inkGeo(ltMain('a'))[0] && ab[2] === inkGeo(ltMain('a'))[1];

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

  /* 5 -- nobody chooses a cut, and what an older build chose stays put */
  out.gone = !PAGES.blk && !PAGES.blkv && typeof window.ltCutPick === 'undefined' &&
             typeof window.wsBlkOf === 'undefined' && typeof window.WS_BLK_CUTS === 'undefined';
  window.route = 'letter'; NAV = [{ r:'letters' }, { r:'letter', a: ltMain('a').id }]; render();
  out.vowRows = document.querySelectorAll('#app [data-do="ltCutPick"]').length;
  out.vowPage = here().r === 'letter' && !!document.querySelector('#app .gcell, #app canvas, #app [data-do]');
  var realSN = window.netSaveNow;
  window.netSaveNow = function(cb){ if (cb) cb(true); };
  window.route = 'letters'; NAV = [{ r:'letters' }]; render();
  SCRIPT.blk = { a:'tb' };
  out.kaOld = pieces('ka', [K, A]);
  save();
  langRead();
  out.sliceHas = JSON.stringify((slRd(langKey('script')) && JSON.parse(slRd(langKey('script'))).blk) || null);
  out.readHas = JSON.stringify(SCRIPT.blk || null);
  window.netSaveNow = realSN;

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

const same = x => !!x && x.mv.every(d => d && d[0] === 0 && d[1] === 0);
const shown = x => !x ? 'not put together' : x.mv.map(d => d ? '[' + d.join(',') + ']' : 'not the drawing').join(' ');
say(r.wsys === 'block', 'the language is written in blocks (' + r.wsys + ')');
say(!!r.ka && r.ka.n === r.ka.want && same(r.ka),
    'ka: the consonant and the vowel exactly where they were drawn, nothing shrunk -- ' + shown(r.ka));
say(!!r.ko && r.ko.n === r.ko.want && same(r.ko),
    'ko: the vowel drawn low stays low, over nothing but where it was drawn -- ' + shown(r.ko));
say(!!r.kan && same({ mv: r.kan.mv.slice(0, 2) }) && r.kan.mv[2] && r.kan.mv[2][0] === 0 && r.kan.mv[2][1] > 0 && r.kanQ,
    'kan: the final drawn top left moves straight down into the lower left -- ' + shown(r.kan));
say(!!r.kant && same({ mv: r.kant.mv.slice(0, 2) }) && r.kant.mv[3] && r.kant.mv[3][0] > 0 && r.kant.mv[3][1] > 0 && r.kantQ,
    'kant: the second final moves down and right into the lower right -- ' + shown(r.kant));
say(!!r.kon && same({ mv: r.kon.mv.slice(0, 2) }) && r.kon.mv[2] && r.kon.mv[2][1] > 0,
    'kon: a final under a low vowel moves down all the same -- ' + shown(r.kon));
say(!!r.kanLow && same(r.kanLow), 'a final already drawn low is not moved -- ' + shown(r.kanLow));
say(!!r.kantWide && r.kantWide.mv[3] && r.kantWide.mv[3][0] === 0 && r.kantWide.mv[3][1] > 0,
    'a second final drawn across the middle moves down and not across -- ' + shown(r.kantWide));
say(r.five === null, 'a syllable of five letters is not put together (' + JSON.stringify(r.five && r.five.length) + ')');
say(r.three === null, 'three finals are not put together (' + JSON.stringify(r.three && r.three.length) + ')');
say(r.oflag, 'a piece keeps what its strokes carry (the round on o)');
say(r.ab, 'an abugida\'s letter is the consonant\'s strokes and then the mark\'s, the same objects as before');
say(r.fontHanded && r.font, 'the font is handed the square for ka under the unit\'s own glyph');
say(r.gone, 'the placement is gone -- no route, no ltCutPick, no wsBlkOf, no WS_BLK_CUTS');
say(r.vowPage && r.vowRows === 0, 'the vowel a\'s letter page has no placement on it (' + r.vowRows + ')');
say(same(r.kaOld), 'a blk an older build wrote is not read: ka is still where it was drawn -- ' + shown(r.kaOld));
say(/"a":"tb"/.test(r.sliceHas) && /"a":"tb"/.test(r.readHas),
    'and it is not dropped: in the slice after a save and a read back (' + r.sliceHas + ')');
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
console.log('\nblock: seven squares as drawn, the finals moved down, five letters and three finals refused, an abugida unchanged, the font, no placement, an old blk kept, and SVG out.');
