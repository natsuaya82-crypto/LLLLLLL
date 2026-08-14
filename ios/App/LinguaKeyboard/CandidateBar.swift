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
  private var picks: [Candidate] = []
  private var box: CGFloat = 800

  /// There was a label pinned at the left holding what had been typed so far,
  /// in roman, with the candidates scrolling past it. It is gone: on an
  /// alphabet the second candidate IS that roman, so the bar was saying one
  /// thing in two places, and on a conversion face the roman is what every
  /// candidate is a reading of and the first of them is already at the left
  /// edge. The seventy-four points it held go to the candidates.

  init(box: CGFloat) {
    self.box = box
    super.init(frame: .zero)
    backgroundColor = .clear
    scroll.showsHorizontalScrollIndicator = false
    scroll.alwaysBounceHorizontal = true
    addSubview(scroll)
  }
  required init?(coder: NSCoder) { fatalError("not from a nib") }

  func show(picks p: [Candidate]) {
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
    scroll.frame = CGRect(x: 8, y: 0, width: bounds.width - 8, height: bounds.height)
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
/// Each shape takes its own advance, which is a LINE's rule (inkAdv) and not
/// a key's (inkCanvases). A bar of letters is a line, and it was a row of
/// squares -- two narrow letters sat a whole cell apart.
/// 「キーボード内のプレビューのアルファベットいちいち全角のスペース開くのうざい」
///
/// Nothing is worked out here. The app puts `aw` and `dx` on the face, from
/// inkAdv(), which is the one place that knows the rule; a face without them
/// falls back to the square.
private final class CandidateCell: UIControl {
  private let faces: [Face]
  private var views: [GlyphView] = []
  private let pad: CGFloat = 6
  /// The square the shapes are drawn in. Kept, not just used and dropped:
  /// step() needs it every time the bar lays out, and reading the init's
  /// argument from a method is the one mistake that does not look like one.
  private let box: CGFloat

  init(_ c: Candidate, box: CGFloat) {
    faces = c.faces
    self.box = box
    super.init(frame: .zero)
    for f in faces {
      let g = GlyphView()
      g.box = box
      g.poly = f.st
      g.text = f.ch ?? f.t
      /* A shape that came with its advance is one letter of a LINE and is
         laid out as one. A face with no `aw` -- text, or a payload written by
         a build before the app carried it -- falls back to the square, which
         is what every face did until now: worse spacing, never a crash. */
      if f.st != nil, let d = f.dx { g.dx = CGFloat(d) }
      views.append(g)
      addSubview(g)
    }
  }
  required init?(coder: NSCoder) { fatalError("not from a nib") }

  /// How wide this candidate is at a given height. Each letter takes its own
  /// advance, so a word of narrow letters is a narrow word -- which is the
  /// whole difference between a line and a row of cells.
  private func step(_ f: Face, _ side: CGFloat) -> CGFloat {
    guard f.st != nil, let w = f.aw, w > 0 else { return side }
    return CGFloat(w) * side / box
  }

  func width(forHeight h: CGFloat) -> CGFloat {
    let side = h - pad * 2
    var w: CGFloat = 0
    for f in faces { w += step(f, side) }
    return max(side, w) + pad * 3
  }

  override var isHighlighted: Bool {
    didSet { backgroundColor = isHighlighted ? UIColor.systemFill : .clear }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    let side = bounds.height - pad * 2
    var x = pad * 1.5
    for (i, g) in views.enumerated() {
      let w = step(faces[i], side)
      g.frame = CGRect(x: x, y: pad, width: w, height: side)
      x += w
    }
  }
}
