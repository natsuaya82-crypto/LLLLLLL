/* Lingua — settings, plans, and the sheet for writing one word (with CSV)
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   11. Settings
   ========================================================================= */
function vSettings(){
  var p=PLANS.filter(function(x){return x.id===plan();})[0];
  /* The sample is a word of this language if there is one, shown as its own
     sounds; the Latin beside it is only what the respelling engines read. */
  var sseq=WORDS.length? wPh(WORDS[0]) : phGuess('aelin');
  var sample=sseq.join(''), srom=phRoman(sseq);
  return '<div class="view">'+
    navTop('')+
    '<div class="body">'+
    '<div class="sec">'+t('set.look')+'</div>'+
    '<div class="pick">'+
      ['system','light','dark'].map(function(th){
        return '<button class="'+(SET.theme===th?'on':'')+'" onclick="setTheme(\''+th+'\')">'+t('theme.'+th)+'</button>';
      }).join('')+
    '</div>'+
    '<div class="note">'+t('set.theme.note')+'</div>'+

    /* How a word comes out, in one place. The exact reading, the rough one,
       and the voice were three separate sections, and the voice section was a
       picker for a thing the app no longer uses. There is one question here:
       what do you want to see, and what does it sound like. */
    '<div class="sec">'+t('set.reading')+'</div>'+
    '<div class="pick">'+
      [['ipa',t('read.ipa')],['kana',capFirst(langDef().rdName)],['both',t('read.both')]].map(function(m){
        return '<button class="'+(readMode()===m[0]?'on':'')+'" onclick="setRead(\''+m[0]+'\')">'+esc(m[1])+'</button>';
      }).join('')+
    '</div>'+
    '<div class="pvbox" style="margin-top:10px"><span class="pvn">'+t('set.sample')+'</span>'+
      '<span class="pvk">'+esc(readSeq(sseq))+'</span>'+
      '<button onclick="sayPh('+esc(JSON.stringify(sseq))+')">'+ICON_PLAY+t('f.listen')+'</button></div>'+
    '<div class="note">'+t('set.ipa.note', esc(langDef().rdName))+'</div>'+
    '<div class="note" style="margin-top:10px">'+t('set.voice.note')+'</div>'+

    /* One control for the whole interface: the screen and the reading
       of every word follow it. The IPA never does. */
    '<div class="sec">'+t('set.display')+'</div>'+
    /* One row per language, each carrying the reading it would give the
       first word in the dictionary — so the choice is made by looking at
       the result, not by trusting the name of a script. */
    UI_LANGS.map(function(k){
      return '<button class="set lrow'+(uiLang()===k?' on':'')+'" onclick="setUi(\''+k+'\')">'+
        '<span class="sl">'+esc(LANG[k].label)+'</span>'+
        '<span class="pvk lsam">'+esc(LANG[k].read.word(srom))+'</span>'+
        '<span class="lchk">'+(uiLang()===k?ICON_TICK:'')+'</span></button>';
    }).join('')+
    '<div class="note">'+t('set.display.note')+'</div>'+

    '<div class="sec">'+t('set.lang')+'</div>'+
    '<button class="set" onclick="editName()"><span class="sl">'+t('set.name')+'</span><span class="sv">'+esc(langName||'—')+ICON_GO+'</span></button>'+
    '<button class="set" onclick="go(\'words\')"><span class="sl">'+t('set.count')+'</span><span class="sv">'+WORDS.length+(has('plus')?'':' / '+FREE_LIMIT)+ICON_GO+'</span></button>'+

    /* Signing in used to be the second thing the app asked for, before a
       single letter existed. It is here now, where it has a reason: an
       account is what carries a language off this one phone. Nothing above
       this line needs it. */
    '<div class="sec">'+t('set.account')+'</div>'+
    '<button class="set signin google" onclick="obSignIn()"><span class="sl">'+MARK_GOOGLE+
      '<span>'+t('ob.signin.google')+'</span></span><span class="sv">'+ICON_GO+'</span></button>'+
    '<button class="set signin apple" onclick="obSignIn()"><span class="sl">'+MARK_APPLE+
      '<span>'+t('ob.signin.apple')+'</span></span><span class="sv">'+ICON_GO+'</span></button>'+
    '<div class="note">'+t('set.account.note')+'</div>'+

    '<div class="sec">'+t('set.plan')+'</div>'+
    '<button class="set" onclick="go(\'plans\')"><span class="sl">'+t('set.plan.cur')+'</span><span class="sv">'+esc(p?p.name:'Free')+ICON_GO+'</span></button>'+

    '<div class="sec">'+t('set.data')+'</div>'+
    (has('plus')
      ? '<button class="set" onclick="exportCSV()"><span class="sl">'+t('set.csv.out')+'</span><span class="sv">'+ICON_GO+'</span></button>'+
        '<button class="set" onclick="openImport()"><span class="sl">'+t('set.csv.in')+'</span><span class="sv">'+ICON_GO+'</span></button>'+
        '<button class="set"><span class="sl">'+t('set.cloud')+'</span><span class="sv">'+t('set.on')+'</span></button>'
      : '<button class="lock" onclick="go(\'plans\')"><span class="lk">'+ICON_PLUS+'</span>'+
        '<span><span class="lt">'+t('set.lock.csv.t')+'</span><br><span class="ld">'+t('set.lock.csv.d')+'</span></span>'+
        '<span class="tag">PLUS</span></button>'+
        '<button class="lock" onclick="go(\'plans\')"><span class="lk">'+ICON_PLUS+'</span>'+
        '<span><span class="lt">'+t('set.lock.cloud.t')+'</span><br><span class="ld">'+t('set.lock.cloud.d')+'</span></span>'+
        '<span class="tag">PLUS</span></button>')+
    '<button class="set" style="margin-top:18px" onclick="wipe()"><span class="sl" style="color:#c9553f">'+t('set.wipe')+'</span></button>'+
    '<div class="note" style="margin-top:26px">'+t('set.footer')+(has('plus')?'':t('set.footer.free'))+'</div>'+
    '</div></div>';
}
function setTheme(v){ SET.theme=v; save(); applyTheme(); render(); }
function setRead(m){ SET.read=m; save(); render(); }
function setUi(l){ SET.ui=l; save(); render(); }
/* Erase everything means everything. It used to empty the words, the
   sentences and the name and stop there, so the sounds you had chosen, the
   letters you had drawn, the characters you had borrowed and every grammar
   decision survived a wipe and turned up inside the next language you
   started -- which is not a language you made, it is two of them mixed.
   The storage keys are removed rather than overwritten, so nothing can be
   left behind by a shape this version does not know about. */
