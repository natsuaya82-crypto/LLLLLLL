package com.tokinets.lingua.keyboard

import android.content.Context
import android.content.res.Configuration
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.view.View
import kotlin.math.min

/*
 * GlyphView.kt -- one letter, on one key.
 *
 * The Android half of ios/App/LinguaKeyboard/GlyphView.swift. What arrives is
 * the ink, already cut by the app (LinguaFont.glyphContours): closed convex
 * polygons in `box` units, x right and y down. This file fills polygons and
 * does no arithmetic about letters, so it cannot drift from the app.
 *
 * Two rules, and which one depends on what it was given -- the Swift says why:
 *   a KEY    square, scaled to the smaller side, the shape centred in it
 *   a LINE   the height is the em, `dx` says where the ink starts (inkAdv())
 */
class GlyphView(c: Context) : View(c) {
  var poly: List<List<DoubleArray>>? = null
  var text: String? = null
  var box = 800f
  var dx: Float? = null
  var tone = Tone.of(c).label

  private val fill = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
  private val type = Paint(Paint.ANTI_ALIAS_FLAG)
  private val path = Path()

  override fun onDraw(canvas: Canvas) {
    val polys = poly
    if (polys.isNullOrEmpty()) {
      val s = text ?: return
      if (s.isEmpty()) return
      // Sized off the box a shape would have filled, so a drawn letter and an
      // undrawn one are the same weight on the same row.
      val side = min(width, height).toFloat()
      type.color = tone
      type.textSize = side * 0.62f
      type.textAlign = Paint.Align.CENTER
      val m = type.fontMetrics
      canvas.drawText(s, width / 2f, height / 2f - (m.ascent + m.descent) / 2f, type)
      return
    }
    val d = dx
    val side = if (d != null) height.toFloat() else min(width, height).toFloat()
    val k = side / box
    val ox = if (d != null) d * k else width / 2f - side / 2f
    val oy = height / 2f - side / 2f
    fill.color = tone
    for (p in polys) {
      val pts = p.filter { it.size >= 2 }
      if (pts.size < 3) continue
      path.reset()
      path.moveTo(ox + pts[0][0].toFloat() * k, oy + pts[0][1].toFloat() * k)
      for (q in pts.drop(1)) path.lineTo(ox + q[0].toFloat() * k, oy + q[1].toFloat() * k)
      path.close()
      canvas.drawPath(path, fill)
    }
  }
}

/*
 * The colours, in one place. They are iOS's system colours at their published
 * values, light and dark, because the Swift names those and a keyboard that
 * looks like a different keyboard on the other phone is the app having two
 * opinions about itself. The one iOS does not have to name is the backdrop --
 * an iOS keyboard sits on the system's own -- and an Android input method has
 * to paint its own; `back` is that, and it is a judgement a phone has to be
 * looked at for (docs/ANDROID.md § キーボード).
 */
class Tone(dark: Boolean) {
  val back = if (dark) Color.rgb(0x2B, 0x2B, 0x2D) else Color.rgb(0xD1, 0xD4, 0xDA)
  /** UIColor.label */
  val label = if (dark) Color.WHITE else Color.BLACK
  /** UIColor.secondaryLabel */
  val second = if (dark) Color.argb(153, 235, 235, 245) else Color.argb(153, 60, 60, 67)
  /** UIColor.tertiaryLabel */
  val third = if (dark) Color.argb(76, 235, 235, 245) else Color.argb(76, 60, 60, 67)
  /** UIColor.secondarySystemBackground -- a letter key. */
  val letter = if (dark) Color.rgb(0x1C, 0x1C, 0x1E) else Color.rgb(0xF2, 0xF2, 0xF7)
  /** UIColor.tertiarySystemFill -- every other key. */
  val other = if (dark) Color.argb(61, 118, 118, 128) else Color.argb(31, 118, 118, 128)
  /** UIColor.systemFill -- a key under the finger. */
  val held = if (dark) Color.argb(92, 120, 120, 128) else Color.argb(51, 120, 120, 128)

  companion object {
    fun of(c: Context): Tone = Tone(
      (c.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) ==
        Configuration.UI_MODE_NIGHT_YES)
  }
}
