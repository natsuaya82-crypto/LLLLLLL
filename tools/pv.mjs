/* ---------------------------------------------------------------------------
   tools/pv.mjs — the film. A minute of Lingua, as one mp4.

   Run it:  node tools/pv.mjs                  16:9,  1920x1080
            node tools/pv.mjs --portrait       9:16,  1080x1920
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
import { seed } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';
import { PV_STROKES, PV_WORDS, PV_SND, PV_OTHER, PV_SEEN, PV_FEED,
         PV_CURVE, PV_WEDGE, PV_BLOCK, inkFor } from './pv/lang.mjs';
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
const portrait = has('--portrait');
const stills = has('--stills');
const only = val('--scene', '');
/* The length of one bar of the track the film is cut to. Every shot is a
   whole number of these (tools/pv/scenes.mjs), so no cut lands between two
   beats. Measured off the track, not guessed: 142 bpm is 1.690s. */
const BAR = Number(val('--bar', '1.690'));
const W = portrait ? 1080 : 1920;
const H = portrait ? 1920 : 1080;

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

/* The three scripts, and the posts written in them. Built HERE rather than
   in the page: inkFor() is the same shape www/post.js's inkOfCut() makes, and
   what a post carries is what a server would have sent -- glyphs and a
   sequence, with nothing on the phone needed to draw them. */
const SCRIPTS = { curve: PV_CURVE, wedge: PV_WEDGE, block: PV_BLOCK };
const FEED = PV_FEED.map((p) => Object.assign({}, p, {
  ink: inkFor(SCRIPTS[p.script], p.ln),
  av: { st: SCRIPTS[p.script][p.face] }
}));
const MYFACE = { st: PV_CURVE['o'] };

/* The app is filled with one made-up language, the same one every run --
   tools/pv/lang.mjs. It is not tools/fixture.mjs's: that one is three letters
   and a triangle, which is right for a check and is not a language anybody
   would want to look at. The fixture is run FIRST all the same, because it is
   the one place that knows what a whole app-state looks like, and the film's
   own language is laid over it. */
