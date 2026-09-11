/* Typing remembers; a button writes; leaving asks.
   ---------------------------------------------------------------------
   OWNER DECISION 2026-09-03 (docs/FEATURE_RULES.md § 保存していないまま画面を
   出ようとしたら、この app のポップで訊く):

     「プロフィールも何か変えたら保存ボタン欲しい右上／自分のポップで／
       入力内容を保存しますか？はいいいえ／ではいなら保存　いいえならそのまま
       戻るにしない？保存ボタン必要なとこ全部」

   AND THE SAME DAY, WHAT THE BUTTON ITSELF DOES (docs/FEATURE_RULES.md
   § 決定ボタンのルール):

     「なにもない時は薄い灰色、何か打ったら金にする」
     「これが決定ボタンのルール」

   This file asked the first shape of that: 「変えていなければ出ない」, the
   button coming and going. **That was replaced.** The button stands there from
   the moment the screen does and the COLOUR is what moves -- so what is asked
   below is BOTH: that it is there at all three moments, and that it is grey,
   gold, grey. Presence alone would pass an app whose button never lit, which
   is the fault the decision was made about 「保存ボタンが光らないから押せるのか
   わからない」; colour alone would pass one where the button had gone.

   Eight screens take typing. Nothing this holds can throw: a field that writes
   the language on the keystroke renders perfectly, a Save standing there
   whether or not anything moved looks right in every screenshot, and a back
   arrow that throws away a paragraph does it in silence. That last one is why
   this file exists rather than a person's eye.

   SEVEN CLAIMS, ASKED OF EVERY ONE OF THE EIGHT:

     1  typing writes NOTHING -- what the phone holds is byte-identical
        afterwards, LSL and the disk together
     2  a screen with fields has a Save in the bar from the moment it opens,
        and with nothing changed it is PALE GREY
     3  one keystroke turns that same Save GOLD, and nothing was rendered to
        do it -- the button is still there, it changed colour where it stood
     4  back() off an untouched screen leaves, and asks nothing
     5  back() off a changed screen ASKS, and does not leave
     6  No leaves, and what the phone holds is byte-identical to before the
        typing
     7  Yes leaves, and the value is one of the things the phone is holding

   AND SIX ABOUT THE MECHANISM ITSELF:

     8  typing and then rubbing out again is not a change: the Save goes back
        to PALE GREY and nothing is asked. 「変えていない画面では何も訊かない」
     9  the left-edge swipe ends in back(), so it asks the same question
    10  typing a keyboard's name stacks no step to go back through, and one
        save is one write -- kbNoted() reads the LAYOUT, and a name is not in
        one
    11  viewReset() lets the buffers go
    12  no field that is buffered ALSO writes on the keystroke. This is claim 1
        said about the app rather than about one screen, and it is the one that
        catches a screen half converted
    13  an @ the server refuses does not leave the screen; one it allows does
    15  and with the wire REFUSING, Yes does not leave: the person is still on
        their screen, the pop says why, and what they typed is still in the
        field. 「通信エラーなら進むわけねえだろ全部」
    14  a bottom tab is not an answer. Walking off a screen with something typed
        on it and coming back finds it still there, still unsaved, with the
        Save still in the bar AND STILL GOLD -- nothing is thrown away without
        somebody having said so

   AND THEN EVERY SCREEN THAT HAS A SAVE, ASKED OF THE PAGE. Everything above
   is about eight screens named in a list and about the one thing TYPED on
   each, and that list is why the fault the owner reported on 2026-09-10 was
   invisible for as long as it was: a change made by PRESSING is on none of
   those fields. 「書き換えてもセーブボタン光らないとこ多いからこれも一本化
   してね」. The walk at the foot of this file stands on every route in PAGES
   with every argument it takes and on every open* form, keeps the ones that
   put a Save in the bar, and presses everything on them -- five more claims,
   and not one screen or button named:

    17  a screen with a Save answers with a FUNCTION (www/shell.js § keepOn)
    18  press a button: if the screen stays and its own now() has MOVED, the
        Save is GOLD
    19  and if now() has not moved, the Save is GREY -- which is every
        selection on every screen, asked without naming one
    20  a press that changes the LANGUAGE moves now(). 18 alone goes green on
        the exact bug this was written after: setGPos() wrote STG and the
        board's now() did not carry it, so nothing moved, the corner stayed
        grey, and the wiring was perfect. One named exception, held both ways
    21  a field wired to keepSet() writes a name its screen's now() already
        answers -- otherwise what the language holds never reaches the box,
        and both halves of 18/19 stay green through it

   Run: node tools/keep-check.mjs                                        */
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
  SET.walked = true; SET.plan = 'pro';
  var out = { screens: [], fails: [] };

  /* ---- THE WIRE, ANSWERING --------------------------------------------
     A save is not saved until it is UP.
     「保存ボタン押して保存ができるかできないかは通信の有無だけだからな？」
     「通信エラーなら進むわけねえだろ全部」 OWNER 2026-09-05.

     So the Yes below waits on netSaveNow() (www/net.js) and this file has no
     server behind it. ONE WINDOW IS FAKED and everything over it runs for
     real (CLAUDE.md rule 12): netSend() answers, and netLangRow(),
     netSlices() and netSlicePut() are the app's own code doing its own work.

     IT ANSWERS IN THE SAME TURN. Every claim below is written as one press
     and one read; a wire that came back a tick later would turn this into a
     check on the tick. A real one does not, which is exactly what claim 15
     in the second walk is for -- there the wire REFUSES, and the person stays
     on their screen.

     The language is given a row, or the first thing the stub would be asked
     is netLangRow() minting one. */
  langRowGot(langId); langStore();
  window.WIRE = true;
  netSend = function(method, path, body, tok, ok, bad){
    if(!window.WIRE){ bad(null, 0, 'no wire'); return; }
    ok(String(path).indexOf('/rest/v1/language?') === 0 ? [{ id: 'srv-known' }] : []);
  };

  /* EVERYTHING THE PHONE IS HOLDING, AS ONE STRING. This is what "not one
     byte moved" is asked of, rather than one slice by name: a save that wrote
     the wrong slice would pass a check that only looked at the right one.

     IT IS LSL AND THE DISK, AND IT IS ASKED THROUGH slMine(). This counted
     `localStorage` alone, and the slices moved into memory on 2026-09-04
     (CLAUDE.md rule 22) -- so seven of the eight screens saved correctly into
     LSL and this said 「Yes wrote it to no key on the phone」. It broke the
     other way too, and that half is the dangerous one: claim 1 「typing writes
     NOTHING」 and claim 6 「No moved nothing」 were both asking a store the
     language had left, so a screen that wrote the dictionary on every
     keystroke would have passed them.

     slMine() is the app's own answer to 「what is this phone holding」
     (www/core.js), so this is not a second copy of that rule. The picture
     slGot() keeps is a disk key and is enumerated like any other. */
  function all(){
    var keys = [], i, k, acc = '';
    for(i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    for(k in LSL) if(Object.prototype.hasOwnProperty.call(LSL, k) && keys.indexOf(k) < 0) keys.push(k);
    keys.sort();
    for(i = 0; i < keys.length; i++) acc += keys[i] + '=' + slMine(keys[i]) + ';';
    return acc;
  }
  /* The swipe is measured after the page's own turn (600ms below), so it needs
     this same answer from outside this call. One function, asked twice. */
  window.keepAll = all;
  /* A REAL KEYSTROKE. The app carries no on* in its markup, so the only road
     in is the one delegated listener in www/act.js -- a check that called the
     handler by name would be walking a road no thumb takes. */
  function type(sel, v){
    var e = document.querySelector(sel);
    if(!e) return false;
    e.value = v;
    e.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }
  function valOf(sel){
    var e = document.querySelector(sel);
    return e ? String(e.value || '') : null;
  }
  function saveBtn(){ return document.querySelector('.navtop [data-do="keepPress"]'); }
  /* WHETHER IT IS LIT. `navon` is the gold and www/shell.js § navDo is the one
     place that puts it on, so this asks the page for the class rather than
     reading a colour back -- a computed colour is the stylesheet's answer and
     would make this a check on `--gold` instead of on the state. */
  function saveOn(){
    var b = saveBtn();
    return !!b && b.classList.contains('navon');
  }
  function clickSel(sel){
    var e = document.querySelector(sel);
    if(!e) return false;
    e.click();
    return true;
  }
  function whereAmI(){ return here().r + '|' + (here().a === undefined ? '' : here().a); }

  /* ---- the eight screens ------------------------------------------------
     Each says how to stand on it, which box to type in, and how to read back
     what the LANGUAGE holds afterwards. Nothing here reads a buffer: what is
     asked of the app is what somebody would see, and what would survive the
     app being shut and opened again. */
  var lid = LETTERS[0].id, hw = WORDS[0].hw, artId = '';

  function kbStand(){
    SET.plan = 'pro';
    if(kbBoards().length < 2){ KB = null; kbShow = 0; kbAdd('qwerty'); }
    goTab('build'); go('kb', '1');
  }
  function artStand(){
    if(!artId){ wldArtAdd(); artId = wldArts()[wldArts().length - 1].id; }
    goTab('profile'); go('world'); go('wldart', artId);
  }

  var SCREENS = [
    { n: 'the profile',
      go: function(){ goTab('profile'); openMe(); },
      sel: '#me-nm', v: 'Zephyrine',
      read: function(){ return String(ME.name || ''); } },
    { n: "a letter's note",
      go: function(){ goTab('build'); go('letter', lid); },
      sel: '#lt-nt', v: 'the one that starts it',
      read: function(){ var l = ltById(lid); return String((l && l.nt) || ''); } },
    /* The four fixed fields live under 概要, and every section of the article
       arrives folded (OWNER 2026-08-26, held by world-check) -- and walking
       off the page folds them again, which viewLeft() does and which this
       walks through on every pass. So it is unfolded each time rather than
       once. */
    { n: 'the article, being written',
      go: function(){ goTab('profile'); go('world');
                      if(abShut('wldov')) abToggle('wldov'); },
      sel: '#wld-where', v: 'the high valley',
      read: function(){ return String(world().where || ''); } },
    { n: 'one section of the article',
      go: artStand,
      sel: '#wldart-t', v: 'How the river was named',
      read: function(){ var a = wldArtBy(artId); return String((a && a.t) || ''); } },
    { n: "a keyboard's name",
      go: kbStand,
      sel: '.kbnm', v: 'the small one',
      read: function(){ var b = kbBoards()[1]; return String((b && b.nm) || ''); } },
    /* 「規則>で規則だけの見開きでメモみたいな画面全体にかけるページにして」
       OWNER 2026-09-05. What a stage says its rule is has a page of its own
       now -- openStRules() in www/phases.js -- and its buffer is filed under
       that form, exactly as a note's is. */
    /* 挨拶 rather than 否定: the 否定 stage is gone -- the 否定形 chapter of
       the rule-made group was the same chapter said twice, 「重複はいらない」
       OWNER 2026-09-06 -- so this asks a stage that is still on the list. */
    { n: "what a grammar stage says its rule is",
      go: function(){ goTab('build'); go('gram', 'greet'); openStRules('greet'); },
      sel: '[data-in="stSetRules"]', v: 'they are said on meeting',
      read: function(){ return String((STG.rules && STG.rules.greet) || ''); } },
    /* 開いた顔は閲覧で、欄は無い ── 右上の「編集」で書く顔に入る
       (OWNER 2026-09-06)。保存が出るのはその顔なので、ここはそこへ行く。 */
    { n: 'a note',
      go: function(){ goTab('build'); go('notes'); openNote(0); openNoteEdit(0); },
      sel: '#nt-t', v: 'what the river is called',
      read: function(){ return String((NOTES[0] && NOTES[0].t) || ''); } },
    { n: "a word's sheet",
      go: function(){ goTab('build'); go('words'); openEdit(hw); },
      sel: '#wd-nt', v: 'said only of water',
      read: function(){ var w = findWord(hw); return String((w && w.nt) || ''); } }
  ];

  function fail(m){ out.fails.push(m); }

  for(var i = 0; i < SCREENS.length; i++){
    var sc = SCREENS[i], res = { n: sc.n };
    sc.go();
    var key = whereAmI();
    res.key = key;
    var was = valOf(sc.sel);
    if(was === null){ fail(sc.n + ': no field ' + sc.sel + ' on ' + key); out.screens.push(res); continue; }

    /* 2 and 4 -- untouched: the button is there and grey, and back() simply
       leaves */
    res.thereBefore = !!saveBtn();
    res.goldBefore = saveOn();
    back();
    res.leftClean = (whereAmI() !== key);
    res.askedClean = popOn();
    popOff();

    /* 1 and 3 -- typing writes nothing, and puts the button up with no render */
    sc.go();
    var before = all();
    type(sc.sel, sc.v);
    res.thereAfter = !!saveBtn();
    res.goldAfter = saveOn();
    res.wroteWhileTyping = (all() !== before);

    /* 8 -- and putting it back the way it was is not a change */
    type(sc.sel, was);
    res.thereBack = !!saveBtn();
    res.goldBackToNothing = saveOn();
    back();
    res.askedAfterUndo = popOn();
    popOff();

    /* 5 -- back() off a changed screen asks, and does not leave */
    sc.go();
    type(sc.sel, sc.v);
    back();
    res.asked = popOn();
    res.stayed = (whereAmI() === key);

    /* 6 -- No leaves, and nothing on the phone moved */
    clickSel('#pop [data-do="popNo"]');
    res.noLeft = (whereAmI() !== key);
    res.noWrote = (all() !== before);
    res.noWroteValue = (sc.read() === sc.v);

    /* 7 -- Yes leaves, and the value is one of the things the phone is
       holding. read() above is a global; this is the store. */
    sc.go();
    type(sc.sel, sc.v);
    back();
    clickSel('#pop [data-do="popYes"]');
    res.yesLeft = (whereAmI() !== key);
    res.yesStored = (sc.read() === sc.v);
    res.yesHeld = (all().indexOf(sc.v) >= 0);

    if(!res.thereBefore) fail(sc.n + ': no Save in the bar on a screen that takes typing');
    if(res.goldBefore) fail(sc.n + ': a GOLD Save with nothing changed');
    if(!res.leftClean) fail(sc.n + ': back() off an untouched screen did not leave');
    if(res.askedClean) fail(sc.n + ': asked about a screen nobody had touched');
    if(res.wroteWhileTyping) fail(sc.n + ': typing wrote to the phone');
    if(!res.thereAfter) fail(sc.n + ': the Save left the bar when something was typed');
    if(!res.goldAfter) fail(sc.n + ': the Save did not go gold on a keystroke');
    if(!res.thereBack) fail(sc.n + ': the Save left the bar when the typing was put back');
    if(res.goldBackToNothing) fail(sc.n + ': a GOLD Save after typing and putting it back');
    if(res.askedAfterUndo) fail(sc.n + ': asked after typing and putting it back');
    if(!res.asked) fail(sc.n + ': back() off a changed screen asked nothing');
    if(!res.stayed) fail(sc.n + ': back() left while the question was up');
    if(!res.noLeft) fail(sc.n + ': No did not go back');
    if(res.noWrote) fail(sc.n + ': No moved something on the phone');
    if(res.noWroteValue) fail(sc.n + ': No wrote what was typed anyway');
    if(!res.yesLeft) fail(sc.n + ': Yes did not go back');
    if(!res.yesStored) fail(sc.n + ': Yes did not write it');
    if(!res.yesHeld) fail(sc.n + ': Yes wrote it to no key the phone is holding');
    out.screens.push(res);
  }

  /* ---- 16. AND WITH THE WIRE REFUSING, THE PHONE DOES NOT MOVE ----------
     「先にサーバーじゃないの？失敗しましたなのに端末に出るの変じゃない？」
     OWNER 2026-09-06.

     Claim 15 below asks what a person SEES when a save does not land -- they
     are still on their screen and the app has said why. This is the other
     half and it is the one that was wrong: the write went in FIRST and the
     send afterwards, so a refused save left the pop standing over a phone
     that had already been changed. Pressed on the profile: the name was
     changed, the pop said it was not saved, and going back and answering
     「いいえ」 to 「保存しますか」 found the new name there anyway.

     Asked of all eight screens rather than of the one it was reported on,
     because keepSave() is one road and a fix that held on one of them would
     be a fix in the wrong place. Three things, per screen: the value the
     screen writes is what it was, not one byte of what the phone holds moved
     (LSL and the disk together, through the app's own slMine()), and what was
     typed is still in the field -- pressing again sends it again. */
  window.WIRE = false;
  out.dead = [];
  for(i = 0; i < SCREENS.length; i++){
    var sd = SCREENS[i], wasV, wasAll, f, v2;
    viewReset(); popOff();
    sd.go();
    /* Not sd.v: claim 7 above has already written that one down, so typing it
       again is a save with nothing in it and would pass whatever this does. */
    v2 = sd.v + ' again';
    wasV = sd.read(); wasAll = all();
    type(sd.sel, v2);
    keepPress();
    f = document.querySelector(sd.sel);
    out.dead.push({ n: sd.n, value: sd.read(), was: wasV, typed: v2,
                    moved: all() !== wasAll,
                    dirty: keepDirty(keepKey()),
                    field: f ? String(f.value || '') : null });
    popOff();
  }
  window.WIRE = true;
  viewReset(); popOff();

  /* ---- 9. the swipe is the same road ------------------------------------
     swEnd() ends in back() (www/shell.js), so the gesture cannot have an
     answer of its own. Asked by DRIVING the gesture rather than by reading
     the source: what holds this is that the two roads are one, and a check
     that read `back()` out of swEnd would be a copy of the line under test. */
  viewReset();
  goTab('profile'); openMe();
  out.swipeKey = whereAmI();
  type('#me-nm', 'Swept');
  out.swipeBefore = all();
  function pt(x, y, kind){
    document.dispatchEvent(new PointerEvent(kind, {
      clientX: x, clientY: y, bubbles: true, cancelable: true,
      isPrimary: true, pointerId: 1 }));
  }
  var W = window.innerWidth;
  pt(4, 400, 'pointerdown');
  pt(120, 402, 'pointermove');
  pt(W - 10, 404, 'pointermove');
  pt(W - 10, 404, 'pointerup');
  return out;
}, { s: seed.toString() });

