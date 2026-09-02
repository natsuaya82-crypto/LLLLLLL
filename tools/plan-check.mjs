/* A plan decides what a person may DO, and decides nothing about what exists.
   ---------------------------------------------------------------------
   This is CLAUDE.md's money rule, asked of the code:

     「無料に落ちても、バックアップも復元も、誰の言語の一バイトも
       支払いに依存しない。そして『プランがわからない』が
       『この人にはデータが無い』と同じ枝を通ってはいけない」

   Nothing here can throw. A plan that quietly takes a slice with it, a
   dictionary that comes back a hundred words long after a subscription ends,
   a backup that refuses on the free plan -- every one of those renders, tests
   green with one person on one plan, and is found by somebody whose card
   expired.

   `dead-check` already holds the SHAPE of the table: every capability in CAN
   is asked for by name, every can() names one that exists, has() is core.js's
   alone. What it cannot ask is what happens to somebody's words when the
   answer changes. That is this.

   Run: node tools/plan-check.mjs                                        */
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
  SET.done = true;
  var out = {};

  /* Everything this language is, as bytes, exactly as localStorage holds it.
     SLICES and not a list written out here: a tenth slice added to core.js
     and forgotten is a slice this check would stop looking at. */
  function bytes(){
    var o = {}, i;
    for (i = 0; i < SLICES.length; i++) o[SLICES[i]] = localStorage.getItem(langKey(SLICES[i]));
    o['@langs'] = localStorage.getItem('lingua.langs');
    return JSON.stringify(o);
  }
  function same(a, b){ return a === b; }

  /* ---- 1. a dictionary bigger than the free plan's ceiling -------------
     Five hundred words made on the paid plan, and then the plan ends. The
     LIST is a hundred; the LANGUAGE is five hundred, and every one of them is
     still in storage. This is the fault the whole file is about: the two are
     one line apart in words.js and nothing else in the app would look wrong
     if the wrong one were kept. */
  SET.plan = 'pro'; save();
  var n = WORDS.length, i;
  for (i = n; i < 500; i++) WORDS.push({ id: 'w_cap_' + i, hw: 'kata' + i, mn: ['a word'] });
  save();                        /* core.js's save() is what writes WORDS */
  out.paidHeld = WORDS.length;
  out.paidShown = wordsSeen().length;
  var wasBytes = bytes();

  SET.plan = 'free'; save();
  /* The LIST is asked for first and what is HELD is read after it, in that
     order and not the other way round: the way this fails is a list that
     trims the thing it is listing, and reading the count before anything has
     drawn the list is reading it before the damage. */
  out.freeShown = wordsSeen().length;
  out.freeHeld = WORDS.length;
  out.freeCap = wordCap();
  /* and not one byte of the language moved when the plan did */
  out.freeKeptBytes = same(wasBytes, bytes());

  /* ---- and the same sentence about the LETTERS and the GRAMMAR ---------
     「課金で追加した機能は無料になったら全部隠れる」 OWNER 2026-09-01. Words
     have been held here since the ceiling existed; the letters past the free
     alphabet and the stages somebody added were WRITING only -- CLAUDE.md
     says it, docs/PAID_FEATURES.md says it, and nothing stopped it. What the
     owner found on a phone was exactly that: a language back on free with its
     extra letters still standing in the alphabet.

     Held for real: made on the paid plan, counted on free, and counted again
     in LETTERS/STG so that hidden is hidden and never removed. */
  SET.plan = 'pro'; save();
  var ltWas = LETTERS.length, extraLt = ltNew({ nm:'zzq' });
  var stWas = (STG.extra ? STG.extra.length : 0);
  STG.extra.push({ id:'own_plan_check', title:'a stage of my own',
                   slots:['s1'], labels:{ s1:'one' }, what:'' });
  saveStg();
  var seenHas = function(id){
    var a = ltSeen(), i;
    for (i = 0; i < a.length; i++) if (a[i].id === id) return true;
    return false;
  };
  var stageHas = function(id){
    var a = stAll(), i;
    for (i = 0; i < a.length; i++) if (a[i].id === id) return true;
    return false;
  };
  out.ltPaidSeen = seenHas(extraLt.id);
  out.stPaidSeen = stageHas('own_plan_check');
  SET.plan = 'free'; save();
  out.ltFreeSeen = seenHas(extraLt.id);
  out.stFreeSeen = stageHas('own_plan_check');
  out.ltFreeHeld = !!ltById(extraLt.id);
  out.stFreeHeld = (STG.extra ? STG.extra.length : 0) - stWas;
  out.ltGrew = LETTERS.length - ltWas;
  /* put back: everything after this walks the fixture's own language */
  LETTERS = LETTERS.filter(function(l){ return l.id !== extraLt.id; });
  saveLetters();
  if (STG.extra) STG.extra = STG.extra.slice(0, stWas);
  saveStg();

  /* ---- 2. the ceiling refuses, and refuses in one place ---------------- */
  out.capOKfree = capOK(1);              /* 500 words on free: no room */
  SET.plan = 'pro'; save();
  out.capOKpaid = capOK(1);
  SET.plan = 'free'; save();

  /* capStop() must not move anybody. Somebody halfway through typing a word
     had the screen taken off them and was put on a price list once. */
  var whereWas = here().r;
  window.confirm = function(){ return false; };
  out.capStopped = capStop(1);
  out.capStayed = here().r === whereWas;

  /* ---- 3. the plan being unknown is not the same as having no data -----
     A receipt that fails, a network that is down, a Keychain that answers
     nothing: each of those makes the app the free plan for the moment. None
     of them may take the same branch as an empty phone. */
  out.emptyPlan = true; out.unknownWords = true; out.unknownCan = true;
  ['', null, undefined, 0].forEach(function(v){
    SET.plan = v;
    /* nothing there at all reads as the word free */
    out.emptyPlan = out.emptyPlan && plan() === 'free';
  });
  /* And a plan that is a WORD nobody knows is a different sentence, because
     plan() hands it back as it found it: `SET.plan='garbage'` is 'garbage',
     not 'free'. That is right and is not what protects anybody -- has() is a
     list of one, so anything that is not the word plus buys nothing, and
     that is the claim worth holding. A plan read as free would be a second
     answer to the same question. */
  ['', null, undefined, 0, 'garbage', 'pro ', 'PRO', 'basic', 'studio'].forEach(function(v){
    SET.plan = v;
    out.unknownWords = out.unknownWords && WORDS.length === 500;
    out.unknownCan = out.unknownCan && can('kb') === false && has('pro') === false;
    try { has('pro'); capOK(1); wordsSeen(); } catch (e) { out.unknownThrew = String(e); }
  });
  SET.plan = 'free'; save();

  /* ---- 4. can() and the table ------------------------------------------
     Every capability the table names answers on both plans, and a name that
     is not in the table is a typo that must be loud rather than quiet: it
     used to read as "free", which is the wrong way round -- a locked door
     nobody can open and nothing saying so. */
  var names = [], k;
  for (k in CAN) if (Object.prototype.hasOwnProperty.call(CAN, k)) names.push(k);
  out.canCount = names.length;
  SET.plan = 'free';
  out.freeAll = names.every(function(c){ return can(c) === false; });
  SET.plan = 'pro';
  out.paidAll = names.every(function(c){ return can(c) === true; });
  try { can('nosuchthing'); out.canTypo = false; } catch (e) { out.canTypo = true; }

  /* ---- 4b. the ladder ---------------------------------------------------
     A level is met by the plan that names it AND by every plan above it.
     That is the whole of what a ladder is, and the way it fails is not an
     error: `has` written as an equals sign gives Plus everything Basic buys
     and nothing else, so a Plus account quietly loses the letters it paid
     for one tier down. Read off CAN rather than written out here, so a
     capability moved between rungs is walked on the day it moves. */
  out.rungs = {};
  ['free', 'plus', 'pro'].forEach(function(p){
    SET.plan = p;
    out.rungs[p] = names.filter(function(c){ return can(c); }).sort().join(' ');
  });
  SET.plan = 'plus';
  out.midUp = has('plus') === true;
  out.midNotTop = has('pro') === false;
  SET.plan = 'pro';
  out.topHasMid = has('plus') === true;   /* the rung below is included */
  SET.plan = 'free';
  out.freeNoMid = has('plus') === false;

  /* ---- 4c. the word ceiling is the plan's, and it is a number ----------
     One thousand on Basic, none at all on Plus. Asked of wordCap() and of
     what the list actually shows, because those are two things and the fault
     this file exists for is them disagreeing. */
  var capWas = WORDS.length;
  out.capFree = (SET.plan = 'free', wordCap());
  out.capMid = (SET.plan = 'plus', wordCap());
  out.capTop = (SET.plan = 'pro', wordCap());
  SET.plan = 'plus'; save();
  out.midShows = wordsSeen().length;        /* 500 words, ceiling 1000 */
  out.midHolds = WORDS.length;
  out.midRoom = capOK(1) === true;
  SET.plan = 'free'; save();
  out.freeShows2 = wordsSeen().length;
  out.freeHolds2 = WORDS.length === capWas;

  /* ---- 4b. and how many keyboards -------------------------------------
     「1,1+3.無制限って言わなかったっけ？」 -- free 1, plus 1 + 3, pro none,
     and **counted as a pool across languages**. That last clause is the
     whole of why this is here: KB_MAX was three PER LANGUAGE, so three
     languages were nine keyboards on a plan that sells three, and nothing
     about it threw -- every keyboard rendered, installed and typed.

     Two of the three numbers are also a promise on the plans screen. Plus's
     card sells four keyboards and Pro's sells no limit, and until this
     CAN.kb was 'pro': plus bought a card that said four and got none, and
     pro's "no limit" was three. A paid screen promising what the app cannot
     do is the app lying to somebody who is about to pay.                  */
  out.kbFree = (SET.plan = 'free', kbCap());
  out.kbMid  = (SET.plan = 'plus', kbCap());
  out.kbTop  = (SET.plan = 'pro',  kbCap());
  out.kbDoor = (SET.plan = 'free', can('kb')) === false &&
               (SET.plan = 'plus', can('kb')) === true &&
               (SET.plan = 'pro',  can('kb')) === true;

  /* The pool. A second language is written straight into localStorage the
     way another language on this phone would be, with two keyboards in it,
     and then this language is asked whether it has room. On plus the answer
     has to be no: one QWERTY plus two over there plus one here is four. */
  SET.plan = 'plus'; save();
  KB = { kbs: [{ nm:'', pat:'qwerty', lay: kbFixed().lay }], at: 0 };
  saveKb();
  out.kbHere = kbCount();                        /* 1, in the open language */
  out.kbRoomHere = kbRoomKb();                   /* 1 + 1 < 4 -> yes */
  LANGS['l_other'] = { nm: 'Other' };
  localStorage.setItem(langKeyOf('l_other', 'kb'), JSON.stringify(
    { kbs: [{ nm:'', pat:'qwerty', lay: kbFixed().lay },
            { nm:'', pat:'qwerty', lay: kbFixed().lay }], at: 0 }));
  out.kbPool = kbCount();                        /* 3 */
  out.kbRoomPool = kbRoomKb();                   /* 1 + 3 < 4 -> no */
  out.kbPoolTop = (SET.plan = 'pro', kbRoomKb());/* no ceiling -> yes */
  /* A language stored in the older single-keyboard shape is one keyboard and
     not nothing: kbBoardsOf() reads either shape, and counting only the new
     one would hand somebody a free keyboard for every language they made
     before this. */
  localStorage.setItem(langKeyOf('l_other', 'kb'), JSON.stringify(
    { lay: kbFixed().lay }));
  out.kbPoolOld = kbCount();                     /* 2 */
  delete LANGS['l_other'];
  localStorage.removeItem(langKeyOf('l_other', 'kb'));
  KB = null; saveKb();
  SET.plan = 'free'; save();

  /* ---- 4e. editing a post you have sent, and the mark beside a name ----
     Two capabilities that were in the app before they were in CAN.
     「ツイートの編集も課金から」「バッチはplusから」 OWNER DECISION
     2026-08-23.

     `edit` is the only capability here that takes something away rather than
     opening a door nobody had: postEdit() asked nothing about a plan, so
     anybody could edit their own post. What it may never do is un-edit one,
     which is the first thing asked below. */
  var myPost = { id: 'p_plan', at: 1, lang: langId, lname: langName, mine: true,
                 hd: meHandle(), who: meName(), ln: 'kano mos', mn: 'a line',
                 ed: 12345 };
  POSTS.push(myPost);
  savePosts();

  /* The pencil is DRAWN on every plan, and that is a decision rather than an
     oversight: 「だいたい無料で使えないやつは表示させていいよ。課金させる動線
     を減らしたくない」 OWNER DECISION 2026-08-25. Hiding it is the older shape
     and the one this must not drift back to, so it is asked of the free
     plan's own menu markup. */
  SET.plan = 'free'; save();
  PMENU = 'p_plan';
  out.penOnFree = postMenuHTML(myPost).indexOf('postEdit') !== -1;

  /* Pressed on free: it ASKS, and the composer does not open either way.
     This used to be a bare go() and the check said so; 967e734 made it the
     same shape as the other three ceilings -- core.js:522 (a second
     language), core.js:703 (the hundredth word), keyboard.js:349 (a fifth
     keyboard) -- after the owner said 「編集はplusプランからです。みたいな
     ポップなしに課金画面飛ばされる」. So it is held the way those three are:
     said no, nobody moves; said yes, the plans screen; and the sentence
     names the ceiling rather than being `up.cta` on its own, which is what
     it was for a day and is the one thing that made it unlike the other
     three. */
  /* ---- THE QUESTION IS THE APP'S OWN POPUP, NOT THE SYSTEM'S -------------
     `confirm()` is banned -- 「標準は使わねえって言ってるだろこれも禁止や」
     OWNER 2026-09-01 -- and every door below now puts up popAsk(). This check
     went on stubbing window.confirm, so it read nothing and reported the
     sentence as missing on three doors that were saying it perfectly well.

     askPop(fn) runs the door and answers with the sentence the popup put on
     the screen; yesPop(fn) runs it and presses the yes. Nothing is stubbed:
     the popup is the app's own element and reading it is reading the screen. */
  function popSaid(){
    var e=document.querySelector('#pop .popm');
    return e? String(e.textContent||'') : '';
  }
  function askPop(fn){
    popOff(); fn();
    var m=popSaid(); popOff(); return m;
  }
  function yesPop(fn){
    popOff(); fn();
    if(popOn()) popYes();
  }
  go('feed');
  PW = pwBlank();
  out.editFreeAsked = askPop(function(){ postEdit('p_plan'); });
  out.editFreeNoPW = !PW.ed;
  out.editFreeSaidNo = here().r !== 'plans';
  /* said yes: the plans screen, and still no composer behind it */
  yesPop(function(){ postEdit('p_plan'); });
  out.editFreeWent = here().r === 'plans' && !PW.ed;
  /* and the post itself is untouched by having been refused */
  out.editFreeKept = postById('p_plan') && postById('p_plan').ln === 'kano mos' &&
                     postById('p_plan').ed === 12345;

  /* Pressed on plus: it opens, carrying the post it was pressed on. */
  SET.plan = 'plus'; save();
  PW = pwBlank();
  postEdit('p_plan');
  out.editPlusOpens = PW.ed === 'p_plan' && PW.ln === 'kano mos';
  PW = pwBlank(); PMENU = '';

  /* The mark. Free none, Plus none, Pro one -- and never on somebody else's
     post whatever plan they are on, because this phone can only answer the
     question for the person holding it. */
  var theirs = { id: 'p_them', at: 1, mine: false, hd: 'iri', who: 'Iri', ln: 'x' };
  SET.plan = 'free'; out.bdgFree = postBadge(myPost);
  SET.plan = 'plus'; out.bdgMid  = postBadge(myPost);
  SET.plan = 'pro';  out.bdgTop  = postBadge(myPost);
  out.bdgTheirs = postBadge(theirs);
  /* The price list is the other question and keeps answering it: the Pro row
     carries the mark for everybody, including somebody reading it on free. */
  SET.plan = 'free';
  out.bdgRowPro = planBadge('pro');
  out.bdgRowFree = planBadge('free');

  /* ---- 6b. money is not taken twice for the same thing ------------------
     「二重課金はさせないようにしろよ」 OWNER 2026-09-01, after buying Plus on
     a phone that already had Pro and being charged for both.

     Two App Store subscriptions in two groups can be held at once, and
     docs/apple.md says to put them in ONE group -- where Apple itself makes
     the second an upgrade. That sentence is WRITING, and writing does not
     stop anything: it was right in the file the whole time and the purchase
     went through anyway. The app refuses instead, and this is what holds the
     refusal.

     Pressing a plan at or below the one in force is not a purchase; it is a
     change to a subscription that exists, and that is Apple's own sheet. So
     the two things asked are: nothing is bought, and the plan does not
     move. */
  var boughtId = '';
  var realBuy = window.storeBuy;
  window.storeBuy = function(id){ boughtId = String(id||''); return true; };
  SET.plan = 'pro'; save();
  PLPICK = { id:'plus', yr:false };
  plBuy();
  out.dblBought = boughtId;
  out.dblPlan = plan();
  out.dblAsked = popOn();
  popOff();
  /* and the same plan again, monthly on a phone that has it */
  boughtId = '';
  PLPICK = { id:'pro', yr:true };
  plBuy();
  out.dblSameBought = boughtId;
  popOff();
  /* AND GOING UP STILL GOES THROUGH -- the guard is about what is held, not
     a wall in front of the shop. In a browser there is no App Store, so
     setPlan() writes the plan itself (storeOn() is false); what is asked is
     therefore the plan, which is the same thing the phone ends up with. */
  boughtId = '';
  SET.plan = 'plus'; save();
  PLPICK = { id:'pro', yr:false };
  plBuy();
  out.upPlan = plan();
  window.storeBuy = realBuy;
  PLPICK = null;
  SET.plan = 'free'; save();

  POSTS = POSTS.filter(function(x){ return x.id !== 'p_plan'; });
  savePosts();
  SET.plan = 'free'; save();

  /* ---- 5. a backup does not know what a plan is ------------------------
     Written on the free plan, and it is the same file the paid plan writes.
     The way this breaks is not a refusal -- it is a slice quietly left out of
     the file of somebody who is not paying, found on the day they need it. */
  /* Every slice has something in it first. bkPack() writes a slice only when
     storage HAS one -- an absent slice is absent from the file, correctly --
     so a language that has never been given a keyboard cannot answer the
     question this is asking. The one this exists for is exactly that: the
     keyboard was in no backup at all for a while, and a count of slices went
     on saying the right number while it was. */
  SLICES.forEach(function(sl){
    if (localStorage.getItem(langKey(sl)) === null)
      localStorage.setItem(langKey(sl), '[]');
  });
  SET.plan = 'pro'; save();
  var paidFile = bkPack();
  SET.plan = 'free'; save();
  var freeFile = bkPack();
  function keysOf(f){ return Object.keys((f && f.slice) || {}).sort().join(' '); }
  out.bkPaidKeys = keysOf(paidFile);
  out.bkFreeKeys = keysOf(freeFile);
  out.bkSame = JSON.stringify(freeFile).length > 0 &&
               keysOf(paidFile) === keysOf(freeFile);
  /* every slice core.js knows about is in the file, on the free plan */
  out.bkHasSlices = SLICES.every(function(sl){ return out.bkFreeKeys.indexOf(sl) >= 0; });

  /* ---- 6. where the plan is kept ---------------------------------------
     On a phone it is in the Keychain, and a second copy in an editable file
     would be the copy that decides: the next save would put it back over the
     top. In a browser there is no Keychain and the file is all there is.
     Both directions, because keeping it in neither is the failure that put
     Plus back to free at the next launch on a real phone. */
  SET.plan = 'pro';
  var wasNative = PLAN_NATIVE;
  PLAN_NATIVE = false;
  out.diskHasPlan = Object.prototype.hasOwnProperty.call(setOnDisk(), 'plan');
  PLAN_NATIVE = true;
  out.nativeHidesPlan = !Object.prototype.hasOwnProperty.call(setOnDisk(), 'plan');
  /* and nothing else is dropped along with it */
  out.diskKeepsRest = Object.keys(setOnDisk()).length ===
                      Object.keys(SET).length - 1;
  PLAN_NATIVE = wasNative;

  /* ---- 7. the day a plan ends is said once, and says nothing else ------
     capLapse() compares the plan with the plan it last saw, so it does not
     care HOW the plan changed. What it may never do is touch a slice. */
  var said = 0, realOpen = window.openCapLapse;
  window.openCapLapse = function(){ said++; };
  SET.plan = 'pro'; SET.planWas = undefined; save();
  capLapse();                       /* first run of all: records, says nothing */
  out.lapseQuietFirst = said === 0 && SET.planWas === 'pro';
  var beforeLapse = bytes();
  SET.plan = 'free'; save();
  capLapse();
  out.lapseSaid = said === 1;
  capLapse(); capLapse();
  out.lapseOnce = said === 1;       /* once, not once per render */
  out.lapseKeptBytes = same(beforeLapse, bytes());
  SET.plan = 'pro'; save(); capLapse();
  out.lapseUpQuiet = said === 1;    /* going UP says nothing */
  window.openCapLapse = realOpen;

  /* ---- 8. the App Store, and the browser that is not one ---------------
     www/store.js is the one window onto StoreKit, and in a browser there is
     no App Store to look through it at. What must NOT happen there is an
     error state on the plans screen: every check walks that screen without a
     bridge, every screenshot of it is taken without one, and a tier is tried
     on before it is on sale. So the button goes on setting the plan by hand,
     and storeOn() is the whole of the difference. */
  out.storeOff = storeOn() === false;
  out.storeRefuses = storeBuy('com.tokinets.lingua.pro.monthly') === false;
  SET.plan = 'free'; save();
  setPlan('pro');
  out.byHand = plan() === 'pro';
  setPlan('free');
  out.byHandBack = plan() === 'free';

  /* The product ids the app asks for are the ones the Swift sells. Two lists
     of ids is how a buy button comes to name a product App Store Connect has
     never heard of, and the answer to that is not an error -- StoreKit simply
     returns nothing, and the button does nothing, forever. */
  out.ids = ['plus', 'pro'].map(function(p){
    return storeId(p, false) + ' ' + storeId(p, true);
  }).join(' ');

  /* And nothing in www/ writes the plan to the Keychain on the way back from
     a purchase: LinguaStore.swift already did, and a second writer is a
     second answer to what plan this is. */
  var kept = 0, realKeep = window.planKeep;
  window.planKeep = function(){ kept++; };
  storeTook({ plan: 'plus' });
  out.tookNoKeychain = kept === 0;
  out.tookTakesAnswer = plan() === 'plus';
  window.planKeep = realKeep;
  SET.plan = 'free'; save();

  /* ---- 7b. a ceiling met is a way to the plans screen, not a dead end ---
     「そのプランでできることできないことで UI 自体に変更がない方が良くない？」
     OWNER DECISION 2026-08-25. The keyboard ceiling said its sentence with a
     toast and stopped, which is a sentence about a plan with no way to the
     thing it is about. capStop() was already the right shape; this is the
     other one. */
  SET.plan = 'plus'; save();
  KB = { kbs: [], at: 0 };
  while (kbRoomKb()) KB.kbs.push({ nm:'', pat:'qwerty', lay: kbFixed().lay });
  saveKb();
  out.kbAtCeiling = !kbRoomKb();
  var kbWas = kbBoards().length;
  /* said no: nobody is moved, and no keyboard is made */
  go('kb');
  out.kbAsked = askPop(function(){ kbAdd('qwerty'); });
  out.kbSaidNo = kbBoards().length === kbWas && here().r === 'kb';
  /* said yes: the plans screen, which is the thing the sentence is about */
  yesPop(function(){ kbAdd('qwerty'); });
  out.kbSaidYes = here().r === 'plans' && kbBoards().length === kbWas;
  KB = null; saveKb();
  SET.plan = 'free'; save();

  /* ---- 8. how many languages, and what happens to the ones already here --
     Last, because making one SWITCHES which language is open and everything
     above reads the open one.

     Free 1, Plus 1, Pro 3 -- OWNER DECISION 2026-08-23, restated 2026-08-25
     「言語数はプラスは1、プロは3」. This is the only ceiling in this file that
     can find somebody already over it, so most of what is asked here is what
     happens to them: they keep every language, see every language, and are
     refused only the next one. 「ボタンは減る、言葉は減らない」 */
  out.langFree = (SET.plan = 'free', langCap());
  out.langMid  = (SET.plan = 'plus', langCap());
  out.langTop  = (SET.plan = 'pro',  langCap());
  SET.plan = 'free'; save();

  /* A language being READ is not one of yours. Counting it would make looking
     at the timeline fill up a ceiling. */
  LANGS['l_read'] = { name: 'Somebody else\'s', mine: false };
  out.langCountReading = langCount();          /* still 1 -- the open one */
  delete LANGS['l_read'];

  /* The door is drawn on the plan that cannot press it. 「だいたい無料で
     使えないやつは表示させていいよ」 OWNER DECISION 2026-08-25. */
  out.doorOnFree = vLangs().indexOf('langNew') !== -1;

  /* Pressed on free, where the one language you have IS the ceiling: nothing
     is made and the plans screen is where you land. */
  /* Pressed on free, where the one language you have IS the ceiling. It asks
     first and flies on yes -- capStop()'s shape, which all three ceilings
     wear now. 「全部確認して飛ぶ」 OWNER DECISION 2026-08-25. */
  var wentTo = '', saidIt = '', realAlert = window.alert;
  window.alert = function(m){ saidIt = String(m); };
  var wasCount = langCount(), wasLang = langId;
  /* said no: nobody is moved and nothing is made */
  go('langs');
  var askedLang = askPop(function(){ langNew(); });
  out.freeAsked = askedLang;
  out.freeSaidNo = langCount() === wasCount && langId === wasLang && here().r === 'langs';
  /* the sentence has to read at ONE, which is what the free ceiling is --
     "1 languages" was what the first version of this string said */
  out.freeAskedNoPlural = (askedLang || '').indexOf('1 languages') === -1;
  /* said yes: the plans screen, still without making one */
  yesPop(function(){ langNew(); });
  out.freeMadeNone = langCount() === wasCount && langId === wasLang;
  out.freeWent = here().r === 'plans';
  out.freeSaidNothing = saidIt === '';

  /* Pressed on pro, where there is room: it is made AND opened, which is what
     the account switcher does. */
  SET.plan = 'pro'; save();
  langNew();
  out.proMade = langCount() === wasCount + 1;
  out.proOpened = langId !== wasLang && !!LANGS[langId] && LANGS[langId].mine;
  /* and it arrived empty rather than carrying the last language's words */
  out.proEmpty = WORDS.length === 0;

  /* Somebody who already has three. The third is made, then the plan is taken
     away, and the question is what happened to the three. */
  langNew();
  out.threeMade = langCount() === 3;
  var threeIds = [], id0;
  for (id0 in LANGS) if (LANGS[id0] && LANGS[id0].mine) threeIds.push(id0);
  /* written out first: a language made a moment ago has no slices in storage
     until something saves it, so measuring before that would be comparing an
     unwritten language with a written one and calling the difference damage */
  save();
  var bytesThree = bytes();

  SET.plan = 'free'; save();
  out.freeStillHolds = langCount() === 3;
  out.freeStillHasAll = threeIds.every(function(x){ return !!LANGS[x]; });
  /* the LIST is asked for and read after, the same order section 1 uses: the
     way this fails is a list that trims the thing it is listing */
  var lhtml = vLangs();
  out.freeStillShowsAll = threeIds.every(function(x){ return lhtml.indexOf(x) !== -1; });
  out.freeStillHolds2 = langCount() === 3;
  out.threeKeptBytes = same(bytesThree, bytes());
  /* and the backup of the open one is written the same as it ever was */
  out.threeBackup = bkPack().slices ? true : !!bkPack();

  /* The fourth is the only thing refused. */
  saidIt = '';
  yesPop(function(){ langNew(); });
  out.fourthRefused = langCount() === 3;
  out.fourthWent = here().r === 'plans';
  /* and the three are the same three, still, AFTER the refusal -- which is
     where a version that prunes down to the ceiling would do it. Asked by id
     and in bytes rather than by counting: a count of three is also what you
     get from deleting one and making another. */
  out.fourthKeptAll = threeIds.every(function(x){ return !!LANGS[x]; });
  out.fourthKeptBytes = same(bytesThree, bytes());

  /* And on the plan that buys the most, where a price list answers nothing,
     it says one sentence instead of moving anybody. That is CLAUDE.md's
     2026-08-22 narrowing and the only place in this feature that has words. */
  SET.plan = 'pro'; save();
  go('langs');
  saidIt = '';
  langNew();
  out.topRefused = langCount() === 3;
  out.topSaid = saidIt;
  out.topStayed = here().r === 'langs';
  window.alert = realAlert;

  return out;
}, { s: seed.toString() });

