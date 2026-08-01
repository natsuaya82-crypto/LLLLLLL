/* Lingua — how a word is read out: IPA, the approximation, and the voice
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */


/* ---- What the rest of the app is allowed to know ------------------------
   The IPA is universal, so it is never swapped. Only the reading changes,
   and every screen goes through rd() / rdSyl(), so no screen knows which
   language it is showing. */
function approx(){ return langDef().read || LANG.en.read; }
function rd(word){ return approx().word(word); }        /* reading for this language */
function rdSyl(sy){ return approx().syl(sy); }
/* The name of the approximation reads as a common noun inside a sentence
   ("respelling is an approximation") but wants a capital as a button. */
function capFirst(s){ return String(s).charAt(0).toUpperCase()+String(s).slice(1); }
/* Search hits on any of spelling, meaning, reading or IPA */
function srcKey(w){ return (w.hw+' '+(w.mn||'')+' '+phIpa(wPh(w))).toLowerCase(); }

/* ---- The IPA. The reading is the near miss in a familiar script;
        this is the actual sound. ---- */
var IPA_C={b:'b',ch:'tʃ',d:'d',f:'f',g:'ɡ',h:'h',j:'j',k:'k',l:'l',m:'m',n:'n',
           p:'p',r:'r',s:'s',sh:'ʃ',t:'t',th:'θ',v:'v',w:'w',z:'z',
           c:'k',q:'k',x:'ks',y:'j'};
var IPA_V={a:'a',e:'e',i:'i',o:'o',u:'u',y:'i'};
function ipaC(str){ return splitC(str).map(function(c){ return IPA_C[c]||c; }).join(''); }
function ipaV(str){
  var out='', prev='';
  str.split('').forEach(function(v){
    var s=IPA_V[v]||v;
    if(s===prev) out+='ː';            /* the same vowel twice is one long vowel */
    else { out+=s; prev=s; }
  });
  return out;
}
function ipaSyl(sy){
  var p=parts(sy);
  if(!p) return ipaC(sy);
  return ipaC(p.on)+ipaV(p.nu)+ipaC(p.co);
}
function ipaWord(word){ return syl(word).map(ipaSyl).join('.'); }   /* . marks the syllable break */
function ipa(word){ return '/'+ipaWord(word)+'/'; }

function linked(words){
  var raw=words.map(function(w){return String(w).toLowerCase().replace(/[^a-z]/g,'');});
  var out='', any=false;
  for(var i=0;i<raw.length;i++){
    var cur=raw[i], nxt=raw[i+1];
    if(nxt && !isV(cur.charAt(cur.length-1)) && isV(nxt.charAt(0))){ out += cur; any=true; }
    else { out += cur; if(nxt) out+=' '; }
  }
  var chunks=out.split(' ');
  return {chunks:chunks,
          rd:   chunks.map(rd).join(' '),
          ipa: '/'+chunks.map(ipaWord).join(' ')+'/',
          isLink:any};
}
/* How readings are displayed (a setting): IPA / approximation / both.
   The stored value 'kana' is kept as-is for dictionaries saved before this
   layer existed; it means "the approximation", whatever language that is. */
function readMode(){ return SET.read||'both'; }
function readOut(word){
  var m=readMode();
  if(m==='ipa')  return ipa(word);
  if(m==='kana') return rd(word);
  return ipa(word)+t('read.sep')+rd(word);
}
function readLink(L){
  var m=readMode();
  if(m==='ipa')  return L.ipa;
  if(m==='kana') return L.rd;
  return L.ipa+'<br><span class="kn">'+esc(L.rd)+'</span>';
}
/* One tile in the inventory of sounds: the letter, and under it the IPA
   symbol for what that letter actually says. */
function phChip(c,cls,isVowel){
  var s=isVowel? (IPA_V[c]||c) : (IPA_C[c]||c);
  return '<span class="ph'+(cls||'')+'">'+esc(c)+'<i>'+esc(s)+'</i></span>';
}
/* ---- The device's voice is not here any more ---------------------------
   There used to be a block below this line that found a voice on the phone,
   picked the one whose language had the plainest vowels, and read a word
   through it -- reading the katakana instead of the spelling when the only
   voice was Japanese. All of it was a way of choosing whose accent to be
   wrong in. A phoneme is built now, in www/voice.js, out of the chart's own
   features, so there is nothing left for a device voice to do. */

/* Generation: build new words that keep the rules we inferred.
   Also plain arithmetic on the device. */
