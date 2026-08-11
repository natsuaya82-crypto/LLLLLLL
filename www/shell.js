/* Lingua — the shell every screen sits in (chapter 4)
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   4. The shell every screen sits in
   ========================================================================= */
var app=document.getElementById('app');

/* ---- what a screen forgets when you leave it -------------------------
   Fifteen things across eight files are remembered between renders: which
   words the list is filtered to, what was typed into a search, which face a
   sheet is showing, what the make screen has produced but not committed.
   None of that belongs to the language -- it is where you happen to be
   standing in it.

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
  mkPos='n'; cands=[];                 /* the make screen */
  abVow='';                            /* the abugida editor */
  addSeq=[]; addMode=''; wdMode='';    /* the two sheets */
  tq=''; tkPos=POS_ALL; tcomp=[];      /* talk */
  GE=null;                             /* the glyph editor */
  kbLay=0; kbSel=null; kbSlotFor=null; /* the keyboard being built */
  ltDraft=null;                        /* a letter's name, typed and unsaved */
  IMP=impBlank();                      /* a list being read in */
  PW=pwBlank();                        /* a post being written */
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
function back(){
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
/* A tab is not somewhere you came through, it is where you are. Tapping one
   throws the trail away rather than stacking three tabs on top of it. */
/* Leaving the search tab for a chapter of the build tab: two moves, and the
   pair of them is one thing a row does. It was two statements inside markup. */
function goIn(r){ goTab('build'); go(r); }
function goTab(r){ NAV=[{r:r}]; route=r; render(); window.scrollTo(0,0); }
/* Kept because a hundred lines still read it. It is here()'s route. */
var route='profile';

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
  spell:   {tab:'build', k:'word.sp'},
  aspell:  {tab:'build', k:'word.sp'},
  glyph:   {tab:'build'},
  words:   {tab:'build', k:'toc.words'},
  gram:    {tab:'build', k:'toc.gram'},   /* the numeral is dropped on a single stage */

  notes:   {tab:'build', k:'toc.notes'},
  talk:    {tab:'build', k:'toc.talk'},
  settings:{tab:'profile',  k:'set.title'},
  set:     {tab:'profile'},
  world:   {tab:'profile', k:'wld.title'},
  langs:   {tab:'profile', k:'langs.title'},
  plans:   {tab:'profile',  k:'plans.title'}
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
function navTop(count, right){
  var h=here(), pv=prevPage(), n=h.a? '' : tocNum(h.r);
  var lab = pv? pageName(pv.r, pv.a) : t('tab.build');
  return '<div class="navtop"><button class="back nb"' + DO('back') + '>'+ICON_BACK+esc(lab)+'</button>'+
    (n? '<span class="navn">'+n+'</span>' : '')+
    '<span class="navt">'+esc(pageName(h.r, h.a))+'</span>'+
    (count? '<span class="navc">'+count+'</span>' : '')+
    (right||'')+
    '</div>';
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
function lnField(id, ph, attrs, val){
  return '<textarea id="'+id+'" class="lnin'+(myFontOn()? ' sfont':'')+'" '+
    'rows="1" placeholder="'+esc(ph)+'" autocomplete="off" autocorrect="off" '+
    'spellcheck="false"'+(attrs||'')+'>'+esc(val||'')+'</textarea>';
}
/* Made as tall as its text, every time that text changes. A textarea has no
   CSS for "as tall as you need"; the height has to be measured and set, and
   it has to be reset to nothing first or it can only ever grow. */
function lnGrow(id){
  var e=document.getElementById(id);
  if(!e) return;
  e.style.height='auto';
  e.style.height=e.scrollHeight+'px';
}
/* Every one on the page, after it has been drawn. Asked of the document
   rather than given a list of screens, so a field added tomorrow is sized
   tomorrow -- the same argument geTiles() and postFaces() are already
   making one line above the call. */
function lnGrowAll(){
  var xs=document.getElementsByClassName('lnin'), i;
  for(i=0;i<xs.length;i++){
    xs[i].style.height='auto';
    xs[i].style.height=xs[i].scrollHeight+'px';
  }
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
    out+='<button class="tab'+(cur===r?' on':'')+'"' + DO('goTab', [r]) + '>'+
      TAB_ICON[r]+'<span class="tabl">'+esc(pageName(r))+'</span></button>';
  }
  return '<div class="tabbar">'+out+'</div>';
}
/* And the bar is put on the page here, once, into an element beside #app that
   render() never rewrites. Writing it into each screen's HTML meant it was
   thrown away and built again -- blur and all -- on every navigation, which
   on a phone is the bar blinking out. Nothing is rebuilt unless the answer
   changes: which tab is lit, and which language it is saying it in. */
function tabPaint(){
  var host=document.getElementById('tabs');
  if(!host) return;
  var sig = SET.done ? (here().r+'|'+uiLang()) : '';
  if(host.getAttribute('data-sig')===sig) return;
  host.setAttribute('data-sig', sig);
  host.innerHTML = sig ? tabBar() : '';
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
var POS=['n','v','adj','adv','pro','num','part','conj','intj','aff','nm','x'];
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
