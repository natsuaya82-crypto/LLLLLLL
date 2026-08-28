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

/* Who it opens, and it is ChatGPT. Gemini, Grok and Perplexity were in this
   table and are gone: nothing in the app ever wrote SET.askTo, so the other
   three were three addresses no road reached -- a choice with no screen to
   make it on.

   The name is never PRINTED on a screen: the mark says "ask an AI", no logo,
   nothing that reads as a partnership, which is what keeps this clear of
   OpenAI's brand rules. It is said once, in the phone's own dialog, at the
   moment of pressing -- 「画面に印刷すんな」「ポップだって話聞いてねえのか」
   OWNER 2026-08-27, on the second time of asking: it had been written across
   the dictionary as a line of prose, which is both the explaining rule and
   this paragraph broken at once.

   It stays a TABLE of one rather than becoming a bare address, because
   askWho() below is what makes a phone carrying an old SET.askTo safe, and
   that answer is `is this name in the table` either way. */
var ASK_TO={
  chatgpt: 'https://chatgpt.com/?q='
};
/* Bytes of URL, not characters of prompt, and the difference is the whole
   reason it is a number rather than a guess: percent-encoding puts one
   Japanese character on the wire as NINE bytes (あ -> %E3%81%82), and an IPA
   symbol as six. A budget counted in characters would be three times too
   generous for exactly the people who are hardest to notice it for. */
var ASK_MAX=4000;
function askBytes(s){ return encodeURIComponent(String(s)).length; }
/* An unset key, or one naming somebody who has since gone, is ChatGPT.
   「gptやgeminiみたいな手榴のaiにしないとダメでは？」

   "Somebody who has since gone" is not hypothetical any more -- it is the
   three that came out of the table above. A phone that has `SET.askTo` set
   to one of them opens ChatGPT and nothing is thrown; the stored key is left
   exactly where it is rather than being tidied away, because it is somebody's
   setting and this is not the place that decides it is worthless. */
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
/* The words to send, and the shape they go in.

   TAB, and not " = ". 「〇〇　〇〇 みたいに単語と意味を送るやん。」
   「100じゃなくてもいいけど」 OWNER 2026-08-27 -- this is for somebody making
   words in BULK, and no number is part of it. Whatever comes back, having to
   type it in by hand is not making words in bulk, so what leaves has to be
   the shape that comes back, and the shape that comes back has to be one
   www/import.js already reads. Nothing was added there to meet this; this
   was written to meet it.

   Tab because impDelim() (www/import.js:66) returns it the moment it sees
   one, with no scoring at all -- where `,` `;` and `|` are chosen by
   counting how many columns each row would have, so one malformed line in a
   hundred can tip the whole paste onto a different delimiter. And a meaning
   HAS commas in it: "mountain, hill" is in tools/import-check.mjs as a real
   sample, and comma-separated it arrives as two columns.

   ROMAN, and this is not a precaution. A spelling typed on the Lingua
   keyboard is private use code points until spType() (www/letters.js:944)
   turns it back -- "the one place a typed spelling becomes the language's
   letters". A word that came in through IMPORT never passes that:
   www/import.js:770 takes hw out of the file as it stands. So "hw is roman"
   was true of one road in and unchecked on the other, and the reader would
   have been sent code points out of somebody else's font.
   「自作文字の場合はaiに送る時はアルファベットになるように。」 OWNER
   2026-08-27. ask-check holds it.

   A word with no meaning teaches nothing about the language it belongs to,
   so it does not spend any of the budget. In the dictionary's own order,
   because an order that moves between two presses is a different question
   asked twice. */
