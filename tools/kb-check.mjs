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
    /* and NOT `NAV = [{r:'kb', a:String(kbShow)}]`. Which keyboard you are on
       is carried by the ROUTE, so writing it here is the check standing on a
       screen the app never put anybody on: kbAdd() landed on the chapter's
       own page, which is the LIST, and every claim below was made about a
       page nothing reached. The ⋯ is drawn on a board's page and the list
       carries the ? instead, so the road that changes a keyboard's
       arrangement had no first step and 251 green claims said nothing about
       it. kbAdd() lands on the board it made; if it stops, everything here
       goes red at once, which is the point. */
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


  /* ---- the road that changes a keyboard's ARRANGEMENT --------------------
     ⋯ then kbRepat() then kbSetPat(), walked through the buttons on the page
     rather than called.

     All three names are in act-map.js, so act-check and dead-check are green
     on them whatever happens here, and press prints a name it never pressed
     without failing on it. That left the whole road able to go missing under
     a full gate: nothing was wrong with any of the three -- kbSetPat('flick')
     turned a row of ten into four keys of 2.5 and sent the 2.5 to the phone
     the entire time -- and the ⋯ was on no screen a finger could reach,
     because making a keyboard landed on the chooser it was chosen from.

     So what is asked here is reachability, one step at a time, and each step
     is asked of the DOM. A claim that called kbMore() would have been green
     on the day this was broken. */
  (function (){
    var el;
    KB = null; kbShow = 0; kbLay = 0;
    /* Nothing is being held. The ⋯ is Done while a key is wobbling, which is
       a state a claim above leaves behind, and it is not this road. */
    kbWob = false; kbSel = null;
    /* the one act: choose a pattern for a new keyboard */
    kbAdd('qwerty');
    out.roadOnBoard = String(here().a);
    out.roadDots = !!document.querySelector('[data-do="kbMore"]');
    if (!out.roadDots) return;
    el = document.querySelector('[data-do="kbMore"]');
    el.click();
    out.roadRepat = !!document.querySelector('[data-do="kbRepat"]');
    if (!out.roadRepat) return;
    document.querySelector('[data-do="kbRepat"]').click();
    out.roadPats = [].slice.call(document.querySelectorAll('[data-do="kbSetPat"]'))
      .map(function (b){ return JSON.parse(b.getAttribute('data-a'))[0]; });
    el = [].slice.call(document.querySelectorAll('[data-do="kbSetPat"]'))
      .filter(function (b){ return b.getAttribute('data-a') === JSON.stringify(['flick']); })[0];
    out.roadFlick = !!el;
    if (!el) return;
    /* the confirm the change asks -- answered yes, the way a finger does */
    var was = window.confirm; window.confirm = function (){ return true; };
    el.click();
    window.confirm = was;
    out.roadPat = KB.kbs[0].pat;
    /* 1x10 became 2.5x4: the widths were never the broken part and stay
       measured here, so a fix to the road cannot quietly cost them */
    out.roadRow = kbLayer().rows[0].map(function (k){ return (k.w || 1); }).join(',');
    /* and it comes back to the keyboard it just changed, not to the chooser */
    out.roadBack = String(here().a);
    out.roadDots2 = !!document.querySelector('[data-do="kbMore"]');
    KB = null; kbShow = 0; kbLay = 0;
  }());
  /* Nothing below can be asked on a screen that is not there. The sheet, the
     row numbers, the column letters and the buttons over them are all on a
     BOARD's page, so a broken landing is not one more red line among 251 --
     it is the check unable to start, and it says so here rather than throwing
     on the first row it goes to read. */
  if (!out.roadDots) return out;

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
  out.refW = KB_REF_W; out.rowh = kbRowH(KB_REF_W); out.row390 = kbRowH(390);
  /* EVERY PHONE, stood up: the board a pattern makes, at that phone's row
     height, against that phone's cap. This is the claim that was missing --
     the ceiling was divided out of KB_MOST correctly and nothing ever put the
     answer back on a screen to see what it came to. Referenced to 844 it came
     to 63.8% on an iPhone SE 1. 「キーボードの高さは画面の半分までってルール
     あるのになんで七も足したら7割埋まるけど」 */
  out.phones = [[320, 568], [375, 667], [375, 812], [390, 844], [393, 852],
                [402, 874], [430, 932], [440, 956]].map(function (ph){
    var rowH = Math.min(ph[0], ph[1]) * KB_ROWW;
    var tall = kbRowsMax() * rowH + KB_BARS;
    return { w: ph[0], h: ph[1], tall: +tall.toFixed(0),
             pct: +(tall / ph[1] * 100).toFixed(1), cap: +(ph[1] * KB_MOST).toFixed(0) };
  });
  out.ceilCols = KB_COLS;
  /* every pattern this app builds is inside the ceiling as it is built */
  /* ---- every pattern comes out the shape of a keyboard ----------------
     「qwartyとフリックだとサイズ違うでしょ？そういうのはどうなんの？」
     「フリックだけじゃなくて全部。」 OWNER, 2026-08-26.

     A key is width/cols across and one row tall, and a row is KB_ROWW of the
     width -- so the SHAPE of a key is 1 / (cols x KB_ROWW) and the phone
     cancels out. Every keyboard on a phone sits between iOS's QWERTY at ten
     across (0.72:1) and its ten-key at four (1.81:1). Ours came out at three
     across: 2.41:1, a key 130pt wide and 54 tall, which is a letterbox and is
     nothing anybody has typed on.

     Both faces of every pattern, and the widest row of each, because that is
     what sets the columns. Printed as well as judged: what these come to is
     the whole of the answer and a range that passes says nothing about where
     inside it they landed. */
  out.shapes = [];
  KB_PATS.forEach(function (p){
    kbPatLay(p).forEach(function (face, fi){
      var cols = kbCols(face.rows) / 2;
      out.shapes.push({ pat: p + (fi ? ' face ' + (fi + 1) : ''), cols: cols,
        rows: face.rows.length, aspect: 1 / (cols * KB_ROWW),
        screen: (face.rows.length * kbRowH(KB_REF_W) + KB_BARS) / KB_REF_H });
    });
  });
  out.patsShape = out.shapes.every(function (x){
    return x.aspect >= 0.71 && x.aspect <= 1.82;
  });
  out.patsFit = KB_PATS.every(function (p){
    return kbPatLay(p).every(function (face){
      return face.rows.length <= kbRowsMax() && face.rows.every(function (rw){
        var n = 0, x;
        for (x = 0; x < rw.length; x++) n += kbU(rw[x].w);
        return n <= KB_COLS;
      });
    });
  });
  /* ---- 5b. a pattern that does not fit is more FACES ------------------
     「パターンから作った盤に、段の上限が効いていない」 LEADER, 2026-08-27.

     The claim above is made on THIS language, and this language has 38
     letters. kbRowsMax() was asked in two places and both of them are
     somebody adding a row by hand -- the patterns were never measured at all.
     105 letters came out a seven-row flick and a twelve-row ABC; 300 came out
     twenty and thirty-one. Nothing throws: the board is drawn, saved, handed
     over, and the extension squeezes it into 0.5 of the screen with every
     row shorter.

     So the alphabet is REPLACED, at five sizes, and the patterns are built
     against each. Three things are asked of every face, and the second is the
     one that matters: cutting at the ceiling would satisfy the first and the
     third while dropping letters somebody drew.

     LETTERS is put back afterwards -- every claim below this one is about the
     fixture's own language. */
  var lettersWas = LETTERS;
  function alphaOf(n){
    var ls = [], i;
    for (i = 0; i < n; i++)
      ls.push({ id: 'zz' + i, nm: 'zz' + i, st: [[[0, 0], [1, 1]]], kind: 'alpha' });
    return ls;
  }
  out.sizes5 = [];
  [26, 60, 105, 150, 300].forEach(function (n){
    LETTERS = alphaOf(n);
    KB_PATS.forEach(function (p){
      var lay = kbPatLay(p), ids = {}, over = 0, dead = 0, deep = 0;
      lay.forEach(function (face){
        if (face.rows.length > kbRowsMax()) over += 1;
        if (face.rows.length > deep) deep = face.rows.length;
        var off = 0;
        face.rows.forEach(function (rw){ rw.forEach(function (k){
          if (k.k === 'lt' && k.v) ids[k.v] = 1;
          if (k.k === 'lt' && k.f) k.f.forEach(function (f){ if (f) ids[f] = 1; });
          if (k.k === 'lay') off += 1;
        }); });
        if (lay.length > 1 && !off) dead += 1;
      });
      /* Whether this pattern is built out of THE ALPHABET. qwerty is not: it
         is kbFixed(), which finds a-z BY NAME, so an alphabet of three
         hundred letters called something else puts none of them on it and it
         is three rows whatever happens. Nor is the chart, whose keys come
         from the sounds. Both are counted and printed; only the three that
         lay the whole alphabet out are held to keeping all of it. */
      out.sizes5.push({ n: n, pat: p, faces: lay.length, deep: deep, over: over,
        kept: Object.keys(ids).length, dead: dead,
        ofAlpha: (p === 'flick' || p === 'tap' || p === 'abc') });
    });
  });
  LETTERS = lettersWas;
  /* and the chart, whose rows are the number of CONSONANTS and not the number
     of letters -- so the four sizes above cannot move it, and it needs the
     other end of the language changed to be asked the same question. */
  var sndWas = SND;
  function consOf(n){
    var o = [], i, ipa = 'ptkbdgmnszfvrljwhcxq';
    for (i = 0; i < n; i++) o.push(ipa.charAt(i % ipa.length) + (i > 19 ? String(i) : ''));
    return o.concat(['a', 'i', 'u']);
  }
  out.chart5 = [];
  [3, 8, 14, 24].forEach(function (n){
    SND = consOf(n);
    var lay = kbPatLay('chart'), over = 0, deep = 0, dead = 0;
    lay.forEach(function (face){
      if (face.rows.length > kbRowsMax()) over += 1;
      if (face.rows.length > deep) deep = face.rows.length;
      var off = 0;
      face.rows.forEach(function (rw){ rw.forEach(function (k){
        if (k.k === 'lay') off += 1; }); });
      if (lay.length > 1 && !off) dead += 1;
    });
    out.chart5.push({ n: n, cons: wsCons().length, faces: lay.length,
                      deep: deep, over: over, dead: dead });
  });
  SND = sndWas;

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
  /* Off centre by at most ONE KEY, never more -- rule 19's own sentence:
     「半端が出るときはキー1つ単位に丸めて、余った半分は右に回ります」. It used
     to say lead === tail, which held only because the sheet was as wide as the
     widest row and that fixture's slack came out even. On a ten-column sheet
     the slack is very often an odd number of keys, and the whole point of
     rounding is that the odd one goes to one end rather than splitting a key
     across two columns. */
  out.centred = lead > 0 && tail - lead >= 0 && tail - lead <= 1;

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
  /* and it went IN, next to what was there, rather than over it. On a board
     whose rows all come to ten the space bar gives up a key's width for it,
     so the key COUNT goes up by one and no key is replaced. */
  out.keptKeys = keysOn(b0.lay[0]).length === had0 + 1;
  out.notOver = was0 !== JSON.stringify(b0.lay[0]) &&
    keysOn(b0.lay[0]).filter(function (x){ return x.k === 'lay'; }).length === 1;
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
  /* THE SPACE BAR PAYS BEFORE A ROW IS MADE. It used to be a row of its own
     the moment every row came to ten, and the day the ceiling came down to
     five that stopped working: a board shaped like the free QWERTY is five
     rows of ten, so there was no row to make and kbAddLay() silently did
     nothing -- a + that can be pressed and does not work.
     「無料はそもそも動かさないんだから関係ないだろ？」 -- board 0 is not
     edited and is not this: this is a board MADE FROM the qwerty pattern,
     which is a copy of it and is edited. */
  fresh();
  var rowsWas2 = kbLayer().rows.length;      /* every row already ten across */
  var spWas = (function (){
    var r = kbLayer().rows[rowsWas2 - 1], i;
    for (i = 0; i < r.length; i++) if (r[i].k === 'sp') return r[i].w;
    return 0;
  })();
  kbAddLay();
  var rr2 = kbEdit().lay[0].rows;
  var spNow = (function (){
    var r = rr2[rr2.length - 1], i;
    for (i = 0; i < r.length; i++) if (r[i].k === 'sp') return r[i].w;
    return 0;
  })();
  out.layNewRow = rr2.length === rowsWas2 && spWas > 0 && spNow === spWas - 1 &&
    rr2[rr2.length - 1][0].k === 'lay';
  out.spWas = spWas; out.spNow = spNow;

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
  /* the ten-key board with one row off it, so the dashed row is drawn there
     too -- at the ceiling it is not, and that is the ceiling and not the
     width this is about */
  fresh();
  kbHeadRow(0); kbCut(); KBH = null; render();
  out.wideSheet = widthOf('.kb.kbsheet');
  out.widePlus = widthOf('.kbk.addrow');
  /* and the two boards the owner put side by side */
  const sizes = {};
  ['qwerty', 'flick'].forEach(function (p){
    KB = null; kbShow = 0; kbAdd(p); kbLay = 0;
    window.route = 'kb'; NAV = [{ r: 'kb', a: String(kbShow) }]; render();
    var k = document.querySelector('.kb.kbsheet .kbk[data-r="0"][data-k="0"]');
    var w = kbLayer().rows[0][0].w || 1;
    var sheet = document.querySelector('.kb.kbsheet');
    sizes[p] = { key: keyW(), sheet: widthOf('.kb.kbsheet'),
                 cols: kbCols(kbLayer().rows), w: w,
                 kc: sheet ? parseInt(sheet.style.getPropertyValue('--kc'), 10) : -1,
                 hdr: [].slice.call(document.querySelectorAll('.kbhdr .kbcl'))
                        .map(function (b){ return b.textContent; }).join(''),
                 span: k ? (parseInt(String(k.style.gridColumn || '').replace(/\D/g, ''), 10) || 0) : -1 };
  });
  out.sizes = sizes;
  /* A KEY IS ITS SHARE OF THE TEN, and that is a different sentence from the
     one that used to be here. It said a key is sheet/cols, which was true
     while the grid was as wide as the board's widest row -- and that is the
     thing that made a column narrower every time anything was added.
     「エクセルは足しても小さくならんやろ」

     The grid is ten now and a key is big by SPANNING it: a flick key is w 2.5,
     five of the ten columns, 98pt where a QWERTY's is 39. So what is checked
     is the span, per board, against the width that came back. */
  out.shareQ = Math.abs(sizes.qwerty.key - sizes.qwerty.sheet * sizes.qwerty.w / 10) < 6;
  out.shareF = Math.abs(sizes.flick.key - sizes.flick.sheet * sizes.flick.w / 10) < 6;
  out.spanQ = sizes.qwerty.span === Math.round(sizes.qwerty.w * 2);
  out.spanF = sizes.flick.span === Math.round(sizes.flick.w * 2);
  /* AND THE COLUMNS ARE THE SAME COLUMNS ON EVERY BOARD, which is the half of
     this the widths alone cannot say. 「行と列はエクセルのように数字振ったん
     だから、小さくなったら意味ないやん」 -- a is an address, and an address is
     only one if it is in the same place tomorrow.

     Read off the header, because that is the thing a person points at. Both
     boards show a to j and nothing else: ten columns, whatever is standing on
     them. It used to be the board's own widest row, so a flick board's sheet
     had four letters on it and a QWERTY's ten, and the same letter meant a
     different width on each. Measuring the WIDTH could not see that -- the
     board is full width either way -- which is why this asks the letters. */
  out.hdr = sizes.qwerty.hdr;
  out.colSame = sizes.qwerty.hdr === 'abcdefghij' && sizes.flick.hdr === 'abcdefghij' &&
    sizes.qwerty.kc === 20 && sizes.flick.kc === 20;
  out.notSame = sizes.flick.key > sizes.qwerty.key * 2;
  out.sameBoard = sizes.flick.sheet === sizes.qwerty.sheet;
  /* and the board's edges do not move when a column is taken out of it, which
     is the half of OWNER DECISION 2026-08-25 that survives it being replaced */
  KB = null; kbShow = 0; kbAdd('qwerty'); kbLay = 0;
  window.route = 'kb'; NAV = [{ r: 'kb', a: String(kbShow) }]; render();
  const edgeWas = widthOf('.kb.kbsheet');
  const keyWas = keyW();
  const hdrWas = [].slice.call(document.querySelectorAll('.kbhdr .kbcl'))
    .map(function (b){ return b.textContent; }).join('');
  kbHeadCol(0); kbCut();
  out.edgeStill = widthOf('.kb.kbsheet') === edgeWas;
  /* AND THE KEYS THAT ARE LEFT ARE THE SAME SIZE. 「エクセルは足しても小さく
     ならんやろ」 said about adding; taking away is the same sentence and is the
     one a check can reach, because every pattern now fills the ten and there
     is nothing to add to them.

     With the grid as wide as the board's widest row, taking a column out made
     the nine that were left STRETCH -- every key on the board bigger, because
     one was removed. The letters across the top went with them, from ten to
     nine. Neither throws, both look fine, and the board somebody was building
     is not the board they had a moment ago. */
  out.cutKeyStill = Math.abs(keyW() - keyWas) < 0.5;
  out.cutHdrStill = [].slice.call(document.querySelectorAll('.kbhdr .kbcl'))
    .map(function (b){ return b.textContent; }).join('') === hdrWas;
  out.cutKeyWas = keyWas; out.cutKeyNow = keyW();
  out.cutHdrNow = [].slice.call(document.querySelectorAll('.kbhdr .kbcl'))
    .map(function (b){ return b.textContent; }).join('');

  /* And the claim kbWayOff() makes about itself, which nothing else here asks:
     IT ONLY EVER ADDS. It runs inside saveKb(), which is every change to a
     keyboard, on the board somebody is looking at -- so a face that already
     carries its way off must come out of a save with exactly the keys it went
     in with, in exactly the order it had them. If it ever dropped or moved one
     it would be quietly rewriting a keyboard somebody built, on a save that
     was about something else entirely, and nothing would throw.

     Compared after ONE more save and after TWO, not after two alone: a
     mutation that is its own undo -- a reverse, a swap -- comes back to where
     it started on an even count, and a check that only looked after two of
     them called it unchanged. That is what this said before it was watched
     failing. */
  fresh(); kbAddLay(); kbLay = 1; render();
  kbEdit().lay[1].rows.push([kbKey('lt', 'x'), kbKey('lt', 'y')]);
  saveKb();
  var wasLay = JSON.stringify(kbEdit().lay);
  saveKb(); var layOnce = JSON.stringify(kbEdit().lay);
  saveKb(); var layTwice = JSON.stringify(kbEdit().lay);
  out.addsOnly = layOnce === wasLay && layTwice === wasLay;
  /* and the same on the face somebody has NOT opened -- kbLay says which one
     is in front of them, and the other one is still theirs */
  out.addsOnlyN = kbEdit().lay[1].rows.length;

  /* ---- 6f1. a column takes only what it is entirely made of -----------
     「半キーにしよう。その代わり縦列の選択の時では選ばれない。例えばaが半きー
     のばあい。aを選択したら他の124列目だけ選ばれて削除して中央揃えした場合
     全部がハンキーになる感じ。」 OWNER DECISION 2026-08-26.

     The test was whether a key OVERLAPPED the column at all. The free
     QWERTY's third row is inset by half a key at each end, so every key on it
     straddles two columns and answered yes to both: pressing ANY letter
     across the top lit two of the nine, on the keyboard both plans type on.

     Both halves are kept. The inset stays -- it is what a QWERTY looks like.
     And a column takes only the keys it is entirely made of, so on that row
     it takes NONE. A row with the band down it and no key lit is the right
     answer: it is the row saying it does not line up with the columns.

     Read off the page, per row, for every column -- the failure was a count
     of two where one was meant, and only counting can see that. */
  fresh();
  function litPerRow(){
    return [].slice.call(document.querySelectorAll('#kb .kbrow')).map(function (rw){
      return [].slice.call(rw.children).filter(function (e){
        return e.className.indexOf('kbk') >= 0 && e.className.indexOf('sel') >= 0;
      }).length;
    });
  }
  /* which row is inset, asked of the layout rather than written down as "2" */
  var insetAt = -1, plainAt = [];
  kbLayer().rows.forEach(function (rw, i){
    var half = rw.some(function (k){ return kbU(k.w) % 2 === 1; });
    if (half) insetAt = i; else plainAt.push(i);
  });
  out.insetAt = insetAt;
  out.lit = [];
  var ci;
  for (ci = 0; ci < kbCols(kbLayer().rows) / 2; ci++){
    KBH = { k: 'c', i: ci }; render();
    out.lit.push(litPerRow());
  }
  KBH = null; render();
  out.litInset = insetAt >= 0 && out.lit.every(function (per){ return per[insetAt] === 0; });
  out.litPlain = plainAt.length > 0 && out.lit.every(function (per){
    return plainAt.every(function (i){ return per[i] === 1; });
  });
  /* the widest keys on the board -- a del of three and a space of six -- are
     entirely made of the column they stand on, so rule 19's "a key wider than
     the column is narrowed rather than removed" is about keys that DO light */
  var wideLit = 0, wideSeen = 0;
  kbLayer().rows.forEach(function (rw, i){
    var at = 0;
    rw.forEach(function (k){
      var u = kbU(k.w), c;
      if (u > 2){
        wideSeen += 1;
        for (c = 0; c < 10; c++) if (at <= c * 2 && at + u >= c * 2 + 2){ wideLit += 1; break; }
      }
      at += u;
    });
  });
  out.wideSeen = wideSeen; out.wideLit = wideLit;
  /* and what the DELETE does to a key that lit: it is exactly one column, so
     a key of one goes and a wider one comes back one column narrower */
  fresh();
  var col = 3, litWas = [];
  KBH = { k: 'c', i: col }; render();
  kbLayer().rows.forEach(function (rw, i){
    var at = 0;
    rw.forEach(function (k, j){
      if (at <= col * 2 && at + kbU(k.w) >= col * 2 + 2) litWas.push([i, kbU(k.w)]);
      at += kbU(k.w);
    });
  });
  var usedWas = kbLayer().rows.map(function (rw){ return kbUsed(rw); });
  kbCut();
  var usedNow = kbLayer().rows.map(function (rw){ return kbUsed(rw); });
  out.litCount = litWas.length;
  out.cutTookTwo = litWas.every(function (x){ return usedNow[x[0]] === usedWas[x[0]] - 2; });

  /* ---- 6f2. a tile is the size of the key it makes, on every pattern ---
     「フリックのaddキーのサイズ合ってなくね？」 OWNER 2026-08-26.

     Two claims and the second is the one that was broken.

     THE SIZE. A tile is drawn with kbCellW(), which is the arithmetic the
     sheet lays a key out with over the ten fixed columns -- so a tile of one
     is one key of one. Nothing held that, and a check must not work it out
     again: recomputing the thing under test is a copy of it and a copy always
     agrees (rule 10). So BOTH are measured off the page -- the tile, and a key
     of that width actually placed on that board -- and compared.

     AND WHETHER IT IS OFFERED AT ALL. Every pattern's rows come to the full
     ten, so on a board somebody has just made no key of any width can go
     anywhere: picking a tile and pressing a key left 10 keys as 10 keys, on
     all five patterns. The tile lit up and nothing happened.

     Asked of KB_PATS rather than a list written here, for press-check's
     reason: a sixth pattern is walked the day it is added. */
  /* ---- 6f2. the sheet is worked by touching it ------------------------
     「下のキーを動かして入れるのやめない？ a1とかタップしたらキーを追加とか、
     a1a2触ってキーをくっつける」「タップしたらそのキーが選ばれて上のゴミ箱
     ボタンとかくっつけるボタンとか押してその作業がされるようにしようよ」
     OWNER DECISION 2026-08-27.

     What went was the palette of three widths under the sheet, dragged onto
     a cell. Its widths were 1, 2 and 3 in a unit of their own while a key is
     however many of the ten columns it spans -- so on a flick board the thing
     picked up and the thing that landed were different sizes.

     An empty cell IS a key's worth of room, so pressing one puts a key
     exactly there and exactly that wide; and a key is widened by joining it
     to its neighbour, which cannot come out wider than the row has room for
     because both were already in it.

     Every claim here is read off the PAGE and driven through the real button
     names, because what is under test is what a finger reaches. */
  fresh();
  function standKb(){
    window.route = 'kb'; NAV = [{ r: 'kb', a: String(kbShow) }]; render();
  }
  function spanEl(el){
    var m = /span (\d+)/.exec(el.style.gridColumn || '');
    return m ? +m[1] : 0;
  }
  /* A board a pattern made has no slack, so a frame with NO KEY IN IT only
     exists after a cut. The two the QWERTY's third row is inset by are gap
     keys and they are frames all the same -- 「キーガーないところがあるのが
     おかしい」 OWNER 2026-08-28 -- so they are asked for by name rather than
     counted in with the empty ones. */
  out.cellNoneFull =
    document.querySelectorAll('.kb.kbsheet .kbk.cell:not([data-k])').length === 0;
  /* A gap is drawn as the frames it COVERS, so it wears no class of its own
     any more -- the two answers the sheet had came from telling them apart,
     and a look that says "this one is different" is the fault. The first
     frame over a gap names the key it stands for, which is what a carry
     reads the row back out of, so `[data-k]` is what a written-down frame is
     and everything else on the sheet with no key in it is slack. */
  out.gapFrames = document.querySelectorAll('.kb.kbsheet .kbk.cell[data-k]').length;
  (function (){
    var g = document.querySelector('.kb.kbsheet .kbk.cell[data-k]'), st;
    st = g && getComputedStyle(g);
    out.gapDashed = !!st && st.borderTopStyle === 'dashed' &&
      st.borderTopColor !== 'rgba(0, 0, 0, 0)' && st.borderTopWidth !== '0px';
    /* and NOT on the board that goes to the phone, where a gap is nothing */
    var ro = document.querySelector('.kb:not(.kbsheet) .kbk.gap');
    out.gapRoPlain = !ro || getComputedStyle(ro).borderTopColor === 'rgba(0, 0, 0, 0)';
  }());
  kbHeadCol(0); kbCut(); KBH = null; standKb();
  var cells = document.querySelectorAll('.kb.kbsheet .kbk.cell:not([data-k])');
  out.cellShown = cells.length > 0;
  out.cellIsButton = cells.length > 0 && cells[0].tagName === 'BUTTON';
  var keysWas = kbLayer().rows[0].length;
  var usedWas = kbUsed(kbLayer().rows[0]);
  /* press the first empty frame of row 0. Nine keys on a sheet of ten leave
     two columns, centred one at each end -- so this one is HALF a frame, and
     what has to go in it is half a key. 「半キーも左に寄せたら右に1枠開くで
     しょ？そういう話」 OWNER 2026-08-28. */
  var c0 = document.querySelector('.kb.kbsheet .kbrow .kbk.cell:not([data-k])');
  var c0span = c0 ? spanEl(c0) : 0;
  out.cellHalf = c0span === 1;
  /* PRESSING IT SELECTS IT. 「全部のます触ったら選択で」 OWNER 2026-08-28 --
     and the key goes in from the button over the sheet, the way the bin and
     the three alignments have always worked. This used to press the frame and
     read the key straight out of the row, which is the habit the owner
     replaced: two frames drawn the same, one adding and one selecting. */
  if (c0) c0.click();
  standKb();
  out.cellSel = !!(KBH && KBH.k === 'f' && KBH.r === 0);
  /* Asked of the PAGE and not of the class, the same as the key claim above:
     what this is about is that it LOOKS different from the frame beside it.
     Asked of the class it was a false green -- a frame wore `pick` and was
     painted exactly like its neighbour, because a chosen key is painted from
     an inline style and there is no `.kbk.pick` rule to inherit. */
  out.cellLit = (function (){
    var on = document.querySelector('.kb.kbsheet .kbk.cell.pick'),
        off = document.querySelectorAll('.kb.kbsheet .kbk.cell:not(.pick)')[0];
    return !!on && !!off &&
      getComputedStyle(on).backgroundColor !== getComputedStyle(off).backgroundColor;
  }());
  /* and what the band offers for it is the one button that fills it */
  out.cellTool = [].slice.call(document.querySelectorAll('.kbtool [data-do]'))
    .filter(function (b){ return !b.disabled; })
    .map(function (b){ return b.getAttribute('data-do'); }).join(' ');
  out.cellPut = (function (){
    /* the one in the BAND, not a frame on the sheet: the band's carries no
       arguments, because a button over the sheet acts on what is selected */
    var b = document.querySelector('.kbtool [data-do="kbCellAdd"]');
    if (b) b.click();
    return !!b;
  }());
  standKb();
  out.cellAdded = kbLayer().rows[0].length === keysWas + 1;
  out.cellAddedW = out.cellAdded && kbUsed(kbLayer().rows[0]) === usedWas + c0span;
  out.cellSpan = c0span;
  out.cellBack = (kbUndo(), kbLayer().rows[0].length === keysWas);

  /* ---- the leftover an alignment leaves is FRAMES, one to a cell ---------
     「中心に寄せたら半キーが二つできるけど寄せたら1つになるの」 OWNER
     2026-08-28, and 「全部のます触ったら選択で」 the same day. A row of three
     keys on a sheet of ten leaves seven columns at each end when it is
     centred, and CLAUDE.md § 19 counts those as three frames and a half --
     every one of them a key you can press.

     It was drawn as ONE dashed key three and a half wide. Nothing threw and
     the total was right; what was wrong is that "the width of that frame"
     could then only mean three and a half keys, and the sheet said the
     leftover was one thing where the owner had counted four.

     And what goes in takes only that frame's room: a gap is room the row
     already holds, so the row's total does not move and what is left stays a
     gap on either side. */
  (function (){
    var rw, fs, was, wasKeys;
    fresh(); kbShow = 1; kbLay = 0;
    kbLayer().rows[0] = [kbKey('lt', 'a'), kbKey('lt', 'b'), kbKey('lt', 'c')];
    saveKb(); standKb();
    KBH = { k: 'r', i: 0 }; kbAlign('c'); standKb();
    out.alGaps = kbLayer().rows[0].filter(function (k){ return k.k === 'gap'; }).length;
    rw = sheetRows()[0];
    fs = [].slice.call(rw.querySelectorAll('[data-do="kbCellAdd"]'));
    out.alFrames = fs.map(function (e){ return spanOf(e); }).join(',');
    /* the first frame of a written-down gap names the key it stands for, so a
       carry can read the row back off the page */
    out.alNamed = fs.filter(function (e){ return e.getAttribute('data-k') !== null; }).length;
    if (!fs.length) return;
    was = kbUsed(kbLayer().rows[0]);
    wasKeys = kbLayer().rows[0].length;
    fs[0].click(); standKb();
    out.alSel = !!(KBH && KBH.k === 'f' && KBH.r === 0 && KBH.at === 0 && KBH.span === 2);
    out.alLit = (function (){
      var on = document.querySelector('.kb.kbsheet .kbk.cell.pick'),
          off = document.querySelectorAll('.kb.kbsheet .kbk.cell:not(.pick)')[0];
      return !!on && !!off &&
        getComputedStyle(on).backgroundColor !== getComputedStyle(off).backgroundColor;
    }());
    /* and it is still drawn as the gap it stands for -- the class it wore
       before any of this, so nothing about how it looks at rest moved */
    out.alGapCls = !!document.querySelector('.kb.kbsheet .kbk.gap.cell');
    /* and the bin is DOWN on a frame -- there is nothing in it to take */
    out.alBin = [].slice.call(document.querySelectorAll('.kbtool [data-do="kbCut"]'))
      .every(function (b){ return b.disabled; });
    (document.querySelector('.kbtool [data-do="kbCellAdd"]') || { click: function (){} }).click();
    standKb();
    out.alSame = kbUsed(kbLayer().rows[0]) === was;
    out.alKey = kbLayer().rows[0].filter(function (k){
      return k.k === 'lt' && k.v === '' && (k.w || 1) === 1;
    }).length === 1;
    out.alRest = kbLayer().rows[0].map(function (k){
      return k.k + ':' + (k.w || 1);
    }).join(' ');
    out.alBack = (kbUndo(), kbLayer().rows[0].length === wasKeys &&
                  kbUsed(kbLayer().rows[0]) === was);
  }());

  /* pressing a key selects it, and pressing it again leaves it selected --
     「同じとこ触ると選択解除されるからわかりにくい」 OWNER 2026-08-27. It used
     to put the key down, and that was the only way to reach "nothing is
     selected"; a press the run cannot reach does it now. */
  fresh();
  kbTapKey(0, 2); standKb();
  out.keySel = !!(KBH && KBH.k === 'k' && KBH.r === 0 && KBH.i === 2);
  /* `pick` and not `on`. `on` is the key whose PAGE is open; this is the key
     SELECTED on the sheet, and they were one class wearing --goldsf at 7% on
     a 28px key -- which is a state nobody could see they were in.
     「選んだキーは色変えないと選んでるかわかんなくない？」OWNER 2026-08-27.
     Asked of the PAGE and not of the class: what the claim is about is that
     it LOOKS different from the key beside it. */
  var pk = document.querySelector('.kb.kbsheet .kbk.pick');
  var pkOther = document.querySelectorAll('.kb.kbsheet .kbk:not(.pick)')[0];
  out.keyLit = document.querySelectorAll('.kb.kbsheet .kbk.pick').length === 1 &&
    !!pk && !!pkOther &&
    getComputedStyle(pk).backgroundColor !== getComputedStyle(pkOther).backgroundColor;
  kbTapKey(0, 2); standKb();
  out.keyStands = !!(KBH && KBH.k === 'k' && KBH.i === 2);

  /* and the key beside it joins the two */
  fresh();
  /* TWO DIFFERENT LETTERS, put on by hand. A pattern blanks every key it
     makes, so both of these carry '' and "the left one's letter survived"
     is true of a join that kept the right one's. Watched staying green with
     that bug in before it was written this way. */
  kbLayer().rows[0][2].v = 'aa'; kbLayer().rows[0][3].v = 'bb';
  saveKb();
  var w2Was = kbU(kbLayer().rows[0][2].w) + kbU(kbLayer().rows[0][3].w);
  var v2Was = kbLayer().rows[0][2].v;
  var nWas = kbLayer().rows[0].length;
  var totWas = kbUsed(kbLayer().rows[0]);
  /* SELECT, THEN PRESS THE BUTTON. 「なんで？ 結合ボタン作れよ。編集も含め全部
     ボタンで作業だから」 OWNER 2026-08-27. It used to be two taps -- press a
     key, press the one beside it -- and that road is what a second key had to
     be selected on, so it is gone. Tapping selects; the button joins. */
  kbTapKey(0, 2); kbTapKey(0, 3); kbJoinSel(); standKb();
  var j = kbLayer().rows[0][2];
  out.joined = kbLayer().rows[0].length === nWas - 1;
  out.joinedW = out.joined && kbU(j.w) === w2Was;
  out.joinedKeeps = out.joined && j.v === v2Was;
  out.joinedRow = kbUsed(kbLayer().rows[0]) === totWas;
  out.joinedSel = !!(KBH && KBH.k === 'k' && KBH.i === 2);
  out.joinBack = (kbUndo(), kbLayer().rows[0].length === nWas);

  /* ---- and TAPPING a neighbour does not join any more -------------------
     This is the road that had to be cleared: a key selected, the one beside
     it pressed, and the two became one -- so a second key could never be
     SELECTED, which is what 「あと複数キー選べないから」 is. Nothing about it
     throws; the board simply loses a key where somebody meant to choose one.  */
  fresh();
  var tapWas = kbLayer().rows[0].length;
  kbTapKey(0, 2); kbTapKey(0, 3); standKb();
  out.tapNoJoin = kbLayer().rows[0].length === tapWas;
  /* it LENGTHENS now rather than moving -- what matters here is that the
     two keys are still two keys */
  out.tapMoved = kbSelKeys().length === 2;

  /* the button reaches the key UNDER it too, when there is none beside it --
     one button, both directions, because the owner asked for one */
  fresh();
  var last = kbLayer().rows[0].length - 1;
  kbTapKey(0, last); standKb();
  var un2 = kbUnderOf(0, last);
  if (un2) kbTapKey(un2.r, un2.i);
  standKb();
  out.downOnly = !kbJoinRight() && kbJoinDown();
  kbJoinSel(); standKb();
  out.downJoined = (kbLayer().rows[0][last].h || 1) === 2;

  /* ---- more than one key, and only ever a straight run ------------------
     「色んなキー触ったら一気に動かせたりしようよ。横と縦に限定だけど。」
     「バラバラ押した時は選択が解除されるようにしてほしい。」 OWNER 2026-08-27.

     None of this throws. A run that quietly does not lengthen looks exactly
     like one key chosen, and a press that quietly moves the selection instead
     of releasing it looks exactly like a press that worked -- so what is
     counted here is how many keys are lit, and what is lit after a press that
     should have let go. */
  function litKeys(){
    return (String(vKb()).match(/background:var\(--pur\)/g) || []).length;
  }
  fresh();
  kbTapKey(0, 2); standKb();
  out.selOne = kbSelKeys().length === 1;
  kbTapKey(0, 3); standKb();
  out.selTwo = kbSelKeys().length === 2;
  /* asked THROUGH the length, because a claim that indexes into the run
     throws when the run is empty -- and a check that throws takes the whole
     run down and reports nothing at all, which is worse than one that fails.
     Watched: cutting the lengthening turned this file's own output into a
     stack trace instead of a red line. */
  out.selAcross = out.selTwo && kbSelKeys()[0].i === 2 && kbSelKeys()[1].i === 3;
  kbTapKey(0, 4); standKb();
  out.selThree = kbSelKeys().length === 3;
  /* and the OTHER end lengthens it too */
  kbTapKey(0, 1); standKb();
  out.selBack = kbSelKeys().length === 4 && kbSelKeys()[0].i === 1;
  out.selBackN = kbSelKeys().length;
  out.selLit = litKeys() === 4;
  /* pressing one that is already in the run leaves it alone -- no toggle */
  kbTapKey(0, 2); standKb();
  out.selNoToggle = kbSelKeys().length === 4;
  /* ---- and one it cannot reach RELEASES it ---------------------------- */
  fresh();
  kbTapKey(0, 2); kbTapKey(0, 3); standKb();
  out.relWas = kbSelKeys().length;
  kbTapKey(2, 7); standKb();
  out.released = !KBH && kbSelKeys().length === 0 && litKeys() === 0;
  /* and the next press chooses it, so nothing is out of reach */
  kbTapKey(2, 7); standKb();
  out.relThenPick = kbSelKeys().length === 1 && kbSelKeys()[0].r === 2;
  out.relPickN = kbSelKeys().length;

  /* a COLUMN is released the same way -- 「今列選択してる時も適当に触ったら
     選択解除されるようにして欲しい」 */
  fresh();
  kbHeadCol(3); standKb();
  out.colWas = !!(KBH && KBH.k === 'c');
  kbHeadCol(3); standKb();
  out.colStands = !!(KBH && KBH.k === 'c');        /* pressed again: stands */
  kbTapKey(1, 1); standKb();
  out.colGone = !KBH;
  /* and a row, by pressing a key */
  fresh();
  kbHeadRow(1); standKb();
  out.rowWas = !!(KBH && KBH.k === 'r');
  kbHeadRow(1); standKb();
  out.rowStands = !!(KBH && KBH.k === 'r');
  kbHeadCol(2); standKb();
  out.rowGone = !KBH;

  /* DOWN is the key whose column this one starts at, not index i of the next
     row -- the free QWERTY's third row is inset by half a key, so those two
     are different keys there */
  fresh();
  kbTapKey(0, 3); standKb();
  var un = kbUnderOf(0, 3);
  out.underIsCol = !!un &&
    kbAtOf(kbLayer().rows[1], un.i) === kbAtOf(kbLayer().rows[0], 3);
  if (un){ kbTapKey(un.r, un.i); standKb(); }
  out.selDown = kbSelKeys().length === 2 && kbSelKeys()[1].r === 1;
  out.selDownN = kbSelKeys().length;

  /* ---- the buttons over the sheet are WHAT IS CHOSEN, and how many ------
     「編集ボタンは1キー選択時のみ」 OWNER 2026-08-27. A key's page is about one
     key; joining is about two. Nothing throws either way -- an edit button
     over four chosen keys would open one of them and look perfectly fine. */
  fresh();
  kbTapKey(0, 2); standKb();
  var tool = vKb();
  out.oneOpenBtn = tool.indexOf('data-do="kbOpenSel"') >= 0;
  out.oneNoJoin = tool.indexOf('data-do="kbJoinSel"') < 0;
  out.keyBinUp = tool.indexOf('data-do="kbCut"') >= 0;
  /* and no alignment, which is a row's business */
  out.keyNoAlign = tool.indexOf('data-do="kbAlign"') < 0;
  kbTapKey(0, 3); standKb();
  var tool2 = vKb();
  out.twoJoinBtn = tool2.indexOf('data-do="kbJoinSel"') >= 0;
  out.twoNoOpen = tool2.indexOf('data-do="kbOpenSel"') < 0;
  out.twoBinUp = tool2.indexOf('data-do="kbCut"') >= 0;
  /* three chosen: the join is drawn and DOWN -- two of three is not a choice
     the button gets to make */
  kbTapKey(0, 4); standKb();
  out.threeJoinDown = /kbJoinSel[^>]*disabled/.test(vKb());
  /* The DOWNWARD join has its own "exactly two", and the run above is across
     so it never reaches it -- watched: taking that guard out left every claim
     green. Asked of the guard itself, with ONE key chosen that does have a
     key lined up under it. */
  fresh();
  kbTapKey(0, 3); standKb();
  out.downHasOne = !!kbUnderOf(0, 3);
  out.downAtOne = kbJoinDown() === false;
  /* a vertical run STOPS where the rows stop lining up. The QWERTY's third row
     is inset by half a key, so nothing in it starts at the column row 1 does --
     the sheet saying that row does not line up, which is kbVJoin's answer too. */
  var d1 = kbUnderOf(0, 3);
  if (d1){ kbTapKey(d1.r, d1.i); standKb(); }
  out.downTwo = kbSelKeys().length === 2;
  var d2 = d1 && kbUnderOf(d1.r, d1.i);
  out.downNoThird = !d2;
  if (d2){ kbTapKey(d2.r, d2.i); standKb(); }
  out.downStops = kbSelKeys().length === 2;
  /* THREE lined up downward, which the pattern does not give -- so the two
     gaps come off row 2 and the three rows line up. Only then does the
     downward join's "exactly two" have a case to answer: without such a board
     the direction test masks it, and taking the count out leaves every claim
     green. Watched exactly that. The board is left behind, so the claims after
     this one start again from fresh(). */
  fresh();
  (function (){
    var r2 = kbLayer().rows[2], j2;
    for (j2 = r2.length - 1; j2 >= 0; j2--) if (r2[j2].k === 'gap') r2.splice(j2, 1);
    saveKb(); render();
  }());
  kbTapKey(0, 0); standKb();
  var e1 = kbUnderOf(0, 0);
  if (e1){ kbTapKey(e1.r, e1.i); standKb(); }
  var e2 = e1 && kbUnderOf(e1.r, e1.i);
  if (e2){ kbTapKey(e2.r, e2.i); standKb(); }
  out.deepN = kbSelKeys().length;
  out.deepJoinDown = out.deepN === 3 && kbJoinDown() === false;
  fresh();
  kbTapKey(0, 2); standKb();
  var binWas = kbLayer().rows[0].length;
  kbCut(); standKb();
  out.keyBinTook = kbLayer().rows[0].length === binWas - 1;
  out.keyBinBack = (kbUndo(), kbLayer().rows[0].length === binWas);
  /* ---- and the bin takes EVERY key of a run, in ONE step ---------------
     It took the first, which was the whole of a selection until runs existed:
     three of four would have been left behind with the press looking like it
     worked. And each key taken was its own saveKb(), so one press of the bin
     wanted three presses of the step back -- which is not what a step back is.
     Both halves are asked, because fixing one without the other is a keyboard
     that loses keys somebody cannot get back in one go. */
  fresh();
  kbTapKey(0, 2); kbTapKey(0, 3); kbTapKey(0, 4); standKb();
  var manyWas = kbLayer().rows[0].length;
  out.manyChosen = kbSelKeys().length === 3;
  kbCut(); standKb();
  out.manyBinTook = kbLayer().rows[0].length === manyWas - 3;
  kbUndo(); standKb();
  out.manyBinBack = kbLayer().rows[0].length === manyWas;

  /* the last of the palette is gone, and so is the ghost it was carried as */
  fresh();
  out.tilesGone = document.querySelectorAll('.kbnewt').length === 0 &&
    !document.getElementById('kbnew');

  /* ---- 6g. a column goes in, and not when the board is full -----------
     「これって列とか行とかはたせないの？」「いいよー 最大になったら+はなし」
     OWNER, 2026-08-26.

     A column could only ever be TAKEN AWAY. It is only safe to offer the
     other direction because the grid is ten fixed columns: a new key fills
     slack that is already there, so nothing on the board is made smaller to
     hold it -- 「小さくなったら意味ないやん」 -- and when there is no slack
     there is no +.

     Every pattern comes to the full ten, so a fresh board is exactly the
     "no room" case and the fixture has to CUT before it can put back. That is
     the check's shape as well as the app's. */
  fresh();
  out.insColFullDown = (kbHeadCol(2), !kbRoomCol(2));
  out.insColFullAsk = (kbInsAsk(), !(KBH && KBH.ins));
  out.insColFullNoop = (kbInsCol(true), kbLayer().rows.every(function (r){
    return kbUsed(r) === KB_COLS;
  }));
  out.insColFullBtn = vKb().indexOf('data-do="kbInsCol"') < 0;

  fresh();
  kbHeadCol(0); kbCut();
  /* A SHORT ROW, put in on purpose. Without one, "the rows that reach it and
     no others" cannot be watched failing: every row of a QWERTY is the same
     width, so inserting into all of them and inserting into the ones that
     reach column c are the same edit. This row reaches column 0 and not
     column 2, so it is the difference between those two sentences. */
  kbEdit().lay[0].rows[3] = [kbKey('lt', ''), kbKey('lt', '')];
  saveKb(); render();
  var wideWas = keyW();
  var rowsWas = kbLayer().rows.map(function (r){ return kbUsed(r); });
  /* what each row is MADE of, so an added key can be told from an added gap */
  function kinds(){
    return kbLayer().rows.map(function (r){
      var o = {}, i;
      for (i = 0; i < r.length; i++) o[r[i].k] = (o[r[i].k] || 0) + 1;
      return o;
    });
  }
  var kindsWas = kinds();
  out.insColShort = rowsWas[3] === 4;              /* two keys: reaches a, not c */
  out.insColRoom = (kbHeadCol(2), kbRoomCol(2));
  kbInsAsk();
  out.insColAsks = !!(KBH && KBH.ins) && vKb().indexOf('data-do="kbInsCol"') >= 0;
  kbInsCol(true);
  var rowsNow = kbLayer().rows.map(function (r){ return kbUsed(r); });
  out.insColWent = rowsNow.every(function (u, i){
    return u === rowsWas[i] + (i === 3 ? 0 : 2);
  });
  /* and the short row is the row it was, key for key */
  out.insColLeft = rowsNow[3] === rowsWas[3];
  /* and it did not make anything smaller: the grid is ten either way, so a
     key that was 28.2px is 28.2px */
  out.insColSize = Math.abs(keyW() - wideWas) < 0.5;
  /* WHAT went in: exactly one more `lt` in every row that took one, and not
     one more of anything else. A gap would satisfy "the row got wider" and is
     not a key -- 「文字でないキー」は列を使う、というのとは別の話で、ここで
     頼まれたのはキーです。 */
  var kindsNow = kinds();
  out.insColKey = kindsNow.every(function (o, i){
    var was = kindsWas[i], k, want;
    for (k in o) if (Object.prototype.hasOwnProperty.call(o, k)){
      want = (was[k] || 0) + ((k === 'lt' && i !== 3) ? 1 : 0);
      if (o[k] !== want) return false;
    }
    for (k in was) if (Object.prototype.hasOwnProperty.call(was, k) && !(k in o)) return false;
    return true;
  });
  out.insColBack = (kbUndo(), kbLayer().rows.map(function (r){ return kbUsed(r); })
    .join(',') === rowsWas.join(','));

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
  /* pressing the same head again leaves it selected */
  kbHeadRow(1);
  var down = vKb();
  out.selStands = /class="kbrow sel"/.test(down);
  /* and the buttons go down when the selection is RELEASED, which is now a
     press somewhere it cannot reach rather than a press on the same head */
  kbTapKey(0, 0); standKb();
  kbTapKey(0, 0); standKb();          /* released, then chosen: a key, not a row */
  kbHeadCol(2); standKb();            /* a column while a key is chosen: released */
  var down2 = vKb();
  out.cutDown = /kbCut[^>]*disabled/.test(down2);
  out.alDown = /kbAlign[^>]*disabled/.test(down2);
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

  /* ---- and a row with HALF A KEY in it -------------------------------
     「キーボードも左右寄せにするなら、ハンキーとか関係なく寄せて。」
     OWNER DECISION 2026-08-27.

     Right used to send the odd half to the other end so the row's first key
     landed on a whole column. That is what CENTRING is for -- a row nobody
     aligned has to be pointed at -- and is not what an end is for.

     A row of whole keys cannot see the difference: the leftover is an even
     number of half columns and the rounding never fires. So the row is given
     a key of half a key, which is the case the owner is talking about and the
     only one where the two answers differ. */
  fresh();
  var halfKey = kbKey('lt', 'c'); halfKey.w = 0.5;
  /* the other rows stay ten across, because the slack a row is aligned in is
     measured against the WIDEST row -- a board of one row has none */
  kbEdit().lay[0].rows[0] = [kbKey('lt', 'a'), kbKey('lt', 'b'), halfKey];
  kbLay = 0; kbSel = null; KBH = null; saveKb(); render();
  kbHeadRow(0);
  kbAlign('l'); var HL = ends();
  kbAlign('r'); var HR = ends();
  kbAlign('c'); var HC = ends();
  out.halfOdd = (2 + 2 + 1) % 2 === 1;              /* the row really is odd */
  out.halfLeft = HL[0] === 0 && HL[1] === KB_COLS - 5;
  out.halfRight = HR[0] === KB_COLS - 5 && HR[1] === 0;
  /* CENTRE splits the leftover between the two ends and rounds NOTHING away.
     「中心に寄せたら半キーが二つできるけど寄せたら1つになるの」 OWNER
     2026-08-28. Fifteen columns over: seven in front and eight behind. */
  out.halfCentre = HC[0] > 0 && HC[1] > 0 && Math.abs(HC[0] - HC[1]) <= 1;
  out.halfFull = HL[3] === KB_COLS && HR[3] === KB_COLS && HC[3] === KB_COLS;
  out.halfR0 = HR[0]; out.halfC0 = HC[0]; out.halfC1 = HC[1];
  /* and the consequence, said out loud: a row that carries half a key lines
     up with NO column, whichever of the three it is pushed to. Centring used
     to round its odd half away so that it did; that is gone
     「中心に寄せたら半キーが二つできるけど寄せたら1つになるの」 OWNER
     2026-08-28, and what is left is the answer CLAUDE.md § 19 already gave
     for the free QWERTY's inset third row: the band comes down, nothing
     lights, and the row is saying it does not line up with the columns --
     which is what somebody needs to know before they cut one. */
  function onColsRow0(){
    var rw = kbLayer().rows[0], at = 0, ok = true, x;
    for (x = 0; x < rw.length; x++){
      if (rw[x].k !== 'gap' && at % 2) ok = false;
      at += kbU(rw[x].w);
    }
    return ok;
  }
  /* and the thing that follows from it, asked of the real kbColHas(): with
     the row centred, not one of the ten columns takes a key on it */
  function litOnRow0(){
    var rw = kbLayer().rows[0], at = 0, n = 0, x, ci;
    for (x = 0; x < rw.length; x++){
      if (rw[x].k !== 'gap')
        for (ci = 0; ci < KB_COLS / 2; ci++) if (kbColHas(at, rw[x].w, ci)) n++;
      at += kbU(rw[x].w);
    }
    return n;
  }
  kbAlign('c'); out.halfConCols = onColsRow0(); out.halfCLit = litOnRow0();
  kbAlign('r'); out.halfRonCols = onColsRow0();
  /* put the board back -- every claim after this one is about a plain one */
  fresh();
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
  var lead2 = 0, leadSpans = [], cells2 = document.querySelectorAll('#kb .kbrow')[1].children;
  for (i = 0; i < cells2.length; i++){
    var c2b = cells2[i];
    if (c2b.className.indexOf('kbn') >= 0) continue;
    if (c2b.getAttribute('data-k') !== null) break;
    var sp2 = parseInt((c2b.getAttribute('style') || '').replace(/\D+/g, ''), 10) || 0;
    lead2 += sp2;
    leadSpans.push(sp2);
  }
  out.drawnLead = lead2;
  out.drawnSpans = leadSpans.join(' ');
  /* CLAUDE.md § 19's own worked example: three keys on a sheet of ten leave
     fourteen columns, and half of fourteen is seven -- three frames and a
     half at each end. Nothing is rounded away, so the half is drawn. */
  out.drawnHalf = lead2 === 7 && leadSpans.join(' ') === '2 2 2 1';

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
  /* TWO presses, and that is the new rule showing its cost rather than a
     wrinkle in the check: a row is chosen here already (the one the insert
     followed), so the first press on a DIFFERENT head releases and the second
     chooses. 「バラバラ押した時は選択が解除される」 -- moving from one thing to
     another goes through nothing. */
  kbHeadRow(1); kbHeadRow(1); kbInsAsk(); kbIns(true);
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


  /* ---- 6i. a key joined to the one UNDER it ---------------------------
     「縦はリーダーに確認して許可降りたらやって欲しい」OWNER 2026-08-27, and
     the leader gave it the same day.

     Stored as `h` on the key that covers and a gap carrying `up` standing in
     the same columns of the row below. Nothing here can throw: a merge that
     loses the letter, one whose lower half slides the rest of its row left,
     one that cannot be taken back -- every one of those still renders, still
     installs, and is not the keyboard somebody built.

     The qwerty board's first two rows are ten keys of one, so they line up;
     its third is inset by half a key at each end, so row 1 and row 2 do NOT,
     and that is the pair a ragged merge is refused on. */
  fresh();
  var vr = kbLayer().rows;
  /* A LETTER on both, and two different ones. Patterns blank every key, so a
     claim about which letter survives is vacuous on the board as it arrives --
     which is how this check passed once with the wrong key kept. */
  vr[0][3].v = 'aa'; vr[0][3].f = ['u', 'r', 'd', 'l'];
  vr[1][3].v = 'bb';
  /* recorded BEFORE the mark the step back is measured from, or the undo
     below would be asked to restore letters that were never written down */
  saveKb();
  var vjWas = rows(), vjWasW = widths();
  out.vjDid = kbVJoin(0, 3);
  out.vjTall = (kbLayer().rows[0][3].h || 1) === 2;
  /* what it keeps is the UPPER one, letter and all four flick slots */
  out.vjKeeps = kbLayer().rows[0][3].v === 'aa' &&
    kbLayer().rows[0][3].f.join('') === 'urdl';
  var sh = kbLayer().rows[1][3];
  out.vjShadow = sh.k === 'gap' && !!sh.up && (sh.w || 1) === (kbLayer().rows[0][3].w || 1);
  /* the rest of the row below did not move: same keys, same order, only the
     one under the merge is different */
  out.vjRowSame = kbLayer().rows[1].length === vr[1].length &&
    kbLayer().rows[1].map(function (k, i) { return i === 3 ? 'x' : k.k + ':' + k.v; })
      .join(' ') === vjWas[1].split(' ').map(function (t, i) {
        return i === 3 ? 'x' : t.split(':').slice(0, 2).join(':'); }).join(' ');
  /* and both rows still come to what they came to */
  out.vjWidth = widths()[0] === vjWasW[0] && widths()[1] === vjWasW[1];
  out.vjOthers = rows().slice(2).join('|') === vjWas.slice(2).join('|');
  /* it is drawn as two rows, and the lower half draws nothing */
  var vjHtml = vKb();
  out.vjDrawn = /--rh:2/.test(vjHtml);
  /* a gap wears `fn` as well -- it is not a letter key -- and it is drawn
     with no background at all, which is what the lower half of a merge has
     to be. Asked of the PAGE rather than of the string, because "the class
     is on it" and "nothing is painted" are two different claims and the
     second is the one that matters. */
  render();
  var shEl = document.querySelectorAll('#kb .kbrow')[1].querySelectorAll('.kbk')[3];
  out.vjShadowPlain = !!shEl && / gap/.test(' ' + shEl.className) &&
    getComputedStyle(shEl).backgroundColor === 'rgba(0, 0, 0, 0)';
  /* pressing the lower half is pressing THAT key, not the hole */
  KBH = null;
  kbTapKey(1, 3);
  out.vjTapUp = !!KBH && KBH.k === 'k' && KBH.r === 0 && KBH.i === 3;
  /* joining it again is refused -- three rows is not a thing here */
  out.vjTwice = kbVJoin(0, 3) === false;
  /* the three alignments are down on a row with half a merge in it */
  kbHeadRow(0);
  out.vjAlDown = /kbAlign[^>]*disabled/.test(vKb());
  var alWas = rows().join('|');
  kbAlign('c');
  out.vjAlNoop = rows().join('|') === alWas;
  KBH = null;
  /* the step back, and the step forward after it */
  var vjJoined = rows().join('|');
  kbUndo();
  out.vjUndo = rows().join('|') === vjWas.join('|');
  kbRedo();
  out.vjRedo = rows().join('|') === vjJoined;
  /* h and up are still there after it has been through localStorage */
  saveKb(); kbRead();
  out.vjKept = (kbLayer().rows[0][3].h || 1) === 2 && !!kbLayer().rows[1][3].up;
  /* what the extension is handed: the rows tall, and not this side's word for
     which gap is the lower half */
  var vjSent = shareKey(kbLayer().rows[0][3]), vjSentGap = shareKey(kbLayer().rows[1][3]);
  out.vjSendsH = vjSent.h === 2;
  out.vjSendsNoUp = vjSentGap.up === undefined && vjSentGap.k === 'gap' &&
    (vjSentGap.w || 1) === (kbLayer().rows[1][3].w || 1);

  /* two that do NOT line up are refused rather than repaired: row 1 key 0 is
     a whole key at column 0, row 2 starts with the half-key inset */
  fresh();
  var ragWas = rows().join('|');
  out.vjRagged = kbVJoin(1, 0) === false && rows().join('|') === ragWas;

  /* the row above goes: the hole under it is a hole under nothing, and what
     is left is an ordinary gap. The row below goes: the key above covers a
     row that is not there. kbVFix() answers for both, from saveKb(). */
  fresh();
  kbVJoin(0, 3);
  kbDelRow(0);
  out.vjDelUp = !kbLayer().rows.join ? false :
    kbLayer().rows.every(function (row) {
      return row.every(function (k) { return !k.up; }); });
  fresh();
  kbVJoin(0, 3);
  kbDelRow(1);
  out.vjDelDn = kbLayer().rows.every(function (row) {
    return row.every(function (k) { return (k.h || 1) === 1; }); });

  /* a column taken out narrows BOTH halves by the same amount and the merge
     stands. Made two keys wide first, so there is something to narrow. */
  fresh();
  kbJoin(0, 3); kbJoin(1, 3);
  kbVJoin(0, 3);
  var wideWas = (kbLayer().rows[0][3].w || 1);
  kbDelCol(3);
  var vcU = kbLayer().rows[0][3], vcD = kbLayer().rows[1][3];
  out.vjColBoth = !!vcU && !!vcD && (vcU.w || 1) === (vcD.w || 1) &&
    (vcU.w || 1) < wideWas;
  out.vjColStands = (vcU.h || 1) === 2 && !!vcD.up;

  /* a board nobody merged anything on is written exactly as it was written
     before merges existed -- no h, no up, anywhere */
  fresh();
  saveKb();
  out.vjClean = JSON.stringify(kbEdit().lay).indexOf('"h":') < 0 &&
    JSON.stringify(kbEdit().lay).indexOf('"up":') < 0;

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

  /* ---- the letters offered for a key are the ALPHABET'S OWN list --------
     「絞り込みと検索が欲しいね。」 OWNER 2026-08-27, on 「レター多くなったら
     選ぶのキツくね？」.

     kbLtGrid() laid every letter out, always. It draws the PAID alphabet --
     free has no editor to reach it from -- which is the one that grows to
     three hundred.

     What is held is that it is the alphabet chapter's list and not a second
     one: the same ltSortList/ltFilList vLtset builds with, and the same row
     of buttons driving them. Nothing here can throw. A grid that quietly
     stopped asking would draw perfectly and be the whole alphabet again, and
     the only way to see it is to set the filter and count what came back --
     so it is counted, per filter, and the three have to add up. */
  /* ---- a key CARRIED into a full row does not go in ---------------------
     「満杯だと追加できないから」 OWNER 2026-08-27.

     A key can be held and carried to another row. That road asked nothing
     about width, so it made a row of ELEVEN on a board of tens -- and rule 19
     is what forbids eleven ("ten keys are 32 each and eleven would be 29").
     kbCellAdd(), the same act done by pressing an empty cell, has always
     asked kbRoomIn(); this was the one road not through the gate.

     Nothing about it throws, and press cannot reach it: the carry is
     touchstart/touchmove/touchend with no [data-do] anywhere on it. So the
     real handlers are called here the way a finger calls them, with
     elementFromPoint standing in for the finger for the length of one
     question -- what is underneath -- and nothing else replaced. */
  function drag(fromR, fromK, toR, toK){
    function el(ri, ki){
      return document.querySelector('#kb [data-r="' + ri + '"][data-k="' + ki + '"]');
    }
    var src = el(fromR, fromK), dst = el(toR, toK), real;
    if (!src || !dst) return false;
    kbDown({ target: src, touches: [{ clientX: 100, clientY: 100 }] });
    kbLift();                                   /* the 380ms hold, fired */
    real = document.elementFromPoint;
    document.elementFromPoint = function (){ return dst; };
    kbDragTo({ touches: [{ clientX: 120, clientY: 140 }], preventDefault: function (){} });
    document.elementFromPoint = real;
    kbUp({ preventDefault: function (){} });
    return true;
  }
  (function (){
    /* The block above this one leaves the plan on FREE -- it is about a
       letter's ink, which free draws too. There is no editor on free (board 0
       is the QWERTY itself and kbEdit() answers null), so a carry cannot
       happen there at all and every claim below would pass by not running. */
    var wasPlan = SET.plan;
    SET.plan = 'pro';
    fresh();
    /* in HALF COLUMNS -- kbUsed() is the app's own, and widths() above counts
       whole keys, which is a different number and was the first thing this
       got wrong */
    function halves(){ return kbLayer().rows.map(kbUsed); }
    var was = rows(), wasW = halves(), full = -1, donor = -1, i;
    for (i = 0; i < wasW.length; i++) if (wasW[i] === KB_COLS && full < 0) full = i;
    for (i = 0; i < wasW.length; i++) if (i !== full && wasW[i] > 2 && donor < 0) donor = i;
    out.dragFull = full; out.dragDonor = donor;
    out.dragRan = drag(donor, 0, full, 0);
    out.dragWidths = halves();
    out.dragNoneOver = out.dragWidths.every(function (w){ return w <= KB_COLS; });
    /* and the key is BACK, not gone -- a refusal that ate it would leave
       every row inside ten as well, which is the whole reason this is two
       claims and not one */
    out.dragPutBack = JSON.stringify(rows()) === JSON.stringify(was);
    /* a refused carry never reached saveKb(), so there is no step to take
       back -- otherwise the undo stack fills with moves that did nothing */
    out.dragNoStep = !(KBU && KBU.u && KBU.u.length);

    /* ---- and the same row's own order still moves, full or not ----------
       The cheap way to pass everything above is to refuse every carry. This
       is what says the gate is about WIDTH: inside one row nothing about the
       width changes, so a full row still rearranges. */
    fresh();
    /* One key is MARKED and then found again by where it ended up. Comparing
       the row as a string cannot see this: a fresh qwerty's keys stringify
       identically ("lt::1" ten times), so a reorder that worked and one that
       did nothing read the same, and the first version of this claim was
       green either way. */
    kbLayer().rows[full][0].v = '†mark';
    saveKb(); render();
    function markAt(){
      var row = kbLayer().rows[full], j;
      for (j = 0; j < row.length; j++) if (row[j].v === '†mark') return j;
      return -1;
    }
    out.dragMarkWas = markAt();
    drag(full, 0, full, 3);
    out.dragMarkNow = markAt();
    out.dragInRow = out.dragMarkWas === 0 && out.dragMarkNow > 0;
    out.dragInRowWide = halves()[full] === KB_COLS;

    /* ---- a board already over the ceiling is not touched ----------------
       Rule 19 holds both ceilings on ADDING only, and a carry is an add. A
       row of eleven that somebody already has stays a row of eleven -- the
       carry may not start trimming it, and may not add to it either. */
    fresh();
    var lay = kbEdit(), over = lay.lay[0].rows;
    over[full] = over[full].concat([kbKey('lt', '')]);   /* eleven wide */
    saveKb(); render();
    var overWas = JSON.stringify(kbLayer().rows.map(say));
    out.overWide = halves()[full] === KB_COLS + 2;
    drag(donor, 0, full, 0);
    out.overUntouched = JSON.stringify(kbLayer().rows.map(say)) === overWas;

    /* ---- a RUN of chosen keys is carried as one thing ------------------
       「色んなキー触ったら一気に動かせたりしようよ。横と縦に限定だけど。」
       「縦でタップしたらそのままその2キーを持っていける」 OWNER 2026-08-27.

       ALL of them or NONE. One arriving and the rest staying behind draws
       perfectly and feels like the press worked, and the run somebody built is
       scattered -- so what is counted is HOW MANY KEYS THE BOARD HAS, before
       and after, on the drop that works and on the drop that is refused. */
    function keyCount(){
      return kbLayer().rows.reduce(function (a, rw){ return a + rw.length; }, 0);
    }
    fresh();
    kbLayer().rows[3].pop(); kbLayer().rows[3].pop(); kbLayer().rows[3].pop();
    saveKb(); render();
    kbTapKey(0, 2); kbTapKey(0, 3); standKb();
    out.runChose = kbSelKeys().length === 2;
    var runWasN = keyCount(), runWasH = halves(), runWasShape = kbLayer().rows.map(say);
    drag(0, 2, 3, 0);
    out.runKeys = keyCount() === runWasN;                 /* nothing lost */
    out.runLeft = runWasH[0] - halves()[0];               /* row 0 gave up */
    out.runCame = halves()[3] - runWasH[3];               /* row 3 took them */
    out.runBoth = out.runLeft === 4 && out.runCame === 4;
    kbUndo(); standKb();
    out.runUndoOne = JSON.stringify(kbLayer().rows.map(say)) === JSON.stringify(runWasShape);

    /* ---- refused PART WAY THROUGH, and NOTHING is lost -----------------
       The landing row has room for TWO and three are carried. That matters:
       a row with room for none is turned away a step earlier, by the gate the
       single carry already had, so a run aimed at one never reaches this code
       at all and the claim passes whether the rollback exists or not --
       watched, twice. Room for two and three carried is the only shape where
       the run itself has to say no, half-way, with two already placed. */
    fresh();
    var narrow = kbLayer().rows.length - 1;          /* the space bar's row */
    (function (){
      var rw = kbLayer().rows[narrow];
      while (rw.length > 1 && kbUsed(rw) > KB_COLS - 4) rw.pop();
      saveKb(); render();
    }());
    kbTapKey(0, 2); kbTapKey(0, 3); kbTapKey(0, 4); standKb();
    out.runThree = kbSelKeys().length === 3;
    out.roomForTwo = kbUsed(kbLayer().rows[narrow]) === KB_COLS - 4;
    var noN = keyCount(), noShape = JSON.stringify(kbLayer().rows.map(say));
    drag(0, 2, narrow, 0);
    out.runNoRoomKeys = keyCount() === noN;
    out.runNoRoomSame = JSON.stringify(kbLayer().rows.map(say)) === noShape;

    /* and a run DOWN arrives one to a row, in the same column */
    fresh();
    kbLayer().rows[3].pop(); kbLayer().rows[3].pop();
    kbLayer().rows[4].pop();
    saveKb(); render();
    kbTapKey(0, 1); standKb();
    var dn1 = kbUnderOf(0, 1);
    if (dn1){ kbTapKey(dn1.r, dn1.i); standKb(); }
    out.runDownChose = kbSelKeys().length === 2;
    var dWasN = keyCount();
    drag(0, 1, 3, 0);
    out.runDownKeys = keyCount() === dWasN;
    out.runDownRows = (function (){
      var a = kbSelKeys();
      if (a.length !== 2) return false;
      return a[1].r === a[0].r + 1 &&
        kbAtOf(kbLayer().rows[a[1].r], a[1].i) === kbAtOf(kbLayer().rows[a[0].r], a[0].i);
    }());


    /* ---- and every one of them LIFTS, and follows the finger -----------
       「5個とか選択したら選択したのが持ち上がって動くようにしてよ」 OWNER
       2026-08-28.

       The block above is about where the keys END UP, and it was green while
       the carry still looked wrong to the person doing it: only the key under
       the finger rose and moved, and the other n-1 sat flat in their old
       places until the drop, when they jumped. The model the owner named is a
       phone's home screen, where everything picked up travels with the finger.

       So this measures the MIDDLE of a carry rather than its end -- at the one
       moment the app asks what is under the finger, which is after the
       transform goes on and before anything is rearranged. Three things are
       asked of every carried key at that moment, and the third is the one that
       is easy to miss: a lifted key sits UNDER THE FINGER, so if it is left in
       the hit test it answers `elementFromPoint` instead of the key being
       aimed at, and the carry is silently refused. One key out of the way was
       enough while one key moved. */
    function dragWatch(fromR, fromK, toR, toK){
      function el(ri, ki){
        return document.querySelector('#kb [data-r="' + ri + '"][data-k="' + ki + '"]');
      }
      var src = el(fromR, fromK), dst = el(toR, toK), real, seen = null, els, lifted;
      if (!src || !dst) return null;
      els = kbSelKeys().map(function (m){ return el(m.r, m.i); });
      if (els.indexOf(null) >= 0) return null;
      kbDown({ target: src, touches: [{ clientX: 100, clientY: 100 }] });
      kbLift();                                   /* the 380ms hold, fired */
      lifted = els.filter(function (e){ return /(^|\s)lift(\s|$)/.test(e.className); }).length;
      real = document.elementFromPoint;
      document.elementFromPoint = function (){
        seen = els.map(function (e){
          return { t: e.style.transform, pe: e.style.pointerEvents };
        });
        return dst;
      };
      kbDragTo({ touches: [{ clientX: 120, clientY: 140 }], preventDefault: function (){} });
      document.elementFromPoint = real;
      kbUp({ preventDefault: function (){} });
      return { n: els.length, lifted: lifted, seen: seen };
    }
    fresh();
    (function (){
      var rw = kbLayer().rows[3];
      while (rw.length > 1 && kbUsed(rw) > KB_COLS - 6) rw.pop();
      saveKb(); render();
    }());
    kbTapKey(0, 2); kbTapKey(0, 3); kbTapKey(0, 4); standKb();
    out.liftChose = kbSelKeys().length === 3;
    var lw = dragWatch(0, 2, 3, 0);
    out.liftRan = !!lw && !!lw.seen;
    out.liftN = lw ? lw.n : 0;
    out.liftUp = lw ? lw.lifted : 0;
    /* all of them rose */
    out.liftAll = !!lw && lw.lifted === lw.n;
    /* all of them were following the finger, by the same amount -- a run that
       travels as one thing does not stretch on the way */
    out.liftMoves = !!lw && !!lw.seen && lw.seen.every(function (s){
      return s.t && s.t === lw.seen[0].t;
    });
    out.liftMoveN = lw && lw.seen ? lw.seen.filter(function (s){ return !!s.t; }).length : 0;
    /* and not one of them was in the way of the question */
    out.liftHit = !!lw && !!lw.seen && lw.seen.every(function (s){ return s.pe === 'none'; });
    out.liftHitN = lw && lw.seen ? lw.seen.filter(function (s){ return s.pe === 'none'; }).length : 0;
    /* THE CLAIM THAT IS NOT MADE HERE, so the next reader does not add it
       back believing it holds something: "and letting go puts every one of
       them back down". kbUp() does clear the lift and the transform off every
       carried key -- but it then calls kbReadRows(), which ends in render(),
       and render() REBUILDS the board. Measured: of the 3 elements carried, 0
       are still in the page after the drop. So a query for a key left lifted
       finds nothing whether kbUp clears them or not; the claim was written,
       watched with the clearing removed, and STAYED GREEN. A green line that
       cannot go red is worse than no line, because it is believed. */

    /* ---- a MERGED PAIR is carried as one thing ------------------------
       「長押しの時は動くよ？ iPhoneのホーム画面と同じ ウェジットも2*2とかある
       けどその分みんな動くでしょ？それと同じ」 OWNER 2026-08-27.

       The carry moved the half under the finger and left the other where it
       was, so kbVFix() -- which is right, and is the one place that says what
       a valid pair is -- found a tall key with no hole under it and took the
       merge apart. Nothing threw. The pair somebody made was simply gone.

       What is asked here is that BOTH halves arrive, in the same column, in
       rows that are still next to each other; and that a drop the sheet
       cannot hold leaves them exactly where they were rather than eating
       one. The second is the one that matters -- a carry that loses a key is
       the worst thing on this screen. */
    function pairUp(){
      fresh();
      var r, k, made = false, at = null;
      for (r = 0; r + 1 < kbLayer().rows.length && !made; r++)
        for (k = 0; k < kbLayer().rows[r].length && !made; k++)
          if (kbVJoin(r, k)){ made = true; at = { r: r, k: k }; }
      return at;
    }
    /* where the tall key is, and whether its other half is under it */
    function pairAt(){
      var rows = kbLayer().rows, ri, ki, a, di;
      for (ri = 0; ri < rows.length; ri++)
        for (ki = 0; ki < rows[ri].length; ki++)
          if (kbTall(rows[ri][ki])){
            a = kbAtOf(rows[ri], ki);
            di = kbAtKey(rows[ri + 1] || [], a);
            return { row: ri, col: a,
                     whole: di >= 0 && kbShadow(rows[ri + 1][di]) &&
                            kbU(rows[ri + 1][di].w) === kbU(rows[ri][ki].w) };
          }
      return null;
    }
    var p0 = pairUp();
    out.pairMade = !!p0;
    if (p0){
      /* room in the two rows it is going to -- the pattern's rows are full */
      kbLayer().rows[2].pop(); kbLayer().rows[2].pop(); kbLayer().rows[3].pop();
      saveKb(); render();
      var pWas = JSON.stringify(kbLayer().rows.map(say));
      out.pairBefore = pairAt();
      drag(p0.r, p0.k, 2, 0);
      out.pairAfter = pairAt();
      out.pairMoved = !!out.pairAfter && out.pairAfter.row === 2;
      out.pairWhole = !!out.pairAfter && out.pairAfter.whole;
      /* ONE step back, not two -- if the halves were two moves it is not one
         thing, which is the whole of what the owner asked for */
      kbUndo();
      out.pairUndoOne = JSON.stringify(kbLayer().rows.map(say)) === pWas;

      /* grabbing the BOTTOM half carries it too */
      var p1 = pairUp();
      kbLayer().rows[2].pop(); kbLayer().rows[2].pop(); kbLayer().rows[3].pop();
      saveKb(); render();
      var under = kbAtKey(kbLayer().rows[p1.r + 1], kbAtOf(kbLayer().rows[p1.r], p1.k));
      drag(p1.r + 1, under, 2, 0);
      var byLow = pairAt();
      out.pairByLow = !!byLow && byLow.row === 2 && byLow.whole;

      /* the LAST row has no row under it, so nothing lands there -- and the
         pair stays where it was rather than losing a half.

         ROOM IS MADE IN IT FIRST, and that is the whole of this claim being
         about anything. The pattern's last row is full, so without this the
         drop is refused for having no room and the claim passes whether the
         "no row under it" rule exists or not -- watched: taking that rule out
         left this green. A check that is right for the wrong reason is the
         one this file warns about twice. */
      var p2 = pairUp();
      var last = kbLayer().rows.length - 1;
      kbLayer().rows[last].pop(); kbLayer().rows[last].pop();
      saveKb(); render();
      var lastWas = JSON.stringify(kbLayer().rows.map(say));
      drag(p2.r, p2.k, last, 0);
      out.pairNotLast = JSON.stringify(kbLayer().rows.map(say)) === lastWas &&
                        !!pairAt() && pairAt().whole;

      /* and a row with no room refuses the same way -- nothing is eaten */
      var p3 = pairUp();
      var fullWas = JSON.stringify(kbLayer().rows.map(say));
      drag(p3.r, p3.k, 2, 0);      /* every row of the pattern is full */
      out.pairNotFull = JSON.stringify(kbLayer().rows.map(say)) === fullWas &&
                        !!pairAt() && pairAt().whole;

      /* ---- and the row UNDER the one it lands in is asked too -----------
         The claim above is about the row the top half goes into, and that one
         is refused a step earlier, in kbDragTo, by the gate the single carry
         already had. Taking the second gate out therefore left it green --
         watched. So this one gives the landing row room and leaves the row
         BELOW it full: the only thing that can refuse it now is the bottom
         half having nowhere to go. */
      var p4 = pairUp();
      kbLayer().rows[2].pop(); kbLayer().rows[2].pop();   /* room above */
      saveKb(); render();                                  /* row 3 still full */
      out.underFull = kbUsed(kbLayer().rows[3]) === KB_COLS;
      var underWas = JSON.stringify(kbLayer().rows.map(say));
      drag(p4.r, p4.k, 2, 0);
      out.pairNotUnder = JSON.stringify(kbLayer().rows.map(say)) === underWas &&
                         !!pairAt() && pairAt().whole;
    }
    SET.plan = wasPlan;
  }());
  (function (){
    fresh();
    var wasS = ltSort, wasF = ltFil;
    function cells(h){ return (String(h).match(/class="ltc"/g) || []).length; }
    function names(h){
      var m = String(h).match(/class="ltcn">([^<]*)</g) || [];
      return m.map(function (x){ return x.replace(/.*>/, ''); });
    }
    ltSort = 'own'; ltFil = 'all';
    var all = kbLtGrid(0, 0, -1);
    out.ltRow = /class="wfilrow"/.test(all);
    out.ltAll = cells(all);
    ltFil = 'drawn';  out.ltDrawn = cells(kbLtGrid(0, 0, -1));
    ltFil = 'blank';  out.ltBlank = cells(kbLtGrid(0, 0, -1));
    /* drawn and blank are the two halves of the same alphabet, so they add
       back up to it -- a count on its own would pass a grid that answered
       the same list to every filter as long as it was shorter. */
    out.ltSplits = (out.ltDrawn + out.ltBlank === out.ltAll) &&
                   out.ltDrawn > 0 && out.ltBlank > 0;
    ltFil = 'all'; ltSort = 'own';
    var own = names(kbLtGrid(0, 0, -1));
    /* `new` and not `abc`, and the reason is worth keeping: this fixture's
       alphabet IS a to z, so sorting it alphabetically is the order it was
       already in and a claim built on `abc` passes whether the sort is asked
       or not. It was written that way first and went red here, which is the
       check catching its own proxy. `new` is the order they were made in and
       is genuinely a different order on this alphabet. */
    ltSort = 'new';
    var other = names(kbLtGrid(0, 0, -1));
    out.ltSame = own.length === other.length;
    /* the ORDER moved and not the membership: the same letters, re-ordered */
    out.ltSorted = own.join(' ') !== other.join(' ') &&
      own.slice().sort().join(' ') === other.slice().sort().join(' ');
    /* and the sheet that only holds the alphabet asks the same thing */
    ltSort = 'own'; ltFil = 'blank';
    kbSlotFor = { r: 0, k: 0, d: -1 };
    out.ltSheet = cells(kbLtHTML()) === out.ltBlank;
    kbSlotFor = null;
    ltSort = wasS; ltFil = wasF;
  }());

  /* ---- and it is searched, by NAME and by SOUND ------------------------
     「名前と音どっちも調べれる。」 OWNER 2026-08-27.

     A search that reads only the name looks identical on this fixture for
     nearly every letter -- an alphabet of a to z is named after what it says.
     So the letter this asks about is one whose SOUND IS IN NO LETTER'S NAME:
     `g` reads `ɡ` (U+0261, the script g), which no name contains, because
     every name here is ASCII. A name-only search answers nothing for it.
     That one letter is the whole claim; the rest is arithmetic around it. */
  (function (){
    var wasQ = ltQ, wasS = ltSort, wasF = ltFil, i, j, u, l, odd = null, oddU = '';
    ltQ = ''; ltSort = 'own'; ltFil = 'all';
    var alpha = LETTERS.filter(function (x){ return ltKindOf(x) === 'alpha'; });
    for (i = 0; i < alpha.length && !odd; i++){
      l = alpha[i];
      for (j = 0; j < ltUnits(l).length; j++){
        u = String(ltUnits(l)[j]);
        /* not in ITS name, and in nobody else's either */
        if (!alpha.some(function (x){
              return String(ltName(x) || '').toLowerCase().indexOf(u.toLowerCase()) >= 0;
            })){ odd = l; oddU = u; break; }
      }
    }
    out.qOdd = odd ? { name: ltName(odd), snd: oddU } : null;
    function cells(h){ return (String(h).match(/class="ltc"/g) || []).length; }
    out.qAll = cells(kbLtGrid(0, 0, -1));
    out.qBox = /id="lt-q"/.test(kbLtGrid(0, 0, -1));
    /* by NAME */
    ltQ = String(ltName(alpha[0]) || '');
    out.qByName = cells(kbLtGrid(0, 0, -1));
    /* by SOUND -- the letter it belongs to comes back, and it could not have
       come back by name */
    if (odd){
      ltQ = oddU;
      out.qBySound = cells(kbLtGrid(0, 0, -1));
      /* the trailing `<` of the match goes too -- keeping it made every name
         miss, and the claim went red on the check rather than on the app */
      out.qSoundNames = (String(kbLtGrid(0, 0, -1)).match(/class="ltcn">([^<]*)</g) || [])
        .map(function (x){ return x.replace(/.*>/, '').replace(/<$/, ''); });
      out.qSoundIsIt = out.qSoundNames.indexOf(String(ltName(odd))) >= 0;
    }
    /* nothing answers to it -> the empty state, not the whole alphabet */
    ltQ = 'zzqqxx';
    out.qNone = cells(kbLtGrid(0, 0, -1));
    /* and clearing gives all of them back */
    ltQ = '';
    out.qBack = cells(kbLtGrid(0, 0, -1)) === out.qAll;

    /* ---- the FIELD survives being typed into ---------------------------
       This is the whole reason ltPaint() exists rather than render(): the box
       is inside the screen, so rebuilding the screen destroys the element
       being typed into and the caret goes with it after one letter. Measured
       on the real page: focus the box, type, and ask whether the focused
       element is still there. */
    window.route = 'ltset'; NAV = [{ r: 'ltset', a: 'alpha' }];
    render();
    var box = document.getElementById('lt-q');
    out.qFieldThere = !!box;
    if (box){
      box.focus();
      var had = document.activeElement === box;
      /* how many the page ARRIVED with, before a key is pressed */
      out.qOnArrival = document.querySelectorAll('#lt-list .ltc').length;
      ltSetQ('a');
      out.qFieldKept = had && document.activeElement === document.getElementById('lt-q');
      /* and the list under it really was repainted -- fewer cells than the
         page arrived with, and not zero */
      out.qPaintedTo = document.querySelectorAll('#lt-list .ltc').length;
      /* ---- and a narrowed list may not be DRAGGED into a new order ------
         Dropping a letter writes the order down. Under a search the page is
         showing some of the alphabet, so a drop would write a number nothing
         on screen agrees with -- the same reason the sort and the filter turn
         it off. ltDragMount asks for #ltgrid and a narrowed list is not it. */
      out.qNoDrag = !document.querySelector('#lt-list #ltgrid');
      ltSetQ('');
      out.qDragBack = !!document.querySelector('#lt-list #ltgrid');
    }
    ltQ = wasQ; ltSort = wasS; ltFil = wasF;
  }());
  /* ---- a press answers while the keys wobble, and half a column is not
          something to press ------------------------------------------------
     Both are the same shape of fault: something was taken away and what stood
     on it was left behind. */
  SET.plan = 'pro';
  fresh();
  /* fresh() leaves the read-only board 0 showing on this path, and board 0 is
     the free QWERTY -- its keys are spans and answer nothing on purpose. The
     claim below is about the board somebody EDITS. */
  kbShow = 1; kbLay = 0;
  window.route = 'kb'; NAV = [{ r: 'kb', a: '1' }];
  function keysOnPage(){
    return [].slice.call(document.querySelectorAll('#kb .kbk'))
      .filter(function(el){ return el.className.indexOf('cell') < 0; });
  }
  function pressable(list){
    return list.filter(function(el){
      return el.getAttribute('data-do') === 'kbTapKey';
    }).length;
  }
  render();
  kbWob = true; render();
  out.wobKeys = keysOnPage().length;
  out.wobPressable = pressable(keysOnPage());
  kbWob = false; render();

  /* ---- THE SHEET IS FRAMES, AND EVERY ONE OF THEM IS ONE ---------------
     「エクセルと同じだって。点線キーが入ってんの。追加するならタップまで追加
     ボタン。キーガーないところがあるのがおかしい。左寄せにしたら全部寄せるし
     空白が出るのがおかしい」「半キーも左に寄せたら右に1枠開くでしょ？そういう
     話」 OWNER DECISION 2026-08-28.

     Read off the PAGE and not off the layout, because what is wrong is what a
     finger meets. A grid item that is neither a key nor a dotted key is a
     hole in the sheet -- and a hole cannot throw: the board draws, the font
     installs, every other claim here is green, and the person building a
     keyboard finds a place they cannot put a key.

     It was drawn as a <span> for one day, on a leftover of one column, on the
     grounds that a key is one key wide. That is the state this asks there is
     none of. */
  function spanOf(el){
    var m = /span (\d+)/.exec(el.style.gridColumn || '');
    return m ? +m[1] : 0;
  }
  function sheetRows(){
    return [].slice.call(document.querySelectorAll('#kb .kbrow'))
      .filter(function (rw){ return !rw.querySelector('.addrow'); });
  }
  /* holes: grid items of a row that no finger can do anything with.
     wide:  what each row comes to, which must be the whole ten. */
  function sheetLook(){
    var rs = sheetRows(), holes = 0, wide = [], i, j, rw, el, tot;
    for (i = 0; i < rs.length; i++){
      rw = rs[i]; tot = 0;
      for (j = 0; j < rw.children.length; j++){
        el = rw.children[j];
        if (el.className.indexOf('kbn') >= 0) continue;
        tot += spanOf(el);
        if (el.tagName !== 'BUTTON' || el.getAttribute('data-do') === null) holes++;
      }
      wide.push(tot);
    }
    return { holes: holes, wide: wide };
  }
  var seen = [];
  function noHole(tag){
    var k = sheetLook(), bad = k.wide.filter(function (w){ return w !== KB_COLS; });
    seen.push(tag + ' ' + k.holes + '/' + bad.length);
    return k.holes === 0 && bad.length === 0;
  }
  SET.plan = 'pro';
  fresh(); kbShow = 1; kbLay = 0; standKb();
  out.holeFresh = noHole('as built');
  /* a row made short by exactly ONE column: the row that ends half a key from
     the edge, which is what the free QWERTY's third row does by construction
     and what any row does once a key on it is narrowed */
  kbLayer().rows[0][0].w = 0.5;
  /* and a row short by a whole key beside it */
  kbLayer().rows[1].splice(0, 1);
  saveKb(); standKb();
  out.holeShort = noHole('short by a half and by a whole');
  /* the half frame is a button; pressing it SELECTS it, and the band puts in
     HALF A KEY -- 「全部のます触ったら選択で」 OWNER 2026-08-28 */
  (function (){
    var rw = sheetRows()[0], el = null, i, was, put;
    for (i = 0; i < rw.children.length; i++)
      if (rw.children[i].getAttribute('data-do') === 'kbCellAdd' &&
          spanOf(rw.children[i]) === 1){ el = rw.children[i]; break; }
    out.halfFrameFound = !!el;
    if (!el) return;
    was = kbUsed(kbLayer().rows[0]);
    el.click(); standKb();
    out.halfFrameSel = !!(KBH && KBH.k === 'f' && KBH.span === 1);
    put = document.querySelector('.kbtool [data-do="kbCellAdd"]');
    if (put) put.click();
    standKb();
    out.halfFrameAdds = kbUsed(kbLayer().rows[0]) === was + 1;
    out.halfFrameKey = kbLayer().rows[0].filter(function (k){
      return k.k === 'lt' && (k.w || 1) === 0.5;
    }).length > 0;
    out.holeAfterHalf = noHole('after the half went in');
  }());
  /* and none of the three alignments leaves one, on the row carrying half a
     key. 「左寄せにしたら全部寄せるし空白が出るのがおかしい」 */
  fresh(); kbShow = 1; kbLay = 0; standKb();
  (function (){
    var hk = kbKey('lt', 'c'); hk.w = 0.5;
    kbEdit().lay[0].rows[0] = [kbKey('lt', 'a'), kbKey('lt', 'b'), hk];
    kbLay = 0; KBH = null; kbSel = null; saveKb(); standKb();
    kbHeadRow(0); standKb();
    kbAlign('l'); standKb(); out.holeAlL = noHole('left');
    kbAlign('c'); standKb(); out.holeAlC = noHole('centre');
    kbAlign('r'); standKb(); out.holeAlR = noHole('right');
    /* and centring leaves a frame at EACH end where pushing it to one end
       leaves a run at one. 「中心に寄せたら半キーが二つできるけど寄せたら1つ
       になるの」 */
    kbAlign('c'); standKb();
    var rw = kbLayer().rows[0];
    out.alCEnds = rw[0].k === 'gap' && rw[rw.length - 1].k === 'gap';
    kbAlign('l'); standKb();
    rw = kbLayer().rows[0];
    out.alLOneEnd = rw[0].k !== 'gap' && rw[rw.length - 1].k === 'gap';
  }());

  /* ---- AND AFTER ALL OF THAT, THE SHEET STILL ANSWERS A FINGER ----------
     「色んな操作した後でもちゃんと触れる？」 OWNER 2026-08-28.

     CLAUDE.md § 14, on this screen. Every other claim in this file rebuilds
     the board before it presses, which is what lets it press everything and
     is also why it can never press two buttons in a row -- and a whole class
     of fault lives exactly there: select, act, select again.

     So nothing below rebuilds anything. It is one board, pressed through the
     real buttons on the page, in the order a person would press them, and
     what it asks after each act is "can something be chosen now". */
  function tapDo(name, a){
    var list = [].slice.call(document.querySelectorAll('[data-do="' + name + '"]')), el;
    if (a !== undefined) list = list.filter(function (x){
      return x.getAttribute('data-a') === JSON.stringify(a);
    });
    el = list.filter(function (x){ return !x.disabled; })[0];
    if (el) el.click();
    return !!el;
  }
  function tapKey(ri, ki){
    var el = document.querySelector('#kb .kbk[data-r="' + ri + '"][data-k="' + ki + '"]');
    if (el) el.click();
    return !!el;
  }
  function tapRow(ri){
    var el = [].slice.call(document.querySelectorAll('#kb .kbn'))[ri];
    if (el) el.click();
    return !!el;
  }
  function tapCol(ci){
    var el = [].slice.call(document.querySelectorAll('#kb .kbcl'))[ci];
    if (el) el.click();
    return !!el;
  }
  /* what the toolbar is offering, so "selected" is read off the screen and
     not out of KBH -- a selection the buttons do not answer to is the half
     that is a bug rather than a habit */
  function toolFor(){
    return [].slice.call(document.querySelectorAll('.kbtool [data-do]'))
      .filter(function (b){ return !b.disabled; })
      .map(function (b){ return b.getAttribute('data-do'); }).join(' ');
  }
  /* CHOOSING SOMETHING ELSE COSTS TWO PRESSES AND NEVER MORE, and that is the
     screen working rather than a step to get past. 「バラバラ押した時は選択が
     解除されるようにしてほしい」 OWNER 2026-08-27 -- a press the run cannot
     reach RELEASES what is chosen, and the press after it chooses. So the
     thing to hold is the ceiling: never more than two, and the second one
     always lands. A selection that goes to nothing is the right answer; a
     selection that will not come back is the bug. */
  function choose(fn, is){
    var n = 0;
    while (n < 2 && !is()){ fn(); n++; }
    return { got: is(), n: n };
  }
  function chooseRow(ri){
    return choose(function (){ tapRow(ri); },
      function (){ return !!KBH && KBH.k === 'r' && KBH.i === ri; });
  }
  function chooseCol(ci){
    return choose(function (){ tapCol(ci); },
      function (){ return !!KBH && KBH.k === 'c' && KBH.i === ci; });
  }
  function chooseKey(ri, ki){
    return choose(function (){ tapKey(ri, ki); },
      function (){ return !!KBH && KBH.k === 'k' && KBH.r === ri && KBH.i === ki; });
  }
  fresh(); kbShow = 1; kbLay = 0; standKb();
  /* 1. choose a key, bin it, choose another */
  var q;
  q = chooseKey(0, 1); out.seqKey1 = q.got && q.n === 1;
  out.seqKeyCut = (tapDo('kbCut'), !KBH);
  q = chooseKey(0, 3); out.seqKey2 = q.got && q.n === 1;
  out.seqKeyTool = toolFor().indexOf('kbOpenSel') >= 0 &&
                   toolFor().indexOf('kbCut') >= 0;
  /* AND THE MARK ON THE EDIT BUTTON DOES NOT SAY DELETE.
     「編集のマークもなんか削除っぽいから編集っぽいマークにして欲しい」 OWNER
     2026-08-28. It was a rectangle with one bar across the middle -- a key
     with a MINUS on it -- standing one button along from the bin, on the
     screen where a wrong press takes a row of somebody's keyboard away. A
     picture cannot throw and no other check in this file looks at one.

     What is asked is the shape that made it read that way and not "is it a
     pencil", which nothing mechanical can answer: a closed box, and a stroke
     that goes across and nowhere else. Read off the button on the page, with
     a key chosen, so it is the mark a finger is actually looking at. */
  (function (){
    var b = document.querySelector('.kbtool [data-do="kbOpenSel"]'),
        svg = b && b.querySelector('svg'), ds;
    out.editMarkFound = !!svg;
    if (!svg) return;
    ds = [].slice.call(svg.querySelectorAll('path')).map(function (p){
      return p.getAttribute('d') || '';
    });
    out.editMarkBoxed = svg.querySelectorAll('rect,circle,ellipse').length > 0;
    /* a lone horizontal stroke: an M, an h, and no other direction on it */
    out.editMarkBar = ds.filter(function (d){
      return /^\s*M[^a-zA-Z]*[hH][^a-zA-Z]*$/.test(d);
    }).length > 0;
    out.editMarkPaths = ds.length;
    /* and it is not the bin's drawing either */
    var bin = document.querySelector('.kbtool [data-do="kbCut"] svg');
    out.editMarkOwn = !!bin && bin.innerHTML !== svg.innerHTML;
  }());
  /* 2. choose a row while a key is chosen, bin it, choose another */
  q = chooseRow(1); out.seqRow1 = q.got; out.seqRowN = q.n;
  out.seqRowCut = (tapDo('kbCut'), !KBH);
  q = chooseRow(1); out.seqRow2 = q.got && q.n === 1;
  out.seqRowTool = toolFor().indexOf('kbAlign') >= 0;
  /* 3. choose a column while a row is chosen, bin it, choose another */
  q = chooseCol(2); out.seqCol1 = q.got; out.seqColN = q.n;
  out.seqColCut = (tapDo('kbCut'), !KBH);
  q = chooseCol(2); out.seqCol2 = q.got && q.n === 1;
  /* 4. push a row three ways in a row, and then choose a key on it */
  q = chooseRow(2); out.seqAlRow = q.got;
  out.seqAl = tapDo('kbAlign', ['l']) && tapDo('kbAlign', ['c']) &&
              tapDo('kbAlign', ['r']);
  out.seqAlStill = !!KBH && KBH.k === 'r' && KBH.i === 2;
  out.seqAlHole = noHole('after three alignments');
  q = chooseKey(2, 1); out.seqAlKey = q.got;
  /* and every frame left on the sheet still answers */
  out.seqAlFrames = (function (){
    var f = [].slice.call(document.querySelectorAll('#kb .kbk.cell'));
    return f.length === 0 || f.every(function (el){
      return el.tagName === 'BUTTON' && !el.disabled;
    });
  }());
  /* 5. put a key in, put the one beside it in, join them, back, forward */
  KBH = null; standKb();
  out.seqAddA = tapDo('kbAddRowNew');
  (function (){
    var rs = kbLayer().rows, last = rs.length - 1, el, n, rw;
    /* the new row is one empty key wide, so what is beside it is frames.
       Asked of sheetRows() and not of nth-of-type: #kb opens with the row of
       column letters, which is a div too, so nth-of-type names the row above
       the one meant. It was watched picking the wrong row. */
    rw = sheetRows()[last];
    el = rw && rw.querySelector('[data-do="kbCellAdd"]');
    out.seqAddCell = !!el;
    /* two presses now, and they are two different controls: the frame is
       chosen on the sheet, and the key goes in from the band over it.
       「全部のます触ったら選択で」「キーを入れるのは帯のボタン」 */
    if (el) el.click();
    standKb();
    out.seqCellSel = !!(KBH && KBH.k === 'f');
    tapDo('kbCellAdd');
    standKb();
    n = kbLayer().rows[last].length;
    out.seqAddGrew = n >= 2;
    chooseKey(last, 0); tapKey(last, 1);
    out.seqTwo = kbSelN() === 2;
    out.seqJoin = tapDo('kbJoinSel');
    out.seqJoined = kbLayer().rows[last].length === n - 1;
    out.seqN = n;
    out.seqUndo = (tapDo('kbUndo'), !!kbLayer().rows[last] &&
                   kbLayer().rows[last].length === n);
    out.seqRedo = (tapDo('kbRedo'), !!kbLayer().rows[last] &&
                   kbLayer().rows[last].length === n - 1);
    out.seqAfterStep = chooseRow(0).got;
  }());
  /* 6. add a face, go to it, come back, and still choose something */
  KBH = null; standKb();
  (function (){
    var was = kbEdit().lay.length;
    tapDo('kbAddLay');
    standKb();
    out.seqFaceMore = kbEdit().lay.length === was + 1;
    kbLay = kbEdit().lay.length - 1; standKb();
    out.seqFaceKey = chooseKey(0, 0).got;
    kbLay = 0; standKb();
    out.seqBackKey = chooseKey(0, 0).got;
  }());
  /* 7. hold a key up and put it down again, then choose one the ordinary way */
  KBH = null; standKb();
  (function (){
    var src = document.querySelector('#kb .kbk[data-r="0"][data-k="0"]');
    out.seqLiftFound = !!src;
    if (!src) return;
    kbDown({ target: src, touches: [{ clientX: 100, clientY: 100 }] });
    kbLift();
    kbUp({ preventDefault: function (){} });
    standKb();
    out.seqLiftSel = chooseKey(0, 2).got;
    out.seqLiftHole = noHole('after a hold');
  }());
  out.seqSeen = seen.join(' | ');


  return out;
}, { s: seed.toString() });
/* ---- and the SHEET, on the smallest phone the app runs on ---------------
   「キーボードの高さは画面の半分までってルールあるのになんで七も足したら7割
   埋まるけど」「入力欄も含めて50パーに収めたいんだよ」 OWNER 2026-08-27.

   The editor is the preview -- there is no second picture of the keyboard --
   so a sheet that fills seven tenths of the screen is the screen saying the
   keyboard does. `.kb.kbsheet` said `--kh:44px`, a FIXED pixel height, while
   the phone's row is the short side x KB_ROWW: 44.3pt on the narrowest iPhone
   and 60.9 on a Pro Max. So the sheet came out 388px tall on every phone --
   40.6% of a Pro Max and 68.3% of an SE.

   It has to be measured on a SECOND PAGE, at 320 x 568, because a flat 44px
   and the right answer differ by less than a pixel at the 390 this check
   otherwise runs at. That is the whole reason the fault survived: at the size
   everything is looked at, the wrong number is the right one. */
