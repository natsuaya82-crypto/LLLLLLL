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
   afternoon's work was this handset. **A save now goes up on the press that
   makes it**, which is what took the question away rather than what ignored
   it. docs/CHANGELOG.md 2026-09-04 carries the DELETE REVIEW.

   WHAT IS LEFT IS THE ONE LINE THE FILE WAS EVER REACHED BY. Seven save
   functions call bkTouch() -- exactly the seven writers in LANG_IO -- and it
   is the only place in this app that means 「a person has just changed their
   language」. That is worth more than the file was: it is where the send
   goes, so no save function has to remember to send, and there is no second
   list of them to fall behind.

   The name is the chapter's and no longer describes what it does. Renaming it
   is seven files, six of them another session's, for a word.
   ========================================================================= */

/* Something changed, so the server is told -- BY THE PRESS THAT CHANGED IT.
   「保存がサーバーに上がる時 →『保存を押したら』」 OWNER 2026-09-24.

   It used to be a burst: NET_UPMS of quiet after the last change, whether or
   not anybody pressed anything, so a letter drawn and then answered 「いいえ」
   had already gone up. There are two kinds of press now and no third:

   - On a screen with a Save, nothing reaches here before the Save: every
     writer asks langWrites() (www/core.js) and a screen with a Save on the
     trail is a draft. The Save writes and sends itself, and waits for the
     answer (keepSave, www/shell.js) -- KEEP_BUSY is that moment, so nothing
     is sent twice from here.
   - Everywhere else the press IS the save -- a word deleted from the list, a
     letter slot added, a row dragged. It is sent once the press has
     finished, so a press that calls three writers is one send and not three,
     and nobody waits for it: a send that does not land says so through
     netPop() (www/net.js), exactly as before.

   A launch does not call this (www/boot.js) and nothing runs a save before
   www/net.js is loaded -- index.html puts net.js ahead of this file, and the
   migrations that save are in boot.js, which is last. What they write is the
   app's (slAsApp, www/core.js § LTOUCH) and netSaveNow() does not send it. */
var BK_SEND=null;
function bkTouch(){
  if(BK_SEND || KEEP_BUSY) return;
  BK_SEND=setTimeout(function(){ BK_SEND=null; netSaveNow(); }, 0);
}
