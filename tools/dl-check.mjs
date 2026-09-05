/* A section of somebody else's language, taken and actually LANDED.
   ---------------------------------------------------------------------
   The switch that says a chapter may be taken away has been built more than
   once. The taking has never been built at all: `LANGS[id].mine` is written
   in three places in www/core.js and every one of them writes `true`, so a
   language that is not yours has never existed on a phone. What that produces
   is a screen that looks finished -- a mark beside a heading, a row that
   reads 「読んでいる」 -- with nothing behind it.
   「ダウンロードボタン押しても言語追加されないけど？」 OWNER 2026-09-01, on a
   device. 「いつまでもfalseだったとかやめてね。」

   So this check refuses to be about markup. It presses the real button on the
   real screen and then asks STORAGE:

     the slice is in localStorage under langKeyOf(<that language>, 'letters')
     LANGS[<that language>].mine is false
     every byte of the person's OWN language is where it was
     a save does not send it up into THIS account's rows -- 「入らん」
       OWNER 2026-09-01. It used to be 「bkPack() does not carry it into the
       backup FILE」, and there is no file (www/backup.js, 2026-09-04)
     netLangSync() will not run on it -- syMerge adds both sides, and one
       pass would put something into a language somebody else wrote

   Only the NETWORK is stubbed. What lands, and where, is the thing under
   test, so nothing here recomputes it: a check that works out the answer a
   second time is a copy of the code, and a copy always agrees (CLAUDE.md
   rule 12).

   Run: node tools/dl-check.mjs                                          */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

