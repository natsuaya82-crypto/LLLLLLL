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

     1  typing writes NOTHING -- localStorage is byte-identical afterwards
     2  a screen with fields has a Save in the bar from the moment it opens,
        and with nothing changed it is PALE GREY
     3  one keystroke turns that same Save GOLD, and nothing was rendered to
        do it -- the button is still there, it changed colour where it stood
     4  back() off an untouched screen leaves, and asks nothing
     5  back() off a changed screen ASKS, and does not leave
     6  No leaves, and localStorage is byte-identical to before the typing
     7  Yes leaves, and the value is on the phone

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
    14  a bottom tab is not an answer. Walking off a screen with something typed
        on it and coming back finds it still there, still unsaved, with the
        Save still in the bar AND STILL GOLD -- nothing is thrown away without
        somebody having said so

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
  SET.done = true; SET.plan = 'pro';
  var out = { screens: [], fails: [] };

  /* EVERYTHING ON THE PHONE, AS ONE STRING. This is what "not one byte moved"
     is asked of, rather than one slice by name: a save that wrote the wrong
     slice would pass a check that only looked at the right one. */
  function all(){
    var keys = [], i, acc = '';
    for(i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    keys.sort();
    for(i = 0; i < keys.length; i++) acc += keys[i] + '=' + localStorage.getItem(keys[i]) + ';';
    return acc;
  }
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
    { n: 'a grammar stage',
      go: function(){ goTab('build'); go('gram', 'neg'); },
      sel: '[data-in="stSetRules"]', v: 'it goes after the verb',
      read: function(){ return String((STG.rules && STG.rules.neg) || ''); } },
    { n: 'a note',
      go: function(){ goTab('build'); go('notes'); openNote(0); },
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

    /* 7 -- Yes leaves, and the value is on the phone */
    sc.go();
    type(sc.sel, sc.v);
    back();
    clickSel('#pop [data-do="popYes"]');
    res.yesLeft = (whereAmI() !== key);
    res.yesStored = (sc.read() === sc.v);
    res.yesOnDisk = (all().indexOf(sc.v) >= 0);

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
    if(!res.yesOnDisk) fail(sc.n + ': Yes wrote it to no key on the phone');
    out.screens.push(res);
  }

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
       moved: (function(){
         var keys = [], i, acc = '';
         for(i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
         keys.sort();
         for(i = 0; i < keys.length; i++) acc += keys[i] + '=' + localStorage.getItem(keys[i]) + ';';
         return acc;
       })() });
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
  goTab('build'); go('gram', 'neg');
  missing.push(typeOn('[data-in="stSetRules"]', 'q'));
  missing.push(typeOn('[data-in="stNote"]', 'q'));
  goTab('build'); go('notes'); openNote(0);
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
  return out;
});

await br.close();

const fails = r.fails.slice();
if(!sw.asked) fails.push('the left-edge swipe went back without asking');
if(sw.here !== r.swipeKey) fails.push('the left-edge swipe left the screen while the question was up');
if(sw.moved !== r.swipeBefore) fails.push('the left-edge swipe moved something on the phone');
if(more.kbSavesWhileTyping !== 0) fails.push('typing a keyboard name called saveKb ' + more.kbSavesWhileTyping + ' times');
if(more.kbStepsWhileTyping !== 0) fails.push('typing a keyboard name stacked ' + more.kbStepsWhileTyping + ' steps to go back through');
if(more.kbSavesOnSave !== 1) fails.push('one save was ' + more.kbSavesOnSave + ' writes, not one');
if(more.kbName !== 'one') fails.push('the keyboard name did not land: ' + more.kbName);
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

r.screens.forEach((s) => {
  console.log('  ' + s.n + ' (' + s.key + ')');
});
console.log('the screens that take typing: ' + r.screens.length + ' walked, and on each of them ' +
            'the Save stood there grey, typing wrote nothing and turned it gold, putting the typing ' +
            'back turned it grey again, back asked, No kept nothing, Yes wrote it');
console.log('the left-edge swipe: same question, same road (back())');
console.log('the keyboard: ' + more.kbSavesWhileTyping + ' writes while typing, ' +
            more.kbStepsWhileTyping + ' steps stacked, ' + more.kbSavesOnSave + ' write on save');
console.log('viewReset(): lets what was typed go');
console.log('one shape only: ' + more.bothShapes.length + " of the app's nine save functions " +
            'fired while somebody was typing');
console.log('a bottom tab: threw nothing away and asked nothing -- ' +
            'what was typed was still in the field on the way back');
console.log('the @: refused stays put (' + more.refusedHandle + '), allowed goes (' +
            more.freeHandle + ')');

if(fails.length){
  console.error('\nFAILED (' + fails.length + '):');
  fails.forEach((m) => console.error('  ' + m));
  process.exit(1);
}
console.log('\ntyping remembers, the button writes, and leaving asks -- on every screen that takes typing.');
