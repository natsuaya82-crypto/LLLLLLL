/* ---------------------------------------------------------------------------
   tools/verify-check.mjs — Apple の署名を、自分で作った鎖で試す。

   実行:  npm run vplan          (browser は要りません。1 秒ほど)

   なぜ要るか。2026-09-06 まで、段（plus/pro）は**端末が言った値**でした ──
   `netPlanUp()` が `/rest/v1/plan` に POST し、サーバーはそれを書き留めるだけ。
   schema.sql の注記が自分でそう言っていました：「anybody who can send this
   database a request can set their OWN plan to 'pro'」。段はサーバーが決める
   ことになり（OWNER 2026-09-06）、決めるにはこちらで署名を見るしかありません。

   署名の検証は**何も投げない種類の仕事**です。鎖の途中を見ていなくても、根を
   名前で照らしていても、期限を見ていなくても、正しい受領書は正しく通る。壊れて
   いることが分かるのは、偽の受領書を持った誰かが Pro になった日です。だから
   ここは「正しいものが通る」だけでなく、**偽物が落ちること**を一つずつ試します。

   自分で作った鎖：この検査は P-256 の鍵を三つ作り、根・中間・葉の X.509 を
   その場で組み、取引に署名します。Apple の根証明書は要りません ── 
   supabase/functions/verify-plan/verify.mjs は根と時刻を**注入**される形に
   なっていて、それがこの検査を可能にしている設計そのものです。

   そして試験対象そのものを import します。検査が自分で検証を書き直したら、それは
   写しであって、写しは必ず一致します（CLAUDE.md § 10, § 12 と同じ理由）。
   --------------------------------------------------------------------------- */
import { verifyJws, bindOf, decidePlan, BUNDLE } from
  '../supabase/functions/verify-plan/verify.mjs';
import { gpRow, gpCheck, isPair, assertion, accessToken, readKey, gpKey, TOKEN_URL } from
  '../supabase/functions/verify-plan/google.mjs';

const subtle = crypto.subtle;
let bad = 0, said = 0;
function say(name, got, want) {
  said++;
  const ok = String(got) === String(want);
  if (!ok) { bad++; console.log('  ✗ ' + name + '\n      got ' + got + '\n      want ' + want); }
  else console.log('  ✓ ' + name);
}

/* ---- DER を書く。証明書を組むのに要るぶんだけ ------------------------- */
function len(n) {
  if (n < 0x80) return [n];
  const b = [];
  let v = n;
  while (v > 0) { b.unshift(v & 0xff); v = Math.floor(v / 256); }
  return [0x80 | b.length].concat(b);
}
function tag(t, body) { return Uint8Array.from([t].concat(len(body.length), Array.from(body))); }
function cat(...xs) {
  const n = xs.reduce((a, x) => a + x.length, 0);
  const out = new Uint8Array(n);
  let i = 0;
  for (const x of xs) { out.set(x, i); i += x.length; }
  return out;
}
const seq = (...xs) => tag(0x30, cat(...xs));
const set = (...xs) => tag(0x31, cat(...xs));
function int(bytes) {
  let v = Uint8Array.from(bytes);
  let z = 0;
  while (z < v.length - 1 && v[z] === 0 && !(v[z + 1] & 0x80)) z++;
  v = v.subarray(z);
  if (v[0] & 0x80) v = cat(Uint8Array.from([0]), v);
  return tag(0x02, v);
}
function oid(s) {
  const p = s.split('.').map(Number);
  const out = [p[0] * 40 + p[1]];
  for (let i = 2; i < p.length; i++) {
    const stack = [];
    let v = p[i];
    do { stack.unshift(v & 0x7f); v = Math.floor(v / 128); } while (v > 0);
    for (let k = 0; k < stack.length - 1; k++) stack[k] |= 0x80;
    out.push(...stack);
  }
  return tag(0x06, Uint8Array.from(out));
}
const bits = (b) => tag(0x03, cat(Uint8Array.from([0]), b));
function utc(ms) {
  const d = new Date(ms), p = (n) => String(n).padStart(2, '0');
  return tag(0x17, new TextEncoder().encode(
    p(d.getUTCFullYear() % 100) + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) +
    p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds()) + 'Z'));
}
const name = (cn) => seq(set(seq(oid('2.5.4.3'), tag(0x0c, new TextEncoder().encode(cn)))));
const ECDSA_SHA256 = seq(oid('1.2.840.10045.4.3.2'));

