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
  fq=''; fpick=null;                   /* the find screen */
  abVow='';                            /* the abugida editor */
  ltSort='own'; ltFil='all'; ltQ='';   /* the alphabet's order, filter and search */
  ltWob=false;                         /* and whether its letters are wobbling */
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
  NOTES_HAVE=null;                     /* the notices, asked again */
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

   Signed out is the same KIND of state as an unfinished onboarding: the app
   is not a place you are standing in, it is one screen. So it is answered
   here, once, rather than by an `if(!netSignedIn())` on each screen -- which
   is what the app had, and what left the settings, the plans and the language
   screens open to somebody with no account. A list of screens to guard is a
   list that is one short the day a screen is added.

   'door' the door and nothing else -- signed out
   'ob'   the onboarding, which is the app until SET.done
   'app'  a route, a view, and the bar at the foot

   The tour is 'app' on purpose: it is the app with one thing lit, not a
   screen of the onboarding's own. */
function appIs(){
  if(typeof netSignedIn!=='function' || !netSignedIn()) return 'door';
  return (!SET.done && !obTourOn())? 'ob' : 'app';
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
function rootTop(r, right){
  return '<div class="navtop"><span class="navt">'+esc(pageName(r))+'</span>'+
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
  var cur=here().r, i, r, out='';
  for(i=0;i<TABS.length;i++){
    r=TABS[i];
    /* The mark and nothing else. 「下タブにホームとかつけるのやめない？」
       The name is still said -- as the button's aria-label, because a button
       whose whole content is an aria-hidden drawing has nothing to be called
       by otherwise, and pageName() stays the one place that names a tab. */
    out+='<button class="tab'+(cur===r?' on':'')+'"' + DO('goTab', [r]) +
      ' aria-label="'+esc(pageName(r))+'">'+TAB_ICON[r]+'</button>';
  }
  return '<div class="tabbar">'+out+'</div>';
}
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
  if(kb>vvKbMax) vvKbMax=kb;
  d.setProperty('--vvkb', Math.max(0,(vvTyping()? vvKbMax : kb) - off)+'px');
  d.setProperty('--tabgap', up? '10px' : 'calc(var(--tabh) + 10px)');
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

   From the RIGHT edge, dragged left. Which edge is the phone's own habit and
   not ours to argue with, and the one that was asked for is this one.

   Three things it must not do. It must not fire on a drawing: the glyph
   editor is a canvas that goes to the edge of the screen and a stroke ending
   there is a stroke, not a gesture. It must not fire while a key is being
   carried, which is a drag of its own. And it must not fire on something that
   scrolls sideways -- a row of tabs, a grid being reordered -- so the gesture
   has to be mostly horizontal AND start within a thumb's width of the edge.

   pointer* and not touch*: this app is one webview and pointer events are
   what it has. Passive, because it never prevents the default -- a gesture
   that cancels a scroll it has decided against is worse than no gesture. */
var swX=0, swY=0, swOn=false;
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
  if(e.clientX < window.innerWidth-30) return;
  swX=e.clientX; swY=e.clientY; swOn=true;
}
function swEnd(e){
  if(!swOn) return;
  swOn=false;
  var dx=e.clientX-swX, dy=e.clientY-swY;
  if(dx > -70) return;
  if(Math.abs(dy) > Math.abs(dx)*0.6) return;
  back();
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
  document.addEventListener('pointerup', swEnd, {passive:true});
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
  /* And the walk through the app has it, because the walk IS the app: the
     onboarding is not done, so this used to hide the bar on every screen the
     walk stands on -- and the first thing the walk points at is the tab that
     opens the making side. 「制作ボタン押してキーボードの画面開いてとかないよ？」
     Everything before the walk -- drawing, the alphabet, the name -- is a
     screen of the onboarding's own and still has no bar. */
  var sig = (appIs()==='app' && !one) ? (here().r+'|'+uiLang()) : '';
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
