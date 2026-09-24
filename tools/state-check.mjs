/* tools/state-check.mjs — 「まだ訊いていない」は無料でも空でもない。
   ---------------------------------------------------------------------------
   CLAUDE.md § Money: 「a failed check means fewer buttons, never fewer
   words」, and 「未回答は free ではない」 OWNER 2026-09-11
   (docs/FEATURE_RULES.md § 端末は何も決めない).

   THE SENTENCE IT HOLDS (docs/scope/r73-audit.md § 2-3): while `PLAN` is
   null nothing that asks about the plan folds a list, writes, hands anything
   off the phone, or names a price. can() and has() answer `null` then, every
   ceiling answers `null`, and what the app does with no answer is decided in
   www/core.js § has -- upStop() for a press, planNo() for a shape,
   planSaid() for a write, planNum() for a number -- and nowhere else.

   THE SURFACE IS COUNTED, NOT LISTED. The capabilities are CAN's keys; the
   ceilings are every global `*Cap` the page has; the lists are every global
   `*Seen` and `*Hidden` that takes nothing; the screens are every view and
   its arguments, every face tools/fixture.mjs holds, every form and the tab
   bar; the writers are every global `save*`. Anything added tomorrow is
   counted tomorrow.

   A. After planForget(), every capability answers null (not false) and every
      ceiling answers null (not the free number). A name that answers the
      same as free is counted.
   B. With a language bigger than the free plan's -- words past the hundred,
      a letter past the slots, a stage of its own -- every list is exactly as
      long with no answer as on Pro.
   C. Every screen drawn with no answer, through the view and through
      render(): no save*, nothing to LinguaShare, no AdMob. Every button on
      every view, form and the tab bar pressed: no go('plans'), no price
      asked, no AdMob.

   WHAT IT DOES NOT HOLD, said so silence is not read as a check: the faces
   tools/fixture.mjs holds (halfDone). Each is made by DOING something -- a
   key opened, a keyboard saved -- so drawing one cannot be told from the
   presses that make it, and pressing every button of all of them was twenty
   minutes. press presses them, on the two plans.
   D. There is ONE place: planKnown() is asked nowhere in www/ but core.js,
      and a price is offered nowhere but upStop() -- no go('plans') and no
      popAsk of a price in any other file. The walk in C cannot reach a
      press behind a menu (the pencil under a post's ...); this can.

   AND THE SECOND SENTENCE (docs/scope/r73-audit.md § 2-4): what is read is
   an answer, empty, unreadable, or not asked yet, and which it is is
   slState()'s to say (www/core.js). Nothing is written over a slice that
   could not be read, and somebody else's thing is shape-checked before it
   is drawn.

   E. No reader parses a slice for itself: `JSON.parse(slRd(` is nowhere in
      www/. Every slice in SLICES, given wreckage -- not JSON, and JSON of
      the wrong shape -- then read (langLoad), topped up (ltStart) and
      written by every writer LANG_IO has (langSaveAll): the slice is byte
      for byte what it was, nothing is marked to go up, and 「保存できません
      でした」 is said.
   F. Somebody else's: a post's ink whose shape is not a shape is not drawn
      from, a gap off a post is held to SP_RANGE, a slice of their language
      of the wrong shape is the fallback, and a count nobody sent is not 0.

   Run: node tools/state-check.mjs        (npm run state)                   */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const WWW = path.join(dir, '..', 'www');

const fails = [];
function say(ok, line){ console.log('  ' + (ok ? 'ok      ' : 'FAILED  ') + line); if (!ok) fails.push(line); }

/* ---- D. one place, read off the source ------------------------------------ */
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
                      .replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
