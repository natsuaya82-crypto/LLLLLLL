/* ---------------------------------------------------------------------------
   tools/taken-check.mjs — somebody else's language, taken: the same on every
   plan, nothing on it to edit, and a keyboard of your own for it.

   OWNER 2026-09-30 (docs/FEATURE_RULES.md § Owner decision log, 2026-09-30
   「作れる言語と DL 言語の数は 1・3・無限。人の言語は使うだけ」 and its 追記,
   and 「公式アカウントのプロフィールは「DL可能言語」の一行…」 (2)):
     「dl言語は有料無料関係ないって何回も言ってるよね？」
     「dl言語は厳しくしないと、アプリ内で文字を使う、意味を見たりって言う編集は
       できないし…プランでも変わらない」
     「dl言語はキーボードは自分で作ってねって感じ。キーボードもDLできるけど、
       ないやつは自作可能」

   Nothing here throws. A taken alphabet folded to a–z on free renders; a
   Save drawn over a letter nobody may change renders; a keyboard built for
   somebody else's language and written into THEIR slice renders. So this
   drives the real app and counts.

   THE SURFACE IS COUNTED, NOT LISTED. What an editing control IS is asked of
   the app itself: every face of your OWN language that a press can reach is
   walked, every control on it pressed (and every field typed into), and a
   name is an editor if pressing it -- and the Save it lit, pressed the way a
   person would press it -- WROTE the language: a slice whose content moved,
   and moved from what the same face stood on fresh holds (a page tidying
   what it draws is on both sides and cancels). The account's own screens
   (the profile, the theme) write the account, not the language, and are
   not editors. Then the SAME language -- byte for byte the same slices -- is
   taken from another account and every face of it walked the same way, and
   none of those names may be drawn on it, no Save may be drawn, no upgrade
   line (`.capwarn`) may be drawn, and no press may put anything of it on the
   wire. A screen added tomorrow is walked tomorrow; an editor added to it is
   an editor because pressing it edits.

   THE ONE EXCEPTION IS THE KEYBOARD, and it is named with its reason
   (TAKER_MAY) rather than left uncounted: the person who took a language
   builds their own keyboard for it, stored under THEIR account in
   `take_kb` (supabase/schema.sql), and the language's own `kb` slice does
   not move. That half is asked separately (4.., below), on the wire.

   Asking the page and the wire, never langLocked() itself: asking the
   function under test what it thinks is a copy that always agrees.

   Run it:  node tools/taken-check.mjs
   --------------------------------------------------------------------------- */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
let bad = 0, claims = 0;
const say = (ok, what, got) => {
  claims++;
  console.log((ok ? '  ok   ' : '  FAIL ') + what + (ok ? '' : '\n         got: ' + JSON.stringify(got).slice(0, 1600)));
  if (!ok) bad++;
};
/* The keyboard chapter is the taker's to build in (OWNER 2026-09-30 (2)). */
const TAKER_MAY = ['kb'];   /* the route, and every sheet of it (form|kb...) */
/* The router: go() and back() are how every screen is reached (navLand,
   www/shell.js), and a door is not an edit. What arriving somewhere writes is
   that screen's, and it is counted on that screen's own presses. */
const ROUTER = ['go', 'back'];

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
pg.on('pageerror', (e) => errs.push(e.message));
await pg.goto('file://' + path.join(dir, '..', 'www', 'index.html'));
await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });
await pg.evaluate('window.__seed = ' + seed.toString());

/* The page half: set once, driven face by face from here, so a face that
   hangs is named rather than taking the whole run with it. */
