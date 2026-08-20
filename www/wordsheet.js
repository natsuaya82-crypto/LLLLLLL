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
/* One capability for the AI, and it is Studio's. There were two -- `ai` at
   plus and `sug` at studio -- and they were the same ceiling said twice, so a
   Plus account was shown "3 left" forever and never spent one. The AI is not
   what Plus sells: Plus is the tools for building a language yourself, and
   every one of them runs on this phone for nothing. */
function sugUnl(){ return can('ai'); }
function sugLeft(){ return sugUnl() ? Infinity : Math.max(0, AI_FREE_DAILY-aiUsed()); }
/* What the word is for, as far as it has been said -- the first meaning
   written on the sheet, which is where a suggestion gets its sense from. */
function sugMean(){ return (wEdit && wEdit.mns[0]) || ''; }
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
    SUG.map(function(q,i){ return '<button class="sugchip"' + DO('sugPick', [i]) + '><span class="slw">'+esc(q.join(''))+'</span><span class="sr">'+esc(readSeq(q))+'</span></button>'; }).join('')+
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
/* A suggestion is a sequence of sounds, so taking one spells the word out of
   whichever letters write those sounds -- the same step objects the keys and
   the typed field build, because there is one spelling and one shape for it. */
function sugPick(i){
  if(!SUG[i] || !wEdit) return;
  wEdit.sp=SUG[i].map(function(u){ var l=ltMain(u); return {l:(l? l.id : ''), u:u}; });
  wdSync(); SUG=[]; wdPaint();
}
/* The word being made, as a word. It is the same shape as one in the
   dictionary and is simply not in WORDS yet -- so what means the same, what
   means the opposite, its examples and its note are written ON it here and
   go in with it, instead of being four things you can only reach once the
   word exists. 「単語追加の時点で編集できるようにしろよ。編集でも見えるように当たり前だろバカか」

   That is what lets one sheet do both: wdW() answers the editor with a word
   out of the dictionary and the new-word sheet with this, and everything on
   the sheet takes what it is about from there rather than from which screen
   it is on. */
var addW=null;
/* The letters a word is spelled with, in order, each one a way back into the
   position it holds. The new-word sheet and the editor show the same row of
   the same thing -- they differ in which list it is, where a tap goes and
   what undo is called, and in nothing else. */
function spRowHTML(sp, route, back, id){
  var i, l, out='';
  for(i=0;i<sp.length;i++){
    l=ltById(sp[i].l);
    out+='<button class="spc'+(spOdd(sp[i])?' odd':'')+'"' + DO('go', [route, i]) + '>'+
      '<span class="spf">'+ltInk(l, esc(ltName(l)||'\u00b7'))+'</span>'+
      '<span class="spu">'+esc(spUnit(sp[i]))+'</span></button>';
  }
  return '<div class="spellrow">'+(out||'<span class="spnone">'+esc(t('word.sp.none'))+'</span>')+
    '<button class="seqdel"'+(id? ' id="'+id+'"' : '') + DO(back) + (sp.length?'':' disabled')+
    ' aria-label="'+esc(t('glyph.undo'))+'">'+ICON_BACK+'</button></div>';
}
/* ---- the sheet a word is written on --------------------------------------
   One sheet, whether the word exists yet or not. 「作成編集それぞれ同じ画面で」

   There used to be two. The new-word sheet had its own spelling field, its own
   row of letters, its own keys, its own rail, its own page for one position of
   a word, its own meaning box and its own part of speech -- eighteen functions
   that were the editor's eighteen functions with `add` on the front. They had
   already drifted: the editor took several meanings and the sheet took one,
   the editor had a family and the sheet had none, and which of the two you
   were looking at decided what a word was allowed to have.

   So the sheet is the editor, and what it is about is wdW(): a word out of the
   dictionary, or the draft that is not in it yet. The only differences left
   are the three that are real -- a draft cannot be deleted, cannot derive from
   itself, and is added rather than saved. */
