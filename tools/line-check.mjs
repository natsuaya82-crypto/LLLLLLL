/* ---------------------------------------------------------------------------
   tools/line-check.mjs — a line looks the same written and posted.

   Run it:   node tools/line-check.mjs

   「一行を描く仕組みが二つある件。…入力欄では単語の間が全角分あくのに、投稿
   すると普通の間隔になる。入力欄で改行しても、タイムラインでは消える。…一行を
   描く仕組みを一つにして、入力欄も投稿もそれで描くように書き直す。書いている
   時の見た目が、そのまま投稿の見た目になること。字間の設定も同じ話なので一緒に
   見てほしい。」 OWNER 2026-09-23.

   The composer's field was a textarea set in the typing face and a post's line
   was a canvas per letter with a scale of its own and `white-space:normal`.
   Measured on the fixture before the rewrite: a letter 0.79em in the field and
   1.0em on the post, and the newline typed in the field gone on the post.
   Nothing threw and every screenshot of either one alone was right.

   So this asks THE PAGE, in pixels, and never the arithmetic -- a check that
   worked out where a letter should stand would agree with whichever renderer
   it was copied from:

     1  the same line, typed into the composer and then posted, comes out in
        the same columns of ink and on the same number of lines, at the same
        distance apart. What the composer shows and the row are photographed;
        nothing about either is recomputed here. And what the composer shows
        is postLnHTML()'s drawing (watched) with the field's own letters
        transparent -- one function draws both, not two that agree
     2  the newline survives: two lines in the field are two lines on the post
        and the card breaks there too (cardInk() wrapped, as card-check does)
     3  the gap is the POST's: the open language set to 0 under a post written
        at one step moves nothing on its line
     4  at 0 two letters drawn edge to edge JOIN -- no empty column between
        them -- on a post's line and in the field; at one step they do not

   A browser, on its own port.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PORT = 8213;
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
const pg = await br.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = [];
pg.on('pageerror', (e) => errs.push(e.message));
await pg.goto(`http://localhost:${PORT}/`);
await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });
await pg.evaluate((s) => { eval('(' + s + ')()'); SET.walked = true; SET.ui = 'en'; },
                  seed.toString());

const fails = [];

/* Two letters whose stem runs from the left edge of the lattice to the right,
   so "joined" is a question pixels can answer. The fixture's own first two. */
await pg.evaluate(() => {
  const I = GGRID.inset, R = 800 - GGRID.inset;
  LETTERS[0].st = [{ pts: [[I, 400], [R, 400]] }, { pts: [[400, 400], [400, 160]] }];
  LETTERS[1].st = [{ pts: [[I, 400], [R, 400]] }, { pts: [[220, 400], [220, 620], [580, 620], [580, 400]] }];
  SCRIPT.sp = 1;
  installScriptFont();
});

/* The ink of one element's content box, as the page draws it: a screenshot of
   exactly that box, decoded in the page, reduced to where there is ink. Rows
   are grouped into lines; each line is its runs of inked columns, measured
   from the box's own left edge, in CSS px. */
const inkOf = async (sel) => {
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(150);
  const box = await pg.evaluate((sel) => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    const px = (k) => parseFloat(cs[k]) || 0;
    const x = r.left + px('borderLeftWidth') + px('paddingLeft');
    const y = r.top + px('borderTopWidth') + px('paddingTop');
    const w = r.width - px('borderLeftWidth') - px('borderRightWidth') - px('paddingLeft') - px('paddingRight');
    const h = r.height - px('borderTopWidth') - px('borderBottomWidth') - px('paddingTop') - px('paddingBottom');
    return { x, y, width: w, height: h };
  }, sel);
  if (!box || !(box.width > 0) || !(box.height > 0)) return null;
  const png = await pg.screenshot({ clip: box });
  return pg.evaluate(async (b64) => {
    const im = new Image();
    await new Promise((ok) => { im.onload = ok; im.src = 'data:image/png;base64,' + b64; });
    const c = document.createElement('canvas');
    c.width = im.width; c.height = im.height;
    const x = c.getContext('2d');
    x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    const bg = [d[0], d[1], d[2]];
    const on = (i, j) => {
      const k = (j * c.width + i) * 4;
      return Math.abs(d[k] - bg[0]) + Math.abs(d[k + 1] - bg[1]) + Math.abs(d[k + 2] - bg[2]) > 120;
    };
    const rows = [];
    for (let j = 0; j < c.height; j++) {
      let n = false;
      for (let i = 0; i < c.width && !n; i++) n = on(i, j);
      rows.push(n);
    }
    const bands = [];
    for (let j = 0; j < rows.length; j++) {
      if (!rows[j]) continue;
      const last = bands[bands.length - 1];
      if (last && j - last.b <= 8) last.b = j; else bands.push({ a: j, b: j });
    }
    const S = window.devicePixelRatio || 1;
    return bands.map((bd) => {
      const cols = [];
      for (let i = 0; i < c.width; i++) {
        let n = false;
        for (let j = bd.a; j <= bd.b && !n; j++) n = on(i, j);
        cols.push(n);
      }
      const runs = [];
      for (let i = 0; i < cols.length; i++) {
        if (!cols[i]) continue;
        const last = runs[runs.length - 1];
        if (last && last[1] === i - 1) last[1] = i; else runs.push([i, i]);
      }
      return { top: bd.a / S, runs: runs.map((r) => [r[0] / S, (r[1] + 1) / S]) };
    });
  }, png.toString('base64'));
};
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const sameInk = (A, B) => {
  if (!A || !B || A.length !== B.length) return false;
  for (let i = 0; i < A.length; i++) {
    const a = A[i].runs, b = B[i].runs;
    if (a.length !== b.length) return false;
    for (let k = 0; k < a.length; k++)
      if (!near(a[k][0] - a[0][0], b[k][0] - b[0][0], 1) ||
          !near(a[k][1] - a[0][0], b[k][1] - b[0][0], 1)) return false;
    if (i && !near(A[i].top - A[0].top, B[i].top - B[0].top, 1)) return false;
  }
  return true;
};
const say = (A) => JSON.stringify((A || []).map((l) =>
  l.runs.map((r) => Math.round(r[0] * 10) / 10 + '-' + Math.round(r[1] * 10) / 10).join(' ')));

