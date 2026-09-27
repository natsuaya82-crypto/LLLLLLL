package com.tokinets.lingua

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/*
 * The Android half of ios/App/App/LinguaPush.swift -- the same two methods.
 *
 * THERE ARE NO NOTIFICATIONS ON ANDROID YET. How they would reach an Android
 * phone (Firebase Cloud Messaging, and push-send on the server learning to
 * speak to it) is the owner's to decide and has not been (docs/ANDROID.md).
 * Until then there is no address to give and no permission worth asking for:
 * a permission granted for notifications that nothing can send is a question
 * put to somebody for nothing.
 *
 * So both refuse, and it is NOT 「denied」. `status: "denied"` is what iOS
 * says when a person turned notifications off, and www/push.js draws it as
 * 「通知は…設定でオフになっています」 with a row into the settings -- a
 * sentence that would be false here, sending somebody to switch on something
 * that was never off. A refusal leaves PUSH_ST at '' (「not answered」), which
 * is how the room is drawn in a browser: the switches, which are
 * `profile.prefs` and work, and no claim about the phone.
 */
@CapacitorPlugin(name = "LinguaPush")
class LinguaPushPlugin : Plugin() {

  @PluginMethod
  fun ask(call: PluginCall) {
    call.reject("no notifications on Android yet")
  }

  @PluginMethod
  fun status(call: PluginCall) {
    call.reject("no notifications on Android yet")
  }
}
