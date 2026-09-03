//  LinguaStore.swift
//  What the App Store says about this person's subscription, asked through
//  RevenueCat.
//
//  RevenueCat and not StoreKit directly -- docs/FEATURE_RULES.md 2026-08-25
//  (Shipaton 2026: the entry rule is that the RevenueCat SDK powers at least
//  one in-app purchase) and 2026-09-02 (「RevenueCatで見るって話してるんだけど」
//  OWNER: sales and subscribers are read in RevenueCat's dashboard, and a
//  purchase that never reaches RevenueCat is a purchase that appears in no
//  dashboard at all).
//
//  THE RULE THIS FILE IS BUILT AROUND HAS NOT MOVED, and it is the reason the
//  swap is written this way rather than the short way:
//
//      「プランは絶対におかしくしちゃいけないんだって」 OWNER 2026-09-02
//
//  「持っていない」 and 「分からない」 may not share a branch. An empty
//  entitlement set is 「RevenueCat told me nothing」 as readily as it is
//  「this person owns nothing」, and writing the second one down replaces a
//  paid plan with `free` in the one place the plan LIVES. ONE road may lower
//  the plan: RevenueCat pushing a change at us, and only when what arrived
//  positively SAYS an entitlement ended. Every other road may raise it and
//  may not lower it. tools/plan-check.mjs reads this file and fails if a
//  fourth road is added.
//
//  What the swap changed and what it did not:
//
//    The five methods, their names, their arguments and the shape of every
//    answer are the same. www/store.js is untouched by this file changing --
//    products / buy / restore / current / manage, and the same keys back.
//
//    The four product ids are the same four, and they are still the list this
//    app sells. RevenueCat is asked for them by id rather than through an
//    Offering, because the ids are what `planOf` maps and what plan-check
//    counts; an Offering is a dashboard arrangement and would put the mapping
//    somewhere no check in this repository can read.
//
//    Cancelling still opens Apple's own sheet. RevenueCat can show one too,
//    and an app that draws or proxies its own is an app that will be wrong
//    about a subscription bought on another device.
//
//  Two things it deliberately does not do:
//
//    It does not sync on launch. `restorePurchases()` makes iOS ask for a
//    password, and doing that to somebody who just opened an app they have
//    already paid for is how "Restore" became a button rather than something
//    done automatically. `restore` is that button.
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
import RevenueCat
import StoreKit
import Security

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
  /// from Project settings → API keys.
  ///
  /// In the source, and that is deliberate. It is public in exactly the way
  /// `SB_KEY` in www/net.js is public: it names the app and proves nothing,
  /// every copy of the app on every phone carries it, and RevenueCat's own
  /// installation page puts it in the source. The key that must never be here
  /// is the SECRET one (`sk_`), which is a server's and is not in this
  /// repository at all.
  ///
  /// EMPTY IS A REAL ANSWER and not a placeholder to be substituted: it means
  /// nobody has made the RevenueCat app yet. Nothing here pretends otherwise
  /// -- see `ready` below, which is what an empty key turns off.
  static let apiKey = ""

  /// Whether there is a RevenueCat to ask.
  ///
  /// `Purchases.shared` TRAPS if `configure` was never called -- it is a
  /// fatalError inside the SDK, not an optional -- so every road below asks
  /// this first. An app whose store layer crashes because a dashboard is not
  /// set up yet is worse than one whose plans screen is quiet, and today the
  /// key above is empty, which is every build until the owner has made the
  /// app in RevenueCat.
  static var ready: Bool { !apiKey.isEmpty && Purchases.isConfigured }

  /// Every product, and the plan it buys. The only place either is written
  /// down.
  ///
  /// It was a set of ids that all meant the paid tier, with a note saying
  /// that the day a second tier existed this would become a map. That day is
  /// 2026-08-23: the tiers are Free, Plus and Pro (docs/FEATURE_RULES.md).
  ///
  /// A product id cannot be changed once it exists (`docs/apple.md` § 4), and
  /// asking for one that has not been made is not an error: neither the App
  /// Store nor RevenueCat returns it, which is how this file finds out what
  /// is really on sale rather than being told.
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
  ///
  /// It is ALSO the list of RevenueCat entitlement identifiers, minus `free`,
  /// which is not a thing anybody buys: the dashboard has `plus` and `pro`
  /// spelled exactly like this. A capital letter there and a paid person gets
  /// nothing, so the spelling is one fact in one place.
  static let order = ["free", "plus", "pro"]

  /// Which plan a product buys, or nothing for an id this app does not sell.
  static func planOf(_ productID: String) -> String? {
    return plans.first { $0.id == productID }?.plan
  }

  /// The better of two plans. Somebody can hold both -- an old Plus that has
  /// not run out beside a new Pro, or two subscriptions in different groups
  /// -- and the answer to that is the higher rung, never the last one read.
  static func best(_ a: String, _ b: String) -> String {
    let ia = order.firstIndex(of: a) ?? 0
    let ib = order.firstIndex(of: b) ?? 0
    return ia >= ib ? a : b
  }

  /// Configure the SDK, and start listening.
  ///
  /// Here and not in AppDelegate: this plugin is loaded by the Capacitor
  /// bridge at launch, it is the one thing in the app that talks to the
  /// store, and a `configure` sitting in another file is a `configure` that
  /// gets moved by somebody who does not know this file depends on it.
  ///
  /// The delegate is the road RevenueCat pushes changes down -- a renewal, a
  /// refund, a purchase made on another device, a family member's share, a
  /// cancellation that took effect while the app was shut. It is the
  /// replacement for StoreKit's `Transaction.updates`, and it is the ONE road
  /// that may lower the plan.
  override public func load() {
    guard !Self.apiKey.isEmpty else { return }
    Purchases.configure(withAPIKey: Self.apiKey)
    Purchases.shared.delegate = self
  }

  /// RevenueCat saying something changed.
  ///
  /// WHAT ARRIVED is what decides whether the plan may go DOWN, and a renewal
  /// is not an ending. The StoreKit version of this file re-read the whole
  /// entitlement list with permission to lower on every update -- and that
  /// list answers 「it gave me nothing」 as readily as 「owns nothing」, so a
  /// RENEWAL landing beside a list that had not caught up took the plan away
  /// on the day the person was charged for it. `ended()` below asks what this
  /// customer info actually SAYS instead.
  public func purchases(_ purchases: Purchases, receivedUpdated customerInfo: CustomerInfo) {
    Task { _ = await self.writeDown(mayLower: Self.ended(customerInfo)) }
  }

  /// Whether THIS customer info is RevenueCat saying an entitlement ENDED.
  ///
  /// The distinction the whole file turns on, in one function. An entitlement
  /// this app sells has to be PRESENT and finished -- in `entitlements.all`,
  /// not active, and either revoked or carrying an expiry already behind us.
  ///
  /// AN EMPTY SET IS NOT AN ENDING. `all` is empty on a launch before
  /// RevenueCat has ever answered, on a phone signed out of the App Store,
  /// and on one that cannot reach anything. Reading emptiness as 「it ended」
  /// is the exact shape of the bug that cost the owner their plan twice, and
  /// it is why this asks for a positive statement rather than for a silence.
  ///
  /// An upgrade reads like an ending and is not: buying Pro over Plus retires
  /// `plus` with a date in the past at the moment `pro` is handed out. It is
  /// safe here for a reason worth writing down rather than relying on --
  /// `writeDown` re-reads what is live and gets `pro`, so the write that
  /// follows is a raise. `ended` only ever grants PERMISSION to lower; what
  /// is actually written is always the entitlements as they stand.
  static func ended(_ info: CustomerInfo) -> Bool {
    for (name, ent) in info.entitlements.all {
      guard order.contains(name) else { continue }
      if ent.isActive { continue }
      if let e = ent.expirationDate, e <= Date() { return true }
    }
    return false
  }

  /// What is live right now: the highest plan among the entitlements this
  /// person holds, or "free" when there are none.
  static func entitledPlan() async -> String {
    return await entitledSeen().plan
  }

  /// The same walk, and what it SAW on the way.
  ///
  /// 「これ出るのに、復元できるものはありませんって出るけど？」 OWNER
  /// 2026-09-03, with Apple's own sheet on screen saying Lingua Plus renews on
  /// the 4th for ¥800. The app answered 「there is nothing to restore」.
  ///
  /// Three things produce that answer and they are different faults: nothing
  /// came back at all, something came back and none of it is live, or
  /// something is live under a name this app does not sell (a dashboard
  /// entitlement spelled `Pro` when the ladder says `pro` is exactly this,
  /// and it is silent everywhere else). From the outside all three are the
  /// same sentence, and this is the one place that can tell them apart. It is
  /// counted rather than guessed at: an error is a state, and a state is what
  /// a person on a phone can photograph.
  ///
  /// The three counts keep the meaning www/store.js prints them with
  /// (`storeWhyNone`), across the swap: `saw` is how much came back at all,
  /// `unverified` is how much of it is not live, `unknown` is how much is live
  /// under a name the ladder has never heard of.
  static func entitledSeen() async -> (plan: String, saw: Int, unverified: Int, unknown: Int) {
    guard ready else { return ("free", 0, 0, 0) }
    guard let info = try? await Purchases.shared.customerInfo() else {
      return ("free", 0, 0, 0)
    }
    var out = "free"
    var saw = 0, unver = 0, unknown = 0
    for (name, ent) in info.entitlements.all {
      saw += 1
      guard ent.isActive else { unver += 1; continue }
      guard order.contains(name), name != "free" else { unknown += 1; continue }
      out = best(out, name)
    }
    return (out, saw, unver, unknown)
  }

  /// Ask RevenueCat, then write the answer where the next launch will find
  /// it. Returns what it wrote so a call can answer with the same thing.
  /// NEVER DOWN, unless RevenueCat was actually asked and positively said so.
  ///
  /// 「プランは絶対におかしくしちゃいけないんだって」 OWNER 2026-09-02, after a
  /// paid plan came back free on its own.
  ///
  /// `entitledPlan()` answers `free` for two different things: 「this person
  /// has nothing」 and 「the entitlement set gave me nothing」. Writing the
  /// second down replaces a paid plan with `free` in the one place the plan
  /// LIVES -- and nothing afterwards can tell that it was ever anything else.
  /// Same shape as LinguaPlan.readPlan(), and the same sentence off CLAUDE.md's
  /// first page: 「空」 and 「読めていない」 may not share a branch.
  ///
  /// ONE ROAD MAY LOWER IT, and it is the delegate above -- RevenueCat pushing
  /// a change at us, which is the only moment anything has actually SAID that
  /// this person's subscription ended. AND NOT EVERY PUSH: what arrives there
  /// is a renewal as often as it is an ending, and `ended()` is which of the
  /// two THIS one is.
  ///
  /// `restore` and `manage` were on this list for a morning and are off it.
  /// Both end in reading the entitlements, and an empty set there is not a
  /// person who owns nothing: on TestFlight and in the sandbox it is routinely
  /// empty for an account that is paying, and a restore that SUCCEEDS does not
  /// change that. It cost the owner their plan on the build that had it:
  /// 「復元するものはありませんって出るけどさ、さっきまでプロだったんだけど
  /// 消えたってこと？」OWNER 2026-09-02.
  ///
  /// Restore means 「give me back what I bought」. Finding nothing is not an
  /// instruction to take something away.
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
         write below, and `seen` is `free` whenever the entitlements gave
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

  /// What is for sale, with prices as the store gives them.
  ///
  /// `localizedPriceString` and not a number: it is already in the person's
  /// currency, already formatted the way their region formats money, and
  /// already the string Apple requires be shown. Building "$" + a number is
  /// how an app ends up showing dollars to somebody being charged yen.
  /// 「4はドル。でもさっき価格登録してきたけど日本円は800円とかになってたよ」
  ///
  /// Asked by id and not through an Offering. The four ids are what this app
  /// sells, `planOf` maps them, and plan-check counts them; an Offering is an
  /// arrangement in a dashboard, and a product that fell out of one would go
  /// quiet here with nothing in this repository able to say why.
  @objc func products(_ call: CAPPluginCall) {
    guard Self.ready else { call.resolve(["products": []]); return }
    Task {
      let found = await Purchases.shared.products(Self.ids)
      let out: [[String: Any]] = found.map { p in
        var row: [String: Any] = [
          "id": p.productIdentifier,
          "name": p.localizedTitle,
          "text": p.localizedDescription,
          "price": p.localizedPriceString,
          /* The same money as a number, and it is here for exactly one sum:
             how much less a year is than twelve months. That figure differs
             by country -- each storefront is rounded its own way, so a year
             that is 17% off in one is 15% off in another -- and working it
             out from `price` would be arithmetic on a formatted string in
             whatever currency. It is never shown; only a string the store
             formatted is ever put on a screen. */
          "amount": NSDecimalNumber(decimal: p.price).doubleValue,
        ]
        /* Twelve of this one, formatted by the store's own formatter. It is
           what a year is struck through with on the plans page:
           「49.99は取り消し線＋17%OFF」OWNER 2026-08-26.

           The sum is done here and not in www for the same reason `amount` is
           never shown -- www has the number but not the currency and not the
           region's way of writing money, so twelve times ¥750 could only be
           built there as "¥" and a number.

           Nothing is put in `year` when the formatter is missing. www reads
           this as the empty string and shows no struck-through price at all,
           which is the answer OWNER 2026-08-26 gave for the fallback: 何も
           出さない. A dollar sign shown to somebody being charged yen is a
           lie; nothing shown is not. */
        if let f = p.priceFormatter,
           let y = f.string(from: NSDecimalNumber(decimal: p.price * 12)) {
          row["year"] = y
        }
        /* A subscription's period is what tells the two apart on screen, and
           it is the store's answer rather than ours -- a product renamed
           "yearly" that is configured monthly should read monthly. */
        if let s = p.subscriptionPeriod {
          row["unit"] = String(describing: s.unit).lowercased()
          row["count"] = s.value
        }
        return row
      }
      call.resolve(["products": out])
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
    guard Self.ready else { call.reject("no store"); return }
    Task {
      guard let product = await Purchases.shared.products([id]).first else {
        call.reject("no such product"); return
      }
      do {
        let result = try await Purchases.shared.purchase(product: product)
        if result.userCancelled {
          call.resolve(["how": "cancelled", "plan": await standing()])
          return
        }
        /// THE TRANSACTION ITSELF IS THE ANSWER, and not only the entitlements.
        ///
        /// The entitlement set is what a plan IS at any other moment, and it
        /// is right everywhere except here: nothing promises that a purchase
        /// finished a millisecond ago is already reflected in it, and when it
        /// is not, `entitledPlan()` answers `free` -- so the app wrote `free`
        /// down the instant somebody paid, said 「無料になりました」 and put
        /// the lapse popup up. Money taken, plan gone. 「今課金したのに（仮）
        /// フリーになりましたって出たんだけど…プロにならなかった」 OWNER
        /// 2026-09-01, on a real phone.
        ///
        /// This is not trusting the request: it is the productIdentifier off
        /// the transaction RevenueCat handed back for a purchase it verified
        /// against Apple, and `best()` keeps whichever is higher, so an older
        /// and better entitlement is never written down over.
        let paid = result.transaction.flatMap { Self.planOf($0.productIdentifier) }
        var plan = await writeDown()
        if let bought = paid {
          let both = Self.best(plan, bought)
          if both != plan { plan = both; LinguaPlanPlugin.set(plan) }
        }
        /// AND WHAT WAS BOUGHT IS ANSWERED SEPARATELY FROM WHAT IS HELD.
        ///
        /// 「plus で課金しても pro になりましたって出る」 OWNER 2026-09-02, on
        /// a real phone. `plan` above is the BEST of everything this person
        /// holds, which is what a plan IS and is right -- and it is the wrong
        /// thing to name in the sentence after a purchase, because somebody
        /// who just pressed Plus is told they bought Pro.
        ///
        /// The two come apart whenever a better entitlement is already live,
        /// and today that is not a corner: Plus and Pro are in two
        /// subscription groups in App Store Connect, so both run at once and
        /// both are charged. docs/apple.md § 4 says one group. That is the
        /// owner's to fix in the dashboard and cannot be fixed here.
        call.resolve(["how": "bought", "plan": plan, "bought": paid ?? ""])
      } catch {
        /* Ask To Buy, or a bank that wants a second step. There is nothing to
           wait for here: it arrives at the delegate whenever it arrives, which
           may be after the app has been closed. RevenueCat reports it as an
           error code rather than as an outcome, so it is caught rather than
           switched on. */
        if let e = error as? RevenueCat.ErrorCode, e == .paymentPendingError {
          call.resolve(["how": "pending", "plan": await standing()])
          return
        }
        call.reject("buy: \(error.localizedDescription)")
      }
    }
  }

  /// `restorePurchases()`, with a bound on how long it may take.
  ///
  /// It puts up Apple's own sign-in sheet, and a sheet that is dismissed
  /// rather than answered can leave the call suspended with nothing to
  /// resolve. The button then says 「問い合わせ中」and never says anything
  /// else, which is what a person sees:
  /// 「購入を復元押しても問い合わせ中しか出ないよ」OWNER 2026-09-02.
  ///
  /// The answer does not depend on it. What this person holds is the
  /// entitlement set; restoring only refreshes it, and is worth waiting a
  /// while for and not for ever.
  ///
  /// Returns whether it actually came back, because that decides something
  /// else -- see restore().
  private static func syncWithin(_ seconds: UInt64) async -> Bool {
    guard ready else { return false }
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

  /// The Restore button, and the only thing that calls `restorePurchases()`.
  ///
  /// It asks for an App Store password, which is why it is a button somebody
  /// presses and not something done on launch. A restore that fails is not
  /// necessarily a person with nothing: the entitlements already known are
  /// still worth reading, so the answer is given either way.
  ///
  /// AND IT NEVER LOWERS THE PLAN. Not even when the restore came back: an
  /// empty entitlement set is 「it told me nothing」 as often as it is 「this
  /// person owns nothing」, and restore is the button for getting a plan BACK.
  /// See writeDown() above for the day that cost.
  @objc func restore(_ call: CAPPluginCall) {
    Task {
      let synced = await Self.syncWithin(12)
      let seen = await Self.entitledSeen()
      let plan = await writeDown(mayLower: false)
      /* What the walk saw, so that 「there is nothing to restore」 on a phone
         Apple says is subscribed can be told apart from the same words on a
         phone that really owns nothing. See entitledSeen(). */
      call.resolve(["plan": plan, "synced": synced,
                    "saw": seen.saw, "unverified": seen.unverified,
                    "unknown": seen.unknown])
    }
  }

  /// What the store says right now. Also writes it down: a session that asks
  /// is a session that can be told, and the Keychain is how the next launch
  /// is told.
  @objc func current(_ call: CAPPluginCall) {
    Task { call.resolve(["plan": await writeDown()]) }
  }

  /// Cancelling, changing the tier, seeing the next charge -- all of it is
  /// Apple's sheet and none of it is ours to draw. An app that builds its own
  /// cancel screen is an app that will be wrong about a subscription bought
  /// on a different device.
  ///
  /// StoreKit's own call and not RevenueCat's wrapper around it: this is the
  /// one road that never needed a dashboard to work, and it should go on
  /// working on a build whose RevenueCat app has not been made yet.
  @objc func manage(_ call: CAPPluginCall) {
    Task { @MainActor in
      guard let scene = self.bridge?.viewController?.view?.window?.windowScene else {
        call.reject("no window"); return
      }
      do {
        try await AppStore.showManageSubscriptions(in: scene)
        /* Coming back from Apple's sheet does not lower it either. Somebody
           may have cancelled in there, and that arrives at the delegate --
           which is RevenueCat saying so. Reading an empty entitlement set a
           second later is this app guessing. */
        call.resolve(["plan": await self.writeDown(mayLower: false)])
      } catch {
        call.reject("manage: \(error.localizedDescription)")
      }
    }
  }
}
