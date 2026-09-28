package com.tokinets.lingua.keyboard

import android.content.Context
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.ViewGroup
import android.widget.TextView
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/*
 * KeyBoardView.kt -- the keys, laid out, and the finger on them.
 *
 * The Android half of ios/App/LinguaKeyboard/KeyBoardView.swift, and the same
 * arithmetic: a row divides its width by the keys' `w`; a row short of ten
 * stands where the app's sheet stands it (kbStart() in www/keyboard.js), at
 * the width a key is on every other row; a key joined to the one under it
 * covers that row too. Points on iOS are dp here -- the same unit for the
 * same purpose, a length that does not change with the screen's density.
 *
 * The touches hang off THIS view and not off the keys, the same way the app
 * has one delegated listener rather than one per button.
 */

/** One key, drawn. The face in the middle, the flicks at the middles of the
 *  edges they come from, and the roman mark in the bottom-right corner. */
class KeyView(c: Context, val key: Key, box: Float, wantsMark: Boolean, private val tone: Tone) :
  ViewGroup(c) {
  private val faceView = GlyphView(c)
  private val corners = ArrayList<GlyphView>()
  private var mark: TextView? = null
  private val bg = GradientDrawable()

  init {
    bg.cornerRadius = 5 * resources.displayMetrics.density
    bg.setColor(rest())
    background = bg
    isClickable = false
    isFocusable = false

    faceView.box = box
    when (key.k) {
      "del" -> faceView.text = "⌫"
      "next" -> faceView.text = "🌐"
      "ret" -> faceView.text = "⏎"
      // The half key that insets a row -- in the file so the row still comes
      // to ten units and the columns line up.
      "gap" -> { faceView.text = ""; bg.setColor(0) }
      "sp" -> faceView.text = ""
      // A layer key wears the first letter of the layer it goes to.
      "lay" -> {
        faceView.poly = key.st
        faceView.text = key.ch ?: key.t ?: ((key.to ?: 0) + 1).toString()
      }
      else -> {
        faceView.poly = key.st
        faceView.text = key.ch ?: key.t
      }
    }
    addView(faceView)

    // Which key this is, in the roman it is named by: only on a letter whose
    // face is a shape or a borrowed character, and only from `nm` -- `t` is
    // the private use code point it types.
    val nm = key.nm
    if (wantsMark && key.k == "lt" && (key.st != null || key.ch != null) && !nm.isNullOrEmpty()) {
      val l = TextView(c)
      l.text = nm
      l.setTextColor(tone.second)
      l.gravity = Gravity.END or Gravity.CENTER_VERTICAL
      l.maxLines = 1
      l.includeFontPadding = false
      addView(l)
      mark = l
    }

    for (f in key.f ?: emptyList()) {
      val g = GlyphView(c)
      g.box = box
      g.poly = f?.st
      g.text = f?.ch ?: f?.t
      g.alpha = 0.45f
      corners.add(g)
      addView(g)
    }
  }

  /** A letter sits on a pale key and everything else on a darker one. */
  private fun rest(): Int = if (key.k == "lt") tone.letter else tone.other

  fun hold(on: Boolean) {
    if (key.k == "gap") return
    bg.setColor(if (on) tone.held else rest())
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    val w = r - l
    val h = b - t
    // Off the SMALLER side, so the face is square and a tall key does not
    // squeeze it into a strip.
    val inset = (min(w, h) * 0.14f).roundToInt()
    faceView.layout(inset, inset, w - inset, h - inset)
    mark?.let { m ->
      val mh = h * 0.26f
      m.setTextSize(TypedValue.COMPLEX_UNIT_PX, mh * 0.86f)
      val mw = mh * 1.9f
      m.layout((w - mw - 2).roundToInt(), (h - mh - 1).roundToInt(), w - 2, h - 1)
    }
    if (corners.size != 4) return
    // up, right, down, left -- KB_DIRS in www/keyboard.js, same order.
    val s = (h * 0.3f).roundToInt()
    val mx = (w - s) / 2
    val my = (h - s) / 2
    val pad = 1
    corners[0].layout(mx, pad, mx + s, pad + s)
    corners[1].layout(w - s - pad, my, w - pad, my + s)
    corners[2].layout(mx, h - s - pad, mx + s, h - pad)
    corners[3].layout(pad, my, pad + s, my + s)
  }

  override fun onMeasure(ws: Int, hs: Int) {
    setMeasuredDimension(MeasureSpec.getSize(ws), MeasureSpec.getSize(hs))
  }
}

interface KeyBoardListener {
  fun pressed(key: Key, face: Face?)
}

