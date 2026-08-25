/* Lingua Grammar Engine v2 legacy adapter. ES5 only; no automatic migration. */
(function(root){
  'use strict';
  var api=root.LinguaGrammarEngine;
  if(!api) throw new Error('LinguaGrammarEngine model must load before adapter');
  var POS={n:'NOUN',v:'VERB',adj:'ADJECTIVE',adv:'ADVERB',pron:'PRONOUN',prep:'ADPOSITION',conj:'CONJUNCTION',int:'INTERJECTION'};
  function pos(value){ value=String(value||'').toLowerCase(); return POS[value]||String(value||'').toUpperCase()||null; }
  function meanings(word){ if(word && word.mns && word.mns.length) return word.mns.join(' / '); return word&&word.mn?String(word.mn):''; }
  function words(legacy){ var out=[],i,w; legacy=legacy||[]; for(i=0;i<legacy.length;i++){ w=legacy[i]||{}; out.push(api.word({id:w.id||null,lemma:w.hw||'',meaning:meanings(w),partOfSpeech:pos(w.pos),metadata:{legacyWord:true}})); } return out; }
  function fromLegacy(languageId, legacyWords, legacySet){ legacySet=legacySet||{}; return api.languageModel({languageId:languageId||null,wordOrder:legacySet.order||'SOV',words:words(legacyWords),metadata:{source:'legacy-adapter',legacyGrammarVersion:1}}); }
  function key(languageId){ return 'lingua.'+String(languageId)+'.grammar-v2'; }
  function load(languageId, storage){ var raw; storage=storage||root.localStorage; if(!storage||!languageId) return null; try{ raw=storage.getItem(key(languageId)); return raw?api.languageModel(JSON.parse(raw)):null; }catch(e){ return null; } }
  function save(model, storage){ storage=storage||root.localStorage; if(!storage||!model||!model.languageId) throw new Error('Grammar v2 model needs languageId and storage'); storage.setItem(key(model.languageId),JSON.stringify(model)); return model; }
  api.adapter={fromLegacy:fromLegacy,load:load,save:save,storageKey:key};
}(typeof window!=='undefined'?window:this));