/* ---------------------------------------------------------------------------
   supabase/functions/verify-plan/verify.mjs — Apple の署名を読む一枚。

   これは **plain ESM JavaScript** です。この函数は Deno で動き、検査
   (tools/verify-check.mjs) は Node で動く ── その二つが同じ一枚を読むために、
   どちらもそのまま import できる形にしてあります（`.mjs` なのはそのため ── Node は
   拡張子で ESM と分かり、Deno も同じ一枚をそのまま読みます）。TypeScript にすると検査の側が
   自前で書き直すか、変換を挟むことになり、**検査が試験対象を書き直したら、それは
   写しであって、写しは必ず一致します**（CLAUDE.md § 10, § 12）。

   何をするか：署名付き取引（JWS。App Store から `jwsRepresentation` として渡って
   くる）を一つ受け取り、

     1. ヘッダの `x5c` 鎖 ── 葉、中間、根 ── を DER として読む
     2. 鎖の**根が、渡された根の証明書とバイトごとに一致する**ことを見る
     3. 各証明書が次の証明書の鍵で署名されていることを見る
     4. どの証明書も期限の中にあることを見る
     5. 葉の鍵で JWS そのものの署名を見る

   秘密は要りません。Apple の根証明書は公開されたもので、App Store Server API も
   使いません（あれは鍵が要る）。**端末が言った段を信じない**というのがこの枚の
   全部で、信じないためには署名を自分で見るしかありません。

   注入されるもの二つ、そしてそれが検査を可能にしています：

     `roots` ── 信じる根の証明書（DER の Uint8Array の配列）。本番は Apple Root
       CA-G3 一つ。検査は自分で作った根を渡し、正しい鎖は通り、違う鎖は落ちること
       を見ます。**repo に根を焼き付けていません** ── 焼き付けた根が間違っていた
       ら、実機の受領書が一つも通らず、何も投げません。値は函数の環境変数から来ます
       （supabase/setup.md）。
     `now` ── 今。期限切れが free になることを、時計を待たずに見るため。

   ここに段の表もあります。段を決めるのはサーバーの仕事になったからで、
   ios/App/App/LinguaStore.swift にあった best()／entitledPlan() は消えました。
   一つのことは一つの機構で。
   --------------------------------------------------------------------------- */

/* 商品と、それが買う段。ここが唯一の場所。 */
export const PRODUCTS = {
  'com.tokinets.lingua.plus.monthly': 'plus',
  'com.tokinets.lingua.plus.yearly':  'plus',
  'com.tokinets.lingua.pro.monthly':  'pro',
  'com.tokinets.lingua.pro.yearly':   'pro',
};
/* 梯子、安い順。www/core.js の PLAN_ORDER と同じもの。 */
export const ORDER = ['free', 'plus', 'pro'];
/* このアプリの受領書だけを受ける。Apple が署名した取引でも、別のアプリのもの
   なら別のアプリのものです。 */
export const BUNDLE = 'com.tokinets.lingua';

/* ---- 生の byte を読むだけの道具 ---------------------------------------- */

