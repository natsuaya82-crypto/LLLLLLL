/* Lingua — onboarding, which is the app until SET.done (chapter 5)
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

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
var ob={step:0, name:'', mode:'draw', pick:'', strokes:null, ch:'', lid:''};
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
  if(ob.step===1 && ob.mode==='borrow'){
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
    '<button class="btn signin google"' + DO('obSignIn') + '>'+MARK_GOOGLE+'<span>'+t('ob.signin.google')+'</span></button>'+
    '<button class="btn signin apple"' + DO('obSignIn') + '>'+MARK_APPLE+'<span>'+t('ob.signin.apple')+'</span></button>'+
    '<button class="obskip"' + DO('obSkip') + '>'+t('ob.signin.skip')+'</button>'+
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
  save(); obFinish();
}
function obNameHTML(){
  return '<div class="mid">'+
    '<h2>'+t('ob.name.h')+'</h2>'+
    '<p class="obsub">'+t('ob.name.sub')+'</p>'+
    '<div class="obnamebox"><input id="ob-name" value="'+esc(ob.name||langName||'')+'" '+
      'placeholder="'+esc(t('ob.name.ph'))+'" autocomplete="off" '+
      '' + KD('obName') + '></div>'+
    '</div>'+
    '<div class="obfoot"><button class="btn"' + DO('obName') + '>'+t('ob.next')+'</button>'+
    '<button class="obskip"' + DO('obNameLater') + '>'+t('ob.name.later')+'</button>'+
    '<div class="mini obnote">'+t('ob.name.note')+'</div></div>';
}
/* Not everyone has a name yet, and being stuck on the first question of the
   app because of it is absurd. The cover asks again, and the pencil beside
   the title is there whenever the answer arrives. */
function obNameLater(){ ob.name=''; obFinish(); }

/* ---- step 2, what a letter is a letter of -----------------------------
   Asked before any letter is drawn, because it decides what drawing one
   means. Each row says what it is and names a writing that works that way,
   so the choice is made by recognising something rather than by parsing a
   definition. */

/* ---- step 3, the sounds -----------------------------------------------
   It used to be fourteen buttons and no help: pick the sounds your language
   is made of, from a list somebody chose for you, with no way to hear any of
   them. Nobody who has not made a language before can answer that.

   So the app proposes. You say what the language should sound like -- soft,
   hard, flowing, breathy, plain -- and it draws an inventory out of that
   region of the chart, says the whole thing out loud, and waits. Take it, ask
   for another, or open the chart and do it yourself. */

/* ---- one letter -------------------------------------------------------
   Nothing about this letter is decided before it is drawn. The app used to
   pick a sound out of the inventory, put "the letter for k" at the top, and
   open the editor already belonging to k -- so the first thing anybody made
   here was an answer to a question the app had asked itself. What it reads
   is the next step, and it is a person who says. */
function obDone(){
  var keep=(GE && GE.st)? GE.st.filter(function(x){ return x.pts.length>0; }) : [];
  if(!keep.length){ toast(t('ob.draw.empty')); return; }
  /* a letter of its own, reading nothing yet */
  ob.lid=ltNew({ st: JSON.parse(JSON.stringify(keep)) }).id;
  SET.myfont=true;
  save(); installScriptFont(); GE=null;
  obGo(2);
}
function obBorrow(id){ ob.mode='borrow'; ob.pick=id||''; GE=null; render(); window.scrollTo(0,0); }
function obPickScript(id){ ob.pick=id; render(); window.scrollTo(0,0); }
function obTakeCh(ch){
  ob.lid=ltNew({ ch: ch }).id;
  SET.showScript=true;
  save(); installScriptFont();
  ob.mode=''; obGo(2);
}
function obSkipDraw(){ ob.lid=''; obGo(3); }

/* ---- what it reads ----------------------------------------------------
   The letter exists and says nothing. Here is where a person gives it a
   sound, or says it is a mark and reads nothing at all, or leaves it for
   later -- a letter with no sound is a perfectly good letter to have, and
   the letters chapter lists it as one still to finish.

   The sounds come from the chart itself rather than from an inventory,
   because a language that has just been started does not have one yet. The
   sound picked joins it. */
