/* ---------------------------------------------------------------------------
   tools/widget-shot.mjs — a picture of the home-screen widgets.

   Run it:   node tools/widget-shot.mjs

   WHAT THIS IS, exactly, because the difference matters.

   The widgets are SwiftUI in an app extension and there is no Swift compiler
   and no simulator on this machine, so nobody here can photograph the built
   thing. What this does instead is take the SAME widget.json the app really
   produces -- shareWidget(), asked of the running app -- and draw it with the
   SAME numbers the Swift uses: every em, ring radius, hand length, tick size
   and padding below is copied from ClockWidget.swift, TimeWidget.swift and
   CalendarWidget.swift, and the glyph scaling is copied from GlyphShape.swift.

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

/* Twelve more shapes, for the letters a month's name and a day's name are
   spelled out of.

   The fixture draws three letters and no more, so every word made out of them
   came out as the same two glyphs seven times over -- a head row that says
   the same thing in all seven columns, which is not what a calendar in
   somebody's language looks like. These are twelve told apart at 11 points,
   and not one of them is one of the ten digits above.
   Nobody's alphabet, same as the digits: shapes, so that a picture of seven
   different weekday names is a picture of seven different weekday names. */
const MARKS = [
  [[[5,16],[10,4],[15,16],[5,16]]],                        /* △ */
  [[[5,5],[15,5],[15,15],[5,15],[5,5]]],                   /* □ */
  [[[15,5],[6,5],[6,15],[15,15]]],                         /* ⊏ */
  [[[5,5],[14,5],[14,15],[5,15]]],                         /* ⊐ */
  [[[7,4],[13,10],[7,16]]],                                /* ⟩ */
  [[[4,5],[16,5],[16,11]]],                                /* ⌐ */
  [[[4,9],[4,16],[16,16]]],                                /* ⌙ */
  [[[10,16],[10,9]], [[4,4],[10,9]], [[16,4],[10,9]]],     /* ⋔ */
  [[[4,10],[16,10]], [[4,5],[4,15]], [[16,5],[16,15]]],    /* ⊝ */
  [[[4,7],[16,7]], [[4,13],[16,13]], [[10,4],[10,16]]],    /* ♯ */
  [[[4,5],[16,5]], [[4,5],[4,10]], [[4,10],[16,10]],
   [[16,10],[16,15]], [[16,15],[4,15]]],                   /* Ƨ */
  [[[14,4],[14,16]], [[14,10],[4,10]]],                    /* ⊣ */
];

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await pg.goto(`http://localhost:${PORT}/`);
await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });

/* Ask the real app for the real payload, four times over. */
const CASES = await pg.evaluate(({ s, D, M }) => {
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

  /* And the calendar's own case: every digit drawn, AND a word made for each
     of the twelve months and each of the seven days. A calendar with the week
     still in roman is not the thing anybody is making a language for.
     「そこも自分の言語にしてよ」
     The words are spelled out of letters that ARE drawn, so the font has
     every one of them and shareWordAll() says so -- which is what makes the
     widget set them in LinguaScript rather than plainly. */
  Object.keys(D).forEach((v) => put(+v, D[v]));
  /* Letters to spell the names out of, on whichever letters have none. */
  const spare = LETTERS.filter((l) => !numIsDigit(l) && !(l.st && l.st.length));
  M.forEach((shape, i) => {
    const l = spare[i];
    if (l) l.st = shape.map((run) => ({ pts: run.map((p) => [O + p[0] * K, O + p[1] * K]) }));
  });
  const ink = LETTERS.filter((l) => l.st && l.st.length && !numIsDigit(l));
  const word = (n, slot, mn) => {
    const pick = [0, 1, 2].map((i) => ink[(n * 2 + i) % ink.length]).filter(Boolean);
    if (!pick.length) return;
    WORDS.push({ hw: pick.map((l) => ltName(l)).join(''), mn: mn, pos: 'n',
                 at: 1, slot: slot, sp: pick.map((l) => ({ l: l.id })) });
  };
  for (let i = 1; i <= calMonths(); i++) word(i, 'month.' + i, 'month ' + i);
  for (let i = 1; i <= calWeek(); i++) word(i, 'wday.' + i, 'day ' + i);
  saveLetters(); save(); installScriptFont();
  out.calendar = shareWidget();
  /* The face itself, so the page below can set those words in it. It is the
     app's own build of the drawn shapes -- the same bytes the App Group gets
     -- and not this file's idea of what they look like. */
  out.font = SFONT.b64;
  return out;
}, { s: seed.toString(), D: DIGITS, M: MARKS });
await pg.close();