export function b64ToBytes(s) {
  const t = String(s).replace(/-/g, '+').replace(/_/g, '/');
  const pad = t.length % 4 ? '===='.slice(t.length % 4) : '';
  const bin = atob(t + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/* ---- DER。証明書を読むのに要るぶんだけ ---------------------------------
   一つの TLV を読む。長さは短形式と長形式の両方。 */
function tlv(b, i) {
  const tag = b[i];
  let j = i + 1;
  let len = b[j++];
  if (len & 0x80) {
    const n = len & 0x7f;
    if (n === 0 || n > 4) throw new Error('der: length');
    len = 0;
    for (let k = 0; k < n; k++) len = len * 256 + b[j++];
  }
  const end = j + len;
  if (end > b.length) throw new Error('der: past the end');
  return { tag, start: i, vstart: j, vend: end, end };
}
function kids(b, node) {
  const out = [];
  let i = node.vstart;
  while (i < node.vend) { const t = tlv(b, i); out.push(t); i = t.end; }
  return out;
}
function oid(b, node) {
  const v = b.subarray(node.vstart, node.vend);
  const parts = [Math.floor(v[0] / 40), v[0] % 40];
  let n = 0;
  for (let i = 1; i < v.length; i++) {
    n = n * 128 + (v[i] & 0x7f);
    if (!(v[i] & 0x80)) { parts.push(n); n = 0; }
  }
  return parts.join('.');
}
/* UTCTime は二桁の年。RFC 5280 が 50 で切ると言っています。 */
function derTime(b, node) {
  const s = String.fromCharCode.apply(null, Array.from(b.subarray(node.vstart, node.vend)));
  let y, rest;
  if (node.tag === 0x17) {            /* UTCTime YYMMDDHHMMSSZ */
    const yy = parseInt(s.slice(0, 2), 10);
    y = yy < 50 ? 2000 + yy : 1900 + yy;
    rest = s.slice(2);
  } else if (node.tag === 0x18) {     /* GeneralizedTime YYYYMMDDHHMMSSZ */
    y = parseInt(s.slice(0, 4), 10);
    rest = s.slice(4);
  } else throw new Error('der: not a time');
  return Date.UTC(y, parseInt(rest.slice(0, 2), 10) - 1, parseInt(rest.slice(2, 4), 10),
                  parseInt(rest.slice(4, 6), 10), parseInt(rest.slice(6, 8), 10),
                  parseInt(rest.slice(8, 10), 10) || 0);
}

const CURVES = {
  '1.2.840.10045.3.1.7': { name: 'P-256', n: 32 },
  '1.3.132.0.34':        { name: 'P-384', n: 48 },
  '1.3.132.0.35':        { name: 'P-521', n: 66 },
};
const SIGALG = {
  '1.2.840.10045.4.3.2': 'SHA-256',
  '1.2.840.10045.4.3.3': 'SHA-384',
  '1.2.840.10045.4.3.4': 'SHA-512',
};

/* 証明書一枚から、鎖を見るのに要るものだけ。 */
export function readCert(der) {
  const top = tlv(der, 0);
  const k = kids(der, top);
  if (k.length < 3) throw new Error('cert: not three parts');
  const tbs = k[0], algid = k[1], bits = k[2];
  const tc = kids(der, tbs);
  /* [0] EXPLICIT version は在ることも無いこともある。在れば一つずれる。 */
  const i = (tc[0].tag === 0xa0) ? 1 : 0;
  if (tc.length < i + 6) throw new Error('cert: short');
  const val = kids(der, tc[i + 3]);
  const spki = tc[i + 5];
  const spkiAlg = kids(der, kids(der, spki)[0]);
  return {
    der,
    tbs: der.subarray(tbs.start, tbs.end),
    /* BIT STRING の先頭一 byte は「余りの bit 数」で、鍵でも署名でもない。 */
    sig: der.subarray(bits.vstart + 1, bits.vend),
    hash: SIGALG[oid(der, kids(der, algid)[0])] || '',
    spki: der.subarray(spki.start, spki.end),
    curve: CURVES[spkiAlg.length > 1 ? oid(der, spkiAlg[1]) : ''] || null,
    from: derTime(der, val[0]),
    to: derTime(der, val[1]),
  };
}

/* DER の ECDSA 署名（SEQUENCE{r,s}）を、WebCrypto が待っている r‖s に。 */
function rawSig(b, n) {
  const seq = tlv(b, 0);
  const [r, s] = kids(b, seq);
  const out = new Uint8Array(n * 2);
  const put = (t, at) => {
    let v = b.subarray(t.vstart, t.vend);
    let z = 0;
    while (z < v.length - 1 && v[z] === 0) z++;   /* 先頭の 0 は符号のため */
    v = v.subarray(z);
    if (v.length > n) throw new Error('sig: too long');
    out.set(v, at + n - v.length);
  };
  put(r, 0); put(s, n);
  return out;
}

function subtleOf(opt) {
  const c = (opt && opt.subtle) || (typeof crypto !== 'undefined' ? crypto.subtle : null);
  if (!c) throw new Error('no WebCrypto');
  return c;
}
async function keyOf(subtle, cert) {
  if (!cert.curve) throw new Error('cert: not an EC key');
  return subtle.importKey('spki', cert.spki, { name: 'ECDSA', namedCurve: cert.curve.name },
                          false, ['verify']);
}

/* ---- 署名付き取引を一つ、端から端まで --------------------------------- */

/* 返すのは {ok, why, payload}。落ちた理由は文字列で、**通ったのと同じ形では
   返しません** ── 「読めなかった」と「無かった」が枝を分けないのは CLAUDE.md の
   一枚目の文です。 */
export async function verifyJws(jws, opt) {
  const o = opt || {};
  const subtle = subtleOf(o);
  const now = (o.now instanceof Date) ? o.now.getTime() : (o.now || Date.now());
  const roots = o.roots || [];
  if (!roots.length) return { ok: false, why: 'no root certificate was given' };

  const parts = String(jws || '').split('.');
  if (parts.length !== 3) return { ok: false, why: 'not a JWS' };

  let head;
  try { head = JSON.parse(new TextDecoder().decode(b64ToBytes(parts[0]))); }
  catch (e) { return { ok: false, why: 'the header is not JSON' }; }
  if (head.alg !== 'ES256') return { ok: false, why: 'alg is not ES256' };
  const x5c = head.x5c;
  if (!Array.isArray(x5c) || x5c.length < 2) return { ok: false, why: 'no x5c chain' };

  let chain;
  try { chain = x5c.map((c) => readCert(b64ToBytes(c))); }
  catch (e) { return { ok: false, why: 'the chain will not parse: ' + e.message }; }

  /* 根。**バイトごとに**一致するものが渡された根の中に無ければ、そこで終わり。
     名前で照らすのではありません ── 名前は誰でも書けます。 */
  const root = chain[chain.length - 1];
  if (!roots.some((r) => sameBytes(r, root.der))) {
    return { ok: false, why: 'the chain does not end at a root we trust' };
  }
  for (const c of chain) {
    if (now < c.from || now > c.to) return { ok: false, why: 'a certificate in the chain is out of date' };
  }
  /* 葉から根へ。各枚は次の枚の鍵で署名されている。 */
  for (let i = 0; i < chain.length - 1; i++) {
    const c = chain[i], up = chain[i + 1];
    if (!c.hash || !up.curve) return { ok: false, why: 'a certificate signs with something we do not read' };
    let ok = false;
    try {
      ok = await subtle.verify({ name: 'ECDSA', hash: { name: c.hash } },
                               await keyOf(subtle, up), rawSig(c.sig, up.curve.n), c.tbs);
    } catch (e) { return { ok: false, why: 'a certificate signature will not read: ' + e.message }; }
    if (!ok) return { ok: false, why: 'a certificate in the chain is not signed by the next one' };
  }
  /* そして取引そのもの。ES256 の署名は既に r‖s なので、直します。 */
  const leaf = chain[0];
  const signed = new TextEncoder().encode(parts[0] + '.' + parts[1]);
  let ok = false;
  try {
    ok = await subtle.verify({ name: 'ECDSA', hash: { name: 'SHA-256' } },
                             await keyOf(subtle, leaf), b64ToBytes(parts[2]), signed);
  } catch (e) { return { ok: false, why: 'the transaction signature will not read: ' + e.message }; }
  if (!ok) return { ok: false, why: 'the transaction is not signed by the leaf certificate' };

  let payload;
  try { payload = JSON.parse(new TextDecoder().decode(b64ToBytes(parts[1]))); }
  catch (e) { return { ok: false, why: 'the payload is not JSON' }; }
  if (payload.bundleId && payload.bundleId !== BUNDLE) {
    return { ok: false, why: 'the transaction is for another app' };
  }
  return { ok: true, payload };
}

/* ---- 誰のものか -------------------------------------------------------
   OWNER 2026-09-06「アカウントごとなんだから、違うアカウントで復元できるのおかしい
   だろ」。

   `appAccountToken` は買うときに端末が付ける uid で、Apple が署名の中に入れて
   返してきます。**在ればそれが全部**：一致しなければ、その取引はこの人のもの
   ではありません。別のアカウントでサインインして復元を押しても、段は付きません。

   無い取引は、この変更より前に買われたものです。捨てるのは、払った人から払った
   ものを取り上げることなので、捨てません ── **最初に検証しに来た uid に束縛し、
   以後は別の uid を拒みます**。`row` は `purchase` に既に在る行、無ければ null。

   純粋な函数なのは検査のためです。表を読むのは index.ts、決めるのはここ。 */
export function bindOf(payload, uid, row) {
  const tok = payload && payload.appAccountToken ? String(payload.appAccountToken).toLowerCase() : '';
  const me = String(uid || '').toLowerCase();
  if (!me) return 'nobody';
  if (tok) return tok === me ? 'ok' : 'another account';
  if (row && String(row.uid || '').toLowerCase() !== me) return 'already another account’s';
  return 'ok';
}

/* ---- 段 ---------------------------------------------------------------
   期限の中にあり、取り消されていない取引だけが数えられ、高い段が勝ちます
   ── 「二つ持っている人の答えは高い方、最後に読んだ方ではない」。何も残らな
   ければ free で、それがこの道が lapse の道でもある理由です。

   `until` はその段が**いつまで使えるか**で、同じ段の月と年が両方生きていれば
   遅い方。free に日付はありません ── 「終わりが無い」ではなく「無い」。 */
export function decidePlan(rows, opt) {
  const now = (opt && opt.now instanceof Date) ? opt.now.getTime() : ((opt && opt.now) || Date.now());
  let plan = 'free', until = 0;
  for (const p of rows) {
    if (!p) continue;
    if (p.revocationDate) continue;
    const to = Number(p.expiresDate || 0);
    if (to && to <= now) continue;
    const got = PRODUCTS[String(p.productId || '')];
    if (!got) continue;
    if (ORDER.indexOf(got) > ORDER.indexOf(plan)) { plan = got; until = to; }
    else if (got === plan && to > until) until = to;
  }
  return { plan, until: plan === 'free' ? 0 : until };
}
