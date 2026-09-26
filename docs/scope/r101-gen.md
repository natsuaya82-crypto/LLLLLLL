# r101-gen ── 単語の自動生成と語源の系統図（1.0.3）

ブランチ `claude/r101-gen`（`integ-0905` から）。決定ログ `docs/FEATURE_RULES.md` 2026-09-26
「他の道具の強いところを全部入れる」の最初の二つ。

## 持ち物（これ以外は触らない）
- `www/assist.js` ── 候補を作る計算（新しく一つ、`genWords()`）
- `www/words.js` ── 辞書の帯に生成への扉、生成の画面 `vGen`・音節の形の画面 `vGenSyl`
- `www/wordsheet.js` ── 語を選ぶ画面 `vRelate` に「由来の語」の面、編集画面に由来の行、語のページから系統図への扉、
  系統図 `vEty`、`wDrop()`（親が消えても子の `from` を残す）
- `www/phases.js` ── `STG_DEF` に `syl`（音節の形、この言語の物）
- `www/core.js` ── `wIsForm()` 一行（親を消した後の活用語、下の報告）
- `www/letters.js` ── `wRename()` に一行（系統図の道が改名に付いて行く）
- `www/shell.js` ── `PAGES` に `gen`・`gensyl`・`ety` の三行、`pageName()` の relate の名
- `www/route-map.js`・`www/act-map.js` ── その三つの `page(...)` と押す名前
- `www/i18n/*.js` 十言語 ── 新しい鍵
- `tools/fixture.mjs`（面が要れば）、新しい検査 `tools/gen-check.mjs` と `package.json`・`tools/gate.mjs` の一行
- `docs/CHANGELOG.md`・`docs/FEATURES.md`（該当の行）・この文書

## しないこと
- 新しい slice は作らない（語の由来は既にある `word.from`、音節の形は `phases` slice の `STG.syl`）
- 昔の Make 画面は戻さない、`makeWord()`/`asWord()` の挙動は変えない
- 無料/有料の線・候補の数の上限は決めない ── 既定のまま全プラン・上限なし（`can()` を足さない）
- ゲートは回さない（一つの検査と FAST だけ）

## 決まっていないこと（作らずに書いておく）
- 生成の扉のマーク ── 「生成」に決まったマークが無いので、帯に字（`選択` と同じ形）で置く。マークはオーナーが決める。

## 報告（2026-09-26）

コミット: `8e4eaa59`（直し: from を残す）・`d0c8479f`（直し: 編集中の関係は下書き）・`03d782a8`（機能）・
`578b78c4`（integ-0905 を取り込み、CHANGELOG の頭だけ衝突 ── 両方残した）。

### A. 単語を作る
- **扉**: 辞書の帯に「作る」（`www/words.js` § vWords）。選択中と他の人の言語では出ない。
- **画面** `gen`（`vGen`）: 上に「音節の形 CV · CVC ›」、下に候補 8 つ（つづり・IPA）。右上「作り直す」で並べ直す。
  候補を押すと `genTake()` → `openAdd('')` で「単語の作成」シートがそのつづりで開く ── 足す道はいつものシート一つ
  （意味・品詞・上限の確認はそこ）。
- **計算** `genWords()`（`www/assist.js`、端末のみ・全プラン・上限なし）: 音は**文字が書く音**（`ltUnits` を `uSplit` し、
  IPA の表にある物だけ）、形は `genShapes()`。`spOf()` で綴り、文字の無い位置が出たら捨てる。辞書と同じ音・同じつづりは出さない。
  `spOf()` が付ける音の写し `u` は文字の音と同じなら外す（`spSetU`）。
- **音節の形** `gensyl`（`vGenSyl`）: V・CV・VC・CVC・CCV・CVCC・CCVC の一覧、押すと付く・外れる。
  **新しく保存する物: `STG.syl`**（`phases` slice、`SLICES` にあるのでサーバーへ上がる）。選んでいない言語は辞書の語から
  読み取って表示するだけで書かない。最後の一つは外せない。C・V は `t('gen.c')`・`t('gen.v')`（de は K）。
- **二つの生成器**: `asWord()`（`www/assist.js`、取り込みが意味だけの行に語を当てる所）と `genWords()` が並んでいる。
  `asWord()` を `genWords()` に寄せるのは `www/import.js` の挙動が変わるので持ち物の外 ── リーダーが決めること。