await pg.evaluate(() => {
  var LID = 'taken-1', WIRE = [], TKB = null, K = window.__tk = { LID:LID, WIRE:WIRE };
  K.tkb = function(){ return TKB; };
  K.tkbClear = function(){ TKB = null; };
  /* ---- the taken language: the fixture's own, byte for byte, plus what a
     plan would fold -- 120 words and a stage of the owner's own -- under
     another account. ------------------------------------------------------ */
  /* seed() writes into whatever language is open, so the fixture's own is
     named once and opened before every seed: a seed standing in the taken
     one would make the copy its own. */
  var OWN = null;
  K.fresh = function(which, plan, kb){
    if(OWN === null){ window.__seed(); OWN = langId; }
    if(langId !== OWN){ langId = OWN; }
    /* the memory store too: seed() writes the fixture's slices and leaves
       any other key standing, so a keyboard built on one start would still
       be there on the next */
    LSL = {};
    window.__seed(); KEEP = {}; SET.walked = true; planGot(plan || 'free');
    if(langId !== OWN) throw new Error('seed opened ' + langId);
    var own = langId, rows = [], i, b, k;
    /* two letters past a–z, as an alphabet made on a paid plan has */
    LETTERS.push({ id:'lt.ch', nm:'ch', st:[{ pts:[[100,100],[700,700]] }], snd:[] },
                 { id:'lt.sh', nm:'sh', st:[{ pts:[[100,700],[700,100]] }], snd:[] });
    slWr(langKey('letters'), JSON.stringify(LETTERS));
    for(i = 0; i < SLICES.length; i++){
      k = SLICES[i]; b = slRd(langKeyOf(own, k));
      if(k === 'words'){ b = JSON.parse(b || '[]');
        for(var n = 0; n < 120; n++) b.push({ hw:'zz' + n, mn:'m' + n });
        b = JSON.stringify(b); }
      if(k === 'phases'){ b = JSON.parse(b || '{}');
        b.extra = [{ id:'own1', title:'mine', slots:['s1'], labels:{ s1:'a' }, what:'' }]; b = JSON.stringify(b); }
      if(b) rows.push({ kind:k, no:1, at:'x', body:b });
    }
    /* and, asked for, a keyboard its maker built and chose */
    if(kb === 'has') rows.push({ kind:'kb', no:1, at:'x',
      body:JSON.stringify({ kbs:[{ id:'kowner', nm:'Owner', pat:'abc', lay:kbPatLay('abc') }], at:1, v:KB_V }) });
    window.netSend = function(m, p, body, at, ok){
      WIRE.push({ m:m, p:p, b:body });
      if(p.indexOf('take_kb') !== -1){ TKB = body && body.body; return ok([body]); }
      ok([]);
    };
    window.netGet = function(p, ok){
      if(p.indexOf('language_take') !== -1) return ok([{ language:LID }]);
      if(p.indexOf('take_kb') !== -1) return ok(TKB ? [{ body:TKB }] : []);
      if(p.indexOf('/slice') !== -1){
        if(p.indexOf('select=kind,no,at') !== -1) return ok(rows.map(function(x){ return { kind:x.kind, no:1, at:'x' }; }));
        return ok(rows);
      }
      if(p.indexOf('/language') !== -1)
        return ok([{ id:LID, owner:'somebody-else', name:'Necwe', wsys:'alpha', created_at:'2026-01-01', published_at:'2026-01-02' }]);
      ok([]);
    };
    /* and a handwriting sheet already read, so the last step of bringing
       one in (the press that takes its letters) is on the screen to press */
    SH = { names:'', why:'', from:'sheet.pdf', got:[{ nm:'zz', sh:[[[100,100],[700,100],[700,700]]] }] };
    /* memory is new on a launch: the taker's keyboards come down again */
    KBT = {};
    NET_TAKEN = ''; netTakes();
    pullGo('lang', LID);
    if(which === 't') langOpen(LID);
    WIRE.length = 0;
    return own;
  };
  K.stand = function(f){
    window.route = f[0]; NAV = [f[1] === undefined || f[1] === null ? { r:f[0] } : { r:f[0], a:f[1] }];
    render();
  };
  /* The controls: everything a press or a keystroke reaches -- and the
     drawing surface, which a finger draws on rather than presses. */
  K.ctl = function(){
    return Array.prototype.slice.call(document.getElementById('app').querySelectorAll('[data-do],[data-in],[data-ch],#gcanv'));
  };
  K.nameOf = function(el){ return el.getAttribute('data-do') || el.getAttribute('data-in') || el.getAttribute('data-ch') || ('#' + el.id); };
  K.dirty = function(){ var k; for(k in KEEP) if(KEEP.hasOwnProperty(k)){ try{ if(keepDirty(k)) return true; }catch(e){} } return false; };
  K.fire = function(el){
    if(el.id === 'gcanv'){
      var r = el.getBoundingClientRect(), x0 = r.left + r.width * 0.25, y0 = r.top + r.height * 0.25, i;
      function pe(t, f){ el.dispatchEvent(new PointerEvent(t, { bubbles:true, pointerId:1, isPrimary:true, pointerType:'touch',
        clientX:x0 + r.width * 0.5 * f, clientY:y0 + r.height * 0.5 * f, pressure:0.5 })); }
      pe('pointerdown', 0); for(i = 1; i <= 8; i++) pe('pointermove', i / 8); pe('pointerup', 1);
    }
    else if(el.getAttribute('data-do')) el.click();
    else if(el.getAttribute('data-in')){ el.value = (el.value || '') + 'zq'; el.dispatchEvent(new Event('input', { bubbles:true })); }
    else { if(el.type === 'checkbox') el.checked = !el.checked;
           else if(el.options && el.options.length > 1) el.selectedIndex = (el.selectedIndex + 1) % el.options.length;
           el.dispatchEvent(new Event('change', { bubbles:true })); }
    if(popOn()) popYes();
  };
  K.key = function(){ var h = here(); return h.r + '|' + (h.a === undefined || h.a === null ? '' : h.a); };
  /* A face with the language's own ids taken out of its argument: one
     letter's page is every letter's page, and a walk that opened all forty
     would be forty times the same screen. The grammar's pages are named, not
     ids, so each of them stays its own. */
  K.group = function(f){
    if(f[1] === null) return f[0];
    return f[0] + '|' + String(f[1]).split(/([:\/])/).map(function(x){
      return (ltById(x) || findWord(x)) ? '*' : x;
    }).join('');
  };
  K.roots = function(){ var o = [], r; for(r in PAGES) if(PAGES[r].lang) o.push([r, null]); return o; };
  /* One face: stand on it, say what is drawn, then press each control from a
     fresh start and say what it did and where it went. */
  /* A face is REACHED, the way a person reaches it: a route stood on, then
     the presses that lead from it, replayed from a fresh start. So a sheet
     opened from a page has that page under it, with the page's Save and its
     draft, exactly as on a phone. `f` is [route, arg, [press index, ...]]. */
  K.reach = function(which, plan, f){
    K.fresh(which, plan); K.stand([f[0], f[1]]);
    for(var i = 0; i < f[2].length; i++){
      var els = K.ctl(); if(f[2][i] >= els.length) return false;
      K.fire(els[f[2][i]]);
    }
    return true;
  };
  /* What a face draws, without pressing anything: its controls' names. */
  K.look = function(which, plan, f){
    try{ if(!K.reach(which, plan, f)) return null; }catch(e){ return null; }
    var n = {}; K.ctl().forEach(function(el){ n[K.nameOf(el)] = 1; });
    return { key:K.key(), names:Object.keys(n).sort().join(' ') };
  };
  /* One face: say what is drawn, then press each control from a fresh
     start and say what it did and where it went. */
  K.face = function(which, plan, f){
    var out = { ok:false, press:[] }, base = {}, n, i;
    try{ if(!K.reach(which, plan, f)) return out; }catch(e){ return out; }
    out.ok = true;
    out.key = K.key();
    out.names = K.ctl().map(K.nameOf);
    out.cap = document.querySelectorAll('#app .capwarn').length;
    out.mine = langId !== LID;
    n = out.names.length;
    for(i = 0; i < n; i++){
      try{ if(!K.reach(which, plan, f)) continue; }catch(e){ continue; }
      var els = K.ctl(); if(i >= els.length) break;
      var el = els[i], nm = K.nameOf(el), d0 = K.dirty(), lid = langId, wrote = [], j, k0 = K.key(), k1, lit, h1, h0, s0 = K.slc(), s1, sk = [];
      try{ K.fire(el); }catch(e){ }
      k1 = K.key();
      for(j = 0; j < WIRE.length; j++)
        if(WIRE[j].m !== 'GET' && K.ours(WIRE[j])) wrote.push(WIRE[j].m + ' ' + WIRE[j].p);
      if(lid !== langId){ out.press.push({ i:i, nm:nm, changed:false, wrote:wrote, moved:false }); continue; }
      /* a draft it left is pressed through its Save, the way a person would */
      lit = !d0 && K.dirty();
      if(lit) K.commit();
      h1 = langHold();
      s1 = K.slc();
      var w1 = WIRE.slice();
      for(j in s1) if(s1.hasOwnProperty(j) && s1[j] !== s0[j] && K.G.hasOwnProperty(j)) sk.push(j);
      /* and held against the same face stood on fresh: what arriving there
         does to the language on its own (a page tidying what it draws) is on
         both sides and cancels, and what is left is what the press did */
      if(!Object.prototype.hasOwnProperty.call(base, k1)){
        try{ K.fresh(which, plan); var c = k1.indexOf('|'); K.stand([k1.slice(0, c), k1.slice(c + 1) || null]);
             base[k1] = (K.key() === k1) ? langHold() : null; }catch(e){ base[k1] = null; }
      }
      h0 = base[k1];
      /* an edit WROTE the language -- a slice whose content moved -- and
         what it wrote is not what the face it landed on holds anyway */
      var hd = h0 === null ? [] : K.diff(h0, h1);
      var kinds = sk.filter(function(k){ return hd.indexOf(['WORDS','LINES','SCRIPT','LETTERS','NOTES','STG','SND','KB','WLD'][K.G[k]]) !== -1; });
      /* and the language's own row (its writing system, its direction, its
         name) -- a column rather than a slice */
      for(j = 0; j < w1.length; j++) if(w1[j].m === 'PATCH' && /\/rest\/v1\/language\?/.test(w1[j].p)) kinds.push('language');
      out.press.push({ i:i, nm:nm, changed:kinds.length > 0, kinds:kinds, lit:lit,
                       wrote:wrote, moved:k1 !== k0, to:k1.split('|')[0] });
    }
    return out;
  };
  /* The open language's slices as content: parsed, keys in order, so the
     same thing written again is the same. */
  K.canon = function(v){
    if(v === null || typeof v !== 'object') return JSON.stringify(v);
    if(Object.prototype.toString.call(v) === '[object Array]') return '[' + v.map(K.canon).join(',') + ']';
    return '{' + Object.keys(v).sort().map(function(k){ return JSON.stringify(k) + ':' + K.canon(v[k]); }).join(',') + '}';
  };
  K.slc = function(){
    var o = {}, i, k, v;
    for(i = 0; i < SLICES.length; i++){
      k = SLICES[i]; v = LSL[langKeyOf(langId, k)];
      try{ o[k] = (v === undefined || v === null) ? '' : K.canon(JSON.parse(v)); }catch(e){ o[k] = String(v); }
    }
    return o;
  };
  /* which global each slice is read into (www/core.js § LANG_IO) */
  K.G = { words:0, lines:1, script:2, letters:3, notes:4, phases:5, snd:6, kb:7, wld:8 };
  K.diff = function(a, b){
    var A = JSON.parse(a), B = JSON.parse(b), nm = ['WORDS','LINES','SCRIPT','LETTERS','NOTES','STG','SND','KB','WLD','KBT'], o = [], i;
    for(i = 0; i < A.length; i++) if(JSON.stringify(A[i]) !== JSON.stringify(B[i])) o.push(nm[i]);
    return o;
  };
  K.commit = function(){
    var k; for(k in KEEP) if(KEEP.hasOwnProperty(k)){ try{ if(keepDirty(k)) keepSave(k, null); }catch(e){} }
  };
  /* A write OF THE LANGUAGE: its slices, its row. The account's own settings
     (prefs_put) and the taker's keyboard (take_kb) are not the language. */
  K.ours = function(w){
    return /\/rpc\/slice_put|\/rest\/v1\/slice|\/rest\/v1\/language(\?|$)/.test(w.p) ||
           JSON.stringify(w.b || '').indexOf(LID) !== -1 && w.p.indexOf('take_kb') === -1;
  };
});

