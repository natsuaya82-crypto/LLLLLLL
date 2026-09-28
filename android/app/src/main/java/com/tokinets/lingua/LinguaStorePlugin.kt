package com.tokinets.lingua

import android.content.Intent
import android.net.Uri
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.play.core.review.ReviewManagerFactory
import java.text.NumberFormat
import java.util.Currency

/*
 * The Android half of ios/App/App/LinguaStore.swift -- the same six methods,
 * and www/store.js does not know which phone it is on.
 *
 * GOOGLE PLAY BILLING, DIRECTLY. No RevenueCat, the same prices as the iPhone
 * (docs/FEATURE_RULES.md, 2026-09-27). The four products are the iPhone's four
 * ids, each its own subscription with one base plan (docs/ANDROID.md § 課金).
 *
 * WHAT COMES BACK IS RECEIPTS AND NOT A PLAN, exactly as on the iPhone. Play
 * hands a phone no signed transaction, so a receipt here is a pair -- the
 * purchase token and the product id -- and every road out of this file answers
 *
 *   google  [{token, product}]   every subscription this Google account holds
 *   saw     how many Play listed
 *
 * and www/store.js hands the pairs to netPlanVerify(). What they are worth is
 * supabase/functions/verify-plan's to say: it asks Google about each token and
 * counts it only when the account on it is the one asking. 「だから端末でやる
 * わけねえだろ」 OWNER 2026-09-03. That is also why nothing here ACKNOWLEDGES a
 * purchase -- the server does, once it has checked whose it is.
 *
 * UNTIL THE PLAY CONSOLE HAS THE PRODUCTS, IT SAYS SO. `products` is an empty
 * list (「まだ販売されていません」), `buy` refuses, and `current` answers the
 * empty list it truly is -- which www turns into 「what does this account pay」,
 * so a plan bought on an iPhone is the plan here too. A phone with no Play
 * Store answers 「no store」 on every road, and every refusal lands where
 * www/store.js already puts 「the store could not help」.
 *
 * "A failed check means fewer buttons, never fewer words" (CLAUDE.md § Money):
 * no byte of anybody's language depends on any of this.
 */
@CapacitorPlugin(name = "LinguaStore")
class LinguaStorePlugin : Plugin() {

  companion object {
    /* The iPhone's four, and verify.mjs's PRODUCTS. */
    val ids = listOf(
      "com.tokinets.lingua.plus.monthly",
      "com.tokinets.lingua.plus.yearly",
      "com.tokinets.lingua.pro.monthly",
      "com.tokinets.lingua.pro.yearly",
    )
  }

  private var client: BillingClient? = null
  private val waiting = mutableListOf<(BillingClient?) -> Unit>()
  private var connecting = false
  /* The one purchase being made. Play answers a purchase through the listener
     and not through the call that started it. */
  private var buyCall: PluginCall? = null
  private var buyId: String = ""
  /* Somebody went to Play's own subscriptions page; coming back asks again. */
  private var managing = false

  /* Anything Play says that nobody is waiting for -- a pending purchase that
     went through later, a renewal -- tells the page, the way the iPhone's
     RevenueCat delegate does. The page asks the launch's own question again
     (storeSync), and nothing here decides anything. */
  private val updated = PurchasesUpdatedListener { result, purchases ->
    val call = buyCall
    if (call == null) { tellPage(); return@PurchasesUpdatedListener }
    buyCall = null
    val id = buyId
    when (result.responseCode) {
      BillingClient.BillingResponseCode.OK,
      BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> {
        val mine = (purchases ?: emptyList()).firstOrNull { it.products.contains(id) }
        val how = if (mine != null && mine.purchaseState == Purchase.PurchaseState.PENDING) "pending" else "bought"
        answer(call, JSObject().put("how", how).put("bought", id), mine)
      }
      BillingClient.BillingResponseCode.USER_CANCELED ->
        answer(call, JSObject().put("how", "cancelled"), null)
      else -> call.reject("buy: " + result.responseCode + " " + result.debugMessage)
    }
  }

  private fun tellPage() {
    val web = bridge?.webView ?: return
    web.post { web.evaluateJavascript("window.dispatchEvent(new Event('linguastore'))", null) }
  }

  override fun handleOnResume() {
    super.handleOnResume()
    if (managing) { managing = false; tellPage() }
  }