/* ---- the same drawing, with the same numbers ---------------------------- */
const page = await br.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 3 });

/* systemSmall on a 6.1-inch phone is 158x158 points, and systemMedium and
   systemLarge are 329 wide by 155 and 345 tall. */
/* A small widget is 158pt on most iPhones, and this draws into all of it.
   That is only true because every widget in this app now says
   contentMarginsDisabled(). Without it iOS 17 takes about sixteen points off
   each side before the code sees anything -- geo.size arrives already
   shrunk -- so the real face was drawn into 126 and this picture into 158,
   and the picture was 25% bigger than the phone at every size.

   That is what "全然違うし、本当のウィジェットの見た目小さいよ" was, and
   arguing from this picture while that was true was arguing from a drawing of
   a widget nobody has. If the modifier ever comes off, this number has to
   become 158 - 32. */
const SIDE = 158;
/* The month drawn is the one the machine is in, because that is the month the
   widget would be showing if this were a phone. */
const NOW = new Date();
/* The face the app built out of the drawn shapes, and the name it is under.
   www/glyph.js: SFONT_FAMILY. */
const FAM = 'LinguaScript';
const FONT = CASES.font || '';

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

  /* WordView, ScriptFont.swift for word. A word somebody made is set by
     setting its ROMAN spelling in LinguaScript -- the face the app builds out
     of the drawn shapes -- which is what makes it come out in their letters.
     A word with one letter nobody drew has no face to be set in, so it goes
     out plainly, at 0.86 of the size the way the Swift does it. */
  const wordHTML = (w, size, color) => (w.all && FONT)
    ? `<span style="font-family:'${FAM}';font-size:${size.toFixed(1)}px;`
      + `line-height:normal;color:${color}">${w.r}</span>`
    : `<span style="font:500 ${(size * 0.86).toFixed(1)}px -apple-system,`
      + `system-ui,sans-serif;color:${color}">${w.r}</span>`;

  /* ClockFace, number for number. */
  const clock = (num, when) => {
    const side = SIDE - 4;                        /* .padding(2) */
    const r = side / 2, cx = SIDE / 2, cy = SIDE / 2;
    const most = Math.max(...[...Array(12)].map((_, i) => places(i + 1, num).length));
    const widest = Math.max(...[...Array(12)].map((_, i) => widthOf(i + 1, num)));
    const hours = (most <= 2 && widest <= 1700)
      ? [...Array(12)].map((_, i) => i + 1) : [12, 3, 6, 9];
    const wide = Math.max(...hours.map((h) => widthOf(h, num)));
    const room = 2 * (r * 0.78) * Math.sin(Math.PI / hours.length);
    const em = Math.min(side * 0.19, room * 0.82 * 800 / wide);
    /* The same two lines ClockWidget.swift has, and they have to stay the
       same two: a numeral is centred on the ring, so what must fit outside it
       is half the numeral's HEIGHT at twelve and six and half its WIDTH at
       three and nine. Copying only one of them would make this picture a
       drawing of a clock the phone does not have. */
    const halfW = em * wide / 800 / 2;
    const ring = r - Math.max(em * 0.85, halfW);
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
         + hand(hA, r * 0.54, side * 0.035) + hand(mA, r * 0.80, side * 0.022)
         + `<circle cx="${cx}" cy="${cy}" r="${side * 0.025}" fill="${ink}"/></svg>`;
    return out;
  };

  /* TimeFace, number for number. 8:25 -- the clock most people actually pick
     up a phone to read. */
  const time = (num, h, m) => {
    const side = SIDE - 20;                       /* .padding(10) */
    const box = num ? num.box : 800;
    /* The minute is two signs and the hour may be one, so the em is decided
       off the whole line at once or the size would jump at ten o'clock. */
    const pair = m < 10 ? m + 10 : m;
    const total = widthOf(h, num) + box * 0.42 + widthOf(pair, num);
    const em = Math.min(side * 0.42, side * 0.92 * 800 / total);
    /* Two signs, always: 8:05 and not 8:5. In the language's own base, which
       is why base twelve writes twenty-five past as 2:1. */
    let mp = places(m, num);
    if (mp.length < 2) mp = [0].concat(mp);
    const signs = mp.map((v) => number(v, num, em)).join('');
    /* SepView: a colon unless somebody drew one, in a box em*0.42 wide. */
    const sep = `<span style="display:inline-flex;align-items:center;`
      + `justify-content:center;width:${(em * 0.42).toFixed(2)}px;`
      + `height:${em.toFixed(2)}px;font:500 ${(em * 0.62).toFixed(1)}px `
      + `-apple-system,system-ui,sans-serif;color:${ink}">`
      + `${(num && num.sep && num.sep.r) || ':'}</span>`;
    return `<div style="position:absolute;inset:0;display:flex;`
      + `align-items:center;justify-content:center">`
      + number(h, num, em) + sep + signs + '</div>';
  };

  /* MonthGrid, number for number. The structure is the WORLD's -- twelve
     months, seven columns, Sunday first, the phone's own month -- and what
     the language puts into it is the names and the numerals. www/cal.js.
     A word is set in plain letters here because this page has no
     LinguaScript loaded; shots/widgets-calendar.png is the app itself and
     shows the same grid with every word drawn. */
  const TINT = { 1: '#c95e4c', 7: '#5a8cc2' };
  const month = (num, when, big) => {
    const pad = big ? 14 : 10;
    const W = (big ? 329 : 329) - pad * 2, H = (big ? 345 : 155) - pad * 2;
    const cols = 7, cw = W / cols;
    const headH = H * (big ? 0.09 : 0.13);
    const monH = H * (big ? 0.13 : 0.17);
    const y = when.getFullYear(), mo = when.getMonth();
    const last = new Date(y, mo + 1, 0).getDate();
    const today = when.getDate();
    const col = (d) => new Date(y, mo, d).getDay();
    let rows = 1, prev = col(1);
    for (let d = 2; d <= last; d++) { const c = col(d); if (c <= prev) rows++; prev = c; }
    const ch = Math.max(1, (H - headH - monH) / rows);

    /* The month over the grid, left-aligned, the way a wall calendar and the
       phone's own both put it. */
    const mName = num && num.mon && num.mon[String(when.getMonth() + 1)];
    const head = `<div style="height:${monH.toFixed(1)}px;display:flex;`
      + `align-items:center">`
      + (mName ? wordHTML(mName, monH * 0.72, ink)
               : number(when.getMonth() + 1, num, monH * 0.72))
      + '</div>';

    /* The head of a column: the word somebody made, else the phone's own
       short name. There is always one, because the week here is the world's
       seven. 「ない分の言葉はmondayとかで代用しよう」 */
    let heads = `<div style="display:flex;height:${headH.toFixed(1)}px">`;
    for (let i = 1; i <= cols; i++) {
      const w = num && num.wd && num.wd[String(i)];
      /* 'short' and not 'narrow': narrow is one letter, and one letter in
         English is S M T W T F S. A stand-in is there to be read. */
      const nm = w ? wordHTML(w, headH * 0.62, TINT[i] || ink)
        : new Date(Date.UTC(1970, 0, 3 + i)).toLocaleDateString('en',
            { weekday: 'short', timeZone: 'UTC' });
      heads += `<div style="width:${cw.toFixed(2)}px;height:${headH.toFixed(1)}px;`
        + `display:flex;align-items:center;justify-content:center;opacity:.75;`
        + `font:500 ${(headH * 0.62).toFixed(1)}px -apple-system,system-ui,sans-serif;`
        + `color:${TINT[i] || ink};overflow:hidden;white-space:nowrap">${nm}</div>`;
    }
    heads += '</div>';

    let grid = '', r = 0, seen = -1;
    const at = {};
    for (let d = 1; d <= last; d++) {
      const c = col(d);
      if (d > 1 && c <= seen) r++;
      seen = c;
      at[r + ':' + c] = d;
    }
    for (let rr = 0; rr < rows; rr++) {
      grid += `<div style="display:flex">`;
      for (let cc = 0; cc < cols; cc++) {
        const d = at[rr + ':' + cc];
        grid += `<div style="width:${cw.toFixed(2)}px;height:${ch.toFixed(2)}px;`
          + `position:relative;display:flex;align-items:center;justify-content:center">`;
        if (d) {
          const em = Math.min(ch * 0.62, cw * 0.72);
          /* Today is a filled disc with the number knocked out of it. A disc
             is not a rounded box: the rule is about corners on a rectangle,
             and this has none. */
          if (d === today) {
            const dia = Math.min(cw, ch) * 0.88;
            grid += `<svg style="position:absolute" width="${dia.toFixed(2)}" `
              + `height="${dia.toFixed(2)}"><circle cx="${(dia / 2).toFixed(2)}" `
              + `cy="${(dia / 2).toFixed(2)}" r="${(dia / 2).toFixed(2)}" fill="${ink}"/></svg>`;
          }
          grid += `<span style="position:relative;color:${d === today ? card : (TINT[cc + 1] || ink)}">`
            + tinted(number(d, num, em), d === today ? card : (TINT[cc + 1] || ink))
            + '</span>';
        }
        grid += '</div>';
      }
      grid += '</div>';
    }
    return `<div style="position:absolute;inset:${pad}px">${head}${heads}${grid}</div>`;
  };
  /* number() paints the ink colour into the SVG and into the run of text, so
     a coloured cell has to say so after the fact rather than by inheriting.
     One replace, on the two places the colour was written. */
  const tinted = (s, c) => (c === ink) ? s
    : s.split('fill="' + ink + '"').join('fill="' + c + '"')
       .split('color:' + ink).join('color:' + c);

  const box = (inner, label) =>
    `<figure style="margin:0"><div style="width:${SIDE}px;height:${SIDE}px;position:relative;`
    + `background:${card};border-radius:22px;overflow:hidden">${inner}</div>`
    + `<figcaption style="font:12px system-ui;color:${ink};opacity:.7;margin-top:7px;text-align:center">`
    + `${label}</figcaption></figure>`;

  const col = (k, name) => `<div style="display:flex;flex-direction:column;gap:18px;align-items:center">`
    + `<div style="font:600 13px system-ui;color:${ink}">${name}</div>`
    + box(clock(cases[k], [10, 9]), 'clock') + box(time(cases[k], 8, 25), 'time') + '</div>';

  /* The calendar, at the two sizes it is offered in. One case only: the grid
     is 31 numbers and five of them side by side says nothing the strips below
     do not already say more clearly. */
  const cal = (k, w, h, big, label) =>
    `<figure style="margin:0"><div style="width:${w}px;height:${h}px;position:relative;`
    + `background:${card};border-radius:22px;overflow:hidden">`
    + month(cases[k], NOW, big) + '</div>'
    + `<figcaption style="font:12px system-ui;color:${ink};opacity:.7;margin-top:7px;`
    + `text-align:center">${label}</figcaption></figure>`;

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

  return (FONT ? `<style>@font-face{font-family:'${FAM}';`
    + `src:url(data:font/otf;base64,${FONT}) format('opentype')}</style>` : '')
    + `<div style="background:${ground};padding:26px;font-family:system-ui;width:max-content">`
    + `<div style="display:flex;gap:26px">`
    + col('drawn', 'every digit drawn')
    + col('partial', 'no 7 drawn')
    + col('none', 'nothing drawn yet')
    + col('base12', 'counting in twelve')
    + col('base2', 'counting in two')
    + '</div>'
    + `<div style="display:flex;gap:26px;align-items:flex-start;margin-top:30px">`
    + cal('calendar', 329, 155, false, 'calendar, medium')
    + cal('calendar', 329, 345, true, 'calendar, large')
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
/* ---- and one picture that is not a double at all ------------------------
   Everything above is this file drawing what the Swift draws. This one is the
   APP drawing it: the preview in the digits room, in the real app, with real
   digits and a real month word, through the real font.

   It is here because the month's NAME cannot honestly be faked. A word is set
   in somebody's letters by setting its roman spelling in LinguaScript, and
   LinguaScript is built by the app out of the shapes -- so a picture of a
   month name that this file drew itself would be a picture of this file. */
