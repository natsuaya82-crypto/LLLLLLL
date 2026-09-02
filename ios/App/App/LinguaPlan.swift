//  LinguaPlan.swift
//  Where the plan is kept, and the only reason it is not kept with the rest of
//  the settings.
//
//  Everything else a person chooses -- the theme, the interface language, the
//  word order -- lives in localStorage, which is a file inside the app. That
//  file goes into the backup a phone makes onto a PC, and a backup can be
//  opened, edited and restored with free tools and no jailbreak. "free" ->
//  "plus" is a three-step job for anybody with a cable.
//
//  The Keychain is the one store on this phone that does not work that way.
//  kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly says two things: readable
//  after the first unlock, so a launch in the background finds it; and never
//  in a backup, never on another device, which is the whole point.
//
//  What this does NOT stop: a jailbroken phone, where the app's own JavaScript
//  can be edited and the question never gets asked. Nothing stops that, and
//  the number of people who will do it is small. This closes the door that
//  needs no jailbreak, which is the one with people behind it.
//
//  TWO THINGS ARE KEPT HERE, NOT ONE. The plan, and the account that bought
//  it -- 「1アドレス1アカウント」「これは絶対課金もアカウントごと言語もそう」
//  「Xは違うアカウントだと課金も引き継がれない」 OWNER 2026-09-02.
//
//  A plan is the ACCOUNT's, and it is not the Apple ID's and not this
//  handset's. Somebody who signs into a second account on the same iPhone does
//  not inherit the subscription bought on it. There was no `uid` in this file
//  at all, so the plan sat on the handset with nobody's name on it: A signs
//  out, B signs in, and the plan the phone was holding became B's the moment
//  www/net.js read the two copies together.
//
//  The uid is in the Keychain rather than in the settings file for exactly
//  the reason the plan is. The settings are in the backup a phone makes onto
//  a PC, so an owner written there is an owner anybody with a cable can
//  forge -- and forging it is worth more than forging the plan, because it is
//  how you take somebody else's.
//
//  Reading happens before the web view loads, not through a plugin call. The
//  app decides what a free plan looks like -- how many words are listed, which
//  keyboard is used, whether letters can be added -- on the first frame, and
//  a plugin call comes back a frame later than that. So the value is injected
//  as a script at document start and www/core.js finds it already there.
//  Writing is a plugin call, because it only ever happens when somebody has
//  just pressed something.

import Foundation
import Capacitor
import Security
import WebKit

@objc(LinguaPlanPlugin)
public class LinguaPlanPlugin: CAPPlugin, CAPBridgedPlugin {
  public let identifier = "LinguaPlanPlugin"
  public let jsName = "LinguaPlan"
  public let pluginMethods: [CAPPluginMethod] = [
    CAPPluginMethod(name: "write", returnType: CAPPluginReturnPromise),
  ]

  static let service = "com.tokinets.lingua.plan"
  static let account = "plan"
  /// The account that bought what `account` holds. A second item under the
  /// same service, so one query function answers for both.
  static let accountUid = "uid"

  private static func query(_ acct: String) -> [String: Any] {
    [kSecClass as String: kSecClassGenericPassword,
     kSecAttrService as String: service,
     kSecAttrAccount as String: acct]
  }

  /// The plan, AND whether the Keychain actually answered.
  ///
  /// These are two different facts and they used to share one empty string.
  /// `errSecItemNotFound` is 「there is nothing there」 -- a fresh install, or
  /// one that predates this file -- and www/core.js answers it by writing what
  /// the old settings held, which on a phone that never paid is `free`.
  /// Anything ELSE is 「could not read」: the item exists and this call did not
  /// get it. `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` says exactly
  /// when that happens, and a launch can be earlier than that.
  ///
  /// With one string for both, a failed READ became a WRITE of `free` over
  /// somebody's paid plan, and the Keychain is where the plan LIVES -- so it
  /// was gone. 「アップデートしたら勝手に無料プランになったんだけど？」 OWNER
  /// 2026-09-02. CLAUDE.md's first page: 「Empty」 and 「broken」 are different
  /// states and must not share a branch.
  static func readPlan() -> (String, OSStatus) {
    return read(account)
  }

  /// And WHOSE it is. Same two facts and the same reason for keeping them
  /// apart: `errSecItemNotFound` here is 「nobody has been written down」,
  /// which is every install that predates this file, and www/core.js answers
  /// that by leaving the plan exactly where it is. Anything else is a read
  /// that failed, and a failed read must never be mistaken for 「it belongs to
  /// nobody」 -- that would hand the plan to whoever signs in next.
  static func readUid() -> (String, OSStatus) {
    return read(accountUid)
  }

  private static func read(_ acct: String) -> (String, OSStatus) {
    var q = query(acct)
    q[kSecReturnData as String] = true
    q[kSecMatchLimit as String] = kSecMatchLimitOne
    var item: CFTypeRef?
    let st = SecItemCopyMatching(q as CFDictionary, &item)
    guard st == errSecSuccess,
          let data = item as? Data,
          let s = String(data: data, encoding: .utf8) else { return ("", st) }
    return (s, st)
  }

