/* ---------------------------------------------------------------------------
   tools/widget-shot.mjs — a picture of the home-screen widgets.

   Run it:   node tools/widget-shot.mjs

   WHAT THIS IS, exactly, because the difference matters.

   The widgets are SwiftUI in an app extension and there is no Swift compiler
   and no simulator on this machine, so nobody here can photograph the built
   thing. What this does instead is take the SAME widget.json the app really
   produces -- shareWidget(), asked of the running app -- and draw it with the
   SAME numbers the Swift uses: every em, ring radius, hand length, tick size
   and padding below is copied from ClockWidget.swift and DateWidget.swift,
   and the glyph scaling is copied from GlyphShape.swift.

   So the data is real and the geometry is real. What it does NOT prove is
   that the Swift compiles, or that SwiftUI lays out the same. Those are on a
   phone (docs/STATE.md § 20c) and nothing here can stand in for them.

   Four states, because those are the four a person can actually be in:

     drawn      every digit drawn -- what it is for
     partial    a language missing its 7, so one roman digit stands in
     none       nothing drawn yet -- all roman, which is a new install
     base2      counting in two, where 12 is 1100 and the face falls back
                to four numerals

   Pictures land in shots/ and that directory is not committed.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const OUT = path.join(ROOT, 'shots');
const PORT = 8127;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, 'www', q.url === '/' ? 'index.html' : q.url.split('?')[0]);
  let body;
  try { body = fs.readFileSync(f); } catch (e) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  r.end(body);
}).listen(PORT);
fs.mkdirSync(OUT, { recursive: true });

/* Ten signs on the lattice, one per digit.
   They must look NOTHING like 0-9, and the first set did: a Z for two, a 3
   for three, a 4 for four. A picture whose invented digits are traced from
   the ones they stand in for cannot answer the only question it is for --
   is this the person's letter, or is it the roman one the widget falls back
   to? So these are angles, bars and a diamond, and not one of them is a
   numeral anybody already reads.
   Not anybody's alphabet either. Ten shapes told apart at 20 points, which
   is the only property a clock face needs of them. */
const DIGITS = {
  0: [[[4,6],[16,6]], [[7,6],[7,15]], [[13,6],[13,15]]],   /* ∏ */
  1: [[[15,4],[5,16],[13,16]]],                            /* ⟍_ */
  2: [[[4,15],[10,5],[16,15]]],                            /* ∧ */
  3: [[[10,4],[10,16]], [[4,10],[16,10]]],                 /* + */
  4: [[[6,4],[6,16]], [[6,10],[16,10]]],                   /* ⊢ */
  5: [[[5,5],[15,5],[10,16],[5,5]]],                       /* ▽ */
  6: [[[4,7],[16,7]], [[4,14],[16,14]]],                   /* = */
  7: [[[5,16],[15,4]], [[6,7],[14,13]]],                   /* ⧄ */
  8: [[[14,4],[6,4],[6,16]]],                              /* Γ */
  9: [[[10,4],[16,10],[10,16],[4,10],[10,4]]],             /* ◇ */
};

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await pg.goto(`http://localhost:${PORT}/`);
await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });

/* Ask the real app for the real payload, four times over. */
const CASES = await pg.evaluate(({ s, D }) => {
  eval('(' + s + ')()');
  SET.done = true; SET.plan = 'plus';
  const O = GGRID.inset, K = geStep();
  const put = (v, shape) => {
    const l = numByVal(v);
    if (!l) return;
    l.st = shape.map((run) => ({ pts: run.map((p) => [O + p[0] * K, O + p[1] * K]) }));
  };
  const clear = () => numDigits().forEach((l) => { delete l.st; delete l.ch; });
  const out = {};

  clear();
  Object.keys(D).forEach((v) => put(+v, D[v]));
  saveLetters();
  out.drawn = shareWidget();

  delete numByVal(7).st;
  saveLetters();
  out.partial = shareWidget();

  clear(); saveLetters();
  out.none = shareWidget();

  Object.keys(D).forEach((v) => put(+v, D[v]));
  saveLetters();
  numSetBase(2);
  out.base2 = shareWidget();

  /* Twelve, where a clock is at its best: every hour but one is a single
     sign, because the base and the face agree for once. numTopUp() makes the
     two new slots and they are drawn here so the case is a real one. */
  numSetBase(12);
  put(10, [[[4,4],[16,16]], [[16,4],[4,16]]]);             /* ✕ */
  put(11, [[[10,4],[10,16]], [[4,4],[16,4]]]);             /* ⊤ */
  saveLetters();
  out.base12 = shareWidget();
  numSetBase(10);
  return out;
}, { s: seed.toString(), D: DIGITS });
await pg.close();

