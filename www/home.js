/* Lingua — the cover, the table of contents, the writing system (chapter 6)
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

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
  if(can('words')) return '';
  var left=FREE_LIMIT-WORDS.length;
  if(left>20 || left<0) return '';
  return '<button class="capwarn"' + DO('go', ["plans"]) + '>'+t('cap.warn', left)+
    '<span class="capgo">'+t('up.cta')+ICON_GO+'</span></button>';
}

/* ---- the book's contents, once -----------------------------------------
   Its name, where it goes, how much of it there is, and whether there is any
   of it at all. Its numeral is not on it: that is tocNum() below, counted.
   The contents page reads this and so does the header of every chapter it
   names and so does the card on the cover -- which used to be a ladder of
   four hand-written
   sentences saying the same thing in its own words, including one that told
   people to coin words out of their sounds. 「音から単語生成するやついない
   だろってほんまにゴミみたいなこと書くなよ一本化しろ」

   A chapter's name is what the card says now. It is already written, already
   translated into ten languages, and already the word on the row you land
   on. */
/* Which chapter this is, counted rather than written down.

   It used to be written down twice: an `n` on every row here, and an `n` on
   every route in PAGES, because the header of a chapter shows its numeral
   too. Both were right on the day they were typed. Then the sound chapter
   was closed and the keyboard became a chapter, and only this list was
   renumbered -- so the contents said I Letters and the letters page said
   II Letters, the contents said II Lexicon and the page said III, and so on
   down all five, with the keyboard showing no numeral at all. Every check
   passed: both places had a numeral, and nothing in the app compared them.

   A numeral is not a fact about a chapter, it is the chapter's position in
   this list. Counted from the list it cannot disagree with the list, and
   there is nothing left for a check to hold. */
var TOC_N=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
function tocNum(r){
  var rows=tocRows(), i;
  for(i=0;i<rows.length;i++) if(rows[i].r===r) return TOC_N[i]||'';
  return '';
}
function tocRows(){
  return [
    {k:'toc.letters', r:'letters', v:ltShaped(),
     txt:LETTERS.length? (ltShaped()+' / '+LETTERS.length) : '—'},
    {k:'toc.words',   r:'words',   v:WORDS.length,
     txt:WORDS.length? tn('count.words', WORDS.length) : '—'},
    {k:'toc.gram',    r:'gram',    v:stCount(),
     txt:stCount()+' / '+stAll().length},
    {k:'toc.notes',   r:'notes',   v:NOTES.length,
     txt:NOTES.length? tn('count.notes', NOTES.length) : '—'},
    /* The keyboard is a chapter now rather than a button at the foot of the
       alphabet. It stopped being a thing the alphabet has when it stopped
       being something you type on in here: what it is is the layout of the
       keyboard on the PHONE, which is a made thing of its own beside the
       letters and the words.

       It is here on the free plan too, saying what it is, because the row is
       numbered and a numbered row that appears when you pay renumbers the
       book under somebody who already knew where things were.

       The count is the count on every plan. It said "—" on free, meaning
       "there is none of this", to somebody holding a thirty-key QWERTY made
       of letters they drew. kbKeys() reads kbOf(), which is kbFixed() there,
       so it has always had a true number to give. */
    {k:'kb.title',   r:'kb',     v:0,
     txt:String(kbKeys())}
  ].concat(
    /* The AI conversation is Studio's, and it is the LAST chapter so that not
       having it takes nothing away from anybody's numbering.

       It used to be chapter V, between the notebook and the keyboard, and
       hiding it there would have moved the keyboard from VI to V -- under
       somebody who already knew where things were. The comment above says
       exactly that about the keyboard row and it is the same argument: a
       numbered row that appears when you pay renumbers the book.

       Last, it costs nothing to be absent. Free and Plus read I to V and
       Studio reads I to VI, and every chapter they share has the same number
       on both. Moving it here changes two numbers once, today, and never
       again. 「AI会話のタブ自体freeとplusで消していいな」 */
    can('ai')
      ? [{k:'toc.talk', r:'talk', v:TALK.length,
          txt:TALK.length? tn('count.turns', TALK.length) : '—'}]
      : []);
}

