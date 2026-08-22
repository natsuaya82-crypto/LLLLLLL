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
/* WHAT A KEY PUTS IN THE DOCUMENT.
   ------------------------------------------------------------------
   A private use code point, and not the letter's name.

   The name was what went out, so the Lingua keyboard typed `a` -- the same
   character the phone's own QWERTY types. Nothing downstream could tell the
   two apart, and `.tfont` (LinguaType, which carries only the private use
   area) has no glyph at `a`, so the letter fell through to the ordinary font
   and came out roman. The second face was built, installed, and never once
   used through the keyboard it was built for. 「システムキーボードで打った
   ものが勝手に自作文字になるのはおかしい」 is the rule it exists to keep,
   and typing the name is that rule not working at all.

   The code point is glyph.js's to say -- ltPua(i) over the drawn letters in
   the alphabet's order, which is the order installTypeFont() mapped them in.
   Reading the same list is the whole of the correctness here: an index off by
   one types a letter and draws a different one, and nothing throws.

   The list is ltPuaOrder(), in glyph.js, and it is the only one: this asked
   it separately once, which is one more answer than a question with one
   answer should have. */
function sharePua(id){
  var lts=ltPuaOrder(), i;
  for(i=0;i<lts.length;i++) if(lts[i].id===id) return ltPua(i);
  return '';
}
/* What the extension puts on a key face, by the same three-way rule ltInk()
   follows here: the shape if there is one, else the character it borrows,
   else nothing and the key wears its own name. Absent rather than null, so
   the file is a keyboard rather than a column of nulls. */
