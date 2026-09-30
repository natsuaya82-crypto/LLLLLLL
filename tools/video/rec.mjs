/* ---------------------------------------------------------------------------
   tools/video/rec.mjs — a short vertical how-to video of the app.

   Run it:   node tools/video/rec.mjs draw-a-letter         (one script)
             node tools/video/rec.mjs --probe 'kb>do:kbNew'  (arrive, press, then list)
             node tools/video/rec.mjs --all                  (every script)
             node tools/video/rec.mjs --probe letters        (what can be pressed on a route)

   NOT a gate and not a check. It opens the app the way tools/shot.mjs does --
   www/ served as it is, filled from tools/fixture.mjs -- at the width of a
   phone, presses what a script in tools/video/scripts.mjs says to press, and
   films it. What is put on top of the app (the English caption, the circle
   where a finger lands, the name at the end) is put into the PAGE while it is
   filmed and is in no file under www/.

   The frame is 1080×1920: the page is 390 wide, which is an iPhone, and
   1080/390 tall enough to be 9:16, drawn at 1080/390 so a pixel of the page
   is a pixel of the film. Frames come from the browser's own screencast as
   they are painted and are laid on a steady 30 a second afterwards.

   Written by the ffmpeg this can find. H.264 in an .mp4 when there is an
   ffmpeg that has it (FFMPEG=/path, or `ffmpeg` on PATH); otherwise the one
   Playwright already carries, which only writes VP8, so the film is a .webm.
   Nothing is downloaded by this file.

   Out: docs/video/out/<name>.<mp4|webm>
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { seed } from '../fixture.mjs';
import { chromium, LAUNCH } from '../browser.mjs';
import { SCRIPTS } from './scripts.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const WWW = path.join(ROOT, 'www');
const OUT = path.join(ROOT, 'docs', 'video', 'out');
const PORT = 8133;
const ICON = 'data:image/png;base64,' +
  fs.readFileSync(path.join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png')).toString('base64');
const W = 390, SCALE = 1080 / 390, H = Math.round(1920 / SCALE);   /* 693 */
/* A script may name its own frame: `view: [w, h, scale]` is the page and how
   many pixels a point is (stills are taken at that), `size: [w, h]` what the
   film is written at, `out` the folder under the repo it goes into. */
/* SLOW: while an hq film is taken the page runs `slow` times slower -- its
   CSS animations through CDP, the waits here and the layer's timers by the
   same factor -- and the frames are laid back at the real speed, so a
   browser that screenshots 15-20 times a second gives a film of 30-40 「まだ
   カクカクしてる」 OWNER 2026-09-30. The app's own timers are not slowed. */
let SLOW = 1;
const nap = (pg, ms) => pg.waitForTimeout(ms * SLOW);
let FRAME = { w: W, h: H, scale: SCALE, size: [1080, 1920], out: OUT };
function frameOf(sc) {
  const v = sc.view || [W, H, SCALE];
  return { w: v[0], h: v[1], scale: v[2], size: sc.size || [1080, 1920],
           out: sc.out ? path.join(ROOT, sc.out) : OUT };
}
const FPS = 30;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
               '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
               '.otf': 'font/otf', '.ttf': 'font/ttf' };

const argv = process.argv.slice(2);
const probe = argv.indexOf('--probe') >= 0;
const named = argv.filter((a) => !a.startsWith('--'));

/* ---- which ffmpeg ------------------------------------------------------- */
function ffOK(bin, enc) {
  try {
    const r = spawnSync(bin, ['-hide_banner', '-encoders'], { encoding: 'utf8' });
    return r.status === 0 && r.stdout.indexOf(enc) >= 0;
  } catch (e) { return false; }
}
function pickFF() {
  for (const b of [process.env.FFMPEG, 'ffmpeg'].filter(Boolean))
    if (ffOK(b, 'libx264')) return { bin: b, ext: 'mp4' };
  const pw = '/opt/pw-browsers';
  const dirs = fs.existsSync(pw) ? fs.readdirSync(pw).filter((d) => d.startsWith('ffmpeg')) : [];
  for (const d of dirs) {
    const b = path.join(pw, d, 'ffmpeg-linux');
    if (fs.existsSync(b) && ffOK(b, 'libvpx')) return { bin: b, ext: 'webm' };
  }
  return null;
}

/* ---- the server, as shot.mjs has it ------------------------------------- */
const srv = http.createServer((q, r) => {
  const f = path.join(WWW, q.url === '/' ? 'index.html' : decodeURIComponent(q.url.split('?')[0]));
  let body;
  try { body = fs.readFileSync(f); } catch (e) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain', 'Cache-Control': 'no-store' });
  r.end(body);
}).listen(PORT);

