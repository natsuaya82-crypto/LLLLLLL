/* Lingua — starting the app
   Loaded by www/index.html LAST.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   These six lines used to sit at the foot of www/glyph.js, which meant the
   app was started by the drawing editor. Nothing was wrong with the lines;
   they were in a file nobody would think to open. */

/* The copy on disk, before anything that reads storage.
   It only fills in what is missing, so on a phone that is simply working it
   finds nothing to do and this costs one message to the native side. On one
   whose storage was reclaimed it is the difference between a language and an
   empty app. The answer comes back a frame later than the first render --
   there is no way to ask the native side anything synchronously -- so what
   it puts back is migrated and drawn when it arrives, not before. */
bkRestore(function(put){
  if(!put) return;
  migratePh(); migrateMn(); migrateLetters(); migrateMarks();
  migrateSndName(); migrateSnd(); migratePosts(); migratePostInk(); migrateSp();
  migrateKbFree();
  ltStart(); installScriptFont();
  render();
});
/* And the language that is here now is written out on the first render,
   whether or not anything is changed today: an install that predates this
   chapter has never called a save, and waiting for one would mean the copy
   appears only for people who happened to edit something. */
bkTouch();

/* old shapes of stored things, brought forward */
migratePh();
migrateMn();
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
  /* And the languages this ACCOUNT has that this phone has not got at all.
     It fills in what is missing and stops, so a phone that is simply working
     finds nothing to do. Before the sync below because that one is about the
     language that is OPEN, and this is about the ones that are not here --
     which, until it existed, were unreachable from a second phone.
     「前のアカウント消えたんだが？」 */
  netLangsDown();
  /* And the language, which belongs to this account and exists twice. Read,
     merged and written back -- both ways, so a phone that has been offline
     for a week arrives holding the week rather than replacing it.

     After the session and not before: it is done AS somebody, and there is
     always somebody now. Not waited for either -- the app has already opened
     on what is on the phone, which is all of the making side. */
  netLangSync();
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
netResume(bootSession, function(){});
/* one listener above the screen, since the screen itself is replaced whole on
   every render and nothing can be bound to it */
actWire(document.getElementById('app'));
/* and one above the tab bar, which is beside the screen rather than in it */
actWire(document.getElementById('tabs'));
/* and how much of the screen the phone's keyboard is covering, so a field
   pinned to the bottom is above it rather than behind it */
vpKbWire();
render();
/* And, if the plan has ended since the last launch, the one thing somebody
   needs to hear before they look at a list that is suddenly a hundred long.
   After render(), because it opens a sheet and a sheet is a screen. */
capLapse();
if(window.splashDone) splashDone();
