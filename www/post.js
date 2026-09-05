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
/* ---- and these belong to an ACCOUNT, not to the phone --------------------
   「アカウント新規作成してんのにまた前のアカウント残ってんだけど」 OWNER
   2026-09-03, with a photograph of a brand new account whose 投稿 tab was
   full of the last one's timeline.

   `lingua.posts` and `lingua.drafts` are one key each, and `pfList()` picks
   your own page out of them by `p.mine` -- a flag written when the post was
   made, by whoever was signed in THEN. So the second account read the first
   one's `mine` as its own. Nothing was wrong with the server: the timeline
   comes down correctly. What was wrong is that a copy kept for working with
   no signal had no owner on it.

   www/me.js § meFor() had this exact fault in 2026-08-27 and this is its
   answer, applied to the other two keys: the copy is PARKED under the account
   that was holding it and the new account's park is read back. Nothing is
   deleted -- signing back in brings everything to the screen again, which is
   the whole of why parking rather than clearing.

   An UNCLAIMED copy is adopted, the way meFor() adopts one: a phone that has
   been posting since before this line existed carries posts with no owner,
   and they are the person who is signing in. Only on the way IN -- signing
   out of an unclaimed copy leaves it where it is. */
var POSTS_UID='';
function postParkKey(uid, k){ return 'lingua.' + k + '.' + String(uid||''); }
function postFor(uid){
  var want=String(uid||''), had=POSTS_UID, park, got;
  if(want===had) return;
  if(had){
    try{
      localStorage.setItem(postParkKey(had, 'posts'), JSON.stringify(POSTS));
      localStorage.setItem(postParkKey(had, 'drafts'), JSON.stringify(DRAFTS));
    }catch(e){}
  }
  /* Nobody has held these yet and there is something in them: they are the
     account that is arriving. */
  if(!had && want && (POSTS.length || DRAFTS.length)){
    POSTS_UID=want; savePosts(); draftsSave(); return;
  }
  POSTS=[]; DRAFTS=[];
  if(want){
    try{ park=localStorage.getItem(postParkKey(want, 'posts')); }catch(e){ park=null; }
    if(park){ try{ got=JSON.parse(park); if(got && got.length) POSTS=got; }catch(e){} }
    try{ park=localStorage.getItem(postParkKey(want, 'drafts')); }catch(e){ park=null; }
    if(park){ try{ got=JSON.parse(park); if(got && got.length) DRAFTS=got; }catch(e){} }
  }
  POSTS_UID=want;
  savePosts(); draftsSave();
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
/* A POST HAS TWO NAMES, AND EVERY LOOKUP ANSWERS FOR BOTH.
   -------------------------------------------------------------------------
   `id` is what this phone calls it and `sid` is where it lives on the server
   (postSid() above). A post this phone WROTE keeps the local name it was born
   with -- rewriting it would move it out from under every reply that already
   points at it -- so the two are different for exactly the posts the owner
   writes, and the same for everything that arrived (netRow() sets both).

   Nothing knew that. `postById()` matched `id` alone and `postKids()` matched
   `to` against whatever name it was handed, so the two names sorted one
   conversation into two halves that could not see each other:

     the reply came back from the server carrying `to` = MY POST'S sid
     the thread was opened on MY POST'S id
     -> postKids() found nothing, and the answer to a post appeared on the
        timeline and nowhere else. 「返事したはずなのにスレッドに来ない」
        OWNER 2026-09-04, and 4-home.png shows the same reply the thread in
        3-thread.png does not have.

   And the other way: a notice carries the SERVER's id, so opening a thread
   from one about your own post asked postById() for a name it refused to
   answer to and drew 「ありません」 over a post that is right here.

   So this is the one place that says whether a name is this post's, and both
   walks ask it. It is not a second lookup beside the first -- the old one is
   gone, because a phone that answers to one of a post's two names is a phone
   that has half a conversation. */
function postIs(p, id){
  return !!(p && id && (p.id===id || p.sid===id));
}
function postById(id){
  var i;
  for(i=0;i<POSTS.length;i++) if(postIs(POSTS[i], id)) return POSTS[i];
  return null;
}

/* ---- what the line means -------------------------------------------------
   OWNER 2026-09-05 単語はその単語の意味を 文法は並び替えた単語たちが文章として
   成り立つように

   This was `postGloss()` with `postGlossLine()` beside it: every word of the
   line swapped for what the dictionary says it means, and left in the order
   the invented language wrote them. That is half the job and it is the half
   this app could already do -- 「単語はその単語の意味を」 -- and the other half
   was simply not being done, so a Japanese reader was handed an English
   reader's word order and an English reader was handed a Japanese one.

   Both halves are `translate.toNatural()` in www/grammar-engine/ now, and it
   is one function rather than two here because the arrangement needs the
   parse and the parse needs the dictionary. What it cannot arrange it leaves
   in the order it was typed, which is exactly what the two functions here
   used to answer -- so nothing that was being shown stopped being shown.
   tools/grammar-engine-check.mjs holds both halves. */

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
/* It sits in the row over the keyboard, beside the microphone, and not in the
   top bar. 「マイクの横に下書きの保存されてるボタン出てこないし」
   「下書き1とか下書きに保存するみたいなボタン無くしたんだけど？」
   OWNER 2026-08-26, having found neither on a phone.

   Neither had been deleted. The top bar is 390 points wide and already holds
   a back arrow, the screen's name and a filled button, so this one was drawn
   only when there was something for it to say -- and on a first post there is
   nothing: nothing typed means no draft to save, and no drafts saved means
   nothing to go back to. It was correct and it was invisible, which for a
   control somebody is looking for is the same as absent.

   The row over the keyboard has room, and it is where the other things you
   can do to a post already are. That is not the older 「だから save a draft を
   底に置くのやめろって」 coming back: the foot of a screen you have to scroll
   to is not this row, which rides on the keyboard and is on screen the whole
   time the composer is. */
function pwSideHTML(){
  if(PW.ed) return '';
  if(pwHas(String(PW.ln||'').trim()))
    return '<button class="pwab"' + DO('draftKeep') + ' aria-label="'+
      esc(t('post.draft.save'))+'">'+ICON_DRAFT+'</button>';
  /* THE MARK IS ALWAYS HERE, and the number is not.
     「あと下書きマークは0でも出して。」 OWNER 2026-08-27, on a phone.

     It used to return nothing at all with none saved, which is the same
     shape of mistake as the one the comment above is about: correct, and
     invisible. Somebody making their first post has nothing saved by
     definition, so the one state where 「下書きというものがある」 has never
     been said is the state everybody starts in.

     The COUNT still goes when there is nothing to count. A disc with 0 in it
     is the app saying the number of things it has none of, and the name it
     is read out by follows the same line -- `post.drafts.t` is the drafts
     screen's own name, so nothing new is written down for this. */
  return '<button class="pwab"' + DO('go', ["drafts"]) + ' aria-label="'+
    esc(DRAFTS.length? tn('post.drafts', DRAFTS.length) : t('post.drafts.t'))+
    '">'+ICON_DRAFT+
    (DRAFTS.length? '<span class="pwabn">'+DRAFTS.length+'</span>' : '')+
    '</button>';
}
/* The bar is FORM.right and openPost() is the only thing that builds it, so
   typing would not change it -- and what it says depends on whether anything
   has been typed. Patched by id, the way the counter beside the field is. */
function pwSidePaint(){
  var e=document.getElementById('pw-side');
  if(e) e.innerHTML=pwSideHTML();
}
/* What pwSend() would refuse, asked before it is pressed -- the same question,
   off the same function, so the colour and the press cannot say two different
   things. A post with no line, no photograph and no voice is not a post.
   「なにもない時は薄い灰色、何か打ったら金にする」 OWNER 2026-09-03,
   www/shell.js § navDo. */
function pwOn(){ return pwHas(puaRoman(String(PW.ln||'')).trim()); }
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
     already exists.

       pr   goes, and mn goes WITH it. The day's sentence is the third way a
            composer is not an ordinary post, and it was the one missing from
            this list: open the day, back out, press + an hour later, and the
            composer still carried the day.
            「お題じゃないところ+から入ったのに戻ってまた投稿しようとすると
              そこになる」
            mn is dropped rather than kept because under `pr` it is not
            something somebody typed -- pwSetMn() returns early while `pr` is
            set, so the field is readonly and holds exactly daySay(). Keeping
            it would leave the day's words sitting in a now-editable field of
            a post that has nothing to do with the day. The LINE still stays:
            that one was typed. */
  if(from==='new'){
    if(PW.ed) PW=pwBlank();
    else { PW.to=''; if(PW.pr){ PW.pr=0; PW.mn=''; } }
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
    PW.pr=DAY.id;
    PW.mn=daySay();
    /* AND THE TAG GOES IN WHAT THEY ARE ABOUT TO WRITE. 「本文に#つけられる
       ようにしろよ」「タグは本文中に。」 OWNER 2026-09-04.

       In the LINE and not in the meaning, and that is not a preference: the
       meaning under a prompt is readonly and holds exactly daySay() (five
       lines up, and OWNER DECISION 2026-08-23 #5 「消せないようにしよう
       そこからのやつは」). The line is the one field somebody types into
       here, so it is the one place a tag can be seen and taken out again.

       It is put in, not printed: what is in that field is theirs, and
       deleting it is deleting it. The post still gathers under `pr`, which
       is a column and cannot be edited away -- so a tag somebody removes
       costs them the word and not the day. */
    PW.ln=DAY_TAG+' ';
  }
  /* A post has a writer. Nothing on the timeline is reachable signed out --
     snsLocked() is what the three tabs answer with -- but a form is a route
     and a route can be come back to, so the composer says so itself rather
     than trusting that nobody arrived here another way. The feed is where
     the door is. */
  if(!netSignedIn()){ go('feed'); return; }
  openForm('post:', t(PW.ed? 'post.edit' : 'post.new'), pwHTML(), pwKeepKb,
    /* Held rather than tapped: 「postボタン長押しで、自分専用の日記みたいなポスト
       とみんなに公開するポストカード選べるように」 A long press is a second
       thing one button can be, and the delegated listener only knows about
       presses -- so this is the one control in the app with a timer on it,
       and it is here rather than in act.js because it is one button and not a
       kind of button. */
    /* The lock says which it is. "Post to yourself" as a WORD pushed the
       screen's own name off the top of it, and a mark beside a verb is what
       a bar that narrow has room for. The ground and the lock say WHICH post
       this is; whether there IS one to send is the colour, and the colour is
       www/shell.js § navDo's two states. */
    navDo(t(PW.ed? 'post.save' : 'post.send'), 'pwSend', null, pwOn(),
          {id:'pw-go', cls:(pwPriv()? 'pv' : ''), mark:(pwPriv()? ICON_LOCK : '')}),
    true);
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

/* Every draft has a name. The ones written before there was a server to put
   them on do not, so they are GIVEN one here and written back.

   A migration that copies (docs/DATA_SAFETY.md § 2): nothing is read and then
   removed, nothing is rewritten into a new shape, and a draft that already
   has an id is not touched. It runs on the phone, once, against the only copy
   of something somebody wrote -- so the only thing it may do is add.

   netUUID() and not a counter: two phones holding the same account both name
   drafts, and a name made on one must not be a name made on the other.
   www/net.js is loaded before this file (www/index.html), which is why this
   can run where it does. */
function draftsName(){
  var i, n=0;
  for(i=0;i<DRAFTS.length;i++)
    if(DRAFTS[i] && !DRAFTS[i].id){ DRAFTS[i].id=netUUID(); n++; }
  if(n) draftsSave();
}
function draftById(id){
  var i;
  if(!id) return null;
  for(i=0;i<DRAFTS.length;i++) if(DRAFTS[i] && DRAFTS[i].id===id) return DRAFTS[i];
  return null;
}
draftsRead();
/* AND ONCE AT LOAD, for the reason www/me.js gives at the foot of meFor():
   two keys are read by two files that do not know about each other. net.js
   reads lingua.sess when it loads and this file reads lingua.posts when it
   loads, and nothing between them compared the two -- a phone signed in as
   one account while holding another's posts stayed that way until the next
   sign-in, which on a fresh account is never.

   AFTER draftsRead(), and that is not tidiness. This was two lines higher for
   an hour and it WROTE THE DRAFTS AWAY: postFor() ends by saving both, and
   before this line DRAFTS is still the empty array it was declared as -- so
   the save put `[]` over lingua.drafts on the first launch after the update.
   Nothing that reads a key may run before the key is read.

   net.js is loaded before this file (www/index.html: 3585 and 3611), so SESS
   is here to be asked. Signed out, this parks what the phone was holding,
   which is what netOut() does for the same reason. */
postFor(SESS && SESS.uid);
draftsName();
/* Saved as it stands: the line, the meaning, whom it answers, the pictures
   with their letters still placed on them, the recording, and whether it was
   going to be private. Not baked -- a draft is not a post, and baking is what
   sending does. */
function draftKeep(){
  if(!PW.ln && !pwPics().length && !(PW.vo && PW.vo.f)){ toast(t('post.none')); return; }
  /* The name it already had, if this is one that was opened again. Reusing it
     is what stops a draft opened and put back becoming two rows -- one on the
     server nobody can reach and one in front of them. */
  var d={id:PW.did || netUUID(), at:Date.now(), ln:PW.ln, mn:PW.mn, to:PW.to,
         pr:PW.pr||0, pics:pwPics(), vo:PW.vo||null, pv:!!PW.pv};
  DRAFTS.push(d);
  /* The phone FIRST and always, whatever the network is doing. A draft is on
     this phone the moment it is written, and it is written by somebody who
     may be in a tunnel: 「書いたものが signal 無しで消えるのは駄目」. The
     server is where it lives; this is the copy that works without one. */
  draftsSave();
  /* And then up. Not waited on and its failure is not said: nothing on the
     screen depends on the answer, the draft is already safe on the phone, and
     the next time the drafts are opened draftsPull() sends up anything the
     server has not got. */
  netDraftUp(d);
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
  /* A draft written before the voice became a file carries the recording
     itself (`b64`). It is put on the disk now and the draft's copy is
     replaced by the name -- one shape from here on, and nothing downstream
     has to ask which kind it was given. A draft from today is already
     `{f, ms}` and goes straight across. */
  if(d.vo && d.vo.b64) voKeep(d.vo, function(vo){ if(vo){ PW.vo=vo; openPost(); } });
  else if(d.vo) PW.vo=d.vo;
  /* The name it goes back under. Set after pwBlank() above, which does not
     know about it.

     The row on the server is NOT removed here, and that is the point: this
     takes the draft out of the LIST so that it is not open in two places at
     once (tools/draft-check.mjs), and an app that stopped here -- killed,
     crashed, battery -- would otherwise have thrown away the only copy of
     something somebody was in the middle of. It stays until the draft is put
     back over it, thrown away, or posted. */
  PW.did=d.id||'';
  openPost();
}
function draftDropGo(i){
  var d=DRAFTS[i];
  DRAFTS.splice(i, 1);
  draftsSave();
  /* And off the server, because that is where it lived. A user action behind
     a confirm, naming the one row it was given -- nothing here walks the
     table asking what is stale (docs/DATA_SAFETY.md § DELETE REVIEW). */
  if(d && d.id) netDraftDrop(d.id);
  /* AND THE RECORDING THAT WAS ONLY THIS DRAFT'S.
     「声は投稿上で再生できるよね？下書き消した時にはいらなくない？」 OWNER
     2026-09-03. The file is written when the recording ends (www/rec.js §
     voTook), so a draft thrown away without being posted is the one road that
     leaves a file nothing points at. postDelGo() says the same sentence about
     a post and this is it about a draft: the ONE file this draft named, and
     nothing else. */
  if(d && d.vo && d.vo.f) voDropFile(d.vo.f);
  render();
}
/* ---- the server's copy, come home --------------------------------------

   A draft LIVES on the server (supabase/schema.sql § not said yet); DRAFTS is
   the copy that works with no signal. So this fills in what this phone is
   missing and NEVER writes over what is here.

   That rule is docs/DATA_SAFETY.md § 2 and it is the one that matters: the
   way a copy destroys somebody's work is by winning. A draft that is on this
   phone and on the server is left exactly as this phone has it -- somebody
   may have been editing it thirty seconds ago -- and only a draft this phone
   has never seen is added.

   Both directions, for the same reason netLangSync() goes both ways: a draft
   written in a tunnel is on this phone and nowhere else, and the phone is not
   where it lives. */
/* `ok(got)` and `bad(...)`, both handed in by the one caller there is:
   askDrafts() (www/sns.js). So the drafts fall down the same one road every
   other screen's pull does -- the mark, the pop and ［再接続］ are pullRun()'s
   and are not written again here. */
function draftsPull(ok, bad){
  var done=ok || function(){};
  if(!netSignedIn()){ done(0); return; }
  netDrafts(function(rows){
    var i, k, r, b, d, seen={}, got=0;
    for(i=0;i<(rows||[]).length;i++){
      r=rows[i];
      if(!r || !r.id) continue;
      seen[r.id]=1;
      /* Open in the composer this moment. It was taken out of the list when
         it was opened, and putting it back is the same post in two places,
         which is the thing tools/draft-check.mjs holds. */
      if(PW && PW.did===r.id) continue;
      if(draftById(r.id)) continue;
      d={}; b=r.body || {};
      for(k in b) if(Object.prototype.hasOwnProperty.call(b, k)) d[k]=b[k];
      d.id=r.id;
      if(!d.at) d.at=Date.parse(r.updated_at) || Date.now();
      DRAFTS.push(d);
      got++;
    }
    if(got) draftsSave();
    /* And what the server has not got. Not waited on and not counted: each
       one answers for itself, and one that does not go up is still on this
       phone and is tried again the next time this runs. */
    for(i=0;i<DRAFTS.length;i++)
      if(DRAFTS[i] && DRAFTS[i].id && !seen[DRAFTS[i].id]) netDraftUp(DRAFTS[i]);
    done(got? 1 : 0);
  }, bad || function(){});
}
/* THE SECOND ROAD IS GONE. This was draftsPullOnce(): once for the account
   signed in, keyed on the uid, drawing for itself and swallowing a fall in
   silence -- and it sat directly beside `pullOn('drafts', askDrafts)`, which
   is the same ask down the road every other screen uses. Two ways to ask for
   one list, and only one of them put the pop up.

   It is one entry in the pull table now (`drafts`, www/sns.js), so the flag,
   the mark, the pop and ［再接続］ are the table's; the uid it was keyed on is
   pullForget(), which empties every answer when a session ends. And it is on
   PULL_OPEN, so the drafts are in hand before this screen is opened rather
   than a second after -- nothing is asked for on the way in. */
/* A page of its own. 「下書きはそこに入れないで。別ページに飛ぶ感じで」 A list
   at the foot of the screen you are writing on is a list under the thing it
   is about, and the two are read as one screen -- so the drafts are somewhere
   you go, and the composer carries only the way there. */
/* ---- choosing several drafts, and taking them away ----------------------
   「後下書きのポップも他のと合わせて欲しい」 OWNER 2026-09-02. This screen was
   the last one still carrying a MINUS on every row -- the shape the owner took
   off the letters (「やっぱりいらんかもその◉」) and replaced on the keyboards and
   the notes with 選択 / 削除 / 完了 in the bar. Same shape here, and it is
   ntSelOn/Off/List/Tap/Del in www/notes.js with drafts in it: one habit on
   every list that can lose several rows at once.

   `DFSEL` is where you are standing on this screen and not a thing about the
   drafts, so viewReset() in www/shell.js drops it. */
var DFSEL=null;
function dfSelOn(){ DFSEL={}; render(); }
function dfSelOff(){ DFSEL=null; render(); }
function dfSelList(){
  var out=[], k;
  if(!DFSEL) return out;
  for(k in DFSEL) if(DFSEL.hasOwnProperty(k) && DFSEL[k]) out.push(Number(k));
  return out;
}
function dfSelTap(i){
  if(!DFSEL) return;
  if(DFSEL[i]) delete DFSEL[i]; else DFSEL[i]=1;
  render();
}
function dfSelDel(){
  var n=dfSelList().length;
  if(!n) return;
  popAsk(tn('post.draft.sel.ask', n), function(){ dfSelDelGo(); }, t('pop.yes'));
}
/* Highest index first, so removing one does not move the next one under the
   knife. And through draftDropGo(), which is the one place a draft goes -- it
   is what tells the server. */
function dfSelDelGo(){
  var ids=dfSelList().sort(function(a, b){ return b-a; }), i;
  DFSEL=null;
  for(i=0;i<ids.length;i++) draftDropGo(ids[i]);
  render();
}
function vDrafts(){
  var out='', i, d, on, got=pullHad('drafts');
  /* The drafts came down when the session began (www/sns.js § WHAT AN OPEN
     ASKS FOR). Nothing is asked from here; a pull on this screen asks again. */
  /* THE MARK, AND NOT A LIST THAT IS ABOUT TO CHANGE.
     「先に空で描いて、あとから差し替えるのを無くす」 OWNER 2026-09-05.

     It drew what is on this phone the moment the screen opened, and the
     server's drafts arrived a second later and were pushed in among them --
     so 「No drafts」 became a draft, and 「Select」 appeared over a bar that
     had not had it. Three faces and not two, the same as everywhere else:
     the mark while the answer is out, the list when it is in, and 「No
     drafts」 only once the server has said so.

     Signed out there is nothing to wait for -- the drafts are this phone's
     and that is the whole of them -- so the mark does not turn on a question
     nobody is asking. */
  if(netSignedIn() && !got)
    return '<div class="view">'+navTop('')+
      '<div class="body">'+snsWaitHTML()+'</div></div>';
  for(i=DRAFTS.length-1;i>=0;i--){
    d=DRAFTS[i];
    on=!!(DFSEL && DFSEL[i]);
    if(DFSEL){
      out+='<div class="dfrow">'+
        '<span class="ltck'+(on? ' on':'')+'" data-sel="1"'+DO('dfSelTap', [i])+
          ' role="button" aria-label="'+esc(t('post.draft.sel.row'))+'">'+
          (on? ICON_DOT : ICON_RING)+'</span>'+
        '<button class="dfb"' + DO('dfSelTap', [i]) + '>'+
          (d.pv? '<span class="ppv">'+ICON_LOCK+'</span>' : '')+
          '<span class="dfl">'+esc(d.ln || d.mn || t('post.draft.empty'))+'</span>'+
          '<span class="dfw">'+esc(postWhen(d.at))+'</span></button></div>';
      continue;
    }
    out+='<div class="dfrow">'+
      '<button class="dfb"' + DO('draftOpen', [i]) + '>'+
        (d.pv? '<span class="ppv">'+ICON_LOCK+'</span>' : '')+
        '<span class="dfl">'+esc(d.ln || d.mn || t('post.draft.empty'))+'</span>'+
        '<span class="dfw">'+esc(postWhen(d.at))+'</span></button>'+
      '</div>';
  }
  return '<div class="view">'+
    navTop('', DFSEL
      ? ((dfSelList().length
            ? navDel(t('post.draft.sel.del'), 'dfSelDel')
            : '')+
         navDo(t('post.draft.sel.done'), 'dfSelOff', null, true))
      : (DRAFTS.length
          ? navDo(t('post.draft.sel'), 'dfSelOn', null, true)
          : ''))+
    '<div class="body">'+
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
/* OWNER 2026-09-05 単語はその単語の意味を 文法は並び替えた単語たちが文章として成り立つように
   What the meaning field starts as: the line said in the reader's own
   language. The dictionary says what each word means and the grammar says
   which of them is the subject, the object and the verb, so the three that
   carry a role stand where the reader's own language stands them. Nothing is
   asked of a network and nothing is guessed at -- what it cannot arrange it
   leaves in the order it was typed, which is the words, and the words are
   most of what somebody needs. 「単語と文法が埋まれば埋まるだけ投稿の翻訳の
   精度が上がるっていうのが目的」 */
function pwMn(){ return LinguaGrammarEngine.translate.toNatural(gModel(), pwLn(), uiLang()); }
/* The composer is TWO rows, the same two the timeline is:
   「やっぱり、タイムラインも投稿も2段で。赤文字消して。」
   「これもお題のページと合わせるんだけど」 OWNER 2026-08-28

     the line, in the letters somebody drew
     what it means

   A word-by-word gloss sat between them, and the red in it was a word the
   dictionary did not know. The timeline dropped that row already -- the
   comment at the foot of postRow() says why, and says the composer kept one
   「where it is the writer checking their own line before it goes out」.
   **That is superseded**: the owner has asked for the same two rows in both
   places, and the day's-sentence row (`dayRow()` in sns.js) is those two
   rows as well -- what is written, and the line under it.

   The red went with the row that carried it. What fills the meaning field's
   placeholder, and the meaning a post falls back to, is `pwMn()` above --
   the line said in the reader's own words and the reader's own order. */
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
      pwVoAddHTML()+
      /* Beside the microphone. The span is always here so pwSidePaint() has
         something to patch; it collapses only while a posted thing is being
         edited, which is the one state drafts have nothing to do with. */
      '<span class="pwside" id="pw-side">'+pwSideHTML()+'</span>';
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
   vFeed() asks for the timeline every time it runs. So the DELETE going up and the
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
    if(POST_GONE[p.id] || (p.sid && POST_GONE[p.sid])) continue;
    if(!p || !p.id) continue;
    /* ALREADY HERE IS NOT NOTHING TO DO, and that was the hole. This skipped
       a post it already had, so the numbers on it were whatever they were the
       first time it arrived -- frozen for the life of the copy. A phone that
       had read a timeline once would never see another like on any post in
       it, however many times it pulled. 「当たり前だけどsnsとして機能して
       ない」 OWNER 2026-09-01: post_seen carries the counts now
       (claude/acct2), and they have to be able to LAND. */
    if(have[p.id]){ if(postFresh(p)) n++; continue; }
    have[p.id]=1;
    POSTS.push(p);
    n++;
  }
  if(n) savePosts();
  return n;
}
/* What the server is allowed to change under a post this phone already holds,
   and it is only ever these five.

   NOT what the author wrote. The line, the meaning, the ink, the photographs
   and the voice are frozen onto a post when it is written (rule 8) and a
   later answer must not move them -- that is docs/DATA_SAFETY.md, and it is
   the difference between a copy catching up and a copy winning.

   These five are the server's own arithmetic: it counts `react` rows and it
   knows whether one of them is yours. 「SNSは全部サーバー」. `undefined` is
   not an answer -- netRow() leaves the field off where the server said
   nothing rather than sending a 0 -- so a row that did not carry them leaves
   what is here alone. */
