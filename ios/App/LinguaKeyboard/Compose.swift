//  Compose.swift
//  What is being typed but is not in the text yet.
//
//  Two ways in, and they are the same machine seen from two sides:
//
//    a syllabary   you press ROMAN keys, nothing goes in, and the bar offers
//                  the letters that write what you have spelled
//    an alphabet   you press YOUR OWN letters, they go in as you press them,
//                  and the bar offers the words that begin that way
//
//  The difference is only whether the keys insert as they are pressed. The
//  buffer, the lookup and the bar are one thing either way, which is why they
//  are one file: two of these would drift the first time either changed.
//
//  Nothing here knows what a language is. It is handed a table of roman
//  strings to faces and looks things up in it.

import Foundation

/// What arrives with the board when the writing system needs conversion.
struct Conv: Decodable {
  /// wsys() verbatim: alpha · abjad · syll · abugida · logo.
  let how: String
  /// The longest key in the map. Past this there is nothing left to match, so
  /// the buffer stops growing rather than growing without bound in a language
  /// whose longest word is four letters.
  let max: Int
  /// What somebody types, to the faces it gives. The values index into the
  /// board's `ink`, which holds each face exactly once -- the same shape in
  /// every entry that used it would be four megabytes rather than two hundred
  /// kilobytes, measured.
  let map: [String: [Int]]

  /// Whether the keys are roman. A syllabary is typed in roman and converted;
  /// an alphabet is typed in its own letters and only suggested at.
  var romanKeys: Bool { how == "syll" || how == "abugida" || how == "logo" }
}

/// One thing the bar is offering: what it looks like, and what pressing it
/// puts in.
struct Candidate {
  let faces: [Face]
  var text: String { faces.map { $0.t ?? "" }.joined() }
}

/// The buffer and what it currently offers. A value type, so a keypress
/// produces a new state rather than editing one in place -- which is what
/// makes "throw the buffer away" a single assignment rather than four.
struct Compose {
  private(set) var buffer = ""
  /// The face of every key pressed since the buffer was last emptied, in
  /// order. The buffer is what those keys are CALLED; this is what they look
  /// like, and an alphabet's bar is made of it.
  private(set) var typedFaces: [Face] = []
  private let conv: Conv
  private let ink: [Face]

  init(conv: Conv, ink: [Face]) {
    self.conv = conv
    self.ink = ink
  }

  var isEmpty: Bool { buffer.isEmpty }
  /// Roman keys hold the text back until something is chosen; letter keys do
  /// not, because what was pressed is already the letter that was meant.
  var holdsText: Bool { conv.romanKeys }

  mutating func clear() { buffer = ""; typedFaces = [] }

  /// Take one more roman character, or one more letter's name, with the face
  /// of the key it came from.
  ///
  /// `max` is the longest key the conversion table has, so it is where a
  /// roman spelling stops being able to match anything. An alphabet is not
  /// spelling at anything -- the letters are already in the document and the
  /// bar is showing them back -- so nothing caps it and a run of any length
  /// stays whole. 「第一候補で無限」
  ///
  /// Returns false when it was refused, so the caller can decide what to do
  /// with the press rather than having it silently vanish.
  mutating func push(_ s: String, face: Face?) -> Bool {
    guard !s.isEmpty else { return false }
    if conv.romanKeys, buffer.count + s.count > conv.max { return false }
    buffer += s
    typedFaces.append(face ?? Face(t: s, st: nil, ch: nil, aw: nil, dx: nil))
    return true
  }

  /// One character off the end. False when there was nothing to take, which
  /// is the caller's cue to delete from the document instead.
  mutating func back() -> Bool {
    guard !buffer.isEmpty else { return false }
    buffer.removeLast()
    if !typedFaces.isEmpty { typedFaces.removeLast() }
    return true
  }

  /// What the bar shows.
  ///
  /// The exact match first, because it is what was asked for, then everything
  /// the buffer begins -- which is the whole of what an alphabet gets, and is
  /// what makes a long word one press instead of eight.
  ///
  /// Sorted by length so the shortest, most likely completion leads, and then
  /// by the key itself so the order is the same twice running. A bar that
  /// reshuffles between keystrokes cannot be aimed at.
  func candidates() -> [Candidate] {
    guard !buffer.isEmpty else { return [] }
    /* An alphabet is not being converted. The letters pressed are already the
       letters meant and are already in the document, so there is nothing to
       choose -- and offering to choose was the bug: two letters in, the bar
       filled with dictionary words that happened to start that way and the
       run being typed was nowhere on it. 「2文字以上入力すると候補にliとか出て
       きちゃう」

       So the bar shows what was typed, twice: in the shapes somebody drew,
       and in the roman they are named by. First their own, because that is
       what they are writing.
       「自作文字で第一候補で無限、第二候補がアルファベット」 */
    if !conv.romanKeys {
      var out = [Candidate(faces: typedFaces)]
      if typedFaces.contains(where: { $0.st != nil || $0.ch != nil }) {
        out.append(Candidate(faces: buffer.map {
          Face(t: String($0), st: nil, ch: nil, aw: nil, dx: nil) }))
      }
      return out
    }
    var keys: [String] = []
    if conv.map[buffer] != nil { keys.append(buffer) }
    for k in conv.map.keys where k != buffer && k.hasPrefix(buffer) { keys.append(k) }
    let head = keys.prefix(1)
    let rest = keys.dropFirst().sorted { a, b in
      a.count == b.count ? a < b : a.count < b.count
    }
    return (Array(head) + rest).prefix(24).compactMap { key in
      guard let ix = conv.map[key] else { return nil }
      let faces = ix.compactMap { i in ink.indices.contains(i) ? ink[i] : nil }
      return faces.isEmpty ? nil : Candidate(faces: faces)
    }
  }

  /// What space commits: the first candidate, the way pinyin does it. Nil
  /// when nothing matched, and then the buffer is worth inserting as it
  /// stands rather than being thrown away — somebody typed those letters.
  func first() -> Candidate? { candidates().first }
}