function wipe(){
  if(!confirm(t('confirm.wipe'))) return;
  WORDS=[]; LINES=[]; langName=''; comp=[]; compSel=-1; cands=[]; SUG=[];
  NOTES=[]; TALK=[]; tcomp=[];
  STG={done:{}, notes:{}, set:{}, extra:[]}; saveStg();
  SCRIPT={g:{}, extra:[]};
  LETTERS=[]; saveLetters();
  SFONT={built:false, sig:null};
  var css=document.getElementById('sfontcss');
  if(css && css.parentNode) css.parentNode.removeChild(css);
  /* everything the person chose, back to the defaults in core.js */
  SET={theme:SET.theme, plan:'free', done:false, order:'SOV', read:'both',
       voice:'', ui:SET.ui, script:false};
  try{
    localStorage.removeItem(LS_W); localStorage.removeItem(LS_L);
    localStorage.removeItem(LS_N); localStorage.removeItem(LS_G);
    localStorage.removeItem(LS_LT);
    localStorage.removeItem(LS_NT); localStorage.removeItem(LS_TK);
    localStorage.removeItem(LS_STG);
  }catch(e){}
  save();
  ob={step:0, mode:'draw', pick:'', strokes:null, ch:'', snd:''};
  GE=null; route='home'; RENDERED=null;
  render();
}

