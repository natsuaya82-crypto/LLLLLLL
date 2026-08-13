//  KeyBoardView.swift
//  The keys, laid out, and the finger on them.
//
//  Laid out by hand rather than by stack views: a row divides its width by
//  the keys' `w`, which is a ratio and not a constraint, and saying that in
//  multipliers is three times the code for the same arithmetic.
//
//  The touches hang off THIS view and not off the keys, the same way the app
//  has one delegated listener rather than one per button.

import UIKit

protocol KeyBoardViewDelegate: AnyObject {
  func keyboard(_ v: KeyBoardView, didPress key: Key, face: Face?)
}

/// One key, drawn. The face in the middle, the flicks in the corners they
/// come from — and a corner with nothing in it stays empty, because a dot
/// there would be louder than the letter.
final class KeyView: UIView {
  let key: Key
  private let faceView = GlyphView()
  private var corners: [GlyphView] = []
  /// What this key types, in the roman it is named by, small in the corner.
  ///
  /// A key wearing a shape somebody drew says nothing about WHICH key it is,
  /// and QWERTY is muscle memory rather than a thing anybody can read off a
  /// keyboard -- so a person who has not memorised the layout is looking at
  /// thirty shapes with no way to tell which one is `a`.
  /// 「qwarty暗記してない人は自作文字でどのアルファベットかわからなくなるやん？」
  ///
  /// Only where the face is a DRAWN shape. A key whose face is already a
  /// letter or a borrowed character would be saying the same thing twice.
  private var mark: UILabel?

  init(key: Key, box: CGFloat, mark wantsMark: Bool) {
    self.key = key
    super.init(frame: .zero)
    layer.cornerRadius = 5
    layer.cornerCurve = .continuous
    backgroundColor = KeyView.rest(key)
    isUserInteractionEnabled = false

    faceView.box = box
    switch key.k {
    case "del":  faceView.text = "⌫"
    case "next": faceView.text = "🌐"
    case "sp":   faceView.text = ""            // the widest key wears nothing
    // A layer key is a letter like any other: it wears the first letter of
    // the layer it goes to, so pressing the one showing your 1 brings up the
    // digits. The number is what a layer with no letter on it falls back to.
    case "lay":
      faceView.poly = key.st
      faceView.text = key.ch ?? key.t ?? String((key.to ?? 0) + 1)
    default:
      faceView.poly = key.st
      faceView.text = key.ch ?? key.t
    }
    addSubview(faceView)

    // A borrowed character gets one too. What the mark answers is "which key
    // is this", and a character somebody took from another script is no more
    // readable as a position on QWERTY than a shape they drew is. The one key
    // that must not have it is the one already wearing its own roman name,
    // which would then be saying the same thing twice -- so: a letter key
    // whose face is a shape or a borrowed character, and never the fallback.
    if wantsMark, key.k == "lt", (key.st != nil || key.ch != nil),
       let t = key.t, !t.isEmpty {
      let l = UILabel()
      l.text = t
      l.textColor = UIColor.secondaryLabel
      l.textAlignment = .right
      l.adjustsFontSizeToFitWidth = true
      l.minimumScaleFactor = 0.5
      addSubview(l)
      mark = l
    }

    for f in (key.f ?? []) {
      let g = GlyphView()
      g.box = box
      g.poly = f?.st
      g.text = f?.ch ?? f?.t
      g.alpha = 0.45
      corners.append(g)
      addSubview(g)
    }
  }
  required init?(coder: NSCoder) { fatalError("not from a nib") }

