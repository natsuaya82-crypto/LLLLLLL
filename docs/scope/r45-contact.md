# r45-contact ── 設定に「お問い合わせ」、admin で読む

## Scope

- **Goal**: オーナーの決定（2026-09-22）「設定にお問合せを足して欲しい。フォーム
  みたいなの作ってみんなからの意見要望バグとかあればそれを見たい。フォームは
  アプリ内のadminのページで見れるようにしたい。」
- **Owns (may change)**: `supabase/schema.sql`、`tools/rls-check.mjs`、`www/net.js`、
  `www/settings.js`、`www/mod.js`、`www/shell.js`、`www/route-map.js`、
  `www/act-map.js`、`www/i18n/*.js`、`www/index.html`（この画面の CSS だけ ──
  **この session が一人で持つ**、リーダーが与えた）、`tools/fixture.mjs`、
  `tools/acct-check.mjs`、`docs/CHANGELOG.md`、`docs/DATA_MODEL.md`、
  `docs/FEATURES.md`、`docs/CHECK-0907.md`、`docs/scope/r45-contact.md`、`shots/r45-*`
- **Does NOT own**: それ以外すべて。`docs/STATE.md` はリーダーの物、触らない。
- **Decision it implements**: OWNER 2026-09-22（上）
- **Check to run**: `npm run act`・`press`・`i18n`・`es5`・`dead`・`box`・`acct`・`rls`。
  **ゲート（`npm test`）は回さない** ── リーダーの物（`docs/SESSIONS.md` §7）。

## 形

リーダーが読んで決めた所。オーナーの言葉と食い違えばオーナーが勝つ。

- **サーバーに表 `feedback`**（`report` の隣）。`author` は `on delete set null`
  ── `report` と同じ理由で、送った人が退会しても運営への言葉は残る。
  `kind` は `('opinion','request','bug')` の閉じた集合、`body` は 1〜2000 字。
  **RLS**：insert は `is_member() and author = auth.uid()`、select は `is_staff()`。
  **update / delete の policy は作らない** ── 消す道は頼まれていない。
- `www/net.js`：`netFeedbackSend(kind, body, ok, bad)`、`netFeedbacks(ok, bad)`。
- **画面**：設定の一覧に行「お問い合わせ」→ route `contact` へ**遷移**
  （下から出すシートは禁止）。種類を選ぶ**行が三つ**（丸いチップの横並びは禁止）、
  書く欄、送るボタン。**説明文は書かない**。
- **admin**：`vAdmin()` の通報の下に節。新しい順、種類・@handle・日付・本文。
  消すボタンは無し。`admin` は staff の壁の内側。
- 角丸・枠線・塗りは足さない（下線だけ）。ES5。`onclick` 無し。

## 十一の問い（`docs/FEATURE_RULES.md`）

1. **何のため** ── 使っている人から運営へ、意見・要望・バグを送る道。今は無い。
2. **できるようになること** ── 送る側：設定から三種類のどれかを選んで書いて送る。
   運営側：admin で新しい順に読む。
3. **無料か有料か** ── **無料**。`can()` は一つも足さない。段は一切見ない
   （`docs/PAID_FEATURES.md`：金は「できること」を決め、存在する物を決めない）。
4. **今の振る舞いで変わる所** ── 設定の一覧に行が一つ増える。admin の画面に節が
   一つ増える。それ以外は無し。
5. **今ある data への影響** ── **無し**。既存の表も列も一行も触らない。
6. **新しく貯まる物** ── サーバーの表 `feedback` だけ。**端末には一つも貯めない**
   ── `localStorage` の鍵は増えない（`store-check` が数える物は動かない）。
   slice でも `SET` でも無い。
7. **消す物** ── **無し**。DELETE REVIEW は要らない。update / delete の policy を
   作らないので、送られた物を消す道はアプリにもサーバーの API にも無い。
8. **前からある data** ── 無い（新しい表）。前の版のアプリを持っている人には
   この画面が無いだけで、開いても何も壊れない。
9. **電波が無いとき** ── 送れない。`netWhy` の文を `toast` で出して画面はそのまま
   ── 打った物は消えない（`CLAUDE.md` 規則 11「失敗して残る」）。
10. **失敗したとき** ── 9 と同じ。空で押した時は `toast(t('contact.need'))`。
11. **段が変わったとき** ── 何も変わらない。段を一度も見ない。

## リーダーへ / オーナーへ

（作業中に出たら書く）

## 報告

（終わったら書く）
