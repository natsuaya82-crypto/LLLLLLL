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

   - it does not decide what plan a receipt buys. Nothing on this phone does,
     since 2026-09-06: what goes up is the signed transaction and what comes
     back is the plan (supabase/functions/verify-plan). 「だから端末でやるわけ
     ねえだろ」 OWNER 2026-09-03.
   - it does not write the plan anywhere. planTook() in www/core.js is the one
     place, and netPlanVerify() is the one caller.
   - it does not decide what a plan may DO. That is `CAN` and `can()`.

   IT DOES ASK ON LAUNCH, and that changed with the same decision. storeSync()
   is called from www/boot.js: the receipts this device holds are what the
   server needs to answer, and nothing on the phone can answer without it.
   Nothing waits on it -- the app opens on the plan it had, and the answer
   lands a moment later.                                                     */

/* Whether there is a native side to ask at all. */
function storePlug(){
  var np = window.Capacitor && Capacitor.nativePromise;
  return np ? np : null;
}
function storeOn(){ return !!storePlug(); }

/* WHAT COMES BACK FROM THE APP STORE IS RECEIPTS, NOT A PLAN.
   「だから端末でやるわけねえだろ」 OWNER 2026-09-03,
   「アカウントごとなんだから、違うアカウントで復元できるのおかしいだろ。
     検証して」 OWNER 2026-09-06.

   `storeTook()` was here until 2026-09-06: it read `r.plan` -- a word the
   phone had worked out -- and wrote it down. ios/App/App/LinguaStore.swift no
   longer answers a plan at all. Every road out of it answers
   `jws`: the signed transactions, exactly as Apple wrote them, and the one
   thing that reads a signature is supabase/functions/verify-plan.

   So this file's job on every road is the same two lines: take the receipts,
   hand them to netPlanVerify(), and say what came back. */
function storeJws(r){
  return (r && r.jws && r.jws.length) ? r.jws : [];
}
/* Which plan a product id buys, for the SENTENCE after a purchase and for
   nothing else. 「plus で課金しても pro になりましたって出る」 OWNER
   2026-09-02: what a person pressed and what their account now holds are two
   different facts, and the sentence wants the first.

   It is the other end of storeId() and reads the id apart the same way that
   builds it. WHAT A PRODUCT IS WORTH is not decided here and not decided in
   www at all -- that is `PRODUCTS` in supabase/functions/verify-plan/verify.mjs,
   because deciding is the server's. This only names what was pressed. */
function storePlanOf(pid){
  var s=String(pid||''), head='com.tokinets.lingua.', dot;
  if(s.indexOf(head)!==0) return '';
  s=s.substring(head.length);
  dot=s.indexOf('.');
  return dot<0 ? '' : s.substring(0, dot);
}

/* The launch, and every other moment the app wants to know where it stands.

   THE EMPTY LIST IS THE QUESTION 「what does this account pay」. There is no
   second call that only reads: the function works the plan out from every
   transaction it has ever verified for this account, so sending nothing asks
   exactly that -- which is what a browser does, and what a phone does when the
   App Store could not be reached. netPlanVerify() has the long version.

   Nothing waits on it and nothing is said. A launch that cannot reach the
   server leaves the plan where it was, which is the one direction it is safe
   to be wrong in. */
function storeSync(){
  var np=storePlug();
  if(!np){ netPlanVerify([], storeUntilTook); return; }
  np('LinguaStore', 'current', {})
    .then(function(r){ netPlanVerify(storeJws(r), storeUntilTook); })
    ['catch'](function(){ netPlanVerify([], storeUntilTook); });
}

/* Buy one, by product id.

   IT NEEDS AN ACCOUNT, and that is the decision of 2026-09-06 rather than a
   guard somebody added. The uid goes down to StoreKit as `appAccountToken`,
   Apple carries it inside every transaction of that subscription for as long
   as it lives, and the server refuses it for anybody else. A purchase made
   with no account on it is a purchase belonging to whoever verifies it first.

   The four answers are told apart because they need four different things
   said: it worked, you cancelled, somebody has to approve it and you will
   hear later, and it failed. Cancelling says nothing at all -- a person who
   just pressed Cancel does not need to be told they cancelled. */