const SID = 'srv-lang-0001';           /* the server's id for their language */
const bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{ width:390, height:844 } });
await pg.goto('file://' + path.join(dir, '..', 'www', 'index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const r = await pg.evaluate(async ({ s, sid }) => {
  eval('(' + s + ')()');
  SET.done = true;
  /* ON PLUS, WHICH IS THE RUNG. 「plusからです」OWNER 2026-09-02, replacing
     「Downloading a keyboard or an alphabet is free」(docs/FEATURES.md § 4,
     2026-08-19). This line used to say `free`, deliberately, and its own
     comment said it was what would turn red the day a rung was put on the
     row. It did. What free and pro do about it is asked further down, in
     claims of their own. */
  SET.plan = 'plus'; save();

  /* ---- the network, and ONLY the network ------------------------------
     What the server really answers with is what supabase/schema.sql's
     `slice_read` opens to a reader of a published language: wld, script,
     snd, letters, kb -- and NOT words, and NOT gram2, which it refuses to
     everybody but the owner. Answering here with more than the server would
     is how a check passes and a phone does not. */
  var THEIRS = {
    /* `dl:true` is the publisher having turned the switch on -- wldDl() reads
       it and 「absent means no」, so a language that has not said yes offers
       nothing and that is correct. */
    wld:     { body: JSON.stringify({ dl:true,
                 ov:[{k:'', v:'a language somebody else wrote'}] }), no: 3 },
    script:  { body: JSON.stringify({ dir:'ltr' }), no: 1 },
    snd:     { body: JSON.stringify(['a','k','n']), no: 2 },
    letters: { body: JSON.stringify([{ id:'x1', st:[{pts:[[100,100],[700,700]]}],
                                       ch:'', nm:'q', snd:[] }]), no: 5 },
    kb:      { body: JSON.stringify({ boards:[] }), no: 1 }
  };
  var calls = [];
  netSlices = function(id, ok){ calls.push(['slices', id]); setTimeout(function(){ ok(THEIRS); }, 0); };
  netLangSeen = function(id, ok){ calls.push(['seen', id]);
    setTimeout(function(){ ok({ id:id, name:'Shango', license:'', pub:'2026-08-01',
                                nwords:12, nletters:5 }); }, 0); };
  /* and the language's own page says its chapters may be taken */
  netSignedIn = function(){ return true; };

  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }

  /* ---- what the person already has, before any of this ---------------- */
  var mineId = langId;
  var before = {};
  for (var i = 0; i < SLICES.length; i++)
    before[SLICES[i]] = slRd(langKeyOf(mineId, SLICES[i]));
  var langsBefore = JSON.stringify(LANGS);

  /* ---- their article, by the road the app itself offers ---------------- */
  go('about', sid);
  render();
  await wait(60);
  render();

  var body = document.getElementById('app');
  var out = { calls: calls, mineId: mineId };
  out.screen = body ? body.innerText : '';

  /* the download section, opened the way every other section opens */
  var fold = document.querySelector('[data-do="abToggle"][data-a*="wlddl"]');
  out.foldFound = !!fold;
  if (fold){ abToggle('wlddl'); render(); }

  /* every ↓ the screen offers, and which chapters they are for */
  var btns = document.querySelectorAll('[data-do="wldGet"]');
  out.offered = [];
  for (i = 0; i < btns.length; i++) out.offered.push(btns[i].getAttribute('data-a'));

  /* ---- press the one for the letters ---------------------------------- */
  var press = null;
  for (i = 0; i < btns.length; i++)
    if (String(btns[i].getAttribute('data-a')).indexOf('letters') >= 0) press = btns[i];
  out.pressed = !!press;
  if (press){ press.click(); await wait(120); render(); }

  /* ---- and now: storage --------------------------------------------- */
  out.landed = slRd(langKeyOf(sid, 'letters'));
  out.wanted = THEIRS.letters.body;
  out.row = LANGS[sid] ? { name: LANGS[sid].name, mine: LANGS[sid].mine } : null;
  out.mineUntouched = (function(){
    for (var k = 0; k < SLICES.length; k++)
      if (slRd(langKeyOf(mineId, SLICES[k])) !== before[SLICES[k]]) return SLICES[k];
    return '';
  })();
  out.stillOpen = langId === mineId;
  out.langsGrewByOne = Object.keys(LANGS).length === Object.keys(JSON.parse(langsBefore)).length + 1;

  /* ---- and the thing that must never reach it --------------------------
     THE WAY OUT USED TO BE A FILE. bkPack() packed whatever language was
     open and bkPush() wrote it into Documents, so what was asked here was
     「does the writer refuse somebody else's」. There are no files
     (www/backup.js, 2026-09-04) and the way out is now the SERVER: a save
     goes up the moment it is made. So the same question is asked of the
     road that exists -- 「does a save send somebody else's language into
     THIS account's rows」 -- which is the stronger half of it anyway, and
     it was never asked before today.

     Asked by opening it, because netSaveUp() sends the OPEN language. If the
     app refuses to open it, that is an answer too and is recorded. */
  var was = langId;
  var opened = false;
  try { langOpen(sid); opened = (langId === sid); } catch (e) {}
  out.opens = opened;
  if (opened){
    var sent = [];
    var realSend = netSend;
    netSend = function(m, p, b, tk, ok, bd){ sent.push(m + ' ' + p); if (bd) bd(null, 0); };
    /* the save a person makes by having it on the screen at all */
    bkTouch();
    netSaveUpGo();                    /* the wait is not what is under test */
    netSend = realSend;
    out.pushRefused = sent.length === 0;
    out.pushHow = sent.join(' | ');

    /* ---- AND NOTHING IN IT MAY BE CHANGED --------------------------------
       「編集不可でそのアカウントに切り替えたらダウンロードした人の言語が使える」
       OWNER 2026-09-02. Until that day this language could not be opened at
       all, so the seven savers were never asked anything -- langOpen()'s own
       comment named the WRITERS as the protection and only three of them were
       asking. Opening the door is what made the other seven necessary, and
       this is the claim that holds them.

       Every global is moved first, so a saver that writes would write
       something VISIBLY different. Asked of storage, because in memory the
       change is real -- that is the whole shape of the fault this guards: the
       screen shows the new word, and it is gone on the next launch. */
    var keysBefore = {}, kk, ki;
    for (ki = 0; ki < localStorage.length; ki++){
      kk = localStorage.key(ki);
      if (kk && kk.indexOf('lingua.') === 0) keysBefore[kk] = localStorage.getItem(kk);
    }
    WORDS.push({ hw:'zzz', mn:'sneaked in' });
    LETTERS.push(ltNew({ ab:'zz' }));
    NOTES.push({ t:'sneaked in', b:'' });
    STG.order = 'sneaked in';
    SND.push('zz');
    KB = KB || {}; KB.kbs = (KB.kbs || []).concat([{ pat:'qwerty', lay:[] }]);
    WLD = WLD || {}; WLD.where = 'sneaked in';
    save(); saveLetters(); saveNotes(); saveStg(); saveSnd(); saveKb(); saveWld();
    out.wroteAnyway = [];
    for (ki = 0; ki < localStorage.length; ki++){
      kk = localStorage.key(ki);
      if (kk && kk.indexOf('lingua.') === 0 &&
          localStorage.getItem(kk) !== keysBefore[kk]) out.wroteAnyway.push(kk);
    }
    out.savers = 7;

    /* And the ways IN are not drawn either. A refusal at the storage door on
       its own is worse than no door: the screen would say it worked. */
    /* The MAKE affordance is the round + and it is `.fab` on every one of
       these screens, which is what is asked -- not the name behind it. The
       first version of this asked for `openNote` and found it on every note
       ROW: opening a note to read it is that same name with an index, so the
       claim was failing on the screen doing the right thing. A check that
       names a road rather than the thing on screen answers a different
       question than the one it prints. */
    var picks = ['wSelOn', 'kbSelOn', 'ntSelOn'];
    out.doorsUp = [];
    ['words', 'ltset', 'gram', 'kb', 'notes', 'about'].forEach(function(r){
      try {
        window.route = r; NAV = [{ r:r }];
        render();
        if (document.querySelector('#app .fab')) out.doorsUp.push(r + ':+');
        picks.forEach(function(d){
          if (document.querySelector('#app [data-do="' + d + '"]'))
            out.doorsUp.push(r + ':' + d);
        });
      } catch (e) { out.doorsUp.push(r + ': threw ' + (e && e.message)); }
    });

    langOpen(was);
  }
  /* The sync, with every road out of it OPEN. netLangRow() is stubbed too --
     without it the request simply fails and the claim below is green for the
     wrong reason: nothing was refused, the network merely was not there. */
  /* One server id per language, so a put can be attributed. Answering `sid`
     for everything made this check count the person's OWN languages going
     up -- which is netLangSync() doing its job -- as the downloaded one
     being written. */
  netLangRow = function(id, ok){ ok('srv-of-' + id); };
  /* AND IT IS STILL THEIRS. This is the one that matters: opening a language
     is what WRITES -- ltStart() tops a free alphabet up to a-z and saves it --
     so before langOpen() refused, looking at a downloaded language replaced
     its letters with this person's twenty-eight slots and nobody typed a
     thing. Asked after the attempt above, whichever way it went. */
  out.stillTheirs = slRd(langKeyOf(sid, 'letters')) === THEIRS.letters.body;
  out.syncRefused = await new Promise(function(f){
    var wasId = langId;
    /* uid, the way langSeenAdd() puts one on: a language with no stamp
       belongs to nobody once SET.done is true, so dlCount() would not see it
       and the ceiling this claim is about would never be reached. */
    LANGS[sid] = LANGS[sid] || { name:'Shango', mine:false, uid:'u' };
    langId = sid;
    var ran = [], oldPut = netSlicePut, k, snap = {};
    for (k = 0; k < SLICES.length; k++)
      snap[SLICES[k]] = slRd(langKeyOf(sid, SLICES[k]));
    netSlicePut = function(a, kind){ if(a === 'srv-of-' + sid) ran.push(kind); };
    /* Both halves, because either one alone is green with the bug in.
       A put is somebody else's language being WRITTEN on the server; a
       changed slice is their copy on this phone being merged into -- and
       syMerge adds both sides, so a merge is an edit. */
    function end(){
      netSlicePut = oldPut; langId = wasId;
      var moved = '';
      for (var j = 0; j < SLICES.length; j++)
        if (slRd(langKeyOf(sid, SLICES[j])) !== snap[SLICES[j]])
          moved = SLICES[j];
      out.syncPut = ran.join(',');
      out.syncMoved = moved;
      f(ran.length === 0 && moved === '');
    }
    netLangSync(function(){ end(); });
    setTimeout(end, 400);
  });
  /* ---- the plan, and the two ceilings ---------------------------------
     「plusからです」「dlはしかもplusは1つproは3つ DL言語とmake言語でそれぞれ
     別の最大値ね？」OWNER 2026-09-02.

     Asked of the app rather than restated here: dlCap() is the number and
     can('dl') is the door, and both are read out of core.js. What is claimed
     is the shape -- free cannot, plus is one, pro is three, and the two
     ceilings never touch each other. */
  out.caps = {};
  var langsWas = JSON.parse(JSON.stringify(LANGS));
  ['free','plus','pro'].forEach(function(pl){
    SET.plan = pl;
    out.caps[pl] = { door: can('dl'), cap: dlCap() };
  });
  /* And the two counts are counting different things, with a download and a
     made language both in the index at once. */
  SET.plan = 'pro';
  out.madeCount = langCount();
  out.dlCount   = dlCount();
  out.dlIsNotMade = langCount() === Object.keys(LANGS).filter(function(k){
    return LANGS[k] && LANGS[k].mine; }).length;
  LANGS = langsWas;

  /* ---- and a ceiling met from ABOVE hides, and takes nothing away -------
     「減った時は隠すだけね」「だって単語でも文法でも同じようにやったじゃん」
     OWNER 2026-09-02. wordsSeen()'s shape: the list is cut, the data is not.
     「開いてるものを残すでいいよ」 -- and the language you are standing in is
     always on the list, or the switcher cannot switch away from it. */
  var wasId = langId, wasPlan = SET.plan;
  SET.plan = 'pro'; save();
  var b1 = langMint(), b2 = langMint();
  ['zc1','zc2','zc3'].forEach(function(z){
    LANGS[z] = { name:z, mine:false, sid:z, uid:'u' }; });
  langStore();
  langId = b2;                                  /* the SECOND one is open */
  /* Every key that was there, by NAME. Not the count: an ordinary save() adds
     keys -- the language that is open writes its slices -- and a count would
     read that as a change. What is claimed is that none GOES. */
  var keysWas = Object.keys(localStorage).filter(function(k){
    return k.indexOf('lingua.') === 0; });
  var langsWere = Object.keys(LANGS).length;
  function ownListed(){
    var ids = Object.keys(LANGS).filter(function(k){ return LANGS[k] && LANGS[k].mine; });
    return langsSeen(ids, langCap());
  }
  function readListed(){
    var ids = Object.keys(LANGS).filter(function(k){ return LANGS[k] && !LANGS[k].mine; });
    return langsSeen(ids, dlCap());
  }
  out.capPro  = { own: ownListed().length, read: readListed().length };
  SET.plan = 'free'; save();
  out.capFree = { own: ownListed().length, read: readListed().length,
                  openOnIt: ownListed().indexOf(b2) >= 0 };
  var gone = keysWas.filter(function(k){ return localStorage.getItem(k) === null; });
  out.capNow = { langs: Object.keys(LANGS).length, langsWere: langsWere, gone: gone };
  out.capKept = out.capNow.langs === langsWere && gone.length === 0;
  SET.plan = 'pro'; save();
  out.capBack = { own: ownListed().length, read: readListed().length };
  langId = wasId; LANGS = langsWas; langStore();
  SET.plan = wasPlan;

  SET.plan = 'plus'; save();

  return out;
}, { s: seed.toString(), sid: SID });

