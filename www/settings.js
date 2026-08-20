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
  /* A room of its own, out of the account. An account is who you are and a
     plan is what you may do, and the two are settled by different things.
     「アカウント内にプラン入れるのやめてくんね？」 */
  {id:'plan',  k:'set.plan'},
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
  if(id==='acct')  return t(netSignedIn()? 'set.account.on' : 'set.account.guest');
  if(id==='plan')  return p? p.name : 'Free';
  if(id==='data')  return can('data')? 'CSV' : 'Free';
  return '';
}
function vSet(){
  var id=String(here().a||''), p=PLANS.filter(function(x){return x.id===plan();})[0], S=setSample();
  var body='';
  if(id==='look'){
    /* Three words in a row said nothing about what they did. A phone shows
       this as the screen itself, twice, with a tick under the one you are
       looking at -- so the picture is a picture of Lingua, not a swatch.
       「設定の見た目は外観モードを写真と同じようにして。Linguaの画面のスクショ
       みたいな感じ」 */
    body='<div class="thcards">'+setLookCard('light')+setLookCard('dark')+'</div>'+
      '<button class="set" style="margin-top:14px;border-bottom:none"' +
        DO('setAuto', [SET.theme!=='system']) + '>'+
        '<span class="sl">'+t('theme.system')+'</span>'+
        '<span class="sv"><span class="sw'+(SET.theme==='system'?' on':'')+'">'+
        '<span class="swk"></span></span></span></button>'+
      '';
  } else if(id==='read'){
    /* Down the page, one to a row, ticked -- not three words sharing the
       width of the screen. 「読みの表示も横に切り替えるやつじゃなくて縦に並ぶ
       ようにして」 */
    body=[['ipa',t('read.ipa')],['kana',capFirst(langDef().rdName)],['both',t('read.both')]].map(function(m){
        return '<button class="set"' + DO('setRead', [m[0]]) + '>'+
          '<span class="sl">'+esc(m[1])+'</span>'+
          '<span class="sv">'+(readMode()===m[0]? ICON_TICK : '')+'</span></button>';
      }).join('')+
      '<div class="pvbox" style="margin-top:10px"><span class="pvn">'+t('set.sample')+'</span>'+
        '<span class="pvk">'+esc(readSeq(S.seq))+'</span>'+
        '<button' + DO('sayPh', [S.seq]) + '>'+ICON_SPK+t('f.listen')+'</button></div>'+
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
      '<span class="sv">'+WORDS.length+(can('words')?'':' / '+FREE_LIMIT)+ICON_GO+'</span></button>'+
      '<button class="set"' + DO('go', ["letters"]) + '><span class="sl">'+t('toc.letters')+'</span>'+
      '<span class="sv">'+LETTERS.length+ICON_GO+'</span></button>'+
      /* Answered once, if ever: wsGuess() reads it off the letters, and the
         letters chapter used to put these five across the top of the screen
         every time it was opened. A row like the rows above it, because it is
         one -- it arrived here as a rail of five tabs among a column of rows,
         which is the sort of thing that looks wrong before it is read. */
      '<button class="set"' + DO('go', ["wsys"]) + '><span class="sl">'+t('ws.kind')+'</span>'+
      '<span class="sv">'+esc(t('ws.k.'+wsys()))+ICON_GO+'</span></button>'+
      /* Whether this language has a page anybody else can open. Public is the
         absence of the flag, which is the default the owner chose and the one
         no migration can get wrong. Nothing reads it off this phone yet --
         there is one profile here and it is this person's -- so what this
         switch does today is take the row off their own profile and say so.
         「これは設定から公開非公開もかのう」 */
      '<button class="set" style="border-bottom:none"' + DO('setWldHide', [!wldHidden()]) + '>'+
      '<span class="sl">'+t('wld.public')+'</span>'+
      '<span class="sv"><span class="sw'+(wldHidden()?'':' on')+'">'+
      '<span class="swk"></span></span></span></button>'+
      '';
  } else if(id==='acct'){
    /* Signed in or not, and the way in or out. It said "guest" and offered two
       buttons that did nothing whatever the answer was. */
    body=(netSignedIn()
      ? '<button class="set"><span class="sl">'+t('set.account')+'</span>'+
        '<span class="sv">'+esc(t('set.account.on'))+'</span></button>'+
        '<button class="set"' + DO('setSignOut') + '>'+
        '<span class="sl bad">'+t('set.signout')+'</span></button>'
      : '<button class="set signin apple"' + DO('obSignInApple') + '><span class="sl">'+MARK_APPLE+
        '<span>'+t('ob.signin.apple')+'</span></span><span class="sv">'+ICON_GO+'</span></button>'+
        '<button class="set signin google"' + DO('obSignInGoogle') + '><span class="sl">'+MARK_GOOGLE+
        '<span>'+t('ob.signin.google')+'</span></span><span class="sv">'+ICON_GO+'</span></button>'+
        '<button class="set"' + DO('setMail') + '><span class="sl">'+t('ob.signin.mail')+'</span>'+
        '<span class="sv">'+ICON_GO+'</span></button>')+
      /* The plan is not in here. An account is who you are; a plan is what
         you may do, and they are answered by different things -- the account
         by a server, the plan by whatever settles it. It is a room of its
         own on the settings list. 「アカウント内にプラン入れるのやめてくんね？」 */
      /* Erasing what is on this phone is the person's, beside signing out --
         it sat at the foot of the language room, which is the one place it
         is not about. Signing out leaves everything where it is; this does
         not, so it says so and asks. */
      '<button class="set" style="margin-top:18px;border-bottom:none"' + DO('wipeAll') + '>'+
      '<span class="sl bad">'+t('set.wipe')+'</span></button>';
  } else if(id==='plan'){
    /* One row, and it is the door to the plans. What a plan IS belongs on the
       plans page; this says which one and goes there. */
    return '<button class="set" style="border-bottom:none"' + DO('go', ["plans"]) + '>'+
      '<span class="sl">'+t('set.plan.cur')+'</span>'+
      '<span class="sv">'+esc(p?p.name:'Free')+ICON_GO+'</span></button>';
  } else if(id==='data'){
    /* What is on the disk, for everybody. Keeping a language is not a paid
       feature -- charging for not losing somebody's work would mean
       answering, on the day it is lost, whether they had paid -- so this
       sits above the lock rather than behind it. */
    /* Asked for once, on the way in. bkList() renders when the answer comes
       back, and BKLIST stops being null then, so this does not loop.
       viewReset() puts it back to null, which is what makes leaving the room
       and returning ask again. */
    if(BKLIST===null) bkList();
    body='<div class="sec">'+t('bk.h')+'</div>'+bkListHTML()+
      '<div class="sec" style="margin-top:18px">'+t('set.data')+'</div>'+
      (can('data')
      /* No cloud row. It said "Cloud sync -- On" to anybody on Plus and did
         nothing at all: there is no code anywhere that sends a language to a
         server. A switch that reports a state the app does not have is worse
         than no switch, because somebody will trust it and stop making
         backups. It comes back when the thing behind it does. */
      ? '<button class="set"' + DO('exportCSV') + '><span class="sl">'+t('set.csv.out')+'</span><span class="sv">'+ICON_GO+'</span></button>'+
        '<button class="set"' + DO('openImport') + '><span class="sl">'+t('set.csv.in')+'</span><span class="sv">'+ICON_GO+'</span></button>'
      : '<button class="lock"' + DO('go', ["plans"]) + '><span class="lk">'+ICON_PLUS+'</span>'+
        '<span><span class="lt">'+t('set.lock.csv.t')+'</span><br><span class="ld">'+t('set.lock.csv.d')+'</span></span>'+
        '<span class="tag">PLUS</span></button>');
  } else {
    body=goneBox();
  }
  return '<div class="view">'+navTop('')+'<div class="body">'+body+'</div></div>';
}
/* One card: a small Lingua in that theme, its name, and a tick. The colours
   are written out rather than taken from the variables, because the light
   card has to look light while the app around it is dark -- that is the
   whole of what it is for. */
