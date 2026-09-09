/* tools/measure-cost.mjs — 「Supabase $25 で何人持てるか」を、測れるところだけ測る。
   ---------------------------------------------------------------------------
   これは gate の検査ではありません。落ちるものが何もないので、npm test には
   足しません。オーナーの問いに数字で答えるための道具です。

   測るのは四つ:

     1. 言語一本の大きさ ── slice 12 個の bytes を、100 / 1000 / 5000 語で。
        アプリ自身の langSaveAll() を通します。ここで書き出されたものが、
        そのままサーバーの `slice.body` になります（netSlicePut）。
     2. 起動一回の通信量 ── 本物の www/index.html を、偽の線の上で起動し、
        出て行った要求ごとに「送った bytes」と「返ってきた bytes」を数える。
        偽の線は slow-check.mjs のものと同じ形ですが、**憶えます** ── 上げた
        slice はそのまま持っていて、次に訊かれたら返す。そうでないと
        「返ってきた bytes」がゼロになり、測る意味がありません。
     3. 写真一枚 ── www/post.js の道（POST_PIC=900, POST_PICQ=0.72）と、
        タイムラインに出る小さい方（POST_THUMB=300）を、実際に一枚通して。
     4. 声 ── MediaRecorder が既定で何 bit/s を吐くか。30 秒はその掛け算。

   走らせ方: node tools/measure-cost.mjs        (npm run measure)
   ------------------------------------------------------------------------- */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const INDEX = 'file://' + path.join(dir, '..', 'www', 'index.html');

/* 一つの要求につき、本体のほかにこれだけ乗るとみなす。header と TLS の分。
   本体だけを数えると、小さい要求を多く出す道が実際より安く見えます。 */
const OVERHEAD = 800;

/* ---- 偽の線。憶えるサーバー ---------------------------------------------
   slow-check.mjs のものと同じ形で、違いは二つ ── POST された slice を
   持っていて GET に返すことと、bytes を数えること。 */
