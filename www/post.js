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
/* A failed write used to be swallowed here, and it was survivable while a
   post was a line of text: a hundred of them are a few kilobytes and storage
   does not run out. A post can carry a photograph now, so it can, and a
   timeline that silently stops saving is a timeline that loses whatever was
   written after it filled up.

   It says so instead. Nothing is deleted to make room -- pruning somebody's
   own posts to fit one more is exactly what docs/DATA_SAFETY.md forbids. */
function savePosts(){
  try{ localStorage.setItem(LS_POSTS, JSON.stringify(POSTS)); return true; }
  catch(e){ toast(t('post.full')); return false; }
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
function pwBlank(){ return {ln:'', mn:'', to:'', pic:''}; }
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
/* ---- a photograph on a post -------------------------------------------

   The long edge, and how hard it is squeezed. A photograph is stored as text
   in the same localStorage the LANGUAGE lives in, so these two numbers are a
   data-safety question before they are a picture-quality one:

     900px, q0.72   about 65 KB, and about 87 KB once it is text
     a whole free language                              about 25 KB

   One photograph is three and a half languages. That is the reason for the
   budget below rather than for a smaller number here -- 900px is already the
   point where a phone screen stops being able to tell. */
var POST_PIC=900, POST_PICQ=0.72;
/* What the timeline may take up. localStorage is one allowance shared by the
   posts and by every slice of the language, so a timeline with no ceiling can
   make somebody's LANGUAGE unsaveable -- and the language is the thing this
   app cannot replace. Two megabytes is about twenty photographs and leaves
   room for a five-thousand-word language several times over.

   When it is full the PHOTOGRAPH is refused, never the post and never
   anything already written. Nothing is pruned to make room. */
var POST_BYTES=2*1024*1024;
function pwPicRoom(url){
  var n=0;
  try{ n=String(localStorage.getItem(LS_POSTS)||'').length; }catch(e){}
  return (n + String(url||'').length) < POST_BYTES;
}
function pwSetPic(){
  var el=document.getElementById('pw-pic'), f=el && el.files && el.files[0];
  if(!f) return;
  var r=new FileReader();
  r.onload=function(){ pwPicKeep(String(r.result||'')); };
  r.onerror=function(){ toast(t('post.pic.bad')); };
  r.readAsDataURL(f);
}
/* Not cropped. A face is shown in a circle so the sides of a landscape photo
   were never going to be seen; a post shows the picture, so what was taken is
   what goes up. Only the long edge is brought down. */
function pwPicKeep(url){
  var im=new Image();
  im.onload=function(){
    var k=Math.min(1, POST_PIC/Math.max(im.width, im.height));
    var c=document.createElement('canvas'), x, out;
    c.width=Math.round(im.width*k); c.height=Math.round(im.height*k);
    x=c.getContext('2d');
    x.drawImage(im, 0, 0, c.width, c.height);
    try{ out=c.toDataURL('image/jpeg', POST_PICQ); }
    catch(e){ toast(t('post.pic.bad')); return; }
    if(!pwPicRoom(out)){ toast(t('post.pic.full')); return; }
    PW.pic=out; openPost();
  };
  im.onerror=function(){ toast(t('post.pic.bad')); };
  im.src=url;
}
function pwDropPic(){ PW.pic=''; openPost(); }
function pwPicHTML(){
  return '<div class="pwpicrow">'+
    (PW.pic? '<img class="pwpic" src="'+esc(PW.pic)+'" alt="">' : '')+
    '<label class="btn ghost picpick">'+esc(t(PW.pic? 'post.pic.again' : 'post.pic'))+
      '<input type="file" id="pw-pic" accept="image/*"' + CH('pwSetPic') + '></label>'+
    (PW.pic? '<button class="btn ghost"' + DO('pwDropPic') + '>'+esc(t('post.pic.drop'))+'</button>' : '')+
    '</div>';
}
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
      lnField('pw-ln', t('post.ln.ph'), ' maxlength="'+POST_MAX+'"'+IN('pwSetLn'), PW.ln)+
      '<div class="pwgl" id="pw-gl">'+pwGl()+'</div>'+
      '<div id="pw-left">'+pwLeftHTML()+'</div>'+
      /* The meaning sits in the same column as the line, in the same
         borderless field, because it is the second half of the same act. */
      '<input id="pw-mn" class="pwmn" value="'+esc(PW.mn)+'" '+
        'placeholder="'+esc(pwMn() || t('post.mn'))+'"' +
        IN('pwSetMn') + '>'+
      pwPicHTML()+
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
  lnGrow('pw-ln');
  pwLeftPaint();
  pwFresh();
}
/* How long a post may be. There was no answer at all: the field was one row
   of an input, so a line ran off the side of the phone and kept going for as
   long as somebody kept typing. 「ツイートの文字数制限決めないと無限になってる」

   Two hundred and eighty, which is the number the shape of this screen was
   borrowed from. It is a made language and its words are short; nobody has
   met this yet and the point is that it exists. */
