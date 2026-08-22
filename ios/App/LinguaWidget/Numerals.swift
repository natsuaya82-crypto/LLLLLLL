//  Numerals.swift
//  The digits somebody drew, and how to write a number with them.
//
//  Read from one file in the App Group -- widget.json, written by
//  www/share.js § shareWidget() -- and never asked of the app. A widget is
//  woken by iOS at times the app knows nothing about, so anything it cannot
//  read off a disk it does not have.
//
//  The base is the language's and runs 2 to 20 (www/numbers.js: NUM_BASES).
//  Ten is not special anywhere in this file: a language counting in twelve
//  writes the hour 12 as "10", and one counting in two writes it as "1100".

import Foundation

/// One drawn sign, in the shape www/share.js § shareFace() sends.
struct Face: Decodable {
  /// Closed polygons in `box` units, x right and y DOWN -- a canvas's space,
  /// because that is where they were cut. Absent for a sign that is a
  /// borrowed character rather than a drawing.
  let st: [[[Double]]]?
  /// The character this letter borrows, when nothing was drawn.
  let ch: String?
  /// What it takes up standing beside the next one, and where the ink starts
  /// inside that. Worked out by the app's inkAdv(), which is the one place
  /// that knows the rule; doing the arithmetic again here would be a second
  /// copy of it that drifts the first time the pen changes.
  let aw: Double?
  let dx: Double?
}

/// A word somebody made for a month or a day of the week.
struct Named: Decodable {
  /// The private use area, which is what the font in the App Group maps.
  /// Absent when a letter of the word has no shape: one hole in a run reads
  /// worse than not trying, so www/share.js sends nothing rather than a
  /// word with a gap in it.
  let t: String?
  /// The roman spelling, always. What a widget shows before the font is
  /// there, and what it shows for a language written in borrowed characters.
  let r: String
}

struct Numerals: Decodable {
  let v: Int
  let box: Double
  let base: Int
  let name: String?
  /// Keyed by value, so a language with no zero has a hole rather than a
  /// shift. Only digits with something to show are in here at all.
  let dg: [String: Face]
  /// How the year and the week are divided. Absent in a file written before
  /// the calendar existed, and absent is twelve and seven -- the same
  /// defaults www/cal.js has, said in the same two numbers.
  let mo: Int?
  let wk: Int?
  /// The names, keyed by which month and which day, counting from one. A
  /// month nobody has made a word for is simply not here.
  let mon: [String: Named]?
  let wd: [String: Named]?

  var months: Int { let n = mo ?? 12; return (n >= 2 && n <= 24) ? n : 12 }
  var week: Int { let n = wk ?? 7; return (n >= 2 && n <= 14) ? n : 7 }

  /// Which part of the year a date falls in, counting from one.
  ///
  /// The year cut into equal parts, and the last part takes whatever is left:
  /// there is no leap rule to be wrong about because a 366th day falls in the
  /// last month, there being nowhere else for it to be. www/cal.js says why
  /// there is no calendar arithmetic of anybody's own beyond this.
  func monthOf(_ d: Date) -> Int {
    let cal = Calendar.current
    let day = (cal.ordinality(of: .day, in: .year, for: d) ?? 1) - 1
    let m = day * months / 365 + 1
    return min(max(m, 1), months)
  }
  /// Which day of the week, counting from one. Days since 1970-01-01 taken
  /// modulo the week, so a five-day week runs on through the years without a
  /// seam at new year.
  func dayOf(_ d: Date) -> Int {
    let cal = Calendar.current
    let c = cal.dateComponents([.year, .month, .day], from: d)
    var g = DateComponents()
    g.year = c.year; g.month = c.month; g.day = c.day
    guard let midnight = cal.date(from: g) else { return 1 }
    let days = Int(floor(midnight.timeIntervalSince1970 / 86400))
    return ((days % week) + week) % week + 1
  }

  static let group = "group.com.tokinets.lingua"
  static let file = "widget.json"

  /// Nil for every reason equally: no container, nothing written yet, a file
  /// from a version that does not exist. Every caller has one thing to draw
  /// either way -- roman numbers -- so there is nothing to tell apart.
  static func read() -> Numerals? {
    guard let dir = FileManager.default
      .containerURL(forSecurityApplicationGroupIdentifier: group) else { return nil }
    guard let data = try? Data(contentsOf: dir.appendingPathComponent(file)),
          let n = try? JSONDecoder().decode(Numerals.self, from: data) else { return nil }
    return (n.base >= 2 && n.base <= 20) ? n : nil
  }

  /// The values of a number's digits, most significant first.
  /// Zero is one digit, not none.
  func places(_ n: Int) -> [Int] {
    var left = max(0, n), out: [Int] = []
    if left == 0 { return [0] }
    while left > 0 { out.append(left % base); left /= base }
    return out.reversed()
  }

  /// The sign for one digit's value, or nil to fall back to a roman one.
  func face(_ value: Int) -> Face? { dg[String(value)] }
}

/// A roman digit for a value, for the positions where the person has drawn
/// nothing. 0-9 then a-j, which is how a base above ten is written down
/// everywhere else and is at least not a wrong number.
func romanDigit(_ value: Int) -> String {
  String(value, radix: 36)
}