function meter(cfg){
  var log = [], out = 0, SL = cfg.sl || {}, POSTROWS = cfg.posts || [];
  var LROW = cfg.lrow || [], LN = LROW.length;
  window.__M = { log: log, out: function(){ return out; },
                 reset: function(){ log.length = 0; },
                 sl: function(){ return SL; },
                 lrow: function(){ return LROW; } };

  var b64 = function(o){
    return btoa(unescape(encodeURIComponent(JSON.stringify(o))))
      .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  };
  var TOK = 'h.' + b64({ sub:'u', email:'aya@example.com',
                         app_metadata:{ provider:'email' } }) + '.s';
  try {
    localStorage.setItem('lingua.sess',
      JSON.stringify({ at:TOK, rt:'r', uid:'u', anon:false }));
    localStorage.setItem('lingua.set', JSON.stringify({ done:true }));
    if (cfg.langs) localStorage.setItem('lingua.langs', cfg.langs);
    if (cfg.cur) localStorage.setItem('lingua.cur', cfg.cur);
  } catch (e) {}

  function qs(u, k){
    var m = new RegExp('[?&]' + k + '=([^&]*)').exec(u);
    return m ? decodeURIComponent(m[1]) : '';
  }
  function asked(v){
    var m = /^in\.\((.*)\)$/.exec(v);
    if (m) return m[1] ? m[1].split(',').map(decodeURIComponent) : [];
    if (v.indexOf('eq.') === 0) return [decodeURIComponent(v.slice(3))];
    return [];
  }
  var ME = { id:'U-u', handle:'aya', display:'Aya', av:null, bio:'hello',
             banned_at:null, fo:2, fr:5, lang_id:'L-u', lang_name:'Shango',
             lang_pub:true, uid:'u' };

  function answer(m, u, body){
    var p = u.split('?')[0].replace(/^[a-z]+:\/\/[^/]*/, ''), j, rows, k;
    if (p === '/auth/v1/token')
      return { access_token:TOK, refresh_token:'r', user:{ id:'u' } };
    if (p === '/rest/v1/profile' || p === '/rest/v1/profile_seen') return [ME];
    if (p === '/rest/v1/plan') return [];
    if (p === '/rest/v1/language'){
      if (m === 'POST'){
        var nw = { id:'L-' + (++LN), owner:'u',
                   name:String((body && body.name) || 'Shango'),
                   published_at:null, wsys:String((body && body.wsys) || 'alpha') };
        LROW.push(nw); return [nw];
      }
      var want = qs(u, 'id');
      if (want){
        rows = [];
        for (j = 0; j < LROW.length; j++)
          if (asked(want).indexOf(LROW[j].id) >= 0) rows.push(LROW[j]);
        return rows;
      }
      return LROW;
    }
    if (p === '/rest/v1/language_take' || p === '/rest/v1/language_seen') return [];
    if (p === '/rest/v1/slice'){
      if (m === 'POST'){
        /* サーバーが憶える。Prefer: return=representation なので、上げたものが
           そのまま返ってくる ── これが「上げは往きも復りも同じ量」の正体。 */
        SL[body.language] = SL[body.language] || {};
        SL[body.language][body.kind] = { kind:body.kind,
          body:String(body.body||''), no:body.no, language:body.language,
          at:body.at };
        return [SL[body.language][body.kind]];
      }
      var lid = asked(qs(u, 'language'))[0] || '';
      rows = [];
      var bag = SL[lid] || {};
      /* 訊かれた欄だけ返す ── PostgREST の select はそういうものです。
         中身を訊いていない読みが中身のぶん重く見えたら、測る意味がない。 */
      var cols = (qs(u, 'select') || 'kind,body,no').split(',');
      var kinds = asked(qs(u, 'kind'));
      for (k in bag) if (Object.prototype.hasOwnProperty.call(bag, k)){
        if (kinds.length && kinds.indexOf(k) < 0) continue;
        var row = {}, c;
        for (c = 0; c < cols.length; c++) row[cols[c]] = bag[k][cols[c]];
        rows.push(row);
      }
      return rows;
    }
    if (p === '/rest/v1/rpc/feed_hot' || p === '/rest/v1/rpc/feed_fo' ||
        p === '/rest/v1/post_seen') return POSTROWS;
    if (p === '/rest/v1/rpc/notices') return [];
    if (p === '/rest/v1/draft' || p === '/rest/v1/react' ||
        p === '/rest/v1/follow' || p === '/rest/v1/follow_seen' ||
        p === '/rest/v1/block' || p === '/rest/v1/report' ||
        p === '/rest/v1/saved_search' || p === '/rest/v1/recent_search' ||
        p === '/rest/v1/prompt') return [];
    if (p.indexOf('/storage/v1/') === 0) return { Key:'ok' };
    return m === 'GET' ? [] : {};
  }

  function bytes(s){
    if (s == null) return 0;
    if (typeof s !== 'string') return s.byteLength || s.length || 0;
    return new Blob([s]).size;
  }

  function Fake(){ this.readyState = 0; this.status = 0; this.responseText = ''; }
  Fake.prototype.open = function(m, u){ this.__m = m; this.__u = u; };
  Fake.prototype.setRequestHeader = function(k, v){
    if (String(k).toLowerCase() === 'prefer') this.__pref = String(v || '');
  };
  Fake.prototype.abort = function(){};
  Fake.prototype.getResponseHeader = function(){ return null; };
  Fake.prototype.send = function(d){
    var self = this, parsed = null;
    try { parsed = typeof d === 'string' ? JSON.parse(d) : null; } catch (e) {}
    var st=''; try{ throw new Error('x'); }catch(e){ st=String(e.stack||''); }
    var rec = { m:self.__m, u:String(self.__u || ''), up:bytes(d), down:0, st:st };
    log.push(rec); out++;
    setTimeout(function(){
      out--;
      self.readyState = 4; self.status = 200;
      /* 憶えるのは先、返すのは後 ── PostgREST は `return=minimal` と
         言われても書きます。返さないだけです。ここが読まなければ
         「返る写しを止めた」が数字に出ません。 */
      try {
        var a = answer(self.__m, rec.u, parsed);
        self.responseText =
          (self.__m !== 'GET' &&
           String(self.__pref || '').indexOf('return=minimal') >= 0)
            ? '' : JSON.stringify(a);
      }
      catch (e) { self.responseText = 'null'; }
      rec.down = bytes(self.responseText);
      if (self.onreadystatechange) self.onreadystatechange();
    }, 1);
  };
  window.XMLHttpRequest = Fake;
}

