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
     2 put it in the alphabet
     3 the making screen
     4 the keyboard
     5 the first keyboard -- "the letter you just drew went in here"
     6 "make letters and words, enjoy your making life"
     7 sign in -- "to keep making, sign in"

   The door was put FIRST once and that was a misreading of
   「とりあえずログインして、文字を書くところからやな」, which is what to
   BUILD first, not what comes first on screen. It goes back to the end,
   where the owner put it: somebody draws a letter and sees where it landed,
   and is asked to sign in once there is something to sign in for.

   That is why makeNeed() does not fire while SET.done is false -- the walk
   below is the one place making happens without a name on the account, and
   step 7 is where the account is asked for.

   Steps 3 to 6 are not screens of this file. They are the app itself, walked
   with everything but one thing greyed out -- OB_TOUR_STOPS below. The dots
   count the four SCREENS the onboarding has (draw, alphabet, name, door);
   the walk is not one of them, because while it is running the app is
   showing its own screens and vOb() is not on the page at all. */
var OB_STEPS=3;
/* Which step is which, by name, because 0 1 2 3 in eight places is four
   chances to renumber three of them. */
var OB_DRAW=0, OB_TOUR=1, OB_NAME=2, OB_IN=3;

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
  { r:'kb',    a:'', lt:1,     lab:'ob.tour.kb1' }
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
/* Done with the walk through the app. */
function obTourDone(){ obTour=0; obGo(OB_NAME); }
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
  if(!b) out=obPane(0,0,W,H);   /* nothing found: the grey is the whole screen */
  else{
    x=Math.min(b.left, hb.left)-m;  y=Math.min(b.top, hb.top)-m;
    w=Math.max(b.right, hb.left+hb.w)+m-x;
    h=Math.max(b.bottom, hb.top+hb.h)+m-y;
    out=obPane(0,0,W,y)+                   /* above */
        obPane(0,y+h,W,H-(y+h))+           /* below */
        obPane(0,y,x,h)+                   /* left  */
        obPane(x+w,y,W-(x+w),h);           /* right */
  }
  return out+
    /* A lit thing that does something of its own is pressed for real -- the
       row into the keyboard chapter goes there, and going there is what moves
       the tour on. Two cases need a tap target of the walk's own:

       A lit thing that does NOTHING. The free keyboard's keys are spans,
       because there is no editor behind them.

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
    ((st.lt || !b)? '<button class="obtap"' + DO('obTourNext') +
              ' style="position:fixed;background:none;z-index:42;'+
              (b? 'left:'+Math.round(b.left)+'px;top:'+Math.round(b.top)+'px;'+
                  'width:'+Math.round(b.width)+'px;height:'+Math.round(b.height)+'px'
                : 'left:0;top:0;width:100%;height:100%')+'"'+
              ' aria-label="'+esc(t(st.lab))+'"></button>' : '')+
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
    (hb? '<div class="obhand" aria-hidden="true" style="position:fixed;z-index:43;'+
              'pointer-events:none;color:var(--gold);line-height:0;'+
              'left:'+hb.left+'px;top:'+hb.top+'px;width:'+hb.w+'px;height:'+hb.h+'px;'+
              'animation:vopulse 1.1s ease-in-out infinite'+
              (hb.up? '' : ';transform:scaleY(-1)')+'">'+OB_HAND+'</div>' : '');
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
/* On to the next stop, for a lit thing that had nothing of its own to do. */
function obTourNext(){
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
function obCanBack(){
  /* At the door there is always somewhere to be out to -- it is never the
     app any more, it is somewhere you were sent from. Except once the
     account exists: the screen behind 'who' would offer to sign in as
     somebody else. */
  if(obPending()) return OBM.mode!=='who';
  /* Nothing is behind the first step, and nothing is behind the door while
     it IS the first step: there is no app to go back to yet. */
  /* Nothing is behind the first step. */
  return ob.step>OB_DRAW || ob.mode==='borrow';
}
function obBack(){
  /* The chevron in the corner is the only way back in the onboarding, so the
     door goes through it too rather than growing one of its own. Out of the
     code back to the account it was sent for, out of anything else back to
     signing in, and out of signing in to wherever the door was opened
     from. */
  if(obPending()){
    if(OBM.mode==='code'){ obMailGo('up'); return; }
    /* Out of the reset back to the address it was sent to, so a mistyped
       address is one press from being retyped rather than two. */
    if(OBM.mode==='reset'){ obMailGo('forgot'); return; }
    if(OBM.mode==='in'){ obReturn(); return; }
    obMailGo('in'); return;
  }
  if(ob.step===OB_DRAW && ob.mode==='borrow'){
    if(ob.pick){ ob.pick=''; render(); return; }      /* out of one script, back to the fifteen */
    ob.mode='draw'; render(); window.scrollTo(0,0); return;
  }
  if(ob.step>0) obGo(ob.step-1);
}
function obLang(v){ SET.ui=v; save(); render(); }

/* ---- the door, which is not a step ------------------------------------ */
/* Signing in used to come first and the app opened on this. It does not any
   more: boot.js makes an anonymous account before the first frame, so
   everything is already counted against an account and there is nothing left
   for a door at the front to buy. 「サインイン必須にしたいけど、オンボー
   ディングで離脱されるのは防ぎたい」

   The question that argument was about -- you drew a letter here, and the
   account you just signed into already has a language, which one survives --
   is answered by the uid not changing: attaching an identity to an anonymous
   account keeps it, so there are never two.

   This is a screen the app goes TO now, from the two places that need a name
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
/* No nonce is asked for or sent. Apple only puts one in the token when the
   request carried one, and Supabase only checks one when the token has one,
   so the two agree by both staying quiet. Sending one would mean hashing it
   the way Apple hashes it and handing the raw one to Supabase, which is three
   places to get wrong for a token that never leaves the phone's own request. */
function obSocial(who, opts){
  obNative('SocialLogin', function(p){
    /* Busy is set HERE and not by the two callers, because obNative() answers
       for a plugin that is not in this build by saying so and returning --
       and a spinner started before that check is a spinner nothing stops. */
    OBM.busy=true; render();
    obReady(p, function(){
      p.login({ provider:who, options:opts }).then(function(r){
        var tok=r && r.result && r.result.idToken;
        /* A sign-in that came back without a token is not a session and must
           not be treated as one. It is also not an error anybody can act on,
           so it closes the way closing the sheet does. */
        if(!tok){ obShrug(); return; }
        netIdToken(who, tok, '', obIn, obNo);
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
    OBM.nm=ME.name; OBM.hd=ME.handle; render();
  }, function(d, s){
    /* The lookup failed, so we do not know whether there is a row. Asking is
       the safe half: an insert that turns out to be a duplicate is refused
       by the constraint and says so, where skipping would leave somebody
       with an account nobody can address. */
    OBM.busy=false; OBM.msg=netWhy(d, s); render();
  });
}
function obNo(d, s){
  OBM.busy=false; OBM.msg=netWhy(d, s); render();
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
var OBM={ mode:'in', em:'', pw:'', code:'', nm:'', hd:'', busy:false, msg:'' };
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
   launch, so this is netMember() and not netSignedIn().

   Where you are standing is where the door sends you back to, so a like
   pressed halfway down a thread does not land you on the timeline. */
function obNeed(){
  var h;
  if(netMember()) return true;
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
function obMailGo(m){ OBM.mode=m; OBM.msg=''; render(); window.scrollTo(0,0); }
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
function obMailUp(){
  if(OBM.busy || !obMailAsk()) return;
  OBM.busy=true; OBM.msg=''; render();
  netSignUp(OBM.em, OBM.pw, function(){
    /* Confirmation is on, so this did not sign anybody in: it sent six digits
       to an address that may have a typo in it. The typo is the whole reason
       confirmation is on -- an address nobody can read is an account nobody
       can recover, months later, when the password is what they forgot. */
    OBM.busy=false; OBM.pw=''; obMailGo('code');
  }, obNo);
}
function obMailCode(){
  if(OBM.busy) return;
  OBM.busy=true; OBM.msg=''; render();
  netVerify(OBM.em, OBM.code, obIn, obNo);
}
/* Asking for a reset used to END here: the request went, the screen said
   "sent", and there was nowhere to go with what arrived. The mail carried a
   link, because that is what Supabase's Reset Password template says, and a
   link has nowhere to land in a Capacitor app -- the same wall the signup
   mail hit and was answered with six digits. So this goes on to the screen
   that takes them. */
function obMailForgot(){
  if(OBM.busy || !obMailAsk()) return;
  OBM.busy=true; OBM.msg=''; render();
  netRecover(OBM.em, function(){
    OBM.busy=false; OBM.code=''; OBM.pw=''; obMailGo('reset');
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
  if(!OBM.pw){ OBM.msg=t('net.needpass'); render(); return; }
  OBM.busy=true; OBM.msg=''; render();
  var pw=OBM.pw;
  netRecoverCode(OBM.em, OBM.code, function(){
    netSetPass(pw, function(){ OBM.pw=''; OBM.code=''; obIn(); }, obNo);
  }, obNo);
}
function obMailField(id, k, type, auto, ph){
  return '<div class="field"><input id="'+id+'" type="'+type+'" '+
    'value="'+esc(OBM[k])+'" placeholder="'+esc(t(ph))+'" '+
    'autocomplete="'+auto+'" autocapitalize="none" autocorrect="off" '+
    'spellcheck="false"' + IN('obMailSet', [k]) + '></div>';
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
/* There is nothing to skip past. The door is not the way in any more -- the
   app makes an account by itself at first launch and this is where somebody
   puts a name on it -- so "continue without an account" would be offering
   what everybody already has, on a screen nobody arrived at by accident.
   The chevron is the way out. */
function obFormHTML(up){
  return '<div class="mid obform">'+
    obCrestHTML()+
    obMailField('ob-em', 'em', 'email', 'username', 'ob.mail.em.ph')+
    obMailField('ob-pw', 'pw', 'password',
                (up? 'new-password' : 'current-password'), 'ob.mail.pw.ph')+
    (OBM.msg? '<div class="obmsg">'+esc(OBM.msg)+'</div>' : '')+
    '<button class="btn"' + DO(up? 'obMailUp' : 'obMailIn') + (OBM.busy? ' disabled':'') + '>'+
      t(OBM.busy? 'ob.mail.wait' : (up? 'ob.mail.up' : 'ob.mail.in'))+'</button>'+
    (up? ''
       : '<button class="obskip"' + DO('obMailGo', ["forgot"]) + '>'+t('ob.mail.to.forgot')+'</button>'+
         '<div class="obor"><span>'+t('ob.signin.or')+'</span></div>'+
         '<button class="btn signin apple"' + DO('obSignInApple') + '>'+MARK_APPLE+'<span>'+t('ob.signin.apple')+'</span></button>'+
         '<button class="btn signin google"' + DO('obSignInGoogle') + '>'+MARK_GOOGLE+'<span>'+t('ob.signin.google')+'</span></button>')+
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
      /* A brand new account made from Settings is still somebody who has a
         language -- they signed up late, not early. */
      if(obReturn()) return;
      /* A new account made at the END of the onboarding: that was the last
         step, so the walk is over. */
      obFinish();
    }, obNo);
  }, obNo);
}

/* The two faces that ask for one thing: the six digits, and the address to
   send a reset to. Neither is a place to arrive at, so neither carries the
   bar -- the chevron is the way out of both. */
function obAskHTML(code){
  return '<div class="mid obform">'+
    '<h2 class="obh">'+t(code? 'ob.mail.h.code' : 'ob.mail.h.forgot')+'</h2>'+
    (code
      ? '<p class="obsub">'+esc(t('ob.mail.code.sub', OBM.em))+'</p>'+
        obMailField('ob-code', 'code', 'text', 'one-time-code', 'ob.mail.code.ph')
      : obMailField('ob-em', 'em', 'email', 'username', 'ob.mail.em.ph'))+
    (OBM.msg? '<div class="obmsg">'+esc(OBM.msg)+'</div>' : '')+
    '<button class="btn"' + DO(code? 'obMailCode' : 'obMailForgot') + (OBM.busy? ' disabled':'') + '>'+
      t(OBM.busy? 'ob.mail.wait' : (code? 'ob.mail.verify' : 'ob.mail.send'))+'</button>'+
    '</div>';
}
/* The reset, which is the code and the new password on one screen. Not two
   screens: they arrive in the same minute out of the same mail, and a code
   typed on one screen and a password on the next is a second place for the
   code to expire in. */
function obResetHTML(){
  return '<div class="mid obform">'+
    '<h2 class="obh">'+t('ob.mail.h.reset')+'</h2>'+
    '<p class="obsub">'+esc(t('ob.mail.code.sub', OBM.em))+'</p>'+
    obMailField('ob-code', 'code', 'text', 'one-time-code', 'ob.mail.code.ph')+
    obMailField('ob-pw', 'pw', 'password', 'new-password', 'ob.mail.newpw.ph')+
    (OBM.msg? '<div class="obmsg">'+esc(OBM.msg)+'</div>' : '')+
    '<button class="btn"' + DO('obResetGo') + (OBM.busy? ' disabled':'') + '>'+
      t(OBM.busy? 'ob.mail.wait' : 'ob.mail.reset')+'</button>'+
    '</div>';
}

function obDoorHTML(){
  var m=OBM.mode;
  if(m==='who') return obWhoHTML();
  if(m==='reset') return obResetHTML();
  if(m==='code' || m==='forgot') return obAskHTML(m==='code');
  return obFormHTML(m==='up');
}

/* ---- step 3, its name -------------------------------------------------
   The one thing somebody arrives already having an opinion about, and the
   only question here they can answer without being taught anything. It can
   be left blank and changed at any time from the cover. */
/* Naming the language is not the end of the walk any more -- signing in is,
   and it comes after this. */
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
function obDone(){
  var keep=(GE && GE.st)? GE.st.filter(function(x){ return x.pts.length>0; }) : [];
  if(!keep.length){ toast(t('ob.draw.empty')); return; }
  ob.lid=obIntoSlot(ltNew({ st: JSON.parse(JSON.stringify(keep)) }).id);
  SET.myfont=true;
  save(); installScriptFont(); GE=null;
  obTour=0; ob.step=OB_TOUR; save(); obTourGo();
}
function obBorrow(id){ ob.mode='borrow'; ob.pick=id||''; GE=null; render(); window.scrollTo(0,0); }
function obPickScript(id){ ob.pick=id; render(); window.scrollTo(0,0); }
function obTakeCh(ch){
  ob.lid=obIntoSlot(ltNew({ ch: ch }).id);
  SET.showScript=true;
  save(); installScriptFont();
  ob.mode=''; obTour=0; ob.step=OB_TOUR; save(); obTourGo();
}
/* Nothing was drawn, so there is nothing to say which letter it is: the step
   after this is about a shape and there is no shape. */
function obSkipDraw(){ ob.lid=''; obTour=0; ob.step=OB_TOUR; save(); obTourGo(); }

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
function obCoachSay(n){ return t(n? 'ob.coach.drawn' : 'ob.coach.draw'); }
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
    '<div class="obfoot">'+
    '<button class="btn"' + DO('obDone') + (n? '' : ' disabled') + '>'+
      t('ob.draw.done')+'</button>'+
    '<button class="obskip"' + DO('obSkipDraw') + '>'+t('ob.draw.later')+'</button>'+
    /* And that it is not for ever. 「あとで編集できるよって」 The same line the
       name step has, in the same place: what is being asked for here is the
       first stroke of an alphabet, and somebody who thinks it has to be right
       will not draw one. */
    '<div class="mini obnote">'+esc(t('ob.draw.note'))+'</div></div>';
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
  var s=ob.step, door=!!obPending() || s===OB_IN;
  var head='<div class="obhead">'+
    (obCanBack()? '<button class="obback"' + DO('obBack') + ' aria-label="'+esc(t('ob.back'))+'">'+OB_CHEV+'</button>'
                : '<span class="obback ph"></span>')+
    /* The dots count the onboarding, and signing in is the first step of it
       now -- so the door shows them when it IS that step, and shows none when
       it was opened from Settings or from a timeline. obPending() is what
       tells the two apart: a door opened from somewhere remembers where. */
    '<div class="obtop">'+(obPending()? '' : obDots().map(function(i){
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
        : obNameHTML();
  return '<div class="ob view'+(door?' center':'')+'">'+head+h+'</div>';
}

