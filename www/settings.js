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
/* The two documents, in the account room and under everything else in it --
   not on the settings list itself, and not in the onboarding.

   Small, side by side, and NOT rows. They were rows the same height as
   "Sign out" and "Erase everything", which put a thing you read in the
   column of things you press. 「プライバシーポリシーとか同じ高さ同じ行で
   並ぶのキモいな」「小さく並べよ」 Apple asks only
   that they be reachable from inside the app, and nobody has ever read one on
   their first day: a contract in front of somebody who has not seen the app
   yet is a door with a contract on it.
   「Xとかインスタもオンボーディングには出してなくね？ふつうに設定とかの
   見えづらいとこに追いとけばいいよ」「もっと見えにくいとこに入れてくれ」

   Links and not buttons, pointing at the published pages: one copy of a
   contract, so a change to either is one edit, and the version somebody
   agreed to is the version that is up. */
function docRows(){
  return '<div class="docs">'+
    '<a href="'+esc(DOC_TERMS)+'" target="_blank" rel="noopener">'+
      esc(t('set.terms'))+'</a>'+
    '<span class="docdot">\u00b7</span>'+
    '<a href="'+esc(DOC_PRIVACY)+'" target="_blank" rel="noopener">'+
      esc(t('set.privacy'))+'</a>'+
    '</div>';
}
/* Where they are, and it is the site rather than in here. One copy, published,
   and a change to either is one edit -- a copy inside the app would be a
   second version of a contract, which is the one kind of duplicate that
   cannot be allowed to drift. */
var DOC_TERMS='https://tokinets.com/lingua/terms.html';
var DOC_PRIVACY='https://tokinets.com/lingua/privacy.html';
/* The order, and one thing about it is deliberate rather than tidy.
   「Your language」 and 「Display language」 are one word apart and are two
   completely different questions -- the language you are BUILDING, and the
   language the app SPEAKS. Side by side they were a coin toss.
   「二つ似てるから間違えないように」

   So the language somebody is building is directly under the plan, at the
   top, where the work is; and the interface's language is at the foot of the
   list, on its own, where a thing you set once belongs. */
/* `off` means the room exists and is not a row on this list. There is one:
   changing a password, which is reached from inside the account room and only
   by somebody who HAS one. It is in this list rather than beside it because
   this list is what says a room exists -- the checks walk it, and a room that
   is not in it is a room nothing ever renders. */
var SETS=[
  {id:'pw',    k:'set.pw', off:true},
  {id:'lang',  k:'set.lang'},
  {id:'look',  k:'set.look'},
  {id:'read',  k:'set.reading'},
  {id:'acct',  k:'set.account'},
  {id:'data',  k:'set.data'},
  {id:'ui',    k:'set.display'}
];
/* Which account this is, in one row. Apple and Google are names and are not
   translated, and there is no address of ours to show for either -- what
   Apple hands over may be a relay address, and neither is something somebody
   signs in WITH here.

   An email account is the row the other way round: the address IS the
   answer, so the row is called Email and the address is what it says. Two
   rows -- one saying "Email" and one saying "Email: the address" -- was the
   same word twice, which was the first way this was written.

   A token this phone could not read falls through to the plain word, which
   is a state and not a failure. */
function setWhoRow(){
  var h=netHow(), m=netMail(), lab=t('set.account'), val=t('set.account.on');
  if(h==='apple')  val='Apple';
  else if(h==='google') val='Google';
  else if(m){ lab=t('set.mail'); val=m; }
  return '<button class="set"><span class="sl">'+esc(lab)+'</span>'+
    '<span class="sv">'+esc(val)+'</span></button>';
}
/* Changing a password, which is two calls and not one. Supabase will set a
   new password for anybody holding a session -- so a phone somebody picked up
   off a table would be enough. The old one is asked for and CHECKED first, by
   signing in with it, which is the only way to check it: there is no endpoint
   that answers "is this the password".

   `now` is not confirmed twice. A field typed twice is how a form apologises
   for hiding what was typed, and this one does not hide it. */
