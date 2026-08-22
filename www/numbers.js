/* Lingua — numbers (chapter 18)
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   A digit is a letter.

   That is the whole design and it is worth saying plainly, because the
   alternative -- a second kind of thing with its own store, its own list, its
   own way of being drawn -- would mean a second copy of the drawing surface,
   the font writer, the borrow-a-character picker and the letters chapter. All
   of that already works and none of it cares whether the shape it is holding
   means a sound or a quantity.

   So a letter carries a value as well as a reading, and a letter that has one
   is a digit. Nothing else is added anywhere.

   The three kinds are exclusive, and none of them is stored as a kind:

     it reads a sound        -> a letter
     it has a value          -> a digit
     it reads something that
     is not a sound          -> a mark

   Which means giving a letter a value takes its reading away and giving it a
   reading takes its value away, rather than leaving a sign that is quietly
   two things at once.

   Whether there is a zero is not a setting. A zero is a digit whose value is
   zero, so a system that has one has that letter and a system that does not,
   does not. 「数字を文字にするなら0があるかないか選べるでしょ」

   The base is the language's, not the person's, so it lives in STG beside the
   grammar -- it decides how many digits there are AND how the number words
   are built, and those are one decision seen from two chapters.
   ========================================================================= */

/* =========================================================================
   18. Numbers
   ========================================================================= */

/* Ten is not special; twelve and twenty are what a made language reaches for
   the moment it stops copying. It was four of them -- 10, 12, 16, 20 -- and
   that list had nothing under ten in it, which is the app deciding a language
   cannot count in six or eight. Both are real, in spoken languages and in
   made ones. Two is the floor because one digit is not a base, and twenty is
   the ceiling because nothing above it is used to count with.
   「2〜20で」 Anything off the list is ten, so a stored base can never be a
   number the rest of this file cannot draw digits for. */
var NUM_BASES=(function(){ var a=[], b; for(b=2;b<=20;b++) a.push(b); return a; }());
function numBase(){
  var b=(typeof STG!=='undefined' && STG)? STG.base : 10;
  return (NUM_BASES.indexOf(b)>=0)? b : 10;
}
function numSetBase(b){
  STG.base=(NUM_BASES.indexOf(b)>=0)? b : 10;
  saveStg(); numTopUp(); numDropBlank(); render();
}
/* A digit nobody has touched: no strokes, no sound, and no name anybody
   typed. The slot itself is the app's -- numTopUp made it -- so it is the one
   thing here that was never anybody's work. Everything else on a digit is.

   Not ltName(): a digit says what it is WORTH, so ltName never comes back
   empty for one and every slot read as somebody's. What a person can put on a
   digit is nm and ab, and those are the two to ask about. */
function numBlank(l){
  return !(l.st && l.st.length) && !(l.snd && l.snd.length) && !l.nm && !l.ab;
}
/* Counting back down. Every digit the new base cannot reach is looked at
   once: an empty slot goes, and one that has been drawn on, named or given a
   sound STAYS and is shown in red by the room.
   「あげた時に文字や音とか設定してたら赤くなって、なにも書いてなかったら勝手に
   減らしていいよ」 DELETE REVIEW is in docs/CHANGELOG.md.

   This is the only automatic deletion in the app and it runs in exactly one
   place: the press that lowers the base. Not on open, not on save, not on a
   timer -- an empty slot sitting above the base is not a reason on its own. */
function numDropBlank(){
  var gone=[], i, l;
  for(i=0;i<LETTERS.length;i++){
    l=LETTERS[i];
    if(numOver(l) && numBlank(l)) gone.push(l.id);
  }
  if(!gone.length) return 0;
  for(i=0;i<gone.length;i++) ltDel(gone[i]);
  return gone.length;
}
/* One slot per value the base has, made for any value that has none. The one
   place digits are brought into being: ltStart calls it when a free language
   opens, and numSetBase calls it the moment somebody counts higher, so the
   slots are there to draw on immediately rather than at the next launch.
   「数字は増やしなさい」

   It only ever ADDS. Counting back down leaves every digit above the new base
   exactly where it is -- somebody drew those. What happens to them is a thing
   the room says, not a thing this removes. */
function numTopUp(){
  var v, n=numBase(), made=0;
  for(v=0;v<n;v++){
    if(numByVal(v)) continue;
    ltNew({val:v});
    made++;
  }
  if(made) saveLetters();
  return made;
}
/* A digit the base can no longer reach. Nothing is taken away and nothing is
   hidden -- it is drawn and it is somebody's -- but a language counting in
   ten cannot write an eleven, and the room says so by the cell being red
   rather than by a sentence explaining it. */
