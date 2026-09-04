/* Lingua — onboarding, which is the app until SET.done (chapter 5)
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   5. Onboarding (the only screen that exists before anything else)
      Its job is to prove, physically, that you can write a language without
      knowing anything first. AI is never mentioned here, not once.
   ========================================================================= */


/* Brand marks for the sign-in buttons. Google keeps its four brand colors;
   the Apple mark is monochrome and follows the button's text color. */
var MARK_GOOGLE='<svg class="mk" viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">'+
  '<path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>'+
  '<path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18z"/>'+
  '<path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34z"/>'+
  '<path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"/></svg>';
var MARK_APPLE='<svg class="mk" viewBox="0 0 16 20" width="17" height="17" fill="currentColor" aria-hidden="true">'+
  '<path d="M13.29 10.6c.02-2.02 1.65-2.99 1.72-3.04-.94-1.37-2.4-1.56-2.92-1.58-1.24-.13-2.42.73-3.05.73-.63 0-1.6-.71-2.63-.69-1.35.02-2.6.79-3.29 2-1.4 2.43-.36 6.03 1 8 .67.96 1.46 2.04 2.5 2 1-.04 1.38-.65 2.59-.65 1.21 0 1.55.65 2.61.63 1.08-.02 1.76-.98 2.42-1.95.76-1.11 1.07-2.19 1.09-2.25-.02-.01-2.09-.8-2.11-3.18z"/>'+
  '<path d="M11.35 4.63c.55-.67.92-1.6.82-2.53-.79.03-1.75.53-2.32 1.2-.51.58-.96 1.53-.84 2.43.88.07 1.79-.45 2.34-1.1z"/></svg>';

/* The scripts a character can be taken from. The inventories are written as
   escapes because they are code points, not copy: nothing here is translated,
   and spelled out they would read as untranslated text. Names live in 3.6. */
var WORLD_SCRIPTS = [
  {id:"runic",pv:"\u16a0\u16a2\u16a6\u16a8\u16b1",ch:"\u16a0 \u16a2 \u16a6 \u16a8 \u16b1 \u16b2 \u16b7 \u16b9 \u16ba \u16be \u16c1 \u16c3 \u16c7 \u16c8 \u16c9 \u16ca \u16cf \u16d2 \u16d6 \u16d7 \u16da \u16dc \u16de \u16df"},
  {id:"ogham",pv:"\u1681\u1682\u1683",ch:"\u1681 \u1682 \u1683 \u1684 \u1685 \u1686 \u1687 \u1688 \u1689 \u168a \u168b \u168c \u168d \u168e \u168f \u1690 \u1691 \u1692 \u1693 \u1694 \u1695 \u1696 \u1697 \u1698 \u1699 \u169a"},
  {id:"phoenician",pv:"\ud802\udd00\ud802\udd01\ud802\udd02",ch:"\ud802\udd00 \ud802\udd01 \ud802\udd02 \ud802\udd03 \ud802\udd04 \ud802\udd05 \ud802\udd06 \ud802\udd07 \ud802\udd08 \ud802\udd09 \ud802\udd0a \ud802\udd0b \ud802\udd0c \ud802\udd0d \ud802\udd0e \ud802\udd0f \ud802\udd10 \ud802\udd11 \ud802\udd12 \ud802\udd13 \ud802\udd14 \ud802\udd15"},
  {id:"glagolitic",pv:"\u2c00\u2c01\u2c02",ch:"\u2c00 \u2c01 \u2c02 \u2c03 \u2c04 \u2c05 \u2c06 \u2c07 \u2c08 \u2c09 \u2c0a \u2c0b \u2c0c \u2c0d \u2c0e \u2c0f \u2c10 \u2c11 \u2c12 \u2c13 \u2c14 \u2c15 \u2c16 \u2c17 \u2c18 \u2c19 \u2c1a \u2c1b \u2c1c \u2c1d \u2c1e \u2c1f \u2c20 \u2c21 \u2c22 \u2c23 \u2c24 \u2c25 \u2c26"},
  {id:"greek",pv:"\u0391\u0392\u0393\u0394\u0395",ch:"\u0391 \u0392 \u0393 \u0394 \u0395 \u0396 \u0397 \u0398 \u0399 \u039a \u039b \u039c \u039d \u039e \u039f \u03a0 \u03a1 \u03a3 \u03a4 \u03a5 \u03a6 \u03a7 \u03a8 \u03a9 \u03b1 \u03b2 \u03b3 \u03b4 \u03b5 \u03b6 \u03b7 \u03b8 \u03b9 \u03ba \u03bb \u03bc \u03bd \u03be \u03bf \u03c0 \u03c1 \u03c3 \u03c4 \u03c5 \u03c6 \u03c7 \u03c8 \u03c9"},
  {id:"cyrillic",pv:"\u0410\u0411\u0412\u0413\u0414",ch:"\u0410 \u0411 \u0412 \u0413 \u0414 \u0415 \u0416 \u0417 \u0418 \u041a \u041b \u041c \u041d \u041e \u041f \u0420 \u0421 \u0422 \u0423 \u0424 \u0425 \u0426 \u0427 \u0428 \u0429 \u042a \u042b \u042c \u042d \u042e \u042f \u0430 \u0431 \u0432 \u0433 \u0434 \u0435 \u0436 \u0437 \u0438 \u043a \u043b \u043c \u043d \u043e \u043f \u0440 \u0441 \u0442 \u0443 \u0444 \u0445 \u0446 \u0447 \u0448 \u0449"},
  {id:"hebrew",pv:"\u05d0\u05d1\u05d2\u05d3",ch:"\u05d0 \u05d1 \u05d2 \u05d3 \u05d4 \u05d5 \u05d6 \u05d7 \u05d8 \u05d9 \u05db \u05dc \u05de \u05e0 \u05e1 \u05e2 \u05e4 \u05e6 \u05e7 \u05e8 \u05e9 \u05ea"},
  {id:"georgian",pv:"\u10d0\u10d1\u10d2",ch:"\u10d0 \u10d1 \u10d2 \u10d3 \u10d4 \u10d5 \u10d6 \u10d7 \u10d8 \u10d9 \u10da \u10db \u10dc \u10dd \u10de \u10df \u10e0 \u10e1 \u10e2 \u10e3 \u10e4 \u10e5 \u10e6 \u10e7 \u10e8 \u10e9 \u10ea \u10eb \u10ec \u10ed \u10ee \u10ef \u10f0"},
  {id:"armenian",pv:"\u0531\u0532\u0533",ch:"\u0531 \u0532 \u0533 \u0534 \u0535 \u0536 \u0537 \u0538 \u0539 \u053a \u053b \u053c \u053d \u053e \u053f \u0540 \u0541 \u0542 \u0543 \u0544 \u0545 \u0546 \u0547 \u0548 \u0549 \u054a \u054b \u054c \u054d \u054e \u054f \u0550 \u0551 \u0552 \u0553 \u0554 \u0555 \u0556"},
  {id:"devanagari",pv:"\u0905\u0906\u0907",ch:"\u0905 \u0906 \u0907 \u0908 \u0909 \u090a \u090f \u0910 \u0913 \u0914 \u0915 \u0916 \u0917 \u0918 \u091a \u091b \u091c \u091d \u091f \u0920 \u0921 \u0922 \u0924 \u0925 \u0926 \u0927 \u0928 \u092a \u092b \u092c \u092d \u092e \u092f \u0930 \u0932 \u0935 \u0936 \u0937 \u0938 \u0939"},
  {id:"tibetan",pv:"\u0f40\u0f41\u0f42",ch:"\u0f40 \u0f41 \u0f42 \u0f44 \u0f45 \u0f46 \u0f47 \u0f49 \u0f4f \u0f50 \u0f51 \u0f53 \u0f54 \u0f55 \u0f56 \u0f58 \u0f59 \u0f5a \u0f5b \u0f5d \u0f5e \u0f5f \u0f60 \u0f61 \u0f62 \u0f63 \u0f64 \u0f66 \u0f67 \u0f68"},
  {id:"geez",pv:"\u1200\u1208\u1210",ch:"\u1200 \u1201 \u1202 \u1203 \u1204 \u1205 \u1206 \u1208 \u1209 \u120a \u120b \u120c \u120d \u120e \u1210 \u1211 \u1212 \u1213 \u1214 \u1215 \u1216 \u1218 \u1219 \u121a \u121b \u121c \u121d \u121e \u1220 \u1221 \u1222 \u1223 \u1224 \u1225 \u1226 \u1228 \u1229 \u122a \u122b \u122c \u122d \u122e \u1230 \u1231 \u1232 \u1233 \u1234 \u1235 \u1236"},
  {id:"arabic",pv:"\u0627\u0628\u062a\u062b",ch:"\u0627 \u0628 \u062a \u062b \u062c \u062d \u062e \u062f \u0630 \u0631 \u0632 \u0633 \u0634 \u0635 \u0636 \u0637 \u0638 \u0639 \u063a \u0641 \u0642 \u0643 \u0644 \u0645 \u0646 \u0647 \u0648 \u064a"},
  {id:"thai",pv:"\u0e01\u0e02\u0e04",ch:"\u0e01 \u0e02 \u0e03 \u0e04 \u0e05 \u0e06 \u0e07 \u0e08 \u0e09 \u0e0a \u0e0b \u0e0c \u0e0d \u0e0e \u0e0f \u0e10 \u0e11 \u0e12 \u0e13 \u0e14 \u0e15 \u0e16 \u0e17 \u0e18 \u0e19 \u0e1a \u0e1b \u0e1c \u0e1d \u0e1e \u0e1f \u0e20 \u0e21 \u0e22 \u0e23 \u0e25 \u0e27 \u0e28 \u0e29 \u0e2a \u0e2b \u0e2c \u0e2d \u0e2e"},
  {id:"hangul",pv:"\u3131\u3134\u3137",ch:"\u3131 \u3134 \u3137 \u3139 \u3141 \u3142 \u3145 \u3147 \u3148 \u314a \u314b \u314c \u314d \u314e \u314f \u3151 \u3153 \u3155 \u3157 \u315b \u315c \u3160 \u3161 \u3163"}
];

/* ---- Onboarding -------------------------------------------------------
   Three steps: the door, one letter drawn, the name.

   It used to open on a language picker, which is a question the app needs
   answered rather than one anybody came to answer. Then it opened on a
   drawing square: draw a shape, and immediately -- which single sound is
   this? That is only a question an alphabet has an answer to. It quietly
   decided, on the person's behalf, that they were making one, and it asked
   them to name a sound before they had chosen any sounds at all.

   And then it put them on a screen that said: coin your first word. With no
   sounds, no letters and no name, out of nothing.

   A mark, and then a name. Nothing is asked about sound: the language has an
   inventory from the moment it exists, and a drawn letter takes the next
   sound nothing reads yet. Making a script is a substitution on an alphabet
   somebody already has -- ohayo, annyon, ni hao -- so the sound is carried
   over rather than answered for, and the reading is corrected on the letter
   in the glyph editor by anyone who wants a different one.

   The name is last, because a language is easier to name once it has made a
   mark, and obFinish() can invent one for anybody who skips it. No word is
   asked for: a word is made of sounds and written in letters, and by the end
   of this there are both, so the dictionary is somewhere to go rather than
   somewhere to be sent. */
var ob={step:0, name:'', mode:'draw', pick:'', strokes:null, ch:'', lid:''};
/* How many steps there are, in one place: the dots count them and shot.mjs
   photographs them. It said 5 for as long as there were four, because nothing
   read it -- and dead-check, which watched functions, could not see a number
   nobody asked for. It watches top-level vars now, so this one is deleted the
   day it stops being read. */
/* The owner's order, and signing in is the LAST of it:

     1 draw one letter
     2 the keyboard
     3 the letters page
     4 the words page
     5 the grammar page
     6 name the language
     7 sign in

   OWNER 2026-08-28: 「キーボードの後、文字のページ、単語のページ、文法のページ、
   …→君の言語を決めよう→ログイン」

   Every stop is one of the app's OWN finished screens -- 「オンボーディングは
   追加だから基本完成したページを見せて欲しい。指でここ押すんだよみたいなやつは
   他のページでもそのまま使って」 OWNER 2026-08-28. Nothing here draws a picture
   of a screen; the walk points at what is already there.

   THERE IS NO MOCK OF A TIMELINE, and there is not going to be one made up
   out of nothing. The owner asked for 「君の文字でSNSを見てみよう（モックの
   ページ）」 and what was built for it was invented people saying invented
   words -- 「snsの画面それなに？ゴミはいらねえよ」 OWNER 2026-08-28. It is
   gone. Anything that stands here later has to be somebody's real writing,
   not something this file made up.

   The door was put FIRST once and that was a misreading of
   「とりあえずログインして、文字を書くところからやな」, which is what to
   BUILD first, not what comes first on screen. It goes back to the end,
   where the owner put it: somebody draws a letter and sees where it landed,
   and is asked to sign in once there is something to sign in for.

   That is why makeNeed() does not fire while SET.done is false -- the walk
   below is the one place making happens without a name on the account, and
   step 7 is where the account is asked for.

   Steps 2 to 5 are not screens of this file. They are the app itself, walked
   with everything but one thing greyed out -- OB_TOUR_STOPS below. The dots
   count the three SCREENS the onboarding has, in the order they come: the
   drawing, the name, the door. The walk is not one of them, because while it
   is running the app is showing its own screens and vOb() is not on the page
   at all. */
var OB_STEPS=4;
/* Which step is which, by name, because 0 1 2 3 in eight places is four
   chances to renumber three of them.

   「オンボーディング→最後にログイン」 OWNER 2026-08-27. The door is the LAST
   step and the drawing is the first, which is where the owner put them.

   It was moved to the front once, on 2026-08-26, and that was a misreading of
   「言語はアカウントないと作れないです」 -- which says what a language NEEDS,
   not what order the screens come in. The two do not fight: what somebody
   draws and names here is on the phone until the door at the end, and
   obFinish() puts it on the server the moment they are through it. That is
   the whole of what the account is needed FOR, and it is needed at step 3 of
   three rather than at step 1.

   「そんなの俺頼んでねえぞ」 OWNER 2026-08-28, of the door having been first.

   What did NOT come back with the order is the door's 「あとで」 button:
   「サインインしなかったときは門で止まるよ！」 OWNER 2026-08-23 was struck out
   on 2026-08-26 and that decision stands. Draw, name, and then sign in with
   no way past it.

   The three the dots count are 0, 1 and 2, in the order they happen. The walk
   is last on purpose and not because it happens last -- it is not a screen of
   this file at all, vOb() is not on the page while it runs, so keeping it
   outside the counted range is what lets obDots() stay a plain loop. The
   numbers are in the order the screens COME, which is what makes `i<=s` in
   obDots() the right test: the walk runs between OB_DRAW and OB_NAME, and
   nothing on the screen counts it. */
