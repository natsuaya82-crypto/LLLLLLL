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
     over, and the extension squeezes it into 0.55 of the screen with every
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
  /* a board a pattern made has no slack, so a cell only exists after a cut */
  out.cellNoneFull = document.querySelectorAll('.kb.kbsheet .kbk.cell').length === 0;
  kbHeadCol(0); kbCut(); KBH = null; standKb();
  var cells = document.querySelectorAll('.kb.kbsheet .kbk.cell');
  out.cellShown = cells.length > 0;
  out.cellIsButton = cells.length > 0 && cells[0].tagName === 'BUTTON';
  var keysWas = kbLayer().rows[0].length;
  var usedWas = kbUsed(kbLayer().rows[0]);
  /* press the first empty cell of row 0 */
  var c0 = document.querySelector('.kb.kbsheet .kbrow .kbk.cell');
  if (c0) c0.click();
  standKb();
  out.cellAdded = kbLayer().rows[0].length === keysWas + 1;
  out.cellAddedW = out.cellAdded && kbUsed(kbLayer().rows[0]) === usedWas + 2;
  out.cellBack = (kbUndo(), kbLayer().rows[0].length === keysWas);

  /* pressing a key selects it, and pressing it again puts it down */
  fresh();
  kbTapKey(0, 2); standKb();
  out.keySel = !!(KBH && KBH.k === 'k' && KBH.r === 0 && KBH.i === 2);
  out.keyLit = document.querySelectorAll('.kb.kbsheet .kbk.on').length === 1;
  kbTapKey(0, 2); standKb();
  out.keyOff = !KBH;

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
  kbTapKey(0, 2); kbTapKey(0, 3); standKb();
  var j = kbLayer().rows[0][2];
  out.joined = kbLayer().rows[0].length === nWas - 1;
  out.joinedW = out.joined && kbU(j.w) === w2Was;
  out.joinedKeeps = out.joined && j.v === v2Was;
  out.joinedRow = kbUsed(kbLayer().rows[0]) === totWas;
  out.joinedSel = !!(KBH && KBH.k === 'k' && KBH.i === 2);
  out.joinBack = (kbUndo(), kbLayer().rows[0].length === nWas);

  /* the buttons over the sheet act on the key that is selected */
  fresh();
  kbTapKey(0, 2); standKb();
  var tool = vKb();
  out.keyJoinBtn = tool.indexOf('data-do="kbJoinSel"') >= 0;
  out.keyOpenBtn = tool.indexOf('data-do="kbOpenSel"') >= 0;
  out.keyBinUp = tool.indexOf('data-do="kbCut"') >= 0;
  /* and no alignment, which is a row's business */
  out.keyNoAlign = tool.indexOf('data-do="kbAlign"') < 0;
  var binWas = kbLayer().rows[0].length;
  kbCut(); standKb();
  out.keyBinTook = kbLayer().rows[0].length === binWas - 1;
  out.keyBinBack = (kbUndo(), kbLayer().rows[0].length === binWas);

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
  out.halfCentre = HC[0] % 2 === 0 && HC[0] > 0 && HC[1] > 0;
  out.halfFull = HL[3] === KB_COLS && HR[3] === KB_COLS && HC[3] === KB_COLS;
  out.halfR0 = HR[0]; out.halfC0 = HC[0];
  /* and the consequence, said out loud: centring puts every key on a whole
     column and right-aligning does not, on a row that carries half a key.
     That is not a defect of right -- it is the reason centring exists, and
     the reason the day before's decision reads the way it does: a row that
     ends up half a key out lines up with no column and lights for none. */
  function onColsRow0(){
    var rw = kbLayer().rows[0], at = 0, ok = true, x;
    for (x = 0; x < rw.length; x++){
      if (rw[x].k !== 'gap' && at % 2) ok = false;
      at += kbU(rw[x].w);
    }
    return ok;
  }
  kbAlign('c'); out.halfConCols = onColsRow0();
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
say(r.cellNoneFull, 'a board a pattern made has no empty cell -- every row is ten');
say(r.cellShown && r.cellIsButton, 'cut a column out and the empty cells are buttons');
say(r.cellAdded && r.cellAddedW,
    'pressing one puts a key of exactly that cell there');
say(r.cellBack, 'and the step back takes it away again');
say(r.keySel && r.keyLit, 'pressing a key selects it and lights it, one at a time');
say(r.keyOff, 'and pressing it again puts it down');
say(r.joined && r.joinedW,
    'pressing the key beside it joins the two, as wide as the two of them were');
say(r.joinedKeeps, 'keeping the letter of the one on the left');
say(r.joinedRow, 'and the row comes to what it came to before');
say(r.joinedSel, 'and what is left is what is selected');
say(r.joinBack, 'and the step back takes the two back');
say(r.keyJoinBtn && r.keyOpenBtn && r.keyBinUp,
    'with a key selected the buttons over the sheet are join, its page, and the bin');
say(r.keyNoAlign, 'and not the alignments, which are a row\'s business');
say(r.keyBinTook, 'the bin takes the key that is selected');
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
say(r.selOff && r.cutDown && r.alDown, 'pressing it again puts the selection and the buttons down');
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
    'while centring still rounds to a whole key (' + r.halfC0 + ' in front, even)');
say(r.halfFull, 'and all three still come to the full ten');
say(r.halfConCols && !r.halfRonCols,
    'and on that row centring lands every key on a whole column while right' +
    ' does not -- which is what centring is FOR');
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

if (bad.length){ console.error('\nkb-check: ' + bad.length + ' FAILED'); process.exit(1); }
console.log('\nkb: pressing a row number or a column letter SELECTS it and lights it up;\n' +
  'the bin takes it away and the three alignments say where a row is short from,\n' +
  'written in gap keys so the phone draws what this drawing does. A key wider than\n' +
  'the column is narrowed rather than removed, a page arrives with the way there and\n' +
  'the way back on it AND KEEPS IT -- no face is a dead end -- and every one of\n' +
  'those can be taken back and put again --\n' +
  'with nothing outside the layout moving.');
