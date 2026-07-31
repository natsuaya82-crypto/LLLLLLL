// Spike: user-drawn SVG glyphs -> OTF -> typed as real text in a web view.
// Proves the pipeline Lingua would use: register SVG, design a script, type it in-app.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const ot = require('opentype.js');

// ---------------------------------------------------------------------------
// 1. What a user "registers": SVG path data, y-DOWN, in a 1000x1000 box with
//    the baseline at y=800. This is the normalisation contract.
// ---------------------------------------------------------------------------
const EM = 1000, BASELINE = 800, ASC = 800, DESC = -200;

const drawn = [
  { name: 'ka', roman: 'k', phonemes: ['k'], advance: 620,
    // vertical stem + triangular flag
    d: 'M180 120 L280 120 L280 800 L180 800 Z M280 160 L520 260 L280 360 Z' },
  { name: 'la', roman: 'l', phonemes: ['l'], advance: 660,
    // ring with a tail  (outer contour + inner hole wound the other way)
    d: 'M300 300 C420 300 500 380 500 500 C500 620 420 700 300 700 C180 700 100 620 100 500 C100 380 180 300 300 300 Z'
     + 'M300 400 C240 400 200 445 200 500 C200 555 240 600 300 600 C360 600 400 555 400 500 C400 445 360 400 300 400 Z'
     + 'M470 620 L560 800 L460 800 L400 660 Z' },
  { name: 'i', roman: 'i', phonemes: ['i'], advance: 420,
    // diamond above a short bar
    d: 'M200 260 L320 420 L200 580 L80 420 Z M110 700 L290 700 L290 780 L110 780 Z' },
  { name: 'sha', roman: 's', phonemes: ['ʃ'], advance: 700,
    // three ascending wedges
    d: 'M80 800 L80 560 L200 520 L200 800 Z M260 800 L260 440 L380 400 L380 800 Z M440 800 L440 320 L560 280 L560 800 Z' },
];

// ---------------------------------------------------------------------------
// 2. SVG (y down) -> font units (y up). The single detail that breaks silently
//    if you forget it: the whole glyph renders upside down.
// ---------------------------------------------------------------------------
function toFontPath(d) {
  const src = ot.Path.fromSVG(d);
  const out = new ot.Path();
  out.commands = src.commands.map(function (c) {
    const o = { type: c.type };
    if ('x'  in c) { o.x  = c.x;  o.y  = BASELINE - c.y;  }
    if ('x1' in c) { o.x1 = c.x1; o.y1 = BASELINE - c.y1; }
    if ('x2' in c) { o.x2 = c.x2; o.y2 = BASELINE - c.y2; }
    return o;
  });
  return out;
}

// ---------------------------------------------------------------------------
// 3. Private Use Area assignment, so typed text is REAL text.
// ---------------------------------------------------------------------------
const PUA = 0xE000;
const notdef = new ot.Glyph({ name: '.notdef', unicode: 0, advanceWidth: EM, path: new ot.Path() });
const glyphs = [notdef].concat(drawn.map(function (g, i) {
  return new ot.Glyph({
    name: g.name,
    unicode: PUA + i,
    advanceWidth: g.advance,
    path: toFontPath(g.d),
  });
}));

const font = new ot.Font({
  familyName: 'LinguaScript',
  styleName: 'Regular',
  unitsPerEm: EM,
  ascender: ASC,
  descender: DESC,
  glyphs: glyphs,
});

const buf = Buffer.from(font.toArrayBuffer());
fs.writeFileSync('/tmp/fontspike/LinguaScript.otf', buf);

// ---------------------------------------------------------------------------
// 4. Romanisation -> PUA. This is the in-app input method (IME-style).
// ---------------------------------------------------------------------------
const map = {};
drawn.forEach(function (g, i) { map[g.roman] = String.fromCodePoint(PUA + i); });
function translit(s) {
  return s.toLowerCase().split('').map(function (ch) { return map[ch] || ch; }).join('');
}

const word1 = translit('kali');
const word2 = translit('siklai');

const b64 = buf.toString('base64');
const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
  @font-face{ font-family:'LinguaScript'; src:url(data:font/otf;base64,${b64}) format('opentype'); }
  body{ background:#0d0b09; color:#e8dcc8; font-family:Georgia,serif; padding:36px; }
  h1{ font-size:15px; letter-spacing:.18em; text-transform:uppercase; color:#c9a961; font-weight:400; }
  .script{ font-family:'LinguaScript'; font-size:82px; line-height:1.5; color:#f0e6d2; }
  .row{ border-top:1px solid #2a241c; padding:18px 0; }
  .lbl{ font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:#8a7c66; margin-bottom:8px; }
  input{ font-family:'LinguaScript'; font-size:56px; background:#151109; color:#f0e6d2;
         border:1px solid #3a3126; border-radius:6px; padding:10px 16px; width:92%; }
  .ipa{ font-size:20px; color:#c9a961; }
</style></head><body>
<h1>SVG glyphs &rarr; OTF &rarr; real text</h1>

<div class="row">
  <div class="lbl">typed as "kali" &mdash; rendered from the generated font</div>
  <div class="script">${word1}</div>
  <div class="ipa">/kali/</div>
</div>

<div class="row">
  <div class="lbl">typed as "siklai"</div>
  <div class="script">${word2}</div>
  <div class="ipa">/ʃiklai/</div>
</div>

<div class="row">
  <div class="lbl">live input field (selectable, copyable, real characters)</div>
  <input id="f" value="${word2}${String.fromCodePoint(0x20)}${word1}">
</div>

<div class="row">
  <div class="lbl">all four glyphs, ligature-free, at 3 sizes</div>
  <div class="script" style="font-size:120px">${translit('klis')}</div>
  <div class="script" style="font-size:44px">${translit('klis')}</div>
  <div class="script" style="font-size:22px">${translit('klis')}</div>
</div>
</body></html>`;

fs.writeFileSync('/tmp/fontspike/index.html', html);
console.log('otf bytes      :', buf.length);
console.log('glyphs         :', glyphs.length, '(incl .notdef)');
console.log('codepoints     :', drawn.map(function (g, i) { return g.roman + '=U+' + (PUA + i).toString(16).toUpperCase(); }).join(' '));
console.log('html bytes     :', html.length);