function storeBuy(id){
  var np=storePlug();
  if(!np) return false;
  if(!netSignedIn()){ toast(t('store.nosess')); return true; }
  toast(t('store.wait'));
  np('LinguaStore', 'buy', { id:String(id||''), uid:SESS.uid })
    .then(function(r){
      var how=(r && r.how)? String(r.how) : '';
      if(how==='cancelled') return;
      if(how==='pending'){ toast(t('store.pending')); return; }
      /* WHAT WAS PRESSED, which is not what is HELD. `r.bought` is the signed
         transaction's own product id; the plan that comes back is the best of
         everything this account holds, and after pressing Plus while Pro is
         running those are two different words. 「plus で課金しても pro に
         なりましたって出る」 OWNER 2026-09-02. */
      var paid=storePlanOf(r && r.bought);
      netPlanVerify(storeJws(r), function(p, d){
        /* NOTHING CAME BACK is not 「無料」. A purchase that went through and
           an answer that did not arrive is a phone with money spent on it, and
           writing `free` there is the fault that cost the owner their plan
           twice. 「今課金したのに（仮）フリーになりましたって出たんだけど」
           OWNER 2026-09-01. netPlanVerify() writes nothing in that case; this
           says the App Store road failed and leaves the plan alone. */
        if(!p){ toast(t('store.fail')); return; }
        storeUntilTook(p, d);
        toast(t('toast.plan.other', planName(paid || p)));
      });
    })
    ['catch'](function(){ toast(t('store.fail')); });
  return true;
}

/* The Restore button. Apple wants one and this is it.
   With StoreKit 2 restoring is mostly reading what this Apple ID already
   holds -- `current` would answer the same -- but `restore` is the one road
   that calls AppStore.sync(), which is what a person who has just reinstalled
   on a new phone actually needs, and it is the road a reviewer looks for.

   IT RESTORES ONTO THE ACCOUNT THAT IS SIGNED IN. 「アカウントごとなんだから、
   違うアカウントで復元できるのおかしいだろ」 OWNER 2026-09-06. Nothing in www
   enforces that and nothing here could: the same receipts go up whoever is
   holding the phone, and the server answers `free` when they belong to
   somebody else. 「復元するものはありません」 is that answer, and it is the
   true one.

   In a browser there is nothing to read, and it says so rather than saying
   nothing: a button that answers with silence reads as broken. */
/* AND IT ALWAYS ENDS IN A SENTENCE. 「購入を復元押しても問い合わせ中しか
   出ないよ」OWNER 2026-09-02: the wait was said and nothing was ever said
   after it, because the answer never came back. The phone side is bounded now
   (ios/App/App/LinguaStore.swift § syncWithin), and this is the other end of
   the same statement -- whatever happens on the far side of that call, the
   button says how it went. `said` is what makes the two ends one answer
   rather than two: whichever arrives first speaks, and the other is silent. */
var STRT=null;
/* The three numbers Apple's walk came back with, in the smallest form that
   still tells them apart. Not a sentence: this is a state, and what somebody
   does with it is send the photograph. */
function storeWhyNone(r, d){
  var saw=(r && r.saw)|0, un=(r && r.unverified)|0;
  /* How many the SERVER would not take, which is the count this phone cannot
     work out: a receipt Apple signed for somebody else's account is refused
     there and nowhere else. 「アカウントごとなんだから、違うアカウントで復元
     できるのおかしいだろ」 OWNER 2026-09-06. */
  var no=(d && d.left && d.left.length)|0;
  var sy=!!(r && r.synced);
  return ' ('+saw+'/'+un+'/'+no+(sy? '' : ' ×')+')';
}
function storeRestore(){
  var np=storePlug();
  if(!np){ toast(t('store.none')); return; }
  if(!netSignedIn()){ toast(t('store.nosess')); return; }
  var said=false;
  function say(m){ if(said) return; said=true; clearTimeout(STRT); toast(m); }
  toast(t('store.wait'));
  clearTimeout(STRT);
  STRT=setTimeout(function(){ say(t('store.fail')); }, STORE_WAIT);
  np('LinguaStore', 'restore', {})
    .then(function(r){
      netPlanVerify(storeJws(r), function(p, d){
        if(!p){ say(t('store.fail')); return; }
        storeUntilTook(p, d);
        if(p!=='free'){ say(t('toast.plan.other', planName(p))); return; }
        /* AND WHICH 「nothing」 IT IS. 「これ出るのに、復元できるものはありません
           って出るけど？」 OWNER 2026-09-03, with Apple's sheet on screen saying
           the subscription is live. Four different faults say this sentence now
           and one of them is 「you really own nothing」. The fourth is the new
           one and is the owner's decision of 2026-09-06: the receipts are real
           and belong to ANOTHER ACCOUNT. An error is a state. */
        say(t('store.none') + storeWhyNone(r, d));
      });
    })
    ['catch'](function(){ say(t('store.fail')); });
}
/* Cancelling. Apple's own sheet and nothing of ours: an app that draws its
   own cancel screen is an app that will be wrong about a subscription bought
   on another device, and about the date it runs to.
   「サブスクリプションを解除する」

   Coming back from the sheet asks the server again rather than deciding
   anything: somebody may have cancelled in there, and a cancellation is
   Apple's to say. It arrives as a transaction, which goes up with the rest.

   In a browser there is no sheet to open, and the plan goes back to free by
   hand -- which is what the button under it used to do on every plan, and is
   how a tier is tried on and taken off again while none of them is on sale. */