/* =========================================================================
   Writing system. The map is sound -> {ch}; an entry can later carry {svg}
   from the drawing tool without any reader here needing to change.
   ========================================================================= */
/* Sound -> character. The sound is the key because a sound is what a word is
   made of; the character is the clothing you setPlan for it. An entry is a
   plain string today and can become {ch, svg} when glyphs can be drawn. */
/* Which borrowed character writes this unit. It used to be a lookup in a map
   of unit -> character; it is now a question about the letter that writes the
   unit, because a character is one of the two shapes a letter can have. */
function chOf(p){ return ltChar(p); }
/* A sound belongs to the language either because a word already uses it or
   because you said so; before this, only the first way existed. */
/* Dropping a sound unhooks the letters that read it. It does not delete them:
   a letter is a thing you drew and it survives a sound being reconsidered --
   which is the whole point of them being separate.

   There were two of these. This one, on the × of a row in the chapter, and
   sndDrop() on the × of the same sound in the proposal panel a few hundred
   pixels above it -- which spliced the inventory and stopped, leaving every
   letter that read the sound still reading a sound the language no longer
   had. The same act, twice, agreeing about the easy half. */
function dropSnd(p){
  var a=addedSnd(), i=a.indexOf(p);
  if(i>=0){ a.splice(i,1); saveSnd(); }
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
function openForm(key, title, html, mount, right){
  FORM={key:key, title:title, html:html, mount:mount||null, right:right||''};
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
      return viewGone();
  }
  return '<div class="view">'+navTop('', FORM.right)+
    '<div class="body" id="form-body">'+FORM.html+'</div></div>';
}
function formMount(){ if(FORM && FORM.mount) FORM.mount(); }
/* Kept because a dozen save buttons call it. Closing a form is leaving a page. */
function closeSheet(e){
  if(e && e.target && e.target.id!=='sbg') return;
  if(here().r==='form') back();
}
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
    return '<button class="pkch'+(used?' had':'')+(ch===cur?' cur':'')+'"' + DO('ltTakeChar', [pkFor, ch]) + '>'+esc(ch)+'</button>';
  }).join('');
}
function openPick(lid){
  pkFor=lid;
  var l=ltById(lid);
  var cur=(l && l.ch)||'';
  openForm('pick:'+lid, t('ch.for', ltName(l)||t('lt.untitled')),
    '<div class="pkown"><input class="scin own" id="own-ch" maxlength="4" value="'+esc(cur)+'" placeholder="'+esc(t('script.own.ph'))+'" autocomplete="off" '+
      '' + KD('takeOwn') + '>'+
    '<button class="btn"' + DO('takeOwn') + '>'+t('script.set')+'</button></div>'+
    (cur? '<button class="pkclear"' + DO('ltTakeChar', [lid, ""]) + '>'+t('ch.clear')+'</button>':'')+
    '<div class="pktabs">'+WORLD_SCRIPTS.map(function(w){
      return '<button class="pktab'+(w.id===pkScript?' on':'')+'" data-id="'+w.id+'"' + DO('pkSwitch', [w.id]) + '>'+
        '<span class="pkpv">'+esc(w.pv.slice(0,2))+'</span>'+esc(t('ws.'+w.id))+'</button>';
    }).join('')+'</div>'+
    '<div class="pkchars" id="pk-chars">'+pkCharsHTML()+'</div>');
}
FORM_OPEN.pick=function(x){ openPick(x); };
/* pkFor is a letter's id. A borrowed character is one of the two shapes a
   letter can have, so taking one is setting that letter's shape. */
