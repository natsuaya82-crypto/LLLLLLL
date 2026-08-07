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

/* One shape for all three, because all three are the same screen until there
   is something to put in them, and three copies of it would be three places
   to change when there is. */
function snsEmpty(r){
  return '<div class="view">'+
    '<div class="navtop"><span class="navt">'+esc(pageName(r))+'</span></div>'+
    '<div class="body"><div class="empty"><div class="eb">'+esc(t('sns.none'))+'</div></div></div>'+
    tabBar()+'</div>';
}
/* Everybody's languages, as they are written -- which for the moment is
   yours, because there is no server yet and a post has nowhere else to go.
   It is not a placeholder: a post written here is a real post, kept, and it
   is what the timeline will show when the rest of the world arrives. */
function vFeed(){
  var list=postAll(), mf=myFontOn();
  /* Whether YOUR font is switched on is a setting of this phone, so it is
     read here, once, and handed to the row -- which puts it only on a post
     that is yours. list.map(postRow) would have handed each row its index
     instead, and every post after the first would have worn it.  */
  return '<div class="view">'+
    '<div class="navtop"><span class="navt">'+esc(pageName('feed'))+'</span></div>'+
    '<div class="body">'+
    (list.length
      ? list.map(function(p){ return postRow(p, mf); }).join('')
      : '<div class="empty"><div class="eb">'+esc(t('sns.none'))+'</div></div>')+
    '</div>'+
    /* Where every timeline puts it: over the feed, above the bar, under the
       thumb of the hand already holding the phone. */
    '<button class="fab"' + DO('openPost') + ' aria-label="'+esc(t('post.new'))+'">'+
      ICON_ADD2+'</button>'+
    tabBar()+'</div>';
}
/* Posts, not your own language -- that search is in the build tab, on the
   contents page, because it searches what is on that page. 「snsの探すと横断
   検索は別物ね」 */
function vExplore(){ return snsEmpty('explore'); }
/* Who read you, who answered, who followed. */
function vNotif(){ return snsEmpty('notif'); }
