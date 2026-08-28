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
function snsNoneFo(){
  return '<div class="empty"><div class="eb">'+esc(t('sns.none.fo'))+'</div></div>';
}
/* ---- the timeline is online -------------------------------------------
   A post has a writer. So the timeline is the one part of this app that has
   to know who you are -- reading it and writing to it both -- and it did not
   ask at all. The three tabs and the composer were built when there was no
   server: a post was an object in localStorage, it had nowhere to go, and
   nothing ever asked whose it was. The server has asked from the first day
   -- every write in supabase/schema.sql goes through is_member() -- and the
   app simply never did.

   That is not a stage on the way to being online. It is a half-online state,
   and a half-online state is a bug: signed out, somebody could write a post
   that went nowhere, to a timeline nobody else was on.
   「なんでログインしてないアカウントで投稿できんの？そんなsnsどこにあんの？」
   「最初からオンライン前提で作れ」

   The making side is untouched and stays untouched. A language is made on
   this phone, with or without a name on the account.

   What this answers is narrower than it was, and it is not "sign in": the
   app signs itself in at first launch, so there IS a session on every phone
   that has ever had a signal, and the three tabs open on it. This is the
   one case left -- no session at all, which is a first launch with no
   network. The door is what to show, because a session is what is missing
   and the door is where one comes from.

   Who you ARE is asked elsewhere and one press later: obNeed(), at the six
   things other people would see. One door and not a second one either
   way -- obDoorHTML() is the same screen wherever it is shown. */
function snsLocked(r){
  OBM.mode='in'; OBM.msg='';
  return '<div class="view">'+rootTop(r)+
    '<div class="body"><div class="ob center">'+obDoorHTML()+'</div></div>'+
    '</div>';
}
/* ---- the two timelines -------------------------------------------------
   「ツイートはフォロー中とおススメみたいに分けたいよね」 One timeline is
   everything there is, which is the right screen for arriving and the wrong
   one for keeping up with the four people you actually read.

   They are two different QUESTIONS, not one list filtered twice, and that is
   why `netFeed` takes which one it is being asked for: on a server "everything"
   and "the people I follow" are two queries with two answers, and a phone that
   asked for everything and then threw most of it away would be downloading a
   timeline to hide it. Until there is a server the answer to both is what is
   already here, and `snsMine()` is the sieve — which is the seam being filled
   in, not the design.

   Following is by HANDLE, off the post, the way everything on the reading side
   is: `p.hd` is who wrote it, frozen when it was written. Your own are in it,
   because a timeline of people you follow that leaves you out is a timeline
   you cannot see yourself having spoken in.

   THE TWO ARE NO LONGER A ROW OF TABS OVER THE TIMELINE.
   「タイムラインの見た目 X すぎて炎上しそうだから、おすすめ・フォローなくして
   基本おすすめ」 OWNER 2026-08-28. Two tabs across the head of a timeline is
   the shape of somebody else's app, and this one arrives as the one it was
   always going to arrive as.

   `snsTab` stays and still starts at 'rec'. Which timeline is being asked for
   is a real question -- `netFeed` takes it, and on a server the two are two
   queries with two answers -- so what went is the ROW, not the question. It
   is answered in the corner of the bar now, which is the block below. */
var snsTab='rec';
function snsMine(p){ return !!p.mine || meFollows(p.hd); }
function snsList(){
  var all=postAll();
  return (snsTab==='fo')? all.filter(snsMine) : all;
}
/* ---- and where the two are chosen ---------------------------------------
   「右上にフィルター作ってフォロー中、自分が好きなトピックとかで見れるように
   できる？」 OWNER 2026-08-28.

   A PAGE and not a sheet. CLAUDE.md bans 「ページ遷移型にせず下からひょいって
   出すやつ」 and says the same thing the other way round: choosing is a
   screen, changing is the screen you arrive at. So the corner of the
   timeline's bar is a way THERE, and the choosing happens there.

   The corner also SAYS which one is on. A filter you cannot see the state of
   is a timeline that is quietly not the timeline -- somebody who chose
   「フォロー中」 yesterday arrives on a short list today with nothing on the
   screen to say why.

   What is on the page is the two timelines and nothing else. The owner also
   said 「自分が好きなトピックとか」 and there is nothing in this app that is a
   topic: a post carries which language it is written in and which day's
   question it answers, and no tags. That is the leader's to put to the
   owner, and until it comes back nothing here invents one. */
function snsFilNow(){ return (snsTab==='fo')? 'fo' : 'rec'; }
function snsFilKey(k){ return (k==='fo')? 'feed.fo' : 'feed.rec'; }
/* The mark in the corner of the timeline's bar. rootTop()'s second argument
   is what it is for -- www/home.js already puts the contents page's lens
   there -- so this is the same bar with the same corner and no new one. */
function snsFilTop(){
  return '<button class="navq"' + DO('go', ['filter']) + '>'+
    esc(t(snsFilKey(snsFilNow())))+'</button>';
}
function vFilter(){
  var ks=['rec','fo'];
  /* The page that lists them asks for them. Once a session, and it draws
     what the phone already has while the answer is on its way. */
  snsSavedPull();
  return '<div class="view">'+navTop('')+'<div class="body">'+
    ks.map(function(k){
      return '<button class="set"' + DO('snsSetFil', [k]) + '>'+
        '<span class="sl">'+esc(t(snsFilKey(k)))+'</span>'+
        '<span class="sv">'+(snsFilNow()===k? ICON_TICK : '')+'</span></button>';
    }).join('')+
    /* And the words somebody keeps, under the two timelines because they are
       the same question asked a third way: what am I looking at. The heading
       is a NAME and not an explanation -- vWsys puts `dir.title` over its
       three directions in the same shape. Nothing at all when none are kept,
       rather than a heading over an empty space. */
    (snsSaved().length
      ? '<div class="sec">'+esc(t('sns.saved'))+'</div>'+
        snsSaved().map(function(q){
          return '<button class="set"' + DO('snsPickSaved', [q]) + '>'+
            '<span class="sl">'+esc(q)+'</span>'+
            '<span class="sv">'+ICON_GO+'</span></button>';
        }).join('')
      : '')+
    '</div></div>';
}
/* Chosen, and then you are back on the thing it is about. The same shape as
   every other chooser that is a page of its own: the answer is the reason
   you came, so there is nothing left to do here. */