  /* One connection, made the first time anything is asked. Everything asked
     while it is being made waits for it; a phone with no Play Store is handed
     null, which every caller turns into 「no store」. */
  private fun withClient(go: (BillingClient?) -> Unit) {
    val c = client
    if (c != null && c.isReady) { go(c); return }
    waiting.add(go)
    if (connecting) return
    connecting = true
    val made = c ?: BillingClient.newBuilder(context)
      .setListener(updated)
      .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
      .enableAutoServiceReconnection()
      .build()
    client = made
    made.startConnection(object : BillingClientStateListener {
      override fun onBillingSetupFinished(r: BillingResult) {
        connecting = false
        val ok = r.responseCode == BillingClient.BillingResponseCode.OK
        val all = waiting.toList()
        waiting.clear()
        for (w in all) w(if (ok) made else null)
      }
      override fun onBillingServiceDisconnected() {
        connecting = false
      }
    })
  }

  /* Every subscription this Google account holds, as pairs. `first` goes at
     the front -- the purchase just made, which Play has not always listed yet.
     The iPhone does the same with `latest(for:)`, for the same reason:
     「今課金したのに（仮）フリーになりましたって出たんだけど」 OWNER 2026-09-01. */
  private fun receipts(first: Purchase?, then: (JSArray, Int, Boolean) -> Unit) {
    withClient { c ->
      if (c == null) { then(pairs(first, emptyList()), 0, false); return@withClient }
      val q = QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build()
      c.queryPurchasesAsync(q) { r, list ->
        val ok = r.responseCode == BillingClient.BillingResponseCode.OK
        val got = if (ok) list else emptyList()
        then(pairs(first, got), got.size, ok)
      }
    }
  }

  private fun pairs(first: Purchase?, list: List<Purchase>): JSArray {
    val out = JSArray()
    val seen = HashSet<String>()
    for (p in listOfNotNull(first) + list) {
      if (!seen.add(p.purchaseToken)) continue
      for (id in p.products) {
        if (!ids.contains(id)) continue
        out.put(JSObject().put("token", p.purchaseToken).put("product", id))
      }
    }
    return out
  }

  /* What goes back to www on every road out of here. */
  private fun answer(call: PluginCall, more: JSObject, first: Purchase?) {
    receipts(first) { google, saw, _ ->
      more.put("google", google)
      more.put("saw", saw)
      more.put("unverified", 0)
      call.resolve(more)
    }
  }

  /* The base plan's offer -- the one with no offer id. Introductory offers are
     not used: which of them to run is a price, and prices are the owner's. */
  private fun basePlan(d: ProductDetails): ProductDetails.SubscriptionOfferDetails? =
    d.subscriptionOfferDetails?.firstOrNull { it.offerId == null }

  private fun details(want: List<String>, then: (List<ProductDetails>?) -> Unit) {
    withClient { c ->
      if (c == null) { then(null); return@withClient }
      val q = QueryProductDetailsParams.newBuilder().setProductList(want.map {
        QueryProductDetailsParams.Product.newBuilder()
          .setProductId(it).setProductType(BillingClient.ProductType.SUBS).build()
      }).build()
      c.queryProductDetailsAsync(q) { r, res ->
        then(if (r.responseCode == BillingClient.BillingResponseCode.OK) res.productDetailsList else null)
      }
    }
  }

  /**
   * What is for sale, with prices as Google Play gives them -- `price` is
   * Play's own formatted string, in the person's currency. `year` is twelve
   * of the month, formatted in Play's currency code (Play hands no formatter,
   * so the currency is Play's and only the digits are the phone's), and is
   * left out whenever that currency cannot be named.
   */
  @PluginMethod
  fun products(call: PluginCall) {
    details(ids) { list ->
      if (list == null) { call.reject("no store"); return@details }
      val out = JSArray()
      for (d in list) {
        val plan = basePlan(d) ?: continue
        val phase = plan.pricingPhases.pricingPhaseList.lastOrNull() ?: continue
        val amount = phase.priceAmountMicros / 1_000_000.0
        val row = JSObject()
          .put("id", d.productId)
          .put("name", d.name)
          .put("text", d.description)
          .put("price", phase.formattedPrice)
          .put("amount", amount)
        try {
          val f = NumberFormat.getCurrencyInstance()
          f.currency = Currency.getInstance(phase.priceCurrencyCode)
          row.put("year", f.format(amount * 12))
        } catch (e: Exception) { /* no year: www shows no struck-through price */ }
        /* ISO 8601: P1M, P1Y, P1W. Play's answer rather than the product's name. */
        val m = Regex("^P(\\d+)([DWMY])$").find(phase.billingPeriod)
        if (m != null) {
          row.put("count", m.groupValues[1].toInt())
          row.put("unit", when (m.groupValues[2]) { "D" -> "day"; "W" -> "week"; "M" -> "month"; else -> "year" })
        }
        out.put(row)
      }
      call.resolve(JSObject().put("products", out))
    }
  }