console.log('');
say(r.foldFound, 'the article carries a DOWNLOAD section that folds like every other one');
say(r.offered.length > 0,
    'and it offers a ↓ per chapter its owner allowed AND the server opens: ' +
    (r.offered.join(' ') || 'none'));
/* ALL FOUR. 「あとdlは単語文字文法キーボード全部のはずだよね？」 OWNER
   2026-09-02. This said the opposite until that day, and it was right then:
   `slice_read` in supabase/schema.sql refused the dictionary and the grammar
   to everybody but their owner, so a ↓ over either could never land. It reads
   the owner's own per-section DL switch now (`slice_dl()` in the same file),
   which is the second answer 「言語ページ公開と単語や文字のdl可能は別だし」 asks
   for, so the four sections are the four sections. */
say(['letters', 'words', 'gram', 'kb'].every(function(k){
      return r.offered.some(function(a){ return String(a).indexOf(k) >= 0; }); }),
    'and it is all four chapters — letters, the dictionary, the grammar and ' +
    'the keyboard — not the two the server used to open');
say(r.pressed, 'the ↓ for the letters is a real button and was pressed');
say(!!r.landed && r.landed === r.wanted,
    'and the slice is in storage under langKeyOf(their id, "letters"): ' +
    (r.landed ? r.landed.length + ' bytes, byte for byte what the server sent' : 'NOTHING'));