const small = await br.newPage({ viewport: { width: 320, height: 568 } });
await small.goto('file://' + path.join(dir, '..', 'www', 'index.html'));
await small.waitForSelector('#splash', { state: 'detached', timeout: 10000 });
const SM = await small.evaluate(({ s }) => {
  eval('(' + s + ')()');
  SET.done = true; SET.plan = 'pro';
  KB = null; kbShow = 0; kbAdd('abc'); kbLay = 0;
  var lay = kbEdit().lay[0], i, j, r;
  lay.rows = [];
  for (i = 0; i < kbRowsMax(); i++){
    r = [];
    for (j = 0; j < 10; j++) r.push(kbKey('lt', ''));
    lay.rows.push(r);
  }
  saveKb();
  window.route = 'kb'; NAV = [{ r: 'kb', a: String(kbShow) }]; render();
  var sheet = document.querySelector('.kb.kbsheet');
  var key = document.querySelector('.kb.kbsheet .kbk:not(.cell):not(.addrow)');
  return {
    vw: window.innerWidth, vh: window.innerHeight,
    sheetW: sheet ? +sheet.getBoundingClientRect().width.toFixed(1) : -1,
    sheetH: sheet ? +sheet.getBoundingClientRect().height.toFixed(1) : -1,
    rowH: key ? +key.getBoundingClientRect().height.toFixed(1) : -1,
    roww: KB_ROWW, most: KB_MOST, rows: kbRowsMax()
  };
}, { s: seed.toString() });
await small.close();

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
say(r.roadOnBoard === '1',
    'choosing a pattern lands on the keyboard it made, not on the chooser (route '
    + r.roadOnBoard + ')');
