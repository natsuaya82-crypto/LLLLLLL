/* ---------------------------------------------------------------------------
   tools/word-check.mjs — a word you were looking at is still the word you
   were looking at after you change it.

   Run it:   node tools/word-check.mjs

   The dictionary is a place you move around in: a word page names its family,
   its synonyms and its opposites, every one of those is a row you press, and
   each lands you on another word page. So the trail behind you is a list of
   words, and `back()` walks it.

   A word is not a fixed thing. Its spelling is the only name it has, and
   editing a word can change it — that is what editing a word mostly IS. So
   `wRename()` goes round telling everything that points at a word its new
   name: the words derived from it, what means the same, what means the
   opposite, the lines it appears in. The trail points at it too, and nobody
   was telling the trail.

   What that looked like: open a word, press Edit, change one letter, Save —
   and land on "that is no longer here". Not an error, not a blank screen, and
   nothing thrown; the word was saved perfectly, under its new name, and the
   screen behind you was still asking for the old one. Deleting had the same
   shape: the page of the word you just deleted is still on the trail.

   Neither can be caught by pressing buttons. press-check builds a screen,
   presses one thing and rebuilds — it never presses two in a row, and this
   needs three: open, edit, save. So it is here, driving the real functions in
   the real app against the shared fixture.

   Exit code is 0 only when every case holds.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { seed } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const PORT = 8144;

const mime = (f) => f.endsWith('.html') ? 'text/html; charset=utf-8'
  : f.endsWith('.js') ? 'application/javascript; charset=utf-8'
  : 'text/plain; charset=utf-8';
const srv = http.createServer((rq, rs) => {
  const f = path.join(ROOT, rq.url === '/' ? 'index.html' : rq.url.split('?')[0]);
  let d = null;
  try { d = fs.readFileSync(f); } catch (e) { d = null; }
  if (d === null) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': mime(f) });
  rs.end(d);
});
await new Promise(r => srv.listen(PORT, r));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage();
await pg.goto(`http://127.0.0.1:${PORT}/`);
await pg.waitForTimeout(300);
await pg.evaluate('window.__seed = ' + seed.toString());

const R = await pg.evaluate(() => {
  const out = { fails: [], said: [] };
  const start = () => {
    window.__seed(); SET.done = true; SET.plan = 'pro';
    window.route = 'words'; NAV = [{ r: 'words' }];
  };
  const screen = () => {
    render();
    const a = document.getElementById('app');
    return a ? a.textContent : '';
  };

  /* ---- a word renamed from its own page ---------------------------------
     Open it, edit it, lengthen the spelling by one step so the headword
     changes, save. The screen left in front of you must be the word — under
     its new name — and not the one the trail was still asking for. */
  start();
  openWord('tira');
  openEdit('tira');
  wEdit.sp = wEdit.sp.concat([JSON.parse(JSON.stringify(wEdit.sp[wEdit.sp.length - 1]))]);
  wdSync();
  /* Writing it down and walking off it are two acts since 2026-09-03 -- Save
     writes and stays, and the arrow is what leaves (www/shell.js § KEEP). What
     is under test is the same and is the second half: the trail followed the
     rename, so the page behind the sheet is the word under its NEW name. */
  wdWrite();
  back();
  const named = WORDS.filter(w => w.from === 'tir' && w.hw !== 'tiran' &&
                                  w.hw !== 'tiror' && w.hw !== 'tirok')[0];
  const now = named ? named.hw : '(the word is gone)';
  const seen = screen();
  out.said.push('a word renamed from its own page is ' + now);
  if (here().r !== 'form' || here().a !== 'word:' + now)
    out.fails.push('renamed to ' + now + ', and the screen behind is ' +
                   JSON.stringify(here()) + ' -- the trail still names the old word');
  if (seen.indexOf(now) < 0)
    out.fails.push('renamed to ' + now + ', and its page does not say so: ' +
                   JSON.stringify(seen.slice(0, 80)));

  /* ---- a word deleted from its own page ---------------------------------
     Same three steps, ending in Delete. The word is gone, so its page cannot
     be where you are put back down -- the trail has to lose it as well. */
  start();
  openWord('tira');
  openEdit('tira');
  /* The question is the app's own popup now, not the system's -- 「標準は
     使わねえって言ってるだろこれも禁止や」 OWNER 2026-09-01. Stubbing
     window.confirm answered a question nobody asks any more, so the delete
     never happened and this read the screen it was standing on before. */
  delWord();
  if (popOn()) popYes();
  out.said.push('a word deleted from its own page leaves you on ' +
                JSON.stringify(here()));
  if (here().r === 'form' && String(here().a).indexOf('tira') >= 0)
    out.fails.push('deleted tira, and the screen behind is ' +
                   JSON.stringify(here()) + ' -- the trail still names it');
  /* Not "the screen does not say tira" -- tiran and tirara both contain it.
     What must not be there is the screen that says the thing you asked for
     has gone, which is what you got by being put back down on its page. */
  if (screen().indexOf(t('form.gone')) >= 0)
    out.fails.push('deleted tira, and you were put down on "that is no longer here"');

  /* ---- the add sheet arrived at cold ------------------------------------
     `openAdd()` decides whether the sheet is NEW by asking whether the route
     is already the one it is about to open. That is right on the two roads it
     was written for -- the sheet reopening by its own redraw, and coming back
     from the picker -- because on both of those the draft exists and what has
     been typed must survive.

     It is wrong on the third road, which is arriving AT that route with no
     draft: a reload, a deep link, anything that puts the route back before
     the draft. `here()` already says `form:add:<parent>`, so `fresh` is
     false, so `addW` and `wEdit` are left null, and `wdFormHTML()` throws
     into vForm's catch. The screen says the form is gone -- about a form
     nobody has opened yet.

     "Empty" and "broken" sharing a branch, which is the rule at the head of
     CLAUDE.md. There is nothing to preserve when there is no draft, so the
     absence of one is what makes a sheet new -- not where the trail happens
     to be pointing. */
  start();
  NAV = [{ r: 'words' }, { r: 'form', a: 'add:tira' }];
  window.route = 'form';
  FORM = null; addW = null; wEdit = null;
  let threw = '';
  let cold = '';
  try { cold = screen(); } catch (e) { threw = String(e && e.message || e); }
  out.said.push('the add sheet arrived at cold ' +
    (threw ? 'THREW ' + threw : 'built ' + (addW ? 'a draft' : 'NO draft')));
  if (threw)
    out.fails.push('arriving at form:add:tira with no draft threw: ' + threw);
  else if (cold.indexOf(t('form.gone')) >= 0)
    out.fails.push('arriving at form:add:tira with no draft says "that is no ' +
      'longer here" -- about a sheet nobody has opened. Empty is not broken.');
  else if (!addW || !wEdit)
    out.fails.push('arriving at form:add:tira left addW/wEdit null, so the ' +
      'next thing to read either is what actually breaks');

  /* ---- and the road the route test was written FOR still works ----------
     The fix above widens `fresh`, so the thing to prove is that it did not
     widen it onto the case the test exists for: the sheet reopening by its
     own redraw must not throw away what has been typed. Reasoning that
     `!addW || !wEdit` is false when a draft exists is not proof -- the whole
     bug being fixed here was a branch that looked obviously right. */
  start();
  openAdd('');
  wEdit.nt = 'typed and not saved';
  wEdit.mns = [{ mn: 'a meaning somebody wrote' }];
  openAdd('');                                   /* the redraw road */
  out.said.push('the add sheet reopened by its own redraw keeps what was ' +
    'typed: ' + ((wEdit && wEdit.nt === 'typed and not saved') ? 'yes' : 'NO'));
  if (!wEdit || wEdit.nt !== 'typed and not saved')
    out.fails.push('reopening the add sheet threw away what was typed -- the ' +
      'route test exists to stop exactly this');
  if (!wEdit || !wEdit.mns.length)
    out.fails.push('reopening the add sheet threw away the meanings');

  /* ---- Save does not throw away what the word already carried -----------
     `ph` is the sounds a word carries. An import writes it -- a list with a
     pronunciation column puts that column on the word (www/import.js), over
     an existing word too -- and the words that predate the chart were each
     given one, once (`migratePh` in www/core.js).

     THE SHEET HAS NO FIELD FOR IT. Nobody standing on that screen can see it,
     change it or clear it, and Save was deleting it anyway: open a word, edit
     the meaning, press Save, and what the person imported is gone. `sp` is
     not a copy of it -- the spelling carries the sounds the LETTERS say, and
     the two are different the moment somebody's own reading is not the roman
     one, which is what a pronunciation column is FOR.

     And it does not come back empty, which is why nobody notices. `migratePh`
     runs at the next launch, finds nothing there, and fills the hole with
     `phGuess(hw)` -- a machine's reading of the spelling, wearing the same
     key. The field is not blank afterwards, it is WRONG, and only the person
     who wrote it can tell.

     CLAUDE.md § Data: nothing a person made is removed because the current
     shape does not need it. Save writes what the sheet holds; it does not get
     to remove what the sheet never asked about. */
  start();
  const carried = ['t', 'sʰ', 'ɑ', 'ŋ'];
  const imported = findWord('tira');
  /* A word that has been spelled and then had a list imported over it: `sp`
     is its spelling and `ph` is the reading that came out of the file. Both,
     because that is the state the sheet is opened in -- and it keeps the
     headword still, so what is under test is Save and not a rename. */
  imported.sp = JSON.parse(JSON.stringify(spOf(imported)));
  imported.ph = carried.slice();
  openWord('tira');
  openEdit('tira');
  wEdit.mns = ['意味を書き直す'];
  wdSync();
  wdWrite();
  const kept = findWord('tira');
  const keptPh = (kept && kept.ph) ? kept.ph.join(' ') : '';
  out.said.push('a word saved from the sheet still carries the sounds that ' +
    'came with it: ' + (keptPh ? '"' + keptPh + '"' : 'GONE'));
  if (!kept || kept.mns.join('') !== '意味を書き直す')
    out.fails.push('the save under test did not land: mns is ' +
      JSON.stringify(kept && kept.mns));
  if (keptPh !== carried.join(' '))
    out.fails.push('Save left ph = ' + JSON.stringify(keptPh) + ' where the ' +
      'word carried ' + JSON.stringify(carried.join(' ')) + ' -- the sheet has ' +
      'no field for it, so nobody asked for it to go');
  /* And the next launch, which is where it stops looking like nothing
     happened: the hole is filled with a guess off the spelling. */
  migratePh();
  const after = (findWord('tira') || {}).ph;
  const afterPh = after ? after.join(' ') : '';
  out.said.push('and after the next launch it is: ' +
    (afterPh ? '"' + afterPh + '"' : 'GONE'));
  if (afterPh !== carried.join(' '))
    out.fails.push('after the next launch ph = ' + JSON.stringify(afterPh) +
      ' -- the sounds somebody imported were replaced by a guess off the ' +
      'spelling, and nothing on any screen says so');

  /* ---- an import that is over is over ------------------------------------
     「取り込んだあとにアルファベットページに飛ばなくていいから戻る押しても
       前のページに染み付いてるせいで全然戻れない」OWNER 2026-09-02.

     `IMP.done` decides which face the import screen draws, and it used to
     stand for the rest of the session: 完了 was `back()` and forgot nothing,
     so opening 取り込み again showed the LAST import's result, with 完了 on
     it, and 完了 goes back. From the alphabet that is a loop -- import, the
     old result, back, import, the old result -- with no way in to the import
     screen and no way out that felt like going back. Nothing threw and every
     press did what it says, which is why this is a SEQUENCE and not a press.

     Only 完了 forgets. Leaving by the arrow keeps it, because 元に戻す is on
     that face and is the one press that makes an import not have happened. */
  start();
  goTab('build'); go('letters');
  openImport();
  impTake('character,name\n\u03a8,psi\n\u03a9,omega');
  IMP.into = 'l'; IMP.roles = impMove(IMP.roles, 'l');
  doImport();
  const impWas = !!(IMP.done);
  const okBtn = (screen(), document.querySelector('#app [data-do="impOK"]'));
  if (okBtn) okBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  const impAt = here().r + (here().a ? ':' + here().a : '');
  openImport();
  const impFresh = !IMP.done;
  out.said.push('the import screen forgets that it finished: ' +
    (impWas ? '' : 'NEVER SAID IT DID — ') +
    '完了 landed on ' + impAt + ', opening it again is ' +
    (impFresh ? 'the start' : 'THE OLD RESULT'));
  if (!impWas) out.fails.push('the import never reported a result to forget');
  if (!okBtn) out.fails.push('the done screen has no 完了 to press');
  if (!impFresh)
    out.fails.push('opening the import again shows the last result — 完了 ' +
      'goes back, so that is a loop with no way in and no way out');

  /* ---- the word list forgets it was being chosen from -------------------
     「洗濯して前の画面戻ると選択画面がキープされたままや。流石に解除して
     欲しい。」 OWNER 2026-09-05, on a build in their hand.

     Nothing can throw here and no screenshot is wrong: the list renders
     perfectly as a list you choose from, and the bar says 完了 instead of
     選択 because that is what it says while choosing. It is found by walking
     off the screen and coming back, which is a SEQUENCE, so it is here rather
     than in press-check -- the same reason the import above is.

     Both directions, because the fix has an exception in it and the exception
     is where this will regress. Walking OFF releases the choice; going
     DEEPER -- the kind of word and the order each open as a page of their own,
     and both stay up while you choose -- keeps it. A release written as
     「left the words route」 passes the first half and throws the choice away
     every time somebody filters. */
  const chooseTwo = () => {
    const on = document.querySelector('#app .navtop [data-do="wSelOn"]');
    if (on) on.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    /* Re-asked each time: tapping a mark redraws the whole screen (the bar
       has to stop saying 完了 and start saying 削除), so the second element
       of a list read once is no longer on the page. */
    for (let i = 0; i < 2; i++) {
      const m = document.querySelectorAll('#app [data-sel="1"]')[i];
      if (m) m.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
    return wSel ? Object.keys(wSel).length : -1;
  };
  const chosen = () => wSel ? 'choosing ' + Object.keys(wSel).length : 'a plain list';

  start(); screen();
  const tookTwo = chooseTwo();
  out.said.push('the word list, with 選択 pressed and two marks tapped, is ' +
                chosen());
  if (tookTwo < 1) out.fails.push('選択 and two marks chose ' + tookTwo +
    ' words -- there is nothing to leave behind, so what follows proves nothing');
  back();
  go('words'); screen();
  out.said.push('back a page and into the dictionary again: ' + chosen() +
                ', the bar says ' +
                (document.querySelector('#app .navtop [data-do="wSelOff"]') ? '完了' : '選択'));
  if (wSel)
    out.fails.push('walked off the word list and came back to it still being ' +
      'chosen from (' + chosen() + ') -- 「前の画面戻ると選択画面がキープされた' +
      'ままや」 OWNER 2026-09-05');
  if (document.querySelector('#app .navtop [data-do="wSelOff"]'))
    out.fails.push('the bar still says 完了 on a list arrived at fresh');

  start(); screen();
  chooseTwo();
  const before = chosen();
  openFil(); screen();
  const onFil = here().r + ':' + here().a;
  back(); screen();
  out.said.push('with ' + before + ', the kind of word opened (' + onFil +
                ') and closed again: ' + chosen());
  if (onFil !== 'form:wfil')
    out.fails.push('the kind of word did not open as its own page (' + onFil +
      ') -- the exception below is about a page, so this no longer tests it');
  if (!wSel)
    out.fails.push('opening the kind of word threw the choice away -- it is a ' +
      'page you go INTO from the list, and the filter stays up while choosing');

  /* ---- a word with no meaning says nothing on its row -------------------
     「あとここ意味の追加ってなるけど、追加ボタン押しても追加されないから、
     空欄でいいよ。」OWNER 2026-09-05, on a build in their hand.

     The row said 「意味の追加」 and the press opens the word -- because the
     row IS the button that opens the word, and nothing on this screen has
     ever added a meaning. A line naming an action its own press does not do
     renders perfectly and photographs perfectly, so nothing but a person
     reading it could find it, and this is what holds the answer.

     Two halves. The blank one is the owner's decision; the OTHER one is what
     makes the blank right -- a word that HAS a meaning still says it, and a
     release that blanked the line for everybody would pass the first half
     alone. */
  start();
  WORDS.push({ hw:'zolu', ph:['z','o','l','u'], mns:[], pos:'n', at:99 });
  screen();
  const rowOf = (hw) => [].slice.call(document.querySelectorAll('#app .entry'))
    .filter(e => e.textContent.indexOf(hw) >= 0)[0] || null;
  const blank = rowOf('zolu');
  const full  = rowOf('tira');
  const mnText = (row) => { const m = row && row.querySelector('.mn');
                            return m ? m.textContent : '(no line at all)'; };
  out.said.push('a word with no meaning shows on its row: ' + mnText(blank));
  out.said.push('and one that has a meaning still shows: ' + mnText(full));
  if (!blank) out.fails.push('the word with no meaning is not on the list, ' +
    'so nothing below it was asked of anything');
  else if (blank.textContent.indexOf(t('words.addmn')) >= 0)
    out.fails.push('the row of a word with no meaning still says ' +
      JSON.stringify(t('words.addmn')) + ' -- pressing it opens the word and ' +
      'adds nothing. 「空欄でいいよ」 OWNER 2026-09-05');
  else if (blank.querySelector('.mn'))
    out.fails.push('the row of a word with no meaning carries an empty ' +
      'meaning line -- 空欄 is no line, not a line with nothing on it');
  if (!full || !full.querySelector('.mn') || !mnText(full).trim())
    out.fails.push('a word that HAS a meaning stopped showing it: ' +
      mnText(full) + ' -- the blank is for the words with none');

  /* ---- a subclass somebody made themselves ------------------------------
     OWNER 2026-09-05: the thirteen parts of speech stay the thirteen, and
     underneath them a person makes their own -- 動詞 → 自動詞／他動詞. Three
     steps and press-check can never take three, so it is here: put a word in
     a subclass from the sheet, save, and ask the LIST what it now says and
     what it can now be narrowed to.

     None of the three can throw. A subclass that is written and not saved, a
     row that does not say it, and a filter that lets every word through are
     each a screen that renders perfectly and is not the one somebody built. */
  start();
  const SUB = '\u4f7f\u5f79\u52d5\u8a5e';           /* a subclass no fixture word is in */
  openWord('tira');
  openEdit('tira');
  wdSetSub(SUB);
  wdWrite();
  const subbed = findWord('tira');
  out.said.push('a subclass written on the sheet and saved is: ' +
    ((subbed && subbed.sub) ? '"' + subbed.sub + '"' : 'GONE'));
  if (!subbed || subbed.sub !== SUB)
    out.fails.push('saved a subclass and the word carries ' +
      JSON.stringify(subbed && subbed.sub) + ' -- Save did not write it');
  /* And the language now HAS it, which is the whole of what a subclass is:
     there is no list of them kept anywhere, so a subclass exists exactly
     while a word is in it. */
  if (subsOf('v').indexOf(SUB) < 0)
    out.fails.push('the word carries ' + JSON.stringify(SUB) + ' and ' +
      'subsOf("v") does not offer it: ' + JSON.stringify(subsOf('v')));
  if (subsOf('n').indexOf(SUB) >= 0)
    out.fails.push('a subclass of the verbs is being offered under the nouns');

  /* The row of the list says it, beside the part of speech and not instead
     of it -- both, because "verb" alone and 使役動詞 alone are each half of
     what the row is for. */
  back();
  window.route = 'words'; NAV = [{ r: 'words' }];
  const listed = screen();
  out.said.push('and the list row says it: ' +
    (listed.indexOf(SUB) >= 0 ? 'yes' : 'NO'));
  if (listed.indexOf(SUB) < 0)
    out.fails.push('the dictionary row of a word in ' + JSON.stringify(SUB) +
      ' does not say so');
  if (listed.indexOf(posLabel('v')) < 0)
    out.fails.push('the subclass replaced the part of speech on the row ' +
      'instead of standing beside it');

  /* And the list narrows to it. Three answers have to differ or the filter is
     doing nothing: everything, the verbs, and this one subclass of them. */
  wordsSetFil(POS_ALL);
  const nAll = wordsList().length;
  wordsSetFil('v');
  const nPos = wordsList().length;
  wordsSetFil('v:' + SUB);
  const nSub = wordsList().map(w => w.hw);
  out.said.push('everything ' + nAll + ', the verbs ' + nPos +
    ', that subclass ' + JSON.stringify(nSub));
  if (!(nSub.length === 1 && nSub[0] === 'tira'))
    out.fails.push('narrowed to ' + JSON.stringify(SUB) + ' and the list is ' +
      JSON.stringify(nSub) + ' -- one word is in it');
  if (!(nSub.length < nPos && nPos < nAll))
    out.fails.push('the three counts do not differ: everything ' + nAll +
      ', verbs ' + nPos + ', subclass ' + nSub.length);
  /* What the button over the list says it is narrowed to. "動詞" over a list
     of nothing but 使役動詞 is the screen naming the wrong one of the two. */
  if (wFilLab() !== SUB)
    out.fails.push('narrowed to a subclass and the list says it is showing ' +
      JSON.stringify(wFilLab()));
  /* And the part of speech moving takes it off, because a subclass of the
     verbs is not an answer about a noun. */
  openEdit('tira');
  wdSetPos('n');
  out.said.push('and changing the part of speech leaves the subclass: ' +
    JSON.stringify(wEdit.sub));
  if (wEdit.sub)
    out.fails.push('changed the part of speech and the sheet still carries ' +
      JSON.stringify(wEdit.sub) + ' -- a subclass of the verbs, on a noun');

  /* ---- and the spelling alone turns the Save gold ----------------------
     www/shell.js § KEEP: the button is grey until something has changed, and
     the back arrow asks only while it is gold. The spelling is the word
     itself and was the one field on this sheet that told the buffer nothing,
     so changing it left both saying the sheet was untouched. */
  openWord('tir'); openEdit('tir');
  const greyFirst = !keepDirty(keepKey());
  wdSetLn('tirr');
  const goldAfter = keepDirty(keepKey());
  out.said.push('the sheet is open on ' + JSON.stringify(openHw) +
    ', untouched: ' + greyFirst +
    ', and after the spelling is typed it has changed: ' + goldAfter);
  /* openEdit() returns doing nothing for a word that is not there, and the
     sheet then stays open on whatever it was: without this the claim below
     was being asked of the PREVIOUS word, half edited, and read as a failure
     of the thing it is here to hold. */
  if (openHw !== 'tir')
    out.fails.push('the sheet did not open on the word this claim is about');
  if (!greyFirst)
    out.fails.push('an untouched sheet already says it has changed');
  if (!goldAfter)
    out.fails.push('the spelling was changed and the sheet still says nothing ' +
      'has -- the Save stays grey and the back arrow leaves without asking');

  return out;
});

await br.close();
srv.close();

R.said.forEach(s => console.log('  ' + s));
if (R.fails.length) {
  R.fails.forEach(f => console.log('FAIL: ' + f));
  process.exit(1);
}
console.log('a word you change is still the word you were looking at.');
