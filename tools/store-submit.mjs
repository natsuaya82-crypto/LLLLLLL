// 一つのビルドを「提出準備中」の版に付けて、審査に出す。
//
//   node tools/store-submit.mjs --version 1.0.2 --build 166          # 付けて出す
//   node tools/store-submit.mjs --version 1.0.2 --build 166 --dry    # 何をするかを言うだけ（鍵は要る、書かない）
//
// 「やっといて」OWNER 2026-09-25（Shipaton の締め切りの前）。オーナーにターミナルは
// 無いので GitHub の Actions で押す（.github/workflows/store-submit.yml）。
// 版の文（新機能など）は tools/store-localize.mjs が入れる ── ここは付けて出すだけ。
//
// 鍵は環境変数 ASC_ISSUER_ID / ASC_KEY_ID / ASC_PRIVATE_KEY（tools/asc.mjs）。
//
// 止まる所（どれも Apple の画面で人が直す物で、ここで勝手に埋めない）:
//   版が無い／もう公開中・審査中、ビルドがまだ処理中・無効、
//   すでに開いている審査の提出がある。

import { ascJwt, ascCall } from './asc.mjs';

const BUNDLE = 'com.tokinets.lingua';
const arg = (k) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : null; };
const VERSION = arg('--version');
const BUILD = arg('--build');
const DRY = process.argv.indexOf('--dry') >= 0;

let TOKEN;
const call = (m, u, b) => ascCall(TOKEN, m, u, b);

async function main(){
  if (!VERSION || !BUILD) throw new Error('--version and --build are both needed');
  TOKEN = ascJwt();

  const app = (await call('GET', `/apps?filter[bundleId]=${BUNDLE}`)).data[0];
  if (!app) throw new Error(`no app with bundle id ${BUNDLE}`);
  console.log(`app ${app.id}  ${app.attributes.name}`);

  const ver = (await call('GET', `/apps/${app.id}/appStoreVersions?filter[versionString]=${VERSION}&filter[platform]=IOS`)).data[0];
  if (!ver) throw new Error(`version ${VERSION} is not there -- make it with store-localize (create: true) first`);
  const state = ver.attributes.appStoreState || ver.attributes.appVersionState;
  console.log(`version ${VERSION} (${ver.id})  state ${state}`);
  if (!/PREPARE_FOR_SUBMISSION|DEVELOPER_REJECTED|REJECTED|METADATA_REJECTED|INVALID_BINARY/.test(state))
    throw new Error(`version ${VERSION} is ${state}; only a version still being prepared can be submitted`);

  const build = (await call('GET', `/builds?filter[app]=${app.id}&filter[version]=${BUILD}&filter[preReleaseVersion.version]=${VERSION}&limit=5`)).data[0];
  if (!build) throw new Error(`build ${BUILD} of ${VERSION} is not in App Store Connect yet`);
  console.log(`build ${BUILD} (${build.id})  processing ${build.attributes.processingState}  expired ${build.attributes.expired}`);
  if (build.attributes.processingState !== 'VALID')
    throw new Error(`build ${BUILD} is ${build.attributes.processingState}; wait until Apple has finished processing it`);

  const open = (await call('GET', `/reviewSubmissions?filter[app]=${app.id}&filter[platform]=IOS&filter[state]=READY_FOR_REVIEW,WAITING_FOR_REVIEW,IN_REVIEW,UNRESOLVED_ISSUES`)).data;
  if (open.length) throw new Error(`a review submission is already open (${open.map((s) => s.attributes.state).join(', ')}) -- nothing sent`);

  if (DRY) { console.log(`dry run: would attach build ${BUILD} to ${VERSION} and submit it`); return; }

  await call('PATCH', `/appStoreVersions/${ver.id}/relationships/build`, { data: { type: 'builds', id: build.id } });
  console.log(`attached build ${BUILD} to ${VERSION}`);

  const sub = (await call('POST', '/reviewSubmissions', { data: { type: 'reviewSubmissions',
    attributes: { platform: 'IOS' },
    relationships: { app: { data: { type: 'apps', id: app.id } } } } })).data;
  await call('POST', '/reviewSubmissionItems', { data: { type: 'reviewSubmissionItems',
    relationships: { reviewSubmission: { data: { type: 'reviewSubmissions', id: sub.id } },
                     appStoreVersion: { data: { type: 'appStoreVersions', id: ver.id } } } } });
  const done = (await call('PATCH', `/reviewSubmissions/${sub.id}`, { data: { type: 'reviewSubmissions', id: sub.id,
    attributes: { submitted: true } } })).data;
  console.log(`submitted for review: ${done.id}  state ${done.attributes.state}`);
}

main().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
