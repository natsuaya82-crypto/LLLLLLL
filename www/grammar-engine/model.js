/* Lingua Grammar Engine v2 model. ES5 plain-script module. */
(function(root){
  'use strict';
  var VERSION=2;
  function id(prefix){ return prefix+'_'+String(new Date().getTime())+'_'+String(Math.floor(Math.random()*100000)); }
  function object(src){ var out={},k; if(!src||typeof src!=='object') return out; for(k in src) if(Object.prototype.hasOwnProperty.call(src,k)) out[k]=src[k]; return out; }
  function array(src){ var out=[],i; if(!Array.isArray(src)) return out; for(i=0;i<src.length;i++) out.push(src[i]); return out; }
  /* `meaning` is the joined string and `meanings` is the list the dictionary
     actually carries. Both, because a lookup FROM a meaning needs the list and
     everything written before this reads the string. A model saved without the
     list keeps working: the lexicon beside this file splits the
     string when the list is empty. (Naming that file here rather than
     describing it would have been enough to satisfy assets-check, which
     counts a mention in ANY loaded .js -- including one inside a comment --
     as the file being referenced. It is not loaded by being mentioned.) */
  function word(data){ data=data||{}; return {id:data.id||id('word'),lemma:data.lemma||'',meaning:data.meaning||'',meanings:array(data.meanings),partOfSpeech:data.partOfSpeech||null,morphemeIds:array(data.morphemeIds),metadata:object(data.metadata)}; }
  function morpheme(data){ data=data||{}; return {id:data.id||id('morph'),form:data.form||'',gloss:data.gloss||'',type:data.type||'root',metadata:object(data.metadata)}; }
  function derivation(data){ data=data||{}; return {id:data.id||id('deriv'),sourcePartOfSpeech:data.sourcePartOfSpeech||null,targetPartOfSpeech:data.targetPartOfSpeech||null,operation:data.operation||'suffix',morphemeId:data.morphemeId||null,form:data.form||null,separator:data.separator===undefined?'-':data.separator,conditions:object(data.conditions),metadata:object(data.metadata)}; }
  function inflection(data){ data=data||{}; return {id:data.id||id('infl'),target:data.target||'WORD',feature:data.feature||null,value:data.value||null,operation:data.operation||'suffix',morphemeId:data.morphemeId||null,form:data.form||null,separator:data.separator===undefined?'-':data.separator,conditions:object(data.conditions),metadata:object(data.metadata)}; }
  function grammarRule(data){ data=data||{}; return {id:data.id||id('rule'),type:data.type||'syntax',target:data.target||null,feature:data.feature||null,operation:data.operation||null,value:data.value===undefined?null:data.value,conditions:object(data.conditions),metadata:object(data.metadata)}; }
  function sentence(data){ data=data||{}; return {id:data.id||id('sentence'),languageId:data.languageId||null,originalText:data.originalText||'',tokens:array(data.tokens),parsedStructure:data.parsedStructure||null,semanticId:data.semanticId||null,metadata:object(data.metadata)}; }
  function semanticIR(data){ data=data||{}; return {version:1,id:data.id||id('sem'),languageIndependent:true,roles:object(data.roles),features:object(data.features),relations:array(data.relations),metadata:object(data.metadata)}; }
  function wordOrder(value){ var map={S:'SUBJECT',O:'OBJECT',V:'VERB'}; var out=[],i,s;
    if(typeof value==='string') value=value.split('');
    if(!Array.isArray(value)) return out;
    for(i=0;i<value.length;i++){ s=String(value[i]).toUpperCase(); out.push(map[s]||s); }
    return out;
  }
  function languageModel(data){ data=data||{}; return {schema:'lingua.grammar',version:VERSION,languageId:data.languageId||null,wordOrder:wordOrder(data.wordOrder),words:array(data.words),morphemes:array(data.morphemes),derivations:array(data.derivations),inflections:array(data.inflections),grammarRules:array(data.grammarRules),sentences:array(data.sentences),metadata:object(data.metadata)}; }
  root.LinguaGrammarEngine={VERSION:VERSION,word:word,morpheme:morpheme,derivation:derivation,inflection:inflection,grammarRule:grammarRule,sentence:sentence,semanticIR:semanticIR,languageModel:languageModel,wordOrder:wordOrder};
}(typeof window!=='undefined'?window:this));