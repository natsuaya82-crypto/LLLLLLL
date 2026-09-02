/* ---------------------------------------------------------------------------
   tools/pv.mjs — the film. A minute of Lingua, as one mp4.

   Run it:  node tools/pv.mjs                  16:9,  1920x1080
            node tools/pv.mjs --portrait       9:16,  1080x1920
            node tools/pv.mjs --portrait --w 886 --h 1920    another size
            node tools/pv.mjs --cut type       the typing film, 9:16, 18.6s
            node tools/pv.mjs --scene draw     one scene, for looking at
            node tools/pv.mjs --stills         no encode; one frame per second

   NOT a gate, and nothing under www/ knows this file exists. It is a camera
   pointed at the app: the screen in the middle of the frame is an iframe of
   the real index.html, running its own code, at a real phone's size. Nothing
   is a mock-up and nothing is drawn twice -- if a screen changes, the film
   changes with it the next time this is run.

   HOW IT IS SHOT. Not screen capture: a frame at a time. For each of the
   1800 frames the film is made of, the state of the app and of everything
   around it is computed for that instant, and then the whole stage is
   photographed. So the motion is exact, it is the same every run, and every
   frame is a real screenshot at full resolution rather than a video codec's
   guess at one. It costs about two minutes of wall clock for a minute of
   film.

   ffmpeg: the one bundled with playwright can only write VP8/webm, so an mp4
   needs a real one. PV_FFMPEG=/path/to/ffmpeg, or `npm i ffmpeg-static` in a
   scratch directory and point at that. Without either it writes webm and
   says so.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { chromium, LAUNCH } from './browser.mjs';
import { seedFilm } from './pv/seed.mjs';
import { SCENES, WALL_ROUTES } from './pv/scenes.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const WWW = path.join(ROOT, 'www');
const OUT = path.join(ROOT, 'pv');
const PORT = 8131;
const FPS = 30;
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
               '.mjs':'text/javascript', '.png':'image/png', '.svg':'image/svg+xml' };

const argv = process.argv.slice(2);
const has = (f) => argv.indexOf(f) >= 0;
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i+1] : d; };
/* --cut type: the third film, about typing. Portrait, because it is for the
   same place the vertical one goes. */
const cut = val('--cut', '');
const portrait = has('--portrait') || cut === 'type';
const stills = has('--stills');
const only = val('--scene', '');
/* The length of one bar of the track the film is cut to. Every shot is a
   whole number of these (tools/pv/scenes.mjs), so no cut lands between two
   beats. Measured off the track, not guessed: 142 bpm is 1.690s. */
const BAR = Number(val('--bar', '1.690'));
/* --vo: the cut for a version with a voice on it. The small sentence under
   each headline comes off, because a voice saying one thing while a line of
   type says another and a third line explains both is three things to read
   at once. The headline stays: it is what the eye lands on. */
const VO = has('--vo');
/* The App Store takes a preview at the size it asks for and refuses anything
   else, and the number it asks for depends on the device family and changes.
   So the frame is an argument: --w 886 --h 1920. */
const W = Number(val('--w', portrait ? '1080' : '1920'));
const H = Number(val('--h', portrait ? '1920' : '1080'));

/* ---- the little web server the app is served from ------------------------ */
const srv = http.createServer((q, r) => {
  const u = q.url.split('?')[0];
  /* The app's own icon, read out of the iOS target rather than copied into
     the repo a second time: the mark on the last card has to be the mark on
     the home screen, and two copies of it is one that goes stale.
     The stage itself lives in tools/, not in www/ -- www/ is what ships to a
     phone and assets-check holds every file in it to being in index.html. */
  const f = u === '/pv/icon.png'
          ? path.join(ROOT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png')
          : u.indexOf('/pv/') === 0 ? path.join(HERE, u.slice(1))
          : path.join(WWW, u === '/' ? 'index.html' : u);
  let body;
  try { body = fs.readFileSync(f); } catch (e) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain',
                     'Cache-Control': 'no-store' });
  r.end(body);
}).listen(PORT);

function findFfmpeg(){
  if (process.env.PV_FFMPEG && fs.existsSync(process.env.PV_FFMPEG))
    return { bin: process.env.PV_FFMPEG, mp4: true };
  const req = createRequire(import.meta.url);
  try {
    const b = req('ffmpeg-static');
    if (b && fs.existsSync(b)) return { bin: b, mp4: true };
  } catch (e) {}
  for (const p of ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg'])
    if (fs.existsSync(p)) return { bin: p, mp4: true };
  const pw = '/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux';
  if (fs.existsSync(pw)) return { bin: pw, mp4: false };
  return null;
}

/* ---- the browser --------------------------------------------------------- */
const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport: { width: W, height: H },
                              deviceScaleFactor: 1 });
