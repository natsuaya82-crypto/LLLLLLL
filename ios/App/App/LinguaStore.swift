//  LinguaStore.swift
//  What the App Store hands over, and nothing about what it is worth.
//
//  THIS FILE DECIDES NOTHING SINCE 2026-09-06.
//  「だから端末でやるわけねえだろ」 OWNER 2026-09-03,
//  「アカウントごとなんだから、違うアカウントで復元できるのおかしいだろ。
//    検証して」 OWNER 2026-09-06.
//
//  It used to work out the plan here -- best(), entitledPlan(), a walk of
//  `currentEntitlements` -- and hand `www` a word. A word from a phone is a
//  word the phone chose: anybody who could send the database a request could
//  say `pro`, and schema.sql said so in its own comment. Those functions are
//  gone. What goes out of here now is **what Apple signed**, and the one place
//  that reads a signature is supabase/functions/verify-plan.
//
//  So every road out of this file answers the same shape: a list of
//  `jwsRepresentation` strings, exactly as the App Store gave them. Whether
//  a receipt is real, whose account it belongs to, which rung it buys and when
//  it runs out are four questions with one answer each, on the server.
//
//  UNVERIFIED RECEIPTS GO TOO, and that is deliberate. `VerificationResult`
//  is the device checking Apple's signature on the device, and this file used
//  to drop anything it did not like -- silently, which is how 「復元できるもの
//  はありませんって出るけど？」 OWNER 2026-09-03 happened with Apple's own
//  sheet on screen saying the subscription renews. The server checks the same
//  signature against Apple's root, so dropping them here would be the same
//  question asked twice and the weaker of the two answers winning. What the
//  device thought is still counted and sent alongside, because an error is a
//  state and a state is what a person on a phone can photograph.
//
//  Two things it deliberately does not do:
//
//    It does not sync on launch. `AppStore.sync()` makes iOS ask for a
//    password, and doing that to somebody who just opened an app they have
//    already paid for is how "Restore" became a button on every paid app
//    rather than something done automatically. `restore` is that button.
//
//    It does not tell the web view by itself. There is no @capacitor/core in
//    this app -- www/share.js says why, at length -- so there is no
//    addListener on the JavaScript side to notify. A transaction that arrives
//    with nobody in the app is KEPT (`pending` below) and goes out with the
//    next `current`, which www asks on every launch. That is the same latency
//    the Keychain gave and one mechanism fewer.
//
//    It no longer writes the Keychain. LinguaPlan.swift is still the plan the
//    app opens on with no signal, and www writes it from the server's answer
//    (`planKeep` in www/core.js). A second writer here would be a second
//    answer to 「what plan is this」, which is the whole of what this change
//    removes.

import Foundation
import Capacitor
import StoreKit

@objc(LinguaStorePlugin)
public class LinguaStorePlugin: CAPPlugin, CAPBridgedPlugin {
  public let identifier = "LinguaStorePlugin"
  public let jsName = "LinguaStore"
  public let pluginMethods: [CAPPluginMethod] = [
    CAPPluginMethod(name: "products", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "buy", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "current", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "manage", returnType: CAPPluginReturnPromise),
  ]

  /// Every product this app sells. The only place the list is written down
  /// on this side.
  ///
  /// WHICH PLAN EACH ONE BUYS IS NOT HERE ANY MORE. That is `PRODUCTS` in
  /// supabase/functions/verify-plan/verify.mjs, because deciding the plan is
  /// the server's. What is left here is what `Product.products(for:)` has to
  /// be asked for, and prices are the only thing this file still shows.
  ///
  /// A product id cannot be changed once it exists (`docs/apple.md` § 4).
  /// Asking for one that does not is not an error: StoreKit simply does not
  /// return it, which is how this file finds out what is really on sale
  /// rather than being told.
  static let ids = [
    "com.tokinets.lingua.plus.monthly",
    "com.tokinets.lingua.plus.yearly",
    "com.tokinets.lingua.pro.monthly",
    "com.tokinets.lingua.pro.yearly",
  ]

