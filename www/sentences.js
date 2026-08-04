/* Lingua — sentences, and coining words in bulk that keep your rules
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   9.5 Sentences (choose a word order, then hear how the words run together)
       Also pure arithmetic on the device. Also free.
   ========================================================================= */
/* The word order this screen checks against is not chosen here any more. It
   is one of the grammar decisions, so it lives with the others, in the
   chapter where decisions are made; this screen reads it and says where it
   came from. ORDERS, orderDef and setOrder are in www/grammar.js. */
function byPos(p){ return WORDS.filter(function(w){return w.pos===p;}); }

/* A line is woven freely. The word order is a rule you set, used afterwards
   to check what you built — never to stop you building it. Any length, and
   the same word as many times as you like. */
var comp=[], compSel=-1, compQ='', compPos=POS_ALL, compSeeded=false;
function compAdd(hw){ comp.push(hw); compSel=comp.length-1; render(); }
function compPick(i){ compSel = (compSel===i? -1 : i); render(); }
function compMove(d){
  var i=compSel, j=i+d;
  if(i<0||j<0||j>=comp.length) return;
  var sw=comp[i]; comp[i]=comp[j]; comp[j]=sw; compSel=j; render();
}
function compDel(){ if(compSel<0) return; comp.splice(compSel,1); compSel=-1; render(); }
function compClear(){ comp=[]; compSel=-1; render(); }
function compUndo(){ comp.pop(); compSel=-1; render(); }
function setCompPos(p){ compPos=p; render(); }
function setCompQ(v){
  compQ=v;
  var el=document.getElementById('pal'); if(el) el.innerHTML=palList();
}
function palList(){
  var list=WORDS.filter(function(w){
    if(compPos!==POS_ALL && w.pos!==compPos) return false;
    if(!compQ) return true;
    return srcKey(w).indexOf(compQ.toLowerCase())>=0;
  }).sort(function(a,b){return String(a.hw).localeCompare(String(b.hw));});
  if(!list.length) return '<div class="note">'+t('sent.nomatch')+'</div>';
  return list.map(function(w){
    return '<button class="pw" onclick="compAdd(\''+esc(w.hw)+'\')">'+
      '<span class="pww">'+esc(w.hw)+'</span>'+
      (wMn(w)? '<span class="pwm">'+esc(wMn(w))+'</span>':'<span class="pwm dim">'+t('sent.nomean')+'</span>')+
      '</button>';
  }).join('');
}
/* Does the line as it stands match the order you chose for this language? */
function orderCheck(){
  var ws=comp.map(findWord).filter(Boolean);
  if(ws.length<2) return null;
  var verbs=ws.filter(function(w){return w.pos==='v';});
  var nouns=ws.filter(function(w){return w.pos==='n';});
  if(verbs.length!==1 || nouns.length<1 || nouns.length>2 || ws.length!==verbs.length+nouns.length) return null;
  var seq=ws.map(function(w){
    if(w.pos==='v') return 'V';
    return (nouns.indexOf(w)===0)?'S':'O';
  }).join('');
  var want=orderDef().seq.filter(function(k){
    if(k==='V') return true;
    if(k==='S') return nouns.length>=1;
    return nouns.length>=2;
  }).join('');
  return {now:seq, want:want, ok:seq===want};
}
function fixOrder(){
  var c=orderCheck(); if(!c||c.ok) return;
  var ws=comp.map(findWord).filter(Boolean);
  var verbs=ws.filter(function(w){return w.pos==='v';});
  var nouns=ws.filter(function(w){return w.pos==='n';});
  var slot={V:verbs[0], S:nouns[0], O:nouns[1]};
  comp=orderDef().seq.map(function(k){ return slot[k]?slot[k].hw:null; }).filter(Boolean);
  compSel=-1; save(); render(); toast(t('toast.reordered'));
}
function vSent(){
  var d=orderDef();
  /* Seed the line once, so the screen makes a sound the moment it opens.
     Only ever once — otherwise "Clear" would never stay cleared. */
  if(!compSeeded && !comp.length && WORDS.length>=2){
    compSeeded=true;
    var nouns=byPos('n'), verbs=byPos('v');
    if(nouns.length && verbs.length){
      /* a noun that opens on a vowel, after one that closes on a consonant:
         the pair that makes the linking audible the moment the screen opens */
      var vf=null, i, q;
      for(i=0;i<nouns.length;i++){ q=wPh(nouns[i]); if(q.length && ipaIsVowel(q[0])){ vf=nouns[i]; break; } }
      var subj=null;
      for(i=0;i<nouns.length;i++){
        q=wPh(nouns[i]);
        if(nouns[i]!==vf && q.length && !ipaIsVowel(q[q.length-1])){ subj=nouns[i]; break; }
      }
      if(!subj) for(i=0;i<nouns.length;i++) if(nouns[i]!==vf){ subj=nouns[i]; break; }
      var slot={S:(subj||nouns[0]), O:(vf&&vf!==subj?vf:nouns[1]), V:verbs[0]};
      comp=d.seq.map(function(k){return slot[k]?slot[k].hw:null;}).filter(Boolean);
    }
  }
  var ws=comp.map(findWord).filter(Boolean);
  var L = ws.length>=2 ? linked(ws.map(function(w){return w.hw;})) : null;
  var chk=orderCheck();
  var head='<div class="view">'+
    navTop(LINES.length)+'<div class="body">';

  if(WORDS.length<2){
    return head+'<div class="empty"><div class="eb">'+t('sent.empty.t')+'</div>'+
      '<div class="es">'+t('sent.empty.s')+'</div></div>'+
      '<button class="btn" style="width:100%" onclick="openAdd()">'+t('home.write')+'</button></div></div>';
  }

  return head+
    /* --- 1. Weave (free: any length, any arrangement) --- */
    '<div class="sec">'+t('sent.weave')+'</div>'+
    (comp.length
      ? '<div class="weave">'+comp.map(function(hw,i){
          var w=findWord(hw);
          return '<button class="wc'+(i===compSel?' on':'')+'" onclick="compPick('+i+')">'+
            '<span class="wcw">'+esc(hw)+'</span>'+
            (w&&wMn(w)? '<span class="wcm">'+esc(wMn(w))+'</span>':'')+'</button>';
        }).join('')+'</div>'+
        (compSel>=0
          ? '<div class="wctl"><button onclick="compMove(-1)">'+ICON_BACK+t('sent.prev')+'</button>'+
            '<button onclick="compMove(1)">'+t('sent.later')+ICON_GO+'</button>'+
            '<button onclick="compDel()">'+t('sent.remove')+'</button></div>'
          : '<div class="note">'+t('sent.taphint')+'</div>')
      : '<div class="note">'+t('sent.palhint')+'</div>')+
    (comp.length? '<div class="wctl2"><button onclick="compUndo()">'+t('sent.undo')+'</button>'+
      '<button onclick="compClear()">'+t('sent.clear')+'</button></div>':'')+

    /* --- 2. The sound of it, linking included --- */
    (L
      ? '<div class="sec">'+t('sent.reads')+'</div>'+
        '<div class="link">'+
        '<div class="sline">'+ws.map(function(w){
          return '<span class="sw"><span class="sww">'+esc(w.hw)+'</span>'+
                 '<span class="swk">'+esc(wMn(w)||'—')+'</span></span>';
        }).join('')+'</div>'+
        '<div class="arw">'+(L.isLink? t('link.yes') : t('link.no'))+'</div>'+
        '<div class="out">'+readLink(L)+'</div>'+
        '<button class="play" onclick="sayWords('+esc(JSON.stringify(ws.map(function(w){return w.hw;})))+')">'+ICON_PLAY+t('sent.say')+'</button>'+
        '</div>'+
        (L.isLink? '' : '<div class="note" style="margin-top:8px">'+t('sent.linkhint')+'</div>')+
        '<button class="btn ghost" style="width:100%;margin-top:14px" onclick="keepLine()">'+t('sent.keep')+'</button>'
      : '<div class="note" style="margin-top:14px">'+t('sent.need2')+'</div>')+

    /* --- 3. Choosing words --- */
    '<div class="sec">'+t('sent.choose')+'</div>'+
    '<div class="segs">'+[POS_ALL].concat(POS).map(function(p){
      return '<button class="seg'+(p===compPos?' on':'')+'" onclick="setCompPos(\''+p+'\')">'+esc(posLabel(p))+'</button>';
    }).join('')+'</div>'+
    '<div class="search"><span class="lens">'+ICON_LENS+'</span>'+
    '<input placeholder="'+esc(t('sent.search'))+'" value="'+esc(compQ)+'" oninput="setCompQ(this.value)"></div>'+
    '<div class="pal" id="pal">'+palList()+'</div>'+

    /* --- 4. Word order: the rule you set in the grammar, used to check
       what you built here. It is shown, not offered: one place decides it. --- */
    '<div class="sec">'+t('sent.order')+'</div>'+
    '<button class="gpiece has" onclick="go(\'gram\')">'+
      '<span class="gpl">'+esc(t('toc.gram'))+'</span>'+
      '<span class="gpv">'+esc(d.id)+'</span>'+ICON_GO+'</button>'+
    '<div class="note">'+t('sent.order.d')+'</div>'+
    (chk
      ? (chk.ok
          ? '<div class="chk ok">'+t('sent.chk.ok', chk.now)+'</div>'
          : '<div class="chk ng">'+t('sent.chk.ng', chk.now, chk.want)+
            '<button onclick="fixOrder()">'+t('sent.chk.fix')+'</button></div>')
      : '<div class="note" style="margin-top:10px">'+t('sent.chk.hint')+'</div>')+

    /* --- 5. Sentences you kept --- */
    (LINES.length? '<div class="sec">'+t('sent.kept')+'</div>'+LINES.slice().reverse().map(function(l,i){
        var idx=LINES.length-1-i, lk=linked(l.ws);
        return '<div class="entry" style="display:block">'+
          '<div class="hwrow"><span class="hw" style="font-size:1.06rem">'+esc(l.ws.map(wOut).join(' '))+'</span>'+
          '<span class="pos">'+esc(l.order||'')+'</span></div>'+
          '<div class="mn" style="font-size:.92rem">'+readLink(lk)+'</div>'+
          '<div style="display:flex;gap:8px;margin-top:8px">'+
          '<button class="rr2" onclick="sayWords('+esc(JSON.stringify(l.ws))+')">'+ICON_PLAY+t('sent.listen')+'</button>'+
          '<button class="rr2" onclick="reopenLine('+idx+')">'+t('sent.reweave')+'</button>'+
          '<button class="rr2" onclick="dropLine('+idx+')">'+t('sent.drop')+'</button></div></div>';
      }).join('') : '')+
    '<div class="note" style="margin-top:22px">'+t('sent.footer')+'</div>'+
    '</div></div>';
}
function keepLine(){
  if(comp.length<2){ toast(t('toast.need2')); return; }
  LINES.push({ws:comp.slice(), order:(orderCheck()? orderDef().id : ''), at:Date.now()});
  save(); render(); toast(t('toast.kept'));
}
function reopenLine(i){ comp=LINES[i].ws.slice(); compSel=-1; render(); window.scrollTo(0,0); }
function dropLine(i){ LINES.splice(i,1); save(); render(); toast(t('toast.dropped')); }

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
      return '<button class="seg'+(p===mkPos?' on':'')+'" onclick="setPos(\''+p+'\')">'+esc(posLabel(p))+'</button>';
    }).join('')+'</div>'+
    '<div class="note">'+(rule
      ? t('make.rule', posLabel(mkPos), rule.ch)
      : t('make.norule', posLabel(mkPos)))+'</div>'+
    (cands.length? cands.map(function(c,i){
      return '<div class="cand">'+
        '<button class="ck'+(c.on?' on':'')+'" onclick="tog('+i+')" aria-label="'+esc(t('make.pick'))+'">'+
          '<span class="ckb">'+(c.on?ICON_TICK:'')+'</span></button>'+
        '<span class="cw">'+esc(candHw(c))+'</span><span class="crd">'+esc(readSeq(c.q))+'</span>'+
        '<button class="rr" onclick="reroll('+i+')" aria-label="'+esc(t('make.one'))+'">'+ICON_AGAIN+'</button>'+
        '<button class="rr" onclick="sayPh('+esc(JSON.stringify(c.q))+')" aria-label="'+esc(t('sent.say'))+'">'+ICON_PLAY+'</button></div>';
    }).join('') : '<div class="empty"><div class="eb">'+t('make.empty.t')+'</div><div class="es">'+t('make.empty.s')+'</div></div>')+
    (left!==null? '<div class="note" style="margin-top:16px">'+tn('make.left', Math.max(0,left))+'</div>':'')+
    (has('studio')?'':'<button class="lock" onclick="go(\'plans\')"><span class="lk">'+ICON_PLUS+'</span>'+
      '<span><span class="lt">'+t('make.lock.t')+'</span><br>'+
      '<span class="ld">'+t('make.lock.d')+'</span></span>'+
      '<span class="tag">STUDIO</span></button>')+
    '</div>'+
    '<div class="barfix"><button class="btn ghost" onclick="regen()">'+t('make.reroll')+'</button>'+
    '<button class="btn" onclick="commit()">'+t('make.commit')+'</button></div></div>';
}
function setPos(p){ mkPos=p; cands=[]; render(); }
function tog(i){ cands[i].on=!cands[i].on; render(); }
function reroll(i){
  var A=analyze(), tk=taken();
  cands.forEach(function(c,j){ if(j!==i) tk[candHw(c)]=1; });
  var q=makeWord(mkPos,A,tk); if(q){ cands[i]={q:q, on:cands[i].on}; render(); }
}
function regen(){ cands=[]; render(); }
function commit(){
  var sel=cands.filter(function(c){return c.on;});
  if(!sel.length){ toast(t('toast.noselect')); return; }
  if(!capOK(sel.length)){ go('plans'); toast(t('toast.cap', FREE_LIMIT)); return; }
  sel.forEach(function(c){ WORDS.push({hw:candHw(c), ph:c.q.slice(), mn:'', pos:mkPos, at:Date.now()}); });
  save(); cands=[];
  toast(tn('toast.added.n', sel.length));
  go('words');
}

