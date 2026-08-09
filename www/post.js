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
/* The thing that finishes it goes in the top bar, filled, where every phone
   puts it -- not at the foot of a screen you have to scroll to. */
function openPost(){
  openForm('post:', t('post.new'), pwHTML(), null,
    '<button class="navdo"' + DO('pwSend') + '>'+esc(t('post.send'))+'</button>');
}
FORM_OPEN.post=function(){ openPost(); };
/* Word by word, and the row is always there even when it is empty, so the
   one thing that changes as you type has somewhere to be put. */
/* What the meaning field starts as, and what its placeholder says: the gloss
   run together. It was worked out in three places and they have to agree --
   what you are offered has to be what you get if you type nothing. */
function pwMn(){ return postGlossLine(postGloss(PW.ln)); }
/* And the row of it, which is drawn once when the screen is built and again
   on every letter typed. */
function pwGl(){ return postGlossHTML(postGloss(PW.ln)); }
function pwHTML(){
  var to=PW.to? postById(PW.to) : null;
  /* Whom you are replying to is on the post you pressed reply on. It read the
     account here, so every reply said you were replying to yourself. */
  return (to? '<div class="pwto">'+
      esc(t('post.re', '@'+(to.hd || to.who || to.lname || '')))+'</div>' : '')+
    /* The face you are about to post under, which is the one this post will
       carry -- worked out here, on the making side, where the letters are. */
    '<div class="pwtop"><div class="pav">'+
      postFace({who:meName(), lname:langName, av:postAvatar()})+'</div>'+
    '<div class="pwfield">'+
      kbFieldHTML('pw-ln', t('post.ln.ph'), ' value="'+esc(PW.ln)+'"'+IN('pwSetLn'))+
      '<div class="pwgl" id="pw-gl">'+pwGl()+'</div>'+
      /* The meaning sits in the same column as the line, in the same
         borderless field, because it is the second half of the same act. */
      '<input id="pw-mn" class="pwmn" value="'+esc(PW.mn)+'" '+
        'placeholder="'+esc(pwMn() || t('post.mn'))+'"' +
        IN('pwSetMn') + '>'+
      '</div></div>';
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
  if(g) g.innerHTML=pwGl();
  var m=document.getElementById('pw-mn');
  if(m) m.setAttribute('placeholder', pwMn());
  pwFresh();
}
function pwSetMn(v){ PW.mn=String(v||''); pwFresh(); }
/* Posting. The meaning is what was typed, or the gloss run together if
   nothing was -- never empty, because a line nobody can read is not a post. */
