/* Lingua — letters, which are not sounds
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   「音と文字だけど、音に対して文字入れるのおかしくね？文字と音は別だし、同じ文字でも
   違う音が当てられる時あるやん。そこの認識。使う音と文字とアルファベットは別。」

   He is right, and the old model could not say it. A shape was stored under
   the sound it was for -- SCRIPT.g['k'] -- so a letter had no existence apart
   from its sound. That makes three ordinary things impossible:

     one sound, two letters    c and k both read /k/; s and ß both read /s/
     one letter, two sounds    c reads /k/ and /s/; English g reads two ways
     a letter with no sound    a shape you drew and have not decided about

   A letter is its own thing here. It has an identity, a shape (drawn or
   borrowed), a name of its own, and a list of what it reads as -- which can
   be empty, or long. Sounds are a separate list and always were. The two are
   joined, not nested, so the join can be edited from either end: 「音専用ページと
   文字アルファベットページ別にして。どっちからでもお互い追加できるようにすればいい」

   What a letter reads as is a UNIT, not always a single sound, because that
   was already true: a syllabary letter reads "ka", a logograph reads a whole
   word. wsys.js decides where a word is cut into units; this file decides
   what writes each one.

   Where two letters read the same unit, the first is the one the font uses,
   because a font maps one code point to one glyph and there is nothing else
   it could do. Which of them a particular word uses is the word's business
   and lives on the word. */

var LETTERS=[];
/* The open language's alphabet. Empty first: see langRead() in core.js. */
function ltRead(){
  LETTERS=[];
  try{ var lt=JSON.parse(localStorage.getItem(langKey('letters'))||'null'); if(lt && lt.length) LETTERS=lt; }catch(e){}
}
ltRead();
function saveLetters(){ bkTouch(); try{ localStorage.setItem(langKey('letters'), JSON.stringify(LETTERS)); }catch(e){} }

/* ---- moving the old shape of things over ------------------------------
   Everything drawn before this ran was stored under its sound, which is
   exactly a letter that reads one unit. Nothing is lost and nothing has to
   be redrawn. Borrowed characters come across the same way. */
var LT_SEQ=0;
function ltId(){
  LT_SEQ++;
  return 'l'+LT_SEQ+'_'+LETTERS.length+'_'+(LETTERS.length? LETTERS[0].id.length : 0);
}
function migrateLetters(){
  if(LETTERS.length) return;
  var moved=0, k, m;
  for(k in SCRIPT.g){
    if(!SCRIPT.g[k] || !SCRIPT.g[k].length) continue;
    LETTERS.push({id:ltId(), st:SCRIPT.g[k], ch:'', nm:'', snd:[k]});
    moved++;
  }
  m=(SET.script||{});
  for(k in m){
    if(!m[k]) continue;
    LETTERS.push({id:ltId(), st:null, ch:m[k], nm:'', snd:[k]});
    moved++;
  }
  if(moved) saveLetters();
}

/* ---- reading the join ------------------------------------------------- */
function ltById(id){
  var i; for(i=0;i<LETTERS.length;i++) if(LETTERS[i].id===id) return LETTERS[i];
  return null;
}
/* Every letter that reads this unit, in the order they were made. */
function ltFor(unit){
  var out=[], i;
  for(i=0;i<LETTERS.length;i++) if(LETTERS[i].snd && LETTERS[i].snd.indexOf(unit)>=0) out.push(LETTERS[i]);
  return out;
}
/* The one the font uses. */
function ltMain(unit){ var a=ltFor(unit); return a.length? a[0] : null; }
function ltStrokes(unit){ var l=ltMain(unit); return (l && l.st && l.st.length)? l.st : null; }
function ltChar(unit){ var l=ltMain(unit); return (l && l.ch)? l.ch : ''; }
function ltHasShape(l){ return !!(l && ((l.st && l.st.length) || l.ch)); }
/* What a letter LOOKS like: what was drawn, or the character it borrows, or
   whatever the caller wants for a letter that is neither yet -- a pen on the
   alphabet, its name on a spelling, nothing at all on a strip.

   This was written out six times, in three files, and one of the six carried
   a comment saying it was the place it lived. That comment was the bug: a
   change to how a letter is shown reached one screen and left five alone,
   and nothing anywhere could see the six had come apart. */
function ltInk(l, none){
  if(l && l.st && l.st.length) return '<canvas class="tc" data-l="'+esc(l.id)+'"></canvas>';
  if(l && l.ch) return '<span class="bch">'+esc(l.ch)+'</span>';
  return none||'';
}
/* What a letter is called. Its own name if it was given one, otherwise what
   it reads -- and if it reads nothing yet, nothing. A letter with no name and
   no sound is still a letter; it is drawn and it is on the page. */
function ltName(l){
  if(!l) return '';
  if(l.nm) return l.nm;
  /* A digit says what it is worth. It reads no sound, so without this every
     digit in the chapter was a dash. */
  if(numIsDigit(l)) return numLabel(l.val);
  /* What they typed. It was the sound spelled the usual way, so a letter
     named G was called by whatever /ɟ/ is normally written with -- on its own
     page, in the list, and in the bar at the top. The name is theirs. */
  if(l.ab) return l.ab;
  if(l.snd && l.snd.length) return l.snd.join(' ');
  return '';
}
/* Letters with no sound on them yet. The reason the two chapters are two
   chapters: you can draw an alphabet first and decide later. */