await pg.goto(`http://localhost:${PORT}/pv/stage.html`);
if (portrait) await pg.evaluate(() => document.body.className = 'tall');
const ifr = await pg.$('#ph');
const app = await ifr.contentFrame();
await app.waitForSelector('#splash', { state: 'detached', timeout: 20000 });
/* Both faces have to be here before a frame is taken, or the first seconds of
   the film are Georgia. */
await pg.evaluate(() => document.fonts.ready);
await app.evaluate(() => document.fonts.ready);

const drawn = await seedFilm(app);
console.log('  letters drawn: ' + drawn);
await pg.waitForTimeout(400);

/* ---- the wall -----------------------------------------------------------
   Nine screens of the app, photographed once, here, and moved as pictures
   afterwards. One iframe cannot be in nine places at once. */
const tiles = [];
for (const r of WALL_ROUTES){
  await app.evaluate(function(arg){
    go(arg.r, arg.a === null ? undefined : arg.a); render();
    window.scrollTo(0, arg.y || 0);
  }, { r: r.r, a: r.a === undefined ? null : r.a, y: r.y || 0 });
  await pg.waitForTimeout(180);
  const buf = await ifr.screenshot({ type: 'jpeg', quality: 88 });
  tiles.push('data:image/jpeg;base64,' + buf.toString('base64'));
}
await pg.evaluate((srcs) => {
  const w = document.getElementById('wall');
  w.innerHTML = srcs.map(function(s){
    return '<div class="tile"><img src="' + s + '"></div>';
  }).join('');
}, tiles);
console.log('  wall: ' + tiles.length + ' screens');

/* ---- the stage's own handles --------------------------------------------- */
const stage = {
  set: (o) => pg.evaluate((o) => {
    const q = (id) => document.getElementById(id);
    if (o.phone){
      const p = o.phone;
      q('stagePhone').style.transform =
        'translate(' + p.x + 'px,' + p.y + 'px) scale(' + p.s + ')';
      q('stagePhone').style.opacity = p.o === undefined ? 1 : p.o;
      /* A fast move is blurred. It is the one thing that makes a camera move
         read as a camera move rather than as a jump, and it costs one filter.
         The radius and the device frame go as the picture passes into the
         screen. */
      q('stagePhone').style.filter = p.blur ? 'blur(' + p.blur.toFixed(2) + 'px)' : 'none';
      const sh = p.shell === undefined ? (p.s > 1.4 ? 0 : 1) : p.shell;
      q('shell').style.opacity = sh;
      const rad = p.radius === undefined ? (p.s > 1.4 ? 0 : 46) : p.radius;
      q('screen').style.borderRadius = rad + 'px';
    }
    if (o.type){
      const T = o.type, head = q('head');
      /* The text is rebuilt only when it CHANGES. Thirty times a second it
         would throw away the elements whose transforms are the animation. */
      if (T.key !== undefined && head.dataset.k !== T.key){
        head.dataset.k = T.key;
        head.innerHTML = (T.head || []).map(function(s){
          return '<span class="ln"><i>' + s + '</i></span>';
        }).join('');
        q('kicker').textContent = T.kicker || '';
        q('sub').innerHTML = T.sub || '';
      }
      q('type').style.transform = 'translateY(calc(-50% + ' + (T.top || 0) + 'px))';
      /* 9:16 pins the words to the bottom of the frame, which is where a
         caption goes -- except in the one shot with a keyboard standing
         there. `lift` raises them off the floor for that shot and for no
         other; in 16:9 the words are beside the phone and there is no floor
         to lift them off. */
      if (document.body.classList.contains('tall'))
        q('type').style.bottom = (150 + (T.lift || 0)) + 'px';
      q('kicker').style.opacity = T.ko;
      q('kicker').style.transform = 'translateY(' + T.ky + 'px)';
      const ln = head.querySelectorAll('.ln i');
      for (let i = 0; i < ln.length; i++){
        ln[i].style.opacity = T.lo[i] === undefined ? T.lo[T.lo.length-1] : T.lo[i];
        ln[i].style.transform = 'translateY(' + (T.ly[i] === undefined ? 0 : T.ly[i]) + 'px)';
      }
      q('sub').style.opacity = T.so;
      q('sub').style.transform = 'translateY(' + T.sy + 'px)';
    }
    if (o.wall){
      const w = o.wall, el = document.getElementById('wall');
      el.style.opacity = w.o;
      el.style.transform = 'translate(' + (w.x || 0) + 'px,' + (w.y || 0) + 'px) scale(' + (w.s || 1) + ')';
      if (w.tiles){
        const ts = el.querySelectorAll('.tile');
        for (let i = 0; i < ts.length; i++){
          const t = w.tiles[i];
          if (!t){ ts[i].style.opacity = 0; continue; }
          ts[i].style.opacity = t.o;
          ts[i].style.transform =
            'translate(' + t.x + 'px,' + t.y + 'px) scale(' + (t.s || 1) + ')';
        }
      }
    }
    if (o.card){
      q('card').style.opacity = o.card.o;
      if (o.card.tag !== undefined) q('tag').textContent = o.card.tag;
      if (o.card.foot !== undefined) q('foot').textContent = o.card.foot;
      if (o.card.rule !== undefined) q('rule').style.width = o.card.rule + 'px';
      if (o.card.mark !== undefined)
        q('mark').style.transform = 'scale(' + o.card.mark + ')';
    }
    if (o.wash !== undefined) q('wash').style.opacity = o.wash;
    /* The ground the words stand on, in 9:16. It darkens the bottom half of
       the frame, which is exactly where a keyboard stands -- so the shot
       with one in it turns the fade off and puts the words higher up
       instead. */
    if (o.fade !== undefined) q('topfade').style.opacity = o.fade;
    if (o.tap){
      q('tap').style.opacity = o.tap.o;
      q('tap').style.left = o.tap.x + 'px';
      q('tap').style.top = o.tap.y + 'px';
      q('tap').style.transform = 'scale(' + (o.tap.s === undefined ? 1 : o.tap.s) + ')';
    }
  }, o),
  /* Anything that has to happen inside the app itself. The function is sent
     as source, so it closes over nothing here -- every name in it is one of
     the app's own globals. */
  app: (fn, arg) => app.evaluate('(' + fn.toString() + ')(' +
        JSON.stringify(arg === undefined ? null : arg) + ')'),
};

