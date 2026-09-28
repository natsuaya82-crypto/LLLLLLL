package com.tokinets.lingua.keyboard

/*
 * Compose.kt -- what is being typed but is not in the text yet.
 *
 * The Android half of ios/App/LinguaKeyboard/Compose.swift, the same machine
 * seen from the same two sides:
 *
 *   the roman face   you press ROMAN keys, nothing goes in, and the bar
 *                    offers the letters that write what you have spelled
 *   your own face    you press YOUR OWN letters, they go in as you press
 *                    them, and the bar offers the words they begin
 *
 * Which of the two is a property of the FACE (Board.rom), not of the
 * language -- the Swift says why at length and it is not said again here.
 * Nothing here knows what a language is: it is handed a table of roman
 * strings to faces and looks things up in it.
 *
 * Lengths are UTF-16 units, which is what the app measured `conv.max` in
 * (www/share.js is JavaScript) and what an InputConnection deletes in.
 */

/** One thing the bar is offering: what it looks like, and what pressing it
 *  puts in. */
class Candidate(val faces: List<Face>) {
  val text: String get() = faces.joinToString("") { it.t ?: "" }
}

/** The buffer and what it currently offers. */
class Compose(private val conv: Conv, private val ink: List<Face>) {
  var buffer = ""
    private set
  /** The face of every key pressed since the buffer was last emptied. */
  private val typedFaces = ArrayList<Face>()

  /** Whether the face being typed on is the roman one. Set by the service
   *  every time the board is built, which is every time a layer changes. */
  var onRoman = false

  val isEmpty: Boolean get() = buffer.isEmpty()
  /** The roman face holds its text back until something is chosen; a face of
   *  the person's own letters does not. */
  val holdsText: Boolean get() = onRoman

  fun clear() { buffer = ""; typedFaces.clear() }

  /** One more roman character, or one more letter's name. False when it was
   *  refused -- only the roman face is capped, at the longest key the table
   *  has; a run of the person's own letters stays whole at any length. */
  fun push(s: String, face: Face?): Boolean {
    if (s.isEmpty()) return false
    if (onRoman && buffer.length + s.length > conv.max) return false
    buffer += s
    typedFaces.add(face ?: Face(s, null, null, null, null))
    return true
  }

  /** One character off the end -- a code point, which is what the service
   *  then takes out of the document. False when there was nothing to take. */
  fun back(): Boolean {
    if (buffer.isEmpty()) return false
    buffer = buffer.substring(0, buffer.offsetByCodePoints(buffer.length, -1))
    if (typedFaces.isNotEmpty()) typedFaces.removeAt(typedFaces.size - 1)
    return true
  }

  fun candidates(): List<Candidate> {
    if (buffer.isEmpty()) return emptyList()
    return if (onRoman) lookup() else ownPicks()
  }

  /** The exact key first, then every key the buffer begins, shortest first and
   *  then by the key itself, so the bar is the same twice running. 24 at most. */
  private fun lookup(): List<Candidate> {
    val rest = conv.map.keys.filter { it != buffer && it.startsWith(buffer) }
      .sortedWith(compareBy<String>({ it.length }, { it }))
    val keys = (if (conv.map.containsKey(buffer)) listOf(buffer) else emptyList()) + rest
    return keys.take(24).mapNotNull { key ->
      val ix = conv.map[key] ?: return@mapNotNull null
      val faces = ix.filter { it >= 0 && it < ink.size }.map { ink[it] }
      if (faces.isEmpty()) null else Candidate(faces)
    }
  }

  /** Words first, and the run itself last so it is always reachable -- and
   *  never listed twice. */
  private fun ownPicks(): List<Candidate> {
    val run = Candidate(ArrayList(typedFaces))
    val out = lookup().filter { it.text != run.text }.toMutableList()
    out.add(run)
    return out
  }

  /** What space commits on the roman face: the first candidate. */
  fun first(): Candidate? = candidates().firstOrNull()
}
