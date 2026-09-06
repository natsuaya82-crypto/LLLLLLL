/* ---------------------------------------------------------------------------
   tools/browser.mjs — the one place that opens a browser.

   Eleven of the sixteen checks drive a real Chromium, and every one of them
   carried its own copy of these twenty lines: find playwright, fall back to
   the global install, find the browser binary, fall back to whatever is on
   PATH. Fourteen files in tools/ had the loader and twenty-four had the path.

   That is not a tidiness complaint. Two of the copies had drifted, and the
   way it failed is the way a copied rule always fails — quietly, in the one
   place nobody looked. fill-check and round-check were written with a plain
   `import { chromium } from 'playwright'` instead, which throws at module
   LOAD on a machine where playwright is installed globally rather than into
   node_modules. `npm test` is an && chain, so the gate stopped at check
   fourteen of sixteen and round-check and press never ran at all — not
   "failed", never ran. Nobody noticed, because a gate that stops early still
   prints green-looking output for everything before the stop.

   So it lives here. A check that wants a browser says:

     import { chromium, LAUNCH } from './browser.mjs';
     const br = await chromium.launch(LAUNCH);

   The experiments -- grid-*, pen-*, lattice-truth, script-decide,
   verify-script, font-mock -- are deliberately NOT migrated. They are scripts
   somebody ran once to decide something, they are not in the gate, and
   「一回見るためだけのスクリプトは追わない」.
   --------------------------------------------------------------------------- */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';

/* playwright may be in node_modules or installed globally. A static import
   cannot express "try the other one", because it resolves before any line of
   this file runs — which is the whole bug this file exists to make
   impossible. */
async function loadChromium(){
  const req = createRequire(import.meta.url);
  try { return req('playwright').chromium; } catch (e) {}
  try {
    const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return req(path.join(g, 'playwright')).chromium;
  } catch (e) {}
  console.error('playwright is not installed. npm i -g playwright');
  process.exit(2);
}
export const chromium = await loadChromium();

/* And the browser itself. CHROME_PATH first, then the place the container
   puts it, then nothing at all — which lets playwright use whatever it
   downloaded, rather than failing on a path that is right on one machine. */
export const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';

/* ---- AND THE BROWSER'S OWN 「swipe back」 IS OFF ------------------------
   Chromium navigates its history when a thumb comes in from the edge, and
   `press` is the one check that uses a real touch: `#app{touch-action:pan-y}`
   hands a sideways thumb to the browser on purpose (www/index.html), so the
   browser took it. Three runs in four inside the gate and never alone -- the
   gesture is decided on how fast the thumb moves, and four browsers on four
   cores stretch the 16ms between two touchMoves into something else.

   It has TWO faces and they look nothing alike, which is why it was chased
   twice. With a page behind (playwright opens at about:blank and goto() puts
   the app in front of it) the browser goes back to about:blank and every
   evaluate after that says `here is not defined` -- the app's JS is not
   wrong, it is gone. With nothing behind it the browser still takes the
   thumb and simply goes nowhere, and the check reports 「dragged in from the
   left edge and it did not go back」 about an app that never saw the drag.
   One cause, so one thing turns it off rather than one thing per face.

   `--overscroll-history-navigation=0` is not read by this Chromium at all;
   it was measured. `--disable-features` is what works, and it is a SWITCH:
   Chromium keeps the last one it is given, so passing ours alone would drop
   the sixteen playwright passes -- PaintHolding and Translate among them --
   for every check here. So playwright's own list is read and ours is added
   to it. If that read ever stops working the fallback is ours alone, said
   out loud rather than silently: a browser check that starts behaving
   differently is worth a line on the way past. */
const PW_OFF = (() => {
  try {
    const req = createRequire(import.meta.url);
    const f = req.resolve('playwright-core/package.json');
    const src = fs.readFileSync(path.join(path.dirname(f), 'lib', 'coreBundle.js'), 'utf8');
    const m = /disabledFeatures = \[([\s\S]*?)\]\.filter\(Boolean\)/.exec(src);
    const names = m && m[1].match(/"[A-Za-z][A-Za-z0-9_]*"/g);
    if (names && names.length) return names.map((x) => x.slice(1, -1));
  } catch (e) {}
  console.error('browser.mjs: playwright\'s own --disable-features list could ' +
                'not be read, so only OverscrollHistoryNavigation is turned ' +
                'off and playwright\'s sixteen are back on.');
  return [];
})();
export const ARGS = ['--disable-features=' +
                    PW_OFF.concat(['OverscrollHistoryNavigation']).join(',')];
export const LAUNCH = fs.existsSync(CHROME)
  ? { executablePath: CHROME, args: ARGS } : { args: ARGS };