/* Letters that read nothing at all, which is a thing to finish. A letter that
   reads `?` reads something and is finished. */
function ltLoose(){
  /* A digit is not loose. It reads no sound because it is not for one -- it
     has a value, which is the whole of what it says. */
  return LETTERS.filter(function(l){
    return !ltUnits(l).length && !numIsDigit(l); });
}

/* ---- writing the join -------------------------------------------------- */
/* ---- a mark is a letter with no sound in it ----------------------------
   A letter used to be one thing: the shape for a sound. Everything the
   writing system draws was worked out from the phonology, so a shape that
   reads nothing had no way to exist -- a question mark was a letter you had
   not finished yet, and the app said so, forever.

   The fix for that was a switch on every letter: reads a sound, or is a mark.
   Two more fields, a segmented control on a screen, and a question nobody
   wanted answered -- a question mark IS a question mark, and it has no sound
   because it has no sound. Saying so twice is what made the screen ugly.

   So there is one field, and it is what the letter reads. Roman letters are a
   sound. A character that is not a roman letter is itself: `?` reads `?`. The
   font takes its code point from the same place either way. */
function ltIsMark(l){
  if(numIsDigit(l)) return false;   /* a digit is the third kind, not a mark */
  var u=ltUnits(l);
  return u.length>0 && !ltHasSound(l);
}
/* Whether any part of what this reads is on the chart. A unit is one or more
   sounds run together, so `ka` counts and `?` does not. */
function ltHasSound(l){
  var u=ltUnits(l), all=ipaAll(), i, j, p;
  for(i=0;i<u.length;i++){
    p=uSplit(u[i]);
    for(j=0;j<p.length;j++) if(all.indexOf(p[j])>=0) return true;
  }
  return false;
}
function ltMarks(){ return LETTERS.filter(ltIsMark); }
/* ---- the order the alphabet is in --------------------------------------
   Which is the person's. あいうえお is not a fact about sounds and neither is
   ABC; the sequence somebody puts their letters in is most of what makes them
   an alphabet rather than a pile of shapes. So it is theirs to set, by holding
   a letter and carrying it. 「長押しで並べ替え可能。初期配置はabc順にして」

   Until one is moved it is abc, by the name they gave the letter -- and a name
   that is not roman at all (山, or nothing yet) goes after all of them,
   because there is no answer to where 山 falls in abc and the end is the
   honest place to put a question nobody asked.

   `ord` is written to every letter of the list the moment one is moved, so a
   list half-numbered only ever means "before the first move" or "a letter was
   added since" -- and a new letter belongs at the end, which is where the
   unnumbered ones sort.

   It used to be the chart's order, so the alphabet read down the page the way
   the phonology chapter did. That is a fact about sounds, on a page about
   letters, and it had the side that a letter reading nothing sat at the bottom
   however it was named. */
function ltOrder(list){ return list.slice().sort(ltOrdCmp); }
function ltAbcKey(l){
  var n=String(ltName(l)||'');
  return (/^[A-Za-z]/.test(n)? '0'+n.toLowerCase() : '1'+n);
}
function ltOrdCmp(a, b){
  var oa=(typeof a.ord==='number'), ob=(typeof b.ord==='number');
  if(oa && ob) return a.ord-b.ord;
  if(oa!==ob) return oa? -1 : 1;
  var ka=ltAbcKey(a), kb=ltAbcKey(b);
  return ka<kb? -1 : ka>kb? 1 : 0;
}
/* Where a letter sits, written down. The whole list is renumbered and not just
   the two that swapped: a list where some letters have a number and some do
   not is the state before anybody set an order, not an order. */
function ltMove(k, id, to){
  var list=ltOrder(ltOfKind(k)), from=-1, i;
  for(i=0;i<list.length;i++) if(list[i].id===id) from=i;
  if(from<0 || to<0 || to>=list.length) return;
  list.splice(to, 0, list.splice(from, 1)[0]);
  for(i=0;i<list.length;i++) list[i].ord=i;
  saveLetters(); render();
}

/* ---- holding a letter and moving it ------------------------------------
   A press that stays still for a moment picks the letter up; after that the
   finger carries it and the others move aside as it passes. A press that
   travels before it lifts is a scroll and is left alone -- which is the only
   thing the delay is for.

   The order is written when the finger comes up, not on every swap: the
   letters move in the page while it is happening, and the language is told
   once, at the end. */
var LTD=null;
function ltDragMount(){
  var g=document.getElementById('ltgrid');
  /* A digit's place is what it is worth, so there is nothing here to set. */
  if(!g || g.getAttribute('data-k')==='num') return;
  g.addEventListener('touchstart', ltDown, false);
  g.addEventListener('touchmove', ltDrag, false);
  g.addEventListener('touchend', ltUp, false);
  g.addEventListener('touchcancel', ltUp, false);
}
/* The cell a touch landed in. What is under a finger is the canvas or the
   label as often as it is the button. */
