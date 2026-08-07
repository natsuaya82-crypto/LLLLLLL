/* Lingua — the sheet for writing one word, and CSV (chapter 13)
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   13. The sheet for writing a word, and CSV
   ========================================================================= */
var addPos='n';

/* Suggestions are drawn with the same generator the coinage screen uses, so
   what it offers already obeys the language's own sounds and shape. */
var SUG=[], sugMn='';
/* Studio is the tier that advertises this, so Studio is what lifts the ceiling. */
function sugUnl(){ return has('studio'); }
function sugLeft(){ return sugUnl() ? Infinity : Math.max(0, AI_FREE_DAILY-aiUsed()); }
function sugMean(){ var e=document.getElementById('f-mn'); return e? String(e.value||'').trim() : ''; }
function sugBuild(){
  var A=analyze(), tk=taken(); SUG=[];
  for(var i=0;i<3;i++){ var q=makeWord(addPos||POS[0], A, tk); if(q){ SUG.push(q); tk[q.join('')]=1; } }
}
function sugHTML(){
  var left=sugLeft(), unl=(left===Infinity);
  if(!SUG.length){
    if(!unl && left<=0) return '<button class="sugout"' + DO('goPlans') + '>'+t('sug.out')+' <b>'+t('up.cta')+ICON_GO+'</b></button>';
    return '<button class="sugask"' + DO('sugGo') + '>'+
      '<span class="sual"><span class="sut">'+t('add.lock.t')+'</span><span class="sud">'+t('add.lock.d')+'</span></span>'+
      (unl?'':'<span class="sugn">'+t('sug.left', left)+'</span>')+'</button>';
  }
  return '<div class="sugbox"><div class="sugchips">'+
    SUG.map(function(q,i){ return '<button class="sugchip"' + DO('sugPick', [i]) + '><span class="sw">'+esc(q.join(''))+'</span><span class="sr">'+esc(readSeq(q))+'</span></button>'; }).join('')+
    '</div><div class="sugfoot"><span class="sughint">'+(sugMn? t('sug.for', esc(sugMn)) : t('sug.hint'))+'</span>'+
    ((unl||left>0)?'<button class="sugmore"' + DO('sugGo') + '>'+t('sug.more')+'</button>':'')+
    '</div>'+
    ((!unl&&left<=0)?'<button class="sugout" style="margin:9px 0 0"' + DO('goPlans') + '>'+t('sug.out')+' <b>'+t('up.cta')+ICON_GO+'</b></button>':'')+
    '</div>';
}
function sugPaint(){ var e=document.getElementById('sugwrap'); if(e) e.innerHTML=sugHTML(); }
function sugGo(){
  if(sugLeft()<=0){ closeSheet(); go('plans'); toast(t('sug.out')); return; }
  if(!sugUnl()) aiSpend();
  sugMn=sugMean(); sugBuild(); sugPaint();
}
/* A suggestion is a sequence, so taking one loads the sequence you are
   building. There is no spelling to type into a box; there is no box. */
function sugPick(i){
  if(!SUG[i]) return;
  addSeq=SUG[i].slice();
  SUG=[]; sugPaint(); addPaint();
}

/* A word is built from the sounds this language has, not typed and then
   guessed at. The keys are the language's own inventory: what is not in it
   cannot go in a word, which is the whole point of having chosen it. */
var addSeq=[];
/* A key says its own sound. Pressing one used to be silent, which in an app
   where a word IS its sounds meant you assembled a word you could not hear
   until you had finished it and found the play button. */
/* The same spelling a word being edited has: letters, each with what it says
   here. addSeq is what those readings come out as, kept because everything
   downstream reads it. */
var addSp=[];
function addSync(){ addSeq=spPh(addSp); }
function addPh(sym){
  var l=ltMain(sym);
  addSp.push({l:l? l.id : '', u:sym});
  addSync(); sayOne(sym); addRedraw();
}
function addLtr(id){
  var l=ltById(id); if(!l) return;
  var u=ltFirstUnit(l);
  addSp.push({l:id, u:u});
  addSync(); sayPh(uSplit(u)); addRedraw();
}
function addBack(){ addSp.pop(); addSync(); addRedraw(); }
function addPaint(){ addRedraw(); }
/* The row of letters has to be rebuilt, not just retyped, so the whole form
   body is redrawn -- the two text fields keep their values because they are
   read back before it happens. */