say(r.roadDots, 'and the \u22ef is on that screen');
say(r.roadRepat, 'and it opens the way to change the arrangement');
say(r.roadFlick && (r.roadPats || []).length === 5,
    'which offers all five patterns [' + (r.roadPats || []).join(' ') + ']');
say(r.roadPat === 'flick', 'and choosing one changes the keyboard (' + r.roadPat + ')');
say(r.roadRow === '2.5,2.5,2.5,2.5',
    'to four keys of two and a half columns, which is what goes to the phone ('
    + r.roadRow + ')');
say(r.roadBack === '1' && r.roadDots2,
    'and it comes back to that keyboard with the \u22ef still on it (route '
    + r.roadBack + ')');
if (!r.roadDots){
  console.error('\nkb-check: the ' + '\u22ef' + ' is on no screen the app lands on, so nothing'
    + ' below it could be asked. ' + bad.length + ' FAILED');
  process.exit(1);
}
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
say(Math.abs(r.row390 - 54) < 0.5,
    'which on the 390pt phone it was measured at is still ' + r.row390.toFixed(1) +
    'pt -- the 54 it used to be flat at');
say(swMost.ok && r.most === swMost.n,
    'a keyboard may take ' + r.most + ' of the screen, both sides');
say(swBarH.ok && swEdge.ok && r.bars === swEdge.n + swBarH.n,
    'the bars come to ' + r.bars + 'pt here and ' +
    ((swEdge.ok && swBarH.ok) ? (swEdge.n + ' + ' + swBarH.n) : '?') + ' in the extension');
