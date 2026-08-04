/* Lingua — the shell, onboarding, the cover, the dictionary, sounds, rules
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   4. The shell every screen sits in
   ========================================================================= */
var app=document.getElementById('app');

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
  glyph:   {tab:'build', n:'II'},
  words:   {tab:'build', n:'III', k:'toc.words'},
  make:    {tab:'build', n:'III', k:'toc.make'},
  gram:    {tab:'build', n:'IV',  k:'toc.gram'},   /* the numeral is dropped on a single stage */
  sent:    {tab:'build', n:'V',   k:'toc.sent'},
  notes:   {tab:'build', n:'VI',  k:'toc.notes'},
  talk:    {tab:'build', n:'VII', k:'toc.talk'},
  settings:{tab:'home',  k:'set.title'},
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
  return '<div class="navtop"><button class="back nb" onclick="back()">'+ICON_BACK+esc(lab)+'</button>'+
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
    out+='<button class="tab'+(cur===TABS[i].r?' on':'')+'" onclick="goTab(\''+TABS[i].r+'\')">'+
      TAB_ICON[TABS[i].r]+'<span class="tabl">'+esc(t(TABS[i].k))+'</span></button>';
  return '<div class="tabbar">'+out+'</div>';
}
function atRoot(){ var r=here().r; return r==='home'||r==='build'||r==='find'; }
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
/* =========================================================================
   5. Onboarding (the only screen that exists before anything else)
      Its job is to prove, physically, that you can write a language without
      knowing anything first. AI is never mentioned here, not once.
   ========================================================================= */


/* Brand marks for the sign-in buttons. Google keeps its four brand colors;
   the Apple mark is monochrome and follows the button's text color. */
var MARK_GOOGLE='<svg class="mk" viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">'+
  '<path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>'+
  '<path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18z"/>'+
  '<path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34z"/>'+
  '<path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"/></svg>';
var MARK_APPLE='<svg class="mk" viewBox="0 0 16 20" width="17" height="17" fill="currentColor" aria-hidden="true">'+
  '<path d="M13.29 10.6c.02-2.02 1.65-2.99 1.72-3.04-.94-1.37-2.4-1.56-2.92-1.58-1.24-.13-2.42.73-3.05.73-.63 0-1.6-.71-2.63-.69-1.35.02-2.6.79-3.29 2-1.4 2.43-.36 6.03 1 8 .67.96 1.46 2.04 2.5 2 1-.04 1.38-.65 2.59-.65 1.21 0 1.55.65 2.61.63 1.08-.02 1.76-.98 2.42-1.95.76-1.11 1.07-2.19 1.09-2.25-.02-.01-2.09-.8-2.11-3.18z"/>'+
  '<path d="M11.35 4.63c.55-.67.92-1.6.82-2.53-.79.03-1.75.53-2.32 1.2-.51.58-.96 1.53-.84 2.43.88.07 1.79-.45 2.34-1.1z"/></svg>';

/* The scripts a character can be taken from. The inventories are written as
   escapes because they are code points, not copy: nothing here is translated,
   and spelled out they would read as untranslated text. Names live in 3.6. */
var WORLD_SCRIPTS = [
  {id:"runic",pv:"\u16a0\u16a2\u16a6\u16a8\u16b1",ch:"\u16a0 \u16a2 \u16a6 \u16a8 \u16b1 \u16b2 \u16b7 \u16b9 \u16ba \u16be \u16c1 \u16c3 \u16c7 \u16c8 \u16c9 \u16ca \u16cf \u16d2 \u16d6 \u16d7 \u16da \u16dc \u16de \u16df"},
  {id:"ogham",pv:"\u1681\u1682\u1683",ch:"\u1681 \u1682 \u1683 \u1684 \u1685 \u1686 \u1687 \u1688 \u1689 \u168a \u168b \u168c \u168d \u168e \u168f \u1690 \u1691 \u1692 \u1693 \u1694 \u1695 \u1696 \u1697 \u1698 \u1699 \u169a"},
  {id:"phoenician",pv:"\ud802\udd00\ud802\udd01\ud802\udd02",ch:"\ud802\udd00 \ud802\udd01 \ud802\udd02 \ud802\udd03 \ud802\udd04 \ud802\udd05 \ud802\udd06 \ud802\udd07 \ud802\udd08 \ud802\udd09 \ud802\udd0a \ud802\udd0b \ud802\udd0c \ud802\udd0d \ud802\udd0e \ud802\udd0f \ud802\udd10 \ud802\udd11 \ud802\udd12 \ud802\udd13 \ud802\udd14 \ud802\udd15"},
  {id:"glagolitic",pv:"\u2c00\u2c01\u2c02",ch:"\u2c00 \u2c01 \u2c02 \u2c03 \u2c04 \u2c05 \u2c06 \u2c07 \u2c08 \u2c09 \u2c0a \u2c0b \u2c0c \u2c0d \u2c0e \u2c0f \u2c10 \u2c11 \u2c12 \u2c13 \u2c14 \u2c15 \u2c16 \u2c17 \u2c18 \u2c19 \u2c1a \u2c1b \u2c1c \u2c1d \u2c1e \u2c1f \u2c20 \u2c21 \u2c22 \u2c23 \u2c24 \u2c25 \u2c26"},
  {id:"greek",pv:"\u0391\u0392\u0393\u0394\u0395",ch:"\u0391 \u0392 \u0393 \u0394 \u0395 \u0396 \u0397 \u0398 \u0399 \u039a \u039b \u039c \u039d \u039e \u039f \u03a0 \u03a1 \u03a3 \u03a4 \u03a5 \u03a6 \u03a7 \u03a8 \u03a9 \u03b1 \u03b2 \u03b3 \u03b4 \u03b5 \u03b6 \u03b7 \u03b8 \u03b9 \u03ba \u03bb \u03bc \u03bd \u03be \u03bf \u03c0 \u03c1 \u03c3 \u03c4 \u03c5 \u03c6 \u03c7 \u03c8 \u03c9"},
  {id:"cyrillic",pv:"\u0410\u0411\u0412\u0413\u0414",ch:"\u0410 \u0411 \u0412 \u0413 \u0414 \u0415 \u0416 \u0417 \u0418 \u041a \u041b \u041c \u041d \u041e \u041f \u0420 \u0421 \u0422 \u0423 \u0424 \u0425 \u0426 \u0427 \u0428 \u0429 \u042a \u042b \u042c \u042d \u042e \u042f \u0430 \u0431 \u0432 \u0433 \u0434 \u0435 \u0436 \u0437 \u0438 \u043a \u043b \u043c \u043d \u043e \u043f \u0440 \u0441 \u0442 \u0443 \u0444 \u0445 \u0446 \u0447 \u0448 \u0449"},
  {id:"hebrew",pv:"\u05d0\u05d1\u05d2\u05d3",ch:"\u05d0 \u05d1 \u05d2 \u05d3 \u05d4 \u05d5 \u05d6 \u05d7 \u05d8 \u05d9 \u05db \u05dc \u05de \u05e0 \u05e1 \u05e2 \u05e4 \u05e6 \u05e7 \u05e8 \u05e9 \u05ea"},
  {id:"georgian",pv:"\u10d0\u10d1\u10d2",ch:"\u10d0 \u10d1 \u10d2 \u10d3 \u10d4 \u10d5 \u10d6 \u10d7 \u10d8 \u10d9 \u10da \u10db \u10dc \u10dd \u10de \u10df \u10e0 \u10e1 \u10e2 \u10e3 \u10e4 \u10e5 \u10e6 \u10e7 \u10e8 \u10e9 \u10ea \u10eb \u10ec \u10ed \u10ee \u10ef \u10f0"},
  {id:"armenian",pv:"\u0531\u0532\u0533",ch:"\u0531 \u0532 \u0533 \u0534 \u0535 \u0536 \u0537 \u0538 \u0539 \u053a \u053b \u053c \u053d \u053e \u053f \u0540 \u0541 \u0542 \u0543 \u0544 \u0545 \u0546 \u0547 \u0548 \u0549 \u054a \u054b \u054c \u054d \u054e \u054f \u0550 \u0551 \u0552 \u0553 \u0554 \u0555 \u0556"},
  {id:"devanagari",pv:"\u0905\u0906\u0907",ch:"\u0905 \u0906 \u0907 \u0908 \u0909 \u090a \u090f \u0910 \u0913 \u0914 \u0915 \u0916 \u0917 \u0918 \u091a \u091b \u091c \u091d \u091f \u0920 \u0921 \u0922 \u0924 \u0925 \u0926 \u0927 \u0928 \u092a \u092b \u092c \u092d \u092e \u092f \u0930 \u0932 \u0935 \u0936 \u0937 \u0938 \u0939"},
  {id:"tibetan",pv:"\u0f40\u0f41\u0f42",ch:"\u0f40 \u0f41 \u0f42 \u0f44 \u0f45 \u0f46 \u0f47 \u0f49 \u0f4f \u0f50 \u0f51 \u0f53 \u0f54 \u0f55 \u0f56 \u0f58 \u0f59 \u0f5a \u0f5b \u0f5d \u0f5e \u0f5f \u0f60 \u0f61 \u0f62 \u0f63 \u0f64 \u0f66 \u0f67 \u0f68"},
  {id:"geez",pv:"\u1200\u1208\u1210",ch:"\u1200 \u1201 \u1202 \u1203 \u1204 \u1205 \u1206 \u1208 \u1209 \u120a \u120b \u120c \u120d \u120e \u1210 \u1211 \u1212 \u1213 \u1214 \u1215 \u1216 \u1218 \u1219 \u121a \u121b \u121c \u121d \u121e \u1220 \u1221 \u1222 \u1223 \u1224 \u1225 \u1226 \u1228 \u1229 \u122a \u122b \u122c \u122d \u122e \u1230 \u1231 \u1232 \u1233 \u1234 \u1235 \u1236"},
  {id:"arabic",pv:"\u0627\u0628\u062a\u062b",ch:"\u0627 \u0628 \u062a \u062b \u062c \u062d \u062e \u062f \u0630 \u0631 \u0632 \u0633 \u0634 \u0635 \u0636 \u0637 \u0638 \u0639 \u063a \u0641 \u0642 \u0643 \u0644 \u0645 \u0646 \u0647 \u0648 \u064a"},
  {id:"thai",pv:"\u0e01\u0e02\u0e04",ch:"\u0e01 \u0e02 \u0e03 \u0e04 \u0e05 \u0e06 \u0e07 \u0e08 \u0e09 \u0e0a \u0e0b \u0e0c \u0e0d \u0e0e \u0e0f \u0e10 \u0e11 \u0e12 \u0e13 \u0e14 \u0e15 \u0e16 \u0e17 \u0e18 \u0e19 \u0e1a \u0e1b \u0e1c \u0e1d \u0e1e \u0e1f \u0e20 \u0e21 \u0e22 \u0e23 \u0e25 \u0e27 \u0e28 \u0e29 \u0e2a \u0e2b \u0e2c \u0e2d \u0e2e"},
  {id:"hangul",pv:"\u3131\u3134\u3137",ch:"\u3131 \u3134 \u3137 \u3139 \u3141 \u3142 \u3145 \u3147 \u3148 \u314a \u314b \u314c \u314d \u314e \u314f \u3151 \u3153 \u3155 \u3157 \u315b \u315c \u3160 \u3161 \u3163"}
];

