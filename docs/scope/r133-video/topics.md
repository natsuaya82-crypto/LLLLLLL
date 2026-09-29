# 使い方の縦動画 ── 項目一覧

縦 1080×1920、20〜30 秒、ダーク、字幕は英語の大きなセリフ斜体を上に重ねる（2026-09-25 の Devpost デモと同じ形）、
音はタップ音だけ、最後の 2 秒に「Lingua」。撮るのは `node tools/video/rec.mjs <id>`、台本は `tools/video/scripts.mjs`。

載せたのは **今アプリにある機能だけ**（`docs/FEATURES.md` とルート・関数で確かめた）。
外した物: 紙から字を取り込む（`www/sheet.js` は描く所が未完成）、AI に相談（未実装）、Android。

「台本」の欄が ✓ の物は台本があり、撮ってある。

「(有料)」はどこかの有料の段が要る物。どの段かは撮る前に `www/core.js` の `PLANS` で確かめる。

凡例: **見せる** ＝ 何を見せるか一行 / **操作** ＝ 押す順 / **字幕** ＝ 画面に出す英語（→ で区切ると順に出る）

## 1. 文字を描く

| id | 見せる | 操作 | 字幕 | 台本 |
|---|---|---|---|---|
| draw-a-letter | 自分の字を一つ描く | Build → Letters → Alphabet → 字 → ペン → 描く → Round → Save | Draw your own alphabet → Pick a letter → Tap it to open the pen → Draw with your finger → Round bends the last line → Save it → Now it is part of your alphabet | ✓ |
| fill-a-shape | 囲った所を塗る | 字の編集 → 三点以上で囲む → Fill | Close a shape → Fill paints the inside | |
| round-a-line | 線を曲げる・戻す | 線を引く → Round → もう一度 Round | Draw it straight → Round bends it → Tap again to undo | |
| lasso-move | 投げ縄で点を選んで動かす | Lasso → 囲む → ドラッグ | Lasso the points → Drag them anywhere | |
| undo-redo | 一手戻す・進める | 描く → Undo → Redo | Made a mistake? → Undo → Redo | |
| pinch-zoom | 二本指で拡大して細かく描く | 二本指で広げる → 描く | Pinch to zoom in → Draw the small parts | |
| clear-letter | 字を消して描き直す | Clear → 描き直す | Start over any time | |
| borrow-a-character | 既存の文字を借りる | 字 → Choose an existing character → 種類 → 字 | No time to draw? → Borrow any character | |
| letter-sound | 字に音をつける | 字 → Phonology → 音を選ぶ | Give each letter a sound | |
| hear-a-letter | 字の音を聞く | 一覧のスピーカー | Tap to hear it | |
| alphabet-overview | 26 字を全部描いた一覧 | Letters → Alphabet をスクロール | 26 letters, all yours | |
| marks | ！と？を自分の形に | Letters → Marks → ! → 描く | Even ! and ? can be yours | |
| digits | 数字を自分の形に | Letters → Digits → 1 → 描く | Draw your own numbers | |
| number-base | 何進法かを変える（数字の数が変わる） | Digits → 基数 | Count in base 12 if you like | |
| letter-sort | 並べ替え | Alphabet → As arranged | Sort your alphabet | |
| new-letter (有料) | 26 字の外に字を足す | Alphabet → ＋ → 描く | Need more letters? Add them | |
| rename-letter (有料) | 足した字の名前を変える | 字 → 名前 | Name it anything | |
| letter-spacing | 字の間を詰める・広げる | 書き方 → 字間 → スライダー | Set how close your letters sit | |
| vertical-writing (有料) | 縦書き | 書き方 → 方向 → 縦 | Write top to bottom | |
| right-to-left (有料) | 右から左 | 書き方 → 方向 → 右から左 | Or right to left | |
| syllabary (有料) | 音節文字 | 書き方 → Syllabary | One letter per syllable | |
| abugida (有料) | アブギダ（子音＋母音記号） | 書き方 → Abugida → 母音記号を描く | Vowels as marks on consonants | |
| abjad (有料) | アブジャド | 書き方 → Abjad | Consonants only | |
| block-script (有料) | ハングルのように組む | 書き方 → Block → 四つ割りに描く | Build syllables in a square | |
| logography (有料) | 表語文字 | 書き方 → Logography → 単語に字 | One sign per word | |
| export-font | 自分の字をフォントとして書き出す | Letters → 共有 → Font | Your letters as a real font | |
| export-svg | 字を SVG で書き出す | Letters → 共有 → SVG | Take your letters anywhere | |
| my-letters-on-off | アプリを自分の字で表示する／しない | 設定 → 字 | See the app in your own script | |