/* 何も出ていない、そして何も始まっていない。slow-check.mjs と同じ。 */
async function quiet(pg){
  let idle = 0, n = -1;
  for (let i = 0; i < 400; i++){
    const s = await pg.evaluate(() => [window.__M.out(), window.__M.log.length]);
    if (s[0] === 0 && s[1] === n) idle++; else idle = 0;
    n = s[1];
    if (idle >= 2) return;
    await new Promise(r => setTimeout(r, 30));
  }
}

async function open(br, cfg){
  const pg = await br.newPage({ viewport:{ width:390, height:844 } });
  pg.on('pageerror', e => { ERR.push(String((e && e.message) || e)); });
  await pg.route('https://fonts.googleapis.com/**',
    r => r.fulfill({ status:200, contentType:'text/css', body:'' }));
  await pg.route('https://fonts.gstatic.com/**', r => r.abort());
  await pg.addInitScript(meter, cfg || {});
  await pg.goto(INDEX);
  await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });
  await quiet(pg);
  return pg;
}
const ERR = [];

/* ---- 単語をこしらえる ----------------------------------------------------
   fixture の単語と同じ形にします ── hw, ph, mn, mns, pos, at。四語に一語は
   tags と ety も持つ。人が作った辞書はだいたいこれです。 */
const MAKEWORDS = function(n){
  var C = 'ptkbdgmnsrlhwyvfz'.split(''), V = 'aeiou'.split('');
  var POS = ['n','v','adj','adv'], out = [], i, j, hw, ph, len;
  var seedn = 12345;
  function rnd(){ seedn = (seedn * 1103515245 + 12345) % 2147483648; return seedn / 2147483648; }
  for (i = 0; i < n; i++){
    hw = ''; ph = []; len = 2 + Math.floor(rnd() * 3);
    for (j = 0; j < len; j++){
      var c = C[Math.floor(rnd() * C.length)], v = V[Math.floor(rnd() * V.length)];
      hw += c + v; ph.push(c); ph.push(v);
    }
    var w = { hw:hw + i, ph:ph, mn:'meaning number ' + i,
              mns:['meaning number ' + i], pos:POS[i % 4], at:i + 1 };
    if (i % 4 === 0){ w.tags = ['land','common']; w.ety = 'from the older word for ' + hw; }
    out.push(w);
  }
  return out;
};

/* ---- 一 ── 言語一本の大きさ ---------------------------------------------
   アプリ自身の langSaveAll() が書き出したものを、そのまま数えます。 */
async function sliceSizes(br, n){
  const pg = await open(br, {});
  const got = await pg.evaluate(({ s, mk, n }) => {
    eval('(' + s + ')()');
    var make = eval('(' + mk + ')');
    if (n) { WORDS.length = 0; WORDS.push.apply(WORDS, make(n)); }
    langSaveAll();
    var out = {}, i, k;
    for (i = 0; i < SLICES.length; i++){
      k = langKeyOf(langId, SLICES[i]);
      out[SLICES[i]] = new Blob([String(LSL[k] || '')]).size;
    }
    return { sl: out, words: WORDS.length,
             langs: localStorage.getItem('lingua.langs') || '' };
  }, { s: seed.toString(), mk: MAKEWORDS.toString(), n });
  await pg.close();
  return got;
}

/* ---- 二 ── 起動一回の通信量 ---------------------------------------------
   一枚目で言語をサーバーへ上げ（憶える偽サーバー）、二枚目を「slice を一つも
   持っていない電話」として起動する。rule 22 のとおり slice は記憶の中だけな
   ので、これが毎回の起動そのものです。 */