  /// The listener for transactions that arrive with nobody in the app: a
  /// renewal, a refund, a purchase made on another device, a family member's
  /// share. Apple's own guidance is to start this at launch and to keep it
  /// for the life of the process, because a transaction delivered while
  /// nothing is listening is delivered again at the next launch and the
  /// intervening days are days the app was wrong about.
  private var watch: Task<Void, Never>?

  /// What arrived while nobody was asking. There is no way to push it into
  /// the web view (see the head of this file), so it is kept and goes out with
  /// the next `current`.
  ///
  /// A REFUND IS WHY THIS EXISTS. A renewal turns up in
  /// `currentEntitlements` anyway, so keeping it changes nothing; a revoked
  /// transaction does NOT, and the server only learns a subscription was
  /// refunded if the transaction saying so reaches it. Dropping these would
  /// make a refund invisible until the paid period ran out on its own.
  private static let held = HeldTransactions()
  actor HeldTransactions {
    private var jws: [String] = []
    func add(_ s: String) { if !jws.contains(s) { jws.append(s) } }
    /// Read and kept, not read and cleared: a `current` whose answer never
    /// reaches the server -- no signal, the app closed on the way -- would
    /// otherwise have thrown the refund away. They are small, there are a
    /// handful at most in one run of the app, and the server writes the same
    /// row twice without minding.
    func all() -> [String] { return jws }
  }

  override public func load() {
    watch = Task.detached {
      for await result in Transaction.updates {
        /* finish() is what tells the App Store to stop redelivering this.
           Not finishing is the classic StoreKit bug: everything works, and
           the same transaction arrives at every launch forever. */
        if case .verified(let t) = result { await t.finish() }
        await Self.held.add(result.jwsRepresentation)
      }
    }
  }

  deinit { watch?.cancel() }

  /// Everything this Apple ID holds, as Apple signed it, plus whatever turned
  /// up while nobody was asking.
  ///
  /// `saw` / `unverified` are counted and not acted on. 「これ出るのに、復元
  /// できるものはありませんって出るけど？」 OWNER 2026-09-03: from the outside,
  /// an empty list, a list that failed verification, and a list of products
  /// this app does not sell are the same sentence, and this is the one place
  /// that can tell them apart. The answer itself no longer depends on any of
  /// it -- the server reads the same signatures -- so this is a state to
  /// photograph rather than a decision.
  static func receipts() async -> (jws: [String], saw: Int, unverified: Int) {
    var out: [String] = []
    var saw = 0, unver = 0
    for await result in Transaction.currentEntitlements {
      saw += 1
      if case .unverified = result { unver += 1 }
      out.append(result.jwsRepresentation)
    }
    for s in await held.all() where !out.contains(s) { out.append(s) }
    return (out, saw, unver)
  }

  /// What goes back to www on every road out of here.
  private func answer(_ call: CAPPluginCall, _ more: [String: Any] = [:]) async {
    let r = await Self.receipts()
    var out: [String: Any] = ["jws": r.jws, "saw": r.saw, "unverified": r.unverified]
    for (k, v) in more { out[k] = v }
    call.resolve(out)
  }

