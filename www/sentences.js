/* Lingua — coining words in bulk that keep your rules
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   The sentences chapter used to live here too: a screen for weaving a line
   out of words and keeping it. 「例文ページはもういらんやろ」 -- and he is right,
   because an example belongs to the thing it is an example OF. A line
   showing what a word means belongs on the word; a line showing what a rule
   does belongs on that part of the grammar. Both of those exist now, so a
   chapter of loose lines was a third place with no owner.

   What survives is coining: ask for eight words of a part of speech built
   out of the sounds this language already uses, keep the ones you like. */

/* =========================================================================
   10. Make (mass-producing words that keep your rules — free.
       Generating a whole themed vocabulary with an AI is the paid tier.)
   ========================================================================= */
var mkPos='n', cands=[];
/* A candidate is a sequence of sounds. Its spelling is what that sequence
   looks like written down, which is why nothing here stores one. */
function buildCands(n){
  var A=analyze(), tk=taken(); cands=[];
  for(var i=0;i<(n||8);i++){
    var q=makeWord(mkPos,A,tk);
    if(q) cands.push({q:q, on:true});
  }
}
function candHw(c){ return c.q.join(''); }
function vMake(){
  var A=analyze();
  if(!cands.length) buildCands(8);
  var rule=A.finalRule[mkPos];
  var left = has('plus') ? null : (FREE_LIMIT-WORDS.length);
  return '<div class="view">'+
    navTop('')+
    '<div class="body">'+
    '<div class="segs" style="margin-top:10px">'+POS.map(function(p){
      return '<button class="seg'+(p===mkPos?' on':'')+'"' + DO('mkSetPos', [p]) + '>'+esc(posLabel(p))+'</button>';
    }).join('')+'</div>'+
    (cands.length? cands.map(function(c,i){
      return '<div class="cand">'+
        '<button class="ck'+(c.on?' on':'')+'"' + DO('mkTog', [i]) + ' aria-label="'+esc(t('make.pick'))+'">'+
          '<span class="ckb">'+(c.on?ICON_TICK:'')+'</span></button>'+
        '<span class="cw">'+esc(candHw(c))+'</span><span class="crd">'+esc(readSeq(c.q))+'</span>'+
        '<button class="rr"' + DO('mkReroll', [i]) + ' aria-label="'+esc(t('make.one'))+'">'+ICON_AGAIN+'</button>'+
        '<button class="rr"' + DO('sayPh', [c.q]) + ' aria-label="'+esc(t('sent.say'))+'">'+ICON_PLAY+'</button></div>';
    }).join('') : '<div class="empty"><div class="eb">'+t('make.empty.t')+'</div><div class="es">'+t('make.empty.s')+'</div></div>')+
    (left!==null? '<div class="note" style="margin-top:16px">'+tn('make.left', Math.max(0,left))+'</div>':'')+
    (has('studio')?'':'<button class="lock"' + DO('go', ["plans"]) + '><span class="lk">'+ICON_PLUS+'</span>'+
      '<span><span class="lt">'+t('make.lock.t')+'</span><br>'+
      '<span class="ld">'+t('make.lock.d')+'</span></span>'+
      '<span class="tag">STUDIO</span></button>')+
    '</div>'+
    '<div class="barfix"><button class="btn ghost"' + DO('mkRegen') + '>'+t('make.reroll')+'</button>'+
    '<button class="btn"' + DO('mkCommit') + '>'+t('make.commit')+'</button></div></div>';
}
function mkSetPos(p){ mkPos=p; cands=[]; render(); }
function mkTog(i){ cands[i].on=!cands[i].on; render(); }
function mkReroll(i){
  var A=analyze(), tk=taken();
  cands.forEach(function(c,j){ if(j!==i) tk[candHw(c)]=1; });
  var q=makeWord(mkPos,A,tk); if(q){ cands[i]={q:q, on:cands[i].on}; render(); }
}
function mkRegen(){ cands=[]; render(); }
function mkCommit(){
  var sel=cands.filter(function(c){return c.on;});
  if(!sel.length){ toast(t('toast.noselect')); return; }
  if(!capOK(sel.length)){ go('plans'); toast(t('toast.cap', FREE_LIMIT)); return; }
  sel.forEach(function(c){ WORDS.push({hw:candHw(c), ph:c.q.slice(), mn:'', pos:mkPos, at:Date.now()}); });
  save(); cands=[];
  toast(tn('toast.added.n', sel.length));
  go('words');
}