/* ---- and the prices are the App Store's -------------------------------
   Everything above runs in a browser, where there is no App Store, and that
   is the one place the typed prices in www/i18n are correct. On a phone they
   are correct in the United States and wrong in the other 174 storefronts:
   Apple generates every one of them from a base price with its own rounding
   and its own tax, and any of them can be overridden one at a time. Nothing
   about showing dollars to somebody being charged yen throws, renders wrong,
   or fails a check -- it is simply a number nobody ever compared to anything.
   「国によって値段変わる？」 2026-08-23.

   So a fake App Store is stood up and the screen is asked what it says. The
   yen here are not the real prices and are not meant to be: they are chosen
   so the saving works out to 33 rather than the 17 written on PLANS, because
   17 appearing would prove nothing about where it came from.               */
const st = await pg.evaluate(async () => {
  var out = {};
  window.Capacitor = { nativePromise: function(plug, m){
    if (m !== 'products') return Promise.reject(new Error('not this one'));
    return Promise.resolve({ products: [
      /* `year` is twelve of the monthly one, formatted by the App Store and
         not by us -- it is what the year's price is struck through with.
         ¥9,000 and not ¥9000: the point of the field is that Apple wrote the
         string, so a check that accepted either would be accepting a string
         this app could have built. */
      { id: 'com.tokinets.lingua.plus.monthly', price: '\u00a5750',   amount: 750,
        year: '\u00a59,000' },
      { id: 'com.tokinets.lingua.plus.yearly',  price: '\u00a56,000', amount: 6000 },
      /* Pro's monthly only: a product that has not been made in App Store
         Connect is not an error, it simply does not come back. It carries a
         `year` all the same -- twelve of it is a fact about the month -- and
         nothing may be struck through with it, because there is no year on
         sale to compare it to. */
      { id: 'com.tokinets.lingua.pro.monthly',  price: '\u00a51,500', amount: 1500,
        year: '\u00a518,000' },
    ] });
  } };
  STORE_P = null; STORE_ASK = false;

  out.before = vPlans();                       /* asks, and draws meanwhile */
  await new Promise(function(r){ setTimeout(r, 0); });
  out.asked = STORE_ASK && STORE_P !== null;
  var again = vPlans();
  out.twice = STORE_ASK;                       /* still one ask, not two */
  out.after = again;
  /* Per page, because the three do not agree and should not: Plus has both
     its products and Pro has one, so what each page says about a saving is a
     different sentence. A claim about the whole screen would be answered by
     whichever page happened to say it. */
  var pp = again.split('class="plpage"');
  out.plusPage = pp[2] || '';
  out.proPage  = pp[3] || '';

  out.plusMo = storeCost('plus', false);
  out.plusYr = storeCost('plus', true);
  out.proYr  = storeCost('pro', true);         /* not on sale -> nothing */
  out.plusOff = storeOff('plus');
  out.proOff  = storeOff('pro');               /* one term only -> nothing */
  out.freeOff = storeOff('free');

  /* ---- and the year is struck through with what twelve months cost -------
     Read off the two term buttons rather than off the page, because the
     claim is about WHICH of them wears it: a count over the whole page is
     answered by either one, and a month with a line through its own price
     twelve times over is the way this breaks. */
  var pt = planPrice(PLANS[1], false).split('<button');
  out.plusMoHTML = pt[1] || '';
  out.plusYrHTML = pt[2] || '';
  out.plusWas = storeWas('plus');
  out.proWas  = storeWas('pro');               /* has `year`, has no saving */

  /* The App Store answered, and answered without the field -- which is every
     phone carrying a build older than the one that added it. Nothing is
     struck through, and the year's own price and its saving are untouched. */
  var keep = STORE_P['com.tokinets.lingua.plus.monthly'];
  STORE_P['com.tokinets.lingua.plus.monthly'] =
    { id: keep.id, price: keep.price, amount: keep.amount };
  out.noYearWas = storeWas('plus');
  out.noYearOff = storeOff('plus');
  out.noYearHTML = planPrice(PLANS[1], false);
  STORE_P['com.tokinets.lingua.plus.monthly'] = keep;

  /* Amounts that cannot make a saving make none, rather than making one up. */
  STORE_P['com.tokinets.lingua.pro.monthly'] = { id: 'x', price: 'free', amount: 0 };
  STORE_P['com.tokinets.lingua.pro.yearly']  = { id: 'y', price: 'free', amount: 0 };
  out.zeroOff = storeOff('pro');
  STORE_P['com.tokinets.lingua.pro.monthly'] = { id: 'x', price: 'a', amount: 100 };
  STORE_P['com.tokinets.lingua.pro.yearly']  = { id: 'y', price: 'b', amount: 2400 };
  out.dearOff = storeOff('pro');               /* a year that costs MORE */

  delete window.Capacitor;
  STORE_P = null; STORE_ASK = false;
  return out;
});
/* ---- the Keychain, and the difference between empty and unreadable -------
   The plan LIVES in the Keychain on a phone -- ios/App/App/LinguaPlan.swift --
   and www/core.js reads it out of `window.__plan`, injected before any script
   of ours runs. Nothing after boot can put it back: this is the one read, and
   what it decides is written straight back down.

   `read()` used to answer the empty string for BOTH 「there is nothing there」
   and 「that failed」, and core.js answered empty by writing `free` INTO the
   Keychain. So one unreadable launch turned a paid plan into a free one, for
   good. 「アップデートしたら勝手に無料プランになったんだけど？」 OWNER
   2026-09-02.

   A fresh PAGE for each case, and the values put in with addInitScript --
   the same moment the native side injects them, because core.js runs this
   branch once as it loads and there is no second chance to set it up. */
