package com.tokinets.lingua.keyboard

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/*
 * Shared.kt -- what the keyboard is given, and nothing else.
 *
 * The Android half of ios/App/LinguaKeyboard/Shared.swift, and the same
 * position: this is the reading side. It has never seen the language it is
 * about to draw -- no alphabet, no letter ids, no font writer -- which is
 * the position www/post.js is in when it draws somebody else's post. A key
 * already carries what it types and the shape it wears. This file turns
 * bytes into that and stops.
 *
 * The fields are the Swift's, one for one, because they are one file: the
 * JSON www/share.js § shareKbd() writes. What each field means is said once,
 * over the Swift, and not said again here.
 */

/** A key face: what pressing it inserts, and what it looks like. `st` the
 *  shape somebody drew, `ch` a character they borrowed, `t` itself. */
class Face(
  val t: String?,
  val st: List<List<DoubleArray>>?,
  val ch: String?,
  val aw: Double?,
  val dx: Double?,
)

/** One key. `k` says what it does: lt sp del ret gap lay next rom. */
class Key(
  val k: String,
  val w: Double?,
  val to: Int?,
  val t: String?,
  val nm: String?,
  val st: List<List<DoubleArray>>?,
  val ch: String?,
  val f: List<Face?>?,
  val aw: Double?,
  val dx: Double?,
  val h: Int?,
) {
  /** The one key the keyboard makes for itself: the globe on the board that
   *  could not be read (Key(k:) in Shared.swift). */
  constructor(k: String) : this(k, 1.0, null, null, null, null, null, null, null, null, null)

  val width: Double get() = w ?: 1.0
  val tall: Int get() = maxOf(1, h ?: 1)
  val face: Face get() = Face(t, st, ch, aw, dx)
}

class Layer(val rows: List<List<Key>>, val hand: Int? = null)

class Conv(val how: String, val max: Int, val map: Map<String, IntArray>)

class Board(
  val v: Int,
  val box: Double,
  val mark: Int?,
  val lay: List<Layer>,
  val ink: List<Face>?,
  val conv: Conv?,
  val rom: Int?,
  val hand: List<Face>?,
)

object Shared {
  /* WHERE THE APP PUTS IT. On iOS the app and its keyboard are two processes
     with two sandboxes, and the App Group is the folder both can see. On
     Android the input method is a service of THE SAME APP -- the same package,
     the same user id, the same private storage -- so there is no group to
     make: the app's own files are the folder both can see.

     The folder and the three names are the Swift's (LinguaShare.swift: group,
     jsonName, numName, fontName). LinguaSharePlugin.write() writes it; this
     only reads. Nothing is written from this side, as on iOS.

     Credential-encrypted storage, the default, which is readable from the
     first unlock after a boot onwards -- the same thing iOS's
     completeFileProtectionUntilFirstUserAuthentication says. */
  const val dirName = "LinguaKeyboard"
  const val jsonName = "keyboard.json"
  const val numName = "widget.json"
  const val fontName = "LinguaScript.otf"

  fun dir(c: Context): File = File(c.filesDir, dirName)

  /** Null for every reason equally: nothing written yet, a file from a version
   *  that does not exist, a file that will not parse. The caller has one thing
   *  to say either way, so there is nothing to tell apart. */
  fun board(c: Context): Board? {
    val f = File(dir(c), jsonName)
    if (!f.isFile) return null
    return parse(try { f.readText() } catch (e: Exception) { return null })
  }

  /** The same answer from the bytes themselves. */
  fun parse(text: String): Board? {
    val b = try { board(JSONObject(text)) } catch (e: Exception) { null } ?: return null
    return if (b.lay.isEmpty()) null else b
  }

  private fun board(o: JSONObject): Board? {
    val lays = o.optJSONArray("lay") ?: return null
    return Board(
      v = o.optInt("v", 0),
      box = o.optDouble("box", 800.0),
      mark = int(o, "mark"),
      lay = (0 until lays.length()).map { layer(lays.getJSONObject(it)) },
      ink = o.optJSONArray("ink")?.let { a -> (0 until a.length()).map { face(a.getJSONObject(it)) } },
      conv = o.optJSONObject("conv")?.let { conv(it) },
      rom = int(o, "rom"),
      hand = o.optJSONArray("hand")?.let { a -> (0 until a.length()).map { face(a.getJSONObject(it)) } },
    )
  }

