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
    CAPPluginMethod(name: "keep", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "kept", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "keepVoice", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "voice", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "dropVoice", returnType: CAPPluginReturnPromise),
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

  // ---- the copy that survives the app ------------------------------------
  //
  // A different folder and a different argument from everything above. The
  // App Group is how two programs of this app talk; Documents is where the
  // person's own work lives. iOS puts Documents in the device backup, and
  // with UIFileSharingEnabled the Files app can show it -- so a language is
  // a thing somebody can hold, copy to iCloud Drive, and mail to themselves.
  //
  // www/backup.js (chapter 24) decides what goes in it. This writes it down.

  static let keepDir = "Languages"

  private func languages() throws -> URL {
    let docs = try FileManager.default.url(for: .documentDirectory, in: .userDomainMask,
                                           appropriateFor: nil, create: true)
    let dir = docs.appendingPathComponent(Self.keepDir, isDirectory: true)
    if !FileManager.default.fileExists(atPath: dir.path) {
      try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    }
    return dir
  }

  /// Written to one side, read back, and only then made the one that counts.
  ///
  /// The order matters and the first version of this had it wrong. It rotated
  /// the generations FIRST and then wrote -- so a write that failed left no
  /// <name>.json at all, and kept() below deliberately ignores the numbered
  /// spares, which means the restore would have answered "there is no file
  /// for this language" while two good ones sat beside it.
  ///
  /// So: the new bytes go to .tmp, .tmp is read back and parsed, and only a
  /// file that survives being read becomes the language. Nothing that exists
  /// is touched until then. `.atomic` alone is not this -- it promises you
  /// never see half a file, not that the whole one means anything.
  ///
  /// Two spares behind it, which is about 50 KB for a free-sized language:
  /// the price of being able to say that a bug in this app cannot take
  /// somebody's months of work.
  @objc func keep(_ call: CAPPluginCall) {
    let name = (call.getString("name") ?? "language")
    let json = call.getString("json") ?? ""
    guard !json.isEmpty else { call.reject("nothing to keep"); return }
    do {
      let dir = try languages()
      let fm = FileManager.default
      let at: (Int) -> URL = { n in
        dir.appendingPathComponent(n == 0 ? "\(name).json" : "\(name).\(n).json")
      }
      let tmp = dir.appendingPathComponent("\(name).tmp")

      try Data(json.utf8).write(to: tmp,
        options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])

      // Read it back off the disk, not out of memory: what is being checked
      // is the file, and a file that cannot be parsed is not a save.
      let back = try Data(contentsOf: tmp)
      guard (try? JSONSerialization.jsonObject(with: back)) != nil else {
        try? fm.removeItem(at: tmp)
        call.reject("what was written could not be read back as JSON; nothing was replaced")
        return
      }

      // Everything that exists is still exactly where it was until here.
      for n in stride(from: 2, to: 0, by: -1) {
        let from = at(n - 1), to = at(n)
        if fm.fileExists(atPath: from.path) {
          if fm.fileExists(atPath: to.path) { try? fm.removeItem(at: to) }
          try? fm.moveItem(at: from, to: to)
        }
      }
      if fm.fileExists(atPath: at(0).path) { try? fm.removeItem(at: at(0)) }
      try fm.moveItem(at: tmp, to: at(0))
      call.resolve()
    } catch {
      call.reject(error.localizedDescription)
    }
  }

  /// Every language on disk, and every generation of it, newest first.
  ///
  ///     [ ["<name>.json", "<name>.1.json", "<name>.2.json"],   one language
  ///       [ ... ] ]                                            another
  ///
  /// The spares used to be withheld, on the argument that a restore which
  /// cannot tell three copies apart should not be asked to choose. That was
  /// wrong in the way that costs everything: when the newest file was
  /// unreadable the restore was handed nothing else and reported that the
  /// language did not exist, while two good copies of it sat in this folder.
  /// Keeping spares that the only thing which reads them cannot see is not
  /// keeping spares.
  ///
  /// It still does not choose. It hands them over in age order and
  /// www/backup.js takes the first that reads back as a language -- which is
  /// not a judgement, it is the absence of one.
  ///
  /// A ".tmp" is never in here: it has the wrong extension, and it is a write
  /// that did not finish rather than a generation.
  @objc func kept(_ call: CAPPluginCall) {
    do {
      let dir = try languages()
      let names = try FileManager.default.contentsOfDirectory(atPath: dir.path)
      // base name -> generation number -> text
      var byLang: [String: [Int: String]] = [:]
      for n in names.sorted() {
        guard n.hasSuffix(".json") else { continue }
        let stem = String(n.dropLast(5))
        var base = stem, gen = 0
        if let dot = stem.lastIndex(of: "."),
           let g = Int(stem[stem.index(after: dot)...]) {
          base = String(stem[stem.startIndex..<dot]); gen = g
        }
        guard let d = try? Data(contentsOf: dir.appendingPathComponent(n)),
              let s = String(data: d, encoding: .utf8) else { continue }
        byLang[base, default: [:]][gen] = s
      }
      let out: [[String]] = byLang.keys.sorted().map { base in
        (byLang[base] ?? [:]).keys.sorted().compactMap { byLang[base]?[$0] }
      }
      call.resolve(["langs": out])
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

  // ---- the voice on a post ------------------------------------------------
  //
  // Documents again, and the same argument as the language backups: thirty
  // seconds of AAC is about 240 KB, which is ten free-sized languages, and
  // localStorage is where the languages live. So a recording is a file and
  // the post carries its name. www/rec.js (chapter 25) is the other half.
  //
  // One of these three deletes, and it deletes exactly one file: the one a
  // post being deleted names. 「投稿消した声も消していいよ」 Nothing walks this
  // folder, nothing removes a file for being unreferenced, and nothing runs
  // on launch — see the DELETE REVIEW in docs/CHANGELOG.md.

  static let voiceDir = "Voices"

  private func voices() throws -> URL {
    let docs = try FileManager.default.url(for: .documentDirectory, in: .userDomainMask,
                                           appropriateFor: nil, create: true)
    let dir = docs.appendingPathComponent(Self.voiceDir, isDirectory: true)
    if !FileManager.default.fileExists(atPath: dir.path) {
      try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    }
    return dir
  }

  /// The name comes from the web side, so that what the post carries and what
  /// is on the disk are one string decided in one place. Anything with a
  /// slash or a dot-dot in it is refused rather than cleaned up: a name this
  /// app did not make is a name this app should not be writing.
  private func voiceAt(_ name: String) throws -> URL? {
    guard !name.isEmpty, !name.contains("/"), !name.contains(".."),
          name.count < 80 else { return nil }
    return try voices().appendingPathComponent(name)
  }

  @objc func keepVoice(_ call: CAPPluginCall) {
    let name = call.getString("name") ?? ""
    let b64 = call.getString("b64") ?? ""
    guard !b64.isEmpty else { call.reject("nothing to keep"); return }
    do {
      guard let url = try voiceAt(name) else { call.reject("bad name"); return }
      guard let bytes = Data(base64Encoded: b64) else { call.reject("not base64"); return }
      // Never over one that is there: a name is made fresh for every
      // recording, so a collision is a bug and the answer to a bug is not to
      // write over somebody's voice.
      guard !FileManager.default.fileExists(atPath: url.path) else {
        call.reject("a voice by that name is already here"); return
      }
      try bytes.write(to: url,
        options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
      call.resolve()
    } catch {
      call.reject(error.localizedDescription)
    }
  }

  /// The one file a deleted post named, and nothing else. It takes a name
  /// rather than looking for anything: this method cannot be asked "which
  /// voices are unused", because that is the question that turns a delete
  /// into a cleanup.
  ///
  /// A file that is already gone is a success, not a failure. Somebody
  /// deleting a post twice, or deleting one whose file never got written,
  /// must not be told that something went wrong — there is nothing left to
  /// do and it is done.
  @objc func dropVoice(_ call: CAPPluginCall) {
    let name = call.getString("name") ?? ""
    do {
      guard let url = try voiceAt(name) else { call.reject("bad name"); return }
      if FileManager.default.fileExists(atPath: url.path) {
        try FileManager.default.removeItem(at: url)
      }
      call.resolve()
    } catch {
      call.reject(error.localizedDescription)
    }
  }

  @objc func voice(_ call: CAPPluginCall) {
    let name = call.getString("name") ?? ""
    do {
      guard let url = try voiceAt(name) else { call.reject("bad name"); return }
      guard let d = try? Data(contentsOf: url) else {
        call.reject("no voice by that name"); return
      }
      call.resolve(["b64": d.base64EncodedString()])
    } catch {
      call.reject(error.localizedDescription)
    }
  }
}
