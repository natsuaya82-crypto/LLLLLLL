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
/* CMP is the COMPLEMENT -- what a copular sentence says the subject IS.
   「コピュラ・存在 ──「〜です」「〜がある」の語と位置」 OWNER 2026-09-07: the
   two WORDS are the コピュラ chapter's, and their POSITION is here, on the
   board that already says where every other role of a sentence stands. A
   second picker on that chapter would be one answer in two places, and a
   complement standing where an object stands is a guess about somebody's
   language rather than something they said. */
/* STD is the STANDARD -- what a comparison is measured against, 「山より高い」
   の「山」. It is a role of a sentence exactly as 場所 is, and a phrase of the
   same shape (a nominal with a little word beside it), so where it stands is
   said here and the WORD it is said with is the 比較級 chapter's. Without a
   card it follows the sentence, which is what every role this board has no
   place for already does -- true, and not something anybody chose. */
var ROLES=['S','O','V','ADV','ADP','NEG','Q','CMP','STD'];
/* What a sentence needs, and what stands when nobody has answered. */
var ORDER_DEF=['S','O','V'];
/* THE PARTS OF A NOUN PHRASE, and they are cards on a board exactly as the
   roles of a sentence are -- 「札の板（語順と同じ形）」 OWNER 2026-09-07.
   Where a sentence puts its verb and where a noun phrase puts its adjective
   are two different answers, and a language may give them in two different
   directions: Japanese is SOV with every modifier before the noun, and Irish
   is VSO with them after. One board could not have said that.

   Codes, for the reason ROLES above is codes: this is what is STORED, and
   model.js's npOrder() is the one place that turns a card into the part the
   engine writes with. N is the noun ITSELF, because where the head stands
   among what describes it is the whole question.

   THERE IS NO DEFAULT. An empty board is a language nobody has asked, and
   what that language does is what it did before the board existed -- the
   adjective on the side the 形容詞 chapter gives it, and nothing else
   placed at all. A default here would be this app deciding the shape of
   somebody's noun phrase for them. */
var NPARTS=['DEM','NUM','ADJ','POSS','REL','N'];
/* The one place a stored word order is READ. Two shapes arrive here and both
   are somebody's: the six-letter string every language written before today
   holds, and the list of cards a finger arranged. The string is COPIED into
   the list and nothing is removed -- a language opened on an older build still
   finds its own 'SOV' where it left it, because setOrder() is the only thing
   that ever writes over it.

   A card nobody knows is dropped and a card written twice is kept once: the
   value is arranged by a finger and the engine reads it as places in a row, so
   the same role standing in two of them is one role with two places. */
