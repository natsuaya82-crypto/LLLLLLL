/* What index.ts does, driven for real -- the handler that Deno.serve() is
   given, called with a stubbed Deno and a stubbed fetch answering in Apple's
   own column names.
 
   It is NOT in the gate. `npm test` runs tools/gate.mjs, which walks www/ and
   ios/ and knows nothing about supabase/, and this file needs no browser and
   no PostgreSQL -- it is run by hand, the way `npm run rls` is:
 
       node --experimental-strip-types supabase/functions/appstore/check.mjs
 
   Node rather than Deno because Deno is not installed on a Linux CI box and
   the four things worth holding here -- the ES256 signature, the gunzip, the
   arithmetic and the door -- are all standard now: crypto.subtle,
   DecompressionStream, Response and Blob are Node's as well.
 
   Three bugs were put back and watched going red before any of it was
   believed: the two currencies added into one number, a report that never
   arrived coming back as 0 instead of blank, and the admin check answering
   "yes" when it could not ask. */
import { gzipSync } from 'node:zlib';
import { generateKeyPairSync } from 'node:crypto';

const pem = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  .privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

const PLAT = { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_ANON_KEY: 'anon' };
let ENV = { ...PLAT };
let handler = null;
globalThis.Deno = { serve: (h) => { handler = h; }, env: { get: (k) => ENV[k] } };

const SALES = [
  'Provider\tProvider Country\tSKU\tDeveloper\tTitle\tVersion\tProduct Type Identifier\tUnits\tDeveloper Proceeds\tBegin Date\tEnd Date\tCustomer Currency\tCountry Code\tCurrency of Proceeds\tApple Identifier\tCustomer Price',
  'APPLE\tUS\tlingua\tTokinets\tLingua\t1.0\t1F\t3\t0.00\t08/25/2026\t08/25/2026\tJPY\tJP\tJPY\t123\t0',
  'APPLE\tUS\tlingua\tTokinets\tLingua\t1.0\t7F\t9\t0.00\t08/25/2026\t08/25/2026\tJPY\tJP\tJPY\t123\t0',
  'APPLE\tUS\tlingua\tTokinets\tLingua\t1.0\t3F\t2\t0.00\t08/25/2026\t08/25/2026\tJPY\tJP\tJPY\t123\t0',
  'APPLE\tUS\tplus.m\tTokinets\tLingua\t1.0\tIAY\t2\t350.00\t08/25/2026\t08/25/2026\tJPY\tJP\tJPY\t123\t500',
  'APPLE\tUS\tplus.m\tTokinets\tLingua\t1.0\tIAY\t1\t3.49\t08/25/2026\t08/25/2026\tUSD\tUS\tUSD\t123\t4.99',
].join('\n');
const SUBS = [
  'App Name\tSubscription Name\tCustomer Price\tCustomer Currency\tDeveloper Proceeds\tProceeds Currency\tState\tCountry\tActive Standard Price Subscriptions\tActive Free Trial Introductory Offer Subscriptions\tSubscribers',
  'Lingua\tPlus\t500\tJPY\t350\tJPY\t\tJP\t12\t4\t16',
  'Lingua\tPro\t1500\tJPY\t1050\tJPY\t\tJP\t5\t0\t5',
].join('\n');
const EVENTS = [
  'Event Date\tEvent\tApp Name\tSubscription Name\tCountry\tQuantity',
  '2026-08-25\tRenew\tLingua\tPlus\tJP\t9',
  '2026-08-25\tCancel\tLingua\tPlus\tJP\t2',
  '2026-08-25\tCanceled from Billing Retry\tLingua\tPlus\tUS\t1',
  '2026-08-25\tReactivate\tLingua\tPlus\tJP\t1',
].join('\n');

let ADMIN = true, DAYS_READY = 1, DAYS_READY_N = 4, SEEN = [], skipDay = null;
globalThis.fetch = async (url, opt) => {
  const u = String(url);
  if (u.indexOf('/rpc/is_admin') !== -1) {
    return new Response(JSON.stringify(ADMIN), { status: 200 });
  }
  const q = new URL(u).searchParams;
  const type = q.get('filter[reportType]');
  const day = q.get('filter[reportDate]');
  SEEN.push(type + '@' + day);
  const auth = opt.headers.Authorization || '';
  if (auth.split('.').length !== 3) throw new Error('not a JWT: ' + auth);
  /* Apple has DAYS_READY_N days of reports, the newest of them DAYS_READY
     days ago. Anything outside that window is a 404, which is what Apple
     answers both for "not readied" and for "nothing happened". */
  const has = [];
  for (let k = 0; k < DAYS_READY_N; k++)
    has.push(new Date(Date.now() - (DAYS_READY + k) * 86400000)
      .toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }));
  if (has.indexOf(day) < 0 || day === skipDay) return new Response('', { status: 404 });
  const body = type === 'SALES' ? SALES : type === 'SUBSCRIPTION' ? SUBS : EVENTS;
  return new Response(gzipSync(Buffer.from(body)), { status: 200 });
};

