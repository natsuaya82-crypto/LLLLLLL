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
/* ---- waiting is not empty ------------------------------------------------
   「snsで一瞬何も出ないとかあり得んやろ」 OWNER 2026-09-02.

   A timeline with no local copy drew 「まだ何も無い」 while the first answer
   was still out. That sentence is a STATEMENT ABOUT THE SERVER, made before
   the server had said anything -- the same fault as CLAUDE.md's first page,
   「空」 and 「読めていない」 sharing one branch, and here it is the first
   thing a new account ever sees.

   `SNS_GOT` is the difference: set when an answer arrives, empty or not. Until
   then this is what stands -- the app's own mark, turning, which is already
   what a pull shows (`pullSpinOn`) and is therefore not a second thing to
   learn. `.pullrule` is positioned against the bar it hangs from, so the one
   in the body is given a place of its own. */
var SNS_GOT={};
function snsWaitHTML(){
  return '<div class="empty snswait"><div class="pullrule go">'+ICON_PLUS+'</div></div>';
}
/* THE SAME MARK AT THE SIZE OF A WORD, for the places where what is waited
   for is one line inside a row rather than a screenful. `.numwait` in
   www/index.html is what draws it, and it was written for the counts under a
   profile; the day's sentence needs the same thing for the same reason, and a
   second copy of three tags is how the two would come to differ.

   IT IS A WORD AND NOT A SCREEN BECAUSE THE ROW MUST NOT MOVE. snsWaitHTML()
   carries 48px of padding, so a row wearing it stands three times its own
   height and then shrinks when the answer lands -- which is the timeline
   jumping under somebody's thumb, and is the same complaint arriving as
   layout instead of as text. */