function snsSetFil(k){
  snsTab=(k==='fo')? 'fo' : 'rec';
  back();
}
/* Everybody's languages, as they are written. This said "which for the moment
   is yours, because there is no server yet and a post has nowhere else to go",
   and went on saying it after netPush() and netFeed() existed -- the same week
   docs/STATE.md § 3 was saying the opposite about the same code. A post goes to
   the server and comes back from it; localStorage is the copy that survives a
   bad network, not the only place one exists. */
/* What has arrived, asked for whenever the timeline is looked at. The screen
   does NOT wait: it draws the posts that are here and takes an answer when
   one comes, which is what a timeline does and is the only shape that works
   on a phone in a tunnel. The answer is whatever netFeed() brings back, and
   postCatchUp() sends whatever this phone has that the server has not.

   `snsPulling` stops a second ask while one is out -- a person flicking
   between tabs would otherwise have four in the air. */
var snsPulling=false;
function snsPull(){
  if(snsPulling) return;
  snsPulling=true;
  netFeed(snsTab, function(ps){
    snsPulling=false;
    /* And what this phone has that the server has not. It goes off the back
       of a pull rather than on a timer: the moment somebody is looking at a
       timeline is the moment the network is known to be working. */
    postCatchUp();
    if(!ps || !ps.length) return;
    postTake(ps);
    render();
  }, function(){ snsPulling=false; });
}
/* ---- pulling a timeline down to ask again --------------------------------
   「プルトゥーリフレッシュも入れて欲しい」 OWNER 2026-08-28.

   ONE mechanism for the three screens the timeline is made of, and that is
   the whole reason it is here rather than three times: a rule written out on
   the feed, the search and the notices is a rule the fourth screen will not
   have. Which routes it answers on is a table, so a screen added to the
   timeline is pulled the day it is added.

   Only from the TOP. Anywhere else a finger going down the screen is a
   person scrolling, and a page that reloaded itself in the middle of a
   timeline would be taking the thing they were reading away.

   It has to be FELT. Nothing on a phone says "let go now" except the page
   moving, so the body follows the finger at half speed and stops -- half,
   because a list that keeps up exactly with the thumb reads as the page
   having come loose. The bar does not move: it is outside `.body`, so what
   slides is the timeline and what stays is where you are.

   Already asking is not asked twice. `snsPulling` and `notPulling` have held
   that since the two pulls were written -- a person flicking between tabs
   would otherwise have four asks in the air -- so this hands the pull to
   them and they refuse it, rather than a third place keeping a third flag.

   It does NOT fight the profile tab's hold in www/shell.js. That one arms on
   an element carrying `data-hold` and disarms on any touchmove, which is
   exactly right: a pull is not a hold. And preventDefault stops the browser
   bouncing the page, not the other listeners -- they are still called. */
var PULL_R=0.5, PULL_GO=64, PULL_MAX=96;
var PULL_ON={feed:1, explore:1, notif:1};
var pullY=-1, pullEl=null, pullAt=0;
/* Which timeline is under the finger, or '' for a screen this is not about.
   Signed out there is nothing to ask for: the three screens are the door. */
function pullWhere(){
  var r=here().r;
  return (PULL_ON[r] && netSignedIn())? r : '';
}
/* How far the page has been scrolled. `scrollingElement` is the one that
   knows on a modern browser and is not there on an old WKWebView, which is
   what the other two are for. */
function pullTop(){
  var d=document.scrollingElement || document.documentElement || document.body;
  return Math.max(0, window.pageYOffset||0, (d? d.scrollTop : 0)||0);
}
function pullStart(e){
  pullY=-1; pullEl=null; pullAt=0;
  if(!pullWhere()) return;
  if(!e.touches || e.touches.length!==1) return;
  if(pullTop()>0) return;
  pullY=e.touches[0].clientY;
  pullEl=document.querySelector('#app .view > .body');
}
function pullMove(e){
  if(pullY<0 || !pullEl) return;
  if(!e.touches || e.touches.length!==1){ pullLet(false); return; }
  var dy=e.touches[0].clientY-pullY;
  /* Upwards, or the page moved under the finger: an ordinary scroll, and it
     never was a pull. */
  if(dy<=0 || pullTop()>0){ pullLet(false); return; }
  /* And the page does not bounce as well. `cancelable` is false once the
     browser has already decided this gesture is a scroll. */
  if(e.cancelable) e.preventDefault();
  pullAt=Math.min(PULL_MAX, dy*PULL_R);
  pullEl.style.transform='translateY('+pullAt+'px)';
}
function pullEnd(){ pullLet(pullAt>=PULL_GO); }
/* Let go: the body goes back where it was, and far enough down it asks.
   The transition is put on for the way back and taken off after it, or the
   next render's first paint would animate from wherever this left it. */
function pullLet(ask){
  var el=pullEl, r=pullWhere();
  pullY=-1; pullEl=null; pullAt=0;
  if(el){
    el.style.transition='transform .22s ease-out';
    el.style.transform='';
    setTimeout(function(){ if(el.style) el.style.transition=''; }, 300);
  }
  if(!ask) return;
  if(r==='notif') notPull(); else if(r) snsPull();
}
/* touchmove has to be able to say no to the browser's own bounce, and a
   listener the browser thinks is passive cannot. Whether the third argument
   is read as an options object or as `capture` is the one thing that differs
   between the WKWebView this runs in and the one it was written on, so it is
   asked rather than assumed -- handing an object to a browser that wants a
   boolean would register this in the capture phase instead. */
var PULL_OPT=false;
try{
  var pullProbe=Object.defineProperty({}, 'passive',
    { get: function(){ PULL_OPT=true; return false; } });
  window.addEventListener('lingua-pull', null, pullProbe);
  window.removeEventListener('lingua-pull', null, pullProbe);
}catch(pullNo){}
document.addEventListener('touchstart',  pullStart, false);
document.addEventListener('touchmove',   pullMove, PULL_OPT? {passive:false} : false);
document.addEventListener('touchend',    pullEnd, false);
document.addEventListener('touchcancel', pullEnd, false);

