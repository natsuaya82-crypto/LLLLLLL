# `claude/r11-letters` ── 無料の a〜z が消えて、文字が保存できない

- 日付: 2026-09-10
- ブランチ: `claude/r11-letters`（`origin/integ-0905` の `2afca930` から）
- オーナー 2026-09-10（ビルド 148 か 149、実機）:
  「アルファベット無料の a-z とか消えてない？なんで？あと、保存できないけど文字」

**実機で起きているデータの事故。** 無料プランの自分の言語で、文字の一覧から
a〜z が消えている。文字を保存しようとしても保存できない。ビルド 147
（master `e82c9595`）までは出ていなかった。

## この枝がやること

1. **原因を測って見つける。** 読んで名指しするのは推測（CLAUDE.md
   「A cause is FOUND, not guessed」）。147（`e82c9595`）と 148（`6d7ad665`）を
   隣に並べて同じ台本を回し、差の出る行を貼る。
2. 見つかった道を**一本のまま書き直す**（patch ではなく rewrite）。
   保存でサーバーの letters を空で上書きする道があるなら、そこが最優先。
   「空」と「知らない」を同じ枝に入れない。
3. 再現を claim にして赤を見てから緑にする。

## 触ってよいファイル

```
www/net.js          原因の道だけ
www/core.js         同上
www/letters.js      ltStart の呼び所だけ
www/boot.js         起動の道だけ
tools/again-check.mjs  tools/acct-check.mjs  tools/fixture.mjs
docs/CHANGELOG.md   docs/scope/r11-letters.md
```

**触らないもの** ── `supabase/schema.sql`（要ると分かったら止まって報告する）、
上に無いすべての `www/` と `tools/`。
