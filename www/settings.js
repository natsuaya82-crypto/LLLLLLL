/* Lingua — settings, plans, and the sheet for writing one word (with CSV)
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   11. Settings
   ========================================================================= */
function setSample(){
  var p=PLANS.filter(function(x){return x.id===plan();})[0];
  /* The sample is a word of this language if there is one, shown as its own
     sounds; the Latin beside it is only what the respelling engines read. */
  var sseq=WORDS.length? wPh(WORDS[0]) : phGuess('aelin');
  var sample=sseq.join(''), srom=phRoman(sseq);
  return {seq:sseq, rom:srom, sample:sample};
}
/* ---- settings, in rooms ------------------------------------------------
   「設定もなんで言語全部表示なんだよ。設定は分類分けしてページ遷移。」

   It was one page carrying six unrelated things and, in the middle of them,
   ten rows of interface languages -- so the way to reach "erase everything"
   was to scroll past every language the app speaks. Six pages now, and the
   first one is a list of six rows. Each of them is one question. */
var SETS=[
  {id:'look',  k:'set.look'},
  {id:'read',  k:'set.reading'},
  {id:'ui',    k:'set.display'},
  {id:'lang',  k:'set.lang'},
  {id:'acct',  k:'set.account'},
  {id:'data',  k:'set.data'}
];
function vSettings(){
  var p=PLANS.filter(function(x){return x.id===plan();})[0];
  return '<div class="view">'+navTop('')+'<div class="body">'+
    SETS.map(function(x){
      return '<button class="set" onclick="go(\'set\',\''+x.id+'\')">'+
        '<span class="sl">'+esc(t(x.k))+'</span>'+
        '<span class="sv">'+esc(setSummary(x.id, p))+ICON_GO+'</span></button>';
    }).join('')+
    '</div></div>';
}
/* What each room answers, said on its door, so most questions are answered
   without opening anything. */
