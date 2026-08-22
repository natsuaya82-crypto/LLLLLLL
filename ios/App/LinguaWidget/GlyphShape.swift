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

/// A number written in the language: one view per digit, left to right.
///
/// Every position answers for itself. A digit with ink is drawn, a digit with
/// a borrowed character is that character, and a digit the person never made
/// is a roman one -- so a language missing its 7 shows one roman 7 in the
/// middle of its own numerals rather than falling back wholesale.
struct NumberView: View {
  let n: Int
  let num: Numerals?
  /// The height one digit gets. Width follows from the ink.
  let em: CGFloat

  private var values: [Int] {
    guard let num = num else { return romanPlaces(n) }
    return num.places(n)
  }

  /// The same split as Numerals.places, for when there is no file at all and
  /// ten is all there is to count in.
  private func romanPlaces(_ v: Int) -> [Int] {
    var left = max(0, v), out: [Int] = []
    if left == 0 { return [0] }
    while left > 0 { out.append(left % 10); left /= 10 }
    return out.reversed()
  }

  var body: some View {
    HStack(spacing: em * 0.06) {
      /* One closure argument and not two. ForEach hands the closure the
         WHOLE element -- here an (offset, element) pair -- and destructuring
         a tuple into two closure parameters stopped being legal in Swift 5. */
      ForEach(Array(values.enumerated()), id: \.offset) { pair in
        digit(pair.element)
      }
    }
  }

  @ViewBuilder
  private func digit(_ v: Int) -> some View {
    if let f = num?.face(v), let st = f.st, !st.isEmpty {
      /* On its own inside its own square, and NOT laid out as a line: the aw
         and dx a line needs are the app's answer for a run of letters set
         solid, and a clock face wants each numeral to sit in the middle of
         its own space. The HStack above is what puts them beside each other. */
      GlyphShape(poly: st, box: num?.box ?? 800, dx: nil)
        .fill(Color.primary)
        .frame(width: em, height: em)
    } else if let f = num?.face(v), let ch = f.ch, !ch.isEmpty {
      Text(ch)
        .font(.system(size: em * 0.62))
        .frame(width: em, height: em)
    } else {
      Text(romanDigit(v))
        .font(.system(size: em * 0.62, weight: .medium))
        .frame(width: em, height: em)
    }
  }
}