/* The swipe travels for 230ms before it reaches back(), so what it did is
   asked after that rather than inside the page's own turn. */
const sw = await pg.evaluate(() => new Promise((ok) => setTimeout(() => {
  ok({ asked: popOn(),
       here: here().r + '|' + (here().a === undefined ? '' : here().a),
       moved: keepAll() });
}, 600)));

const more = await pg.evaluate(() => {
  var out = {};
  popOff(); viewReset();

  /* ---- 10. the keyboard's step back -------------------------------------
     kbNoted() records JSON.stringify(b.lay). A name is not in a layout, so
     typing one may not stack a step -- and one save must be one write. */
  SET.plan = 'pro';
  if(kbBoards().length < 2){ KB = null; kbShow = 0; kbAdd('qwerty'); }
  goTab('build'); go('kb', '1');
  var steps0 = KBU.u.length, saves = 0, realSaveKb = saveKb;
  window.saveKb = function(){ saves++; return realSaveKb.apply(null, arguments); };
  var e = document.querySelector('.kbnm');
  ['o', 'on', 'one'].forEach(function(v){
    e.value = v; e.dispatchEvent(new Event('input', { bubbles: true }));
  });
  out.kbSavesWhileTyping = saves;
  out.kbStepsWhileTyping = KBU.u.length - steps0;
  keepPress();
  out.kbSavesOnSave = saves;
  out.kbName = String(kbBoards()[1].nm || '');
  window.saveKb = realSaveKb;

  /* ---- 10b. ONE KEY, on the screen a keyboard is built on ---------------
     The layout is written into the buffer by kbKeepLay(), keyed by the BOARD
     (kbShow); the Save in the bar reads the buffer keyed by the SCREEN
     (here().a). Those are two names for one thing and they came apart:
     deleting a keyboard slides every board below it down, so kbShow moved and
     the route went on naming the one it had. From then on a row really taken
     out of the layout wrote `kb|1` while the bar read `kb|2` -- the Save
     stayed grey with the keyboard changed under it, and the arrow asked
     nothing on the way out. 「変えてない時も保存ボタン押せる」 OWNER
     2026-09-05, on the other end of the same fault.

     Nothing about it throws: the layout is on the phone either way and goes
     up on the burst, so every screenshot is right and every other check is
     green. What is wrong is what the button SAYS.

     OWNER 2026-09-06 answered it a second way and this claim follows:
     「キーボードを削除すると一覧ではなく1枚目の盤面が開く」. A delete lands
     on the LIST now (kbDropGo -> kbGo with nothing named), so the route names
     no board afterwards and there is no Save on that screen to come apart
     from one. The two names are asked of the board somebody then walks INTO,
     which is where a keyboard is built and the only place the question means
     anything.

     Asked of the real roads: make two, stand on the second, delete the first,
     read where that left you, walk into a board, then take a row out and read
     the bar. */
  SET.plan = 'pro';
  KB = null; kbShow = 0; KEEP = {};
  kbAdd('qwerty'); kbAdd('flick');
  kbGoBoard(2); render();
  kbDropGo(1); render();
  out.kbDropList = here().r === 'kb' && !here().a;
  kbGoBoard(1); render();
  out.kbKeyOne = keepKey() === keepKeyOf('kb', kbShow);
  out.kbGoldAfterDrop = keepDirty(keepKey());
  var rowsWas = kbLayer().rows.length;
  KBH = { k: 'r', r: 0, i: 0 }; kbCut(); render();
  out.kbRowWent = kbLayer().rows.length < rowsWas;
  out.kbGoldOnChange = keepDirty(keepKey());
  out.kbBufs = Object.keys(KEEP).filter(function(k){ return k.indexOf('kb|') === 0; }).length;
  out.kbAsked = (function(){
    var asked = false, op = popAsk;
    popAsk = function(){ asked = true; };
    back();
    popAsk = op;
    return asked;
  })();

  /* ---- 10c. the letter being DRAWN, on the same road --------------------
     「戻るは保存しますか？のポップ使ってほしい。他で使ってるのそのまま流用。
     文字も単語も一緒」 OWNER 2026-09-05.

     This screen was the one that answered differently, and it answered in the
     direction nothing would ever show: leaving it WROTE the drawing onto the
     letter, in silence, so there was no question on the way out and no way to
     say no. It is a buffer now like the other nine.

     The bottom tab is the claim to read twice. What is being kept here is
     somebody's hand rather than a line of typing, so a promise kept on eight
     screens and broken on this one is the one that costs a letter -- geOpen()
     builds the drawing back out of the buffer.

     Not typed into: strokes are pushed and geTools() is what the app calls
     when the pen comes up. That is the road a finger takes. */
  SET.plan = 'pro';
  var glid = LETTERS[0].id;
  function glStored(){ return JSON.stringify((ltById(glid) || {}).st || []); }
  function glDraw(){
    GE.st.push({ pts: [{ x: 100, y: 100 }, { x: 300, y: 300 }] });
    GE.si = GE.st.length - 1;
    geTools();
  }
  function glBtn(){
    var b = document.querySelector('.navtop [data-do="keepPress"]');
    return b ? (b.classList.contains('navon') ? 'gold' : 'grey') : 'none';
  }
  editLetter(glid); render();
  var glWas = glStored();
  out.glArrive = glBtn();
  glDraw();
  out.glDrawn = glBtn();
  out.glWroteWhileDrawing = glStored() !== glWas;
  goTab('build'); render();
  editLetter(glid); render();
  out.glTabKept = geInk(GE.st).length;
  out.glTabBtn = glBtn();
  var glAsked = 0, glNo = null, glPop = popAsk;
  popAsk = function(q, y, yl, nl, n){ glAsked++; glNo = n; };
  back();
  popAsk = glPop;
  out.glAsked = glAsked;
  out.glStayed = here().r === 'glyph';
  glNo();
  out.glNoLeft = here().r !== 'glyph';
  out.glNoWrote = glStored() !== glWas;
  editLetter(glid); render();
  out.glAfterNo = geInk(GE.st).length;
  out.glAfterNoBtn = glBtn();
  glDraw();
  var glSaid = [], glToast = window.toast;
  window.toast = function(m){ glSaid.push(m); };
  popAsk = function(q, y){ y(); };
  back();
  popAsk = glPop; window.toast = glToast;
  out.glYesLeft = here().r !== 'glyph';
  out.glYesWrote = glStored() !== glWas;
  out.glYesSaid = glSaid.length;

  /* ---- 11b. a note opens to be READ ------------------------------------
     「メモ：開いた時は閲覧、右上（今は保存がある所）に「編集」、押すと編集
     できて、そのボタンが「保存」に変わる」 OWNER 2026-09-06. It used to open
     straight into the fields, so somebody opening a note to read it was
     standing in the middle of its body with a Save over it. Two faces now,
     and the buffer belongs to the second: what holds it is that the corner of
     the first is 編集 and NOT the Save. */
  goTab('build'); go('notes'); openNote(0);
  out.ntReadKey = here().r + '|' + (here().a === undefined ? '' : here().a);
  out.ntReadSave = !!document.querySelector('.navtop [data-do="keepPress"]');
  out.ntReadEdit = !!document.querySelector('.navtop [data-do="openNoteEdit"]');
  out.ntReadField = !!document.getElementById('nt-b');
  out.ntReadBody = (document.querySelector('.ntrb') || {}).textContent || '';
  openNoteEdit(0);
  out.ntEditKey = here().r + '|' + (here().a === undefined ? '' : here().a);
  out.ntEditSave = !!document.querySelector('.navtop [data-do="keepPress"]');
  out.ntEditField = !!document.getElementById('nt-b');

  /* ---- 11c. the word order board ---------------------------------------
     「右上に保存（KEEP：置いた並びが開いた時と違えば金、保存で STG.order に
     書く。戻るで「保存しますか」）」 OWNER 2026-09-06. It is here rather than
     in the table above because the table types into a field and this screen
     has none -- what is arranged on it is arranged by pressing cards. The
     button is the same button and the rule is the same rule. */
  window.route = 'gram'; NAV = [{ r:'gram', a:'v2:order' }];
  keepDrop(keepKeyOf('gram', 'v2:order'));
  render();
  var gb = function(){ return document.querySelector('.navtop [data-do="keepPress"]'); };
  out.gordBtn = !!gb();
  out.gordGrey = !!gb() && !gb().classList.contains('navon');
  /* A CARD OUT OF THE TRAY, because that is the first move there is: the board
     opens with nothing on it for a language nobody has answered for
     (「最初から主語と動詞とかが入ってるせいでわかりにくい」 OWNER 2026-09-06),
     so pressing something on the board is a move no arriving screen offers. */
  var gc = document.querySelector('[data-gord="off"] [data-gr]');
  if(gc) gc.click();
  out.gordGold = !!gb() && gb().classList.contains('navon');
  out.gordUnwritten = JSON.stringify(STG.order);
  /* and the arrow asks, because the board differs from what it opened with */
  out.gordAsks = keepDirty(keepKeyOf('gram', 'v2:order'));
  keepDrop(keepKeyOf('gram', 'v2:order'));

  /* ---- 11. viewReset() lets them go ------------------------------------- */
  goTab('profile'); openMe();
  var e2 = document.querySelector('#me-nm');
  e2.value = 'Forgotten'; e2.dispatchEvent(new Event('input', { bubbles: true }));
  out.keptBefore = keepDirty('form|me:');
  viewReset();
  out.keptAfter = keepDirty('form|me:');

  /* ---- 12. nothing answers to both shapes -------------------------------
     Every buffered field on every one of the eight, typed into with the save
     functions of the WHOLE APP watched. Not one of them may fire. A screen
     half converted writes one field on the keystroke and buffers the other,
     which is the shape the decision of 2026-09-03 exists to remove, and it is
     invisible from any one screen. */
  var fired = [], missing = [], real = {};
  var SAVES = ['save', 'saveMe', 'saveLetters', 'saveNotes', 'saveStg', 'saveSnd',
               'saveKb', 'saveWld', 'savePosts'];
  SAVES.forEach(function(n){
    real[n] = window[n];
    window[n] = function(){ fired.push(n); return real[n].apply(null, arguments); };
  });
  function typeOn(sel, v){
    var el = document.querySelector(sel);
    if(!el) return sel;
    el.value = v; el.dispatchEvent(new Event('input', { bubbles: true }));
    return '';
  }
  var lid = LETTERS[0].id, hw = WORDS[0].hw;
  goTab('profile'); openMe();
  ['#me-nm', '#me-hd', '#me-bio', '#me-lc'].forEach(function(s){ missing.push(typeOn(s, 'q')); });
  goTab('build'); go('letter', lid); missing.push(typeOn('#lt-nt', 'q'));
  goTab('profile'); go('world');
  if(abShut('wldov')) abToggle('wldov');
  missing.push(typeOn('#wld-where', 'q'));
  missing.push(typeOn('#wld-who', 'q'));
  if(!wldArts().length) wldArtAdd();
  var aid = wldArts()[wldArts().length - 1].id;
  goTab('profile'); go('world'); go('wldart', aid);
  missing.push(typeOn('#wldart-t', 'q'));
  goTab('build'); go('gram', 'greet');
  missing.push(typeOn('[data-in="stNote"]', 'q'));
  /* The rule is a page of its own, so it is typed into there and not on the
     stage. openStRules() is the door. */
  goTab('build'); go('gram', 'greet'); openStRules('greet');
  missing.push(typeOn('[data-in="stSetRules"]', 'q'));
  goTab('build'); go('notes'); openNote(0); openNoteEdit(0);
  missing.push(typeOn('#nt-t', 'q'));
  missing.push(typeOn('#nt-b', 'q'));
  goTab('build'); go('words'); openEdit(hw);
  missing.push(typeOn('#wd-nt', 'q'));
  missing.push(typeOn('#wd-ety', 'q'));
  goTab('build'); go('kb', '1'); missing.push(typeOn('.kbnm', 'q'));
  SAVES.forEach(function(n){ window[n] = real[n]; });
  out.bothShapes = fired;
  out.fieldsMissing = missing.filter(function(x){ return x; });

  /* ---- 14. a bottom tab throws nothing away -----------------------------
     A tab is not one of the three places a buffer is let go (a save, a No,
     viewReset). So this is not "the question is asked on a tab press too" --
     it is that there is nothing to ask about: what was typed is still in the
     field when you come back to it. */
  viewReset();
  goTab('profile'); openMe();
  var e5 = document.querySelector('#me-nm');
  e5.value = 'Wandered'; e5.dispatchEvent(new Event('input', { bubbles: true }));
  goTab('build'); go('words');
  out.tabAskedOff = popOn();
  popOff();
  goTab('profile'); openMe();
  var e6 = document.querySelector('#me-nm');
  out.tabKept = e6 ? String(e6.value || '') : '';
  /* Written out rather than through saveBtn()/saveOn(): this is a second
     pg.evaluate and those two live in the first one's scope. */
  var tabB = document.querySelector('.navtop [data-do="keepPress"]');
  out.tabBtn = !!tabB;
  out.tabGold = !!tabB && tabB.classList.contains('navon');
  out.tabStored = String(ME.name || '');

  /* ---- 13. an @ the server refuses stays on the screen -------------------
     netHandleFree() is what the profile asks. Answered no here, which is what
     a handle somebody else already has looks like from this phone -- and from
     2026-09-03 it is also what one changed less than fourteen days ago will
     look like (the refusing is profile_rename()'s, in supabase/schema.sql). */
  viewReset();
  goTab('profile'); openMe();
  var atKey = here().r + '|' + here().a;
  var realFree = netHandleFree, realIn = netSignedIn;
  window.netSignedIn = function(){ return true; };
  window.netHandleFree = function(h, ok){ ok(false); };
  var e3 = document.querySelector('#me-hd');
  e3.value = 'takenname'; e3.dispatchEvent(new Event('input', { bubbles: true }));
  back();
  var y1 = document.querySelector('#pop [data-do="popYes"]');
  if(y1) y1.click();
  out.refusedHere = (here().r + '|' + here().a) === atKey;
  out.refusedHandle = String(ME.handle || '');

  window.netHandleFree = function(h, ok){ ok(true); };
  var e4 = document.querySelector('#me-hd');
  if(e4){ e4.value = 'freename'; e4.dispatchEvent(new Event('input', { bubbles: true })); }
  back();
  var y2 = document.querySelector('#pop [data-do="popYes"]');
  if(y2) y2.click();
  out.freeLeft = (here().r + '|' + here().a) !== atKey;
  out.freeHandle = String(ME.handle || '');
  window.netHandleFree = realFree; window.netSignedIn = realIn;

  /* ---- 15. AND WITH NO WIRE, YES DOES NOT LEAVE -------------------------
     「保存ボタン押して保存ができるかできないかは通信の有無だけだからな？」
     「通信エラーなら進むわけねえだろ全部」 OWNER 2026-09-05.

     Every claim above runs with the wire answering, which is the ordinary
     day. This is the other half and it is the half that was wrong: pressed
     with no signal, the Save wrote the phone, said so, and sent the person
     back to the list, with the first request still 1.2 seconds in the future
     and the pop -- when it came -- over a screen they had already left.

     What is asked here is only what a person would see: they are still on
     their letter, and the app has told them why. What they typed is still in
     the field, so pressing again sends it again. */
  viewReset(); popOff();
  window.WIRE = false;
  goTab('build'); go('letter', LETTERS[0].id);
  var deadKey = here().r + '|' + here().a;
  var e7 = document.querySelector('#lt-nt');
  if(e7){ e7.value = 'written in a tunnel'; e7.dispatchEvent(new Event('input', { bubbles: true })); }
  back();
  var y3 = document.querySelector('#pop [data-do="popYes"]');
  if(y3) y3.click();
  out.deadStayed = (here().r + '|' + here().a) === deadKey;
  out.deadSaid = popOn();
  out.deadTyped = (function(){ var e = document.querySelector('#lt-nt');
                               return e ? String(e.value || '') : ''; })();
  window.WIRE = true;
  popOff(); viewReset();

  /* ---- THE OTHER BUTTON IN THAT CORNER ---------------------------------
     「なにもない時は薄い灰色、何か打ったら金にする」「これが決定ボタンの
     ルール」 OWNER 2026-09-03, and that is said of the BUTTON rather than of
     one spelling of it. A sheet that CHANGES a word carries the Save the walk
     at the foot of this file holds; a sheet that MAKES one carries 「追加」,
     which is not a save and says so (www/wordsheet.js § wdSaveBtn). The walk
     keeps a screen by finding `keepPress` in its bar, so nothing in this file
     had ever looked at the other one.

     IT WAS GREY ON EVERY KEYSTROKE. wdKeepTouch() is the one notice a field
     being typed into gives -- typing must not rebuild the sheet, because a
     field being typed into loses the keyboard the moment the page under it is
     replaced -- and it returned early on `addW`, which IS the sheet that
     makes a word. So the one field that decides whether 「追加」 can be
     pressed was the one field the button said nothing about, and a render put
     the grey one back as well: what a form has in its corner is a string
     taken when the form was OPENED (FORM.right, www/home.js § openForm).

     NAMED HERE RATHER THAN FOLDED INTO THE WALK, and that is measured rather
     than preferred. Widening the walk's test from 「a Save」 to 「any .navdo
     in the bar」 keeps nine more screens, and on seven of them the corner
     button is an ACTION -- 編集, ＋, a word added, a keyboard added -- which
     is gold from the moment it is drawn, correctly, and the rule above is not
     about it. No class tells a decision from an action.
     docs/scope/r17-keep2.md carries that measurement. */
  function addBtnOn(){
    var e = document.querySelector('.navtop [data-do="addOne"]');
    return !e ? 'gone' : (e.classList.contains('navon') ? 'gold' : 'grey');
  }
  goTab('build'); openAdd(''); render();
  out.addArrive = addBtnOn();
  var wln = document.getElementById('wd-ln');
  wln.value = 'ka'; wln.dispatchEvent(new Event('input', { bubbles: true }));
  out.addTyped = addBtnOn();
  /* What the screen's own answer is, so the two are compared rather than the
     colour being asserted on its own: a button that was gold for a reason
     that is not this one would pass that. */
  out.addWould = !!wdAddOn();
  /* AND A RENDER LEAVES IT WHERE IT IS. The corner of a form is not rebuilt
     by render(), so a paint that happened and a paint that survives are two
     claims, and the second is the one somebody actually sees. */
  render();
  out.addRendered = addBtnOn();
  wln = document.getElementById('wd-ln');
  wln.value = ''; wln.dispatchEvent(new Event('input', { bubbles: true }));
  out.addRubbed = addBtnOn();
  out.addWouldNot = !!wdAddOn();
  /* AND IT WROTE NOTHING. 「打ったら覚える、ボタンが書く」 -- a word typed
     onto a sheet that makes one is not a word until 「追加」 is pressed. */
  out.addMade = !!findWord('ka');
  closeSheet({ target: { id: 'sbg' } });

  return out;
});

