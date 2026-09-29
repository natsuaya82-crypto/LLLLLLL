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
const W = 390, SCALE = 1080 / 390, H = Math.round(1920 / SCALE);   /* 693 */
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
    '#__vcap.on{opacity:1}' +
    '.__vdot{position:absolute;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;' +
      'background:rgba(255,255,255,.35);border:3px solid rgba(20,20,30,.55);' +
      'box-shadow:0 0 0 2px rgba(255,255,255,.7);transition:transform .18s,opacity .35s}' +
    '#__vend{position:absolute;inset:0;background:#0d0d12;color:#f3efe6;display:flex;' +
      'flex-direction:column;align-items:center;justify-content:center;opacity:0;transition:opacity .35s}' +
    '#__vend.on{opacity:1}' +
    '#__vend b{font:600 64px/1 var(--face-display,Georgia),Georgia,serif;letter-spacing:.08em}' +
    '#__vend i{font:400 19px/1.4 -apple-system,system-ui,sans-serif;font-style:normal;opacity:.7;margin-top:18px}';
  document.head.appendChild(st);
  var v = document.createElement('div'); v.id = '__v';
  v.innerHTML = '<div id="__vcap"></div><div id="__vend"><b>Lingua</b><i></i></div>';
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
      window.__vUT = setTimeout(function(){ c.classList.remove('dim'); }, 900);
    }
  };
  window.__vDot = function (x, y, keep) {
    window.__vUnder(y);
    var d = document.createElement('div'); d.className = '__vdot';
    d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.transform = 'scale(1.25)';
    document.getElementById('__v').appendChild(d);
    setTimeout(function(){ d.style.transform = 'scale(.9)'; }, 30);
    if (!keep) setTimeout(function(){ d.style.opacity = '0'; }, 420);
    if (!keep) setTimeout(function(){ d.remove(); }, 800);
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
    if (d) { d.style.opacity = '0'; setTimeout(function(){ d.remove(); }, 400); }
  };
  window.__vEnd = function (tag) {
    document.querySelector('#__vend i').textContent = tag || '';
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
  const ctx = await br.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE,
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
  await pg.evaluate(() => { window.netSaveNow = function (done) { if (done) setTimeout(function () { done(true); }, 250); }; });
  /* And a read that gives up says nothing. The requests held above time out
     inside the app after a while and 「No connection」 came up over the last
     seconds of a film. That is the app right about a network that is not
     there, and it is not what the film is about. */
  /* And a post is heard the same way: netPush() (www/net.js) is the one send
     of a post, and here it says the row landed. */
  await pg.evaluate(() => { window.netPush = function (p, ok) { if (ok) setTimeout(function () { ok('v' + Date.now()); }, 350); }; });
  await pg.evaluate(() => { window.netPop = function () { if (typeof netSpin === 'function') netSpin(false); return true; }; });
  return { ctx, pg };
}