const KEY = [];
for (const c of [
  { n: 'unreadable', plan: '', ok: 0,  had: 'pro' },
  { n: 'empty',      plan: '', ok: 1,  had: 'pro' },
  { n: 'holds pro',  plan: 'pro', ok: 1, had: 'free' }
]) {
  const kp = await br.newPage({ viewport: { width: 390, height: 844 } });
  await kp.addInitScript(({ plan, ok, had }) => {
    window.__plan = plan;
    window.__planok = ok;
    window.__wrote = [];
    window.Capacitor = { nativePromise: function (p, m, a) {
      if (p === 'LinguaPlan') window.__wrote.push(a && a.plan);
      return { 'catch': function () { return { 'catch': function () {} }; } };
    } };
    try { localStorage.setItem('lingua.set', JSON.stringify({ plan: had, done: true })); } catch (e) {}
  }, c);
  await kp.goto('file://' + path.join(dir, '..', 'www', 'index.html'));
  await kp.waitForFunction(() => typeof window.plan === 'function');
  KEY.push(await kp.evaluate((n) => ({ n: n, plan: plan(), wrote: window.__wrote.slice() }), c.n));
  await kp.close();
}
await br.close();

const bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

say(r.paidHeld === 500 && r.paidShown === 500,
    'the paid plan holds 500 words and lists 500 (' + r.paidHeld + ', ' + r.paidShown + ')');