/* ---- what goes on top of the app while it is filmed --------------------- */
const LAYER = `
(function(){
  if (document.getElementById('__v')) return;
  var st = document.createElement('style');
  st.textContent =
    '#__v{position:fixed;inset:0;pointer-events:none;z-index:2147483647}' +
    /* The caption is the earlier film's (2026-09-25, the Devpost demo): big
       white serif italic laid straight over the app, no box behind it. */
    '#__vcap{position:absolute;left:10px;right:10px;top:44px;padding:0;' +
      'color:#fff;font:italic 600 44px/1.02 var(--face-ital),Georgia,serif;' +
      'text-align:center;letter-spacing:-.005em;' +
      'text-shadow:0 2px 3px rgba(0,0,0,.9),0 0 18px rgba(0,0,0,.75),0 0 2px #000;' +
      'transition:opacity .25s;opacity:0}' +
    '#__vcap.dim{opacity:.18!important}' +
    /* A card: one picture of a part of the app, alone on the dark, over the
       app and under the caption -- the layouts shown one after another at
       the end 「最後にこんだけあるよーってスライドショーみたいにドーン」
       OWNER 2026-09-30. The pictures are taken before filming (cards, below). */
    '#__vcard{position:absolute;inset:0;background:#070709;opacity:0;transition:opacity .3s}' +
    '#__vcard.on{opacity:1}' +
    '#__vcard h4{position:absolute;left:0;right:0;top:120px;margin:0;text-align:center;' +
      'font:400 15px/1 var(--face-display,Georgia),Georgia,serif;letter-spacing:.34em;color:#c9a44c}' +
    '#__vcard img{position:absolute;left:16px;right:16px;top:170px;height:390px;width:calc(100% - 32px);object-fit:contain}' +
    '#__vcap.on{opacity:1}' +
    '.__vdot{position:absolute;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;' +
      'background:rgba(255,255,255,.35);border:3px solid rgba(20,20,30,.55);' +
      'box-shadow:0 0 0 2px rgba(255,255,255,.7);transition:transform .18s,opacity .35s}' +
    /* The end: the app's own icon, the name spaced out with its G in gold,
       and the App Store badge under it -- the earlier demo's last card
       「こんな感じだったのに。apple storeのロゴも使って欲しい」 OWNER
       2026-09-30. The badge is drawn here in Apple's own shape (black, a
       thin grey rim, the mark and two lines), because Apple's artwork
       cannot be fetched from this container. */
    '#__vend{position:absolute;inset:0;background:#070709;color:#f3efe6;display:flex;' +
      'flex-direction:column;align-items:center;justify-content:center;opacity:0;transition:opacity .45s}' +
    '#__vend.on{opacity:1}' +
    '#__vend>*{opacity:0;transform:translateY(8px);transition:opacity .6s,transform .6s}' +
    '#__vend.on>*{opacity:1;transform:none}' +
    '#__vend.on>:nth-child(2){transition-delay:.25s}#__vend.on>:nth-child(3){transition-delay:.55s}' +
    '#__vend img{width:92px;height:92px;border-radius:50%;box-shadow:0 0 40px rgba(201,164,76,.12)}' +
    '#__vend b{margin-top:34px;padding-left:.42em;font:400 42px/1 var(--face-display,Georgia),Georgia,serif;' +
      'letter-spacing:.42em;color:#f3efe6;text-shadow:0 2px 10px rgba(0,0,0,.8)}' +
    '#__vend b em{font-style:normal;color:#c9a44c}' +
    '#__vend a{margin-top:56px;display:flex;align-items:center;gap:9px;padding:8px 16px 8px 13px;' +
      'background:#000;border:1.5px solid #a6a6a6;border-radius:11px;color:#fff;text-decoration:none}' +
    '#__vend a svg{width:30px;height:30px;fill:#fff;margin-top:-3px}' +
    '#__vend a span{display:flex;flex-direction:column;font-family:-apple-system,"Helvetica Neue",Helvetica,Arial,sans-serif;line-height:1}' +
    '#__vend a small{font-size:11px;letter-spacing:.02em}' +
    '#__vend a strong{font-size:25px;font-weight:600;letter-spacing:-.01em;margin-top:2px}';
  document.head.appendChild(st);
  var v = document.createElement('div'); v.id = '__v';
  v.innerHTML = '<div id="__vcard"><h4></h4><img alt=""></div><div id="__vcap"></div><div id="__vend">' +
    '<img alt="">' +
    '<b>LIN<em>G</em>UA</b>' +
    /* the Apple mark: Simple Icons' "apple" (CC0) */
    '<a><svg viewBox="0 0 24 24"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>' +
    '<span><small>Download on the</small><strong>App Store</strong></span></a>' +
    '</div>';
  document.body.appendChild(v);
  window.__vCap = function (s, y) {
    var c = document.getElementById('__vcap');
    c.style.top = (y === undefined || y === null ? 44 : y) + 'px';
    if (!s) { c.className = ''; return; }
    c.textContent = s; c.className = 'on';
  };
  window.__vUnder = function (y) {
    var c = document.getElementById('__vcap'), r = c.getBoundingClientRect();
    if (c.className.indexOf('on') >= 0 && y > r.top - 30 && y < r.bottom + 30) {
      c.classList.add('dim'); clearTimeout(window.__vUT);
      window.__vUT = setTimeout(function(){ c.classList.remove('dim'); }, 900 * (window.__vK || 1));
    }
  };
  window.__vDot = function (x, y, keep) {
    window.__vUnder(y);
    var d = document.createElement('div'); d.className = '__vdot';
    d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.transform = 'scale(1.25)';
    document.getElementById('__v').appendChild(d);
    var k = window.__vK || 1;
    setTimeout(function(){ d.style.transform = 'scale(.9)'; }, 30 * k);
    if (!keep) setTimeout(function(){ d.style.opacity = '0'; }, 420 * k);
    if (!keep) setTimeout(function(){ d.remove(); }, 800 * k);
    return d;
  };
  window.__vMove = function (x, y) {
    var d = document.querySelector('.__vdot.keep');
    if (!d) { d = window.__vDot(x, y, true); d.className += ' keep'; d.style.transition = 'opacity .35s'; }
    window.__vUnder(y);
    d.style.left = x + 'px'; d.style.top = y + 'px';
  };
  window.__vLift = function () {
    var d = document.querySelector('.__vdot.keep');
    if (d) { d.style.opacity = '0'; setTimeout(function(){ d.remove(); }, 400 * (window.__vK || 1)); }
  };
  window.__vCard = function (src, title) {
    var c = document.getElementById('__vcard'), im = c.querySelector('img');
    if (!src) { c.className = ''; return; }
    c.querySelector('h4').textContent = title || '';
    im.src = src; c.className = 'on';
    im.animate([{ transform: 'scale(1.1)', opacity: 0 }, { transform: 'none', opacity: 1 }],
               { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
  };
  window.__vEnd = function (icon) {
    document.querySelector('#__vend img').src = icon;
    window.__vCap('');
    document.getElementById('__vend').className = 'on';
  };
})();
`;