/* ---- Onboarding -------------------------------------------------------
   Five steps, in the order a language is actually built.

   It used to open on a language picker, which is a question the app needs
   answered rather than one anybody came to answer. Then it opened on a
   drawing square: draw a shape, and immediately -- which single sound is
   this? That is only a question an alphabet has an answer to. It quietly
   decided, on the person's behalf, that they were making one, and it asked
   them to name a sound before they had chosen any sounds at all.

   And then it put them on a screen that said: coin your first word. With no
   sounds, no letters and no name, out of nothing.

   The order here is the order the work goes in. Name it, because that is the
   one thing anybody arrives already having an opinion about. Say what kind of
   writing it uses, because that decides what a letter even is. Choose the
   sounds it is made of. Draw one letter, to see that it can be done. No word
   is asked for: a word is made of sounds and written in letters, and by the
   end of this there are both, so the dictionary is somewhere to go rather
   than somewhere to be sent. */
var ob={step:0, name:'', mode:'draw', pick:'', strokes:null, ch:'', snd:''};
var OB_STEPS=5;
var OB_CHEV='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
/* The door: a frame, a panel set inside it, a handle. Stroked in currentColor
   so it is gold in both themes and needs no fill to be legible on either.
   Nothing stands in the doorway -- it has not been opened yet, and a letter
   there would be one nobody has drawn. */
var OB_DOOR='<svg viewBox="0 0 124 188" fill="none" stroke="currentColor" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M6 186V62a56 56 0 0 1 112 0v124" stroke-width="1.6" opacity=".85"/>'+
  '<path d="M6 186V62a56 56 0 0 1 112 0v124Z" stroke="none" fill="currentColor" opacity=".055"/>'+
  '<path d="M17 186V64a45 45 0 0 1 90 0v122" stroke-width="1" opacity=".38"/>'+
  '<circle cx="98" cy="120" r="3.1" stroke="none" fill="currentColor" opacity=".8"/>'+
  '<path d="M2 186h120" stroke-width="1.2" opacity=".5"/></svg>';
var OB_CHEVR='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

function obGo(n){ ob.step=n; GE=null; render(); window.scrollTo(0,0); }
function obCanBack(){ return ob.step>0 || ob.mode==='borrow'; }
function obBack(){
  if(ob.step===4 && ob.mode==='borrow'){
    if(ob.pick){ ob.pick=''; render(); return; }      /* out of one script, back to the fifteen */
    ob.mode='draw'; render(); window.scrollTo(0,0); return;
  }
  if(ob.step>0) obGo(ob.step-1);
}
function obLang(v){ SET.ui=v; save(); render(); }

/* ---- step 0, the door ------------------------------------------------- */
/* Signing in comes first, and the door is what it looks like. Everything in
   this app is metered or carried somewhere: a hundred words, three questions
   a day, a plan that has to hold on the web too. None of that can be counted
   without knowing whose it is, and an account made after the fact brings a
   question nobody should be asked on their first day -- you drew a letter
   here, and the account you just signed into already has a language: which
   one survives. Asking first means that question never exists.
   The provider handshakes are wired in at packaging. Until then these open
   the door, so the app can be walked end to end. */
function obSignIn(){ if(SET.done){ toast(t('set.account.soon')); return; } SET.anon=false; save(); obGo(1); }
/* A way past the door without an account. It is here for the plainest reason:
   once signing in really signs in, there is no way to see the app as somebody
   opening it for the first time without throwing away whatever is in the
   account -- and the first run is the part that gets rebuilt most. It is also
   honest about what it costs, which is why the line underneath changes. */
function obSkip(){ SET.anon=true; save(); obGo(1); }

function obDoorHTML(){
  return '<div class="mid"><div class="obdoor">'+OB_DOOR+'</div>'+
    '<div class="obrule"></div>'+
    '<h1 class="obh1">Lingua</h1>'+
    '<p class="obtag">'+t('ob.tagline')+'</p></div>'+
    '<div class="obfoot">'+
    '<button class="btn signin google" onclick="obSignIn()">'+MARK_GOOGLE+'<span>'+t('ob.signin.google')+'</span></button>'+
    '<button class="btn signin apple" onclick="obSignIn()">'+MARK_APPLE+'<span>'+t('ob.signin.apple')+'</span></button>'+
    '<button class="obskip" onclick="obSkip()">'+t('ob.signin.skip')+'</button>'+
    '<div class="mini obnote">'+t('ob.signin.local')+'</div></div>';
}

/* ---- step 1, its name -------------------------------------------------
   The one thing somebody arrives already having an opinion about, and the
   only question here they can answer without being taught anything. It can
   be left blank and changed at any time from the cover. */
function obName(){
  var e=document.getElementById('ob-name');
  if(e) ob.name=String(e.value||'').trim();
  langName=ob.name;
  save(); obGo(2);
}
function obNameHTML(){
  return '<div class="mid">'+
    '<h2>'+t('ob.name.h')+'</h2>'+
    '<p class="obsub">'+t('ob.name.sub')+'</p>'+
    '<div class="obnamebox"><input id="ob-name" value="'+esc(ob.name||langName||'')+'" '+
      'placeholder="'+esc(t('ob.name.ph'))+'" autocomplete="off" '+
      'onkeydown="if(event.key===\'Enter\'){event.preventDefault();obName();}"></div>'+
    '</div>'+
    '<div class="obfoot"><button class="btn" onclick="obName()">'+t('ob.next')+'</button>'+
    '<button class="obskip" onclick="obNameLater()">'+t('ob.name.later')+'</button>'+
    '<div class="mini obnote">'+t('ob.name.note')+'</div></div>';
}
/* Not everyone has a name yet, and being stuck on the first question of the
   app because of it is absurd. The cover asks again, and the pencil beside
   the title is there whenever the answer arrives. */
function obNameLater(){ ob.name=''; obGo(2); }

/* ---- step 2, what a letter is a letter of -----------------------------
   Asked before any letter is drawn, because it decides what drawing one
   means. Each row says what it is and names a writing that works that way,
   so the choice is made by recognising something rather than by parsing a
   definition. */
function obWsys(k){ SET.wsys=k; save(); render(); }
function obWsysHTML(){
  return '<div class="mid obleft">'+
    '<h2 class="obh">'+t('ob.ws.h')+'</h2>'+
    '<p class="obsub">'+t('ob.ws.sub')+'</p>'+
    '<div class="obscripts one">'+WSYS.map(function(k){
      return '<button class="obsrow'+(wsys()===k?' on':'')+'" onclick="obWsys(\''+k+'\')">'+
        '<span class="obnm">'+esc(t('ws.k.'+k))+'</span>'+
        '<span class="obws">'+esc(t('ws.k.'+k+'.eg'))+'</span>'+
        '</button>';
    }).join('')+'</div></div>'+
    '<div class="obfoot"><button class="btn" onclick="obGo(3)">'+t('ob.next')+'</button>'+
    '<div class="mini obnote">'+t('ob.ws.note')+'</div></div>';
}

/* ---- step 3, the sounds -----------------------------------------------
   It used to be fourteen buttons and no help: pick the sounds your language
   is made of, from a list somebody chose for you, with no way to hear any of
   them. Nobody who has not made a language before can answer that.

   So the app proposes. You say what the language should sound like -- soft,
   hard, flowing, breathy, plain -- and it draws an inventory out of that
   region of the chart, says the whole thing out loud, and waits. Take it, ask
   for another, or open the chart and do it yourself. */
