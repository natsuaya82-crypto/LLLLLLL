/* Lingua — chapter 28. Apple's notifications.
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* ==== 28. being told, when the app is not open =========================

   「通知作ろう。アップルのネイティブ通知で、フォローされた時、返信きた時みたい
    な感じでSNS部分であるやつ。それに加えて設定で個別通知のオンオフできるように。」
   OWNER 2026-09-22.

   The one window onto ios/App/App/LinguaPush.swift, the way www/store.js is
   the one onto StoreKit and www/net.js the one onto the server. Nothing else
   in www/ may speak to `LinguaPush`.

   `Capacitor.nativePromise` and NOT `Capacitor.Plugins`: this app has no
   bundler and never loads @capacitor/core, so `Plugins` is undefined on a
   phone and a call through it does nothing, silently. That cost four builds
   to learn once already -- www/share.js carries the long version.

   THREE THINGS LIVE HERE AND NOTHING ELSE DOES.

   - the address. pushAsk() puts iOS's question in front of somebody and, if
     they say yes, hands the token to netDevicePut(). **This phone keeps no
     copy of it**: the row in `device` is the record, and NET_TOK in
     www/net.js is only what the sign-out DELETE needs, in memory.
   - the four switches. Which kinds of notification somebody wants, which are
     fields of `SET` on `SET_PREFS`, so `profile.prefs` carries them and a
     second phone is arranged the way the first one was.
   - the tap. Swift calls window.pushOpened() with what the notification
     carried, and this decides which screen that is.

   WHAT DOES NOT LIVE HERE: what a notification SAYS, when one is sent, and to
   whom. That is the server's, and nothing on this phone gets to answer it.

   **THERE IS NO MARK SAYING 「already asked」, AND THAT IS THE DESIGN.**
   iOS holds that answer: requestAuthorization shows its dialog the first time
   this app is ever installed and answers out of its own record every time
   after, with nothing on the screen. A mark of ours would be a COPY of it,
   and a copy is wrong from the moment somebody turns notifications off in
   Settings -- CLAUDE.md 「one thing is done by ONE mechanism, and no question
   is answered in two places」. So pushAsk() asks on every session arrival, the
   way storeSync() asks the App Store on every launch, and decides everything
   itself.

   It closes a hole as well as a question. A mark kept on the HANDSET survives
   one account into the next (`SET_PHONE` is not parked by setFor), so the
   second person to sign in on one iPhone would never be asked, would never
   have a row in `device`, and would get no notification ever -- with nothing
   anywhere saying so.                                                      */

/* Whether there is a native side to ask at all. A browser has none, and that
   is not an error state to be drawn: the settings room shows the four
   switches and they work, because they are `profile.prefs` and not iOS. */
function pushPlug(){
  var np = window.Capacitor && Capacitor.nativePromise;
  return np ? np : null;
}

/* THE FOUR KINDS, and this is the only list of them in www/.
   The names of the fields they set are `push_` + one of these, and that is
   the same name the server reads out of `profile.prefs` -- netPrefsPut()
   writes `SET`'s own names, so there is one spelling and not two. */
var PUSH_KINDS=['follow','reply','like','boost'];

/* Whether one kind is wanted. **ABSENT IS ON**, and it is the server's rule
   rather than a second one written here: somebody who has never opened this
   room has no `push_*` in their `prefs` at all, and both sides read that as
   「yes」. A default minted into SET would put four fields on every phone and
   send them up the first time anything else moved. */
function pushWants(k){ return SET['push_'+k]!==false; }

/* WHERE THE PERMISSION STANDS, and iOS is the one that knows.
   '' until it has answered -- which is a browser for ever, and a phone for
   the moment between opening this room and the answer landing. 「not asked
   yet」, 「refused」 and 「not answered」 are three states and the room draws
   what it is told rather than guessing between them. */
var PUSH_ST='';
/* The one place that is written, so the two roads that learn it -- asking for
   permission, and asking what it is -- cannot disagree. It draws only when
   the answer MOVED, which is also what stops pushStAsk() below from looping:
   a render asks, the same answer comes back, and nothing renders. */
function pushStGot(w){
  var s=String(w||'');
  if(s===PUSH_ST) return;
  PUSH_ST=s;
  render();
}
/* Asked every time the room is drawn, and deliberately not latched: somebody
   whose answer is 「refused」 goes to iOS's own settings, turns it on, and
   comes back to this screen. A latch would leave the room saying the opposite
   of what the phone now holds until the app was closed. */
function pushStAsk(){
  var np=pushPlug();
  if(!np) return;
  np('LinguaPush', 'status', {})
    .then(function(r){ pushStGot(r && r.status); })
    ['catch'](function(){});
}

