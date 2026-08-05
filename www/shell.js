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
var NAV=[{r:'home'}];
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
  if(NAV.length>1) NAV.pop(); else NAV=[{r:'home'}];
  route=here().r; render(); window.scrollTo(0,0);
}
/* A tab is not somewhere you came through, it is where you are. Tapping one
   throws the trail away rather than stacking three tabs on top of it. */
/* Leaving the search tab for a chapter of the build tab: two moves, and the
   pair of them is one thing a row does. It was two statements inside markup. */
function goIn(r){ goTab('build'); go(r); }
function goTab(r){ NAV=[{r:r}]; route=r; render(); window.scrollTo(0,0); }
/* Kept because a hundred lines still read it. It is here()'s route. */
var route='home';

/* ---- every page ------------------------------------------------------
   Its numeral in the book, its name, and which tab it lives under. The back
   button says where it goes and the heading says where you are, side by
   side: 「←目次　Ⅰ 単語」 */
var PAGES={
  home:    {tab:'home'},
  build:   {tab:'build', k:'tab.build'},
  find:    {tab:'find',  k:'tab.find'},
  form:    {tab:'build'},
  sound:   {tab:'build', n:'I',   k:'toc.sound'},
  letters: {tab:'build', n:'II',  k:'toc.letters'},
  pickltr: {tab:'build', k:'lt.use'},
  picksnd: {tab:'build', k:'lt.addsnd'},
  abugida: {tab:'build', k:'ab.title'},
  relate:  {tab:'build'},
  spell:   {tab:'build', k:'word.sp'},
  aspell:  {tab:'build', k:'word.sp'},
  glyph:   {tab:'build', n:'II'},
  words:   {tab:'build', n:'III', k:'toc.words'},
  make:    {tab:'build', n:'III', k:'toc.make'},
  gram:    {tab:'build', n:'IV',  k:'toc.gram'},   /* the numeral is dropped on a single stage */

  notes:   {tab:'build', n:'V',   k:'toc.notes'},
  talk:    {tab:'build', n:'VI',  k:'toc.talk'},
  settings:{tab:'home',  k:'set.title'},
  set:     {tab:'home'},
  world:   {tab:'home', k:'wld.title'},
  langs:   {tab:'home', k:'langs.title'},
  plans:   {tab:'home',  k:'plans.title'}
};
function pageName(r, a){
  if(r==='home') return t('tab.home');
  /* A page opened on a particular thing is named after that thing. The
     letter you are drawing, the stage you are in -- not the chapter it
     belongs to, which the back button already says. */
  if(r==='glyph'){
    var g=(typeof ltById==='function')? ltById(a) : null;
    return (g? ltName(g) : '') || t('lt.untitled');
  }
  if(r==='pickltr') return t('lt.use');
  if(r==='set'){
    var si, sa=String(a||'');
    for(si=0;si<SETS.length;si++) if(SETS[si].id===sa) return t(SETS[si].k);
    return t('set.title');
  }
  if(r==='relate'){
    var rk=String(a||'').split(':')[0];
    return (rk==='syn'||rk==='ant')? t('word.'+rk+'.add') : t('toc.words');
  }
  if(r==='picksnd'){
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
function navTop(count){
  var h=here(), p=PAGES[h.r]||{}, pv=prevPage();
  var lab = pv? pageName(pv.r, pv.a) : t('tab.build');
  return '<div class="navtop"><button class="back nb"' + DO('back') + '>'+ICON_BACK+esc(lab)+'</button>'+
    ((p.n && !h.a)? '<span class="navn">'+p.n+'</span>' : '')+
    '<span class="navt">'+esc(pageName(h.r, h.a))+'</span>'+
    (count? '<span class="navc">'+count+'</span>' : '')+
    '</div>';
}
/* The three roots. A tab bar belongs on them and nowhere else: on an inner
   page the thing at the bottom of the screen is that page's own button. */
var TABS=[{r:'build', k:'tab.build'}, {r:'find', k:'tab.find'}, {r:'home', k:'tab.home'}];
function tabBar(){
  var cur=here().r, i, out='';
  for(i=0;i<TABS.length;i++)
    out+='<button class="tab'+(cur===TABS[i].r?' on':'')+'"' + DO('goTab', [TABS[i].r]) + '>'+
      TAB_ICON[TABS[i].r]+'<span class="tabl">'+esc(t(TABS[i].k))+'</span></button>';
  return '<div class="tabbar">'+out+'</div>';
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