/* ---- a drawn alphabet ----------------------------------------------------
   The fixture's language has three letters drawn, so every line on the
   screen came out roman -- and the earlier film was all somebody's own
   letters. So before filming, every a-z slot the fixture left undrawn is
   given a shape: angular strokes on the 800 square, each one a Latin
   skeleton turned on its side so it reads as a script of its own. `keep`
   names letters left blank (the letter a film draws). Only the page's
   memory is touched. */
const SHAPES = {
  a: [[[.2,.9],[.2,.1],[.8,.1],[.8,.9]], [[.2,.5],[.8,.5]]],
  b: [[[.2,.1],[.2,.9],[.8,.9],[.8,.5],[.2,.5]]],
  c: [[[.8,.1],[.2,.1],[.2,.9],[.8,.9]]],
  d: [[[.8,.1],[.8,.9],[.2,.9],[.2,.5],[.8,.5]]],
  e: [[[.8,.1],[.2,.1],[.2,.9],[.8,.9]], [[.2,.5],[.6,.5]]],
  f: [[[.8,.1],[.2,.1],[.2,.9]], [[.2,.5],[.6,.5]]],
  g: [[[.8,.1],[.2,.1],[.2,.9],[.8,.9],[.8,.5],[.5,.5]]],
  h: [[[.2,.1],[.2,.9]], [[.8,.1],[.8,.9]], [[.2,.5],[.8,.5]]],
  i: [[[.5,.1],[.5,.9]], [[.3,.1],[.7,.1]]],
  j: [[[.8,.1],[.8,.9],[.2,.9],[.2,.6]]],
  l: [[[.2,.1],[.2,.9],[.8,.9]]],
  m: [[[.2,.9],[.2,.1],[.5,.5],[.8,.1],[.8,.9]]],
  n: [[[.2,.9],[.2,.1],[.8,.9],[.8,.1]]],
  o: [[[.2,.1],[.8,.1],[.8,.9],[.2,.9],[.2,.1]], [[.5,.4],[.5,.6]]],
  p: [[[.2,.9],[.2,.1],[.8,.1],[.8,.5],[.2,.5]]],
  q: [[[.8,.9],[.8,.1],[.2,.1],[.2,.5],[.8,.5]]],
  r: [[[.2,.9],[.2,.1],[.8,.1],[.8,.5],[.2,.5],[.8,.9]]],
  s: [[[.8,.1],[.2,.1],[.2,.5],[.8,.5],[.8,.9],[.2,.9]]],
  u: [[[.2,.1],[.2,.9],[.8,.9],[.8,.1]]],
  v: [[[.2,.1],[.5,.9],[.8,.1]]],
  w: [[[.2,.1],[.35,.9],[.5,.4],[.65,.9],[.8,.1]]],
  x: [[[.2,.1],[.8,.9]], [[.8,.1],[.2,.9]]],
  y: [[[.2,.1],[.5,.5],[.8,.1]], [[.5,.5],[.5,.9]]],
  z: [[[.2,.1],[.8,.1],[.2,.9],[.8,.9]]],
  /* and the digits, so the row over a QWERTY is the language's too */
  '0': [[[.3,.1],[.7,.1],[.7,.9],[.3,.9],[.3,.1]]],
  '2': [[[.3,.1],[.7,.1],[.7,.5],[.3,.9],[.7,.9]]],
  '3': [[[.3,.1],[.7,.3],[.3,.5],[.7,.7],[.3,.9]]],
  '4': [[[.3,.1],[.3,.5],[.7,.5]], [[.6,.3],[.6,.9]]],
  '5': [[[.7,.1],[.3,.1],[.3,.5],[.7,.6],[.3,.9]]],
  '6': [[[.7,.1],[.3,.5],[.3,.9],[.7,.9],[.7,.6],[.3,.6]]],
  '7': [[[.3,.1],[.7,.1],[.4,.9]]],
  '8': [[[.3,.1],[.7,.1],[.3,.9],[.7,.9],[.3,.1]]],
  '9': [[[.7,.5],[.3,.5],[.3,.1],[.7,.1],[.7,.9]]],
};
async function inkAll(pg, keep) {
  await pg.evaluate(({ SH, keep }) => {
    LETTERS.forEach(function (l) {
      var n = ltName(l);
      if (!SH[n] || keep.indexOf(n) >= 0 || (l.st && l.st.length) || l.ch) return;
      l.st = SH[n].map(function (line) {
        return { pts: line.map(function (p) { return [Math.round(112 + p[1] * 576), Math.round(112 + p[0] * 576)]; }) };
      });
    });
    installScriptFont(); installTypeFont(); render();
  }, { SH: SHAPES, keep: keep || [] });
  await pg.waitForTimeout(400);
}