  /**
   * Buy one, FOR THE ACCOUNT THAT IS SIGNED IN. The Supabase uid goes on the
   * purchase as `obfuscatedAccountId`, Google keeps it on the subscription for
   * as long as it lives, and verify-plan refuses a token whose account is not
   * the one asking -- the iPhone's `appAccountToken`. 「アカウントごとなんだから、
   * 違うアカウントで復元できるのおかしいだろ」 OWNER 2026-09-06. It refuses to buy
   * without one.
   *
   * A CHANGE OF PLAN REPLACES THE ONE HELD. Play, unlike the App Store, has no
   * subscription group: buying Pro while Plus runs would be two subscriptions
   * and two charges. So a subscription of ours already held is handed in as
   * the old one, and the change is made now with the time left credited
   * (WITH_TIME_PRORATION) -- the nearest Play has to what the App Store does
   * inside a group.
   */
  @PluginMethod
  fun buy(call: PluginCall) {
    val id = call.getString("id") ?: ""
    if (!ids.contains(id)) { call.reject("no such product"); return }
    val uid = call.getString("uid") ?: ""
    if (!Regex("^[0-9a-fA-F-]{36}$").matches(uid)) { call.reject("not signed in"); return }
    val host = activity
    if (host == null) { call.reject("no activity"); return }
    if (buyCall != null) { call.reject("a purchase is already open"); return }
    details(listOf(id)) { list ->
      if (list == null) { call.reject("no store"); return@details }
      val d = list.firstOrNull { it.productId == id }
      val plan = d?.let { basePlan(it) }
      if (d == null || plan == null) { call.reject("no such product"); return@details }
      val c = client
      if (c == null) { call.reject("no store"); return@details }
      val q = QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build()
      c.queryPurchasesAsync(q) { _, held ->
        val old = held.firstOrNull { p ->
          p.purchaseState == Purchase.PurchaseState.PURCHASED &&
            p.products.any { ids.contains(it) } && !p.products.contains(id)
        }
        val b = BillingFlowParams.newBuilder()
          .setProductDetailsParamsList(listOf(
            BillingFlowParams.ProductDetailsParams.newBuilder()
              .setProductDetails(d).setOfferToken(plan.offerToken).build()))
          .setObfuscatedAccountId(uid.lowercase())
        if (old != null) {
          b.setSubscriptionUpdateParams(
            BillingFlowParams.SubscriptionUpdateParams.newBuilder()
              .setOldPurchaseToken(old.purchaseToken)
              .setSubscriptionReplacementMode(
                BillingFlowParams.SubscriptionUpdateParams.ReplacementMode.WITH_TIME_PRORATION)
              .build())
        }
        host.runOnUiThread {
          buyCall = call
          buyId = id
          val r = c.launchBillingFlow(host, b.build())
          if (r.responseCode != BillingClient.BillingResponseCode.OK) {
            buyCall = null
            call.reject("buy: " + r.responseCode + " " + r.debugMessage)
          }
        }
      }
    }
  }

  /**
   * Restore. Play has nothing to refresh -- what a Google account holds is
   * listed on every ask -- so this is `current` with `synced` said, and the
   * binding is still the server's: pairs belonging to another Supabase account
   * go up and are refused there.
   */
  @PluginMethod
  fun restore(call: PluginCall) {
    val uid = call.getString("uid") ?: ""
    if (uid.isEmpty()) { call.reject("not signed in"); return }
    withClient { c ->
      if (c == null) { call.reject("no store"); return@withClient }
      receipts(null) { google, saw, ok ->
        call.resolve(JSObject().put("google", google).put("saw", saw)
          .put("unverified", 0).put("synced", ok))
      }
    }
  }

  /** What Google Play holds right now, asked on every launch. */
  @PluginMethod
  fun current(call: PluginCall) {
    withClient { c ->
      if (c == null) { call.reject("no store"); return@withClient }
      answer(call, JSObject(), null)
    }
  }

  /**
   * Cancelling, changing, the next charge -- Google Play's own page, never
   * ours. It opens in Play and this answers now with what is held; coming
   * back to the app tells the page (handleOnResume), which asks again.
   */
  @PluginMethod
  fun manage(call: PluginCall) {
    val host = activity
    if (host == null) { call.reject("no activity"); return }
    val url = "https://play.google.com/store/account/subscriptions?package=" + context.packageName
    try {
      managing = true
      host.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
    } catch (e: Exception) {
      managing = false
      call.reject("manage: " + (e.message ?: "cannot open")); return
    }
    withClient { c ->
      if (c == null) { call.reject("no store"); return@withClient }
      answer(call, JSObject(), null)
    }
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