say(r.freeHeld === 500,
    'the plan ending keeps all 500 (' + r.freeHeld + ')');
say(r.freeShown === r.freeCap,
    'and lists ' + r.freeCap + ' of them (' + r.freeShown + ')');
say(r.ltGrew === 1 && r.ltPaidSeen && !r.ltFreeSeen,
    'a letter added on the paid plan is on the alphabet, and hidden on free');
say(r.ltFreeHeld, 'and it is still in LETTERS -- hidden, never removed');
say(r.stPaidSeen && !r.stFreeSeen,
    'a grammar stage added on the paid plan is on the list, and hidden on free');
say(r.stFreeHeld === 1, 'and it is still in STG.extra -- hidden, never removed');

say(r.freeKeptBytes,
    'not one byte of any slice moved when the plan did');

say(r.capOKfree === false && r.capOKpaid === true,
    'the ceiling is met on free and is not there on paid');
say(r.capStopped === true, 'and adding one more is refused');
say(r.capStayed, 'without taking the screen off anybody');

say(r.emptyPlan, 'no plan at all reads as free');
say(r.unknownCan, 'and any plan that is no rung of the ladder buys nothing -- garbage, PRO, basic, studio');
say(r.unknownWords, 'and the words are all still there while it does');
say(!r.unknownThrew, 'and nothing about it throws (' + (r.unknownThrew || 'nothing') + ')');

