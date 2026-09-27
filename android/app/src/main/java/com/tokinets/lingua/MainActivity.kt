package com.tokinets.lingua

import android.os.Bundle
import android.view.View
import com.getcapacitor.BridgeActivity

/*
 * The Android half of ios/App/App/MainViewController.swift.
 *
 * Capacitor does not find a plugin by looking for it. A plugin that lives in
 * the app rather than in node_modules is handed to the bridge by name, before
 * super.onCreate() builds it -- the same thing registerPluginInstance() does
 * on the iOS side. A plugin written and not registered here is a name the
 * screen calls and nothing answers, which is why tools/android-check.mjs
 * reads this list.
 *
 * The screen reaches all three through Capacitor.nativePromise(name, method,
 * args) and nothing else (www/share.js § sharePlug), and each answers with
 * the same method names and the same shapes as its Swift twin.
 */
class MainActivity : BridgeActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    registerPlugin(LinguaSharePlugin::class.java)
    registerPlugin(LinguaStorePlugin::class.java)
    registerPlugin(LinguaPushPlugin::class.java)
    super.onCreate(savedInstanceState)
    /*
     * THE PAGE DOES NOT MOVE. iOS says it with `bounces = false`
     * (MainViewController.keepStill); the Android word for the same thing is
     * the overscroll stretch, and it is turned off for the same reason: the
     * screen is what is above the keyboard, and there is nothing past its
     * edge for a finger to pull into view.
     *
     * The keyboard itself needs nothing here. android:windowSoftInputMode=
     * "adjustResize" in AndroidManifest.xml makes the window shorter by the
     * keyboard below Android 15, and from Android 15 on -- where every app is
     * edge to edge and adjustResize no longer resizes -- Capacitor's own
     * SystemBars pads the web view's parent by the keyboard's height. Either
     * way what the page can see ends at the top of the keyboard, which is
     * what keepStill() does by hand on iOS. docs/ANDROID.md says what has
     * and has not been looked at on a phone.
     */
    bridge?.webView?.overScrollMode = View.OVER_SCROLL_NEVER
  }
}