var obPick2='';
function obChar(id){
  obPick2=id;
  SET.snd=asSounds(id, 12);
  save();
  asSay(SET.snd);
  render();
}
function obAgain(){ if(obPick2) obChar(obPick2); }
function obHearSnd(p){ sayOne(p); }
function obDropSnd(p){
  var a=addedSnd(), i=a.indexOf(p);
  if(i>=0){ a.splice(i,1); save(); render(); }
}
/* The proposal, shown in two rows. A flat list of twelve symbols is a wall:
   there is no way to see that the language has five vowels and seven
   consonants, which is the single most useful thing about an inventory and
   the thing that decides what a syllable can look like. Consonants first,
   vowels under them, each row labelled -- the same two words the chart uses,
   so nothing new has to be learned to read it.

   Each row ends with the way to lengthen it: one more consonant, one more
   vowel, drawn from the same character of sound and said as it arrives. And
   each sound carries the way to take it back out, because a proposal you can
   only accept whole is not a proposal. */
function obSndRow(lab, list, kind){
  return '<div class="obhr"><span class="obhk">'+esc(lab)+'</span>'+
    '<div class="obhs">'+list.map(function(p){
      return '<span class="obhp"><button class="obhb" onclick="obHearSnd(\''+esc(p)+'\')">'+esc(p)+'</button>'+
        '<button class="obhx" onclick="obDropSnd(\''+esc(p)+'\')" aria-label="'+esc(t('as.drop'))+'">'+ICON_CROSS+'</button></span>';
    }).join('')+
    '<button class="obhadd" onclick="obMore(\''+kind+'\')">'+ICON_ADD+esc(t('as.more.'+kind))+'</button>'+
    '</div></div>';
}
/* One more sound of the kind asked for. It is said on arrival -- an inventory
   is a set of sounds, so a sound that joins it silently has not really been
   heard about. */
function obMore(kind){
  var have=addedSnd(), s=asMore(obPick2||AS_CHARS[0].id, kind, have);
  if(!s){ toast(t('as.more.none')); return; }
  SET.snd=asOrder(have.concat([s]));
  save(); sayOne(s); render();
}
function obSndsHTML(){
  var have=addedSnd(), cs=[], vs=[], i;
  for(i=0;i<have.length;i++){
    if(ipaIsVowel(have[i])) vs.push(have[i]); else cs.push(have[i]);
  }
  return '<div class="mid obleft">'+
    '<h2 class="obh">'+t('ob.snds.h')+'</h2>'+
    '<p class="obsub">'+t('ob.snds.sub')+'</p>'+
    '<div class="obscripts one">'+AS_CHARS.map(function(c){
      return '<button class="obsrow'+(obPick2===c.id?' on':'')+'" onclick="obChar(\''+c.id+'\')">'+
        '<span class="obnm">'+esc(t('as.'+c.id))+'</span>'+
        '<span class="obws">'+esc(t('as.'+c.id+'.d'))+'</span></button>';
    }).join('')+'</div>'+
    /* the panel stays once a character has been chosen, even if every sound
       in it has been taken back out -- otherwise dropping the last one takes
       away the buttons that would put another back */
    ((have.length || obPick2)
      ? '<div class="obheard"><div class="obhl">'+tn('ob.snds.n', have.length)+'</div>'+
        obSndRow(t('ipa.cons'), cs, 'c')+obSndRow(t('ipa.vows'), vs, 'v')+
        '<div class="wctl2"><button onclick="asSay(addedSnd())">'+ICON_PLAY+t('as.hear')+'</button>'+
        (obPick2? '<button onclick="obAgain()">'+t('as.again')+'</button>':'')+'</div></div>'
      : '')+
    '</div>'+
    '<div class="obfoot"><button class="btn" onclick="obToDraw()"'+(have.length?'':' disabled')+'>'+t('ob.next')+'</button>'+
    '<button class="obskip" onclick="obOwnSnd()">'+t('as.own')+'</button>'+
    '<div class="mini obnote">'+t('ob.snds.note')+'</div></div>';
}
/* The whole chart, for somebody who would rather choose it themselves. It is
   the sounds chapter, which is built for exactly this, so onboarding ends
   here and the chapter opens. */
function obOwnSnd(){
  if(!langName) langName=ob.name||t('lang.default');
  SET.done=true; save();
  route='sound'; RENDERED=null; render(); window.scrollTo(0,0);
}
function obToDraw(){
  if(!addedSnd().length){ toast(t('ob.snds.need')); return; }
  ob.snd=wsUnits()[0]||addedSnd()[0];
  obGo(4);
}

/* ---- step 4, one letter -----------------------------------------------
   The editor is the real one from the letter screen -- same canvas id, same
   tools, same lattice -- so whatever is learned here is not relearned later.
   Which letter is being drawn is known before it is drawn now, because the
   kind of writing and the sounds were both decided on the way here. */
function obDone(){
  var keep=(GE && GE.st)? GE.st.filter(function(x){ return x.pts.length>0; }) : [];
  if(!keep.length){ toast(t('ob.draw.empty')); return; }
  ltSetStrokes(ltForUnit(ob.snd).id, JSON.parse(JSON.stringify(keep)));
  SET.myfont=true;
  save(); installScriptFont(); GE=null;
  sayOne(ob.snd);
  obFinish();
}
function obBorrow(id){ ob.mode='borrow'; ob.pick=id||''; GE=null; render(); window.scrollTo(0,0); }
function obPickScript(id){ ob.pick=id; render(); window.scrollTo(0,0); }
function obTakeCh(ch){
  ltSetChar(ltForUnit(ob.snd).id, ch);
  SET.showScript=true;
  save(); installScriptFont(); sayOne(ob.snd); obFinish();
}
function obSkipDraw(){ obFinish(); }

function obFinish(){
  if(!langName) langName=ob.name||t('lang.default');
  SET.done=true; save();
  route='home'; RENDERED=null; render(); window.scrollTo(0,0);
}

function obDrawHTML(){
  if(!GE) GE=newGE(ob.snd);
  var st=GE.st[GE.si], pts=0;
  GE.st.forEach(function(x){ pts+=x.pts.length; });
  return '<div class="mid">'+
    '<h2>'+t('ob.draw.h2', esc(ob.snd))+'</h2>'+
    '<p class="obsub">'+t('ob.draw.sub')+'</p>'+
    '<div class="gcanvwrap obpad"><canvas id="gcanv" class="gcanv"></canvas></div>'+
    geRail(st, pts)+
    '<div class="obesc"><button class="obescb" onclick="obBorrow(\'\')">'+
      '<span>'+t('ob.or')+'</span>'+OB_CHEVR+
    '</button></div></div>'+
    '<div class="obfoot"><button class="btn" onclick="obDone()">'+t('ob.draw.done')+'</button>'+
    '<button class="obskip" onclick="obSkipDraw()">'+t('ob.draw.later')+'</button></div>';
}

/* A sample is worth showing only if this phone can actually draw it. Some of
   these -- Ogham, Phoenician, Glagolitic -- are missing from a lot of
   systems, and a row of empty boxes says less than no row at all. The test is
   the width of the character against the width of one that certainly is not
   in any font: identical means both came out as the same missing-glyph box.
   Measured once per script and remembered, because it cannot change while
   the app is open. */
var OB_PV={};
function obPv(w){
  if(OB_PV[w.id]!==undefined) return OB_PV[w.id];
  var out='';
  try{
    var c=document.createElement('canvas'), x=c.getContext('2d');
    x.font='24px -apple-system, system-ui, sans-serif';
    var miss=x.measureText('￿￿').width/2, chars=w.ch.split(' '), got=[];
    for(var i=0;i<chars.length && got.length<3;i++){
      var ch=chars[i], wd=x.measureText(ch).width;
      if(wd>0 && Math.abs(wd-miss)>0.5) got.push(ch);
    }
    if(got.length===3) out=got.join(' ');
  }catch(e){ out=w.pv.slice(0,3); }
  OB_PV[w.id]=out;
  return out;
}

function obBorrowHTML(){
  var w=null; WORLD_SCRIPTS.forEach(function(x){ if(x.id===ob.pick) w=x; });
  if(w) return '<div class="mid obleft">'+
    '<h2 class="obh">'+esc(t('ws.'+w.id))+'</h2>'+
    '<p class="obsub">'+t('ob.borrow.take')+'</p>'+
    '<div class="obchars">'+w.ch.split(' ').map(function(ch){
      return '<button class="obchb" onclick="obTakeCh(\''+esc(ch)+'\')">'+esc(ch)+'</button>';
    }).join('')+'</div></div>';
  /* Two columns, because fifteen rows do not fit on a phone and a first
     screen that scrolls is a first screen that has already lost. Each row
     shows a few of its own characters under the name: "Phoenician" tells you
     nothing you can picture, and three of its letters tell you everything. */
  return '<div class="mid obleft">'+
    '<h2 class="obh">'+t('ob.borrow.h')+'</h2>'+
    '<p class="obsub">'+t('ob.borrow.sub')+'</p>'+
    '<div class="obscripts">'+WORLD_SCRIPTS.map(function(x){
      var pv=obPv(x);
      return '<button class="obsrow" onclick="obPickScript(\''+x.id+'\')">'+
        '<span class="obnm">'+esc(t('ws.'+x.id))+'</span>'+
        (pv? '<span class="obpv">'+esc(pv)+'</span>' : '')+
        '</button>';
    }).join('')+'</div></div>';
}

