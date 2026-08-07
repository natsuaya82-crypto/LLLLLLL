/* Lingua — a post (chapter 19)
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   A post is a line of somebody's language with what it means fixed to it by
   the person who wrote it.

   That last part is the whole design. A machine reading an invented language
   and telling everybody else what it says is a machine guessing, and the one
   person who could catch it wrong -- the author -- is the one person who
   never sees the result. So the meaning is settled before the post exists,
   and everything downstream is ordinary translation of a sentence a human
   confirmed. 「投稿する前に、ユーザーに翻訳として自然な形はどれ？って選んで
   もらって、他の人には表示だけされる形は？」

   Three things go out, and only the middle one needs anybody's judgement:

     the line, in the letters it is written in   the author's
     what it means                                the author's, confirmed
     the gloss, word by word                      the dictionary's

   The gloss is a lookup and costs nothing, so it is there the instant you
   stop typing, offline, before any of the rest exists.

   A post keeps a copy of what each of its words meant. Six months later the
   author may decide `mos` means red rather than tall, and the post still says
   what it said the day it was written -- which is what a thing somebody
   published IS. This is the same freezing a quote needs, so there is one
   function for it.

   Posts belong to the account rather than to a language: one person, one
   timeline, and several languages to write it in. Each post says which
   language it is in and carries its name at the time.
   ========================================================================= */

/* =========================================================================
   19. A post
   ========================================================================= */

var LS_POSTS='lingua.posts';
var POSTS=[];
function postsRead(){
  POSTS=[];
  try{
    var p=JSON.parse(localStorage.getItem(LS_POSTS)||'null');
    if(p && p.length) POSTS=p;
  }catch(e){}
}
postsRead();
function savePosts(){
  try{ localStorage.setItem(LS_POSTS, JSON.stringify(POSTS)); }catch(e){}
}
/* Newest first, which is the only order a timeline has. */
function postAll(){
  return POSTS.slice().sort(function(a, b){ return (b.at||0)-(a.at||0); });
}
function postById(id){
  var i;
  for(i=0;i<POSTS.length;i++) if(POSTS[i].id===id) return POSTS[i];
  return null;
}

/* ---- the gloss ----------------------------------------------------------
   Every word of the line, with what it means and what part of speech it is,
   read straight out of the dictionary. No server, no model, no waiting: this
   is the part that is just looking things up, and it is most of what a reader
   needs. A word the dictionary has never heard of comes back as itself, which
   is the truth about it. */
function postGloss(ln){
  var words=String(ln||'').split(/\s+/), out=[], i, w;
  for(i=0;i<words.length;i++){
    if(!words[i]) continue;
    w=findWord(words[i]);
    out.push(w? {w:words[i], m:wMns(w)[0]||'', p:w.pos||''}
               : {w:words[i], m:'', p:''});
  }
  return out;
}
/* What the gloss reads as, run together. This is what the meaning field is
   filled with before anybody types: it is never the right sentence and it is
   always the right words, so the work left is arranging them. */
function postGlossLine(gl){
  var out=[], i;
  for(i=0;i<gl.length;i++) out.push(gl[i].m || gl[i].w);
  return out.join(' ');
}

/* ---- writing one -------------------------------------------------------- */
var PW={ln:'', mn:''};
function pwBlank(){ return {ln:'', mn:'', to:''}; }
function openPost(){
  openForm('post:', t('post.new'), pwHTML());
}
FORM_OPEN.post=function(){ openPost(); };
/* Word by word, and the row is always there even when it is empty, so the
   one thing that changes as you type has somewhere to be put. */
function pwGlossHTML(){
  return postGloss(PW.ln).map(function(g){
    return '<span class="pwg'+(g.m? '':' none')+'">'+esc(g.m || g.w)+'</span>';
  }).join('');
}
function pwHTML(){
  var to=PW.to? postById(PW.to) : null;
  return (to? '<div class="pwto">'+esc(t('post.re', to.lname||''))+'</div>' : '')+
    '<div class="pwtop"><div class="pav">'+
      postFace({lname:langName})+'</div>'+
    '<div class="pwfield"><input id="pw-ln" value="'+esc(PW.ln)+'" '+
      'placeholder="'+esc(t('post.ln.ph'))+'" autocapitalize="none" '+
      'autocorrect="off" spellcheck="false"' + IN('pwSetLn') + '>'+
      '<div class="pwgl" id="pw-gl">'+pwGlossHTML()+'</div></div></div>'+
    '<div class="sec">'+esc(t('post.mn'))+'</div>'+
    '<div class="field"><input id="pw-mn" value="'+esc(PW.mn)+'" '+
      'placeholder="'+esc(postGlossLine(postGloss(PW.ln)))+'"' + IN('pwSetMn') + '></div>'+
    '<button class="btn" style="width:100%;margin-top:14px"' + DO('pwSend') + '>'+
      esc(t('post.send'))+'</button>';
}
/* Typing patches the one thing that changed and nothing else: rebuilding the
   body would put the caret back at the end of the field on every letter.

   But openForm() keeps the body as a STRING, so a screen that only patches
   the document is a screen whose form goes stale the moment anything calls
   render() -- come back from the card and the line you were typing is gone.
   So the string is kept in step too, without redrawing anything. */
function pwFresh(){ if(FORM && FORM.key==='post:') FORM.html=pwHTML(); }
function pwSetLn(v){
  PW.ln=String(v||'');
  var g=document.getElementById('pw-gl');
  if(g) g.innerHTML=pwGlossHTML();
  var m=document.getElementById('pw-mn');
  if(m) m.setAttribute('placeholder', postGlossLine(postGloss(PW.ln)));
  pwFresh();
}
function pwSetMn(v){ PW.mn=String(v||''); pwFresh(); }
/* Posting. The meaning is what was typed, or the gloss run together if
   nothing was -- never empty, because a line nobody can read is not a post. */