var OB_DRAW=0, OB_SNS=1, OB_NAME=2, OB_IN=3, OB_TOUR=4;

/* ---- the walk through the app itself -----------------------------------
   Steps three to six of the owner's order are not screens of their own. They
   are THE APP, with everything but one thing greyed out and a line saying to
   press that one thing.
   「本物の画面だよー！ここをタップしてねみたいにして他はグレーアウトして
     進めるあのゲームとかにありがちなオンボーディングにしたいなーって」

   Each stop is a route, the thing on it to press, and what to say. The tour
   does not drive the app -- the app drives the tour: pressing the lit thing
   does what it really does, which lands on the next stop's route, and
   obTourAt() notices and moves on. So nothing here is a mock of a screen and
   nothing can get out of step with one.

   NOTHING IS WRITTEN ON THE SCREEN. 「文字いらなくない？」 A hand pointing at
   the one bright thing on a grey screen is the whole instruction, and this
   app does not explain itself anywhere else either. `lab` is what the stop
   would have said, and it is the pad's aria-label -- a finger is not
   something VoiceOver can read out. */
var OB_TOUR_STOPS=[
  /* The app, and the way into the making side. It was missing and the walk
     began ON the making screen -- which is the one screen somebody arriving
     has not been shown how to reach. 「制作ボタン押してキーボードの画面開いて
     とかないよ？」 */
  { r:'profile', a:'', tab:'build', lab:'ob.tour.tab' },
  { r:'build', a:'', go:'kb', lab:'ob.tour.build' },
  /* The free plan has no LIST of keyboards -- board 0 is the keyboard and the
     chapter opens straight onto it -- so the owner's fourth and fifth stops
     are one screen here, and the thing lit on it is the key the letter just
     drawn ended up on. It is the last of them: tapping it ends the walk. */
  /* NOBODY TAPS THE KEY. The stop shows itself: the key is lit, `a` fades off
     it and the letter just drawn is underneath -- obTourHTML()'s `obwas`,
     which starts .9s in and is done at 1.4s -- and then the walk moves itself
     on to the back arrow, where the hand is waiting.
     「キーボードもaをタップしないで開いて1秒後にぱって変わって、変わったら戻るに
       手を置いて欲しい」 OWNER 2026-08-28.
     `auto` is the milliseconds. The key is still pressable; it is simply no
     longer the only way out. */
  { r:'kb',    a:'', lt:1, auto:1800, lab:'ob.tour.kb1' },
  /* And then the chapters, each one ENTERED from the contents and LEFT by
     pressing the app's own back arrow. 「単語とかやったら戻る」 and
     「戻るボタン押させてないね」 OWNER 2026-08-28 -- the second of those is
     what `bk` is: the walk used to carry the person back to the contents
     itself, so the one gesture they need most in this app was the one gesture
     the walk never let them make. Now the finger points at the arrow and the
     press is theirs. 「指で合図してあげて」

     THE WORDS AND GRAMMAR CHAPTERS ARE NOT ON THE WALK.
     「単語のとこなにもないなら行かせなくていいか」 and 「文法ページも開かなくて
     いいかも」 OWNER 2026-08-28 -- a new dictionary is empty, so that stop lit
     an empty list and pointed a finger at nothing; grammar came off with it.
     What is left is the two a new phone has something in: the keyboard, with
     the letter just drawn on a key, and the alphabet.

     Three kinds of stop and each says what a press does -- obTourNext():

       go / tab   a door. Pressing the real thing goes there and obTourAt()
                  notices; the walk does not move itself.
       bk         the app's own back arrow, which is a door too: back() lands
                  on the contents, which is the next stop.
       look / lt  a page, or a key. Nothing on it leads where the walk goes
                  next, so the walk moves itself. */
  { r:'kb',      a:'', spot:'.navtop .back.nb', bk:1, lab:'ob.back' },
  { r:'build',   a:'', go:'letters', lab:'ob.tour.row.letters' },
  { r:'letters', a:'', spot:'.body', look:1, lab:'ob.tour.letters' },
  { r:'letters', a:'', spot:'.navtop .back.nb', bk:1, lab:'ob.back' },
  /* And the other half of the app. 「ここが制作、ここがsnsって最後まで見せて
     ログイン画面にしよう」 OWNER 2026-08-28: the first stop of the walk points
     at the making side, and this one points at the timeline.

     It is `look` and not `tab`, which is the one place this walk does not
     press what it points at, and the reason is the next step rather than a
     shortcut: vFeed() in www/sns.js answers snsLocked() to anybody with no
     account, so pressing this tab for real lands on a sign-in form in the
     middle of the walk. Pressing it here ends the walk, and what comes up is
     the timeline -- obSnsHTML() -- with the door two steps after it. */
  { r:'build',   a:'', tab:'feed', look:1, lab:'ob.tour.sns' }
];
/* Where the tour has got to. Where you are standing, so viewReset() drops it. */
var obTour=0;
function obTourOn(){ return !SET.done && ob.step===OB_TOUR; }
function obTourStop(){ return OB_TOUR_STOPS[Math.min(obTour, OB_TOUR_STOPS.length-1)]; }
/* The route the tour wants to be on. render() sends the app there rather than
   drawing a picture of it. */
function obTourGo(){
  var st=obTourStop();
  if(here().r!==st.r || String(here().a||'')!==st.a) go(st.r, st.a);
  else render();
}
/* The app moved. If where it landed is the NEXT stop, the tour moves with it;
   the person did the thing rather than being shown it. */
function obTourAt(){
  var n=OB_TOUR_STOPS[obTour+1], c=obTourStop();
  if(!n) return;
  /* Only a MOVE advances it. Two stops in a row can be the same screen -- the
     keyboard, then the sentence over it -- and a route that has not changed
     is not somebody having done the thing. Those advance on their own button. */
  if(n.r===c.r && n.a===c.a) return;
  if(here().r===n.r && String(here().a||'')===n.a){ obTour++; }
}
/* Done with the walk through the app. What is after it is the timeline. */
function obTourDone(){ obGo(OB_SNS); }
/* And back out of it, one stop at a time.

   There was no way back inside the walk at all: obBack() ended at
   `if(ob.step>0) obGo(ob.step-1)`, which steps the FILE's screens, and the
   walk is not one of them -- so one press from the step after it fell all the
   way to the drawing square. 「一個戻るボタンしたら書くところからになるのクソ」
   OWNER 2026-08-28.

   Out of the first stop is out of the walk, which is the drawing square: it is
   where the walk was entered from, by both roads (obDone and obTakeCh,
   obTakeCh). obTour is left where it is by obGo(), which is what lets the
   step after the walk come back INTO it at the stop it left. */
function obTourBack(){
  obAuto=-1;
  if(obTour>0){ obTour--; obTourGo(); return; }
  obTour=0; obGo(OB_DRAW);
}
/* The hand that says tap. 「矢印か指とかでタップなんとかみたいにもっとやろうぜ」
   A hand with the index finger out, stood under the thing to tap so the
   finger comes up at it. It is drawn INSIDE the light rather than on the
   grey, which is why it needs no colour of its own beyond the gold every
   other mark in this app is: a gold hand on a half-black scrim is a hand
   nobody can see, and the colour that would fix that is a new one in a
   stylesheet this session does not own. */
var OB_HAND='<svg viewBox="0 0 24 24" width="54" height="54" fill="currentColor" aria-hidden="true">'+
  '<path d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 '+
  '13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83'+
  '-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 '+
  '4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z"/></svg>';
/* Where the hand stands, given the box of the thing to tap. Under it, so the
   finger points up at it -- and over it, turned over, when the thing is too
   low on the screen for that. Kept inside the edges either way. */
function obHandBox(b){
  /* m is NEGATIVE: the hand OVERLAPS the thing it points at by that much, so
     the fingertip is on it rather than beside it -- a finger held an inch
     off the screen is a finger pointing at the gap. */
  var s=54, m=-15, W=window.innerWidth, H=window.innerHeight,
      up=(b.bottom+m+s <= H-8),
      x=Math.round(b.left+b.width/2-s/2),
      y=Math.round(up? b.bottom+m : b.top-m-s);
  if(x<8) x=8;
  if(x+s>W-8) x=W-8-s;
  return {left:x, top:y, w:s, h:s, up:up};
}
/* One pane of the grey. */
function obPane(l, t2, w, h){
  return '<div class="sbg on" data-dim="1" style="left:'+Math.round(l)+'px;top:'+Math.round(t2)+
    'px;width:'+Math.max(0,Math.round(w))+'px;height:'+Math.max(0,Math.round(h))+'px"></div>';
}
/* Where a thumb may land: the lit thing and the hand together. Not the same
   rectangle as the hole in the grey -- the light says which one thing this is
   about, and a hand hanging below it is still part of pressing it. */
function obTapBox(b, hb){
  var x=Math.min(b.left, hb.left), y=Math.min(b.top, hb.top),
      w=Math.max(b.right, hb.left+hb.w)-x, h=Math.max(b.bottom, hb.top+hb.h)-y;
  return 'left:'+Math.round(x)+'px;top:'+Math.round(y)+'px;'+
         'width:'+Math.round(w)+'px;height:'+Math.round(h)+'px';
}
/* The grey, the one bright thing, and the hand pointing at it.

   FOUR panes of grey with a hole between them, not one pane with the lit
   thing lifted through it. Lifting was tried and does not work: .view
   animates on arrival, an animation makes a stacking context, and a z-index
   inside one cannot climb out of it -- so the lit thing stayed under the grey
   and the whole screen was flat. Four rectangles have no such argument to
   lose, and what is not covered is bright and is tappable.

   The hole is the lit thing AND the hand together, so the hand stands in the
   light with it. .sbg is the sheet's own backdrop and .toast is the line the
   app already pins above the tab bar; both are borrowed rather than written,
   because www/index.html belongs to another session today.

   Every box here is written into the MARKUP, and that is not a tidy-up: a
   check renders a screen and measures it without ever calling render(), so
   geometry that arrives afterwards is geometry nothing can check -- press
   found the pad as a button four pixels across, which is what it was. What a
   screen returns is what the screen IS. The lit thing is on the page by the
   time this runs: render() inserts the screen, then adds the walk to the end
   of it. */
