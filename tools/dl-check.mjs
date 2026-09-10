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
  SET.walked = true;
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
  /* `owner` は「書いた人」で、2026-09-09 から行に載っています
     （supabase/schema.sql § language_seen）。これが無いと、降ろした言語は
     「まだ誰の物か聞いていない」になって画面に出ません。 */
  netLangSeen = function(id, ok){ calls.push(['seen', id]);
    setTimeout(function(){ ok({ id:id, owner:'them-uid', name:'Shango',
                                license:'', pub:'2026-08-01',
                                nwords:12, nletters:5 }); }, 0); };
  /* そして「取った言語」の表。行は `language_take` で（www/net.js §
     netTakes）、数はサーバーが数えます ── `null` は「まだ訊いていない」で、
     dlStop() はそこで待ちます。ここは訊いた結果を置いておく形。 */
  var TOOK = [];
  netTakes = function(ok){ langTookGot(TOOK.slice()); if(ok) ok(TOOK.slice()); };
  netTakePut = function(sid2, ok){ if(TOOK.indexOf(sid2) < 0) TOOK.push(sid2);
                                   netTakes(ok); };
  netTakes();
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
  /* 名前は `language.name` です（www/core.js § LNAME）── 索引ではなく
     langNameOf() が答えます。降りてきた `language_seen` の行が言ったもの。 */
  out.row = LANGS[sid] ? { name: langNameOf(sid), mine: LANGS[sid].mine } : null;
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
       belongs to nobody once SET.walked is true, so dlCount() would not see it
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
    LANGS[z] = { name:z, mine:false, uid:'u' }; });
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

/* ---- AND THE ROAD BACK: the row is SLID and the 削除 pressed -------------
   「言語変更画面をスライドで消せる、メモしといて」 OWNER 2026-09-09, and 「はい」
   to the question the next day (docs/FEATURE_RULES.md 決定ログ 1).

   There was no road out. A `language_take` row went in with the ↓ and came out
   only when the SOURCE deleted their language or their account -- so on plus,
   where the ceiling is one, a download taken by mistake filled the only slot
   there was for ever.

   NOTHING HERE RECOMPUTES THE GESTURE. The check calls the app's own touch
   handlers with the same three events a thumb produces, asks the PAGE whether
   a 削除 appeared, and then presses it for real. A check that added the class
   itself would be a copy of the handler and would agree with it whatever the
   handler did (CLAUDE.md rule 12).

   Only the transport is stubbed, so netTakeDrop(), netTakes() and
   netTakeGone() all run for real against a `language_take` table made of one
   array. */
/* FROM AN EMPTY PHONE, and that is not tidiness. The sections above leave
   five downloaded languages in the index (the one they took, and the three
   `zc*` the ceiling claims made), and this plan holds ONE -- so langsSeen()
   cut the language this section is about off the end of the list and every
   claim below was red about a row that was simply not drawn. Measured before
   it was fixed: the one `.swipe` on screen carried `data-lgs="srv-lang-0001"`.
   again-check clears storage between its sections for the same reason. */
