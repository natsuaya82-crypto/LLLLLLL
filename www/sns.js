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
/* Everybody's languages, as they are written. */
function vFeed(){ return snsEmpty('feed'); }
/* Posts, not your own language -- that search is in the build tab, on the
   contents page, because it searches what is on that page. 「snsの探すと横断
   検索は別物ね」 */
function vExplore(){ return snsEmpty('explore'); }
/* Who read you, who answered, who followed. */
function vNotif(){ return snsEmpty('notif'); }
