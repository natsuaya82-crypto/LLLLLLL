# r69-misc — 残りのファイルの古い文と二重の答え（2026-09-23）

作業セッション r69-misc（`claude/r69-misc`、`origin/integ-0905` から）。
担当は r63-audit §2-3 R3・R4、§2-4 G1・G2・C、§1 A4 の `migrateSnd`、r61「止めたこと」3、
§2-6 M1・M2（アプリ側）・`fbkRow` のコメント。**ゲートは回していない。ビルドはしていない。
端末では何も確かめていない。**

## やったこと（一項目ずつ、測った → 書き直した → 旧コードで赤を見た）

| 項目 | 測ったこと | 書き直し | 検査（赤を見た） |
|---|---|---|---|
| A4 `migrateSnd` | `snd` を持つ `lingua.set` で起動 → 言語に `k,t,a`、`lingua.set` から `snd` が消えた | `migrateWorld()` の形：写す、印 `SET.sndMoved`、設定は `setKeep()` だけ（前は言語ごと書く `save()`）。書けない言語では何もせず印も立てない | `migrate-check` +3（旧で 2 赤）。`store-check` に `sndMoved` の行 |
| r61-3 語の出し方 | 自作文字オン・k を描いた言語で、否定形の「必要な単語」が `nak`（ローマ字） | 面＝「語は `sfontHTML(wOut(hw))` で出す」。外れていた所：`stSlotRow`（phases.js）、語順の見本 `.gor` ×2・並べるチップ・`g2Row` の `to`（grammar.js）、暦の月と曜日の `wOut` 抜け（numbers.js、借りた文字で辞書は `אאאא`、暦は `kano`） | `line-check` 8（新）：道・道が開く面（`go` の扉を拾う）・文法の全章・全単語の頁を、自作文字と借りた文字の二周で歩き、語そのものの文字の節を数える。phases.js・grammar.js・numbers.js を別々に戻して各々赤 |
| M1 | 読んだ（`ADMINS=[]`）＋測った（旧コードで断られた一覧は空と同じ画面） | 一覧は `FBK` と同じ三つの状態（`null` + `ADMINS_ERR`）。`adRecFind`・`adRecGo` の失敗も `netWhy(d, st)` | `hist-check` +3（旧で 3 赤）。fixture に「スタッフの一覧が断られた」面 |
| M2 アプリ側 | サーバーと同じ `admin=false` の行で @lingua が押せる行 | `adminStaffRow` は `ADMIN_HANDLE`（net.js、`NET_ADMIN` と同じ一つの答え） | `hist-check` +1（旧で赤）。fixture の行を `admin:false` に |
| G2 | `gram2` に VSO と活用一つ → SOV の言語の模型が VSO、活用 1→2 | `gModel()` は言語から毎回作るだけ。`adapter.load/save/storageKey` を消す。**`gram2` の中身は読まない・書かない・消さない** | `gramlang-check` 11〜13 を書き直し（前は「保存物が答える」を守っていた）。旧で 2 赤 |
| G1・C | grep と読み | translate.js・sheet.js・cal.js・numbers.js・rec.js 頭・mod.js `fbkRow`・phases.js/sound.js の「in the backup」を今のことに | コメントのみ |

撮った（`shots/`）：`r69-slot-before/after.png`（否定形の行）、`r69-admin-refused-before/after.png`、
`r69-admin-after.png`。

## 止めたこと・やっていないこと

- **R3（下書きの声がこの端末のファイルを指す）— 止めた。** 直し先は `draftKeep()`（`www/post.js:551`、
  `vo:PW.vo` をそのまま下書きに入れる）と `netDraftUp`/`netUpVoice`（`www/net.js`）で、どちらも r60 の
  持ち物。`net.js:4984-4990` のコメント（「録音は base64 で body に入る」「post-media は PUBLIC」）も今は偽。
  下書きの声を server に上げるか（バケットは今は非公開）はコードの形の話で、r60 か次の session。
- **R4 — 変えなかった。** `voPlay` の `data:audio/mp4` 決め打ちは、`voRead()` がネイティブの橋を要る
  ＝ iOS だけ ＝ 録音はいつも mp4、なので `.webm` がその行に来ることが無い。赤にできない修正は
  「確かめていない原因への修正」になるので入れていない。型の答えを一つにするなら `netUpVoice` の
  `vo.m4a`/`audio/mp4` 決め打ち（net.js、r60）と一緒に。
- `g2Row` の `to` は `line-check` 8 の歩きが届いていない（部品の章に届く種が無い）。同じ一文で覆って
  いるが、赤は見ていない。
- `wordsheet.js:398`（関連語の行 `.relw` が `esc(wOut(...))`）と、単語のページのバーの題（`.navt`、
  `pageName()`、shell.js）は語をローマ字で出す。持ち主が違うので触っていない。`line-check` 8 は
  `.navt` を名前で持ち（会わなければ赤）、`.relw` は歩きが届いていない。

## 持ち主の違う所で、今は偽になった文（報告のみ）

- `www/core.js:220`・`:243`（`gram2` は adapter.js が言語 id で読み書きする）— r60。
- `www/home.js:1608`・`:1709` の `gram2` の説明 — 持ち主を確認して。
- `docs/GRAMMAR-V2-SPEC.md:537`、`docs/DATA_MODEL.md:150`、`docs/BACKLOG.md:884`（`adapter.save`
  の項）— r62。
- `www/core.js:1323` `walkedMigrate()` も `delete SET.done` する（読んだものを消す移行、A4 と同じ面）— r60。
- `netStaffList()`（net.js）はまだ `admin` を select する（誰も読まない列）— r60。

## r60 と組み合わさる所

r60 の `f40488c6`（未取り込み）は起動時に `langLocked()` で保存を拒む。すると起動で走る移行は
書けない。`migrateSnd` はそのとき何もせず印も立てない（`SET.snd` は残るだけで失われない）が、
**写しは二度と起きない**（起動のたびに書けないため）。`migrateWorld` は逆に印を先に立てるので、
写しが拒まれたまま印だけ残る。起動の移行をサーバーの答えの後に走らせるかは boot.js（r60）の話。
