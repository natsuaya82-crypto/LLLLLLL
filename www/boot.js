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
/* A language has sounds from the moment it exists. Nothing asks for them --
   a drawn letter takes the next one nothing reads yet, and the whole set is
   changed in the phonology chapter or one letter at a time in the editor. The
   onboarding used to ask, which meant a language that skipped the question
   had no sounds at all and every letter drawn in it read nothing.
   Only when there are none: this must never overwrite somebody's. */
if(!addedSnd().length){ SET.snd=asOrder(asSounds('plain', 12)); save(); }
/* the font built from whatever letters have been drawn */
installScriptFont();
/* one listener above the screen, since the screen itself is replaced whole on
   every render and nothing can be bound to it */
actWire(document.getElementById('app'));
render();
if(window.splashDone) splashDone();
