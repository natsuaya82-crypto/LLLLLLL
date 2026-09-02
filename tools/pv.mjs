/* ---------------------------------------------------------------------------
   tools/pv.mjs — the film. A minute of Lingua, as one mp4.

   Run it:  node tools/pv.mjs                  16:9,  1920x1080
            node tools/pv.mjs --portrait       9:16,  1080x1920
            node tools/pv.mjs --scene draw     one scene, for looking at
            node tools/pv.mjs --stills         no encode; one png per second

   NOT a gate, and nothing under www/ knows this file exists. It is a camera
   pointed at the app: the phone in the middle of the frame is an iframe of
   the real index.html, running its own code, at a real phone's size. Nothing
   is a mock-up and nothing is drawn twice -- if a screen changes, the film
   changes with it the next time this is run.

   HOW IT IS SHOT. Not screen capture: a frame at a time. For each of the
   1800 frames the film is made of, the state of the app and of the words
   beside it is computed for that instant, then the whole 1920x1080 stage is
   photographed. So the motion is exact, it is the same every run, and every
   frame is a real screenshot at full resolution rather than a video codec's
   guess at one. It costs about a minute of wall clock per minute of film.

   ffmpeg: the one bundled with playwright can only write VP8/webm, so an
   mp4 needs a real one. PV_FFMPEG=/path/to/ffmpeg, or `npm i ffmpeg-static`
   in a scratch directory and point at that. Without either it writes webm
   and says so.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execFileSync, spawn } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { seed } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';
import { PV_STROKES, PV_WORDS, PV_SND } from './pv/lang.mjs';
import { SCENES } from './pv/scenes.mjs';

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
const portrait = has('--portrait');
const stills = has('--stills');
const only = val('--scene', '');
const W = portrait ? 1080 : 1920;
const H = portrait ? 1920 : 1080;

/* ---- the little web server the app is served from ------------------------ */
const srv = http.createServer((q, r) => {
  const u = q.url.split('?')[0];
  /* The stage lives in tools/, not in www/ -- www/ is what ships to a phone
     and assets-check holds every file in it to being in index.html. Same
     origin, so the film can reach into the app's own globals. */
  /* The app's own icon, read out of the iOS target rather than copied into
     the repo a second time: the mark on the last card has to be the mark on
     the home screen, and two copies of it is one that goes stale. */
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

/* ---- ffmpeg -------------------------------------------------------------- */
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
const ifr = await pg.$('#ph');
const app = await ifr.contentFrame();
await app.waitForSelector('#splash', { state: 'detached', timeout: 20000 });
/* Both faces have to be here before a frame is taken, or the first seconds of
   the film are Georgia. */
await pg.evaluate(() => document.fonts.ready);
await app.evaluate(() => document.fonts.ready);

/* The app is filled with one made-up language, the same one every run --
   tools/pv/lang.mjs. It is not tools/fixture.mjs's: that one is three letters
   and a triangle, which is right for a check and is not a language anybody
   would want to see. The fixture is run FIRST all the same, because it is the
   one place that knows what a whole app-state looks like, and then the film's
   own language is laid over it. */
await app.evaluate('window.__seed = ' + seed.toString());
await app.evaluate(({ s, st, wds, snd }) => {
  eval('(' + s + ')()');
  SET.done = true; SET.theme = 'dark'; SET.ui = 'en';
  /* FREE. Not because the film is being modest -- because the free plan is
     what the free plan is: your own shapes for a-z and 0-9, and a QWERTY
     wearing them. Every screen in the film is one anybody gets. */
  SET.plan = 'free';
  langName = 'Shango';
  SND = snd;

  /* A word was made on a day. tools/fixture.mjs numbers them 1..20 because a
     check only ever asks which came first; a film shows the date on the
     screen, and 1970-01-01 is what a 1 means. */
  var day = 86400000, now = Date.now(), i, w;
  WORDS = wds;
  for (i = 0; i < WORDS.length; i++){
    w = WORDS[i];
    w.at = now - (21 - w.at) * day * 3;
    w.up = w.at + day;
  }

  /* The letters are the app's OWN -- ltStart() made them, on the free plan,
     the way a phone does -- and what the film adds is the drawing on each.
     Replacing LETTERS wholesale would be the film inventing a shape of data
     the app never makes. What IS dropped is the check fixture's own three
     placeholder letters: a chevron that reads nothing and a borrowed Greek
     character are stage dressing from a different job, and the film is a
     photograph of somebody's finished alphabet. */
  var l, k, kept = [], n = 0;
  for (i = 0; i < LETTERS.length; i++){
    l = LETTERS[i];
    k = (typeof numIsDigit === 'function' && numIsDigit(l)) ? '#' + l.val
                                                           : String(ltName(l) || '');
    if (!st[k]) continue;
    /* ltIsBase() -- which is what the free plan counts its own thirty-eight
       slots by -- reads `ab`, the roman character the letter was made from,
       and the check fixture's letters have none: they were written out by
       hand rather than made by ltStart(). Three of them were therefore over
       the free allotment and the alphabet carried a "3 hidden / Upgrade"
       banner in the middle of the film. Giving them the character they are
       already named after is what makes them the ordinary a-z they look
       like. */
    if (!l.ab && !numIsDigit(l)) l.ab = k;
    l.st = JSON.parse(JSON.stringify(st[k]));
    /* a letter that was borrowing a character has its own shape now */
    if (l.ch) l.ch = '';
    kept.push(l); n++;
  }
  LETTERS = kept;
  window.__pvDrawn = n;

  /* Nobody's alphabet has c, q and x all reading /k/. ltStart() gives every
     roman letter the sound it is usually written with, which is right on the
     day it runs and is not what somebody's language looks like a month
     later -- and the app says so on screen, in red, which in a film reads as
     an error rather than as a thing to get round to. */
  var say = { c:['t\u0283'], q:['q'], x:['\u0283'], y:['y'] };
  for (i = 0; i < LETTERS.length; i++){
    k = String(ltName(LETTERS[i]) || '');
    if (say[k]) LETTERS[i].snd = say[k];
  }

  saveLetters(); save();

  /* A photograph on a post. The fixture's is three grey rectangles, which is
     the right picture for "is there an image here" and the wrong one for a
     film. Drawn rather than pasted in as base64, at the size and quality a
     real post carries. */
  function pic(){
    var c = document.createElement('canvas'), w = 1200, h = 800;
    c.width = w; c.height = h;
    var x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1b2740'); g.addColorStop(0.55, '#4a4258');
    g.addColorStop(0.78, '#9c7a55'); g.addColorStop(1, '#d8a86a');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,238,205,.85)';
    x.beginPath(); x.arc(w*0.72, h*0.60, 26, 0, 7); x.fill();
    var far = ['#2c3347', '#232a3c', '#191e2c'], j;
    for (j = 0; j < 3; j++){
      x.fillStyle = far[j];
      x.beginPath();
      x.moveTo(-40, h);
      var px = -40, py = h * (0.70 + j * 0.07);
      var seed = 7 + j * 13;
      while (px < w + 40){
        var up = ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) % 1000) / 1000;
        var run = 90 + up * 150;
        py += (up - 0.45) * (j ? 70 : 130);
        py = Math.max(h * (0.30 + j * 0.12), Math.min(h * (0.80 + j * 0.05), py));
        px += run;
        x.lineTo(px, py);
      }
      x.lineTo(w + 40, h); x.closePath(); x.fill();
    }
    return c.toDataURL('image/jpeg', typeof POST_PICQ === 'number' ? POST_PICQ : 0.72);
  }

  /* and the timeline cut into these letters, because a post carries its ink
     and this phone's ink was cut before there was anything to cut */
  var p;
  for (i = 0; i < POSTS.length; i++){
    p = POSTS[i];
    if (p.mine){
      delete p.ink;
      /* her face is a letter of her own alphabet, which is what a face on
         this timeline is */
      p.av = { st: JSON.parse(JSON.stringify(st['o'])) };
      if (p.pic) p.pic = pic();
    }
  }
  if (typeof migratePostInk === 'function') migratePostInk();
  ME.av = { st: JSON.parse(JSON.stringify(st['o'])) };

  SET.myfont = true;
  if (typeof applyTheme === 'function') applyTheme();
  if (typeof installScriptFont === 'function') installScriptFont();
  /* The face the Lingua keyboard types INTO a field -- the private use area,
     one code point per drawn letter. Without it the composer in the film
     would show roman where a phone shows the letters somebody drew. */
  if (typeof installTypeFont === 'function') installTypeFont();
  if (typeof render === 'function') render();
}, { s: seed.toString(), st: PV_STROKES, wds: PV_WORDS, snd: PV_SND });
console.log('  letters drawn: ' + await app.evaluate(() => window.__pvDrawn));
await pg.waitForTimeout(400);

