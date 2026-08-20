/* Lingua — the IPA, whole.
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   The sounds a language can be built from used to be a list of twenty-six,
   which is the Latin alphabet with th, sh and ch bolted on -- so a sound
   outside English simply could not be chosen, and a word's sounds were
   guessed back out of its Latin spelling by English rules. This is the chart
   instead: 64 consonants, 28 vowels, 19 besides.

   The symbols are the labels. An IPA symbol means the same thing in every
   language, so nothing here needs translating except the row and column
   headings -- and those are the names of places and manners of articulation,
   which are the same twenty-odd words in any of the ten. */

var IPA_PLACES=["bilabial", "labiodental", "dental", "alveolar", "postalveolar", "retroflex", "palatal", "velar", "uvular", "pharyngeal", "glottal"];
var IPA_MANNERS=["plosive", "nasal", "trill", "tap", "fricative", "latfric", "approx", "latapprox"];
var IPA_HEIGHTS=["close", "nearclose", "closemid", "mid", "openmid", "nearopen", "open"];
var IPA_BACKS=["front","central","back"];

/* Each consonant: the symbol, its manner, its place, and whether it is
   voiced. Voiceless and voiced sit in the same cell, in that order. */
var IPA_CONS=[{"s": "p", "m": "plosive", "p": "bilabial", "v": 0}, {"s": "b", "m": "plosive", "p": "bilabial", "v": 1}, {"s": "p̪", "m": "plosive", "p": "labiodental", "v": 0}, {"s": "b̪", "m": "plosive", "p": "labiodental", "v": 1}, {"s": "t̪", "m": "plosive", "p": "dental", "v": 0}, {"s": "d̪", "m": "plosive", "p": "dental", "v": 1}, {"s": "t", "m": "plosive", "p": "alveolar", "v": 0}, {"s": "d", "m": "plosive", "p": "alveolar", "v": 1}, {"s": "ʈ", "m": "plosive", "p": "retroflex", "v": 0}, {"s": "ɖ", "m": "plosive", "p": "retroflex", "v": 1}, {"s": "c", "m": "plosive", "p": "palatal", "v": 0}, {"s": "ɟ", "m": "plosive", "p": "palatal", "v": 1}, {"s": "k", "m": "plosive", "p": "velar", "v": 0}, {"s": "ɡ", "m": "plosive", "p": "velar", "v": 1}, {"s": "q", "m": "plosive", "p": "uvular", "v": 0}, {"s": "ɢ", "m": "plosive", "p": "uvular", "v": 1}, {"s": "ʡ", "m": "plosive", "p": "pharyngeal", "v": 0}, {"s": "ʔ", "m": "plosive", "p": "glottal", "v": 0}, {"s": "m", "m": "nasal", "p": "bilabial", "v": 0}, {"s": "ɱ", "m": "nasal", "p": "labiodental", "v": 0}, {"s": "n", "m": "nasal", "p": "alveolar", "v": 0}, {"s": "ɳ", "m": "nasal", "p": "retroflex", "v": 0}, {"s": "ɲ", "m": "nasal", "p": "palatal", "v": 0}, {"s": "ŋ", "m": "nasal", "p": "velar", "v": 0}, {"s": "ɴ", "m": "nasal", "p": "uvular", "v": 0}, {"s": "ʙ", "m": "trill", "p": "bilabial", "v": 0}, {"s": "r", "m": "trill", "p": "alveolar", "v": 0}, {"s": "ʀ", "m": "trill", "p": "uvular", "v": 0}, {"s": "ⱱ", "m": "tap", "p": "labiodental", "v": 0}, {"s": "ɾ", "m": "tap", "p": "alveolar", "v": 0}, {"s": "ɽ", "m": "tap", "p": "retroflex", "v": 0}, {"s": "ɸ", "m": "fricative", "p": "bilabial", "v": 0}, {"s": "β", "m": "fricative", "p": "bilabial", "v": 1}, {"s": "f", "m": "fricative", "p": "labiodental", "v": 0}, {"s": "v", "m": "fricative", "p": "labiodental", "v": 1}, {"s": "θ", "m": "fricative", "p": "dental", "v": 0}, {"s": "ð", "m": "fricative", "p": "dental", "v": 1}, {"s": "s", "m": "fricative", "p": "alveolar", "v": 0}, {"s": "z", "m": "fricative", "p": "alveolar", "v": 1}, {"s": "ʃ", "m": "fricative", "p": "postalveolar", "v": 0}, {"s": "ʒ", "m": "fricative", "p": "postalveolar", "v": 1}, {"s": "ʂ", "m": "fricative", "p": "retroflex", "v": 0}, {"s": "ʐ", "m": "fricative", "p": "retroflex", "v": 1}, {"s": "ç", "m": "fricative", "p": "palatal", "v": 0}, {"s": "ʝ", "m": "fricative", "p": "palatal", "v": 1}, {"s": "x", "m": "fricative", "p": "velar", "v": 0}, {"s": "ɣ", "m": "fricative", "p": "velar", "v": 1}, {"s": "χ", "m": "fricative", "p": "uvular", "v": 0}, {"s": "ʁ", "m": "fricative", "p": "uvular", "v": 1}, {"s": "ħ", "m": "fricative", "p": "pharyngeal", "v": 0}, {"s": "ʕ", "m": "fricative", "p": "pharyngeal", "v": 1}, {"s": "h", "m": "fricative", "p": "glottal", "v": 0}, {"s": "ɦ", "m": "fricative", "p": "glottal", "v": 1}, {"s": "ɬ", "m": "latfric", "p": "alveolar", "v": 0}, {"s": "ɮ", "m": "latfric", "p": "alveolar", "v": 1}, {"s": "ʋ", "m": "approx", "p": "labiodental", "v": 0}, {"s": "ɹ", "m": "approx", "p": "alveolar", "v": 0}, {"s": "ɻ", "m": "approx", "p": "retroflex", "v": 0}, {"s": "j", "m": "approx", "p": "palatal", "v": 0}, {"s": "ɰ", "m": "approx", "p": "velar", "v": 0}, {"s": "l", "m": "latapprox", "p": "alveolar", "v": 0}, {"s": "ɭ", "m": "latapprox", "p": "retroflex", "v": 0}, {"s": "ʎ", "m": "latapprox", "p": "palatal", "v": 0}, {"s": "ʟ", "m": "latapprox", "p": "velar", "v": 0}];