say(r.ceilRows === Math.max(1, Math.floor((r.screenH * r.most - r.bars) / r.rowh)),
    'so the ceiling is ' + r.ceilRows + ' rows -- divided out of the cap, not chosen');
say(r.refW === 320 && r.screenH === 568,
    'referenced to the SMALLEST phone the app runs on (' + r.refW + ' x ' +
    r.screenH + '), which is what rule 19 already does one axis over');
say(r.phones.every((p) => p.tall <= p.cap),
    'so a board at the ceiling is inside the cap on EVERY phone' +
    (r.phones.filter((p) => p.tall > p.cap).length
      ? ': ' + r.phones.filter((p) => p.tall > p.cap)
          .map((p) => p.w + 'x' + p.h + ' -> ' + p.pct + '%').join(', ')
      : ''));
say(Math.abs(SM.rowH - SM.sheetW * SM.roww) < 0.6,
    'the sheet in the app is a row of ' + SM.rowH + 'px on a ' + SM.vw +
    'pt phone, which is its own width x ' + SM.roww + ' (' +
    (SM.sheetW * SM.roww).toFixed(1) + ') -- not a flat number');
say(SM.sheetH / SM.vh <= SM.most,
    'and a board at the ceiling fills ' + (SM.sheetH / SM.vh * 100).toFixed(1) +
    '% of that screen, inside KB_MOST');