## 2. キーボード

| id | 見せる | 操作 | 字幕 | 台本 |
|---|---|---|---|---|
| build-a-keyboard | 自分の言語のキーボードを作る | Build → Keyboard → ＋ → Flick → キー → 四方向 → Save | A keyboard for your own language → Add one → Pick a layout → Your letters are already on it → Tap a key → Flick it four ways → Save it → Your keyboard is ready | ✓ |
| qwerty-keyboard | 最初からある QWERTY（字は自分の形） | Keyboard → Keyboard 1 | Your letters on a QWERTY | |
| flick-keyboard | フリック入力 | ＋ → Flick | Flick like Japanese input | |
| chart-keyboard | 表の形 | ＋ → Chart | Or lay it out as a chart | |
| abc-keyboard | ABC 順 | ＋ → ABC | Or in alphabet order | |
| handwriting-keyboard | 手書き入力 | ＋ → Handwriting | Write with your finger, it finds the letter | |
| key-flick-directions | キーの上下左右に字を置く | キー → Up → 字 | Put a letter on each direction | |
| key-any-character | キーに既存の文字を置く | キー → 字の種類 → 字 | Any character on any key | |
| key-space-return | スペース・改行・消すキー | キー → Space / New line / Backspace | Space, return, delete | |
| add-a-row | 行を足す | 行を選ぶ → ＋ | Add a row | |
| delete-a-column | 列を消す | 列の字 → ゴミ箱 | Remove a column | |
| align-a-row | 行を左・中・右に寄せる | 行 → 寄せ | Line it up | |
| merge-keys | キーをつなぐ | キーを選ぶ → 結合 | Join two keys into one | |
| move-a-key | 長押しで運ぶ | キーを長押し → ドラッグ | Hold and drag to move | |
| add-a-layer | 二枚目の面 | 面の＋ | Add another layer | |
| keyboard-undo | 一手戻す | ゴミ箱 → Undo | Undo anything | |
| change-pattern | あとから型を変える | … → 型 | Switch the layout later | |
| letter-on-key | キーに字の名前も出す | A letter on each key | Show the roman letter too | |
| apply-to-phone | iPhone のキーボードにする（iOS の設定を含む・実機で撮る） | Apply to the phone → 設定 → キーボード → 追加 | Use it in the app, on your iPhone | |
| type-in-your-letters | Lingua キーボードで打つ（実機で撮る） | 投稿 → 地球儀 → Lingua | Type in your own letters | |

## 3. 単語

| id | 見せる | 操作 | 字幕 | 台本 |
|---|---|---|---|---|
| add-a-word | 単語を一つ作る | Lexicon → ＋ → つづり → 意味 → Save | Make your first word | |
| word-page | 単語の頁（辞書の一頁） | 単語を押す | Every word gets a page | |
| meanings | 意味を三つまで | 単語 → 編集 → 意味 | One word, many meanings | |
| part-of-speech | 品詞 | 編集 → 品詞 | Noun, verb, anything | |
| examples | 例文 | 編集 → 例文 | Show it in a sentence | |
| synonyms | 類義語・対義語 | 編集 → 関係 | Link words together | |
| register | 語の使われ方 | 編集 → 位相 | Formal? Slang? Say so | |
| fields | 分野 | 編集 → 分野 | Tag words by topic | |
| inflection | 活用形 | 単語 → 活用 | Past, progressive, plural | |
| derivation | 派生語 | 単語 → 派生 → ＋ | Grow new words from old ones | |
| etymology | 語源の系統図 | 単語 → 語源 | See where a word came from | |
| generate-words | 音から単語を自動で作る | Lexicon → 生成 → 候補 → 辞書へ | Out of ideas? Generate words | |
| syllable-shapes | 音節の形を決める | 生成 → 音節 | Set the shape of a syllable | |
| reading | 字と違う読み方 (有料) | 単語 → 読み → 音 | When it is not read as spelt | |
| hear-a-word | 単語を読み上げる | 単語 → スピーカー | Hear how it sounds | |
| search-words | 単語を探す | Build → 検索 | Find any word fast | |
| filter-words | 品詞などで絞る | Lexicon → 絞り込み | Only the verbs | |
| sort-words | 並べ替え | Lexicon → 並び | A to Z, newest, anything | |
| import-a-list | 単語の一覧を貼って取り込む | 取り込み → 貼る → 列を選ぶ | Already have a word list? Paste it | |
| export-csv (有料) | CSV で書き出す | 設定 → 書き出し | Take your dictionary out | |
| word-card | 単語を辞書の一頁の絵で共有 | 単語 → 共有 | Share a word as a page | |
| calendar | 月と曜日の名前を自分の言語で | 暦 | Name the months yourself | |