const b64 = (u8) => btoa(String.fromCharCode.apply(null, Array.from(u8)));
const b64u = (u8) => b64(u8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/* raw r‖s を DER の SEQUENCE{r,s} に。証明書の署名はそちらの形。 */
function toDerSig(raw) {
  const n = raw.length / 2;
  return seq(int(raw.subarray(0, n)), int(raw.subarray(n)));
}

async function keypair() {
  const k = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  return { pub: k.publicKey, key: k.privateKey,
           spki: new Uint8Array(await subtle.exportKey('spki', k.publicKey)) };
}
/* 一枚。`by` が無ければ自分で自分に署名する（＝根）。 */
async function cert(who, serial, sub, by, from, to) {
  const tbs = seq(
    tag(0xa0, int([2])), int([serial]), ECDSA_SHA256,
    name(by ? by.cn : sub.cn), seq(utc(from), utc(to)), name(sub.cn), sub.spki);
  const signer = by || sub;
  const raw = new Uint8Array(await subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, signer.key, tbs));
  return seq(tbs, ECDSA_SHA256, bits(toDerSig(raw)));
}
async function jws(chain, leaf, payload) {
  const head = { alg: 'ES256', x5c: chain.map(b64) };
  const p = b64u(new TextEncoder().encode(JSON.stringify(head))) + '.' +
            b64u(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, leaf.key, new TextEncoder().encode(p)));
  return p + '.' + b64u(sig);
}

/* ---- 舞台 -------------------------------------------------------------- */
const NOW = Date.UTC(2026, 8, 6, 12, 0, 0);
const DAY = 86400000;
const A = 'a0000000-0000-4000-8000-000000000001';
const B = 'b0000000-0000-4000-8000-000000000002';

const rootK = await keypair(); rootK.cn = 'Test Root';
const midK  = await keypair(); midK.cn  = 'Test Intermediate';
const leafK = await keypair(); leafK.cn = 'Test Leaf';
const rootDer = await cert(null, 1, rootK, null,     NOW - 400 * DAY, NOW + 400 * DAY);
const midDer  = await cert(null, 2, midK,  rootK,    NOW - 300 * DAY, NOW + 300 * DAY);
const leafDer = await cert(null, 3, leafK, midK,     NOW - 200 * DAY, NOW + 200 * DAY);
const CHAIN = [leafDer, midDer, rootDer];
const ROOTS = [rootDer];

/* もう一本、まるごと別の鎖。Apple が署名していない受領書はこれです。 */
const evilRootK = await keypair(); evilRootK.cn = 'Somebody Else Root';
const evilLeafK = await keypair(); evilLeafK.cn = 'Somebody Else Leaf';
const evilRoot = await cert(null, 1, evilRootK, null,      NOW - 400 * DAY, NOW + 400 * DAY);
const evilLeaf = await cert(null, 3, evilLeafK, evilRootK, NOW - 200 * DAY, NOW + 200 * DAY);

function tx(over) {
  return Object.assign({
    transactionId: '2000000000000001',
    originalTransactionId: '2000000000000001',
    bundleId: BUNDLE,
    productId: 'com.tokinets.lingua.pro.monthly',
    purchaseDate: NOW - 10 * DAY,
    expiresDate: NOW + 20 * DAY,
    appAccountToken: A,
    environment: 'Sandbox',
    type: 'Auto-Renewable Subscription',
  }, over || {});
}
const opt = { roots: ROOTS, now: NOW, subtle };
const check = (j, o) => verifyJws(j, Object.assign({}, opt, o || {}));

console.log('verify: 自分で作った鎖で署名した取引を、検証の一枚に通す');

/* 1. 正しい鎖は通る。 */
let r = await check(await jws(CHAIN, leafK, tx()));
say('正しい鎖で署名した取引は通る', r.ok + ' ' + (r.why || ''), 'true ');
say('通った取引の商品が読める', r.ok && r.payload.productId, 'com.tokinets.lingua.pro.monthly');

/* 2. 鎖が違えば落ちる。三通りあり、三通りとも別の落ち方です。 */
r = await check(await jws([evilLeaf, evilRoot], evilLeafK, tx()));
say('信じていない根で終わる鎖は落ちる', r.ok, 'false');

/* 葉だけ入れ替える ── 鎖の見た目は Apple のもの、署名した鍵は別人。 */
r = await check(await jws(CHAIN, evilLeafK, tx()));
say('鎖は正しく取引の署名が別の鍵なら落ちる', r.ok, 'false');