async function walk(which, plan, see){
  const q = await pg.evaluate(() => window.__tk.roots().map((f) => [f[0], f[1], []]));
  const seen = new Set(), shapes = new Set(), groups = {};
  const inLang = await pg.evaluate(() => { var o = {}, r; for(r in PAGES) if(PAGES[r].lang) o[r] = 1; return o; });
  let faces = 0, presses = 0;
  const t0 = Date.now();
  while (q.length) {
    const f = q.shift();
    const look = await pg.evaluate(({ which, plan, f }) => window.__tk.look(which, plan, f), { which, plan, f });
    if (!look || seen.has(look.key)) continue;
    seen.add(look.key);
    /* One letter's page is every letter's page (K.group), and the same screen
       with other data in it -- the picker once per script -- draws the same
       names on the same kind of face: each walked once. */
    const g = await pg.evaluate((k) => { var i = k.indexOf('|'); return window.__tk.group([k.slice(0, i), k.slice(i + 1) || null]); }, look.key);
    if ((groups[g] = (groups[g] || 0) + 1) > 2) continue;
    const kind = look.key.split('|')[0] + '|' + (look.key.indexOf('form|') === 0 ? look.key.slice(5).split(':')[0] : '') +
      (/\|$/.test(look.key) ? '|0' : '|1');
    if (shapes.has(kind + '|' + look.names)) continue;
    shapes.add(kind + '|' + look.names);
    const t1 = Date.now(), e0 = errs.length;
    const o = await pg.evaluate(({ which, plan, f }) => window.__tk.face(which, plan, f), { which, plan, f });
    if (process.env.TRACE) console.log('  ' + which + ' ' + o.key + ' <- ' + f[0] + '/' + f[2].join('.') + ' ' + (o.names ? o.names.length : '-') + ' ' + (Date.now() - t1) + 'ms');
    if (errs.length > e0) errs[errs.length - 1] += ' (on ' + which + ' ' + o.key + ')';
    if (!o.ok) continue;
    faces++; presses += o.press.length;
    see(o);
    if (f[2].length < 4) for (const p of o.press) if (p.moved && inLang[p.to]) q.push([f[0], f[1], f[2].concat([p.i])]);
  }
  return { faces, presses, ms: Date.now() - t0 };
}