var addFrom='';
function openAdd(from){
  /* Reopened by its own redraw and on the way back from the picker, so what
     has been typed is only cleared when the sheet is genuinely new. */
  var fresh = !(here().r==='form' && here().a==='add:'+(from||''));
  var par=from? findWord(from) : null;
  addFrom = par? String(par.hw) : '';
  if(fresh){
    SUG=[]; sugMn=''; openHw='';
      /* The draft holds only what a relation and an example need a WORD for.
       Everything staged -- the spelling, the meanings, the part of speech,
       the register, the fields, the etymology, the note -- is in wEdit, the
       same as when the word already exists. */
    addW={hw:'', mns:[], pos:addPos, syn:[], ant:[], ex:[]};
    wdMnNew=false; wdExNew=false;
    if(addFrom) addW.from=addFrom;
    wEdit={seq:[], sp:(par? JSON.parse(JSON.stringify(spOf(par))) : []),
           mns:[], pos:addPos, reg:'', tags:[], ety:'', nt:''};
    wdSync();
  }
  if(!capOK(1)){ go('plans'); toast(t('toast.cap', FREE_LIMIT)); return; }
  openForm('add:'+addFrom,
    (addFrom? t('add.title.from', addFrom) : t('add.title')),
    '<div id="wd-body">'+wdFormHTML()+'</div>',
    function(){ phkMount(); geTiles(); });
}
FORM_OPEN.add=function(from){ openAdd(from||''); };
function addOne(){
  /* The word is what was typed, letter by letter -- not the sounds those
     letters happen to read. */
  var sp=(wEdit && wEdit.sp) || [], hw=spWord(sp), d=addW;
  var syn, ant, w;
  if(!d) return;
  if(!sp.length || !hw){ toast(t('toast.hw2')); return; }
  if(!capOK(1)){ closeSheet(); go('plans'); return; }
  if(findWord(hw)){ toast(t('toast.dup')); return; }
  addPos=wEdit.pos;
  syn=(d.syn||[]).slice(); ant=(d.ant||[]).slice();
  /* No `ph` on it: the spelling is the word, and what it sounds like is
     asked of the letters every time it is wanted. A stored copy is a copy of
     a sound, and a copy of a sound is what went stale the day the letter's
     sound changed. */
  w={hw:hw, mns:wEdit.mns.slice(), mn:(wEdit.mns[0]||''), pos:wEdit.pos, at:Date.now()};
  w.sp=JSON.parse(JSON.stringify(sp));
  if(addFrom && addFrom!==hw) w.from=addFrom;
  if(w.from && d.fm) w.fm=d.fm;
  /* Everything written on the draft comes with it. An empty note is no note,
     not an empty one -- the same rule saveWord() holds. */
  if(d.ex && d.ex.length) w.ex=d.ex;
  wdPutExtras(w);
  WORDS.push(w);
  /* The draft is gone before the relations are written, so each of them is
     an ordinary two-ended one between two words that both exist now. */
  addW=null;
  syn.forEach(function(o){ wRelToggle(hw, 'syn', o); });
  ant.forEach(function(o){ wRelToggle(hw, 'ant', o); });
  save(); cands=[]; addFrom='';
  /* Onto the word, read. Everything it holds was written on the way in, so
     what is wanted now is a look at it, not another form. */
  if(here().r==='form') back();
  toast(t('toast.added.1', hw));
  openWord(hw);
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
  return st.u!==undefined && st.u!==null;
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
/* The same as the new-word sheet's: typed on free, pressed on the paid plan,
   and the row of letters under it either way. */
function wdTypeHTML(){ return spTypeField('wd-ln', 'wdSetLn', wEdit.sp||[], 'whin'); }
function wdSetLn(v){
  wEdit.sp=spType(v);
  wdSync();
  lnGrow('wd-ln');
  var r=document.getElementById('wd-rd');
  if(r) r.textContent=phIpa(wEdit.seq);
}
/* The row of tiles: the word as its letters, one press to the sound that
   letter has in this word. Paid only, and only once something is typed --
   an empty row is a control for a thing that does not exist yet.

   No reading under it any more. It said 読み and then the IPA, which is
   what the head of the sheet already says directly under the field: the
   same value, twice, four lines apart. */
function wdSeqHTML(){
  var sp=wEdit.sp||[];
  if(!sp.length) return '';
  return spRowHTML(sp, 'spell', 'wdBack', '');
}
var wdMode='';
function wdSetMode(m){ wdMode=m; wdPaint(); }
/* A field for one more of something appears when the `+` on the heading is
   pressed and stays for the rest of the sheet, so a word with five meanings
   is five presses of Enter and not five of anything else. Nothing is typed
   into until somebody says there is one more. */
var wdMnNew=false, wdExNew=false;
function wdMnOpen(){ wdMnNew=true; wdPaint(); }
function wdExOpen(){ wdExNew=true; wdPaint(); }
function wdMnsHTML(){
  var rows=wEdit.mns.map(function(m,i){
    return '<div class="mnrow"><span class="mnv">'+esc(m)+'</span>'+
      '<button class="mnx"' + DO('wdDelMn', [i]) + ' aria-label="'+esc(t('word.mn.del'))+'">'+ICON_CROSS+'</button></div>';
  }).join('');
  return '<div class="mnlist">'+rows+'</div>'+
    (wdMnNew? '<div class="mnadd"><input id="wd-mn" aria-label="'+esc(t('word.means'))+'" '+
      '' + KD('wdAddMn') + '></div>' : '');
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
/* The picker is a screen, not a sheet, so the sheet that opened it is a
   cached string built before any of this happened -- and returning to it
   showed the word you had just chosen nowhere on it.

   The two are rebuilt differently on purpose. The editor is rebuilt in
   place, from wEdit, because reopening it would re-read the word and throw
   away meanings typed and not yet saved; the sheet that makes a word is
   dropped, and vForm() builds it again from the draft, which is where
   everything on it lives. */
function relDirty(){
  if(!FORM) return;
  if(addW) FORM=null;
  else if(openHw && FORM.key==='edit:'+openHw)
    FORM.html='<div id="wd-body">'+wdFormHTML()+'</div>';
}
/* An empty headword is the word being made, which is the one case where the
   relation can only be written down one end of: the other end has nothing to
   point back at until Add exists it. addOne() joins both ends then. */
function wRelToggle(hw, k, other){
  var a=hw? findWord(hw) : addW, b=findWord(other);
  if(!a || !b || a===b) return;
  var A=wRel(a,k), i=A.indexOf(b.hw), B, j;
  if(a===addW){
    if(i>=0) A.splice(i,1); else A.push(b.hw);
    relDirty(); render(); return;
  }
  B=wRel(b,k); j=B.indexOf(a.hw);
  if(i>=0){ A.splice(i,1); if(j>=0) B.splice(j,1); }
  else { A.push(b.hw); if(j<0) B.push(a.hw); }
  save(); relDirty(); render();
}
/* Taking one off the word being made, from the chip rather than from the
   picker -- the same list, so the same function decides it. */
function wRelOff(k, other){ wRelToggle('', k, other); wdPaint(); }
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
/* The word the open sheet is about: the one being made, or the one out of
   the dictionary being edited. One of the two is always null, because
   openAdd() and openWord() each say which sheet it is as they open. Every
   section below asks this and none of them asks which screen it is on. */
function wdW(){ return addW || findWord(openHw); }
/* A draft is not in WORDS, so there is nothing for save() to write. The
   repaint is the same either way: one sheet, one body, one id. */
function wdStore(){ if(!addW) save(); }
function wdRelHTML(k){
  var w=wdW(); if(!w) return '';
  var ws=wRelWords(w,k);
  return (ws.length
    ? '<div class="rels">'+ws.map(function(x){
        /* On a word that exists the chip is a way to it. On the one being
           made it cannot be -- going there would leave the draft -- so there
           it takes the word back off, which is the only other thing a chip
           on a list you are assembling could mean. */
        return '<button class="rel"' +
          (addW? DO('wRelOff', [k, x.hw]) : DO('openWord', [x.hw])) + '>'+
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
/* One button at the end of an example: listen, make a card, throw it away.
   Five of them, in two files, were the same line with a different icon. */
function exBtn(fn, args, key, icon){
  return '<button class="usep"' + DO(fn, args) + ' aria-label="'+
    esc(t(key))+'">'+icon+'</button>';
}
/* One example sentence: what it says, what it means, and a way to hear it.
   The grammar stages show these and so does the word sheet -- the same row,
   for the same reason -- and they differ only in what goes at the end of it.
   A stage's examples carry a label (肯定 / 否定); a word's do not, and an
   example with none simply has none. */
function exRowHTML(e, seq, tail){
  return '<div class="exrow">'+
    '<div class="exb">'+
      (e.lb? '<span class="exlb">'+esc(e.lb)+'</span>' : '')+
      '<span class="exl'+(myFontOn()?' sfont':'')+'">'+esc(e.ln)+'</span>'+
      '<span class="exg">'+esc(e.gl || exGloss(e.ln))+'</span></div>'+
    (seq.length? exBtn('sayPh', [seq], 'f.listen', ICON_SPK) : '')+
    tail+'</div>';
}
function exHint(){
  var a=WORDS.slice(0,2).map(function(w){ return String(w.hw); });
  return a.length>1? a.join(' ') : (a[0]||'');
}
function wdExHTML(){
  var w=wdW(); if(!w) return '';
  var ex=w.ex||[];
  return (ex.length
    ? '<div class="exlist">'+ex.map(function(e,i){
        /* No card off a word that is not in the dictionary yet: a card is
           made from a headword, and this one has none until Add. */
        return exRowHTML(e, exSeq(e.ln),
          (addW? '' : exBtn('cardOpen', ["x", openHw+'#'+i], 'card.title', ICON_SHARE))+
          exBtn('wdDelEx', [i], 'word.ex.del', ICON_CROSS));
      }).join('')+'</div>'
    : '')+
    (wdExNew? '<div class="exadd">'+
      lnField('wd-exl', exHint(), KD('wdAddEx'), '')+
      '<input id="wd-exg" aria-label="'+esc(t('word.ex.gl.ph'))+'" '+
        '' + KD('wdAddEx') + '>'+
    '</div>' : '');
}
function wdAddEx(){
  var w=wdW(), a=document.getElementById('wd-exl'), b=document.getElementById('wd-exg');
  if(!w || !a) return;
  var ln=String(a.value||'').trim();
  if(!ln){ toast(t('word.ex.need')); return; }
  if(!w.ex) w.ex=[];
  w.ex.push({ln:ln, gl:String((b&&b.value)||'').trim()});
  wdStore(); wdPaint();
}
function wdDelEx(i){
  var w=wdW(); if(!w || !w.ex) return;
  w.ex.splice(i,1); wdStore(); wdPaint();
}
/* Choosing the other end of a relation: every word, ticked or not. */
function vRelate(){
  var a=String(here().a||''), i=a.indexOf(':'), k=a.slice(0,i), hw=a.slice(i+1);
  /* No headword is the word being made: the picker is the same picker, and
     what it ticks is that draft's list. */
  var w=(k==='syn'||k==='ant')? (hw? findWord(hw) : addW) : null;
  if(!w) return viewGone();
  /* The dictionary as it is browsed, for the same reason the search is:
     picking a word is picking one off the list. */
  var on=wRel(w,k), list=wordsSeen().filter(function(x){ return x!==w; })
    .sort(function(x,y){ return String(x.hw).localeCompare(String(y.hw)); });
  return '<div class="view">'+navTop(on.length)+'<div class="body">'+
    /* A word that means the same as this one is very often a word that does
       not exist yet -- that is WHY it is being written -- and the picker
       offered the dictionary and nothing else, so the answer to "what means
       the same as this" was "nothing, go and make one first, then come back
       here and find it". 「その場で類義語とか対義語を作れるようにすればいいやん」
       So it is made here, and joined here, in one press. */
    '<div class="sec">'+t('home.write')+'</div>'+
    '<div class="row2"><div class="field"><input id="rel-hw" placeholder="'+
      esc(t('f.spelling'))+'" autocapitalize="none" autocorrect="off" spellcheck="false"></div>'+
    '<div class="field"><input id="rel-mn" placeholder="'+esc(t('f.meaning.ph'))+'"></div></div>'+
    '<button class="btn ghost" style="width:100%;margin:8px 0 18px"' + DO('relNew') +
      ' aria-label="'+esc(t('add.btn'))+'">'+ICON_ADD+'</button>'+
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
/* Made and joined in one press. A word typed here is spelled by the same
   spType() the new-word sheet uses, so it is written in this language's
   letters and not in whatever was on the keyboard; a spelling the dictionary
   already holds is not made twice, it is simply joined. */
function relNew(){
  var a=String(here().a||''), i=a.indexOf(':'), k=a.slice(0,i), hw=a.slice(i+1);
  var e=document.getElementById('rel-hw'), m=document.getElementById('rel-mn');
  var txt=e? String(e.value||'').trim() : '', mn=m? String(m.value||'').trim() : '';
  var sp, nw, w, on=hw? findWord(hw) : addW;
  if(!on || (k!=='syn' && k!=='ant')) return;
  if(!txt){ toast(t('toast.hw2')); return; }
  sp=spType(txt); nw=spWord(sp);
  if(!nw){ toast(t('toast.hw2')); return; }
  if(hw && nw.toLowerCase()===String(hw).toLowerCase()){ toast(t('toast.dup')); return; }
  if(!findWord(nw)){
    if(!capOK(1)){ go('plans'); toast(t('toast.cap', FREE_LIMIT)); return; }
    w={hw:nw, mn:mn, mns:(mn?[mn]:[]), pos:addPos, at:Date.now(), sp:sp};
    WORDS.push(w);
    toast(t('toast.added.1', nw));
  }
  /* saves and redraws, and does nothing at all if the two are already joined
     -- so pressing this twice does not take the relation back off again */
  if(wRel(on, k).indexOf(findWord(nw).hw)<0) wRelToggle(hw, k, nw);
  else { save(); relDirty(); render(); }
}
/* Staged in wEdit, on both sheets, because both have one now -- and the note
   went into the draft while wdPutExtras() read it out of wEdit, so a note
   written before the word existed was silently dropped by Add. Two places
   staging one field is the bug; there is one place. */
function wdNoteHTML(){
  return '<div class="field"><textarea id="wd-nt" rows="2" aria-label="'+esc(t('word.note'))+
    '"' + IN('wdSetNt') + '>'+esc(wEdit.nt||'')+'</textarea></div>';
}
/* The family, on the sheet. Written out of wdFamHTML(), which is the family
   the read page shows -- one answer to "where did this word come from".
   A word being made can name its parent and cannot derive from itself. */
function wdKidsHTML(){
  var w=wdW(); if(!w) return '';
  return wdFamHTML(w)+
    (addW? '' : '<button class="btn ghost" style="width:100%;margin-top:10px"' +
      DO('wdDerive') + '>'+t('word.derive')+'</button>');
}
function wdPaint(){
  var b=document.getElementById('wd-body'); if(!b) return;
  b.innerHTML=wdFormHTML(); phkMount(); geTiles();
}
/* ---- four things an entry carries, beyond what it means -----------------
   A dictionary is not a list of meanings. Which of two words for the same
   thing you would actually say is its REGISTER; what a word is about is its
   FIELD, and a language with five hundred words in it is unusable without
   one; where it came from is not the same question as what it means, so it
   is not the note; and when it last moved is the difference between a
   dictionary and a pile.

   Register is one of five and is stored as a code, never as its label, so
   the interface language can change under a word without changing the word.
   REG[0] is the empty string on purpose: most words are not marked, and it
   shows as an empty row. It used to be called ふつう / Neutral, which is the
   app naming the state of nobody having said anything and then offering that
   name as one of the answers. 「文体のふつうってなんだよ」 */
var REG=['','sp','wr','sl','po'];
function regLabel(r){ return r? t('word.reg.'+r) : ''; }
/* ---- what a word is of the word it came from ---------------------------
   「過去形とか未来形とか現在進行形みたいなの形変えたのも一括で見れたほうが
   良くない？」

   A derived word already sat under its parent -- what was missing is what it
   IS of it, so 歩く→歩いた and 歩く→歩く人 stood in one undifferentiated pile.

   Two lists, because they are two different things and the second one was
   the question that found them: 「tirorがウォッチャーになるのって何系？」 An
   INFLECTION is the same word in another shape -- a past tense is still the
   verb. A DERIVATION is a different word built out of it -- the one who
   watches is a noun, and no amount of conjugating gets you there.

   The label is on the LINK and no language declares a paradigm:
   「型決めても英語みたいに変わってる可能性もあるやん」 -- nothing obliges a word
   to have every form or any of them, and a form built out of nothing like its
   parent, go / went, is still just a word with a label on it.

   Codes, never labels, the same rule a register follows: the interface
   language changes under a word without changing the word. What somebody
   writes themselves is the exception and is kept AS the words they typed,
   prefixed with the group it belongs to -- it is their language, so it is
   not ours to translate, and it is stored on the word rather than in a list
   of its own: the labels a language has are the ones its words are wearing.
   Nothing to migrate, nothing to keep in step, nothing to delete. */
var FM_INF=['pst','prs','fut','prg','prf','neg','imp','que','cnd','cau','pas','pl'];
var FM_DER=['agt','ins','loc','act','qua','dim','aug','col','opp','adj','vrb','adv'];
function fmOwn(f){ return String(f||'').slice(0,2)==='i~' || String(f||'').slice(0,2)==='d~'; }
function fmGroup(f){
  if(fmOwn(f)) return String(f).charAt(0);
  return (FM_INF.indexOf(f)>=0)? 'i' : ((FM_DER.indexOf(f)>=0)? 'd' : '');
}
function fmLabel(f){
  if(!f) return '';
  return fmOwn(f)? String(f).slice(2) : t('word.fm.'+f);
}
/* The order the family is read in: the inflections in their order, then the
   derivations in theirs, with anything somebody wrote themselves after the
   ones we supplied in its own group, and a word that is a form of nothing
   last. */
function fmRank(f){
  var g=fmGroup(f), i;
  if(!f) return 900;
  if(g==='i'){ i=FM_INF.indexOf(f); return (i<0)? 200 : i; }
  if(g==='d'){ i=FM_DER.indexOf(f); return (i<0)? 500 : 300+i; }
  return 800;
}
/* Every label of a group this language is already using, which is where the
   ones somebody wrote come back from. Read off the words themselves, in the
   order they were made, each one once. */
function fmMine(g){
  var out=[], i, f;
  for(i=0;i<WORDS.length;i++){
    f=WORDS[i].fm;
    if(fmOwn(f) && String(f).charAt(0)===g && out.indexOf(f)<0) out.push(f);
  }
  return out;
}
/* The form is a fact about a word's parent, so it is asked only of a word
   that has one -- on the sheet a word is coined on, that is the parent it
   was derived from; on the sheet it is edited on, the one it carries. */
function wdFrom(){
  var w;
  if(addW) return addFrom||'';
  w=findWord(openHw);
  return (w && w.from)? String(w.from) : '';
}
/* Chosen on a screen rather than out of a wheel, because there are two
   groups and one of them a person can add to, and neither of those is
   something a <select> can be. The row says what it is now. */
function wdFmHTML(){
  var w=addW||findWord(openHw), f=(w && w.fm)||'';
  return wdPickRow(t('word.fm'), fmLabel(f)||t('word.none'),
    DO('go', ["fm", (addW? '' : String(openHw||''))]));
}
/* Written onto the word as it is chosen, the way a synonym is -- what a word
   is of its parent is a fact about the word, not a draft of it. The word
   being coined has nowhere to save to yet, so it goes on the draft and
   addOne() carries it over. */
function fmPick(hw, f){
  var w=hw? findWord(hw) : addW;
  if(!w) return;
  if(f) w.fm=f; else delete w.fm;
  if(hw) save();
  relDirty(); back();
}
/* A label of somebody's own. It is the words they typed and it is not
   translated; what makes it theirs is the group it was written under. */
function fmNew(hw, g){
  var e=document.getElementById('fm-'+g), txt=e? String(e.value||'').replace(/^\s+|\s+$/g,'') : '';
  if(!txt){ toast(t('toast.hw2')); return; }
  fmPick(hw, g+'~'+txt);
}
/* What a label is FOR, said as a pop rather than as a page.
   「これ全部横に？つけてどういう役割なのかたとえば英語とか言語で説明できるように
   して」「⭕️？にして少し小さめでポップとして出してほしい。で、文字の横に置いて」

   A row of grammar words is a row of grammar words, and somebody drawing an
   alphabet for a language they invented is not obliged to know what a
   causative is. One line and one example -- 誰かにやらせる形 · 見る → 見させる
   -- and it is gone again, because nobody chose to read a page.

   The mark is beside the word it is about rather than off at the edge, which
   is why the label does not stretch to fill the row.

   Only on the ones we supply. A label somebody wrote themselves is theirs,
   and the app has nothing to say about what it means. */
function fmSay(f){
  if(!f || fmOwn(f)) return;
  toast(t('word.fm.'+f+'.d')+' \u00b7 '+t('word.fm.'+f+'.e'));
}
function fmQ(f){
  if(!f || fmOwn(f)) return '';
  return '<button class="rowq"' + DO('fmSay', [f]) +
    ' aria-label="'+esc(t('help.q'))+'"><span class="qo">?</span></button>';
}
function fmRowHTML(hw, f, on){
  /* `one` because a label is one line where a word is two: an entry sized by
     its contents is 23 points tall here, and a row of a list is something a
     thumb has to land on. */
  return '<div class="entry one'+(on?' on':'')+'">'+
    '<button class="ebody"' + DO('fmPick', [hw, f]) + '>'+
    '<div class="hwrow"><span class="hw">'+esc(fmLabel(f)||t('word.none'))+'</span></div>'+
    '</button>'+fmQ(f)+'<span class="ltck" style="margin-left:auto">'+
    (on? ICON_TICK : '')+'</span></div>';
}
var fmNewG='';
function fmOpen(g){ fmNewG=g; render(); }
function fmGroupHTML(hw, g, now){
  var list=(g==='i'? FM_INF : FM_DER).concat(fmMine(g));
  return secAdd(t('word.fm.'+(g==='i'? 'inf' : 'der')), DO('fmOpen', [g]), t('word.fm.own'))+
    list.map(function(f){ return fmRowHTML(hw, f, f===now); }).join('')+
    (fmNewG===g? '<div class="field" style="margin-top:8px">'+
      '<input id="fm-'+g+'" aria-label="'+esc(t('word.fm.own'))+
      '" autocapitalize="none" autocorrect="off"' + KD('fmNew', [hw, g]) + '></div>' : '');
}
function vFm(){
  var hw=String(here().a||''), w=hw? findWord(hw) : addW, now;
  if(!w) return viewGone();
  now=w.fm||'';
  return '<div class="view">'+navTop()+'<div class="body">'+
    fmRowHTML(hw, '', !now)+
    fmGroupHTML(hw, 'i', now)+
    fmGroupHTML(hw, 'd', now)+
    '</div></div>';
}
/* Fields are typed as one line and held as a list, because searching wants
   the list and typing wants the line. Empty pieces are dropped, so a
   trailing comma is not a field called nothing. */
function tagCut(v){
  var out=[], a=String(v||'').split(/[,、]/), i, x;
  for(i=0;i<a.length;i++){ x=a[i].replace(/^\s+|\s+$/g,''); if(x && out.indexOf(x)<0) out.push(x); }
  return out;
}
/* A day, written the one way that says the same thing in ten languages.
   It is stamped in milliseconds and shown to the day: a word does not need
   to know it was changed at 14:25. */
function wDay(ms){
  var d=new Date(ms||0), p=function(n){ return (n<10?'0':'')+n; };
  return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());
}
/* Part of speech, register, form: three things chosen off a list, and all
   three were a `<select>`, which on a phone is a wheel that slides up from the
   bottom of the screen. 「↓だと蛇腹みたいに広がる感じしない？別ページから選べる
   なら違うマークの方が良くない？」 A `∨` says this box is about to unfold where
   it stands; `›` says you are going somewhere. They go somewhere, so it is the
   settings row the rest of the app already uses -- what it is, what it says
   now, and the mark for a page. */
function wdPickRow(label, val, doAttr){
  return '<button class="set"'+doAttr+'>'+
    '<span class="sl">'+esc(label)+'</span>'+
    '<span class="sv">'+esc(val)+ICON_GO+'</span></button>';
}
function wdRegHTML(){
  return wdPickRow(t('word.reg'), regLabel(wEdit.reg||'')||t('word.none'), DO('go', ["reg"]));
}
/* Choosing one of a short list, ticked, and back. Both lists are the app's own
   -- a part of speech and a register are stored as codes and the label is
   whatever the interface language calls them today. */
function wdOneHTML(label, on, doName, val){
  return '<div class="entry one'+(on?' on':'')+'">'+
    '<button class="ebody"' + DO(doName, [val]) + '>'+
    '<div class="hwrow"><span class="hw">'+esc(label)+'</span></div>'+
    '</button><span class="ltck" style="margin-left:auto">'+(on? ICON_TICK : '')+'</span></div>';
}
function vPos(){
  if(!wEdit) return viewGone();
  return '<div class="view">'+navTop()+'<div class="body">'+
    POS.map(function(k){
      return wdOneHTML(posLabel(k), k===wEdit.pos, 'posPick', k);
    }).join('')+'</div></div>';
}
function posPick(k){ wdSetPos(k); relDirty(); back(); }
function vReg(){
  if(!wEdit) return viewGone();
  return '<div class="view">'+navTop()+'<div class="body">'+
    REG.map(function(r){
      return wdOneHTML(regLabel(r)||t('word.none'), r===(wEdit.reg||''), 'regPick', r);
    }).join('')+'</div></div>';
}
function regPick(r){ wdSetReg(r); relDirty(); back(); }
/* Nothing written inside the box. The heading directly above it already says
   what the box is, and what was in it -- an example of a field, an example of
   an etymology -- was the app filling somebody's answer in for them.
   「四角のなかにつづりとか読みとか書くの消して」 The name stays as aria-label,
   for anybody not looking at the screen. */
function wdTagsHTML(){
  return '<div class="field"><input id="wd-tags" value="'+esc((wEdit.tags||[]).join(', '))+
    '" aria-label="'+esc(t('word.tags'))+'"' + IN('wdSetTags') + '></div>';
}
function wdEtyHTML(){
  return '<div class="field"><textarea id="wd-ety" rows="2" aria-label="'+
    esc(t('word.ety'))+'"' + IN('wdSetEty') + '>'+esc(wEdit.ety||'')+'</textarea></div>';
}
function wdSetReg(v){ wEdit.reg=v; }
function wdSetTags(v){ wEdit.tags=tagCut(v); }
function wdSetEty(v){ wEdit.ety=v; }
/* The sheet a word is written on -- the same one whether the word is in the
   dictionary or is being made. Three things differ, and all three are real:
   a word that does not exist yet cannot be deleted, cannot be shown as a
   picture, and is added rather than saved. Everything else is one screen. */
function wdFormHTML(){
  var seq=wEdit.seq, mk=!!addW;
  /* The field IS the head of the sheet. It used to sit four rows down under
     a heading, with the word repeated above it as text you could not touch,
     so writing a word meant reading it at the top and typing it in the
     middle. 「再生の横から入力できるようにしろ」

     The play button is the icon and nothing else. It said the word for
     "play" beside a triangle, in a row where every other control is a shape.
     「再生って日本語で書くのやめろ」 The name is still there, on the button,
     for anybody not looking at it. */
  return '<div class="whd">'+wdTypeHTML()+
      '<button class="play"' + DO('sayPh', [seq]) + ' aria-label="'+
        esc(t('f.listen'))+'">'+ICON_SPK+'</button>'+
      /* the one way out of the app: this word as a picture, in the letters
         it is written in, for somewhere that is not Lingua */
      (mk? '' : '<button class="usep"' + DO('cardOpen', ["w", openHw]) + ' aria-label="'+
        esc(t('card.title'))+'">'+ICON_SHARE+'</button>')+'</div>'+
    '<div class="wsub" id="wd-rd">'+esc(phIpa(seq))+'</div>'+
    '<div class="wsub2">'+esc(phCut(seq).map(function(p){
        return p.on.join('')+p.nu.join('')+p.co.join(''); }).join('·'))+'</div>'+

    /* A word is TYPED, on both plans. Under this heading were two grids --
       the alphabet, and the sounds -- with a rail to switch between them, so
       the one screen where somebody writes a word offered three ways to write
       it and no reason to prefer any. 「なんで単語のところに変なタップするやつ
       ついてんの？キーボードだけでいいだろ。音と文字二つあるの意味がわからない」

       The keyboard is the way in. A letter's name is what a key types, so the
       field takes a-z from any keyboard on the phone and shows the shapes
       somebody drew; the Lingua keyboard puts the same letters in with the
       shapes on the keys.

       What is left under the field is not input. Free sees what it reads; a
       paid plan sees the word as its letters, and pressing one opens that
       letter's sound in this word -- which is the only thing on this screen
       the keyboard cannot do. */
    (can('snd')? wdSeqHTML() : '')+
    /* Only where a word is being coined. Asking for a spelling to be made up
       for a word that already has one is asking to throw it away. */
    (mk? '<div id="sugwrap">'+sugHTML()+'</div>' : '')+

    secAdd(t('word.means'), DO('wdMnOpen'), t('word.mn.add'))+
    wdMnsHTML()+

    /* What kind of word it is, what it is of the word it came from, and how
       it is said: three lists, one after another, each saying what it is set
       to. They had a heading each over a box each. */
    '<div style="margin-top:22px">'+
      wdPickRow(t('f.pos'), posLabel(wEdit.pos), DO('go', ["pos"]))+
      (wdFrom()? wdFmHTML() : '')+
      wdRegHTML()+
    '</div>'+

    '<div class="sec">'+t('word.tags')+'</div>'+
    wdTagsHTML()+

    '<div class="sec">'+t('word.ety')+'</div>'+
    wdEtyHTML()+

    '<div class="sec">'+t('word.family')+'</div>'+
    wdKidsHTML()+

    '<div class="sec">'+t('word.syn')+'</div>'+
    wdRelHTML('syn')+

    '<div class="sec">'+t('word.ant')+'</div>'+
    wdRelHTML('ant')+

    secAdd(ICON_LINE+t('word.ex'), DO('wdExOpen'), t('word.mn.add'))+
    wdExHTML()+

    '<div class="sec">'+t('word.note')+'</div>'+
    wdNoteHTML()+

    (mk? '' : '<button class="set" style="margin-top:18px;border-bottom:none"' + DO('delWord') + '>'+
      '<span class="sl bad">'+t('word.del')+'</span></button>')+
    /* At the foot of the screen rather than at the foot of the page. It was
       under the meanings, the part of speech, the family, the synonyms, the
       antonyms, the examples and the note -- so saving a word meant scrolling
       past everything the word has. 「保存ボタンつけようもう」 */
    '<div class="barfix"><button class="btn"' + DO(mk? 'addOne' : 'saveWord') + '>'+
      t(mk? 'add.btn' : 'word.save')+'</button></div>';
}
/* ---- a word, read -------------------------------------------------------
   Opening a word used to open its editor: every field live, a Save at the
   foot, the delete button under it. That is the wrong answer to "what does
   this word mean" -- looking a word up is what a dictionary is for and what
   you do with it most of the time, and it was the one thing this screen
   could not do. 「開いた時は閲覧、編集ボタンで編集」

   The button is in the bar, top right, where openForm() puts one -- it was a
   fixed bar across the foot, which is where a screen you WRITE on puts its
   Save and is not what this screen is. 「右上の編集押したら今の編集
   画面に飛べるスタイルにしたい」

   Nothing empty is drawn. A word with no examples has no examples heading:
   on the sheet a heading over nothing is where you put one, and here it is
   just a word about a thing that is not there. */
function wdSecHTML(head, body){
  return body? '<div class="sec">'+head+'</div>'+body : '';
}
function wdChipsHTML(w, k){
  var ws=wRelWords(w,k);
  return ws.length? '<div class="rels">'+ws.map(function(x){
    return '<button class="rel"' + DO('openWord', [x.hw]) + '>'+
      '<span class="relw">'+esc(wOut(x.hw))+'</span>'+
      (wMns(x)[0]? '<span class="relm">'+esc(wMns(x)[0])+'</span>':'')+'</button>';
  }).join('')+'</div>' : '';
}
/* The family, from wherever in it you are standing. 「保存した瞬間そっちの
   単語でも活用とか見れる」 -- a word derived from another used to show its
   parent and nothing else, so from 歩いた you could not see 歩いている. The
   set is the parent's, and it reads the same whichever of its words you
   opened: the parent first, then everything else derived from it, in FM
   order, with the word you are on left out because it is the page.

   Stable within a rank: two words wearing the same label keep the order they
   were made in. */
function wdFamSort(kids){
  var out=kids.slice(), i, j, x;
  for(i=1;i<out.length;i++){
    x=out[i]; j=i-1;
    while(j>=0 && fmRank(out[j].fm||'')>fmRank(x.fm||'')){ out[j+1]=out[j]; j--; }
    out[j+1]=x;
  }
  return out;
}
function wdFamRowHTML(x, fm){
  return '<button class="ntrow"' + DO('openWord', [x.hw]) + '>'+
    '<span class="nth">'+(fm? '<span class="wfm">'+esc(fmLabel(fm))+'</span>' : '')+
      esc(wOut(x.hw))+'</span>'+
    '<span class="ntb">'+esc(wMn(x)||t('sent.nomean'))+'</span></button>';
}
function wdFamHTML(w){
  var par=wParent(w), root=par||w, kids;
  kids=wdFamSort(wKids(root).filter(function(x){ return x!==w; }));
  if(!par && !kids.length) return '';
  return (par? '<button class="ntrow"' + DO('openWord', [par.hw]) + '>'+
            '<span class="nth">'+(w.fm? t('word.fromf', esc(wOut(par.hw)), esc(fmLabel(w.fm)))
                                     : t('word.from', esc(wOut(par.hw))))+'</span>'+
            (wMn(par)? '<span class="ntb">'+esc(wMn(par))+'</span>':'')+'</button>' : '')+
    (kids.length? '<div class="ntlist" style="margin-top:8px">'+kids.map(function(k){
        return wdFamRowHTML(k, k.fm||'');
      }).join('')+'</div>' : '');
}
/* Whether the head of the word page is showing something other than the
   spelling -- a font of the person's own, or a script standing in for one. */
function wdRdShown(w){ return myFontOn() || wOut(w.hw)!==String(w.hw); }
function wdViewHTML(){
  var w=findWord(openHw); if(!w) return viewGone();
  var seq=wPh(w), mns=wMns(w), ex=w.ex||[];
  return '<div class="whd"><span class="whw'+(myFontOn()?' sfont':'')+'">'+esc(wOut(w.hw))+'</span>'+
      '<button class="play" style="margin:0 0 0 auto"' + DO('sayPh', [seq]) +
        ' aria-label="'+esc(t('f.listen'))+'">'+ICON_SPK+'</button>'+
      '<button class="usep"' + DO('cardOpen', ["w", w.hw]) + ' aria-label="'+
        esc(t('card.title'))+'">'+ICON_SHARE+'</button></div>'+
    /* Three lines, and they are three different questions:
       the word in the letters somebody drew, how it is read, and how it
       sounds. 「自作文字 / 読み / ipaもしくは音 じゃないの？」 The middle one is
       drawn only when the top is not already it -- with no font of one's own
       and no script on, `wOut` gives back the spelling itself, and printing it
       twice says nothing. */
    (wdRdShown(w)? '<div class="wrd">'+esc(w.hw)+'</div>' : '')+
    '<div class="wsub">'+esc(phIpa(seq))+'</div>'+
    /* What kind of word it is, and how it is said -- one line, because they
       are one question. An unmarked word says only its part of speech. */
    '<div class="wsub2">'+esc(posLabel(w.pos)+(w.reg? ' \u00b7 '+regLabel(w.reg) : ''))+'</div>'+
    (((w.tags||[]).length)? '<div class="rels">'+w.tags.map(function(x){
       return '<span class="rel"><span class="relw">'+esc(x)+'</span></span>'; }).join('')+'</div>' : '')+
    wdSecHTML(t('word.means'), mns.length
      ? '<div class="mnlist">'+mns.map(function(m,i){
          return '<div class="mnrow"><span class="mnv">'+
            (mns.length>1? '<span class="sn">'+(i+1)+'</span>' : '')+esc(m)+'</span></div>';
        }).join('')+'</div>'
      : '<div class="note">'+esc(t('words.addmn'))+'</div>')+
    wdSecHTML(t('word.family'), wdFamHTML(w))+
    wdSecHTML(t('word.syn'), wdChipsHTML(w,'syn'))+
    wdSecHTML(t('word.ant'), wdChipsHTML(w,'ant'))+
    wdSecHTML(ICON_LINE+t('word.ex'), ex.length
      ? '<div class="exlist">'+ex.map(function(e,i){
          return exRowHTML(e, exSeq(e.ln),
            exBtn('cardOpen', ["x", w.hw+'#'+i], 'card.title', ICON_SHARE));
        }).join('')+'</div>' : '')+
    wdSecHTML(t('word.ety'), w.ety? '<div class="note">'+esc(w.ety)+'</div>' : '')+
    wdSecHTML(t('word.note'), w.nt? '<div class="note">'+esc(w.nt)+'</div>' : '')+
    /* When it was made, and when it last moved -- and the second only when it
       is a different day from the first, because "made today, changed today"
       is one fact written twice. */
    '<div class="wsub2" style="margin-top:18px">'+esc(t('word.made', wDay(w.at))+
      ((w.up && wDay(w.up)!==wDay(w.at))? '  \u00b7  '+t('word.up', wDay(w.up)) : ''))+'</div>';
}
function openWord(hw){
  var w=findWord(hw); if(!w) return;
  openHw=w.hw; addW=null; wEdit=null;
  openForm('word:'+w.hw, wOut(w.hw), '<div id="wd-view">'+wdViewHTML()+'</div>',
           function(){ geTiles(); },
           '<button class="navdo"' + DO('openEdit', [w.hw]) + '>'+t('word.edit')+'</button>');
}
/* The same sheet a new word is written on, opened on one that exists. */
function openEdit(hw){
  var w=findWord(hw); if(!w) return;
  openHw=w.hw; addW=null; wdMnNew=false; wdExNew=false;
  wEdit={seq:wPh(w).slice(), sp:JSON.parse(JSON.stringify(spOf(w))), mns:wMns(w).slice(),
         pos:w.pos, reg:w.reg||'', tags:(w.tags||[]).slice(),
         ety:w.ety||'', nt:w.nt||''};
  openForm('edit:'+w.hw, wOut(w.hw), '<div id="wd-body">'+wdFormHTML()+'</div>',
           function(){ phkMount(); geTiles(); });
}
FORM_OPEN.edit=function(hw){ openEdit(hw); };
FORM_OPEN.word=function(hw){ openWord(hw); };
/* Both keyboards write the same thing: a step in the spelling. A sound
   pressed on the sound keyboard is a step whose letter is whichever letter
   writes it, or none at all if nothing does yet. */
function wdSync(){ wEdit.seq=spPh(wEdit.sp||[]); }
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
   is exactly the case where the letter's own readings are not enough.

   Which position is the route's argument; which LIST is the caller's, and
   that is the whole of the difference between the two screens that use this. */
function spPageHTML(sp, setU, drop){
  var i=parseInt(here().a,10), st=sp[i];
  if(!st) return viewGone();
  var l=ltById(st.l), own=ltUnits(l), mine=addedSnd(), seen={}, opts=[], j;
  for(j=0;j<own.length;j++) if(!seen[own[j]]){ seen[own[j]]=1; opts.push({u:own[j], own:true}); }
  for(j=0;j<mine.length;j++) if(!seen[mine[j]]){ seen[mine[j]]=1; opts.push({u:mine[j], own:false}); }
  return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="spbig">'+ltInk(l, esc(ltName(l)||'\u00b7'))+'</div>'+
    '<div class="phkeys">'+opts.map(function(o){
      return '<button class="phk'+(o.u===spUnit(st)?' on':'')+(o.own?' own':'')+'"' + DO(setU, [i, o.u]) + '>'+
        '<span class="pks">'+esc(o.u)+'</span></button>';
    }).join('')+'</div>'+
    '<button class="btn ghost" style="width:100%;margin-top:16px"' + DO(drop, [i]) + '>'+
      t('word.sp.del')+'</button>'+
    '</div></div>';
}
function vSpell(){
  return spPageHTML((wEdit&&wEdit.sp)||[], 'wdSetU', 'wdDropAt');
}
function wdSetU(i, u){
  if(!wEdit || !wEdit.sp || !wEdit.sp[i]) return;
  spSetU(wEdit.sp[i], u); wdSync(); sayPh(uSplit(u)); back(); wdPaint();
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
/* The four, and the note, written onto a word -- by Save and by Add, which
   is the point: a word made and a word edited end up carrying the same
   things. An empty one of any of them is NOT stored: a key that is always
   there and always blank ends up in every export and every backup.
   `up` is stamped here because here is every time a word changes. */
function wdPutExtras(w){
  if(String(wEdit.nt||'').trim()) w.nt=String(wEdit.nt).trim(); else delete w.nt;
  if(String(wEdit.ety||'').trim()) w.ety=String(wEdit.ety).trim(); else delete w.ety;
  if(wEdit.reg) w.reg=wEdit.reg; else delete w.reg;
  /* `fm` is written where it is chosen, not here. What is here is the one
     thing Save has to hold: a form of nothing is not a form, so a word with
     no parent cannot carry one. */
  if(!w.from) delete w.fm;
  if((wEdit.tags||[]).length) w.tags=wEdit.tags.slice(); else delete w.tags;
  w.up=Date.now();
}
function saveWord(){
  var w=findWord(openHw); if(!w) return;
  var hw=spWord(wEdit.sp||[]);
  if(!(wEdit.sp && wEdit.sp.length) || !hw){ toast(t('toast.hw2')); return; }
  var clash=findWord(hw);
  if(clash && clash!==w){ toast(t('toast.dup')); return; }
  var old=String(w.hw);
  w.hw=hw; delete w.ph;
  w.sp=JSON.parse(JSON.stringify(wEdit.sp));
  w.mns=wEdit.mns.slice(); w.mn=wEdit.mns.length? wEdit.mns[0] : '';
  w.pos=wEdit.pos;
  wdPutExtras(w);
  /* A word that changes is still the same word, so everything pointing at it
     is told its new name rather than left pointing at one that is gone. */
  if(hw!==old) wRename(old, hw);
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

