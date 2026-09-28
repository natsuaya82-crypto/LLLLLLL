/* Lingua Grammar Engine v2 — the lookup from a meaning to one of my words.
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   The lookup from a meaning to one of my words: what toNatural() and run()
   in translate.js beside this file stand on. This is that lookup, and
   nothing else.

   It is DOM-free and globals-free on purpose, the same way the reader half of
   www/import.js is: tools/grammar-engine-check.mjs runs this file in a Node
   vm with nothing around it, so what it does can be put samples through
   rather than looked at on a screen.

   It guesses at nothing. A meaning matches or it does not; there is no stem,
   no article stripped, no plural undone. Every one of those is a rule from
   somebody else's language. A word that does not match is not a failure
   here: it comes back as a gap, and a gap stays in the natural language as
   it was typed. Nothing draws it in red any more -- 「赤文字消して」 OWNER
   2026-08-28. */
(function(root){
  'use strict';
  var api=root.LinguaGrammarEngine;
  if(!api) throw new Error('LinguaGrammarEngine model must load before lexicon');

  function trim(s){ return String(s===undefined||s===null?'':s).replace(/^\s+|\s+$/g,''); }
  function norm(s){ return trim(s).toLowerCase(); }

  /* A word means a LIST of things, and `meanings` is that list. No model is
     stored (adapter.js), so every word arrives with the list and nothing here
     splits the joined `meaning` string back apart. */
  function meaningsOf(word){
    var out=[], src, i, v;
    if(!word) return out;
    if(word.meanings && word.meanings.length) src=word.meanings;
    else return out;
    for(i=0;i<src.length;i++){ v=trim(src[i]); if(v) out.push(v); }
    return out;
  }

  /* Every meaning in the dictionary, longest first, so "sea water" is found
     as one thing rather than as "sea" and then a word nobody has. Ties keep
     the dictionary's own order: Array.prototype.sort is not stable in every
     engine this has to run in, so the position is carried and compared. */
  function keys(model){
    var words=(model&&model.words)||[], out=[], i, j, ms, k;
    for(i=0;i<words.length;i++){
      ms=meaningsOf(words[i]);
      for(j=0;j<ms.length;j++){
        k=norm(ms[j]);
        if(k) out.push({key:k, word:words[i], at:out.length});
      }
    }
    out.sort(function(a,b){ return (b.key.length-a.key.length)||(a.at-b.at); });
    return out;
  }

  /* Every word whose meaning IS this, not merely contains it. More than one
     is an ordinary answer — two words can mean the same thing — so this
     returns the list and lets the caller say which. */
  function find(model, phrase){
    var all=keys(model), p=norm(phrase), out=[], i;
    if(!p) return out;
    for(i=0;i<all.length;i++) if(all[i].key===p) out.push(all[i].word);
    return out;
  }

  /* Where a word ENDS is a thing some scripts write down and some do not.
     Latin writes it with a space, so "eat" may not be found inside "eaten";
     Japanese writes nothing, so 魚 has to be found inside 魚を. One rule
     covers both: a match may not have a letter or a digit of a script that
     writes spaces immediately beside it -- Latin with its accents, Greek and
     Cyrillic. Hangul is left out on purpose: it writes spaces but fastens a
     particle onto the word (고양이가), so it is found inside the way 魚 is. */
  var WORDCH=/[0-9A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u1E00-\u1EFF\u0370-\u03FF\u0400-\u052F]/;
  function edge(text, at, len){
    var before=at>0?text.charAt(at-1):'', after=(at+len)<text.length?text.charAt(at+len):'';
    if(before && WORDCH.test(before) && WORDCH.test(text.charAt(at))) return false;
    if(after && WORDCH.test(after) && WORDCH.test(text.charAt(at+len-1))) return false;
    return true;
  }

  /* What is left over between two matches. A run of nothing but punctuation
     is not a word somebody is missing — it is the comma they typed — so it is
     dropped rather than shown in red. "A word" here means one character that
     is not a space and not one of these marks; the list is mechanical and is
     the only place it is written down. */
  var MARKS=' \t\r\n.,;:!?\'"()[]{}<>/\\|-–—_=+*&^%$#@~`。、，．！？「」『』（）【】〈〉《》…‥・ー〜';
  function isMark(ch){ return MARKS.indexOf(ch)>=0; }
  function bare(s){ var i; for(i=0;i<s.length;i++) if(!isMark(s.charAt(i))) return true; return false; }

  /* A sentence in a natural language, cut into the words this dictionary has
     and the runs it does not. In input order; nothing is arranged here.
     Longest match wins, and a match must sit on an edge. */
  function cut(model, text){
    var all=keys(model), s=String(text===undefined||text===null?'':text),
        out=[], buf='', i=0, j, k, hit, piece;
    while(i<s.length){
      hit=null;
      for(j=0;j<all.length;j++){
        k=all[j].key;
        if(!k.length || i+k.length>s.length) continue;
        if(s.substr(i,k.length).toLowerCase()!==k) continue;
        if(!edge(s,i,k.length)) continue;
        hit=all[j]; break;
      }
      if(hit){
        if(bare(buf)) out.push({kind:'gap', text:trim(buf)});
        buf='';
        piece=s.substr(i,hit.key.length);
        out.push({kind:'word', word:hit.word, surface:String(hit.word.lemma||''), meaning:hit.key, text:piece});
        i+=hit.key.length;
      } else { buf+=s.charAt(i); i++; }
    }
    if(bare(buf)) out.push({kind:'gap', text:trim(buf)});
    return out;
  }

  api.lexicon={meaningsOf:meaningsOf, find:find, cut:cut};
}(typeof window!=='undefined'?window:this));