/* ---- 1. what the fold would have hidden, on the page, before anything has
   been pressed ------------------------------------------------------------ */
const r = await pg.evaluate(() => {
  var K = window.__tk, out = {};
  K.fresh('t', 'free'); K.stand(['ltset', 'alpha']);
  function shown(){ var h = document.getElementById('app').innerHTML;
    return LETTERS.filter(function(l){ return ltKindOf(l) === 'alpha' && h.indexOf('&quot;' + l.id + '&quot;') !== -1; }).length; }
  out.tAlphaRows = shown();
  out.tAlpha = LETTERS.filter(function(l){ return ltKindOf(l) === 'alpha'; }).length;
  K.stand(['words', null]);
  out.tWords = WORDS.filter(function(w){ return !wIsForm(w); }).length;
  out.tWordRows = document.querySelectorAll('#app [data-do="openWord"]').length;
  K.stand(['gram', 'book:app']);
  out.tOwnStage = document.getElementById('app').innerHTML.indexOf('own1') !== -1;
  K.fresh('o', 'free'); K.stand(['ltset', 'alpha']);
  out.oAlphaRows = shown();
  out.oAlpha = LETTERS.filter(function(l){ return ltKindOf(l) === 'alpha'; }).length;
  out.oCap = document.querySelectorAll('#app .capwarn').length;
  return out;
});
/* ---- 2. yours: which names edit ------------------------------------------ */
const EDIT = {}, LANGSAVE = new Set();
const kindOf = (key) => { const r = key.split('|')[0]; return r + '|' + (r === 'form' ? key.slice(5).split(':')[0] : ''); };
let ownCap = 0;
/* On Pro, where every editor is drawn; the taken language then on both
   plans, because it is the same on both. */
