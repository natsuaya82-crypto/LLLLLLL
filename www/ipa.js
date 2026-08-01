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

/* What the twenty-six used to be, in the symbols they actually stood for.
   Only three of them differ: everything else was already an IPA symbol. */
var IPA_WAS={"sh":"\u0283","ch":"t\u0283","th":"\u03b8","y":"j"};

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
