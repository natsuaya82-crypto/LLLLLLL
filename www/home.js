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
   the phone -- while a comment two files away said otherwise.

   AND IT SAYS WHICH SCREEN IT IS ONE OF. Two forms ask for it and they want
   two different heights:

     true     the height the phone has with the KEYBOARD UP (`--vvmin`). The
              composer, which has a bar and a row of pictures under the field
              -- laid out to anything taller and they slide down the phone
              every time the keyboard goes 「キーボードをおろしても位置は
              動かない」.
     'full'   the whole screen, keyboard or no keyboard 「キーボードかんがえ
              ないでいいから。画面全部にしてほしい」 OWNER 2026-09-05. The
              note, which has nothing under the body: a keyboard covers the
              foot of it and covers nothing anybody was looking at.

   It is one word rather than a second flag because it is one question -- how
   tall is this one screen -- and a form answers it once. */
function openForm(key, title, html, mount, right, fit){
  FORM={key:key, title:title, html:html, mount:mount||null, right:right||'',
        fit:fit? (fit==='full'? 'full' : true) : false};
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
  return '<div class="view'+(FORM.fit? ' fit' : '')+
    (FORM.fit==='full'? ' fitfull' : '')+'">'+navTop('', FORM.right)+
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
/* HOW THE MARK OPENS, written once: helpQ() builds it and helpQCut() below
   finds it again in whatever a screen handed the bar. Two places matching a
   string by hand is two places that drift. */
/* A SPAN AND NOT A BUTTON, so the mark can stand inside a row that is itself
   one press. 「キーボードの？は目次の題名の横」 OWNER 2026-09-05, and the
   contents is a list where each row is a single `<button class="trow">`: the
   parser closes a button when it meets another, so a nested one is not a
   small mark inside a row, it is the row cut in half. actOf() (www/act.js)
   walks up from what was touched to the nearest `data-do`, so the mark
   answers for itself and the row answers for everywhere else -- one press,
   one act, either way.

   It stays a flex ITEM everywhere it is used -- the bar is a flex row and so
   is `.trow` -- so `min-height`/`min-width` still make it the 44pt box a
   thumb needs, which is the one thing a span would otherwise lose. */
var NAVQ_OPEN='<span class="navq"';
/* `margin-left:0` because `.navq` carries `margin-left:auto`, which is what
   stood it at the far end of the bar. It stands beside the name now
   (www/shell.js § navTop) and the class is worn by nine other corners on six
   screens, so the auto is undone here rather than taken off the class.

   The vertical pull is the same sentence about a LIST. A 44pt box in a row
   whose words are 21px makes that one row half again as tall as the others,
   and 「行の高さは揃える」 -- so the box reaches out into the padding the row
   already has, where a thumb still lands. It is 44pt still; it just stops
   being what decides the row's height. In the bar there is nothing to pull
   past: every other thing in that corner is 44pt too.

   And the `?` is centred in that box BY THIS RULE rather than by the tag. A
   `<button>` centres its own text and a span does not, so the mark sat at the
   top of its 44pt box the moment it stopped being a button -- which is the
   whole class of fault that comes of changing what something IS. */
function helpQ(k){
  if(!HELP[k]) return '';
  return NAVQ_OPEN + ' role="button" tabindex="0"' +
    ' style="margin:-12px 0;display:flex;align-items:center;justify-content:center"' +
    DO('openHelp', [k]) +
    ' aria-label="'+esc(t('help.q'))+'">?</span>';
}
/* THE MARK, TAKEN OUT OF WHAT A SCREEN PUT IN THE CORNER.
   「？を文字の横に動かしたらいけない？」 OWNER 2026-09-05.

   Every screen with something to explain hands `helpQ(...)` to navTop() as
   part of `right`, and `right` is also where a Save, a delete and the
   keyboard's ... arrive. So the bar takes the mark back out and stands it
   next to the name; everything else in `right` is left exactly where it was.
   Nothing that calls navTop() changed.

   Returns the pair: the mark, and what is left. The mark holds one character
   and nothing nested, so the first `</span>` after it is its own.

   AND IT CAN NOW TELL WHAT IT IS CUTTING. The mark and the keyboard's ⋯ both
   wore `.navq` on a `<button>`, so this matched whichever came first in the
   string and had no way to know which it had. The mark is a span now and the
   ⋯ is still a button, so there is nothing left to confuse. Nothing visible
   was measured to move by it -- the bar puts the mark and `right` in the same
   place on that screen either way -- so this is the ambiguity going, not a
   fault being fixed. */
function helpQCut(right){
  var s=String(right||''), i=s.indexOf(NAVQ_OPEN), j;
  if(i<0) return ['', s];
  j=s.indexOf('</span>', i);
  if(j<0) return ['', s];
  j=j+7;
  return [s.slice(i, j), s.slice(0, i)+s.slice(j)];
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
  /* The popup rides on this same scrim and is not a route: taking it down is
     all there is to do. Pressing the dark is the "no". */
  if(popOn()){ popOff(); return; }
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
/* The three lists, in the order they stand in. ONE list: the row of buttons
   is built from it and the swipe below walks it, so a fourth list added here
   is a fourth list you can reach either way. */
var PF_TABS=[['posts','prof.posts'], ['re','prof.replies'], ['li','prof.likes']];
function pfTabs(){
  return '<div class="pftabs">'+PF_TABS.map(function(x){
    return '<button class="pftab'+(pfTab===x[0]?' on':'')+'"' + DO('pfSetTab', [x[0]]) + '>'+
      esc(t(x[1]))+'</button>';
  }).join('')+'</div>';
}
/* ---- AND THE SAME THREE, PAID ACROSS -----------------------------------
   「スライドで投稿返信いいねの行き来」 OWNER 2026-09-05.

   The neighbour, or nothing. The ends do not wrap: a page that jumps from
   the last list to the first under a thumb is a page that has moved and
   nobody can say where to. */
function pfStep(way){
  var i, at=-1;
  for(i=0;i<PF_TABS.length;i++) if(PF_TABS[i][0]===pfTab) at=i;
  if(at<0) return;
  at=at+way;
  if(at<0 || at>=PF_TABS.length) return;
  pfSetTab(PF_TABS[at][0]);
}
/* WHERE THE THUMB WENT DOWN. Not within a thumb's width of either edge --
   that is the gesture that goes BACK, and www/shell.js § swStart owns it.
   Asking here rather than letting both run is what keeps one thumb from
   meaning two things. */
var PF_X=0, PF_Y=0, PF_SW=false;
function pfSwDown(e){
  PF_SW=false;
  if(!e.isPrimary || here().r!=='profile') return;
  if(e.clientX<=30 || e.clientX>=(window.innerWidth||0)-30) return;
  PF_X=e.clientX; PF_Y=e.clientY; PF_SW=true;
}
/* And it is decided when the thumb LEAVES, not while it moves: nothing here
   ever takes the page away from the browser, so a thumb heading down the
   list scrolls it exactly as it did before. What makes it a move sideways is
   40px across AND more across than down. */
function pfSwUp(e){
  if(!PF_SW) return;
  PF_SW=false;
  if(here().r!=='profile') return;
  var dx=e.clientX-PF_X, dy=e.clientY-PF_Y;
  if(Math.abs(dx)<40 || Math.abs(dx)<=Math.abs(dy)) return;
  pfStep(dx<0? 1 : -1);
}
document.addEventListener('pointerdown', pfSwDown, {passive:true});
document.addEventListener('pointerup', pfSwUp, {passive:true});
document.addEventListener('pointercancel', function(){ PF_SW=false; }, {passive:true});
function vProfile(){
  var h=pfWho(), waiting=!pfMine() && !WHO_HAVE[h], list;
  /* Who this page is about, asked for when it is somebody else -- the same
     shape vFeed() and vNotif() ask for theirs. Everything drawn below used to
     come off a post of theirs, so a person with nothing on this phone was a
     '?' with a Follow button. whoPull() asks once per handle and does nothing
     at all on your own page. */
  if(!pfMine()) whoPull(h);
  /* AND YOUR OWN FOLLOWS ARE NOT ASKED FOR HERE. Both directions came down
     when the session began (`mine`, www/sns.js § WHAT AN OPEN ASKS FOR): a
     count asked for by the screen that shows it is a count that arrives after
     the screen does, which is the whole of 「1秒後に1とか数字が変わる」.
     Pulling this page down is what asks again. */
  return '<div class="view">'+
    /* The gear is yours and only yours: somebody else's page is arrived at
       from the search, so it gets a way back instead. */
    (pfMine()
      ? '<div class="top"><div class="brand">LIN<span class="st">G</span>UA</div>'+
        '<button class="iconb"' + DO('go', ["settings"]) + ' aria-label="'+
        esc(t('set.title'))+'">'+ICON_GEAR+'</button></div>'
      : navTop(''))+
    '<div class="body" style="padding-top:0">'+
    /* SOMEBODY ELSE'S SCREEN, AND NOTHING FROM THIS PHONE'S OWN GUESS.
       whoOf() answers before the server does -- a post of theirs if this
       phone has one -- and that used to be what the whole page was drawn
       from: a card built out of a stale copy, with only the follow counts
       (snsWaitWord(), inside whoCard()) turning while the real numbers were
       still out. 「他の人のプロフィールいく時、フォロー中とフォロワーが
       くるくるするけど、そこじゃなくてその人の画面がくるくるして欲しい」
       OWNER 2026-09-05 -- so until WHO_HAVE[h] actually has this person's
       page, the SCREEN turns and nothing guessed is shown. */
    (waiting? snsWaitHTML() : (
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
    (pfMine()? meCard() : whoCard(h))+
    pfTabs()+
    ((list=pfList()).length? list.map(postRow).join('')
                : '<div class="note">'+esc(t(pfTab==='li'? 'prof.none.li'
                                            : pfTab==='re'? 'prof.none.re' : 'prof.none'))+'</div>')))+
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
    /* AND NO MARK HERE. 「「？」は一覧ではなく、一つ中（板を開いた画面）の
       bar に」 OWNER 2026-09-06, which replaces 「キーボードの？は目次の
       キーボードの題名の横」 of 2026-09-05: the contents is a list of
       chapters, and this row is one of them. It is on the keyboard's own page
       now (www/keyboard.js § vKb), which is the screen the answer is about --
       the keys are drawn on it and 「how do I switch this on」 is asked with
       one in front of you. A chapter's row here is its name and the way in. */
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
    searchBox('f', t('find.ph'), 'fSetQ', fq)+'</div>'+
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
  /* ltSeen(), not LETTERS: the alphabet's own room hides what a free plan
     cannot reach, and a search that answered off the whole list put those
     letters back on the screen through the other door. */
  g.l=ltSeen().filter(function(l){
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
  if(!total) return emptyBox(t('words.nomatch'));
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
    (hits.length? hits.map(entryOneHTML).join('') : emptyBox(t('words.nomatch')));
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
/* The box is as tall as what is in it, and typing repaints the list rather
   than the screen, so nothing else would say the field grew. */
function fSetQ(v){ fq=v; if(v) fpick=null; lnGrow('f-q'); findPaint(); }
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
  try{ var w=JSON.parse(slRd(langKey('wld'))||'null');
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
function saveWld(){ if(langLocked()) return; bkTouch(); slWr(langKey('wld'), JSON.stringify(WLD)); }
function world(){ return WLD; }
/* 用途 -- the five 「物語 / 種族 / 土地 / 実際に話す / 試す」 -- came off both
   screens: 「編集画面の謎のその5択なに？いらんやろ」 OWNER 2026-08-25. What each
   one MEANT was a line of explanation under it (「本・映画・ゲームの中の言葉」),
   which is the thing the app is not allowed to do at all.
   `WLD.use` itself is not touched and not migrated: what somebody chose is
   still in their file, and nothing here deletes it. */
/* ---- what is typed on the article, before it is on the language ---------
   OWNER DECISION 2026-09-03, www/shell.js § KEEP. Every field on the editing
   face used to write the language on the keystroke -- where it is, who lives
   there, every row of the overview and the body of every section. So a
   paragraph half typed was the article, and there was no moment at which
   somebody had finished writing it.

   ONE BUFFER FOR THE WHOLE FACE, because it is one screen: the four fixed
   fields, the rows and the sections are all on it and the Save in the bar is
   about all of them. A field's name in the buffer carries what it is about --
   `where`, `ov.<id>.k`, `art.<id>.b` -- so a row added or taken away does not
   disturb the others.

   The ＋ that makes a row and the − that takes one away are NOT typing and are
   not in here: they are pressed, and a press acts. What is buffered is what is
   typed into a box. */
function wldKeyOv(id, f){ return 'ov.'+String(id)+'.'+f; }
function wldKeyArt(id){ return 'art.'+String(id)+'.b'; }
function wldKeepOn(){
  var w, was;
  /* Not in somebody else's language: saveWld() refuses one. */
  if(langLocked()) return;
  w=world(); was={where:String(w.where||''), who:String(w.who||'')};
  wldOvs().forEach(function(row){
    if(!row) return;
    was[wldKeyOv(row.id, 'k')]=String(row.k||'');
    was[wldKeyOv(row.id, 'v')]=String(row.v||'');
  });
  wldArts().forEach(function(one){
    if(!one) return;
    was[wldKeyArt(one.id)]=String(one.b||'');
  });
  keepOn(keepKeyOf('world', ''), was, wldKeepSave);
}
function wldKeepSave(v, done){
  var f, m;
  for(f in v){
    if(!v.hasOwnProperty(f)) continue;
    if(f==='where' || f==='who'){ world()[f]=String(v[f]); continue; }
    m=/^ov\.(.+)\.([kv])$/.exec(f);
    if(m){ wldOvPut(m[1], m[2], String(v[f])); continue; }
    m=/^art\.(.+)\.b$/.exec(f);
    if(m) wldArtPut(m[1], 'b', String(v[f]));
  }
  saveWld();
  done(true);
}
/* What a field on this face shows: what has been typed, or what the language
   holds. */
function wldTyped(f){ return keepVal(keepKeyOf('world', ''), f); }
function wldSet(k, v){ keepSet(k, String(v||'')); }

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
/* All six take the article they are about, and answer for the OPEN language
   when nobody says otherwise. That default is what keeps every existing
   caller reading exactly as it did; the argument is how somebody else's
   article gets drawn by the same page instead of a second one written to
   look like it. 「このwikiのような感じにするんじゃないの？」 OWNER 2026-09-01. */
function wldArts(w){
  var a=(w||world()).arts;
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
/* Written into the section that is open. This is the one place a section's
   own fields are put on the language; the buffers above and below hand it
   what somebody typed. A section that has been deleted since is not found and
   nothing is written -- there is nothing left to write it on. */
function wldArtPut(id, k, v){
  var one=wldArtBy(id);
  if(!one) return;
  one[k]=String(v||'');
}
/* The body of a section, typed on the article's own editing face. The section's
   PAGE (vWldArt) has its own buffer -- it is a different screen, with a title
   on it as well. */
function wldArtSet(id, v){ keepSet(wldKeyArt(id), String(v||'')); }
/* ---- one section, on its own page --------------------------------------
   Two fields and one buffer, filed under the page. www/shell.js § KEEP. */
function wldArtKeepOn(one){
  if(langLocked()) return;
  keepOn(keepKeyOf('wldart', one.id),
         {t:String(one.t||''), b:String(one.b||'')},
         function(v, done){
           if(v.hasOwnProperty('t')) wldArtPut(one.id, 't', v.t);
           if(v.hasOwnProperty('b')) wldArtPut(one.id, 'b', v.b);
           saveWld();
           done(true);
         });
}
function wldArtOne(id, f){ return keepVal(keepKeyOf('wldart', id), f); }
function wldArtT(v){ keepSet('t', String(v||'')); }
function wldArtB(v){ keepSet('b', String(v||'')); }
wldRead();
/* The editor of the article, and it is laid out AS the article --
   「編集画面と表示画面全然あってないのはなに？どうやって表示させんの？編集画面で
   編集して作るんだろなんで独立してんだよ」 OWNER 2026-08-25, and that was right:
   the two screens had grown their own orders. What you write at the top of
   this one is what you read at the top of that one, section for section, in
   the order wldSecs() gives -- one list, asked by both, so they cannot drift
   apart again.

   The sections whose content is a chapter of the app are a way through to it
   and the one question that is theirs: whether somebody may take it away. The
   sounds are not here at all and cannot be -- a sound belongs to the letter
   that says it, so the inventory is written by drawing letters, not on this
   screen. */
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
  /* Both fields are typed into a buffer, so it has to exist before they are
     drawn out of it. */
  wldArtKeepOn(one);
  return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="field"><input id="wldart-t" value="'+esc(wldArtOne(one.id, 't'))+'" '+
      'placeholder="'+esc(t('wld.art.t.ph'))+'"' + IN('wldArtT') + '></div>'+
    '<textarea class="ntbody" style="min-height:260px" placeholder="'+esc(t('wld.art.b.ph'))+'" '+
      '' + IN('wldArtB') + '>'+esc(wldArtOne(one.id, 'b'))+'</textarea>'+
    /* The two answers are NOT here. They are in the section itself, on the
       article -- 「その中にトグル入れてくれる？」 -- and one thing is set in one
       place. This page is where the words are written; what may be seen of
       them is answered where they are read. */
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
function wldHidden(w){ return !!(w||world()).hide; }
/* From the settings, and it writes the LANGUAGE rather than SET: whether this
   language has a page is about this language, and SET is the person's. The
   flag is `hide`, so absent is public -- which is the default the owner chose,
   and a default that is the absence of a field is one no migration can get
   wrong. */
/* The switch, and the one thing about a language that is not a slice.
   `hide` is this phone's copy; `language.published_at` on the server is what
   actually decides whether anybody else may read the page (slice_read in
   supabase/schema.sql). Both move together or the two disagree, and the
   direction that disagrees badly is the server still saying published after
   somebody has turned it off here. */
function setWldHide(v){
  world().hide=!!v;
  saveWld();
  netLangPublic(!v);
  render();
}
/* Whether anybody may take the letters and the words away and use them.
   A different question from whether the page can be OPENED: somebody can
   read a language without being handed it. 「言語ページ公開と単語や文字の
   dl可能は別だし」

   `dl` is absent by default and absent means no. The page's own flag is the
   other way round -- absent is public -- because a page is a thing to be
   looked at; this hands over months of somebody's drawing, and the app does
   not decide that for them.

   Nothing SETS it any more, and that is the whole of it being here: the one
   switch that wrote it was a second copy of a switch this page already has,
   on the settings screen, and it went 2026-08-26. What is left is the answer
   a section falls back to when nobody has answered for that section --
   `wldSecDl` below. Every value already stored under `dl` is still stored and
   still read. */
function wldDl(w){ return !!(w||world()).dl; }
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
function wldSecOf(r, w){
  var s=(w||world()).secs, o;
  if(!s || typeof s!=='object' || (s instanceof Array)) return {};
  o=s[r];
  return (o && typeof o==='object' && !(o instanceof Array))? o : {};
}
/* Whether a SECTION is public was asked of every section and is not asked
   any more: 「単語と文字とキーボードと文法にDL可能だけつけろ」 and 「そもそもこの
   言語についてを公開非公開にするページつけて」 OWNER 2026-08-25 -- one answer, of
   the whole page, and it is `wldHidden()`. `secs[r].hide` is not read and not
   written now; anything already stored under it is left exactly where it is,
   because nothing here deletes what somebody's file already says. */
function wldSecDl(r, w){
  var o=wldSecOf(r, w);
  return Object.prototype.hasOwnProperty.call(o,'dl')? !!o.dl : wldDl(w);
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
function setWldSecDl(r, v){ wldSecSet(r, 'dl', v); }
/* The row on the profile, in place of the small tag that used to sit beside
   the handle. 「linguaパッチの代わり。Lingua > みたいになってて」 */
function wldRow(){
  /* A LANGUAGE WITH NO NAME YET STILL HAS A ROW, and it says so.
     「未設定って出てくればいいよ。プロフィールにね。」OWNER 2026-09-02.
     It returned nothing at all, so a language nobody had named had no row on
     the profile and therefore no way in to its article from here -- and the
     article was the one screen that would have let them name it. */
  var lnm=langNameSaid(langName);
  /* And while it is private it is not a way through at all --
     「そもそも非公開ならプロフィールから飛べないんだって」 OWNER 2026-08-25. It was
     a button either way, with a badge beside the name saying so, which is the
     app marking a door as shut and leaving it open. The row stays, because
     the name of the language is a fact of this profile and its owner is the
     one reading it; what goes is the press and the arrow.

     The way back is the same switch in the settings (www/settings.js), which
     is where it has always also been, so nothing is shut away by this. */
  if(wldHidden()) return '<div class="wldrow">'+
    '<span class="wldnm">'+esc(lnm)+'</span>'+
    '<span class="wldoff">'+esc(t('wld.hidden'))+'</span></div>';
  return '<button class="wldrow"' + DO('go', ["about"]) + '>'+
    '<span class="wldnm">'+esc(lnm)+'</span>'+
    ICON_GO+'</button>';
}
/* ---- a section of the article opens and shuts -------------------------
   「概要　▽ / 話してる場所 / 〇〇 みたいにして欲しい」 OWNER 2026-08-25, over a
   screenshot of ja.wikipedia.org, where every section of a mobile article is
   a heading with a marker and folds away under it.

   Which ones are open is where you are STANDING in the page, not something
   the language owns, so it is not in `wld` and is not saved. The line that
   forgets it belongs in viewReset() in www/shell.js with the rest of what a
   screen forgets; this session does not own that file, so it is reported
   rather than reached into.

   SHUT is the default. 「この言語については初手は全部閉じて」 OWNER 2026-08-26.
   It was open, and the argument for that was that nothing somebody has never
   touched should be folded away from them -- true of one section and wrong of
   five, because five open sections is a page you have to scroll past to find
   out what is on it. What the marker is FOR is choosing, and a page that has
   already chosen for you gives it nothing to do.

   So the map records what is OPEN, not what is shut: the empty map is the
   arriving state, and the arriving state is everything closed. */
var ABOPEN={};
function abShut(r){ return !ABOPEN[r]; }
function abToggle(r){ ABOPEN[r]=!ABOPEN[r]; render(); }
var ICON_FOLD='<svg class="ic abmk" viewBox="0 0 24 24" width="13" height="13" fill="none" '+
  'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" '+
  'aria-hidden="true"><path d="M5 9l7 7 7-7"/></svg>';
/* The mark on a chapter anybody may take away. An arrow down ONTO a line --
   「↓ / ー　こうじゃないの？」 OWNER 2026-08-25, and that is the shape everything
   that has ever meant "download" is.

   It was `ICON_INDN`, which is the keyboard editor's 「行を下へ」 and has its
   line at the TOP: an arrow leaving a line rather than arriving at one, which
   reads as moving something out. Reusing it here was one glyph asked to mean
   two things, and flipping it would have turned every 「行を下へ」 button in the
   keyboard into a download.

   Here rather than in www/glyph.js because that file is not this session's,
   and because `ICON_FOLD` above is already this chapter's own mark kept beside
   the screen it marks. When the chapters are put back together this belongs
   with the rest of them. */
var ICON_DL='<svg class="ic" viewBox="0 0 24 24" width="14" height="14" fill="none" '+
  'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" '+
  'aria-hidden="true"><path d="M12 4v10"/><path d="M8 10l4 4 4-4"/><path d="M4 20h16"/></svg>';
/* ---- the overview is the person's own list now -------------------------
   「メモじゃなくて概要に好きに追加したいこと並べればいいやん」 OWNER 2026-08-25.
   Four fixed facts and one box called 「メモ」 was what this page had; what it
   needed was rows somebody writes themselves -- a name and what it says --
   as many as they want, in the order they want. That is what an infobox IS.

   `k` may be empty. A row with no name is the paragraph an article opens
   with, which is exactly what the note was, and is why the note can become
   one of these without inventing a heading to put over it. */
function wldOvs(w){
  var a=(w||world()).ovs;
  return (Object.prototype.toString.call(a)==='[object Array]')? a : [];
}
function wldOvMint(){
  var id='O'+(new Date()).getTime().toString(36), n=0, a=wldOvs(), i, hit=1;
  while(hit){ hit=0; for(i=0;i<a.length;i++) if(a[i] && a[i].id===id) hit=1;
    if(hit){ n++; id='O'+(new Date()).getTime().toString(36)+n.toString(36); } }
  return id;
}
/* THE SECTION OPENS. A row put in behind a shut heading is a row nobody can
   see: the list grew and the page did not move. 「＋ を押したら概要が開く」
   OWNER 2026-09-06. `wldov` is the overview's own `r` in wldSecs(). */
function wldOvAdd(){
  var a=wldOvs();
  a.push({id:wldOvMint(), k:'', v:''});
  world().ovs=a; saveWld(); ABOPEN['wldov']=true; render();
}
/* One field of one row, put on the language. The buffer above hands it what
   was typed; a row deleted since is not found and nothing is written. */
function wldOvPut(id, f, v){
  var a=wldOvs(), i;
  for(i=0;i<a.length;i++) if(a[i] && a[i].id===id){ a[i][f]=String(v||''); return; }
}
function wldOvSet(id, f, v){ keepSet(wldKeyOv(id, f), String(v||'')); }
/* DELETE REVIEW is in docs/CHANGELOG.md with this change. What goes is one
   row of this list and nothing else: no other slice is touched, the four
   fixed facts are not rows and cannot be reached from here, and `note` --
   which a row may have been copied FROM -- is left where it is. */
function wldOvDel(id){
  var a=wldOvs(), i;
  for(i=0;i<a.length;i++) if(a[i] && a[i].id===id){ a.splice(i,1); break; }
  world().ovs=a; saveWld(); render();
}
/* The note becomes the first of those rows, with no name over it, and the
   note itself is NOT removed -- `wld.note` stays in the file exactly as it
   was. A migration copies and never removes what it read (docs/DATA_SAFETY).
   `ovnote` records that the copy has been made, so a person who then deletes
   the row does not get it back on the next launch: putting it back would be
   the app overruling somebody who had just said no. */
function wldNoteMigrate(){
  var w=world(), a;
  if(!w.note || w.ovnote) return;
  a=wldOvs();
  a.unshift({id:wldOvMint(), k:'', v:String(w.note)});
  w.ovs=a; w.ovnote=1; saveWld();
}
/* ---- moving a row by holding it -----------------------------------------
   「四角に入れてそれ長押しで上下移動できるようにすればいいやん」 OWNER 2026-08-25.
   Two arrows on every row were three buttons of furniture per row and the
   owner could not read the list past them: 「矢印何それ？見づらいわ」.

   The same gesture the alphabet already has (ltDragMount in www/letters.js):
   hold, and the row comes up under the finger; the rest move aside as it
   passes; the order is written ONCE, when the finger lifts, not on every
   swap. A press that travels before the delay is a scroll and is left alone,
   which is the only thing the delay is for.

   It is mounted on the document rather than on the list, because the list is
   rebuilt by every render and the call that would re-mount it lives in
   render() itself -- www/glyph.js, which this session does not own. One
   listener, added once, is also fewer than one per render.

   A container says which list it is with data-wdrag; a row says which row it
   is with data-wid. Nothing else here knows what a section or an overview
   row is. */
var WLDD=null;
function wldDragBox(el){
  while(el && el.getAttribute && !el.getAttribute('data-wid')) el=el.parentNode;
  return (el && el.getAttribute && el.getAttribute('data-wid'))? el : null;
}
function wldDragDown(e){
  var b=wldDragBox(e.target), p=e.touches? e.touches[0] : e;
  if(!b || !p || !b.parentNode || !b.parentNode.getAttribute('data-wdrag')) return;
  WLDD={el:b, g:b.parentNode, x:p.clientX, y:p.clientY, on:false, timer:0};
  WLDD.timer=setTimeout(wldDragLift, 380);
}
function wldDragLift(){
  if(!WLDD) return;
  WLDD.on=true;
  WLDD.el.className+=' lift';
  WLDD.g.className+=' moving';
}
function wldDragMove(e){
  var p=e.touches? e.touches[0] : e, kids, i, k, r;
  if(!WLDD || !p) return;
  if(!WLDD.on){
    /* Travelled before it was held: it was a scroll. */
    if(Math.abs(p.clientX-WLDD.x)>8 || Math.abs(p.clientY-WLDD.y)>8) wldDragOff();
    return;
  }
  e.preventDefault();
  kids=WLDD.g.childNodes;
  for(i=0;i<kids.length;i++){
    k=kids[i];
    if(!k || k===WLDD.el || !k.getAttribute || !k.getAttribute('data-wid')) continue;
    r=k.getBoundingClientRect();
    if(p.clientY>r.top && p.clientY<r.bottom){
      WLDD.g.insertBefore(WLDD.el, (p.clientY < r.top + r.height/2)? k : k.nextSibling);
      return;
    }
  }
}
function wldDragUp(){
  var g, kind, ids, kids, i;
  if(!WLDD) return;
  g=WLDD.g;
  if(WLDD.on){
    kind=g.getAttribute('data-wdrag');
    ids=[]; kids=g.childNodes;
    for(i=0;i<kids.length;i++)
      if(kids[i] && kids[i].getAttribute && kids[i].getAttribute('data-wid'))
        ids.push(kids[i].getAttribute('data-wid'));
    wldOrderTo(kind, ids);
  }
  wldDragOff();
}
function wldDragOff(){
  if(!WLDD) return;
  clearTimeout(WLDD.timer);
  if(WLDD.on){ render(); }
  WLDD=null;
}
/* The list is put back in the order the rows ended up in. Nothing is created
   and nothing is dropped: a row whose id is not in `ids` -- which cannot
   happen, but the file is somebody's -- keeps its place at the end rather
   than disappearing. */
function wldOrderTo(kind, ids){
  var a=(kind==='ovs')? wldOvs() : wldArts(), out=[], seen={}, i, j;
  for(i=0;i<ids.length;i++)
    for(j=0;j<a.length;j++)
      if(a[j] && a[j].id===ids[i] && !seen[ids[i]]){ out.push(a[j]); seen[ids[i]]=1; }
  for(j=0;j<a.length;j++) if(a[j] && !seen[a[j].id]) out.push(a[j]);
  if(kind==='ovs') world().ovs=out; else world().arts=out;
  saveWld();
}
/* A box that is written into gets taller instead of growing a scrollbar of
   its own inside a page that also scrolls -- 「これ長く書いて行った時下見えんの？」
   Two scrolling things one inside the other is how the bottom of what
   somebody wrote ends up somewhere nobody finds it.
   Delegated on the document and run once per keystroke on the one element
   that was typed into; and once after every render, because a box arrives
   already holding what was written last time. */
function wldGrow(el){
  if(!el || !el.className || el.className.indexOf('grow')<0) return;
  el.style.height='auto';
  el.style.height=(el.scrollHeight+2)+'px';
}
/* How tall a box has to arrive to hold what is already in it. The growing
   above happens on a keystroke, and a box that arrives full has had none --
   the line that would size them all after a render belongs in render()
   itself, which is www/glyph.js and not this session's. So the height is
   decided here, where the text is, and written as `rows`.
   Wrapping is counted at roughly thirty-four characters, which is what a line
   of this box holds on the narrowest phone: too many rows shows blank space
   and too few hides the end, and of the two only one loses somebody's words
   behind a second scrollbar. */
function wldRows(v, least){
  var s2=String(v||''), parts=s2.split('\n'), n=0, i;
  for(i=0;i<parts.length;i++) n+=1+Math.floor(parts[i].length/34);
  return Math.max(least||1, n);
}
document.addEventListener('input', function(e){ wldGrow(e.target); }, false);
document.addEventListener('touchstart', wldDragDown, false);
document.addEventListener('touchmove', wldDragMove, {passive:false});
document.addEventListener('touchend', wldDragUp, false);
document.addEventListener('touchcancel', wldDragUp, false);
/* What a section carries is ONE question and it is whether it may be taken
   away -- 「単語と文字とキーボードと文法にDL可能だけつけろ」 OWNER 2026-08-25.
   The per-section 公開 switch is gone entirely: whether anybody may see this
   at all is asked ONCE, of the page, at the top of this screen. Eight
   switches were asking a question the page had already answered.

   On the EDITOR and nowhere else -- 「なんで編集画面じゃないのにトグルが出て
   くんの？」. The article is what somebody else reads.

   ONE ROW, and the row is the section:

     文字　トグル / 単語　トグル / 文法　トグル / キーボード　トグル

   which is how the owner wrote it out, 2026-08-25. It was a heading with a
   fold marker and a way through to the chapter, and UNDER it a second row
   saying 「DL可」 -- two rows and three controls where the sentence has one
   of each. The name of the section is the label now: 「DL可能なやつね？」 says
   what the switch is, once, for all four, and what it means in full is behind
   the `?` in the bar where an explanation goes. The heading is gone with it,
   because a heading that folds nothing and a marker over nothing are the page
   claiming acts it cannot perform. */
function wldSecRows(sec){
  return '<button class="set"' + DO('setWldSecDl', [sec.r, !wldSecDl(sec.r)]) + '>'+
    '<span class="sl">'+esc(wldSecNm(sec))+'</span>'+
    swtHTML(wldSecDl(sec.r))+'</button>';
}
/* ---- what sections this article has, in one place ---------------------
   Named by the owner, 2026-08-25: 「概要▼ 言語が構成する音▼ 文字▼ 文法▼
   キーボード▼」, and 「単語入れるけどメモはなんで入れんの？」 -- so the lexicon
   is one and the notebook is not. The sound is 「音」, which the book already
   calls it (`toc.sound`); no new wording was invented for it.

   ONE list, asked by the article and by the editor both. The two were about
   to be two copies that could disagree about what a section even is, which
   is the fault this file's own comments keep being written after. */
function wldSecs(w){
  var out=[{r:'wldov', k:'wld.overview'}], a=wldArts(w), i;
  out.push({r:'sound',   k:'toc.sound'});
  /* `dl` marks the four that can actually BE taken away and used --
     「単語と文字とキーボードと文法にDL可能だけつけろ」 OWNER 2026-08-25, which is
     the later of two on the same day and the one in force. The earlier said
     three -- 「ダウンロードできるのは単語と文字とキーボードだって言ってんだろ」 --
     and the grammar was added to it. THIS COMMENT WENT ON SAYING THREE while
     the line below it said four, so the file argued with itself about what
     the owner had decided; the code was right and the sentence over it was a
     week out of date.

     The overview, the sounds, and anything somebody wrote are read; there is
     nothing to hand over, so the question is not asked of them. It was being
     asked of every one of them, including a section still called 「無題」. */
  out.push({r:'letters', k:'toc.letters', go:'letters', dl:1});
  out.push({r:'words',   k:'toc.words',   go:'words',   dl:1});
  out.push({r:'gram',    k:'toc.gram',    go:'gram',    dl:1});
  out.push({r:'kb',      k:'kb.title',    go:'kb',      dl:1});
  /* And then what somebody wrote, AFTER the ones the book always has --
     「見出しは全員わかりやすくしろよ」. A section called 「The valley」 sitting
     between 概要 and 音 reads as one of the article's own headings and is not
     one; below them it is plainly the part this person added. */
  /* `nm` is what a heading SAYS (an unnamed one says so); `t2` is what was
     actually typed, which is what the box on the writing face holds -- a box
     pre-filled with 「無題」 would make somebody delete a word they never
     wrote before they could put their own in. */
  for(i=0;i<a.length;i++) out.push({r:a[i].id, nm:a[i].t||t('wld.art.untitled'),
                                   t2:a[i].t||'', b:a[i].b||'',
                                   blank:!(a[i].t||a[i].b)});
  return out;
}
function wldSecNm(sec){ return sec.k? t(sec.k) : sec.nm; }
/* The same section with no way THROUGH it. `wldSecs()` stays the one list;
   this is one field of one row answered differently for a reader, and it is a
   copy rather than a delete so the list itself is never edited under anybody. */
function wldSecNoGo(sec){
  var o={}, k;
  for(k in sec) if(Object.prototype.hasOwnProperty.call(sec, k) && k!=='go') o[k]=sec[k];
  return o;
}
/* WHICH SLICES A SECTION IS, and a section can be more than one of them.

   All four -- 「あとdlは単語文字文法キーボード全部のはずだよね？」 OWNER
   2026-09-02. It was two for a week (letters and kb) because `slice_read` in
   supabase/schema.sql opened only five kinds on a published language and
   refused the dictionary and the grammar to everybody but their owner, so a ↓
   over either would have been a button that cannot land. That policy takes
   the section's own switch into account now -- `slice_dl()` in the same file --
   which is the shape 「言語ページ公開と単語や文字のdl可能は別だし」 asks for:
   publishing a page and handing a chapter over are two answers, and a reader
   is offered the intersection of them.

   THE GRAMMAR IS TWO SLICES. `phases` is the stages somebody built and `gram2`
   is the rules under them, and a grammar arriving with one and not the other
   is half a chapter. That is why this is a list per section rather than a
   name: one section, whatever it is made of.

   One place. `wldSecs()` says what the sections are and this says which slices
   each one is; a second list anywhere would be a ↓ that draws and does nothing
   the day one of them moves. */
var WLD_DL_KIND={letters:['letters'], words:['words'], gram:['phases','gram2'],
                 kb:['kb']};
function wldDlKind(r){
  return Object.prototype.hasOwnProperty.call(WLD_DL_KIND, r)? WLD_DL_KIND[r] : null;
}
/* One chapter of somebody else's language, and the way to take it. The name
   is the section's own -- 「文字」「キーボード」 -- because that is what it is;
   nothing here invents a word for downloading. */
function wldGetRow(sec, lid){
  /* NO PLAN IS ASKED HERE, because the press asks. wldGet() puts
     upStop(can('dl')) and dlStop() in front of the download -- the door and
     the ceiling -- so asking again while drawing the row would be the same
     question in two places.

     It used to say the row needed no plan because downloading letters and a
     keyboard was free; that was 2026-08-19 and 「plusからです」 OWNER
     2026-09-02 replaced it. `CAN.dl` is `plus` and has been since. */
  return '<button class="set"' + DO('wldGet', [String(lid||''), sec.r]) + '>'+
    '<span class="sl">'+esc(wldSecNm(sec))+'</span>'+
    '<span class="sv">'+ICON_DL+'</span></button>';
}
/* TAKING IT. The one road, and the end of it is localStorage.
   ------------------------------------------------------------------
   Everything before this had been built at least once: the switch that says a
   chapter may be taken, the mark that says so on the article, the 「読んでいる」
   list waiting for a row. What had never been built is this -- so
   `LANGS[id].mine` had never been false and the list was always empty.
   「ダウンロードボタン押しても言語追加されないけど？」 OWNER 2026-09-01.
   「いつまでもfalseだったとかやめてね。」

   It ADDS and does nothing else. Nothing of the person's own is read, written,
   renamed or counted differently -- docs/FEATURES.md § 4 and the decision log
   both say a download is never merged into what somebody made.

   The slices are already here: wldSlicesPull() fetched them to draw the page,
   so this asks that map rather than the network. A second request would be a
   second answer to 「what is in their language」, and the two could disagree
   in the second between the page being drawn and the button being pressed. */
function wldGet(lid, r){
  var id=String(lid||''), kinds=wldDlKind(r), m=WLDS_HAVE[id], seen=wldSeen(id),
      got=[], i, o;
  if(!id || !kinds || !kinds.length) return;
  /* WHETHER, AND THEN HOW MANY. 「plusからです」「plusは1つproは3つ」OWNER
     2026-09-02. Both asked here, in the one place a download happens, and in
     that order: the plan is the door and the ceiling is the room. Neither
     asks anything of a language already taken -- a plan that ends leaves
     every downloaded language where it is, readable, which is the head of
     docs/PAID_FEATURES.md.

     A chapter of a language ALREADY taken does not meet the ceiling again:
     it is not another language, it is more of one that is already counted. */
  if(upStop(can('dl'))) return;
  if(!LANGS[id] && dlStop()) return;
  /* Nothing to take is not a failure to report: the page is drawn from the
     same map, so a row can only be on screen when the answers are in. */
  if(!m) return;
  /* EVERY SLICE THE SECTION IS, OR NONE OF THEM. The grammar is `phases` and
     `gram2`, and half a chapter written down is worse than none: it would sit
     in the index looking like a grammar somebody could open. So they are
     gathered first and written after. A slice the owner never wrote is not a
     missing half -- it is a language with nothing of that kind in it -- so an
     empty body is skipped rather than refusing the lot. */
  for(i=0;i<kinds.length;i++){
    o=m[kinds[i]];
    if(o && o.body) got.push([kinds[i], o.body]);
  }
  if(!got.length) return;
  /* The index row FIRST, so a slice can never be in storage under a language
     the index does not know -- that is a set of keys nothing can find, which
     is the leftovers bug langKeyOf() exists to prevent. */
  langSeenAdd(id, seen? seen.name : '');
  try{
    for(i=0;i<got.length;i++) slWr(langKeyOf(id, got[i][0]), got[i][1]);
  }catch(e){ return; }
  /* And the language's own name where a language keeps it, so the one in the
     index and the one in the language cannot drift. `lang` is a slice like
     any other and langRead() is what reads it. */
  if(seen && seen.name){
    slWr(langKeyOf(id, 'lang'), seen.name);
  }
  render();
}
/* A heading that folds, and it is the only kind this page has now. It used to
   sit beside `.abts`, an <h2> -- a button and an h2 as siblings in one list
   are two heights, which is what press measures. `6dc9e0e` took the sections
   out and `.abts` went with its last wearer; its rule came out of
   www/index.html in the commit that closed this. */
/* The inventory, in rows: each manner that this language actually uses, then
   its vowels, then anything the chart files under neither. */
/* `list` is whose sounds. The open language's when nobody says. */
function abSounds(list){
  var mine=list||addedSnd(), out='', ms=ipaManners(), i, got, rest=mine.slice();
  function take(list){
    var k=[], j;
    for(j=0;j<rest.length;j++) if(list.indexOf(rest[j])>=0) k.push(rest[j]);
    for(j=0;j<k.length;j++) rest.splice(rest.indexOf(k[j]), 1);
    return k;
  }
  for(i=0;i<ms.length;i++){
    got=take(ipaOfManner(ms[i]));
    if(got.length) out+=abField(t('ipa.m.'+ms[i]), got.join('  '));
  }
  got=[];
  for(i=0;i<rest.length;i++) if(ipaIsVowel(rest[i])) got.push(rest[i]);
  for(i=0;i<got.length;i++) rest.splice(rest.indexOf(got[i]), 1);
  if(got.length) out+=abField(t('ipa.vows'), got.join('  '));
  if(rest.length) out+=abField(t('ipa.other'), rest.join('  '));
  return out? '<div class="abfx">'+out+'</div>' : '';
}
/* EVERY HEADING ON THIS PAGE FOLDS, and that is why there is no second kind.
   There used to be one: a section whose whole content was the chapter it
   points at had nothing to open, so it was drawn as a plain row with no
   marker (`.abshp`). The only two were the dictionary and the grammar, and
   they are not sections of the article any more -- 「見れないならいらなく
   ね？」OWNER 2026-09-02 -- and the reading face now drops anything with
   nothing under it before it gets here. `press` found the class worn by
   nothing on any screen, before or after any press, which is what says the
   branch had stopped happening rather than merely stopped being noticed. */
function abHead(sec, extra){
  return '<div class="abshd'+(abShut(sec.r)? ' shut':'')+'">'+
    '<button class="abshf"' + DO('abToggle', [sec.r]) + '>'+
      ICON_FOLD+'<span class="abshl">'+esc(wldSecNm(sec))+'</span></button>'+
    (extra||'')+
    (sec.go? '<button class="abshg"' + DO('go', [sec.go]) + '>'+ICON_GO+'</button>' : '')+
    '</div>';
}
/* A fact of the overview: what it is called, and under it what it says.
   NOT side by side -- 「話してる場所　あああ みたいにやるのやめて」. */
function abField(k, v){
  return '<div class="abfd"><div class="abfk">'+esc(k)+'</div>'+
    '<div class="abfv">'+esc(v)+'</div></div>';
}
/* ---- the article, read and written on the same page ---------------------
   「もういいよこうやって編集してくれ」 OWNER 2026-08-25, over a screenshot of
   ja.wikipedia.org's mobile editor: a bar across the top and the ARTICLE
   underneath it, written on where it stands.

   There is no separate editor screen any more. There were two screens with
   two layouts for one thing, and every round of this chapter has been spent
   on the gap between them 「編集画面と表示画面全然あってないのはなに？」. One
   function draws both now, so a section cannot appear in one and not the
   other: `ed` is the only difference, and it swaps a piece of text for the
   box it is written in, in the place it already sits.

   `about` is the reading face and `world` is the writing one -- the same
   page, and 編集 stays where it is rather than going anywhere. */
/* SOMEBODY ELSE'S LANGUAGE, as much of it as the server will say.
   「言語の詳細は？」 OWNER 2026-09-01.

   `language_seen` in supabase/schema.sql answers with a published language or
   one of your own and with NOTHING for anybody else's private one, so what is
   drawn here is only ever what its owner opened. `null` is that refusal and is
   not an empty language -- the screen says nothing rather than drawing a
   language with no words in it.

   Asked once per language. Only a request that could not be MADE is asked
   again, which is the shape whoPull() already takes. */
var WLD_HAVE={}, WLD_ASKED={};
function wldSeenPull(lid){
  var id=String(lid||'');
  if(!id || WLD_ASKED[id]) return;
  WLD_ASKED[id]=1;
  netLangSeen(id, function(L){
    if(!L) return;
    WLD_HAVE[id]=L;
    render();
  }, function(){ WLD_ASKED[id]=0; });
}
function wldSeen(lid){ return WLD_HAVE[String(lid||'')] || null; }
/* THE ARGUMENT IS WHOSE. With none this is your own article, drawn from the
   open language by wldPage(); with a language's id it is somebody else's, and
   NOT ONE LINE of it comes off the open language -- rule 8, and the reason the
   door to this page was shut until now: it drew `world()`, `LETTERS` and
   `langName`, so pressing somebody else's language showed them mine.

   What is drawn is what `language_seen` counts: the name, how many words, how
   many letters, and the day it was opened. **The dictionary does not move** --
   `slice_read` keeps `words` shut to everybody, and a number is not a word.
   「言語ページ公開と単語や文字のdl可能は別だし」 */
function vAbout(){
  var a=String(here().a||'');
  if(!a) return wldPage(false);
  /* Both: the row says the language is published and gives it its name, and
     the slices are what the page is made of. */
  wldSeenPull(a);
  wldSlicesPull(a);
  return wldPage(false, wldSeenOf(a), a);
}
/* Named for the world and not for the view. The checks find a screen by its
   NAME -- a global that is `v` plus a capital -- so a helper named that way is
   a screen on no route, and act-check said so the moment this was written. */
/* A letter of somebody else's alphabet: drawn, named, and nothing else.
   ltCell() is the one on your own and carries two marks this cannot have --
   whether another of YOUR letters already says that sound, and whether a
   digit is past YOUR base. Both read the open language, and both mean nothing
   about a language you are only reading. The face and the name still come
   from the one place each lives: ltInk() and ltName(). */
/* AND THE FACE IS HANDED OVER RATHER THAN LOOKED UP. The cell used to ask
   ltInk() for a `.tc` canvas, which geTiles() fills by asking inkOf() for the
   letter of that id in the OPEN language -- so somebody else's alphabet was a
   grid of empty squares with the right names under them.
   「人のwikiページ開いても文字表示されない」 OWNER 2026-09-03.

   ABLTS is what this page just drew, in the order it drew it, and abInkMount()
   fills the canvases out of it. Same shape as PFACE in www/post.js: a post's
   face is on the post, not in LETTERS, and this is the same sentence about an
   alphabet. It is set here rather than worked out again at mount time, because
   a second copy of "which letters, in what order" is a copy that agrees with
   itself and not with the page. */
var ABLTS=[];
function abLtCell(l, i){
  ABLTS[i]=l;
  return '<span class="ltc">'+
    '<span class="ltcf">'+ltInk(l, '', '', i)+'</span>'+
    '<span class="ltcn">'+esc(ltName(l)||'\u00b7')+'</span>'+
    '</span>';
}
/* Every reader's canvas on the page, filled from the letters themselves.
   Called from render() beside geTiles(), and it finds nothing and does
   nothing on a screen that has none. */
function abInkMount(){
  var ls=ABLTS;
  inkCanvases('canvas.tcx', 48, 72, function(c){
    var l=ls[parseInt(c.getAttribute('data-i'), 10)];
    return l? inkGeo(l) : null;
  });
}
/* The slices of somebody else's language. `slice_read` opens exactly five of
   them on a published one -- wld, script, snd, letters, kb -- and refuses the
   dictionary and the grammar to everybody, which is why nothing here asks for
   words and nothing here could show them.
   「言語ページ公開と単語や文字のdl可能は別だし」 */
var WLDS_HAVE={}, WLDS_ASKED={};
function wldSlicesPull(lid){
  var id=String(lid||'');
  if(!id || WLDS_ASKED[id]) return;
  WLDS_ASKED[id]=1;
  netSlices(id, function(m){
    if(!m) return;
    WLDS_HAVE[id]=m;
    render();
  }, function(){ WLDS_ASKED[id]=0; });
}
/* One slice, read back into what it was. A slice holds exactly the string
   localStorage holds, so this is the same JSON.parse the app does on its own
   -- and a slice that is not there, or is not readable, is `fb` rather than
   an exception: an unpublished section is a section with nothing to show,
   not a broken page. */
function wldSliceOf(m, kind, fb){
  var o=m && m[kind], v;
  if(!o || !o.body) return fb;
  try{ v=JSON.parse(o.body); }catch(e){ return fb; }
  return (v===null || v===undefined)? fb : v;
}
/* SOMEBODY ELSE'S LANGUAGE AS A BUNDLE, answering the same seven questions
   wldOpen() answers -- so the SAME page draws it. 「このwikiのような感じに
   するんじゃないの？」 OWNER 2026-09-01: not a second screen, this one.

   It always answers. It used to be NULL while the two answers were out, and
   whoever asked then had to draw the waiting page itself -- which is how this
   route came to have two functions drawing it. `here` is the seventh question
   and it is the whole of that: your own language is always here, somebody
   else's is here once its slices are, and the one page decides what a page
   that is not here yet looks like.

   Not one of the eight reaches the open language. `ws` answers with nothing,
   because the writing system is `SET.wsys` -- the PERSON's settings, not the
   language's -- so it is on no server and there is nothing to say; the field
   is left off rather than filled in with mine. */
function wldSeenOf(lid){
  var m=WLDS_HAVE[String(lid||'')], seen=wldSeen(lid);
  return {
    /* Nothing while the answers are out, and nothing when the answer was no --
       an unpublished language is one language_seen and slice_read both refuse,
       and a page saying a language is empty would be saying something it was
       never told. */
    here:    function(){ return !!m; },
    w:       function(){ return wldSliceOf(m, 'wld', {}); },
    letters: function(){ return wldSliceOf(m, 'letters', []); },
    name:    function(){ return seen? seen.name : ''; },
    ws:      function(){ return ''; },
    snd:     function(){ return wldSliceOf(m, 'snd', []); },
    /* Off their `script` slice, which is one of the five slice_read opens.
       DIRS is the list of the four; anything else, or nothing, is ltr. */
    dir:     function(){
               var d=(wldSliceOf(m, 'script', {}) || {}).dir;
               return (DIRS.indexOf(d)>=0)? d : 'ltr';
             },
    mine:    function(){ return false; }
  };
}
function vWorld(){
  /* The note becomes a row of the overview the first time this is opened.
     It cannot be done at load: saveWld() touches the backup and backup.js is
     loaded after this file, which is why migrateWorld() runs from boot.js. */
  wldNoteMigrate();
  /* Every box on this face is typed into one buffer, so it has to exist before
     any of them is drawn out of it. */
  wldKeepOn();
  return wldPage(true);
}
/* THE LANGUAGE THIS PAGE IS ABOUT, as a bundle of questions rather than as
   the open language.

   `wldPage()` opened by reading `world()`, `LETTERS`, `langName` and
   `wsys()` -- every one of them a global meaning "the one in front of me". That is right for your own article and is rule 8's worked
   example for anybody else's: a door to somebody's language page drew THEM at
   the top and MY language underneath, which is why the door was closed
   (「この言語についてで人のをタップしても自分のが出る」 OWNER).

   Eight questions -- count them off the two bundles below, not off this line
   -- so a reader's copy can answer them from what came off the server
   instead. **Functions and not values**, because some are only asked inside
   branches (the writing system on two faces), and an eager read would ask
   about every article that has no such section on it. Lazy keeps the call
   order exactly as it was.

   This is the prepared half. Nothing yet builds one of these from anybody
   else's language: the address arrives with `netWho()`'s `lid` and the slices
   come back through `netSlices()`, and until a reader's bundle is built and a
   route shows it, `wldOpen()` is the only one there is and the page is
   unchanged. Held to that: the four faces of this page (en/ja x free/pro)
   render byte-for-byte identically before and after. */
function wldOpen(){
  return {
    /* Always. The one in front of you needs nothing off a network. */
    here:    function(){ return true; },
    w:       function(){ return world(); },
    letters: function(){ return LETTERS; },
    name:    function(){ return langName; },
    ws:      function(){ return wsys(); },
    /* The sounds the language is made of, and whether this article is YOURS --
       the Edit button and the pressable letter cells are the two things that
       are only true of your own. */
    snd:     function(){ return addedSnd(); },
    /* Which way it is written. `scriptDir()` reads SCRIPT -- the open
       language's -- and it is in the `script` slice for anybody else's. */
    dir:     function(){ return scriptDir(); },
    mine:    function(){ return true; }
  };
}
/* THE PAGE ITSELF -- the bar, the Edit in its corner, and the body under it.
   wldPage() ends in two places, because a language nobody may open stops at
   its heading, and the two were writing this out identically. The condition
   was in both: Edit is only on your own. 「Edit は出ません（他人のものなので）」
   -- and `mine` is whose ARTICLE this is, which is a different question from
   whether the OPEN language may be changed: a downloaded language opened from
   the switcher draws its own article with mine true. langLocked() answers the
   second. Who may edit is one decision, so it is asked once.

   IT IS THE BAR AND THE BODY, AND NOT THE PAGE. Written to return the whole
   page it BECAME the drawer of this route -- page-check watches the innermost
   function whose return value IS what the view returned, so `about` came back
   drawn by two functions and the gate went red on rule 21. The frame is a
   piece wldPage() puts in; wldPage() is what draws this route. */
function wldFrame(body, ed, mine){
  return navTop('', (!ed && mine && !langLocked())?
      navDo(t('wld.edit'), 'go', ["world"], true) : '')+
    '<div class="body">'+body+'</div>';
}
function wldPage(ed, L, lid){
  var w, mine, drawn, body='', dls='', done, i;
  L=L||wldOpen();
  /* NOT HERE YET, and that is a face of this page rather than a page of its
     own. Somebody else's article arrives in two answers off the network, and
     this is what stands while they are out -- or when the answer was no.

     It is drawn HERE and by nothing else, and that is rule 21: this route had
     a second function on it for exactly this line, because the caller was
     handed a null bundle and had to decide what a page with no language on it
     looked like. Nobody decides that but the page. */
  /* AND IT SAYS IT IS WAITING RATHER THAN SHOWING NOTHING.
     「一瞬消えたりが嫌だからローディングで誤魔化してほしい」OWNER 2026-09-02.
     An empty body and a page with nothing on it look identical, and this is
     the first of the two while the answer is out. snsWaitHTML() is the mark
     the timeline already turns while it waits -- one place, one sentence. */
  if(!L.here()) return '<div class="view">'+navTop('')+
    '<div class="body">'+snsWaitHTML()+'</div></div>';
  w=L.w(); mine=L.mine(); drawn=L.letters().filter(ltHasShape);
  /* The article names its subject: the bar says which SCREEN this is, and the
     page has to say what the article is ABOUT. The name of a language is not
     written here -- it is the language's own, and it is set where a language
     is set -- so it stays a heading in both faces. */
  /* The article always has its heading, named or not: 「言語名なくても
     wikiページは出してほしい」OWNER 2026-09-02. Without one the page had no
     title and, with nothing written under it either, came out blank. */
  body+='<h1 class="abth">'+esc(langNameSaid(L.name()))+'</h1>';
  /* Whether the page exists for anybody else at all. Only while writing:
     a state with no way to change it does not belong on the reading face. */
  if(ed) body+='<button class="set"' + DO('setWldHide', [!wldHidden()]) + '>'+
    '<span class="sl">'+esc(t('wld.shown'))+'</span>'+
    swtHTML(!wldHidden())+'</button>';
  /* And a page nobody may open is the NAME and nothing else --
     「非公開にする場合は言語名しか表示されない」「非公開にしたら編集画面が全部
     非表示になる感じ」 OWNER 2026-08-25.

     Both faces stop here, and they stop at different lines on purpose. The
     article stops above the switch, because there is no switch on it: what is
     left is the heading, which is the one thing a language still says about
     itself when it says nothing else.

     The EDITOR stops BELOW it, and the one row it keeps is the switch that
     put it here. 「一番上のトグル」 is what the owner called it, and it is the
     way back: a screen that hid its own way out would be a language shut
     away with nothing on the phone able to open it again. docs/keyboard.md
     carries the same trap written out in four steps -- a face reached by a
     key nobody placed -- and it is a manual page standing in for the thing
     working. Not here.

     Nothing is deleted and nothing is unset. `hide` is one flag, the sections
     keep their own answers, and every word is where it was: turning the
     switch back on brings the whole page back exactly as it was left. */
  if(wldHidden(w)) return '<div class="view">'+wldFrame(body, ed, mine)+'</div>';
  wldSecs(w).forEach(function(sec){
    var inner='', extra='';
    /* Two of the sections do not reach the writing face at all, and both are
       the same sentence: 「文字とか単語とかはここで編集しないからこれしか出ない」
       OWNER 2026-08-25.

       The SOUNDS are not on the owner's list. They are not written here in
       either face -- a sound belongs to the letter that says it -- so the
       inventory was five rows of somebody else's chapter standing between the
       overview and the four switches. It is on the article, where it is
       something to read.

       And the FOUR are one row each and nothing else: the name and the
       switch. 「これしか出ない」 is the whole of what the editor shows for
       them, so the section returns here rather than going on to grow a
       heading, a fold marker and a way through. */
    if(ed && sec.r==='sound') return;
    /* And THREE that are not on the ARTICLE. 「単語と文法とはdl専用だから
       見れなくていいのよ？」 OWNER 2026-08-25 named two, and
       「キーボードの枠自体消していいよ」「DLボタンは消すなよ？」 OWNER
       2026-09-02 makes it three: the keyboard's frame goes and the ↓ stays.
       All three are handed over rather than looked at: what the switch below
       opens is the file, and the rows they drew here were a heading and an
       arrow into this phone's own chapters, which is a way through that means
       nothing to anybody but their owner. What is left to READ is the
       overview, the sounds and the letters. */
    /* And what MAY be taken away says so, where it is --
       「DL許可が出てるものはDLマークつけないと」 OWNER 2026-08-25. It is on the
       article and not on the editor: the switch is the answer on the writing
       face, and this is what that answer looks like to somebody reading.

       ON YOUR OWN ARTICLE ONLY. This mark is the answer to 「may other people
       take this?」, which is a thing to know about your own language and
       nothing at all on somebody else's -- there, the answer is not a mark,
       it is the ↓ you press, and it is collected into its own section at the
       foot with the others. It was a `<span>` on both faces, carrying no
       action, which is what the owner pressed:
       「ダウンロードボタン押しても言語追加されないけど？」 OWNER 2026-09-01. */
    /* THE ↓ MARK IS OFF THE ROWS, and that is what makes the two articles
       one article. 「自分のページでも人のページでも見た目は一緒にしてよ
       なんで変える必要あんの？」 OWNER 2026-09-02.

       It was drawn on your own rows and not on anybody else's, so the same
       page carried a mark on four rows or on none depending on whose it was.
       This SUPERSEDES 「DL許可が出てるものはDLマークつけないと」 OWNER
       2026-08-25 for the reading face, and nothing it was for is lost: on
       somebody else's article the ↓ is the row at the foot that actually
       takes the chapter, and on your own, whether other people may take one
       is the four switches on the writing face -- 「文字とか単語とかはここで
       編集しないからこれしか出ない」. */
    /* The row that actually takes it, and ONLY on somebody else's article.
       「自分のページに↓はいらん　それだけの違いでしょ」OWNER 2026-09-02.

       The article is one page and it reads the same either way -- the
       headings, what opens, the letters. The ↓ is not part of
       that: it is somebody TAKING the chapter, and what is already yours
       cannot be taken. It was drawn on both for a day, on the argument that
       the page should be exactly what a reader sees; the owner's answer is
       that this one row is the difference and there is no other. */
    if(!ed && !mine && sec.dl && wldSecDl(sec.r, w) && wldDlKind(sec.r))
      dls+=wldGetRow(sec, lid);
    /* Held back rather than drawn here: the four go at the FOOT of the
       screen, under everything somebody writes -- 「dlのやつは一番下にして」
       「上の概要とセクションに混ざらないようにして」 OWNER 2026-08-25. Standing
       between 概要 and the sections, four switches read as sections of the
       article that happen to carry a switch, and they are not sections at
       all: they are one question asked about four chapters that live
       elsewhere. */
    /* NOT A HEADING ON THE ARTICLE AT ALL, ON EITHER PAGE.
       「単語と文法とはdl専用だから見れなくていいのよ？」 OWNER 2026-08-25, and
       「見れないならいらなくね？」 2026-09-02.

       A dictionary and a grammar are handed over rather than looked at, so
       there is nothing to fold open under either heading -- and that is what
       they were: a row with no `›` marker beside the ones that have one, in
       a list where every other row opens. 「これ治ってないやんけ」 OWNER
       2026-09-02, on their OWN article, where the two still stood because a
       ↓ mark had been reason enough to draw a heading.

       AND THE KEYBOARD WITH THEM, for a different reason.
       「キーボードの枠自体消していいよ」「DLボタンは消すなよ？」 OWNER
       2026-09-02. That one was never an empty heading: it had a heading, a
       fold, and a picture of the real keys wearing the real letters under it.
       It goes anyway, and only the picture goes -- the ↓ is drawn above this
       line and is untouched, so somebody else's keyboard is still a chapter
       that can be taken.

       It is not, and the mark is not lost: on somebody else's article the ↓
       is a row at the foot with the others (`dls` below), where the owner put
       it -- 「dlのやつは一番下にして」「上の概要とセクションに混ざらないように
       して」. On your own, whether other people may take a chapter is answered
       on the WRITING face, which is the four switches and is the whole of
       what that face shows for them: 「文字とか単語とかはここで編集しないから
       これしか出ない」.

       What is left to READ is the overview, the sounds and the letters. */
    if(!ed && (sec.r==='words' || sec.r==='gram' || sec.r==='kb')) return;
    if(ed && sec.dl){ dls+=wldSecRows(sec); return; }
    if(sec.r==='wldov'){
      if(ed){
        /* The two the app asks for, then the ones somebody adds. Each is the
           line it will be read on, with a rule under it and nothing else --
           「項目名とか入れなくていいから。アンダーバーでいいだろ」. */
        /* These two keep their names above them and the rows somebody adds do
           not. It is not an inconsistency: a row somebody wrote says what it
           is in the words they chose, and these two do not -- 「a valley」
           with nothing over it could be anything, and it is what the reading
           face has over it as well. */
        inner+='<div class="abfk">'+esc(t('wld.where'))+'</div>'+
          /* These two had no id at all -- lnField() needs one to be grown
             by name, and nothing else in the app points at them, so the id
             is new and carries nothing. */
          '<div class="field">'+
          lnField('wld-where', t('wld.where.ph'), IN('wldSet', ["where"]), wldTyped('where'))+
          '</div>'+
          '<div class="abfk">'+esc(t('wld.who'))+'</div>'+
          '<div class="field">'+
          lnField('wld-who', t('wld.who.ph'), IN('wldSet', ["who"]), wldTyped('who'))+
          '</div>'+
          (L.ws()? abField(t('ws.kind'), t('ws.k.'+L.ws())) : '')+
          abField(t('dir.title'), t('dir.'+L.dir()))+
          '<div class="ovlist" data-wdrag="ovs">'+
          wldOvs().map(function(row){
            return '<div class="ovrow" data-wid="'+esc(row.id)+'">'+
              '<div class="ovtop">'+
                /* No placeholder over it: 「項目名とか入れなくていいから。
                   アンダーバーでいいだろ」 OWNER, and again 2026-08-25 --
                   「上の項目名とかは何？いらなくない？」. The line was doing
                   exactly what that sentence forbids: the words 「項目名」 sat
                   in the box, so every row somebody had not named yet said
                   the name of the thing instead of nothing. What names a row
                   is what the person typed, and what marks the box is the
                   rule under it. */
                /* One per row, so the id carries the row's own. */
                '<div class="field ovk">'+
                  lnField('wld-ov-'+row.id, '', IN('wldOvSet', [row.id, "k"]),
                          wldTyped(wldKeyOv(row.id, 'k')))+
                '</div>'+
                /* 「消したかったらマイナスボタン」 OWNER 2026-08-25. It was a
                   cross, which is what CLOSES a thing; the pair the owner
                   drew is ＋ and −, and the ＋ that puts the row in is two
                   lines above. */
                '<button class="ovx"' + DO('wldOvDel', [row.id]) + ' aria-label="'+
                  esc(t('wld.ov.del'))+'">'+ICON_MINUS+'</button>'+
              '</div>'+
              '<textarea class="ntbody grow" rows="'+wldRows(wldTyped(wldKeyOv(row.id, 'v')), 1)+'" '+
                'placeholder="'+esc(t('wld.ov.v.ph'))+'"'+
                IN('wldOvSet', [row.id, "v"]) + '>'+
                esc(wldTyped(wldKeyOv(row.id, 'v')))+'</textarea>'+
              '</div>';
          }).join('')+'</div>';
        extra='<button class="abshg"' + DO('wldOvAdd') + ' aria-label="'+
          esc(t('wld.overview'))+'">'+ICON_ADD+'</button>';
      } else {
        if(w.where) inner+=abField(t('wld.where'), w.where);
        if(w.who) inner+=abField(t('wld.who'), w.who);
        if(L.ws()) inner+=abField(t('ws.kind'), t('ws.k.'+L.ws()));
        inner+=abField(t('dir.title'), t('dir.'+L.dir()));
        if(!w.ovnote && w.note) inner+='<div class="abfv">'+esc(w.note)+'</div>';
        wldOvs(w).forEach(function(row){
          if(!row || !(row.k || row.v)) return;
          inner+=row.k? abField(row.k, row.v) : '<div class="abfv">'+esc(row.v)+'</div>';
        });
      }
      if(inner) inner='<div class="abfx">'+inner+'</div>';
    } else if(sec.r==='sound'){
      /* The sounds the language is made of, in the rows a phonology has. They
         are not written here in either face: a sound belongs to the letter
         that says it, so this inventory is made by drawing letters. */
      inner+=abSounds(L.snd());
    } else if(sec.r==='letters'){
      /* The letters somebody has actually drawn. The article only -- the four
         above return before they reach here. */
      /* Somebody else's letters are drawn and not pressable, and they are
         not drawn by ltCell(): that cell asks ltTaken() and numOver(), which
         read LETTERS and the open language's base -- so a reader's alphabet
         would be marked up against MY language. Rule 8. abLtCell() below is
         the reader's, and it goes through ltInk() and ltName(), which are
         where a letter's face and a letter's name live for everybody. */
      /* abLtCell() on both faces of the page, whoever's language it is.
         ltCell() asks ltTaken() and numOver(), which read LETTERS and
         the open language's base, so it can only ever be right about your
         own -- and it is a DIFFERENT CELL, which is a page that changes shape
         depending on whose it is. 「見た目は一緒にしてよ」 */
      /* Not `.map(abLtCell)`: it takes the index now, and a two-argument
         function handed bare to map is the fault sides-check refuses -- it is
         how postRow() came to wear my font on every row but the first. Here
         the index is wanted, so it is passed on purpose and it says so. */
      if(drawn.length){
        ABLTS=[];
        inner+='<div class="ltgrid abtlt">'+
          ltOrder(drawn).map(function(l, i){ return abLtCell(l, i); }).join('')+
          '</div>';
      }
    } else if(sec.nm!==undefined){
      /* A section somebody wrote, and it is a SECTION on both faces --
         「追加したセクションも概要と同じ文字サイズだし▼で隠せるようにして編集でも」
         OWNER 2026-08-25. It was the one heading on this screen that was not
         one: a small title field where 概要 has a heading, no marker, nothing
         to fold. 「概要だけ文字でかいし ▼ これついてる」 -- one list where one row
         is a heading and the next is a field is two kinds of thing wearing one
         list's shape.

         The heading is the name now, at the size every other heading is, and
         what is under it folds away. The name itself is typed where the words
         are, on the section's own page -- 「そこだけの画面だから下にも上にも
         いかないその中で完結」 -- which the ＞ leads to and which ＋ opens on the
         day a section is made. */
      if(ed) inner+='<textarea class="ntbody grow" rows="'+
        wldRows(wldTyped(wldKeyArt(sec.r)), 3)+'" '+
        'placeholder="'+esc(t('wld.art.b.ph'))+'"' + IN('wldArtSet', [sec.r]) + '>'+
        esc(wldTyped(wldKeyArt(sec.r)))+'</textarea>';
      else if(sec.b) inner+='<div class="abtl">'+esc(sec.b)+'</div>';
      if(ed) extra='<button class="abshg"' + DO('go', ["wldart", sec.r]) + '>'+
        ICON_GO+'</button>';
    }
    /* A section somebody has neither named nor written is not on the reading
       face -- a heading reading 「無題」 over nothing is a promise the page
       does not keep -- but it IS on the writing one, because that is where it
       gets its name. */
    if(sec.blank && !ed) return;
    /* AND THE SAME SENTENCE ABOUT SOMEBODY ELSE'S PAGE, said once instead of
       four times. 「それって人の言語見る画面だよね？見れないならいらなくね？」
       OWNER 2026-09-02. A heading with nothing under it and nothing to press
       is a promise the page does not keep, so on a stranger's article it is
       not drawn at all.

       The keyboard no longer reaches this line -- it returns above, with the
       dictionary and the grammar 「キーボードの枠自体消していいよ」. What is
       left for this to catch is a chapter that HAS a face and happens to be
       empty: no sounds named, no letters drawn.

       The ↓ is not lost by this. It was collected into `dls` above, and the
       foot of the page is where it goes -- so a chapter that can be TAKEN and
       not READ is a row at the bottom, which is what it is.

       On your own article a heading with nothing under it still stands: it is
       the way IN to a chapter that is yours, and the `›` beside it works. */
    if(!ed && !inner) return;
    /* ONE `›` TO A ROW, AND ON YOUR OWN ARTICLE TOO.
       「›の位置を統一する」, and again 「＞＞が二つあるのが嫌だって話前にした
       よね？」 OWNER 2026-09-02.

       This was applied to somebody else's article only, on the argument that
       on your own both arrows are yours and both work. They are, and it is
       still two of the same mark on one row pointing at two different things
       -- which is the thing the owner said they did not want, said about a
       row rather than about whose row it is.

       `sec.go` is the way into this phone's own chapter -- the letters. It is
       not lost: that chapter is on the contents page, which is where you go
       to a chapter. What the article is for is reading, and
       the mark on the left is what opens what there is to read. */
    body+=abHead((!ed && sec.go)? wldSecNoGo(sec) : sec, extra)+
          ((!inner || abShut(sec.r))? '' : inner);
  });
  /* And the way to put another section in, at the end of the ones there are,
     which is where a new section of an article goes. */
  if(ed) body+='<button class="set"' + DO('wldArtAdd') + '>'+
    '<span class="sl">'+esc(t('wld.secs'))+'</span>'+
    '<span class="sv">'+ICON_ADD+'</span></button>';
  /* And then, under the last thing on the page, what may be taken away.
     「後トグルだけあってもわからないからちゃんとDL云々って書いといて」 OWNER
     2026-08-25 -- four switches in a column say nothing about what they
     switch, and the answer is not a sentence on the screen: it is the word
     over them, which is what a heading is for. What it means in full is
     behind the `?` in the bar. */
  if(ed && dls) body+='<div class="sec">'+esc(t('wld.dl.can'))+'</div>'+dls;
  /* And on somebody else's article, the same place holds the ones you may
     TAKE -- a section that folds like every other section on this page, with
     one row per chapter. Not a different shape, not a different colour: it is
     a heading with things under it, which is what the rest of the page is. */
  if(!ed && dls){
    var dlsec={r:'wlddl', k:'wld.dl.get'};
    body+=abHead(dlsec, '')+(abShut(dlsec.r)? '' : dls);
  }
  if(!body) body='<div class="note">'+esc(t('wld.empty'))+'</div>';
  return '<div class="view">'+wldFrame(body, ed, mine)+'</div>';
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
/* THE LANGUAGE'S NAME, TYPED ON A SCREEN OF THIS APP'S OWN.
   「標準は使わねえって言ってるだろこれも禁止や」「禁止事項入れろ」 OWNER
   2026-09-01 -- `confirm()`, `alert()`, `prompt()` and UIAlertController, none
   of them. 「iPhoneのやつ使ってるsnsないしな」

   This was `prompt()`, which is iOS's own box: the one shape the app is
   forbidden to use, on the row that renames the thing the whole app is about.
   It stayed because nothing stops a rule that is only written down
   (`tools/es5-check.mjs` stops this one now).

   openForm() and not a fourth shape. Every other place in this app where
   somebody types something is a form -- the word, the note, the profile, the
   slot -- and one field is what this needs. The save is at the far end of the
   bar, where every other form's is 「メモも保存は右上」.

   A language somebody is only READING is not renamed: langLocked() is what
   says so everywhere else, and it is what takes the Save off a note. */
function editName(){
  openForm('name', t('set.name'),
    '<div class="field"><label>'+t('set.name')+'</label>'+
      lnField('ln-nm', t('home.name.prompt'), '', langName||'')+'</div>',
    null,
    /* THE ONE DECIDE BUTTON THAT IS STILL LIT WHATEVER IS IN THE BOX, and it
       is said here rather than left to be found. www/shell.js § navDo wants
       the screen's own answer to 「何か打ったか」, and this box has nobody
       listening to it: `ln-nm` carries no IN(), so what was typed is read off
       the page when Save is pressed and nothing runs in between. Giving it
       one means a name in www/act-map.js, which the session that wrote this
       does not own. Until then it says true, which is what it has always
       done. */
    langLocked()? '' : navDo(t('notes.save'), 'saveName', null, true));
}
FORM_OPEN.name=function(){ editName(); };
function saveName(){
  var a=document.getElementById('ln-nm');
  if(!a) return;
  var v=String(a.value||'').replace(/^\s+|\s+$/g, '');
  /* 空は未設定 -- OWNER 2026-09-06. Emptying the box takes the name off, and
     what every screen then says is langNameSaid()'s. It used to be thrown
     away here, so the box closed and the old name stayed with nothing said. */
  langName=v; save(); closeSheet({target:{id:'sbg'}}); render();
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
  /* A language that is only READ is a row and not a button. langOpen()
     refuses it -- opening is what writes, and 「dl言語は編集はできない」
     (OWNER 2026-09-01) -- so a button here would be a door that answers
     nothing, which is the shape the ↓ itself was until today. It is drawn,
     because it is on this phone and somebody took it; it is not pressable,
     because there is nowhere to go yet. */
  /* THE SHAPE IS THE ACCOUNT SWITCHER'S, not a settings row. 「言語切り替えは
     設定の言語じゃなくて、ちゃんとした画面作ってくれよ。インスタのアカウント
     切り替えみたいなイメージ」 OWNER 2026-09-01 -- it was already a screen of
     its own (this route, reached by holding the profile tab), and it read as a
     list of settings: a small label and a tick. A row is a tile, a name and
     the tick now, at the size a thing you PRESS is.

     The tile is the language's first letter in the app's own face. Not its own
     letters: those live under `langKeyOf(id,'letters')` and only the OPEN
     language's are loaded, so one row would be drawn in somebody's alphabet
     and the rest in roman -- which is one row looking like the answer and the
     others looking broken. `.pav` is the circle every face in this app already
     wears, so no new corner is drawn (規則18). */
  var mk=langNameSaid(nm).charAt(0);
  /* A DOWNLOADED LANGUAGE IS A LANGUAGE YOU SWITCH TO, and it was a dead row
     until 2026-09-02. 「ダウンロード言語にしようよ。編集不可でそのアカウントに
     切り替えたらダウンロードした人の言語が使える」 OWNER -- so the row is a
     button like any other and langOpen() takes it, which it has always been
     willing to do.

     What makes it safe is not this row. It is langLocked() in core.js, asked
     by every one of the seven savers, so nothing anywhere can write to a
     language that is not yours -- however it was reached. langOpen()'s own
     comment named the writers as the protection from the day it was written
     and only three of them were asking; opening this door is what finished
     that sentence. */
  return '<button class="lgrow'+(isOpen?' on':'')+'"' + DO('langOpen', [id]) +
    (isOpen? ' aria-label="'+esc(t('langs.open'))+'"' : '') + '>'+
    '<span class="pav lgav">'+esc(mk)+'</span>'+
    '<span class="lgn">'+esc(langNameSaid(nm))+'</span>'+
    '<span class="lgck">'+(isOpen?ICON_TICK:'')+'</span></button>';
}
/* The way to make another one, at the foot of the list -- where "add an
   account" sits in the app this is modelled on. 「アカウントが変わるイメージ。
   実際の sns はアカウント切り替えボタンあるやん？あれが言語切り替えになるって
   感じ」「せっていからでいいよ」 OWNER DECISION 2026-08-25: the list stays in
   Settings. It is still there and this is still the page it opens.

   **A second way in was added 2026-08-27** 「インスタと同じようにしたから出て
   くる」: holding the profile tab comes to this same page (holdStart() in
   www/shell.js). The list was NOT moved -- Settings still links here, which is
   what 「せっていからでいいよ」 asked for, and the hold is a short way to the
   page rather than a copy of it. That is the reading docs/FEATURE_RULES.md
   offered on 2026-08-25 and would not settle on its own; the owner settled it.

   It is drawn on every plan, including the one that cannot press it: a closed
   door is shown rather than hidden. 「だいたい無料で使えないやつは表示させて
   いいよ。課金させる動線を減らしたくない」 What happens on the press is
   langStop()'s, in core.js, and is not asked here -- a screen that both drew
   the door and decided whether it opens would be two places holding one rule.

   A row and not a button of its own shape: it is the last row of a list, and
   rows in one list are one height. Same tag, same class, same two spans as
   langRow() above, which is what makes that true rather than nearly true. */
/* The way to make another one, in the same shape as the rows above it -- a
   tile with a + in it and the words beside it, which is where 「アカウントを
   追加」 sits in the app this is modelled on. */
function langAddRow(){
  return '<button class="lgrow"' + DO('langNew') + '>'+
    '<span class="pav lgav lgadd">'+ICON_ADD+'</span>'+
    '<span class="lgn">'+esc(t('langs.new'))+'</span></button>';
}
/* WHICH LANGUAGES ARE LISTED, and it is wordsSeen()'s shape exactly.
   「だって単語でも文法でも同じようにやったじゃん」OWNER 2026-09-02.

   The first `cap` of them, in the order they are stored. `LANGS` is not
   touched and neither is one byte under `lingua.` -- nothing is deleted,
   nothing is renamed, nothing is counted down. Paying again lists every one
   of them exactly as they were, which is the whole reason this cuts the LIST
   and not the data. docs/DATA_SAFETY.md § a shorter list is not a deletion.

   THE OPEN ONE IS ALWAYS ON IT ── 「開いてるものを残すでいいよ」OWNER
   2026-09-02. A switcher that does not contain the language you are standing
   in is a switcher you cannot switch away from, and the language you are
   working in is the last one to take off the screen. It goes in place of the
   last of the first `cap`, so the count is the count either way. */
function langsSeen(ids, cap){
  var out;
  if(ids.length<=cap) return ids;
  out=ids.slice(0, cap);
  if(langId && ids.indexOf(langId)>=0 && out.indexOf(langId)<0 && out.length)
    out[out.length-1]=langId;
  return out;
}
function vLangs(){
  var ids=Object.keys(LANGS), mine=[], reading=[], other=0, i, id;
  for(i=0;i<ids.length;i++){
    id=ids[i];
    if(!LANGS[id].mine){ reading.push(id); continue; }
    /* WHOSE ACCOUNT, and not just whose phone.
       「あと違うアカウントでログインしてんのに前のやつ出てくるんだけど？」
       OWNER 2026-08-31. `LANGS` is the PHONE's -- it survives signing out --
       so this list showed the last account's languages to whoever signed in
       next, which is what that sentence was about.

       They are NOT REMOVED and nothing is written: signing back in shows
       them again, exactly as they were. langAcct() is the one place that
       says whose a language is. */
    if(langAcct(id)) mine.push(id); else other++;
  }
  /* The ceiling, met on the way OUT. Both lists are cut the same way and by
     their own number: making and reading are two ceilings that never see each
     other (`langCap()` and `dlCap()`, www/core.js). */
  var mineSeen=langsSeen(mine, langCap()), readSeen=langsSeen(reading, dlCap());
  other += mine.length-mineSeen.length;
  var readHid = reading.length-readSeen.length;
  var body='<div class="sec">'+esc(t('langs.mine'))+'</div>'+
    /* AND A LIST WITH NOTHING ON IT IS NOT A PERSON WITH NO LANGUAGES.
       This section has never had a 「まだありません」 -- somebody standing here
       has one -- so what it shows is a heading and a +. 通信が落ちていれば
       ポップが出ている（netPop、www/net.js）ので、ここは何も言わない。 */
    (mineSeen.length? mineSeen.map(function(id){ return langRow(id); }).join('')
                    : '')+
    /* AND HOW MANY ARE NOT ON IT, every time.
       `docs/DATA_SAFETY.md` § a shorter list is not a deletion: somebody
       opening this to find a language gone has no way to tell which of the
       two it is, and the difference is the whole of their trust in the app.
       The same key the dictionary's foot uses, because it is the same
       sentence -- a count, which is a state and not an explanation. */
    (other? '<div class="note">'+esc(t('cap.hid', other))+'</div>' : '')+
    langAddRow()+
    '<div class="sec">'+esc(t('langs.reading'))+'</div>'+
    /* .empty is the full-screen one: 54px of padding and a serif heading,
       which is right for a screen with nothing on it and far too loud for a
       section of a screen that has something on it. */
    /* 「読んでいる言語」は他人のもので、空でも「自分のものが消えた」とは読ま
       れない -- TL と同じ側。 */
    (readSeen.length? readSeen.map(function(id){ return langRow(id); }).join('')
                    : '<div class="note">'+esc(t('langs.none'))+'</div>')+
    (readHid? '<div class="note">'+esc(t('cap.hid', readHid))+'</div>' : '');
  return '<div class="view">'+navTop('')+'<div class="body">'+body+'</div></div>';
}

