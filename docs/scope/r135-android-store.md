# r135-android-store ── Play ストアに出すための文・道具・答えの案

ブランチ `claude/r135-android-store`（`integ-0905` `a8fc0106` から）。同時に r134（`android/`・`android-*.yml`）が動いている。

オーナーの言葉（2026-09-29）:「Android一気に進めて欲しい」「オーナーのやる作業はまとめてやるから…俺がやる作業終わったらもうリリースできるくらいまで詰めて欲しい」。
オーナーに Mac もターミナルも無い。

## やること
1. Play の掲載の文を 10 言語で `store-play/<locale>.json`（title・shortDescription・fullDescription）。iOS の `store/*.json` をもとに、Android に在る物だけ。
   長さと Play が断る文字を見る道具（`tools/play-listing.mjs`、`--dry` は鍵なし）。
2. `.github/workflows/play-listing.yml`（手で押す、`GOOGLE_PLAY_SERVICE_ACCOUNT`、edits.listings）。鍵が無ければ止まって何をすべきか言う。
3. Play Console で手で答える物の答えの案を `docs/ANDROID.md` に（データ セーフティ・レーティング・対象年齢・広告・アプリのアクセス・プライバシーポリシー）。
4. `docs/ANDROID.md` を今の文に、「オーナーがする作業」を一つの順番つきの一覧に。
5. スクショの決まりと、`tools/shot.mjs` で Android の縦の大きさを 10 言語で撮る段取り（試しは一言語数枚）。

## 触ってよいファイル
`docs/ANDROID.md`・`store-play/`（新）・`tools/play-listing.mjs`（新）・`tools/play-shots.mjs`（新）・`tools/shot.mjs`（`--play` の旗を一つ ── 撮る仕組みを二つにしないため。2026-09-29 に誰も触っていないのを `git log --all` で見た）・`.github/workflows/play-*.yml`（新）・このファイル・`shots/r135/`。
`package.json` の scripts に一行を足すなら、それは assets-check のため（下の報告に書く）。

## 触らないもの
`android/`・`android-*.yml`（r134）・`www/`・`ios/`・`supabase/`・`store/`・他の人のブランチ。ゲートは回さない。

---

# 報告（2026-09-29）

コミット: `a691dc06` scope → `94199720` 掲載の文・道具・workflow → `c366896c` shot の `--play` と play-shots → `e7876122` play-shots.yml → `d995e309` ANDROID.md。
`origin/integ-0905` は `a8fc0106` から動いていない（取り込む物なし）。

| ファイル | 何を・なぜ |
|---|---|
| `store-play/*.json`（10） | title・shortDescription・fullDescription。title と full は iOS の name と description のまま（iPhone 固有の語は元から無い）。short は promotionalText を 80 字に |
| `tools/play-listing.mjs` | 長さ・制御文字・絵文字・`<>`・宣伝の語・Android に無い物の名前を見る。`--dry` は鍵なし。鍵があれば edits → listings を 10 言語 → commit |
| `.github/workflows/play-listing.yml` | 手で押す。鍵が無ければ手順を言って止まる |
| `tools/shot.mjs` | `--play` を一つ: 405×720 を 8/3 倍（1080×1920）、一画面、JPEG。territory の外 ── 撮り方を二つにしないため。上の「触ってよいファイル」に足した |
| `tools/play-shots.mjs`・`.github/workflows/play-shots.yml` | 10 言語を回して `shots/play/<言語>/` に並べ、JPEG の頭から大きさを見る。Actions で撮って Artifacts に |
| `docs/ANDROID.md` | § Play の掲載の文・§ スクリーンショット・§ Play Console で手で答える物・§ オーナーがすること（14 の順番）。古い文（`device.platform` は本番に無い、説明文はオーナーが書く）を直した |

- 保存・移行・削除・プラン: なし。`www/`・`android/`・`supabase/` は触っていない。
- 確かめたこと（CODE CONFIRMED）: `play-listing --dry` が 10 言語とも緑。わざと壊した写し（81 字・絵文字・iPhone・ウィジェット・Best・一言語欠け）で 6 つとも赤、鍵なしで止まるのも見た。
  `play-shots --only ja feed letters kb` で 1080×1920・3 成分の JPEG が 3 枚。`assets` と `docs` の fast は緑。YAML は読めた。ゲートは回していない。
- 確かめていないこと: Play の API に実際に送ること（鍵もアプリも無い）。workflow を Actions で押すこと（既定のブランチに入るまで押せない）。
  CI で ja・ko・zh の字が出るか（`fonts-noto-cjk` を入れているが見ていない）。AD_ID が manifest に入らないこと。
- 知っている限界: スクショの中身は fixture で、ストアの絵ではない。docs の r134 の名前（android-keygen.yml・android-release.yml・GOOGLE_WEB_CLIENT_ID）は r134 が入るまで
  このブランチに無いので backtick を付けていない。
- オーナーが決める物: 掲載の文、見せる画面、フィーチャー グラフィック、カテゴリ、連絡先のメール、アカウント削除の URL（Play が必須）、Android の Apple のサインイン、
  デベロッパー アカウントが個人か組織か（個人なら 12 人・14 日のクローズド テスト）。