function obTourHTML(){
  var st=obTourStop(),
      el=obTourFind(st), b=el? el.getBoundingClientRect() : null,
      W=window.innerWidth, H=window.innerHeight,
      hb=b? obHandBox(b) : null, m=4, x, y, w, h, out,
      /* What the lit key used to be, for the moment below. Only where the
         thing lit IS the key of the letter just drawn -- the fallback lights
         the whole keyboard, and a keyboard was never one roman letter. */
      was=(st.lt && b && el && el.getAttribute && el.getAttribute('data-lt'))
            ? String(ltName(ltById(ob.lid))||'') : '';
  /* THE HOLE IS THE LIT THING AND NOTHING ELSE.

     It used to be the lit thing AND the hand together, so that the hand stood
     in the light -- and the hand is 54px tall standing under what it points
     at, which on a list is the NEXT ROW. Two rows of the contents came up
     bright and the walk was pointing at both.
     「それ単語と文法で両方光ってるやんけ」 OWNER 2026-08-28.

     The hand is over the grey now. It is legible there for the same reason
     the chevron above it is: gold is what this app makes a thing you press,
     and the scrim is the same half-black in both themes. What the hand is
     part of is the TAP TARGET, not the light -- obTapBox() below. */
  if(!b) out=obPane(0,0,W,H);   /* nothing found: the grey is the whole screen */
  else{
    /* ROUNDED ONCE, HERE. Every pane used to round its own edge, so two that
       meet along the same line landed a pixel apart -- and where they
       overlapped, two half-black scrims made a black line round the lit thing.
       That is the "frame": there is no border anywhere, it was the grey drawn
       twice. 「黒い枠がずれてるからなくてもいい」 OWNER 2026-08-28. Integers
       from one calculation abut exactly. */
    x=Math.round(b.left-m);  y=Math.round(b.top-m);
    w=Math.round(b.width+m*2);  h=Math.round(b.height+m*2);
    out=obPane(0,0,W,y)+                   /* above */
        obPane(0,y+h,W,H-(y+h))+           /* below */
        obPane(0,y,x,h)+                   /* left  */
        obPane(x+w,y,W-(x+w),h);           /* right */
  }
  return obTourArm()+out+
    /* A lit thing that does something of its own is pressed for real -- the
       row into the keyboard chapter goes there, and going there is what moves
       the tour on. Three cases need a tap target of the walk's own:

       A lit thing that does NOTHING. The free keyboard's keys are spans,
       because there is no editor behind them.

       A stop that is a PAGE rather than a door -- `look` above. The letters,
       words and grammar pages are what somebody came to be shown, and none of
       them has a thing on it whose job is to lead to the next one.

       And NOTHING LIT AT ALL, which is the way out of a locked screen rather
       than a nicety. ob.lid is empty for anybody who skipped the drawing, so
       the stop that lights the key they drew has no key to light -- and a
       grey screen with nothing on it to press is an app somebody cannot leave.
       Here the pad is the whole screen: tap anywhere.

       It is in the MARKUP rather than written onto the element afterwards, and
       that is not a detail either: act-check reads what a screen RETURNS, so a
       name set on the live DOM is a name nothing can check.

       Called obtap and NOT obpad, which is taken: .obpad is the square the
       first letter is drawn in, and it carries a size and `margin:8px auto 0`.
       A fixed element wearing it keeps its own left and top and takes the
       8px anyway, so the tap target sat eight pixels below the thing it was
       supposed to be over -- invisibly, because it has no colour. */
    /* ONE TAP TARGET, on every stop, over the lit thing and the hand together.

       It used to be only for a lit thing that does nothing of its own. The
       stops that DO something -- a tab of the bar, a row of the contents --
       had none, so the hand standing under them was on the grey and a press
       there did nothing. That is most of this walk, and the hand is the only
       mark on the screen saying "press": it was found by filming the walk and
       tapping the finger nine times without the app ever leaving the first
       screen.

       What a press DOES is obTourNext()'s to say, in one place, and it is not
       the same answer on both kinds -- see there. */
    /* NOT ON A STOP THAT MOVES ON BY ITSELF. The keyboard shows the letter
       arriving and then walks on; a tap target sitting on the key says press
       me, and there is nothing to press.
       「キーボードのaのところまだタップボタン出るからそれ無くして」 OWNER
       2026-08-28. */
    (st.auto? '' :
     '<button class="obtap"' + DO('obTourNext') +
              /* border:0 AND padding:0. `.obtap` has no rule in the stylesheet
                 -- it is positioned from here, because a fixed thing over the
                 app's own screen cannot be laid out by a class -- so the
                 button kept the BROWSER'S default border, and that is the
                 black square. It looked misaligned because it is not the lit
                 box: this is the lit thing AND the hand.
                 「枠の黒四角もなくして欲しいけどそれはなに？」 OWNER 2026-08-28.
                 Not a corner and not a rule in index.html, so rule 18 is
                 untouched -- this takes a border AWAY. */
              ' style="position:fixed;background:none;border:0;padding:0;z-index:42;'+
              /* THE LIT THING AND THE HAND, which is bigger than the light.
                 The hand stands under what it points at, and it was outside
                 this button -- so the one thing on the screen saying "press"
                 was the one place a press did nothing. It is not the same
                 rectangle as the hole above: the light says WHICH ONE, and
                 this says WHERE A THUMB LANDS. */
              (b? obTapBox(b, hb) : 'left:0;top:0;width:100%;height:100%')+'"'+
              ' aria-label="'+esc(t(st.lab))+'"></button>')+
    /* THE MOMENT. 「aが自作文字に変わる瞬間みたいなの見せたい」
       The key is theirs now -- the shape moved into the slot when they named
       it -- so what is left to show is what that key WAS. The roman letter is
       laid over the key, in the key's own surface colour, and fades off it
       after a beat: a becomes the letter they drew, while they watch.

       vin is index.html's own fade-in, run backwards and left where it ends.
       No keyframe of its own, because that file is another session's today.
       Nothing here is stored and nothing here is undone: the letter under it
       is already the letter, and this is a picture of the change that just
       happened. */
    (was? '<span class="obwas" aria-hidden="true" style="position:fixed;z-index:44;'+
              'left:'+Math.round(b.left)+'px;top:'+Math.round(b.top)+'px;'+
              'width:'+Math.round(b.width)+'px;height:'+Math.round(b.height)+'px;'+
              'display:flex;align-items:center;justify-content:center;pointer-events:none;'+
              'background:var(--sf);color:var(--tx);font-size:1.05rem;'+
              'animation:vin .5s ease-out .9s 1 reverse forwards">'+esc(was)+'</span>' : '')+
    /* And the hand, which is the whole of what this screen says.
       「文字いらなくない？」 */
    /* AND NO HAND ON A STOP THAT MOVES ON BY ITSELF. The hand means "press
       this", and there is nothing to press here: the key is lit, the letter
       arrives on it, and the walk goes on to the back arrow -- where the hand
       is waiting, because that one IS a press.
       「aのところ触らなくてよくしたから指のマークなしで変わってるとこだけ見せて」
       OWNER 2026-08-28. */
    ((hb && !st.auto)? '<div class="obhand" aria-hidden="true" style="position:fixed;z-index:43;'+
              'pointer-events:none;color:var(--gold);line-height:0;'+
              'left:'+hb.left+'px;top:'+hb.top+'px;width:'+hb.w+'px;height:'+hb.h+'px;'+
              'animation:vopulse 1.1s ease-in-out infinite'+
              (hb.up? '' : ';transform:scaleY(-1)')+'">'+OB_HAND+'</div>' : '')+
    /* And the way back, which the walk did not have at all.

       Every other screen of the onboarding carries this chevron in its corner
       -- vOb() puts it there -- and the walk is the one part that is not a
       screen of this file, so it had none: the only way out of the middle of
       the walk was forwards. 「一個戻るボタンしたら書くところからになるのクソ」

       It is `.obback`, the same class and the same 44pt target as the one on
       the other screens, stood in the same corner. Nothing new is styled: what
       is written here is where it stands, because a fixed thing over the app's
       own screen cannot be laid out by a class that was written for a row.

       Gold, for the same reason the hand is: over the grey, gold is what this
       app makes things you can press, and `color:inherit` is the page's text
       colour, which on the light theme is black on a half-black scrim.

       It stands ON the screen's own back arrow where the screen has one, and
       that is not a nicety: at a fixed 8,8 it landed beside `.back.nb` rather
       than on it, and the corner had TWO arrows in it -- one gold and live,
       one grey and dead, a few pixels apart. The screens with no arrow of
       their own (the roots -- profile, feed) have nothing there to stand on
       and nothing to collide with, so those take the corner. */
    (obBackBox()? obBackBox()+'>'+OB_CHEV+'</button>' : '');
}
/* Where the walk's chevron stands: on the screen's own back arrow, or in the
   corner when the screen has none. Everything up to the `>` of the tag,
   because the two cases differ only in the four numbers. */
function obBackBox(){
  /* Nothing at all on a stop whose lit thing IS the back arrow: the walk's
     chevron stands exactly there, and two back arrows in one corner going two
     different ways is worse than being one screen without ours. The stop
     after it has it again, and stepping back from there returns here. */
  if(obTourStop().bk) return '';
  var el=document.querySelector('.navtop .back.nb'), b=el? el.getBoundingClientRect() : null,
      pos=(b && b.width)
        ? 'left:'+Math.round(b.left)+'px;top:'+Math.round(b.top)+'px;'+
          'width:'+Math.round(b.width)+'px;height:'+Math.round(b.height)+'px'
        : 'left:8px;top:8px';
  return '<button class="obback"' + DO('obTourBack') + ' aria-label="'+esc(t('ob.back'))+'"'+
    ' style="position:fixed;z-index:45;'+pos+';color:var(--gold)"';
}
/* Which thing on the screen is the lit one. A stop names it one of two ways
   and both are read here: a plain CSS selector where the thing has a class of
   its own, and a ROUTE where it is a row that navigates -- because a row's
   argument is JSON inside an attribute, and matching that with a selector is
   matching somebody else's quoting. Reading the attribute and comparing what
   is in it cannot be broken by an escape. */
function obTourFind(st){
  if(st.spot) return document.querySelector(st.spot);
  /* A tab of the bar at the foot. It is its own case rather than the route
     match below, because the bar says goTab and a row says go, and a screen
     can hold both for the same route. */
  if(st.tab) return obTourArg('.tabbar [data-do="goTab"]', st.tab);
  /* The key the letter just drawn is on. kbHTML() puts the letter's id on
     every letter key, so this is the one place that has to agree with it.

     It is allowed not to be there, and that is not an edge case: the step
     before this one does not make anybody say which letter of the alphabet
     they have drawn -- 「選ばなくても出られる」 -- and a shape nobody has put
     a name to is on no key of a QWERTY, because a QWERTY finds its keys by
     name. The keyboard itself is what is lit then. It is the true sentence
     in both cases: this is where your letters are. */
  if(st.lt) return (ob.lid && document.querySelector('#kb .kbk[data-lt="'+ob.lid+'"]'))
                   || document.querySelector('#kb');
  if(!st.go) return null;
  return obTourArg('[data-do="go"]', st.go);
}
/* The one of these whose first argument is this. A row's argument is JSON
   inside an attribute, and matching that with a selector is matching somebody
   else's quoting; reading the attribute and comparing what is in it cannot be
   broken by an escape. */
function obTourArg(sel, want){
  var els=document.querySelectorAll(sel), i, a;
  for(i=0;i<els.length;i++){
    try{ a=JSON.parse(els[i].getAttribute('data-a')||'[]'); }catch(e){ a=[]; }
    if(a[0]===want) return els[i];
  }
  return null;
}
/* What pressing the bright part of the screen does, and it is two different
   answers written in one place.

   A stop whose lit thing DOES something -- a tab of the bar, a row of the
   contents -- presses that thing, and the walk is not moved from here at all:
   the app moves and obTourAt() notices where it landed, exactly as when the
   row itself is pressed. Nothing about "the app drives the tour" changes; the
   hand simply becomes another way of pressing the row it points at.

   A stop that is a PAGE, or a key, or a screen with nothing found to light,
   has nothing of its own to do, so the walk moves itself. */
/* A stop that moves on by itself after a beat. Armed from the markup, once per
   stop: obAuto remembers which one it fired for, so a re-render does not set a
   second timer and a timer that outlives its stop does nothing. */
var obAuto=-1;
function obTourArm(){
  var st=obTourStop(), at=obTour;
  if(!st.auto || obAuto===at) return '';
  obAuto=at;
  setTimeout(function(){
    if(obTourOn() && obTour===at) obTourNext();
  }, st.auto);
  return '';
}
function obTourNext(){
  var st=obTourStop(), el;
  if(!st.lt && !st.look){
    el=obTourFind(st);
    if(el && el.click){ el.click(); return; }
  }
  if(obTour+1<OB_TOUR_STOPS.length){ obTour++; obTourGo(); return; }
  obTourDone();
}
var OB_CHEV='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
/* The door: a frame, a panel set inside it, a handle. Stroked in currentColor
   so it is gold in both themes and needs no fill to be legible on either.
   Nothing stands in the doorway -- it has not been opened yet, and a letter
   there would be one nobody has drawn. */
var OB_DOOR='<svg viewBox="0 0 124 188" fill="none" stroke="currentColor" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M6 186V62a56 56 0 0 1 112 0v124" stroke-width="1.6" opacity=".85"/>'+
  '<path d="M6 186V62a56 56 0 0 1 112 0v124Z" stroke="none" fill="currentColor" opacity=".055"/>'+
  '<path d="M17 186V64a45 45 0 0 1 90 0v122" stroke-width="1" opacity=".38"/>'+
  '<circle cx="98" cy="120" r="3.1" stroke="none" fill="currentColor" opacity=".8"/>'+
  '<path d="M2 186h120" stroke-width="1.2" opacity=".5"/></svg>';
var OB_CHEVR='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

function obGo(n){ ob.step=n; GE=null; render(); window.scrollTo(0,0); }
/* There is no way back out of 'who': the account exists by then, and the
   screen behind it would offer to sign in as somebody else. */
/* WHETHER THE DOOR IS WHAT IS ON THE SCREEN, asked in one place because
   three asked it and two of them got it wrong. vOb() had the sentence; the
   chevron and what the chevron DOES each had their own, and neither of theirs
   knew about the door's inner faces. */
function obAtDoor(){
  return appIs()==='door' || !!obPending() || ob.step===OB_IN;
}
/* And which face of the door has another face behind it. Every one of them
   was travelled to from another: the digits from the sign-up form, the reset
   from the address it was sent to, the new password from that same address.
   Only the face the door OPENS on has nothing behind it, and 'who' is the one
   where going back would offer to sign in as somebody else. */
function obDoorBack(){
  var m=OBM.mode;
  if(m==='code') return 'up';
  if(m==='reset') return 'forgot';
  /* Nothing behind the password. Both roads reach it with a session already
     in hand -- the digits were spent to get one -- so the screens behind it
     ask for an address that has been proved and an account that exists. */
  if(m==='newpw') return '';
  if(m==='forgot' || m==='up') return 'in';
  return '';
}
function obCanBack(){
  /* At the door there is always somewhere to be out to -- it is never the
     app any more, it is somewhere you were sent from. Except once the
     account exists: the screen behind 'who' would offer to sign in as
     somebody else. */
  /* THE DOOR'S OWN FACES FIRST, and this is the half that was missing:
     『後追加でメールを確認のボタンに再送信ボタンと戻るボタンがない』 OWNER
     2026-09-02. Signed out, appIs() is 'door' and the line below answered
     false for the whole of it -- including the code screen, which is
     three presses in from the face the door opens on. A person who mistyped
     their address was standing on a screen with no way off it.

     What that line was right about is the OUTERMOST face: signed out, the app
     IS this screen -- 「他の画面に行かせるな。ログアウトの時は。」 -- so a
     chevron there would be a way into an onboarding they finished months ago.
     obDoorBack() is the difference: it answers '' for exactly that face. */
  if(obAtDoor()){
    if(obDoorBack()) return true;
    /* AND OUT OF THE PASSWORD SCREEN INTO THE APP. 「サインインしたらアプリに
       移動してください」 OWNER 2026-09-02. Both roads reach it with a session
       already in hand -- the code was spent to get one -- so the person
       standing here is signed in, and a screen of one field and one button
       that goes nowhere is a person locked OUT of an app they are already
       inside. It is what netSetPass() failing leaves behind.
       The password is still asked for; this is the way past a screen that
       cannot finish, not a way around being asked. */
    if(OBM.mode==='newpw') return netSignedIn();
    /* and out of the door itself, only where there is somewhere it was
       opened FROM */
    return !!obPending() && OBM.mode!=='who';
  }
  /* Nothing is behind the first step. */
  return ob.step>OB_DRAW || ob.mode==='borrow';
}
function obBack(){
  /* The chevron in the corner is the only way back in the onboarding, so the
     door goes through it too rather than growing one of its own. Out of the
     code back to the account it was sent for, out of anything else back to
     signing in, and out of signing in to wherever the door was opened
     from. */
  /* Inside the door, obDoorBack() is the one place that says what is behind
     each face -- out of the reset back to the address it was sent to, so a
     mistyped address is one press from being retyped rather than two; out of
     the new password back to the address and NOT back to the digits, because
     the code that got here has been spent. */
  if(obAtDoor()){
    var m=obDoorBack();
    if(m){ obMailGo(m); return; }
    /* Signed in already, so this is the app rather than a step of the walk.
       obIn() is the one road in and decides everything itself -- the profile,
       the languages, and whether this is a return to Settings or the end of
       the onboarding. */
    if(OBM.mode==='newpw' && netSignedIn()){ obIn(); return; }
    if(obPending()){ obReturn(); return; }
    return;
  }
  if(ob.step===OB_DRAW && ob.mode==='borrow'){
    if(ob.pick){ ob.pick=''; render(); return; }      /* out of one script, back to the fifteen */
    ob.mode='draw'; render(); window.scrollTo(0,0); return;
  }
  /* Out of the name is back INTO the walk, at the stop it was left on -- not
     out of the walk and not past it. obTour is still sitting where the walk
     ended, because obTourDone() no longer clears it. This is the press the
     owner made: one back from the step after the walk used to land on the
     drawing square, four screens away.
     「一個戻るボタンしたら書くところからになるのクソ」 OWNER 2026-08-28. */
  if(ob.step===OB_SNS){ ob.step=OB_TOUR; GE=null; obTourGo(); return; }
  if(ob.step>0) obGo(ob.step-1);
}
function obLang(v){ SET.ui=v; save(); render(); }

