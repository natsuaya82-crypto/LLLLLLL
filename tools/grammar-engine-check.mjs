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
/* What a word IS, asked of the dictionary rather than restated here.
   www/shell.js holds the thirteen keys a part of speech is stored as, and the
   adapter's map named three that this app has never stored (`pron`, `prep`,
   `int`) while leaving eight that it does (`pro`, `num`, `part`, `intj`,
   `aff`, `nm`, `idm`, `x`) to fall through to `String(pos).toUpperCase()`.
   Nothing throws: a pronoun comes out `PRO`, which looks like a part of
   speech, and morphology.applies() matches `rule.target === partOfSpeech`,
   so an inflection written for PRONOUN simply never fires. Read the list off
   www/shell.js, so a fourteenth key is held the day it is added. */
const POS_KEYS=/var POS=\[([^\]]*)\]/.exec(fs.readFileSync('www/shell.js','utf8'))[1]
  .split(',').map((s)=>s.trim().replace(/'/g,'')).filter(Boolean);
assert.ok(POS_KEYS.length>=13,'www/shell.js no longer states its parts of speech as a literal list.');
for(const k of POS_KEYS){
  const got=e.adapter.fromLegacy('pos',[{hw:'x',pos:k}],{}).words[0].partOfSpeech;
  assert.ok(got && got!==k.toUpperCase(),
    'A word stored as pos "'+k+'" reaches the engine as "'+got+'". That is the key '+
    'shouted, not a part of speech: the adapter has no row for it, and an inflection '+
    'targeting it can never fire.');
}

/* A legacy word has no id -- `hw` is what the dictionary files it under
   (wKids matches `from === hw`). The adapter passed `w.id || null` on, so
   model.js minted `word_<clock>_<random>` and the SAME word got a different
   id on every build. Anything that points at a word -- which is how the
   grammar page says "this one is the negation" -- pointed at a ghost. */
const twice=[e.adapter.fromLegacy('id',[{hw:'luma',pos:'v'}],{}),
             e.adapter.fromLegacy('id',[{hw:'luma',pos:'v'}],{})];
assert.equal(twice[0].words[0].id,twice[1].words[0].id,
  'The same word built twice has two ids, so nothing can point at a word.');

/* A word means a LIST of things (wMns in www/core.js). The adapter joined it
   with " / " on the way in, so the only road back was splitting on a
   separator that can sit inside a meaning. The list travels beside the
   joined string; neither replaces the other. */
const many=e.adapter.fromLegacy('mn',[{hw:'sara',mns:['river','road / way'],pos:'n'}],{}).words[0];
/* join and compare: the engine runs in a vm context, so its Array is a
   different realm's and deepStrictEqual refuses two identical lists. */
assert.equal(many.meanings.join('|'),'river|road / way');
assert.equal(many.meaning,'river / road / way');

/* Which slot of which stage made this word travels with it. It is how the
   grammar page can say "the 否定 stage's word is the negation" without the
   engine having to know what a stage is. */
const slotted=e.adapter.fromLegacy('sl',[{hw:'nai',pos:'part',slot:'neg.not'}],{}).words[0];
assert.equal(slotted.metadata.slot,'neg.not');

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