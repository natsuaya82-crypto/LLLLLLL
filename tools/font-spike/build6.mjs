// The decision page. Square cell is chosen, so everything that was only there to
// argue for it is gone: no proportional row, no de Bruijn grid, no calibration
// table, no cv numbers, no 12/15/22px ladder, no 120 pen.
//
// What is settled, and therefore shown once as a statement and never compared:
//   square cell (advance = the 800 authoring square), fixed pen, 17px phone text.
//
// What is left to decide, and therefore the only thing on the page:
//   1. where the drawing sits inside its cell  -> A as drawn / B centred / C filled
//   2. how thick the one fixed pen is          -> 60 or 90
//
// Six fonts, because those are 3 x 2. Nothing else is built.
import { createRequire } from 'module';
import fs from 'fs';

const realLog = console.log;
console.log = function () {};
const v5 = await import('./build5.mjs');   // regenerates the v5 artefacts; silenced
console.log = realLog;
const { buildFont } = v5;

const HERE = new URL('.', import.meta.url).pathname;
const PLACE = [
  { key: 'asdrawn', tag: 'A', name: 'as drawn' },
  { key: 'center',  tag: 'B', name: 'centred in the cell' },
  { key: 'fit',     tag: 'C', name: 'scaled to fill the cell' },
];
const PENS = [60, 90];

const fonts = {};
PLACE.forEach(function (p) {
  PENS.forEach(function (w) {
    const id = p.key + '-' + w;
    fonts[id] = buildFont(p.key, { pen: { width: w, angleDeg: 0, contrast: 1.0 } });
    fs.writeFileSync(HERE + 'LS6-' + id + '.otf', fonts[id].buf);
  });
});

const WORD = 'ashi kilt hasa talish shakil';
const KANA = 'あしき かると はさ たりし しゃきる';
const fam = function (p, w) { return 'V6-' + p + '-' + w; };

let css = '';
Object.keys(fonts).forEach(function (id) {
  css += '@font-face{font-family:\'V6-' + id + '\';src:url(data:font/otf;base64,'
    + fonts[id].buf.toString('base64') + ') format(\'opentype\');}\n';
});

const head = '<!doctype html><html><head><meta charset="utf-8"><style>\n' + css
  + 'html,body{margin:0;background:#0d0b07;color:#f0e6d2;'
  + 'font-family:-apple-system,"DejaVu Sans",sans-serif;}\n'
  + 'body{padding:44px 52px 60px;}\n'
  + 'h1{font-family:Georgia,serif;font-size:19px;font-weight:400;letter-spacing:.14em;'
  + 'text-transform:uppercase;color:#c9a961;margin:0 0 6px;}\n'
  + '.sub{font-size:13px;color:#8a7c66;margin:0 0 34px;line-height:1.7;max-width:760px;}\n'
  + '.sec{border-top:1px solid #211c15;padding:26px 0 4px;}\n'
  + '.q{font-family:Georgia,serif;font-size:15px;color:#c9a961;margin:0 0 3px;}\n'
  + '.qs{font-size:12px;color:#7d7160;margin:0 0 22px;}\n'
  + '.opt{display:flex;align-items:baseline;margin:0 0 20px;}\n'
  + '.tag{width:26px;flex:none;font-family:Georgia,serif;font-size:17px;color:#c9a961;}\n'
  + '.nm{width:190px;flex:none;font-size:11px;color:#7d7160;letter-spacing:.05em;}\n'
  + '.sm{font-size:17px;color:#f0e6d2;}\n'
  + '.lg{font-size:52px;color:#f0e6d2;}\n'
  + '.ref .tag,.ref .nm{color:#5d5449;}\n'
  + '.ref .sm{color:#9d8e76;}\n'
  + '.jp{font-family:"Noto Sans CJK JP","IPAGothic",sans-serif;}\n'
  + '.sys{font-family:-apple-system,"DejaVu Sans",sans-serif;}\n'
  + '.big{display:flex;align-items:center;margin:0 0 10px;}\n'
  + '</style></head><body>';

const optRow = function (tag, name, cls, style, text) {
  return '<div class="opt' + (cls ? ' ' + cls : '') + '"><div class="tag">' + tag
    + '</div><div class="nm">' + name + '</div><div class="sm"' + style + '>' + text
    + '</div></div>';
};

let b = '<h1>Two things left to choose</h1>';
b += '<p class="sub">Settled: one letter is one square cell, the pen is a single fixed '
  + 'width, and the type is iOS body size. Everything below is at 17px, and every line '
  + 'is the same five words.</p>';

// 1. placement, at pen 60
b += '<div class="sec"><p class="q">1 &nbsp; Where does the drawing sit inside its cell?</p>'
  + '<p class="qs">pen 60 in all three &mdash; only the position changes</p>';
PLACE.forEach(function (p) {
  b += optRow(p.tag, p.name, '', ' style="font-family:\'' + fam(p.key, 60) + '\'"', WORD);
});
b += optRow('&mdash;', 'real kana, same 17px', 'ref', ' class="sm jp"', KANA);
b += '</div>';

// 2. pen width
b += '<div class="sec"><p class="q">2 &nbsp; How thick is the fixed pen?</p>'
  + '<p class="qs">option B in both &mdash; only the thickness changes. the choice in 1 '
  + 'does not affect this</p>';
PENS.forEach(function (w) {
  b += optRow(String(w), w === 60 ? 'your pick, seen at 17px' : 'one step heavier', '',
    ' style="font-family:\'' + fam('center', w) + '\'"', WORD);
});
b += optRow('&mdash;', 'the app\'s own UI text', 'ref', ' class="sm sys"', WORD);
b += '</div>';

// 3. the same three placements, large, because C changes the letterforms
b += '<div class="sec"><p class="q">1, seen large</p>'
  + '<p class="qs">C stretches each letter to fill the cell, which changes the shapes '
  + 'themselves &mdash; look at the ring of "a" and the dot-less "i"</p>';
PLACE.forEach(function (p) {
  b += '<div class="big"><div class="tag">' + p.tag + '</div>'
    + '<div class="lg" style="font-family:\'' + fam(p.key, 60) + '\'">kalisht</div></div>';
});
b += '</div>';

fs.writeFileSync(HERE + 'index6.html', head + b + '</body></html>');

console.log('LS6-{' + PLACE.map(function (p) { return p.key; }).join(',') + '}-{60,90}.otf'
  + ' + index6.html written');
PLACE.forEach(function (p) {
  PENS.forEach(function (w) {
    const f = fonts[p.key + '-' + w];
    console.log('  ' + (p.tag + ' ' + p.key + ' pen ' + w).padEnd(24) + f.buf.length + ' bytes'
      + '   advance ' + f.metrics.a.adv + ' = cell   space ' + f.spaceAdv);
  });
});
