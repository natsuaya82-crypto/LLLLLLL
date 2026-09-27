package com.tokinets.lingua

import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.media.ExifInterface
import android.net.Uri
import android.provider.Settings
import android.text.SpannableString
import android.text.style.ForegroundColorSpan
import android.util.Base64
import android.webkit.MimeTypeMap
import androidx.activity.result.ActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.core.content.FileProvider
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.ByteArrayOutputStream
import java.io.File
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/*
 * The Android half of ios/App/App/LinguaShare.swift -- the same twelve
 * methods, the same arguments, the same answers. The screen does not know
 * which phone it is on and must not have to: www/share.js, www/me.js,
 * www/post.js, www/rec.js, www/sheet.js, www/card.js, www/sound.js,
 * www/keyboard.js and www/push.js all call LinguaShare the one way
 * (Capacitor.nativePromise) and read the one shape back.
 *
 * Like the Swift, this class decides nothing. It writes down what it is
 * given, shows what it is told to show, and answers what happened.
 *
 * WHAT ANDROID DOES NOT HAVE YET IS SAID, NOT PRETENDED. Two methods answer
 * with a refusal on purpose -- `write` (there is no keyboard and no widget
 * on Android to hand anything to) and `renderPdf` (no renderer on this side
 * draws what somebody wrote on a page). Each says why where it stands, and
 * the screen already reads a refusal as the state it is: sharePush() keeps
 * it as SHARE.how, shPdfDraw() says the page could not be read.
 */
@CapacitorPlugin(name = "LinguaShare")
class LinguaSharePlugin : Plugin() {

  // ---- the App Group ------------------------------------------------------
  //
  // On iOS this is the shared folder between the app and its keyboard and
  // widgets. Android has neither yet -- the input method and the home screen
  // widget are the next round (docs/ANDROID.md) -- so there is nobody to
  // write for. Resolving here would put `sent` in SHARE.how while the letters
  // went nowhere, which is the exact failure www/share.js says took three
  // builds to see. So it refuses, and the refusal is what SHARE.how keeps.
  @PluginMethod
  fun write(call: PluginCall) {
    call.reject("no keyboard or widget on Android yet")
  }

  // ---- the paper ------------------------------------------------------------
  //
  // www/sheet.js (chapter 26) and www/card.js build the bytes; this writes
  // them into the cache for as long as it takes to hand them over, exactly
  // as LinguaShare.swift writes into the temporary folder. The cache is the
  // folder Android empties on its own and does not back up.
  //
  // THE FENCE IS THIS ONE FOLDER. res/xml/file_paths.xml names `Sheets/`
  // under the cache and nothing else of this app's, so shareFile() can only
  // ever hand over what sheet() wrote.

  private fun sheets(): File {
    val dir = File(context.cacheDir, SHEET_DIR)
    if (!dir.exists()) dir.mkdirs()
    return dir
  }

  /** `ext` defaults to `pdf`; letters and digits only, ASCII only, and at
   *  most eight -- the same fence as the Swift, for the same reason: it is
   *  pasted into a file name. */
  @PluginMethod
  fun sheet(call: PluginCall) {
    val name = call.getString("name") ?: "sheet"
    val ext = call.getString("ext") ?: "pdf"
    val b64 = call.getString("b64") ?: ""
    if (ext.isEmpty() || ext.length > 8 || !ext.all { it.code < 128 && it.isLetterOrDigit() }) {
      call.reject("not a file extension")
      return
    }
    // A slash is refused rather than cleaned, as voiceAt() does in the
    // Swift: with one in it the name would be a path, and a path can leave
    // the fence. On iOS the same name fails at the write.
    if (name.contains('/')) {
      call.reject("not a file name")
      return
    }
    val bytes = try { Base64.decode(b64, Base64.DEFAULT) } catch (e: IllegalArgumentException) { null }
    if (bytes == null || bytes.isEmpty()) {
      call.reject("nothing to write")
      return
    }
    try {
      val dir = sheets()
      var file = File(dir, "$name.$ext")
      var n = 2
      while (file.exists()) {
        file = File(dir, "$name $n.$ext")
        n += 1
        if (n > 999) { call.reject("too many sheets of that name"); return }
      }
      file.writeBytes(bytes)
      call.resolve(JSObject().put("file", file.name))
    } catch (e: Exception) {
      call.reject(e.message ?: "the sheet could not be written")
    }
  }

