/* Lingua — the sheet for writing one word, and CSV (chapter 13)
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   13. The sheet for writing a word, and CSV
   ========================================================================= */
var addPos='n';

/* The word suggestions were here, and the conversation was a chapter, and
   both were Studio's under the name `ai`. They are out until Studio is,
   because what Studio sells is the hosted model and the hosted model is the
   last thing going in: a tier that charges for three of something a day and
   then asks for money is a price on an unfinished thing.

   Nothing is deleted, it is lifted -- www/reading.js still has makeWord() and
   www/assist.js still proposes sounds, letters and words everywhere else in
   the app, because those are the app being usable and were never Studio's.
   What went is the metered surface and the tier behind it. */
var addW=null;
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
/* Which grammar slot the draft fills, when it was opened from a stage rather
   than from the dictionary. `count.1`, and empty for every ordinary word.
   phases.js § openSlot sets it; addOne() writes it onto the word. */
var addSlot='';
function openAdd(from){
  /* Adding a word is the second of the four. Asked before the sheet opens,
     so nobody types a word into a form that is going to refuse it. */
  if(!makeNeed()) return;
  /* Reopened by its own redraw and on the way back from the picker, so what
     has been typed is only cleared when the sheet is genuinely new.

     `|| !addW || !wEdit` is the third road and it is not a special case: what
     the route test is FOR is not throwing away what somebody typed, and there
     is nothing to throw away when there is no draft. Arriving AT this route
     with none -- a reload, a deep link, anything that puts the trail back
     before the sheet -- made `here()` say `form:add:<parent>` already, so
     this took the not-fresh branch, left both null, and wdFormHTML() threw
     into vForm's catch: "that is no longer here", about a sheet nobody had
     opened. Empty and broken were sharing a branch. */
  var fresh = !(here().r==='form' && here().a==='add:'+(from||'')) || !addW || !wEdit;
  var par=from? findWord(from) : null;
  addFrom = par? String(par.hw) : '';
  /* A word coined from the dictionary fills no slot. Cleared here rather than
     on the way out of openSlot, because there is no way out of it: a form is
     left by going somewhere else. */
  addSlot='';
  if(fresh){
    openHw='';
      /* The draft holds only what a relation and an example need a WORD for.
       Everything staged -- the spelling, the meanings, the part of speech,
       the register, the fields, the etymology, the note -- is in wEdit, the
       same as when the word already exists. */
    addW={hw:'', mns:[], pos:addPos, syn:[], ant:[], ex:[]};
    wdMnNew=false; wdExNew=false; wdSubNew=false;
    if(addFrom) addW.from=addFrom;
    wEdit={seq:[], sp:(par? JSON.parse(JSON.stringify(spOf(par))) : []),
           mns:[], pos:addPos, sub:'', reg:'', tags:[], ety:'', nt:''};
    addFmClear();
    wdSync();
  }
  if(capStop(1)) return;
  openForm('add:'+addFrom,
    (addFrom? t('add.title.from', addFrom) : t('add.title')),
    '<div id="wd-body">'+wdFormHTML()+'</div>',
    function(){ phkMount(); geTiles(); }, wdSaveBtn());
}
FORM_OPEN.add=function(from){ openAdd(from||''); };
function addOne(){
  /* The word is what was typed, letter by letter -- not the sounds those
     letters happen to read. */
  var sp=(wEdit && wEdit.sp) || [], hw=spWord(sp), d=addW;
  var syn, ant, w, made;
  if(!d) return;
  if(!sp.length || !hw){ toast(t('toast.hw2')); return; }
  /* The word AND the forms going in with it. Asking for room for one and then
     writing four is how a free language ends up over its own limit. */
  addFmSync();
  if(capStop(1+addFms.length)) return;
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
  /* And which slot it fills, so the stage can see that it is done and so
     changing the word later changes it there too. */
  if(addSlot) w.slot=addSlot;
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
  /* And the forms, after the word they are of is in the dictionary: each of
     them points at it by name. */
  made=addFmWrite(hw);
  addFmClear();
  save(); addFrom=''; addSlot='';
  /* Onto the word, read. Everything it holds was written on the way in, so
     what is wanted now is a look at it, not another form. */
  if(here().r==='form') back();
  toast(made? tn('fmr.with', made) : t('toast.added.1', hw));
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
  addFmPaint();
}
/* The reading, and the way to change it. It is proposed -- the letters of
   the word say what it reads, and that is the answer until somebody says
   otherwise -- so this screen states it and goes somewhere else to change it.

   The tiles used to be here. A tile is a LETTER, and picking a letter in
   order to pick a sound is the two directions of the same table on one
   screen: the alphabet already joins a sound to a letter, and this joined a
   letter to a sound four lines under the box the word is typed into.
   「音から文字と文字から音で二重になるから困る」 */
function wdSeqHTML(){
  var sp=wEdit.sp||[];
  if(!sp.length) return '';
  return '<button class="set"' + DO('go', ["spell"]) + '>'+
    '<span class="sl">'+esc(t('word.sp'))+'</span>'+
    '<span class="sv">'+esc(phIpa(spPh(sp)))+ICON_GO+'</span></button>';
}
/* ---- the reading of one word ---------------------------------------------
   A letter has a sound and a word is normally read by running those sounds
   together, which is what the sheet already shows. This page is for the times
   it is not: 「たとえば漣音化とか音が変わる時用」.

   So it is sounds and only sounds. No letter appears on it -- the alphabet
   joins a sound to a letter and this is the other direction, and having both
   in front of somebody at once is the thing that made no sense
   「音から文字と文字から音で二重になるから困る」. A reading cannot be typed either:
   theta is not on anybody's keyboard, and a sound nobody can hear is not a
   sound. It is chosen, off tiles, and every press says it out loud. */
/* Appended to the reading, and said. The positions of the word do not move:
   wdSetRd hands the sounds back to them in order. */
function spAdd(sym){
  wdSetRd(spPh((wEdit&&wEdit.sp)||[]).join('')+sym); sayOne(sym);
}
function vSpell(){
  var sp=(wEdit&&wEdit.sp)||[];
  return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="whd"><span class="whw'+(myFontOn()? ' sfont':'')+'">'+
      esc(spWord(sp))+'</span>'+
      '<button class="play"' + DO('sayPh', [spPh(sp)]) + ' aria-label="'+
        esc(t('f.listen'))+'">'+ICON_SPK+'</button></div>'+
    '<div class="wsub">'+esc(phIpa(spPh(sp)))+'</div>'+
    ipaPickHTML('spAdd', [])+
    '</div></div>';
}
/* The field is there when there is nothing yet, and the `+` on the heading is
   for the SECOND one onwards -- 「追加した後意味が1つ目から+ボタン押さないと
   いけない」 OWNER 2026-09-05. Once pressed it stays for the rest of the sheet,
   so a word with five meanings is five presses of Enter and not five of
   anything else. wdMnShow()/wdExShow() are the one place each answers it. */
