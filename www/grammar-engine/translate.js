/* Lingua Grammar Engine v2 — a sentence WRITTEN in this language.
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   morphology.js reads a sentence and hands back roles. This is the same
   sentence going the other way: roles in, this language's own order out. The
   two have to agree about which word is the verb, or a line composed here
   would not read back as the line it was — so both find the verb by what it
   is and let everything else queue for the language's own order, and
   tools/grammar-engine-check.mjs composes a sentence and parses it back.

   What it is NOT: this does not read an invented language and tell anybody
   what it says. www/post.js has a line across it about exactly that, and the
   reason is that the only person who could catch a wrong reading never sees
   it. This runs the other way — a natural sentence, the reader's OWN
   dictionary, the reader's own word order — so the guessing is about your own
   words and you are the one who can see it is wrong. docs/FEATURES.md says
   the same thing under "A post shown three ways", layer three.

   Nothing here is frozen onto a post and nothing here waits on a hosted
   model. 「きかいほんやくはつかわない」 OWNER 2026-09-05. Both directions are
   computed now, offline, costing nothing, and it is right that they are not
   frozen: a line that half-rendered yesterday renders fully today because the
   dictionary grew. docs/FEATURES.md calls freezing a translation onto a post
   the bug.

   DOM-free and globals-free, like lexicon.js beside it. */
