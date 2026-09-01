/* A language comes back on a phone that has never seen it.
   ---------------------------------------------------------------------
   「基本は全部サーバー管理」「アカウント消したら残るわけがない」 OWNER
   2026-08-26. The server is the record and the phone is the copy that works
   with no signal — and `netOut()` only drops the session, so on the SAME
   phone signing back in finds everything in localStorage and the claim looks
   true. On a new phone it was not: nothing in `www/` had ever read a
   `language` row back, so `LANGS` came up empty, `sid` was gone, and
   `netLangRow()` made a SECOND language on the server. The first one stayed
   there with nothing pointing at it.

   The same root, twice: `netLangSync()` read `langId` — the one language that
   happens to be open — so a second or third language never went up at all.
   There was nothing to come back.

   What is stubbed is `netSend()`, and only that: it is the one place every
   request in www/net.js goes through, so everything above it — netLangRow,
   netSlices, netSlicePut, the merge — runs for real against a server made of
   two arrays. A check that stubbed netSlices or netLangSync would be asking
   its own answer back (CLAUDE.md rule 12).

   Run: node tools/again-check.mjs                                        */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

const bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{ width:390, height:844 } });
await pg.goto('file://' + path.join(dir, '..', 'www', 'index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

/* ---- a server made of two arrays, behind the one transport -------------- */
const SERVER = `
  window.__SRV = { lang:[], slice:[], n:0, down:false, sent:[] };
  netSend = function(method, p, body, tok, ok, bad){
    var S = window.__SRV;
    if (S.down){ setTimeout(function(){ bad(null, 0, 'down'); }, 0); return; }
    function answer(v){ setTimeout(function(){ ok(v); }, 0); }
    function arg(k){
      var m = new RegExp('[?&]' + k + '=eq\\\\.([^&]*)').exec(p);
      return m ? decodeURIComponent(m[1]) : '';
    }
    if (method === 'POST' && p.indexOf('/rest/v1/language') === 0){
      var id = 'srv' + (++S.n);
      S.lang.push({ id:id, owner:body.owner, name:body.name || '', published_at:null });
      S.sent.push('language:' + id);
      return answer([{ id:id }]);
    }
    if (method === 'PATCH' && p.indexOf('/rest/v1/language') === 0){
      var lid = arg('id'), j;
      for (j = 0; j < S.lang.length; j++) if (S.lang[j].id === lid)
        S.lang[j].published_at = body.published_at;
      return answer([]);
    }
    if (method === 'POST' && p.indexOf('/rest/v1/slice') === 0){
      var rows = (body instanceof Array) ? body : [body], k, r, f, hit;
      for (k = 0; k < rows.length; k++){
        r = rows[k]; hit = null;
        for (f = 0; f < S.slice.length; f++)
          if (S.slice[f].language === r.language && S.slice[f].kind === r.kind) hit = S.slice[f];
        if (hit){ hit.body = r.body; hit.no = r.no; }
        else S.slice.push({ language:r.language, kind:r.kind, body:r.body, no:r.no });
        S.sent.push('slice:' + r.language + ':' + r.kind);
      }
      return answer([]);
    }
    if (method === 'GET' && p.indexOf('/rest/v1/slice') === 0){
      var want = arg('language'), out = [], q;
      for (q = 0; q < S.slice.length; q++) if (S.slice[q].language === want)
        out.push({ kind:S.slice[q].kind, body:S.slice[q].body, no:S.slice[q].no });
      return answer(out);
    }
    if (method === 'GET' && p.indexOf('/rest/v1/language') === 0){
      /* language_read: your own, or anybody's that is published. This asks
         with owner=eq., which is the half a person asks about themselves. */
      var own = arg('owner'), o2 = [], z;
      for (z = 0; z < S.lang.length; z++) if (S.lang[z].owner === own)
        o2.push({ id:S.lang[z].id, owner:S.lang[z].owner, name:S.lang[z].name,
                  published_at:S.lang[z].published_at });
      return answer(o2);
    }
    return setTimeout(function(){ bad(null, 404, 'no route ' + method + ' ' + p); }, 0);
  };
  /* netSlicePut() opens its own XMLHttpRequest rather than going through
     netSend(), so it is a SECOND transport and the stub above cannot see it.
     Routed into the same two arrays here rather than left out -- what is
     stubbed is still only the network. */
  netSlicePut = function(sid, kind, body, no, ok, bad){
    netSend('POST', '/rest/v1/slice',
            { language:sid, kind:kind, body:String(body || ''), no:(no || 0) + 1 },
            '', function(){ ok(); }, function(){ bad(null, 0); });
  };
`;

/* ---- 1. two languages, one of them not open ----------------------------- */
const up = await pg.evaluate(async ({ s, srv }) => {
  eval('(' + s + ')()');
  SET.done = true;
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'me', anon:false };
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }

  /* the one the fixture made is open; a second one beside it, written and
     then LEFT — which is the ordinary state of a person's other language */
  var first = langId;
  langName = 'Vaska'; save();
  var second = langMint(); langStore();
  var was = langId;
  langOpen(second);
  langName = 'Toko';
  WORDS = [{ hw:'sula', ph:['s','u','l','a'], mn:'star', mns:['star'], pos:'n', at:1 }];
  save();
  langOpen(was);
  /* and a language that is only READ, which must never go up */
  langSeenAdd('theirs-1', 'Shango');
  localStorage.setItem(langKeyOf('theirs-1', 'letters'), '[{"id":"x"}]');

  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(120);

  var S = window.__SRV, names = S.lang.map(function(r){ return r.name; }).sort();
  return {
    first: first, second: second,
    rows: S.lang.length, names: names,
    sids: [LANGS[first] && LANGS[first].sid, LANGS[second] && LANGS[second].sid],
    /* every slice that went up, by language */
    upFirst: S.slice.filter(function(r){ return r.language === (LANGS[first]||{}).sid; }).length,
    upSecond: S.slice.filter(function(r){ return r.language === (LANGS[second]||{}).sid; }).length,
    theirsSent: S.sent.filter(function(x){ return x.indexOf('theirs-1') >= 0; }).length,
    theirsRow: !!LANGS['theirs-1'] && LANGS['theirs-1'].mine === false,
    srv: JSON.stringify({ lang:S.lang, slice:S.slice })
  };
}, { s: seed.toString(), srv: SERVER });