function ltCellAt(el){
  while(el && el.classList && !el.classList.contains('ltc')) el=el.parentNode;
  return (el && el.classList && el.classList.contains('ltc'))? el : null;
}
function ltDown(e){
  var b=ltCellAt(e.target), p=e.touches? e.touches[0] : e;
  /* A sound with no letter yet is a cell in the same grid and is not a letter:
     there is nothing to put in an order. It cannot be carried, and it is not
     counted when the order is written -- ltOrderKids below. */
  if(!b || !p || !b.getAttribute('data-id')) return;
  LTD={el:b, g:b.parentNode, id:b.getAttribute('data-id'),
       x:p.clientX, y:p.clientY, on:false, timer:0};
  LTD.timer=setTimeout(ltLift, 380);
}
function ltLift(){
  if(!LTD) return;
  LTD.on=true;
  LTD.el.classList.add('lift');
  LTD.g.classList.add('moving');
  /* And the alphabet goes into the state a phone's home screen goes into when
     an icon is held: every letter wobbling with a mark on its corner. The same
     state the keyboard being built has had, on the other grid in this app that
     somebody arranges. 「ここ長押しで右上に⚪︎-つけて欲しい。編集モードになる感じ。
     それで消せるし、移動もできる。iPhoneのホーム画面と同じ動き」

     Not drawn until the finger comes up: a render() in the middle of a drag
     takes the cell being dragged out from under it. */
  ltWob=true;
}
/* Where you are standing in the alphabet, so viewReset() drops it. */
var ltWob=false;
function ltWobEnd(){ ltWob=false; render(); }
function ltDrag(e){
  if(!LTD) return;
  var p=e.touches? e.touches[0] : e;
  if(!p) return;
  var dx=p.clientX-LTD.x, dy=p.clientY-LTD.y;
  if(!LTD.on){
    if(dx*dx+dy*dy>144){ clearTimeout(LTD.timer); LTD=null; }
    return;
  }
  /* the page does not scroll while a letter is being carried */
  e.preventDefault();
  LTD.el.style.transform='translate('+dx+'px,'+dy+'px)';
  /* Out of the hit test for the length of the question. The cell being
     carried is under the finger and lifted above the others, so it was the
     answer every time and the drag went home without swapping anything --
     the same one line, in the other place this gesture lives. */
  LTD.el.style.pointerEvents='none';
  var over=ltCellAt(document.elementFromPoint(p.clientX, p.clientY));
  LTD.el.style.pointerEvents='';
  if(!over || over===LTD.el) return;
  if(!over.getAttribute('data-id')) return;
  var kids=LTD.g.children, a=-1, b=-1, i;
  for(i=0;i<kids.length;i++){ if(kids[i]===LTD.el) a=i; if(kids[i]===over) b=i; }
  LTD.g.insertBefore(LTD.el, b>a? over.nextSibling : over);
  /* it is in a different slot now, so the finger's offset from it starts over */
  LTD.x=p.clientX; LTD.y=p.clientY;
  LTD.el.style.transform='';
}
/* The cells of the grid that ARE letters, in the order they are on screen.
   The grid also holds a cell for every sound of the language no letter says
   yet, and those are not in the alphabet -- counting them would write a
   position nothing agrees with. */
function ltOrderKids(g){
  var out=[], kids=g.children, i;
  for(i=0;i<kids.length;i++) if(kids[i].getAttribute('data-id')) out.push(kids[i]);
  return out;
}
function ltUp(e){
  if(!LTD) return;
  clearTimeout(LTD.timer);
  var d=LTD, kids, to=-1, i;
  LTD=null;
  d.el.style.transform='';
  d.el.classList.remove('lift');
  d.g.classList.remove('moving');
  if(!d.on){
    /* Held long enough to wobble but let go without moving anything: still a
       hold, so the marks appear. */
    if(ltWob) render();
    return;
  }
  /* and the press does not also open the letter it was moving */
  if(e && e.preventDefault) e.preventDefault();
  kids=ltOrderKids(d.g);
  for(i=0;i<kids.length;i++) if(kids[i]===d.el) to=i;
  ltMove(d.g.getAttribute('data-k'), d.id, to);
}
/* What this letter reads that another letter already read. A font maps one
   code point to one glyph, so ltMain() -- the first of them -- is the one that
   gets drawn and the others quietly do not.

   ltSetRoman refuses to make a new one, so this only ever answers for letters
   that already clashed: an import, or a phone from before the refusal. Saying
   so in red and letting it be set anyway was pointing at a mess rather than
   not making one. */
function ltTaken(l){
  var u=ltUnits(l), i, first;
  for(i=0;i<u.length;i++){
    first=ltMain(u[i]);
    if(first && first.id!==l.id) return u[i];
  }
  return '';
}
/* The first of these units that some OTHER letter already reads. */
function ltClash(id, units){
  var i, held;
  for(i=0;i<units.length;i++){
    held=ltFor(units[i]);
    if(held.length && held[0].id!==id) return units[i];
  }
  return '';
}
/* Letters that had the switch: role 'mark' with the character in `key`. The
   character is what it reads now. Runs once, on a phone, and touches only the
   letters that carry the old shape. */
function migrateMarks(){
  var moved=0, i, l;
  for(i=0;i<LETTERS.length;i++){
    l=LETTERS[i];
    if(l.role===undefined && l.key===undefined) continue;
    if(l.role==='mark' && l.key && (!l.snd || !l.snd.length)) l.snd=[l.key];
    delete l.role; delete l.key;
    moved++;
  }
  if(moved) saveLetters();
}

