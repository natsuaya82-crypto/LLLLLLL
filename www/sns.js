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
/* Everybody's languages, as they are written -- which for the moment is
   yours, because there is no server yet and a post has nowhere else to go.
   It is not a placeholder: a post written here is a real post, kept, and it
   is what the timeline will show when the rest of the world arrives. */
/* What has arrived, asked for whenever the timeline is looked at. The screen
   does NOT wait: it draws the posts that are here and takes an answer when
   one comes, which is what a timeline does and is the only shape that works
   on a phone in a tunnel. Today the answer is "nothing new".

   `snsPulling` stops a second ask while one is out -- a person flicking
   between tabs would otherwise have four in the air. */
var snsPulling=false;
function snsPull(){
  if(snsPulling) return;
  snsPulling=true;
  netFeed(snsTab, function(ps){
    snsPulling=false;
    if(!ps || !ps.length) return;
    postTake(ps);
    render();
  }, function(){ snsPulling=false; });
}
function vFeed(){
  snsPull();
  var list=snsList();
  /* A row takes one argument again. It used to take a second -- whether YOUR
     font was switched on -- and `list.map(postRow)` handed each row its index
     as that argument, so post 0 was right and every post after it wore my
     font anyway. There is no font to hand it now: a post carries the shapes
     its own line is written in, so a row is read out of the row. */
  return '<div class="view">'+
    rootTop('feed')+
    '<div class="body">'+
    /* A row to write in, at the top of the timeline, because the round button
       is one floating thing over the corner of a screen and somebody who does
       not see it has no way to post at all. 「ホームからもツイートできるように」
       It is not a field: pressing it opens the screen a post is written on,
       which is where the letters, the photographs and the voice are. */
    '<button class="wrow"' + DO('openPost') + '>'+
      '<span class="pav">'+
        postFace({who:meName(), lname:langName, av:postAvatar()})+'</span>'+
      '<span class="wrt">'+esc(t('post.ln.ph'))+'</span>'+
    '</button>'+
    /* Under the row you write in and directly on top of the list they choose
       between, because that is what they are about. */
    snsTabs()+
    (list.length
      ? list.map(postRow).join('')
      /* Two different emptinesses. Nothing at all is a timeline that has not
         started; nothing HERE, with posts on the other tab, is a person who
         has not followed anybody yet, and telling them "nothing has been
         written" would be the app being wrong about its own contents. */
      : (snsTab==='fo'? snsNoneFo() : snsNone()))+
    '</div>'+
    /* Where every timeline puts it: over the feed, above the bar, under the
       thumb of the hand already holding the phone. */
    '<button class="fab"' + DO('openPost') + ' aria-label="'+esc(t('post.new'))+'">'+
      ICON_ADD2+'</button>'+
    '</div>';
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
  if(!p) return viewGone();
  ups=postUps(p);
  down=postDown(id, 0, [], [id]);
  for(i=0;i<ups.length;i++) out+=postRow(ups[i]);
  out+=postRow(p);
  for(i=0;i<down.length;i++){
    d=Math.min(down[i].d, THREAD_IN);
    out+='<div class="pind pind'+d+'">'+postRow(down[i].p)+'</div>';
  }
  return '<div class="view">'+navTop(String(down.length))+'<div class="body">'+
    out+
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
var snsQ='', snsHits=null;
function snsSetQ(v){
  snsQ=String(v||'');
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

   The two lists are exclusive by the `@`: a query for a person asks for
   people and gets no posts, and the other way round. That is the server's
   business too -- it is cheaper to ask for one thing. */
function snsFind(q, done){
  q=String(q||'').trim();
  if(!q){ done({q:q, who:[], posts:[]}); return; }
  if(q.charAt(0)==='@'){ done({q:q, who:snsMatchWho(q), posts:[]}); return; }
  done({q:q, posts:snsMatchPosts(q), who:[]});
}
/* What the seam is filled with until there is a server: the people who have
   already arrived. A post is signed with its author, which is the whole
   reason it is signed, so they are read off the posts rather than kept as a
   second list that could disagree with them. */
function snsWho(){
  var out=[], seen={}, i, p, h;
  h=meHandle();
  if(h){ seen[h]=1; out.push({who:meName(), hd:h, av:postAvatar(), lname:langName, mine:true}); }
  for(i=0;i<POSTS.length;i++){
    p=POSTS[i];
    h=String(p.hd||'');
    if(!h || seen[h]) continue;
    seen[h]=1;
    out.push({who:p.who||'', hd:h, av:p.av, lname:p.lname||''});
  }
  var fs=meFollowing().concat(meFollowers());
  for(i=0;i<fs.length;i++){
    h=String(fs[i]||'');
    if(!h || seen[h]) continue;
    seen[h]=1;
    out.push({who:'', hd:h, av:null, lname:''});
  }
  return out;
}
function snsMatchWho(q){
  var s=String(q||'').replace(/^@/, '').toLowerCase(), all=snsWho(), out=[], i, p;
  if(!s) return all;
  for(i=0;i<all.length;i++){
    p=all[i];
    if(String(p.hd||'').toLowerCase().indexOf(s)>=0 ||
       String(p.who||'').toLowerCase().indexOf(s)>=0) out.push(p);
  }
  return out;
}
/* A post matches on the line as it is spelled and on what it means. Not on
   the shapes: a shape is not something anybody can type. */
function snsMatchPosts(q){
  var s=String(q||'').toLowerCase(), out=[], i, p;
  if(!s) return [];
  for(i=0;i<POSTS.length;i++){
    p=POSTS[i];
    if(String(p.ln||'').toLowerCase().indexOf(s)>=0 ||
       String(p.mn||'').toLowerCase().indexOf(s)>=0 ||
       String(p.lname||'').toLowerCase().indexOf(s)>=0) out.push(p);
  }
  return out;
}
/* A person, as a row, and every one of them opens a profile: your own has no
   argument and anybody else's is their handle. */
function snsWhoRow(p){
  var inner='<span class="pav">'+postFace(p)+'</span>'+
    '<span class="whb">'+
      '<span class="pname">'+esc(postWho(p))+'</span>'+
      '<span class="phandle">@'+esc(p.hd||'')+'</span>'+
    '</span>'+
    (p.lname? '<span class="plangtag">'+esc(p.lname)+'</span>' : '');
  return p.mine
    ? '<button class="whrow"' + DO('goTab', ["profile"]) + '>'+inner+ICON_GO+'</button>'
    : '<button class="whrow"' + DO('go', ["profile", String(p.hd||'')]) + '>'+
        inner+ICON_GO+'</button>';
}
function snsHitsHTML(){
  var r=snsHits, out='', i;
  if(!snsQ.trim() || !r) return '';
  for(i=0;i<(r.who||[]).length;i++) out+=snsWhoRow(r.who[i]);
  for(i=0;i<(r.posts||[]).length;i++) out+=postRow(r.posts[i]);
  return out || '<div class="note">'+esc(t('sns.nohit'))+'</div>';
}
function vExplore(){
  /* Asked once when the screen is built, so coming back to a query already
     typed shows its answer rather than an empty page. */
  if(snsQ.trim() && !snsHits) snsFind(snsQ, snsGot);
  return '<div class="view">'+rootTop('explore')+
    '<div class="body">'+
    '<div class="search"><span class="lens">'+ICON_LENS+'</span>'+
      '<input id="sns-q" placeholder="'+esc(t('sns.search'))+'" value="'+esc(snsQ)+'" '+
      'autocomplete="off" autocorrect="off" spellcheck="false"' + IN('snsSetQ') + '>'+
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
  notPull();
  var ns=NOTES_HAVE||[];
  return '<div class="view">'+rootTop('notif')+
    '<div class="body">'+
    (ns.length? ns.map(notRow).join('') : snsNone())+
    '</div></div>';
}