  /// A letter sits on a pale key and everything else on a darker one, which
  /// is what every keyboard on the phone already does.
  static func rest(_ key: Key) -> UIColor {
    key.k == "lt" ? UIColor.secondarySystemBackground : UIColor.tertiarySystemFill
  }
  func hold(_ on: Bool) {
    backgroundColor = on ? UIColor.systemFill : KeyView.rest(key)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    let inset = bounds.height * 0.14
    faceView.frame = bounds.insetBy(dx: inset, dy: inset)
    // The bottom-right CORNER. The four flick faces sit at the middles of the
    // edges rather than at the corners, so this does not land on one even on a
    // key that has all four.
    if let m = mark {
      let h = bounds.height * 0.26
      m.font = .systemFont(ofSize: h * 0.86, weight: .regular)
      m.frame = CGRect(x: bounds.maxX - h * 1.9 - 2, y: bounds.maxY - h - 1,
                       width: h * 1.9, height: h)
    }
    guard corners.count == 4 else { return }
    // up, right, down, left — KB_DIRS in www/keyboard.js, same order.
    let s = bounds.height * 0.3
    let mid = CGPoint(x: bounds.midX - s / 2, y: bounds.midY - s / 2)
    let pad: CGFloat = 1
    corners[0].frame = CGRect(x: mid.x, y: pad, width: s, height: s)
    corners[1].frame = CGRect(x: bounds.maxX - s - pad, y: mid.y, width: s, height: s)
    corners[2].frame = CGRect(x: mid.x, y: bounds.maxY - s - pad, width: s, height: s)
    corners[3].frame = CGRect(x: pad, y: mid.y, width: s, height: s)
  }
}

final class KeyBoardView: UIView {
  weak var delegate: KeyBoardViewDelegate?
  private var rows: [[KeyView]] = []
  private var down: (view: KeyView, at: CGPoint)?

  /// `drop` is the globe when the phone does not need one. It is in the file
  /// because www/share.js always puts it there, and it is taken out here
  /// because only the extension can be asked whether it is wanted.
  init(lay: Layer, box: CGFloat, drop: Set<String>, mark: Bool) {
    super.init(frame: .zero)
    for r in lay.rows {
      var row: [KeyView] = []
      for key in r where !drop.contains(key.k) {
        let v = KeyView(key: key, box: box, mark: mark)
        addSubview(v)
        row.append(v)
      }
      if !row.isEmpty { rows.append(row) }
    }
    isMultipleTouchEnabled = false
  }
  required init?(coder: NSCoder) { fatalError("not from a nib") }

  override func layoutSubviews() {
    super.layoutSubviews()
    guard !rows.isEmpty else { return }
    let gap: CGFloat = 3
    let rowH = (bounds.height - gap * CGFloat(rows.count + 1)) / CGFloat(rows.count)
    var y = gap
    for row in rows {
      let total = row.reduce(CGFloat(0)) { $0 + $1.key.width }
      let free = bounds.width - gap * CGFloat(row.count + 1)
      var x = gap
      for v in row {
        let w = free * (v.key.width / total)
        v.frame = CGRect(x: x, y: y, width: w, height: rowH)
        x += w + gap
      }
      y += rowH + gap
    }
  }

  private func keyAt(_ p: CGPoint) -> KeyView? {
    for row in rows { for v in row where v.frame.contains(p) { return v } }
    return nil
  }

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    guard let t = touches.first else { return }
    let p = t.location(in: self)
    guard let v = keyAt(p) else { return }
    v.hold(true)
    down = (v, p)
  }
  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
    down?.view.hold(false)
    down = nil
  }

  /// Under the threshold it is a tap and the key's own letter is taken;
  /// past it, whichever axis moved further decides which corner.
  ///
  /// 18pt, squared to 324, and the four directions in the order they are
  /// stored — the same numbers as kbUp() in www/keyboard.js. Two programs,
  /// one gesture: a flick that works in the app and not in the keyboard
  /// would be the app having two opinions about its own keyboard.
  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    guard let d = down, let t = touches.first else { return }
    down = nil
    d.view.hold(false)
    let p = t.location(in: self)
    let dx = p.x - d.at.x, dy = p.y - d.at.y
    var face: Face? = nil
    if dx * dx + dy * dy >= 324, let f = d.view.key.f, f.count == 4 {
      let i = abs(dx) > abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0)
      guard let hit = f[i] else { return }        // an empty corner does nothing
      face = hit
    }
    delegate?.keyboard(self, didPress: d.view.key, face: face)
  }
}