function vOb(){
  var s=ob.step;
  var head='<div class="obhead">'+
    (obCanBack()? '<button class="obback" onclick="obBack()" aria-label="'+esc(t('ob.back'))+'">'+OB_CHEV+'</button>'
                : '<span class="obback ph"></span>')+
    '<div class="obtop">'+[0,1,2,3,4].map(function(i){
      return '<div class="dot'+(i<=s?' on':'')+'"></div>'; }).join('')+'</div>'+
    '<select class="oblang" aria-label="'+esc(t('ob.lang.a'))+'" onchange="obLang(this.value)">'+
      UI_LANGS.map(function(c){
        return '<option value="'+c+'"'+(uiLang()===c?' selected':'')+'>'+esc(LANG[c].label)+'</option>';
      }).join('')+
    '</select></div>';
  var h = (s===0)? obDoorHTML()
        : (s===1)? obNameHTML()
        : (s===2)? obWsysHTML()
        : (s===3)? obSndsHTML()
        : (s===4 && ob.mode==='borrow')? obBorrowHTML()
        : obDrawHTML();
  return '<div class="ob view'+(s===0?' center':'')+'">'+head+h+'</div>';
}

/* =========================================================================
   6. Home = the cover and the table of contents
      The chapter names stay in Cinzel English everywhere, the way a book
      keeps its own typography; only the contents rows follow the locale.
   ========================================================================= */
/* The one thing worth doing next, given where this language currently stands.
   Without it the contents page is a list of rooms with no reason to enter any. */

/* Free accounts hit a ceiling; saying so before they reach it reads as
   information rather than as an interruption. */
function capBanner(){
  if(has('plus')) return '';
  var left=FREE_LIMIT-WORDS.length;
  if(left>20 || left<0) return '';
  return '<button class="capwarn" onclick="go(\'plans\')">'+t('cap.warn', left)+
    '<span class="capgo">'+t('up.cta')+ICON_GO+'</span></button>';
}

/* One letter is a beginning; a handful is a writing system you can read a
   word in. Below that line the app talks about letters, above it about words. */
var SC_ENOUGH=5;
function scriptLetterCount(){ return wsHave(); }
function scriptStarted(){ return scriptLetterCount()>0; }
function scriptEnough(){ return scriptLetterCount()>=SC_ENOUGH; }

function nextStep(){
  var n=WORDS.length, act, label;
  /* Whatever is half-built. Somebody who has just come through the door has a
     name, a kind of writing, a handful of sounds and one letter -- so the rest
     of the alphabet is what is nearest to hand, not a word written out of
     nothing. Once there is enough to write with, words; then sentences. */
  if(n===0 && !scriptEnough()){ act="go('sound')"; label=t('next.sc0'); }
  else if(n===0){ act="openAdd()"; label=t('next.w0'); }
  else if(n<5){ act="openAdd()"; label=t('next.w1', 5-n); }
  else if(LINES.length===0){ act="go('sent')"; label=t('next.s0'); }
  else { act="go('make')"; label=t('next.mk'); }
  return '<button class="nextcard" onclick="'+act+'">'+
    '<span class="nk">'+t('next.t')+'</span>'+
    '<span class="nl">'+esc(label)+'</span>'+
    '<span class="na">'+ICON_GO+'</span></button>';
}

/* =========================================================================
   Writing system. The map is sound -> {ch}; an entry can later carry {svg}
   from the drawing tool without any reader here needing to change.
   ========================================================================= */
/* Sound -> character. The sound is the key because a sound is what a word is
   made of; the character is the clothing you choose for it. An entry is a
   plain string today and can become {ch, svg} when glyphs can be drawn. */
function scriptMap(){ if(!SET.script) SET.script={}; return SET.script; }
/* Which borrowed character writes this unit. It used to be a lookup in a map
   of unit -> character; it is now a question about the letter that writes the
   unit, because a character is one of the two shapes a letter can have. */
function chOf(p){ return ltChar(p); }
/* A sound belongs to the language either because a word already uses it or
   because you said so; before this, only the first way existed. */
function addedSnd(){ if(!SET.snd) SET.snd=[]; return SET.snd; }
function takeSnd(p){
  var a=addedSnd();
  if(a.indexOf(p)<0) a.push(p);
  save(); closeSheet({target:{id:'sbg'}}); render();
}
/* Dropping a sound unhooks the letters that read it. It does not delete them:
   a letter is a thing you drew and it survives a sound being reconsidered --
   which is the whole point of them being separate. */
function dropSnd(p){
  var a=addedSnd(), i=a.indexOf(p);
  if(i>=0){ a.splice(i,1); save(); }
  ltFor(p).forEach(function(l){ ltUnlink(l.id, p); });
  render();
}
function invAll(){ return wsUnits(); }
function scriptHave(){ return invAll().filter(function(p){ return !!ltChar(p); }).length; }
/* A word written in the characters borrowed for it. What a character is
   borrowed FOR depends on the kind of writing: a sound, a syllable, a whole
   word. wsys.js cuts it; this looks each piece up. */
function inScript(hw){ return wsInScript(hw); }
function scriptOn(){ return !!SET.showScript && scriptHave()>0; }
/* Named wOut, not hw: openWord(hw) already binds hw as its parameter, and a
   global of the same name is invisible from inside it. */
/* Borrowed characters replace the text; drawn letters only re-set it. So when
   your own letters are showing, the word stays the word — the font draws it. */
function wOut(word){ return (scriptOn() && !myFontOn()) ? inScript(word) : String(word||''); }

/* Which sound the picker is currently open for. */
/* Both pickers use the sheet the app already has: it is sized to the phone
   column, scrolls on its own, and leaves the page underneath untouched. */
/* Nothing is expanded to begin with — the characters of a script appear only
   when you ask for that script, and tapping it again folds them away. */
var pkScript = '';
/* ---- a form is a page --------------------------------------------------
   Everything you fill in used to slide up from the bottom over the screen you
   were on: a word, a note, a stage's word, the piece of sound a grammar
   decision is carried by, a note's whole body. A sheet is the wrong shape for
   all of them. It is half a screen, the keyboard eats the other half, it has
   no back button, and you were being asked to write a paragraph in it.

   「単語画面開いて下からスライドして出てくるのやめて欲しい。別ページ遷移で戻るボタンで
   戻る感じにして」「メモのページも下から出てくるのやめてくんない？そんなんじゃ書きづらい
   んだけど？」「基本ページ遷移型にしてくれ」

   Each is a page now. What made this cheap is that every opener already built
   its whole body as one string; only where that string is put has changed,
   and the paint functions that redraw a piece of it by id still work because
   the ids are the same. */
var FORM=null;      /* {key, title, html, mount} — the one being shown */
var FORM_OPEN={};   /* what rebuilds it when you arrive by the back button */
function openForm(key, title, html, mount){
  FORM={key:key, title:title, html:html, mount:mount||null};
  if(here().r==='form' && here().a===key){ render(); window.scrollTo(0,0); }
  else go('form', key);
}
function formArg(a){
  var i=String(a||'').indexOf(':');
  return (i<0)? {kind:String(a||''), rest:''} : {kind:a.slice(0,i), rest:a.slice(i+1)};
}
function vForm(){
  var a=here().a;
  if(!FORM || FORM.key!==a){
    var s=formArg(a), f=FORM_OPEN[s.kind];
    if(f) try{ f(s.rest); }catch(e){}
    if(!FORM || FORM.key!==a)
      return '<div class="view">'+navTop('')+'<div class="body">'+
        '<div class="empty"><div class="eb">'+t('form.gone')+'</div></div></div></div>';
  }
  return '<div class="view">'+navTop('')+'<div class="body" id="form-body">'+FORM.html+'</div></div>';
}
function formMount(){ if(FORM && FORM.mount) FORM.mount(); }
/* Kept because a dozen save buttons call it. Closing a form is leaving a page. */
function closeSheet(e){
  if(e && e.target && e.target.id!=='sbg') return;
  if(here().r==='form') back();
}
function showSheet(html){ openForm('x:'+(FORM_SEQ++), '', html, null); }
var FORM_SEQ=0;
function pkSwitch(id){
  pkScript = (pkScript===id ? '' : id);           /* tap again to fold away */
  var e=document.getElementById('pk-chars'); if(e) e.innerHTML=pkCharsHTML();
  var r=document.querySelectorAll('.pktab'); for(var i=0;i<r.length;i++){ var b=r[i];
    if(b.getAttribute('data-id')===pkScript) b.classList.add('on'); else b.classList.remove('on'); } }
