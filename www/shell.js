/* Lingua — the shell every screen sits in (chapter 4)
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   4. The shell every screen sits in
   ========================================================================= */
var app=document.getElementById('app');

/* ---- what a screen forgets when you leave it -------------------------
   Two dozen things across a dozen files are remembered between renders: which
   words the list is filtered to, what was typed into a search, which face a
   sheet is showing, which picture on a post is open. None of that belongs to
   the language -- it is where you happen to be standing in it.

   This list said "what the make screen has produced but not committed" long
   after the make screen was deleted, and cleared two globals -- mkPos and
   cands -- that nothing in www/ has read since. Neither had a `var` anywhere,
   so both were globals made by assignment, which is silent.

   There was no one place that said so, and things were added to it one at a
   time over the app's life. tools/fixture.mjs put two of the fifteen back
   and had no way to know about the rest, so every walk of the app was
   walking screens that the previous press had narrowed: the word list starts
   with 32 buttons and was down to 19 by the sixteenth press, which is how
   five buttons came to be reported as unreachable when they were merely
   filtered away.

   So: one place. Adding a screen that remembers something means adding it
   here, and tools/press.mjs fails if the two ever disagree -- it presses
   every button on a screen and requires the screen to be the same screen
   afterwards, which is not a rule anybody has to remember. */
function viewReset(){
  q=''; wFil='*'; wSort='a';           /* the word list */
  wSel=null;                           /* and whether it is one you choose from */
  /* And what a bulk delete could put back. It is dropped in viewLeft() too,
     and the two are NOT one rule written twice -- they are two different
     things that must not happen. There it is "the undo is about the list in
     front of you". Here it is that a copy of THIS language's words, at the
     positions they were at, may not be alive while ANOTHER language is open:
     langOpen() reads a different dictionary into WORDS, and an undo pressed
     after that would splice one language's words into another and save() them
     there. That road is shut today only because the language list is not
     reachable from the dictionary, so walking to it drops the undo on the way
     -- an accident of where the screens are, not a rule, and not what
     「データ消えるのだけはありえない」 may rest on. */
  wUndo=null;
  fq=''; fpick=null;                   /* the find screen */
  abVow='';                            /* the abugida editor */
  ltSort='own'; ltFil='all'; ltQ='';   /* the alphabet's order, filter and search */
  ltWob=false;                         /* and whether its letters are wobbling */
  PLPICK=null;                         /* and which term of which plan is chosen */
  KBSEL=null;                          /* and which keyboards are being chosen */
  NTSEL=null;                          /* and which notes are */
  DFSEL=null;                          /* and which drafts are */
  ipaQ=''; ipaOpen={mine:1};           /* the IPA page: its search, and what is open */
  GE=null;                             /* the glyph editor */
  kbLay=0; kbSel=null; kbSlotFor=null; /* the keyboard being built */
  kbShow=0;                            /* and which of the three is on screen */
  ltDraft=null;                        /* a letter's name, typed and unsaved */
  IMP=impBlank();                      /* a list being read in */
  PW=pwBlank();                        /* a post being written */
  pwPicAt=-1; pwMarkAt=-1; pwTool='mark';  /* and which picture, letter and tool */
  pfTab='posts';                       /* which list the profile shows */
  snsTab='rec';                        /* and which timeline the feed shows */
  PMENU='';                            /* the ... open beside a post */
  BACKQ=0;                             /* and the one hanging off the back arrow */
  WMENU=false;                         /* and the one on somebody's page */
  kbWob=false;                         /* and whether the keys are wobbling */
  obTour=0;                            /* how far the walk through the app has got */
  KBH=null;                            /* and which row, column or key is being worked on */
  snsQ=''; snsHits=null; snsMode='who'; /* the search, what came back, and
                                          which of the two it is about */
  snsSort='new';                       /* and newest or most answered */
  snsFil=null;                         /* and the word the feed is filtered to */
  /* The notices, asked again -- and the copy on the handset read again with
     them. notWake() only looks once a session, so nulling this without
     clearing that left the screen with no notices AND no way back to the ones
     it had already been given: switching language blanked the notices until
     the server answered, which is the second of blank coming back by another
     road. */
  NOTES_HAVE=null; notRead=false;
  BKLIST=null;                         /* what is on the disk, asked again */
}

/* ---- and what a SCREEN forgets when you walk off it ---------------------
   viewReset() above is what a LANGUAGE forgets: it runs when another language
   is opened, and when everything is erased. Those are the only two things
   that call it. Leaving a screen is neither, and there was nowhere for
   "forget this when the screen changes" to live at all.

   OWNER DECISION 2026-08-26: 「この言語については初手は全部閉じてくれ。人が
   見て開くのよ閉じたらまた閉じるし」 -- the article's sections are shut when
   you arrive, and arriving again is arriving. Read by the leader as covering
   coming back, 2026-08-27, and that reading is the specification now.

   Called from render() with the route being left and the route being arrived
   at, at the one moment that already knows the screen changed -- `same` in
   www/glyph.js. Not from go() and goTab() and the three ways back, which is
   the same rule written five times and short by one the day a sixth is added.

   And this is the ONLY place. viewReset() above carried `ABOPEN={}` for a
   day, for the language switch: open a section in one language, switch, and
   the next language's article was already unfolded. That line is gone,
   because langOpen() ends in goTab('profile') -- so switching languages walks
   off the page and arrives here anyway, and two places saying one rule is the
   thing this repo is most often wrong about. Watched: with only this one the
   language-switch claim in tools/world-check.mjs is green, with only that one
   the walking-off claims are red, and with neither both are red.

   The article is two faces of one page (`about` reads it, `world` writes it,
   and wldPage() draws both), so moving between those two is not leaving. */
var ABPAGES={about:1, world:1};
function viewLeft(from, to){
  if(ABPAGES[from] && !ABPAGES[to]) ABOPEN={};
  /* What a bulk delete can put back (`wUndo`, www/words.js) holds words as
     they were AT THE POSITIONS THEY WERE IN, so pressing it after standing
     somewhere else would write those over whatever has happened since --
     which is a restore winning, and docs/DATA_SAFETY.md § 2 is that it must
     not. It lasts exactly as long as you are looking at the list it is about.

     The choice itself is not here and that is deliberate: editing what was
     chosen is a page you GO to, so dropping the selection on the way off this
     screen would empty it on the way to the thing it is for. `viewReset()`
     drops that one. */
  if(from==='words') wUndo=null;
}

/* ---- how much of the screen the phone's own keyboard is covering ------
   This app has no Capacitor keyboard plugin, so WKWebView does not resize
   when the keyboard comes up: it lays a keyboard over the page and leaves
   `position:fixed` exactly where it was. Anything pinned to the bottom of the
   screen is then behind it -- which is every field on the photograph editor,
   and the field is the whole point of that screen.

   `visualViewport` is what the browser knows about it, and the difference
   between the window and the visible part of it IS the keyboard. It goes into
   one custom property, and the screens that pin something to the bottom add
   it to their offset. One listener, one number, and nothing native. */
function vpKbWire(){
  var vv=window.visualViewport;
  if(!vv || !vv.addEventListener) return;
  var set=function(){
    var h=Math.max(0, Math.round(window.innerHeight-vv.height-vv.offsetTop));
    document.documentElement.style.setProperty('--kb', h+'px');
    /* The photograph is one of the things that gets out of the way, so it is
       narrower with a keyboard up than without one -- and every letter on it
       is a fraction of its width. They are drawn again at the width it now
       is, or the line is the size it was on the bigger picture. */
    if(document.getElementById('mk-box')){ pwMarkDraw(); pwMarkFit(); }
  };
  vv.addEventListener('resize', set);
  vv.addEventListener('scroll', set);
  set();
}

/* ---- where you are, and what you came through ------------------------
   Every screen used to be reached by setting one global to a string, and
   every back button was hard-wired to a particular screen. So the word
   editor's back went to the dictionary whether you had come from the
   dictionary or from a grammar stage, a stage had two back buttons -- one
   to the contents and one to the grammar -- and nothing could be opened
   from two places without lying about where it came from.

   A trail instead. Going somewhere pushes it; back pops it and lands on
   whatever you were actually looking at. 「普通に1個前のページに必ず戻る戻る
   ボタン以外いらない」

   A screen is a route and at most one argument -- which word, which stage --
   because a screen that needs two is two screens. */