await pg.evaluate(() => localStorage.clear());
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const gone = await pg.evaluate(async ({ s }) => {
  eval('(' + s + ')()');
  SET.walked = true; SET.plan = 'plus'; save();
  /* AS THE PERSON WHOSE LANGUAGE THIS IS. Signing in as somebody else makes
     the seed's own language somebody else's -- langMine() asks
     `language.owner` -- so it falls into the READING list, and on plus that
     list holds one: the download this section is about was cut off the end of
     it and the whole thing was green for the wrong reason. Measured before it
     was believed (the page reported `mineIsMine:false`, one `.swipe` on screen,
     and it was the seed's). */
  SESS = { at:'t', rt:'r', uid:String(langOwnOf(langId) || 'me'), anon:false };
  netSignedIn = function(){ return true; };
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }

  var mineId = langId, sid = 'srv-theirs-9';
  var out = {};

  /* somebody else's language, taken -- the entry langSeenAdd() makes and the
     slices wldGet() puts under it */
  langSeenAdd(sid, 'Shango', 'them-uid');
  slWr(langKeyOf(sid, 'letters'), '[{"id":"sx1"}]');
  slWr(langKeyOf(sid, 'kb'), '{"boards":[]}');
  langStore();

  /* what the person's OWN language is holding, before any of this */
  var before = {}, i;
  for (i = 0; i < SLICES.length; i++)
    before[SLICES[i]] = slRd(langKeyOf(mineId, SLICES[i]));

  /* ---- the server, behind the one transport ---------------------------- */
  var SRV = { take:[{ uid:SESS.uid, language:sid }], hits:[], down:false };
  netSend = function(method, p, body, tok, ok, bad){
    SRV.hits.push(method + ' ' + p);
    if (SRV.down){ setTimeout(function(){ bad(null, 0, 'down'); }, 0); return; }
    if (method === 'DELETE' && p.indexOf('/rest/v1/language_take') === 0){
      var m = /language=eq\.([^&]*)/.exec(p), want = m ? decodeURIComponent(m[1]) : '';
      SRV.take = SRV.take.filter(function(t){ return t.language !== want; });
      return setTimeout(function(){ ok([]); }, 0);
    }
    if (method === 'GET' && p.indexOf('/rest/v1/language_take') === 0)
      return setTimeout(function(){
        ok(SRV.take.map(function(t){ return { language:t.language }; })); }, 0);
    return setTimeout(function(){ bad(null, 404, 'no route ' + method + ' ' + p); }, 0);
  };
  /* the take list this session is holding, asked for the way the launch does */
  await new Promise(function(f){ netTakes(function(){ f(); }, function(){ f(); }); });
  out.dlBefore = dlCount();

  /* ---- the screen, and the finger ------------------------------------- */
  go('langs'); render(); await wait(30);

  /* `.swipe` / `.swdel` / `.swopen`, which is the notebook's shape and is now
     the only one -- 「メモと同じ形って伝えたよね」 OWNER 2026-09-09. `data-lgs`
     is what tells this row from a note's, here as in the app. */
  function rowOf(id){ return document.querySelector('#app .swipe[data-lgs="' + id + '"]'); }
  function delIn(id){ var w = rowOf(id); return w ? w.querySelector('.swdel') : null; }
  function openIn(id){ var w = rowOf(id); return !!(w && w.querySelector('.lgrow.swopen')); }
  /* the three events a thumb makes, handed to the app's own handlers */
  function swipe(id){
    var w = rowOf(id), r;
    if (!w) return false;
    r = w.getBoundingClientRect();
    langSwDown({ target:w.querySelector('.lgrow') || w,
                 touches:[{ clientX:r.right - 20, clientY:r.top + r.height / 2 }] });
    langSwMove({ touches:[{ clientX:r.right - 120, clientY:r.top + r.height / 2 }],
                 cancelable:true, preventDefault:function(){} });
    langSwUp({});
    return true;
  }

  /* THE ROW OF SOMEBODY ELSE'S LANGUAGE SLIDES; YOUR OWN DOES NOT. 自分の
     言語を消すのは設定の真ん中の行で、前からそこです。 */
  out.mineHasNoRow = !rowOf(mineId);
  out.theirsHasRow = !!rowOf(sid);
  /* WHAT WAS ON THE SCREEN, printed whether it passes or not. A claim that
     says only 「no」 sends the next person to guess; the first two runs of
     this went to a debug script because these four numbers were not here. */
  out.saw = { route:window.route, uid:SESS.uid, mineIsMine:langMine(mineId),
              theirsIsMine:langMine(sid), dlCap:dlCap(),
              sw:document.querySelectorAll('#app .swipe').length,
              rows:document.querySelectorAll('#app .lgrow').length,
              dels:document.querySelectorAll('#app .swdel').length,
              sid:sid, keys:Object.keys(LANGS).join(','),
              swHTML:(document.querySelector('#app .swipe')||{outerHTML:''}).outerHTML.slice(0,140) };
  out.shutAtFirst = !!rowOf(sid) && !openIn(sid);
  out.swiped = swipe(sid);
  out.openNow = openIn(sid);
  out.delUp = !!delIn(sid);

  /* ---- and a DELETE that does not land takes nothing ------------------- */
  SRV.down = true;
  var hitsWas = SRV.hits.length;
  if (delIn(sid)) delIn(sid).click();
  await wait(160);
  SRV.down = false;
  out.downTried = SRV.hits.length > hitsWas;
  out.downKeptRow = !!LANGS[sid];
  out.downKeptSlice = slRd(langKeyOf(sid, 'letters'));
  out.downKeptTake = dlCount();

  /* ---- and one that does ---------------------------------------------- */
  render(); await wait(20);
  swipe(sid);
  SRV.hits = [];
  if (delIn(sid)) delIn(sid).click();
  await wait(200);
  out.deletes = SRV.hits.filter(function(h){ return h.indexOf('DELETE ') === 0; });
  out.row = !!LANGS[sid];
  out.slices = [];
  for (i = 0; i < SLICES.length; i++)
    if (slRd(langKeyOf(sid, SLICES[i])) !== null) out.slices.push(SLICES[i]);
  out.dlAfter = dlCount();
  out.mineMoved = (function(){
    for (var k = 0; k < SLICES.length; k++)
      if (slRd(langKeyOf(mineId, SLICES[k])) !== before[SLICES[k]]) return SLICES[k];
    return '';
  })();
  out.mineRow = !!LANGS[mineId];
  /* AND NOTHING WENT TO THE SOURCE'S OWN LANGUAGE. `language` and `slice` are
     somebody else's rows; what comes out is the mark, and only the mark. */
  out.touchedTheirLang = SRV.hits.filter(function(h){
    return h.indexOf('/rest/v1/language?') >= 0 || h.indexOf('/rest/v1/slice') >= 0; });
  return out;
}, { s: seed.toString() });

