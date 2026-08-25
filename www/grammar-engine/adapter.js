/* Lingua Grammar Engine v2 legacy adapter. ES5 only; no automatic migration. */
(function(root){
  'use strict';
  var api=root.LinguaGrammarEngine;
  if(!api) throw new Error('LinguaGrammarEngine model must load before adapter');
  /* The thirteen keys a part of speech is actually stored as are in
     www/shell.js, and this map had eight rows: three of them (`pron`, `prep`,
     `int`) named keys this app has never stored, and eight keys it does store
     had no row at all. The fallback made that invisible -- an unmapped key
     came back as itself in capitals, so a pronoun reached the engine as `PRO`
     and looked like a part of speech. morphology.applies() matches
     `rule.target === word.partOfSpeech`, so an inflection written for PRONOUN
     simply never fired, on a model that was green everywhere.

     The thirteen are the app's. The three below them are kept as aliases for
     what somebody else's word list might say on the way in; posKey() in
     www/shell.js means a word already here is always one of the thirteen. */
  var POS={n:'NOUN',v:'VERB',adj:'ADJECTIVE',adv:'ADVERB',pro:'PRONOUN',num:'NUMERAL',
           part:'PARTICLE',conj:'CONJUNCTION',intj:'INTERJECTION',aff:'AFFIX',
           nm:'NAME',idm:'IDIOM',x:'OTHER',
           pron:'PRONOUN',prep:'ADPOSITION',int:'INTERJECTION'};
  function pos(value){ value=String(value||'').toLowerCase(); return POS[value]||String(value||'').toUpperCase()||null; }
  /* A word means a LIST of things -- wMns() in www/core.js, since the day a
     second meaning had nowhere to go and people wrote "river; road" into the
     one box. Joining it with " / " here left the only road back a split on a
     separator that can sit inside a meaning, which is what a lookup FROM a
     meaning has to walk. Both travel now: `meanings` is the list and
     `meaning` is the joined string beside it. Nothing that read `meaning`
     had to change, and nothing was taken away. */
  function mnList(word){ var out=[],src,i,v; if(!word) return out;
    src=(word.mns&&word.mns.length)?word.mns:(word.mn?[word.mn]:[]);
    for(i=0;i<src.length;i++){ v=String(src[i]===undefined||src[i]===null?'':src[i]); if(v.replace(/^\s+|\s+$/g,'')) out.push(v); }
    return out; }
  function meanings(word){ return mnList(word).join(' / '); }
  /* A word in the dictionary has no `id` -- `hw` is what it is filed under,
     and what wKids() matches `from` against. Passing `w.id || null` on left
     model.js minting `word_<clock>_<random>`, so the same word came out with
     a different id every time the model was built and nothing could point at
     one. The grammar page points at words -- "this is the word for not" -- so
     the id is the headword, and it is the same id twice. */
  function idOf(w){ return w.id || (w.hw ? 'hw:'+String(w.hw) : null); }
  /* Which stage's slot made this word rides along. It is how the grammar page
     can say "the 否定 stage's word is the negation" without the engine ever
     having to know what a stage is. */
  function meta(w){ var m={legacyWord:true}; if(w.slot) m.slot=String(w.slot); if(w.pos) m.legacyPos=String(w.pos); return m; }
  function words(legacy){ var out=[],i,w; legacy=legacy||[]; for(i=0;i<legacy.length;i++){ w=legacy[i]||{}; out.push(api.word({id:idOf(w),lemma:w.hw||'',meaning:meanings(w),meanings:mnList(w),partOfSpeech:pos(w.pos),metadata:meta(w)})); } return out; }
  function fromLegacy(languageId, legacyWords, legacySet){ legacySet=legacySet||{}; return api.languageModel({languageId:languageId||null,wordOrder:legacySet.order||'SOV',words:words(legacyWords),metadata:{source:'legacy-adapter',legacyGrammarVersion:1}}); }
  /* How a language is filed is core.js's to say, and it says it in one place.
     langKey(slice) answers for the language that is open; this model names
     the language it belongs to, so it asks for that one by id. */
  function key(languageId){ return langKeyOf(languageId,'gram2'); }
  function load(languageId, storage){ var raw; storage=storage||root.localStorage; if(!storage||!languageId) return null; try{ raw=storage.getItem(key(languageId)); return raw?api.languageModel(JSON.parse(raw)):null; }catch(e){ return null; } }
  function save(model, storage){ storage=storage||root.localStorage; if(!storage||!model||!model.languageId) throw new Error('Grammar v2 model needs languageId and storage'); storage.setItem(key(model.languageId),JSON.stringify(model)); return model; }
  api.adapter={fromLegacy:fromLegacy,load:load,save:save,storageKey:key,idOf:idOf};
}(typeof window!=='undefined'?window:this));