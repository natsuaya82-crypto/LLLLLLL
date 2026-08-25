import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={console}; vm.createContext(context);
for(const file of ['www/grammar-engine/model.js','www/grammar-engine/morphology.js','www/grammar-engine/lexicon.js','www/grammar-engine/translate.js','www/grammar-engine/adapter.js']) vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
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
/* ---- the lookup from a meaning to one of my words ------------------------
   docs/FEATURES.md names exactly one thing as missing under "A post shown
   three ways", and this is it. Everything below runs on a language built the
   way the grammar page builds one: the dictionary, the word order, and the
   three places a word can stand. */
const D=[{hw:'mi',   mns:['I','me'],        pos:'pro'},
         {hw:'poko', mns:['fish'],          pos:'n'},
         {hw:'suli', mns:['big'],           pos:'adj'},
         {hw:'luma', mns:['eat'],           pos:'v'},
         {hw:'nai',  mns:['not'],           pos:'part', slot:'neg.not'},
         {hw:'lon',  mns:['at'],            pos:'part', slot:'where.at'},
         {hw:'te',   mns:['sea'],           pos:'n'},
         {hw:'telo', mns:['sea water'],     pos:'n'}];
const id=(hw)=>'hw:'+hw;
function build(order,pos){
  pos=pos||{};
  const m=e.adapter.fromLegacy('demo',D,{order:order||'SOV'});
  const rule=(target,feature,value)=>e.grammarRule({type:'syntax',target,feature,value});
  m.grammarRules=[rule('ADJECTIVE','POSITION',pos.adj||'after'),
                  rule('NEGATION','POSITION',pos.negp||'after'),
                  rule('ADPOSITION','POSITION',pos.adp||'after'),
                  rule('NEGATION','WORD',id('nai')),
                  rule('ADPOSITION','WORD',id('lon'))];
  return m;
}
const say=(m,text)=>e.translate.line(e.translate.run(m,text));

/* A meaning matches or it does not. No stem, no article stripped, no plural
   undone -- every one of those is a rule out of somebody else's language, and
   www/core.js threw exactly that out once when `th` was read as one sound
   because English reads it as one. */
assert.equal(e.lexicon.find(build(),'fish').length,1);
assert.equal(e.lexicon.find(build(),'FISH')[0].lemma,'poko','A meaning is matched with the case folded.');
assert.equal(e.lexicon.find(build(),'fishes').length,0,'"fishes" is not "fish" unless somebody says it is.');
assert.equal(e.lexicon.find(build(),'me')[0].lemma,'mi','The second meaning of a word is a way in, not decoration.');

/* Longest first. The dictionary has a word for "sea" AND a word for "sea
   water", so without the sort "sea water" comes back as the word for sea
   followed by a word nobody has. The first sample here had no word for "sea"
   in it, so it passed with the sort taken out -- a sample that cannot fail is
   not a check. */
assert.equal(say(build(),'sea water'),'telo');
assert.equal(say(build(),'sea'),'te');
/* And in both arrangements, or the answer is the dictionary's order agreeing
   with the sort by luck. The short meaning stands FIRST in D above, which is
   the case the sort exists for; this is the same dictionary written the other
   way round. */
{
  const back=e.adapter.fromLegacy('rev',D.slice().reverse(),{order:'SOV'});
  assert.equal(e.translate.line(e.translate.run(back,'sea water')),'telo');
  const fwd=e.adapter.fromLegacy('fwd',D,{order:'SOV'});
  assert.equal(e.translate.line(e.translate.run(fwd,'sea water')),'telo');
}

/* Where a word ENDS is written down by some scripts and not by others. One
   rule covers both: "eat" is not inside "eaten", and 魚 IS inside 魚を. */
assert.equal(e.lexicon.cut(build(),'eaten').filter((u)=>u.kind==='word').length,0,
  '"eat" was found inside "eaten". A space-writing script writes its word ends.');
const jp=e.adapter.fromLegacy('jp',[{hw:'poko',mns:['魚'],pos:'n'}],{order:'SOV'});
assert.equal(e.lexicon.cut(jp,'魚を').filter((u)=>u.kind==='word').length,1,
  '魚 was not found inside 魚を. A script that writes no spaces still has words in it.');

/* A comma is not a word somebody is missing. */
assert.equal(e.lexicon.cut(build(),'I, fish').filter((u)=>u.kind==='gap').length,0);

/* ---- the sentence, in this language's own order --------------------------
   All six orders, because www/grammar.js keeps all six. */
assert.equal(say(build('SOV'),'I eat fish'),'mi poko luma');
assert.equal(say(build('SVO'),'I eat fish'),'mi luma poko');
assert.equal(say(build('VSO'),'I eat fish'),'luma mi poko');
assert.equal(say(build('VOS'),'I eat fish'),'luma poko mi');
assert.equal(say(build('OVS'),'I eat fish'),'poko luma mi');
assert.equal(say(build('OSV'),'I eat fish'),'poko mi luma');