console.log('');
say(up.rows === 2, 'both of a person’s languages are on the server, the open one ' +
    'and the one they are not looking at: ' + up.rows + ' rows (' + up.names.join(', ') + ')');
say(!!up.sids[0] && !!up.sids[1] && up.sids[0] !== up.sids[1],
    'and each carries the server’s id for it, so nothing makes a second row later: ' +
    JSON.stringify(up.sids));
say(up.upFirst > 0 && up.upSecond > 0,
    'with the slices of both: ' + up.upFirst + ' and ' + up.upSecond);
say(up.theirsRow && up.theirsSent === 0,
    'and a language that is only READ went nowhere — syMerge adds both sides, ' +
    'and one pass would put something into a language somebody else wrote (' +
    up.theirsSent + ' requests about it)');

/* ---- 2. a new phone: nothing in storage, the same person signs in ------- */
const back = await pg.evaluate(async ({ s, srv, saved }) => {
  /* the phone is replaced: every byte of localStorage is gone. The server is
     the only thing left, which is the whole claim. */
  localStorage.clear();
  return { srv: saved };
}, { s: seed.toString(), srv: SERVER, saved: up.srv });
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const came = await pg.evaluate(async ({ srv, saved }) => {
  eval(srv);
  var S = window.__SRV, keep = JSON.parse(saved);
  S.lang = keep.lang; S.slice = keep.slice;
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }

  var before = Object.keys(LANGS).length;
  /* signing in is netTook() -- the one place that knows a session arrived */
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'me' } });
  await wait(400);
  var ids = Object.keys(LANGS), i, out = [];
  for (i = 0; i < ids.length; i++)
    out.push({ id:ids[i], name:LANGS[ids[i]].name, mine:LANGS[ids[i]].mine,
               words:(localStorage.getItem(langKeyOf(ids[i], 'words')) || '').length });
  return { before: before, after: ids.length, langs: out };
}, { srv: SERVER, saved: up.srv });

const names = came.langs.map(l => l.name).sort().join(',');
say(names.indexOf('Vaska') >= 0 && names.indexOf('Toko') >= 0,
    'on a phone with an empty storage, signing in brings both back by name: ' +
    (names || 'nothing'));
say(came.langs.filter(l => l.words > 2).length >= 2,
    'and with what was in them, not just their names: ' +
    JSON.stringify(came.langs.map(l => l.name + ' ' + l.words + 'B')));
say(came.langs.every(l => l.mine === true),
    'and both are the person’s own');

/* ---- 3. it FILLS IN, and never wins ------------------------------------- */
const holds = await pg.evaluate(async ({ srv, saved }) => {
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  eval(srv);
  var S = window.__SRV, keep = JSON.parse(saved);
  S.lang = keep.lang; S.slice = keep.slice;
  /* this phone has a language already, and its words differ from the server's */
  var ids = Object.keys(LANGS), one = ids[0];
  localStorage.setItem(langKeyOf(one, 'words'),
    JSON.stringify([{ hw:'ONPHONE', ph:['o'], mn:'here', mns:['here'], pos:'n', at:9 }]));
  var was = localStorage.getItem(langKeyOf(one, 'words'));
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'me' } });
  await wait(400);
  var now = localStorage.getItem(langKeyOf(one, 'words'));
  /* and a server that does not answer at all */
  S.down = true;
  var langsWas = JSON.stringify(LANGS);
  var slicesWas = ids.map(function(i2){ return localStorage.getItem(langKeyOf(i2, 'words')); }).join('|');
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'me' } });
  await wait(400);
  S.down = false;
  return {
    kept: now === was || (now || '').indexOf('ONPHONE') >= 0,
    downLangs: JSON.stringify(LANGS) === langsWas,
    downSlices: ids.map(function(i2){ return localStorage.getItem(langKeyOf(i2, 'words')); }).join('|') === slicesWas
  };
}, { srv: SERVER, saved: up.srv });

say(holds.kept,
    'what is already on the phone is not written over by what is on the server — ' +
    'a restore fills in what is missing and stops (docs/DATA_SAFETY.md)');
say(holds.downLangs && holds.downSlices,
    'and a server that does not answer changes nothing at all — 「the plan is ' +
    'unknown」 and 「this person has no data」 are not the same state');

await br.close();
if (bad.length){
  console.log('\nagain: ' + bad.length + ' problem' + (bad.length > 1 ? 's' : '') + '.\n');
  process.exit(1);
}
console.log('\nagain: every language a person made is on the server, and a phone that has\n' +
            '       never seen them gets them all back by signing in — without one byte\n' +
            '       of what is already there being written over.');