var pkFor='';
function pkCharsHTML(){
  if(!pkScript) return '';
  var w=null; WORLD_SCRIPTS.forEach(function(x){ if(x.id===pkScript) w=x; });
  if(!w) return '';
  var cur=chOf(pkFor), taken=chTaken();
  return w.ch.split(' ').map(function(ch){
    var used=taken[ch] && taken[ch]!==pkFor;
    return '<button class="pkch'+(used?' had':'')+(ch===cur?' cur':'')+'" onclick="setCh(\''+esc(pkFor)+'\',\''+esc(ch)+'\')">'+esc(ch)+'</button>';
  }).join('');
}
function openPick(lid){
  pkFor=lid;
  var l=ltById(lid);
  var cur=(l && l.ch)||'';
  openForm('pick:'+lid, t('ch.for', ltName(l)||t('lt.untitled')),
    '<div class="pkown"><input class="scin own" id="own-ch" maxlength="4" value="'+esc(cur)+'" placeholder="'+esc(t('script.own.ph'))+'" autocomplete="off" '+
      'onkeydown="if(event.key===\'Enter\'){event.preventDefault();takeOwn();}">'+
    '<button class="btn" onclick="takeOwn()">'+t('script.set')+'</button></div>'+
    (cur? '<button class="pkclear" onclick="setCh(\''+esc(lid)+'\',\'\')">'+t('ch.clear')+'</button>':'')+
    '<div class="pktabs">'+WORLD_SCRIPTS.map(function(w){
      return '<button class="pktab'+(w.id===pkScript?' on':'')+'" data-id="'+w.id+'" onclick="pkSwitch(\''+w.id+'\')">'+
        '<span class="pkpv">'+esc(w.pv.slice(0,2))+'</span>'+esc(t('ws.'+w.id))+'</button>';
    }).join('')+'</div>'+
    '<div class="pkchars" id="pk-chars">'+pkCharsHTML()+'</div>');
}
FORM_OPEN.pick=function(x){ openPick(x); };
/* pkFor is a letter's id. A borrowed character is one of the two shapes a
   letter can have, so taking one is setting that letter's shape. */
function setCh(lid, ch){
  ltSetChar(lid, ch);
  SET.showScript=true; save(); installScriptFont();
  if(here().r==='form') back(); else render();
}
function clearCh(lid){ ltSetChar(lid, ''); save(); installScriptFont(); render(); }
function takeOwn(){
  var e=document.getElementById('own-ch'); if(!e) return;
  setCh(pkFor, e.value);
}
function toggleScript(){ SET.showScript=!SET.showScript; save(); render(); }
function scrPreview(){
  var w = WORDS.length? WORDS[WORDS.length-1].hw : '';
  if(!w) return '';
  return '<span class="scrpvw">'+esc(inScript(w))+'</span><span class="scrpvr">'+esc(w)+'</span>';
}
/* Characters already spoken for, so the palette can grey them out. */
/* Characters already spoken for, so the palette can grey them out. Two
   letters may not wear the same borrowed character; there would be no way to
   tell them apart on the page. */
function chTaken(){
  var o={};
  LETTERS.forEach(function(l){ if(l.ch) o[l.ch]=l.id; });
  return o;
}

/* One sound as a small tile: the character it wears above, the sound below.
   Tapping opens the picker in the sheet rather than growing the page. */
function phTile(p){
  var cur=chOf(p), added=addedSnd().indexOf(p)>=0;
  return '<button class="ptile'+(cur?' has':'')+'" onclick="openPick(\''+esc(p)+'\')">'+
    (added? '<span class="pdel" onclick="event.stopPropagation();dropSnd(\''+esc(p)+'\')">'+ICON_CROSS+'</span>':'')+
    '<span class="pch">'+(cur?esc(cur):'+')+'</span>'+
    '<span class="psn">'+esc(p)+'</span></button>';
}

/* ---- the three roots -------------------------------------------------
   One screen used to be the cover and the contents and the recent work all
   at once, and it scrolled -- so the name of your language slid off the top
   of the first thing you saw. Three now, one per tab.

   HOME is the cover. It does not scroll: 「ホームもスクロールさせるな固定させて
   くれ」. The name, what state the language is in, and the one thing to do
   next.

   BUILD is the old contents -- 「今の目次画面が制作画面になる」.

   FIND is search across the whole language and bringing other people's work
   in. It is where a public gallery goes when there is one; until then it is
   already the fastest way into a word, which is what it is for. */
function vHome(){
  var last=WORDS.length?WORDS[WORDS.length-1]:null;
  return '<div class="view fixed">'+
    '<div class="top"><div class="brand">LIN<span class="st">G</span>UA</div>'+
    '<button class="iconb" onclick="go(\'settings\')" aria-label="'+esc(t('set.title'))+'">'+ICON_GEAR+'</button></div>'+
    '<div class="cover">'+
      '<div class="tkick">'+t('home.kicker')+'</div>'+
      '<button class="tname" onclick="editName()">'+esc(langName||t('home.unnamed'))+'<span class="pen">'+ICON_PEN+'</span></button>'+
      '<div class="tsub">'+(WORDS.length? esc(phIpa(wPh(WORDS[0]))) : '　')+'</div>'+
      '<div class="rule"></div>'+
      '<div class="cvrow">'+
        cvStat(t('toc.sound'), addedSnd().length||'—', 'sound')+
        cvStat(t('toc.letters'), ltShaped()||'—', 'letters')+
        cvStat(t('toc.words'), WORDS.length||'—', 'words')+
      '</div>'+
      nextStep()+
      (last? '<button class="recent" onclick="go(\'words\')">'+
            '<div class="rh">'+t('home.recent.word')+'</div>'+
            '<div class="line'+(myFontOn()?' sfont':'')+'">'+esc(wOut(last.hw))+'</div>'+
            '<div class="tr">'+(wMn(last)? esc(wMn(last))+' · ':'')+esc(readOut(last.hw))+'</div></button>' : '')+
    '</div>'+
    tabBar()+
  '</div>';
}
function cvStat(lab, val, r){
  return '<button class="cvst" onclick="go(\''+r+'\')"><span class="cvv">'+esc(String(val))+'</span>'+
    '<span class="cvl">'+esc(lab)+'</span></button>';
}
/* The contents, in the order the work happens: you choose sounds, you give
   them letters, and then there is something a word can be made of. */
function vBuild(){
  var toc=[
    ['I',  t('toc.sound'),  'sound',   addedSnd().length||'—'],
    ['II', t('toc.letters'),'letters', LETTERS.length? (ltShaped()+' / '+LETTERS.length):'—'],
    ['III',t('toc.words'),  'words',   WORDS.length? tn('count.words', WORDS.length):'—'],
    ['IV', t('toc.gram'),   'gram',    stCount()+' / '+stAll().length],
    ['V',  t('toc.sent'),   'sent',    LINES.length? tn('count.lines', LINES.length):'—'],
    ['VI', t('toc.notes'),  'notes',   NOTES.length? tn('count.notes', NOTES.length):'—'],
    ['VII',t('toc.talk'),   'talk',    TALK.length? tn('count.turns', TALK.length):'—']
  ];
  return '<div class="view">'+
    '<div class="navtop"><span class="navt">'+esc(t('tab.build'))+'</span></div>'+
    '<div class="body" style="padding-top:4px">'+
    capBanner()+
    '<div class="toc">'+toc.map(function(row){
      return '<button class="trow" onclick="go(\''+row[2]+'\')">'+
        '<span class="rn">'+row[0]+'</span><span class="rt">'+esc(row[1])+'</span>'+
        '<span class="lead"></span><span class="rv">'+esc(row[3])+'</span>'+ICON_GO+'</button>';
    }).join('')+'</div>'+
    '<button class="trow" onclick="go(\'settings\')" style="margin-top:18px">'+
      '<span class="rn"></span><span class="rt">'+esc(t('set.title'))+'</span>'+
      '<span class="lead"></span>'+ICON_GO+'</button>'+
    '</div>'+tabBar()+'</div>';
}
/* Search, over everything, from anywhere -- and the way other people's work
   comes in. */
function vFind(){
  var qq=String(fq||'').trim().toLowerCase(), hits=[];
  if(qq){
    hits=WORDS.filter(function(w){ return srcKey(w).indexOf(qq)>=0; })
      .sort(function(a,b){ return String(a.hw).localeCompare(String(b.hw)); });
  }
  return '<div class="view">'+
    '<div class="navtop"><span class="navt">'+esc(t('tab.find'))+'</span></div>'+
    '<div class="chead">'+
    '<div class="search"><span class="lens">'+ICON_LENS+'</span>'+
    '<input id="f-q" placeholder="'+esc(t('find.ph'))+'" value="'+esc(fq)+'" oninput="setFq(this.value)">'+
    '<button class="sx" id="f-x" onclick="clearFq()"'+(fq?'':' hidden')+
      ' aria-label="'+esc(t('words.clear'))+'">'+ICON_CROSS+'</button></div></div>'+
    '<div class="body" id="f-list">'+findBodyHTML(hits, qq)+'</div>'+
    tabBar()+'</div>';
}
var fq='';
function findBodyHTML(hits, qq){
  if(!qq)
    return '<div class="fcard"><div class="fch">'+t('find.mine.h')+'</div>'+
      '<div class="note">'+t('find.mine.d')+'</div></div>'+
      '<button class="trow" onclick="openImport()"><span class="rn"></span>'+
      '<span class="rt">'+esc(t('set.csv.in'))+'</span><span class="lead"></span>'+ICON_GO+'</button>'+
      '<div class="fcard soon"><div class="fch">'+t('find.world.h')+'</div>'+
      '<div class="note">'+t('find.world.d')+'</div></div>';
  if(!hits.length) return '<div class="empty"><div class="eb">'+t('words.nomatch')+'</div></div>';
  return hits.map(function(w){ return entryHTML(w, false); }).join('');
}
function setFq(v){
  fq=v;
  var el=document.getElementById('f-list'); if(!el) return;
  var qq=String(v||'').trim().toLowerCase();
  el.innerHTML=findBodyHTML(qq? WORDS.filter(function(w){ return srcKey(w).indexOf(qq)>=0; })
    .sort(function(a,b){ return String(a.hw).localeCompare(String(b.hw)); }) : [], qq);
  var x=document.getElementById('f-x');
  if(x){ if(v) x.removeAttribute('hidden'); else x.setAttribute('hidden',''); }
}
function clearFq(){
  var e=document.getElementById('f-q');
  fq=''; if(e){ e.value=''; e.focus(); }
  setFq('');
}
function editName(){
  var v=prompt(t('home.name.prompt'), langName);
  if(v!==null && v.trim()){ langName=v.trim(); save(); render(); }
}

