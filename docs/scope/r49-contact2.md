# r49-contact2 ── お問い合わせ：送信は右上、本文は画面全部、送ったら「送信しました」

## Scope

- **Goal**: オーナーの決定（2026-09-22）「本文が増えたらこれ見えなくなるやろ
  送信右上にして本文は画面全部に広がるようにして。送信したら送信しました。って
  出るようにして。」 ── 三つだけ。それ以外は触らない。
- **Owns (may change)**: `www/settings.js`（`vContact` とその周り）、
  `www/index.html`（この画面の CSS だけ。**生きている枝で index.html を先へ
  進めている物は無い** ── `git rev-list --count origin/integ-0905..<枝>
  -- www/index.html` が r45〜r48 とも 0）、`tools/acct-check.mjs`（claim 81）、
  `tools/fixture.mjs`（要るなら顔を足す）、`docs/CHECK-0907.md` § 163、
  `docs/CHANGELOG.md`、`docs/scope/r49-contact2.md`、`shots/r49-*.png`
- **Does NOT own**: それ以外すべて。`docs/STATE.md` はリーダーの物。
  `supabase/schema.sql` は触らない（貯まる物は変わらない）。
- **Decision it implements**: OWNER 2026-09-22（上）
- **Check to run**: `act`・`box`・`i18n`・`es5`・`dead`・`acct`・`press`。
  **ゲート（`npm test`）は回さない** ── リーダーの物（`docs/SESSIONS.md` §7）。

## 三つ

1. **送信はバーの右上へ。** 今は本文の下の `.btn.ghost`（`www/settings.js`）。
   消して、投稿画面と同じ形にする ── `navTop(count, right)` の `right` に
   `navDo(label, 'contactGo', null, on)`。`on` は「本文が空白でない、かつ
   送信中でない」。送信中の字は今までどおり `ob.mail.wait`。行き先は
   `contactGo` のまま（`act-map.js` は触らない）。
2. **本文は画面の残り全部。** 今は `.field` の中の一行から伸びる `lnField`。
   `.body.tall`（既にある）＋ `fitin`（`lnFit()` が高さを触らない印、既にある）
   で、欄が残りを取って**中でスクロール**する形にする。角丸・枠・パネルは
   足さない。
3. **送ったら「送信しました」。** `contactGo` は既に `back(); toast(...)` と
   書いてある ── **書いてあることと出ることは別なので測る。** `acct-check`
   claim 81：本物のボタンを押して、成功の返事を返して、画面に `contact.sent`
   の字が出ていること・立っている画面が設定であること・`CONT.body` が空である
   こと。バグ（toast を外す）を入れて赤を見てから直す。

## 貯まる物

**変わらない。** `feedback` 表も `localStorage` も一バイトも動かない。
画面の形だけ。

## リーダーの指示と違えた所 ── 一つ

写真の置き場。指示は `docs/scope/shots/r49-*.png` でしたが、**この repo の
写真の門は `shots/` しか数えません** ── `tools/commit-msg` の
`grep -iE '^shots/.*\.png$'` がそれで、`docs/scope/shots/` に置くと「画面を
変えたのに写真が無い」で commit が止まります。今までの scope の写真も全部
`shots/` に居ます（`git ls-files shots/`）。なので `shots/r49-1..3-*.png` に
置き、`git add -f` で入れました（`shots/` は .gitignore）。
