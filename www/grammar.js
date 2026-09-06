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

/* THE CARDS. A word order is a list of ROLES and the three a sentence needs
   are not all of them -- 「3語以外も置けるようにしたい」. Codes rather than the
   engine's full role names, because this is what is STORED: 'SOV' is the shape
   every language on every phone already carries, and the letters of it are
   three of these. model.js's wordOrder() is the one place that turns them into
   what the engine calls a role, so ADV means ADVERB in exactly one file. */
var ROLES=['S','O','V','ADV','ADP','NEG','Q'];
/* What a sentence needs, and what stands when nobody has answered. */
var ORDER_DEF=['S','O','V'];
/* The one place a stored word order is READ. Two shapes arrive here and both
   are somebody's: the six-letter string every language written before today
   holds, and the list of cards a finger arranged. The string is COPIED into
   the list and nothing is removed -- a language opened on an older build still
   finds its own 'SOV' where it left it, because setOrder() is the only thing
   that ever writes over it.

   A card nobody knows is dropped and a card written twice is kept once: the
   value is arranged by a finger and the engine reads it as places in a row, so
   the same role standing in two of them is one role with two places. */
function orderSeq(v){
  var out=[], i, c;
  if(typeof v==='string') v=v.split('');
  if(!v || !v.length) return ORDER_DEF.slice();
  for(i=0;i<v.length;i++){
    c=String(v[i]);
    if(ROLES.indexOf(c)>=0 && out.indexOf(c)<0) out.push(c);
  }
  /* A board carried empty is the three back again. There is no such thing as
     a language that puts nothing anywhere, and the alternative is the engine
     quietly falling back to its own default while the screen shows nothing --
     one answer in two places. */
  return out.length? out : ORDER_DEF.slice();
}
/* The word order is the LANGUAGE's and is filed under langKey('phases') with
   the rest of what the stages hold -- STG.order, and migrateGramLang() in
   www/phases.js is how it got there. It was SET.order, which is the person's
   settings and belongs to no language, so two languages on one phone had one
   word order between them: 「言語ごとですよ？」 OWNER DECISION 2026-08-25.
   Empty means nobody has answered, and the default stands.

   `id` is the cards run together, so the three still read as one of the six
   and the old stage screen goes on lighting the right one. A board with a
   fourth card on it matches none of them, which is the honest answer. */
function orderDef(){
  var seq=orderSeq(STG && STG.order);
  return {id:seq.join(''), seq:seq};
}
/* One write, not two. The value and the mark saying somebody chose it are
   both in STG now, and stMarkSet() is what saves it. It takes either shape --
   the cards off the board, or the six-letter string a language written before
   today still holds -- and what it WRITES is always the list, so there is one
   shape in storage from the first time anybody touches it.

   The six buttons are gone. What calls this is the SAVE on the board's own
   screen -- g2KeepOn()'s closure below -- so the language's word order moves
   when somebody presses save and at no other moment. */
function setOrder(v){ STG.order=orderSeq(v); stMarkSet('order'); render(); }

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
  var p=(typeof stSlotsBy==='function')? stSlotsBy(pid) : null;
  return p? stWordFor(p, k) : null;
}
/* Every word a stage made, not the first one. A language has one word for
   "not" and several for "at", "on", "under" -- gSlotAny() answered the first
   of them because one was all a demonstration needed, and the engine needs
   all of them to know which words are adpositions at all. gSlotAny is the
   head of this list rather than a second walk of the same slots. */