/* =========================================================================
   12. Plans
   ========================================================================= */
function vPlans(){
  return '<div class="view">'+
    navTop('')+
    '<div class="body">'+
    '<div class="note" style="margin-bottom:16px">'+t('plans.intro')+'</div>'+
    PLANS.map(function(p){
      var cur = p.id===plan();
      return '<div class="plan'+(cur?' cur':'')+'">'+
        '<div class="ph2"><span class="pn">'+p.name+'</span>'+
        (cur?'<span class="badge">'+t('plan.cur')+'</span>':'')+
        '<span class="pp">'+t(p.price)+'</span></div>'+
        '<div class="pl">'+p.lines.map(function(l){return '· '+t(l);}).join('<br>')+'</div>'+
        (cur?'':'<button onclick="choose(\''+p.id+'\')">'+(p.id==='free'? t('plan.tofree') : t('plan.choose'))+'</button>')+
        '</div>';
    }).join('')+
    '<div class="note" style="margin-top:14px">'+t('plans.note')+'</div>'+
    '</div></div>';
}
function choose(id){
  SET.plan=id; save(); render();
  toast(id==='free'? t('toast.plan.free') : t('toast.plan.other', id));
}

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
    if(!unl && left<=0) return '<button class="sugout" onclick="closeSheet();go(\'plans\')">'+t('sug.out')+' <b>'+t('up.cta')+ICON_GO+'</b></button>';
    return '<button class="sugask" onclick="sugGo()">'+
      '<span class="sual"><span class="sut">'+t('add.lock.t')+'</span><span class="sud">'+t('add.lock.d')+'</span></span>'+
      (unl?'':'<span class="sugn">'+t('sug.left', left)+'</span>')+'</button>';
  }
  return '<div class="sugbox"><div class="sugchips">'+
    SUG.map(function(q,i){ return '<button class="sugchip" onclick="sugPick('+i+')"><span class="sw">'+esc(q.join(''))+'</span><span class="sr">'+esc(readSeq(q))+'</span></button>'; }).join('')+
    '</div><div class="sugfoot"><span class="sughint">'+(sugMn? t('sug.for', esc(sugMn)) : t('sug.hint'))+'</span>'+
    ((unl||left>0)?'<button class="sugmore" onclick="sugGo()">'+t('sug.more')+'</button>':'')+
    '</div>'+
    ((!unl&&left<=0)?'<button class="sugout" style="margin:9px 0 0" onclick="closeSheet();go(\'plans\')">'+t('sug.out')+' <b>'+t('up.cta')+ICON_GO+'</b></button>':'')+
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
function addPh(sym){ sayOne(sym); addSeq.push(sym); addPaint(); }
function addBack(){ addSeq.pop(); addPaint(); }
function addPaint(){
  var w=document.getElementById('f-seq'), r=document.getElementById('f-pv'),
      b=document.getElementById('f-back');
  if(w) w.textContent = addSeq.join('');
  if(r) r.textContent = addSeq.length? phIpa(addSeq) : '';
  if(b) b.disabled = !addSeq.length;
}
function addKeys(){
  var mine=addedSnd();
  if(!mine.length){
    return '<div class="note">'+t('add.ph.none')+'</div>'+
      '<button class="btn ghost" style="width:100%;margin-top:8px" onclick="closeSheet({target:{id:\'sbg\'}});go(\'sound\')">'+
      esc(t('toc.sound'))+'</button>';
  }
  return '<div class="phkeys">'+mine.map(function(x){
    return phkHTML(x, 'addPh(\''+x+'\')');
  }).join('')+'</div>';
}
/* Written from nothing, or derived from a word that already exists -- in
   which case it opens as that word's sounds, to be changed from there. */
