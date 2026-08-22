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
  sndStart(); ltStart(); installScriptFont();
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
/* and a language that still has none gets a set to start from */
sndStart();
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
netResume(bootSession, function(){
  /* No session, so make one, and make it without asking anybody anything.
     An anonymous account is a real uid the moment the app opens, which is
     what lets everything somebody makes belong to an account before they
     have decided to be anybody. Identity is asked at a post and at a
     purchase and nowhere else. 「オンボーディングで離脱されるのは防ぎたい」

     Only when there is nothing left: netResume answers `bad` for a token the
     server no longer accepts -- which it clears -- and for a phone with no
     signal, which it does not. The second is a session that is still good
     and must not be replaced by an anonymous one.

     A failure here is not told about either. It means the phone is offline on
     its first launch, and the whole making side works offline; the next
     launch asks again. */
  if(netSignedIn()) return;
  netAnon(bootSession, function(){});
});
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