  /// A plan is a short lowercase word and nothing else. This is not about
  /// trusting the Keychain -- it is about what gets pasted into a script tag
  /// below, where anything else would be somebody else's code running.
  private static func clean(_ s: String) -> String {
    let ok = s.unicodeScalars.allSatisfy { $0.value >= 97 && $0.value <= 122 }
    return (ok && s.count <= 16) ? s : ""
  }

  /// And a uid is a UUID and nothing else -- hex digits and hyphens. Same
  /// argument as clean() above and not a second one: this goes into a script
  /// tag, so what is not a uid is somebody else's code.
  private static func cleanUid(_ s: String) -> String {
    let ok = s.unicodeScalars.allSatisfy { u in
      (u.value >= 48 && u.value <= 57) ||
      (u.value >= 97 && u.value <= 102) ||
      (u.value >= 65 && u.value <= 70) ||
      u.value == 45
    }
    return (ok && !s.isEmpty && s.count <= 64) ? s : ""
  }

  /// Put the plan where the first line of JavaScript can see it. Called from
  /// MainViewController while the bridge is being built, which is before the
  /// web view has loaded anything.
  static func inject(into webView: WKWebView?) {
    guard let ucc = webView?.configuration.userContentController else { return }
    let (plan, st) = readPlan()
    let (uid, ust) = readUid()
    /* Whether the Keychain ANSWERED. Found, or genuinely empty, are both an
       answer; anything else is a read that failed and www/core.js must not
       write over what it cannot see.

       BOTH READS, and one answer for the pair. They are one fact -- a plan and
       whose it is -- and a launch that has one without the other is a launch
       that cannot tell 「nobody bought this」 from 「the Keychain did not
       answer」. One flag rather than two because there is nothing www/core.js
       could usefully do differently between them: either it may write what it
       read down, or it leaves everything alone. */
    let answered = (st == errSecSuccess || st == errSecItemNotFound) &&
                   (ust == errSecSuccess || ust == errSecItemNotFound)
    let js = "window.__plan=\"" + clean(plan) + "\";" +
             "window.__planuid=\"" + cleanUid(uid) + "\";" +
             "window.__planok=" + (answered ? "1" : "0") + ";"
    ucc.addUserScript(WKUserScript(source: js,
                                   injectionTime: .atDocumentStart,
                                   forMainFrameOnly: true))
  }

  /// The plan, written down.
  ///
  /// Static, and not the plugin method, because there are two callers and only
  /// one of them is somebody pressing something. LinguaStore.swift writes
  /// through here when the App Store says the subscription changed, which
  /// happens with nobody in the app at all -- a renewal, a refund, a family
  /// member's purchase. One door, so there is one place where a plan is
  /// written down and one definition of what a plan may say.
  ///
  /// It does NOT touch the uid. See setUid() below for why that is the right
  /// answer for the caller that has no account to name.
  @discardableResult
  static func set(_ plan: String) -> OSStatus {
    let ok = clean(plan)
    guard !ok.isEmpty else { return errSecParam }
    return store(account, ok)
  }

  /// And who bought it. A SEPARATE call, and separate on purpose: this file
  /// has two writers and only one of them knows an account. LinguaStore.swift
  /// writes through `set` when the App Store says the subscription changed,
  /// and that happens with nobody in the app at all -- a renewal, a refund, a
  /// family member's purchase -- so it has no uid to give and must not be made
  /// to invent one. Leaving the uid untouched there is right: the plan moved,
  /// the person who bought it did not.
  ///
  /// Never cleared. There is no call that empties this, and that is the
  /// point -- signing out would be the obvious place to do it, and clearing it
  /// there is exactly how the next account inherits the subscription.
  @discardableResult
  static func setUid(_ uid: String) -> OSStatus {
    let ok = cleanUid(uid)
    guard !ok.isEmpty else { return errSecParam }
    return store(accountUid, ok)
  }

  /// Update if it is there, add if it is not. Two calls rather than one
  /// because SecItemUpdate does not create and SecItemAdd does not replace.
  private static func store(_ acct: String, _ value: String) -> OSStatus {
    guard let data = value.data(using: .utf8) else { return errSecParam }
    let q = query(acct)
    let attrs: [String: Any] = [
      kSecValueData as String: data,
      kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
    ]
    var st = SecItemUpdate(q as CFDictionary, attrs as CFDictionary)
    if st == errSecItemNotFound {
      var add = q
      for (k, v) in attrs { add[k] = v }
      st = SecItemAdd(add as CFDictionary, nil)
    }
    return st
  }

  @objc func write(_ call: CAPPluginCall) {
    guard let plan = call.getString("plan"), !Self.clean(plan).isEmpty else {
      call.reject("not a plan"); return
    }
    let st = Self.set(plan)
    /* And whose, when the caller knows. www/core.js § planKeep() sends a uid
       only when there is a session, so an absent one here means 「nobody was
       signed in when this plan was written down」 and the owner already on
       record stays on record. A uid that is not a uid is dropped by
       setUid(); it is not a reason to fail the write of the plan, which is
       the thing that was asked for. */
    if let uid = call.getString("uid") { Self.setUid(uid) }
    if st == errSecSuccess { call.resolve() } else { call.reject("keychain \(st)") }
  }
}