/* ---- the door, which is not a step ------------------------------------ */
/* Signing in is the LAST step of the onboarding and the app does not open on
   it. 「オンボーディング→最後にログイン」 OWNER 2026-08-27.

   It was put first for two days, on the reading that 「言語はアカウントないと
   作れないです」 means the account has to exist before anything is drawn. It
   does not: what it says is that a language needs an account, and the account
   at the end of the walk is the account the language gets. Somebody draws a
   letter, names what they are making, and is asked to sign in once there is
   something to sign in FOR -- and obFinish() sends what they made up the
   moment they are through.

   The question the old argument was about -- you drew a letter here, and the
   account you just signed into already has a language, which one survives --
   is netLangSync()'s, and it MERGES. It is not answered by making sure
   nothing has been drawn yet.

   This is also a screen the app goes TO, from the two places that need a name
   and from Settings, and obDoor() is how. obPending() is what says so, and
   is the same pair of stored things that has always said it.
   Apple and Google are the plugin's; the mail door below is this file's. */
/* Signing in with Apple, and with Google. Both hand the app an identity
   token without ever opening a browser, and net.js exchanges it for a
   session -- one call, one word different.

   ONE plugin does both: @capgo/capacitor-social-login, which is the only one
   of the three written against Capacitor 8, and which also covers Android on
   the day there is an Android. Facebook and X are switched off in
   capacitor.config.json so their SDKs are never linked -- an app that ships
   Facebook's SDK owes App Review an explanation, and this one would have
   nothing to say.

   Nothing here runs in a browser: `Capacitor.Plugins` is a phone's word and
   obNative() says so rather than letting the button appear to do nothing. */
function obNative(name, call){
  var P=window.Capacitor && Capacitor.Plugins, p=P && P[name];
  if(!p){ toast(t('net.nonative')); return null; }
  return call(p);
}
/* The plugin is told who we are once per launch and not once per press. It is
   a separate step from logging in because Google's SDK wants its client id
   before it is asked for anything, and because a failure here is a failure to
   CONFIGURE -- a different thing from somebody closing the sheet. */
var OB_SL=false;
function obReady(p, go){
  if(OB_SL){ go(); return; }
  /* Apple takes an empty redirect on iOS: the sheet is the system's own and
     there is nowhere to come back from. Google is named only when there is a
     name -- see GOOGLE_IOS_ID in net.js. */
  var o={ apple:{ redirectUrl:'' } };
  if(GOOGLE_IOS_ID) o.google={ iOSClientId:GOOGLE_IOS_ID };
  p.initialize(o).then(function(){ OB_SL=true; go(); })['catch'](obShrug);
}
/* THE NONCE, and it is Google's alone.
   「Passed nonce and nonce in id_token should either both exist or not」 --
   the sentence on the owner's phone, pressing Google. Supabase hashes what
   was sent and compares it to the token's `nonce` claim, and refuses ONE
   SIDE existing without the other before it ever compares them.

   THE PLUGIN'S GOOGLE ROAD IS TWO ROADS AND ONLY ONE OF THEM READS THE
   NONCE. `GoogleProvider.swift:81` in @capgo/capacitor-social-login 8.4.4:

     if hasPreviousSignIn() && !forceAuthCode && mode != .OFFLINE {
         restorePreviousSignIn { ... refreshTokensIfNeeded ... }
     } else {
         login()          // the only place payload["nonce"] is read
     }

   `restorePreviousSignInWithCompletion:` takes no nonce at all (GIDSignIn.h
   :124); only the interactive signIn(...nonce:) does (:218). So a phone that
   has signed in with Google before -- which is every phone after the first
   press -- handed its nonce to a road that never looks at it, and the token
   came back with no claim on it: `(nonce id_token:n sent:y)`.

   `forcePrompt` is what closes that: it sets `forceAuthCode`, the condition
   goes false, and the interactive road runs. It is set HERE, beside the
   nonce, because the two are one statement -- a nonce handed to the road
   that cannot read it is a nonce that was not handed over, and the two of
   them apart is how this was wrong for two days with a check green over it.

   AND IT IS WHAT THE OWNER ASKED FOR. 「あと違うアカウントでログインしてんのに
   前のやつ出てくるんだけど？」 OWNER 2026-08-31 -- the previous account
   coming back IS that restore road. Asking which account is the fix to both.

   WHERE THE CLAIM ON BUILD 106's TOKEN CAME FROM, since it is written down
   as unknown in three places: AppAuth, one layer under GoogleSignIn.
   `OIDAuthorizationRequest.m:182` builds any request made without a nonce as
   `nonce:[[self class] generateState]` -- it invents one. That is why the
   token had a claim while nothing in this repository, the plugin or
   GoogleSignIn ever asked for one. It also means the road below can never be
   left with no nonce on it, whichever way this is written.

   APPLE IS NOT TOUCHED. `nn` is null outside `who==='google'`, so Apple is
   handed neither a nonce nor a forcePrompt and sends the same `''`. Apple's
   provider has one road (`AppleProvider.swift:201` always performs the
   request) and sets `request.nonce` only from the payload, and Apple's own
   framework invents nothing -- so both sides stay quiet, which is the other
   way of satisfying the same condition. Adding one side to a road that works
   would be this exact bug pointed the other way. */
function obSocial(who, opts){
  obNative('SocialLogin', function(p){
    /* Busy is set HERE and not by the two callers, because obNative() answers
       for a plugin that is not in this build by saying so and returning --
       and a spinner started before that check is a spinner nothing stops. */
    OBM.busy=true; render();
    obReady(p, function(){
      /* Made once, here, so the two halves cannot come from two draws: the
         hash handed to the provider and the raw sent to Supabase are one
         pair or the sign-in is exactly the failure it is meant to fix. */
      var nn=(who==='google')? netNonce() : null;
      if(nn){ opts.nonce=nn.hash; opts.forcePrompt=true; }
      p.login({ provider:who, options:opts }).then(function(r){
        var tok=r && r.result && r.result.idToken;
        /* A sign-in that came back without a token is not a session and must
           not be treated as one. It is also not an error anybody can act on,
           so it closes the way closing the sheet does. */
        if(!tok){ obShrug(); return; }
        netIdToken(who, tok, nn? nn.raw : '', obIn, obNo);
      })['catch'](obShrug);
    });
  });
}
function obSignInApple(){ obSocial('apple', { scopes:['name','email'] }); }
function obSignInGoogle(){
  /* Without a client id there is no Google to sign in to, and the same words
     are said as when the plugin itself is missing -- because from where
     somebody is standing it is the same fact: not in this build. */
  if(!GOOGLE_IOS_ID){ toast(t('net.nonative')); return; }
  obSocial('google', {});
}
/* AND SIGNING OUT OF THE PROVIDER, which nothing ever did.
   「あと違うアカウントでログインしてんのに前のやつ出てくるんだけど？」
   OWNER 2026-08-31 -- and the languages were half of that (they are the
   phone's, and www/net.js now asks whose they are). This is the other half.

   netOut() takes away Lingua's two tokens and nothing else. The SOCIAL
   provider's own session is the plugin's, it survives, and `p.login()` on
   the next press can hand back the same account without asking anybody
   anything -- so 「sign out, then sign in as somebody else」 was a road that
   did not exist. `SocialLogin` appeared exactly once in all of www/, in
   obSocial() above, and `logout` was never called from anywhere.

   Every guard here is because this runs while somebody is LEAVING: no
   plugin, no such method, a rejected promise, a provider that was never
   used. None of them is a reason to keep somebody signed in, so none of them
   is reported and none of them stops the sign-out -- setSignOut() has
   already taken the tokens away by the time this is reached. It is told to
   forget; whether it manages to is not the person's problem.

   obNative() is NOT used: it says 「not in this build」 out loud, which is
   right when somebody pressed a sign-in button and wrong when they pressed
   sign out. */
function obSignOutSocial(){
  var P=window.Capacitor && Capacitor.Plugins, p=P && P.SocialLogin, i, who;
  if(!p || typeof p.logout!=='function') return;
  who=['apple', 'google'];
  for(i=0;i<who.length;i++){
    try{
      var r=p.logout({ provider:who[i] });
      if(r && typeof r['catch']==='function') r['catch'](function(){});
    }catch(e){}
  }
  /* So the next press configures again rather than trusting a plugin that has
     just been told to forget who it was. */
  OB_SL=false;
}
/* Closing the sheet is not a failure and is not told about. */
function obShrug(){ OBM.busy=false; render(); }
/* Through the door, by whichever of the four ways. What is on the far side
   is not the drawing yet: a name and a handle are, and only for somebody who
   does not already have them. Signing in on a second phone is not a new
   account and must not be asked to name itself again. */
/* Said once, here, because here is where every road in arrives -- the mail
   door, Apple and Google all end at obIn() and there is no fourth. Signing
   OUT has said so since the day it existed and signing in said nothing, and
   after this change signing in is what opens most of the app, so it is the
   half that needed saying more. 「ログインしたら下にログインしましたポップ
   つけてあげて」 */
function obIn(){
  toast(t('set.signin.done'));
  OBM.busy=true; OBM.mode='who'; OBM.pw=''; OBM.msg='';
  save(); render();
  netMyProfile(function(p){
    OBM.busy=false;
    if(p){
      ME.name=String(p.display||''); ME.handle=String(p.handle||''); saveMe();
      OBM.mode='in';
      /* AND THE LANGUAGES THIS ACCOUNT ALREADY HAS. A profile row means this
         account has been used, so there may be languages on the server that
         this phone has never seen -- a second phone, or one that was somebody
         else's. 「前のアカウント消えたんだが？」 OWNER 2026-08-31: nothing was
         deleted, there was no way back to it.

         boot.js asks this too, but only at a launch, and the launch that
         matters already happened -- signing in here would otherwise show the
         phone's own languages until the app was closed and opened again.

         It is www/net.js's and decides everything itself: nothing without a
         session, it FILLS IN what is missing and never overwrites, and it is
         safe to call twice. So this is a call and not a condition. */
      if(typeof netLangsDown==='function') netLangsDown();
      /* An account that already has a profile belongs to somebody who has
         been here. Sending them into the onboarding is sending them to
         draw an alphabet they already have. */
      if(obReturn()) return;
      /* And so is sending anybody who is already inside. obReturn() answers
         for the doors that were opened from somewhere and remembered where
         -- Settings does that. The timeline's door is the screen itself, so
         there is nowhere recorded to go back to and nothing to go back to:
         signing in leaves you standing on the tab you were already on, which
         now has a timeline in it. */
      if(SET.done){ render(); return; }
      /* A profile row means this account has been used. It cannot be a
         first launch, whatever SET.done on THIS phone says -- signing out
         and back in used to land somebody in the onboarding here.
         「ログアウトした後にログインしたらオンボーディング出ないようにも
         してね」 The walk is for a phone with nobody on it, and there is
         somebody on this one.

         It is also the last step of the walk for somebody who IS new, and
         both roads end the same way: the walk is over and the app opens. */
      obFinish(); return;
    }
    /* No profile row for this account means this account is new -- that is
       what "no row" IS, and netMyProfile() asking by SESS.uid is what makes
       it about this account rather than about this phone. So the two fields
       start empty.

       They used to start at ME.name and ME.handle, and on 2026-08-27 a phone
       offered `Lingua` and `@lingua2` -- the account that had signed OUT --
       to an Apple account that had just been made. www/me.js keeps the copy
       per account now, so ME is already not somebody else's by the time this
       line runs; it is written out rather than left to follow from that,
       because this is the line the photograph was of, and "it happens to be
       blank" and "it is blank" fail differently later.

       Somebody signing in on a second phone does not come through here at
       all: they have a row, and the branch above returns. */
    OBM.nm=''; OBM.hd=''; render();
  }, function(d, s, m){
    /* The lookup failed, so we do not know whether there is a row. Asking is
       the safe half: an insert that turns out to be a duplicate is refused
       by the constraint and says so, where skipping would leave somebody
       with an account nobody can address. */
    OBM.busy=false; OBM.msg=netWhy(d, s, m); render();
  });
}
/* The third argument is which kind of failure it was, and it only ever comes
   from net.js. Everything that reports through here gets it for free -- the
   two social doors, the mail door, the code, the handle, the profile --
   which is the whole of the reason it is one function. */
function obNo(d, s, m){
  OBM.busy=false; OBM.msg=netWhy(d, s, m); render();
}

/* ---- the door, by mail -------------------------------------------------
   Apple and Google cover almost everybody on a phone and not everybody wants
   either, which is the whole of the argument for this being here.

   The password is typed and sent and never written down. What signs somebody
   in on the second launch is the refresh token net.js keeps -- so the
   convenience of a remembered password is there without a password to lose.
   Filling the field in the first place is the operating system's job: the
   autocomplete words below are what make iOS offer the Keychain, and they are
   the reason there is nothing here that stores an address either. */
/* `fresh` is which of the two roads reached the password screen: an account
   being made, or one whose password is being replaced. Both end on the same
   screen and it is the same act -- write a password with the session the six
   digits produced -- but 「新しいパスワード」 over somebody's FIRST one is a
   heading about a thing that does not exist. */
var OBM={ mode:'in', em:'', pw:'', code:'', nm:'', hd:'', busy:false, msg:'', fresh:false };

/* ---- 送ってから六十秒 --------------------------------------------------
   「8桁で60秒再送信」 OWNER 2026-09-03. 桁数のほうはアプリの持ち物ではなく
   Supabase の設定です（supabase/setup.md § 桁数は 8）。ここにあるのは秒のほう
   だけで、それがこの二つの分かれ目です ── アプリが数えるのは秒で、桁ではない。

   セッションの中だけの数です。localStorage には書きません: 書けば「この端末が
   いつ送ったか」という、どのアカウントのものでもない鍵が一つ増えます
   （CLAUDE.md 規則22）。アプリを落とせば数え直しになり、そのときはサーバの
   側が断ります。 */
var OB_AGAIN_S=60;
var obAgainAt=0, obAgainTic=null;
/* 残りの秒。送っていなければ 0 で、0 は「もう送れる」。 */
function obAgainLeft(){
  var l;
  if(!obAgainAt) return 0;
  l=OB_AGAIN_S-Math.floor(((new Date()).getTime()-obAgainAt)/1000);
  return (l>0)? l : 0;
}
/* コードが一通出て行った。最初の一通も、送り直しも、ここを通ります ── 六十秒は
   「送り直してから」ではなく「送ってから」なので、数え始めるのは一箇所です。 */
function obAgainSent(){ obAgainAt=(new Date()).getTime(); obAgainTicOn(); }
function obAgainTicOn(){
  obAgainTicOff();
  if(!obAgainLeft()) return;
  obAgainTic=setInterval(obAgainTick, 250);
}
function obAgainTicOff(){
  if(obAgainTic){ clearInterval(obAgainTic); obAgainTic=null; }
}
/* 一つの要素に数を書くだけで、render() は呼びません。同じ画面に打ちかけの欄が
   あり、一秒ごとに描き直せば毎秒そこから離れて誰も打てなくなります。
   画面が変わってボタンが無くなったら、そこで自分を止めます。 */