/* =========================================================================
   7. Words (the dictionary)
   ========================================================================= */
/* The dictionary is one screen, and it was one list. A box that filtered as
   you typed, entries sorted one way, and the first of a word's meanings. That
   is a word list; a dictionary is a thing you go into looking for something.
   So: search that says what it found and can be cleared, a rail that narrows
   by part of speech and can show the words still waiting for a meaning, a
   choice of order, every sense on the entry rather than the first, and where
   a word came from written on it rather than implied by an indent. */
var q='', wFil='*', wSort='a';
function wFilters(){
  var out=[{k:POS_ALL, lab:posLabel(POS_ALL)}], i;
  for(i=0;i<POS.length;i++) out.push({k:POS[i], lab:posLabel(POS[i])});
  out.push({k:'nomn', lab:t('sent.nomean')});
  return out;
}
/* One place decides what is on screen, so the list, the count and the button
   that says them all can never disagree about it. */
function wordsList(){
  var items=WORDS.slice(), qq=String(q||'').trim().toLowerCase();
  if(wFil==='nomn') items=items.filter(function(w){ return !wMns(w).length; });
  else if(wFil!==POS_ALL) items=items.filter(function(w){ return w.pos===wFil; });
  if(qq) items=items.filter(function(w){ return srcKey(w).indexOf(qq)>=0; });
  if(wSort==='new') items.sort(function(a,b){ return (b.at||0)-(a.at||0); });
  else items.sort(function(a,b){ return String(a.hw).localeCompare(String(b.hw)); });
  return items;
}
/* Nesting a derived word under its parent only tells the truth in the order
   where the parent is next to it. Sorted by when they were made, or narrowed
   to the verbs, the parent may not be on screen at all -- so that order lists
   every word flat, and each one says where it came from itself. */
function wordsBodyHTML(items){
  if(!items.length)
    return '<div class="empty"><div class="eb">'+
      ((q||wFil!==POS_ALL)? t('words.nomatch') : t('words.empty'))+'</div></div>';
  if(wSort!=='a'){
    return items.map(function(w){ return entryHTML(w, false); }).join('');
  }
  var out='', cur='', shown={};
  items.forEach(function(w){ shown[String(w.hw)]=1; });
  items.forEach(function(w){
    if(w.from && shown[w.from]) return;      /* listed under its parent, not twice */
    var L=String(w.hw).charAt(0).toUpperCase();
    if(L!==cur){ cur=L; out+='<div class="gl">'+esc(cur)+'</div>'; }
    out+=entryHTML(w, false);
    wKids(w).forEach(function(k){ if(shown[String(k.hw)]) out+=entryHTML(k, true); });
  });
  return out;
}
function wMetaHTML(items){
  return '<span class="wct">'+tn('words.n', items.length)+'</span>'+
    '<button class="wsrt" onclick="setSort()">'+ICON_SORT+
      esc(t(wSort==='a'? 'words.sort.a' : 'words.sort.new'))+'</button>'+
    (items.length>1
      ? '<button class="wsay'+(vxRunning()?' on':'')+'" onclick="wordsSay()">'+
        (vxRunning()? ICON_CROSS+t('words.stop') : ICON_PLAY+t('words.sayall'))+'</button>'
      : '');
}
function vWords(){
  var items=wordsList();
  return '<div class="view">'+
    navTop(WORDS.length+(has('plus')?'':' / '+FREE_LIMIT))+
    '<div class="chead">'+
    '<div class="search"><span class="lens">'+ICON_LENS+'</span>'+
    '<input id="w-q" placeholder="'+esc(t('words.search'))+'" value="'+esc(q)+'" oninput="setQ(this.value)">'+
    /* always in the page, shown when there is something to clear -- typing
       repaints the list, not the header, so a button conjured up by the query
       string would never appear until the screen was left and come back to */
    '<button class="sx" id="w-x" onclick="clearQ()"'+(q?'':' hidden')+
      ' aria-label="'+esc(t('words.clear'))+'">'+ICON_CROSS+'</button>'+
    '</div>'+
    '<div class="segs scrollx">'+wFilters().map(function(f){
      return '<button class="seg'+(wFil===f.k?' on':'')+'" onclick="setFil(\''+f.k+'\')">'+esc(f.lab)+'</button>';
    }).join('')+'</div>'+
    '<div class="wmeta" id="w-meta">'+wMetaHTML(items)+'</div>'+
    '</div><div class="body" id="w-list">'+wordsBodyHTML(items)+'</div>'+
    '<div class="barfix"><button class="btn ghost" onclick="go(\'make\')">'+t('words.coin')+'</button>'+
    '<button class="btn" onclick="openAdd()">'+t('home.write')+'</button></div></div>';
}
/* Typing redraws the list and the count and nothing else, because redrawing
   the screen would take the keyboard's focus off the box being typed into. */
function wordsPaint(){
  var el=document.getElementById('w-list'); if(!el) return;
  var items=wordsList();
  el.innerHTML=wordsBodyHTML(items);
  var m=document.getElementById('w-meta'); if(m) m.innerHTML=wMetaHTML(items);
  var x=document.getElementById('w-x'); if(x){ if(q) x.removeAttribute('hidden'); else x.setAttribute('hidden',''); }
}
function setQ(v){ q=v; wordsPaint(); }
/* Clearing leaves the cursor where it was, because clearing a search is
   nearly always the first half of typing a different one. */
function clearQ(){
  var e=document.getElementById('w-q');
  q=''; if(e){ e.value=''; e.focus(); }
  wordsPaint();
}
function setFil(k){ wFil=k; render(); }
function setSort(){ wSort=(wSort==='a')?'new':'a'; render(); }
/* One entry. The word says itself when you touch it; the chevron at its edge
   opens it. Listening is what you do dozens of times on this screen and
   editing is what you do once.

   Every sense, numbered, and not only the first: a word with three meanings
   that shows one is lying about the word. Where it came from is written on
   it, and how many words have come from it, because that is the shape of a
   dictionary and an indent alone cannot say it. */
function entryHTML(w, kid){
  var mns=wMns(w), kids=wKids(w), par=wParent(w), mn;
  /* A missing meaning in a dictionary row is something to do, not a fact to
     report -- 「意味のところにまだ決めてないって書くのやめてくんない？」. As the name
     of a filter it stays "no meaning", because there it does describe a set. */
  if(!mns.length) mn='<span class="nomn">'+esc(t('words.addmn'))+'</span>';
  else if(mns.length===1) mn=esc(mns[0]);
  else mn=mns.map(function(m,i){
    return '<span class="sn">'+(i+1)+'</span>'+esc(m); }).join(' ');
  var line='';
  if(par) line+='<span class="efrom">'+esc(t('word.from', par.hw))+'</span>';
  if(kids.length && !(wSort==='a' && !q && wFil===POS_ALL))
    line+='<span class="ekids">'+esc(tn('words.kids', kids.length))+'</span>';
  return '<div class="entry'+(kid?' kid':'')+'">'+
    '<button class="ebody" onclick="sayPh('+esc(JSON.stringify(wPh(w)))+')" aria-label="'+esc(t('f.listen'))+'">'+
    '<div class="hwrow"><span class="hw">'+esc(wOut(w.hw))+'</span>'+
    '<span class="rd">'+esc(phIpa(wPh(w)))+'</span>'+
    '<span class="pos">'+esc(posLabel(w.pos))+'</span></div>'+
    '<div class="mn">'+mn+'</div>'+
    (line? '<div class="erel">'+line+'</div>' : '')+
    '</button>'+
    '<button class="eopen" onclick="openWord(\''+esc(w.hw)+'\')" aria-label="'+esc(t('words.open'))+'">'+ICON_GO+'</button></div>';
}
/* Every word on screen, said straight through -- on screen and not in the
   dictionary, so a search narrowed to the verbs says the verbs. */
function wordsSay(){
  saySeqs(wordsList().map(function(w){ return wPh(w); }));
}

/* =========================================================================
   8. Sound
   ========================================================================= */
/* The chart is the picker. Tapping a symbol says this language uses that
   sound; tapping it again says it does not. Nothing is guessed from how a
   word happens to be spelled, because there is nothing left to guess: the
   sounds were chosen here. */
function sndLetter(sym){
  if(wsDrawn(sym)) return 'drawn';
  if(chOf(sym)) return 'borrowed';
  return '';
}
function sndDrawn(){ return wsHave(); }
/* One letter of the writing system, with whatever has been given to it.
   What it is a letter OF depends on the kind of writing: a sound, a syllable,
   a consonant, a whole word. Tapping it opens the surface it is drawn on.

   A letter an abugida has worked out for itself -- a consonant with a vowel
   mark on it -- is shown as what it is and cannot be drawn over: the two
   pieces it is made of are what you change. */
