# claude/plannow ── 買うボタンが消えたところに、今のプランと期限を出す

```
消すなら同じ場所に現在このプランです〇〇/〇〇までみたいな感じにしないと
わからんやろ
```
OWNER 2026-09-03（決定ログ `c0f3380`）

契約中の段を選んでいる間、購入のボタンは出ません（同じ日の
「そもそもプロなら課金自体ボタン押させないでいいでしょ」）。**消えるだけで
何も出ないので、押すものが無い理由が画面から読めません。**オーナーが実機で
「購入するボタンなんでなくなってんの？」と言いました。

## いま起きていること

`www/settings.js` の `vPlans()`:

```js
(plHave()? '' :
  '<button class="btn plbuy'+(PLPICK? ' on' : '')+'"' + DO('plBuy') + ...)
```

`plHave()` が真のとき、`.plgo` の中は空になります。

そして**期限はこの端末のどこにも無い**。`ios/App/App/LinguaStore.swift` の
`current` は `["plan": await writeDown()]` しか返していません。

## 作るもの

**ボタンが在った場所に一行。今そのプランであることと、いつまでかを出す。**

### 期限は StoreKit から

`Transaction.expirationDate` から。三つの規則:

- **`writeDown()` の振る舞いは変えません。**あれは「絶対に下げない」道で、
  `plan-check` が何本も主張を持っています。**返す値を増やすだけ**で、
  書き込む値には触りません
- **今効いている段の期限。**`writeDown()` が答えた段のものです。Plus と Pro を
  両方持っている状態はあり得るので、取り違えると切れた方の日付が出ます。
  `writeDown()` が Keychain の段（`held`）を答えたときは、その段の権利がこの
  端末の一覧に無いということなので、**日付は出しません**
- **`verified()` を通った取引だけ。**`entitledSeen()` が既にその区別を持って
  いるので、そこに足します。解約済みでも `expirationDate` は在り、それが
  「いつまで使えるか」です ── 別の仕掛けは作りません

### 画面の側

- **日付は `t()` を通します。**年月日の並びは言語で違うので、`plan.date` を
  十言語ぶん。`toLocaleDateString` は使いません ── `i18n-check` は実在しない
  疑似言語で画面を描くので、その言語タグを渡すと `RangeError` になります
- **段の名前を書きます。**`plHave()` は「今の段**か、それより下**」で真になる
  ので、Pro の人が Plus を選んでいる間も一行は出ます。「現在このプランです」
  だけだと、そこで嘘になります
- **角丸・枠・パネルは足しません。**`.plgo` の中の `.note` ── `storeSay()` が
  既に使っている、同じ親の同じクラスです
- **説明文にしません。**段の名前と期限、それだけ。これが許されるのは
  2026-08-22 の narrowing（アプリが何かを取り去った状態に、原因と出口が無い
  ときの最低限）に当たるからです
- **答えが来ていないときは日付を書きません。**`storeHeld()` が「Apple に訊いて
  答えが返ったか」を既に持っています。**「期限が分からない」と「期限が無い」は
  別の状態**なので、同じ枝に置きません

## 保存するもの ── 増えません

期限は `localStorage` に入れません。**このセッションの間だけ持つ**変数で、
`current` の答えが来たときに、**答えた段と一緒に**置きます。二つの理由:

- 期限は Apple ID のもので、アカウントのものではありません。`SET` に入れると
  「アカウントを変えても端末の段が残る」（`docs/STATE.md`）と同じ穴が
  もう一つ増えます
- 段が変わって期限だけ古いまま残るのが、一番読めない嘘になります。段と一緒に
  持てば、合わないときは黙る

## 私のファイル

```
www/settings.js   www/store.js   ios/App/App/LinguaStore.swift
www/i18n/{en,es,pt,fr,de,it,ru,zh,ko,ja}.js
tools/plan-check.mjs
docs/CHANGELOG.md   docs/DATA_MODEL.md   docs/FEATURE_RULES.md
docs/scope/claude-plannow.md
```

`ios/App/App/` の他の Swift は `claude/door` のものです。`www/index.html` には
触りません（新しいクラスを作らないので、要りません）。

## 知っていること

**`claude/rc` が同じ `LinguaStore.swift` を RevenueCat へ書き換えています**
（`a049bc0a`）。あちらは公開キー待ちで止まっているので master が先に進みます。
**あちらが取り込みます。私は `claude/rc` を取り込みません。**

## 言えないこと

Swift はこの環境でコンパイルできません。**`current` が期限を返すことは
CODE CONFIRMED まで**です。実機は DEVICE CONFIRMED で、それは別の文です。