/* A letter is what somebody drew, and nothing else.

   It used to be handed the first sound in the inventory that nothing read yet,
   on the argument that making a script is a substitution -- you are saying "my
   K looks like this", and the sound was already there. The argument is not
   wrong about scripts. It is wrong about who is doing it: the app does not
   know what somebody meant by a shape, and it said so out loud anyway. You
   drew a mark and the alphabet said it was p; you drew a second and it was t.
   Nothing on the drawing screen mentions it and nothing says it can be
   changed, so it reads as the app having decided.

   「アルファベット書いたら勝手にTってなった」

   A letter with no sound is already a thing this app has -- ltLoose() is the
   list of them and ltRow says "reads nothing yet" -- so a drawn letter is now
   simply one of those until somebody says otherwise. One made FOR a sound
   (ltForUnit, and an import that carries one) still arrives with it. */
function ltNew(o){
  var l={id:ltId(), st:(o&&o.st)||null, ch:(o&&o.ch)||'', nm:(o&&o.nm)||'',
         snd:(o&&o.snd)? o.snd.slice() : [],
         /* A letter made FOR a sound arrives with an answer; one that is just
            a shape gets the app's guess as soon as it is named. */
         chose:(o && o.snd && o.snd.length)? 1 : 0};
  if(o && typeof o.val==='number') l.val=o.val;
  LETTERS.push(l); saveLetters();
  return l;
}
/* ---- the alphabet a free language starts with -------------------------
   Twenty-six letters and two marks, already there, waiting to be drawn on.

   The free app is one sentence: your own shapes for a-z. There is no adding
   a letter, no deleting one and no renaming one -- so the slot is the whole
   of what the free plan gives, and it has to be there from the first second
   or there is nothing to press.
   「無料の場合はもう最初からa〜z!?が置いてあってそこから書くだけで追加する自体が
   ない」

   It tops up rather than seeds: a language that already has letters keeps
   every one of them and is given only the slots it is missing, matched by
   name. So this can run on any launch, and a paid language that comes back
   down to free is filled in rather than rearranged.

   Nothing here sets `ord`, so the twenty-eight sort by name -- which is abc,
   and the two marks after it, because that is where ltAbcKey puts a name
   that is not roman.

   Paid does not get this. A syllabary, an abjad and a logography are all
   paid, and handing a logography twenty-six roman letters on the day it is
   made would be the app deciding what somebody's writing is -- which is the
   one thing the alphabet chapter is written not to do. */
var LT_START='abcdefghijklmnopqrstuvwxyz!?';
/* One of the letters every language starts with -- a to z, ! and ?, and a
   digit for every value of the base. Its NAME is not the person's to change,
   on any plan.

   kbFixed() finds the free keyboard's keys by name: kbNamed('a') walks
   LETTERS for one called `a`. So a renamed `a` is a key that answers to
   nothing -- and ltStart(), which tops a free language up by name, then makes
   a NEW empty letter called `a` and puts that on the key. Somebody who paid,
   renamed a letter, drew on it, and let the plan lapse would find a blank
   where their letter used to be, and nothing anywhere saying why.

   Refusing the rename is the whole fix, and it costs nothing: a letter that
   is to be called something else is a DIFFERENT letter, and the way to have
   one is ltCopy(). 「無料で作ったやつを改名できなければ良くない？コピーできる
   ようにして分けるとかは？」 */
function ltIsBase(l){
  if(!l) return false;
  if(numIsDigit(l)) return true;
  var ab=String(l.ab||'').toLowerCase();
  return ab.length===1 && LT_START.indexOf(ab)>=0;
}
/* A letter of one's own, made from one that is not. Everything drawn on it
   comes across -- the strokes or the character it borrows, what it reads and
   the note -- and the name does not, because a name is the one thing the copy
   exists to be able to change. It goes in beside the one it came from, which
   is where somebody looking at that one expects it. */
function ltCopy(id){
  var l=ltById(id), n, i;
  if(!l || !can('letters')) return;
  n=ltNew({});
  if(l.st && l.st.length) n.st=JSON.parse(JSON.stringify(l.st));
  if(l.ch) n.ch=l.ch;
  if(l.snd && l.snd.length) n.snd=l.snd.slice();
  if(l.nt) n.nt=l.nt;
  if(l.chose) n.chose=l.chose;
  for(i=0;i<LETTERS.length;i++) if(LETTERS[i].id===n.id){ LETTERS.splice(i, 1); break; }
  for(i=0;i<LETTERS.length;i++) if(LETTERS[i].id===id){ LETTERS.splice(i+1, 0, n); break; }
  saveLetters(); installScriptFont();
  go('letter', n.id);
}
function ltStart(){
  if(can('letters')) return;
  var have={}, made=0, i, c, l, read;
  for(i=0;i<LETTERS.length;i++) have[String(ltName(LETTERS[i])||'').toLowerCase()]=1;
  for(i=0;i<LT_START.length;i++){
    c=LT_START.charAt(i);
    if(have[c]) continue;
    read=ltReadName(c);
    l=ltNew({});
    l.ab=c;
    /* A roman letter reads its sound; a mark reads itself, which is what
       migrateMarks made of every mark that came before this.

       The inventory is not touched. ltSetRoman adds a sound to it when
       somebody names a letter by hand, because they said the word; nobody
       said anything here. A language that has been given three sounds and
       then opened after an update would come back holding twenty-two of
       them, which is the app saying what the language sounds like -- and a
       letter is allowed to read something the phonology has not taken up
       yet, which is what the sound chapter is for. */
    l.snd=read.units.length? read.units : [c];
    made++;
  }
  /* And the digits, which are letters too -- numbers.js says a digit IS a
     letter, one carrying a value instead of a reading -- so they are slots
     exactly like the twenty-eight above and are drawn on the same way.
     「数字が設定できないわ。そこ文字から設定できるように頼む」

     They were the roman ten on the keyboard and nothing of the person's,
     because free adds no letters and so there was nothing to put there. That
     was true of a plan that gave twenty-eight slots; it is a reason to give
     ten more, not a reason to leave the row borrowed.

     By value and not by name: a digit has no name to match on, its value is
     the whole of what it is, and that is also the order it counts in. As many
     as the base has, so a language counting in twelve gets twelve. The
     reading is left alone -- a value takes a reading away, and one of these
     has nothing to say about sound. */
  made+=numTopUp();
  if(made) saveLetters();
}
/* What this letter reads, spelled the way a person would write it. One word
   per unit, separated by spaces, because a letter may read more than one
   thing -- c reads /k/ and /s/. The field on the letter screen shows this and
   ltSetRoman reads it back. */