var POST_MAX=280;
/* Shown only near the end, the way every composer does it -- a counter on
   screen from the first letter is a scold. Numbers only, so there is nothing
   in it to translate. */
function pwLeftHTML(){
  var left=POST_MAX-String(PW.ln||'').length;
  if(left>40) return '';
  return '<span class="pwleft'+(left<=0? ' bad':'')+'">'+left+'</span>';
}
function pwLeftPaint(){
  var e=document.getElementById('pw-left');
  if(e) e.innerHTML=pwLeftHTML();
}
function pwSetMn(v){ PW.mn=String(v||''); pwFresh(); }
/* Posting. The meaning is what was typed, or the gloss run together if
   nothing was -- never empty, because a line nobody can read is not a post. */
function pwSend(){
  var ln=String(PW.ln||'').trim();
  if(!ln){ toast(t('post.none')); return; }
  /* Only to fall back on: the words run together, for somebody who typed a
     line and no meaning. Not stored -- see postRow. */
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
            ui:uiLang(), li:0, bo:0, re:0};
  if(PW.pic) mine.pic=PW.pic;
  /* The natural language, translated once, here, and carried. It is asked
     for and NOT waited on: the post is pushed either way, and a translation
     that arrives late lands on a post that already exists. A post that
     cannot be published until a machine answers is a post a machine can
     lose. */
  postTr(mine.mn, mine.ui, function(tr){
    if(tr && typeof tr==='object'){ mine.tr=tr; savePosts(); render(); }
  });
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

/* ---- what a post says, and what it says in YOUR words ------------------

   Three layers, and only the third is new.

     1  the writer's own letters      ln + ink        already on the post
     2  what it means, in a natural   mn + tr         mn is already on it
        language
     3  the same thing in the         built from      here
        READER's own language          THIS dictionary

   Layer 2 is translated WHEN THE POST IS WRITTEN, not when it is read, and
   the translations travel on the post. A post written in Japanese reaches an
   English reader in English without anybody's phone asking anything of the
   network at read time -- which is the whole point, because a timeline is
   read far more often than it is written.

   TR_SEAM: the translator is the reader's own device AI, borrowed at the
   moment of posting. There is no key of ours and no service of ours, so
   there is nothing to pay per post and nothing that can leak. Until it is
   wired up, postTr() answers nothing, `tr` is simply absent, and every
   reader sees the natural language the author typed -- which is what happens
   today and is not a failure. Same shape as AI_SEAM in www/glyph.js. */
function postTr(mn, from, done){
  /* TR_SEAM — hand `mn` to the device's own translator and call done() with
     { <lang code>: <text>, … }. Nothing here yet; posting does not wait on
     it and never will, because a post that cannot be published until a
     machine answers is a post that can be lost by a machine not answering. */
  done(null);
}
/* What a post says to the person reading it: their own language if the post
   carries it, and otherwise the one the author typed. Never empty -- a line
   nobody can read is not a post. */
function postSay(p){
  if(!p) return '';
  var u=uiLang();
  if(p.tr && typeof p.tr==='object' && p.tr[u]) return String(p.tr[u]);
  return String(p.mn||'');
}

/* ---- layer three: the post, in words this reader has -------------------

   This is the one place in the app where the reading side is SUPPOSED to
   reach for the making side, and it is worth being exact about why.

   Rule 8 forbids drawing somebody else's post out of my dictionary, because
   their line is theirs. This is the opposite errand: it takes a natural
   sentence THE AUTHOR ALREADY CONFIRMED and says it again in MY language,
   with MY words. The guessing is about my own vocabulary, and I am the one
   who can see when it is wrong -- which is exactly the test the note at the
   head of this file applies to machine translation of an invented language.

   So it lives above the line, it touches `mn`/`tr` and never `ln` or `ink`,
   and it is deliberately NOT frozen onto the post: a sentence that half
   renders today renders whole next month, because the dictionary grew. That
   is the opposite of `ink` and it is correct for the same reason `ink` is --
   ink is the writer's and this is the reader's.

   Word order is left alone. Rearranging a sentence needs to know which word
   is the subject and which the object, and nothing here knows; a wrong
   rearrangement reads as a claim about the language rather than as a gap. */