function pwSend(){
  var ln=String(PW.ln||'').trim();
  if(!ln){ toast(t('post.none')); return; }
  var gl=postGloss(ln);
  var mine={id:'p'+Date.now()+'_'+POSTS.length, at:Date.now(),
            lang:langId, lname:langName||'',
            ln:ln, mn:String(PW.mn||'').trim() || postGlossLine(gl),
            ui:uiLang(), gl:gl, li:0, bo:0, re:0};
  if(PW.to){
    mine.to=PW.to;
    var up=postById(PW.to);
    if(up){ up.re=(up.re||0)+1; }
  }
  POSTS.push(mine);
  savePosts();
  PW=pwBlank();
  goTab('feed');
}

/* ---- reading one -------------------------------------------------------
   A timeline is the one screen in this app where being unfamiliar is worth
   nothing at all, so this is the row everybody's thumb already knows: the
   face, the name in bold with the handle and the time in grey beside it, the
   post, and four things spread along the bottom. Not the app's serif and gold
   -- those belong to the book side, and a feed that looks like a book looks
   like something you have to learn. 「TwitterとかXと同じように作って」

   What is INSIDE the row is this app's and nothing else's: three layers, the
   line as it was written, what its author says it means, and the gloss word
   by word. That is the reason to read a stranger's post at all.

   Every one of the four works. There is no server, so a like is a like on
   this phone -- kept, counted, and the first thing that syncs when there is
   one. A row of buttons that do nothing is what this app already got wrong
   once at the bottom of a screen. */
function postWhen(at){
  var s=Math.floor((Date.now()-(at||0))/1000);
  if(s<60) return t('when.now');
  if(s<3600) return t('when.m', Math.floor(s/60));
  if(s<86400) return t('when.h', Math.floor(s/3600));
  return t('when.d', Math.floor(s/86400));
}
/* Until there are accounts, the language is who you are -- so it is the name,
   and the handle is what it is called with the spaces taken out. */
function postHandle(p){
  return '@'+String(p.lname||'').toLowerCase().replace(/[^a-z0-9]+/g, '');
}
/* The face is a letter of the language the post is written in. It is the one
   picture this app has of anybody, and a better one than an initial. */
function postFace(p){
  var l=null, i;
  for(i=0;i<LETTERS.length;i++) if(ltHasShape(LETTERS[i])){ l=LETTERS[i]; break; }
  if(l && l.st && l.st.length) return '<canvas class="tc" data-l="'+esc(l.id)+'"></canvas>';
  if(l && l.ch) return '<span class="bch">'+esc(l.ch)+'</span>';
  return '<span class="bch">'+esc(String(p.lname||'?').charAt(0))+'</span>';
}
function postAct(fn, id, icon, n, on){
  return '<button class="pact'+(on? ' on':'')+'"' + DO(fn, [id]) + '>'+icon+
    '<span class="pn">'+(n? String(n) : '')+'</span></button>';
}
function postRow(p){
  return '<div class="post">'+
    '<div class="pav">'+postFace(p)+'</div>'+
    '<div class="pbody">'+
      '<div class="phead">'+
        '<span class="pname">'+esc(p.lname||'')+'</span>'+
        '<span class="phandle">'+esc(postHandle(p))+'</span>'+
        '<span class="pdot">·</span>'+
        '<span class="pwhen">'+esc(postWhen(p.at))+'</span>'+
        '<button class="pmore"' + DO('postDel', [p.id]) + ' aria-label="'+
          esc(t('post.del'))+'">'+ICON_DOTS+'</button>'+
      '</div>'+
      '<div class="pline'+(myFontOn()? ' sfont':'')+'">'+esc(p.ln)+'</div>'+
      '<div class="pmn">'+esc(p.mn)+'</div>'+
      '<div class="pgl">'+(p.gl||[]).map(function(g){
        return '<span class="pwg'+(g.m? '':' none')+'">'+esc(g.m || g.w)+'</span>';
      }).join('')+'</div>'+
      '<div class="pacts">'+
        postAct('postReply', p.id, ICON_REPLY, (p.re||0), false)+
        postAct('postBoost', p.id, ICON_BOOST, (p.bo||0), !!p.bome)+
        postAct('postLike',  p.id, ICON_HEART, (p.li||0), !!p.lime)+
        postAct('postCard',  p.id, ICON_CARD,  0, false)+
      '</div>'+
    '</div></div>';
}
/* A like is a like on this phone. It is kept and counted, and it is the first
   thing that will have somewhere else to go when there is a server. */
function postLike(id){
  var p=postById(id);
  if(!p) return;
  p.lime=!p.lime;
  p.li=Math.max(0, (p.li||0)+(p.lime? 1 : -1));
  savePosts(); render();
}
function postBoost(id){
  var p=postById(id);
  if(!p) return;
  p.bome=!p.bome;
  p.bo=Math.max(0, (p.bo||0)+(p.bome? 1 : -1));
  savePosts(); render();
}
/* Replying opens the same screen a post is written on, holding on to what it
   is a reply TO. */
function postReply(id){
  var p=postById(id);
  if(!p) return;
  PW=pwBlank(); PW.to=id;
  openPost();
}
/* A post as a picture, which is the one way any of this leaves the app. */
function postCard(id){
  var p=postById(id);
  if(p) cardOpen('p', id);
}
function postDel(id){
  if(!confirm(t('post.del.q'))) return;
  var i;
  for(i=0;i<POSTS.length;i++) if(POSTS[i].id===id){ POSTS.splice(i, 1); break; }
  savePosts(); render();
}