function addRedraw(){
  var b=document.getElementById('form-body'); if(!b) return;
  var mn=document.getElementById('f-mn'), pos=document.getElementById('f-pos');
  if(mn) addMn=mn.value;
  if(pos) addPos=pos.value;
  openAdd(addFrom);
}
function addSpellHTML(){
  var i, l, out='';
  for(i=0;i<addSp.length;i++){
    l=ltById(addSp[i].l);
    out+='<button class="spc'+(spOdd(addSp[i])?' odd':'')+'"' + DO('go', ["aspell", i]) + '>'+
      '<span class="spf">'+(ltHasShape(l)
        ? (l.st&&l.st.length? '<canvas class="tc" data-l="'+esc(l.id)+'"></canvas>'
                            : '<span class="bch">'+esc(l.ch)+'</span>')
        : esc(ltName(l)||'·'))+'</span>'+
      '<span class="spu">'+esc(addSp[i].u)+'</span></button>';
  }
  return '<div class="spellrow">'+(out||'<span class="spnone">'+esc(t('word.sp.none'))+'</span>')+
    '<button class="seqdel" id="f-back"' + DO('addBack') + ''+(addSp.length?'':' disabled')+
    ' aria-label="'+esc(t('glyph.undo'))+'">'+ICON_BACK+'</button></div>';
}
var addMode='';
function addSetMode(m){ addMode=m; addRedraw(); }
function addKeys(){
  var mine=addedSnd(), ls=ltTypable();
  var m=addMode || (ls.length? 'lt' : 'ph');
  if(!mine.length && !ls.length){
    return '<div class="note">'+t('add.ph.none')+'</div>'+
      '<button class="btn ghost" style="width:100%;margin-top:8px"' + DO('go', ["sound"]) + '>'+
      esc(t('toc.sound'))+'</button>';
  }
  var rail = (ls.length && mine.length)
    ? '<div class="segs" style="margin-bottom:8px">'+
      '<button class="seg'+(m==='lt'?' on':'')+'"' + DO('addSetMode', ["lt"]) + '>'+t('toc.letters')+'</button>'+
      '<button class="seg'+(m==='ph'?' on':'')+'"' + DO('addSetMode', ["ph"]) + '>'+t('toc.sound')+'</button>'+
      '</div>' : '';
  if(m==='lt' && ls.length)
    return rail+'<div class="phkeys">'+ls.map(function(l){
      return ltkHTML(l, DO('addLtr',[l.id])); }).join('')+'</div>';
  return rail+'<div class="phkeys">'+mine.map(function(x){
    return phkHTML(x, DO('addPh',[x]));
  }).join('')+'</div>';
}
/* One position of the word being made. Same page as the editor's, on the
   other list. */
function vASpell(){
  var i=parseInt(here().a,10), st=addSp[i];
  if(!st) return viewGone();
  var l=ltById(st.l), own=ltUnits(l), mine=addedSnd(), seen={}, opts=[], j;
  for(j=0;j<own.length;j++) if(!seen[own[j]]){ seen[own[j]]=1; opts.push({u:own[j], own:true}); }
  for(j=0;j<mine.length;j++) if(!seen[mine[j]]){ seen[mine[j]]=1; opts.push({u:mine[j], own:false}); }
  return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="spbig">'+(ltHasShape(l)
      ? (l.st&&l.st.length? '<canvas class="tc" data-l="'+esc(l.id)+'"></canvas>'
                          : '<span class="bch">'+esc(l.ch)+'</span>')
      : esc(ltName(l)||'·'))+'</div>'+
    '<div class="phkeys">'+opts.map(function(o){
      return '<button class="phk'+(o.u===st.u?' on':'')+(o.own?' own':'')+'"' + DO('addSetU', [i, o.u]) + '>'+
        '<span class="pks">'+esc(o.u)+'</span></button>';
    }).join('')+'</div>'+
    '<button class="btn ghost" style="width:100%;margin-top:16px"' + DO('addDropAt', [i]) + '>'+
      t('word.sp.del')+'</button>'+
    '</div></div>';
}
function addSetU(i, u){
  if(!addSp[i]) return;
  addSp[i].u=u; addSync(); sayPh(uSplit(u)); back(); openAdd(addFrom);
}
function addDropAt(i){ addSp.splice(i,1); addSync(); back(); openAdd(addFrom); }
/* Written from nothing, or derived from a word that already exists -- in
   which case it opens as that word's sounds, to be changed from there. */