/* 中間を抜いて、葉を根に直接ぶら下げる。 */
r = await check(await jws([leafDer, rootDer], leafK, tx()));
say('中間の抜けた鎖は落ちる', r.ok, 'false');

/* 3. 中身を書き換えれば落ちる。署名は中身の上にあります。 */
{
  const good = await jws(CHAIN, leafK, tx({ productId: 'com.tokinets.lingua.plus.monthly' }));
  const parts = good.split('.');
  const forged = b64u(new TextEncoder().encode(JSON.stringify(tx())));
  r = await check(parts[0] + '.' + forged + '.' + parts[2]);
  say('中身を pro に書き換えた取引は落ちる', r.ok, 'false');
}

/* 4. 期限。証明書の期限と、取引の期限は別のことです。 */
r = await check(await jws(CHAIN, leafK, tx()), { now: NOW + 500 * DAY });
say('証明書の期限を過ぎた鎖は落ちる', r.ok, 'false');

/* 5. 別のアプリの受領書は、Apple が署名していても別のアプリのもの。 */
r = await check(await jws(CHAIN, leafK, tx({ bundleId: 'com.example.other' })));
say('別のアプリの取引は落ちる', r.ok, 'false');

/* 6. 根を渡さなければ何も通らない ── 環境変数が無い函数は、誰にも段を付けない。 */
r = await verifyJws(await jws(CHAIN, leafK, tx()), { now: NOW, subtle, roots: [] });
say('根が無ければ何も通らない', r.ok, 'false');

/* ---- 誰のものか -------------------------------------------------------- */
console.log('verify: 段はアカウントに束縛される');
say('自分の uid が入った取引は自分のもの', bindOf(tx(), A, null), 'ok');
say('別の uid が入った取引は拒む', bindOf(tx(), B, null) === 'ok', 'false');
say('uid の大小文字は同じもの', bindOf(tx({ appAccountToken: A.toUpperCase() }), A, null), 'ok');
say('token の無い古い取引は最初に来た uid に付く', bindOf(tx({ appAccountToken: null }), A, null), 'ok');
say('束縛された後の別の uid は拒む',
    bindOf(tx({ appAccountToken: null }), B, { uid: A }) === 'ok', 'false');
say('束縛された本人は通る', bindOf(tx({ appAccountToken: null }), A, { uid: A }), 'ok');
say('token が在れば古い行より token が勝つ', bindOf(tx(), A, { uid: B }), 'ok');
say('誰でもない者には付かない', bindOf(tx(), '', null) === 'ok', 'false');

/* ---- 段を決める -------------------------------------------------------- */
console.log('verify: 残った取引から段が決まる');
const P = (o) => tx(o);
say('何も無ければ free', decidePlan([], { now: NOW }).plan, 'free');
say('期限内の pro は pro', decidePlan([P()], { now: NOW }).plan, 'pro');
say('期限切れは free', decidePlan([P({ expiresDate: NOW - DAY })], { now: NOW }).plan, 'free');
say('取り消されたものは数えない',
    decidePlan([P({ revocationDate: NOW - DAY })], { now: NOW }).plan, 'free');
say('pro と plus が両方あれば pro', decidePlan(
  [P({ productId: 'com.tokinets.lingua.plus.monthly' }), P()], { now: NOW }).plan, 'pro');
say('順に関係なく pro', decidePlan(
  [P(), P({ productId: 'com.tokinets.lingua.plus.monthly' })], { now: NOW }).plan, 'pro');
say('売っていない商品は段を付けない',
    decidePlan([P({ productId: 'com.example.other' })], { now: NOW }).plan, 'free');
say('期限切れの pro と生きている plus なら plus', decidePlan(
  [P({ expiresDate: NOW - DAY }),
   P({ productId: 'com.tokinets.lingua.plus.yearly' })], { now: NOW }).plan, 'plus');
say('同じ段が二つなら遅い方まで', decidePlan(
  [P(), P({ productId: 'com.tokinets.lingua.pro.yearly', expiresDate: NOW + 300 * DAY })],
  { now: NOW }).until, String(NOW + 300 * DAY));
say('free に日付は無い', decidePlan([], { now: NOW }).until, '0');

/* ---- Google Play ------------------------------------------------------
   Google は端末に署名を渡さないので、確かめるのはサーバーが Google に訊いた
   答えです。ここでは **Google の答えを作って** google.mjs に渡します ──
   fetch を注入して、試験対象そのものを走らせる。 */
