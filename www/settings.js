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
/* Forgotten it. The road is the door's -- the address, six digits in the
   mail, then the new password (obMailForgot -> obResetGo -> obNewPwGo in
   www/onboard.js) -- and it is opened rather than copied: a second mail-and-
   code road in this file would be two places that both have to be right on
   the day Supabase's template changes, and only one of them would be found.

   obDoor() is what every other opening of it uses (setMail() below, obNeed()
   in onboard.js) and it does the four things by itself: where to come back
   to, the flag, the face, the render. Then obMailGo('forgot') turns that
   face from "sign in" to "what is your address". Two renders where one would
   do, and that is the price of calling the entrance instead of writing out
   what is behind it.

   Where you are standing is where the door sends you back to, which here is
   this screen. That is onboard.js's sentence and not a choice made here.

   The address is put in because this phone knows it -- it is the account
   whose password is being changed, and setPwGo() above already asks
   netMail() for it. A signed-in person being asked to type their own address
   is the app pretending not to know. */
function setPwForgot(){
  var h=here();
  OBM.em=netMail();
  obDoor(h && h.r, h && h.a);
  obMailGo('forgot');
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
    /* The reports do NOT hang here. 「設定の通報ボタン消せ」OWNER 2026-08-26.

       They are still answered -- vAdmin() draws the same queue with the same
       modRow(), and the way in is the seven presses on the heading. This row
       was the second door to one screen, and a staff row in a list of six
       ordinary questions is also the one thing on this page that tells
       whoever is holding the phone that there is a staff at all. */
    '</div></div>';
}
/* What each room answers, said on its door, so most questions are answered
   without opening anything. */
