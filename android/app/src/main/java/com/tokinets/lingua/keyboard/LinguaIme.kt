package com.tokinets.lingua.keyboard

import android.content.Context
import android.inputmethodservice.InputMethodService
import android.os.Build
import android.util.TypedValue
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.TextView
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/*
 * LinguaIme.kt -- the Lingua keyboard on Android, and the way in.
 *
 * The Android half of ios/App/LinguaKeyboard/KeyboardViewController.swift. An
 * iOS keyboard extension and an Android input method are the same thing by
 * purpose -- a keyboard that types the letters somebody drew, in any field --
 * and they read the same file (Shared.kt), draw the same rows at the same
 * sizes, and put in the same characters: a letter key puts in the private use
 * code point www/share.js put on it, exactly as the iOS keyboard does, so
 * `.tfont` (LinguaType) draws it as that letter wherever it lands.
 *
 * Three states and it says which one it is in. An empty keyboard is the one
 * thing it must never be: a keyboard with no keys looks broken, and every
 * reason it could have no keys is something the person can fix in a minute if
 * anybody tells them.
 *
 * DEVICE UNCONFIRMED. There is no Android SDK in the session that wrote this;
 * docs/ANDROID.md § キーボード says what has to be looked at on a phone.
 */
class LinguaIme : InputMethodService(), KeyBoardListener, CandidateBarListener, HandPadListener {
  private var board: Board? = null
  private var layerNo = 0
  private var bar: CandidateBar? = null
  private var compose: Compose? = null
  /** hand.js with the letters already prepared -- made the first time the
   *  handwriting face is shown, forgotten with the board. */
  private var reader: Hand? = null
  /** What the bar offers after something was written on the handwriting face,
   *  until one is pressed or something else is typed. */
  private var handPicks: List<Candidate>? = null

  private val dp: Float get() = resources.displayMetrics.density

  /** The screen in dp, the whole of it -- what UIScreen.main.bounds is on iOS,
   *  in this orientation. */
  private fun screen(): Pair<Float, Float> {
    val wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
    if (Build.VERSION.SDK_INT >= 30) {
      val b = wm.maximumWindowMetrics.bounds
      return Pair(b.width() / dp, b.height() / dp)
    }
    val m = android.util.DisplayMetrics()
    @Suppress("DEPRECATION") wm.defaultDisplay.getRealMetrics(m)
    return Pair(m.widthPixels / dp, m.heightPixels / dp)
  }

  /** A row is a KEY tall, and a key is a tenth of the phone wide, so the height
   *  follows the width and a key keeps its shape on every phone -- off the
   *  SHORT side, so turning the phone over does not change it.
   *  「キーのサイズはiPhoneのサイズによって変わるんじゃないの？」 OWNER
   *  2026-08-26. The number is KeyboardViewController.swift's, and kb-check
   *  reads it out of both files and asks both are the one www/keyboard.js
   *  divides the rows by. */
  private val rowHeight: Float get() {
    val (w, h) = screen()
    return min(w, h) * rowPerWidth
  }

  // ---- building -------------------------------------------------------------

  override fun onCreateInputView(): View = build()