  private fun layer(o: JSONObject): Layer {
    val rows = o.getJSONArray("rows")
    return Layer(
      rows = (0 until rows.length()).map { r ->
        val a = rows.getJSONArray(r)
        (0 until a.length()).map { key(a.getJSONObject(it)) }
      },
      hand = int(o, "hand"),
    )
  }

  private fun key(o: JSONObject): Key = Key(
    k = o.getString("k"),
    w = num(o, "w"),
    to = int(o, "to"),
    t = str(o, "t"),
    nm = str(o, "nm"),
    st = poly(o.optJSONArray("st")),
    ch = str(o, "ch"),
    f = o.optJSONArray("f")?.let { a ->
      (0 until a.length()).map { i -> if (a.isNull(i)) null else face(a.getJSONObject(i)) }
    },
    aw = num(o, "aw"),
    dx = num(o, "dx"),
    h = int(o, "h"),
  )

  private fun face(o: JSONObject): Face =
    Face(str(o, "t"), poly(o.optJSONArray("st")), str(o, "ch"), num(o, "aw"), num(o, "dx"))

  private fun conv(o: JSONObject): Conv {
    val m = o.getJSONObject("map")
    val map = HashMap<String, IntArray>()
    for (k in m.keys()) {
      val a = m.getJSONArray(k)
      map[k] = IntArray(a.length()) { a.getInt(it) }
    }
    return Conv(o.getString("how"), o.getInt("max"), map)
  }

  /** Closed convex polygons in the box, each a list of [x, y]. */
  private fun poly(a: JSONArray?): List<List<DoubleArray>>? {
    if (a == null) return null
    return (0 until a.length()).map { i ->
      val p = a.getJSONArray(i)
      (0 until p.length()).map { j ->
        val q = p.getJSONArray(j)
        DoubleArray(q.length()) { q.getDouble(it) }
      }
    }
  }

  private fun str(o: JSONObject, n: String): String? = if (o.has(n) && !o.isNull(n)) o.getString(n) else null
  private fun num(o: JSONObject, n: String): Double? = if (o.has(n) && !o.isNull(n)) o.getDouble(n) else null
  private fun int(o: JSONObject, n: String): Int? = if (o.has(n) && !o.isNull(n)) o.getInt(n) else null
}

/*
 * The keyboard's own sentence. There is one, and it is the Swift's `Say`,
 * word for word: it is shown when the file the app writes cannot be read,
 * which is exactly when nothing the app wrote -- translations included --
 * can be read either. So it carries its own.
 *
 * It is a THIRD place for the string now (www/i18n, Shared.swift, here), and
 * nothing checks the three against each other. tools/i18n-check.mjs reads
 * www/. Do not add a second sentence without deciding that again.
 */
object Say {
  fun draw(c: Context): String = pick(c, nothingYet)

  private fun pick(c: Context, t: Map<String, String>): String {
    val ls = c.resources.configuration.locales
    for (i in 0 until ls.size()) {
      t[ls.get(i).language.take(2)]?.let { return it }
    }
    return t.getValue("en")
  }

  private val nothingYet = mapOf(
    "en" to "Draw some letters in Lingua first.",
    "ja" to "先に Lingua で文字を描いてください。",
    "es" to "Primero dibuja algunas letras en Lingua.",
    "pt" to "Desenhe algumas letras no Lingua primeiro.",
    "fr" to "Dessinez d'abord des lettres dans Lingua.",
    "de" to "Zeichne zuerst ein paar Buchstaben in Lingua.",
    "it" to "Disegna prima qualche lettera in Lingua.",
    "ru" to "Сначала нарисуйте буквы в Lingua.",
    "zh" to "请先在 Lingua 里画一些文字。",
    "ko" to "먼저 Lingua에서 글자를 그려 주세요.",
  )
}
