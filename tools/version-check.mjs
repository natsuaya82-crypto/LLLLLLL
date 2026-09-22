// 版（MARKETING_VERSION）が公開中の版より上か ── archive の前に止める。
//
//   node tools/version-check.mjs      # 鍵（ASC_*）があれば App Store Connect に訊く
//
// Apple は、承認済みの版（train）にはもうビルドを受け取らない（ITMS-90186 /
// ITMS-90062、2026-09-22 のビルド 164：1.0.0 は公開済みだった）。それは
// メールで一時間後に届き、赤い印にはならない。だから archive の前に、ここで
// 同じ問いを先に訊く。
//
// 版は package.json の "version" 一箇所。ios-deploy.yml がそれを pbxproj の
// MARKETING_VERSION に書き、assets-check が repo の pbxproj と同じであることを
// 持つ。ここはその一箇所と、Apple が「もう閉じている」と言う版を比べるだけ。
//
// 鍵が無ければ（手元）、訊けないと言って 0 で終わる ── 止めるのは Actions。

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ascKeys, ascJwt, ascCall } from './asc.mjs';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const BUNDLE = 'com.tokinets.lingua';
/* Apple がその版を「閉じた」とする状態。審査中・準備中は含めない ── そこへは
   同じ版のビルドをまだ足せる。 */
const CLOSED = ['READY_FOR_SALE', 'READY_FOR_DISTRIBUTION', 'PENDING_DEVELOPER_RELEASE',
                'PROCESSING_FOR_DISTRIBUTION', 'REPLACED_WITH_NEW_VERSION', 'REMOVED_FROM_SALE'];

const mine = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const num = (v) => String(v).split('.').map((x) => parseInt(x, 10) || 0);
const above = (a, b) => { const x = num(a), y = num(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0; }
  return false; };

if (!ascKeys()) { console.log(`version-check: package.json says ${mine}; no ASC_* keys here, so Apple was not asked (the deploy workflow asks).`); process.exit(0); }

const tok = ascJwt();
const app = (await ascCall(tok, 'GET', `/apps?filter[bundleId]=${BUNDLE}`)).data[0];
if (!app) throw new Error(`no app with bundle id ${BUNDLE}`);
const vers = (await ascCall(tok, 'GET', `/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=200`)).data;
const closed = vers.filter((v) => CLOSED.includes(v.attributes.appStoreState || v.attributes.appVersionState));
let top = null;
for (const v of closed) if (!top || above(v.attributes.versionString, top)) top = v.attributes.versionString;
console.log(`version-check: package.json ${mine}; Apple has closed ${closed.length} version(s), highest ${top || '(none)'}`);
if (top && !above(mine, top)) {
  console.error(`\n  package.json "version" is ${mine} and Apple has already closed ${top}.\n` +
                `  Raise "version" in package.json (one place; the workflow writes pbxproj)\n` +
                `  -- an upload with this version is refused by email an hour later (ITMS-90186).`);
  process.exit(1);
}
