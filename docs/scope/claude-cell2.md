# claude/cell2 — 升は全部「触ったら選択」

「全部のます触ったら選択で」 OWNER 2026-08-28

## 触るもの
- `www/keyboard.js` （シートの升の押し方と、シートの上の帯）
- `www/index.html` （`.kbk.cell` 周りの CSS だけ）
- `tools/kb-check.mjs` （主張の追加と、押しただけで入る主張の差し替え）
- `www/act-map.js` （帯に増えるボタンの名前だけ）

## 触らないもの
`CLAUDE.md` `docs/FEATURE_RULES.md` `docs/CHANGELOG.md`（§19 と決定ログは
リーダーが直す）、`www/i18n/*.js` `tools/fixture.mjs` `www/glyph.js`
`www/post.js` `www/home.js`

## やること
1. 空き升を押したら、その升が選択される（キーが入らない）
2. 隙間（gap キー）と本当の空き升は、押したときの答えが同じ
3. キーを入れるのは帯のボタン。入るのはその升の幅
4. 違うところを触ったら選択が外れる

## 回す検査
`kb` `es5` `box` `act` の四本だけ。`press` は回さない。