function sndTile(sym){
  var kind=sndLetter(sym), made=(!ltStrokes(sym) && kind==='drawn');
  var face = kind==='drawn' ? '<canvas class="tc" data-r="'+esc(sym)+'"></canvas>'
           : kind==='borrowed' ? '<span class="bch">'+esc(chOf(sym))+'</span>'
           : '<span class="nol">+</span>';
  return '<button class="gtile'+(kind?'':' empty')+(made?' made':'')+'" onclick="editGlyph(\''+sym+'\')">'+
    face+'<span class="rl">'+esc(sym)+'</span></button>';
}
/* The five kinds of writing, as a rail. Changing it changes what there is to
   draw, so the font is rebuilt and the tiles below redrawn. */
function wsysRow(){
  return '<div class="segs">'+WSYS.map(function(k){
    return '<button class="seg'+(wsys()===k?' on':'')+'" onclick="setWsys(\''+k+'\')">'+
      esc(t('ws.k.'+k))+'</button>';
  }).join('')+'</div>'+
  '<div class="note">'+t('ws.k.'+wsys()+'.d')+'</div>';
}
/* ---- the abugida bench ------------------------------------------------
   「アブギダの場合は、調整しやすいように別エディターが欲しい。母音+子音を見てチェック
   できるように。」

   An abugida is the one writing system whose letters are not drawn one at a
   time. A consonant letter carries a vowel mark, and the letter you actually
   read is the two together -- so the thing that has to be right is not any
   one drawing, it is how the mark sits on every consonant there is. Drawing
   them one at a time and hoping is not a way to find that out.

   This is a bench: one vowel at a time, every consonant of the language
   wearing it, all at once and at a size you can judge. The mark can be moved
   and resized from here, and every cell changes together, because that is
   what "adjust it" means when the mark is one drawing used thirty times. A
   cell that will not come right whatever the mark does can be opened and
   drawn as itself -- which is how a real abugida works too: a handful of
   combinations are irregular and the rest are the rule. */
var abVow='';
function abVowel(){
  var vs=wsVows();
  if(vs.indexOf(abVow)>=0) return abVow;
  return vs.length? vs[0] : '';
}
function setAbVow(v){ abVow=v; render(); }
/* Moving the mark moves the mark, not this one letter: it is one drawing and
   every combination is made out of it. Whole lattice steps, so what was on a
   dot stays on a dot. */
function abNudge(dx, dy){
  var v=abVowel(), l=ltMain(v);
  if(!l || !l.st || !l.st.length){ toast(t('ab.nomark')); return; }
  var s=gstep(), i, j, p;
  for(i=0;i<l.st.length;i++) for(j=0;j<l.st[i].pts.length;j++){
    p=l.st[i].pts[j];
    p[0]=gsnap(p[0]+dx*s); p[1]=gsnap(p[1]+dy*s);
  }
  saveLetters(); installScriptFont(); render();
}
function abScale(f){
  var v=abVowel(), l=ltMain(v);
  if(!l || !l.st || !l.st.length){ toast(t('ab.nomark')); return; }
  var lo=[1e9,1e9], hi=[-1e9,-1e9], i, j, p;
  for(i=0;i<l.st.length;i++) for(j=0;j<l.st[i].pts.length;j++){
    p=l.st[i].pts[j];
    if(p[0]<lo[0]) lo[0]=p[0]; if(p[0]>hi[0]) hi[0]=p[0];
    if(p[1]<lo[1]) lo[1]=p[1]; if(p[1]>hi[1]) hi[1]=p[1];
  }
  var cx=(lo[0]+hi[0])/2, cy=(lo[1]+hi[1])/2;
  for(i=0;i<l.st.length;i++) for(j=0;j<l.st[i].pts.length;j++){
    p=l.st[i].pts[j];
    p[0]=gsnap(cx+(p[0]-cx)*f); p[1]=gsnap(cy+(p[1]-cy)*f);
  }
  saveLetters(); installScriptFont(); render();
}
function vAbugida(){
  var vs=wsVows(), cs=wsCons(), v=abVowel();
  if(!wsHasMarks())
    return '<div class="view">'+navTop('')+'<div class="body">'+
      '<div class="note">'+t('ab.notabugida')+'</div>'+
      '<button class="btn ghost" style="width:100%;margin-top:12px" onclick="go(\'letters\')">'+
      esc(t('toc.letters'))+'</button></div></div>';
  return '<div class="view">'+navTop(cs.length+' × '+vs.length)+'<div class="body">'+
    '<div class="note" style="margin-bottom:10px">'+t('ab.d')+'</div>'+
    '<div class="segs scrollx">'+vs.map(function(x){
      return '<button class="seg'+(x===v?' on':'')+'" onclick="setAbVow(\''+esc(x)+'\')">'+esc(x)+'</button>';
    }).join('')+'</div>'+
    (v
      ? '<div class="abmark">'+
          '<div class="abmh">'+esc(t('ab.mark', v))+'</div>'+
          '<div class="abctl">'+
            '<button onclick="abNudge(-1,0)" aria-label="'+esc(t('ab.left'))+'">'+ICON_ARR_L+'</button>'+
            '<button onclick="abNudge(1,0)" aria-label="'+esc(t('ab.right'))+'">'+ICON_ARR_R+'</button>'+
            '<button onclick="abNudge(0,-1)" aria-label="'+esc(t('ab.up'))+'">'+ICON_ARR_U+'</button>'+
            '<button onclick="abNudge(0,1)" aria-label="'+esc(t('ab.down'))+'">'+ICON_ARR_D+'</button>'+
            '<button onclick="abScale(1.25)">'+t('ab.bigger')+'</button>'+
            '<button onclick="abScale(0.8)">'+t('ab.smaller')+'</button>'+
            '<button onclick="editGlyph(\''+esc(v)+'\')">'+ICON_PEN+t('ab.draw')+'</button>'+
          '</div></div>'+
        '<div class="sec">'+t('ab.every', v)+'</div>'+
        (cs.length
          ? '<div class="abgrid">'+cs.map(function(c){
              var u=wsKey([c,v]), own=!!ltStrokes(u);
              return '<button class="abcell'+(own?' own':'')+'" onclick="editGlyph(\''+esc(u)+'\')">'+
                '<canvas class="tc" data-r="'+esc(u)+'"></canvas>'+
                '<span class="abu">'+esc(u)+'</span></button>';
            }).join('')+'</div>'+
            '<div class="mini" style="margin-top:8px">'+t('ab.cell')+'</div>'
          : '<div class="note">'+t('ab.nocons')+'</div>')
      : '<div class="note">'+t('ab.novow')+'</div>')+
    '</div></div>';
}
function sndHas(sym){
  var a=addedSnd();
  return a.indexOf(sym)>=0;
}
function sndToggle(sym){
  var a=addedSnd(), i=a.indexOf(sym);
  if(i>=0) a.splice(i,1); else a.push(sym);
  save(); render();
}
/* Spoken from the words' own sequences. A spelling is only what those
   sequences look like written down, so it is looked up rather than read. */
function sayWords(list){
  var seq=[], i, j, w;
  for(i=0;i<list.length;i++){
    w=null;
    for(j=0;j<WORDS.length;j++) if(String(WORDS[j].hw)===String(list[i])){ w=WORDS[j]; break; }
    seq=seq.concat(w? wPh(w) : phGuess(list[i]));
  }
  sayPh(seq);
}
/* Tapping a sound plays it, and adds it. Tapping it again plays it and takes
   it back out. It used to be a double-tap to hear, which nobody discovers, so
   in practice the chart made no sound at all -- on the one screen whose whole
   subject is what things sound like. */
function sndTap(sym){ sayOne(sym); sndToggle(sym); }
function ipaBtn(sym){
  return '<button class="ph2'+(sndHas(sym)?' on':'')+'" onclick="sndTap(\''+sym+'\')">'+esc(sym)+'</button>';
}
function ipaConsTable(){
  var rows='', mi, pi, m, cell;
  for(mi=0; mi<IPA_MANNERS.length; mi++){
    m=IPA_MANNERS[mi];
    if(!ipaHasManner(m)) continue;
    rows+='<tr><th>'+esc(t('ipa.m.'+m))+'</th>';
    for(pi=0; pi<IPA_PLACES.length; pi++){
      cell=ipaCell(m, IPA_PLACES[pi]);
      rows+='<td>'+cell.map(function(c){ return ipaBtn(c.s); }).join('')+'</td>';
    }
    rows+='</tr>';
  }
  return '<div class="ipascroll"><table class="ipatab">'+rows+'</table></div>';
}
function ipaVowTable(){
  var rows='', hi, bi, cell;
  for(hi=0; hi<IPA_HEIGHTS.length; hi++){
    rows+='<tr><th>'+esc(t('ipa.h.'+IPA_HEIGHTS[hi]))+'</th>';
    for(bi=0; bi<IPA_BACKS.length; bi++){
      cell=ipaVCell(IPA_HEIGHTS[hi], IPA_BACKS[bi]);
      rows+='<td>'+cell.map(function(v){ return ipaBtn(v.s); }).join('')+'</td>';
    }
    rows+='</tr>';
  }
  return '<table class="ipatab">'+rows+'</table>';
}

/* ---- I. sounds --------------------------------------------------------
   The inventory, and nothing about shapes except which letters read each
   sound and the way to reach them. What a sound is written with is a fact
   about the letter, so it is shown here as a reference and edited there --
   but making one from here is one tap, because that is the moment you want
   it. 「音専用ページと文字アルファベットページ別にして。どっちからでもお互い追加でき
   るようにすればいいから」 */
