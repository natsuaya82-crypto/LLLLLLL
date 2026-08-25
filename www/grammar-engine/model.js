/* Lingua — Grammar Engine v2: language model
   Phase 1 only. No UI, no parser, no generator, no migration.
   ES5 only: this runs in the existing plain-script environment.

   The important rule here is that language knowledge is data, not prose.
   Later phases may add operations that consume these records, but this file
   deliberately does not decide how a screen should display them.

   Model:
     LanguageModel
       words[]
       morphemes[]
       derivations[]
       inflections[]
       grammarRules[]
       sentences[]

   SemanticIR is intentionally represented by its own factory below even
   though parsing/generation do not exist yet. That keeps the eventual public
   boundary stable without pretending Phase 1 can parse language.
*/
(function(root){
  'use strict';

  var VERSION=2;

  function id(prefix){
    return prefix+'_'+String(new Date().getTime())+'_'+String(Math.floor(Math.random()*100000));
  }

  function copyObject(src){
    var out={}, k;
    if(!src || typeof src!=='object') return out;
    for(k in src) if(Object.prototype.hasOwnProperty.call(src,k)) out[k]=src[k];
    return out;
  }

  function copyArray(src){
    var out=[], i;
    if(!Array.isArray(src)) return out;
    for(i=0;i<src.length;i++) out.push(src[i]);
    return out;
  }

  /* A lexical entry. `lemma` is the canonical form; surface forms belong to
     later morphology records rather than being silently duplicated here. */
  function word(data){
    data=data||{};
    return {
      id:data.id||id('word'),
      lemma:data.lemma||'',
      meaning:data.meaning||'',
      partOfSpeech:data.partOfSpeech||null,
      morphemeIds:copyArray(data.morphemeIds),
      metadata:copyObject(data.metadata)
    };
  }

  /* A reusable piece of form/meaning: root, affix, clitic, etc. */
  function morpheme(data){
    data=data||{};
    return {
      id:data.id||id('morph'),
      form:data.form||'',
      gloss:data.gloss||'',
      type:data.type||'root',
      metadata:copyObject(data.metadata)
    };
  }

  /* Word formation is an explicit operation, not merely a link between two
     dictionary entries. This is what will let the engine reproduce a derived
     word instead of asking an AI to guess the relationship. */
  function derivation(data){
    data=data||{};
    return {
      id:data.id||id('deriv'),
      sourcePartOfSpeech:data.sourcePartOfSpeech||null,
      targetPartOfSpeech:data.targetPartOfSpeech||null,
      operation:data.operation||'suffix',
      morphemeId:data.morphemeId||null,
      conditions:copyObject(data.conditions),
      metadata:copyObject(data.metadata)
    };
  }

  /* Inflection expresses grammatical features on an existing lexical item. */
  function inflection(data){
    data=data||{};
    return {
      id:data.id||id('infl'),
      target:data.target||'WORD',
      feature:data.feature||null,
      value:data.value||null,
      operation:data.operation||'suffix',
      morphemeId:data.morphemeId||null,
      conditions:copyObject(data.conditions),
      metadata:copyObject(data.metadata)
    };
  }

  /* GrammarRule is intentionally broader than inflection. Word order,
     agreement, placement and future syntactic operations can live here. */
  function grammarRule(data){
    data=data||{};
    return {
      id:data.id||id('rule'),
      type:data.type||'syntax',
      target:data.target||null,
      operation:data.operation||null,
      value:data.value===undefined?null:data.value,
      conditions:copyObject(data.conditions),
      metadata:copyObject(data.metadata)
    };
  }

  /* A sentence is language-specific surface text plus structured information.
     parsedStructure is optional in Phase 1; it will be filled by the parser. */
  function sentence(data){
    data=data||{};
    return {
      id:data.id||id('sentence'),
      languageId:data.languageId||null,
      originalText:data.originalText||'',
      tokens:copyArray(data.tokens),
      parsedStructure:data.parsedStructure||null,
      semanticId:data.semanticId||null,
      metadata:copyObject(data.metadata)
    };
  }

  /* Language-neutral intermediate representation. The shape is deliberately
     open: semantic roles/features can grow without changing Sentence. */
  function semanticIR(data){
    data=data||{};
    return {
      version:1,
      id:data.id||id('sem'),
      languageIndependent:true,
      roles:copyObject(data.roles),
      features:copyObject(data.features),
      relations:copyArray(data.relations),
      metadata:copyObject(data.metadata)
    };
  }

  function languageModel(data){
    data=data||{};
    return {
      schema:'lingua.grammar',
      version:VERSION,
      languageId:data.languageId||null,
      wordOrder:data.wordOrder||null,
      words:copyArray(data.words),
      morphemes:copyArray(data.morphemes),
      derivations:copyArray(data.derivations),
      inflections:copyArray(data.inflections),
      grammarRules:copyArray(data.grammarRules),
      sentences:copyArray(data.sentences),
      metadata:copyObject(data.metadata)
    };
  }

  /* Public API is namespaced so Phase 1 can be loaded beside the old grammar
     without replacing SET, WORDS, or any existing global. */
  root.LinguaGrammarEngine={
    VERSION:VERSION,
    word:word,
    morpheme:morpheme,
    derivation:derivation,
    inflection:inflection,
    grammarRule:grammarRule,
    sentence:sentence,
    semanticIR:semanticIR,
    languageModel:languageModel
  };
}(typeof window!=='undefined'?window:this));