/* ---- open the app -------------------------------------------------------- */
async function open(br) {
  const ctx = await br.newContext({ viewport: { width: FRAME.w, height: FRAME.h }, deviceScaleFactor: FRAME.scale,
                                    hasTouch: true });
  /* THERE IS NO SERVER BEHIND THIS, as shot.mjs says. A request that fails
     puts 「接続できません」 over the film, and a request answered with
     anything would be the app told something by a server that does not
     exist. So a request that leaves localhost is held and never answered
     (the typefaces aside, which are what the phone draws in):
     the app waits, which is what it does on a slow network, and draws what
     the fixture put in it. */
  await ctx.route((u) => !/^https?:\/\/localhost(:\d+)?\//.test(u.href) && !u.href.startsWith('data:'),
                  (rt) => { if (/fonts\.(googleapis|gstatic)\.com/.test(rt.request().url())) rt.continue(); });
  const pg = await ctx.newPage();
  await pg.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await pg.waitForSelector('#splash', { state: 'detached', timeout: 15000 });
  await pg.evaluate('window.__seed = ' + seed.toString());
  await pg.evaluate(() => {
    window.__seed();
    SET.walked = true; SET.ui = 'en'; SET.theme = 'dark';
    /* the drawn letters ON, which is the app's own default (myFontWant(),
       www/glyph.js); the fixture turns them off for the checks. */
    SET.myfont = true;
    if (typeof applyTheme === 'function') applyTheme();
  });
  await pg.evaluate(LAYER);
  /* AND A SAVE IS HEARD. A Save waits for the server to answer (keepSave()
     in www/shell.js) and there is no server here, so the screen would stand
     on the press for ever. While filming, and only here, the one send says
     it landed -- which is what a phone with a signal is told. Nothing under
     www/ is changed; the page is. */
  await pg.evaluate(() => { window.netSaveNow = function (done) { if (done) setTimeout(function () { done(true); }, 250 * (window.__vK || 1)); }; });
  /* And a read that gives up says nothing. The requests held above time out
     inside the app after a while and 「No connection」 came up over the last
     seconds of a film. That is the app right about a network that is not
     there, and it is not what the film is about. */
  /* And a post is heard the same way: netPush() (www/net.js) is the one send
     of a post, and here it says the row landed. */
  await pg.evaluate(() => { window.netPush = function (p, ok) { if (ok) setTimeout(function () { ok('v' + Date.now()); }, 350 * (window.__vK || 1)); }; });
  await pg.evaluate(() => { window.netPop = function () { if (typeof netSpin === 'function') netSpin(false); return true; }; });
  /* And the star a press puts over the screen while its request is out
     (netOn(), www/net.js) is not put up: with no server here a request
     somebody pressed for -- a letter's save sends more than netSaveNow() --
     is never answered, and the star stood over the rest of the film and
     took every press after it. */
  await pg.evaluate(() => { window.netOn = function () {}; });
  /* And a profile's save is heard the way a language's is: netPut() is the
     one save for a profile row, and here a profile says it landed with what
     it sent. Every other kind goes where it always went. */
  await pg.evaluate(() => {
    var put = window.netPut;
    window.netPut = function (to, id, row, ok, bad) {
      if (to !== 'profile') return put.apply(this, arguments);
      setTimeout(function () { ok(row); }, 250 * (window.__vK || 1));
    };
  });
  return { ctx, pg };
}

