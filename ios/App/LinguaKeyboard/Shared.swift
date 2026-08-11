//  Shared.swift
//  What the keyboard is given, and nothing else.
//
//  This is the reading side. It has never seen the language it is about to
//  draw. It has no alphabet, no letter ids, no lattice, no font writer — the
//  same position www/post.js is in when it renders somebody else's post, and
//  the reason both are shaped this way.
//
//  So there is nothing here to resolve. A key already carries what it types
//  and the shape it wears. This file turns bytes into that and stops.

import Foundation
import CoreGraphics

/// A key face: what pressing it inserts, and what it looks like.
/// Three ways to look like something, tried in this order — the same order
/// ltInk() uses in the app, because it is the same question:
///   `st` the shape somebody drew · `ch` a character they borrowed · `t` itself
struct Face: Decodable {
  let t: String?
  /// Closed convex polygons in the box, each a list of [x, y].
  /// Already the ink: the pen, the spline and the joins are all in it. The
  /// app cut them with LinguaFont.glyphContours before writing this file.
  let st: [[[Double]]]?
  let ch: String?
}

/// One key. `k` says what it does: lt sp del lay next rom.
///
/// `rom` is a plain roman letter on the conversion face. It carries no shape
/// because it is not one of the person's letters -- it is the q of QWERTY,
/// there to spell with, and what it spells is looked up rather than inserted.
struct Key: Decodable {
  let k: String
  let w: Double?
  let to: Int?
  let t: String?
  let st: [[[Double]]]?
  let ch: String?
  let f: [Face?]?

  var width: CGFloat { CGFloat(w ?? 1) }
}

struct Layer: Decodable {
  let rows: [[Key]]
}

struct Board: Decodable {
  let v: Int
  let lang: String?
  let name: String?
  /// The side of the square the shapes are drawn in. x right, y DOWN — a
  /// canvas's space, not a font's, because that is where they were cut.
  let box: Double
  let lay: [Layer]
  /// Every face that a candidate can be made of, once each. Absent when the
  /// writing system needs no conversion and offers no spelling either.
  let ink: [Face]?
  let conv: Conv?
}

enum Shared {
  static let group = "group.com.tokinets.lingua"

  /// Nil for every reason equally: no full access, nothing written yet, a
  /// file from a version that does not exist. The caller has one thing to
  /// say either way, so there is nothing to tell apart.
  static func board() -> Board? {
    guard let dir = FileManager.default
      .containerURL(forSecurityApplicationGroupIdentifier: group) else { return nil }
    guard let data = try? Data(contentsOf: dir.appendingPathComponent("keyboard.json"))
    else { return nil }
    guard let b = try? JSONDecoder().decode(Board.self, from: data) else { return nil }
    return b.lay.isEmpty ? nil : b
  }
}

/// The extension's own two sentences.
///
/// They are a SECOND place for strings, and www/i18n is the first. That is
/// not a mistake to fix later: the first of these is shown when the keyboard
/// cannot read the App Group at all, which is exactly when it cannot read
/// anything the app wrote, translations included. So it has to carry its own.
///
/// Nothing checks these against www/i18n/*.js. tools/i18n-check.mjs reads
/// www/ and this is Swift. Two sentences was judged cheaper than a check
/// that would have to build an iOS target to run — but do not add a third
/// without deciding that again.
enum Say {
  static func full() -> String { pick(fullAccess) }
  static func draw() -> String { pick(nothingYet) }

  private static func pick(_ t: [String: String]) -> String {
    for tag in Locale.preferredLanguages {
      let code = String(tag.prefix(2))
      if let s = t[code] { return s }
    }
    return t["en"]!
  }

  private static let fullAccess = [
    "en": "Settings → General → Keyboard → Keyboards → Lingua → Allow Full Access",
    "ja": "設定 → 一般 → キーボード → キーボード → Lingua → フルアクセスを許可",
    "es": "Ajustes → General → Teclado → Teclados → Lingua → Permitir acceso completo",
    "pt": "Ajustes → Geral → Teclado → Teclados → Lingua → Permitir acesso total",
    "fr": "Réglages → Général → Clavier → Claviers → Lingua → Autoriser l'accès complet",
    "de": "Einstellungen → Allgemein → Tastatur → Tastaturen → Lingua → Vollzugriff erlauben",
    "it": "Impostazioni → Generali → Tastiera → Tastiere → Lingua → Consenti accesso completo",
    "ru": "Настройки → Основные → Клавиатура → Клавиатуры → Lingua → Полный доступ",
    "zh": "设置 → 通用 → 键盘 → 键盘 → Lingua → 允许完全访问",
    "ko": "설정 → 일반 → 키보드 → 키보드 → Lingua → 전체 접근 허용",
  ]

  private static let nothingYet = [
    "en": "Draw some letters in Lingua first.",
    "ja": "先に Lingua で文字を描いてください。",
    "es": "Primero dibuja algunas letras en Lingua.",
    "pt": "Desenhe algumas letras no Lingua primeiro.",
    "fr": "Dessinez d'abord des lettres dans Lingua.",
    "de": "Zeichne zuerst ein paar Buchstaben in Lingua.",
    "it": "Disegna prima qualche lettera in Lingua.",
    "ru": "Сначала нарисуйте буквы в Lingua.",
    "zh": "请先在 Lingua 里画一些文字。",
    "ko": "먼저 Lingua에서 글자를 그려 주세요.",
  ]
}
