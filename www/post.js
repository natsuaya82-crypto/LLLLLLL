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
function postRead(){
  POSTS=[];
  try{
    var p=JSON.parse(localStorage.getItem(LS_POSTS)||'null');
    if(p && p.length) POSTS=p;
  }catch(e){}
}
postRead();
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
/* Whoever you have blocked is not in any list. 「ブロックは何も見えなくなる」
   netFeed() leaves them out on the SERVER, which is the only way a block is a
   block at all -- their posts never arrive. This is the other half: a post of
   theirs already on this phone, in a thread, on a profile, in a search.

   Never your own: `mine` is checked because a handle can be your own on a
   phone whose account changed, and a block that hid your own writing would be
   the worst possible reading of it. */
function postBlocked(p){ return !!(p && !p.mine && meBlocks(p.hd)); }
/* Somebody else's post that has been taken down is not a row in a timeline.
   It is kept -- a thread that had one in it has to be able to say so -- and
   postTomb() is what a thread draws for it. Your OWN stays where it is,
   wearing the chip that says what state it is in: the person it happened to
   is told by their own post. */
/* Everything this phone holds that there is anything left to draw, newest
   first. Blocked is gone and so is a post that was taken down -- neither has
   a page it is still shown on.

   A frozen account's posts are NOT dropped here. They come off the timeline
   and stay on that account's own page, so the sieve for that is one line
   further down and this list is what the page uses. */
function postKept(){
  return POSTS.slice().filter(function(p){
      return !postBlocked(p) && !postGone(p);
    })
    .sort(function(a, b){ return (b.at||0)-(a.at||0); });
}
function postAll(){
  return postKept().filter(function(p){ return !postOut(p); });
}
/* Written by an account that has been frozen. Off the timeline and NOT gone:
   the post is still there, on that account's own page, for whoever goes
   looking. 「タイムラインから外す、プロフィールからは凍結してますの表示。
   ツイートは自己責任で見れるようにするのは？」

   A freeze can be lifted, which is the other half of why nothing is
   destroyed here -- the posts come back to the timeline by themselves the
   next time the server is asked. */
function postOut(p){ return !!(p && p.out && !p.mine); }
/* A post that was taken down and is not yours. It arrives with nothing in it
   -- post_seen in supabase/schema.sql empties the body, so the words are not
   on the wire at all -- and there is nothing to draw but the fact of it. */
function postGone(p){ return !!(p && p.down && !p.mine); }
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
function pwBlank(){ return {ln:'', mn:'', to:'', pics:[], pr:0}; }
/* ---- who a post is for -------------------------------------------------
   「自分専用の日記みたいなポストとみんなに公開するポストカード選べるように」
   「誰に向けて後悔するかでしょ。自分or公開で」「公開（推奨）」
   「同じ場所に鍵マーク付き（推奨）」「非公開の時はポストに🔓マークつけよ」

   Public is the absence of the field, which is the default the owner chose
   and the one no migration can get wrong: every post written before this is
   public because it has no `pv`, which is true.

   A private post is in the same timeline with a lock on it rather than in a
   place of its own. A second list is a second thing to remember to look at.

   It is held long, not switched: the button that sends a post is the button
   that sends a post, and a person who wants the other thing holds it. */
function pwPriv(){ return !!PW.pv; }
function pwSetPriv(v){
  PW.pv=!!v;
  openPost();
  toast(t(PW.pv? 'post.pv.on' : 'post.pv.off'));
}
/* The draft, beside the thing that finishes it.
   「だから save a draft を底に置くのやめろって」

   One control, never two, because the bar is 390 points wide and already
   holds a back arrow, the screen's name and a filled button. Which one it is
   is not a choice: with something typed there is a draft to save, and with
   nothing typed there is no draft to save and the only thing worth offering
   is the ones already saved. Editing a post that exists offers neither -- an
   edit is not a draft. */
function pwSideHTML(){
  if(PW.ed) return '';
  if(pwHas(String(PW.ln||'').trim()))
    return '<button class="navside"' + DO('draftKeep') + '>'+
      esc(t('post.draft.save'))+'</button>';
  if(!DRAFTS.length) return '';
  return '<button class="navside"' + DO('go', ["drafts"]) + '>'+
    esc(tn('post.drafts', DRAFTS.length))+'</button>';
}
/* The bar is FORM.right and openPost() is the only thing that builds it, so
   typing would not change it -- and what it says depends on whether anything
   has been typed. Patched by id, the way the counter beside the field is. */
function pwSidePaint(){
  var e=document.getElementById('pw-side');
  if(e) e.innerHTML=pwSideHTML();
}
/* The thing that finishes it goes in the top bar, filled, where every phone
   puts it -- not at the foot of a screen you have to scroll to. */
function openPost(from){
  /* The + button, and what it opens is what its name says: a post. Not a
     reply, and not an edit.

     PW is where a half-written post lives, and it outlives the screen on
     purpose -- going to look a word up must not throw away what was typed.
     viewReset() does blank it, but viewReset() runs when the open LANGUAGE
     changes and at no other moment, so between two visits to the composer
     nothing clears PW at all. Start a reply, back out without sending, press
     + an hour later: PW.to is still the post you were answering and the
     composer opens as a reply to it.
     「＋ボタンは毎回ふつうの投稿のはずなのに、返信が残っていることがある」

     Only what made it not an ordinary post is dropped, and the two states are
     not dropped the same way:

       to   goes, the line STAYS. Somebody typed that line themselves and this
            button is not a delete.
       ed   takes the whole composer with it. The line there is not something
            somebody typed for a new post -- postEdit() put the existing
            post's own text into it -- so handing it to a new post would be
            offering somebody their own post back as a draft of itself.

     `ed` is the same fault as `to` and was not in what was reported; it is
     fixed here because it is one line further down the same object and
     leaving it would mean pressing + could still save over a post that
     already exists. */
  if(from==='new'){
    if(PW.ed) PW=pwBlank();
    else PW.to='';
  }
  /* Opened from the day's sentence, and that is the only OTHER argument this
     takes.
     The meaning arrives already written and cannot be changed, which is the
     whole of what makes the day work: two hundred posts mean the same thing,
     so two hundred alphabets are readable at once. 「消せないようにしよう
     そこからのやつは。じゃないと意味ないもん」

     What travels is PW.pr -- the row's id -- not the words. The words are in
     PW.mn so somebody can see what they are answering; the LINK is a column
     on the post (schema.sql § asked), so it cannot be edited away and every
     answer to one day is one query rather than a search for a piece of text.

     Set once, and only on a composer that has nothing in it: pressing the row
     with a half-written post open would otherwise throw away what was there. */
  if(from==='day' && DAY && !PW.pr && !PW.ln && !PW.mn){
    PW.pr=DAY.id; PW.mn=daySay();
  }
  /* A post has a writer. Nothing on the timeline is reachable signed out --
     snsLocked() is what the three tabs answer with -- but a form is a route
     and a route can be come back to, so the composer says so itself rather
     than trusting that nobody arrived here another way. The feed is where
     the door is. */
  if(!netSignedIn()){ go('feed'); return; }
  openForm('post:', t(PW.ed? 'post.edit' : 'post.new'), pwHTML(), pwKeepKb,
    '<span class="navside-w" id="pw-side">'+pwSideHTML()+'</span>'+
    /* Held rather than tapped: 「postボタン長押しで、自分専用の日記みたいなポスト
       とみんなに公開するポストカード選べるように」 A long press is a second
       thing one button can be, and the delegated listener only knows about
       presses -- so this is the one control in the app with a timer on it,
       and it is here rather than in act.js because it is one button and not a
       kind of button. */
    '<button class="navdo'+(pwPriv()? ' pv':'')+'" id="pw-go"' + DO('pwSend') + '>'+
      (pwPriv()? ICON_LOCK : '')+
      /* The lock says which it is. "Post to yourself" as a WORD pushed the
         screen's own name off the top of it, and a mark beside a verb is what
         a bar that narrow has room for. */
      esc(t(PW.ed? 'post.save' : 'post.send'))+'</button>', true);
}
/* The timer, wired after the screen is drawn. Holding turns the post private
   or public again; letting go early does nothing, and the press that follows
   is swallowed so a hold never also sends. */
