package com.tokinets.lingua.keyboard

import android.content.Context
import android.graphics.Color
import android.view.MotionEvent
import android.view.ViewGroup
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import kotlin.math.max
import kotlin.math.roundToInt

/*
 * CandidateBar.kt -- the row above the keys: what it could become.
 *
 * The Android half of ios/App/LinguaKeyboard/CandidateBar.swift. One bar, two
 * fillings -- a syllabary fills it with the letters that write what was
 * spelled, an alphabet with the words that begin the way it started. Which is
 * Compose's business; here it is a list of things to press.
 *
 * It is drawn INSIDE the keyboard's own view, as on iOS, and not through
 * InputMethodService's candidates view: that one is a second window the
 * system places and sizes by its own rules, and the height the keyboard may
 * take is said in one place (LinguaIme.place) only if the bar is in it.
 */
interface CandidateBarListener {
  fun picked(c: Candidate)
}

class CandidateBar(c: Context, private val box: Float) : HorizontalScrollView(c) {
  var listener: CandidateBarListener? = null
  private val strip = LinearLayout(c)
  private val dp = resources.displayMetrics.density

  init {
    isHorizontalScrollBarEnabled = false
    overScrollMode = OVER_SCROLL_ALWAYS
    setPadding((8 * dp).roundToInt(), 0, 0, 0)
    clipToPadding = false
    strip.orientation = LinearLayout.HORIZONTAL
    addView(strip, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.MATCH_PARENT))
  }

  fun show(picks: List<Candidate>) {
    strip.removeAllViews()
    for (p in picks) {
      val cell = CandidateCell(context, p, box)
      cell.setOnClickListener { listener?.picked(p) }
      strip.addView(cell, LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.MATCH_PARENT))
    }
    scrollTo(0, 0)
  }
}

/** One candidate. A word is more than one letter, so it is more than one
 *  shape, side by side -- each taking its own advance (`aw`, `dx` from the
 *  app's inkAdv()), because a bar of letters is a line and not a row of
 *  squares. A face without them falls back to the square. */
private class CandidateCell(c: Context, cand: Candidate, private val box: Float) : ViewGroup(c) {
  private val faces = cand.faces
  private val views = ArrayList<GlyphView>()
  private val pad = 6 * resources.displayMetrics.density
  private val held = Tone.of(c).held

  init {
    isClickable = true
    for (f in faces) {
      val g = GlyphView(c)
      g.box = box
      g.poly = f.st
      g.text = f.ch ?: f.t
      val d = f.dx
      if (f.st != null && d != null) g.dx = d.toFloat()
      views.add(g)
      addView(g)
    }
  }

  private fun step(f: Face, side: Float): Float {
    val w = f.aw
    if (f.st == null || w == null || w <= 0) return side
    return w.toFloat() * side / box
  }

  override fun onMeasure(ws: Int, hs: Int) {
    val h = MeasureSpec.getSize(hs)
    val side = h - pad * 2
    var w = 0f
    for (f in faces) w += step(f, side)
    setMeasuredDimension((max(side, w) + pad * 3).roundToInt(), h)
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    val side = (b - t) - pad * 2
    var x = pad * 1.5f
    for ((i, g) in views.withIndex()) {
      val w = step(faces[i], side)
      g.measure(MeasureSpec.makeMeasureSpec(w.roundToInt(), MeasureSpec.EXACTLY),
                MeasureSpec.makeMeasureSpec(side.roundToInt(), MeasureSpec.EXACTLY))
      g.layout(x.roundToInt(), pad.roundToInt(), (x + w).roundToInt(), (pad + side).roundToInt())
      x += w
    }
  }

  override fun onTouchEvent(e: MotionEvent): Boolean {
    when (e.actionMasked) {
      MotionEvent.ACTION_DOWN -> setBackgroundColor(held)
      MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> setBackgroundColor(Color.TRANSPARENT)
    }
    return super.onTouchEvent(e)
  }
}