/* The three places a word can stand, each read off the language rather than
   off the natural sentence it came from. */
assert.equal(say(build('SOV',{adj:'after'}),'I eat big fish'),'mi poko suli luma');
assert.equal(say(build('SOV',{adj:'before'}),'I eat big fish'),'mi suli poko luma');
/* "I do not eat fish", not "I don't eat fish" and not "I do not eat fish"
   with the `do` in it: English's do-support is a word this dictionary has no
   word for, so it queues as a nominal and takes the object's place. That is
   the documented behaviour of a gap and not a bug -- it is checked as a gap
   below -- but it means the sentence to check the NEGATION's place with is
   one made of words this language actually has. */
assert.equal(say(build('SOV',{negp:'after'}),'I not eat fish'),'mi poko luma nai');
assert.equal(say(build('SOV',{negp:'before'}),'I not eat fish'),'mi poko nai luma');
assert.equal(say(build('SOV',{adp:'after'}),'I eat at sea water'),'mi telo lon luma');
assert.equal(say(build('SOV',{adp:'before'}),'I eat at sea water'),'mi lon telo luma');

/* A word this dictionary does not have stays in the natural language and
   keeps its place in the sentence -- it does not vanish, and it is not
   guessed at. docs/FEATURES.md: it "stays in the natural language and is
   shown IN RED ... and it is also the door to making that word". */
const gap=e.translate.run(build('SOV'),'I eat rice');
assert.equal(gap.complete,false);
assert.equal(gap.missing.join('|'),'rice');
assert.equal(e.translate.line(gap),'mi rice luma','The word nobody has still stands where the object goes.');

/* Nothing somebody wrote is dropped, whatever the rules did or did not reach.
   A word silently dropped is a sentence saying something nobody wrote -- the
   same fault the particle bug was, one level up. */
for(const text of ['I eat fish','big','not','at','I eat big fish at sea water not',
                   'rice and beans','I I I eat fish fish fish']){
  const r=e.translate.run(build('SOV'),text);
  assert.equal(r.pieces.length,r.units.length,
    'arrange() gave back '+r.pieces.length+' pieces for '+r.units.length+' units of "'+text+'".');
}

/* A third nominal follows the sentence rather than being dropped. */
assert.equal(say(build('SOV'),'I eat fish sea water'),'mi poko luma telo');

/* ---- compose and parse have to agree about the verb ----------------------
   morphology.parseSentence reads a sentence; translate.arrange writes one. If
   the two disagreed about which word is the verb, a line composed here would
   not read back as the line it was, and nothing would say so. */
for(const order of ['SOV','SVO','VSO','VOS','OVS','OSV']){
  const m=build(order);
  const written=say(m,'I eat fish');
  const read=e.morphology.parseSentence(m,written);
  assert.equal(read.ok,true,order+': "'+written+'" did not read back at all.');
  assert.equal(read.roles.PREDICATE,'luma',order+': the verb came back as '+read.roles.PREDICATE);
  assert.equal(read.roles.SUBJECT,'mi',order+': the subject came back as '+read.roles.SUBJECT);
  assert.equal(read.roles.OBJECT,'poko',order+': the object came back as '+read.roles.OBJECT);
}

/* Nothing under grammar-engine/ may reach for a global or the page. These
   four are put through a Node vm with nothing around them, which is the whole
   reason samples can be run through them at all -- the same argument as the
   line across www/import.js. adapter.js is the exception and has to be: it is
   the piece that knows about the app, and langKeyOf() is the app's.

   Read off the CODE, not the file. Two things were learned the hard way one
   after the other:

   - a comment quoting docs/FEATURES.md -- "Word order (SET.order, six of
     them) and the grammar stages already exist" -- was reported as the file
     reaching for SET. Comments go first, with their newlines kept, because a
     check that names the wrong line is worse than one that names none.
   - `t(` was matching inside `split(`. A substring is a proxy for a call, and
     a check built on a proxy gives the right answer for the wrong reason
     until the day it does not. It is a word boundary now. */
const decomment=(src)=>src
  .replace(/\/\*[\s\S]*?\*\//g,(m)=>m.replace(/[^\n]/g,' '))
  .replace(/\/\/[^\n]*/g,'');
for(const file of ['www/grammar-engine/lexicon.js','www/grammar-engine/translate.js',
                   'www/grammar-engine/model.js','www/grammar-engine/morphology.js']){
  const body=decomment(fs.readFileSync(file,'utf8'));
  for(const name of ['document','WORDS','LETTERS','SCRIPT','SET','STG','localStorage','langKey','langKeyOf','t','esc','DO','render']){
    const at=body.search(new RegExp('(^|[^0-9A-Za-z_$.])'+name+'\\s*[.(\\[]'));
    assert.equal(at,-1,
      file+' names `'+name+'` at '+at+'. Everything under grammar-engine/ but adapter.js is '+
      'DOM-free and globals-free, so it can be put samples through in Node.');
  }
}