## 4. 文法とノート

| id | 見せる | 操作 | 字幕 | 台本 |
|---|---|---|---|---|
| grammar-chapters | 文法書の章の一覧 | Grammar | A whole grammar book, ready to fill | |
| word-order | 語順を決める | Grammar → 語順 | Subject, object, verb? You decide | |
| grammar-rule | 規則を一つ書く | 章 → 規則 → 例 | Write a rule, see it work | |
| form-rules | 規則で活用形を作る | 規則 → 形を作る | Rules that make new forms | |
| gloss | 一文を行間訳で見る | 例文 → 行間 | See every word explained | |
| notebook | ノート | Notebook → ＋ | Keep notes on your language | |
| about-page | 言語の頁（概要・音・字・語彙・文法） | 言語の名前 | A page about your language | |
| publish-language | 言語の頁を公開 | 言語の頁 → 公開 | Let others read it | |
| download-a-language | 人の言語を取り込む | 人の言語の頁 → ↓ | Take someone else's language home | |

## 5. 投稿

| id | 見せる | 操作 | 字幕 | 台本 |
|---|---|---|---|---|
| post-to-the-prompt | 今日のお題に答える | Home → お題 → 打つ → 送る | A new prompt every day → Tap it to answer → Write in your own language → The prompt comes with it → Post it → Your answer is on the timeline → Everyone answers the same prompt | ✓ |
| first-post | 最初の投稿 | ＋ → 打つ → 送る | Post in a language only you made | |
| meaning-line | 意味の行（読む人のため） | 投稿 → 意味 | Add what it means | |
| photo-post | 写真をつける | 投稿 → 写真 | Add a photo | |
| letters-on-photo | 写真の上に自分の字を置く | 写真 → 字を置く | Write on your photo in your script | |
| voice-post | 声を 30 秒 | 投稿 → マイク | Say it out loud | |
| tags | タグを四つまで | 投稿 → # | Tag your post | |
| reply | 返信する | 投稿 → 吹き出し | Reply in your language | |
| thread | 会話のつながり | 投稿を押す | Follow the conversation | |
| quote | 引用する | リポスト → 引用 | Quote a post | |
| repost | リポスト | リポスト | Share it with your followers | |
| like | いいね | ハート | Like it | |
| edit-post | 投稿を直す | … → 編集 | Fix a typo | |
| pin-post | プロフィールに固定 | … → 固定 | Pin your best one | |
| drafts | 下書き | 投稿 → 下書き | Save it for later | |
| post-card | 一行を絵にして共有 | 共有 → カード | Share it as a picture | |
| read-more | 長い投稿は畳まれる | もっと読む | Long posts fold | |
| for-you-following | おすすめ／フォロー中 | Home → For you | For you, or only who you follow | |
| explore | 人と投稿を探す | 検索 → 打つ | Find people and posts | |
| follow | フォローする | 人 → Follow | Follow other makers | |
| notices | 通知 | ベル | See who answered | |
| push-settings | 通知の種類を選ぶ | 設定 → 通知 | Choose what to hear about | |

## 6. プロフィールとアカウント

| id | 見せる | 操作 | 字幕 | 台本 |
|---|---|---|---|---|
| profile | プロフィール | 人のタブ | Your profile | |
| edit-profile | 顔・名前・一言 | ペン | Set your face and name | |
| photos-tab | 写真タブ | Profile → Photos | All your photos in one place | |
| likes-tab | いいねタブ | Profile → Likes | Everything you liked | |
| switch-language (有料) | 長押しで言語を切り替え | Profile を長押し | Hold to switch languages | |
| second-language (有料) | 言語をもう一つ | 設定 → 言語 → 追加 | More than one language | |
| theme | 明るい／暗い | 設定 → テーマ | Light or dark | |
| app-language | アプリの言語（10） | 設定 → 言語 | The app speaks 10 languages | |
| block-report | ブロック・通報 | … → ブロック | Keep it friendly | |
| contact | 意見・要望を送る | 設定 → お問い合わせ | Tell us what you want | |
| cloud | どの端末でも同じ言語（サインインで戻る） | サインイン | Your language lives in your account | |

## 7. プラン

| id | 見せる | 操作 | 字幕 | 台本 |
|---|---|---|---|---|
| free-plan | 無料でできること（38 字・100 語・キーボード・投稿） | プラン | Free: your own a–z, 100 words, posts | |
| paid-plans | 有料で広がること（どの段で何が開くかは `PLANS`・`CAN` を読んで字幕を決める） | プラン → 段 | (撮る前に決める) | |
| nothing-is-lost | プランが切れても何も消えない | プラン | Your words stay yours, always | |
