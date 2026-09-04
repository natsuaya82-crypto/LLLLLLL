/* The base makes digits, and taking it back down never takes anybody's away.
   ---------------------------------------------------------------------
   Raising it makes the slots at once -- they used to appear at the next
   launch, because only ltStart made them and only an open ran it.
   「数字は増やしなさい」

   Lowering it is the app's one automatic deletion, so it is the one that has
   to be held: an EMPTY slot above the new base goes, and a digit somebody has
   drawn on, named or given a sound STAYS -- shown in red, not removed.
   「あげた時に文字や音とか設定してたら赤くなって、なにも書いてなかったら
   勝手に減らしていいよ」 DELETE REVIEW is in docs/CHANGELOG.md.

   Nothing here throws when it goes wrong. A digit somebody spent an evening
   drawing simply is not there the next time they look.

   Run: node tools/base-check.mjs                                        */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{width:390,height:844} });
await pg.goto('file://' + path.join(dir,'..','www','index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:10000 });

const r = await pg.evaluate(({s}) => {
  eval('(' + s + ')()');
  SET.done = true; SET.plan = 'pro';
  var o = GGRID.inset, D = geStep(), out = {};

  out.start = numDigits().length;
  numSetBase(14);
  out.grew = numDigits().length;                 /* at once, not next launch */

  /* three of the four new ones are somebody's: one drawn, one named, one
     given a sound. The fourth is the empty slot the app made.
     If the slots were never made, say so and stop rather than throwing on a
     digit that is not there -- a check that crashes says less than one that
     fails. */
  if (out.grew !== 14) return out;
  numByVal(10).st   = [{ pts: [[o+4*D, o+4*D], [o+4*D, o+16*D]] }];
  numByVal(11).ab   = 'x';
  numByVal(12).snd  = ['k'];
  saveLetters();

  numSetBase(10);
  out.base = numBase();
  out.kept = [10, 11, 12].map(function(v){ return !!numByVal(v); });
  out.blankGone = !numByVal(13);
  out.drawnStill = !!(numByVal(10) && numByVal(10).st && numByVal(10).st.length);
  out.red = LETTERS.filter(numOver).length;

  /* and the slot comes back by the same route it was made */
  numSetBase(14);
  out.slotBack = !!numByVal(13);
  out.noDouble = numDigits().filter(function(l){ return l.val === 13; }).length;

  /* FREE SEES THE SAME ROW, and the press is where the plan is answered.
     「無料でもplusでもproでも同じ画面なのよ。でも無料から文字を足すところは
     課金のポップが出ないといけない」 OWNER 2026-09-01 -- so this used to ask
     that free had NO row, which is the screen being taken away rather than
     the door standing in it. What is asked now is the row plus what pressing
     it does: the popup, and the base exactly where it was. */
  SET.plan = 'free';
  out.freeRow = numBaseRows();
  var wasBase = numBase();
  numStepBase(1);
  out.freeAsked = popOn();
  out.freeBase = numBase();
  out.freeWas = wasBase;
  popOff();
  SET.plan = 'pro';

  /* ---- a slot's name does not change, on any plan ------------------------
     「無料で作ってる範囲の名前変更は無しでしょ。有料は追加できるというだけで」
     Decision log, 2026-08-22.

     The free QWERTY finds its keys BY NAME -- kbNamed('a') walks LETTERS for
     one called `a` -- so a renamed slot is a key that cannot be found, and
     ltStart() then fills the hole with a new empty letter. What somebody drew
     is still in the alphabet and no longer on the keyboard, with nothing
     saying why.

     The letter page already hides the field. That is the screen holding it,
     and a screen is not a rule: ltSetRoman() is reachable from anywhere and
     did not refuse. So it is asked of the FUNCTION, on the paid plan, which
     is the only plan where the question can even be put. */
  var slot = LETTERS.filter(function(l){ return String(l.ab||'') === 'a'; })[0];
  var dig  = numByVal(3);
  out.slotWas = slot ? String(ltName(slot)) : '(no a slot)';
  if (slot) { ltSetRoman(slot.id, 'zzq'); out.slotNow = String(ltName(slot)); }
  out.digWas = dig ? String(ltName(dig)) : '(no digit 3)';
  if (dig) { ltSetRoman(dig.id, 'zzq'); out.digNow = String(ltName(dig)); }

  /* and a letter that is NOT a slot still renames -- what paid buys is
     adding letters, and a letter somebody added is theirs to name. */
  var mine = ltNew({});
  ltSetRoman(mine.id, 'qeq');
  out.mineNow = String(ltName(mine));

  /* ---- and what goes out to the clock on the home screen ----------------
     The widget cannot ask the app anything: it reads one file in the App
     Group and draws whatever is in it. So the two things worth holding are
     the base it will count in, and that a slot with nothing in it is ABSENT
     rather than an empty shape -- a hole means "put a roman one here", and a
     present-but-empty entry means a blank space where a numeral should be. */
  /* ---- and the calendar --------------------------------------------------
     Nothing to set any more. The year has twelve months and the week has
     seven days, because the widget draws the calendar every reader of it
     already reads -- www/cal.js. What the language does is name them, and
     the stages ask for exactly that many words.
     Lowering is therefore not a thing that can happen, and the case that
     used to be here -- a word for the twelfth month surviving a year of ten
     -- has nothing to survive. */
  out.calMo    = calMonths();
  out.calWk    = calWeek();
  out.calSlots = [stBy('month').slots.length, stBy('wday').slots.length];
  /* Sunday is day one, because that is where a calendar's week starts, and
     both answers are the phone's rather than a count of our own. */
  out.calSun   = calDayOf(new Date(2026, 7, 23));   /* a Sunday */
  out.calSat   = calDayOf(new Date(2026, 7, 22));   /* the Saturday before */
  out.calAug   = calMonthOf(new Date(2026, 7, 23));

  /* A month with a word on it: the widget says the name when there is one
     and the number when there is not, so both have to leave here in the
     shape it expects.

     `all` is whether the font in the App Group will have every letter of it.
     That font is LinguaScript and LinguaScript maps the ROMAN characters, so
     the spelling IS what gets set in the person's letters -- there is nothing
     else to send. One undrawn letter and `all` is false, and the widget sets
     the word plainly rather than with one character in the system serif. */
  var mw = {hw:'Tuvel', mn:'twelfth', pos:'n', at:1, slot:'month.3',
            sp:[{l:numByVal(10).id}, {l:'l5'}]};
  WORDS.push(mw);

  var w = shareWidget();
  out.wMonKey = Object.keys(w.mon).sort().join(' ');
  out.wMonR   = w.mon['3'] && w.mon['3'].r;
  out.wMonAll = !!(w.mon['3'] && w.mon['3'].all);
  /* The mark between the hours and the minutes. A colon unless somebody drew
     one, and `:` is not a letter a language starts with -- so `all` is false
     here and the widget sets a plain colon. */
  out.wSep    = w.sep && w.sep.r;
  out.wSepAll = !!(w.sep && w.sep.all);
  /* the same word with one letter that was never drawn */
  mw.sp = [{l:numByVal(10).id}, {l:numByVal(11).id}];
  out.wMonHole = !!(shareWidget().mon['3'] || {}).all;
  mw.sp = [{l:numByVal(10).id}, {l:'l5'}];
  out.wBase   = w.base;
  out.wDrawn  = !!(w.dg['10'] && w.dg['10'].st && w.dg['10'].st.length);
  out.wNamed  = Object.prototype.hasOwnProperty.call(w.dg, '11');
  out.wBlank  = Object.prototype.hasOwnProperty.call(w.dg, '13');
  out.wFresh  = Object.prototype.hasOwnProperty.call(w.dg, '0');
  out.wKeys   = Object.keys(w.dg).sort().join(' ');

  /* ---- a shape, named after a slot, moves INTO the slot -------------------
     On a plan whose alphabet is fixed. 「aが自作文字に変わる瞬間みたいなの
     見せたい」 -- OWNER DECISION, 2026-08-23.

     The onboarding draws a shape and then asks which letter it is. It used to
     leave two letters called `a`: the slot ltStart() made and the shape just
     drawn -- and the free QWERTY finds its keys by NAME and takes the first,
     so the key marked `a` was the empty one and what somebody had drawn was
     on no key at all.

     Three things are asked here, and the third is the one that matters:
     the shape arrives on the slot, the SLOT is what survives (its id, so
     anything holding that id still resolves), and a slot somebody has
     already drawn on is never overwritten -- there, both letters stay and
     the alphabet shows the duplicate. */
  SET.plan = 'free';
  var slotB = LETTERS.filter(function(l){
    return ltIsBase(l) && String(l.ab||'').toLowerCase() === 'b'; })[0];
  if (!slotB) { slotB = ltNew({}); slotB.ab = 'b'; saveLetters(); }
  out.mvSlot = slotB.id;
  out.mvBefore = LETTERS.length;
  var shape = ltNew({ st: [{ pts: [[o+4*D, o+4*D], [o+12*D, o+12*D]] }] });
  out.mvGrew = LETTERS.length;
  out.mvNow  = ltSetRoman(shape.id, 'b');
  out.mvAfter = LETTERS.length;
  out.mvInk  = !!(ltById(slotB.id) && ltById(slotB.id).st && ltById(slotB.id).st.length);
  out.mvLoose = !!ltById(shape.id);
  out.mvOne  = LETTERS.filter(function(l){
    return String(l.ab||'').toLowerCase() === 'b'; }).length;

  /* a slot with a drawing on it is not touched, and neither letter goes */
  var second = ltNew({ st: [{ pts: [[o+4*D, o+6*D], [o+12*D, o+6*D]] }] });
  out.mvKeepId = ltSetRoman(second.id, 'b');
  out.mvKeepBoth = !!ltById(second.id) && !!ltById(slotB.id);
  /* guarded: with the move taken out this is null, and a check that throws
     says less than one that fails */
  out.mvKeepInk = !!(ltById(slotB.id) && ltById(slotB.id).st &&
                     ltById(slotB.id).st.length === 1);
  out.mvTwo = LETTERS.filter(function(l){
    return String(l.ab||'').toLowerCase() === 'b'; }).length;

  /* and a plan that ADDS letters keeps both, because adding is what it buys */
  SET.plan = 'pro';
  var paid = ltNew({ st: [{ pts: [[o+4*D, o+8*D], [o+12*D, o+8*D]] }] });
  out.mvPaidId = ltSetRoman(paid.id, 'e');
  out.mvPaidSame = out.mvPaidId === paid.id && !!ltById(paid.id);
  SET.plan = 'free';

  /* ---- the rooms are three and the code may not mix them ----------------
     「文字か数字か分けてるのに文字に数字が入るの意味わからないだろ」
     OWNER 2026-09-01. The alphabet, the digits and the marks are three rooms
     (ltKindOf), and a letter belongs to the room it was made in. Nothing here
     throws when it goes wrong: a letter quietly becomes a digit and leaves
     the room somebody made it in, or a number sits among the letters, and
     every screen renders. */
  SET.plan = 'pro';
  function names(nm, prep){
    go('home', '');
    var l = ltNew({}); if (prep) prep(l);
    var was = ltName(l);
    /* ltSave() takes what was typed rather than reading a draft of this
       file's own. www/shell.js § KEEP, 2026-09-03: a letter's page keeps what
       is in its two boxes under the SCREEN, so there is no global to park a
       name in on the way. What is under test is unchanged -- this is the same
       act said in the shape the app now has. */
    var id = ltSave(l.id, { ab: nm }), got = ltById(id) || l;
    return { kind: ltKindOf(got), name: ltName(got), was: was,
             at: here().r + ':' + (here().a || '') };
  }
  /* The slot worth 1 is the one this names, and it has to be the EMPTY slot
     ltStart() made -- the fixture has drawn on its digits, and a digit somebody
     drew on is the case two claims below. So the ink comes off first: what is
     under test here is a letter arriving at a value nobody has drawn. */
  var slot1 = numByVal(1);
  if (slot1) { delete slot1.st; delete slot1.sh; slot1.ch = ''; }
  var slot1id = slot1 ? slot1.id : '';
  var digitsBefore = numDigits().length;
  out.rmTaken   = names('1');            /* the digit worth 1 already exists */
  out.rmSlotGone = !ltById(slot1id);
  out.rmKeeps   = names('1', function(l){ l.ab = 'q'; });
  out.rmBig     = names('25');           /* base ten writes no such digit */
  out.rmPlain   = names('zz');           /* the control: an ordinary name */
  out.rmNoDigit = numDigits().length === digitsBefore;
  out.rmDigitDelta = numDigits().length - digitsBefore;

  /* a value nothing holds: the digit is MADE, and the count goes up by one */
  numSetBase(14);
  var freeSlot = numByVal(12); if (freeSlot) ltDel(freeSlot.id);
  var digitsFree = numDigits().length;
  out.rmFree = names('12');
  out.rmFreeGrew = numDigits().length - digitsFree;
  numSetBase(10);

  /* The other half of the DELETE REVIEW written over ltToDigit(): the row that
     may go is the EMPTY slot the app made for that value, and nothing else. A
     digit somebody has DRAWN on is left exactly where it is, so what arrives is
     a SECOND digit of that value. 「別に課金なんだから追加しろよなんで？」 */
  var drawn = numByVal(3);
  if (drawn) drawn.st = [{ pts: [[o + 3 * D, o + 3 * D], [o + 9 * D, o + 9 * D]] }];
  var threes = LETTERS.filter(function(l){ return l.val === 3; }).length;
  out.rmDrawn = names('3');
  out.rmDrawnKept = !!(drawn && ltById(drawn.id) &&
                       ltById(drawn.id).st && ltById(drawn.id).st.length === 1);
  out.rmDrawnTwo = LETTERS.filter(function(l){ return l.val === 3; }).length - threes;

  /* There was a third road onto this rule — ltCopy(), the 複製する row on a
     letter's page — and two claims here held it. The row went on 2026-09-01
     (「後複製するボタンいらんやろ」), and the function with it, so the claims
     went too rather than being kept alive against a road nobody can take. */
  /* ---- a slot is emptied, never removed --------------------------------
     「aって入ってた枠が残るの無料枠は。追加分しか枠ごと消せない」
     「1〜38は消えないようにしてるんでしょ？ナンバリングもおかしくなるよ！」
     OWNER 2026-09-02.

     On free ltDelete() refuses outright. On a PAID plan it did not, and the
     row went -- so `a` could be deleted out of the alphabet, the QWERTY's `a`
     key was left answering to nothing (kbFixed() finds keys BY NAME), and
     every number after it moved up one.

     What a delete does to one of the thirty-eight is take the DRAWING off.
     A letter somebody ADDED is a different thing and goes whole. */
  SET.plan = 'pro';
  var aLt = LETTERS.filter(function(l){ return String(l.ab || '') === 'a'; })[0];
  if (aLt) aLt.st = [{ pts: [[o + 3 * D, o + 3 * D], [o + 9 * D, o + 9 * D]] }];
  /* `qx` and not `zz`: rmPlain above already made a letter called zz, so a
     check for 「it is gone」 would find that one and read as a failure. */
  var addedLt = ltNew({}); addedLt.ab = 'qx';
  addedLt.st = [{ pts: [[o, o], [o + D, o + D]] }];
  saveLetters();
  out.slotBefore = LETTERS.length;
  out.orderBefore = ltOrder(ltOfKind('alpha')).map(ltName).join(' ');
  ltDeleteGo(aLt.id);
  var aAfter = LETTERS.filter(function(l){ return String(l.ab || '') === 'a'; })[0];
  out.slotStays = !!aAfter;
  out.slotEmpty = !!(aAfter && !inkGeo(aAfter));
  out.slotNamed = aAfter ? ltName(aAfter) : '';
  out.slotCount = LETTERS.length;
  out.orderAfter = ltOrder(ltOfKind('alpha')).map(ltName).join(' ');
  ltDeleteGo(addedLt.id);
  out.addedCount = LETTERS.length;
  out.addedGone = !LETTERS.filter(function(l){ return String(l.ab || '') === 'qx'; }).length;

  SET.plan = 'free';
  /* ---- the first thirty-eight carry no ⊖, and every ⊖ works -------------
     「a-z 0-9 !?に1からナンバリングしてそれ以降に追加されるのは消す」
     「次に文字追加したら39になるよね？39以降は消せるんだよね？」OWNER
     2026-09-02, after 「長押しの後から-の3個目以降に普通に反応しなくなる」 on
     a phone: the mark was drawn on all thirty-eight and pressing it opened a
     question whose yes did not move the screen by one pixel. Nothing threw.
     The letters somebody has drawn come first in an alphabet, so it looked
     like the mark worked twice and then died.

     Two claims and they are one rule: no mark on the thirty-eight, and every
     mark that IS drawn takes the letter away. */
  /* EVERY PAGE THE ALPHABET IS SPLIT ACROSS, and not just the letters.
     「それはページが分かれていてもだよ？」OWNER 2026-09-02: a-z is one page,
     0-9 another, ! ? another, and the numbering runs 1 to 38 across all of
     them. ltCanDelete() asks the LETTER and not the page, so this walks every
     kind rather than trusting that. */
  SET.plan = 'pro';
  var baseSeen = 0, baseMarks = 0, kindsWalked = [];
  LT_KINDS.forEach(function(k){
    goTab('build'); go('ltset', k); ltWob = true; render();
    kindsWalked.push(k);
    Array.prototype.slice.call(document.querySelectorAll('#app .ltx'))
      .forEach(function(x){
        var id = (x.getAttribute('data-a') || '').replace(/[\[\]"]/g, '');
        var l = ltById(id);
        if (l && ltIsBase(l)) baseMarks++;
      });
  });
  baseSeen = LETTERS.filter(ltIsBase).length;
  goTab('build'); go('ltset', LT_KINDS[0]); ltWob = true; render();
  /* WHICH LETTERS THE MARKS NAME. Read off the marks themselves rather than
     off the cells: a cell in this state carries no id at all (it does not
     open, so it has no DO), and the ⊖ is the only thing on it that names the
     letter it is about. */
  function markIds(){
    return Array.prototype.slice.call(document.querySelectorAll('#app .ltx'))
      .map(function(x){ return (x.getAttribute('data-a') || '').replace(/[\[\]"]/g, ''); })
      .filter(Boolean);
  }
  /* and one added letter, which is the thirty-ninth */
  var addedId = ltNew({ nm: 'zz9' }).id;
  saveLetters(); render();
  var addedMarked = markIds().indexOf(addedId) >= 0;

  var mv = 0, dd = 0, tr = 0, popless = 0;
  while (tr < 40) {
    var marks = document.querySelectorAll('#app .ltx');
    if (!marks.length) break;
    tr++;
    var was = document.getElementById('app').innerHTML;
    marks[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    var y = null;
    Array.prototype.slice.call(document.querySelectorAll('#pop button'))
      .forEach(function(b){ if (b.getAttribute('data-do') === 'popYes') y = b; });
    if (!y) { popless++; break; }
    y.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    if (document.getElementById('app').innerHTML === was) dd++; else mv++;
  }
  out.wob = { pressed: tr, moved: mv, dead: dd, popless: popless,
              baseSeen: baseSeen, baseMarks: baseMarks, addedMarked: addedMarked,
              kinds: kindsWalked };

  /* ---- the same slot is the same row on every phone ----------------------
     「あと、キーボードを足したりしてたら文字増殖してるんだけど何で？」OWNER
     2026-09-04, and the alphabet had come out A A B B C C with every reading
     twice. ltStart() minted its ids out of LT_SEQ, which counts from zero
     every launch, so the SAME slot was `l1_0_0` on one run and `l39_0_0` on
     another -- and syArr() puts two copies of a language together by a
     letter's ID and nothing else, so thirty-eight and thirty-eight came back
     seventy-six.

     Asked of the two ends it actually breaks at. The ids first: ltStart() run
     at three different points of one session, which is a first launch, a
     second language opened after it, and another phone starting from zero.
     Then the MERGE, through the real syMerge() with the real slices, because
     the ids agreeing is only the reason -- what the owner is looking at is
     the count. */
  SET.plan = 'free';
  var wasLts = LETTERS;
  function slotIds(){
    var m = {}, i, k;
    for (i = 0; i < LETTERS.length; i++) {
      k = ltSlotKey(LETTERS[i]);
      if (k) m[k] = LETTERS[i].id;
    }
    return m;
  }
  LT_SEQ = 0; LETTERS = []; ltStart();
  var runA = slotIds(), packA = JSON.stringify(LETTERS);
  LETTERS = []; ltStart();                       /* later in the same session */
  var runB = slotIds(), packB = JSON.stringify(LETTERS);
  LT_SEQ = 0; LETTERS = []; ltStart();           /* another phone, from zero */
  var runC = slotIds();
  var keys = [], k2;
  for (k2 in runA) if (Object.prototype.hasOwnProperty.call(runA, k2)) keys.push(k2);
  out.slotN = keys.length;
  out.slotSame = keys.filter(function(k){
    return runB[k] === runA[k] && runC[k] === runA[k]; }).length;
  out.slotA = runA.a || '';

  var merged = JSON.parse(syMerge('letters', packA, packB));
  var byName = {}, dupes = [];
  merged.forEach(function(l){
    var n = String(ltName(l));
    byName[n] = (byName[n] || 0) + 1;
  });
  for (k2 in byName)
    if (Object.prototype.hasOwnProperty.call(byName, k2) && byName[k2] > 1) dupes.push(k2);
  out.mgN = merged.length;
  out.mgDup = dupes.sort().join(' ');
  LETTERS = merged;
  out.mgSeen = ltSeen().length;                  /* free hides none of them */
  LETTERS = wasLts;

  return out;
}, { s: seed.toString() });
await br.close();

var bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

say(r.start === 10, 'a language starts with ten digits');
say(r.grew === 14, 'raising the base to 14 makes the slots at once (' + r.grew + ')');
say(!!r.kept && r.kept.every(Boolean), 'the drawn, the named and the one with a sound all survive the base going back to 10');
say(r.drawnStill, 'and the drawn one still has its strokes');
say(r.blankGone, 'the empty slot nobody touched is gone');
say(r.red === 3, 'three digits are above the base and the room paints them red (' + r.red + ')');
say(r.slotBack, 'raising it again makes the empty slot over');
say(r.noDouble === 1, 'and makes exactly one of it (' + r.noDouble + ')');
say(r.freeRow !== '', 'free sees the same row as everybody else');
say(r.freeAsked, 'and pressing it puts the upgrade up rather than doing nothing');
say(r.freeBase === r.freeWas, 'and the base is where it was until somebody pays (' +
    r.freeWas + ' -> ' + r.freeBase + ')');

/* 「無料で作ってる範囲の名前変更は無しでしょ。有料は追加できるというだけで」
   Decision log, 2026-08-22. The free QWERTY finds its keys BY NAME, so a
   renamed slot is a key that cannot be found and ltStart() fills the hole
   with a new empty letter -- what somebody drew stays in the alphabet and
   leaves the keyboard, with nothing saying why.

   The letter page already hides the field. A screen is not a rule:
   ltSetRoman() is reachable from anywhere. So it is asked of the FUNCTION,
   on the PAID plan, which is the only plan where the question arises. */
say(r.slotNow === r.slotWas,
    'the a slot keeps its name on the paid plan (' + r.slotWas + ' -> ' + r.slotNow + ')');
say(r.digNow === r.digWas,
    'and so does a digit (' + r.digWas + ' -> ' + r.digNow + ')');
say(r.mineNow === 'qeq',
    'a letter somebody ADDED is still theirs to name (' + r.mineNow + ') -- ' +
    'paid buys adding letters, and refusing to name one refuses what was bought');

say(r.wBase === 14, 'the widget is told the base, not a fixed ten (' + r.wBase + ')');
say(r.wDrawn, 'a drawn digit goes out with its ink on it');
say(!r.wNamed, 'a digit that was named but never drawn does not, so the clock uses a roman one');
say(!r.wBlank, 'nor does an untouched slot');
say(!r.wFresh, 'nor do the ten a fresh language starts with, which nobody has drawn');
/* Two, and naming both is the point: the fixture's own 1 and the 10 this
   check drew above. A count alone would go on passing if the wrong one of
   them dropped out. */
say(r.wKeys === '1 10', 'exactly the digits with ink on them go out (' + r.wKeys + ')');

say(r.wMonKey === '3', 'only the months somebody named go out (' + r.wMonKey + ')');
say(r.wMonR === 'Tuvel', 'with the roman spelling, always (' + r.wMonR + ')');
say(r.wMonAll, 'and that the font will have every letter of it');
say(!r.wMonHole, 'one undrawn letter and it says so, so the widget sets the word plainly');
say(r.wSep === ':', 'the clock is told what goes between the hours and the minutes (' + r.wSep + ')');
say(!r.wSepAll, 'and that nobody drew one, so it is a plain colon');

say(r.calMo === 12 && r.calWk === 7,
    'twelve months and seven days, and neither is a setting (' + r.calMo + ', ' + r.calWk + ')');
say(String(r.calSlots) === '12,7', 'and the stages ask for exactly that many words (' + r.calSlots + ')');
say(r.calSun === 1, 'Sunday is day one, because that is where a calendar starts (' + r.calSun + ')');
say(r.calSat === 7, 'and Saturday is the last (' + r.calSat + ')');
say(r.calAug === 8, 'the month is the phone\'s, not a year cut into parts (' + r.calAug + ')');

say(r.mvGrew === r.mvBefore + 1, 'a shape drawn is a letter of its own until it is named');
say(r.mvAfter === r.mvBefore, 'naming it after a slot leaves the alphabet the size it was ('
    + r.mvBefore + ' -> ' + r.mvAfter + ')');
say(r.mvNow === r.mvSlot, 'and the SLOT is what survives, by its own id');
say(r.mvInk, 'with the drawing on it');
say(!r.mvLoose, 'and the two-second-old row it was copied from is gone');
say(r.mvOne === 1, 'one letter called b, so the key marked b is that letter (' + r.mvOne + ')');
say(r.mvKeepId !== r.mvSlot, 'a slot ALREADY drawn on does not take a second shape');
say(r.mvKeepBoth && r.mvKeepInk, 'both letters stay and the first drawing is untouched');
say(r.mvTwo === 2, 'which is the duplicate the alphabet shows in red (' + r.mvTwo + ')');
say(r.mvPaidSame, 'and on a plan that adds letters nothing moves at all');

/* the three rooms, and the roads that used to cross between them */
/* 「まだ数字が普通にアルファベットのとこ入るし」 OWNER 2026-09-01, on a phone,
   looking at 名前なし sitting in the alphabet. Earlier the same day this road
   REFUSED the name and walked to the digits room, which left the letter behind
   in the room it was supposed to leave; these claims are the moved side of
   that, and the refusing side is superseded. */
say(r.rmTaken.kind === 'num' && r.rmNoDigit,
    'a number typed on a letter MOVES it: the letter becomes that digit, and ' +
    'the empty slot the app had made for the value goes with it, so the count ' +
    'does not move (' + r.rmTaken.kind + ', ' + r.rmDigitDelta + ')');
say(r.rmSlotGone,
    'and the empty slot the app had made for that value is the row that goes ' +
    '-- no drawing, no borrowed character, never touched by anybody');
say(r.rmTaken.at === 'ltset:num',
    'and it lands in the room where digits are, not the one it left (' +
    r.rmTaken.at + ')');
say(r.rmKeeps.kind === 'num' && r.rmKeeps.name !== 'q',
    'a letter that had a name goes too -- typing a number over `q` is the ' +
    'rename somebody asked for (' + r.rmKeeps.kind + '/' +
    (r.rmKeeps.name || 'unnamed') + ')');
say(r.rmFree.kind === 'num' && r.rmFreeGrew === 1,
    'and when the value is FREE the digit is MADE, one of it (' +
    r.rmFree.kind + ', +' + r.rmFreeGrew + ')');
say(r.rmDrawnKept && r.rmDrawnTwo === 1,
    'but a digit somebody DREW on is never the row that goes: it keeps its ' +
    'strokes and the letter arrives beside it, two of that value (' +
    (r.rmDrawnKept ? 'kept' : 'LOST') + ', +' + r.rmDrawnTwo + ')');
say(r.slotStays && r.slotEmpty && r.slotNamed === 'a',
    'deleting one of the thirty-eight takes the DRAWING off and leaves the ' +
    'slot — 「aって入ってた枠が残る」 (' +
    (r.slotStays ? 'still there' : 'GONE') + ', ' +
    (r.slotEmpty ? 'empty' : 'STILL DRAWN') + ', called ' +
    (r.slotNamed || 'nothing') + ')');
say(r.slotCount === r.slotBefore && r.orderAfter === r.orderBefore,
    'so nothing is renumbered — 「ナンバリングもおかしくなるよ」: the alphabet ' +
    'is the same length and in the same order (' + r.slotBefore + ' -> ' +
    r.slotCount + ')');
say(r.addedGone && r.addedCount === r.slotCount - 1,
    'and a letter somebody ADDED goes whole, which is the only kind that may ' +
    '(' + r.slotCount + ' -> ' + r.addedCount + ')');
say(r.rmBig.kind === 'alpha' && r.rmBig.name === '25',
    'a number no base of this language can write is an ordinary name, on ' +
    'this road as on a sheet — one rule, both roads (' + r.rmBig.name + ')');
say(r.rmPlain.kind === 'alpha' && r.rmPlain.name === 'zz' && r.rmPlain.at !== 'ltset:num',
    'and an ordinary name is still just a name, going nowhere (' +
    r.rmPlain.name + ' at ' + r.rmPlain.at + ')');

say(r.wob && r.wob.baseMarks === 0,
    'not one of the first thirty-eight carries a ⊖ — on any of the pages the ' +
    'alphabet is split across, because the numbering runs 1 to 38 through ' +
    'all of them (' +
    (r.wob ? r.wob.baseMarks + ' of ' + r.wob.baseSeen + ', pages: ' +
             r.wob.kinds.join(' ') : '?') + ')');
say(r.wob && r.wob.addedMarked,
    'the thirty-ninth, the first letter somebody adds, carries one');
say(r.wob && r.wob.pressed > 0 && r.wob.popless === 0 &&
    r.wob.dead === 0 && r.wob.moved === r.wob.pressed,
    'and every ⊖ that is drawn takes its letter away (' +
    (r.wob ? r.wob.moved + ' of ' + r.wob.pressed : '?') + ')');

say(r.slotN === 38 && r.slotSame === 38,
    'a slot wears the same id whenever ltStart runs -- first launch, a second ' +
    'language later in the same session, and another phone from zero (' +
    r.slotSame + ' of ' + r.slotN + ' agree, `a` is ' + (r.slotA || 'nothing') + ')');
say(r.mgN === 38 && r.mgDup === '',
    'so two copies of one free language merge back to thirty-eight and not ' +
    'seventy-six -- 「文字増殖してるんだけど何で？」 (' + r.mgN + ' letters, ' +
    'doubled names: ' + (r.mgDup || 'none') + ')');
say(r.mgSeen === 38,
    'and the free plan is looking at all of them, so a double would have been ' +
    'on the screen rather than hidden (' + r.mgSeen + ' seen)');

if (bad.length) { console.error('\nbase: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nbase: slots arrive when asked, and nothing drawn is ever taken away.');
