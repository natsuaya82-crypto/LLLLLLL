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
        form, is still in WORDS byte for byte after a save, and is in no list
        and no count
     4. a form placed by hand wins over what a rule makes of the same label
     5. a derivation is a form too (OWNER 2026-10-01): saving a noun on the
        new-word screen with a diminutive rule writes that one word and no
        other, the word's page shows the diminutive under its label, and a
        derived word somebody already has is still there byte for byte

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
  netSaveNow = function (cb) { if (cb) cb(true); };
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
  out.oldListed = wordsSeen().some(function (w) { return String(w.hw) === 'tira'; });
  out.oldCounted = WORDS.length - wCountable();

  /* 4 -- the fixture's plural rule reaches `sar`; a plural placed on it wins */
  var ruleMade = wFormOf(findWord('sar'), 'pl');
  out.ruleBy = ruleMade ? ruleMade.by : '';
  findWord('sar').fms = [{ fm:'pl', hw:'saren', sp:[] }];
  var won = wFormOf(findWord('sar'), 'pl');
  out.placedWins = won ? (won.by + ':' + won.hw) : '';
  delete findWord('sar').fms;

  /* 5 -- the fixture's `fr2` is a diminutive for every part of speech. An
     older derived word is put in the way addFmWrite() used to write one. */
  var oldDer = { hw:'sark', pos:'n', at:5, from:'sar', fm:'dim',
                 sp:[{ l:'l1', u:'s' }, { l:'l1', u:'a' }, { l:'l1', u:'r' }, { l:'l1', u:'k' }],
                 mns:[], mn:'' };
  WORDS.push(oldDer); save();
  var oldDerWas = JSON.stringify(oldDer);
  var n5 = WORDS.length;
  addPos = 'n';
  openAdd('');
  wdSetLn('tamo');
  out.sheetOffers = document.querySelectorAll('#app [data-do="addFmDrop"]').length;
  keepPress();
  await new Promise(function (res) { setTimeout(res, 50); });
  out.derAdded = WORDS.length - n5;
  out.derWords = WORDS.filter(function (w) { return w.from === 'tamo'; })
                      .map(function (w) { return w.hw; }).join(' ');
  var dim = findWord('tamo') ? wFormOf(findWord('tamo'), 'dim') : null;
  out.derForm = dim ? (dim.by + ':' + dim.hw) : '';
  openWord('tamo');
  /* In the list of FORMS -- a row that opens the form's screen. The family
     draws a derived word as a .wdrow too, so the class alone was green with
     the old road in. */
  out.derOnPage = Array.prototype.some.call(document.querySelectorAll('#app .wdrow[data-do="openWfm"]'), function (b) {
    var f = b.querySelector('.wdrowf'), w = b.querySelector('.wdroww');
    return !!f && !!w && f.textContent === fmLabel('dim') && w.textContent.indexOf('tamok') >= 0;
  });
  var still = findWord('sark');
  out.oldDerKept = !!still && JSON.stringify(still) === oldDerWas;
  out.oldDerListed = wordsSeen().some(function (w) { return String(w.hw) === 'sark'; });

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
say(!r.oldListed, 'but it is not in the dictionary list -- it is listed under its word');
say(r.oldCounted === 2, 'and neither of the two stored that way is counted (' + r.oldCounted + ' left out)');
say(r.ruleBy === 'rule', 'a rule answers for a label nobody placed (' + (r.ruleBy || 'nothing') + ')');
say(r.placedWins === 'placed:saren', 'and a form placed by hand wins over it (' + (r.placedWins || 'nothing') + ')');
say(r.sheetOffers === 0, 'the new-word screen offers no derived word to write with it (' + r.sheetOffers + ' rows)');
say(r.derAdded === 1 && !r.derWords, 'saving a noun with a diminutive rule adds that one word and no other (' +
    r.derAdded + ' added' + (r.derWords ? ': ' + r.derWords : '') + ')');
say(r.derForm === 'rule:tamok', 'and the diminutive is a form of it, made by the rule (' + (r.derForm || 'nothing') + ')');
say(r.derOnPage, 'and the word\'s page lists it among its forms, under its label');
say(r.oldDerKept, 'a derived word somebody already has is still in the dictionary, byte for byte');
say(r.oldDerListed, 'and still in the dictionary list');
say(!pageErrors.length, 'and the page threw nothing' + (pageErrors.length ? ' (' + pageErrors[0] + ')' : ''));

if (bad.length) { console.error('\nforms: ' + bad.length + ' FAILED'); process.exit(1); }
console.log('\nforms: an inflection is not a word, and neither is what a derivation rule makes --' +
  ' it is written on its word, with a label and a form or not at all, an old one is read where' +
  ' it is and kept, and a placed one wins over the rule.');