/* ---- and reaching the bottom ---------------------------------------------
   「下まで行ったら勝手に更新される感じ。文字は出さない」 OWNER 2026-08-28,
   through the leader.

   The other end of the pull, and the same shape for the same reason: which
   routes it answers on is a table, not a rule written out on each screen.
   **The notices are not one of them** -- 「通知は不要」 -- so `MORE_ON` has
   two entries where `PULL_ON` has three, and that difference is the decision
   rather than an oversight.

   NOTHING IS SAID ON THE SCREEN. No spinner, no "loading", no "that is all
   there is". 「文字は出さない」, and CLAUDE.md bans the explaining anyway:
   more posts arriving under the ones already there is the whole of the
   feedback, because it is the thing that happened.

   Three states and they are three, not two. Asking is not "there is more",
   and "there is no more" is not "could not ask" -- a phone in a tunnel that
   was told there is nothing left would stop asking for the rest of the
   session and the timeline would simply end. `snsMoreAsk` is the one in the
   air; `snsMoreEnd` is set only by an answer that came back SHORT, which is
   the server saying it has run out. */
var MORE_ON={feed:1, explore:1};
var MORE_NEAR=600;
var snsMoreAsk=false, snsMoreEnd=false;
function snsMoreWhere(){
  var r=here().r;
  if(!MORE_ON[r] || !netSignedIn()) return '';
  /* The search has a second condition the timeline does not, and measuring
     is what found it: a search with nothing on it is SHORTER than the phone,
     so its foot is already in view and the bottom was reached the moment the
     screen opened. There is nothing to continue either -- what comes after
     the oldest post of a search nobody has made is not a question. So it
     pages a search that has brought posts back, and not the empty screen and
     not a list of people, which is a different query. */
  if(r==='explore' && !(snsHits && snsHits.posts && snsHits.posts.length)) return '';
  return r;
}
/* How far the foot of the page is from the foot of the window. Asked of the
   document rather than of a screen, the same way pullTop() is. */
function snsMoreLeft(){
  var d=document.documentElement, b=document.body,
      h=Math.max(d? d.scrollHeight : 0, b? b.scrollHeight : 0);
  return h - (pullTop() + (window.innerHeight||0));
}
function snsMoreCheck(){
  if(snsMoreAsk || snsMoreEnd) return;
  if(!snsMoreWhere()) return;
  if(snsMoreLeft() > MORE_NEAR) return;
  snsMore();
}
/* THE SEAM, and the network side of it is deliberately not here.

   Asking for the posts AFTER the ones already on screen is www/net.js's, and
   nothing in that file can do it yet: `netFeed()` and `netFindPosts()` both
   end in `&order=created_at.desc&limit=' + NET_PAGE` with no offset and no
   cursor, so there is no page two to ask for. That file belongs to another
   session; the call goes in here, as one line, the day its name arrives.

   What is here is the half that is this screen's and is the same whatever
   that function turns out to be called: WHEN to ask, and not asking again
   while one is out. It is written now rather than with the call because a
   page that fires four asks while the first answer is still in the air is a
   bug this end owns.

   WHAT THE ANSWER MUST DO, so that it is written down before it is written:

     snsMoreAsk=false;                        always, refused or not
     if(!ps) return;                          could not ask -- NOT the end
     if(ps.length < NET_PAGE) snsMoreEnd=true; a short answer IS the end
     if(ps.length){ postTake(ps); render(); }

   The middle two are the ones that cannot be collapsed. A phone in a tunnel
   answering `null` must not set the end, or the timeline stops for the rest
   of the session; and a short answer is the only thing that may set it, or
   the bottom asks for ever. */
function snsMore(){
  if(snsMoreAsk) return;
  snsMoreAsk=true;
  /* www/net.js, one line: ask for what comes after the oldest post on
     screen. Nothing is in the air until it exists, so the flag comes back
     down here -- otherwise the first touch of the bottom would switch this
     off for the rest of the session. */
  snsMoreAsk=false;
}
window.addEventListener('scroll', snsMoreCheck, false);

/* Where an appeal goes. An address and not a form: a frozen account cannot
   write a row anywhere -- every write policy in supabase/schema.sql goes
   through is_member() and that is the whole of what being frozen means -- so
   a form here would need a table with the door open, which is a door. Mail
   is a channel that already exists and is not ours to break. */
var APPEAL='mailto:Lingua@tokinets.com?subject=Lingua';
/* ---- the timeline the onboarding shows ---------------------------------
   「君の文字でSNSを見てみよう（モックのページ）」 and then
   「TLの見た目全然違うだろちゃんと同じにしろ」 OWNER 2026-08-28.

   The onboarding's SNS stage used to draw a timeline of its own -- the rows
   were postRow(), so the POSTS were right, but the screen around them was the
   onboarding's frame: no bar, no row to write in, no two tabs, no round
   button, no tab bar. It was a second timeline, and a second one is a rule
   written down twice: the day somebody adds a thing to the feed, one of the
   two gets it.

   So there is one timeline and this is it. What the onboarding changes is
   WHOSE POSTS are on it and nothing else -- obSnsMock() in www/onboard.js
   hands back six made-up people while that stage is showing, and null every
   other moment of the app's life. Every line below is the line the real
   timeline has always run.

   It is asked THROUGH a function rather than read off a variable so that this
   file needs to know nothing about the onboarding's steps. */
