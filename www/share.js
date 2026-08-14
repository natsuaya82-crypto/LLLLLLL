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
  var l=ltById(id), o={t:kbTyped(id)}, ink, a;
  if(!l) return o;
  ink=shareInk(l);
  if(ink){
    o.st=ink;
    /* And what it takes up standing beside the next one. A key is a square
       cell and the extension is right to draw one that way; a LINE of letters
       is the other rule -- ink plus one step, half a step at each end -- and
       the candidate bar is a line. It was laying every letter out in a square,
       so two narrow letters sat a whole cell apart.
       「キーボード内のプレビューのアルファベットいちいち全角のスペース開くのうざい」

       The number is worked out HERE, by inkAdv(), which is the one place that
       knows the rule, and carried. Swift doing the same arithmetic would be a
       second copy of a rule that already exists in one place, and the two
       would drift the first time the pen changed.

       `aw` and not `w`: a KEY already has a `w`, which is how wide it is in
       its row, and shareKey() writes it over whatever the face put there.
       Two different widths cannot share a name in a file where the key and
       the face it wears are one object. */
    a=inkAdv(l.st);
    if(a){ o.aw=a.w; o.dx=a.dx; }
  }
  else if(l.ch) o.ch=l.ch;
  return o;
}
/* One key. `k` is what it does, and the rest is what it takes to draw it. */
function shareKey(key){
  var o, i, f, any, l;
  if(!key) return null;
  if(key.k==='lt'){
    o=shareFace(key.v);
    /* What the KEY types, when the key says. Only the fixed keyboard does --
       kbFix() puts the a-z character that found the letter on it, so a letter
       an older language calls `O` still types `o` from the `o` key. A
       keyboard somebody built has no override and types the names they
       chose. */
    if(key.t) o.t=key.t;
    o.k='lt';
  }else if(key.k==='lay'){
    /* A layer key wears the first letter of the layer it goes to, the same
       as it does in here -- so the extension is handed that letter's shape
       rather than being told to draw a number it would have to invent. */
    i=parseInt(key.v, 10)||0;
    l=kbLayLetter(i);
    o=l? shareFace(l.id) : {t:String(i+1)};
    o.k='lay'; o.to=i;
  }else if(key.k==='rom'){
    /* Not a letter and never one: what it types is the character on it. */
    o={k:'rom', t:key.v};
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
/* ---- typing one thing and writing another --------------------------------
   「qwertyでうって変換する中国語のピン音スタイルもあるやん？」

   An alphabet needs no conversion: press a and your a goes in, which is what
   kbFixed() already is. What needs it is a writing system where the unit you
   TYPE and the unit you WRITE are different -- a syllabary where `ka` is one
   letter, an abugida where it is a base and a mark, a logography where it is
   a word. wsys() already answers which, so nothing new decides it and there
   is no setting.

   The same table serves the other two. On an alphabet the keys stay the
   person's own letters and the bar offers the words that begin the way they
   started, which is a spelling check made of the same parts. One bar, two
   fillings, and no second thing to keep in step. */

/* Faces with no repeats, and the number each letter sits at.

   The number is the whole point. The same letter is in dozens of words, and
   a shape written out again in each of them is 4.4 MB where this is 195 KB --
   measured on a syllabary of 180 letters and a dictionary of 5000. An
   extension is given a few dozen megabytes and killed for asking for more.

   It does not break the rule that says put it ON rather than point at it.
   What that forbids is handing over an id only the app can resolve -- a
   LETTERS id means nothing on the other side. These numbers resolve inside
   the file, against something the reader was handed in the same breath. */
function shareTable(){
  var ink=[], at={};
  return {ink:ink, of:function(id){
    if(!Object.prototype.hasOwnProperty.call(at, id)){
      if(!ltById(id)) return -1;
      at[id]=ink.length;
      ink.push(shareFace(id));
    }
    return at[id];
  }};
}
/* First in wins, and letters go in before words, so a word can never take a
   key a letter answers to. */
function sharePut(map, key, ix){
  var k=String(key||'').toLowerCase();
  if(!k || !ix.length) return;
  if(Object.prototype.hasOwnProperty.call(map, k)) return;
  map[k]=ix;
}
/* Every way a letter can be typed. ltCodes() is the alphabet's own answer --
   the name somebody chose and everything the letter reads, in both cases --
   and asking it rather than working it out again is why a letter renamed is
   typeable under the new name the same second.

   Plus what its KEY types, which is not always among them. numbers.js empties
   a letter's readings when it gives it a value, so ltCodes() has nothing to
   say about a digit at all, and a digit would have been the one letter on the
   keyboard that the bar could never offer. kbTyped() is what the key puts in;
   a person typing that back is asking for that letter.

   The ink slot is asked for LAST. Asking first reserved a shape for every
   letter whether or not any key could reach it, so a blank letter and every
   digit left a drawing in the table that nothing pointed at -- which is the
   one thing the table exists to avoid. tools/conv-check.mjs found this the
   first time it ran; the comment above shareTable() had been claiming the
   opposite. */
function shareMapLts(t, map){
  var i, l, cs, j, c, keys, ix;
  for(i=0;i<LETTERS.length;i++){
    l=LETTERS[i];
    cs=ltCodes(l).concat([kbTyped(l.id)]);
    keys=[];
    for(j=0;j<cs.length;j++){
      c=String(cs[j]||'').toLowerCase();
      if(c && keys.indexOf(c)<0) keys.push(c);
    }
    if(!keys.length) continue;
    ix=t.of(l.id);
    if(ix<0) continue;
    for(j=0;j<keys.length;j++) sharePut(map, keys[j], [ix]);
  }
}
/* And every word, under its own spelling -- which is already roman, because
   a word IS its letters and a letter's name is what it is typed as. spOf()
   is the spelling and spWord() is that spelling as text; neither is worked
   out here. */
function shareMapWords(t, map){
  var i, sp, j, ok, ix;
  for(i=0;i<WORDS.length;i++){
    sp=spOf(WORDS[i]);
    if(!sp.length) continue;
    /* Every letter checked before any slot is asked for. Reserving as we went
       left the shapes of a dropped word's letters behind in the table -- the
       same mistake as above, and the same reason: t.of() both looks up and
       creates, so asking it a question is not free. */
    ok=true;
    for(j=0;j<sp.length;j++) if(!sp[j].l || !ltById(sp[j].l)) ok=false;
    if(!ok) continue;
    ix=[];
    for(j=0;j<sp.length;j++) ix.push(t.of(sp[j].l));
    sharePut(map, spWord(sp), ix);
  }
}
/* Null when there is nothing to offer, so the keyboard shows no bar at all
   rather than an empty one. */
function shareConv(t){
  var map={}, k, max=0;
  shareMapLts(t, map);
  shareMapWords(t, map);
  for(k in map) if(Object.prototype.hasOwnProperty.call(map, k) && k.length>max) max=k.length;
  return max? {how:wsys(), max:max, map:map} : null;
}
/* Whether the keys are roman. A syllabary is spelled in roman and converted;
   an alphabet is typed in its own letters and only suggested at. */
function shareRoman(){
  var w=wsys();
  return w==='syll' || w==='abugida' || w==='logo';
}
/* The face you spell on. Not the person's letters -- the q of QWERTY, there
   to spell with, and what it spells is looked up rather than inserted. It is
   the FIRST face, because somebody who made a syllabary types on this one
   almost always and should not have to cross to it every time.

   KB_QWERTY is keyboard.js's, so the roman rows and the free plan's rows are
   one layout rather than two that agree today. */
function shareRomLay(){
  var rows=[], i, j, r, row, sp;
  for(i=0;i<KB_QWERTY.length;i++){
    r=KB_QWERTY[i]; row=[];
    for(j=0;j<r.length;j++) row.push(shareKey(kbRom(r.charAt(j))));
    if(i===KB_QWERTY.length-1) row.push({k:'del', w:1});
    rows.push(row);
  }
  sp={k:'sp', w:3};
  rows.push([{k:'lay', to:1, w:1}, sp, {k:'del', w:1}]);
  return {rows:rows};
}

/* The whole of it: this language's keyboard, drawn, with nothing in it that
   points at anything back here. */
function shareKbd(){
  var b=kbOf(), lay=[], i, t=shareTable(), conv=shareConv(t), out;
  if(conv && shareRoman()) lay.push(shareRomLay());
  for(i=0;i<b.lay.length;i++) lay.push({rows:shareRows(b.lay[i])});
  out={v:1, lang:langId, name:langName, box:SHARE_BOX, lay:lay};
  /* How tall the keys are, as a multiplier of whatever the extension's own
     row height is. A point is a different size on an SE and a Pro Max, and
     what somebody chose here is how big a key FEELS. Absent means 1, which is
     the keyboard every board written before this had. */
  if(kbHOf(b.h)!==1) out.h=kbHOf(b.h);
  /* Whether a key wears the letter it types, small in its corner. The
     extension has always been handed `t` on every letter key; this says
     whether to draw it. */
  out.mark=kbRomOn()? 1 : 0;
  if(conv){ out.ink=t.ink; out.conv=conv; }
  return out;
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
  return scriptSig()+'|'+langId+'|'+(can('kb')? 'p':'f')+'|'+
         (kbRomOn()? 'm':'-')+'|'+JSON.stringify(KB);
}
/* Whether there is a native side at all, and the one way to reach it.

   NOT Capacitor.Plugins.LinguaShare, and NOT Capacitor.registerPlugin. Both
   were tried and both were wrong for the same reason, which took four builds
   to see: those are put on window.Capacitor by @capacitor/core, an npm
   package that an app with a bundler imports. There is no bundler here.
   index.html loads plain script tags and has never loaded @capacitor/core,
   so what window.Capacitor holds is only what the native bridge injects --
   toNative, nativePromise, nativeCallback, isPluginAvailable, and no way to
   register or look up a plugin by name.

   nativePromise IS that bridge, and asking it is the whole of the protocol:
   a plugin name, a method name, and the arguments. It resolves and rejects
   like anything else.

   isPluginAvailable reads cap.Plugins, which @capacitor/core fills and
   nothing here does, so it answers false for every plugin and cannot be
   asked. Whether the native side is there is therefore learned the only way
   left -- by calling it and seeing what comes back. */
function sharePlug(){
  return (window.Capacitor && Capacitor.nativePromise)? Capacitor.nativePromise : null;
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
  if(!p){ SHARE.how='no bridge'; return; }
  SHARE.how='sent';
  p('LinguaShare', 'write', {json:out, font:SFONT.b64||''})['catch'](function(e){
    SHARE.how='refused: '+((e && (e.message||e.errorMessage))? (e.message||e.errorMessage) : e);
  });
}
