//  LinguaPush.swift
//  The one window onto Apple's notifications, the way LinguaShare.swift is the
//  one window onto the App Group and www/net.js is the one onto the server.
//
//  「通知作ろう。アップルのネイティブ通知で、フォローされた時、返信きた時みたい
//   な感じでSNS部分であるやつ。」 OWNER 2026-09-22.
//
//  Three things happen here and nothing else does:
//
//    ask()     — put iOS's own question in front of somebody, and if they say
//                yes, register with Apple and hand the token back.
//    status()  — what the answer is now. Not a copy of it: asked of iOS every
//                time, because a person can change it in Settings and a copy
//                would be the app's second answer to a question iOS owns.
//    the tap   — a notification opened the app, so www is told what it was.
//
//  WHAT IT DOES NOT DO: it does not decide what a notification says, when one
//  is sent, or who gets one. That is the server (supabase/, another session's)
//  — this side only says 「this handset, for this account, can be reached at
//  this address」 and hands a tap over. It does not write the token down
//  anywhere either: www/push.js POSTs it to `device` and that row is the
//  record.
//
//  ---- the token is not something we can simply ASK for -------------------
//
//  registerForRemoteNotifications() returns nothing. Apple answers minutes or
//  milliseconds later, on the AppDelegate, through one of two methods — a
//  token, or a failure. So ask() cannot answer on the line it is called on: it
//  PARKS the call and AppDelegate hands the answer down through `took` and
//  `failed` below. A launch on a phone with no network reaches neither, which
//  is why there is a bound: a promise that never settles is a promise www is
//  still holding when the app closes, and www/store.js has the long version of
//  what that costs (「購入を復元押しても問い合わせ中しか出ないよ」).
//
//  ---- and the tap can arrive before anybody is listening -----------------
//
//  A notification tapped on a phone where Lingua is not running launches the
//  app, and UNUserNotificationCenter delivers the tap at once — before the web
//  view has read a single script, so `window.pushOpened` does not exist yet.
//  So a tap is HELD and handed over when there is something to hand it to:
//  flush() runs on the tap, when the plugin loads, and at the foot of every
//  call www makes, and it is the same one payload either way. Dropping it
//  would be the notification that opened the app being the one that does
//  nothing when you open it.

import Foundation
import Capacitor
import UIKit
import UserNotifications

