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
  SET.plan = 'plus'; save();
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

  /* ---- 2. the ceiling refuses, and refuses in one place ---------------- */
  out.capOKfree = capOK(1);              /* 500 words on free: no room */
  SET.plan = 'plus'; save();
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
  ['', null, undefined, 0, 'garbage', 'plus ', 'PLUS', 'studio'].forEach(function(v){
    SET.plan = v;
    out.unknownWords = out.unknownWords && WORDS.length === 500;
    out.unknownCan = out.unknownCan && can('kb') === false && has('plus') === false;
    try { has('plus'); capOK(1); wordsSeen(); } catch (e) { out.unknownThrew = String(e); }
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
  SET.plan = 'plus';
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
  ['free', 'basic', 'plus'].forEach(function(p){
    SET.plan = p;
    out.rungs[p] = names.filter(function(c){ return can(c); }).sort().join(' ');
  });
  SET.plan = 'basic';
  out.basicUp = has('basic') === true;
  out.basicNotPlus = has('plus') === false;
  SET.plan = 'plus';
  out.plusHasBasic = has('basic') === true;   /* the rung below is included */
  SET.plan = 'free';
  out.freeNoBasic = has('basic') === false;

  /* ---- 4c. the word ceiling is the plan's, and it is a number ----------
     One thousand on Basic, none at all on Plus. Asked of wordCap() and of
     what the list actually shows, because those are two things and the fault
     this file exists for is them disagreeing. */
  var capWas = WORDS.length;
  out.capFree = (SET.plan = 'free', wordCap());
  out.capBasic = (SET.plan = 'basic', wordCap());
  out.capPlus = (SET.plan = 'plus', wordCap());
  SET.plan = 'basic'; save();
  out.basicShows = wordsSeen().length;        /* 500 words, ceiling 1000 */
  out.basicHolds = WORDS.length;
  out.basicRoom = capOK(1) === true;
  SET.plan = 'free'; save();
  out.freeShows2 = wordsSeen().length;
  out.freeHolds2 = WORDS.length === capWas;

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
  SET.plan = 'plus'; save();
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
  SET.plan = 'plus';
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
  SET.plan = 'plus'; SET.planWas = undefined; save();
  capLapse();                       /* first run of all: records, says nothing */
  out.lapseQuietFirst = said === 0 && SET.planWas === 'plus';
  var beforeLapse = bytes();
  SET.plan = 'free'; save();
  capLapse();
  out.lapseSaid = said === 1;
  capLapse(); capLapse();
  out.lapseOnce = said === 1;       /* once, not once per render */
  out.lapseKeptBytes = same(beforeLapse, bytes());
  SET.plan = 'plus'; save(); capLapse();
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
  out.storeRefuses = storeBuy('com.tokinets.lingua.plus.monthly') === false;
  SET.plan = 'free'; save();
  setPlan('plus');
  out.byHand = plan() === 'plus';
  setPlan('free');
  out.byHandBack = plan() === 'free';

  /* The product ids the app asks for are the ones the Swift sells. Two lists
     of ids is how a buy button comes to name a product App Store Connect has
     never heard of, and the answer to that is not an error -- StoreKit simply
     returns nothing, and the button does nothing, forever. */
  out.ids = ['basic', 'plus'].map(function(p){
    return storeId(p, false) + ' ' + storeId(p, true);
  }).join(' ');

  /* And nothing in www/ writes the plan to the Keychain on the way back from
     a purchase: LinguaStore.swift already did, and a second writer is a
     second answer to what plan this is. */
  var kept = 0, realKeep = window.planKeep;
  window.planKeep = function(){ kept++; };
  storeTook({ plan: 'basic' });
  out.tookNoKeychain = kept === 0;
  out.tookTakesAnswer = plan() === 'basic';
  window.planKeep = realKeep;
  SET.plan = 'free'; save();

  return out;
}, { s: seed.toString() });
await br.close();

const bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

say(r.paidHeld === 500 && r.paidShown === 500,
    'the paid plan holds 500 words and lists 500 (' + r.paidHeld + ', ' + r.paidShown + ')');
say(r.freeHeld === 500,
    'the plan ending keeps all 500 (' + r.freeHeld + ')');
say(r.freeShown === r.freeCap,
    'and lists ' + r.freeCap + ' of them (' + r.freeShown + ')');
say(r.freeKeptBytes,
    'not one byte of any slice moved when the plan did');

say(r.capOKfree === false && r.capOKpaid === true,
    'the ceiling is met on free and is not there on paid');
say(r.capStopped === true, 'and adding one more is refused');
say(r.capStayed, 'without taking the screen off anybody');

say(r.emptyPlan, 'no plan at all reads as free');
say(r.unknownCan, 'and any plan that is not the word plus buys nothing -- garbage, PLUS, studio');
say(r.unknownWords, 'and the words are all still there while it does');
say(!r.unknownThrew, 'and nothing about it throws (' + (r.unknownThrew || 'nothing') + ')');

say(r.canCount === 9, 'CAN names ' + r.canCount + ' capabilities');
say(r.freeAll, 'every one of them is closed on free');
say(r.paidAll, 'and open on plus');
say(r.canTypo, 'and a name that is not in the table throws rather than reading as free');

say(r.rungs.free === '', 'free opens nothing (' + (r.rungs.free || 'nothing') + ')');
say(r.rungs.basic === 'letters snd wsys',
    'basic opens its own letters, its own sounds and a writing system (' + r.rungs.basic + ')');
say(r.rungs.plus.split(' ').length === r.canCount,
    'plus opens all ' + r.canCount + ' (' + r.rungs.plus.split(' ').length + ')');
say(r.basicUp && r.basicNotPlus, 'basic meets its own rung and not the one above it');
say(r.plusHasBasic, 'and plus meets basic\'s -- a ladder, not three equals signs');
say(r.freeNoBasic, 'while free meets neither');

say(r.capFree === 100, 'free counts to 100 (' + r.capFree + ')');
say(r.capBasic === 1000, 'basic counts to 1000 (' + r.capBasic + ')');
say(r.capPlus === null || r.capPlus === undefined || r.capPlus > 1e9 || r.capPlus === 'Infinity',
    'and plus has no number at all (' + r.capPlus + ')');
say(r.basicShows === 500 && r.basicHolds === 500,
    'a 500-word dictionary is all shown on basic (' + r.basicShows + ')');
say(r.basicRoom, 'and there is room for another');
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
say(r.ids === 'com.tokinets.lingua.basic.monthly com.tokinets.lingua.basic.yearly ' +
             'com.tokinets.lingua.plus.monthly com.tokinets.lingua.plus.yearly',
    'the four product ids are the four LinguaStore.swift sells (' + r.ids + ')');
say(r.tookNoKeychain, 'what comes back from a purchase is not written to the Keychain twice');
say(r.tookTakesAnswer, 'and the plan is taken from the ANSWER, not from what was asked for');

if (bad.length) { console.error('\nplan: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nplan: money decides what may be DONE and nothing about what exists --\n' +
            'the words, the letters and the backup are the same on either side of it.');
