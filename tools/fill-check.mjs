/* An area is the inside of what somebody drew round, and it has to survive
   being put away.
   ---------------------------------------------------------------------
   Every other shape in this app is a nib swept along a line, and a filled
   stroke is the one that is not: `glyphContours` cuts the inside into
   triangles and adds them to the sweep. Nothing about that can throw -- a
   fill that is silently dropped gives a letter that is merely thinner, on a
   canvas that renders, in a font that installs, with every other check green.
   So it is counted in pixels, through the real drawing code, and asked for
   again after the letter has been saved and read back.

   「塗りボタンオン。緑色の線が出現。三点以上の囲われた部分が塗られる。
     それ以上はなにも起きない」

   Run: node tools/fill-check.mjs                                        */
import { chromium } from 'playwright';
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await br.newPage({ viewport:{width:390,height:844} });
await pg.goto('file://' + path.join(dir,'..','www','index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:10000 });

const r = await pg.evaluate(({s}) => {
  eval('(' + s + ')()');
  SET.done = true; SET.theme = 'light'; SET.myfont = true;
  var o = GGRID.inset, D = geStep(), P = function(i,j){ return [o+i*D, o+j*D]; };
  var out = {};

  /* how much of a 200px square the real drawing code blackens */
  function ink(st){
    var c = document.createElement('canvas'); c.width = 200; c.height = 200;
    var x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, 200, 200);
    inkStrokes(x, st, 200/800, 0, 0, '#000');
    var d = x.getImageData(0, 0, 200, 200).data, n = 0, i;
    for (i = 0; i < d.length; i += 4) if (d[i] < 128) n++;
    return n;
  }

  var tri = [P(4,4), P(16,4), P(10,16)];
  out.outline = ink([{ pts: tri }]);
  out.filled  = ink([{ pts: tri, fill: true }]);

  /* two points have no inside, and asking for one must not change them */
  var line = [P(4,4), P(16,4)];
  out.line     = ink([{ pts: line }]);
  out.lineFill = ink([{ pts: line, fill: true }]);

  /* a shape that crosses itself is still a drawing and must come back */
  var bow = [P(4,4), P(16,16), P(16,4), P(4,16)];
  out.bow     = ink([{ pts: bow }]);
  out.bowFill = ink([{ pts: bow, fill: true }]);

  /* saved, read back, and drawn again -- a flag dropped on the way to
     storage looks exactly like a fill that was never asked for */
  var l = LETTERS[0];
  GE = newGE(l.id, ltName(l));
  GE.st = [{ pts: tri, fill: true }];
  geSave();
  var back = (ltById(l.id) || {}).st || [];
  out.kept = !!(back[0] && back[0].fill);
  out.reopened = ink(back);

  /* and the editor shows an area in its own colour, not the letter's */
  out.green = cssVar('--fill') || '';
  return out;
}, { s: seed.toString() });
await br.close();

var bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

say(r.filled > r.outline * 2,
    'a triangle inks ' + r.outline + 'px drawn and ' + r.filled + 'px filled');
say(r.lineFill === r.line,
    'two points have no inside: ' + r.line + 'px either way');
say(r.bowFill > r.bow,
    'a stroke that crosses itself still inks: ' + r.bow + ' -> ' + r.bowFill + 'px');
say(r.kept, 'the flag is still on the stroke after geSave()');
say(r.reopened === r.filled,
    'saved and read back it draws the same ' + r.reopened + 'px');
say(!!r.green, 'the editor has a colour of its own for an area: ' + r.green);

if (bad.length) { console.error('\nfill: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nfill: an area is drawn, is not invented, and survives being saved.');