function obAgainTick(){
  var b=document.getElementById('ob-again'), n=obAgainLeft();
  if(!b){ obAgainTicOff(); return; }
  if(n){ b.innerHTML=t('ob.mail.again')+' '+n; return; }
  obAgainTicOff();
  b.removeAttribute('disabled');
  b.innerHTML=t('ob.mail.again');
}
/* Where to go when the account screen is done, for somebody who did not
   arrive here by starting the app.

   The onboarding is what the app IS until SET.done -- that is the whole of
   how render() decides -- so the only way to show the sign-in screen to
   somebody already past it is to put SET.done back to false. Settings does
   exactly that. Without this, signing in then carried on into the onboarding
   proper: step 1 is drawing an alphabet, and a person who already had one
   was made to sit through it again. 「ログアウト→ログインでもまた文字書こう
   みたいな画面が出る」

   Null means the app really did start here and the onboarding is the app. */
/* It is in SET, beside the SET.done it undoes, and NOT in a variable.
   Settings takes the onboarding's own flag away in order to show the door and
   writes that to storage; the note saying the flag is a lie lived in memory.
   So anything that reloads the page between opening the sign-in screen and
   finishing with it -- the app killed, WKWebView reclaimed, coming back an
   hour later -- left a phone claiming the onboarding was unfinished with
   nothing at all left saying otherwise. Signing in then walked somebody who
   has a whole language through drawing their first letter.
   「普通にログインしてるのに言語の名前とidきめさせられた」「あるのに出てきた」
   The lie and the note saying it is a lie now live or die together. */
/* Opening the door, from anywhere. Everything it has to put in place is
   here rather than at each of the places that opens it: the note saying
   where to come back to, the flag the onboarding reads, and the face of the
   door to show. Settings did all four by hand and was the only caller; there
   are several now, and four statements repeated at each of them is four
   chances to leave one out.

   ob.step goes back to the door too. It is the app's own counter and it
   stays wherever the onboarding left it, so opening the door in the same
   session somebody finished the onboarding in showed them the naming
   screen. */
function obDoor(r, a){
  SET.obback={r:r, a:a};
  ob.step=0; ob.mode=''; GE=null;
  OBM.mode='in'; OBM.msg=''; OBM.busy=false;
  SET.done=false; save();
  render(); window.scrollTo(0,0);
}
/* And the question every one of them is asking. Anything other people would
   see needs somebody's name on it -- a post, a like, a boost, a follow, a
   block, a report -- and there is a session without one from the first
   launch, so this is netSignedIn() and not netSignedIn().

   Where you are standing is where the door sends you back to, so a like
   pressed halfway down a thread does not land you on the timeline. */
function obNeed(){
  var h;
  if(netSignedIn()) return true;
  h=here();
  obDoor(h && h.r, h && h.a);
  return false;
}
/* ---- making something needs a name on the account ----------------------
   「全部の画面一通り見れるけど制作しようとするとログイン求められる」
   「そうすればログアウトもいけるべ」

   The four the owner named, and no others: writing a letter, adding a word,
   writing a grammar stage, adding a note. **The keyboard is not one of
   them** -- 「キーボードは無料だから関係ない」 -- and neither is looking at
   anything. Every screen opens; it is DOING one of the four that asks.

   Not while the onboarding is running. The onboarding IS somebody drawing
   their first letter, and asking there would be asking before there is
   anything to sign in FOR -- the door comes at the end of it, after the
   letter is drawn and the keyboard has been seen. SET.done is what says
   which of the two this is.

   One place, because four call sites each remembering to add "and not during
   the onboarding" is four chances to leave it out, and the one left out is
   the screen nobody can get past. */
function makeNeed(){
  if(!SET.done) return true;
  return obNeed();
}
function obPending(){ return (SET.obback && SET.obback.r)? SET.obback : null; }
/* Done with the account, and there was somewhere to go back to. Puts back
   the SET.done that the door had to take away. */
function obReturn(){
  var b=obPending();
  if(!b) return false;
  SET.obback=null; SET.done=true; save();
  go(b.r, b.a);
  return true;
}
/* コードの画面に立ったときだけ数が動きます。離れれば止まる ── obAgainTick() は
   ボタンが無くなったら自分を止めますが、離れた瞬間に止めるのはここです。 */
function obMailGo(m){
  OBM.mode=m; OBM.msg=''; render(); window.scrollTo(0,0);
  if(m==='code' || m==='reset') obAgainTicOn(); else obAgainTicOff();
}
function obMailSet(k, v){ OBM[k]=String(v||''); }
function obMailAsk(){
  if(!OBM.em || OBM.em.indexOf('@')<0){ OBM.msg=t('net.needmail'); render(); return false; }
  return true;
}
function obMailIn(){
  if(OBM.busy || !obMailAsk()) return;
  OBM.busy=true; OBM.msg=''; render();
  netSignIn(OBM.em, OBM.pw, obIn, obNo);
}
/* THE ADDRESS IS THE ACCOUNT. 「1アドレス1アカウント」「Googleでも同じアカウント
   ならメアドで入っても同じアカウントでログインさせればいいやろ」 OWNER
   2026-09-02.

   This asked Supabase for a NEW user and got one every time -- so somebody who
   had come in with Google and later typed the same address here ended up with
   two accounts, two languages and two of whatever they had paid for. It asks
   for a code to that address now: already an account, and this is a way
   into it; not one, and it is made. www/net.js § netMailOtp() has the rest.

   No password, which is the same day's 「メアドだけ、アカウント作成で」 and
   not a second decision: the digits are what proves the address, and a
   password is something to add later from Settings if it is wanted at all. */
function obMailUp(){
  if(OBM.busy || !obMailAsk()) return;
  OBM.busy=true; OBM.msg=''; render();
  /* THE ADDRESS IS ASKED ABOUT FIRST, and a taken one is refused here.
     「アカウントのあるアドレスで新規作成はいらんやろ。このアカウントは登録
     されていますの赤文字で。アカウントを作るページなんだけど？」 OWNER
     2026-09-03. It used to send the digits and land the person in the account
     they already had, which is one account either way and is not what the
     screen says it is doing. */
  netMailTaken(OBM.em, function(taken){
    if(taken){ OBM.busy=false; OBM.msg=t('ob.mail.taken'); render(); return; }
    obMailUpGo();
  }, function(){ obMailUpGo(); });
}
/* And what it does once the address is not taken. Split out so that a server
   that will not answer the question still lets somebody make an account --
   refusing on a network fault would be the app locking its own door. */
function obMailUpGo(){
  netMailOtp(OBM.em, function(){
    /* Nobody is signed in yet: a code went to an address that may have a
       typo in it. The typo is the whole reason the code exists -- an address
       nobody can read is an account nobody can get back into. */
    OBM.busy=false; OBM.pw=''; obAgainSent(); obMailGo('code');
  }, obNo);
}
/* THE DIGITS FIRST, THE PASSWORD AFTER. 「普通に6桁のコード打ってから
   パスワード要求だろ」 OWNER 2026-09-02.

   The address is proved by the code and the password is chosen once it
   is -- which is the same two screens the reset road already had, in the same
   order, for the same reason. What comes back from the digits is a session,
   and obNewPwGo() is what spends it. */
function obMailCode(){
  if(OBM.busy) return;
  OBM.busy=true; OBM.msg=''; render();
  netVerify(OBM.em, OBM.code, function(){
    OBM.busy=false; OBM.code=''; OBM.pw=''; OBM.fresh=true; obMailGo('newpw');
  }, obNo);
}
/* THE SAME SIX DIGITS, SENT AGAIN. A mail that did not arrive is the ordinary
   thing that happens on this screen -- it is in a spam folder, or the address
   has a typo in it -- and until now the only answer to either was to kill the
   app. 『後追加でメールを確認のボタンに再送信ボタンと戻るボタンがない』 OWNER
   2026-09-02.

   One face, and two mails behind it -- the sign-up code and the reset code, so
   which one to send again is read off the face rather than remembered: the
   sign-up code is Supabase's resend, the reset code is asking for the reset
   again. `ob.mail.sent` afterwards is a STATE and not an explanation
   (CLAUDE.md) -- without it, pressing this does nothing anybody can see. */
function obMailAgain(){
  /* 六十秒。ボタンは押せない形で描かれていますが、断るのはここです ── 描き方は
     見た目で、決まりではありません。一箇所で数えて、一箇所で断ります。 */
  if(obAgainLeft()) return;
  if(OBM.busy || !obMailAsk()) return;
  OBM.busy=true; OBM.msg=''; render();
  function done(){
    OBM.busy=false; OBM.msg=t('ob.mail.sent'); obAgainSent(); render();
  }
  if(OBM.mode==='reset') netRecover(OBM.em, done, obNo);
  else netMailOtp(OBM.em, done, obNo);
}
/* Asking for a reset used to END here: the request went, the screen said
   "sent", and there was nowhere to go with what arrived. The mail carried a
   link, because that is what Supabase's Reset Password template says, and a
   link has nowhere to land in a Capacitor app -- the same wall the signup
   mail hit and was answered with a code. So this goes on to the screen
   that takes them. */
function obMailForgot(){
  if(OBM.busy || !obMailAsk()) return;
  OBM.busy=true; OBM.msg=''; render();
  /* The other half of the same question. /auth/v1/recover answers 200 for an
     address it has never seen, so this screen used to walk on to a code
     that were never going to arrive -- a state with no cause and no way out,
     which is the one place www/CLAUDE.md says a sentence is written. */
  netMailTaken(OBM.em, function(taken){
    if(!taken){ OBM.busy=false; OBM.msg=t('ob.mail.none'); render(); return; }
    obMailForgotGo();
  }, function(){ obMailForgotGo(); });
}
function obMailForgotGo(){
  netRecover(OBM.em, function(){
    OBM.busy=false; OBM.code=''; OBM.pw=''; obAgainSent(); obMailGo('reset');
  }, obNo);
}
/* The code, and the password to put in place of the forgotten one. Two calls
   and one press: the code buys a session, and somebody holding a session may
   change their own password. Nothing here asks what the old one was, which is
   the point -- they forgot it.

   Signed in at the end, and not sent back to the door to type the password
   they have just this second chosen. */
function obResetGo(){
  if(OBM.busy) return;
  if(!OBM.code){ OBM.msg=t('net.needcode'); render(); return; }
  OBM.busy=true; OBM.msg=''; render();
  /* The server says whether the digits are right, and nothing here does. A
     comparison in this file would be the answer sitting on the phone that is
     asking the question. What comes back is a session, and the next screen is
     what spends it. */
  netRecoverCode(OBM.em, OBM.code, function(){
    OBM.busy=false; OBM.code=''; OBM.pw=''; OBM.fresh=false; obMailGo('newpw');
  }, obNo);
}
/* Somebody holding a session changing their own password. Nothing here asks
   what the old one was, which is the point -- they forgot it. */
function obNewPwGo(){
  if(OBM.busy) return;
  if(!OBM.pw){ OBM.msg=t('net.needpass'); render(); return; }
  OBM.busy=true; OBM.msg=''; render();
  netSetPass(OBM.pw, function(){ OBM.pw=''; obIn(); }, obNo);
}
function obMailField(id, k, type, auto, ph){
  return '<div class="field"><input id="'+id+'" type="'+type+'" '+
    'value="'+esc(OBM[k])+'" placeholder="'+esc(t(ph))+'" '+
    'autocomplete="'+auto+'" autocapitalize="none" autocorrect="off" '+
    'spellcheck="false"' + IN('obMailSet', [k]) + '></div>';
}
/* An eye, open and struck through, and they are the only mark in this app for
   "what is typed here is hidden". The lid is one path and the pupil another,
   which is what every keyboard-facing app draws; the shut one is the same eye
   with a line across it, so the two read as one control in two states rather
   than as two different buttons. */
var OB_EYE='<svg class="ic" viewBox="0 0 24 24" width="19" height="19" fill="none" '+
  'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" '+
  'aria-hidden="true"><path d="M2.2 12S6 5.8 12 5.8 21.8 12 21.8 12 18 18.2 12 18.2 2.2 12 2.2 12Z"/>'+
  '<path d="M12 9.2A2.8 2.8 0 1 0 12 14.8 2.8 2.8 0 1 0 12 9.2Z"/></svg>';
var OB_EYESHUT='<svg class="ic" viewBox="0 0 24 24" width="19" height="19" fill="none" '+
  'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" '+
  'aria-hidden="true"><path d="M2.2 12S6 5.8 12 5.8 21.8 12 21.8 12 18 18.2 12 18.2 2.2 12 2.2 12Z"/>'+
  '<path d="M12 9.2A2.8 2.8 0 1 0 12 14.8 2.8 2.8 0 1 0 12 9.2Z"/>'+
  '<path d="M4.4 19.6 19.6 4.4"/></svg>';
/* A PASSWORD FIELD, AND THE EYE THAT SHOWS WHAT IS IN IT. One function, and
   the four places a password is typed all call it: the door's sign-in face,
   the door's new-password face, and the two on the settings room's password
   screen. There were four fields written out four times; there is one shape
   now, so an eye cannot appear on one of them and not the others.

   The eye is a BUTTON carrying a NAME (rule 3) and it is registered in
   www/act-map.js. What it carries is the field's id, because that is the only
   thing that differs between the four.

   `.field.at` and `.rowq` are worn rather than a class of this chapter's own.
   www/index.html is another session's, so this screen adds no CSS: `.field.at`
   is the row shape the stylesheet already has -- a flex row carrying the rule
   under it, with the input's own border turned off -- and `.rowq` is the bare
   44pt square it already has for a mark at the end of a row. What that costs
   is one line and it is in the report, not worked around here. */
function obPwField(id, val, ph, auto, act){
  return '<div class="field at"><input id="'+id+'" type="password" '+
    'value="'+esc(val)+'" placeholder="'+esc(t(ph))+'" '+
    'autocomplete="'+auto+'" autocapitalize="none" autocorrect="off" '+
    'spellcheck="false"' + act + '>'+
    obPwEye(id, false) + '</div>';
}
/* THE EYE ITSELF, AND THE ONE PLACE THE MARK IS CHOSEN.

   **The mark says WHICH STATE THE FIELD IS IN**, not what pressing will do:
   hidden is a shut eye and showing is an open one.
   「普段は目を閉じてる状態がデフォでしょ？」 OWNER 2026-09-04. It was the other
   way round -- an open eye over a field of dots -- which is the button
   describing its own press while the screen says nothing about itself.

   The NAME is the other way, and deliberately: it is what pressing does, so
   over a hidden field it says 「パスワードを表示」 while the mark is a shut
   eye. They are not disagreeing -- one is the state and the other is the act,
   which is what a button whose picture is its state has to say out loud for
   somebody who cannot see the picture.

   Two moments choose a mark -- the field being built, and the button being
   pressed -- and that is exactly the shape that drifts, so neither of them
   chooses one. Both ask here. obPwSee() replaces the whole button with what
   this returns rather than reaching inside it, so there is no second place
   that knows how an eye is put together. The listener is the delegated one in
   www/act.js, so a replaced button needs nothing bound to it again. */
