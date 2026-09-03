/* ---------------------------------------------------------------------------
   tools/gate.mjs — the gate, run the way a laptop can stand.

   Run it:   npm test

   FAST and SLOW below are the whole list, and this comment does not restate
   how many there are: the two numbers written here said thirty-one and
   twenty-three while the lists held thirty-five and twenty-six, and every
   number in CLAUDE.md is a copy of this file's. So the run PRINTS them on
   its last line, green or red -- the same reason `dead-check` prints the
   capabilities it counted instead of leaving the number in prose.

   The SLOW ones each start a headless browser and walk the app -- most over
   a port of their own; `shape-check` opens `index.html`
   off the disk instead, which is why it needs no port. Run one after another
   that is ten minutes, and ten minutes is long enough that a check stops being run
   **Count the checks off FAST and SLOW below and nowhere else.** A number
   written into this comment said thirty-one while the two lists held
   thirty-five, and the same number is copied into CLAUDE.md, which is how a
   stale count spreads. Most of them start a headless browser and walk the app
   -- most over a port of their own; `shape-check` opens `index.html` off the
   disk instead, which is why it needs no port. Run one after another that is
   ten minutes, and ten minutes is long enough that a check stops being run
   after every change and starts being run at the end — which is the one way
   a gate fails: not by being wrong, by being skipped.

   So the ones that need no browser go first, all of them, in about two
   seconds. A missing script tag, an arrow function, or a price list that has
   drifted from `CAN` fails there and nothing heavy is started at all. Then the
   browser ones go WIDE, four at a time, because each is a separate process
   holding its own port and its own Chromium and they have nothing to say to
   each other.

   Four and not sixteen: a headless Chromium is a real browser and this runs
   on whatever is to hand. More than the machine has cores turns a parallel
   run back into a serial one with more memory in it.

   What it does not change is what is checked or what is printed. Every
   check's own output is put out whole, in the order the list below has them
   rather than the order they happen to finish in, so a green run reads the
   same as it always did and a number that moved is still a number that
   moved.
   --------------------------------------------------------------------------- */
import { spawn } from 'child_process';
import os from 'os';

/* No browser: two seconds for all of them, and a failure here means nothing
   heavy was started for nothing. */
const FAST = ['assets-check', 'es5-check', 'grammar-engine-check', 'dead-check', 'import-check', 'sides-check',
              'face-check', 'box-check', 'store-check', 'del-check'];
              'face-check', 'box-check', 'store-check', 'paid-check'];
/* A browser each. The order is the order they are PRINTED in; which one runs
   when is up to the pool. */
const SLOW = ['migrate-check', 'i18n-check', 'act-check', 'conv-check', 'card-check',
              'word-check', 'post-check', 'backup-check', 'fill-check', 'round-check',
              'base-check', 'kb-check', 'plan-check', 'term-check', 'sheet-check',
              'shape-check', 'draft-check', 'gramlang-check', 'world-check', 
              'acct-check', 'page-check', 'dl-check', 'again-check', 'open-check',
              'find-check', 'keep-check', 'press'];
const WIDE = Math.max(1, Math.min(4, (os.cpus() || []).length || 4));

function run(name){
  return new Promise((res) => {
    const p = spawn(process.execPath, ['tools/' + name + '.mjs'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (b) => { out += b; });
    p.stderr.on('data', (b) => { err += b; });
    p.on('close', (code) => res({ name, code, out, err }));
    p.on('error', (e) => res({ name, code: 1, out: '', err: String(e && e.message || e) }));
  });
}
function show(r){
  if (r.out) process.stdout.write(r.out);
  if (r.err) process.stderr.write(r.err);
  /* Say which one, because eleven are running at once now and a check that
     died before printing anything leaves a stack trace nowhere near its own
     heading. */
  if (r.code !== 0) console.error('\n' + r.name + ' FAILED (exit ' + r.code + ')');
}

/* A run that was interrupted leaves its little web server holding its port,
   and the next run's check dies on EADDRINUSE with a trace about `listen`
   and nothing about which check it was. Anything still alive from one of the
   checks is from a run that is over -- this one has not started one yet.

   The pattern names the checks rather than tools/*.mjs. `pkill -f` matches
   whole command lines, and the first version of this matched THIS file's:
   the gate killed itself before running anything and said nothing on the way
   out. */
try {
  const { execSync } = await import('child_process');
  execSync("pkill -f 'tools/press[.]mjs' ; pkill -f 'tools/[a-z-]*-check[.]mjs' ; true",
           { stdio: 'ignore' });
} catch (e) {}

let bad = 0;
/* One at a time and stop at the first, because these are cheap and the later
   ones read the same files the earlier ones would have refused. */
for (const n of FAST){
  const r = await run(n);
  show(r);
  if (r.code !== 0){ console.error('\n' + n + ' failed. Nothing heavy was started.'); process.exit(1); }
}

/* And the rest, four at a time. Every one is run even when one has already
   failed: a gate that stopped at the first would hand back one thing to fix
   per ten minutes, and the whole point of running them at once is to be told
   everything in one go. */
const done = {};
let at = 0;
async function worker(){
  while (at < SLOW.length){
    const n = SLOW[at++];
    done[n] = await run(n);
  }
}
await Promise.all(Array.apply(null, { length: WIDE }).map(() => worker()));

for (const n of SLOW){
  const r = done[n];
  show(r);
  if (r.code !== 0) bad++;
}
/* The count, on every run and not only on a failing one. A green run that
   says nothing about how many checks it was is a green run nobody can read
   the number off, and every number in CLAUDE.md is a copy of this one. */
console.log('\ngate: ' + (FAST.length + SLOW.length) + ' checks -- ' +
            FAST.length + ' with no browser, ' + SLOW.length + ' walking the app.');
if (bad){
  console.error('\n' + bad + ' of ' + (FAST.length + SLOW.length) + ' checks failed.');
  process.exit(1);
}
