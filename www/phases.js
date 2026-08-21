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

/* {done:{}, notes:{}, set:{}, extra:[]} -- `set` is which decisions have been
   touched, because every decision has a default and a default is not a
   choice. */
/* rules: what you decided, written by you. ex: the lines that show it.
   notes stays for what is neither. */
var STG={done:{}, notes:{}, set:{}, extra:[], rules:{}, ex:{}, fm:[]};
/* How far the open language has got. Empty first: see langRead() in core.js. */
function stRead(){
  STG={done:{}, notes:{}, set:{}, extra:[], rules:{}, ex:{}, fm:[]};
  try{
    var stgs=JSON.parse(localStorage.getItem(langKey('phases'))||'null');
    if(stgs){ STG.done=stgs.done||{}; STG.notes=stgs.notes||{}; STG.set=stgs.set||{};
              STG.extra=stgs.extra||[]; STG.rules=stgs.rules||{}; STG.ex=stgs.ex||{};
              STG.fm=stgs.fm||[]; }
  }catch(e){}
}
stRead();
function saveStg(){ bkTouch(); try{ localStorage.setItem(langKey('phases'), JSON.stringify(STG)); }catch(e){} }

/* The stages, in the order they open each other up. `slots` are the words the
   stage cannot do without; `feats` are the decisions from www/grammar.js it
   carries. A stage may have only one of the two. */
/* ---- the parts of a grammar ------------------------------------------
   「語順のページなにそれ。SVOを決めて終わり？そんなページいらねえよ。もっと長い文法の
   時は？キモい分け方すんなよ。接続詞とかもっと会話に必要なところあるだろ。」
   「否定のページも何これ？意味がわからない。音で決めるの何さっきから」
   「メモじゃなくてもうルールを書き記せるページにしてくれ。例文で比較したいし、決める
   こと決めて、あとは例文。文法のページ全部がゴミ。全部示す示さないみたいなゴミみたいな
   決め方。」

   What was here asked, for six different things, whether the language marks
   it -- yes or no -- and then which piece of sound the mark is. That is one
   sentence of grammar dressed as a whole chapter, it cannot describe a
   language that does the same job by word order or by a separate word or by
   nothing at all, and it left the parts a conversation actually needs --
   conjunctions, particles, politeness, conditionals -- with nowhere to go.

   A part of a grammar is three things now:

     the words it needs      made here, as before, because that worked
     the rule                written by you, in your own words
     lines that show it      pairs you can put side by side and compare

   Word order stays a choice with buttons, because it genuinely is one: six
   options, one answer, and the answer changes every sentence. Nothing else
   is. The rest are written, because a grammar is written.

   Fifteen parts, and you can add as many of your own as you like. */
var STAGES=[
  {id:'greet', slots:['yes','no','hello','bye','thanks'], pos:'x',   feats:[]},
  {id:'pron',  slots:['i','you','he','we','youpl','they'], pos:'pro', feats:[]},
  {id:'order', slots:[], pos:'v', feats:['order']},
  {id:'noun',  slots:[], pos:'n',  feats:[]},
  {id:'verb',  slots:[], pos:'v',  feats:[]},
  {id:'neg',   slots:['not'], pos:'part', feats:['negp']},
  {id:'ask',   slots:['what','who','where','when','why','how'], pos:'pro', feats:[]},
  {id:'desc',  slots:[], pos:'adj', feats:['adj']},
  {id:'have',  slots:[], pos:'n', feats:[]},
  /* The numbers are numerals, which read the same in every language on the
     list, so they are the one set of labels that needs no translating. */
  {id:'count', slots:['1','2','3','4','5','6','7','8','9','10'], pos:'num', feats:[]},
  {id:'conj',  slots:['and','or','but','because','if','then'], pos:'conj', feats:[]},
  {id:'polite',slots:[], pos:'x',  feats:[]},
  {id:'where', slots:['in','on','under','to','from','with'], pos:'part', feats:['adp']},
  {id:'when',  slots:['now','before','after','today','tomorrow','yesterday'], pos:'x', feats:[]}
];
/* Stages that are not every language's, and are not offered until somebody's
   language turns out to have one.
   「助詞がない言語もあるんだから、助詞が最初からあるのおかしいだろ」

   Particles are the case that made the point: English has none, and a list
   that opens with a page for them is the app telling somebody their language
   has something it may well not.

   They are not deleted. A stage here appears the moment there is an answer in
   it -- notes, rules, an example, a word, or merely having been opened -- so a
   language that used one keeps it and nothing anybody wrote goes anywhere.
   docs/DATA_SAFETY.md: nothing a person made is removed because the current
   shape does not need it.

   Adding one back by hand is what `stAddOwn` has always been for. */