function obReads(sym){
  if(!ob.lid) { obGo(3); return; }
  var a=addedSnd();
  if(a.indexOf(sym)<0) a.push(sym);
  ltLink(ob.lid, sym);
  save(); installScriptFont(); sayOne(sym);
  obGo(3);
}
function obReadsMark(ch){
  if(ob.lid) ltSetRole(ob.lid, 'mark', ch);
  obGo(3);
}
function obReadLater(){ obGo(3); }
function obReadHTML(){
  return '<div class="mid obleft">'+
    '<h2 class="obh">'+t('ob.read.h')+'</h2>'+
    '<p class="obsub">'+t('ob.read.sub')+'</p>'+
    '<div class="obscroll">'+
      sndFeelHTML('obReads')+
      '<div class="sec">'+t('ob.read.mark')+'</div>'+
      '<div class="obmarks">'+['?','!','.',',',':',';'].map(function(c){
        return '<button class="obhb"' + DO('obReadsMark', [c]) + '>'+esc(c)+'</button>';
      }).join('')+'</div>'+
    '</div>'+
    '</div>'+
    '<div class="obfoot"><button class="obskip"' + DO('obReadLater') + '>'+t('ob.read.later')+'</button></div>';
}

function obFinish(){
  /* 「言語名決まってないのに音だけ決まってるの何？」 A language that reached the
     end of this without a name used to be handed the word "language" in the
     interface's language, which is not a name and is not even in the right
     one. It gets a word out of its own inventory instead -- which is a name
     it could actually have -- and the pencil on the cover changes it. */
  if(!langName){
    langName=ob.name||'';
    if(!langName){
      var seq=null;
      try{ seq=asWord('n'); }catch(e){}
      if(seq && seq.length){
        langName=seq.join('');
        langName=langName.charAt(0).toUpperCase()+langName.slice(1);
      }
    }
    if(!langName) langName=t('lang.default');
  }
  SET.done=true; save();
  route='home'; RENDERED=null; render(); window.scrollTo(0,0);
}

function obDrawHTML(){
  if(!GE) GE=newGE('');
  var st=GE.st[GE.si], pts=0;
  GE.st.forEach(function(x){ pts+=x.pts.length; });
  return '<div class="mid">'+
    '<h2>'+t('ob.draw.h')+'</h2>'+
    '<p class="obsub">'+t('ob.draw.sub')+'</p>'+
    '<div class="gcanvwrap obpad"><canvas id="gcanv" class="gcanv"></canvas></div>'+
    geRail(st, pts)+
    '<div class="obesc"><button class="obescb"' + DO('obBorrow', [""]) + '>'+
      '<span>'+t('ob.or')+'</span>'+OB_CHEVR+
    '</button></div></div>'+
    '<div class="obfoot"><button class="btn"' + DO('obDone') + '>'+t('ob.draw.done')+'</button>'+
    '<button class="obskip"' + DO('obSkipDraw') + '>'+t('ob.draw.later')+'</button></div>';
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
      return '<button class="obchb"' + DO('obTakeCh', [ch]) + '>'+esc(ch)+'</button>';
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
      return '<button class="obsrow"' + DO('obPickScript', [x.id]) + '>'+
        '<span class="obnm">'+esc(t('ws.'+x.id))+'</span>'+
        (pv? '<span class="obpv">'+esc(pv)+'</span>' : '')+
        '</button>';
    }).join('')+'</div></div>';
}

function vOb(){
  var s=ob.step;
  var head='<div class="obhead">'+
    (obCanBack()? '<button class="obback"' + DO('obBack') + ' aria-label="'+esc(t('ob.back'))+'">'+OB_CHEV+'</button>'
                : '<span class="obback ph"></span>')+
    '<div class="obtop">'+[0,1,2,3].map(function(i){
      return '<div class="dot'+(i<=s?' on':'')+'"></div>'; }).join('')+'</div>'+
    '<select class="oblang" aria-label="'+esc(t('ob.lang.a'))+'"' + CH('obLang') + '>'+
      UI_LANGS.map(function(c){
        return '<option value="'+c+'"'+(uiLang()===c?' selected':'')+'>'+esc(LANG[c].label)+'</option>';
      }).join('')+
    '</select></div>';
  /* Drawing used to be fourth, behind a name, a writing system and the
     sounds. The writing system is gone -- wsGuess() reads it off the letters
     rather than asking somebody to choose between an abjad and an abugida
     before they have drawn anything -- and the name went last, because a
     language is easier to name once it has made a mark, and obFinish() has
     always been able to invent one out of the inventory for anybody who
     skips it. */
  var h = (s===0)? obDoorHTML()
        : (s===1 && ob.mode==='borrow')? obBorrowHTML()
        : (s===1)? obDrawHTML()
        : (s===2)? obReadHTML()
        : obNameHTML();
  return '<div class="ob view'+(s===0?' center':'')+'">'+head+h+'</div>';
}

