/* Lingua — the app proposes, the person chooses
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   Everything in this app used to begin with a blank. Which of a hundred and
   eleven symbols does your language use. Which sounds is the word for "I"
   made of. Those are questions somebody who has already made a language can
   answer, and nobody else, so the app was only usable by people who did not
   need it.

   Nothing here decides anything. It puts something in front of you that you
   can hear, and you say yes, or ask for another, or do it yourself. That is
   the only division of labour that works: the app does the part that is
   arithmetic, the person does the part that is taste.

   AI_SEAM: when the hosted model is wired up it replaces the two generators
   below and nothing else. The screens ask for a proposal and get a list back;
   where the list came from is not their business. Until then the list comes
   from here, which means it works with no network and costs nothing. */

/* ---- the character a language can have -------------------------------
   Not a style, a sound inventory. Each of these is a real region of the
   chart: which places and manners the language uses at all. The names are
   translated; the symbols are not, because a symbol is the same everywhere. */
var AS_CHARS=[
  {id:'soft',   c:['m','n','l','r','w','j','p','t','k','s','h'],
                v:['a','i','u','e','o']},
  {id:'hard',   c:['p','t','k','q','ʔ','tʃ','ʃ','x','ts','r'],
                v:['a','i','u']},
  {id:'flowing',c:['l','r','m','n','v','z','ʒ','j','w','ð','b','ɡ'],
                v:['a','e','i','o','u']},
  {id:'breathy',c:['h','f','θ','s','ʃ','x','ɸ','ħ','t','k'],
                v:['a','ə','i','u','ɛ']},
  {id:'plain',  c:['p','t','k','m','n','ŋ','s','l','w','h'],
                v:['a','i','u','e','o']}
];
function asChar(id){
  var i;
  for(i=0;i<AS_CHARS.length;i++) if(AS_CHARS[i].id===id) return AS_CHARS[i];
  return AS_CHARS[0];
}
/* A symbol that is not on the chart cannot be proposed: the voice is built
   from the chart's own features, so a sound outside it could not be said. */
function asReal(list){
  var all=ipaAll(), out=[], i;
  for(i=0;i<list.length;i++) if(all.indexOf(list[i])>=0) out.push(list[i]);
  return out;
}
/* An inventory, proposed. Consonants and vowels are drawn separately so the
   result is always sayable -- a language of nothing but consonants is not a
   proposal, it is a bug. Asking again gives a different one. */
function asSounds(id, n){
  var ch=asChar(id), cs=asReal(ch.c), vs=asReal(ch.v), out=[], i, k;
  n = n || 12;
  var wantV = Math.max(3, Math.round(n*0.35)), wantC = Math.max(4, n-wantV);
  var pool=cs.slice();
  for(i=0;i<wantC && pool.length;i++){
    k=Math.floor(Math.random()*pool.length);
    out.push(pool[k]); pool.splice(k,1);
  }
  pool=vs.slice();
  for(i=0;i<wantV && pool.length;i++){
    k=Math.floor(Math.random()*pool.length);
    out.push(pool[k]); pool.splice(k,1);
  }
  /* the order they are shown in is the order of the chart, not the order they
     happened to be drawn in */
  var all=ipaAll();
  out.sort(function(a,b){ return all.indexOf(a)-all.indexOf(b); });
  return out;
}
/* Every proposed sound, said one after another, so the character can be
   heard rather than read. */
function asSay(list){
  var seq=[], i;
  for(i=0;i<list.length;i++) seq.push(list[i]);
  sayPh(seq);
}

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
/* Three of them, all different, none of them a word you already have. */
function asWords(pos, n){
  var out=[], i, seq, guard=0;
  n=n||3;
  while(out.length<n && guard<60){
    guard++;
    seq=asWord(pos, out);
    if(!seq) break;
    var dup=false;
    for(i=0;i<out.length;i++) if(out[i].join('')===seq.join('')) dup=true;
    if(!dup) out.push(seq);
  }
  return out;
}

/* ---- growing the inventory --------------------------------------------
   Take it, ask for another, or go and do the whole thing yourself on a chart
   of a hundred and eleven symbols: those were the only three answers, and
   the middle one throws away the eleven sounds you were happy with to change
   the one you were not. An inventory is grown. One more consonant, one more
   vowel, and the ones you do not want taken back out.

   The sound comes from the same character you chose, so what is added still
   belongs. When that runs out -- and it does, these lists are short -- the
   pool widens to every sound any of the five characters uses, which is still
   a set of ordinary, sayable sounds rather than the whole chart. */
function asPool(kind){
  var out=[], i, j, L;
  for(i=0;i<AS_CHARS.length;i++){
    L=(kind==='v')? AS_CHARS[i].v : AS_CHARS[i].c;
    for(j=0;j<L.length;j++) if(out.indexOf(L[j])<0) out.push(L[j]);
  }
  return asReal(out);
}
function asLeft(pool, have){
  var out=[], i;
  for(i=0;i<pool.length;i++) if(have.indexOf(pool[i])<0) out.push(pool[i]);
  return out;
}
function asMore(id, kind, have){
  var ch=asChar(id), left=asLeft(asReal(kind==='v'? ch.v : ch.c), have), i, all;
  if(!left.length) left=asLeft(asPool(kind), have);
  if(!left.length){
    /* the chart itself, last. Somebody who has taken all thirty ordinary
       sounds is not going to be surprised by a rarer one. */
    all=[]; var src=(kind==='v')? IPA_VOWS : IPA_CONS;
    for(i=0;i<src.length;i++) all.push(src[i].s);
    left=asLeft(all, have);
  }
  if(!left.length) return null;
  return left[Math.floor(Math.random()*left.length)];
}
/* The chart's own order, so adding a sound does not shuffle the keyboard. */
function asOrder(list){
  var all=ipaAll();
  return list.slice().sort(function(a,b){ return all.indexOf(a)-all.indexOf(b); });
}
