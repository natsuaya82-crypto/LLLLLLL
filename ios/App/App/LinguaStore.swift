//  LinguaStore.swift
//  What the App Store hands over, and nothing about what it is worth --
//  bought through RevenueCat.
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
//  THE BUYING IS REVENUECAT'S, since 2026-09-25. Shipaton 2026
//  (docs/FEATURE_RULES.md 2026-08-25) asks that the RevenueCat SDK power the
//  purchase, not watch it, and 「お願い」 OWNER 2026-09-25. So buying,
//  restoring and hearing about a transaction that arrives later all go through
//  `Purchases`, and the StoreKit calls that did the same -- product.purchase,
//  AppStore.sync(), the Transaction.updates listener and finish() -- are gone
//  rather than kept beside it: two listeners on one queue is two things
//  finishing the same transaction (CLAUDE.md § Simple).
//
//  THE RECEIPTS ARE STILL READ FROM STOREKIT, and that is not the second road
//  it looks like. What the server needs is what Apple SIGNED, and RevenueCat
//  does not hand that out: `StoreTransaction.jwsRepresentation` is `internal`
//  in purchases-ios 5.91.0. `receipts()` below reads, and only reads --
//  nothing in this file buys, restores or finishes through StoreKit.
//
//  WHOSE PURCHASE IT IS DID NOT MOVE. RevenueCat puts the app user id on a
//  StoreKit 2 purchase as `appAccountToken` when it is a UUID
//  (PurchasesOrchestrator.swift in 5.91.0), and a Supabase uid is one. So a
//  buy logs RevenueCat in as the signed-in account first and refuses unless
//  that took -- the token is then the uid, exactly as it was when this file
//  passed it by hand.
//
//  Two things it deliberately does not do:
//
//    It does not sync on launch. A restore makes iOS ask for a password, and
//    doing that to somebody who just opened an app they have already paid
//    for is how "Restore" became a button on every paid app rather than
//    something done automatically. `restore` is that button.
//
//    It does not decide what a transaction that arrives on its own means.
//    RevenueCat hears it (it listens where Transaction.updates is) and tells
//    this file through its delegate; the page is TOLD -- a window event,
//    `linguastore`, because there is no @capacitor/core in this app
//    (www/share.js says why) and so no addListener to notify. www/store.js
//    answers the event with the same `current` a launch asks.
//    「子どもの購入を親が承認した時 →『すぐ』」 OWNER 2026-09-24: an Ask To
//    Buy approval is the plan while the app is open, not at the next launch.
//
//    It writes nothing down. The plan is verify-plan's answer, held in memory
//    by www/core.js § PLAN and nowhere on this phone; a writer here would be
//    a second answer to 「what plan is this」.

import Foundation
import Capacitor
import RevenueCat
import StoreKit
import WebKit

/* `StoreKit.Transaction` is spelled out below and not `Transaction`:
   RevenueCat exports a type of that name too (an obsoleted one), and the two
   imports together make the bare name ambiguous. */

@objc(LinguaStorePlugin)
public class LinguaStorePlugin: CAPPlugin, CAPBridgedPlugin, PurchasesDelegate {
  public let identifier = "LinguaStorePlugin"
  public let jsName = "LinguaStore"
  public let pluginMethods: [CAPPluginMethod] = [
    CAPPluginMethod(name: "products", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "buy", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "current", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "manage", returnType: CAPPluginReturnPromise),
  ]

  /// RevenueCat's PUBLIC SDK key for this app -- the one that begins `appl_`,
  /// from the RevenueCat dashboard, Project settings → API keys. The one line
  /// to fill in, and the only place it is written.
  ///
  /// In the source, and that is deliberate: it is public the way `SB_KEY` in
  /// www/net.js is public -- every copy of the app carries it and it proves
  /// nothing. The SECRET key (`sk_`) is a server's and is not in this
  /// repository at all.
  ///
  /// EMPTY IS A REAL ANSWER: nobody has made the RevenueCat app yet. `ready`
  /// is what it turns off -- prices, buying and restoring then fail the way a
  /// store that cannot be reached fails, and `current` still answers.
  static let apiKey = ""

  /// Whether there is a RevenueCat to ask. `Purchases.shared` TRAPS when
  /// `configure` was never called, so every road that uses it asks this first.
  static var ready: Bool { !apiKey.isEmpty && Purchases.isConfigured }

