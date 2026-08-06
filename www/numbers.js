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
   the moment it stops copying. Sixteen is here because somebody always wants
   it. Anything not on the list is ten, so a stored base can never be a number
   the rest of this file cannot draw digits for. */
var NUM_BASES=[10, 12, 16, 20];
function numBase(){
  var b=(typeof STG!=='undefined' && STG)? STG.base : 10;
  return (NUM_BASES.indexOf(b)>=0)? b : 10;
}
function numSetBase(b){
  STG.base=(NUM_BASES.indexOf(b)>=0)? b : 10;
  saveStg(); render();
}
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
function numBaseRows(){
  return '<div class="sec">'+esc(t('num.base'))+'</div>'+
    NUM_BASES.map(function(b){
      return '<button class="set"' + DO('numSetBase', [b]) + '>'+
        '<span class="sl">'+esc(numLabel(b))+'</span>'+
        '<span class="sv">'+(numBase()===b? ICON_TICK : '')+'</span></button>';
    }).join('');
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