console.log('verify: Google Play の購入は、訊いた答えとアカウントで決まる');
const GNOW = Date.UTC(2026, 8, 27);
const gsub = (o) => Object.assign({
  subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
  acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
  externalAccountIdentifiers: { obfuscatedExternalAccountId: A },
  lineItems: [{ productId: 'com.tokinets.lingua.pro.monthly',
                expiryTime: new Date(GNOW + 20 * DAY).toISOString() }],
}, o || {});
const gp = (o) => gpRow(gsub(o), 'tok-1', A, { now: GNOW });
const gplan = (o) => {
  const r = gp(o);
  if (!r.ok) return 'refused';
  return decidePlan([{ productId: r.row.product,
                       expiresDate: r.row.until ? Date.parse(r.row.until) : 0 }], { now: GNOW }).plan;
};
say('iPhone の文字列は Google の組ではない', isPair('a.b.c'), 'false');
say('{token, product} は Google の組', isPair({ token: 't', product: 'p' }), 'true');
say('空のトークンは組ではない', isPair({ token: '', product: 'p' }), 'false');
say('自分の uid が付いた ACTIVE の pro は pro', gplan(), 'pro');
say('期限は Google の expiryTime', gp().row.until, new Date(GNOW + 20 * DAY).toISOString());
say('行の鍵は gp: とトークン', gp().row.orig_tx, gpKey('tok-1'));
say('別の uid が付いた購入は拒む',
    gp({ externalAccountIdentifiers: { obfuscatedExternalAccountId: B } }).why, 'another account');
say('uid の付いていない購入は拒む', gp({ externalAccountIdentifiers: {} }).why,
    'no account on the purchase');
say('uid の大小文字は同じもの',
    gp({ externalAccountIdentifiers: { obfuscatedExternalAccountId: A.toUpperCase() } }).ok, 'true');
say('解約済み（CANCELED）でも期限までは数える',
    gplan({ subscriptionState: 'SUBSCRIPTION_STATE_CANCELED' }), 'pro');
