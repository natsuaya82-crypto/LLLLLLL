/* Lingua — what a letter is a letter OF
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   The app could only make one kind of writing system, and never said so. You
   drew a shape and were asked, immediately, which single sound it was for --
   which is not a question every writing system has an answer to. It assumed
   an alphabet, and then hid the assumption inside a screen that looked like
   it was asking something open.

   There are five kinds, and every one of them is in use by somebody today:

     alphabet    one letter, one sound            a  k
     syllabary   one letter, one syllable         か = ka, き = ki
     abjad       consonants written, vowels not   Arabic, Hebrew
     abugida     a consonant letter with a vowel mark added
                                                  क = ka, कि = ki
     logography  one letter, one word             Han characters

   None of this needs a new idea underneath, because a word here has been a
   sequence of sounds since the phoneme rework. All that changes is where the
   sequence is cut before each piece is given a shape. An alphabet cuts at
   every sound; a syllabary at every syllable; an abjad throws the vowels away;
   a logography does not cut at all. An abugida cuts at every syllable too, but
   its shape is made rather than drawn: the consonant's letter and the vowel's
   mark are two stroke lists, and a letter is a stroke list, so the two are
   simply added together.

   The font writer needed nothing new either. A unit longer than one character
   has no code point of its own, so it becomes an OpenType ligature over the
   characters it is made of -- exactly the mechanism the two-letter digraphs
   used before any of this. You type the sounds and the font draws the letter. */

var WSYS=['alpha','syll','abjad','abugida','logo'];

/* ---- which of the five this is ----------------------------------------
   Asking somebody to choose between an abjad and an abugida before they have
   drawn anything is asking them to know the answer to a question they came
   here to find out. So it is worked out from what they made, and the letters
   are the evidence: what a letter reads is exactly where the language is
   being cut, which is the only thing that separates the five.

     a letter reads a whole word           logography
     a letter reads more than one sound    syllabary
     letters read single sounds, and the
       language has vowels that none of
       them reads                          abjad
     otherwise                             alphabet

   An abugida is not in that list because it cannot be. Its letters read
   single sounds like an alphabet's; what makes it an abugida is that the
   vowel is a mark added to the consonant rather than a letter beside it, and
   that is a fact about how the two are drawn together, not about what any one
   of them reads. It stays a thing you say, and saying it is what SET.wsys is
   for.

   Which is also why nothing anybody already has moves: SET.wsys is set for
   everyone who was asked during onboarding, and a stored answer wins. The
   guess is for the people who are never going to be asked. */
function wsGuess(){
  var read = [], i, j, u;
  for(i=0;i<LETTERS.length;i++){
    if(typeof ltIsMark==='function' && ltIsMark(LETTERS[i])) continue;
    var sn=LETTERS[i].snd;
    if(!sn) continue;
    for(j=0;j<sn.length;j++) if(sn[j] && read.indexOf(sn[j])<0) read.push(sn[j]);
  }
  if(!read.length) return 'alpha';       /* nothing to go on yet */

  /* a letter that reads a whole word */
  for(i=0;i<WORDS.length;i++){
    u=wsKey(wPh(WORDS[i]));
    if(u && read.indexOf(u)>=0) return 'logo';
  }
  /* a letter that reads more than one sound. A unit that is one of the
     language's sounds is one sound; anything else is several joined
     together, which is what wsKey does to make a unit in the first place. */
  var snds=addedSnd();
  for(i=0;i<read.length;i++){
    if(snds.indexOf(read[i])<0) return 'syll';
  }
  /* single sounds only: is any vowel written? */
  var vows=snds.filter(function(p){ return ipaIsVowel(p); });
  if(vows.length){
    for(i=0;i<vows.length;i++) if(read.indexOf(vows[i])>=0) return 'alpha';
    return 'abjad';
  }
  return 'alpha';
}
/* A stored answer wins, always. Otherwise the guess. */
/* An alphabet, and nothing to guess, on the free plan: the other four are
   paid, and the free alphabet is a-z with the sounds those letters are
   normally read with -- most of which the language has not taken up on the
   chart, which is exactly what wsGuess reads as a syllabary. So the guess
   was answering a question that only has one answer here. */
function wsys(){
  if(!can('wsys')) return 'alpha';
  return WSYS.indexOf(SET.wsys)>=0 ? SET.wsys : wsGuess();
}
function setWsys(k){
  if(WSYS.indexOf(k)<0) return;
  /* The screen only offers the alphabet on the free plan; this is the same
     sentence said where it can be relied on, since a route can be arrived at
     from anywhere and a plan can end while one of the other four is set. */
  if(!can('wsys') && k!=='alpha'){ goPlans(); return; }
  SET.wsys=k; save();
  installScriptFont();
  render();
}
/* An abugida is the only one that builds a letter out of two drawings, so it
   is the only one that has two kinds of thing to draw. */
