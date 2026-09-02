/* ---------------------------------------------------------------------------
   tools/pv/kbswap.mjs — the REAL keyboard, wearing this language's letters.

   Run it:  node tools/pv/kbswap.mjs        -> pv/kbreal.png + pv/kbreal.json

   WHY THERE IS A PHOTOGRAPH IN HERE AT ALL. The Lingua keyboard is an iOS
   keyboard extension: iOS draws it, from ios/App/LinguaKeyboard, and no
   browser can show one. So the film could never have a recording of it, and
   what it had instead was the app's own drawing of the same board -- right
   in every number and still not the thing.

   `tools/pv/kbshot.jpg` is the thing: the owner's phone, the real keyboard,
   photographed. What this tool does is take the letters OFF it and put this
   language's letters on, so the film can use a real keyboard.
   「一応こんな感じだけど君の文字に差し替えて使えたりしない？」

   NOTHING IS MEASURED BY EYE. The picture is 1206 px across and the board on
   it is 402 points, so it is a 3x screenshot and one point is three pixels.
   From there every key comes out of two things that are already written
   down:

     - the LAYOUT, asked of the app: `kbOf().lay[0].rows`, the free QWERTY,
       which is the same layout the phone in the photograph is running.
     - the ARITHMETIC, copied from KeyBoardView.layoutSubviews: a row divides
       what is left after the gaps by the keys' `w`. The gap is read out of
       the Swift by the caller rather than typed here.

   The one thing the picture had to be asked is where its board starts, and
   even that is one number: the top of the first row of keys, which is the
   board's top plus one gap.

   The colours are not chosen either -- they are SAMPLED off the photograph:
   a letter key is exactly rgb(28,28,30), which is `secondarySystemBackground`
   in the dark, which is what KeyView.rest() asks UIKit for. That agreeing is
   how you know the frame is right.

   What is left of the photograph afterwards is everything that is not a
   letter: the backdrop, the gaps, ⌫ and ⏎ and the space bar, the globe and
   the microphone along the bottom, and the corners of the phone. Those are
   the parts nobody can draw.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium, LAUNCH } from '../browser.mjs';
import { seedFilm } from './seed.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const WWW = path.join(ROOT, 'www');
const OUT = path.join(ROOT, 'pv');
const PORT = 8171;
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
               '.png':'image/png', '.jpg':'image/jpeg' };

/* The extension's own numbers, read out of the Swift. Same reader as
   tools/pv.mjs uses, and for the same reason: one number in two languages
   drifts. */
const swiftNum = (f, re) => {
  const src = fs.readFileSync(path.join(ROOT, 'ios/App/LinguaKeyboard', f), 'utf8');
  const m = src.match(re);
  if (!m) throw new Error('not in ' + f + ': ' + re);
  return Number(m[1]);
};
export const KBM = {
  radius: swiftNum('KeyBoardView.swift', /layer\.cornerRadius\s*=\s*([\d.]+)/),
  gap:    swiftNum('KeyBoardView.swift', /let gap:\s*CGFloat\s*=\s*([\d.]+)/),
  /* the face is inset by this much of the key's smaller side */
  inset:  swiftNum('KeyBoardView.swift', /min\(bounds\.width, bounds\.height\) \* ([\d.]+)/),
  /* the roman in the corner: its height, as a share of the key's */
  markH:  swiftNum('KeyBoardView.swift', /let h = bounds\.height \* ([\d.]+)/)
};

/* THE PICTURE. 1206 across at 3 pixels to the point is a 402-point phone --
   an iPhone 16 Pro. The top of the first row of keys is the only thing
   measured off the picture; the board's own top is one gap above it, and
   everything below follows from the arithmetic. */
export const SHOT = {
  file: 'kbshot.jpg',
  px: 3,                 /* pixels per point */
  rowTop: 192,           /* top edge of the digit row, in pixels */
  rows: 5,
  rowPitch: 170,         /* one row plus one gap, in pixels */
  /* What of the picture the film uses. Off the top goes the corner of the
     phone and the app above the keyboard; off the bottom, the sliver of
     whatever was under it. What is left is the keyboard and nothing else,
     so the film can stand it on the bottom edge of the frame. */
  cut: { top: 148, bottom: 1224 }
};

if (import.meta.url === 'file://' + process.argv[1]) await main();

