/* Lingua — starting the app
   Loaded by www/index.html LAST.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   These six lines used to sit at the foot of www/glyph.js, which meant the
   app was started by the drawing editor. Nothing was wrong with the lines;
   they were in a file nobody would think to open. */

/* AND THE LANGUAGE THAT IS HERE NOW IS SENT, whether or not anything is
   changed today: an install that predates this chapter has never called a
   save, and waiting for one would mean the copy appears only for people who
   happened to edit something.

   What stood here was bkRestore() -- the language read back out of the file
   in Documents, filling in whatever storage had lost. There is no file now
   (www/backup.js says why), and what answers 「the storage was reclaimed」 is
   netLangsDown() at the foot of this file: the languages this ACCOUNT has,
   brought down from the server. */
bkTouch();

/* old shapes of stored things, brought forward */
migratePh();
migrateMn();
/* and a part of speech saved as its label rather than its key */
migratePos();
migrateLetters();
migrateMarks();
migrateSndName();
migrateSnd();
migratePosts();
migratePostInk();
migrateSp();
/* and what the language is for, off the phone and into the language */
migrateWorld();
/* and the free QWERTY out of the keyboard list, keeping an edited one */
migrateKbFree();
/* and a free language gets the twenty-eight slots it is allowed */
ltStart();
/* the font built from whatever letters have been drawn */
installScriptFont();
/* and how much of the screen there is, which the keyboard changes */
vvMount();
swMount();
/* The session, resumed. The token in hand lasts an hour, so a launch the next
   morning has one that is already dead; this trades the refresh token for a
   fresh pair before anything asks the server for something. It is fired and
   not waited for -- the app opens on what is on the phone, which is all of
   the making side, and the timeline reads with the publishable key whether
   this comes back or not. */