var pwHold=null, pwHeld=false;
function pwHoldMount(){
  var e=document.getElementById('pw-go');
  if(!e) return;
  e.onpointerdown=function(){
    pwHeld=false;
    pwHold=setTimeout(function(){ pwHeld=true; pwSetPriv(!pwPriv()); }, 480);
  };
  e.onpointerup=e.onpointercancel=e.onpointerleave=function(){
    if(pwHold){ clearTimeout(pwHold); pwHold=null; }
  };
  e.onclick=function(ev){
    if(pwHeld){ ev.stopPropagation(); ev.preventDefault(); pwHeld=false; }
  };
}
/* ---- what was written and not sent -------------------------------------
   「保存で下書き」 A draft is the composer, kept. It is stored beside the
   posts and it is the person's work: nothing prunes it, nothing ages it out,
   and saving one never overwrites another.

   Where you get back to one is inside the composer, which is where you were
   when you saved it. */
var LS_DRAFTS='lingua.drafts';
var DRAFTS=[];
function draftsRead(){
  try{ DRAFTS=JSON.parse(localStorage.getItem(LS_DRAFTS)||'[]')||[]; }catch(e){ DRAFTS=[]; }
  if(Object.prototype.toString.call(DRAFTS)!=='[object Array]') DRAFTS=[];
}
function draftsSave(){
  try{ localStorage.setItem(LS_DRAFTS, JSON.stringify(DRAFTS)); }catch(e){}
}
draftsRead();
/* Saved as it stands: the line, the meaning, whom it answers, the pictures
   with their letters still placed on them, the recording, and whether it was
   going to be private. Not baked -- a draft is not a post, and baking is what
   sending does. */
function draftKeep(){
  if(!PW.ln && !pwPics().length && !(PW.vo && PW.vo.b64)){ toast(t('post.none')); return; }
  DRAFTS.push({at:Date.now(), ln:PW.ln, mn:PW.mn, to:PW.to, pr:PW.pr||0,
               pics:pwPics(), vo:PW.vo||null, pv:!!PW.pv});
  draftsSave();
  PW=pwBlank();
  toast(t('post.draft.kept'));
  goTab('feed');
}
/* Opening one takes it out of the list: it is the composer again, and a draft
   that is open in two places at once is a draft about to be duplicated. */
function draftOpen(i){
  i=parseInt(i, 10)||0;
  var d=DRAFTS[i];
  if(!d) return;
  DRAFTS.splice(i, 1);
  draftsSave();
  if(here().r==='drafts') back();
  PW=pwBlank();
  PW.ln=d.ln||''; PW.mn=d.mn||''; PW.to=d.to||''; PW.pr=d.pr||0;
  PW.pics=d.pics||[]; PW.pv=!!d.pv;
  if(d.vo) PW.vo=d.vo;
  openPost();
}
function draftDrop(i){
  i=parseInt(i, 10)||0;
  if(!DRAFTS[i]) return;
  if(!confirm(t('post.draft.del.q'))) return;
  DRAFTS.splice(i, 1);
  draftsSave();
  render();
}
/* A page of its own. 「下書きはそこに入れないで。別ページに飛ぶ感じで」 A list
   at the foot of the screen you are writing on is a list under the thing it
   is about, and the two are read as one screen -- so the drafts are somewhere
   you go, and the composer carries only the way there. */
function vDrafts(){
  var out='', i, d;
  for(i=DRAFTS.length-1;i>=0;i--){
    d=DRAFTS[i];
    out+='<div class="dfrow">'+
      '<button class="dfb"' + DO('draftOpen', [i]) + '>'+
        (d.pv? '<span class="ppv">'+ICON_LOCK+'</span>' : '')+
        '<span class="dfl">'+esc(d.ln || d.mn || t('post.draft.empty'))+'</span>'+
        '<span class="dfw">'+esc(postWhen(d.at))+'</span></button>'+
      '<button class="dfx"' + DO('draftDrop', [i]) + ' aria-label="'+
        esc(t('post.draft.del'))+'">'+ICON_MINUS+'</button>'+
      '</div>';
  }
  return '<div class="view">'+navTop()+'<div class="body">'+
    (out || '<div class="note">'+esc(t('post.draft.none'))+'</div>')+
    '</div></div>';
}
FORM_OPEN.post=function(){ openPost(); };
/* Word by word, and the row is always there even when it is empty, so the
   one thing that changes as you type has somewhere to be put. */
/* What the meaning field starts as, and what its placeholder says: the gloss
   run together. It was worked out in three places and they have to agree --
   what you are offered has to be what you get if you type nothing. */
/* The line as the rest of the app reads it. What is in the field may be what
   the Lingua keyboard typed, which is the private use area; everything below
   the field works on the roman spelling. */
function pwLn(){ return puaRoman(PW.ln); }
function pwMn(){ return postGlossLine(postGloss(pwLn())); }
/* And the row of it, which is drawn once when the screen is built and again
   on every letter typed. */
function pwGl(){ return postGlossHTML(postGloss(pwLn())); }
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
/* And how big the one in the TIMELINE is, which is a different question and
   was being answered with the same number. A row shows a picture a few
   hundred pixels across and was being sent one nine hundred across, so nine
   tenths of every byte a timeline costs was pixels nobody could see -- and
   the timeline is the only thing in this app that anybody scrolls. Pressing
   it still opens the photograph itself, at POST_PIC.

   It is measured, not guessed: at 300 across a picture is 6-10 KB where the
   same one at 900 is 60-100. Fifty pictures scrolled past is 400 KB instead
   of 4 MB.

   Resized here rather than in net.js because it is a canvas, and net.js is
   the window onto the server rather than a place that draws. */
var POST_THUMB=300;
/* Nothing is stored on the phone for this: the small copy is made at the
   moment the picture goes up and exists only in Storage. A picture already
   smaller than POST_THUMB has no small copy -- '' rather than a second file
   of the same bytes -- and postThumbs() draws the photograph for it. */
