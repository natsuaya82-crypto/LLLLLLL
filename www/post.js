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
function pwBlank(){ return {ln:'', mn:''}; }
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
  return '<div class="pwtop"><div class="pav">'+
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
  POSTS.push({id:'p'+Date.now()+'_'+POSTS.length, at:Date.now(),
              lang:langId, lname:langName||'',
              ln:ln, mn:String(PW.mn||'').trim() || postGlossLine(gl),
              ui:uiLang(), gl:gl});
  savePosts();
  PW=pwBlank();
  goTab('feed');
}

/* ---- reading one -------------------------------------------------------
   The shape everybody already knows: a face on the left, who and when on one
   line, the post under it, and what you can do with it along the bottom.
   Nothing here is invented, because a timeline is the one screen in this app
   where being unfamiliar is worth nothing at all.

   What is inside that shape is not Twitter's: three layers rather than one --
   the line as it was written, what it means, and the gloss word by word. The
   third is what somebody who makes languages came for and the reason to read
   a stranger's post at all.

   Only the things that work are along the bottom. There are no likes and no
   replies here because there is no server, and a row of buttons that do
   nothing is the thing this app already got wrong once at the bottom of a
   screen. */
function postWhen(at){
  var s=Math.floor((Date.now()-(at||0))/1000);
  if(s<60) return t('when.now');
  if(s<3600) return t('when.m', Math.floor(s/60));
  if(s<86400) return t('when.h', Math.floor(s/3600));
  return t('when.d', Math.floor(s/86400));
}
/* The face is a letter of the language the post is written in, because that
   is the one picture this app has of anybody. */
function postFace(p){
  var l=null, i;
  for(i=0;i<LETTERS.length;i++) if(ltHasShape(LETTERS[i])){ l=LETTERS[i]; break; }
  if(l && l.st && l.st.length) return '<canvas class="tc" data-l="'+esc(l.id)+'"></canvas>';
  if(l && l.ch) return '<span class="bch">'+esc(l.ch)+'</span>';
  return '<span class="bch">'+esc(String(p.lname||'?').charAt(0))+'</span>';
}
function postRow(p){
  return '<div class="post">'+
    '<div class="pav">'+postFace(p)+'</div>'+
    '<div class="pbody">'+
      '<div class="phead"><span class="pname">'+esc(p.lname||'')+'</span>'+
        '<span class="pwhen">'+esc(postWhen(p.at))+'</span></div>'+
      '<div class="pline'+(myFontOn()? ' sfont':'')+'">'+esc(p.ln)+'</div>'+
      '<div class="pmn">'+esc(p.mn)+'</div>'+
      '<div class="pgl">'+(p.gl||[]).map(function(g){
        return '<span class="pwg'+(g.m? '':' none')+'">'+esc(g.m || g.w)+'</span>';
      }).join('')+'</div>'+
      '<div class="pacts">'+
        '<button class="pact"' + DO('postCard', [p.id]) + ' aria-label="'+
          esc(t('card.title'))+'">'+ICON_CARD+'</button>'+
        '<button class="pact"' + DO('postDel', [p.id]) + ' aria-label="'+
          esc(t('post.del'))+'">'+ICON_CROSS+'</button>'+
      '</div>'+
    '</div></div>';
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
