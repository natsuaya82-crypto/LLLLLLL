/* Lingua — what the system keyboard is given (chapter 23)
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   23. Out to the keyboard
   ========================================================================= */
/* The keyboard you can put in Messages is not this app. It is a second
   program, in a second language, with its own memory budget and no access to
   anything here — a phone hands an extension a few dozen megabytes and kills
   it for asking for more, so it cannot hold otf5.js and must not try.

   This is www/post.js's line again, drawn between two programs instead of
   between two halves of one file. The extension is the READING side: it has
   no LETTERS, no ltName(), no geStep(), no idea what a lattice is. So the
   same rule holds — what a reader needs is put ON the thing when it is
   written, here, where the making side still exists.

   So a key does not carry a letter's id. It carries:

     what pressing it types      the letter's name, which is its code point
     what it looks like          the SHAPE, already cut, as filled polygons

   Polygons and not strokes. A stroke is a line through the lattice with a
   pen to be dragged along it, and turning one into ink is a b-spline, a
   round-corner pass and the convex hull of the nib at every step — the whole
   of LinguaFont.glyphContours. Sending strokes would mean writing that a
   second time in Swift, and the day GPEN or the spline changed, the letter on
   the key and the letter in the app would come apart with nothing able to see
   it. The hull is computed once, here, by the same call inkStrokes uses.
   「組み立ては一切やりません」

   The extension therefore draws a key in three lines: fill these polygons in
   this box, or if there are none draw this text.

   Nothing here is user-facing, so nothing here goes through t(). */

/* What was last handed over. Everything below is rebuilt from scratch each
   time, so this is the only thing the chapter remembers. */
var SHARE={sent:null, how:''};

/* The square the shapes are drawn in. It is otf5's cell and glyph.js's
   lattice — both are 800 — and the extension is told rather than trusting a
   number it cannot check. Coordinates come out of glyphContours in exactly
   the space inkStrokes fills them in: x right, y DOWN from the top of the
   box, which is a canvas's space and not a font's. */
var SHARE_BOX=800;

/* A letter's ink, as the extension will fill it: a list of closed convex
   polygons, each a list of [x, y]. Null for a letter that was never drawn --
   which is not an error, it is an alphabet somebody is halfway through.

   The try is glyphContours': a stroke of one point on top of itself has no
   hull and it says so by throwing. */
function shareInk(l){
  var cs;
  if(!l || !l.st || !l.st.length) return null;
  try{ cs=LinguaFont.glyphContours({strokes:l.st}, GPEN); }catch(e){ return null; }
  return (cs && cs.length)? cs : null;
}
/* What the extension puts on a key face, by the same three-way rule ltInk()
   follows here: the shape if there is one, else the character it borrows,
   else nothing and the key wears its own name. Absent rather than null, so
   the file is a keyboard rather than a column of nulls. */
function shareFace(id){
  var l=ltById(id), o={t:kbTyped(id)}, ink;
  if(!l) return o;
  ink=shareInk(l);
  if(ink) o.st=ink;
  else if(l.ch) o.ch=l.ch;
  return o;
}
/* One key. `k` is what it does, and the rest is what it takes to draw it. */
function shareKey(key){
  var o, i, f, any;
  if(!key) return null;
  if(key.k==='lt'){
    o=shareFace(key.v);
    o.k='lt';
  }else if(key.k==='lay'){
    o={k:'lay', to:parseInt(key.v, 10)||0};
  }else{
    o={k:key.k};
  }
  o.w=key.w||1;
  if(key.k==='lt' && key.f){
    f=[]; any=false;
    for(i=0;i<4;i++){
      if(key.f[i] && ltById(key.f[i])){ f.push(shareFace(key.f[i])); any=true; }
      else f.push(null);
    }
    if(any) o.f=f;
  }
  return o;
}
/* The globe. Apple requires a keyboard extension to offer a way off itself,
   and nobody building a layout in this app put one there, because inside the
   app there is nowhere else to go. So it is added on the way out, at the
   bottom left, where every keyboard on the phone already keeps it.
   It is the one key the person did not place. */
function shareRows(lay){
  var rows=[], i, j, row, r;
  for(i=0;i<lay.rows.length;i++){
    row=[];
    for(j=0;j<lay.rows[i].length;j++) row.push(shareKey(lay.rows[i][j]));
    rows.push(row);
  }
  if(rows.length) rows[rows.length-1].unshift({k:'next', w:1});
  return rows;
}
/* The whole of it: this language's keyboard, drawn, with nothing in it that
   points at anything back here. */
function shareKbd(){
  var b=kbOf(), lay=[], i;
  for(i=0;i<b.lay.length;i++) lay.push({rows:shareRows(b.lay[i])});
  return {v:1, lang:langId, name:langName, box:SHARE_BOX, lay:lay};
}

/* ---- when ----------------------------------------------------------------
   Everything the keyboard is given changes when a letter changes, when the
   layout changes, when the plan changes (free reads kbFixed and paid reads
   KB), or when a different language is opened. That is four call sites and
   four chances to forget one, so it is none of them: the signature is asked
   on every render and the write happens when the answer moves.

   It is glyph.js's own trick, one line below where it does it, and for the
   same reason — a rule with one place to live. scriptSig() is the letters,
   verbatim, so a shape drawn a second ago is on the key. */
function shareSig(){
  return scriptSig()+'|'+langId+'|'+(has('plus')? 'p':'f')+'|'+JSON.stringify(KB);
}
/* The hand onto the native side. Asked for once and kept, because asking
   twice is a warning in the console and the same object back.

   It is registerPlugin() and NOT Capacitor.Plugins.LinguaShare. That was the
   first way this was written and it silently did nothing: since Capacitor 6
   the Plugins object holds only what registerPlugin has put there, so the
   native class was registered, the app looked in the wrong drawer, found
   nothing, and — because it was written to say nothing when there was nobody
   to tell — said nothing. The keyboard on the phone answered "draw some
   letters first" while the letters sat drawn on the other side of a wall.
   That cost a build.

   Undefined means never asked; null means asked and not there, which is
   every browser this ever runs in outside the app. */
var SHARE_P;
function sharePlug(){
  if(SHARE_P===undefined){
    SHARE_P=(window.Capacitor && Capacitor.registerPlugin)?
      Capacitor.registerPlugin('LinguaShare') : null;
  }
  return SHARE_P;
}
/* The one window onto the App Group, the way net.js is the one window onto
   the server.

   The payload is built whether or not anybody is listening, so that every
   walk of the app builds it and a shape that cannot be cut is a failed check
   here rather than a blank keyboard on somebody's phone.

   What came of the last push is kept rather than dropped. There is nothing to
   say to somebody standing in the app — they did not ask for this and are not
   waiting on it — but the one question worth answering later is "did it ever
   land", and the answer has to survive until something asks. */
function sharePush(){
  var sig=shareSig(), out=JSON.stringify(shareKbd()), p=sharePlug();
  if(sig===SHARE.sent) return;
  SHARE.sent=sig;
  if(!p){ SHARE.how='no plugin'; return; }
  SHARE.how='sent';
  p.write({json:out, font:SFONT.b64||''})['catch'](function(e){
    SHARE.how='refused: '+(e && e.message? e.message : e);
  });
}
