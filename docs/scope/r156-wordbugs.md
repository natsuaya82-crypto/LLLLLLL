# r156-wordbugs ── 辞書の動画で見えた二つ（「直して」OWNER 2026-09-30）

ブランチ `claude/r156-wordbugs`（`integ-0905` から）。見えた所: `claude/r133-video` の f12bbeaa の本文
「撮り方で避けた所」。

1. 名詞を保存すると指小形が意味の無い別の語として一覧に入る。
2. 新しい単語の画面（`openAdd`）で自動生成を押すと品詞が勝手に変わる。

## 測った原因
- **1**: `addWrite()` → `addFmWrite()`（`www/wordsheet.js`）が、新しい語の画面の「規則で作る形」の行
  （`addFms`、`addFmSync()` が派生の規則 `STG.fm` から作る）を普通の語として書く。規則はフィクスチャの
  `fr2`（`fm:'dim'`、`pos:''`＝全品詞）。`tamo`（名詞）を保存 → `tamok`（`fm:'dim'`、`from:'tamo'`、`mns:[]`）。
  行は打った時点で画面に「規則で作る形　指小　tamok　−」と出ている。これは書かれた仕様
  （`docs/CHANGELOG.md`「A word made brings its forms with it」のオーナーの言葉「保存したら出る。消してたら消す。」、
  2026-09-23 の決定「派生は今まで通り語として保存する」、`fmrWord()` の「派生は意味を持たない」）→ **止めて報告。直さない。**
- **2**: 画面は `addPos`（既定 `'n'`、前の語の品詞）を「品詞 名詞」として出して開くが、`addPosSet` は `false`。
  `wdGen()` はそのとき `genWords(1, null)` で辞書の割合から品詞を引き、表示中の品詞を上書きする
  （10 回押して adj・v・n・pro・part）。品詞の答えが二つ（画面の `wEdit.pos` と隠れた `addPosSet`）ある。

## 触る物
- `www/wordsheet.js` ── `wdGen()` の書き直し、`addPosSet` を消す（`wdSetPos()`・`openAdd()` の一行ずつ）
- `www/assist.js` ── `genWords()` の「品詞を引く」枝を消す（呼び手は一つで、品詞を必ず渡す）
- `tools/gen-check.mjs` ── 2 を「画面の品詞のまま」に書き直す
- `docs/CHANGELOG.md`・`docs/FEATURE_RULES.md`（2026-09-30 の項の「品詞が埋まる」を直す）・この文書・`shots/r156-*.png`

## 触らない物
- 派生規則・`addFmWrite()`・`fmrWord()`・既にある語（指小の語を一つも消さない・書き換えない）
- それ以外の全部。ゲートは回さない（FAST と `gen`・触った検査だけ）。

## CLAUDE.md（リーダーが直す）
- 今のところ無し。
