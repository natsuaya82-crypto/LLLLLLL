package com.tokinets.lingua

import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.play.core.review.ReviewManagerFactory

/*
 * The Android half of ios/App/App/LinguaStore.swift -- the same six methods,
 * and www/store.js does not know which phone it is on.
 *
 * THERE IS NO STORE ON ANDROID YET, AND FIVE OF THE SIX SAY SO. How a plan is
 * bought on Android -- Google Play Billing, the products, the prices, how the
 * server is told -- is the owner's to decide and has not been decided
 * (docs/ANDROID.md). Until it is, each method answers with the state as it
 * is, and every answer lands where www/store.js already puts 「the store
 * could not help」:
 *
 *   products  an empty list          -> 「まだ販売されていません」, which on
 *                                        Android is simply true
 *   current   refused                -> netPlanVerify([]): the server is
 *                                        asked what this ACCOUNT pays, so a
 *                                        plan bought on an iPhone is the plan
 *                                        here too
 *   buy       refused                -> nothing is bought and it says so
 *   restore   refused                -> the same
 *   manage    refused                -> the same
 *
 * "A failed check means fewer buttons, never fewer words" (CLAUDE.md
 * § Money): a refusal here takes away a button's result and never a word --
 * no byte of anybody's language depends on any of this, and plan-check holds
 * that on the screen's side.
 *
 * The sixth is Google Play's own request for a rating, and that one is real.
 */
@CapacitorPlugin(name = "LinguaStore")
class LinguaStorePlugin : Plugin() {

  @PluginMethod
  fun products(call: PluginCall) {
    call.resolve(JSObject().put("products", JSArray()))
  }

  @PluginMethod
  fun current(call: PluginCall) {
    call.reject("no store")
  }

  @PluginMethod
  fun buy(call: PluginCall) {
    call.reject("no store")
  }

  @PluginMethod
  fun restore(call: PluginCall) {
    call.reject("no store")
  }

  @PluginMethod
  fun manage(call: PluginCall) {
    call.reject("no store")
  }

  /**
   * Google Play's own request for a rating -- the Android form of the App
   * Store's, which is the second of the two system dialogs CLAUDE.md § Shape
   * allows (「評価のやつつけよう」 OWNER 2026-09-25). WHEN it is asked is
   * www/core.js § rateOpen and nowhere here; WHETHER anything appears is
   * Google Play's, which keeps its own quota and says nothing about it. So,
   * as in the Swift, this answers only that it asked.
   */
  @PluginMethod
  fun review(call: PluginCall) {
    val host = activity
    if (host == null) { call.reject("no activity"); return }
    val manager = ReviewManagerFactory.create(context)
    manager.requestReviewFlow().addOnCompleteListener { req ->
      if (!req.isSuccessful) {
        call.reject("review: " + (req.exception?.message ?: "not available"))
        return@addOnCompleteListener
      }
      manager.launchReviewFlow(host, req.result).addOnCompleteListener {
        call.resolve(JSObject().put("asked", true))
      }
    }
  }
}
