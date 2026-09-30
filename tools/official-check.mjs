/* tools/official-check.mjs — an official account's page offers its languages.
   ---------------------------------------------------------------------------
   「アンタイトルドのところがそもそもみんなと違くなるようにしたいの」 OWNER
   2026-09-30 (docs/FEATURE_RULES.md). On an account the server marks official
   (profile.official, carried on profile_seen) the one language a profile
   shows is replaced by ONE row, 「DL可能言語」; pressing it arrives at the
   languages that account has published, each opening its own page. Every
   other profile draws its language exactly as before.

   The real road, with the wire faked the way tools/load-check.mjs fakes it:
   the row the server sends, whoOf(), the card, the door (navLand), the read
   (netDlLangs) and the list. Nothing here decides what the page should draw
   by reading the app's own branch.

   THE CLAIMS.
     1. A person is asked for with `official` (NET_WHO_SEL).
     2. A marked profile draws one 「DL可能言語」 row where the language was,
        and not the language's name.
     3. Pressing it reads that account's PUBLISHED languages, by its uuid,
        capped, and draws one row for each, each opening that language.
     4. An unmarked profile is unchanged: its language, its door, no
        「DL可能言語」.
     5. Your own page when your account is marked draws the same row in place
        of your language, and does not when it is not.

   Run: node tools/official-check.mjs        (npm run official)               */
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const INDEX = 'file://' + path.join(dir, '..', 'www', 'index.html');

const bad = [];
let said = 0;
function say(ok, line){ said++; console.log('  ' + (ok ? 'ok      ' : 'FAILED  ') + line); if (!ok) bad.push(line); }

function wire(cfg){
  var log = [], out = 0;
  window.__L = { log:log, out:function(){ return out; } };
  var b64 = function(o){
    return btoa(unescape(encodeURIComponent(JSON.stringify(o))))
      .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  };
  var TOK = 'h.' + b64({ sub:'me1', email:'aya@example.com', app_metadata:{ provider:'email' } }) + '.s';
  try {
    localStorage.setItem('lingua.sess', JSON.stringify({ at:TOK, rt:'r', uid:'me1' }));
    localStorage.setItem('lingua.set', JSON.stringify({ walked:true, done:true, acct:'me1' }));
    localStorage.setItem('lingua.me.me1', JSON.stringify({ uid:'me1', name:'Aya', handle:'aya' }));
    localStorage.setItem('lingua.langs.me1', JSON.stringify({ L1:{} }));
    localStorage.setItem('lingua.cur.me1', JSON.stringify('L1'));
  } catch (e) {}
  function qs(u, k){ var m = new RegExp('[?&]' + k + '=([^&]*)').exec(u); return m ? decodeURIComponent(m[1]) : ''; }
  /* who each handle is: lingua is marked, iri is not, and you are whatever
     the run says (window.__ME_OFF) */
  var WHO = {
    lingua: { id:'u-lingua', handle:'lingua', display:'Lingua', official:true,
              lang_id:'L-untitled', lang_name:'Untitled', lang_pub:true, fo:0, fr:5 },
    iri:    { id:'u-iri', handle:'iri', display:'Iri', official:false,
              lang_id:'L-iri', lang_name:'Vethi', lang_pub:true, fo:2, fr:3 },
    aya:    { id:'me1', handle:'aya', display:'Aya', official:false,
              lang_id:'L1', lang_name:'Kela', lang_pub:false, fo:1, fr:1 }
  };
  function answer(m, u){
    var p = u.replace(/^[a-z]+:\/\/[^/]*/, '').split('?')[0], h, w;
    if (p === '/auth/v1/token' || p === '/auth/v1/user') return { access_token:TOK, refresh_token:'r', user:{ id:'me1' }, id:'me1' };
    if (p === '/functions/v1/verify-plan') return { plan:'free' };
    if (p === '/rest/v1/profile') return [{ id:'me1', handle:'aya', display:'Aya', prefs:{}, staff:false }];
    if (p === '/rest/v1/profile_seen'){
      h = qs(u, 'handle').replace(/^(eq|in)\./, '').replace(/[()]/g, '');
      w = WHO[h];
      if (!w) return [];
      w = JSON.parse(JSON.stringify(w));
      if (h === 'aya') w.official = !!window.__ME_OFF;
      /* a server that was not asked for the column does not send it */
      if (qs(u, 'select').split(',').indexOf('official') < 0) delete w.official;
      return [w];
    }
    if (p === '/rest/v1/language' && m === 'GET')
      return /owner=eq\.me1/.test(u) ? [{ id:'L1', owner:'me1', name:'Kela', created_at:'2026-09-01T00:00:00Z', wsys:'alpha' }] : [];
    /* the official account has two published languages and one that is not
       -- which language_seen hands only to its owner, so it never comes here */
    if (p === '/rest/v1/language_seen'){
      if (qs(u, 'owner') === 'eq.u-lingua' && qs(u, 'published_at') === 'not.is.null')
        return [{ id:'L-voy', name:'Voynich', created_at:'2026-09-30T00:00:00Z' },
                { id:'L-rong', name:'Rongorongo', created_at:'2026-09-30T01:00:00Z' }];
      return [];
    }
    return m === 'GET' ? [] : [{ id:'x' }];
  }
  function Fake(){ this.readyState = 0; this.status = 0; this.responseText = ''; }
  Fake.prototype.open = function(m, u){ this.__m = m; this.__u = String(u || ''); };
  Fake.prototype.setRequestHeader = function(){};
  Fake.prototype.abort = function(){};
  Fake.prototype.getResponseHeader = function(){ return null; };
  Fake.prototype.send = function(){
    var self = this;
    log.push({ m:self.__m, u:self.__u });
    out++;
    setTimeout(function(){
      out--;
      self.readyState = 4; self.status = 200;
      try { self.responseText = JSON.stringify(answer(self.__m, self.__u)); } catch (e) { self.responseText = 'null'; }
      if (self.onreadystatechange) self.onreadystatechange();
    }, 2);
  };
  window.XMLHttpRequest = Fake;
}

