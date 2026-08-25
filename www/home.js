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
  var left=wordCap()-WORDS.length;
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

       The keyboard has no number. It carried the count of its KEYS, which is
       a true number and answers a question nobody asked -- "9" beside the
       chapter says nothing anybody can act on, where "5 / 30" beside the
       letters says how much of an alphabet is drawn. 「キーボードの数字9って
       なに？意味がわからないから」 */
    {k:'kb.title',   r:'kb',     v:0, txt:''}
  ].concat(
    /* The sounds a language is built from, and it is Plus's. On free the
       inventory is filled in by the app -- a letter named `k` reads /k/ and
       nobody was asked -- so a page of it would be a page of the app's own
       guesses with nothing to do on it. Somebody who wants to settle a
       phonology properly is exactly somebody who has paid.
       「音韻を細かく決めたい人だっているだろ。plusで復活」
       「plus以外はもう音も文字も決まってる状態」

       LAST but for the AI, for the reason the comment below gives about the
       AI: a numbered row that appears when you pay renumbers the book under
       somebody who already knows where things are. Free and Plus differ by
       this row and it is at the end. */
    []
  ).concat(
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
    []);
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
/* `fit` is the sixth: a form that is one screen and does not scroll. It was
   read off FORM in vForm() and set by nobody, so the composer scrolled, kept
   its bar of tabs, and let the keyboard carry its own header off the top of
   the phone -- while a comment two files away said otherwise. */
function openForm(key, title, html, mount, right, fit){
  FORM={key:key, title:title, html:html, mount:mount||null, right:right||'',
        fit:!!fit};
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
  /* `fit` is a form that is one screen and does not scroll -- the composer,
     where a column of text pushed the meaning and the picture row off the
     bottom, so the thing you were about to press was somewhere you had to go
     and find. 「この中に1画面収めてうごかないようにしてほしい」 The form says
     so when it opens; nothing here decides it. */
  return '<div class="view'+(FORM.fit? ' fit' : '')+'">'+navTop('', FORM.right)+
    '<div class="body" id="form-body">'+FORM.html+'</div></div>';
}
/* ---- where an explanation goes -----------------------------------------
   「これから説明が必要なときは？マークつけて表示でちゃんと説明させるように
   して」

   A screen that has to be explained was explaining itself in place: a
   heading, two numbered steps and a sentence about Full Access, sitting
   above the thing they were about. Prose on a screen is read once by the
   person who did not need it and never again by the person who did, and it
   is in the way of the screen for everybody else.

   So the explanation is a mark. `?` in the bar, and pressing it opens the
   whole of it -- as long as somebody wants it and no longer.

   A screen registers what it has to say the way it registers a form:
   `HELP.kb = function(){ ... }`, in the file the screen lives in, returning
   the title and the body. Nothing here knows what a keyboard is. */
var HELP={};
function helpQ(k){
  if(!HELP[k]) return '';
  return '<button class="navq"' + DO('openHelp', [k]) +
    ' aria-label="'+esc(t('help.q'))+'">?</button>';
}
function openHelp(k){
  var f=HELP[k], o;
  if(!f) return;
  o=f();
  openForm('help:'+k, o.t, o.h);
}
FORM_OPEN.help=function(a){ openHelp(String(a||'')); };
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
  /* The letter's own character, read off the LETTER. chOf() takes a sound
     unit -- ltChar() walks LETTERS for one that reads it -- and pkFor is a
     letter id, so this asked which letter reads the sound `l1` and was told
     nothing, always. The grid never marked the character the letter already
     had. openPick() four lines up reads it correctly, which is why the field
     and the Clear button were right and only the grid was wrong.

     Found by press-check reporting that nothing wears `.cur`: the plans
     screen wore the same class on something else until today, and a second
     wearer somewhere else masks this exactly. */
  var l=ltById(pkFor), cur=(l && l.ch)||'', taken=chTaken();
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
/* Whose profile this is. No argument is your own, and that is the only
   profile with an account behind it -- a handle is somebody else's. */
