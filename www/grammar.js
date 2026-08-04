/* Lingua — grammar: the decisions, and the words that carry them
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   This chapter used to be called Rules and contained none. It listed what the
   dictionary had happened to do -- most of your nouns end in a, you have not
   used v yet -- which is a description of your typing, not a grammar.

   Then it was six rows of "does your language mark this, and with which piece
   of sound", which is one sentence of grammar dressed as a chapter, and which
   he threw out: 「全部示す示さないみたいなゴミみたいな決め方」. Writing the rules
   out in your own words replaced it, and that was right -- but prose is not
   something a machine can compute with, and the conversation chapter had been
   assembling its replies out of those six rows. Removing them left it able to
   do nothing but put words in order. That was my breakage.

   What is here now is neither. There is no second grammar written for the
   machine to read: the words made in the stages ARE the grammar. The 否定
   stage made a word for "not". The 代名詞 stage made six pronouns. The 疑問
   stage made six question words. The conversation reads those, and the only
   thing it has to be told besides is where a word stands -- which is one
   answer for the whole language, changes every sentence, and is exactly the
   kind of thing word order already is. */

/* All six orders, because all six are used by languages on this planet. The
   old list had three, which quietly ruled out the other half. */
var ORDERS=['SOV','SVO','VSO','VOS','OVS','OSV'];
function orderDef(){
  var o=SET.order||'SOV';
  if(ORDERS.indexOf(o)<0) o='SOV';
  return {id:o, seq:o.split('')};
}
function setOrder(id){ SET.order=id; save(); stMarkSet('order'); render(); }

/* ---- where a word stands ----------------------------------------------
   Three positions. Each is one answer for the whole language and each is
   heard in every sentence that uses it, which is why these three have buttons
   and nothing else does. None of them asks whether the language marks
   something, and none asks you to invent a piece of sound: the word already
   exists, made in the stage that needed it. */
var GPOS_DEF={adj:'after', negp:'after', adp:'after'};
function gPos(id){
  if(!SET.gpos) SET.gpos={};
  if(!SET.gpos[id]) SET.gpos[id]=GPOS_DEF[id]||'after';
  return SET.gpos[id];
}
function setGPos(id, v){
  if(!SET.gpos) SET.gpos={};
  SET.gpos[id]=v; save(); stMarkSet(id); render();
}
/* Which side, and of what. "Before" on its own is not a label: before the
   noun and before the verb are different facts. */
var GPOS_OF={adj:'n', negp:'v', adp:'n'};
function gPosLab(id, o){ return t('gram.pos.'+o+'.'+(GPOS_OF[id]||'n')); }

/* ---- reading the words the stages made --------------------------------- */
function gSlot(pid, k){
  var p=(typeof stBy==='function')? stBy(pid) : null;
  return p? stWordFor(p, k) : null;
}
function gSlotAny(pid){
  var p=(typeof stBy==='function')? stBy(pid) : null, i, w;
  if(!p) return null;
  for(i=0;i<p.slots.length;i++){ w=stWordFor(p, p.slots[i]); if(w) return w; }
  return null;
}
function gSlotAll(pid){
  var p=(typeof stBy==='function')? stBy(pid) : null, out=[], i, w;
  if(!p) return out;
  for(i=0;i<p.slots.length;i++){ w=stWordFor(p, p.slots[i]); if(w) out.push(w); }
  return out;
}

function gTxt(ws){ var i,o=[]; for(i=0;i<ws.length;i++) o.push(ws[i].join('')); return o.join(' '); }
function gIpaOf(ws){ var i,o=[]; for(i=0;i<ws.length;i++) o.push(ws[i].join('')); return '/'+o.join(' ')+'/'; }
function gFlat(ws){ var i,o=[]; for(i=0;i<ws.length;i++) o=o.concat(ws[i]); return o; }

/* A word of a given part of speech to demonstrate on. Any will do; the first
   is the least surprising choice because it is the one at the top of the
   dictionary. */
function gWordOf(pos, not){
  var i;
  for(i=0;i<WORDS.length;i++) if(WORDS[i].pos===pos && WORDS[i]!==not) return WORDS[i];
  return null;
}

/* ---- the demonstration ------------------------------------------------
   A position you cannot hear is a position you cannot check, so every one of
   them is shown in your own words and will say itself out loud. */
function gSide(lab, ws, gloss){
  return '<div class="gside"><span class="gsl">'+esc(lab)+'</span>'+
    '<span class="gsw">'+esc(gTxt(ws))+'</span>'+
    '<span class="gsi">'+esc(gIpaOf(ws))+'</span>'+
    (gloss? '<span class="gsg">'+esc(gloss)+'</span>' : '')+
    '<button class="gsp" onclick="sayPh('+esc(JSON.stringify(gFlat(ws)))+')" aria-label="'+esc(t('f.listen'))+'">'+ICON_PLAY+'</button></div>';
}
function gNeedWords(){ return '<div class="note gneed">'+t('gram.demo.need')+'</div>'; }
function gPair(a, b){
  var g=[wMn(a), wMn(b)].filter(Boolean).join(' + ');
  return {ws:[wPh(a), wPh(b)], gl:g};
}
function gPosDemo(id){
  var pair=null, n, v, a, x;
  if(id==='adj'){
    n=gWordOf('n'); a=gWordOf('adj');
    if(!n || !a) return gNeedWords();
    pair = gPos('adj')==='before' ? gPair(a, n) : gPair(n, a);
  } else if(id==='negp'){
    v=gWordOf('v'); x=gSlot('neg','not');
    if(!v || !x) return gNeedWords();
    pair = gPos('negp')==='before' ? gPair(x, v) : gPair(v, x);
  } else {
    n=gWordOf('n'); x=gSlotAny('where');
    if(!n || !x) return gNeedWords();
    pair = gPos('adp')==='before' ? gPair(x, n) : gPair(n, x);
  }
  return '<div class="gdemo">'+gSide(t('gram.pair.phrase'), pair.ws, pair.gl)+'</div>';
}

/* ---- the screen -------------------------------------------------------- */
/* Word order, written as the three roles in the order chosen, with the drawn
   chevron between them. It used to be a translated string with an arrow
   character inside it, which is a mark typed into copy. */
function gOrderLine(){
  var s=orderDef().seq, i, out=[];
  for(i=0;i<s.length;i++) out.push('<span class="gor">'+esc(t('gram.role.'+s[i]))+'</span>');
  return '<div class="gorder">'+out.join('<span class="gsep">'+ICON_GO+'</span>')+'</div>';
}
/* The same order, in your own words, so it is a sentence and not a diagram. */
function gOrderDemo(){
  var n=gWordOf('n'), v=gWordOf('v'), n2=gWordOf('n', n);
  if(!n || !v) return gNeedWords();
  var slot={S:n, O:(n2||n), V:v};
  var ws=orderDef().seq.map(function(k){ return wPh(slot[k]); });
  var gl=orderDef().seq.map(function(k){ return wMn(slot[k])||slot[k].hw; }).join(' ');
  return '<div class="gdemo">'+gSide(t('gram.pair.line'), ws, gl)+'</div>';
}