function setSummary(id, p){
  if(id==='look')  return t('theme.'+(SET.theme||'system'));
  if(id==='read')  return readMode()==='kana'? capFirst(langDef().rdName) : t('read.'+readMode());
  if(id==='ui')    return LANG[uiLang()].label;
  if(id==='lang')  return langName||'—';
  if(id==='acct')  return t('set.account.guest');
  if(id==='data')  return has('plus')? t('set.on') : 'Free';
  return '';
}
function vSet(){
  var id=String(here().a||''), p=PLANS.filter(function(x){return x.id===plan();})[0], S=setSample();
  var body='';
  if(id==='look'){
    body='<div class="pick">'+
      ['system','light','dark'].map(function(th){
        return '<button class="'+(SET.theme===th?'on':'')+'" onclick="setTheme(\''+th+'\')">'+t('theme.'+th)+'</button>';
      }).join('')+'</div>'+
      '<div class="note">'+t('set.theme.note')+'</div>';
  } else if(id==='read'){
    body='<div class="pick">'+
      [['ipa',t('read.ipa')],['kana',capFirst(langDef().rdName)],['both',t('read.both')]].map(function(m){
        return '<button class="'+(readMode()===m[0]?'on':'')+'" onclick="setRead(\''+m[0]+'\')">'+esc(m[1])+'</button>';
      }).join('')+'</div>'+
      '<div class="pvbox" style="margin-top:10px"><span class="pvn">'+t('set.sample')+'</span>'+
        '<span class="pvk">'+esc(readSeq(S.seq))+'</span>'+
        '<button onclick="sayPh('+esc(JSON.stringify(S.seq))+')">'+ICON_PLAY+t('f.listen')+'</button></div>'+
      '';
  } else if(id==='ui'){
    body=UI_LANGS.map(function(k){
      return '<button class="set lrow'+(uiLang()===k?' on':'')+'" onclick="setUi(\''+k+'\')">'+
        '<span class="sl">'+esc(LANG[k].label)+'</span>'+
        '<span class="pvk lsam">'+esc(LANG[k].read.word(S.rom))+'</span>'+
        '<span class="lchk">'+(uiLang()===k?ICON_TICK:'')+'</span></button>';
    }).join('')+
    '';
  } else if(id==='lang'){
    body='<button class="set" onclick="editName()"><span class="sl">'+t('set.name')+'</span>'+
      '<span class="sv">'+esc(langName||'—')+ICON_GO+'</span></button>'+
      '<button class="set" onclick="go(\'words\')"><span class="sl">'+t('set.count')+'</span>'+
      '<span class="sv">'+WORDS.length+(has('plus')?'':' / '+FREE_LIMIT)+ICON_GO+'</span></button>'+
      '<button class="set" onclick="go(\'sound\')"><span class="sl">'+t('toc.sound')+'</span>'+
      '<span class="sv">'+addedSnd().length+ICON_GO+'</span></button>'+
      '<button class="set" onclick="go(\'letters\')"><span class="sl">'+t('toc.letters')+'</span>'+
      '<span class="sv">'+LETTERS.length+ICON_GO+'</span></button>'+
      '<button class="set" style="margin-top:18px" onclick="wipe()">'+
      '<span class="sl" style="color:#c9553f">'+t('set.wipe')+'</span></button>';
  } else if(id==='acct'){
    body='<button class="set signin google" onclick="obSignIn()"><span class="sl">'+MARK_GOOGLE+
      '<span>'+t('ob.signin.google')+'</span></span><span class="sv">'+ICON_GO+'</span></button>'+
      '<button class="set signin apple" onclick="obSignIn()"><span class="sl">'+MARK_APPLE+
      '<span>'+t('ob.signin.apple')+'</span></span><span class="sv">'+ICON_GO+'</span></button>'+
      '<div class="sec">'+t('set.plan')+'</div>'+
      '<button class="set" onclick="go(\'plans\')"><span class="sl">'+t('set.plan.cur')+'</span>'+
      '<span class="sv">'+esc(p?p.name:'Free')+ICON_GO+'</span></button>';
  } else if(id==='data'){
    body=(has('plus')
      ? '<button class="set" onclick="exportCSV()"><span class="sl">'+t('set.csv.out')+'</span><span class="sv">'+ICON_GO+'</span></button>'+
        '<button class="set" onclick="openImport()"><span class="sl">'+t('set.csv.in')+'</span><span class="sv">'+ICON_GO+'</span></button>'+
        '<button class="set"><span class="sl">'+t('set.cloud')+'</span><span class="sv">'+t('set.on')+'</span></button>'
      : '<button class="lock" onclick="go(\'plans\')"><span class="lk">'+ICON_PLUS+'</span>'+
        '<span><span class="lt">'+t('set.lock.csv.t')+'</span><br><span class="ld">'+t('set.lock.csv.d')+'</span></span>'+
        '<span class="tag">PLUS</span></button>'+
        '<button class="lock" onclick="go(\'plans\')"><span class="lk">'+ICON_PLUS+'</span>'+
        '<span><span class="lt">'+t('set.lock.cloud.t')+'</span><br><span class="ld">'+t('set.lock.cloud.d')+'</span></span>'+
        '<span class="tag">PLUS</span></button>');
  } else {
    body='<div class="empty"><div class="eb">'+t('form.gone')+'</div></div>';
  }
  return '<div class="view">'+navTop('')+'<div class="body">'+body+'</div></div>';
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
  WORDS=[]; LINES=[]; langName=''; cands=[]; SUG=[];
  NOTES=[]; TALK=[]; tcomp=[];
  STG={done:{}, notes:{}, set:{}, extra:[]}; saveStg();
  SCRIPT={g:{}, extra:[]};
  LETTERS=[]; saveLetters();
  SFONT={built:false, sig:null};
  var css=document.getElementById('sfontcss');
  if(css && css.parentNode) css.parentNode.removeChild(css);
  /* everything the person chose, back to the defaults in core.js */
  SET={theme:SET.theme, plan:'free', done:false, order:'SOV', read:'both',
       voice:'', ui:SET.ui, script:false, world:{}};
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
    out+='<button class="spc'+(spOdd(addSp[i])?' odd':'')+'" onclick="go(\'aspell\','+i+')">'+
      '<span class="spf">'+(ltHasShape(l)
        ? (l.st&&l.st.length? '<canvas class="tc" data-l="'+esc(l.id)+'"></canvas>'
                            : '<span class="bch">'+esc(l.ch)+'</span>')
        : esc(ltName(l)||'·'))+'</span>'+
      '<span class="spu">'+esc(addSp[i].u)+'</span></button>';
  }
  return '<div class="spellrow">'+(out||'<span class="spnone">'+esc(t('word.sp.none'))+'</span>')+
    '<button class="seqdel" id="f-back" onclick="addBack()"'+(addSp.length?'':' disabled')+
    ' aria-label="'+esc(t('glyph.undo'))+'">'+ICON_BACK+'</button></div>';
}
var addMode='';
function setAddMode(m){ addMode=m; addRedraw(); }
function addKeys(){
  var mine=addedSnd(), ls=ltTypable();
  var m=addMode || (ls.length? 'lt' : 'ph');
  if(!mine.length && !ls.length){
    return '<div class="note">'+t('add.ph.none')+'</div>'+
      '<button class="btn ghost" style="width:100%;margin-top:8px" onclick="go(\'sound\')">'+
      esc(t('toc.sound'))+'</button>';
  }
  var rail = (ls.length && mine.length)
    ? '<div class="segs" style="margin-bottom:8px">'+
      '<button class="seg'+(m==='lt'?' on':'')+'" onclick="setAddMode(\'lt\')">'+t('toc.letters')+'</button>'+
      '<button class="seg'+(m==='ph'?' on':'')+'" onclick="setAddMode(\'ph\')">'+t('toc.sound')+'</button>'+
      '</div>' : '';
  if(m==='lt' && ls.length)
    return rail+'<div class="phkeys">'+ls.map(function(l){
      return ltkHTML(l, 'addLtr(\''+l.id+'\')'); }).join('')+'</div>';
  return rail+'<div class="phkeys">'+mine.map(function(x){
    return phkHTML(x, 'addPh(\''+x+'\')');
  }).join('')+'</div>';
}
/* One position of the word being made. Same page as the editor's, on the
   other list. */
