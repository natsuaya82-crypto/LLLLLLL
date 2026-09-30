/* ---------------------------------------------------------------------------
   tools/theirs-check.mjs — somebody else's language is on the server and in
   memory, and nowhere else.

   「カード投稿はok」「svgやファイル書き出しはng」「だから端末に置くのもng」
   「サーバーであればスクショ以外で持っていけないでしょ？著作権関連するんだから
   そこはしっかりやろう」 OWNER 2026-09-30 (docs/FEATURE_RULES.md § Owner
   decision log, 2026-09-30 (2) and its 追記).

   langOut() in www/core.js is the one question: may this language's content
   leave memory. Nothing about a way out that forgets to ask can throw -- the
   file is written, the share sheet comes up, the keyboard types -- and it is
   somebody else's alphabet in a file on somebody's phone. So this holds two
   halves.

   THE SURFACE, COUNTED. Every way out of the app in www/ -- a file handed to
   the phone (LinguaShare `sheet`), the App Group (LinguaShare `write`), the
   clipboard (`clipboardData.setData`) -- and every write of a language's
   picture to the disk (`localStorage.setItem(slGotKey(`) is found by what it
   IS, not by a list of the functions somebody remembered. The function it is
   in has to ask langOut(), or call a function that does. A way out added
   tomorrow is counted tomorrow. And nothing but langOut() may answer the
   question: `langWhose(...)===LW_MINE` written out anywhere else is a second
   answer.

   AND WHAT IT DOES, PRESSED. The fixture takes a language from another
   account through the real roads (netTakes -> netLangsWalk, netLangFill)
   with only the wire held here, opens it, walks the screens, and asks the
   page and localStorage -- never langOut() itself, because asking the
   function under test what it thinks is a copy that always agrees. Your own
   language is asked the same things, so a claim cannot be green by drawing
   nothing anywhere.

   Run it:  node tools/theirs-check.mjs
   --------------------------------------------------------------------------- */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const WWW = path.join(dir, '..', 'www');
let bad = 0, claims = 0;
const say = (ok, what, got) => {
  claims++;
  console.log((ok ? '  ok   ' : '  FAIL ') + what + (ok ? '' : '\n         got: ' + JSON.stringify(got)));
  if (!ok) bad++;
};

/* ---- 1. the surface ----------------------------------------------------- */
/* Comments out, strings kept: `'LinguaShare', 'sheet'` IS a string. */
function decomment(src) {
  let out = '', i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '*') {
      const e = src.indexOf('*/', i + 2), end = e < 0 ? n : e + 2;
      out += src.slice(i, end).replace(/[^\n]/g, ' '); i = end; continue;
    }
    if (c === '/' && d === '/' && src[i - 1] !== ':' && src[i - 1] !== '\\') {
      const e = src.indexOf('\n', i), end = e < 0 ? n : e;
      out += ' '.repeat(end - i); i = end; continue;
    }
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < n && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      out += src.slice(i, j + 1); i = j + 1; continue;
    }
    out += c; i++;
  }
  return out;
}
/* Every top-level function, by name, with its body and where it starts. A
   top-level function starts at column 0 in this repo, and everything up to
   the next one is its body -- inner functions are indented and belong to it. */
