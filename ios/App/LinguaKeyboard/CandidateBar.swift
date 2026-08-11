//  CandidateBar.swift
//  The row above the keys: what you have typed, and what it could become.
//
//  One bar, two fillings. A syllabary fills it with the letters that write
//  what you spelled; an alphabet fills it with the words that begin the way
//  you started. Which one is Compose's business, not this file's — here it is
//  a list of things to press.

import UIKit

protocol CandidateBarDelegate: AnyObject {
  func bar(_ b: CandidateBar, didPick c: Candidate)
}

final class CandidateBar: UIView {
  weak var delegate: CandidateBarDelegate?
  private let scroll = UIScrollView()
  private let typed = UILabel()
  private var picks: [Candidate] = []
  private var box: CGFloat = 800

  /// What is being typed sits at the left, fixed, and the candidates scroll
  /// past it -- so the thing you are correcting never slides off the screen
  /// while you are looking for the one you want.
  private let typedWidth: CGFloat = 74

  init(box: CGFloat) {
    self.box = box
    super.init(frame: .zero)
    backgroundColor = .clear
    typed.font = .monospacedSystemFont(ofSize: 15, weight: .regular)
    typed.textColor = .secondaryLabel
    typed.textAlignment = .left
    typed.lineBreakMode = .byTruncatingHead
    addSubview(typed)
    scroll.showsHorizontalScrollIndicator = false
    scroll.alwaysBounceHorizontal = true
    addSubview(scroll)
  }
  required init?(coder: NSCoder) { fatalError("not from a nib") }

  func show(typed t: String, picks p: [Candidate]) {
    typed.text = t
    picks = p
    scroll.subviews.forEach { $0.removeFromSuperview() }
    for (i, c) in p.enumerated() {
      let cell = CandidateCell(c, box: box)
      cell.tag = i
      cell.addTarget(self, action: #selector(tapped(_:)), for: .touchUpInside)
      scroll.addSubview(cell)
    }
    setNeedsLayout()
  }

  @objc private func tapped(_ sender: UIControl) {
    guard picks.indices.contains(sender.tag) else { return }
    delegate?.bar(self, didPick: picks[sender.tag])
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    typed.frame = CGRect(x: 8, y: 0, width: typedWidth - 12, height: bounds.height)
    scroll.frame = CGRect(x: typedWidth, y: 0,
                          width: bounds.width - typedWidth, height: bounds.height)
    var x: CGFloat = 0
    for v in scroll.subviews {
      guard let cell = v as? CandidateCell else { continue }
      let w = cell.width(forHeight: bounds.height)
      cell.frame = CGRect(x: x, y: 0, width: w, height: bounds.height)
      x += w
    }
    scroll.contentSize = CGSize(width: x, height: bounds.height)
    scroll.contentOffset = .zero
  }
}

/// One candidate. A word is more than one letter, so it is more than one
/// shape, side by side.
///
/// Each shape gets a square of its own here, which is inkCanvases' rule and
/// not inkAdv's -- the app spaces a LINE of letters by the font's own advance
/// so the gap between any two is one step, and this bar has no way to ask
/// what that advance is. It is a bar of two or three letters at a time and a
/// square each reads straight; if a long candidate ever looks loose, the fix
/// is to put the advance on the face rather than to work one out here.
private final class CandidateCell: UIControl {
  private let faces: [Face]
  private var views: [GlyphView] = []
  private let pad: CGFloat = 6

  init(_ c: Candidate, box: CGFloat) {
    faces = c.faces
    super.init(frame: .zero)
    for f in faces {
      let g = GlyphView()
      g.box = box
      g.poly = f.st
      g.text = f.ch ?? f.t
      views.append(g)
      addSubview(g)
    }
  }
  required init?(coder: NSCoder) { fatalError("not from a nib") }

  func width(forHeight h: CGFloat) -> CGFloat {
    let side = h - pad * 2
    return CGFloat(max(1, faces.count)) * side + pad * 3
  }

  override var isHighlighted: Bool {
    didSet { backgroundColor = isHighlighted ? UIColor.systemFill : .clear }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    let side = bounds.height - pad * 2
    var x = pad * 1.5
    for g in views {
      g.frame = CGRect(x: x, y: pad, width: side, height: side)
      x += side
    }
  }
}