say(r.phones.every((p) => p.pct <= 50),
    'and inside half the screen too -- worst is ' +
    Math.max.apply(null, r.phones.map((p) => p.pct)) + '%');
say(r.ceilCols === 20,
    'and ' + (r.ceilCols / 2) + ' keys across, which IS a number: the narrowest iPhone');
say(r.patsFit, 'and every pattern the app builds is inside it as it is built');
say(r.sizes5.every((x) => x.over === 0),
    'and at 26 / 60 / 105 / 150 / 300 letters too -- no face over the ceiling' +
    (r.sizes5.filter((x) => x.over).length
      ? ': ' + r.sizes5.filter((x) => x.over)
          .map((x) => x.pat + ' at ' + x.n + ' is ' + x.deep + ' rows').join(', ')
      : ''));
const ofAlpha = r.sizes5.filter((x) => x.ofAlpha);
say(ofAlpha.every((x) => x.kept === x.n),
    'and not one letter is dropped to make them fit, over ' + ofAlpha.length +
    ' builds of the three that lay the whole alphabet out' +
    (ofAlpha.filter((x) => x.kept !== x.n).length
      ? ': ' + ofAlpha.filter((x) => x.kept !== x.n)
          .map((x) => x.pat + ' at ' + x.n + ' kept ' + x.kept).join(', ')
      : ''));
