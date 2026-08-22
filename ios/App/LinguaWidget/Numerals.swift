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

struct Numerals: Decodable {
  let v: Int
  let box: Double
  let base: Int
  let name: String?
  /// Keyed by value, so a language with no zero has a hole rather than a
  /// shift. Only digits with something to show are in here at all.
  let dg: [String: Face]

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
