/* Lingua — chapter 26. The App Store.
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* ==== 26. what money actually buys, bought ==============================

   The one window onto StoreKit, the way net.js is the one window onto the
   server. Nothing else in www/ may talk to `LinguaStore`.

   `Capacitor.nativePromise` and NOT `Capacitor.Plugins`: this app has no
   bundler and never loads @capacitor/core, so `Plugins` is undefined on a
   phone and a call through it does nothing, silently. That cost four builds
   to learn once already -- www/share.js carries the long version of it.

   **In a browser there is no App Store**, and that is not an error state to
   be drawn: the plans screen goes on setting the plan by hand there, which is
   how every check walks it, how every screenshot is taken, and how the owner
   tries a tier on. storeOn() is the whole of the difference.

   What this file does NOT do, deliberately:

   - it does not write the plan to the Keychain. LinguaStore.swift already
     does that (`LinguaPlanPlugin.set`) on every road that changes anything,
     and a second writer is a second answer to "what plan is this".
   - it does not decide what a plan may DO. That is `CAN` and `can()`.
   - it does not ask the App Store on launch. `current` exists on the native
     side for that and nothing calls it yet: a launch that phones Apple before
     drawing anything is a launch that waits on the network, and the Keychain
     already holds the answer from last time.                                */

/* Whether there is a native side to ask at all. */
function storePlug(){
  var np = window.Capacitor && Capacitor.nativePromise;
  return np ? np : null;
}
function storeOn(){ return !!storePlug(); }

/* What came back, put where the app keeps it.
   The plan is taken from the ANSWER and never assumed from what was asked
   for: a purchase that ends up pending, or a receipt that will not verify,
   comes back saying free, and believing the request instead of the reply is
   how an app gives away a tier nobody paid for. */
function storeTook(r){
  var p = (r && r.plan) ? String(r.plan) : 'free';
  SET.plan = p;
  save();
  /* The same sentence a plan ending has always said, said by the same
     function: capLapse() compares against the plan it last saw, so it does
     not care whether the change came from a button, a receipt or a lapse. */
  capLapse();
  render();
  return p;
}

/* Buy one, by product id.

   The four answers are told apart because they need four different things
   said: it worked, you cancelled, somebody has to approve it and you will
   hear later, and it failed. Cancelling says nothing at all -- a person who
   just pressed Cancel does not need to be told they cancelled. */
function storeBuy(id){
  var np = storePlug();
  if(!np) return false;
  toast(t('store.wait'));
  np('LinguaStore', 'buy', { id: String(id||'') })
    .then(function(r){
      var how = (r && r.how) ? String(r.how) : '';
      storeTook(r);
      if(how === 'bought') toast(t('toast.plan.other', plan()));
      else if(how === 'pending') toast(t('store.pending'));
    })
    ['catch'](function(){ toast(t('store.fail')); });
  return true;
}

/* The Restore button. Apple wants one and this is it.
   With StoreKit 2 restoring is mostly reading what this Apple ID already
   holds -- `current` would answer the same -- but `restore` is the one road
   that calls AppStore.sync(), which is what a person who has just reinstalled
   on a new phone actually needs, and it is the road a reviewer looks for.

   In a browser there is nothing to read, and it says so rather than saying
   nothing: a button that answers with silence reads as broken. */
function storeRestore(){
  var np=storePlug();
  if(!np){ toast(t('store.none')); return; }
  toast(t('store.wait'));
  np('LinguaStore', 'restore', {})
    .then(function(r){
      var p=storeTook(r);
      toast(p==='free'? t('store.none') : t('toast.plan.other', p));
    })
    ['catch'](function(){ toast(t('store.fail')); });
}
/* Cancelling. Apple's own sheet and nothing of ours: an app that draws its
   own cancel screen is an app that will be wrong about a subscription bought
   on another device, and about the date it runs to.
   「サブスクリプションを解除する」

   In a browser there is no sheet to open, and the plan goes back to free by
   hand -- which is what the button under it used to do on every plan, and is
   how a tier is tried on and taken off again while none of them is on sale. */