var addFrom='';
function openAdd(from){
  SUG=[]; sugMn=''; addSeq=[];
  var par=from? findWord(from) : null;
  addFrom = par? String(par.hw) : '';
  if(par) addSeq=wPh(par).slice();
  if(!capOK(1)){ go('plans'); toast(t('toast.cap', FREE_LIMIT)); return; }
  openForm('add:'+addFrom,
    (addFrom? t('add.title.from', addFrom) : t('add.title')),
    '<div class="note" style="margin-bottom:12px">'+(addFrom? t('add.note.from') : t('add.note'))+'</div>'+
    '<div class="seqbox"><span class="seq" id="f-seq"></span>'+
      '<button class="seqdel" id="f-back" onclick="addBack()" disabled aria-label="'+esc(t('glyph.undo'))+'">'+ICON_BACK+'</button></div>'+
    '<div class="sec">'+t('add.ph')+'</div>'+
    addKeys()+
    '<div class="pvbox"><span class="pvn">'+t('f.reading')+'</span><span class="pvk" id="f-pv"></span>'+
    '<button onclick="sayField()">'+ICON_PLAY+t('f.listen')+'</button></div>'+
    '<div class="row2"><div class="field"><label>'+t('f.meaning')+'</label><input id="f-mn" placeholder="'+esc(t('f.meaning.ph'))+'"></div>'+
    '<div class="field"><label>'+t('f.pos')+'</label><select id="f-pos">'+
    POS.map(function(p){return '<option value="'+p+'"'+(p===addPos?' selected':'')+'>'+esc(posLabel(p))+'</option>';}).join('')+
    '</select></div></div>'+
    '<div id="sugwrap">'+sugHTML()+'</div>'+
    '<button class="btn" style="width:100%;margin-top:6px" onclick="addOne()">'+t('add.btn')+'</button>',
    function(){ addPaint(); phkMount(); });
}
FORM_OPEN.add=function(from){ openAdd(from||''); };
function pv(){ addPaint(); }
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
  if(addFrom && addFrom!==hw) w.from=addFrom;
  WORDS.push(w);
  save(); closeSheet(); cands=[]; addSeq=[]; addFrom='';
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
function wordSyl(w){
  return phCut(wPh(w)).map(function(p){
    return p.on.join('')+p.nu.join('')+p.co.join('');
  }).join('\u00b7');
}

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

function wdSeqHTML(){
  return '<div class="seqbox"><span class="seq" id="wd-seq">'+esc(wEdit.seq.join(''))+'</span>'+
    '<button class="seqdel" onclick="wdBack()"'+(wEdit.seq.length?'':' disabled')+
    ' aria-label="'+esc(t('glyph.undo'))+'">'+ICON_BACK+'</button></div>';
}
function wdKeysHTML(){
  var mine=addedSnd();
  if(!mine.length) return '<div class="note">'+t('add.ph.none')+'</div>';
  return '<div class="phkeys">'+mine.map(function(x){
    return phkHTML(x, 'wdKey(\''+x+'\')'); }).join('')+'</div>';
}
function wdMnsHTML(){
  var rows=wEdit.mns.map(function(m,i){
    return '<div class="mnrow"><span class="mnv">'+esc(m)+'</span>'+
      '<button class="mnx" onclick="wdDelMn('+i+')" aria-label="'+esc(t('word.mn.del'))+'">'+ICON_CROSS+'</button></div>';
  }).join('');
  return '<div class="mnlist">'+rows+'</div>'+
    '<div class="mnadd"><input id="wd-mn" placeholder="'+esc(t('word.mn.ph'))+'" '+
      'onkeydown="if(event.key===\'Enter\'){event.preventDefault();wdAddMn();}">'+
    '<button class="btn ghost" onclick="wdAddMn()">'+t('word.mn.add')+'</button></div>';
}
/* ---- what else a dictionary entry holds -------------------------------
   Spelling, reading, part of speech, senses and where the word came from
   were all here. The two a real entry has that this one did not are a note
   -- where a word came from in your head, which sense is the older one, what
   it must never be confused with -- and a used-in line. The second one is
   already in the app: the sentences chapter knows which words each line was
   built out of. It was simply never shown on the word. */
