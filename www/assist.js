/* Lingua — the app proposes, the person chooses
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   Everything in this app used to begin with a blank. Which sounds is the word
   for "I" made of. That is a question somebody who has already made a language
   can answer, and nobody else, so the app was only usable by people who did
   not need it.

   Nothing here decides anything. It puts something in front of you that you
   can hear, and you say yes, or ask for another, or do it yourself. That is
   the only division of labour that works: the app does the part that is
   arithmetic, the person does the part that is taste.

   There was a second generator here, asSounds(), which proposed a whole sound
   inventory out of five regions of the chart. Nothing asked it for a proposal:
   its one caller was sndStart(), which put twelve of them straight into a new
   language without anybody saying yes. A proposal nobody can refuse is not a
   proposal, and what a language sounds like is not the app's to say -- see
   CLAUDE.md § What the free plan is. Sounds arrive one at a time now, on the
   letter somebody names, which is the only way they ever really arrived.

   AI_SEAM: when the hosted model is wired up it replaces the generator below
   and nothing else. The screens ask for a proposal and get a list back;
   where the list came from is not their business. Until then the list comes
   from here, which means it works with no network and costs nothing. */

/* ---- words, proposed --------------------------------------------------
   Built out of the sounds this language already has, in the shapes it
   already uses them in -- so a proposed word sounds like it belongs, and a
   sound the language does not have can never appear in one. */
function asWord(pos, avoid){
  var A=analyze(), tk=taken(), i, seq;
  if(avoid) for(i=0;i<avoid.length;i++) tk[avoid[i].join('')]=1;
  seq=makeWord(pos||'x', A, tk);
  if(seq) return seq;
  /* Before there are any words there is nothing to imitate, so the shape is
     the plainest one there is: a consonant and a vowel, once or twice. */
  var cs=addedSnd().filter(function(p){ return !ipaIsVowel(p); });
  var vs=addedSnd().filter(function(p){ return ipaIsVowel(p); });
  if(!vs.length) return null;
  var n=1+Math.floor(Math.random()*2);
  seq=[];
  for(i=0;i<n;i++){
    if(cs.length) seq.push(cs[Math.floor(Math.random()*cs.length)]);
    seq.push(vs[Math.floor(Math.random()*vs.length)]);
  }
  return seq;
}
/* The chart's own order, so adding a sound does not shuffle the keyboard. */
function asOrder(list){
  var all=ipaAll();
  return list.slice().sort(function(a,b){ return all.indexOf(a)-all.indexOf(b); });
}

/* ---- words, made up for the dictionary (1.0.3) --------------------------
   「単語自動生成もやるか。足そう」 OWNER 2026-09-26. The generate screen
   (www/words.js § vGen) asks for a handful of words and the person picks one.

   What a word is MADE of here is the two things the owner named: the
   language's sounds and its syllable shapes.

   The sounds are the ones its LETTERS write, not the whole inventory -- a
   word is its letters (www/letters.js § a word is its letters), so a sound no
   letter writes is a word nobody can spell. Every candidate is spelled
   through spOf(), the same road a word with no spelling takes, and one with a
   position no letter answers is thrown away rather than shown.

   The shapes are the language's: STG.syl, chosen on the screen beside this
   one (vGenSyl). A language that has chosen none is read off its dictionary
   -- the shapes its words are already cut into (phCut) -- and nothing is
   written for that; a language with no words and no shapes gets no
   candidates, and the screen says so. */
var GEN_SHAPES=['V','CV','VC','CVC','CCV','CVCC','CCVC'];
function genShapes(){
  var own=(STG.syl||[]).filter(function(s){ return GEN_SHAPES.indexOf(s)>=0; }), seen={}, out=[];
  if(own.length) return own;
  WORDS.forEach(function(w){
    phCut(wPh(w)).forEach(function(p){
      var s, i;
      if(!p.nu.length) return;
      s=''; for(i=0;i<p.on.length;i++) s+='C';
      s+='V'; for(i=0;i<p.co.length;i++) s+='C';
      if(GEN_SHAPES.indexOf(s)>=0 && !seen[s]){ seen[s]=1; out.push(s); }
    });
  });
  return GEN_SHAPES.filter(function(s){ return !!seen[s]; });
}
function genSounds(){
  var all=ipaAll(), seen={}, out={c:[], v:[]};
  LETTERS.forEach(function(l){
    ltUnits(l).forEach(function(u){
      uSplit(u).forEach(function(s){
        if(seen[s] || all.indexOf(s)<0) return;
        seen[s]=1; (ipaIsVowel(s)? out.v : out.c).push(s);
      });
    });
  });
  return out;
}
/* n words, each {seq, sp, hw}: its sounds, its letters, its spelling. None
   sounds like a word the dictionary has (taken()) or like another of the n. */
function genWords(n){
  var sh=genShapes(), S=genSounds(), tk=taken(), out=[], tries=0, lens=[1,2,2,3],
      seq, shape, nsyl, sp, hw, i, j, ok;
  function one(a){ return a[Math.floor(Math.random()*a.length)]; }
  if(!S.c.length) sh=sh.filter(function(s){ return s.indexOf('C')<0; });
  if(!sh.length || !S.v.length) return out;
  while(out.length<n && tries<n*80){
    tries++;
    nsyl=one(lens); seq=[];
    for(i=0;i<nsyl;i++){
      shape=one(sh);
      for(j=0;j<shape.length;j++) seq.push(shape.charAt(j)==='V'? one(S.v) : one(S.c));
    }
    if(tk[seq.join('')]) continue;
    /* spOf() writes each position's sound on it; where that is what its
       letter reads anyway it is agreement, not a sound change, and comes
       off (spSetU) */
    sp=spOf({ph:seq}); ok=sp.length>0;
    for(i=0;i<sp.length;i++){ if(!sp[i].l) ok=false; else spSetU(sp[i], sp[i].u); }
    if(!ok) continue;
    hw=spWord(sp);
    if(!hw || findWord(hw)) continue;
    tk[seq.join('')]=1;
    out.push({seq:seq, sp:sp, hw:hw});
  }
  return out;
}