function trWord(w){
  var i, j, mns, q=String(w||'').toLowerCase().replace(/^[^\w']+|[^\w']+$/g, '');
  if(!q) return null;
  for(i=0;i<WORDS.length;i++){
    mns=wMns(WORDS[i]);
    for(j=0;j<mns.length;j++) if(String(mns[j]).toLowerCase()===q) return WORDS[i];
  }
  /* then a meaning that merely contains it, so "a mountain" finds `mountain` */
  for(i=0;i<WORDS.length;i++){
    mns=wMns(WORDS[i]);
    for(j=0;j<mns.length;j++)
      if((' '+String(mns[j]).toLowerCase()+' ').indexOf(' '+q+' ')>=0) return WORDS[i];
  }
  return null;
}
/* Each piece of the sentence: a word of mine, or the natural word I have no
   word for. The second is the point as much as the first -- a red word is a
   word this language is missing, and it is the shortest door there is to
   making it. */
function trUnits(mn){
  var out=[], a=String(mn||'').split(/(\s+)/), i, w;
  for(i=0;i<a.length;i++){
    if(!a[i]) continue;
    if(/^\s+$/.test(a[i])){ out.push({sp:true}); continue; }
    w=trWord(a[i]);
    out.push(w? {w:String(w.hw)} : {miss:a[i]});
  }
  return out;
}
var TR_FREE_DAILY=3;
/* Its own day and its own counter. Sharing AI_FREE_DAILY would mean asking
   the word sheet for a spelling costs you a reading of somebody's post,
   which is two prices for one purchase. */