var NAV=[{r:'profile'}];
function here(){ return NAV[NAV.length-1]; }
function prevPage(){ return NAV.length>1? NAV[NAV.length-2] : null; }
function go(r, a){
  var h=here();
  if(h.r===r && h.a===a) return;
  /* Going back to a page already on the trail is going back, not deeper.
     Without this, contents -> words -> contents -> words piles up four
     screens and the back button walks a circle. */
  var i;
  for(i=NAV.length-2;i>=0;i--){
    if(NAV[i].r===r && NAV[i].a===a){ NAV.length=i+1; route=r; render(); window.scrollTo(0,0); return; }
  }
  NAV.push({r:r, a:a}); route=r; render(); window.scrollTo(0,0);
}
/* ---- a post half written, on the way out ------------------------------
   OWNER DECISION 2026-08-25: 「戻るをした時は確認ダイアログを入れて下書きに
   入れて欲しい」「もう一回開く時には下書きから選べば出てくるだけで、残って
   ほしくない」. So backing out of the composer asks; yes puts what is there
   into the drafts and leaves the composer EMPTY. The post is not lost and it
   is not still sitting in the composer either -- it is in the drafts, which
   is a place you go and choose from.

   The asking is HERE and not at the top of back() unconditionally, because
   DO('back') is not only the back button. The photograph editor's Done is
   back() as well -- www/post.js:1222 and 1228, `.mkr` and `.mkdone` -- and a
   guard with no way through turns finishing a picture into "keep this?",
   asked every time, about a post that is not going anywhere.

   The way through is the screen you are standing ON. The composer is
   `form:post:` and the photograph editor is `form:marks:N`, so Done is not
   leaving the composer and is never asked. Nothing else in the app is
   `form:post:`, so nothing else is asked either.

   What counts as "there is something here" is pwHas() -- the app's own
   answer, the one the send button and draftKeep() already use. A second rule
   written here would be a copy of it, and the two would drift.

   An edit is not a draft. PW.ed is a post that already exists; the drafts
   carry no `ed`, so keeping one would quietly turn an edit into a second
   post. Backing out of an edit is left exactly as it was.

   Returns true when it has taken the press over -- either the person said no
   and stays, or the draft was kept and the trail already moved. */
function backDraftKept(){
  var h=here(), to, keep;
  if(!h || h.r!=='form' || h.a!=='post:') return false;
  if(typeof PW==='undefined' || !PW || PW.ed) return false;
  /* Two different questions, and pwHas() answers the other one. It is "is
     there a post here" -- what the send button and draftKeep() both need --
     and a meaning on its own is not a post, so it says no. What is being
     asked HERE is "is there anything to lose", and a meaning somebody typed
     is something to lose: it is their words, in a field they typed them into,
     and backing out threw them away without a word.
     「何か入ってる時は下書きに保存するかどうかをやるんじゃないの？」

     Not while the day is on it. Under PW.pr that field is readonly and holds
     daySay(), so asking would be asking whether to keep words nobody wrote --
     which is how you teach somebody to press No without reading. */
  if(!pwHas(PW.ln) && !(!PW.pr && String(PW.mn||'').trim())) return false;
  /* THREE ANSWERS IN ONE BOX. OWNER 2026-08-25「下書きに保存しますか？
     はい　いいえ　キャンセル」and, when told window.confirm has two buttons,
     「なんでまず作らないの？早くやれよ」.

     It was two window.confirm calls in a row, because three answers do not
     fit in a box with two buttons. Two boxes for one question is the app
     asking twice about one thing, and the second one arrives with no way to
     tell what pressing it means until you read it.

     It is NOT a new shape. `.pmenu` is what the ... on a post already opens:
     a list of choices, in place, hanging off the thing you pressed. Every
     class here is that menu's own -- no corner, no border and no panel is
     ADDED, which is what rule 18 is about, and it is not a sheet sliding up
     over where you were either. The only new rule is `.pmq`, which is the
     question, and it is a line of text with no box around it. */
  BACKQ = 1; render(); window.scrollTo(0,0);
  return true;
}
/* Whether the back arrow has asked. It is where you are STANDING rather than
   anything the language owns, so viewReset() forgets it -- arriving on another
   screen with a question still hanging off the arrow would be a question about
   a post that is no longer in front of you. */
var BACKQ=0;
/* The three answers. What each one DOES is what the two confirms did; only
   the asking changed. */
function backKeep(){ backAnswer(true); }
function backDrop(){ backAnswer(false); }
function backStay(){ BACKQ = 0; render(); }
function backAnswer(keep){
  /* Where back was going, taken before draftKeep() runs: it ends by going to
     the feed, which is what the Save-a-draft button does. Back is not that
     button -- it goes back one page -- so the trail is put back afterwards.
     Both answers leave the composer empty: a post that is in the drafts and
     still in the composer is the same post in two places, and one that was
     not kept was not kept. 「残ってほしくない」 */
  var to=NAV.slice(0, NAV.length-1);
  BACKQ = 0;
  if(keep) draftKeep(); else PW=pwBlank();
  NAV=to.length? to : [{r:'profile'}];
  route=here().r; render(); window.scrollTo(0,0);
}
/* The box itself, drawn under the back arrow it is about.

   TWO answers and a way out, not three answers. OWNER 2026-08-25:
   「下書きとして保存しますか？／保存する　破棄する／ポップ自体に❌つければ
   いいんじゃない？」-- and before that, of the three-row version:
   「何そのゴミ見みたいなボタン」.

   The third row was the problem. "Cancel" is not a third thing to DO with the
   post; it is not doing any of them, and putting it in the list made three
   rows that read as three equal choices when two of them act on the draft and
   one does not. The ✕ says the same thing in the place every ✕ already says
   it, and the two rows left are the two answers. */
function backQHTML(){
  return '<span class="bkq">'+
    '<span class="bkqq">'+esc(t('post.back.q'))+'</span>'+
    '<span class="bkqr">'+
      '<button class="bkqb keep"' + DO('backKeep') + '>'+
        esc(t('post.back.keep'))+'</button>'+
      '<button class="bkqb drop"' + DO('backDrop') + '>'+
        esc(t('post.back.drop'))+'</button>'+
      '</span>'+
    '<button class="bkqx"' + DO('backStay') +
      ' aria-label="'+esc(t('post.back.stay'))+'">'+ICON_CROSS+'</button>'+
    '</span>';
}
function back(){
  if(BACKQ){ BACKQ = 0; render(); return; }
  if(backDraftKept()) return;
  if(NAV.length>1) NAV.pop(); else NAV=[{r:'profile'}];
  route=here().r; render(); window.scrollTo(0,0);
}
/* Is this screen already behind you? go() lands on one that is by cutting the
   trail back to it rather than pushing, so a screen that wants to finish two
   steps up can ask first and fall back to plain back() when the answer is no.
   Without the asking it would push a way forward to a screen you arrived
   through, and the back button would walk deeper into the app. */
function navHas(r, a){
  var i;
  for(i=0;i<NAV.length-1;i++) if(NAV[i].r===r && NAV[i].a===a) return true;
  return false;
}
/* A form's argument is a name, and a name can change under it. Renaming a
   word tells everything pointing at that word its new name; the trail is one
   of the things pointing at it. Nothing else is touched -- this is a rename,
   not a jump. */
function navRename(a, to){
  var i;
  for(i=0;i<NAV.length;i++) if(NAV[i].r==='form' && NAV[i].a===a) NAV[i].a=to;
}
/* And a name can stop being anything at all. A form whose argument names a
   thing that has been deleted is not a screen to be put back down on, so it
   comes out of the trail entirely -- every occurrence, because you can reach
   one word from another and be standing on it twice. */
function navDrop(a){
  var out=[], i;
  for(i=0;i<NAV.length;i++) if(!(NAV[i].r==='form' && NAV[i].a===a)) out.push(NAV[i]);
  NAV=out.length? out : [{r:'words'}];
  route=here().r;
}
/* A tab is not somewhere you came through, it is where you are. Tapping one
   throws the trail away rather than stacking three tabs on top of it. */
/* Leaving the search tab for a chapter of the build tab: two moves, and the
   pair of them is one thing a row does. It was two statements inside markup. */
function goIn(r){ goTab('build'); go(r); }
function goTab(r){ NAV=[{r:r}]; route=r; render(); window.scrollTo(0,0); }
/* Kept because a hundred lines still read it. It is here()'s route. */
var route='profile';

/* ---- what the app IS, before any route is drawn ------------------------
   Three states, and this is the only place that says which one the app is in.
   It was written out three times -- render() in glyph.js, tabPaint() below,
   and vOb() in onboard.js each carried their own copy of `SET.done` and
   obTourOn() -- and the third state was missing from all three.

   OWNER DECISION 2026-08-26:
     「ログアウトしたら普通にログイン画面だけ出せばいいやろ。
       それ以外は表示させるな。
       ログインしてないのに謎に課金できるしバカやろ。
       他の画面に行かせるな。ログアウトの時は。」

   Answered here, once, rather than by an `if(!netSignedIn())` on each screen
   -- which is what the app had, and what left the settings, the plans and the
   language screens open to somebody with no account. A list of screens to
   guard is a list that is one short the day a screen is added.

   'ob'   the onboarding, which is the app until SET.done
   'door' the door and nothing else -- finished, and signed out of
   'app'  a route, a view, and the bar at the foot

   The tour is 'app' on purpose: it is the app with one thing lit, not a
   screen of the onboarding's own.

   ---- THE ORDER OF THESE TWO LINES IS THE WHOLE THING --------------------

   OWNER 2026-08-27: 「オンボーディング→最後にログイン」「ログアウトした時は
   ログイン画面から動かさない」.

   This used to ask about the session FIRST, and it cost the app its own front
   door. A new phone is not signed in, so it was answered 'door' on line one
   and never reached line two -- **the onboarding could not be got to at all,
   on a phone that had never been used.**

   What was missing is that NOT SIGNED IN IS TWO DIFFERENT PEOPLE, and only
   one of them belongs at the door:

     SET.done false   has not been through the onboarding -- and the sign-in
                      is the LAST STEP OF IT, so sending them to the door is
                      sending them to the end of a walk they have not started
     SET.done true    has been through it and signed out -- the door, and
                      nothing else, which is 2026-08-26 and is untouched

   The paragraph that used to be here said "signed out is the same KIND of
   state as an unfinished onboarding". They are not the same kind, and that
   sentence is why the two got one line. It is taken down rather than
   corrected: a wrong reason left standing next to the right code is how this
   comes back.

   tools/act-check.mjs asks appIs() for all three, and it asks what wipeHere()
   leaves behind. The reason nothing caught this is that the check beside it
   sets SET.done = true before it walks, so every case in this file was about
   the second person. */
