/* ---------------------------------------------------------------------------
   supabase/functions/verify-plan/google.mjs — Google Play の購入を確かめる一枚。

   verify.mjs と同じく **plain ESM JavaScript** で、Deno の函数も Node の検査
   (tools/verify-check.mjs) も同じ一枚をそのまま import します。検査が試験対象を
   書き直したら、それは写しであって、写しは必ず一致します。

   Apple と何が違うか。App Store は端末に**署名つきの取引**を渡し、ここはその
   署名を自分で見ます。Google Play が端末に渡すのは**購入トークン**だけで、
   署名はありません。だから確かめ方は一つ ── サーバーが Google Play Developer
   API に、サービスアカウントの鍵で訊く（purchases.subscriptionsv2.get）。
   答えるのは Google で、端末ではありません。

   一つのトークンについて、ここがすること：

     1. Google に訊く。答えが無ければ数えない（「読めなかった」は「無い」では
        ないが、段を付けない側に間違える）。
     2. 誰のものか ── `obfuscatedExternalAccountId` が呼んだ人の uid と同じ時
        だけ。端末が買う時にそこへ Supabase の uid を入れる
        （LinguaStorePlugin.kt の buy）。**無ければ付けません。** Apple には
        `appAccountToken` の無い古い取引があって最初の uid に束縛しましたが、
        Google の購入はこの形より前に一つも無いので、その道は要りません。
     3. 期限 ── Google の `lineItems[].expiryTime` から。数える状態
        （ACTIVE・CANCELED・IN_GRACE_PERIOD）でなければ、期限は今より後に
        しない。CANCELED は「更新しない」で、期限までは払ったものです。
     4. 承認（acknowledge） ── 三日以内にしないと Google が返金して取り消します。
        uid が一致した時だけ、まだなら、ここでします。

   注入されるもの：`fetch`（検査は Google の答えを作って渡す）、`now`、`subtle`。
   --------------------------------------------------------------------------- */

import { PRODUCTS, BUNDLE } from './verify.mjs';

export const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/';
export const TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const SCOPE = 'https://www.googleapis.com/auth/androidpublisher';

/* 期限までは払ったものとして数える状態。ON_HOLD・PAUSED・EXPIRED・PENDING は
   数えない ── 払われていないか、もう終わったか。 */
export const COUNTS = [
  'SUBSCRIPTION_STATE_ACTIVE',
  'SUBSCRIPTION_STATE_CANCELED',
  'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
];

/* `purchase` 表の鍵。Apple の originalTransactionId は数字だけなので、頭に
   `gp:` を付けたトークンとは決して重なりません。一つの定期購入を一つの行に
   するのは Apple と同じで、更新で同じトークンが来れば同じ行が書き直されます。 */
export function gpKey(token) { return 'gp:' + String(token || ''); }

/* 端末から来た一つが Google の組か。`jws` の配列に、iPhone からは文字列、
   Android からは {token, product} が入ります（www/store.js § storeReceipts）。 */
export function isPair(x) {
  return !!(x && typeof x === 'object' && typeof x.token === 'string' && x.token &&
            typeof x.product === 'string');
}

/* ---- サービスアカウントの鍵で、Google のアクセストークンを取る ----------

   鍵は Supabase の secret `GOOGLE_PLAY_SERVICE_ACCOUNT` ── Google Cloud で
   作ったサービスアカウントの JSON 鍵をまるごと。repo にはありません。
   RS256 の JWT を自分で署名して、oauth2 の token に換えます。 */