const fns = new Map();
for (const f of fs.readdirSync(WWW).filter((x) => x.endsWith('.js')).sort()) {
  const lines = decomment(fs.readFileSync(path.join(WWW, f), 'utf8')).split('\n');
  let cur = null;
  lines.forEach((ln, i) => {
    const m = /^function\s+([A-Za-z_$][\w$]*)\s*\(/.exec(ln);
    if (m) { cur = { name: m[1], file: f, line: i + 1, body: '' }; fns.set(m[1], cur); }
    else if (/^\S/.test(ln) && !/^\}/.test(ln)) cur = null;
    if (cur) cur.body += ln + '\n';
  });
}
const OUT = [
  { kind: 'a file handed to the phone', re: /'LinguaShare'\s*,\s*'sheet'/ },
  { kind: 'the App Group', re: /'LinguaShare'\s*,\s*'write'/ },
  { kind: 'the clipboard', re: /clipboardData\.setData\s*\(/ },
  { kind: 'a picture on the disk', re: /localStorage\.setItem\s*\(\s*slGotKey\s*\(/ },
];
const asksDirect = new Set([...fns.values()].filter((x) => /\blangOut\s*\(/.test(x.body)).map((x) => x.name));
asksDirect.delete('langOut');
const asks = (x) => asksDirect.has(x.name) ||
  [...asksDirect].some((n) => new RegExp('\\b' + n.replace(/\$/g, '\\$') + '\\s*\\(').test(x.body));
const found = [];
for (const x of fns.values())
  for (const o of OUT) if (o.re.test(x.body)) found.push({ fn: x, kind: o.kind });
const counted = {};
for (const w of found) counted[w.kind] = (counted[w.kind] || 0) + 1;
console.log('ways out of memory: ' + found.length + ' -- ' +
  OUT.map((o) => (counted[o.kind] || 0) + ' ' + o.kind).join(', '));
for (const w of found)
  console.log('    ' + (asks(w.fn) ? 'asks ' : 'NO   ') + w.fn.name + ' (' + w.fn.file + ':' + w.fn.line + ') -- ' + w.kind);
const deaf = found.filter((w) => !asks(w.fn));
say(found.length >= OUT.length && OUT.every((o) => counted[o.kind]),
  '1 every kind of way out is found in www/ (a pattern matching nothing is a check that stopped looking)', counted);
say(!deaf.length, '2 every way out asks langOut(), or calls a function that does',
  deaf.map((w) => w.fn.name + ' ' + w.fn.file + ':' + w.fn.line));
const lo = fns.get('langOut');
say(!!lo && /return\s+langWhose\s*\(\s*id\s*\)\s*===\s*LW_MINE\s*;/.test(lo.body),
  '3 langOut() is langWhose()\'s 「mine」 and nothing else -- 「not answered yet」 is not mine',
  lo ? lo.body : null);

/* ---- 2. pressed ---------------------------------------------------------- */
const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
pg.on('pageerror', (e) => errs.push(e.message));
await pg.goto('file://' + path.join(WWW, 'index.html'));
await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });

const r = await pg.evaluate(async ({ s }) => {
  eval('(' + s + ')()');
  SET.walked = true; planGot('plus');
  var lid = 'theirs-1', own = langId, out = {}, asked = [];
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  function disk(){ var o = {}, i, k; for(i = 0; i < localStorage.length; i++){ k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; }
  /* the wire, and nothing above it */
  var LT = [{ id:'q1', st:[{ pts:[[100,100],[700,700]] }], ch:'', nm:'q', snd:[] }];
  window.netSend = function(m, p, b, at, ok){ ok([]); };
  window.netGet = function(p, ok){
    if(p.indexOf('language_take') !== -1) return ok([{ language:lid }]);
    if(p.indexOf('/slice') !== -1){
      if(p.indexOf('select=kind,no,at') !== -1) return ok([{ kind:'letters', no:1, at:'x' }, { kind:'words', no:1, at:'x' }]);
      return ok([{ kind:'letters', no:1, at:'x', body:JSON.stringify(LT) },
                 { kind:'words', no:1, at:'x', body:JSON.stringify([{ hw:'zork', mn:'stone', ex:[{ ln:'zork', gl:'stone' }] }]) }]);
    }
    if(p.indexOf('/language') !== -1)
      return ok([{ id:lid, owner:'somebody-else', name:'Necwe', wsys:'alpha', created_at:'2026-01-01', published_at:'2026-01-02' }]);
    ok([]);
  };
  /* the phone under it, so a way out that forgets would be SEEN going */
  window.Capacitor = { nativePromise: function(plug, method, args){
    asked.push(method + (args && args.ext ? ':' + args.ext : '') +
      (method === 'write' ? (Object.keys(args || {}).some(function(k){ return args[k] !== ''; }) ? ':full' : ':empty') : ''));
    if(method === 'sheet') return Promise.resolve({ file:'f' });
    return Promise.resolve({});
  } };
  var before = disk();
  NET_TAKEN = '';
  netTakes();
  netLangFill(lid, function(){}, function(){});
  langOpen(lid);
  out.whose = langWhose(lid);
  function stand(rt, a){ window.route = rt; NAV = [a === undefined ? { r:rt } : { r:rt, a:a }]; render(); return document.getElementById('app').innerHTML; }
  function doors(){
    var d = {};
    d.ltout = stand('letters').indexOf('ltout') !== -1;
    var h = stand('ltout');
    d.font = h.indexOf('"ltFontOut"') !== -1; d.svg = h.indexOf('"ltSvgOut"') !== -1;
    var l = LETTERS.filter(function(x){ return inkGeo(x); })[0];
    d.one = l ? stand('letter', l.id).indexOf('"ltSvgOne"') !== -1 : null;
    openWrite(); d.sheet = document.body.innerHTML.indexOf('"openWrOut"') !== -1;
    var w = WORDS.filter(function(x){ return x.ex && x.ex.length; })[0] || WORDS[0];
    if(w){ openWord(w.hw);
      d.card = Array.prototype.some.call(document.querySelectorAll('[data-do="cardOpen"]'),
        function(e){ return /^\["[wx]"/.test(e.getAttribute('data-a') || ''); });
    } else d.card = null;
    closeSheet();
    return d;
  }
  out.theirDoors = doors();
  /* and pressed anyway, by name, as a stale screen would */
  asked.length = 0;
  ltFontOut(); ltSvgOut(); var l0 = LETTERS[0]; if(l0) ltSvgOne(l0.id);
  SH = shBlank(); SH.names = 'zork'; shMake();
  cardOpen('w', 'zork'); cardSave();
  SHARE.sent = null; sharePush();
  await wait(50);
  out.theirAsked = asked.slice();
  /* a card of a POST still leaves 「カード投稿はok」 */
  asked.length = 0;
  cardOpen('p', 'p2'); await wait(50); cardSave(); await wait(50);
  out.postCard = asked.slice();
  out.theirDisk = [];
  var after = disk(), k;
  for(k in after) if(k.indexOf(lid) !== -1 && before[k] !== after[k]) out.theirDisk.push(k);
  out.take = after['lingua.take.' + netUid()] || null;

  /* ---- and your own, the same questions -------------------------------- */
  langOpen(own);
  out.ownWhose = langWhose(own);
  out.ownDoors = doors();
  asked.length = 0;
  ltSvgOut(); cardOpen('w', WORDS[0] && WORDS[0].hw); cardSave();
  SHARE.sent = null; sharePush();
  await wait(50);
  out.ownAsked = asked.slice();
  slGot(own, 'words', slRd(langKeyOf(own, 'words')) || '[]');
  out.ownPic = localStorage.getItem(langKeyOf(own, 'words') + '.got') !== null;
  return out;
}, { s: seed.toString() });

say(r.whose === 'read', '4 (premise) the taken language is somebody else\'s and this account reads it', r.whose);
say(r.ownWhose === 'mine', '4b (premise) the fixture\'s own language is this account\'s', r.ownWhose);
const idsOnly = (k) => /^lingua\.(langs|cur)\./.test(k) || /\.owner\.got$/.test(k);
say(r.theirDisk.filter((k) => !idsOnly(k)).length === 0 && r.take === null,
  '5 nothing of the taken language is on the disk -- only ids: the index row, where somebody stands, who wrote it',
  { keys: r.theirDisk, take: r.take });
say(r.ownPic, '5b and your own language\'s picture is still written', r.ownPic);
const td = r.theirDoors, od = r.ownDoors;
say(!td.ltout && !td.font && !td.svg && td.one === false && !td.sheet && td.card === false,
  '6 on the taken language no way out is drawn: the letters\' share, font, SVG, one letter\'s share, the handwriting sheet, a word\'s card', td);
say(od.ltout && od.font && od.svg && od.one === true && od.sheet && od.card === true,
  '6b and on your own every one of them is', od);
say(r.theirAsked.every((a) => a === 'write:empty'),
  '7 pressed anyway on the taken language: no file is handed to the phone, and the App Group is handed nothing but empties', r.theirAsked);
say(r.ownAsked.indexOf('sheet:svg') !== -1 && r.ownAsked.indexOf('sheet:png') !== -1 && r.ownAsked.indexOf('write:full') !== -1,
  '7b and on your own the same presses hand a file, a card and the keyboard over', r.ownAsked);
say(r.postCard.indexOf('sheet:png') !== -1,
  '8 a card of a post still leaves with the taken language open (「カード投稿はok」)', r.postCard);
say(!errs.length, '9 nothing threw', errs);

await br.close();
console.log(bad ? `\ntheirs-check: ${bad} of ${claims} failed` :
  `\ntheirs-check: ${claims} of ${claims} -- somebody else's language leaves by no road and lands on no disk`);
process.exit(bad ? 1 : 0);