say(r.sizes5.every((x) => x.dead === 0),
    'and no face of any of them is a dead end');
say(r.chart5.every((x) => x.over === 0 && x.dead === 0),
    'the chart too, whose rows are the consonants: ' +
    r.chart5.map((x) => x.cons + '->' + x.faces + 'x' + x.deep).join('  '));
say(r.patsShape,
    'and every one of them is the shape of a keyboard -- a key between 0.72:1' +
    ' (ten across, iOS QWERTY) and 1.81:1 (four across, its ten-key)' +
    (r.patsShape ? '' : ': ' + r.shapes.filter((x) => x.aspect < 0.71 || x.aspect > 1.82)
      .map((x) => x.pat + ' is ' + x.aspect.toFixed(2) + ':1 at ' + x.cols + ' across').join(', ')));
say(r.rowsCap, 'rows stop at the ceiling however many times the row is added');
say(r.plusGone, 'and the dashed row is not drawn once there is no room for one');
say(r.foundFull, 'the board has a row that is already the full width');
say(r.colsCap, 'and it takes no more keys');
say(r.wCap, 'and a key in it cannot be widened past the edge');
say(r.overKept, 'a layout that is already over the ceiling is left exactly as it is');
say(r.overStillCant, 'and still cannot be added to');
say(r.centred, 'a short row sits in the middle of the ten: ' + r.centreLead +
    ' empty in front, ' + r.centreTail + ' behind -- off by at most one key');