function storeManage(){
  var np=storePlug();
  if(!np){ setPlan('free'); return; }
  np('LinguaStore', 'manage', {})
    .then(function(r){ netPlanVerify(storeJws(r), storeUntilTook); })
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
/* WHAT THE LAST ASK CAME BACK AS, because the screen has to say it.
   '' is nothing to say -- either the prices are Apple's, or the ask is still
   out and the typed ones stand for the moment. 'fail' and 'none' are the two
   states the plans screen draws under the prices; see storeSay(). */
var STORE_BAD='';
/* Which ask is the current one. Two can be in flight at once now that a bound
   exists -- one that ran out of time, and the one the next visit started --
   and an older one answering after a newer one began is not an answer to
   anything. */
var STORE_N=0;
/* HOW LONG A WAIT IS, AND IT IS NOT THIS FILE'S NUMBER.
   「通信のくるくるも全部20秒で良くない？」 OWNER 2026-09-05.

   It was 25000, written here, beside a 25000 written again in storeRestore()
   below -- so the app had three deadlines: net.js's twenty seconds for every
   request that goes over the wire, and two of Apple's own that nobody had
   looked at together. A person standing in front of a spinner cannot tell
   which of the three they are waiting on, and there is no reason they should
   have to.

   So there is ONE number and it is NET_WAIT (www/net.js). This file is
   loaded after net.js by www/index.html, which is what lets it be read here
   rather than copied. Moving it moves every wait in the app at once, which
   is the whole of why it is one. */
var STORE_WAIT=NET_WAIT;

function storeRow(id){
  return (STORE_P && STORE_P[String(id)]) || null;
}
/* Ask, once, and redraw when the answer lands. Nothing waits on this: the
   screen is drawn with what www/i18n has, and the real prices replace them a
   moment later. A plans screen that is blank until Apple answers is a plans
   screen that is blank on a bad train. */
/* ASKED AGAIN IF THE ANSWER WAS NOTHING, and that is the fix to a price that
   was wrong on a phone. 「これ出るけど、画面表示は4.99ドルなんだよね。ここを
   価格＝にできないの？表示価格と、appleの表示価格」 OWNER 2026-09-01, with
   the App Store's own sheet saying 月額¥800 over a screen saying $4.99.

   The ask was latched before it was made and never unlatched, so ONE failure
   was permanent: a phone whose App Store account is not signed in yet -- which
   is every sandbox tester before their first purchase -- got a rejection on
   the first opening of the plans screen and then showed the typed price for
   the rest of the launch, however many times the screen was opened and
   whatever happened at Apple in between. Nothing threw and nothing said so:
   the fallback is a real price in the United States, so the screen looks
   right everywhere it is wrong.

   So the latch means "an answer is on its way OR one has arrived": a
   rejection, and an answer with nothing in it, put it back down. Opening the
   plans screen is what asks, so the retry costs one call per visit and never
   loops -- nothing here renders unless something came back. */
/* AND THE ASK HAS AN END, however Apple's side behaves.

   「サンドボックスだと 15000 円なのに画面はどの言語でも 99.99 ドル」 OWNER
   2026-09-02, on a real phone. **Any language** is the whole of the diagnosis:
   `$99.99` is typed into all ten www/i18n files, so what was on the screen was
   the fallback rather than a translation gone wrong -- the App Store's answer
   never reached the screen at all.

   The latch was raised BEFORE the call and lowered by the two ways it can
   come back. A promise that does neither -- never resolves, never rejects --
   leaves it raised for the rest of the launch, and every later opening of the
   plans screen returns on the first line without asking. The typed price then
   stands for good, and nothing anywhere throws.

   The same shape was met once already, on Restore
   「購入を復元押しても問い合わせ中しか出ないよ」 OWNER 2026-09-02 -- and was answered
   with a bound on both ends (`syncWithin` in LinguaStore.swift, `STRT` here).
   This is the same answer on the one road that did not have it.

   A LATE ANSWER IS STILL TAKEN. The bound exists so the screen stops waiting,
   not so a price that arrives at the thirtieth second is thrown away: `got`
   and the timer are two different things, and whichever of them happens first
   does not silence the other. What DOES silence an ask is a newer one --
   STORE_N. */
/* WHAT THIS APPLE ID ACTUALLY HOLDS, asked once when the plans screen opens.
   「ローディングすればそんなの起きないだろ」 OWNER 2026-09-03.

   Nothing called `current` before, so the screen drew the plan out of the
   copy in the Keychain -- written the last time anything answered. On a phone
   where that copy is behind, somebody on Pro was shown a live 「buy Plus」
   button and Apple took the press as a downgrade.
   「そもそもプロの人が買えるのが意味わからないだろ」 OWNER 2026-09-03.

   Asking is not enough on its own: the answer is a moment later, and drawing
   from the stale copy in that moment is the same bug in a smaller window.
   So the screen WAITS -- the same answer the owner gave about a language
   arriving after a sign-in, and the same mark drawn for it.

   One call per visit, the latch storeAsk() already uses. The receipts go to
   netPlanVerify() and the plan comes back from the server, which is the same
   road every other one here takes. */
var STORE_CUR=false;   /* asked this visit */
var STORE_GOT=false;   /* and the answer is in */
function storeHeld(){ return !storeOn() || STORE_GOT; }
/* AND WHEN THE PLAN IN FORCE RUNS TO. 「消すなら同じ場所に現在このプランです
   〇〇/〇〇までみたいな感じにしないとわからんやろ」 OWNER 2026-09-03.

   IT IS NOT SAVED, and that is not an oversight to be tidied up later. Two
   reasons and either one is enough:

   The expiry is the Apple ID's, and `localStorage` is the account's --
   CLAUDE.md 「NOTHING IS THE PHONE'S. EVERYTHING IS THE ACCOUNT'S.」 A date
   written into SET could not answer 「which account is this」, which is the
   question a thing has to answer before it is written down. `SET.plan`
   already cannot, and that is a known fault (docs/STATE.md: 「アカウントを
   変えても端末の段が残る」); a second one beside it is a second thing to
   unpick.

   And a date that outlives the plan it belongs to is the worst thing this
   line could say. Nothing here is worth carrying across launches: `current`
   is asked every time the plans screen is opened, and until it answers there
   is no date -- which is a state the screen already draws.

   KEPT WITH THE PLAN IT BELONGS TO, and that is the whole of the safety.
   Somebody on Plus can buy Pro from this screen: the plan then moves and the
   date does not, and a date printed beside a plan it was never about is a
   lie the screen has no way to notice. Holding the two together makes the
   mismatch answerable -- see storeUntil(). */
var STORE_UNTIL=null;  /* {plan:'plus', at:<ms>} -- or null, 「not known」 */
/* What the SERVER came back with, put where the screen reads it. It is the
   answer to netPlanVerify() on every road -- the launch, the plans screen,
   a purchase, a restore, Apple's own sheet -- because since 2026-09-06 the
   date is worked out in the same place the plan is
   (`decidePlan()` in supabase/functions/verify-plan/verify.mjs). It used to
   come off `current` alone, and only `current` carried one.

   It is the CALLBACK netPlanVerify() takes, so every road records the date by
   handing this in rather than by remembering to. An answer that did not
   arrive comes through with no plan and clears nothing. */
function storeUntilTook(p, d){
  var at=(d && typeof d.until==='number') ? d.until : 0;
  if(!p) return;
  STORE_UNTIL=(p!=='free' && at>0) ? { plan:p, at:at } : null;
}
/* When the plan in force runs to, or 0 for 「not known」.

   `plan()` and not the plan that was answered: the two can still come apart
   for a frame -- planTook() renders the moment the plan lands and the date is
   written a line later -- and they come apart for good if anything else moves
   the plan afterwards. It is 0 then, which is the honest answer --
   「not known」 and 「there is no end」 are different states and CLAUDE.md says
   they may not share a branch. */
function storeUntil(){
  if(!STORE_UNTIL || STORE_UNTIL.plan!==plan()) return 0;
  return STORE_UNTIL.at;
}
function storeCurAsk(){
  var np=storePlug();
  if(!np || STORE_CUR) return;
  STORE_CUR=true;
  np('LinguaStore', 'current', {})
    .then(function(r){ netPlanVerify(storeJws(r), function(p, d){
      STORE_GOT=true; storeUntilTook(p, d); storeDrew();
    }); })
    /* An answer that never came is not 「this person owns nothing」. The
       screen stops waiting and draws what the phone holds, which is what it
       drew before any of this. */
    ['catch'](function(){ STORE_GOT=true; storeDrew(); });
}
function storeAsk(){
  var np=storePlug(), n, got=false;
  if(!np || STORE_ASK) return;
  STORE_ASK=true;
  STORE_N++; n=STORE_N;
  setTimeout(function(){
    if(got || n!==STORE_N || !STORE_ASK) return;
    storeFell('fail');
  }, STORE_WAIT);
  np('LinguaStore', 'products', {})
    .then(function(r){
      var l=(r && r.products) || [], m={}, i, c=0;
      for(i=0;i<l.length;i++) if(l[i] && l[i].id){ m[String(l[i].id)]=l[i]; c++; }
      if(got || n!==STORE_N) return;
      got=true;
      if(!c){ storeFell('none'); return; }
      /* Raised again, and not merely left where it was: the bound may have
         lowered it already, and 「an answer is on its way OR one has arrived」
         is what this latch means. An arrival that left it down would be a
         fresh call to Apple on the next visit for prices already held. */
      STORE_P=m; STORE_BAD=''; STORE_ASK=true;
      storeDrew();
    })
    ['catch'](function(){
      if(got || n!==STORE_N) return;
      got=true;
      storeFell('fail');
    });
}
/* The ask did not end in prices, and the screen says which of the two ways.

   IT SAYS SO WHERE THE PRICE IS, and not in a toast. A toast is 1.9 seconds
   (toast() in www/shell.js) and then the screen is a price list with typed
   dollars on it and nothing anywhere saying they are not Apple's -- which is
   the state the owner was looking at. 「しかもまだ4.99って出るけど？」 OWNER
   2026-09-01. An error is a state, not an explanation, and a state belongs on
   the screen it is about for as long as it is true -- CLAUDE.md § Explaining.

   THE REDRAW COMES BEFORE THE LATCH GOES DOWN, and that is not a tidy-up.
   vPlans() is what asks, so a render with the latch already down asks again
   inside itself -- and a failure that redraws is then a failure that retries,
   every STORE_WAIT, for as long as somebody stands on this screen. Drawing
   first and unlatching after keeps the promise the ask was written with: one
   call per VISIT, and never a loop. */
function storeFell(w){
  if(!STORE_P) STORE_P={};
  STORE_BAD=w;
  storeDrew();
  STORE_ASK=false;
}
/* Only the screen that is showing prices. The bound fires on a timer, and a
   timer that repaints whatever somebody happens to be standing on is a timer
   that takes the keyboard off them mid-word. */
function storeDrew(){ if(route==='plans') render(); }
/* What the plans screen puts under the prices, or nothing at all.
   Empty while the ask is out: the typed prices are right in a browser and in
   the United States, and a screen that accuses itself for a moment on every
   visit is worse than one that is quiet until there is something to say. */
function storeSay(){
  if(STORE_BAD==='fail') return t('store.fail');
  if(STORE_BAD==='none') return t('store.nosale');
  return '';
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
/* What a year WOULD cost at the monthly price -- the number a year is struck
   through with. 「49.99は取り消し線＋17%OFF」OWNER 2026-08-26.

   Read off the monthly product and never worked out here. LinguaStore.swift
   does the sum, because doing it in this file would mean building a currency
   string out of `amount`, which has the money and not the currency: twelve
   times ¥750 would come out `$9000` in every storefront that is not the one
   the person is in. 「4はドル。でもさっき価格登録してきたけど日本円は800円と
   かになってたよ」

   Empty is the answer everywhere the App Store has not said, and it is not a
   hole to be filled: **there is no typed fallback for this one.** `$59.88` in
   www/i18n would be a second `$4.99` -- right in one country and quietly
   wrong in 174 -- and a struck-through price is the one number on the screen
   whose whole job is to be compared with the one beside it. Nothing shown is
   not a lie; a dollar sign shown to somebody being charged yen is.
   OWNER 2026-08-26, on the fallback: 何も出さない.

   It is gated on storeOff() and not merely on the field being there: a line
   drawn through a price that is not higher than the one beside it is the app
   inventing a saving. The two are one statement and are answered together. */
function storeWas(planId){
  var m=storeRow(storeId(planId, false));
  if(!storeOff(planId)) return '';
  return (m && m.year) ? String(m.year) : '';
}
