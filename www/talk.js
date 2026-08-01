/* Lingua — a conversation held in the language you made
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   The point of inventing a language is to use it, and there was nowhere in
   this app where it was used. You could write words, choose sounds, decide a
   grammar -- and then close the app, having said nothing to anybody.

   So there is somebody here, and the only language it speaks is yours. It has
   read the whole of it: every word and what it means, every sound you chose,
   and every decision in the grammar chapter. It answers by composing lines out
   of your words, in your order, with your marks on them, and it will say them
   out loud in your sounds. Underneath each line is what the words mean, so a
   language you cannot yet read is still a language you can hold a conversation
   in on the day you invent it.

   You answer the same way: by choosing your own words, and putting your own
   grammar on them. That is what the row of marks under the palette is -- the
   plural you decided, the past you decided, the no you decided, applied to the
   word you just picked.

   Everything here is arithmetic on the device, which is why it is free and
   why it works with no network. AI_SEAM in www/glyph.js is where a hosted
   model would join, and what it would add is judgement, not the language: the
   language is already all here. */

var LS_TK='lingua.talk';
var TALK=[];
try{ var tk=JSON.parse(localStorage.getItem(LS_TK)||'[]'); if(Array.isArray(tk)) TALK=tk; }catch(e){}
/* A conversation is not an archive. Keeping the last forty turns is enough to
   scroll back through and small enough never to be a storage question. */
function saveTalk(){
  try{ if(TALK.length>40) TALK=TALK.slice(TALK.length-40);
       localStorage.setItem(LS_TK, JSON.stringify(TALK)); }catch(e){}
}

/* ---- what it has to work with ----------------------------------------- */
function tkBy(pos, avoid){
  var i, w;
  for(i=0;i<WORDS.length;i++){
    w=WORDS[i];
    if(w.pos!==pos) continue;
    if(avoid && avoid[String(w.hw)]) continue;
    return w;
  }
  return null;
}
function tkAnyBy(pos){ return tkBy(pos, null); }
function tkReady(){ return !!(tkAnyBy('n') && tkAnyBy('v')); }

/* One word of a line: the sounds it is made of, and what it means. */
function tkPart(w){ return {s:wPh(w), g:w.mn||String(w.hw)}; }
/* A describing word goes where the grammar says it goes. */
function tkWith(list, noun, adj){
  if(!adj){ list.push(tkPart(noun)); return; }
  if(gHow('adj')==='before'){ list.push(tkPart(adj)); list.push(tkPart(noun)); }
  else { list.push(tkPart(noun)); list.push(tkPart(adj)); }
}
/* Subject, object and verb, arranged the way this language arranges them. */
function tkLine(subj, obj, verb, adj){
  var slot={}, out=[], seq=orderDef().seq, i, k;
  slot.S=function(){ tkWith(out, subj, null); };
  slot.O=function(){ tkWith(out, obj, adj); };
  slot.V=function(){ out.push(tkPart(verb)); };
  for(i=0;i<seq.length;i++){
    k=seq[i];
    if(k==='S' && !subj) continue;
    if(k==='O' && !obj) continue;
    if(k==='V' && !verb) continue;
    slot[k]();
  }
  return out;
}
/* Putting one of your decisions onto one of your words. */
function tkMarked(part, id){
  var ws=gMark(part.s, id), out=[], i, same,
      lab = id==='num'? t('gram.pair.many') : id==='past'? t('gram.pair.past') : t('gram.pair.no');
  for(i=0;i<ws.length;i++){
    same = ws[i].join('')===part.s.join('');
    if(ws.length===1) out.push({s:ws[i], g:part.g+' · '+lab});
    else out.push({s:ws[i], g: same? part.g : lab});
  }
  return out;
}

/* ---- what it says back ------------------------------------------------
   It is answering, so it works from what you just said: your verb if you used
   one, your subject if you used one, and a word you have not used yet for the
   rest -- an answer that only ever repeated you would not be worth having. */
function tkHeard(msg){
  var used={}, i, j, hw;
  if(!msg) return used;
  for(i=0;i<msg.w.length;i++){
    for(j=0;j<WORDS.length;j++){
      hw=String(WORDS[j].hw);
      if(wPh(WORDS[j]).join('')===msg.w[i].join('')) used[hw]=1;
    }
  }
  return used;
}
function tkFromUsed(pos, used, avoid){
  var i, w;
  for(i=0;i<WORDS.length;i++){
    w=WORDS[i];
    if(w.pos===pos && used[String(w.hw)] && !(avoid&&avoid[String(w.hw)])) return w;
  }
  return null;
}
/* Did the line you just sent end (or begin) with the mark you chose for
   asking? Then it was a question, and a question wants an answer. */
