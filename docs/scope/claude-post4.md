# claude/post4 ── 引き継ぎ、残りは二つ

前のセッション（`claude/post3` から出ている）が上限に当たって止まった続き。
**コードは書きません。** RISK 5・6・9 は三つとも直ってコミット済みで、
検査（`tools/post-check.mjs`）も入っています。

## 私が触ってよいと理解したもの

```
www/net.js
www/post.js
www/rec.js
www/card.js
tools/post-check.mjs
tools/fixture.mjs
docs/RISK.md
docs/CHANGELOG.md
```

そして `shots/` に入る画像（gitignore されているので `git add -f`）と、
この scope の一枚。

## 触らないもの

- `www/index.html` `shell.js` `settings.js` `words.js` `wordsheet.js`
  `home.js` `act-map.js` `i18n/` ── **claude/pop2**
- `www/core.js` `letters.js` `backup.js` `sync.js` `phases.js` ── **claude/keep3**
- `www/sns.js` ── **claude/find3**
- `www/keyboard.js` ── **claude/kbfree3**
- `docs/FEATURE_RULES.md` `docs/STATE.md` `CLAUDE.md` ── **リーダーのもの**
- `claude/eye` と `claude/code-refactoring-review-nqwv18` は見に行きません。

`master` は取り込みました。他の枝は merge も rebase も cherry-pick もしません。

## 残っている二つ

1. **スクショ。**「写真と声が揃うまで行を出さない」は画面に出るものが
   変わっているので、両方の状態を撮る ── 写真が上がりきっていない投稿の
   あるタイムラインと、上がりきったあとの同じタイムライン。
   9番（消した投稿の写真）は画面に出るものがあれば撮り、無ければ
   「見た目は変わっていません」と一行書く。
2. **`docs/CHANGELOG.md` に足す。**保存されるものが変わっている
   （投稿に上がった所を書く欄、消せなかったパスを持ち帰る）。
   **書き換えずに足すだけ。**

`npm test` は回しません（リーダーの一回）。`npm run post` だけ。
