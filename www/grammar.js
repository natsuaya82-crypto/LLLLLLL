/* Lingua — grammar: the decisions, not the observations
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   This chapter used to be called Rules and contained none. It listed what the
   dictionary had happened to do -- most of your nouns end in a, you have not
   used v yet -- which is a description of your typing, not a grammar. Nothing
   on it could be decided, and nothing it said changed a single word.

   A grammar is a small number of decisions, each with a consequence you can
   hear. Where does a describing word go. Is more than one marked, and with
   what. What does a verb do when the thing already happened. How do you say
   no, how do you ask, how do you say something is somebody's. Each one here
   is chosen by you, the piece of sound that carries it is built from your own
   inventory, and the moment it is set the app shows one of your own words
   going through it and will say it out loud.

   What the old chapter did survives at the foot of the screen, where a
   description belongs: under the decisions, not instead of them. */

/* All six orders, because all six are used by languages on this planet. The
   old list had three, which quietly ruled out the other half. */
var ORDERS=['SOV','SVO','VSO','VOS','OVS','OSV'];
function orderDef(){
  var o=SET.order||'SOV';
  if(ORDERS.indexOf(o)<0) o='SOV';
  return {id:o, seq:o.split('')};
}
function setOrder(id){ SET.order=id; save(); stMarkSet('order'); render(); }

/* Each decision, and what it can be set to.
   `none` means the language does not mark this at all, which is a decision
   like any other -- plenty of languages do not mark number, or tense.
   `redup` is saying the word twice, which needs no piece of sound. */
var GFEATS=[
  {id:'adj',  opts:['before','after']},
  {id:'num',  opts:['none','suffix','prefix','redup']},
  {id:'past', opts:['none','suffix','prefix']},
  {id:'neg',  opts:['none','prefix','suffix','before','after']},
  {id:'q',    opts:['none','end','start']},
  {id:'poss', opts:['none','suffix','prefix']}
];
var G_DEF={adj:'after', num:'none', past:'none', neg:'none', q:'none', poss:'none'};

function gramAll(){ if(!SET.gram) SET.gram={}; return SET.gram; }
function gFeat(id){
  var g=gramAll();
  if(!g[id]) g[id]={how:(G_DEF[id]||'none'), ph:[]};
  if(!g[id].ph) g[id].ph=[];
  return g[id];
}
function gHow(id){ return gFeat(id).how; }
function gPhOf(id){ return gFeat(id).ph; }
/* Everything except "not marked" and "said twice" needs a piece of sound. */
function gNeedsPiece(id){ var h=gHow(id); return h!=='none' && h!=='redup'; }
function gPieceOK(id){ return !gNeedsPiece(id) || gPhOf(id).length>0; }
function gSet(id, how){
  var f=gFeat(id);
  f.how=how; save(); stMarkSet(id); render();
  /* Choosing "suffix" without saying which suffix is half a decision, so the
     keyboard opens on the spot rather than waiting to be found. */
  if(gNeedsPiece(id) && !f.ph.length) openGramPiece(id);
}
/* How much of a grammar exists. Order and the place of a describing word are
   always decided -- there is no "undecided" for those -- so they always count;
   the rest count once they mark something and have the sound to mark it with. */
function gramCount(){
  var n=2, i, f;
  for(i=0;i<GFEATS.length;i++){
    f=GFEATS[i];
    if(f.id==='adj') continue;
    if(gHow(f.id)!=='none' && gPieceOK(f.id)) n++;
  }
  return n;
}

/* ---- applying a decision to an actual word ----------------------------
   A word is its sounds, so a mark is sounds added to those. Some marks are
   part of the word and some are a word of their own, which is why this hands
   back a list of words rather than one sequence. */
