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
/* The word order is the LANGUAGE's and is filed under langKey('phases') with
   the rest of what the stages hold -- STG.order, and migrateGramLang() in
   www/phases.js is how it got there. It was SET.order, which is the person's
   settings and belongs to no language, so two languages on one phone had one
   word order between them: 「言語ごとですよ？」 OWNER DECISION 2026-08-25.
   Empty means nobody has answered, and the default stands. */
function orderDef(){
  var o=(STG && STG.order)||'SOV';
  if(ORDERS.indexOf(o)<0) o='SOV';
  return {id:o, seq:o.split('')};
}
/* One write, not two. The value and the mark saying somebody chose it are
   both in STG now, and stMarkSet() is what saves it. */
function setOrder(id){ STG.order=id; stMarkSet('order'); render(); }

/* ---- where a word stands ----------------------------------------------
   Three positions. Each is one answer for the whole language and each is
   heard in every sentence that uses it, which is why these three have buttons
   and nothing else does. None of them asks whether the language marks
   something, and none asks you to invent a piece of sound: the word already
   exists, made in the stage that needed it. */
var GPOS_DEF={adj:'after', negp:'after', adp:'after'};
/* The language's, beside the word order and for the same reason. Reading one
   does not write it: the old pair put the default into the person's settings
   the first time a stage was drawn, so a value existed for three decisions
   nobody had made. Nothing here answers "was this chosen" -- stTouched() is
   that question and always was. */