async function quiet(pg){
  let idle = 0, n = -1;
  for (let i = 0; i < 300; i++){
    const s = await pg.evaluate(() => [window.__L.out(), window.__L.log.length]);
    if (s[0] === 0 && s[1] === n) idle++; else idle = 0;
    n = s[1];
    if (idle >= 8) return;
    await new Promise(r => setTimeout(r, 50));
  }
}
/* what the card draws where the language goes: the rows of `.wldrow` inside
   the card, their words and where each goes */
const card = (pg) => pg.evaluate(() => Array.prototype.map.call(
  document.querySelectorAll('#app .mecard .wldrow'),
  function(b){ return { text:b.textContent.trim(), go:b.getAttribute('data-a') || '' }; }));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{ width:390, height:844 } });
const errs = [];
pg.on('pageerror', e => errs.push(String((e && e.message) || e)));
await pg.route('https://fonts.googleapis.com/**', r => r.fulfill({ status:200, contentType:'text/css', body:'' }));
await pg.route('https://fonts.gstatic.com/**', r => r.abort());
await pg.addInitScript(wire, {});
await pg.goto(INDEX);
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });
await quiet(pg);
const DL = await pg.evaluate(() => t('dl.langs'));

/* 1 */
const sel = await pg.evaluate(() => NET_WHO_SEL);
say(/[?&,=]official(,|$)/.test(sel), '1 a person is asked for with `official` -- ' + sel.replace(/^.*select=/, ''));

/* 2 */
await pg.evaluate(() => { go('profile', 'lingua'); });
await quiet(pg);
const off = await card(pg);
say(off.length === 1 && off[0].text === DL && /"dllangs"/.test(off[0].go) && /"lingua"/.test(off[0].go),
    '2 a marked profile draws one 「' + DL + '」 row going to its list -- ' + JSON.stringify(off));
say(!off.some(r => /Untitled/.test(r.text)), '2 and not the one language it has -- ' + off.map(r => r.text).join(' | '));

/* 3 */
await pg.evaluate(() => { window.__L.log.length = 0; });
await pg.evaluate(() => { var b = document.querySelector('#app .mecard [data-do="go"][data-a*="dllangs"]'); if (b) b.click(); });
await quiet(pg);
const on = await pg.evaluate(() => here().r);
const reads = await pg.evaluate(() => window.__L.log.map(x => x.u).filter(u => /language_seen/.test(u)));
const cap = await pg.evaluate(() => NET_PAGE);
const lim = reads.length ? +((/[?&]limit=(\d+)/.exec(reads[0]) || [])[1] || 0) : 0;
say(on === 'dllangs', '3 pressing it arrives at the list -- on ' + on);
say(reads.length === 1 && /owner=eq\.u-lingua/.test(reads[0]) && /published_at=not\.is\.null/.test(reads[0]) && lim > 0 && lim <= cap,
    '3 which reads that account\'s published languages, by its uuid, capped at ' + cap + ' -- ' +
    reads.map(u => u.replace(/^[a-z]+:\/\/[^/]*/, '')).join(' '));
const rows = await pg.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#app .body .wldrow'),
  function(b){ return { text:b.textContent.trim(), go:b.getAttribute('data-a') || '' }; }));
say(rows.length === 2 && rows[0].text === 'Voynich' && /"about","L-voy"/.test(rows[0].go) &&
    rows[1].text === 'Rongorongo' && /"about","L-rong"/.test(rows[1].go),
    '3 and draws one row for each published language, each opening it -- ' + JSON.stringify(rows));

/* 4 */
await pg.evaluate(() => { go('profile', 'iri'); });
await quiet(pg);
const iri = await card(pg);
say(iri.length === 1 && iri[0].text === 'Vethi' && /"about","L-iri"/.test(iri[0].go),
    '4 an unmarked profile draws its language and its door, as before -- ' + JSON.stringify(iri));
say(!(await pg.evaluate(() => document.getElementById('app').innerHTML)).includes('dllangs'),
    '4 and nothing about 「' + DL + '」');

/* 5 */
async function mine(o){
  await pg.evaluate((o) => { window.__ME_OFF = o; pullForget(); goTab('feed'); }, o);
  await quiet(pg);
  await pg.evaluate(() => { goTab('profile'); });
  await quiet(pg);
  return card(pg);
}
const meOn = await mine(true), meOff = await mine(false);
say(meOn.length === 1 && meOn[0].text === DL, '5 your own page, marked, draws 「' + DL + '」 in place of your language -- ' + JSON.stringify(meOn));
say(!meOff.some(r => r.text === DL), '5 and unmarked does not -- ' + JSON.stringify(meOff));

say(errs.length === 0, 'nothing threw -- ' + (errs.join(' | ') || 'none'));
await br.close();
console.log(bad.length ? '\nofficial-check: ' + bad.length + ' FAILED' : '\nofficial-check: all ' + said + ' claims hold');
process.exit(bad.length ? 1 : 0);