function gMark(seq, id){
  var f=gFeat(id), p=(f.ph||[]).slice();
  if(f.how==='suffix') return [seq.concat(p)];
  if(f.how==='prefix') return [p.concat(seq)];
  if(f.how==='redup')  return [seq.concat(seq)];
  if(f.how==='before') return [p, seq.slice()];
  if(f.how==='after')  return [seq.slice(), p];
  return [seq.slice()];
}
function gTxt(ws){ var i,o=[]; for(i=0;i<ws.length;i++) o.push(ws[i].join('')); return o.join(' '); }
function gIpaOf(ws){ var i,o=[]; for(i=0;i<ws.length;i++) o.push(ws[i].join('')); return '/'+o.join(' ')+'/'; }
function gFlat(ws){ var i,o=[]; for(i=0;i<ws.length;i++) o=o.concat(ws[i]); return o; }

/* A word of a given part of speech to demonstrate on. Any will do; the first
   is the least surprising choice because it is the one at the top of the
   dictionary. */
function gWordOf(pos, not){
  var i;
  for(i=0;i<WORDS.length;i++) if(WORDS[i].pos===pos && WORDS[i]!==not) return WORDS[i];
  return null;
}

/* ---- the demonstration ------------------------------------------------
   Two sides, and the difference between them is the decision. Both can be
   said, because a grammar you can only read is a grammar you cannot check. */
function gSide(lab, ws, gloss){
  return '<div class="gside"><span class="gsl">'+esc(lab)+'</span>'+
    '<span class="gsw">'+esc(gTxt(ws))+'</span>'+
    '<span class="gsi">'+esc(gIpaOf(ws))+'</span>'+
    (gloss? '<span class="gsg">'+esc(gloss)+'</span>' : '')+
    '<button class="gsp" onclick="sayPh('+esc(JSON.stringify(gFlat(ws)))+')" aria-label="'+esc(t('f.listen'))+'">'+ICON_PLAY+'</button></div>';
}
function gNeedWords(){ return '<div class="note gneed">'+t('gram.demo.need')+'</div>'; }
/* "before" and "after" mean two different things. For a describing word they
   are where it stands; for saying no they are a separate word standing before
   or after. One label for both read as nonsense on the adjective row -- "a
   word before" where the answer is simply "before it" -- so the one feature
   that means position asks for its own. */
function gOptLab(id, o){
  return (id==='adj') ? t('gram.adj.'+o) : t('gram.how.'+o);
}

function gDemo(id){
  var n=gWordOf('n'), v=gWordOf('v'), a=gWordOf('adj'), n2=gWordOf('n', n);
  var base, out='';
  /* "not marked" has nothing to demonstrate. Showing the bare word under a
     label that says "many" would be claiming a difference there isn't one. */
  if(id!=='adj' && gHow(id)==='none') return '';
  if(id==='adj'){
    if(!n || !a) return gNeedWords();
    var ph = gHow('adj')==='before' ? [wPh(a), wPh(n)] : [wPh(n), wPh(a)];
    return '<div class="gdemo">'+gSide(t('gram.pair.phrase'), ph,
      [wMn(a), wMn(n)].filter(Boolean).join(' + '))+'</div>';
  }
  if(id==='q'){
    /* A question is asked of a whole line, not of a word, so this one is
       shown on the shortest line the dictionary can make. */
    if(!n || !v) return gNeedWords();
    var say=[wPh(n), wPh(v)], ask;
    if(gHow('q')==='start') ask=[gPhOf('q').slice(), wPh(n), wPh(v)];
    else ask=[wPh(n), wPh(v), gPhOf('q').slice()];
    return '<div class="gdemo">'+gSide(t('gram.pair.say'), say, '')+
           gSide(t('gram.pair.ask'), ask, '')+'</div>';
  }
  if(id==='poss'){
    if(!n || !n2) return gNeedWords();
    return '<div class="gdemo">'+gSide(t('gram.pair.plain'), [wPh(n2)], wMn(n2))+
      gSide(t('gram.pair.owned'), gMark(wPh(n2),'poss').concat([wPh(n)]),
        [wMn(n), wMn(n2)].filter(Boolean).join(' / '))+'</div>';
  }
  base = (id==='num') ? n : v;
  if(!base) return gNeedWords();
  var labA = id==='num'? t('gram.pair.one') : id==='past'? t('gram.pair.now') : t('gram.pair.yes');
  var labB = id==='num'? t('gram.pair.many'): id==='past'? t('gram.pair.past'): t('gram.pair.no');
  return '<div class="gdemo">'+gSide(labA, [wPh(base)], wMn(base))+
         gSide(labB, gMark(wPh(base), id), '')+'</div>';
}

