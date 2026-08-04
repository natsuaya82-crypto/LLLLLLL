/* ---------------------------------------------------------------------------
   tools/feed-weight.mjs — how heavy a feed of hand-drawn scripts actually is.

   Run it:   node tools/feed-weight.mjs

   NOT a gate. This is an experiment, like verify-script.mjs and
   lattice-truth.mjs: it answers one question and prints numbers.

   The question. A feed shows posts written in other people's alphabets, and
   each alphabet is shapes that only exist on the phone that drew them. Four
   ways to put those on a screen, and the choice decides how the feed is
   stored, published and cached -- so it is worth knowing which one is true
   before anything is built on top of it.

     glyph   one <svg> per letter. What you write first
     use     one <svg> per post: the alphabet in <defs>, letters as <use>
     path    one <svg> per post, every letter merged into a single <path>
     image   one <img> per post, rasterised once at publish time

   What is being measured is not bandwidth. The outlines are a few hundred
   bytes each and a whole alphabet is under 10 KB; that was never the problem.
   The problem is nodes and paint, on a phone from 2019, which is what the ES5
   rule in this repo exists for.

   The device. A desktop Chromium is not an old iPhone, so this throttles the
   CPU through CDP and reports the multiplier it used. The absolute
   milliseconds mean little. The ratios between the four are the answer.

   What it said, at 100 posts, 6x throttle:

     mode    nodes   payload   scroll
     glyph   9,700    940 KB  1764 ms
     use     8,100    667 KB   108 ms
     path      300    817 KB   101 ms
     image     200   3387 KB   310 ms

   path. One <svg> per post with every letter merged into a single <path>, by
   moving each letter's coordinates along -- arithmetic, done once, wherever
   the post is frozen.

   Two things worth knowing because they were guessed wrong before this ran:

   <defs> and <use> barely help. A <use> is a node like any other, so the
   count falls by a sixth rather than by a factor, and building them is the
   slowest of the four at scale. It sounds like it collapses the repeats. It
   does not.

   Rasterising for the feed is worse than the paths it replaces: three times
   the scroll and four times the bytes. Some of that is this measurement --
   a data URI in the DOM is the worst case for an image, and real files with
   real caching would decode better -- but 3.4 MB for a hundred posts is not
   a measurement artefact. Pictures are still the answer for sharing OUTSIDE
   the app, where nobody can render our outlines. Inside it they cost more
   than the thing they were meant to save.

   Build times are noisy -- the same work measured 683 ms and 241 ms on two
   runs -- so read scroll, which was stable across all three.
   --------------------------------------------------------------------------- */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const req = createRequire(import.meta.url);
function loadChromium(){
  try { return req('playwright').chromium; } catch (e) {}
  try {
    const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return req(path.join(g, 'playwright')).chromium;
  } catch (e) {}
  console.error('playwright is not installed. npm i -g playwright');
  process.exit(2);
}
const chromium = loadChromium();

/* A feed as it would actually look: thirty posts, a dozen words each, in an
   alphabet of thirty letters. Letters repeat inside a post, which is the whole
   reason `use` and `path` can be cheaper than `glyph`. */
const POSTS = Number(process.env.POSTS || 30), WORDS = 12, PER_WORD = 4, ALPHABET = 30;
const THROTTLE = Number(process.env.CPU || 6);
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';

const br = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 390, height: 844 } });
await pg.setContent('<style>body{margin:0}.post{padding:8px;border-bottom:1px solid #ccc}' +
  '.g{width:22px;height:22px;stroke:#000;fill:none;stroke-width:40}' +
  '.line{width:100%;height:auto;stroke:#000;fill:none;stroke-width:40}' +
  '</style><div id="feed"></div>');
const cdp = await pg.context().newCDPSession(pg);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });

const rows = [];
for (const mode of ['glyph', 'use', 'path', 'image']) {
  const r = await pg.evaluate(async ({ mode, POSTS, WORDS, PER_WORD, ALPHABET }) => {
    /* Outlines shaped like the app's: a handful of strokes of a few points,
       drawn on the 0..800 grid glyph.js uses. Deterministic, so the four
       modes are drawing exactly the same thing. */
    let seed = 12345;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const outline = () => {
      let d = '';
      for (let s = 0; s < 3; s++) {
        d += `M${(rnd() * 800) | 0} ${(rnd() * 800) | 0}`;
        for (let p = 0; p < 5; p++) d += `L${(rnd() * 800) | 0} ${(rnd() * 800) | 0}`;
      }
      return d;
    };
    const alphabet = Array.from({ length: ALPHABET }, outline);
    const letters = [];
    for (let i = 0; i < WORDS * PER_WORD; i++) letters.push(i % ALPHABET);

    const host = document.getElementById('feed');
    host.innerHTML = '';

    /* Rasterise once, the way publishing would: the post becomes a picture and
       the feed never sees a path again. Cost paid here is the cost paid on the
       author's phone, once, not on every reader's. */
    const raster = () => {
      const c = document.createElement('canvas');
      c.width = 780; c.height = 120;
      const x = c.getContext('2d');
      letters.forEach((li, i) => {
        const p = new Path2D(alphabet[li]);
        x.save();
        x.translate((i % 26) * 30, Math.floor(i / 26) * 40);
        x.scale(0.035, 0.035);
        x.stroke(p);
        x.restore();
      });
      return c.toDataURL('image/png');
    };
    const png = mode === 'image' ? raster() : null;

    const t0 = performance.now();
    let html = '';
    for (let p = 0; p < POSTS; p++) {
      html += '<article class="post">';
      if (mode === 'glyph') {
        letters.forEach((li) => {
          html += `<svg viewBox="0 0 800 800" class="g"><path d="${alphabet[li]}"/></svg>`;
        });
      } else if (mode === 'use') {
        html += `<svg viewBox="0 0 ${letters.length * 800} 800" class="line"><defs>`;
        alphabet.forEach((d, i) => { html += `<path id="p${p}_${i}" d="${d}"/>`; });
        html += '</defs>';
        letters.forEach((li, i) => {
          html += `<use href="#p${p}_${li}" x="${i * 800}"/>`;
        });
        html += '</svg>';
      } else if (mode === 'path') {
        /* every letter merged: the same shapes, one node. Subpaths are moved
           by rewriting the M/L coordinates, which is arithmetic and happens
           once, wherever the post is built. */
        let d = '';
        letters.forEach((li, i) => {
          d += alphabet[li].replace(/([ML])(\d+) (\d+)/g,
            (_, c, x, y) => `${c}${(+x) + i * 800} ${y}`);
        });
        html += `<svg viewBox="0 0 ${letters.length * 800} 800" class="line"><path d="${d}"/></svg>`;
      } else {
        html += `<img class="line" src="${png}" alt="">`;
      }
      html += '</article>';
    }
    host.innerHTML = html;
    /* force layout and paint rather than measuring string building */
    host.getBoundingClientRect();
    await new Promise((r2) => requestAnimationFrame(() => requestAnimationFrame(r2)));
    const build = performance.now() - t0;

    /* scrolling the whole feed, which is where an old phone actually hurts */
    const t1 = performance.now();
    for (let y = 0; y < host.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      host.getBoundingClientRect();
      await new Promise((r2) => requestAnimationFrame(r2));
    }
    const scroll = performance.now() - t1;

    return {
      mode,
      nodes: host.getElementsByTagName('*').length,
      bytes: mode === 'image' ? png.length * POSTS : host.innerHTML.length,
      build: Math.round(build),
      scroll: Math.round(scroll)
    };
  }, { mode, POSTS, WORDS, PER_WORD, ALPHABET });
  rows.push(r);
}

await br.close();

const N = (n) => n.toLocaleString('en-US');
console.log(`a feed of ${POSTS} posts, ${WORDS * PER_WORD} letters each, ` +
            `alphabet of ${ALPHABET}, CPU throttled ${THROTTLE}x\n`);
console.log('  mode    nodes      payload     build    scroll');
console.log('  ' + '-'.repeat(46));
rows.forEach((r) => {
  console.log('  ' + r.mode.padEnd(8) +
              N(r.nodes).padStart(7) + '  ' +
              (Math.round(r.bytes / 1024) + ' KB').padStart(9) + '  ' +
              (r.build + ' ms').padStart(8) + '  ' +
              (r.scroll + ' ms').padStart(8));
});
const g = rows[0], best = rows.slice(1).sort((a, b) => a.scroll - b.scroll)[0];
console.log(`\n  one <svg> per letter is ${(g.nodes / best.nodes).toFixed(0)}x the nodes ` +
            `and ${(g.scroll / best.scroll).toFixed(1)}x the scroll of ${best.mode}.`);
console.log('  Absolute milliseconds on this machine mean nothing. The ratios are the answer.');