var PWF={old:'', now:'', busy:false, msg:''};
function setPwSet(k, v){ PWF[k]=String(v||''); }
function setPwGo(){
  if(PWF.busy) return;
  if(!PWF.old || !PWF.now){ PWF.msg=t('net.needpw'); render(); return; }
  PWF.busy=true; PWF.msg=''; render();
  netSignIn(netMail(), PWF.old, function(){
    netSetPass(PWF.now, function(){
      PWF={old:'', now:'', busy:false, msg:''};
      back(); toast(t('set.pw.done'));
    }, function(d, st){ PWF.busy=false; PWF.msg=netWhy(d, st); render(); });
  }, function(d, st){ PWF.busy=false; PWF.msg=netWhy(d, st); render(); });
}
function vSettings(){
  var p=PLANS.filter(function(x){return x.id===plan();})[0];
  return '<div class="view">'+navTop('')+'<div class="body">'+
    /* The plans, first, and with no room in between. A plan is not one of
       the questions this list asks -- it is the one page in the app that has
       something to sell, and it sat behind a room of its own holding a single
       row that said the plan's name and went to the plans page, so reaching
       it meant crossing a page that was empty apart from the way out of it.
       An account is who you are and a plan is what you may do, which is why
       it is not in the account room 「アカウント内にプラン入れるのやめてくんね？」
       -- that is an argument for it being its own thing, not for it being its
       own room. 「プランを設定の中に入れると課金導線がカスだから一番上置くとか」 */
    '<button class="set"' + DO('go', ["plans"]) + '>'+
      '<span class="sl">'+esc(t('set.plan'))+'</span>'+
      '<span class="sv">'+esc(p? p.name : 'Free')+ICON_GO+'</span></button>'+
    SETS.filter(function(x){ return !x.off; }).map(function(x){
      return '<button class="set"' + DO('go', ["set", x.id]) + '>'+
        '<span class="sl">'+esc(t(x.k))+'</span>'+
        '<span class="sv">'+esc(setSummary(x.id, p))+ICON_GO+'</span></button>';
    }).join('')+
    /* And, for the one account that answers them, the reports. It is not one
       of the six questions this list asks and it is not everybody's row, so
       it sits under them rather than among them. NET_STAFF is false until the
       server has said otherwise, which is the right way round: the row that
       is missing is the row nobody could have used anyway. */
    (NET_STAFF
      ? '<button class="set"' + DO('goMod') + '>'+
          '<span class="sl">'+esc(t('mod.title'))+'</span>'+
          '<span class="sv">'+ICON_GO+'</span></button>'
      : '')+
    '</div></div>';
}
/* What each room answers, said on its door, so most questions are answered
   without opening anything. */