function postFresh(p){
  var q=postById(p.id) || (p.sid? postById(p.sid) : null), moved=false;
  if(!q) return false;
  function put(k){
    if(p[k]===undefined || q[k]===p[k]) return;
    q[k]=p[k]; moved=true;
  }
  put('nlike'); put('nboost'); put('nreply'); put('ilike'); put('iboost');
  /* And whether it has been taken down or its author frozen, which are the
     other two facts about a post that are not the author's to write. */
  put('down'); put('out');
  return moved;
}
/* HOW MANY, AND WHETHER YOU ARE ONE OF THEM.
   -------------------------------------------------------------------------
   Two answers to each question and one of them is the record. The server
   counts (`post_seen` carries `likes`/`boosts`/`replies` and
   `i_like`/`i_boost` since claude/acct2's 8fab549); the phone keeps `li`/`bo`
   /`re` and `lime`/`bome` so a press shows at once and so a post written with
   no signal has something to draw at all.

   The server's answer wins where there IS one, and `undefined` is what "there
   is not" looks like -- a post from before these existed, or one this phone
   wrote and has not sent. Reading `0` as "no answer" would be the bug the
   net.js comment warns about from the other side: a post with genuinely no
   likes would fall back to a stale local number for ever. */
function postNLike(p){ return (p && p.nlike!==undefined)? p.nlike : ((p && p.li)||0); }
function postNBoost(p){ return (p && p.nboost!==undefined)? p.nboost : ((p && p.bo)||0); }
function postNReply(p){ return (p && p.nreply!==undefined)? p.nreply : ((p && p.re)||0); }
function postILike(p){ return (p && p.ilike!==undefined)? !!p.ilike : !!(p && p.lime); }
function postIBoost(p){ return (p && p.iboost!==undefined)? !!p.iboost : !!(p && p.bome); }
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
/* ---- ONE POST, ONE SEND AT A TIME --------------------------------------
   Which posts are on the wire right now, by this phone's own name for them.

   `sid` is the only thing that says 「this one has gone」 and it is not
   written until the ROW lands -- and the row is the last thing to go, after
   every photograph and the voice, one file at a time. So on a slow wire the
   same post was sent again inside that window, under a new id (netPush()
   makes one per call), and it arrived twice: on the writer's timeline and on
   everybody else's, to be deleted one at a time.
   「同じ投稿が二つ、三つと並びます」 docs/RISK.md § 5.

   It is in memory and it is NOT on the post. A mark that is saved is a mark
   that survives the app being killed halfway through a send, and the post
   would then never be sent again -- which is worse than the fault it is
   fixing. Killed, this phone holds a post with no `sid`, which is exactly
   the state postCatchUp() exists for.

   BOTH ROADS OUT OF THE COMPOSER COME THROUGH HERE, and that is the whole of
   why it is a function rather than a line in postCatchUp(). The press
   (pwSendWith) was half of the window: somebody sends, and a timeline answer
   lands while the photographs are still going up. */
