# Scope — claude/flat

**平キーの道を消す。アプリは今の形だけを知っている**
（OWNER 2026-09-03、`docs/FEATURE_RULES.md` の決定項、master `bc1a394`）

```
もうデータ無くしていいまっさらな状態で完成させるから
もうまっさら昔のいらない。今の状態の話平キーなんかいらない
今の情報のコードに書き換えて
```

言語が一つしか持てなかった頃の八つの鍵 ── `lingua.words` `lingua.lines`
`lingua.lang` `lingua.script` `lingua.letters` `lingua.notes` `lingua.phases`
`lingua.talk` ── を**アプリはもう読まない**。そこから写す道ごと消す。

- **Owns (may change):** `www/core.js` `www/net.js` `tools/migrate-check.mjs`
  ＋ `docs/scope/claude-flat.md`（これ）
  ＋ `docs/CHANGELOG.md`（保存されるものの扱いが変わるので、リーダーが明示的に渡した）
- **Does NOT own:** それ以外すべて。**他の docs は四つの監査が持っている**
  ── `docs/DATA_MODEL.md` `DATA_SAFETY.md` `ARCHITECTURE.md`（`claude/aud-data`）、
  `CLAUDE.md`（`claude/aud-claude`）、`PAID_FEATURES.md` `FEATURES.md` `apple.md`
  （`claude/aud-pay`）、`STATE.md` `TESTING.md` と keyboard の二冊（`claude/aud-state`）。
  **文書は直さない。何をどう変えたかを報告に書き、リーダーが監査に渡す。**
- **Check to run:** `migrate` `dead` `store` `es5` ── 速いものだけ。
  **ゲートは回さない**（`docs/SESSIONS.md`、リーダーが最後に一度）。

---

## 消すもの

1. **`langMigrate()`**（`www/core.js`）── 平キーを読んで今の形へ写す関数。丸ごと
2. **`LS_FLAT`**（`www/core.js`）── 八つの鍵の表
3. **`langMigStamp()`（`www/core.js`）と `mig` の印**、および
   **`www/net.js` の `netRead()` からの呼び出し**。写した言語にアカウントを
   押すためだけに在るもの ── **呼び出し側も消す**
4. **`lsWipeAcct()` の平キー削除**（`www/core.js`）── 消すものが無くなるので不要
5. **`www/core.js` の頭の呼び出し**:
   `if(!langId || !LANGS[langId]){ if(!langMigrate()) langFirst(); }`
   → `langFirst()` だけになる
6. **`tools/migrate-check.mjs` の平キーについての主張**（下記）

**条件を足して塞ぐのは禁止。**「`langMigrate()` が常に false を返す」「平キーを
読むが無視する」── どちらも禁止。**そのコードを消す。**
「直すじゃなくてシンプル実装→修正じゃなくてコードそのものの書き換え」OWNER 2026-09-03。

## 消さないもの

**`migratePh()` `migrateMn()` `migratePos()` `migrateLetters()` `migrateMarks()`
`migrateSndName()` `migrateSnd()` `migratePosts()` `migratePostInk()` `migrateSp()`
`migrateWorld()` `migrateKbFree()` は別物。触らない。**あれらは「今の形の中で、
フィールドの形が変わったもの」を直すもので、平キーとは関係ない。`www/boot.js` が
並べて呼んでいる。

**`tools/migrate-check.mjs` 全体は消さない。平キーについての主張だけ外す。**

## これは削除の決定であって、データの削除ではない

`docs/DATA_SAFETY.md` は「移行は写して、読んだものを消さない」と書いているが、
**これはその例外ではない。**移行そのものを無くすので、写す元も写す先も無い。

**平キーを持つ端末では、その八つの鍵は `localStorage` に残ったままになる。
誰にも読まれなくなるだけで、アプリが消すのではない。**
`localStorage.removeItem` をこの八つに対して書かない ── オーナーが言ったのは
「要らない」であって「消せ」ではない。

## 検査

`tools/migrate-check.mjs` の八つの節のうち、**平キーを種にしているのは四つ**
（1・2・3 と 8）。残りは平キーと関係がなく、全部緑のまま残る:

| 節 | 何を持っているか | どうなるか |
|---|---|---|
| 1・2 | 平キーの入った端末が全部持って開く／古い鍵は残る | **外す** |
| 3 | 同じ端末をもう一度開く（二重移行しない） | **外す** |
| 8 | 写した言語に `mig` 経由でアカウントが付く | **外す** |
| 4 | まっさらな端末は自分の言語を一つ持って始まる | 残す |
| 5 | 二つの言語と、その間の扉 | 残す |
| 6 | 買った plan が設定ファイルを出て Keychain へ | 残す |
| 7 | アプリは自分で勝手にサインインしない | 残す |
| — | 無料言語に配られる二十八の枠 | 残す |

**足す主張（新しい）:** 平キーが `localStorage` に在る状態でアプリを立てて、
**何も起きないこと** ── 読まれない・写されない・消されない。
`LANGS` が増えないこと、八つの鍵がそのまま在ることを見る。

**赤を見てから信じる。**

## 芋づるで出てくるもの

- `dead-check` を消したあとに回して、出てくるものを最後まで消す
  （CLAUDE.md ──「Deleting one often turns up another on the next run」）
- **`LS_SESS` を知っているのは `www/net.js` 一箇所**という設計 ──
  `langMigStamp` の呼び出しを消してその形が変わらないか確かめる
- **`store-check` の表に、読まれなくなった鍵が残らないか**

### 見つけた一件 ── `tools/store-check.mjs`（**持っていないファイル**）

`tools/store-check.mjs` の `ROADS` に `'core.js:langKey(k)': { to: 'netSlicePut' }`
が在る。**この式を書いているのは `www/core.js` の `langMigrate()` ただ一箇所**
（`core.js` の他の `setItem` は `langKey('words')` など literal で、別の行）。
`langMigrate()` を消すと、この行は**何も書かなくなった鍵の道**になり、
store-check 自身がそれを赤にする:

> `ROADS names ... and nothing writes it any more — delete the line.`

これは指示された削除の直接の帰結で、リーダーが「読まなくなった鍵がその表に
残っていないか」と名指しした場所そのもの。**この一行だけを消す。**
`tools/store-check.mjs` は他のどのセッションも持っていない（`claude/swipe` が
持つのは `tools/press.mjs`）。**持っていないファイルに触るので、報告に明記する。**

## リーダーへ ── 指示と repo が食い違っている一点

指示は「`tools/migrate-check.mjs` 全体を消さないでください。**上の十二個を
持っている主張が入っています**」と書いているが、**実際には入っていない**。
`migratePh` 〜 `migrateKbFree` の十二個を名指ししている `tools/` のファイルは
`tools/fixture.mjs`（`migratePostInk()` を一度呼ぶだけ）で、
`tools/migrate-check.mjs` は十二個のどれも名指ししていない。

migrate-check が実際に持っているのは上の表の四節 ── まっさらな端末、言語の
切り替え、plan の移動、勝手にサインインしないこと、と無料の二十八枠。
**それらが緑のまま残る、という結論は変わらない**ので作業は止めない。
十二個を持つ検査が別に要るかは**リーダーとオーナーのもの**で、ここでは決めない。