function bootSession(){
  render();
  /* AND A DELETION THAT WAS ASKED FOR AND DID NOT FINISH.
     「そもそもこのアプリはオンラインが基本なんだからね？SNSなんだから、削除し
     切ってないと消えない。」 OWNER 2026-09-03.

     The press is in www/settings.js and it writes the mark once the server
     says the row is gone, so what comes back here is a phone whose ACCOUNT
     has already been deleted and whose copy did not finish going. It is the
     same call the button makes, so there is one road and not a second one
     for the second try.

     A phone whose request never landed carries no mark and does not come
     through here: the account is still there and nothing was written down
     (www/settings.js § wipeAllGo). The popup is what it got, and ［再更新］
     is its second try.

     FIRST, and before the plan or the languages: everything below this line
     asks the server for things that belong to an account that is on its way
     out. It is not asked again -- popAsk() answered when it was pressed, and
     asking twice would be the app doubting somebody who already said yes. */
  if(netEnded()){ wipeAllGo(); return; }
  /* And what this ACCOUNT has paid for, which used to be a fact about the
     phone. The receipts this device holds go up and the plan comes back --
     storeSync() in www/store.js and netPlanVerify() in www/net.js have the
     whole of why. Before the languages, because the plan is what says how
     many of them there may be.
     「課金とアカウントとキーボードはアカウントに結びつく」

     IT IS ONE ROAD NOW AND THERE IS NOTHING LEFT TO RACE. It was
     netPlanBoot(): a send of what this phone had not managed to tell the
     server, and a read that took the higher of the two rungs, in that order
     because otherwise they raced and the read won -- an ended subscription
     answered with the plan Apple had already ended, permanently, on the phone
     of somebody who had paid. 「プランは絶対におかしくしちゃいけないんだって」
     OWNER 2026-09-02.

     Neither side of that race exists. This phone holds no opinion about what
     it has paid for, so there is nothing to send and nothing to read against:
     what goes up is what Apple SIGNED, and what comes back is the plan.
     「だから端末でやるわけねえだろ」 OWNER 2026-09-03. */
  storeSync();
  /* THE TWO ROADS BETWEEN THIS PHONE AND THE SERVER, AND THEY GO IN ORDER.
     netLangsDown() brings down the languages this ACCOUNT has that this phone
     has not got at all -- it fills in what is missing and stops, so a phone
     that is simply working finds nothing to do, and until it existed a
     language was unreachable from a second phone 「前のアカウント消えたんだ
     が？」. netLangSync() puts up what this phone has and the server has not.
     They used to be two lines here, fired in the same moment and neither
     waited for, and the same language came down the first road while it was
     going up the second one.

     The one language that could reach: one that has NEVER BEEN UP. It has no
     `sid`, so netLangsDown() -- which takes its 「what is already here」 off
     LANGS before it asks -- has nothing to match it by, and netLangRow()
     makes its row while that question is in the air. The answer then comes
     back carrying a row this phone has never heard of, langMint() makes a
     second entry for it, and the same language stands twice in the list.
     Once, on the one launch it first goes up, and it does not go away again.

     Nothing throws and nothing is lost: two entries, one server row, both
     real. It is found by somebody looking at their own list of languages.

     So the up road waits for the down road, which is one line rather than a
     second thing that watches for duplicates -- a phone that has just been
     told everything this account has is a phone that knows what is missing.
     Everything else here is unchanged: still not waited for by the app, which
     has already opened on what is on the phone. */
  netLangsDown(function(){
    /* And the language, which belongs to this account and exists twice. Read,
       merged and written back -- both ways, so a phone that has been offline
       for a week arrives holding the week rather than replacing it.

       After the session and not before: it is done AS somebody, and there is
       always somebody now. */
    netLangSync();
  });
  /* And whether this account is the one that answers the reports, which is
     one column on one profile and decides whether a row exists at the foot of
     the settings list. Asked after the session is resumed because it is asked
     AS somebody, and not waited for: the row appears when the answer does. */
  netStaff(function(yes){ if(yes) render(); });
  /* And the face on the profile row, which nothing updated after the account
     was made: a notice could draw a face somebody had not worn for a month.
     It asks the server nothing on a launch where the face has not moved --
     the comparison is against ME.avSent, which is local. */
  netAvSync();
  /* And the line about themselves, which was on the phone and only there.
     「自己紹介を見せないって選択肢を俺はいつ与えた？」 It asks before it
     writes and takes the account's when this phone has none. */
  netBioSync();
}
/* A session that is still good comes back here and nothing is asked. What
   used to be in the `bad` half was netAnon(): no session, so make one, without
   asking anybody anything, so that everything somebody made belonged to an
   account before they had decided to be anybody.
   「オンボーディングで離脱されるのは防ぎたい」

   OWNER DECISION 2026-08-26 took that out -- 「言語はアカウントないと作れない
   です」 -- so there is nothing to do when there is no session. The app opens
   on the door instead, which is www/onboard.js's, and the failing half of
   this call is now the same as the missing half: no session, and nobody is
   told, because a phone that is merely offline on a launch is not a phone
   with a problem to report. */
/* 通信が落ちたら何も進まない ── netPop() (www/net.js) が四箇所の一つ。
   この関数が「起動のとき一回」で、ポップの［再更新］はこれをもう一度呼ぶ。
   署名の無い iPhone では netResume() はサーバーへ行かず `resume −` を返す
   ので、netPop() はそこで何もしない ── 出て行かなかった要求に「もう一度」は
   無いから。判断はあちらの一箇所にある。 */
function bootAsk(){
  netResume(bootSession, function(d, s, m){ netPop(d, s, m, bootAsk); });
}
bootAsk();
/* one listener above the screen, since the screen itself is replaced whole on
   every render and nothing can be bound to it */
actWire(document.getElementById('app'));
/* and one above the tab bar, which is beside the screen rather than in it */
actWire(document.getElementById('tabs'));
/* AND ONE ABOVE THE SCRIM, which is where the popup is. It is the third
   thing on the page that is outside `#app`, and it was the one nothing was
   listening to: `popAsk()`'s two buttons carry names like every other button
   in the app, and no listener could hear them, so pressing 閉じる did
   nothing at all. 「ポップの閉じるとかボタン押しても閉じれないよ」 OWNER
   2026-09-01. Nothing threw and press-check was green -- it presses what is
   inside `#app`, and this is the one button that is not. */
actWire(document.getElementById('sbg'));
/* and how much of the screen the phone's keyboard is covering, so a field
   pinned to the bottom is above it rather than behind it */
vpKbWire();
render();
/* And, if the plan has ended since the last launch, the one thing somebody
   needs to hear before they look at a list that is suddenly a hundred long.
   After render(), because it opens a sheet and a sheet is a screen. */
capLapse();
if(window.splashDone) splashDone();
