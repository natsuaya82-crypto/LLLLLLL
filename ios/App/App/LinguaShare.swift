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
import UIKit
import PhotosUI
import AVFoundation

@objc(LinguaSharePlugin)
public class LinguaSharePlugin: CAPPlugin, CAPBridgedPlugin {
  public let identifier = "LinguaSharePlugin"
  public let jsName = "LinguaShare"
  public let pluginMethods: [CAPPluginMethod] = [
    CAPPluginMethod(name: "write", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "registerFont", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "keep", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "kept", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "dropKept", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "dropAll", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "keepVoice", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "voice", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "dropVoice", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "pickPhoto", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "audio", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "settings", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "sheet", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "renderPdf", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "markup", returnType: CAPPluginReturnPromise),
  ]

  /// The one path between the two programs. It is also in App.entitlements and
  /// in the keyboard's — three copies of one string, and Apple owns two of
  /// them, so the profile is what holds them together rather than a constant.
  static let group = "group.com.tokinets.lingua"
  static let jsonName = "keyboard.json"
  static let fontName = "LinguaScript.otf"
  /// The widgets' own file. Ten shapes and a base, and none of the keyboard:
  /// a clock has no layout, no conversion table and no candidate bar, and a
  /// keyboard has no idea what a 3 is worth. www/share.js § shareWidget().
  static let numName = "widget.json"

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
    let num = call.getString("num") ?? ""
    do {
      try put(Data(json.utf8), Self.jsonName, dir)
      /* Absent leaves what is there, the way the font does: an app built
         before the widgets existed sends nothing, and a widget already on
         somebody's home screen goes on showing the digits it has rather
         than emptying itself. */
      if !num.isEmpty {
        try put(Data(num.utf8), Self.numName, dir)
        /* And tell WidgetKit, or nobody does. WidgetPoke.swift holds that
           call and says why it is not in this file: `import WidgetKit` here
           takes PHPickerViewController out of scope, which is how #84 failed
           on a picker that had compiled green since a82a633. */
        WidgetPoke.reload()
      }
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
  // Every backup file, gone. The one call in this plugin that destroys
  // somebody's work, and it exists because "erase everything" has to be true:
  // the copies in Documents are the thing that survives the app being
  // deleted, so leaving them would make the sentence on the button a lie.
  //
  // Only ours, and only .json under the languages directory -- Documents is
  // the person's own folder and the Files app puts other things in it.
  @objc func dropKept(_ call: CAPPluginCall) {
    do {
      let dir = try languages()
      let names = try FileManager.default.contentsOfDirectory(atPath: dir.path)
      var gone = 0
      for n in names where n.hasSuffix(".json") {
        try? FileManager.default.removeItem(at: dir.appendingPathComponent(n))
        gone += 1
      }
      call.resolve(["gone": gone])
    } catch {
      // Nothing there to remove is not a failure: it is a phone that has
      // never written one.
      call.resolve(["gone": 0])
    }
  }

  /// Everything this app has written into Documents, in all three of its
  /// folders. 「アカウント削除で残るものねえって言ってんだろ何回言わせんだよ
  /// 全部消えんだよ。」OWNER 2026-08-27 -- and Documents is visible in the Files
  /// app, so a language file still sitting there after somebody deleted their
  /// account is the sentence being untrue where they can see it.
  ///
  /// `dropKept` above is the backups alone and stays what it is; this is the
  /// account going. The recordings had only `dropVoice(name)`, one at a time
  /// and by a name that is in localStorage -- which is emptied in the same
  /// breath -- and the sheets had no way to be removed at all.
  ///
  /// Only OUR three directories, and only their contents. Documents itself is
  /// the person's folder and may hold things they put there; the same
  /// argument `dropKept` makes about staying inside Languages/.
  @objc func dropAll(_ call: CAPPluginCall) {
    var gone = 0
    for dir in [try? languages(), try? voices(), try? sheets()] {
      guard let dir = dir else { continue }
      guard let names = try? FileManager.default.contentsOfDirectory(atPath: dir.path)
      else { continue }
      for n in names {
        try? FileManager.default.removeItem(at: dir.appendingPathComponent(n))
        gone += 1
      }
    }
    // Nothing there to remove is not a failure: it is a phone that never
    // wrote one. Same answer dropKept gives.
    call.resolve(["gone": gone])
  }

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

  // ---- the paper -------------------------------------------------------
  //
  // www/sheet.js (chapter 26) builds the PDF bytes; this writes them down.
  // Documents again, and for the same reason keep() is there: the App Group
  // is how two programs of this app talk, and Documents is where the
  // person's own work lives -- iOS puts it in the device backup and, with
  // UIFileSharingEnabled, the Files app can show it. A sheet is paper: it is
  // a thing somebody prints, writes on, and hands back.
  //
  // The one difference from keep(). A sheet is not filed against a language
  // and every write would carry the same name, so this NEVER OVERWRITES: a
  // sheet already sitting in Documents may have been written on -- opened in
  // Files, marked up with a pencil, saved in place -- and that is somebody's
  // own work. `<name> 2.pdf` and on. Nothing here removes anything.

  static let sheetDir = "Sheets"

  private func sheets() throws -> URL {
    let docs = try FileManager.default.url(for: .documentDirectory, in: .userDomainMask,
                                           appropriateFor: nil, create: true)
    let dir = docs.appendingPathComponent(Self.sheetDir, isDirectory: true)
    if !FileManager.default.fileExists(atPath: dir.path) {
      try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    }
    return dir
  }

  @objc func sheet(_ call: CAPPluginCall) {
    let name = (call.getString("name") ?? "sheet")
    let b64 = call.getString("b64") ?? ""
    guard let bytes = Data(base64Encoded: b64), !bytes.isEmpty else {
      call.reject("nothing to write")
      return
    }
    do {
      let dir = try sheets()
      let fm = FileManager.default
      var url = dir.appendingPathComponent("\(name).pdf")
      var n = 2
      while fm.fileExists(atPath: url.path) {
        url = dir.appendingPathComponent("\(name) \(n).pdf")
        n += 1
        if n > 999 { call.reject("too many sheets of that name"); return }
      }
      try bytes.write(to: url,
                      options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
      call.resolve(["file": url.lastPathComponent])
    } catch {
      call.reject(error.localizedDescription)
    }
  }

  /// The editor has to outlive the call that made it, exactly as the photo
  /// picker's delegate does and for the same reason.
  private var marking: LinguaMarkup?

  /// Write on a sheet without leaving this app.
  /// OWNER 2026-08-27「そのままdlした端末上で書くとか？じゃないと無理じゃね」
  ///
  /// It opens a sheet THIS APP WROTE, by name, out of Documents/Sheets -- not
  /// a path and not bytes handed over from the web side. A name with a slash
  /// in it is refused: `Documents` is the person's own folder and the Files
  /// app puts other things in it, which is dropKept()'s sentence and the same
  /// care.
  ///
  /// Cancelled comes back as `wrote: false` and NOTHING ELSE happens. The
  /// file is answered either way because the web side has no other copy of it,
  /// and a call that is never answered is a button that never comes back.
  @objc func markup(_ call: CAPPluginCall) {
    let name = call.getString("file") ?? ""
    guard !name.isEmpty, !name.contains("/"), name != ".", name != ".." else {
      call.reject("no sheet of that name")
      return
    }
    DispatchQueue.main.async {
      guard let host = self.bridge?.viewController else {
        call.reject("no view controller")
        return
      }
      do {
        let url = try self.sheets().appendingPathComponent(name)
        guard FileManager.default.fileExists(atPath: url.path) else {
          call.reject("that sheet is not here any more")
          return
        }
        self.marking = LinguaMarkup.open(url, from: host) { [weak self] wrote in
          self?.marking = nil
          // Nothing was written, so there is nothing to hand over. A sheet
          // somebody has drawn on is megabytes, and reading it back to say
          // "never mind" is the whole file across the bridge for nothing.
          guard wrote else {
            call.resolve(["wrote": false])
            return
          }
          guard let bytes = try? Data(contentsOf: url), !bytes.isEmpty else {
            call.reject("the sheet could not be read back")
            return
          }
          call.resolve(["wrote": true, "b64": bytes.base64EncodedString()])
        }
      } catch {
        call.reject(error.localizedDescription)
      }
    }
  }

  /// A page of a PDF, as a picture.
  ///
  /// www/sheet.js reads a scanned sheet without a renderer, because a scanner
  /// stores its page as a JPEG byte for byte (/DCTDecode) and the bytes come
  /// straight out. What it cannot do is a page whose ink was DRAWN -- somebody
  /// who wrote on the sheet with a pencil on a screen rather than with a pen
  /// on paper -- or one whose picture is behind a filter that file cannot
  /// undo. Both need a renderer. The phone has one.
  /// OWNER 2026-08-27「pdfkitのレンダラやろう」
  ///
  /// The drawing itself is LinguaPdf.swift, and it is a file of its own for
  /// the reason written at the top of it: an import in THIS file is how build
  /// #84 failed, and what somebody wrote on the sheet only comes back if the
  /// page is drawn by PDFKit.
  @objc func renderPdf(_ call: CAPPluginCall) {
    let b64 = call.getString("b64") ?? ""
    let edge = CGFloat(call.getDouble("edge") ?? 2200)
    guard let data = Data(base64Encoded: b64), !data.isEmpty else {
      call.reject("nothing to draw")
      return
    }
    guard let im = LinguaPdf.page(data, edge) else {
      call.reject("this is not a PDF page the phone can open")
      return
    }
    // The one place a UIImage becomes bytes for the web view. It is already at
    // `edge`, so this scales by 1 -- it is here to be the only answer to "how
    // is a picture handed over", not to resize anything.
    //
    // `PhotoPicker.jpeg` and not `Self.jpeg`: it is a static method on
    // PhotoPicker further down this file, not on the plugin, and `Self` here
    // is the plugin. Build 94 died on that one word -- `type 'Self' has no
    // member 'jpeg'` -- and nothing on this side could have caught it: Swift
    // does not compile on Linux, and assets-check only asks whether a file is
    // in the Sources phase. The line five hundred below already calls it the
    // right way.
    guard let out = PhotoPicker.jpeg(im, edge) else {
      call.reject("the page could not be drawn")
      return
    }
    call.resolve(["jpeg": out])
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

  // ---- the person's own photographs --------------------------------------
  //
  // A web file field cannot be a photo library. On iOS an
  // `<input type="file" accept="image/*">` opens Apple's own action sheet —
  // Photo Library, Take Photo or Video, Choose File — so the button that said
  // LIBRARY opened the camera and the Files app as well. Three doors behind
  // one word. 「ライブラリーボタンなのにファイルとかカメラ開く」
  //
  // PHPickerViewController is the library and nothing else. It runs outside
  // this app's process, which is why it needs no permission of its own: the
  // app is handed the one photograph that was chosen and never sees the rest.
  //
  // The scaling happens here and the number comes from the WEB side, because
  // www/post.js owns how big a photograph on a post is (POST_PIC) and a second
  // number in Swift would be a second place deciding it. Handing over full
  // resolution is about 5 MB of base64 for one 12-megapixel photograph, across
  // a bridge that is a string.

  private var picking: PhotoPicker?

  /// Settings, opened at this app's own page.
  ///
  /// 「そのiPhoneに入れられますって設定じゃ無くてボタン押したら追加する画面まで
  /// 進められないの？」 Half of it, and the half that is possible is the half
  /// that matters. `openSettingsURLString` is Apple's one public door and it
  /// lands on Settings → Lingua, which is where **Full Access** is granted —
  /// the switch without which the keyboard cannot read a single letter
  /// somebody drew.
  ///
  /// What it cannot do is ADD the keyboard. Settings → General → Keyboard →
  /// Keyboards → Add New Keyboard has no public URL; the `App-prefs:` scheme
  /// that reaches it is private API and an app that ships it is rejected. So
  /// that one step stays a sentence on the screen, and it is one sentence
  /// rather than the two-step list it used to be.
  @objc func settings(_ call: CAPPluginCall) {
    guard let url = URL(string: UIApplication.openSettingsURLString) else {
      call.reject("no settings url"); return
    }
    DispatchQueue.main.async {
      UIApplication.shared.open(url, options: [:]) { ok in
        if ok { call.resolve() } else { call.reject("settings would not open") }
      }
    }
  }

  /// What this app's audio IS, said again around a recording.
  ///
  /// 「音楽はいつのタイミングでもとめないでほしい」 The session is `.playback`
  /// with `.mixWithOthers` from launch and never activated by hand, so nothing
  /// this app plays takes anybody's music away. A microphone is the one thing
  /// that needs a different category — `.playAndRecord` — and switching to it
  /// is exactly where the music would go, so the mixing option is carried
  /// across rather than dropped, and `.defaultToSpeaker` is there because
  /// `.playAndRecord` otherwise sends everything to the earpiece.
  ///
  /// www/rec.js says `record` before it opens the microphone and `play` when
  /// the recorder stops. Nothing is ever made active here: iOS does that on
  /// its own the moment something plays, and doing it by hand is what stopped
  /// somebody's music by opening the app.
  @objc func audio(_ call: CAPPluginCall) {
    let mode = call.getString("mode") ?? "play"
    let session = AVAudioSession.sharedInstance()
    do {
      if mode == "record" {
        try session.setCategory(.playAndRecord, mode: .default,
                                options: [.mixWithOthers, .defaultToSpeaker, .allowBluetooth])
      } else {
        try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
      }
      call.resolve()
    } catch {
      call.reject(error.localizedDescription)
    }
  }

  @objc func pickPhoto(_ call: CAPPluginCall) {
    let edge = CGFloat(call.getInt("max") ?? 1200)
    // How many more the post has room for. A post holds four photographs and
    // this asked for one, every time, so choosing four meant opening the
    // picker four times -- and the picker itself would not let you select a
    // second. The web side knows how many are already on the post, so it is
    // the one that says.
    let limit = max(1, min(call.getInt("limit") ?? 1, 10))
    DispatchQueue.main.async {
      guard let host = self.bridge?.viewController else {
        call.reject("no view controller"); return
      }
      var cfg = PHPickerConfiguration()
      cfg.filter = .images
      cfg.selectionLimit = limit
      let vc = PHPickerViewController(configuration: cfg)
      // Cancelled is an empty answer, not a rejection: somebody changing their
      // mind is not an error and must not put a message on their screen.
      let p = PhotoPicker(edge: edge) { [weak self] b64s in
        self?.picking = nil
        // `b64` stays, and is the first of them: a phone running an older web
        // side asks for one and reads one field.
        call.resolve(["b64": b64s.first ?? "", "b64s": b64s])
      }
      self.picking = p
      vc.delegate = p
      host.present(vc, animated: true)
    }
  }
}

/// The delegate has to outlive the call that made it, so the plugin holds it.
/// It answers exactly once — cancelled, failed and chosen all land in the same
/// place, and a call that is never answered is a button that never comes back.
final class PhotoPicker: NSObject, PHPickerViewControllerDelegate {
  private let edge: CGFloat
  private let done: ([String]) -> Void
  private var answered = false

  init(edge: CGFloat, done: @escaping ([String]) -> Void) {
    self.edge = edge
    self.done = done
  }

  private func answer(_ s: [String]) {
    guard !answered else { return }
    answered = true
    DispatchQueue.main.async { self.done(s) }
  }

  /// Every one that was chosen, in the order they were chosen. They load
  /// concurrently and out of order, so each lands in the slot it was picked
  /// for and the answer waits for all of them -- one call, one answer, still.
  /// One that will not load is dropped rather than left as a hole: a post
  /// with three of the four is a post, and a blank in the strip is not.
  func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
    picker.dismiss(animated: true)
    guard !results.isEmpty else { answer([]); return }
    var slots = [String?](repeating: nil, count: results.count)
    let group = DispatchGroup()
    let lock = NSLock()
    for (i, r) in results.enumerated() {
      let item = r.itemProvider
      guard item.canLoadObject(ofClass: UIImage.self) else { continue }
      group.enter()
      item.loadObject(ofClass: UIImage.self) { [weak self] obj, _ in
        defer { group.leave() }
        guard let self = self, let im = obj as? UIImage,
              let s = PhotoPicker.jpeg(im, self.edge) else { return }
        lock.lock(); slots[i] = s; lock.unlock()
      }
    }
    group.notify(queue: .global()) { [weak self] in
      self?.answer(slots.compactMap { $0 })
    }
  }

  /// Down to the long edge the web side asked for, and never up: a small
  /// photograph is left as it is rather than blown up to fill a number.
  static func jpeg(_ im: UIImage, _ edge: CGFloat) -> String? {
    let w = im.size.width, h = im.size.height
    guard w > 0, h > 0 else { return nil }
    let k = min(1, edge / max(w, h))
    let size = CGSize(width: (w * k).rounded(), height: (h * k).rounded())
    let out = UIGraphicsImageRenderer(size: size).image { _ in
      im.draw(in: CGRect(origin: .zero, size: size))
    }
    return out.jpegData(compressionQuality: 0.9)?.base64EncodedString()
  }
}
