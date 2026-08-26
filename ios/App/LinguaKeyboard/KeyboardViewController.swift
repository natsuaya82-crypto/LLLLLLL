//  KeyboardViewController.swift
//  The way in.
//
//  Three states and it says which one it is in. An empty keyboard is the one
//  thing it must never be: a keyboard with no keys looks broken, and every
//  reason it could have no keys is something the person can fix in a minute
//  if anybody tells them.

import UIKit

final class KeyboardViewController: UIInputViewController,
                                    KeyBoardViewDelegate, CandidateBarDelegate {
  private var board: Board?
  private var layerNo = 0
  private var body: UIView?
  private var bar: CandidateBar?
  private var height: NSLayoutConstraint?
  private var compose: Compose?

  /// A row is a KEY tall, and a key is a tenth of the phone wide — so the
  /// height follows the width and a key keeps its shape on every phone.
  /// 「キーのサイズはiPhoneのサイズによって変わるんじゃないの？八行入っても
  /// 小さかったら打ちにくいだけだぞ？」 OWNER DECISION 2026-08-26.
  ///
  /// It was a flat 54, and a flat number is a key that does not change when
  /// the phone does: on a bigger phone the keys stayed exactly as tall and
  /// the only thing that grew was HOW MANY ROWS FIT — which is backwards from
  /// what a bigger phone is for. Width has always scaled, because ten keys
  /// divide whatever the phone is across; only the height did not.
  ///
  /// 0.1385 is the 54 this used to be, at the 390pt phone it was chosen on.
  /// So nothing moves on that phone and everything else follows it: 44pt on
  /// the narrowest iPhone, 61pt on a Pro Max.
  ///
  /// The SHORT side, not `width`, so the answer does not change when the
  /// phone is turned over — a key is not suddenly two and a half times taller
  /// in landscape.
  private static let rowPerWidth: CGFloat = 0.1385
  private var rowHeight: CGFloat {
    let b = UIScreen.main.bounds
    return min(b.width, b.height) * KeyboardViewController.rowPerWidth
  }
  private let barHeight: CGFloat = 44
  /// The most of the screen a keyboard may take. Apple's own is about four
  /// tenths and a kana keyboard about half; this is the ceiling, not the aim,
  /// and only a keyboard with many rows ever meets it.
  private static let mostOfScreen: CGFloat = 0.55

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .clear
    build()
  }

  /// The keyboard is rebuilt rather than adjusted whenever anything about it
  /// changes -- a layer, a rotation, the app having written a new letter
  /// while this was on screen. It is a few dozen views.
  private func build() {
    body?.removeFromSuperview(); body = nil
    bar?.removeFromSuperview();  bar = nil

    guard hasFullAccess else { return show(Say.full()) }
    guard let b = Shared.board() else { return show(Say.draw()) }
    board = b
    if compose == nil, let c = b.conv { compose = Compose(conv: c, ink: b.ink ?? []) }
    /* Which face is being typed on, said here because here is where a layer
       changes. Whether a key holds its text back belongs to the FACE: the
       roman one spells at something, the person's own letters ARE what was
       meant. Asking the writing system instead made every face of a
       syllabary, an abugida or a logography hold everything back. */
    compose?.onRoman = (b.rom != nil && layerNo == b.rom!)
    let lay = b.lay[min(layerNo, b.lay.count - 1)]

    // The globe is in the file always, because only here can the phone be
    // asked whether it wants one -- an iPad with a hardware keyboard does
    // not, and Apple hides it rather than having it do nothing.
    let drop: Set<String> = needsInputModeSwitchKey ? [] : ["next"]
    /* Absent means ON. A board written by a build that never had the switch
       has not been asked, and the mark is there for somebody who has not
       learnt the layout -- which is exactly who an upgrade lands on. */
    let kb = KeyBoardView(lay: lay, box: CGFloat(b.box), drop: drop,
                          mark: (b.mark ?? 1) != 0)
    kb.delegate = self
    place(kb, rows: CGFloat(lay.rows.count), bar: compose != nil,
          box: CGFloat(b.box))
    paintBar()
  }

  private func show(_ text: String) {
    let l = UILabel()
    l.text = text
    l.textColor = .secondaryLabel
    l.font = .systemFont(ofSize: 15)
    l.numberOfLines = 0
    l.textAlignment = .center
    place(l, rows: 2, bar: false, box: 800)
  }

  /// The system gives an input view no height of its own, so it has to be
  /// said. Said once, and changed rather than re-added, or the constraints
  /// pile up and iOS starts breaking them one per rebuild.
  private func place(_ v: UIView, rows: CGFloat, bar wantsBar: Bool, box: CGFloat) {
    /* One row is one height -- the height the free QWERTY and a Japanese kana
       keyboard are both already drawn at -- and the total is capped against
       the screen.

       It was a multiplier the app let somebody set, with nothing capping what
       the two of them came to: ten rows at 1.5 is 810 points of keyboard on a
       phone 852 points tall, and iOS gives an input view whatever height it
       asks for. The app being typed into was pushed off the screen by its own
       keyboard. 「高さやめて、フリックなら日本語のサイズ、qwartyなら無料版の
       サイズくらいまでにしないとキツくない？」

       So a keyboard somebody built ten rows deep is SQUEEZED rather than
       swallowing the phone: the rows share what is left of the cap. */
    let bars = 8 + (wantsBar ? barHeight : 0)
    let want = rowHeight * rows + bars
    let cap = UIScreen.main.bounds.height * KeyboardViewController.mostOfScreen
    let h = min(want, max(cap, rowHeight + bars))
    v.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(v)
    var top = view.topAnchor
    if wantsBar {
      let b = CandidateBar(box: box)
      b.delegate = self
      b.translatesAutoresizingMaskIntoConstraints = false
      view.addSubview(b)
      NSLayoutConstraint.activate([
        b.leadingAnchor.constraint(equalTo: view.leadingAnchor),
        b.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        b.topAnchor.constraint(equalTo: view.topAnchor),
        b.heightAnchor.constraint(equalToConstant: barHeight),
      ])
      bar = b
      top = b.bottomAnchor
    }
    NSLayoutConstraint.activate([
      v.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      v.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      v.topAnchor.constraint(equalTo: top),
      v.bottomAnchor.constraint(equalTo: view.bottomAnchor),
    ])
    body = v
    if let c = height { c.constant = h }
    else {
      let c = view.heightAnchor.constraint(equalToConstant: h)
      c.priority = UILayoutPriority(999)   // the system relaxes this on rotation
      c.isActive = true
      height = c
    }
  }

  private func paintBar() {
    guard let bar = bar, let c = compose else { return }
    bar.show(picks: c.candidates())
  }

  // ---- the finger ---------------------------------------------------------

  func keyboard(_ v: KeyBoardView, didPress key: Key, face: Face?) {
    // A flick is a press with a different letter, so it goes through the
    // same door rather than a second one beside it -- kbFlick() in
    // www/keyboard.js, same argument.
    if let f = face { typed(f.t, face: f); return }
    switch key.k {
    case "del":  back()
    case "sp":   settle(); textDocumentProxy.insertText(" "); drop()
    // A new line commits what is being spelled first, the same as a space --
    // a buffer left standing would be picked against the next line's text.
    case "ret":  settle(); textDocumentProxy.insertText("\n"); drop()
    case "gap":  break                       // it is a space in the row, not a key
    case "next": drop(); advanceToNextInputMode()
    case "lay":  drop(); layerNo = key.to ?? 0; build()
    default:     typed(key.t, face: key.face)
    }
  }

  /// One letter, or one roman character on the conversion face.
  ///
  /// The two differ in one thing only: whether it goes into the document as
  /// it is pressed. A roman key is spelling something that is not itself, so
  /// nothing goes in until it is chosen. A letter key IS what was meant, so
  /// it goes in at once and the bar only offers to finish the word.
  private func typed(_ s: String?, face: Face) {
    guard let s = s, !s.isEmpty else { return }
    guard var c = compose else { textDocumentProxy.insertText(s); return }
    if !c.holdsText { textDocumentProxy.insertText(s) }
    if !c.push(s, face: face) {
      // Past the longest thing anything could match. For roman that is a
      // dead end and the buffer is worth putting in as it stands; for
      // letters the buffer is a mirror of the document's tail, and a mirror
      // that has stopped tracking has to be dropped rather than trusted --
      // picking a candidate against a stale one would eat the wrong text.
      if c.holdsText { textDocumentProxy.insertText(c.buffer + s) }
      c.clear()
    }
    compose = c
    paintBar()
  }

  private func back() {
    guard var c = compose, !c.isEmpty else {
      textDocumentProxy.deleteBackward(); return
    }
    _ = c.back()
    // The letters went in as they were pressed, so the document has to lose
    // one too; the roman never went in, so it must not.
    if !c.holdsText { textDocumentProxy.deleteBackward() }
    compose = c
    paintBar()
  }

  /// Space commits the first candidate, the way pinyin does. Nothing matched
  /// means the roman goes in as it stands -- somebody typed those letters and
  /// throwing them away would be the keyboard deciding they were a mistake.
  ///
  /// The roman face's only. On a face of the person's own letters the run is
  /// already in the document and the bar's first pick is a word it MIGHT be
  /// completed to, offered because words are what a bar is for -- so a space
  /// there ends the word rather than replacing it. Committing the first pick
  /// would turn every `li ` into `lingua`, which is the keyboard rewriting
  /// text somebody had already finished typing.
  private func settle() {
    guard let c = compose, !c.isEmpty, c.holdsText else { return }
    if let hit = c.first() { commit(hit) }
    else { textDocumentProxy.insertText(c.buffer) }
  }

  private func drop() {
    guard var c = compose else { return }
    c.clear(); compose = c
    paintBar()
  }

  func bar(_ b: CandidateBar, didPick c: Candidate) { commit(c) }

  /// Put a candidate in. On the letter side the buffer is already in the
  /// document, so it comes back out first -- one press per character, which
  /// is the only way a keyboard extension can take text back.
  private func commit(_ hit: Candidate) {
    guard var c = compose else { return }
    if !c.holdsText {
      // Both of an alphabet's candidates ARE what is already in the
      // document -- one shows it in the drawn shapes, one in the roman they
      // are named by, and either way the characters are the same ones. So
      // taking the text out to put the same text back is a flicker and
      // nothing else. Only a genuinely different pick is worth the presses.
      if hit.text == c.buffer { c.clear(); compose = c; paintBar(); return }
      for _ in 0..<c.buffer.count { textDocumentProxy.deleteBackward() }
    }
    textDocumentProxy.insertText(hit.text)
    c.clear(); compose = c
    paintBar()
  }

  /// The app may have been drawing letters while this keyboard sat behind
  /// another one. Re-reading on the way in is cheaper than being wrong.
  override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
    compose = nil
    build()
  }
}