function obPwEye(id, show){
  return '<button class="rowq" id="'+id+'-see" aria-label="'+
    esc(t(show? 'ob.mail.hide' : 'ob.mail.see'))+'"' +
    DO('obPwSee', [id]) + '>'+(show? OB_EYE : OB_EYESHUT)+'</button>';
}
/* Pressing the eye shows what was typed; pressing it again hides it.

   It writes into the two elements and does NOT render. The field is on the
   same screen, and a render would take the caret out of it and shut the
   keyboard -- which is obAgainTick()'s reason a few lines above and the same
   reason here.

   Nothing is remembered and nothing is stored. The next render of the screen
   builds the field as type="password" again, so leaving and coming back hides
   it, and there is no state anywhere that has to be put back. What was typed
   is never written down by any of this: the eye changes what the screen SHOWS
   and touches nothing else. */
function obPwSee(id){
  var e=document.getElementById(id), b=document.getElementById(id+'-see');
  if(!e || !b) return;
  var show = e.type==='password';
  e.type = show ? 'text' : 'password';
  b.outerHTML = obPwEye(id, show);
}
/* The arch and the wordmark, small, over every face of the door. There used
   to be a splash carrying them and a form behind it; the splash asked
   nothing, so it was a page whose whole content was a button that opened the
   page somebody wanted. The mark sits on the form instead. */
function obCrestHTML(){
  return '<div class="obcrest"><div class="obdoor">'+OB_DOOR+'</div>'+
    '<h1 class="obh1">Lingua</h1>'+
    '<p class="obtag">'+t('ob.tagline')+'</p></div>';
}

/* Signing in and making an account are two screens, not one screen with a
   toggle. The two fields are the same and nothing else is: what the button
   does, whether a forgotten password is offered, whether Apple and Google
   are there at all -- they make an account and sign in with one press, so
   they belong on the door and are not a second way to register -- and what
   the bar across the foot offers instead of itself. On one screen all of
   that would be written twice in conditionals anyway, and the person would
   not be able to tell which of the two they were looking at. */
/* There is nothing to skip past, and the reason under this comment changed.

   It said the app makes an account by itself at first launch, so "continue
   without an account" would be offering what everybody already has. **It does
   not.** netAnon() gets a token whose JWT carries `is_anonymous`: netSignedIn()
   reads false off it and so does is_member() in supabase/schema.sql. It is a
   uid to hang a language on, which is what 2026-08-22 asked for and all it
   asked for. It is not somebody, and it is not an account. 「匿名アカウントは
   ねえよ」

   So the offer is missing for the opposite reason now, and a stronger one:
   2026-08-26, 「言語はアカウントないと作れないです」. There is no continuing
   without an account to offer. The chevron is the way out. */
function obFormHTML(up){
  return '<div class="mid obform">'+
    obCrestHTML()+
    obMailField('ob-em', 'em', 'email', 'username', 'ob.mail.em.ph')+
    /* THE ADDRESS AND NOTHING ELSE, on the face where an account is made.
       「メアドだけ、アカウント作成で」 OWNER 2026-09-02. Six digits go to it
       and the digits are what proves it; there is nothing for a password to
       do here, and asking for one is what made this face a SIGNUP -- which is
       the request that cannot land on an account somebody already has.
       Signing in still has one, because that is the face where somebody who
       set a password uses it. */
    (up? '' : obPwField('ob-pw', OBM.pw, 'ob.mail.pw.ph',
                        'current-password', IN('obMailSet', ['pw'])))+
    (OBM.msg? '<div class="obmsg">'+esc(OBM.msg)+'</div>' : '')+
    '<button class="btn"' + DO(up? 'obMailUp' : 'obMailIn') + (OBM.busy? ' disabled':'') + '>'+
      t(OBM.busy? 'ob.mail.wait' : (up? 'ob.mail.up' : 'ob.mail.in'))+'</button>'+
    /* Forgotten passwords are the sign-in face's alone: there is nothing to
       have forgotten on the face where an account is being made. */
    (up? '' : '<button class="obskip"' + DO('obMailGo', ["forgot"]) + '>'+
         t('ob.mail.to.forgot')+'</button>')+
    /* APPLE AND GOOGLE ARE ON BOTH FACES, and that is what every app does.
       「続けるにすればいいんじゃない？同じようにしよう。Appleで続ける
       Googleで続ける。メアドだけ、アカウント作成で。作成画面でもアップルも
       Googleもおいとけばこれで解決？」OWNER 2026-09-02.

       They were on the sign-in face only, and Supabase's id_token grant makes
       the account when the identity is new -- so pressing 「サインイン」 with
       an Apple ID this app had never seen created one without saying so, and
       there was no other way for somebody with only an Apple ID to get in.
       「アップルとかログインで入れちゃうから」

       The buttons already SAY 「続ける」 in all ten languages, which is the
       word every app uses for exactly this reason: which of the two it turns
       out to be is not known until it is pressed. What was wrong was the face
       it stood on. Email is the one thing the two faces differ by, because a
       password is the one thing that can be WRONG -- 「そんなアカウントは
       ありません」 is a sentence only the mail road can say. */
    '<div class="obor"><span>'+t('ob.signin.or')+'</span></div>'+
    '<button class="btn signin apple"' + DO('obSignInApple') + '>'+MARK_APPLE+'<span>'+t('ob.signin.apple')+'</span></button>'+
    '<button class="btn signin google"' + DO('obSignInGoogle') + '>'+MARK_GOOGLE+'<span>'+t('ob.signin.google')+'</span></button>'+
    /* There WAS a way out of here without signing in: 「あとで」, shown when
       this door was the onboarding's last step, straight to obFinish().
       「サインインしなかったときは門で止まるよ！」 OWNER DECISION 2026-08-23 --
       the walk ended, the app opened, and the MAKING side asked later, which
       it did: every gate there is obNeed().

       Gone, 2026-08-26. 「言語はアカウントないと作れないです」 It was the way
       to finish the walk with no account, land on the profile, reach for a
       letter and find the door back in front of you -- which is what the
       owner saw: 「オンボーディング終わったらせいさくみれるけどふさがれてる
       けど？」 With it gone there is no such walk: this door is the last step
       and there is nothing on the other side of it but the app.

       The button was never a bug against the rule. It WAS the rule: the
       comment on it ended 「a language is made on this phone, with or without
       an account」, which is the sentence the same decision struck out of
       CLAUDE.md. The rule went, so it went, and nothing replaced it --
       OB_IN is the last step and signing in is how it ends. The chevron
       still goes back a step. */
    /* THE ONE LINE APPLE ASKS FOR, and it is on the face where an account is
       made and nowhere else. Guideline 1.2: an app people write in has to say
       what somebody is agreeing to before they are in, and the two documents
       were only on the plans screen -- which somebody who never pays never
       opens. 「続けるとの説明は ok」 OWNER 2026-09-02.

       NO CHECKBOX. The consent is the press, which is what 「続ける」 already
       says on the two buttons above it.

       THE SAME SHAPE AS planTerms(), down to the class: a sentence in `.docs`
       and then docRows(). That is not a coincidence to be tidied later -- it
       is the answer that screen already worked out, written up at length over
       planTerms() in www/settings.js: `.docs` is already small, centred, muted
       and at the foot, so the sentence and the links it belongs with are one
       class at one size, and www/index.html does not change. A `.note` over
       them would be .86rem over .78rem, which is 「Rows in one list are one
       height」.

       THE LINKS ARE docRows() AND NOT A SECOND PAIR OF ANCHORS. One copy of a
       contract, so the version somebody agreed to is the version that is up.
       The URLs stay DOC_TERMS / DOC_PRIVACY in www/settings.js and are not
       named here.

       The sign-in face does not have it, which is what was asked for
       (登録画面だけ). Worth knowing rather than assuming: Apple and Google can
       make an account from the sign-in face too, because Supabase's id_token
       grant makes one when the identity is new -- the comment on those two
       buttons above says so. Whether the line belongs there as well is the
       owner's, not this session's. */
    (up? '<div class="docs">'+esc(t('ob.docs'))+'</div>'+docRows() : '')+
    '</div>'+
    '<div class="obbar"><button' + DO('obMailGo', [up? "in" : "up"]) + '>'+
      t(up? 'ob.bar.in' : 'ob.bar.up')+'</button></div>';
}
/* ---- who the account belongs to ---------------------------------------
   Two things, once, and neither of them invented for anybody. The handle is
   `unique not null` on the server, so it cannot be put off; the name is
   asked for beside it because a timeline with a handle and no name is a
   timeline of strangers.

   This is a face of the door, and the door is not a step of anything: there
   are no dots over it. */
function obWhoHTML(){
  return '<div class="mid obform">'+
    '<h2 class="obh">'+t('ob.who.h')+'</h2>'+
    obMailField('ob-nm', 'nm', 'text', 'name', 'ob.who.nm.ph')+
    '<div class="field at"><span>@</span>'+
      '<input id="ob-hd" type="text" value="'+esc(OBM.hd)+'" '+
      'placeholder="'+esc(t('ob.who.hd.ph'))+'" autocomplete="username" '+
      'autocapitalize="none" autocorrect="off" spellcheck="false"' +
      IN('obMailSet', ['hd']) + '></div>'+
    (OBM.msg? '<div class="obmsg">'+esc(OBM.msg)+'</div>' : '')+
    '<button class="btn"' + DO('obWhoGo') + (OBM.busy? ' disabled':'') + '>'+
      t(OBM.busy? 'ob.mail.wait' : 'ob.next')+'</button>'+
    '</div>';
}
/* ---- the one follow every account starts with --------------------------
   「他の人が始めたらlinguaアカウントは強制的にフォローしてる状態に
   したい」 OWNER, and, asked which of the two shapes it should be:
   「A: 初期状態としてフォロー済み。外せる」. So it is an ordinary follow from
   the moment it is made -- the button on @lingua's page says Following, and
   pressing it takes the follow off the way it takes any other one off.

   The handle is written out rather than asked for. It is the account's NAME:
   supabase/schema.sql says the same word in the same place and the same way
   (`select id into l from profile where handle = 'lingua'`), and a phone that
   asked the server which account this is would be asking a question whose
   answer is the word itself. */
var OB_LINGUA='lingua';
/* A handle is what survives being typed after an @, and the range is the
   schema's: check (handle ~ '^[a-z0-9_]{2,24}$'). Cleaning it here and
   showing the cleaned one back is the only way somebody finds out that the
   space they typed is not in it. */
function obWhoGo(){
  if(OBM.busy) return;
  OBM.hd=String(OBM.hd||'').toLowerCase().replace(/[^a-z0-9_]+/g, '');
  OBM.nm=String(OBM.nm||'').replace(/^\s+|\s+$/g, '');
  if(!OBM.nm){ OBM.msg=t('net.needname'); render(); return; }
  if(OBM.hd.length<2 || OBM.hd.length>24){ OBM.msg=t('net.badhandle'); render(); return; }
  OBM.busy=true; OBM.msg=''; render();
  var h=OBM.hd, nm=OBM.nm;
  netHandleFree(h, function(free){
    if(!free){ OBM.busy=false; OBM.msg=t('net.handle.taken'); render(); return; }
    netMakeProfile(h, nm, function(){
      ME.name=nm; ME.handle=h; saveMe();
      OBM.busy=false; OBM.mode='in';
      /* And the follow, here because this is the one place an account comes
         into existence: netMakeProfile() has exactly one caller in the whole
         app and it is the line above, so "the moment a new account is made"
         is this line and nowhere else.

         meFollow() and not a second way of following: it is what every Follow
         button on every screen presses, so an account starts out following
         @lingua by the same road anybody else would have taken -- ME.fo
         written down, the screen drawn again, and netFollow() telling the
         server. The list matters as much as the row does: the followed
         timeline filters against ME.fo, so a row on the server that this
         phone had not heard of would be an empty timeline and a button
         saying Follow.

         ASKED FIRST BECAUSE meFollow() IS A TOGGLE. A press is what it is
         written for, and a press on a handle already in the list is an
         unfollow -- which is the opposite of this line. The only copy of ME
         that could arrive here already carrying it is an unclaimed one this
         phone adopted (meFor()), and the guard costs nothing on every other
         phone.

         Not for @lingua itself: meFollow() drops a handle that is your own,
         which is the same step-around `l <> new.id` takes on the server.

         `handle` is set one line above, so meHandle() is this account and not
         the last one. */
      if(!meFollows(OB_LINGUA)) meFollow(OB_LINGUA);
      /* A brand new account made from Settings is still somebody who has a
         language -- they signed up late, not early. */
      if(obReturn()) return;
      /* And a new account made at the END of the onboarding, which is where
         the door is: it was the last step, so the walk is over. Everything
         behind it -- the letter, the language, the name -- was made before
         this account existed, and obFinish() is what puts it on the server. */
      obFinish();
    }, obNo);
  }, obNo);
}

/* THE CODE SCREEN, AND THERE IS ONE OF IT.

   There were two, and they were the same screen: the same heading, the same
   line under it, the same field, the same 確認, the same 再送信 -- and the
   only difference was which function the button called. `obAskHTML(true)` was
   the one the sign-up road reached and `obResetHTML()` was the one the reset
   road reached. Nothing said they had to agree, so the sixty seconds would
   have gone into one of them and not the other, and the one that was missed
   is the one nobody looks at.
   「付け足して直さない」「古い記載は消してルール書き換えてくれ」 OWNER
   2026-09-03. The old one is deleted rather than left standing.

   What differs travels as the name of the button's action, which is the one
   thing that was ever different. `obAskHTML(false)` -- the address to send a
   reset to -- was never the same screen and is its own function below. */
function obCodeHTML(go){
  return '<div class="mid obform">'+
    '<h2 class="obh">'+t('ob.mail.h.code')+'</h2>'+
    '<p class="obsub">'+esc(t('ob.mail.code.sub', OBM.em))+'</p>'+
    obMailField('ob-code', 'code', 'text', 'one-time-code', 'ob.mail.code.ph')+
    (OBM.msg? '<div class="obmsg">'+esc(OBM.msg)+'</div>' : '')+
    '<button class="btn"' + DO(go) + (OBM.busy? ' disabled':'') + '>'+
      t(OBM.busy? 'ob.mail.wait' : 'ob.mail.verify')+'</button>'+
    obAgainHTML()+
    '</div>';
}
/* SIXTY SECONDS BEFORE IT CAN BE SENT AGAIN. 「8桁で60秒再送信」 OWNER
   2026-09-03.

   The number is drawn HERE so that a render in the middle of the minute --
   pressing 確認 on a wrong code is one -- puts the button back the way it
   was rather than offering a resend the server would refuse. What ticks it
   down is obAgainTick() below, which writes into this one element and does
   NOT render: the field is on the same screen, and a render a second would
   take the caret out of it and nobody could type. www/rec.js § voTick() is
   the same shape for the same reason -- it is the app's way of drawing a
   number that moves while a screen stands still.

   The count is a STATE, not an explanation (CLAUDE.md § Explaining): without
   it the button is simply dead and nothing says why or for how long. It is
   a numeral, so there is nothing in it to translate. */
