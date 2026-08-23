//  GlyphShape.swift
//  One drawn sign, as a SwiftUI Shape.
//
//  This is the same job LinguaKeyboard/GlyphView.swift does and it is not the
//  same file, because WidgetKit is SwiftUI and GlyphView is a UIView that
//  fills a CGContext -- a widget cannot host one. What is shared is the
//  DATA: `st` is the same closed polygons in the same `box` units, cut by the
//  same LinguaFont.glyphContours() in the app. Nothing here recomputes a
//  shape; it scales one.
//
//  The rule copied from GlyphView, and it is the one that matters: a sign on
//  its own is scaled to the SMALLER side and centred, and a sign in a LINE is
//  scaled to the HEIGHT with `dx` saying where its ink starts. A clock face
//  uses both -- a single digit is on its own, "10" is a line of two.

import SwiftUI

struct GlyphShape: Shape {
  let poly: [[[Double]]]
  let box: Double
  /// Where the ink starts inside the advance, in box units, when this is one
  /// letter of a line rather than a sign on its own. Nil is on its own.
  let dx: Double?

  func path(in rect: CGRect) -> Path {
    var p = Path()
    guard box > 0 else { return p }
    let side = (dx != nil) ? rect.height : min(rect.width, rect.height)
    let k = side / box
    let ox = (dx != nil) ? (dx! * k) : (rect.midX - side / 2)
    let oy = rect.midY - side / 2
    for shape in poly {
      let pts = shape.filter { $0.count >= 2 }
        .map { CGPoint(x: ox + $0[0] * k, y: oy + $0[1] * k) }
      guard pts.count >= 3 else { continue }
      p.move(to: pts[0])
      for q in pts.dropFirst() { p.addLine(to: q) }
      p.closeSubpath()
    }
    return p
  }
}

/// What colour a number is written in.
///
/// `.plain` is the ink of whatever it stands in. `.invert` is the ground,
/// for a number knocked out of a filled disc. `.tint` is a colour the caller
/// has a reason for -- a calendar's Sunday.
enum Ink {
  case plain, invert
  case tint(Color)

  var color: Color {
    switch self {
    case .plain: return .primary
    case .invert: return Color(.systemBackground)
    case .tint(let c): return c
    }
  }
}

/// A number written in the language.
///
/// A LINE, and not a row of squares. The rule is the app's and it is already
/// worked out: a letter's width is its own ink plus one step, half a step at
/// each end, so the gap between any two letters is one step whichever two
/// meet. `aw` is that width and `dx` is where the ink starts inside it, both
/// in box units, both from inkAdv() in www/glyph.js -- the one place that
/// knows the rule.
///
/// The first version of this ignored both and put every digit in its own
/// square with a gap between. LinguaKeyboard/GlyphView.swift carries a
/// paragraph warning against exactly that, written after the candidate bar
/// did it: two narrow letters sat a whole cell apart. A "1" beside a "0" in
/// a clock's 10 is that same bug, and a picture is what showed it.
///
/// A sign with no ink -- a borrowed character, or a roman digit standing in
/// for one nobody drew -- has no advance to carry, so it takes a square. It
/// is not one of the person's letters and the line rule is about theirs.
struct NumberView: View {
  let n: Int
  let num: Numerals?
  /// The em: how tall one sign is. The width is the ink's own business.
  let em: CGFloat
  /// Defaulted, because most callers want the ink of where they stand.
  var ink: Ink = .plain

  private var box: Double { num?.box ?? 800 }

  private var values: [Int] {
    guard let num = num else { return decimalPlaces(n) }
    return num.places(n)
  }

  /// One digit's advance in BOX units, so a caller can add them up before
  /// choosing an em.
  /// One sign's advance in BOX units, so a caller can add them up before
  /// choosing an em. For a sign that is not the person's this is an ESTIMATE
  /// -- it is set as text and the type decides -- and an estimate is all the
  /// caller needs: it is choosing a size, not placing anything.
  static func advance(_ f: Face?, box: Double) -> Double {
    if let f = f, let st = f.st, !st.isEmpty, let aw = f.aw, aw > 0 { return aw }
    return box * 0.55
  }

  /// A number is a run of pieces, and consecutive signs that are NOT the
  /// person's are one piece rather than several.
  ///
  /// Laying a roman digit in a cell of its own and centring it is what left
  /// "10" reading as a 1 and a 0: a "1" is narrow, the cell is not, and the
  /// side bearings on both of them add up to a word space. A font does not do
  /// that -- it sets "10" as text, kerned -- so where there is nothing of the
  /// person's to place, this hands the whole run to Text and lets it.
  private enum Piece { case sign(Face), text(String) }

  private var pieces: [Piece] {
    var out: [Piece] = [], run = ""
    for v in values {
      let f = num?.face(v)
      if let f = f, let st = f.st, !st.isEmpty {
        if !run.isEmpty { out.append(.text(run)); run = "" }
        out.append(.sign(f))
      } else if let f = f, let ch = f.ch, !ch.isEmpty {
        run += ch
      } else {
        run += romanDigit(v)
      }
    }
    if !run.isEmpty { out.append(.text(run)) }
    return out
  }

  var body: some View {
    let k = em / CGFloat(box)
    HStack(spacing: 0) {
      ForEach(Array(pieces.enumerated()), id: \.offset) { pair in
        switch pair.element {
        case .sign(let f):
          /* dx is what makes this a line rather than a row of cells: the
             shape is scaled to the HEIGHT and its ink starts dx into its own
             advance. */
          GlyphShape(poly: f.st ?? [], box: box, dx: f.dx ?? 0)
            .fill(ink.color)
            .frame(width: CGFloat(f.aw ?? box) * k, height: em)
        case .text(let s):
          /* No frame: Text takes the width the type wants, which is the whole
             point of handing it the run. */
          Text(s).font(.system(size: em * 0.62, weight: .medium))
            .foregroundStyle(ink.color)
            .frame(height: em)
        }
      }
    }
  }
}

/// The same split as Numerals.places, for when there is no file at all and
/// ten is all there is to count in.
func decimalPlaces(_ v: Int) -> [Int] {
  var left = max(0, v), out: [Int] = []
  if left == 0 { return [0] }
  while left > 0 { out.append(left % 10); left /= 10 }
  return out.reversed()
}

extension Numerals {
  /// How wide a whole number is, in box units, laid out as a line. What a
  /// caller divides the room by to choose an em.
  func width(_ n: Int) -> Double {
    places(n).reduce(0.0) { $0 + NumberView.advance(face($1), box: box) }
  }
}