/* ---- cards: pictures of part of the app, taken before filming -----------
   In a browser of their own, so what is done to take them (a keyboard of
   every layout made, say) is not in the app that is then filmed. Each card is
   { eval, sel }: run eval, then the smallest rectangle round everything sel
   matches, at the frame's own pixels. */
let CARDS = [];
async function takeCards(br, sc) {
  CARDS = [];
  if (!sc.cards) return;
  const { ctx, pg } = await open(br);
  await inkAll(pg, sc.blank);
  for (const c of sc.cards) {
    await pg.evaluate(c.eval);
    await pg.waitForTimeout(500);
    const r = await pg.evaluate((sel) => {
      var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      document.querySelectorAll(sel).forEach(function (e) {
        var b = e.getBoundingClientRect();
        if (!b.width) return;
        x0 = Math.min(x0, b.left); y0 = Math.min(y0, b.top); x1 = Math.max(x1, b.right); y1 = Math.max(y1, b.bottom);
      });
      return { x: x0 - 6, y: y0 - 6, width: x1 - x0 + 12, height: y1 - y0 + 12 };
    }, c.sel);
    CARDS.push('data:image/png;base64,' + (await pg.screenshot({ clip: r })).toString('base64'));
  }
  await ctx.close();
}

async function unpop(pg) {
  for (let i = 0; i < 4; i++) {
    if (!await pg.evaluate(() => typeof popOn === 'function' && popOn())) break;
    await pg.evaluate(() => { if (typeof popOff === 'function') popOff(); });
    await nap(pg, 260);
  }
}

/* A step names what it acts on by a selector, or by `do:name` for the
   data-do a button carries, or by `text:words` for what it says. The first
   one that is on the screen and visible is the one. */
function sel(s) {
  if (s.startsWith('do:')) return `[data-do="${s.slice(3)}"]`;
  if (s.startsWith('text:')) return `text=${s.slice(5)}`;
  return s;
}
async function boxOf(pg, s, nth) {
  const loc = pg.locator(sel(s)).filter({ visible: true }).nth(nth || 0);
  await loc.scrollIntoViewIfNeeded({ timeout: 4000 });
  const b = await loc.boundingBox();
  if (!b) throw new Error(`nothing on the screen for ${s}`);
  return b;
}

async function run(pg, steps, taps, stills) {
  for (const s of steps) {
    if (s.cap !== undefined) await pg.evaluate(([c, y]) => window.__vCap(c, y), [s.cap, s.capAt]);
    if (s.go) {
      await pg.evaluate(({ r, a }) => { go(r, a); render(); }, { r: s.go, a: s.a });
      await unpop(pg);
    }
    if (s.eval) await pg.evaluate(s.eval);
    /* pick: a photograph for the phone's own picker to answer with. The
       library is PHPickerViewController through LinguaShare (pwPickLib,
       www/post.js), which a browser does not have; here the one call it
       makes is answered with this file, as the picker would. */
    if (s.pick) {
      const b64 = fs.readFileSync(path.join(ROOT, s.pick)).toString('base64');
      await pg.evaluate((b) => {
        window.sharePlug = function () {
          return function () { return Promise.resolve({ b64s: [b] }); };
        };
      }, b64);
    }
    if (s.card !== undefined) await pg.evaluate(([src, t]) => window.__vCard(src, t),
                                                [s.card < 0 ? null : CARDS[s.card], s.cardTitle]);
    if (s.tap) {
      const b = await boxOf(pg, s.tap, s.nth);
      const x = b.x + (s.dx === undefined ? b.width / 2 : s.dx), y = b.y + (s.dy === undefined ? b.height / 2 : s.dy);
      await pg.evaluate(({ x, y }) => window.__vDot(x, y), { x, y });
      await nap(pg, 220);
      if (taps) taps.push(Date.now());
      await pg.mouse.click(x, y);
      /* pop: the press opens the app's own question and the next step
         answers it, so it is left standing */
      if (!s.pop) await unpop(pg);
    }
    if (s.type !== undefined) {
      if (s.into) {
        const b = await boxOf(pg, s.into);
        await pg.evaluate(({ x, y }) => window.__vDot(x, y), { x: b.x + b.width / 2, y: b.y + b.height / 2 });
        if (taps) taps.push(Date.now());
        await pg.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
        await nap(pg, 300);
      }
      /* lingua: typed the way the Lingua keyboard types -- each letter's
         private use code point (ltPuaOrder(), www/glyph.js), which is what
         a post's ink is cut from. A roman letter with no shape stays roman. */
      const txt = s.lingua ? await pg.evaluate((str) => {
        var o = ltPuaOrder();
        return str.split('').map(function (c) {
          for (var i = 0; i < o.length; i++) if (ltName(o[i]) === c) return ltPua(i);
          return c;
        }).join('');
      }, s.type) : s.type;
      for (const ch of txt) {
        if (s.lingua) await pg.keyboard.insertText(ch); else await pg.keyboard.type(ch);
        if (taps && ch !== ' ') taps.push(Date.now());
        await nap(pg, s.delay || 110);
      }
    }
    /* A stroke: points 0..1 inside the thing named, drawn with the circle
       following, at about the speed a finger moves. */
    if (s.draw) {
      const b = await boxOf(pg, s.on || 'canvas');
      for (const line of s.draw) {
        const pts = line.map(([u, v]) => [b.x + u * b.width, b.y + v * b.height]);
        await pg.mouse.move(pts[0][0], pts[0][1]);
        await pg.evaluate(([x, y]) => window.__vMove(x, y), pts[0]);
        await pg.mouse.down();
        for (let i = 1; i < pts.length; i++) {
          const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
          const n = Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y0) / 7));
          for (let k = 1; k <= n; k++) {
            const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n;
            await pg.mouse.move(x, y);
            await pg.evaluate(([x, y]) => window.__vMove(x, y), [x, y]);
            await nap(pg, 14);
          }
        }
        await pg.mouse.up();
        await pg.evaluate(() => window.__vLift());
        await nap(pg, s.gap || 260);
      }
    }
    if (s.scroll) { await pg.mouse.wheel(0, s.scroll); }
    await nap(pg, s.wait === undefined ? 500 : s.wait);
    if (s.log) console.log('log', JSON.stringify(await pg.evaluate(s.log)));
    /* still: a picture of the app as it stands, the caption and the finger
       taken off, at the frame's own pixels (never fullPage, so every still
       is the same size). Only on the --stills run; the film ignores it. */
    if (s.still && stills) {
      await pg.evaluate(() => { document.getElementById('__v').style.display = 'none'; });
      fs.mkdirSync(FRAME.out, { recursive: true });
      await pg.screenshot({ path: path.join(FRAME.out, s.still + '.png') });
      await pg.evaluate(() => { document.getElementById('__v').style.display = ''; });
      console.log('still ' + path.relative(ROOT, path.join(FRAME.out, s.still + '.png')));
    }
  }
}

