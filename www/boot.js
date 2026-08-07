/* Lingua — starting the app
   Loaded by www/index.html LAST.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   These six lines used to sit at the foot of www/glyph.js, which meant the
   app was started by the drawing editor. Nothing was wrong with the lines;
   they were in a file nobody would think to open. */

/* old shapes of stored things, brought forward */
migratePh();
migrateMn();
migrateLetters();
migrateMarks();
migrateSnd();
migratePosts();
/* and a language that still has none gets a set to start from */
sndStart();
/* the font built from whatever letters have been drawn */
installScriptFont();
/* The session, resumed. The token in hand lasts an hour, so a launch the next
   morning has one that is already dead; this trades the refresh token for a
   fresh pair before anything asks the server for something. It is fired and
   not waited for -- the app opens on what is on the phone, which is all of
   the making side, and the timeline reads with the publishable key whether
   this comes back or not. */
netResume(function(){ render(); }, function(){});
/* one listener above the screen, since the screen itself is replaced whole on
   every render and nothing can be bound to it */
actWire(document.getElementById('app'));
render();
if(window.splashDone) splashDone();