/* Each vowel: the symbol, its height, how far back, and whether rounded. */
var IPA_VOWS=[{"s": "i", "h": "close", "b": "front", "r": 0}, {"s": "y", "h": "close", "b": "front", "r": 1}, {"s": "ɨ", "h": "close", "b": "central", "r": 0}, {"s": "ʉ", "h": "close", "b": "central", "r": 1}, {"s": "ɯ", "h": "close", "b": "back", "r": 0}, {"s": "u", "h": "close", "b": "back", "r": 1}, {"s": "ɪ", "h": "nearclose", "b": "front", "r": 0}, {"s": "ʏ", "h": "nearclose", "b": "front", "r": 1}, {"s": "ʊ", "h": "nearclose", "b": "back", "r": 1}, {"s": "e", "h": "closemid", "b": "front", "r": 0}, {"s": "ø", "h": "closemid", "b": "front", "r": 1}, {"s": "ɘ", "h": "closemid", "b": "central", "r": 0}, {"s": "ɵ", "h": "closemid", "b": "central", "r": 1}, {"s": "ɤ", "h": "closemid", "b": "back", "r": 0}, {"s": "o", "h": "closemid", "b": "back", "r": 1}, {"s": "ə", "h": "mid", "b": "central", "r": 0}, {"s": "ɛ", "h": "openmid", "b": "front", "r": 0}, {"s": "œ", "h": "openmid", "b": "front", "r": 1}, {"s": "ɜ", "h": "openmid", "b": "central", "r": 0}, {"s": "ɞ", "h": "openmid", "b": "central", "r": 1}, {"s": "ʌ", "h": "openmid", "b": "back", "r": 0}, {"s": "ɔ", "h": "openmid", "b": "back", "r": 1}, {"s": "æ", "h": "nearopen", "b": "front", "r": 0}, {"s": "ɐ", "h": "nearopen", "b": "central", "r": 0}, {"s": "a", "h": "open", "b": "front", "r": 0}, {"s": "ɶ", "h": "open", "b": "front", "r": 1}, {"s": "ɑ", "h": "open", "b": "back", "r": 0}, {"s": "ɒ", "h": "open", "b": "back", "r": 1}];