function orderKeep(v){
  var out=[], i, c;
  if(typeof v==='string') v=v.split('');
  if(!v) return out;
  for(i=0;i<v.length;i++){
    c=String(v[i]);
    if(ROLES.indexOf(c)>=0 && out.indexOf(c)<0) out.push(c);
  }
  return out;
}
function orderSeq(v){
  var out=orderKeep(v);
  /* A board carried empty is the three back again. There is no such thing as
     a language that puts nothing anywhere, and the alternative is the engine
     quietly falling back to its own default while the screen shows nothing --
     one answer in two places.

     WHAT IS SAVED AND WHAT IS ON THE BOARD ARE TWO QUESTIONS, and this line is
     why they had to be split. A sentence has to be arranged somehow, so this
     answers with the three where nothing has been saved -- and the board was
     opened from it, so a language nobody had answered for came up with 主語
     目的語 動詞 already placed, reading as an answer somebody had given.
     「最初から主語と動詞とかが入ってるせいでわかりにくい」 OWNER 2026-09-06.
     orderKeep() above is the same read WITHOUT the default, and the board opens
     from that. */
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
/* The noun phrase's order, read and written the way the sentence's is. It has
   no orderSeq() beside it and no ORDER_DEF behind it, and that is the whole
   difference between the two: a sentence has to be arranged somehow, and a
   noun phrase that nobody has arranged is every other chapter's answer left
   exactly where it was. `STG.np` is the language's, beside `STG.order`, for
   the reason written over that field: it is the language's and not the
   phone's. */
function npKeep(v){
  var out=[], i, c;
  if(typeof v==='string') v=v.split(',');
  if(!v) return out;
  for(i=0;i<v.length;i++){
    c=String(v[i]);
    if(NPARTS.indexOf(c)>=0 && out.indexOf(c)<0) out.push(c);
  }
  return out;
}
function npStored(){ return npKeep(STG && STG.np); }
function setNpOrder(v){ STG.np=npKeep(v); stMarkSet('np'); render(); }

/* ---- where a word stands ----------------------------------------------
   Three positions. Each is one answer for the whole language and each is
   heard in every sentence that uses it, which is why these three have buttons
   and nothing else does. None of them asks whether the language marks
   something, and none asks you to invent a piece of sound: the word already
   exists, made in the stage that needed it. */
/* And three more of them, which are the 複文 chapter's: where a subordinate
   clause stands against the main one, where the mark of such a clause stands
   inside it, and where the mark of a relative clause stands inside that.

   A MARK OPENS ITS CLAUSE until somebody says otherwise, and that is not a
   guess about anybody's language: all ten of the interface languages do it,
   and it is what stands where nobody has answered -- stTouched() is the
   question "was this chosen" and always was. Where the clause itself stands is
   left at the same 'after' the three above take. */
var GPOS_DEF={adj:'after', negp:'after', adp:'after',
              cx:'after', cxm:'before', relm:'before', than:'after'};
/* The language's, beside the word order and for the same reason. Reading one
   does not write it: the old pair put the default into the person's settings
   the first time a stage was drawn, so a value existed for three decisions
   nobody had made. Nothing here answers "was this chosen" -- stTouched() is
   that question and always was. */
function gPos(id){
  return (STG && STG.gpos && STG.gpos[id]) || GPOS_DEF[id] || 'after';
}
/* AND WHETHER THIS LANGUAGE HAS ANSWERED AT ALL, which is a different question
   from what the answer is and had nowhere to be asked. gPos() above cannot say
   it: it answers GPOS_DEF for a side nobody has touched, and every screen that
   drew a side therefore drew the app's own fallback as this language's answer.
   「文法の各段は最初は何も置かれてない状態」 OWNER 2026-09-10.

   IT IS THE VALUE AND NOT stTouched(). The two say the same thing about every
   language anybody makes from now on -- setGPos() writes both in one press --
   and they part company on exactly one kind: a language that came through
   migrateGramLang() (www/phases.js), which COPIES the side somebody pressed on
   the old phone-wide screen and deliberately leaves STG.set alone, because
   nobody chose it IN THIS LANGUAGE. That language holds the value and the
   engine arranges every sentence by it, so a screen answering stTouched() here
   would say 「nobody has answered」 over a page whose own demonstration is
   arranged by the answer. The value is what the engine reads and it is what
   this asks.

   GPOS_DEF is then what it always was: what stands where there is no answer.
   Nothing writes it. */
function gPosSaid(id){ return !!(STG && STG.gpos && STG.gpos[id]); }
function setGPos(id, v){
  if(!STG.gpos) STG.gpos={};
  STG.gpos[id]=v; stMarkSet(id); render();
}
/* Which side, and of what. "Before" on its own is not a label: before the
   noun and before the verb are different facts. */
/* Which side, and of what. "Before" on its own is not a label, and the three
   clause decisions are two different "of": a subordinate clause stands before
   or after THE MAIN SENTENCE, and a mark stands before or after THE CLAUSE it
   belongs to. */
var GPOS_OF={adj:'n', negp:'v', adp:'n', cx:'main', cxm:'cl', relm:'cl', than:'n'};
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
  var e=LinguaGrammarEngine, out=[], w, ws, i, np;
  /* The noun phrase's order, and ONLY where somebody has arranged one: an
     empty board says nothing rather than saying "in this order, nothing",
     which the engine would read as a phrase with no noun in it. */
  np=npStored();
  if(np.length) out.push(gRule('NOUNPHRASE', 'ORDER', np));
  out.push(gRule('ADJECTIVE',  'POSITION', gPos('adj')));
  /* WHICH SIDE OF THE VERB THE NEGATION WORD STANDS, read off the rule that
     says the negation IS a word. It was `gpos.negp`, a two-choice of its own
     on the word order board with no word attached to it; that value is read
     as such a rule by gPolOld() (§16 Migration), and this is the one place
     that reads the answer now. It is the sentence READER's half -- a
     sentence somebody typed, arranged -- and translate.js has always asked
     for it here. */
  out.push(gRule('NEGATION',   'POSITION', gNegSide()));
  out.push(gRule('ADPOSITION', 'POSITION', gPos('adp')));
  /* 複文. The clause against the sentence, and each of the two marks inside
     its own clause. Three answers, each heard in every sentence that uses it,
     which is the test this app applies to giving something a button. */
  out.push(gRule('CLAUSE',     'POSITION', gPos('cx')));
  out.push(gRule('CLAUSEMARK', 'POSITION', gPos('cxm')));
  out.push(gRule('RELATIVE',   'POSITION', gPos('relm')));
  /* WHICH WORDS ARE IN WHICH CLASS, one rule per class, in the same shape
     "which words are the negation" already takes. The engine never has to know
     what a class is: it is handed a name and a list of words, and a rule
     asking for CLASS/<that name> fires on those words and no others. */
  np=nclsLive();
  for(i=0;i<np.length;i++)
    out.push(gRule('CLASS', nclsName(np[i]), nclsWordIds(np[i])));
  w=gSlot('neg','not');
  if(w) out.push(gRule('NEGATION','WORD', e.adapter.idOf(w)));
  ws=gSlotAll('where');
  for(i=0;i<ws.length;i++) out.push(gRule('ADPOSITION','WORD', e.adapter.idOf(ws[i])));
  /* WHICH WORDS ARE THE ARTICLES AND THE DEMONSTRATIVES, said the same way the
     negation and the adpositions are said: no part of speech can tell them
     apart from any other little word, so the page that knows about slots names
     them here, by id, and the engine never has to know what a slot is. */
  ws=gSlotAll('det');
  for(i=0;i<ws.length;i++) out.push(gRule('DEMONSTRATIVE','WORD', e.adapter.idOf(ws[i])));
  /* 比較. Which word means 「〜より」, and which side of what is being measured
     against it stands. Named the same way, for the same reason: no part of
     speech can tell it from any other little word. */
  ws=gSlotAll('than');
  for(i=0;i<ws.length;i++) out.push(gRule('STANDARD','WORD', e.adapter.idOf(ws[i])));
  out.push(gRule('STANDARD', 'POSITION', gPos('than')));
  /* 否定と疑問. Every rule somebody wrote, in the shape the engine reads: the
     TARGET is which of the two this is about and the FEATURE is which kind of
     sentence, so polarRules() in translate.js can ask for one kind and fall
     back to the verb sentence's without this side saying anything about it.
     「無ければ動詞の文のものを使う、とエンジンが判断」 */
  ws=gPolAll();
  for(i=0;i<ws.length;i++){
    w=ws[i];
    if(!w || !w.feature || !w.target) continue;
    out.push(e.grammarRule({type:'syntax', target:w.feature, feature:w.target,
                            operation:w.operation, value:{ops:gPolOps(w)}}));
  }
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
/* WHAT EACH MARK MEANS, and it is the ROLE it gives rather than the name a
   grammar book would give the case. `subj` is SUBJECT and not NOMINATIVE
   because that is what somebody making a language said: this word is the one
   doing it. morphology.js's CASE_ROLE turns the traditional names into these
   same roles, and takes a value it does not know as the role it names -- so
   the two roads arrive at one answer and this table needs no row there.

   Seven. The first three are what a word order could have decided; the four
   after them are what it never could. POSSESSOR is the one that shows why:
   it is a word inside a noun phrase, and no arrangement of a sentence says
   which noun owns which. */
var GCASE={subj:'SUBJECT', obj:'OBJECT', rec:'RECIPIENT',
           poss:'POSSESSOR', loc:'PLACE', inst:'INSTRUMENT', com:'COMPANION'};
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
var GFM_FEAT={
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
  /* 法. 「命令・条件はある。可能・義務・願望を足す」 OWNER 2026-09-07. The
     same feature the imperative and the conditional already are, because they
     are the same kind of fact about a sentence and a language spends one
     ending on it. */
  pot:['MOOD','POTENTIAL'], obl:['MOOD','OBLIGATIVE'], des:['MOOD','DESIDERATIVE'],
  /* 形容詞の比較. 「比較・最上級の規則（fmr の形）と位置」 OWNER 2026-09-07.
     One feature and two values, the same argument as the moods and the person
     forms: a word is not comparative and superlative at once. */
  cmp:['DEGREE','COMPARATIVE'], sup:['DEGREE','SUPERLATIVE'],
  cau:['VOICE','CAUSATIVE'], pas:['VOICE','PASSIVE'],
  pl :['NUMBER','PLURAL'],
  /* 人称・数. One feature and six values rather than PERSON and NUMBER apart,
     because the engine spends a feature on the first rule that matches it: a
     language with ONE ending for "we" would otherwise be answered by the
     first-person rule and the plural rule one after the other, which is not
     what such a language does. Same argument the pluperfect settled. */
  p1s:['PERSON','1SG'], p2s:['PERSON','2SG'], p3s:['PERSON','3SG'],
  p1p:['PERSON','1PL'], p2p:['PERSON','2PL'], p3p:['PERSON','3PL']
};
/* WHAT A LABEL MEANS, and it is one question with one answer. The table above
   is the labels this app supplies; the two lines under it are the labels a
   language makes for itself, and they are here rather than in a branch beside
   gFmRules() because "what does this label mean" is one question and a second
   place answering it is a second answer.

   A class agreement rule means CLASS/<the name somebody typed>, so the engine
   can be asked for it by the class the noun is in. A label somebody wrote
   themselves (`i~…`, www/wordsheet.js § fmOwn) is its own feature under the
   name they gave it -- we do not know what kind of thing it is and must not
   guess one, 指示書 §10. */
function gFmFeat(fm){
  var i;
  if(GFM_FEAT[fm]) return GFM_FEAT[fm];
  i=nclsIndexOf(fm);
  if(i>=0) return ['CLASS', nclsName(i)];
  return [fm || 'FORM', true];
}
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
  var e=LinguaGrammarEngine, a=(STG && STG.fm) || [], inf=[], der=[], i, r, f, c, g, k, op, pos, fm;
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
      g=gFmFeat(fm);
      k.feature=g[0];
      k.value  =g[1];
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
/* AND THE BOARD'S OWN ARRANGEMENT, where this is drawn under one. The cards
   on a board are not written down until Save is pressed (g2KeepOn), so a
   demonstration read off what the LANGUAGE holds is a demonstration of an
   answer nobody has given yet: a board with three cards freshly placed on it
   showed the engine's own SOV underneath, which is the screen drawing a
   default as a choice. `bd` says which of the two boards and `seq` what is on
   it; with neither, this is the language's own order and nothing moves. */
function gLay(list, bd, seq){
  var e=LinguaGrammarEngine, m=gModel(list), pieces, out=[], i, j, id;
  if(seq && seq.length){
    /* In FRONT of the language's own, because translate.js takes the first
       rule that answers and this is the one being arranged. */
    if(bd==='np') m.grammarRules.unshift(gRule('NOUNPHRASE', 'ORDER', seq));
    else m.wordOrder=e.wordOrder(seq);
  }
  pieces=e.translate.arrange(m, gUnits(m, list));
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
   two buttons you read. The board and the sentence under it are g2Board()'s.
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
function g2Three(seq){
  var s=gWordOf('pro') || gWordOf('n'), v=gWordOf('v'), o;
  if(!s || !v) return null;
  o=gWordOf('n', s);
  if(!o) return null;
  return gLay([s, v, o], 'order', seq);
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
/* A BOARD IS FOUR THINGS, and this app has two boards. Everything else about
   one -- the ruled paper, the tray, the KEEP buffer, the Save in the corner,
   how a card is picked up and put down -- is the same act done to a different
   list, so it is written once and the two differ by these four alone. A third
   board is a line here.

   `id` is which of the two this is, and the only thing it decides is what a
   card is CALLED -- g2CardName() below. A card is a role of a sentence on one
   board and a part of a noun phrase on the other; one set of names for both
   would be the two boards saying one thing, and they are saying two.

   `stored` is WHAT THIS LANGUAGE HAS SAVED, never what it falls back to. The
   board opens from it, so a language nobody has answered opens empty -- 「最初
   から主語と動詞とかが入ってるせいでわかりにくい」 OWNER 2026-09-06 -- and the
   fallback, where there is one, is orderSeq()'s and belongs to the engine's
   side of the wall. */
function g2Bd(id){
  if(id==='np') return {id:'np', demo:g2NpDemo, stored:npStored, save:setNpOrder, cards:NPARTS};
  return {id:'order', demo:g2Demo, stored:g2Stored, save:setOrder, cards:ROLES};
}
/* Called from the view, so it runs on every render of this screen and finding
   a buffer already here leaves it exactly as it is -- somebody has been
   arranging. The list travels as a comma-joined string because a buffer holds
   strings (keepSet), and orderSeq() is what turns it back into the list. */
/* WHAT THIS LANGUAGE HAS ACTUALLY SAVED, which is what the board opens with.
   Empty is a real answer here and means nobody has arranged anything yet -- so
   the sentence line starts blank and every card is in the tray, which is what
   an exercise of this shape looks like everywhere it exists.
   「最初から主語と動詞とかが入ってるせいでわかりにくい」 OWNER 2026-09-06. */
function g2Stored(){ return orderKeep(STG && STG.order); }
function g2KeepOn(b){
  keepOn(g2KeepKey(),
         /* WHAT THIS PAGE IS HOLDING. The cards, which are not written down
            until the button is pressed and therefore live in the buffer; and
            the rows of TWO under them, which are, because g2Move() on one of
            those is a swap and setGPos() writes it where it lives. That
            second half was the fault: a side swapped changed the language
            with the corner still grey (docs/scope/r14-keep.md § A).

            All of STG.gpos and not the rows this page happens to show. The
            mark is taken as the page opens, so a side set on another screen
            is already in it and does not light this one; naming the rows
            here would be a list somebody has to remember to add to. */
         function(){ return {seq:b.stored().join(','),
                             gpos:JSON.stringify((STG && STG.gpos)||{})}; },
         /* Split before it is handed on: setOrder() takes the list of cards
            or the old six-letter string, and a comma-joined string is
            neither -- orderSeq() would read 'O,V,S,ADV' one character at a
            time and keep the three single letters. The buffer holds strings
            (keepSet); this is where it stops being one. */
         function(v, done){
           var s=v.hasOwnProperty('seq')? String(v.seq) : b.stored().join(',');
           b.save(s? s.split(',') : []);
           done(true);
         });
}
/* What is on the board NOW: what has been arranged, or what the language
   holds if nothing has been touched. One answer, off the buffer. */
function g2Seq(){
  var s=keepVal(g2KeepKey(), 'seq');
  return s? s.split(',') : [];
}
/* THE ONE ENTRANCE. The cards are not written down until the button is
   pressed, so where they stand is the buffer itself -- the same kind of thing
   a half-typed field is (www/shell.js § keepOn) -- and keepSet() is the one
   road into it. `g2KeepKey()` is `keepKey()`, which is what keepSet() writes
   under, so this is that road and not a second one. */
function g2Set(a){ keepSet('seq', a.join(',')); render(); }
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
/* A CARD IS A BOX. 「箱でいいよ」 OWNER 2026-09-06 -- two rows of bare words
   read as a heading over a second heading, and nothing about them said one
   could be picked up. `off` is the tray's, in a paler ink, because a card
   waiting to be placed and a card standing in the sentence are not the same
   thing and looked identical. www/index.html § r4-gram carries both, and
   tools/box-baseline.txt carries the corner. */
/* WHAT A CARD IS CALLED. Two lists of names because there are two boards, and
   the prefix is written out on both sides rather than handed in as a string:
   tools/i18n-check.mjs holds a key that is BUILT by finding its prefix inside
   a `t(` call, so a prefix arriving as a variable is a key nothing holds --
   thirteen of them went unheld the first time this was written that way. */
function g2CardName(bd, r){
  return (bd==='np')? t('gram.np.'+r) : t('gram.role.'+r);
}
function g2Card(bd, r, act, arg, cls){
  return '<button class="gordc'+(cls||'')+'" data-gr="'+esc(r)+'"' +
    DO(act, arg) + '>'+esc(g2CardName(bd, r))+'</button>';
}
/* THE WHOLE SCREEN, not a strip at the top of one.
   「画面そんな広いのになんで上ちょこっとでやるの？」 OWNER 2026-09-06.

   The sentence is written on RULED LINES -- the upper half of the screen, three
   of them, so a sentence that runs past one carries on to the next and the
   place to put a card is visible before there is a card in it. The line under
   this language's own words comes directly beneath them, which is where the
   sentence being built is; it used to sit under the TRAY, two rows further
   down, so the words and the cards that arranged them were not next to each
   other at all.

   The lines are drawn by the stylesheet rather than by an element each: they
   are the paper, not a list of slots, and 「枠の数は決めない」 -- a card lands
   on the end of what is there and the lines are what it is written on. */
function g2Board(c){
  var b=g2Bd(c && c.id), seq, i, on='', off='';
  g2KeepOn(b);
  seq=g2Seq();
  for(i=0;i<seq.length;i++) on+=g2Card(b.id, seq[i], 'g2Take', [i], '');
  for(i=0;i<b.cards.length;i++)
    if(seq.indexOf(b.cards[i])<0) off+=g2Card(b.id, b.cards[i], 'g2Put', [b.cards[i]], ' off');
  return '<div class="gordtop">'+
           '<div class="gordput" data-gord="on">'+on+'</div>'+
           /* THE LINE COMES OUT AFTER A CARD GOES ON, and not before.
              「文法の各段は最初は何も置かれてない状態」 OWNER 2026-09-10. An
              empty board drew this language's three words underneath it
              anyway, arranged by the engine's fallback -- so the one thing on
              the screen that says what the order IS was answering for a
              language whose board is empty. It is the same fault as the two
              lit buttons on a side row, in the one place a person actually
              reads the answer off. */
           (seq.length? b.demo(seq) : '')+
         '</div>'+
         '<div class="gordrow" data-gord="off">'+off+'</div>';
  /* THE NEGATION'S OWN ROW IS GONE FROM HERE. It was a two-choice -- before
     the verb or after it -- and a two-choice is the whole of what
     docs/GRAMMAR-V2-SPEC.md §4.4 says not to decide for anybody: it can only
     describe a language that negates with a small word beside its verb, and
     it said nothing about WHICH word. Where a word stands is one operation of
     one rule now (www/grammar.js § 否定), written on that chapter's own page
     out of two sentences somebody made, and `gpos.negp` is copied onto that
     rule rather than left to mean something on its own. */
}
/* This language's own words, in the order the board says. gLay() runs the real
   engine, so this is what a sentence would actually come out as and not a
   diagram of one -- which is why it is the demonstration and the only part
   that needs a dictionary. They are read, not moved: the cards above are what
   arranges the sentence, and a second way to do it would be a second answer to
   what the order is. */
function g2Demo(seq){
  var w=g2Three(seq), i, out='';
  if(!w) return '';
  for(i=0;i<w.length;i++) out+='<span class="gor">'+esc(wOut(w[i].hw))+'</span>';
  return '<div class="gorder">'+out+'</div>';
}
/* THE SAME DEMONSTRATION, of a noun phrase. gLay() runs the real engine on a
   sentence with no verb in it, so what comes back is the phrase alone, in the
   order the board above says -- not a diagram of one.

   WHAT IS IN IT IS WHAT THE DICTIONARY HAS. An adjective and a number where
   there are any, and the noun. The other three cards name parts that no single
   word of a dictionary is -- a possessor, a relative clause, a demonstrative --
   and the words for those are made in the chapters that are about them; the
   card here says where they WOULD stand. A language with neither an adjective
   nor a number in it yet has nothing to arrange, and draws nothing rather than
   a noun standing on its own. */
function g2NpDemo(seq){
  var n=gWordOf('n'), a=gWordOf('adj'), q=gWordOf('num'), list=[], w, i, out='';
  if(!n) return '';
  if(a) list.push(a);
  if(q) list.push(q);
  if(!list.length) return '';
  list.push(n);
  w=gLay(list, 'np', seq);
  for(i=0;i<w.length;i++) out+='<span class="gor">'+esc(wOut(w[i].hw))+'</span>';
  return '<div class="gorder">'+out+'</div>';
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

   `lab` is HTML and not text, the way secAdd()'s label is. The two callers are
   this file's own: the noun chapter's rows are a sentence of the interface with
   one word in bold (gEg above), and a form chapter's are the numerals ❶❷❸.
   Nothing anybody typed reaches it.

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
      '<span class="psm">'+lab+'</span>'+
      (add? '<span class="psw">'+sfontHTML(add)+'</span>' : '')+
      (side? '<span class="psi">'+esc(side)+'</span>' : '')+
      ((to || side)? '<span class="psi">'+esc(to)+'</span>' : '')+
      '</button></div>';
  }
  return '<div class="fmmk">'+
    '<button class="stslot has"' + DO(act, arg) + '>'+
    '<span class="psm">'+lab+'</span>'+
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
  /* A target's page has one rule on it and no list, so there is nothing to
     choose; the `?` is the chapter's own. */
  if(c && c.on) return helpQ('g2.'+String(c.id).split(':')[0]);
  if(G2SEL)
    return (g2SelList().length? navDel(t('fmr.sel.del'), 'g2SelDel') : '')+
      navDo(t('fmr.sel.done'), 'g2SelOff', null, true);
  if(c && c.fms && g2SecRules(c).length && !langLocked())
    return navDo(t('fmr.sel'), 'g2SelOn', null, true);
  return helpQ('g2.'+c.id);
}
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
/* WHAT A ROW OF THIS CHAPTER IS CALLED, and not one word of grammar in it.
   「名詞の主語という記載…何それ？になるのを無くしたい」「格の渡すとか言われても
   全く分かりません」 OWNER 2026-09-06. The rows said 主語 / 目的語 / 渡す相手,
   which are the names of the three roles a mark takes a word out of the queue
   for -- true, and the kind of word somebody has to have been taught before it
   says anything at all.

   So a row is a SENTENCE of the interface language with the word in question in
   bold: 「<b>私は</b>山を見る」. Nobody has to know what a subject is called to
   see which word is meant. It is the interface's own line and never this
   language's, which is why it is a translated string rather than anything the
   dictionary makes -- a language with no verb in it yet still has to be able to
   read the row.

   The 助詞 stage's own list still says 主語 / 目的語 / 渡す相手 (stg.part.*), and
   that is not one fact said twice: there a row NAMES the mark being made, here
   it SHOWS where the mark would stand. */
function gEg(k){ return t('gram.eg.'+k); }
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
        '<span class="psm">'+gEg(k)+'</span>'+
        '<span class="psn">'+t('stg.make')+'</span>'+ICON_GO+'</button>';
      continue;
    }
    made=m? g2MadeBy(m, 'slot', k) : '';
    out+=g2Row(gEg(k), '', '', made? wOut(n.hw) : '',
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
   on the dictionary; only the phrase that demonstrates it can.

   AND NEITHER OF THEM UNTIL SOMEBODY HAS ANSWERED. 「文法の各段は最初は何も
   置かれてない状態」 OWNER 2026-09-10. gPos() answers GPOS_DEF for a side
   nobody has touched, so both roads here were drawing the app's own default as
   the answer this language gave: the pair of names lit 「名詞の後」, and the
   two words -- which say which side by the order they stand in -- stood in it.
   A person who has said nothing was being shown having said something.

   gPosSaid() is the question and it is asked in one place, above. The engine
   goes on falling back -- gRules() hands it gPos() exactly as before, so a
   sentence still comes out -- and what changes is only what this page CLAIMS
   about who answered it. */
function g2Side(key, w, n){
  var laid, i, out='';
  if(!w || !n || !gPosSaid(key)) return g2SidePick(key);
  laid=gLay([w, n]);
  for(i=0;i<laid.length;i++) out+=g2Chip(key, i, laid[i]);
  return '<div class="segs">'+out+'</div>';
}
function g2SidePick(key){
  var a=['before','after'], i, now=gPosSaid(key)? gPos(key) : '', out='';
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

/* A HEADING OVER A DECISION, and it is the same `.sec` every chapter of this
   page already puts over its words and its table. A chapter that takes three
   answers has to say which of the three each row is; that is a label, not an
   explanation, and it is written once here rather than three times below. */
function g2Sec(k){ return '<div class="sec">'+esc(t(k))+'</div>'; }
/* §複文. 「従属節（〜とき／〜ので／〜なら／〜と言う）の位置と印、関係節
   （「私が見た山」）の位置と印、並列（と／か／しかし）」 OWNER 2026-09-07.

   Three answers and no words. That is deliberate on both counts.

   THE WORDS ARE THE 接続詞 CHAPTER'S. 「印の語は章の語の欄（接続詞の章と一本化：
   二つの場所に同じ語を置かない）」 -- so 〜ので and 〜なら and 〜と are made
   where every other conjunction of this language is made, and the word for a
   relative clause is one more slot on that same stage. Drawing them here as
   well would be one list saying 接続詞 twice, which is what took seven stages
   off this page on 2026-09-06.

   AND THE POSITION OF A RELATIVE CLAUSE IS NOT HERE EITHER. It is the REL card
   on the noun-phrase board, because that is where a language says what stands
   in front of its nouns. What is left for this chapter is the MARK.

   IT IS A PAIR OF LABELLED BUTTONS AND NOT A PAIR OF WORDS. The 形容詞 and 場所
   chapters replaced their buttons with the two words themselves -- 「単に
   before / after だけにしない」 -- because there were two words of this
   language to move. A clause is not a word: there is nothing to pick up, so
   the honest shape is the two answers, named.

   並列 -- と / か / しかし -- has nothing to decide. A word that joins two
   things stands between them in every language anybody has written down, and
   the words themselves are the 接続詞 chapter's. The lines that show it are
   this chapter's 例文, which is what every chapter of this page ends with. */
/* §冠詞・指示詞. The four words and nothing else: where one of them stands is
   the DEM card on the noun-phrase board, and a second answer here would be the
   two chapters disagreeing the first time somebody changed one of them.

   www/phases.js § CHAP_SLOTS holds the slots, and stSlotRow() draws them --
   the same row the 否定形 and 場所 chapters draw their words with, so a word
   made here looks and behaves exactly as one made anywhere else. */
function g2Det(){ return chapSlotsHTML('det'); }
/* §コピュラ・存在. The two words, and nothing else: where a copula stands is
   the CMP card on the word order board -- 「〜です」 is heard between the
   subject and what it is, and that is a place in a sentence, which is what
   that board is for. */
/* AND THE TWO THINGS A LANGUAGE SAYS NO ABOUT AND ASKS ABOUT HERE: 名詞の文
   and 存在. 「名詞の文と存在→文の章の「です／ある」の節」 OWNER 2026-09-11 --
   both are sentences built on this word, so this is the page they are written
   on. Each heading is the target's name, because the two rows under it are 否定
   and 疑問. */
function g2Cop(){
  return chapSlotsHTML('cop')+g2PolAt('n')+g2PolAt('ex');
}
function g2Cx(){
  return g2Sec('g2.cx.sub')+g2SidePick('cx')+
         g2Sec('g2.cx.mark')+g2SidePick('cxm')+
         g2Sec('g2.cx.rel')+g2SidePick('relm');
}

/* ====================================================================
   §4.4 否定 と §4.5 疑問 ── 文を二つ作り、その差が規則になる
   docs/GRAMMAR-V2-SPEC.md §4.4「「私は食べる」を作ってもらい、次に「私は
   食べない」を作ってもらう。mi luma / mi na luma なら NEGATION /
   operation:PREFIX / form:na として保存。**ただし「必ず PREFIX になる」と
   決めつけない。**」 §4.5 は同じことを疑問について言い、方法として suffix /
   prefix / 別の語 / 語順 / 助詞 / 組み合わせ を挙げる。
   OWNER 2026-09-10「否定は結構細かく作れるようにして」

   WHAT WAS HERE. 否定形 and 疑問形 were two of the twenty-four FORM chapters
   -- a list of fmr rules and a ＋ that writes another -- plus one row on the
   word order board asking whether the not-word stands before or after the
   verb. Three things that spec asks for had nowhere to be said:

     the word itself as the rule    `gpos.negp` said WHERE it stands and
                                    nothing said that a word IS the negation
     what is being negated          a verb sentence, a noun sentence
                                    (「〜ではない」), a command (「〜するな」)
                                    and existence (「〜が無い」) are four
                                    different rules in most languages
     the two together               ne … pas is one rule and was unsayable

   WHAT IT IS NOW. A chapter is the four things that can be negated (or
   asked), each a row, each its own page -- 選ぶ画面と変える画面を分ける. On
   that page somebody writes the plain sentence and then the negative one, in
   their own words, by placing them; this reads the difference and writes it
   down as a Rule of §5's shape. 「文は人が作る」.

   NOTHING IS GUESSED ABOUT THE LANGUAGE. §10「Lingua が『luma → luma-ka
   だからこれは過去形ですね』と勝手に確定する設計にはしない」-- what is read
   off the two sentences is the OPERATION (these letters went on the front,
   this word stands here), never what it means: the person already said what
   it means by walking into 否定形 and standing on 動詞の文. And nothing is
   written until the save in the corner is pressed, which is this app's own
   「承認」 and is the same save every other screen has.

   WHERE IT IS KEPT. `STG.gr`, one rule per (feature, target), in the shape
   §5 asks for -- `type` `feature` `target` `operation` `form`. A COMBINATION
   is one rule whose `parts` are the operations it is made of, which is what
   「組み合わせも一つの規則として持てる」 says. The two sentences ride on the
   rule as `eg`, because §14 draws them (「Positive: mi luma / Negative: mi na
   luma」) and a second place to keep them would be a second answer to what
   the rule's example is.

   AND WHICH RULE APPLIES IS THE ENGINE'S. 「無ければ動詞の文のものを使う、
   とエンジンが判断。画面は説明しない」 -- polarRules() in
   www/grammar-engine/translate.js falls back to the verb sentence's rule, so
   no screen here says anything about it and no row is drawn for a language
   that has answered once. */
/* Which chapter is about which feature. The two ids are the ones those
   chapters already had (G2FM_CHAPS), so nothing anybody has bookmarked or
   walked changes name. */
/* IN ORDER, because the two are drawn as a pair on the command's page and on
   です／ある -- g2PolAt() below -- and a table read with `for in` is a pair
   whose order is whatever the engine feels like. */
var GPOL_FEAT=[{id:'neg', f:'NEGATION'}, {id:'q', f:'QUESTION'}];
/* WHAT IS BEING NEGATED OR ASKED. Four, in the order the owner named them,
   and the first is the one the others fall back to. */
var GPOL_ON=['v','n','imp','ex'];
var GPOL_TARGET={v:'VERB', n:'NOUN', imp:'IMPERATIVE', ex:'EXISTENTIAL'};
/* A page of one target is `neg:v`, so the chapter is read off the front of
   it: one id, split in the one place that has to know it is two. */
function gPolFeat(id){
  var s=String(id||'').split(':')[0], i;
  for(i=0;i<GPOL_FEAT.length;i++) if(GPOL_FEAT[i].id===s) return GPOL_FEAT[i].f;
  return '';
}
function gPolTarget(on){ return GPOL_TARGET[String(on||'')] || 'VERB'; }
/* Every rule of this kind this language has written, and the one for one
   target. `STG.gr` is a flat list because that is what goes up as JSON; which
   rule is which is the two fields on it. The old two-choice is one of them
   until somebody writes over it -- §16 Migration, gPolOld() below. */
function gPolAll(){
  var a=(STG && STG.gr) || [], old=gPolOld(a);
  return old? a.concat([old]) : a;
}
function gPolFind(feature, target){
  var a=gPolAll(), i;
  for(i=0;i<a.length;i++)
    if(a[i] && a[i].feature===feature && a[i].target===target) return a[i];
  return null;
}
/* ONE RULE PER TARGET, and that is not a limit on what a language may do: a
   rule carries its `parts`, so 「語＋接辞」 and 「ne … pas」 are one rule with
   two operations in it. Two rules for one target would be two answers to
   「how does this language say no about a verb」 with nothing to say which
   happens. */
function gPolPut(feature, target, r){
  var a, i, old;
  if(!STG.gr) STG.gr=[];
  a=STG.gr;
  /* §16 Migration, the other half: the copy goes DOWN here, on the one road a
     rule is written, and never on a read. Both lines are one act -- the copy
     into the list, and the mark saying it has been made. Putting the copy
     down without the mark is not enough and was watched failing: a person
     emptying the two sentences and pressing save (「この言語はそれをしない」)
     takes the copy straight back out again, and an empty list is what an
     untouched language looks like, so the next read said it again. */
  old=gPolOld(a);
  if(old){ a.push(old); STG.grm='1'; }
  for(i=0;i<a.length;i++)
    if(a[i] && a[i].feature===feature && a[i].target===target){
      if(r) a[i]=r; else a.splice(i,1);
      saveStg(); return;
    }
  if(r) a.push(r);
  saveStg();
}
/* ---- §16 Migration -- 読むときに写す ------------------------------------
   「既存の `gpos.neg` は読んで規則に写す。消さない」

   `STG.gpos.negp` said which side of the verb the not-word stands, and the
   word itself is a slot on this chapter. Between them they are exactly one
   rule of the new shape -- NEGATION, of a verb sentence, said with a WORD,
   standing before or after the verb -- so that is what this ANSWERS. The
   settings and `STG.gpos` are READ and left exactly where they are
   (docs/DATA_SAFETY.md rule 2): nothing here removes anything.

   IT IS READ HERE AND WRITTEN WHERE A PERSON SAVES. It used to be a pass --
   migrateNeg(), called from stRead() -- which wrote the rule and the mark
   together. A pass that writes has to run somewhere, and where it ran was
   EVERY READ of this slice: so a LAUNCH wrote the phases slice and sent it
   up (the whole body read back down with it, against r10-wire), and a save
   that did NOT land moved the phone anyway, because keepBack() puts the
   phone back by reading it again. Both were measured rather than read off
   the code: docs/scope/r16-fix.md.

   So the copy is READ here and put DOWN in gPolPut(), the one place a rule is
   written. Reading writes nothing at all.

   THE MARK STAYS AND IT IS WRITTEN WITH THE COPY. `STG.grm` says the copy has
   been made, and it is in `phases` -- the slice it is a mark ABOUT -- because
   the fault rule 22 records is `SET.gramLang`, a mark on the DISK about a
   slice held in MEMORY, so the copy died with the app and the mark outlived
   it. It cannot be dropped for the absence of a rule: a person emptying the
   two sentences and pressing save takes the copy back out of the list, and an
   empty list is exactly what an untouched language looks like -- so without
   the mark a rule somebody DELETED comes back on the next read. That was
   watched going red.

   IT NEEDS THE DICTIONARY AND THE STAGES, and simply answers nothing without
   them. The not-word is found through a stage, and at boot each file reads
   its own slice in index.html's order -- so the first reads of the app's life
   have neither. Nothing is marked and nothing is lost by that: the next read,
   with the words there, answers. */
function gPolOld(have){
  var w, r, i;
  if(!STG || STG.grm) return null;
  for(i=0;i<have.length;i++)
    if(have[i] && have[i].feature==='NEGATION' && have[i].target==='VERB') return null;
  if(typeof STAGES==='undefined' || !STAGES) return null;
  w=(typeof gSlot==='function')? gSlot('neg','not') : null;
  if(!w) return null;
  r=gPolRule('NEGATION', 'VERB',
             [{operation:'word', form:String(w.hw||''),
               at:(gPos('negp')==='before'? 'before' : 'after')}], null);
  /* THE SAME RULE EVERY TIME IT IS READ. gPolRule() mints an id off the clock
     because a rule somebody writes is made once; this one is made on every
     read, and a fresh id each time would be a different rule each time to
     anything holding on to one. It says where it came from instead. */
  if(r) r.id='gr-negp';
  return r;
}
/* A RULE, in the shape §5 asks for. One operation is written flat -- `type`
   `feature` `target` `operation` `form` -- and more than one becomes `parts`
   under `operation:'combine'`, which is the same list read the same way by
   the engine. `eg` is the two sentences it was read off. */
function gPolRule(feature, target, ops, eg){
  var r={id:'gr'+String(new Date().getTime())+String(Math.floor(Math.random()*1000)),
         type:'inflection', feature:feature, target:target,
         operation:'', form:'', at:'', parts:[], eg:eg||null};
  if(!ops || !ops.length) return null;
  if(ops.length===1){
    r.operation=ops[0].operation; r.form=ops[0].form||''; r.at=ops[0].at||'';
    return r;
  }
  r.operation='combine'; r.parts=ops;
  return r;
}
/* The operations a rule is made of, however it was written down. One place,
   because the sentence on the screen and the rules handed to the engine are
   two readings of one rule and the second was already drifting when this was
   two lines apart. */
function gPolOps(r){
  if(!r) return [];
  if(r.operation==='combine') return r.parts||[];
  return [{operation:r.operation, form:r.form, at:r.at}];
}
/* Whether this language has written anything of this kind, which is what the
   contents page draws a chapter faint until. */
function gPolSaidAny(feature){
  var a=gPolAll(), i;
  for(i=0;i<a.length;i++) if(a[i] && a[i].feature===feature) return true;
  return false;
}
/* WHICH SIDE OF THE VERB THE NEGATION WORD STANDS, for the sentence READER.
   translate.js arranges a sentence somebody typed by this, and it is one
   operation of one rule rather than an answer of its own -- a language that
   negates with an ending has no word to place and the reader is untouched. */
function gNegSide(){
  var ops=gPolOps(gPolFind('NEGATION', 'VERB')), i;
  for(i=0;i<ops.length;i++)
    if(ops[i].operation==='word')
      return (ops[i].at==='before' || ops[i].at==='head')? 'before' : 'after';
  return 'after';
}

/* ---- what changed between the two sentences ----------------------------
   The operations, and ONLY the operations. 「差分から規則を出す」 -- these
   letters went on the front of the verb, this word stands here, the words
   came out in another order -- and never what any of it MEANS: the person
   said that by standing on 否定形 and on 動詞の文 before they wrote a word.
   指示書 §10.

   A token of the second sentence is one of three things: one that was in the
   first (nothing happened to it), one that is a word of the first with
   letters on it (an affix), or one that was not there at all (a word). Read
   in that order, because a word of this language that happens to end in
   another word of it is still a word somebody placed. */
function gPolWordAt(list){
  var i, w;
  for(i=0;i<list.length;i++){
    w=(typeof findWord==='function')? findWord(list[i]) : null;
    if(w && String(w.pos)==='v') return i;
  }
  return -1;
}
/* Which word of the first sentence this token was made out of, and which end
   the letters went on. The LONGEST match, so a language whose word for 「I」
   is one letter does not have every token read as that letter plus an
   ending. */
function gPolStem(tok, left){
  var best=-1, at='', add='', i, y;
  for(i=0;i<left.length;i++){
    y=String(left[i]||'');
    if(!y || y.length>=tok.length) continue;
    if(tok.slice(0, y.length)===y && y.length>best){ best=y.length; at='end'; add=tok.slice(y.length); }
    if(tok.slice(tok.length-y.length)===y && y.length>best){ best=y.length; at='start'; add=tok.slice(0, tok.length-y.length); }
  }
  return {at:at, add:add, n:best};
}
/* Where a word that was not in the first sentence stands. Beside the verb
   first, because that is the more exact thing to say about it and the two are
   the same picture in a sentence of two words; then the ends of the sentence,
   which is what a language that puts the word there is doing.

   `v` is where the verb stands IN THE SECOND SENTENCE and is handed in rather
   than looked up here: a verb with an ending on it is not a word of the
   dictionary, so asking the dictionary at this point found no verb at all and
   every word of 「私 ない 食べない」 read as standing at the end. */
function gPolWhereAt(b, i, v){
  if(v>=0 && i===v-1) return 'before';
  if(v>=0 && i===v+1) return 'after';
  if(i===0) return 'head';
  if(i===b.length-1) return 'tail';
  return (v>=0 && i<v)? 'before' : 'after';
}
/* The roles of the first sentence, read out in the order the SECOND puts
   them. §4.5 「語順」 -- a language that asks by moving the verb to the front
   says so here and nowhere else. The roles are the first sentence's because
   that is where they were decided: the first thing that is not the verb is
   what the sentence is about, the second is what it is about it, which is the
   same queue translate.js reads a typed sentence with. */
function gPolRoleOf(a){
  var role={}, n=0, i, w, p;
  for(i=0;i<a.length;i++){
    w=(typeof findWord==='function')? findWord(a[i]) : null;
    p=w? String(w.pos) : '';
    if(p==='v'){ role[a[i]]='VERB'; continue; }
    role[a[i]]=n? 'OBJECT' : 'SUBJECT'; n++;
  }
  return role;
}
function gPolOrderOf(a, b){
  var role=gPolRoleOf(a), out=[], i, r;
  for(i=0;i<b.length;i++){ r=role[b[i]]; if(r && out.indexOf(r)<0) out.push(r); }
  return out.join(',');
}
/* TWO PASSES, and the first one is where the second could not start. What
   each word of the second sentence CAME FROM has to be settled for all of them
   before any of them can be placed, because where a word stands is said
   against the verb -- and the verb may be one of the words that changed. */
function gPolDiff(a, b){
  var left=[], src=[], made=[], ops=[], i, j, tok, s, v=-1, av;
  for(i=0;i<a.length;i++) left.push(String(a[i]));
  for(i=0;i<b.length;i++){
    tok=String(b[i]); src.push(''); made.push(null);
    j=left.indexOf(tok);
    if(j>=0){ src[i]=left[j]; left.splice(j, 1); continue; }
    s=gPolStem(tok, left);
    if(s.at && s.add){ j=gPolLeftAt(left, tok, s); src[i]=left[j]; made[i]=s; left.splice(j, 1); }
  }
  /* The verb of the first sentence, wherever it ended up in the second. */
  j=gPolWordAt(a); av=(j>=0)? String(a[j]) : '';
  if(av) for(i=0;i<b.length;i++) if(src[i]===av){ v=i; break; }
  if(v<0) v=gPolWordAt(b);
  for(i=0;i<b.length;i++){
    if(made[i]) ops.push({operation:(made[i].at==='start'? 'prefix' : 'suffix'),
                          form:made[i].add, at:''});
    else if(!src[i]) ops.push({operation:'word', form:String(b[i]),
                               at:gPolWhereAt(b, i, v)});
  }
  /* Nothing was added and nothing was left over: the same words, and the only
     thing that can have happened is that they came out in another order. */
  if(!ops.length && !left.length && a.length===b.length && a.join(' ')!==b.join(' '))
    ops.push({operation:'order', form:gPolOrderOf(a, b), at:''});
  return ops;
}
/* Which of the words left over gPolStem() matched, so that it is spent and a
   second token cannot be read as the same word again. */
function gPolLeftAt(left, tok, s){
  var i, y;
  for(i=0;i<left.length;i++){
    y=String(left[i]||'');
    if(y.length!==s.n) continue;
    if(s.at==='end' && tok.slice(0, y.length)===y) return i;
    if(s.at==='start' && tok.slice(tok.length-y.length)===y) return i;
  }
  return 0;
}
/* ---- the rule, said in words -------------------------------------------
   One line of a grammar book, which is what §14 draws: 「Rule: NEGATION =
   PREFIX "na"」. The letters are somebody's own, so they go through
   sfontHTML() the way every other rule sentence on this page does. */
function gPolSayOne(op){
  var f=(typeof sfontHTML==='function')? sfontHTML(String(op.form||'')) : esc(String(op.form||''));
  if(op.operation==='prefix') return t('g2.rule.start', esc(posLabel('v')), f);
  if(op.operation==='suffix') return t('g2.rule.end', esc(posLabel('v')), f);
  if(op.operation==='order') return t('g2.pol.order', esc(gPolOrderSay(op.form)));
  return t('g2.pol.at.'+(op.at||'after'), f);
}
function gPolSay(ops){
  var out=[], i;
  for(i=0;i<ops.length;i++) out.push(gPolSayOne(ops[i]));
  return out.join(t('g2.pol.and'));
}
/* A word order, as the cards the 語順 board calls them. One table, and it is
   the board's own names: a second list of words for SUBJECT here would be the
   two chapters calling one thing two things. */
function gPolOrderSay(form){
  var a=String(form||'').split(','), out=[], i, k={SUBJECT:'S', OBJECT:'O', VERB:'V'};
  for(i=0;i<a.length;i++) if(k[a[i]]) out.push(t('gram.role.'+k[a[i]]));
  return out.join(' ');
}

/* ---- 否定 and 疑問, on the section each belongs to ----------------------
   「今の「否定形」の頁（動詞の文／名詞の文／命令／存在の 4 行を選ぶ頁）は消す。
   4 つの対象頁はそれぞれ属する節から開く：動詞の文→動詞の章の「否定」、命令→
   動詞の章の命令の節（の中に否定）、名詞と存在→文の章の「です／ある」の節。
   疑問も同じ形」 OWNER 2026-09-11.

   There was a page in front of the four whose whole job was to ask which of
   them you meant, and a grammar book does not have one: a command's negation
   is written on the page about commands. So the four rows are gone and the
   rows are where the thing being negated already is -- 動詞の文 is the section
   the verb chapter names (www/phases.js § G2BOOK), and the other three are
   drawn here, on the page of the section they belong to.

   ONE ROW SAYS WHAT IT IS AND THE HEADING SAYS WHAT IT IS ABOUT. The row's
   name is the chapter's -- 否定形 / 疑問形 -- and the heading over the pair is
   the KIND OF SENTENCE being negated: 名詞の文, 存在, 命令. です／ある carries
   two of those kinds, so the heading is what tells the two pairs apart; 命令形
   carries one, and the heading is what stops the pair reading as two more of
   the rules above it, which is what they looked like without one. */
function g2PolAt(on){
  var out='', i, c;
  /* Nothing at all for a page that is not one of the four things a language
     says no about, which is every other chapter that draws a form. */
  if(!GPOL_TARGET[String(on||'')]) return '';
  for(i=0;i<GPOL_FEAT.length;i++){
    c=g2ChapBy(GPOL_FEAT[i].id+':'+on);
    if(c) out+=g2PolRow(c, on);
  }
  return out? g2Sec('g2.on.'+on)+out : '';
}
function g2PolRow(c, on){
  var r=gPolFind(gPolFeat(c.id), gPolTarget(on)), ops=gPolOps(r),
      letters=[], says=[], i;
  for(i=0;i<ops.length;i++){
    if(ops[i].operation==='order') says.push(gPolOrderSay(ops[i].form));
    else if(ops[i].form) letters.push(String(ops[i].form));
  }
  /* `.stslot` and no `.fmmk` round it: the wrapper is what a row that can be
     CHOSEN wears (the ◉ beside it, www/grammar.js § g2Row), and both of them
     carry a line underneath -- so a row that cannot be chosen and wears both
     is drawn with two. The words a chapter asks for are `.stslot` on the same
     screen, which is the list these have to be one height with. */
  return '<button class="stslot has"' + DO('go', ['gram', 'v2:'+c.id]) + '>'+
    '<span class="psm">'+esc(c.nm)+'</span>'+
    (letters.length? '<span class="psw">'+sfontHTML(letters.join(' '))+'</span>' : '')+
    '<span class="psi">'+esc(says.length? says.join(' ') : (r? '' : '—'))+'</span>'+
    ICON_GO+'</button>';
}
/* WHAT BELONGS TO THE CHAPTER RATHER THAN TO ONE TARGET, and it is on the
   FIRST target because that is the one the other three fall back to
   (polarRules() in www/grammar-engine/translate.js). 否定 and 疑問 had a page
   of their own until the four rows went, and it carried three things besides
   them: the word the chapter asks for (「〜ない」, the six question words), the
   rules an older build left on it, and the lines written for it. A page that
   stopped drawing those would be the app quietly holding what somebody wrote
   and never showing it to them again -- docs/DATA_SAFETY.md. */
function g2PolChap(c){
  var head=String(c.id).split(':')[0], old=g2FmRows(c.fms[0], c.pos);
  return chapSlotsHTML(head)+
    (old? g2Sec('stg.rules')+old+g2FmTable(c) : '')+
    g2ChapEx(head);
}
/* ---- the page where one rule is written --------------------------------
   Where somebody is standing while they write the two sentences, which is not
   the language until the save in the corner is pressed -- the same as the
   word order board and for the same reason: a rule changing while somebody is
   still deciding is the app answering for them. It is a page's own state and
   is never stored. */
var G2POL={at:'', a:[], b:[]};
function gPolEgList(r, which){
  var e=(r && r.eg)? r.eg[which] : null, out=[], i;
  if(!e || !e.length) return out;
  for(i=0;i<e.length;i++) out.push(String(e[i]));
  return out;
}
/* Arriving. The lines open as the rule's own two sentences, so a rule already
   written is opened rather than started again, and the buffer is thrown away
   with them: the Save is grey until these two differ from what is stored, and
   a buffer left behind by the last target would be what this one compared
   against. */
function g2PolOpen(c, r){
  var key=String(c.id);
  if(G2POL.at!==key){
    G2POL={at:key, a:gPolEgList(r, 'a'), b:gPolEgList(r, 'b')};
    keepDrop(keepKey());
  }
  keepOn(keepKey(),
         function(){ return {a:G2POL.a.join(','), b:G2POL.b.join(',')}; },
         function(v, done){ g2PolSaveGo(c); done(true); });
}
function g2PolPage(c){
  var r=gPolFind(gPolFeat(c.id), gPolTarget(c.on)), ops, head=String(c.id).split(':')[0];
  g2PolOpen(c, r);
  ops=gPolDiff(G2POL.a, G2POL.b);
  return secAdd(esc(t('g2.'+head+'.a')), DO('openPolWord', ['a']), t('g2.pol.pick'))+
         g2PolLine('a')+
         secAdd(esc(t('g2.'+head+'.b')), DO('openPolWord', ['b']), t('g2.pol.pick'))+
         g2PolLine('b')+
         (ops.length? g2Sec('stg.rules')+'<div class="note">'+gPolSay(ops)+'</div>' : '')+
         ((c.on===GPOL_ON[0])? g2PolChap(c) : '');
}
/* One line, as the words standing in it. A card is pressed to take it out
   again, which is the board's own two presses and not a second way of moving
   a word. */
function g2PolLine(which){
  var a=G2POL[(which==='b')? 'b' : 'a'], out='', i;
  for(i=0;i<a.length;i++)
    out+='<button class="gordc"' + DO('g2PolTake', [which, i]) + '>'+
      sfontHTML(wOut(a[i]))+'</button>';
  return '<div class="gordrow" data-gpol="'+esc(which)+'">'+out+'</div>';
}
function g2PolTake(which, i){
  var a=G2POL[(which==='b')? 'b' : 'a'];
  if(!a || i<0 || i>=a.length) return;
  a.splice(i, 1); render();
}
function g2PolAdd(which, w){
  var s=String(w||'').replace(/^\s+|\s+$/g, '');
  if(typeof puaRoman==='function') s=puaRoman(s);
  if(!s) return;
  G2POL[(which==='b')? 'b' : 'a'].push(s);
}
/* ---- the word that goes in, chosen on a screen of its own ---------------
   Every word this language has, and a field for one it has not: the form a
   rule MAKES is usually not a word of the dictionary -- 「食べない」 is the
   thing being described, not an entry -- so a line that could only be built
   out of the dictionary could not show a suffix at all. */
/* `open*` and not `g2Pol*`: a FORM is what that prefix is for (CLAUDE.md §
   Names), and it is also how the walks find one -- act-check asks the page for
   every global named open + a capital, so a form under any other name is a
   screen nothing ever renders and every string on it could stay hard-coded
   forever. */
function openPolWord(which){
  openForm('gpol:'+which, t('g2.pol.pick'), g2PolPickHTML(which));
}
/* A form is a ROUTE, so the way back into it is registered -- somebody who
   left the app standing on this screen arrives back on it. Asked for rather
   than assumed, the same as g2HelpReg() below: this file is also read on its
   own by tools/grammar-engine-check.mjs, where there is no screen and no
   FORM_OPEN to register with. */
if(typeof FORM_OPEN!=='undefined') FORM_OPEN.gpol=function(x){ openPolWord(x); };
function g2PolPickHTML(which){
  var a=(typeof wordsSeen==='function')? wordsSeen() : [], out='', i;
  out='<div class="field">'+
    lnField('gpol-w', '', KD('g2PolOwn', [which])+
      ' aria-label="'+esc(t('g2.pol.own'))+'" autocapitalize="none"', '',
      (typeof myFontOn==='function' && myFontOn())? 'tfont' : '')+'</div>';
  for(i=0;i<a.length;i++)
    out+='<button class="stslot has"' + DO('g2PolPutW', [which, a[i].hw]) + '>'+
      '<span class="psm">'+sfontHTML(wOut(a[i].hw))+'</span>'+
      '<span class="psi">'+esc(wMn(a[i]))+'</span>'+ICON_GO+'</button>';
  return out;
}
function g2PolPutW(which, hw){ g2PolAdd(which, hw); back(); }
function g2PolOwn(which){
  var e=document.getElementById('gpol-w');
  if(!e || !e.value) return;
  g2PolAdd(which, e.value);
  back();
}
/* The save, which is the whole of 「承認」: what is written down is the
   difference between the two sentences, read once, here. Two sentences with
   no difference between them write NO rule -- and take away the one this
   target had, because emptying the lines and pressing save is somebody
   saying this language does not do that. */
function g2PolSaveGo(c){
  var f=gPolFeat(c.id), tgt=gPolTarget(c.on), ops=gPolDiff(G2POL.a, G2POL.b);
  gPolPut(f, tgt, gPolRule(f, tgt, ops, {a:G2POL.a.slice(0), b:G2POL.b.slice(0)}));
}


/* ====================================================================
   §性・名詞クラス
   「無し／2 つ／3 つ…、名前は自由、語ごとにどれか、形容詞・動詞への一致
   （あれば）」 OWNER 2026-09-07.

   A CLASS HAS NO MEANING THIS APP KNOWS. 「名前は自由」 -- masculine and
   feminine, animate and inanimate, or the nine of a Bantu language named after
   whatever their maker likes. So the app stores the NAME somebody typed and
   never a code of its own: a table of genders here would be this app deciding
   what kinds of noun there are, which is 指示書 §10.

   Three things, and the third is the one that makes a translation possible:

     the classes      names, as many as this language has, none to begin with
     which noun       every noun of this language, one class or none
     the agreement    a rule per class, written with the same rule editor
                      every other rule in this app is written with

   THE AGREEMENT RULE IS AN ORDINARY RULE. Its `fm` is `ncls~<i>`, and that is
   not a second kind of rule: gFmFeat() below is the one place that says what a
   label MEANS, and it answers CLASS/<the name> for these exactly as it answers
   TENSE/PAST for `pst`. So `STG.fm` holds it, the rule editor writes it, and
   gFmRules() hands it to the engine, with nothing new stored and no second
   editor. Its part of speech is left empty -- any word -- because a language
   may agree on its adjectives, on its verbs, or on both, and asking which
   before there is a rule is a question nobody can answer yet.

   RENAMING IS HERE AND SO IS DELETING. 「なしじゃなくて消して」 OWNER
   2026-09-09. Three things go with a class -- its name, the record on every
   noun that was in it, and its agreement rules -- and the record is REMOVED
   rather than set to なし, because なし is an answer somebody can give and
   「this class is gone」 is not the same fact.

   THE NUMBER IS NOT REUSED AND THE GAP IS NOT CLOSED. A rule wears
   `ncls~<i>` and a noun holds `<i>`, so closing the gap would re-point every
   class after the one deleted: one press, and two classes nobody touched
   would mean something else. The slot is emptied and stays empty, and
   nclsLive() below is the one place that says which numbers a language
   actually has. docs/CHANGELOG.md 2026-09-09 carries the DELETE REVIEW. */
function nclsAll(){ return (STG && STG.ncls && STG.ncls.names) || []; }
/* A slot a class was deleted out of is EMPTY, and it may come back as either
   of the two ways an empty slot is written: '' from nclsDelGo() below, and
   null from a hole that has been through JSON. Both read as no name, which is
   the one thing a live class can never have -- nclsSave() refuses one. */
function nclsName(i){
  var a=nclsAll(), v=a[i];
  return (v===undefined || v===null)? '' : String(v);
}
/* WHICH CLASSES THIS LANGUAGE HAS, as the numbers they are filed under. The
   numbers are the language's own -- a rule says `ncls~2` and a noun says 2 --
   so a list of classes is a list of NUMBERS and never a re-indexed copy.
   Every list that draws them asks here: the chapter, the chips on a noun, the
   rules handed to the engine, and whether the chapter has been written in. */
function nclsLive(){
  var a=nclsAll(), out=[], i;
  for(i=0;i<a.length;i++) if(nclsName(i)) out.push(i);
  return out;
}
/* Which class a word is in, by the headword -- which is what the dictionary
   files a word under and what everything else in this app points at a word
   with (adapter.idOf). A word renamed loses its class, the same way a rule
   naming that word loses it, and for the same reason: nothing here is a copy
   of the dictionary. */
function nclsOf(hw){
  var m=(STG && STG.ncls && STG.ncls.of) || {}, v=m[String(hw)];
  return (v===undefined || v===null)? -1 : Number(v);
}
function nclsPut(hw, i){
  if(!STG.ncls) STG.ncls={names:[], of:{}};
  if(!STG.ncls.of) STG.ncls.of={};
  if(i<0) delete STG.ncls.of[String(hw)];
  else STG.ncls.of[String(hw)]=Number(i);
  saveStg();
  render();
}
/* The `fm` label an agreement rule of this class wears. One place, because
   www/wordsheet.js's fmLabel() reads it back to name the rule. */
function nclsFm(i){ return 'ncls~'+String(i); }
/* Every word of this language in one class, as the engine's own word ids.
   Read off the dictionary on every call rather than stored beside it, for the
   reason gRules() and gInfl() are: a stored copy of something that points at
   the dictionary parts company with it the first time somebody renames a
   word. */
function nclsWordIds(i){
  var e=LinguaGrammarEngine, out=[], j;
  for(j=0;j<WORDS.length;j++)
    if(nclsOf(WORDS[j].hw)===Number(i)) out.push(e.adapter.idOf(WORDS[j]));
  return out;
}
function nclsIndexOf(fm){
  var s=String(fm||'');
  return (s.slice(0,5)==='ncls~')? Number(s.slice(5)) : -1;
}
/* Making one, and naming one. Both are the same form: a class is a NAME and
   nothing else, so there is one field and the way in decides whether it is
   added or written over. */
function nclsNew(){ nclsForm(-1); }
function nclsOpen(i){ nclsForm(Number(i)); }
function nclsForm(i){
  openForm((i<0? 'ncls:' : 'nclsr:'+i), t('g2.ncls.h'),
    '<div class="field"><label>'+t('g2.ncls.name')+'</label>'+
      lnField('ncls-n', t('g2.ncls.name'), nclsName(i), '')+'</div>'+
    '<button class="btn" style="width:100%;margin-top:6px"' + DO('nclsSave', [i]) + '>'+
      t(i<0? 'g2.ncls.add' : 'form.save')+'</button>'+
    /* And the way out, which only a class that exists has. Words in the
       colour everything pressable is and no box round them -- CLAUDE.md
       § NO ROUNDED BOX. */
    (i<0? '' :
      '<button class="btn ghost"' + DO('nclsDel', [i]) + '>'+
        esc(t('g2.ncls.del'))+'</button>'));
}
function nclsSave(i){
  var a=document.getElementById('ncls-n'), v;
  if(!a) return;
  v=String(a.value||'').trim();
  if(!v){ toast(t('g2.ncls.need')); return; }
  if(!STG.ncls) STG.ncls={names:[], of:{}};
  if(!STG.ncls.names) STG.ncls.names=[];
  i=Number(i);
  if(i<0) STG.ncls.names.push(v); else STG.ncls.names[i]=v;
  stMarkSet('ncls');
  closeSheet({target:{id:'sbg'}});
  render();
}
/* DELETING ONE. It asks once, in the app's own popup -- 「標準は使わねえって
   言ってるだろこれも禁止や」 OWNER 2026-09-01 -- and there is no undo behind
   it, which is why it asks. The question is `confirm.del`, the one this app
   already asks about a word and a letter: one sentence, not a second one
   saying the same thing. */
function nclsDel(i){
  var nm=nclsName(Number(i));
  if(!nm) return;
  popAsk(t('confirm.del', nm), function(){ nclsDelGo(Number(i)); }, t('pop.yes'));
}
/* THE THREE THINGS THAT GO, and the DELETE REVIEW is in docs/CHANGELOG.md
   under 2026-09-09. The order is written down because the last of them reads
   the first: the rules are found by the label the number makes. */
function nclsDelGo(i){
  var of=(STG.ncls && STG.ncls.of) || {}, lab=nclsFm(i),
      a=(STG && STG.fm) || [], k, j;
  if(!nclsName(i)) return;
  /* ① the name. The slot is emptied, never spliced out: see nclsLive(). */
  STG.ncls.names[i]='';
  /* ② the record on every noun that was in it. REMOVED, not written over
     with なし -- なし is an answer somebody gave and this is the absence of
     one. The noun itself is not touched. */
  for(k in of) if(of.hasOwnProperty(k) && Number(of[k])===Number(i)) delete of[k];
  /* ③ its agreement rules, which are ordinary rules wearing this class's
     label. Backwards, because the list is being cut while it is walked. */
  for(j=a.length-1;j>=0;j--) if(a[j] && String(a[j].fm)===lab) a.splice(j,1);
  saveStg();
  /* The screen you are standing on is that class's, and it has just stopped
     being a class -- www/shell.js § navDrop, the same step delWord takes. */
  navDrop('nclsr:'+i);
  render();
}
/* A form is a ROUTE, so both ways in are registered -- and they are asked for
   rather than assumed, for the reason g2HelpReg() below is: THIS FILE IS ALSO
   READ ON ITS OWN by tools/grammar-engine-check.mjs, in a bare Node context
   with no screen in it, where FORM_OPEN does not exist. Writing into it at
   load time threw and took the whole check with it. */
if(typeof FORM_OPEN!=='undefined'){
  FORM_OPEN.ncls=function(){ nclsNew(); };
  FORM_OPEN.nclsr=function(a){ nclsOpen(Number(a)); };
}
/* One noun of this language and which class it is in. A row of choices, the
   same `.segs` every side on this page is chosen with -- 「語ごとにどれか」 --
   with なし first, because a language may have classes and still have nouns
   that are in none of them. Pressing a chip IS the answer; there is nothing
   to save. */
function nclsRow(w){
  var a=nclsLive(), now=nclsOf(w.hw), i,
      out='<button class="seg'+(now<0? ' on':'')+'"'+DO('nclsPut', [w.hw, -1])+'>'+
          esc(t('word.none'))+'</button>';
  for(i=0;i<a.length;i++)
    out+='<button class="seg'+(now===a[i]? ' on':'')+'"'+DO('nclsPut', [w.hw, a[i]])+'>'+
      esc(nclsName(a[i]))+'</button>';
  return '<div class="nclsw"><span class="nclsn">'+sfontHTML(wOut(w.hw))+'</span>'+
    '<div class="segs">'+out+'</div></div>';
}
function g2Ncls(){
  var a=nclsLive(), seen=wordsSeen(), out='', i, w;
  out+=secAdd(esc(t('g2.ncls.t')), DO('nclsNew'), t('g2.ncls.add'));
  for(i=0;i<a.length;i++){
    /* The name is a button so it can be written over, and the ＋ beside it
       adds an agreement rule for this class. Two acts on one heading, which
       is what a chapter of a grammar book's own section is. */
    out+=secAdd('<button class="secnm"'+DO('nclsOpen', [a[i]])+'>'+
                  esc(nclsName(a[i]))+'</button>',
                DO('fmrNew', ['', nclsFm(a[i])]), t('g2.fm.add'))+
         g2FmRows(nclsFm(a[i]), '');
  }
  if(!a.length) return out;
  out+='<div class="sec">'+esc(t('g2.ncls.words'))+'</div>';
  for(i=0;i<seen.length;i++){
    w=seen[i];
    if(w.pos!=='n' || w.fm) continue;
    out+=nclsRow(w);
  }
  return out;
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
  /* A SECTION is about its own forms and no others, and it draws its own way
     to add one on each of their headings -- g2FmSec() -- so there is nothing
     for g2Add() to offer. What is left for g2MakeAll() is the words those
     rules would make, which is every form of the section at once. */
  if(c.fms) return c.fms;
  if(typeof FM_INF==='undefined') return out;
  for(i=0;i<FM_INF.length;i++){
    f=FM_INF[i]; g=GFM_FEAT[f];
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
  if(!c || !c.pos || c.fms) return '';
  for(i=0;i<fms.length;i++){
    if(g2HasFm(c.pos, fms[i])) continue;
    out+=g2FmSlot(c.pos, fms[i]);
  }
  return out;
}

/* ====================================================================
   A SECTION IS A CHAPTER, AND A FORM IS A HEADING INSIDE IT
   「開いたらそんな分け方してるの意味わからない。人称でまとめて設定できれば
   いいやん」 OWNER 2026-09-11.

   A form was a chapter of its own, so opening 動詞 gave twenty-one doors --
   一人称単数, 二人称単数, 三人称単数, 一人称複数 … one page each, and a person
   who wanted to say how their verbs change for who is doing them had to walk
   six of them and write the same kind of rule in each. The unit is the SECTION
   now: 人称変化 is ONE page with the six forms down it.

   ONE FUNCTION DRAWS ALL OF THEM, and there is no special case for a section
   that happens to have one form -- 複数形 and 比較 go through exactly the same
   code as 人称変化 does. What differs is the row of this table, which is the
   only place any of it is written down.

   THIS TABLE REPLACED TWO. It was the list of forms here and the group
   headings in www/phases.js § G2BOOK -- 「どこからどこまでが一つの話か」 said
   once as a heading over a run of chapters and once as the run itself. A
   heading over a list of doors and the page those doors led to were the same
   thought at two levels, and the heading is the PAGE now.

   `nm` is the key the section is named by, and it is a key rather than a
   string because the name is a fact of the interface language. 否定 and 疑問
   are named by the form label they always were -- 否定形 / 疑問形 -- so those
   two rows do not change; giving them a second key would be one name written
   in two places.
   ==================================================================== */
/* A section: what it is called, the part of speech its rules are written on,
   and the forms it is made of, in the order they are drawn. Order is the order
   of the book. `side` is the one extra a section may carry and one does --
   g2FmChap() below. */
var G2FM_CHAPS=[
  {id:'person', nm:'g2.g.person', pos:'v',
   fms:['p1s','p2s','p3s','p1p','p2p','p3p']},
  {id:'tense',  nm:'g2.g.tense',  pos:'v',
   fms:['prs','pst','fut','plp','prg','prf']},
  {id:'mood',   nm:'g2.g.mood',   pos:'v',   fms:['imp','cnd','pot','obl','des']},
  {id:'voice',  nm:'g2.g.voice',  pos:'v',   fms:['pas','cau']},
  {id:'neg',    nm:'word.fm.neg', pos:'v',   fms:['neg']},
  {id:'q',      nm:'word.fm.que', pos:'v',   fms:['que']},
  {id:'pl',     nm:'word.fm.pl',  pos:'n',   fms:['pl']},
  {id:'degree', nm:'g2.g.degree', pos:'adj', fms:['cmp','sup'], side:'than'}
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
/* ====================================================================
   A CHAPTER IS A PAGE OF THIS LANGUAGE'S GRAMMAR BOOK
   「文法のページを開いたら文法書が見れないと作ってる価値ねえだろ」
   「文法書にしてくれ」「wiki に見せるかどうかは今はしないけど見せれるくらい
   美しくしてくれ」 OWNER 2026-09-06.

   What a chapter showed was its rules and nothing else -- 過去形 read
   「規則を足す ›」 and stopped, on a language with six words in it. A list of
   rules is not a grammar. A grammar is the rule, what it does to the words this
   language actually has, and the line somebody wrote to show it, so a chapter
   is those three down the page:

     a  the rule as a SENTENCE      g2FmSent()   「動詞の末尾に -ta」
     b  the words it MAKES          g2FmTable()  kano › kanota
     c  the LINES written for it    g2ChapEx()   the same store a stage's are in

   and then the words the chapter itself asks for, which is chapSlotsHTML() and
   is unchanged.

   NOT ONE OF THE THREE IS A SECOND PLACE FOR ANYTHING. The sentence is read
   off the rule the editor writes (`at` and `add`, which is the whole of that
   screen); the table is fmrMake(), the one function that says what a rule makes
   of a word; the lines are stEx(), which stages have written into since they
   had examples at all.
   ==================================================================== */
/* The rules this language has for one form, in the order they were written.
   Asked of STG.fm rather than of the engine, because a rule that did not travel
   is still a rule somebody wrote and a chapter that hid it would be the app
   forgetting what it was told.

   ONE PLACE. The chapter's rows, its table and whether the list draws it faint
   are three questions about the same set, and each of them walked STG.fm for
   itself until this was pulled out. */
function g2RulesOf(fm){
  var a=(STG && STG.fm) || [], out=[], i;
  for(i=0;i<a.length;i++) if(a[i] && String(a[i].fm)===String(fm)) out.push(a[i]);
  return out;
}
/* AND THE RULES OF A WHOLE SECTION, which is the same question one level out:
   every form of it, in the order the table puts them. The page's Select, the
   contents' faint字 and the table under the rules all ask it, so a section that
   has been written in cannot be three different answers. */
function g2SecRules(c){
  var out=[], fms=(c && c.fms) || [], i, j, a;
  for(i=0;i<fms.length;i++){
    a=g2RulesOf(fms[i]);
    for(j=0;j<a.length;j++) out.push(a[j]);
  }
  return out;
}
/* THE RULE, AS ONE LINE OF A GRAMMAR BOOK. 「規則を一行の文にしたもの」
   -- 「動詞の末尾に -ta」. It used to be ❶ › › –, four marks round a gap, and
   the owner asked what it meant twice.

   The part of speech is the rule's own where it names one and the chapter's
   where it does not, which is the same reading g2FmRows has always taken. The
   letters are the ones somebody drew, so they go through sfontHTML().

   AND IT SAYS THE CONDITION. 「はい」 OWNER 2026-09-09. `when` and `drop` are
   on rules written before the editor was cut back to the two fields
   (www/wordsheet.js § fmrFormHTML) and no screen can write another -- but they
   still work, so a sentence that said only the affix read as a rule that
   always fires. It said 「動詞の末尾に -ta」 about a rule that only touches
   words ending in a vowel. Three clauses, in the order they happen: what has
   to be true, what comes off first, and what goes on.

   ONE PLACE, still: the clause is built here and nowhere else, and the table
   underneath is unchanged -- it goes on showing exactly which words the rule
   reached, which is the half a sentence can never say. */
function g2FmSent(r, pos){
  var a=gFmAffix(r), c;
  if(!a) return '';
  c=g2FmWhen(r);
  /* THE CONDITION IS ITS OWN LINE, and that is a measurement rather than
     taste. The row's label is `.psm`, which is `flex:0 0 auto` (www/index.html)
     -- it never shrinks, so a label wider than the phone widens the PAGE and
     the whole screen scrolls sideways. Measured: 「y で終わるとき、末尾の 1
     文字を落として、動詞の末尾に -ied」 took the screenshot from 390 to 461.
     Broken in two, each line fits. The break is here and not in the ten
     translations, so no translator can lose it. */
  return (c? c+'<br>' : '')+
    t((r && r.at==='start')? 'g2.rule.start' : 'g2.rule.end',
      esc(posLabel(r.pos || pos)), sfontHTML(a));
}
/* The conditions a rule can carry, as the clauses that go in front of it.
   Nothing is written for a rule that has none, which is most of them: a
   sentence with an empty clause pasted on the front would be the app saying
   something about every rule in the book.

   `x` names the letters a word has to END in and those are letters somebody
   drew, so they go through sfontHTML() exactly as the affix does. `v` and `c`
   are about SOUND and have nothing of this language in them to draw. */
function g2FmWhen(r){
  var out='', n;
  if(r && r.when==='v') out+=t('g2.rule.when.v');
  else if(r && r.when==='c') out+=t('g2.rule.when.c');
  else if(r && r.when==='x' && (r.wend||[]).length)
    out+=t('g2.rule.when.x', sfontHTML(spWord(r.wend)));
  n=Math.max(0, parseInt(r && r.drop, 10) || 0);
  if(n) out+=t('g2.rule.drop', String(n));
  return out;
}
/* The rows of ONE form. It took the chapter while a chapter was one form; a
   section is several, so what it is about is said outright. */
function g2FmRows(fm, pos){
  var a=g2RulesOf(fm), out='', i, id;
  for(i=0;i<a.length;i++){
    id=String(a[i].id||'');
    /* The numerals are what a rule with no letters on it yet is called: there
       is no sentence to write, and ❶ is what this list has always numbered by.
       Everything else says what it does. */
    out+=g2Row(g2FmSent(a[i], pos) || g2Num(i), '', '', '', '',
               'openFmr', [id], id);
  }
  return out;
}
/* 作成 -- one form of this section that this language has not written yet.
   ONE PLACE: the chapters whose rows are forms of a word draw it from here and
   so does g2Add(), which is the same row asked for a chapter that is not a
   section. It says the form and it says 作成, which is what every row in this
   app says where the thing is not made. */
function g2FmSlot(pos, fm){
  return '<button class="stslot"' + DO('fmrNew', [pos, fm]) + '>'+
    '<span class="psm">'+esc(fmLabel(fm))+'</span>'+
    '<span class="psn">'+t('stg.make')+'</span>'+ICON_GO+'</button>';
}
/* ONE FORM ON A SECTION'S PAGE, and it is the rules this language wrote for
   that form or the one row that says it has not written any.

   A FORM WITH NO RULE IS THE 作成 ROW AND NOTHING ELSE. The row already says
   the form's name and says 作成 beside it, so a heading over it is that name
   printed twice, one line apart -- which is the same 「↑これは説明だろ」 the
   book's own group headings were cut back for. It is also the only door to
   fmrNew() there, where a ＋ on a heading would be a second one beside it.

   A FORM THAT HAS RULES TAKES A HEADING, because the rows under it are
   sentences about the rule and none of them says which form it makes. The ＋
   rides on that heading -- secAdd() is the one place that shape is written --
   so a second rule is added the way every other list in this app adds one.

   AND THE HEADING SAYS WHAT THE PAGE DOES NOT SAY ALREADY. A section of one
   form is drawn by this same function, and naming that form here would print
   the bar's own title a second line down -- 複数形 over 複数形 -- so it says
   規則 there, which is the heading that page has always had. Same rule as the
   book's own groups (www/phases.js § G2BOOK): a title only where the run is
   more than one thing. */
function g2FmSec(c, fm){
  var rows=g2FmRows(fm, c.pos);
  if(!rows) return g2FmSlot(c.pos, fm);
  return secAdd(esc((c.fms.length>1)? fmLabel(fm) : t('stg.rules')),
                DO('fmrNew', [c.pos, fm]), t('g2.fm.add'))+rows;
}
/* THE TABLE: what these rules make of the words this language really has.
   「辞書の実際の語で作った表（kano → kanota、tir → tirta …）」

   fmrMake() is asked, which is the one place that says what a rule makes of a
   word -- so a condition on an old rule is obeyed here without this knowing
   what a condition is, and a word the rule does not reach is simply not on the
   table. A word a rule MADE is left out for the reason fmrTodo() leaves it out:
   a plural of a plural is not a word in anybody's language.

   wordsSeen() and not WORDS. What a plan hides from the dictionary it hides
   here too -- the same one place decides, so the two screens cannot come out
   saying different things about which words there are.

   A cell opens the word it is made of. Nothing is written from this table: it
   is what the rules WOULD make, drawn fresh on every render, so the book is
   right the day the dictionary grows and there is no copy to go stale. */
/* ONE ROW IS ONE WORD, AND A COLUMN IS A FORM. 「表を頁に一つ、列＝形
   （kano → kano-mi｜kano-ta…）」 2026-09-11. It was one row per rule, which
   was right while a page was one form and puts the same word down six times on
   a section that has six.

   The columns are the forms this section has a rule for, in the table's own
   order, and they are the SAME columns on every row -- a word a form does not
   reach is an empty cell rather than a missing one, so the second column means
   the second form all the way down. `.gtm` is `flex:1 1 auto` and there are as
   many of them as there are forms, so the columns line up with no new rule in
   the stylesheet.

   A form that reaches this word with more than one rule says both, in the one
   cell: two rules making the same form are two ways of making it and the
   column is what they are both about. */
function g2Cell(w, made){
  var out='', i;
  for(i=0;i<made.length;i++)
    out+='<span class="gtm">'+(made[i]? sfontHTML(made[i]) : '')+'</span>';
  return '<button class="gtabr"' + DO('openWord', [w.hw]) + '>'+
    '<span class="gtw">'+sfontHTML(wOut(w.hw))+'</span>'+
    '<span class="gts">'+ICON_GO+'</span>'+out+'</button>';
}
/* The forms of this section that have a rule at all. A column for a form
   nobody has written is a column of nothing, all the way down. */
function g2FmCols(c){
  var out=[], i;
  for(i=0;i<c.fms.length;i++) if(g2RulesOf(c.fms[i]).length) out.push(c.fms[i]);
  return out;
}
/* What one form makes of one word: every rule of it that reaches the word,
   as the app writes a word (wOut). */
function g2FmMade(w, fm){
  var a=g2RulesOf(fm), out=[], i, m;
  for(i=0;i<a.length;i++){ m=fmrMake(w, a[i]); if(m) out.push(wOut(m.hw)); }
  return out.join(' ');
}
function g2FmTable(c){
  var cols=g2FmCols(c), seen=wordsSeen(), out='', i, j, w, made, any;
  if(!cols.length) return '';
  for(i=0;i<seen.length;i++){
    w=seen[i];
    if(w.fm) continue;
    made=[]; any=false;
    for(j=0;j<cols.length;j++){
      made.push(g2FmMade(w, cols[j]));
      if(made[j]) any=true;
    }
    if(any) out+=g2Cell(w, made);
  }
  if(!out) return '';
  return '<div class="sec">'+esc(t('g2.words'))+'</div>'+
    '<div class="gtab">'+out+'</div>';
}
/* And the words this chapter's own stage used to ask for, where there was
   one: 否定形 wants the word for "not" and 疑問形 the six question words.
   chapSlotsHTML() draws nothing for the sections that have none. */
/* A SECTION MAY ALSO TAKE A SIDE, and one of them does: 比較 has a word for
   「〜より」 and a side for it, which no other section has and which is the
   only position in a comparison this app does not already answer somewhere
   else (where the adjective itself stands is §2's board and the 形容詞
   chapter's). `side` is the key gPos() holds it under, named in G2FM_CHAPS
   beside the forms -- a string and not a function, because a section is a row
   of a table and a table of functions is a table nothing can check. */
/* And 否定 / 疑問 where this section is one of the four things they can be
   about, which is 命令 and nothing else today -- and 命令 is a FORM inside
   法 now, so it is asked of the forms rather than of the section's id.
   g2PolAt() draws nothing for the rest. */
function g2FmChap(c){
  var out=(c.side? g2Side(c.side, gSlotAny(c.side), gWordOf('n')) : ''), i;
  for(i=0;i<c.fms.length;i++) out+=g2FmSec(c, c.fms[i]);
  out+=g2FmTable(c)+chapSlotsHTML(c.id);
  for(i=0;i<c.fms.length;i++) out+=g2PolAt(c.fms[i]);
  return out;
}
/* What is behind the `?`. 「説明禁止の代わりに？を儲けてるからね？」 OWNER
   2026-09-05 -- so a chapter says nothing about itself on the screen and the
   whole of what it means is one press away. The two lines are the app's own
   `.d` and `.e` for that label: what the form is, and one example of it in the
   interface language. Registered from the list rather than one at a time so a
   chapter added to G2FM_CHAPS arrives with its `?` already on it. */
function g2HelpOf(sec){
  return function(){
    var h='', i, f;
    for(i=0;i<sec.fms.length;i++){
      f=sec.fms[i];
      /* The form's own name over its two lines, where the section is made of
         several -- otherwise six pairs of sentences run together and nobody
         can tell which is about which. A section of one form is that one form
         and the title already says it. */
      if(sec.fms.length>1) h+='<div class="sec">'+esc(fmLabel(f))+'</div>';
      h+='<div class="note">'+esc(t('word.fm.'+f+'.d'))+'</div>'+
         '<div class="note">'+esc(t('word.fm.'+f+'.e'))+'</div>';
    }
    return {t:t(sec.nm), h:h};
  };
}
function g2HelpReg(){
  var i;
  for(i=0;i<G2FM_CHAPS.length;i++)
    HELP['g2.'+G2FM_CHAPS[i].id]=g2HelpOf(G2FM_CHAPS[i]);
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
  var out=[{id:'order', body:g2Board, nm:t('stg.order.t')},
           {id:'np',    body:g2Board, nm:t('g2.np.t')},
           {id:'cx',    body:g2Cx,    nm:t('g2.cx.t')},
           {id:'ncls',  body:g2Ncls,  nm:t('g2.ncls.t')},
           {id:'det',   body:g2Det,   nm:t('g2.det.t')},
           {id:'cop',   body:g2Cop,   nm:t('g2.cop.t')},
           /* AND WHAT IT IS CALLED IS NOT 「名詞」. The section is the case
              marks -- subject, object, the one given to, whose, where, with
              what, together with (`part` in www/phases.js) -- and it was
              named posLabel('n'), which is the word the CHAPTER round it is
              already called: 「名詞 › 格 › 名詞」, three rows deep and the
              first and last the same word. posLabel() is what a word's part
              of speech is called on six other screens and is not renamed;
              this section says what it is. */
           {id:'n',     body:g2Nouns, nm:t('g2.n.mark'), pos:'n'}], i, a;
  /* The sections, one chapter each, from the one list. A chapter is drawn by
     g2FmChap() and knows its own forms and its own part of speech, so nothing
     here is written eight times. */
  for(i=0;i<G2FM_CHAPS.length;i++){
    a=G2FM_CHAPS[i];
    /* 否定形 and 疑問形 are forms of a word AND two of the four things
       docs/GRAMMAR-V2-SPEC.md §4.4 and §4.5 say a language decides separately
       -- so they keep their place on this list, their name and their `?`.
       What they have not got is a page: their four targets are their pages
       (g2ChapBy below), each opened from the section it belongs to. */
    out.push({id:a.id, body:g2FmChap,
              nm:t(a.nm), pos:a.pos, fms:a.fms, side:a.side});
  }
  out.push({id:'adj', body:g2Adj,    nm:posLabel('adj'), pos:'adj'});
  out.push({id:'adp', body:g2Adp,    nm:t('stg.where.t')});
  return out;
}
/* A CHAPTER, AND A TARGET OF 否定 / 疑問 IS ONE TOO. Those two are four rules
   each -- a verb sentence, a noun sentence, a command, existence -- and each is
   a page, reached as `neg:v`. What comes back is the chapter with the target on
   it and its own body, made here rather than stored in the list: the list is
   what the contents page draws and a language does not have twenty chapters
   because one of them has four pages.

   AND THOSE TWO HAVE NO PAGE OF THEIR OWN. A bare `neg` answers null, so it
   falls to the contents: the page that used to be there was the four rows
   choosing a target, and they are the sections those targets belong to now
   (OWNER 2026-09-11).

   THE TARGET KEEPS THE CHAPTER'S NAME -- 否定, not 動詞の文. It is the row on
   the verb chapter and the row on 命令 and the two on です／ある, and in every
   one of those places what the page is ABOUT is the page it was opened from.
   Saying the target again would be that page named twice. */
function g2ChapBy(id){
  var a=g2Chaps(), i, s=String(id||''), j=s.indexOf(':'), on='', c;
  if(j>=0){ on=s.slice(j+1); s=s.slice(0, j); }
  for(i=0;i<a.length;i++) if(a[i].id===s){
    if(!gPolFeat(s)) return on? null : a[i];
    if(!on || !GPOL_TARGET[on]) return null;
    c={}; for(j in a[i]) if(Object.prototype.hasOwnProperty.call(a[i], j)) c[j]=a[i][j];
    c.id=s+':'+on; c.on=on; c.body=g2PolPage;
    return c;
  }
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
/* WHETHER THIS LANGUAGE HAS SAID ANYTHING IN THIS CHAPTER YET. The contents
   draws a chapter faint until it has -- 「まだ書いていない章は薄い字」 OWNER
   2026-09-06 -- which is what a contents page is for: how far the book has got,
   without having to open every chapter to find out.

   ASKED OF WHAT IS STORED and never of what the page draws. Calling a chapter's
   own body from the list would run g2Board(), which arms this screen's KEEP
   buffer, so drawing the contents would have told the Save that a board had
   been opened.

   Five things a chapter can hold, in one place, so a chapter that gains a
   sixth is a line here rather than a sixth answer somewhere else. */
function g2Said(c){
  /* A target of 否定 / 疑問 answers for its whole chapter: the words it asks
     for and the lines written for it are the chapter's and are stored under
     the chapter's own id (g2PolChap above). */
  var p, head=String(c.id).split(':')[0];
  if(stEx(head).length) return true;
  p=chapSlotsOf(head);
  if(p && stSlotsDone(p)) return true;
  /* 否定形 and 疑問形 have written-in rules of their own shape as well as any
     fmr rule an older build left on them. Either is this chapter having been
     written in. */
  if(gPolFeat(c.id) && gPolSaidAny(gPolFeat(c.id))) return true;
  if(c.fms) return g2SecRules(c).length>0;
  if(c.id==='order' || c.id==='np') return stTouched(c.id);
  if(c.id==='n'){ p=stBy('part'); return !!p && !!stSlotsDone(p); }
  /* The same question the chapter's own page asks, and for the same reason:
     a language that came through the migration holds the side and is arranged
     by it, so this list saying the chapter is empty would be the contents and
     the page disagreeing about one fact. */
  if(c.id==='adj' || c.id==='adp') return gPosSaid(c.id);
  /* Three decisions in one chapter, so any one of them is the chapter having
     been written in. */
  if(c.id==='cx') return gPosSaid('cx') || gPosSaid('cxm') || gPosSaid('relm');
  /* A language with a class in it has said something here, whether or not any
     noun is in one yet. */
  if(c.id==='ncls') return nclsLive().length>0;
  /* この言語について counts what this language has and is never empty. */
  return true;
}
/* WHETHER THIS LANGUAGE HAS A RULE FOR ONE FORM OF A SECTION. `STG.fm` holds
   them for every form but 否定 and 疑問, whose rules are a shape of their own
   and live in `STG.gr` -- so this is where the form's rules are KEPT rather
   than a second answer to which forms there are.

   It is not g2Said(), and the two are different questions. That one is 「has
   this section been written in at all」 and counts an example or a word the
   section asks for; this one counts RULES, because that is what the number on
   the row is about. A section whose example is written and whose rules are not
   is not pale and says 0. */
function g2FmSaid(c, fm){
  var f=gPolFeat(c.id);
  return f? gPolSaidAny(f) : g2RulesOf(fm).length>0;
}
/* THE RIGHT END OF A SECTION'S ROW: how many of the things it is made of have
   been answered, out of how many. 「章の中の節の行は答えた後も右端が「—」の
   まま（薄さだけが変わる）」 2026-09-11 -- a section said 時制 and — whether
   this language had written six rules in it or none, so the only thing the
   contents of a chapter said was pale or not.

   IT IS THE SENTENCE EVERY OTHER ROW IN THIS APP ALREADY SAYS, one level
   down: a stage says how many of its slots are filled (www/phases.js § stRow),
   a chapter of the book says how many of its sections are written
   (g2BookRow), and a section says how many of its forms are. A row with
   nothing to count says — , which is what those two already do -- 語順 and
   です／ある are one decision each and there is no 1/1 to write about a thing
   that is not made of parts. */
function g2ChapVal(c){
  var i, done=0;
  if(!c.fms) return '—';
  for(i=0;i<c.fms.length;i++) if(g2FmSaid(c, c.fms[i])) done++;
  return done+' / '+c.fms.length;
}
function g2ChapRow(c, n){
  return '<button class="strow'+(g2Said(c)? '' : ' pale')+'"' +
    DO('go', ['gram', 'v2:'+c.id]) + '>'+
    '<span class="stn">'+n+'</span>'+
    '<span class="stt">'+esc(c.nm)+'</span>'+
    '<span class="lead"></span>'+
    '<span class="stv">'+esc(g2ChapVal(c))+'</span>'+
    ICON_GO+'</button>';
}
/* One chapter's page. It is handed the chapter rather than the argument now:
   vGram() looks it up, because it is vGram() that has to fall back to the
   list when the argument names no chapter. */
/* THE LINES WRITTEN FOR THIS CHAPTER. 「その章の例文（言語の一行＋訳）」 --
   the same stEx() a stage's examples have always been in, keyed by the chapter's
   own id, drawn by the same exRowHTML() and added with the same ＋ on the
   heading. Nothing new is stored and nothing new decides anything: what a
   chapter had to have was somewhere to put the line that shows the rule.

   この言語について is the one page without it. It is three counts of what this
   language has, not a chapter of the book, and a place to write an example of a
   count is a slot nobody can fill. */
function g2ChapEx(id){
  return secAdd(ICON_LINE+t('stg.ex'), DO('stExOpen', [id]), t('word.mn.add'))+
    stExHTML(id);
}
function g2Page(c){
  /* A target's page is one rule being written and nothing else. The words a
     chapter asks for, the lines written for it and the ＋ that makes the words
     its rules would make all belong to the CHAPTER, one screen up: drawing
     them here would be the chapter said twice, on a page that is a part of
     it. */
  if(c.on) return c.body(c);
  return c.body(c)+g2Add(c.id)+g2MakeAll(c.id)+
    (c.id==='st'? '' : g2ChapEx(c.id));
}

/* ---- the screen -------------------------------------------------------- */