/* ---- --probe: what is on a route, so a script can be written ------------- */
async function doProbe(br, spec) {
  const { ctx, pg } = await open(br);
  await inkAll(pg);
  /* `route>tap>tap`: arrive on the route, then press each target the way a
     script does, so the screens reached by a press can be read too. */
  let sp = spec;
  if (sp.startsWith('@')) { const e = sp.indexOf('@', 1); await pg.evaluate(sp.slice(1, e)); sp = sp.slice(e + 1); }
  const [head, ...presses] = sp.split('>');
  const ci = head.indexOf(':');
  await run(pg, [{ go: ci < 0 ? head : head.slice(0, ci), a: ci < 0 ? undefined : head.slice(ci + 1), wait: 300 }]
    .concat(presses.map((t) => (t.startsWith('js:') ? { eval: t.slice(3) + ';render()', wait: 600 } : { tap: t, wait: 600 }))));
  const list = await pg.evaluate(() => Array.from(document.querySelectorAll('#app [data-do], .bar [data-do], [data-do]'))
    .filter((e) => e.getBoundingClientRect().width > 0)
    .map((e) => { const r = e.getBoundingClientRect();
      return `${e.getAttribute('data-do')}  ${e.getAttribute('data-a') || ''}  "${(e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 40)}"  @${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`; }));
  console.log([...new Set(list)].join('\n'));
  fs.mkdirSync(OUT, { recursive: true });
  await pg.screenshot({ path: path.join(OUT, 'probe-' + spec.replace(/[^a-z0-9]+/gi, '-') + '.png') });
  await ctx.close();
}

