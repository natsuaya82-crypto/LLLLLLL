//  LinguaShare.swift
//  The one window onto the App Group, the way www/net.js is the one window
//  onto the server.
//
//  Two programs share this app: the app you draw in, and the keyboard you can
//  put in Messages. They cannot call each other and they do not run at the
//  same time. The only thing between them is a shared folder, and everything
//  in it is put there by www/share.js (chapter 23) — the keys, with each
//  letter's shape already cut onto them, and the font as a file.
//
//  This class does not decide anything. It writes down what it is given.

import Foundation
import Capacitor
import CoreText

@objc(LinguaSharePlugin)
public class LinguaSharePlugin: CAPPlugin, CAPBridgedPlugin {
  public let identifier = "LinguaSharePlugin"
  public let jsName = "LinguaShare"
  public let pluginMethods: [CAPPluginMethod] = [
    CAPPluginMethod(name: "write", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "registerFont", returnType: CAPPluginReturnPromise),
  ]

  /// The one path between the two programs. It is also in App.entitlements and
  /// in the keyboard's — three copies of one string, and Apple owns two of
  /// them, so the profile is what holds them together rather than a constant.
  static let group = "group.com.tokinets.lingua"
  static let jsonName = "keyboard.json"
  static let fontName = "LinguaScript.otf"

  private func container() -> URL? {
    FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: Self.group)
  }

  /// Written whole or not at all, because the keyboard may be reading it: a
  /// half-written layout is a keyboard with no keys on it.
  ///
  /// The protection class matters. The default one makes a file unreadable
  /// while the phone is locked, and a keyboard extension is woken in states
  /// the app never sees — so the letters would simply be gone until somebody
  /// unlocked the phone, which is not a bug anybody would ever reproduce.
  private func put(_ data: Data, _ name: String, _ dir: URL) throws {
    try data.write(to: dir.appendingPathComponent(name),
                   options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
  }

  @objc func write(_ call: CAPPluginCall) {
    guard let dir = container() else {
      call.reject("no container for \(Self.group)")
      return
    }
    let json = call.getString("json") ?? ""
    let font = call.getString("font") ?? ""
    do {
      try put(Data(json.utf8), Self.jsonName, dir)
      // Nothing drawn is no font rather than an empty one, exactly as
      // installScriptFont() decides it — so an absent font leaves whatever
      // was there rather than replacing it with zero bytes.
      if !font.isEmpty, let bytes = Data(base64Encoded: font) {
        try put(bytes, Self.fontName, dir)
      }
      call.resolve()
    } catch {
      call.reject(error.localizedDescription)
    }
  }

  /// Put the language's font into the phone itself, which is the only way
  /// somebody's own letters appear in an app that is not this one — and only
  /// in apps with a font picker. Notes, Mail, Pages. Never LINE or Messages,
  /// which have no way to change a font at all.
  ///
  /// iOS asks the person before it installs anything, so this is never done
  /// on its own: it is a button, and it is theirs to press.
  ///
  /// Unregistered first because the font is rebuilt every time a letter is
  /// drawn. Registering the same URL twice is an error, and the phone would
  /// go on showing the alphabet as it stood the first time.
  @objc func registerFont(_ call: CAPPluginCall) {
    guard let dir = container() else {
      call.reject("no container for \(Self.group)")
      return
    }
    let url = dir.appendingPathComponent(Self.fontName)
    guard FileManager.default.fileExists(atPath: url.path) else {
      call.reject("no font written yet")
      return
    }
    CTFontManagerUnregisterFontURLs([url] as CFArray, .persistent) { _, _ in true }
    CTFontManagerRegisterFontURLs([url] as CFArray, .persistent, true) { errors, done in
      guard done else { return true }
      let bad = (errors as NSArray).compactMap { $0 as? NSError }.filter { e in
        // Already there is not a failure. It is the answer.
        e.code != Int(CTFontManagerError.alreadyRegistered.rawValue)
      }
      DispatchQueue.main.async {
        if let first = bad.first { call.reject(first.localizedDescription) }
        else { call.resolve() }
      }
      return true
    }
  }
}