function b64u(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function pemBytes(pem) {
  const body = String(pem || '').replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const bin = atob(body);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* 鍵の JSON を読む。読めなければ null ── 函数は Google の組を一つも数えず、
   理由を `left` に書きます。 */
export function readKey(raw) {
  try {
    const k = JSON.parse(String(raw || ''));
    if (k && k.client_email && k.private_key) return k;
  } catch (e) { /* 下で null */ }
  return null;
}

export async function assertion(key, opt) {
  const o = opt || {};
  const subtle = o.subtle || crypto.subtle;
  const now = Math.floor(((o.now instanceof Date) ? o.now.getTime() : (o.now || Date.now())) / 1000);
  const enc = new TextEncoder();
  const head = b64u(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claim = b64u(enc.encode(JSON.stringify({
    iss: key.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600,
  })));
  const k = await subtle.importKey('pkcs8', pemBytes(key.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await subtle.sign('RSASSA-PKCS1-v1_5', k, enc.encode(head + '.' + claim)));
  return head + '.' + claim + '.' + b64u(sig);
}

/* アクセストークン。取れなければ '' で、函数は Google の組を数えません。 */
export async function accessToken(key, opt) {
  const o = opt || {};
  const f = o.fetch || fetch;
  let jwt;
  try { jwt = await assertion(key, o); } catch (e) { return ''; }
  const r = await f(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') +
          '&assertion=' + encodeURIComponent(jwt),
  });
  if (!r.ok) return '';
  const d = await r.json();
  return (d && d.access_token) ? String(d.access_token) : '';
}

/* ---- Google の答えから、行を ------------------------------------------
   純粋な函数。表を読み書きするのは index.ts、決めるのはここ。

   返すのは {ok, why, row, ack}。`ack` は承認が要るかどうか。 */
export function gpRow(sub, token, uid, opt) {
  const now = (opt && opt.now instanceof Date) ? opt.now.getTime() : ((opt && opt.now) || Date.now());
  const me = String(uid || '').toLowerCase();
  if (!me) return { ok: false, why: 'nobody' };
  if (!sub || typeof sub !== 'object') return { ok: false, why: 'Google did not answer' };
  const ids = sub.externalAccountIdentifiers || {};
  const who = String(ids.obfuscatedExternalAccountId || '').toLowerCase();
  /* 在ればそれが全部、無ければ誰のものでもない。 */
  if (!who) return { ok: false, why: 'no account on the purchase' };
  if (who !== me) return { ok: false, why: 'another account' };

  /* 売っている商品の行。期限は遅い方。 */
  let product = '', until = 0;
  for (const li of (Array.isArray(sub.lineItems) ? sub.lineItems : [])) {
    const id = String((li && li.productId) || '');
    if (!PRODUCTS[id]) continue;
    const to = li.expiryTime ? Date.parse(li.expiryTime) : 0;
    if (!product || to > until) { product = id; until = to || 0; }
  }
  if (!product) return { ok: false, why: 'not a product we sell' };

  const state = String(sub.subscriptionState || '');
  const counts = COUNTS.indexOf(state) >= 0;
  /* 数えない状態は、期限が先にあっても今で切る。verify.mjs の decidePlan() は
     `until` が過ぎた行を数えないので、それで lapse と同じ一本の道になります。 */
  const end = counts ? until : Math.min(until || now, now);

  return {
    ok: true,
    row: {
      orig_tx: gpKey(token),
      uid: me,
      product,
      until: end ? new Date(end).toISOString() : null,
      revoked: null,
      env: sub.testPurchase ? 'GoogleTest' : 'Google',
      at: new Date(now).toISOString(),
    },
    ack: counts && sub.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING',
    state,
  };
}

/* ---- 一つのトークンを、端から端まで ------------------------------------ */
export async function gpCheck(token, uid, opt) {
  const o = opt || {};
  const f = o.fetch || fetch;
  const pkg = o.pkg || BUNDLE;
  const auth = { Authorization: 'Bearer ' + o.access };
  const base = API + encodeURIComponent(pkg);
  let sub = null;
  const r = await f(base + '/purchases/subscriptionsv2/tokens/' + encodeURIComponent(token),
                    { headers: auth });
  if (!r.ok) return { ok: false, why: 'Google answered ' + r.status };
  try { sub = await r.json(); } catch (e) { return { ok: false, why: 'Google did not answer' }; }
  const out = gpRow(sub, token, uid, o);
  if (!out.ok) return out;
  /* 承認。三日以内にしないと Google が返金して取り消します。uid が一致した
     購入だけ ── 他人の購入を、その人の代わりに確定させない。 */
  if (out.ack) {
    const a = await f(base + '/purchases/subscriptions/' + encodeURIComponent(out.row.product) +
                      '/tokens/' + encodeURIComponent(token) + ':acknowledge',
                      { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: '{}' });
    out.acked = a.ok;
  }
  return out;
}