function postThumb(u, ok){
  var im=new Image();
  im.onload=function(){
    var k=Math.min(1, POST_THUMB/Math.max(im.width, im.height)), c, x, out='';
    if(k>=1){ ok(''); return; }
    c=document.createElement('canvas');
    c.width=Math.round(im.width*k); c.height=Math.round(im.height*k);
    x=c.getContext('2d');
    x.drawImage(im, 0, 0, c.width, c.height);
    try{ out=c.toDataURL('image/jpeg', POST_PICQ); }catch(e){ out=''; }
    ok(out);
  };
  im.onerror=function(){ ok(''); };
  im.src=String(u||'');
}
/* What the timeline may take up. localStorage is one allowance shared by the
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
  var p=sharePlug(), room=POST_PICS-pwPics().length;
  if(!p){ toast(t('post.pic.no')); return; }
  if(room<1){ toast(t('post.pic.many', POST_PICS)); return; }
  /* How many more this post has room for. It asked for one every time, so a
     post that holds four took four trips through the picker -- and the picker
     would not let a second be selected anyway. 「投稿画面画像最大4枚なのに1枚
     しか選択できない」 */
  p('LinguaShare', 'pickPhoto', {max:POST_PIC, limit:room}).then(function(r){
    /* `b64s` is every one that was chosen. `b64` is the first, and is what a
       phone with the older native side answers with -- so it is the fallback
       and not a second way of asking. */
    var many=(r && r.b64s && r.b64s.length)? r.b64s
             : ((r && r.b64)? [r.b64] : []);
    if(!many.length) return;
    pwPicKeepAll(many, 0);
  })['catch'](function(){ toast(t('post.pic.bad')); });
}
/* One at a time and in order: each has to be drawn onto a canvas to be
   squeezed, which is a load away, and pwPicKeep() ends by rebuilding the
   screen. Rebuilding it four times in a row would put the caret back to the
   end of the line four times, so the screen is built once, at the end. */
function pwPicKeepAll(list, i){
  if(i>=list.length){ openPost(); return; }
  pwPicKeep('data:image/jpeg;base64,'+String(list[i]), function(){
    pwPicKeepAll(list, i+1);
  });
}
/* Not cropped. A face is shown in a circle so the sides of a landscape photo
   were never going to be seen; a post shows the picture, so what was taken is
   what goes up. Only the long edge is brought down. */
function pwPicKeep(url, then){
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
    if(then) then(); else openPost();
  };
  im.onerror=function(){ if(then) then(); else toast(t('post.pic.bad')); };
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
/* Two things, and they no longer live together. The strip of photographs
   belongs with what is being written -- it moves down the page as the line
   grows, the way it does on Twitter 「文字が増えたら画像が下にいく仕様にして」 --
   and the row that ADDS one belongs on the bar above the keyboard, where a
   thumb is already resting. 「写真と音声とかのボタンはTwitterと同じようにキー
   ボード上に固定して」 */
function pwStripHTML(){
  var ps=pwPics();
  if(!ps.length) return '';
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
    '</div></div>';
}
function pwAddHTML(){
  var ps=pwPics();
  return ''+
    /* The camera and the library go at four rather than refusing at four: a
       button that is there and says no is a button you press twice. The
       microphone does not -- a voice is not a fifth picture.
       「📷 ライブラリ マイクボタンにして」

       `capture` is the whole of the camera. There is no plugin and no Swift
       behind it: an image field carrying that word is what tells iOS to open
       the camera instead of the picker, and it is the same photograph either
       way once it arrives. */
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
      pwVoAddHTML();
}
/* The line as it will actually look, under the field.

   The field could not BE vertical -- a column was not something this webview
   would let anybody type into -- so a language that runs down the page was
   typed across and posted downward, and the first time somebody saw the shape
   of their own sentence was after it had gone.
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
/* And what this phone has DELETED, which is the other half of the same
   question and was missing.

   Deleting a post ends in render(); on the timeline render() is vFeed(), and
   vFeed() calls snsPull() every time it runs. So the DELETE going up and the
   GET coming down are in the air together, and the GET was sent against a
   server that still had the row. postTake() then asked "have I got this one"
   -- and the honest answer was no, because it had just been thrown away --
   so it put it straight back. Pressing delete a second time worked because by
   then the first DELETE had landed and the timeline no longer carried it.
   「編集した投稿を消しても一回で消えない。二回押さないと消えない」

   It only ever happened to a post that is ON the server: netDrop() returns
   without asking anything when there is no `sid`, and a post the server has
   never heard of cannot come back from it. A post you have edited is one you
   posted, which is why that is the way to meet this.

   In memory and not on disk, deliberately. This is here to outlive one pull,
   not one install: if the DELETE really did fail, the post really is still on
   the server, and it should come back at the next launch rather than being
   hidden by a phone that remembers a delete the server never did. Nothing new
   is stored and nothing has to be expired. */
var POST_GONE={};
function postTake(ps){
  var have={}, i, p, n=0;
  /* By BOTH names. A post this phone wrote has a local id and, once it has
     gone up, the server's -- and it comes back down the timeline wearing the
     server's. Without the second line every post somebody wrote would appear
     twice the first time they pulled the feed after writing it. */
  for(i=0;i<POSTS.length;i++){
    have[POSTS[i].id]=1;
    if(POSTS[i].sid) have[POSTS[i].sid]=1;
  }
  for(i=0;i<(ps||[]).length;i++){
    p=ps[i];
    if(!p || !p.id || have[p.id]) continue;
    if(POST_GONE[p.id] || (p.sid && POST_GONE[p.sid])) continue;
    have[p.id]=1;
    POSTS.push(p);
    n++;
  }
  if(n) savePosts();
  return n;
}
/* Where the server keeps it. Written when a push comes back and read for two
   things: whether this post has gone up at all, and what to point a reply at.

   It is not the post's id. Rewriting an id would move it out from under
   every reply that already points at it, and the phone is allowed to have
   posted something the server has never heard of -- a post written in a
   tunnel is a post. */
function postSid(p, sid){
  if(!p || !sid || p.sid===sid) return;
  p.sid=String(sid);
  savePosts();
}
/* Everything already on this phone that the server has never seen.
   「あげよう」

   It walks oldest first, so a thread goes up in the order it was written and
   a reply finds its parent's `sid` already there. A few at a time: this runs
   off the back of a timeline pull, and forty posts in one breath is a phone
   that appears to have frozen.

   Nothing is removed, nothing is rewritten, and a post that fails is simply
   one that still has no `sid` -- so the next pull tries it again. A post kept
   to yourself never goes, which is the same door pwSendWith() uses. */