/* ---- the film ------------------------------------------------------------ */
const film = SCENES({ W, H, portrait, bar: BAR, vo: VO, cut });
const list = only ? film.filter((s) => s.name === only) : film;
if (!list.length){ console.error('no scene called ' + only); process.exit(2); }

const dir = path.join(OUT, 'frames');
fs.mkdirSync(OUT, { recursive: true });
if (stills){ fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); }

/* Straight into ffmpeg. 1800 frames of 1920x1080 is most of a gigabyte on
   disk and every byte of it would be written once and read once. */
const ff = stills ? null : findFfmpeg();
if (!stills && !ff){ console.error('no ffmpeg. PV_FFMPEG=/path/to/ffmpeg'); process.exit(2); }
const shape = portrait ? '9x16' : '16x9';
const size = (W === (portrait ? 1080 : 1920) && H === (portrait ? 1920 : 1080))
           ? '' : '-' + W + 'x' + H;
const out = path.join(OUT, 'lingua-' + (cut ? cut + '-' : '') + shape + size +
                      (VO ? '-vo' : '') + (ff && ff.mp4 ? '.mp4' : '.webm'));
let enc = null;
if (ff){
  /* A silent audio track goes on it. There is no sound in the film, and a
     file with no audio stream at all is refused or re-encoded by several of
     the places this will be uploaded to. */
  const args = ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
                '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-shortest']
    .concat(ff.mp4
      ? ['-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
         '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out]
      : ['-c:v', 'libvpx', '-b:v', '6M', '-c:a', 'libvorbis', out]);
  enc = spawn(ff.bin, args, { stdio: ['pipe', 'ignore', 'pipe'] });
  enc.stderr.on('data', () => {});
}
const feed = (buf) => new Promise((res) => {
  if (enc.stdin.write(buf)) res(); else enc.stdin.once('drain', res);
});

let n = 0, clock = 0;
const t0 = Date.now();
for (const sc of list){
  process.stdout.write('  ' + sc.name + ' (' + sc.secs.toFixed(2) + 's) ');
  if (sc.enter) await sc.enter(stage);
  /* Frame counts are taken from where the shot ENDS on the clock, not from
     its own length: rounding each shot on its own would drift, and half a
     frame of drift fourteen times is half a beat by the end. */
  const f0 = Math.round(clock * FPS);
  clock += sc.secs;
  const frames = Math.round(clock * FPS) - f0;
  for (let i = 0; i < frames; i++){
    const k = i / frames;                 /* 0..1 through this scene */
    if (sc.at) await sc.at(stage, k, i / FPS);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 95 });
    if (stills){
      if (i % FPS === 0)
        fs.writeFileSync(path.join(dir, sc.name + '-' + String(Math.round(i/FPS)) + '.jpg'), buf);
    } else {
      await feed(buf);
    }
    n++;
    if (i % 30 === 0) process.stdout.write('.');
  }
  process.stdout.write('\n');
}
console.log(n + ' frames in ' + ((Date.now() - t0) / 1000).toFixed(0) + 's');

await br.close();
srv.close();

if (stills){ console.log('stills in ' + dir); process.exit(0); }

await new Promise((res) => { enc.on('close', res); enc.stdin.end(); });
const mb = (fs.statSync(out).size / 1048576).toFixed(1);
console.log(out + '  ' + W + 'x' + H + '  ' + (n / FPS).toFixed(1) + 's  ' + mb + ' MB');