function ltTakeChar(lid, ch){
  ltSetChar(lid, ch);
  SET.showScript=true; save(); installScriptFont();
  if(here().r==='form') back(); else render();
}
function takeOwn(){
  var e=document.getElementById('own-ch'); if(!e) return;
  ltTakeChar(pkFor, e.value);
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
/* Who you are, and then what you are making. It carried neither: a card,
   and under it a cover with the language's name set like a title page, a
   line about what it is for, two counts, a card telling you what to do
   next, and the last word you wrote. 「プロフィール画面ごちゃごちゃしすぎ。
   まずは、プロフィールを載せようよSNS用の。写真 名前 @ 自己紹介。その下に
   作成中の言語、言語の用途とか並べて。次にすることと最後に作成した単語は消して」

   Two things go, and they are the two that were about the app rather than
   about the person: what to do next, and the most recent word. Neither is
   a profile -- they are a home screen's, and this stopped being one. */
/* The profile is where somebody's posts are, which is what a profile IS on
   every timeline there has ever been -- and there was nowhere in this app
   that listed yours. 「SNSのツイートが並ぶページなくね？」

   The whole of the top is half a screen at most, and the three lists start
   under it. It used to be the cover -- `flex:1`, the language's name set
   large in the middle of it, made when this screen was a cover and nothing
   else -- and with the posts under that it took eight tenths of the phone
   before a single one of them. 「プロフィールで画面8割終わってる」

   Nothing was dropped in the shrinking. Every door the cover had is still
   here: the name is still the way to rename the language, the two counts
   still go to the letters and the words, and what the language is for is
   still one press. They are a strip rather than a page. */
var pfTab='posts';
function pfSetTab(k){ pfTab=k; render(); }
/* Which posts each list is. Replies are separated from posts the way every
   timeline does it, because a reply read out of the thread it answers is
   half a sentence. */
function pfList(){
  var mine=postAll().filter(function(p){ return p.mine; });
  if(pfTab==='re')   return mine.filter(function(p){ return !!p.to; });
  if(pfTab==='li')   return postAll().filter(function(p){ return !!p.lime; });
  mine=mine.filter(function(p){ return !p.to; });
  mine.sort(function(a, b){ return (b.pin?1:0)-(a.pin?1:0); });
  return mine;
}
function pfTabs(){
  var tabs=[['posts','prof.posts'], ['re','prof.replies'], ['li','prof.likes']];
  return '<div class="pftabs">'+tabs.map(function(x){
    return '<button class="pftab'+(pfTab===x[0]?' on':'')+'"' + DO('pfSetTab', [x[0]]) + '>'+
      esc(t(x[1]))+'</button>';
  }).join('')+'</div>';
}
function vProfile(){
  var list=pfList();
  return '<div class="view">'+
    '<div class="top"><div class="brand">LIN<span class="st">G</span>UA</div>'+
    '<button class="iconb"' + DO('go', ["settings"]) + ' aria-label="'+esc(t('set.title'))+'">'+ICON_GEAR+'</button></div>'+
    '<div class="body" style="padding-top:0">'+
    meCard()+
    /* The language, as a strip. Four doors and two lines. */
    /* The language, in two lines. It was a cover -- flex:1, the name set large
       in the middle, a bordered card each for the letters, the words and what
       it is for -- and those three cards alone were two hundred pixels. With
       the me block above them the profile ran to eight tenths of the phone
       before a single post. 「プロフィールで画面8割終わってる」

       Every door is still here: the name renames the language, the counts go
       to the letters and the words, and what it is for is one press. They are
       a line of small buttons rather than a page of cards. */
    '<div class="pflang">'+
      /* The name, and nothing beside it. There used to be a reading under it,
         and it was the reading of WORDS[0] -- the first word in the
         dictionary, printed under the language's name as though it were how
         the name is said. 「shangoで音がkanoなのは何？」 A language's name is
         roman text somebody typed; it is not spelled in their letters, so
         there is no reading to give and there never was. */
      '<button class="pfname"' + DO('editName') + '>'+esc(langName||t('home.unnamed'))+
        '<span class="pen">'+ICON_PEN+'</span></button>'+
    '</div>'+
    /* Who follows this person, and who they follow. FOLLOW_SEAM: the two
       numbers are asked for rather than read, so the day they come from
       somewhere else they come from somewhere else HERE and nowhere else. */
    '<div class="pfrow">'+
      '<button class="pfst"' + DO('go', ["follows", "ing"]) + '><b>'+
        esc(String(meFollowing().length))+'</b> '+esc(t('me.following'))+'</button>'+
      '<button class="pfst"' + DO('go', ["follows", "ers"]) + '><b>'+
        esc(String(meFollowers().length))+'</b> '+esc(t('me.followers'))+'</button>'+
    '</div>'+
    '<div class="pfrow">'+
      '<button class="pfst"' + DO('go', ["letters"]) + '><b>'+esc(String(ltShaped()||0))+
        '</b> '+esc(t('toc.letters'))+'</button>'+
      '<button class="pfst"' + DO('go', ["words"]) + '><b>'+esc(String(WORDS.length))+
        '</b> '+esc(t('toc.words'))+'</button>'+
      '<button class="pfst"' + DO('go', ["world"]) + '>'+
        esc(wldSaid()? (wldLine()||t('wld.title')) : t('wld.title'))+ICON_GO+'</button>'+
    '</div>'+
    pfTabs()+
    (list.length? list.map(postRow).join('')
                : '<div class="note">'+esc(t(pfTab==='li'? 'prof.none.li'
                                            : pfTab==='re'? 'prof.none.re' : 'prof.none'))+'</div>')+
    '</div></div>';
}

/* The contents, in the order the work happens: you setPlan sounds, you give
   them letters, and then there is something a word can be made of. */
function vBuild(){

  return '<div class="view">'+
    /* Searching the language is part of building it, so it sits on the
       contents page rather than holding a tab of its own. The bottom bar has
       to be about where you are in the app; this is about what you are
       looking for inside one screen's worth of it. */
    rootTop('build',
      '<button class="iconb"' + DO('go', ["find"]) + ' aria-label="'+
        esc(pageName('find'))+'">'+ICON_LENS+'</button>')+
    '<div class="body" style="padding-top:4px">'+
    capBanner()+
    '<div class="toc">'+tocRows().map(function(row, i){
      return '<button class="trow"' + DO('go', [row.r]) + '>'+
        '<span class="rn">'+(TOC_N[i]||'')+'</span><span class="rt">'+esc(t(row.k))+'</span>'+
        '<span class="lead"></span><span class="rv">'+esc(row.txt)+'</span>'+ICON_GO+'</button>';
    }).join('')+'</div>'+
    /* Settings used to hang off the bottom of the contents. It belongs to the
       person, not to the language, and it is already on the profile where
       everything else of theirs is. 「制作のところに設定ボタンはいらない」 */
    '</div></div>';
}
/* ---- the search tab ---------------------------------------------------
   「なんで下タブはsns用に作ったのにそれすら存在しないゴミデータなの？」

   He is right and it was indefensible. This screen opened on an empty box
   headed "everything you have made" with nothing inside it, and a dashed
   card headed "other people's languages" saying "not open yet" -- a heading
   with no content and a promise with no date, taking up a third of a tab
   that the bottom bar sends you to. A tab has to be worth arriving at.

   It is worth arriving at when it can do something no other screen can. Two
   things only this one does:

     pull from the other end   every word that uses a sound, every word a
                               letter writes -- the dictionary read backwards
     what is still half done   words with no meaning, letters with no sound,
                               sounds nothing writes, stages not finished,
                               each one a row that goes straight to the thing

   And the search box now reaches the whole language, not only the words:
   letters, sounds, notes, the rules you wrote and the lines you wrote to
   show them. Results come back in groups, so a hit in a grammar stage does
   not sit in a list pretending to be a word.

   The gallery card is gone. When there is something to show there it can
   come back; until then the tab does not claim it. */
function vFind(){
  return '<div class="view">'+
    navTop()+
    '<div class="chead">'+
    '<div class="search"><span class="lens">'+ICON_LENS+'</span>'+
    '<input id="f-q" placeholder="'+esc(t('find.ph'))+'" value="'+esc(fq)+'"' + IN('fSetQ') + '>'+
    '<button class="sx" id="f-x"' + DO('clearFq') + ''+(fq?'':' hidden')+
      ' aria-label="'+esc(t('words.clear'))+'">'+ICON_CROSS+'</button></div></div>'+
    '<div class="body" id="f-list">'+findBodyHTML()+'</div>'+
    '</div>';
}
var fq='', fpick=null;

/* ---- reading the dictionary backwards --------------------------------- */
function fWordsWithSnd(sym){
  return WORDS.filter(function(w){ return wPh(w).indexOf(sym)>=0; });
}
function fWordsWithLtr(id){
  var l=ltById(id);
  if(!l) return [];
  var u=ltUnits(l);
  return WORDS.filter(function(w){
    var sp=spOf(w), i, j;
    for(i=0;i<sp.length;i++){
      if(sp[i].l===id) return true;
      for(j=0;j<u.length;j++) if(sp[i].u===u[j]) return true;
    }
    return false;
  });
}
function fPick(kind, key){
  fpick=(fpick && fpick.k===kind && fpick.v===key)? null : {k:kind, v:key};
  fq=''; findPaint();
}
/* A letter as a key, the same shape the sound keys have, because they are
   the same act: press the thing, see what it is in. */
/* The find screen's letter key. Named apart from the word sheet's ltkHTML,
   which is a different button: that one captions with what a letter reads,
   this one with what it is called, because here you are looking for a letter
   rather than spelling with it. They shared a name until 2026 and this file
   loads first, so every key on this screen was drawn by the other one. */
function fLtkHTML(l, call){
  var face='';
  if(l.st && l.st.length) face='<canvas class="pkc" data-l="'+esc(l.id)+'"></canvas>';
  else if(l.ch) face='<span class="pkb">'+esc(l.ch)+'</span>';
  return '<button class="phk'+(face?' hasg':'')+'"'+call+'>'+face+
    '<span class="pks">'+esc(ltName(l)||'\u00b7')+'</span></button>';
}

/* ---- what is still half done ------------------------------------------
   Every count here is a real query over real data, and every row lands on
   the screen where the thing gets finished. A count of zero shows nothing:
   a list of what you have already done is not a list of what to do. */
function fTodo(){
  var out=[];
  var noMn=WORDS.filter(function(w){ return !wMns(w).length; }).length;
  var noSnd=LETTERS.filter(function(l){ return ltHasShape(l) && !ltUnits(l).length; }).length;
  var noLt=addedSnd().filter(function(x){ return !ltStrokes(x) && !ltChar(x); }).length;
  var stg=stAll().filter(function(p){ return !stIsDone(p); }).length;
  if(noMn) out.push([t('find.todo.mn'), noMn, 'words']);
  if(noSnd) out.push([t('find.todo.lt'), noSnd, 'letters']);
  if(noLt) out.push([t('find.todo.sn'), noLt, 'letters']);
  if(stg) out.push([t('find.todo.st'), stg, 'gram']);
  return out;
}

/* ---- searching the whole language -------------------------------------- */
function fHits(qq){
  var g={w:[], l:[], s:[], n:[], r:[]};
  g.w=WORDS.filter(function(w){ return srcKey(w).indexOf(qq)>=0; })
    .sort(function(a,b){ return String(a.hw).localeCompare(String(b.hw)); });
  g.l=LETTERS.filter(function(l){
    return (ltName(l)+' '+(l.ch||'')+' '+ltUnits(l).join(' ')).toLowerCase().indexOf(qq)>=0; });
  g.s=addedSnd().filter(function(x){ return String(x).toLowerCase().indexOf(qq)>=0; });
  g.n=[];
  NOTES.forEach(function(n,i){
    if((String(n.t||'')+' '+String(n.b||'')).toLowerCase().indexOf(qq)>=0) g.n.push({i:i, n:n}); });
  g.r=[];
  stAll().forEach(function(p){
    var body=stRules(p.id)+' '+stEx(p.id).map(function(e){
      return (e.lb||'')+' '+(e.ln||'')+' '+(e.gl||''); }).join(' ');
    var hay=(stTitle(p)+' '+body).toLowerCase();
    if(hay.indexOf(qq)>=0) g.r.push({p:p, body:body.trim()});
  });
  return g;
}
function fSec(label, n){ return '<div class="sec">'+esc(label)+(n?' '+n:'')+'</div>'; }
function fRow(title, val, call){
  return '<button class="trow"'+call+'><span class="rn"></span>'+
    '<span class="rt">'+esc(title)+'</span><span class="lead"></span>'+
    (val!==''? '<span class="rv">'+esc(String(val))+'</span>' : '')+ICON_GO+'</button>';
}
function findBodyHTML(){
  var qq=String(fq||'').trim().toLowerCase();
  if(qq) return fResultsHTML(qq);
  if(fpick) return fPickedHTML();
  return fRestHTML();
}
function fResultsHTML(qq){
  var g=fHits(qq), out='', total=g.w.length+g.l.length+g.s.length+g.n.length+g.r.length;
  if(!total) return '<div class="empty"><div class="eb">'+t('words.nomatch')+'</div></div>';
  if(g.w.length) out+=fSec(t('toc.words'), g.w.length)+g.w.map(function(w){ return entryHTML(w, false); }).join('');
  if(g.l.length) out+=fSec(t('toc.letters'), g.l.length)+
    '<div class="phkeys">'+g.l.map(function(l){
      return fLtkHTML(l, DO('fPick',['l', l.id])); }).join('')+'</div>';
  if(g.s.length) out+=fSec(t('toc.sound'), g.s.length)+
    '<div class="phkeys">'+g.s.map(function(x){
      return phkHTML(x, DO('fPick',['s', x])); }).join('')+'</div>';
  if(g.n.length) out+=fSec(t('toc.notes'), g.n.length)+g.n.map(function(h){
      return fRow(h.n.t||t('note.untitled'), '', DO('openNote',[h.i])); }).join('');
  if(g.r.length) out+=fSec(t('toc.gram'), g.r.length)+g.r.map(function(h){
      return fRow(stTitle(h.p), '', DO('stOpen',[h.p.id])); }).join('');
  return out;
}
/* What a pressed sound or letter is in. */
function fPickedHTML(){
  var hits = fpick.k==='s'? fWordsWithSnd(fpick.v) : fWordsWithLtr(fpick.v);
  var name = fpick.k==='s'? fpick.v : (ltName(ltById(fpick.v))||'');
  return '<button class="trow"' + DO('fPick', [fpick.k, fpick.v]) + '>'+
      '<span class="rn"></span><span class="rt">'+esc(t('find.back'))+'</span>'+
      '<span class="lead"></span></button>'+
    fSec(t(fpick.k==='s'? 'find.hit.snd':'find.hit.lt', name), hits.length)+
    (hits.length? hits.map(function(w){ return entryHTML(w, false); }).join('')
                : '<div class="empty"><div class="eb">'+t('words.nomatch')+'</div></div>');
}
function fRestHTML(){
  var snd=addedSnd(), lt=LETTERS.filter(ltHasShape), todo=fTodo(), out='';
  if(snd.length) out+=fSec(t('find.by.snd'), snd.length)+
    '<div class="phkeys">'+snd.map(function(x){
      return phkHTML(x, DO('fPick',['s', x])); }).join('')+'</div>';
  if(lt.length) out+=fSec(t('find.by.lt'), lt.length)+
    '<div class="phkeys">'+lt.map(function(l){
      return fLtkHTML(l, DO('fPick',['l', l.id])); }).join('')+'</div>';
  out+=fSec(t('find.todo'), todo.length||'');
  out+= todo.length
    ? todo.map(function(r){ return fRow(r[0], r[1], DO('goIn',[r[2]])); }).join('')
    : '<div class="note">'+t('find.todo.no')+'</div>';
  out+=fSec(t('find.in'), '')+fRow(t('set.csv.in'), '', DO('openImport'));
  return out;
}
function findPaint(){
  var el=document.getElementById('f-list');
  if(!el){ render(); return; }
  el.innerHTML=findBodyHTML();
  phkMount();
  var x=document.getElementById('f-x');
  if(x){ if(fq) x.removeAttribute('hidden'); else x.setAttribute('hidden',''); }
}
function fSetQ(v){ fq=v; if(v) fpick=null; findPaint(); }
function clearFq(){
  var e=document.getElementById('f-q');
  fq=''; if(e){ e.value=''; e.focus(); }
  findPaint();
}
/* ---- what the language is for ----------------------------------------
   「世界観とか、物語で使うなら物語用なのか設定できたり」

   A language made for a story is not the same object as a language made to
   be spoken on a Tuesday, and the difference is not decoration: it decides
   what words come first, whether names of places matter more than words for
   weather, and who is supposed to be able to say any of it. Nothing in the
   app knew, so nothing in the app could act on it.

   Four things, all optional and all short: what it is for, where it is
   spoken, who speaks it, and anything else. They live on the cover, because
   that is where what a book is about belongs, and they travel with the
   language, because they are part of it. */
var WORLDS=['story','people','place','real','play'];
/* It is the language's, filed under langKey('wld') exactly as the letters
   and the sounds are. It used to be SET.world -- the PERSON's settings --
   directly under a comment saying it travels with the language, which it did
   not: it was one answer per phone shown on every language's cover, and it
   was in no backup, because a backup is SLICES and SET is not a slice.

   The old one is read once and copied in, and it is left exactly where it
   is. That is langMigrate()'s rule and it is here for langMigrate()'s
   reason: this runs on a phone, against the only copy. */
var WLD={};
function wldRead(){
  WLD={};
  try{ var w=JSON.parse(localStorage.getItem(langKey('wld'))||'null');
       if(w && typeof w==='object' && !(w instanceof Array)) WLD=w; }catch(e){}
}
/* An install from before this is holding its answer in SET, which is the
   person's settings: one answer per phone, shown on every language's cover.
   It is copied into the language that is open, and the old copy is left
   exactly where it is -- langMigrate()'s rule, for langMigrate()'s reason.

   ONCE, and into that one language. A copy that ran on every read put the
   first language's world into the second one the moment it was opened, which
   is a worse lie than the one being fixed -- and it is what the first version
   of this did. SET.wldMoved is the mark that it has happened.

   It runs from boot.js beside the other migrations rather than from wldRead()
   at load, because saving touches the backup and backup.js is loaded after
   this file: called at load it threw, and the world was never written down
   at all. */
function migrateWorld(){
  var o=SET.world, k, got=false;
  if(SET.wldMoved || !o || typeof o!=='object') return;
  for(k in o) if(Object.prototype.hasOwnProperty.call(o,k) && !WLD[k]){ WLD[k]=o[k]; got=true; }
  SET.wldMoved=1;
  if(got) saveWld();
  save();
}
function saveWld(){ bkTouch(); try{ localStorage.setItem(langKey('wld'), JSON.stringify(WLD)); }catch(e){} }
function world(){ return WLD; }
function wldUse(){ var u=world().use; return WORLDS.indexOf(u)>=0? u : ''; }
function wldSetUse(u){ world().use=(wldUse()===u? '' : u); saveWld(); render(); }
function wldSet(k, v){ world()[k]=String(v||''); saveWld(); }
wldRead();
function wldSaid(){
  var w=world();
  return !!(wldUse() || (w.where||'').length || (w.who||'').length || (w.note||'').length);
}
function wldLine(){
  var w=world(), a=[];
  if(wldUse()) a.push(t('wld.'+wldUse()));
  if(w.where) a.push(w.where);
  return a.join(' · ');
}
function vWorld(){
  var w=world();
  return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="sec">'+t('wld.use')+'</div>'+
    '<div class="obscripts one">'+WORLDS.map(function(k){
      return '<button class="obsrow'+(wldUse()===k?' on':'')+'"' + DO('wldSetUse', [k]) + '>'+
        '<span class="obnm">'+esc(t('wld.'+k))+'</span>'+
        '<span class="obws">'+esc(t('wld.'+k+'.d'))+'</span></button>';
    }).join('')+'</div>'+
    '<div class="sec">'+t('wld.where')+'</div>'+
    '<div class="field"><input id="wld-where" value="'+esc(w.where||'')+'" '+
      'placeholder="'+esc(t('wld.where.ph'))+'"' + IN('wldSet', ["where"]) + '></div>'+
    '<div class="sec">'+t('wld.who')+'</div>'+
    '<div class="field"><input id="wld-who" value="'+esc(w.who||'')+'" '+
      'placeholder="'+esc(t('wld.who.ph'))+'"' + IN('wldSet', ["who"]) + '></div>'+
    '<div class="sec">'+t('wld.note')+'</div>'+
    '<textarea class="ntbody" style="min-height:140px" placeholder="'+esc(t('wld.note.ph'))+'" '+
      '' + CH('wldSet', ["note"]) + '>'+esc(w.note||'')+'</textarea>'+
    '</div></div>';
}
function editName(){
  var v=prompt(t('home.name.prompt'), langName);
  if(v!==null && v.trim()){ langName=v.trim(); save(); render(); }
}

/* =========================================================================
   Languages -- which ones are here, and which one is open.
   LANGS holds every language this device knows about, yours and anyone
   else's you are reading; langId says which one the rest of the app means
   by WORDS. Pressing a row is the only way to change that. */
function langRow(id){
  var l=LANGS[id]||{}, isOpen=(id===langId);
  /* The index carries a name so a row can be drawn without opening the
     language to find out what it is called. For the one that IS open, langName
     is the live answer and the index is a copy of it made at the last save --
     so renaming a language and looking at this list before anything saved
     showed the old name here and the new one everywhere else. */
  var nm = isOpen? langName : l.name;
  return '<button class="set lrow'+(isOpen?' on':'')+'"' + DO('langOpen', [id]) +
    (isOpen? ' aria-label="'+esc(t('langs.open'))+'"' : '') + '>'+
    '<span class="sl">'+esc(nm||t('langs.untitled'))+'</span>'+
    '<span class="lchk">'+(isOpen?ICON_TICK:'')+'</span></button>';
}
function vLangs(){
  var ids=Object.keys(LANGS), mine=[], reading=[], i;
  for(i=0;i<ids.length;i++){
    if(LANGS[ids[i]].mine) mine.push(ids[i]); else reading.push(ids[i]);
  }
  var body='<div class="sec">'+esc(t('langs.mine'))+'</div>'+
    mine.map(function(id){ return langRow(id); }).join('')+
    (mine.length>=LANG_MAX? '<div class="note">'+esc(t('langs.more'))+'</div>' : '')+
    '<div class="sec">'+esc(t('langs.reading'))+'</div>'+
    /* .empty is the full-screen one: 54px of padding and a serif heading,
       which is right for a screen with nothing on it and far too loud for a
       section of a screen that has something on it. */
    (reading.length? reading.map(function(id){ return langRow(id); }).join('')
                    : '<div class="note">'+esc(t('langs.none'))+'</div>');
  return '<div class="view">'+navTop('')+'<div class="body">'+body+'</div></div>';
}