function trToday(){ var d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function trUsed(){ if(SET.trDate!==trToday()){ SET.trDate=trToday(); SET.trN=0; save(); } return SET.trN||0; }
function trLeft(){ return can('tr')? Infinity : Math.max(0, TR_FREE_DAILY-trUsed()); }
function trSpend(){ if(can('tr')) return; SET.trDate=trToday(); SET.trN=trUsed()+1; save(); }
/* Which posts have been turned into this language, this session. It is not
   stored: it is a way of looking at a post, not a fact about one. */
var TURNED={};
function trOpen(id){
  if(TURNED[id]) return;
  if(trLeft()<=0){ go('plans'); toast(t('tr.out')); return; }
  trSpend(); TURNED[id]=1; render();
}
function trHTML(p){
  if(!TURNED[p.id]) return '';
  var u=trUnits(postSay(p));
  return '<div class="ptr'+(myFontOn()?' sfont':'')+'">'+u.map(function(x){
    if(x.sp) return ' ';
    if(x.w) return '<span class="trw">'+esc(wOut(x.w))+'</span>';
    /* Red, and not a button. It was one -- press the gap, go and make the
       word -- which is a nice idea, an unasked-for one, and a 19pt target in
       the middle of a sentence. What was asked for was that the gap be
       obvious. 「自然言語のまま残して赤文字とかにする。この単語ないのが
       わかりやすいように」 */
    return '<span class="trmiss">'+esc(x.miss)+'</span>';
  }).join('')+'</div>';
}
function trBtnHTML(p){
  if(TURNED[p.id]) return '';
  var n=trLeft();
  return '<button class="trgo"' + DO('trOpen', [p.id]) + '>'+ICON_LINE+t('tr.go')+
    (n===Infinity? '' : '<span class="trn">'+esc(t('tr.left', n))+'</span>')+'</button>';
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
/* Whether a post's ink can be drawn from at all, asked in ONE place.

   "Is there ink" is not the question and was the one being asked, in two
   places, differently. A post carrying `{}`, or `{g:[],s:[]}`, or an `s`
   pointing at an index `g` does not have, HAS ink and cannot be drawn from
   it -- and the two readers would have disagreed about which, the day one of
   them was wrong.

   Nothing here repairs anything. A post whose ink is wreckage is drawn as
   its text, which is exactly what a post with no ink has always been, and
   guessing at what the shapes were meant to be would be inventing somebody
   else's alphabet. */
function postInkOK(ink){
  var i, x;
  if(!ink || typeof ink!=='object') return false;
  if(Object.prototype.toString.call(ink.g)!=='[object Array]') return false;
  if(Object.prototype.toString.call(ink.s)!=='[object Array]') return false;
  if(!ink.g.length || !ink.s.length) return false;
  for(i=0;i<ink.s.length;i++){
    x=ink.s[i];
    if(typeof x==='string') continue;
    if(typeof x!=='number') return false;
    if(!(x>=0 && x<ink.g.length) || !ink.g[x]) return false;
  }
  return true;
}
function postLnHTML(p){
  if(!p || !postInkOK(p.ink)) return esc(String((p && p.ln)||''));
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
        (p.pin? '<span class="ppin">'+ICON_PIN+'</span>' : '')+
        (p.mine? '<button class="pmore"' + DO('postMore', [p.id]) + ' aria-label="'+
          esc(t('post.more'))+'">'+ICON_DOTS+'</button>' : '')+
      '</div>'+
      /* It used to be text wearing MY font, and only ever on my own post,
         because my font is the font of MY language and putting it on
         somebody else's line drew their words in my shapes. Now the shapes
         are on the post, so there is no font to put on anything and no
         reason to treat my own post differently from anybody's. */
      '<div class="pline">'+postLnHTML(p)+'</div>'+
      (p.pic? '<img class="ppic" src="'+esc(p.pic)+'" alt="">' : '')+
      /* The natural language, always. In the reader's own if the post carries
         it, and in the author's if it does not -- which is every post until
         the translator is wired up, and is not a failure. */
      '<div class="pmn">'+esc(postSay(p))+'</div>'+
      /* Three layers, and there is no fourth.

           the writer's own letters      ln + ink
           the language you read in      mn, or tr[yours] if the post has it
           your own language             on a button

         A word-by-word gloss used to sit here. It said the writer's word ->
         the writer's meaning; the layer below says the meaning -> MY word.
         Both are lists of words, so side by side they read as one list that
         keeps changing its mind.
         「その人の言語／表示言語／自分の言語／3層でいいやん」

         It is not written onto a post any more either. Nothing read it
         once the line was gone, and a field written and never read is what
         makes a codebase hard to read. The composer still shows one, where
         it is the writer checking their own line before it goes out -- which
         is the errand it was written for, and where the default meaning
         comes from.

         Posts made before this keep whatever is on them. Nothing goes and
         removes it: it is somebody's, and deleting what a person made
         because the current shape has no use for it is the one thing
         docs/DATA_SAFETY.md forbids outright. */
      trBtnHTML(p)+
      trHTML(p)+
      '<div class="pacts">'+
        postAct('postReply', p.id, ICON_REPLY, (p.re||0), false)+
        postAct('postBoost', p.id, ICON_BOOST, (p.bo||0), !!p.bome)+
        postAct('postLike',  p.id, ICON_HEART, (p.li||0), !!p.lime)+
        /* On every post, not only your own. The comment that used to be here
           said a card is drawn out of a dictionary and a set of letters, so it
           could only be made of a post whose language is here -- and that
           stopped being true the day cardPaint() started drawing a post from
           the post's own ink. A restriction protecting against a bug that is
           fixed, left standing after the fix.

           The icon says share rather than card because that is what pressing
           it is for: the card is the one way anything in this app leaves the
           phone. 「1番右のやつは何？共有ボタンに変えよう」 */
        postAct('postCard', p.id, ICON_SHARE, 0, false)+
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
/* The two things an author can do to their own post. It was one, and it was
   on the ... itself -- so the only thing that button could ever be was delete,
   and a delete reached by pressing something unlabelled is a delete waiting to
   be pressed by accident. 「ポストを削除、ポストを固定する、にしよう」 */
function postMore(id){
  var p=postById(id); if(!p || !p.mine) return;
  openForm('pmore:'+id, t('post.more'),
    '<button class="set"' + DO('postPin', [id]) + '><span class="sl">'+
      esc(t(p.pin? 'post.unpin' : 'post.pin'))+'</span></button>'+
    '<button class="set" style="border-bottom:none"' + DO('postDel', [id]) + '><span class="sl bad">'+
      esc(t('post.del'))+'</span></button>');
}
FORM_OPEN.pmore=function(id){ postMore(id||''); };
/* One at a time. A page with three things at the top of it has nothing at the
   top of it, and "which one is pinned" then has no answer. Pressing the one
   that is pinned takes it off. */
function postPin(id){
  var p=postById(id), was, i;
  if(!p || !p.mine) return;
  was=!!p.pin;
  for(i=0;i<POSTS.length;i++) if(POSTS[i].mine) delete POSTS[i].pin;
  if(!was) p.pin=1;
  savePosts();
  if(here().r==='form') back();
  render();
}
function postDel(id){
  if(!confirm(t('post.del.q'))) return;
  var i;
  for(i=0;i<POSTS.length;i++) if(POSTS[i].id===id){ POSTS.splice(i, 1); break; }
  savePosts();
  if(here().r==='form') back();
  render();
}
