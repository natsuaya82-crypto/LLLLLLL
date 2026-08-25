/* Lingua Grammar Engine v2 morphology and minimal sentence reader. ES5 only. */
(function(root){
  'use strict';
  var api=root.LinguaGrammarEngine;
  if(!api) throw new Error('LinguaGrammarEngine model must load before morphology');
  function findById(items,id){ var i; for(i=0;i<items.length;i++) if(items[i].id===id) return items[i]; return null; }
  function formOf(model,rule){ var m=findById(model.morphemes||[],rule.morphemeId); return rule.form!==null&&rule.form!==undefined?String(rule.form):(m?String(m.form||''):''); }
  function applies(rule,word){ return rule.target==='WORD'||!rule.target||rule.target===word.partOfSpeech; }
  function add(form,rule,piece){ var sep=rule.separator===undefined?'-':String(rule.separator); if(rule.operation==='prefix') return piece+(sep?sep:'')+form; if(rule.operation==='suffix') return form+(sep?sep:'')+piece; if(rule.operation==='replace') return piece; throw new Error('Unsupported morphology operation: '+rule.operation); }
  function featureMatches(rule,features){ return features && features[rule.feature]===rule.value; }
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
  function lookupWord(model,lemma){ var words=model.words||[],i; for(i=0;i<words.length;i++) if(words[i].lemma===lemma) return words[i]; return null; }
  function parseToken(model,text){ var words=model.words||[],i,w,a; for(i=0;i<words.length;i++){ w=words[i]; a=analyzeForm(model,text,w); if(a.lemma===w.lemma) return {word:w,lemma:w.lemma,inflections:a.inflections,surface:text}; } return null; }
  function parseSentence(model,text){ var parts=String(text||'').replace(/^\s+|\s+$/g,'').split(/\s+/), tokens=[], i, parsed, role, order=model.wordOrder||[], roles={}, features={}, rule, j;
    for(i=0;i<parts.length;i++){ parsed=parseToken(model,parts[i]); if(!parsed && i+1<parts.length){
        for(j=0;j<(model.inflections||[]).length;j++){ rule=model.inflections[j]; if(rule.operation==='prefix' && String(rule.separator)===' ' && formOf(model,rule)===parts[i]){ parsed=parseToken(model,parts[i+1]); if(parsed&&applies(rule,parsed.word)){ parsed.inflections.push(rule); parsed.surface=parts[i]+' '+parts[i+1]; i++; break; } } }
      }
      if(!parsed) return {ok:false,error:'Unknown or invalid word: '+parts[i],originalText:text};
      tokens.push(parsed);
    }
    for(i=0;i<tokens.length;i++){ role=order[i]||'MODIFIER'; roles[role]=tokens[i].lemma; if(role==='VERB') roles.PREDICATE=tokens[i].lemma; for(j=0;j<tokens[i].inflections.length;j++){ rule=tokens[i].inflections[j]; features[rule.feature]=rule.value; } }
    return {ok:true,originalText:text,tokens:tokens,roles:roles,features:features};
  }
  api.morphology={inflect:inflect,analyzeForm:analyzeForm,parseToken:parseToken,parseSentence:parseSentence,lookupWord:lookupWord};
}(typeof window!=='undefined'?window:this));