var STAGES_IF=[
  {id:'part',  slots:[], pos:'part', feats:[]}
];
function stUsed(id){
  return !!(stTouched(id) || (STG.notes && STG.notes[id]) ||
            (STG.rules && STG.rules[id]) ||
            (STG.ex && STG.ex[id] && STG.ex[id].length));
}
function stAll(){
  var out=[], i;
  /* The counting stage's slots are the base's, not a fixed ten: twelve words
     in base twelve. Rebuilt rather than written over, because STAGES is one
     array shared by every call and a stage edited in place stays edited. */
  for(i=0;i<STAGES.length;i++)
    out.push(STAGES[i].id==='count'
      ? {id:'count', slots:numWordSlots(), pos:STAGES[i].pos, feats:STAGES[i].feats}
      : STAGES[i]);
  for(i=0;i<STAGES_IF.length;i++)
    if(stUsed(STAGES_IF[i].id)) out.push(STAGES_IF[i]);
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
function stWhat(p){
  if(p.own) return p.own.what||'';
  /* "One to ten" is only true in base ten. */
  if(p.id==='count') return t('stg.count.d', numLabel(numBase()));
  return t('stg.'+p.id+'.d');
}

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
function stTotal(p){ return p.slots.length + p.feats.length + 1; }
/* The +1 is the part itself: something written about it, or a line showing
   it. A part with no words and no buttons -- politeness, particles -- is
   finished when you have said what it does, which is the only thing it could
   ever have meant. */
function stSaid(p){ return (stRules(p.id).length || stEx(p.id).length)? 1 : 0; }
function stFilled(p){ return stSlotsDone(p) + stFeatsDone(p) + stSaid(p); }
function stIsDone(p){ return stFilled(p)>=stTotal(p); }
function stCount(){
  var a=stAll(), n=0, i;
  for(i=0;i<a.length;i++) if(stIsDone(a[i])) n++;
  return n;
}

/* ---- the sheet where a slot's word is made ---------------------------- */
var stFor=null, stSlot='', stSeq=[], stSug=[];
function stTap(sym){ sayOne(sym); stSeq.push(sym); stPaint(); }
/* What was typed, cut into letters and then asked what those letters read --
   so the word is the letters and the sounds come off them, which is the way
   round the rest of the app already works. */
function stSetLn(v){
  stSp=spType(v);
  stSeq=spPh(stSp);
  lnGrow('st-ln');
  stPaint();
}
function stBack(){ stSeq.pop(); stPaint(); }
/* Nothing to say until something has been typed. This was a condition written
   inside the button's own markup -- the smallest possible example of code in a
   place no checker reads. */
function stSay(){ if(stSeq.length) sayPh(stSeq); }
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
  if(!stSug.length) return '<button class="btn ghost" style="width:100%"' + DO('stAsk') + '>'+t('stg.help')+'</button>';
  return '<div class="sugbox"><div class="sugchips">'+stSug.map(function(q,i){
      return '<button class="sugchip"' + DO('stTake', [i]) + '>'+
        '<span class="slw">'+esc(q.join(''))+'</span>'+
        '<span class="sr">'+esc(phIpa(q))+'</span></button>';
    }).join('')+'</div>'+
    '<div class="sugfoot"><span class="sughint">'+t('stg.help.d')+'</span>'+
    '<button class="sugmore"' + DO('stAsk') + '>'+t('stg.again')+'</button></div></div>';
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
  stSp  = had? JSON.parse(JSON.stringify(spOf(had))) : [];
  stSug=[];
  var mine=addedSnd();
  openForm('slot:'+p.id+'/'+stSlot, stSlotLabel(p, stSlot),
    '<div class="seqbox"><span class="seq" id="st-seq"></span>'+
      '<button class="seqdel" id="st-back"' + DO('stBack') + ' disabled aria-label="'+esc(t('glyph.undo'))+'">'+ICON_BACK+'</button></div>'+
    '<div class="pvbox"><span class="pvn">'+t('f.reading')+'</span><span class="pvk" id="st-ipa"></span>'+
      '<button' + DO('stSay') + '>'+ICON_SPK+t('f.listen')+'</button></div>'+
    '<div id="st-sug">'+stSugHTML()+'</div>'+
    /* Typed on free. The word for a meaning is a word, and a word is
       letters -- being handed the language's sounds to press was the
       question the alphabet had already answered.
       「だから、画面表示するのに音で選ぶやついないやろ」 */
    (!can('snd')
      ? lnField('st-ln', t('f.spelling'), IN('stSetLn'), stSeq.join(''))
      : mine.length
      ? '<div class="sec">'+t('add.ph')+'</div><div class="phkeys">'+mine.map(function(x){
          return phkHTML(x, DO('stTap',[x])); }).join('')+'</div>'
      : '<div class="note">'+t('add.ph.none')+'</div>')+
    '<button class="btn" id="st-keep" style="width:100%;margin-top:14px"' + DO('stKeep') + ' disabled>'+t('stg.keep')+'</button>'+
    (had? '<button class="set" style="margin-top:10px;border-bottom:none"' + DO('stDrop') + '>'+
      '<span class="sl bad">'+t('stg.drop')+'</span></button>' : ''),
    function(){ stPaint(); phkMount(); });
}
FORM_OPEN.slot=function(a){ var i=String(a).indexOf('/'); openSlot(a.slice(0,i), a.slice(i+1)); };
/* The letters the typed word came out as, when it was typed. Empty when the
   word was assembled by pressing sounds, which is what the paid plan still
   does -- and then the sounds ARE the word, as they always were. */