function snsMock(){
  return (typeof obSnsMock==='function')? obSnsMock() : null;
}
function vFeed(){
  /* A mock timeline is shown to somebody who has no account yet -- the door is
     the step after the one after this -- so the two things a real feed opens
     with are both wrong here: the sign-in wall, and the two network asks.
     Nothing is fetched for a timeline that is not anybody's. */
  var mock=snsMock();
  if(!mock && !netSignedIn()) return snsLocked('feed');
  if(!mock){
    snsPull();
    /* Beside the feed's own pull and for the same reason: the moment somebody
       is looking at a timeline is the moment the network is known to be
       working. Once a session -- dayPull() returns immediately once it has one. */
    dayPull();
  }
  var list=mock||snsList();
  /* A row takes one argument again. It used to take a second -- whether YOUR
     font was switched on -- and `list.map(postRow)` handed each row its index
     as that argument, so post 0 was right and every post after it wore my
     font anyway. There is no font to hand it now: a post carries the shapes
     its own line is written in, so a row is read out of the row. */
  return '<div class="view">'+
    rootTop('feed', snsFilTop())+
    '<div class="body">'+

    /* A row to write in, at the top of the timeline, because the round button
       is one floating thing over the corner of a screen and somebody who does
       not see it has no way to post at all. 「ホームからもツイートできるように」
       It is not a field: pressing it opens the screen a post is written on,
       which is where the letters, the photographs and the voice are. */
    (NET_BANNED? '' : dayRow())+
    /* Frozen, said here and nowhere else. Not a notice -- 「通知はいらんて
       ホーム画面にバンでいいやん」 -- and not a coloured strip over a
       timeline that goes on scrolling underneath it: it takes the timeline's
       place, which is what every app that does this does and is the only
       shape that cannot be scrolled past.

       The three tabs stay open and the making side goes on working
       「3タブを閉じる必要もないし。ホームに出ればいいやん」. Every door being
       frozen shuts is shut by is_member() in supabase/schema.sql whether or
       not anything on screen says so; this is the saying so. */
    (NET_BANNED
      ? '<div class="empty"><div class="eb">'+esc(t('post.out'))+'</div>'+
          /* The one place in this app that explains itself, and it is here
             because not knowing is worse than being told: somebody who finds
             the buttons gone and no sentence anywhere has to guess whether
             the app is broken. 「必要な説明は書いてね。見てわからないのが
             一番ダメ。最低限ね」

             Two lines. What is off, and the way to say it is wrong -- a
             freeze can be lifted, so there has to be somewhere to write. */
          '<div class="es">'+esc(t('out.what'))+'</div>'+
          '<a class="btn ghost outapp" href="'+esc(APPEAL)+'">'+
            esc(t('out.appeal'))+'</a>'+
        '</div>'
      : list.length
      ? list.map(postRow).join('')
      /* Two different emptinesses. Nothing at all is a timeline that has not
         started; nothing HERE, with posts on the other tab, is a person who
         has not followed anybody yet, and telling them "nothing has been
         written" would be the app being wrong about its own contents. */
      : (snsTab==='fo'? snsNoneFo() : snsNone()))+
    '</div>'+
    snsFab()+
    '</div>';
}
/* The way to write, and it is one thing in one place.

   The timeline has had it since there was a timeline, and nothing else did.
   But the app does not open on the timeline -- `route` starts at `profile`
   and NAV starts at `profile` -- so somebody who never pressed the home tab
   was standing on a screen with a list of their own posts and no way to add
   one. 「プロフィール画面の右下に＋がないから投稿ができない」

   Where every timeline puts it: over the list, above the bar, under the
   thumb of the hand already holding the phone.

   Both conditions travel with it rather than being restated at each end.
   Signed out there is nobody to post as; frozen, the composer would refuse
   -- and a button that cannot do its one thing is worse than no button: it
   is the app asking somebody to find out. */
/* ---- the day's sentence -------------------------------------------------
   One sentence a day, put up by us, that anybody may answer in their own
   language. It is the loop this whole thing turns on: everyone already knows
   what the day's sentence means, so a feed of two hundred unreadable scripts
   becomes two hundred readable ones, and nobody has to learn anything to read
   it. The words are schema.sql's, where the table was designed and then sat
   unused; this is the half that shows it.

   It stands where the row you write in stood, because it IS that row -- the
   round button is one floating thing over a corner and somebody who does not
   see it has no way to post at all 「ホームからもツイートできるように」. When
   there is no sentence -- offline, or a day the writer missed -- it is that
   row again, unchanged. A screen that half-works is a bug; a screen that
   goes back to what it was is not. */
var DAY=null, dayPulling=false;
function dayPull(){
  if(dayPulling || DAY) return;
  dayPulling=true;
  netDay(function(p){
    dayPulling=false;
    if(!p) return;
    DAY=p;
    render();
  });
}
/* In the person's own language, and the English one under it. A Japanese
   speaker reading an English prompt is doing two translations and only the
   second one is the game -- owner, 2026-08-23. */
function daySay(){
  var m=(DAY && DAY.says) || {};
  return String(m[uiLang()] || (DAY && DAY.text) || '');
}
/* Which day this sentence is FOR, drawn. 「日付ないし」

   `on_day` has been on the row since the column existed and no screen has
   ever shown it, so a sentence written on the 23rd and a sentence written
   this morning looked exactly alike -- under a label that says "Today" in
   both cases. netDay() asks for the newest row rather than today's, and says
   so on purpose: the app does not work out what day it is in California,
   because that is a timezone rule and a second copy of one is a second one to
   get wrong. That decision is kept. What it needs to be honest is the date
   ON the screen, and that is this.

   UTC, and not the phone's midnight: `on_day` is a date and not a moment, so
   `new Date('2026-08-25')` is UTC midnight and a phone west of Greenwich
   would draw it as the 24th. tools/../www/numbers.js:350 has the same line
   for the same reason.

   The year is left off when it is this year, which is what postWhen() does
   four screens away. */
function dayWhen(){
  var s=(DAY && DAY.on_day)? String(DAY.on_day) : '', d, now;
  if(!s) return '';
  d=new Date(s.length>10? s : s+'T00:00:00Z');
  if(isNaN(d.getTime())) return '';
  now=new Date();
  try{
    return d.toLocaleDateString(uiLang(),
      (d.getUTCFullYear()===now.getFullYear())
        ? {month:'short', day:'numeric', timeZone:'UTC'}
        : {year:'numeric', month:'short', day:'numeric', timeZone:'UTC'});
  }catch(e){ return s; }
}
/* One row, and the face fills both of its lines: the day's sentence over
   what you are being asked to do with it. 「アイコンは2列分うめて その横から
   お題と自分の言語で入れるのは？」

   It is the same skeleton every post on the timeline has -- a face on the
   left, two lines of type beside it -- so the top of the feed is the shape
   the rest of the feed is. It is also SHORTER than the row it replaces plus
   a line: the face already reserves the height the two lines use.

   The label in front of the sentence is the SCREEN's name read back with
   pageName() rather than a string of its own; naming a screen twice is what
   rule 2's NAMES claim exists to refuse.

   No sentence -- offline, or a day the server missed -- and it is the one
   grey line this row has always been. */