say(r.canCount === 11, 'CAN names ' + r.canCount + ' capabilities');
say(r.freeAll, 'every one of them is closed on free');
say(r.paidAll, 'and open on plus');
say(r.canTypo, 'and a name that is not in the table throws rather than reading as free');

say(r.rungs.free === '', 'free opens nothing (' + (r.rungs.free || 'nothing') + ')');
say(r.rungs.plus === 'edit kb letters snd wsys',
    'plus opens a keyboard, its own letters, its own sounds, a writing system ' +
    'and editing a post it has sent (' + r.rungs.plus + ')');
say(r.rungs.pro.split(' ').length === r.canCount,
    'pro opens all ' + r.canCount + ' (' + r.rungs.pro.split(' ').length + ')');
say(r.midUp && r.midNotTop, 'plus meets its own rung and not the one above it');
say(r.topHasMid, 'and pro meets plus\'s -- a ladder, not three equals signs');
say(r.freeNoMid, 'while free meets neither');

say(r.kbFree === 1 && r.kbMid === 4, 'free has one keyboard, plus has 1 + 3 (' +
    r.kbFree + ' ' + r.kbMid + ')');
say(r.kbTop === null || r.kbTop === undefined || r.kbTop > 1e9 || r.kbTop === 'Infinity',
    'and pro has no ceiling on them (' + r.kbTop + ')');