function askWords(){
  var out=[], i, m;
  for(i=0;i<WORDS.length;i++){
    m=wMn(WORDS[i]);
    if(m) out.push(puaRoman(String(WORDS[i].hw))+'\t'+m);
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
/* The mark. 「四角にAIってもじいれれば？」 OWNER 2026-08-27.

   Drawn rather than borrowed, because nothing in the set says this. The
   four-pointed star is what every other app uses for a model, and here it is
   already taken: glyph.js gives it to what the paid plan adds, and this costs
   nothing and never could -- it opens somebody's own account. A star on it
   would say the opposite of the one thing this feature is.

   The square is in the SVG and not in the stylesheet, which is the same
   reason ICON_LTR draws its own: a border round a button is the rounded box
   the whole app is rid of 「角丸やめろ」, and a shape drawn inside a mark is
   not one. ICON_LTR is the precedent -- a letter in a square, at this size,
   in this weight.

   It lives here rather than in www/glyph.js with the other forty-four, and
   that is the one thing about it that is wrong. Five branches are in that
   file today, so moving it there is a collision; it wants to go home when
   they have landed. */
var ICON_AI='<svg class="ic" viewBox="0 0 24 24" width="20" height="20" fill="none" '+
  'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '+
  'stroke-linejoin="round" aria-hidden="true">'+
  '<rect x="3" y="3" width="18" height="18" rx="4"/>'+
  '<path d="M7 16.2 9.7 8l2.7 8.2"/><path d="M8 13.6h3.4"/>'+
  '<path d="M16.4 8v8.2"/></svg>';
/* One mark on the bar of a screen, and it is NOT a row of words.
   「AIを使いたいって思うとこどこ？隠してどうすんの？しかも文字で書くなや」
   OWNER 2026-08-27. It was a line of text inside the ⋯ menu of the
   dictionary, which is two mistakes at once: behind a press, and spelled out.
   It is on the bar now, beside the ⋯ rather than inside it.

   An <a> and not a button: a button carries a NAME and this carries a
   DESTINATION -- the same shape docRows() in www/settings.js has shipped
   with since it was written. It is also what keeps tools/press.mjs out of
   it; that walk presses [data-do], and a press here would open a window in
   the middle of a check. **That is why the question below is a listener and
   not an action name**: giving this a data-do to hang the confirm off would
   put it straight back in front of the walk.

   Nothing comes back when the scaffold alone is over the ceiling -- there is
   no shorter version left to fall to, and half a prompt is the failure this
   whole chapter exists to prevent. It takes a language name of about a
   thousand characters to reach, and ask-check holds that it returns ''
   rather than opening something cut in half. */
function askBtn(ask, extra){
  var L=askLink(ask, extra);
  if(!L.url) return '';
  return '<a class="navq" data-ask="1" href="'+esc(L.url)+'" target="_blank"'+
    ' rel="noopener" aria-label="'+esc(t('ask.open'))+'">'+ICON_AI+'</a>';
}
/* SAID ON THE PRESS, NOT PRINTED ON THE SCREEN.
   「誰がここにチャットGPTに遷移しますって出せって言ったんだよ ポップだって
   話聞いてねえのか」「画面に印刷すんな」 OWNER 2026-08-27.

   What leaves this app for somebody else's is worth one question first, and
   「遷移前に」 means at the moment of pressing -- not a sentence standing on
   the dictionary where it is read once and then read forever.

   One listener above the app, for the same reason www/act.js has one: a
   screen is thrown away and rebuilt several times a second, so nothing
   survives being bound to the element. It answers for the ANCHOR, which
   act.js deliberately does not handle -- that file is the table of NAMES a
   button may say, and this carries a destination instead.

   The default is left alone when the answer is yes. Cancelling the anchor
   and opening the window ourselves would be this app deciding to be a popup
   in a webview that is entitled to refuse one; letting the <a> do what an <a>
   does keeps the press a press. */
function askLeaveOK(e){
  var a=e.target;
  while(a && a!==document && !(a.getAttribute && a.getAttribute('data-ask'))) a=a.parentNode;
  if(!a || a===document || !a.getAttribute) return;
  if(!window.confirm(t('ask.leave', t('ask.to.'+askWho())))) e.preventDefault();
}
document.addEventListener('click', askLeaveOK, false);