var addFrom='';
var addMn='';
function openAdd(from){
  /* Reopened by its own redraw, so the spelling is only cleared when the form
     is genuinely new -- otherwise every keypress would empty the word. */
  var fresh = !(here().r==='form' && here().a==='add:'+(from||''));
  if(fresh){ SUG=[]; sugMn=''; addSeq=[]; addSp=[]; addMn=''; }
  var par=from? findWord(from) : null;
  addFrom = par? String(par.hw) : '';
  if(fresh && par){ addSp=JSON.parse(JSON.stringify(spOf(par))); addSync(); }
  if(!capOK(1)){ go('plans'); toast(t('toast.cap', FREE_LIMIT)); return; }
  openForm('add:'+addFrom,
    (addFrom? t('add.title.from', addFrom) : t('add.title')),
    addSpellHTML()+
    '<div class="sec">'+t('add.ph')+'</div>'+
    addKeys()+
    '<div class="pvbox"><span class="pvn">'+t('f.reading')+'</span><span class="pvk" id="f-pv"></span>'+
    '<button' + DO('sayField') + '>'+ICON_PLAY+t('f.listen')+'</button></div>'+
    '<div class="row2"><div class="field"><label>'+t('f.meaning')+'</label><input id="f-mn" placeholder="'+esc(t('f.meaning.ph'))+'"></div>'+
    '<div class="field"><label>'+t('f.pos')+'</label><select id="f-pos">'+
    POS.map(function(p){return '<option value="'+p+'"'+(p===addPos?' selected':'')+'>'+esc(posLabel(p))+'</option>';}).join('')+
    '</select></div></div>'+
    '<div id="sugwrap">'+sugHTML()+'</div>'+
    '<button class="btn" style="width:100%;margin-top:6px"' + DO('addOne') + '>'+t('add.btn')+'</button>',
    function(){ phkMount(); geTiles(); addPv(); });
}
function addPv(){
  var r=document.getElementById('f-pv');
  if(r) r.textContent = addSeq.length? phIpa(addSeq) : '';
}
FORM_OPEN.add=function(from){ openAdd(from||''); };
function sayField(){ if(addSeq.length) sayPh(addSeq); }
function addOne(){
  var hw=addSeq.join('');
  var mn=document.getElementById('f-mn').value.trim();
  var pos=document.getElementById('f-pos').value;
  if(addSeq.length<2){ toast(t('toast.hw2')); return; }
  if(!capOK(1)){ closeSheet(); go('plans'); return; }
  if(WORDS.some(function(w){return String(w.hw).toLowerCase()===hw.toLowerCase();})){ toast(t('toast.dup')); return; }
  addPos=pos;
  var w={hw:hw, ph:addSeq.slice(), mn:mn, mns:(mn?[mn]:[]), pos:pos, at:Date.now()};
  if(addSp.length) w.sp=JSON.parse(JSON.stringify(addSp));
  if(addFrom && addFrom!==hw) w.from=addFrom;
  WORDS.push(w);
  save(); cands=[]; addSeq=[]; addSp=[]; addMn=''; addFrom='';
  if(here().r==='form') back();
  toast(t('toast.added.1', hw));
  render();
}
function findWord(hw){
  for(var i=0;i<WORDS.length;i++){ if(String(WORDS[i].hw).toLowerCase()===String(hw).toLowerCase()) return WORDS[i]; }
  return null;
}
/* The syllables, from the sounds. What used to sit here was the respelling
   -- the word written out in the reader's own script -- and a word made of
   IPA symbols gives it nothing to work from. One syllabifier, in core.js,
   used by the dictionary, the analysis and this. */
/* ---- One word, opened ---------------------------------------------------
   It used to be a read-only card with a meaning box on it: you could change
   what a word meant and nothing else. Not the word. A word built out of the
   wrong sound had to be deleted and written again, and the one meaning box
   meant a word that means two things had nowhere to put the second one.

   Everything about a word is editable here: the sounds it is made of, on the
   same keyboard it was written with; as many meanings as it has; what part of
   speech it is; and the words derived from it, which are words in their own
   right that remember where they came from. */
var openHw='', wEdit=null;

/* A position is marked only when its letter exists and says something else
   here. A sound with no letter at all is not a sound change -- it is a sound
   nobody has drawn yet, which is a different thing and not worth a colour. */
function spOdd(st){
  var l=ltById(st.l);
  return !!(l && ltFirstUnit(l) && st.u!==ltFirstUnit(l));
}
/* ---- spelling a word --------------------------------------------------
   The word is a row of letters, each with the sound it makes underneath. Tap
   a letter in the row and you change what it says HERE and nowhere else --
   which is what a sound change is: 「アルファベットに決まった音があるならそのまま、
   漣音化とか音が変わるならそこの単語から変更できるようにして」

   The keyboard is letters when the language has any, and sounds when it does
   not or when you ask for sounds. Nobody spells by phoneme -- but a language
   three days old has no letters yet, and it still has to be possible to make
   a word. */
