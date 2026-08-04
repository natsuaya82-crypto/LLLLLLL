/* Lingua — a grammar is built in stages, and words get made while you build it
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   The grammar chapter was seven decisions in a row with nothing between them.
   It asked for a word order before the language had a word for "I" -- so the
   very first decision could not be demonstrated, let alone used. And there was
   nowhere in it to write a word down, which meant deciding how to say no and
   then leaving to go and make the word for no.

   It is stages now, in the order they unlock each other. Greetings first,
   because one word is enough to say something out loud. Then the pronouns,
   because without them there is no subject and word order has nothing to
   arrange. Then word order, and from there the rest.

   Each stage holds four things: the words it needs, made on the spot; the
   decisions it carries; a note of its own; and a line you can now say that you
   could not say before. It is finished when all of that is filled.

   The list does not end. The last row adds a stage of your own -- honorifics,
   kinship, direction, whatever this language turns out to need -- with its own
   words and its own note. Nothing here limits how many.

   Nouns are not here. Water and mountain belong to the dictionary. What lives
   in a stage is the words you cannot make a sentence without: pronouns,
   question words, numbers, the words for yes and no. */

var LS_STG='lingua.phases';
/* {done:{}, notes:{}, set:{}, extra:[]} -- `set` is which decisions have been
   touched, because every decision has a default and a default is not a
   choice. */
var STG={done:{}, notes:{}, set:{}, extra:[]};
try{
  var stgs=JSON.parse(localStorage.getItem(LS_STG)||'null');
  if(stgs){ STG.done=stgs.done||{}; STG.notes=stgs.notes||{}; STG.set=stgs.set||{}; STG.extra=stgs.extra||[]; }
}catch(e){}
function saveStg(){ try{ localStorage.setItem(LS_STG, JSON.stringify(STG)); }catch(e){} }

/* The stages, in the order they open each other up. `slots` are the words the
   stage cannot do without; `feats` are the decisions from www/grammar.js it
   carries. A stage may have only one of the two. */
var STAGES=[
  {id:'greet', slots:['yes','no','hello','bye','thanks'], pos:'x',   feats:[]},
  {id:'pron',  slots:['i','you','he','we','youpl','they'], pos:'n',  feats:[]},
  {id:'order', slots:[], pos:'v', feats:['order']},
  {id:'num',   slots:[], pos:'n', feats:['num']},
  {id:'time',  slots:[], pos:'v', feats:['past']},
  {id:'neg',   slots:[], pos:'v', feats:['neg']},
  {id:'ask',   slots:['what','who','where','when'], pos:'x', feats:['q']},
  {id:'desc',  slots:[], pos:'adj', feats:['adj']},
  {id:'have',  slots:[], pos:'n', feats:['poss']},
  /* The numbers are numerals, which read the same in every language on the
     list, so they are the one set of labels that needs no translating. */
  {id:'count', slots:['1','2','3','4','5','6','7','8','9','10'], pos:'x', feats:[]}
];
function stAll(){
  var out=STAGES.slice(), i;
  for(i=0;i<STG.extra.length;i++) out.push({id:STG.extra[i].id, slots:STG.extra[i].slots||[],
                                           pos:'x', feats:[], own:STG.extra[i]});
  return out;
}
function stBy(id){
  var a=stAll(), i;
  for(i=0;i<a.length;i++) if(a[i].id===id) return a[i];
  return null;
}
/* What a slot is called. A stage you added names its own; the numbers name
   themselves. */
function stSlotLabel(p, k){
  if(p.own){
    var i, s=p.own.labels||{};
    return s[k]||k;
  }
  if(p.id==='count') return k;
  return t('stg.'+p.id+'.'+k);
}
function stTitle(p){ return p.own ? (p.own.title||t('stg.own.untitled')) : t('stg.'+p.id+'.t'); }
function stWhat(p){ return p.own ? (p.own.what||'') : t('stg.'+p.id+'.d'); }

/* ---- a word made for a slot -------------------------------------------
   It goes into the dictionary like any other word. It also remembers which
   slot it filled, so the stage can see that it is done and so changing it
   later changes it here too. */
