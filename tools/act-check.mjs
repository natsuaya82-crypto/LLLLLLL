/* ---------------------------------------------------------------------------
   tools/act-check.mjs — the net under the buttons.

   Run it before every release:   node tools/act-check.mjs

   Until this existed, a button carried its own JavaScript inside the markup:

     '<button onclick="wdRelHTML()">'

   which is a function name written as text, in a string, inside an attribute.
   Nothing read it. Renaming the function did not break the build. Deleting it
   did not break the build. What broke was the button, on somebody's phone,
   with `wdRelHTML is not defined` in a console nobody was looking at. That
   shipped once already.

   Now a button carries a name and nothing else:

     '<button' + DO('openWord', ['kan']) + '>'   ->  data-do="openWord" data-a=…

   and every name a screen is allowed to say is written once, by hand, in
   www/act-map.js, with the function itself as the second argument. This walks
   every screen in every language and proves both directions.

   What it checks
     1. nothing missing   every name in every rendered screen is in a table.
                          A name with nothing behind it is a dead button
     2. nothing dead      every entry in every table is asked for by some
                          screen. An entry nobody names is a button that used
                          to exist, and it will rot silently
     3. the arguments     every data-a and data-b parses as JSON. They are
                          written by JSON.stringify, so a failure here means
                          something escaped the escaping
     4. no code left      no on-anything attribute survives anywhere in any
                          rendered screen. One is enough to bring the whole
                          class of bug back

   What it cannot see, so that nobody mistakes silence for safety:
     - whether the function does the right thing. It proves the button is
       wired to something that exists, not that the something is correct
     - arguments of the wrong shape. openWord('kan') and openWord(7) are the
       same to this check
     - anything reached only after a press. A screen that only appears once
       something has been tapped is walked here only if some view or open*
       function renders it

   Exit code is 0 only when all four pass.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

async function loadChromium(){
  const { createRequire } = await import('module');
  const req = createRequire(import.meta.url);
  try { return req('playwright').chromium; } catch (e) {}
  try {
    const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return req(path.join(g, 'playwright')).chromium;
  } catch (e) {}
  console.error('playwright is not installed. npm i -g playwright');
  process.exit(2);
}
const chromium = await loadChromium();

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const PORT = 8122;
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const LAUNCH = fs.existsSync(CHROME) ? { executablePath: CHROME } : {};

const mime = (f) => f.endsWith('.html') ? 'text/html; charset=utf-8'
  : f.endsWith('.js') ? 'application/javascript; charset=utf-8'
  : f.endsWith('.css') ? 'text/css; charset=utf-8'
  : 'text/plain; charset=utf-8';
const srv = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  let d = null;
  try { d = fs.readFileSync(f); } catch (e) { d = null; }
  if (d === null) { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'Content-Type': mime(f) });
  res.end(d);
});
await new Promise(r => srv.listen(PORT, r));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage();
const pageErrors = [];
pg.on('pageerror', e => pageErrors.push(e.message));
await pg.goto(`http://127.0.0.1:${PORT}/`);
await pg.waitForTimeout(300);

const R = await pg.evaluate(() => {
  const out = { missing: [], dead: [], bad: [], inline: [], screens: 0,
                seen: { do: [], in: [], kd: [] }, threw: [] };
  const seenDo = {}, seenIn = {}, seenKd = {};

  /* Every name this piece of markup asks for, and whether its arguments are
     the JSON they were written as. */
  function harvest(where, html){
    let m;
    const attr = /\sdata-(do2?|in|ch|kd|a|b)="([^"]*)"/g;
    while ((m = attr.exec(html))) {
      const k = m[1];
      /* the browser has already turned &quot; back into " for us? no — this is
         the raw string, so undo the one escape esc() makes */
      const v = m[2].replace(/&quot;/g, '"').replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      if (k === 'a' || k === 'b') {
        try { JSON.parse(v); } catch (e) { out.bad.push(where + ': ' + v); }
        continue;
      }
      if (k === 'do' || k === 'do2') {
        seenDo[v] = 1;
        if (!ACT[v]) out.missing.push(where + ': pressed -> ' + v);
      } else if (k === 'in' || k === 'ch') {
        seenIn[v] = 1;
        if (!ACT_IN[v]) out.missing.push(where + ': typed -> ' + v);
      } else {
        seenKd[v] = 1;
        if (!ACT_KEY[v]) out.missing.push(where + ': Enter -> ' + v);
      }
    }
    /* Any on-anything attribute at all is the old disease coming back. */
    const inline = /\son(click|input|change|keydown|pointerdown|touchstart|submit|focus|blur)\s*=/gi;
    while ((m = inline.exec(html))) out.inline.push(where + ': ' + m[0].trim());
    out.screens++;
  }

  /* Something for the screens to be about. */
  WORDS = [
    {hw:'kano', ph:['k','a','n','o'], mn:'mountain', mns:['mountain'], pos:'n', at:1},
    {hw:'tir',  ph:['t','i','r'],     mn:'to see',   mns:['to see'],   pos:'v', at:2},
    {hw:'mos',  ph:['m','o','s'],     mn:'tall',     mns:['tall'],     pos:'adj', at:3},
    {hw:'sar',  ph:['s','a','r'],     mn:'river',    mns:['river'],    pos:'n', at:4},
    {hw:'nak',  ph:['n','a','k'],     mn:'not',      mns:['not'],      pos:'part', slot:'neg.not', at:5},
    {hw:'ke',   ph:['k','e'],         mn:'what',     mns:['what'],     pos:'pro',  slot:'ask.what', at:6}
  ];
  langName = 'Shango';
  SET.snd = ['k','t','m','n','s','r','a','i','u','e','o'];
  NOTES = [{t:'note', b:'body'}];
  TALK = [];
  LETTERS = [{id:'l1', st:[{pts:[[112,112],[688,112],[400,688]]}], ch:'', nm:'', snd:['k']},
             {id:'l2', st:null, ch:'Ϙ', nm:'', snd:['t']},
             {id:'l3', st:[{pts:[[112,688],[400,112],[688,688]]}], ch:'', nm:'', snd:[]}];
  STG = {done:{}, notes:{gr:'x'}, set:{}, extra:[],
         rules:{neg:'a rule'}, ex:{neg:[{lb:'a', ln:'kano tir', gl:'b'}]}};
  fq = ''; fpick = null;

  const views  = Object.keys(window).filter(k =>
    /^v[A-Z]/.test(k) && typeof window[k] === 'function' && k !== 'vOb');
  const opens  = Object.keys(window).filter(k =>
    /^open[A-Z]/.test(k) && typeof window[k] === 'function' && k !== 'openForm');

  /* Every screen, under both plans and with and without a dictionary, because
     a button that only exists when there is nothing yet is still a button. */
  ['free','plus'].forEach(plan => {
    SET.plan = plan;
    [false, true].forEach(empty => {
      const keep = WORDS;
      if (empty) WORDS = [];
      views.forEach(v => {
        const route = v.slice(1).toLowerCase();
        window.route = route; NAV = [{ r: route }];
        try { harvest(v, window[v]()); }
        catch (e) { out.threw.push(v + ' (' + plan + '/' + (empty?'empty':'full') + '): ' + e.message); }
      });
      WORDS = keep;
    });
  });
  SET.plan = 'free';

  /* Onboarding, every step -- and the steps that have a second face: the
     writing systems to choose from, the sounds offered again, the characters
     on offer to borrow. */
  SET.done = false;
  for (let s = 0; s <= 4; s++) {
    ob.step = s;
    try { harvest('vOb step ' + s, vOb()); } catch (e) { out.threw.push('vOb ' + s + ': ' + e.message); }
  }
  const obStates = [
    ['choosing a writing system', () => { ob.step = 2; ob.sc = ''; return vOb(); }],
    ['sounds offered again',      () => { ob.step = 3; obPick2 = true; return vOb(); }],
    ['characters to borrow',      () => { ob.step = 4; ob.mode = 'borrow';
                                          ob.pick = WORLD_SCRIPTS[0].id; return vOb(); }],
    ['no script picked to borrow from', () => { ob.step = 4; ob.mode = 'borrow';
                                                ob.pick = ''; return vOb(); }]
  ];
  obStates.forEach(([label, run]) => {
    try { harvest(label, run()); } catch (e) { out.threw.push(label + ': ' + e.message); }
  });
  ob.mode = 'draw';
  SET.done = true;

  /* A screen that takes an argument is a different screen for each argument:
     a settings room, a grammar stage, a letter in the editor. A walk that
     only ever renders the argument-less face of these would call half the
     buttons in the app dead. */
  function walkArg(route, view, args, label){
    args.forEach(a => {
      window.route = route; NAV = [{ r: route, a: a }];
      try { harvest(label + ':' + a, view()); }
      catch (e) { out.threw.push(label + ':' + a + ': ' + e.message); }
    });
  }
  /* The data room only offers its rows on the paid plan; on the free one it
     offers the lock instead, and both are screens with buttons on them. */
  ['free','plus'].forEach(pl => {
    SET.plan = pl;
    walkArg('set', vSet, SETS.map(x => x.id), 'vSet ' + pl);
  });
  SET.plan = 'free';
  walkArg('gram', vGram, stAll().map(p => p.id), 'vGram');

  /* the forms, which are pages reached by opening rather than by routing */
  const forms = [
    ['openWord',      () => openWord('kano')],
    ['openAdd',       () => openAdd()],
    ['openAdd child', () => openAdd('kano')],
    ['openNote',      () => openNote(0)],
    ['openNote new',  () => openNote(-1)],
    ['openSlot',      () => openSlot('greet','yes')],
    ['openOwnPhase',  () => openOwnPhase()],
    ['openPick',      () => openPick('m')],
    ['openImport',    () => openImport()]
  ];
  forms.forEach(([label, run]) => {
    try {
      run();
      if (FORM && FORM.html) harvest(label, FORM.html);
    } catch (e) { out.threw.push(label + ': ' + e.message); }
  });
  try { closeSheet(); } catch (e) {}
  /* anything else that opens, in case one is added and forgotten above */
  opens.forEach(o => {
    if (forms.some(f => f[0].split(' ')[0] === o)) return;
    try {
      window[o].length ? window[o]('kano') : window[o]();
      if (FORM && FORM.html) harvest(o, FORM.html);
    } catch (e) { out.threw.push(o + ': ' + e.message); }
  });
  try { closeSheet(); } catch (e) {}

  /* Screens whose buttons only exist once something is half-done: a word
     being spelled, a letter being drawn, suggestions on the table. */
  const states = [
    ['the word being edited', () => { openWord('kano'); wEdit.mns = ['mountain','peak'];
                                      wEdit.ex = [{ln:'kano tir', gl:'sees the mountain'}];
                                      return FORM.html; }],
    ['the word being spelled', () => { openWord('kano'); window.route='spell';
                                       NAV=[{r:'spell'}]; return vSpell(); }],
    ['the abugida editor',     () => { window.route='abugida'; NAV=[{r:'abugida'}];
                                       abVow = 'a'; return vAbugida(); }],
    ['a letter in the editor', () => { editGlyph('k'); window.route='glyph';
                                       NAV=[{r:'glyph', a:GE.lid}]; return vGlyph(); }],
    ['words being suggested',  () => { window.route='make'; NAV=[{r:'make'}];
                                       cands=[{q:['k','a','n','o'], on:true},
                                              {q:['t','i','r'], on:false}];
                                       return vMake(); }],
    ['a word related to another', () => { window.route='relate'; NAV=[{r:'relate', a:'kano'}];
                                          return vRelate('kano'); }],
    ['borrowing a character',  () => { window.route='pickltr'; NAV=[{r:'pickltr', a:'l1'}];
                                       pkFor='k'; return vPickLtr(); }],
    ['picking a sound',        () => { window.route='picksnd'; NAV=[{r:'picksnd', a:'l1'}];
                                       return vPickSnd(); }],
    ['a conversation under way', () => { TALK=[{me:true, w:[['k','a','n','o']], g:['mountain']}];
                                         window.route='talk'; NAV=[{r:'talk'}];
                                         const h=vTalk(); TALK=[]; return h; }],
    ['a word being written',   () => { openAdd(); addSeq=['k','a','n','o'];
                                       addSp=[{l:'l1', u:'k'},{l:'', u:'a'}];
                                       SUG=[['k','a'],['t','i']];
                                       return wdBodyHTML? FORM.html+vForm() : FORM.html; }],
    ['a word being spelled again', () => { openWord('kano'); window.route='spell';
                                           NAV=[{r:'spell'}];
                                           wEdit.sp=[{l:'l1', u:'k'},{l:'', u:'a'}];
                                           return vSpell(); }],
    ['a word with a sentence in it', () => { findWord('kano').ex=[{ln:'kano tir', gl:'sees it'}];
                                             openWord('kano');
                                             const h=wdBodyHTML();
                                             delete findWord('kano').ex; return h; }],
    ['relatives to choose from', () => { window.route='relate'; NAV=[{r:'relate', a:'kano'}];
                                         return vRelate('kano'); }],
    ['a stage of your own',    () => { STG.extra=[{id:'own1', title:'mine', slots:['s1'],
                                                   labels:{s1:'a'}, what:''}];
                                       window.route='gram'; NAV=[{r:'gram', a:'own1'}];
                                       const h=vGram(); return h; }],
    ['a slot already filled',  () => { openSlot('neg','not'); return FORM.html; }],
    ['words being suggested for a slot', () => { openSlot('greet','yes');
                                                 stSug=[['k','a'],['t','i']];
                                                 return FORM.html.replace(/$/, stSugHTML()); }],
    ['one position of a word',   () => { openWord('kano');
                                          wEdit.sp=[{l:'l1', u:'k'},{l:'', u:'a'}];
                                          window.route='spell'; NAV=[{r:'spell', a:'0'}];
                                          return vSpell(); }],
    ['one position of a new word', () => { openAdd(); addSp=[{l:'l1', u:'k'},{l:'', u:'a'}];
                                           window.route='aspell'; NAV=[{r:'aspell', a:'0'}];
                                           return vASpell(); }],
    ['the sound keyboard in a word', () => { openWord('kano'); wdMode='ph';
                                             return wdBodyHTML(); }],
    ['the sound keyboard in a new word', () => { openAdd(); addMode='ph';
                                                 return FORM.html; }],
    ['words offered for a meaning', () => { SUG=[['k','a'],['t','i']]; sugMn='mountain';
                                            const h=sugHTML(); SUG=[]; return h; }],
    ['synonyms to choose from',  () => { window.route='relate'; NAV=[{r:'relate', a:'syn:kano'}];
                                         return vRelate(); }],
    ['characters on offer',      () => { openPick('l1'); pkScript=WORLD_SCRIPTS[0].id;
                                         return FORM.html + pkCharsHTML(); }],
    ['an abugida being placed',  () => { SET.wsys='abugida';
                                         LETTERS.push({id:'lv', st:[{pts:[[200,200],[600,600]]}],
                                                       ch:'', nm:'', snd:['a']});
                                         window.route='abugida'; NAV=[{r:'abugida'}];
                                         abVow='a';
                                         const h=vAbugida(); SET.wsys='alpha'; return h; }],
    ['a letter wearing a borrowed character', () => { editGlyph('t'); GE.ch='Ϙ';
                                                      window.route='glyph';
                                                      NAV=[{r:'glyph', a:GE.lid}];
                                                      return vGlyph(); }],
    ['the free plan out of room', () => { SET.plan='free'; SET.aiDay='';
                                          SET.aiN=999; openAdd();
                                          const h=FORM.html; SET.aiN=0; return h; }]
  ];
  states.forEach(([label, run]) => {
    try { harvest(label, run() || ''); }
    catch (e) { out.threw.push(label + ': ' + e.message); }
  });

  /* the three faces of the search tab, which a plain render never reaches */
  try {
    fq = 'a'; harvest('vFind searched', findBodyHTML());
    fq = ''; fpick = { k:'s', v:'k' }; harvest('vFind by sound', findBodyHTML());
    fpick = { k:'l', v:'l1' }; harvest('vFind by letter', findBodyHTML());
    fq = ''; fpick = null;
  } catch (e) { out.threw.push('the search tab: ' + e.message); }

  /* the other direction: an entry nobody ever names */
  Object.keys(ACT).forEach(k => { if (!seenDo[k]) out.dead.push('pressed: ' + k); });
  Object.keys(ACT_IN).forEach(k => { if (!seenIn[k]) out.dead.push('typed: ' + k); });
  Object.keys(ACT_KEY).forEach(k => { if (!seenKd[k]) out.dead.push('Enter: ' + k); });

  out.seen.do = Object.keys(seenDo).length;
  out.seen.in = Object.keys(seenIn).length;
  out.seen.kd = Object.keys(seenKd).length;
  out.have = { do: Object.keys(ACT).length, in: Object.keys(ACT_IN).length, kd: Object.keys(ACT_KEY).length };
  return out;
});

await br.close();
srv.close();

const fails = [];
const say = (label, list) => { if (list.length) fails.push([label, list]); };
say('a name with nothing behind it', R.missing);
say('an entry no screen ever names', R.dead);
say('an argument that is not the JSON it was written as', R.bad);
say('JavaScript still inside markup', R.inline);
say('a screen that threw while being walked', R.threw);
if (pageErrors.length) fails.push(['the page itself', pageErrors]);

console.log(`screens walked: ${R.screens}`);
console.log(`names: pressed ${R.seen.do}/${R.have.do}  typed ${R.seen.in}/${R.have.in}  Enter ${R.seen.kd}/${R.have.kd}`);

if (fails.length) {
  console.log('');
  for (const [label, list] of fails) {
    console.log(`FAILED — ${label} (${list.length}):`);
    list.slice(0, 40).forEach(x => console.log('  ' + x));
    if (list.length > 40) console.log(`  ... and ${list.length - 40} more`);
  }
  process.exit(1);
}
console.log('\nall four checks pass: every button names something, and everything named is a button.');