function snsWaitWord(){
  return '<span class="numwait"><span class="pullrule go">'+ICON_PLUS+'</span></span>';
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
   timeline to hide it. THE SERVER IS HERE, so the answer to "the people I
   follow" is the one it sent -- `FO_HAVE` below -- and not a sieve run over
   everything this phone happens to be holding.

   The sieve is still written, and it is now the COPY: what the tab falls back
   to in the moment before the first answer arrives. Following is by HANDLE
   there, off the post, the way everything on the reading side is -- `p.hd` is
   who wrote it, frozen when it was written. Your own are in it either way,
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
/* WHICH POSTS THE FOLLOWED TIMELINE IS, BY ID -- the server's answer, kept.
   `null` until one has arrived, which is not the same as none.

   netFeed('fo') asks the server for posts by the people this account follows,
   and the server answers off the `follow` table. What came back was then put
   through meFollows() a second time -- and meFollows() reads ME.fo, which is
   written by meFollow() when somebody presses Follow ON THIS PHONE and is
   filled from the server by nothing at all.

   So the same account on a second phone follows the same people and has an
   empty ME.fo: every post the server correctly sent arrived and was thrown
   away by the sieve, and the tab read 0 with the answer to its own question
   already in its hands. The owner has an SE2 and a 17, which is exactly the
   two phones that makes it.

   A LIST THE SERVER SELECTED MUST NOT BE SELECTED AGAIN HERE. Filtering an
   answer with a weaker copy of the question can only take correct rows out.
   ME.fo stays as the copy -- it is what the Follow button reads, and it is
   what this falls back to before any answer has come -- but where the two
   disagree the server is the record. The same shape as the kept searches
   further down this file: 「SNSは全部サーバー」.

   Filling ME.fo from the server is the other half and is NOT here: it is a
   read in www/net.js and a write in www/me.js, and both belong to other
   sessions. Until it lands the Follow button on a second phone still says
   Follow for somebody already followed. That is one wrong word on a button;
   this was the whole timeline. */
var FO_HAVE=null;
/* Your own are in it, and that has not moved -- 「a timeline of people you
   follow that leaves you out is a timeline you cannot see yourself having
   spoken in」. The server does not send them: netFeed('fo') asks for
   `author=in.(the followed)` and you do not follow yourself. */
function snsMine(p){
  return !!p.mine || (FO_HAVE? !!FO_HAVE[p.id] : meFollows(p.hd));
}
/* AND A REPLY IS NOT ON おすすめ. 「リプライはおすすめ並ぶことないでしょ？
   基本」 OWNER 2026-09-04, looking at 4-home.png -- an answer to one of their
   own posts standing in the recommended list at the same size as the post it
   answers.

   It is the RECOMMENDED list and only that one. 「フォロー中」 is the people
   you chose to read and everything they wrote is theirs to say, a thread
   included; a person's own page keeps its 返信 tab; a search answers with
   whatever matches. What a reply loses is the one list nobody asked to be
   on.

   Asked of the post -- `to` is what makes it an answer, and it is on the post
   the moment it is written (pwSend, rule 13) -- rather than of the server, so
   it is the same sentence on a phone with no signal. */
function snsList(){
  var all=postAll();
  if(snsTab==='fo') return all.filter(snsMine);
  return all.filter(function(p){ return !p.to; });
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

   What is on the page is the two timelines and the words somebody kept.
   THE DAY'S TAG IS NOT ON IT, and that is the owner's own sentence rather
   than an omission: 「#今日のお題だし そこに出せなんて頼んでないけど、
   ツイートの中だけど タグは」 OWNER 2026-09-04. It was put here for one
   commit and taken out again. A tag lives in the post that carries it; the
   way to a day's answers is to search for it. Nothing here invents a topic
   of its own and there are still no free-typed tags. */
function snsFilNow(){ return (snsTab==='fo')? 'fo' : 'rec'; }
function snsFilKey(k){ return (k==='fo')? 'feed.fo' : 'feed.rec'; }
/* ---- and the third answer: a word somebody kept -------------------------
   「絞り込みで星つけたやつはなんで検索欄行くの？ホームからね。」OWNER
   2026-08-28. Choosing a starred word used to call goTab('explore') -- which
   moves the tab, throws NAV away, and puts somebody in front of a search
   field they never asked for. The recorded decision of the same day already
   said what it should do instead: 「絞り込みから選ぶとその言葉で検索し直す」,
   and 「飛ばすのではない」.

   So the filter has three answers and not two, and they are one question:
   which of these am I looking at. `snsTab` answers the first two; this
   answers the third, and they are exclusive -- choosing a timeline is how a
   word comes OFF, which is why there is no second button for that.

   `null` is no word. Otherwise `{q: <the word>, r: <the answer, or null>}`,
   and the three states of `r` are three and never share a branch:

     r === null   not answered yet     -- the mark turns, nothing is claimed
     r.bad        could not ask        -- the reason, netWhy()'s
     r.posts      an answer            -- the rows, or `sns.nohit` if none

   That middle line is the one that matters. A phone in a tunnel drawn as an
   empty list is the app saying "nobody has written that", which is
   `CLAUDE.md` § Data: 「empty」 and 「broken」 are different states.

   It is where you are STANDING and not something the language has, so it
   belongs in viewReset() beside snsTab, snsQ and snsHits. www/shell.js is
   another session's file today and the line is not in it yet -- the leader
   has it. Until then, switching languages leaves a word filter on. */
var snsFil=null, snsFilAsk=false;
/* THE ANSWER IS THE SERVER'S. Not postAll() narrowed by a word: this file
   already says why one screen down -- 「手元で並べ替えた50件は上位50件では
   ない」 -- and a phone filtering the fifty rows it happens to hold is the
   same sentence about a different verb. netFindPosts() is the one that asks.

   Asked once per word, and again only when somebody PULLS. `again` is what
   tells the two apart: vFeed() calls this on every render and must not ask
   twice for an answer it already has, and a pull is a person saying "ask it
   again" out loud. On a pull the old answer stays on the screen until the
   new one lands -- blanking it first would flash an empty timeline at
   somebody who asked for a fresh one.

   A late answer to a word that has since been taken off, or swapped for
   another, is thrown away by comparing the word -- snsGot() has done that
   since there was a search, and for the same reason. */
function snsFilFind(again){
  var q=snsFil? String(snsFil.q||'').trim() : '';
  if(!q || snsFilAsk) return;
  if(snsFil.r && !again) return;
  snsFilAsk=true;
  netFindPosts(q, function(ps){
    snsFilAsk=false;
    if(!snsFil || String(snsFil.q||'').trim()!==q) return;
    snsFil.r={q:q, posts:ps||[]};
    render();
  }, function(d, st){
    snsFilAsk=false;
    if(!snsFil || String(snsFil.q||'').trim()!==q) return;
    /* Could not ask, which is not nothing found. */
    snsFil.r={q:q, posts:[], bad:netWhy(d, st)};
    render();
  });
}
/* The mark in the corner of the timeline's bar. rootTop()'s second argument
   is what it is for -- www/home.js already puts the contents page's lens
   there -- so this is the same bar with the same corner and no new one. */
function snsFilTop(){
  /* The word itself when one is on. What this corner has always said is
     WHICH of the answers is being looked at, and the third answer is a word
     somebody kept -- so the word is what it says. Not a sentence about the
     word: a state is not an explanation, and CLAUDE.md § Explaining would
     refuse one. It is the person's own text and not an interface string, so
     it does not go through t() -- the same as a word in the dictionary or
     the body of a post. */
  return '<button class="navq navfil"' + DO('go', ['filter']) + '>'+
    esc(snsFil? snsFil.q : t(snsFilKey(snsFilNow())))+'</button>';
}
function vFilter(){
  var ks=['rec','fo'];
  /* NOTHING IS ASKED HERE. 「画面に入った瞬間にサーバーへ訊きに行くのは無し」
     OWNER 2026-09-05 -- the words this account keeps came down when the
     session began (§ WHAT AN OPEN ASKS FOR), and a pull on this screen asks
     again. Standing on it is not a question. */
  return '<div class="view">'+navTop('')+'<div class="body">'+
    ks.map(function(k){
      return '<button class="set"' + DO('snsSetFil', [k]) + '>'+
        '<span class="sl">'+esc(t(snsFilKey(k)))+'</span>'+
        /* Nothing ticked here while a word is on: the three rows are one
           answer, so a timeline and a word are never both marked. */
        '<span class="sv">'+((!snsFil && snsFilNow()===k)? ICON_TICK : '')+
        '</span></button>';
    }).join('')+
    /* And the words somebody keeps, under the two timelines because they are
       the same question asked a third way: what am I looking at. The heading
       is a NAME and not an explanation -- vWsys puts `dir.title` over its
       three directions in the same shape. Nothing at all when none are kept,
       rather than a heading over an empty space. */
    (snsSaved().length
      ? '<div class="sec">'+esc(t('sns.saved'))+'</div>'+
        snsSaved().map(function(q){
          /* The same mark the two timelines wear, for the same reason: this
             row is one of the three answers now. The chevron that used to be
             here said "a way there" and it was true -- this went to another
             tab. It goes nowhere now, so it is a tick or it is nothing. */
          return '<button class="set"' + DO('snsPickSaved', [q]) + '>'+
            '<span class="sl">'+esc(q)+'</span>'+
            '<span class="sv">'+((snsFil && snsFil.q===q)? ICON_TICK : '')+
            '</span></button>';
        }).join('')
      /* Nothing at all when none are kept -- and the mark, turning, before the
         answer that says whether any are. A phone that has never held this
         account's list drew the same empty space for 「keeps none」 and for
         「has not been told yet」, and the second is the one a new phone is in
         every time. netSignedIn() is the ask's own condition: no question, no
         mark. */
      : (netSignedIn() && !pullHad('saved'))? snsWaitHTML() : '')+
    '</div></div>';
}
/* Chosen, and then you are back on the thing it is about. The same shape as
   every other chooser that is a page of its own: the answer is the reason
   you came, so there is nothing left to do here. */
function snsSetFil(k){
  snsTab=(k==='fo')? 'fo' : 'rec';
  /* And this is how a word comes off. There is no second button for it and
     pressing the same word again does not do it either -- that shape was
     refused on the keyboard 「同じとこ触ると選択解除されるからわかりにくい」
     and it would be the same mistake here. */
  snsFil=null;
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

   A second ask while one is out is refused by pullRun() below, which holds
   that for every screen rather than each screen holding it for itself. */
/* WHAT A RENDER ASKS, AND WHAT A PERSON ASKS, ARE TWO DIFFERENT ACTS.

   This screen answered, wrote the answer down and rendered; the render asked
   again. So one answer built the screen, the screen asked again, and the
   timeline sat there putting the same question to the server for as long as
   anybody was looking at it -- measured at over twenty asks a second with no
   network in the way. Nothing threw and nothing looked wrong.

   It also duplicated a post. Every one of those answers ran postCatchUp(),
   and a post this phone has not got a `sid` back for yet is a post that has
   not been sent -- so the same post went up again, and again, while the first
   send was still in the air. A search for it afterwards found two.

   The guard is the fact this file already keeps: `SNS_GOT[tab]` is set when
   an answer arrives, empty or not, and the body already reads it to tell
   「waiting」 from 「nothing here」. A tab that has an answer does not ask
   again on a render; a tab that has none does. An ask that FAILED leaves it
   unset and renders nothing, so that road stays askable and still cannot
   loop.

   That is now pullNeed() against pullGo(), said once for every screen --
   see the table below. What this timeline holds is only WHICH answer counts
   as its own, which is per TAB and not per route: the followed timeline and
   the recommended one are two answers on one screen. */
function snsHas(){ return !!SNS_GOT[snsTab]; }
/* THE TIMELINE'S ASK. It writes the answer down and says whether one came;
   the mark, the pop, the 再接続 and the render are pullRun()'s and are not
   here. */
/* THE TWO TIMELINES ON ONE SCREEN, which is what makes this ask different
   from every other one in the table: the followed one and the recommended
   one are two answers, and a tab is not a route.

   THE OPEN ASKS FOR BOTH; A PULL ASKS FOR THE ONE YOU ARE LOOKING AT.
   「最初の起動の一回の更新で全部取得してその後それぞれをプルトゥーリフレッシュ
   とかで更新して取得する」「TLの更新ならTLだけでいい分けでしょ？」 OWNER
   2026-09-05.

   Both halves are the owner's sentence. If the open asked for only the tab
   that happens to be showing, switching to the other one would be a question
   put to the server at the moment somebody arrived at it -- which is the
   thing being taken out of this app today, wearing a tab instead of a screen.
   And a person pulling a timeline down is refreshing THAT timeline; asking
   for the other one as well would be a request nobody made. */
var SNS_TABS=['fo', 'rec'];
function askFeed(ok, bad, person){
  /* WHICH timelines to ask for. A tab that already has an answer is not asked
     again at the open -- that is SNS_GOT, the same record `snsHas` reads. */
  var want=[], i;
  if(person) want=[snsTab];
  else for(i=0;i<SNS_TABS.length;i++) if(!SNS_GOT[SNS_TABS[i]]) want.push(SNS_TABS[i]);
  if(!want.length){ ok(0); return; }
  askFeedRun(want, ok, bad, person);
}
/* AND ONE ANSWER FOR HOWEVER MANY WENT OUT. Two timelines arriving one at a
   time would draw the screen twice, and the second draw is a list moving
   under somebody's eye -- the same fault this whole day is about, arriving as
   two renders instead of one. So the render waits for the pair; a fall is
   handed on once, from whichever fell first. */
function askFeedRun(tabs, ok, bad, person){
  var left=tabs.length, drew=0, fell=false, i;
  /* And what the feed is showing while a word is on is the answer to that
     word, so that is asked again too -- ONLY when a person asked. It is said
     HERE and not inside snsFilFind()'s own guard, because vFeed() calls that
     on every render and a render is not a person asking; and it is behind
     `person` because vFeed() has already called it, unforced, on the render
     that reaches this, so forcing it there is the same word asked twice. The
     timeline underneath is asked for either way: it is still the list the
     word comes off onto. */
  if(person && here().r==='feed' && snsFil) snsFilFind(true);
  /* And what this phone has that the server has not. It goes off the back of
     a pull rather than on a timer: the moment somebody is asking for a
     timeline is the moment the network is known to be working. ONCE, however
     many tabs went out -- it was inside the ask and therefore ran per tab,
     and a post sent twice is what www/sns.js § pullRun was written about. */
  postCatchUp();
  function one(got){
    if(fell) return;
    if(got) drew=1;
    left--;
    if(!left) ok(drew);
  }
  function no(d, s, m){
    if(fell) return;
    fell=true;
    bad(d, s, m);
  }
  for(i=0;i<tabs.length;i++) askFeed1(tabs[i], one, no);
}
function askFeed1(which, ok, bad){
  netFeed(which, function(ps){
    var have, i;
    /* The followed timeline, as the server answered it. `null` is "could not
       ask" and is not an answer -- writing it down as one would empty the tab
       on every phone that went through a tunnel. An empty ARRAY is an answer
       and is written down: following nobody is a real 0 and has to be able to
       replace a list from before somebody unfollowed everyone. */
    if(which==='fo' && ps){
      have={};
      for(i=0;i<ps.length;i++) if(ps[i] && ps[i].id) have[ps[i].id]=1;
      FO_HAVE=have;
    }
    /* An ANSWER, empty or not -- which is a different fact from whether it
       had anything in it, and the one the body asks before it says 「まだ何も
       無い」. `null` is 「could not ask」 and is not an answer. */
    if(ps) SNS_GOT[which]=1;
    if(ps && ps.length) postTake(ps);
    /* Drawn again even when nothing came back, which it was not before: the
       answer itself is now something the screen shows -- an empty one is what
       turns the tab into snsNoneFo() rather than leaving the list from before
       it was asked. */
    ok(ps? 1 : 0);
  }, bad);
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

   AND SOMETHING TURNS IN THE GAP. 「引っ張って更新に、回るものを出す」 OWNER
   2026-08-28, said twice. The page moving says a gesture is happening; it
   does not say the app went and asked. So a mark sits in the gap the pull
   opens, turning with the finger on the way down and turning by itself while
   the answer is out.

   THIS FILE MAKES IT AND TURNS IT; IT DOES NOT DRAW IT. What it looks like is
   `.pullrule` in `www/index.html` -- an 18px line in `--goldln`, hung off the
   bottom of `.navtop`. **The name has to be the stylesheet's**, which is the
   whole of what went wrong the first time: this file invented `pullspin`,
   nothing drew it, and an empty div wearing a class no rule matches is zero
   pixels tall.

   It turns ONCE by the time it would fire. `PULL_GO` is the distance that
   asks, so a full turn is the mark saying "this far" -- the number is read
   off that rather than chosen, and moving one moves the other.

   Already asking is not asked twice. Two flags held that, one on the
   timeline and one on the notices, and every other screen had none; it is
   PULL_OUT below now, one entry per route, so a person flicking between tabs
   cannot put four asks in the air on any screen rather than on two.

   It does NOT fight the profile tab's hold in www/shell.js. That one arms on
   an element carrying `data-hold` and disarms once the thumb has moved more
   than HOLD_SLOP (10px), which is exactly right: a pull is not a hold. It
   disarmed on ANY touchmove until 2026-09-01, and that is why no long press
   ever completed on a real phone -- a finger never holds perfectly still. And preventDefault stops the browser
   bouncing the page, not the other listeners -- they are still called. */
var PULL_R=0.5, PULL_GO=64, PULL_MAX=96;
/* WHICH SCREENS ANSWER A PULL, AND WHAT EACH ONE ASKS FOR -- ONE TABLE.
   「ここ更新ないから見れないし」「他の人の画面でも更新できるようにしたい」
   OWNER 2026-09-04, looking at 3-thread.png.

   It was a map to `1` with the asking written out underneath as a row of
   conditions, which is two lists of routes that had to be kept agreeing --
   and they had already stopped: a thread and a person's page were on
   neither, so the one screen the owner was standing on could not be asked
   again at all.

   So a route is bound to the function that asks, exactly as `route-map.js`
   binds a route to the view that draws it and `act-map.js` binds a name to
   the function it runs. A screen added to the timeline is pulled the day it
   is added, and there is no second place to forget.

   `follows` is here too and is the same complaint one screen along: the two
   lists behind the counts are asked for ONCE a session (`mine`), so somebody
   who followed you while the app was open was in neither the number nor the
   list until it was killed and opened again. */
var PULL_ON={}, PULL_HAS={}, PULL_OUT={}, PULL_GOT={};
function pullOn(r, ask, hav){ PULL_ON[r]=ask; if(hav) PULL_HAS[r]=hav; }
/* ---- AND ONE ROAD THROUGH ALL OF THEM ------------------------------------
   「エラーになったらエラー用のポップ出して再更新とかおさせればいいやんそれ
   だけで1個作れば全部に使えるやん」OWNER 2026-09-05.

   There were four of these written out -- snsPull(), notPull(), pullThread()
   and pullWho() -- and they were the same eleven lines four times:

     a flag so a second ask is refused while one is out
     ask
     take the mark out, whichever way it went
     write the answer down and render, or return on null
     on a failure, take the mark out and put the pop up, naming ITSELF as
       the thing 再接続 runs

   Four copies of a rule is four places for it to differ, and they already
   had: the notices screen called its own pull from vNotif() with no 「have I
   an answer」 guard at all, so the answer landed, rendered, and asked again,
   for as long as anybody stood on it. The timeline had that guard, in
   SNS_GOT. Nobody could see the difference by reading either one.

   So the table holds ONLY WHAT A SCREEN ASKS FOR. `ask(ok, bad)` puts the
   question and writes the answer down; `ok(1)` means an answer came and the
   screen should be drawn again, `ok(0)` means nothing to draw. Everything
   else -- the flag, the mark, the pop, the retry, the render -- is below,
   once.

   `hav()` is the second column and is what tells a RENDER from a PERSON. A
   render asks through pullNeed() and is refused the moment this screen has
   its answer; a person asks through pullGo() and is never refused. Where a
   screen names no `hav`, PULL_GOT holds it: once per route per session, which
   cannot loop.

   AND `person` REACHES THE ASK, as a third argument, because one screen has
   something it does only when somebody asked: the timeline re-asks the word
   that is on it. On a render that would be a second request beside the one
   vFeed() already makes for the same word. */
function pullGo(r){ pullRun(r, true); }
function pullNeed(r){ pullRun(r, false); }
/* AND WHETHER THE ANSWER IS IN, WHICH IS THE THING A SCREEN DRAWS.
   「サーバーに聞く前にロード挟んで絶対に遅れて表示させることないように」
   OWNER 2026-09-04, and 「アイコンも1秒遅れ表示、お題も1秒遅れ表示」 the day
   after, about the same fault in five more places.

   The table already knows this -- it is the same column pullRun() reads to
   refuse a render's ask -- and every screen that wanted it had been keeping
   a flag of its own beside it. So it is asked here, of the table, and the
   three faces of 2026-09-04 fall out of one question: no answer yet is the
   mark, an answer that is empty is 0, and a screen with nothing on the
   server to ask for never comes here at all. */
function pullHad(r){
  var h=PULL_HAS[r];
  return h? !!h() : !!PULL_GOT[r];
}
/* AND EVERY ANSWER IS FORGOTTEN WHEN THE SESSION IS. netOut() (www/net.js)
   is the one place a session ends, and what these answers are is 「what the
   server told THIS account」 -- the drafts, the follows, the kept words. Left
   standing, the next person to sign in on this phone would be shown the last
   one's, and shown it as an ANSWER, so nothing would ever ask again.

   `drafts` kept this for itself, keyed on the uid (DRAFTS_FOR), and was the
   only one of the eight that did. */
function pullForget(){
  PULL_GOT={};
  DAY=null; DAY_GOT=false;
}
/* And ONE answer forgotten, for the one thing that can go stale without the
   session ending: switching the language you read the app in re-asks the
   notices, because what a notice SAYS is written in that language. Clearing
   what was answered without clearing that it was answered would leave the
   screen on the mark for ever -- pullNeed() is refused by PULL_GOT, and
   nothing else would ever set it back. www/shell.js § langWipe. */
function pullDrop(r){ PULL_GOT[r]=0; }
function pullRun(r, person){
  var ask=PULL_ON[r], hav=PULL_HAS[r];
  /* Signed out there is nothing to ask for: the three screens are the door. */
  if(!ask || !netSignedIn()){ pullSpinOff(); return; }
  /* Already asking. The mark stays turning -- the ask that is in the air is
     the one that will take it out. */
  if(PULL_OUT[r]) return;
  if(!person && (hav? hav() : PULL_GOT[r])) return;
  PULL_OUT[r]=1;
  ask(function(got){
    PULL_OUT[r]=0;
    /* The mark stops turning when the asking is over, whatever came back. A
       render takes it out by itself; the road where nothing came back does
       not render, and that is the one this line is for. */
    pullSpinOff();
    if(!got) return;
    PULL_GOT[r]=1;
    render();
  }, function(d, s, m){
    PULL_OUT[r]=0;
    pullSpinOff();
    /* 通信が落ちたら何も進まない ── netPop() (www/net.js)。［再接続］が
       走らせるのはこの画面の同じ問いで、それは人が押したのと同じ道です。 */
    netPop(d, s, m, function(){ pullRun(r, true); });
  }, person);
}
/* ---- WHAT EACH SCREEN ASKS FOR ------------------------------------------
   「ここ更新ないから見れないし」「他の人の画面でも更新できるようにしたい」
   OWNER 2026-09-04, looking at 3-thread.png.

   It was a map to `1` with the asking written out underneath as a row of
   conditions, which is two lists of routes that had to be kept agreeing --
   and they had already stopped: a thread and a person's page were on
   neither, so the one screen the owner was standing on could not be asked
   again at all.

   So a route is bound to what it asks, exactly as `route-map.js` binds a
   route to the view that draws it and `act-map.js` binds a name to the
   function it runs.

   `follows` is here too and is the same complaint one screen along: the two
   lists behind the counts are asked for ONCE a session (`mine`), so somebody
   who followed you while the app was open was in neither the number nor the
   list until it was killed and opened again. */
pullOn('feed',    askFeed,    snsHas);
pullOn('explore', askFeed,    snsHas);
pullOn('notif',   askNot);
pullOn('thread',  askThread);
pullOn('profile', askWho);
pullOn('follows', askFollows);
pullOn('drafts',  askDrafts);
/* ---- AND THE FIVE THINGS THAT ARE NOT A SCREEN ---------------------------
   「全部だけど、アイコンも1秒遅れ表示、お題も1秒遅れ表示」 OWNER 2026-09-05.

   A key in this table was a ROUTE, and every one of these was therefore
   outside it: each kept a flag of its own for 「asking」, a second for
   「answered」, and its own road to netPop() or -- three times out of five --
   no road at all. That is the four-copies fault of § AND ONE ROAD THROUGH ALL
   OF THEM arriving from the other side: not four screens asking the same way
   four times, but five things asked five ways because none of them was a
   screen.

   A key is the NAME OF SOMETHING THE APP NEEDS. A route is one kind of name
   and these are another, and nothing in pullRun() ever cared which -- the
   flag, the mark, the pop, the retry and the render are the same for both.
   Being on this table is what puts them on PULL_OPEN above, which is what
   makes them arrive before anybody is looking. */
pullOn('day',     askDay,     dayGot);
pullOn('mine',    askMine);
pullOn('blocks',  askBlocks,  netBlockedGot);
pullOn('saved',   askSaved);
pullOn('recent',  askRecent);
/* ---- AND WHAT AN OPEN ASKS FOR -------------------------------------------
   「そもそもそれだけ送れるの意味わからないアプリ開くタイミングで通信入るなら
   全部一気に入るやろ」「全部だけど、アイコンも1秒遅れ表示、お題も1秒遅れ表示」
   OWNER 2026-09-05.

   Every one of the asks above was fired by the SCREEN that shows it, from
   inside the function that draws it -- so the app opened, asked for four
   things, and then asked for a fifth the moment somebody walked onto the
   screen that needed it. Measured on a launch: the day's sentence, the
   timeline, the block list, the kept words, the history and the drafts each
   went out when their screen was first drawn and not before. That is the
   whole of 「1秒遅れ」: the screen is already up when the question is put.

   So the open asks for all of it, in one moment, and there is one list of
   what 「all of it」 is. It is the same table and the same road, so an answer
   that arrives before anybody walks onto the screen simply means the screen
   finds it there, and an answer that has not arrived is a mark rather than a
   stand-in.

   AND NO SCREEN ASKS ON THE WAY IN. 「画面に入った瞬間にサーバーへ訊きに行く
   のは無し。それが 1 秒遅れの正体です」 OWNER 2026-09-05. After this list,
   the only thing that asks again is somebody pulling a screen down, and that
   asks for THAT screen -- 「TLの更新ならTLだけでいい分けでしょ？」. There is
   no pullNeed() left in any view.

   The splash is up for 900ms (www/index.html), which is the only reason this
   is not merely faster: a question put at the open is answered UNDER it, and
   nothing on the far side of it changes under anybody's eye.

   WHAT IS NOT ON THIS LIST, and why it is not a hole. A thread and somebody
   else's page are ABOUT one post or one person, and which one is not known
   until the door is opened -- there is nothing to ask for at a launch. They
   are in the table (`thread`, `profile`, `follows`) so a pull refreshes them,
   and what fills them the first time is whoPull() and folPull() in www/me.js,
   asked once per handle. That is not the fault being fixed here: nobody was
   looking at that person's page a second before they pressed their name. */
var PULL_OPEN=['feed', 'notif', 'day', 'mine', 'blocks', 'saved', 'recent', 'drafts'];
/* Fired by netTook() (www/net.js), which is the one place that knows a
   session ARRIVED -- a launch through netResume(), or somebody signing in an
   hour later through the door. Every one of these is asked AS somebody, so
   there is nowhere earlier it could go: a question put before the session is
   in hand is a question pullRun() refuses on its own netSignedIn().

   Not waited for -- the app opens on what is on the phone, exactly as the two
   language roads beside it do. What covers the gap is the splash, which is up
   for 900ms (www/index.html), and the mark on any screen whose answer is
   still out. */
function pullBoot(){
  var i;
  for(i=0;i<PULL_OPEN.length;i++) pullNeed(PULL_OPEN[i]);
}
/* ---- AND EVERY OTHER SCREEN, WITHOUT NAMING ONE OF THEM -------------------
   「全部の画面でプルトゥーリフレッシュ入れないと動かないとこ出てくるぜ」
   「設定はいらんよ？」 OWNER 2026-09-05.

   The six routes above are the ones with a list of their own on the server.
   The other thirty are the language being made -- letters, the keyboard, the
   words, the grammar, the notes, the world -- and every one of them shows
   something that exists twice: on this phone, where it is written, and on the
   server, where it is kept. A phone that went through a tunnel is holding the
   older of the two and has no way to say so.

   They are not listed. The list is PAGES (www/shell.js), which is what a
   route IS, so a screen added tomorrow is pulled tomorrow and there is no
   second place to forget -- which is exactly how the six above came to be
   four with two missing.

   THE SETTINGS ARE OUT, and they are the only ones. 「設定はいらんよ？」 --
   nothing on them comes off the server, and `set` is the page each one opens
   onto. */
/* AND THE REPORTS, which are a list on the server exactly as the six above
   are. It is registered here rather than left to pullEvery() below because
   that binds askLang, and the reports are not the language. mod.js loads
   after this file, so the name is reached when the pull runs and not now. */
pullOn('mod', function(ok, bad){ modAsk(ok, bad); });
/* AND THE KEYBOARD. A board is built on that screen and nothing about it
   comes off the server while it is open -- so the pull is a spinner that
   asks nobody anything, over a sheet a finger is already dragging keys
   around on. 「キーボード編集画面はくるくる無し」 OWNER 2026-09-05. */
var PULL_NOT={ settings:1, set:1, kb:1 };
function pullEvery(){
  var r;
  for(r in PAGES){
    if(!Object.prototype.hasOwnProperty.call(PAGES, r)) continue;
    if(PULL_ON[r] || PULL_NOT[r]) continue;
    pullOn(r, askLang);
  }
}
pullEvery();
var pullY=-1, pullEl=null, pullAt=0;
/* The mark that turns in the gap.

   IT WAS BUILT UNDER A NAME NOTHING DRAWS, AND THAT IS WHY IT NEVER SHOWED
   ON THE PHONE. The two halves landed in two commits on 2026-08-28 -- the
   stylesheet in 6d29719, this file in e27c758 -- and they never agreed on
   three things:

     what it is called   this file made `pullspin`; index.html draws
                         `.pullrule`
     what turning is     this file put `on` on it; the animation is on
                         `.pullrule.go`
     where it goes       this file put it in `.view` before `.body`;
                         `.pullrule` is `position:absolute; top:100%` and
                         that is measured from `.navtop`, which is the only
                         positioned thing over the gap (`position:sticky`)

   Any one of the three is an invisible mark and not one of them throws: an
   empty `div` wearing a class no rule matches is zero pixels tall, so the
   pull worked, the timeline was asked again, every check was green and the
   owner saw nothing turn. 「引っ張っても更新のグルグル出ない」 OWNER, build
   #106. The stylesheet is what the owner approved, so the names here are
   moved to it rather than the other way.

   It goes INSIDE `.navtop` -- 6d29719 said so in its own message -- and not
   beside `.body`: `.body` is the thing sliding down under the finger, so a
   mark carried on it would sit still relative to the gap it is supposed to
   be in. The bar does not move, and the gap opens underneath it.

   `go` is the second half: while a finger is on it, this file turns it; once
   let go and asking, the class goes on and the stylesheet turns it, because
   an animation that runs on its own is CSS's and a rotation that answers a
   thumb is not. */
var PULL_SPIN=null;
function pullSpinOn(){
  var body, at;
  if(PULL_SPIN && document.contains(PULL_SPIN)) return PULL_SPIN;
  /* WHERE THE GAP OPENS, which is the top of `.body` and NOT the bottom of
     the bar. Those were the same thing on the three screens the pull started
     on, and they are not the same thing on the rest: the lexicon carries a
     search field and a sort row between the two, standing still because they
     are not `.body`, and a mark hung off the bar was drawn straight over the
     search field. Measured: bar bottom 60, body top 165.

     So it hangs off a point in the flow instead -- `.pullat`, a box of no
     height inserted immediately before `.body`, which is by definition the
     top of the thing that slides, on every screen and with nothing to keep
     agreeing. The mark is `position:absolute` inside it and takes no room, so
     nothing under it moves. */
  body=document.querySelector('#app .view > .body');
  if(!body || !body.parentNode) return null;
  at=document.createElement('div');
  at.className='pullat';
  PULL_SPIN=document.createElement('div');
  PULL_SPIN.className='pullrule';
  /* THE APP'S OWN MARK, turning. 「プルトゥーリフレッシュあるやん？lingua の
     マークのダイヤを使って欲しいな回転でもいいけど。せっかくマークあるし」
     OWNER 2026-09-01. It was an 18px LINE, which is a thing that turns and is
     not anything -- and the four-pointed star is already what this app is:
     the badge beside a name, the avatar on the cover, the + on the timeline.
     ICON_PLUS and not a fifth drawing of it, and no colour written here --
     `currentColor` takes what `.pullrule` says, the way every other mark in
     this app does. */
  PULL_SPIN.innerHTML=ICON_PLUS;
  at.appendChild(PULL_SPIN);
  body.parentNode.insertBefore(at, body);
  return PULL_SPIN;
}
/* Taken out when the answer lands, when the pull is let go short, and when
   the asking failed. A render takes it out on its own -- it rebuilds `#app`
   -- but the road where nothing came back does not render, and a mark left
   turning over a timeline nobody is waiting for is worse than none. */
function pullSpinOff(){
  /* The point it hangs off goes with it: an empty `.pullat` left in the flow
     is a second one on the next pull. */
  var at=PULL_SPIN && PULL_SPIN.parentNode;
  if(at && at.parentNode) at.parentNode.removeChild(at);
  PULL_SPIN=null;
}
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
  /* One full turn by the distance that asks. Only `transform` is set from
     here: what the mark IS -- its size, its line, its place in the gap -- is
     the stylesheet's, and a shape set from JavaScript would be in no
     stylesheet for anything to hold. */
  var sp=pullSpinOn();
  if(sp) sp.style.transform='rotate('+(360*pullAt/PULL_GO)+'deg)';
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
  /* Let go short: the gap closes and the mark goes with it. */
  if(!ask){ pullSpinOff(); return; }
  /* Let go far enough: it stops answering the finger and starts turning on
     its own, which is the stylesheet's animation and this file's class. */
  /* The inline transform goes with it: it is what answered the thumb, and
     the animation on `.pullrule.go` sets transform too -- an inline one wins
     over a stylesheet's keyframes and the mark would sit still. */
  if(PULL_SPIN){ PULL_SPIN.className='pullrule go'; PULL_SPIN.style.transform=''; }
  if(!r){ pullSpinOff(); return; }
  /* And what this screen asks is the screen's own, off the table above. */
  pullGo(r);
}
/* A THREAD, and it asks about every post drawn on it rather than the one at
   the top. The page shows a post and everything under it, so one level would
   be a refresh of part of what is on the screen.

   BY THE NAME THE SERVER KNOWS EACH BY -- `sid`, or the id itself for
   anything that arrived wearing it (www/post.js § postIs). A post written
   here and not yet sent has no name there and is left out: asking with a
   local uuid is a request that can only come back empty.

   The post itself is asked for too where this phone does not have it, which
   is a thread opened from a notice: vThread() draws 「ありません」 while the
   answer is out, and this is the road that ends it. */
function askThread(ok, bad){
  var id=postFocus(), p=postById(id), ids=[], down, i, q;
  if(!id){ ok(0); return; }
  if(!p) netPostById(id, function(got){
    if(!got) return;
    postTake([got]);
    render();
  }, function(){});
  ids.push((p && p.sid) || id);
  down=postDown(id, 0, [], [id]);
  for(i=0;i<down.length;i++){
    q=down[i].p;
    if(q.sid) ids.push(q.sid);
  }
  netReplies(ids, function(ps){
    if(!ps){ ok(0); return; }
    postTake(ps);
    ok(1);
  }, bad);
}
/* A PERSON'S PAGE: what they have written, who they are, and the two counts.
   All three were asked once and never again -- whoPull() keeps WHO_ASKED per
   handle, the two follow pulls keep one flag each for the session, and their
   posts were only ever whatever the timeline had swept up.

   Your own page and somebody else's ask the same three things of different
   places, and www/me.js is where that is decided; this says only that a pull
   is somebody asking again. */
function askWho(ok, bad){
  var h=pfWho() || meHandle();
  meAgain(h);
  netPostsBy(h, function(ps){
    if(!ps){ ok(0); return; }
    postTake(ps);
    ok(1);
  }, bad);
}
/* And the list behind one of those counts, which is the same ask without the
   posts. 「フォロワーとかタップしても見れないし」 was the door; this is the
   door opening on something that has moved since.

   `ok(0)`: meAgain() and folAgain() each go to www/me.js and each draw when
   their own answer lands, so there is nothing left here to draw. */
function askFollows(ok, bad){
  meAgain(folWho());
  folAgain(folErs(), folWho());
  ok(0);
}
/* THE NOTICES. The copy on the handset is replaced by whatever came back --
   `notices()` is computed on the server every time it is asked, so nothing
   here can ever be the only surviving copy of anything. */
function askNot(ok, bad){
  netNotices(function(ns){
    if(!ns){ ok(0); return; }
    NOTES_HAVE=ns;
    ok(1);
  }, bad);
}
/* WHAT IS BEING WRITTEN, WHICH IS EVERY OTHER SCREEN.
   「保存としたらオンラインおしまい」「オンラインは一本化ね？」 -- so a pull on
   a screen of the language is not a fifth kind of request, it is the two
   copies being put together, now, instead of at the next launch:

     netLangsDown   every language this account has, and any slice this phone
                    is missing. This is the half that FAILS on a bad network
                    and is therefore the half the pop is about.
     netLangSync    the open language both ways -- what is here that the
                    server has not got, and what the server has that this
                    phone has not.

   The second is fired and not waited on, exactly as every other caller of it
   does: by the time it runs the wire has already answered once, so it is not
   what the person is standing in front of. */
function askLang(ok, bad){
  netLangsDown(function(){
    netLangSync(function(){});
    ok(1);
  }, bad);
}
/* THE DRAFTS, which are on this phone and on the server both, and are the one
   list on the sns side that is not a timeline. */
/* `ok(1)` WHATEVER CAME BACK, and draftsPull()'s own answer is thrown away
   here on purpose. It says 「did anything NEW arrive」, which was the right
   question while the screen drew the phone's copy and this only added to it;
   it is the wrong one now that the screen draws a MARK until the server has
   answered (www/post.js § vDrafts). An answer with nothing in it is what
   turns that mark into 「No drafts」, so it is as much a render as one
   carrying a draft -- and it is what writes the answer down, without which
   this would be asked again on every render of the screen. */
function askDrafts(ok, bad){
  draftsPull(function(){ ok(1); }, bad);
}
/* WHOEVER YOU HAVE BLOCKED. It is not a screen and nothing draws it: it is
   what a timeline is filtered by, and it was asked for again in front of
   every page of every timeline (www/net.js § netBlocked). Once, at the open,
   and the timeline is one question again. `ok(0)`: no screen changes when
   this lands. */
/* YOUR OWN TWO FOLLOW LISTS, which are ME's and are asked for by www/me.js
   § meFollowsPull -- the same shape as askDrafts() above, and for the same
   two reasons: the asking belongs in the file the thing belongs to, and that
   file is loaded after this one. */
function askMine(ok, bad){
  meFollowsPull(ok, bad);
}
function askBlocks(ok, bad){
  netBlockedRead(function(){ ok(0); }, bad);
}
/* `mine` NAMES NO hav() ON PURPOSE, and that is the whole of what was wrong
   with the counts. PULL_GOT is 「answered THIS SESSION」; ME.fo is 「this
   phone has a list」, and a phone that has been opened before always has one.
   Answering the second question drew last week's number and then moved it,
   which is 「1秒後に1とか数字が変わる」 exactly. */
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

   AND ON THE FOLLOWED TAB, THE NEW IDS GO INTO `FO_HAVE` -- added to it, not
   written over it, because a second page is the rest of one answer and not a
   new one. That tab draws what the server selected; a page whose posts were
   taken in without being added to the set would arrive on the phone and not
   on the screen, which is the bug FO_HAVE exists to close, one page down.

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
function vFeed(){
  if(!netSignedIn()) return snsLocked('feed');
  /* Who this account follows, once a session. The followed timeline falls
     back to it before the server's own answer lands, and every Follow button
     on every screen reads it. Same shape as the three below: it returns
     immediately once it has an answer. */
  /* NOTHING IS ASKED HERE, AND THAT IS THE WHOLE OF TODAY'S FIX.
     「画面に入った瞬間にサーバーへ訊きに行くのは無し。それが 1 秒遅れの正体
     です」 OWNER 2026-09-05.

     Four asks stood on these lines -- your follows, the timeline, the day's
     sentence, the block list -- and every one of them went out with the
     screen already on the glass. All four come down when the session begins
     (§ WHAT AN OPEN ASKS FOR); what refreshes this screen afterwards is
     somebody pulling it, and that asks for the timeline and nothing else. */
  /* And the word, if one is on. Once per word: it returns immediately once
     it has an answer, or this would ask, write the answer down, render, and
     ask again. Same shape as the two above it. */
  snsFilFind();
  var list=snsList();
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
    (postMay()? dayRow() : '')+
    /* Frozen, said here and nowhere else. Not a notice -- 「通知はいらんて
       ホーム画面にバンでいいやん」 -- and not a coloured strip over a
       timeline that goes on scrolling underneath it: it takes the timeline's
       place, which is what every app that does this does and is the only
       shape that cannot be scrolled past.

       The three tabs stay open and the making side goes on working
       「3タブを閉じる必要もないし。ホームに出ればいいやん」. Every door being
       frozen shuts is shut by is_member() in supabase/schema.sql whether or
       not anything on screen says so; this is the saying so. */
    (!postMay()
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
      /* A word chosen from the filter. The same rows the search draws,
         because it is the same answer to the same question -- and the three
         states of it are three: the mark turning while it is still in the air
         (no claim is made), the reason when it could not be asked, and
         `sns.nohit` only when an answer really came back empty. */
      : snsFil
      ? snsAnsHTML(snsFil.q, snsFil.r)
      : list.length
      ? list.map(postRow).join('')
      /* Two different emptinesses. Nothing at all is a timeline that has not
         started; nothing HERE, with posts on the other tab, is a person who
         has not followed anybody yet, and telling them "nothing has been
         written" would be the app being wrong about its own contents. */
      : SNS_GOT[snsTab]
      ? (snsTab==='fo'? snsNoneFo() : snsNone())
      /* Nothing has come back yet, so nothing is said about what is there. */
      : snsWaitHTML())+
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
/* ---- the day's sentence, asked at the open --------------------------------
   「お題も1秒遅れ表示」 OWNER 2026-09-05.

   IT WAS ASKED BY THE FEED BEING DRAWN, and that is the whole of why it came
   late: the feed is drawn when somebody arrives at it, so the question went
   out with the screen already on the glass and the answer landed a second
   into looking at it. The row was the plain composer for that second and then
   became the sentence -- which is 「先に空で描いて、あとから差し替える」 said
   in one row.

   So it is one entry in the pull table now (§ WHAT EACH SCREEN ASKS FOR) and
   one name on PULL_OPEN, which means it is asked when the app opens, under
   the splash, and the feed finds the answer already here.

   THE BACK-OFF IS GONE AND NOTHING REPLACES IT. It was a second, then two,
   then four, to half a minute -- a private retry, on a private timer, for one
   sentence, written before there was one road for a request that fell.
   There is one now: a failed ask reaches netPop() through pullRun() like
   every other, and ［再接続］ asks this again with everything else that fell.
   「エラーになったらエラー用のポップ出して再更新とかおさせればいいやんそれ
   だけで1個作れば全部に使えるやん」

   `DAY_GOT` is 「the server has answered」 and `DAY` is 「and there is a
   sentence today」 -- two facts and not one, because a day the writer missed
   is an answer and the row has to be able to tell it from a question still in
   the air. That is the 2026-09-04 rule with nothing added: the mark, the
   sentence, or the plain row. */
var DAY=null, DAY_GOT=false;
function askDay(ok, bad){
  netDay(function(p){
    DAY_GOT=true;
    if(p) DAY=p;
    /* Drawn either way. An answer with no sentence in it is what turns the
       mark into the plain composer row, so it is as much a render as one
       carrying today's words. */
    ok(1);
  }, bad);
}
function dayGot(){ return DAY_GOT; }
/* In the person's own language. A Japanese speaker reading an English prompt
   is doing two translations and only the second one is the game -- owner,
   2026-08-23. */
function daySay(){
  var m=(DAY && DAY.says) || {};
  return String(m[uiLang()] || (DAY && DAY.text) || '');
}
/* THE SAME SENTENCE, FOR SOMEBODY ELSE'S POST. 「今日のお題だけ、毎回その人の
   表示言語になるようにできないの？…今日のお題だけは全員見れるようにしたい」
   OWNER 2026-09-01.

   An answer to the day's sentence carries the PROMPT'S ID (`post.pr`, a
   column with a key behind it) and the words as the writer's app said them.
   The words are frozen, correctly -- everything on a post is. But this one
   sentence is not the person's own writing: it is the app's, and the server
   holds it in all ten languages, so a Japanese reader was reading a Japanese
   writer's Japanese and an English reader was reading the same Japanese.

   Only TODAY'S, because today's is the one this phone has: `DAY` is one row.
   Anything older falls back to what the post carries, which is what it always
   showed. Nothing is stored differently and nothing is thrown away. */
/* Every prompt this phone has been handed, by id. One row a day, the same
   for everybody, so it is ASKED FOR rather than copied onto every post that
   answers it -- 「今日のお題は全員共通なんだからそんな難しいこと考えないで
   いいじゃん。日付っていうデータもあるし」 OWNER 2026-09-01.

   Today's is already here (`DAY`); anything older is one row and is fetched
   once, the first time a post names it. `PROMPT_ASK` is what stops a
   timeline of twenty answers to one day asking twenty times, and what stops
   a prompt that is not there being asked for on every render. */
var PROMPTS={}, PROMPT_ASK={};
function dayMap(id){
  var k=String(id||'');
  if(!k) return null;
  if(DAY && String(DAY.id)===k) return DAY.says || null;
  if(PROMPTS[k]) return PROMPTS[k];
  if(!PROMPT_ASK[k]){
    PROMPT_ASK[k]=1;
    netPrompt(k, function(p){
      if(p && p.says){ PROMPTS[k]=p.says; render(); }
    });
  }
  return null;
}
/* ---- THE TAG ------------------------------------------------------------
   「投稿する時にタグを入れられるようにしろよ」「本文に#つけられるようにしろよ」
   「タグは本文中に。」「翻訳はいらんから」 OWNER 2026-09-04.

   A TAG IS CHARACTERS SOMEBODY TYPED, and that is the whole of it. It was a
   ROW drawn beside the post out of `t('day.tag')` -- ten words in ten
   language files, put on by the app, sitting outside what anybody wrote and
   impossible to type. The owner has replaced it: the `#` goes in the body,
   a person puts it there, and there is one spelling of it.

   ONE SPELLING AND NO TRANSLATION. 「翻訳はいらんから」. A tag that is said
   ten ways is ten tags, and the search that finds them is a text search --
   so the ten would never meet. `DAY_TAG` is the day's, in the one form it
   has, and it is not a word in any language file because it is not
   interface: it is put into a field somebody can then edit.

   The LINK is still the column. `post.pr` gathers the day's answers and
   cannot be edited away 「繋がりはハッシュタグではなく列」 (OWNER DECISION
   2026-08-23 #6, still in force). The tag is the same fact written where a
   person can see it, delete it, and press it -- which is what 「投稿の本文に
   タグの文字が入る」 in the decision of 2026-09-04 already said. */
var DAY_TAG='#今日のお題';
/* What a tag looks like: the mark, then anything that is not a space and not
   another mark. Both spellings of the hash, for the reason netAtOff() takes
   both of the `@` -- 「＃」 is what a Japanese keyboard gives -- and the marks
   a sentence ends with are not part of the word.

   It is a `var` and it is global, so `lastIndex` survives between calls and
   every walk resets it. A regexp with `g` that is not reset starts from
   wherever the last one stopped, which reads as a tag that is blue on one
   post and not on the next. */
var TAG_RE=/[#＃][^\s#＃、。,.!?！？]+/g;
/* A piece of a post, with its tags picked out. 「タグは青く光るからタップ
   したらタグの検索になる。」 OWNER 2026-09-04.

   ONE PLACE, and it is asked by everything that draws words somebody wrote:
   the line, what it means, and the composer's own preview of what is being
   answered. A tag blue on one of those and plain on another is the same
   character meaning two things on one screen.

   Everything that is not a tag goes through esc() exactly as it did before
   -- this returns HTML and the text inside it is somebody's. */
function tagHTML(s){
  var x=String(s||''), out='', at=0, m;
  TAG_RE.lastIndex=0;
  while((m=TAG_RE.exec(x))){
    out+=esc(x.slice(at, m.index));
    out+='<button class="ptag"'+DO('snsTagGo', [m[0]])+'>'+esc(m[0])+'</button>';
    at=m.index+m[0].length;
  }
  return out+esc(x.slice(at));
}
/* And pressing one searches for it. 「タップしたらタグの検索になる」

   It is the ordinary search with the tag in the box -- not a road of its own
   -- so what comes back is what would come back if somebody had typed those
   characters: every post carrying them, on every day, and nothing about
   today. The box shows what was asked, which is what lets somebody change it.

   snsGo() is what a person pressing the search does, and this is a person
   searching. */
function snsTagGo(q){
  snsQ=String(q||'');
  snsHits=null;
  snsFil=null;
  goTab('explore');
  snsGo();
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
  /* THE MARK, AND NOT THE ROW IT MIGHT TURN OUT TO BE.
     「先に空で描いて、あとから差し替えるのを無くす」 OWNER 2026-09-05.

     Three faces and not two, which is the 2026-09-04 rule arriving at the one
     row that had never obeyed it: the sentence, the plain composer for a day
     that has none, and -- here -- the mark, for the second before the server
     has said which of the two this is. It drew the plain composer through
     that second and then swapped, and the swap is the whole complaint.

     THE ROW STAYS A ROW. Only the words are unknown: a person can always
     press it and write, because a row that cannot be pressed while the app
     finds something out is the app taking the way to post away for a second.
     The mark sits where the sentence goes. */
  if(!say && !dayGot() && netSignedIn()){
    return '<button class="wrow"' + DO('openPost') + '>'+
      '<span class="pav">'+
        postFace({who:meName(), lname:langName, av:postAvatar()})+'</span>'+
      '<span class="wrt">'+snsWaitWord()+'</span>'+
    '</button>';
  }
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
  if(!postMay()) return '';
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
  var id=String(here().a||''), p=postById(id), ups, vis, out='', i, d;
  /* Blocked is gone, not merely absent from the list: a thread reached by an
     old route is the one way a post could still be looked at. */
  if(!p || postBlocked(p)) return viewGone();
  /* WHAT IS ACTUALLY DRAWN, in the order somebody sees it. Both walks answer
     with the rows that are THERE -- postShown() in www/post.js is the one
     place that says so, and it sees blocked and taken down alike. This screen
     used to sieve the two lists itself, and it asked only about taken down,
     so somebody you had blocked was off the timeline and still in the thread.
     「それ以外の会話は本ツイートとは関係ないものとする」

     「線で繋いでないとマジでどの投稿か分からなくなる」 OWNER 2026-09-05: a row
     draws a rail under its face when there is a deeper row beneath it,
     and「beneath」has to mean beneath ON THE SCREEN -- a reply whose only
     child had gone would otherwise draw a rail down to nothing. `postDown`
     walks depth first and hands back only the rows there are, so the row
     after this one is this one's child exactly when it is deeper. */
  ups=postUps(p);
  vis=postDown(id, 0, [], [id]);
  /* Everything above the post is on the way down to it, so every one of them
     has a row beneath it by construction. */
  for(i=0;i<ups.length;i++)
    out+='<div class="pkid">'+postRow(ups[i])+'</div>';
  /* The one post somebody came here to read is the exception. It went, and
     saying so is the whole point of it having gone -- a gap here reads as
     "never existed", which is the opposite of what happened. Blocked answered
     with viewGone() above, so the tomb is the taken-down one and no other.
     「スレッドは本ツイートだけね？」 */
  out+='<div'+(vis.length? ' class="pkid"' : '')+'>'+
    (postShown(p)? postRow(p) : postTomb())+'</div>';
  for(i=0;i<vis.length;i++){
    /* The indent stops at THREAD_IN; whether there is a reply under this one
       is about the tree and not about how far in it is drawn, so it is asked
       of the depth that was not capped. */
    d=Math.min(vis[i].d, THREAD_IN);
    out+='<div class="pind pind'+d+
      ((i+1<vis.length && vis[i+1].d>vis[i].d)? ' pkid' : '')+'">'+
      postRow(vis[i].p)+'</div>';
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

   One field, and ONE ANSWER WITH EVERYTHING IN IT.
   「検索も#@投稿が一気に検索できるようにして」 OWNER 2026-09-04.

   `@` was the switch -- a query starting with it looked for a person and
   anything else looked for a post 「@でユーザー検索」 -- and then `snsMode`
   was, and now nothing is: both are asked for, every time, and the answer
   carries both. There is nothing to choose and nothing to press first.

   What `@` means now is only what it looks like: it is dropped off the front
   of a name, because that is where people put it. It does not decide
   anything any more.

   SNS_SEAM. A search is a QUESTION ASKED OF SOMEWHERE ELSE, and it is built
   as one: snsFind(q, done) hands back an answer through a callback, because
   that is the shape a request has and a shape cannot be retrofitted onto a
   function that returns. Nothing at the call site knows or cares where the
   answer came from -- it types, an answer arrives, the rows are drawn.

   Until net.js is wired, the answer is assembled out of what has already
   arrived. That is not the design; it is what the seam is filled with today.
   When there is a server, snsFind() asks it and everything else is
   unchanged.

   A PERSON is `{who, hd, av, lname}` -- the same four fields a post already
   carries about its author, and the same four a server row will have. There
   is no second shape for a person anywhere in this app, and there must not
   be: a post is signed with exactly these, so the search and the timeline are
   describing the same thing. */
/* ONE BOX, ONE ANSWER, AND NOTHING TO PRESS FIRST.
   「検索も#@投稿が一気に検索できるようにして」 OWNER 2026-09-04.

   `snsMode` is gone with that sentence. It was which of two things the search
   was about -- people while you typed, posts once you pressed -- and it is
   the shape the owner has just replaced: there is one question now and its
   answer has people and posts in it together.

   **This supersedes 2026-08-26** 「ツイートの検索は検索ボタン押したら
   出てくる。それまでは人」. That decision made typing mean one thing and
   pressing mean another; this one makes them the same thing. The 🔍 and the
   return key still have a job and it is the history -- snsGo() below. */
var snsQ='', snsHits=null, snsSort='new';
function snsSetQ(v){
  snsQ=String(v||'');
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
function snsClearQ(){ snsQ=''; snsHits=null; render(); }
/* SNS_SEAM — ask for what matches `q` and call done() with
   { q: <the query it answers>, who: [person, …], posts: [post, …] }.
   `q` comes back on the answer so a late one can be thrown away.

   Both lists, always. They were exclusive until 2026-09-04 and are not any
   more: two requests go out and the answer waits for both, so what comes
   back to the screen is one answer and not two arriving at different times.

   AND THIS IS WHERE THE ORDER IS ASKED FOR. `snsSort` is 'new' or 'buzz',
   and netFindPosts() does not take it yet -- www/net.js is another session's
   and the ordering lives there, beside the numbers that make it. When it
   takes one, it is the call below and nothing else on this screen: what
   comes back is drawn in the order it comes back in, which is already true.
   Nothing here scores a post or re-arranges an answer, deliberately. */
function snsFind(q, done){
  q=String(q||'').trim();
  if(!q){ done({q:q, who:[], posts:[]}); return; }
  /* BOTH, and the answer goes back once. 「検索も#@投稿が一気に検索できる
     ようにして」 OWNER 2026-09-04.

     The two used to be exclusive -- the `@` chose which one was asked, and
     later `snsMode` did -- so a person looking for a word had to know which
     kind of thing they were looking for before they could look for it. They
     are one question now and this is where the two answers meet.

     `who` and `posts` start as null and mean 「has not answered」; `fire()`
     is called by each side and does nothing until neither is null, so
     `done()` runs exactly once however the two land.

     COULD NOT ASK is only when NEITHER side answered. One side failing while
     the other brought rows is an answer, and the rows are it -- 「0 件」 and
     「訊けなかった」 stay two different screens, which is what snsAnsHTML()
     reads `bad` for. */
  var who=null, posts=null, why=null, name=netAtOff(q);
  function fire(){
    if(who===null || posts===null) return;
    done({q:q, who:who, posts:posts,
          bad:(!who.length && !posts.length && why)? why : null});
  }
  /* Both ask the SERVER. They used to walk this phone's own POSTS, which
     answers with the people you already know and the posts you already have
     -- the one search nobody needs.

     `bad` and not an empty list: nothing found and could not ask are two
     different answers and must not share a branch. */
  /* A handle is stored WITHOUT its @ -- netRow() and the head of a post both
     draw it as '@'+hd -- so `@aya` typed into this field asked the server for
     a handle CONTAINING the character `@`, and no handle contains one.
     netLike() wraps it as *%40aya* and the answer was always nobody.
     「検索で @ を打っても誰も出てこない」

     netAtOff() in www/net.js is the one place that says what that `@` IS, and
     it says it in both of the spellings a phone can give it. This line used to
     write the rule out again as `/^@+/`, which sees only the half-width one --
     so `＠aya` off a Japanese keyboard went to the server whole and the same
     complaint came back nine days later, on the same field.
     「@で検索しても出てこない」 OWNER 2026-09-03.

     Only off the front, and only for a person: `@` in the middle of a name is
     a character somebody typed, and a search over posts is a search over text
     where `@` means itself -- netLike() is shared with netFindPosts() and
     drops nothing, deliberately.

     netAtOff() and not netHandleOf(): that one also squashes spaces, which is
     what a HANDLE is and is wrong here, because netFindWho() matches `display`
     too and a display name has somebody's spaces in it.

     `q` on the ANSWER stays as it was typed. snsGot() throws away a late
     answer by comparing it with what is in the field, and the field has the
     @ in it. */
  /* Nothing left after the `@` is a query that is only an `@`. There is
     nobody to ask for, so that side is answered here and the posts still
     go out -- a search box with one character in it is not a broken one. */
  if(!name) who=[];
  else netFindWho(name, function(ws){ who=ws||[]; fire(); },
                        function(d, st){ who=[]; why=why||netWhy(d, st); fire(); });
  netFindPosts(q, function(ps){ posts=ps||[]; fire(); },
                  function(d, st){ posts=[]; why=why||netWhy(d, st); fire(); });
  /* AND A TAG NEEDS NOTHING OF ITS OWN, which is the whole of what changed.
     「しかも何で検索が今日しか出ないの？ありえないだろ」 OWNER 2026-09-04.

     A second road ran beside this one: the words were turned into a PROMPT'S
     ID and netFindPrompt() asked for that day's answers. It could only ever
     name TODAY'S -- `DAY` is one row and this phone holds no list of them --
     so searching a tag found the posts written since midnight and nothing
     before them, which is not a search.

     A tag is characters somebody typed into what they wrote, so the request
     above already finds every one of them: netFindPosts() matches
     `body->>ln` and `body->>mn` with `ilike`, on every day there is. The
     second road is deleted rather than fixed -- one question, one request,
     and no id to be right about. */
}
/* Which of the two the answer is about. Where you are standing rather than
   anything the language has, so viewReset() drops it. */
/* IT ASKS BY THROWING THE ANSWER AWAY, and that is the whole of it. This
   used to ask here AND render, and vExplore() asks whenever there is a word
   with no answer under it -- so every press sent the same question to the
   server twice. Nothing threw: two answers to one question are the same
   answer, and the second one landed on a screen that already had it. It is
   the kind of waste that is multiplied by however many people are searching
   and is visible to nobody.

   One place asks and it is vExplore(). snsSetSort() has had this shape since
   it was written -- change what is being asked, empty `snsHits`, and let the
   render put the question. This is that, with the mode moving instead of the
   order. */
function snsGo(){
  if(!snsQ.trim()) return;
  snsRecentAdd(snsQ);
  render();
}
/* A person, as a row: the face, the name and the handle, the language they
   write, and the one thing you came here to do about them.

   `full` is the follows list and nothing else -- it adds the 「フォローされて
   います」 label and the line about themselves, which is the shape the owner
   named 「フォロー中の見た目これにしろよ」. The search row is left exactly as
   it was: 「ui変更は俺が頼んだの以外は勝手な判断でやるなよ？」

   Two arguments now, so it may never be handed bare to `map` -- rule 8's
   own worked example is `postRow` growing a second argument and every row
   after the first being given its index. `sides-check` holds it.
   「⭕️ @〇〇 lingua マーク　フォローする」

   Two controls and not one, so the row is a container: pressing the person
   opens their page, pressing Follow follows them and stays where it is. It
   was one button with a chevron on the end -- which meant the only thing you
   could do with somebody you had just found was go and look at them.

   Your own row has neither: you cannot follow yourself, and the chevron is
   not needed to say where your own name goes. */
function snsWhoRow(p, full){
  var h=String(p.hd||''), on=meFollows(h), back=full && meFollowers().indexOf(h)>=0;
  var inner='<span class="pav">'+postFace(p)+'</span>'+
    '<span class="whb">'+
      '<span class="pname">'+esc(postWho(p))+'</span>'+
      '<span class="whh">'+
        '<span class="phandle">@'+esc(h)+'</span>'+
        /* 「フォローされています」の小さい札。相手が自分を追っているか
           だけの話なので meFollowers() で答えが出る -- サーバーへの問いは
           増えない。角丸でも枠でもない小さな字にしてある: 規則18 は
           「新しいものに角丸・枠・塗りを付けない」で、リーダーが名指しで
           許したのは右のボタンひとつだけ。X の見本では灰色の丸い札です。 */
        (back? '<span class="whyou">'+esc(t('me.follows.you'))+'</span>' : '')+
      '</span>'+
      /* 一行の自己紹介。**いまは誰の分も空になります** -- `profile` に
         `bio` の列が無く（netWho() のコメントがそう書いている）、投稿も
         bio を運んでいない。列が出来た日にこの行が埋まる。 */
      (full && p.bio? '<span class="pbio">'+esc(p.bio)+'</span>' : '')+
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
/* Asked once, through the pull table like everything else, and asked when the
   session begins rather than by the screens that show them -- which is what
   stopped both of these arriving a second after somebody was already looking
   at the list they replace.

   `netSignedIn()` is asked HERE and not left to net.js. netSearchSaved()
   answers `ok([])` when there is no member -- an empty list that means
   "nobody asked", not "this person keeps nothing" -- and writing that over
   the copy would erase somebody's list on a launch that had not signed in
   yet. So it is not asked at all until there is somebody to ask for.

   A refusal leaves the copy exactly as it is. No signal is not an answer.

   ---- and what the phone kept before there was a row for it ---------------

   THE FIRST ANSWER IS ADDED TO, NOT SUBSTITUTED FOR. 「制作はオフラインでも
   可能次つながった時に更新される」 -- what somebody made without a signal goes
   up when there is one, and a starred word is something somebody made. The
   other reading, that the server simply wins, is the way docs/DATA_SAFETY.md
   says a backup destroys somebody's work: by winning. So a word this phone
   has and the server does not is UPLOADED, never read as "deleted".

   ONCE, and that is the half that is easy to get wrong. Union on every pull
   means a word taken off on the other phone comes back from this one for
   ever, and the star stops being something you can turn off. `SET.savedUp`
   remembers that this phone has handed its copy over; after it, the answer
   IS the copy, and a word removed elsewhere is removed here.

   The flag is not what stops a word going up twice -- the difference of the
   two lists is, and it would hold with no flag at all. What the flag decides
   is the OTHER thing: when the server's answer is allowed to be the whole
   truth. It is set only when every upload came back, so a phone that lost
   its signal half way through tries again next time. */
function snsSavedHas(a, w){
  var i;
  for(i=0;i<a.length;i++) if(a[i]===w) return true;
  return false;
}
/* Every word up, and then say whether they all made it. Counted rather than
   chained: they are independent rows and one refusing says nothing about the
   next. */
function snsSavedPush(add, done){
  var left=add.length, ok=true, i;
  if(!left){ done(true); return; }
  function one(fine){
    if(!fine) ok=false;
    left--;
    if(!left) done(ok);
  }
  for(i=0;i<add.length;i++)
    netSearchSave(add[i],
      function(){ one(true); },
      function(){ one(false); });
}
/* ONE ENTRY IN THE TABLE, and it is asked at the open like everything else.
   It kept a flag for 「asking」 and a flag for 「answered」, which is what
   PULL_OUT and PULL_GOT already are, and it swallowed a fall in silence --
   so a phone that could not reach the server drew the same empty list as one
   whose account keeps nothing. `bad` is the road out now, and it is the same
   road every other ask falls down. */
function askSaved(ok, bad){
  netSearchSaved(function(rows){
    var got=[], mine=snsSaved(), add=[], out, i;
    for(i=0;i<(rows||[]).length;i++)
      if(rows[i] && rows[i].q) got.push(String(rows[i].q));
    /* Once handed over, the server is simply the answer -- including an
       empty one, which is somebody having cleared them on another phone. */
    if(SET.savedUp){
      if(snsSameWords(got, mine)){ ok(1); return; }
      SET.saved=got; save(); ok(1);
      return;
    }
    for(i=0;i<mine.length;i++)
      if(!snsSavedHas(got, mine[i])) add.push(mine[i]);
    /* The server's first, then the ones this phone is handing over. Nothing
       is dropped from either side. */
    out=got.concat(add);
    snsSavedPush(add, function(allWent){
      if(!allWent) return;         /* try again next launch */
      SET.savedUp=true;
      save();
    });
    if(!snsSameWords(out, mine)){ SET.saved=out; save(); }
    /* Drawn whatever came back: the answer itself is what turns the mark into
       a list, or into the empty space that means this account keeps none. */
    ok(1);
  }, bad);
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
/* Chosen from the filter, and the timeline you were standing on is what gets
   filtered. 「絞り込みで星つけたやつはなんで検索欄行くの？ホームからね。」
   OWNER 2026-08-28.

   It called goTab('explore'), and all three things that does were wrong. It
   moved the TAB, so a word chosen from the timeline's own chooser answered
   on a different screen. It threw NAV away, so there was no way back to the
   timeline it was chosen from. And it landed on a search FIELD, which is the
   thing the owner named -- the recorded decision of the same day already
   said 「その言葉で検索し直す」 and 「飛ばすのではない」, and the code was
   doing the second half of that while doing exactly the first.

   Same shape as snsSetFil() above it, because it is the same chooser: the
   answer is the reason you came, so you are put back on the thing it is
   about. The asking happens where the answer is drawn -- vFeed() -- rather
   than here, so that one screen owns one question. */
function snsPickSaved(q){
  var k=String(q||'').trim();
  if(!k) return;
  snsFil={q:k, r:null};
  back();
}
/* ---- the words somebody TYPED ------------------------------------------

   「検索した履歴もユーザーはいらんから5個くらい検索履歴出るようにしたい」
   「1件づつ消せるでいいよ」 OWNER 2026-09-03.

   NOT THE STAR ABOVE, and the two must not become one. A star is a word
   somebody CHOSE to keep and it lives on the filter; a recent is a word they
   merely typed and it lives under the empty search field. `saved_search` and
   `recent_search` are two tables for that reason -- one row with a 「which
   kind is this」 column on it would mean the history's own ceiling of five
   silently deleting somebody's star, and un-starring a word taking the
   history with it.

   The owner's screenshot had a row of round faces over the words. That row is
   not built: 「人の丸い列は作らない」 and CLAUDE.md § Shape forbids a row of
   round chips you scroll sideways by name. This is a LIST, down the screen.

   THE SERVER IS THE RECORD AND `SET.recent` IS THE COPY, the same sentence
   the star makes. There is no `recentUp` flag beside `SET.savedUp`, and that
   is not an omission: the star existed on phones before it existed on the
   server, so it had a copy to hand over once. A history has never been
   anywhere else, so the server's answer is simply the answer. */
var SNS_RECENT=5;
function snsRecent(){
  var a=SET.recent;
  return (a && a.length)? a : [];
}
/* And the same, one row down: an entry in the table rather than two flags
   and a fall nobody was told about. */
function askRecent(ok, bad){
  netRecent(function(rows){
    var got=[], i;
    for(i=0;i<(rows||[]).length && got.length<SNS_RECENT;i++)
      if(rows[i] && rows[i].q) got.push(String(rows[i].q));
    if(!snsSameWords(got, snsRecent())){ SET.recent=got; save(); }
    ok(1);
  }, bad);
}
/* THE ONE PLACE A WORD ENTERS THE HISTORY, AND 🔍 IS THE ONLY ROAD TO IT.
   「検索は🔍押したらって言ってるやん」 OWNER 2026-09-03.

   `snsGo()` is the whole of it. Nothing else calls this, and nothing else may:
   `snsSetQ()` runs on every letter, so a word written from there leaves
   「a」「ay」「aya」 standing as three searches -- and the search was the one
   press, not the three letters. Writing it when an ANSWER lands is the same
   mistake wearing a later moment, because an answer lands per letter too.

   IT AGREES WITH WHAT THIS SCREEN ALREADY SAYS, which is why it is one road
   and not two. 「ツイートの検索は検索ボタン押したら出てくる。それまでは人」
   (2026-08-26): 🔍 is the place that already means 「searched」, and typing is
   somebody looking at people. Opening a person off the answer was a second
   road into this function and it is gone -- a history is what somebody
   searched for, and reaching a person is not the act the owner named.

   Newest first, and the same words again MOVE rather than making a second
   line -- `unique (author, q)` on the server says the same thing. The sixth
   pushes the fifth off, which is a delete and is inside the decision:
   「直近5件」 is what the feature IS. The one that fell off is dropped from
   the server by its words.

   The copy is written and the screen does not wait for the server, the same
   way the star does not: a history that only appeared once the network came
   back would be a screen that forgets on a train. */
function snsRecentAdd(q){
  var k=String(q||'').trim(), a=snsRecent(), out=[k], i, off;
  if(!k) return;
  for(i=0;i<a.length;i++) if(a[i]!==k) out.push(a[i]);
  off=out.slice(SNS_RECENT);
  out=out.slice(0, SNS_RECENT);
  if(snsSameWords(out, a)) return;
  netRecentAdd(k, function(){}, function(){});
  for(i=0;i<off.length;i++) netRecentDrop(off[i], function(){}, function(){});
  SET.recent=out;
  save();
}
/* One word off, and only that one. There is no button that takes them all:
   「1件づつ消せるでいいよ」. */
function snsDropRecent(q){
  var k=String(q||'').trim(), a=snsRecent(), out=[], i;
  if(!k) return;
  for(i=0;i<a.length;i++) if(a[i]!==k) out.push(a[i]);
  if(snsSameWords(out, a)) return;
  netRecentDrop(k, function(){}, function(){});
  SET.recent=out;
  save();
  render();
}
/* Pressed: that word goes into the field and is searched for again. It is
   put through snsSetQ() rather than set here, because that is the one place
   that says what typing into this field does -- writing it out again would
   be a second copy of it, and what would drift first is which questions get
   asked. */
function snsPickRecent(q){
  var k=String(q||'').trim();
  if(!k) return;
  snsSetQ(k);
  render();
}
/* The list, under an EMPTY field. With something typed, the answer is what
   the screen is about and the history would be sitting on top of it.

   The heading is a NAME and not a sentence about what the list is
   (CLAUDE.md § Explaining), the same shape as 「保存した検索」 above it. No
   corner, no border, no panel: `.whrow` is a row with a hairline under it and
   `.pmore` is the small trailing control a post's row already wears. */
function snsRecentHTML(){
  var a=snsRecent();
  /* An empty list and a list that has not come back are two different facts,
     AND SO IS A LIST FROM LAST TIME. It drew this phone's stored copy while
     this session's answer was in the air, so a history that had changed on
     the other phone appeared and then rearranged itself -- 「1秒後に変わる
     やつは本当に嫌」. The mark until the server has answered, whether or not
     there is a copy underneath it. netSignedIn() because the ask does not go
     without somebody to ask for -- a mark turning on a question nobody is
     asking is a lie. */
  if(netSignedIn() && !pullHad('recent')) return snsWaitHTML();
  if(!a.length) return '';
  return '<div class="sec">'+esc(t('sns.recent'))+'</div>'+
    a.map(function(q){
      return '<div class="whrow">'+
        '<button class="whgo"' + DO('snsPickRecent', [q]) + '>'+
          '<span class="sl">'+esc(q)+'</span></button>'+
        '<button class="pmore"' + DO('snsDropRecent', [q]) + ' aria-label="'+
          esc(t('sns.recent.drop'))+'">'+ICON_CROSS+'</button>'+
      '</div>';
    }).join('');
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
/* The rows an answer draws, wherever an answer is drawn. The search has had
   one since there was a search; the timeline has one now, because a word
   chosen from the filter is the same question put to the same server. Two
   copies of "what an answer looks like" is the thing that drifts, and what
   would drift first is who is left OUT of it -- somebody blocked has to be
   out of both, and a second copy is a second place to remember that. */
function snsAnsHTML(q, r){
  var out='', i, ps;
  if(!String(q||'').trim()) return '';
  /* NOT ASKED BACK YET, and that is the third state -- it shared a branch with
     「no word」 and both came out as nothing at all. Nothing at all is what a
     screen with no question on it looks like, so a question with no answer
     looked exactly like never having asked. `snsWaitHTML()` is the mark the
     timeline already turns beside this one; there is no second one. */
  if(!r) return snsWaitHTML();
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
/* What sits under the field: the answer where there is a word, and the words
   this account has typed where there is not. One or the other and never both
   -- a history under a live answer is a second list on a screen that is
   already about one thing. */
function snsHitsHTML(){
  if(!snsQ.trim()) return snsRecentHTML();
  return snsAnsHTML(snsQ, snsHits);
}
function vExplore(){
  if(!netSignedIn()) return snsLocked('explore');
  /* Three things this screen reads live on the server -- whether you follow
     the people in its rows, the words you keep, and the words you have typed
     -- and all three came down when the session began (§ WHAT AN OPEN ASKS
     FOR). Nothing is asked from here. */
  /* Asked once when the screen is built, so coming back to a query already
     typed shows its answer rather than an empty page. */
  if(snsQ.trim() && !snsHits) snsFind(snsQ, snsGot);
  return '<div class="view">'+
    /* IN THE BAR, where the search on a timeline is. It sat under the bar,
       below a title that said the same word as its own placeholder, so the
       one thing this screen is for started a bar and two margins down the
       page. 「検索画面の検索ボックス下すぎない？」OWNER 2026-09-01.
       What filters the answer stays in the corner it was in --
       「絞りはそこでいいけど」. */
    rootTop('explore', snsSortTop(), snsFieldHTML())+
    '<div class="body">'+
    '<div id="sns-hits">'+snsHitsHTML()+'</div>'+
    '</div></div>';
}
function snsFieldHTML(){
  /* `enterkeyhint` is what makes the phone's own return key say Search, and
     pressing it is what asks for posts. 「ツイートの検索は検索ボタン押したら
     出てくる」 Enter searches rather than putting a newline in: the keydown
     listener stops the key before it runs the name.

     The star is this screen's alone -- keep this search, or not. Two drawings
     rather than a class, because "saved" is a filled star and "not saved" is
     an outline of one, and that is the whole difference. It is only there when
     there is something to keep. */
  return searchBox('sns', t('sns.search'), 'snsSetQ', snsQ, {
    attrs: ' enterkeyhint="search"' + KD('snsGo'),
    /* Its own, because emptying this one puts the answer away as well */
    clear: 'snsClearQ',
    extra: snsQ.trim()
      ? '<button class="sx"' + DO('snsSaveQ') + ' aria-label="'+
          esc(t('sns.save'))+'">'+(snsIsSaved(snsQ)? ICON_STAR_ON : ICON_STAR)+'</button>'
      : '' });
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
var NOTES_HAVE=null;
/* THE COPY ON THE HANDSET IS GONE, AND THE ANSWER IT WAS FOR IS NOW ASKED
   EARLIER INSTEAD.
   -------------------------------------------------------------------------
   It was `lingua.notices`, filed under the account, put on the screen in the
   first frame and replaced when the server answered. It was built for
   「通知とか表示されるのに1秒くらいの空白の時間があるのうざいからそれ無くして
   欲しい」 OWNER 2026-08-28 -- the second of blank before the notices land --
   and it answered that complaint by drawing LAST TIME'S notices through it.

   Which is the other complaint. 「フォローとか0って出て1秒後に1とか数字が
   変わる」 OWNER 2026-09-04, 「アイコンも1秒遅れ表示」 OWNER 2026-09-05: this
   list is the one screen in the app that is made of faces, and every one of
   them was last session's, held for a second, and then swapped for whatever
   had actually happened. The two complaints are the pair cf987fe6 named, and
   the owner has already said which way they resolve -- 「サーバーに聞く前に
   ロード挟んで絶対に遅れて表示させることないように」.

   BOTH ARE ANSWERED BY ASKING EARLIER, which is why the copy can go rather
   than merely stop being drawn. The notices are on PULL_OPEN (§ WHAT AN OPEN
   ASKS FOR): the question goes out when the app opens, under the 900ms
   splash, so by the time anybody presses the bell the answer is here. There
   is no second of blank to cover, and nothing stale to cover it with.

   What is left is the mark, for the launch where the answer really is still
   out -- which is vNotif() below and is the same mark the timeline turns. */
var NOTES_HAVE=null;
/* WHAT MAKES A NOTICE UNREAD, and it is the owner's answer rather than the
   server's. 「最後に通知の画面を開いた時刻より新しいものを未読とする」 OWNER
   2026-09-01, X と Instagram と同じ形.

   THE SERVER HOLDS NO READ MARKER. `notices()` in supabase/schema.sql returns
   eight columns -- kind, at, hd, who, av, post, n, more -- and not one of them
   says read; there is no `read_at`, no `last_seen` and no table for one. So
   this is the whole of what unread means here, and it is a decision and not a
   workaround for a missing column: 「サーバーの既読の表は要りません」.

   `SET.notAt` is the number, in `lingua.set` because it is a fact about the
   PERSON and not about the notices -- it survives the copy being replaced.
   `docs/DATA_MODEL.md`. */
function notUnread(){
  var i, n=0, at=Number(SET.notAt||0), ns=NOTES_HAVE||[];
  for(i=0;i<ns.length;i++) if(Number(ns[i].at||0)>at) n++;
  return n;
}
/* Opening the screen is the reading. Written down only when something was
   actually unread: this runs on every render of the notices, and save() walks
   the language's slices, so writing a timestamp on each of them would be a
   dictionary written out to say a bell went quiet.

   Not writing costs nothing that matters -- a phone killed before the write
   shows the mark again, which is the side that never hides a notice. */
function notSeen(){
  var had=notUnread();
  SET.notAt=Date.now();
  if(had) save();
}
/* Asked when the session begins, so the count is right on the first frame of
   whatever screen the app opened on and no screen has to ask for it. What
   holds 「asked once」 is the pull table and not a flag of this file's own.
   www/sns.js § pullRun.

   THE NOTICES ARE WHY IT IS HELD THERE. This screen's own pull was called
   from vNotif() with no such guard: the answer landed, the screen was drawn,
   the drawing asked again, and it went round for as long as anybody stood on
   the notices. The timeline had the guard and this did not, and no one
   reading either could see that. */
/* The face, and the way to whoever wears it. 「行に顔、顔を押すとその人の
   ページ」 OWNER -- which is the same sentence the timeline already answered
   with postAvHTML(): 「人のツイートのアイコン押したらその人のホーム画面に
   飛ぶようにしてよ」. One builder and not a second one, so a notice's face is
   a door for the same reason a post's is, and stops being one in the same
   place if that ever changes.

   A notice describes a person with the four fields everything else does --
   netNotices() says so where it reads them -- so what is handed over is those
   four and nothing invented.

   THE `id` IS THE FACE'S KEY, NOT A POST'S. postFace() caches a drawn face
   under `id`, and a notice's own `id` is the post it is ABOUT: two people who
   liked the same post would share one key and both wear whichever face was
   written last, and a follow -- which has no post at all -- would fall to
   'me' and wear mine. It is keyed by the handle, which is who the face is OF.

   Nobody in it, no face. A 'pick' is a post worth reading and not somebody
   doing something, so it carries no handle; drawing the empty circle there
   would put a '?' on the one row that never had a person in it. */
function notFace(n){
  var h=String(n.hd||'');
  if(!h) return '';
  return postAvHTML({hd:h, who:n.who, av:n.av, id:'n:'+h});
}
/* A notice is a way to the thing it is about. 「通知で飛べないよ」 OWNER
   2026-08-28 -- the row was a plain <div> with nothing on it to press, so
   every notice was a sentence you could read and not follow.

   THE SAME SHAPE A POST'S ROW HAS: the row carries the press and the face
   inside it carries its own, so pressing the row opens the post and pressing
   the face opens the person. postRow() has been that since a post opened onto
   its thread, and act.js hands a press to the nearest name above it, which is
   what lets the two live in one row.

   Only where there IS a post. A follow carries none -- somebody followed you,
   there is nothing to open -- and postOpen() refuses an id this phone does
   not hold, so the press is put on rather than the row pretending. Nothing
   moves on the screen either way: no class, no mark, no arrow.
   「ui変更は俺が頼んだの以外は勝手な判断でやるなよ？」 */
/* WHO A NOTICE IS FROM, when it is from more than one person.
   「同じ投稿のいいねはXみたいにまとめる」「フォローも同じでいい ── 〇〇さん
   他3人にフォローされました」 OWNER 2026-08-28, docs/FEATURE_RULES.md.

   THE GROUPING IS ALREADY DONE, AND IT IS DONE ON THE SERVER, which is what
   that decision says. `notices()` in supabase/schema.sql groups by (kind,
   post), counts them into `n`, and hands back up to four of the people as
   `few` -- the first becomes the row's `hd`/`who`/`av` and the rest arrive as
   `more`. **www/sns.js has been throwing `n` and `more` away since the day
   they were added**, so fifty likes on one post drew as one person's name and
   the other forty-nine were not mentioned. Nothing threw: the row was correct
   about the person it named.

   The count is the SERVER's -- `n` -- and not the length of `more`, which is
   capped at four. Saying 「他3人」 off a capped list would be the app quietly
   deciding that fifty is three. */
function notWho(n){
  var few=n.more||[], k=Number(n.n||1);
  if(k<=1 || !few.length) return postWho(n);
  /* Two people are both named. Instagram and X both do this and it is what
     the owner's own picture shows. */
  if(k===2) return t('notif.two', postWho(n), postWho(few[0]));
  /* More than two: the first, and how many others. `tn` because English says
     「1 other」 and 「3 others」 and Russian counts differently again. */
  return tn('notif.many', k-1, postWho(n));
}
/* Their faces, up to three. Each is its own door, the way the single one
   always was -- pressing a face opens that person and pressing the row opens
   the post. */
function notFaces(n){
  var few=n.more||[], out=notFace(n), i, o;
  /* TWO, overlapping. 「プロフィール画像は丸くて、重なって並ぶ」 OWNER
     2026-09-01, which is what the picture has. It drew three side by side,
     and on a 320 that is 128px of the row spent on faces -- the sentence had
     46px left and wrapped to six lines, so no two rows in the list were the
     same height. Two is the picture's number and it is also what gives the
     sentence its width back. */
  for(i=0;i<few.length && i<1;i++){
    o=few[i];
    out+=postAvHTML({hd:o.hd, who:o.who, av:o.av, id:'n:'+String(o.hd||'')});
  }
  return out;
}
/* WHERE A NOTICE GOES, and it is the KIND that decides rather than whether
   there happens to be a post on it.

   It was `n.id? postOpen : nothing`, so a FOLLOW -- which carries no post,
   because following somebody is not about one -- had no door at all. One row
   in the list did nothing when pressed, and nothing said so.

   A follow goes to the person. Where it is a group 「Veth と他3人があなたを
   フォローしました」 that is the one in front, `n.hd`, which is the one the
   sentence is named after -- the same person the first circle draws.

   Everything else goes to the post it is about. A recommendation is about a
   post too, so it goes there like the rest. What is left with nowhere to go
   is a notice carrying neither, and that gets no door rather than a door
   onto nothing. */
function notGo(n){
  var k=String(n.kind||''), h=String(n.hd||'');
  if(k==='follow') return h? DO('go', ["profile", h]) : '';
  if(n.id) return DO('postOpen', [String(n.id)]);
  return h? DO('go', ["profile", h]) : '';
}
function notRow(n){
  var k=String(n.kind||''), p=postById(n.id), pics=p? postPics(p) : [], ic=
    k==='like'? ICON_HEART : k==='boost'? ICON_BOOST :
    k==='reply'? ICON_REPLY : k==='follow'? ICON_ADD : ICON_LINE;
  return '<div class="ntf"'+notGo(n)+'>'+
    /* THE KIND, NAMESPACED. It was `class="ntfi '+k+'"`, so a notice about a
       recommendation wore `pick` -- and `.pick` is a tab strip somewhere else
       in the stylesheet, with `margin:10px 0 4px` and a border under it. The
       mark on that one row was being pushed down and given a rule of its own
       by a class it had never heard of. Nothing threw; it was 3px, and it is
       the row the owner pointed at.

       `like` `boost` `reply` `follow` `other` collide with nothing today,
       which is luck rather than a reason: a bare word out of the data, used
       as a class name, is a collision waiting for whoever next adds a rule.
       All five are prefixed, so the answer does not depend on what the
       stylesheet happens to contain. */
    '<span class="ntfi nk'+esc(k)+'">'+ic+'</span>'+
    '<span class="ntffs">'+notFaces(n)+'</span>'+
    '<span class="ntfb">'+
      /* The time is IN the sentence -- 「A と B がいいねしました · 1週間」 --
         rather than off the right-hand end of the row. 「文字の位置違うやん」
         OWNER 2026-09-01: the picture reads as one line of words, and a
         column of times against the right edge was taking 32px out of the
         middle of it on a phone that had none to spare. */
      '<span class="ntfw">'+esc(t('notif.'+(k||'other'), notWho(n)))+
        '<span class="ntfwh"> \u00b7 '+esc(postWhen(n.at))+'</span></span>'+
      /* Only where there is something to read. It was always drawn, empty
         where there is no post, so that every row came out the same height --
         and what that made is a row of one sentence with a blank line under
         it. 「通知なんか真ん中に文字ないせいできもい。文字増えたら2列にすれば
         よくない？」OWNER 2026-09-01. A row is one line where there is one
         line and two where there is a post under it; the face holds the
         height either way. */
      ((p && (p.mn || p.ln))
        ? '<span class="ntfp">'+esc(p.mn || p.ln)+'</span>' : '')+
    '</span>'+
    /* The post itself, small, on the right -- which is the owner's picture and
       is also the only thing on the row that says WHICH post without reading
       it. Only where this phone has the post: a notice is about something you
       wrote, so it is in `lingua.posts`, and a notice whose post is not here
       shows the time alone rather than a gap. */
    (pics.length? '<span class="ntfpic"><img src="'+esc(pics[0])+'" alt=""></span>'
                : '')+
    '</div>';
}
/* WAITING FOR AN ANSWER IS NOT THE SAME AS THERE BEING NOTHING, and this
   screen said both with one sentence. 「通知とか表示されるのに1秒くらいの空白
   の時間があるのうざい」 OWNER 2026-08-28, build #106.

   `NOTES_HAVE` starts null and means "nobody has asked yet". It was read as
   `(NOTES_HAVE||[])`, so a screen with the request still in the air drew
   「まだ何もありません」 -- a statement of fact, about a question nobody has
   answered -- and then the notices appeared under it a second later. That is
   the flash the owner is looking at.

   CLAUDE.md § Data: 「"Empty" and "broken" are different states and must not
   share a branch.」 Three states here, not two: not asked (draw nothing),
   answered and empty (say so), answered with notices (draw them).

   snsAnsHTML() in this same file has had it right since it was written --
   `if(!r) return ''` -- so this is the search's shape, not a new one.

   AND THE THIRD STATE IS THE MARK, NOT LAST TIME'S NOTICES. `lingua.notices`
   used to stand here -- the copy on the handset, drawn in the first frame and
   replaced when the answer landed -- and replacing a screenful of faces a
   second after somebody is looking at them is 「アイコンも1秒遅れ表示」 OWNER
   2026-09-05. It is gone (§ THE COPY ON THE HANDSET IS GONE) and what covers
   the wait is the mark, exactly as it does on the timeline and under the two
   counts. `pullHad('notif')` is the question 「has the server answered this
   session」 and it is the table's, not a flag of this screen's. */
function vNotif(){
  if(!netSignedIn()) return snsLocked('notif');
  notSeen();
  /* The notices came down when the session began (§ WHAT AN OPEN ASKS FOR).
     Standing on this screen asks for nothing; pulling it asks again. */
  var got=pullHad('notif')? (NOTES_HAVE||[]) : null;
  var ns=(got||[]).filter(function(n){ return !meBlocks(n.hd); });
  return '<div class="view">'+rootTop('notif')+
    '<div class="body">'+
    /* 「まだ何も無い」は答えが来てから。来るまでは待っている印を回す ──
       何も描かないのと、何も無いのは別の状態で、どちらも同じ空白に見える。
       「一瞬消えたりが嫌だからローディングで誤魔化してほしい」OWNER
       2026-09-02。タイムラインが待つときと同じ印です。 */
    (ns.length? ns.map(notRow).join('')
              : (got? snsNone() : snsWaitHTML()))+
    '</div></div>';
}