var POST_SENDING={};
function postSend(p, ok, bad){
  var id=p && p.id;
  if(!id || POST_SENDING[id]) return;
  POST_SENDING[id]=1;
  /* And it is written down either way. netUpPics() and netUpVoice() put the
     paths of what DID go up onto the post as each file lands, so a send that
     got three photographs of four leaves three paths behind it -- and the
     next attempt sends one file instead of four. Kept here rather than after
     every upload: one write at the end of a send, against one per file, on a
     key that carries the photographs themselves. */
  netPush(p, function(sid){ delete POST_SENDING[id]; savePosts(); ok(sid); },
             function(d, s){ delete POST_SENDING[id]; savePosts(); bad(d, s); });
}
var POST_CATCH=4;
function postCatchUp(){
  var i, n=0, ps;
  if(!netSignedIn()) return;
  /* And everything the server should no longer HAVE. The files of a post
     somebody deleted, where the bucket refused to take them -- netDropAgain()
     in www/net.js owns the list and says why it is here. This is the moment
     the network is known to be working, which is the whole reason the
     sending below happens here rather than on a timer, and it is the same
     reason for both directions. */
  netDropAgain();
  ps=POSTS.slice().sort(function(a, b){ return (a.at||0)-(b.at||0); });
  for(i=0;i<ps.length && n<POST_CATCH;i++){
    if(ps[i].sid || ps[i].pv || !ps[i].mine) continue;
    /* Already on the wire. Read here as well as refused in postSend() so an
       in-flight post does not eat one of the four -- postSend() is what owns
       the answer; this is one of the places that ask it. */
    if(POST_SENDING[ps[i].id]) continue;
    n++;
    /* The closure is the post, so a slow answer lands on the right one. */
    (function(p){
      postSend(p, function(sid){ postSid(p, sid); }, function(){});
    })(ps[i]);
  }
}
/* ---- the badge, and the one thing on a post that is NOT frozen ----------
   One gold star beside a name, and it says the person is on Pro.

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
  return '<span class="bdgw" aria-hidden="true">'+MARK_PLUS+'</span>';
}
function planBadge(id){
  if(id==='pro') return badgeMark();
  return '';
}
/* THE MARK, AND IT IS ON ONE PHONE IN THE WORLD.
   「後相手の画面にパッチ映らないけど？プロなのに」 OWNER 2026-09-04.

   Both questions here are about the READER -- `p.mine` is 「is this post
   mine」 and `can('badge')` is 「is MY plan Pro」 -- so the author is the only
   person who ever sees it. That is rule 8, and it is NOT fixed by freezing
   the answer onto the post when it is written: sides-check says in as many
   words why this one is exempt from the freezing rule -- a badge says what is
   true NOW, because somebody who cancels has to stop wearing it
   「バッジは消える」. A stamped one would go on wearing it for ever.

   SO THE ANSWER HAS TO COME FROM THE SERVER AND IT IS NOT THERE TO COME FROM.
   The plan is a table of its own and is deliberately private
   (supabase/schema.sql § plan: 「A `plan` column there would have published
   every person's tier to every...」), `profile_seen` does not carry it and
   `post_seen` does not either. There is no request in www/net.js that could
   answer this and no column for one to read.

   THE DRAWING IS ALREADY WAITING ON A PERSON'S PAGE and is deliberately not
   here yet. whoCard() in www/me.js draws whatever whoOf() says about the
   person, and whoOf() passes `pro` through the way it passes `lid` and
   `lpub` -- so the day `profile_seen` carries the column, that screen is
   right with no second change. The TIMELINE is a different question, because
   a row is a post and not a person: it wants the same boolean on `post_seen`
   and netRow() putting it on the row, and then these two lines are replaced
   by `p.pro` alone.

   Nothing is bolted on here in the meantime. A second road to one answer is
   what CLAUDE.md forbids first, and reading `p.pro` today would be a road
   nothing writes; taking the two lines out today would take the mark off the
   author's own timeline and put it nowhere. So it stands as it is and the
   report says what is missing: ONE BOOLEAN, in two views. */
