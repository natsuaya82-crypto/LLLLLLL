// App Store のローカリゼーション（副題・説明文・キーワード・宣伝文・新機能）を
// store/<locale>.json から App Store Connect API に入れる。
//
//   node tools/store-localize.mjs --dry                       # 文の長さと JSON だけ見る（鍵不要）
//   node tools/store-localize.mjs --version 1.0.2             # 全部の locale を入れる
//   node tools/store-localize.mjs --version 1.0.2 --skip en-US
//
// 鍵は環境変数 ASC_ISSUER_ID / ASC_KEY_ID / ASC_PRIVATE_KEY（.p8 の中身）。
// GitHub の Actions では ios-deploy.yml と同じ三つの Secrets から来る
// （.github/workflows/store-localize.yml）。
//
// 制限（Apple のもの、ここでは越えられない）：公開中の版の説明文は触れない。
// --version は「提出準備中」の版を指すこと。無ければ --create で作る
// （ビルドを付けて出すのはオーナーが App Store Connect で）。
//
// 依存なし。JWT と呼び出しは tools/asc.mjs（version-check と同じ入口）。

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ascJwt, ascCall } from './asc.mjs';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const DIR = path.join(ROOT, 'store');
const BUNDLE = 'com.tokinets.lingua';

/* Apple の上限。超えると API が 409 で断るので、送る前にここで止める。 */
const MAX = { name: 30, subtitle: 30, description: 4000, keywords: 100,
              promotionalText: 170, whatsNew: 4000 };
const VERSION_FIELDS = ['description', 'keywords', 'promotionalText', 'whatsNew',
                        'supportUrl', 'marketingUrl'];
const INFO_FIELDS = ['name', 'subtitle', 'privacyPolicyUrl'];

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const has = (n) => args.includes(n);
const DRY = has('--dry');
const VERSION = flag('--version');
const CREATE = has('--create');
const SKIP = (flag('--skip') || '').split(',').filter(Boolean);

/* ---- store/*.json を読み、長さを見る ------------------------------------ */
function load(){
  const out = [];
  for (const f of readdirSync(DIR).filter((n) => n.endsWith('.json')).sort()) {
    const locale = f.replace(/\.json$/, '');
    if (SKIP.includes(locale)) continue;
    const j = JSON.parse(readFileSync(path.join(DIR, f), 'utf8'));
    const bad = [];
    for (const [k, m] of Object.entries(MAX)) {
      if (j[k] != null && String(j[k]).length > m)
        bad.push(`${k} is ${String(j[k]).length} chars, the ceiling is ${m}`);
    }
    if (j.keywords && /\s,|,\s/.test(j.keywords))
      bad.push('keywords: no space beside the comma (Apple counts the space)');
    if (bad.length) { console.error(`store/${f}:\n  ${bad.join('\n  ')}`); process.exitCode = 1; }
    out.push({ locale, ...j });
  }
  return out;
}

/* ---- App Store Connect --------------------------------------------------- */
let TOKEN = '';
const call = (method, url, body) => ascCall(TOKEN, method, url, body);

function attrs(row, fields){
  const a = {};
  for (const k of fields) if (row[k] != null && row[k] !== '') a[k] = row[k];
  return a;
}

