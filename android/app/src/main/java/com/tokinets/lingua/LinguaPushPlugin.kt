package com.tokinets.lingua

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.core.app.NotificationManagerCompat
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import org.json.JSONObject

/*
 * The Android half of ios/App/App/LinguaPush.swift -- the same two methods,
 * the same answers, and the same hand-over of a tapped notification.
 *
 *   ask     -> { token, platform: "android" }, or reject("denied") when the
 *              person said no. The token is Firebase Cloud Messaging's, and
 *              www/push.js hands it and the platform to netDevicePut(), so the
 *              `device` row says which road push-send takes (docs/ANDROID.md
 *              § 通知). iOS answers no platform and the column's default says
 *              `ios`.
 *   status  -> { status: "authorized" | "denied" | "notDetermined" }.
 *   a tap   -> window.pushOpened({ kind, post }), held until there is a page
 *              to hand it to.
 *
 * WITH NO FIREBASE, BOTH REFUSE, AND IT IS NOT 「denied」. Firebase is set up
 * by android/app/google-services.json, which is the owner's to put in and is
 * not in the repository yet; build.gradle applies the google-services plugin
 * only when that file is there, so the build is green without it and
 * FirebaseApp simply has no instance. `status: "denied"` is what www/push.js
 * draws as 「通知は…設定でオフになっています」 with a row into the settings --
 * a sentence that would be false here, sending somebody to switch on something
 * that was never off. A refusal leaves PUSH_ST at '' (「not answered」), which
 * is how the room is drawn in a browser: the switches, which are
 * `profile.prefs` and work, and no claim about the phone.
 */
@CapacitorPlugin(
  name = "LinguaPush",
  permissions = [
    Permission(alias = "notifications", strings = [Manifest.permission.POST_NOTIFICATIONS])
  ]
)
class LinguaPushPlugin : Plugin() {

  companion object {
    /* The channel push-send names (`CHANNEL` in supabase/functions/push-send/
       push.mjs). Android 8 and later drop a notification whose channel does
       not exist, so it is made on load, before any can arrive. */
    const val CHANNEL = "lingua"
    private const val NO_FIREBASE = "no notifications on Android yet"

    fun channel(ctx: Context) {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
      val nm = ctx.getSystemService(NotificationManager::class.java) ?: return
      if (nm.getNotificationChannel(CHANNEL) != null) return
      // "Lingua" is never translated (CLAUDE.md rule 2).
      nm.createNotificationChannel(
        NotificationChannel(CHANNEL, "Lingua", NotificationManager.IMPORTANCE_HIGH))
    }

    /* The two keys a notification carries for the app -- push-send's
       pushFcm() puts `kind` and `post` in `data`, and Android puts `data` on
       the launching intent. Nothing else on the intent is taken: it is
       somebody else's dictionary, from the server through Google. */
    fun tapOf(intent: Intent?): JSONObject? {
      val ex = intent?.extras ?: return null
      val kind = ex.getString("kind") ?: return null
      val o = JSONObject()
      o.put("kind", kind)
      ex.getString("post")?.let { if (it.isNotEmpty()) o.put("post", it) }
      return o
    }
  }

  /* A tap waiting for a page. Held rather than evaluated at once for the same
     reason as LinguaPush.swift's `pending`: the plugin loads before the web
     view has run www/push.js, and flush() is called again from ask and status,
     which www only calls once it is running. */
  private var pending: JSONObject? = null

  override fun load() {
    channel(context)
    took(activity?.intent)
  }

  override fun handleOnNewIntent(intent: Intent) {
    super.handleOnNewIntent(intent)
    took(intent)
  }

  private fun took(intent: Intent?) {
    val tap = tapOf(intent) ?: return
    /* Taken once: the activity keeps its intent, and a rotation or a return
       to the app must not open the same post again. */
    intent?.removeExtra("kind")
    intent?.removeExtra("post")
    pending = tap
    flush()
  }

  private fun flush() {
    val tap = pending ?: return
    val b = bridge ?: return
    pending = null
    b.eval("window.pushOpened && window.pushOpened(" + tap.toString() + ")", null)
  }

  private fun firebase(): Boolean = FirebaseApp.getApps(context).isNotEmpty()

  @PluginMethod
  fun ask(call: PluginCall) {
    if (!firebase()) { call.reject(NO_FIREBASE); return }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
        getPermissionState("notifications") != PermissionState.GRANTED) {
      requestPermissionForAlias("notifications", call, "askDone")
      return
    }
    askDone(call)
  }

  @PermissionCallback
  private fun askDone(call: PluginCall) {
    if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) {
      call.reject("denied")
      return
    }
    /* AND AN END TO IT, however Google's side behaves -- the same twenty
       seconds as LinguaPush.swift. Whichever comes first answers; the other
       finds the call already answered and does nothing. */
    var done = false
    val main = Handler(Looper.getMainLooper())
    main.postDelayed({
      if (!done) { done = true; call.reject("google did not answer") }
    }, 20000)
    FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
      main.post {
        if (done) return@post
        done = true
        val tok = if (task.isSuccessful) task.result else null
        if (tok.isNullOrEmpty()) {
          call.reject("token: " + (task.exception?.message ?: "none"))
        } else {
          val r = JSObject()
          r.put("token", tok)
          r.put("platform", "android")
          call.resolve(r)
        }
        flush()
      }
    }
  }

  @PluginMethod
  fun status(call: PluginCall) {
    if (!firebase()) { call.reject(NO_FIREBASE); return }
    /* Allowed means allowed by BOTH -- the permission and the app's switch in
       Android's settings -- which is what areNotificationsEnabled() answers.
       Never asked is only a state on Android 13 and later; before that there
       is no question and notifications are on until somebody turns them off. */
    val word = when {
      NotificationManagerCompat.from(context).areNotificationsEnabled() -> "authorized"
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
        getPermissionState("notifications") == PermissionState.PROMPT -> "notDetermined"
      else -> "denied"
    }
    flush()
    val r = JSObject()
    r.put("status", word)
    call.resolve(r)
  }
}