function setSummary(id, p){
  if(id==='look')  return t('theme.'+(SET.theme||'system'));
  if(id==='read')  return readMode()==='kana'? capFirst(langDef().rdName) : t('read.'+readMode());
  if(id==='ui')    return LANG[uiLang()].label;
  if(id==='lang')  return langName||'—';
  if(id==='acct')  return t(netMember()? 'set.account.on' : 'set.account.guest');
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
        swtHTML(SET.theme==='system')+'</button>'+
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
      '<span class="sv">'+WORDS.length+(can('words')?'':' / '+wordCap())+ICON_GO+'</span></button>'+
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
      '<button class="set"' + DO('setWldHide', [!wldHidden()]) + '>'+
      '<span class="sl">'+t('wld.public')+'</span>'+
      swtHTML(!wldHidden())+'</button>'+
      /* And whether it can be taken away, which is a different question and
         only asked of a page anybody can open. What both of them mean is
         behind the `?` in the bar, which is where an explanation goes. */
      (wldHidden()? '' :
        '<button class="set" style="border-bottom:none"' + DO('setWldDl', [!wldDl()]) + '>'+
        '<span class="sl">'+t('wld.dl')+'</span>'+
        swtHTML(wldDl())+'</button>')+
      '';
  } else if(id==='pw'){
    /* Two fields and a button. The same shape as the door's, because it is
       the same act -- and it is a page you went to rather than a sheet over
       where you were, which is what every other room here is. */
    body='<div class="field"><input id="set-pwo" type="password" '+
        'value="'+esc(PWF.old)+'" placeholder="'+esc(t('set.pw.old'))+'" '+
        'autocomplete="current-password" autocapitalize="none" autocorrect="off" '+
        'spellcheck="false"' + IN('setPwSet', ['old']) + '></div>'+
      '<div class="field"><input id="set-pwn" type="password" '+
        'value="'+esc(PWF.now)+'" placeholder="'+esc(t('ob.mail.newpw.ph'))+'" '+
        'autocomplete="new-password" autocapitalize="none" autocorrect="off" '+
        'spellcheck="false"' + IN('setPwSet', ['now']) + '></div>'+
      (PWF.msg? '<div class="obmsg">'+esc(PWF.msg)+'</div>' : '')+
      '<button class="btn ghost" style="margin-top:18px"' + DO('setPwGo') +
        (PWF.busy? ' disabled':'') + '>'+
        t(PWF.busy? 'ob.mail.wait' : 'set.pw.go')+'</button>';
  } else if(id==='acct'){
    /* Signed in or not, and the way in or out. It said "guest" and offered two
       buttons that did nothing whatever the answer was. */
    body=(netMember()
      ? setWhoRow()+
        /* Only an account that HAS a password. Apple and Google keep theirs;
           there is nothing on our side to change, and a row that opened a
           screen saying so would be the app explaining itself. */
        (netHow()==='email'
          ? '<button class="set"' + DO('go', ["set", "pw"]) + '>'+
            '<span class="sl">'+t('set.pw')+'</span>'+
            '<span class="sv">'+ICON_GO+'</span></button>'
          : '')+
        '<button class="set"' + DO('setSignOut') + '>'+
        '<span class="sl bad">'+t('set.signout')+'</span></button>'
      : '<button class="set signin apple"' + DO('obSignInApple') + '><span class="sl">'+MARK_APPLE+
        '<span>'+t('ob.signin.apple')+'</span></span><span class="sv">'+ICON_GO+'</span></button>'+
        '<button class="set signin google"' + DO('obSignInGoogle') + '><span class="sl">'+MARK_GOOGLE+
        '<span>'+t('ob.signin.google')+'</span></span><span class="sv">'+ICON_GO+'</span></button>'+
        '<button class="set"' + DO('setMail') + '><span class="sl">'+t('ob.signin.mail')+'</span>'+
        '<span class="sv">'+ICON_GO+'</span></button>')+
      /* Under both faces of the room, because somebody who has never signed
         in has to be able to read them too. */
      /* The plan is not in here. An account is who you are; a plan is what
         you may do, and they are answered by different things -- the account
         by a server, the plan by whatever settles it. It is a room of its
         own on the settings list. 「アカウント内にプラン入れるのやめてくんね？」 */
      /* Erasing what is on this phone is the person's, beside signing out --
         it sat at the foot of the language room, which is the one place it
         is not about. Signing out leaves everything where it is; this does
         not, so it says so and asks.

         There were two of these and nobody could tell them apart: "delete
         account" reached the server and left the phone, "erase this phone"
         did the opposite, and the two sat either side of a row about
         something else. 「サインアウト、スイッチアカウントはまあそのまま
         使える。データを消去するで全部消えるでいいんじゃない」

         One now, and it means what it says: the account, everything of yours
         on the server, every language on this phone, and the backup files.
         Signing out is the other button and is the one that changes nothing.
         Alone at the foot with a gap above it, which is where a phone puts
         the thing that cannot be undone. */
      '<button class="set"' + DO('wipeAll') + '>'+
      '<span class="sl bad">'+t('set.wipe')+'</span></button>'+
      /* The two documents, at the very foot of this room and nowhere else in
         the app. Apple asks only that they be reachable from inside it, and
         nobody reads one on their first day. 「アカウントの一番下やな」

         Under both faces of the room, because somebody who has never signed
         in has to be able to read them too. Links and not buttons: they are
         the published pages, so a change to either is one edit and the
         version somebody agreed to is the version that is up. */
      docRows();
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
  /* The account room is the one that has something pinned to the FOOT of it,
     so its body is the one that is as tall as the screen. Everywhere else a
     body is exactly as tall as what is in it. */
  return '<div class="view">'+navTop('', (id==='lang'? helpQ('pub') : ''))+
    '<div class="body'+(id==='acct'? ' tall' : '')+'">'+body+'</div></div>';
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
/* Delete account: everything this phone holds, and the tokens with it.

   It used to empty the words, the sentences and the name and stop there, so
   the sounds you had chosen, the letters you had drawn, the characters you
   had borrowed and every grammar decision survived a wipeAll and turned up
   inside the next language you started -- which is not a language you made,
   it is two of them mixed. The storage keys are removed rather than
   overwritten, so nothing can be left behind by a shape this version does
   not know about.

   The tokens go too. They did not, and "delete everything" that left you
   signed in was the one thing on the screen the sentence did not cover --
   you erased the phone and the app still greeted you by name. netOut() is
   the same two lines signing out uses; nothing is asked of the server,
   which is what it was already true of. */
/* Everything, and it is the only thing in this app that means that. The
   account on the server with every post, photograph and recording on it; the
   languages on this phone; the backup files in Documents that outlive the app
   itself. Asked once and not twice -- a second "are you sure" is how a person
   learns to press through them -- and the one question is the whole sentence.

   The order matters and it is the safe one. The server is told FIRST and the
   phone is emptied whatever it answers: somebody who asked to be deleted must
   be deleted, and a phone that kept its languages because the network was bad
   would be the button lying in the direction that cannot be corrected later.
   The other order leaves an account nobody can reach and nothing to reach it
   from. */
function wipeAll(){
  if(!confirm(t('confirm.wipe'))) return;
  if(netSignedIn()) netDropMe(wipeHere, wipeHere);
  else wipeHere();
}
function wipeHere(){
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
  langRead(); ltRead(); ntRead(); stRead(); sndRead(); sndStart();
  /* the person's settings, back to what a fresh install has -- keeping the
     three that are about them rather than about the language.

     The plan is the third, and it was not always. Erasing what is on this
     phone is not cancelling a subscription, and once the plan moved to the
     Keychain a wipe that set it to free was free for this session and paid
     again at the next launch -- the file it used to be reset in no longer
     holds it. Somebody who is paying stays paid, which is also the only
     answer that does not depend on which of the two copies is read first. */
  var theme=SET.theme, ui=SET.ui, pl=SET.plan;
  SET=setDefaults(); SET.theme=theme; SET.ui=ui; SET.plan=pl;
  netOut();
  /* and the twenty-eight slots, for a language that is empty now and on a
     plan that adds no letters of its own */
  ltStart();
  SFONT={built:false, sig:null};
  var css=document.getElementById('sfontcss');
  if(css && css.parentNode) css.parentNode.removeChild(css);
  save(); saveLetters(); saveNotes(); saveStg(); saveSnd();
  /* And the copies in Documents, which are the ones that outlive the app.
     Last, and after the save above rather than before it: a save writes a
     fresh backup out, so dropping the files first would leave one behind. */
  bkDropAll();
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
/* ---- the plans, side by side ------------------------------------------
   Three pages that slide, with the next one showing at the edge.
   「横並びにして。ページは上に三つあるんじゃなくてスライドで変わるタイプで
     隣のプランが少しはみ出して見える感じ」 -- OWNER DECISION, 2026-08-23.

   The tabs at the top are gone with the toggle they switched: the month and
   the year stand SIDE BY SIDE on each page now, and the year says what it
   saves. 「値段はマンスリー、イヤーを並べてイヤーは何パーオフかを書く」
   That also makes the price the button -- pressing a price buys that term,
   which is one press where the toggle was two.

   Every box is inline here and none of it is a box: no border, no corner, no
   panel. www/index.html holds the stylesheet and belongs to another session
   today, so what a class would say is said on the element; when that file is
   free these become `.plrail` and `.plpage`. The peeking edge is what makes
   the row readable as more-to-the-side, and it is `flex-basis` plus
   `scroll-snap`, nothing else. */
/* A mark per line, because a column of identical ticks says nothing about
   what is in it. 「なんかテキストだけだと味気ないな」 -- the marks are the
   app's own: the pen it draws letters with, the speaker a sound is heard
   through, the stack of pages the making side wears in the tab bar, the
   keyboard, the badge itself. Nothing new is invented for a price list.

   Keyed by the STRING, not by position: a line moved between plans keeps its
   mark, and a line added without one shows a tick, which is what every line
   showed before this. */
function planMark(key){
  var m={ 'plan.free.1':ICON_PEN,  'plan.free.2':ICON_LINE, 'plan.free.3':ICON_KEYS,
          'plan.free.4':TAB_ICON.feed,
          'plan.plus.1':ICON_ADD,  'plan.plus.2':ICON_SPK,  'plan.plus.3':ICON_LTR,
          'plan.plus.4':ICON_LINE, 'plan.plus.5':ICON_KEYS,
          'plan.pro.1':ICON_TICK,  'plan.pro.2':ICON_LINE,  'plan.pro.3':ICON_KEYS,
          'plan.pro.4':TAB_ICON.build, 'plan.pro.5':ICON_SHARE,
          'plan.badge':MARK_PLUS };
  return m[key] || ICON_TICK;
}
function planPage(p){
  var cur=(p.id===plan()), free=(p.id==='free');
  return '<div class="plpage">'+
    '<div class="plname"><span class="pn">'+esc(p.name)+'</span>'+planBadge(p.id)+
      (cur? '<span class="badge">'+esc(t('plan.cur'))+'</span>' : '')+'</div>'+
    planPrice(p, free)+
    '<div class="pllines">'+
      p.lines.map(function(l){
        return '<span class="pli">'+planMark(l)+'<span>'+t(l)+'</span></span>';
      }).join('')+
    '</div>'+
  '</div>';
}
/* The two terms, side by side, and each is the button that buys it -- one
   press where a chooser and a Buy would be two.

   **Neither number is ours on a phone.** `storeCost` is what the App Store
   charges, in the person's own currency and formatted the way their region
   formats money, and `storeOff` is the saving worked out from the two amounts
   Apple gave -- because Apple rounds every storefront separately and a year
   that is 17% off in dollars is not 17% off in yen. What www/i18n says is the
   fallback and only the fallback: it is what a browser shows, what a
   screenshot shows, and what shows for a product not yet made.

   The saving is a number on the plan and never arithmetic on two formatted
   prices: `$9.99` is a STRING in ten languages, and percentages worked out
   from strings are how an app comes to say "17% off" about numbers that are
   not those.

   Free has the same row and no buttons in it: it costs nothing, and the row
   is what keeps the five lines below it from jumping as pages slide. */
function planPrice(p, free){
  function term(yr){
    var cost=storeCost(p.id, yr) || t(yr? p.yr : p.mo);
    var off=storeOff(p.id) || p.off;
    var body='<span class="pp">'+esc(cost)+'</span>'+
      '<span class="pper">'+esc(t(yr? 'plan.per.yr' : 'plan.per.mo'))+'</span>'+
      ((yr && off)? '<span class="plsave">'+esc(t('plan.off', off))+'</span>' : '');
    return free? (yr? '' : '<span class="plterm no">'+body+'</span>')
               : '<button class="btn ghost plterm"' + DO('setPlan', [p.id, yr]) +
                 '>'+body+'</button>';
  }
  return '<div class="plterms">'+term(false)+term(true)+'</div>';
}
function vPlans(){
  /* The one place that asks. It answers a moment later and redraws, so the
     typed prices are what is on screen for that moment and the App Store's
     are what is on screen after it. */
  storeAsk();
  return '<div class="view">'+
    navTop('')+
    '<div class="plrail">'+PLANS.map(planPage).join('')+'</div>'+
    /* Apple wants somewhere to press for both, and neither is a purchase:
       restoring reads what this Apple ID already holds, and cancelling is
       Apple's own sheet.
       「無料に戻すってボタン意味わからないからそこを購入を復元に、
         サブスクリプションを解除するをその下に小さめに入れよう」 */
    '<div class="plfoot"><button class="btn ghost" style="width:100%"' +
      DO('storeRestore') + '>'+esc(t('plan.restore'))+'</button></div>'+
    '<div class="plfoot2"><button class="btn ghost" style="width:100%"' +
      DO('storeManage') + '>'+esc(t('plan.cancel'))+'</button></div>'+
  '</div>';
}
function setPlan(id, yearly){
  if(id!=='free' && storeOn() && storeBuy(storeId(id, yearly))) return;
  SET.plan=id; planKeep(id); save(); render();
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
   you already had. obDoor() is what says the lie is temporary and where to
   undo it, and it is what every other way to the door goes through now. */
function setMail(){ obDoor('set', 'acct'); }
