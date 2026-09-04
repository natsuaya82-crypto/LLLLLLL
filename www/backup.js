/* Lingua — the moment a save reaches the server (chapter 24)
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   24. The moment a save reaches the server

   THIS CHAPTER USED TO BE A FILE. A language was written out into the app's
   Documents folder, three generations deep, where iOS put it in the device
   backup and the Files app could show it -- and that file was 「the copy that
   survives the app」, the thing that was still there when the server and
   localStorage were both gone.

   IT IS GONE, and it is the owner's decision:

     「オンラインは一本化ね？」「簡単よ」「保存としたらオンラインおしまい」
     「今ファイルもいらん。オンラインのみで行こうってことになってる今後
       オフラインたいおする時にまた考えることにした」 OWNER 2026-09-04

   The file answered 「what is left when nothing else is」, and that question
   had an answer because a save reached the server twice a session -- at
   launch and at the door -- so there were hours when the only copy of an
   afternoon's work was this handset. **A save now goes up the moment it is
   made**, which is what took the question away rather than what ignored it.
   docs/CHANGELOG.md 2026-09-04 carries the DELETE REVIEW.

   WHAT IS LEFT IS THE ONE LINE THE FILE WAS EVER REACHED BY. Seven save
   functions call bkTouch() -- exactly the seven writers in LANG_IO -- and it
   is the only place in this app that means 「a person has just changed their
   language」. That is worth more than the file was: it is where the send
   goes, so no save function has to remember to send, and there is no second
   list of them to fall behind.

   The name is the chapter's and no longer describes what it does. Renaming it
   is seven files, six of them another session's, for a word.
   ========================================================================= */

/* Something changed, so the server is told. Not at once: NET_UPMS of quiet
   inside netSaveUp() (www/net.js) is what separates 「still typing」 from
   「stopped」, and that function decides everything else -- whether there is a
   session at all, and which of the twelve slices actually moved.

   Guarded because this file is loaded before www/net.js and www/boot.js calls
   it on the first render, which is three script tags before netSaveUp()
   exists. The launch has its own sync a moment later, so nothing is lost by
   the first call doing only half of its job. */
function bkTouch(){ if(typeof netSaveUp==='function') netSaveUp(); }
