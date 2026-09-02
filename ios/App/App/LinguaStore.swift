//  LinguaStore.swift
//  What the App Store says about this person's subscription.
//
//  StoreKit 2, and no receipt validation of our own. The deployment target is
//  iOS 15.0 and StoreKit 2 is exactly iOS 15, so there is no fallback path to
//  write and no `if #available` to get wrong. `Transaction.currentEntitlements`
//  is signed by Apple and checked on the device before it is handed over;
//  everything below refuses `.unverified` outright rather than "warning and
//  carrying on", because carrying on is what makes a check decorative.
//
//  This file does NOT decide what a plan is worth or when it lapses. It
//  answers one question -- is there a live Plus entitlement right now -- and
//  writes the answer where LinguaPlan.swift already keeps it. The rules about
//  what a lapsed plan may and may not remove are in docs/DATA_SAFETY.md and
//  live in www/, where they have always been.
//
//  Two things it deliberately does not do:
//
//    It does not sync on launch. `AppStore.sync()` makes iOS ask for a
//    password, and doing that to somebody who just opened an app they have
//    already paid for is how "Restore" became a button on every paid app
//    rather than something done automatically. `restore` is that button.
//
//    It does not tell the web view. There is no @capacitor/core in this app
//    -- www/share.js says why, at length -- so there is no addListener on the
//    JavaScript side to notify. The durable channel is the Keychain: a
//    renewal that arrives with nobody in the app is written down, and
//    LinguaPlan.inject() hands it to the first line of JavaScript at the next
//    launch. Inside a session, JavaScript asks `current` when it wants to
//    know.

