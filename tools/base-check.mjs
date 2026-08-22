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

if (bad.length) { console.error('\nbase: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nbase: slots arrive when asked, and nothing drawn is ever taken away.');
