# 監査A ── `CLAUDE.md` の全文を、コードに当てる

- 日付: 2026-09-03
- ブランチ: `claude/aud-claude`
- 基準にした木: `master` の `562767d`（`Merge remote-tracking branch 'origin/claude/find'`）
- 範囲: **`CLAUDE.md` の全 1972 行。**朝の監査 (`docs/scope/audit-1..4.md`) は
  `docs/FEATURE_RULES.md` の決定ログだけを読んでいます。こちらは本体です。

## 探しているもの

CLAUDE.md 自身が二種類あると書いています（:313「"Rule" is the wrong word…」）。

1. **規則があってコードが従っていない** ── 直す
2. **事実として書いてあることが、もう本当ではない** ── 文を直す

数と名前は数え直します。CLAUDE.md 自身が三箇所で「この行を信じるな、数えろ」と
書いているので（:527「count the rules here, and count `FAST` and `SLOW`」、
:695「Count them off `CAN` and not off this line」、:724「count them off that
and not off a line here, which has said eleven and has said twelve」、
:1301「count the `say(` lines there rather than trusting this number, which has
been stale twice」）、そのとおりにします。

## 触ってよいファイル

六つのセッションが同時に走っています。`git fetch --all --prune` の後、
各枝の merge-base からの差分を採りました（`--depth=200` まで掘っています）。

| 枝 | リーダーが名指しした持ち物 | merge-base から実際に触っている物 |
|---|---|---|
| `claude/door` | `www/onboard.js`、`ios/App/App/` の Swift（`LinguaStore.swift` 以外） | `www/onboard.js` `tools/open-check.mjs` `docs/CHANGELOG.md` |
| `claude/plannow` | `www/settings.js` `www/store.js` `ios/App/App/LinguaStore.swift` | 左記＋`tools/plan-check.mjs` `www/i18n/*.js` 十本 `docs/DATA_MODEL.md` `docs/FEATURE_RULES.md` |
| `claude/keysel` | `www/keyboard.js`、`www/shell.js` の `viewReset()` の中 | まだ scope だけ |
| `claude/me3` | `www/me.js` `supabase/schema.sql` | 左記＋`tools/rls-check.mjs` |
| `claude/swipe` | `www/index.html` `www/act.js` `www/shell.js` | 取り込み済み。merge-base からの差分は空 |
| `claude/find` | `www/net.js` `www/sns.js` | 取り込み済み。merge-base からの差分は空 |

**私が触らないもの**（上の枝の持ち物。見つけても直さずに報告します）

```
www/onboard.js  www/settings.js  www/store.js  www/keyboard.js  www/shell.js
www/me.js       www/index.html   www/act.js    www/net.js       www/sns.js
www/i18n/*.js   supabase/schema.sql            ios/App/App/*.swift
tools/open-check.mjs  tools/plan-check.mjs  tools/rls-check.mjs
```

**私が直すもの**

```
CLAUDE.md（本体。古い文は消す ──「歴史とかいいから消せよ」）
www/core.js  www/home.js  www/words.js  www/post.js  www/letters.js  www/glyph.js
www/card.js  www/backup.js  www/import.js  www/share.js  www/wsys.js  www/numbers.js
www/act-map.js  www/route-map.js  www/boot.js  www/sound.js  www/rec.js  ほか
tools/*.mjs（上の三本を除く）
```

`docs/CHANGELOG.md` は書き換えません（その日に本当だったことの記録）。追記だけ。

## ゲート

**回しません。**速い九本（`npm run es5` など）だけ、直したものを持つ検査として
回します。全ゲートはリーダーが最後に一度 ── CLAUDE.md :482「A session runs
nothing」。

## 進め方

このファイルを最初のコミットで push し、以後、押すたびに push します。
下の「見つけたもの」は、確かめた順に番号で足していきます。
**確かめていないものは「確かめていない」と書きます。**

---

# 見つけたもの

（作業中。ここに番号付きで足していきます）