function numOver(l){ return numIsDigit(l) && l.val>=numBase(); }
function numIsDigit(l){ return !!(l && typeof l.val==='number'); }
/* In the order they count in, which is the only order a digit has. */
function numDigits(){
  return LETTERS.filter(numIsDigit).sort(function(a, b){ return a.val-b.val; });
}
function numByVal(v){
  var i;
  for(i=0;i<LETTERS.length;i++) if(LETTERS[i].val===v) return LETTERS[i];
  return null;
}
/* Giving a letter a value. It stops reading a sound, because a sign is one
   thing: the same rule that keeps a mark from also being a letter. A value
   another digit already has is refused rather than silently moved, exactly as
   a reading another letter already has is. */
function numSetVal(id, v){
  var l=ltById(id), other;
  if(!l) return;
  if(v<0){ delete l.val; saveLetters(); installScriptFont(); render(); return; }
  /* A quantity as big as the base is two digits, which is what a base IS, so
     there is no single sign for it. */
  if(v>=numBase()){ toast(t('num.big', numLabel(numBase()-1))); return; }
  other=numByVal(v);
  if(other && other.id!==id){ toast(t('lt.dup', numLabel(v))); return; }
  l.val=v; l.snd=[];
  saveLetters(); installScriptFont(); render();
}
/* A value is written the way everybody reads a number, in the ten they came
   with -- the point of the base is what the language does with it, not making
   somebody count in twelve to find the button. */
function numLabel(v){ return String(v); }

/* The smallest value nothing has yet, for a digit made from the + button. */
function numFree(){
  var i, b=numBase();
  for(i=0;i<b;i++) if(!numByVal(i)) return i;
  return -1;
}
/* The base goes where the kind of writing goes, and for the same reason the
   five kinds moved off the letters chapter: it is answered once and then
   never again, so it does not belong on a page opened every day.
   「10新法とかは決めたら変えねえんだからそこじゃないだろ」 */
/* One number, stepped. It was every value in the range laid out to be tapped
   -- four of them at first, and nineteen once the range opened, which is a
   wall of numbers to say one number. 「そんな並べるバカはどこにいんの？」
   A base is a single value and it is a value on a line, so it is nudged. */
function numStepBase(d){
  var b=numBase()+d;
  if(b<NUM_BASES[0] || b>NUM_BASES[NUM_BASES.length-1]) return;
  numSetBase(b);
}
function numBaseRows(){
  /* Free counts in ten and has no say in it: what the base decides is how
     many digits there are, and adding a letter is the paid plan's. Without
     this the row offered a free language twelve slots that ltStart would
     make and can('letters') would then refuse to let anybody add to.
     「無料は0〜9しか書けないんだから±はなし」 */
  if(!can('letters')) return '';
  var b=numBase(), lo=NUM_BASES[0], hi=NUM_BASES[NUM_BASES.length-1];
  return '<div class="set numbase">'+
    '<span class="sl">'+esc(t('num.base'))+'</span>'+
    '<span class="nbstep">'+
      '<button class="nbb"' + DO('numStepBase', [-1]) + (b<=lo? ' disabled':'')+
        ' aria-label="'+esc(numLabel(b-1))+'">'+ICON_MINUS+'</button>'+
      '<span class="nbv">'+esc(numLabel(b))+'</span>'+
      '<button class="nbb"' + DO('numStepBase', [1]) + (b>=hi? ' disabled':'')+
        ' aria-label="'+esc(numLabel(b+1))+'">'+ICON_ADD+'</button>'+
    '</span></div>';
}

/* ---- the words, and the signs beside them ------------------------------- */
/* One word for every digit, and one for the base itself: ten of them in base
   ten, twelve in base twelve. Everything above that is those words put
   together, which is what a base IS and is the grammar's business rather than
   this list's. */
function numWordSlots(){
  var out=[], i, b=numBase();
  for(i=1;i<=b;i++) out.push(numLabel(i));
  return out;
}
/* The word the counting stage holds for a value, if it has been made. */
function numWordFor(v){
  var p=stBy('count');
  return p? stWordFor(p, numLabel(v)) : null;
}
/* A digit's sign, small, beside its word on the counting stage. A value as
   big as the base has no single sign -- it is two of them -- so it shows
   nothing rather than something wrong. */
function numFace(k){
  var v=parseInt(k, 10), l;
  if(isNaN(v)) return '';
  l=numByVal(v);
  if(!l || !ltHasShape(l)) return '';
  return (l.st && l.st.length)
    ? '<canvas class="tc numsm" data-l="'+esc(l.id)+'"></canvas>'
    : '<span class="bch numsm">'+esc(l.ch)+'</span>';
}
/* And the other way round: a digit's word, on the digit, with the way to go
   and make it. The sign and the word are one thing seen from two chapters. */
function numWordRow(l){
  var w=numWordFor(l.val);
  return '<div class="sec">'+esc(t('num.word'))+'</div>'+
    '<button class="trow"' + DO('openSlot', ["count", numLabel(l.val)]) + '>'+
      '<span class="rn"></span><span class="rt">'+esc(w? w.hw : t('stg.make'))+'</span>'+
      '<span class="lead"></span>'+
      '<span class="rv">'+esc(w? phIpa(wPh(w)) : '')+'</span>'+ICON_GO+'</button>';
}