function vASpell(){
  var i=parseInt(here().a,10), st=addSp[i];
  if(!st) return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="empty"><div class="eb">'+t('form.gone')+'</div></div></div></div>';
  var l=ltById(st.l), own=ltUnits(l), mine=addedSnd(), seen={}, opts=[], j;
  for(j=0;j<own.length;j++) if(!seen[own[j]]){ seen[own[j]]=1; opts.push({u:own[j], own:true}); }
  for(j=0;j<mine.length;j++) if(!seen[mine[j]]){ seen[mine[j]]=1; opts.push({u:mine[j], own:false}); }
  return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="spbig">'+(ltHasShape(l)
      ? (l.st&&l.st.length? '<canvas class="tc" data-l="'+esc(l.id)+'"></canvas>'
                          : '<span class="bch">'+esc(l.ch)+'</span>')
      : esc(ltName(l)||'·'))+'</div>'+
    '<div class="phkeys">'+opts.map(function(o){
      return '<button class="phk'+(o.u===st.u?' on':'')+(o.own?' own':'')+'" onclick="addSetU('+i+',\''+esc(o.u)+'\')">'+
        '<span class="pks">'+esc(o.u)+'</span></button>';
    }).join('')+'</div>'+
    '<button class="btn ghost" style="width:100%;margin-top:16px" onclick="addDropAt('+i+')">'+
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
    '<button onclick="sayField()">'+ICON_PLAY+t('f.listen')+'</button></div>'+
    '<div class="row2"><div class="field"><label>'+t('f.meaning')+'</label><input id="f-mn" placeholder="'+esc(t('f.meaning.ph'))+'"></div>'+
    '<div class="field"><label>'+t('f.pos')+'</label><select id="f-pos">'+
    POS.map(function(p){return '<option value="'+p+'"'+(p===addPos?' selected':'')+'>'+esc(posLabel(p))+'</option>';}).join('')+
    '</select></div></div>'+
    '<div id="sugwrap">'+sugHTML()+'</div>'+
    '<button class="btn" style="width:100%;margin-top:6px" onclick="addOne()">'+t('add.btn')+'</button>',
    function(){ phkMount(); geTiles(); addPv(); });
}
function addPv(){
  var r=document.getElementById('f-pv');
  if(r) r.textContent = addSeq.length? phIpa(addSeq) : '';
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
    out+='<button class="spc'+(spOdd(sp[i])?' odd':'')+'" onclick="go(\'spell\','+i+')">'+
      '<span class="spf">'+(ltHasShape(l)
        ? (l.st&&l.st.length? '<canvas class="tc" data-l="'+esc(l.id)+'"></canvas>'
                            : '<span class="bch">'+esc(l.ch)+'</span>')
        : esc(ltName(l)||'·'))+'</span>'+
      '<span class="spu">'+esc(sp[i].u)+'</span></button>';
  }
  return '<div class="spellrow">'+(out||'<span class="spnone">'+esc(t('word.sp.none'))+'</span>')+
    '<button class="seqdel" onclick="wdBack()"'+(sp.length?'':' disabled')+
    ' aria-label="'+esc(t('glyph.undo'))+'">'+ICON_BACK+'</button></div>'+
    '<div class="pvbox" style="margin-top:8px"><span class="pvn">'+t('f.reading')+'</span>'+
    '<span class="pvk">'+esc(phIpa(wEdit.seq))+'</span>'+
    '<button onclick="if(wEdit.seq.length)sayPh(wEdit.seq)">'+ICON_PLAY+t('f.listen')+'</button></div>';
}
var wdMode='';
function wdKeyMode(){
  if(wdMode) return wdMode;
  return ltTypable().length? 'lt' : 'ph';
}
function setWdMode(m){ wdMode=m; wdPaint(); }
function wdKeysHTML(){
  var mine=addedSnd(), ls=ltTypable(), m=wdKeyMode();
  if(!mine.length && !ls.length) return '<div class="note">'+t('add.ph.none')+'</div>';
  var rail = (ls.length && mine.length)
    ? '<div class="segs" style="margin-bottom:8px">'+
      '<button class="seg'+(m==='lt'?' on':'')+'" onclick="setWdMode(\'lt\')">'+t('toc.letters')+'</button>'+
      '<button class="seg'+(m==='ph'?' on':'')+'" onclick="setWdMode(\'ph\')">'+t('toc.sound')+'</button>'+
      '</div>' : '';
  if(m==='lt' && ls.length)
    return rail+'<div class="phkeys">'+ls.map(function(l){
      return ltkHTML(l, 'wdLtr(\''+l.id+'\')'); }).join('')+'</div>';
  return rail+'<div class="phkeys">'+mine.map(function(x){
    return phkHTML(x, 'wdKey(\''+x+'\')'); }).join('')+'</div>';
}
/* A letter on a keyboard: its face, and what it says under it. */
function ltkHTML(l, call){
  var face;
  if(l.st && l.st.length) face='<canvas class="pkc" data-l="'+esc(l.id)+'"></canvas>';
  else if(l.ch) face='<span class="pkb">'+esc(l.ch)+'</span>';
  else face='<span class="pkb">'+esc(ltName(l)||'·')+'</span>';
  return '<button class="phk hasg" onclick="'+call+'">'+face+
    '<span class="pks">'+esc(ltFirstUnit(l))+'</span></button>';
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
        return '<button class="rel" onclick="openWord(\''+esc(x.hw)+'\')">'+
          '<span class="relw">'+esc(wOut(x.hw))+'</span>'+
          (wMns(x)[0]? '<span class="relm">'+esc(wMns(x)[0])+'</span>':'')+'</button>';
      }).join('')+'</div>'
    : '<div class="note">'+t('word.'+k+'.none')+'</div>')+
    '<button class="btn ghost" style="width:100%;margin-top:8px" onclick="go(\'relate\',\''+
      k+':'+esc(w.hw)+'\')">'+ICON_LINK+t('word.'+k+'.add')+'</button>';
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
          (seq.length? '<button class="usep" onclick="sayPh('+esc(JSON.stringify(seq))+')" aria-label="'+
            esc(t('f.listen'))+'">'+ICON_PLAY+'</button>' : '')+
          '<button class="usep" onclick="wdDelEx('+i+')" aria-label="'+esc(t('word.ex.del'))+'">'+ICON_CROSS+'</button>'+
          '</div>';
      }).join('')+'</div>'
    : '')+
    '<div class="exadd">'+
      '<input id="wd-exl" placeholder="'+esc(exHint())+'" autocomplete="off">'+
      '<input id="wd-exg" placeholder="'+esc(t('word.ex.gl.ph'))+'" '+
        'onkeydown="if(event.key===\'Enter\'){event.preventDefault();wdAddEx();}">'+
      '<button class="btn ghost" onclick="wdAddEx()">'+t('word.mn.add')+'</button>'+
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
  if(!w) return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="empty"><div class="eb">'+t('form.gone')+'</div></div></div></div>';
  var on=wRel(w,k), list=WORDS.filter(function(x){ return x!==w; })
    .sort(function(x,y){ return String(x.hw).localeCompare(String(y.hw)); });
  return '<div class="view">'+navTop(on.length)+'<div class="body">'+
    (list.length
      ? list.map(function(x){
          var has=on.indexOf(x.hw)>=0;
          return '<div class="entry'+(has?' on':'')+'">'+
            '<button class="ebody" onclick="wRelToggle(\''+esc(hw)+'\',\''+k+'\',\''+esc(x.hw)+'\')">'+
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
  b.innerHTML=wdBodyHTML(); phkMount(); geTiles();
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
    wdSeqHTML()+wdKeysHTML()+

    '<div class="sec">'+t('word.means')+'</div>'+
    wdMnsHTML()+

    '<div class="sec">'+t('f.pos')+'</div>'+
    '<div class="field"><select id="wd-pos" onchange="wEdit.pos=this.value">'+
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

    '<button class="btn" style="width:100%;margin-top:18px" onclick="saveWord()">'+t('word.save')+'</button>'+
    '<button class="set" style="margin-top:10px;border-bottom:none" onclick="delWord()">'+
      '<span class="sl" style="color:#c9553f">'+t('word.del')+'</span></button>';
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
function wdBack(){
  if(wEdit.sp && wEdit.sp.length) wEdit.sp.pop();
  wdSync(); wdPaint();
}
/* One position of one word, and what it says there. The letter's own
   readings first, then every sound the language has, because a sound change
   is exactly the case where the letter's own readings are not enough. */
function vSpell(){
  var i=parseInt(here().a,10), sp=(wEdit&&wEdit.sp)||[], st=sp[i];
  if(!st) return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="empty"><div class="eb">'+t('form.gone')+'</div></div></div></div>';
  var l=ltById(st.l), own=ltUnits(l), mine=addedSnd(), seen={}, opts=[], j;
  for(j=0;j<own.length;j++) if(!seen[own[j]]){ seen[own[j]]=1; opts.push({u:own[j], own:true}); }
  for(j=0;j<mine.length;j++) if(!seen[mine[j]]){ seen[mine[j]]=1; opts.push({u:mine[j], own:false}); }
  return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="spbig">'+(ltHasShape(l)
      ? (l.st&&l.st.length? '<canvas class="tc" data-l="'+esc(l.id)+'"></canvas>'
                          : '<span class="bch">'+esc(l.ch)+'</span>')
      : esc(ltName(l)||'·'))+'</div>'+
    '<div class="phkeys">'+opts.map(function(o){
      return '<button class="phk'+(o.u===st.u?' on':'')+(o.own?' own':'')+'" onclick="wdSetU('+i+',\''+esc(o.u)+'\')">'+
        '<span class="pks">'+esc(o.u)+'</span></button>';
    }).join('')+'</div>'+
    '<button class="btn ghost" style="width:100%;margin-top:16px" onclick="wdDropAt('+i+')">'+
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
/* ---- bringing a list in ------------------------------------------------
   The old importer took a CSV whose first column was a spelling in Latin
   letters, stripped everything that was not A-Z, and refused anything under
   two characters. That works for a language somebody already wrote in roman
   letters and for nothing else -- not for a word made of ʃ and ŋ, and not at
   all for the thing a person actually has lying around, which is a list of
   MEANINGS: a Swadesh list, the nouns of a setting, the two hundred words a
   story needs.

   So a line is read as whatever it is. One field is a meaning and the word
   for it is coined out of this language's own sounds. Two or three fields
   are a word you already have: spelling, meaning, part of speech. Both can
   be in the same paste, because a real list is usually both. */
function impHead(x){
  var v=String(x||'').trim().toLowerCase(), c, k;
  if(v==='spelling' || v==='word' || v==='hw') return true;
  for(c=0;c<UI_LANGS.length;c++){
    k=LANG[UI_LANGS[c]].str['f.spelling'];
    if(k && String(k).trim().toLowerCase()===v) return true;
  }
  return false;
}
function impParse(src){
  var out=[], lines=String(src||'').split(/\r?\n/), i, c, ln;
  for(i=0;i<lines.length;i++){
    ln=lines[i].trim();
    if(!ln) continue;
    c=ln.split(/\t|,/).map(function(x){ return x.trim().replace(/^"|"$/g,''); });
    /* a header row, in whichever of the ten the list was written in: the
       label a spelling column would carry is a string this app already has */
    if(impHead(c[0])) continue;
    if(c.length===1) out.push({mn:c[0], hw:''});
    else out.push({hw:c[0], mn:c[1]||'', pos:posKey(c[2]||'n')});
  }
  return out;
}
function openImport(){
  openForm('csv:', t('csv.title'),
    '<div class="field"><textarea id="f-csv" placeholder="'+esc(t('csv.ph'))+'"></textarea></div>'+
    '<button class="btn" style="width:100%" onclick="doImport()">'+t('csv.btn')+'</button>');
}
FORM_OPEN.csv=function(){ openImport(); };
function doImport(){
  var e=document.getElementById('f-csv');
  if(!e) return;
  var rows=impParse(e.value), made=0, took=0, i, r, seq, hw, guard;
  for(i=0;i<rows.length;i++){
    r=rows[i];
    if(!capOK(1)) break;
    if(r.hw){
      /* a word that already exists somewhere else: its spelling is its own,
         and its sounds are read off that spelling as well as they can be */
      hw=String(r.hw);
      if(findWord(hw)) continue;
      seq=phGuess(hw);
      if(!seq.length) continue;
      WORDS.push({hw:hw, ph:seq, mn:r.mn, mns:(r.mn?[r.mn]:[]), pos:r.pos||'n', at:Date.now()+i});
      took++;
    } else {
      if(!r.mn) continue;
      if(!addedSnd().length) continue;
      /* asWord and not makeWord: makeWord copies the shapes the dictionary
         already uses, and a dictionary of one word has one shape, so a list
         of two hundred meanings would get two words out of it. asWord falls
         back to the plainest shape there is, built from the whole inventory,
         which is the only thing that can be done before there is a pattern
         to imitate. */
      seq=null; guard=0;
      while(guard<40){
        guard++;
        seq=asWord('n');
        if(seq && seq.length && !findWord(seq.join(''))) break;
        seq=null;
      }
      if(!seq) continue;
      hw=seq.join('');
      WORDS.push({hw:hw, ph:seq, mn:r.mn, mns:[r.mn], pos:'n', at:Date.now()+i});
      made++;
    }
  }
  save(); cands=[];
  if(here().r==='form') back(); else render();
  toast(t('csv.done', took, made));
}