function wdSeqHTML(){
  var sp=wEdit.sp||[], i, l, out='';
  for(i=0;i<sp.length;i++){
    l=ltById(sp[i].l);
    out+='<button class="spc'+(spOdd(sp[i])?' odd':'')+'"' + DO('go', ["spell", i]) + '>'+
      '<span class="spf">'+(ltHasShape(l)
        ? (l.st&&l.st.length? '<canvas class="tc" data-l="'+esc(l.id)+'"></canvas>'
                            : '<span class="bch">'+esc(l.ch)+'</span>')
        : esc(ltName(l)||'·'))+'</span>'+
      '<span class="spu">'+esc(sp[i].u)+'</span></button>';
  }
  return '<div class="spellrow">'+(out||'<span class="spnone">'+esc(t('word.sp.none'))+'</span>')+
    '<button class="seqdel"' + DO('wdBack') + ''+(sp.length?'':' disabled')+
    ' aria-label="'+esc(t('glyph.undo'))+'">'+ICON_BACK+'</button></div>'+
    /* No second play. This one and the one at the head of the sheet were both
       sayPh(wEdit.seq) -- the same sound, twice, and this copy sat inside the
       block about which letters spell the word, which is not what a sound is
       for. */
    '<div class="pvbox" style="margin-top:8px"><span class="pvn">'+t('f.reading')+'</span>'+
    '<span class="pvk">'+esc(phIpa(wEdit.seq))+'</span></div>';
}
var wdMode='';
function wdKeyMode(){
  if(wdMode) return wdMode;
  return ltTypable().length? 'lt' : 'ph';
}
function wdSetMode(m){ wdMode=m; wdPaint(); }
function wdKeysHTML(){
  var mine=addedSnd(), ls=ltTypable(), m=wdKeyMode();
  if(!mine.length && !ls.length) return '<div class="note">'+t('add.ph.none')+'</div>';
  var rail = (ls.length && mine.length)
    ? '<div class="segs" style="margin-bottom:8px">'+
      '<button class="seg'+(m==='lt'?' on':'')+'"' + DO('wdSetMode', ["lt"]) + '>'+t('toc.letters')+'</button>'+
      '<button class="seg'+(m==='ph'?' on':'')+'"' + DO('wdSetMode', ["ph"]) + '>'+t('toc.sound')+'</button>'+
      '</div>' : '';
  if(m==='lt' && ls.length)
    return rail+'<div class="phkeys">'+ls.map(function(l){
      return ltkHTML(l, DO('wdLtr',[l.id])); }).join('')+'</div>';
  return rail+'<div class="phkeys">'+mine.map(function(x){
    return phkHTML(x, DO('wdKey',[x])); }).join('')+'</div>';
}
/* A letter on a keyboard: its face, and what it says under it. */
function ltkHTML(l, call){
  var face;
  if(l.st && l.st.length) face='<canvas class="pkc" data-l="'+esc(l.id)+'"></canvas>';
  else if(l.ch) face='<span class="pkb">'+esc(l.ch)+'</span>';
  else face='<span class="pkb">'+esc(ltName(l)||'·')+'</span>';
  return '<button class="phk hasg"'+call+'>'+face+
    '<span class="pks">'+esc(ltFirstUnit(l))+'</span></button>';
}
function wdMnsHTML(){
  var rows=wEdit.mns.map(function(m,i){
    return '<div class="mnrow"><span class="mnv">'+esc(m)+'</span>'+
      '<button class="mnx"' + DO('wdDelMn', [i]) + ' aria-label="'+esc(t('word.mn.del'))+'">'+ICON_CROSS+'</button></div>';
  }).join('');
  return '<div class="mnlist">'+rows+'</div>'+
    '<div class="mnadd"><input id="wd-mn" placeholder="'+esc(t('word.mn.ph'))+'" '+
      '' + KD('wdAddMn') + '>'+
    '<button class="btn ghost"' + DO('wdAddMn') + '>'+t('word.mn.add')+'</button></div>';
}
/* ---- what a dictionary entry still had not got ------------------------
   「単語の例文は？反対語は？同義語は？これのどこが辞書と同じなの？」

   An example, a synonym and an antonym are the three things every dictionary
   in the world has and this one did not. All three are edited on the word
   and saved as they are made, like the derivations above them, because they
   are facts about the word rather than a draft of it.

   A relation goes both ways or it is not a relation: making B a synonym of A
   makes A a synonym of B, and the same for opposites. A dictionary where you
   can look a word up from one side only is half a dictionary. */
