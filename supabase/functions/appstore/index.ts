// appstore — what App Store Connect says about takings, downloads and
// subscriptions, for the one account that may see the admin screen.
//
// Why this is a function on the server and not something the app does. It is
// the same argument daily-prompt/index.ts opens with, and it is stronger here:
//
//   1. The key. The phone talks to Supabase directly and there is no server of
//      ours in front of it, so anything the app holds is public -- SB_KEY in
//      www/net.js says so in its own comment. An App Store Connect key in the
//      app would not merely leak the takings: it is a key, and everything that
//      key may do at Apple, anybody with the app may do.
//   2. Apple wants a signed ES256 JWT, and signing means holding the private
//      key. There is nowhere on the phone to hold one.
//   3. Apple answers with a gzipped TSV. Unpacking that is not work an old
//      WKWebView should be asked to do, and www/ is ES5 -- no DecompressionStream.
//
// ---- what was confirmed at Apple before this was written --------------------
//
// docs/FEATURES.md § 8 says, by name: "Sales reports and analytics reports are
// fetched differently, and the second is sometimes 'ask for a report to be
// made, then come back for it'. Check before building. Do not guess."
// It was checked. docs/reports/sales-2026-08-26.md § 1 has the sources.
//
//   * GET /v1/salesReports is SYNCHRONOUS. One request, the report comes back
//     in the body as application/a-gzip -- a gzipped TSV, not JSON. So "every
//     open" is possible, which is what the owner decided.
//   * The App Store ANALYTICS reports are the other shape -- POST a request,
//     then walk reports -> instances -> segments, and the download URL lives
//     five minutes. Nothing here uses them: everything the four numbers need
//     is in the three sales reports below, downloads included.
//   * The data is next-day, in Pacific time. There is no such thing as today's
//     takings. What comes back therefore carries the DAY it is for, and the
//     screen says it -- a number with no date on it is yesterday's read as
//     today's.
//   * reportType / reportSubType / frequency / version is a fixed table at
//     Apple's end, not four free choices. REPORTS below is that table.
//
// ---- what it will not do ----------------------------------------------------
//
// It does not add up two currencies. Apple pays per storefront in the currency
// of that storefront, and turning EUR into JPY needs an exchange rate, which is
// not in this repo and is not Apple's to give either. www/store.js and
// ios/App/App/LinguaStore.swift both carry the same sentence for the same
// reason: "Building '$' + a number is how an app ends up showing dollars to
// somebody being charged yen." So takings come back as a list, one row per
// currency, and the app prints the code Apple sent beside the number.
//
// It does not work out a retention rate. Neither report has such a column;
// getting one means choosing a denominator and a period, and both of those are
// the owner's (docs/FEATURES.md § 8: "Not decided: what a number is called,
// what period it covers"). What comes back is what Apple counted -- how many
// subscriptions are live, how many cancelled, how many renewed.

const ASC = 'https://api.appstoreconnect.apple.com/v1/salesReports';

/* Apple's own table, copied from the documentation rather than guessed at:
   every other combination of the four is a 400.
   https://developer.apple.com/documentation/appstoreconnectapi/get-v1-salesreports */
const REPORTS = {
  sales:  { reportType: 'SALES',              reportSubType: 'SUMMARY', frequency: 'DAILY', version: '1_0' },
  subs:   { reportType: 'SUBSCRIPTION',       reportSubType: 'SUMMARY', frequency: 'DAILY', version: '1_3' },
  events: { reportType: 'SUBSCRIPTION_EVENT', reportSubType: 'SUMMARY', frequency: 'DAILY', version: '1_3' },
};

/* Which Product Type Identifiers are a first-time download, which are the same
   app arriving again, and which are an update. Apple's list, not ours:
   https://developer.apple.com/help/app-store-connect/reference/reporting/product-type-identifiers/
   Three numbers and not one, because "downloads" means a different one of them
   to different people and nobody has said which -- so all three come back and
   the screen shows the first. Everything else in the report is an In-App
   Purchase or a subscription and is counted by the other two reports. */
const NEW_APP = ['1', '1-B', 'F1-B', '1E', '1EP', '1EU', '1F', '1T', 'F1'];
const AGAIN   = ['3', '3F'];
const UPDATE  = ['7', '7F', '7T', 'F7'];

/* How many days back to look before giving up. Apple's data is next-day, so
   the first day asked for is yesterday; a report that is not there yet answers
   404 and the day before is tried. Five is a long weekend plus a day. */
const BACK = 5;

/* The day, in US Pacific -- Apple's day runs 00:00-23:59 Pacific and every
   other date in this project's life already means Pacific for that reason.
   Intl rather than a fixed -08:00, which would be an hour out for eight months
   of the year. daily-prompt/index.ts has the same function for the same
   reason; it is four lines and lives in two Deno functions that share nothing
   else, which is cheaper than a module they both import. */