say('猶予期間（IN_GRACE_PERIOD）は数える',
    gplan({ subscriptionState: 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD' }), 'pro');
say('EXPIRED は期限が先にあっても数えない',
    gplan({ subscriptionState: 'SUBSCRIPTION_STATE_EXPIRED' }), 'free');
say('ON_HOLD は数えない', gplan({ subscriptionState: 'SUBSCRIPTION_STATE_ON_HOLD' }), 'free');
say('PENDING は数えない', gplan({ subscriptionState: 'SUBSCRIPTION_STATE_PENDING' }), 'free');
say('期限の過ぎた ACTIVE は数えない', gplan({ lineItems: [{
  productId: 'com.tokinets.lingua.pro.monthly', expiryTime: new Date(GNOW - DAY).toISOString() }] }), 'free');
say('売っていない商品は拒む',
    gp({ lineItems: [{ productId: 'com.example.other', expiryTime: new Date(GNOW + DAY).toISOString() }] }).why,
    'not a product we sell');
say('plus の年は plus', gplan({ lineItems: [{
  productId: 'com.tokinets.lingua.plus.yearly', expiryTime: new Date(GNOW + 300 * DAY).toISOString() }] }), 'plus');
say('テストの購入はそう書く', gp({ testPurchase: {} }).row.env, 'GoogleTest');
say('承認済みなら承認しない', gp().ack, 'false');
say('承認待ちなら承認する', gp({ acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING' }).ack, 'true');
say('数えない状態は承認しない', gp({ subscriptionState: 'SUBSCRIPTION_STATE_PENDING',
  acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING' }).ack, 'false');
say('誰でもない者には付かない', gpRow(gsub(), 't', '', { now: GNOW }).ok, 'false');

/* 端から端まで、Google の HTTP を作って。 */
function fakeGoogle(sub, status) {
  const hits = [];
  const f = async (u, init) => {
    hits.push({ u, m: (init && init.method) || 'GET', auth: init && init.headers && init.headers.Authorization });
    if (/:acknowledge$/.test(u)) return { ok: true, status: 200, json: async () => ({}) };
    return { ok: (status || 200) === 200, status: status || 200, json: async () => sub };
  };
  return { f, hits };
}
{
  const g = fakeGoogle(gsub({ acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING' }));
  const r = await gpCheck('tok/2', A, { fetch: g.f, access: 'AT', now: GNOW });
  say('Google に訊くのは subscriptionsv2 のこのアプリ', g.hits[0].u,
      'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.tokinets.lingua/purchases/subscriptionsv2/tokens/tok%2F2');
  say('鍵のアクセストークンで訊く', g.hits[0].auth, 'Bearer AT');
  say('自分の承認待ちは承認する', g.hits.length === 2 && g.hits[1].m === 'POST' &&
      /\/purchases\/subscriptions\/com\.tokinets\.lingua\.pro\.monthly\/tokens\/tok%2F2:acknowledge$/.test(g.hits[1].u), 'true');
  say('承認できたことを返す', r.acked, 'true');
}
{
  const g = fakeGoogle(gsub({ acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING',
    externalAccountIdentifiers: { obfuscatedExternalAccountId: B } }));
  const r = await gpCheck('tok-3', A, { fetch: g.f, access: 'AT', now: GNOW });
  say('他人の購入は承認しない', g.hits.length, '1');
  say('他人の購入は数えない', r.ok, 'false');
}
{
  const g = fakeGoogle(null, 404);
  const r = await gpCheck('tok-4', A, { fetch: g.f, access: 'AT', now: GNOW });
  say('Google が答えなければ数えない', r.why, 'Google answered 404');
}

/* サービスアカウントの鍵で署名した JWT。鍵をその場で作り、公開鍵で確かめる。 */
{
  const kp = await subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const der = new Uint8Array(await subtle.exportKey('pkcs8', kp.privateKey));
  const pem = '-----BEGIN PRIVATE KEY-----\n' +
    Buffer.from(der).toString('base64').replace(/(.{64})/g, '$1\n') + '\n-----END PRIVATE KEY-----\n';
  const key = readKey(JSON.stringify({ client_email: 'svc@x.iam.gserviceaccount.com', private_key: pem }));
  say('鍵の JSON が読める', !!key, 'true');
  say('client_email の無い鍵は読まない', readKey('{"private_key":"x"}'), 'null');
  say('JSON でない鍵は読まない', readKey('nope'), 'null');
  const jwt = await assertion(key, { now: GNOW });
  const [h, c, s] = jwt.split('.');
  const u8 = (x) => Uint8Array.from(Buffer.from(x.replace(/-/g, '+').replace(/_/g, '/'), 'base64'));
  const okSig = await subtle.verify('RSASSA-PKCS1-v1_5', kp.publicKey, u8(s), new TextEncoder().encode(h + '.' + c));
  say('JWT は鍵で RS256 に署名されている', okSig, 'true');
  const cl = JSON.parse(Buffer.from(u8(c)).toString());
  say('JWT は androidpublisher の範囲を名乗る', cl.scope, 'https://www.googleapis.com/auth/androidpublisher');
  say('JWT の宛先は Google の token', cl.aud, TOKEN_URL);
  let sentBody = '';
  const at = await accessToken(key, { now: GNOW, fetch: async (u, init) => {
    sentBody = init.body; return { ok: u === TOKEN_URL, json: async () => ({ access_token: 'ya29.x' }) };
  } });
  say('token に換えたものを返す', at, 'ya29.x');
  say('jwt-bearer で換える', /^grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=/.test(sentBody), 'true');
  const none = await accessToken(key, { now: GNOW, fetch: async () => ({ ok: false, json: async () => ({}) }) });
  say('換えられなければ空', none, '');
}

/* www/store.js の storeJws() ── どちらの電話かを決める一か所。関数そのものを
   源から取り出して走らせる（写しを書かない）。 */
{
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../www/store.js', import.meta.url), 'utf8');
  const m = src.match(/function storeJws\(r\)\{[\s\S]*?\n\}/);
  const storeJws = m ? new Function(m[0] + '; return storeJws;')() : () => 'missing';
  const pair = { token: 't', product: 'com.tokinets.lingua.plus.monthly' };
  say('iPhone の答えは jws を上げる', JSON.stringify(storeJws({ jws: ['a.b.c'], saw: 1 })), '["a.b.c"]');
  say('Android の答えは google の組を上げる', JSON.stringify(storeJws({ google: [pair], saw: 1 })),
      JSON.stringify([pair]));
  say('何も無ければ空（「この人は何を払っているか」）', JSON.stringify(storeJws({ google: [] })), '[]');
  say('上げたものはサーバーで Google の組と読まれる', storeJws({ google: [pair] }).every(isPair), 'true');
}

console.log('verify: ' + said + ' claims about a receipt nobody at Apple or Google signed for us');
if (bad) { console.error('verify-check: ' + bad + ' failed'); process.exit(1); }