function pick(o){
  var e=Object.keys(o).map(function(k){return [k,o[k]];});
  if(!e.length) return '';
  var sum=0,i; for(i=0;i<e.length;i++) sum+=e[i][1];
  var r=Math.random()*sum;
  for(i=0;i<e.length;i++){ r-=e[i][1]; if(r<=0) return e[i][0]; }
  return e[0][0];
}
/* Two words that are spelled differently but sound identical count as taken */
function taken(){
  var s={}; WORDS.forEach(function(w){ s[String(w.hw).toLowerCase()]=1; s['ipa:'+phIpa(wPh(w))]=1; }); return s;
}
function makeWord(pos, A, tk){
  A=A||analyze(); tk=tk||taken();
  if(!Object.keys(A.nu).length) return null;
  var rule=A.finalRule[pos];
  for(var tr=0;tr<120;tr++){
    var n=Math.max(1,Math.min(3,+pick(A.cnt)||2));
    var w='';
    for(var i=0;i<n;i++){
      var pool = i===0 ? A.onI : (Object.keys(A.onM).length?A.onM:A.onI);
      w += pick(pool)+pick(A.nu);
    }
    if(rule){
      var ch=rule.ch;
      if(isV(ch)){ w=w.replace(/[^aeiouy]+$/,'').replace(/[aeiouy]+$/,ch); }
      else { w=w.replace(/[^aeiouy]+$/,'')+ch; }
    } else if(Object.keys(A.co).length && Math.random()<.35){ w+=pick(A.co); }
    if(w.length< (tr<70?4:3)) continue;   /* look for four letters first, settle for three */
    if(tk[w]) continue;
    var key='ipa:'+ipa(w);
    if(tk[key]) continue;
    tk[w]=1; tk[key]=1;
    return w.charAt(0).toUpperCase()+w.slice(1);
  }
  return null;
}
/* Pick a short run of words that shows linking off, if the dictionary has one */
function linkRun(){
  if(!WORDS.length) return [];
  var used={}, seq=[], all=WORDS.slice(), start=null;
  for(var i=0;i<all.length;i++){
    var h=String(all[i].hw).toLowerCase();
    if(!isV(h.charAt(h.length-1))){ start=all[i]; break; }
  }
  seq.push(start||all[0]); used[seq[0].hw]=1;
  while(seq.length<3 && seq.length<all.length){
    var last=String(seq[seq.length-1].hw).toLowerCase();
    var want=!isV(last.charAt(last.length-1));
    var nxt=null;
    for(var k=0;k<all.length;k++){
      if(used[all[k].hw]) continue;
      var s2=String(all[k].hw).toLowerCase();
      if(want && isV(s2.charAt(0))){ nxt=all[k]; break; }
    }
    if(!nxt) for(var m=0;m<all.length;m++){ if(!used[all[m].hw]){nxt=all[m];break;} }
    if(!nxt) break;
    used[nxt.hw]=1; seq.push(nxt);
  }
  return seq;
}
/* What the dictionary has quietly decided, said in ordinary words */
function findings(){
  var A=analyze(), out=[], N=WORDS.length;
  if(!N) return out;

  /* The word-final rule, once three words of one part of speech exist */
  Object.keys(A.finalRule).forEach(function(p){
    var r=A.finalRule[p];
    out.push({t:t('find.final.t', posLabel(p), r.ch),
              d:t('find.final.d', r.all, r.hit), rate:r.rate});
  });

  /* The inventory can be named from the very first word. It is the first
     thing anybody can see about their own language. */
  if(A.used.length){
    out.push({t:t('find.cons.t', A.used.join(', ')),
              d:t('find.cons.d', N),
              rate:Math.min(1,A.used.length/10)});
  }
  if(A.vowels.length && A.vowels.length<=4){
    out.push({t:t('find.vow.t', A.vowels.join(', '), A.vowels.length),
              d:t('find.vow.d'),
              rate:1-A.vowels.length/6});
  }
  if(A.sylMode && N>=3){
    out.push({t:tn('find.syl.t', A.sylMode.n),
              d:t('find.syl.d', A.sylMode.all, A.sylMode.hit),
              rate:A.sylMode.hit/A.sylMode.all});
  }
  var codas=Object.keys(A.co);
  if(codas.length && codas.length<=4 && N>=3){
    out.push({t:t('find.coda.t', codas.join(', ')),
              d:t('find.coda.d'), rate:1-codas.length/8});
  }
  if(A.unused.length>=4 && N>=3){
    out.push({t:t('find.unused.t', A.unused.slice(0,6).join(', ')),
              d:t('find.unused.d'), rate:A.unused.length/CONS.length});
  }
  return out;
}
/* What to do next so that another rule appears, in words a beginner can act on */
function nextHint(){
  var A=analyze(), by={};
  WORDS.forEach(function(w){ by[w.pos]=(by[w.pos]||0)+1; });
  var need=null;
  ['n','v','adj'].forEach(function(p){
    if(need) return;
    if(!A.finalRule[p] && (by[p]||0)<3) need={p:p, n:3-(by[p]||0)};
  });
  if(need) return tn('hint.pos', need.n, posLabel(need.p));
  if(WORDS.length<8) return t('hint.more');
  return null;
}