function postBadge(p){
  if(!p || !p.mine) return '';
  /* can('badge') and not plan(). It answered the same thing on the day this
     changed and will not the first time the mark moves a rung -- which is
     the whole of why CAN exists. The rung is `badge` in core.js and nowhere
     else, and it is Pro. */
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
/* ONE post, small, and it does not move. 「相手の投稿は小さく固定、
   その下から自分が打てるようにしてくれ」 OWNER 2026-08-28, on
   「投稿の返信画面みづらいや」.

   It was the whole line of ancestors -- oldest first, the post being answered
   last -- put here for 「返信するとき、スレッドを開いてそのスレッドを
   見ながら返信できるように」. Measured on the owner's narrow phone
   (320x568, keyboard up, 308 visible) it was three posts of 90 each showing
   through a 44px slot -- 288px of conversation in 44 -- while what it cost
   was the field underneath: the composer's own two fields came to 314 in a
   box of 248, and `.body` is overflow:hidden, so the MEANING field sat behind
   the row of pictures with no way to reach it. The thread was unreadable and
   the person could not type. Both from the same 44 lines of screen.

   So the post being answered, and nothing above it. The owner's sentence says
   相手の投稿 -- one post -- and on 320 there is no reading of it that also
   holds a conversation. Going to look at the thread means leaving the
   composer, which is what the older decision was about, and that is a real
   cost; it is reported up rather than decided here.

   Small and fixed is the whole of its rule now: it is the same height on both
   of the owner's phones (index.html caps it), it never gives its room to
   anything and never takes any, and a line too long for it scrolls inside
   itself rather than pushing the field down the screen. */
function pwToHTML(to){
  if(!to) return '';
  return '<div class="pwq">'+
    '<div class="pav">'+postFace(to)+'</div>'+
    '<div class="pbody">'+
      /* ONE ROW: the name and the handle beside each other, and the language's
         name is not on it. 「言語名いらんから名前と@を横に並べて」OWNER
         2026-08-26. It was two lines -- the name, and under it the language
         and the handle -- which is three facts stacked where you are looking
         at somebody else's post to answer it. Whose post it is, is the name
         and the handle; what language it is in is what the line under them
         already shows.

         `.pheadn` is the flex row that holds the gap, and both spans go in
         it: written any other way the words run together (`IriVethi@iri`),
         which is what `.phead` losing its own flex did once already. */
      '<div class="phead"><div class="pheadn">'+
        '<span class="pname">'+esc(postWho(to))+'</span>'+
        '<span class="phandle">@'+esc(to.hd||'')+'</span>'+
      '</div></div>'+
      (to.ln? '<div class="pline '+dirClass(postDir(to))+'">'+postLnHTML(to)+'</div>' : '')+
      (postSay(to)? '<div class="pmn">'+tagHTML(postSay(to))+'</div>' : '')+
    '</div>'+
    '</div>';
}
function pwHTML(){
  var to=PW.to? postById(PW.to) : null;
  /* The post, and no line of words over it saying whose it is.
     「リプライングトゥーのやついらん。返事する時その画面固定で。」 OWNER
     2026-08-28. It said "Replying to @aya" directly above a post carrying
     "Aya @aya" -- the same fact twice, and on a 320 it cost 26px, more than
     half of what the post itself had. Whom you are answering is the post.

     It also read the ACCOUNT once, so every reply announced you were replying
     to yourself; that is why the handle came off `to`. Nothing reads either
     one here now. */
  return (to? '<div class="pwqs">'+pwToHTML(to)+'</div>' : '')+
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
      /* The meaning sits in the same column as the line, in the same
         borderless field, because it is the second half of the same act. */
      /* Read-only when it is the day's sentence. Not disabled: a disabled
         field is greyed out and unselectable, and this one is the thing you
         are reading while you write. */
      /* THE SAME FIELD AS THE LINE ABOVE IT, and it was an <input>.
         「全部改行して画面内に文字が収まるようにして欲しい。」 OWNER
         2026-08-27. An <input> cannot wrap -- there is no CSS for it -- so a
         meaning longer than the column scrolled off the side and what was
         typed first stopped being on the screen. The line above it was fixed
         for this exact complaint 「改行されないせいで画面が今でいく」 and
         lnField() has been the one place ever since; the meaning never got
         it, so one column had a field that wraps sitting on a field that does
         not. It grows with its text (lnGrow), same as the line. */
      lnField('pw-mn', pwMn() || t('post.mn'),
        (PW.pr? ' readonly' : '')+IN('pwSetMn'), PW.mn, 'pwmn')+
      /* Editing is the line and the meaning. There is nothing to add a
         photograph or a voice to -- the post already has whatever it has --
         so the row that adds them is not there rather than there and
         refusing. */
      (PW.ed? '' : pwStripHTML())+
      /* THE REST OF THE COLUMN, and it is where you are writing. The two
         fields are as tall as what is in them and everything left over fell
         under them doing nothing -- a screen with its words packed into the
         top and a hand's worth of empty glass under them, that a thumb could
         land on all day without the caret moving.
         「下のスペースあるのに詰まってるよね？これはなんで？わざと？」 OWNER
         2026-09-01.

         Nothing MOVES: the fields keep the heights they were measured at (the
         104 floor, the two fields of a reply, the row of pictures directly
         under the meaning). What was empty is now the same field, one step
         further down -- pressing it puts the caret at the end of the line,
         which is what pressing under the last line of anything you are
         writing does. */
      '<div class="pwrest"' + DO('pwFocusLn') + '></div>'+
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
/* The empty part of the column, pressed. The caret goes to the END of what is
   there rather than to the start: pressing under the last line of something
   you are writing is asking to go on writing it. */
function pwFocusLn(){
  var e=document.getElementById('pw-ln');
  if(!e) return;
  e.focus();
  if(e.setSelectionRange && typeof e.value==='string')
    e.setSelectionRange(e.value.length, e.value.length);
}
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
  var m=document.getElementById('pw-mn');
  if(m) m.setAttribute('placeholder', pwMn());
  lnGrow('pw-ln');
  pwLeftPaint();
  pwSidePaint();
  /* And the button in the corner, for the same reason the counter beside the
     field is patched by hand: this screen is not redrawn while somebody is
     typing into it. A photograph and a voice both come back through
     openPost(), which rebuilds the bar, so they need nothing here. */
  navDoPaint('pwSend', pwOn());
  pwFresh();
}
/* How long a post may be. There was no answer at all: the field was one row
   of an input, so a line ran off the side of the phone and kept going for as
   long as somebody kept typing. 「ツイートの文字数制限決めないと無限になってる」

   Two hundred and eighty, which is the number the shape of this screen was
   borrowed from. It is a made language and its words are short; nobody has
   met this yet and the point is that it exists. */
var POST_MAX=280;
/* How much room is left, as a RING that empties as you type.
   「カウントは打つほど減っていく輪、帯の中、常に出す」 OWNER 2026-08-28.

   It was a number, and only from 40 left -- so for the first 240 characters
   the screen said nothing at all about a limit that exists, and then a number
   appeared out of nowhere. A ring that is whole when the field is empty and
   shorter with every letter says the same thing continuously, which is the
   point of the shape: you can see it going without reading anything.

   The arc is one circle's stroke, dashed to its own circumference and pushed
   round by however much has been used -- so what is drawn IS what is left.
   `PW_RING` is 2*pi*8, the r below; the two have to be the same circle or the
   ring is full at nine tenths. Rotated a quarter turn in the stylesheet so it
   empties from the top.

   Three states and no new colour: quiet while there is room, the colour
   everything else on this screen is once the number appears, and the colour
   of a problem once there is none left. **40 is not a new number** -- it is
   the one this function already had for when to show the count, and the
   count still appears exactly there. */
var PW_RING=50.265;
function pwLeftHTML(){
  var used=String(PW.ln||'').length, left=POST_MAX-used,
      f=left/POST_MAX;
  if(f<0) f=0;
  if(f>1) f=1;
  return '<span class="pwring'+(left<=0? ' bad' : (left<=40? ' near':''))+'">'+
    '<svg viewBox="0 0 20 20" aria-hidden="true">'+
      '<circle class="pwrt" cx="10" cy="10" r="8"></circle>'+
      '<circle class="pwrf" cx="10" cy="10" r="8" stroke-dasharray="'+PW_RING+'" '+
        'stroke-dashoffset="'+(PW_RING*(1-f))+'"></circle>'+
    '</svg>'+
    (left<=40? '<span class="pwleft">'+left+'</span>' : '')+
    '</span>';
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
  return !!(pwPics().length || (PW.vo && PW.vo.f));
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
  /* The voice is already a file: www/rec.js writes it the moment the
     recording ends, so `PW.vo` is `{f, ms}` and there is nothing to write
     here. It used to be written at this line, which left the OTHER road out
     of the composer -- keeping a draft -- carrying thirty seconds of base64
     into localStorage. */
  pwBake(function(pics){ pwSendWith(ln, pics, PW.vo||null); });
}
function pwSendWith(ln, pics, vo){
  /* Everything a reader needs is put ON the post, now, because the reader may
     not be here and may not have this language: who wrote it, what they are
     called, what it is written in, and a face. A timeline that asks the open
     language who wrote a post answers "me" for everybody. */
  var mine={id:'p'+Date.now()+'_'+POSTS.length, at:Date.now(),
            lang:langId, lname:langName||'',
            who:meName(), hd:meHandle(), av:postAvatar(), mine:true,
            ln:ln, ink:postInkTyped(PWRAW), dir:scriptDir(),
            /* OWNER 2026-09-05 単語はその単語の意味を 文法は並び替えた単語たちが
               文章として成り立つように -- only to fall back on, for somebody who
               typed a line and no meaning. Not stored, see postRow. */
            mn:String(PW.mn||'').trim() || LinguaGrammarEngine.translate.toNatural(gModel(), ln, uiLang()),
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
  /* It has stopped being a draft, so the row goes -- AFTER the post is
     written and never before. The other order is somebody's writing gone on
     the day the post itself would not go: what is on this phone now is the
     post, which savePosts() has just put down and postCatchUp() keeps trying
     to send, so there is nothing left for the draft to be the only copy of.

     A post kept to yourself (`pv`) goes no further than this phone, and its
     draft still goes: private is what the POST is, and the draft was never a
     way of storing one. */
  if(PW.did){ netDraftDrop(PW.did); PW.did=''; }
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
  /* postSend() and not netPush(): the press is one of the two roads a post
     goes up by, and both have to be behind the same one-send-at-a-time mark
     or the window is still open from this side. */
  if(!mine.pv)
    postSend(mine, function(sid){ postSid(mine, sid); },
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
   phone. A shape, not a reference.

   IT IS READ, NOT DECIDED. 「アイコン勝手に変わるのは何だ。最初の文字になるの
   はいいけど、それはオンボーディングを通ってかいたもじだけで、それ以降は勝手に
   変えないで」 OWNER 2026-09-05.

   This used to walk LETTERS on every call and answer whichever letter was
   first with a shape on it, which is not a decision anybody made: redrawing
   that letter, drawing another and moving it to the front, or taking a
   photograph off all moved the face with nobody having touched it. Pressed
   on 2026-09-05 -- the letter drawn in the walk was the answer only because
   it happened to be at the front, and it stopped being the answer the moment
   anything went in front of it.

   The face is `ME.av` now, written once by meAvSet() (www/me.js) and read
   here. The walk writes it at obFinish(), which is 「オンボーディングを通って
   かいたもじ」 exactly.

   THE ONE LINE BELOW IS NOT A SECOND DECIDER. An account that finished the
   walk before there was anywhere to write this has no face on file, and the
   old walk over LETTERS is what it is wearing today -- so that is adopted,
   once, and meAvSet() refuses every call after it. It fills in what is
   MISSING and stops (docs/DATA_SAFETY.md rule 2); it never writes over a face
   that exists, and nothing here removes one. SET.done keeps it out of the
   walk, where the letters are still being made and obFinish() has not
   decided yet. */
function postAvatar(){
  var i, av;
  /* A photo if there is one. It travels on the post like the letter does,
     for the same reason: whoever reads it has neither this person's camera
     roll nor their alphabet. */
  if(ME.pic) return {pic:ME.pic};
  if(!ME.av && SET.done){
    av=null;
    for(i=0;i<LETTERS.length && !av;i++) av=meAvOf(LETTERS[i]);
    meAvSet(av);
  }
  return ME.av || null;
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

/* ---- what a post says ---------------------------------------------------
   OWNER 2026-09-05 単語はその単語の意味を 文法は並べ替えた単語たちが文章として
   成り立つように

   Two things. The writer's own letters, and what the line means -- and what
   it means is built here, out of the dictionary and the grammar, by `pwMn()`
   when the post is written. 「きかいほんやくはつかわない」 OWNER 2026-09-05:
   a post's meaning is worked out by this app, on this phone, and nothing is
   asked of a machine anywhere else. */
/* What a post says to the person reading it: their own language if the post
   carries it, and otherwise the one the author typed. Never empty -- a line
   nobody can read is not a post. */
function postSay(p){
  if(!p) return '';
  var u=uiLang(), d;
  /* The day's sentence is the app's own words, not the writer's, and the
     server holds it in all ten languages -- so an answer to today's prompt is
     said in the language of whoever is reading it. www/sns.js § dayMap has
     the whole of why, and why it is today's only. */
  /* The prompt, in the reader's own language. It is one shared row a day and
     the phone asks for it by id -- www/sns.js § dayMap. Until the answer
     lands this falls through to the words the post carries, which is what it
     always showed. */
  if(p.pr){ d=dayMap(p.pr); if(d && d[u]) return String(d[u]); }
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
        /* A textarea, not an input: an input is one row that scrolls sideways
           forever, and a line on a photograph wraps inside the picture now
           「インスタと同じようにやって」. The value goes between the tags,
           which is where a textarea keeps it. */
        ? '<textarea class="mktx sfont mkink c'+
            Math.max(0, PW_COLS.indexOf(pwMarkCol(sel)))+'" id="mk-tx" '+
            'rows="1" placeholder="'+esc(t('post.mark.ph'))+'" '+
            'autocomplete="off" autocorrect="off" spellcheck="false" '+
            'style="top:'+(sel.y*100)+'%;left:'+(sel.x*100)+'%"' +
            IN('pwMarkText') + '>'+esc(sel.tx||'')+'</textarea>'
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
/* ---- a line on a photograph WRAPS -------------------------------------
   「インスタと同じようにやって」 OWNER 2026-08-28, asked what a line typed
   onto a photograph should do when it is longer than the picture.

   It ran off the side and kept going: the field grew to whatever was in it
   (`pwMarkFit` set its width to its own scrollWidth) and the canvas drew one
   run left to right, so a long line left the frame at both ends and what was
   typed first was no longer on the picture. That is the same complaint the
   fields inside the app were fixed for 「全部改行して画面内に文字が収まる
   ようにして欲しい」, arriving on the one surface that is not a field.

   So a mark is LINES now, wrapped at the width of the picture and stacked
   centred on the point it was left at. Everything that needs to know how big
   a mark is asks these three -- the drawing, the hit box and the bake -- the
   way they already all asked pwMarkWide(). */
/* Where a line may break. A drawn letter is a piece on its own, so a line of
   made letters breaks between letters the way a line of Japanese does; a run
   of ordinary text breaks at its spaces and nowhere else, so a word is not
   cut in half. The space is kept on the end of the piece before it, which is
   what makes it disappear at the end of a line. */
function pwMarkAtoms(units){
  var out=[], i, u, parts, j;
  for(i=0;i<units.length;i++){
    u=units[i];
    if(u.st){ out.push({st:u.st}); continue; }
    parts=String(u.t||'').split(/(\s+)/);
    for(j=0;j<parts.length;j++) if(parts[j]!=='') out.push({t:parts[j]});
  }
  return out;
}
/* One cell of vertical room per line, and a quarter of one between them --
   the same 1.25 the field's own font size is worked out with. */
var PW_MARK_LEAD=1.25;
/* And a margin down each side, because a line on a photograph does not run
   into the edge of it 「左右に余白がある」. Not a new number: it is the
   body's own 24px gutter, as a share of the 390 this screen is measured on,
   which is what every other margin in the app is a share of. */
var PW_MARK_EDGE=24/390;
/* The lines a mark comes to, at its own size, inside the picture. The width
   to fill is the picture measured in this mark's cells: the picture is 1 wide
   and a cell is `s` of it, so there are 800/s of the 800-unit cells across.
   Nothing is dropped -- a single piece wider than the picture is a line of
   its own rather than being cut, because cutting it would lose what somebody
   drew. */
function pwMarkLines(m){
  var max=(m && m.s>0)? (1-2*PW_MARK_EDGE)*800/m.s : 0,
      atoms=pwMarkAtoms(pwMarkCut(m)),
      out=[], cur=[], w=0, i, aw, a;
  for(i=0;i<atoms.length;i++){
    a=atoms[i];
    aw=a.st? ((inkAdv(a.st)||{w:800}).w) : String(a.t||'').length*440;
    if(cur.length && max>0 && w+aw>max){ out.push(cur); cur=[]; w=0; }
    cur.push(a); w+=aw;
  }
  if(cur.length) out.push(cur);
  return out;
}
/* The plate a line sits on, exactly as wide as the line 「行ごとに背景の板が
   ある。文字幅ぴったりの黒い板。行の長さで板の幅も変わる」 -- read off the
   picture the owner sent of Instagram, 2026-08-28.

   **The colour is named in the stylesheet and is not a new one.**
   `--mkplate` is the dark ground's value, declared in index.html's two theme
   blocks as the same colour in both -- 「Every colour lives in these two
   blocks and nowhere else; the views only ever touch the variables.」

   It does not follow the theme, and that is the point: **a photograph has no
   theme.** The plate lies on somebody's picture rather than on the app's
   ground, so a person reading in the light theme may put letters on a dark
   photograph and the other way round. Following the theme would be following
   the wrong thing, and Instagram does not either.

   The letters keep the colour somebody picked from the eight -- the plate
   goes behind them and changes nothing about them.

   A cell tall, because that is what a line of this is: `k` is the cell over
   800, so 800k is one cell. */
function pwMarkPlate(x, units, k, ox, oy){
  var w=pwMarkAdv(units)*k;
  if(w<=0) return;
  x.fillStyle=cssVar('--mkplate');
  x.fillRect(ox, oy, w, 800*k);
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
  var ls=pwMarkLines(m), w=0, i, a;
  for(i=0;i<ls.length;i++){ a=pwMarkAdv(ls[i]); if(a>w) w=a; }
  return m.s*(w/800);
}
/* And how TALL, which used to be `m.s` everywhere because a mark was one
   line. One line still is; four are four, with a quarter cell between. */
function pwMarkTall(m){
  var n=pwMarkLines(m).length || 1;
  return m.s*(1+(n-1)*PW_MARK_LEAD);
}
function pwMarkDraw(){
  var ms=pwMarks(), els=document.querySelectorAll('canvas.mkc'), i, j, c, m, u, H, W,
      dpr=window.devicePixelRatio||1, box=document.getElementById('mk-box');
  var bw=box? (box.getBoundingClientRect().width||300) : 300;
  for(i=0;i<els.length;i++){
    c=els[i];
    m=ms[parseInt(c.getAttribute('data-i'), 10)];
    if(!m) continue;
    c.style.width=(pwMarkWide(m)*100)+'%';
    c.style.height='auto';
    c.style.left=(m.x*100)+'%';
    c.style.top=(m.y*100)+'%';
    /* The one being typed is drawn by the field itself -- it is the field --
       so its canvas would be the same line twice, half a pixel apart. */
    c.style.display=(parseInt(c.getAttribute('data-i'), 10)===pwMarkAt)? 'none' : '';
    u=pwMarkLines(m);
    if(!u.length) continue;
    /* One cell tall per line plus the lead between them, and as wide as the
       longest line -- both asked of the same two functions the hit box and
       the bake ask. Each line is centred in that width, the way a caption on
       a photograph is centred and the way the field above it is. */
    H=Math.max(40, Math.round(m.s*bw*dpr));
    W=Math.max(1, Math.round(H*(pwMarkWide(m)/m.s)));
    c.width=W; c.height=Math.max(1, Math.round(pwMarkTall(m)*bw*dpr));
    for(j=0;j<u.length;j++){
      pwMarkPlate(c.getContext('2d'), u[j], H/800,
        (W-H*(pwMarkAdv(u[j])/800))/2, j*H*PW_MARK_LEAD);
      pwMarkRun(c.getContext('2d'), u[j], H/800,
        (W-H*(pwMarkAdv(u[j])/800))/2, j*H*PW_MARK_LEAD, cssVar(pwMarkCol(m)));
    }
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
  /* Measured with the wrapping OFF and on the WHOLE line, because what is
     being measured is the ratio between the two renderers and not a width:
     let it wrap here and the answer is the width of one column of letters. */
  var flat=m.s*(pwMarkAdv(pwMarkCut(m))/800)*bw, fs=m.s*bw*1.25, at100;
  e.style.whiteSpace='pre';
  e.style.width='0px';
  e.style.height='auto';
  e.style.fontSize='100px';
  at100=e.scrollWidth;
  if(at100>0 && flat>0) fs=100*flat/at100;
  e.style.fontSize=Math.max(11, Math.round(fs))+'px';
  /* And then the field is the BLOCK: as wide as the widest line the picture
     leaves room for, wrapping there, and as tall as what that comes to.
     「インスタと同じようにやって」 OWNER 2026-08-28 -- a line longer than the
     picture wraps and stacks rather than leaving the frame, and the field has
     to break in the same place the canvas does or what you type is not what
     the photograph gets. Both ask pwMarkLines(); the sizes agree because the
     two renderers were reconciled three lines up. */
  e.style.whiteSpace='';
  e.style.width=Math.max(44, Math.round(pwMarkWide(m)*bw)+4)+'px';
  e.style.height='auto';
  e.style.height=Math.max(44, e.scrollHeight)+'px';
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
    m=ms[i]; hw=pwMarkWide(m)/2; hh=pwMarkTall(m)/2;
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
    var c=document.createElement('canvas'), x, i, j, m, st, k, out;
    c.width=im.width; c.height=im.height;
    x=c.getContext('2d');
    x.drawImage(im, 0, 0, c.width, c.height);
    for(i=0;i<ms.length;i++){
      m=ms[i];
      st=pwMarkLines(m);
      if(!st.length) continue;
      /* The same numbers the screen used, asked of the same two functions:
         the height is a fraction of the picture's width, the block is centred
         on the point it was left at, and each line is centred in the block.
         A line that wraps on the screen and not in the file would be a
         photograph that is not the one somebody arranged. */
      k=(m.s*c.width)/800;
      for(j=0;j<st.length;j++){
        pwMarkPlate(x, st[j], k,
          m.x*c.width-(pwMarkAdv(st[j])*k)/2,
          m.y*c.height-(pwMarkTall(m)*c.width)/2+j*m.s*c.width*PW_MARK_LEAD);
        pwMarkRun(x, st[j], k,
          m.x*c.width-(pwMarkAdv(st[j])*k)/2,
          m.y*c.height-(pwMarkTall(m)*c.width)/2+j*m.s*c.width*PW_MARK_LEAD,
          cssVar(pwMarkCol(m)));
      }
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

         popAsk(<what the ceiling is>, function(){ go('plans'); });

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
    popAsk(t('post.editplan'), function(){ go('plans'); });
    return;
  }
  PW=pwBlank();
  PW.ed=p.id; PW.ln=String(p.ln||''); PW.mn=String(p.mn||'');
  openPost();
}
function pwSaveEdit(ln){
  var p=postById(PW.ed), mn;
  if(!p || !p.mine){ toast(t('post.gone')); PW=pwBlank(); goTab('feed'); return; }
  /* OWNER 2026-09-05 単語はその単語の意味を 文法は並び替えた単語たちが文章として成り立つように */
  mn=String(PW.mn||'').trim() || LinguaGrammarEngine.translate.toNatural(gModel(), ln, uiLang());
  p.ln=ln; p.ink=postInkTyped(PWRAW); p.mn=mn;
  p.ui=uiLang();
  p.ed=Date.now();
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
  /* A TAG IS TEXT, so it comes out of the cut as text -- nobody has a letter
     for `#` and the ink carries only what the writer drew. Both roads
     through this function draw those runs, so both ask tagHTML() and a tag
     is blue whether or not the post has ink on it. www/sns.js § tagHTML. */
  if(!p || !postInkOK(p.ink)) return tagHTML(String((p && p.ln)||''));
  var out='', i, x, k;
  for(i=0;i<p.ink.s.length;i++){
    x=p.ink.s[i];
    if(typeof x!=='number'){ out+=tagHTML(String(x)); continue; }
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
  var out=[], i, up=postById(id);
  if(!id) return out;
  /* Asked of the POST and not of the name it was asked about. An answer
     points at whichever of its parent's two names the phone that wrote it
     was holding, so the question is 「is this post the one I am reading」 --
     postIs() -- and not 「is this string the string I was given」. */
  for(i=0;i<POSTS.length;i++)
    if(POSTS[i].to && (POSTS[i].to===id || (up && postIs(up, POSTS[i].to))))
      out.push(POSTS[i]);
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
  if(postById(id)){ go('thread', id); return; }
  /* NOT HERE YET IS NOT NOTHING. A notice carries only the id of the post it
     is about, so a notice about somebody else's reply points at a post this
     phone has never pulled -- and this used to check, find nothing, and
     return. Every such row was a press that did nothing at all.
     「通知タップしても反応が悪い」 OWNER 2026-09-02.

     It goes to the thread either way: vThread() draws viewGone() for a post
     that is not here, which is the honest screen while the answer is out and
     the right one for good if the post has really gone. The answer, when it
     comes, puts the post in through postTake() -- the same road the timeline
     uses -- and the render that follows draws the thread. */
  go('thread', id);
  netPostById(id, function(p){
    if(!p) return;
    postTake([p]);
    render();
  }, function(){});
}
/* The face, and the way to whoever wears it.
   「タイムライン検索含めて人のツイートのアイコン押したらその人のホーム画面に
   飛ぶようにしてよ。自分ならプロフィールのページ。」 OWNER 2026-08-26.

   The search row has done this since it was written -- go('profile', handle)
   -- and the timeline had not, so the same face was a door in one list and
   scenery in the other.

   Below the line, so the handle comes off the POST. A post from a language
   this phone has never seen still knows who wrote it, because that was put on
   it when it was written; asking ME or meHandle() here is what rule 8 is
   about, and sides-check would refuse it.

   A post with no handle on it is scenery again rather than a door to nowhere:
   everything written before posts carried one is in that state, and a button
   that opens an empty page is worse than no button. */
function postAvHTML(p){
  var h=String((p && p.hd) || '');
  if(p && p.mine)
    return '<button class="pav pavb"' + DO('goTab', ["profile"]) + '>'+
      postFace(p)+'</button>';
  if(!h) return '<div class="pav">'+postFace(p)+'</div>';
  return '<button class="pav pavb"' + DO('go', ["profile", h]) + '>'+
    postFace(p)+'</button>';
}
/* The row that drew the tag beside the post is GONE. 「タグは本文中に。」
   OWNER 2026-09-04. It was `t('day.tag')` -- ten words in ten language
   files, put on by the app, sitting outside anything anybody wrote. A tag is
   characters in the body now, and tagHTML() in www/sns.js is what makes one
   blue and pressable wherever those characters are drawn. */
function postRow(p){
  var foc=(postFocus()===p.id), to=postToWho(p);
  return '<div class="post'+(foc? ' pfoc':'')+'"'+(foc? '' : DO('postOpen', [p.id]))+'>'+
    postAvHTML(p)+
    '<div class="pbody">'+
      /* One line where one line fits, and a fold where it does not.
         「あと名前が長くない時は投稿の時横1列にできる？バッチは名前の横な？」
         OWNER 2026-08-28. `Aya` and `@aya` are four characters each, and
         folding those onto two lines spends a line of every post on nothing.

         The fold is still needed, and this is why. It was ONE flex row
         carrying the name, the badge, the language, the handle, a dot, the
         time, the lock, "edited", "taken down", the pin and the ... -- eleven
         things, on a phone, in the width of a post. `.pname` has
         `text-overflow:ellipsis`, so what happened is that the name -- the
         one thing on the line somebody is looking for -- gave up its width
         first and came out as two characters and a dot.
         「名前 言語名 ユーザー名 日付 編集済み ↑これ全部一列に表示すると
         なにも見えない」 Folded by hand it went the other way: a long name, a
         long handle, the lock and "edited" made the head THREE lines, and a
         reply put a fourth under them.

         So neither number is written down anywhere. Two groups sit in a
         WRAPPING row -- WHO wrote it, and WHAT STATE it is in -- and they
         share a line while they fit, the second dropping under the first when
         they do not. That is `flex-wrap` on `.pheadw` and nothing else:
         nothing here measures a name, because a width belongs to the phone
         and the font, so a number counted in JavaScript is wrong on every
         phone but the one it was counted on.

         No chips in a row and no corners: each group is text separated by
         spaces, which is what the rest of this app does with a line of small
         facts. */
      '<div class="phead">'+
        '<div class="pheadn">'+
          '<div class="pheadw">'+
            /* WHO, and it never splits. The badge is against the NAME with
               nothing between them -- 「バッチの話してんの、名前の横にしろって
               話聞いてんの？」 OWNER 2026-08-28. It is a fact about the
               PERSON, so it belongs to the person's name; after the time it
               read as a fact about the post. One call, here, and there is no
               second one anywhere in the app.

               Name and badge are wrapped together because the wrap is between
               the two GROUPS -- a badge that fell to the line under its own
               name would be a badge belonging to the handle. */
            '<span class="pnamew">'+
              '<span class="pname">'+esc(postWho(p))+'</span>'+postBadge(p)+
              '</span>'+
            /* WHAT STATE it is in: the group that drops under the name when
               the two of them do not fit, and sits beside it when they do.

               WHAT IT IS, and no longer what it is written IN. The language name
               came off this line -- OWNER 2026-08-25 「多すぎるから言語名表示
               なくそう。プロフいけば見れる」 -- and that last clause was checked
               before it was believed: `whoCard()` in me.js draws `p.lname` as a
               row you press, which goes to "about". It is one tap away, not gone.
               `plangtag` itself stays: post.js:795 (who you are replying to) and
               sns.js:510 (a person in a list) both still wear it.

               The `·` went with it. It was there to part `@aya` from `15分`,
               the gap this row is built with parts them now, and it was worn in
               this one place -- so its rule came out of index.html in the same
               commit, or `press` would report a class nothing wears. */
            '<div class="pheadm">'+
            '<span class="phandle">@'+esc(p.hd||'')+'</span>'+
            /* WHEN, after the handle. OWNER 2026-08-28:
               「名前 バッチ @ハンドル 時刻」 It sat on the name's line, put
               there when this head was two fixed lines and the lower one had
               stopped fitting; the lower one wraps now, so the reason it moved
               up is gone and it goes back where the order says. */
            '<span class="pwhen">'+esc(postWhen(p.at))+'</span>'+
            /* Kept to yourself, then edited. OWNER 2026-08-25:「🔑と編集済み
               逆にしたら終わりかな」-- asked for the other way round first and
               swapped after looking at it. The two are not the same kind of
               fact: the lock is WHO CAN SEE IT and the word is WHAT WAS DONE
               TO IT, and the one that decides who is reading it comes first. */
            (p.pv? '<span class="ppv" aria-label="'+esc(t('post.pv'))+'">'+ICON_LOCK+'</span>' : '')+
            (p.ed? '<span class="ped">'+esc(t('post.edited'))+'</span>' : '')+
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
          /* The ... and, when it is the one that is open, the menu hanging off
             it. It is IN the post rather than a screen you go to, so what you
             are choosing about stays in front of you. 「画面遷移じゃなくて投稿の
             横にメニュー出てきて欲しい」

             On every post, not only your own. It was yours only, which meant
             the one post you might need to do something about -- somebody
             else's -- was the one with nothing on it.

             It is OUTSIDE the wrapping row, hard against the right edge: it
             acts on the post rather than describing it, so it stays where a
             thumb has learned it is whether the head came out one line or
             two, and a 44pt target sits on the line that is 44pt tall. */
          '<span class="pmw">'+
            '<button class="pmore"' + DO('postMore', [p.id]) + ' aria-label="'+
              esc(t('post.more'))+'">'+ICON_DOTS+'</button>'+
            (PMENU===p.id? postMenuHTML(p) : '')+
            '</span>'+
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
      /* The natural language, in the reader's own if the post carries it and
         in the author's if it does not -- which is every post until the
         translator is wired up, and is not a failure. Not "always" any more:
         a post with no line has nothing to mean.

         It is DIRECTLY under the line and above everything else --
         「投稿の翻訳画面さ画像の下に行くのやめてくれる？ 投稿 / 翻訳 / そのた
         になるようにして」 OWNER 2026-08-28. It sat after the pictures and the
         voice, so on a post carrying four photographs the two rows that say
         the same thing in two languages had a strip of pictures between them
         and the second one was off the bottom of the phone. The line and what
         it means are one thing read twice; everything else the post carries
         comes after them. */
      (postSay(p)? '<div class="pmn">'+tagHTML(postSay(p))+'</div>' : '')+
      /* And then everything else the post carries -- the pictures first, and
         they are the one thing on a post that slides sideways.
         「画像だけ横スライドできる感じ」 One is a picture; several are a strip,
         and the strip scrolls rather than the post. */
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
      /* The voice, and it is below the meaning for the same reason the
         pictures are: it is what the post CARRIES, not what it says. */
      postVoHTML(p)+
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
         makes a codebase hard to read. **The composer does not show one
         either, as of 2026-08-28** 「やっぱり、タイムラインも投稿も2段で。
         赤文字消して。」 -- this row and the composer's are the same two rows
         now, and so is the day's sentence. Where the default meaning comes
         from is `pwMn()`, which is not a row.

         Posts made before this keep whatever is on them. Nothing goes and
         removes it: it is somebody's, and deleting what a person made
         because the current shape has no use for it is the one thing
         docs/DATA_SAFETY.md forbids outright. */
      '<div class="pacts">'+
        postAct('postReply', p.id, ICON_REPLY, postNReply(p), false)+
        postAct('postBoost', p.id, ICON_BOOST, postNBoost(p), postIBoost(p))+
        postAct('postLike',  p.id, ICON_HEART, postNLike(p),  postILike(p))+
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
  /* Off what is ON THE SCREEN, which is the server's number where there is
     one. Toggling the local copy alone made the thumb argue with the figure
     above it: pressing a post showing the server's 12 set `li` to 1. */
  var on=!postILike(p);
  p.lime=on;
  p.li=Math.max(0, postNLike(p)+(on? 1 : -1));
  /* Both copies move together, so the number changes under the thumb rather
     than on the next pull. The next answer overwrites them, and it is the
     record -- this is the moment in between. */
  if(p.nlike!==undefined) p.nlike=p.li;
  p.ilike=on;
  savePosts(); render();
  /* Whether it is liked, not what the count is: a count is the server's to
     add up, and two phones sending counts is how a number goes backwards. */
  netMark(id, 'like', !!p.lime, function(){}, function(){});
}
function postBoost(id){
  var p=postById(id);
  if(!p) return;
  var on=!postIBoost(p);
  p.bome=on;
  p.bo=Math.max(0, postNBoost(p)+(on? 1 : -1));
  if(p.nboost!==undefined) p.nboost=p.bo;
  p.iboost=on;
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
/* AND IT OPENS ON ANYBODY'S POST. It read `!p.mine` and went home, so the ...
   was drawn on every post -- the row that draws it says so in as many words,
   「On every post, not only your own」 -- and did nothing at all on the ones
   it mattered on. 「投稿の人の...タップしてもなにも出ないけど？」 OWNER,
   build 107.

   Nothing was missing on the other side of it: postMenuHTML() has had the
   other menu since it was written and `if(!p.mine)` is its first line. Block
   and Report were both there, in ten languages, reachable by nothing at all.
   The door was the whole of the fault.

   `!p` stays: a menu open on a post this phone does not have is a menu
   hanging off nothing, and postMenuHTML() would be asked about `undefined`. */
function postMore(id){
  var p=postById(id);
  if(!p) return;
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
/* BOTH MENUS, because this row is on both of them. It cleared `PMENU` only,
   and the same row sits in the menu on a person's page -- so reporting from
   THERE walked to this form with `WMENU` still standing, and postMenuTook()
   read the first press on a reason as "a press outside the menu", closed the
   menu nobody could see, and swallowed it. Measured: the first press sent no
   report and stayed on the form; the second sent one. Somebody presses Spam
   and nothing happens.

   Same sentence as meBlock() in www/me.js: a row that ENDS a menu closes it
   itself, and this row ends whichever one it was pressed from. */
function openReport(id, handle){
  PMENU=''; WMENU=false;
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
  /* Two menus and one rule, and this is the one place that closes either --
     "a press that is not part of the menu closes it" is one sentence, and a
     second copy of it is a second thing to keep in step.

     NEVER BOTH AT ONCE, and that used to be true by accident rather than by
     anything here. A person's page draws their card AND their posts, so both
     kinds of ... are on that one screen -- and every post on it is theirs, so
     until the ... opened on somebody else's post there was no way to have one
     of each open. There is now: press a post's ..., then the person's, and
     two menus stand open (measured, both orders). So the two exemptions below
     close the OTHER one on the way past. */
  if(!PMENU && !WMENU) return false;
  if(actOf(target, 'data-pm')) return false;
  el=actOf(target, 'data-do');
  d=el && el.getAttribute('data-do');
  /* The press goes through -- the name about to run is what toggles its own
     menu, and it renders. What is taken away here is the one that is NOT
     about to be toggled. */
  if(d==='postMore'){ WMENU=false; return false; }
  if(d==='whoMore'){ PMENU=''; return false; }
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
  /* 確認は自前のポップで。「標準は使わねえって言ってるだろこれも禁止や」
     OWNER 2026-09-01 -- confirm() は使わない。はいの側がこの下。 */
  popAsk(t('post.del.q'), function(){ postDelGo(id); }, t('pop.yes'));
}
function postDelGo(id){
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
