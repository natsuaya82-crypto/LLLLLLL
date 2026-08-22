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
export const LAUNCH = fs.existsSync(CHROME) ? { executablePath: CHROME } : {};
