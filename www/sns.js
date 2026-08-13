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
/* Everybody's languages, as they are written -- which for the moment is
   yours, because there is no server yet and a post has nowhere else to go.
   It is not a placeholder: a post written here is a real post, kept, and it
   is what the timeline will show when the rest of the world arrives. */
function vFeed(){
  var list=postAll();
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
/* A person, as a row. Your own opens your profile. Somebody else's opens
   theirs -- PROFILE_SEAM: there is no screen for one yet, so the row is a row
   until there is, and the day vProfile takes a handle it becomes a button
   here and nowhere else changes. */
function snsWhoRow(p){
  var inner='<span class="pav">'+postFace(p)+'</span>'+
    '<span class="whb">'+
      '<span class="pname">'+esc(postWho(p))+'</span>'+
      '<span class="phandle">@'+esc(p.hd||'')+'</span>'+
    '</span>'+
    (p.lname? '<span class="plangtag">'+esc(p.lname)+'</span>' : '');
  return p.mine
    ? '<button class="whrow"' + DO('goTab', ["profile"]) + '>'+inner+ICON_GO+'</button>'
    : '<div class="whrow">'+inner+'</div>';
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
/* Who read you, who answered, who followed. */
function vNotif(){ return snsEmpty('notif'); }