function tkAsked(msg){
  if(!msg || gHow('q')==='none' || !gPhOf('q').length) return false;
  var p=gPhOf('q').join(''), n=msg.w.length;
  if(!n) return false;
  return gHow('q')==='start' ? msg.w[0].join('')===p : msg.w[n-1].join('')===p;
}
function tkReply(){
  var last=TALK.length? TALK[TALK.length-1] : null;
  var used=tkHeard(last), avoid={};
  var verb=tkFromUsed('v',used,null) || tkAnyBy('v');
  var subj=tkFromUsed('n',used,null) || tkAnyBy('n');
  if(subj) avoid[String(subj.hw)]=1;
  var obj=tkBy('n',avoid);
  var adj=tkFromUsed('adj',used,null) || tkAnyBy('adj');
  if(!verb || !subj) return null;

  /* An answer to a question is short: the thing, and whether it does it. Every
     other answer says no, so that the negation you decided is heard as well as
     the plain form. */
  if(tkAsked(last)){
    var saidNo = (TALK.length % 4)===1;
    var line=[tkPart(subj), tkPart(verb)];
    if(saidNo && gHow('neg')!=='none' && gPhOf('neg').length){
      var m=tkMarked(line[1],'neg'), k;
      line=[line[0]];
      for(k=0;k<m.length;k++) line.push(m[k]);
    }
    return line;
  }
  return tkLine(subj, obj, verb, adj);
}

/* ---- the conversation, as it is stored and shown ---------------------- */
function tkMsg(parts, mine){
  var w=[], g=[], i;
  for(i=0;i<parts.length;i++){ w.push(parts[i].s); g.push(parts[i].g); }
  return {me:!!mine, w:w, g:g};
}
function tkFlat(msg){ var o=[],i; for(i=0;i<msg.w.length;i++) o=o.concat(msg.w[i]); return o; }
function tkText(msg){ var o=[],i; for(i=0;i<msg.w.length;i++) o.push(msg.w[i].join('')); return o.join(' '); }
function tkIpa(msg){ var o=[],i; for(i=0;i<msg.w.length;i++) o.push(msg.w[i].join('')); return '/'+o.join(' ')+'/'; }
function tkBubble(msg){
  return '<div class="tk'+(msg.me?' me':'')+'">'+
    '<div class="tkw">'+esc(tkText(msg))+'</div>'+
    '<div class="tki">'+esc(tkIpa(msg))+'</div>'+
    '<div class="tkg">'+esc(msg.g.join(' · '))+'</div>'+
    '<button class="tkp" onclick="sayPh('+esc(JSON.stringify(tkFlat(msg)))+')" aria-label="'+esc(t('f.listen'))+'">'+ICON_PLAY+'</button>'+
    '</div>';
}

/* ---- what you are building before you send it ------------------------- */
var tcomp=[], tq='', tkPos=POS_ALL;
function tkAdd(hw){
  var w=findWord(hw); if(!w) return;
  tcomp.push(tkPart(w)); render();
}
function tkBack(){ tcomp.pop(); render(); }
function tkClear(){ tcomp=[]; render(); }
function tkMark(id){
  if(!tcomp.length) return;
  var last=tcomp.pop(), m=tkMarked(last,id), i;
  for(i=0;i<m.length;i++) tcomp.push(m[i]);
  render();
}
function tkAsk(){
  if(gHow('q')==='none' || !gPhOf('q').length) return;
  var p={s:gPhOf('q').slice(), g:t('gram.pair.ask')};
  if(gHow('q')==='start') tcomp.unshift(p); else tcomp.push(p);
  render();
}
function tkSend(){
  if(!tcomp.length) return;
  TALK.push(tkMsg(tcomp, true));
  tcomp=[];
  var r=tkReply();
  if(r) TALK.push(tkMsg(r, false));
  saveTalk(); render();
}
function tkWipe(){
  if(!TALK.length) return;
  if(!confirm(t('confirm.talk.clear'))) return;
  TALK=[]; tcomp=[]; saveTalk(); render();
}
function setTkPos(p){ tkPos=p; render(); }
function setTkQ(v){
  tq=v;
  var el=document.getElementById('tpal'); if(el) el.innerHTML=tkPal();
}
function tkPal(){
  var list=WORDS.filter(function(w){
    if(tkPos!==POS_ALL && w.pos!==tkPos) return false;
    if(!tq) return true;
    return srcKey(w).indexOf(tq.toLowerCase())>=0;
  }).sort(function(a,b){ return String(a.hw).localeCompare(String(b.hw)); });
  if(!list.length) return '<div class="note">'+t('sent.nomatch')+'</div>';
  return list.map(function(w){
    return '<button class="pw" onclick="tkAdd(\''+esc(w.hw)+'\')">'+
      '<span class="pww">'+esc(wOut(w.hw))+'</span>'+
      (w.mn? '<span class="pwm">'+esc(w.mn)+'</span>' : '<span class="pwm dim">'+t('sent.nomean')+'</span>')+
      '</button>';
  }).join('');
}
/* The marks that exist. A decision you have not made puts no button here,
   which is the shortest possible statement of what the grammar chapter is for. */
