/* Lingua — how a word is read out: IPA, the approximation, and the voice
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */


/* ---- What the rest of the app is allowed to know ------------------------
   The IPA is universal, so it is never swapped. Only the reading changes,
   and every screen goes through rd(), so no screen knows which language it
   is showing. What rd() is handed is the Latin approximation of a sequence,
   never a word as it is stored. */
function approx(){ return langDef().read || LANG.en.read; }
function rd(word){ return approx().word(word); }        /* reading for this language */
/* The name of the approximation reads as a common noun inside a sentence
   ("respelling is an approximation") but wants a capital as a button. */
function capFirst(s){ return String(s).charAt(0).toUpperCase()+String(s).slice(1); }
/* Search hits on any of spelling, meaning, reading or IPA */
/* What a search looks in. The fields a word is filed under are in it, so
   typing `cooking` finds the words about cooking -- which is the only
   reason to have written them down. */
function srcKey(w){ return (w.hw+' '+wMns(w).join(' ')+' '+phIpa(wPh(w))+
                            ' '+((w.tags||[]).join(' '))).toLowerCase(); }

/* ---- How a word is read out ------------------------------------------
   A word is a sequence of IPA symbols, so its exact reading is that sequence
   and there is nothing to derive: phIpa() in core.js is the whole of it.

   What used to sit here derived the IPA from the Latin spelling instead --
   th was one sound because English reads it as one, a doubled vowel was a
   long one, x was ks. Every one of those is a rule from somebody else's
   language. All of it is gone.

   The respelling stays, because it answers a different question: not what
   the sound is, but what it looks like to somebody who does not read the
   IPA. It is handed the Latin approximation from ipaRoman(), and the ten
   engines below carry on reading Latin as they always did. */
function readSeq(seq){
  var m=readMode();
  if(m==='ipa')  return phIpa(seq);
  if(m==='kana') return rd(phRoman(seq));
  return phIpa(seq)+t('read.sep')+rd(phRoman(seq));
}
/* Called with a headword, which is what every screen has to hand. A word in
   the dictionary is read from its own sounds; anything else -- a word being
   coined, a sample -- from the sounds its spelling would be made of. */
function seqOf(hw){
  var w=(typeof findWord==='function')? findWord(hw) : null;
  return w? wPh(w) : phGuess(hw);
}
/* Words run together when one ends on a consonant and the next opens on a
   vowel. Decided on the sounds, which is where it was always happening. */
/* How readings are displayed (a setting): IPA / approximation / both.
   The stored value 'kana' is kept as-is for dictionaries saved before this
   layer existed; it means "the approximation", whatever language that is. */
function readMode(){ return SET.read||'both'; }

/* ---- The device's voice is not here any more ---------------------------
   There used to be a block below this line that found a voice on the phone,
   picked the one whose language had the plainest vowels, and read a word
   through it -- reading the katakana instead of the spelling when the only
   voice was Japanese. All of it was a way of choosing whose accent to be
   wrong in. A phoneme is built now, in www/voice.js, out of the chart's own
   features, so there is nothing left for a device voice to do. */

/* Generation: build new words that keep the rules we inferred.
   Also plain arithmetic on the device. */
function pick(o){
  var e=Object.keys(o).map(function(k){return [k,o[k]];});
  if(!e.length) return '';
  var sum=0,i; for(i=0;i<e.length;i++) sum+=e[i][1];
  var r=Math.random()*sum;
  for(i=0;i<e.length;i++){ r-=e[i][1]; if(r<=0) return e[i][0]; }
  return e[0][0];
}
/* Two words that sound identical are the same word, whatever they look like */
function taken(){
  var s={}; WORDS.forEach(function(w){ s[wPh(w).join('')]=1; }); return s;
}
/* Coining a word means choosing sounds, in the shapes this language already
   uses them in. It used to mean assembling Latin letters and then guessing
   what they said -- so a coined word could contain a sound the language had
   never chosen. It cannot now: every piece comes out of the dictionary's own
   sequences. Hands back a sequence, because that is what a word is. */
function makeWord(pos, A, tk){
  A=A||analyze(); tk=tk||taken();
  if(!Object.keys(A.nu).length) return null;
  var rule=A.finalRule[pos];
  for(var tr=0;tr<120;tr++){
    var n=Math.max(1,Math.min(3,+pick(A.cnt)||2));
    var seq=[], i, pool;
    for(i=0;i<n;i++){
      pool = i===0 ? A.onI : (Object.keys(A.onM).length?A.onM:A.onI);
      seq = seq.concat(phUnkey(pick(pool))).concat(phUnkey(pick(A.nu)));
    }
    if(rule){
      var ch=rule.ch;
      while(seq.length && !ipaIsVowel(seq[seq.length-1])) seq.pop();
      if(ipaIsVowel(ch)){ while(seq.length && ipaIsVowel(seq[seq.length-1])) seq.pop(); }
      seq.push(ch);
    } else if(Object.keys(A.co).length && Math.random()<.35){
      seq = seq.concat(phUnkey(pick(A.co)));
    }
    if(seq.length < (tr<70?3:2)) continue;   /* look for three sounds first, settle for two */
    var key=seq.join('');
    if(tk[key]) continue;
    tk[key]=1;
    return seq;
  }
  return null;
}
/* Pick a short run of words that shows linking off, if the dictionary has one:
   one that ends on a consonant followed by one that opens on a vowel. */
/* What to do next so that another rule appears, in words a beginner can act on */