var POST_CATCH=4;
function postCatchUp(){
  var i, n=0, ps;
  if(!netSignedIn()) return;
  ps=POSTS.slice().sort(function(a, b){ return (a.at||0)-(b.at||0); });
  for(i=0;i<ps.length && n<POST_CATCH;i++){
    if(ps[i].sid || ps[i].pv || !ps[i].mine) continue;
    n++;
    /* The closure is the post, so a slow answer lands on the right one. */
    (function(p){
      netPush(p, function(sid){ postSid(p, sid); }, function(){});
    })(ps[i]);
  }
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
/* The mark itself, in one place, because two screens draw it to answer two
   different questions and only the picture is shared. The plans screen asks
   "does THIS PLAN carry the mark" -- a fact about a price list, true of the
   Pro row whoever is reading it. A post asks "does the person holding this
   phone have it", which is a capability and goes through can(). */
function badgeMark(){
  return '<span class="bdgw plus" aria-hidden="true">'+MARK_PLUS+'</span>';
}
function planBadge(id){
  if(id==='pro') return badgeMark();
  return '';
}
function postBadge(p){
  if(!p || !p.mine) return '';
  /* can('badge') and not plan(). It answered the same thing on the day this
     changed and will not the first time the mark moves a rung -- which is
     the whole of why CAN exists. 「バッチはplusから」 OWNER DECISION
     2026-08-23; the rung is in core.js and nowhere else. */
  return can('badge')? badgeMark() : '';
}
/* There was a preview under the field: the line you were typing, drawn again
   in the letters you drew. It was written before the keyboard was, and the
   keyboard has one -- the candidate bar shows the run in your own shapes as
   you press, which is the same picture one row closer to your thumb. Two of
   them is the composer saying the same thing twice and eating the screen the
   post is written on. 「キーボード内にプレビューあるからいらないやろ普通に」 */
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
/* The conversation the reply is going into, and not only the post it answers.
   「返信するとき、スレッドを開いてそのスレッドを見ながら返信できるように。
   今は返信先が見えない」

   It was the one post above, in a filled rounded panel. What that could not
   show is the thing a reply is actually being written into -- a post two
   answers deep says almost nothing on its own, and going to look at the
   thread meant leaving the composer, which is where what had been typed was.

   So the whole line up to it is here, oldest first, with the post being
   answered last and therefore nearest the field. Same walk vThread() does --
   postUps() -- and a taken-down ancestor is skipped for the same reason it is
   skipped there: it is somebody else's line and the conversation does not
   stand or fall with it.

   It scrolls inside itself rather than pushing the field down the screen. The
   cap is a third of the visible part, and it is `--vvmin` rather than `vh`
   because with the phone's keyboard up `vh` is still the whole phone -- the
   same reason the vertical field two rules down in index.html uses it. */
function pwThreadHTML(to){
  if(!to) return '';
  var ups=postUps(to), out='', i;
  for(i=0;i<ups.length;i++) if(!postGone(ups[i])) out+=pwToHTML(ups[i]);
  return '<div class="pwqs">'+out+pwToHTML(to)+'</div>';
}
function pwToHTML(to){
  if(!to) return '';
  return '<div class="pwq">'+
    '<div class="pav">'+postFace(to)+'</div>'+
    '<div class="pbody">'+
      /* The same two lines the timeline's head is folded into, and it has to
         be said here too: `.phead` stopped being the flex row that held the
         gap between these spans, so a head written the old way came out as
         `IriVethi@iri` with the words run together. A quoted post has no time
         on it and nothing to press, so the second line is only the language
         and the handle. */
      '<div class="phead">'+
        '<div class="pheadn">'+
          '<span class="pname">'+esc(postWho(to))+'</span>'+
        '</div>'+
        '<div class="pheadm">'+
          (to.lname? '<span class="plangtag">'+esc(to.lname)+'</span>' : '')+
          '<span class="phandle">@'+esc(to.hd||'')+'</span>'+
        '</div>'+
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
      pwThreadHTML(to) : '')+
    /* The face you are about to post under, which is the one this post will
       carry -- worked out here, on the making side, where the letters are. */
    '<div class="pwscroll">'+
    '<div class="pwtop"><div class="pav">'+
      postFace({who:meName(), lname:langName, av:postAvatar()})+'</div>'+
    '<div class="pwfield">'+
      /* The field runs the way the language does, and is set in the letters
         somebody drew. It was neither: flat, in roman, above a post that
         came out in columns of drawn shapes -- so what you were writing and
         what you had written were two different-looking things.
         「自作文字で出せ、向きも縦向きになってないけど」

         `.sfont` is what puts the drawn letters in a field and it was on
         every other one. Nothing is flattened here any more: a column IS
         typed into now, and lnFit() measures the width when the writing-mode
         is vertical, because that is the way a column grows. */
      /* Not `fitin` any more. That said "the layout gives this field its
         height", which is what a field takes when it is the only thing that
         can stretch -- and it was, so a photograph sat under the fold and the
         line never grew. The page scrolls now, so the field is as tall as
         what is in it and everything under it moves down. */
      lnField('pw-ln', t('post.ln.ph'), ' maxlength="'+POST_MAX+'"'+IN('pwSetLn'),
        PW.ln, dirClass(scriptDir())+(myFontOn()? ' tfont' : ''))+
      '<div class="pwgl" id="pw-gl">'+pwGl()+'</div>'+
      /* The meaning sits in the same column as the line, in the same
         borderless field, because it is the second half of the same act. */
      /* Read-only when it is the day's sentence. Not disabled: a disabled
         field is greyed out and unselectable, and this one is the thing you
         are reading while you write. */
      '<input id="pw-mn" class="pwmn" value="'+esc(PW.mn)+'" '+
        (PW.pr? ' readonly' : '')+
        ' placeholder="'+esc(pwMn() || t('post.mn'))+'"' +
        IN('pwSetMn') + '>'+
      /* Editing is the line and the meaning. There is nothing to add a
         photograph or a voice to -- the post already has whatever it has --
         so the row that adds them is not there rather than there and
         refusing. */
      (PW.ed? '' : pwStripHTML())+
      '</div></div>'+
    '</div>'+
    /* The bar. It is the last thing in the form and the only thing that does
       not scroll, so it sits on the keyboard whatever is above it. The count
       is on it rather than in the column, because it is about the whole line
       and not about a place in it. */
    (PW.ed? '' :
      '<div class="pwbar">'+pwAddHTML()+
        '<span class="pwbleft" id="pw-left">'+pwLeftHTML()+'</span></div>');
}
/* Typing patches the one thing that changed and nothing else: rebuilding the
   body would put the caret back at the end of the field on every letter.

   But openForm() keeps the body as a STRING, so a screen that only patches
   the document is a screen whose form goes stale the moment anything calls
   render() -- come back from the card and the line you were typing is gone.
   So the string is kept in step too, without redrawing anything. */
function pwFresh(){ if(FORM && FORM.key==='post:') FORM.html=pwHTML(); }
/* ---- the keyboard is up the whole time this screen is ------------------
   OWNER 2026-08-25「投稿開いたらキーボードが自動で出て下ろせないが正解」.

   Two things came out of one cause. The row of pictures floated in the middle
   of the screen when the composer opened, because it is laid out to `--vvmin`
   -- the smallest the visible part has been -- and until a keyboard has
   actually been up that is a GUESS (55%). Nothing focused the field, so on a
   phone the guess was what you saw until you tapped.

   With the field focused from the moment the screen exists there is no moment
   the guess is used, and the answer to "where does the row go when the
   keyboard is down" is that it never is.

   `preventScroll` because iOS otherwise scrolls the layout viewport to lift
   the field, and this screen is pinned to the visual viewport instead -- the
   two together took the bar off the top of the phone. */