const ownWalk = await walk('o', 'pro', (o) => {
  ownCap += o.cap;
  for (const p of o.press) if (p.changed && (p.lit || p.nm === 'keepPress')) LANGSAVE.add(kindOf(o.key));
  for (const p of o.press) if (p.changed && ROUTER.indexOf(p.nm) === -1) (EDIT[p.nm] = EDIT[p.nm] || []).push(o.key + ' [' + p.kinds.join(',') + (p.lit ? ' via Save' : '') + ']');
});
if (process.env.TRACE) console.log(Object.keys(EDIT).sort().map((k) => k + ' @' + EDIT[k][0]).join('\n'));
/* ---- 3. theirs: none of them drawn, nothing written ------------------------ */
const drawn = [], saves = [], caps = [], wrote = [];
const mayKb = (key) => TAKER_MAY.some((m) => key.indexOf(m + '|') === 0 || key.indexOf('form|' + m) === 0);
const seeTheirs = (o) => {
  if (o.mine) return;
  for (const p of o.press) for (const w of p.wrote) wrote.push(o.key + ' ' + p.nm + ' -> ' + w);
  if (o.cap) caps.push(o.key);
  if (mayKb(o.key)) return;
  for (const nm of o.names) {
    /* a Save is the language's where, on your own, it wrote the language;
       the profile's and the settings' write the account */
    if (nm === 'keepPress') { if (LANGSAVE.has(kindOf(o.key))) saves.push(o.key); }
    else if (EDIT[nm]) drawn.push(o.key + ' ' + nm);
  }
};
const theirWalk = await walk('t', 'free', seeTheirs);
const theirPro = await walk('t', 'pro', seeTheirs);
/* ---- 4. the keyboard: the taker's own, on their row -------------------- */
const kbr = await pg.evaluate(() => {
  var K = window.__tk, o = {}, i;
  function press(nm, pick){
    var e = Array.prototype.filter.call(document.querySelectorAll('#app [data-do="' + nm + '"]'), pick || function(){ return true; })[0];
    if(!e) return false; e.click(); return true;
  }
  function wire(re){ return K.WIRE.filter(function(w){ return w.m !== 'GET' && re.test(w.p); }); }
  /* A: the language has no keyboard */
  K.fresh('t', 'free');
  var kbKey = langKeyOf(K.LID, 'kb'), sl0 = LSL[kbKey] === undefined ? null : LSL[kbKey];
  K.stand(['kb', null]);
  o.plus = !!document.querySelector('#app [data-do="kbNew"]');
  o.made = press('kbNew') && press('kbAdd');
  o.put = wire(/take_kb/).map(function(w){ return w.b && w.b.language; });
  o.slice = wire(/slice|\/language\?/).map(function(w){ return w.m + ' ' + w.p; });
  o.sliceSame = (LSL[kbKey] === undefined ? null : LSL[kbKey]) === sl0;
  o.onBoard = here().r === 'kb' && !!document.querySelector('#app .kbnm');
  var built = kbStored()[0];
  o.builtId = built ? built.id : null;
  K.WIRE.length = 0;
  /* on a board's page choosing is part of the page's draft, and its Save
     sends it -- as on your own */
  o.applied = press('kbApply') && kbOf().id === o.builtId;
  o.draftPut = wire(/take_kb/).length;
  press('keepPress');
  o.applyPut = wire(/take_kb/).length;
  /* again, on a launch: the row comes down with the language */
  K.fresh('t', 'free');
  o.back = kbStored().length === 1 && kbStored()[0].id === o.builtId && kbOf().id === o.builtId;
  o.backAt = kbApplied(kbBoards().length);
  /* B: the language HAS a keyboard of its maker's, and this account has
     built none for it */
  K.tkbClear();
  K.fresh('t', 'free', 'has');
  K.stand(['kb', null]);
  o.lent = kbLent().length === 1 && kbBoards().length === 2 && kbOf().id === 'kowner';
  o.plusB = !!document.querySelector('#app [data-do="kbNew"]');
  K.stand(['kb', '1']);
  var n = {}; K.ctl().forEach(function(e){ n[K.nameOf(e)] = 1; });
  o.lentNames = Object.keys(n).sort();
  o.lentEdits = !!document.querySelector('#app .kbnm') || !!n.kbMore || !!n.keepPress;
  o.lentBoard = document.getElementById('app').innerHTML.indexOf('kbshot') !== -1 || document.querySelectorAll('#app .kb, #app .kbk, #app [class*="kbkey"]').length;
  /* and yours: a keyboard you build goes into the language's own slice */
  K.fresh('o', 'free');
  K.stand(['kb', null]);
  K.WIRE.length = 0;
  var o0 = LSL[langKeyOf(langId, 'kb')];
  press('kbNew'); press('kbAdd');
  o.ownSlice = LSL[langKeyOf(langId, 'kb')] !== o0;
  o.ownTake = wire(/take_kb/).length;
  return o;
});
/* ---- 5. and planNo() is core.js's: every shape of the open language is
   langShaped() ------------------------------------------------------------ */