function appIs(){
  /* The walk through the app IS the app -- the real screens, dimmed, with one
     thing lit -- so it is answered for before anything else and before the
     session is asked about. It used to fall through to the session line and
     be right by accident: the door was the onboarding's FIRST step for two
     days, so by the time the walk ran somebody was always signed in.
     「オンボーディング→最後にログイン」 OWNER 2026-08-27 put the door back at
     the end, and the walk now runs with no account at all -- which made this
     answer 'door' and put a sign-in form over the app somebody had just drawn
     their first letter into.

     The three answers below are unchanged and this line changes none of them:
     obTourOn() is `!SET.done && ob.step===OB_TOUR`, so it is false for every
     phone that has finished the onboarding, and false for one that has not
     started the walk. tools/open-check.mjs holds all four by reading what is
     on the screen. */
  if(obTourOn()) return 'app';
  if(!SET.done) return 'ob';
  if(typeof netSignedIn!=='function' || !netSignedIn()) return 'door';
  /* AND AN ACCOUNT WITH NO NAME IS STILL AT THE DOOR.
     「アカウントがないならGoogleで続けてもidと@は先に決めないでどうすんの？」
     OWNER 2026-09-03, on a real phone.

     Signing in was the whole test, and it is the wrong one. Apple, Google and
     the mail all end at obIn() (www/onboard.js), which asks the server
     whether this account has a profile row and, when it has none, puts up the
     screen that asks for a name and a handle. That screen was never drawn on
     a phone where SET.done is true: this line answered 'app' the moment there
     was a session, so the walk went straight past it. The account then had no
     row on the server at all -- not a bad handle, no row -- so nobody could
     find, follow or answer them, and meHandle() invented something out of the
     language's name to draw in the @.

     It is a phone that has been through the onboarding, which is most of
     them, and it is every phone that has just deleted an account: that lands
     on the door by leaving SET.done true (www/settings.js § wipeHere).

     `ME.handle` and not OBM.mode: ME is kept per account (meFor() in
     www/me.js), so an empty handle means THIS ACCOUNT has not been named on
     this phone -- which is what the door's last step is for. A person coming
     back, or arriving on a second phone, has it: obIn() writes it from the
     row the moment the answer lands, and it is in storage from then on. */
  if(typeof ME!=='undefined' && ME && !ME.handle) return 'door';
  return 'app';
}

/* ---- every page ------------------------------------------------------
   Its numeral in the book, its name, and which tab it lives under. The back
   button says where it goes and the heading says where you are, side by
   side: 「←目次　Ⅰ 単語」 */
var PAGES={
  feed:    {tab:'feed',    k:'tab.home'},
  explore: {tab:'explore', k:'tab.explore'},
  notif:   {tab:'notif',   k:'tab.notif'},
  profile: {tab:'profile', k:'tab.me'},
  build:   {tab:'build', k:'tab.build'},
  find:    {tab:'build', k:'tab.find'},
  form:    {tab:'build'},
  letters: {tab:'build', k:'toc.letters'},
  kb:      {tab:'build', k:'kb.title'},
  ltset:   {tab:'build', k:'toc.letters'},
  letter:  {tab:'build', k:'lt.title'},
  wsys:    {tab:'profile',  k:'ws.kind'},
  abugida: {tab:'build', k:'ab.title'},
  relate:  {tab:'build'},
  fm:      {tab:'build', k:'word.fm'},
  pos:     {tab:'build', k:'f.pos'},
  reg:     {tab:'build', k:'word.reg'},
  follows: {tab:'profile'},
  glyph:   {tab:'build'},
  spell:   {tab:'build', k:'word.sp'},
  words:   {tab:'build', k:'toc.words'},
  gram:    {tab:'build', k:'toc.gram'},   /* the numeral is dropped on a single stage */

  notes:   {tab:'build', k:'toc.notes'},
  settings:{tab:'profile',  k:'set.title'},
  set:     {tab:'profile'},
  world:   {tab:'profile', k:'wld.title'},
  /* One section of the language's article. Named after the section, not
     after the chapter it sits in -- pageName() below does that for a stage
     and a letter for the same reason. */
  wldart:  {tab:'profile', k:'wld.secs'},
  about:   {tab:'profile', k:'wld.about'},
  /* Which timeline the feed is showing, chosen on a page of its own.
     「右上にフィルター作って」 OWNER 2026-08-28 -- and choosing is a screen,
     so it is a route rather than something that slides up over the one you
     were on. */
  filter:  {tab:'feed', k:'feed.fil'},
  /* And what a search is ordered by, chosen the same way and for the same
     reason: choosing is a screen. */
  sort:    {tab:'explore', k:'sort.title'},
  thread:  {tab:'feed', k:'post.thread'},
  photo:   {tab:'feed', k:'post.pic'},
  drafts:  {tab:'feed', k:'post.drafts.t'},
  langs:   {tab:'profile', k:'langs.title'},
  plans:   {tab:'profile',  k:'plans.title'},
  mod:     {tab:'profile',  k:'mod.title'},
  admin:   {tab:'profile',  k:'admin.title'}
};
function pageName(r, a){
  /* A page opened on a particular thing is named after that thing. The
     letter you are drawing, the stage you are in -- not the chapter it
     belongs to, which the back button already says. */
  if(r==='glyph'){
    var g=(typeof ltById==='function')? ltById(a) : null;
    return (g? ltName(g) : '') || t('lt.untitled');
  }
  if(r==='set'){
    var si, sa=String(a||'');
    for(si=0;si<SETS.length;si++) if(SETS[si].id===sa) return t(SETS[si].k);
    return t('set.title');
  }
  if(r==='relate'){
    var rk=String(a||'').split(':')[0];
    return (rk==='syn'||rk==='ant')? t('word.'+rk+'.add') : t('toc.words');
  }
  /* One of the three lists is named after which one it is. */
  if(r==='ltset') return t(LT_KIND[a] || 'lt.all');
  if(r==='letter'){
    var pl=(typeof ltById==='function')? ltById(a) : null;
    return (pl? ltName(pl) : '') || t('lt.untitled');
  }
  /* A form is named after what it is a form for -- the word, the note, the
     slot -- which the opener knows and nothing else does. */
  if(r==='form'){
    if(FORM && FORM.key===a && FORM.title) return FORM.title;
    return t('tab.build');
  }
  if(r==='gram' && a){
    /* A chapter of the chapter being rebuilt names itself, in the one place
       its name is written -- so the bar and the list cannot disagree about
       what somebody just opened. */
    if(a.indexOf('v2:')===0 && typeof g2ChapName==='function')
      return g2ChapName(a.slice(3));
    var st=(typeof stBy==='function')? stBy(a) : null;
    if(st) return stTitle(st);
  }
  /* THE TWO LISTS BEHIND THE TWO NUMBERS ARE ONE SCREEN, so the name is the
     argument's and not the route's -- the same shape `set`, `ltset` and
     `letter` above already take.

     It said **Build**. `PAGES.follows` carries no `k`, so it fell to the last
     line of this function, which is `t('tab.build')` -- the fallback for a
     route nobody named, printed as the heading of a list of people.
     （リーダーの見立ては「上の言語の名前が出ている」でしたが、出ていたのは
     この行の `tab.build` です。）

     Both keys are already written in all ten languages: they are the words
     under the two numbers on a profile, which is where this screen is
     reached from. Nothing new is added. */
  if(r==='follows')
    return t(String(a||'').split(':')[0]==='ers'? 'me.followers' : 'me.following');
  /* Somebody else's language names itself, the way a letter and a stage above
     do. Its own name until the answer lands, and the screen's name until then. */
  if(r==='about' && a){
    var wl=(typeof wldSeen==='function')? wldSeen(a) : null;
    return (wl && wl.name)? wl.name : t('wld.about');
  }
  var p=PAGES[r];
  return (p && p.k)? t(p.k) : t('tab.build');
}
/* One bar, and it is always the same one: back, where you are, and the count
   if the page has one. Nothing else has a back button anywhere. */
/* `right` is one control pinned to the far end of the bar -- the place every
   phone puts the thing that finishes what you are doing. It is markup rather
   than a count because the only screen that wants it wants a button. */
/* A heading with a `+` at the end of it. 「+は下じゃなくて 意味　　　　+ とか
   じゃない？普通」 -- the mark that adds a row belongs on the row that names
   the list, not under the list where you have to go past everything already
   in it to reach the way to add one more.

   A button that COMMITS a form still says what it does. This is the other
   thing: one more row of a list that is already on the screen. */