/* ---- EVERY SCREEN WITH A SAVE, AND EVERYTHING THAT CAN BE CHANGED ON IT --
   OWNER 2026-09-10: 「書き換えてもセーブボタン光らないとこ多いからこれも
   一本化してね」.

   Everything above this line walks EIGHT screens, named in a list, and asks
   about the one thing that is TYPED on each. That list is why the fault the
   owner is describing was invisible: a change made by PRESSING -- a row of
   the article added, a section, 「may this be taken away」, the word order's
   swap, which keyboard goes to the phone, ROUND on a drawn letter -- is on
   none of those eight fields, and eleven of them left the Save grey with the
   language changed under it (docs/scope/r14-keep.md, measured 2026-09-10).

   So this asks the PAGE instead. Every route in PAGES with every argument it
   takes, and every open* form, is stood on for real; the ones that put a Save
   in the bar are the screens this is about, and every button on each of them
   is pressed. Nothing is named here, so a screen written tomorrow is walked
   the day it is written -- which is the one fault docs/DATA_SAFETY.md names
   by name: a list of keys, written by hand, that nobody remembered to add to.

   THREE CLAIMS, AND THE FIRST TWO ARE THE PAIR.

     A  every screen with a Save answers with a FUNCTION. A screen that hands
        over a value instead is one whose Save can never light for anything
        but typing, which is the shape this replaced
     B  press a button. If the screen stays and what its own now() answers has
        MOVED, the Save is GOLD; if now() has not moved, the Save is GREY.
        Both directions and no list: a selection -- a row of the keyboard, a
        folded section, a card lifted -- does not move now() and therefore has
        to stay grey, and that is C in the table asked without naming one of
        them
     C  and a press that changes the LANGUAGE moves now(). B alone would go
        green on exactly the bug this was written after: setGPos() wrote STG
        and the board's now() did not carry it, so nothing moved, the button
        stayed grey, and the wiring was perfect

   WHY B IS NOT A COPY OF keepDirty(). This takes its own reading of the
   screen's now() before and after, and then asks what COLOUR the button in
   the bar is. What is between those two is everything that actually broke:
   whether the buffer is filed under the screen in front of somebody (the
   keyboard's kbShow against its route), whether the bar was repainted at all
   (the word sheet's wdPaint, which rebuilt the sheet and left the corner as
   it was), and whether the screen registered a buffer in the first place.
   keepDirty()'s own comparison is what the eight-screen walk above holds.

   THE ONE NAMED EXCEPTION TO C, and it is a baseline in box-check's sense:
   an entry that stops being true FAILS, so the list cannot rot into
   permission. setMyFont writes SET -- this person's setting, the same on
   every language -- and netPrefsPut() sends it on the press, so it has a road
   of its own and a Save that lit for it would be offering to send a thing
   that has already gone. docs/scope/r14-keep.md § D.

   AND THE FIELDS, ASKED THE SAME WAY. Every [data-in] on every one of those
   screens: type into it and the Save goes gold, put back what it held and it
   goes grey again. The second half is the one worth having -- it is false
   exactly when the screen's now() does not answer that field, so a field
   somebody wires to keepSet() and forgets to put in now() is caught here
   rather than by a person noticing the Save never goes out again. */
