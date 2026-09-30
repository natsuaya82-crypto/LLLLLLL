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
  var A=analyze(), tk=asTaken(), i, seq;
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
   「単語自動生成もやるか。足そう」 OWNER 2026-09-26, and where it is pressed:
   one button on the new-word sheet, which fills everything but the meaning
   (www/wordsheet.js § wdGen, OWNER 2026-09-30 「自動生成ボタン押したらここが
   埋まるみたいな感じ」「意味とか以外ね」).

   WHAT A WORD IS MADE OF IS LEARNED FROM THE DICTIONARY. 「単語がたくさんあれば
   それを読み込んで動詞はaで終わるからaねってできるわけでしょ？」 Every word is
   cut into syllables (phCut) and the pieces go into pools, one entry per
   time they occur, so drawing from a pool draws a sound as often as the
   language uses it: the onsets, the rimes (vowel and what closes it), how
   many syllables a word has, which part of speech words are, and -- per part
   of speech -- the rime its words END in. A verb is built with a verb's
   ending, so a dictionary whose verbs all end in -a gives verbs ending in -a.

   WITH TOO FEW WORDS TO LEARN FROM it falls back to what the language says it
   sounds like: the sounds its LETTERS write, in the syllable shapes below.
   A sound no letter writes is a word nobody can spell -- a word is its
   letters (www/letters.js § a word is its letters) -- so every candidate,
   learned or not, is spelled through spOf(), the same road a word with no
   spelling takes, and one with a position no letter answers is thrown away.

   The shapes of that fallback are STG.syl where a language chose some on the
   screen this used to have (stored, and still read; nothing writes it now),
   and otherwise the shapes its dictionary is already cut into. */
var GEN_SHAPES=['V','CV','VC','CVC','CCV','CVCC','CCVC'];
/* Fewer readable words than this and there is nothing to learn a pattern
   from; the letters' sounds are the language's answer instead. */
var GEN_LEARN=5;
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
   sounds like a word the dictionary has (asTaken()) or like another of the n. */
function genLearn(){
  var L={n:0, on:[], rime:[], nsyl:[], pos:[], end:{}};
  WORDS.forEach(function(w){
    var cut=phCut(wPh(w)), p=w.pos||'n', i, last;
    if(!cut.length) return;
    for(i=0;i<cut.length;i++) if(!cut[i].nu.length) return;
    L.n++; L.nsyl.push(cut.length); L.pos.push(p);
    cut.forEach(function(c){ L.on.push(c.on); L.rime.push(c.nu.concat(c.co)); });
    last=cut[cut.length-1];
    (L.end[p]=L.end[p]||[]).push(last.nu.concat(last.co));
  });
  return L;
}
/* n words, each {seq, sp, hw, pos}: its sounds, its letters, its spelling and
   the part of speech it was made as -- `pos` when one is handed in, otherwise
   drawn from the dictionary's own mix (null with an empty dictionary: the
   sheet keeps what it has). None sounds like a word the dictionary has
   (asTaken()) or like another of the n. */
function genWords(n, pos){
  var L=genLearn(), learn=L.n>=GEN_LEARN, sh=genShapes(), S=genSounds(), tk=asTaken(),
      out=[], tries=0, lens=[1,2,2,3], seq, shape, nsyl, sp, hw, pp, i, j, ok;
  function one(a){ return a[Math.floor(Math.random()*a.length)]; }
  if(!learn){
    if(!S.c.length) sh=sh.filter(function(s){ return s.indexOf('C')<0; });
    if(!sh.length || !S.v.length) return out;
  }
  while(out.length<n && tries<n*80){
    tries++;
    pp=pos || (L.pos.length? one(L.pos) : null);
    seq=[];
    if(learn){
      nsyl=one(L.nsyl);
      for(i=0;i<nsyl;i++)
        seq=seq.concat(one(L.on), (i===nsyl-1 && L.end[pp])? one(L.end[pp]) : one(L.rime));
    } else {
      nsyl=one(lens);
      for(i=0;i<nsyl;i++){
        shape=one(sh);
        for(j=0;j<shape.length;j++) seq.push(shape.charAt(j)==='V'? one(S.v) : one(S.c));
      }
    }
    if(!seq.length || tk[seq.join('')]) continue;
    /* spOf() writes each position's sound on it; where that is what its
       letter reads anyway it is agreement, not a sound change, and comes
       off (spSetU) */
    sp=spOf({ph:seq}); ok=sp.length>0;
    for(i=0;i<sp.length;i++){ if(!sp[i].l) ok=false; else spSetU(sp[i], sp[i].u); }
    if(!ok) continue;
    hw=spWord(sp);
    if(!hw || findWord(hw)) continue;
    tk[seq.join('')]=1;
    out.push({seq:seq, sp:sp, hw:hw, pos:pp});
  }
  return out;
}