function dayRow(){
  var say=daySay();
  if(!say){
    return '<button class="wrow"' + DO('openPost') + '>'+
      '<span class="pav">'+
        postFace({who:meName(), lname:langName, av:postAvatar()})+'</span>'+
      '<span class="wrt">'+esc(t('post.ln.ph'))+'</span>'+
    '</button>';
  }
  return '<button class="wrow dayrw"' + DO('openPost', ["day"]) + '>'+
    '<span class="pav">'+
      postFace({who:meName(), lname:langName, av:postAvatar()})+'</span>'+
    '<span class="dayrb">'+
      '<span class="dayline">'+
        '<span class="dayk">'+esc(t('day.k'))+'</span>'+esc(say)+'</span>'+
      /* The date goes on the SECOND line and not beside the label, because
         `.dayline` is one line with an ellipsis on it -- anything put in
         front of the sentence is taken off the end of the sentence, and the
         sentence is what the row is for. */
      '<span class="wrt">'+esc(t('day.ask'))+
        (dayWhen()? '<span class="dayd">'+esc(dayWhen())+'</span>' : '')+
        '</span>'+
    '</span>'+
  '</button>';
}
/* `from` was a parameter nobody ever passed -- both callers say `snsFab()` --
   so the argument this button carried was always none, and openPost() was
   asked for "whatever PW happens to hold". It says 'new' now, which is the
   one thing this button has ever meant. */
function snsFab(){
  /* The onboarding's timeline carries it too -- it is one of the five things
     the owner named as missing -- and there it is scenery: that whole stage is
     sealed under one pad, so nothing on it is ever pressed. Written as one
     condition and not as a second return, because two returns building the
     same button is the thing this whole change is about. */
  if(!snsMock() && (!netSignedIn() || NET_BANNED)) return '';
  return '<button class="fab"' + DO('openPost', ["new"]) +
    ' aria-label="'+esc(t('post.new'))+'">'+ICON_ADD2+'</button>';
}
/* ---- one conversation --------------------------------------------------
   The timeline is every post there is, newest first, which is the right shape
   for arriving and the wrong one for following an argument: a reply and the
   thing it replies to are an hour apart in it and nothing between them says
   they belong together. 「リプライ含めツリーが見れないのちょっと厄介」

   So a post opens onto the conversation it is in, and there are three parts
   to that and they are not the same thing:

     above   everything this post is an answer to, oldest first
     here    the post itself, which is not a way anywhere
     below   everything answering it, indented by how deep it is

   The rows are `postRow` and only `postRow` -- the same one the timeline
   draws, so a post reads the same here as it does there and there is no
   second place a post is rendered.

   What the top counts is how many replies are IN FRONT OF YOU, not `re`.
   They agree today, because every post anybody has made is on this phone;
   after a server they will not, and the number on the screen has to be the
   number of rows under it or it is the app arguing with itself. */
function vThread(){
  var id=String(here().a||''), p=postById(id), ups, down, out='', i, d;
  /* Blocked is gone, not merely absent from the list: a thread reached by an
     old route is the one way a post could still be looked at. */
  if(!p || postBlocked(p)) return viewGone();
  ups=postUps(p);
  down=postDown(id, 0, [], [id]);
  /* Whatever was above it and whatever answers it, less anything that has
     been taken down -- 「それ以外の会話は本ツイートとは関係ないものとする」.
     A reply that went is not a hole to be marked; it is a line somebody else
     wrote, and the conversation does not stand or fall with it. */
  for(i=0;i<ups.length;i++) if(!postGone(ups[i])) out+=postRow(ups[i]);
  /* The one post somebody came here to read is the exception. It went, and
     saying so is the whole point of it having gone -- a gap here reads as
     "never existed", which is the opposite of what happened.
     「スレッドは本ツイートだけね？」 */
  out+=postGone(p)? postTomb() : postRow(p);
  for(i=0;i<down.length;i++){
    if(postGone(down[i].p)) continue;
    d=Math.min(down[i].d, THREAD_IN);
    out+='<div class="pind pind'+d+'">'+postRow(down[i].p)+'</div>';
  }
  return '<div class="view">'+navTop()+'<div class="body">'+
    out+
    '</div></div>';
}
/* ---- one photograph ----------------------------------------------------
   The timeline shows a picture inside a maximum, because a row as tall as
   whatever somebody posted is a timeline one post long. This is where the
   rest of it is: the whole picture, as big as the phone will show it, at its
   own shape. Nothing is cropped here either — `contain` is doing what it is
   for, the box being the screen.

   The route's argument is the post and which of its pictures, because a post
   carries up to four and "the photograph" is not a thing a post has. A post
   that is gone, or an index it does not have, is the same answer the rest of
   the app gives: the thing you came back for is gone. */
function vPhoto(){
  var a=String(here().a||''), i=a.indexOf(':'),
      p=postById(i<0? a : a.slice(0, i)),
      n=parseInt(i<0? '0' : a.slice(i+1), 10)||0,
      pics=postPics(p);
  if(!p || !pics[n]) return viewGone();
  return '<div class="view">'+navTop(pics.length>1? String(n+1)+'/'+pics.length : '')+
    '<div class="body">'+
      '<div class="pview"><img class="pvimg" src="'+esc(pics[n])+'" alt=""></div>'+
    '</div></div>';
}
/* ---- searching ---------------------------------------------------------
   Posts and people, not your own language -- THAT search is in the build tab,
   on the contents page, because it searches what is on that page.
   「snsの探すと横断検索は別物ね」

   One field. `@` was the switch -- a query starting with it looked for a
   person and anything else looked for a post 「@でユーザー検索」 -- and it is
   not any more: `snsMode` is, and it starts on people and goes back to people
   the moment anybody types 「それまでは人」. This paragraph went on saying the
   old thing after the switch moved, which is how the `@` came to be typed
   straight through to the server as part of the handle being looked for.
   What `@` means now is only what it looks like: it is dropped off the front
   of a name, because that is where people put it.

   SNS_SEAM. A search is a QUESTION ASKED OF SOMEWHERE ELSE, and it is built
   as one: snsFind(q, done) hands back an answer through a callback, the way
   postTr() and the AI already do, because that is the shape a request has and
   a shape cannot be retrofitted onto a function that returns. Nothing at the
   call site knows or cares where the answer came from -- it types, an answer
   arrives, the rows are drawn.

   Until net.js is wired, the answer is assembled out of what has already
   arrived. That is not the design; it is what the seam is filled with today,
   the same way `tr` is absent and postTr() answers nothing. When there is a
   server, snsFind() asks it and everything else is unchanged.

   A PERSON is `{who, hd, av, lname}` -- the same four fields a post already
   carries about its author, and the same four a server row will have. There
   is no second shape for a person anywhere in this app, and there must not
   be: a post is signed with exactly these, so the search and the timeline are
   describing the same thing. */