var wdMnNew=false, wdExNew=false;
function wdMnOpen(){ wdMnNew=true; wdPaint(); }
function wdExOpen(){ wdExNew=true; wdPaint(); }
function wdMnShow(){ return wdMnNew || !(wEdit && wEdit.mns && wEdit.mns.length); }
function wdExShow(){ var w=wdW(); return wdExNew || !(w && w.ex && w.ex.length); }
function wdMnsHTML(){
  var rows=wEdit.mns.map(function(m,i){
    return '<div class="mnrow"><span class="mnv">'+esc(m)+'</span>'+
      '<button class="mnx"' + DO('wdDelMn', [i]) + ' aria-label="'+esc(t('word.mn.del'))+'">'+ICON_CROSS+'</button></div>';
  }).join('');
  return '<div class="mnlist">'+rows+'</div>'+
    (wdMnShow()? '<div class="mnadd">'+
      lnField('wd-mn', '', ' aria-label="'+esc(t('word.means'))+'"' + KD('wdAddMn'), '')+
      '</div>' : '');
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
/* The line, one word at a time, because a word this dictionary does not have
   is not the same thing as one it does.

   docs/FEATURES.md decided both halves: a word there is no word for "stays in
   the natural language" and "is shown IN RED, so the gap is obvious -- and it
   is also the door to making that word". The first half has always been true
   here and nothing said so: the line went into one span, so a word nobody has
   made looked exactly like a word somebody had. With SET.myfont on it is
   worse than a missing colour -- `rice`, which is not in the dictionary, is
   drawn in the same letters somebody drew for `tir`, which is.

   The words asked about are the ones exSeq() and exGloss() ask about, split
   the same way, so the three cannot come to different answers about what a
   word is. The gaps between them are kept exactly as they were typed.

   This is the wearing side only. There is no colour here -- www/index.html is
   another session's file and one line of CSS belongs in it. Until it lands
   this changes nothing anybody can see, which is the right way round: a rule
   in the stylesheet with nothing wearing it is a rule the dead-CSS check has
   to be told about. */
function exLnHTML(ln){
  var ps=String(ln||'').split(/(\s+)/), out=[], i, w;
  for(i=0;i<ps.length;i++){
    w=ps[i];
    if(!w) continue;
    if(!w.replace(/^\s+|\s+$/g,'') || findWord(w)) out.push(esc(w));
    else out.push('<span class="exnew">'+esc(w)+'</span>');
  }
  return out.join('');
}
function exRowHTML(e, seq, tail){
  return '<div class="exrow">'+
    '<div class="exb">'+
      (e.lb? '<span class="exlb">'+esc(e.lb)+'</span>' : '')+
      '<span class="exl'+(myFontOn()?' sfont':'')+'">'+exLnHTML(e.ln)+'</span>'+
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
    (wdExShow()? '<div class="exadd">'+
      lnField('wd-exl', exHint(), KD('wdAddEx'), '')+
      lnField('wd-exg', '', ' aria-label="'+esc(t('word.ex.gl.ph'))+'"' + KD('wdAddEx'), '')+
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
  return '<div class="view">'+navTop()+'<div class="body">'+
    /* A word that means the same as this one is very often a word that does
       not exist yet -- that is WHY it is being written -- and the picker
       offered the dictionary and nothing else, so the answer to "what means
       the same as this" was "nothing, go and make one first, then come back
       here and find it". 「その場で類義語とか対義語を作れるようにすればいいやん」
       So it is made here, and joined here, in one press. */
    '<div class="sec">'+t('home.write')+'</div>'+
    '<div class="row2"><div class="field">'+
      lnField('rel-hw', t('f.spelling'), ' autocapitalize="none"', '')+'</div>'+
    '<div class="field">'+
      lnField('rel-mn', t('f.meaning.ph'), '', '')+'</div></div>'+
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
    if(capStop(1)) return;
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
  /* The sheet is repainted and the bar is not, so the button in the corner is
     brought with it -- letters go onto the spelling here and nowhere else.
     www/shell.js § navDo. */
  navDoPaint('addOne', wdAddOn());
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
/* `plp` is the pluperfect and is the newest of them -- 「過去完了は何かの説明を
   ?に入れてくれ」 OWNER 2026-09-05. It is added at the END of the ones it
   follows rather than beside `pst`, because fmRank() reads a form's place in
   this list as the order a word's family is read in, and moving one moves
   every word already wearing the ones after it. */
var FM_INF=['pst','prs','fut','prg','prf','plp','neg','imp','que','cnd','cau','pas','pl'];
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
    '<div class="hwrow"><span class="hwl">'+esc(fmLabel(f)||t('word.none'))+'</span></div>'+
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
      lnField('fm-'+g, '',
        ' aria-label="'+esc(t('word.fm.own'))+'" autocapitalize="none"' +
        KD('fmNew', [hw, g]), '')+'</div>' : '');
}
/* ---- forms made by a rule ------------------------------------------------
   Registering a past tense makes it a word, which is right and which is also
   why a dictionary of any size could not be built here: a verb with four
   forms is four trips through the sheet, and a language with six cases and
   two numbers is twelve. That is the work Lexurgy and PolyGlot do for people
   and this did not, and it is the whole of the reason a serious dictionary
   went somewhere else.

   A rule says: for words of this part of speech, the PAST is the word with
   these letters on the end. Write it once, and any word can be asked for the
   forms it has not got.

   It is deliberately NOT a paradigm, for the reason the note above this
   section already gives: 「型決めても英語みたいに変わってる可能性もあるやん」.
   A rule does not declare that every verb HAS a past tense, it does not go
   and make them, and it does not own the words it made. What it does is
   offer: press the button on a word and the forms appear as ordinary words,
   each editable and deletable like any other. go/went is still typed by hand,
   and typing it by hand is not working around the rule -- it is the rule not
   applying, which is what an irregular is. */
function fmRules(){ if(!STG.fm) STG.fm=[]; return STG.fm; }
function fmrById(id){
  var a=fmRules(), i;
  for(i=0;i<a.length;i++) if(a[i].id===String(id)) return a[i];
  return null;
}
/* The word the rule works on: its spelling, less however many letters the
   rule takes off the end first. Never all of them -- a rule that ate the word
   would make every verb the same form of itself. */
function fmrStem(w, r){
  var sp=spOf(w).slice(), n=Math.max(0, Math.min(sp.length-1, (r && r.drop)||0));
  return n? sp.slice(0, sp.length-n) : sp;
}
/* Whether this rule has anything to say about this word. `when` is the one
   piece of phonology in it: an ending that only goes on after a vowel is the
   commonest thing a language does to keep two consonants apart. */
/* Whether the WORD ends in the letters this rule is about -- which is what
   somebody means by "y becomes i and then ed". Asked of the word and not of
   the stem: `drop` is what happens NEXT, and the y being tested for is the y
   about to be dropped.

   Compared as written rather than unit by unit, because two spellings that
   come out the same word ARE the same ending however they were typed. */
function fmrEndsWith(w, r){
  var e=(r && r.wend)||[], s, hw;
  if(!e.length) return false;
  s=spWord(e);
  hw=String((w && w.hw)||'');
  if(!s.length || hw.length<s.length) return false;
  return hw.slice(hw.length-s.length)===s;
}
/* Whether this rule has anything to say about this word. `when` is the one
   piece of phonology in it: an ending that only goes on after a vowel is the
   commonest thing a language does to keep two consonants apart. And `x` is
   the other kind of condition, which is not phonology at all -- these exact
   letters at the end. 「英語みたいにyで終わるのはiに変えてedみたいな細かいルール
   設定はできないの？」 carry: ends in y, drop 1, add ied. */
function fmrFits(w, r){
  var ph, last;
  if(!w || !r || !(r.add||[]).length) return false;
  if(r.pos && r.pos!==w.pos) return false;
  if(!r.when) return true;
  if(r.when==='x') return fmrEndsWith(w, r);
  ph=spPh(fmrStem(w, r));
  if(!ph.length) return false;
  last=ph[ph.length-1];
  return (r.when==='v')? ipaIsVowel(last) : !ipaIsVowel(last);
}
/* What the rule would make: a spelling, and the word that spelling is. */
function fmrMake(w, r){
  var stem, add, sp, hw;
  if(!fmrFits(w, r)) return null;
  stem=fmrStem(w, r); add=(r.add||[]).slice();
  sp=(r.at==='start')? add.concat(stem) : stem.concat(add);
  hw=spWord(sp);
  if(!hw || hw===String(w.hw)) return null;
  return {id:r.id, fm:r.fm, sp:sp, hw:hw};
}
/* The forms this word has not got. A rule is skipped when the word already
   wears that label -- an irregular past that was typed by hand is the past,
   and offering to make a second one beside it would be the app arguing with
   the person about their own language. */
function fmrTodo(w){
  var a=fmRules(), kids=w? wKids(w) : [], out=[], i, j, m, has;
  for(i=0;i<a.length;i++){
    m=fmrMake(w, a[i]);
    if(!m || findWord(m.hw)) continue;
    has=false;
    for(j=0;j<kids.length;j++) if((kids[j].fm||'')===String(m.fm||'')) has=true;
    if(has) continue;
    out.push(m);
  }
  return out;
}
/* WHAT A FORM IS, and it is one place. This was written out three times --
   in fmrAdd(), in fmrAddAll() and in addFmWrite() -- and the third one's
   comment said "made the way fmrAdd() makes one", which nothing held. A word
   is what it has ON it, so adding anything to a form meant finding all three.

   An inflection takes the meanings of the word it is a form of -- a past
   tense is still the verb. A derivation takes none: "one who wakes early" is
   a different word that happens to be built out of this one, and filling in
   the parent's meaning there would be the app claiming to know what somebody's
   word means. It comes out with no meaning, and the half-done list on the
   search tab is already the screen that says so.

   Nothing marks it as having been made by a rule, because nothing about it is
   different from a word somebody typed. */
function fmrWord(w, m){
  var nw={hw:m.hw, pos:w.pos, at:Date.now(), from:String(w.hw), fm:m.fm,
          sp:JSON.parse(JSON.stringify(m.sp)),
          mns:(fmGroup(m.fm)==='i')? wMns(w).slice() : []};
  nw.mn=nw.mns[0]||'';
  return nw;
}
/* Making them, for one word. What a form IS is fmrWord() above; this is the
   list of them, the room for them, and the word's page again afterwards. */
function fmrAdd(hw){
  var w=findWord(hw), todo=w? fmrTodo(w) : [], i, m, nw, made=[];
  if(!w || !todo.length) return;
  if(capStop(todo.length)) return;
  for(i=0;i<todo.length;i++){
    m=todo[i];
    if(findWord(m.hw)) continue;
    nw=fmrWord(w, m);
    WORDS.push(nw); made.push(m.hw);
  }
  if(!made.length) return;
  save();
  /* The word's page again, not merely a redraw. It is a form, and a form
     holds the html it was opened with -- so what the button did would have
     stayed invisible under the button, which would go on offering to do it.
     Opening it again is what addOne() does after writing a word, for the
     same reason. */
  toast(tn('fmr.made', made.length));
  openWord(String(w.hw));
}
/* Every form the rules can make, across the whole dictionary. A rule is
   written once and is meant to answer for the language, not for the word you
   happen to be standing on -- making them one word at a time is the same
   press repeated as many times as there are words.

   A snapshot of WORDS at the moment it is asked, so a word a rule makes is
   not immediately fed back into the rules: making the past of a past is not
   what anybody wrote a rule for, and it would not stop. */
function fmrTodoAll(){
  var out=[], seen={}, list=WORDS.slice(), i, j, todo;
  for(i=0;i<list.length;i++){
    todo=fmrTodo(list[i]);
    for(j=0;j<todo.length;j++){
      if(seen[todo[j].hw]) continue;
      seen[todo[j].hw]=1;
      out.push({w:list[i], m:todo[j]});
    }
  }
  return out;
}
/* Making all of them. The same word fmrAdd writes, because both ask
   fmrWord(). What is left different is the end: fmrAdd opens the word's page
   afterwards and this one has no word to go back to.

   Every word the rules would make, or every word ONE KIND of rule would make.
   A chapter of the grammar page asks for its own -- 「その章のページへ」 -- and
   being on the verbs and having it make a noun's plurals would be the button
   doing more than the page it is on says. Asked for with no kind, it is
   everything, which is what it always was. */
function fmrAddAll(pos, fms){
  var all=fmrTodoAll(), i, w, m, nw, made=0;
  if(pos) all=all.filter(function(x){
    return String(x.w.pos)===String(pos) &&
           (!fms || !fms.length || fms.indexOf(String(x.m.fm))>=0);
  });
  if(!all.length) return;
  if(capStop(all.length)) return;
  for(i=0;i<all.length;i++){
    w=all[i].w; m=all[i].m;
    if(findWord(m.hw)) continue;
    nw=fmrWord(w, m);
    WORDS.push(nw); made++;
  }
  if(!made) return;
  save();
  toast(tn('fmr.made', made));
  render();
}
/* The row on a word's page. Only when there is something to make: a button
   that does nothing when pressed is worse than no button. */
function fmrTodoHTML(w){
  var todo=fmrTodo(w);
  if(!todo.length) return '';
  return '<button class="btn ghost" style="width:100%;margin-top:10px"' +
    DO('fmrAdd', [String(w.hw)]) + '>'+ICON_ADD+
    esc(tn('fmr.todo', todo.length))+'</button>';
}

/* ---- the forms on the sheet the word is coined on ------------------------
   A rule was only ever spent after the fact. The word went in, and then its
   page offered to make the forms it had not got, or the rules screen offered
   to make every one of them across the whole dictionary -- both of which are
   going back for something you were holding a moment ago.

   So the rules are spent where the word is written. Type a spelling and every
   rule that fits shows what it makes, spelled out; the row can be typed over
   or taken off; Add writes what is left. 「保存したら出る。消してたら消す。」

   Three things this remembers, and they are all about the sheet rather than
   about the language, so all three go when the sheet closes:

   `addFmEd` -- a form somebody typed over. It wins from then on: changing the
   head re-spells only the rows nobody has touched, because a rule is a way of
   saving typing and not an opinion about the word.
   「あくまで規則は作るのを楽にするためのツール」

   `addFmOff` -- a row taken off. It stays off even if the head is retyped
   into something the rule fits again: it was answered once.

   Nothing here deletes. The minus is on a word that does not exist yet. */
var addFms=[], addFmEd={}, addFmOff={};
function addFmClear(){ addFms=[]; addFmEd={}; addFmOff={}; }
/* The draft as a word, which is all fmrMake() ever wanted of one. */
function addFmDraft(){
  var sp=(wEdit && wEdit.sp) || [];
  return {hw:spWord(sp), sp:sp, pos:(wEdit && wEdit.pos) || ''};
}
function addFmSync(){
  var a=fmRules(), w=addFmDraft(), i, m;
  addFms=[];
  if(!addW || !w.hw || !w.sp.length) return;
  for(i=0;i<a.length;i++){
    if(addFmOff[a[i].id]) continue;
    m=fmrMake(w, a[i]);
    if(!m) continue;
    /* Typed over: the letters are the person's, and the headword is those
       letters rather than the ones the rule would have put there. */
    if(addFmEd[a[i].id]){
      m.sp=addFmEd[a[i].id];
      m.hw=spWord(m.sp);
    }
    if(!m.hw) continue;
    addFms.push(m);
  }
}
/* Its own node, so the head field can be typed into without the sheet being
   rebuilt under the thumb: what changes as somebody types is this block and
   nothing else. */
function addFmBoxHTML(){ return '<div id="wd-fms">'+addFmHTML()+'</div>'; }
function addFmPaint(){
  var e=document.getElementById('wd-fms');
  if(!e) return;
  e.outerHTML=addFmBoxHTML();
  lnGrowAll();
}
function addFmHTML(){
  addFmSync();
  if(!addFms.length) return '';
  return '<div class="sec">'+esc(t('fmr.title'))+'</div>'+
    '<div class="fmmks">'+addFms.map(function(m){
      return '<div class="fmmk"><span class="fmmkf">'+esc(fmLabel(m.fm))+'</span>'+
        lnField('fmmk-'+m.id, '', IN('addFmSet', [m.id]), m.hw,
                'whin'+(myFontOn()? ' tfont' : ''))+
        '<button class="mnx"' + DO('addFmDrop', [m.id]) + ' aria-label="'+
          esc(t('fmr.off'))+'">'+ICON_MINUS+'</button></div>';
    }).join('')+'</div>';
}
function addFmSet(id, v){
  addFmEd[String(id)]=spType(v);
  lnGrow('fmmk-'+id);
}
function addFmDrop(id){
  addFmOff[String(id)]=1;
  delete addFmEd[String(id)];
  addFmPaint();
}
/* Written when the word is. Each is fmrWord() -- the same form fmrAdd() and
   fmrAddAll() write. A form whose spelling is already a word in the
   dictionary is skipped rather than overwriting it: two words cannot share a
   headword, and the one already there is the one somebody wrote. */
function addFmWrite(hw){
  var par=findWord(hw), i, m, nw, made=0;
  if(!par) return 0;
  for(i=0;i<addFms.length;i++){
    m=addFms[i];
    if(!m.hw || findWord(m.hw)) continue;
    nw=fmrWord(par, m);
    WORDS.push(nw); made++;
  }
  return made;
}

/* ---- writing one -------------------------------------------------------- */
var fmrOpen='';
/* A new rule, of a kind the caller already knows. It used to be able to make
   only one kind -- a verb's past -- and the two screens that could then change
   the part of speech and the form were how you got any other. A chapter of the
   grammar page knows both before the button is pressed, so it says them here
   and those two screens have nothing left to ask. */
function fmrNew(pos, fm){
  var r={id:'fr'+Date.now()+String(fmRules().length), pos:pos||'v', fm:fm||'pst',
         at:'end', drop:0, add:[], when:''};
  fmRules().push(r); saveStg(); openFmr(r.id);
}
/* Asked before it happens, in the app's own popup -- `confirm()` is banned by
   name. The row it is asked from is the rule's own row in its chapter, so
   there is no question about which one is going. */
function fmrAsk(id){
  var r=fmrById(id);
  if(!r) return;
  popAsk(t('fmr.del'), function(){ fmrDel(id); });
}
function fmrDel(id){
  var a=fmRules(), i;
  for(i=0;i<a.length;i++) if(a[i].id===String(id)){ a.splice(i,1); break; }
  saveStg();
  if(here().r==='form') back(); else render();
}
function fmrSegs(now, list, fn){
  var i, out='<div class="pick">';
  for(i=0;i<list.length;i++)
    out+='<button class="'+(String(list[i][0])===String(now)? 'on':'')+'"' +
      DO(fn, [list[i][0]]) + '>'+esc(list[i][1])+'</button>';
  return out+'</div>';
}
/* WHAT A RULE IS, and it is two things.
   「最初は文字追加とかだけのシンプルな画面でいいよ。削るとか色んなのつけると
   ごちゃごちゃする。今後の機能追加でやる。」 OWNER 2026-09-05.

   The letters it adds, and which end of the word they go on. That is the whole
   screen. It used to carry four more -- how many letters to drop first, and a
   condition of always / after a vowel / after a consonant / ends in these
   letters, with a second field appearing under the last of them -- and every
   one of those is a question somebody has to answer before they can write down
   「past is -ka」.

   **NOTHING SOMEBODY WROTE IS DROPPED.** `drop`, `when` and `wend` are still on
   the rules that carry them, gFmDrop() and gFmCond() in www/grammar.js still
   hand them to the engine, and fmrFits()/fmrStem() still obey them -- so a rule
   written on the old screen goes on working exactly as it did. What is gone is
   the way to write a NEW one, which is the thing that was in the way.

   The way OUT is gone from here too: a rule is deleted from the row it is on,
   in the list its chapter draws, which is where every other list in this app
   deletes from. */
function fmrFormHTML(){
  var r=fmrById(fmrOpen);
  if(!r) return '';
  return '<div id="fmr-body">'+
    '<div class="sec">'+esc(t('fmr.add'))+'</div>'+
    spTypeField('fmr-add', 'fmrSetAdd', r.add||[], 'whin')+
    fmrSegs(r.at||'end', [['end', t('fmr.end')], ['start', t('fmr.start')]], 'fmrSetAt')+
    '</div>';
}
function fmrPaint(){
  var e=document.getElementById('fmr-body');
  if(e) e.outerHTML=fmrFormHTML();
}
function openFmr(id){
  var r=fmrById(id);
  if(!r) return;
  fmrOpen=String(id);
  openForm('fmr:'+fmrOpen, t('fmr.title'), fmrFormHTML());
}
FORM_OPEN.fmr=function(id){ openFmr(id||''); };
function fmrKeep(fn){
  var r=fmrById(fmrOpen);
  if(!r) return;
  fn(r); saveStg();
}
function fmrSetAdd(v){ fmrKeep(function(r){ r.add=spType(v); }); lnGrow('fmr-add'); }
function fmrSetAt(v){ fmrKeep(function(r){ r.at=(v==='start')? 'start':'end'; }); fmrPaint(); }
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
/* When, written the one way that says the same thing in ten languages.
   To the minute: a dictionary is built over months and the order two words
   were made in on the same afternoon is part of how it grew. */
function wWhen(ms){
  var d=new Date(ms||0), p=function(n){ return (n<10?'0':'')+n; };
  return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+
         ' '+p(d.getHours())+':'+p(d.getMinutes());
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
    /* `hwl` and not `hw`. A headword is a word of the person's LANGUAGE and
       wears the letters they drew; what is on this row is the app's own word
       for a part of speech or a register. Wearing the same class meant the
       list of parts of speech came out in a script nobody can read.
       「自作文字になるのは自分が打った文字だけにしてくれない？」 */
    '<div class="hwrow"><span class="hwl">'+esc(label)+'</span></div>'+
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
/* ---- and the one the person made themselves ----------------------------
   OWNER 2026-09-05: the thirteen stay the thirteen and a subclass goes under
   one of them. www/shell.js § subsOf() is what a subclass IS -- what words
   are already in -- so this screen is that list and a box to write one that
   is not on it yet.

   It is a form and not a route, which is what posPick's screen would be if it
   were written today: the list is one press deep, it is built from the
   dictionary rather than from anything stored, and a route would be a second
   place saying that a word has a subclass.

   The subclasses OF THIS PART OF SPEECH and no others. 動詞 → 自動詞 is not
   an answer about a noun, and one list holding every subclass in the language
   is the row of chips CLAUDE.md forbids wearing a list's clothes. */
function wdSubHTML(){
  return wdPickRow(t('f.sub'), wEdit.sub || t('f.sub.none'), DO('openSub'));
}
/* THE SUBCLASSES THIS APP ALREADY KNOWS THE NAMES OF, one part of speech at a
   time. 「下位分類の中身も結構書いていいよ」 OWNER 2026-09-05. The screen used
   to be `subsOf()` alone -- what the words of this language are ALREADY in --
   so a dictionary with no subclass in it offered an empty list and a box, and
   the only way to say 他動詞 was to type it.

   What is stored is still the WORDS, not a key: `sub` is free text, it arrives
   that way out of a CSV, and 「what a language calls a thing is its own」. A
   row here is a name offered, and pressing it writes that name down.

   The parts of speech not on this list -- 感動詞, 接辞, 固有名詞, イディオム,
   その他 -- have no names anybody supplied, and inventing some here would be
   the app deciding something about somebody's language. They get the list this
   screen always had: what their own words are in, and the way to write one. */
var SUB_DEF={
  v:   ['vi','vt','aux','cop'],
  n:   ['com','prop','coll','mass','abst'],
  adj: ['qual','stat','quant'],
  adv: ['man','deg','time','place','freq'],
  pro: ['pers','dem','int','indef'],
  num: ['card','ord'],
  conj:['co','sub'],
  part:['case','fin','top']
};
/* The names offered for one part of speech: the ones this app knows, then the
   ones this language is already using that are not among them. One list and no
   row twice -- a language that has typed 他動詞 by hand must not be shown it
   twice the day the defaults arrive. */
function subList(pos){
  var a=SUB_DEF[pos]||[], out=[], used=subsOf(pos), i, x;
  for(i=0;i<a.length;i++) out.push(t('f.sub.d.'+pos+'.'+a[i]));
  for(i=0;i<used.length;i++){ x=used[i]; if(out.indexOf(x)<0) out.push(x); }
  return out;
}
/* The box is behind the ＋ and nothing else opens it. 「追加は+〇にして勝手に
   新しいの作らないで」「欄に打っただけでは登録しない」 OWNER 2026-09-05: the
   field used to be on the screen from the moment it opened, under a heading,
   which reads as 「write one」 rather than 「pick one」 -- and what was typed
   into it and not confirmed was a subclass somebody believed they had made.
   Enter on the box is still the only thing that makes one. */
var wdSubNew=false;
function subNewOpen(){ wdSubNew=true; openSub(); }
function subAddRow(){
  return '<div class="entry one"><button class="ebody"' + DO('subNewOpen') + '>'+
    '<div class="hwrow"><span class="hwl">'+ICON_ADD+esc(t('f.sub.new'))+
    '</span></div></button><span class="ltck" style="margin-left:auto"></span></div>';
}
function openSub(){
  var subs=subList(wEdit? wEdit.pos : ''), now=(wEdit && wEdit.sub) || '';
  openForm('wsub', t('f.sub'),
    /* "None" is a row like the others and is ticked when there is none, so
       taking a subclass off is the same press as putting one on. */
    wdOneHTML(t('f.sub.none'), !now, 'subPick', '')+
    subs.map(function(x){
      return wdOneHTML(x, x===now, 'subPick', x);
    }).join('')+
    (wdSubNew
      ? '<div class="field">'+
          lnField('wd-sub', '', ' aria-label="'+esc(t('f.sub.new'))+'"'+
                  KD('subNew'), '')+'</div>'
      : subAddRow()));
}
FORM_OPEN.wsub=function(){ openSub(); };
function subPick(x){ wdSetSub(x); relDirty(); back(); }
/* Enter on the box is what makes one. There is no button beside it: a name
   typed and not pressed is a subclass somebody believes they made, and Enter
   is what every other one-line box on this sheet already answers to. */
function subNew(){
  var el=document.getElementById('wd-sub'), x;
  if(!el) return;
  x=String(el.value||'').trim();
  if(!x) return;
  wdSetSub(x); relDirty(); back();
}
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
  /* Tags are a list run together with commas, so this is the field most
     likely to be long, and it was the one that scrolled off the side. */
  return '<div class="field">'+
    lnField('wd-tags', '', ' aria-label="'+esc(t('word.tags'))+'"' + IN('wdSetTags'),
      (wEdit.tags||[]).join(', '))+'</div>';
}
function wdEtyHTML(){
  return '<div class="field"><textarea id="wd-ety" rows="2" aria-label="'+
    esc(t('word.ety'))+'"' + IN('wdSetEty') + '>'+esc(wEdit.ety||'')+'</textarea></div>';
}
function wdSetReg(v){ wEdit.reg=v; }
function wdSetTags(v){ wEdit.tags=tagCut(v); lnGrow('wd-tags'); wdKeepTouch(); }
function wdSetEty(v){ wEdit.ety=v; wdKeepTouch(); }
/* The sheet a word is written on -- the same one whether the word is in the
   dictionary or is being made. Three things differ, and all three are real:
   a word that does not exist yet cannot be deleted, cannot be shown as a
   picture, and is added rather than saved. Everything else is one screen. */
function wdFormHTML(){
  var seq=wEdit.seq, mk=!!addW;
  /* And this is where the sheet says what it now holds. www/shell.js § KEEP
     and wdKeepOn() below -- it is here rather than in openEdit() because this
     is the function that is run again every time anything on the sheet moves
     (relDirty), so it is the one place that is true about the sheet AS IT IS
     rather than as it was opened. */
  if(!mk) wdKeepOn();
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

    secAdd(t('word.means'), DO('wdMnOpen'), t('word.mn.add'))+
    wdMnsHTML()+

    /* What kind of word it is, what it is of the word it came from, and how
       it is said: three lists, one after another, each saying what it is set
       to. They had a heading each over a box each. */
    '<div style="margin-top:22px">'+
      wdPickRow(t('f.pos'), posLabel(wEdit.pos), DO('go', ["pos"]))+
      wdSubHTML()+
      (wdFrom()? wdFmHTML() : '')+
      wdRegHTML()+
    '</div>'+

    /* The forms the rules make of it, where a word is coined and nowhere
       else. A word that already exists has its forms already, and re-spelling
       them under it would be the app arguing about a language it did not
       write. 「あくまで追加したとき」 */
    (mk? addFmBoxHTML() : '')+

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

    /* Delete is the LAST thing on the page and Save is in the bar, top right,
       which is what an iPhone does with a form.
       「編集画面もセーブは右上にして欲しい。一番下がデリートになるように」 OWNER 2026-09-01.

       Save was a fixed bar across the foot, so the destructive row sat ABOVE
       the ordinary one and the thing you press most had a bar of its own over
       the last of the word. The bar the sheet already has is where it goes --
       `openForm`'s sixth argument, the same slot the read page's 編集 is in --
       so nothing new was invented for it. Nothing else on the sheet moves. */
    (mk? '' : '<button class="set" style="margin-top:18px;border-bottom:none"' + DO('delWord') + '>'+
      '<span class="sl bad">'+t('word.del')+'</span></button>');
}
/* The button the sheet that MAKES a word carries. Adding is not saving: there
   is nothing yet to have changed, and addOne() can refuse the word outright
   (no spelling, a spelling somebody already has), so it is a press and not the
   button www/shell.js § KEEP draws. The sheet that CHANGES a word has no
   button of its own any more -- see wdKeepOn(). */
/* What addOne() would refuse, asked before it is pressed. The button says the
   same thing the press says: a sheet with no spelling on it has no word to
   add. 「なにもない時は薄い灰色、何か打ったら金にする」 OWNER 2026-09-03,
   www/shell.js § navDo. */
function wdAddOn(){
  var sp=(wEdit && wEdit.sp) || [];
  return !!(sp.length && spWord(sp));
}
function wdSaveBtn(){
  return navDo(t('add.btn'), 'addOne', null, wdAddOn());
}
/* ---- the word sheet, and what "changed" means on it ---------------------
   OWNER DECISION 2026-09-03 -- www/shell.js § KEEP. This sheet already had the
   shape the owner asked for and had had it since 「保存ボタンつけようもう。
   単語作るのにも、文字作るのにも」: wEdit is what is being typed, and Save is
   what writes it. Two things were missing, and they are the two the decision
   is about -- the button stood there whether or not anything had been
   touched, and the back arrow threw everything typed away without a word.

   SO wEdit STAYS AND IS NOT COPIED. A spelling is a list of positions and a
   word has as many meanings as somebody gives it; flattening that into a
   handful of strings to put in the screen buffer would be the sheet written
   down twice, and the two would drift. What goes in the buffer is the sheet
   SAID ONCE -- one value, the sheet's whole content -- and "has anything
   changed" is those two values compared. The answer comes off wEdit, which is
   the thing that actually holds it.

   `mn` is not in the signature: it is the first meaning, written from `mns` by
   saveWord(), so it would be the same fact counted twice. */
function wdSig(sp, mns, pos, sub, reg, tags, ety, nt){
  return JSON.stringify([sp||[], mns||[], pos||'', String(sub||''), reg||'',
                         tags||[], String(ety||''), String(nt||'')]);
}
function wdSigEdit(){
  return wdSig(wEdit.sp, wEdit.mns, wEdit.pos, wEdit.sub, wEdit.reg,
               wEdit.tags, wEdit.ety, wEdit.nt);
}
function wdSigWord(w){
  return wdSig(spOf(w), wMns(w), w.pos, subOf(w), w.reg||'',
               (w.tags||[]).slice(), w.ety||'', w.nt||'');
}
function wdKeepOn(){
  if(!wEdit || !openHw || addW || langLocked()) return;
  keepOn(keepKeyOf('form', 'edit:'+openHw), {w:wdSigOpen},
         function(v, done){ done(wdWrite()); });
  wdKeepTouch();
}
/* The sheet, said again into the buffer. Two roads reach it and they are two
   because one is not enough: the sheet being BUILT (wdKeepOn above, through
   relDirty), and a field being TYPED into -- which does not rebuild the sheet
   and must not, because a field being typed into loses the keyboard the
   moment the page under it is replaced. Without the second, the Save in the
   bar would not appear until something else redrew the screen. */
function wdKeepTouch(){
  if(!wEdit || !openHw || addW || langLocked()) return;
  keepPut(keepKeyOf('form', 'edit:'+openHw), 'w', wdSigEdit());
}
/* What the word was when the sheet was opened. Taken there and nowhere else:
   it is the mark everything after it is measured from, and a mark taken again
   later is a mark that has moved. */
var wdSigOpen='';
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
/* What means the same and what means the opposite, on the read page. They
   were chips -- a bordered box each, wrapping across the column -- and so was
   the family above them, so a word page was four kinds of boxed thing in a
   row. One row shape for all of it: `wdRowHTML`. The chips stay on the sheet
   where the two lists are assembled, because there a box is a thing you take
   back off. */
function wdRelsHTML(w, k){
  var ws=wRelWords(w,k);
  return ws.length? '<div class="wdrows">'+ws.map(function(x){
    return wdRowHTML(x, '');
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
/* One word of the family: what it is called, the word, what it means. A row
   and not a card -- these were the notices row, which is a framed box with
   the word on one line and the meaning under it, and four of them stacked
   made the middle of a word page look like something to be worked on rather
   than something to read. 「その四角で加工系やめない？」 Pressing it opens that
   word, which is the whole reason the family is here. */
function wdRowHTML(x, fm){
  /* The word is set in the letters it is written in, like every other place
     the app shows a word of this language. It was not, so a word drawn in
     somebody's own letters at the head of its own page came out in Georgia
     three lines above, on the page of the word it was made from -- the same
     word, in two alphabets, on one screen. */
  return '<button class="wdrow"' + DO('openWord', [x.hw]) + '>'+
    (fm? '<span class="wdrowf">'+esc(fmLabel(fm))+'</span>' : '')+
    '<span class="wdroww'+(myFontOn()? ' sfont' : '')+'">'+esc(wOut(x.hw))+'</span>'+
    '<span class="wdrowm">'+esc(wMn(x)||t('sent.nomean'))+'</span></button>';
}
/* Those of a family that are inflections, those that are derivations, and
   those wearing no label at all -- which are neither, because a word with a
   parent and nothing said about it has not been told which it is, and saying
   so here would be the app deciding. */
function wdFamOf(kids, g){
  return kids.filter(function(k){ return fmGroup(k.fm||'')===g; });
}
function wdFamGroupHTML(label, list, labelled){
  if(!list.length) return '';
  return (label? '<div class="wdrowg">'+esc(label)+'</div>' : '')+
    list.map(function(x){ return wdRowHTML(x, labelled? (x.fm||'') : ''); }).join('');
}
function wdFamHTML(w){
  var par=wParent(w), root=par||w, kids;
  kids=wdFamSort(wKids(root).filter(function(x){ return x!==w; }));
  if(!par && !kids.length) return '';
  return '<div class="wdrows">'+
    (par? wdFamGroupHTML(t('word.root'), [par], false) : '')+
    wdFamGroupHTML(t('word.fm.inf'), wdFamOf(kids,'i'), true)+
    wdFamGroupHTML(t('word.fm.der'), wdFamOf(kids,'d'), true)+
    wdFamGroupHTML('',               wdFamOf(kids,''),  true)+
    '</div>';
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
    /* What kind of word it is, how it is said, and -- if it was made from
       another word -- which form of it this is. One line, because they are
       one question about the word in front of you. An unmarked word says only
       its part of speech.

       The form was on the dictionary row and came off with the rest of the
       family when a row became just a word (1f4d059). It belongs here rather
       than there: on the parent's page the label distinguishes one child from
       its siblings, and on the child's own page it is what the word IS. */
    '<div class="wsub2">'+esc(posLabel(w.pos)+
      ((w.from && w.fm)? ' \u00b7 '+fmLabel(w.fm) : '')+
      (w.reg? ' \u00b7 '+regLabel(w.reg) : ''))+'</div>'+
    /* What field the word belongs to. Nothing here is pressable and nothing
       here is a list you are working on, so it is a line under the other two
       small facts rather than a row of boxes. */
    (((w.tags||[]).length)? '<div class="wsub2">'+esc(w.tags.join(' \u00b7 '))+'</div>' : '')+
    wdSecHTML(t('word.means'), mns.length
      ? '<div class="mnlist">'+mns.map(function(m,i){
          return '<div class="mnrow"><span class="mnv">'+
            (mns.length>1? '<span class="sn">'+(i+1)+'</span>' : '')+esc(m)+'</span></div>';
        }).join('')+'</div>'
      : '<div class="note">'+esc(t('words.addmn'))+'</div>')+
    wdSecHTML(t('word.family'), wdFamHTML(w)+fmrTodoHTML(w))+
    wdSecHTML(t('word.syn'), wdRelsHTML(w,'syn'))+
    wdSecHTML(t('word.ant'), wdRelsHTML(w,'ant'))+
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
    /* Made, and last changed. Both, always -- the second used to be dropped
       on the day the word was made, on the grounds that "made today, changed
       today" is one fact written twice. To the minute it is two. */
    '<div class="wsub2" style="margin-top:18px">'+esc(t('word.made', wWhen(w.at)))+'</div>'+
    '<div class="wsub2">'+esc(t('word.up', wWhen(w.up||w.at)))+'</div>';
}
function openWord(hw){
  var w=findWord(hw); if(!w) return;
  openHw=w.hw; addW=null; wEdit=null;
  openForm('word:'+w.hw, wOut(w.hw), '<div id="wd-view">'+wdViewHTML()+'</div>',
           function(){ geTiles(); },
           navDo(t('word.edit'), 'openEdit', [w.hw], true));
}
/* The same sheet a new word is written on, opened on one that exists. */
function openEdit(hw){
  var w=findWord(hw); if(!w) return;
  openHw=w.hw; addW=null; wdMnNew=false; wdExNew=false; wdSubNew=false;
  wEdit={seq:wPh(w).slice(), sp:JSON.parse(JSON.stringify(spOf(w))), mns:wMns(w).slice(),
         pos:w.pos, sub:subOf(w), reg:w.reg||'', tags:(w.tags||[]).slice(),
         ety:w.ety||'', nt:w.nt||''};
  /* The mark this sheet's changes are measured from, taken before anything is
     drawn out of wEdit. Off the WORD and not off wEdit, so that the two being
     equal is a fact rather than an assumption. */
  wdSigOpen=wdSigWord(w);
  /* No button in the corner. navTop() puts one there when something on the
     sheet has been changed and not before -- www/shell.js § KEEP. */
  openForm('edit:'+w.hw, wOut(w.hw), '<div id="wd-body">'+wdFormHTML()+'</div>',
           function(){ phkMount(); geTiles(); });
}
FORM_OPEN.edit=function(hw){ openEdit(hw); };
FORM_OPEN.word=function(hw){ openWord(hw); };
/* Both keyboards write the same thing: a step in the spelling. A sound
   pressed on the sound keyboard is a step whose letter is whichever letter
   writes it, or none at all if nothing does yet. */
function wdSync(){ wEdit.seq=spPh(wEdit.sp||[]); }
/* Three things that were written as code inside a button: a route and two
   assignments. Each is one line now, in a file a checker can read. */
function goPlans(){ go('plans'); }
function wdSetNt(v){ wEdit.nt=v; wdKeepTouch(); }
/* A subclass belongs UNDER a part of speech, so a part of speech that MOVES
   leaves the old one standing under a heading it was never about -- 自動詞 on
   a noun, offered to the next word by subsOf('n') the moment it is saved. It
   is dropped rather than carried across or guessed at, and nothing is lost
   that anybody else had: subsOf() reads the dictionary, so the name is still
   on the list for as long as one word is still in it. */
function wdSetPos(v){
  if(wEdit.pos!==v) wEdit.sub='';
  wEdit.pos=v;
}
function wdSetSub(v){ wEdit.sub=String(v||'').trim(); }
/* A reading typed whole, given back to the positions that make it up.

   The sounds are cut out of what was typed and handed along in order, one to
   a position. A word has as many positions as it has letters and a reading
   can be any length, so the two ends are said rather than guessed at: sounds
   left over after the last position join it -- one letter reading two sounds
   is ordinary -- and positions left over after the last sound say nothing,
   which is a silent letter and is also ordinary. Neither adds a position or
   drops one: the letters of the word are the word, and they are changed by
   typing the word and not by typing its reading. */
function wdSetRd(v){
  var sp=(wEdit&&wEdit.sp)||[], us=uSplit(String(v||'')), i;
  if(!sp.length) return;
  for(i=0;i<sp.length;i++)
    spSetU(sp[i], i<us.length? (i===sp.length-1? us.slice(i).join('') : us[i]) : '');
  wdSync(); wdPaint();
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
  /* Empty is no subclass rather than an empty one, which is what `sub` being
     absent means everywhere else -- subsOf() collects what words are IN, and
     a word carrying '' would be a fourteenth thing on nobody's list. */
  if(String(wEdit.sub||'').trim()) w.sub=String(wEdit.sub).trim();
  else delete w.sub;
  /* `fm` is written where it is chosen, not here. What is here is the one
     thing Save has to hold: a form of nothing is not a form, so a word with
     no parent cannot carry one. */
  if(!w.from) delete w.fm;
  if((wEdit.tags||[]).length) w.tags=wEdit.tags.slice(); else delete w.tags;
  w.up=Date.now();
}
/* Writing the sheet onto the word. It says whether it LANDED, because it can
   refuse -- a word with no spelling is not a word, and a spelling somebody
   already has is somebody else's word. A refusal must not be followed by
   leaving the screen, or the toast that says why is gone before it is read.

   It does not navigate. It used to end in closeSheet(), which made Save mean
   "write it and take me off this screen"; leaving is the arrow's, and after a
   save there is nothing left to ask about, so the button in the corner goes --
   which is how somebody can tell it saved. OWNER DECISION 2026-09-03. */
function wdWrite(){
  var w=findWord(openHw); if(!w) return false;
  var hw=spWord(wEdit.sp||[]);
  if(!(wEdit.sp && wEdit.sp.length) || !hw){ toast(t('toast.hw2')); return false; }
  var clash=findWord(hw);
  if(clash && clash!==w){ toast(t('toast.dup')); return false; }
  var old=String(w.hw);
  /* The sheet writes what the sheet holds. `ph` -- the sounds that came with
     the word, off an import or off the one migration that gave the oldest
     words a sequence -- is not on this screen: there is no field for it, so
     nobody here can see it, change it or clear it. It was deleted anyway,
     and the next launch filled the hole with `phGuess(hw)`, so what somebody
     imported came back as a machine's reading of the spelling under the same
     key. CLAUDE.md § Data. `wPh()` already prefers the spelling, so nothing
     on any screen reads this while there is one. */
  w.hw=hw;
  w.sp=JSON.parse(JSON.stringify(wEdit.sp));
  w.mns=wEdit.mns.slice(); w.mn=wEdit.mns.length? wEdit.mns[0] : '';
  w.pos=wEdit.pos;
  wdPutExtras(w);
  /* A word that changes is still the same word, so everything pointing at it
     is told its new name rather than left pointing at one that is gone -- the
     trail among them (wRename, www/letters.js). The sheet is standing ON that
     trail, so what it is open on follows too, or the next save would look for
     a word under the name it has just stopped having. */
  if(hw!==old){ wRename(old, hw); openHw=hw; }
  save(); render(); toast(t('toast.saved', hw));
  return true;
}
/* Taking one word out of the language, and leaving nothing pointing at it.
   It was the body of `delWord` and is its own function because it is about to
   be done to more than one word at a time: two places doing this five ways
   would be two answers to what a deleted word leaves behind, and the one that
   was not read would be the one that left a `from` pointing at nothing.

   It does not confirm, does not save, does not touch the trail and does not
   redraw -- those are the deleting SCREEN's, and they are done once however
   many words go. `wRename` in `www/letters.js` is the same set of pointers
   read the other way round; this is the one place they are cut. */
function wDrop(hw){
  var gone=String(hw), w=findWord(gone);
  if(!w) return;
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
}
function delWord(){
  var w=findWord(openHw); if(!w) return;
  /* 確認は自前のポップで。「標準は使わねえって言ってるだろこれも禁止や」
     OWNER 2026-09-01 -- confirm() は使わない。はいの側がこの下。 */
  popAsk(t('confirm.del', w.hw), function(){ delWordGo(); }, t('pop.yes'));
}
function delWordGo(){
  var w=findWord(openHw); if(!w) return;
  var gone=String(w.hw);
  wDrop(gone);
  save();
  /* Not closeSheet(): that steps back one, onto the deleted word's own page,
     which then has nothing to show. Both of its screens come off the trail,
     so you are put back down wherever you were before you opened it -- the
     dictionary, or the word you reached it from. */
  navDrop('edit:'+gone); navDrop('word:'+gone);
  render(); toast(t('toast.deleted', gone));
}

/* Bringing a list IN is chapter 17, www/import.js: it grew a reader for
   every shape a list arrives in and stopped fitting under this heading. */