async function launch(br, n, posts){
  /* 一枚目 ── 上げる。ここで出た bytes が「保存一回」の値でもある。 */
  const a = await open(br, {});
  await a.evaluate(({ s, mk, n }) => {
    eval('(' + s + ')()');
    var make = eval('(' + mk + ')');
    if (n) { WORDS.length = 0; WORDS.push.apply(WORDS, make(n)); }
    langSaveAll();
    /* 起動のときに勝手に生まれた空の言語は落とす ── 測るのは一本ぶんです。 */
    var id2; for (id2 in LANGS) if (id2 !== langId) delete LANGS[id2];
    langStore();
    window.__M.reset();
    netLangSync(function(){});
  }, { s: seed.toString(), mk: MAKEWORDS.toString(), n });
  await quiet(a);
  const up = await a.evaluate(() => ({
    log: window.__M.log.map(r => ({ m:r.m, u:r.u, up:r.up, down:r.down })),
    sl: window.__M.sl(), lrow: window.__M.lrow(),
    langs: localStorage.getItem('lingua.langs') || '',
    cur: localStorage.getItem('lingua.cur') || ''
  }));
  await a.close();

  /* 二枚目 ── 何も持っていない電話が起動する。 */
  const b = await open(br, { sl: up.sl, lrow: up.lrow, langs: up.langs,
                             cur: up.cur, posts: posts || [] });
  if (process.env.URLS) console.log('   LANGS: ' + await b.evaluate(() => JSON.stringify(LANGS) + '  open=' + langId));
  const down = await b.evaluate(() => window.__M.log.map(
    r => ({ m:r.m, u:r.u, up:r.up, down:r.down, st:r.st })));
  /* そのうえでフィードを一枚引く。 */
  await b.evaluate(() => { window.__M.reset(); PULL_GOT = {}; PULL_OUT = {};
                           pullGo('feed'); });
  await quiet(b);
  const feed = await b.evaluate(() => window.__M.log.map(
    r => ({ m:r.m, u:r.u, up:r.up, down:r.down })));
  /* そして「単語を一つ書いて保存」── 一日のうちで一番多い動きです。 */
  await b.evaluate(() => { window.__M.reset();
    WORDS.push({ hw:'kefu', ph:['k','e','f','u'], mn:'stone', mns:['stone'],
                 pos:'n', at:WORDS.length + 1 });
    save(); netSaveNow(function(){}); });
  await quiet(b);
  const one = await b.evaluate(() => window.__M.log.map(
    r => ({ m:r.m, u:r.u, up:r.up, down:r.down })));
  await b.close();
  return { up: up.log, launch: down, feed: feed, one: one };
}

/* ---- 三 ── 写真と声 -------------------------------------------------------
   www/post.js の道をそのまま通します。撮った写真の代わりに、canvas で
   「写真らしい」絵を作る ── 一様な色はJPEGが得意すぎて、実物より小さく出るので、
   粒と勾配と図形を混ぜた三段階で測って幅を出します。 */