await import('./index.ts');

const call = (auth) => handler(new Request('https://x/appstore',
  { method: 'POST', headers: auth ? { Authorization: auth } : {} }));

let fails = 0;
const is = (name, got, want) => {
  const a = JSON.stringify(got), b = JSON.stringify(want);
  if (a !== b) { fails++; console.log('FAIL ' + name + '\n  got  ' + a + '\n  want ' + b); }
  else console.log('ok   ' + name + '  ' + a);
};

/* 1. not admin */
ADMIN = false;
let r = await call('Bearer x');
is('a stranger is refused', r.status, 403);

/* 2. no Authorization at all */
r = await call('');
is('no token is refused', r.status, 403);

/* 3. admin, but no keys yet -- the first open, before the owner has put them in */
ADMIN = true; ENV = { ...PLAT };
r = await call('Bearer x');
is('no keys is not a 500', r.status, 200);
is('no keys says which', (await r.json()).missing,
   ['ASC_ISSUER_ID', 'ASC_KEY_ID', 'ASC_PRIVATE_KEY', 'ASC_VENDOR_NUMBER']);

/* 4. the vendor number alone missing */
ENV = { ...PLAT, ASC_ISSUER_ID: 'i', ASC_KEY_ID: 'k', ASC_PRIVATE_KEY: pem };
is('the fourth key is asked for too', (await (await call('Bearer x')).json()).missing,
   ['ASC_VENDOR_NUMBER']);

/* 5. everything there */
ENV.ASC_VENDOR_NUMBER = '8888';
SEEN = [];
r = await call('Bearer x');
const d = await r.json();
const now = d.now || {};
is('ready', d.ready, true);
is('downloads are first-time only', now.downloads, 3);
is('an update is not a download', now.updates, 9);
is('a re-download is its own number', now.redownloads, 2);
is('one currency is one row, two are two', now.money,
   [{ cur: 'JPY', total: 700 }, { cur: 'USD', total: 3.49 }]);
is('live subscriptions add the Active columns', now.live, 21);
is('both kinds of cancel count', now.cancel, 3);
is('renewals', now.renew, 9);

/* the plan is what the owner asked for: 「どのプランかが大事やろ」 */
is('one row per plan, named by Apple', now.plans.map((p) => p.name), ['Plus', 'Pro']);
is('each plan carries its own count', now.plans.map((p) => p.live), [16, 5]);
is('and its own money, per currency', now.plans[0].money, [{ cur: 'JPY', total: 5600 }]);

/* 「あとは継続率」 -- renewals over renewals plus cancellations */
is('the rate is renew over renew plus cancel', now.keep, 0.75);

/* the line */
is('the line is a day per point', d.series.length, DAYS_READY_N);
is('oldest first', d.series[0].day < d.series[d.series.length - 1].day, true);
is('the headline is the newest day', d.now.day, d.day);

/* 6. yesterday is not ready yet -- it walks back to where the line ends */
DAYS_READY = 3; SEEN = [];
const e = await (await call('Bearer x')).json();
const want3 = new Date(Date.now() - 3 * 86400000)
  .toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
is('walks back to the day Apple has', e.day, want3);
is('and tried the two days before it',
   SEEN.filter((s) => s === 'SALES@' + new Date(Date.now() - 86400000)
     .toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })).length, 1);
is('the line still has its days', e.series.length, DAYS_READY_N);

/* 7. a day in the middle Apple never readied is LEFT OUT, not drawn as 0 */
DAYS_READY = 1; DAYS_READY_N = 4; SEEN = [];
const HOLE = new Date(Date.now() - 3 * 86400000)
  .toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
skipDay = HOLE;
const g = await (await call('Bearer x')).json();
is('a day with no report is not a point', g.series.map((x) => x.day).indexOf(HOLE), -1);
is('and the days either side are still there', g.series.length, DAYS_READY_N - 1);
skipDay = null;

/* 8. nothing ready at all -- an empty line, and no numbers invented */
DAYS_READY = 99;
const f = await (await call('Bearer x')).json();
is('nothing ready is an empty line', [f.day, f.series.length], [null, 0]);
is('and no headline day', f.now === undefined || f.now === null, true);

console.log(fails ? '\n' + fails + ' FAILED' : '\nall green');
process.exit(fails ? 1 : 0);