  /** The app may have been drawing letters while this keyboard was away.
   *  Re-reading on the way in is cheaper than being wrong -- the Swift's
   *  viewWillAppear, and it forgets the same three things. */
  override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
    super.onStartInputView(info, restarting)
    compose = null
    reader?.close(); reader = null
    handPicks = null
    setInputView(build())
  }

  override fun onDestroy() {
    reader?.close(); reader = null
    super.onDestroy()
  }

  /** Rebuilt rather than adjusted whenever anything about it changes -- a
   *  layer, a rotation, the app having written a new letter. A few dozen views.
   *
   *  No switch has to be on for this to read anything: the input method is a
   *  service of the app itself and the file is in the app's own storage. */
  private fun build(): View {
    bar = null
    val b = Shared.board(this) ?: return show(Say.draw(this))
    board = b
    val cv = b.conv
    if (compose == null && cv != null) compose = Compose(cv, b.ink ?: emptyList())
    // Which face is being typed on decides whether a key holds its text back:
    // the roman one spells at something, the person's own letters are what
    // was meant.
    compose?.onRoman = (b.rom != null && layerNo == b.rom)
    val lay = b.lay[min(layerNo, b.lay.size - 1)]

    // The globe is in the file always; only here can the phone be asked
    // whether it wants one.
    val drop = if (wantsGlobe()) emptySet() else setOf("next")
    // Absent means ON -- a board from a build that never had the switch.
    val kb = KeyBoardView(this, lay, b.box.toFloat(), drop, (b.mark ?: 1) != 0)
    kb.listener = this
    if ((lay.hand ?: 0) > 0) return handFace(kb, lay, b)
    val v = place(kb, lay.rows.size.toFloat(), compose != null, b.box.toFloat())
    paintBar()
    return v
  }

  /** The handwriting face: a pad to write on, and the face's own rows under it.
   *  How many rows tall the pad is is `hand` on the face (kbHandRows() in
   *  www/keyboard.js). The bar always: it is where what was written is offered. */
  private fun handFace(kb: KeyBoardView, lay: Layer, b: Board): View {
    if (reader == null) reader = Hand.make(this, (b.hand ?: emptyList()).map { it.st })
    val own = max(1, lay.rows.size).toFloat()
    val rows = own + max(1, lay.hand ?: 1)
    val pad = HandPad(this)
    pad.listener = this
    val wrap = Split(this, pad, kb, own / rows)
    val v = place(wrap, rows, true, b.box.toFloat())
    paintBar()
    return v
  }

  /** What was written is offered on the bar, nearest first; nothing goes in
   *  until one is pressed. 「候補は何個か出して選ぶ形やな」 OWNER 2026-09-25. */
  override fun wrote(strokes: List<List<FloatArray>>) {
    val r = reader ?: return
    val faces = board?.hand ?: return
    r.nearest(strokes) { got ->
      val picks = got.filter { it >= 0 && it < faces.size }
      handPicks = if (picks.isEmpty()) null else picks.map { Candidate(listOf(faces[it])) }
      paintBar()
    }
  }

  /** Something to say, and a way OFF this keyboard -- the globe and only the
   *  globe. A row of roman keys in place of the person's letters would be this
   *  app putting somebody else's alphabet on their keyboard. */
  private fun show(text: String): View {
    val tone = Tone.of(this)
    val l = TextView(this)
    l.text = text
    l.setTextColor(tone.second)
    l.setTextSize(TypedValue.COMPLEX_UNIT_DIP, 15f)
    l.gravity = Gravity.CENTER
    val p = (16 * dp).roundToInt()
    l.setPadding(p, 0, p, 0)
    if (!wantsGlobe()) return place(l, 2f, false, 800f)
    val kb = KeyBoardView(this, Layer(listOf(listOf(Key("next")))), 800f, emptySet(), false)
    kb.listener = this
    val wrap = Globe(this, l, kb, rowHeight * dp)
    return place(wrap, 3f, false, 800f)
  }

  /** The system gives an input view no height of its own, so it is said here,
   *  once. One row is one height and the total is capped against the screen:
   *  a keyboard somebody built ten rows deep is SQUEEZED rather than
   *  swallowing the phone -- the rows share what is left of the cap. The
   *  arithmetic is the Swift's place(), line for line. */
  private fun place(v: View, rows: Float, wantsBar: Boolean, box: Float): View {
    val bars = 8 + (if (wantsBar) barHeight else 0f)
    val want = rowHeight * rows + bars
    val cap = screen().second * mostOfScreen
    val h = min(want, max(cap, rowHeight + bars))
    val b = if (wantsBar) CandidateBar(this, box).also { it.listener = this } else null
    bar = b
    return Stack(this, b, v, (h * dp).roundToInt(), (barHeight * dp).roundToInt(), Tone.of(this).back)
  }

  private fun paintBar() {
    val b = bar ?: return
    val h = handPicks
    if (h != null) { b.show(h); return }
    b.show(compose?.candidates() ?: emptyList())
  }

  /** Whether the phone wants a key to go to the next keyboard -- iOS's
   *  needsInputModeSwitchKey. */
  private fun wantsGlobe(): Boolean {
    if (Build.VERSION.SDK_INT >= 28) return shouldOfferSwitchingToNextInputMethod()
    val token = window?.window?.attributes?.token ?: return true
    val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
    @Suppress("DEPRECATION") return imm.shouldOfferSwitchingToNextInputMethod(token)
  }

  private fun nextKeyboard() {
    if (Build.VERSION.SDK_INT >= 28) { switchToNextInputMethod(false); return }
    val token = window?.window?.attributes?.token ?: return
    val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
    @Suppress("DEPRECATION") imm.switchToNextInputMethod(token, false)
  }

  // ---- the document ---------------------------------------------------------

  private fun insert(s: String) { currentInputConnection?.commitText(s, 1) }
  /** One press of delete, which the field answers the way it answers any
   *  delete key -- a selection, a whole emoji. */
  private fun deleteBackward() { sendDownUpKeyEvents(KeyEvent.KEYCODE_DEL) }

  // ---- the finger -----------------------------------------------------------

  override fun pressed(key: Key, face: Face?) {
    // A key pressed while the bar is offering what was written is a letter not
    // chosen: the offer goes, and the key does what it does.
    if (handPicks != null) { handPicks = null; paintBar() }
    // A flick is a press with a different letter, through the same door.
    if (face != null) { typed(face.t, face); return }
    when (key.k) {
      "del" -> back()
      "sp" -> { settle(); insert(" "); drop() }
      // A new line commits what is being spelled first, as a space does. It
      // goes in as the Enter key, which is what a field's own action (send,
      // search, go) is on Android -- insertText("\n") is that on iOS.
      "ret" -> { settle(); sendKeyChar('\n'); drop() }
      "gap" -> {}                                  // a space in the row, not a key
      "next" -> { drop(); nextKeyboard() }
      "lay" -> { drop(); layerNo = key.to ?: 0; setInputView(build()) }
      else -> typed(key.t, key.face)
    }
  }

  /** One letter, or one roman character on the conversion face. They differ
   *  only in whether it goes into the document as it is pressed. */
  private fun typed(s: String?, face: Face) {
    if (s.isNullOrEmpty()) return
    val c = compose
    if (c == null) { insert(s); return }
    if (!c.holdsText) insert(s)
    if (!c.push(s, face)) {
      // Past the longest thing anything could match: the roman buffer goes in
      // as it stands; a mirror of the document that stopped tracking is
      // dropped rather than trusted.
      if (c.holdsText) insert(c.buffer + s)
      c.clear()
    }
    paintBar()
  }

  private fun back() {
    val c = compose
    if (c == null || c.isEmpty) { deleteBackward(); return }
    c.back()
    // The letters went in as they were pressed, so the document loses one too
    // -- one code point, the one the buffer just lost. The roman never went in.
    if (!c.holdsText) currentInputConnection?.deleteSurroundingTextInCodePoints(1, 0)
    paintBar()
  }

  /** Space commits the first candidate on the roman face, the way pinyin does;
   *  nothing matched means the roman goes in as it stands. On a face of the
   *  person's own letters a space ends the word rather than replacing it. */
  private fun settle() {
    val c = compose ?: return
    if (c.isEmpty || !c.holdsText) return
    val hit = c.first()
    if (hit != null) commit(hit) else insert(c.buffer)
  }

  private fun drop() {
    compose?.clear()
    paintBar()
  }

  override fun picked(c: Candidate) {
    if (handPicks != null) {
      val f = c.faces.firstOrNull()
      if (f != null) { handPicks = null; typed(f.t, f); return }
    }
    commit(c)
  }

  /** Put a candidate in. On the letter side the buffer is already in the
   *  document, so it comes back out first -- unless the pick IS what is
   *  already there, where taking it out to put it back is only a flicker. */
  private fun commit(hit: Candidate) {
    val c = compose ?: return
    if (!c.holdsText) {
      if (hit.text == c.buffer) { c.clear(); paintBar(); return }
      currentInputConnection?.deleteSurroundingText(c.buffer.length, 0)
    }
    insert(hit.text)
    c.clear()
    paintBar()
  }

  companion object {
    /** 0.1385 of the phone's short side: the 54pt the iOS row was, at the 390pt
     *  phone it was chosen on. 44 on the narrowest phone. */
    const val rowPerWidth = 0.1385f
    const val barHeight = 44f
    /** HALF, and half is the limit. 「0.5が限界」 OWNER 2026-08-27. */
    const val mostOfScreen = 0.5f
  }
}

