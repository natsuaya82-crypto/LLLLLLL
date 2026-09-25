# r90-plan ── plan-check が全ゲートの下でだけ赤くなる原因を測る

枝 `claude/r90-plan`（`integ-0905` 24876e3a から）。

## 何が起きているか（リーダーが測った）
全ゲート（遅い検査 4 本並列）で plan-check の二行だけ赤:
- the launch after it ASKS again … (**never asked in 5s**)
- and the answer is taken … (**nothing**)
単独では 4 回とも緑。

## 触ってよいもの
- `tools/plan-check.mjs`
- 原因がアプリにあると測れた場合だけ、`www/store.js`・`www/core.js`・`www/boot.js`・`www/net.js` のうち要る物（触る前にここに書く）
- `docs/scope/r90-plan.md`、振る舞いが変われば `docs/CHANGELOG.md`

## 触らないもの
`www/index.html` ほか上に無い全部。全ゲートは回さない。仕様は決めない。

## 報告
（下に書く）