/* What the one box shows: a digit's value, or the reading. */
function ltBoxed(l){
  if(!l) return '';
  if(numIsDigit(l)) return numLabel(l.val);
  /* What they typed, if they typed it. ltRoman is the fallback for letters
     made before the box kept its own answer, and for the ones the app made
     out of a borrowed character. */
  return (l && l.ab) || ltRoman(l);
}
function ltRoman(l){
  var u=ltUnits(l), all=ipaAll(), out=[], i, j, p, w;
  for(i=0;i<u.length;i++){
    p=uSplit(u[i]); w='';
    for(j=0;j<p.length;j++) w+=(all.indexOf(p[j])>=0)? ipaRoman(p[j]) : p[j];
    out.push(w);
  }
  return out.join(' ');
}
/* ---- what a letter is in the alphabet ----------------------------------
   The shape is drawn, and then it is said what it is: T, or sh, or ka. The
   reading follows from that -- it is not a second question, and it was never
   asked as one. 「文字書いたらそれがどのアルファベットに対応してるかを選べばいいだろ」

   This was a row of twenty-six buttons for a while. A B C laid out as keys
   says the alphabet is those twenty-six and no more, which is not true of any
   language somebody would build here -- sh and ng are one letter each, an
   abugida writes ka as one, and nothing above Z exists. It is typed.
   「abcみたいにボタン並べるのはありえない。全部入力で被ったら赤字」

   Two letters reading the same thing is allowed and shown, not refused: c and
   k in English are two letters and one sound, and a language being built is
   allowed to be halfway through. ltDupOf is what turns the field red. */
function ltDupOf(l){
  return l? ltClash(l.id, ltUnits(l)) : '';
}
/* Correcting what a letter reads -- the only time anybody says anything about
   a sound, because the letter was given one when it was drawn. Emptying the
   field takes the reading off; a letter that reads nothing is a letter, and
   the letters chapter lists it as one still to finish.

   A sound somebody says their letter reads is a sound their language has, so
   it joins the inventory rather than being refused for not being in it.

   Nothing is written if any part of what was typed cannot be read: half a
   correction applied silently is worse than none. */
/* What letter of the alphabet this shape is, and -- separately -- what that
   letter reads. Two facts, in that order, and the order is the app:
   「文字を書く、その文字をアルファベットで表すと何になるかを決める。そのアルファ
   ベットがどんなよみになるかきまる」

   They were one. The box wrote the sound and the name was rebuilt out of it,
   so a person who wanted their own A B C D -- who has nothing to say about
   sound at all and only wants to swap the shapes -- could not have one, and
   G came back as J. 「音をそれぞれ分けて作れるようにしろってずっと言ってるのに
   こいつ音から作る」

   So the box writes the name. The sound is filled in from it ONCE, the first
   time, where it can be worked out at all -- a reads /a/ and everyone knows
   it, so nobody should have to say so. After that the two do not touch:
   renaming a letter leaves its sound alone, and openSnd changes the sound
   without renaming anything. A name nothing can be read from -- 山 -- simply
   leaves the sound empty rather than inventing one. */
/* ---- the name box, before it is the name -------------------------------
   What has been typed into the box and not yet put on the letter. The box
   used to write straight through on every change: the alphabet rebuilt itself
   under a moving finger, the font was recompiled per keystroke, and a
   half-typed name was, for as long as it took to type the rest, what the
   letter was called. 「保存ボタンつけようもう。単語作るのにも、文字作るのにも」

   One draft, not one per letter: only one letter is open at a time, and the
   id it carries is how a box on a different letter knows the draft is not
   about it. viewReset() throws it away, because a half-typed name is where
   you are standing and not something the language has. */
var ltDraft=null;
function ltDraftName(id, v){ ltDraft={id:id, ab:String(v||'')}; }
function ltDraftAb(l){
  return (l && ltDraft && ltDraft.id===l.id)? ltDraft.ab : ltBoxed(l);
}
/* The letter, as typed. This is the only thing that writes it. */
function ltSave(id){
  var l=ltById(id); if(!l) return;
  ltSetRoman(id, ltDraftAb(l));
  ltDraft=null;
  toast(t('toast.saved', ltName(ltById(id))||t('lt.untitled')));
}
/* What a typed name reads: one unit per word, and the phonemes those units
   are made of. Two answers off one pass, because both callers want both --
   the name is what the sound is guessed from, and the phonemes are what joins
   the inventory. */