function wsHasMarks(){ return wsys()==='abugida'; }

/* ---- cutting a word into the pieces its writing has letters for -------- */
function wsCons(){
  return addedSnd().filter(function(p){ return !ipaIsVowel(p); });
}
function wsVows(){
  return addedSnd().filter(function(p){ return ipaIsVowel(p); });
}
/* The key a glyph is stored under. One character for a single sound; the
   sounds run together for anything longer, which is also exactly the string a
   ligature substitutes. */
function wsKey(a){ return a.join(''); }

/* A word, as the units its writing system would write it in. */
function wsSplit(seq){
  var k=wsys(), out=[], i, cut, c, v;
  if(!seq || !seq.length) return [];
  if(k==='logo') return [wsKey(seq)];
  if(k==='alpha') return seq.slice();
  if(k==='abjad'){
    for(i=0;i<seq.length;i++) if(!ipaIsVowel(seq[i])) out.push(seq[i]);
    return out;
  }
  if(k==='abugida'){
    /* every consonant takes the vowel that follows it; a vowel with no
       consonant in front of it stands on its own, as it does in Devanagari */
    i=0;
    while(i<seq.length){
      c=seq[i];
      if(ipaIsVowel(c)){ out.push(c); i++; continue; }
      v=(i+1<seq.length && ipaIsVowel(seq[i+1])) ? seq[i+1] : null;
      if(v){ out.push(wsKey([c,v])); i+=2; }
      else { out.push(c); i++; }
    }
    return out;
  }
  /* a syllabary */
  cut=phCut(seq);
  for(i=0;i<cut.length;i++) out.push(wsKey(cut[i].on.concat(cut[i].nu).concat(cut[i].co)));
  return out;
}
function wsUnitsOf(w){ return wsSplit(wPh(w)); }

/* ---- what has to be drawn --------------------------------------------
   The list of letters this writing system needs, which is a different list
   for each of the five and is worked out from the language rather than
   guessed. Anything already drawn is kept in the list even if nothing uses
   it any more, so a letter never silently disappears. */
function wsUnits(){
  var k=wsys(), seen={}, out=[], i, j, u, cs, vs;
  function push(x){ if(x && !seen[x]){ seen[x]=1; out.push(x); } }
  if(k==='alpha'){ addedSnd().forEach(push); }
  else if(k==='abjad'){ wsCons().forEach(push); }
  else if(k==='abugida'){
    /* the letters and the marks are what gets drawn, and every consonant with
       a vowel on it that a word actually uses is a letter too -- made out of
       those two, and needing a glyph of its own in the font so that the
       ligature has somewhere to land */
    wsCons().forEach(push); wsVows().forEach(push);
    for(i=0;i<WORDS.length;i++){
      u=wsSplit(wPh(WORDS[i]));
      for(j=0;j<u.length;j++) push(u[j]);
    }
  }
  else if(k==='logo'){ WORDS.forEach(function(w){ push(wsKey(wPh(w))); }); }
  else {
    /* a syllabary writes the syllables the language actually says; every
       consonant against every vowel would be hundreds of letters to draw,
       most of which no word would ever need */
    for(i=0;i<WORDS.length;i++){
      u=wsUnitsOf(WORDS[i]);
      for(j=0;j<u.length;j++) push(u[j]);
    }
    /* with no words yet there is still something to start on: every sound
       against every vowel, so a syllabary can be begun before a dictionary */
    if(!out.length){
      cs=wsCons(); vs=wsVows();
      for(i=0;i<cs.length;i++) for(j=0;j<vs.length;j++) push(wsKey([cs[i],vs[j]]));
      if(!out.length) vs.forEach(push);
    }
  }
  /* and everything a letter already reads, so a unit no word needs any more
     never silently drops off the page it was drawn on */
  LETTERS.forEach(function(l){ (l.snd||[]).forEach(push); });
  return out;
}
/* In an abugida the consonants are letters and the vowels are marks put on
   them, so the screen shows them as two lists and says which is which. */
/* The letters an abugida works out for itself: a consonant with a vowel on
   it. They are shown but not drawn -- the two pieces are what you change. */