export async function main(){
  const srv = http.createServer((q, r) => {
    const u = q.url.split('?')[0];
    const f = u.indexOf('/pv/') === 0 ? path.join(HERE, u.slice(4))
            : path.join(WWW, u === '/' ? 'index.html' : u);
    let b;
    try { b = fs.readFileSync(f); } catch (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain',
                       'Cache-Control': 'no-store' });
    r.end(b);
  }).listen(PORT);

  const br = await chromium.launch(LAUNCH);
  const pg = await br.newPage({ viewport: { width: 390, height: 844 } });
  await pg.goto(`http://localhost:${PORT}/`);
  await pg.waitForSelector('#splash', { state: 'detached', timeout: 20000 });
  console.log('  letters drawn: ' + await seedFilm(pg));

  const got = await pg.evaluate(async (o) => {
    /* the photograph */
    const im = new Image();
    im.src = o.src;
    await im.decode();
    /* the picture, cut to the keyboard. Everything below is in the CUT
       picture's coordinates, which is what the film is handed. */
    const c = document.createElement('canvas');
    c.width = im.naturalWidth; c.height = o.cutBottom - o.cutTop;
    const x = c.getContext('2d');
    x.drawImage(im, 0, -o.cutTop);

    const gap = o.gap * o.px;
    const rowH = o.rowPitch - gap;
    const Y0 = o.rowTop - gap - o.cutTop;
    const W = c.width;
    const rows = kbOf().lay[0].rows;
    if (rows.length !== o.rows)
      throw new Error('the layout has ' + rows.length + ' rows and the picture has ' + o.rows);

    const round = (kx, ky, kw, kh, r) => {
      x.beginPath();
      x.moveTo(kx + r, ky);
      x.arcTo(kx + kw, ky, kx + kw, ky + kh, r);
      x.arcTo(kx + kw, ky + kh, kx, ky + kh, r);
      x.arcTo(kx, ky + kh, kx, ky, r);
      x.arcTo(kx, ky, kx + kw, ky, r);
      x.closePath();
    };

    const hit = [];        /* every letter key, for the film to press */
    let y = Y0 + gap;
    for (let ri = 0; ri < rows.length; ri++){
      const row = rows[ri];
      let tot = 0;
      for (let i = 0; i < row.length; i++) tot += (row[i].w || 1);
      /* KeyBoardView.layoutSubviews, in three lines */
      const free = W - gap * (row.length + 1);
      let kx = gap;
      for (let ki = 0; ki < row.length; ki++){
        const key = row[ki], kw = free * ((key.w || 1) / tot);
        if (key.k === 'lt'){
          const l = ltById(key.v);
          /* the key, wiped back to what UIKit paints under a letter */
          round(kx, y, kw, rowH, o.radius * o.px);
          x.fillStyle = 'rgb(28,28,30)';
          x.fill();
          /* the letter, through the app's own one place for turning strokes
             into a shape on a canvas */
          const box = Math.min(kw, rowH) * (1 - 2 * o.inset);
          if (l && l.st && l.st.length)
            inkStrokes(x, l.st, box / 800, kx + (kw - box) / 2, y + (rowH - box) / 2,
                       '#fff', true);
          else if (l && (l.ch || ltName(l))){
            x.font = Math.round(box * 0.78) + 'px -apple-system,system-ui,sans-serif';
            x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
            x.fillText(l.ch || ltName(l), kx + kw / 2, y + rowH / 2);
          }
          /* and the roman in the corner, where KeyView puts it */
          const t = kbTyped(key.v);
          if (t){
            const h = rowH * o.markH;
            x.font = Math.round(h * 0.86) + 'px -apple-system,system-ui,sans-serif';
            x.fillStyle = 'rgba(235,235,245,.6)';
            x.textAlign = 'right'; x.textBaseline = 'middle';
            x.fillText(t, kx + kw - 2 - o.px, y + rowH - 1 - h / 2);
          }
          hit.push({ lt: key.v, t: t || '',
                     x: +(kx).toFixed(1), y: +(y).toFixed(1),
                     w: +kw.toFixed(1), h: +rowH.toFixed(1) });
        }
        kx += kw + gap;
      }
      y += rowH + gap;
    }
    return { png: c.toDataURL('image/png'), keys: hit, w: c.width, h: c.height };
  }, { src: '/pv/' + SHOT.file, px: SHOT.px, rowTop: SHOT.rowTop, rowPitch: SHOT.rowPitch,
       rows: SHOT.rows, gap: KBM.gap, radius: KBM.radius, inset: KBM.inset, markH: KBM.markH,
       cutTop: SHOT.cut.top, cutBottom: SHOT.cut.bottom });

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'kbreal.png'),
                   Buffer.from(got.png.split(',')[1], 'base64'));
  fs.writeFileSync(path.join(OUT, 'kbreal.json'), JSON.stringify({
    w: got.w, h: got.h, px: SHOT.px, keys: got.keys
  }, null, 1));
  console.log('  ' + path.join(OUT, 'kbreal.png') + '  ' + got.w + 'x' + got.h +
              '  ' + got.keys.length + ' letter keys');
  await br.close();
  srv.close();
}