function wRel(w, k){ if(!w[k]) w[k]=[]; return w[k]; }
function wRelWords(w, k){
  return wRel(w,k).map(findWord).filter(function(x){ return !!x; });
}
function wRelToggle(hw, k, other){
  var a=findWord(hw), b=findWord(other);
  if(!a || !b || a===b) return;
  var A=wRel(a,k), B=wRel(b,k), i=A.indexOf(b.hw), j=B.indexOf(a.hw);
  if(i>=0){ A.splice(i,1); if(j>=0) B.splice(j,1); }
  else { A.push(b.hw); if(j<0) B.push(a.hw); }
  save(); render();
}
/* Everything pointing at a word is told its new name when the name changes,
   which is why this is a list of headwords and not of objects. */
function wRelRename(old, hw){
  WORDS.forEach(function(x){
    ['syn','ant'].forEach(function(k){
      if(!x[k]) return;
      x[k]=x[k].map(function(y){ return y===old? hw : y; });
    });
    if(x.ex) x.ex.forEach(function(e){
      e.ln=String(e.ln||'').split(/\s+/).map(function(y){ return y===old? hw : y; }).join(' ');
    });
  });
}
function wdRelHTML(k){
  var w=findWord(openHw); if(!w) return '';
  var ws=wRelWords(w,k);
  return (ws.length
    ? '<div class="rels">'+ws.map(function(x){
        return '<button class="rel"' + DO('openWord', [x.hw]) + '>'+
          '<span class="relw">'+esc(wOut(x.hw))+'</span>'+
          (wMns(x)[0]? '<span class="relm">'+esc(wMns(x)[0])+'</span>':'')+'</button>';
      }).join('')+'</div>'
    : '<div class="note">'+t('word.'+k+'.none')+'</div>')+
    '<button class="btn ghost" style="width:100%;margin-top:8px"' + DO('go', ["relate", k+":"+w.hw]) + '>'+ICON_LINK+t('word.'+k+'.add')+'</button>';
}
/* ---- an example ------------------------------------------------------
   A line in this language and what it means. The line is written as words
   separated by spaces; any of them the dictionary knows can be said, and the
   ones it does not are shown as they were typed rather than refused -- a
   word you have not made yet is exactly the reason to write the example. */
function exSeq(ln){
  var out=[], i, w, ps=String(ln||'').trim().split(/\s+/);
  for(i=0;i<ps.length;i++){ w=findWord(ps[i]); if(w) out=out.concat(wPh(w)); }
  return out;
}
function exGloss(ln){
  var ps=String(ln||'').trim().split(/\s+/);
  return ps.map(function(x){ var w=findWord(x); return (w && wMns(w)[0]) || x; }).join(' ');
}
/* The placeholder is two of this language's own words. An instruction there
   -- "words with spaces between them" -- is a sentence nobody wants to read
   in a box they are about to type in; two words show the shape at a glance. */