const planNoOut = [];
for (const f of fs.readdirSync(path.join(dir, '..', 'www')).filter((x) => x.endsWith('.js') && x !== 'core.js')) {
  const src = fs.readFileSync(path.join(dir, '..', 'www', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  src.split('\n').forEach((ln, i) => { if (/\bplanNo\s*\(/.test(ln)) planNoOut.push(f + ':' + (i + 1)); });
}
r.ownWalk = ownWalk; r.theirWalk = theirWalk; r.theirPro = theirPro; r.edit = Object.keys(EDIT).sort();
r.drawn = [...new Set(drawn)].sort(); r.saves = [...new Set(saves)].sort(); r.caps = caps; r.wrote = wrote;

console.log('your language: ' + r.ownWalk.faces + ' faces, ' + r.ownWalk.presses + ' presses (' + r.ownWalk.ms + 'ms), ' +
  r.edit.length + ' names that edit');
console.log('the taken one: ' + r.theirWalk.faces + ' faces, ' + r.theirWalk.presses + ' presses on free, ' +
  r.theirPro.faces + ' faces, ' + r.theirPro.presses + ' on pro');
say(r.edit.length > 20,
  '0 (premise) pressing your own language finds the editors -- a walk that finds none stopped looking', r.edit);
say(r.theirWalk.faces >= 10, '0b (premise) the taken language is walked, not declined', r.theirWalk);
say(r.oAlphaRows < r.oAlpha && r.oCap > 0,
  '1 (premise) on free YOUR alphabet still folds past the slots and says so', { rows:r.oAlphaRows, of:r.oAlpha, cap:r.oCap });
say(r.tAlphaRows === r.tAlpha && r.tAlpha > r.oAlphaRows,
  '1b on free a TAKEN alphabet shows every letter, a–z and past it', { rows:r.tAlphaRows, of:r.tAlpha });
say(r.tWordRows === r.tWords && r.tWords > 100,
  '1c on free a taken dictionary shows every word, past the hundred', { rows:r.tWordRows, of:r.tWords });
say(r.tOwnStage, '1d on free a taken grammar shows the stages its owner added', r.tOwnStage);
say(!r.caps.length, '1e no face of a taken language draws an upgrade line', r.caps);
say(!r.saves.length, '2 no face of a taken language draws a Save', r.saves);
say(!r.drawn.length, '3 no face of a taken language draws a control that edits (the names pressing your own found)', r.drawn);
say(!r.wrote.length, '4 no press on any face of a taken language puts anything of it on the wire', r.wrote);
say(kbr.plus && kbr.made, '5 a taken language with no keyboard: the ＋ is there and a keyboard is made from it', kbr);
say(kbr.put.length >= 1 && kbr.put.every((l) => l === 'taken-1') && !kbr.slice.length && kbr.sliceSame,
  '5b it goes to THIS account\'s take_kb row, and the language\'s kb slice does not move', { put:kbr.put, slice:kbr.slice, same:kbr.sliceSame });
say(kbr.onBoard, '5c and it opens as a board that can be changed (its name field is there)', kbr.onBoard);
say(kbr.applied && !kbr.draftPut && kbr.applyPut >= 1, '5d choosing it makes it the one handed to the phone, and the page\'s Save sends that up', { applied:kbr.applied, draft:kbr.draftPut, put:kbr.applyPut });
say(kbr.back, '5e on the next launch it comes back down from the row, still the one chosen', { back:kbr.back, at:kbr.backAt });
say(kbr.lent && kbr.plusB, '6 a taken language WITH a keyboard: the maker\'s is listed and is the one handed over, and the ＋ is there too', kbr);
say(!kbr.lentEdits, '6b and the maker\'s board opens with nothing on it to change', kbr.lentNames);
say(kbr.ownSlice && !kbr.ownTake, '6c on your own language a keyboard still goes into the language\'s kb slice, not take_kb', { slice:kbr.ownSlice, take:kbr.ownTake });
say(!planNoOut.length, '7 planNo() is asked nowhere but www/core.js -- a shape of the open language is langShaped()', planNoOut);
const errT = errs.filter((e) => !/\(on o /.test(e)), errO = errs.filter((e) => /\(on o /.test(e));
say(!errT.length, '9 nothing threw on the taken language', errT.slice(0, 5));
/* What the walk of YOUR language turns up is a bug on the making side and
   not this check's claim -- said here every run, and carried in
   docs/BACKLOG.md until somebody takes it. */
for (const e of errO) console.log('  FOUND (your own language, not this check\'s): ' + e);

await br.close();
console.log(bad ? `\ntaken-check: ${bad} of ${claims} failed` :
  `\ntaken-check: ${claims} of ${claims} -- a taken language is the same on every plan, with nothing on it to edit`);
process.exit(bad ? 1 : 0);