function stWordFor(p, k){
  var key=p.id+'.'+k, i;
  for(i=0;i<WORDS.length;i++) if(WORDS[i].slot===key) return WORDS[i];
  return null;
}
function stSlotsDone(p){
  var n=0, i;
  for(i=0;i<p.slots.length;i++) if(stWordFor(p, p.slots[i])) n++;
  return n;
}
/* A decision counts once it has been touched. Every one of them has a default
   and a default nobody chose is not a decision. */
function stTouched(id){ return !!STG.set[id]; }
function stMarkSet(id){ STG.set[id]=1; saveStg(); }
function stFeatsDone(p){
  var n=0, i;
  for(i=0;i<p.feats.length;i++) if(stTouched(p.feats[i])) n++;
  return n;
}
function stTotal(p){ return p.slots.length + p.feats.length; }
function stFilled(p){ return stSlotsDone(p) + stFeatsDone(p); }
function stIsDone(p){ return stTotal(p)>0 && stFilled(p)>=stTotal(p); }
function stCount(){
  var a=stAll(), n=0, i;
  for(i=0;i<a.length;i++) if(stIsDone(a[i])) n++;
  return n;
}

/* ---- the sheet where a slot's word is made ---------------------------- */
var stFor=null, stSlot='', stSeq=[], stSug=[];
function stTap(sym){ sayOne(sym); stSeq.push(sym); stPaint(); }
function stBack(){ stSeq.pop(); stPaint(); }
function stPaint(){
  var s=document.getElementById('st-seq'), r=document.getElementById('st-ipa'),
      b=document.getElementById('st-back'), k=document.getElementById('st-keep');
  if(s) s.textContent=stSeq.join('');
  if(r) r.textContent=stSeq.length? phIpa(stSeq) : '';
  if(b) b.disabled=!stSeq.length;
  if(k) k.disabled=!stSeq.length;
}
function stSugPaint(){
  var e=document.getElementById('st-sug'); if(e) e.innerHTML=stSugHTML();
}
/* Three words this language could plausibly make, each one sayable before it
   is taken. Nothing is chosen for you; something is put in front of you. */
function stAsk(){
  stSug=asWords(stFor? stFor.pos : 'x', 3);
  stSugPaint();
}
function stSugHTML(){
  if(!stSug.length) return '<button class="btn ghost" style="width:100%" onclick="stAsk()">'+t('stg.help')+'</button>';
  return '<div class="sugbox"><div class="sugchips">'+stSug.map(function(q,i){
      return '<button class="sugchip" onclick="stTake('+i+')">'+
        '<span class="sw">'+esc(q.join(''))+'</span>'+
        '<span class="sr">'+esc(phIpa(q))+'</span></button>';
    }).join('')+'</div>'+
    '<div class="sugfoot"><span class="sughint">'+t('stg.help.d')+'</span>'+
    '<button class="sugmore" onclick="stAsk()">'+t('stg.again')+'</button></div></div>';
}
function stTake(i){
  if(!stSug[i]) return;
  stSeq=stSug[i].slice();
  sayPh(stSeq);
  stPaint();
}
function openSlot(pid, k){
  var p=stBy(pid) || stAll()[0];
  stFor=p; stSlot=(k===undefined||k===null)? (p.slots[0]||'') : String(k);
  var had=stWordFor(p, stSlot);
  stSeq = had? wPh(had).slice() : [];
  stSug=[];
  var mine=addedSnd();
  document.getElementById('sheet').innerHTML=
    '<div class="grip"></div><h3>'+esc(stSlotLabel(p, stSlot))+'</h3>'+
    '<div class="note" style="margin-bottom:12px">'+t('stg.make.d')+'</div>'+
    '<div class="seqbox"><span class="seq" id="st-seq"></span>'+
      '<button class="seqdel" id="st-back" onclick="stBack()" disabled aria-label="'+esc(t('glyph.undo'))+'">'+ICON_BACK+'</button></div>'+
    '<div class="pvbox"><span class="pvn">'+t('f.reading')+'</span><span class="pvk" id="st-ipa"></span>'+
      '<button onclick="if(stSeq.length)sayPh(stSeq)">'+ICON_PLAY+t('f.listen')+'</button></div>'+
    '<div id="st-sug">'+stSugHTML()+'</div>'+
    (mine.length
      ? '<div class="sec">'+t('add.ph')+'</div><div class="phkeys">'+mine.map(function(x){
          return phkHTML(x, 'stTap(\''+x+'\')'); }).join('')+'</div>'
      : '<div class="note">'+t('add.ph.none')+'</div>')+
    '<button class="btn" id="st-keep" style="width:100%;margin-top:14px" onclick="stKeep()" disabled>'+t('stg.keep')+'</button>'+
    (had? '<button class="set" style="margin-top:10px;border-bottom:none" onclick="stDrop()">'+
      '<span class="sl" style="color:#c9553f">'+t('stg.drop')+'</span></button>' : '');
  document.getElementById('sbg').classList.add('on');
  document.getElementById('sheet').classList.add('on');
  stPaint(); phkMount();
}
function stKeep(){
  if(!stFor || !stSeq.length) return;
  var hw=stSeq.join(''), key=stFor.id+'.'+stSlot, had=stWordFor(stFor, stSlot);
  var clash=findWord(hw);
  if(clash && clash!==had){ toast(t('toast.dup')); return; }
  if(had){ had.hw=hw; had.ph=stSeq.slice(); }
  else WORDS.push({hw:hw, ph:stSeq.slice(), mn:stSlotLabel(stFor, stSlot),
                   mns:[stSlotLabel(stFor, stSlot)], pos:stFor.pos, slot:key, at:Date.now()});
  save(); closeSheet({target:{id:'sbg'}}); cands=[]; render();
  toast(t('toast.saved', hw));
}
function stDrop(){
  var w=stWordFor(stFor, stSlot);
  if(!w) return;
  if(!confirm(t('confirm.del', w.hw))) return;
  WORDS=WORDS.filter(function(x){ return x!==w; });
  save(); closeSheet({target:{id:'sbg'}}); cands=[]; render();
}

