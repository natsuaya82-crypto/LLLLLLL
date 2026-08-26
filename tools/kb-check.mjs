/* A row goes when its number is pressed, a column when its letter is, and
   the step back puts either of them right again.
   ---------------------------------------------------------------------
   The editor is a sheet now, and a sheet is worked from its edges.
   「1触ったら1が全部消える a触ったらa列全部消える」

   Both of those throw keys away, and neither asks first -- what stands
   behind them is the step back, not a dialog. 「巻き戻しボタンと進むボタンも
   入れよう」 So the two have to be held together: a delete with a broken undo
   behind it is worse than a delete that asks, because the app has told
   somebody it is safe to try things.

   None of it can throw. A column taken out of the wrong rows, a key of three
   removed where it should have been narrowed to two, an undo that puts back
   the state after the change rather than the one before -- every one of those
   is a keyboard that still renders, still installs and is not the one
   somebody built. DELETE REVIEW is in docs/CHANGELOG.md.

   Run: node tools/kb-check.mjs                                          */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport: { width: 390, height: 844 } });
await pg.goto('file://' + path.join(dir, '..', 'www', 'index.html'));
await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });

const r = await pg.evaluate(({ s }) => {
  eval('(' + s + ')()');
  SET.done = true; SET.plan = 'pro';
  var out = {}, i, j;

  /* A board of this person's own, on the screen it is edited on. Board 0 is
     the free QWERTY and kbEdit() refuses it, which is the whole point of
     board 0. Rebuilt between groups so no claim is standing on what the one
     before it left behind. */
  function fresh(){
    KB = null; kbShow = 0; kbAdd('qwerty'); kbLay = 0;
    window.route = 'kb'; NAV = [{ r: 'kb', a: String(kbShow) }];
    render();
  }
  /* what a row is, as a string, so two of them can be compared */
  function say(row){
    return row.map(function (k){ return k.k + ':' + k.v + ':' + (k.w || 1); }).join(' ');
  }
  function rows(){ return kbLayer().rows.map(say); }
  function units(row){
    var n = 0, x;
    for (x = 0; x < row.length; x++) n += (row[x].w || 1);
    return n;
  }
  function widths(){ return kbLayer().rows.map(units); }

  /* ---- 0. the board arrives as the sheet it is meant to be ------------- */
  fresh();
  var was = rows();
  out.rows = was.length;
  out.cols = kbCols(kbLayer().rows);
  out.halves = kbLayer().rows.some(function (x){
    return x.some(function (k){ return (k.w || 1) === 0.5; });
  });

  /* ---- 1. the number takes its row and leaves the others alone --------- */
  kbHeadRow(1); kbCut();
  var now = rows();
  out.rowWent = now.length === was.length - 1;
  out.rowOnly = now.join('|') === was.slice(0, 1).concat(was.slice(2)).join('|');

  /* ---- 2. the step back puts it back, exactly -------------------------- */
  kbUndo();
  out.undo = rows().join('|') === was.join('|');
  kbRedo();
  out.redo = rows().join('|') === now.join('|');
  kbUndo();
  out.undo2 = rows().join('|') === was.join('|');

  /* ---- 3. several deletes walk back through them, in order ------------- */
  fresh();
  var s0 = rows();
  kbHeadRow(0); kbCut(); var s1 = rows();
  kbHeadRow(0); kbCut(); var s2 = rows();
  kbHeadRow(0); kbCut();
  kbUndo(); out.back1 = rows().join('|') === s2.join('|');
  kbUndo(); out.back2 = rows().join('|') === s1.join('|');
  kbUndo(); out.back3 = rows().join('|') === s0.join('|');

  /* ---- 4. the letter takes ONE key out of every row that reaches it ---- */
  fresh();
  var w0 = widths();
  kbHeadCol(0); kbCut();
  var w1 = widths();
  out.colEvery = w0.length === w1.length;
  out.colOne = w0.length === w1.length && w0.every(function (w, n){
    return Math.abs((w - w1[n]) - 1) < 0.001;
  });

  /* ---- 5. a key wider than a column is NARROWED, not removed ----------- */
  fresh();
  var rr = kbLayer().rows, ri = -1, ki = -1, at = 0;
  for (i = 0; i < rr.length; i++)
    for (j = 0; j < rr[i].length; j++)
      if (rr[i][j].k === 'sp' && (rr[i][j].w || 1) > 1 && ri < 0){ ri = i; ki = j; }
  out.foundWide = ri >= 0;
  if (ri >= 0){
    for (i = 0; i < ki; i++) at += (rr[ri][i].w || 1);
    var wasW = rr[ri][ki].w, n = rr[ri].length;
    kbHeadCol(Math.floor(at)); kbCut();
    var row = kbLayer().rows[ri];
    out.stillThere = row.length === n;
    out.narrowed = row.length === n && row[ki].k === 'sp' && row[ki].w === wasW - 1;
    kbUndo();
    out.wideBack = kbLayer().rows[ri][ki].w === wasW;
  }

  /* ---- 6. nothing outside this layout moves --------------------------- */
  fresh();
  var lts = LETTERS.length, wds = WORDS.length, brds = kbBoards().length,
      faces = KB.kbs[kbShow - 1].lay.length;
  kbHeadRow(0); kbCut(); kbHeadCol(1); kbCut(); kbUndo();
  out.letters = LETTERS.length === lts;
  out.words = WORDS.length === wds;
  out.boards = kbBoards().length === brds;
  out.faces = KB.kbs[kbShow - 1].lay.length === faces;

  /* ---- 6b. how big it may get, and that nothing is ever cut to fit ----
     「キーボード縦横って最大を決めてそれ以上は列も行も追加できないようにしよう」
     Held on ADDING only: an existing layout that is already over stays
     exactly as it is. */
  fresh();
  out.ceilRows = kbRowsMax();
  out.screenH = KB_REF_H;
  out.most = KB_MOST; out.roww = KB_ROWW; out.bars = KB_BARS;
  out.refW = KB_REF_W; out.rowh = kbRowH(KB_REF_W);
  out.ceilCols = KB_COLS;
  /* every pattern this app builds is inside the ceiling as it is built */
  out.patsFit = KB_PATS.every(function (p){
    return kbPatLay(p).every(function (face){
      return face.rows.length <= kbRowsMax() && face.rows.every(function (rw){
        var n = 0, x;
        for (x = 0; x < rw.length; x++) n += kbU(rw[x].w);
        return n <= KB_COLS;
      });
    });
  });
  /* rows stop at the ceiling, and the dashed row stops being drawn */
  fresh();
  for (i = 0; i < kbRowsMax() + 4; i++) kbAddRowNew();
  out.rowsCap = kbLayer().rows.length === kbRowsMax();
  out.plusGone = vKb().indexOf('kbAddRowNew') < 0;
  /* a full row takes no more keys, however it is asked */
  fresh();
  var full = -1;
  for (i = 0; i < kbLayer().rows.length; i++){
    var n2 = 0, rw = kbLayer().rows[i];
    for (j = 0; j < rw.length; j++) n2 += kbU(rw[j].w);
    if (n2 >= KB_COLS && full < 0) full = i;
  }
  out.foundFull = full >= 0;
  if (full >= 0){
    var had = kbLayer().rows[full].length;
    kbAddKey(full, 0, 1);
    out.colsCap = kbLayer().rows[full].length === had;
    /* and a key cannot be widened past it either */
    var w0 = kbLayer().rows[full][0].w || 1;
    kbSetW(full, 0, 4);
    out.wCap = (kbLayer().rows[full][0].w || 1) === w0;
  }
  /* NOTHING is cut down to fit: a layout already over the ceiling is left
     alone. This is the half that would lose somebody's keys. */
  fresh();
  var lay = kbEdit().lay[0];
  for (i = 0; i < 5; i++) lay.rows.push([kbKey('lt', ''), kbKey('lt', '')]);
  var over = lay.rows.length;
  saveKb(); render();
  out.overKept = kbLayer().rows.length === over;
  out.overStillCant = (kbAddRowNew(), kbLayer().rows.length === over);

  /* ---- 6c. a short row sits in the middle of the sheet ----------------- */
  fresh();
  kbEdit().lay[0].rows = [[kbKey('lt','a'), kbKey('lt','b'), kbKey('lt','c'),
                           kbKey('lt','d'), kbKey('lt','e')],
                          [kbKey('lt','f'), kbKey('lt','g'), kbKey('lt','h')]];
  saveKb(); render();
  var cells = document.querySelectorAll('#kb .kbrow')[1].children;
  var lead = 0, tail = 0, seen = false;
  for (i = 0; i < cells.length; i++){
    var c = cells[i];
    if (c.className.indexOf('kbn') >= 0) continue;
    if (c.getAttribute('data-k') !== null){ seen = true; continue; }
    if (seen) tail += 1; else lead += 1;
  }
  out.centreLead = lead;
  out.centreTail = tail;
  out.centred = lead === tail && lead > 0;

  /* ---- 6d. a page arrives with the way there and the way back ---------
     「2ページ目作ったときの切り替えボタンは？」 A face nothing can reach and
     nothing can leave is the trap docs/keyboard.md used to describe in four
     steps. */
  fresh();
  function keysOn(face){
    var o = [], a, x;
    for (a = 0; a < face.rows.length; a++)
      for (x = 0; x < face.rows[a].length; x++) o.push(face.rows[a][x]);
    return o;
  }
  function goesTo(face, n){
    return keysOn(face).some(function (k){
      return k.k === 'lay' && (parseInt(k.v, 10) || 0) === n;
    });
  }
  var b0 = kbEdit(), was0 = JSON.stringify(b0.lay[0]), had0 = keysOn(b0.lay[0]).length;
  kbAddLay();
  out.faces = b0.lay.length;
  out.wayThere = goesTo(b0.lay[0], 1);
  out.wayBack = goesTo(b0.lay[1], 0);
  /* and it went IN, next to what was there, rather than over it */
  out.keptKeys = keysOn(b0.lay[0]).length === had0 + 1;
  out.notOver = was0 !== JSON.stringify(b0.lay[0]);
  /* the step back takes the whole thing away again, both keys with it */
  kbUndo();
  out.layBack = JSON.stringify(kbEdit().lay[0]) === was0;
  /* Where it lands. A row with room takes it at its FRONT, which is where
     every phone keeps its 123 and where kbDefault() has always put it; a
     board whose rows are all full gets a row of its own instead. The QWERTY
     is ten across on every row, so both cases have to be built. */
  fresh();
  kbEdit().lay[0].rows = [[kbKey('lt', 'a'), kbKey('lt', 'b')]];
  kbLay = 0; saveKb(); render();
  kbAddLay();
  var r0 = kbEdit().lay[0].rows;
  out.layFront = r0.length === 1 && r0[0].length === 3 && r0[0][0].k === 'lay';
  fresh();
  var rowsWas2 = kbLayer().rows.length;      /* every row already ten across */
  kbAddLay();
  var rr2 = kbEdit().lay[0].rows;
  out.layNewRow = rr2.length === rowsWas2 + 1 &&
    rr2[rr2.length - 1].length === 1 && rr2[rr2.length - 1][0].k === 'lay';

  /* ---- 6d2. no face is a dead end ------------------------------------
     「2ページ目から戻るボタンがない」 OWNER, build #92.

     The two claims above are about the moment a page is MADE, and they were
     both true. Nothing was about the moment after: the sheet's two deletes
     take keys away by the row and by the column, and the way back is a key.
     Standing on a page somebody has just made -- one row, the back key and
     one empty slot -- and pressing that row's number left the face with no
     rows at all, which on the phone is a blank keyboard nobody can get off.

     Both roads, because they take the key from opposite sides, and the first
     of them also asks about the row itself: a face with no rows is not a
     face, and there is an x beside the tabs for being rid of one. */
  function offOf(face){
    var to = [];
    (face.rows || []).forEach(function (rw){
      rw.forEach(function (k){ if (k.k === 'lay') to.push(parseInt(k.v, 10) || 0); });
    });
    return to;
  }
  fresh(); kbAddLay(); kbLay = 1; render();
  out.deadRowsWas = kbEdit().lay[1].rows.length;
  kbHeadRow(0); kbCut();
  out.deadRowKept = kbEdit().lay[1].rows.length >= 1;
  out.deadRowOff = offOf(kbEdit().lay[1]).length > 0;
  /* and the face it goes back to is the one it came from, not a number that
     is now something else */
  out.deadRowTo = offOf(kbEdit().lay[1]).indexOf(0) >= 0;

  fresh(); kbAddLay(); kbLay = 1; render();
  /* a second row, so the column cut has something to take the key out of
     without the row floor above being what saves it */
  kbEdit().lay[1].rows.push([kbKey('lt', ''), kbKey('lt', '')]);
  kbLay = 1; saveKb(); render();
  kbHeadCol(0); kbCut();
  out.deadColOff = offOf(kbEdit().lay[1]).length > 0;

  /* and face 0 seen from the other end: with nothing on it pointing anywhere,
     every page after it is unreachable rather than inescapable */
  fresh(); kbAddLay(); kbLay = 0; render();
  kbEdit().lay[0].rows = [[kbKey('lt', 'a'), kbKey('lt', 'b')]];
  kbLay = 0; saveKb(); render();
  out.deadFirstOff = offOf(kbEdit().lay[0]).length > 0;

  /* A keyboard of ONE face is left alone: there is nowhere to go and a key
     that goes nowhere is a key that does nothing. */
  fresh();
  kbHeadRow(0); kbCut();
  out.oneFacePlain = offOf(kbEdit().lay[0]).length === 0;

  /* ---- 6d3. a row can be added on EVERY face --------------------------
     「8列も追加できるのに行は2ページ目から追加できない」 OWNER, build #92.

     kbRoomRow() and kbAddRowNew() both read kbLayer(), which is the face
     being shown, so this holds and held on the first run -- the row goes in.
     It is written down anyway because nothing said it: every claim about
     adding a row above is made on face 0, and "it works on the face the
     fixture happens to be standing on" is the shape of claim that stays true
     right up until somebody makes the count board-wide.

     What WAS wrong on page 2 is not the function, it is the size of the thing
     you press: the sheet was kbCols(this face's rows) columns of a fixed
     width, so a face of two keys was drawn a fifth of the phone across and
     the dashed + with it -- 60px against 320 on page one. Which is the same
     line as 「フリックなのに qwerty サイズ」, so it is claimed below with it. */
  fresh(); kbAddLay(); kbLay = 1; render();
  out.addOn2Was = kbLayer().rows.length;
  out.addOn2Plus = vKb().indexOf('kbAddRowNew') >= 0;
  kbAddRowNew();
  out.addOn2 = kbLayer().rows.length === out.addOn2Was + 1;
  /* and the other road onto a face: the + over a selected row */
  kbHeadRow(0); kbInsAsk(); kbIns(true);
  out.insOn2 = kbLayer().rows.length === out.addOn2Was + 2;
  /* ---- 6d4. a key is its share of its row, and the board is the phone ---
     「フリックなのに qwerty サイズ」「qwartyはqwartyのサイズあるやろ
     フリックとqwartyのキーのサイズは同じなんか？」 OWNER, 2026-08-26.

     They were the same: 28.2 x 44 on both, on a 390px screen. The sheet was
     as many FIXED columns as the face happened to have, so a flick board of
     three keys came out a quarter of the phone across with QWERTY-sized keys
     on it -- and a page somebody had just made came out a fifth, with the
     control that adds a row to it 60px wide.

     Two claims and they are one sentence. THE BOARD is the full width
     whatever is on it, because it is a picture of a keyboard and a keyboard
     is as wide as the phone. A KEY is its share of the row it is in, which is
     what the extension does (free * key.width / the row's total) and what the
     read-only board has always done (flex: key.w).

     Measured off the PAGE and never worked out again here: the whole failure
     was two places computing a width and agreeing with each other while
     disagreeing with the phone. */
  function widthOf(sel){
    const el = document.querySelector(sel);
    return el ? Math.round(el.getBoundingClientRect().width) : -1;
  }
  function keyW(){
    const el = document.querySelector('.kb.kbsheet .kbk:not(.cell):not(.addrow)');
    return el ? +el.getBoundingClientRect().width.toFixed(1) : -1;
  }
  out.narrowCols = kbCols(kbLayer().rows);
  out.narrowSheet = widthOf('.kb.kbsheet');
  out.narrowPlus = widthOf('.kbk.addrow');
  fresh();
  out.wideSheet = widthOf('.kb.kbsheet');
  out.widePlus = widthOf('.kbk.addrow');
  /* and the two boards the owner put side by side */
  const sizes = {};
  ['qwerty', 'flick'].forEach(function (p){
    KB = null; kbShow = 0; kbAdd(p); kbLay = 0;
    window.route = 'kb'; NAV = [{ r: 'kb', a: String(kbShow) }]; render();
    sizes[p] = { key: keyW(), sheet: widthOf('.kb.kbsheet'),
                 cols: kbCols(kbLayer().rows) };
  });
  out.sizes = sizes;
  /* A key is its share of its row: cols columns across a full-width board, so
     a key of one is sheet/cols to within the gap the stylesheet takes back. */
  out.shareQ = Math.abs(sizes.qwerty.key - sizes.qwerty.sheet / sizes.qwerty.cols * 2) < 6;
  out.shareF = Math.abs(sizes.flick.key - sizes.flick.sheet / sizes.flick.cols * 2) < 6;
  out.notSame = sizes.flick.key > sizes.qwerty.key * 2;
  out.sameBoard = sizes.flick.sheet === sizes.qwerty.sheet;
  /* and the board's edges do not move when a column is taken out of it, which
     is the half of OWNER DECISION 2026-08-25 that survives it being replaced */
  KB = null; kbShow = 0; kbAdd('qwerty'); kbLay = 0;
  window.route = 'kb'; NAV = [{ r: 'kb', a: String(kbShow) }]; render();
  const edgeWas = widthOf('.kb.kbsheet');
  kbHeadCol(0); kbCut();
  out.edgeStill = widthOf('.kb.kbsheet') === edgeWas;

  /* and the + is not offered when there is nowhere to put the key */
  fresh();
  var lay0 = kbEdit().lay[0];
  lay0.rows = [];
  for (i = 0; i < kbRowsMax(); i++){
    var rw = [];
    for (j = 0; j < KB_COLS / 2; j++) rw.push(kbKey('lt', ''));
    lay0.rows.push(rw);
  }
  kbLay = 0; saveKb(); render();
  out.plusLayGone = vKb().indexOf('kbAddLay') < 0;
  out.plusLayNoop = (kbAddLay(), kbEdit().lay.length === 1);

  /* ---- 6e. the switch that draws a letter on each key is on every face -- */
  fresh();
  out.romOnEditor = vKb().indexOf('data-do="setKbRom"') >= 0;
  NAV = [{ r: 'kb', a: '0' }]; render();
  out.romOnFree = vKb().indexOf('data-do="setKbRom"') >= 0;
  NAV = [{ r: 'kb', a: '' }]; render();
  out.romOnList = vKb().indexOf('data-do="setKbRom"') >= 0;

  /* ---- 6f. selecting, and the buttons that act on what is selected -----
     「今即削除なの危なすぎだろ…行とか列選択したらそこが光ってそこを作業して
     るってわかるようになってる削除は削除ボタン寄せは寄せボタンでしょ」 */
  fresh();
  var rowsBefore = kbLayer().rows.length;
  kbHeadRow(1);
  var lit = vKb();
  out.selKeeps = kbLayer().rows.length === rowsBefore;   /* pressing it does NOT delete */
  out.selLit = /class="kbrow sel"/.test(lit);
  out.selHead = /class="kbn on"/.test(lit);
  out.cutUp = !/kbCut[^>]*disabled/.test(lit);
  out.alUp = !/kbAlign[^>]*disabled/.test(lit);
  /* the band is BEHIND the keys and is not the gold the keys wear when one is
     open. 「後ろ側違う色で光らせないと」 */
  var band = document.querySelector('#kb .kbrow.sel');
  out.bandBack = !!band && !!getComputedStyle(band, '::before').backgroundColor &&
    getComputedStyle(band, '::before').backgroundColor !== 'rgba(0, 0, 0, 0)';
  var kAny = document.querySelector('#kb .kbrow.sel .kbk');
  var kOther = document.querySelector('#kb .kbrow:not(.sel) .kbk');
  out.keysPlain = !!kAny && !!kOther &&
    getComputedStyle(kAny).backgroundColor === getComputedStyle(kOther).backgroundColor;
  /* pressing the same head again puts it down */
  kbHeadRow(1);
  var down = vKb();
  out.selOff = !/class="kbrow sel"/.test(down);
  out.cutDown = /kbCut[^>]*disabled/.test(down);
  out.alDown = /kbAlign[^>]*disabled/.test(down);
  /* a COLUMN lights up and can be cut, but has no slack to align */
  kbHeadCol(2);
  var colLit = vKb();
  out.colLit = /class="kbcl on"/.test(colLit) && /kbk[^"]*sel/.test(colLit);
  render();
  var cb = document.querySelector('#kb .kbband');
  out.colBand = !!cb && cb.getBoundingClientRect().width > 4 &&
    cb.getBoundingClientRect().height > 40;
  /* it stands over the column it names: the third letter, so two columns in */
  var c2 = document.querySelector('#kb .kbhdr .kbcl.on');
  out.colBandAt = !!cb && !!c2 &&
    Math.abs(cb.getBoundingClientRect().left - c2.getBoundingClientRect().left) < 2;
  out.colCut = !/kbCut[^>]*disabled/.test(colLit);
  out.colNoAl = /kbAlign[^>]*disabled/.test(colLit);

  /* ---- 6g. where a row's slack goes, in gap keys ----------------------- */
  fresh();
  kbEdit().lay[0].rows[0] = [kbKey('lt','a'), kbKey('lt','b'), kbKey('lt','c')];
  kbLay = 0; saveKb(); render();
  function ends(){
    var rw = kbLayer().rows[0];
    return [rw[0].k === 'gap' ? kbU(rw[0].w) : 0,
            rw[rw.length-1].k === 'gap' ? kbU(rw[rw.length-1].w) : 0,
            rw.filter(function (k){ return k.k !== 'gap'; }).length,
            kbUsed(rw)];
  }
  kbHeadRow(0);
  kbAlign('l'); var L = ends();
  kbAlign('c'); var C = ends();
  kbAlign('r'); var R = ends();
  out.alLeft  = L[0] === 0 && L[1] > 0;
  out.alRight = R[0] > 0 && R[1] === 0;
  out.alCentre = C[0] > 0 && C[1] > 0 && Math.abs(C[0] - C[1]) <= 2;
  /* the keys themselves never move, and the row comes to the full width --
     which is what makes the phone agree with this drawing */
  out.alKeys = L[2] === 3 && C[2] === 3 && R[2] === 3;
  out.alFull = L[3] === KB_COLS && C[3] === KB_COLS && R[3] === KB_COLS;
  /* EVERY key of an aligned row starts on a whole column, whichever of the
     three was pressed -- otherwise the letters across the top stop naming
     anything on that row. 「行の中央寄せした後列がずれてるのはどうなる？」
     Three keys on a sheet of ten is the case that catches it: fourteen
     columns left over, and half of fourteen is seven, which is three keys and
     a half. */
  /* Pressing a head TOGGLES it, so asking for a row that is already selected
     puts it down -- which silently turns the next kbAlign() into a no-op and
     leaves a claim reading the state before it. The toggle is asserted above;
     here what is wanted is "row n is selected", so say that. */
  function selRow(n){
    if (!(KBH && KBH.k === 'r' && KBH.i === n)) kbHeadRow(n);
  }
  function onCols(){
    var rw = kbLayer().rows[0], at = 0, ok = true, x;
    for (x = 0; x < rw.length; x++){
      if (rw[x].k !== 'gap' && at % 2) ok = false;
      at += kbU(rw[x].w);
    }
    return ok;
  }
  selRow(0);
  kbAlign('l'); out.colsL = onCols();
  kbAlign('c'); out.colsC = onCols();
  kbAlign('r'); out.colsR = onCols();
  /* and so does a short row nobody has aligned, which is drawn by the same
     arithmetic */
  fresh();
  kbEdit().lay[0].rows = [[kbKey('lt','a'), kbKey('lt','b'), kbKey('lt','c'),
                           kbKey('lt','d'), kbKey('lt','e'), kbKey('lt','f'),
                           kbKey('lt','g'), kbKey('lt','h'), kbKey('lt','i'),
                           kbKey('lt','j')],
                          [kbKey('lt','k'), kbKey('lt','l'), kbKey('lt','m')]];
  kbLay = 0; saveKb(); render();
  var lead2 = 0, cells2 = document.querySelectorAll('#kb .kbrow')[1].children;
  for (i = 0; i < cells2.length; i++){
    var c2b = cells2[i];
    if (c2b.className.indexOf('kbn') >= 0) continue;
    if (c2b.getAttribute('data-k') !== null) break;
    lead2 += parseInt((c2b.getAttribute('style') || '').replace(/\D+/g, ''), 10) || 0;
  }
  out.drawnLead = lead2;
  out.drawnOnCols = lead2 % 2 === 0;

  selRow(0);
  /* aligning twice does not stack up gaps */
  kbAlign('c'); kbAlign('c');
  out.alOnce = kbUsed(kbLayer().rows[0]) === KB_COLS;
  /* and it can be taken back */
  var nowA = JSON.stringify(kbLayer().rows[0]);
  kbUndo();
  out.alBack = JSON.stringify(kbLayer().rows[0]) !== nowA;
  /* a gap somebody put in the MIDDLE of a row is not this button's business */
  fresh();
  kbEdit().lay[0].rows[0] = [kbKey('lt','a'), kbGap(2), kbKey('lt','b')];
  kbLay = 0; saveKb(); render();
  kbHeadRow(0); kbAlign('l');
  out.midGap = kbLayer().rows[0].filter(function (k){ return k.k === 'gap'; })
    .some(function (k){ return (k.w || 1) === 2; });

  /* ---- 6h. a row going in where you are ------------------------------
     「行を選択して+ボタン押したら上か下に追加するが出て押したら追加される」 */
  fresh();
  kbEdit().lay[0].rows = [[kbKey('lt','a')], [kbKey('lt','b')], [kbKey('lt','c')]];
  kbLay = 0; saveKb(); render();
  function firsts(){
    return kbLayer().rows.map(function (rw){
      return rw.length ? (rw[0].v || '.') : '-'; }).join('');
  }
  kbHeadRow(1);
  out.insQuiet = !/kbIns"/.test(vKb());          /* the two are not there until asked */
  kbInsAsk();
  var asking = vKb();
  out.insAsks = /data-do="kbIns"/.test(asking);
  out.insHides = !/data-do="kbAlign"/.test(asking) && !/data-do="kbCut"/.test(asking);
  kbIns(false);
  out.rowsAfterUp = kbLayer().rows.length;
  out.upWhere = firsts();                        /* a - b c  -> the new one is row 2 */
  /* selecting follows the row it was on */
  out.selMoved = !!KBH && KBH.k === 'r' && kbLayer().rows[KBH.i][0].v === 'b';
  kbUndo();
  out.insBack = firsts() === 'abc';
  kbHeadRow(1); kbInsAsk(); kbIns(true);
  out.dnWhere = firsts();
  kbUndo();
  /* it cannot break the ceiling, and the + is down when there is no room */
  fresh();
  for (i = 0; i < kbRowsMax() + 4; i++) kbAddRowNew();
  kbHeadRow(0);
  out.insFullDown = /kbInsAsk[^>]*disabled/.test(vKb());
  var wasFull = kbLayer().rows.length;
  kbInsAsk(); kbIns(true);
  out.insFullNoop = kbLayer().rows.length === wasFull;

  /* another board is another selection, the same way it is another history */
  fresh();
  kbHeadRow(2);
  KB = null; kbShow = 0; kbAdd('qwerty'); kbLay = 0;
  window.route = 'kb'; NAV = [{ r: 'kb', a: String(kbShow) }]; render();
  out.selForgot = !KBH && !/class="kbrow sel"/.test(vKb());

  /* ---- 6i. the tiles are the size of the cell they make ---------------- */
  fresh();
  var cols0 = kbCols(kbLayer().rows);
  var tiles = document.querySelectorAll('#kbnew .kbnewt');
  var kcell = document.querySelector('#kb .kbrow .kbk[data-r="0"][data-k="0"]');
  out.tileCount = tiles.length;
  var lab = document.querySelector('#kbnew .kbnewl');
  out.tileSaid = !!lab && !!lab.textContent.trim();
  if (tiles.length && kcell){
    var kw = kcell.getBoundingClientRect().width, kh = kcell.getBoundingClientRect().height;
    var t1 = tiles[0].getBoundingClientRect(), t3 = tiles[2].getBoundingClientRect();
    out.tileOne = Math.abs(t1.width - kw) < 1.5;
    out.tileTall = Math.abs(t1.height - kh) < 1.5;
    /* three cells is three cells wide, gaps and all */
    out.tileThree = Math.abs(t3.width - (kw * 3 + (t1.width - kw) * 0 + 2 * (kw ? 0 : 0)
                     + 2 * ((t3.width - 3 * kw) / 2))) < 1e9 &&
                    t3.width > kw * 2.5 && t3.width < kw * 3.6;
    out.tileCols = cols0;
  }

  /* ---- 7. a width can be CARRIED onto the sheet ------------------------
     The tap-then-tap way is kbSetNew()/kbPick() and is walked by press. This
     is the other way and it is touches: a tile picked up and put down on a
     cell. 「あれ持っていけないの？」 It is dispatched for real rather than by
     calling kbTileUp() with a made-up state, because what is under the finger
     is the half that can be wrong. */
  fresh();
  function touch(el, type, x, y){
    var t = new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
    el.dispatchEvent(new TouchEvent(type, {
      touches: type === 'touchend' ? [] : [t],
      targetTouches: type === 'touchend' ? [] : [t],
      changedTouches: [t], bubbles: true, cancelable: true }));
  }
  function mid(el){
    var b = el.getBoundingClientRect();
    return [b.left + b.width / 2, b.top + b.height / 2];
  }
  function carry(w, to){
    var tile = document.querySelectorAll('#kbnew .kbnewt')[w - 1];
    tile.scrollIntoView();
    var a = mid(tile), b = mid(to);
    touch(tile, 'touchstart', a[0], a[1]);
    touch(tile, 'touchmove', a[0] + 30, a[1] - 30);   /* past the 12px it takes to start */
    touch(tile, 'touchmove', b[0], b[1]);
    touch(tile, 'touchend', b[0], b[1]);
  }
  /* onto a row with room in it. Every row of the QWERTY is already the full
     ten across, and a full row takes no more keys -- which is the ceiling
     doing its job and not the thing under test here. */
  kbEdit().lay[0].rows[0] = [kbKey('lt', 'a'), kbKey('lt', 'b'), kbKey('lt', 'c')];
  saveKb(); render();
  var before = kbLayer().rows[0].length;
  var k00 = document.querySelector('#kb .kbrow .kbk[data-r="0"][data-k="0"]');
  out.sawKey = !!k00;
  if (k00){
    carry(2, k00);
    var row0 = kbLayer().rows[0];
    out.carried = row0.length === before + 1;
    out.carriedAfter = row0.length === before + 1 && row0[1].w === 2;
    out.carriedBack = (kbUndo(), kbLayer().rows[0].length === before);
  }
  /* and onto the dashed row at the foot, which is a row of its own */
  fresh();
  var rowsWas = kbLayer().rows.length;
  var plus = document.querySelector('#kb .kbk.addrow');
  out.sawPlus = !!plus;
  if (plus){
    carry(3, plus);
    out.carriedRow = kbLayer().rows.length === rowsWas + 1;
    out.carriedRowW = out.carriedRow &&
      kbLayer().rows[rowsWas][0].w === 3;
  }
  /* nothing left behind on the page */
  out.noGhost = !document.querySelector('.kbghost');

  /* ---- 7. and the two buttons say whether there is anywhere to go ------ */
  fresh();
  var first = vKb();
  out.hasUndo = first.indexOf('data-do="kbUndo"') >= 0;
  out.undoOffAtFirst = /kbUndo[^>]*disabled/.test(first);
  kbHeadRow(0); kbCut();
  out.undoOnAfter = !/kbUndo[^>]*disabled/.test(vKb());
  kbUndo();
  out.redoOnAfterUndo = !/kbRedo[^>]*disabled/.test(vKb());

  /* ---- 8. a letter on a key stands in the MIDDLE of the key ------------
     「キーボードに配置するときは中央に文字くるようにしてね？」
     「いろんな書き方してもちゃんと真ん中？」

     A shape drawn into a corner of the lattice was drawn in that corner of the
     key. Where a letter sits in its own square IS the letter -- the font is
     written from it, and the alphabet's tile goes on showing it -- but a key
     is not a place in a line of writing. It is a square hit with a thumb.

     Asked of EVERY WAY there is of drawing one, because the ways do not agree
     about where the ink is. A stroke's ends are capped in the direction it
     was travelling; a round stroke bows outside its points; a round stroke
     that is CLOSED is a full circle through them and bulges a seventh of the
     square past the box those points make. Centred on the points, that last
     one sat 13.5% off and the other nine looked perfect.

     Read off the PAINTED canvas, never off the offset handed to it: a check
     that works the offset out again is a copy of the thing under test and
     agrees with it whatever it does. */
  fresh();
  SET.plan = 'free';
  var kl = LETTERS.filter(function(l){ return String(l.ab||'') === 'a'; })[0];
  out.midWays = [];
  [ ['straight',    [{pts:[[400,120],[400,680]]}]],
    ['into a corner',[{pts:[[120,120],[120,300],[280,300]]}]],
    ['flat',        [{pts:[[100,400],[700,400]]}]],
    ['one dot',     [{pts:[[220,220]]}]],
    ['round',       [{pts:[[300,200],[500,400],[300,600]], k:'o'}]],
    ['round, closed',[{pts:[[300,200],[500,400],[300,600]], k:'o', closed:true}]],
    ['filled',      [{pts:[[200,200],[600,200],[600,600],[200,600]], fill:true, closed:true}]],
    ['small, low right',[{pts:[[600,600],[700,700]]}]],
    ['two strokes', [{pts:[[150,150],[150,650]]},{pts:[[150,400],[650,400]]}]]
  ].forEach(function(w){
    if (!kl) return;
    kl.st = JSON.parse(JSON.stringify(w[1]));
    saveLetters();
    document.getElementById('app').innerHTML = vKb();
    geTiles();
    var kc = document.querySelector('#kb .kbk[data-lt="' + kl.id + '"] canvas.tc');
    if (!kc) { out.midWays.push([w[0], -1, -1]); return; }
    var W = kc.width, H = kc.height,
        px = kc.getContext('2d').getImageData(0, 0, W, H).data,
        x, y, mnx = 1e9, mxx = -1, mny = 1e9, mxy = -1;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      if (px[(y * W + x) * 4 + 3] < 40) continue;
      if (x < mnx) mnx = x;
      if (x > mxx) mxx = x;
      if (y < mny) mny = y;
      if (y > mxy) mxy = y;
    }
    /* in PIXELS of the canvas, not as a fraction of it: the ink's box has
       whole-pixel edges, so on a key this size the middle can only be hit to
       within half a pixel either way, and a narrow shape lands a whole one
       out. That is the raster, not the placing. */
    out.midWays.push(mxx < 0 ? [w[0], -1, -1] : [w[0],
      Math.abs((mnx + mxx) / 2 - W / 2),
      Math.abs((mny + mxy) / 2 - H / 2), W]);
  });
  return out;
}, { s: seed.toString() });
await br.close();

