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

  private static func query() -> [String: Any] {
    [kSecClass as String: kSecClassGenericPassword,
     kSecAttrService as String: service,
     kSecAttrAccount as String: account]
  }

  /// Empty when there is nothing there, which is what a fresh install and an
  /// install that predates this file both look like. www/core.js tells them
  /// apart from a plan it can read out of the old settings.
  static func read() -> String {
    var q = query()
    q[kSecReturnData as String] = true
    q[kSecMatchLimit as String] = kSecMatchLimitOne
    var item: CFTypeRef?
    guard SecItemCopyMatching(q as CFDictionary, &item) == errSecSuccess,
          let data = item as? Data,
          let s = String(data: data, encoding: .utf8) else { return "" }
    return s
  }

  /// A plan is a short lowercase word and nothing else. This is not about
  /// trusting the Keychain -- it is about what gets pasted into a script tag
  /// below, where anything else would be somebody else's code running.
  private static func clean(_ s: String) -> String {
    let ok = s.unicodeScalars.allSatisfy { $0.value >= 97 && $0.value <= 122 }
    return (ok && s.count <= 16) ? s : ""
  }

  /// Put the plan where the first line of JavaScript can see it. Called from
  /// MainViewController while the bridge is being built, which is before the
  /// web view has loaded anything.
  static func inject(into webView: WKWebView?) {
    guard let ucc = webView?.configuration.userContentController else { return }
    let js = "window.__plan=\"" + clean(read()) + "\";"
    ucc.addUserScript(WKUserScript(source: js,
                                   injectionTime: .atDocumentStart,
                                   forMainFrameOnly: true))
  }

  /// Update if it is there, add if it is not. Two calls rather than one
  /// because SecItemUpdate does not create and SecItemAdd does not replace.
  ///
  /// Static, and not the plugin method, because there are two callers now and
  /// only one of them is somebody pressing something. LinguaStore.swift writes
  /// through here when the App Store says the subscription changed, which
  /// happens with nobody in the app at all -- a renewal, a refund, a family
  /// member's purchase. One door, so there is one place where a plan is
  /// written down and one definition of what a plan may say.
  @discardableResult
  static func set(_ plan: String) -> OSStatus {
    let ok = clean(plan)
    guard !ok.isEmpty, let data = ok.data(using: .utf8) else { return errSecParam }
    let q = query()
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
    if st == errSecSuccess { call.resolve() } else { call.reject("keychain \(st)") }
  }
}
