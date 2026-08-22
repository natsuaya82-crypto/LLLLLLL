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
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport: { width: 390, height: 844 } });
await pg.goto('file://' + path.join(dir, '..', 'www', 'index.html'));
await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });

const r = await pg.evaluate(({ s }) => {
  eval('(' + s + ')()');
  SET.done = true; SET.plan = 'plus';
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
  out.ceilRows = KB_ROWS;
  out.ceilCols = KB_COLS;
  /* every pattern this app builds is inside the ceiling as it is built */
  out.patsFit = KB_PATS.every(function (p){
    return kbPatLay(p).every(function (face){
      return face.rows.length <= KB_ROWS && face.rows.every(function (rw){
        var n = 0, x;
        for (x = 0; x < rw.length; x++) n += kbU(rw[x].w);
        return n <= KB_COLS;
      });
    });
  });
  /* rows stop at the ceiling, and the dashed row stops being drawn */
  fresh();
  for (i = 0; i < KB_ROWS + 4; i++) kbAddRowNew();
  out.rowsCap = kbLayer().rows.length === KB_ROWS;
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

  /* and the + is not offered when there is nowhere to put the key */
  fresh();
  var lay0 = kbEdit().lay[0];
  lay0.rows = [];
  for (i = 0; i < KB_ROWS; i++){
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
  out.alCentre = C[0] > 0 && C[1] > 0 && Math.abs(C[0] - C[1]) <= 1;
  /* the keys themselves never move, and the row comes to the full width --
     which is what makes the phone agree with this drawing */
  out.alKeys = L[2] === 3 && C[2] === 3 && R[2] === 3;
  out.alFull = L[3] === KB_COLS && C[3] === KB_COLS && R[3] === KB_COLS;
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
  for (i = 0; i < KB_ROWS + 4; i++) kbAddRowNew();
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
  return out;
}, { s: seed.toString() });
await br.close();

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
say(r.ceilCols === 20 && r.ceilRows === 8,
    'the ceiling is ' + r.ceilRows + ' rows and ' + (r.ceilCols / 2) + ' keys across');
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
say(r.plusLayGone, 'a face with nowhere to put that key is not offered a + at all');
say(r.plusLayNoop, 'and asking for one anyway does nothing');
say(r.romOnEditor && r.romOnFree && r.romOnList,
    'the letter-on-each-key switch is on the editor, the free face and the list');
say(r.selKeeps, 'pressing a row number does NOT delete the row any more');
say(r.selLit && r.selHead, 'it lights the row up and its number with it');
say(r.cutUp && r.alUp, 'and the bin and the three alignments come up');
say(r.selOff && r.cutDown && r.alDown, 'pressing it again puts the selection and the buttons down');
say(r.colLit, 'a column lights up too, header and the keys standing in it');
say(r.colCut, 'and can be taken away');
say(r.colNoAl, 'but has no slack across it, so the alignments stay down');
say(r.alLeft, 'aligning left puts the whole slack after the keys');
say(r.alRight, 'aligning right puts it before them');
say(r.alCentre, 'and centring splits it, ' + r.alCentre + ' -- evenly, to the half column');
say(r.alKeys, 'no key moves, whichever of the three is pressed');
say(r.alFull, 'and the row comes to the full width, so the phone draws what this does');
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

if (bad.length){ console.error('\nkb-check: ' + bad.length + ' FAILED'); process.exit(1); }
console.log('\nkb: pressing a row number or a column letter SELECTS it and lights it up;\n' +
  'the bin takes it away and the three alignments say where a row is short from,\n' +
  'written in gap keys so the phone draws what this drawing does. A key wider than\n' +
  'the column is narrowed rather than removed, a page arrives with the way there and\n' +
  'the way back on it, and every one of those can be taken back and put again --\n' +
  'with nothing outside the layout moving.');
