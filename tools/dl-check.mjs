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
     bkPack() does not carry it -- 「入らん」 OWNER 2026-09-01
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
  /* On the FREE plan, deliberately. docs/FEATURES.md § 4: 「Downloading a
     keyboard or an alphabet is free」, and the two chapters the server opens
     to a reader are exactly those two. If a rung is ever put on this row, this
     line is what turns red. */

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
    before[SLICES[i]] = localStorage.getItem(langKeyOf(mineId, SLICES[i]));
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
  out.landed = localStorage.getItem(langKeyOf(sid, 'letters'));
  out.wanted = THEIRS.letters.body;
  out.row = LANGS[sid] ? { name: LANGS[sid].name, mine: LANGS[sid].mine } : null;
  out.mineUntouched = (function(){
    for (var k = 0; k < SLICES.length; k++)
      if (localStorage.getItem(langKeyOf(mineId, SLICES[k])) !== before[SLICES[k]]) return SLICES[k];
    return '';
  })();
  out.stillOpen = langId === mineId;
  out.langsGrewByOne = Object.keys(LANGS).length === Object.keys(JSON.parse(langsBefore)).length + 1;

  /* ---- and the two things that must never reach it -------------------- */
  var pack = bkPack();
  out.packIsMine = pack.id === mineId;
  out.packHasTheirs = JSON.stringify(pack).indexOf(THEIRS.letters.body) >= 0;
  /* bkPack() packs the language that is OPEN, so the question is what it does
     when the downloaded one IS open. Asked by opening it -- if the app
     refuses to open it, that is an answer too and is recorded. */
  var was = langId;
  var opened = false;
  try { langOpen(sid); opened = (langId === sid); } catch (e) {}
  out.opens = opened;
  if (opened){
    out.packWhileOpenHasTheirs =
      JSON.stringify(bkPack()).indexOf(THEIRS.letters.body) >= 0;
    /* and the thing that actually hands a file over. bkPack() is arithmetic on
       whatever is open and says nothing about whose it is; bkPush() is the one
       that writes, so it is the one asked. */
    var wrote = [];
    BK.dirty = true; BK.how = '';
    var oldPlug = window.sharePlug;
    window.sharePlug = function(){ return function(a, b, o){ wrote.push(b); 
      return { then:function(){ return { 'catch':function(){} }; } }; }; };
    bkPush();
    window.sharePlug = oldPlug;
    out.pushRefused = wrote.length === 0;
    out.pushHow = BK.how;
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
  out.stillTheirs = localStorage.getItem(langKeyOf(sid, 'letters')) === THEIRS.letters.body;
  out.syncRefused = await new Promise(function(f){
    var wasId = langId;
    LANGS[sid] = LANGS[sid] || { name:'Shango', mine:false };
    langId = sid;
    var ran = [], oldPut = netSlicePut, k, snap = {};
    for (k = 0; k < SLICES.length; k++)
      snap[SLICES[k]] = localStorage.getItem(langKeyOf(sid, SLICES[k]));
    netSlicePut = function(a, kind){ if(a === 'srv-of-' + sid) ran.push(kind); };
    /* Both halves, because either one alone is green with the bug in.
       A put is somebody else's language being WRITTEN on the server; a
       changed slice is their copy on this phone being merged into -- and
       syMerge adds both sides, so a merge is an edit. */
    function end(){
      netSlicePut = oldPut; langId = wasId;
      var moved = '';
      for (var j = 0; j < SLICES.length; j++)
        if (localStorage.getItem(langKeyOf(sid, SLICES[j])) !== snap[SLICES[j]])
          moved = SLICES[j];
      out.syncPut = ran.join(',');
      out.syncMoved = moved;
      f(ran.length === 0 && moved === '');
    }
    netLangSync(function(){ end(); });
    setTimeout(end, 400);
  });
  return out;
}, { s: seed.toString(), sid: SID });

console.log('');
say(r.foldFound, 'the article carries a DOWNLOAD section that folds like every other one');
say(r.offered.length > 0,
    'and it offers a ↓ per chapter its owner allowed AND the server opens: ' +
    (r.offered.join(' ') || 'none'));
say(r.offered.every(a => String(a).indexOf('words') < 0 && String(a).indexOf('gram') < 0),
    'and offers none for the dictionary or the grammar — supabase/schema.sql’s ' +
    '`slice_read` refuses those to everybody but the owner, so a ↓ there could ' +
    'never land');
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
say(!r.packHasTheirs && r.packIsMine,
    'their language is not in this person’s backup — 「入らん」');
console.log('    [opens=' + r.opens + ' packWhileOpenHasTheirs=' +
            r.packWhileOpenHasTheirs + ' pushRefused=' + r.pushRefused + ']');
say(!r.opens || r.pushRefused === true,
    'and nothing WRITES it out even when it is the language being looked at — ' +
    'bkPack() packs whatever is open, so what is asked is the writer: ' +
    (r.opens ? 'bkPush refused it (' + r.pushHow + ')'
             : 'it cannot be opened, which is the same answer'));
say(r.stillTheirs,
    'and what landed is still theirs after all of that — byte for byte the ' +
    'body the server sent, not this phone’s alphabet written over it');
say(r.syncRefused,
    'and netLangSync() will not run on it — syMerge adds both sides, and one ' +
    'pass would put something into a language somebody else wrote' +
    ((r.syncPut || r.syncMoved)
      ? ' (it put `' + (r.syncPut || '—') + '` and moved `' + (r.syncMoved || '—') + '`)'
      : ''));

await br.close();
if (bad.length){
  console.log('\ndl: ' + bad.length + ' problem' + (bad.length > 1 ? 's' : '') + '.\n');
  process.exit(1);
}
console.log('\ndl: a chapter of somebody else’s language is taken by pressing ↓ on it,\n' +
            '    lands in storage as a language of its own with `mine` false, and\n' +
            '    nothing of the person’s own is touched, backed up or synced with it.');