/* The rest of the chart: the approximants that do not fit the grid, the
   clicks, and the implosives. */
var IPA_OTHER=[{"s": "ʍ", "g": "other"}, {"s": "w", "g": "other"}, {"s": "ɥ", "g": "other"}, {"s": "ʜ", "g": "other"}, {"s": "ʢ", "g": "other"}, {"s": "ɕ", "g": "other"}, {"s": "ʑ", "g": "other"}, {"s": "ɺ", "g": "other"}, {"s": "ɧ", "g": "other"}, {"s": "ʘ", "g": "click"}, {"s": "ǀ", "g": "click"}, {"s": "ǃ", "g": "click"}, {"s": "ǂ", "g": "click"}, {"s": "ǁ", "g": "click"}, {"s": "ɓ", "g": "implosive"}, {"s": "ɗ", "g": "implosive"}, {"s": "ʄ", "g": "implosive"}, {"s": "ɠ", "g": "implosive"}, {"s": "ʛ", "g": "implosive"}];

/* Everything, once, for lookups. */
var IPA_ALL=null;
function ipaAll(){
  if(IPA_ALL) return IPA_ALL;
  var out=[], i;
  for(i=0;i<IPA_CONS.length;i++) out.push(IPA_CONS[i].s);
  for(i=0;i<IPA_VOWS.length;i++) out.push(IPA_VOWS[i].s);
  for(i=0;i<IPA_OTHER.length;i++) out.push(IPA_OTHER[i].s);
  IPA_ALL=out; return out;
}
var IPA_ISV=null;
function ipaIsVowel(s){
  if(!IPA_ISV){
    IPA_ISV={};
    for(var i=0;i<IPA_VOWS.length;i++) IPA_ISV[IPA_VOWS[i].s]=1;
  }
  return !!IPA_ISV[s];
}
function ipaCell(m,p){
  var out=[], i;
  for(i=0;i<IPA_CONS.length;i++) if(IPA_CONS[i].m===m && IPA_CONS[i].p===p) out.push(IPA_CONS[i]);
  return out;
}
function ipaVCell(h,b){
  var out=[], i;
  for(i=0;i<IPA_VOWS.length;i++) if(IPA_VOWS[i].h===h && IPA_VOWS[i].b===b) out.push(IPA_VOWS[i]);
  return out;
}
/* A manner with nothing in it anywhere is not given a row. */
function ipaHasManner(m){
  for(var i=0;i<IPA_CONS.length;i++) if(IPA_CONS[i].m===m) return true;
  return false;
}

/* A roman letter, and the IPA symbol somebody naming a letter that means.
   「cはcとは読まんやろ。だからipa基準って言ってんの」

   Most of the alphabet says itself: p b d t k m n s z f v l w h j r and the
   five vowels are the same character in the IPA with the value anybody would
   expect, so they are not here -- a table that restated them would be a
   second place for a fact that needs none.

   These are the ones that do NOT say themselves, and every one of them was
   falling through to the letter itself:

     c   the IPA c is a voiceless palatal plosive. Nobody naming a letter c
         means one; they mean k, which is what IPA_ROMAN already says in the
         other direction.
     g   THE BUG. The IPA's g is U+0261, and a plain ASCII g is not in the
         chart at all -- so a letter named g was given a "sound" that is in no
         inventory, cannot be said, and cannot be found in the table.
     q   uvular in the IPA, k to somebody writing an alphabet.
     x   velar fricative in the IPA. k is the nearest thing that is not a
         guess about two sounds at once.
     y   the IPA y is a close front rounded vowel; the letter is a j.

   A digraph is two letters, and the reader takes the longest match, which is
   why they are here rather than being spelt out. Each is a LIST of chart
   symbols, because ch is not one of them: the chart has no affricate row, so
   ch was reading t\u0283, a single "sound" that is in no inventory, that
   ipaRoman() spells as nothing and that voice.js cannot say -- chi came out
   as i. It is t then \u0283, which is two sounds the chart does have and is
   what the word is. The others are one symbol each and say so. */
var IPA_WAS={
  "sh":["\u0283"], "ch":["t","\u0283"], "th":["\u03b8"], "ng":["\u014b"],
  "c":["k"], "g":["\u0261"], "q":["k"], "x":["k"], "y":["j"]};