function pacificDay(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);                       // en-CA gives YYYY-MM-DD
}
function daysAgo(n: number): string {
  return pacificDay(new Date(Date.now() - n * 86400000));
}

/* ---- the token ------------------------------------------------------------
   ES256, and the lifetime is minutes: "For most requests, App Store Connect
   rejects a token with a lifetime greater than 20 minutes." Two is what Apple
   suggests for a one-off request, and every request here is one.

   No library. A .p8 from Apple is a PKCS#8 P-256 private key, which
   crypto.subtle imports as it stands, and WebCrypto's ECDSA signature is
   already the raw r||s pair that JWS wants -- no DER unwrapping. */
function b64url(b: ArrayBuffer | Uint8Array): string {
  const u = b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = '';
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function ascToken(iss: string, kid: string, pem: string): Promise<string> {
  const body = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8', der, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(new TextEncoder().encode(
    JSON.stringify({ alg: 'ES256', kid, typ: 'JWT' })));
  const claims = b64url(new TextEncoder().encode(JSON.stringify(
    { iss, iat: now, exp: now + 120, aud: 'appstoreconnect-v1' })));
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, key,
    new TextEncoder().encode(head + '.' + claims));
  return head + '.' + claims + '.' + b64url(sig);
}

/* ---- one report -----------------------------------------------------------
   Returns the rows, or null when Apple has nothing for that day. Null and not
   [] on purpose, and it is the same sentence adminRow() in www/mod.js says
   about a blank: "a number that has not come back yet is a blank and not a
   nought: nought is a fact about the app and this is a fact about the
   request." Apple answers 404 both for "not ready yet" and for "there were no
   sales", and nothing tells those two apart from out here, so neither becomes
   a nought. */
async function report(tok: string, vendor: string, kind: keyof typeof REPORTS,
                      day: string): Promise<Record<string, string>[] | null> {
  const r = REPORTS[kind];
  const q = new URLSearchParams({
    'filter[reportType]': r.reportType,
    'filter[reportSubType]': r.reportSubType,
    'filter[frequency]': r.frequency,
    'filter[version]': r.version,
    'filter[vendorNumber]': vendor,
    'filter[reportDate]': day,
  });
  const res = await fetch(ASC + '?' + q, {
    headers: { Authorization: 'Bearer ' + tok, Accept: 'application/a-gzip' },
  });
  if (res.status === 404) { await res.body?.cancel(); return null; }
  if (!res.ok) throw new Error(kind + ' ' + res.status + ': ' + (await res.text()).slice(0, 300));

  /* Apple sends application/a-gzip, which is gzip with a content type fetch
     does not unpack for us -- and on a day it decides to set Content-Encoding
     instead, fetch WILL have unpacked it. Both happen, so the bytes are asked
     rather than the headers: 1f 8b is gzip and anything else is already text. */
  const raw = new Uint8Array(await res.arrayBuffer());
  let text: string;
  if (raw[0] === 0x1f && raw[1] === 0x8b) {
    text = await new Response(
      new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))
    ).text();
  } else {
    text = new TextDecoder().decode(raw);
  }
  return tsv(text);
}
function tsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const head = lines[0].split('\t').map((h) => h.trim());
  return lines.slice(1).map((l) => {
    const cells = l.split('\t');
    const row: Record<string, string> = {};
    head.forEach((h, i) => { row[h] = (cells[i] || '').trim(); });
    return row;
  });
}
/* The same day walked backwards until Apple has one. Each report is walked
   separately: they are three files at Apple's end and one being ready says
   nothing about another. */
async function latest(tok: string, vendor: string, kind: keyof typeof REPORTS) {
  for (let i = 1; i <= BACK; i++) {
    const day = daysAgo(i);
    const rows = await report(tok, vendor, kind, day);
    if (rows) return { day, rows };
  }
  return null;
}

function num(s: string): number {
  const n = parseFloat(String(s || '').replace(/,/g, ''));
  return isFinite(n) ? n : 0;
}

/* ---- the four numbers -----------------------------------------------------
   Nothing is converted, nothing is rated, nothing is renamed. What each of
   these is called on the screen, and what period it covers, is the owner's and
   is not decided -- so what comes back is what Apple counted, on the day Apple
   counted it. */
function fromSales(rows: Record<string, string>[]) {
  let fresh = 0, again = 0, updates = 0;
  const money: Record<string, number> = {};
  for (const row of rows) {
    const kind = row['Product Type Identifier'] || '';
    const units = num(row['Units']);
    if (NEW_APP.indexOf(kind) !== -1) fresh += units;
    else if (AGAIN.indexOf(kind) !== -1) again += units;
    else if (UPDATE.indexOf(kind) !== -1) updates += units;
    /* Proceeds are PER UNIT in this report -- the column says so in its own
       name -- so a row of three is three times its own number. Every product
       type counts here, because takings are takings whether they came from the
       app or from a subscription inside it. */
    const cur = row['Currency of Proceeds'] || row['Proceeds Currency'] || '';
    if (cur) money[cur] = (money[cur] || 0) + units * num(row['Developer Proceeds']);
  }
  return {
    downloads: fresh, redownloads: again, updates: updates,
    /* Rounded to the hundredth because a float of a hundred small products is
       a float, and Apple's own numbers have two decimals. */
    money: Object.keys(money).sort().map((cur) => (
      { cur: cur, proceeds: Math.round(money[cur] * 100) / 100 })),
  };
}
/* Every "Active ..." column is a count of live subscriptions in some state, so
   the live count is their sum. Read off the row rather than listed here: Apple
   has added columns to this report before (win-back offers are the newest),
   and a list written out in this file would go quietly out of date -- the new
   column would simply not be counted and the number would be a little low with
   nothing saying so. */