say(r.kbDoor, 'the door and the number moved together: free cannot lay one out, plus and pro can');
say(r.kbHere === 1 && r.kbRoomHere, 'one keyboard built here leaves room for more');
say(r.kbPool === 3 && r.kbRoomPool === false,
    'two more in ANOTHER language fill the plan up -- the ceiling is a pool across languages (' +
    r.kbPool + ')');
say(r.kbPoolTop === true, 'and pro is not filled up by them');
say(r.kbPoolOld === 2,
    'a language stored in the older one-keyboard shape counts as the one it is');

say(r.penOnFree, 'the pencil is drawn on the free plan -- a closed door is shown, not hidden');
say(r.editFreeNoPW && r.editFreeSaidNo,
    'pressed on free it asks rather than telling -- no is no, and no composer opens');
say(/Plus/.test(r.editFreeAsked || ''),
    'the sentence names the plan (' + (r.editFreeAsked || 'nothing') + ')');
say(r.editFreeWent, 'and yes goes to the plans screen, still without a composer');
say(r.editFreeKept, 'and the post it was pressed on is not changed by being refused');
say(r.editPlusOpens, 'on plus it opens, carrying the post it was pressed on');

say(r.bdgFree === '' && r.bdgMid === '', 'no mark beside the name on free or plus');
say(r.bdgTop !== '', 'and one on pro (' + (r.bdgTop ? 'drawn' : 'nothing') + ')');
say(r.bdgTheirs === '', 'never on somebody else\'s post, whatever plan this phone is on');
say(r.dblBought === '' && r.dblPlan === 'pro',
    'a plan BELOW the one in force is not bought again (' +
    (r.dblBought || 'nothing asked for') + ', still ' + r.dblPlan + ')');
