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
  SET.done = true; SET.plan = 'plus';
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

  /* free has no row to press */
  SET.plan = 'free';
  out.freeRow = numBaseRows();
  SET.plan = 'plus';

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
say(r.freeRow === '', 'free counts in ten and has no row to press');

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

if (bad.length) { console.error('\nbase: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nbase: slots arrive when asked, and nothing drawn is ever taken away.');