async function media(br){
  const pg = await open(br, {});
  const got = await pg.evaluate(({ s }) => {
    eval('(' + s + ')()');
    function shot(w, h, detail){
      var c = document.createElement('canvas'), x, i, g;
      c.width = w; c.height = h; x = c.getContext('2d');
      g = x.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#264'); g.addColorStop(0.5, '#c93');
      g.addColorStop(1, '#137'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (i = 0; i < detail * 200; i++){
        x.fillStyle = 'rgba(' + ((i * 37) % 256) + ',' + ((i * 91) % 256) +
                      ',' + ((i * 53) % 256) + ',0.5)';
        x.beginPath();
        x.arc((i * 7919) % w, (i * 6271) % h, 2 + ((i * 13) % 40), 0, 6.3);
        x.fill();
      }
      /* 粒 ── 写真の細かさはここが効く。 */
      var d = x.getImageData(0, 0, w, h), p = d.data, sd = 7;
      for (i = 0; i < p.length; i += 4){
        sd = (sd * 1103515245 + 12345) % 2147483648;
        var v = ((sd >> 8) % 255 - 127) * detail * 0.12;
        p[i] += v; p[i+1] += v; p[i+2] += v;
      }
      x.putImageData(d, 0, 0);
      return c.toDataURL('image/jpeg', 0.95);
    }
    function b64bytes(u){
      var i = String(u).indexOf(','), s = String(u).slice(i + 1);
      return Math.floor(s.length * 3 / 4) - (s.slice(-2) === '==' ? 2 : s.slice(-1) === '=' ? 1 : 0);
    }
    var out = { pics: [], q: POST_PICQ, edge: POST_PIC, thumb: POST_THUMB };
    var srcs = [['のっぺり', shot(4032, 3024, 1)],
                ['ふつう',   shot(4032, 3024, 4)],
                ['細かい',   shot(4032, 3024, 12)]];
    return new Promise(function(done){
      var i = 0;
      function step(){
        if (i >= srcs.length){ done(out); return; }
        var nm = srcs[i][0], u = srcs[i][1];
        pwPics().length = 0;
        pwPicKeep(u, function(){
          var big = pwPics()[0] ? pwPics()[0].u : '';
          postThumb(big, function(sm){
            out.pics.push({ name: nm, src: b64bytes(u),
                            big: b64bytes(big), small: sm ? b64bytes(sm) : 0,
                            bigTxt: big.length });
            i++; step();
          });
        });
      }
      step();
    });
  }, { s: seed.toString() });
  /* 声 ── MediaRecorder の既定の bit/s。三十秒はその掛け算です。 */
  const vo = await pg.evaluate(() => new Promise(function(done){
    try {
      var ac = new (window.AudioContext || window.webkitAudioContext)();
      var d = ac.createMediaStreamDestination(), o = ac.createOscillator();
      o.connect(d); o.start();
      var r = new MediaRecorder(d.stream), got = 0;
      r.ondataavailable = function(e){ got += (e.data && e.data.size) || 0; };
      r.onstop = function(){
        done({ bps: r.audioBitsPerSecond || 0, mime: r.mimeType || '',
               ms: 3000, bytes: got });
      };
      r.start();
      setTimeout(function(){ r.stop(); }, 3000);
    } catch (e) { done({ err: String(e) }); }
  }));
  await pg.close();
  return { pics: got, vo: vo };
}

/* ---- フィードの二十本 ------------------------------------------------------
   行の中身はアプリ自身の netBody() に作らせます。ここで自前の行を書いたら、
   測っているのは自分の想像です。 */
async function feedRows(br, n){
  const pg = await open(br, {});
  const rows = await pg.evaluate(({ s, n }) => {
    eval('(' + s + ')()');
    var out = [], i, src;
    for (i = 0; i < n; i++){
      src = POSTS[i % POSTS.length];
      var b = netBody(src);
      /* 写真は Storage にあり、行には道しるべだけが乗る（netUpPics）。 */
      b.pu = ['u/p' + i + '/1.jpg']; b.pt = ['u/p' + i + '/1.t.jpg'];
      out.push({ id:'SRV-' + i, author:'U-' + (i % 5), body:b,
                 created_at:new Date(Date.now() - i * 60000).toISOString(),
                 reply_to:null, hidden_at:null, author_out:null,
                 likes:i % 7, boosts:i % 3, replies:i % 4,
                 i_like:false, i_boost:false });
    }
    return out;
  }, { s: seed.toString(), n });
  await pg.close();
  return rows;
}

function sum(xs, k){ let t = 0; for (const x of xs) t += x[k]; return t; }
function kb(b){ return (b / 1024).toFixed(1) + ' KB'; }
function tagOf(r){
  const p = String(r.u).split('?')[0].replace(/^[a-z]+:\/\/[^/]*/, '');
  const bits = p.split('/');
  return (r.m === 'GET' ? '' : r.m.toLowerCase() + ' ') + (bits[bits.length - 1] || p);
}
function roll(log){
  const by = {};
  for (const r of log){
    const k = tagOf(r);
    by[k] = by[k] || { n:0, up:0, down:0 };
    by[k].n++; by[k].up += r.up; by[k].down += r.down;
  }
  return by;
}
function show(name, log){
  const by = roll(log);
  console.log('  ' + name + ': ' + log.length + ' 要求, 送り ' +
    kb(sum(log, 'up')) + ', 受け ' + kb(sum(log, 'down')) +
    ', 見出し込み ' + kb(sum(log, 'up') + sum(log, 'down') + log.length * OVERHEAD));
  for (const k of Object.keys(by).sort((a, b) => by[b].down - by[a].down))
    console.log('      ' + k.padEnd(18) + String(by[k].n).padStart(3) + ' 回  送り ' +
      kb(by[k].up).padStart(10) + '  受け ' + kb(by[k].down).padStart(10));
}

/* ---- 走らせる ------------------------------------------------------------ */
const br = await chromium.launch(LAUNCH);
const OUT = { slices: {}, launch: {}, media: null };

console.log('== 一 ── 言語一本の大きさ（slice 12 個、langSaveAll が書いたもの） ==');
for (const n of [0, 100, 1000, 5000]){
  const g = await sliceSizes(br, n);
  let tot = 0; for (const k in g.sl) tot += g.sl[k];
  OUT.slices[n || g.words] = { sl: g.sl, tot: tot, words: g.words };
  console.log('  ' + String(g.words).padStart(5) + ' 語  合計 ' + kb(tot).padStart(10) +
    '   words ' + kb(g.sl.words).padStart(10) +
    '   letters ' + kb(g.sl.letters).padStart(9) +
    '   kb ' + kb(g.sl.kb).padStart(8));
}

const rows20 = await feedRows(br, 20);

console.log('');
console.log('== 二 ── 起動一回と保存一回の通信量 ==');
for (const n of [0, 100, 1000, 5000]){
  const r = await launch(br, n, rows20);
  const label = n ? (n + ' 語') : 'fixture の小さい言語（11 語）';
  OUT.launch[n] = r;
  console.log('  【' + label + '】');
  show('保存（言語まるごと上げ）', r.up);
  show('起動（何も持たない電話）', r.launch);
  show('フィード 20 本', r.feed);
  show('単語を一つ書いて保存', r.one);
}

console.log('');
console.log('== 三 ── 写真と声 ==');
OUT.media = await media(br);
for (const p of OUT.media.pics.pics)
  console.log('  ' + p.name.padEnd(8) + ' 元 ' + kb(p.src).padStart(10) +
    '  → 900px ' + kb(p.big).padStart(9) + '  小 300px ' + kb(p.small).padStart(9) +
    '  （端末に置く文字列 ' + kb(p.bigTxt) + '）');
console.log('  声: ' + JSON.stringify(OUT.media.vo));
/* URLS=1 で、起動中に誰がかけらを読んでいるかを呼び出しの跡ごと印字します。
   「二度読み」が本物か偽サーバーの作り物かは、これで一本ずつ確かめました。 */
if (process.env.URLS) for (const n of Object.keys(OUT.launch))
  for (const r of OUT.launch[n].launch)
    if (/slice/.test(r.u)) console.log(n + '  ' + r.m + ' ' + r.u.replace(/^[a-z]+:\/\/[^/]*/, '').slice(0,50) + '  down ' + r.down + '\n     ' + String(r.st||'').split('\n').slice(1,9).map(x=>x.trim().split(' ')[1]).join(' < '));

await br.close();
if (ERR.length) console.log('\n画面のエラー: ' + ERR.slice(0, 5).join(' | '));

/* ---- 四 ── 一人あたり、ひと月 --------------------------------------------
   掛け算はここでやります。手で掛けると、直したときに片方だけ直ります。 */
const MO = { launch: 30, save: 100, posts: 10, picsPer: 2, feeds: 60 };
/* Supabase Pro ── 公開の料金表（2026-09-09 に読んだもの）。 */
const PRO = { usd: 25, db: 8, store: 100, egress: 250,
              overEgress: 0.09, overStore: 0.021, overDb: 0.125 };
const PIC = OUT.media.pics.pics[1];          /* 「ふつう」の一枚 */
const G = 1024 * 1024 * 1024, M = 1024 * 1024;
function tot(log){ return sum(log, 'up') + sum(log, 'down') + log.length * OVERHEAD; }

console.log('');
console.log('== 四 ── 一人あたり、ひと月 ==');
console.log('  前提: 起動 ' + MO.launch + ' 回, 単語の保存 ' + MO.save +
  ' 回, 投稿 ' + MO.posts + ' 本, 一本に写真 ' + MO.picsPer +
  ' 枚, フィードを引く ' + MO.feeds + ' 回');
console.log('');
console.log('  語数    起動/月      保存/月     フィード/月    写真/月     合計/月     $25 で何人');
const PEOPLE = [];
for (const n of [100, 1000, 5000]){
  const r = OUT.launch[n];
  const L = tot(r.launch) * MO.launch;
  const S = tot(r.one) * MO.save;
  /* フィードは JSON より写真が重い。20 本に写真 2 枚なら小さい方が 40 枚。 */
  const F = (tot(r.feed) + 20 * MO.picsPer * PIC.small) * MO.feeds;
  const P = MO.posts * MO.picsPer * (PIC.big + PIC.small) +
            MO.posts * 2 * OVERHEAD;
  const T = L + S + F + P;
  const heads = Math.floor(PRO.egress * G / T);
  PEOPLE.push({ n, L, S, F, P, T, heads,
                storeMo: MO.posts * MO.picsPer * (PIC.big + PIC.small),
                db: OUT.slices[n].tot });
  console.log('  ' + String(n).padStart(5) + kb(L).padStart(12) + kb(S).padStart(13) +
    kb(F).padStart(14) + kb(P).padStart(12) + kb(T).padStart(13) +
    String(heads).padStart(12));
}
console.log('');
console.log('  置き場（写真）: 一人ひと月 ' + kb(PEOPLE[0].storeMo) +
  ' 増える → 100 GB は一人あたり ' +
  Math.floor(PRO.store * G / PEOPLE[0].storeMo) + " 人月");
console.log('  DB: 言語一本 ' + kb(PEOPLE[2].db) + '（5000 語）、直前 3 版を持つと ×4 = ' +
  kb(PEOPLE[2].db * 4) + ' → 8 GB は ' +
  Math.floor(PRO.db * G / (PEOPLE[2].db * 4)) + ' 本');
console.log('  超えたぶん: 通信 $' + PRO.overEgress + '/GB, 置き場 $' +
  PRO.overStore + '/GB, DB $' + PRO.overDb + '/GB');

/* ---- 五 ── 直したら何が変わるか、と、人数ごとの値段 -----------------------
   割り算を報告の中で手でやると、片方だけ直ります。ここで出します。 */
const JPY = 150;                       /* 2026-09 のおよその為替。注記のこと。 */
const P5 = PEOPLE[2], P1 = PEOPLE[1];
const R5 = OUT.launch[5000];
function mb(b){ return (b / M).toFixed(1) + ' MB'; }
function heads(t){ return Math.floor(PRO.egress * G / t); }
console.log('');
console.log('== 五 ── 直したら（5000 語の人の、ひと月） ==');
const echo = sum(R5.one, 'up') * MO.save;
const twice = 877.2 * 1024 * MO.launch;
const pre = 877.5 * 1024 * MO.save;
const lad = [['いまのまま', P5.T],
             ['受け取りの写しを止める', P5.T - echo],
             ['＋ 起動の二度読みを一度に', P5.T - echo - twice],
             ['＋ 送る前の読みも要らなくする', P5.T - echo - twice - pre]];
for (const [nm, t] of lad)
  console.log('  ' + nm.padEnd(30) + mb(t).padStart(10) +
    '  （' + Math.round((t / P5.T) * 100 - 100) + '%）  $25 で ' +
    heads(t) + ' 人');
console.log('');
console.log('== 六 ── 人数ごとの、ひと月の請求 ==');
function bill(per, n){
  const gb = per * n / G;
  const over = Math.max(0, gb - PRO.egress) * PRO.overEgress;
  return { gb: gb, usd: PRO.usd + over, over: over };
}
console.log('  人数        5000 語ばかり            1000 語ばかり');
for (const n of [763, 2000, 5000, 10000]){
  const a = bill(P5.T, n), b = bill(P1.T, n);
  console.log('  ' + String(n).padStart(6) + '   $' + a.usd.toFixed(0).padStart(4) +
    ' (¥' + Math.round(a.usd * JPY).toLocaleString() + ')' +
    (a.over ? ' 超過 $' + a.over.toFixed(0) : ' 収まる').padEnd(14) +
    '   $' + b.usd.toFixed(0).padStart(4) +
    ' (¥' + Math.round(b.usd * JPY).toLocaleString() + ')' +
    (b.over ? ' 超過 $' + b.over.toFixed(0) : ' 収まる'));
}
const mix = bill((P5.T * 5 + P1.T * 95) / 100, 10000);
console.log('  混ざったとき（一万人、百人に五人が 5000 語）: $' +
  mix.usd.toFixed(0) + '（¥' + Math.round(mix.usd * JPY).toLocaleString() +
  '）／月、通信 ' + mix.gb.toFixed(0) + ' GB');
console.log('  一人あたり: ' + [P5, PEOPLE[1], PEOPLE[0]].map(
  p => p.n + '語 ¥' + (PRO.usd * JPY / p.heads).toFixed(1)).join(', '));