function pwKeepKb(){
  if(!FORM || FORM.key!=='post:') return;
  if(here().r!=='form' || here().a!=='post:') return;
  var e=document.getElementById('pw-ln');
  if(!e || document.activeElement===e) return;
  /* Something else on this screen has it -- the meaning, or a letter being
     placed on a photograph. That is not the keyboard going down. */
  var a=document.activeElement;
  if(a && a!==document.body && a.tagName &&
     (a.tagName==='INPUT' || a.tagName==='TEXTAREA')) return;
  try{ e.focus({preventScroll:true}); }catch(err){ e.focus(); }
}
/* It goes down by the field losing focus, and there is no key on an iPhone
   that does anything else -- so putting it back is the whole of "it cannot be
   lowered". The delay is a frame: the browser has not said who has focus NEXT
   at the moment it says who lost it, and without waiting this refuses every
   press on the screen, including Post. */
function pwKbGuard(){
  if(!FORM || FORM.key!=='post:') return;
  setTimeout(pwKeepKb, 0);
}
function pwSetLn(v){
  PW.ln=String(v||'');
  var g=document.getElementById('pw-gl');
  if(g) g.innerHTML=pwGl();
  var m=document.getElementById('pw-mn');
  if(m) m.setAttribute('placeholder', pwMn());
  lnGrow('pw-ln');
  pwLeftPaint();
  pwSidePaint();
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
/* `readonly` is what the field wears; this is what the field cannot be
   talked out of. The attribute is a rendering and a rendering can be gone --
   a screen rebuilt from a draft, a browser that ignores it -- and the day's
   meaning being editable in ANY of those is the day not working. */
function pwSetMn(v){ if(PW.pr) return; PW.mn=String(v||''); pwFresh(); }
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
    return !!(p && (postPics(p).length || postVoAt(p)));
  }
  return !!(pwPics().length || (PW.vo && PW.vo.b64));
}
/* The letters placed on the photograph are drawn INTO it first, and after
   that there is a picture and nothing else. It is the one thing here that
   cannot happen synchronously -- an image loads -- so the rest of posting is
   below, and a bake that fails sends the photograph as it was. */
/* The line exactly as it was typed, private use code points and all. Not
   stored on anything: it lives from the press that sends to the ink being
   cut. */
var PWRAW='';
function pwSend(){
  /* Back to roman before anything is kept. What the Lingua keyboard typed is
     private use code points and they go no further than the field: a post
     carries the roman spelling and its ink, and a code point nobody else's
     font has would be a square box on somebody else's phone. */
  var ln=puaRoman(String(PW.ln||'')).trim();
  /* The line as typed, kept for the ink cut below: what the Lingua keyboard
     put there is the language, and what any other keyboard put there is not.
     It is read again inside the callbacks the bake and the voice run through,
     by which time PW may already be the next post. */
  PWRAW=String(PW.ln||'').trim();
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
            ln:ln, ink:postInkTyped(PWRAW), dir:scriptDir(),
            mn:String(PW.mn||'').trim() || postGlossLine(gl),
            pr:PW.pr||0,
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
  if(PW.pv) mine.pv=1;
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
    /* And WHO it answers, not only which post. The id is a way to find the
       post on a phone that has it; the handle is what a reader is shown, and
       a reply can perfectly well outlive the thing it answers -- deleted, or
       never arrived here at all. Same sentence as the name, the shapes and
       the language's name already on every post: what a reader needs goes ON
       it while the side that knows still exists. */
    if(up){ up.re=(up.re||0)+1; mine.toh=up.hd||''; }
  }
  POSTS.push(mine);
  savePosts();
  /* And it is told to the server, which today is told nothing. It is not
     waited on: the post is on this phone the moment it is written, and a
     person in a tunnel is still using this app. */
  /* A post kept to yourself is never told to anybody. It is the one post
     that does not go through this door at all -- not "sent and hidden",
     which is a flag somebody else's server has to be trusted with. */
  /* And the failure is SAID. It was `function(){}` -- so a post the server
     refused was a post that looked sent, on a screen that looked right, and
     nothing anywhere could tell you otherwise. That is the app being
     half-online, which is the one thing it may not be. The post itself is
     never lost either way: it is already in POSTS and postCatchUp() keeps
     trying. 「spl流したのにまだ投稿載らんの？」

     Here and not in postCatchUp(): this is the moment somebody pressed the
     button, so this is the moment they are owed an answer. The retries
     happen behind a timeline being read and must stay quiet. */
  if(!mine.pv)
    netPush(mine, function(sid){ postSid(mine, sid); },
            /* The toast and nothing else. Nothing on the screen changed: the
               post has been drawn as not-sent since the moment it was
               written, and it still is. A render() here would be the answer
               to a request redrawing a screen somebody has since moved on
               from. */
            function(d, s){ toast(netWhy(d, s)); });
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
/* The line as it was TYPED, cut into shapes and text.
   ------------------------------------------------------------------
   postInk() below cuts the roman line with the alphabet, so every letter this
   language has a shape for becomes a shape -- whichever keyboard typed it.
   That is right for a post written before this existed and wrong for one
   written now: a sentence typed on the phone's own QWERTY is not this
   language and must not arrive as it.
   「システムキーボードで打ったものが勝手に自作文字になるのはおかしい」

   What the Lingua keyboard typed is a private use code point and nothing else
   on a phone types one, so the cut is the character itself: a code point in
   the range is that letter's strokes, and everything else -- roman, kana,
   punctuation -- is text and stays text. A post already renders a run of text
   as text, which is what a half-drawn alphabet has always given. */
