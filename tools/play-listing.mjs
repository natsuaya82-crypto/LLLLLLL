// Google Play の掲載の文（アプリ名・短い説明・詳しい説明）を 10 言語で入れる。
//
//   node tools/play-listing.mjs --dry    # 文を見るだけ（鍵は要らない、何も送らない）
//   node tools/play-listing.mjs          # 見て、よければ Play に入れる（鍵が要る）
//
// 「Android一気に進めて欲しい」OWNER 2026-09-29。オーナーにターミナルは無いので
// GitHub の Actions で押す（.github/workflows/play-listing.yml）。
// 文は store-play/<Play の言語コード>.json。iOS の文は store/ で、ここは読まない。
//
// 鍵は環境変数 GOOGLE_PLAY_SERVICE_ACCOUNT（サービスアカウントの JSON 鍵まるごと。
// verify-plan が購入を確かめるのと同じ鍵）。Play Console の「ユーザーと権限」で
// このアプリに「ストアの掲載情報の管理」が要る。
//
// 見る物（一つでも外れたら何も送らない）:
//   10 言語が揃っている・三つの欄だけ・長さ（30 / 80 / 4000）・制御文字と絵文字・
//   < と > ・前後の空白・アプリ名の宣伝の語・Android に無い物の名前。

import fs from 'node:fs';
import crypto from 'node:crypto';

const PKG = 'com.tokinets.lingua';
const DIR = new URL('../store-play/', import.meta.url);
const DRY = process.argv.indexOf('--dry') >= 0;

/* Play の言語コード。store/ の 10 と同じ言語で、名前は Play の方。 */
const LOCALES = ['en-US', 'de-DE', 'es-ES', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'ru-RU', 'zh-CN'];
const MAX = { title: 30, shortDescription: 80, fullDescription: 4000 };

/* アプリ名に置けない語（Play の方針: 順位・値段・宣伝をアプリ名で言わない）。 */
const PROMO = /\b(free|best|top|#1|no\.? ?1|new|sale|discount|no ads|download now|install now)\b/i;
/* Android の Lingua に無い物の名前。iOS の文を写した時に残るのはこれ。 */
const PLATFORM = /iPhone|iPad|iOS|App Store|Apple|Siri|widget|Widget|ウィジェット|위젯|小组件|виджет/;

function problems(loc, j) {
  const out = [];
  const keys = Object.keys(j).sort().join(',');
  if (keys !== 'fullDescription,shortDescription,title') out.push(`fields are ${keys}; want title, shortDescription, fullDescription`);
  for (const k in MAX) {
    const v = j[k];
    if (typeof v !== 'string' || !v) { out.push(`${k} is empty`); continue; }
    const n = [...v].length;
    if (n > MAX[k]) out.push(`${k} is ${n} characters; Play takes ${MAX[k]}`);
    if (v !== v.trim()) out.push(`${k} starts or ends with a space`);
    const ctl = k === 'fullDescription' ? /[\u0000-\u0009\u000b-\u001f\u007f�]/ : /[\u0000-\u001f\u007f�]/;
    if (ctl.test(v)) out.push(`${k} has a control character${k === 'fullDescription' ? ' (only a line break is allowed)' : ' or a line break'}`);
    if (/\p{Extended_Pictographic}/u.test(v)) out.push(`${k} has an emoji`);
    if (/[<>]/.test(v)) out.push(`${k} has < or > (Play reads the description as HTML)`);
    const m = v.match(PLATFORM);
    if (m) out.push(`${k} names "${m[0]}", which the Android app does not have`);
  }
  const p = typeof j.title === 'string' && j.title.match(PROMO);
  if (p) out.push(`title says "${p[0]}" (Play refuses rank, price or promotion in an app's name)`);
  return out;
}

function readAll() {
  const have = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
  const want = LOCALES.slice().sort();
  const bad = [];
  for (const f of have) if (want.indexOf(f) < 0) bad.push(`store-play/${f}.json is not one of the ${LOCALES.length} languages`);
  for (const f of want) if (have.indexOf(f) < 0) bad.push(`store-play/${f}.json is missing`);
  const all = {};
  for (const loc of LOCALES) {
    if (have.indexOf(loc) < 0) continue;
    let j;
    try { j = JSON.parse(fs.readFileSync(new URL(loc + '.json', DIR), 'utf8')); }
    catch (e) { bad.push(`store-play/${loc}.json: ${e.message}`); continue; }
    for (const p of problems(loc, j)) bad.push(`store-play/${loc}.json: ${p}`);
    all[loc] = j;
    console.log(`${loc}  title ${[...j.title].length}/30  short ${[...j.shortDescription].length}/80  full ${[...j.fullDescription].length}/4000`);
  }
  return { all, bad };
}

/* A service account signs its own JWT and trades it for an access token. */
async function token(sa) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'RS256', typ: 'JWT' });
  const body = b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const sig = crypto.createSign('RSA-SHA256').update(head + '.' + body).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + head + '.' + body + '.' + sig,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Google refused the key (${r.status}): ${j.error_description || j.error}`);
  return j.access_token;
}

const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}`;
async function call(tok, method, path, body) {
  const r = await fetch(API + path, {
    method,
    headers: { authorization: 'Bearer ' + tok, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) {
    let msg = t;
    try { msg = JSON.parse(t).error.message; } catch (e) { /* the text as it came */ }
    const hint = r.status === 404 ? ' -- the app is not in Play Console yet, or no build has been uploaded to it (Play opens the API to an app only after the first upload)'
      : r.status === 403 ? ' -- invite the service account in Play Console → Users and permissions and give it this app\'s store listing'
      : '';
    throw new Error(`${method} ${path} → ${r.status}: ${msg}${hint}`);
  }
  return t ? JSON.parse(t) : {};
}

async function main() {
  const { all, bad } = readAll();
  if (bad.length) { for (const b of bad) console.error('✗ ' + b); throw new Error(`${bad.length} problem(s) -- nothing sent`); }
  console.log(`${LOCALES.length} languages look right`);
  if (DRY) { console.log(`dry run: would put these ${LOCALES.length} listings into ${PKG} and commit`); return; }

  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT;
  if (!raw) throw new Error('GOOGLE_PLAY_SERVICE_ACCOUNT is not set -- see docs/ANDROID.md § オーナーがすること');
  let sa;
  try { sa = JSON.parse(raw); } catch (e) { throw new Error('GOOGLE_PLAY_SERVICE_ACCOUNT is not JSON -- paste the whole key file'); }
  const tok = await token(sa);

  const edit = await call(tok, 'POST', '/edits', {});
  console.log(`edit ${edit.id}`);
  for (const loc of LOCALES) {
    const j = all[loc];
    await call(tok, 'PUT', `/edits/${edit.id}/listings/${loc}`, { language: loc, title: j.title, shortDescription: j.shortDescription, fullDescription: j.fullDescription });
    console.log(`put ${loc}`);
  }
  await call(tok, 'POST', `/edits/${edit.id}:commit`);
  console.log(`committed: ${LOCALES.length} listings are in Play Console`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