const walk = await pg.evaluate(({ s }) => {
  eval('window.__seed = (' + s + ')');
  const seedAgain = window.__seed;
  seedAgain();
  SET.walked = true; SET.plan = 'pro';
  const out = { stands: [], fails: [], fields: 0, presses: 0, gold: 0, refused: 0, lit: 0 };

  langRowGot(langId); langStore();
  netSend = function(method, path, body, tok, ok){
    ok(String(path).indexOf('/rest/v1/language?') === 0 ? [{ id: 'srv-known' }] : []);
  };

  /* A change to the LANGUAGE, and to nothing else. slMine() is the app's own
     answer to 「what is this phone holding」 (www/core.js). */
  function all(){
    var keys = [], i, k, acc = '';
    for(i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    for(k in LSL) if(Object.prototype.hasOwnProperty.call(LSL, k) && keys.indexOf(k) < 0) keys.push(k);
    keys.sort();
    for(i = 0; i < keys.length; i++) acc += keys[i] + '=' + slMine(keys[i]) + ';';
    return acc;
  }
  function saveBtn(){ return document.querySelector('.navtop [data-do="keepPress"]'); }
  function saveOn(){ var b = saveBtn(); return !!b && b.classList.contains('navon'); }
  function whereAmI(){ return here().r + '|' + (here().a === undefined ? '' : here().a); }
  function nowSig(){ try { return JSON.stringify(keepNow(keepKey())); } catch(e){ return 'threw'; } }
  function acts(){
    var a = document.getElementById('app'), sh = document.getElementById('sheet'), l;
    l = a ? Array.prototype.slice.call(a.querySelectorAll('[data-do],[data-ch]')) : [];
    if(sh && sh.className.indexOf('on') >= 0)
      l = l.concat(Array.prototype.slice.call(sh.querySelectorAll('[data-do],[data-ch]')));
    return l;
  }
  function fields(){
    var a = document.getElementById('app');
    return a ? Array.prototype.slice.call(a.querySelectorAll('[data-in]')) : [];
  }

  /* Every route and every argument it takes, asked of the page. The three
     that are read off the app rather than guessed are the same three
     act-check and i18n-check read. */
  const argsOf = (r) =>
    r === 'set'  ? [null].concat(SETS.map(x => x.id)) :
    r === 'gram' ? [null].concat(gramArgs()) :
    r === 'fm'   ? ['tira'] :
    [null];
  const lid = LETTERS[0].id, hw = WORDS[0].hw;
  const opens = Object.keys(window).filter(k =>
    /^open[A-Z]/.test(k) && typeof window[k] === 'function' && k !== 'openForm');

  const STANDS = [];
  Object.keys(PAGES).forEach(function(r){
    argsOf(r).forEach(function(a){
      var arg = a;
      if(arg === null){ if(r === 'letter') arg = lid; if(r === 'word') arg = hw; }
      STANDS.push([r + (arg ? ':' + arg : ''),
                   function(){ go(r, arg === null ? undefined : arg); }]);
    });
  });
  /* The four screens a route alone does not reach: a keyboard needs one to
     have been built, a section of the article needs a section, a stage's rule
     page needs a stage, and a form rule needs a draft. */
  STANDS.push(['kb:1', function(){
    if(kbBoards().length < 2){ KB = null; kbShow = 0; kbAdd('qwerty'); }
    goTab('build'); go('kb', '1'); }]);
  STANDS.push(['wldart', function(){
    wldArtAdd(); goTab('profile'); go('world');
    go('wldart', wldArts()[wldArts().length - 1].id); }]);
  STANDS.push(['form strule', function(){ goTab('build'); go('gram', 'greet'); openStRules('greet'); }]);
  STANDS.push(['form fmr', function(){ goTab('build'); go('words'); fmrNew('v', 'pst'); }]);
  /* AN OPENER TAKES WHAT IT TAKES, AND THE PAGE SAYS WHICH. Every one of
     these was handed the WORD, and the ones that want a LETTER -- the sound
     chart, the borrowed character -- were handed a headword, said ltById()
     knows no such letter, and opened nothing. The stand then had no Save in
     its bar and was skipped, in silence, by a walk whose whole argument is
     that it names no screen: two of the six screens the owner reported on
     2026-09-11 were invisible here for that reason alone.

     A LIST OF WHICH OPENER WANTS WHICH IS THE FAULT docs/DATA_SAFETY.md NAMES
     BY NAME -- a list of keys somebody has to remember to add to. So it is
     asked instead: try the word, and where no form came up, try the letter. */
  opens.forEach(function(o){
    STANDS.push(['form ' + o, function(){
      if(!window[o].length){ window[o](); return; }
      window[o](hw);
      if(here().r === 'form') return;
      window[o](lid);
    }]);
  });

  /* WRITTEN DOWN FIRST, and before the screen is stood on. The fixture builds
     WORDS and SET in memory, so the first save() of a run flushes all of it --
     and a press that merely CALLS save() then looks exactly like a press that
     changed something. Claim C is about what changed, so the phone starts
     each press already holding everything. */
  function flush(){ try { save(); langSaveAll(); } catch(e){} }
  function stand(go1){
    seedAgain(); SET.walked = true; SET.plan = 'pro';
    langRowGot(langId); langStore();
    flush();
    try { popOff(); } catch(e){}
    try { closeSheet({ target: { id: 'sbg' } }); } catch(e){}
    try { goTab('build'); go1(); } catch(e){ return false; }
    try { render(); } catch(e){ return false; }
    return true;
  }

  /* ---- EVERY PRESS THAT WRITES THE PHONE, AND WHY --------------------
     「打ったら覚える、ボタンが書く」 OWNER 2026-09-03. On a screen that has a
     Save, a press is meant to remember and the Save is meant to write, so
     this list is the exceptions and it is a BASELINE in box-check's sense:
     each line says which of the two kinds it is, an entry nothing reaches any
     more fails below, and a NEW name fails until somebody writes down which
     it is. Taking a line out is progress and needs nobody.

     There are two kinds and the second is not permission:

       its own road -- the press is RIGHT to write, because what it changes
       is not what this screen's Save writes. The Save stays grey and
       docs/scope/r14-keep.md § D is the measurement.

       not moved yet -- the press writes the language AND now() carries it,
       so the corner does go gold and nothing is lost. It is still two roads
       to one change where the owner asked for one 「打ったら覚える、ボタンが
       書く」, and r14 stopped at making the corner light. Each of these is a
       screen still to be moved onto the buffer. */
  const OWN_ROAD = {
    setMyFont:    'its own road -- SET.myfont, netPrefsPut() sends it on the press',
    g2Move:       'not moved yet -- setGPos() writes STG on the drop (r14 § A)',
    wldOvAdd:     'not moved yet -- a row of the article is written on the press (r14 § A)',
    setWldSecDl:  'not moved yet -- 「may this section be taken away」 is written on the press (r14 § A)',
    kbUndo:       'not moved yet -- the step back writes the layout (r14 § B)',
    kbRedo:       'not moved yet -- the step forward writes the layout (r14 § B)',
    kbAddLay:     'not moved yet -- a layer is written on the press (r14 § B)'
  };
  const roadSeen = {};
  /* WHICH FIELD A KEYSTROKE WENT INTO. Taken from the real keepSet() rather
     than worked out from the handler's name, which is a mapping this file
     would have to keep -- and a check that recomputes the thing under test is
     a copy of it. */
  const keepSetSaw = [];
  const realKeepSet = keepSet;
  window.keepSet = function(f, v){ keepSetSaw.push(String(f)); return realKeepSet(f, v); };

  for(var i = 0; i < STANDS.length; i++){
    var lab = STANDS[i][0], go1 = STANDS[i][1];
    if(!stand(go1)) continue;
    if(!saveBtn()) continue;                       /* no Save: not this screen */
    var b = KEEP[keepKey()], rec = { n: lab, key: whereAmI(), fields: 0, presses: 0 };

    /* A -- it answers with a function */
    if(!b || typeof b.now !== 'function')
      out.fails.push(lab + ': a Save in the bar over a screen that hands no now()');
    if(saveOn()) out.fails.push(lab + ': a GOLD Save on arrival');

    /* the fields, from the page */
    var fs = fields();
    for(var f = 0; f < fs.length; f++){
      if(!stand(go1)) break;
      var ff = fields(); if(f >= ff.length) break;
      var was = String(ff[f].value || ''), nm = ff[f].getAttribute('data-in');
      var saw0 = keepSetSaw.length;
      flush();
      var sig0 = nowSig(), allF = all();
      ff[f].value = was + 'zq'; ff[f].dispatchEvent(new Event('input', { bubbles: true }));
      /* A FIELD MAY REFUSE THE KEYSTROKE, and one does: the link on the
         profile puts back what it held for anything that is not the shape of
         a URL (www/me.js § meSetLink), 「通らなかった打鍵は無かったことに
         する」. Nothing was typed, so there is nothing here to claim -- and
         it is counted rather than skipped in silence, because a field that
         starts refusing everything would otherwise leave this walk looking
         exactly as green as it does now. */
      if(String(ff[f].value || '') === was){ out.refused++; continue; }
      /* AND WHAT IT WROTE IS A FIELD now() ALREADY ANSWERS. keepSet() is the
         one road into the half that is not written down (www/shell.js
         § keepOn), and the two halves are merged by name -- so a field wired
         to keepSet() under a name now() does not carry is a field whose value
         is never read back out of the language. What somebody sees is an
         empty box on a letter that has a note on it, and BOTH assertions
         below stay green through it: the box arrives empty, typing turns the
         Save gold, and emptying it again turns it grey. Watched: with `nt`
         taken out of the letter's now() this walk was green until this
         claim was written. */
      /* only what THIS keystroke wrote: a field whose handler does not go
         through keepSet at all (the word sheet writes wEdit and repaints)
         pushes nothing, and reading the last name pushed would be reading
         some other screen's */
      var wrote1 = keepSetSaw.length > saw0 ? keepSetSaw[keepSetSaw.length - 1] : '';
      if(wrote1 && !Object.prototype.hasOwnProperty.call(keepRead(KEEP[keepKey()].now), wrote1))
        out.fails.push(lab + ': ' + nm + ' writes the field 「' + wrote1 + '」 and now() does not ' +
                       'answer it -- what the language holds would never reach the box');
      /* GOLD IFF now() MOVED -- the same sentence the buttons below are
         asked, said about a field. It used to be 「every field turns the Save
         gold」, which is a statement that every box on a screen with a Save is
         a box of the thing being saved. That was true of twenty-four screens
         because not one of them had a SEARCH box on it, and it stopped being
         true the day the sound chart got a Save: the chart is a hundred and
         sixty tiles and a box to find one with, and what is typed in that box
         is not the letter. A claim that is true of every screen for a reason
         that is not the claim is a lying proxy, and it fails on the first
         screen that is merely different. */
      var moved1 = nowSig() !== sig0, lit = saveOn();
      var ff2 = fields();
      if(f < ff2.length){
        ff2[f].value = was; ff2[f].dispatchEvent(new Event('input', { bubbles: true }));
      }
      var backSig = nowSig(), backGold = saveOn();
      if(moved1 && !lit) out.fails.push(lab + ': typing into ' + nm + ' changed what the screen holds' +
                                        ' and left the Save grey');
      if(!moved1 && lit) out.fails.push(lab + ': typing into ' + nm + ' turned the Save gold and the' +
                                        ' screen holds what it held');
      if(moved1 && backSig === sig0 && backGold)
        out.fails.push(lab + ': ' + nm + ' put back the way it was and the Save stayed gold' +
                       ' -- now() does not answer that field');
      /* AND A FIELD THAT WRITES THE LANGUAGE ON THE KEYSTROKE, which is claim
         C below asked of a box instead of a button. 「打ったら覚える、ボタンが
         書く」 OWNER 2026-09-03: a keystroke writes nothing, ever. */
      if(all() !== allF)
        out.fails.push(lab + ': typing into ' + nm + ' wrote the phone -- a keystroke writes nothing');
      if(moved1) out.lit++;
      rec.fields++; out.fields++;
    }

    /* the buttons, from the page */
    var n = acts().length;
    for(var j = 0; j < n; j++){
      if(!stand(go1)) break;
      var els = acts(); if(j >= els.length) break;
      var name = els[j].getAttribute('data-do') || els[j].getAttribute('data-ch');
      if(name === 'keepPress' || name === 'back') continue;
      flush();
      var sigWas = nowSig(), allWas = all(), whereWas = whereAmI();
      try { els[j].click(); } catch(e){ try { popOff(); } catch(e2){} continue; }
      if(whereAmI() !== whereWas){ try { popOff(); } catch(e){} continue; }  /* it went somewhere */
      if(typeof popOn === 'function' && popOn()){ popOff(); continue; }      /* it asked first */
      var moved = nowSig() !== sigWas, gold = saveOn(), wrote = all() !== allWas;
      rec.presses++; out.presses++;
      if(moved) out.gold++;
      /* B, both ways */
      if(moved && !gold)
        out.fails.push(lab + ' -> ' + name + ': the screen changed and the Save stayed grey');
      if(!moved && gold)
        out.fails.push(lab + ' -> ' + name + ': the Save went gold and the screen is what it was');
      /* C -- AND A PRESS WRITES NOTHING. 「打ったら覚える、ボタンが書く」
         OWNER 2026-09-03, said about a button instead of a box.

         This asked 「wrote the phone AND now() says nothing changed」, and
         that is half of it: a press that writes the language AND carries it
         in now() turns the corner gold and reads, from here, exactly like a
         press that merely remembered. Watched -- with ltTakeSnd put back to
         the way it wrote the letter on the touch, every claim in this file
         was green, because now() reads the letter and the letter had indeed
         moved. A Save over a screen that has already written is a button
         with nothing left to do and an arrow with nothing left to ask.

         OWN_ROAD is what a press that writes is allowed to be, and it is a
         baseline in box-check's sense: named, held both ways, and a line
         that stops being reached fails below. */
      if(wrote){
        if(!OWN_ROAD[name])
          out.fails.push(lab + ' -> ' + name + ': it wrote the phone' +
                         (moved ? ' -- a press on a screen with a Save remembers; the Save writes'
                                : ' and the screen says nothing changed' +
                                  ' -- now() does not carry what it changed'));
        else roadSeen[name] = 1;
      }
      try { popOff(); } catch(e){}
    }
    out.stands.push(rec);
  }
  /* the baseline both ways: an entry nothing reaches any more is a line that
     outlived what it described */
  for(var k in OWN_ROAD){
    if(!roadSeen[k])
      out.fails.push('OWN_ROAD names ' + k + ' (' + OWN_ROAD[k] + ') and nothing on any screen ' +
                     'writes the phone through it any more -- delete the line');
  }
  return out;
}, { s: seed.toString() });

await br.close();

const fails = r.fails.slice();
if(!sw.asked) fails.push('the left-edge swipe went back without asking');
if(sw.here !== r.swipeKey) fails.push('the left-edge swipe left the screen while the question was up');
if(sw.moved !== r.swipeBefore) fails.push('the left-edge swipe moved something on the phone');
if(more.kbSavesWhileTyping !== 0) fails.push('typing a keyboard name called saveKb ' + more.kbSavesWhileTyping + ' times');
if(more.kbStepsWhileTyping !== 0) fails.push('typing a keyboard name stacked ' + more.kbStepsWhileTyping + ' steps to go back through');
if(more.kbSavesOnSave !== 1) fails.push('one save was ' + more.kbSavesOnSave + ' writes, not one');
if(more.kbName !== 'one') fails.push('the keyboard name did not land: ' + more.kbName);
if(!more.kbDropList) fails.push('deleting a keyboard opened a board instead of the list');
if(!more.kbKeyOne) fails.push('the keyboard is written under one key and read under another');
if(more.kbGoldAfterDrop) fails.push('deleting a keyboard left the Save gold on the one that took its place');
if(!more.kbRowWent) fails.push('the row the bin was pressed on is still there');
if(!more.kbGoldOnChange) fails.push('a row taken out of the layout left the Save grey');
if(more.kbBufs !== 1) fails.push('one keyboard screen kept ' + more.kbBufs + ' buffers');
if(!more.kbAsked) fails.push('back off a changed keyboard asked nothing');
if(more.glArrive !== 'grey') fails.push('the drawing screen opened with its Save ' + more.glArrive);
if(more.glDrawn !== 'gold') fails.push('a stroke drawn left the Save ' + more.glDrawn);
if(more.glWroteWhileDrawing) fails.push('drawing wrote the letter with nobody having saved');
if(more.glTabKept !== 2) fails.push('a bottom tab lost the drawing: ' + more.glTabKept + ' strokes came back');
if(more.glTabBtn !== 'gold') fails.push('coming back to a drawing left the Save ' + more.glTabBtn);
if(more.glAsked !== 1) fails.push('back off a changed drawing asked ' + more.glAsked + ' times');
if(!more.glStayed) fails.push('back off a changed drawing left the screen while the question was up');
if(!more.glNoLeft) fails.push('No did not leave the drawing screen');
if(more.glNoWrote) fails.push('No wrote the drawing onto the letter');
if(more.addArrive !== 'grey') fails.push('the sheet that makes a word opened with 追加 ' + more.addArrive);
if(!more.addWould) fails.push('a spelling typed onto a new word sheet and addOne() would still refuse it');
if(more.addTyped !== 'gold') fails.push('a spelling typed onto a new word sheet left 追加 ' + more.addTyped);
if(more.addRendered !== 'gold') fails.push('a render put 追加 back to ' + more.addRendered + ' over a sheet holding a word');
if(more.addWouldNot) fails.push('the spelling was rubbed out and addOne() would still take it');
if(more.addRubbed !== 'grey') fails.push('the spelling rubbed out left 追加 ' + more.addRubbed);
if(more.addMade) fails.push('typing a spelling onto a new word sheet wrote the word');
if(more.glAfterNo !== 1) fails.push('No did not let the drawing go: ' + more.glAfterNo + ' strokes came back');
if(more.glAfterNoBtn !== 'grey') fails.push('after No the Save was ' + more.glAfterNoBtn);
if(!more.glYesLeft) fails.push('Yes did not leave the drawing screen');
if(!more.glYesWrote) fails.push('Yes did not write the drawing onto the letter');
if(more.glYesSaid !== 1) fails.push('Yes said it ' + more.glYesSaid + ' times, not once');
if(!more.keptBefore) fails.push('typing into the profile left nothing to save');
if(more.keptAfter) fails.push('viewReset() kept what had been typed');
if(more.fieldsMissing.length) fails.push('fields not on their screens: ' + more.fieldsMissing.join(', '));
if(more.bothShapes.length) fails.push('typing still wrote through: ' + more.bothShapes.join(', '));
if(!more.refusedHere) fails.push('a refused @ went back anyway');
if(more.refusedHandle === 'takenname') fails.push('a refused @ was written down');
if(more.tabAskedOff) fails.push('a bottom tab put the question up');
if(more.tabKept !== 'Wandered') fails.push('a bottom tab threw away what was typed: ' + JSON.stringify(more.tabKept));
if(!more.tabBtn) fails.push('coming back to a screen with typing on it had no Save in the bar');
if(!more.tabGold) fails.push('coming back to a screen with typing on it, the Save was not gold');
if(more.tabStored === 'Wandered') fails.push('a bottom tab saved what was typed');
if(!more.freeLeft) fails.push('an @ the server allowed did not go back');
if(more.freeHandle !== 'freename') fails.push('an @ the server allowed was not written down');
for(const d of r.dead){
  if(d.value !== d.was)
    fails.push(d.n + ': a save that did not land changed the phone anyway (' +
               JSON.stringify(d.was) + ' -> ' + JSON.stringify(d.value) + ')');
  if(d.moved)
    fails.push(d.n + ': a save that did not land moved something on the phone');
  if(!d.dirty)
    fails.push(d.n + ': a save that did not land let go of what was typed');
  /* AND IT IS STILL IN THE FIELD, asked of every screen whose buffer IS its
     fields. The word sheet is the one that is not -- its buffer is the sheet
     said once (`w`, wdSigEdit in www/wordsheet.js), what was typed is in
     `wEdit`, and the fields are redrawn from the form built when the sheet
     was opened. `dirty` above is what says the typing is still there on that
     one; the field reverting on a press is a fault of its own and is older
     than this walk -- it does the same with the bug this claim was written
     for put back. */
  if(d.n !== "a word's sheet" && d.field !== d.typed)
    fails.push(d.n + ': a save that did not land lost what was typed: ' +
               JSON.stringify(d.field));
}
if(!more.gordBtn) fails.push('the word order board has no Save in the corner');
if(!more.gordGrey) fails.push('the word order board arrived with the Save already gold');
if(!more.gordGold) fails.push('a card was moved on the word order board and the Save stayed grey');
if(!more.gordAsks) fails.push('a card was moved and the board says nothing has changed, so the arrow would not ask');
if(more.ntReadSave) fails.push('a note opened to be read and the Save was already in the corner');
if(!more.ntReadEdit) fails.push('a note opened to be read with no way on to the writing face');
if(more.ntReadField) fails.push('the reading face of a note is a field to type into');
if(!more.ntReadBody) fails.push('the reading face of a note showed nothing of it');
if(!more.ntEditSave) fails.push('the writing face of a note has no Save in the corner');
if(!more.ntEditField) fails.push('the writing face of a note has no field to type into');
if(more.ntReadKey === more.ntEditKey)
  fails.push('the two faces of a note are one screen: ' + more.ntReadKey);
if(!more.deadStayed) fails.push('a save with no wire went back anyway');
if(!more.deadSaid) fails.push('a save with no wire went nowhere and said nothing');
if(more.deadTyped !== 'written in a tunnel') fails.push('a save with no wire threw away what was typed: ' + JSON.stringify(more.deadTyped));

walk.fails.forEach((m) => fails.push(m));
console.log('the sheet that makes a word: 追加 grey on arrival, gold on a spelling typed, ' +
            'gold still after a render, grey again when it is rubbed out, and no word written');
console.log('every screen with a Save (' + walk.stands.length + '), asked of the page: ' +
            walk.fields + ' fields typed into and put back (' + walk.lit +
            ' of them changed what the screen holds and turned the corner gold; ' + walk.refused +
            ' refused the keystroke), ' + walk.presses + ' buttons pressed, ' +
            walk.gold + ' of them changed the screen and every one turned the corner gold -- ' +
            'and every press that left it as it was left the Save grey');

r.screens.forEach((s) => {
  console.log('  ' + s.n + ' (' + s.key + ')');
});
console.log('the screens that take typing: ' + r.screens.length + ' walked, and on each of them ' +
            'the Save stood there grey, typing wrote nothing and turned it gold, putting the typing ' +
            'back turned it grey again, back asked, No kept nothing, Yes wrote it');
console.log('the left-edge swipe: same question, same road (back())');
console.log('the keyboard: ' + more.kbSavesWhileTyping + ' writes while typing, ' +
            more.kbStepsWhileTyping + ' steps stacked, ' + more.kbSavesOnSave + ' write on save');
console.log('the keyboard, one key: deleting a board lands on the list, and the board '  +
            'walked into after it keeps ' + more.kbBufs + ' buffer with the Save grey; ' +
            'a row taken turns it gold and the arrow asks');
console.log('the letter being drawn: grey on arrival, gold on a stroke, nothing written until ' +
            'Yes; a bottom tab kept the drawing, No let it go and wrote nothing, Yes wrote it ' +
            'and said so once');
console.log('the word order board: the Save stood there grey, a card moved turned it gold, ' +
            'and nothing was written until it was pressed (STG.order was still ' +
            more.gordUnwritten + ')');
console.log('a note opens to be read (' + more.ntReadKey + '): 編集 in the corner and no Save, ' +
            'and 編集 goes to ' + more.ntEditKey + ', which has the field and the Save');
console.log('viewReset(): lets what was typed go');
console.log('one shape only: ' + more.bothShapes.length + " of the app's nine save functions " +
            'fired while somebody was typing');
console.log('a bottom tab: threw nothing away and asked nothing -- ' +
            'what was typed was still in the field on the way back');
console.log('the @: refused stays put (' + more.refusedHandle + '), allowed goes (' +
            more.freeHandle + ')');
console.log('no wire: the Yes stayed on the screen, said why, and kept what was typed');
console.log('no wire: ' + r.dead.length + ' screens saved, and not one of them moved ' +
            'anything on the phone -- the server goes first');

if(fails.length){
  console.error('\nFAILED (' + fails.length + '):');
  fails.forEach((m) => console.error('  ' + m));
  process.exit(1);
}
console.log('\ntyping remembers, the button writes, and leaving asks -- on every screen that takes typing.');
