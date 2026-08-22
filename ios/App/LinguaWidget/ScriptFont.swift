//  ScriptFont.swift
//  The font somebody's letters were built into, made available to a widget.
//
//  The app writes LinguaScript.otf into the App Group whenever the letters
//  change (LinguaShare.swift § write). A widget cannot install a font the way
//  an app bundle does — there is no Info.plist entry for a file that did not
//  exist at build time — so it registers it at run time, into this process
//  only, and then asks for it by family name like any other font.
//
//  Once per process, and quietly. Failing here costs a look and not a blank:
//  the word is set in the system face instead, and it is the same string
//  either way — LinguaScript maps the ROMAN characters, so setting somebody's
//  spelling in it is what draws their letters.

import CoreText
import SwiftUI

enum ScriptFont {
  static let family = "LinguaScript"
  private static var tried = false
  private static var have = false

  /// True when the family can be asked for. Registering twice is an error
  /// CoreText reports and not a problem, but a widget is woken often enough
  /// that it is worth not asking twice.
  @discardableResult
  static func ready() -> Bool {
    if tried { return have }
    tried = true
    guard let dir = FileManager.default
      .containerURL(forSecurityApplicationGroupIdentifier: Numerals.group) else { return false }
    let url = dir.appendingPathComponent("LinguaScript.otf")
    guard FileManager.default.fileExists(atPath: url.path) else { return false }
    have = CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
    return have
  }

  /// The person's letters at this size, or nil when there is no font to use.
  static func at(_ size: CGFloat) -> Font? {
    ready() ? Font.custom(family, size: size) : nil
  }
}

/// A word a person made: their own letters when the font is there and every
/// letter of the word has a shape, the roman spelling otherwise.
struct WordView: View {
  let word: Named
  let size: CGFloat

  var body: some View {
    if word.all, let f = ScriptFont.at(size) {
      Text(word.r).font(f)
    } else {
      Text(word.r).font(.system(size: size * 0.86, weight: .medium))
    }
  }
}
