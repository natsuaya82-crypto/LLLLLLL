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
  kbDelRow(1);
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
  kbDelRow(0); var s1 = rows();
  kbDelRow(0); var s2 = rows();
  kbDelRow(0);
  kbUndo(); out.back1 = rows().join('|') === s2.join('|');
  kbUndo(); out.back2 = rows().join('|') === s1.join('|');
  kbUndo(); out.back3 = rows().join('|') === s0.join('|');

  /* ---- 4. the letter takes ONE key out of every row that reaches it ---- */
  fresh();
  var w0 = widths();
  kbDelCol(0);
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
    kbDelCol(Math.floor(at));
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
  kbDelRow(0); kbDelCol(1); kbUndo();
  out.letters = LETTERS.length === lts;
  out.words = WORDS.length === wds;
  out.boards = kbBoards().length === brds;
  out.faces = KB.kbs[kbShow - 1].lay.length === faces;

  /* ---- 7. and the two buttons say whether there is anywhere to go ------ */
  fresh();
  var first = vKb();
  out.hasUndo = first.indexOf('data-do="kbUndo"') >= 0;
  out.undoOffAtFirst = /kbUndo[^>]*disabled/.test(first);
  kbDelRow(0);
  out.undoOnAfter = !/kbUndo[^>]*disabled/.test(vKb());
  kbUndo();
  out.redoOnAfterUndo = !/kbRedo[^>]*disabled/.test(vKb());
  return out;
}, { s: seed.toString() });
await br.close();

const bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

console.log('a row, a column, and the step back\n');
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
say(r.hasUndo, 'the screen has a step back on it');
say(r.undoOffAtFirst, 'and it is down on a board nothing has been done to');
say(r.undoOnAfter, 'and up once something has');
say(r.redoOnAfterUndo, 'and the step forward is up once something has been taken back');

if (bad.length){ console.error('\nkb-check: ' + bad.length + ' FAILED'); process.exit(1); }
console.log('\nkb: a row goes when its number is pressed, a column when its letter is,\n' +
  'a key wider than the column is narrowed rather than removed, and every one of\n' +
  'those can be taken back and put again -- with nothing outside the layout moving.');