/* `snsMode` is which of the two the search is about -- people, or posts. It
   starts on people and goes back to people the moment anybody types.
   「それまでは人」 */
var snsQ='', snsHits=null, snsMode='who', snsSort='new';
function snsSetQ(v){
  snsQ=String(v||'');
  /* Typing is looking for somebody again. A query that answered with posts
     and then went on answering with posts as the next name was typed would
     be a screen that changed what it was about and never changed back. */
  snsMode='who';
  lnGrow('sns-q');
  snsFind(snsQ, snsGot);
  var x=document.getElementById('sns-x');
  if(x){ if(snsQ) x.removeAttribute('hidden'); else x.setAttribute('hidden',''); }
}
/* An answer, whenever it comes. It is checked against what is in the field
   now, because a slow answer to a query somebody has already typed past is
   the oldest bug a search has. */
function snsGot(r){
  if(!r || r.q!==snsQ.trim()) return;
  snsHits=r;
  var e=document.getElementById('sns-hits');
  if(e) e.innerHTML=snsHitsHTML();
  postFaces(); postLines();
}
function snsClearQ(){ snsQ=''; snsHits=null; snsMode='who'; render(); }
/* SNS_SEAM — ask for what matches `q` and call done() with
   { q: <the query it answers>, who: [person, …], posts: [post, …] }.
   `q` comes back on the answer so a late one can be thrown away.

   The two lists are exclusive by the `@`: a query for a person asks for
   people and gets no posts, and the other way round. That is the server's
   business too -- it is cheaper to ask for one thing.

   AND THIS IS WHERE THE ORDER IS ASKED FOR. `snsSort` is 'new' or 'buzz',
   and netFindPosts() does not take it yet -- www/net.js is another session's
   and the ordering lives there, beside the numbers that make it. When it
   takes one, it is the call below and nothing else on this screen: what
   comes back is drawn in the order it comes back in, which is already true.
   Nothing here scores a post or re-arranges an answer, deliberately. */
function snsFind(q, done){
  q=String(q||'').trim();
  if(!q){ done({q:q, who:[], posts:[]}); return; }
  /* People until somebody asks for posts. Typing was searching POSTS unless
     the query began with `@`, so looking for a person meant knowing to type a
     character first -- and what a search on a timeline is for, before you
     know anybody, is finding people. 「人だけにして」「ツイートの検索は検索
     ボタン押したら出てくる。それまでは人」

     Both ask the SERVER. They used to walk this phone's own POSTS, which
     answers with the people you already know and the posts you already have
     -- the one search nobody needs.

     `bad` and not an empty list: nothing found and could not ask are two
     different answers and must not share a branch. */
  function no(d, st){ done({q:q, who:[], posts:[], bad:netWhy(d, st)}); }
  if(snsMode==='posts'){
    netFindPosts(q, function(ps){ done({q:q, who:[], posts:ps}); }, no);
    return;
  }
  /* A handle is stored WITHOUT its @ -- netRow() and the head of a post both
     draw it as '@'+hd -- so `@aya` typed into this field asked the server for
     a handle CONTAINING the character `@`, and no handle contains one.
     netLike() wraps it as *%40aya* and the answer was always nobody.
     「検索で @ を打っても誰も出てこない」

     Only off the front, and only for a person: `@` in the middle of a name is
     a character somebody typed, and a search over posts is a search over text
     where `@` means itself.

     `q` on the ANSWER stays as it was typed. snsGot() throws away a late
     answer by comparing it with what is in the field, and the field has the
     @ in it. */
  var name=q.replace(/^@+/, '');
  if(!name){ done({q:q, who:[], posts:[]}); return; }
  netFindWho(name, function(ws){ done({q:q, who:ws, posts:[]}); }, no);
}
/* Which of the two the answer is about. Where you are standing rather than
   anything the language has, so viewReset() drops it. */
function snsGo(){
  if(!snsQ.trim()) return;
  snsMode='posts'; snsHits=null;
  snsFind(snsQ, snsGot);
  render();
}
/* A person, as a row: the face, the name and the handle, the language they
   write, and the one thing you came here to do about them.
   「⭕️ @〇〇 lingua マーク　フォローする」

   Two controls and not one, so the row is a container: pressing the person
   opens their page, pressing Follow follows them and stays where it is. It
   was one button with a chevron on the end -- which meant the only thing you
   could do with somebody you had just found was go and look at them.

   Your own row has neither: you cannot follow yourself, and the chevron is
   not needed to say where your own name goes. */
function snsWhoRow(p){
  var h=String(p.hd||''), on=meFollows(h);
  var inner='<span class="pav">'+postFace(p)+'</span>'+
    '<span class="whb">'+
      '<span class="pname">'+esc(postWho(p))+'</span>'+
      '<span class="phandle">@'+esc(h)+'</span>'+
    '</span>'+
    (p.lname? '<span class="plangtag">'+esc(p.lname)+'</span>' : '');
  return '<div class="whrow">'+
    (p.mine
      ? '<button class="whgo"' + DO('goTab', ["profile"]) + '>'+inner+'</button>'
      : '<button class="whgo"' + DO('go', ["profile", h]) + '>'+inner+'</button>')+
    (p.mine? ''
      : '<button class="whfo'+(on? ' on' : '')+'"' + DO('meFollow', [h]) + '>'+
          esc(t(on? 'me.unfollow' : 'me.follow'))+'</button>')+
    '</div>';
}
/* ---- the words somebody keeps ------------------------------------------
   「検索ページで言葉を⭐️で保存、絞り込みから選ぶとその言葉で検索し直す」
   OWNER 2026-08-28 -- and it is what the owner meant by 「自分が好きなトピック
   とか」 back when the filter was built. There are no tags in this app and
   none have been invented: a kept word is a SEARCH somebody made, and
   choosing it makes that search again.

   THE SERVER IS THE RECORD AND `SET.saved` IS THE COPY. 「SNSは全部サーバー」
   -- what a person keeps is theirs and follows them to the next phone, so it
   is a row in `saved_search` and not a habit one handset remembers. This
   screen held it in `SET` alone for half a day, which meant a new phone
   arrived with nobody's list; that is the bug this pair of functions closes.

   The copy earns its keep the way every copy in this app does: with no
   signal the filter still opens and still has the words on it. It is never
   where they live.

   `netSearchSave()` and `netSearchDrop()` take the WORDS, not an id --
   `saved_search` is unique on (author, q), so the words are the name of the
   row, and the phone already has them in its hand. */