function secAdd(label, doAttr, aria){
  return '<div class="sec secadd">'+label+
    '<button class="secplus"'+doAttr+' aria-label="'+esc(aria)+'">'+ICON_ADD+'</button></div>';
}
/* `count` is a POSITION, not a total. Every screen used to put how many
   there were up here -- words, letters, notes, drafts, points, followers, the
   stages done out of fifteen -- and none of it was anything anybody came to
   the screen to find out. 「総数系いらないやろ全部」 The one left is which
   photograph of four you are looking at, which is where you are standing
   rather than how much you have. */
function navTop(count, right){
  var h=here(), pv=prevPage(), n=h.a? '' : tocNum(h.r);
  var lab = pv? pageName(pv.r, pv.a) : t('tab.build');
  /* An arrow and nothing else. It said where it goes -- Home, Build, Profile
     -- next to the name of where you ARE, which is two place names side by
     side and the smaller of them is the one you are leaving.
     「戻るボタンにhomeとかつけなくていいんじゃない？そうしたら矢印だけで済む」
     The word is still there for anybody who cannot see the arrow. */
  return '<div class="navtop">'+
    /* The arrow and, when it has asked something, the box hanging off it.
       Same shape as the ... on a post: the wrapper is what the menu is
       positioned against, so nothing is measured or placed by hand. */
    '<span class="bkw"><button class="back nb"' + DO('back') +
    ' aria-label="'+esc(lab)+'">'+ICON_BACK+'</button></span>'+
    (n? '<span class="navn">'+n+'</span>' : '')+
    /* The settings heading, and only that one, counts presses -- seven of
       them open the screen the owner is the only account on. 「どっか7回
       タップとパスワード要求で」 OWNER 2026-08-26, who picked this heading off
       a screenshot of the two things on screen that carry no action already.
       adminTap() in www/mod.js is where the counting and the door are; what
       is here is which heading.

       The SPAN carries it rather than a button wrapped round it. press-check
       holds anything that is a `button` to 44pt and a heading is eighteen
       pixels, so making the title of every settings screen a thumb-sized
       target in order to hide a door behind it would cost the screen more
       than the door is worth. A `data-do` on any element is pressed. */
    '<span class="navt"' + (h.r==='settings'? DO('adminTap') : '') + '>'+
      esc(pageName(h.r, h.a))+'</span>'+
    (count? '<span class="navc">'+count+'</span>' : '')+
    (right||'')+
    '</div>'+
    /* Under the bar and across the page, not hanging off the arrow. It is
       about leaving this screen, which is what the whole bar is about. */
    (BACKQ? backQHTML() : '');
}
/* Coming back to a screen for a thing that is no longer there -- a word that
   was deleted, a form that was closed, a letter that is gone. Five screens
   said this, in the same nine words, in four files. */
function goneBox(){
  return '<div class="empty"><div class="eb">'+t('form.gone')+'</div></div>';
}
function viewGone(){
  return '<div class="view">'+navTop('')+'<div class="body">'+goneBox()+'</div></div>';
}
/* A field you write one line of the language into. Three screens hold one:
   a word's example, a grammar stage's example, and a post.

   It used to be a field with the app's own keyboard bolted under it, and the
   field was `readonly` because that keyboard was the only way into it. Both
   are gone. The language has a keyboard on the phone now -- a real one, in
   Messages and Mail and everywhere else -- and a second one living only
   inside Lingua was a second answer to a question that has one, in the app
   that needs it least. 「アプリ内キーボードいらないでしょ。アップル拡張だけ。」

   So it is an ordinary field again, set in the letters somebody drew when
   the setting says so. */
/* A textarea, not an input. A line of a made language is a line of writing --
   an example under a word, a post -- and an input is one row that scrolls
   sideways forever: past the width of the phone the text simply left the
   screen, and there was no length at which it stopped.
   「改行されないせいで画面が今でいく」

   It grows with what is in it rather than scrolling, so the whole line is
   always on the screen. `rows="1"` is the floor and lnGrow() raises it; the
   value goes between the tags because that is where a textarea keeps it. */
/* `cls` is for a field that has to say something more about itself than that
   it is a line of the language -- which today is which way the language runs.
   It goes through here rather than being set on the element afterwards
   because the class list is built in one place and a second place setting it
   would win or lose by accident. */
/* A field you write one line of the language into, and it is written in
   ORDINARY LETTERS.

   It used to wear the person's own alphabet, and that is the wrong way round:
   a field is the one place where the point is to know what you are typing.
   「普通に全部自作文字にされるの意味わからん。自分が打ちたい時にこれなんて読むん
   だになったら本末転倒やろ」 Somebody drawing their first eight letters cannot
   read them yet -- that is what drawing them is for -- so a field in them is a
   field you cannot proofread.

   What is DISPLAYED stays in the drawn letters: the timeline, the word list, a
   saved example, the card. And the composer shows the line under the field, in
   the letters, at every direction rather than only the vertical ones -- so
   nothing was lost, it moved to the half of the screen that is for looking. */
function lnField(id, ph, attrs, val, cls){
  return '<textarea id="'+id+'" class="lnin'+
    (cls? ' '+cls : '')+'" '+
    'rows="1" placeholder="'+esc(ph)+'" autocomplete="off" autocorrect="off" '+
    'spellcheck="false"'+(attrs||'')+'>'+esc(val||'')+'</textarea>';
}
/* Made as tall as its text, every time that text changes. A textarea has no
   CSS for "as tall as you need"; the height has to be measured and set, and
   it has to be reset to nothing first or it can only ever grow. */
function lnGrow(id){ lnFit(document.getElementById(id)); }
/* Every one on the page, after it has been drawn. Asked of the document
   rather than given a list of screens, so a field added tomorrow is sized
   tomorrow -- the same argument geTiles() and postFaces() are already
   making one line above the call. */
function lnGrowAll(){
  var xs=document.getElementsByClassName('lnin'), i;
  for(i=0;i<xs.length;i++) lnFit(xs[i]);
}
function lnFit(e){
  if(!e) return;
  /* A column grows the other way. The height of a vertical field is the
     page's to give; what has to be measured is how far across the columns
     have got. Asked of the computed style rather than of the class list,
     because the class that sets it is the language's direction and there are
     two of them. */
  var wm=(window.getComputedStyle? String(getComputedStyle(e).writingMode||'') : '');
  if(wm.indexOf('vertical')===0){
    e.style.height='';
    e.style.width='auto';
    e.style.width=e.scrollWidth+'px';
    return;
  }
  /* `fitin` is a field whose HEIGHT the layout is giving it -- a screen that
     does not scroll has to end somewhere, and a field that grows with its
     text is a screen that does not. It scrolls inside itself instead, the
     way every composer does. */
  if(String(e.className||'').indexOf('fitin')>=0){ e.style.width=''; e.style.height=''; return; }
  e.style.width='';
  e.style.height='auto';
  e.style.height=e.scrollHeight+'px';
}
/* And the bar a ROOT carries, which is a different bar: there is nothing
   behind a root, so it has no way back -- only its name, and at most one
   control at the far end. It was written out on the contents page and again
   on the timeline, and the two had already drifted apart in what they put in
   the corner. Both bars live here now, so which one a screen wears is one
   decision made in one place. */
/* `mid` stands IN PLACE OF the name, and the search is the one screen that
   uses it: the field's own placeholder is the word 「さがす」, so a title over
   it is that word twice and the field was pushed a bar's height down the page
   for it. 「検索画面の検索ボックス下すぎない？」OWNER 2026-09-01. The bar is
   still the one bar -- what goes in the corner and what the bar IS are
   decided here and nowhere else. */
function rootTop(r, right, mid){
  return '<div class="navtop">'+
    (mid || '<span class="navt">'+esc(pageName(r))+'</span>')+
    (right||'')+'</div>';
}
/* The bar is on every screen. It used to be on five of them -- "a tab bar
   belongs on the roots and nowhere else: on an inner page the thing at the
   bottom of the screen is that page's own button" -- which is a defensible
   rule and is not what the app felt like. Twenty of twenty-five screens had
   no way out but back. 「下タブはほとんどの箇所で消える」

   So it is at the bottom of the screen always, and whatever that screen
   keeps at the bottom sits on top of it. */
/* Searching your own language used to be one of these. It is not a place in
   the app -- it is a thing you do to the language -- so it moved to the
   contents page it belongs to, and the bar went back to saying only where
   you are. 「snsの探すと横断検索は別物ね」 */
/* Only which routes are down there, and in what order. What each one is
   CALLED is PAGES' to say, and it already says it -- carrying the key here as
   well meant one screen named twice, in two tables, with nothing to hold them
   together. The feed and the search tab were named `tab.home` and `tab.find`
   in both places, and `tab.find` was doing duty for two different screens. */