function storeManage(){
  var np=storePlug();
  if(!np){ setPlan('free'); return; }
  np('LinguaStore', 'manage', {})
    .then(function(r){ storeTook(r); })
    ['catch'](function(){ toast(t('store.fail')); });
}
/* Which product a plan is bought with, monthly or yearly.
   Written here rather than on PLANS, because a product id is the App Store's
   name for a thing and PLANS is what the app calls it. `yearly` is which of
   the two terms on that plan's page was pressed. */
function storeId(planId, yearly){
  return 'com.tokinets.lingua.' + String(planId||'') + (yearly ? '.yearly' : '.monthly');
}

/* ---- what it costs, in the App Store's words ---------------------------

   Prices differ by country and are not ours to know. In App Store Connect
   one base price is set and Apple generates the other 174 storefronts from
   it -- its own rounding, its own tax rules, its own currency -- and any of
   them can be overridden one at a time. So the number a person is charged is
   a fact that lives at Apple and arrives here as `displayPrice`: already in
   their currency, already formatted the way their region formats money.

   Until this, the plans screen showed `$4.99` out of www/i18n/en.js, which is
   a string somebody typed. It is right in a browser and right in the United
   States and wrong everywhere else -- and wrong quietly, because a price is
   never checked against anything. 「国によって値段変わる？」 2026-08-23.

   Asked once and remembered, because the answer cannot change while the app
   is open: a price is set in a dashboard and takes hours to propagate, and
   asking on every render is a network call per keystroke on a screen that
   slides. STORE_P is null until the App Store has answered and a map after
   -- an empty map when there is nothing on sale yet, which is today. */
var STORE_P=null;    /* product id -> what the App Store said about it */
var STORE_ASK=false; /* asked already this session */

function storeRow(id){
  return (STORE_P && STORE_P[String(id)]) || null;
}
/* Ask, once, and redraw when the answer lands. Nothing waits on this: the
   screen is drawn with what www/i18n has, and the real prices replace them a
   moment later. A plans screen that is blank until Apple answers is a plans
   screen that is blank on a bad train. */
function storeAsk(){
  var np=storePlug();
  if(!np || STORE_ASK) return;
  STORE_ASK=true;
  np('LinguaStore', 'products', {})
    .then(function(r){
      var l=(r && r.products) || [], m={}, i;
      for(i=0;i<l.length;i++) if(l[i] && l[i].id) m[String(l[i].id)]=l[i];
      STORE_P=m;
      render();
    })
    ['catch'](function(){ STORE_P={}; });
}
/* What one term of one plan costs. Empty when the App Store has not answered,
   which is every browser and every product not yet made -- the caller falls
   back to what www/i18n says, and that is the only place a typed price is
   allowed to reach a screen. */
function storeCost(planId, yearly){
  var r=storeRow(storeId(planId, yearly));
  return (r && r.price) ? String(r.price) : '';
}
/* How much less a year is than twelve months, as a whole number of per cent.

   Worked out from the two AMOUNTS and never from the two formatted prices:
   `$9.99` is a string in ten languages and, on a phone, whatever Apple hands
   back in whatever currency. It is worked out at all -- rather than being the
   17 written on PLANS -- because Apple rounds each storefront separately, so
   a year that is 17% off in dollars is not 17% off in yen, and a number that
   is only right in one country is a number the app is wrong about in 174.

   Empty unless both terms of that plan are really on sale and the year is
   really cheaper: a discount worked out from a missing product is a discount
   made up. */
function storeOff(planId){
  var m=storeRow(storeId(planId, false)), y=storeRow(storeId(planId, true));
  var a=(m && typeof m.amount==='number') ? m.amount : 0;
  var b=(y && typeof y.amount==='number') ? y.amount : 0;
  if(!(a>0) || !(b>0)) return '';
  var off=Math.round((1 - b/(a*12))*100);
  return (off>0 && off<100) ? String(off) : '';
}
