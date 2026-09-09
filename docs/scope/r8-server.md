# claude/r8-server — 受け持ち

リーダーの指示（2026-09-08）。OWNER 2026-09-08「端末に hide の存在があるわけ
ないやろ。全部オンライン」「端末に残すものないんですけど。サーバーで同じ機能に
なるように代替して」「言語の名前もサーバーでしょ。wiki もそうなんだから」。

`docs/reports/SWEEP-0908.md` の候補を全部サーバーだけの答えにする。端末に残るの
は規則 22 の「前に読み込んだ分を眺める写し（読み専用、上がらない）」と
`lingua.sess`・索引・移行の印・`planUid` だけ。**一件一コミット**、順番はこの
通り（前の項目の形を次が使う）。

1. 言語の名前 ── `language.name` 列が唯一の答え
2. オンボーディングが済んだか（`SET.done`）── `profile` 行の有無が答え
3. 誰の言語か（`LANGS[id].uid` `.mine`）── `language.owner` が答え
4. 投稿の数と自分が押したか（`p.li` `p.bo` `p.re` `p.lime` `p.bome`）── `post_seen` の列
5. フォロー（`ME.fo` `ME.fr`）── `follow` 表と `profile_seen.fo/.fr`
6. 自己紹介（`ME.bio`）── `profile.bio` が唯一
7. 下書き（`DRAFTS`）── `draft` 表が唯一
8. 書記体系（`SET.wsys`）── `language.wsys` 列を足す（要 SQL 流し直し）
9. 設え（`SET.myfont` `SET.showScript` `SET.kbrom`、テーマ、表示言語）──
   `profile.prefs jsonb`（要 SQL 流し直し）

## 触るファイル

- `www/core.js`, `www/net.js`, `www/home.js`, `www/me.js`, `www/post.js`,
  `www/sns.js`, `www/onboard.js`, `www/boot.js`, `www/wsys.js`,
  `www/settings.js`
- `supabase/schema.sql`, `supabase/setup.md`
- `tools/*-check.mjs`, `tools/fixture.mjs`
- `docs/CHANGELOG.md`, `docs/BACKLOG.md`, `docs/DATA_MODEL.md`,
  `docs/STATE.md` の該当行, `CLAUDE.md` 規則 22 の該当文

## 触らないもの

- `www/index.html`（別セッションの物）
- 上に無いファイル全部

## 検査

`npm test` はリーダーが回す。速い検査と、直した検査だけ回す。
主張を足す先は acct / again / tl / world / store / open。バグを戻して赤を見る。
`store-check` は鍵が減る方向なので表から消す。
