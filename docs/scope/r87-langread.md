# r87-langread — 「この人はこの言語を読めるか」を一つの函数に

枝 `claude/r87-langread`（`integ-0905` から）。

## 何をするか

`supabase/schema.sql` の三か所 ── `language_read`（language 表の policy）・`language_seen`（view）・
`slice_read`（slice の policy）── がそれぞれ別に「誰がこの言語を読めるか」を書いていて、`language_seen`
だけが `block_hides()` を訊く。決定（2026-09-25）「ブロックした相手の公開言語は見えない（両向き）」を三つの道
全部に効かせるため、問いを一つの函数 `lang_readable(uuid)` に書き、三か所ともそれを訊く形に書き直す。
古い三つの条件は消す。

振る舞い: 自分の言語・取った言語（`language_take`）は今のまま読める。公開言語はブロックの両向きで読めない。
slice の「どの種類を読めるか」（記事の五種類／`slice_dl` の三種類／持ち主は全部）は変えない。

`tools/rls-check.mjs`: 三つの道それぞれで「ブロックの両向きで読めない」を CASES に足し、古い schema で赤を
一度見る。言語を読む道（language・slice の SELECT policy と、その二表を読む view）をカタログから数え、全部が
`lang_readable` を通るかを見る。

## 持つファイル

- `supabase/schema.sql`（`language_read`・`language_seen`・`slice_read` と新しい函数の所だけ）
- `tools/rls-check.mjs`
- `docs/FEATURE_RULES.md`（§ Blocking の該当文だけ）
- `docs/CHANGELOG.md`
- `docs/scope/r87-langread.md`

## 持たない物

`www/` 全部。`take_make`（新しく取る道）を含め、上の三か所以外の schema.sql。

---

## 報告（2026-09-25）

### 何を、どのファイルで

- `supabase/schema.sql`
  - 新しい函数 `lang_readable(lang uuid)`（`block_hides()` の直後。SQL の本体は作る時に読まれるので、
    `language_took()` と `block_hides()` の後でないと置けない）。本人のもの ／ 取ったもの（`language_took`）／
    公開されていて持ち主との間にどちら向きのブロックも無いもの、なら true。`security definer` ── `language` の
    policy から訊かれて `language` を読むので、呼ぶ人の権限だとその policy が自分自身を訊くことになる。
  - `language_read` → `using (lang_readable(id))`。
  - `language_seen` → `where lang_readable(l.id)`。
  - `slice_read` → 最初に `lang_readable(language)` を一回訊き、その後に「どの種類が降りるか」だけを書く
    （持ち主は全部 ／ 記事の五種類 ／ `words`・`phases`・`gram2` は `slice_dl`）。
  - 三か所に別々に書かれていた `published_at is not null or language_took(...)`（と `language_seen` の
    `block_hides`）は消した。
- `tools/rls-check.mjs`
  - CASES: BD・BK の公開言語に記事（dl 開き）と辞書を置き、ブロックの間は **両向き**で `language` 表・
    記事の slice・辞書の slice が読めない（6 件）。ブロックされていない B は同じ言語と辞書を読める、
    BD は自分の物を全部読める、BK が取った言語は表・辞書からも読み続ける（件数は run の最終行を見ること）。
  - LANG_READ（数える形）: カタログから `language`・`slice` の SELECT policy 全部と、そのどちらかの上に立つ
    view 全部を列挙し、それぞれが `lang_readable(` を訊いているかを見る。今は 3 本（`language_read`・
    `slice_read`・`language_seen`）。明日足した policy や view が自分の言葉で訊いていれば赤。
  - SHAPE「and published is what opens the other one」: slice の policy が `published_at` と書くことを
    求めていた。公開の扉は `lang_readable()` の中に移ったので、その函数に訊く形に書き直した。
