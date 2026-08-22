/* Lingua — sound (chapter 8)
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   8. Sound
   ========================================================================= */
/* The chart is the picker. Tapping a symbol says this language uses that
   sound; tapping it again says it does not. Nothing is guessed from how a
   word happens to be spelled, because there is nothing left to guess: the
   sounds were chosen here. */
/* One letter of the writing system, with whatever has been given to it.
   What it is a letter OF depends on the kind of writing: a sound, a syllable,
   a consonant, a whole word. Tapping it opens the surface it is drawn on.

   A letter an abugida has worked out for itself -- a consonant with a vowel
   mark on it -- is shown as what it is and cannot be drawn over: the two
   pieces it is made of are what you change. */
/* The five kinds of writing, one to a row, each saying what it is. It was a
   rail of five tabs across the top of the letters chapter, wrapping so that
   Logography sat alone on a second line, on a screen you open every day to
   answer a question you answer once. */
/* Four of the five are paid. An alphabet is one letter per sound and the
   free plan is exactly that -- twenty-six slots with roman names on them --
   so a syllabary, an abjad, an abugida and a logography are all the same
   purchase: letters that are not a-z. Hidden rather than shown locked,
   because a row that cannot be pressed is a row that has to explain itself
   every time the screen is opened. */
function vWsys(){
  var kinds=can('wsys')? WSYS : ['alpha'];
  return '<div class="view">'+navTop('')+'<div class="body">'+
    kinds.map(function(k){
      return '<button class="set"' + DO('setWsys', [k]) + '>'+
        '<span class="sl">'+esc(t('ws.k.'+k))+'</span>'+
        '<span class="sv">'+(wsys()===k? ICON_TICK : '')+'</span></button>';
    }).join('')+
    (can('wsys')? '' :
      '<button class="capwarn" style="margin-top:10px"' + DO('goPlans') + '>'+t('ws.locked')+
        '<span class="capgo">'+t('up.cta')+ICON_GO+'</span></button>')+
    /* Which way it is written. Here rather than in the person's settings
       because it is the language's -- one language, one answer, and it goes
       in the backup with the rest of the language.

       Shown on the free plan, unlike the four writing systems above, and the
       reason they differ is worth being exact about. Hiding a syllabary from
       somebody who cannot have one costs them nothing: an alphabet is what
       they have and the row would only explain itself. A direction is
       different -- posts written in all four are on the timeline in front of
       them, on every plan, so the thing exists whether or not they can buy
       it, and a screen that pretends otherwise is a screen that cannot
       answer "why is that post sideways". */
    '<div class="sec">'+t('dir.title')+'</div>'+
    DIRS.map(function(k){
      return '<button class="set"' + DO('setScriptDir', [k]) + '>'+
        '<span class="sl">'+esc(t('dir.'+k))+'</span>'+
        '<span class="sv">'+(scriptDir()===k? ICON_TICK : '')+'</span></button>';
    }).join('')+
    (can('dir')? '' :
      '<button class="capwarn" style="margin-top:10px"' + DO('goPlans') + '>'+t('dir.locked')+
        '<span class="capgo">'+t('up.cta')+ICON_GO+'</span></button>')+
    /* Roman or your own letters is the same kind of decision -- it changes
       every screen in the app and nobody flips it twice a day -- so it sits
       with the others rather than under a specimen box on a chapter. */
    /* A switch, because it is a yes or a no. It was two buttons sharing a
       rule, which is the shape this app uses for choosing one of several --
       and there are not several here, there is one thing that is on or off.
       Off is roman, which is what the app shows when somebody's own letters
       are not being shown, and does not need a button of its own to say so. */
    '<div class="sec">'+t('script.show')+'</div>'+
    '<button class="set" style="border-bottom:none"' + DO('setMyFont', [!SET.myfont]) + '>'+
      '<span class="sl">'+esc(t('script.show.own'))+'</span>'+
      swtHTML(!!SET.myfont)+'</button>'+
    '</div></div>';
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
function abSetVow(v){ abVow=v; render(); }
/* Moving the mark moves the mark, not this one letter: it is one drawing and
   every combination is made out of it. Whole lattice steps, so what was on a
   dot stays on a dot. */
function abNudge(dx, dy){
  var v=abVowel(), l=ltMain(v);
  if(!l || !l.st || !l.st.length){ toast(t('ab.nomark')); return; }
  var s=geStep(), i, j, p;
  for(i=0;i<l.st.length;i++) for(j=0;j<l.st[i].pts.length;j++){
    p=l.st[i].pts[j];
    p[0]=geSnap(p[0]+dx*s); p[1]=geSnap(p[1]+dy*s);
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
    p[0]=geSnap(cx+(p[0]-cx)*f); p[1]=geSnap(cy+(p[1]-cy)*f);
  }
  saveLetters(); installScriptFont(); render();
}
function vAbugida(){
  var vs=wsVows(), cs=wsCons(), v=abVowel();
  if(!wsHasMarks())
    return '<div class="view">'+navTop('')+'<div class="body">'+
      '<div class="note">'+t('ab.notabugida')+'</div>'+
      '<button class="btn ghost" style="width:100%;margin-top:12px"' + DO('go', ["letters"]) + '>'+
      esc(t('toc.letters'))+'</button></div></div>';
  return '<div class="view">'+navTop()+'<div class="body">'+
    '<div class="segs scrollx">'+vs.map(function(x){
      return '<button class="seg'+(x===v?' on':'')+'"' + DO('abSetVow', [x]) + '>'+esc(x)+'</button>';
    }).join('')+'</div>'+
    (v
      ? '<div class="abmark">'+
          '<div class="abmh">'+esc(t('ab.mark', v))+'</div>'+
          '<div class="abctl">'+
            '<button' + DO('abNudge', [-1, 0]) + ' aria-label="'+esc(t('ab.left'))+'">'+ICON_ARR_L+'</button>'+
            '<button' + DO('abNudge', [1, 0]) + ' aria-label="'+esc(t('ab.right'))+'">'+ICON_ARR_R+'</button>'+
            '<button' + DO('abNudge', [0, -1]) + ' aria-label="'+esc(t('ab.up'))+'">'+ICON_ARR_U+'</button>'+
            '<button' + DO('abNudge', [0, 1]) + ' aria-label="'+esc(t('ab.down'))+'">'+ICON_ARR_D+'</button>'+
            '<button' + DO('abScale', [1.25]) + '>'+t('ab.bigger')+'</button>'+
            '<button' + DO('abScale', [0.8]) + '>'+t('ab.smaller')+'</button>'+
            '<button' + DO('editGlyph', [v]) + '>'+ICON_PEN+t('ab.draw')+'</button>'+
          '</div></div>'+
        '<div class="sec">'+t('ab.every', v)+'</div>'+
        (cs.length
          ? '<div class="abgrid">'+cs.map(function(c){
              var u=wsKey([c,v]), own=!!ltStrokes(u);
              return '<button class="abcell'+(own?' own':'')+'"' + DO('editGlyph', [u]) + '>'+
                '<canvas class="tc" data-r="'+esc(u)+'"></canvas>'+
                '<span class="abu">'+esc(u)+'</span></button>';
            }).join('')+'</div>'+
            ''
          : '<div class="note">'+t('ab.nocons')+'</div>')
      : '<div class="note">'+t('ab.novow')+'</div>')+
    '</div></div>';
}
/* ---- the language's sounds --------------------------------------------
   Which sounds a language uses is the language's, and it was the person's:
   SET.snd, in lingua.set, beside the theme and the interface language. One
   inventory for every language somebody has. Nothing showed it because there
   was no way to have two languages yet -- open somebody else's and you would
   have found your own sounds in it, and the letters you drew for them.

   It is the ninth slice, filed under langKey('snd') exactly as letters are. */
var SND=[];
/* The open language's sounds. Empty first: see langRead() in core.js. */
function sndRead(){
  SND=[];
  try{ var s=JSON.parse(localStorage.getItem(langKey('snd'))||'null');
       if(s && s.length) SND=s; }catch(e){}
}
sndRead();
function saveSnd(){ bkTouch(); try{ localStorage.setItem(langKey('snd'), JSON.stringify(SND)); }catch(e){} }
/* The one sound inventory anything reads. 35 places say addedSnd() meaning
   "the sounds of the language in front of me", and they still do. */
function addedSnd(){ return SND; }
/* Whatever was in SET.snd belonged to whichever language was open when it was
   written, which is this one. Copied, then taken off the settings so nothing
   can read it again. */
function migrateSnd(){
  if(SND.length || !SET.snd || !SET.snd.length) return;
  SND=SET.snd.slice();
  delete SET.snd;
  saveSnd(); save();
}
/* A language has sounds from the moment it exists: a drawn letter takes the
   next one nothing reads yet, so a language with none is one where every
   letter reads nothing. Called when the app starts and when a different
   language is opened, which are the two moments a language can turn out to
   have none. Never overwrites. */
function sndStart(){
  if(SND.length) return;
  SND=asOrder(asSounds('plain', 12));
  saveSnd();
}
/* The chart is also how a letter is told what it reads, and that is a
   different thing to do with the same button, so the name it says is passed
   in rather than assumed. Nothing else about the chart changes. */
/* Into the language, or out of it, with no letter involved. Taking one out
   goes through sndDrop() so the refusal is in one place. */
/* A sound joins the language, and a letter to write it with joins the
   alphabet in the same breath. 「音を増やしたら必然的に文字も増やすわけでしょ？」

   The letter arrives with the sound on it and nothing else -- no name, no
   shape -- so the alphabet gains a cell that says what it reads and is
   waiting to be drawn. That is the state the alphabet page already draws: a
   pencil where the shape goes, a dot where the name goes, and the reading
   under it.

   Paid only, because adding a letter is `letters` and the free plan's
   alphabet is exactly a to z, the two marks and the digits -- a twenty-ninth
   slot there would be a letter with no key on a keyboard that cannot change.
   Nothing on this path is reachable on free: the inventory is Plus's page.

   Dropping a sound does NOT drop the letter. A letter is a thing somebody
   may have drawn on, and sndDrop already refuses while any letter reads the
   sound -- so the way out is to say what that letter reads instead, on the
   letter, which is where that has always been said. */
function sndTake(sym){
  if(addedSnd().indexOf(sym)>=0){ sndDrop(sym); openSndAdd(); return; }
  SND=asOrder(addedSnd().concat([sym]));
  saveSnd();
  if(can('letters') && !sndLetters(sym).length){
    var l=ltNew({});
    l.snd=[sym]; l.chose=1;
    saveLetters(); installScriptFont();
  }
  sayOne(sym); openSndAdd();
}
/* ---- what a letter reads ----------------------------------------------
   There was a chapter here: the language's inventory on one page, its
   letters on another, and a letter's sound a fact you could reach from
   either. 「文字に音もあるのに音ページもあるしごちゃごちゃ。音専用ページは削除
   して。アルファベットのページから音を変更するボタン押して変更できるように」

   Two pages for one fact is one page too many, and the fact belongs to the
   letter. So the chart is a sheet opened from the letter it is about, and
   the inventory is what the letters between them read -- kept as a list
   because the spelling engine reads it, no longer shown as a place.

   It is the same chart the chapter had. What changed is what a symbol does
   when it is pressed: it used to join the language, and now it joins the
   letter, which is the only way it could ever have joined the language. */
/* ---- the IPA, as one page, wherever it is asked for ----------------------
   There were three of these and they were three different screens for one
   question. A letter's sound was a chart -- rows of manner against columns of
   place -- which does not fit the width of a phone and had the fricatives cut
   off the right-hand side, with five boxes of prose above it saying what
   "soft" and "breathy" mean. Adding a sound to the language was the same
   chart without the prose. A word's reading was neither: a search and a
   column of groups. 「音のページ単語と文字で全然違うから統一して」

   One shape, and it is the third one, because it is the one that fits: search
   at the top, this language's own sounds first, then the chart by how each
   sound is made. No prose 「説明いらん」.

   What differs between the three is one name -- what a press calls -- and
   which symbols are shown as already on. Both travel on the list itself, so
   typing in the search can repaint the tiles without knowing which of the
   three screens it is standing on. */
var ipaQ='';
function ipaSetQ(v){ ipaQ=String(v||''); ipaPaint(); }
/* The list again, without the page around it: what a press calls and what is
   already on travel on the element, so nothing here has to know which of the
   three screens it is standing on. */
function ipaPaint(){
  var e=document.getElementById('ipa-list');
  if(!e) return;
  e.innerHTML=ipaGroupsHTML(e.getAttribute('data-act'),
                            String(e.getAttribute('data-on')||'').split(' '));
}
/* What a symbol can be looked up by: itself, and the words for how it is
   made. Somebody hunting for theta knows 摩擦 or fricative long before they
   know where it sits on a chart of a hundred and sixty. */
function ipaWords(sym){
  var i, c=IPA_CONS, w=IPA_VOWS;
  for(i=0;i<c.length;i++) if(c[i].s===sym)
    return sym+' '+t('ipa.m.'+c[i].m)+' '+t('ipa.p.'+c[i].p);
  for(i=0;i<w.length;i++) if(w[i].s===sym)
    return sym+' '+t('ipa.h.'+w[i].h)+' '+t('ipa.b.'+w[i].b);
  return sym+' '+t('ipa.other');
}
function ipaHit(sym){
  return !ipaQ || ipaWords(sym).toLowerCase().indexOf(ipaQ.toLowerCase())!==-1;
}
/* Two things to do with one sound, and they are two buttons. Pressing the
   symbol takes it -- into the language, onto the letter, onto the reading --
   and pressing the speaker only says it. They were one button that did both,
   so the only way to hear a sound was to choose it first and take it back out
   afterwards. 「そのタイルの右上に音声マークつけて音聞けるようにして」「分けたいね」

   The speaker is a small circle at the corner and a 44pt target: the button
   is the size a thumb needs and the ink inside it is not. Drawing it small
   AND making it small is what press-check refuses, and it is right to. */
function ipaTiles(sym, act, on){
  return '<span class="phkp">'+
    '<button class="phk'+(on.indexOf(sym)>=0? ' on':'')+'"' +
      DO(act, [sym]) + '><span class="pks">'+esc(sym)+'</span></button>'+
    '<button class="phks"' + DO('sayPh', [[sym]]) + ' aria-label="'+
      esc(t('f.listen'))+'"><span class="phkd">'+ICON_SPK+'</span></button>'+
    '</span>';
}
/* What a GROUP of sounds is -- 破裂音, 鼻音 -- said as a thing the mouth does,
   with a few of them heard in a language somebody knows. Not the name:
   「無声両唇破裂音って聞いて普通の人一発で理解できんの？」 And not one of these per
   symbol either: the question was about the heading.

   The examples are drawn from IPA_IN, so a group whose sounds no language
   here has says only what the mouth does, and nothing is invented to fill
   the gap. */
function ipaGroupOf(key){
  if(key.indexOf('m.')===0) return ipaOfManner(key.slice(2));
  if(key==='v') return IPA_VOWS.map(function(v){ return v.s; });
  if(key==='o') return IPA_OTHER.map(function(o){ return o.s; });
  return addedSnd();
}
function ipaGroupWords(key){
  if(key.indexOf('m.')===0) return t('ipa.d.m.'+key.slice(2));
  if(key==='v') return t('ipa.d.vows');
  if(key==='o') return t('ipa.d.other');
  return t('ipa.d.mine');
}
function ipaGroupName(key){
  if(key.indexOf('m.')===0) return t('ipa.m.'+key.slice(2));
  if(key==='v') return t('ipa.vows');
  if(key==='o') return t('ipa.other');
  return t('ipa.mine');
}
function openIpaG(key){
  var rows=[], syms=ipaGroupOf(key), i, j, heard;
  for(i=0;i<syms.length && rows.length<6;i++){
    heard=ipaIn(syms[i]);
    for(j=0;j<heard.length && j<2 && rows.length<6;j++)
      rows.push([syms[i], heard[j][0], heard[j][1]]);
  }
  openForm('ipad:'+key, ipaGroupName(key),
    '<div class="ipadw">'+esc(ipaGroupWords(key))+'</div>'+
    (rows.length? '<div class="ipadl">'+rows.map(function(r){
      return '<div class="ipadr">'+
        '<button class="ipads"' + DO('sayPh', [[r[0]]]) + ' aria-label="'+
          esc(t('f.listen'))+'">'+esc(r[0])+'</button>'+
        '<span class="ipadn">'+esc(LANG[r[1]]? LANG[r[1]].label : r[1])+'</span>'+
        '<span class="ipadx">'+esc(r[2])+'</span></div>';
    }).join('')+'</div>' : ''));
}
FORM_OPEN.ipad=function(a){ openIpaG(String(a||'')); };
/* Shut, and opened one at a time. Ten headings and a hundred and sixty tiles
   were one screen you scrolled past to reach anything.
   「全部開かないで最初>とかで蛇腹にして開いたら見えるように」

   The language's own is the one that starts open: it is short, and on the
   page a letter opens it is where that letter's sound already is.

   A search opens whatever matched. Otherwise typing into it would answer with
   a column of headings, which is the one thing it must not do. */
var ipaOpen={mine:1};
function ipaShut(key){ return !ipaQ && !ipaOpen[key]; }
function ipaToggle(key){
  if(ipaOpen[key]) delete ipaOpen[key]; else ipaOpen[key]=1;
  ipaPaint();
}
function ipaGroupHTML(key, head, list, act, on){
  var hit=list.filter(ipaHit);
  if(!hit.length) return '';
  return '<div class="ipahr">'+
    '<button class="ipah'+(ipaShut(key)?'':' on')+'"' + DO('ipaToggle', [key]) + '>'+
      esc(head)+'</button>'+
    /* The same badge as the speaker on a tile: one circle, 22px of ink in a
       44pt target, and it sits beside the thing it is about rather than
       floated to the far edge. Two shapes for two questions in one app is
       what this is not. 「⚪︎？で統一しろ」 */
    '<button class="phks ipaq"' + DO('openIpaG', [key]) + ' aria-label="'+
      esc(t('help.q'))+'"><span class="phkd">?</span></button>'+
    '<span class="ipan">'+hit.length+'</span></div>'+
    (ipaShut(key)? '' :
     '<div class="phkeys">'+hit.map(function(sym){
       return ipaTiles(sym, act, on); }).join('')+'</div>');
}
/* The manners are read off IPA_CONS rather than written out here, so a manner
   added to the chart is a heading on this page the same day. */
function ipaManners(){
  var out=[], i;
  for(i=0;i<IPA_CONS.length;i++)
    if(out.indexOf(IPA_CONS[i].m)<0) out.push(IPA_CONS[i].m);
  return out;
}
function ipaOfManner(m){
  return IPA_CONS.filter(function(c){ return c.m===m; }).map(function(c){ return c.s; });
}
function ipaGroupsHTML(act, on){
  return ipaGroupHTML('mine', t('ipa.mine'), addedSnd(), act, on)+
    ipaManners().map(function(m){
      return ipaGroupHTML('m.'+m, t('ipa.m.'+m), ipaOfManner(m), act, on);
    }).join('')+
    ipaGroupHTML('v', t('ipa.vows'), IPA_VOWS.map(function(v){ return v.s; }), act, on)+
    ipaGroupHTML('o', t('ipa.other'), IPA_OTHER.map(function(o){ return o.s; }), act, on);
}
function ipaPickHTML(act, on){
  on=on||[];
  return '<div class="search"><span class="lens">'+ICON_LENS+'</span>'+
    '<input id="ipa-q" value="'+esc(ipaQ)+'"' + IN('ipaSetQ') + '></div>'+
    '<div id="ipa-list" data-act="'+esc(act)+'" data-on="'+esc(on.join(' '))+'">'+
    ipaGroupsHTML(act, on)+'</div>';
}
var sndFor='';
function openSnd(lid){
  var l=ltById(lid);
  if(!l) return;
  sndFor=lid;
  openForm('snd:'+lid, ltName(l)||t('lt.untitled'),
    ipaPickHTML('ltTakeSnd', l.snd||[]));
}
FORM_OPEN.snd=function(lid){ openSnd(lid); };
/* Pressed on the chart, on the proposal, anywhere a symbol is shown in that
   sheet. A sound the letter does not read yet joins it, and joins the
   language if it was not in it -- a letter reading a sound the inventory
   has never heard of is the one state the spelling engine cannot hold. */
function ltTakeSnd(sym){
  var l=ltById(sndFor);
  if(!l) return;
  if(!l.snd) l.snd=[];
  var i=l.snd.indexOf(sym);
  if(i>=0) l.snd.splice(i, 1);
  else{
    l.snd.push(sym);
    if(addedSnd().indexOf(sym)<0){ SND=asOrder(addedSnd().concat([sym])); saveSnd(); }
  }
  /* Chosen, not guessed -- so renaming the letter leaves this alone. It is the
     one thing that tells the app's reading of a name apart from an answer. */
  l.chose=1;
  saveLetters(); installScriptFont(); sayOne(sym);
  openSnd(sndFor);
}
/* ---- the sounds a language is built from --------------------------------
   「音韻を細かく決めたい人だっているだろ。plusで復活」

   There was a chapter here and it was closed, because a sound belonged to a
   letter and two pages for one fact is one page too many. That is still true
   and this is not that page: what was closed was a place to give a LETTER its
   sound, which is done on the letter. This is the inventory as a thing in
   itself -- every sound the language has, and which letters say it -- which
   is the question a phonology is, and which no letter can answer alone.

   Plus's. On free the inventory is filled in as letters are named and nobody
   is asked, so a page of it would be a page of the app's own guesses with
   nothing to do on it. 「plus以外はもう音も文字も決まってる状態」

   Nothing here is new data. SND has been the ninth slice since the chapter
   closed, because the spelling engine reads it; it stopped being a place you
   go, and this is that place again. */
function sndLetters(sym){
  var out=[], i, l;
  for(i=0;i<LETTERS.length;i++){
    l=LETTERS[i];
    if(l.snd && l.snd.indexOf(sym)>=0) out.push(l);
  }
  return out;
}
/* One sound, and who says it. A sound no letter reads is not an error -- it
   is a phonology somebody is partway through writing, and the whole reason
   this page is separate from the letters.

   THE LETTERS ARE NOT BUTTONS. This page can put a sound into the language
   and take one out, and it cannot join a sound to a letter -- that is the
   letter's, in one place, and it is the reason the old sound chapter was
   closed. Two directions for one fact is exactly the mess that was.
   「音に文字つけて文字にも音つけられたら訳わからなくなるだろ」

   So they are shown, because "which letters say this" is the question a
   phonology asks, and they are not pressed. */
/* The alphabet is where a sound is now seen and taken out -- sndCell above.
   What was here was a row per sound with the letters that say it beside it,
   on a chapter of its own, which is the same pair the letters page already
   shows from the other end. 「音から文字と文字から音の二重をどうにかしろ」 */
/* The whole chart, to put a sound into the language before any letter says
   it. The same chart a letter opens; what differs is what a press does. */
function openSndAdd(){
  sndFor='';
  openForm('sndadd', t('snd.add'), ipaPickHTML('sndTake', addedSnd()));
}
FORM_OPEN.sndadd=function(){ openSndAdd(); };
/* Taking one out of the inventory. It refuses while a letter still reads it:
   a letter reading a sound the inventory has never heard of is the one state
   the spelling engine cannot hold, and this is the door that would make one.
   The letters that say it are named, so there is something to do about it
   rather than a refusal to argue with. */
function sndDrop(sym){
  var ls=sndLetters(sym), i;
  if(ls.length){
    toast(t('snd.inuse', ls.map(function(l){ return ltName(l)||'·'; }).join(' ')));
    return;
  }
  i=SND.indexOf(sym);
  if(i<0) return;
  SND.splice(i, 1);
  saveSnd(); render();
}
/* ---- II. letters ------------------------------------------------------
   The alphabet, as a thing in itself. Every letter you have, what it reads,
   and the letters that read nothing yet -- which is the case the old model
   could not hold at all, and the reason the two are two chapters. */
/* The three kinds a letter can be, as the chapter's contents. They were one
   page with three lists on it, which is fine at three letters each and
   unreadable at forty. 「文字の一覧をアルファベット>記号>数字>とかにして中で
   見れるようにして」 */
var LT_KINDS=['alpha', 'mark', 'num'];
var LT_KIND={alpha:'lt.all', mark:'lt.marks', num:'num.h'};
/* Which of the three the chapter shows a door to. A digit is a letter you
   add and give a value to, and the free plan adds nothing -- so on free the
   room would be empty forever and there would be no way to put anything in
   it. A room like that is worse than no room. */
/* The three rooms. All three, on every plan.
   This used to hand the free plan a shorter list, because free could not make
   a digit and a room you can never put anything in is worse than no room.
   Free has digits now -- ltStart gives it one for every value the base has --
   so the two lists became the same list, and a capability whose two answers
   are identical is a price with nothing behind it. What free still cannot do
   is ADD a letter, which is can('letters') and is asked at the foot of the
   room. */
function ltKinds(){ return LT_KINDS; }
/* Which of the three a letter is. A kind is not stored on a letter -- it is
   read off what the letter is -- so this and ltOfKind() below are the one
   split seen from its two ends, and they sit together so they cannot answer
   differently. */
function ltKindOf(l){
  if(!l) return '';
  if(numIsDigit(l)) return 'num';
  if(ltIsMark(l)) return 'mark';
  return 'alpha';
}
function ltOfKind(k){
  /* Digits and marks keep their own list functions because each has an order
     of its own -- a digit's is its value. The alphabet is everything else,
     and says so by asking ltKindOf rather than restating the two tests. */
  if(k==='num') return numDigits();
  if(k==='mark') return ltMarks();
  return ltOrder(LETTERS.filter(function(l){ return ltKindOf(l)==='alpha'; }));
}
function ltKindRow(k){
  return '<button class="trow"' + DO('go', ["ltset", k]) + '>'+
    '<span class="rn"></span><span class="rt">'+esc(t(LT_KIND[k]))+'</span>'+
    '<span class="lead"></span><span class="rv">'+ltOfKind(k).length+'</span>'+ICON_GO+'</button>';
}
function vLetters(){
  return '<div class="view">'+
    navTop()+
    '<div class="body">'+
    (wsHasMarks()
      ? '<button class="trow"' + DO('go', ["abugida"]) + ' style="margin-top:6px">'+
          '<span class="rn"></span><span class="rt">'+esc(t('ab.title'))+'</span>'+
          '<span class="lead"></span><span class="rv">'+wsCons().length+' × '+wsVows().length+'</span>'+ICON_GO+'</button>'
      : '')+
    '<div class="toc">'+ltKinds().map(ltKindRow).join('')+'</div>'+
    '</div></div>';
}
/* One of the three. The base belongs on the digits page and nowhere else,
   because that is the page it decides the shape of. */
/* The alphabet, as many letters as there are. A letter is its shape and what
   it is called and nothing else, in a cell the width of a shape -- so seven
   letters and seventy read the same way and neither costs a scroll per letter.

   It was a list of rows: the shape, the name, the reading in red when it
   clashed, and a speaker, each row a thumb high. 「この並び方増えたとき困るから、
   G N O L みたいにもう文字とアルファベットだけ並べて何個でもいけるように」

   Above it was a strip of the same letters at a larger size, so every letter
   was on the screen twice. The cell is the specimen now.

   Holding a letter picks it up and moving it sets the alphabet's order --
   ltDragMount, in www/letters.js, over ltOrder. */
/* Which order the cells are in, and which of them are shown. An alphabet of
   seven is a glance and an alphabet of two hundred is a search, and until now
   there was one order -- the one somebody dragged them into -- and no way to
   ask "which of these have I not drawn yet".
   「これ並び替え、絞り込み追加しよう。アルファベット順、作成順とか」

   Where you are standing in the alphabet, not something the language holds:
   viewReset() drops both, so arriving in another language does not arrive
   with a filter on. */
var LT_SORTS=['own','abc','new'], LT_FILS=['all','drawn','blank','nosnd'];
var ltSort='own', ltFil='all';
function setLtFil(k){ if(LT_FILS.indexOf(k)>=0){ ltFil=k; openLtView(); render(); } }
/* `new` is the order they were made in, which is the order they are IN --
   LETTERS is appended to and never re-sorted, so its own index is the answer
   and no letter needs a date written on it to say so. */
function ltSortList(list){
  if(ltSort==='abc') return list.slice().sort(function(a, b){
    var ka=ltAbcKey(a), kb=ltAbcKey(b);
    return ka<kb? -1 : ka>kb? 1 : 0;
  });
  if(ltSort==='new') return list.slice().sort(function(a, b){
    return LETTERS.indexOf(a)-LETTERS.indexOf(b);
  });
  return list;
}
function ltDrawn(l){ return !!((l.st && l.st.length) || l.ch); }
function ltFilList(list){
  if(ltFil==='drawn') return list.filter(ltDrawn);
  if(ltFil==='blank') return list.filter(function(l){ return !ltDrawn(l); });
  if(ltFil==='nosnd') return list.filter(function(l){ return !ltUnits(l).length; });
  return list;
}
/* One row, and it opens a screen. It was two rows of round chips -- the shape
   CLAUDE.md forbids by name, written by the one thing that had read it.
   Choosing is a screen and changing is the screen you arrive at. */
/* The same row the dictionary has, because it is the same question asked of
   a different list: which of them, and in what order. One shape, both places.
   「並び替えは単語画面と同じようにして」 */
function ltViewRow(){
  return '<div class="wfilrow">'+
    '<button class="wfil"' + DO('openLtView') + '>'+
      '<span class="wfilv">'+esc(t('lt.fil.'+ltFil))+'</span>'+ICON_GO+'</button>'+
    '<button class="wsrt"' + DO('nextLtSort') + '>'+ICON_SORT+
      esc(t('lt.sort.'+ltSort))+'</button>'+
    '</div>';
}
/* The order steps to the next one. Three of them and a button that says which
   it is on -- the dictionary's has two and works the same way. */
function nextLtSort(){
  ltSort=LT_SORTS[(LT_SORTS.indexOf(ltSort)+1) % LT_SORTS.length];
  render();
}
function ltViewPick(names, now, act, pre){
  return names.map(function(x){
    return '<button class="set"' + DO(act, [x]) + '>'+
      '<span class="sl">'+esc(t(pre+x))+'</span>'+
      '<span class="sv">'+(x===now? ICON_TICK : '')+'</span></button>';
  }).join('');
}
function openLtView(){
  openForm('ltview', t('lt.fil'), ltViewPick(LT_FILS, ltFil, 'setLtFil', 'lt.fil.'));
}
FORM_OPEN.ltview=function(){ openLtView(); };
function vLtset(){
  var k=here().a;
  if(LT_KINDS.indexOf(k)<0) k='alpha';
  var all=ltOfKind(k), loose=ltLoose();
  /* A digit's place is its value and a mark's is its own; only the alphabet
     is a thing somebody arranges, so only the alphabet is asked about. */
  var pick=(k==='alpha'), list=pick? ltFilList(ltSortList(all)) : all;
  /* Dragging writes the order down, so it is offered only while the order
     shown IS that order: dropping a letter into place under a different sort
     would write a number nothing on screen agrees with. ltDragMount looks for
     this id and finds nothing under any other sort. */
  var gid=(pick && ltSort==='own' && ltFil==='all')? 'ltgrid' : 'ltgrid-ro';
  return '<div class="view">'+
    navTop('',
           ltWob
             ? '<button class="navq navdone"' + DO('ltWobEnd') + '>'+esc(t('kb.done'))+'</button>'
             : '')+
    '<div class="body">'+
    (pick? ltViewRow() : '')+
    /* How many digits there are is what the base IS, and this is the room
       that holds them -- so it is decided here rather than on the writing
       screen, where the kind of writing and the direction live and this is
       neither, and rather than on the counting stage, where it would be a
       second place saying the same thing about the same letters. */
    (k==='num'? numBaseRows() : '')+
    /* The letters, and after them a cell for every sound of the language that
       no letter says yet. One page for the pair, rather than a chapter for
       each end of it. Only on the alphabet, and only where the filter is not
       narrowing the page to something else. */
    (function(){
      var free=(pick && ltFil==='all')? sndLoose() : [];
      if(!list.length && !free.length) return '<div class="note">'+t('lt.none')+'</div>';
      return '<div class="ltgrid'+(ltWob? ' held':'')+'" id="'+gid+'" data-k="'+esc(k)+'">'+
        list.map(function(l){ return ltCell(l, ''); }).join('')+
        free.map(function(sym){ return sndCell(sym, ltWob && can('snd')); }).join('')+
        '</div>';
    }())+
    ((k==='alpha' && loose.length)
      ? '<div class="mini" style="margin-top:10px">'+tn('lt.loose', loose.length)+'</div>' : '')+
    /* At the foot of the screen: a grid that grows is a grid you would have
       to scroll to the end of to add to. The free alphabet does not grow --
       the twenty-eight are there from the first second and drawing on them
       is the whole of it -- so there is nothing at the foot of it. */
    /* Two ways to add, and they are two different things: a letter, which is
       a shape to draw, and a sound, which is a thing the language says and
       may not have a shape yet. The sound is the phonology chapter's only
       remaining door, moved here with it. */
    ((can('letters') || (k==='alpha' && can('snd')))
      ? '<div class="barfix">'+
          (can('letters')
            ? '<button class="btn ghost"' + DO('newLetter', [k]) + '>'+
                ICON_ADD+t('lt.new')+'</button>'
            : '')+
          ((k==='alpha' && can('snd'))
            ? '<button class="btn ghost"' + DO('openSndAdd') + '>'+
                ICON_ADD+t('snd.add')+'</button>'
            : '')+
        '</div>'
      : '')+
    '</div></div>';
}
/* One letter: the shape, and under it what the letter is called.

   Red when another letter already reads the same thing -- a font maps one code
   point to one glyph, so the first of them is drawn and the rest are invisible
   without being wrong. The sentence saying which reading is taken is on the
   letter's own page: there is no room for a sentence in a cell, and no reason
   to say it in both places. */
/* A cell says three things and used to say two: the shape, the name, and what
   the letter READS. The reading was a page away, so an alphabet was a wall of
   names with no way to see which sound each of them was for -- and on a
   language that has taken a sound nobody has drawn yet, the cell for it is a
   reading with no name and no shape at all. 「この文字のページにzとかの横に
   読み方書いといて」 */
function ltCell(l, press){
  var nm=ltName(l)||'', rd=ltUnits(l), sa, wob=ltWob && !press;
  sa=nm || (rd.length? phIpa(rd) : t('lt.reads.none'));
  /* While the alphabet is held, a cell does not open: what a press is FOR in
     this state is the corner mark, and a letter that opened its own page from
     under a wobble would be two answers to one press. The same sentence
     kbHTML makes about a key.

     The mark is only there where a letter can actually go. The free
     twenty-eight ARE the alphabet -- a, b, c and the two marks -- and taking
     one away would leave the free keyboard with a key that answers to
     nothing, which is why can('letters') guards the letter's own page too.
     Free still wobbles, because the ORDER is theirs. */
  return '<button class="ltc'+(ltTaken(l)? ' dup':'')+(wob? ' wob':'')+
    (numOver(l)? ' over':'')+
    '" data-id="'+esc(l.id)+'"'+
    (press || (wob? '' : DO('go', ["letter", l.id]))) + ' aria-label="'+esc(sa)+'">'+
    '<span class="ltcf">'+ltInk(l, '<span class="nol">'+ICON_PEN+'</span>')+'</span>'+
    '<span class="ltcn">'+esc(nm||'\u00b7')+'</span>'+
    '<span class="ltcr">'+esc(rd.length? phIpa(rd) : '')+'</span>'+
    ((wob && can('letters'))
      ? '<span class="ltx"' + DO('ltDelete', [l.id]) + ' role="button" '+
        'aria-label="'+esc(t('glyph.del'))+'">'+ICON_MINUS+'</span>'
      : '')+
    /* And the way to hear it, at the other corner of the same press. Only
       while the alphabet is at rest -- held, that corner is the mark that
       takes the letter away, and two things at one corner is one of them
       being pressed by mistake. A letter that reads nothing has nothing to
       play. 「この画面も音聞けたら最高やね」 */
    ((!wob && !press && rd.length && ltHasSound(l))
      ? '<span class="ltsay"' + DO('sayPh', [rd]) + ' role="button" '+
        'aria-label="'+esc(t('f.listen'))+'">'+
        '<span class="phkd">'+ICON_SPK+'</span></span>'
      : '')+
    '</button>';
}

/* Sounds of the language that no letter says yet. The alphabet and the
   inventory were two chapters showing the same pair from opposite ends --
   the letter's page said what it reads, and the phonology page said what
   reads it. 「音から文字と文字から音の二重をどうにかしろ」「文字+音のページに
   すればいいやん」 So there is one page: the letters, and beside them a cell
   for each sound still waiting for one. Pressing it draws the letter that
   says it; held, its mark takes the sound out of the language.

   It is a cell in the same grid rather than a list below, because it is the
   same thing at an earlier moment. It carries no `data-id`, which is what
   ltDown and ltOrderKids read to know it is not in the alphabet. */
function sndCell(sym, wob){
  return '<button class="ltc lt0'+(wob? ' wob':'')+'" data-snd="'+esc(sym)+'"'+
    (wob? '' : DO('ltForUnitGo', [sym])) + ' aria-label="'+esc(sym)+'">'+
    '<span class="ltcf"><span class="nol">'+ICON_PEN+'</span></span>'+
    '<span class="ltcn">\u00b7</span>'+
    '<span class="ltcr">'+esc(phIpa([sym]))+'</span>'+
    (wob
      ? '<span class="ltx"' + DO('sndDrop', [sym]) + ' role="button" '+
        'aria-label="'+esc(t('snd.drop'))+'">'+ICON_MINUS+'</span>'
      : '<span class="ltsay"' + DO('sayPh', [[sym]]) + ' role="button" '+
        'aria-label="'+esc(t('f.listen'))+'">'+
        '<span class="phkd">'+ICON_SPK+'</span></span>')+
    '</button>';
}
/* Which sounds those are: in the language, and on no letter. */
function sndLoose(){
  return addedSnd().filter(function(sym){ return !sndLetters(sym).length; });
}
/* Pressing one makes the letter that says it and opens it to be drawn --
   which is what a cell with a pen on it says it will do. */
function ltForUnitGo(sym){
  var l=ltForUnit(sym);
  if(l) go('letter', l.id);
}
/* One letter: its name, whether it reads a sound or is a mark, what it reads,
   the character it borrows instead of a drawing, and a way to be rid of it.

   It used to be a grid of every unit in the writing system with ticks on the
   ones this letter reads, which asks somebody to work in IPA to say a thing
   they already know how to spell. The field takes what they would write --
   k, sh, ng, ka -- and more than one, separated by spaces, for a letter that
   reads more than one thing. The IPA under it is what the app made of that,
   shown rather than chosen.

   The rest of this was on the drawing screen, which made that screen scroll
   and made this one a second place to say the same thing. Drawing is drawing;
   this is the letter. */
/* The one field: what this letter is in the alphabet. Red when another letter
   already says the same thing -- shown, not refused, because c and k are two
   letters and one sound and a language being built is allowed to be halfway
   through. The same field is the onboarding's second step, so it is written
   once and the caller says which letter it is for.

   It types into a draft and the caller's button writes it: the letter page's
   Save, and the onboarding's Next. The red line is about what the letter IS,
   so it answers to the saved name and not to the one being typed. */
function ltAbField(l, id){
  var dup=ltDupOf(l);
  return '<div class="field"><input id="lt-rom" value="'+esc(ltDraftAb(l))+'" '+
    'class="'+(dup? 'dup':'')+'" placeholder="'+esc(t('lt.reads.ph'))+'" '+
    'autocapitalize="none" autocorrect="off" spellcheck="false"' +
    IN('ltDraftName', [id]) + '></div>'+
    (dup? '<div class="ltdup">'+esc(t('lt.dup', dup))+'</div>' : '');
}
/* One letter of the alphabet, opened from the list. Not where an alphabet is
   made -- that is the list, which has the button that adds one -- and there
   are only three things to do to a letter that already exists: change what it
   says, draw it again, or take an existing character instead.
   「そこは文字の書き直しor既存文字から選ぶor音変えるくらいしか無いだろ」

   It used to open with a Name field nobody had been told the purpose of, under
   a heading that repeated the name of the list behind it, over a section
   called Letter holding three buttons that each said Letter -- one of which
   said "create" and redrew this one. */
function vLetter(){
  var lid=here().a, l=ltById(lid);
  if(!l) return viewGone();
  return '<div class="view">'+navTop('')+'<div class="body">'+
    /* The letter itself, first and big. A page about one letter that does not
       show it is a page of three buttons about nothing, and "draw it again"
       on a screen with nothing on it says nothing. A letter with no shape yet
       gets the pen, which is what it wears everywhere else. */
    /* The letter itself, and pressing it is how it gets drawn. There was a
       pen sitting on it that did nothing and a button underneath saying the
       same thing in words. 「上にペンマークあるのに文字を書くもある。ペンマーク
       押しても反応しない」 */
    '<button class="spbig"' + DO('editLetter', [lid]) + '>'+
      ltInk(l, '<span class="nol">'+ICON_PEN+'</span>')+'</button>'+
    /* What the letter is called. Not on the free plan: the twenty-eight are
       a, b, c and the two marks, and that is what makes the free keyboard a
       QWERTY that works -- a key is found by the letter's name. Renaming one
       would take the key away and leave a hole nothing could fill. */
    /* The name, and not on a letter every language starts with: the free
       keyboard finds its keys by name, so renaming one takes the key away.
       ltIsBase() in letters.js is the one place that says which those are,
       and ltCopy below is what somebody wanting a differently-named letter
       does instead. */
    ((can('letters') && !ltIsBase(l))
      ? '<div class="sec">'+t('lt.ab.h')+'</div>'+ltAbField(l, lid)
      : '')+
    (numIsDigit(l)? numWordRow(l) : '')+
    /* What it sounds like, and the way to change it. It was a line of text
       reporting the sound, and the sound was set on a chapter of its own two
       screens away. 「アルファベットのページから音を変更するボタン押して変更でき
       るようにして」 */
    '<button class="set" style="border-bottom:none"' + DO('openSnd', [lid]) + '>'+
      '<span class="sl">'+t('toc.sound')+'</span>'+
      '<span class="sv">'+(numIsDigit(l)
        ? esc(t('num.h'))
        : ltUnits(l).length
          ? (ltHasSound(l)? '/'+esc(l.snd.join('/'))+'/' : esc(l.snd.join(' ')))
          : esc(t('lt.reads.none')))+'</span>'+ICON_GO+'</button>'+
    /* What the letter MEANS, for the writing systems where it means something.
       A logography's letter is a word, and a word has a sense that no sound
       and no name can carry; a syllabary's letter may be a name somebody
       wants to remember. It is free text and the app never reads it -- it is
       the person's note about their own letter.
       「標語文字の人は意味を持たせたいだろうから、メモ欄追加してもいいかも」 */
    '<div class="sec">'+t('lt.note')+'</div>'+
    lnField('lt-nt', '', IN('ltSetNote', [lid]), l.nt||'', 'ntin')+
    (l.ch
      ? '<div class="gborrow" style="margin-top:8px"><span class="gbch">'+esc(l.ch)+'</span>'+
        '<span class="gbl">'+t('glyph.borrowed')+'</span>'+
        '<button class="gbx"' + DO('ltDropChar', [lid]) + '>'+t('ch.clear')+'</button></div>'
      : '<button class="btn ghost" style="width:100%;margin-top:8px"' + DO('openPick', [lid]) + '>'+
        t('glyph.borrow')+'</button>')+
    /* Making one of one's own from this one -- the way to have a letter
       called something else when this one may not be renamed, and the way to
       have two letters of one shape at all. */
    (can('letters')
      ? '<button class="set" style="margin-top:14px"' + DO('ltCopy', [lid]) + '>'+
          '<span class="sl">'+t('lt.copy')+'</span>'+ICON_GO+'</button>'
      : '')+
    (can('letters')
      ? '<button class="set" style="border-bottom:none"' + DO('ltDelete', [lid]) + '>'+
          '<span class="sl bad">'+t('glyph.del')+'</span></button>'
      : '')+
    '</div>'+
    /* At the foot of the screen, on top of the tab bar, where the drawing
       screen's Save already is -- and in reach without scrolling past the
       sound, the borrowed character and the way to delete the letter.

       It saves the name, so on the free plan, where there is no name to
       type, there is nothing for it to do. The drawing has its own Save on
       the screen it is drawn on. */
    (can('letters')
      ? '<div class="barfix"><button class="btn"' + DO('ltSave', [lid]) + '>'+
          t('glyph.save')+'</button></div>'
      : '')+
    '</div>';
}