const asked = [], priced = [], parsed = [];
for (const f of fs.readdirSync(WWW).filter((x) => x.endsWith('.js')).sort()) {
  if (f === 'core.js') continue;
  strip(fs.readFileSync(path.join(WWW, f), 'utf8')).split('\n').forEach((l, i) => {
    if (/\bplanKnown\s*\(/.test(l)) asked.push(f + ':' + (i + 1));
    if (/JSON\.parse\(\s*slRd\(/.test(l)) parsed.push(f + ':' + (i + 1));
    if (/\bgo\(\s*['"]plans['"]\s*\)|popAsk\(\s*t\(\s*'(up\.need|post\.editplan)'/.test(l)) priced.push(f + ':' + (i + 1));
  });
}

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport: { width: 402, height: 874 } });
await pg.goto('file://' + path.join(WWW, 'index.html'));
await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });
await pg.evaluate('window.__seed = ' + seed.toString());

const R = await pg.evaluate(() => {
  const out = { A: [], Anames: 0, B: [], Bnames: 0, C: [], every: [], screens: 0, pressed: 0, saves: {}, share: 0, adm: 0,
                plans: 0, price: 0 };
  window.confirm = () => false; window.alert = () => {}; window.prompt = () => null;

  /* A language bigger than the free plan's, made on Pro. */
  const grow = () => {
    planGot('pro');
    let i;
    for (i = WORDS.length; i < 161; i++) WORDS.push({ id: 'w_st_' + i, hw: 'sta' + i, mns: ['a word'], pos: 'n' });
    if (!ltById('lt_state')) LETTERS.push({ id: 'lt_state', ab: 'zzq', snd: [] });
    if (STG.extra && !STG.extra.filter((s) => s.id === 'own_state').length)
      STG.extra.push({ id: 'own_state', title: 'mine', slots: ['s1'], labels: { s1: 'one' }, what: '' });
  };
  const fresh = () => { window.__seed(); SET.walked = true; grow(); };

  /* ---- A ------------------------------------------------------------------ */
  const caps = Object.keys(window).filter((k) => /^[a-z]+Cap$/.test(k) &&
    typeof window[k] === 'function' && window[k].length === 0).sort();
  fresh();
  planGot('free');
  const freeCap = {}, freeCan = {};
  caps.forEach((k) => { freeCap[k] = window[k](); });
  Object.keys(CAN).forEach((k) => { freeCan[k] = can(k); });
  planForget();
  caps.forEach((k) => {
    const v = window[k]();
    out.Anames++;
    if (v !== null) out.A.push(k + '() is ' + v + ' with no answer' + (v === freeCap[k] ? ' -- the free number' : ''));
  });
  Object.keys(CAN).forEach((k) => {
    const v = can(k);
    out.Anames++;
    if (v !== null) out.A.push("can('" + k + "') is " + v + ' with no answer');
  });
  out.caps = caps;

  /* ---- B ------------------------------------------------------------------ */
  const lists = Object.keys(window).filter((k) => /^[a-z]+(Seen|Hidden)$/.test(k) &&
    typeof window[k] === 'function' && window[k].length === 0).sort();
  const size = (v) => (v && typeof v.length === 'number') ? v.length : v;
  const measure = () => {
    const o = {};
    lists.forEach((k) => { try { o[k] = size(window[k]()); } catch (e) { o[k] = 'threw'; } });
    return o;
  };
  fresh(); planGot('pro');
  const pro = measure();
  planForget();
  const none = measure();
  lists.forEach((k) => {
    if (pro[k] === 'threw') return;
    out.Bnames++;
    if (JSON.stringify(pro[k]) !== JSON.stringify(none[k]))
      out.B.push(k + '() is ' + JSON.stringify(none[k]) + ' with no answer and ' + JSON.stringify(pro[k]) + ' on Pro');
  });
  out.lists = lists;

  /* ---- C ------------------------------------------------------------------ */
  /* Counting starts once the fixture is in (on()), so what is counted is the
     screen and never the seed. */
  let counting = false, drawing = false, PRO = false;
  const unset = () => { if (PRO) planGot('pro'); else planForget(); };
  const on = () => { if (drawing) counting = true; };
  const saves = Object.keys(window).filter((k) => /^save([A-Z]|$)/.test(k) && typeof window[k] === 'function');
  saves.forEach((k) => {
    const f = window[k];
    window[k] = function(){ if (counting) out.saves[k] = (out.saves[k] || 0) + 1; return f.apply(this, arguments); };
  });
  window.sharePlug = function(){
    return function(p, m){ if (counting && p === 'LinguaShare') out.share++; return Promise.resolve({}); };
  };
  const adm0 = window.admStart;
  window.admStart = function(){ if (counting) out.adm++; return adm0.apply(this, arguments); };
  const go0 = window.go;
  const goW = function(r){ if (counting && r === 'plans') out.plans++; return go0.apply(this, arguments); };
  window.go = goW; ACT.go = goW;
  const pop0 = window.popAsk;
  window.popAsk = function(q){
    if (counting && (q === t('up.need') || q === t('post.editplan'))) out.price++;
    return pop0.apply(this, arguments);
  };

  const views = Object.keys(window).filter((k) => /^v[A-Z]/.test(k) && typeof window[k] === 'function' && k !== 'vOb');
  const opens = Object.keys(window).filter((k) => /^open[A-Z]/.test(k) && typeof window[k] === 'function' && k !== 'openForm');
  const argsOf = (r) => r === 'set' ? [null].concat(SETS.map((x) => x.id)) :
                        r === 'gram' ? [null].concat(gramArgs()) :
                        r === 'fm' ? ['tira'] : [null];
  const show = (html) => { document.getElementById('app').innerHTML = html; };
  const screens = [];
  views.forEach((v) => {
    const r = v.slice(1).toLowerCase();
    argsOf(r).forEach((a) => screens.push({ label: v + (a ? ':' + a : ''),
      build: () => { fresh(); unset(); on(); window.route = r; NAV = [{ r: r, a: a }]; show(window[v]()); } }));
  });
  opens.forEach((o) => screens.push({ label: o,
    build: () => { fresh(); unset(); on(); window.route = 'words'; NAV = [{ r: 'words' }];
                   window[o].length ? window[o]('kano') : window[o]();
                   show((typeof FORM !== 'undefined' && FORM && FORM.html) ? vForm() : ''); } }));
  screens.push({ label: 'the tab bar',
    build: () => { fresh(); unset(); on(); window.route = 'feed'; NAV = [{ r: 'feed' }]; show(tabBar()); } });

  const buttons = () => Array.prototype.slice.call(document.getElementById('app').querySelectorAll('[data-do]'));
  /* What one drawing did: every writer called, LinguaShare, AdMob. */
  const tally = () => JSON.parse(JSON.stringify({ s: out.saves, share: out.share, adm: out.adm }));
  const delta = (a, b) => {
    const o = {};
    Object.keys(b.s).forEach((k) => { const d = b.s[k] - (a.s[k] || 0); if (d) o[k] = d; });
    if (b.share - a.share) o.LinguaShare = b.share - a.share;
    if (b.adm - a.adm) o.AdMob = b.adm - a.adm;
    return o;
  };
  /* Drawn twice, on Pro and with no answer, and what is counted is what the
     second does that the first does not: a write a screen makes on EVERY
     plan is r73 § 2-2's (「押していないのに書く」), and it is printed rather
     than failed here. */
  const drawn = (label, build) => {
    let a, b, pro, none;
    PRO = true; a = tally();
    try { drawing = true; build(); } catch (e) { drawing = counting = false; PRO = false; return; }
    drawing = counting = false; pro = delta(a, tally());
    PRO = false; b = tally();
    try { drawing = true; build(); } catch (e) { drawing = counting = false; return; }
    drawing = counting = false; none = delta(b, tally());
    out.screens++;
    const more = {};
    Object.keys(none).forEach((k) => { if (none[k] > (pro[k] || 0)) more[k] = none[k] - (pro[k] || 0); });
    if (Object.keys(more).length) out.C.push(label + ' with no answer: ' + JSON.stringify(more));
    delete pro.LinguaShare;
    if (Object.keys(pro).length) out.every.push(label + ': ' + JSON.stringify(pro));
  };
  /* Drawn: the view's own HTML, and the real render() for every route,
     which is where sharePush() runs. */
  screens.forEach((sc) => drawn(sc.label, sc.build));
  Object.keys(PAGES).forEach((id) => {
    argsOf(id).forEach((a) => drawn(id + (a ? ':' + a : '') + ' rendered', () => {
      fresh(); unset(); SHARE.sent = undefined;
      window.route = id; NAV = [{ r: id, a: a }];
      counting = true; render();
    }));
  });
  /* Pressed: every button of every screen, the screen built again before
     each. Handed to Node one screen at a time. */
  window.__st = { out: out, screens: screens, buttons: buttons, said: [],
    count: (i) => { try { screens[i].build(); return buttons().length; } catch (e) { return 0; } },
    press: (i, n) => {
      const sc = screens[i];
      for (let b = 0; b < n; b++) {
        try { sc.build(); } catch (e) { continue; }
        const els = buttons();
        if (b >= els.length) break;
        /* The row that IS the way to the price list -- settings' 「プラン」 --
           is a person going there; what is counted is every other road. */
        const door = els[b].getAttribute('data-do') === 'go' && /plans/.test(els[b].getAttribute('data-a') || '');
        const was = [out.plans, out.price, out.adm].join();
        counting = true;
        try { els[b].click(); } catch (e) {}
        if (door) { out.plans--; out.door = (out.door || 0) + 1; }
        counting = false;
        out.pressed++;
        if ([out.plans, out.price, out.adm].join() !== was)
          window.__st.said.push(sc.label + ' -> ' + els[b].getAttribute('data-do'));
      }
    } };
  out.nScreens = screens.length;
  return out;
});
const T0 = Date.now();
for (let i = 0; i < R.nScreens; i++) {
  const n = await pg.evaluate((i) => window.__st.count(i), i);
  const t = Date.now();
  await pg.evaluate(([i, n]) => window.__st.press(i, n), [i, n]);
  const dt = Date.now() - t;
  if (dt > 20000) console.log('  (slow: screen ' + i + ', ' + n + ' buttons, ' + dt + 'ms)');
}
const P = await pg.evaluate(() => ({ pressed: window.__st.out.pressed, said: window.__st.said,
  plans: window.__st.out.plans, price: window.__st.out.price, adm: window.__st.out.adm }));
R.pressed = P.pressed; R.pressSaid = P.said; R.plans = P.plans; R.price = P.price; R.adm = P.adm;
console.log('  (pressed in ' + Math.round((Date.now() - T0) / 1000) + 's)');


console.log('A. ' + R.Anames + ' answers asked with no plan: ' + R.caps.length + ' ceilings (' + R.caps.join(', ') +
            ') and every capability in CAN');
say(!R.A.length, 'every ceiling and every capability answers null, not the free plan' +
    (R.A.length ? '\n            ' + R.A.join('\n            ') : ''));
console.log('B. ' + R.Bnames + ' lists measured: ' + R.lists.join(', '));
say(!R.B.length, 'every list is as long with no answer as on Pro -- fewer buttons, never fewer words' +
    (R.B.length ? '\n            ' + R.B.join('\n            ') : ''));
console.log('C. ' + R.screens + ' screens drawn and ' + R.pressed + ' buttons pressed with no answer');
if (R.every.length) console.log('   written on every plan by drawing alone (r73 § 2-2, not this check):\n     ' +
                                R.every.join('\n     '));
say(!R.C.length, 'with no answer, drawing one writes, hands to LinguaShare and starts AdMob no more than on Pro' +
    (R.C.length ? '\n            ' + R.C.join('\n            ') : ''));
say(!R.pressSaid.length, 'pressing one goes to no price list, asks no price and starts no AdMob (' +
    R.plans + ' go plans, ' + R.price + ' prices, ' + R.adm + ' AdMob)' +
    (R.pressSaid.length ? '\n            ' + R.pressSaid.slice(0, 20).join('\n            ') : ''));
say(!priced.length, 'a price is offered by upStop() alone -- no other file calls go(\'plans\') or asks one' +
    (priced.length ? ' -- also ' + priced.join(', ') : ''));
say(!asked.length, 'planKnown() is asked in www/core.js alone' +
    (asked.length ? ' -- also ' + asked.join(', ') : ''));

const E = await pg.evaluate(() => {
  const o = { wrote: [], quiet: [], tried: 0, kinds: [], other: [] };
  let said = 0;
  const toast0 = window.toast;
  window.toast = function(m){ if (m === t('save.no')) said++; return toast0.apply(this, arguments); };
  SLICES.forEach((kind) => {
    if (kind === 'lang') return;                 /* the name is text, never JSON */
    const want = SL_SHAPE[kind];
    const bad = ['{"not json'].concat(want === 'a' ? ['{}', '5'] : want === 'o' ? ['[1,2]', '5'] : []);
    o.kinds.push(kind);
    bad.forEach((b) => {
      window.__seed(); SET.walked = true; planGot('free');
      const k = langKey(kind);
      LSL[k] = b; slSettled(k); said = 0;
      try { langLoad(); ltStart(); langSaveAll(); } catch (e) { o.wrote.push(kind + ' ' + b + ' threw ' + e.message); }
      o.tried++;
      if (LSL[k] !== b) o.wrote.push(kind + ' ' + b + ' was written over: ' + String(LSL[k]).slice(0, 40));
      if (slTouched(k)) o.wrote.push(kind + ' ' + b + ' is marked to go up');
      if (LANG_IO[kind] && LANG_IO[kind].wr && !said) o.quiet.push(kind + ' ' + b);
    });
  });
  const G = [[{ pts: [[0, 0], [500, 500]] }]];
  [{}, [], 'abc', 5, null].forEach((g) => {
    if (postInkOK({ g: [g], s: [0] })) o.other.push('postInkOK drew from a g of ' + JSON.stringify(g));
  });
  if (!postInkOK({ g: G, s: [0] })) o.other.push('postInkOK refused a real shape');
  [50, -3, Infinity, NaN].forEach((v) => {
    const w = inkSteps(v);
    if (!(w >= SP_RANGE.min && w <= SP_RANGE.max)) o.other.push('inkSteps(' + v + ') is ' + w + ', outside SP_RANGE');
  });
  const m = { letters: { body: '{}' }, words: { body: '5' }, script: { body: '[]' }, snd: { body: '{"x":1}' } };
  ['letters', 'words', 'script', 'snd'].forEach((kd) => {
    const fb = ['fb'];
    if (wldSliceOf(m, kd, fb) !== fb) o.other.push('wldSliceOf passed ' + kd + ' ' + m[kd].body + ' through');
  });
  [undefined, null, '', 'x'].forEach((n) => {
    if (/<b>/.test(meCount(n))) o.other.push('meCount(' + JSON.stringify(n) + ') drew ' + meCount(n));
  });
  if (!/<b>3<\/b>/.test(meCount(3))) o.other.push('meCount(3) did not draw 3');
  return o;
});
console.log('E. ' + E.tried + ' wrecks in ' + E.kinds.length + ' slices (' + E.kinds.join(', ') + ')');
say(!parsed.length, 'no reader parses a slice for itself -- slState() is the one' +
    (parsed.length ? ' -- ' + parsed.join(', ') : ''));
say(!E.wrote.length, 'nothing is written over a slice that could not be read, and nothing of it goes up' +
    (E.wrote.length ? '\n            ' + E.wrote.join('\n            ') : ''));
say(!E.quiet.length, 'and the save that did not happen says so' +
    (E.quiet.length ? ' -- silent: ' + E.quiet.join(', ') : ''));
say(!E.other.length, 'F. somebody else\'s ink, gap and slices are shape-checked, and a count nobody sent is not 0' +
    (E.other.length ? '\n            ' + E.other.join('\n            ') : ''));

await br.close();
if (fails.length) {
  console.log('\nstate: ' + fails.length + ' of these do not hold.');
  process.exit(1);
}
console.log('\nstate: with no answer about the plan, nothing is folded, written, handed off or priced,\n' +
            'and what the app does then is decided in www/core.js § has alone; what cannot be\n' +
            'read is not written over, and somebody else\'s is shape-checked before it is drawn.');
