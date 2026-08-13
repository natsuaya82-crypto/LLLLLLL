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
function pwBlank(){ return {ln:'', mn:'', to:'', pics:[]}; }
/* The thing that finishes it goes in the top bar, filled, where every phone
   puts it -- not at the foot of a screen you have to scroll to. */
function openPost(){
  openForm('post:', t(PW.ed? 'post.edit' : 'post.new'), pwHTML(), null,
    '<button class="navdo"' + DO('pwSend') + '>'+
      esc(t(PW.ed? 'post.save' : 'post.send'))+'</button>');
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
/* How many a post may carry. 「画像は4枚まで載せられる」
   Four is also four times easier to reach POST_BYTES with, which is why the
   room is asked for EACH one as it arrives rather than once at the end. */
var POST_PICS=4;
/* The pictures being written, each with the letters placed on it. A picture is
   {u: the photograph, marks: [...]} -- one object rather than two lists,
   because a picture and the letters on it are removed together and reordered
   together, and two lists are two chances to disagree about which is which. */
function pwPics(){ if(!PW.pics) PW.pics=[]; return PW.pics; }
function pwPicRoom(url){
  var n=0;
  try{ n=String(localStorage.getItem(LS_POSTS)||'').length; }catch(e){}
  return (n + String(url||'').length) < POST_BYTES;
}
/* The camera. `capture` on an image field is the whole of it -- iOS opens the
   camera rather than the picker -- and it needs no plugin. What it does need
   is NSCameraUsageDescription in Info.plist, without which iOS kills the app
   the instant the button is pressed rather than refusing it. It shipped
   without one and did exactly that. */
function pwSetPic(){
  var el=document.getElementById('pw-cam'),
      f=el && el.files && el.files[0];
  if(!f) return;
  var r=new FileReader();
  r.onload=function(){ pwPicKeep(String(r.result||'')); };
  r.onerror=function(){ toast(t('post.pic.bad')); };
  r.readAsDataURL(f);
}
/* The library, which is the phone's and not the web's. PHPickerViewController
   runs outside this app, so it needs no permission and this app never sees a
   photograph it was not given.

   POST_PIC goes ACROSS: how big a photograph on a post is is this file's to
   say, and a second number in Swift would be a second place saying it. What
   comes back is already at that size, so pwPicKeep() below has nothing left
   to shrink and simply squeezes it -- one road in, whichever door it came
   through.

   An empty answer is somebody changing their mind, and nothing is said about
   it. Only a refusal is a problem worth a word. */
function pwPickLib(){
  var p=sharePlug();
  if(!p){ toast(t('post.pic.no')); return; }
  p('LinguaShare', 'pickPhoto', {max:POST_PIC}).then(function(r){
    var b=(r && r.b64)? String(r.b64) : '';
    if(!b) return;
    pwPicKeep('data:image/jpeg;base64,'+b);
  })['catch'](function(){ toast(t('post.pic.bad')); });
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
    if(pwPics().length>=POST_PICS){ toast(t('post.pic.many', POST_PICS)); return; }
    pwPics().push({u:out, marks:[]});
    openPost();
  };
  im.onerror=function(){ toast(t('post.pic.bad')); };
  im.src=url;
}
/* The letters go with the picture. They are placed ON it -- a mark with no
   photograph under it is a position on nothing -- so they are on the same
   object and one splice takes both. */
function pwDropPic(i){
  var ps=pwPics();
  i=parseInt(i, 10)||0;
  if(!ps[i]) return;
  ps.splice(i, 1);
  pwPicAt=-1; pwMarkAt=-1;
  openPost();
}
/* A photograph, and the two things you do to one.

   It was three buttons in a row -- Change photo, Letters, Remove photo -- and
   on a phone `.btn` is flex:1 with word-break:break-word, so three of them
   came out as "Rem / ove / phot / o". 「下の文字終わってるだろw」

   What is there now is what a phone does with a picture: a red minus at its
   top corner takes it away, a plus beside it adds one, and pressing the
   picture opens it. 「右上に赤い⚪︎に-で消すで画像横に+ボタンでadd」
   「編集ボタンはいらん。画像タップして画像編集」 */
/* The photographs, sliding sideways, with the plus beside them.
   「画像は4枚まで載せられる。画像だけ横スライドできる感じ」「+が真ん中に来ると最高」

   There were three buttons under one picture -- Change photo, Letters, Remove
   photo -- and `.btn` is flex:1 with word-break:break-word, so the third came
   out as "Rem / ove / phot / o" on a phone. 「下の文字終わってるだろw」

   There is no button now. A red minus at a picture's corner takes it away, the
   plus adds one, and pressing a picture opens it.
   「編集ボタンはいらん。画像タップして画像編集」 */
function pwPicHTML(){
  var ps=pwPics();
  return '<div class="pwpics">'+
    '<div class="pwstrip'+(ps.length>1? ' many':'')+'">'+
    ps.map(function(pc, i){
      return '<span class="pwpicw">'+
        '<button class="pwpicb"' + DO('pwMarkOpen', [i]) + ' aria-label="'+
          esc(t('post.mark'))+'"><img class="pwpic" src="'+esc(pc.u||'')+'" alt=""></button>'+
        '<button class="pwpicx"' + DO('pwDropPic', [i]) + ' aria-label="'+
          esc(t('post.pic.drop'))+'">'+ICON_MINUS+'</button>'+
        ((pc.marks && pc.marks.length)
          ? '<span class="pwpicn">'+pc.marks.length+'</span>' : '')+
        '</span>';
    }).join('')+
    '</div>'+
    /* Under the strip, so it stays where a thumb can reach it however many
       pictures have to be pushed past. The camera and the library go at four
       rather than refusing at four: a button that is there and says no is a
       button you press twice. The microphone does not -- a voice is not a
       fifth picture. 「📷 ライブラリ マイクボタンにして」

       `capture` is the whole of the camera. There is no plugin and no Swift
       behind it: an image field carrying that word is what tells iOS to open
       the camera instead of the picker, and it is the same photograph either
       way once it arrives. */
    '<div class="pwadd">'+
      (ps.length<POST_PICS
        ? '<label class="pwab" aria-label="'+esc(t('post.cam'))+'">'+ICON_CAM+
            '<input type="file" id="pw-cam" accept="image/*" capture="environment"' +
            CH('pwSetPic') + '></label>'+
          /* A button, not a field. A file field cannot be a photo library on
             a phone: iOS answers one with its own action sheet -- Photo
             Library, Take Photo, Choose File -- so the button that said
             LIBRARY opened the camera and the Files app as well.
             「ライブラリーボタンなのにファイルとかカメラ開く」
             The library is PHPickerViewController, and that is native. */
          '<button class="pwab"' + DO('pwPickLib') + ' aria-label="'+
            esc(t('post.lib'))+'">'+ICON_LIB+'</button>'
        : '')+
      pwVoAddHTML()+
    '</div>'+
    '</div>';
}
/* The line as it will actually look, under the field.

   The field cannot BE vertical: a column is not something this webview lets
   anybody type into, which is what dirFlat() exists for. So a language that
   runs down the page was typed across and posted downward, and the first time
   somebody saw the shape of their own sentence was after it had gone.
   「縦書きにしたのに投稿プレビューだと見えない」

   It renders through postLnHTML() -- the timeline's own function, handed a
   post-shaped thing -- so the preview and the post cannot disagree about
   anything, because they are one renderer rather than two that look alike.

   Only for a language that runs down the page. For one that runs across, the
   field already IS the preview, and a second copy of the line under it would
   be the same sentence twice. */
