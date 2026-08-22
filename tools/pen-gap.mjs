/* Why the pen is 24 and cannot be wider.
   ------------------------------------------------------------------
   The lattice step is 36. Two strokes on ADJACENT dots are 36 apart, so a pen
   of width w leaves 36-w of white between them -- in font units. What matters
   is not that number but whether any of it survives to a real pixel at the
   size a letter is actually read at, which on the timeline is 44px.

   A pen that does not leave white there is the app producing a letter that is
   not the one somebody drew: two strokes go in and one comes out. Telling
   somebody to leave two dots instead is not an answer, because a letter with
   two dots between its strokes is a different letter.
   「2あけだとだって書いた文字と別のもんができちゃうくない？」「24が限界やね」

   Run: node tools/pen-gap.mjs                                        */
import { chromium } from 'playwright';
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await br.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:3 });
await pg.goto('file://' + path.join(dir,'..','www','index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:10000 });

const out = await pg.evaluate(({s}) => {
  eval('(' + s + ')()');
  SET.done = true; SET.theme = 'light';
  if (typeof applyTheme === 'function') applyTheme();

  var o = GGRID.inset, D = geStep(), S = 3;     /* dpr 3, an actual phone */
  /* two strokes, one dot apart -- the densest thing a letter can do */
  var st = [{pts:[[o+8*D, o+4*D],[o+8*D, o+16*D]]},
            {pts:[[o+9*D, o+4*D],[o+9*D, o+16*D]]}];

  var rows = [];
  [[44,'a post'],[90,'a tile'],[240,'the editor']].forEach(function(at){
    [24,28,32,40].forEach(function(pw){
      var c = document.createElement('canvas');
      c.width = at[0]*S; c.height = at[0]*S;
      var x = c.getContext('2d');
      x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height);
      var was = GPEN.width; GPEN.width = pw;     /* the real drawing code */
      inkStrokes(x, st, c.width/800, 0, 0, '#000000');
      GPEN.width = was;

      /* read one row of pixels across the two strokes, at half height */
      var row = x.getImageData(0, Math.round(c.height/2), c.width, 1).data,
          a = Math.round((o+8*D)/800*c.width),
          b = Math.round((o+9*D)/800*c.width), i, top = 0, white = 0;
      for (i=a; i<=b; i++){ if (row[i*4] > top) top = row[i*4];
                            if (row[i*4] > 200) white++; }
      rows.push([at[1], at[0], pw, top, white]);
    });
  });
  return rows;
}, { s: seed.toString() });
await br.close();

var last = '';
out.forEach(function(r){
  if (r[0] !== last){ console.log(''); last = r[0]; }
  console.log('  ' + (r[0]+' ('+r[1]+'px)').padEnd(18) +
              'pen ' + String(r[2]).padStart(2) +
              '   valley ' + String(r[3]).padStart(3) + '/255' +
              '   white pixels ' + r[4] +
              (r[4] > 0 ? '' : '   <- welded'));
});
console.log('\n  24 is the only one of the four that leaves white at 44px.');