  /// Every product this app sells. The only place the list is written down
  /// on this side.
  ///
  /// WHICH PLAN EACH ONE BUYS IS NOT HERE. That is `PRODUCTS` in
  /// supabase/functions/verify-plan/verify.mjs, because deciding the plan is
  /// the server's. What is left here is what RevenueCat has to be asked for,
  /// by id rather than through an Offering: an Offering is an arrangement in
  /// a dashboard, and a product that fell out of one would go quiet here with
  /// nothing in this repository able to say why.
  ///
  /// A product id cannot be changed once it exists (`docs/apple.md` § 4).
  /// Asking for one that does not is not an error: nothing is returned for
  /// it, which is how this file finds out what is really on sale.
  static let ids = [
    "com.tokinets.lingua.plus.monthly",
    "com.tokinets.lingua.plus.yearly",
    "com.tokinets.lingua.pro.monthly",
    "com.tokinets.lingua.pro.yearly",
  ]

  /// Configure RevenueCat and listen to it.
  ///
  /// Here and not in AppDelegate: this plugin is the one thing in the app
  /// that talks to the store, and a `configure` in another file is one that
  /// gets moved by somebody who does not know this file depends on it.
  /// Configured anonymous -- the account is not known until www says who is
  /// signed in, and `signedAs` logs in at the press that needs it.
  ///
  /// StoreKit 2 SAID, not left to the default. RevenueCat puts the app user
  /// id on as `appAccountToken` on its StoreKit 2 road only, so the binding
  /// of a purchase to its account depends on this line and not on what a
  /// later version of the SDK happens to default to.
  override public func load() {
    guard !Self.apiKey.isEmpty else { return }
    Purchases.configure(with: Configuration.Builder(withAPIKey: Self.apiKey)
      .with(storeKitVersion: .storeKit2)
      .build())
    Purchases.shared.delegate = self
  }

  /// RevenueCat saying something changed: a renewal, a refund, a purchase
  /// made on another device, a parent's approval. It says nothing here about
  /// what that MEANS -- the page is told, asks `current`, and the server
  /// answers from what Apple signed. A page that is not loaded yet misses the
  /// event and loses nothing: the launch asks `current` anyway.
  public func purchases(_ purchases: Purchases, receivedUpdated customerInfo: CustomerInfo) {
    Task { @MainActor in
      self.bridge?.webView?.evaluateJavaScript(
        "window.dispatchEvent(new Event('linguastore'))", completionHandler: nil)
    }
  }

  /// RevenueCat is logged in as this account, or is made to be.
  ///
  /// It is what puts the uid on a purchase as `appAccountToken` (the head of
  /// this file), so a buy on the account signed in before this one would be
  /// a purchase bound to THAT account. The answer is read back off
  /// `appUserID` rather than trusted from the call: a log-in that did not
  /// reach RevenueCat leaves the old id standing.
  static func signedAs(_ uid: String) async -> Bool {
    let me = uid.lowercased()
    if Purchases.shared.appUserID.lowercased() == me { return true }
    _ = try? await Purchases.shared.logIn(me)
    return Purchases.shared.appUserID.lowercased() == me
  }

