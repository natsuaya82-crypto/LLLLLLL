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

   It is not postTr() and not TR_SEAM. Those are layer TWO: the meaning of a
   post, translated into another NATURAL language when it is written, frozen
   onto the post, and waiting on a hosted model that does not exist. This one
   is natural → your own language, computed now, offline, costing nothing, and
   it is right that it is not frozen: a line that half-rendered yesterday
   renders fully today because the dictionary grew. docs/FEATURES.md calls
   freezing that one the bug.

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
    if(p==='ADPOSITION') return 'ADPOSITION';
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
        kinds=[], adjs=[], adps=[], negs=[], loose=[], noms=[], verb=-1,
        adjPos=positionOf(model,'ADJECTIVE'), adpPos=positionOf(model,'ADPOSITION'),
        negPos=positionOf(model,'NEGATION'),
        i, j, k, slots=[], si=0, role, roleOf=[], head, out=[], phrase, extra=[], seen={};

    for(i=0;i<units.length;i++) kinds.push(kindOf(model,units[i],negIds,adpIds));
    for(i=0;i<units.length;i++){
      if(kinds[i]==='NOMINAL') noms.push(i);
      else if(kinds[i]==='VERB' && verb<0) verb=i;
      else if(kinds[i]==='VERB') loose.push(i);
    }
    for(i=0;i<units.length;i++){
      if(kinds[i]==='ADJECTIVE'){ j=attach(kinds,i); if(j<0) loose.push(i); else adjs.push({at:i, to:j}); }
      else if(kinds[i]==='ADPOSITION'){ j=attach(kinds,i); if(j<0) loose.push(i); else adps.push({at:i, to:j}); }
      else if(kinds[i]==='NEGATION'){ if(verb<0) loose.push(i); else negs.push(i); }
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
    for(i=0;i<noms.length;i++){ role=slots[si++]; roleOf[noms[i]]=role||'MODIFIER'; }

    function phraseOf(at, role){
      var mine=[], theirs=[], p=[], q;
      for(q=0;q<adjs.length;q++) if(adjs[q].to===at) mine.push(adjs[q].at);
      for(q=0;q<adps.length;q++) if(adps[q].to===at) theirs.push(adps[q].at);
      p=(adjPos==='before')?mine.slice():[];
      p.push(at);
      if(adjPos!=='before') p=p.concat(mine);
      p=(adpPos==='before')?theirs.concat(p):p.concat(theirs);
      for(q=0;q<p.length;q++){ seen[p[q]]=1; out.push(tag(units[p[q]], role)); }
    }
    function verbPhrase(){
      var p=[], q;
      if(verb<0){ for(q=0;q<negs.length;q++) loose.push(negs[q]); negs=[]; return; }
      p=(negPos==='before')?negs.slice():[];
      p.push(verb);
      if(negPos!=='before') p=p.concat(negs);
      for(q=0;q<p.length;q++){ seen[p[q]]=1; out.push(tag(units[p[q]],'VERB')); }
    }

    for(i=0;i<noms.length;i++) if(roleOf[noms[i]]==='MODIFIER') extra.push(noms[i]);
    for(i=0;i<order.length;i++){
      role=order[i];
      if(role==='VERB'){ verbPhrase(); continue; }
      for(j=0;j<noms.length;j++) if(roleOf[noms[j]]===role){ phraseOf(noms[j], role); break; }
    }
    if(order.indexOf('VERB')<0) verbPhrase();
    for(i=0;i<extra.length;i++) if(!seen[extra[i]]) phraseOf(extra[i],'MODIFIER');
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
  function fromSemantic(model, ir){
    var order=(model&&model.wordOrder&&model.wordOrder.length)?model.wordOrder:['SUBJECT','OBJECT','VERB'],
        roles=(ir&&ir.roles)||{}, features=(ir&&ir.features)||{},
        seen={}, queue=[], out=[], gaps=[], i, k, role, slot;
    /* the order this language puts roles in, then anything it has no place for */
    for(i=0;i<order.length;i++){ slot=(order[i]==='VERB')?'PREDICATE':order[i]; if(!seen[slot]){ seen[slot]=true; queue.push(slot); } }
    for(k in roles) if(Object.prototype.hasOwnProperty.call(roles,k)&&!seen[k]){ seen[k]=true; queue.push(k); }
    for(i=0;i<queue.length;i++){ role=queue[i];
      if(!Object.prototype.hasOwnProperty.call(roles,role)) continue;
      out.push(pieceFor(model, role, roles[role], features, gaps));
    }
    return {ok:true, text:surfaces(out).join(' '), pieces:out, gaps:gaps, complete:gaps.length===0};
  }

  /* One role of an IR, as this language writes it. The verb takes the
     sentence's features; a nominal takes this language's mark for its role,
     when this language has one. */
  function pieceFor(model, role, meaning, features, gaps){
    var found=lexFind(model, meaning), word, made, cv, marked;
    if(!found.length){ gaps.push(meaning); return {role:role, surface:String(meaning), word:null, gap:true}; }
    word=found[0];
    if(role==='PREDICATE'){ made=api.morphology.inflect(model, word, features); return {role:role, surface:made.surface, word:word, gap:false}; }
    cv=caseFor(model, role);
    if(cv===null) return {role:role, surface:String(word.lemma||''), word:word, gap:false};
    marked={}; marked.CASE=cv;
    made=api.morphology.inflect(model, word, marked);
    return {role:role, surface:made.surface, word:word, gap:false};
  }

  function surfaces(pieces){ var out=[], i; for(i=0;i<pieces.length;i++) out.push(pieces[i].surface); return out; }

  api.translate={run:run, arrange:arrange, line:line, positionOf:positionOf, markedIds:markedIds, srcOrder:srcOrder, toSemantic:toSemantic, fromSemantic:fromSemantic};
}(typeof window!=='undefined'?window:this));