(function(root){
  'use strict';
  var api=root.LinguaGrammarEngine;
  /* The same table morphology.js reads a mark WITH, used here to write one.
     Both directions of one fact, and it is stated in morphology.js -- this
     asks the engine for it rather than restating it, because two copies of a
     table is two answers to "what does ACCUSATIVE mean" the day one moves. */
  var CASE_ROLE=api&&api.morphology&&api.morphology.CASE_ROLE;
  if(!api) throw new Error('LinguaGrammarEngine model must load before translate');

  /* ---- what the language has decided --------------------------------------
     Where a word stands is one answer for the whole language and is heard in
     every sentence that uses it — which is why www/grammar.js gives those
     three buttons and nothing else. They arrive as syntax rules rather than as
     three more fields on the model, because grammarRule() is already the shape
     for "this language does this", and a fourth position added later needs no
     new field. */
  function rulesFor(model, target, feature){
    var rules=(model&&model.grammarRules)||[], out=[], i, r;
    for(i=0;i<rules.length;i++){ r=rules[i];
      if(r.type==='syntax' && r.target===target && r.feature===feature) out.push(r);
    }
    return out;
  }
  function positionOf(model, target){
    var r=rulesFor(model,target,'POSITION');
    return (r.length && r[0].value==='before') ? 'before' : 'after';
  }
  /* THE PARTS OF A NOUN PHRASE, in the order this language puts them, and an
     empty list is the honest answer for a language nobody has asked. It is a
     syntax rule for the same reason the three positions are: grammarRule() is
     already the shape for "this language does this", and the codes it carries
     are turned into parts by the one place that does that (model.js npOrder).

     A PART THIS LIST DOES NOT NAME KEEPS THE PLACE IT ALREADY HAD. That is
     the whole of what an empty chapter means here -- 「章が空の時はその部分が
     抜ける（壊れない）」 -- so a language that has never opened the board is
     arranged exactly as it was before the board existed. */
  function npOrderOf(model){
    var r=rulesFor(model,'NOUNPHRASE','ORDER');
    return (r.length && api.npOrder)? api.npOrder(r[0].value) : [];
  }
  /* Which words ARE the negation, and which are adpositions, is not something
     a part of speech can say: the app makes them in a stage, so the page that
     knows about stages names them here by id. More than one is ordinary —
     a language may have several of either. */
  function markedIds(model, target){
    var r=rulesFor(model,target,'WORD'), out=[], i, v, j;
    for(i=0;i<r.length;i++){ v=r[i].value;
      if(v===null||v===undefined) continue;
      if(Array.isArray(v)){ for(j=0;j<v.length;j++) if(v[j]) out.push(String(v[j])); }
      else out.push(String(v));
    }
    return out;
  }
  /* The order the sentence being read was written in. Not the order it is
     going into -- see arrange(). */
  function srcOrder(model){
    var r=rulesFor(model,'SOURCE','ORDER'), out=[], v, i;
    if(r.length){ v=r[0].value;
      if(typeof v==='string') v=v.split(',');
      if(Array.isArray(v)){ for(i=0;i<v.length;i++) if(String(v[i])!=='VERB') out.push(String(v[i])); }
      if(out.length) return out;
    }
    return ['SUBJECT','OBJECT'];
  }
  /* ---- what class a word is in --------------------------------------------
     「性・名詞クラス ── 無し／2 つ／3 つ…、名前は自由、語ごとにどれか、
     形容詞・動詞への一致（あれば）」 OWNER 2026-09-07.

     A class has no meaning this engine knows, and must not: the app stores
     the NAME somebody typed, and here it is the `feature` of a syntax rule
     whose value is the words in it. So a language with nine classes named
     after whatever its maker likes works exactly as one with two named
     masculine and feminine, and nothing here decides what kinds of noun
     there are.

     An agreement rule is then an ordinary inflection asking for CLASS/<that
     name>, and `applies()` is what keeps it on the right part of speech: a
     rule written for adjectives fires on adjectives, one written for verbs on
     verbs, and a language with neither is untouched. */
  function classOf(model, word){
    var rules=(model&&model.grammarRules)||[], id=word&&String(word.id), i, r, v, j;
    if(!id) return null;
    for(i=0;i<rules.length;i++){ r=rules[i];
      if(r.type!=='syntax' || r.target!=='CLASS') continue;
      v=r.value; if(!Array.isArray(v)) v=(v===null||v===undefined)?[]:[v];
      for(j=0;j<v.length;j++) if(String(v[j])===id) return r.feature;
    }
    return null;
  }
  function isMarked(ids, unit){
    var i; if(unit.kind!=='word'||!unit.word) return false;
    for(i=0;i<ids.length;i++) if(ids[i]===String(unit.word.id)) return true;
    return false;
  }

  /* ---- what each piece of the sentence is ---------------------------------
     A gap counts as a nominal. That is deliberate and it is the same sentence
     morphology.parseSentence writes: the verb is found by what it is, and
     everything else queues. A run of text this dictionary has no word for
     cannot be known to be the verb, so it takes the next place in the queue —
     which is what puts an unknown object where the object goes, in red, where
     it is the door to making that word. */
  var NOMINAL={NOUN:1, PRONOUN:1, NAME:1};
  function kindOf(model, unit, negIds, adpIds){
    if(unit.kind==='gap') return 'NOMINAL';
    if(isMarked(negIds,unit)) return 'NEGATION';
    if(isMarked(adpIds,unit)) return 'ADPOSITION';
    var p=unit.word?unit.word.partOfSpeech:null;
    if(p==='VERB') return 'VERB';
    if(p==='ADJECTIVE') return 'ADJECTIVE';
    if(p==='ADVERB') return 'ADVERB';
    if(p==='ADPOSITION') return 'ADPOSITION';
    /* A numeral is a part of a NOUN PHRASE and not a role of a sentence, so
       it is named here and placed by the noun-phrase board below. Where that
       board says nothing it goes on falling out at the end of the line, which
       is exactly where it went before there was a board. */
    if(p==='NUMERAL') return 'NUMERAL';
    if(NOMINAL[p]) return 'NOMINAL';
    return 'LOOSE';
  }

  /* An adjective belongs to the noun it was written against, and an
     adposition to the noun it governs. Which SIDE that noun is on is the
     source sentence's business, not this language's, and the source is not
     always the same shape: English writes "at sea water" and Japanese writes
     海水で. Searching in a fixed direction picked whichever of the two the
     search was written for -- backwards-first read "I eat at sea water" as
     `at` belonging to `I`.

     So it is the NEAREST nominal, whichever side it is on, and both languages
     come out right without either being named. A tie -- a word sitting exactly
     between two nominals -- goes to the one after it. */
  function attach(kinds, i){
    var n=kinds.length, j, best=-1, d=0, bd=-1;
    for(j=0;j<n;j++){
      if(kinds[j]!=='NOMINAL') continue;
      d=(j>i)?(j-i):(i-j);
      if(bd<0 || d<bd || (d===bd && j>i && best<i)){ best=j; bd=d; }
    }
    return best;
  }

  function tag(unit, role){
    return {kind:unit.kind, word:unit.word||null,
            surface:(unit.kind==='word'?String((unit.word&&unit.word.lemma)||''):String(unit.text||'')),
            text:String(unit.text||''), role:role};
  }

  /* ---- the sentence, in this language's own order -------------------------
     Roles come out of the word order the language chose (www/grammar.js keeps
     all six, because all six are used by languages on this planet). Nominals
     take the non-verb places in that order as they appear; a third and any
     after it follow the sentence rather than being dropped, because dropping
     a word somebody wrote is the one thing this must not do. */
  function arrange(model, units){
    var order=(model&&model.wordOrder&&model.wordOrder.length)?model.wordOrder:['SUBJECT','OBJECT','VERB'],
        negIds=markedIds(model,'NEGATION'), adpIds=markedIds(model,'ADPOSITION'),
        kinds=[], adjs=[], adps=[], advs=[], negs=[], loose=[], noms=[], verb=-1,
        np=npOrderOf(model), npOn={}, nmods=[],
        adjPos=positionOf(model,'ADJECTIVE'), adpPos=positionOf(model,'ADPOSITION'),
        negPos=positionOf(model,'NEGATION'), onBoard={}, adpHead={},
        i, j, k, slots=[], si=0, role, roleOf=[], head, out=[], phrase, extra=[], seen={};

    /* WHICH ROLES ARE ON THE BOARD. The word order used to be exactly three
       roles, so everything else had a place worked out from one of them --
       an adverb after the sentence, the negation beside the verb, an
       adposition inside the noun phrase it governs. A role somebody has put
       on the board says WHERE IT STANDS instead, and a role they have not
       put there behaves exactly as it did. 「無い役割は台に無ければ今まで
       通り」 -- so this is one question asked once, and every place below
       reads it rather than deciding again. */
    for(i=0;i<order.length;i++) onBoard[order[i]]=true;
    for(i=0;i<np.length;i++) npOn[np[i]]=true;

    for(i=0;i<units.length;i++) kinds.push(kindOf(model,units[i],negIds,adpIds));
    for(i=0;i<units.length;i++){
      if(kinds[i]==='NOMINAL') noms.push(i);
      else if(kinds[i]==='VERB' && verb<0) verb=i;
      else if(kinds[i]==='VERB') loose.push(i);
    }
    for(i=0;i<units.length;i++){
      if(kinds[i]==='ADJECTIVE'){ j=attach(kinds,i); if(j<0) loose.push(i); else adjs.push({at:i, to:j}); }
      else if(kinds[i]==='ADPOSITION'){ j=attach(kinds,i); if(j<0) loose.push(i); else { adps.push({at:i, to:j}); adpHead[j]=1; } }
      else if(kinds[i]==='NEGATION'){ if(verb<0 && !onBoard.NEGATION) loose.push(i); else negs.push(i); }
      else if(kinds[i]==='ADVERB'){ if(onBoard.ADVERB) advs.push(i); else loose.push(i); }
      /* The same sentence the adverb's line above says, about the other
         board: a part the noun-phrase board does not name is not attached to
         anything, and follows the sentence as it always did. */
      else if(kinds[i]==='NUMERAL'){ j=npOn.NUMERAL? attach(kinds,i) : -1; if(j<0) loose.push(i); else nmods.push({at:i, to:j, part:'NUMERAL'}); }
      else if(kinds[i]==='LOOSE') loose.push(i);
    }

    /* Which nominal is the subject comes out of the sentence that was TYPED,
       not out of the language it is going into. Taking it from the target's
       own word order read "I eat fish" into a VOS language as fish eating me:
       the queue was OBJECT then SUBJECT, so the first noun typed took the
       object's place. The target's order says WHERE each role stands, and
       says nothing about which word has it.

       So the queue is the source's, and it is written down rather than
       assumed: subject first, then object. All ten interface languages put
       the subject first, and a language that does not is a rule somebody has
       to state -- a SOURCE/ORDER rule on the model overrides it without
       touching anything here. */
    slots=srcOrder(model);
    /* A NOUN AN ADPOSITION GOVERNS IS THE PHRASE, not a role in the queue.
       「場所（前置詞句）」 is the whole of `lon telo`, so when that card is on
       the board the noun goes with the adposition and takes no turn in the
       subject/object queue -- otherwise the same word stands in two places
       and one of them is empty. With the card off the board nothing here
       happens and the noun queues as it always did. */
    for(i=0;i<noms.length;i++){
      if(onBoard.ADPOSITION && adpHead[noms[i]]){ roleOf[noms[i]]='ADPOSITION'; continue; }
      role=slots[si++]; roleOf[noms[i]]=role||'MODIFIER';
    }

    /* Everything attached to this noun, by the part of the phrase it is. */
    function modsOf(at, part){
      var m=[], q;
      for(q=0;q<nmods.length;q++) if(nmods[q].to===at && nmods[q].part===part) m.push(nmods[q].at);
      return m;
    }
    function phraseOf(at, role){
      var mine=[], theirs=[], p=[], q, k, part;
      for(q=0;q<adjs.length;q++) if(adjs[q].to===at) mine.push(adjs[q].at);
      for(q=0;q<adps.length;q++) if(adps[q].to===at) theirs.push(adps[q].at);
      if(np.length){
        /* The board's own order, with the noun standing where N stands. A
           part the board names and this sentence has none of contributes
           nothing, which is not an error: the card says where it WOULD go. */
        for(k=0;k<np.length;k++){ part=np[k];
          if(part==='NOUN') p.push(at);
          else if(part==='ADJECTIVE') p=p.concat(mine);
          else p=p.concat(modsOf(at, part));
        }
        /* A board that never names the noun still has to write it, and an
           adjective the board says nothing about keeps the side the
           adjective chapter gave it. Neither is a default put over an
           answer: both are what happens where there is no answer. */
        if(!npOn.NOUN) p.push(at);
        if(!npOn.ADJECTIVE) p=(adjPos==='before')? mine.concat(p) : p.concat(mine);
      }else{
        p=(adjPos==='before')?mine.slice():[];
        p.push(at);
        if(adjPos!=='before') p=p.concat(mine);
      }
      p=(adpPos==='before')?theirs.concat(p):p.concat(theirs);
      for(q=0;q<p.length;q++) if(!seen[p[q]]){ seen[p[q]]=1; out.push(tag(units[p[q]], role)); }
    }
    function verbPhrase(){
      var p=[], q;
      if(verb<0){
        if(!onBoard.NEGATION){ for(q=0;q<negs.length;q++) loose.push(negs[q]); negs=[]; }
        return;
      }
      /* The negation stands beside the verb only while nobody has said where
         it stands. Its own card on the board is that saying, and then the
         verb phrase is the verb. */
      p=(!onBoard.NEGATION && negPos==='before')?negs.slice():[];
      p.push(verb);
      if(!onBoard.NEGATION && negPos!=='before') p=p.concat(negs);
      for(q=0;q<p.length;q++){ seen[p[q]]=1; out.push(tag(units[p[q]],'VERB')); }
    }
    /* A card whose words are simply a run of units -- the adverbs, or the
       negation once it has a place of its own. They come out in the order
       they were written, which is the only order anybody stated. */
    function runOf(list, role){
      var q;
      for(q=0;q<list.length;q++) if(!seen[list[q]]){ seen[list[q]]=1; out.push(tag(units[list[q]], role)); }
    }

    for(i=0;i<order.length;i++){
      role=order[i];
      if(role==='VERB'){ verbPhrase(); continue; }
      if(role==='ADVERB'){ runOf(advs, 'ADVERB'); continue; }
      if(role==='NEGATION'){ runOf(negs, 'NEGATION'); continue; }
      /* Every adposition phrase, not the first: a sentence may say where and
         when, and taking one would leave the other to fall out at the end. */
      if(role==='ADPOSITION'){
        for(j=0;j<noms.length;j++) if(roleOf[noms[j]]==='ADPOSITION' && !seen[noms[j]]) phraseOf(noms[j], 'ADPOSITION');
        continue;
      }
      /* QUESTION is on the board and nothing in this sentence is one: no
         part of speech says a word asks, so there is nothing to place. It is
         not an error and nothing is dropped -- the card simply has no words
         under it in this sentence. */
      for(j=0;j<noms.length;j++) if(roleOf[noms[j]]===role){ phraseOf(noms[j], role); break; }
    }
    if(order.indexOf('VERB')<0) verbPhrase();
    /* EVERY NOUN THE BOARD HAD NO PLACE FOR still follows the sentence. It
       was the third nominal alone -- the one the queue ran out of roles for
       -- because the order was always the same three and a subject or an
       object therefore always had somewhere to stand. A board is what the
       person arranged now, so it may hold neither: 'I eat at sea water' on a
       board of 場所・主語・動詞 lost the object silently, which is the one
       thing arrange() must not do. It keeps the role it was given, so a word
       that is the object is still the object wherever it ends up. */
    for(i=0;i<noms.length;i++) if(!seen[noms[i]]) extra.push(noms[i]);
    for(i=0;i<extra.length;i++) if(!seen[extra[i]]) phraseOf(extra[i], roleOf[extra[i]]||'MODIFIER');
    /* A part of a noun phrase whose noun never got drawn. Nothing somebody
       wrote leaves without being placed -- the same sentence the sweep below
       says, and the one thing arrange() must not do is lose a word. */
    for(i=0;i<nmods.length;i++) if(!seen[nmods[i].at]) loose.push(nmods[i].at);
    loose.sort(function(a,b){ return a-b; });
    for(i=0;i<loose.length;i++) if(!seen[loose[i]]){ seen[loose[i]]=1; out.push(tag(units[loose[i]],'MODIFIER')); }
    /* Nothing somebody wrote leaves without being placed: every kind above
       lands in a phrase, in the verb's phrase, or in `loose`. There was a
       sweep here that put back anything the rules had missed, and it was
       taken out after the check that holds this passed with it gone -- no
       sample could reach it. A net nothing reaches does not catch the next
       bug, it hides it, and leaves the check green for the wrong reason.
       tools/grammar-engine-check.mjs counts the pieces against the units. */
    for(k=0;k<out.length;k++) if(!out[k].role) out[k].role='MODIFIER';
    return out;
  }

  /* A sentence in a natural language, in this language's words and this
     language's order. `complete` is whether every piece of it was found —
     false is not a failure and is not an error, it is the gap, and the gap is
     the door to making that word. */
  function run(model, text){
    var units=api.lexicon.cut(model,text), pieces=arrange(model,units),
        missing=[], roles={}, i;
    for(i=0;i<units.length;i++) if(units[i].kind==='gap') missing.push(units[i].text);
    for(i=0;i<pieces.length;i++){
      if(pieces[i].kind!=='word') continue;
      if(!roles[pieces[i].role]) roles[pieces[i].role]=pieces[i].surface;
      if(pieces[i].role==='VERB' && !roles.PREDICATE) roles.PREDICATE=pieces[i].surface;
    }
    return {originalText:String(text===undefined||text===null?'':text),
            units:units, pieces:pieces, missing:missing,
            complete:missing.length===0, roles:roles};
  }

  function line(result){
    var out=[], i;
    for(i=0;i<result.pieces.length;i++) out.push(result.pieces[i].surface);
    return out.join(' ');
  }

  /* ---- Semantic IR ---------------------------------------------------------
     model.js has carried semanticIR() since Phase 1 with nothing referring to
     it anywhere but its own definition. It is the middle of the whole design:
     「翻訳の中心には言語非依存の中間表現を置く」, so that N languages need N
     readers and N writers rather than N x N translators.

     What makes it language-INDEPENDENT is that a role holds a MEANING and not
     a lemma. `mi poko luma-ka` and `watashi ringo taberu-ta` are two languages
     and one IR: {SUBJECT:'I', OBJECT:'apple', PREDICATE:'eat', TENSE:'PAST'}.
     Put the lemma in and the IR is just the first language again wearing a
     different shape, and the second language cannot be written from it.

     A word means a LIST of things and the first is the one that stands for it
     here -- the same choice lexicon.cut() already makes when it matches. */
  /* tools/es5-check.mjs bans `.find(` -- Array.prototype.find is ES2015 and
     www/ runs in an old WKWebView. This is lexicon's OWN find, and a regular
     expression cannot tell the two apart, so the reference is taken here where
     no call bracket follows it rather than the rule being weakened for both. */
  var lexFind=api.lexicon.find;
  function meaningOf(word){ var ms=api.lexicon.meaningsOf(word); return ms.length?ms[0]:String((word&&word.lemma)||''); }

  /* A parsed sentence, as what it MEANS. The verb's role is PREDICATE here and
     not VERB: VERB is a part of speech, which is a fact about a language, and
     nothing about a language belongs in this object. */
  function toSemantic(model, parsed){
    var roles={}, features={}, i, tok, role, k;
    if(!parsed||!parsed.ok) return null;
    for(i=0;i<parsed.tokens.length;i++){ tok=parsed.tokens[i];
      role=(tok.role==='VERB')?'PREDICATE':tok.role;
      if(!role||roles[role]) continue;
      roles[role]=meaningOf(tok.word);
    }
    for(k in parsed.features) if(Object.prototype.hasOwnProperty.call(parsed.features,k)) features[k]=parsed.features[k];
    return api.semanticIR({roles:roles, features:features});
  }

  /* Which CASE value this language writes for a role, if it writes one at all.
     A language with no case system answers nothing and is arranged by its word
     order alone, which is what it was doing before any of this. */
  function caseFor(model, role){
    var rules=(model&&model.inflections)||[], i, r, v;
    for(i=0;i<rules.length;i++){ r=rules[i];
      if(r.feature!=='CASE') continue;
      v=String(r.value||'').toUpperCase();
      if(CASE_ROLE[v]===role||v===role) return r.value;
    }
    return null;
  }

  /* The other direction: an IR, written out as a sentence of THIS language --
     its words, its order, its marks, its inflections. A meaning this language
     has no word for is a gap and stays as the meaning, for the same reason
     lexicon.cut() leaves one: inventing the word would be worse than showing
     that it is missing, and the gap is the door to making it. */
  /* ---- a sentence inside a sentence ---------------------------------------
     「複文 ── 従属節（〜とき／〜ので／〜なら／〜と言う）の位置と印、関係節
     （「私が見た山」）の位置と印、並列」 OWNER 2026-09-07.

     A subordinate clause is A SENTENCE, so it is written by the same function
     that writes a sentence -- this one, called again on the inner IR. That is
     why it is recursion and not a second writer: a clause obeys this
     language's word order, its case marks and its verb endings exactly as the
     main clause does, and a writer of its own would be a second answer to all
     three.

     `depth` is the one thing recursion needs and the IR cannot promise: an IR
     that carries itself, or two that carry each other, would otherwise be a
     phone that stops. Past the limit the clause is written as its own marker
     and nothing else, which is a short sentence rather than a wrong one. */
  var CLAUSE_DEEP=8;
  /* Where the clause and its mark stand, and both are one answer for the
     whole language, heard in every sentence that uses them -- which is the
     test this app has always applied to giving something a button. */
  function clauseMark(model, marker, gaps){
    var found;
    if(marker===undefined||marker===null||String(marker)==='') return '';
    found=lexFind(model, marker);
    if(found.length) return String(found[0].lemma||'');
    gaps.push(String(marker));
    return String(marker);
  }
  /* One clause, with its mark on the side this language puts it. An empty
     mark is a language that marks it with nothing, which is a real answer and
     not a gap -- Japanese writes 私が見た山 with no word between them. */
  function clauseText(model, rel, gaps, depth, side){
    var inner=fromSemantic(model, (rel&&rel.ir)||null, depth+1), mk, parts=[];
    for(var i=0;i<inner.gaps.length;i++) gaps.push(inner.gaps[i]);
    mk=clauseMark(model, rel&&rel.marker, gaps);
    if(mk && positionOf(model, side)==='before') parts.push(mk);
    if(inner.text) parts.push(inner.text);
    if(mk && positionOf(model, side)!=='before') parts.push(mk);
    return parts.join(' ');
  }
  /* Every clause hanging off this sentence, in the order they were written.
     `relations` has been on semanticIR() since Phase 1 with nothing reading
     it; this is what it is for. */
  function clausesOf(model, ir, gaps, depth){
    var rels=(ir&&ir.relations)||[], out=[], i, r;
    for(i=0;i<rels.length;i++){ r=rels[i];
      if(!r || !r.ir) continue;
      out.push(clauseText(model, r, gaps, depth, 'CLAUSEMARK'));
    }
    return out;
  }
  function fromSemantic(model, ir, depth){
    var order=(model&&model.wordOrder&&model.wordOrder.length)?model.wordOrder:['SUBJECT','OBJECT','VERB'],
        roles=(ir&&ir.roles)||{}, features=(ir&&ir.features)||{},
        seen={}, queue=[], out=[], gaps=[], subs=[], main, vfeat, i, k, role, slot;
    depth=Math.max(0, parseInt(depth,10)||0);
    /* the order this language puts roles in, then anything it has no place for */
    for(i=0;i<order.length;i++){ slot=(order[i]==='VERB')?'PREDICATE':order[i]; if(!seen[slot]){ seen[slot]=true; queue.push(slot); } }
    for(k in roles) if(Object.prototype.hasOwnProperty.call(roles,k)&&!seen[k]){ seen[k]=true; queue.push(k); }
    /* THE VERB AGREES WITH ITS SUBJECT, where this language says verbs do.
       The sentence's own features are the IR's and are never written into --
       a copy is made, because an IR is somebody's meaning and this is one
       language's way of saying it. */
    vfeat=withClass(model, features, roles.SUBJECT);
    for(i=0;i<queue.length;i++){ role=queue[i];
      if(!Object.prototype.hasOwnProperty.call(roles,role)) continue;
      out.push(pieceFor(model, role, roles[role], (role==='PREDICATE')? vfeat : features, gaps, depth));
    }
    main=surfaces(out).join(' ');
    if(depth<CLAUSE_DEEP) subs=clausesOf(model, ir, gaps, depth);
    return {ok:true, text:cxJoin(model, main, subs), pieces:out, gaps:gaps,
            clauses:subs, complete:gaps.length===0};
  }
  /* The sentence's features with the subject's class added, where there is
     one. A copy, never the IR's own object. */
  function withClass(model, features, subject){
    var out={}, k, found, cls;
    for(k in features) if(Object.prototype.hasOwnProperty.call(features,k)) out[k]=features[k];
    if(subject===undefined || subject===null) return out;
    found=lexFind(model, isPhrase(subject)? subject.head : subject);
    if(!found.length) return out;
    cls=classOf(model, found[0]);
    if(cls) out.CLASS=cls;
    return out;
  }
  /* The main clause and what hangs off it, on the side this language says.
     Nothing said is the main clause alone, which is what every sentence
     written before this chapter existed is. */
  function cxJoin(model, main, subs){
    var parts=[], i;
    if(!subs.length) return main;
    if(positionOf(model,'CLAUSE')==='before'){ for(i=0;i<subs.length;i++) parts.push(subs[i]); }
    if(main) parts.push(main);
    if(positionOf(model,'CLAUSE')!=='before'){ for(i=0;i<subs.length;i++) parts.push(subs[i]); }
    return parts.join(' ');
  }

  /* ---- a role that is a NOUN PHRASE ---------------------------------------
     A role of an IR is a MEANING, and a meaning is not always one word: 「この
     赤い山」 is a demonstrative, an adjective and a noun, and a language that
     writes them in another order writes a different sentence out of the same
     meaning. So a role may arrive as a phrase --

       {head:'mountain', mods:{ADJECTIVE:['red'], DEMONSTRATIVE:['this']},
        features:{NUMBER:'PLURAL'}}

     -- and a bare string is still a bare string, which is what every IR
     written before today is. Nothing had to change to keep working.

     `features` on the phrase are the NOUN's own (plural, and the mark for
     its role); `features` of the sentence are the verb's. Those are two
     different things and were one word away from being confused. */
  var NP_PARTS=['DEMONSTRATIVE','NUMERAL','ADJECTIVE','POSSESSOR','RELATIVE'];
  function isPhrase(v){ return !!(v && typeof v==='object' && !Array.isArray(v)); }
  /* One modifier, or several: a noun may have two adjectives on it and the
     list is what somebody meant. A meaning this language has no word for is a
     gap here exactly as it is for a head -- it stays as the meaning, and the
     gap is the door to making that word. */
  function modWords(model, v, gaps, depth, part, cls){
    var out=[], list, i, found, cv, marked;
    /* HOW DEEP IN is read here as well as passed in, and that is not belt and
       braces: a caller that forgot the argument made `depth < CLAUSE_DEEP`
       compare undefined, which is false, and every relative clause was
       dropped in silence. A missing depth is the top of the sentence. */
    depth=Math.max(0, parseInt(depth,10)||0);
    if(v===undefined || v===null) return out;
    list=Array.isArray(v)? v : [v];
    for(i=0;i<list.length;i++){
      /* A RELATIVE CLAUSE IS A SENTENCE hanging on a noun -- 「私が見た山」 --
         so a modifier that carries an `ir` is written by the same writer the
         main clause is, with its own mark on the side this language puts it.
         Where the clause stands relative to the NOUN is not decided here: it
         is the REL card on the noun-phrase board, which is the one place that
         answers it. */
      if(list[i] && typeof list[i]==='object' && list[i].ir){
        if(depth<CLAUSE_DEEP) out.push(clauseText(model, list[i], gaps, depth, 'RELATIVE'));
        continue;
      }
      found=lexFind(model, list[i]);
      if(!found.length){ gaps.push(String(list[i])); out.push(String(list[i])); continue; }
      /* A PART OF A PHRASE MAY CARRY THIS LANGUAGE'S MARK FOR IT. 「所有（〜の）」
         is a mark on the possessor exactly as 「〜が」 is one on the subject,
         and it is asked for by the same function -- caseFor() -- so a language
         that writes one writes it here and a language that does not is
         arranged by its noun-phrase board alone. Nothing else in a phrase has
         a mark today; asking for all of them costs one lookup and means the
         day 「どんな」 gets one, it is already written. */
      cv=part? caseFor(model, part) : null;
      marked={};
      if(cv!==null) marked.CASE=cv;
      /* AND IT AGREES WITH THE NOUN IT IS ON, where this language says words
         do. `cls` is the head's class and is handed down rather than looked up
         again here -- one lookup per phrase, and one answer to which noun this
         modifier belongs to. */
      if(cls) marked.CLASS=cls;
      if(cv===null && !cls){ out.push(String(found[0].lemma||'')); continue; }
      out.push(api.morphology.inflect(model, found[0], marked).surface);
    }
    return out;
  }
  /* The phrase, in the order this language's board says. A part the board
     does not name is written where it has always been written -- the
     adjective on the side its own chapter gives, everything else after the
     noun -- so a chapter nobody has filled in leaves that part OUT of the
     ordering rather than out of the sentence. */
  function npWrite(model, value, headSurface, gaps, depth, cls){
    var order=npOrderOf(model), mods=(isPhrase(value) && value.mods)||{},
        out=[], said={}, i, part;
    if(order.length){
      for(i=0;i<order.length;i++){ part=order[i]; said[part]=1;
        if(part==='NOUN') out.push(headSurface);
        else out=out.concat(modWords(model, mods[part], gaps, depth, part, cls));
      }
      if(!said.NOUN) out.push(headSurface);
      for(i=0;i<NP_PARTS.length;i++) if(!said[NP_PARTS[i]]) out=out.concat(modWords(model, mods[NP_PARTS[i]], gaps, depth, NP_PARTS[i], cls));
      return out;
    }
    out=(positionOf(model,'ADJECTIVE')==='before')? modWords(model, mods.ADJECTIVE, gaps, depth, 'ADJECTIVE', cls) : [];
    out.push(headSurface);
    if(positionOf(model,'ADJECTIVE')!=='before') out=out.concat(modWords(model, mods.ADJECTIVE, gaps, depth, 'ADJECTIVE', cls));
    for(i=0;i<NP_PARTS.length;i++) if(NP_PARTS[i]!=='ADJECTIVE') out=out.concat(modWords(model, mods[NP_PARTS[i]], gaps, depth, NP_PARTS[i], cls));
    return out;
  }

  /* One role of an IR, as this language writes it. The verb takes the
     sentence's features; a nominal takes this language's mark for its role,
     when this language has one, and whatever its own phrase carries. */
  function pieceFor(model, role, value, features, gaps, depth){
    var meaning=isPhrase(value)? value.head : value,
        own=(isPhrase(value) && value.features)||{},
        found=lexFind(model, meaning), word, made, cv, marked, cls, k;
    if(!found.length){
      gaps.push(String(meaning));
      /* A head this language has no word for has no class either -- a class is
         a fact about a word, and there is no word. */
      return {role:role, surface:npWrite(model, value, String(meaning), gaps, depth, null).join(' '), word:null, gap:true};
    }
    word=found[0];
    if(role==='PREDICATE'){ made=api.morphology.inflect(model, word, features); return {role:role, surface:made.surface, word:word, gap:false}; }
    marked={};
    for(k in own) if(Object.prototype.hasOwnProperty.call(own,k)) marked[k]=own[k];
    cv=caseFor(model, role);
    if(cv!==null) marked.CASE=cv;
    /* THE NOUN ITSELF MAY CARRY ITS CLASS. Some languages mark the class on
       the noun and some only on what agrees with it; a language that writes
       neither has no rule and nothing happens. */
    cls=classOf(model, word);
    if(cls) marked.CLASS=cls;
    made=api.morphology.inflect(model, word, marked);
    return {role:role, surface:npWrite(model, value, made.surface, gaps, depth, cls).join(' '), word:word, gap:false};
  }

  function surfaces(pieces){ var out=[], i; for(i=0;i<pieces.length;i++) out.push(pieces[i].surface); return out; }


  /* ---- a line of this language, said in a natural one ---------------------
     OWNER 2026-09-05 「単語はその単語の意味を 文法は並び替えた単語たちが文章
     として成り立つように。きかいほんやくはつかわない。」

     Two halves, and they are the two halves the app already has. The WORDS
     come out of the dictionary -- each one swapped for what its own entry
     says it means, and nothing else, because a word means what its maker
     said it means. The GRAMMAR is the arrangement: morphology.parseSentence()
     says which word is the subject, which the object and which the verb, and
     those three are then put where the reader's own language puts them.

     No hosted model and no network. That is not a limitation to be lifted
     later -- it is the point. Everything this answers is read off the
     dictionary and the grammar stages, so the line reads better tomorrow for
     exactly one reason: somebody filled in more of either. 「単語と文法が埋ま
     れば埋まるだけ投稿の翻訳の精度が上がるっていうのが目的」

     It is the inverse of run() above. run() reads a NATURAL sentence into
     this language; this writes a sentence OF this language out into a natural
     one. Both are the same dictionary and the same grammar, read from the two
     ends, which is why a chat or a translator built on this later has one
     thing to call rather than two. */
  function isSOV(lang){ var l=String(lang||'').toLowerCase(); return l==='ja'||l==='ko'; }

  /* Where a word stands, per interface language. Ten languages, two shapes:
     Japanese and Korean put the verb last, the other eight put it in the
     middle. This is a fact about those ten languages and not a setting -- a
     language nobody named is read as SVO, which eight of the ten are. */
  function targetOrder(lang){
    return isSOV(lang) ? ['SUBJECT','OBJECT','VERB'] : ['SUBJECT','VERB','OBJECT'];
  }

  /* What the sentence does that no single word carries. NEGATION and TENSE
     are on the parse as features, so they are written as the smallest mark
     the target language would recognise and put at the end of the line.

     Only ja and en have one. That is deliberate: a mark that is nearly right
     reads worse than no mark, and the eight other languages inflect their
     verb rather than append a particle -- writing "no" or "nicht" at the end
     of a Spanish or German line would be inventing a grammar those readers
     can see is wrong. They get the arrangement, which is true, and nothing
     that is not. */
  function marksFor(lang, features){
    var l=String(lang||'').toLowerCase(), out=[], past;
    if(!features) return out;
    past=String(features.TENSE||'').toUpperCase()==='PAST';
    if(l==='ja'){ if(features.NEGATION) out.push('ない'); if(past) out.push('た'); return out; }
    if(l==='en'){ if(features.NEGATION) out.push('not'); if(past) out.push('(past)'); return out; }
    return out;
  }

  /* One word of this language, as what it means. A word the dictionary does
     not have comes back as itself, which is the truth about it and is the
     same answer the gloss has always given. */
  function glossToken(model, surface){
    var parsed=api.morphology.parseToken(model, surface);
    if(!parsed||!parsed.word) return String(surface);
    return meaningOf(parsed.word);
  }
  /* Every word of the line, in the order it was typed. This is what is left
     when the grammar has nothing to say -- a line the reader could not parse,
     or one where no word took a role -- and it is not a failure: it is the
     words, which is most of what somebody needs, and it is what the composer
     showed before any of this existed. */
  function glossLine(model, text){
    var parts=String(text===undefined||text===null?'':text).replace(/^\s+|\s+$/g,'').split(/\s+/),
        out=[], i;
    for(i=0;i<parts.length;i++){ if(parts[i]) out.push(glossToken(model, parts[i])); }
    return out.join(' ');
  }

  /* The line, in the reader's own language. A string, because that is what
     the meaning field of a post holds and what it falls back to.

     Only the three words that HAVE a role move, and they move into the places
     those three were already standing in. Everything else stays exactly where
     it was written -- an adjective, a particle, a word the queue had no role
     left for. Moving those would need a rule nobody has written down, and
     inventing one is the thing this must not do. */
  function toNatural(model, text, lang){
    var parsed=api.morphology.parseSentence(model, text),
        order=targetOrder(lang), slots=[], moved=[], said=[], out=[],
        marks, i, j, role;
    if(!parsed||!parsed.ok) return glossLine(model, text);
    for(i=0;i<parsed.tokens.length;i++){
      role=parsed.tokens[i].role;
      if(role==='SUBJECT'||role==='OBJECT'||role==='VERB') slots.push(i);
    }
    if(!slots.length) return glossLine(model, text);
    for(i=0;i<order.length;i++){
      for(j=0;j<parsed.tokens.length;j++) if(parsed.tokens[j].role===order[i]){ moved.push(j); break; }
    }
    for(i=0;i<parsed.tokens.length;i++) said.push(meaningOf(parsed.tokens[i].word));
    out=said.slice(0);
    for(i=0;i<slots.length&&i<moved.length;i++) out[slots[i]]=said[moved[i]];
    marks=marksFor(lang, parsed.features);
    for(i=0;i<marks.length;i++) out.push(marks[i]);
    return out.join(' ');
  }

  api.translate={run:run, arrange:arrange, line:line, positionOf:positionOf, markedIds:markedIds, srcOrder:srcOrder, toSemantic:toSemantic, fromSemantic:fromSemantic, toNatural:toNatural, glossLine:glossLine, npOrderOf:npOrderOf};
}(typeof window!=='undefined'?window:this));
