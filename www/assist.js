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
