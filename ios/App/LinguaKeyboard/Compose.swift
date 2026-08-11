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

  mutating func clear() { buffer = "" }

  /// Take one more roman character, or one more letter's name. Refused past
  /// `max`, where nothing can match any more.
  ///
  /// Returns false when it was refused, so the caller can decide what to do
  /// with the press rather than having it silently vanish.
  mutating func push(_ s: String) -> Bool {
    guard !s.isEmpty, buffer.count + s.count <= conv.max else { return false }
    buffer += s
    return true
  }

  /// One character off the end. False when there was nothing to take, which
  /// is the caller's cue to delete from the document instead.
  mutating func back() -> Bool {
    guard !buffer.isEmpty else { return false }
    buffer.removeLast()
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