/* A rough Latin spelling for each symbol, and nothing more than that.
   The IPA is exact and is what a word actually is; this is the ladder up to
   it for somebody who does not read the IPA yet. Each language's own
   respelling engine reads Latin, so this is what it is handed: /\u0283a\u014bo/
   becomes shano, which an English respelling then writes SHAH-noh and a
   Japanese one \u30b7\u30e3\u30ce. Nothing here decides how a sound is said --
   www/voice.js does that, from the chart. This only decides how it is
   approximated on the page, which is a different question and an honest one.
   A few symbols spell to nothing: a glottal stop has no Latin letter that
   would not be a lie about it. */
var IPA_ROMAN={"p":"p", "b":"b", "p̪":"p", "b̪":"b", "t̪":"t", "d̪":"d", "t":"t", "d":"d", "ʈ":"t", "ɖ":"d", "c":"k", "ɟ":"g", "k":"k", "ɡ":"g", "q":"k", "ɢ":"g", "ʡ":"h", "ʔ":"", "m":"m", "ɱ":"m", "n":"n", "ɳ":"n", "ɲ":"ny", "ŋ":"ng", "ɴ":"ng", "ʙ":"b", "r":"r", "ʀ":"r", "ⱱ":"v", "ɾ":"r", "ɽ":"r", "ɸ":"f", "β":"v", "f":"f", "v":"v", "θ":"th", "ð":"d", "s":"s", "z":"z", "ʃ":"sh", "ʒ":"sh", "ʂ":"sh", "ʐ":"sh", "ç":"h", "ʝ":"j", "x":"k", "ɣ":"g", "χ":"k", "ʁ":"r", "ħ":"h", "ʕ":"", "h":"h", "ɦ":"h", "ɬ":"l", "ɮ":"l", "ʋ":"v", "ɹ":"r", "ɻ":"r", "j":"j", "ɰ":"w", "l":"l", "ɭ":"l", "ʎ":"l", "ʟ":"l", "i":"i", "y":"u", "ɨ":"i", "ʉ":"u", "ɯ":"u", "u":"u", "ɪ":"i", "ʏ":"u", "ʊ":"u", "e":"e", "ø":"e", "ɘ":"e", "ɵ":"o", "ɤ":"o", "o":"o", "ə":"a", "ɛ":"e", "œ":"e", "ɜ":"e", "ɞ":"o", "ʌ":"a", "ɔ":"o", "æ":"a", "ɐ":"a", "a":"a", "ɶ":"a", "ɑ":"a", "ɒ":"o", "ʍ":"w", "w":"w", "ɥ":"w", "ʜ":"h", "ʢ":"h", "ɕ":"sh", "ʑ":"sh", "ɺ":"r", "ɧ":"sh", "ʘ":"p", "ǀ":"t", "ǃ":"k", "ǂ":"k", "ǁ":"l", "ɓ":"b", "ɗ":"d", "ʄ":"j", "ɠ":"g", "ʛ":"g"};
function ipaRoman(sym){
  if(IPA_ROMAN[sym]!==undefined) return IPA_ROMAN[sym];
  return /^[a-z]$/.test(sym) ? sym : '';
}

/* The same ladder, climbed downwards: a spelling somebody typed, read back as
   sounds. Nobody pictures their script as a set of IPA symbols -- they
   picture it as an alphabet, and ohayo, annyon and ni hao all come out of one
   even though none of the three is written in it. So a letter's reading is
   corrected by typing what it says.

   Not phGuess(): that one answers for words written before the chart existed
   and has to keep answering the same way forever, or somebody's dictionary
   changes underneath them. This one is asked live, by a person looking at one
   letter, so it prefers the sounds their language already has -- type sh in a
   language whose only hushing sound is ɕ and you get that one rather than a
   second one nothing else uses.

   Longest spelling first, so ng is ŋ and not n followed by ɡ. And among
   sounds spelled the same, the one that IS that letter wins: ipaRoman says k
   for both c and k -- c is a palatal stop and k is on the chart before it --
   so typing ka got ca, a sound almost nobody meant and no keyboard would have
   suggested.

   Returns null when some of what was typed is not a sound at all, because a
   letter reading half of what somebody wrote is worse than a letter telling
   them so. */
/* The longest of `list` that the string starts with, by the roman each symbol
   is spelled with. Null when none of them fits. */