  /// What is for sale, with prices as the App Store gives them.
  ///
  /// `displayPrice` and not a number: it is already in the person's currency,
  /// already formatted the way their region formats money, and already the
  /// string Apple requires be shown. Building "$" + a number is how an app
  /// ends up showing dollars to somebody being charged yen.
  @objc func products(_ call: CAPPluginCall) {
    Task {
      do {
        let found = try await Product.products(for: Self.ids)
        let out: [[String: Any]] = found.map { p in
          var row: [String: Any] = [
            "id": p.id,
            "name": p.displayName,
            "text": p.description,
            "price": p.displayPrice,
            /* The same money as a number, and it is here for exactly one
               sum: how much less a year is than twelve months. That figure
               differs by country -- Apple rounds each storefront its own way,
               so a year that is 17% off in one is 15% off in another -- and
               working it out from `price` would be arithmetic on a formatted
               string in whatever currency. It is never shown; only a string
               the App Store formatted is ever put on a screen. */
            "amount": NSDecimalNumber(decimal: p.price).doubleValue,
            /* Twelve of this one, formatted by the App Store's own formatter.
               It is what a year is struck through with on the plans page:
               「49.99は取り消し線＋17%OFF」OWNER 2026-08-26.

               The sum is done here and not in www for the same reason
               `amount` is never shown -- www has the number but not the
               currency and not the region's way of writing money, so twelve
               times ¥750 could only be built there as "¥" and a number.
               「4はドル。でもさっき価格登録してきたけど日本円は800円とかに
               なってたよ」 Apple formats it or nobody does.

               On every product, not only the monthly one: what a term is
               worth twelve of is a fact about that term, and it is the
               monthly row www reads this off. */
            "year": (p.price * 12).formatted(p.priceFormatStyle),
          ]
          /* A subscription's period is what tells the two apart on screen,
             and it is the App Store's answer rather than ours -- a product
             renamed "yearly" that is configured monthly should read monthly. */
          if let s = p.subscription {
            row["unit"] = String(describing: s.subscriptionPeriod.unit).lowercased()
            row["count"] = s.subscriptionPeriod.value
          }
          return row
        }
        call.resolve(["products": out])
      } catch {
        call.reject("products: \(error.localizedDescription)")
      }
    }
  }

  /// Buy one, FOR THE ACCOUNT THAT IS SIGNED IN.
  ///
  /// 「アカウントごとなんだから、違うアカウントで復元できるのおかしいだろ」
  /// OWNER 2026-09-06. `appAccountToken` is the whole of the answer: Apple
  /// carries it inside the signed transaction, for the life of the
  /// subscription, on every renewal and on every restore anywhere. The server
  /// refuses a transaction whose token is not the account asking for it, so
  /// signing in as somebody else and pressing Restore gives them nothing.
  ///
  /// IT REFUSES TO BUY WITHOUT ONE. A purchase with no token is a purchase
  /// belonging to whoever verifies it first, and that is a road this file
  /// would be opening on purpose after 2026-09-06 closed it. The uid comes
  /// from www, which has it from the session; a Supabase uid is a UUID, which
  /// is exactly what this option takes, so a value that will not parse is a
  /// bug rather than a state to build for.
  ///
  /// The four outcomes are told apart rather than collapsed into
  /// success/failure, because they need four different things said to a
  /// person: it worked; you cancelled; the bank or a parent has to approve
  /// this and you will hear later; and something failed.
  ///
  /// WHAT COMES BACK IS RECEIPTS AND NOT A PLAN. The purchase's own
  /// transaction is put at the front of the list, because StoreKit does not
  /// promise that a purchase finished a millisecond ago is already in
  /// `currentEntitlements` -- and an answer that left it out is how the app
  /// once said 「無料になりました」 the instant somebody paid.
  /// 「今課金したのに（仮）フリーになりましたって出たんだけど」 OWNER
  /// 2026-09-01, on a real phone. `bought` is that transaction's own product
  /// id, so www can name what was PRESSED rather than the top rung held:
  /// 「plus で課金しても pro になりましたって出る」 OWNER 2026-09-02.
  @objc func buy(_ call: CAPPluginCall) {
    guard let id = call.getString("id"), Self.ids.contains(id) else {
      call.reject("no such product"); return
    }
    guard let uid = call.getString("uid"), let who = UUID(uuidString: uid) else {
      call.reject("not signed in"); return
    }
    Task {
      do {
        guard let product = try await Product.products(for: [id]).first else {
          call.reject("no such product"); return
        }
        let result = try await product.purchase(options: [.appAccountToken(who)])
        switch result {
        case .success(let v):
          if case .verified(let t) = v { await t.finish() }
          /* The one this press produced, ahead of the list. Unverified goes
             too -- the head of this file says why the device's opinion is not
             the one that counts. */
          var out: [String: Any] = ["how": "bought"]
          if case .verified(let t) = v { out["bought"] = t.productID }
          let r = await Self.receipts()
          var jws = [v.jwsRepresentation]
          for s in r.jws where s != v.jwsRepresentation { jws.append(s) }
          out["jws"] = jws
          out["saw"] = r.saw
          out["unverified"] = r.unverified
          call.resolve(out)
        case .userCancelled:
          await answer(call, ["how": "cancelled"])
        case .pending:
          /* Ask To Buy, or a bank that wants a second step. There is nothing
             to wait for here: it arrives at Transaction.updates whenever it
             arrives, which may be after the app has been closed -- and is
             kept there until the next `current`. */
          await answer(call, ["how": "pending"])
        @unknown default:
          await answer(call, ["how": "unknown"])
        }
      } catch {
        call.reject("buy: \(error.localizedDescription)")
      }
    }
  }