say(r.dblAsked, 'and it says so rather than doing nothing');
say(r.dblSameBought === '', 'nor is the plan already in force (' +
    (r.dblSameBought || 'nothing asked for') + ')');
say(r.upPlan === 'pro', 'and going UP still goes through (' + r.upPlan + ')');

say(r.bdgRowPro !== '' && r.bdgRowFree === '',
    'the price list still marks the Pro row, read on free -- a plan carrying it is not the same question');

say(r.kbAtCeiling, 'plus fills up at four keyboards');
say(r.kbSaidNo, 'and the fourth-and-one asks rather than telling -- no is no, and nobody is moved');
say(/4/.test(r.kbAsked || ''), 'the sentence says the number (' + (r.kbAsked || 'nothing') + ')');
say(r.kbSaidYes, 'and yes goes to the plans screen, still without making one');

say(r.langFree === 1 && r.langMid === 1 && r.langTop === 3,
    'free and plus hold one language, pro holds three (' +
    r.langFree + ' ' + r.langMid + ' ' + r.langTop + ')');
say(r.langCountReading === 1,
    'a language being READ from somebody else is not one of yours (' + r.langCountReading + ')');
say(r.doorOnFree, 'the way to make one is drawn on free -- a closed door is shown, not hidden');
say(r.freeSaidNo, 'pressed on free it asks rather than telling -- no is no, and nobody is moved');
say(/1/.test(r.freeAsked || ''), 'the sentence says the number (' + (r.freeAsked || 'nothing') + ')');
say(r.freeAskedNoPlural, 'and it reads at one, which is what the free ceiling is');
say(r.freeMadeNone && r.freeWent && r.freeSaidNothing,
    'and yes goes to the plans screen, still without making one');
say(r.proMade && r.proOpened, 'pressed on pro it is made and opened');
say(r.proEmpty, 'and it arrives empty rather than carrying the last one\'s words');

say(r.threeMade && r.freeStillHolds && r.freeStillHasAll,
    'somebody with three keeps three when the plan ends');
say(r.freeStillShowsAll && r.freeStillHolds2,
    'and the list draws all three of them -- the ceiling hides nothing');
say(r.threeKeptBytes, 'and not one byte of any slice moved');
say(r.fourthRefused && r.fourthWent, 'only the fourth is refused, and it goes to the plans screen');
say(r.fourthKeptAll && r.fourthKeptBytes,
    'and being refused took none of the three away -- the same three ids, the same bytes');
say(r.topRefused && r.topStayed,
    'on the plan that buys the most the fourth is refused without moving anybody');
say(/3/.test(r.topSaid || ''),
    'and that is the one place with a sentence, because a price list would answer nothing (' +
    (r.topSaid || 'nothing said') + ')');

say(r.capFree === 100, 'free counts to 100 (' + r.capFree + ')');
say(r.capMid === 1000, 'plus counts to 1000 (' + r.capMid + ')');
say(r.capTop === null || r.capTop === undefined || r.capTop > 1e9 || r.capTop === 'Infinity',
    'and pro has no number at all (' + r.capTop + ')');