const app = await br.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 3 });
await app.goto(`http://127.0.0.1:${PORT}/`);
await app.waitForSelector('#splash', { state: 'detached', timeout: 10000 });
await app.evaluate(({ s, D, M }) => {
  eval('(' + s + ')()');
  SET.done = true; SET.plan = 'plus';
  const O = GGRID.inset, K = geStep();
  const lay = (l, shape) => {
    l.st = shape.map((run) => ({ pts: run.map((p) => [O + p[0] * K, O + p[1] * K]) }));
  };
  Object.keys(D).forEach((v) => { const l = numByVal(+v); if (l) lay(l, D[v]); });
  /* Words for the month and for every day of the week, spelled out of letters
     that ARE drawn, so the font has every one of them and the whole calendar
     comes out in somebody's letters. Without these the picture is a page of
     roman, which is a true state and not the one worth looking at.
     The twelve extra shapes are laid down first for the same reason the
     mock above lays them down: the fixture draws three letters, and seven
     weekday names built out of three letters are the same name seven times.
     「そこも自分の言語にしてよ」 */
  const spare = LETTERS.filter((l) => !numIsDigit(l) && !(l.st && l.st.length));
  M.forEach((shape, i) => { if (spare[i]) lay(spare[i], shape); });
  const drawn = LETTERS.filter((l) => l.st && l.st.length && !numIsDigit(l));
  const word = (n, slot, mn) => {
    const pick = [0, 1, 2].map((i) => drawn[(n * 2 + i) % drawn.length]).filter(Boolean);
    if (!pick.length) return;
    WORDS.push({ hw: pick.map((l) => ltName(l)).join(''), mn: mn, pos: 'n',
                 at: 1, slot: slot, sp: pick.map((l) => ({ l: l.id })) });
  };
  for (let i = 1; i <= calMonths(); i++) word(i, 'month.' + i, 'month ' + i);
  for (let i = 1; i <= calWeek(); i++) word(i, 'wday.' + i, 'day ' + i);
  saveLetters(); save(); installScriptFont();
  window.route = 'ltset'; NAV = [{ r: 'ltset', a: 'num' }];
  render();
}, { s: seed.toString(), D: DIGITS, M: MARKS });
await app.waitForTimeout(400);

/* The New letter bar and the tab bar are position:fixed and sit over whatever
   is under them, which is right on a phone. Hiding them for a photograph
   would be photographing a screen that does not exist, so the page is
   SCROLLED instead: put the thing near the top of the window, where nothing
   is over it, and take the picture there. */
for (const [sel, name] of [['.numwrow', 'widgets-in-app'], ['.numcal', 'widgets-calendar']]) {
  const el = await app.$(sel);
  if (!el) continue;
  await el.evaluate((e) => {
    window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 20);
  });
  await app.waitForTimeout(200);
  await el.screenshot({ path: path.join(OUT, name + '.png') });
  console.log('shots/' + name + '.png   <- the app itself, drawn digits and made words');
}
await br.close();
srv.close();
console.log('\nThe data is shareWidget()\'s own and every number is the Swift\'s.');
console.log('What no picture here can say: whether it compiles, or whether');
console.log('SwiftUI lays it out the same. Those are on a phone.');