@objc(LinguaPushPlugin)
public class LinguaPushPlugin: CAPPlugin, CAPBridgedPlugin {
  public let identifier = "LinguaPushPlugin"
  public let jsName = "LinguaPush"
  public let pluginMethods: [CAPPluginMethod] = [
    CAPPluginMethod(name: "ask", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
  ]

  /// The registered instance, so AppDelegate can reach the one that has a
  /// bridge. Weak: the plugin belongs to the bridge and this must not be the
  /// thing that keeps it alive.
  static weak var live: LinguaPushPlugin?

  /// The calls waiting on Apple. Main thread only — every one of the four
  /// places this is touched is a UIKit callback or a plugin method, and both
  /// run there — so there is no lock and no queue of our own.
  private static var waiting: [CAPPluginCall] = []

  /// A tap nobody could be told about yet. One, not a list: two notifications
  /// tapped before the app has drawn a frame is one person opening the app
  /// twice, and the second tap is the one they meant.
  private static var pending: [AnyHashable: Any]?

  override public func load() {
    LinguaPushPlugin.live = self
    /* A tap held from a cold launch, now that there is a bridge. It is very
       likely still too early — the web view has a bridge before it has run
       www/push.js — and that is what makes flush() safe to call from four
       places: it hands over once and clears, or it keeps what it is holding. */
    LinguaPushPlugin.flush()
  }

  // ---- what AppDelegate hands down --------------------------------------

  /// Apple answered with this handset's address.
  ///
  /// Hex, because that is what every server that talks to APNs expects and
  /// `Data` has no description worth sending. `map` over the bytes rather than
  /// `description`, which is `<abcd 1234>` and has been different in three
  /// iOS versions.
  static func took(_ token: Data) {
    let hex = token.map { String(format: "%02x", $0) }.joined()
    answer { $0.resolve(["token": hex]) }
  }

  /// Or it did not. A phone in aeroplane mode, a provisioning profile with no
  /// push capability on it, a simulator before iOS 16 — all of them arrive
  /// here, and all of them mean the same thing to www: there is no address, so
  /// nothing goes up.
  static func failed(_ why: String) {
    answer { $0.reject(why) }
  }

  /// Everybody parked, answered once, and the list emptied before any of them
  /// is called: a reject that re-entered this function would otherwise answer
  /// the same call twice.
  private static func answer(_ how: (CAPPluginCall) -> Void) {
    let parked = waiting
    waiting = []
    for c in parked { how(c) }
  }

  /// A notification was opened. Held until www can be told.
  static func opened(_ info: [AnyHashable: Any]) {
    pending = info
    flush()
  }

  /// Hand the held tap over, if there is one and if there is anything to hand
  /// it to. `window.pushOpened` is the one door — `notifyListeners` is
  /// Capacitor's own event road and this app never loads @capacitor/core, so
  /// nothing in www/ could hear it (docs/keyboard-extension.md § 呼び方, the
  /// four builds that cost).
  static func flush() {
    guard let info = pending, let plugin = live, let bridge = plugin.bridge else { return }
    guard let json = jsonOf(info) else { pending = nil; return }
    pending = nil
    bridge.eval(js: "window.pushOpened && window.pushOpened(" + json + ")")
  }

  /// The payload as JSON, or nothing.
  ///
  /// An APNs payload is somebody else's dictionary and it is pasted into a
  /// line of JavaScript, so two things are done to it and neither is tidiness:
  /// anything JSONSerialization refuses is dropped rather than guessed at, and
  /// U+2028 / U+2029 are escaped — they are valid inside a JSON string and
  /// they end a line in the JavaScript engines this app still runs on, which
  /// is how a payload becomes somebody else's code.
  private static func jsonOf(_ info: [AnyHashable: Any]) -> String? {
    var clean: [String: Any] = [:]
    for (k, v) in info {
      guard let key = k as? String else { continue }
      if JSONSerialization.isValidJSONObject([v]) { clean[key] = v }
    }
    guard let data = try? JSONSerialization.data(withJSONObject: clean),
          let s = String(data: data, encoding: .utf8) else { return nil }
    return s.replacingOccurrences(of: "\u{2028}", with: "\\u2028")
            .replacingOccurrences(of: "\u{2029}", with: "\\u2029")
  }

  // ---- what www asks ------------------------------------------------------

  /// iOS's own question, and then Apple's answer to it.
  ///
  /// **The dialog is iOS's to show once.** requestAuthorization puts it in
  /// front of somebody the first time this app is ever installed and answers
  /// out of its own record every time after, with nothing on the screen. That
  /// is why www/push.js asks on every session arrival and keeps no mark of
  /// its own: a mark would be a copy of an answer iOS holds, and a copy is
  /// wrong the day somebody changes it in Settings.
  @objc func ask(_ call: CAPPluginCall) {
    /* No `keepAlive`. It is for a call that answers MORE THAN ONCE, and it
       makes the bridge save the call for the life of the app; this one
       answers exactly once, and what keeps it alive until then is `waiting`
       below holding it. */
    UNUserNotificationCenter.current()
      .requestAuthorization(options: [.alert, .sound, .badge]) { ok, err in
        DispatchQueue.main.async {
          if let e = err { call.reject("ask: " + e.localizedDescription); return }
          guard ok else { call.reject("denied"); return }
          LinguaPushPlugin.waiting.append(call)
          UIApplication.shared.registerForRemoteNotifications()
          /* AND AN END TO IT, however Apple's side behaves. Neither callback
             arriving leaves www holding a promise for the rest of the launch;
             the same shape and the same answer as LinguaStore.swift §
             syncWithin. A LATE answer is still taken — took() does not look
             at the clock — so this bounds the WAIT and not the token. */
          DispatchQueue.main.asyncAfter(deadline: .now() + 20) {
            guard let i = LinguaPushPlugin.waiting.firstIndex(where: { $0 === call })
            else { return }
            LinguaPushPlugin.waiting.remove(at: i)
            call.reject("apple did not answer")
          }
          LinguaPushPlugin.flush()
        }
      }
  }

  /// Where the permission stands now — `authorized`, `denied`, or
  /// `notDetermined`. Three states and they are not two: 「not asked yet」 and
  /// 「asked and refused」 are what the settings room draws differently, and
  /// CLAUDE.md's first page says they may not share a branch.
  ///
  /// `provisional` and `ephemeral` are read as authorized: this app asks for
  /// neither, so a phone in one of them was put there by something else and
  /// can still be reached, which is the whole of what www does with this.
  @objc func status(_ call: CAPPluginCall) {
    UNUserNotificationCenter.current().getNotificationSettings { s in
      let word: String
      switch s.authorizationStatus {
      case .denied:        word = "denied"
      case .notDetermined: word = "notDetermined"
      default:             word = "authorized"
      }
      DispatchQueue.main.async {
        LinguaPushPlugin.flush()
        call.resolve(["status": word])
      }
    }
  }
}

/// The tap, and it is a delegate rather than the plugin because it has to be
/// standing before the app finishes launching — a notification that LAUNCHED
/// the app is delivered in that first breath, and the plugin does not exist
/// until the bridge is built. AppDelegate owns one of these from its first
/// line; LinguaPushPlugin.opened() holds what arrives until there is a web
/// view to hand it to.
class LinguaPushTaps: NSObject, UNUserNotificationCenterDelegate {
  static let shared = LinguaPushTaps()

  /// Opened. `didReceive` is the tap and nothing else — a notification that
  /// merely arrived does not come through here.
  func userNotificationCenter(_ center: UNUserNotificationCenter,
                              didReceive response: UNNotificationResponse,
                              withCompletionHandler done: @escaping () -> Void) {
    LinguaPushPlugin.opened(response.notification.request.content.userInfo)
    done()
  }

  /// And one that arrives while the app is open and in front of somebody.
  ///
  /// It is SHOWN. An app that swallows its own notifications while it is open
  /// is an app where following somebody and watching for the answer is the one
  /// case that says nothing — and the timeline does not refresh itself, so
  /// there is nothing else on the screen that would have said it either.
  /// No badge: what a badge would count is not decided (docs/CHANGELOG.md
  /// 2026-09-22).
  func userNotificationCenter(_ center: UNUserNotificationCenter,
                              willPresent notification: UNNotification,
                              withCompletionHandler done:
                                @escaping (UNNotificationPresentationOptions) -> Void) {
    if #available(iOS 14.0, *) { done([.banner, .sound]) } else { done([.alert, .sound]) }
  }
}