function setSummary(id, p){
  if(id==='look')  return t('theme.'+(SET.theme||'system'));
  if(id==='ui')    return LANG[uiLang()].label;
  if(id==='lang')  return langName||'—';
  if(id==='acct')  return t(netSignedIn()? 'set.account.on' : 'set.account.guest');
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
      /* The last row of this room, so it carries no line under it. It became
         the last one when the two switches below it went: whether the page is
         public, and whether it can be downloaded. Both are on the page's own
         editing face now -- the public one is the same `setWldHide`, and the
         download one is asked of each SECTION rather than of the whole page
         (`setWldSecDl`). 「ここの言語ページを公開すると単語と文字 dl できるようにするは
         いらない。wiki でできるから。」OWNER 2026-08-26.

         `world().dl` is still there and still read: it is what a section that
         has never been touched falls back to (`wldSecDl`). Nothing was
         removed from anybody's file -- what went is the second place to set
         it, which is the thing that was wrong. */
      '<button class="set" style="border-bottom:none"' + DO('go', ["wsys"]) + '><span class="sl">'+t('ws.kind')+'</span>'+
      '<span class="sv">'+esc(t('ws.k.'+wsys()))+ICON_GO+'</span></button>'+
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
        t(PWF.busy? 'ob.mail.wait' : 'set.pw.go')+'</button>'+
      /* And the way out for somebody who does not know the old one -- which
         is most of the reason a person opens a password screen at all. It
         existed and it was on the DOOR only: this form asks for the current
         password and had no answer to "I do not have it", so the only road
         to the mail-and-code road was to sign out first. Nothing new is
         built here; setPwForgot() opens the door's own forgot face.

         `.obskip` and the door's own key, because it is the door's own row.
         Not a second `.btn.ghost`: two gold buttons one under the other say
         the same thing twice, and this one is the quieter half. */
      '<button class="obskip"' + DO('setPwForgot') + '>'+
        t('ob.mail.to.forgot')+'</button>';
  } else if(id==='acct'){
    /* Signed in or not, and the way in or out. It said "guest" and offered two
       buttons that did nothing whatever the answer was. */
    body=(netSignedIn()
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
      /* The plan is not in here. An account is who you are; a plan is what
         you may do, and they are answered by different things -- the account
         by a server, the plan by whatever settles it. It is a room of its
         own on the settings list. 「アカウント内にプラン入れるのやめてくんね？」 */
      /* THREE rows that take something away, and they take three different
         things. 「端末のデータはSNSは消えないで言語データが全部消えるの」
         OWNER 2026-08-28.

           sign out            nothing goes. The keys come off this phone
           erase this phone    every language ON THIS PHONE goes. The timeline
                               does not, and the server is not touched at all
           delete account      everything goes. Everything

         The middle one had no button. It used to, and it was taken out on the
         day the other two were told apart -- 「サインアウト、スイッチアカウント
         はまあそのまま使える。データを消去するで全部消えるでいいんじゃない」 --
         because at the time the pair of them said the same words in different
         orders and nobody could tell which was which. That is not what this
         is: the account and the languages on this phone are two different
         things to be rid of, and there was only one button for both, so
         somebody who wanted their phone tidy had to delete their account.

         Order is the owner's, and it is also the order of how much is lost.
         Signing out is the row above, inside the signed-in half, because
         there is nothing to sign out of otherwise; these two are here whoever
         is holding the phone. */
      '<button class="set"' + DO('wipeLangs') + '>'+
      '<span class="sl bad">'+t('set.wipe.langs')+'</span></button>'+
      '<button class="set"' + DO('wipeAll') + '>'+
      '<span class="sl bad">'+t('set.wipe')+'</span></button>'+
      /* NO DOCUMENTS HERE. They were at the foot of this room 「アカウントの
         一番下やな」and they are on the plans screen now, where Apple asks for
         them (Guideline 3.1.2, § planTerms) -- 「設定のアカウントの利用規約と
         プライバシーポリシー消しといて。課金の方にあるからいらん」 OWNER
         2026-09-01. One copy of a contract and one place that links to it;
         two places is two things to keep in step. `docRows()` is unchanged
         and is the plans screen's now. */
      '';
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
      ? '<button class="set"' + DO('openImport') + '><span class="sl">'+t('set.csv.in')+'</span><span class="sv">'+ICON_GO+'</span></button>'
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
/* Erase the languages on this phone, and nothing else.
   「端末のデータはSNSは消えないで言語データが全部消えるの」OWNER 2026-08-28.

   The one below erases everything and this one is not a smaller version of
   it. They are told apart by what they DO NOT touch, and the list is the
   whole of the difference:

     the server            not touched. Not one net* call from here. The
                           posts, the photographs, the recordings, the
                           follows and the profile are still there, and the
                           languages are still there too (netLangSync()), so
                           this is undone by the next sync as often as not
     lingua.set            not touched. The theme, the interface language and
                           the plan are the PERSON's and none of them is a
                           language
     lingua.me             not touched, and neither are the posts or the
                           drafts. 「SNSは消えない」is that sentence
     Documents/            not touched. The backup files are what this is
                           recoverable FROM, and whether they should go is
                           not something the owner has said

   So the keys are NAMED rather than counted, deliberately. A key added
   tomorrow belongs in this list only if it is a LANGUAGE's, and the list of
   what a language
   is made of already exists and is already kept in step: SLICES, which
   bkPack() walks to write a backup. A count here would take the drafts and
   the timeline's copy with it on the day somebody adds a key, silently.

   Every language, not the open one. langKeyOf() is what names a language
   that is not open, which is what it was given its first argument for.

   Then a first run out of the same functions a first run uses, and this half
   is not tidying up: the globals still hold the language that was just
   erased, and the next save() writes them straight back out under the new
   id. langFirst() mints a new one for the same reason wipeHere() does --
   with the old id kept, ltStart() rebuilds twenty-eight letters under it and
   the language is back. */
/* THIS LANGUAGE, AND EVERYTHING MADE IN IT.
   「この言語を削除で言語の制作のものは全部なくなるってずっと言ってんだろ」
   OWNER 2026-09-03. The middle of the three rows the owner has asked for and
   the only three there are: sign out, delete this language, delete the
   account.

   IT USED TO BE 「端末のデータを消す」 AND TOOK EVERY LANGUAGE ON THE PHONE,
   whoever they belonged to. Nobody asked for that row: 2026-08-26 had already
   made the deleting rows ONE 「アカウント消したら全部消えるに決まってる」, and
   `79a8f12` put a second one back two days later, reading an owner's sentence
   about what account deletion takes as an instruction to build a row. It ran
   for a week with no permission and nothing holding it, and it is the same
   shape that destroyed the owner's language on 2026-09-03: one account
   pressing something and another account's work going.

   One language. The open one -- this room is the open language's, which is
   where its name is changed two rows up. The DELETE REVIEW is in
   docs/CHANGELOG.md and names every key. */
function wipeLangs(){
  /* Nothing to press in a language this phone is only reading. langLocked()
     is the same question the save on every other screen asks. */
  if(langLocked()) return;
  /* 確認は自前のポップで。「標準は使わねえって言ってるだろこれも禁止や」
     OWNER 2026-09-01 -- confirm() は使わない。はいの側がこの下。
     The name is in the sentence: 「この言語」 with no name is a question
     somebody answers about whichever one they think they are in. */
  popAsk(t('confirm.wipe.langs', langName||t('lang.untitled')),
         function(){ wipeLangsGo(); }, t('pop.yes'));
}
function wipeLangsGo(){
  var id=langId, j;
  if(!id || langLocked()) return;
  /* THE SERVER FIRST AND NOT WAITED ON. A language lives there; the phone
     holds the copy. Its answer changes nothing here -- the language is going
     off this phone either way, and a row left behind on a bad network is
     picked up by nothing (netLangsDown fills in what is MISSING, and this id
     will not be in the index to be filled). Asking after the local keys were
     gone would be asking about a language this phone can no longer name. */
  netLangDrop(id);
  try{
    for(j=0;j<SLICES.length;j++) localStorage.removeItem(langKeyOf(id, SLICES[j]));
  }catch(e){}
  /* Its row, and nothing else's. langStore() writes the index back out. */
  delete LANGS[id];
  langId='';
  langStore();
  /* AND THE BACKUP OF THAT ONE. bkDropFor() takes a list of ids and works out
     each file's name by standing it in front of langId -- so it is called
     while the row still says what the language was called. It is above the
     delete for that reason and nowhere else. */
  bkDropFor([id]);
  /* Where you are standing now. langForAcct(true) is the one place that
     answers 「which language is this account's to be in」 -- it opens one they
     already have, and mints one stamped with them when they have none. A
     phone that has just deleted its only language gets a new empty one, which
     is what a first run is. */
  langForAcct(true);
  /* Every global a language owns, put back to what an empty one looks like.
     This is langOpen()'s own line less migratePostInk(), which cuts ink onto
     posts out of the alphabet they were written in -- there is no alphabet
     here now, and the posts are not going anywhere. */
  langRead(); ltRead(); ntRead(); stRead(); sndRead(); ltStart();
  kbRead(); migrateKbFree(); wldRead();
  SFONT={built:false, sig:null};
  var css=document.getElementById('sfontcss');
  if(css && css.parentNode) css.parentNode.removeChild(css);
  save(); saveLetters(); saveNotes(); saveStg(); saveSnd();
  /* and where you were standing was in a language that is not there.
     langOpen()'s own two lines: the last one leaves you on the cover of the
     language you are in now, which is the only way this row can be seen to
     have done anything -- rendering the settings room again draws a screen
     that looks exactly as it did before it was pressed. GE goes with them:
     the glyph editor holds one letter, and that letter is not there either. */
  GE=null;
  viewReset();
  goTab('profile');
}
function wipeAll(){
  /* 確認は自前のポップで。「標準は使わねえって言ってるだろこれも禁止や」
     OWNER 2026-09-01 -- confirm() は使わない。はいの側がこの下。 */
  popAsk(t('confirm.wipe'), function(){ wipeAllGo(); }, t('pop.yes'));
}
/* WHOSE ACCOUNT IS GOING IS DECIDED HERE, AT THE PRESS, and carried down.
   netEndMe() in www/net.js calls netOut() the moment the server says the row
   is gone -- correctly, the token proves who is being deleted and it is spent
   -- and only then calls this back. So wipeHere() read SESS a moment after
   there was no SESS, took '' for the uid, and removed NOTHING AT ALL: the
   account went on the server and every byte of it stayed on the phone. The
   opposite failure to 2026-09-03's, out of the same line, and it only
   happened on the road where the server SAID YES.

   Not a `netOut()` moved to the other side of the callback: what is wanted
   is who was signed in when the button was pressed, and reading it here says
   that in the one place that knows it. The two arms both get it, so the road
   where the server could not be reached wipes the same account as the road
   where it could. `bad` is handed (data, status, message) by netSend(), so it
   is wrapped rather than passed bare -- a status object arriving where a uid
   is expected is exactly this bug wearing another hat. */
function wipeAllGo(){
  var uid=(typeof SESS!=='undefined' && SESS && SESS.uid)? String(SESS.uid) : '';
  if(netSignedIn())
    netDropMe(function(){ wipeHere(uid); }, function(){ wipeHere(uid); });
  else wipeHere(uid);
}
function wipeHere(uid){
  /* Everything under this app's name, counted rather than listed.
     「アカウント削除で残るものねえって言ってんだろ何回言わせんだよ全部消えんだよ。」
     OWNER 2026-08-27.

     This used to walk SLICES, and SLICES is what a LANGUAGE is made of -- so
     the drafts, the posts, the person's name and face, the index of languages
     and the eight flat keys from before there could be more than one all sat
     through it. Every one of them was the same bug: a list of keys, written by
     hand, that nobody remembered to add to. lsWipeAcct() in core.js counts the
     namespace instead, and takes only what carries this account's stamp.

     Then a first run, out of the same functions a first run uses. langFirst()
     mints a NEW id, so not one key of the language that was here can be
     written back by the saves below -- keeping the old id was how
     lingua.langs surviving turned into the old language's letters being
     rebuilt under it. */
  /* ONE ACCOUNT'S THINGS. NOT THE PHONE'S.
     「別アカウントでログインしてそれのアカウント削除したら、俺の元のアカウントが
     消えてんだよ」 OWNER 2026-09-03 -- and it did, because this emptied the
     whole `lingua.` namespace and the whole backup directory. The server was
     right: account_delete() removes the row of whoever is signed in and
     nothing else. The phone destroyed the rest, including the only copy of a
     language that had never gone up.

     「アカウント削除で残るものねえ」 was said on 2026-08-27 about a phone that
     held one account, and there was no other reading of it then. There is
     now, and it is the only one: **everything belongs to an account**
     (CLAUDE.md § Online, 2026-09-03), so deleting an account deletes that
     account's things and touches nothing else. Nothing of theirs is left --
     which is what the sentence asked for -- and nothing of anybody else's
     goes with it.

     There is no second branch. A phone that has only ever had one account
     loses everything anyway, because everything on it is that account's.
     Writing 「and if nobody else is here, wipe the lot」 was a first draft and
     it is two behaviours where the rule has one. */
  var wipeUid=String(uid||
    ((typeof SESS!=='undefined' && SESS && SESS.uid)? SESS.uid : ''));
  var wipeIds=lsWipeAcct(wipeUid);
  langId='';
  langFirst();
  langRead(); ltRead(); ntRead(); stRead(); sndRead();
  /* Whom this phone belonged to, what it was carrying, and what had been
     written and not sent. All three are the person's and none of them is a
     slice, which is why none of them was going anywhere before today. The
     keys are gone above; these are the copies in memory, which would
     otherwise be written straight back out by the next save. */
  ME={name:'', handle:'', bio:'', pic:'', link:'', loc:'', avSent:''};
  POSTS=[]; DRAFTS=[];
  /* the person's settings, back to what a fresh install has, and NOTHING is
     carried over -- not the theme, not the interface language, not the plan.
     「残るものねえ」is the whole sentence.

     The plan comes back by itself at the next launch, out of the Keychain,
     and that is correct rather than a hole: deleting an account is not
     cancelling a subscription, and Apple has not been told anything. Money
     decides what may be DONE and nothing about what exists -- here nothing
     exists either way, so it protects nothing and costs nothing. */
  /* The fields of SET that were this account's, gone with it -- the plan, the
     searches they starred, how far down their notices they had read. setFor()
     in www/core.js is the list and the one place it is written down. The
     theme and the interface language are how this handset is set up and are
     not anybody's belongings, so they stay.

     '' rather than a uid: nobody is signed in a line below, and this is the
     same call netOut() makes. */
  try{ localStorage.removeItem(setParkKey(wipeUid)); }catch(e){}
  setFor('');
  SET.plan='free'; SET.planWas='free';
  delete SET.planUid; delete SET.planPend; delete SET.saved;
  delete SET.savedUp; delete SET.notAt;
  /* AND IT OPENS ON THE DOOR, not on the walk. 「アカウント削除した後
     オンボーディングから始まるのはなぜ？」 OWNER 2026-09-03.

     setDefaults() answers `done` false, which is what a phone out of the box
     says, and appIs() reads that as 「this is the onboarding」. It is not: the
     person is standing here, they have just deleted an account, and what they
     are going to do next is sign in as somebody else. Asking them to draw an
     alphabet first is asking them to make a language with no account to make
     it for -- 「言語はアカウントないと作れないです」 -- which the door is the
     answer to.

     A phone with nothing on it still opens on the walk; that is a different
     phone and tools/open-check.mjs § 1 holds it. This is the one that has
     been through it. */
  SET.done=true;
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
  /* AND THE BACKUP FILES OF THOSE LANGUAGES, AND NO OTHERS. bkDropAll()
     empties the directory, and it is the other half of what took the owner's
     language on 2026-09-03: a second account leaving carried off the first
     one's files. It is still there for a language being deleted on its own;
     nothing here calls it. */
  bkDropFor(wipeIds);
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
   is what keeps the five lines below it from jumping as pages slide.

   `.ghost` is NOT on these two. It is the class that means "not a box"
   ── 「文字書いて四角で囲ったみたいなボタン全部やめてくれ」 ── and these two
   are the one place in the app the owner asked for the box back:
   「11は、角丸でいいから囲わないとボタンを押してるかわからん」OWNER 2026-08-26.
   Nothing else may take that as permission;規則18 in CLAUDE.md carries the
   exception and tools/box-baseline.txt is what holds it to this one pair.

   ⚠ The box itself is a rule in www/index.html and is NOT in this branch --
   see docs/reports/plan-2026-08-26.md. Until it lands these read exactly as
   they did, because `.ghost` and `.btn` are the same declarations today. */
/* WHICH TERM IS CHOSEN, and nothing is bought until the button at the foot is
   pressed. 「プランタップしたらすぐ行くのいやだ。プランタップして下のサブス
   クライブするみたいなボタン押してやっと課金いけるみたいにしたい」 OWNER
   2026-09-01 -- pressing a price used to hand the App Store the purchase at
   once, so the sheet arrived on the first tap and a mis-tap was a sheet
   somebody had to dismiss.

   It is where you are standing on this screen and not a setting, so
   viewReset() drops it, the same as every other 「どれを選んでいるか」 in the
   app. `{id, yr}` and never a plan on its own: the month and the year of one
   plan are two different things to buy. */
var PLPICK=null;
function plPick(id, yr){
  /* AND THE RAIL STAYS WHERE IT WAS. Choosing repaints the screen, and the
     row of plans is a thing you have scrolled sideways -- so pressing a price
     on Plus put you back on Free, every time. 「4.99ってボタン押したら毎回
     左に戻されるの何？流石にそのプランで止まれや」 OWNER 2026-09-01. */
  var r=document.querySelector('.plrail'), x=r? r.scrollLeft : -1;
  PLPICK={id:String(id), yr:!!yr};
  render();
  if(x>0){ r=document.querySelector('.plrail'); if(r) r.scrollLeft=x; }
}
function plPicked(id, yr){ return !!(PLPICK && PLPICK.id===id && PLPICK.yr===!!yr); }
/* And the press that actually buys. Down until something is chosen: a button
   that does nothing is a button that is broken.

   IT WILL NOT BUY WHAT IS ALREADY HELD. 「二重課金はさせないようにしろよ」
   OWNER 2026-09-01, after buying Plus on a phone that already had Pro and
   being charged for both. Two subscriptions in two App Store groups can be
   held at once -- docs/apple.md § サブスクリプショングループ says to put them
   in ONE group, where Apple itself makes the second an upgrade -- and this is
   the app not relying on that being got right: the plan in force, and
   anything at or below it on the ladder, is not something to buy again. What
   it is instead is a change to a subscription that exists, and that is
   Apple's own sheet (storeManage) 「サブスクリプションは、サブスクライブに
   使用したプラットフォームを通じて管理してください」. */
/* Whether what is picked is already paid for -- the plan in force, or one
   below it on the ladder. plBuy()'s own test, asked before the button is
   drawn instead of after it is pressed. Nothing picked is not 「held」: the
   button is drawn disabled then, which is what it has always been. */
function plHave(){
  var i, j;
  if(!PLPICK) return false;
  if(plan()==='free') return false;
  i=PLAN_ORDER.indexOf(plan());
  j=PLAN_ORDER.indexOf(PLPICK.id);
  return j>=0 && i>=0 && j<=i;
}
/* ---- and what stands where that button was -----------------------------
   「消すなら同じ場所に現在このプランです〇〇/〇〇までみたいな感じにしないと
   わからんやろ」 OWNER 2026-09-03, after seeing the empty place on a real
   phone: 「購入するボタンなんでなくなってんの？」

   THIS IS NOT THE BAN ON EXPLAINING. It is the 2026-08-22 narrowing of it --
   the app has TAKEN SOMETHING AWAY and the screen would otherwise be a state
   with no cause and no way out -- and it is the minimum that narrowing
   allows: the plan, and when it runs to. Not what the plan is good for, not
   what to press instead. The two rows under it are the way out and were
   always there.

   THE PLAN IS NAMED, and that is truth rather than a word more than the
   minimum. plHave() is true for the plan in force AND every rung below it,
   so somebody on Pro who taps Plus's price is standing here too --
   「現在このプランです」 with nothing named would be a sentence about Plus,
   which is not what they have. What is drawn is plan(), which is what is in
   force whichever card was tapped.

   NO NEW CLASS AND NO BOX. `.note` is what a state is drawn in on twenty
   other screens, it is already inside this same .plgo for what the App Store
   said about the prices, and two siblings of one class are one height --
   which is the fault `press` holds. */
function plNow(){
  var at=storeUntil();
  return '<div class="note">'+esc(at?
    t('plan.now', planName(plan()), plDate(at)) :
    t('plan.now.only', planName(plan())))+'</div>';
}
/* A date, written the way the interface language writes one.

   THROUGH t(), because the ORDER is not the same in ten languages: the year
   leads in Japanese and Chinese, the day in German and Russian, the month in
   English. `plan.date` is that order and nothing else -- three numbers and
   the separator between them -- so a language that wants 年月日 says so in
   its own file rather than here.

   NOT toLocaleDateString, which is in WKWebView and would have been the
   short way. i18n-check renders every screen in a pseudo-language of
   accented look-alikes, and handing that tag to toLocaleDateString is a
   RangeError -- a screen that throws in the one walk that reads every string
   on it. The App Store's own formatter is what formats MONEY (www/store.js),
   and that is a different question: money carries a currency this app does
   not know and a date does not.

   Padded to two digits by hand: padStart is ES2015 and tools/es5-check.mjs
   fails on it. */
function plDate(ms){
  var d=new Date(ms), m=d.getMonth()+1, day=d.getDate();
  return t('plan.date', d.getFullYear(), (m<10?'0':'')+m, (day<10?'0':'')+day);
}
function plBuy(){
  if(!PLPICK) return;
  /* plHave() and not the comparison written out again: the button above is
     drawn from it and this is the same question. Two copies is the one thing
     this repo has been bitten by most -- the day one of them changes, the
     other goes on answering the old way and nothing says so. */
  if(plHave()){
    popAsk(t('plan.already', planName(plan())), function(){ storeManage(); },
      t('plan.cancel'));
    return;
  }
  setPlan(PLPICK.id, PLPICK.yr);
}
function planPrice(p, free){
  function term(yr){
    var cost=storeCost(p.id, yr) || t(yr? p.yr : p.mo);
    var off=storeOff(p.id) || p.off;
    /* Twelve months at the monthly price, struck through, beside what a year
       actually costs. 「49.99は取り消し線＋17%OFF」OWNER 2026-08-26.

       storeWas() and NOT `t(...) || something`: the two prices either side of
       this line are compared by whoever reads them, so a typed one is worse
       here than none at all. It is empty in a browser, in every screenshot,
       and for a product not yet made -- 何も出さない, OWNER 2026-08-26 -- and
       the year's own price and its saving are on the screen either way.

       ⚠ `.plterm .pwas` is NOT in the stylesheet yet and is needed: `.pp` is
       `display:inline` since 「4.99/月は一列にしろ」, so with nothing on this
       class the two prices touch -- `¥9,000¥6,000`. Measured at 320 and 390,
       not guessed. The rule is in docs/reports/plan2-2026-08-27.md;
       www/index.html is not this branch's to write.

       And nothing in the gate but plan-check ever renders this: every other
       walk runs in a browser, where there is no App Store and storeWas() is
       empty. The fixture face that fixes that is in the same report. */
    var was=yr? storeWas(p.id) : '';
    var body=(was? '<s class="pwas">'+esc(was)+'</s>' : '')+
      '<span class="pp">'+esc(cost)+'</span>'+
      '<span class="pper">'+esc(t(yr? 'plan.per.yr' : 'plan.per.mo'))+'</span>'+
      ((yr && off)? '<span class="plsave">'+esc(t('plan.off', off))+'</span>' : '');
    return free? (yr? '' : '<span class="plterm no">'+body+'</span>')
               : '<button class="btn plterm'+(plPicked(p.id, yr)? ' on':'')+'"' +
                 DO('plPick', [p.id, yr]) + '>'+body+'</button>';
  }
  return '<div class="plterms">'+term(false)+term(true)+'</div>';
}
/* ---- what Apple asks for beside a price --------------------------------
   App Store Review Guideline 3.1.2. A subscription may not be offered without,
   next to what it costs: how long a term is and what it costs, a sentence
   saying it renews by itself until somebody stops it, and working links to the
   terms and the privacy policy. Without those the build is refused, and it is
   refused at review rather than at build -- so nothing here would ever have
   gone red on its own.

   **This is the one exception to 「アプリ内に説明書くの禁止」 and it is not a
   crack in it.** It is here because Apple requires it, so it is the minimum
   that satisfies the guideline and not one word more: it does not say what a
   plan is good for, what somebody would get, or why a year is better than a
   month. The five lines on each page already say what is bought.

   THE TERM AND THE PRICE ARE NOT REPEATED HERE, and that is the disclosure
   rather than a gap in it. They are on the two buttons above -- `plan.per.mo`
   / `plan.per.yr` beside what the App Store charges in that country -- and
   Apple asks that they be disclosed next to the offer, not that they be
   printed twice. A second copy would be a second number to keep in step with
   Apple's, and www/store.js is at length about why there is only ever one.

   THE LINKS ARE docRows(), which is DOC_TERMS and DOC_PRIVACY -- the two
   published pages the account room already links to. No new URL: one copy of
   a contract, so the version somebody agreed to is the version that is up.
   There is no third document -- 「出さない。」 OWNER 2026-08-26 about the
   特定商取引法 notice, because the App Store's seller is Apple.

   NO BOX AND NO NEW CLASS. `.docs` is already in the stylesheet and is
   already what this is -- small, centred, muted, at the foot, about the
   documents -- so the sentence and the two links it belongs with are the
   same class at the same size, and www/index.html does not have to change
   for any of it to be right.

   `.docs` and NOT `.plfoot2` wrapping a `.note`, which is what this was
   first. Those are two classes that would have put two SIBLINGS of one class
   on one screen at two type sizes -- .86rem for the sentence and .8rem for
   the Cancel button under it -- which is the fault `press` holds and CLAUDE.md
   states as 「Rows in one list are one height」. Reusing the class the two
   links already wear cannot have that fault: there is one size because there
   is one class.

   It is not a box either way, and that is not taken on trust: term-check
   reads the computed border and corner off the real elements, so a rule added
   against `.docs` in another branch fails here rather than shipping. */
function planTerms(){
  return '<div class="docs">'+esc(t('plan.renew'))+'</div>'+docRows();
}
function vPlans(){
  /* The one place that asks. It answers a moment later and redraws, so the
     typed prices are what is on screen for that moment and the App Store's
     are what is on screen after it. */
  storeAsk();
  /* AND WHAT THIS APPLE ID ALREADY HOLDS, which nothing had ever asked --
     the screen drew the plan out of the copy in the Keychain, and a copy that
     is behind shows somebody on Pro a live 「buy Plus」 button.
     「そもそもプロの人が買えるのが意味わからないだろ」 OWNER 2026-09-03.

     THE SCREEN WAITS FOR IT. 「ローディングすればそんなの起きないだろ」 OWNER
     2026-09-03 -- the same answer given about a language arriving after a
     sign-in, and the same mark. Nothing is drawn from the stale copy, so
     there is no moment in which the stale copy decides anything.

     In a browser there is no App Store to ask, so storeHeld() is true from
     the first line and this screen is exactly what it was. */
  storeCurAsk();
  if(!storeHeld())
    return '<div class="view plans">'+navTop('')+
      '<div class="body">'+snsWaitHTML()+'</div></div>';
  return '<div class="view plans">'+
    navTop('')+
    /* The picture, and it is this phone's own keyboard wearing the letters
       this person drew. 「絵なんでもいいよ 君のキーボードとか載せる？」 --
       OWNER DECISION, 2026-08-23.

       kbOf() and not kbBoard(): the one that is APPLIED, which is what is on
       the phone, rather than whichever one the editor was last left on. On
       free that is the QWERTY with the drawn letters substituted in, which is
       what the free plan IS.

       A picture and not a button. Every screen in this app is reached by
       pressing something that says where it goes, and a keyboard that opens
       the keyboard chapter from the middle of a price list is a door nobody
       asked for in a room they came to for one thing. */
    '<div class="plkb">'+kbShotHTML(kbOf().lay)+'</div>'+
    '<div class="plrail">'+PLANS.map(planPage).join('')+'</div>'+
    /* Apple wants somewhere to press for both, and neither is a purchase:
       restoring reads what this Apple ID already holds, and cancelling is
       Apple's own sheet.
       「無料に戻すってボタン意味わからないからそこを購入を復元に、
         サブスクリプションを解除するをその下に小さめに入れよう」 */
    /* THE PRESS THAT BUYS, and it is the only one. A price above chooses a
       term; this hands it to the App Store. 「プランタップして下のサブスク
       ライブするみたいなボタン押してやっと課金いけるみたいにしたい」 */
    /* AND WHEN THE PRICES ARE NOT APPLE'S, THE SCREEN SAYS SO, HERE.
       「サンドボックスだと 15000 円なのに画面はどの言語でも 99.99 ドル」 OWNER
       2026-09-02. What was on the screen was the typed fallback out of
       www/i18n -- right in a browser, right in the United States, wrong in the
       other 174 storefronts -- and the only thing that had ever said so was a
       toast that had gone 1.9 seconds later.

       Between the prices and the press that buys, because that is where
       somebody deciding whether to pay is looking, and it is one line for the
       screen rather than one per plan: the ask is one ask for all three.

       It is a state and not an explanation (CLAUDE.md § Explaining): it says
       what happened, not what to do about it, and it is empty while the ask
       is still out. No new class and no rounded box -- `.note` is what a state
       is drawn in on twenty other screens, and it is inside the .plgo that is
       already here rather than a second one of its own. */
    /* AND THE BUTTON IS NOT THERE FOR SOMETHING ALREADY PAID FOR.
       「そもそもプロなら課金自体ボタン押させないでいいでしょ」 OWNER
       2026-09-03. plBuy() has refused the press since 2026-09-02; a button
       that exists in order to say no is a button. The way out for somebody on
       the top rung is the two rows below -- restore, and Apple's own sheet,
       which is where a subscription is changed.

       AND THE PLACE IT LEFT IS NOT EMPTY. 「消すなら同じ場所に現在このプラン
       です〇〇/〇〇までみたいな感じにしないとわからんやろ」 OWNER 2026-09-03.
       A button that simply goes reads as an app that has broken rather than
       as one that has nothing to sell you: 「購入するボタンなんでなくなって
       んの？」 plNow() is the one line that stands there -- see it for why
       naming the plan is the truthful shape and not a word too many.

       This is not 「a button that is not there」 in the sense of 2026-08-25
       (「そのプランでできることできないことで UI 自体に変更がない方が
       良くない？」): that is about a locked feature elsewhere, whose press is
       the way TO this screen. Here there is nowhere to send anybody. */
    '<div class="plgo">'+
      (storeSay()? '<div class="note">'+esc(storeSay())+'</div>' : '')+
      (plHave()? plNow() :
        '<button class="btn plbuy'+(PLPICK? ' on' : '')+'"' + DO('plBuy') +
        (PLPICK? '' : ' disabled')+' style="width:100%">'+
        esc(t('plan.buy'))+'</button>')+'</div>'+
    '<div class="plfoot"><button class="btn ghost" style="width:100%"' +
      DO('storeRestore') + '>'+esc(t('plan.restore'))+'</button></div>'+
    /* AT THE FOOT, AND UNDER THE BAR OF TABS. 「一番下に置いて欲しい。
       サブスクリプションを解除するは下タブの裏に隠すように入れてよ」 OWNER
       2026-09-01. It was directly under the prices, on the argument that the
       guideline says 「next to the price」 -- and what Apple asks is that the
       terms and the privacy policy are ON the screen that offers the
       subscription, which this is. Nothing is removed and nothing stops
       working: both links are still here, still on the paywall, still the two
       published pages.

       The row that CANCELS goes last, below them, in the strip the bar of
       tabs stands on -- somebody looking for it scrolls to it and nobody else
       meets it on the way to a price. */
    planTerms()+
    '<div class="plfoot2 plunder"><button class="btn ghost" style="width:100%"' +
      DO('storeManage') + '>'+esc(t('plan.cancel'))+'</button></div>'+
  '</div>';
}
/* 段は、Apple の購入が通ってから書かれる。
   「課金もタップしたら勝手になるけど？」OWNER 2026-08-31。

   `PLAN_BUY` は買う道を通すかどうかの一箇所の値で、2026-08-25 から `false`
   でした ── その日 App Store Connect に商品が一つも無く、実機で段を試す道が
   それしか無かったからです。そのときのコメント自身が「出荷前に true に戻す
   こと」と書いていて、戻らないままビルド #106 が実機に出て、段のカードを
   押しただけで Pro が付きました。

   `true` です。実機では `storeBuy()` を通り、通らなければ段は動きません
   ── そして段は**要求ではなく返事から**取られます（`storeTook()` は
   `r.plan` を読む）ので、取り消しも保留も失敗も `free` のままです。

   ブラウザには App Store が無いので `storeOn()` が false になり、そこでは
   今までどおり手で切り替わります ── 検査もスクリーンショットもそれで歩きます。

   値のまま残してあるのは行ごと消せないからではなく、`setPlan` が `storeBuy`
   の唯一の呼び出し元だからです。消すと StoreKit 側が丸ごと dead-check に
   落ちます。**false に戻さないこと。** false のまま App Store に出すと、
   誰でも自分に Pro を付けられます。 */
var PLAN_BUY=true;
function setPlan(id, yearly){
  if(PLAN_BUY && id!=='free' && storeOn() && storeBuy(storeId(id, yearly))) return;
  SET.plan=id; planKeep(id); save(); render();
  toast(id==='free'? t('toast.plan.free') : t('toast.plan.other', id));
}


/* Signing out leaves everything where it is: the languages are on the phone
   and the account is on the server, and coming back finds both. Only the pair
   of tokens goes. */
/* 「ログアウト、アカウント消去、言語消去はログアウトしますか？みたいなポップ
   つけてほしい」OWNER 2026-09-02. The other two already ask -- wipeAll() and
   the language wipe both open one, and both say it cannot be undone. This one
   went the moment it was pressed.

   It does NOT say 「戻りません」. Signing out leaves every language on the
   phone and the account on the server, and signing back in finds both; a
   sentence saying otherwise would be the app frightening somebody about a
   thing that costs nothing. The two that DO destroy something say so. */
function setSignOut(){
  popAsk(t('set.signout.ask'), function(){ setSignOutGo(); }, t('set.signout'));
}
function setSignOutGo(){
  netOut();
  /* And the provider is told too. Lingua's tokens are not the only session
     there is: the social plugin keeps its own, and it survived this -- so the
     next press of Google handed back the same account without asking, and
     「sign out and sign in as somebody else」 was a road that did not exist.
     www/onboard.js has the whole of why; it answers for everything that can
     go wrong here by going on regardless, because the tokens are already
     gone by this line. */
  obSignOutSocial();
  toast(t('set.signout.done'));
  render();
}
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