  /**
   * Android's own share sheet, so a person can put the file where they want
   * it -- 「普通に共有画面みたいなやつから保存してそこでファイルに保存させてくれ」
   * OWNER 2026-08-27, which is why the Swift exists too.
   *
   * It resolves the moment the sheet is up, as the Swift does. What somebody
   * chooses after that is not answered and not guessed.
   *
   * THE FILE IS NOT REMOVED WHEN THE SHEET CLOSES, and that is the one place
   * this differs from the Swift. iOS copies what it saves or sends before its
   * completion handler runs; on Android the app that was chosen reads the
   * file through the content URI whenever it gets round to it, and nothing
   * tells this side when that is. Removing it on return would hand a
   * half-read file to somebody's Drive. So it stays in the cache until
   * dropOldSheets() -- which www/sheet.js § shDropOld asks at every launch --
   * takes the folder, or Android empties the cache first. docs/ANDROID.md
   * carries it as a difference, because 「渡したら端末に残さない」
   * (OWNER 2026-09-26) is the owner's and this is the nearest it can be kept.
   */
  @PluginMethod
  fun shareFile(call: PluginCall) {
    val name = call.getString("file") ?: ""
    if (name.isEmpty() || name.contains('/') || name == "." || name == "..") {
      call.reject("no sheet of that name")
      return
    }
    val file = File(sheets(), name)
    if (!file.exists()) {
      call.reject("that sheet is not here any more")
      return
    }
    val host = activity
    if (host == null) {
      call.reject("no activity")
      return
    }
    host.runOnUiThread {
      try {
        val uri = FileProvider.getUriForFile(context, context.packageName + ".fileprovider", file)
        val ext = name.substringAfterLast('.', "").lowercase()
        val mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext) ?: "application/octet-stream"
        val send = Intent(Intent.ACTION_SEND)
        send.type = mime
        send.putExtra(Intent.EXTRA_STREAM, uri)
        // ClipData as well as the extra: it is what carries the read grant
        // through the chooser to the app that is finally picked.
        send.clipData = ClipData.newRawUri(name, uri)
        send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        host.startActivity(Intent.createChooser(send, null))
        call.resolve(JSObject().put("shown", true))
      } catch (e: Exception) {
        call.reject(e.message ?: "the share sheet would not open")
      }
    }
  }

  /**
   * NOT ON ANDROID YET, AND THE REASON IS THE WHOLE OF LinguaPdf.swift.
   *
   * A sheet written on with a pencil on a screen keeps every stroke as a PDF
   * ANNOTATION. Android's own renderer (android.graphics.pdf.PdfRenderer)
   * draws a page's content and not its annotations, so a page drawn by it
   * comes back as the blank sheet it was printed as -- the four marks found,
   * the strip read, every box empty. That is the right-looking answer with
   * the person's work missing out of it, which LinguaPdf.swift exists to
   * refuse, and a refusal here is the honest version of it: shPdfDraw() in
   * www/sheet.js says the page could not be read.
   *
   * A sheet that was PHOTOGRAPHED or SCANNED does not come here at all --
   * www/sheet.js takes the JPEG straight out of the file -- so reading paper
   * works on Android today. What is missing is only a sheet written on with
   * a screen. The road to it (a PDFium build that draws annotations) is in
   * docs/ANDROID.md.
   */
  @PluginMethod
  fun renderPdf(call: PluginCall) {
    call.reject("no renderer on Android draws what was written on the page")
  }

  /** The cache's `Sheets/`, whole: a hand-over from an earlier launch. It is
   *  the only folder sheet() ever writes into. Nothing else is touched and no
   *  folder is nothing to do. */
  @PluginMethod
  fun dropOldSheets(call: PluginCall) {
    try {
      val dir = File(context.cacheDir, SHEET_DIR)
      if (dir.exists()) dir.deleteRecursively()
      call.resolve()
    } catch (e: Exception) {
      call.reject(e.message ?: "the old sheets could not be removed")
    }
  }

  // ---- the voice on a post ------------------------------------------------
  //
  // On iOS these three read and remove files an EARLIER BUILD kept in
  // Documents/Voices: a recording has gone straight to the `post-media`
  // bucket since 2026-09-26 (www/rec.js § voKeep), and nothing writes a
  // voice file on the phone any more. No Android build ever came before
  // that, so on Android the folder has never existed and never will. The
  // answers below are that fact, given in the Swift's shapes: no voice by
  // that name, nothing to drop, nothing swept. The same arguments are
  // refused as there, so a caller that is wrong is told so on both phones.

  private fun badVoiceName(name: String): Boolean =
    name.isEmpty() || name.contains('/') || name.contains("..") || name.length >= 80

  @PluginMethod
  fun voice(call: PluginCall) {
    val name = call.getString("name") ?: ""
    if (badVoiceName(name)) { call.reject("bad name"); return }
    call.reject("no voice by that name")
  }

  /** A file that is not there is a success, as the Swift says: there is
   *  nothing left to do and it is done. */
  @PluginMethod
  fun dropVoice(call: PluginCall) {
    val name = call.getString("name") ?: ""
    if (badVoiceName(name)) { call.reject("bad name"); return }
    call.resolve()
  }

  /** NO LIST IS NOT AN EMPTY LIST -- refused as the Swift refuses it. */
  @PluginMethod
  fun sweepVoices(call: PluginCall) {
    if (call.getArray("keep") == null) { call.reject("no list of what to keep"); return }
    // Asked of the raw value and not getDouble(): Date.now() arrives as a
    // Long, and PluginCall.getDouble() answers null for a Long -- which would
    // refuse every call the screen ever makes.
    if (call.data.opt("before") !is Number) { call.reject("no time to keep newer files from"); return }
    call.resolve(JSObject().put("dropped", 0))
  }

  // ---- settings, and the phone's audio --------------------------------------

  /** This app's own page in Android's settings -- where notifications and the
   *  microphone are turned back on. The Android word for iOS's
   *  openSettingsURLString. */
  @PluginMethod
  fun settings(call: PluginCall) {
    val i = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                   Uri.fromParts("package", context.packageName, null))
    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    try {
      context.startActivity(i)
      call.resolve()
    } catch (e: ActivityNotFoundException) {
      call.reject("settings would not open")
    }
  }

  /**
   * iOS switches its audio session's CATEGORY around a recording so that
   * somebody's music is not stopped (「音楽はいつのタイミングでもとめないで
   * ほしい」). Android has no category to switch: the web view's microphone
   * is opened by the page (getUserMedia) and nothing here holds audio focus.
   * So there is nothing to do, and it is done -- the one honest answer to
   * being asked to set a thing this phone does not have.
   *
   * Whether the web view itself takes somebody's music away while a voice
   * PLAYS is a different question and is a phone's to answer; docs/ANDROID.md
   * lists it among what has not been looked at.
   */
  @PluginMethod
  fun audio(call: PluginCall) {
    call.resolve()
  }

  // ---- the system's own dialog, and the person's own photographs ------------

  /**
   * The system's own list for choosing what to do to one thing -- the
   * Android form of the UIAlertController action sheet the Swift puts up.
   * 「アイコンをタップした時にiPhone標準の写真を選ぶか、削除するか出てくる
   * やつでいいだろ」 OWNER 2026-09-01, under 「システム標準（iOS/Android）を
   * 最優先」. It is AppCompat's AlertDialog, which is the platform's own dialog
   * in the app's day/night theme; nothing about it is drawn in HTML.
   *
   * It DECIDES NOTHING. The words, their order and which one takes something
   * away are the screen's; what comes back is the index pressed. Android has
   * no 「destructive」 style, so that one item is drawn in red, which is what
   * the style means on iOS.
   *
   * CANCELLED IS AN ANSWER AND NOT A REJECTION -- `i: -1` for the cancel
   * button, the back gesture and a tap outside alike, and exactly once.
   */
  @PluginMethod
  fun ask(call: PluginCall) {
    val arr = call.getArray("options") ?: JSArray()
    val opts = ArrayList<String>()
    for (k in 0 until arr.length()) {
      val v = arr.opt(k)
      if (v is String) opts.add(v)
    }
    if (opts.isEmpty()) { call.reject("nothing to choose from"); return }
    val cancel = call.getString("cancel") ?: "Cancel"
    val destroy = call.getInt("destroy") ?: -1
    val title = call.getString("title")
    val host = activity
    if (host == null) { call.reject("no activity"); return }
    host.runOnUiThread {
      var answered = false
      fun answer(i: Int) {
        if (answered) return
        answered = true
        call.resolve(JSObject().put("i", i))
      }
      val items = Array<CharSequence>(opts.size) { k ->
        if (k == destroy) {
          val red = SpannableString(opts[k])
          red.setSpan(ForegroundColorSpan(DESTROY_RED), 0, red.length, 0)
          red
        } else opts[k]
      }
      val b = AlertDialog.Builder(host)
        .setItems(items) { _, k -> answer(k) }
        .setNegativeButton(cancel) { _, _ -> answer(-1) }
        .setOnCancelListener { answer(-1) }
      if (!title.isNullOrEmpty()) b.setTitle(title)
      b.show()
    }
  }

  /**
   * Android's own photo picker -- the library and nothing else, the way the
   * Swift uses PHPicker rather than a file field. It runs outside this app,
   * so it needs no permission: the app is handed what was chosen and never
   * sees the rest. On a phone too old for the picker, androidx hands the same
   * request to the system's document chooser filtered to pictures.
   *
   * `max` is the long edge the screen wants (www/post.js owns POST_PIC,
   * www/me.js owns ME_PIC) and `limit` how many more the post has room for.
   * Cancelled is an empty answer, never a rejection.
   */
  @PluginMethod
  fun pickPhoto(call: PluginCall) {
    val limit = max(1, min(call.getInt("limit") ?: 1, 10))
    val req = PickVisualMediaRequest.Builder()
      .setMediaType(ActivityResultContracts.PickVisualMedia.ImageOnly)
      .build()
    val intent = if (limit > 1)
      ActivityResultContracts.PickMultipleVisualMedia(limit).createIntent(context, req)
    else
      ActivityResultContracts.PickVisualMedia().createIntent(context, req)
    startActivityForResult(call, intent, "photoDone")
  }

  /** Every one that was chosen, in the order they were chosen, each at most
   *  `max` along its long edge. One that will not load is dropped rather than
   *  left as a hole, as PhotoPicker does in the Swift. Off the main thread:
   *  four twelve-megapixel photographs are not decoded on it. */
  @ActivityCallback
  fun photoDone(call: PluginCall?, result: ActivityResult) {
    if (call == null) return
    val edge = call.getInt("max") ?: 1200
    val limit = max(1, min(call.getInt("limit") ?: 1, 10))
    val uris: List<Uri> = if (limit > 1)
      ActivityResultContracts.PickMultipleVisualMedia(limit).parseResult(result.resultCode, result.data)
    else
      listOfNotNull(ActivityResultContracts.PickVisualMedia().parseResult(result.resultCode, result.data))
    Thread {
      val out = ArrayList<String>()
      // The document chooser a phone without the picker falls back to does
      // not enforce the limit, so it is enforced here.
      for (u in uris.take(limit)) {
        val s = try { jpegOf(u, edge) } catch (e: Exception) { null }
        if (s != null) out.add(s)
      }
      // `b64` stays, and is the first of them, as in the Swift.
      val ans = JSObject()
      ans.put("b64", if (out.isEmpty()) "" else out[0])
      ans.put("b64s", JSArray(out))
      call.resolve(ans)
    }.start()
  }

  /**
   * One picture, down to `edge` along its long side and never up, turned the
   * way the camera meant it (EXIF), on white, as JPEG at 0.9 -- the same
   * answer PhotoPicker.jpeg gives on iOS. White behind it because a JPEG has
   * no transparency and a transparent PNG would otherwise come out black.
   *
   * Decoded at a power-of-two sample first, so a twelve-megapixel photograph
   * never has to be held whole to be made small.
   */
  private fun jpegOf(uri: Uri, edge: Int): String? {
    val cr = context.contentResolver
    val bounds = BitmapFactory.Options()
    bounds.inJustDecodeBounds = true
    cr.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) } ?: return null
    val w0 = bounds.outWidth
    val h0 = bounds.outHeight
    if (w0 <= 0 || h0 <= 0) return null
    var sample = 1
    while (max(w0, h0) / (sample * 2) >= edge) sample *= 2
    val opts = BitmapFactory.Options()
    opts.inSampleSize = sample
    val raw = cr.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, opts) } ?: return null
    val turn = cr.openInputStream(uri)?.use {
      ExifInterface(it).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
    } ?: ExifInterface.ORIENTATION_NORMAL
    val m = Matrix()
    when (turn) {
      ExifInterface.ORIENTATION_ROTATE_90 -> m.postRotate(90f)
      ExifInterface.ORIENTATION_ROTATE_180 -> m.postRotate(180f)
      ExifInterface.ORIENTATION_ROTATE_270 -> m.postRotate(270f)
      ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> m.postScale(-1f, 1f)
      ExifInterface.ORIENTATION_FLIP_VERTICAL -> m.postScale(1f, -1f)
      ExifInterface.ORIENTATION_TRANSPOSE -> { m.postRotate(90f); m.postScale(-1f, 1f) }
      ExifInterface.ORIENTATION_TRANSVERSE -> { m.postRotate(270f); m.postScale(-1f, 1f) }
    }
    val upright = if (m.isIdentity) raw else Bitmap.createBitmap(raw, 0, 0, raw.width, raw.height, m, true)
    val w = upright.width
    val h = upright.height
    val k = min(1.0, edge.toDouble() / max(w, h).toDouble())
    val ow = max(1, (w * k).roundToInt())
    val oh = max(1, (h * k).roundToInt())
    val out = Bitmap.createBitmap(ow, oh, Bitmap.Config.ARGB_8888)
    val g = Canvas(out)
    g.drawColor(Color.WHITE)
    val fit = Matrix()
    fit.setScale(ow.toFloat() / w, oh.toFloat() / h)
    g.drawBitmap(upright, fit, Paint(Paint.FILTER_BITMAP_FLAG))
    val bytes = ByteArrayOutputStream()
    out.compress(Bitmap.CompressFormat.JPEG, 90, bytes)
    return Base64.encodeToString(bytes.toByteArray(), Base64.NO_WRAP)
  }

  companion object {
    /** The Swift's `sheetDir`, and the one path res/xml/file_paths.xml opens. */
    const val SHEET_DIR = "Sheets"
    /** The red a destructive choice wears. */
    private const val DESTROY_RED = 0xFFD32F2F.toInt()
  }
}