say(r.midShows === 500 && r.midHolds === 500,
    'a 500-word dictionary is all shown on plus (' + r.midShows + ')');
say(r.midRoom, 'and there is room for another');
say(r.freeShows2 === 100 && r.freeHolds2,
    'the same dictionary on free shows 100 and still holds 500');

say(r.bkSame, 'a backup written on free holds the same slices as one written on plus');
say(r.bkHasSlices, 'and every slice core.js knows about is in it (' + r.bkFreeKeys + ')');

say(r.diskHasPlan, 'in a browser the plan is in the settings file');
say(r.nativeHidesPlan, 'on a phone it is not -- the Keychain is holding it');
say(r.diskKeepsRest, 'and nothing else is dropped with it');

say(r.lapseQuietFirst, 'the first launch of all records the plan and says nothing');
say(r.lapseSaid, 'a plan ending is said out loud');
say(r.lapseOnce, 'once, not once per render');
say(r.lapseKeptBytes, 'and it touches no slice');
say(r.lapseUpQuiet, 'going up a plan says nothing at all');

say(r.storeOff, 'in a browser there is no App Store to ask');
say(r.storeRefuses, 'and storeBuy() says so rather than pretending');
say(r.byHand && r.byHandBack, 'so the plans screen still sets the plan by hand there');
say(r.ids === 'com.tokinets.lingua.plus.monthly com.tokinets.lingua.plus.yearly ' +
             'com.tokinets.lingua.pro.monthly com.tokinets.lingua.pro.yearly',
    'the four product ids are the four LinguaStore.swift sells (' + r.ids + ')');
say(r.tookNoKeychain, 'what comes back from a purchase is not written to the Keychain twice');
say(r.tookTakesAnswer, 'and the plan is taken from the ANSWER, not from what was asked for');

say(st.asked && st.twice, 'the App Store is asked once and remembered');
say(st.before.indexOf('$4.99') !== -1,
    'the screen is drawn before it answers, out of www/i18n');
say(st.after.indexOf('\u00a5750') !== -1 && st.after.indexOf('$4.99') === -1,
    'and redrawn with what Apple charges in that country, not what we typed');
say(st.plusMo === '\u00a5750' && st.plusYr === '\u00a56,000',
    'both terms come from the App Store (' + st.plusMo + ' ' + st.plusYr + ')');
say(st.plusOff === '33',
    'the saving is worked out from the two amounts, not read off PLANS (' + st.plusOff + ')');
say(st.plusPage.indexOf('33% off') !== -1 && st.plusPage.indexOf('17% off') === -1,
    'and it is the one on that plan\'s page');
say(st.proPage.indexOf('17% off') !== -1,
    'while a plan the App Store said nothing about keeps the one on PLANS');
say(st.proYr === '', 'a product not yet made says nothing rather than guessing');
say(st.proOff === '' && st.freeOff === '',
    'and a saving needs both terms really on sale');
say(st.after.indexOf('$99.99') !== -1,
    'so that term falls back to www/i18n, which is the only place a typed price may reach a screen');
say(st.zeroOff === '' && st.dearOff === '',
    'nothing costing nothing, and a year dearer than twelve months, make no saving');

/* ---- the year, struck through with twelve months of the monthly price ----
   「49.99は取り消し線＋17%OFF」OWNER 2026-08-26. The saving above is the
   17% half and was already held; this is the line through the old number.  */
say(st.plusWas === '\u00a59,000',
    'a year is struck through with the App Store\'s own twelve months (' + st.plusWas + ')');
say(st.plusYrHTML.indexOf('<s class="pwas">\u00a59,000</s>') !== -1,
    'and it is on the screen, in Apple\'s formatting and not built out of a number');
say(st.plusMoHTML.indexOf('pwas') === -1,
    'the month is not struck through with twelve of itself');
say(st.proWas === '',
    'a plan with no year on sale strikes nothing through, `year` or no `year`');
say(st.noYearWas === '' && st.noYearHTML.indexOf('pwas') === -1,
    'an App Store that answers without the field strikes nothing through');
say(st.noYearOff === '33',
    'and the saving it does know is still said (' + st.noYearOff + ')');
/* The whole of the fallback, and it is the owner's: 何も出さない.
   OWNER 2026-08-26. A browser, every screenshot, and a product not yet made
   are the same case -- and www/i18n has no typed price for this one on
   purpose, because a struck-through price exists to be compared with the one
   beside it, and a dollar sign shown to somebody being charged yen is the
   one place that comparison is a lie rather than merely a wrong number. */
say(st.before.indexOf('pwas') === -1,
    'and before Apple has answered at all, nothing is struck through -- there is no typed one');

const K = {}; KEY.forEach(function (r) { K[r.n] = r; });
say(K['unreadable'].wrote.length === 0,
    'a Keychain read that FAILED writes nothing back — a paid plan is not ' +
    'overwritten by a launch that could not see it (wrote ' +
    JSON.stringify(K['unreadable'].wrote) + ')');
say(K['unreadable'].plan === 'pro',
    'and the screen falls back to the copy in the settings, which is the last ' +
    'plan this phone knew (' + K['unreadable'].plan + ')');
/* What is asked is WHAT was written, not how many times. Two roads write the
   plan down at boot -- the branch that fills an empty Keychain, and
   planMigrate() -- and on this seed both run and both write the same `pro`.
   Counting them said 1 and got 2, which is the check being about the wrong
   thing: nothing here cares how many times the right word is written, and
   everything here cares that `free` is never one of them. */
say(K['empty'].wrote.length > 0 &&
    K['empty'].wrote.every(function (w) { return w === 'pro'; }),
    'a Keychain that genuinely holds NOTHING still takes what the old settings ' +
    'had, and every write is that — the migration road is untouched (' +
    JSON.stringify(K['empty'].wrote) + ')');
say(K['holds pro'].plan === 'pro',
    'and a Keychain that holds a plan is the one that decides, over the ' +
    'settings (' + K['holds pro'].plan + ')');

if (bad.length) { console.error('\nplan: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nplan: money decides what may be DONE and nothing about what exists --\n' +
            'the words, the letters and the backup are the same on either side of it.');
