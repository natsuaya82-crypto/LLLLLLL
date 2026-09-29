// Google Play の電話のスクリーンショットを 10 言語で撮る。
//
//   node tools/play-shots.mjs                       # 10 言語 × 既定の画面
//   node tools/play-shots.mjs --only ja feed kb     # 一言語だけ、画面を名指しで
//
// 撮るのは tools/shot.mjs --play（1080 x 1920、9:16、JPEG）で、ここは言語を回して
// shots/play/<Play の言語コード>/<番号>-<画面>.jpg に並べるだけ。撮り方は shot.mjs の
// 一か所。できた一枚ずつの大きさを JPEG の頭から読み、Play の決まりから外れたら赤。
//
// Play の決まり（電話）: 2〜8 枚、JPEG か透過の無い PNG、一枚 8MB まで、辺は 320〜3840、
// 長辺は短辺の 2 倍まで。おすすめに載るには 1080 以上の 9:16 が 4 枚以上。
// 中身は tools/fixture.mjs の検査用の言語 ── ストアに出す絵にするなら、何を見せるかは
// オーナーのもの（docs/ANDROID.md § スクリーンショット）。

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'shots');
/* 画面の言語 (www/i18n) → Play の言語コード（store-play/ と同じ 10）。 */
const LANGS = { en: 'en-US', de: 'de-DE', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', ja: 'ja-JP', ko: 'ko-KR', pt: 'pt-BR', ru: 'ru-RU', zh: 'zh-CN' };
const DEFAULT = ['feed', 'letters', 'kb', 'words', 'gram', 'profile'];

const argv = process.argv.slice(2);
const oi = argv.indexOf('--only');
const only = oi >= 0 ? argv[oi + 1] : null;
if (only && !LANGS[only]) throw new Error(`--only ${only}: not one of ${Object.keys(LANGS).join(' ')}`);
const named = argv.filter((a, i) => !a.startsWith('--') && !(oi >= 0 && i === oi + 1));
const screens = named.length ? named : DEFAULT;
if (screens.length < 2 || screens.length > 8) console.warn(`Play takes 2 to 8 phone screenshots; this is ${screens.length}`);

/* A JPEG's size is in its SOF segment; no image library needed for that. */
function jpegSize(file) {
  const b = fs.readFileSync(file);
  for (let i = 2; i < b.length;) {
    if (b[i] !== 0xff) break;
    const m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
      return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7), c: b[i + 9], bytes: b.length };
    i += 2 + len;
  }
  throw new Error(`${file}: not a JPEG`);
}

const bad = [];
for (const ui of only ? [only] : Object.keys(LANGS)) {
  const dir = path.join(SHOTS, 'play', LANGS[ui]);
  fs.mkdirSync(dir, { recursive: true });
  execFileSync('node', [path.join(ROOT, 'tools/shot.mjs'), '--play', '--lang', ui].concat(screens), { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
  screens.forEach((s, n) => {
    const from = path.join(SHOTS, s.replace(/[:/#]+/g, '-') + (ui === 'en' ? '' : '-' + ui) + '-play.jpg');
    if (!fs.existsSync(from)) { bad.push(`${ui} ${s}: shot.mjs made no picture`); return; }
    const to = path.join(dir, String(n + 1).padStart(2, '0') + '-' + path.basename(from).replace(/(-[a-z]{2})?-play\.jpg$/, '.jpg'));
    fs.renameSync(from, to);
    const z = jpegSize(to);
    const long = Math.max(z.w, z.h), short = Math.min(z.w, z.h);
    if (short < 320 || long > 3840 || long > 2 * short || z.bytes > 8 * 1024 * 1024) bad.push(`${path.relative(ROOT, to)}: ${z.w}x${z.h} ${z.bytes} bytes is outside Play's rule`);
    else if (z.w !== 1080 || z.h !== 1920) bad.push(`${path.relative(ROOT, to)}: ${z.w}x${z.h}, not the 1080x1920 --play takes`);
    console.log(`${path.relative(ROOT, to)}  ${z.w}x${z.h}`);
  });
}
if (bad.length) { for (const b of bad) console.error('✗ ' + b); process.exit(1); }