console.log('');
say(gone.theirsHasRow && gone.mineHasNoRow,
    'the switcher gives a row that slides to somebody else’s language and NOT ' +
    'to your own — 自分の言語は設定の真ん中の行から: ' +
    JSON.stringify(gone.saw));
say(gone.shutAtFirst && gone.swiped && gone.openNow && gone.delUp,
    'and a thumb dragged left across it opens it, with the 「−」 at the right end');
say(gone.downTried && gone.downKeptRow && gone.downKeptSlice !== null &&
    gone.downKeptTake === gone.dlBefore,
    'a DELETE that does not land takes NOTHING — the row, the slice and the ' +
    'ceiling are all where they were (row ' + gone.downKeptRow + ', letters ' +
    JSON.stringify(gone.downKeptSlice) + ', took ' + gone.downKeptTake + ')');
say(gone.deletes.length === 1,
    'pressing it sends ONE delete to the server and the server is first: ' +
    JSON.stringify(gone.deletes));
say(!gone.row && gone.slices.length === 0,
    'and then the row and every slice are gone from this phone (' +
    (gone.slices.length ? 'left: ' + gone.slices.join(',') : 'none left') + ')');
say(gone.dlBefore === 1 && gone.dlAfter === 0,
    'and the ceiling has a slot free again — 取った数 ' + gone.dlBefore +
    ' → ' + gone.dlAfter + ', which is why this road had to exist on plus');
say(gone.mineMoved === '' && gone.mineRow,
    'with not one byte of the person’s OWN language moved' +
    (gone.mineMoved ? ' (' + gone.mineMoved + ' changed)' : ''));
say(gone.touchedTheirLang.length === 0,
    'and the source’s language was never written to — what comes off is the ' +
    'mark and only the mark: ' + JSON.stringify(gone.touchedTheirLang));

await br.close();
if (bad.length){
  console.log('\ndl: ' + bad.length + ' problem' + (bad.length > 1 ? 's' : '') + '.\n');
  process.exit(1);
}
console.log('\ndl: a chapter of somebody else’s language is taken by pressing ↓ on it,\n' +
            '    lands in storage as a language of its own with `mine` false, and\n' +
            '    nothing of the person’s own is touched, backed up or synced with it.');