await app.evaluate('window.__seed = ' + seed.toString());
await app.evaluate(({ s, st, wds, snd, other, seen, feed, myFace }) => {
  eval('(' + s + ')()');
  SET.done = true; SET.theme = 'dark'; SET.ui = 'en';
  /* FREE. Not because the film is being modest -- because the free plan is
     what the free plan is: your own shapes for a-z and 0-9, and a QWERTY
     wearing them. Every screen in the film is one anybody gets. */
  SET.plan = 'free';
  langName = 'Shango';
  SND = snd;

  /* A word was made on a day. tools/fixture.mjs numbers them 1..20 because a
     check only ever asks which came first; a film shows the date on screen,
     and 1970-01-01 is what a 1 means. */
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
     the app never makes. What IS dropped is the check fixture's own
     placeholder letters: a chevron that reads nothing and a borrowed Greek
     character are stage dressing from a different job. */
  var l, k, kept = [], n = 0;
  for (i = 0; i < LETTERS.length; i++){
    l = LETTERS[i];
    k = (typeof numIsDigit === 'function' && numIsDigit(l)) ? '#' + l.val
                                                           : String(ltName(l) || '');
    if (!st[k]) continue;
    /* ltIsBase() -- which is how the free plan counts its own thirty-eight
       slots -- reads `ab`, the roman character the letter was made from, and
       the fixture's letters have none: they were written out by hand rather
       than made by ltStart(). Three of them were therefore over the free
       allotment, and the alphabet carried a "3 hidden / Upgrade" banner in
       the middle of the film. */
    if (!l.ab && !numIsDigit(l)) l.ab = k;
    l.st = JSON.parse(JSON.stringify(st[k]));
    if (l.ch) l.ch = '';         /* a letter that was borrowing a character */
    kept.push(l); n++;
  }
  LETTERS = kept;
  window.__pvDrawn = n;

  /* Nobody's alphabet has c, q and x all reading /k/. ltStart() gives every
     roman letter the sound it is usually written with, which is right on the
     day it runs and is not what somebody's language looks like a month
     later -- and the app says so on screen, in red, which in a film reads as
     an error rather than as a thing to get round to. */
  var say = { c:['tʃ'], q:['q'], x:['ʃ'], y:['y'] };
  for (i = 0; i < LETTERS.length; i++){
    k = String(ltName(LETTERS[i]) || '');
    if (say[k]) LETTERS[i].snd = say[k];
  }

  saveLetters(); save();

  /* SOMEBODY ELSE'S LANGUAGE, as the server would answer it: what it is
     called, what it says about itself, and the chapters its owner has said
     may be taken. The shape is supabase/schema.sql's `slice_read` -- the five
     a reader of a published language is allowed, and not the dictionary,
     which it refuses to everybody but its owner. Their alphabet is built the
     other way round from this phone's, which is the whole reason the film
     goes and gets it. */
  WLD_HAVE[seen.id] = { id: seen.id, name: seen.name, license: '',
                        pub: '2026-08-14', nwords: 61, nletters: other.length };
  WLDS_HAVE[seen.id] = {
    wld:     { body: JSON.stringify({ dl:true, where: seen.where,
                 ov:[{ k:'', v: seen.note }] }), no:3 },
    script:  { body: JSON.stringify({ dir:'ltr' }), no:1 },
    snd:     { body: JSON.stringify(['a','e','i','o','u','k','n','r','s','t']), no:10 },
    letters: { body: JSON.stringify(other), no: other.length },
    kb:      { body: JSON.stringify({ boards:[] }), no:1 }
  };

  /* A photograph on a post. The fixture's is three grey rectangles, which is
     the right picture for "is there an image here" and the wrong one for a
     film. Drawn rather than pasted in as kilobytes of base64. */
  function pic(v){
    var c = document.createElement('canvas'), w = 1200, h = 800;
    c.width = w; c.height = h;
    var x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, h);
    var sky = v === 2 ? ['#20303a', '#3c5560', '#7d8f86', '#c3c6a8']
                      : ['#1b2740', '#4a4258', '#9c7a55', '#d8a86a'];
    g.addColorStop(0, sky[0]); g.addColorStop(0.55, sky[1]);
    g.addColorStop(0.78, sky[2]); g.addColorStop(1, sky[3]);
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,238,205,.85)';
    x.beginPath(); x.arc(w*0.72, h*0.60, 26, 0, 7); x.fill();
    var far = v === 2 ? ['#33463f', '#26362f', '#1a2620'] : ['#2c3347', '#232a3c', '#191e2c'], j;
    for (j = 0; j < 3; j++){
      x.fillStyle = far[j];
      x.beginPath();
      x.moveTo(-40, h);
      var px = -40, py = h * (0.70 + j * 0.07);
      var sd = (v === 2 ? 31 : 7) + j * 13;
      while (px < w + 40){
        var upv = ((sd = (sd * 1103515245 + 12345) & 0x7fffffff) % 1000) / 1000;
        py += (upv - 0.45) * (j ? 70 : 130);
        py = Math.max(h * (0.30 + j * 0.12), Math.min(h * (0.80 + j * 0.05), py));
        px += 90 + upv * 150;
        x.lineTo(px, py);
      }
      x.lineTo(w + 40, h); x.closePath(); x.fill();
    }
    return c.toDataURL('image/jpeg', typeof POST_PICQ === 'number' ? POST_PICQ : 0.72);
  }

  /* THE TIMELINE, and it is the film's centre. Four people, three scripts,
     one conversation 「いろんな言語が飛び交ってる感じにしたい」. Every line
     arrives with its own SHAPES on it -- which is the only reason a phone
     that has never seen the Wedge alphabet can draw a sentence written in
     it. www/post.js's line, and docs rule 8.

     The pictures and the faces are here too: a face is a letter of that
     person's own alphabet, and two of the posts carry a photograph. */
  POSTS = feed.map(function(p, i){
    var o = { id: 'p' + (i + 1), at: now - p.ago * 60000,
              lang: p.mine ? langId : ('lang-' + p.hd), lname: p.lname,
              ln: p.ln, who: p.who, hd: p.hd, mine: !!p.mine,
              av: p.av, ink: p.ink, mn: p.mn, ui: 'en', re: p.re || 0 };
    if (p.dir) o.dir = p.dir;
    if (p.to) { o.to = p.to; o.toh = p.toh; }
    if (p.vo) o.vo = { f: 'v1.m4a', ms: 7000 };
    if (p.pic) o.pic = pic(p.pic);
    return o;
  });
  POSTS.sort(function(a, b){ return b.at - a.at; });
  ME.av = myFace;

  SET.myfont = true;
  if (typeof applyTheme === 'function') applyTheme();
  if (typeof installScriptFont === 'function') installScriptFont();
  /* The face the Lingua keyboard types INTO a field -- the private use area,
     one code point per drawn letter. Without it the composer in the film
     would show roman where a phone shows the letters somebody drew. */
  if (typeof installTypeFont === 'function') installTypeFont();
  if (typeof render === 'function') render();
}, { s: seed.toString(), st: PV_STROKES, wds: PV_WORDS, snd: PV_SND,
     other: PV_OTHER, seen: PV_SEEN, feed: FEED, myFace: MYFACE });
console.log('  letters drawn: ' + await app.evaluate(() => window.__pvDrawn));
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
      /* Past this the device frame is out of the picture anyway; what would
         be left of it is two vertical edges and no top, so it goes. */
      q('stagePhone').className = p.s > 1.4 ? 'zoom' : '';
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
const film = SCENES({ W, H, portrait, bar: BAR });
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