function gSlotAll(pid){
  var p=(typeof stSlotsBy==='function')? stSlotsBy(pid) : null, i, w, out=[];
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
  /* 「過去完了は何かの説明を?に入れてくれ」 OWNER 2026-09-05. A tense of its own
     rather than PAST and PERFECT together: the engine spends a feature on the
     first rule that matches it, so a pluperfect asked for as two features would
     be answered by the past rule and the perfect rule one after the other,
     which is not what a language that has ONE ending for it does. */
  plp:['TENSE','PLUPERFECT'],
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
  /* THE CARDS, not the name they make. `id` is them run together so that three
     of them still read as one of the six on the old stage screen, and handing
     THAT to the engine is a string it reads one letter at a time: a board of
     主語 副詞 目的語 動詞 came out 'SADVOV', which is S A D V O V -- six roles
     with the verb in twice, and the demonstration under the board printed this
     language's verb twice. Nothing threw. */
  if(!m) m=e.adapter.fromLegacy(langId, list||WORDS, {order:orderDef().seq});
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

/* A word of a given part of speech to demonstrate on. Any will do; the first
   is the least surprising choice because it is the one at the top of the
   dictionary. */
function gWordOf(pos, not){
  var i;
  for(i=0;i<WORDS.length;i++) if(WORDS[i].pos===pos && WORDS[i]!==not) return WORDS[i];
  return null;
}

/* ---- the demonstration, and where it went -------------------------------
   gSide(), gNeedWords(), gPairOf(), gPosDemo(), gOrderLine() and gOrderDemo()
   drew a pair of this language's own words with the arrangement applied and a
   speaker beside it. The ONE place any of them was drawn from was
   stFeatHTML() in www/phases.js -- the `feats` of the 語順, 否定, 形容詞 and
   場所 stages. All four stages are gone (「重複はいらない」 OWNER 2026-09-06),
   so those six were reachable from nowhere: not dead by dead-check's measure,
   because stFeatHTML() still named them, and dead on the phone, which is the
   worse half.

   What decides a side now is g2Adj() and g2Adp() below, and each draws the
   pair ITSELF -- g2Side(), two of this language's words you MOVE rather than
   two buttons you read. The board and the sentence under it are g2Sent()'s.
   One fact, one place, which is what taking the stages out was for. */

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
var g2Lift='';
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

   The word ORDER is not one of these rows any more -- it is the board of cards
   above, carried with a finger. What is left here is the rows of two, where
   the swap IS the answer. */
function g2Move(key, i){
  var at=g2Lift.split(':'), j;
  /* Nothing lifted, or a word of a DIFFERENT row: this one is lifted instead.
     Two rows arrange two different things -- what order the roles go in, and
     which side a describing word stands -- and carrying a word from one into
     the other would mean nothing. */
  if(!g2Lift || at[0]!==key){ g2Lift=key+':'+i; render(); return; }
  j=Number(at[1]);
  if(j===i){ g2Lift=''; render(); return; }
  g2Lift='';
  /* A row of two. Swapping them IS the other answer, so there is nothing to
     work out: it is whichever side this language is not on now. */
  setGPos(key, gPos(key)==='before'? 'after' : 'before');
}
/* One word of a row somebody arranges. The row is named so that two of them
   on one page cannot pick each other's words up. */
function g2Chip(key, i, w){
  return '<button class="seg'+(g2Lift===key+':'+i? ' on' : '')+'"' +
    DO('g2Move', [key, i]) + '>'+esc(wOut(w.hw))+'</button>';
}

/* ---- THE BOARD THE WORD ORDER IS ARRANGED ON ---------------------------
   「語順ボード：スライド式をやめて Duolingo 式に。下に選択肢の札（主語・
   目的語・動詞・その他の役割）、上に置き場。下の札を押すと上の列の末尾に
   入り、上の札を押すと下に戻る。枠の数は決めない。入れ替えはドラッグでは
   なく戻して置き直す。右上に保存」 OWNER 2026-09-06.

   It was carried with a finger -- three document listeners, a hit test by
   rectangles, and a write on every lift. All of that is gone. A card is a
   BUTTON with a name on it, which is what every other thing in this app is
   (CLAUDE.md § No JavaScript inside the markup), and there is nothing to aim
   at: the tray puts one on the end, the board takes one off.

   TWO ROWS AND NO SLOTS. The board holds what has been placed, in order, and
   the tray holds the roles that are not on it -- ROLES less the board, worked
   out rather than stored, so there is one list and a role added tomorrow is
   one entry in ROLES and one key in the ten i18n files. Three words is not a
   rule here: a board of four is a board of four.

   AND IT IS NOT WRITTEN UNTIL THE SAVE IS PRESSED. It used to write STG.order
   on every landing, which is a language's word order changing under somebody
   while they were still deciding. The arrangement lives in the screen's KEEP
   buffer (www/shell.js § KEEP), so the button in the corner is grey until the
   board differs from what it opened with, gold after, and the back arrow asks
   -- the same as every other screen that takes an answer. */
/* The screen the board is on, asked of the trail rather than written out
   here: the chapter is reached as `gram` + `v2:order` and a second copy of
   that string is a second answer to which screen this is. */
function g2KeepKey(){ return keepKey(); }
/* Called from the view, so it runs on every render of this screen and finding
   a buffer already here leaves it exactly as it is -- somebody has been
   arranging. The list travels as a comma-joined string because a buffer holds
   strings (keepPut), and orderSeq() is what turns it back into the list. */
function g2KeepOn(){
  keepOn(g2KeepKey(), {seq:orderDef().seq.join(',')},
         /* Split before it is handed on: setOrder() takes the list of cards
            or the old six-letter string, and a comma-joined string is
            neither -- orderSeq() would read 'O,V,S,ADV' one character at a
            time and keep the three single letters. The buffer holds strings
            (keepPut); this is where it stops being one. */
         function(v, done){
           var s=v.hasOwnProperty('seq')? String(v.seq) : orderDef().seq.join(',');
           setOrder(s? s.split(',') : []);
           done(true);
         });
}
/* What is on the board NOW: what has been arranged, or what the language
   holds if nothing has been touched. One answer, off the buffer. */
function g2Seq(){
  var s=keepVal(g2KeepKey(), 'seq');
  return s? s.split(',') : [];
}
function g2Set(a){ keepPut(g2KeepKey(), 'seq', a.join(',')); render(); }
/* From the tray onto the end of the board 「下の札を押すと上の列の末尾に入り」.
   A role already on the board is not put on twice: the tray only ever shows
   what is off it, so this can only be reached by a screen that has gone
   stale under a press. */
function g2Put(r){
  var a=g2Seq();
  if(a.indexOf(r)>=0) return;
  a.push(r); g2Set(a);
}
/* And back off it 「上の札を押すと下に戻る」. That is also how two are
   swapped -- take one off and put it back on the end -- so there is no
   second way to move a card and nothing to drag. */
function g2Take(i){
  var a=g2Seq();
  if(i<0 || i>=a.length) return;
  a.splice(i,1); g2Set(a);
}
/* `data-gr` is which role this card IS, under whatever name the interface
   language calls it. Nothing in the app reads it -- what a press does is on
   the button as a NAME, the way every button here carries one -- and
   tools/gramlang-check.mjs asks the board by it, so its claims are about the
   roles rather than about ten translations of them. */
function g2Card(r, act, arg){
  return '<button class="seg" data-gr="'+esc(r)+'"' + DO(act, arg) + '>'+
    esc(t('gram.role.'+r))+'</button>';
}
function g2Board(){
  g2KeepOn();
  var seq=g2Seq(), i, on='', off='';
  for(i=0;i<seq.length;i++) on+=g2Card(seq[i], 'g2Take', [i]);
  for(i=0;i<ROLES.length;i++)
    if(seq.indexOf(ROLES[i])<0) off+=g2Card(ROLES[i], 'g2Put', [ROLES[i]]);
  /* The board keeps a row's height with nothing on it: an empty rail that
     collapses to its own line is a place to put something that does not look
     like one, and the board starts empty the first time somebody clears it. */
  return '<div class="segs gordput" data-gord="on">'+on+'</div>'+
         '<div class="segs" data-gord="off">'+off+'</div>';
}
/* This language's own words, in the order the board says. gLay() runs the real
   engine, so this is what a sentence would actually come out as and not a
   diagram of one -- which is why it is the demonstration and the only part
   that needs a dictionary. They are read, not moved: the cards above are what
   arranges the sentence, and a second way to do it would be a second answer to
   what the order is. */
function g2Demo(){
  var w=g2Three(), i, out='';
  if(!w) return '';
  for(i=0;i<w.length;i++) out+='<span class="gor">'+esc(wOut(w[i].hw))+'</span>';
  return '<div class="gorder">'+out+'</div>';
}
/* §14 Sentence Structure. The board, then this language's own words in the
   order it says. gOrderLine() drew the same role names with chevrons between
   them and is not here: the cards ARE that line now, and the same fact twice
   on one screen is the thing this repository is most often bitten by. The
   語順 stage that drew it a second way is gone -- 「重複はいらない」 OWNER
   2026-09-06 -- so this is the one place the board is. */
function g2Sent(){
  return g2Board()+g2Demo();
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
/* One row of a chapter, and the way out of it.

   THE ROW SAYS WHAT THE RULE IS, IN WORDS. 「規則で作る形の>>-分かりにくすぎ
   ない？意味わからないから」 OWNER 2026-09-05, on a picture of the 現在形
   chapter reading 「❶　›　　›　–」 and nothing else. It used to be the EXAMPLE
   alone -- the word this language has and what the rule makes of it -- and both
   halves are empty until there is a word to make it of, so a rule written
   before the dictionary had a verb in it drew two chevrons round a gap. A rule
   with no letters on it yet drew the same, because the fallback was the
   letters.

   So the rule itself is the row: the letters it adds and which end they go on,
   which is the whole of what fmrFormHTML() lets anybody write. The example is
   ADDED where there is a word and is not what the row is made of.

   `add` wears the letters somebody drew and `side` is the app's own word for
   the end -- t('fmr.end') and t('fmr.start'), the same two the rule's own
   screen is set with, so the row and the editor cannot come out saying
   different things. They are separate spans because they are separate faces:
   one is this language and one is the interface.

   `id` is the rule's id where the row IS a rule, and it is what the row is
   CHOSEN by -- 「プラスとかプロなのに消す時も勝手に ui 足すのやめて。今まで
   ある選択とかスライドとかで消すようにして」 OWNER 2026-09-05. There was a ⊖
   on every row with a popAsk() behind it, which is a delete this list invented
   for itself; the list now deletes the way the keyboards, the notes, the
   drafts and the dictionary all do -- Select in the corner, a ◉ on each row,
   Delete beside Done. A row that is a word made in a stage carries no id: that
   word is deleted where it was made, and it cannot be chosen here. */
function g2Row(lab, add, side, from, to, act, arg, id){
  var on;
  if(G2SEL && id){
    on=!!G2SEL[id];
    return '<div class="fmmk">'+
      '<span class="ltck'+(on? ' on':'')+'" data-sel="1"'+DO('g2SelTap', [id])+
        ' role="button" aria-label="'+esc(t('fmr.sel.row'))+'">'+
        (on? ICON_DOT : ICON_RING)+'</span>'+
      '<button class="stslot has"' + DO('g2SelTap', [id]) + '>'+
      '<span class="psm">'+esc(lab)+'</span>'+
      (add? '<span class="psw">'+sfontHTML(add)+'</span>' : '')+
      (side? '<span class="psi">'+esc(side)+'</span>' : '')+
      ((to || side)? '<span class="psi">'+esc(to)+'</span>' : '')+
      '</button></div>';
  }
  return '<div class="fmmk">'+
    '<button class="stslot has"' + DO(act, arg) + '>'+
    '<span class="psm">'+esc(lab)+'</span>'+
    (add? '<span class="psw">'+sfontHTML(add)+'</span>' : '')+
    (side? '<span class="psi">'+esc(side)+'</span>' : '')+
    (from? '<span class="psw">'+sfontHTML(from)+'</span>'+
           '<span class="gsep">'+ICON_GO+'</span>' : '')+
    /* AND THE FORM IT MAKES IS ALWAYS A SLOT WHERE THE ROW SAID AN END. A rule
       that makes nothing of this language's word -- one written for words
       ending in a letter none of them ends in -- has nothing to put here, and
       leaving the span out made the row's LAST `.psi` the END rather than the
       form. Nothing on the screen changes; what changes is that the row means
       the same thing whether or not there is a word to try it on. */
    ((to || side)? '<span class="psi">'+esc(to)+'</span>' : '')+
    ICON_GO+'</button></div>';
}
/* ---- choosing several rules, and taking them away ----------------------
   The same shape kbSelDel() and ntSelDel() are, down to the names, because it
   is the same act on a different list. `G2SEL` is where you are standing on
   this screen, so viewReset() drops it, and it holds rule IDS rather than
   positions: a chapter draws the rules of one form out of one list that holds
   every form's, so a position here is a position in nothing. */
var G2SEL=null;
function g2SelOn(){ G2SEL={}; render(); }
function g2SelOff(){ G2SEL=null; render(); }
function g2SelList(){
  var out=[], k;
  if(!G2SEL) return out;
  for(k in G2SEL) if(G2SEL.hasOwnProperty(k) && G2SEL[k]) out.push(k);
  return out;
}
function g2SelTap(id){
  if(!G2SEL) return;
  if(G2SEL[id]) delete G2SEL[id]; else G2SEL[id]=1;
  render();
}
function g2SelDel(){
  var n=g2SelList().length;
  if(!n) return;
  popAsk(tn('fmr.sel.ask', n), function(){ g2SelDelGo(); }, t('pop.yes'));
}
/* Off the ids, so nothing here depends on the order the list happens to be in
   -- which is the reason a position was the wrong thing to hold. */
function g2SelDelGo(){
  var ids=g2SelList(), a=(STG && STG.fm) || [], i;
  for(i=a.length-1;i>=0;i--)
    if(a[i] && ids.indexOf(String(a[i].id))>=0) a.splice(i, 1);
  G2SEL=null;
  saveStg();
  render();
}
/* What the chapter's bar carries. The `?` is what a chapter has always had --
   「説明禁止の代わりに？を儲けてるからね？」 -- and Select stands where every
   other list in this app puts it, on the chapters that have a rule to choose.
   A chapter whose rows are not rules (the roles of a noun, the two words of a
   phrase) has nothing to select and keeps the `?` alone. */
function g2ChapBar(c){
  if(G2SEL)
    return (g2SelList().length? navDel(t('fmr.sel.del'), 'g2SelDel') : '')+
      navDo(t('fmr.sel.done'), 'g2SelOff', null, true);
  if(c && c.fm && g2FmRows(c) && !langLocked())
    return navDo(t('fmr.sel'), 'g2SelOn', null, true);
  return helpQ('g2.'+c.id);
}
/* Which end the letters go on, as the word the rule's own screen is set with.
   Asked here rather than written out, so there is one name for each end. */
function gFmSide(r){ return t((r && r.at==='start')? 'fmr.start' : 'fmr.end'); }
/* And the same fact in the shape every dictionary in the world writes an affix
   in: the hyphen stands where the word goes. It is the app's mark and not a
   letter of anybody's language, so with the drawn font on it falls back the way
   any mark nobody drew does. Empty stays empty -- a rule with no letters on it
   yet is a rule somebody has not finished, and `-` alone would read as one. */
function gFmAffix(r){
  var f=gFmForm(r);
  if(!f) return '';
  return (r && r.at==='start')? f+'-' : '-'+f;
}
/* WHICH CHAPTER AN ENGINE RULE BELONGS TO, and it is asked here and nowhere
   else. It used to be a table of five features, because the verbs chapter was
   one chapter holding eleven forms; a form is a CHAPTER now (g2Chaps below), a
   chapter names the `fm` label it is about, and its rules are asked for by that
   label rather than worked back out of the feature they became. What is left
   here is the two kinds of rule that are NOT one form of a word: a describing
   word that agrees, and the marks the 助詞 stage makes. */
function g2Chap(r){
  /* The marks the 助詞 stage makes, and nothing else. Every rule somebody wrote
     is claimed by the chapter of the FORM it makes -- g2FmRows() above -- so a
     rule read by its feature here as well would be one fact drawn twice. */
  return (String(r.feature)==='CASE')? 'n' : '';
}
/* §14 Nouns. The chapter is the three roles the 助詞 stage names -- 主語 /
   目的語 / 受け手 -- and it is drawn the way every other chapter of this page
   is: the ones this language has said, and the ones it has not as a row
   saying 作成. 「文法の名詞ページ見たけど、真っ暗で何もない」 OWNER
   2026-09-05.

   It used to be a walk over the model's CASE inflections, and gInfl() builds
   one only where the stage already HAS the word -- so a language that had not
   written its case marks yet had no rows, and this chapter has no g2Add() row
   either, because no form in FM_INF makes a CASE rule. The page came out
   empty however many nouns were in the dictionary. Not blank because
   something failed: blank because nothing was ever drawn.

   THE EXAMPLE IS THE HALF THAT WAITS ON A WORD. What a mark makes of a noun
   needs a noun to make it of, so that is drawn where there is one and the
   mark's own spelling stands where there is not -- which is g2FmRows()'s
   answer to the same question, one row up.

   openSlot() is the one door and it is the door these rows already used: it
   opens the word where the stage has one and the sheet that writes it where
   it has not, so a row that is there and a row that is not are one press with
   one answer. */
function g2Nouns(){
  var p=(typeof stBy==='function')? stBy('part') : null;
  var a=(p && p.slots) || [], n=gWordOf('n'), m=null, out='', i, k, w, made;
  if(!p) return '';
  if(n) m=gModel([n]);
  for(i=0;i<a.length;i++){
    k=a[i];
    w=stWordFor(p, k);
    if(!w){
      out+='<button class="stslot"' + DO('openSlot', ['part', k]) + '>'+
        '<span class="psm">'+esc(stSlotLabel(p, k))+'</span>'+
        '<span class="psn">'+t('stg.make')+'</span>'+ICON_GO+'</button>';
      continue;
    }
    made=m? g2MadeBy(m, 'slot', k) : '';
    out+=g2Row(stSlotLabel(p, k), '', '', made? wOut(n.hw) : '',
               made || wOut(w.hw), 'openSlot', ['part', k], '');
  }
  return out;
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

/* §14 Negation and §14 Questions were a PAIR OF LINES here -- `mi luma` over
   `mi na luma` -- built out of the rules and, for the negation, the word the
   否定 stage made. They are chapters of a form now, drawn by
   g2FmChap() like the eleven beside them, because 「4の否定もなにすればいいか
   わからんし」 OWNER 2026-09-05: a pair of lines says what a rule DOES and never
   what the rules ARE, so a chapter with no rule in it drew nothing at all and a
   chapter with three drew three lines that could not be told apart. The word
   the 否定 stage made is edited in that stage, on the same list, and is not
   drawn twice. */
/* §14 Adjectives. 「単に before / after だけにしない」

   Two things, and the first is why the chapter is not just a row of forms:
   WHERE a describing word stands is arranged here the way the sentence is
   arranged in the first chapter -- two words of this language, and moving one
   is what says which side. The old screen asked it with a pair of buttons
   labelled 「名詞の前 / 名詞の後」; nobody has to read a label to see
   `red house` become `house red`.

   The second is that a describing word may itself CHANGE -- 「形容詞そのものが
   変化する言語にも対応できるようにする」 -- and those rules are drawn under
   the same heading, on an adjective of this language.

   NOUN → ADJECTIVE is not here. §8 gives word formation a chapter of its own
   and it is a different question: this one is about a word that already is an
   adjective. */
/* Two words of this language, in the order this language puts them, and
   moving one says which side. Two chapters are this -- a describing word
   beside its noun, and a place word beside its noun -- and both replace a
   pair of buttons that had to be READ. */
/* Which side, as the two words themselves when this language has two, and as
   the pair of names when it has not. The choice is the chapter and cannot wait
   on the dictionary; only the phrase that demonstrates it can. */
function g2Side(key, w, n){
  var laid, i, out='';
  if(!w || !n) return g2SidePick(key);
  laid=gLay([w, n]);
  for(i=0;i<laid.length;i++) out+=g2Chip(key, i, laid[i]);
  return '<div class="segs">'+out+'</div>';
}
function g2SidePick(key){
  var a=['before','after'], i, now=gPos(key), out='';
  for(i=0;i<a.length;i++)
    out+='<button class="seg'+(a[i]===now? ' on' : '')+'"' +
      DO('setGPos', [key, a[i]]) + '>'+esc(gPosLab(key, a[i]))+'</button>';
  return '<div class="segs">'+out+'</div>';
}
/* Where a describing word stands, and that alone. The ways one CHANGES are
   chapters of their own now, one per form, so listing them here as well would
   be the same rule on two pages. */
function g2Adj(){
  return g2Side('adj', gWordOf('adj'), gWordOf('n'));
}

/* §14 Adpositions / Location. 「現在の adp の位置設定だけではなく、場所を
   どう表現するかを定義できるようにする」

   `house in` and `in house` are this: the place word and its noun, in the
   order this language puts them, and moving one says which side. It replaces
   a pair of buttons labelled 「名詞の前 / 名詞の後」 with the phrase itself.

   `house-LOC` -- the third way §7 names, where the place is marked on the
   noun rather than said with a word -- CANNOT BE WRITTEN in this app yet.
   The engine hears it (morphology.js knows LOCATIVE and ABLATIVE), and the
   助詞 stage offers three roles that do not include them. docs/BACKLOG.md
   carries that, because which of the two places a person should write it in
   is not this file's to decide.

   The place words themselves are under the pair now. There WAS a 場所 stage
   holding them and this chapter beside it, which is the one list saying 場所
   twice -- 「重複はいらない」 OWNER 2026-09-06. They are the same rows the
   stage drew, from www/phases.js's CHAP_SLOTS, so nothing anybody made moved
   and nothing new is stored. */
function g2Adp(){
  return g2Side('adp', gSlotAny('where'), gWordOf('n'))+chapSlotsHTML('adp');
}

/* §14 Questions says 「方法は言語によって違う ── suffix / prefix / separate
   word / word order / particle / intonation / combination。Lingua 側が勝手に
   決めない」, and THIS APP CAN WRITE TWO OF THE SEVEN. An ending and a beginning
   are rules and are what the 疑問形 chapter lists; the other five have nowhere
   to be written, which is not decided here and is not papered over.
   docs/BACKLOG.md carries what is missing, with what each would need. */

/* §14 Language Engine Status. 「ユーザーが Lingua で言語を作り込むほど、
   Words + Morphemes + Derivations + Inflections + ... が蓄積され、その結果
   Parser / Generator / Translation の精度が上がる」(§24)

   So the last block of the page is what this language HAS. It is a count and
   not a report: a number is a state, and the rest of the page is where each
   of them can be seen one at a time.

   Three rows and not the seven §14 draws. `Morphemes` is always nought --
   nothing in this app writes one, because a rule carries its own letters --
   and a row that can only ever say nought is a slot nobody can fill, which is
   the shape this page has spent all day taking OUT. `Grammar rules` counts
   what this file builds for the engine rather than anything somebody wrote.
   Parser and generator coverage are drawn in §14 as `...` and are not a
   number anybody has defined yet. Those four arrive when they can be true. */
function g2Stat(lab, n){
  return '<div class="gside"><span class="gsl">'+esc(lab)+'</span>'+
    '<span class="gsw">'+esc(String(n))+'</span></div>';
}
function g2Status(){
  var m=gModel([]);
  return g2Stat(t('g2.words'), WORDS.length)+
    g2Stat(t('g2.forms'), m.inflections.length)+
    g2Stat(t('g2.der'), m.derivations.length);
}

/* ---- what a chapter can still be told ----------------------------------
   「新しい規則は＋とかで作ればいいやん」 OWNER 2026-08-27.

   A chapter knows its part of speech, so nobody is asked which -- that is
   what splitting the page bought. It does NOT know which FORM: a verb has
   eleven of them, and choosing among eleven is a choice however the page is
   arranged.

   So the chapter shows them the way a STAGE shows its words: the ones this
   language has, as the pair they make, and the ones it has not, as a row
   saying 作成. Pressing an empty one writes the rule and opens it for its
   letters. No picker for the part of speech and none for the form -- the row
   pressed IS the answer to both.

   Which forms belong to which chapter is NOT a second table. It is asked of
   g2Chap(), the one place that already decides it, by handing it the rule
   that form would make. A form added to the app lands in a chapter the day
   it is added. */
function g2PosTarget(pos){
  var w=LinguaGrammarEngine.adapter.wordsOf([{hw:'x', pos:pos}]);
  return (w.length && w[0].partOfSpeech) || 'WORD';
}
function g2FmsOf(id){
  var c=g2ChapBy(id), out=[], i, f, g;
  if(!c || !c.pos) return out;
  /* A chapter that IS a form is about that form and no other, and it draws its
     own way to add one -- g2FmAdd() -- so there is nothing for g2Add() to
     offer. What is left for g2MakeAll() is the words those rules would make. */
  if(c.fm) return [c.fm];
  if(typeof FM_INF==='undefined') return out;
  for(i=0;i<FM_INF.length;i++){
    f=FM_INF[i]; g=GFM_INF[f];
    if(!g) continue;
    if(g2Chap({feature:g[0], value:g[1], target:g2PosTarget(c.pos)})!==id) continue;
    out.push(f);
  }
  return out;
}
/* Whether this language has already said this. Asked of the rules somebody
   wrote rather than of the engine: a rule this side cannot carry over is
   still a rule they wrote, and offering to write it again would be the app
   forgetting what it was told. */
function g2HasFm(pos, fm){
  var a=(STG && STG.fm) || [], i;
  for(i=0;i<a.length;i++)
    if(a[i] && String(a[i].fm)===fm && String(a[i].pos||'')===String(pos)) return true;
  return false;
}
/* The words this chapter's rules would make and this language has not got.
   fmrTodoAll() is the one place that works that out; this only narrows it to
   the chapter somebody is standing on. */
function g2Todo(id){
  var c=g2ChapBy(id), fms=g2FmsOf(id), all, out=[], i, x;
  if(!c || !c.pos || typeof fmrTodoAll!=='function') return out;
  all=fmrTodoAll();
  for(i=0;i<all.length;i++){
    x=all[i];
    if(String(x.w.pos)!==c.pos) continue;
    if(fms.indexOf(String(x.m.fm))<0) continue;
    out.push(x);
  }
  return out;
}
/* And the button that makes them, only when there are some -- a button that
   does nothing when pressed is worse than no button, which is what the row on
   a word's page has always said. */
function g2MakeAll(id){
  var c=g2ChapBy(id), n=g2Todo(id).length;
  if(!c || !c.pos || !n) return '';
  return '<button class="btn ghost" style="width:100%;margin-top:14px"' +
    DO('fmrAddAll', [c.pos, g2FmsOf(id)]) + '>'+ICON_ADD+
    esc(tn('fmr.all', n))+'</button>';
}
function g2Add(id){
  var c=g2ChapBy(id), fms=g2FmsOf(id), i, out='';
  if(!c || !c.pos || c.fm) return '';
  for(i=0;i<fms.length;i++){
    if(g2HasFm(c.pos, fms[i])) continue;
    out+='<button class="stslot"' + DO('fmrNew', [c.pos, fms[i]]) + '>'+
      '<span class="psm">'+esc(fmLabel(fms[i]))+'</span>'+
      '<span class="psn">'+t('stg.make')+'</span>'+ICON_GO+'</button>';
  }
  return out;
}

/* ====================================================================
   A FORM IS A CHAPTER
   「過去形タップしたら❶みたいに並べたほうがいいんじゃないの？」
   「過去形でもいろんな規則作れるよね？」 OWNER 2026-09-05.

   There was one chapter called 動詞 holding eleven forms, and pressing it gave
   a row per form saying 作成 -- so a language wanting two ways of making a past
   tense had one row to press and nowhere for the second to go. Each form is its
   own chapter now, and inside it is the list of the rules this language has for
   it, numbered, with the way to write another under them.

   ONE FUNCTION DRAWS ALL OF THEM. They differ in the `fm` label they are about
   and the part of speech they are written on, and in nothing else -- a chapter
   per form written out eleven times is eleven places to fix the twelfth time
   something moves. 「基本言語にあるのは際限なく増やしていいよ」: adding one is
   a line in G2FM_CHAPS.

   The label is the app's own `word.fm.<f>`, which the word sheet has always
   used, so a chapter and the form row on a word cannot come out with two names
   for one thing. What goes behind the `?` is the same `.d` and `.e` those
   labels already carry.
   ==================================================================== */
/* The form, and the part of speech it is written on. Order is the order of
   the list. `que` is the question chapter and `neg` the negation one -- the ids
   they already had, because those two are named after what they DO rather than
   after a form of a word. */
var G2FM_CHAPS=[
  ['pst','pst','v'], ['prs','prs','v'], ['fut','fut','v'], ['plp','plp','v'],
  ['prg','prg','v'], ['prf','prf','v'], ['cnd','cnd','v'], ['cau','cau','v'],
  ['imp','imp','v'], ['pas','pas','v'], ['neg','neg','v'], ['q','que','v'],
  ['pl','pl','n']
];
/* ❶❷❸, which is what was asked for and is also the only thing a row of this
   list can be called: every rule in a chapter makes the same form, so naming
   them by the form would be one name printed five times. Past ten it is the
   number itself rather than nothing -- a language may write as many as it
   likes and a row with no name is a row you cannot say out loud. */
var G2NUM=['\u2776','\u2777','\u2778','\u2779','\u277A',
           '\u277B','\u277C','\u277D','\u277E','\u277F'];
function g2Num(i){ return G2NUM[i] || String(i+1); }
/* What THIS rule makes of a word of this language, asked of the engine by way
   of the inflection it became. g2Made() is the one place that asks; this only
   finds which of the model's rules is the one on this row, by whichever of the
   metadata fields names it -- `rule` for a rule somebody wrote, `slot` for a
   mark the 助詞 stage made. Those two were the same loop written twice, one in
   each chapter. A rule the engine could not carry -- a condition about sound,
   which it has no phonology for -- is in the model nowhere, and the row falls
   back to the letters it adds. */
function g2MadeBy(m, key, val){
  var a=m.inflections, i, md;
  for(i=0;i<a.length;i++){
    md=a[i].metadata || {};
    if(String(md[key])===String(val)) return g2Made(m, a[i]);
  }
  return '';
}
/* The rules this language has for one form, in the order they were written.
   Asked of STG.fm rather than of the engine, because a rule that did not travel
   is still a rule somebody wrote and a chapter that hid it would be the app
   forgetting what it was told. */
function g2FmRows(c){
  var a=(STG && STG.fm) || [], out='', i, r, id, n=0, w, m, made;
  for(i=0;i<a.length;i++){
    r=a[i];
    if(!r || String(r.fm)!==c.fm) continue;
    /* Asked of the rule's OWN part of speech, and of the chapter's only where
       the rule names none. A rule written for any word -- `pos` empty, which
       is what the editor leaves when nobody narrowed it -- belongs to the form
       it makes and to no other chapter, and matching the chapter's part of
       speech instead hid every one of them: they were in a chapter nowhere,
       which is the quieter half of being in two. */
    w=gWordOf(r.pos || c.pos);
    id=String(r.id||'');
    made='';
    if(w){ m=gModel([w]); made=g2MadeBy(m, 'rule', id); }
    out+=g2Row(g2Num(n++), gFmAffix(r), gFmSide(r), '', made, 'openFmr', [id], id);
  }
  return out;
}
/* And the way to write another, which is on the chapter always. A form is not
   one rule: 「過去形でもいろんな規則作れるよね？」 -- so this is never hidden
   because the language already has one.

   IT IS THE ＋ ON THE HEADING, not a row saying what it does.
   「＋◉が規定なんだからそれにしろ」 OWNER 2026-09-06. secAdd() is the one
   place that shape is written -- the example lines on a stage add with it, and
   so does the word sheet -- so the chapter's rules are added the way every
   other list in this app adds one more, and the heading names the list at the
   same time. What the button says out loud is still `g2.fm.add`: it is the
   aria-label now rather than the face of a row. */
function g2FmAdd(c){
  return secAdd(esc(t('stg.rules')), DO('fmrNew', [c.pos, c.fm]), t('g2.fm.add'));
}
/* And the words this chapter's own stage used to ask for, where there was
   one: 否定形 wants the word for "not" and 疑問形 the six question words.
   chapSlotsHTML() draws nothing for the eleven chapters that have none. */
function g2FmChap(c){ return g2FmAdd(c)+g2FmRows(c)+chapSlotsHTML(c.id); }
/* What is behind the `?`. 「説明禁止の代わりに？を儲けてるからね？」 OWNER
   2026-09-05 -- so a chapter says nothing about itself on the screen and the
   whole of what it means is one press away. The two lines are the app's own
   `.d` and `.e` for that label: what the form is, and one example of it in the
   interface language. Registered from the list rather than one at a time so a
   chapter added to G2FM_CHAPS arrives with its `?` already on it. */
function g2HelpOf(fm){
  return function(){
    return {t:fmLabel(fm),
            h:'<div class="note">'+esc(t('word.fm.'+fm+'.d'))+'</div>'+
              '<div class="note">'+esc(t('word.fm.'+fm+'.e'))+'</div>'};
  };
}
function g2HelpReg(){
  var i;
  for(i=0;i<G2FM_CHAPS.length;i++)
    HELP['g2.'+G2FM_CHAPS[i][0]]=g2HelpOf(G2FM_CHAPS[i][1]);
}
/* `HELP` is www/home.js's, and www/index.html loads that file first, so in the
   app it is here. THIS FILE IS ALSO READ ON ITS OWN: tools/grammar-engine-check
   .mjs puts it into a bare Node context to run samples through the engine, and
   there is no screen there and no HELP to register with -- the call threw on
   load and took the whole check with it. So it is asked, once, rather than
   assumed. Nothing else in this file touches a screen at load time. */
if(typeof HELP!=='undefined') g2HelpReg();

/* THE CHAPTERS, and each one is a PAGE.

   They were eight headings stacked down one screen, which is two of the four
   shapes this repository forbids by name: 「同じページに情報量詰め込み」 and
   「ページ遷移型にせずに」. It got worse with every chapter -- by the seventh
   it was a page you scroll through to find out what is on it -- and §14 has
   more to come. So the list is a list, and a chapter is where you go.

   Splitting them buys something the owner named: 「新しい規則は＋とかで作れば
   いいやん」. **A chapter knows its own part of speech and its own kind of
   rule.** The + on the noun chapter makes a noun rule; nobody is asked which,
   because the page they are standing on already said it.

   Asked of the page rather than written down twice: gramArgs() in
   www/phases.js hands this list to both walks, so a ninth chapter is walked
   the day it is added. */
function g2Chaps(){
  /* The function comes before the name, and that is not taste: dead-check
     counts a mention as the name against a bracket, a comma or a semicolon,
     so a function that is the LAST thing in an object literal is followed by
     `}` and reads as unused. Eight of them did. */
  var out=[{id:'order', body:g2Sent,  nm:t('stg.order.t')},
           {id:'n',     body:g2Nouns, nm:posLabel('n'), pos:'n'}], i, a;
  /* The forms, one chapter each, from the one list. A chapter is drawn by
     g2FmChap() and knows its own form and its own part of speech, so nothing
     here is written thirteen times. */
  for(i=0;i<G2FM_CHAPS.length;i++){
    a=G2FM_CHAPS[i];
    out.push({id:a[0], body:g2FmChap, nm:fmLabel(a[1]), pos:a[2], fm:a[1]});
  }
  out.push({id:'adj', body:g2Adj,    nm:posLabel('adj'), pos:'adj'});
  out.push({id:'adp', body:g2Adp,    nm:t('stg.where.t')});
  out.push({id:'st',  body:g2Status, nm:t('wld.about')});
  return out;
}
function g2ChapBy(id){
  var a=g2Chaps(), i;
  for(i=0;i<a.length;i++) if(a[i].id===id) return a[i];
  return null;
}
/* What a chapter is called, wherever it is named. The bar over a chapter's
   page asks this through pageName(), so the list and the bar cannot disagree
   about what somebody just opened. */
function g2ChapName(id){
  var c=g2ChapBy(id);
  return c? c.nm : t('stg.order.t');
}
/* One row of the grammar's list, and the list itself is stListHTML() in
   www/phases.js -- there is one list of chapters, not two.

   It was a list of its own, reached by a button at the foot of the old list,
   so the chapters that say what a word actually turns into were two steps
   down inside a chapter called 語順. 「文法ページはいつ統合されん
   の？」 OWNER 2026-08-28. Both groups of chapters are on the one list now,
   these first, and the door at the foot is gone with the list it opened.

   It wears .strow like every other row there, because a row in one list is
   one height. What it has not got is a count: "done" per chapter is not
   defined for these, and stRow's own — is what this app already writes
   where there is no number to write. Names and nothing else otherwise -- a
   row that explained what a chapter was for would be the thing
   「無駄に説明をするやつ」 names. */
function g2ChapRow(c, n){
  return '<button class="strow"' + DO('go', ['gram', 'v2:'+c.id]) + '>'+
    '<span class="stn">'+n+'</span>'+
    '<span class="stt">'+esc(c.nm)+'</span>'+
    '<span class="lead"></span>'+
    '<span class="stv">—</span>'+
    ICON_GO+'</button>';
}
/* One chapter's page. It is handed the chapter rather than the argument now:
   vGram() looks it up, because it is vGram() that has to fall back to the
   list when the argument names no chapter. */
function g2Page(c){
  return c.body(c)+g2Add(c.id)+g2MakeAll(c.id);
}

/* ---- the screen -------------------------------------------------------- */