/* Posts that arrived from somewhere else. One place, because "have I already
   got this one" is a question with exactly one right answer and two copies of
   it would drift.

   Nothing is overwritten. A post that is already here is left as it is -- it
   is past-tense data, and the copy on this phone is the one somebody may have
   already read. Only ones this phone has never seen are added, and then the
   list is put back in the order a timeline reads in, which is newest first
   and is postAll()'s to say. */
function postTake(ps){
  var have={}, i, p, n=0;
  for(i=0;i<POSTS.length;i++) have[POSTS[i].id]=1;
  for(i=0;i<(ps||[]).length;i++){
    p=ps[i];
    if(!p || !p.id || have[p.id]) continue;
    have[p.id]=1;
    POSTS.push(p);
    n++;
  }
  if(n) savePosts();
  return n;
}
/* ---- the badge, and the one thing on a post that is NOT frozen ----------
   「plusとstudioでそれぞれTwitterの青バッチみたいなやつつけたい」

   Everything else a post carries is past tense on purpose: the name, the
   handle, the face, the language's name, the shapes. Renaming yourself does
   not rewrite old posts, and that is the whole of rule 8.

   A badge is the opposite and the owner said so: 「バッジは消える」. It says
   what is true NOW -- this person pays now -- so it cannot be stamped onto a
   post at the moment of writing, or somebody who cancelled last year would
   still be wearing it on everything they ever wrote.

   Which means it cannot come off the post, and this phone can only answer it
   for one person: the one holding the phone. So a post that is not this
   person's own gets NO badge, whatever plan its author is on. That is not a
   gap to be filled in with a guess -- it is the honest answer until a server
   can be asked, and the day it can, the answer arrives with the author and
   this function is where it lands.

   tools/sides-check.mjs allows postBadge() below the line by name, with this
   paragraph as the reason. It is the second exception in that file and the
   first one that is about time rather than about language. */
function planBadge(id){
  if(id==='plus') return '<span class="bdgw plus" aria-hidden="true">'+MARK_PLUS+'</span>';
  if(id==='studio') return '<span class="bdgw studio" aria-hidden="true">'+MARK_STUDIO+'</span>';
  return '';
}
function postBadge(p){
  if(!p || !p.mine) return '';
  return planBadge(plan());
}
function pwPrevHTML(){
  var d=scriptDir(), ln=String(PW.ln||'');
  if(!ln) return '';
  return '<div class="pwprev '+dirClass(d)+'">'+
    postLnHTML({id:'pw', ln:ln, ink:postInk(ln)})+'</div>';
}
/* What you are answering, above what you are writing. It was a line of text
   saying whose handle it was, which tells you the one thing you already knew
   and not the thing you are replying TO. 「リプライする時は前のツイートが何か
   見れるように」

   Every field of it comes off the post: the face, the name, the shapes, which
   way the line runs, what it means. This is the composer -- the one place
   above the line that draws something belonging to somebody else, and the
   reason there is a rule about it is that it once said meName() and announced
   you were replying to yourself.

   No buttons on it. It is what you are looking at, not something to act on;
   the four things a post can be given are on the post itself, in the
   timeline. */
