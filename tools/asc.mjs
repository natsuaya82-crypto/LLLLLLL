// App Store Connect API の入口 ── JWT（ES256）と、一回の呼び出し。
// tools/store-localize.mjs と tools/version-check.mjs が同じ物を読む
// （二枚に書くと鍵の読み方が二つになり、片方だけ直る）。
//
// 鍵は環境変数 ASC_ISSUER_ID / ASC_KEY_ID / ASC_PRIVATE_KEY（.p8 の中身、
// または base64）。GitHub の Actions では ios-deploy.yml と同じ三つの Secrets。

import { createSign, createPrivateKey } from 'node:crypto';

export const ASC_API = 'https://api.appstoreconnect.apple.com/v1';

export function ascKeys(){
  const iss = process.env.ASC_ISSUER_ID, kid = process.env.ASC_KEY_ID, pem = process.env.ASC_PRIVATE_KEY;
  return (iss && kid && pem) ? { iss, kid, pem } : null;
}

export function ascJwt(){
  const k = ascKeys();
  if (!k) throw new Error('ASC_ISSUER_ID / ASC_KEY_ID / ASC_PRIVATE_KEY are needed');
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'ES256', kid: k.kid, typ: 'JWT' });
  const body = b64({ iss: k.iss, iat: now, exp: now + 15 * 60, aud: 'appstoreconnect-v1' });
  const key = createPrivateKey(k.pem.includes('BEGIN') ? k.pem : Buffer.from(k.pem, 'base64').toString('utf8'));
  const sig = createSign('SHA256').update(`${head}.${body}`).sign({ key, dsaEncoding: 'ieee-p1363' });
  return `${head}.${body}.${sig.toString('base64url')}`;
}

export async function ascCall(token, method, url, body){
  const r = await fetch(url.startsWith('http') ? url : ASC_API + url, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let j = null; try { j = JSON.parse(text); } catch { /* 204 */ }
  if (!r.ok) throw new Error(`${method} ${url} -> ${r.status}\n${text.slice(0, 800)}`);
  return j;
}
