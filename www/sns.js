/* Lingua — the timeline, the search and the notices (chapter 16)
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   Three of the five tabs. None of them has anything in it yet, and that is
   what they say: there is no card headed "coming soon", no dashed outline of
   a feature, no count of zero dressed up as a statistic. A tab that opened on
   a promise was the last thing this app did wrong at the bottom of the
   screen. 「なんで下タブはsns用に作ったのにそれすら存在しないゴミデータなの？」

   They exist now because the shape of the app is the thing being decided --
   where the timeline sits, what the thumb reaches -- and that is a decision
   about five tabs, not about three of them plus an intention.
   ========================================================================= */

/* =========================================================================
   16. The timeline, the search and the notices
   ========================================================================= */

/* Nothing here yet, said once. The timeline says it too, on the day the
   account is new, and it has to say the same thing. */
function snsNone(){
  return '<div class="empty"><div class="eb">'+esc(t('sns.none'))+'</div></div>';
}
/* One shape for the search and the notices, because both are the same screen
   until there is something to put in them, and two copies of it would be two
   places to change when there is. */
function snsEmpty(r){
  return '<div class="view">'+rootTop(r)+
    '<div class="body">'+snsNone()+'</div>'+
    '</div>';
}
/* A post has a writer, so the timeline is the one part of the app that
   needs to know who you are -- everything else here works with nobody
   signed in at all. Shown instead of the feed/explore/notices rather than
   letting somebody in to read and only refusing at the post button, so the
   one thing that requires an account says so before the tap that would
   have failed. */
function snsLocked(r){
  return '<div class="view">'+rootTop(r)+
    '<div class="body"><div class="empty"><div class="eb">'+esc(t('sns.lock.h'))+'</div>'+
      '<button class="btn" style="margin-top:14px"' + DO('snsSignIn') + '>'+
        esc(t('sns.lock.cta'))+'</button>'+
    '</div></div></div>';
}
/* Sending somebody to sign in from the middle of the timeline rather than
   settings -- obBackTo() is the same door setMail() already uses to land
   back where a person actually was, not step 1 as if they were new. */
function snsSignIn(){ obBackTo(here().r, here().a); go('set', 'acct'); }
/* Everybody's languages, as they are written -- which for the moment is
   yours, because there is no server yet and a post has nowhere else to go.
   It is not a placeholder: a post written here is a real post, kept, and it
   is what the timeline will show when the rest of the world arrives. */
function vFeed(){
  if(!netSignedIn()) return snsLocked('feed');
  var list=postAll();
  /* A row takes one argument again. It used to take a second -- whether YOUR
     font was switched on -- and `list.map(postRow)` handed each row its index
     as that argument, so post 0 was right and every post after it wore my
     font anyway. There is no font to hand it now: a post carries the shapes
     its own line is written in, so a row is read out of the row. */
  return '<div class="view">'+
    rootTop('feed')+
    '<div class="body">'+
    (list.length
      ? list.map(postRow).join('')
      : snsNone())+
    '</div>'+
    /* Where every timeline puts it: over the feed, above the bar, under the
       thumb of the hand already holding the phone. */
    '<button class="fab"' + DO('openPost') + ' aria-label="'+esc(t('post.new'))+'">'+
      ICON_ADD2+'</button>'+
    '</div>';
}
/* Posts, not your own language -- that search is in the build tab, on the
   contents page, because it searches what is on that page. 「snsの探すと横断
   検索は別物ね」 */
function vExplore(){ return netSignedIn()? snsEmpty('explore') : snsLocked('explore'); }
/* Who read you, who answered, who followed. */
function vNotif(){ return netSignedIn()? snsEmpty('notif') : snsLocked('notif'); }