var ICON_STAR='<svg class="ic" viewBox="0 0 24 24" width="16" height="16" fill="none" '+
  'stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M12 4.2l2.35 4.76 5.25.76-3.8 3.7.9 5.23L12 16.18l-4.7 2.47.9-5.23-3.8-3.7 5.25-.76z"/></svg>';
var ICON_STAR_ON='<svg class="ic" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" '+
  'stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M12 4.2l2.35 4.76 5.25.76-3.8 3.7.9 5.23L12 16.18l-4.7 2.47.9-5.23-3.8-3.7 5.25-.76z"/></svg>';
/* The one place they are read, and it reads the COPY -- so every screen
   draws instantly and draws in a tunnel. What keeps the copy true is the
   pull below. */
function snsSaved(){
  var a=SET.saved;
  return (a && a.length)? a : [];
}
function snsSameWords(a, b){
  var i;
  if(a.length!==b.length) return false;
  for(i=0;i<a.length;i++) if(a[i]!==b[i]) return false;
  return true;
}
/* Asked once, the shape dayPull() already uses: the screens that show these
   call it every time they are drawn, and it returns immediately once it has
   an answer. Without that, writing the answer down calls render(), which
   draws the screen, which asks again.

   `netMember()` is asked HERE and not left to net.js, and that is the whole
   care in this function. netSearchSaved() answers `ok([])` when there is no
   member -- an empty list that means "nobody asked", not "this person keeps
   nothing" -- and writing that over the copy would erase somebody's list on
   a launch that had not signed in yet. So it is not asked at all until there
   is somebody to ask for, and then an empty answer is a real one: they
   deleted them on their other phone, and the copy should follow.

   A refusal leaves the copy exactly as it is. No signal is not an answer. */
var snsSavedAsk=false, snsSavedGot=false;
function snsSavedPull(){
  if(snsSavedAsk || snsSavedGot) return;
  if(!netMember()) return;
  snsSavedAsk=true;
  netSearchSaved(function(rows){
    snsSavedAsk=false; snsSavedGot=true;
    var out=[], i;
    for(i=0;i<(rows||[]).length;i++)
      if(rows[i] && rows[i].q) out.push(String(rows[i].q));
    if(snsSameWords(out, snsSaved())) return;
    SET.saved=out;
    save();
    render();
  }, function(){ snsSavedAsk=false; });
}
function snsIsSaved(q){
  var a=snsSaved(), i, k=String(q||'').trim();
  for(i=0;i<a.length;i++) if(a[i]===k) return true;
  return false;
}
/* And the one place they are written. A toggle, because the star is one
   button and pressing it again is how somebody takes a word off a list they
   put it on -- a second screen to remove one would be a screen. Newest
   first: the word just kept is the one being looked for.

   The row goes up and the copy is written in the same breath, and the screen
   does not wait for the server: a star that only lit once the network came
   back would be a button that does nothing on a train. With no signal the
   copy still changes and the filter still works -- and the word is NOT on
   the server, so the next pull will not find it. That is what "the server is
   the record" costs, and it is the leader's decision of 2026-08-28 rather
   than something worked around here with a queue nobody asked for. */
function snsSaveQ(){
  var k=String(snsQ||'').trim(), a=snsSaved(), out=[], i, had=false;
  if(!k) return;
  for(i=0;i<a.length;i++){ if(a[i]===k) had=true; else out.push(a[i]); }
  if(!had) out.unshift(k);
  if(had) netSearchDrop(k, function(){}, function(){});
  else    netSearchSave(k, function(){}, function(){});
  SET.saved=out;
  save();
  render();
}
/* Chosen from the filter, and it SEARCHES rather than taking you to a field
   with the word already in it. snsHits is emptied so that vExplore's own ask
   fires -- that screen already asks for a query it has no answer for, and a
   second ask here would be two places asking one question. */
function snsPickSaved(q){
  snsQ=String(q||'');
  snsMode='posts';
  snsHits=null;
  goTab('explore');
}
/* ---- newest, or what people answered ------------------------------------
   「最新／話題」 OWNER 2026-08-28.

   THE ORDER IS THE SERVER'S AND THIS FILE DOES NOT HOLD IT.
   「SNSは全部サーバー」, and the leader said it again on 2026-08-28 when this
   screen was sorting the answer itself: **a phone that sorts is a phone that
   reorders the fifty rows it happens to have, and fifty rows reordered are
   not the top fifty.** Whichever way somebody asks for them, the question
   "which posts" and the question "in what order" have one answer and it is
   made where all the posts are.

   So this screen has a MOUTH and no opinion. `snsSort` is what was asked
   for; www/net.js carries it to the server and the answer arrives in the
   order it arrives in, and gets drawn in that order.

   It used to score the posts here -- a like one, a repost three, an answer
   five. Those numbers are gone from this file on purpose and must not come
   back: they live in one place, beside the query that uses them, because two
   copies of a number in two languages is the thing that drifts. The badge's
   own multiplier is the same argument and this file has never held it.

   Changing it therefore ASKS AGAIN rather than re-arranging what is here --
   emptying `snsHits` is what makes vExplore put the question again, which is
   the one place that asks it. */