/* THE ADDRESS, ASKED FOR AT THE ONE MOMENT A SESSION ARRIVES.
   netTook() in www/net.js is the only caller and the only place that knows a
   session arrived -- meFor(), planFor(), langTookFor() and storeSync() are
   all there for the same reason. **There is no second road**: obIn() does not
   call this, because the door goes through netTook() and a second call would
   be two answers to 「who is at this handset」.

   It decides everything itself and is safe to call twice, which is what lets
   it be a call rather than a condition. No account, no native side, or a
   refusal: nothing goes up and nothing is said. A refusal is not a failure to
   report -- it is somebody answering iOS's question. */
function pushAsk(){
  var np=pushPlug();
  if(!np || !netSignedIn()) return;
  np('LinguaPush', 'ask', {})
    .then(function(r){
      pushStGot('authorized');
      if(r && r.token) netDevicePut(r.token);
    })
    /* Refused, or Apple never answered. Either way there is no address, so
       there is nothing to send -- and the room says which of the two it is,
       out of iOS rather than out of this. */
    ['catch'](function(){ pushStAsk(); });
}

/* One switch moved. The field is written, the copy on this phone is kept so
   the row is right in the first frame, and it goes up -- which is
   netPrefsPut()'s own shape and not a new one: a setting that waits for a
   server is a setting somebody presses twice. */
function pushSw(k){
  var n=String(k||''), on=!pushWants(n);
  /* WRITTEN OUT BY NAME, one branch each, and that is not a chain standing in
     for a loop. `lingua.set` is held to the rule that every field inside it
     can be NAMED by reading the source (tools/store-check.mjs): a computed
     write is a place to keep somebody's setting that nothing can say the road
     of, and 「a field added tomorrow」 is exactly what that check exists to
     catch. Four names in the table, four names here.

     What that costs is a kind on PUSH_KINDS with no line here -- a switch
     drawn and a switch that does not move. It is what acct-check 81 presses
     all four of. */
  if(n==='follow')     SET.push_follow=on;
  else if(n==='reply') SET.push_reply=on;
  else if(n==='like')  SET.push_like=on;
  else if(n==='boost') SET.push_boost=on;
  else return;
  setKeep();
  netPrefsPut();
  render();
}

/* iOS's own settings, where the permission itself is turned back on.
   `LinguaShare.settings` is the road and it lands on Settings → Lingua.

   IT IS A SECOND PLACE NAMING THAT CALL -- kbSettings() in www/keyboard.js is
   the first -- and that is written down rather than hidden: the two say
   different words when it fails, because one is about a keyboard and this is
   about notifications, and folding them into one would be a rename in a file
   this session does not own. docs/scope/r48-push-app.md carries it. */
function pushSettings(){
  var np=pushPlug();
  if(!np){ toast(t('push.no')); return; }
  np('LinguaShare', 'settings', {})['catch'](function(){ toast(t('push.no')); });
}

/* The settings room. Four rows and a switch on each, and above them -- only
   when iOS says the permission was refused -- one row saying so, which opens
   iOS's settings. That row is a STATE and not an explanation: the app has had
   something taken away from it and the screen would otherwise be four
   switches that do nothing with no cause and no way out (CLAUDE.md
   § Explaining, the narrowing of 2026-08-22).

   The switches are live in that state and are not disabled. They are
   `profile.prefs`, which is this account on every phone -- turning `like` off
   here has to hold on the iPad where the permission was given. */
function pushRoomHTML(){
  pushStAsk();
  return (PUSH_ST==='denied'
    ? '<button class="set"' + DO('pushSettings') + '>'+
        '<span class="sl">'+esc(t('push.off'))+'</span>'+
        '<span class="sv">'+ICON_GO+'</span></button>'
    : '')+
    PUSH_KINDS.map(function(k, i){
      return '<button class="set"'+
        (i===PUSH_KINDS.length-1 ? ' style="border-bottom:none"' : '')+
        ' aria-pressed="'+(pushWants(k)? 'true':'false')+'"' +
        DO('pushSw', [k]) + '>'+
        '<span class="sl">'+esc(t('push.'+k))+'</span>'+
        swtHTML(pushWants(k))+'</button>';
    }).join('');
}

/* ---- A NOTIFICATION WAS TAPPED ----------------------------------------

   ios/App/App/LinguaPush.swift calls this, and it is the only caller. On
   `window` rather than declared bare, because a name another program types is
   a name that has to be written down on this side as well -- a bare
   declaration would put it there just the same and say nothing about why it
   exists.

   Swift holds a tap that arrives before this file has been read and hands it
   over when there is something to hand it to, so this is never the thing that
   has to be ready first.

   WHERE IT GOES: the post's own thread if the notification was about a post,
   and the notices otherwise. The payload is somebody else's dictionary --
   it comes off the server through Apple -- so the id is taken as a string and
   used as a route's argument and nothing else. A route that cannot find it
   draws 「the thing you came back for is gone」, which every route taking an
   id already does. */
window.pushOpened=function(p){
  var id=(p && p.post!=null) ? String(p.post) : '';
  if(id){ go('thread', id); return; }
  goTab('notif');
};