function gPos(id){
  return (STG && STG.gpos && STG.gpos[id]) || GPOS_DEF[id] || 'after';
}
function setGPos(id, v){
  if(!STG.gpos) STG.gpos={};
  STG.gpos[id]=v; stMarkSet(id); render();
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
/* ---- the marks --------------------------------------------------------
   A particle is a WORD in this app, made in the 助詞 stage exactly as the
   word for "not" is made in the 否定 one, so this reads the words somebody
   made and says what the engine already knows how to hear.

   `separator:' '` is a particle standing APART from the word it marks --
   `mi ga`, which is how this app writes one, because it was written as its
   own word. morphology.js reads both that and the attached kind.

   What a mark DOES is in morphology.js and is the whole reason this exists:
   a word carrying one takes its role wherever it stands, and the place it
   would have taken in the positional queue is given up. So a language with
   no marks is arranged by word order alone -- which is what English and
   Chinese do -- and a mark does not replace the word order, it takes one
   word out of it at a time.

   `target:'WORD'` is the engine's own way of saying "any word". A particle
   here is a separate word rather than an ending, so which part of speech it
   may follow is a question about a sentence somebody typed wrong, not about
   what this language is.

   It is a VIEW and never stored, for the same reason gRules() and the words
   are: `form` is the particle's SPELLING, read from the dictionary now. A
   stored copy would be the spelling as it was on the day it was saved, and
   would go quietly wrong the moment somebody redrew or renamed that word. */
var GCASE={subj:'SUBJECT', obj:'OBJECT', rec:'RECIPIENT'};
function gInfl(){
  var e=LinguaGrammarEngine, out=[], p=(typeof stBy==='function')? stBy('part') : null, k, w, f;
  if(!p) return out;
  for(k in GCASE){
    if(!Object.prototype.hasOwnProperty.call(GCASE, k)) continue;
    w=stWordFor(p, k);
    f=w? String(w.hw||'') : '';
    if(!f) continue;
    out.push(e.inflection({id:'case.'+k, target:'WORD', feature:'CASE', value:GCASE[k],
                           operation:'suffix', separator:' ', form:f,
                           /* What this app calls it, and the way back to where
                              it is written. The engine has no business knowing
                              either, which is why they ride on metadata: it is
                              the one field model.js keeps and never reads. */
                           metadata:{label:t('stg.part.'+k), slot:k}}));
  }
  return out;
}

/* ---- the forms somebody wrote down ------------------------------------
   The rules that make a form out of a word have been in this app since
   「英語みたいにyで終わるのはiに変えてedみたいな細かいルール設定はできないの？」
   was asked. They are written on the word side -- www/wordsheet.js, the forms
   page -- and kept in STG.fm with the rest of what a language decided.

   **They had never reached the engine.** gModel() handed it an empty
   `inflections`, so a language whose past tense somebody had defined was
   translated with no past tense at all. Both ends were built and the middle
   was missing; this is the middle. Nothing new is stored and no screen
   changes -- what somebody already wrote starts counting.

   The two lists are one list. `fm` says what a form IS, and www/wordsheet.js
   splits them by fmGroup(): a form of the same word (past, plural) is an
   inflection, and a different word built out of it (agent, opposite) is a
   derivation. Same rule shape, two destinations.

   What each label MEANS is here and nowhere else. It is the one place a
   label of the app becomes a feature of the engine, and it is written out
   rather than derived: `pst` is TENSE/PAST because somebody decided that, not
   because of anything about the letters. */
var GFM_INF={
  pst:['TENSE','PAST'],      prs:['TENSE','PRESENT'],   fut:['TENSE','FUTURE'],
  prg:['ASPECT','PROGRESSIVE'], prf:['ASPECT','PERFECT'],
  neg:['NEGATION',true],
  imp:['MOOD','IMPERATIVE'], que:['MOOD','INTERROGATIVE'], cnd:['MOOD','CONDITIONAL'],
  cau:['VOICE','CAUSATIVE'], pas:['VOICE','PASSIVE'],
  pl :['NUMBER','PLURAL']
};
/* A derivation says what the word BECOMES. Three of the twelve name a part of
   speech outright; the other nine name a kind of word without saying which
   part of speech it is -- an agent is usually a noun and this app has never
   been told so. Leaving it null is the engine's own "unchanged", and inventing
   NOUN here would be the app deciding something about somebody's language that
   nobody said. 指示書 §10: 勝手に推測しない。 */
var GFM_DER={adj:'ADJECTIVE', vrb:'VERB', adv:'ADVERB'};

/* What a rule adds, as the letters it was written in. */
function gFmForm(r){
  return (typeof spWord==='function' && r && r.add && r.add.length)? String(spWord(r.add)) : '';
}
/* How much of the stem goes first, in CHARACTERS -- which is what the engine
   works in, while the rule counts LETTERS. The two agree except where a letter
   is written with more than one character, and the one case that matters says
   the exact letters itself: 「y で終わるのは」 is `wend`, so its spelling IS the
   piece being dropped and the count is exact however that letter is named. */
function gFmDrop(r){
  var n=Math.max(0, parseInt(r && r.drop, 10) || 0), e;
  if(!n) return 0;
  e=(r && r.wend) || [];
  if(e.length===n && typeof spWord==='function') return String(spWord(e)).length;
  return n;
}
/* The one condition that travels. `x` names the letters a word has to end in,
   and those are letters, so they cross. `v` and `c` are about SOUND -- after a
   vowel, after a consonant -- and the engine has no phonology; sending one
   without its condition would make a rule for some words fire on all of them,
   which is worse than the rule not being there. So those stay behind, and
   gFmLeft() is how many did, because a number nobody can see is the same as
   no number at all. */
function gFmCond(r){
  var e;
  if(!r || !r.when) return null;
  if(r.when!=='x') return false;
  e=(r.wend)||[];
  if(!e.length || typeof spWord!=='function') return false;
  return {endsWith:String(spWord(e))};
}
var gFmLeftN=0;
function gFmRules(){
  var e=LinguaGrammarEngine, a=(STG && STG.fm) || [], inf=[], der=[], i, r, f, c, k, op, pos, fm;
  gFmLeftN=0;
  for(i=0;i<a.length;i++){
    r=a[i]; if(!r) continue;
    f=gFmForm(r);
    if(!f){ continue; }                    /* a rule with nothing to add does nothing */
    c=gFmCond(r);
    if(c===false){ gFmLeftN++; continue; } /* a condition this side cannot say */
    fm=String(r.fm||'');
    op=(r.at==='start')? 'prefix' : 'suffix';
    pos=r.pos;
    k={id:'fm.'+String(r.id||i), operation:op, form:f, separator:'',
       drop:gFmDrop(r), conditions:c||{},
       metadata:{label:fmLabel(fm), rule:String(r.id||'')}};
    if(fmGroup(fm)==='d'){
      k.sourcePartOfSpeech=gFmPos(pos);
      k.targetPartOfSpeech=GFM_DER[fm] || null;
      der.push(e.derivation(k));
    }else{
      k.target=gFmPos(pos) || 'WORD';
      /* A label somebody wrote themselves is its own feature. We do not know
         what kind of thing it is and must not guess one -- 指示書 §10 -- so it
         is asked for by the name they gave it. */
      k.feature=(GFM_INF[fm]? GFM_INF[fm][0] : (fm || 'FORM'));
      k.value  =(GFM_INF[fm]? GFM_INF[fm][1] : true);
      inf.push(e.inflection(k));
    }
  }
  /* The specific before the general. A rule with a condition and a rule
     without can be about the same feature -- 「y の後は ied、それ以外は ed」 --
     and the engine spends a feature on the FIRST that matches, so the one that
     is choosier has to stand in front. The person writing them never has to
     know that; this is where it is arranged. */
  inf=gFmSpecificFirst(inf);
  der=gFmSpecificFirst(der);
  return {inf:inf, der:der, left:gFmLeftN};
}
function gFmSpecificFirst(a){
  var with_=[], without=[], i, c;
  for(i=0;i<a.length;i++){
    c=a[i].conditions;
    if(c && c.endsWith) with_.push(a[i]); else without.push(a[i]);
  }
  return with_.concat(without);
}
/* The app's part of speech as the engine's. adapter.js owns that table; this
   asks it rather than writing a second one. An empty pos means "any word",
   which the engine spells 'WORD' for an inflection and null for a derivation. */
function gFmPos(p){
  var w;
  if(!p) return null;
  w=LinguaGrammarEngine.adapter.wordsOf([{hw:'x', pos:p}]);
  return (w.length && w[0].partOfSpeech) || null;
}

/* This language, as the engine reads it. `list` is which words to hand over
   and is the whole dictionary when nobody says: arranging three words for a
   demonstration would otherwise build five thousand of them on every render,
   and translate.arrange() never looks at model.words at all -- it reads the
   word order and the rules. The decisions are the same either way, which is
   the point of there being one function. */
/* The engine is handed the word order and not the settings. fromLegacy()
   reads one key -- `order` -- and reading it off SET is what made the whole
   phone share one, so the caller answers with the language's own. The engine
   is DOM-free and globals-free and this is the one place that crosses back:
   it does not know what a stage is and does not have to. */
/* Where the model comes from, from 2026-08-26. A language that has a model of
   its own under langKey('gram2') is read from it; every other language is
   built from the stages exactly as before, so nothing a person has today
   answers differently. Nothing writes that key yet -- this is the road in,
   built before there is anything on it.

   TWO things are put back on every read rather than being taken from the
   store, and it is one reason twice: they point AT the dictionary, and a
   stored copy of something that points at the dictionary parts company with
   it the first time somebody renames a word.

     words         the dictionary itself
     grammarRules  'hw:<headword>' -- which words are the negation and the
                   adpositions. isMarked() in translate.js compares that
                   string against a word id rebuilt from WORDS, so a stored
                   rule simply stops matching. Nothing throws: the sentence
                   still comes out, with the negation read as an ordinary
                   noun.

   docs/FEATURES.md says the same thing from the other side -- this
   arithmetic is `current`, not `frozen`, and freezing it would be the bug. */
function gModel(list){
  var e=LinguaGrammarEngine, m=e.adapter.load(langId);
  if(!m) m=e.adapter.fromLegacy(langId, list||WORDS, {order:orderDef().id});
  else m.words=e.adapter.wordsOf(list||WORDS);
  m.grammarRules=gRules();
  var fm=gFmRules();
  m.inflections=(m.inflections||[]).concat(gInfl()).concat(fm.inf);
  m.derivations=(m.derivations||[]).concat(fm.der);
  /* How many of somebody's rules this side could not say. Nothing shows it
     yet; it is on the model so that the screen which will show it has
     something to read, and so that "some rules did not travel" is a number
     rather than a silence. */
  m.metadata.fmLeft=fm.left;
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
/* ---- the line an example is, when only its meaning was written ---------
   OWNER DECISION 2026-08-25: 「gl を打つと ln が辞書と語順から組み上がる」.
   Every grammar stage already carries Lines, and a line is three boxes: a
   label, the line in this language, and what it means. Both of the last two
   were typed by hand, and the second of them is the one the app can already
   work out -- the dictionary says what the words are and the stage above says
   what order they go in. So it works it out, and nothing new is stored, no
   screen is added and no chapter is added: it is the same row, arriving by
   the other road.

   WHAT WAS TYPED WINS, always. A line somebody wrote is theirs and is never
   recomposed -- not when the dictionary grows, not when the word order
   changes. Only an EMPTY line is filled in, which is the same shape the
   restore rule has (`docs/DATA_SAFETY.md`: fill in what is missing and stop)
   and the same shape this row already had going the other way -- exRowHTML()
   has always shown `e.gl || exGloss(e.ln)`, working out the meaning when
   none was written.

   A meaning with not one word of this language in it gives nothing back, and
   the caller refuses it exactly as it has always refused an empty line. What
   it must NOT do is store the natural sentence wearing this language's name.

   A word this dictionary does not have stays in the line as it was typed,
   which is what docs/FEATURES.md decided ("stays in the natural language").
   Showing it IN RED is the other half of that decision and is NOT here --
   see the report: the one place a line's words are drawn is exRowHTML() in
   www/wordsheet.js, which this session does not own. */
function gExLine(ln, gl){
  var e=LinguaGrammarEngine, r, i, n=0;
  ln=String(ln||'').trim(); gl=String(gl||'').trim();
  if(ln || !gl) return ln;
  r=e.translate.run(gModel(), gl);
  for(i=0;i<r.pieces.length;i++) if(r.pieces[i].kind==='word') n++;
  if(!n) return '';
  return e.translate.line(r);
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

/* ====================================================================
   Grammar v2 -- the page that DEFINES a language, chapter by chapter
   docs/GRAMMAR-V2-SPEC.md is the specification. It is the owner's, and this
   file implements it rather than interpreting it.

   §3 is the whole argument for this chapter: 「ユーザーに最初から SOV/SVO を
   選ばせるのではない。まず実際に自分の言語で文章を作ってみるところから始める」.
   So there is no list of six here. There are this language's own three words,
   in the order this language puts them, and moving them is what says what the
   order is. 「ユーザーが SOV という専門用語を知らなくても、言語を作れる UI に
   する。SOV という表示は結果として表示する」

   It is built BESIDE the old chapter rather than over it: the fifteen stages,
   STG and the six-choice are untouched, and not one byte of anybody's language
   moves. What this writes is `STG.order`, which is where the word order has
   lived since 2026-08-25 -- the same answer arrived at a different way, so a
   language that has one keeps it and the two screens cannot disagree.
   ==================================================================== */

/* Which word is picked up. Where you are standing, not something the language
   holds, so it is never saved. */
var g2Lift=-1;
/* The three words a sentence needs, in the order THIS language puts them.
   gLay() runs the real engine, so what is drawn is what a sentence of this
   language would actually come out as -- not a diagram of one. */
function g2Three(){
  var s=gWordOf('pro') || gWordOf('n'), v=gWordOf('v'), o;
  if(!s || !v) return null;
  o=gWordOf('n', s);
  if(!o) return null;
  return gLay([s, v, o]);
}
/* Moving one. The first press lifts a word and the second puts it where the
   other one stood -- two presses and no dragging, because a drag needs a
   listener of its own and every button in this app carries a NAME instead.

   What is swapped is the ORDER, not the words: position i is showing the role
   orderDef().seq[i], because gLay() arranged them by exactly that. So this
   writes the one value the old screen writes, through setOrder(), which marks
   it chosen and redraws. */
function g2Move(i){
  var q=orderDef().seq.slice(), t;
  if(g2Lift<0){ g2Lift=i; render(); return; }
  if(g2Lift===i){ g2Lift=-1; render(); return; }
  t=q[g2Lift]; q[g2Lift]=q[i]; q[i]=t;
  g2Lift=-1;
  setOrder(q.join(''));
}
/* §14 Sentence Structure. The words, then what they are, then the name --
   in that order, because the name is the RESULT and nobody has to read it. */
function g2Sent(){
  var w=g2Three(), i, out='';
  if(!w) return gNeedWords();
  for(i=0;i<w.length;i++)
    out+='<button class="seg'+(g2Lift===i? ' on' : '')+'"' + DO('g2Move', [i]) + '>'+
      esc(wOut(w[i].hw))+'</button>';
  return '<div class="segs">'+out+'</div>'+gOrderLine()+
    '<div class="gsl">'+esc(orderDef().id)+'</div>';
}
/* §14 Nouns. 「ユーザーが『りんご』『りんごたち』などを実際の言語で作る。
   例えば poko / poko-mi。ユーザーが差分を定義する」

   So this shows a real noun of this language and every form of it this
   language can make, worked out by the ENGINE -- the same road a translation
   takes, so what is on the row is what would actually be written.

   It does not build a second rule editor. The one there is lives on the word
   side (www/wordsheet.js, `openFmr`) and a rule for the marks is a WORD made
   in the 助詞 stage (`openSlot`). Two places that write the same thing is the
   shape this repository is most often bitten by, so a row goes to whichever
   of the two it came from -- which is what the rule's metadata carries. */
function g2Row(lab, from, to, act, arg){
  return '<button class="stslot has"' + DO(act, arg) + '>'+
    '<span class="psm">'+esc(lab)+'</span>'+
    '<span class="psw'+(myFontOn()? ' sfont' : '')+'">'+esc(from)+'</span>'+
    '<span class="gsep">'+ICON_GO+'</span>'+
    '<span class="psi">'+esc(to)+'</span>'+ICON_GO+'</button>';
}
/* Which rules this chapter is about. A noun is changed for NUMBER and it is
   marked for CASE; the tenses belong to the verbs chapter and are not shown
   twice. Asked of the rule rather than of a list of ids, so a rule written
   tomorrow lands in the right chapter without anything being added here. */
var G2_NOUN={NUMBER:1, CASE:1};
function g2Nouns(){
  var e=LinguaGrammarEngine, w=gWordOf('n'), m, a, i, r, made, out='', md;
  if(!w) return gNeedWords();
  m=gModel([w]);
  a=m.inflections;
  for(i=0;i<a.length;i++){
    r=a[i];
    if(!G2_NOUN[String(r.feature)]) continue;
    made=g2Made(m, r);
    if(!made) continue;
    md=r.metadata||{};
    out+=g2Row(md.label || String(r.value), wOut(w.hw), made,
               md.slot? 'openSlot' : 'openFmr',
               md.slot? ['part', md.slot] : [md.rule || '']);
  }
  return out || gNeedRules();
}
/* What THIS RULE makes of this word, asked of the engine and not worked out
   again here.

   The model is narrowed to the one rule while it is asked, and that is not
   tidiness: inflect() takes a FEATURE, and a feature is spent on the first
   rule that matches it. A language with two ways of making a plural -- one
   for words ending in a letter, one for the rest -- would therefore answer
   with whichever came first, twice, and this chapter would draw the same row
   under two different names. The row has to be about the rule it names.

   A rule that has nothing to say about this word comes back unchanged, and an
   unchanged row would be the app claiming a form the language has not got. */
function g2Made(m, r){
  var f={}, w=m.words[0], all=m.inflections, made;
  f[String(r.feature)]=r.value;
  m.inflections=[r];
  made=LinguaGrammarEngine.morphology.inflect(m, w, f);
  m.inflections=all;
  return (made.surface===w.lemma)? '' : made.surface;
}
function gNeedRules(){ return '<div class="note gneed">'+t('gram.demo.need')+'</div>'; }

/* The page. Two chapters today; docs/GRAMMAR-V2-SPEC.md §14 lists the rest and
   they arrive one at a time, each with its own picture. */
function g2Page(){
  return '<div class="sec">'+esc(t('stg.order.t'))+'</div>'+g2Sent()+
    '<div class="sec">'+esc(posLabel('n'))+'</div>'+g2Nouns();
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
