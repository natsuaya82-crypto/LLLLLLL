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
  /// What this letter takes up standing beside the next one, and where its
  /// ink sits inside that -- both in box units, both worked out by the app's
  /// inkAdv(), which is the one place that knows the rule.
  ///
  /// A KEY is a square cell and is drawn as one. A LINE is not: a letter's
  /// width is its own ink plus one step, half a step at each end, so the gap
  /// between any two letters is one step whichever two meet. The candidate
  /// bar is a line and was drawing squares, which put two narrow letters a
  /// whole cell apart.
  ///
  /// `aw` and not `w`, because a Key already has a `w` and it is a different
  /// width -- how wide the key is in its row. The key and the face it wears
  /// are one object in the file.
  ///
  /// Absent on a face from a build before this, and on one with no shape.
  let aw: Double?
  let dx: Double?
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
  /// The face's own two numbers, carried on the key as well because pressing
  /// a key makes a Face out of it and that face goes on the bar, which is a
  /// line. Without them the run somebody is typing -- which is the whole of
  /// what an alphabet's bar shows -- would be the one thing still laid out in
  /// squares.
  let aw: Double?
  let dx: Double?

  var width: CGFloat { CGFloat(w ?? 1) }
  var face: Face { Face(t: t, st: st, ch: ch, aw: aw, dx: dx) }
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
  /// Whether a key wears, small in its corner, the letter it types. The
  /// person's switch, in the keyboard chapter of the app. Absent on a board
  /// written before the switch existed, and absent means ON -- the mark is
  /// there for somebody who has not learnt the layout, and somebody upgrading
  /// from a build that never had it has not been asked.
  let mark: Int?
  /// Was how tall the keys are, as a multiplier. Nothing sends it and nothing
  /// reads it: a row is one height and the total is capped against the screen
  /// (KeyboardViewController.place). It stays decodable because a file written
  /// before this still carries it, and a Board that refused to decode is a
  /// keyboard that does not appear at all.
  let h: Double?
  let lay: [Layer]
  /// Every face that a candidate can be made of, once each. Absent when the
  /// writing system needs no conversion and offers no spelling either.
  let ink: [Face]?
  let conv: Conv?
  /// Which face is the roman one you spell on. Absent when there is none,
  /// which is every writing system that needs no conversion.
  ///
  /// It has to be said rather than worked out. `how` says what the writing
  /// system is and a writing system does not type -- a face does, and a
  /// syllabary's board carries the person's own letters AND a roman face.
  /// shareKbd() puts it last and is the only thing that knows where that is.
  let rom: Int?
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