/* ---- the same drawing, with the same numbers ---------------------------- */
const page = await br.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 3 });

/* systemSmall on a 6.1-inch phone is 158x158 points. */
const SIDE = 158;

function html(cases, dark) {
  const ink = dark ? '#f2f2f7' : '#1c1c1e';
  const ground = dark ? '#1c1c1e' : '#f2f2f7';
  const card = dark ? '#000' : '#fff';

  /* GlyphShape.swift: side = min(w,h) when dx is nil, k = side/box, and the
     ink is centred in that square. */
  const glyph = (face, em, box, dx) => {
    const k = em / box, ox = (dx || 0) * k;
    const d = face.st.map((poly) => poly.filter((p) => p.length >= 2)
      .map((p, i) => (i ? 'L' : 'M') + (ox + p[0] * k).toFixed(2) + ' ' + (p[1] * k).toFixed(2))
      .join(' ') + 'Z').join(' ');
    return `<svg style="position:absolute;left:0;top:0;overflow:visible" width="${em}" height="${em}">`
         + `<path d="${d}" fill="${ink}"/></svg>`;
  };
  const places = (n, num) => {
    const b = num ? num.base : 10;
    let left = n, out = [];
    if (!left) return [0];
    while (left > 0) { out.unshift(left % b); left = Math.floor(left / b); }
    return out;
  };
  const faceOf = (v, num) => (num && num.dg[String(v)]) || null;
  /* NumberView: a LINE. Each sign takes its own advance -- aw, from the app's
     inkAdv() -- and its ink starts dx into it. No gap between: the advance
     already carries half a step at each end. A sign with no ink of its own
     takes a square, because the line rule is about the person's letters. */
  const advOf = (f, box) =>
    (f && f.st && f.st.length && f.aw > 0) ? f.aw : box * 0.55;
  const widthOf = (n, num) => {
    const box = num ? num.box : 800;
    return places(n, num).reduce((w, v) => w + advOf(faceOf(v, num), box), 0);
  };
  /* Consecutive signs that are not the person's are ONE piece of text, not
     one cell each: a "1" centred in its own cell sits a word space away from
     the "0" beside it, and a font would never set "10" that way. */
  const number = (n, num, em) => {
    const box = num ? num.box : 800, k = em / box;
    const out = []; let run = '';
    const flush = () => {
      if (!run) return;
      out.push(`<span style="font:500 ${(em * 0.62).toFixed(1)}px `
        + `-apple-system,system-ui,sans-serif;color:${ink};height:${em.toFixed(2)}px;`
        + `display:inline-flex;align-items:center">${run}</span>`);
      run = '';
    };
    places(n, num).forEach((v) => {
      const f = faceOf(v, num);
      if (f && f.st && f.st.length) {
        flush();
        const w = (f.aw > 0 ? f.aw : box) * k;
        out.push(`<span style="display:inline-block;width:${w.toFixed(2)}px;`
          + `height:${em.toFixed(2)}px;overflow:visible;position:relative">`
          + glyph(f, em, box, f.dx || 0) + '</span>');
      } else if (f && f.ch) { run += f.ch; }
      else { run += v.toString(36); }
    });
    flush();
    return `<span style="display:inline-flex;align-items:flex-start">${out.join('')}</span>`;
  };

  /* ClockFace, number for number. */
  const clock = (num, when) => {
    const side = SIDE - 16;                       /* .padding(8) */
    const r = side / 2, cx = SIDE / 2, cy = SIDE / 2;
    const most = Math.max(...[...Array(12)].map((_, i) => places(i + 1, num).length));
    const widest = Math.max(...[...Array(12)].map((_, i) => widthOf(i + 1, num)));
    const hours = (most <= 2 && widest <= 1700)
      ? [...Array(12)].map((_, i) => i + 1) : [12, 3, 6, 9];
    const wide = Math.max(...hours.map((h) => widthOf(h, num)));
    const room = 2 * (r * 0.78) * Math.sin(Math.PI / hours.length);
    const em = Math.min(side * 0.19, room * 0.82 * 800 / wide);
    const ring = r - em * 0.85;
    const at = (h) => {
      const a = (h / 12) * 2 * Math.PI - Math.PI / 2;
      return [cx + ring * Math.cos(a), cy + ring * Math.sin(a)];
    };
    let out = '';
    hours.forEach((h) => {
      const [x, y] = at(h);
      out += `<div style="position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%)">`
           + number(h, num, em) + '</div>';
    });
    for (let i = 1; i <= 12; i++) if (hours.indexOf(i) < 0) {
      const [x, y] = at(i), d = side * 0.016;
      out += `<div style="position:absolute;left:${x}px;top:${y}px;width:${d}px;height:${d}px;`
           + `margin:${-d / 2}px 0 0 ${-d / 2}px;border-radius:50%;background:${ink};opacity:.28"></div>`;
    }
    const hand = (ang, len, w) => {
      const x = cx + len * Math.cos(ang), y = cy + len * Math.sin(ang);
      return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" `
           + `stroke="${ink}" stroke-width="${w.toFixed(2)}"/>`;
    };
    const hA = (((when[0] % 12) + when[1] / 60) / 12) * 2 * Math.PI - Math.PI / 2;
    const mA = ((when[1] / 60)) * 2 * Math.PI - Math.PI / 2;
    out += `<svg style="position:absolute;inset:0" width="${SIDE}" height="${SIDE}">`
         + hand(hA, r * 0.46, side * 0.035) + hand(mA, r * 0.68, side * 0.022)
         + `<circle cx="${cx}" cy="${cy}" r="${side * 0.025}" fill="${ink}"/></svg>`;
    return out;
  };

  /* DayFace, number for number. */
  const day = (num, d, m) => {
    const side = SIDE - 20;                       /* .padding(10) */
    const dEm = Math.min(side * 0.44, side * 0.86 * 800 / widthOf(d, num));
    const mEm = Math.min(side * 0.17, side * 0.50 * 800 / widthOf(m, num));
    return `<div style="position:absolute;inset:0;display:flex;flex-direction:column;`
      + `align-items:center;justify-content:center;gap:${(side * 0.04).toFixed(1)}px">`
      + number(d, num, dEm)
      + `<span style="opacity:.55">${number(m, num, mEm)}</span></div>`;
  };

  const box = (inner, label) =>
    `<figure style="margin:0"><div style="width:${SIDE}px;height:${SIDE}px;position:relative;`
    + `background:${card};border-radius:22px;overflow:hidden">${inner}</div>`
    + `<figcaption style="font:12px system-ui;color:${ink};opacity:.7;margin-top:7px;text-align:center">`
    + `${label}</figcaption></figure>`;

  const col = (k, name) => `<div style="display:flex;flex-direction:column;gap:18px;align-items:center">`
    + `<div style="font:600 13px system-ui;color:${ink}">${name}</div>`
    + box(clock(cases[k], [10, 9]), 'clock') + box(day(cases[k], 23, 8), 'date') + '</div>';

  /* One to twelve, written out, because a clock face is twelve numbers and
     the only way to know whether they read is to see them at size. */
  const strip = (num, name) => {
    const em = 42;
    const cells = [];
    for (let i = 1; i <= 12; i++) {
      cells.push(`<div style="display:flex;flex-direction:column;align-items:center;gap:6px">`
        + `<div style="height:${em}px;display:flex;align-items:flex-start">${number(i, num, em)}</div>`
        + `<span style="font:11px system-ui;color:${ink};opacity:.45">${i}</span></div>`);
    }
    return `<div><div style="font:600 13px system-ui;color:${ink};margin-bottom:12px">${name}</div>`
      + `<div style="display:flex;gap:20px;align-items:flex-start;background:${card};`
      + `padding:18px 22px;border-radius:16px;width:max-content">${cells.join('')}</div></div>`;
  };

  return `<div style="background:${ground};padding:26px;font-family:system-ui;width:max-content">`
    + `<div style="display:flex;gap:26px">`
    + col('drawn', 'every digit drawn')
    + col('partial', 'no 7 drawn')
    + col('none', 'nothing drawn yet')
    + col('base12', 'counting in twelve')
    + col('base2', 'counting in two')
    + '</div>'
    + `<div style="display:flex;flex-direction:column;gap:22px;margin-top:30px">`
    + strip(cases.drawn, 'one to twelve, counting in ten \u2014 so 10, 11 and 12 are two signs each')
    + strip(cases.base12, 'one to twelve, counting in TWELVE \u2014 every hour but one is a single sign')
    + strip(cases.base2, 'one to twelve, counting in two')
    + '</div></div>';
}

for (const dark of [false, true]) {
  await page.setContent(html(CASES, dark));
  const el = await page.$('div');
  await el.screenshot({ path: path.join(OUT, 'widgets' + (dark ? '-dark' : '') + '.png') });
  console.log('shots/widgets' + (dark ? '-dark' : '') + '.png');
}
await br.close();
srv.close();
console.log('\nThe data is shareWidget()\'s own and every number is the Swift\'s.');
console.log('What no picture here can say: whether it compiles, or whether');
console.log('SwiftUI lays it out the same. Those are on a phone.');