say(r.faces === 2, 'adding a page gives the keyboard ' + r.faces + ' of them');
say(r.wayThere, 'and page 1 has a key that goes to page 2');
say(r.wayBack, 'and page 2 has one that comes back');
say(r.keptKeys && r.notOver, 'and the key went in beside what was there, not over it');
say(r.layBack, 'and the step back takes the page and both keys away again');
say(r.layFront, 'the key goes in at the front of the last row when that row has room');
say(r.layNewRow, 'and the space bar gives up a key for it when every row is full (' +
    r.spWas + ' -> ' + r.spNow + '), rather than a row nothing has room for');
say(r.sameBoard, 'a flick board and a QWERTY board are drawn the same width');
say(r.notSame, 'and a flick key is not a QWERTY key: ' + r.sizes.flick.key +
    'px against ' + r.sizes.qwerty.key + 'px');
say(r.shareQ && r.shareF,
    'each is its share of the ten: qwerty w' + r.sizes.qwerty.w + ' -> ' +
    r.sizes.qwerty.key + 'px, flick w' + r.sizes.flick.w + ' -> ' + r.sizes.flick.key + 'px');
say(r.spanQ && r.spanF,
    'and it is drawn spanning that many columns (' + r.sizes.qwerty.span +
    ' and ' + r.sizes.flick.span + ' of 20 half columns)');
say(r.colSame,
    'and both boards carry the same ten columns: ' + r.sizes.qwerty.hdr +
    ' / ' + r.sizes.flick.hdr + ' -- a is a is a, whatever stands on it');
say(r.edgeStill, "and taking a column out does not move the board's edges");
say(r.dragRan, 'a key can be held and carried into another row');
say(r.dragNoneOver,
    'and a full row does not take it: every row is still ten or fewer (' +
    r.dragWidths.map(function (w){ return w / 2; }).join(', ') + ' keys)');
say(r.dragPutBack, 'and the key is back where it was rather than gone');
say(r.dragNoStep, 'and a carry that was refused left no step to take back');
say(r.dragInRow && r.dragInRowWide,
    'while the same row still rearranges its own keys, full though it is');
say(r.overWide && r.overUntouched,
    'and a row somebody already has that is eleven wide is left exactly as it is');
say(r.runChose && r.runBoth,
    'two chosen keys are carried together: the row gives up ' + r.runLeft +
    ' half columns and the other takes ' + r.runCame);
say(r.runKeys, 'and the board has every key it had -- none left behind');
say(r.runUndoOne, 'and ONE step back puts the run where it was');
say(r.runThree && r.roomForTwo && r.runNoRoomKeys && r.runNoRoomSame,
    'three carried into a row with space for two: nothing moves, and NOT ONE key is lost');
say(r.runDownChose && r.runDownKeys && r.runDownRows,
    'and a run chosen DOWNWARD arrives one to a row, in the same column');
say(r.liftChose && r.liftRan && r.liftAll,
    'and all ' + r.liftN + ' of them LIFT, not just the one under the finger (' +
    r.liftUp + ' of ' + r.liftN + ' up)');
say(r.liftMoves,
    'and all ' + r.liftN + ' follow the finger, by the same amount (' +
    r.liftMoveN + ' of ' + r.liftN + ' moving)');
say(r.liftHit,
    'and not one of them is in the way of "what is under the finger" (' +
    r.liftHitN + ' of ' + r.liftN + ' out of the hit test)');

say(r.pairMade, 'two keys can be merged into one that is two rows tall');
say(r.pairMoved, 'and carrying it takes it to the row it was carried to' +
    (r.pairAfter ? ' (row ' + r.pairAfter.row + ')' : ''));
say(r.pairWhole, 'with BOTH halves -- same column, the row under it, same width');
say(r.pairUndoOne, 'and one step back puts the pair where it was, in one');
say(r.pairByLow, 'grabbing the lower half carries the pair just the same');
say(r.pairNotLast, 'the last row has no room under it, so the pair stays where it was');
say(r.pairNotFull, 'and a row with no room refuses it -- with neither half lost');
say(r.underFull && r.pairNotUnder,
    'and so does a landing row with room whose NEXT row has none -- both are asked');
say(r.ltRow, 'the letters offered for a key carry the alphabet\'s own row of ' +
    'buttons -- the order and the filter, not a second pair');
say(r.ltSplits, 'and the filter narrows them: ' + r.ltAll + ' letters, ' +
    r.ltDrawn + ' drawn and ' + r.ltBlank + ' not, which is all of them twice over');
say(r.ltSame && r.ltSorted,
    'and the order moves the same letters rather than a different set');
say(r.ltSheet, 'and the sheet that holds only the alphabet answers the same list');
say(r.qBox, 'the letters are searched too, from a box that is always on the screen');
say(r.qByName > 0 && r.qByName < r.qAll,
    'a name narrows them: ' + r.qAll + ' letters to ' + r.qByName);
say(!!r.qOdd, 'the alphabet has a letter whose sound is in nobody\'s name' +
    (r.qOdd ? ' -- ' + r.qOdd.name + ' reads ' + r.qOdd.snd : ''));
say(!!r.qOdd && r.qBySound > 0 && r.qSoundIsIt,
    'and searching that SOUND finds it (' + (r.qOdd ? r.qOdd.snd : '?') + ' -> ' +
    (r.qSoundNames || []).join(' ') + ') -- which a name-only search cannot');
say(r.qNone === 0, 'a search nothing answers to shows none of them, not all of them');
say(r.qBack, 'and clearing it gives every letter back');
say(r.qFieldThere && r.qFieldKept,
    'the box survives being typed into -- the list repaints, the field does not');
say(r.qPaintedTo > 0 && r.qPaintedTo < r.qOnArrival,
    'and the list under it really did narrow, ' + r.qOnArrival + ' -> ' + r.qPaintedTo);
say(r.qNoDrag && r.qDragBack,
    'a narrowed list cannot be dragged into a new order, and can be again once cleared');
