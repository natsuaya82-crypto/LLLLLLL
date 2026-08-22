/* A post read in this language comes out in this language's order.
   ------------------------------------------------------------------
   It came out in the order the sentence was WRITTEN in -- each word swapped
   for the word this dictionary has and nothing moved -- so a language set to
   SOV read its own posts as English with the words changed.
   「自分の言語に翻訳が文法通りにならない」

   What the grammar holds is four things and this holds those four and no
   more: the order of subject, verb and object; and which side of its noun or
   verb an adjective, a negation and an adposition stands. Anything the
   grammar has not been asked -- tense, agreement, articles -- must not be
   invented here, and a word this language has no word for must not be moved
   at all: it has no part of speech, so its role is not known.

   Nothing throws when this is wrong. The sentence reads, in the wrong order,
   and only somebody who knows their own grammar would see it.

   Run: node tools/gram-check.mjs                                        */
import { chromium } from 'playwright';
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await br.newPage({ viewport:{width:390,height:844} });
await pg.goto('file://' + path.join(dir,'..','www','index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:10000 });

const r = await pg.evaluate(({s}) => {
  eval('(' + s + ')()');
  SET.done = true; SET.plan = 'plus';
  /* Only the words being tested: the loose meaning match would otherwise take
     `to` out of `to see`, which is a thing about the matcher and not about
     the order. */
  WORDS = [
    { hw:'kano', mns:['mountain'], pos:'n',   at:1 },
    { hw:'sar',  mns:['river'],    pos:'n',   at:2 },
    { hw:'tir',  mns:['see'],      pos:'v',   at:3 },
    { hw:'mos',  mns:['tall'],     pos:'adj', at:4 },
    { hw:'nak',  mns:['not'],      pos:'part', slot:'neg.not', at:5 },
    { hw:'pei',  mns:['behind'],   pos:'part', slot:'where.behind', at:6 }
  ];
  function line(mn){
    return trUnits(mn).map(function(x){
      return x.sp ? ' ' : (x.w || ('[' + x.miss + ']'));
    }).join('').replace(/\s+/g, ' ').trim();
  }
  var out = { order:{} };
  ['SOV','SVO','VSO','VOS','OVS','OSV'].forEach(function(o){
    SET.order = o; out.order[o] = line('mountain see river');
  });
  SET.order = 'SOV';
  setGPos('adj','after');  out.adjAfter  = line('tall mountain see river');
  setGPos('adj','before'); out.adjBefore = line('tall mountain see river');
  setGPos('adj','after');
  setGPos('negp','after');  out.negAfter  = line('mountain see not river');
  setGPos('negp','before'); out.negBefore = line('mountain see not river');
  setGPos('negp','after');
  setGPos('adp','after');  out.adpAfter  = line('mountain see behind river');
  setGPos('adp','before'); out.adpBefore = line('mountain see behind river');
  setGPos('adp','after');
  /* nothing to order is nothing to reorder */
  out.noVerb = line('mountain river');
  out.oneWord = line('mountain');
  /* and a word this language has not got keeps its place */
  out.gapStays = line('mountain see luna');
  return out;
}, { s: seed.toString() });
await br.close();

var bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

const want = { SOV:'kano sar tir', SVO:'kano tir sar', VSO:'tir kano sar',
               VOS:'tir sar kano', OVS:'sar tir kano', OSV:'sar kano tir' };
Object.keys(want).forEach(function(o){
  say(r.order[o] === want[o], o + ' reads "' + r.order[o] + '"');
});
say(r.adjAfter  === 'kano mos sar tir', 'an adjective stands after its noun: "' + r.adjAfter + '"');
say(r.adjBefore === 'mos kano sar tir', 'and before it when that is the answer: "' + r.adjBefore + '"');
say(r.negAfter  === 'kano sar tir nak', 'a negation stands after the verb: "' + r.negAfter + '"');
say(r.negBefore === 'kano sar nak tir', 'and before it when that is the answer: "' + r.negBefore + '"');
say(r.adpAfter  === 'kano sar pei tir', 'an adposition stands after its noun: "' + r.adpAfter + '"');
say(r.adpBefore === 'kano pei sar tir', 'and before it when that is the answer: "' + r.adpBefore + '"');
say(r.noVerb  === 'kano sar', 'with no verb nothing is reordered: "' + r.noVerb + '"');
say(r.oneWord === 'kano',     'and one word is one word: "' + r.oneWord + '"');
say(r.gapStays.indexOf('[luna]') >= 0, 'a word this language has not got is still there: "' + r.gapStays + '"');

if (bad.length) { console.error('\ngram: ' + bad.length + ' failed'); process.exit(1); }
console.log('\ngram: the four things the grammar holds, and nothing invented.');