function snsSortNow(){ return (snsSort==='buzz')? 'buzz' : 'new'; }
function snsSortKey(k){ return (k==='buzz')? 'sort.buzz' : 'sort.new'; }
/* The mark in the corner of the search's bar, the same corner the timeline
   puts its filter in and for the same reason: what a list is sorted by is
   not something to work out from the list. */
function snsSortTop(){
  return '<button class="navq"' + DO('go', ['sort']) + '>'+
    esc(t(snsSortKey(snsSortNow())))+'</button>';
}
function vSort(){
  var ks=['new','buzz'];
  return '<div class="view">'+navTop('')+'<div class="body">'+
    ks.map(function(k){
      return '<button class="set"' + DO('snsSetSort', [k]) + '>'+
        '<span class="sl">'+esc(t(snsSortKey(k)))+'</span>'+
        '<span class="sv">'+(snsSortNow()===k? ICON_TICK : '')+'</span></button>';
    }).join('')+
    '</div></div>';
}
function snsSetSort(k){
  snsSort=(k==='buzz')? 'buzz' : 'new';
  /* The answer is in the old order, so it is not an answer to this question
     any more. Thrown away rather than re-sorted, and vExplore asks again. */
  snsHits=null;
  back();
}
function snsHitsHTML(){
  var r=snsHits, out='', i, ps;
  if(!snsQ.trim() || !r) return '';
  /* Could not ask, which is not the same as found nothing. */
  if(r.bad) return '<div class="note">'+esc(r.bad)+'</div>';
  /* And out of the search too, on both sides: a person you have blocked is
     not somebody you are looking for, and neither is what they wrote. */
  for(i=0;i<(r.who||[]).length;i++)
    if(!meBlocks(r.who[i].hd)) out+=snsWhoRow(r.who[i]);
  /* In the order it arrived. The order is the server's answer to `snsSort`,
     not something to be worked out again here. */
  ps=r.posts||[];
  for(i=0;i<ps.length;i++)
    if(!postBlocked(ps[i])) out+=postRow(ps[i]);
  return out || '<div class="note">'+esc(t('sns.nohit'))+'</div>';
}
function vExplore(){
  if(!netSignedIn()) return snsLocked('explore');
  /* And the screen the star is on, because whether it is filled is the same
     question the filter asks. */
  snsSavedPull();
  /* Asked once when the screen is built, so coming back to a query already
     typed shows its answer rather than an empty page. */
  if(snsQ.trim() && !snsHits) snsFind(snsQ, snsGot);
  return '<div class="view">'+rootTop('explore', snsSortTop())+
    '<div class="body">'+
    '<div class="search"><span class="lens">'+ICON_LENS+'</span>'+
      /* `enterkeyhint` is what makes the phone's own return key say Search,
         and pressing it is what asks for posts. 「ツイートの検索は検索ボタン
         押したら出てくる」 */
      /* THE SAME FIELD AS EVERYWHERE ELSE, and it was an <input>.
         「全部改行して画面内に文字が収まるようにして欲しい」 OWNER 2026-08-27,
         and 「全部なくせ」 when asked what was left. An <input> is one row that
         scrolls sideways forever; there is no CSS for it, so the element
         changes. lnField() is the one place that shape lives.

         Enter still searches rather than putting a newline in: the one
         keydown listener stops the key before it runs the name. */
      lnField('sns-q', t('sns.search'),
        ' enterkeyhint="search"' + IN('snsSetQ') + KD('snsGo'), snsQ)+
      /* Kept, or not. Two drawings rather than a class, because "saved" is a
         filled star and "not saved" is an outline of one, and that is the
         whole difference -- there is no CSS for it to need. It is only there
         when there is a word to keep. */
      (snsQ.trim()
        ? '<button class="sx"' + DO('snsSaveQ') + ' aria-label="'+
            esc(t('sns.save'))+'">'+(snsIsSaved(snsQ)? ICON_STAR_ON : ICON_STAR)+'</button>'
        : '')+
      '<button class="sx" id="sns-x"' + DO('snsClearQ') + (snsQ?'':' hidden')+
        ' aria-label="'+esc(t('words.clear'))+'">'+ICON_CROSS+'</button>'+
    '</div>'+
    '<div id="sns-hits">'+snsHitsHTML()+'</div>'+
    '</div></div>';
}
/* ---- who read you, who answered, who followed --------------------------
   「いいね、返信、リポスト、フォロー、おすすめのツイートとか？」

   Five kinds, and four of them are somebody doing something to a post of
   yours. The fifth -- a post worth reading -- is not somebody doing anything,
   it is a choice made somewhere with more than one person's timeline in front
   of it, and that is the server's.

   NOTIF_SEAM. Same shape as the search and for the same reason: a notice is
   something that ARRIVES. The screen draws what it has and takes an answer
   when one comes.

   A notice is {kind, at, hd, who, av, id} -- what happened, when, who did it
   in the same four fields everything else describes a person with, and which
   post it was about. */
var NOTES_HAVE=null, notPulling=false;
function notPull(){
  if(notPulling) return;
  notPulling=true;
  netNotices(function(ns){
    notPulling=false;
    if(!ns) return;
    NOTES_HAVE=ns;
    render();
  }, function(){ notPulling=false; });
}
function notRow(n){
  var k=String(n.kind||''), p=postById(n.id), ic=
    k==='like'? ICON_HEART : k==='boost'? ICON_BOOST :
    k==='reply'? ICON_REPLY : k==='follow'? ICON_ADD : ICON_LINE;
  return '<div class="ntf">'+
    '<span class="ntfi '+esc(k)+'">'+ic+'</span>'+
    '<span class="ntfb">'+
      '<span class="ntfw">'+esc(t('notif.'+(k||'other'), postWho(n)))+'</span>'+
      (p? '<span class="ntfp">'+esc(p.mn || p.ln || '')+'</span>' : '')+
    '</span>'+
    '<span class="pwhen">'+esc(postWhen(n.at))+'</span>'+
    '</div>';
}
function vNotif(){
  if(!netSignedIn()) return snsLocked('notif');
  notPull();
  var ns=(NOTES_HAVE||[]).filter(function(n){ return !meBlocks(n.hd); });
  return '<div class="view">'+rootTop('notif')+
    '<div class="body">'+
    (ns.length? ns.map(notRow).join('') : snsNone())+
    '</div></div>';
}