function tkMarks(){
  var out=[], ids=['num','past','neg'], i, id, lab;
  for(i=0;i<ids.length;i++){
    id=ids[i];
    if(gHow(id)==='none' || (gNeedsPiece(id) && !gPhOf(id).length)) continue;
    lab = id==='num'? t('gram.pair.many') : id==='past'? t('gram.pair.past') : t('gram.pair.no');
    out.push('<button class="tmk" onclick="tkMark(\''+id+'\')"'+(tcomp.length?'':' disabled')+'>'+esc(lab)+'</button>');
  }
  if(gHow('q')!=='none' && gPhOf('q').length)
    out.push('<button class="tmk" onclick="tkAsk()">'+esc(t('gram.pair.ask'))+'</button>');
  if(!out.length) return '';
  return '<div class="tmks">'+out.join('')+'</div>';
}

function vTalk(){
  var head='<div class="view"><div class="chead">'+
    '<button class="back nb" onclick="go(\'home\')">'+ICON_BACK+t('nav.contents')+'</button>'+
    '<div class="chap"><span class="rn">VI</span><span class="ct">'+esc(t('toc.talk'))+'</span>'+
    '<span class="cn">'+TALK.length+'</span></div></div><div class="body">';

  if(!tkReady()){
    return head+'<div class="empty"><div class="eb">'+t('talk.empty.t')+'</div>'+
      '<div class="es">'+t('talk.empty.s')+'</div></div>'+
      '<button class="btn" style="width:100%" onclick="openAdd()">'+t('home.write')+'</button></div></div>';
  }

  var i, thread='';
  for(i=0;i<TALK.length;i++) thread+=tkBubble(TALK[i]);

  return head+
    '<div class="note">'+t('talk.knows', WORDS.length, addedSnd().length, gramCount())+'</div>'+
    (TALK.length
      ? '<div class="tkthread">'+thread+'</div>'
      : '<div class="note" style="margin-top:14px">'+t('talk.first')+'</div>')+

    '<div class="sec">'+t('talk.compose')+'</div>'+
    '<div class="seqbox"><span class="seq" id="t-seq">'+
      esc(tcomp.map(function(p){ return p.s.join(''); }).join(' '))+'</span>'+
      '<button class="seqdel" onclick="tkBack()"'+(tcomp.length?'':' disabled')+
      ' aria-label="'+esc(t('glyph.undo'))+'">'+ICON_BACK+'</button></div>'+
    (tcomp.length? '<div class="note">'+esc(tcomp.map(function(p){ return p.g; }).join(' · '))+'</div>' : '')+
    tkMarks()+
    '<div class="tsend"><button class="btn" onclick="tkSend()"'+(tcomp.length?'':' disabled')+'>'+t('talk.send')+'</button>'+
      '<button class="btn ghost" onclick="tkClear()"'+(tcomp.length?'':' disabled')+'>'+t('sent.clear')+'</button></div>'+

    '<div class="sec">'+t('sent.choose')+'</div>'+
    '<div class="segs">'+[POS_ALL].concat(POS).map(function(p){
      return '<button class="seg'+(p===tkPos?' on':'')+'" onclick="setTkPos(\''+p+'\')">'+esc(posLabel(p))+'</button>';
    }).join('')+'</div>'+
    '<div class="search"><span class="lens">'+ICON_LENS+'</span>'+
    '<input placeholder="'+esc(t('sent.search'))+'" value="'+esc(tq)+'" oninput="setTkQ(this.value)"></div>'+
    '<div class="pal" id="tpal">'+tkPal()+'</div>'+

    (TALK.length? '<button class="btn ghost" style="width:100%;margin-top:16px" onclick="tkWipe()">'+
      t('talk.wipe')+'</button>' : '')+
    (has('plus')? '' :
      '<button class="lock" onclick="go(\'plans\')"><span class="lk">'+ICON_PLUS+'</span>'+
      '<span><span class="lt">'+t('ai.title')+'</span><br><span class="ld">'+t('ai.hint')+'</span></span>'+
      '<span class="tag">PLUS</span></button>')+
    '<div class="note" style="margin-top:20px">'+t('talk.footer')+'</div>'+
    '</div></div>';
}