function obAgainHTML(){
  var n=obAgainLeft();
  return '<button class="obskip" id="ob-again"' + DO('obMailAgain') +
    ((OBM.busy || n)? ' disabled':'') + '>'+
    t('ob.mail.again') + (n? ' '+n : '') + '</button>';
}
/* The address a reset is sent to. Not a code screen and never was. */
function obForgotHTML(){
  return '<div class="mid obform">'+
    '<h2 class="obh">'+t('ob.mail.h.forgot')+'</h2>'+
    obMailField('ob-em', 'em', 'email', 'username', 'ob.mail.em.ph')+
    (OBM.msg? '<div class="obmsg">'+esc(OBM.msg)+'</div>' : '')+
    '<button class="btn"' + DO('obMailForgot') + (OBM.busy? ' disabled':'') + '>'+
      t(OBM.busy? 'ob.mail.wait' : 'ob.mail.send')+'</button>'+
    '</div>';
}
/* And the second step, reached only by a code the server accepted. */
function obNewPwHTML(){
  return '<div class="mid obform">'+
    '<h2 class="obh">'+t(OBM.fresh? 'ob.mail.h.setpw' : 'ob.mail.h.reset')+'</h2>'+
    obPwField('ob-pw', OBM.pw, OBM.fresh? 'ob.mail.pw.ph' : 'ob.mail.newpw.ph',
              'new-password', IN('obMailSet', ['pw']))+
    (OBM.msg? '<div class="obmsg">'+esc(OBM.msg)+'</div>' : '')+
    '<button class="btn"' + DO('obNewPwGo') + (OBM.busy? ' disabled':'') + '>'+
      t(OBM.busy? 'ob.mail.wait' : 'ob.mail.reset')+'</button>'+
    '</div>';
}

function obDoorHTML(){
  var m=OBM.mode;
  if(m==='who') return obWhoHTML();
  if(m==='newpw') return obNewPwHTML();
  /* One code screen, two roads into it. 登録の側は obMailCode()、再設定の側は
     obResetGo() ── 違うのはそれだけで、それだけを渡します。 */
  if(m==='code') return obCodeHTML('obMailCode');
  if(m==='reset') return obCodeHTML('obResetGo');
  if(m==='forgot') return obForgotHTML();
  return obFormHTML(m==='up');
}

/* ---- step 3, its name -------------------------------------------------
   The one thing somebody arrives already having an opinion about, and the
   only question here they can answer without being taught anything. It can
   be left blank and changed at any time from the cover. */
/* Naming the language is not the end of the walk -- signing in is, and it
   comes after this. 「オンボーディング→最後にログイン」 OWNER 2026-08-27. */
function obName(){
  var e=document.getElementById('ob-name');
  if(e) ob.name=String(e.value||'').trim();
  langName=ob.name;
  save(); obGo(OB_IN);
}
function obNameHTML(){
  return '<div class="mid">'+
    '<h2>'+t('ob.name.h')+'</h2>'+
    '<p class="obsub">'+t('ob.name.sub')+'</p>'+
    '<div class="obnamebox"><input id="ob-name" value="'+esc(ob.name||langName||'')+'" '+
      'placeholder="'+esc(t('ob.name.ph'))+'" autocomplete="off" '+
      '' + KD('obName') + '></div>'+
    '</div>'+
    '<div class="obfoot"><button class="btn"' + DO('obName') + '>'+t('ob.next')+'</button>'+
    '<button class="obskip"' + DO('obNameLater') + '>'+t('ob.name.later')+'</button>'+
    '<div class="mini obnote">'+t('ob.name.note')+'</div></div>';
}
/* Not everyone has a name yet, and being stuck on the first question of the
   app because of it is absurd. The cover asks again, and the pencil beside
   the title is there whenever the answer arrives. */
function obNameLater(){ ob.name=''; obGo(OB_IN); }

/* ---- the timeline -----------------------------------------------------
   「ホームに移動したら本物のsns画面だよ。それのモックを作れ」
   「人工言語人工文字でやったら翻訳がつくだろ」 OWNER 2026-08-28.

   IT IS THE REAL PAGE, part for part. vFeed() in www/sns.js is

       <div class="view"> rootTop('feed', snsFilTop())
         <div class="body"> dayRow() + the rows </div>
         snsFab() </div>

   and so is this. Every one of those is CALLED, not copied: the bar, the
   filter, the row you write in, the row a post is, the round button. Nothing
   here draws a second version of any of them, so it cannot drift from the
   screen it is a picture of. The tab bar at the foot is already on the page --
   render() paints it before the onboarding branch.

   It was an approximation three times before this: onboarding chrome with
   some rows inside it. That was me building inside what I owned instead of
   calling what was already there, and it was wrong every time.

   THREE LAYERS, which is what the app shows and what makes a conlang
   timeline readable at all:

     the line      in THEIR letters, not this phone's -- the alphabet below.
     the meaning   under it, in the reader's own language -- `mn`, which
                   postSay() reads. 「人工言語人工文字でやったら翻訳がつくだろ」
                   This is the ONLY thing on the page in Japanese, and it is
                   the translation rather than the post.
     who wrote it  name, handle, face, when.

   Nothing is pressable: there is no account, no thread and no picture behind
   any of it. One `pointer-events:none` on the wrapper; the rows are the real
   rows, untouched. */
/* THE LETTERS ARE THEIRS, NOT THIS PHONE'S.

   Six people who made a language, writing in it -- and somebody else's post is
   in somebody else's letters. That is what post.js's line is for: a post
   carries the shapes its line is written in, because the reader does not have
   that alphabet. A timeline where every post is in MY letters is the bug rule
   12 was written after.

   It was cut with postInk() for one commit -- the READER's alphabet -- and at
   this point in the onboarding that is one drawn letter, so the timeline came
   out as roman with a single shape in it. 「なんでだからアルファベットなの？」
   OWNER 2026-08-28.

   So this is the mock's own alphabet, on the same 21-point lattice the glyph
   editor draws on (GGRID: 40 + i*36): one to three strokes each, at most three
   points a stroke, which is what a stroke IS in this app. A spine and one
   mark, so they read as ONE alphabet somebody invented rather than fifteen
   doodles -- and not from Latin letterforms, which an earlier go did and which
   came out as plainly the roman alphabet in a thin font. */
var OB_SNS_ABC={
  a:[[[10,4],[10,16]],[[10,7],[15,4]]],
  d:[[[10,4],[10,16]],[[6,16],[14,16]]],
  e:[[[10,4],[10,16]],[[10,10],[15,10]]],
  h:[[[10,4],[10,16]],[[6,4],[10,4]]],
  i:[[[10,7],[10,16]]],
  k:[[[10,4],[10,16]],[[10,6],[15,6]],[[10,11],[15,11]]],
  l:[[[10,4],[10,16]],[[10,16],[5,13]]],
  m:[[[6,16],[6,6],[10,4]],[[10,4],[14,6],[14,16]]],
  n:[[[10,4],[10,16]],[[10,6],[15,6],[15,13]],[[15,13],[10,13]]],
  o:[[[10,4],[15,10],[10,16]],[[10,16],[5,10],[10,4]]],
  r:[[[10,4],[10,16]],[[10,4],[15,4]]],
  s:[[[6,5],[14,8]],[[14,8],[6,12]],[[6,12],[14,15]]],
  t:[[[10,4],[10,16]],[[5,8],[15,8]]],
  u:[[[10,4],[10,16]],[[10,16],[15,16],[15,10]]],
  v:[[[6,4],[10,16]],[[10,16],[14,4]]]
};
/* A point is a PAIR and not an {x,y}: otf5's toPolyline() reads p[0] and p[1].
   Written as objects, glyphContours returned no contours at all, inkAdv()
   answered null, and every canvas stayed at its untouched 300x150 -- nothing
   threw and the lines simply were not on the screen. */
function obSnsSt(ch){
  var g=OB_SNS_ABC[ch], out=[], i, j, pts;
  if(!g) return null;
  for(i=0;i<g.length;i++){
    pts=[];
    for(j=0;j<g[i].length;j++) pts.push([40+g[i][j][0]*36, 40+g[i][j][1]*36]);
    out.push({pts:pts});
  }
  return out;
}
/* The line cut into shapes and text -- the shape postCut() makes, handed to
   post.js's own inkOfCut(), so the ink on these posts is built by the one
   function that builds ink. */
function obSnsInk(ln){
  var s=String(ln||''), cut=[], txt='', i, st;
  for(i=0;i<s.length;i++){
    st=obSnsSt(s.charAt(i));
    if(st){ if(txt){ cut.push({t:txt}); txt=''; } cut.push({st:st}); }
    else txt+=s.charAt(i);
  }
  if(txt) cut.push({t:txt});
  return inkOfCut(cut);
}
/* The faces and the photographs are FILES, in www/img/ beside the keyboard's
   own. They were generated SVGs for three commits -- blurred gradients, then
   flat clip-art hills -- and read as exactly what they were. A timeline is
   people; a picture of one needs pictures. */
/* Who is on it. The name, the handle and the LINE are one string each -- the
   same in all ten interface languages -- because a name is a name and a
   sentence somebody wrote in their own language is that sentence. The MEANING
   is the one thing that is translated, because that is what a translation is.
   All of them go through t(), which is how the i18n mirror can see they did.

   The keys are written out whole rather than built from a number and a
   suffix: i18n-check reads the SOURCE for which keys a screen asks for. */
/* Five people, eight posts. A slice of a timeline is what this is -- not a
   directory -- so a face comes round twice, which is what a feed of people you
   follow actually looks like. The faces and the photographs are files in
   www/img/, beside the keyboard's own. */
var OB_SNS_ME=[
  {n:'ob.sns.a.n', h:'ob.sns.a.h', av:'img/av2.jpg'},
  {n:'ob.sns.b.n', h:'ob.sns.b.h', av:'img/av1.jpg'},
  {n:'ob.sns.c.n', h:'ob.sns.c.h', av:'img/av3.jpg'},
  {n:'ob.sns.d.n', h:'ob.sns.d.h', av:'img/av4.jpg'},
  {n:'ob.sns.e.n', h:'ob.sns.e.h', av:'img/av5.jpg'}
];
var OB_SNS_WHO=[
  {w:0, l:'ob.sns.1.l', m:'ob.sns.1.m', ago:4,    re:3,  bo:11},
  {w:1, l:'ob.sns.2.l', m:'ob.sns.2.m', ago:26,   re:1,  bo:4,  pic:'img/pic2.jpg'},
  {w:4, l:'ob.sns.3.l', m:'ob.sns.3.m', ago:52,   re:0,  bo:6,  pic:'img/pic4.jpg'},
  {w:2, l:'ob.sns.4.l', m:'ob.sns.4.m', ago:88,   re:7,  bo:15},
  {w:0, l:'ob.sns.5.l', m:'ob.sns.5.m', ago:190,  re:12, bo:38, pic:'img/pic1.jpg'},
  {w:2, l:'ob.sns.6.l', m:'ob.sns.6.m', ago:260,  re:4,  bo:27, pic:'img/pic5.jpg'},
  {w:3, l:'ob.sns.7.l', m:'ob.sns.7.m', ago:340,  re:2,  bo:9},
  {w:1, l:'ob.sns.8.l', m:'ob.sns.8.m', ago:1180, re:5,  bo:21, pic:'img/pic3.jpg'}
];
/* One post, in the shape post.js reads: everything a reader needs is ON it. */
function obSnsPost(w, i){
  var who=OB_SNS_ME[w.w], ln=t(w.l);
  return { id:'ob'+i, who:t(who.n), hd:t(who.h), at:Date.now()-w.ago*60000,
           ln:ln, ink:obSnsInk(ln), mn:t(w.m), dir:'ltr',
           av:{pic:who.av}, pics:(w.pic? [w.pic] : []),
           re:w.re, bo:w.bo, mine:false };
}
function obSnsHTML(){
  /* The shapes are canvases and a canvas is filled after the HTML is on the
     page. render() does that for the app -- postLines() -- but it returns
     before those lines when the onboarding is what is on screen, and
     www/glyph.js is another session's file today. One line there would do it;
     until then this is that line, run once the page exists. */
  setTimeout(function(){ if(typeof postLines==='function') postLines(); }, 0);
  /* The real page goes in `.obscroll` -- the onboarding's own scrolling box,
     the one the fifteen scripts to borrow from sit in. Without it the page is
     a full-height `.view` and the foot under it is pushed out of `.ob`, which
     is overflow:hidden: the button that ends this step sat at y=1487 on an
     844-tall phone, with nothing to scroll. It was on the page and could not
     be reached. */
  return '<div class="obscroll"><div class="view obsns" style="pointer-events:none">'+
      rootTop('feed', snsFilTop())+
      '<div class="body">'+
        dayRow()+
        OB_SNS_WHO.map(function(w, i){ return postRow(obSnsPost(w, i)); }).join('')+
      '</div>'+
      snsFab()+
    '</div></div>'+
    '<div class="obfoot"><button class="btn"' + DO('obSnsGo') + '>'+t('ob.next')+'</button></div>';
}
function obSnsGo(){ obGo(OB_NAME); }


/* ---- one letter -------------------------------------------------------
   The app used to pick a sound out of the inventory, put "the letter for k"
   at the top, and open the editor already belonging to k -- so the first
   thing anybody made here was an answer to a question the app had asked
   itself. Then it asked the question outright on a screen of its own, which
   was the same question with a longer walk to it.

   It is not asked at all now, and it is not answered either. ltNew() used to
   answer it -- the drawn letter took the next sound nothing read yet, so the
   first mark anybody made in this app came back labelled p and the second t.
   That is the same question a third time: the app deciding, silently, and
   showing the answer on a later screen as though it were a fact.

   A letter here is a shape. What it reads is said on the letter, whenever
   somebody has something to say. */
/* Which letter the step asks for. The first of the slots every language
   starts with, said in one place rather than written 'a' in four. */
