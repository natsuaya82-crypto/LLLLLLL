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

## 報告（2026-09-30）
- **2 は直した**: `addPosSet` を消し、`wdGen()` は `genWords(1, wEdit.pos)` だけを聞く。`genWords()` から「品詞を辞書から引く」
  枝（`L.pos`・`pp`）を消した。決定ログ 2026-09-30 の「つづり・読み・品詞」を「つづり・読み。品詞は画面の物のまま」に直した。
- **赤を見た**: 直す前の `wordsheet.js`・`assist.js` に戻して `gen-check` 2 が
  「the sheet showed n and a press changed it: v:ka v:manka …」で赤、戻して緑。
- **回した**: FAST 19 本・`gen`・`word`。ゲートは回していない。
- **1 は直していない（書かれた仕様）**: 上の「測った原因」。オーナーに訊くこと ──
  (a) 新しい語の画面で派生の規則の語を保存と一緒に作るのをやめるか、(b) 作るが意味を持たせるか、
  (c) 既定で外しておき「＋」で足すか、(d) 今のまま（古い規則 `pos:''` を持つ言語だけの話として）。
  既にある指小の語（`fm:'dim'`・`from` あり・`mns` 空）は一つも触っていない。サーバーのデータは見られないので、
  実際に何語あるかは数えていない。形は一つ: `addFmWrite()`/`fmrAdd()` が書いた `{hw, pos(親と同じ), from, fm, sp, mns:[], mn:''}`。
- **写真**: `shots/r156-before-1..5`（直す前: 生成で名詞→動詞、名詞 tamo を保存すると一覧に意味の無い tamok）、
  `shots/r156-after-1..3`（直した後: 5 回押しても名詞のまま）。1 は直していないので保存後の一覧の「後」は無い。