function wdUsesHTML(){
  var w=findWord(openHw); if(!w) return '';
  var used=[], i;
  for(i=0;i<LINES.length;i++)
    if(LINES[i].ws && LINES[i].ws.indexOf(w.hw)>=0) used.push({i:i, l:LINES[i]});
  if(!used.length) return '<div class="note">'+t('word.uses.none')+'</div>';
  return '<div class="ntlist">'+used.map(function(u){
    var seq=[], j, x;
    for(j=0;j<u.l.ws.length;j++){ x=findWord(u.l.ws[j]); if(x) seq=seq.concat(wPh(x)); }
    return '<div class="useln"><span class="usew">'+esc(u.l.ws.map(wOut).join(' '))+'</span>'+
      /* the first sense only. A gloss under a line is a reminder of what the
         line says, and three senses of one word in it stops being that */
      '<span class="usem">'+esc(u.l.ws.map(function(h){
        var y=findWord(h); return (y&&wMns(y)[0])||h; }).join(' '))+'</span>'+
      '<button class="usep" onclick="sayPh('+esc(JSON.stringify(seq))+')" aria-label="'+
        esc(t('f.listen'))+'">'+ICON_PLAY+'</button></div>';
  }).join('')+'</div>';
}
function wdNoteHTML(){
  return '<div class="field"><textarea id="wd-nt" rows="2" placeholder="'+esc(t('word.note.ph'))+
    '" oninput="wEdit.nt=this.value">'+esc(wEdit.nt||'')+'</textarea></div>';
}
function wdKidsHTML(){
  var w=findWord(openHw); if(!w) return '';
  var kids=wKids(w), par=wParent(w);
  return (par? '<button class="ntrow" onclick="openWord(\''+esc(par.hw)+'\')">'+
            '<span class="nth">'+t('word.from', esc(par.hw))+'</span>'+
            (wMn(par)? '<span class="ntb">'+esc(wMn(par))+'</span>':'')+'</button>' : '')+
    (kids.length? '<div class="ntlist" style="margin-top:8px">'+kids.map(function(k){
        return '<button class="ntrow" onclick="openWord(\''+esc(k.hw)+'\')">'+
          '<span class="nth">'+esc(k.hw)+'</span>'+
          '<span class="ntb">'+esc(wMn(k)||t('sent.nomean'))+'</span></button>';
      }).join('')+'</div>' : '')+
    '<button class="btn ghost" style="width:100%;margin-top:10px" onclick="wdDerive()">'+t('word.derive')+'</button>';
}
function wdPaint(){
  var b=document.getElementById('wd-body'); if(!b) return;
  b.innerHTML=wdBodyHTML(); phkMount();
}
function wdBodyHTML(){
  var seq=wEdit.seq;
  return '<div class="whd"><span class="whw">'+esc(seq.join(''))+'</span>'+
      '<button class="play" style="margin:0 0 0 auto" onclick="sayPh('+esc(JSON.stringify(seq))+')">'+
      ICON_PLAY+t('f.listen')+'</button></div>'+
    '<div class="wsub">'+esc(phIpa(seq))+'</div>'+
    '<div class="wsub2">'+esc(phCut(seq).map(function(p){
        return p.on.join('')+p.nu.join('')+p.co.join(''); }).join('·'))+'</div>'+

    '<div class="sec">'+t('word.sounds')+'</div>'+
    '<div class="note" style="margin-bottom:8px">'+t('word.sounds.d')+'</div>'+
    wdSeqHTML()+wdKeysHTML()+

    '<div class="sec">'+t('word.means')+'</div>'+
    wdMnsHTML()+

    '<div class="sec">'+t('f.pos')+'</div>'+
    '<div class="field"><select id="wd-pos" onchange="wEdit.pos=this.value">'+
      POS.map(function(p){return '<option value="'+p+'"'+(p===wEdit.pos?' selected':'')+'>'+esc(posLabel(p))+'</option>';}).join('')+
    '</select></div>'+

    '<div class="sec">'+t('word.family')+'</div>'+
    wdKidsHTML()+

    '<div class="sec">'+ICON_LINE+t('word.uses')+'</div>'+
    wdUsesHTML()+

    '<div class="sec">'+t('word.note')+'</div>'+
    '<div class="note" style="margin-bottom:8px">'+t('word.note.d')+'</div>'+
    wdNoteHTML()+

    '<button class="btn" style="width:100%;margin-top:18px" onclick="saveWord()">'+t('word.save')+'</button>'+
    '<button class="set" style="margin-top:10px;border-bottom:none" onclick="delWord()">'+
      '<span class="sl" style="color:#c9553f">'+t('word.del')+'</span></button>';
}
function openWord(hw){
  var w=findWord(hw); if(!w) return;
  openHw=w.hw;
  wEdit={seq:wPh(w).slice(), mns:wMns(w).slice(), pos:w.pos, nt:w.nt||''};
  openForm('word:'+w.hw, wOut(w.hw), '<div id="wd-body">'+wdBodyHTML()+'</div>',
           function(){ phkMount(); });
}
FORM_OPEN.word=function(hw){ openWord(hw); };
function wdKey(sym){ sayOne(sym); wEdit.seq.push(sym); wdPaint(); }
function wdBack(){ wEdit.seq.pop(); wdPaint(); }
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
  w.mns=wEdit.mns.slice(); w.mn=wEdit.mns.length? wEdit.mns[0] : '';
  w.pos=wEdit.pos;
  /* An empty note is no note, not an empty one: a key that is always there
     and always blank ends up in every export and every backup. */
  if(String(wEdit.nt||'').trim()) w.nt=String(wEdit.nt).trim(); else delete w.nt;
  /* A word that changes is still the same word, so everything pointing at it
     is told its new name rather than left pointing at one that is gone. */
  if(hw!==old){
    WORDS.forEach(function(x){ if(x.from===old) x.from=hw; });
    LINES.forEach(function(l){ l.ws=l.ws.map(function(x){ return x===old? hw : x; }); });
    comp=comp.map(function(x){ return x===old? hw : x; });
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
  LINES=LINES.filter(function(l){ return l.ws.indexOf(gone)<0; });
  comp=comp.filter(function(x){ return x!==gone; });
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
function openImport(){
  openForm('csv:', t('csv.title'),
    '<div class="note" style="margin-bottom:10px">'+t('csv.note')+'</div>'+
    '<div class="field"><textarea id="f-csv" placeholder="'+t('csv.ph')+'"></textarea></div>'+
    '<button class="btn" style="width:100%" onclick="doImport()">'+t('csv.btn')+'</button>');
}
FORM_OPEN.csv=function(){ openImport(); };
function doImport(){
  var src=document.getElementById('f-csv').value, n=0;
  src.split(/\r?\n/).forEach(function(line){
    if(!line.trim()) return;
    var c=line.split(',').map(function(x){return x.trim().replace(/^"|"$/g,'');});
    var hw=String(c[0]||'').replace(/[^A-Za-z]/g,'');
    if(hw.length<2) return;
    if(/^spelling$/i.test(c[0])) return;
    hw=hw.charAt(0).toUpperCase()+hw.slice(1).toLowerCase();
    if(WORDS.some(function(w){return String(w.hw).toLowerCase()===hw.toLowerCase();})) return;
    WORDS.push({hw:hw, mn:c[1]||'', pos:posKey(c[2]), at:Date.now()});
    n++;
  });
  save(); closeSheet(); cands=[]; render();
  toast(tn('toast.imported', n));
}