function obFirst(){ return LT_START.charAt(0); }
/* The shape is THAT letter, so it is named on the way in -- and naming is
   what puts it in the slot: ltSetRoman() moves it there and hands back the id
   it is under afterwards. ltFreeSlot() is still the one place that decides
   whether it may, so a slot somebody has already drawn on is left alone here
   too and the shape stays a letter of its own. */
function obIntoSlot(id){ return ltSetRoman(id, obFirst())||id; }
/* THE SLOT THIS STEP IS ABOUT, and drawing goes ONTO it.

   It used to mint a new letter every time and then ask ltSetRoman() to move it
   into the slot -- and ltFreeSlot(), which decides whether it may, answers only
   for an EMPTY slot. So somebody who left the onboarding part-way and came back
   and drew again got a SECOND letter also called `a`, with the first one still
   in the alphabet. kbNamed() walks LETTERS for the first one called `a`, so the
   keyboard went on showing the drawing they had replaced.
   「もう一回書いたのに前の文字に勝手になる」 OWNER 2026-08-28.

   Measured before it was believed: after the second drawing the alphabet held
   `a:1本` and `a:2本`, two letters, one name.

   ltStart() puts a-z in a free language before anything is drawn, so the slot
   is always there and drawing is an EDIT of it -- which is what redrawing is
   everywhere else in this app, and what 「あとで書き直せます」 on this very
   screen promises. Nothing is left behind and nothing is duplicated.

   The old road is kept for a language that somehow has no such slot: then
   there is nothing to draw onto and a letter of its own is right. */
function obSlot(){
  var i, l, nm=String(obFirst()).toLowerCase();
  for(i=0;i<LETTERS.length;i++){
    l=LETTERS[i];
    if(ltIsBase(l) && String(ltName(l)||'').toLowerCase()===nm) return l;
  }
  return null;
}
function obDone(){
  var keep=(GE && GE.st)? GE.st.filter(function(x){ return x.pts.length>0; }) : [], slot, st;
  if(!keep.length){ toast(t('ob.draw.empty')); return; }
  st=JSON.parse(JSON.stringify(keep));
  slot=obSlot();
  ob.lid = slot? ((ltSetStrokes(slot.id, st)||slot).id)
               : obIntoSlot(ltNew({ st: st }).id);
  SET.myfont=true;
  save(); installScriptFont(); GE=null;
  obTour=0; ob.step=OB_TOUR; save(); obTourGo();
}
function obBorrow(id){ ob.mode='borrow'; ob.pick=id||''; GE=null; render(); window.scrollTo(0,0); }
function obPickScript(id){ ob.pick=id; render(); window.scrollTo(0,0); }
function obTakeCh(ch){
  /* Onto the slot, for the same reason obDone() is -- borrowing twice made two
     letters called `a` exactly as drawing twice did. */
  var slot=obSlot();
  ob.lid = slot? ((ltSetChar(slot.id, ch)||slot).id)
               : obIntoSlot(ltNew({ ch: ch }).id);
  SET.showScript=true;
  save(); installScriptFont();
  ob.mode=''; obTour=0; ob.step=OB_TOUR; save(); obTourGo();
}
/* Past the drawing, the walk, the timeline and the name, to the door -- and
   not past the door. 「ログイン画面までスキップ」 OWNER 2026-08-28. */
function obSkipAll(){ ob.lid=''; obTour=0; obGo(OB_IN); }

function obFinish(){
  /* A language that reached the end of this without a name keeps not having
     one. It used to be given the word "language" in the interface's language,
     which is not a name; then a word coined out of its own inventory, which
     is worse, because that IS a name and it is not the person's. Nothing on
     the cover said where it came from, so it read as a name they had somehow
     already chosen. 「言語名も勝手に決まるの何」

     Unnamed is a state this app already has: the cover says so and offers the
     pencil, settings shows a dash. */
  if(!langName) langName=ob.name||'';
  SET.done=true; save();
  /* And what was made on the way here goes up. The door is the LAST step, so
     the letter, the alphabet and the language's name were all made before
     this account existed -- 「制作はオフラインでも可能次つながった時に更新
     される」, and this is that moment. Everything the walk made is on the
     phone until this line; without it the only copy is on the phone until
     the next launch, because boot.js is the only other place that asks and
     it asked before there was a session to ask with.

     netLangSync() is www/net.js's and decides everything itself: it does
     nothing without a session and nothing without a language, it MERGES
     rather than overwrites, and it is safe to call twice. So this is a call
     and not a condition -- nothing here re-states what that file already
     says. */
  if(typeof netLangSync==='function') netLangSync();
  route='profile'; RENDERED=null; render(); window.scrollTo(0,0);
}

/* How many strokes are actually on the canvas. GE.st carries the one being
   drawn as well, and an untouched surface has one of length nought on it, so
   an empty drawing is not an empty list. obDone() counts the same way. */
function obStrokes(){
  if(!GE || !GE.st) return 0;
  return GE.st.filter(function(x){ return x.pts.length>0; }).length;
}
/* What the step says, and it is not the same sentence twice.

   「なんかただ続けるだけじゃなくて、操作のサポートする系のオンボーディングに
   して欲しい」 A line that says "draw a letter" and then goes on saying it
   while somebody draws is a caption. This reads the canvas: before anything
   is on it, it says what to do with a finger; after the first stroke it says
   that worked and that more is allowed; and the button that ends the step is
   DOWN until there is something to end it with, so nothing here can be
   pressed into a dead end.

   This is the one place the app coaches, and it is inside the onboarding,
   which is the one place CLAUDE.md's rule against explaining is not about --
   the rule is that a SCREEN does not explain itself, and the onboarding is
   not a screen somebody arrives at, it is what the app is until it is done. */
/* What the step says AND that it is not for ever, on one line under the
   heading. 「指で線を引いて。後で書き直せます。」 OWNER 2026-08-28 -- the
   reassurance used to sit at the foot, under the buttons, which is after
   somebody has decided. Somebody who thinks the first stroke has to be right
   will not draw one, so they have to know before they decide, not after. */
function obCoachSay(n){
  return t(n? 'ob.coach.drawn' : 'ob.coach.draw')+' '+t('ob.draw.note');
}
function obCoach(n){
  /* .obsub, which is the line this step already had -- what changes is the
     words, and the words changing IS the coaching. No new class, because
     www/index.html is another session's file today. */
  return '<p class="obsub">'+esc(obCoachSay(n))+'</p>';
}
/* And the step answers the hand WHILE the hand is drawing.

   Drawing does not redraw the screen -- geDraw() paints the canvas and
   geTools() wakes the rail, and neither of them is the step. So the line
   above the canvas went on saying "draw a letter" over a drawn letter, and
   the button that ENDS the step stayed down: the first screen of the app,
   with a letter on it, and no way on. It only came alive if you happened to
   press one of the tools, because those redraw everything.

   This is geTools() for the two things the STEP owns, called from the same
   place, and the words are obCoachSay()'s in both. */
function obDrawTick(){
  if(SET.done || ob.step!==OB_DRAW) return;
  var n=obStrokes(),
      p=document.querySelector('.ob .obsub'),
      b=document.querySelector('.ob [data-do="obDone"]');
  if(p) p.textContent=obCoachSay(n);
  if(b) b.disabled=!n;
}
function obDrawHTML(){
  if(!GE) GE=newGE('');
  var st=GE.st[GE.si], pts=0, n=obStrokes();
  GE.st.forEach(function(x){ pts+=x.pts.length; });
  return '<div class="mid">'+
    /* The letter is IN the question. 「じゃあ君のaを書いてみようにして、それを
       枠にぶち込めばええんちゃう？」 -- so the step after it, which asked which
       letter the shape was, has nothing left to ask and is gone. */
    '<h2>'+esc(t('ob.draw.h', obFirst()))+'</h2>'+
    obCoach(n)+
    '<div class="gcanvwrap obpad"><canvas id="gcanv" class="gcanv"></canvas></div>'+
    geRail(st, pts)+
    '<div class="obesc"><button class="obescb"' + DO('obBorrow', [""]) + '>'+
      '<span>'+t('ob.or')+'</span>'+OB_CHEVR+
    '</button></div></div>'+
    /* The foot takes the room that is left, so the two rows can stand apart:
       Done just under the strip above, and the way to the door pinned to the
       bottom of the screen. 「完了の位置が下帯のちょい下 / ログインへは一番下に
       張り付く感じで」 OWNER 2026-08-28.

       Written here rather than in a rule, because `.ob .obfoot` is
       `flex:0 0 auto` -- it hugs its rows -- and www/index.html is another
       session's file today. Nothing but layout: no corner, no border, no
       colour. */
    '<div class="obfoot" style="flex:1 1 auto;min-height:0;display:flex;'+
      'flex-direction:column;align-items:stretch">'+
    /* flex:0 0 auto, because `.btn` is `flex:1` -- written for a ROW of
       buttons, where it shares the width. In a column it shares the HEIGHT,
       and the button came out 117px tall with the row under it pushed up
       against it. */
    '<button class="btn" style="flex:0 0 auto"' + DO('obDone') +
      (n? '' : ' disabled') + '>'+t('ob.draw.done')+'</button>'+
    /* Straight to the door, past all of it. 「ログインまでスキップ」 OWNER
       2026-08-28 -- for somebody who has an account already and is looking at
       this screen because they reinstalled the app.

       It skips TO the door, not past it: the door is still the last step and
       there is still no way round it (OWNER 2026-08-26, and act-check holds
       it -- signed out, all 37 routes are the door). Signing in from there
       ends the onboarding exactly as it does at the end of the walk, because
       obIn() calls obFinish() whenever SET.done is false.

       Here and nowhere else. This is the FIRST screen, which is where somebody
       decides they do not want the walk; the name step already reaches the
       door through 「あとで決める」, and the walk's own chevron comes back here. */
    '<button class="obskip" style="margin-top:auto"' + DO('obSkipAll') + '>'+
      t('ob.skip')+'</button>'+
    '</div>';
}

/* A sample is worth showing only if this phone can actually draw it. Some of
   these -- Ogham, Phoenician, Glagolitic -- are missing from a lot of
   systems, and a row of empty boxes says less than no row at all. The test is
   the width of the character against the width of one that certainly is not
   in any font: identical means both came out as the same missing-glyph box.
   Measured once per script and remembered, because it cannot change while
   the app is open. */
var OB_PV={};
function obPv(w){
  if(OB_PV[w.id]!==undefined) return OB_PV[w.id];
  var out='';
  try{
    var c=document.createElement('canvas'), x=c.getContext('2d');
    /* The face the preview will actually be drawn in, which is the body's.
       It was written out here as a SHORTER list than --face-ui, with no
       'Noto Sans JP' on it, so a script was measured in one font and shown
       in another. */
    x.font='24px '+cssVar('--face-ui', 'sans-serif');
    var miss=x.measureText('￿￿').width/2, chars=w.ch.split(' '), got=[];
    for(var i=0;i<chars.length && got.length<3;i++){
      var ch=chars[i], wd=x.measureText(ch).width;
      if(wd>0 && Math.abs(wd-miss)>0.5) got.push(ch);
    }
    if(got.length===3) out=got.join(' ');
  }catch(e){ out=w.pv.slice(0,3); }
  OB_PV[w.id]=out;
  return out;
}

function obBorrowHTML(){
  var w=null; WORLD_SCRIPTS.forEach(function(x){ if(x.id===ob.pick) w=x; });
  if(w) return '<div class="mid obleft">'+
    '<h2 class="obh">'+esc(t('ws.'+w.id))+'</h2>'+
    '<p class="obsub">'+t('ob.borrow.take')+'</p>'+
    '<div class="obchars">'+w.ch.split(' ').map(function(ch){
      return '<button class="obchb"' + DO('obTakeCh', [ch]) + '>'+esc(ch)+'</button>';
    }).join('')+'</div></div>';
  /* Two columns, because fifteen rows do not fit on a phone and a first
     screen that scrolls is a first screen that has already lost. Each row
     shows a few of its own characters under the name: "Phoenician" tells you
     nothing you can picture, and three of its letters tell you everything. */
  return '<div class="mid obleft">'+
    '<h2 class="obh">'+t('ob.borrow.h')+'</h2>'+
    '<p class="obsub">'+t('ob.borrow.sub')+'</p>'+
    '<div class="obscroll"><div class="obscripts">'+WORLD_SCRIPTS.map(function(x){
      var pv=obPv(x);
      return '<button class="obsrow"' + DO('obPickScript', [x.id]) + '>'+
        '<span class="obnm">'+esc(t('ws.'+x.id))+'</span>'+
        (pv? '<span class="obpv">'+esc(pv)+'</span>' : '')+
        '</button>';
    }).join('')+'</div></div></div>';
}

function obDots(){
  var a=[], i;
  for(i=0;i<OB_STEPS;i++) a.push(i);
  return a;
}
function vOb(){
  /* Signed out, this is the door whatever step ob.step is left on -- a person
     who signs out after finishing has ob.step sitting on the name or the
     tour, and neither of those is a screen to show somebody with no account.
     appIs() in www/shell.js is where that is decided. */
  var s=ob.step, door=appIs()==='door' || !!obPending() || s===OB_IN;
  var head='<div class="obhead">'+
    (obCanBack()? '<button class="obback"' + DO('obBack') + ' aria-label="'+esc(t('ob.back'))+'">'+OB_CHEV+'</button>'
                : '<span class="obback ph"></span>')+
    /* The dots count the onboarding, and signing in is the last step of it --
       so the door shows them when it IS that step, and shows none when it was
       opened from Settings or from a timeline. obPending() is what tells the
       two apart: a door opened from somewhere remembers where. */
    '<div class="obtop">'+((obPending() || SET.done)? '' : obDots().map(function(i){
      return '<div class="dot'+(i<=s?' on':'')+'"></div>'; }).join(''))+'</div>'+
    '<select class="oblang" aria-label="'+esc(t('ob.lang.a'))+'"' + CH('obLang') + '>'+
      UI_LANGS.map(function(c){
        return '<option value="'+c+'"'+(uiLang()===c?' selected':'')+'>'+esc(LANG[c].label)+'</option>';
      }).join('')+
    '</select></div>';
  /* Drawing used to be fourth, behind a name, a writing system and the
     sounds. The writing system is gone -- wsGuess() reads it off the letters
     rather than asking somebody to choose between an abjad and an abugida
     before they have drawn anything -- and the name went last, because a
     language is easier to name once it has made a mark, and obFinish() has
     always been able to invent one out of the inventory for anybody who
     skips it. */
  var h = door? obDoorHTML()
        : (s===OB_DRAW && ob.mode==='borrow')? obBorrowHTML()
        : (s===OB_DRAW)? obDrawHTML()
        : (s===OB_SNS)? obSnsHTML()
        : obNameHTML();
  return '<div class="ob view'+(door?' center':'')+'">'+head+h+'</div>';
}