say(!!r.row && r.row.mine === false,
    'and the index has a row for it with `mine` FALSE — the first time this app ' +
    'has ever written one: ' + JSON.stringify(r.row));
say(r.row && r.row.name === 'Shango', 'and it carries the language’s own name');
say(r.langsGrewByOne, 'exactly one language was added');
say(r.mineUntouched === '' && r.stillOpen,
    'and NOTHING of the person’s own moved: every slice of their language is ' +
    'byte for byte what it was, and it is still the one open' +
    (r.mineUntouched ? ' (`' + r.mineUntouched + '` changed)' : ''));
console.log('    [opens=' + r.opens + ' pushRefused=' + r.pushRefused + ']');
say(!r.opens || r.pushRefused === true,
    'and a save does not send it up into THIS account’s rows, even while it ' +
    'is the language on the screen — 「入らん」: ' +
    (r.opens ? (r.pushRefused ? 'netSaveUp sent nothing'
                              : 'IT SENT ' + r.pushHow)
             : 'it cannot be opened, which is the same answer'));
say(r.opens, 'a downloaded language is one you SWITCH TO — the row in the ' +
    'switcher is a button and langOpen() takes it');
say(!r.opens || (r.wroteAnyway && r.wroteAnyway.length === 0),
    'and with it open, all ' + (r.savers || 7) + ' savers refuse: every global ' +
    'moved, every saver called, and not one byte under `lingua.` changed' +
    ((r.wroteAnyway && r.wroteAnyway.length)
      ? ' (' + r.wroteAnyway.join(' ') + ' were written)' : ''));