/* ---- the run ------------------------------------------------------------- */
async function main(){
  const rows = load();
  console.log(`store/: ${rows.length} locales -- ${rows.map((r) => r.locale).join(' ')}`);
  if (process.exitCode) { console.error('fix the lengths above first'); return; }
  if (DRY) { console.log('dry run: nothing sent'); return; }
  if (!VERSION) throw new Error('--version <x.y.z> is needed (the version in Prepare for Submission)');

  TOKEN = ascJwt();
  const app = (await call('GET', `/apps?filter[bundleId]=${BUNDLE}`)).data[0];
  if (!app) throw new Error(`no app with bundle id ${BUNDLE}`);
  console.log(`app ${app.id}  ${app.attributes.name}`);

  /* the version --- must be editable */
  let ver = (await call('GET', `/apps/${app.id}/appStoreVersions?filter[versionString]=${VERSION}&filter[platform]=IOS`)).data[0];
  if (!ver) {
    if (!CREATE) throw new Error(`version ${VERSION} is not there; pass --create to make it`);
    ver = (await call('POST', '/appStoreVersions', { data: { type: 'appStoreVersions',
      attributes: { platform: 'IOS', versionString: VERSION },
      relationships: { app: { data: { type: 'apps', id: app.id } } } } })).data;
    console.log(`made version ${VERSION} (${ver.id})`);
  }
  const state = ver.attributes.appStoreState || ver.attributes.appVersionState;
  console.log(`version ${VERSION} (${ver.id})  state ${state}`);
  if (/READY_FOR_SALE|READY_FOR_DISTRIBUTION/.test(state))
    throw new Error(`version ${VERSION} is live; Apple locks its text. Make the next version and pass that.`);

  /* version localizations: description / keywords / promo / what's new */
  const have = (await call('GET', `/appStoreVersions/${ver.id}/appStoreVersionLocalizations?limit=200`)).data;
  const byLoc = Object.fromEntries(have.map((l) => [l.attributes.locale, l.id]));
  /* The support URL and marketing URL are not in store/: they stay what the
     owner typed (OWNER 2026-09-22「サポートurlは変えなくて良い」). A NEW locale
     needs one, so it takes the primary locale's. */
  const prime = have.find((l) => l.attributes.locale === 'en-US') || have[0];
  const urls = prime ? { supportUrl: prime.attributes.supportUrl, marketingUrl: prime.attributes.marketingUrl } : {};
  for (const row of rows) {
    const a = attrs(row, VERSION_FIELDS);
    if (!byLoc[row.locale]) for (const k of ['supportUrl', 'marketingUrl']) if (!a[k] && urls[k]) a[k] = urls[k];
    if (byLoc[row.locale]) {
      await call('PATCH', `/appStoreVersionLocalizations/${byLoc[row.locale]}`,
        { data: { type: 'appStoreVersionLocalizations', id: byLoc[row.locale], attributes: a } });
      console.log(`  ${row.locale}: version text updated`);
    } else {
      await call('POST', '/appStoreVersionLocalizations', { data: { type: 'appStoreVersionLocalizations',
        attributes: { locale: row.locale, ...a },
        relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: ver.id } } } } });
      console.log(`  ${row.locale}: version text added`);
    }
  }

  /* app info localizations: name / subtitle / privacy url --- on the editable appInfo */
  const infos = (await call('GET', `/apps/${app.id}/appInfos`)).data;
  const info = infos.find((i) => !/READY_FOR_SALE|READY_FOR_DISTRIBUTION/.test(i.attributes.appStoreState || i.attributes.state || '')) || infos[0];
  const ihave = (await call('GET', `/appInfos/${info.id}/appInfoLocalizations?limit=200`)).data;
  const iby = Object.fromEntries(ihave.map((l) => [l.attributes.locale, l.id]));
  for (const row of rows) {
    const a = attrs(row, INFO_FIELDS);
    if (!Object.keys(a).length) continue;
    if (iby[row.locale]) {
      await call('PATCH', `/appInfoLocalizations/${iby[row.locale]}`,
        { data: { type: 'appInfoLocalizations', id: iby[row.locale], attributes: a } });
      console.log(`  ${row.locale}: name/subtitle updated`);
    } else {
      await call('POST', '/appInfoLocalizations', { data: { type: 'appInfoLocalizations',
        attributes: { locale: row.locale, ...a },
        relationships: { appInfo: { data: { type: 'appInfos', id: info.id } } } } });
      console.log(`  ${row.locale}: name/subtitle added`);
    }
  }
  console.log('done. Screenshots are not sent from here: App Store Connect copies the primary locale\'s to a locale that has none.');
}

main().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
