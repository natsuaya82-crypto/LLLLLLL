import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={console}; vm.createContext(context);
for(const file of ['www/grammar-engine/model.js','www/grammar-engine/morphology.js','www/grammar-engine/adapter.js']) vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const e=context.LinguaGrammarEngine;
const language=e.languageModel({languageId:'demo',wordOrder:'SOV',words:[e.word({id:'mi',lemma:'mi',partOfSpeech:'PRONOUN'}),e.word({id:'poko',lemma:'poko',partOfSpeech:'NOUN'}),e.word({id:'luma',lemma:'luma',partOfSpeech:'VERB'})],inflections:[e.inflection({id:'past',target:'VERB',feature:'TENSE',value:'PAST',operation:'suffix',form:'ka'}),e.inflection({id:'negative',target:'VERB',feature:'NEGATION',value:true,operation:'prefix',form:'na',separator:' '})]});
const past=e.morphology.inflect(language,language.words[2],{TENSE:'PAST'});
assert.equal(past.surface,'luma-ka'); assert.equal(e.morphology.analyzeForm(language,past.surface,language.words[2]).lemma,'luma');
const affirmative=e.morphology.parseSentence(language,'mi poko luma-ka');
assert.equal(affirmative.ok,true); assert.equal(affirmative.roles.SUBJECT,'mi'); assert.equal(affirmative.roles.OBJECT,'poko'); assert.equal(affirmative.roles.PREDICATE,'luma'); assert.equal(affirmative.features.TENSE,'PAST');
const negative=e.morphology.parseSentence(language,'mi poko na luma-ka');
assert.equal(negative.ok,true); assert.equal(negative.features.NEGATION,true); assert.equal(negative.features.TENSE,'PAST');
/* A sentence shorter than the word order. Roles were handed out by position
   alone, so the verb of a two-word sentence took the OBJECT slot and nothing
   was the PREDICATE -- ok:true, and wrong. The verb is found by what it is. */
const intransitive=e.morphology.parseSentence(language,'mi luma-ka');
assert.equal(intransitive.ok,true);
assert.equal(intransitive.roles.SUBJECT,'mi');
assert.equal(intransitive.roles.PREDICATE,'luma');
assert.equal(intransitive.roles.OBJECT,undefined);
assert.equal(intransitive.features.TENSE,'PAST');
/* A particle standing in front of a word it cannot attach to. The reader kept
   the word it had already looked ahead to and never advanced past the
   particle, so the particle vanished and that word was counted twice --
   ok:true, with the sentence saying something nobody wrote. */
const stray=e.morphology.parseSentence(language,'na mi');
assert.equal(stray.ok,false);
const adapted=e.adapter.fromLegacy('legacy',[{hw:'luma',mn:'食べる',pos:'v'}],{order:'SOV'});
assert.equal(adapted.words[0].partOfSpeech,'VERB'); assert.equal(adapted.wordOrder.join(','),'SUBJECT,OBJECT,VERB');
/* Nothing here builds a storage key out of string pieces. Where a language is
   filed is core.js's one place to say, and a second place saying it is how a
   slice ends up outside SLICES -- in no backup, and left behind by a wipe. */
for (const file of ['www/grammar-engine/adapter.js']) {
  assert.equal(fs.readFileSync(file, 'utf8').indexOf("'lingua.'"), -1,
    file + ' builds a storage key by hand. Ask core.js for it instead.');
}
console.log('Grammar Engine: Phase 1–2 contract is clean');