/* ---- 1. and 2. the same line, written and posted --------------------- */
/* a b a, a space, b a, a newline, a a b -- typed the way the Lingua
   keyboard types it, which is the private use code points. */
const RAW = await pg.evaluate(() => {
  const a = ltPua(0), b = ltPua(1);
  return a + b + a + ' ' + b + a + '\n' + a + a + b;
});
await pg.evaluate((raw) => {
  POSTS = POSTS.filter((p) => p.id !== 'pline');
  PW = pwBlank(); openPost(); render();
  const e = document.getElementById('pw-ln');
  /* Which function drew what is seen: postLnHTML() is watched, not assumed. */
  window.__drew = [];
  const real = postLnHTML;
  postLnHTML = function (p) { const h = real(p); window.__drew.push(h); return h; };
  try {
    e.value = raw;
    e.dispatchEvent(new Event('input', { bubbles: true }));
  } finally { postLnHTML = real; }
  /* the caret is drawn at the end and is not the line */
  document.querySelectorAll('.pwcaret').forEach((c) => { c.style.visibility = 'hidden'; });
}, RAW);
const typed = await inkOf('#pw-view');
/* What is SEEN is that drawing and nothing else: the field's own letters are
   not shown, and the view's letters are exactly what postLnHTML() returned. */
const who = await pg.evaluate(() => {
  const e = document.getElementById('pw-ln'), v = document.getElementById('pw-view');
  const cs = getComputedStyle(e);
  const probe = document.createElement('div');
  probe.innerHTML = window.__drew.length ? window.__drew[window.__drew.length - 1] : '';
  return { color: cs.color, drew: window.__drew.length,
           same: !!v && probe.textContent === v.textContent };
});
if (!/rgba\(\d+, \d+, \d+, 0\)|transparent/.test(who.color))
  fails.push('the field shows its own letters (' + who.color + ') -- what is seen in the ' +
             'composer is set by the field and not by the one function a post is drawn by');
if (!who.drew || !who.same)
  fails.push('what the composer shows is not what postLnHTML() drew for it (' + who.drew +
             ' calls) -- the line is being drawn by something else');
const sent = await pg.evaluate(() => {
  const was = POSTS.map((p) => p.id);
  pwSend();
  const p = POSTS.filter((q) => was.indexOf(q.id) < 0)[0];
  if (!p) return null;
  p.id = 'pline';
  go('thread', 'pline');
  return { s: p.ink && p.ink.s, sp: p.ink && p.ink.sp };
});
if (!sent) fails.push('pwSend() put no post on the timeline, so nothing below is a test of anything');
await pg.evaluate(() => { if (typeof popOff === 'function') popOff(); });
const posted = await inkOf('#app .pline');
if (!typed || !typed.length) fails.push('the composer drew no ink for the line typed into it');
if (!sameInk(typed, posted))
  fails.push('the line typed and the line posted are not the same ink:\n' +
             '     field ' + say(typed) + '\n     post  ' + say(posted));
if (!posted || posted.length !== 2)
  fails.push('a line written on two lines came out on ' + (posted ? posted.length : 0) +
             ' on the post -- the newline was lost');

/* The card: the same post, and the line ends where the newline is. The card
   may break at a space as well -- fitting a picture is what it is for -- so
   what is asked is that the last letter before the newline and the first
   after it are on different rows. cardInk() is what puts the items on the
   picture, so it is watched, and cardPaint() called for real. */