var TABS=['feed', 'explore', 'notif', 'build', 'profile'];
function tabBar(){
  var cur=here().r, i, r, n, out='';
  /* THE NUMBER ON THE BELL. 「最後に通知の画面を開いた時刻より新しいものを
     未読とする」「下のタブのベルに数字を出す」 OWNER 2026-09-01.

     The copy is woken and the answer asked for HERE rather than on the
     notices screen, because a count that only becomes true once you have
     opened the tab is a count nobody ever sees: opening the tab is what
     makes it zero. notAsk() is once a session, notWake() reads the copy on
     the handset, so the bell is right on the first frame of whatever screen
     the app opened on. www/sns.js owns all three. */
  notWake();
  notAsk();
  for(i=0;i<TABS.length;i++){
    r=TABS[i];
    /* The mark and nothing else. 「下タブにホームとかつけるのやめない？」
       The name is still said -- as the button's aria-label, because a button
       whose whole content is an aria-hidden drawing has nothing to be called
       by otherwise, and pageName() stays the one place that names a tab. */
    out+='<button class="tab'+(cur===r?' on':'')+'"' + DO('goTab', [r]) +
      (r==='profile'? ' data-hold="1"' : '')+
      ' aria-label="'+esc(pageName(r))+'">'+TAB_ICON[r]+
      /* A NUMBER AND NOT A DISC. Rule 18 -- nothing new gets a corner radius,
         a border or a filled panel -- and the owner asked for 数字, not for a
         red circle. If the filled circle every other timeline wears is what
         is wanted, it is two lines in tools/box-baseline.txt and one word
         from the owner; it is not mine to add. */
      ((r==='notif' && (n=notUnread())>0)
        ? '<span class="tabn">'+esc(String(n))+'</span>' : '')+
      '</button>';
  }
  return '<div class="tabbar">'+out+'</div>';
}
/* ---- holding the profile tab ------------------------------------------
   「インスタと同じようにしたから出てくる。で切り替えタップしたらその言語にいく。
    あかうんとは切り替えられないから、制作の中身だけ変わる」 OWNER 2026-08-27.

   It goes to the `langs` PAGE -- the one Settings has always linked to, drawn
   by vLangs() in www/home.js. Not a sheet over the tab bar: CLAUDE.md bans
   「ページ遷移型にせず下からひょいって出すやつ」 and also says choosing is a
   screen and changing is the screen you arrive at, which is this exactly. The
   switcher the owner is describing was already built as a page on 2026-08-25;
   what was missing was a way to reach it without going through Settings, and
   that is all this is. The list STAYS in Settings 「せっていからでいいよ」 --
   this is the short way to the same page, not a second copy of it.

   What it does NOT do is change who is signed in. langOpen() writes the old
   language out, reads the new one in and calls viewReset(); it never touches
   `lingua.me` or `lingua.sess`, and vLangs() draws language names and no
   faces. 「あかうんとは切り替えられない」 is a property of what is called here,
   not a rule this file has to remember.

   The press is delivered on `click`, in www/act.js, and a hold would arrive
   there as an ordinary press of the profile tab on the way back up. So the
   hold sets HELD and the capture-phase listener below eats that one click --
   capture, because act.js's own listener is on the same root and would
   otherwise run first. */
/* A THUMB IS NOT A TRIPOD, and until 2026-09-01 this asked for one.
   `touchmove` went straight to holdClear() with no threshold, so the hold
   died the moment the finger moved by a single pixel -- which a finger
   resting on glass always does. Measured on a phone with real touch events:
   perfectly still reached the language switcher, one pixel reached nothing,
   and so did six and forty. **The gesture had never once been made by a
   hand.** Nothing threw and every check was green, because what press threw
   was a click, and a click is mousedown and mouseup in the same millisecond.

   So the start is remembered and the move is measured against it. `HOLD_SLOP`
   is a RADIUS -- squared on both sides rather than Math.hypot, which
   es5-check forbids and which this does not need.

   **HOLD_SLOP is 10px, and that is the owner's, decided 2026-09-01.** The
   other number put to them was 16: wider survives a shakier thumb, and pays
   for it in scrolls that turn into a language switch. Ten was chosen. It is
   not this file's to move. */
/* HELD_MS is how long the swallowed click has to arrive in.
   「言語切り替えする時も2回タップしないと変わらない」 OWNER 2026-09-02.

   HELD was a flag with no lifetime: set when the hold fired, and cleared by
   the next click ANYWHERE. On a phone that click often never comes -- iOS does
   not always send one after a long press, and the page has changed under the
   finger by then -- so the flag stood, and the next tap the person made, on
   the screen the hold had just opened, was eaten instead. Two taps to switch a
   language, every time, and the first one silently did nothing.

   It is closed twice, because either alone leaves a case: a window, so a flag
   nobody claimed goes stale on its own, and a new touch, because starting
   another gesture is proof the last one is over. */
var HOLD_MS=500, HOLD_SLOP=10, holdT=null, HELD=false, holdX=0, holdY=0, heldAt=0,
    HELD_MS=700;
/* Where the finger is, from a touch or from a mouse. A touchend carries its
   point in `changedTouches`, because by then it is no longer touching. */
function holdAt(e){
  var t=(e.touches && e.touches[0]) ||
        (e.changedTouches && e.changedTouches[0]) || e;
  return {x:t.clientX||0, y:t.clientY||0};
}
function holdStart(e){
  var el=e.target, p;
  /* A NEW GESTURE ENDS THE LAST ONE. Before the early return below, because a
     touch that lands on something with no `data-hold` is still a touch, and it
     is still proof that the hold before it is done with. */
  HELD=false;
  while(el && el!==document && el.getAttribute && !el.getAttribute('data-hold')) el=el.parentNode;
  if(!el || !el.getAttribute || !el.getAttribute('data-hold')) return;
  holdClear();
  p=holdAt(e); holdX=p.x; holdY=p.y;
  holdT=setTimeout(function(){
    holdT=null; HELD=true; heldAt=Date.now();
    goTab('profile'); go('langs');
  }, HOLD_MS);
}
/* Moved far enough to be going somewhere rather than resting. Under the
   radius nothing happens at all -- not a reset of the timer, which would be
   a hold that a slowly sliding thumb could keep alive forever. */
function holdMove(e){
  var p, dx, dy;
  if(!holdT) return;
  p=holdAt(e); dx=p.x-holdX; dy=p.y-holdY;
  if(dx*dx+dy*dy > HOLD_SLOP*HOLD_SLOP) holdClear();
}
function holdClear(){ if(holdT){ clearTimeout(holdT); holdT=null; } }
function holdEat(e){
  if(!HELD) return;
  HELD=false;
  /* Only the click the hold itself produced, which arrives at once. Anything
     later is somebody pressing something, and a press is not this gesture's
     to swallow. */
  if(Date.now()-heldAt > HELD_MS) return;
  e.stopPropagation(); e.preventDefault();
}
/* Capture, and on `document`: act.js listens on the app root in the bubble
   phase, so capture here is the only place that runs before it. */
document.addEventListener('touchstart',  holdStart, false);
document.addEventListener('touchend',    holdClear, false);
document.addEventListener('touchmove',   holdMove,  false);
document.addEventListener('touchcancel', holdClear, false);
document.addEventListener('mousedown',   holdStart, false);
document.addEventListener('mouseup',     holdClear, false);
document.addEventListener('click',       holdEat,   true);
/* ---- sliding down a list that is being chosen from ----------------------
   「全て選択ってボタン出さないで欲しい。なくていいよ。その代わりスライドで下
   ビューで選択できるようにしたい」 OWNER 2026-09-01.

   The button it replaces acted on rows nobody could see -- a filter and a
   sort decide which rows "all" means, and the answer changed under it. A
   thumb slid down a run of rows means exactly the rows it crossed.

   WHAT IT SLIDES ON is the mark at the front of the row, and that is the
   whole of why the mark moved there. A list being chosen from is still a
   list you have to get to the bottom of, so a drag anywhere else on it must
   still scroll; the marks are a 44px column that is not for scrolling, and
   a finger put down there is not going anywhere else.

   It runs the row's OWN name -- the same `data-do` its tap carries -- so
   there is no second table, no second answer to what a row does, and
   nothing new registered. Each row is run at most once per slide, so a
   thumb that wavers does not turn a row on and off again. */
var SLD=null, SLDN=0;
function slideRow(x, y){
  var el=document.elementFromPoint(x, y);
  while(el && el!==document && el.getAttribute && !el.getAttribute('data-sel'))
    el=el.parentNode;
  return (el && el.getAttribute && el.getAttribute('data-sel'))? el : null;
}
function slideStart(e){
  var p=holdAt(e), el=slideRow(p.x, p.y);
  SLD=el? [el] : null; SLDN=0;
}
/* The row the finger STARTED on is run here rather than left to the click,
   because a touch that moved is a touch iOS may not turn into one. It is in
   `SLD` from the start, so this runs it once and the loop below skips it. */
function slideMove(e){
  var p, el;
  if(!SLD) return;
  p=holdAt(e); el=slideRow(p.x, p.y);
  if(!el) return;
  if(SLD.length===1 && SLD[0]===el){
    if(SLDN) return;
    SLDN=1; actDo(el); return;
  }
  if(SLD.indexOf(el)>=0) return;
  if(!SLDN){ SLDN=1; actDo(SLD[0]); }
  SLD.push(el); actDo(el);
  /* The list must not scroll under a thumb that is choosing rows. */
  if(e.cancelable) e.preventDefault();
}
function slideEnd(){ SLD=null; }
/* And the click that follows a slide is eaten: the row under the finger when
   it lifted has already been run by the slide. */
function slideEat(e){
  if(!SLDN) return;
  SLDN=0; e.stopPropagation(); e.preventDefault();
}
document.addEventListener('touchstart',  slideStart, false);
document.addEventListener('touchmove',   slideMove,  {passive:false});
document.addEventListener('touchend',    slideEnd,   false);
document.addEventListener('touchcancel', slideEnd,   false);
document.addEventListener('click',       slideEat,   true);