function pfWho(){ return String(here().a||''); }
function pfMine(){ return !pfWho() || pfWho()===meHandle(); }
function pfList(){
  var h=pfWho(), of;
  of=pfMine()
    ? function(p){ return !!p.mine; }
    : function(p){ return String(p.hd||'')===h; };
  /* postKept() and not postAll(): a frozen account's posts are off the
     timeline and still here, which is the whole of what a page is for.
     「ツイートは自己責任で見れるようにする」 */
  var mine=postKept().filter(of);
  if(pfTab==='re')   return mine.filter(function(p){ return !!p.to; });
  /* What THIS person has liked. Your own is what you pressed; somebody
     else's arrives with them, and until it does the list is empty rather than
     absent -- the same three lists on everybody's page.
     「他人のプロフィールは基本自分が見えてるのと同じ感じ」 */
  if(pfTab==='li')   return pfMine()? postAll().filter(function(p){ return !!p.lime; }) : [];
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
    /* The gear is yours and only yours: somebody else's page is arrived at
       from the search, so it gets a way back instead. */
    (pfMine()
      ? '<div class="top"><div class="brand">LIN<span class="st">G</span>UA</div>'+
        '<button class="iconb"' + DO('go', ["settings"]) + ' aria-label="'+
        esc(t('set.title'))+'">'+ICON_GEAR+'</button></div>'
      : navTop(''))+
    '<div class="body" style="padding-top:0">'+
    /* Everything above the three lists is meCard() -- the face, the name, the
       handle, the language, the line about yourself and who follows whom.
       「プロフィール視認性悪すぎだしごちゃごちゃしてる」

       There were three strips under the face and every one of them was small
       grey type with a bold number in it: the language's name on a line of
       its own, then the follow counts, then the letters, the words and what
       the language is for. None was a heading for the others, so the eye had
       four places to start and no reason to pick one.

       The follow counts are who somebody is, so they are in the block about
       the person. The language is the tag beside the handle, the way a post
       says what it is written in. The letters and the words are chapters I
       and II of the contents, one tab away, and the number there is the
       fuller one -- 5 / 38 rather than 5. */
    /* Your own card, or somebody else's. The card is where a profile differs
       -- yours has Edit and the way to a badge, theirs has Follow -- and the
       lists under it are the same lists. */
    (pfMine()? meCard() : whoCard(pfWho()))+
    pfTabs()+
    (list.length? list.map(postRow).join('')
                : '<div class="note">'+esc(t(pfTab==='li'? 'prof.none.li'
                                            : pfTab==='re'? 'prof.none.re' : 'prof.none'))+'</div>')+
    '</div>'+
    /* The same one as the timeline's, from the same place. This screen is
       where the app opens, so without it a person who never pressed the home
       tab could not post at all. */
    snsFab()+
    '</div>';
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
        '<span class="lead"></span>'+ICON_GO+'</button>';
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
/* Both of these are the dictionary being browsed backwards -- which words
   have this sound in them, which have this letter -- so they see what the
   list sees. Searching past the free ceiling would put back on one screen
   exactly what the other one stops showing. */
function fWordsWithSnd(sym){
  return wordsSeen().filter(function(w){ return wPh(w).indexOf(sym)>=0; });
}
function fWordsWithLtr(id){
  var l=ltById(id);
  if(!l) return [];
  var u=ltUnits(l);
  return wordsSeen().filter(function(w){
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
  if(g.w.length) out+=fSec(t('toc.words'), g.w.length)+g.w.map(entryOneHTML).join('');
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
    (hits.length? hits.map(entryOneHTML).join('')
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

/* ---- the sections somebody writes -------------------------------------
   「wikiを作るんだからね？わかってる？編集もwikiを作るの。それでなにを載せ
   れんの？世界観とかも含めてのwikiだからね？」 OWNER 2026-08-25.

   Until this, four things could be written about a language: which of the
   uses it is for, one line of `where`, one line of `who`, and one `note`.
   A history, a people, a city, a myth had nowhere to go -- so the honest
   answer to 「なにを載せれんの？」 was "almost nothing". What was missing was
   not the look of the page, it was somewhere to put anything.

   A section is a title and a body, both the person's own words, and there is
   no fixed set of them. The ORDER is the array's order and is not stored
   twice: an array already has an order, and a second one beside it is two
   answers to the same question waiting to disagree.

   Whether a section is public is `WLD.secs`, which already exists and is
   already keyed by a section's name -- `secs.letters` for the chapter,
   `secs[id]` for one of these. One place, not a second one for the new kind.

   No ceiling here. How many a person may write, and on which plan, is a price
   and a threshold, and neither is decided in a tool. docs/CHANGELOG.md says
   so; when it is decided it is one line at the head of wldArtAdd(). */
function wldArts(){
  var a=world().arts;
  return (Object.prototype.toString.call(a)==='[object Array]')? a : [];
}
/* Minted the way a language is (www/core.js langMint), and checked against
   what is here rather than trusted: two sections made in the same
   millisecond would otherwise be one section that cannot be told from
   itself, and `secs` is keyed by this. */
function wldArtMint(){
  var id='A'+(new Date()).getTime().toString(36), n=0;
  while(wldArtBy(id)){ n++; id='A'+(new Date()).getTime().toString(36)+n.toString(36); }
  return id;
}
function wldArtBy(id){
  var a=wldArts(), i;
  for(i=0;i<a.length;i++) if(a[i] && a[i].id===id) return a[i];
  return null;
}
function wldArtAdd(){
  var a=wldArts(), one={id:wldArtMint(), t:'', b:''};
  a.push(one);
  world().arts=a; saveWld();
  go('wldart', one.id);
}
/* Written into the section that is open. `wldSet` is the same shape for the
   four fixed fields; this is that for one of these. */
function wldArtSet(id, k, v){
  var one=wldArtBy(id);
  if(!one) return;
  one[k]=String(v||'');
  saveWld();
}
wldRead();
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
    /* And the sections. A row each, and a + that makes one and goes to it --
       the same shape the notebook's list already has, so nothing new is
       drawn. An untitled one says so rather than showing an empty row. */
    secAdd(t('wld.secs'), DO('wldArtAdd'), t('wld.secs'))+
    wldArts().map(function(one){
      return '<button class="set"' + DO('go', ["wldart", one.id]) + '>'+
        '<span class="sl">'+esc(one.t||t('wld.art.untitled'))+'</span>'+
        '<span class="sv">'+esc(wldSecSay(one.id))+ICON_GO+'</span></button>';
    }).join('')+
    '</div></div>';
}
/* One section, open: what it is called, what it says, and the two answers
   about who may have it. The list is where a section is CHOSEN and this is
   the screen you arrive at, which is where a thing is changed -- the two are
   not allowed to share a screen and here they do not. */
function vWldArt(){
  /* The id comes off the route, not off a parameter: PAGES[route].view() is
     called with no arguments (www/glyph.js), so a view that took one was
     handed undefined and drew the gone box instead of the section -- on a
     phone, not only in the walk. Every other view that is about one thing
     reads here().a the same way (vThread, vFm, vSet). */
  var one=wldArtBy(String(here().a||''));
  if(!one) return viewGone();
  return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="field"><input id="wldart-t" value="'+esc(one.t||'')+'" '+
      'placeholder="'+esc(t('wld.art.t.ph'))+'"' + IN('wldArtSet', [one.id, "t"]) + '></div>'+
    '<textarea class="ntbody" style="min-height:260px" placeholder="'+esc(t('wld.art.b.ph'))+'" '+
      '' + CH('wldArtSet', [one.id, "b"]) + '>'+esc(one.b||'')+'</textarea>'+
    /* The same pair the whole page has in the settings room, and in the same
       order: whether anybody else may open it, and then -- only if they may --
       whether they may take it away. Two questions, never one.

       Worded with `wld.shown` and `wld.dl.can` rather than the page's own
       `wld.public`/`wld.dl`, and not as a shortening of them: those two are
       sentences about the PAGE -- "Show this language to other people" reads
       as a lie over one section of it. These are the words the section's own
       row already says about itself in wldSecSay(), so the list and the
       switch that sets it say the same thing, and no new wording is invented
       to say it. They are also one line, which is what keeps these two rows
       the same height as each other. */
    '<button class="set"' + DO('setWldSecHide', [one.id, !wldSecHidden(one.id)]) + '>'+
    '<span class="sl">'+esc(t('wld.shown'))+'</span>'+
    swtHTML(!wldSecHidden(one.id))+'</button>'+
    (wldSecHidden(one.id)? '' :
      '<button class="set" style="border-bottom:none"' + DO('setWldSecDl', [one.id, !wldSecDl(one.id)]) + '>'+
      '<span class="sl">'+esc(t('wld.dl.can'))+'</span>'+
      swtHTML(wldSecDl(one.id))+'</button>')+
    '</div></div>';
}
/* ---- the page a language has ------------------------------------------
   「その言語について簡単にまとめてあるページ欲しいな」「そこでその人が作ってるの
   見れる」

   The World screen above is the EDITOR -- five kinds, three fields, and every
   one of them a thing to fill in. This is the other half and it was missing:
   somewhere to LOOK at a language, which is what a profile points at and what
   anybody but its author would ever want.

   It reads and touches nothing. Everything on it is the open language --
   which is correct today, because the only profile this phone can show is
   this person's own, and the day somebody else's arrives it arrives with
   their language's summary on it the way a post arrives with its ink.

   What is on it, and the owner chose it: what the language is for, where, who
   and the note; the letters somebody has actually drawn; and the three
   numbers. Not the words -- a dictionary is a chapter, not a summary.

   2026-08-25 it became the language's own article rather than a summary of
   it: 「ここはWikipediaみたいに編集できるようにしたい。ウィキみたいな画面で、
   キーボードと文字とかそれぞれのセクションで公開非公開できて、DL可能なら
   DL可能になって他の人が使えるようになるイメージ。その人の言語Wikipedia
   みたいな感じにしたいそのページ」

   THIS IS THE LOOK ONLY, and that is the owner's own order --
   「見た目を完璧にしてからsqlね」. Nothing here asks the server, nothing
   here writes, and「他の人が使えるようになる」is the server's half and is
   not started. What is here is the shape: the article, and under it every
   section of the language with what it is open to. */
function wldHidden(){ return !!world().hide; }
/* From the settings, and it writes the LANGUAGE rather than SET: whether this
   language has a page is about this language, and SET is the person's. The
   flag is `hide`, so absent is public -- which is the default the owner chose,
   and a default that is the absence of a field is one no migration can get
   wrong. */
function setWldHide(v){ world().hide=!!v; saveWld(); render(); }
/* Whether anybody may take the letters and the words away and use them.
   A different question from whether the page can be OPENED: somebody can
   read a language without being handed it. 「言語ページ公開と単語や文字の
   dl可能は別だし」

   `dl` is absent by default and absent means no. The page's own flag is the
   other way round -- absent is public -- because a page is a thing to be
   looked at; this hands over months of somebody's drawing, and the app does
   not decide that for them. */
function wldDl(){ return !!world().dl; }
function setWldDl(v){ world().dl=!!v; saveWld(); render(); }
/* ---- and the same two questions, asked of one SECTION of the page -------
   「キーボードと文字とかそれぞれのセクションで公開非公開できて、DL可能なら
   DL可能になって他の人が使えるようになるイメージ」

   A section that has never been touched has nothing stored for it and follows
   the PAGE's own flag. That is not a third state: it is the absence of an
   answer, and it is deliberate. 2026-08-13 settled what a PAGE defaults to
   (`hide` absent = public) and nothing has settled what a SECTION defaults
   to, so with nothing stored both answers are still reachable -- the owner
   decides it by deciding the page's, and no migration has to run either way.

   `wld.secs` is an object of objects rather than two lists, so a section
   carries both answers in one place and a section nobody has touched is not
   in the file at all. */
function wldSecOf(r){
  var s=world().secs, o;
  if(!s || typeof s!=='object' || (s instanceof Array)) return {};
  o=s[r];
  return (o && typeof o==='object' && !(o instanceof Array))? o : {};
}
function wldSecHidden(r){
  var o=wldSecOf(r);
  return Object.prototype.hasOwnProperty.call(o,'hide')? !!o.hide : wldHidden();
}
function wldSecDl(r){
  var o=wldSecOf(r);
  return Object.prototype.hasOwnProperty.call(o,'dl')? !!o.dl : wldDl();
}
/* What a section's row says about itself. A state, never a sentence --
   「アプリ内に説明書くの禁止」 -- and the two are separate questions, so a
   section that is open and may be taken away says both. */
function wldSecSay(r){
  if(wldSecHidden(r)) return t('wld.hidden');
  return wldSecDl(r)? t('wld.shown')+' \u00b7 '+t('wld.dl.can') : t('wld.shown');
}
/* ---- and writing those two answers ------------------------------------
   The four above READ `secs`. Nothing anywhere wrote it: every row said
   公開, and there was no way to make one say anything else. This is that
   missing half, and it is the page-wide pair in the settings room asked of
   one section -- the same two questions, the same order, the same switch.

   A section nobody has touched stays out of `secs` entirely. These write only
   the answer that was pressed and never copy the page's value in beside it:
   copying it would turn "follows the page" into an answer somebody gave, and
   what a section defaults to is nobody's to decide here. */
function wldSecSet(r, k, v){
  var s=world().secs, o;
  if(!s || typeof s!=='object' || (s instanceof Array)){ s={}; world().secs=s; }
  o=s[r];
  if(!o || typeof o!=='object' || (o instanceof Array)){ o={}; s[r]=o; }
  o[k]=!!v;
  saveWld(); render();
}
function setWldSecHide(r, v){ wldSecSet(r, 'hide', v); }
function setWldSecDl(r, v){ wldSecSet(r, 'dl', v); }
/* The row on the profile, in place of the small tag that used to sit beside
   the handle. 「linguaパッチの代わり。Lingua > みたいになってて」 */
function wldRow(){
  if(!langName) return '';
  return '<button class="wldrow"' + DO('go', ["about"]) + '>'+
    '<span class="wldnm">'+esc(langName)+'</span>'+
    (wldHidden()? '<span class="wldoff">'+esc(t('wld.hidden'))+'</span>' : '')+
    ICON_GO+'</button>';
}
/* ---- a section of the article opens and shuts -------------------------
   「概要　▽ / 話してる場所 / 〇〇 みたいにして欲しい」 OWNER 2026-08-25, over a
   screenshot of ja.wikipedia.org, where every section of a mobile article is
   a heading with a marker and folds away under it.

   Which ones are shut is where you are STANDING in the page, not something
   the language owns, so it is not in `wld` and is not saved. The line that
   forgets it belongs in viewReset() in www/shell.js with the rest of what a
   screen forgets; this session does not own that file, so it is reported
   rather than reached into. Open is the default: nothing somebody has never
   touched is folded away from them. */
var ABSHUT={};
function abShut(r){ return !!ABSHUT[r]; }
function abToggle(r){ ABSHUT[r]=!ABSHUT[r]; render(); }
var ICON_FOLD='<svg class="ic abmk" viewBox="0 0 24 24" width="13" height="13" fill="none" '+
  'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" '+
  'aria-hidden="true"><path d="M5 9l7 7 7-7"/></svg>';
/* A heading that folds. It is a button and `.abts` is an <h2>, so the two
   never sit as siblings in one list -- every heading on this page is this
   one now, which is what keeps a list one height. */
function abHead(r, title){
  return '<button class="abshd'+(abShut(r)? ' shut':'')+'"' + DO('abToggle', [r]) + '>'+
    ICON_FOLD+'<span class="abshl">'+esc(title)+'</span></button>';
}
/* A fact of the overview: what it is called, and under it what it says.
   NOT side by side -- 「話してる場所　あああ みたいにやるのやめて」. */
function abField(k, v){
  return '<div class="abfd"><div class="abfk">'+esc(k)+'</div>'+
    '<div class="abfv">'+esc(v)+'</div></div>';
}
/* The two answers, in the section they are about. */
function abSwitches(r){
  return '<button class="set"' + DO('setWldSecHide', [r, !wldSecHidden(r)]) + '>'+
    '<span class="sl">'+esc(t('wld.shown'))+'</span>'+
    swtHTML(!wldSecHidden(r))+'</button>'+
    (wldSecHidden(r)? '' :
      '<button class="set"' + DO('setWldSecDl', [r, !wldSecDl(r)]) + '>'+
      '<span class="sl">'+esc(t('wld.dl.can'))+'</span>'+
      swtHTML(wldSecDl(r))+'</button>');
}
function vAbout(){
  var w=world(), drawn=LETTERS.filter(ltHasShape), body='';
  /* The article names its subject. The bar says what SCREEN this is
     (「この言語について」, which is PAGES' to say and rule 2's NAMES keeps
     there); the page itself has to say what the article is ABOUT, and until
     now nothing on it did -- somebody arriving could read the whole page
     without being told which language it was. That is the first line of every
     encyclopedia article and it was the one missing.
     Not a duplicate of the bar: the bar names the room, this names the
     language, and they are never the same string. `.sth` is the heading a
     stage already uses. */
  if(langName) body+='<h1 class="abth">'+esc(langName)+'</h1>';
  /* The two counts are the way in to the two lists. The dictionary was
     written out here for a moment and taken back off: a language with ten
     thousand words in it is a page nobody reaches the bottom of, and the
     dictionary already has a screen that searches and sorts.
     「lpみたいにしたら1万時ある時どうするつもりなの？」 */
  /* The facts, as rows. 「wikiの見た目にしろって言ってなんでそんなゴミが
     できるの？wiki見たことないの？」 OWNER 2026-08-25 -- and the answer is
     that this was three tiles.

     An encyclopedia article opens with its subject named, a line saying what
     it is, and then a table of plain facts; it does not open with a row of
     cards. The three tiles were also `border-radius:14px`, which is the rule
     at the head of CLAUDE.md.
     `.set` is that table and is already in this app on every settings screen
     and at the foot of this very page -- label on the left, value on the
     right, one hairline under each. Nothing new is drawn.
     The two that lead somewhere stay pressable and the writing system does
     not, exactly as before; `.set` carries its own font-size and line-height,
     so a <button> row and a <div> row are the same height (CLAUDE.md's rule
     about one list, one height, and what press measures). */
  /* ---- the skeleton, in the order an article has it -------------------
     「骨格の話はしてねえし、そもそも骨格の認識がくそ、一旦ページ見てこいよ」
     OWNER 2026-08-25. Read: wikipedia.org is blocked from this container, so
     Wikipedia's own Manual of Style/Layout was, which gives the order:

       infobox        the key facts, ABOVE the first heading
       lead           what this is, in words, still above the first heading
       contents       when there are four headings or more
       == section ==  and under its heading, the way to the fuller article

     Every one of those four was in the wrong place or missing here. The facts
     were in the middle of the flow, the lead was a two-line fragment under the
     title, the contents were at the FOOT of the page, and no section led
     anywhere. */
  /* The infobox. Facts, before anything is said.

     These were `.set` rows, which is the class every settings screen in this
     app wears -- so the article opened with three rows identical to Settings,
     and then the contents did it again five rows further down. Eight
     settings-shaped rows is what made the page read as a form.
     「wikiの見た目にしろって言ってなんでそんなゴミができるの？」 An infobox is a
     TABLE: a narrow label column in the quiet colour and the value beside it,
     set tight, with nothing to press.

     Where it is spoken and who speaks it are here rather than being sections
     of their own. They are one line each -- a heading the size of "The
     valley" over a three-word answer is the article breaking itself into
     fragments, and every encyclopedia puts exactly these two in the box at
     the top instead. Nothing is dropped: the same two strings, in the same
     order, under the same names. */
  /* ---- 概要, which is a section and folds like every other one --------
     The counts came off it: 「今作っている単語数とかどうでもいいねん。人に見て
     もらうための言語のwikiなんだから作り込ませるための場所ね？」 OWNER
     2026-08-25. How many words exist today is a number about the app's own
     progress, not a fact about the language, and it was the first thing a
     reader met. What is left is what somebody would want to know: where it is
     spoken, who speaks it, what kind of writing it uses and which way it
     runs. */
  var ov='';
  if(w.where) ov+=abField(t('wld.where'), w.where);
  if(w.who) ov+=abField(t('wld.who'), w.who);
  ov+=abField(t('ws.kind'), t('ws.k.'+wsys()));
  ov+=abField(t('dir.title'), t('dir.'+scriptDir()));
  body+=abHead('wldov', t('wld.overview'))+
    (abShut('wldov')? '' : '<div class="abfx">'+ov+'</div>');
  /* The lead: what this language is for, in its own words. */
  if(wldUse()) body+='<div class="abtuse">'+
    '<span class="abtun">'+esc(t('wld.'+wldUse()))+'</span>'+
    '<span class="abtud">'+esc(t('wld.'+wldUse()+'.d'))+'</span></div>';
  /* And the note, which is the rest of the lead: an article says what it is
     before it starts dividing itself up, and that paragraph carries no
     heading of its own. */
  if(w.note) body+='<div class="abtl abtlead">'+esc(w.note)+'</div>';
  /* ---- the list of sections -------------------------------------------
     「セクション一覧は消すなよ」 OWNER 2026-08-25. It was taken out in the
     commit before this one and that was wrong. It is the one place that says,
     in one screen, which parts of this language a stranger may see -- every
     section, and the answer, without opening any of them. */
  var rows=tocRows();
  body+='<h2 class="abts">'+esc(t('wld.secs'))+'</h2>'+
    wldArts().map(function(one){
      return '<button class="abtc"' + DO('go', ["wldart", one.id]) + '>'+
        '<span class="abtcl">'+esc(one.t||t('wld.art.untitled'))+'</span>'+
        '<span class="abtcs">'+esc(wldSecSay(one.id))+'</span></button>';
    }).join('')+
    rows.map(function(row){
      return '<button class="abtc"' + DO('go', [row.r]) + '>'+
        '<span class="abtcl">'+esc(t(row.k))+'</span>'+
        '<span class="abtcs">'+esc(wldSecSay(row.r))+'</span></button>';
    }).join('');
  /* ---- and then the sections themselves -------------------------------
     What somebody wrote comes first: it is the article's own prose, and the
     chapters under it are the reference sections. A section with neither a
     title nor a body is not drawn -- a heading over nothing is a promise the
     page does not keep.

     A section that is NOT public is drawn here all the same. This is the
     author's own page, and hiding a section from its author takes its switch
     away with it: it could be turned off and never turned back on. What
     `hide` decides is what somebody ELSE is shown, and nobody else can be
     shown this page yet. */
  wldArts().forEach(function(one){
    if(!(one.t || one.b)) return;
    body+=abHead(one.id, one.t||t('wld.art.untitled'))+
      (abShut(one.id)? '' :
        abSwitches(one.id)+
        (one.b? '<div class="abtl">'+esc(one.b)+'</div>' : ''));
  });
  /* Then the chapters, in the order the book has them. The alphabet is the
     one whose content is on this page -- and only what has a shape on it: the
     free plan puts thirty-eight slots there the moment a language exists, so
     all of them would be a summary saying every language has thirty-eight
     letters. */
  rows.forEach(function(row){
    body+=abHead(row.r, t(row.k));
    if(abShut(row.r)) return;
    body+=abSwitches(row.r)+
      '<button class="set"' + DO('go', [row.r]) + '>'+
        '<span class="sl">'+esc(row.txt||t(row.k))+'</span>'+
        '<span class="sv">'+ICON_GO+'</span></button>';
    if(row.r==='letters' && drawn.length)
      body+='<div class="ltgrid">'+drawn.map(function(l){ return ltCell(l, ''); }).join('')+'</div>';
  });
  /* An empty language is a language somebody started this morning, not a
     broken one. The sections below are not part of that count: they are here
     whether or not anything has been written into them, which is what makes
     the page an article about a language rather than a page about what has
     been filled in. */
  if(!body) body='<div class="note">'+esc(t('wld.empty'))+'</div>';
  /* The contents moved up to where an article keeps them -- see the skeleton
     note above. They were written out again down here, which was the same
     list twice on one page. */
  /* And the way to the editor, which is where the chip beside the handle used
     to go. It is here rather than in the settings because this is the page you
     are looking at when you notice it is wrong -- the same place, and the same
     shape, as Edit on a profile. */
  return '<div class="view">'+
    navTop('', '<button class="navdo"' + DO('go', ["world"]) + '>'+esc(t('wld.edit'))+'</button>')+
    '<div class="body">'+body+'</div></div>';
}
/* What making this language public means, behind the `?` in the bar rather
   than as a sentence on the screen. 「showの横に？つけて他と同じ感じで」 */
HELP.pub=function(){
  return {t:t('wld.public'), h:
    '<div class="sec">'+esc(t('wld.public'))+'</div>'+
    '<div class="note">'+t('wld.public.d')+'</div>'+
    '<div class="sec">'+esc(t('wld.dl'))+'</div>'+
    '<div class="note">'+t('wld.dl.d')+'</div>'};
};
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
/* The way to make another one, at the foot of the list -- where "add an
   account" sits in the app this is modelled on. 「アカウントが変わるイメージ。
   実際の sns はアカウント切り替えボタンあるやん？あれが言語切り替えになるって
   感じ」「せっていからでいいよ」 OWNER DECISION 2026-08-25: the list stays in
   Settings and is not moved onto the profile.

   It is drawn on every plan, including the one that cannot press it: a closed
   door is shown rather than hidden. 「だいたい無料で使えないやつは表示させて
   いいよ。課金させる動線を減らしたくない」 What happens on the press is
   langStop()'s, in core.js, and is not asked here -- a screen that both drew
   the door and decided whether it opens would be two places holding one rule.

   A row and not a button of its own shape: it is the last row of a list, and
   rows in one list are one height. Same tag, same class, same two spans as
   langRow() above, which is what makes that true rather than nearly true. */
function langAddRow(){
  return '<button class="set lrow"' + DO('langNew') + '>'+
    '<span class="sl">'+esc(t('langs.new'))+'</span>'+
    '<span class="lchk"></span></button>';
}
function vLangs(){
  var ids=Object.keys(LANGS), mine=[], reading=[], i;
  for(i=0;i<ids.length;i++){
    if(LANGS[ids[i]].mine) mine.push(ids[i]); else reading.push(ids[i]);
  }
  var body='<div class="sec">'+esc(t('langs.mine'))+'</div>'+
    mine.map(function(id){ return langRow(id); }).join('')+
    langAddRow()+
    '<div class="sec">'+esc(t('langs.reading'))+'</div>'+
    /* .empty is the full-screen one: 54px of padding and a serif heading,
       which is right for a screen with nothing on it and far too loud for a
       section of a screen that has something on it. */
    (reading.length? reading.map(function(id){ return langRow(id); }).join('')
                    : '<div class="note">'+esc(t('langs.none'))+'</div>');
  return '<div class="view">'+navTop('')+'<div class="body">'+body+'</div></div>';
}