/* ---- the stage's own handles --------------------------------------------- */
const stage = {
  set: (o) => pg.evaluate((o) => {
    const q = (id) => document.getElementById(id);
    if (o.phone){
      const p = o.phone;
      q('stagePhone').style.transform =
        'translate(' + p.x + 'px,' + p.y + 'px) scale(' + p.s + ')' +
        (p.rot ? ' rotate(' + p.rot + 'deg)' : '');
      q('stagePhone').style.opacity = p.o === undefined ? 1 : p.o;
      /* Past this the device frame is out of the picture anyway; what is
         left of it would be two vertical edges and no top, so it goes. */
      q('stagePhone').className = p.s > 1.4 ? 'zoom' : '';
    }
    if (o.type){
      const y = o.type.y === undefined ? 0 : o.type.y;
      q('type').style.opacity = o.type.o;
      q('type').style.transform =
        'translateY(calc(-50% + ' + (y + (o.type.top || 0)) + 'px))';
      if (o.type.kicker !== undefined) q('kicker').textContent = o.type.kicker;
      if (o.type.head !== undefined) q('head').innerHTML = o.type.head;
      if (o.type.sub !== undefined) q('sub').innerHTML = o.type.sub;
    }
    if (o.card){
      q('card').style.opacity = o.card.o;
      if (o.card.tag !== undefined) q('tag').textContent = o.card.tag;
      if (o.card.foot !== undefined) q('foot').textContent = o.card.foot;
      if (o.card.rule !== undefined) q('rule').style.width = o.card.rule + 'px';
      if (o.card.word !== undefined) q('word').style.opacity = o.card.word;
    }
    if (o.wash !== undefined) q('wash').style.opacity = o.wash;
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
  app: (fn, arg) => app.evaluate('(' + fn.toString() + ')(' + JSON.stringify(arg === undefined ? null : arg) + ')'),
};

/* ---- the film ------------------------------------------------------------ */
const film = SCENES({ W, H, portrait });
const list = only ? film.filter((s) => s.name === only) : film;
if (!list.length){ console.error('no scene called ' + only); process.exit(2); }

const dir = path.join(OUT, 'frames');
fs.mkdirSync(OUT, { recursive: true });
if (stills){ fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); }

/* Straight into ffmpeg. 1800 frames of 1920x1080 is most of a gigabyte on
   disk and every byte of it is written once and read once. */
const ff = stills ? null : findFfmpeg();
if (!stills && !ff){ console.error('no ffmpeg. PV_FFMPEG=/path/to/ffmpeg'); process.exit(2); }
const shape = portrait ? '9x16' : '16x9';
const out = path.join(OUT, 'lingua-' + shape + (ff && ff.mp4 ? '.mp4' : '.webm'));
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

let n = 0;
const t0 = Date.now();
for (const sc of list){
  process.stdout.write('  ' + sc.name + ' (' + sc.secs + 's) ');
  if (sc.enter) await sc.enter(stage);
  const frames = Math.round(sc.secs * FPS);
  for (let i = 0; i < frames; i++){
    const k = i / frames;                 /* 0..1 through this scene */
    if (sc.at) await sc.at(stage, k, i / FPS);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 95 });
    if (stills){
      if (i % FPS === 0) fs.writeFileSync(path.join(dir, sc.name + '-' + String(Math.round(i/FPS)) + '.jpg'), buf);
    } else {
      await feed(buf);
    }
    n++;
    if (i % 30 === 0) process.stdout.write('.');
  }
  process.stdout.write('\n');
}
const secs = ((Date.now() - t0) / 1000).toFixed(0);
console.log(n + ' frames in ' + secs + 's');

await br.close();
srv.close();

if (stills){ console.log('stills in ' + dir); process.exit(0); }

await new Promise((res) => { enc.on('close', res); enc.stdin.end(); });
const mb = (fs.statSync(out).size / 1048576).toFixed(1);
console.log(out + '  ' + W + 'x' + H + '  ' + (n / FPS).toFixed(1) + 's  ' + mb + ' MB');
