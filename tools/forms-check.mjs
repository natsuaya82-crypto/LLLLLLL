/* tools/forms-check.mjs — an inflection is not a word.

   「語ページの活用一覧に出てくる。活用は活用であって単語じゃない。その代わり活用
   にはラベルが必要。原型 aa／未来形 aai。ラベルと単語がセットじゃないと登録でき
   ない。」 OWNER 2026-09-23.

   Nothing about any of this throws. A form written into the dictionary as a
   word renders, counts and converts perfectly; it is simply the thing the owner
   said it is not. So what is asked here is what the app DID -- through the real
   screen's save (keepSave(), the corner's button, which is the only caller of a
   screen's save there is) and the real wForms():

     1. saving a form writes the form ON the word and not one word into WORDS
     2. a label with no form, or a form with no label, writes nothing
     3. an inflection stored as a word before that day is read as its parent's
        form, and is still in the dictionary byte for byte after a save
     4. a form placed by hand wins over what a rule makes of the same label
     5. a rule for an inflection offers no word to make; only a derivation does

   The ceiling is tools/plan-check.mjs's, the keyboard's conversion is
   tools/conv-check.mjs's and the meaning line is
   tools/grammar-engine-check.mjs's -- each where the rest of that subject is. */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport: { width: 390, height: 844 } });
const pageErrors = [];
pg.on('pageerror', (e) => pageErrors.push(String(e && e.message || e)));
await pg.goto('file://' + path.join(dir, '..', 'www', 'index.html'));
await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });

const r = await pg.evaluate(async ({ s }) => {
  eval('(' + s + ')()');
  SET.walked = true;
  /* The send is the server's and there is none here: a save that did not land
     is taken back (keepBack), which would make every claim below about a
     refusal. Everything else about the press is the real one. */
  netSaveNow = function (cb) { cb(true); };
  /* What a refused save goes back to is what was WRITTEN (keepBack), and the
     fixture puts its rules and words in memory without writing them -- so a
     refusal would take the rules away with it, which no phone can be in. */
  saveStg(); save();
  var out = {};
  var tir = function () { return findWord('tir'); };
  var fmsOf = function () { return JSON.stringify(tir().fms || []); };
  /* The form's screen, opened, typed into and saved the way a thumb does:
     the label arrives by keepSet() from the list it is chosen on, the form by
     the field's own IN(), and Save is keepPress(). */
  /* Each try starts from an empty screen: what a refused save leaves in the
     fields is kept for the person to press again (www/shell.js § keepSave),
     and the next try here is a different person. */
  function write(was, fm, f) {
    keepDrop(keepKeyOf('form', wfmKey('tir', was)));
    openWfm('tir', was);
    if (fm !== null) keepSet('fm', fm);
    if (f !== null) wfmSetF(f);
    keepPress();
    return new Promise(function (res) { setTimeout(res, 50); });
  }

  /* 1 */
  var n = WORDS.length, before = fmsOf();
  await write('', 'cnd', 'tirse');
  out.wordsAfter = WORDS.length - n;
  out.placed = (tir().fms || []).filter(function (x) { return x.fm === 'cnd'; })
                                 .map(function (x) { return x.hw; }).join(' ');
  out.onList = wordsSeen().some(function (w) { return String(w.hw) === 'tirse'; });

  /* 2 */
  var mid = fmsOf();
  await write('', 'imp', null);
  out.labelOnly = fmsOf() === mid;
  await write('', null, 'tirqq');
  out.formOnly = fmsOf() === mid;
  out.halfWords = WORDS.length - n;

  /* 3 */
  var old = JSON.stringify(findWord('tira'));
  var f = wFormOf(tir(), 'pst');
  out.oldRead = f ? (f.by + ':' + f.hw) : '';
  save();
  out.oldKept = JSON.stringify(findWord('tira')) === old;

  /* 4 -- the fixture's plural rule reaches `sar`; a plural placed on it wins */
  var ruleMade = wFormOf(findWord('sar'), 'pl');
  out.ruleBy = ruleMade ? ruleMade.by : '';
  findWord('sar').fms = [{ fm:'pl', hw:'saren', sp:[] }];
  var won = wFormOf(findWord('sar'), 'pl');
  out.placedWins = won ? (won.by + ':' + won.hw) : '';
  delete findWord('sar').fms;

  /* 5 */
  out.todo = fmrTodo(findWord('sar')).map(function (m) { return m.fm; }).join(' ');

  out.before = before;
  return out;
}, { s: seed.toString() });

await br.close();

const bad = [];
function say(ok, line) { console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

say(r.wordsAfter === 0, 'saving a form adds no word to the dictionary (' + r.wordsAfter + ' added)');
say(r.placed === 'tirse', 'and the form is on its word, under its label (' + (r.placed || 'nothing') + ')');
say(!r.onList, 'and the dictionary list does not show it');
say(r.labelOnly, 'a label with no form writes nothing');
say(r.formOnly, 'a form with no label writes nothing');
say(r.halfWords === 0, 'and neither makes a word');
say(r.oldRead === 'old:tira',
    'an inflection stored as a word before 2026-09-23 is read as its parent\'s form (' + (r.oldRead || 'not at all') + ')');
say(r.oldKept, 'and it is still in the dictionary, byte for byte, after a save');
say(r.ruleBy === 'rule', 'a rule answers for a label nobody placed (' + (r.ruleBy || 'nothing') + ')');
say(r.placedWins === 'placed:saren', 'and a form placed by hand wins over it (' + (r.placedWins || 'nothing') + ')');
say(r.todo === 'dim', 'a rule for an inflection offers no word to make -- only the derivation does (' + (r.todo || 'nothing') + ')');
say(!pageErrors.length, 'and the page threw nothing' + (pageErrors.length ? ' (' + pageErrors[0] + ')' : ''));

if (bad.length) { console.error('\nforms: ' + bad.length + ' FAILED'); process.exit(1); }
console.log('\nforms: an inflection is not a word -- it is written on its word, with a label and a' +
  ' form or not at all, an old one is read where it is and kept, and a placed one' +
  ' wins over the rule.');