/* ---- how much of the screen the page can actually see ------------------
   The software keyboard does not shrink `100dvh`. It slides OVER the page, so
   a screen sized to the viewport is a screen whose foot is behind the
   keyboard from the moment somebody starts typing -- which is the only moment
   the composer is being looked at. 「キーボード込みでに決まってるやん」

   `visualViewport` is the only thing that knows, and it is the one place that
   asks: everything else reads `--vvh`. Where there is no visualViewport there
   is no software keyboard sliding over anything either, and the fallback is
   what this was.

   `--tabgap` is the room the bar at the foot needs. It is fixed to the LAYOUT
   viewport, so with the keyboard up it is behind the keyboard and there is
   nothing to leave room for -- leaving it anyway costs sixty points of a
   screen that has just lost half its height. */
/* The smallest the visible part has been on this phone, this launch -- which
   is what it is with the keyboard up. A form that is one screen is laid out
   to THIS and not to --vvh, because a layout that follows --vvh is a layout
   that moves every time the keyboard goes down: the field stretches, and the
   meaning and the row of pictures under it slide to the foot of the phone.
   「キーボードをおろしても位置は動かない」「キーボード開いてない時に写真とかが
   下の位置にある」

   Until a keyboard has actually been up there is nothing to measure, so it
   starts as a guess -- 55% of the phone, which is about what is left over an
   iPhone's kana keyboard and its accessory bar.

   THE GUESS IS ONLY EVER LOWERED, so on most phones it is never replaced,
   and the sentence that used to stand here -- "the first time one opens, the
   guess is replaced by the truth and the composer settles" -- was true only
   where the keyboard covers more than 45% of the screen. Measured
   2026-08-27, one value per phone, the keyboard fully up:

     390x844, keyboard 336   visible 508   --vvmin stays at the guess, 464
     375x667, keyboard 300   visible 367   --vvmin 367, the same by accident
     320x568, keyboard 260   visible 308   --vvmin 308, the truth

   So on a 390x844 the composer is laid out to 464 while it has 508, and the
   44 it does not use is under the row over the keyboard. Nothing is broken by
   it and nothing is hidden -- the row has a background and stands on the
   keyboard either way -- so it is left exactly as it is: making the box taller
   moves a screen that was laid out by measurement (the 162 floor, the two
   fields of a reply) and that is somebody's to look at on a phone first.
   docs/BACKLOG.md carries it. */
var vvMin=0, vvWas=0, vvKbMax=0;
/* Is there a keyboard, or is one on its way? Nothing on a phone answers that
   in advance -- `visualViewport` says how much is hidden AFTER iOS has
   finished moving it, and a field being focused is what brought the keyboard
   up in the first place. So this is the question asked, and it is asked of
   the page rather than of a screen name: `--vvkb` is read by one rule
   (`.view.fit .pwbar`) and by nothing else. */
function vvTyping(){
  var e=document.activeElement;
  if(!e) return false;
  return e.nodeName==='INPUT' || e.nodeName==='TEXTAREA' || !!e.isContentEditable;
}
function vvFit(){
  var v=window.visualViewport, h=v? v.height : window.innerHeight;
  /* 120 rather than 0: a phone's address bar sliding away is also a change of
     height and is not a keyboard. */
  var up=(window.innerHeight-h)>120;
  var d=document.documentElement.style;
  /* A phone that turned, or a window somebody dragged, is a different screen
     and the old smallest means nothing on it. */
  if(window.innerHeight!==vvWas){ vvWas=window.innerHeight; vvMin=0; vvKbMax=0; }
  /* AND WHAT THIS PHONE'S KEYBOARD WAS LAST TIME. 「返信の画面固定してるはず
     なのに鬼動くけど？」 OWNER 2026-09-01.

     The paragraph above says the first keyboard of a launch still rises with
     the layout, because how tall a keyboard this phone has is not knowable
     before one has been up. It is knowable: it was measured on this phone,
     the last time one was up, and a keyboard does not change size between two
     launches of the same app. So the measurement is kept -- in SET, which is
     the settings and one of the three things that are the phone's
     (CLAUDE.md), and NEVER in a language.

     Kept against the height of the screen it was measured on, and read back
     only when that matches: a phone that turned, or the app in a window
     somebody dragged, is a different screen and last night's number means
     nothing on it. That is the same test the line above already makes. */
  if(!vvMin && SET.vvkb && SET.vvkb.on===window.innerHeight){
    if(SET.vvkb.min) vvMin=SET.vvkb.min;
    if(SET.vvkb.kb) vvKbMax=SET.vvkb.kb;
  }
  if(!vvMin) vvMin=Math.round(window.innerHeight*0.55);
  if(h<vvMin) vvMin=h;
  d.setProperty('--vvmin', vvMin+'px');
  d.setProperty('--vvh', h+'px');
  /* Where the visible part STARTS. iOS scrolls the layout viewport to lift a
     focused field clear of the keyboard, and a screen pinned to the document
     goes up with it -- so the bar carrying Post left the top of the phone.
     A one-screen form is pinned to this instead. */
  d.setProperty('--vvtop', (v? v.offsetTop : 0)+'px');
  /* HOW TALL THE KEYBOARD IS, which is the one thing nothing here measured.
     「Aaとかがキーボードの上に引っ付いてる形なんだけど、それをカメラとか
     フォルダのマークでやって欲しい」 OWNER 2026-08-25, with a picture of
     Twitter's row.

     The row was the last child of a box `--vvmin` tall, so it sat on the foot
     of THAT -- which is where the keyboard was the last time one was up, and
     is not the keyboard. What is left over below the visible part is the
     keyboard itself, and a row pinned to that rides up and down with it.

     WHAT IS MEASURED IS NOT WHAT IS TRUE WHILE THE KEYBOARD IS MOVING, and
     that is the whole of the bug the owner photographed.
     「2枚目が正解なのに1枚目みたいにまだガチャガチャうごくのうざい。
     写真とかは固定でしょ？」 OWNER 2026-08-27, two photographs a second
     apart: no row in the first, the row in the second, one screen.

     Measured, at 390x844 with a 336pt keyboard: while the keyboard is rising
     and the viewport has not been told yet, `innerHeight - h` is 0 -- which
     is the same answer as no keyboard at all -- so the row sat at bottom:0,
     UNDER the keyboard. That is the first photograph. Then the value arrives
     and it leaps 336px. And every intermediate value iOS hands over on the
     way moves it again, one position per event, which is the shaking.

     X's row does not do this because it is stuck to the keyboard natively
     (`inputAccessoryView`), and we took that road away today -- `hideForm-
     AccessoryBar()` in MainViewController.swift. So the height has to be
     REMEMBERED instead: the deepest reading of this launch, on this screen.
     A keyboard is a property of the phone and does not change size between
     two openings of the same composer, so once it has been seen once the row
     can be put in the right place on the frame the field is focused -- before
     iOS has said anything -- and every value that arrives afterwards is
     smaller than the one already in use and moves nothing.

     The first keyboard of a launch still rises with it: how tall a keyboard
     this phone has is not knowable before one has been up, and guessing it
     would be a number nobody measured. It only ever grows, so it does not
     shake on the way.

     It is `vvTyping()` and not this measurement that decides whether there is
     a keyboard at all, because the measurement says 0 both when the keyboard
     is down and when it is half way up.

     What is remembered is the KEYBOARD, and what is written out is where the
     TOP OF IT is in the page -- and those are two numbers, which the one line
     this replaced had as one. `offsetTop` is how far iOS has scrolled the
     page up to clear the focused field; the keyboard has not moved, the page
     under it has, so the row has to come down by exactly that much to stay on
     it. Measured with the page lifted 40: the keyboard is still 336 tall and
     its top is 296 up from the foot of the page. Remembering the number with
     the scroll already taken out of it would have frozen the row 40 clear of
     the keyboard for as long as iOS held the page up. */
  var off=(v? v.offsetTop : 0);
  var kb=Math.max(0, window.innerHeight - h);
  if(kb>vvKbMax){ vvKbMax=kb; vvKeep(); }
  d.setProperty('--vvkb', Math.max(0,(vvTyping()? vvKbMax : kb) - off)+'px');
  d.setProperty('--tabgap', up? '10px' : 'calc(var(--tabh) + 10px)');
}
/* Written when the number GROWS and not on every event: this runs on every
   resize and scroll of the visual viewport, which is many a second while a
   keyboard is moving. Two numbers and the screen they were measured on. */