/* ---- the piece of sound a decision is carried by ----------------------
   Typed from the language's own inventory, the same keyboard a word is
   written with. Nothing outside the inventory can be used, which is the whole
   reason for having chosen one. */
var gPhFor='', gPhSeq=[];
function gPhKey(sym){ gPhSeq.push(sym); gPhPaint(); }
function gPhBack(){ gPhSeq.pop(); gPhPaint(); }
function gPhPaint(){
  var s=document.getElementById('gp-seq'), r=document.getElementById('gp-ipa'),
      b=document.getElementById('gp-back');
  if(s) s.textContent=gPhSeq.join('');
  if(r) r.textContent=gPhSeq.length? phIpa(gPhSeq) : '';
  if(b) b.disabled=!gPhSeq.length;
}
function gPhSave(){
  var f=gFeat(gPhFor||'num');
  f.ph=gPhSeq.slice(); save();
  closeSheet({target:{id:'sbg'}}); render();
}
function openGramPiece(id){
  var known=false, i;
  for(i=0;i<GFEATS.length;i++) if(GFEATS[i].id===id) known=true;
  gPhFor = known ? id : GFEATS[1].id;
  gPhSeq = gPhOf(gPhFor).slice();
  var mine=addedSnd();
  showSheet('<h3>'+t('gram.piece.h')+'</h3>'+
    '<div class="note" style="margin-bottom:12px">'+t('gram.piece.d', esc(t('gram.'+gPhFor+'.t')))+'</div>'+
    '<div class="seqbox"><span class="seq" id="gp-seq"></span>'+
      '<button class="seqdel" id="gp-back" onclick="gPhBack()" disabled aria-label="'+esc(t('glyph.undo'))+'">'+ICON_BACK+'</button></div>'+
    '<div class="pvbox"><span class="pvn">'+t('f.reading')+'</span><span class="pvk" id="gp-ipa"></span>'+
      '<button onclick="if(gPhSeq.length)sayPh(gPhSeq)">'+ICON_PLAY+t('f.listen')+'</button></div>'+
    (mine.length
      ? '<div class="sec">'+t('add.ph')+'</div><div class="phkeys">'+mine.map(function(x){
          return phkHTML(x, 'gPhKey(\''+x+'\')'); }).join('')+'</div>'+
        '<button class="btn" style="width:100%;margin-top:14px" onclick="gPhSave()">'+t('gram.piece.set')+'</button>'
      : '<div class="note">'+t('add.ph.none')+'</div>'+
        '<button class="btn ghost" style="width:100%;margin-top:8px" onclick="closeSheet({target:{id:\'sbg\'}});go(\'sound\')">'+
        esc(t('toc.sound'))+'</button>'));
  gPhPaint(); phkMount();
}

/* ---- the screen -------------------------------------------------------- */
/* Word order, written as the three roles in the order chosen, with the drawn
   chevron between them. It used to be a translated string with an arrow
   character inside it, which is a mark typed into copy. */
function gOrderLine(){
  var s=orderDef().seq, i, out=[];
  for(i=0;i<s.length;i++) out.push('<span class="gor">'+esc(t('gram.role.'+s[i]))+'</span>');
  return '<div class="gorder">'+out.join('<span class="gsep">'+ICON_GO+'</span>')+'</div>';
}
/* The same order, in your own words, so it is a sentence and not a diagram. */
function gOrderDemo(){
  var n=gWordOf('n'), v=gWordOf('v'), n2=gWordOf('n', n);
  if(!n || !v) return gNeedWords();
  var slot={S:n, O:(n2||n), V:v};
  var ws=orderDef().seq.map(function(k){ return wPh(slot[k]); });
  var gl=orderDef().seq.map(function(k){ return wMn(slot[k])||slot[k].hw; }).join(' ');
  return '<div class="gdemo">'+gSide(t('gram.pair.line'), ws, gl)+'</div>';
}