/* ---- a stage of your own ---------------------------------------------- */
function openOwnPhase(){
  document.getElementById('sheet').innerHTML=
    '<div class="grip"></div><h3>'+t('stg.own.h')+'</h3>'+
    '<div class="note" style="margin-bottom:12px">'+t('stg.own.d')+'</div>'+
    '<div class="field"><label>'+t('stg.own.title')+'</label>'+
      '<input id="st-t" placeholder="'+esc(t('stg.own.title.ph'))+'"></div>'+
    '<div class="field"><label>'+t('stg.own.words')+'</label>'+
      '<textarea id="st-w" class="ntbody" style="min-height:120px" placeholder="'+esc(t('stg.own.words.ph'))+'"></textarea></div>'+
    '<button class="btn" style="width:100%;margin-top:6px" onclick="stAddOwn()">'+t('stg.own.add')+'</button>';
  document.getElementById('sbg').classList.add('on');
  document.getElementById('sheet').classList.add('on');
}
function stAddOwn(){
  var a=document.getElementById('st-t'), b=document.getElementById('st-w');
  if(!a) return;
  var title=String(a.value||'').trim();
  if(!title){ toast(t('stg.own.need')); return; }
  var lines=String((b&&b.value)||'').split('\n'), slots=[], labels={}, i, s, k=0;
  for(i=0;i<lines.length;i++){
    s=lines[i].trim();
    if(!s) continue;
    k++; slots.push('s'+k); labels['s'+k]=s;
  }
  STG.extra.push({id:'own'+(STG.extra.length+1)+'_'+WORDS.length+'_'+slots.length,
                 title:title, slots:slots, labels:labels, what:''});
  saveStg(); closeSheet({target:{id:'sbg'}}); render(); toast(t('stg.own.added', title));
}
function stDelOwn(id){
  if(!confirm(t('stg.own.del.ask'))) return;
  STG.extra=STG.extra.filter(function(x){ return x.id!==id; });
  saveStg(); if(gOpenOf()) back(); else render();
}

/* ---- the note a stage carries ----------------------------------------- */
function stNote(id, v){ STG.notes[id]=String(v||''); saveStg(); }

/* ---- the line a stage makes possible ----------------------------------
   Built from the words that exist by the end of it, in this language's own
   order, so finishing a stage is finishing something you can say. */
