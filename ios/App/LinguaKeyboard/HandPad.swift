//  HandPad.swift
//  The handwriting face: somewhere to write, and which letter was written.
//
//  OWNER 2026-09-25「後手書き追加しよう」. A face of the keyboard marked
//  `hand` (www/keyboard.js, kbAddLay('hand')) is drawn as this pad above that
//  face's own rows. A finger writes; when it stops, the strokes go to hand.js
//  and the nearest of the language's drawn letters goes in -- through the same
//  door a key press goes through (KeyboardViewController.typed), so the bar
//  above the keys offers words exactly as it does for a key.
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
          let n = c.objectForKeyedSubscript("handNear"), !n.isUndefined else { return nil }
    let arg: [Any] = inks.map { $0.map { $0 as Any } ?? NSNull() }
    guard let pr = p.call(withArguments: [arg]), !pr.isUndefined else { return nil }
    ctx = c; prep = pr; near = n
  }

  /// Which letter the strokes are nearest to, as an index into Board.hand;
  /// -1 for none.
  func nearest(_ strokes: [[CGPoint]]) -> Int {
    let s: [[[Double]]] = strokes.map { $0.map { [Double($0.x), Double($0.y)] } }
    guard let r = near.call(withArguments: [prep, s]), r.isNumber else { return -1 }
    return Int(r.toInt32())
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
    layer.addSublayer(line)
    paintColour()
  }
  required init?(coder: NSCoder) { fatalError("not from a nib") }

  override func layoutSubviews() {
    super.layoutSubviews()
    line.frame = bounds
  }
  /// A CGColor does not follow dark mode by itself.
  override func traitCollectionDidChange(_ previous: UITraitCollection?) {
    super.traitCollectionDidChange(previous)
    paintColour()
  }
  private func paintColour() {
    line.strokeColor = UIColor.label.resolvedColor(with: traitCollection).cgColor
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