function vvKeep(){
  var was=SET.vvkb;
  if(was && was.on===window.innerHeight && was.kb===vvKbMax && was.min===vvMin) return;
  SET.vvkb={on:window.innerHeight, kb:vvKbMax, min:vvMin};
  save();
}
function vvMount(){
  vvFit();
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', vvFit, false);
    window.visualViewport.addEventListener('scroll', vvFit, false);
  }
  window.addEventListener('resize', vvFit, false);
}
/* ---- going back without reaching for the corner -------------------------
   The way back is a button in the top-left corner, which on a phone held in
   one hand is the one place a thumb cannot get to. Every screen keeps it --
   this is a second way to the same thing, not a replacement.
   「全部戻るボタンじゃなくて携帯の右からスライドして戻るのも追加してほしい。両方」

   FROM EITHER EDGE. The right edge, dragged left, is what was asked for on
   2026-08-27 -- 「携帯の右からスライドして戻るのも追加してほしい。両方」 -- and
   it was the only one, so the LEFT edge, which is where iOS puts its own back
   gesture and where a thumb goes without being told, did nothing.
   「画面の左側スワイプで全部戻れるようになってないんだけどなんで？」 OWNER
   2026-09-02. Both now: from the left, dragged right; from the right, dragged
   left. One is the phone's habit and one is the owner's, and neither costs the
   other anything.

   Three things it must not do. It must not fire on a drawing: the glyph
   editor is a canvas that goes to the edge of the screen and a stroke ending
   there is a stroke, not a gesture. It must not fire while a key is being
   carried, which is a drag of its own. And it must not fire on something that
   scrolls sideways -- a row of tabs, a grid being reordered -- so the gesture
   has to be mostly horizontal AND start within a thumb's width of the edge.

   pointer* and not touch*: this app is one webview and pointer events are
   what it has. Passive, because it never prevents the default -- a gesture
   that cancels a scroll it has decided against is worse than no gesture. */
var swX=0, swY=0, swOn=false, swWay=0;
function swStart(e){
  swOn=false;
  if(!e.isPrimary) return;
  if(here().r==='glyph' || kbWob) return;
  var t=e.target;
  while(t && t!==document.body){
    var n=t.nodeName;
    if(n==='CANVAS' || n==='INPUT' || n==='TEXTAREA') return;
    t=t.parentNode;
  }
  /* Which edge it started at, and therefore which way it has to go. A thumb's
     width, the same 30 on both, because it is the same thumb. */
  if(e.clientX <= 30) swWay=1;
  else if(e.clientX >= window.innerWidth-30) swWay=-1;
  else return;
  swX=e.clientX; swY=e.clientY; swOn=true; swPic=true;
}
/* ---- the screen behind, while one is being dragged off it ---------------
   「iPhone標準みたいに左側になんかふわってやつ出てきてほしい」 OWNER
   2026-09-02, after the left edge started working at all.

   THE SCREEN YOU CAME FROM, KEPT BY render(). Two of them and not one: which
   screen it was, and its HTML as it was left. A pair, because the picture is
   only worth showing when the route it belongs to is the one `back()` would
   take you to -- otherwise it is a screen from somewhere else entirely,
   sliding in under a gesture that will not land there. */
var NAVBK=null;
function navKeep(r, html){ NAVBK=(r && html)? {r:String(r), html:html} : null; }
/* Where back() would go. NAV's last entry is where you are. */
function navBackTo(){ return (NAV.length>1)? String(NAV[NAV.length-2].r||'') : ''; }
/* The screen under the one being dragged, or nothing.

   Nothing is REBUILT here and that is the point: calling a view again runs it
   -- vNotif() marks the notices read, three screens pull -- so an abandoned
   swipe would have done all of it. render() keeps what it replaces. */
function swPrev(){
  var to=navBackTo();
  return (NAVBK && to && NAVBK.r===to)? NAVBK.html : '';
}
function swLayer(){ return document.getElementById('swprev'); }
/* Following the thumb. `pointermove` and not touchmove, and never passive
   while the gesture is live: once it IS a back gesture, the page must not
   scroll under it. Until then it is nothing and the page is left alone --
   which is why swLive is a second flag and not the same one as swOn. */
var swLive=false, swW=1, swPic=true;
function swMove(e){
  if(!swOn) return;
  var dx=e.clientX-swX, dy=e.clientY-swY, p;
  if(!swLive){
    /* Not yet mine. It becomes a back gesture when it has gone far enough the
       right way AND is mostly sideways; a thumb heading down the page is the
       page scrolling and this never sees it again. */
    if(Math.abs(dy) > Math.abs(dx)){ swOn=false; return; }
    if(dx*swWay < 12) return;
    /* NO PICTURE IS NOT NO GESTURE. This said `swOn=false` when there was
       nothing kept to show -- and swEnd() returns on `!swOn`, so the plain
       gesture below it, the one that goes back without animating, could
       never run again. Adding the picture took the gesture away wherever the
       picture was missing: the first screen of a tab, and the screen after
       any tab switch. It only drops the drawing. */
    if(!swPic) return;
    p=swPrev();
    if(!p){ swPic=false; return; }
    swLive=true;
    swW=window.innerWidth||1;
    var el=swLayer();
    if(el) el.innerHTML=p;
    document.documentElement.classList.remove('swgo');
    document.documentElement.classList.add('swon');
  }
  if(e.cancelable) e.preventDefault();
  swDraw(Math.max(0, Math.min(swW, dx*swWay)));
}
/* One place that says where the two screens stand for a given travel. The
   one behind comes in from a third of the way out, which is the depth iOS
   gives it -- it is behind, so it moves less. */
function swDraw(d){
  var app=document.getElementById('app'), el=swLayer(), a=d*swWay;
  if(app) app.style.transform='translateX('+a+'px)';
  if(el) el.style.transform='translateX('+((d-swW)/3*swWay)+'px)';
}
function swClear(){
  var app=document.getElementById('app'), el=swLayer();
  document.documentElement.classList.remove('swon');
  document.documentElement.classList.remove('swgo');
  if(app) app.style.transform='';
  if(el){ el.style.transform=''; el.innerHTML=''; }
}
function swEnd(e){
  if(!swOn) return;
  swOn=false;
  var dx=e.clientX-swX, dy=e.clientY-swY, d=dx*swWay;
  if(!swLive){
    /* No picture to drag -- the screen behind was not kept, or this is the
       first screen. The gesture still works, it simply does not animate. */
    if(d < 70) return;
    if(Math.abs(dy) > Math.abs(dx)*0.6) return;
    back();
    return;
  }
  swLive=false;
  /* Past a third of the way is going. Under it springs back. Either way it
     travels rather than jumping -- `swgo` is what puts the transition on. */
  var go=(d > swW/3);
  document.documentElement.classList.add('swgo');
  swDraw(go? swW : 0);
  setTimeout(function(){
    swClear();
    if(go) back();
  }, 230);
}
/* ---- putting the keyboard down -----------------------------------------
   「投稿画面は下させるな、投稿画面以外は絶対下させろって話」 OWNER 2026-08-27.

   Half of that was already true and half of it was nowhere. There is no
   .blur() anywhere in www/ -- the app has never had a way to put a keyboard
   down, and left it entirely to what iOS does on its own, which on a page
   where every tap lands on something is not much. The only thing that puts
   one back UP is pwKeepKb(), and that is bolted to the composer by two
   guards, so 「投稿画面は下させるな」 has been right from the start.

   Tapping the paper is the way, and it is the one that cannot break a press:
   anything somebody meant to press -- a field, a button, a link, a label, a
   select, anything carrying an action name -- is left alone and does what it
   always did. What is left is the margins, the headings and the prose, and
   none of those has ever done anything when pressed.

   `pointerdown` and beside the back gesture, because this is the same kind of
   thing: one listener above an app whose screens are thrown away and rebuilt
   several times a second.

   The composer is the exception and asks the same question pwKeepKb() asks,
   in the same words -- two places saying "am I the composer" that must not
   drift, which is why neither invents its own test. */
function kbLetGo(e){
  var a=document.activeElement;
  if(!a) return;
  if(a.nodeName!=='INPUT' && a.nodeName!=='TEXTAREA' && !a.isContentEditable) return;
  if(here().r==='form' && here().a==='post:') return;
  var t=e.target, n;
  while(t && t!==document && t.nodeName!=='BODY'){
    n=t.nodeName;
    if(n==='INPUT' || n==='TEXTAREA' || n==='BUTTON' || n==='A' ||
       n==='LABEL' || n==='SELECT' || t.isContentEditable) return;
    if(t.getAttribute && t.getAttribute('data-do')) return;
    t=t.parentNode;
  }
  a.blur();
}
function swMount(){
  document.addEventListener('pointerdown', kbLetGo, {passive:true});
  document.addEventListener('pointerdown', swStart, {passive:true});
  /* NOT passive: once this is a back gesture it stops the page scrolling
     under it, which is the one thing a passive listener may not do. */
  document.addEventListener('pointermove', swMove, {passive:false});
  document.addEventListener('pointerup', swEnd, {passive:true});
  /* A thumb that leaves the glass mid-drag, or a call arriving. Without this
     the screen stays where the finger left it. */
  document.addEventListener('pointercancel', function(){
    if(!swOn && !swLive) return;
    swOn=false; swLive=false; swClear();
  }, {passive:true});
  document.addEventListener('pointercancel', function(){ swOn=false; }, {passive:true});
}
/* And the bar is put on the page here, once, into an element beside #app that
   render() never rewrites. Writing it into each screen's HTML meant it was
   thrown away and built again -- blur and all -- on every navigation, which
   on a phone is the bar blinking out. Nothing is rebuilt unless the answer
   changes: which tab is lit, and which language it is saying it in. */