function pwSend(){
  var ln=String(PW.ln||'').trim();
  if(!ln){ toast(t('post.none')); return; }
  var gl=postGloss(ln);
  /* Everything a reader needs is put ON the post, now, because the reader may
     not be here and may not have this language: who wrote it, what they are
     called, what it is written in, and a face. A timeline that asks the open
     language who wrote a post answers "me" for everybody. */
  var mine={id:'p'+Date.now()+'_'+POSTS.length, at:Date.now(),
            lang:langId, lname:langName||'',
            who:meName(), hd:meHandle(), av:postAvatar(), mine:true,
            ln:ln, ink:postInk(ln),
            mn:String(PW.mn||'').trim() || postGlossLine(gl),
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

/* The face a post carries: one letter of the language it is written in, cut
   loose from that language so it survives being read on somebody else's
   phone. A shape, not a reference. */
function postAvatar(){
  var i, l;
  /* A photo if there is one. It travels on the post like the letter does,
     for the same reason: whoever reads it has neither this person's camera
     roll nor their alphabet. */
  if(ME.pic) return {pic:ME.pic};
  for(i=0;i<LETTERS.length;i++){
    l=LETTERS[i];
    if(l.st && l.st.length) return {st:l.st};
    if(l.ch) return {ch:l.ch};
  }
  return null;
}
/* ---- the line, cut into the shapes it is written with -----------------
   The face has travelled on the post since the day the timeline was written,
   because a reader has neither this person's camera roll nor their alphabet.
   The line had not, and it is the same sentence: a post is somebody else's
   language, and reading somebody else's letters is most of the reason to
   look at a timeline at all.

   The line's text stays as it is -- it is what the gloss is built from and
   what a search would look through. What is added is the ink: the same line,
   already cut into letters, with each letter's strokes ON it.

   Cutting has to happen here because it cannot happen there. The reader has
   no alphabet to cut with, so `ka` would be k then a on their phone and one
   letter on this one. The cut travels with the shapes.

   Longest name first, for the same reason the font's ligatures are sorted
   that way: a letter called `ka` must be found before the letter called `k`,
   or nothing longer than one character is ever drawn. */
function postCut(ln){
  var names=[], i, l, n;
  for(i=0;i<LETTERS.length;i++){
    l=LETTERS[i];
    if(!l.st || !l.st.length) continue;
    n=String(ltName(l)||'');
    if(!n) continue;
    names.push({n:n, st:l.st});
  }
  names.sort(function(a, b){ return b.n.length-a.n.length; });
  var s=String(ln||''), out=[], txt='', at=0, j, hit;
  while(at<s.length){
    hit=null;
    for(j=0;j<names.length;j++)
      if(s.substr(at, names[j].n.length)===names[j].n){ hit=names[j]; break; }
    if(!hit){ txt+=s.charAt(at); at++; continue; }
    if(txt){ out.push({t:txt}); txt=''; }
    out.push({st:hit.st});
    at+=hit.n.length;
  }
  if(txt) out.push({t:txt});
  return out;
}
/* The same cut, filed so a letter used twelve times travels once. `g` is the
   shapes, `s` is the line: a number is an index into `g`, a string is itself
   -- a space, a full stop, a character somebody borrowed rather than drew. */
function postInk(ln){
  var cut=postCut(ln), g=[], s=[], seen=[], i, k, key;
  for(i=0;i<cut.length;i++){
    if(cut[i].t!==undefined){ s.push(cut[i].t); continue; }
    key=JSON.stringify(cut[i].st);
    k=seen.indexOf(key);
    if(k<0){ k=g.length; g.push(cut[i].st); seen.push(key); }
    s.push(k);
  }
  if(!g.length) return null;   /* nothing drawn in it: the text is the post */
  return {g:g, s:s};
}
/* Posts written before a post carried its author. They are all this person's,
   because there was nowhere else for one to come from. */
function migratePosts(){
  var i, n=0;
  for(i=0;i<POSTS.length;i++){
    if(POSTS[i].who!==undefined) continue;
    POSTS[i].who=meName(); POSTS[i].hd=meHandle();
    POSTS[i].mine=true; POSTS[i].av=postAvatar();
    n++;
  }
  if(n) savePosts();
}
/* And posts written before a post carried its ink. Only the ones written in
   the language that is open can be cut, because they are the only ones this
   phone has the letters for -- so this is not once, it is once per language,
   and a post it cannot reach yet keeps `ink` undefined and is picked up on
   the day that language is opened. Cutting somebody's post with the wrong
   alphabet is the one outcome worth going to this trouble to avoid. */
function migratePostInk(){
  var i, p, n=0;
  for(i=0;i<POSTS.length;i++){
    p=POSTS[i];
    if(p.ink!==undefined) continue;
    if(!p.mine || p.lang!==langId) continue;
    p.ink=postInk(p.ln);
    n++;
  }
  if(n) savePosts();
}

/* ==== below this line a post renders from the post ====
   Nothing here may ask the open language, the open dictionary, the drawn
   letters or the account anything. A post is read by people who do not have
   any of those -- that is the whole point of a timeline -- and every one of
   these was wrong when this was written:

     the face was the OPEN language's first letter, on everybody's post
     the name and handle were the account's, on everybody's post
     the line wore MY font, on everybody's post

   All three are invisible while every post is yours and all three are
   catastrophic the day one is not. tools/sides-check.mjs holds the line.
   ===================================================================== */

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
/* All of it comes off the post. Renaming yourself does not rewrite old posts,
   which is the price of a timeline that can hold anybody else's. */
/* The face the post carries, drawn from the shape ON it. A letter of the
   language it is written in is the one picture this app has of anybody, and
   a better one than an initial -- but it has to travel with the post. */
/* What to call whoever wrote it: their name, or failing that the language's,
   which is what stood in before there were accounts. The face and the head of
   the row both need it and they were answering it separately. */
function postWho(p){ return String((p && (p.who || p.lname)) || ''); }
/* The gloss, word by word. The composer shows the same row while you type --
   it is the same thing, so it is drawn by the same six lines. A word the
   dictionary does not know stands in the colour of a problem. */
function postGlossHTML(gl){
  return (gl||[]).map(function(g){
    return '<span class="pwg'+(g.m? '':' none')+'">'+esc(g.m || g.w)+'</span>';
  }).join('');
}
var PFACE={};
function postFace(p){
  var av=p && p.av, k;
  if(av && av.st && av.st.length){
    k=String((p && p.id) || 'me');
    PFACE[k]=av.st;
    return '<canvas class="tcp" data-p="'+esc(k)+'"></canvas>';
  }
  if(av && av.pic) return '<img class="bpic" src="'+esc(av.pic)+'" alt="">';
  if(av && av.ch) return '<span class="bch">'+esc(av.ch)+'</span>';
  return '<span class="bch">'+esc((postWho(p)||'?').charAt(0))+'</span>';
}
/* The strokes are drawn by the one function that draws strokes -- the same
   ink as the keyboard, the tiles and the card. What is different here is
   only where they came FROM: the post, not LETTERS. */
function postFaces(){
  inkCanvases('canvas.tcp', 40, 34, function(c){
    return PFACE[c.getAttribute('data-p')] || null;
  });
}
function postAct(fn, id, icon, n, on){
  return '<button class="pact'+(on? ' on':'')+'"' + DO(fn, [id]) + '>'+icon+
    '<span class="pn">'+(n? String(n) : '')+'</span></button>';
}
/* The line, drawn. Each letter is a canvas of the strokes the post carries,
   so a post in a language this phone has never seen is still in that
   language's letters -- which is most of the reason to look at a timeline.
   Anything the writer's alphabet had no shape for -- a space, a full stop, a
   character they borrowed rather than drew -- is text, and stays text.

   A post with no ink is text. That is every post written before this, and
   every post whose language is written in borrowed characters, and both are
   right: there is nothing to draw.

   It is one canvas per letter rather than one per line so that a long post
   wraps the way any other line of text wraps. */
var PLINE={};
function postLnHTML(p){
  if(!p || !p.ink || !p.ink.s || !p.ink.s.length) return esc(String((p && p.ln)||''));
  var out='', i, x, k;
  for(i=0;i<p.ink.s.length;i++){
    x=p.ink.s[i];
    if(typeof x!=='number'){ out+=esc(String(x)); continue; }
    k=String((p.id)||'p')+'_'+i;
    PLINE[k]=p.ink.g[x];
    out+='<canvas class="tcln" data-p="'+esc(k)+'"></canvas>';
  }
  return out;
}
function postLines(){
  inkLine('canvas.tcln', function(c){
    return PLINE[c.getAttribute('data-p')] || null;
  });
}
function postRow(p){
  return '<div class="post">'+
    '<div class="pav">'+postFace(p)+'</div>'+
    '<div class="pbody">'+
      '<div class="phead">'+
        '<span class="pname">'+esc(postWho(p))+'</span>'+
        (p.lname? '<span class="plangtag">'+esc(p.lname)+'</span>' : '')+
        '<span class="phandle">@'+esc(p.hd||'')+'</span>'+
        '<span class="pdot">·</span>'+
        '<span class="pwhen">'+esc(postWhen(p.at))+'</span>'+
        (p.mine? '<button class="pmore"' + DO('postDel', [p.id]) + ' aria-label="'+
          esc(t('post.del'))+'">'+ICON_DOTS+'</button>' : '')+
      '</div>'+
      /* It used to be text wearing MY font, and only ever on my own post,
         because my font is the font of MY language and putting it on
         somebody else's line drew their words in my shapes. Now the shapes
         are on the post, so there is no font to put on anything and no
         reason to treat my own post differently from anybody's. */
      '<div class="pline">'+postLnHTML(p)+'</div>'+
      '<div class="pmn">'+esc(p.mn)+'</div>'+
      '<div class="pgl">'+postGlossHTML(p.gl)+'</div>'+
      '<div class="pacts">'+
        postAct('postReply', p.id, ICON_REPLY, (p.re||0), false)+
        postAct('postBoost', p.id, ICON_BOOST, (p.bo||0), !!p.bome)+
        postAct('postLike',  p.id, ICON_HEART, (p.li||0), !!p.lime)+
        /* A card is drawn out of a dictionary and a set of letters, so it can
           only be made of a post whose language is here. */
        (p.mine? postAct('postCard', p.id, ICON_CARD, 0, false) : '')+
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
