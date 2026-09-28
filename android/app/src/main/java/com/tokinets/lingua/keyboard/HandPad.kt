package com.tokinets.lingua.keyboard

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.DashPathEffect
import android.graphics.Paint
import android.graphics.Path
import android.os.Handler
import android.os.Looper
import android.view.MotionEvent
import android.view.View
import android.webkit.WebView
import android.webkit.WebViewClient
import org.json.JSONArray
import kotlin.math.min

/*
 * HandPad.kt -- the handwriting face: somewhere to write, and which letter was
 * written. The Android half of ios/App/LinguaKeyboard/HandPad.swift.
 *
 * WHICH LETTER IS NEAREST IS NOT WORKED OUT HERE. It is hand.js -- the same
 * bytes the iOS keyboard runs in JavaScriptCore and tools/hand-check.mjs runs
 * in Node. A third copy of the measure in Kotlin would be a second answer to
 * one question with nothing able to see the two come apart, which is the
 * reason the Swift gives for not writing it in Swift.
 *
 * Android has no JavaScriptCore to hand. What it has is the system WebView,
 * so hand.js runs in one that is never put on screen. android/app/build.gradle
 * copies ios/App/LinguaKeyboard/hand.js into the app's assets at build time
 * (task linguaHandJs) -- copied, not kept twice in git.
 *
 * DEVICE UNCONFIRMED. There is no Android SDK in the session that wrote this.
 */
class Hand private constructor(private val web: WebView) {
  private var ready = false
  private val waiting = ArrayList<() -> Unit>()

  /** The letters the strokes are nearest to, nearest first, as indexes into
   *  Board.hand, handed to `done` on the main thread. Empty for none. */
  fun nearest(strokes: List<List<FloatArray>>, done: (List<Int>) -> Unit) {
    val s = JSONArray()
    for (st in strokes) {
      val a = JSONArray()
      for (p in st) a.put(JSONArray().put(p[0].toDouble()).put(p[1].toDouble()))
      s.put(a)
    }
    val ask = {
      web.evaluateJavascript("handRank(__lingua, $s)") { r ->
        val out = ArrayList<Int>()
        try {
          val a = JSONArray(r)
          for (i in 0 until a.length()) out.add(a.getInt(i))
        } catch (e: Exception) { /* not an array: nothing to offer */ }
        done(out)
      }
    }
    if (ready) ask() else waiting.add(ask)
  }

  fun close() { web.destroy() }

  companion object {
    /** `inks` is every drawn letter's ink in the order of Board.hand, null where
     *  a face carries no shape. Null back when hand.js is not in the app -- the
     *  pad then writes and nothing goes in, which is the keyboard not knowing
     *  rather than the keyboard guessing. */
    @SuppressLint("SetJavaScriptEnabled")
    fun make(c: Context, inks: List<List<List<DoubleArray>>?>): Hand? {
      val src = try {
        c.assets.open("keyboard/hand.js").bufferedReader().use { it.readText() }
      } catch (e: Exception) { return null }
      val arg = JSONArray()
      for (ink in inks) {
        if (ink == null) { arg.put(JSONArray()); continue }
        val polys = JSONArray()
        for (p in ink) {
          val pts = JSONArray()
          for (q in p) pts.put(JSONArray().also { a -> for (n in q) a.put(n) })
          polys.put(pts)
        }
        arg.put(polys)
      }
      val web = WebView(c)
      web.settings.javaScriptEnabled = true
      val h = Hand(web)
      web.webViewClient = object : WebViewClient() {
        override fun onPageFinished(view: WebView, url: String?) {
          if (h.ready) return
          view.evaluateJavascript("$src\n;var __lingua = handPrep($arg); 1") {
            h.ready = true
            val q = ArrayList(h.waiting); h.waiting.clear()
            for (f in q) f()
          }
        }
      }
      web.loadDataWithBaseURL(null, "<!doctype html><title></title>", "text/html", "utf-8", null)
      return h
    }
  }
}

interface HandPadListener {
  fun wrote(strokes: List<List<FloatArray>>)
}

/** Where the finger writes. The line follows the finger and is gone the moment
 *  the letter goes in. Under it, a square and a cross through it -- the guide
 *  every handwriting pad draws, never read. 「四角形と十字とか入れてあげたら？」
 *  OWNER 2026-09-25. */
class HandPad(c: Context) : View(c) {
  var listener: HandPadListener? = null
  private val strokes = ArrayList<ArrayList<FloatArray>>()
  private val dp = resources.displayMetrics.density
  private val tone = Tone.of(c)
  private val line = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    style = Paint.Style.STROKE
    strokeWidth = 4 * dp
    strokeCap = Paint.Cap.ROUND
    strokeJoin = Paint.Join.ROUND
    color = tone.label
  }
  private val guide = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    style = Paint.Style.STROKE
    strokeWidth = 1 * dp
    pathEffect = DashPathEffect(floatArrayOf(4 * dp, 4 * dp), 0f)
    color = tone.third
  }
  private val path = Path()
  private val wait = Handler(Looper.getMainLooper())
  private val fire = Runnable { done() }

  override fun onDraw(canvas: Canvas) {
    val side = min(width, height) * 0.86f
    val l = width / 2f - side / 2f
    val t = height / 2f - side / 2f
    path.reset()
    path.addRect(l, t, l + side, t + side, Path.Direction.CW)
    path.moveTo(l + side / 2f, t); path.lineTo(l + side / 2f, t + side)
    path.moveTo(l, t + side / 2f); path.lineTo(l + side, t + side / 2f)
    canvas.drawPath(path, guide)
    path.reset()
    for (s in strokes) {
      val first = s.firstOrNull() ?: continue
      path.moveTo(first[0], first[1])
      if (s.size == 1) path.lineTo(first[0], first[1])
      for (q in s.drop(1)) path.lineTo(q[0], q[1])
    }
    canvas.drawPath(path, line)
  }

  override fun onTouchEvent(e: MotionEvent): Boolean {
    when (e.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        wait.removeCallbacks(fire)
        strokes.add(arrayListOf(floatArrayOf(e.x, e.y)))
      }
      MotionEvent.ACTION_MOVE -> {
        val s = strokes.lastOrNull() ?: return true
        for (i in 0 until e.historySize) s.add(floatArrayOf(e.getHistoricalX(i), e.getHistoricalY(i)))
        s.add(floatArrayOf(e.x, e.y))
      }
      MotionEvent.ACTION_UP -> {
        strokes.lastOrNull()?.add(floatArrayOf(e.x, e.y))
        later()
      }
      MotionEvent.ACTION_CANCEL -> later()
    }
    invalidate()
    return true
  }

  private fun later() {
    wait.removeCallbacks(fire)
    wait.postDelayed(fire, PAUSE_MS)
  }

  private fun done() {
    val s: List<List<FloatArray>> = ArrayList(strokes)
    strokes.clear()
    invalidate()
    if (s.isNotEmpty()) listener?.wrote(s)
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    wait.removeCallbacks(fire)
  }

  companion object {
    /** How long the finger has to stay off before what was written is read --
     *  HandPad.swift's `pause`, 0.6 s. The owner's to change, in both. */
    const val PAUSE_MS = 600L
  }
}
