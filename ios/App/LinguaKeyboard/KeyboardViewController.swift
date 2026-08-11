//  KeyboardViewController.swift
//  The way in.
//
//  Three states and it says which one it is in. An empty keyboard is the one
//  thing it must never be: a keyboard with no keys looks broken, and every
//  reason it could have no keys is something the person can fix in a minute
//  if anybody tells them.

import UIKit

final class KeyboardViewController: UIInputViewController, KeyBoardViewDelegate {
  private var board: Board?
  private var layer = 0
  private var body: UIView?
  private var height: NSLayoutConstraint?

  /// A row is a thumb high. Ten keys across a phone is about 35pt wide each,
  /// which is what QWERTY is and what Apple's own keyboard measures — the
  /// height is what carries the touch.
  private let rowHeight: CGFloat = 54

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .clear
    build()
  }

  /// The keyboard is rebuilt rather than adjusted whenever anything about it
  /// changes -- a layer, a rotation, the app having written a new letter
  /// while this was on screen. It is a few dozen views.
  private func build() {
    body?.removeFromSuperview()
    body = nil

    guard hasFullAccess else { return show(Say.full()) }
    guard let b = Shared.board() else { return show(Say.draw()) }
    board = b
    let lay = b.lay[min(layer, b.lay.count - 1)]

    // The globe is in the file always, because only here can the phone be
    // asked whether it wants one -- an iPad with a hardware keyboard does
    // not, and Apple hides it rather than having it do nothing.
    let drop: Set<String> = needsInputModeSwitchKey ? [] : ["next"]
    let kb = KeyBoardView(layer: lay, box: CGFloat(b.box), drop: drop)
    kb.delegate = self
    place(kb, rows: lay.rows.count)
  }

  private func show(_ text: String) {
    let l = UILabel()
    l.text = text
    l.textColor = .secondaryLabel
    l.font = .systemFont(ofSize: 15)
    l.numberOfLines = 0
    l.textAlignment = .center
    place(l, rows: 2)
  }

  /// The system gives an input view no height of its own, so it has to be
  /// said. Said once, and changed rather than re-added, or the constraints
  /// pile up and iOS starts breaking them one per rebuild.
  private func place(_ v: UIView, rows: Int) {
    v.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(v)
    NSLayoutConstraint.activate([
      v.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      v.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      v.topAnchor.constraint(equalTo: view.topAnchor),
      v.bottomAnchor.constraint(equalTo: view.bottomAnchor),
    ])
    body = v
    let h = rowHeight * CGFloat(rows) + 8
    if let c = height { c.constant = h }
    else {
      let c = view.heightAnchor.constraint(equalToConstant: h)
      c.priority = .required - 1        // the system relaxes this on rotation
      c.isActive = true
      height = c
    }
  }

  func keyboard(_ v: KeyBoardView, didPress key: Key, face: Face?) {
    // A flick is a press with a different letter, so it goes through the
    // same door rather than a second one beside it -- kbFlick() in
    // www/keyboard.js, same argument.
    if let f = face {
      insert(f.t)
      return
    }
    switch key.k {
    case "del":  textDocumentProxy.deleteBackward()
    case "sp":   textDocumentProxy.insertText(" ")
    case "next": advanceToNextInputMode()
    case "lay":  layer = key.to ?? 0; build()
    default:     insert(key.t)
    }
  }

  private func insert(_ s: String?) {
    guard let s = s, !s.isEmpty else { return }
    textDocumentProxy.insertText(s)
  }

  /// The app may have been drawing letters while this keyboard sat behind
  /// another one. Re-reading on the way in is cheaper than being wrong.
  override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
    build()
  }
}