/** The bar on top at its own height, and the body under it filling the rest --
 *  the whole of it `h` tall, which is the one height place() worked out. */
private class Stack(
  c: Context, private val bar: View?, private val body: View,
  private val h: Int, private val barH: Int, back: Int,
) : ViewGroup(c) {
  init {
    setBackgroundColor(back)
    bar?.let { addView(it) }
    addView(body)
  }

  override fun onMeasure(ws: Int, hs: Int) {
    val w = MeasureSpec.getSize(ws)
    val top = if (bar != null) barH else 0
    bar?.measure(MeasureSpec.makeMeasureSpec(w, MeasureSpec.EXACTLY),
                 MeasureSpec.makeMeasureSpec(barH, MeasureSpec.EXACTLY))
    body.measure(MeasureSpec.makeMeasureSpec(w, MeasureSpec.EXACTLY),
                 MeasureSpec.makeMeasureSpec(h - top, MeasureSpec.EXACTLY))
    setMeasuredDimension(w, h)
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    val top = if (bar != null) barH else 0
    bar?.layout(0, 0, r - l, barH)
    body.layout(0, top, r - l, b - t)
  }
}

/** The pad above, the face's own rows under it at `lower` of the height. */
private class Split(c: Context, private val up: View, private val down: View, private val lower: Float) :
  ViewGroup(c) {
  init { addView(up); addView(down) }

  override fun onMeasure(ws: Int, hs: Int) {
    val w = MeasureSpec.getSize(ws)
    val h = MeasureSpec.getSize(hs)
    val low = (h * lower).roundToInt()
    up.measure(MeasureSpec.makeMeasureSpec(w, MeasureSpec.EXACTLY),
               MeasureSpec.makeMeasureSpec(h - low, MeasureSpec.EXACTLY))
    down.measure(MeasureSpec.makeMeasureSpec(w, MeasureSpec.EXACTLY),
                 MeasureSpec.makeMeasureSpec(low, MeasureSpec.EXACTLY))
    setMeasuredDimension(w, h)
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    val h = b - t
    val low = (h * lower).roundToInt()
    up.layout(0, 0, r - l, h - low)
    down.layout(0, h - low, r - l, h)
  }
}

/** The sentence above, the globe under it: a third of the width, one row tall,
 *  in the middle. */
private class Globe(c: Context, private val say: View, private val key: View, private val rowH: Float) :
  ViewGroup(c) {
  init { addView(say); addView(key) }

  override fun onMeasure(ws: Int, hs: Int) {
    val w = MeasureSpec.getSize(ws)
    val h = MeasureSpec.getSize(hs)
    val kh = min(h, rowH.roundToInt())
    say.measure(MeasureSpec.makeMeasureSpec(w, MeasureSpec.EXACTLY),
                MeasureSpec.makeMeasureSpec(h - kh, MeasureSpec.EXACTLY))
    key.measure(MeasureSpec.makeMeasureSpec((w * 0.34f).roundToInt(), MeasureSpec.EXACTLY),
                MeasureSpec.makeMeasureSpec(kh, MeasureSpec.EXACTLY))
    setMeasuredDimension(w, h)
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    val w = r - l
    val h = b - t
    val kh = min(h, rowH.roundToInt())
    say.layout(0, 0, w, h - kh)
    val kw = (w * 0.34f).roundToInt()
    key.layout((w - kw) / 2, h - kh, (w - kw) / 2 + kw, h)
  }
}
