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
`docs/ANDROID.md`・`store-play/`（新）・`tools/play-listing.mjs`（新）・`tools/play-shots.mjs`（新）・`.github/workflows/play-*.yml`（新）・このファイル・`shots/r135/`。
`package.json` の scripts に一行を足すなら、それは assets-check のため（下の報告に書く）。

## 触らないもの
`android/`・`android-*.yml`（r134）・`www/`・`ios/`・`supabase/`・`store/`・他の人のブランチ。ゲートは回さない。