function setLookCard(th){
  var on=(SET.theme===th);
  return '<button class="thcard'+(on?' on':'')+'"' + DO('setTheme', [th]) + '>'+
    '<span class="thmini '+th+'"><span class="thbar"></span>'+
      '<span class="thl w1"></span><span class="thl w2"></span>'+
      '<span class="thl w3"></span><span class="thl w2"></span></span>'+
    '<span class="thnm">'+t('theme.'+th)+'</span>'+
    '<span class="thtick">'+ICON_TICK+'</span></button>';
}
function setTheme(v){ SET.theme=v; save(); applyTheme(); render(); }
/* Following the phone, or not. Turning it off has to land on one of the two
   cards, and the honest one is whichever the phone was already showing --
   otherwise the screen changes colour at the moment somebody says "stop
   changing colour". */
function setAuto(on){
  if(on){ setTheme('system'); return; }
  var dark=!!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  setTheme(dark? 'dark' : 'light');
}
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
  /* after the plan is back to free, because that is what decides whether the
     language gets the twenty-eight slots at all */
  ltStart();
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
/* What a person is told the day a plan ends, and it is told once -- capLapse()
   in core.js decides when, and this is only what it says.

   A sheet rather than a toast: a toast is for something you may miss, and the
   whole reason this exists is that the app is about to look as though work has
   gone. It is the app's own sheet rather than the browser's alert() because
   nothing in Lingua has ever used one, and a native dialog in the middle of
   a launch reads as an error. */