function stLine(p){
  var i, w, out=[];
  function add(x){ if(x) out.push({s:wPh(x), g:wMn(x)||String(x.hw)}); }
  if(p.id==='greet'){ add(stWordFor(p,'hello')); }
  else if(p.id==='pron'){ add(stWordFor(p,'i')); }
  else if(p.id==='count'){ for(i=0;i<3;i++) add(stWordFor(p,String(i+1))); }
  else if(p.own){ for(i=0;i<p.slots.length && i<3;i++) add(stWordFor(p,p.slots[i])); }
  else {
    /* everything from the word order onwards is a sentence, so it is built
       the way the sentence screen builds one: subject, object, verb, in the
       order this language puts them */
    var pr=stBy('pron'), subj = pr? stWordFor(pr,'i') : null;
    var verb=null, obj=null, adj=null;
    for(i=0;i<WORDS.length;i++){
      w=WORDS[i];
      if(!verb && w.pos==='v') verb=w;
      if(!obj && w.pos==='n' && w!==subj && !w.slot) obj=w;
      if(!adj && w.pos==='adj') adj=w;
    }
    if(!subj || !verb) return null;
    var slot={S:subj, O:obj, V:verb}, seq=orderDef().seq;
    for(i=0;i<seq.length;i++) if(slot[seq[i]]) add(slot[seq[i]]);
    if(p.id==='num' && out.length) out[0]={s:gMark(out[0].s,'num')[0], g:out[0].g+' · '+t('gram.pair.many')};
    if(p.id==='time' && verb && gHow('past')!=='none'){
      var m=gMark(wPh(verb),'past');
      out[out.length-1]={s:m[0], g:wMn(verb)+' · '+t('gram.pair.past')};
    }
    if(p.id==='ask' && gHow('q')!=='none' && gPhOf('q').length){
      if(gHow('q')==='start') out.unshift({s:gPhOf('q').slice(), g:t('gram.pair.ask')});
      else out.push({s:gPhOf('q').slice(), g:t('gram.pair.ask')});
    }
  }
  return out.length? out : null;
}
function stLineHTML(p){
  var L=stLine(p);
  if(!L) return '';
  var flat=[], txt=[], gl=[], i;
  for(i=0;i<L.length;i++){ flat=flat.concat(L[i].s); txt.push(L[i].s.join('')); gl.push(L[i].g); }
  return '<div class="sec">'+t('stg.line')+'</div>'+
    '<div class="gdemo"><div class="gside">'+
      '<span class="gsw">'+esc(txt.join(' '))+'</span>'+
      '<span class="gsi">/'+esc(txt.join(' '))+'/</span>'+
      '<span class="gsg">'+esc(gl.join(' · '))+'</span>'+
      '<button class="gsp" onclick="sayPh('+esc(JSON.stringify(flat))+')" aria-label="'+esc(t('f.listen'))+'">'+ICON_PLAY+'</button>'+
    '</div></div>';
}

/* ---- the screens ------------------------------------------------------ */
/* Which stage is open comes from the trail, so leaving the page and coming
   back lands on the same stage and the back button needs no help. */
function gOpenOf(){ return (here().r==='gram')? (here().a||null) : null; }
/* A stage is a page of its own, reached and left like every other page, so
   there is one back button on it and it goes wherever you came from. gOpen
   is the trail's argument now, not a separate piece of state that a second
   back button had to clear. */
function stOpen(id){ go('gram', id); }
function stClose(){ back(); }

function stRow(p, n){
  var done=stIsDone(p), tot=stTotal(p);
  return '<button class="strow'+(done?' done':'')+'" onclick="stOpen(\''+p.id+'\')">'+
    '<span class="stn">'+n+'</span>'+
    '<span class="stt">'+esc(stTitle(p))+'</span>'+
    '<span class="lead"></span>'+
    '<span class="stv">'+(tot? (stFilled(p)+' / '+tot) : '—')+'</span>'+
    ICON_GO+'</button>';
}
function stListHTML(){
  var a=stAll(), i, rows='';
  for(i=0;i<a.length;i++) rows+=stRow(a[i], i+1);
  return '<div class="note" style="margin-bottom:12px">'+t('stg.list.d')+'</div>'+
    '<div class="stlist">'+rows+'</div>'+
    '<button class="btn ghost" style="width:100%;margin-top:14px" onclick="openOwnPhase()">'+
      ICON_PLUS+t('stg.own.add.btn')+'</button>'+
    '<div class="note" style="margin-top:10px">'+t('stg.own.hint')+'</div>'+
    '<div class="sec">'+t('gram.seen')+'</div>'+
    '<div class="note" style="margin-bottom:6px">'+tn('rules.intro', WORDS.length)+'</div>'+
    (findings().length? findings().map(function(x){
      return '<div class="find"><div class="ft">'+x.t+'</div><div class="fd">'+x.d+'</div>'+
        '<div class="bar"><i style="width:'+Math.round(Math.max(.12,Math.min(1,x.rate))*100)+'%"></i></div></div>';
    }).join('') : '<div class="note">'+t('rules.empty.s')+'</div>');
}