function ipaLongest(list, s){
  var best='', bestR='', i, r;
  for(i=0;i<list.length;i++){
    r=ipaRoman(list[i]);
    if(!r || s.indexOf(r)!==0) continue;
    if(r.length>bestR.length ||
       (r.length===bestR.length && best!==bestR && list[i]===r)){
      best=list[i]; bestR=r;
    }
  }
  return best? {u:[best], n:bestR.length} : null;
}
/* What IPA_WAS says the front of this string is: the digraph if there is one,
   otherwise the single letter, otherwise nothing. Its values are LISTS,
   because ch is t then ʃ. */
function ipaWasAt(s){
  var two=s.substr(0,2), one=s.charAt(0);
  if(IPA_WAS[two]) return {u:IPA_WAS[two], n:2};
  if(IPA_WAS[one]) return {u:IPA_WAS[one], n:1};
  return null;
}
function ipaFromRoman(sp){
  var s=String(sp||'').toLowerCase().replace(/[^a-z]/g,'');
  var mine=addedSnd(), all=ipaAll(), out=[], a, b, c, got;
  while(s.length){
    /* Three answers to the same question, and the longest of them wins.
       Tied, they are preferred in this order, which is the order of how much
       each of them knows about THIS language:

         1  a sound the language already has, spelled that way
         2  what a roman letter is agreed to mean -- IPA_WAS
         3  the chart

       Two was missing, and the five letters it is for are exactly the five
       that were falling through to the letter itself. c q x y matched nothing
       at all and came back as null, so a free language's C carried the
       character "c" as a sound, which is in no inventory and cannot be said.
       And g was worse than nothing: the IPA's g is U+0261, no candidate
       equals the ASCII g, so the tie went to whichever came first on the
       chart -- ɟ, a palatal plosive, which is not what anybody naming a
       letter g means. 「無料版のa-zの音もipa準拠になってるの？」

       One is still first, so a language whose only hushing sound is ɕ still
       reads sh as that one rather than growing a second. */
    a=ipaLongest(mine, s); b=ipaWasAt(s); c=ipaLongest(all, s);
    got=a;
    if(!got || (b && b.n>got.n)) got=b||got;
    if(!got || (c && c.n>got.n)) got=c||got;
    if(!got) return null;
    out=out.concat(got.u); s=s.slice(got.n);
  }
  return out;
}

/* ---- cutting a written string into the pieces a list says exist ---------
   Three copies of this walk were in the app, found by sliding a three-line
   window over www/ -- the thing CLAUDE.md says is worth doing again:

     uSplit()  cut a unit into the sounds the language has
     impCut()  cut an imported pronunciation into sounds
     spType()  cut a typed line into the letters that spell it

   The first two were the same function with a different list. The third was
   written a week later and differed only in folding case and in what it does
   with a character nothing matches. So: one walk, and the two differences
   are arguments.

   Longest first, always. That is the whole reason this is not a loop over
   characters -- "tʃa" comes apart as tʃ + a and not as t + ʃ + a, and a
   letter called `th` has to beat the letter called `t` where both would fit.

   `fold` compares without case, for lists of names somebody typed.
   `drop` throws away a character nothing matches, for a list that is the
   whole of what can be written; the default keeps it, for a list that is
   only what is known so far.

   It lives here because ipa.js is where a written string meets the units it
   is made of, and because tools/import-check.mjs evaluates this file -- the
   reader half of import.js has to run with no globals and no document, so a
   function it calls cannot be anywhere that needs a browser. */
function longCut(s, list, opts){
  var keep=!(opts && opts.drop), fold=!!(opts && opts.fold);
  var xs=(list||[]).slice(), out=[], t=String(s||''), i, hit, probe, x;
  xs.sort(function(a, b){ return String(b).length-String(a).length; });
  while(t.length){
    hit=null;
    probe=fold? t.toLowerCase() : t;
    for(i=0;i<xs.length;i++){
      x=fold? String(xs[i]).toLowerCase() : String(xs[i]);
      if(x && probe.indexOf(x)===0){ hit=xs[i]; break; }
    }
    if(hit!==null){ out.push(hit); t=t.slice(String(hit).length); }
    else { if(keep) out.push(t.charAt(0)); t=t.slice(1); }
  }
  return out;
}
