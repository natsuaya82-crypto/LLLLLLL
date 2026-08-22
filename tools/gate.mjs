/* ---------------------------------------------------------------------------
   tools/gate.mjs — the gate, run the way it is meant to be run.

   Run it:   npm test

   Seventeen checks used to be one `&&` chain. Two things were wrong with that
   and only one of them is speed.

   The one that is not speed: an `&&` chain STOPS at the first failure, so a
   check that dies at module load takes every check after it with it and
   prints nothing to say so. fill-check and round-check did exactly that for
   as long as anybody had playwright installed globally, and round and press
   never ran at all -- not "failed", never ran, with the output above the stop
   looking perfectly green. This file runs every check whatever the others do
   and reports all of them, so a gate that is red is red in a countable number
   of places.

   And the speed. Six of the seventeen need no browser and take about two
   seconds between them, so they go first, in order, and a failure there stops
   the run before a browser is ever started -- there is no point launching
   eleven Chromiums to be told a comment closed a line early. The other eleven
   each open their own Chromium and spend most of their time waiting for it,
   so they run four at a time.

   FOUR, not eleven. Each of these drives a real browser rendering a real app;
   eleven at once on a laptop makes them slower than four and makes press --
   which measures 44pt tap targets on a laid-out page -- measure a page that
   was laid out while the CPU was somewhere else. Four is the number that
   fits.

   Each browser check binds its own port, and that is load-bearing now rather
   than a coincidence. press and migrate-check both used 8123, which could
   never matter while they ran one after another; run them together and one of
   them dies on EADDRINUSE. Adding a browser check means giving it a port
   nothing else has -- the list is in press.mjs, beside its own.
   --------------------------------------------------------------------------- */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/* No browser: about two seconds between them, so a broken comment or a
   hard-coded family is known before anything heavy starts. */
const QUICK = ['assets-check', 'es5-check', 'dead-check', 'import-check',
               'sides-check', 'face-check'];
/* A browser each. i18n and press are the long two, so they start first --
   with four lanes, the finish is whenever the longest one finishes, and a
   long check started last is the whole run's length added to the end. */
const HEAVY = ['i18n-check', 'press', 'act-check', 'migrate-check',
               'conv-check', 'card-check', 'word-check', 'post-check',
               'backup-check', 'fill-check', 'round-check'];
const LANES = 4;

function run(name){
  return new Promise((done) => {
    const t0 = Date.now();
    const p = spawn(process.execPath, [path.join(HERE, name + '.mjs')], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { err += d; });
    p.on('close', code => done({ name, code, out, err, ms: Date.now() - t0 }));
    p.on('error', e => done({ name, code: 1, out, err: String(e && e.message || e), ms: Date.now() - t0 }));
  });
}

function show(r){
  const secs = (r.ms / 1000).toFixed(1) + 's';
  if (r.code === 0){
    process.stdout.write(r.out);
    if (r.err.trim()) process.stdout.write(r.err);
  } else {
    console.log('\n===== ' + r.name + ' FAILED (' + secs + ') =====');
    process.stdout.write(r.out);
    process.stdout.write(r.err);
  }
}

const results = [];

/* ---- the quick ones, in order, and stop on the first red ---------------- */
for (const name of QUICK){
  const r = await run(name);
  results.push(r);
  show(r);
  if (r.code !== 0){
    console.error('\ngate: ' + name + ' is red, and it needs no browser. The other ' +
                  (QUICK.length + HEAVY.length - results.length) + ' were not run —\n' +
                  'there is nothing to learn from eleven browsers about a file that\n' +
                  'does not parse. Fix this one and run `npm test` again.\n');
    process.exit(1);
  }
}

/* ---- the eleven, four at a time ---------------------------------------- */
const queue = HEAVY.slice();
const heavy = [];
await Promise.all(Array.from({ length: LANES }, async () => {
  for (;;){
    const name = queue.shift();
    if (!name) return;
    const r = await run(name);
    heavy.push(r);
    results.push(r);
  }
}));
/* Printed in the order they are listed, not the order they happened to
   finish, so two runs of a green gate read the same. */
HEAVY.forEach(n => show(heavy.find(r => r.name === n)));

const bad = results.filter(r => r.code !== 0);
console.log('');
if (bad.length){
  console.error('gate: ' + bad.length + ' of ' + results.length + ' checks are red — ' +
                bad.map(r => r.name.replace('-check', '')).join(', '));
  console.error('Every check was run. An && chain would have shown you the first one only.\n');
  process.exit(1);
}
console.log('gate: all ' + results.length + ' checks green (' + QUICK.length +
            ' without a browser, then ' + HEAVY.length + ' in ' + LANES + ' lanes)');