function tabPaint(){
  var host=document.getElementById('tabs');
  if(!host) return;
  /* A one-screen form has no bar of tabs. It is not a place in the app while
     it is open -- it is a thing being written -- and the room the bar takes
     is room the picture row needs. 「投稿画面にはホーム画面とかの下タブは要らない」 */
  var one = here().r==='form' && FORM && FORM.fit;
  /* AND THE PAGE UNDER IT DOES NOT MOVE. 「返信画面ガタガタ揺れるの全然直らない
     けど本気で揺らせば上から下まで揺れるんだけどなんで固定してないの？」 OWNER
     2026-09-01.

     `.view.fit` is `position:fixed` and pinned to `--vvtop`, which is
     `visualViewport.offsetTop` -- how far iOS has scrolled the LAYOUT viewport
     to lift the focused field over the keyboard. A fixed element on iOS is
     positioned against the layout viewport, so it goes up with it, and
     `--vvtop` is what brings it back down.

     What was left out is the DRAG: pull the page and iOS rubber-bands the
     layout viewport, `offsetTop` changes on every frame of it, and this
     screen chases the number one event behind. That is the shaking, and it
     is the whole screen because the whole screen is the fixed element.

     So the document is locked while a one-screen form is open: nothing to
     rubber-band, `offsetTop` stays where the keyboard put it, and the screen
     stops moving. What scrolls inside it -- the quoted post, the field -- is
     unaffected: they scroll in their own boxes and always did. */
  if(one) document.documentElement.className+=
    (document.documentElement.className.indexOf('fitlock')>=0? '' : ' fitlock');
  else document.documentElement.className=
    document.documentElement.className.replace(/\s*fitlock/g, '');
  /* And the walk through the app has it, because the walk IS the app: the
     onboarding is not done, so this used to hide the bar on every screen the
     walk stands on -- and the first thing the walk points at is the tab that
     opens the making side. 「制作ボタン押してキーボードの画面開いてとかないよ？」
     Everything before the walk -- drawing, the alphabet, the name -- is a
     screen of the onboarding's own and still has no bar. */
  /* THE COUNT IS PART OF WHAT THE BAR IS. The signature is what decides
     whether the bar is worth building again, and it was the route and the
     language -- so the bell's figure was drawn once per screen and never
     moved. A notice arriving while somebody sat on the timeline called
     render(), the route had not changed, and the bar was skipped: the number
     appeared the next time they went somewhere else, not when the notice
     came.

     `press` is what found it -- it reported `.tabn` as worn by nothing, which
     was true for a reason that had nothing to do with the fixture: within one
     page the bar for a route is built once, and if the count was 0 at that
     moment there was no road back to any other number. */
  var sig = (appIs()==='app' && !one)
    ? (here().r+'|'+uiLang()+'|'+notUnread()) : '';
  if(host.getAttribute('data-sig')===sig) return;
  host.setAttribute('data-sig', sig);
  host.innerHTML = sig ? tabBar() : '';
}
/* A switch, where a setting is a yes or a no and nothing else.
   「トグルをつけろって言ってんだろオンオフのカタカナやめろよ」

   The value used to be the word ON, translated ten ways -- so a row of
   settings was a column of nouns, and which of them were switches and which
   opened onto something was a thing you found out by pressing. A switch is
   the shape of its own answer and reads at a glance in any language.

   `aria-hidden`: the row it sits in is the button, and that button already
   says both the setting's name and its state. */
function swtHTML(on){
  return '<span class="swt'+(on? ' on':'')+'" aria-hidden="true">'+
    '<span class="swk"></span></span>';
}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var tt;
/* ---- THE POPUP, and there is one -------------------------------------
   「正直自前のpopがいいんだけどな。iPhoneのやつ使ってるsnsないしな」
   「ポップは角丸でいいから」 OWNER 2026-09-01.

   Everything the app asks or says over a screen comes through here: the paid
   doors and the "are you sure" before something goes. One shape, one place,
   and the caller supplies the words -- 「ポップの見た目決めてその中の文字だけ
   入れ替えればすぐできるでしょ」.

   Three shapes were made and thrown away before this one, and they are worth
   naming so a fourth is not invented: openForm() is `go('form', key)`, a page
   you travel to; #sheet slides up from the bottom, which is the third of the
   four shapes banned outright; confirm() is iOS's own, banned on 2026-09-01.
   This one sits in the middle of the screen, over the scrim, and does not
   navigate -- the screen underneath is still there when it goes.

   `yes` is what happens if they say yes. There is no callback for no: no is
   the popup going away and nothing having happened, which is what no means. */
var POP_YES=null;
function popAsk(msg, yes, yesWord, noWord){
  var el=document.getElementById('pop'), bg=document.getElementById('sbg');
  if(!el || !bg){ /* no DOM to draw on: do nothing rather than act unasked */
    return; }
  POP_YES=yes||null;
  el.innerHTML='<div class="popm">'+esc(msg)+'</div>'+
    '<button class="btn ghost"' + DO('popYes') + '>'+esc(yesWord||t('up.cta'))+'</button>'+
    '<button class="btn ghost popno"' + DO('popOff') + '>'+esc(noWord||t('pop.no'))+'</button>';
  bg.classList.add('on'); el.classList.add('on');
}
function popYes(){
  var f=POP_YES;
  popOff();
  if(f) f();
}
/* Taken down by the yes, by the no, by the scrim, and by any navigation --
   the last from render(), because a popup that outlives the screen under it
   is one nobody can get rid of. */
function popOff(){
  var el=document.getElementById('pop'), bg=document.getElementById('sbg');
  if(el) el.classList.remove('on');
  if(bg) bg.classList.remove('on');
  POP_YES=null;
}
function popOn(){
  var el=document.getElementById('pop');
  return !!(el && el.className.indexOf('on')>=0);
}
/* ---- the ceiling, said where it is met ---------------------------------
   「+を押したらそのまま課金のポップが出るだけでしょ？」 OWNER 2026-09-01.

   THIS IS iOS's OWN DIALOG AND NOT A SHEET. Two goes at it were wrong and
   both are worth writing down, because the second looked right:

     openForm('up', …)   is `go('form', key)` -- a page you travel to.
                         「それはポップじゃなくてページ遷移やろ」
     #sbg / #sheet       is the app's own sheet, and it slides up from the
                         bottom, which is the third of the four shapes the
                         owner banned outright: 「ページ遷移型にせず下から
                         ひょいって出すやつ」. Reusing markup that was already
                         there did not make it a different shape.

   So it is confirm(), which is what capStop() has always used for the word
   ceiling, and it is the same argument: the plans screen is one tap away and
   this has to be answerable with "no"; iOS draws it, so it is not a shape
   this app chose; and nobody is moved off the screen they are standing on
   unless they say yes. 「システム標準（iOS/Android）を最優先」 */
function toast(m){
  var el=document.getElementById('toast'); el.textContent=m; el.classList.add('on');
  clearTimeout(tt); tt=setTimeout(function(){el.classList.remove('on');},1900);
}
/* Changing the screen is all this does. Where it lands is render()'s to say,
   and it says the top, because the screen is a different one. */
/* ---- A part of speech is stored as a key ------------------------------
   What is saved on a word is one of n / v / adj / x. "noun" and "名詞" are
   only the label that key wears in whichever language is on screen. Same
   idea as the reading approximation.
   Without this, translating the interface would leave the old language
   frozen inside every dictionary anyone had already written. */
/* Four was not a language's worth. 「品詞は3種類しかないんですか？は？」 -- it was
   four, three of them plus "other", which is the same complaint. A language
   being invented needs at least somewhere to put a pronoun, a particle, a
   conjunction and a name, because those are the words a grammar is made of
   and they were all landing in "other" together.

   The key is what is stored; the label is what that key wears in whichever
   of the ten interface languages is on screen, so an old dictionary keeps
   working and a translated one is not frozen in the language it was written
   in. Nothing is renamed here, so nothing already saved moves. */
/* `idm` is an idiom -- a thing a language has that is not one word doing one
   job, and the one entry here that is a KIND of entry rather than a part of
   speech. It is on this list because it is chosen in the same place and
   filtered in the same place, and a second list beside this one would be a
   second thing every screen has to know about.
   「単語ページにイディオムを追加できるようにしよう。品詞のところにイディオムって
   入れたり」 It goes last but one, before "other". */
var POS=['n','v','adj','adv','pro','num','part','conj','intj','aff','nm','idm','x'];
var POS_ALL='*';                       /* the key for "all" */
function posLabel(k){
  if(k===POS_ALL) return langDef().all;
  return langDef().pos[k]||k;
}
/* A CSV can say 名詞, noun or n; all three are accepted as the same key */
function posKey(s){
  var v=String(s||'').trim();
  if(POS.indexOf(v)>=0) return v;
  var k=null;
  Object.keys(LANG).forEach(function(L){
    Object.keys(LANG[L].pos).forEach(function(p){
      if(!k && LANG[L].pos[p]===v) k=p;
    });
  });
  return k||'n';
}
/* Quietly upgrade a dictionary saved in the older shape, where the label
   itself was stored. Opening the app once is enough; nobody sees anything. */
(function migratePos(){
  var moved=0;
  WORDS.forEach(function(w){
    if(POS.indexOf(w.pos)>=0) return;
    w.pos=posKey(w.pos); moved++;
  });
  if(moved) save();
})();