/* ---- film one script ----------------------------------------------------- */
async function film(br, ff, name, sc, stillsOnly) {
  FRAME = frameOf(sc);
  SLOW = 1;
  await takeCards(br, sc);
  const { ctx, pg } = await open(br);
  await inkAll(pg, sc.blank);
  if (sc.setup) await run(pg, sc.setup.map((s) => Object.assign({ wait: 0 }, s)));
  await pg.waitForTimeout(300);
  if (stillsOnly) { await run(pg, sc.steps, null, true); await ctx.close(); return; }
  const cdp = await ctx.newCDPSession(pg);
  const frames = [];
  cdp.on('Page.screencastFrame', (f) => {
    frames.push({ t: f.metadata.timestamp, w: Date.now(), d: Buffer.from(f.data, 'base64') });
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  /* hq: the screencast sends frames at the page's own CSS pixels (393 wide
     here) whatever the scale, and the film was that picture blown up 2.75x
     「画質悪い」 OWNER 2026-09-30. So an hq film takes the page as a
     screenshot clipped at the FILM's width (a clip's `scale` is the only
     thing that makes CDP hand back more than CSS pixels), four asked at once
     because one at a time is about 15 a second and four overlap to about
     28, and each is stamped with the moment it was asked for. */
  let grabbing = false, grab = null;
  if (sc.hq) {
    grabbing = true;
    const clip = { x: 0, y: 0, width: FRAME.w, height: FRAME.h, scale: FRAME.size[0] / FRAME.w };
    /* A clip is in the DOCUMENT's pixels, not the screen's, so a page
       scrolled by a step was filmed from the top of the document -- the
       screen slid down and the caption, which is fixed to the screen, was
       out of the picture. Each frame asks where the screen is. */
    grab = Promise.all([0, 1, 2, 3].map(async () => {
      while (grabbing) {
        const at = Date.now();
        const pos = async () => { const e = await cdp.send('Runtime.evaluate', { expression: 'scrollX+","+scrollY', returnByValue: true }).catch(() => null);
                                  return e && e.result ? e.result.value : null; };
        const p1 = await pos();
        const xy = (p1 || '0,0').split(',');
        let r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 95, optimizeForSpeed: true,
                                                            clip: Object.assign({}, clip, { x: +xy[0], y: +xy[1] }) }).catch(() => null);
        /* and a frame taken while the screen moved under it (a new page
           arriving scrolled back to the top) is the old position's, so it
           is dropped rather than shown for a thirtieth of a second */
        if (!p1 || (await pos()) !== p1) r = null;
        if (r) frames.push({ t: at / 1000, w: at, d: Buffer.from(r.data, 'base64') });
      }
    }));
  } else
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92,
                                           maxWidth: FRAME.size[0], maxHeight: FRAME.size[1], everyNthFrame: 1 });
  /* A screencast only sends a frame when something is painted. A page
     standing still sends nothing, so a steady pulse under everything keeps
     the clock honest: one pixel in a corner, repainted on every frame,
     under the layer and invisible. */
  await pg.evaluate(() => {
    var p = document.createElement('div');
    p.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;z-index:2147483646;pointer-events:none';
    document.body.appendChild(p);
    var n = 0; (function tick(){ n ^= 1; p.style.opacity = n ? '.011' : '.01'; requestAnimationFrame(tick); })();
  });
  SLOW = sc.slow || 1;
  await pg.evaluate((k) => { window.__vK = k; }, SLOW);
  await cdp.send('Animation.enable');
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 / SLOW });
  const t0 = Date.now();
  const taps = [];
  await run(pg, sc.steps, taps);
  await pg.evaluate((i) => window.__vEnd(i), ICON);
  await nap(pg, 2200);
  if (grab) { grabbing = false; await grab; frames.sort((a, b) => a.t - b.t); } else await cdp.send('Page.stopScreencast');
  /* back to the real speed: every moment measured from the first frame and
     divided by SLOW, the taps the same way */
  const T0 = frames[0].t, W0 = frames[0].w;
  frames.forEach((f) => { f.t = T0 + (f.t - T0) / SLOW; });

  /* THE SOUND: a tap on every press and nothing else 「無音でいいか効果音
     だけつけて欲しい。タップ音とか」 OWNER 2026-09-29 -- and a TAP, a short
     knock of filtered noise over a small low thud, not a tone: the falling
     chirp it was 「音キモくね？」「タップっぽい音にして欲しい」 OWNER
     2026-09-30. Made in this browser and RENDERED rather than recorded: an
     OfflineAudioContext as long as the film, each tap put at its moment on
     the frame clock, written out as a WAV. It was recorded live by
     MediaRecorder, and on 2026-09-30 that track came out 46.7s under a film
     of 52.5s -- why was not found; rendering has no clock to fall behind.
     A WAV has to be encoded, which is the mp4 road; the ffmpeg Playwright
     carries has no audio encoder, so a .webm film has no sound. */
  const at = taps.map((w) => (w - W0) / 1000 / SLOW).filter((x) => x >= 0);
  const len = frames[frames.length - 1].t - T0;
  const audio = await pg.evaluate(async ({ at, len }) => {
    const rate = 48000;
    const ac = new OfflineAudioContext(1, Math.ceil((len + 0.5) * rate), rate);
    /* 25ms of noise that dies in about 4ms: the knock */
    const nb = ac.createBuffer(1, 1200, rate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * Math.exp(-i / 190);
    at.forEach((t) => {
      const src = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = nb; bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.9; g.gain.value = 0.55;
      src.connect(bp); bp.connect(g); g.connect(ac.destination); src.start(t);
      /* and the body under it: a low sine that drops and is gone in 35ms */
      const o = ac.createOscillator(), og = ac.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.035);
      og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.35, t + 0.002);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
      o.connect(og); og.connect(ac.destination); o.start(t); o.stop(t + 0.05);
    });
    const d = (await ac.startRendering()).getChannelData(0);
    /* 16-bit mono WAV */
    const b = new DataView(new ArrayBuffer(44 + d.length * 2));
    const str = (o, x) => { for (let i = 0; i < x.length; i++) b.setUint8(o + i, x.charCodeAt(i)); };
    str(0, 'RIFF'); b.setUint32(4, 36 + d.length * 2, true); str(8, 'WAVEfmt ');
    b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true);
    b.setUint32(24, rate, true); b.setUint32(28, rate * 2, true); b.setUint16(32, 2, true); b.setUint16(34, 16, true);
    str(36, 'data'); b.setUint32(40, d.length * 2, true);
    for (let i = 0; i < d.length; i++) b.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 32767, true);
    let bin = ''; const u = new Uint8Array(b.buffer);
    for (let i = 0; i < u.length; i++) bin += String.fromCharCode(u[i]);
    return btoa(bin);
  }, { at, len });
  await ctx.close();
  fs.mkdirSync(FRAME.out, { recursive: true });
  const aFile = path.join(FRAME.out, '.' + name + '.wav');
  fs.writeFileSync(aFile, Buffer.from(audio, 'base64'));

  if (!frames.length) throw new Error('no frames');
  const start = frames[0].t, dur = frames[frames.length - 1].t - start;
  const n = Math.round(dur * FPS);
  const file = path.join(FRAME.out, name + '.' + ff.ext);
  const enc = ff.ext === 'mp4'
    ? ['-c:v', 'libx264', '-preset', 'slow', ...(sc.hq ? ['-crf', '14', '-tune', 'stillimage'] : ['-crf', '21', '-maxrate', '2500k', '-bufsize', '5M']),
       '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-b:a', '128k']
    /* about 1.6 Mbit/s: a screen mostly standing still, and a film of 25s
       comes in under 5MB. */
  : ['-c:v', 'vp8', '-b:v', '1600k', '-maxrate', '2600k', '-bufsize', '4M', '-qmin', '4', '-qmax', '50',
       '-deadline', 'good', '-cpu-used', '2', '-auto-alt-ref', '1', '-lag-in-frames', '16'];
  /* music: a file in promo/music/ laid under the taps from the first frame,
     at a level that leaves the taps on top, and faded over the last two
     seconds so it ends with the end card 「音楽つけられないの？」 OWNER
     2026-09-30. Sound at all is the mp4 road only (above). */
  const mus = ff.ext !== 'mp4' ? ['-map', '0:v'] : sc.music
    ? ['-i', path.join(ROOT, 'promo', 'music', sc.music),
       '-filter_complex', '[2:a]volume=0.4,afade=t=out:st=' + Math.max(0, n / FPS - 2).toFixed(2) + ':d=2[m];' +
                          '[1:a][m]amix=inputs=2:duration=first:normalize=0[a]',
       '-map', '0:v', '-map', '[a]']
    : ['-map', '0:v', '-map', '1:a'];
  const p = spawn(ff.bin, ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', String(FPS),
                           '-i', 'pipe:0',
                           ...(ff.ext === 'mp4' ? ['-i', aFile] : []), ...mus,
                           ...(ff.ext === 'mp4' ? ['-c:a', 'aac'] : []),
                           '-vf', 'scale=' + FRAME.size[0] + ':' + FRAME.size[1] + ',setsar=1', ...enc, file],
                  { stdio: ['pipe', 'inherit', 'inherit'] });
  p.stdin.on('error', () => {});
  let j = 0;
  for (let i = 0; i < n; i++) {
    const t = start + i / FPS;
    while (j + 1 < frames.length && frames[j + 1].t <= t) j++;
    if (!p.stdin.write(frames[j].d)) await new Promise((r) => p.stdin.once('drain', r));
  }
  p.stdin.end();
  await new Promise((r, x) => p.on('close', (c) => (c === 0 ? r() : x(new Error('ffmpeg ' + c)))));
  fs.unlinkSync(aFile);
  const mb = fs.statSync(file).size / 1048576;
  console.log(`${path.relative(ROOT, file)}  ${(n / FPS).toFixed(1)}s  ${mb.toFixed(2)}MB  (${frames.length} painted frames, filmed in ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}

const br = await chromium.launch(LAUNCH);
try {
  if (probe) { for (const s of named) await doProbe(br, s); }
  else {
    const ff = pickFF();
    if (!ff) throw new Error('no ffmpeg found (FFMPEG=/path/to/ffmpeg, or ffmpeg on PATH)');
    const which = argv.indexOf('--all') >= 0 ? Object.keys(SCRIPTS) : named;
    if (!which.length) console.error('which? ' + Object.keys(SCRIPTS).join(' '));
    for (const k of which) {
      if (!SCRIPTS[k]) { console.error(`no script called ${k}`); continue; }
      await film(br, ff, k, SCRIPTS[k], argv.indexOf('--stills') >= 0);
    }
  }
} finally {
  await br.close();
  srv.close();
}