function exHint(){
  var a=WORDS.slice(0,2).map(function(w){ return String(w.hw); });
  return a.length>1? a.join(' ') : (a[0]||'');
}
function wdExHTML(){
  var w=findWord(openHw); if(!w) return '';
  var ex=w.ex||[];
  return (ex.length
    ? '<div class="exlist">'+ex.map(function(e,i){
        var seq=exSeq(e.ln);
        return '<div class="exrow">'+
          '<div class="exb"><span class="exl'+(myFontOn()?' sfont':'')+'">'+esc(e.ln)+'</span>'+
          '<span class="exg">'+esc(e.gl || exGloss(e.ln))+'</span></div>'+
          (seq.length? '<button class="usep"' + DO('sayPh', [seq]) + ' aria-label="'+
            esc(t('f.listen'))+'">'+ICON_PLAY+'</button>' : '')+
          '<button class="usep"' + DO('cardOpen', ["x", openHw+'#'+i]) + ' aria-label="'+
            esc(t('card.title'))+'">'+ICON_CARD+'</button>'+
          '<button class="usep"' + DO('wdDelEx', [i]) + ' aria-label="'+esc(t('word.ex.del'))+'">'+ICON_CROSS+'</button>'+
          '</div>';
      }).join('')+'</div>'
    : '')+
    '<div class="exadd">'+
      '<input id="wd-exl" placeholder="'+esc(exHint())+'" autocomplete="off">'+
      '<input id="wd-exg" placeholder="'+esc(t('word.ex.gl.ph'))+'" '+
        '' + KD('wdAddEx') + '>'+
      '<button class="btn ghost"' + DO('wdAddEx') + '>'+t('word.mn.add')+'</button>'+
    '</div>';
}
function wdAddEx(){
  var w=findWord(openHw), a=document.getElementById('wd-exl'), b=document.getElementById('wd-exg');
  if(!w || !a) return;
  var ln=String(a.value||'').trim();
  if(!ln){ toast(t('word.ex.need')); return; }
  if(!w.ex) w.ex=[];
  w.ex.push({ln:ln, gl:String((b&&b.value)||'').trim()});
  save(); wdPaint();
}
function wdDelEx(i){
  var w=findWord(openHw); if(!w || !w.ex) return;
  w.ex.splice(i,1); save(); wdPaint();
}
/* Choosing the other end of a relation: every word, ticked or not. */
function vRelate(){
  var a=String(here().a||''), i=a.indexOf(':'), k=a.slice(0,i), hw=a.slice(i+1);
  var w=(k==='syn'||k==='ant')? findWord(hw) : null;
  if(!w) return viewGone();
  var on=wRel(w,k), list=WORDS.filter(function(x){ return x!==w; })
    .sort(function(x,y){ return String(x.hw).localeCompare(String(y.hw)); });
  return '<div class="view">'+navTop(on.length)+'<div class="body">'+
    (list.length
      ? list.map(function(x){
          var has=on.indexOf(x.hw)>=0;
          return '<div class="entry'+(has?' on':'')+'">'+
            '<button class="ebody"' + DO('wRelToggle', [hw, k, x.hw]) + '>'+
            '<div class="hwrow"><span class="hw">'+esc(wOut(x.hw))+'</span>'+
            '<span class="pos">'+esc(posLabel(x.pos))+'</span></div>'+
            '<div class="mn">'+esc(wMns(x)[0]||t('words.addmn'))+'</div></button>'+
            '<span class="ltck">'+(has? ICON_TICK : '')+'</span></div>';
        }).join('')
      : '<div class="note">'+t('words.empty')+'</div>')+
    '</div></div>';
}
function wdNoteHTML(){
  return '<div class="field"><textarea id="wd-nt" rows="2" placeholder="'+esc(t('word.note.ph'))+
    '"' + IN('wdSetNt') + '>'+esc(wEdit.nt||'')+'</textarea></div>';
}
function wdKidsHTML(){
  var w=findWord(openHw); if(!w) return '';
  var kids=wKids(w), par=wParent(w);
  return (par? '<button class="ntrow"' + DO('openWord', [par.hw]) + '>'+
            '<span class="nth">'+t('word.from', esc(par.hw))+'</span>'+
            (wMn(par)? '<span class="ntb">'+esc(wMn(par))+'</span>':'')+'</button>' : '')+
    (kids.length? '<div class="ntlist" style="margin-top:8px">'+kids.map(function(k){
        return '<button class="ntrow"' + DO('openWord', [k.hw]) + '>'+
          '<span class="nth">'+esc(k.hw)+'</span>'+
          '<span class="ntb">'+esc(wMn(k)||t('sent.nomean'))+'</span></button>';
      }).join('')+'</div>' : '')+
    '<button class="btn ghost" style="width:100%;margin-top:10px"' + DO('wdDerive') + '>'+t('word.derive')+'</button>';
}
function wdPaint(){
  var b=document.getElementById('wd-body'); if(!b) return;
  b.innerHTML=wdBodyHTML(); phkMount(); geTiles();
}
function wdBodyHTML(){
  var seq=wEdit.seq;
  return '<div class="whd"><span class="whw">'+esc(seq.join(''))+'</span>'+
      '<button class="play" style="margin:0 0 0 auto"' + DO('sayPh', [seq]) + '>'+
      ICON_PLAY+t('f.listen')+'</button>'+
      /* the one way out of the app: this word as a picture, in the letters
         it is written in, for somewhere that is not Lingua */
      '<button class="usep"' + DO('cardOpen', ["w", openHw]) + ' aria-label="'+
        esc(t('card.title'))+'">'+ICON_CARD+'</button></div>'+
    '<div class="wsub">'+esc(phIpa(seq))+'</div>'+
    '<div class="wsub2">'+esc(phCut(seq).map(function(p){
        return p.on.join('')+p.nu.join('')+p.co.join(''); }).join('·'))+'</div>'+

    '<div class="sec">'+t('word.sounds')+'</div>'+
    wdSeqHTML()+wdKeysHTML()+

    '<div class="sec">'+t('word.means')+'</div>'+
    wdMnsHTML()+

    '<div class="sec">'+t('f.pos')+'</div>'+
    '<div class="field"><select id="wd-pos"' + CH('wdSetPos') + '>'+
      POS.map(function(p){return '<option value="'+p+'"'+(p===wEdit.pos?' selected':'')+'>'+esc(posLabel(p))+'</option>';}).join('')+
    '</select></div>'+

    '<div class="sec">'+t('word.family')+'</div>'+
    wdKidsHTML()+

    '<div class="sec">'+t('word.syn')+'</div>'+
    wdRelHTML('syn')+

    '<div class="sec">'+t('word.ant')+'</div>'+
    wdRelHTML('ant')+

    '<div class="sec">'+ICON_LINE+t('word.ex')+'</div>'+
    wdExHTML()+


    '<div class="sec">'+t('word.note')+'</div>'+
    wdNoteHTML()+

    '<button class="btn" style="width:100%;margin-top:18px"' + DO('saveWord') + '>'+t('word.save')+'</button>'+
    '<button class="set" style="margin-top:10px;border-bottom:none"' + DO('delWord') + '>'+
      '<span class="sl bad">'+t('word.del')+'</span></button>';
}
function openWord(hw){
  var w=findWord(hw); if(!w) return;
  openHw=w.hw;
  wEdit={seq:wPh(w).slice(), sp:JSON.parse(JSON.stringify(spOf(w))), mns:wMns(w).slice(), pos:w.pos, nt:w.nt||''};
  openForm('word:'+w.hw, wOut(w.hw), '<div id="wd-body">'+wdBodyHTML()+'</div>',
           function(){ phkMount(); });
}
FORM_OPEN.word=function(hw){ openWord(hw); };
/* Both keyboards write the same thing: a step in the spelling. A sound
   pressed on the sound keyboard is a step whose letter is whichever letter
   writes it, or none at all if nothing does yet. */