async function unpop(pg) {
  for (let i = 0; i < 4; i++) {
    if (!await pg.evaluate(() => typeof popOn === 'function' && popOn())) break;
    await pg.evaluate(() => { if (typeof popOff === 'function') popOff(); });
    await pg.waitForTimeout(260);
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

async function run(pg, steps, taps) {
  for (const s of steps) {
    if (s.cap !== undefined) await pg.evaluate(([c, y]) => window.__vCap(c, y), [s.cap, s.capAt]);
    if (s.go) {
      await pg.evaluate(({ r, a }) => { go(r, a); render(); }, { r: s.go, a: s.a });
      await unpop(pg);
    }
    if (s.eval) await pg.evaluate(s.eval);
    if (s.tap) {
      const b = await boxOf(pg, s.tap, s.nth);
      const x = b.x + (s.dx === undefined ? b.width / 2 : s.dx), y = b.y + (s.dy === undefined ? b.height / 2 : s.dy);
      await pg.evaluate(({ x, y }) => window.__vDot(x, y), { x, y });
      await pg.waitForTimeout(220);
      if (taps) taps.push(Date.now());
      await pg.mouse.click(x, y);
      await unpop(pg);
    }
    if (s.type !== undefined) {
      if (s.into) {
        const b = await boxOf(pg, s.into);
        await pg.evaluate(({ x, y }) => window.__vDot(x, y), { x: b.x + b.width / 2, y: b.y + b.height / 2 });
        if (taps) taps.push(Date.now());
        await pg.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
        await pg.waitForTimeout(300);
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
        await pg.waitForTimeout(s.delay || 110);
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
            await pg.waitForTimeout(14);
          }
        }
        await pg.mouse.up();
        await pg.evaluate(() => window.__vLift());
        await pg.waitForTimeout(s.gap || 260);
      }
    }
    if (s.scroll) { await pg.mouse.wheel(0, s.scroll); }
    if (s.end !== undefined) await pg.evaluate((t) => window.__vEnd(t), s.end);
    await pg.waitForTimeout(s.wait === undefined ? 500 : s.wait);
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
    .concat(presses.map((t) => ({ tap: t, wait: 600 }))));
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
async function film(br, ff, name, sc) {
  const { ctx, pg } = await open(br);
  await inkAll(pg, sc.blank);
  if (sc.setup) await run(pg, sc.setup.map((s) => Object.assign({ wait: 0 }, s)));
  await pg.waitForTimeout(300);
  const cdp = await ctx.newCDPSession(pg);
  const frames = [];
  cdp.on('Page.screencastFrame', (f) => {
    frames.push({ t: f.metadata.timestamp, w: Date.now(), d: Buffer.from(f.data, 'base64') });
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92,
                                           maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });
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
  const t0 = Date.now();
  const taps = [];
  await run(pg, sc.steps, taps);
  await pg.evaluate((t) => window.__vEnd(t), sc.endLine || 'Make your own language');
  await pg.waitForTimeout(2200);
  await cdp.send('Page.stopScreencast');

  /* THE SOUND: a soft tap on every press and nothing else 「無音でいいか効果音
     だけつけて欲しい。タップ音とか」 OWNER 2026-09-29. Made in this browser
     (Web Audio, recorded by MediaRecorder as Opus), because the ffmpeg here
     has no audio encoder; it only has to copy the stream in. The moment of
     each tap is taken against the frame clock the film is laid on. */
  const fw0 = frames[0].w, ft0 = frames[0].t;
  const at = taps.map((w) => (w - fw0) / 1000).filter((x) => x >= 0);
  const len = frames[frames.length - 1].t - ft0;
  const audio = await pg.evaluate(async ({ at, len }) => {
    const ac = new AudioContext({ sampleRate: 48000 });
    const dst = ac.createMediaStreamDestination();
    const t0 = ac.currentTime + 0.3;
    at.forEach((t) => {
      const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
      o.type = 'triangle'; o.frequency.setValueAtTime(1500, t0 + t); o.frequency.exponentialRampToValueAtTime(700, t0 + t + 0.05);
      f.type = 'lowpass'; f.frequency.value = 3200;
      g.gain.setValueAtTime(0.0001, t0 + t); g.gain.exponentialRampToValueAtTime(0.5, t0 + t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + t + 0.07);
      o.connect(f); f.connect(g); g.connect(dst); o.start(t0 + t); o.stop(t0 + t + 0.09);
    });
    const rec = new MediaRecorder(dst.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 96000 });
    const parts = [];
    rec.ondataavailable = (e) => parts.push(e.data);
    const done = new Promise((r) => (rec.onstop = r));
    /* started 0.3s before t0 so the recording's zero is t0 - 0.3 */
    rec.start();
    await new Promise((r) => setTimeout(r, (len + 0.6) * 1000));
    rec.stop(); await done;
    const buf = await new Blob(parts).arrayBuffer();
    let bin = ''; const u = new Uint8Array(buf);
    for (let i = 0; i < u.length; i++) bin += String.fromCharCode(u[i]);
    return btoa(bin);
  }, { at, len });
  await ctx.close();
  fs.mkdirSync(OUT, { recursive: true });
  const aFile = path.join(OUT, '.' + name + '.opus.webm');
  fs.writeFileSync(aFile, Buffer.from(audio, 'base64'));

  if (!frames.length) throw new Error('no frames');
  const start = frames[0].t, dur = frames[frames.length - 1].t - start;
  const n = Math.round(dur * FPS);
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, name + '.' + ff.ext);
  const enc = ff.ext === 'mp4'
    ? ['-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
    /* about 1.6 Mbit/s: a screen mostly standing still, and a film of 25s
       comes in under 5MB. */
  : ['-c:v', 'vp8', '-b:v', '1600k', '-maxrate', '2600k', '-bufsize', '4M', '-qmin', '4', '-qmax', '50',
       '-deadline', 'good', '-cpu-used', '2', '-auto-alt-ref', '1', '-lag-in-frames', '16'];
  const p = spawn(ff.bin, ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', String(FPS),
                           '-i', 'pipe:0', '-itsoffset', '-0.3', '-i', aFile, '-map', '0:v', '-map', '1:a',
                           '-c:a', ff.ext === 'mp4' ? 'aac' : 'copy',
                           '-vf', 'scale=1080:1920', '-aspect', '9:16', ...enc, file],
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
      await film(br, ff, k, SCRIPTS[k]);
    }
  }
} finally {
  await br.close();
  srv.close();
}