  /// AppStore.sync(), with a bound on how long it may take.
  ///
  /// It puts up Apple's own sign-in sheet, and a sheet that is dismissed
  /// rather than answered can leave the call suspended with nothing to
  /// resolve. The button then says 「問い合わせ中」and never says anything
  /// else, which is what a person sees:
  /// 「購入を復元押しても問い合わせ中しか出ないよ」OWNER 2026-09-02.
  ///
  /// The answer does not depend on it. What this Apple ID holds is
  /// `Transaction.currentEntitlements`; sync() only refreshes it, and is
  /// worth waiting a while for and not for ever.
  ///
  /// Returns whether it actually came back, because that decides something
  /// else -- see restore().
  private static func syncWithin(_ seconds: UInt64) async -> Bool {
    return await withTaskGroup(of: Bool.self, returning: Bool.self) { group in
      group.addTask {
        do { try await AppStore.sync() } catch { return false }
        return true
      }
      group.addTask {
        try? await Task.sleep(nanoseconds: seconds * 1_000_000_000)
        return false
      }
      var first = false
      if let r = await group.next() { first = r }
      group.cancelAll()
      return first
    }
  }

  /// The Restore button, and the only thing that calls AppStore.sync().
  ///
  /// It asks for an App Store password, which is why it is a button somebody
  /// presses and not something done on launch. A sync that fails is not
  /// necessarily a person with nothing: the receipts already on the device
  /// are still worth sending, so the answer is given either way.
  ///
  /// IT RESTORES ONTO THE ACCOUNT THAT IS SIGNED IN, AND ONLY THAT ONE.
  /// 「アカウントごとなんだから、違うアカウントで復元できるのおかしいだろ」
  /// OWNER 2026-09-06. Nothing here enforces it and nothing here could: what
  /// this hands over is what Apple signed, and the binding is read off the
  /// signature by supabase/functions/verify-plan. Pressing Restore while
  /// signed in as somebody else sends the same receipts and gets `free`,
  /// which is the right answer rather than a refusal to look.
  @objc func restore(_ call: CAPPluginCall) {
    Task {
      let synced = await Self.syncWithin(12)
      await answer(call, ["synced": synced])
    }
  }

  /// What the App Store holds right now, asked on every launch and after
  /// anything that might have moved. It writes nothing: the answer to what
  /// this is worth comes back from the server.
  @objc func current(_ call: CAPPluginCall) {
    Task { await answer(call) }
  }

  /// Cancelling, changing the tier, seeing the next charge -- all of it is
  /// Apple's sheet and none of it is ours to draw. An app that builds its own
  /// cancel screen is an app that will be wrong about a subscription bought
  /// on a different device.
  @objc func manage(_ call: CAPPluginCall) {
    Task { @MainActor in
      guard let scene = self.bridge?.viewController?.view?.window?.windowScene else {
        call.reject("no window"); return
      }
      do {
        try await AppStore.showManageSubscriptions(in: scene)
        /* Somebody may have cancelled in there. That arrives as a Transaction
           update, is kept, and goes out with these receipts -- and what it
           means is the server's to say. */
        await self.answer(call)
      } catch {
        call.reject("manage: \(error.localizedDescription)")
      }
    }
  }
}