function ltReadName(sp){
  var words=String(sp||'').split(/\s+/), units=[], seen=[], i, j, parts;
  for(i=0;i<words.length;i++){
    if(!words[i].length) continue;
    /* Not roman letters: it is itself. `?` reads `?`, and joins no inventory
       because it is not a sound. */
    if(!/^[A-Za-z]+$/.test(words[i])) continue;
    parts=ipaFromRoman(words[i]);
    if(!parts) continue;              /* not readable: leave the sound alone */
    units.push(parts.join(''));
    for(j=0;j<parts.length;j++) if(seen.indexOf(parts[j])<0) seen.push(parts[j]);
  }
  return {units:units, seen:seen};
}
/* Letters from before the guess followed the name. `chose` is the answer to
   "did somebody pick this sound, or did the app read it off the name", and a
   letter that has never been asked has no answer at all -- which is what makes
   this run once per letter and not once per launch. Not asked means not
   chosen, so the name wins, and the letter renamed from n to O stops being
   told that n is taken.

   Aligning a sound somebody DID choose on the chart is the cost, and it is
   paid once, by letters that could not say which they were. */
function migrateSndName(){
  var moved=0, i, l, units;
  for(i=0;i<LETTERS.length;i++){
    l=LETTERS[i];
    if(l.chose!==undefined) continue;
    units=ltReadName(l.ab||'').units;
    if(units.length) l.snd=units;
    l.chose=0;
    moved++;
  }
  if(moved) saveLetters();
}
/* A person's note about one of their own letters. Written down as it is
   typed, like every other field on the sheet; the app never reads it. */
function ltSetNote(id, v){
  var l=ltById(id); if(!l) return;
  if(String(v||'').length) l.nt=String(v); else delete l.nt;
  saveLetters();
}
function ltSetRoman(id, sp){
  var l=ltById(id); if(!l) return;
  if(/^[0-9]+$/.test(String(sp||'').trim())){
    numSetVal(id, parseInt(String(sp).trim(), 10));
    return;
  }
  var read=ltReadName(sp), units=read.units, seen=read.seen, i;
  /* A clash is shown, not refused. Refusing meant the box silently kept its
     old value and a toast said why, which is a correction somebody has to
     read and then retype; and it made two letters for one sound impossible,
     which c and k are. ltDupOf turns the field red and the line under it
     says which letter already has it. 「全部入力で被ったら赤字」 */
  if(seen.length){
    var have=addedSnd();
    for(i=0;i<seen.length;i++) if(have.indexOf(seen[i])<0) have.push(seen[i]);
    SND=asOrder(have);
    saveSnd();
  }
  /* A sign is one thing: taking a reading gives up being a digit, the same
     way giving a value gives up the reading. Which letter of the alphabet the
     shape is stays where it is: that is a different sentence about the same
     letter, and this box has never had anything to say about it. */
  delete l.val;
  /* The sound follows the name, unless somebody has said otherwise.

     It used to go in once -- at the moment the letter was named -- and never
     again, on the argument that a sound set on the chart should survive a
     rename. The argument is right about the chart and wrong about everything
     else: a letter drawn, called n, and then called O kept /n/, and since N
     already read /n/ the alphabet showed O with a red line underneath saying
     that n was taken. Which was true, about a letter with O on it. 「Oだっつーの」

     So the guess follows the name, and what was chosen on the chart is left
     alone -- ltTakeSnd says so by setting `chose`, and that is the only thing
     that distinguishes the two. */
  if(units.length && !l.chose) l.snd=units;
  /* What was typed, kept as typed. It used to be thrown away and rebuilt out
     of the sounds by ltRoman, so `g` was stored as its sound and came back as
     whatever letter that sound is usually spelled with -- you asked for G and
     the alphabet showed you J. And somebody who wants nothing to do with
     sounds, who just wants their own A B C D, could not have one: every
     label was a spelling of a phoneme rather than a name they chose.
     「音で当てられるとGが置けないやん。ただ文字を独自のアルファベットにしたい人も
     いる」 The sound is still read off it -- that is what makes the letter
     work in words -- but the name on the letter is theirs. */
  l.ab=String(sp||'').replace(/^\s+|\s+$/g, '');
  saveLetters(); installScriptFont(); render();
}
function ltSetStrokes(id, st){
  var l=ltById(id); if(!l) return null;
  if(st && st.length){ l.st=st; l.ch=''; } else l.st=null;
  saveLetters(); return l;
}
function ltSetChar(id, ch){
  var l=ltById(id); if(!l) return null;
  ch=String(ch||'').trim();
  if(ch){ l.ch=ch; l.st=null; } else l.ch='';
  saveLetters(); return l;
}
/* Deleting a letter: asked for, confirmed, and left behind. ltDel() below is
   the storage half and says nothing to anybody. This was geDelete() on the
   drawing screen, which is why it read the editor's state instead of an id --
   and why deleting a letter meant opening the surface it was drawn on. */