### B. 語源の系統図
- 由来は前からある `word.from`（親のつづり、値）。**新しい欄・新しい slice は無し**。
- **編集画面**に「由来の語 tir ›」（`wdFromRowHTML`）→ `relate` の `from:<語>` 面（類義語と同じ一覧、`vRelate`）で選ぶ・
  同じ物を押すと外れる（`wFromSet`）。自分と子孫は並ばず、関数も断る（`wDescends`、輪を作らない）。その場で新しい語を作って
  由来にもできる（`relNew`）。作る時のシートには出さない（今まで通り「派生語の作成」が由来を持って開く）。
- **語のページ**の関連語の欄に「系統図 ›」（由来か子がある語だけ）→ `ety`（`vEty`）: 祖先を上から、この語を太字、子孫を
  └ と字下げで。古い形の活用語は木に入れない（家族の欄と同じ）。
- **親を消しても子の `from` は残る**（`wDrop()` の書き直し）。親の居ない由来は、家族の欄と木で**つづりだけの押せない行**。
  それに伴い `wIsForm()` を「親が辞書に居る古い活用」に書き直した ── そうしないと親を消した後の `tira` がどの一覧にも
  どのページにも出なくなる（前は from を消すことで一覧に戻っていた）。
- 系統図の道: `navRename()` が経路を受け取る形に（`navDrop()` と同じ）、改名で `ety:<語>` が付いて行き、消すと外れる。

### 指示の外で直したもの（同じ面の穴、一つの文で覆った）
- **語の編集中に選んだ類義語・対義語が下書きになっていなかった**。測った: 選んで保存せずに戻ると何も聞かれず、選んだ物は
  メモリに残りディスクに無い（次の保存で一緒に上がる）。由来も同じ道に乗るので、下書きの「今の姿」`wdSigEdit()` に
  編集中の語の syn・ant・from を入れた。保存が金になり、戻ると「入力内容を保存しますか？」、「いいえ」で戻る。

### 確かめたこと（CODE CONFIRMED）
- `tools/gen-check.mjs`（`npm run gen`、`tools/gate.mjs` の SLOW に一行、ポート 8262）── 全部緑。
- 赤を見たもの（バグを戻して一つずつ）: 1 `from` が消える／1b `tira` が消える／2b 形が slice に入らない（`saveStg` を抜く）／
  5 輪（`wDescends` を常に false）／5b 下書き（`wdSigEdit` に語を渡さない）／7 改名の道（`letters.js` の一行を抜く）。
- 回した単発: `es5` `dead` `sides` `face` `box` `css-once` `store` `del` `writes` `docs` `assets`・`i18n`（pre-commit、
  「CVC が全言語で同じ」を t() に通して緑）・`keep`（下書きの問いを変えたので一回）。**ゲートは回していない**。
  `act`・`press`・`page`・`load` は回していない（新しい経路 3 つ、押す名前 4 つ、`tools/fixture.mjs` の halfDone に面 3 つ）。

### 確かめていないこと
- 実機（DEVICE CONFIRMED 無し）。サーバーに `STG.syl` が上がって戻ること（`phases` slice の道そのものは既存）。
- 写真の候補の語は乱数なので撮るたびに変わる。

### 写真（`shots/r101/`、日本語）
- 辞書の帯: 前 `0-words-before.png` → 後 `1-words-after.png`（右上に「作る」）
- 作る: `2-gen.png` → 押した後 `3-gen-pressed-add-sheet.png`（シートにつづり）
- 音節の形: 前 `4-gensyl-before.png`（CV・CVC）→ CCV を付け CVC を外した後 `5-gensyl-after-CCV-on-CVC-off.png` →
  その形で作り直した `6-gen-after-shapes.png`
- 由来を選ぶ: 前 `8-relate-from-before.png` → sar を選んだ後 `9-relate-from-after-sar.png`、編集画面の行 `shot-form-edit-tiror-ja.png`
- 系統図: 語のページの扉 `7-word-page-tir.png`、木 `10-ety-tir-with-grandchild.png`、親を消した後 `11-ety-tiror-parent-deleted.png`・
  `12-word-page-tiror-parent-deleted.png`、一覧 `13-words-tir-deleted.png`
- 下書きの問い: `14-edit-back-after-syn.png`

### オーナーに訊くこと（作った形のまま待っている）
- 「作る」「作り直す」のマーク（今は字）。
- 生成・系統図の有料/無料の線と候補の数（今は全プラン・8 つ・上限なし）。
- 最後の音節の形を外せない形でよいか。
- 決定ログ 2026-09-26 の「Implementation status: 未」は r102 と同じ項なので書き換えていない（リーダーが取り込み時に）。