say(!r.opens || (r.doorsUp && r.doorsUp.length === 0),
    'and no way in is drawn on any of its screens — a refusal at the storage ' +
    'door alone would show the word and lose it' +
    ((r.doorsUp && r.doorsUp.length) ? ' (' + r.doorsUp.join(' ') + ')' : ''));
say(r.stillTheirs,
    'and what landed is still theirs after all of that — byte for byte the ' +
    'body the server sent, not this phone’s alphabet written over it');
say(r.syncRefused,
    'and netLangSync() will not run on it — syMerge adds both sides, and one ' +
    'pass would put something into a language somebody else wrote' +
    ((r.syncPut || r.syncMoved)
      ? ' (it put `' + (r.syncPut || '—') + '` and moved `' + (r.syncMoved || '—') + '`)'
      : ''));

say(r.caps && r.caps.free.door === false && r.caps.free.cap === 0,
    'the free plan cannot download at all — 「plusからです」');
say(r.caps && r.caps.plus.door === true && r.caps.plus.cap === 1,
    'plus may, and may hold one (' + (r.caps ? r.caps.plus.cap : '?') + ')');
say(r.caps && r.caps.pro.door === true && r.caps.pro.cap === 3,
    'pro may, and may hold three (' + (r.caps ? r.caps.pro.cap : '?') + ')');
say(r.dlIsNotMade && r.madeCount === 1 && r.dlCount === 1,
    'and the two ceilings are two numbers — with a made language and a ' +
    'downloaded one both in the index, making counts ' + r.madeCount +
    ' and reading counts ' + r.dlCount + ', neither seeing the other');

say(r.capPro && r.capPro.own === 3 && r.capPro.read === 3,
    'on pro all of them are listed — three made, three read');
say(r.capFree && r.capFree.own === 1 && r.capFree.read === 0,
    'and a plan that ENDS cuts the list to the ceiling (' +
    (r.capFree ? r.capFree.own + ' made, ' + r.capFree.read + ' read' : '?') + ')');
say(r.capFree && r.capFree.openOnIt,
    'with the language you are standing in still on it — 「開いてるものを残す」');
say(r.capKept,
    'and nothing was taken away: LANGS is the same length and not one of the ' +
    'keys under `lingua.` went' +
    ((r.capNow && r.capNow.gone.length) ? ' (gone: ' + r.capNow.gone.join(' ') + ')' : ''));
say(r.capBack && r.capBack.own === 3 && r.capBack.read === 3,
    'paying again lists every one of them, exactly as they were');

await br.close();
if (bad.length){
  console.log('\ndl: ' + bad.length + ' problem' + (bad.length > 1 ? 's' : '') + '.\n');
  process.exit(1);
}
console.log('\ndl: a chapter of somebody else’s language is taken by pressing ↓ on it,\n' +
            '    lands in storage as a language of its own with `mine` false, and\n' +
            '    nothing of the person’s own is touched, backed up or synced with it.');
