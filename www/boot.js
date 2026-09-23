/* Lingua — starting the app
   Loaded by www/index.html LAST.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   These six lines used to sit at the foot of www/glyph.js, which meant the
   app was started by the drawing editor. Nothing was wrong with the lines;
   they were in a file nobody would think to open. */

/* A LAUNCH SENDS NOTHING. What stood here was bkTouch() -- 「the language
   that is here now is sent, whether or not anything is changed today」 --
   and before it bkRestore(). The server hears what a person makes and
   presses, and nothing else: CLAUDE.md rule 22, and
   docs/scope/brief-r60-up.md. What is on the screen until the server answers
   is the picture of what was last loaded, and langLocked() (www/core.js)
   refuses every save onto it -- so the migrations below change what is on
   the screen and write none of it anywhere. */

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
  /* THE LANGUAGES COME DOWN AND NOTHING GOES UP. What this account has is
     asked from netTook()'s pullBoot() (www/sns.js § askLangs, `mylangs`),
     which is the one place that knows a session arrived.

     `pullWait('mylangs', netLangSync)` stood here: the up road, run on every
     launch behind the answer. It merged whatever this phone was holding --
     the disk an older version left, and the picture once a migration had
     saved it -- into the server's rows and wrote the result back, so a word
     deleted on another phone came back from this one on every launch.
     Measured 2026-09-23, tools/quiet-check.mjs 1 and 2. A save goes up when a
     person makes it (netSaveUp, www/net.js), and the door sends what the walk
     made (netTook); there is no third road. */
  /* Whether this account answers the reports was asked here and is asked in
     netTook() (www/net.js) now -- the one place that knows a session arrived.
     This call was the whole of it, so a launch made signed out never asked and
     the door somebody then came in through never asked either. */
  /* And the profile -- the line about themselves and the face -- READ.
     「自己紹介を見せないって選択肢を俺はいつ与えた？」 netAvSync() stood above
     this and sent the face this phone was holding on every launch where it
     differed from a mark of what it had sent last, so an old photograph on a
     second phone put itself back over a new one (r46-audit § A1). The face
     goes up when somebody chooses it (meFacePut, www/me.js). */
  netProfSync();
  /* And how this account has the app set up -- the theme, the interface
     language and the three switches about the drawn letters
     (www/core.js § SET_PREFS). */
  netPrefsPull();
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
/* 「プランが終了しました」 STOOD HERE and is not said any more. capLapse()
   compared the plan against a word in `lingua.set`, and there is no word on
   this phone: what an account pays is `verify-plan`'s answer, in memory
   (www/core.js § PLAN). The `plan` table carries no previous plan, so
   nothing can say 「it ended」 -- www/core.js § 「プランが終了しました」 and
   docs/scope/r31-server.md § オーナーへ. */
/* AND THE SPLASH COMES DOWN WHEN THE SCREEN UNDER IT IS WHOLE.
   「プロフィールは、出す物を全部読み込んでから開く」「押してから読み込みが
   終わるまで前の画面のままで、揃った瞬間にプロフィールが出る」 OWNER
   2026-09-07.

   The app opens ON the profile, so the splash is that screen's 「前の画面」 --
   the one door into it with nothing behind it. profileReady() (www/me.js) is
   the same three answers the press waits for, asked in one place so the two
   roads cannot come to differ.

   IT CAN ONLY MAKE THE SPLASH LATER THAN 900ms AND NEVER LATER THAN 4000.
   www/index.html holds both ends: splashDone() shuts it on the LATER of the
   call and 900ms, and a timer shuts it at 4000 whatever happens. So a phone
   with no signal waits four seconds at the outside and then opens on what is
   here, which is the same thing it did before.

   Signed out there is nothing to wait for -- the app opens on the door, and
   www/onboard.js draws it. */
if(window.splashDone){
  if(here().r==='profile' && netSignedIn()) profileReady(splashDone);
  else splashDone();
}
