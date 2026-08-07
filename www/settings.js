/* Lingua — settings and plans (chapters 11-12)
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
      return '<button class="set"' + DO('go', ["set", x.id]) + '>'+
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
        return '<button class="'+(SET.theme===th?'on':'')+'"' + DO('setTheme', [th]) + '>'+t('theme.'+th)+'</button>';
      }).join('')+'</div>'+
      '<div class="note">'+t('set.theme.note')+'</div>';
  } else if(id==='read'){
    body='<div class="pick">'+
      [['ipa',t('read.ipa')],['kana',capFirst(langDef().rdName)],['both',t('read.both')]].map(function(m){
        return '<button class="'+(readMode()===m[0]?'on':'')+'"' + DO('setRead', [m[0]]) + '>'+esc(m[1])+'</button>';
      }).join('')+'</div>'+
      '<div class="pvbox" style="margin-top:10px"><span class="pvn">'+t('set.sample')+'</span>'+
        '<span class="pvk">'+esc(readSeq(S.seq))+'</span>'+
        '<button' + DO('sayPh', [S.seq]) + '>'+ICON_PLAY+t('f.listen')+'</button></div>'+
      '';
  } else if(id==='ui'){
    body=UI_LANGS.map(function(k){
      return '<button class="set lrow'+(uiLang()===k?' on':'')+'"' + DO('setUi', [k]) + '>'+
        '<span class="sl">'+esc(LANG[k].label)+'</span>'+
        '<span class="pvk lsam">'+esc(LANG[k].read.word(S.rom))+'</span>'+
        '<span class="lchk">'+(uiLang()===k?ICON_TICK:'')+'</span></button>';
    }).join('')+
    '';
  } else if(id==='lang'){
    body='<button class="set"' + DO('go', ["langs"]) + '><span class="sl">'+t('langs.title')+'</span>'+
      '<span class="sv">'+ICON_GO+'</span></button>'+
      '<button class="set"' + DO('editName') + '><span class="sl">'+t('set.name')+'</span>'+
      '<span class="sv">'+esc(langName||'—')+ICON_GO+'</span></button>'+
      '<button class="set"' + DO('go', ["words"]) + '><span class="sl">'+t('set.count')+'</span>'+
      '<span class="sv">'+WORDS.length+(has('plus')?'':' / '+FREE_LIMIT)+ICON_GO+'</span></button>'+
      '<button class="set"' + DO('go', ["sound"]) + '><span class="sl">'+t('toc.sound')+'</span>'+
      '<span class="sv">'+addedSnd().length+ICON_GO+'</span></button>'+
      '<button class="set"' + DO('go', ["letters"]) + '><span class="sl">'+t('toc.letters')+'</span>'+
      '<span class="sv">'+LETTERS.length+ICON_GO+'</span></button>'+
      /* Answered once, if ever: wsGuess() reads it off the letters, and the
         letters chapter used to put these five across the top of the screen
         every time it was opened. A row like the rows above it, because it is
         one -- it arrived here as a rail of five tabs among a column of rows,
         which is the sort of thing that looks wrong before it is read. */
      '<button class="set"' + DO('go', ["wsys"]) + '><span class="sl">'+t('ws.kind')+'</span>'+
      '<span class="sv">'+esc(t('ws.k.'+wsys()))+ICON_GO+'</span></button>'+
      '<button class="set" style="margin-top:18px"' + DO('wipeAll') + '>'+
      '<span class="sl bad">'+t('set.wipe')+'</span></button>';
  } else if(id==='acct'){
    body='<button class="set signin google"' + DO('obSignIn') + '><span class="sl">'+MARK_GOOGLE+
      '<span>'+t('ob.signin.google')+'</span></span><span class="sv">'+ICON_GO+'</span></button>'+
      '<button class="set signin apple"' + DO('obSignIn') + '><span class="sl">'+MARK_APPLE+
      '<span>'+t('ob.signin.apple')+'</span></span><span class="sv">'+ICON_GO+'</span></button>'+
      '<div class="sec">'+t('set.plan')+'</div>'+
      '<button class="set"' + DO('go', ["plans"]) + '><span class="sl">'+t('set.plan.cur')+'</span>'+
      '<span class="sv">'+esc(p?p.name:'Free')+ICON_GO+'</span></button>';
  } else if(id==='data'){
    body=(has('plus')
      ? '<button class="set"' + DO('exportCSV') + '><span class="sl">'+t('set.csv.out')+'</span><span class="sv">'+ICON_GO+'</span></button>'+
        '<button class="set"' + DO('openImport') + '><span class="sl">'+t('set.csv.in')+'</span><span class="sv">'+ICON_GO+'</span></button>'+
        '<button class="set"><span class="sl">'+t('set.cloud')+'</span><span class="sv">'+t('set.on')+'</span></button>'
      : '<button class="lock"' + DO('go', ["plans"]) + '><span class="lk">'+ICON_PLUS+'</span>'+
        '<span><span class="lt">'+t('set.lock.csv.t')+'</span><br><span class="ld">'+t('set.lock.csv.d')+'</span></span>'+
        '<span class="tag">PLUS</span></button>'+
        '<button class="lock"' + DO('go', ["plans"]) + '><span class="lk">'+ICON_PLUS+'</span>'+
        '<span><span class="lt">'+t('set.lock.cloud.t')+'</span><br><span class="ld">'+t('set.lock.cloud.d')+'</span></span>'+
        '<span class="tag">PLUS</span></button>');
  } else {
    body=goneBox();
  }
  return '<div class="view">'+navTop('')+'<div class="body">'+body+'</div></div>';
}
function setTheme(v){ SET.theme=v; save(); applyTheme(); render(); }
function setRead(m){ SET.read=m; save(); render(); }
function setUi(l){ SET.ui=l; save(); render(); }
/* Erase everything means everything. It used to empty the words, the
   sentences and the name and stop there, so the sounds you had chosen, the
   letters you had drawn, the characters you had borrowed and every grammar
   decision survived a wipeAll and turned up inside the next language you
   started -- which is not a language you made, it is two of them mixed.
   The storage keys are removed rather than overwritten, so nothing can be
   left behind by a shape this version does not know about. */
