# claude/r7-rls ── `npm run rls` の赤三つを今の仕様へ

枝は `claude/r7-rls`、`origin/master`（`7f03753`）から。

## 何が赤か

`npm run rls`（`tools/rls-check.mjs`）が master で三本落ちる。全部
「スタッフはずっと Pro」の段の主張。

```
  FAIL  and setting it back to free is allowed
  FAIL  somebody who is not staff writes free
  FAIL  and it stays free
```

三つとも `plan` への insert / update が **通る**ことを期待している。
2026-09-07 の r4-verify で `plan` は読み取り専用になった（`plan_make` と
`plan_edit` は削除、書くのは Edge Function `verify-plan` の service role
だけ、`docs/CHANGELOG.md` 2026-09-07 と `supabase/setup.md` § 8b）。
期待が古い仕様のまま。

## 触るもの ── これだけ

```
  tools/rls-check.mjs      三つの CASE を書き換える
  supabase/schema.sql      コメントだけ（policy は既に閉じている）
  docs/CHANGELOG.md        記録
```

## 触らないもの

`supabase/functions/` と `www/` は読むだけ。他の枝を merge / rebase /
cherry-pick しない（`git merge origin/master` は別 ── 追いつきであって
取り込みではない）。

## やること

三つを今の仕様に書き換える。**policy 側は既に閉じている**ので `schema.sql`
の穴ではない ── 期待と実際が逆になっているだけ。`setup.md` に流し直しの行は
要らない。

`schema.sql` のコメント二か所が古い仕様を言っているので同じコミットで直す
（「Writing is the owner's」「a phone with the app closed can PATCH
/rest/v1/plan through plan_edit」）。CLAUDE.md ── 決定が規則を置き換えたら
同じコミットで規則を直す。

`npm run rls` 緑、バグを戻して赤を一度見る。CASES の数が動くなら報告に書く。