- `docs/FEATURE_RULES.md` § Blocking: 公開言語の文を「三つの道が一つの函数を訊く」に、末尾の
  「`language_read` と `slice_read` はまだブロックを訊かない」の文は偽になったので消した。
- `docs/CHANGELOG.md`: 2026-09-25 の項（コードより前のコミット）。

### 振る舞い

- ブロックの間（どちらが作ったブロックでも）、相手の公開言語は `language` 表・`language_seen`・slice の
  どこからも読めない。
- 変わらない物: 自分の言語、取った言語（ブロックの間でも読める ── 未決定のまま）、ブロックの無い相手の公開言語、
  slice のどの種類が降りるか、スタッフの道（`admin_*` の函数は `is_staff()`/`is_admin()` を中で訊く別の道で、
  触っていない）。

### 保存する物

無し。表・列・行は増えも減りもしない。サーバーの読みの条件と函数一つだけ。サーバーへの貼り付けが要る
（`schema.sql` を一回、いつも通り）。

### 回した検査

- `npm run rls`、古い schema で: 新しい 6 件（両向き × 表・記事・辞書）が FAIL、LANG_READ が 3 道とも FAIL を見た。
- 書き直し後: 一回目は SHAPE 1 件（上の published）と LANG_READ 3 件が FAIL ── LANG_READ は検査側の誤り
  （bool が `true` で出るのを `t` と比べていた）。両方直して緑:
  `rls: 553 attempts ... none of them got through`、`language: 3 roads a language is read by, 3 ask lang_readable()`、
  anon は函数 82 本全部を断る（新しい函数も足元の一括で閉じている）。
- `node tools/docs-check.mjs` 緑、コミットごとの pre-commit（FAST）緑。
- 全ゲートは回していない（規則 6）。`www/` は変えていない。

### CODE / DEVICE / OWNER

- **CODE CONFIRMED**: rls-check（本物の PostgreSQL に schema.sql を当てて、二人目として試す）で上の通り。
- **DEVICE CONFIRMED**: 無し。サーバーに貼られていない。アプリは `language` 表・slice から他人の言語を探さない
  ので、画面の変化は無い想定（測っていない）。
- **OWNER CONFIRMED**: 無し。

### オーナー・リーダーへ（決めていない物）

1. **ブロックの間に新しく「取る」**: `take_make`（持ち物の外）は「今公開されているか」だけを訊き、ブロックを
   訊かない。だから BK は BD の公開言語を（`lang_readable` で読めないのに）`language_take` に入れられ、入れた
   瞬間に `language_took()` の枝で読めるようになる ── ブロックを越える道が一本残っている。rls-check でまだ
   試していない（測っていない、コードを読んだだけ）。`take_make` が `lang_readable(language)` を訊く形に書き直すのが
   覆い方だと思うが、「取った言語とブロック」自体が未決定なので触っていない。
2. r85 の問い 1（ブロックの前に取った言語を外すか）は変わらず未決定。`lang_readable()` の `language_took` の
   枝がその答えの場所になる。

### 持ち物の外で、今回の変更で偽になった／古い文（リーダーへ）

- `supabase/schema.sql` の `admin_counts()` の上のコメント「`language_read`, which today is "published, or yours"」
  ── 取った言語の時から既に古く、今は `lang_readable()`。
- `docs/FEATURE_RULES.md` の決定ログ 2026-09-25 の Implementation status「ブロックした相手の公開言語 ──
  `language_seen` で外す」── 今は三つの道。
- `docs/STATE.md:39-40` は「`block_hides()` 一つで外す（…公開言語も…）」で、偽ではないが、言語の方は
  `lang_readable()` が一つの場所になった。

### リーダーの指示が違っていた所

無し。（「数える形」は policy と view までにした。definer の函数で `language`・slice を読む物は `admin_*` と
`slice_hist` のトリガーで、どれもスタッフの道か書く側なので数えていない ── 数えるなら除外の一覧が要り、それは
手で書く一覧になる。）
