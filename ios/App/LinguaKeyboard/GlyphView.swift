//  GlyphView.swift
//  One letter, on one key.
//
//  This was going to be a port of www/otf5.js — bar(), hull(), nib(), the
//  b-spline, the round-corner pass — because the plan was to send the strokes
//  and rebuild the ink here. It is not, and that is the whole reason the
//  format changed: the same rule written twice in two languages comes apart
//  the first time somebody touches the pen, and no check on either side can
//  see it happen.
//
//  So what arrives is the ink. This file fills polygons.

import UIKit

final class GlyphView: UIView {
  /// Closed convex polygons in `box` units, or nil for a face that is text.
  var poly: [[[Double]]]?
  /// What to draw when there is no shape: a borrowed character, or the
  /// letter's own name.
  var text: String?
  var box: CGFloat = 800

  override init(frame: CGRect) {
    super.init(frame: frame)
    isOpaque = false
    backgroundColor = .clear
    isUserInteractionEnabled = false
    contentMode = .redraw
  }
  required init?(coder: NSCoder) { fatalError("not from a nib") }

  override func draw(_ rect: CGRect) {
    guard let ctx = UIGraphicsGetCurrentContext() else { return }
    let ink = UIColor.label

    guard let polys = poly, !polys.isEmpty else {
      guard let s = text, !s.isEmpty else { return }
      // A borrowed character or a name. Sized off the box the shapes would
      // have filled, so a drawn letter and an undrawn one are the same
      // weight on the same row.
      let side = min(bounds.width, bounds.height)
      let attrs: [NSAttributedString.Key: Any] = [
        .font: UIFont.systemFont(ofSize: side * 0.62),
        .foregroundColor: ink,
      ]
      let size = (s as NSString).size(withAttributes: attrs)
      (s as NSString).draw(
        at: CGPoint(x: bounds.midX - size.width / 2, y: bounds.midY - size.height / 2),
        withAttributes: attrs)
      return
    }

    // The box is square and so is the space a letter stands in on a key --
    // the same square www/glyph.js's inkCanvases uses for a tile and a key.
    // A LINE of letters is the other rule and is not this file's business.
    let side = min(bounds.width, bounds.height)
    let k = side / box
    let ox = bounds.midX - side / 2
    let oy = bounds.midY - side / 2

    ctx.setFillColor(ink.cgColor)
    for p in polys {
      let pts = p.filter { $0.count >= 2 }.map {
        CGPoint(x: ox + CGFloat($0[0]) * k, y: oy + CGFloat($0[1]) * k)
      }
      guard pts.count >= 3 else { continue }
      ctx.beginPath()
      ctx.move(to: pts[0])
      for q in pts.dropFirst() { ctx.addLine(to: q) }
      ctx.closePath()
      ctx.fillPath()
    }
  }
}