function stSlotRow(p, k){
  var w=stWordFor(p, k);
  return '<button class="stslot'+(w?' has':'')+'" onclick="openSlot(\''+p.id+'\',\''+k+'\')">'+
    '<span class="psm">'+esc(stSlotLabel(p, k))+'</span>'+
    (w ? '<span class="psw">'+esc(w.hw)+'</span>'+
         '<span class="psi">'+esc(phIpa(wPh(w)))+'</span>'
       : '<span class="psn">'+t('stg.make')+'</span>')+
    ICON_GO+'</button>';
}
function stDetailHTML(p){
  var i, out='';

  out+='<h2 class="sth">'+esc(stTitle(p))+'</h2>';
  if(stWhat(p)) out+='<div class="note" style="margin-bottom:6px">'+esc(stWhat(p))+'</div>';

  if(p.slots.length){
    out+='<div class="sec">'+t('stg.words')+'</div>';
    out+='<div class="stslots">';
    for(i=0;i<p.slots.length;i++) out+=stSlotRow(p, p.slots[i]);
    out+='</div>';
  }
  if(p.feats.length){
    out+='<div class="sec">'+t('stg.decide')+'</div>';
    for(i=0;i<p.feats.length;i++) out+=stFeatHTML(p.feats[i]);
  }
  out+=stLineHTML(p);
  out+='<div class="sec">'+t('stg.note')+'</div>'+
    '<textarea class="ntbody" style="min-height:110px" placeholder="'+esc(t('stg.note.ph'))+'" '+
    'onchange="stNote(\''+p.id+'\', this.value)">'+esc(STG.notes[p.id]||'')+'</textarea>';
  if(p.own) out+='<button class="set" style="margin-top:18px;border-bottom:none" onclick="stDelOwn(\''+p.id+'\')">'+
    '<span class="sl" style="color:#c9553f">'+t('stg.own.del')+'</span></button>';
  return out;
}
/* One decision, drawn the way the grammar chapter drew it, plus the mark that
   it has actually been chosen rather than left at its default. */
function stFeatHTML(id){
  if(id==='order'){
    return '<div class="note">'+t('gram.order.d')+'</div>'+
      '<div class="segs">'+ORDERS.map(function(o){
        return '<button class="seg'+(o===orderDef().id?' on':'')+'" onclick="setOrder(\''+o+'\')">'+o+'</button>';
      }).join('')+'</div>'+gOrderLine();
  }
  var f=null, i;
  for(i=0;i<GFEATS.length;i++) if(GFEATS[i].id===id) f=GFEATS[i];
  if(!f) return '';
  return '<div class="note">'+t('gram.'+f.id+'.d')+'</div>'+
    '<div class="segs">'+f.opts.map(function(o){
      return '<button class="seg'+(o===gHow(f.id)?' on':'')+'" onclick="gSet(\''+f.id+'\',\''+o+'\')">'+
        esc(gOptLab(f.id, o))+'</button>';
    }).join('')+'</div>'+
    (gNeedsPiece(f.id)
      ? '<button class="gpiece'+(gPhOf(f.id).length?' has':'')+'" onclick="openGramPiece(\''+f.id+'\')">'+
        '<span class="gpl">'+t('gram.piece')+'</span>'+
        '<span class="gpv">'+(gPhOf(f.id).length? esc(phIpa(gPhOf(f.id))) : esc(t('gram.piece.none')))+'</span>'+
        ICON_GO+'</button>'
      : '')+
    gDemo(f.id);
}

function vGram(){
  var gOpen=gOpenOf();
  var p = gOpen? stBy(gOpen) : null;
  return '<div class="view">'+
    navTop(gOpen? '' : (stCount()+' / '+stAll().length))+
    '<div class="body">'+
    (p? stDetailHTML(p) : stListHTML())+
    '</div></div>';
}
