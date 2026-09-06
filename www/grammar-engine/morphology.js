/* Lingua Grammar Engine v2 morphology and minimal sentence reader. ES5 only. */
(function(root){
  'use strict';
  var api=root.LinguaGrammarEngine;
  if(!api) throw new Error('LinguaGrammarEngine model must load before morphology');
  function findById(items,id){ var i; for(i=0;i<items.length;i++) if(items[i].id===id) return items[i]; return null; }
  function formOf(model,rule){ var m=findById(model.morphemes||[],rule.morphemeId); return rule.form!==null&&rule.form!==undefined?String(rule.form):(m?String(m.form||''):''); }
/* ---- when a rule has anything to say about a word ------------------------
     Two questions, and they were one. `target` is the part of speech and has
     been asked since Phase 1. `conditions` has been on the model since then
     too and **nothing read it** -- so a rule written for one shape of word
     fired on every word, silently, and a language with two endings that share
     a feature produced both at once.

     `endsWith` is the one condition a string engine can answer honestly: this
     word ends in these letters. 「英語みたいにyで終わるのはiに変えてedみたいな
     細かいルール」 is exactly it. A condition about SOUND -- after a vowel, after
     a consonant -- is not here and must not be faked: this file has no
     phonology and inventing one would be the engine deciding how somebody's
     language sounds. What cannot be expressed is left out by the caller rather
     than approximated here. */
  function conditionsHold(rule,word){
    var c=rule.conditions, e, s;
    if(!c) return true;
    e=c.endsWith;
    if(e!==undefined && e!==null && String(e)!==''){
      s=String(word&&word.lemma||'');
      e=String(e);
      if(s.length<e.length || s.slice(s.length-e.length)!==e) return false;
    }
    return true;
  }
  function applies(rule,word){
    if(!(rule.target==='WORD'||!rule.target||rule.target===word.partOfSpeech)) return false;
    return conditionsHold(rule,word);
  }
  function derives(rule,partOfSpeech){ return !rule.sourcePartOfSpeech||rule.sourcePartOfSpeech===partOfSpeech; }
  function derivesWord(rule,word){ return derives(rule,word&&word.partOfSpeech)&&conditionsHold(rule,word); }
/* The stem, less whatever this rule takes off it. Off the END either way --
     a prefix that changes the stem changes it in the same place a suffix does,
     and that is what the app's own rule editor does. Never all of it: a rule
     that ate the word would make every verb the same form of itself. */
  function stemOf(form,rule){
    var d=Math.max(0,parseInt(rule&&rule.drop,10)||0);
    if(!d) return form;
    return form.slice(0, Math.max(1, form.length-d));
  }
  function add(form,rule,piece){ var sep=rule.separator===undefined?'-':String(rule.separator);
    if(rule.operation==='replace') return piece;
    form=stemOf(form,rule);
    if(rule.operation==='prefix') return piece+(sep?sep:'')+form;
    if(rule.operation==='suffix') return form+(sep?sep:'')+piece;
    throw new Error('Unsupported morphology operation: '+rule.operation); }
  function featureMatches(rule,features){ return features && features[rule.feature]===rule.value; }
  /* ---- case ---------------------------------------------------------------
     Until now a role came out of POSITION alone -- translate.js says it in so
     many words: "Roles come out of the word order the language chose". That
     makes languages that mark a role on the word itself unbuildable, which is
     most of the ones with a case system and every one with case particles.
     A word carrying a CASE inflection now keeps that role wherever it stands.

     Word order is untouched and still decides every word that carries no mark.
     Position OR mark, or both in one sentence -- not one replacing the other.

     A language may write the role directly (`value:'SUBJECT'`), which is what
     somebody with no case tradition behind them would write, so a value this
     table does not know is taken as the role it names rather than dropped. */
  var CASE_ROLE={NOMINATIVE:'SUBJECT',ERGATIVE:'SUBJECT',ABSOLUTIVE:'SUBJECT',ACCUSATIVE:'OBJECT',DATIVE:'RECIPIENT',GENITIVE:'POSSESSOR',INSTRUMENTAL:'INSTRUMENT',LOCATIVE:'PLACE',ABLATIVE:'SOURCE',VOCATIVE:'ADDRESSEE'};
  function caseRole(token){ var i,r,v; for(i=0;i<token.inflections.length;i++){ r=token.inflections[i]; if(r.feature!=='CASE') continue; v=String(r.value||'').toUpperCase(); return CASE_ROLE[v]||v; } return null; }
  /* Reading a surface back to its lemma. A rule that CHANGES THE STEM cannot
     be walked backwards from the surface alone -- taking `ied` off `carried`
     leaves `carr`, and what went missing is not written anywhere on the word.
     So those rules are not tried here, and that is not a hole: the app writes
     every form it makes into the dictionary as a word of its own, so `carried`
     is found by looking it up, with its own entry saying what it is a form of.
     Guessing `carry` back out of `carr` would be inventing somebody's word. */
  function analyzeForm(model,surface,word){ var rules=model.inflections||[],i,r,piece,sep,mark,hit=[],changed=true;
    surface=String(surface||'');
    while(changed){ changed=false; for(i=0;i<rules.length;i++){ r=rules[i]; piece=formOf(model,r); sep=r.separator===undefined?'-':String(r.separator); mark=(r.operation==='prefix'?piece+sep:sep+piece);
      if(!piece||r.drop||!applies(r,word)) continue;
      if(r.operation==='suffix' && surface.length>mark.length && surface.slice(-mark.length)===mark){ surface=surface.slice(0,-mark.length); hit.push(r); changed=true; break; }
      if(r.operation==='prefix' && surface.length>mark.length && surface.slice(0,mark.length)===mark){ surface=surface.slice(mark.length); hit.push(r); changed=true; break; }
    }}
    return {lemma:surface,inflections:hit};
  }
/* ---- ONE FEATURE, ONE ENDING --------------------------------------------
     Every matching rule used to fire, in file order, each one on top of the
     last. A language that says "after y it is -ied, otherwise -ed" therefore
     produced `carrieded`: both rules are about TENSE=PAST and both matched.
     Nothing threw and nothing was empty -- it is simply not a word.

     A feature is spent once. The FIRST rule that matches a feature is the one
     that happens, and the rest of that feature is done. So the specific rule
     has to stand before the general one, which is how an ordered set of
     morphological rules has always worked; the caller that builds this model
     from what somebody wrote is what puts them in that order. */
  function inflect(model,word,features){ var rules=model.inflections||[],i,r,out=word.lemma,used=[],spent={},k;
    for(i=0;i<rules.length;i++){ r=rules[i];
      if(!applies(r,word)||!featureMatches(r,features)) continue;
      k=String(r.feature);
      if(spent[k]) continue;
      spent[k]=1;
      out=add(out,r,formOf(model,r)); used.push(r);
    }
    return {surface:out,lemma:word.lemma,inflections:used}; }
  /* ---- derivation ---------------------------------------------------------
     An inflection makes another FORM of the same word; a derivation makes a
     different word, of a different part of speech. `derivation()` has been in
     model.js since Phase 1 with nothing in www/ that applied it, so a language
     could declare NOUN + suffix `li` -> ADJECTIVE and the engine would never
     make `beauty-li`, nor read it back. These three are that missing side, and
     they are deliberately the same shape as inflect/analyzeForm above so the
     two kinds of rule are told apart by what they mean, not by how they are
     called. */
  /* And one derivation makes one word, for the same reason: two rules that
     both turn a noun into an adjective are two ways of doing it, not two
     things done one after the other. The first that matches is the one. */
  function derive(model,word,targetPartOfSpeech){ var rules=model.derivations||[],i,r,out=word.lemma,used=[],pos=word.partOfSpeech;
    for(i=0;i<rules.length;i++){ r=rules[i];
      if(!formOf(model,r)||!derivesWord(r,word)) continue;
      if(targetPartOfSpeech&&r.targetPartOfSpeech!==targetPartOfSpeech) continue;
      out=add(out,r,formOf(model,r)); used.push(r); pos=r.targetPartOfSpeech||pos;
      break;
    }
    return {surface:out,lemma:word.lemma,partOfSpeech:pos,derivations:used};
  }
  /* The reverse: given the word it may have been made FROM, take the mark off
     and say what the form became. One step, not a chain -- a chained form
     carries its outermost mark last, so reading it needs a search this does
     not do, and claiming otherwise would be a lie the tests could not see. */
  function analyzeDerivation(model,surface,word){ var rules=model.derivations||[],i,r,piece,sep,mark,src=(word&&word.partOfSpeech)||null;
    surface=String(surface||'');
    for(i=0;i<rules.length;i++){ r=rules[i]; piece=formOf(model,r); sep=r.separator===undefined?'-':String(r.separator); mark=(r.operation==='prefix'?piece+sep:sep+piece);
      if(!piece||r.drop||!derives(r,src)) continue;
      if(r.operation==='suffix' && surface.length>mark.length && surface.slice(-mark.length)===mark) return {lemma:surface.slice(0,-mark.length),derivations:[r],partOfSpeech:r.targetPartOfSpeech||src};
      if(r.operation==='prefix' && surface.length>mark.length && surface.slice(0,mark.length)===mark) return {lemma:surface.slice(mark.length),derivations:[r],partOfSpeech:r.targetPartOfSpeech||src};
    }
    return {lemma:surface,derivations:[],partOfSpeech:src};
  }
  /* A derived form is read from the outside in: whatever inflections it
     carries belong to what it BECAME, so those come off first and the mark
     that made it comes off after. Which part of speech to read those
     inflections as is what this word's own derivation rules say it could have
     turned into -- so the candidate part of speech comes from the rule, and
     the rule is then confirmed by analyzeDerivation. */
  function parseDerived(model,text){ var words=model.words||[],rules=model.derivations||[],i,j,w,r,virtual,a,d;
    for(i=0;i<words.length;i++){ w=words[i];
      for(j=0;j<rules.length;j++){ r=rules[j];
        if(!formOf(model,r)||r.drop||!derivesWord(r,w)) continue;
        virtual={id:w.id,lemma:w.lemma,meaning:w.meaning,meanings:w.meanings,partOfSpeech:r.targetPartOfSpeech||w.partOfSpeech,morphemeIds:w.morphemeIds,metadata:w.metadata};
        a=analyzeForm(model,text,virtual);
        d=analyzeDerivation(model,a.lemma,w);
        if(d.derivations.length && d.lemma===w.lemma) return {word:virtual,lemma:w.lemma,inflections:a.inflections,derivations:d.derivations,surface:text};
      }
    }
    return null;
  }
  function lookupWord(model,lemma){ var words=model.words||[],i; for(i=0;i<words.length;i++) if(words[i].lemma===lemma) return words[i]; return null; }
  function parseToken(model,text){ var words=model.words||[],i,w,a; for(i=0;i<words.length;i++){ w=words[i]; a=analyzeForm(model,text,w); if(a.lemma===w.lemma) return {word:w,lemma:w.lemma,inflections:a.inflections,derivations:[],surface:text}; } return parseDerived(model,text); }
  var NOT_A_SLOT={VERB:1, ADVERB:1, ADPOSITION:1, NEGATION:1, QUESTION:1};
  function parseSentence(model,text){ var parts=String(text||'').replace(/^\s+|\s+$/g,'').split(/\s+/), tokens=[], i, parsed, role, order=model.wordOrder||[], roles={}, features={}, rule, j, next, slots=[], si=0, vi=-1, marked=[], taken={};
    for(i=0;i<parts.length;i++){ parsed=parseToken(model,parts[i]); if(!parsed && i+1<parts.length){
        for(j=0;j<(model.inflections||[]).length;j++){ rule=model.inflections[j]; if(rule.operation==='prefix' && String(rule.separator)===' ' && formOf(model,rule)===parts[i]){ next=parseToken(model,parts[i+1]); if(next&&applies(rule,next.word)){ next.inflections.push(rule); next.surface=parts[i]+' '+parts[i+1]; parsed=next; i++; break; } } }
      }
      if(!parsed) return {ok:false,error:'Unknown or invalid word: '+parts[i],originalText:text};
      /* A particle standing AFTER the word it marks -- `mi ga`. The mirror of
         the space-separated prefix above, and the other way a language writes
         a case: attached (`mi-ga`, which the ordinary suffix already reads) or
         standing apart as its own word. This one looks FORWARD, because the
         word before it parsed perfectly well on its own. */
      if(i+1<parts.length){ for(j=0;j<(model.inflections||[]).length;j++){ rule=model.inflections[j];
        if(rule.operation==='suffix' && String(rule.separator)===' ' && formOf(model,rule)===parts[i+1] && applies(rule,parsed.word)){ parsed.inflections.push(rule); parsed.surface=parts[i]+' '+parts[i+1]; i++; break; } } }
      tokens.push(parsed);
    }
    /* The verb is found by what it is, not by where it stands. Roles were
       handed out by position alone, so a sentence shorter than the word order
       put the verb in the OBJECT slot and left nothing as the PREDICATE --
       ok:true, and wrong. The rest still go in the language's own order, with
       the verb's place taken out of the queue. */
    /* Only the roles a NOUN can take queue for a place. A word order is a
       list of roles now and not always three, so ADVERB or NEGATION standing
       in it would otherwise be handed to the first noun that came along --
       the same fault the verb's own place had before it was found by what it
       is. What is not in this list still queues, because a role nobody here
       has heard of is somebody's and is most likely a nominal one. */
    for(i=0;i<order.length;i++) if(!NOT_A_SLOT[order[i]]) slots.push(order[i]);
    for(i=0;i<tokens.length;i++) if(tokens[i].word.partOfSpeech==='VERB'){ vi=i; break; }
    /* A marked word takes its role first, and the place it would have stood in
       is then taken OUT of the positional queue -- otherwise the mark gives it
       one role and the queue hands the same role to somebody else. */
    for(i=0;i<tokens.length;i++){ marked.push(caseRole(tokens[i])); if(marked[i]) taken[marked[i]]=true; }
    for(i=0;i<tokens.length;i++){
      if(i===vi) role='VERB';
      else if(marked[i]) role=marked[i];
      else { while(si<slots.length&&taken[slots[si]]) si++; role=slots[si++]||'MODIFIER'; }
      roles[role]=tokens[i].lemma; if(role==='VERB') roles.PREDICATE=tokens[i].lemma;
      tokens[i].role=role;
      /* CASE is what this ONE word is doing, not what the sentence is doing --
         it has already been said, in `roles`. Putting it in the sentence's
         features would leave two marked words overwriting each other there. */
      for(j=0;j<tokens[i].inflections.length;j++){ rule=tokens[i].inflections[j]; if(rule.feature==='CASE') continue; features[rule.feature]=rule.value; }
    }
    return {ok:true,originalText:text,tokens:tokens,roles:roles,features:features};
  }
  api.morphology={inflect:inflect,analyzeForm:analyzeForm,derive:derive,analyzeDerivation:analyzeDerivation,parseToken:parseToken,parseSentence:parseSentence,lookupWord:lookupWord,CASE_ROLE:CASE_ROLE};
}(typeof window!=='undefined'?window:this));