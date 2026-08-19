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
  /// Where the ink sits inside the advance, in box units, when this view is
  /// one letter of a LINE rather than one letter on a key. Nil is a key: the
  /// box is square and the ink is centred in it, which is right for a tile
  /// and right for a key and wrong for a line.
  var dx: CGFloat?

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
      // The smaller side, which is the same side a drawn shape is scaled
      // to below -- a drawn letter and an undrawn one are the same weight on
      // the same row because both are measured from the same edge.
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

    // Two rules, and which one this is depends on what it was given.
    //
    // A KEY is a square cell with the letter centred in it -- the same square
    // www/glyph.js's inkCanvases uses for a tile and a key.
    //
    // A LINE is not. There a letter's width is its own ink plus one step,
    // half a step at each end, so the gap between any two letters is one step
    // whichever two meet -- and `dx` is where the ink starts inside that. It
    // comes from the app's inkAdv(), the one place that knows the rule, so
    // this file does no arithmetic and cannot drift from it. Without it the
    // bar drew every letter in a square and two narrow ones sat a whole cell
    // apart. 「キーボード内のプレビューのアルファベットいちいち全角のスペース開く
    // のうざい」
    // A key is scaled to the SMALLER side, and that is the whole of the
    // difference between a letter on a key and a letter spilling over three.
    //
    // It was scaled to the height and then centred on a square of the width,
    // which are two different numbers on every phone made: a key is about 35
    // points across and 54 tall, so a shape was drawn 54 wide inside a 20
    // wide box -- seventeen points over each edge, into its neighbours, and
    // off the end of the row at both ends. 「文字がずれてる」
    //
    // A LINE is the other rule and is unchanged: there the height IS the em
    // and the width is the letter's own advance, so the height is what the
    // shape is scaled to and `dx` says where the ink starts inside it.
    let side = (dx != nil) ? bounds.height : min(bounds.width, bounds.height)
    let k = side / box
    let ox: CGFloat
    if let d = dx { ox = CGFloat(d) * k }
    else { ox = bounds.midX - side / 2 }
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