function ltDelete(id){
  var l=ltById(id); if(!l) return;
  var nm=ltName(l)||t('lt.untitled');
  if(!confirm(t('glyph.del.ask'))) return;
  ltDel(id);
  if(GE && GE.lid===id) GE=null;
  save(); installScriptFont();
  /* From the corner mark the alphabet is already on screen and the wobble
     stays on -- somebody taking one letter off is usually taking two. From
     the letter's own page there is a page to leave. The same sentence
     kbDelKey makes. */
  if(here().r==='letter') back(); else render();
  toast(t('glyph.deleted', nm));
}
function ltDel(id){
  LETTERS=LETTERS.filter(function(l){ return l.id!==id; });
  saveLetters();
}
/* Making a letter for a unit that has none, in one step, because that is what
   the sound chapter's "draw one" button means. */
function ltForUnit(unit){
  var l=ltMain(unit);
  if(l) return l;
  return ltNew({snd:[unit]});
}
/* Everything the two chapters count. */
function ltShaped(){ return LETTERS.filter(ltHasShape).length; }

/* ---- spelling a word with letters -------------------------------------
   「単語も音単位で決めるやついねえだろ。アルファベットに決まった音があるならそのまま、
   漣音化とか音が変わるならそこの単語から変更できるようにして。」

   Nobody spells by phoneme. You press the letters, the letters have sounds,
   and where a sound changes -- a consonant softening before a vowel, a
   syllable running into the next -- you change it on that word and nowhere
   else. A sound change is a fact about a word, not about the alphabet.

   So a word carries a spelling: a list of {l, u}. l is which letter was
   pressed; u is what it says HERE, which is normally the letter's own first
   reading and occasionally something else. The sounds of the word are those
   readings run together, which is what everything else in the app has always
   read, so nothing downstream changes.

   A word made before this, or typed on the sound keyboard, has no spelling
   and does not need one: one is worked out from its sounds when it is
   opened, by asking which letter writes each piece. */
function ltUnits(l){ return (l && l.snd)? l.snd : []; }
/* Every way this letter can be typed: what it is called, and what it reads.
   Both, on the one letter, because they are two names for one shape and not
   two things -- the name is what a person types and the reading is what the
   spelling engine holds, and the letter has to answer to either.

   Both cases of each, because a script somebody invented has no case unless
   they draw one, so G and g are the same letter. The name comes first: when
   two of these collide it is the name that wins, since it is the one that was
   chosen rather than worked out.

   scriptGlyphDefs turns each of these into a code point when it is one
   character, and into a ligature over its characters when it is more. */
function ltCodes(l){
  var out=[], u=ltUnits(l), i;
  function add(s){
    var f=[String(s||''), String(s||'').toUpperCase(), String(s||'').toLowerCase()], j;
    for(j=0;j<f.length;j++) if(f[j] && out.indexOf(f[j])<0) out.push(f[j]);
  }
  add(l && l.ab);
  /* A digit's value, which is the only thing it is called. numbers.js takes a
     letter's readings away when it gives it a value, and a digit is never
     given an `ab` -- so without this line ltCodes() answered NOTHING for one,
     and a digit somebody had drawn got no code point and was therefore not in
     the font at all. It typed a plain roman 1 and looked like one.

     share.js had already noticed the gap and worked around it for the
     conversion table, by adding kbTyped() to the keys. The font had nobody
     doing that for it. It is the same bug scriptGlyphDefs was rebuilt around
     -- a letter that none of the lists could see -- arriving again through
     the one kind of letter that had not existed yet. */
  if(numIsDigit(l)) add(numLabel(l.val));
  for(i=0;i<u.length;i++) add(u[i]);
  return out;
}
function ltFirstUnit(l){ var u=ltUnits(l); return u.length? u[0] : ''; }
/* A unit is one or more sounds run together. Splitting it back is asking the
   inventory which of its sounds the unit starts with, longest first, so "tʃa"
   comes apart as tʃ + a and not as t + ʃ + a. */
function uSplit(u){ return longCut(u, addedSnd()); }
/* ---- a word is its letters ---------------------------------------------
   You press a and an a goes in. Not the sound a is usually written with, not
   whatever /a/ this language happens to call it -- the letter.
   「音がなんでいっつもついてくんの？文字は文字 aはaだろ。入力してんだから」

   It was the other way round for the app's whole life: a word WAS its sounds,
   `hw` was those sounds run together, and a letter went into a word by
   handing over the sound it read. So a letter with no sound could not be
   typed at all, and a letter whose sound changed left every word it was in
   still saying the old one.

   So: the spelling is the word. What each position sounds like is asked of
   its letter, and a word only writes a unit of its own where it says
   something different there -- which is what a sound change is, and the only
   thing that was ever worth storing. */
/* What this position reads: what the word says, or what its letter does. */
function spUnit(st){
  if(!st) return '';
  if(st.u !== undefined && st.u !== null) return st.u;
  var l=ltById(st.l);
  return l? ltFirstUnit(l) : '';
}
/* Saying something else here, or going back to saying what the letter does.
   Equal to the letter is not an override, it is agreement, and storing
   agreement is how every word came to hold a copy of a sound. */
function spSetU(st, u){
  var l=ltById(st.l);
  if(l && ltFirstUnit(l)===u) delete st.u; else st.u=u;
}
/* The word as it is written: the letters, by the name each of them has. This
   is what the font draws too, since a letter's name is its code point. */
