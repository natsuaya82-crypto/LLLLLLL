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
        _ = await self?.writeDown()
      }
    }
  }

  deinit { watch?.cancel() }

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
  @discardableResult
  private func writeDown() async -> String {
    let plan = await Self.entitledPlan()
    LinguaPlanPlugin.set(plan)
    return plan
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
               string in whatever currency. It is never shown; only `price`
               is ever put on a screen. */
            "amount": NSDecimalNumber(decimal: p.price).doubleValue,
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
          let plan = await writeDown()
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

  /// The Restore button, and the only thing that calls AppStore.sync().
  ///
  /// It asks for an App Store password, which is why it is a button somebody
  /// presses and not something done on launch. A sync that fails is not
  /// necessarily a person with nothing: the entitlements already on the
  /// device are still worth reading, so the answer is given either way.
  @objc func restore(_ call: CAPPluginCall) {
    Task {
      var said = ""
      do { try await AppStore.sync() }
      catch { said = error.localizedDescription }
      let plan = await writeDown()
      var out: [String: Any] = ["plan": plan]
      if !said.isEmpty { out["trouble"] = said }
      call.resolve(out)
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
        call.resolve(["plan": await self.writeDown()])
      } catch {
        call.reject("manage: \(error.localizedDescription)")
      }
    }
  }
}