function shareFace(id){
  var l=ltById(id), o={t:sharePua(id)||kbTyped(id)}, ink, a;
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
    /* What the KEY types, when the key says. kbFix() used to put the a-z
       character that found the letter here, which meant the free QWERTY typed
       roman while a keyboard somebody built typed the private use area --
       the same feature working on one plan and not the other, split by
       nothing. It puts the code point there now, so this override and the
       line above answer the same way. */
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
   to spell with, and what it spells is looked up rather than inserted.

   It is the LAST face. It used to be the first, on the argument that somebody
   who made a syllabary types on it almost always -- and what that produced,
   on the phone, was a keyboard whose first page was a plain roman QWERTY.
   Somebody who has drawn an alphabet and switched their keyboard to it opens
   Messages and finds q w e r t y. 「1ページ目これになるのやめてくれない？
   1ページ目が自作のキーボードなんだから」

   The argument was about keystrokes and the answer is about what the thing
   IS. The first page of somebody's keyboard is their keyboard.

   `to` on the key that reaches it is worked out by shareKbd(), because where
   this face lands depends on how many the person built.

   KB_QWERTY is keyboard.js's, so the roman rows and the free plan's rows are
   one layout rather than two that agree today. */
function shareRomLay(back){
  var rows=[], i, j, r, row, sp;
  for(i=0;i<KB_QWERTY.length;i++){
    r=KB_QWERTY[i]; row=[];
    for(j=0;j<r.length;j++) row.push(shareKey(kbRom(r.charAt(j))));
    if(i===KB_QWERTY.length-1) row.push({k:'del', w:1});
    rows.push(row);
  }
  sp={k:'sp', w:3};
  rows.push([{k:'lay', to:back, w:1}, sp, {k:'del', w:1}]);
  return {rows:rows};
}

/* The whole of it: this language's keyboard, drawn, with nothing in it that
   points at anything back here. */
function shareKbd(){
  var b=kbOf(), lay=[], i, t=shareTable(), conv=shareConv(t), out;
  for(i=0;i<b.lay.length;i++) lay.push({rows:shareRows(b.lay[i])});
  /* And the roman face after them, with a key on the person's FIRST face to
     reach it -- otherwise a writing system that needs conversion would have a
     face nothing goes to. The key wears the number, because a roman face is
     not one of the person's letters and has none to wear.

     NOT ON THE FREE QWERTY. Board 0 is kbFixed() itself -- the keyboard both
     plans type on, the one nobody may edit -- and this was reaching into its
     bottom row and adding a key to a page the person never made. A keyboard
     with no editor grew a second face out of a setting somewhere else.
     「無料で作ったキーボードは動かせなくしろって言ってんだろ？」
     「2ページ目設定してねえのに2が出てくんだよ」

     So the conversion face is only ever added to a keyboard somebody BUILT.
     Applying the free QWERTY on a syllabary means typing on the free QWERTY,
     which is what applying it says. */
  var rom=-1;
  if(conv && shareRoman() && !kbIsFree(kbApplied(kbBoards().length))){
    lay.push(shareRomLay(0));
    rom=lay.length-1;
    if(lay[0] && lay[0].rows.length)
      lay[0].rows[lay[0].rows.length-1].unshift({k:'lay', to:rom, w:1});
  }
  out={v:1, lang:langId, name:langName, box:SHARE_BOX, lay:lay};
  /* WHICH face is the roman one, and it has to be said rather than worked
     out on the other side. The extension asked `how` -- what the writing
     system is -- and a writing system does not type: a FACE does. So every
     face of a syllabary, an abugida or a logography held its text back and
     looked its keys up as if they were a roman spelling. Pressing one of the
     person's own letters put nothing in the document and offered the one word
     it begins; pressing a second put nothing in either and offered nothing at
     all, because two letter names in a row are not a spelling of anything.
     「キーボード押しても自作文字でないキーあるし、出ても2文字目打ったら変換
     全部消える」 Where the roman face lands depends on how many faces the
     person built, so this is the only place that knows. */
  if(rom>=0) out.rom=rom;
  /* How tall a key is is NOT sent, and there is no setting for it any more.
     It was a multiplier on the extension's own row height, and nothing capped
     what the two of them came to: ten rows at 1.5 is 810 points of keyboard
     on a phone 852 points tall, so the app being typed into is pushed off the
     screen. 「高さやめて、フリックなら日本語のサイズ、qwartyなら無料版のサイズ
     くらいまでにしないとキツくない？」

     A row is one height now -- the height the free QWERTY and a Japanese kana
     keyboard are both already drawn at -- and the extension caps the total
     against the screen, so a keyboard somebody built ten rows deep is squeezed
     rather than swallowing the phone. `h` stays on the stored board, unread:
     nothing anybody set is thrown away. */
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
  /* The base is in here and the digits are not, because a digit IS a letter
     and scriptSig() already walks every one of them -- drawing one, naming
     one or giving one a value all move it. What it cannot see is the base
     going 12 -> 10 with every digit already drawn: no letter changes, and
     the widget would go on counting in twelve. */
  return scriptSig()+'|'+langId+'|'+(can('kb')? 'p':'f')+'|'+
         (kbRomOn()? 'm':'-')+'|'+numBase()+'|'+JSON.stringify(KB);
}
/* ---- what the widgets read ---------------------------------------------
   A second file in the same App Group, and a second program after the
   keyboard: a clock and a date, on the home screen, in the person's own
   digits.

   Its own file rather than a corner of keyboard.json. The keyboard's file is
   a keyboard -- a layout, faces, a conversion table -- and none of that is
   what a clock needs; it needs ten shapes and a base. Putting the two in one
   file would mean a widget that has to decode a keyboard to find out what a
   3 looks like, and a name on disk that stops being true the day somebody
   reads it.

   Keyed by value and not a list, so a language missing a digit has a hole
   rather than a shift: no zero means no "0" key, and the widget falls back
   to a roman 0 in that one position instead of drawing every number wrong.
   The comment on shareFace() asks for absent rather than null and this is
   the same rule one level up. */
function shareNums(){
  var out={}, b=numBase(), v, l;
  for(v=0;v<b;v++){
    l=numByVal(v);
    /* ltHasShape and not numBlank. Blank asks "has anybody touched this
       slot", which is the right question for the base taking a digit away
       and the wrong one here: a digit somebody NAMED but never drew has been
       touched and still has nothing to put on a clock face. The widget wants
       the same answer numFace() wants -- is there a sign to show -- so it
       asks with the same predicate. */
    if(ltHasShape(l)) out[String(v)]=shareFace(l.id);
  }
  return out;
}
function shareWidget(){
  return {v:1, box:SHARE_BOX, base:numBase(), lang:langId, name:langName,
          dg:shareNums()};
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
  var sig=shareSig(), out=JSON.stringify(shareKbd()), p=sharePlug(),
      num=JSON.stringify(shareWidget());
  if(sig===SHARE.sent) return;
  SHARE.sent=sig;
  if(!p){ SHARE.how='no bridge'; return; }
  SHARE.how='sent';
  p('LinguaShare', 'write', {json:out, font:SFONT.b64||'', num:num})['catch'](function(e){
    SHARE.how='refused: '+((e && (e.message||e.errorMessage))? (e.message||e.errorMessage) : e);
  });
}