function postCutTyped(raw){
  var s=String(raw||''), lts=ltPuaOrder(), cut=[], txt='', i, at;
  for(i=0;i<s.length;i++){
    at=s.charCodeAt(i)-PUA0;
    if(at>=0 && at<lts.length){
      if(txt){ cut.push({t:txt}); txt=''; }
      cut.push({st:lts[at].st});
    } else txt+=s.charAt(i);
  }
  if(txt) cut.push({t:txt});
  return cut;
}
function postInkTyped(raw){ return inkOfCut(postCutTyped(raw)); }
function postInk(ln){ return inkOfCut(postCut(ln)); }
function inkOfCut(cut){
  var g=[], s=[], seen=[], i, k, key;
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

/* Layer three -- a post said again in this reader's own words -- is gone.
   ------------------------------------------------------------------
   It swapped each word of the meaning line for a word this dictionary had,
   and that is not a translation: whether `Mama seja luna` is a sentence
   depends on whether the language has a copula, how it marks possession, and
   what it does with a topic -- and none of that was anywhere the app could
   read it. Written into the grammar page's notes it is free text, which a
   machine cannot use. 「単語を並べるだけじゃ文法はできない」

   The one thing that could have read those notes is an AI, and this feature
   was built for one: `CAN.tr` said "unmetered" and the free plan got three a
   day, which is a price per call and makes no sense for a word swap done on
   the phone. There is no AI. 「AI入れないって言ってるでしょ？」

   So it is out rather than half-true. What is left is a post said in the
   letters its writer drew, which is what the timeline is for.
   「なら自分の言語でどう言うか翻訳いらなくない？元々ai前提やったし」

   `SET.trDate` and `SET.trN` are left where they are. Nothing reads them and
   nothing removes them: they are two numbers in somebody's settings and this
   app does not delete what it stopped needing. */

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
      x.font=Math.round(640*k)+'px '+cardCaps();
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
  /* Plus's, from 2026-08-23. 「ツイートの編集も課金から」

     The pencil is drawn on EVERY plan and the refusal is here, on the press,
     which is the owner's decision of 2026-08-25: 「だいたい無料で使えないやつ
     は表示させていいよ。課金させる動線を減らしたくない」「無料はタップすると
     課金ページに飛ばされる」. Hiding it was the older shape and it cost the
     one thing a closed door is for -- nobody buys what they cannot see.

     go() and not a toast, and this is the opposite of what capStop() does
     four screens away. That one is a ceiling arrived at halfway through
     typing a word, where moving somebody is taking the screen off them; this
     is a door pressed on purpose, where the plans screen is the answer to
     what was just asked. The two are in the decision log side by side.

     WHAT WAS WRONG WITH IT: it went. It did not ask, it did not say, it moved
     somebody from the timeline to a price list with nothing in between.
     「編集はplusプランからです。みたいなポップなしに課金画面飛ばされる」

     Asked, the way this app already asks in the three other places a plan
     stops somebody -- core.js:522 (a second language), core.js:703 (the
     hundredth word), keyboard.js:349 (a fifth keyboard). All three are

         if(confirm(<what the ceiling is> + '\n\n' + t('up.cta'))) go('plans');

     and the pencil is now the fourth. The decision of 2026-08-25 is kept
     whole: pressing it still goes to the plans screen. What changed is that
     it goes when somebody says to.

     AND THE SENTENCE IS THERE NOW. It was missing when the confirm() landed,
     and asking with `up.cta` alone was a dialog that named no ceiling -- the
     only one of the four like that. OWNER 2026-08-25, asked and answered:
     「投稿の編集はplusプランからです」. `post.editplan` is that sentence, and
     the plan is written into it rather than read off `CAN.edit`, because what
     the owner settled is this sentence and not a rule about tiers. If `edit`
     ever moves off plus, this string moves with it. */
  if(!can('edit')){
    if(confirm(t('post.editplan')+'\n\n'+t('up.cta'))) go('plans');
    return;
  }
  PW=pwBlank();
  PW.ed=p.id; PW.ln=String(p.ln||''); PW.mn=String(p.mn||'');
  openPost();
}
function pwSaveEdit(ln){
  var p=postById(PW.ed), mn;
  if(!p || !p.mine){ toast(t('post.gone')); PW=pwBlank(); goTab('feed'); return; }
  mn=String(PW.mn||'').trim() || postGlossLine(postGloss(ln));
  p.ln=ln; p.ink=postInkTyped(PWRAW); p.mn=mn;
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
/* How long ago, and then WHEN. Under a day it is how long ago, because that
   is what anybody wants of something from this morning. Past a day it is the
   date, because "9d" is not a time -- it is arithmetic somebody has to do,
   and the answer they wanted was a day of the year. 「ツイートに時刻ある？」

   The date is the phone's own: toLocaleDateString with the interface language,
   so it comes out the way that language writes a date and this file does not
   have to know how ten of them do. The year is dropped inside this one, the
   way every timeline drops it. */
function postWhen(at){
  var s=Math.floor((Date.now()-(at||0))/1000), d, now;
  if(s<60) return t('when.now');
  if(s<3600) return t('when.m', Math.floor(s/60));
  if(s<86400) return t('when.h', Math.floor(s/3600));
  d=new Date(at||0); now=new Date();
  try{
    return d.toLocaleDateString(uiLang(),
      (d.getFullYear()===now.getFullYear())
        ? {month:'short', day:'numeric'}
        : {year:'numeric', month:'short', day:'numeric'});
  }catch(e){ return t('when.d', Math.floor(s/86400)); }
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
/* Every picture on a post, as something an <img> can be given.

   Three shapes, and the order is the point. What is ON THIS PHONE comes
   first: a post somebody just wrote has its pictures in hand and draws them
   at once, with no network and no wait -- which is what makes your own
   timeline instant. Only a post that arrived from somewhere else falls to
   `pu`, the paths in Storage, and those load as they arrive. 「Xとかインスタ
   とかと同じ動きにしてね」

   `p.pic` is the single picture a post carried before it could carry four,
   and it is read and never written. A post from that week still draws. */
function postPics(p){
  var out=[], i;
  if(!p) return [];
  if(Object.prototype.toString.call(p.pics)==='[object Array]' && p.pics.length)
    return p.pics;
  if(Object.prototype.toString.call(p.pu)==='[object Array]' && p.pu.length){
    for(i=0;i<p.pu.length;i++) out.push(netMediaURL(p.pu[i]));
    return out;
  }
  return p.pic? [p.pic] : [];
}
/* What the TIMELINE draws, which is postPics() only when there is nothing
   smaller. Three answers again and the order is the same one:

     on this phone   the picture is in hand and already decoded. Drawing a
                     smaller copy of it would cost a frame to save nothing --
                     nothing is downloaded either way
     `pt`            the small copies in Storage, one per picture
     anything else   the photograph, which is what every post written before
                     this carries and is not a failure

   Per picture and not per post: a small copy that failed to go up leaves a
   gap in `pt`, and a list that closed the gap would put picture two's
   thumbnail under picture one. */
function postThumbs(p){
  var full=postPics(p), out=[], i, t;
  if(!p) return full;
  if(Object.prototype.toString.call(p.pics)==='[object Array]' && p.pics.length)
    return p.pics;
  if(Object.prototype.toString.call(p.pt)!=='[object Array]' || !p.pt.length)
    return full;
  for(i=0;i<full.length;i++){
    t=p.pt[i];
    out.push(t? netMediaURL(t) : full[i]);
  }
  return out;
}
/* A post that is not there any more, where the post somebody came to read
   was. Only there: 「スレッドは本ツイートだけね？それ以外の会話は本ツイート
   とは関係ないものとする」 -- a reply that went simply is not in the list,
   because a conversation is not one thing and the rest of it does not stand
   or fall with any one line in it.

   A state and not an explanation -- 「アプリ内に説明書くの禁止」 -- so it is
   one line, and it says nothing about who did it or why. */
function postTomb(){
  return '<div class="ptomb">'+esc(t('post.rules'))+'</div>';
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
/* Where this post's voice is, as one string, and the one place that decides
   between the two answers. On this phone it is `vo.f`, a name in Documents;
   from anywhere else it is `vu`, a path in Storage. voPlay() takes either and
   tells them apart by the slash -- and it can only do that because both are
   asked for here rather than in each of the four places that want one. */
function postVoAt(p){
  if(!p) return '';
  if(p.vo && p.vo.f) return String(p.vo.f);
  return p.vu? String(p.vu) : '';
}
function postVoMs(p){ return (p && p.vo && p.vo.ms) || 0; }
/* The voice on a post, and it renders from the post. A post with none has no
   row, not an empty one. rec.js (chapter 25) is the other half. */
function postVoHTML(p){
  var at=postVoAt(p);
  if(!at) return '';
  return '<button class="povo'+((VOAT===at)? ' on':'')+'" data-f="'+esc(at)+'"' +
    DO('voPlay', [at]) + ' aria-label="'+esc(t('post.vo.play'))+'">'+
    ICON_SPK+'<span class="vot">'+esc(voLen(postVoMs(p)))+'</span></button>';
}
/* ---- the conversation a post is in -------------------------------------
   A reply carries `to`, the id of what it answers, and `toh`, the handle of
   whoever wrote that. Both, and for different readers: the id is how the two
   are put back together on a phone that has them both, and the handle is what
   is shown -- which has to be on the reply itself, because the post it
   answers may not be here.

   Everything in this block is read-side: it asks POSTS what points at what,
   and nothing else. */
function postToWho(p){
  var up;
  if(!p || !p.to) return '';
  if(p.toh) return String(p.toh);
  /* A reply written before a reply carried the handle. The parent is asked
     when the parent is here, and the line is left off when it is not --
     which is the truth about it. Nothing is invented and nothing is
     back-filled onto somebody's post. */
  up=postById(p.to);
  return (up && up.hd)? String(up.hd) : '';
}
/* The answers to one post, oldest first, because a conversation reads down. */
function postKids(id){
  var out=[], i;
  if(!id) return out;
  for(i=0;i<POSTS.length;i++) if(POSTS[i].to===id) out.push(POSTS[i]);
  return out.sort(function(a, b){ return (a.at||0)-(b.at||0); });
}
/* What is above a post: everything it is an answer to, oldest first. Bounded
   by how many posts there are, because `to` is a number that arrived on a
   post and a chain that points back at itself is a phone that stops. */
function postUps(p){
  var out=[], n=0, up=p;
  while(up && up.to && n<POSTS.length){
    up=postById(up.to);
    if(!up) break;
    out.unshift(up);
    n++;
  }
  return out;
}
/* And everything below it, flattened depth-first, each one carrying how deep
   it is. `seen` is the same guard as the walk above: an answer that answers
   itself is a page that never finishes drawing. */
var THREAD_IN=3;
function postDown(id, d, out, seen){
  var ks=postKids(id), i;
  for(i=0;i<ks.length;i++){
    if(seen.indexOf(ks[i].id)>=0) continue;
    seen.push(ks[i].id);
    out.push({p:ks[i], d:d});
    postDown(ks[i].id, d+1, out, seen);
  }
  return out;
}
/* The post a thread is opened ON. It is the one row on that screen that is
   not a way somewhere else, and it does not need remembering anywhere:
   which post a thread is about is the route's argument, which is where the
   answer already is. */
function postFocus(){
  var h=here();
  return (h && h.r==='thread')? String(h.a||'') : '';
}
/* Tapping a post opens the conversation it is in.
   「リプライ含めツリーが見れないのちょっと厄介」 A button inside the row wins
   over this, because act.js delivers a press to the nearest name above the
   thumb -- so reply, like, boost, share and the ... all still do their own
   thing and the rest of the row is the way in. */
function postOpen(id){
  if(postById(id)) go('thread', id);
}
function postRow(p){
  var foc=(postFocus()===p.id), to=postToWho(p);
  return '<div class="post'+(foc? ' pfoc':'')+'"'+(foc? '' : DO('postOpen', [p.id]))+'>'+
    '<div class="pav">'+postFace(p)+'</div>'+
    '<div class="pbody">'+
      /* Two lines, not eleven things on one.
         「名前 言語名 ユーザー名 日付 編集済み ↑これ全部一列に表示すると
         なにも見えない」 This was ONE flex row carrying the name, the badge,
         the language, the handle, a dot, the time, the lock, the unsent mark,
         "edited", "taken down", the pin and the ... -- twelve things, on a
         phone, in the width of a post. `.pname` has `text-overflow:ellipsis`,
         so what actually happened is that the name -- the one thing on the
         line somebody is looking for -- gave up its width first and came out
         as two characters and a dot.

         The fold is by what the thing IS, not by what fits. WHO wrote it, and
         the ... that acts on it, are what the post is; they are line one and
         the name has the whole width to itself. WHEN it was written and WHAT
         STATE it is in are line two, quiet and small.

         Nothing was added and nothing was taken away -- the same spans, in
         the same order, folded once. No chips in a row and no corners: the
         second line is text separated by spaces, which is what the rest of
         this app does with a line of small facts. */
      '<div class="phead">'+
        '<div class="pheadn">'+
          '<span class="pname">'+esc(postWho(p))+'</span>'+
          /* WHEN, on the first line beside the name. OWNER 2026-08-25:
             「名前　まるまる分前　バッチ / @ 編集済み　🔑」 -- and the reason is
             that the second line stopped fitting. With a long name, a language
             name, a long handle, the lock and "edited" all on it, the head came
             out THREE lines, and a reply put a fourth under them; "edited" fell
             onto a line by itself. The fixture's `Aya` / `Shango @aya · 15分` is
             short enough that nobody had seen it. */
          '<span class="pwhen">'+esc(postWhen(p.at))+'</span>'+postBadge(p)+
          /* The ... and, when it is the one that is open, the menu hanging off
             it. It is IN the post rather than a screen you go to, so what you
             are choosing about stays in front of you. 「画面遷移じゃなくて投稿の
             横にメニュー出てきて欲しい」

             On every post, not only your own. It was yours only, which meant
             the one post you might need to do something about -- somebody
             else's -- was the one with nothing on it.

             It is on the first line because it acts on the post rather than
             describing it, and because a 44pt target has to sit on the line
             that is 44pt tall. */
          '<span class="pmw">'+
            '<button class="pmore"' + DO('postMore', [p.id]) + ' aria-label="'+
              esc(t('post.more'))+'">'+ICON_DOTS+'</button>'+
            (PMENU===p.id? postMenuHTML(p) : '')+
            '</span>'+
        '</div>'+
        '<div class="pheadm">'+
          /* WHAT IT IS, and no longer what it is written IN. The language name
             came off this line -- OWNER 2026-08-25 「多すぎるから言語名表示
             なくそう。プロフいけば見れる」 -- and that last clause was checked
             before it was believed: `whoCard()` in me.js draws `p.lname` as a
             row you press, which goes to "about". It is one tap away, not gone.
             `plangtag` itself stays: post.js:795 (who you are replying to) and
             sns.js:510 (a person in a list) both still wear it.

             The `·` went with it. It was there to part `@aya` from `15分`, the
             time is on the line above now, and it was worn in this one place --
             so its rule came out of index.html in the same commit, or `press`
             would report a class nothing wears. */
          '<span class="phandle">@'+esc(p.hd||'')+'</span>'+
          /* Kept to yourself, then edited. OWNER 2026-08-25:「🔑と編集済み
             逆にしたら終わりかな」-- asked for the other way round first and
             swapped after looking at it. The two are not the same kind of
             fact: the lock is WHO CAN SEE IT and the word is WHAT WAS DONE
             TO IT, and the one that decides who is reading it comes first. */
          (p.pv? '<span class="ppv" aria-label="'+esc(t('post.pv'))+'">'+ICON_LOCK+'</span>' : '')+
          (p.ed? '<span class="ped">'+esc(t('post.edited'))+'</span>' : '')+
          /* Yours, public, and not on the server yet. It was nothing at all:
             netPush() was handed an empty failure function in both places that
             call it, so a post the server refused looked exactly like one it
             took, and the only way to find out was somebody's dashboard.
             「spl流したのにまだ投稿載らんの？」

             `sid` is the server's name for this post and postSid() writes it,
             so having none is the whole of the question. A post kept to
             yourself never goes anywhere and is not waiting for anything. */
          ((p.mine && !p.pv && !p.sid)
            ? '<span class="ppv" aria-label="'+esc(t('post.unsent'))+'">'+ICON_UNSENT+'</span>'
            : '')+
          /* Taken down. Only its author is ever handed one of these -- post_read
             in schema.sql -- so it is for them, and it belongs up here beside
             the lock and "edited": a word for what state the post is in.

             Two goes at this were wrong. It said "hidden", on a post the person
             reading it can SEE, which is a word contradicting the screen it is
             written on. Then it said WHO did it, in a line of its own under the
             head -- which is the app explaining itself, and is the notice's job
             rather than this one's. 「アプリ内に説明書くの禁止」 */
          (p.down? '<span class="pdown">'+esc(t('post.down'))+'</span>' : '')+
          (p.pin? '<span class="ppin">'+ICON_PIN+'</span>' : '')+
        '</div>'+
      '</div>'+
      /* Who this answers, under the head and above the line. It is here
         rather than only on the thread page because the timeline keeps
         replies in it -- a reply sitting between two posts that have nothing
         to do with it has to say what it is, and the id it carries says
         nothing to anybody's eye. */
      (to? '<div class="pto">'+esc(t('post.re.to', '@'+to))+'</div>' : '')+
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
      (postThumbs(p).length
        ? '<div class="ppics'+(postThumbs(p).length>1? ' many':'')+'">'+
            postThumbs(p).map(function(u, i){
              /* The picture is a way in, and it wins over the row it sits in
                 because act.js delivers a press to the nearest name above the
                 thumb. Tapping the picture opens the picture; tapping beside
                 it opens the conversation. */
              return '<img class="ppic" src="'+esc(u)+'" alt=""' +
                DO('postPic', [p.id, i]) + '>';
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
/* One photograph, whole, on a screen of its own. The timeline shows it inside
   a maximum -- `--picmax` in index.html -- so a post is a post and not a wall,
   and this is where the rest of it is. 「タップしたら開くXと同じ仕様にして」 */
function postPic(id, i){
  if(postById(id)) go('photo', String(id)+':'+String(i));
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
/* The menu, and it is not the same menu on somebody else's post. Yours holds
   what you can do TO it -- pin, edit, delete. Theirs holds what you can do
   about THEM, which is the whole of what an app carrying other people's
   writing owes anybody: stop seeing them, and say something is wrong. */
function postMenuHTML(p){
  var h=String(p.hd||'');
  if(!p.mine)
    return '<span class="pmenu" data-pm="1">'+
      '<button class="pmi"' + DO('meBlock', [h]) + '>'+ICON_BLOCK+
        '<span>'+esc(t(meBlocks(h)? 'post.unblock' : 'post.block'))+'</span></button>'+
      '<button class="pmi bad"' + DO('openReport', [p.id, h]) + '>'+ICON_FLAG+
        '<span>'+esc(t('post.report'))+'</span></button>'+
      '</span>';
  return '<span class="pmenu" data-pm="1">'+
    '<button class="pmi"' + DO('postPin', [p.id]) + '>'+ICON_PIN+
      '<span>'+esc(t(p.pin? 'post.unpin' : 'post.pin'))+'</span></button>'+
    '<button class="pmi"' + DO('postEdit', [p.id]) + '>'+ICON_PEN+
      '<span>'+esc(t('post.edit'))+'</span></button>'+
    '<button class="pmi bad"' + DO('postDel', [p.id]) + '>'+ICON_CROSS+
      '<span>'+esc(t('post.del'))+'</span></button>'+
    '</span>';
}
/* The five reasons are the server's -- `report.why` is a check constraint, so
   a sixth invented here would be refused, which is the right way round. */
var REPORT_WHY=['spam','abuse','hate','sexual','other'];
var rpFor=null;
function openReport(id, handle){
  PMENU='';
  rpFor={post:String(id||''), handle:String(handle||'')};
  openForm('report:'+id, t('post.report'),
    REPORT_WHY.map(function(w){
      return '<button class="set"' + DO('reportGo', [w]) + '>'+
        '<span class="sl">'+esc(t('report.'+w))+'</span>'+ICON_GO+'</button>';
    }).join(''));
}
FORM_OPEN.report=function(x){ openReport(x, ''); };
function reportGo(why){
  var r=rpFor;
  if(!r) return;
  rpFor=null;
  back();
  netReport(r, why, '', function(){ toast(t('report.done')); },
            function(d, s){ toast(netWhy(d, s)); });
}
/* act.js asks this before it delivers a press, and it is the whole of the
   rule: with a menu open, a press that is not part of that menu closes it and
   goes no further. Two things go through -- the menu's own rows, and the ...
   itself, which is the button that opens and closes it.

   `data-pm` is what "part of the menu" means, so a row added to the menu is
   covered by being in it rather than by being listed here as well. */
function postMenuTook(target){
  var el, d;
  /* Two menus and one rule. A post's is open on a timeline and a person's is
     open on their page, never both -- but this is the one place that closes
     either, because "a press that is not part of the menu closes it" is one
     sentence and a second copy of it is a second thing to keep in step. */
  if(!PMENU && !WMENU) return false;
  if(actOf(target, 'data-pm')) return false;
  el=actOf(target, 'data-do');
  d=el && el.getAttribute('data-do');
  if(d==='postMore' || d==='whoMore') return false;
  PMENU=''; WMENU=false;
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
  var i, gone=null, vo=null, to='', up;
  PMENU='';
  for(i=0;i<POSTS.length;i++) if(POSTS[i].id===id){
    gone=POSTS[i]; vo=gone.vo; to=gone.to||''; POSTS.splice(i, 1); break;
  }
  /* Under both names, for the reason postTake() gives about `have`: this
     phone knows it as the id it wrote, and the timeline hands it back wearing
     the server's. netRow() sets p.id and p.sid to the same server id, so the
     first of these is what actually catches it -- the second is there because
     the day a row arrives under one name and not the other, this still
     holds. */
  if(gone){
    POST_GONE[id]=1;
    if(gone.sid) POST_GONE[gone.sid]=1;
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
  netDrop(gone, function(){}, function(){});
  if(here().r==='form') back();
  render();
}
