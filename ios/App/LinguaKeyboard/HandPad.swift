//  HandPad.swift
//  The handwriting face: somewhere to write, and which letter was written.
//
//  OWNER 2026-09-25「後手書き追加しよう」. A face of the keyboard marked
//  `hand` (www/keyboard.js, kbAddLay('hand')) is drawn as this pad above that
//  face's own rows. A finger writes; when it stops, the strokes go to hand.js
//  and the language's drawn letters nearest to them are offered on the bar
//  above the keys, nearest first. The one pressed goes in through the same
//  door a key press goes through (KeyboardViewController.typed).
//  「候補は何個か出して選ぶ形」 OWNER 2026-09-25.
//
//  Which letter is nearest is NOT worked out here. It is hand.js, which is
//  bundled with this extension and run in JavaScriptCore, and which
//  tools/hand-check.mjs runs in Node -- one measure, counted where it can be
//  counted. A second copy of it in Swift would be two answers to one question
//  and nothing able to see them come apart.
//
//  DEVICE UNCONFIRMED. There is no Swift on a Linux runner.

import UIKit
import JavaScriptCore

/// hand.js, loaded once per keyboard and handed the letters once.
final class Hand {
  private let ctx: JSContext
  private let prep: JSValue
  private let near: JSValue

  /// `inks` is every drawn letter's ink in the order of Board.hand, nil where a
  /// face carries no shape. Nil back when the file is missing or will not run --
  /// the pad then writes and nothing goes in, which is the keyboard not
  /// knowing, rather than the keyboard guessing.
  init?(inks: [[[[Double]]]?]) {
    guard let url = Bundle(for: Hand.self).url(forResource: "hand", withExtension: "js"),
          let src = try? String(contentsOf: url, encoding: .utf8),
          let c = JSContext() else { return nil }
    c.evaluateScript(src)
    guard let p = c.objectForKeyedSubscript("handPrep"), !p.isUndefined,
          let n = c.objectForKeyedSubscript("handRank"), !n.isUndefined else { return nil }
    let arg: [Any] = inks.map { $0.map { $0 as Any } ?? NSNull() }
    guard let pr = p.call(withArguments: [arg]), !pr.isUndefined else { return nil }
    ctx = c; prep = pr; near = n
  }

  /// The letters the strokes are nearest to, nearest first, as indexes into
  /// Board.hand -- as many as hand.js offers (HAND_PICKS). Empty for none.
  func nearest(_ strokes: [[CGPoint]]) -> [Int] {
    let s: [[[Double]]] = strokes.map { $0.map { [Double($0.x), Double($0.y)] } }
    guard let r = near.call(withArguments: [prep, s]), let a = r.toArray() else { return [] }
    return a.compactMap { ($0 as? NSNumber)?.intValue }
  }
}

protocol HandPadDelegate: AnyObject {
  func pad(_ p: HandPad, wrote strokes: [[CGPoint]])
}

/// Where the finger writes. The line follows the finger and is gone the moment
/// the letter goes in.
final class HandPad: UIView {
  weak var delegate: HandPadDelegate?
  private var strokes: [[CGPoint]] = []
  private let line = CAShapeLayer()
  /// Where to write: a square in the middle and a cross through it, the
  /// guide every handwriting pad draws. 「四角形と十字とか入れてあげたら？」
  /// OWNER 2026-09-25. Drawn under the line and never read -- hand.js fits
  /// whatever was written, wherever it was written.
  private let guide = CAShapeLayer()
  private var wait: Timer?

  /// How long the finger has to stay off before what was written is read.
  /// Long enough to lift it between the strokes of one letter, short enough
  /// that a letter of one stroke is not a wait. A judgement, and the owner's
  /// to change (docs/scope/r96-hand.md).
  static let pause: TimeInterval = 0.6

  override init(frame: CGRect) {
    super.init(frame: frame)
    backgroundColor = .clear
    isMultipleTouchEnabled = false
    line.fillColor = nil
    line.lineWidth = 4
    line.lineCap = .round
    line.lineJoin = .round
    guide.fillColor = nil
    guide.lineWidth = 1
    guide.lineDashPattern = [4, 4]
    layer.addSublayer(guide)
    layer.addSublayer(line)
    paintColour()
  }
  required init?(coder: NSCoder) { fatalError("not from a nib") }

  override func layoutSubviews() {
    super.layoutSubviews()
    line.frame = bounds
    guide.frame = bounds
    let side = min(bounds.width, bounds.height) * 0.86
    let sq = CGRect(x: bounds.midX - side / 2, y: bounds.midY - side / 2, width: side, height: side)
    let g = UIBezierPath(rect: sq)
    g.move(to: CGPoint(x: sq.midX, y: sq.minY)); g.addLine(to: CGPoint(x: sq.midX, y: sq.maxY))
    g.move(to: CGPoint(x: sq.minX, y: sq.midY)); g.addLine(to: CGPoint(x: sq.maxX, y: sq.midY))
    guide.path = g.cgPath
  }
  /// A CGColor does not follow dark mode by itself.
  override func traitCollectionDidChange(_ previous: UITraitCollection?) {
    super.traitCollectionDidChange(previous)
    paintColour()
  }
  private func paintColour() {
    line.strokeColor = UIColor.label.resolvedColor(with: traitCollection).cgColor
    guide.strokeColor = UIColor.tertiaryLabel.resolvedColor(with: traitCollection).cgColor
  }

  private func redraw() {
    let p = UIBezierPath()
    for s in strokes {
      guard let first = s.first else { continue }
      p.move(to: first)
      if s.count == 1 { p.addLine(to: first) }
      for q in s.dropFirst() { p.addLine(to: q) }
    }
    line.path = p.cgPath
  }

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    wait?.invalidate(); wait = nil
    guard let t = touches.first else { return }
    strokes.append([t.location(in: self)])
    redraw()
  }
  override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
    guard let t = touches.first, !strokes.isEmpty else { return }
    for c in event?.coalescedTouches(for: t) ?? [t] {
      strokes[strokes.count - 1].append(c.location(in: self))
    }
    redraw()
  }
  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    if let t = touches.first, !strokes.isEmpty { strokes[strokes.count - 1].append(t.location(in: self)) }
    later()
  }
  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) { later() }

  private func later() {
    wait?.invalidate()
    wait = Timer.scheduledTimer(withTimeInterval: HandPad.pause, repeats: false) { [weak self] _ in
      self?.done()
    }
  }
  private func done() {
    wait = nil
    let s = strokes
    strokes = []
    redraw()
    if !s.isEmpty { delegate?.pad(self, wrote: s) }
  }
}
