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
   you cannot see yourself having spoken in. */
var snsTab='rec';
function snsSetTab(k){ snsTab=(k==='fo')? 'fo' : 'rec'; render(); }
function snsMine(p){ return !!p.mine || meFollows(p.hd); }
function snsList(){
  var all=postAll();
  return (snsTab==='fo')? all.filter(snsMine) : all;
}
function snsTabs(){
  var tabs=[['rec','feed.rec'], ['fo','feed.fo']];
  return '<div class="pftabs snstabs">'+tabs.map(function(x){
    return '<button class="pftab'+(snsTab===x[0]?' on':'')+'"' + DO('snsSetTab', [x[0]]) + '>'+
      esc(t(x[1]))+'</button>';
  }).join('')+'</div>';
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
/* Where an appeal goes. An address and not a form: a frozen account cannot
   write a row anywhere -- every write policy in supabase/schema.sql goes
   through is_member() and that is the whole of what being frozen means -- so
   a form here would need a table with the door open, which is a door. Mail
   is a channel that already exists and is not ours to break. */
var APPEAL='mailto:Lingua@tokinets.com?subject=Lingua';
function vFeed(){
  if(!netSignedIn()) return snsLocked('feed');
  snsPull();
  /* Beside the feed's own pull and for the same reason: the moment somebody
     is looking at a timeline is the moment the network is known to be
     working. Once a session -- dayPull() returns immediately once it has one. */
  dayPull();
  var list=snsList();
  /* A row takes one argument again. It used to take a second -- whether YOUR
     font was switched on -- and `list.map(postRow)` handed each row its index
     as that argument, so post 0 was right and every post after it wore my
     font anyway. There is no font to hand it now: a post carries the shapes
     its own line is written in, so a row is read out of the row. */
  return '<div class="view">'+
    /* The word for the day, beside the name of the screen. A word and not an
       icon 「文字ね」, and in the bar rather than as a sixth tab: it is the
       same timeline seen through one day. It is only there when there IS a
       day -- a word that goes to an empty page is worse than no word. */
    rootTop('feed')+
    /* The body's 10px of head goes when the day's sentence is the first thing
       in it: the sentence carries its own 12, and two paddings stacked is the
       timeline pushed down for nothing. */
    '<div class="body'+(daySay()? ' dayb' : '')+'">'+
    /* Three lines and no more: the name of the screen, the day's sentence,
       and the row you write in. 「あんまり高さ変えずに3列にしたい」

       The sentence is one line, cut with an ellipsis, so this block is the
       same height whatever the day says -- and the whole of it is on the
       day's own page, which is where pressing it goes. .navtop gives up four
       of its eight bottom pixels when it is here, so three lines cost less
       than a line. */
    dayLine()+

    /* A row to write in, at the top of the timeline, because the round button
       is one floating thing over the corner of a screen and somebody who does
       not see it has no way to post at all. 「ホームからもツイートできるように」
       It is not a field: pressing it opens the screen a post is written on,
       which is where the letters, the photographs and the voice are. */
    (NET_BANNED? '' : dayRow())+
    /* Under the row you write in and directly on top of the list they choose
       between, because that is what they are about. */
    snsTabs()+
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
/* The sentence, under the name of the screen and over the row you write in.
   Nothing when there is no sentence, so the day the server missed is the two
   lines this screen has always had. */
function dayLine(){
  var say=daySay();
  if(!say) return '';
  /* What it is, in front of what it says. The word is the SCREEN's name read
     back with pageName() rather than a string of its own -- the page it goes
     to is called that, and naming it twice is the thing rule 2's NAMES claim
     exists to refuse. */
  return '<button class="dayline"' + DO('go', ["day"]) + '>'+
    '<span class="dayk">'+esc(pageName('day'))+'</span>'+esc(say)+'</button>';
}
/* One row, and it is the row that was always there: the face and a line of
   grey type. What changes when there is a sentence for the day is what the
   grey type says and what pressing it opens with -- not the shape, and not
   the height. */
function dayRow(){
  var say=daySay();
  return '<button class="wrow"' + DO('openPost', say? ["day"] : []) + '>'+
    '<span class="pav">'+
      postFace({who:meName(), lname:langName, av:postAvatar()})+'</span>'+
    '<span class="wrt">'+esc(t(say? 'day.ask' : 'post.ln.ph'))+'</span>'+
  '</button>';
}
/* ---- one day, and what everybody said ----------------------------------
   The sentence at the top and every answer under it. This is the half the
   table was designed for and the reason the link is a column rather than a
   word in the text: `prompt` has an index behind it, so a day is one query.

   「投稿は残るので、お題は積み上がる ── 誰かが作ったあらゆる言語での同じ
   意味。その日が過ぎたあとも戻ってくる価値のあるページ」 -- schema.sql. */
var DAYP=null, dayPPulling=false;
function dayPPull(){
  if(dayPPulling || !DAY) return;
  dayPPulling=true;
  netDayPosts(DAY.id, function(ps){
    dayPPulling=false;
    DAYP=ps||[];
    render();
  }, function(){ dayPPulling=false; DAYP=DAYP||[]; });
}
function vDay(){
  if(!netSignedIn()) return snsLocked('day');
  var say=daySay(), d=String((DAY&&DAY.on_day)||'').split('-'), list;
  if(DAY) dayPPull();
  list=DAYP||[];
  return '<div class="view">'+
    navTop('')+
    '<div class="body">'+
    (say? '<div class="dayhd">'+
            (d.length===3? '<span class="dayd">'+
               esc(t('day.date', String(+d[1]), String(+d[2])))+'</span> ' : '')+
            esc(say)+'</div>' : '')+
    (list.length? list.map(postRow).join('') : snsNone())+
    '</div>'+
    snsFab('day')+
  '</div>';
}
function snsFab(from){
  if(!netSignedIn() || NET_BANNED) return '';
  return '<button class="fab"' + DO('openPost', from? [from] : []) +
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

   One field, and `@` is the switch: a query starting with it is looking for a
   person and anything else is looking for a post. 「@でユーザー検索」

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
var snsQ='', snsHits=null, snsMode='who';
function snsSetQ(v){
  snsQ=String(v||'');
  /* Typing is looking for somebody again. A query that answered with posts
     and then went on answering with posts as the next name was typed would
     be a screen that changed what it was about and never changed back. */
  snsMode='who';
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
   business too -- it is cheaper to ask for one thing. */
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
  netFindWho(q, function(ws){ done({q:q, who:ws, posts:[]}); }, no);
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
function snsHitsHTML(){
  var r=snsHits, out='', i;
  if(!snsQ.trim() || !r) return '';
  /* Could not ask, which is not the same as found nothing. */
  if(r.bad) return '<div class="note">'+esc(r.bad)+'</div>';
  /* And out of the search too, on both sides: a person you have blocked is
     not somebody you are looking for, and neither is what they wrote. */
  for(i=0;i<(r.who||[]).length;i++)
    if(!meBlocks(r.who[i].hd)) out+=snsWhoRow(r.who[i]);
  for(i=0;i<(r.posts||[]).length;i++)
    if(!postBlocked(r.posts[i])) out+=postRow(r.posts[i]);
  return out || '<div class="note">'+esc(t('sns.nohit'))+'</div>';
}
function vExplore(){
  if(!netSignedIn()) return snsLocked('explore');
  /* Asked once when the screen is built, so coming back to a query already
     typed shows its answer rather than an empty page. */
  if(snsQ.trim() && !snsHits) snsFind(snsQ, snsGot);
  return '<div class="view">'+rootTop('explore')+
    '<div class="body">'+
    '<div class="search"><span class="lens">'+ICON_LENS+'</span>'+
      /* `enterkeyhint` is what makes the phone's own return key say Search,
         and pressing it is what asks for posts. 「ツイートの検索は検索ボタン
         押したら出てくる」 */
      '<input id="sns-q" placeholder="'+esc(t('sns.search'))+'" value="'+esc(snsQ)+'" '+
      'enterkeyhint="search" '+
      'autocomplete="off" autocorrect="off" spellcheck="false"' +
      IN('snsSetQ') + KD('snsGo') + '>'+
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