import Foundation
import Capacitor
import StoreKit
import Security

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

  /// Every product, and the plan it buys. The only place either is written
  /// down.
  ///
  /// It was a set of ids that all meant the paid tier, with a note saying
  /// that the day a second tier existed this would become a map. That day is
  /// 2026-08-23: the middle rung is decided -- `docs/FEATURE_RULES.md`, $4.99
  /// and $49.99, and it buys letters, one keyboard, a thousand words, a
  /// writing system and the choice of a sound. The tiers are Free, Plus and
  /// Pro; they were Free, Basic and Plus until the same day, because Basic
  /// reads as the name of a free tier.
  ///
  /// A product id cannot be changed once it exists (`docs/apple.md` § 4), and
  /// none of Basic's exist yet. Asking for one that does not is not an error:
  /// StoreKit simply does not return it, which is how this file finds out
  /// what is really on sale rather than being told. The same was true of the
  /// yearly Plus id for a fortnight.
  static let plans: [(id: String, plan: String)] = [
    ("com.tokinets.lingua.plus.monthly", "plus"),
    ("com.tokinets.lingua.plus.yearly",  "plus"),
    ("com.tokinets.lingua.pro.monthly",  "pro"),
    ("com.tokinets.lingua.pro.yearly",   "pro"),
  ]
  static var ids: [String] { plans.map { $0.id } }

  /// The ladder, cheapest first, and the same one `PLAN_ORDER` in
  /// `www/core.js` is. Two copies of an order is how two sides of a bridge
  /// come to disagree about which plan is better, so if one of them ever
  /// gains a rung the other is not optional.
  static let order = ["free", "plus", "pro"]

  /// Which plan a product buys, or nothing for an id this app does not sell.
  static func planOf(_ productID: String) -> String? {
    return plans.first { $0.id == productID }?.plan
  }

  /// The better of two plans. Somebody can hold both -- an old Basic that has
  /// not run out beside a new Plus, or two subscriptions in different groups
  /// -- and the answer to that is the higher rung, never the last one read.
  static func best(_ a: String, _ b: String) -> String {
    let ia = order.firstIndex(of: a) ?? 0
    let ib = order.firstIndex(of: b) ?? 0
    return ia >= ib ? a : b
  }

  /// The listener for transactions that arrive with nobody in the app: a
  /// renewal, a refund, a purchase made on another device, a family member's
  /// share. Apple's own guidance is to start this at launch and to keep it
  /// for the life of the process, because a transaction delivered while
  /// nothing is listening is delivered again at the next launch and the
  /// intervening days are days the app was wrong about.
  private var watch: Task<Void, Never>?

  override public func load() {
    watch = Task.detached { [weak self] in
      for await result in Transaction.updates {
        guard let t = Self.verified(result) else { continue }
        /* finish() is what tells the App Store to stop redelivering this.
           Not finishing is the classic StoreKit bug: everything works, and
           the same transaction arrives at every launch forever. */
        await t.finish()
        /* WHAT ARRIVED is what decides whether the plan may go DOWN, and a
           renewal is not an ending. Every transaction used to re-read the
           entitlement list with permission to lower -- and that list answers
           `free` for 「it gave me nothing」 as readily as for 「owns nothing」,
           so a RENEWAL landing beside a list that had not caught up took the
           plan away on the day the person was charged for it. Apple says an
           ending on the transaction itself; this asks that instead. */
        _ = await self?.writeDown(mayLower: Self.ended(t))
      }
    }
  }

  deinit { watch?.cancel() }

  /// Whether THIS transaction is Apple saying the subscription ended: revoked
  /// -- a refund -- or an expiry already behind us.
  ///
  /// A renewal carries an expiry in the FUTURE, and is the opposite of an
  /// ending. An upgrade is the other one that reads like an ending and is not:
  /// the superseded transaction is retired with a date in the past at the
  /// moment a BETTER one is handed out, so reading it as an ending is how a
  /// plan goes down on the day it went up. `isUpgraded` is Apple saying which
  /// of the two this is.
  private static func ended(_ t: Transaction) -> Bool {
    if t.revocationDate != nil { return true }
    if t.isUpgraded { return false }
    if let e = t.expirationDate { return e <= Date() }
    return false
  }

  /// `.unverified` is not "probably fine". It is the one signal that the
  /// signature did not check out on this device, and the answer to it is no.
  private static func verified<T>(_ r: VerificationResult<T>) -> T? {
    switch r {
    case .verified(let v): return v
    case .unverified: return nil
    }
  }

  /// What is live right now: the highest plan among the entitlements this
  /// device holds, or "free" when there are none.
  ///
  /// `currentEntitlements` already leaves out what has expired and what was
  /// refunded, so there is no date arithmetic here. `revocationDate` is
  /// checked anyway: a refund can be reflected in the transaction before it
  /// is reflected in the list, and the free side is the side to be wrong on.
  ///
  /// It answered a Bool while there was one tier to sell. A Bool cannot say
  /// WHICH, and the day the middle tier goes on sale a Bool would read every
  /// Plus receipt as Pro -- every door open, for five dollars.
  static func entitledPlan() async -> String {
    var out = "free"
    for await result in Transaction.currentEntitlements {
      guard let t = verified(result) else { continue }
      if t.revocationDate != nil { continue }
      guard let p = planOf(t.productID) else { continue }
      out = best(out, p)
    }
    return out
  }

  /// Ask the App Store, then write the answer where the next launch will find
  /// it. Returns what it wrote so a call can answer with the same thing.
  /// NEVER DOWN, unless Apple was actually asked.
  ///
  /// 「プランは絶対におかしくしちゃいけないんだって」 OWNER 2026-09-02, after a
  /// paid plan came back free on its own.
  ///
  /// `entitledPlan()` answers `free` for two different things: 「this person
  /// has nothing」 and 「the entitlement list gave me nothing」. An empty
  /// `Transaction.currentEntitlements` is a real state on a launch before the
  /// receipt is there, on a phone signed out of the App Store, and on one that
  /// cannot reach it. Writing that down replaces a paid plan with `free` in
  /// the one place the plan LIVES -- and nothing afterwards can tell that it
  /// was ever anything else. Same shape as LinguaPlan.readPlan(), and the same
  /// sentence off CLAUDE.md's first page: 「空」 and 「読めていない」 may not
  /// share a branch.
  ///
  /// ONE ROAD MAY LOWER IT, and it is `Transaction.updates` -- Apple pushing
  /// a change at us, which is the only moment anything has actually SAID that
  /// this person's subscription ended. AND NOT EVERY PUSH: what arrives there
  /// is a renewal as often as it is an ending, and `ended()` above is which of
  /// the two THIS transaction is. A renewal that re-read the entitlement list
  /// with permission to lower was the same bug one road further out.
  ///
  /// `restore` and `manage` were on this list for a morning and are off it.
  /// Both end in reading `currentEntitlements`, and an empty list there is
  /// not a person who owns nothing: on TestFlight and in the sandbox it is
  /// routinely empty for an account that is paying, and a `sync()` that
  /// SUCCEEDS does not change that. It cost the owner their plan on the
  /// build that had it: 「復元するものはありませんって出るけどさ、さっきまで
  /// プロだったんだけど消えたってこと？」OWNER 2026-09-02.
  ///
  /// Restore means 「give me back what I bought」. Finding nothing is not an
  /// instruction to take something away. A cancellation still lands, from
  /// the updates listener, which is Apple saying it rather than this app
  /// inferring it from a silence.
  @discardableResult
  private func writeDown(mayLower: Bool = false) async -> String {
    let seen = await Self.entitledPlan()
    if !mayLower {
      let (held, st) = LinguaPlanPlugin.readPlan()
      /* Only a Keychain that ANSWERED is worth comparing against. A read that
         failed says nothing about what is there, so it does not get a vote. */
      if st == errSecSuccess, !held.isEmpty, Self.best(seen, held) != seen {
        return held
      }
      /* AND A READ THAT FAILED IS NOT WRITTEN OVER EITHER. Not getting a vote
         was only half of it: every other status fell straight through to the
         write below, and `seen` is `free` whenever the entitlement list gave
         nothing -- so a launch that could not open the Keychain put `free` on
         top of the plan it had just failed to read, in the one place the plan
         LIVES. `errSecItemNotFound` is 「there is nothing there」 and IS an
         answer, which is the line LinguaPlan.inject() already draws; every
         other status is 「could not read」 and nothing is written for it.
         Returning `seen` is safe on its own -- www/store.js puts it through
         planBest() against what is already on the screen, so it can raise
         what is shown and never lower it. */
      if st != errSecSuccess && st != errSecItemNotFound { return seen }
    }
    LinguaPlanPlugin.set(seen)
    return seen
  }

  /// The plan as it stands, without writing anything: the three outcomes of
  /// `buy` that are not a purchase have not changed anything, and a Keychain
  /// write on a cancelled purchase is a write that says nothing.
  private func standing() async -> String {
    return await Self.entitledPlan()
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

  /// Buy one.
  ///
  /// The four outcomes are told apart rather than collapsed into
  /// success/failure, because they need four different things said to a
  /// person: it worked; you cancelled; the bank or a parent has to approve
  /// this and you will hear later; and something failed. Only the first
  /// writes anything down.
  @objc func buy(_ call: CAPPluginCall) {
    guard let id = call.getString("id"), Self.ids.contains(id) else {
      call.reject("no such product"); return
    }
    Task {
      do {
        guard let product = try await Product.products(for: [id]).first else {
          call.reject("no such product"); return
        }
        let result = try await product.purchase()
        switch result {
        case .success(let v):
          guard let t = Self.verified(v) else {
            call.reject("could not be verified"); return
          }
          await t.finish()
          /// THE TRANSACTION ITSELF IS THE ANSWER, and not only the list.
          ///
          /// `currentEntitlements` is what a plan IS at any other moment, and
          /// it is right everywhere except here: StoreKit does not promise
          /// that a purchase finished a millisecond ago is already in that
          /// list, and when it is not, `entitledPlan()` answers `free` -- so
          /// the app wrote `free` down the instant somebody paid, said 「無料に
          /// なりました」 and put the lapse popup up. Money taken, plan gone.
          /// 「今課金したのに（仮）フリーになりましたって出たんだけど…プロに
          /// ならなかった」 OWNER 2026-09-01, on a real phone.
          ///
          /// This is not trusting the request: `verified()` above refuses
          /// anything Apple has not signed, and `planOf` maps the signed
          /// transaction's own productID. `best()` keeps whichever is higher,
          /// so a list that HAS caught up is still used and an older, better
          /// entitlement is never written down over.
          var plan = await writeDown()
          if let bought = Self.planOf(t.productID) {
            let both = Self.best(plan, bought)
            if both != plan { plan = both; LinguaPlanPlugin.set(plan) }
          }
          call.resolve(["how": "bought", "plan": plan])
        case .userCancelled:
          call.resolve(["how": "cancelled", "plan": await standing()])
        case .pending:
          /* Ask To Buy, or a bank that wants a second step. There is nothing
             to wait for here: it arrives at Transaction.updates whenever it
             arrives, which may be after the app has been closed. */
          call.resolve(["how": "pending", "plan": await standing()])
        @unknown default:
          call.resolve(["how": "unknown", "plan": await standing()])
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
  /// necessarily a person with nothing: the entitlements already on the
  /// device are still worth reading, so the answer is given either way.
  ///
  /// AND IT NEVER LOWERS THE PLAN. Not even when the sync came back: an
  /// empty entitlement list is 「Apple told me nothing」 as often as it is
  /// 「this person owns nothing」, and restore is the button for getting a
  /// plan BACK. See writeDown() above for the day that cost.
  @objc func restore(_ call: CAPPluginCall) {
    Task {
      let synced = await Self.syncWithin(12)
      let plan = await writeDown(mayLower: false)
      call.resolve(["plan": plan, "synced": synced])
    }
  }

  /// What the App Store says right now. Also writes it down: a session that
  /// asks is a session that can be told, and the Keychain is how the next
  /// launch is told.
  @objc func current(_ call: CAPPluginCall) {
    Task { call.resolve(["plan": await writeDown()]) }
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
        /* Coming back from Apple's sheet does not lower it either. Somebody
           may have cancelled in there, and that arrives as a Transaction
           update -- which is Apple saying so. Reading an empty entitlement
           list a second later is this app guessing. */
        call.resolve(["plan": await self.writeDown(mayLower: false)])
      } catch {
        call.reject("manage: \(error.localizedDescription)")
      }
    }
  }
}