  /// Everything this Apple ID holds for this app, as Apple signed it.
  ///
  /// Two reads, and both only read. `currentEntitlements` is what is live.
  /// `latest(for:)`, once per product, is what a REFUND needs: a revoked
  /// transaction is not in `currentEntitlements`, and the server only learns a
  /// subscription was refunded if the transaction saying so reaches it. It
  /// used to be kept off Transaction.updates while the app was open;
  /// RevenueCat has that queue now, and `latest(for:)` carries the revocation
  /// on every launch after it rather than only in the run it arrived in.
  ///
  /// `saw` / `unverified` are counted and not acted on. 「これ出るのに、復元
  /// できるものはありませんって出るけど？」 OWNER 2026-09-03: an empty list, a
  /// list that failed verification, and a list of products this app does not
  /// sell are the same sentence from outside, and this is the one place that
  /// can tell them apart. The server reads the same signatures, so this is a
  /// state to photograph rather than a decision.
  static func receipts() async -> (jws: [String], saw: Int, unverified: Int) {
    var out: [String] = []
    var saw = 0, unver = 0
    for await result in StoreKit.Transaction.currentEntitlements {
      saw += 1
      if case .unverified = result { unver += 1 }
      out.append(result.jwsRepresentation)
    }
    for id in ids {
      if let r = await StoreKit.Transaction.latest(for: id), !out.contains(r.jwsRepresentation) {
        out.append(r.jwsRepresentation)
      }
    }
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
  /// `localizedPriceString` and not a number: it is already in the person's
  /// currency, already formatted the way their region formats money, and
  /// already the string Apple requires be shown. Building "$" + a number is
  /// how an app ends up showing dollars to somebody being charged yen.
  @objc func products(_ call: CAPPluginCall) {
    guard Self.ready else { call.reject("no store"); return }
    Task {
      let found = await Purchases.shared.products(Self.ids)
      let out: [[String: Any]] = found.map { p in
        var row: [String: Any] = [
          "id": p.productIdentifier,
          "name": p.localizedTitle,
          "text": p.localizedDescription,
          "price": p.localizedPriceString,
          /* The same money as a number, and it is here for exactly one
             sum: how much less a year is than twelve months. That figure
             differs by country -- Apple rounds each storefront its own way,
             so a year that is 17% off in one is 15% off in another -- and
             working it out from `price` would be arithmetic on a formatted
             string in whatever currency. It is never shown; only a string
             the App Store formatted is ever put on a screen. */
          "amount": NSDecimalNumber(decimal: p.price).doubleValue,
        ]
        /* Twelve of this one, formatted by the store's own formatter. It is
           what a year is struck through with on the plans page:
           「49.99は取り消し線＋17%OFF」OWNER 2026-08-26.

           The sum is done here and not in www for the same reason `amount`
           is never shown -- www has the number but not the currency and not
           the region's way of writing money, so twelve times ¥750 could only
           be built there as "¥" and a number. 「4はドル。でもさっき価格登録
           してきたけど日本円は800円とかになってたよ」 Apple formats it or
           nobody does: with no formatter nothing is put in `year`, and www
           shows no struck-through price at all. */
        if let f = p.priceFormatter,
           let y = f.string(from: NSDecimalNumber(decimal: p.price * 12)) {
          row["year"] = y
        }
        /* A subscription's period is what tells the two apart on screen,
           and it is the App Store's answer rather than ours -- a product
           renamed "yearly" that is configured monthly should read monthly.
           Spelled out, because RevenueCat's unit is an @objc enum and
           String(describing:) of one is not the case's name. */
        if let s = p.subscriptionPeriod {
          switch s.unit {
          case .day: row["unit"] = "day"
          case .week: row["unit"] = "week"
          case .month: row["unit"] = "month"
          case .year: row["unit"] = "year"
          @unknown default: break
          }
          row["count"] = s.value
        }
        return row
      }
      call.resolve(["products": out])
    }
  }

  /// Buy one, FOR THE ACCOUNT THAT IS SIGNED IN.
  ///
  /// 「アカウントごとなんだから、違うアカウントで復元できるのおかしいだろ」
  /// OWNER 2026-09-06. `appAccountToken` is the whole of the answer: Apple
  /// carries it inside the signed transaction, for the life of the
  /// subscription, on every renewal and on every restore anywhere. The server
  /// refuses a transaction whose token is not the account asking for it.
  /// RevenueCat puts it on from the app user id, so `signedAs` comes first.
  ///
  /// IT REFUSES TO BUY WITHOUT ONE. A purchase with no token is a purchase
  /// belonging to whoever verifies it first. The uid comes from www, which
  /// has it from the session; a Supabase uid is a UUID, so a value that will
  /// not parse is a bug rather than a state to build for.
  ///
  /// The four outcomes are told apart rather than collapsed into
  /// success/failure, because they need four different things said to a
  /// person: it worked; you cancelled; the bank or a parent has to approve
  /// this and you will hear later; and something failed. RevenueCat throws
  /// for the middle two, so they are read off its error code.
  ///
  /// WHAT COMES BACK IS RECEIPTS AND NOT A PLAN. The purchase's own
  /// transaction is put at the front of the list -- `latest(for:)` on the id
  /// just bought, because nothing promises that a purchase finished a
  /// millisecond ago is already in `currentEntitlements`, and an answer that
  /// left it out is how the app once said 「無料になりました」 the instant
  /// somebody paid. 「今課金したのに（仮）フリーになりましたって出たんだけど」
  /// OWNER 2026-09-01, on a real phone. `bought` is that transaction's own
  /// product id, so www can name what was PRESSED rather than the top rung
  /// held: 「plus で課金しても pro になりましたって出る」 OWNER 2026-09-02.
  @objc func buy(_ call: CAPPluginCall) {
    guard let id = call.getString("id"), Self.ids.contains(id) else {
      call.reject("no such product"); return
    }
    guard let uid = call.getString("uid"), UUID(uuidString: uid) != nil else {
      call.reject("not signed in"); return
    }
    guard Self.ready else { call.reject("no store"); return }
    Task {
      guard await Self.signedAs(uid) else {
        call.reject("not signed in to the store"); return
      }
      guard let product = await Purchases.shared.products([id]).first else {
        call.reject("no such product"); return
      }
      do {
        let result = try await Purchases.shared.purchase(product: product)
        if result.userCancelled { await answer(call, ["how": "cancelled"]); return }
        var out: [String: Any] = ["how": "bought"]
        let pid = result.transaction?.productIdentifier ?? id
        out["bought"] = pid
        let r = await Self.receipts()
        var jws: [String] = []
        if let v = await StoreKit.Transaction.latest(for: pid) { jws.append(v.jwsRepresentation) }
        for s in r.jws where !jws.contains(s) { jws.append(s) }
        out["jws"] = jws
        out["saw"] = r.saw
        out["unverified"] = r.unverified
        call.resolve(out)
      } catch {
        switch error as? RevenueCat.ErrorCode {
        case .some(.purchaseCancelledError):
          await answer(call, ["how": "cancelled"])
        case .some(.paymentPendingError):
          /* Ask To Buy, or a bank that wants a second step. There is nothing
             to wait for here: RevenueCat hears it whenever it arrives, which
             may be after the app has been closed, and the delegate above
             tells the page. */
          await answer(call, ["how": "pending"])
        default:
          call.reject("buy: \(error.localizedDescription)")
        }
      }
    }
  }

  /// RevenueCat's restore, with a bound on how long it may take.
  ///
  /// It puts up Apple's own sign-in sheet, and a sheet that is dismissed
  /// rather than answered can leave the call suspended with nothing to
  /// resolve. The button then says 「問い合わせ中」and never says anything
  /// else, which is what a person sees:
  /// 「購入を復元押しても問い合わせ中しか出ないよ」OWNER 2026-09-02.
  ///
  /// The answer does not depend on it. What this Apple ID holds is read by
  /// `receipts()`; the restore only refreshes it, and is worth waiting a
  /// while for and not for ever. Returns whether it actually came back.
  private static func restoreWithin(_ seconds: UInt64) async -> Bool {
    return await withTaskGroup(of: Bool.self, returning: Bool.self) { group in
      group.addTask {
        do { _ = try await Purchases.shared.restorePurchases() } catch { return false }
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

  /// The Restore button, and the only thing that restores.
  ///
  /// It asks for an App Store password, which is why it is a button somebody
  /// presses and not something done on launch. A restore that fails is not
  /// necessarily a person with nothing: the receipts already on the device
  /// are still worth sending, so the answer is given either way.
  ///
  /// IT RESTORES ONTO THE ACCOUNT THAT IS SIGNED IN, AND ONLY THAT ONE.
  /// 「アカウントごとなんだから、違うアカウントで復元できるのおかしいだろ」
  /// OWNER 2026-09-06. Nothing here enforces it and nothing here could: what
  /// this hands over is what Apple signed, and the binding is read off the
  /// signature by supabase/functions/verify-plan. The uid is here for
  /// RevenueCat -- so what it shows in its dashboard is under the account
  /// that pressed -- and not for the answer.
  @objc func restore(_ call: CAPPluginCall) {
    guard let uid = call.getString("uid"), UUID(uuidString: uid) != nil else {
      call.reject("not signed in"); return
    }
    guard Self.ready else { call.reject("no store"); return }
    Task {
      guard await Self.signedAs(uid) else {
        call.reject("not signed in to the store"); return
      }
      let synced = await Self.restoreWithin(12)
      await answer(call, ["synced": synced])
    }
  }

  /// What the App Store holds right now, asked on every launch and after
  /// anything that might have moved. It writes nothing and needs no
  /// RevenueCat: the receipts are read off StoreKit, and the answer to what
  /// they are worth comes back from the server. So a build with no key still
  /// answers it, and somebody already paying keeps what they pay for.
  @objc func current(_ call: CAPPluginCall) {
    Task { await answer(call) }
  }

  /// Cancelling, changing the tier, seeing the next charge -- all of it is
  /// Apple's sheet and none of it is ours to draw. An app that builds its own
  /// cancel screen is an app that will be wrong about a subscription bought
  /// on a different device. Apple's own call and not RevenueCat's: this is
  /// not a purchase, and RevenueCat's asks its server before opening the
  /// same sheet, which is one more thing that can be unreachable.
  @objc func manage(_ call: CAPPluginCall) {
    Task { @MainActor in
      guard let scene = self.bridge?.viewController?.view?.window?.windowScene else {
        call.reject("no window"); return
      }
      do {
        try await AppStore.showManageSubscriptions(in: scene)
        /* Somebody may have cancelled in there. RevenueCat hears it, and the
           receipts that go up with this answer carry it -- what it means is
           the server's to say. */
        await self.answer(call)
      } catch {
        call.reject("manage: \(error.localizedDescription)")
      }
    }
  }
}
