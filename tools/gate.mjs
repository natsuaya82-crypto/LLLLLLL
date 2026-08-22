/* The whole gate, in about a quarter of the time.
   ------------------------------------------------------------------
   Sixteen checks run one after another took six to ten minutes on a slow
   container, and eleven of them spend nearly all of that waiting for a
   headless browser rather than for a CPU. So:

     five first, in order, with no browser between them -- assets, es5, dead,
     import, sides. About two seconds, and they are the ones that catch a
     typo, so failing here saves starting eleven browsers at all.

     then the rest, four at a time. Four because each one is a browser and a
     Node process, and past four they queue on memory rather than on cores.

   Every check that stands up a server has its own port, and that is what
   makes this safe to run in parallel: two on one port is one of them failing
   with EADDRINUSE and nothing to do with the code. migrate and press were
   both on 8123.

   Output is kept whole. A check that passes prints its lines when it
   finishes, in the order the list has them, not interleaved with three other
   checks -- a green run reads the same as it always did.

   Run: node tools/gate.mjs   (this is `npm test`)                      */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));

/* No browser. Two seconds between them, so they go first and in order. */
const QUICK = ['assets', 'es5', 'dead', 'import', 'sides'];
/* A browser each. */
const SLOW = ['migrate', 'i18n', 'act', 'conv', 'card', 'word', 'post',
              'backup', 'fill', 'round', 'base', 'gram', 'press'];
const LANES = 4;

/* press is `press.mjs`; every other one is `<name>-check.mjs`. */
function fileOf(name){ return name === 'press' ? 'press.mjs' : name + '-check.mjs'; }
function run(name) {
  return new Promise(done => {
    const p = spawn(process.execPath, [path.join(dir, fileOf(name))],
                    { cwd: path.join(dir, '..') });
    let out = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { out += d; });
    p.on('close', code => done({ name, code, out }));
  });
}

const t0 = Date.now();
const failed = [];

for (const name of QUICK) {
  const r = await run(name);
  process.stdout.write(r.out);
  if (r.code !== 0) {
    console.error('\n' + name + ': FAILED — the five that need no browser run first, ' +
                  'so nothing else was started.');
    process.exit(1);
  }
}

/* Four lanes over the rest, printed in list order as each finishes. */
const results = new Array(SLOW.length);
let next = 0, printed = 0;
function flush() {
  while (printed < results.length && results[printed]) {
    const r = results[printed];
    process.stdout.write(r.out);
    if (r.code !== 0) failed.push(r.name);
    printed++;
  }
}
await Promise.all(Array.from({ length: Math.min(LANES, SLOW.length) }, async () => {
  for (;;) {
    const i = next++;
    if (i >= SLOW.length) return;
    results[i] = await run(SLOW[i]);
    flush();
  }
}));
flush();

const secs = Math.round((Date.now() - t0) / 1000);
if (failed.length) {
  console.error('\ngate: ' + failed.length + ' FAILED — ' + failed.join(', ') +
                '  (' + secs + 's)');
  process.exit(1);
}
console.log('\ngate: all ' + (QUICK.length + SLOW.length) + ' green in ' + secs + 's.');