function wdSync(){ wEdit.seq=spPh(wEdit.sp||[]); }
function wdLtr(id){
  var l=ltById(id); if(!l) return;
  var u=ltFirstUnit(l);
  if(!wEdit.sp) wEdit.sp=[];
  wEdit.sp.push({l:id, u:u});
  wdSync(); sayPh(uSplit(u)); wdPaint();
}
function wdKey(sym){
  var l=ltMain(sym);
  if(!wEdit.sp) wEdit.sp=[];
  wEdit.sp.push({l:l? l.id : '', u:sym});
  wdSync(); sayOne(sym); wdPaint();
}
/* Four things that were written as code inside a button: a condition, a pair
   of statements, and two assignments. Each is one line now, in a file a
   checker can read. */
function goPlans(){ closeSheet(); go('plans'); }
function wdSetNt(v){ wEdit.nt=v; }
function wdSetPos(v){ wEdit.pos=v; }
function wdBack(){
  if(wEdit.sp && wEdit.sp.length) wEdit.sp.pop();
  wdSync(); wdPaint();
}
/* One position of one word, and what it says there. The letter's own
   readings first, then every sound the language has, because a sound change
   is exactly the case where the letter's own readings are not enough. */
function vSpell(){
  var i=parseInt(here().a,10), sp=(wEdit&&wEdit.sp)||[], st=sp[i];
  if(!st) return viewGone();
  var l=ltById(st.l), own=ltUnits(l), mine=addedSnd(), seen={}, opts=[], j;
  for(j=0;j<own.length;j++) if(!seen[own[j]]){ seen[own[j]]=1; opts.push({u:own[j], own:true}); }
  for(j=0;j<mine.length;j++) if(!seen[mine[j]]){ seen[mine[j]]=1; opts.push({u:mine[j], own:false}); }
  return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="spbig">'+(ltHasShape(l)
      ? (l.st&&l.st.length? '<canvas class="tc" data-l="'+esc(l.id)+'"></canvas>'
                          : '<span class="bch">'+esc(l.ch)+'</span>')
      : esc(ltName(l)||'·'))+'</div>'+
    '<div class="phkeys">'+opts.map(function(o){
      return '<button class="phk'+(o.u===st.u?' on':'')+(o.own?' own':'')+'"' + DO('wdSetU', [i, o.u]) + '>'+
        '<span class="pks">'+esc(o.u)+'</span></button>';
    }).join('')+'</div>'+
    '<button class="btn ghost" style="width:100%;margin-top:16px"' + DO('wdDropAt', [i]) + '>'+
      t('word.sp.del')+'</button>'+
    '</div></div>';
}
function wdSetU(i, u){
  if(!wEdit || !wEdit.sp || !wEdit.sp[i]) return;
  wEdit.sp[i].u=u; wdSync(); sayPh(uSplit(u)); back(); wdPaint();
}
function wdDropAt(i){
  if(!wEdit || !wEdit.sp) return;
  wEdit.sp.splice(i,1); wdSync(); back(); wdPaint();
}
function wdAddMn(){
  var e=document.getElementById('wd-mn'); if(!e) return;
  var v=String(e.value||'').trim();
  if(!v) return;
  if(wEdit.mns.indexOf(v)<0) wEdit.mns.push(v);
  wdPaint();
}
function wdDelMn(i){ wEdit.mns.splice(i,1); wdPaint(); }
/* A derived word starts as its parent and is changed from there, which is what
   deriving is. It is a real entry, so it can itself be derived from. */