function pwToHTML(to){
  if(!to) return '';
  return '<div class="pwq">'+
    '<div class="pav">'+postFace(to)+'</div>'+
    '<div class="pbody">'+
      '<div class="phead">'+
        '<span class="pname">'+esc(postWho(to))+'</span>'+
        (to.lname? '<span class="plangtag">'+esc(to.lname)+'</span>' : '')+
        '<span class="phandle">@'+esc(to.hd||'')+'</span>'+
      '</div>'+
      (to.ln? '<div class="pline '+dirClass(postDir(to))+'">'+postLnHTML(to)+'</div>' : '')+
      (postSay(to)? '<div class="pmn">'+esc(postSay(to))+'</div>' : '')+
    '</div>'+
    '</div>';
}
function pwHTML(){
  var to=PW.to? postById(PW.to) : null;
  /* Whom you are replying to is on the post you pressed reply on. It read the
     account here, so every reply said you were replying to yourself. */
  return (to? '<div class="pwto">'+
      esc(t('post.re', '@'+(to.hd || to.who || to.lname || '')))+'</div>'+
      pwToHTML(to) : '')+
    /* The face you are about to post under, which is the one this post will
       carry -- worked out here, on the making side, where the letters are. */
    '<div class="pwtop"><div class="pav">'+
      postFace({who:meName(), lname:langName, av:postAvatar()})+'</div>'+
    '<div class="pwfield">'+
      /* The field runs the way the language does. A column cannot be typed
         into in this webview -- see dirFlat() -- so a vertical language
         types across the page, in the direction its columns run, and the
         post itself is set in columns. */
      lnField('pw-ln', t('post.ln.ph'), ' maxlength="'+POST_MAX+'"'+IN('pwSetLn'),
        PW.ln, dirClass(dirFlat(scriptDir())))+
      '<div id="pw-prev">'+pwPrevHTML()+'</div>'+
      '<div class="pwgl" id="pw-gl">'+pwGl()+'</div>'+
      '<div id="pw-left">'+pwLeftHTML()+'</div>'+
      /* The meaning sits in the same column as the line, in the same
         borderless field, because it is the second half of the same act. */
      '<input id="pw-mn" class="pwmn" value="'+esc(PW.mn)+'" '+
        'placeholder="'+esc(pwMn() || t('post.mn'))+'"' +
        IN('pwSetMn') + '>'+
      /* Editing is the line and the meaning. There is nothing to add a
         photograph or a voice to -- the post already has whatever it has --
         so the row that adds them is not there rather than there and
         refusing. */
      (PW.ed? '' : pwPicHTML())+
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
  /* The preview is patched with the gloss and the canvases painted again:
     postLines() asks the document what is on it, so the new ones are found
     without anything here knowing how many there are. */
  var pv=document.getElementById('pw-prev');
  if(pv){ pv.innerHTML=pwPrevHTML(); postLines(); }
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
/* Whether there is anything to post. It was: a line, or nothing. So a
   photograph with somebody's own letters drawn onto it -- which is most of
   what this app is for -- could not be posted on its own, and neither could
   thirty seconds of a language being spoken.
   「文字無しでもポストできるようにできない？」

   A post is a line, or a photograph, or a voice, or any of them together.
   Empty is still empty and still refused.

   Editing asks the POST, not the composer: an edit carries the line and the
   meaning and nothing else (the photographs and the voice were baked and
   written when the post was made), so a post being edited down to no line at
   all is fine as long as the post itself still has something on it. */
function pwHas(ln){
  var p;
  if(ln) return true;
  if(PW.ed){
    p=postById(PW.ed);
    return !!(p && (postPics(p).length || (p.vo && p.vo.f)));
  }
  return !!(pwPics().length || (PW.vo && PW.vo.b64));
}
/* The letters placed on the photograph are drawn INTO it first, and after
   that there is a picture and nothing else. It is the one thing here that
   cannot happen synchronously -- an image loads -- so the rest of posting is
   below, and a bake that fails sends the photograph as it was. */
function pwSend(){
  var ln=String(PW.ln||'').trim();
  if(!pwHas(ln)){ toast(t('post.none')); return; }
  /* A recording still running is a recording somebody meant to make -- the
     press that sends the post is not the press that throws it away. */
  if(REC){ toast(t('post.vo.busy')); return; }
  /* Editing does not bake, does not write a file and does not make a post:
     it is one that exists, with two of its fields put right. */
  if(PW.ed){ pwSaveEdit(ln); return; }
  /* The voice is written to the disk BEFORE the post is stored, because the
     post carries the file's name and a name pointing at nothing is a post
     that says it has a voice and has not. If the write does not happen --
     no bridge, no room, a refusal -- the post goes without one and says so,
     rather than being refused itself. What somebody typed is not lost
     because a microphone was. */
  pwBake(function(pics){
    voKeep(PW.vo, function(vo){
      if(PW.vo && !vo) toast(t('post.vo.lost'));
      pwSendWith(ln, pics, vo);
    });
  });
}
function pwSendWith(ln, pics, vo){
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
            ln:ln, ink:postInk(ln), dir:scriptDir(),
            mn:String(PW.mn||'').trim() || postGlossLine(gl),
            ui:uiLang(), li:0, bo:0, re:0};
  /* If the letters made the files too big for what is left, the PHOTOGRAPHS
     are what is refused -- never the post, and nothing already written is
     pruned to make room. Same sentence pwPicKeep() makes when a picture
     arrives; it is said again here because baking changes the size. */
  var keep=[], i, tot=0;
  for(i=0;i<(pics||[]).length;i++){
    tot+=String(pics[i]).length;
    if(pwPicRoom(String(tot))) keep.push(pics[i]);
  }
  if(keep.length) mine.pics=keep;
  if(keep.length<((pics||[]).length)) toast(t('post.pic.full'));
  /* The file's name and how long it is, and nothing else. The bytes are in
     Documents; what is in localStorage is this. */
  if(vo && vo.f) mine.vo={f:vo.f, ms:vo.ms||0};
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
  /* And it is told to the server, which today is told nothing. It is not
     waited on: the post is on this phone the moment it is written, and a
     person in a tunnel is still using this app. */
  netPush(mine, function(){}, function(){});
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

/* ---- letters placed on the photograph ---------------------------------
   「なんなら画像に自作文字を貼って投稿できるようにすれば勝手に広がるよ」

   A letter somebody drew, put anywhere on the picture, moved with a finger
   and sized with a slider. Free, on every plan.
   「画像と自作文字貼るのは無料 投稿に貼るに決まってるでしょ」

   They are BAKED into the picture when the post is sent, and that is the
   whole of why this needs no new field on a post. A reader has neither the
   alphabet nor a way to compose it; a picture with the letters already in it
   is past-tense the way `ink` is past-tense, by a shorter route. `post.pic`
   is the only thing that changes.

   While the post is being written they are `PW.marks`, which is where you are
   standing rather than anything that is stored: a letter's id, and where it
   sits as a FRACTION of the picture -- so the same numbers place it on the
   screen at 340px wide and in the bake at 900. */
var PW_MARK=0.18;              /* a new one is this much of the picture wide */
/* Which picture is open, and which letter on it is being worked on. Both are
   where you are standing rather than anything stored. */
var pwPicAt=-1, pwMarkAt=-1;
function pwPic(){ return pwPics()[pwPicAt] || null; }
function pwMarks(){
  var pc=pwPic();
  if(!pc) return [];
  if(!pc.marks) pc.marks=[];
  return pc.marks;
}
function pwMarkOpen(i){
  pwPicAt=parseInt(i, 10)||0;
  pwMarkAt=-1;
  if(!pwPic()) return;
  openForm('marks:'+pwPicAt, t('post.mark'), pwMarkHTML(), pwMarkMount);
}
FORM_OPEN.marks=function(i){ pwMarkOpen(i); };
/* The picture fills the phone and everything else floats on it: the way you
   drop a sticker on a photograph, not the way you fill in a form.
   「インスタみたいにしろよ なんでそんなパソコンと同じような配置なんや」

   It was a page -- the picture in a box, a row of controls under it, a grid of
   letters under that -- which reads as a settings screen about a photograph
   rather than as the photograph. There is nothing on this screen except the
   picture and the letters you are putting on it, so the picture is the screen.

   The stage is the PICTURE's box and not the phone's: a letter is placed as a
   fraction of the picture, and those fractions have to mean the same thing
   here and in the bake at 900px. So the stage shrink-wraps the image and the
   image is the thing that is centred. */
function pwMarkHTML(){
  var ms=pwMarks(), sel=ms[pwMarkAt], cr=(pwTool==='crop');
  return '<div class="mkfull">'+
    '<div class="mkstage'+(cr?' cut':'')+'" id="mk-box">'+
      '<img class="mkpic" src="'+esc((pwPic()&&pwPic().u)||'')+'" alt="">'+
      ms.map(function(m, i){
        return '<canvas class="mkc'+((!cr && i===pwMarkAt)?' on':'')+'" data-i="'+i+'" '+
          'style="left:'+(m.x*100)+'%;top:'+(m.y*100)+'%"></canvas>';
      }).join('')+
      /* The line is typed where it is going to be, in the letters and the
         colour it is going to be in. There was a grey box at the foot of the
         screen as well, which is the same thing said twice and the second one
         did not look like the answer.
         「薄灰色のやつ消して天仙のやつが実質その役割」 */
      ((!cr && sel)
        ? '<input class="mktx sfont mkink c'+
            Math.max(0, PW_COLS.indexOf(pwMarkCol(sel)))+'" id="mk-tx" '+
            'value="'+esc(sel.tx||'')+'" placeholder="'+esc(t('post.mark.ph'))+'" '+
            'autocomplete="off" autocorrect="off" spellcheck="false" '+
            'style="top:'+(sel.y*100)+'%;left:'+(sel.x*100)+'%"' +
            IN('pwMarkText') + '>'
        : '')+
      (cr? pwCutHTML() : '')+
    '</div>'+
    /* The row across the top: the way out, then the tools, then done. Round
       buttons over the picture, which is what a phone puts over a picture --
       a pill with a word in it is what a settings screen puts under one. */
    '<div class="mkbar">'+
      '<button class="mkr"' + DO('back') + ' aria-label="'+esc(t('post.mark.done'))+'">'+
        ICON_BACK+'</button>'+
      '<button class="mkr'+(cr?' on':'')+'"' + DO('pwTool', ["crop"]) + ' aria-label="'+
        esc(t('post.cut'))+'">'+ICON_CROP+'</button>'+
      '<button class="mkr'+(cr?'':' on')+'"' + DO('pwTool', ["mark"]) + ' aria-label="'+
        esc(t('post.mark.tool'))+'">'+ICON_LTR+'</button>'+
      '<button class="mkdone"' + DO('back') + '>'+esc(t('post.mark.done'))+'</button>'+
    '</div>'+
    (cr
      ? '<div class="mktools">'+
          '<button class="mkt"' + DO('pwCutDo') + '>'+
            '<span class="mktl">'+esc(t('post.cut.do'))+'</span></button>'+
          '<button class="mkt"' + DO('pwCutAll') + '>'+
            '<span class="mktl">'+esc(t('post.cut.all'))+'</span></button>'+
        '</div>'
      : (sel
        ? '<div class="mkslide"><input type="range" class="mkrng" id="mk-size" '+
            'min="4" max="60" value="'+Math.round(sel.s*100)+'"' + IN('pwMarkSize') + '>'+
          '</div>'+
          /* What colour the letter is, along the foot above the alphabet --
             where a phone puts a colour picker. It was a white/black switch,
             which is two of the colours a letter on a photograph could be.
             「あと文字の色変えたり」 */
          '<div class="mkcols">'+PW_COLS.map(function(c, i){
            return '<button class="mkcol'+(pwMarkCol(sel)===c?' on':'')+'"' +
              DO('pwMarkInk', [c]) + ' aria-label="'+esc(t('post.mark.col'))+'">'+
              '<span class="mksw c'+i+'"></span></button>';
          }).join('')+
            '<button class="mkcol"' + DO('pwMarkDel') + ' aria-label="'+
              esc(t('post.mark.del'))+'">'+ICON_CROSS+'</button>'+
          '</div>'
        : ''))+
    '</div>';
}
/* ---- cropping ----------------------------------------------------------
   「画像タップして画像編集切り抜きとか文字入れとか」

   The rectangle is kept as fractions of the picture, exactly as a letter's
   position is, so nothing here needs to know how big the photograph is or how
   big the screen is. Applying it is the only place that touches pixels.

   The corners are not buttons. They are drawn boxes that the one pointer
   listener on the stage decides it has grabbed -- a button would be four more
   things press-check has to measure and press, for a control that means
   nothing to press. */
var pwTool='mark';
var pwCut={x:0.06, y:0.06, w:0.88, h:0.88};
function pwToolSet(k){
  pwTool=(k==='crop')? 'crop' : 'mark';
  pwMarkTrim();
  if(pwTool==='crop'){ pwCut={x:0.06, y:0.06, w:0.88, h:0.88}; pwMarkAt=-1; }
  else {
    /* Pressing the letters tool starts a line, which is what pressing a text
       tool does on every phone. An empty one is thrown away the moment
       anything else is touched, so nothing is left behind by changing your
       mind. */
    var ms=pwMarks();
    ms.push({tx:'', x:0.5, y:0.5, s:PW_MARK, c:PW_COLS[0]});
    pwMarkAt=ms.length-1;
  }
  pwMarkPaint();
  var e=document.getElementById('mk-tx');
  if(e) e.focus();
}
/* A line nobody typed anything into is not a line. */
function pwMarkTrim(){
  var ms=pwMarks(), i;
  for(i=ms.length-1;i>=0;i--) if(!String(ms[i].tx||'').length) ms.splice(i, 1);
  pwMarkAt=-1;
}
function pwCutHTML(){
  var c=pwCut;
  return '<div class="mkcut" style="left:'+(c.x*100)+'%;top:'+(c.y*100)+'%;'+
    'width:'+(c.w*100)+'%;height:'+(c.h*100)+'%">'+
    '<i class="mkh tl"></i><i class="mkh tr"></i>'+
    '<i class="mkh bl"></i><i class="mkh br"></i></div>';
}
/* The whole picture again, without applying anything. */
function pwCutAll(){ pwCut={x:0, y:0, w:1, h:1}; pwMarkPaint(); }
/* Cut, for real. The picture becomes the rectangle, and every letter on it
   moves with the picture -- a letter is a fraction of the photograph and the
   photograph is about to be a different one, so leaving the fractions alone
   would slide every letter somewhere it was never put.

   A letter that ends up outside the new edges is held at the edge rather than
   dropped. Dropping it would be deleting something somebody made because the
   picture got smaller. */
function pwCutDo(){
  var pc=pwPic(), c=pwCut;
  if(!pc || !pc.u) return;
  if(c.w>=0.999 && c.h>=0.999){ pwTool='mark'; pwMarkPaint(); return; }
  var im=new Image();
  im.onload=function(){
    var W=Math.max(1, Math.round(im.width*c.w)), H=Math.max(1, Math.round(im.height*c.h));
    var cv=document.createElement('canvas'), x, out, i, m;
    cv.width=W; cv.height=H;
    x=cv.getContext('2d');
    x.drawImage(im, Math.round(im.width*c.x), Math.round(im.height*c.y),
                W, H, 0, 0, W, H);
    try{ out=cv.toDataURL('image/jpeg', POST_PICQ); }
    catch(e){ toast(t('post.pic.bad')); return; }
    if(!pwPicRoom(out)){ toast(t('post.pic.full')); return; }
    for(i=0;i<(pc.marks||[]).length;i++){
      m=pc.marks[i];
      m.x=Math.max(0, Math.min(1, (m.x-c.x)/c.w));
      m.y=Math.max(0, Math.min(1, (m.y-c.y)/c.h));
      /* The size is a fraction of the WIDTH, so it grows by the same factor
         the width shrank by. */
      m.s=Math.max(0.04, Math.min(0.6, m.s/c.w));
    }
    pc.u=out;
    pwTool='mark';
    pwFresh(); pwMarkPaint();
  };
  im.onerror=function(){ toast(t('post.pic.bad')); };
  im.src=pc.u;
}
/* Redrawn in place rather than through render(): the picture is a big image
   and rebuilding the screen on every drag would reload it. */
function pwMarkPaint(){
  var e=document.getElementById('form-body');
  if(!e) return;
  e.innerHTML=pwMarkHTML();
  pwMarkMount();
}
/* Typing into the field. An empty field with nothing selected makes a line;
   an empty line is removed rather than left as an invisible thing to press. */
function pwMarkText(v){
  var ms=pwMarks(), m=ms[pwMarkAt];
  v=String(v||'');
  if(!m){
    if(!v) return;
    ms.push({tx:v, x:0.5, y:0.5, s:PW_MARK, c:PW_COLS[0]});
    pwMarkAt=ms.length-1;
    pwFresh(); pwMarkPaint();
    var e=document.getElementById('mk-tx');
    if(e) e.focus();
    return;
  }
  m.tx=v;
  pwFresh();
  pwMarkDraw(); pwMarkFit();
}
function pwMarkDel(){
  var ms=pwMarks();
  if(!ms[pwMarkAt]) return;
  ms.splice(pwMarkAt, 1);
  pwMarkAt=-1;
  pwFresh(); pwMarkPaint();
}
/* What colour a letter on a photograph may be. White and black first, because
   those are what a caption on a photograph has always been and one of the two
   works on almost any picture; the rest are there because somebody drawing
   their own alphabet did not do it to write in grey.
   「あと文字の色変えたり」 */
/* Named, not written out: a colour in the markup is what act-check refuses
   and it is right to -- every colour in this app is a token in index.html and
   there is one place they are set. So this is the list of NAMES, the swatch
   wears its own class, and drawing asks cssVar() for the value. */
var PW_COLS=['--mk0', '--mk1', '--mk2', '--mk3', '--mk4', '--mk5', '--mk6', '--mk7'];
/* A letter's colour, asked in one place, so a mark made before there were
   colours -- while a post was being written and the app reloaded -- still
   answers something drawable. `w` was the white/black switch that came
   before. */
function pwMarkCol(m){
  if(!m) return PW_COLS[0];
  if(typeof m.c==='string' && m.c) return m.c;
  return m.w? PW_COLS[0] : PW_COLS[1];
}
function pwMarkInk(c){
  var m=pwMarks()[pwMarkAt];
  if(!m) return;
  m.c=String(c||PW_COLS[0]);
  delete m.w;
  pwFresh(); pwMarkPaint();
}
function pwMarkSize(v){
  var m=pwMarks()[pwMarkAt];
  if(!m) return;
  m.s=Math.max(0.04, Math.min(0.6, (parseInt(v, 10)||18)/100));
  pwFresh(); pwMarkDraw(); pwMarkFit();
}
/* What a mark is made of: the line somebody typed, cut into the shapes it is
   written with. postCut() is the one place that cuts a line, and it is the
   same cut a post's ink gets -- so `ka` is one letter here exactly as it is
   there, and anything never drawn stays as its characters.

   The open alphabet, which is right: this is the making side, and it is MY
   picture and MY letters. What travels is the baked photograph. */
function pwMarkCut(m){
  return (m && m.tx)? postCut(m.tx) : [];
}
/* How wide that line is, in cells of its own height. The font's own rule --
   inkAdv() is reach(), ink plus one step with half a step at each end -- so
   the letters stand here the way they stand everywhere else in the app. A
   piece that was never drawn is text and takes a cell. */
function pwMarkAdv(units){
  var w=0, i, a;
  for(i=0;i<units.length;i++){
    if(units[i].st){ a=inkAdv(units[i].st); w+=a? a.w : 800; }
    else w+=String(units[i].t||'').length*440;
  }
  return w;
}
/* One line of shapes onto a canvas, at scale k, starting at ox/oy. */
function pwMarkRun(x, units, k, ox, oy, col){
  var i, a, cur=ox;
  x.fillStyle=col; x.textAlign='left'; x.textBaseline='alphabetic';
  for(i=0;i<units.length;i++){
    if(units[i].st){
      a=inkAdv(units[i].st);
      if(a){ inkStrokes(x, units[i].st, k, cur+a.dx*k, oy, col); cur+=a.w*k; }
      else cur+=800*k;
    } else {
      x.font=Math.round(640*k)+'px '+CARD_CAPS;
      x.fillStyle=col;
      x.fillText(String(units[i].t||''), cur, oy+640*k);
      cur+=String(units[i].t||'').length*440*k;
    }
  }
}
/* Not inkCanvases(): that draws every square cell in --tx, which is the
   theme's ink and is right for a tile, a key and the alphabet. A letter on a
   photograph is white or black and nothing else -- the two colours a caption
   has ever been -- so the strokes go through inkStrokes directly, which is
   still the one place that turns strokes into a shape. */
/* How wide a mark is on the picture, as a fraction of it: its height times
   the line's own advance. Asked in one place because the drawing, the hit box
   and the bake all need the same answer. */
function pwMarkWide(m){
  return m.s*(pwMarkAdv(pwMarkCut(m))/800);
}
function pwMarkDraw(){
  var ms=pwMarks(), els=document.querySelectorAll('canvas.mkc'), i, c, m, u, H, W,
      dpr=window.devicePixelRatio||1, box=document.getElementById('mk-box');
  var bw=box? (box.getBoundingClientRect().width||300) : 300;
  for(i=0;i<els.length;i++){
    c=els[i];
    m=ms[parseInt(c.getAttribute('data-i'), 10)];
    if(!m) continue;
    c.style.width=(pwMarkWide(m)*100)+'%';
    c.style.left=(m.x*100)+'%';
    c.style.top=(m.y*100)+'%';
    /* The one being typed is drawn by the field itself -- it is the field --
       so its canvas would be the same line twice, half a pixel apart. */
    c.style.display=(parseInt(c.getAttribute('data-i'), 10)===pwMarkAt)? 'none' : '';
    u=pwMarkCut(m);
    if(!u.length) continue;
    H=Math.max(40, Math.round(m.s*bw*dpr));
    W=Math.max(1, Math.round(H*(pwMarkAdv(u)/800)));
    c.width=W; c.height=H;
    pwMarkRun(c.getContext('2d'), u, H/800, 0, 0, cssVar(pwMarkCol(m)));
  }
}
/* The field is set at the size the line will be on the picture, which is a
   fraction of the picture's width and therefore something only the stage can
   answer. otf5's cell is 800 of a 1000 em, so the em is the cell and a
   quarter. */
function pwMarkFit(){
  var e=document.getElementById('mk-tx'), m=pwMarks()[pwMarkAt],
      box=document.getElementById('mk-box');
  if(!e || !m || !box) return;
  var bw=box.getBoundingClientRect().width||300;
  /* The size is not calculated, it is measured against the canvas. The field
     is the font drawing the line and the canvas is inkStrokes drawing it, and
     the two do not agree on their own: the advance the font gives a letter is
     built with its own side bearing and its own pen, and inkAdv's is not the
     same number. A line typed at the cell's own size therefore came out a
     third narrower than the one it turned into the moment you tapped away.
     So: rendered once at a hundred, and set to whatever size makes it as wide
     as pwMarkWide() -- the one place that says how wide a mark is -- says the
     line is. Whatever the two renderers disagree about, they agree here. */
  var want=pwMarkWide(m)*bw, fs=m.s*bw*1.25, at100;
  e.style.width='0px';
  e.style.fontSize='100px';
  at100=e.scrollWidth;
  if(at100>0 && want>0) fs=100*want/at100;
  e.style.fontSize=Math.max(11, Math.round(fs))+'px';
  /* And a field has no width that follows what is typed into it -- left and
     right do not stretch one the way they stretch a box, so the line ran out
     of its own frame. Narrowed to nothing, asked how wide what is in it came
     out, set to that. Narrowing first is what makes it come back in on a
     delete. */
  e.style.width='0px';
  e.style.width=Math.max(44, e.scrollWidth+4)+'px';
  e.style.left=(m.x*100)+'%';
  e.style.top=(m.y*100)+'%';
}
/* One pointer, on the box rather than on each letter: a finger that leaves a
   small canvas mid-drag would otherwise drop it. */
function pwMarkMount(){
  pwMarkDraw();
  pwMarkFit();
  var box=document.getElementById('mk-box');
  if(!box) return;
  box.style.touchAction='none';
  box.onpointerdown=pwMarkDown;
  box.onpointermove=pwMarkMove;
  box.onpointerup=pwMarkUp;
  box.onpointercancel=pwMarkUp;
}
/* What the finger has hold of: a letter, a corner of the crop, or the crop
   itself. One listener on the stage decides, because a finger that leaves a
   small box mid-drag would be dropped by a listener on that box. */
var pwMarkGrab=false, pwCutGrab='';
function pwMarkWhere(ev){
  var box=document.getElementById('mk-box');
  if(!box) return null;
  var b=box.getBoundingClientRect();
  if(!b.width || !b.height) return null;
  return [Math.max(0, Math.min(1, (ev.clientX-b.left)/b.width)),
          Math.max(0, Math.min(1, (ev.clientY-b.top)/b.height))];
}
/* The topmost one the finger is inside, so a letter placed over another is the
   one that moves. */
function pwMarkHit(p){
  var ms=pwMarks(), i, m, hw, hh;
  for(i=ms.length-1;i>=0;i--){
    m=ms[i]; hw=pwMarkWide(m)/2; hh=m.s/2;
    if(p[0]>=m.x-hw && p[0]<=m.x+hw && p[1]>=m.y-hh && p[1]<=m.y+hh) return i;
  }
  return -1;
}
/* Which corner of the crop the finger is on, or the middle of it, or nothing.
   The corners are given a share of the picture rather than a number of pixels
   so the reach is the same on any screen; 0.09 of a phone is about 35px, and
   the corner is the only thing there to grab. */
function pwCutHit(p){
  var c=pwCut, r=0.09, near=function(a, b){ return Math.abs(a-b)<r; };
  var L=near(p[0], c.x), R=near(p[0], c.x+c.w);
  var T=near(p[1], c.y), B=near(p[1], c.y+c.h);
  if(T && L) return 'tl';
  if(T && R) return 'tr';
  if(B && L) return 'bl';
  if(B && R) return 'br';
  if(p[0]>c.x && p[0]<c.x+c.w && p[1]>c.y && p[1]<c.y+c.h) return 'in';
  return '';
}
var pwCutFrom=null;
function pwMarkDown(ev){
  var p=pwMarkWhere(ev);
  if(!p) return;
  if(pwTool==='crop'){
    pwCutGrab=pwCutHit(p);
    if(!pwCutGrab) return;
    pwCutFrom={p:p, c:{x:pwCut.x, y:pwCut.y, w:pwCut.w, h:pwCut.h}};
    if(ev.preventDefault) ev.preventDefault();
    return;
  }
  var i=pwMarkHit(p);
  if(i<0) return;
  pwMarkGrab=true;
  if(i!==pwMarkAt){
    var m=pwMarks()[i], keep=m && m.tx;
    pwMarkTrim();
    pwMarkAt=pwMarks().indexOf(m);
    if(!keep) pwMarkAt=-1;
    pwMarkPaint();
  }
  if(ev.preventDefault) ev.preventDefault();
}
/* The smallest a crop may be, as a share of the picture. Below this a corner
   is on top of the opposite corner and there is nothing left to grab. */
var PW_CUTMIN=0.12;
function pwCutMove(p){
  var f=pwCutFrom, c=f.c, dx=p[0]-f.p[0], dy=p[1]-f.p[1], g=pwCutGrab;
  var x=c.x, y=c.y, w=c.w, h=c.h;
  if(g==='in'){
    x=Math.max(0, Math.min(1-w, c.x+dx));
    y=Math.max(0, Math.min(1-h, c.y+dy));
  } else {
    if(g==='tl' || g==='bl'){
      x=Math.max(0, Math.min(c.x+c.w-PW_CUTMIN, c.x+dx));
      w=c.x+c.w-x;
    } else {
      w=Math.max(PW_CUTMIN, Math.min(1-c.x, c.w+dx));
    }
    if(g==='tl' || g==='tr'){
      y=Math.max(0, Math.min(c.y+c.h-PW_CUTMIN, c.y+dy));
      h=c.y+c.h-y;
    } else {
      h=Math.max(PW_CUTMIN, Math.min(1-c.y, c.h+dy));
    }
  }
  pwCut={x:x, y:y, w:w, h:h};
  var e=document.querySelector('.mkcut');
  if(e){
    e.style.left=(x*100)+'%'; e.style.top=(y*100)+'%';
    e.style.width=(w*100)+'%'; e.style.height=(h*100)+'%';
  }
}
function pwMarkMove(ev){
  var p=pwMarkWhere(ev);
  if(!p) return;
  if(pwCutGrab && pwCutFrom){ pwCutMove(p); if(ev.preventDefault) ev.preventDefault(); return; }
  if(!pwMarkGrab) return;
  var m=pwMarks()[pwMarkAt];
  if(!m) return;
  m.x=p[0]; m.y=p[1];
  pwMarkDraw(); pwMarkFit();
  if(ev.preventDefault) ev.preventDefault();
}
function pwMarkUp(){
  if(pwCutGrab){ pwCutGrab=''; pwCutFrom=null; return; }
  if(!pwMarkGrab) return;
  pwMarkGrab=false;
  pwFresh();
}
/* ---- and into the picture ----------------------------------------------
   The letters are drawn INTO the photograph at the moment the post is sent,
   and after that there is a picture and nothing else. Nothing on the post
   has to be composed by a reader who does not have this alphabet, which is
   the same guarantee `ink` gives by the longer route.

   It is asynchronous because an image is, so pwSend hands it a function
   rather than waiting: a post is not held up by a picture, and a bake that
   fails sends the photograph as it was rather than sending nothing. */
function pwBake(done){
  var ps=pwPics(), out=[], i=0;
  function next(){
    if(i>=ps.length){ done(out); return; }
    pwBakeOne(ps[i], function(u){ if(u) out.push(u); i++; next(); });
  }
  next();
}
/* One picture, with its letters drawn into it. A picture with nothing on it is
   handed straight back rather than re-encoded: a second pass through JPEG
   costs quality and buys nothing. */
function pwBakeOne(pc, done){
  var ms=(pc && pc.marks) || [];
  if(!pc || !pc.u){ done(''); return; }
  if(!ms.length){ done(pc.u); return; }
  var im=new Image();
  im.onload=function(){
    var c=document.createElement('canvas'), x, i, m, st, k, out;
    c.width=im.width; c.height=im.height;
    x=c.getContext('2d');
    x.drawImage(im, 0, 0, c.width, c.height);
    for(i=0;i<ms.length;i++){
      m=ms[i];
      st=pwMarkCut(m);
      if(!st.length) continue;
      /* The same numbers the screen used: the height is a fraction of the
         picture's width, and the line is centred on the point it was left at. */
      k=(m.s*c.width)/800;
      pwMarkRun(x, st, k, m.x*c.width-(pwMarkWide(m)*c.width)/2,
                m.y*c.height-(m.s*c.width)/2, cssVar(pwMarkCol(m)));
    }
    try{ out=c.toDataURL('image/jpeg', POST_PICQ); }
    catch(e){ done(pc.u); return; }
    done(out);
  };
  im.onerror=function(){ done(pc.u); };
  im.src=pc.u;
}

/* Editing your own post, which is the line and the meaning and nothing else.
   The photographs and the voice stay exactly as they were: those are files,
   they were baked and written when the post was made, and swapping one for
   another is not correcting a sentence.

   The ink is re-cut, and that is not a choice. A post's shapes are the line
   already cut into letters -- change the line and the old shapes are the old
   line. So an edited post is drawn in the alphabet as it stands at the moment
   of the edit, which is the one place in this app where a post's shapes are
   not the shapes it was born with. */
function postEdit(id){
  var p=postById(id);
  if(!p || !p.mine) return;
  PMENU='';
  PW=pwBlank();
  PW.ed=p.id; PW.ln=String(p.ln||''); PW.mn=String(p.mn||'');
  openPost();
}
function pwSaveEdit(ln){
  var p=postById(PW.ed), mn;
  if(!p || !p.mine){ toast(t('post.gone')); PW=pwBlank(); goTab('feed'); return; }
  mn=String(PW.mn||'').trim() || postGlossLine(postGloss(ln));
  p.ln=ln; p.ink=postInk(ln); p.mn=mn;
  /* The translations were of the old sentence. They are dropped rather than
     left to be shown under a line they are no longer about, and asked for
     again -- which lands late, on a post that already exists, exactly as it
     does when one is written. */
  delete p.tr;
  p.ui=uiLang();
  p.ed=Date.now();
  postTr(p.mn, p.ui, function(tr){
    if(tr && typeof tr==='object'){ p.tr=tr; savePosts(); render(); }
  });
  savePosts();
  PW=pwBlank();
  goTab('feed');
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
/* Which way this post's line runs, asked of the POST.

   It is frozen on at the moment of writing, exactly as the shapes are, and
   for exactly the same reason: the reader has neither the writer's alphabet
   nor the writer's language settings, so a timeline that asked the open
   language which way to set a line would set every post the way MY language
   runs. That is the card bug in another costume, and this is below the line
   where rule 8 holds -- `scriptDir()` is the making side's and may not be
   named here.

   A post written before posts carried a direction runs left to right, which
   is how it was written and how it has been shown until now. Nothing is
   guessed and nothing is back-filled. */
/* What pictures a post has, asked in ONE place.

   A post used to carry `pic`, one photograph. It carries `pics` now, up to
   four. Posts written before this keep the field they were written with --
   nothing goes and rewrites somebody's timeline into a newer shape, and a
   photograph is the largest thing on a post, so a migration that copied one
   would double it. So: `pics` if it has one, otherwise `pic` as a list of
   one, otherwise nothing. */
function postPics(p){
  if(!p) return [];
  if(Object.prototype.toString.call(p.pics)==='[object Array]' && p.pics.length)
    return p.pics;
  return p.pic? [p.pic] : [];
}
function postDir(p){
  var d=p && p.dir;
  return DIRS.indexOf(d)>=0 ? d : 'ltr';
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
/* The voice on a post, and it renders from the post: `vo` is `{f, ms}` -- the
   name of a file in Documents and how long it is -- and there is nothing else
   to know. A post with none has no row, not an empty one. rec.js (chapter 25)
   is the other half, and the file is written there. */
function postVoHTML(p){
  var vo=p && p.vo;
  if(!vo || !vo.f) return '';
  return '<button class="povo'+((VOAT===vo.f)? ' on':'')+'" data-f="'+esc(vo.f)+'"' +
    DO('voPlay', [String(vo.f)]) + ' aria-label="'+esc(t('post.vo.play'))+'">'+
    ICON_PLAY+'<span class="vot">'+esc(voLen(vo.ms))+'</span></button>';
}
function postRow(p){
  return '<div class="post">'+
    '<div class="pav">'+postFace(p)+'</div>'+
    '<div class="pbody">'+
      '<div class="phead">'+
        '<span class="pname">'+esc(postWho(p))+'</span>'+postBadge(p)+
        (p.lname? '<span class="plangtag">'+esc(p.lname)+'</span>' : '')+
        '<span class="phandle">@'+esc(p.hd||'')+'</span>'+
        '<span class="pdot">·</span>'+
        '<span class="pwhen">'+esc(postWhen(p.at))+'</span>'+
        /* A post that was put right says so, beside the time. It carries the
           moment it was edited, not a flag: what a person wants to know is
           when, and a flag cannot be asked that later. */
        (p.ed? '<span class="ped">'+esc(t('post.edited'))+'</span>' : '')+
        (p.pin? '<span class="ppin">'+ICON_PIN+'</span>' : '')+
        /* The ... and, when it is the one that is open, the menu hanging off
           it. It is IN the post rather than a screen you go to, so what you
           are choosing about stays in front of you. 「画面遷移じゃなくて投稿の
           横にメニュー出てきて欲しい」 */
        (p.mine? '<span class="pmw">'+
          '<button class="pmore"' + DO('postMore', [p.id]) + ' aria-label="'+
            esc(t('post.more'))+'">'+ICON_DOTS+'</button>'+
          (PMENU===p.id? postMenuHTML(p) : '')+
          '</span>' : '')+
      '</div>'+
      /* It used to be text wearing MY font, and only ever on my own post,
         because my font is the font of MY language and putting it on
         somebody else's line drew their words in my shapes. Now the shapes
         are on the post, so there is no font to put on anything and no
         reason to treat my own post differently from anybody's. */
      /* A post may have no line at all -- a photograph on its own, or a
         voice. An empty div here is a gap above the picture that nothing
         explains. 「文字無しでもポストできるようにできない？」 */
      (p.ln? '<div class="pline '+dirClass(postDir(p))+'">'+postLnHTML(p)+'</div>' : '')+
      /* The pictures, and they are the one thing on a post that slides
         sideways. 「画像だけ横スライドできる感じ」 One is a picture; several
         are a strip, and the strip scrolls rather than the post. */
      (postPics(p).length
        ? '<div class="ppics'+(postPics(p).length>1? ' many':'')+'">'+
            postPics(p).map(function(u){
              return '<img class="ppic" src="'+esc(u)+'" alt="">';
            }).join('')+'</div>'
        : '')+
      postVoHTML(p)+
      /* The natural language, in the reader's own if the post carries it and
         in the author's if it does not -- which is every post until the
         translator is wired up, and is not a failure. Not "always" any more:
         a post with no line has nothing to mean. */
      (postSay(p)? '<div class="pmn">'+esc(postSay(p))+'</div>' : '')+
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
  /* Whether it is liked, not what the count is: a count is the server's to
     add up, and two phones sending counts is how a number goes backwards. */
  netMark(id, 'like', !!p.lime, function(){}, function(){});
}
function postBoost(id){
  var p=postById(id);
  if(!p) return;
  p.bome=!p.bome;
  p.bo=Math.max(0, (p.bo||0)+(p.bome? 1 : -1));
  savePosts(); render();
  netMark(id, 'boost', !!p.bome, function(){}, function(){});
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
/* The three things an author can do to their own post. It was one, and it was
   on the ... itself -- so the only thing that button could ever be was delete,
   and a delete reached by pressing something unlabelled is a delete waiting to
   be pressed by accident. 「ポストを削除、ポストを固定する、にしよう」
   「デリートピン留めエディット」 */
/* Which post has its menu open, and at most one. It is where you are standing
   and not anything about a post, so viewReset() forgets it -- arriving
   somewhere with a menu hanging off a post you have not looked at yet is the
   filter bug in a smaller costume. */
var PMENU='';
function postMore(id){
  var p=postById(id);
  if(!p || !p.mine) return;
  PMENU=(PMENU===id)? '' : id;
  render();
}
/* The three things, beside the post rather than instead of it. It was a page:
   pressing ... left the timeline, showed three rows on an empty screen, and
   came back. For three words about the post you are looking at, going
   somewhere else to say them is the wrong size of answer.
   「画面遷移じゃなくて投稿の横にメニュー出てきて欲しい」

   Delete is last and red, which is where every phone puts the one that cannot
   be undone.

   The card is rendered inside the post, so it moves with it and needs nothing
   measured or positioned by hand. What is closed is `PMENU`, in one place. */
function postMenuHTML(p){
  return '<span class="pmenu" data-pm="1">'+
    '<button class="pmi"' + DO('postPin', [p.id]) + '>'+ICON_PIN+
      '<span>'+esc(t(p.pin? 'post.unpin' : 'post.pin'))+'</span></button>'+
    '<button class="pmi"' + DO('postEdit', [p.id]) + '>'+ICON_PEN+
      '<span>'+esc(t('post.edit'))+'</span></button>'+
    '<button class="pmi bad"' + DO('postDel', [p.id]) + '>'+ICON_CROSS+
      '<span>'+esc(t('post.del'))+'</span></button>'+
    '</span>';
}
/* act.js asks this before it delivers a press, and it is the whole of the
   rule: with a menu open, a press that is not part of that menu closes it and
   goes no further. Two things go through -- the menu's own rows, and the ...
   itself, which is the button that opens and closes it.

   `data-pm` is what "part of the menu" means, so a row added to the menu is
   covered by being in it rather than by being listed here as well. */
function postMenuTook(target){
  var el;
  if(!PMENU) return false;
  if(actOf(target, 'data-pm')) return false;
  el=actOf(target, 'data-do');
  if(el && el.getAttribute('data-do')==='postMore') return false;
  PMENU='';
  render();
  return true;
}
/* One at a time. A page with three things at the top of it has nothing at the
   top of it, and "which one is pinned" then has no answer. Pressing the one
   that is pinned takes it off. */
function postPin(id){
  var p=postById(id), was, i;
  if(!p || !p.mine) return;
  was=!!p.pin;
  for(i=0;i<POSTS.length;i++) if(POSTS[i].mine) delete POSTS[i].pin;
  if(!was) p.pin=1;
  PMENU='';
  savePosts();
  if(here().r==='form') back();
  render();
}
/* The post first, its voice second. 「投稿消した声も消していいよ」
   The order is the whole of it: the person pressed delete on a POST, so the
   post goes whatever happens to the file. The other way round leaves a post
   whose voice is silently missing, which is worse than a file nobody hears.
   Only the file this post names, and only from this post. */
function postDel(id){
  if(!confirm(t('post.del.q'))) return;
  var i, vo=null, to='', up;
  PMENU='';
  for(i=0;i<POSTS.length;i++) if(POSTS[i].id===id){
    vo=POSTS[i].vo; to=POSTS[i].to||''; POSTS.splice(i, 1); break;
  }
  /* A reply counted one on the post it answered, and deleting it never took
     that one back -- so a post somebody replied to and then deleted the reply
     from said "1" forever, pointing at nothing.
     「リプライ消したのに数字1のまま」
     pwSendWith() is the one place that adds it, and this is the one place
     that takes it away. Floored at zero: a count that has already been wrong
     must not be made negative by putting it right. */
  if(to){
    up=postById(to);
    if(up) up.re=Math.max(0, (up.re||0)-1);
  }
  savePosts();
  if(vo && vo.f) voDropFile(vo.f);
  netDrop(id, function(){}, function(){});
  if(here().r==='form') back();
  render();
}