var stSp=[];
function stKeep(){
  if(!stFor || !stSeq.length) return;
  /* The spelling is the word wherever there is one. A letter called `c` that
     reads /k/ would otherwise be saved as the sound it makes rather than as
     the letter that was typed. */
  var hw=stSp.length? spWord(stSp) : stSeq.join('');
  var key=stFor.id+'.'+stSlot, had=stWordFor(stFor, stSlot);
  var clash=findWord(hw);
  if(!hw){ return; }
  if(clash && clash!==had){ toast(t('toast.dup')); return; }
  if(had){
    had.hw=hw;
    if(stSp.length){ had.sp=JSON.parse(JSON.stringify(stSp)); delete had.ph; }
    else had.ph=stSeq.slice();
  }
  else {
    var nw={hw:hw, mn:stSlotLabel(stFor, stSlot),
            mns:[stSlotLabel(stFor, stSlot)], pos:stFor.pos, slot:key, at:Date.now()};
    if(stSp.length) nw.sp=JSON.parse(JSON.stringify(stSp));
    else nw.ph=stSeq.slice();
    WORDS.push(nw);
  }
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
  openForm('own:', t('stg.own.h'),
    '<div class="field"><label>'+t('stg.own.title')+'</label>'+
      '<input id="st-t" placeholder="'+esc(t('stg.own.title.ph'))+'"></div>'+
    '<div class="field"><label>'+t('stg.own.words')+'</label>'+
      '<textarea id="st-w" class="ntbody" style="min-height:120px" placeholder="'+esc(t('stg.own.words.ph'))+'"></textarea></div>'+
    /* This one still says what it does: it is the button that makes the
       thing the form is for, not one more row of a list. */
    '<button class="btn" style="width:100%;margin-top:6px"' + DO('stAddOwn') + '>'+
      t('stg.own.add')+'</button>');
}
FORM_OPEN.own=function(){ openOwnPhase(); };
function stAddOwn(){
  /* The screen only offers this on a paid plan; a form is a route and a route
     can be arrived at from anywhere. */
  if(!can('gram')){ goPlans(); return; }
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
/* Deleting one is gated too, and that is a change: it used to be open on
   every plan, on the grounds that a language which came down from a paid plan
   still owns what it made. It still owns it -- which is exactly why it cannot
   be thrown away from a plan that cannot make another one.
   「無料に戻ったら無料の形に戻る」 A stage of somebody's own stays on the
   list, stays in the backup, and cannot be added to or removed until the plan
   that made it is back. Gating a delete never costs anybody anything. */
function stDelOwn(id){
  if(!can('gram')){ goPlans(); return; }
  if(!confirm(t('stg.own.del.ask'))) return;
  STG.extra=STG.extra.filter(function(x){ return x.id!==id; });
  saveStg(); if(gOpenOf()) back(); else render();
}

/* ---- the note a stage carries ----------------------------------------- */
function stNote(id, v){ STG.notes[id]=String(v||''); saveStg(); }
/* ---- the rule, and the lines that show it ----------------------------- */
function stRules(id){ if(!STG.rules) STG.rules={}; return STG.rules[id]||''; }
function stSetRules(id, v){ if(!STG.rules) STG.rules={}; STG.rules[id]=String(v||''); saveStg(); }
function stEx(id){ if(!STG.ex) STG.ex={}; if(!STG.ex[id]) STG.ex[id]=[]; return STG.ex[id]; }
function stAddEx(id){
  var a=document.getElementById('sx-lb'), b=document.getElementById('sx-ln'),
      c=document.getElementById('sx-gl');
  if(!b) return;
  var ln=String(b.value||'').trim();
  if(!ln){ toast(t('word.ex.need')); return; }
  stEx(id).push({lb:String((a&&a.value)||'').trim(), ln:ln, gl:String((c&&c.value)||'').trim()});
  saveStg(); render();
}
function stDelEx(id, i){ stEx(id).splice(i,1); saveStg(); render(); }
/* Two lines side by side is the whole of comparing: a label on each says what
   the pair is a pair of -- 肯定 / 否定 -- and the two read as one thought. */
/* The same as the word sheet's: the field for one more appears when the `+`
   on the heading is pressed. */
var stExNew='';
function stExOpen(id){ stExNew=id; render(); }
function stExHTML(id){
  var a=stEx(id);
  return (a.length
    ? '<div class="exlist">'+a.map(function(e,i){
        return exRowHTML(e, exSeq(e.ln),
          exBtn('stDelEx', [id, i], 'word.ex.del', ICON_CROSS));
      }).join('')+'</div>'
    : '')+
    (stExNew===id? '<div class="exadd">'+
      '<input id="sx-lb" class="exsm" placeholder="'+esc(t('stg.ex.lb.ph'))+'" autocomplete="off">'+
      lnField('sx-ln', exHint(), KD('stAddEx', [id]), '')+
      '<input id="sx-gl" placeholder="'+esc(t('word.ex.gl.ph'))+'" '+
        '' + KD('stAddEx', [id]) + '>'+
    '</div>' : '');
}

/* Which stage is open comes from the trail, so leaving the page and coming
   back lands on the same stage and the back button needs no help. */
function gOpenOf(){ return (here().r==='gram')? (here().a||null) : null; }
/* A stage is a page of its own, reached and left like every other page, so
   there is one back button on it and it goes wherever you came from. gOpen
   is the trail's argument now, not a separate piece of state that a second
   back button had to clear. */
function stOpen(id){ go('gram', id); }
function stRow(p, n){
  var done=stIsDone(p), tot=stTotal(p);
  return '<button class="strow'+(done?' done':'')+'"' + DO('stOpen', [p.id]) + '>'+
    '<span class="stn">'+n+'</span>'+
    '<span class="stt">'+esc(stTitle(p))+'</span>'+
    '<span class="lead"></span>'+
    '<span class="stv">'+(tot? (stFilled(p)+' / '+tot) : '—')+'</span>'+
    ICON_GO+'</button>';
}
function stListHTML(){
  var a=stAll(), i, rows='';
  for(i=0;i<a.length;i++) rows+=stRow(a[i], i+1);
  /* The rules that make a form out of a word were at the head of this list.
     They are not a stage of the grammar and they are about the dictionary, so
     they are behind the ... in the dictionary's bar -- wordsMore(). */
  return '<div class="stlist">'+rows+'</div>'+
    /* The fifteen are free and are the whole of the chapter there. They ask
       for forty-six words between them, which is most of what a free
       dictionary is for; a stage of your own is the sixteenth and past that
       is what can('gram') buys. Deleting one is gated as well -- see
       stDelOwn: a language that came down from a paid plan still owns what it
       made, and cannot throw it away from a plan that cannot make another. */
    (can('gram')
      ? '<button class="btn ghost" style="width:100%;margin-top:14px"' + DO('openOwnPhase') + '>'+
          ICON_ADD+t('stg.own.add.btn')+'</button>'
      : '')+
    '';
}

function stSlotRow(p, k){
  var w=stWordFor(p, k);
  return '<button class="stslot'+(w?' has':'')+'"' + DO('openSlot', [p.id, k]) + '>'+
    (p.id==='count'? numFace(k) : '')+
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

  if(p.feats.length){
    out+='<div class="sec">'+t('stg.decide')+'</div>';
    for(i=0;i<p.feats.length;i++) out+=stFeatHTML(p.feats[i]);
  }
  if(p.slots.length){
    out+='<div class="sec">'+t('stg.words')+'</div>';
    out+='<div class="stslots">';
    for(i=0;i<p.slots.length;i++) out+=stSlotRow(p, p.slots[i]);
    out+='</div>';
  }
  out+='<div class="sec">'+t('stg.rules')+'</div>'+
    '<textarea class="ntbody" style="min-height:130px" placeholder="'+esc(t('stg.rules.ph'))+'" '+
    '' + CH('stSetRules', [p.id]) + '>'+esc(stRules(p.id))+'</textarea>';

  out+=secAdd(ICON_LINE+t('stg.ex'), DO('stExOpen', [p.id]), t('word.mn.add'))+stExHTML(p.id);

  out+='<div class="sec">'+t('stg.note')+'</div>'+
    '<textarea class="ntbody" style="min-height:90px" placeholder="'+esc(t('stg.note.ph'))+'" '+
    '' + CH('stNote', [p.id]) + '>'+esc(STG.notes[p.id]||'')+'</textarea>';
  if(p.own) out+='<button class="set" style="margin-top:18px;border-bottom:none"' + DO('stDelOwn', [p.id]) + '>'+
    '<span class="sl bad">'+t('stg.own.del')+'</span></button>';
  return out;
}
/* The decisions that are decisions: word order, and the three places a word
   can stand. Each is one answer for the whole language, each changes every
   sentence that uses it, and each is shown in your own words underneath so it
   can be heard rather than only read. Everything else on a stage is written. */
function stFeatHTML(id){
  if(id==='order'){
    return '<div class="segs">'+ORDERS.map(function(o){
        return '<button class="seg'+(o===orderDef().id?' on':'')+'"' + DO('setOrder', [o]) + '>'+o+'</button>';
      }).join('')+'</div>'+gOrderLine()+gOrderDemo();
  }
  if(id!=='adj' && id!=='negp' && id!=='adp') return '';
  return '<div class="segs">'+['before','after'].map(function(o){
      return '<button class="seg'+(o===gPos(id)?' on':'')+'"' + DO('setGPos', [id, o]) + '>'+
        esc(gPosLab(id, o))+'</button>';
    }).join('')+'</div>'+gPosDemo(id);
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