function openCapLapse(){
  openForm('lapse:', t('cap.lapse.h'),
    '<div class="note" style="margin-bottom:18px">'+t('cap.lapse.d')+'</div>'+
    '<button class="btn" style="width:100%"' + DO('goPlans') + '>'+
      esc(t('up.cta'))+'</button>'+
    '<button class="btn ghost" style="width:100%;margin-top:10px"' + DO('back') + '>'+
      esc(t('cap.lapse.ok'))+'</button>');
}
FORM_OPEN.lapse=function(){ openCapLapse(); };
/* Monthly or yearly, which is where you are standing on this screen rather
   than anything the account has -- viewReset() drops it. */
var plansYr=false;
function setPlansTerm(yr){ plansYr=!!yr; render(); }
/* One plan, drawn.

   The three were one shape repeated three times: same box, same weight, same
   button, one price each and no year. Three identical cards do not say what
   the difference between them IS, which is the whole of what somebody is
   deciding. 「全部同じように並んでてどうやってうるんや」

   Free is not one of the cards now. It is what everybody already has, so it
   is a line at the top saying what it is -- putting it beside the two that
   cost money made "nothing" look like an option being sold.

   What is left is two, and they are not the same either: Plus is where the
   making side opens, so it is the one with the weight, and Studio is written
   as what it ADDS to Plus rather than as a second complete list. */
function planCard(p){
  var cur=(p.id===plan()), yr=plansYr;
  return '<div class="plan'+(cur? ' cur':'')+(p.id==='plus'? ' lead':'')+'">'+
    '<div class="ph2"><span class="pn">'+p.name+'</span>'+planBadge(p.id)+
      (cur? '<span class="badge">'+t('plan.cur')+'</span>' : '')+'</div>'+
    '<div class="pprice"><span class="pp">'+t(yr? p.yr : p.mo)+'</span>'+
      '<span class="pper">'+t(yr? 'plan.per.yr' : 'plan.per.mo')+'</span></div>'+
    (yr && p.each? '<div class="peach">'+esc(t('plan.each', t(p.each)))+'</div>' : '')+
    '<div class="pl">'+p.lines.map(function(l){
      return '<span class="pli">'+ICON_TICK+'<span>'+t(l)+'</span></span>';
    }).join('')+'</div>'+
    (cur? '' : '<button' + DO('setPlan', [p.id]) + '>'+t('plan.take', p.name)+'</button>')+
    '</div>';
}
function vPlans(){
  var free=PLANS[0], paid=PLANS.slice(1), on=(plan()==='free');
  return '<div class="view">'+
    navTop('')+
    '<div class="body">'+
    /* Monthly or yearly, above both cards, because it is one choice about
       both of them and not a choice inside each. */
    '<div class="segs plseg">'+
      '<button class="seg'+(plansYr? '':' on')+'"' + DO('setPlansTerm', [false]) + '>'+
        esc(t('plan.term.mo'))+'</button>'+
      '<button class="seg'+(plansYr? ' on':'')+'"' + DO('setPlansTerm', [true]) + '>'+
        esc(t('plan.term.yr'))+'<span class="plsave">'+esc(t('plan.save'))+'</span></button>'+
    '</div>'+
    paid.map(planCard).join('')+
    /* Free, at the foot: what you already have, and the way back to it. */
    '<div class="plfree'+(on? ' cur':'')+'">'+
      '<div class="ph2"><span class="pn">'+free.name+'</span>'+
        (on? '<span class="badge">'+t('plan.cur')+'</span>' : '')+'</div>'+
      '<div class="pl">'+free.lines.map(function(l){
        return '<span class="pli">'+ICON_TICK+'<span>'+t(l)+'</span></span>';
      }).join('')+'</div>'+
      (on? '' : '<button class="btn ghost"' + DO('setPlan', ["free"]) + '>'+
        esc(t('plan.tofree'))+'</button>')+
    '</div>'+
    '</div></div>';
}
function setPlan(id){
  SET.plan=id; save(); render();
  toast(id==='free'? t('toast.plan.free') : t('toast.plan.other', id));
}


/* Signing out leaves everything where it is: the languages are on the phone
   and the account is on the server, and coming back finds both. Only the pair
   of tokens goes. */
function setSignOut(){ netOut(); toast(t('set.signout.done')); render(); }
/* The mail door, reached from settings rather than from the door itself. It is
   the same screen -- there is one way to sign in with an address and it is
   written once -- so this only says which face of it to open and puts the app
   back where onboarding shows it. */
/* The sign-in screen lives inside the onboarding and nowhere else, so
   opening it from here means saying the onboarding is unfinished. For
   somebody who already has a language that is a lie, and the app used to
   make good on it: sign in, and you were walked through drawing an alphabet
   you already had. obBackTo() is what says the lie is temporary and where to
   undo it. */
function setMail(){ obBackTo('set', 'acct'); OBM.mode='in'; OBM.msg=''; SET.done=false; save(); render(); }