/* Two letters on two lines: short enough that a card treating the newline
   as a space would set them side by side, where they are biggest. */
const card = await pg.evaluate(() => {
  const a = ltPua(0), b = ltPua(1);
  POSTS.push({ id: 'pcard2', at: 2, lang: langId, lname: langName, ln: 'x', who: 'Aya', hd: 'aya',
               mine: true, mn: '', ui: 'en', ink: postInkTyped(a + '\n' + b) });
  CARD = { k: 'p', v: 'pcard2' };
  const real = cardInk;
  let seen = null;
  cardInk = function (x, items) { seen = items; return real.apply(null, arguments); };
  try { cardPaint(document.createElement('canvas')); } finally { cardInk = real; }
  const ys = (seen || []).filter((u) => u.st).map((u) => Math.round(u.ay));
  return { n: ys.length, before: ys[0], after: ys[1] };
});
if (card.n !== 2 || card.before === card.after)
  fails.push('the card of a post written on two lines ran the newline together: ' +
             card.n + ' letters, the last before it at y=' + card.before +
             ' and the first after it at y=' + card.after);

/* ---- 3. the gap is the post's ------------------------------------- */
const at1 = posted;
await pg.evaluate(() => { SCRIPT.sp = 0; installScriptFont(); render(); });
const at0 = await inkOf('#app .pline');
await pg.evaluate(() => { SCRIPT.sp = 1; installScriptFont(); render(); });
if (!sameInk(at1, at0))
  fails.push("a post's line moved when the OPEN language was set to 0 -- it is spaced " +
             'by this phone\'s language, not the one it was written with:\n     ' +
             say(at1) + '\n     ' + say(at0));

/* ---- 4. at 0 two letters drawn edge to edge join ------------------- */
/* Empty columns between the first ink and the last, on one line of two of
   the first letter: none at 0, some at one step. On a post (the gap it
   carries) and in the field (the gap the language has). */
const gaps = (A) => {
  if (!A || !A.length) return -1;
  let g = 0;
  const r = A[0].runs;
  for (let i = 1; i < r.length; i++) g += r[i][0] - r[i - 1][1];
  return Math.round(g * 10) / 10;
};
const JOIN = {};
for (const sp of [1, 0]) {
  const two = await pg.evaluate((sp) => {
    SCRIPT.sp = sp; installScriptFont();
    const two = ltPua(0) + ltPua(0);
    POSTS = POSTS.filter((p) => p.id !== 'pjoin');
    POSTS.push({ id: 'pjoin', at: 1, lang: 'other', lname: 'Other', ln: 'x', who: 'Iri', hd: 'iri',
                 mine: false, mn: '', ui: 'en', ink: postInkTyped(two) });
    go('thread', 'pjoin');
    return two;
  }, sp);
  const line = await inkOf('#app .pline');
  await pg.evaluate((two) => {
    PW = pwBlank(); openPost(); render();
    const e = document.getElementById('pw-ln');
    e.value = two;
    e.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelectorAll('.pwcaret').forEach((c) => { c.style.visibility = 'hidden'; });
  }, two);
  const field = await inkOf('#pw-view');
  JOIN[sp] = { line: gaps(line), field: gaps(field) };
  await pg.evaluate(() => { PW = pwBlank(); });
}
await pg.evaluate(() => { SCRIPT.sp = 1; installScriptFont(); });
if (JOIN[0].line !== 0 || JOIN[0].field !== 0)
  fails.push('at 0 two letters drawn edge to edge do not join: ' + JOIN[0].line +
             'px empty on a post\'s line, ' + JOIN[0].field + 'px in the field');
if (!(JOIN[1].line > 0) || !(JOIN[1].field > 0))
  fails.push('at one step two letters stand with no gap (line ' + JOIN[1].line + ', field ' +
             JOIN[1].field + '), so the test above proves nothing');

if (errs.length) fails.push('the page threw: ' + errs.slice(0, 3).join(' | '));

await br.close();
srv.close();

if (fails.length) {
  console.error('\nline: ' + fails.length + ' thing' + (fails.length > 1 ? 's' : '') +
                ' about a line of the language do not hold:\n');
  for (const f of fails) console.error('  ' + f + '\n');
  process.exit(1);
}
console.log('line: typed into the composer and posted, one line comes out in the same\n' +
            '      ink -- ' + say(posted) + ' -- on 2 lines on the post, and the\n' +
            '      card breaks where the newline is. The open language set to 0 moves nothing on a post written\n' +
            '      at one step. Two letters drawn edge to edge, px empty between them --\n' +
            '      at 1: line ' + JOIN[1].line + ', field ' + JOIN[1].field +
            ';  at 0: line ' + JOIN[0].line + ', field ' + JOIN[0].field + '.');