function fromSubs(rows: Record<string, string>[]) {
  let live = 0;
  for (const row of rows) {
    for (const col of Object.keys(row)) {
      if (col.indexOf('Active ') === 0) live += num(row[col]);
    }
  }
  return { live: live };
}
/* Apple's fourteen event names, of which these are the ones about somebody
   staying or going. No rate is worked out from them -- see the head of this
   file. `Quantity` is how many the row stands for. */
function fromEvents(rows: Record<string, string>[]) {
  let cancel = 0, renew = 0, back = 0;
  for (const row of rows) {
    const ev = row['Event'] || '';
    const q = num(row['Quantity']) || 1;
    if (ev === 'Cancel' || ev === 'Canceled from Billing Retry') cancel += q;
    else if (ev === 'Renew') renew += q;
    else if (ev === 'Reactivate') back += q;
  }
  return { cancel: cancel, renew: renew, back: back };
}

/* ---- the door -------------------------------------------------------------
   is_admin() in supabase/schema.sql, asked of the caller's own token, which is
   the same wall admin_counts() stands behind -- 「＠linguaのアカウントだけ管理者
   ページには入れる」. Not is_staff(): staff answer reports, and this is the
   other screen.

   Asked of the server and never worked out here. This function holds a key
   that may read every penny the app has ever taken, so the question of who is
   asking is not one it may answer for itself.

   Anything other than a plain true is a no, including a request that fell over
   -- an admin check that fails open is not a check. */
async function isAdmin(auth: string): Promise<boolean> {
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !anon || !auth) return false;
  try {
    const r = await fetch(url + '/rest/v1/rpc/is_admin', {
      method: 'POST',
      headers: { apikey: anon, Authorization: auth, 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!r.ok) return false;
    return (await r.json()) === true;
  } catch { return false; }
}

/* The app is a page in a WKWebView, so this is a cross-origin request with an
   Authorization header on it, which means the browser asks first. daily-prompt
   needs none of this: cron is not a browser. */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
function say(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body),
    { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (!(await isAdmin(req.headers.get('Authorization') || ''))) {
    return say({ error: 'not admin' }, 403);
  }

  const iss = Deno.env.get('ASC_ISSUER_ID') || '';
  const kid = Deno.env.get('ASC_KEY_ID') || '';
  const pem = Deno.env.get('ASC_PRIVATE_KEY') || '';
  const vendor = Deno.env.get('ASC_VENDOR_NUMBER') || '';

  /* Not a 500, and this is the case that matters most: the very first time
     anybody opens this screen is BEFORE the owner has put the keys in, and a
     screen that is blank because the function fell over looks exactly like a
     screen that is blank because the app is broken. So an answer, saying which
     of the four is missing -- supabase/setup.md § 10-2 is the list. */
  const missing = [
    !iss && 'ASC_ISSUER_ID', !kid && 'ASC_KEY_ID',
    !pem && 'ASC_PRIVATE_KEY', !vendor && 'ASC_VENDOR_NUMBER',
  ].filter(Boolean);
  if (missing.length) return say({ ready: false, missing });

  let tok: string;
  try {
    tok = await ascToken(iss, kid, pem);
  } catch (e) {
    /* A .p8 pasted with something missing off the end of it lands here, and it
       is worth telling apart from Apple refusing the token, which lands below
       as a 401 from Apple with Apple's own words on it. */
    return say({ ready: false, error: 'ASC_PRIVATE_KEY: ' + String(e) }, 500);
  }

  try {
    const [sales, subs, events] = await Promise.all([
      latest(tok, vendor, 'sales'),
      latest(tok, vendor, 'subs'),
      latest(tok, vendor, 'events'),
    ]);
    return say({
      ready: true,
      /* Each half carries its own day, because Apple readies them separately
         and one date over three numbers would be wrong about two of them. A
         half that is not there at all is null, which the screen draws as a
         blank -- see report() above for why that is not a nought. */
      sales: sales && { day: sales.day, ...fromSales(sales.rows) },
      subs: subs && { day: subs.day, ...fromSubs(subs.rows) },
      events: events && { day: events.day, ...fromEvents(events.rows) },
    });
  } catch (e) {
    return say({ ready: false, error: String(e) }, 502);
  }
});