/* ---- an abugida's letter is made, not drawn ---------------------------
   A letter is a list of strokes and so is a vowel mark, so the letter for a
   consonant-plus-vowel is the two lists one after the other. Nothing has to
   know how to combine drawings, because there is nothing to combine: strokes
   in the same square are already one letter. */
function wsStrokes(unit){
  var own=ltStrokes(unit);
  if(own && own.length) return own;
  if(wsHasMarks() && unit && unit.length>1){
    var i, base=null, mark=null, ch;
    for(i=0;i<unit.length;i++){
      ch=unit.charAt(i);
      if(ipaIsVowel(ch)) mark=ltStrokes(ch);
      else base=ltStrokes(ch);
    }
    if(base && base.length && mark && mark.length) return base.concat(mark);
    if(base && base.length) return base;
  }
  return null;
}
/* A word in the letters chosen for it. Used for borrowed characters; drawn
   letters are a font and need no substitution. */
function wsInScript(hw){
  var u=wsSplit(seqOf(hw)), out=[], i, c;
  for(i=0;i<u.length;i++){ c=ltChar(u[i]); out.push(c || u[i]); }
  return out.join('');
}

/* ---- which way the language is written --------------------------------
   「縦書き、右→左 左→右の投稿」「言語の設定でしょ右左とかは」

   Four, and the two vertical ones differ only in which side the first column
   is on: 「右から左と左から右の両方」.

     ltr      left to right
     rtl      right to left
     ttb-rl   in columns, top to bottom, the first column at the right
     ttb-lr   in columns, top to bottom, the first column at the left

   It belongs to the LANGUAGE, not to the person and not to the post, so it is
   in the `script` slice beside the glyphs -- which means it is in the backup,
   it travels when a language is opened, and there is one answer per language
   rather than one per phone. SET.wsys is the other way round and is the older
   mistake; what the language is for was in SET too, until it was moved out.

   Reading one is free, on every plan. Setting one is `dir`, at Plus. Nothing
   in the app asks can('dir') before drawing anything -- see the note on CAN
   in core.js. */
var DIRS=['ltr', 'rtl', 'ttb-rl', 'ttb-lr'];
/* Left to right on the free plan, and the stored answer is kept untouched
   underneath -- exactly as wsys() returns 'alpha' without clearing SET.wsys.

   A language that came down from a paid plan runs the free way while it is
   there, and runs its own way again the moment the plan comes back. Nothing
   is rewritten and nothing is lost: SCRIPT.dir is in the `script` slice and
   in the backup, and it is one string.

   This is the whole plan speaking with one voice -- 「無料に戻ったら無料の形
   に戻る、作ったものは全部残る」 -- rather than this one capability being
   the exception that keeps working after the money stops. */
function scriptDir(){
  if(!can('dir')) return 'ltr';
  return DIRS.indexOf(SCRIPT.dir)>=0 ? SCRIPT.dir : 'ltr';
}
/* What a direction is called in CSS. `writing-mode` is the whole of it for
   the two vertical ones -- vertical-rl and vertical-lr say which side the
   first column is on -- and `direction` is the whole of it for the two
   horizontal ones. The class carries it rather than a style attribute so
   there is one place it is written down. */
function dirClass(d){
  return 'dir-'+(DIRS.indexOf(d)>=0 ? d : 'ltr');
}
/* The horizontal direction a vertical one falls back to, for the two places a
   column cannot go, said once rather than at both of them:

     the composer's field   a textarea in a column is not something this
                            webview does. lnFit() measures scrollHeight to
                            size it, the caret goes where the browser feels
                            like putting it, and a person who cannot type
                            cannot post
     the card               a landscape composition, 1920 by 1080, with the
                            letters in a band across the middle. A column has
                            nowhere to go in it

   Falling back to the direction the COLUMNS run is not a guess: a vertically
   written language set across the page runs that way, which is what a
   horizontal banner of Japanese is. It is a compromise and it is written down
   in docs/BACKLOG.md rather than left to be found. */
function dirFlat(d){
  if(d==='ttb-rl') return 'rtl';
  if(d==='ttb-lr') return 'ltr';
  return DIRS.indexOf(d)>=0 ? d : 'ltr';
}
function setScriptDir(k){
  if(DIRS.indexOf(k)<0) return;
  /* The screen only offers this on a paid plan; this is the same sentence
     said where it can be relied on, since a route can be arrived at from
     anywhere and a plan can end while one of the four is set. Exactly as
     setWsys() does it. */
  if(!can('dir')){ goPlans(); return; }
  SCRIPT.dir=k; save();
  render();
}
