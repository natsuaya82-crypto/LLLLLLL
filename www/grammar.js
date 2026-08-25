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
/* Every word a stage made, not the first one. A language has one word for
   "not" and several for "at", "on", "under" -- gSlotAny() answered the first
   of them because one was all a demonstration needed, and the engine needs
   all of them to know which words are adpositions at all. gSlotAny is the
   head of this list rather than a second walk of the same slots. */
function gSlotAll(pid){
  var p=(typeof stBy==='function')? stBy(pid) : null, i, w, out=[];
  if(!p) return out;
  for(i=0;i<p.slots.length;i++){ w=stWordFor(p, p.slots[i]); if(w) out.push(w); }
  return out;
}
function gSlotAny(pid){ return gSlotAll(pid)[0] || null; }

/* ---- this language, handed to the engine --------------------------------
   www/grammar-engine/ is DOM-free and globals-free so that samples can be put
   through it in Node. This is the one place that crosses back: the dictionary,
   the word order and the three places a word can stand, as one model.

   It is a VIEW and not a copy. Nothing is written under `gram2`, and that is
   deliberate rather than unfinished -- a stored copy of the dictionary would
   be a second place saying what the words are, and the two would part company
   the first time somebody added a word. docs/FEATURES.md asks for the same
   thing from the other side: this arithmetic is `current`, not `frozen`, so a
   line that half-rendered yesterday renders fully today because the
   dictionary grew, and freezing it would be the bug.

   Which words ARE the negation and the adpositions is not something a part of
   speech can say -- the app makes them in a stage -- so the page that knows
   about stages names them here, by id, and the engine never has to know what
   a stage is. */
function gRule(target, feature, value){
  return LinguaGrammarEngine.grammarRule({type:'syntax', target:target, feature:feature, value:value});
}
/* What this language has decided: the three places a word can stand, and
   which words the stages made are the negation and the adpositions. */
function gRules(){
  var e=LinguaGrammarEngine, out=[], w, ws, i;
  out.push(gRule('ADJECTIVE',  'POSITION', gPos('adj')));
  out.push(gRule('NEGATION',   'POSITION', gPos('negp')));
  out.push(gRule('ADPOSITION', 'POSITION', gPos('adp')));
  w=gSlot('neg','not');
  if(w) out.push(gRule('NEGATION','WORD', e.adapter.idOf(w)));
  ws=gSlotAll('where');
  for(i=0;i<ws.length;i++) out.push(gRule('ADPOSITION','WORD', e.adapter.idOf(ws[i])));
  return out;
}
/* This language, as the engine reads it. `list` is which words to hand over
   and is the whole dictionary when nobody says: arranging three words for a
   demonstration would otherwise build five thousand of them on every render,
   and translate.arrange() never looks at model.words at all -- it reads the
   word order and the rules. The decisions are the same either way, which is
   the point of there being one function. */
function gModel(list){
  var m=LinguaGrammarEngine.adapter.fromLegacy(langId, list||WORDS, SET);
  m.grammarRules=gRules();
  return m;
}
/* The engine's word and the dictionary's word are one word seen from two
   sides. The engine knows what part of speech it is and where it stands; only
   this side knows what it SOUNDS like, because wPh() reads the letters it is
   spelled with, every time, so a letter that changes its sound changes the
   words it is in. A demonstration has to come back here to be heard. */
function gUnits(m, list){
  var e=LinguaGrammarEngine, out=[], i, j, id;
  for(i=0;i<list.length;i++){
    id=e.adapter.idOf(list[i]);
    for(j=0;j<m.words.length;j++) if(m.words[j].id===id){
      out.push({kind:'word', word:m.words[j], surface:m.words[j].lemma, text:m.words[j].lemma});
      break;
    }
  }
  return out;
}
/* Words of the dictionary, in the order THIS language puts them in. One
   place: the demonstration under the buttons on the grammar page and the line
   a translation writes are the same arrangement, so a language that says its
   adjective goes first cannot say it one way here and another way in a
   sentence. */
function gLay(list){
  var e=LinguaGrammarEngine, m=gModel(list),
      pieces=e.translate.arrange(m, gUnits(m, list)), out=[], i, j, id;
  for(i=0;i<pieces.length;i++){
    id=pieces[i].word?String(pieces[i].word.id):'';
    for(j=0;j<list.length;j++) if(e.adapter.idOf(list[j])===id){ out.push(list[j]); break; }
  }
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
    '<button class="gsp"' + DO('sayPh', [gFlat(ws)]) + ' aria-label="'+esc(t('f.listen'))+'">'+ICON_SPK+'</button></div>';
}
function gNeedWords(){ return '<div class="note gneed">'+t('gram.demo.need')+'</div>'; }
/* Two words to be heard, in the order this language puts them in. gPair()
   took them already ordered and was the second place that decided which side
   each went; it is gone, and so is the fallback that would have called it --
   gLay() is handed a model built from the same list, so it cannot come back
   short, and a branch nothing can reach hides the next bug rather than
   catching it. */
function gPairOf(list){
  var laid=gLay(list);
  return {ws:laid.map(function(w){ return wPh(w); }),
          gl:laid.map(function(w){ return wMn(w); }).filter(Boolean).join(' + ')};
}
function gPosDemo(id){
  var pair=null, n, v, a, x;
  /* The two words, and never which side each goes. That is the one answer
     this language already gave, and it is applied where every other phrase in
     the app is arranged -- here it was applied a second time, by hand, so the
     button could have agreed with itself and disagreed with a sentence. */
  if(id==='adj'){
    n=gWordOf('n'); a=gWordOf('adj');
    if(!n || !a) return gNeedWords();
    pair = gPairOf([a, n]);
  } else if(id==='negp'){
    v=gWordOf('v'); x=gSlot('neg','not');
    if(!v || !x) return gNeedWords();
    pair = gPairOf([x, v]);
  } else {
    n=gWordOf('n'); x=gSlotAny('where');
    if(!n || !x) return gNeedWords();
    pair = gPairOf([x, n]);
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
  var n=gWordOf('n'), v=gWordOf('v'), n2=gWordOf('n', n), laid, ws, gl;
  if(!n || !v) return gNeedWords();
  /* Subject, verb, object -- the order they would be TYPED in, not the order
     they come out in. Which of the six this language uses is the engine's to
     apply, and it applies it in the one place a phrase is arranged. */
  laid=gLay([n, v, (n2||n)]);
  ws=laid.map(function(w){ return wPh(w); });
  gl=laid.map(function(w){ return wMn(w)||w.hw; }).join(' ');
  return '<div class="gdemo">'+gSide(t('gram.pair.line'), ws, gl)+'</div>';
}