/* A typed line, cut into the letters that spell it.

   The free plan is letters and nothing else: a to z with the shapes somebody
   drew on them, and the sound is a thing a letter HAS rather than a thing you
   pick from. So a word is typed, and this is what typing means -- each letter
   matched by the name it answers to, longest name first so a letter called
   `th` wins over `t` where both could fit.
   「文字ベースに音が付随だからね？音から選択するのは課金機能」

   No unit is put on a position. spUnit() falls back to what the letter reads
   when there is none, which is exactly right here: nobody chose a sound, so
   the letter's own answer stands and keeps standing if the letter changes it.
   A character that answers to no letter is dropped rather than guessed at --
   the alphabet is the whole of what can be written. */
function spType(text){
  var names=[], by={}, i, n, cut, out=[];
  for(i=0;i<LETTERS.length;i++){
    n=String(ltName(LETTERS[i])||'').toLowerCase();
    if(!n) continue;
    if(!Object.prototype.hasOwnProperty.call(by, n)){ by[n]=LETTERS[i].id; names.push(n); }
  }
  /* Case folded, because a to z is what is typed and a letter an older
     language calls `O` is the same letter. Unmatched characters dropped:
     the alphabet is the whole of what can be written here, so a character
     answering to no letter is not a letter and there is nothing to store. */
  cut=longCut(text, names, {fold:true, drop:true});
  for(i=0;i<cut.length;i++) out.push({l:by[cut[i]]});
  return out;
}
/* The field a word is typed into, wherever one is typed into.
   Three screens have one -- the new-word sheet, the editor, and the word a
   grammar stage asks for -- and the third differs only in holding sounds
   rather than letters, so it builds its own. These two were the same line
   twice. */
function spTypeField(id, into, sp, cls){
  /* No placeholder. The box said つづり inside itself with a heading
     saying the same thing directly above it, which is one fact written twice
     and the second copy sitting where the answer goes.
     「四角のなかにつづりとか読みとか書くの消して」 */
  /* In the person's own letters, because that is what the word IS. The box
     holds the letters' names -- a to z -- and roman is what those names look
     like, not what the word looks like. 「単語の文字のところが英語なのはなぜ？」 */
  return lnField(id, '', IN(into), spWord(sp||[]), cls+(myFontOn()? ' sfont' : ''));
}
function spWord(sp){
  var out='', i, l;
  for(i=0;i<sp.length;i++){
    l=ltById(sp[i].l);
    out += l? String(ltName(l)||'') : String(sp[i].u||'');
  }
  return out;
}
function spPh(sp){
  var out=[], i;
  for(i=0;i<sp.length;i++) out=out.concat(uSplit(spUnit(sp[i])));
  return out;
}
/* Words from when a word was its sounds. Each of them carries a unit on every
   position -- a copy of what its letter reads -- and a headword made of those
   sounds run together. Both were true then and neither is now.

   So: the copies go, except where one genuinely differs, which is the sound
   change that was worth keeping. And the headword is written out of the
   letters, which is what it always looked like it was.

   It renames a word only when every position is a letter with a name, and
   only when the name it comes out with is not already taken. A word that
   cannot be written out of its letters keeps the headword it has -- there is
   nothing better to call it, and a rename that collides would merge two
   words into one, which is not a thing to do to somebody's dictionary. */
function migrateSp(){
  var moved=0, i, j, w, sp, l, hw, taken={};
  for(i=0;i<WORDS.length;i++) taken[String(WORDS[i].hw)]=1;
  for(i=0;i<WORDS.length;i++){
    w=WORDS[i];
    if(!w.sp || !w.sp.length) continue;
    if(w.spv) continue;                      /* already answered */
    sp=w.sp;
    for(j=0;j<sp.length;j++){
      l=ltById(sp[j].l);
      if(l && ltFirstUnit(l)===sp[j].u) delete sp[j].u;
    }
    hw=spWord(sp);
    if(hw && hw!==String(w.hw) && !taken[hw]){
      delete taken[String(w.hw)]; taken[hw]=1;
      wRename(String(w.hw), hw);
    }
    delete w.ph;
    w.spv=1;
    moved++;
  }
  if(moved) save();
}
/* Everything that points at a word by name, told the new one. saveWord has
   done this since words could be renamed; it is here because a migration
   renames them too, and two copies of "what points at a word" is how one of
   them comes to miss the examples. */
function wRename(old, hw){
  var i;
  for(i=0;i<WORDS.length;i++){
    if(String(WORDS[i].hw)===old) WORDS[i].hw=hw;
    if(WORDS[i].from===old) WORDS[i].from=hw;
  }
  wRelRename(old, hw);
  for(i=0;i<LINES.length;i++)
    LINES[i].ws=LINES[i].ws.map(function(x){ return x===old? hw : x; });
  /* The trail points at it too. A word page is a route carrying the spelling,
     the spelling is the only name a word has, and editing a word is mostly
     editing that -- so a rename left every screen behind you asking for a
     word that no longer exists, and Save landed you on "that is no longer
     here" with the word saved perfectly under its new name. */
  navRename('word:'+old, 'word:'+hw);
  navRename('edit:'+old, 'edit:'+hw);
}
/* The spelling of a word that has none: cut it the way its writing system
   would, and ask which letter writes each piece. */
function spOf(w){
  if(w && w.sp && w.sp.length) return w.sp;
  var u=wsSplit(wPh(w||{ph:[]})), out=[], i, l;
  for(i=0;i<u.length;i++){
    l=ltMain(u[i]);
    out.push({l:l? l.id : '', u:u[i]});
  }
  return out;
}