say(r.cutKeyStill, 'nor the size of the keys that are left (' + r.cutKeyWas +
    'px -> ' + r.cutKeyNow + 'px)');
say(r.cutHdrStill, 'nor which columns there are (' + r.cutHdrNow + ')');
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
say(r.addsOnly, 'and a face that already has one comes out of a save with the keys it went in with (' + r.addsOnlyN + ' rows), twice over');
say(r.cellNoneFull, 'a board a pattern made has no empty frame -- every row is ten');
say(r.gapFrames > 0 && r.gapDashed,
    'the half key that insets the QWERTY\'s third row is drawn as a dotted frame ('
    + r.gapFrames + ' of them) -- 「キーガーないところがあるのがおかしい」');
say(r.gapRoPlain, 'and it is nothing at all on the board that goes to the phone');
say(r.cellShown && r.cellIsButton, 'cut a column out and the empty frames are buttons');
say(r.cellHalf, 'nine keys on a sheet of ten leave half a frame at each end');
say(r.cellSel && r.cellLit, 'pressing one SELECTS it and lights it -- it does not put a key in');
say(r.cellPut && r.cellTool === 'kbUndo kbCellAdd',
    'and the band over the sheet offers the one button that fills it [' + r.cellTool + ']');
say(r.cellAdded && r.cellAddedW,
    'which puts in a key exactly the width of the frame it was ('
    + (r.cellSpan / 2) + ' of a key)');
say(r.cellBack, 'and the step back takes it away again');
say(r.alGaps === 2 && r.alFrames === '2,2,2,1,2,2,2,1',
    'a row of three centred on a sheet of ten leaves three frames and a half at'
    + ' each end, not one frame of three and a half [' + r.alFrames + ']');
say(r.alNamed === 2, 'and the first frame of each names the gap it stands for,'
    + ' so a carry reads the row back whole (' + r.alNamed + ')');
say(r.alSel && r.alLit, 'pressing one of them SELECTS it and lights it, the same as any other frame');
say(r.alGapCls, 'and at rest it is drawn exactly as the gap it stands for was');
say(r.alBin, 'and the bin is down on it -- there is nothing in it to take');
say(r.alSame && r.alKey,
    'and the band puts one key in it, the row staying exactly as wide ['
    + r.alRest + ']');
say(r.alBack, 'and the step back puts the gap back');
say(r.keySel && r.keyLit, 'pressing a key selects it and lights it, one at a time');
say(r.keyStands, 'and pressing it again leaves it selected -- no toggle');
say(r.joined && r.joinedW,
    'pressing the key beside it joins the two, as wide as the two of them were');
say(r.joinedKeeps, 'keeping the letter of the one on the left');
say(r.joinedRow, 'and the row comes to what it came to before');
say(r.joinedSel, 'and what is left is what is selected');
say(r.joinBack, 'and the step back takes the two back');
say(r.tapNoJoin,
    'but TAPPING the one beside it does not join them -- tapping only selects');
say(r.tapMoved, 'the two of them are chosen instead -- the run lengthened');
say(r.downOnly && r.downJoined,
    'and the one button reaches the key UNDER it when there is none beside it');
say(r.selOne && r.selTwo && r.selAcross && r.selThree,
    'pressing the key beside a chosen one LENGTHENS the choice: 1, 2, 3 across' +
    (r.selTwo ? '' : ' -- it did not lengthen at all'));
say(r.selBack, 'and the other end of the run lengthens it too (' + r.selBackN + ' chosen)');
say(r.selLit, 'and all four are lit, not just the first');
say(r.selNoToggle,
    'pressing one already in the run leaves it alone -- the toggle is gone');
say(r.released,
    'a key the run cannot reach RELEASES it: ' + r.relWas + ' chosen, then none');
say(r.relThenPick, 'and the next press chooses that key, so nothing is out of reach');
say(r.colWas && r.colStands && r.colGone,
    'a column stands when pressed again, and is released by pressing a key');
say(r.rowWas && r.rowStands && r.rowGone,
    'and a row the same, released by pressing a column');
say(r.underIsCol && r.selDown,
    'DOWN is the key at this one\'s column in the next row, not index i of it');
say(r.oneOpenBtn && r.oneNoJoin && r.keyBinUp,
    'ONE key chosen: its page and the bin, and no join -- joining is about two');
say(r.twoJoinBtn && r.twoNoOpen && r.twoBinUp,
    'TWO chosen: join and the bin, and no page -- a page is about one key');
say(r.threeJoinDown, 'THREE chosen: the join is down, not guessing which two');
say(r.downHasOne && r.downAtOne,
    'the downward join is down at ONE chosen, even where a key is lined up under it');
say(r.deepJoinDown,
    'and down at THREE lined up downward too (' + r.deepN + ' chosen), not just at one');
say(r.downTwo && r.downNoThird && r.downStops,
    'and a downward run stops where the rows stop lining up -- the inset third row');
say(r.keyNoAlign, 'and not the alignments, which are a row\'s business');
say(r.keyBinTook, 'the bin takes the key that is selected');
say(r.manyChosen && r.manyBinTook,
    'and every key of a run, not just the first -- three chosen, three gone');
say(r.manyBinBack, 'and the step back puts all three back');
say(r.keyBinBack, 'and the step back puts it back');
say(r.tilesGone, 'and the three widths under the sheet are gone entirely');
say(r.insColFullDown && r.insColFullAsk,
    'a board that is already ten across is offered no + for a column');
say(r.insColFullNoop && r.insColFullBtn,
    'and asking anyway adds nothing, and neither side is drawn');
say(r.insColRoom && r.insColAsks,
    'cut one out and the + comes back, offering left and right');
say(r.insColShort, 'the board has a row too short to reach that column');
say(r.insColWent && r.insColLeft,
    'and a column goes into every row that REACHES it, leaving that one alone');
say(r.insColSize, 'without making one key on the board smaller');
say(r.insColKey, 'and what goes in is an empty key, not a gap');
say(r.insColBack, 'and the step back takes it out again');
say(r.plusLayGone, 'a face with nowhere to put that key is not offered a + at all');
say(r.plusLayNoop, 'and asking for one anyway does nothing');
say(r.romOnEditor && r.romOnFree && r.romOnList,
    'the letter-on-each-key switch is on the editor, the free face and the list');
say(r.selKeeps, 'pressing a row number does NOT delete the row any more');
say(r.selLit && r.selHead, 'it lights the row up and its number with it');
say(r.cutUp && r.alUp, 'and the bin and the three alignments come up');
say(r.bandBack, 'the selection is a band BEHIND the keys');
say(r.keysPlain, 'and the keys themselves are the colour they always were');
say(r.selStands, 'pressing the same head again leaves it selected');
say(r.cutDown && r.alDown, 'and the buttons go down once the selection is released');
say(r.colLit, 'a column lights up too, header and the keys standing in it');
say(r.insetAt >= 0, 'the board has a row inset by half a key (row ' + r.insetAt + ')');
say(r.litInset, 'and no key on it lights for any column -- it lines up with none of them');
say(r.litPlain, 'while every row that DOES line up lights exactly one key per column');
say(r.wideSeen > 0 && r.wideLit === r.wideSeen,
    'and all ' + r.wideSeen + ' keys wider than a column light for one -- rule 19 stands');
say(r.litCount > 0 && r.cutTookTwo,
    'cutting that column takes exactly one column out of every row a key lit in (' +
    r.litCount + ' lit)');
say(r.colBand, 'a band runs down the whole sheet where that column is');
say(r.colBandAt, 'and it stands under the letter that names it');
say(r.colCut, 'and can be taken away');
say(r.colNoAl, 'but has no slack across it, so the alignments stay down');
say(r.alLeft, 'aligning left puts the whole slack after the keys');
say(r.alRight, 'aligning right puts it before them');
say(r.alCentre, 'and centring splits it evenly, to within the one key it gives up to stay on a column');
say(r.halfOdd && r.halfLeft,
    'a row with half a key in it goes hard against the left, nothing in front');
say(r.halfRight,
    'and hard against the right: all ' + r.halfR0 +
    ' half columns in front, half key and all');
say(r.halfCentre,
    'while centring splits it between the two ends and rounds nothing away ('
    + r.halfC0 + ' in front, ' + r.halfC1 + ' behind)');
say(r.halfFull, 'and all three still come to the full ten');
say(!r.halfConCols && !r.halfRonCols,
    'and that row lines up with no column, centred or pushed to an end -- the' +
    ' rounding that used to hide it is gone');
say(r.halfCLit === 0,
    'so the band comes down and not one key on it lights, which is the row' +
    ' saying so');
say(r.alKeys, 'no key moves, whichever of the three is pressed');
say(r.alFull, 'and the row comes to the full width, so the phone draws what this does');
say(r.colsL && r.colsC && r.colsR,
    'every key of an aligned row starts on a whole column, all three ways');
say(r.drawnHalf,
    'and three keys on a sheet of ten are drawn with three frames and a half' +
    ' in front of them (' + r.drawnSpans + ' = ' + r.drawnLead + ' columns)');
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
say(r.vjDid, 'a key joins to the one directly under it');
say(r.vjTall, 'and it stands two rows tall');
say(r.vjKeeps, 'and it keeps the UPPER key: its letter and all four flicks');
say(r.vjShadow, 'and the row below holds a gap of the same width where its lower half is');
say(r.vjRowSame, 'and nothing else in that row moved');
say(r.vjWidth, 'and both rows still come to what they came to');
say(r.vjOthers, 'and no other row moved');
say(r.vjDrawn, 'it is drawn two rows tall');
say(r.vjShadowPlain, 'and the lower half draws nothing');
say(r.vjTapUp, 'pressing the lower half selects the key, not the hole');
say(r.vjTwice, 'joining it a second time is refused');
say(r.vjAlDown, 'the three alignments are down on a row with half a merge in it');
say(r.vjAlNoop, 'and asking anyway moves nothing');
say(r.vjUndo, 'the step back takes the merge apart again, exactly');
say(r.vjRedo, 'and the step forward puts it back');
say(r.vjKept, 'the merge is still there after localStorage');
say(r.vjSendsH, 'the extension is handed how many rows the key stands in');
say(r.vjSendsNoUp, 'and an ordinary gap of the right width where the lower half is');
say(r.vjRagged, 'two that do not line up are refused, and nothing moves');
say(r.vjDelUp, 'deleting the row above leaves no hole under nothing');
say(r.vjDelDn, 'deleting the row below leaves no key covering a row that is not there');
say(r.vjColBoth, 'a column taken out narrows both halves by the same amount');
say(r.vjColStands, 'and the merge stands');
say(r.vjClean, 'a board nobody merged anything on carries no h and no up');
say(r.hasUndo, 'the screen has a step back on it');
say(r.undoOffAtFirst, 'and it is down on a board nothing has been done to');
say(r.undoOnAfter, 'and up once something has');
say(r.redoOnAfterUndo, 'and the step forward is up once something has been taken back');

console.log('\n  patterns at five alphabet sizes (faces x deepest face).');
console.log('  qwerty finds a-z by name and the chart is built from sounds, so' +
  ' neither moves with the alphabet:');
[26, 60, 105, 150, 300].forEach((n) => {
  console.log('    ' + String(n).padStart(3) + ' letters   ' +
    r.sizes5.filter((x) => x.n === n)
      .map((x) => x.pat + ' ' + x.faces + 'x' + x.deep).join('   '));
});
console.log('\n  the ceiling is ' + r.ceilRows + ' rows, one number for every phone.');
console.log('\n  every pattern, as the keyboard it comes out as:');
r.shapes.forEach((x) => console.log('    ' + x.pat.padEnd(14) +
  String(x.cols).padStart(3) + ' x ' + x.rows + '   ' + x.aspect.toFixed(2) +
  ':1   ' + Math.round(x.screen * 100) + '% of the screen'));
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

say(r.wobKeys > 0 && r.wobPressable === r.wobKeys,
    'while the keys wobble, every one of them still answers a finger ('
    + r.wobPressable + ' of ' + r.wobKeys + ')');

/* The ⊖ on a held key came off and this is what was standing on it: the press
   was stripped because the ⊖ was what a press was FOR, and nothing took its
   place. 「キー触っても反応ないし、選択しているところと違うとこさわれば選択解除
   されるはずなのにそれもない」 */

/* ---- the sheet is frames, and every one of them is one ------------------
   「エクセルと同じだって。点線キーが入ってんの。キーガーないところがあるのが
   おかしい」 OWNER 2026-08-28 */
say(r.holeFresh, 'every frame of a board as built is a key or a dotted key');
say(r.holeShort,
    'and of one short by half a key and of one short by a whole key -- no blank');
say(r.halfFrameFound && r.halfFrameSel && r.halfFrameAdds && r.halfFrameKey,
    'the half frame is a button; pressing it selects it and the band puts in half a key');
say(r.holeAfterHalf, 'and the sheet is still whole after it went in');
say(r.holeAlL && r.holeAlC && r.holeAlR,
    'none of the three alignments leaves a blank on a row carrying half a key');
say(r.alCEnds, 'centring leaves a frame at each end of it');
say(r.alLOneEnd, 'and pushing it to the left leaves one run at the other');

/* ---- and after all of that, the sheet still answers a finger -------------
   「色んな操作した後でもちゃんと触れる？」 OWNER 2026-08-28. CLAUDE.md § 14 on
   this screen: nothing below rebuilds the board between presses. */
say(r.seqKey1 && r.seqKeyCut && r.seqKey2,
    'choose a key, bin it, and another key can be chosen');
say(r.seqKeyTool, 'and the buttons over the sheet answer to it');
say(r.editMarkFound && !r.editMarkBoxed && !r.editMarkBar && r.editMarkOwn &&
    r.editMarkPaths > 0,
    'and the mark on the edit button is not a box with a bar across it -- a'
    + ' minus is what the bin does (' + r.editMarkPaths + ' strokes, box '
    + r.editMarkBoxed + ', bar ' + r.editMarkBar + ')');
say(r.seqRow1 && r.seqRowN <= 2 && r.seqRowCut && r.seqRow2,
    'choose a row while a key is chosen, bin it, and another row can be chosen ('
    + r.seqRowN + ' presses to leave the key)');
say(r.seqRowTool, 'and the three alignments come back up for it');
say(r.seqCol1 && r.seqColN <= 2 && r.seqColCut && r.seqCol2,
    'choose a column while a row is chosen, bin it, and another can be chosen ('
    + r.seqColN + ' presses to leave the row)');
say(r.seqAlRow && r.seqAl && r.seqAlStill,
    'push a row left then centre then right, and it is still the row chosen');
say(r.seqAlHole && r.seqAlFrames,
    'and every frame on the sheet after all three still answers a finger');
say(r.seqAlKey, 'and a key on that row can be chosen');
say(r.seqAddA && r.seqAddCell && r.seqCellSel && r.seqAddGrew && r.seqTwo &&
    r.seqJoin && r.seqJoined,
    'add a row, choose the frame beside the key there and fill it from the band,' +
    ' choose both, join them [' +
    [r.seqAddA, r.seqAddCell, r.seqCellSel, r.seqAddGrew, r.seqTwo, r.seqJoin,
     r.seqJoined, r.seqN].join(' ') + ']');
say(r.seqUndo && r.seqRedo, 'and the step back and the step forward both land [' +
    [r.seqUndo, r.seqRedo].join(' ') + ']');
say(r.seqAfterStep, 'and a row can still be chosen after them');
say(r.seqFaceMore && r.seqFaceKey, 'add a face, go to it, and a key answers there');
say(r.seqBackKey, 'and one answers again on the face it came from');
say(r.seqLiftFound && r.seqLiftSel,
    'hold a key up and put it down, and a key can be chosen the ordinary way');
say(r.seqLiftHole, 'and the sheet is still frames after it');
console.log('    frames, hole by hole: ' + r.seqSeen);


if (bad.length){ console.error('\nkb-check: ' + bad.length + ' FAILED'); process.exit(1); }
console.log('\nkb: pressing a row number or a column letter SELECTS it and lights it up;\n' +
  'the bin takes it away and the three alignments say where a row is short from,\n' +
  'written in gap keys so the phone draws what this drawing does. A key wider than\n' +
  'the column is narrowed rather than removed, a page arrives with the way there and\n' +
  'the way back on it AND KEEPS IT -- no face is a dead end -- and every one of\n' +
  'those can be taken back and put again --\n' +
  'with nothing outside the layout moving.');