/** `drop` is the globe when the phone does not need one -- only the input
 *  method can be asked whether it is wanted. */
class KeyBoardView(c: Context, lay: Layer, box: Float, drop: Set<String>, mark: Boolean) :
  ViewGroup(c) {
  var listener: KeyBoardListener? = null
  private val rows = ArrayList<List<KeyView>>()
  private var down: KeyView? = null
  private var downX = 0f
  private var downY = 0f
  private val dp = resources.displayMetrics.density

  init {
    val tone = Tone.of(c)
    for (r in lay.rows) {
      val row = ArrayList<KeyView>()
      for (key in r) {
        if (drop.contains(key.k)) continue
        val v = KeyView(c, key, box, mark, tone)
        addView(v)
        row.add(v)
      }
      if (row.isNotEmpty()) rows.add(row)
    }
    isMotionEventSplittingEnabled = false
  }

  override fun onMeasure(ws: Int, hs: Int) {
    val w = MeasureSpec.getSize(ws)
    val h = MeasureSpec.getSize(hs)
    setMeasuredDimension(w, h)
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    if (rows.isEmpty()) return
    val width = (r - l).toFloat()
    val height = (b - t).toFloat()
    val gap = 3 * dp
    val rowH = (height - gap * (rows.size + 1)) / rows.size
    var y = gap
    // One column of the app's sheet, and the gap after it. A column is half a
    // key, so a row of ten keys comes out as the proportional division did.
    val col = (width - gap) / halfCols
    for (row in rows) {
      val units = row.sumOf { halfUnits(it.key.width) }
      val total = row.sumOf { it.key.width }
      val free = width - gap * (row.size + 1)
      // A row short of ten stands where kbStart() stands it: the middle, the
      // odd half on the right. 「合わせて」 OWNER 2026-09-24.
      val short = units < halfCols
      var x = if (short) gap + col * ((halfCols - units) / 2) else gap
      for (v in row) {
        val w = if (short) col * halfUnits(v.key.width) - gap
                else free * (v.key.width / total).toFloat()
        // A key joined to the one under it covers that row and the gap
        // between; the row below holds a clear `gap` where its lower half is.
        val high = rowH * v.key.tall + gap * (v.key.tall - 1)
        v.measure(MeasureSpec.makeMeasureSpec(w.roundToInt(), MeasureSpec.EXACTLY),
                  MeasureSpec.makeMeasureSpec(high.roundToInt(), MeasureSpec.EXACTLY))
        v.layout(x.roundToInt(), y.roundToInt(), (x + w).roundToInt(), (y + high).roundToInt())
        x += w + gap
      }
      y += rowH + gap
    }
  }

  /** The first key containing the point -- a merged key, one row earlier,
   *  before the clear gap holding its lower half. */
  private fun keyAt(px: Float, py: Float): KeyView? {
    for (row in rows) for (v in row) {
      if (px >= v.left && px < v.right && py >= v.top && py < v.bottom) return v
    }
    return null
  }

  override fun onInterceptTouchEvent(e: MotionEvent): Boolean = true

  /** Under the threshold it is a tap and the key's own letter is taken; past
   *  it, whichever axis moved further decides which corner. 18, squared to
   *  324 -- the same numbers as kbUp() in www/keyboard.js, in dp. */
  override fun onTouchEvent(e: MotionEvent): Boolean {
    when (e.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        val v = keyAt(e.x, e.y) ?: return true
        v.hold(true)
        down = v; downX = e.x; downY = e.y
      }
      MotionEvent.ACTION_CANCEL -> { down?.hold(false); down = null }
      MotionEvent.ACTION_UP -> {
        val d = down ?: return true
        down = null
        d.hold(false)
        val dx = (e.x - downX) / dp
        val dy = (e.y - downY) / dp
        var face: Face? = null
        val f = d.key.f
        if (dx * dx + dy * dy >= 324 && f != null && f.size == 4) {
          val i = if (abs(dx) > abs(dy)) (if (dx > 0) 1 else 3) else (if (dy > 0) 2 else 0)
          face = f[i] ?: return true            // an empty corner does nothing
        }
        listener?.pressed(d.key, face)
      }
    }
    return true
  }

  companion object {
    /** The app's sheet is KB_COLS half columns across (www/keyboard.js), and a
     *  key's width in them is kbU(). kb-check reads this number out of this
     *  file, as it reads KeyBoardView.swift's, and asks it is KB_COLS. */
    const val halfCols = 20
    fun halfUnits(w: Double): Int = max(1, (w * 2).roundToInt())
  }
}
