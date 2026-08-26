/* Lingua Grammar Engine v2 morphology and minimal sentence reader. ES5 only. */
(function(root){
  'use strict';
  var api=root.LinguaGrammarEngine;
  if(!api) throw new Error('LinguaGrammarEngine model must load before morphology');
  function findById(items,id){ var i; for(i=0;i<items.length;i++) if(items[i].id===id) return items[i]; return null; }
  function formOf(model,rule){ var m=findById(model.morphemes||[],rule.morphemeId); return rule.form!==null&&rule.form!==undefined?String(rule.form):(m?String(m.form||''):''); }
  function applies(rule,word){ return rule.target==='WORD'||!rule.target||rule.target===word.partOfSpeech; }
  function derives(rule,partOfSpeech){ return !rule.sourcePartOfSpeech||rule.sourcePartOfSpeech===partOfSpeech; }
  function add(form,rule,piece){ var sep=rule.separator===undefined?'-':String(rule.separator); if(rule.operation==='prefix') return piece+(sep?sep:'')+form; if(rule.operation==='suffix') return form+(sep?sep:'')+piece; if(rule.operation==='replace') return piece; throw new Error('Unsupported morphology operation: '+rule.operation); }
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
  function analyzeForm(model,surface,word){ var rules=model.inflections||[],i,r,piece,sep,mark,hit=[],changed=true;
    surface=String(surface||'');
    while(changed){ changed=false; for(i=0;i<rules.length;i++){ r=rules[i]; piece=formOf(model,r); sep=r.separator===undefined?'-':String(r.separator); mark=(r.operation==='prefix'?piece+sep:sep+piece);
      if(!piece||!applies(r,word)) continue;
      if(r.operation==='suffix' && surface.length>mark.length && surface.slice(-mark.length)===mark){ surface=surface.slice(0,-mark.length); hit.push(r); changed=true; break; }
      if(r.operation==='prefix' && surface.length>mark.length && surface.slice(0,mark.length)===mark){ surface=surface.slice(mark.length); hit.push(r); changed=true; break; }
    }}
    return {lemma:surface,inflections:hit};
  }
  function inflect(model,word,features){ var rules=model.inflections||[],i,r,out=word.lemma,used=[]; for(i=0;i<rules.length;i++){ r=rules[i]; if(applies(r,word)&&featureMatches(r,features)){ out=add(out,r,formOf(model,r)); used.push(r); } } return {surface:out,lemma:word.lemma,inflections:used}; }
  /* ---- derivation ---------------------------------------------------------
     An inflection makes another FORM of the same word; a derivation makes a
     different word, of a different part of speech. `derivation()` has been in
     model.js since Phase 1 with nothing in www/ that applied it, so a language
     could declare NOUN + suffix `li` -> ADJECTIVE and the engine would never
     make `beauty-li`, nor read it back. These three are that missing side, and
     they are deliberately the same shape as inflect/analyzeForm above so the
     two kinds of rule are told apart by what they mean, not by how they are
     called. */
  function derive(model,word,targetPartOfSpeech){ var rules=model.derivations||[],i,r,out=word.lemma,used=[],pos=word.partOfSpeech;
    for(i=0;i<rules.length;i++){ r=rules[i];
      if(!formOf(model,r)||!derives(r,pos)) continue;
      if(targetPartOfSpeech&&r.targetPartOfSpeech!==targetPartOfSpeech) continue;
      out=add(out,r,formOf(model,r)); used.push(r); pos=r.targetPartOfSpeech||pos;
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
      if(!piece||!derives(r,src)) continue;
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
        if(!formOf(model,r)||!derives(r,w.partOfSpeech)) continue;
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
    for(i=0;i<order.length;i++) if(order[i]!=='VERB') slots.push(order[i]);
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