function wdDerive(){
  var w=findWord(openHw); if(!w) return;
  closeSheet({target:{id:'sbg'}});
  openAdd(w.hw);
}
function saveWord(){
  var w=findWord(openHw); if(!w) return;
  var hw=wEdit.seq.join('');
  if(!wEdit.seq.length){ toast(t('toast.hw2')); return; }
  var clash=findWord(hw);
  if(clash && clash!==w){ toast(t('toast.dup')); return; }
  var old=String(w.hw);
  w.ph=wEdit.seq.slice(); w.hw=hw;
  if(wEdit.sp && wEdit.sp.length) w.sp=JSON.parse(JSON.stringify(wEdit.sp)); else delete w.sp;
  w.mns=wEdit.mns.slice(); w.mn=wEdit.mns.length? wEdit.mns[0] : '';
  w.pos=wEdit.pos;
  /* An empty note is no note, not an empty one: a key that is always there
     and always blank ends up in every export and every backup. */
  if(String(wEdit.nt||'').trim()) w.nt=String(wEdit.nt).trim(); else delete w.nt;
  /* A word that changes is still the same word, so everything pointing at it
     is told its new name rather than left pointing at one that is gone. */
  if(hw!==old){
    WORDS.forEach(function(x){ if(x.from===old) x.from=hw; });
    wRelRename(old, hw);
    LINES.forEach(function(l){ l.ws=l.ws.map(function(x){ return x===old? hw : x; }); });
  }
  save(); closeSheet({target:{id:'sbg'}}); cands=[]; render(); toast(t('toast.saved', hw));
}
function delWord(){
  var w=findWord(openHw); if(!w) return;
  if(!confirm(t('confirm.del', w.hw))) return;
  var gone=String(w.hw);
  WORDS=WORDS.filter(function(x){return x!==w;});
  /* its children keep their own life; they simply stop pointing at a parent
     that is not there */
  WORDS.forEach(function(x){ if(x.from===gone) delete x.from; });
  /* and nothing is left pointing at a word that has gone */
  WORDS.forEach(function(x){
    ['syn','ant'].forEach(function(k){
      if(x[k]) x[k]=x[k].filter(function(y){ return y!==gone; });
    });
  });
  LINES=LINES.filter(function(l){ return l.ws.indexOf(gone)<0; });
  save(); closeSheet({target:{id:'sbg'}}); cands=[]; render(); toast(t('toast.deleted', gone));
}

/* The CSV header stays English in every locale, so a file written on one
   device imports cleanly on another. The part of speech comes back through
   posKey(), which accepts a key or a label in any supported language. */
function exportCSV(){
  var csv='spelling,meaning,pos,ipa,sounds,from\n'+WORDS.map(function(w){
    return [w.hw,wMns(w).join(' / '),w.pos,phIpa(wPh(w)),wPh(w).join(' '),w.from||''].map(function(x){return '"'+String(x||'').replace(/"/g,'""')+'"';}).join(',');
  }).join('\n');
  try{
    var b=new Blob([csv],{type:'text/csv'}), u=URL.createObjectURL(b), a=document.createElement('a');
    a.href=u; a.download=(langName||'lingua')+'.csv'; a.click(); URL.revokeObjectURL(u);
    toast(t('toast.exported'));
  }catch(e){ toast(t('toast.exportfail')); }
}
/* Bringing a list IN is chapter 17, www/import.js: it grew a reader for
   every shape a list arrives in and stopped fitting under this heading. */