function wipeAll(){
  if(!confirm(t('confirm.wipe'))) return;
  /* Throw the stored slices away and read the language back. What an empty
     language IS is langRead() and its four siblings, the same five langOpen()
     calls to bring a different one out -- so this does not describe emptiness
     a second time.

     It used to: eleven assignments written out by hand, which is how ob was
     still being reset to {snd:''} after that field had been replaced by lid,
     and how STG was rebuilt without the rules and ex it has carried since. */
  var si;
  try{
    for(si=0; si<SLICES.length; si++) localStorage.removeItem(langKey(SLICES[si]));
  }catch(e){}
  langRead(); ltRead(); noteRead(); stRead(); tkRead(); sndRead(); sndStart();
  /* the person's settings, back to what a fresh install has -- keeping the two
     that are about them rather than about the language */
  var theme=SET.theme, ui=SET.ui;
  SET=setDefaults(); SET.theme=theme; SET.ui=ui;
  SFONT={built:false, sig:null};
  var css=document.getElementById('sfontcss');
  if(css && css.parentNode) css.parentNode.removeChild(css);
  save(); saveLetters(); saveNotes(); saveStg(); saveTalk(); saveSnd();
  /* and where you were standing is nowhere now */
  viewReset();
  ob={step:0, name:'', mode:'draw', pick:'', strokes:null, ch:'', lid:''};
  GE=null; route='profile'; RENDERED=null;
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
        (cur?'':'<button' + DO('setPlan', [p.id]) + '>'+(p.id==='free'? t('plan.tofree') : t('plan.choose'))+'</button>')+
        '</div>';
    }).join('')+
    '<div class="note" style="margin-top:14px">'+t('plans.note')+'</div>'+
    '</div></div>';
}
function setPlan(id){
  SET.plan=id; save(); render();
  toast(id==='free'? t('toast.plan.free') : t('toast.plan.other', id));
}