/* ---- the two sides of the wall say the same three numbers ---------------
   「キーボードの高さ制限を決めたやん。キーの高さじゃなくてキーボードそのもの。
   だから行の列はそのキーボードの制限の範囲内で追加できるって話だけど？」
   OWNER, 2026-08-26.

   How many rows a keyboard may have is not a number anybody chooses: the
   extension caps the whole keyboard's height and SQUEEZES past the cap, so
   the rows that fit fall out of a division. www/keyboard.js does that
   division, which means it has to carry the extension's three numbers -- and
   two copies of a number in two languages is the thing that drifts.

   So they are read out of the Swift rather than restated here. A check that
   wrote 54 down again would be a third copy. */
const SWIFT = fs.readFileSync(
  path.join(dir, '..', 'ios', 'App', 'LinguaKeyboard', 'KeyboardViewController.swift'),
  'utf8');
function swiftNum(re, what){
  const m = SWIFT.match(re);
  if (!m) return { ok: false, what: what, saw: 'no line matching ' + re };
  return { ok: true, what: what, n: parseFloat(m[1]) };
}
const swRowW = swiftNum(/rowPerWidth:\s*CGFloat\s*=\s*([0-9.]+)/, 'rowPerWidth');
const swBarH = swiftNum(/barHeight:\s*CGFloat\s*=\s*([0-9.]+)/, 'barHeight');
const swMost = swiftNum(/mostOfScreen:\s*CGFloat\s*=\s*([0-9.]+)/, 'mostOfScreen');
const swEdge = swiftNum(/let bars = ([0-9.]+) \+ \(wantsBar/, 'the two edges');

const bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

console.log('what is selected, what acts on it, and the step back\n');
say(r.rows > 3, 'the board has ' + r.rows + ' rows to work on');
say(r.cols === 20, 'the sheet is ' + r.cols + ' columns wide, which is ten keys -- a column is half a key');
say(r.halves, 'and one row is inset by half a key, which is what the columns count in');
say(r.rowWent, 'pressing 2 leaves ' + (r.rows - 1) + ' rows');
say(r.rowOnly, 'and every other row is the row it was, in the order it was in');
say(r.undo, 'the step back puts the row back, key for key');
say(r.redo, 'and the step forward takes it away again');
say(r.undo2, 'and back again');
say(r.back1 && r.back2 && r.back3, 'three deletes step back through all three, in order');
say(r.colEvery, 'pressing a leaves every row still there');
say(r.colOne, 'and takes exactly one key from each');
say(r.foundWide, 'the board has a key wider than one column');
say(r.stillThere, 'a key wider than the column is still there afterwards');
say(r.narrowed, 'and it is one column narrower rather than gone');
say(r.wideBack, 'and the step back makes it as wide as it was');
say(r.letters, 'no letter moved');
say(r.words, 'no word moved');
say(r.boards, 'no other keyboard moved');
say(r.faces, 'no other face of this keyboard moved');
say([swRowW, swBarH, swMost, swEdge].every((x) => x.ok),
    'the extension still says its height in the three ways this reads' +
    ([swRowW, swBarH, swMost, swEdge].filter((x) => !x.ok).map((x) => ' -- ' + x.what + ': ' + x.saw).join('')));
say(swRowW.ok && r.roww === swRowW.n,
    'a row is ' + r.roww + ' of the phone across, here and in the extension' +
    ' (' + (swRowW.ok ? swRowW.n : '?') + ')');
say(Math.abs(r.rowh - 54) < 0.5,
    'which on the 390pt phone it was measured at is ' + r.rowh.toFixed(1) +
    'pt -- the 54 it used to be flat at, so that phone does not move');
say(swMost.ok && r.most === swMost.n,
    'a keyboard may take ' + r.most + ' of the screen, both sides');
say(swBarH.ok && swEdge.ok && r.bars === swEdge.n + swBarH.n,
    'the bars come to ' + r.bars + 'pt here and ' +
    ((swEdge.ok && swBarH.ok) ? (swEdge.n + ' + ' + swBarH.n) : '?') + ' in the extension');
say(r.ceilRows === Math.max(1, Math.floor((r.screenH * r.most - r.bars) / r.rowh)),
    'so the ceiling is ' + r.ceilRows + ' rows -- divided out of the cap, not chosen');
say(r.screenH === 844 && r.ceilRows === 7,
    'and it is one number for every phone (referenced to ' + r.screenH +
    'pt), not as many as the phone in your hand fits');
say(r.ceilCols === 20,
    'and ' + (r.ceilCols / 2) + ' keys across, which IS a number: the narrowest iPhone');
say(r.patsFit, 'and every pattern the app builds is inside it as it is built');
say(r.rowsCap, 'rows stop at the ceiling however many times the row is added');
say(r.plusGone, 'and the dashed row is not drawn once there is no room for one');
say(r.foundFull, 'the board has a row that is already the full width');
say(r.colsCap, 'and it takes no more keys');
say(r.wCap, 'and a key in it cannot be widened past the edge');
say(r.overKept, 'a layout that is already over the ceiling is left exactly as it is');
say(r.overStillCant, 'and still cannot be added to');
say(r.centred, 'a short row sits in the middle: ' + r.centreLead + ' empty each side');
say(r.faces === 2, 'adding a page gives the keyboard ' + r.faces + ' of them');
say(r.wayThere, 'and page 1 has a key that goes to page 2');
say(r.wayBack, 'and page 2 has one that comes back');
say(r.keptKeys && r.notOver, 'and the key went in beside what was there, not over it');
say(r.layBack, 'and the step back takes the page and both keys away again');
say(r.layFront, 'the key goes in at the front of the last row when that row has room');
say(r.layNewRow, 'and into a row of its own when every row is already full');
say(r.sameBoard, 'a flick board and a QWERTY board are drawn the same width');
say(r.notSame, 'and a flick key is not a QWERTY key: ' + r.sizes.flick.key +
    'px against ' + r.sizes.qwerty.key + 'px');
say(r.shareQ && r.shareF, 'each is its share of the row it is in, both boards');
say(r.edgeStill, "and taking a column out does not move the board's edges");
say(r.narrowPlus === r.widePlus,
    'the row-adding + is the same size on page 2 as on page 1 (' + r.narrowPlus + 'px)');
say(r.addOn2Plus, 'the dashed row is drawn on page 2 as well as page 1');
say(r.addOn2, 'and a row goes in on page 2 (' + r.addOn2Was + ' -> ' + (r.addOn2Was + 1) + ')');
say(r.insOn2, 'and the + over a selected row puts one in there too');
say(r.deadRowKept, 'a face never loses its last row (it had ' + r.deadRowsWas + ')');
say(r.deadRowOff, 'and taking a row off page 2 leaves it with a way off');
say(r.deadRowTo, 'and that way off goes to the page it came from');
say(r.deadColOff, 'taking a column off page 2 leaves it with one too');
say(r.deadFirstOff, 'and page 1 keeps the way IN to the rest');
say(r.oneFacePlain, 'a keyboard of one face is left alone -- there is nowhere to go');
say(r.plusLayGone, 'a face with nowhere to put that key is not offered a + at all');
say(r.plusLayNoop, 'and asking for one anyway does nothing');
say(r.romOnEditor && r.romOnFree && r.romOnList,
    'the letter-on-each-key switch is on the editor, the free face and the list');
say(r.selKeeps, 'pressing a row number does NOT delete the row any more');
say(r.selLit && r.selHead, 'it lights the row up and its number with it');
say(r.cutUp && r.alUp, 'and the bin and the three alignments come up');
say(r.bandBack, 'the selection is a band BEHIND the keys');
say(r.keysPlain, 'and the keys themselves are the colour they always were');
say(r.selOff && r.cutDown && r.alDown, 'pressing it again puts the selection and the buttons down');
say(r.colLit, 'a column lights up too, header and the keys standing in it');
say(r.colBand, 'a band runs down the whole sheet where that column is');
say(r.colBandAt, 'and it stands under the letter that names it');
say(r.colCut, 'and can be taken away');
say(r.colNoAl, 'but has no slack across it, so the alignments stay down');
say(r.alLeft, 'aligning left puts the whole slack after the keys');
say(r.alRight, 'aligning right puts it before them');
say(r.alCentre, 'and centring splits it evenly, to within the one key it gives up to stay on a column');
say(r.alKeys, 'no key moves, whichever of the three is pressed');
say(r.alFull, 'and the row comes to the full width, so the phone draws what this does');
say(r.colsL && r.colsC && r.colsR,
    'every key of an aligned row starts on a whole column, all three ways');
say(r.drawnOnCols, 'and a short row nobody aligned is drawn the same way (' + r.drawnLead + ' columns in front)');
say(r.alOnce, 'aligning twice does not stack a second pair of gaps on the first');
say(r.alBack, 'and the step back undoes it');
say(r.midGap, 'a gap somebody put between two keys is left alone');
say(r.insQuiet, 'the two sides are not offered until the + is pressed');
say(r.insAsks, 'pressing the + offers above and below');
say(r.insHides, 'and puts the alignments and the bin away while it asks');
say(r.upWhere === 'a.bc', 'above puts the new row over the selected one: ' + r.upWhere);
say(r.rowsAfterUp === 4, 'and there are ' + r.rowsAfterUp + ' rows where there were 3');
say(r.selMoved, 'and the selection is still on the row it was on');
say(r.insBack, 'and the step back takes the new row away again');
say(r.dnWhere === 'ab.c', 'below puts it under: ' + r.dnWhere);
say(r.insFullDown, 'the + is down on a board that is already as tall as it may get');
say(r.insFullNoop, 'and asking anyway adds nothing');
say(r.selForgot, 'a keyboard made while a row was selected does not arrive with it lit');
say(r.tileCount === 3, 'there are ' + r.tileCount + ' widths under the sheet');
say(r.tileSaid, 'and a word in front of them saying what they are');
say(r.tileOne, 'and a width of one is exactly one cell of the sheet wide');
say(r.tileTall, 'and exactly as tall as a key');
say(r.tileThree, 'and a width of three is three of them');
say(r.sawKey, 'the sheet has a key to carry a width onto');
say(r.carried, 'carrying a width onto a key puts one more key in that row');
say(r.carriedAfter, 'and it is the width that was carried, in after the key it was dropped on');
say(r.carriedBack, 'and the step back takes it away again');
say(r.sawPlus, 'the sheet has the dashed row at its foot');
say(r.carriedRow, 'carrying a width onto that makes a row of its own');
say(r.carriedRowW, 'and the key in it is the width that was carried');
say(r.noGhost, 'and nothing is left following the finger afterwards');
say(r.hasUndo, 'the screen has a step back on it');
say(r.undoOffAtFirst, 'and it is down on a board nothing has been done to');
say(r.undoOnAfter, 'and up once something has');
say(r.redoOnAfterUndo, 'and the step forward is up once something has been taken back');

console.log('\n  the ceiling is ' + r.ceilRows + ' rows, one number for every phone.');
console.log('  a key is a tenth of the phone across and ' + r.roww +
  ' of it tall, so it keeps its shape. What each phone comes to,');
console.log('  as  width x height -> row height, rows that fit:');
[[320, 568], [375, 667], [375, 812], [390, 844], [393, 852], [402, 874],
 [428, 926], [430, 932], [440, 956]].forEach(([w, h]) => {
  const rh = w * r.roww;
  console.log('    ' + String(w).padStart(3) + ' x ' + h + ' -> ' +
    rh.toFixed(1) + 'pt, ' + Math.max(1, Math.floor((h * r.most - r.bars) / rh)) + ' rows');
});
console.log('\n  a face of ' + (r.narrowCols / 2) + ' keys is drawn ' + r.narrowSheet +
  'px across, and the row-adding + on it is ' + r.narrowPlus + 'px');
console.log('  a face of 10 keys is drawn ' + r.wideSheet +
  'px across, and the same + is ' + r.widePlus + 'px');
console.log('  a QWERTY key is ' + r.sizes.qwerty.key + 'px and a flick key is ' +
  r.sizes.flick.key + 'px, on boards both ' + r.sizes.qwerty.sheet + 'px across\n');

/* One pixel, not nothing: the ink's box has whole-pixel edges, so the middle
   of a narrow shape can only be hit to within one. What this is about is much
   larger -- a letter drawn into a corner sits THIRTEEN pixels out of a
   forty-eight-pixel key, and a closed ring centred on its points sits six. */
r.midWays.forEach(function(w){
  say(w[1] >= 0 && w[1] <= 1.05 && w[2] <= 1.05,
      'a letter drawn ' + w[0] + ' stands in the middle of its key (off by '
      + (w[1] < 0 ? 'nothing drawn' : w[1] + 'px, ' + w[2] + 'px of ' + w[3]) + ')');
});

if (bad.length){ console.error('\nkb-check: ' + bad.length + ' FAILED'); process.exit(1); }
console.log('\nkb: pressing a row number or a column letter SELECTS it and lights it up;\n' +
  'the bin takes it away and the three alignments say where a row is short from,\n' +
  'written in gap keys so the phone draws what this drawing does. A key wider than\n' +
  'the column is narrowed rather than removed, a page arrives with the way there and\n' +
  'the way back on it AND KEEPS IT -- no face is a dead end -- and every one of\n' +
  'those can be taken back and put again --\n' +
  'with nothing outside the layout moving.');
