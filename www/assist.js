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

/* ---- AI に相談する -----------------------------------------------------
   The app generates nothing here and holds no key. It opens somebody else's
   app with the text already in it, and the person presses send. That is
   their ChatGPT account, not ours 「その人の ChatGPT アカウントです」.

   askLink() is the ONE place a body becomes a link. A caller says what it is
   asking for and hands over its own material; nothing else in www/ knows the
   address, the ceiling, or how a body is put together. A second place that
   built one would be the half that stops being fixed.

   Two things about this cannot throw and both are why the ceiling is here:

   A URL that is too long is not refused, it is TRUNCATED, and the person
   sees a shortened prompt in the box with nothing to say it was cut.
   `UIApplication.shared.open()` returns nothing about what the other app
   received -- no value, no callback, no error -- so the app can never learn
   it happened. The only place it can be caught is before it is sent, which
   is why the words are FILLED to the budget rather than sent and hoped for.

   And the language of the prompt decides the language of the answer. A
   Japanese person sent an English prompt gets English words back for a
   language that is theirs, so every sentence here goes through t() in all
   ten. What is NOT translated is the material -- the sounds, the words, the
   shapes -- because that is what the person made. */

/* Who it opens. The name never reaches a screen: the button says "ask an AI"
   whoever is set, which is also what keeps this clear of OpenAI's brand
   rules -- our name first, theirs nowhere, no logo, nothing that reads as a
   partnership. www/settings.js writes SET.askTo; this is the only list of
   what that key may say. */
var ASK_TO={
  chatgpt:    'https://chatgpt.com/?q=',
  gemini:     'https://gemini.google.com/app?q=',
  grok:       'https://grok.com/?q=',
  perplexity: 'https://www.perplexity.ai/search?q='
};
/* Bytes of URL, not characters of prompt, and the difference is the whole
   reason it is a number rather than a guess: percent-encoding puts one
   Japanese character on the wire as NINE bytes (あ -> %E3%81%82), and an IPA
   symbol as six. A budget counted in characters would be three times too
   generous for exactly the people who are hardest to notice it for. */
var ASK_MAX=4000;
function askBytes(s){ return encodeURIComponent(String(s)).length; }
/* An unset key, or one naming somebody who has since gone, is ChatGPT --
   the default the owner chose 「gptやgeminiみたいな手榴のaiにしないとダメでは？」 */
function askWho(){
  var w=SET.askTo;
  return (w && ASK_TO[w]) ? w : 'chatgpt';
}
/* What this language IS, in the fewest bytes that still constrain an answer.
   A field nobody has answered is left out rather than sent empty: "name:"
   with nothing after it spends bytes telling the other side nothing. */
function askHead(extra){
  var A=analyze(), snd=addedSnd(), out=[t('ask.head'), ''], p, fr, i;
  if(langName) out.push(t('ask.f.name')+': '+langName);
  if(snd.length) out.push(t('ask.f.snd')+': '+snd.join(' '));
  if(LETTERS.length) out.push(t('ask.f.lts')+': '+LETTERS.length);
  out.push(t('ask.f.order')+': '+orderDef().id);
  if(A.sylMode) out.push(t('ask.f.syl')+': '+
    t('ask.f.syl.v', A.sylMode.n, A.sylMode.hit, A.sylMode.all));
  for(p in A.finalRule) if(Object.prototype.hasOwnProperty.call(A.finalRule,p)){
    fr=A.finalRule[p];
    out.push(t('ask.f.end')+': '+t('ask.f.end.v', posLabel(p), fr.ch, fr.hit, fr.all));
  }
  if(extra) for(i=0;i<extra.length;i++) out.push(extra[i]);
  return out.join('\n')+'\n';
}
/* The words to send, and why these. A word with no meaning teaches nothing
   about the language it belongs to, so it does not spend any of the budget.
   In the dictionary's own order, because an order that moves between two
   presses is a different question asked twice. */
function askWords(){
  var out=[], i, m;
  for(i=0;i<WORDS.length;i++){
    m=wMn(WORDS[i]);
    if(m) out.push(String(WORDS[i].hw)+' = '+m);
  }
  return out;
}
/* `ask` is the sentence saying what to produce, already through t().
   `extra` is the caller's own material, a line at a time, or null.

   Returns the link and how much of the dictionary went. `url` empty means
   the scaffold alone is over the ceiling: there is nothing left to shorten,
   so it does not open and the screen says so. Nothing here truncates -- half
   a prompt is the failure this exists to prevent, not a way of surviving. */
function askLink(ask, extra){
  var base=ASK_TO[askWho()], room=ASK_MAX-base.length;
  var head=askHead(extra), tail='\n'+String(ask||'');
  var n=askBytes(head)+askBytes(tail);
  if(n>room) return {url:'', put:0, all:0};
  var rows=askWords(), lab='\n'+t('ask.f.words')+':\n';
  var body='', put=0, i, line, add;
  for(i=0;i<rows.length;i++){
    line=rows[i]+'\n';
    add=askBytes(line)+(put? 0 : askBytes(lab));
    if(n+add>room) break;
    n+=add; body+=line; put++;
  }
  if(put) body=lab+body;
  return {url: base+encodeURIComponent(head+body+tail), put:put, all:rows.length};
}
/* One row, wherever a screen wants to offer this. An <a> and not a button:
   a button would carry code, and this carries a destination -- the same
   shape docRows() in www/settings.js has shipped with since it was written.
   It is also what keeps tools/press.mjs out of it; that walk presses
   [data-do], and a press here would open a window in the middle of a check.

   .set sets its own font-size and line-height (www/index.html), so this row
   is exactly as tall as the <button class="set"> rows beside it. */
function askRow(ask, extra){
  var L=askLink(ask, extra);
  if(!L.url) return '<div class="set"><span class="sl">'+esc(t('ask.full'))+'</span></div>';
  return '<a class="set" href="'+esc(L.url)+'" target="_blank" rel="noopener">'+
    '<span class="sl">'+esc(t('ask.open'))+'</span>'+
    '<span class="sv">'+(L.put<L.all? esc(L.put+'/'+L.all) : '')+ICON_LINK+'</span></a>';
}
