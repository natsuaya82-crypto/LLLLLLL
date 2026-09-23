/* ---------------------------------------------------------------------------
   tools/take-check.mjs — somebody else's language: what the ↓ says, and that
   it is never your wiki.

   Two decisions of OWNER 2026-09-23:
     「↓を押したら⭕️でダウンロード状況表示。ダウンロードしてる言語は⭕️☑️にして。」
     「後人の言語は自分の言語じゃないからwikiページに表示させないように。」

   Neither throws. A row that never says it is going looks like a button that
   did nothing; a row that says ☑ off a flag this phone wrote is a row that
   lies the moment the server says no. And a taken language drawn as your
   article renders perfectly -- with your profile's row pointing at it.

   It drives the REAL press, wldGet(), through the REAL netTakePut() and
   netTakes() -- only netSend and netGet, the wire itself, are held here, so
   the answer is handed back the way a server hands it back. What the row is
   is read off the page, never off wldTakeOf(): asking the function under
   test what it thinks is a copy that always agrees.

   Run it:  node tools/take-check.mjs
   --------------------------------------------------------------------------- */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{ width:390, height:844 } });
await pg.goto('file://' + path.join(dir, '..', 'www', 'index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:10000 });

const r = await pg.evaluate(({ s }) => {
  eval('(' + s + ')()');
  SET.walked = true; planGot('plus');
  var out = {}, lid = 'take-lang-1', wire = { send:null, get:null };
  /* The wire, and nothing above it. */
  window.netSend = function(m, p, b, at, ok, bad){ wire.send = { ok:ok, bad:bad }; };
  window.netGet = function(p, ok, bad){ wire.get = { p:p, ok:ok, bad:bad }; };
  WLD_HAVE[lid] = { id:lid, name:'Necwe', owner:'somebody-else', pub:'2026-08-01' };
  WLDS_HAVE[lid] = {
    wld:     { body: JSON.stringify({ dl:true }), no:1 },
    script:  { body: JSON.stringify({ dir:'ltr' }), no:1 },
    letters: { body: JSON.stringify([{ id:'q1', st:[{pts:[[100,100],[700,700]]}],
                                       ch:'', nm:'q', snd:[] }]), no:1 },
    kb:      { body: JSON.stringify({ boards:[] }), no:1 }
  };
  langOwnGot(lid, 'somebody-else');
  function stand(){
    window.route = 'about'; NAV = [{ r:'about', a:lid }]; ABOPEN.wlddl = true;
    render();
  }
  /* What each chapter's row IS, off the page: a button carrying ↓, a row
     that is busy, or a row that says it is taken. */
  function rows(){
    var o = {}, n = document.querySelectorAll('#app .set'), i, b, sv;
    for(i = 0; i < n.length; i++){
      b = n[i].getAttribute('data-do') === 'wldGet' ?
          JSON.parse(n[i].getAttribute('data-a'))[1] : null;
      sv = n[i].querySelector('.sv');
      if(b) o[b] = 'dl';
      else if(n[i].getAttribute('aria-busy') === 'true') o[n[i].textContent.trim()] = 'wait';
      else if(sv && sv.getAttribute('aria-label') === t('wld.took')) o[n[i].textContent.trim()] = 'took';
    }
    return o;
  }
  stand();
  out.before = rows();
  /* ---- the press, the wait, the answer -------------------------------- */
  wldGet(lid, 'letters');
  out.going = rows();
  wire.send.ok([]);                             /* the row went in */
  wire.get.ok([{ language: lid }]);             /* and the takes say so */
  out.done = rows();
  /* ---- a refusal puts it back ----------------------------------------- */
  langTookGot([]); slRm(langKeyOf(lid, 'letters'));
  stand();
  var toasts = [], wasToast = window.toast;
  window.toast = function(m){ toasts.push(m); };
  wldGet(lid, 'letters');
  wire.send.bad(null, 0, 'x');
  window.toast = wasToast;
  out.refused = rows();
  out.refusedSaid = toasts;
  /* ---- the chapter in memory is not 「taken」 until the server says so -- */
  langTookGot([]);
  slWr(langKeyOf(lid, 'letters'), WLDS_HAVE[lid].letters.body);
  stand();
  out.heldNotTaken = rows();
  /* ---- arriving on one already taken ---------------------------------- */
  langTookGot([lid]);
  stand();
  out.arrive = rows();

  /* ---- a taken language OPEN is not your wiki ------------------------- */
  LANGS[lid] = LANGS[lid] || {};
  langOpen(lid);
  /* Its page's answer IN, so that nothing but the one question can keep the
     article off the screen. Without it the page stands waiting and this
     claim was green with the question taken out -- measured. */
  wldPubGot(lid, true);
  window.route = 'profile'; NAV = [{ r:'profile' }]; render();
  out.profileRow = !!document.querySelector('#app .wldrow');
  var noArg = [], rt = ['about', 'world'], i, h;
  for(i = 0; i < rt.length; i++){
    window.route = rt[i]; NAV = [{ r:rt[i] }]; render();
    h = document.getElementById('app').innerHTML;
    noArg.push({ r: rt[i],
                 edit: Array.prototype.some.call(document.querySelectorAll('#app [data-do="go"]'),
                   function(e){ return (e.getAttribute('data-a') || '').indexOf('world') !== -1; }),
                 h1: !!document.querySelector('#app h1.abth') });
  }
  out.noArg = noArg;
  /* ---- and your own still is ------------------------------------------ */
  var mine = Object.keys(LANGS).filter(function(k){ return langWhose(k) === LW_MINE; })[0];
  if(mine){ langOpen(mine); wldPubGot(mine, true);
    window.route = 'profile'; NAV = [{ r:'profile' }]; render();
    out.ownRow = !!document.querySelector('#app .wldrow');
    window.route = 'about'; NAV = [{ r:'about' }]; render();
    out.ownH1 = !!document.querySelector('#app h1.abth'); }
  out.mine = mine || null;
  /* ---- and a language whose owner has not answered yet is NOT somebody
     else's: its row and article stay, and Edit waits for the answer. The
     first version of this gate asked langLocked(), which folds 「not asked」
     into 「not mine」, and world-check and acct-check went red at the
     integration -- a new language of your own lost its row and its page. */
  LANGS['take-new'] = { name:'Zeth' }; langStore(); wldPubGot('take-new', true);
  langOpen('take-new');
  out.waitWhose = langWhose('take-new');
  window.route = 'profile'; NAV = [{ r:'profile' }]; render();
  out.waitRow = !!document.querySelector('#app .wldrow');
  window.route = 'about'; NAV = [{ r:'about' }]; render();
  out.waitH1 = !!document.querySelector('#app h1.abth');
  out.waitEdit = Array.prototype.some.call(document.querySelectorAll('#app [data-do="go"]'),
    function(e){ return (e.getAttribute('data-a') || '').indexOf('world') !== -1; });
  return out;
}, { s: seed.toString() });

let bad = 0;
const say = (ok, what, got) => {
  console.log((ok ? '  ok   ' : '  FAIL ') + what + (ok ? '' : '\n         got: ' + JSON.stringify(got)));
  if (!ok) bad++;
};
say(r.before.letters === 'dl', '1 before the press the chapter is a ↓', r.before);
say(Object.values(r.going).indexOf('wait') !== -1 && r.going.kb === 'dl',
    '2 pressed, that chapter turns while the put is out -- and only that one', r.going);
say(Object.values(r.done).indexOf('took') !== -1 && r.done.kb === 'dl',
    '3 the server said so: ⭕☑️ on that chapter, ↓ on the one not taken', r.done);
say(r.refused.letters === 'dl' && r.refusedSaid.length === 1,
    '4 refused: back to ↓, and it says so once', { rows: r.refused, said: r.refusedSaid });
say(r.heldNotTaken.letters === 'dl',
    '5 the chapter in memory with no `language_take` answer is still a ↓', r.heldNotTaken);
say(Object.values(r.arrive).indexOf('took') !== -1,
    '6 arriving on a language already taken draws ⭕☑️ from the first frame', r.arrive);
say(r.profileRow === false, '7 a taken language open: no wiki row on the profile', r.profileRow);
say(r.noArg.every((x) => !x.edit && !x.h1),
    '8 a taken language open: about and world draw no article of yours', r.noArg);
say(r.mine && r.ownRow === true && r.ownH1 === true,
    '9 your own language still has its row and its article', r);

say(r.waitWhose === 'wait' && r.waitRow === true && r.waitH1 === true && r.waitEdit === false,
    '10 owner not answered yet: the row and the article stay, Edit waits',
    { whose: r.waitWhose, row: r.waitRow, h1: r.waitH1, edit: r.waitEdit });

await br.close();
console.log(bad ? `\ntake-check: ${bad} failed` : '\ntake-check: 10 of 10');
process.exit(bad ? 1 : 0);