function vSound(){
  var mine=addedSnd();
  return '<div class="view">'+
    navTop(mine.length)+
    '<div class="body">'+
    '<div class="note" style="margin-bottom:10px">'+t('ipa.note')+'</div>'+
    '<div class="sec">'+t('ipa.mine')+'</div>'+
    (mine.length
      ? '<div class="sndlist">'+mine.map(sndRow).join('')+'</div>'+
        '<button class="trow" onclick="go(\'letters\')" style="margin-top:14px">'+
          '<span class="rn"></span><span class="rt">'+esc(t('toc.letters'))+'</span>'+
          '<span class="lead"></span><span class="rv">'+ltShaped()+'</span>'+ICON_GO+'</button>'
      : '<div class="ipamine"><span class="none">'+t('ipa.mine.none')+'</span></div>')+
    '<div class="sec">'+t('ipa.cons')+'</div>'+ipaConsTable()+
    '<div class="sec">'+t('ipa.vows')+'</div>'+ipaVowTable()+
    '<div class="sec">'+t('ipa.other')+'</div>'+
    '<div class="ipafree">'+IPA_OTHER.map(function(o){ return ipaBtn(o.s); }).join('')+'</div>'+
    '<div class="note" style="margin-top:22px">'+t('ipa.footer')+'</div>'+
    '</div></div>';
}
/* One sound: itself, what it is written with, and the two ways to change
   that -- draw a new letter for it, or hand it to a letter that exists. */
function sndRow(p){
  var ls=ltFor(p), i, faces='';
  for(i=0;i<ls.length;i++) faces+=ltFace(ls[i], 'editLetter(\''+ls[i].id+'\')');
  return '<div class="sndrow">'+
    '<button class="sndp" onclick="sayOne(\''+esc(p)+'\')">'+esc(p)+'</button>'+
    '<div class="sndls">'+faces+
      '<button class="sndadd" onclick="editGlyph(\''+esc(p)+'\')" aria-label="'+
        esc(t('lt.draw'))+'">'+ICON_ADD+'</button>'+
      (LETTERS.length? '<button class="sndadd" onclick="go(\'pickltr\',\''+esc(p)+'\')" aria-label="'+
        esc(t('lt.use'))+'">'+ICON_LINK+'</button>' : '')+
    '</div>'+
    '<button class="sndx" onclick="dropSnd(\''+esc(p)+'\')" aria-label="'+esc(t('as.drop'))+'">'+ICON_CROSS+'</button>'+
    '</div>';
}
/* A letter's face, wherever one is shown: what was drawn, or the character it
   borrows, or -- for a letter with neither yet -- its name. */
function ltFace(l, call){
  var face;
  if(l.st && l.st.length) face='<canvas class="tc" data-l="'+esc(l.id)+'"></canvas>';
  else if(l.ch) face='<span class="bch">'+esc(l.ch)+'</span>';
  else face='<span class="nol">'+ICON_PEN+'</span>';
  return '<button class="ltf" onclick="'+call+'">'+face+'</button>';
}

/* ---- II. letters ------------------------------------------------------
   The alphabet, as a thing in itself. Every letter you have, what it reads,
   and the letters that read nothing yet -- which is the case the old model
   could not hold at all, and the reason the two are two chapters. */
function vLetters(){
  var loose=ltLoose();
  return '<div class="view">'+
    navTop(ltShaped()+' / '+LETTERS.length)+
    '<div class="body">'+
    '<div class="note" style="margin-bottom:10px">'+t('lt.note')+'</div>'+
    '<div class="sec">'+t('ws.kind')+'</div>'+
    wsysRow()+
    (wsHasMarks()
      ? '<button class="trow" onclick="go(\'abugida\')" style="margin-top:6px">'+
          '<span class="rn"></span><span class="rt">'+esc(t('ab.title'))+'</span>'+
          '<span class="lead"></span><span class="rv">'+wsCons().length+' × '+wsVows().length+'</span>'+ICON_GO+'</button>'
      : '')+
    '<div class="sec">'+t('lt.all')+'</div>'+
    (LETTERS.length
      ? '<div class="ltlist">'+LETTERS.map(ltRow).join('')+'</div>'
      : '<div class="note">'+t('lt.none')+'</div>')+
    '<button class="btn ghost" style="width:100%;margin-top:12px" onclick="newLetter()">'+
      ICON_ADD+t('lt.new')+'</button>'+
    (loose.length? '<div class="mini" style="margin-top:8px">'+tn('lt.loose', loose.length)+'</div>' : '')+
    (ltShaped()
      ? '<div class="sec">'+t('script.preview')+'</div>'+
        '<div class="spv"><div class="big sfont">'+esc(WORDS.length?WORDS[0].hw:addedSnd().join(''))+'</div></div>'+
        '<div class="pick">'+
          '<button class="'+(SET.myfont?'':'on')+'" onclick="setMyFont(false)">'+t('script.show.roman')+'</button>'+
          '<button class="'+(SET.myfont?'on':'')+'" onclick="setMyFont(true)">'+t('script.show.own')+'</button>'+
        '</div>' : '')+
    '<button class="trow" onclick="go(\'sound\')" style="margin-top:18px">'+
      '<span class="rn"></span><span class="rt">'+esc(t('toc.sound'))+'</span>'+
      '<span class="lead"></span><span class="rv">'+addedSnd().length+'</span>'+ICON_GO+'</button>'+
    '</div></div>';
}
function ltRow(l){
  var snd=(l.snd||[]);
  return '<div class="ltrow">'+
    ltFace(l, 'editLetter(\''+l.id+'\')')+
    '<button class="ltmid" onclick="editLetter(\''+l.id+'\')">'+
      '<span class="ltnm">'+esc(ltName(l)||t('lt.untitled'))+'</span>'+
      '<span class="ltsn">'+(snd.length? esc(t('lt.reads', snd.join(' / '))) : esc(t('lt.reads.none')))+'</span>'+
    '</button>'+
    '<button class="sndadd" onclick="go(\'picksnd\',\''+esc(l.id)+'\')" aria-label="'+
      esc(t('lt.addsnd'))+'">'+ICON_LINK+'</button>'+
    '</div>';
}

/* ---- joining the two, from either end ---------------------------------
   Two pages, one job: put a tick next to the ones that go together. From a
   sound you are choosing letters; from a letter you are choosing sounds. */
function vPickLtr(){
  var unit=here().a, on=ltFor(unit).map(function(l){ return l.id; });
  return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="note" style="margin-bottom:12px">'+t('lt.use.d', unit)+'</div>'+
    (LETTERS.length
      ? '<div class="ltlist">'+LETTERS.map(function(l){
          var has=on.indexOf(l.id)>=0;
          return '<div class="ltrow'+(has?' on':'')+'">'+
            ltFace(l, 'toggleLtr(\''+esc(unit)+'\',\''+l.id+'\')')+
            '<button class="ltmid" onclick="toggleLtr(\''+esc(unit)+'\',\''+l.id+'\')">'+
              '<span class="ltnm">'+esc(ltName(l)||t('lt.untitled'))+'</span>'+
              '<span class="ltsn">'+((l.snd&&l.snd.length)? esc(t('lt.reads', l.snd.join(' / '))) : esc(t('lt.reads.none')))+'</span>'+
            '</button>'+
            '<span class="ltck">'+(has? ICON_TICK : '')+'</span></div>';
        }).join('')+'</div>'
      : '<div class="note">'+t('lt.none')+'</div>')+
    '<button class="btn ghost" style="width:100%;margin-top:14px" onclick="editGlyph(\''+esc(unit)+'\')">'+
      ICON_ADD+t('lt.draw')+'</button>'+
    '</div></div>';
}
function toggleLtr(unit, id){
  var l=ltById(id); if(!l) return;
  if((l.snd||[]).indexOf(unit)>=0) ltUnlink(id, unit); else ltLink(id, unit);
  save(); installScriptFont(); render();
}
function vPickSnd(){
  var lid=here().a, l=ltById(lid);
  if(!l) return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="empty"><div class="eb">'+t('form.gone')+'</div></div></div></div>';
  var units=wsUnits(), on=(l.snd||[]);
  return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="note" style="margin-bottom:12px">'+t('lt.addsnd.d')+'</div>'+
    '<div class="field"><label>'+t('lt.name')+'</label>'+
      '<input id="lt-nm" value="'+esc(l.nm||'')+'" placeholder="'+esc(t('lt.name.ph'))+'" '+
      'oninput="ltSetName(\''+esc(lid)+'\',this.value)"></div>'+
    '<div class="sec">'+t('lt.reads.h')+'</div>'+
    (units.length
      ? '<div class="phkeys">'+units.map(function(u){
          return '<button class="phk'+(on.indexOf(u)>=0?' on':'')+'" onclick="toggleLtr(\''+esc(u)+'\',\''+esc(lid)+'\')">'+
            '<span class="pks">'+esc(u)+'</span></button>';
        }).join('')+'</div>'
      : '<div class="note">'+t('add.ph.none')+'</div>')+
    '<button class="btn ghost" style="width:100%;margin-top:14px" onclick="go(\'sound\')">'+
      esc(t('toc.sound'))+'</button>'+
    '</div></div>';
}
