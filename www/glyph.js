/* Lingua — drawing your own letters, building a real font from them on the
   device, and the boot lines that start the app
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   13.5 The writing system — draw your own letters, then type in them

   The whole feature in one sentence: you draw a letter by placing points in a
   square, the app turns every letter you have drawn into a real OpenType font
   on the device, and one switch changes what the screen shows. What gets
   STORED never changes: a word is roman letters in WORDS, before and after.

   That is why there is no transliteration layer here, no second text buffer
   and no keyboard extension. Each glyph is keyed to the romanisation's own
   codepoint — the glyph you drew for "k" lives at U+006B — so showing your
   script is nothing but a font-family, and search, sort, CSV and copy/paste
   all keep working on the same ASCII they always did. A digraph that is one
   letter of your script ("sh") is one glyph with no codepoint of its own,
   reached by an OpenType ligature: you type s then h, exactly as you speak it.

   The geometry: one letter is one square cell (advance = the 800 square), so
   the spacing between letters is even by construction the way kana are, and
   there is no spacing solver anywhere in the app. The pen is a fixed 60 units
   and there is no thickness control — a script whose letters are different
   weights is not a script. Both of those are measured decisions, not taste;
   tools/font-spike/README.md is the evidence.

   Every stroke is a convex nib swept along a polyline, which is the convex
   hull of the nib at both ends — so every contour is a convex polygon, which
   is what makes a hand-written font writer small enough to ship. It is
   www/otf5.js, loaded just before this file.
   ========================================================================= */


/* The pen. Fixed, everywhere, forever. See the font-spike README's v5 section.
   60 stays 60 even though the lattice got finer. "Half the lattice step" looked
   like the rule, because 60 was half of the old 7-dot step of 120, but half a step
   is only the width at which two strokes on ADJACENT dots still leave white between
   them — and only a character as dense as 鬱 ever puts two strokes one dot apart.
   The price of obeying it everywhere is weight, and weight is the thing a reader
   sees: measured at 14px against Noto Sans CJK JP through the same rasteriser
   (tools/pen-pick.mjs), pen 36 inks 10% of the cell where the real font inks 19%,
   and pen 60 inks exactly the real font's 19%. A third of the ink is a visibly
   paler page; two strokes welding is one dot's worth of redrawing. */
/* And then thinner again. 32 against a step of 36 is a pen very nearly as wide
   as the gap between two dots: a letter drawn carefully on the lattice comes
   out as one welded mass with the dots it was built on invisible under it.
   「ペン太すぎて細かい今の点に合わないでズレる」 24 is two thirds of a step,
   and the page is darker than half a step would leave it. Half a step was
   tried and looked right in a picture; what a phone shows is the thing to
   look at. 「24にしよう」

   24 is also the CEILING, and that is a limit rather than a preference. Two
   strokes on ADJACENT dots are one step apart, and what a wider pen does to
   them is not weight -- it is a different letter: two strokes go in and one
   comes out. Measured through the real drawing code at the size a post is
   read at, 44px on a 3x phone (tools/pen-gap.mjs), 24 leaves white between
   them and 28, 32 and 40 leave none. "Then draw them two dots apart" is not
   an answer, because a letter with two dots between its strokes is a
   different letter.
   「2あけだとだって書いた文字と別のもんができちゃうくない？」「24が限界やね」

   The same sentence is why there is no second, thinner pen for the editor's
   canvas. A wide pen buries the lattice under your finger, and a thinner one
   there was tried for exactly that; but a canvas drawn with a different pen
   from the font is this bug said backwards -- what is under your finger is
   then not what comes out. One pen, everywhere. */
var GPEN={width:24, angleDeg:0, contrast:1.0, curve:36};

/* Points land on a lattice, never wherever the finger stopped.
   A free point means the crossbar of one letter sits at 401 and the crossbar of
   the next at 396, and the alphabet reads as shaky rather than as a system —
   and a thumb on a phone cannot do better than about 40px anyway.
   N is 11 rather than 7 because 7 cannot hold a dense character at all: the top of
   鬱 is three components side by side and needs nine columns before it is anything
   but a blot. tools/lattice-truth.mjs drives real font glyphs through thinning and
   onto each candidate lattice, then measures how much of the original letter
   survives the snap: 31% at 7, 38% at 9, 46% at 10, 50% at 11, 55% at 13.
   11 and not 10 because an EVEN dot count has no centre dot — at 10 the lattice is
   40,120,…,760 and 400 is not on it, so a stem cannot be drawn down the middle of
   the cell. 11 and not 13 because the dots have to be hit with a thumb: on a 320px
   editor 11 dots are 29px apart and 13 are 24px, against Apple's 44px minimum, so
   the editor square wants to be as large as the screen allows either way.
   INSET is 40 because ink reaches half a pen beyond the outermost point, so 40
   keeps every stroke inside the 800 cell with 10 units to spare at pen 60, and
   800-2*40 = 720 divides evenly by 4, 6, 9 and 10, so the dots stay integers at
   5, 7, 10 and 11. */
var GGRID={n:21, inset:40};
/* A stroke drawn in one go can be long, but not unbounded. It used to stop
   at 24, and past that the drag stopped adding points and only dragged the
   last one about -- which is why a long stroke cut off halfway through. The
   thinning afterwards is what decides how many points a shape really keeps,
   so this only has to be higher than any real stroke. */
var GE_MAXPTS=160;
function geStep(){ return (800 - GGRID.inset*2) / (GGRID.n - 1); }
/* What stands at each end of a letter, so the gap between any two of them is
   twice this whatever the two are.

   It was half a step, and a step used to be 72. Then the lattice doubled --
   twenty-one dots instead of eleven, so a curve has somewhere to bend -- and
   the gap came down with it: words closed up and became hard to read for a
   reason that had nothing to do with what anybody had drawn. A whole step of
   the finer lattice is the gap the coarse one had, and the letters stand
   apart the way they did before.
   「一点開けてるのを2にできる？つまりすぎて見づらい」 */
function geSide(){ return geStep(); }
/* Where the ink can reach, in font space, which is y-up from the baseline.
   A stroke on the top row of dots puts ink half a pen above that row; one on
   the bottom row half a pen below. Nothing goes further, because nothing can
   be drawn off the lattice.

   The line box is those two plus one step, by the rule that puts one step
   between two letters side by side -- so the gap above a line and the gap
   beside a letter are the same number, and neither is a screen's to decide. */
function geInkTop(){ return Math.round(800 - (GGRID.inset - GPEN.width/2)); }
function geInkSpan(){ return Math.round(geStep()*(GGRID.n-1) + GPEN.width); }
function geSnap(v){
  var s=geStep(), i=Math.round((v - GGRID.inset) / s);
  if(i<0) i=0; if(i>GGRID.n-1) i=GGRID.n-1;
  return Math.round(GGRID.inset + i*s);
}

/* An undrawn letter is not left to fall back to a system font — that would be
   a silent lie about which letters you have made. It gets this instead: an
   empty cell with its corners marked, drawn by the same pen as everything
   else, so it reads as "this square is waiting" rather than as a letter. */
var GPLACE=[
  {pts:[[112,256],[112,112],[256,112]]},
  {pts:[[544,112],[688,112],[688,256]]},
  {pts:[[688,544],[688,688],[544,688]]},
  {pts:[[256,688],[112,688],[112,544]]}
];

/* A glyph name may only be letters, digits and a few punctuation marks, and a
   sound is any symbol on the IPA chart -- so anything that is not a plain
   Latin letter is named by its code point. A symbol written with more than one
   code unit (a letter and a diacritic under it) cannot have a code point of
   its own at all, so it becomes a ligature of its parts, exactly the way the
   old two-letter digraphs did. */
function glyphCode(c){ return 'u'+('000'+c.charCodeAt(0).toString(16)).slice(-4); }
function glyphKey(r){
  var out=[], i, c;
  for(i=0;i<r.length;i++){
    c=r.charAt(i);
    out.push(/[A-Za-z]/.test(c) ? c : glyphCode(c));
  }
  return out.join('_');
}

/* What the script has to cover is not always the sounds. It is whatever the
   chosen kind of writing has letters for -- sounds, syllables, consonants
   alone, or whole words -- and www/wsys.js is the one place that knows which.
   Everything below simply asks it. */
function scriptLetters(){ return wsUnits(); }

/* ---- what a letter's ink IS ---------------------------------------------
   Two kinds, and a letter has one of them and never both. A letter drawn in
   the app is STROKES -- a centre line for the pen to sweep. A letter drawn
   somewhere else and handed back on a sheet is a SHAPE -- rings of outline,
   ink already, in the same 800 square.
   「今の点線をなぞるのは make、書いて入れるのは write っていう違いがある」

   One value, and inkDef() is what says which it is, so a letter brought in
   goes down the road a drawn one already takes: the font, the typing face, a
   key, a tile, the card, a line of ink. No `sh` is a drawn letter, so not one
   letter that exists today moves and there is nothing to migrate.

   A stroke is an object with pts on it and a ring is a plain array of points,
   so nothing has to be stored to tell the two apart. */
function inkGeo(l){
  if(!l) return null;
  if(l.sh && l.sh.length) return l.sh;
  return (l.st && l.st.length)? l.st : null;
}
/* ---- an area is the inside of a RING, and a ring gets drawn a side at a time
   On a lattice nobody draws a square in one sweep: they draw the top, then
   the right, then the bottom, then the left, and the fill button stays on
   for all four. So four strokes come out of the editor each carrying the
   fill flag, and the editor paints all four green -- it says, plainly, that
   there is an area there.

   Downstream did not agree. `glyphContours` cuts the inside of each stroke's
   OWN ring into triangles, and a two-point ring has no inside, so every one
   of the four asked for a fill and got nothing. Nothing threw; the letter
   came back with a green line right round it and white in the middle.
   「塗りも囲いにしてるのに塗られないけど？」 OWNER 2026-08-27 -- and the
   photograph had five dots, four corners and one part-way down the right
   side where two strokes met.

   So the pieces are read as the one line they make, here, before anything
   downstream sees them: strokes that were marked as area and that end where
   the next one begins are the same line, and it is filled as one.

   Three things it is careful not to do:

   - It only ever joins strokes the person marked. A stroke that shares a
     corner with an area but was not marked is a line that happens to touch
     it, and stays one.
   - It does not invent a bend. A point where two strokes met was the END of
     a stroke, and an end never bends -- so the seam is stripped of its curve
     flag as the two are put together. Each piece keeps its own curvature and
     gains none. (Rule 16 is about ROUND, but the thing it forbids is this:
     a stroke coming back bent that was not drawn bent.)
   - It leaves a stroke that is already a ring of its own alone -- one that
     was closed, or that ROUND made a circle of. Those already fill.

   What it DOES change, deliberately: the joins stop being notched. Four
   separate bars leave the outside of each corner unfilled, and one line
   through the same points fills it with the hull of the two ends. A filled
   square with four nicks out of its corners is not a shape anybody drew, and
   `tools/fill-check.mjs` asks for the two to be the same ink to the pixel. */
function inkJoinable(s){
  return !!(s && s.fill && s.pts && s.pts.length>1 && !s.closed && !s.k);
}
function inkSamePt(a,b){ return !!(a && b && a[0]===b[0] && a[1]===b[1]); }
/* a copy with the curve flag off, for a point that is about to stop being an end */
function inkHard(p){ return [p[0], p[1]]; }
function inkJoinFills(v){
  var i, j, used=[], any=false;
  for(i=0;i<v.length;i++){ used.push(false); if(inkJoinable(v[i])) any=true; }
  if(!any) return v;
  var out=[], grew=false;
  for(i=0;i<v.length;i++){
    if(used[i]) continue;
    if(!inkJoinable(v[i])){ out.push(v[i]); used[i]=true; continue; }
    /* the chain this stroke is part of, walked both ways from it. A stroke
       may be joined either end first and either way round -- which end the
       finger started at is not a fact about the shape. */
    var pts=[], k;
    for(k=0;k<v[i].pts.length;k++) pts.push(v[i].pts[k]);
    used[i]=true;
    var went=true;
    while(went){
      went=false;
      for(j=0;j<v.length;j++){
        if(used[j] || !inkJoinable(v[j])) continue;
        var q=v[j].pts, a=q[0], z=q[q.length-1],
            head=pts[0], tail=pts[pts.length-1], m, add=null, atEnd=true;
        if(inkSamePt(tail,a)){ add=q; }
        else if(inkSamePt(tail,z)){ add=q.slice().reverse(); }
        else if(inkSamePt(head,z)){ add=q; atEnd=false; }
        else if(inkSamePt(head,a)){ add=q.slice().reverse(); atEnd=false; }
        if(!add) continue;
        used[j]=true; went=true; grew=true;
        if(atEnd){
          /* the shared point is now in the middle of a line, so it is held
             hard: it was two ends and neither of them bent */
          pts[pts.length-1]=inkHard(pts[pts.length-1]);
          for(m=1;m<add.length;m++) pts.push(add[m]);
        }else{
          pts[0]=inkHard(pts[0]);
          for(m=add.length-2;m>=0;m--) pts.unshift(add[m]);
        }
      }
    }
    /* back where it started: drop the repeat and say so, which is exactly
       the stroke somebody would have got by drawing the ring in one go */
    var shut=false;
    if(pts.length>2 && inkSamePt(pts[0], pts[pts.length-1])){
      pts.pop(); shut=true;
      pts[0]=inkHard(pts[0]);
    }
    if(pts.length===v[i].pts.length && !shut){ out.push(v[i]); continue; }
    var one={pts:pts, fill:true};
    if(shut) one.closed=true;
    out.push(one);
  }
  return grew? out : v;
}
function inkDef(v){
  if(v && v.length && v[0] && v[0].pts===undefined) return {sh:v};
  return {strokes: (v && v.length)? inkJoinFills(v) : v};
}

/* ---- what the font is made of ------------------------------------------
   One list, and it is the letters. A glyph belongs to a letter, and the two
   ways in to it -- what the letter is called, and what it reads -- are both
   just code points on that one glyph.

   It was three lists, grown one at a time. The units the writing system needs
   (wsUnits, which only ever answers in sounds); the marks, added separately
   because a letter reading `?` is not a sound and wsUnits could never name
   one; and the names, which arrived last and as a patch -- scriptNameCodes
   walked LETTERS to find what the letter behind each unit was called, and
   took only a name one character long. Three lists is three answers to "what
   letters do I have", and they did not agree. A letter with no reading at all
   was in none of them, so somebody drawing their own A B C D with nothing to
   say about sound got a font with nothing in it.
   「音をそれぞれ分けて作れるようにしろってずっと言ってるのにこいつ音から作る」

   So a letter that has been drawn is a glyph, and that is the list. What is
   left for the writing system to say is the thing that is genuinely not a
   letter: a syllable an abugida composes out of a base and a vowel mark,
   which nobody drew as one shape.

   A name or a reading longer than one character has no code point of its own,
   so it is reached by an OpenType ligature over the characters it is spelled
   with -- you type the parts and the font draws the one letter. That is how
   "ka" becomes a single syllabary letter and how a whole word becomes a
   logograph. Longer ligatures are offered first, so ka.i does not beat kai.

   A letter nobody has drawn gets NO glyph, so the browser falls through to
   the serif underneath and writes it in roman. A half-drawn script shows the
   half that exists and the rest legibly, which is the only useful thing to do
   while a script is being drawn -- and it is being drawn for a long time. It
   used to get GPLACE instead, and a font built from three letters out of
   eleven put a dashed box where the other eight belonged. 「なんで、1単語に1文字
   用の四角が出てくるの？」

   The one placeholder left is a ligature's components: an OpenType rule can
   only fire over glyphs that exist, so if `ka` is drawn and `k` alone is not
   -- which is normal in a syllabary, where k alone is not a letter -- k needs
   a glyph for the rule to be written against. Those get GPLACE, and only
   those. */
function glyphName(id){ return 'lt_'+String(id).replace(/[^A-Za-z0-9_]/g, ''); }
function scriptGlyphDefs(){
  var defs=[], ligs=[], holds={}, taken={}, long=[], i;
  /* One sign: a shape, and every character that types it. Whoever claims a
     character keeps it -- and the letters are walked in the order they are
     held in, which is the order ltMain answers in, so the letter the alphabet
     says owns a reading is the letter the font gives it to and the red line
     on the letter that lost is telling the truth.

     `holds` is which glyph a character ended up on, which is not knowable
     until every letter has had its turn -- so the ligatures are only written
     down here and resolved below. */
  function sign(key, ink, codes){
    var one='', j, c, d;
    for(j=0;j<codes.length;j++){
      c=codes[j];
      if(taken[c]) continue;
      taken[c]=1;
      if(c.length===1){ one+=c; holds[c]=key; continue; }
      long.push({txt:c, by:key});
    }
    d=inkDef(ink);
    d.name=key; d.roman=one||null;
    defs.push(d);
  }
  for(i=0;i<LETTERS.length;i++)
    if(inkGeo(LETTERS[i]))
      sign(glyphName(LETTERS[i].id), inkGeo(LETTERS[i]), ltCodes(LETTERS[i]));
  /* And what the writing system needs that nobody drew as one shape. */
  scriptLetters().forEach(function(r){
    if(inkGeo(ltMain(r))) return;             /* somebody made it: it is above */
    var st=wsStrokes(r);
    if(!st || !st.length) return;
    sign(glyphKey(r), st, ltCodes({ab:'', snd:[r]}));
  });
  /* Now the long ones. A ligature fires over glyphs, not over characters, so
     each character has to be told which glyph carries it -- and one that no
     letter carries needs a glyph of its own for the rule to be written
     against, even where the script never shows it alone. */
  var said={};
  long.forEach(function(L){
    var sub=L.txt.split('').map(function(c){
      if(!holds[c]){
        /* both cases onto the one box, the same rule a drawn letter follows */
        var lo=c.toLowerCase(), up=c.toUpperCase(), on='';
        holds[c]=glyphKey(c);
        [lo, up].forEach(function(x){
          if(x && !holds[x] && on.indexOf(x)<0){ holds[x]=holds[c]; on+=x; }
        });
        if(on.indexOf(c)<0) on+=c;
        defs.push({name:holds[c], roman:on, strokes:GPLACE});
      }
      return holds[c];
    });
    /* ka and KA are two strings and one rule, because one glyph carries both
       cases of a letter. Saying it twice is saying it twice. */
    var say=sub.join(',')+'>'+L.by;
    if(said[say]) return;
    said[say]=1;
    ligs.push({sub:sub, by:L.by, n:sub.length});
  });
  ligs.sort(function(a,b){ return b.n-a.n; });
  return {defs:defs, ligs:ligs};
}

/* Build the font and hand it to the browser as a @font-face. This runs on the
   device, in about a millisecond, and touches no network. */
/* `b64` is the same font as a file rather than as a @font-face -- the system
   keyboard is a separate program and cannot be handed a stylesheet, so it is
   given the bytes. Kept here rather than rebuilt in www/share.js, because
   rebuilding means writing out the pen, the side and the two heights a second
   time, and the day one of them changes the keyboard's letters would quietly
   stop matching the app's. */
/* What the font somebody drew is called. Said once here because it is said
   twice below -- to the OTF writer, which stamps it into the file, and to the
   @font-face rule that installs it -- and a third time in index.html, as
   --face-script, which is what every .sfont element actually asks for. Those
   three have to be the same string or the drawn letters silently stop
   appearing: the font builds, the rule installs, and nothing matches it.
   tools/face-check.mjs holds this one against the stylesheet. */
var SFONT_FAMILY='LinguaScript';
var SFONT={built:false, sig:null, b64:''};
/* The typing face. No `b64`: it never leaves this phone -- what the system
   keyboard is handed is the shapes, not a font file. */
var TFONT={built:false};
/* What the font is made of, in one string. The alphabet grows on its own as
   the dictionary does, so a word written today can need a letter the font was
   not built with — this is how the page notices without rebuilding on every
   render. Building costs about a millisecond, so it is cheap to be right. */
function scriptSig(){
  var s=[wsys()], i, l;
  /* The letters, which is what the font is made of -- so a shape drawn, a
     letter renamed and a reading changed each rebuild it, and nothing else
     does. This used to walk the units instead, and had to walk the marks
     afterwards because they were never among them. */
  for(i=0;i<LETTERS.length;i++){
    l=LETTERS[i];
    s.push(l.id+':'+(l.ab||'')+':'+ltUnits(l).join('')+':'+
           (l.st? JSON.stringify(l.st).length : 0)+':'+
           (l.sh? JSON.stringify(l.sh).length : 0));
  }
  /* and what the writing system composes, which is not any letter */
  scriptLetters().forEach(function(r){
    var g=wsStrokes(r);
    s.push(r+':'+(g? JSON.stringify(g).length : 0));
  });
  return s.join(',');
}
/* The same shapes, mapped somewhere nobody types by accident.
   ------------------------------------------------------------------
   `LinguaScript` puts a drawn letter at its own roman code point, so a
   letter called `a` IS the character `a`. That is right for a headword --
   the word is stored in roman and has to come out in the letters somebody
   drew -- and wrong for a field: a sentence typed on the phone's own QWERTY
   came out in the drawn letters too, because the app cannot tell one
   keyboard's `a` from another's. 「Linguaキーボードで打ったやつだけ自作
   文字に、それ以外はその言語の文字表示にして欲しいんだけど」

   So there is a second face over the same glyphs, mapped into the private
   use area instead. The Lingua keyboard inserts those code points; nothing
   else on a phone does. A field set in it draws what that keyboard typed and
   falls through to the ordinary font for everything else -- roman, kana,
   anything -- because this face simply has no glyph there. No conversion, no
   remembering which keyboard was up: the characters are different characters.

   U+E000 upward, one per drawn letter, in the alphabet's own order. 6,400 of
   them in this plane and it is not a shared register -- every language starts
   at E000 in its own font -- so nobody's letters take anybody else's room. */
var PUA0=0xE000;
/* WHICH letters are in the typing face, and in what order.
   ------------------------------------------------------------------
   The one place that answers it. Four places were asking it separately --
   installTypeFont built the face from this list, puaRoman read a code point
   back out of it, postCutTyped cut a post's ink with it, and sharePua told
   the keyboard what to type -- and all four had the expression written out.

   Four copies of a rule is four chances for one of them to drift, and the
   drift here is silent in the worst way: the index IS the code point, so a
   list that answers differently by one makes a key type one letter and the
   font draw another. The font renders, the key looks right, and the document
   holds somebody else's letter. Nothing throws.

   conv-check's eighth claim holds this: it reads what the font writer was
   actually handed and asks, per letter, that the key agrees. */
function ltPuaOrder(){
  return ltOrder(LETTERS.filter(function(l){ return !!inkGeo(l); }));
}
function ltPua(i){ return String.fromCharCode(PUA0+i); }
/* Back to roman. The private use area is what the Lingua keyboard types INTO
   a field and it goes no further: everything downstream of the field -- the
   gloss under the composer, findWord, the spelling engine, what is stored,
   what a post carries -- works on the roman spelling and always has. A code
   point nobody else's font has would be a square box on somebody else's
   phone; the roman is readable there.

   The order is the alphabet's, which is the order installTypeFont mapped
   them in, so the two cannot disagree: they read the same list. */
function puaRoman(txt){
  var s=String(txt||''), out='', i, c, at,
      lts=ltPuaOrder();
  for(i=0;i<s.length;i++){
    c=s.charCodeAt(i);
    at=c-PUA0;
    if(at>=0 && at<lts.length) out+=(ltName(lts[at])||'');
    else out+=s.charAt(i);
  }
  return out;
}
function installTypeFont(){
  var el=document.getElementById('tfontcss');
  if(el) el.parentNode.removeChild(el);
  TFONT.built=false;
  try{
    var lts=ltPuaOrder(), defs=[], i;
    for(i=0;i<lts.length;i++){
      var d=inkDef(inkGeo(lts[i]));
      d.name=glyphName(lts[i].id); d.roman=ltPua(i);
      defs.push(d);
    }
    if(!defs.length) return;
    var f=LinguaFont.build(defs, {mode:'center', pen:GPEN, side:geSide(),
                       asc:geInkTop(), desc:geInkTop()-geInkSpan()-geStep(),
                                   family:'LinguaType', style:'Regular'});
    el=document.createElement('style');
    el.id='tfontcss';
    el.appendChild(document.createTextNode(
      "@font-face{font-family:'LinguaType';src:url("+f.dataUrl()+") format('opentype');}"));
    document.head.appendChild(el);
    TFONT.built=true;
  }catch(e){ TFONT.built=false; }
}
function installScriptFont(){
  var el=document.getElementById('sfontcss');
  if(el) el.parentNode.removeChild(el);
  SFONT.built=false;
  SFONT.b64='';
  SFONT.sig=scriptSig();
  try{
    var d=scriptGlyphDefs();
    /* Nothing drawn is not an empty font, it is no font: an @font-face with
       no glyphs in it makes every word fall through to the serif anyway, one
       exception deeper. */
    if(!d.defs.length) return;
    var f=LinguaFont.build(d.defs, {mode:'center', pen:GPEN, side:geSide(),
                       asc:geInkTop(), desc:geInkTop()-geInkSpan()-geStep(), ligatures:d.ligs,
                                    family:SFONT_FAMILY, style:'Regular'});
    el=document.createElement('style');
    el.id='sfontcss';
    el.appendChild(document.createTextNode(
      "@font-face{font-family:'"+SFONT_FAMILY+"';src:url("+f.dataUrl()+") format('opentype');}"));
    document.head.appendChild(el);
    SFONT.b64=f.base64();
    SFONT.built=true;
  }catch(e){ SFONT.built=false; SFONT.b64=''; }
  /* The typing face is built from the same letters and at the same time, so
     the two can never be out of step with each other. */
  installTypeFont();
}
/* Two ways to see your language in its own writing exist side by side: letters
   you borrowed from an existing script, which change the text itself, and
   letters you drew, which change only the face the same text is set in. This
   one is the drawn one, so it is named for the font and not for the script. */
function myFontOn(){ return !!SET.myfont && SFONT.built; }
function setMyFont(v){
  SET.myfont=!!v;
  if(SET.myfont && !SFONT.built) installScriptFont();
  save(); render();
}

/* ---- the letter grid ----------------------------------------------------
   There was a chapter here called Letters, showing every sound of the language
   as a tile with whatever had been drawn for it. The sounds screen shows
   exactly that now, above the chart, so being in two places to give a sound a
   letter is over. What is left is the editor those tiles open. */
/* ---- the editor --------------------------------------------------------- */
/* GE is the letter being drawn. st is the same stroke list the font writer
   eats, so what you see on the canvas and what ends up in the font are the
   same numbers going through the same code — not two drawings that agree. */
var GE=null;
/* The editor is opened on a LETTER, not on a sound. It used to be opened on
   a sound and to write its result into SCRIPT.g under that sound, which is
   exactly the assumption 「音に対して文字入れるのおかしくね？」 objects to. GE.lid
   is which letter; GE.r is only what to call it on screen. */
function newGE(lid, label){
  var l=ltById(lid), src=(l && l.st)? l.st : [];
  var r=label || ltName(l) || '';
  /* A letter opened for editing is finished work, the same as a drawing
     handed back by undo, so it opens sealed: the first press starts a new
     stroke instead of picking up the last one you drew last time. Only what
     is drawn in this sitting, before the finger comes up, can be grabbed. */
  return { lid:lid, r:r, st:JSON.parse(JSON.stringify(src)),
           si:src.length?src.length-1:-1, pi:-1, undo:[], redo:[], pre:null,
           drag:false, hit:false, again:false, moved:false, fresh:false,
           free:false, round:false, fill:false, flat:null, flatBy:'',
           raw:null, rawFor:-1, z:1, cx:400, cy:400,
           seal:!!(src.length && src[src.length-1].pts.length) };
}
/* From the sound chapter: draw the letter this unit is written with, making
   one if it has none.

   Both roads into the drawing surface ask makeNeed() first: writing a letter
   is the first of the four things that need a name on the account. The
   surface is not opened and nothing is made -- editGlyph() would otherwise
   have made a letter for the unit on the way past. */
function editGlyph(unit){
  if(!makeNeed()) return;
  var l=ltForUnit(unit);
  GE=newGE(l.id, unit); go('glyph', l.id);
}
/* From the letters chapter: draw this letter, whatever it reads. */
function editLetter(id){
  if(!makeNeed()) return;
  var l=ltById(id); if(!l) return;
  GE=newGE(id, ltName(l)); go('glyph', id);
}
/* A letter with nothing on it yet -- 「文字から作るだろ普通」 */
/* The + on a list makes that list's kind: on the digits page a new sign is a
   digit, and it takes the smallest value nothing has yet. */
/* Three lists and one way in. The + on the alphabet, the + on the marks and
   the + on the digits each made a sign that was nothing and put a blank
   canvas in front of it, so WHAT it was got decided afterwards, on a
   different screen, or never. 「文字を追加押したら、アルファベット選べて、そこ
   から文字を追加するようにしてくれ。記号も数字も一緒。ここは一本化して」

   It opens the letter's own page instead, which is already the one place
   that asks -- one box, red when it collides, and ltSetRoman reads all
   three kinds out of it: roman is a sound, a bare number is a digit's
   value, anything else reads itself and is a mark. Say what it is, then
   draw it. Nothing here has to know which of the three lists it came from
   beyond the value a digit starts with. */
/* 「+文字の追加」 at the foot of the alphabet, the digits and the marks. */
function newLetter(kind){
  /* The ceiling, met on the press. 「+を押したらそのまま課金のポップが出る
     だけでしょ？」 OWNER 2026-09-01 -- the button is drawn on every plan. */
  if(upStop(can('letters'))) return;

  if(!makeNeed()) return;
  var v=(kind==='num')? numFree() : -1;
  var l=ltNew(v>=0? {val:v} : {});
  go('letter', l.id);
}
/* ---- the step back, and the step forward again --------------------------
   Every change stamps a copy of the whole letter — it is a few hundred bytes,
   so there is no reason to be clever about it.

   THE SAME SHAPE AS THE KEYBOARD'S, because 「進むはキーボードと同じで！」
   OWNER 2026-08-27 and that sentence is the specification. `www/keyboard.js`
   § kbNoted/kbStep is the original: two stacks, what comes off one goes onto
   the other, and a NEW change empties the forward one. There is one
   difference in the bookkeeping and it is not a difference in behaviour: the
   keyboard has to keep `KBU.cur` as a string because kbNoted() is called
   after the change, from saveKb(); here every change is stamped BEFORE it
   happens, so the live GE.st is always the current state and there is
   nothing to keep beside it.

   ONE PLACE pushes -- gePush() -- rather than the two that used to. geMark()
   is one road in and the end of a gesture in geUp() is the other, and both
   have to empty the forward stack: a step forward that survives a new stroke
   would put back a drawing that was never in front of this one. The two
   pushed and capped the stack in two copies of the same three lines, and a
   third road added tomorrow would have been a third. */
var GE_STEPS=60;
function gePush(str){
  if(!GE) return;
  GE.undo.push(str);
  if(GE.undo.length>GE_STEPS) GE.undo.shift();
  /* Drawing something new is where you are now, so there is no longer a
     forward. Exactly kbNoted()'s `KBU.r=[]`. */
  GE.redo=[];
}
function geMark(){
  if(!GE) return;
  gePush(JSON.stringify(GE.st));
}
/* ---- the toolbar ---------------------------------------------------------
   Two marks, because two is what a hand actually makes: a stroke and a ring.
   Everything else that used to sit here was a mechanic pretending to be a
   tool — closing a contour, deleting a point — and each of those is now the
   canvas answering a tap instead of a word asking to be understood. One
   24-unit box each, stroked not filled, so each takes the button's own colour
   and goes gold with it. The mark is the whole of the button -- there is no
   word under it. 「2は文字なくそう」 */
var GICON={
  /* Each mark is the thing it does. Bowed line through a dot that sits on it;
     one arrow turning back on itself; a ring drawn in dots, which is the shape
     of something that is no longer there. */
  'circle': '<path d="M4.5 17.5Q12 3.5 19.5 17.5"/><circle cx="12" cy="10.5" r="1.6"/>',
  /* The inside of a shape being blackened, which is the whole of what it
     does. Stroked like the rest of them, so it goes gold with them. */
  'fill'  : '<path d="M12 4.4 20 19.6H4z"/><path d="M7.4 16.4h9.2M9.2 13h5.6M10.6 9.6h2.8"/>',
  'undo'  : '<path d="M4.5 9.5h10a5 5 0 0 1 0 10h-6"/><path d="M8 5.5 4 9.5l4 4"/>',
  /* The same curve turned back the other way -- what every program that has
     ever had these two has drawn, and what ICON_REDO already draws on the
     sheet that builds a keyboard. 「進むはキーボードと同じで！」 */
  'redo'  : '<path d="M19.5 9.5h-10a5 5 0 0 0 0 10h6"/><path d="M16 5.5l4 4-4 4"/>',
  'clear' : '<circle cx="12" cy="12" r="7.5" stroke-dasharray="2.2 2.8"/>'
};
/* Drawn, not typed. A glyph borrowed from the emoji block is somebody else's
   drawing: it arrives at whatever weight and colour the system feels like,
   which is never the weight of every other line in this app. */
/* The mark on a locked row was a dingbat typed into the HTML, which is the
   same borrowing as an emoji: it arrives at the font's weight, not the app's.
   Drawn instead, in the stroke weight every other line here uses. */
/* Every back button spelled its arrow with U+2190, which is a character in
   whatever font happens to answer, at whatever weight that font draws it.
   The arrow is part of the button, not part of the sentence, so it moved out
   of the ten translations and into one mark drawn like every other. */
/* A speaker, and it is the only mark in the app for sound. It was a
   triangle, which is the mark for a RECORDING -- press it and something
   starts, press it again and it stops -- and eleven of the twelve places it
   was drawn are not a recording at all: they are the app saying a word out
   loud from the sounds its letters carry. 「再生ボタンやめて全部スピーカー
   ボタンに統一しよ」 The voice on a post is the twelfth and is sound too, so
   it wears the same mark rather than being the one exception nobody would
   read as an exception. */
var ICON_SPK='<svg class="ic" viewBox="0 0 24 24" width="15" height="15" fill="none" '+
  'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" '+
  'aria-hidden="true"><path d="M4 9.5h3.2L12 5.4v13.2L7.2 14.5H4Z"/>'+
  '<path d="M15.6 9.2a4 4 0 0 1 0 5.6"/><path d="M18.2 6.6a7.6 7.6 0 0 1 0 10.8"/></svg>';
var ICON_BACK='<svg class="ic" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" '+
  'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M20 12H4.6"/><path d="M10.5 5.5 4 12l6.5 6.5"/></svg>';
/* The return key's arrow, the one every phone keyboard draws: down the right,
   left along the bottom, and a head on the end of it. */
var ICON_RET='<svg class="ic" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" '+
  'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M20 5.5v6.5H6"/><path d="M10.5 7.5 5.5 12l5 4.5"/></svg>';
var ICON_PEN='<svg class="ic" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" '+
  'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M4 20h4L19.2 8.8a2 2 0 0 0-2.8-2.8L5 17.2V20Z"/><path d="M15.2 7.2 18 10"/></svg>';
var ICON_PLUS='<svg class="ic" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" '+
  'stroke-width="1.5" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M12 3.4c.9 4.6 4.1 7.8 8.6 8.6-4.5.9-7.7 4.1-8.6 8.6-.9-4.5-4.1-7.7-8.6-8.6 4.5-.8 7.7-4 8.6-8.6Z"/></svg>';
/* A minus, plain, for taking a photograph or a recording off a post. The
   plus that used to be beside it was the one button that stood for the
   camera, the library and the microphone all at once, and there are three
   buttons now. */
var ICON_MINUS='<svg class="ic" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" '+
  'stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"/></svg>';
/* Back one step and forward one again, on the sheet that builds a keyboard.
   A curve with an arrow on it, which is what every program that has ever had
   these two has drawn. 「巻き戻しボタンと進むボタンも入れよう」 */
var ICON_UNDO='<svg class="ic" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" '+
  'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M4 8h9a6 6 0 0 1 0 12H8"/><path d="M8 4 4 8l4 4"/></svg>';
var ICON_REDO='<svg class="ic" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" '+
  'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M20 8h-9a6 6 0 0 0 0 12h5"/><path d="M16 4l4 4-4 4"/></svg>';
/* Where the slack in a row goes: to the right of the keys, to both sides of
   them, or to their left. Three bars in a box, the way every program that has
   ever had these three has drawn them. */
var ICON_ALL='<svg class="ic" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" '+
  'stroke-width="1.8" stroke-linecap="round" aria-hidden="true">'+
  '<path d="M4 6h16"/><path d="M4 12h9"/><path d="M4 18h13"/></svg>';
var ICON_ALC='<svg class="ic" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" '+
  'stroke-width="1.8" stroke-linecap="round" aria-hidden="true">'+
  '<path d="M4 6h16"/><path d="M7.5 12h9"/><path d="M5.5 18h13"/></svg>';
var ICON_ALR='<svg class="ic" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" '+
  'stroke-width="1.8" stroke-linecap="round" aria-hidden="true">'+
  '<path d="M4 6h16"/><path d="M11 12h9"/><path d="M7 18h13"/></svg>';
/* A row going in above the one selected, and below it: an arrow into a line.
   Not a plain arrow -- what these two answer is WHICH SIDE of the line the new
   row lands on, so the line is the half that has to be drawn. */
var ICON_INUP='<svg class="ic" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" '+
  'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M4 19h16"/><path d="M12 15V5"/><path d="M8 9l4-4 4 4"/></svg>';
var ICON_INDN='<svg class="ic" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" '+
  'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M4 5h16"/><path d="M12 9v10"/><path d="M8 15l4 4 4-4"/></svg>';
/* And taking the selected row or column away. A bin rather than a ⊖: this one
   is not a mark on the thing it removes, it is a button in a row of buttons,
   and it needs to say which of them is the dangerous one. */
var ICON_BIN='<svg class="ic" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" '+
  'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M4 7h16"/><path d="M9 7V4.6h6V7"/>'+
  '<path d="M6.5 7l.9 12.2a1.4 1.4 0 0 0 1.4 1.2h6.4a1.4 1.4 0 0 0 1.4-1.2L17.5 7"/>'+
  '<path d="M10 11v6"/><path d="M14 11v6"/></svg>';
/* The two tools the photograph editor has, as marks rather than words: a
   round button with an icon in it is what every phone puts over a picture,
   and a pill with a word in it is what a settings screen puts under one. */
var ICON_CROP='<svg class="ic" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" '+
  'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M6.5 2v13.5H20"/><path d="M2 6.5h13.5V20"/></svg>';
/* A letter of somebody's own, as a shape on a tile -- not an A, because the
   whole point of the tool is that the letters are not roman. */
var ICON_LTR='<svg class="ic" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" '+
  'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 16 12 7l4 9"/>'+
  '<path d="M9.6 13h4.8"/></svg>';
/* A keyboard: the outline and three rows of keys, with the space bar under
   them. Drawn rather than borrowed because nothing in this app had one --
   the keyboard chapter is reached by a row of words, and the tab bar's mark
   for the making side is a stack of pages. */
var ICON_KEYS='<svg class="ic" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" '+
  'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<rect x="2.5" y="5.5" width="19" height="13" rx="2"/>'+
  '<path d="M6 9h.01M9.5 9h.01M13 9h.01M16.5 9h.01"/>'+
  '<path d="M6 12.2h.01M9.5 12.2h.01M13 12.2h.01M16.5 12.2h.01"/>'+
  '<path d="M8 15.4h8"/></svg>';
var ICON_GEAR='<svg class="ic" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" '+
  'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/>'+
  '<path d="M12 5V3.2M12 19v1.8M19 12h1.8M3.2 12H5'+
  'M16.95 7.05l1.27-1.27M5.78 18.22l1.27-1.27M16.95 16.95l1.27 1.27M5.78 5.78 7.05 7.05"/></svg>';
/* The last of the borrowed marks. A tick, a lens, a turning arrow, a cross and
   the small chevron that ends a row were all characters typed into the HTML --
   drawn by whichever font answered, at whatever weight it felt like. Every one
   of them is a line now, in the weight the rest of the app is drawn in. */
var ICON_TICK='<svg class="ic" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" '+
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/></svg>';
/* CHOSEN. A ring with the middle filled -- ◉ -- and it stands at the FRONT of
   a row rather than a tick at the end. 「選択た時ケツにチェックじゃなくて前に
   ◉が入るようにして欲しい」 OWNER 2026-09-01. The ring is drawn on every row
   while a list is being chosen from, so the column is there to slide a thumb
   down; the middle is what says this one is in. */
var ICON_RING='<svg class="ic" viewBox="0 0 24 24" width="19" height="19" fill="none" '+
  'stroke="currentColor" stroke-width="1.5" aria-hidden="true">'+
  '<circle cx="12" cy="12" r="9"/></svg>';
var ICON_DOT='<svg class="ic" viewBox="0 0 24 24" width="19" height="19" fill="none" '+
  'stroke="currentColor" stroke-width="1.5" aria-hidden="true">'+
  '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.6" fill="currentColor" '+
  'stroke="none"/></svg>';
var ICON_LENS='<svg class="ic" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" '+
  'stroke-width="1.6" stroke-linecap="round" aria-hidden="true">'+
  '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l4.5 4.5"/></svg>';
var ICON_CROSS='<svg class="ic" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" '+
  'stroke-width="1.9" stroke-linecap="round" aria-hidden="true">'+
  '<path d="M6 6l12 12M18 6 6 18"/></svg>';
var ICON_GO='<svg class="ic go" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" '+
  'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M9 5l7 7-7 7"/></svg>';
/* The three tabs. Drawn, like everything else: a stack of pages being made,
   a lens, and a door. */
/* One per tab, keyed by its route. The house is the timeline because that is
   what "home" means to somebody arriving from any other social app; the
   language's own cover moved under the person. */
var TAB_ICON={
  feed:'<svg class="tic" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" '+
    'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
    '<path d="M4 10.5 12 4l8 6.5V20H4Z"/><path d="M9.5 20v-6h5v6"/></svg>',
  explore:'<svg class="tic" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" '+
    'stroke-width="1.5" stroke-linecap="round" aria-hidden="true">'+
    '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4 20 20"/></svg>',
  notif:'<svg class="tic" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" '+
    'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
    '<path d="M6 9a6 6 0 0 1 12 0c0 4 1.3 5.5 2 6.2H4c.7-.7 2-2.2 2-6.2Z"/>'+
    '<path d="M10 18.5a2 2 0 0 0 4 0"/></svg>',
  build:'<svg class="tic" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" '+
    'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
    '<path d="M4 6.5 12 3l8 3.5-8 3.5Z"/><path d="M4 12l8 3.5 8-3.5"/><path d="M4 17.5 12 21l8-3.5"/></svg>',
  profile:'<svg class="tic" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" '+
    'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
    '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5"/></svg>'
};
/* Two links of a chain: joining a letter to a sound, or a sound to a letter.
   The same mark from both ends, because it is the same join. */
/* Four arrows, for nudging a vowel mark one lattice step at a time. */
var ICON_ARR_L='<svg class="ic" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" '+
  'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 5l-7 7 7 7"/></svg>';
var ICON_ARR_R='<svg class="ic" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" '+
  'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 5l7 7-7 7"/></svg>';
var ICON_ARR_U='<svg class="ic" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" '+
  'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 14l7-7 7 7"/></svg>';
var ICON_ARR_D='<svg class="ic" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" '+
  'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 10l7 7 7-7"/></svg>';
var ICON_LINK='<svg class="ic" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" '+
  'stroke-width="1.6" stroke-linecap="round" aria-hidden="true">'+
  '<path d="M10 13.8a3.6 3.6 0 0 0 5.1 0l2.9-2.9a3.6 3.6 0 0 0-5.1-5.1l-1.3 1.3"/>'+
  '<path d="M14 10.2a3.6 3.6 0 0 0-5.1 0L6 13.1a3.6 3.6 0 0 0 5.1 5.1l1.3-1.3"/></svg>';
/* An actual plus, and it is what every button that ADDS one of something
   wears. ICON_PLUS above is a four-pointed star: it marks what the paid plan
   adds, and putting it on "one more consonant" would say the sound costs
   money. The rules chapter wore the star on three buttons that only ever made
   a word out of a word. 「基本追加は＋じゃないの？」「プラス統一したい」 */
var ICON_ADD='<svg class="ic" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" '+
  'stroke-width="1.7" stroke-linecap="round" aria-hidden="true">'+
  '<path d="M12 5v14M5 12h14"/></svg>';
/* Two arrows facing opposite ways: the order the list is in, and that there
   is another one. */
var ICON_SORT='<svg class="ic" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" '+
  'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M7 4v16M7 4 4 7.5M7 4l3 3.5"/><path d="M17 20V4M17 20l3-3.5M17 20l-3-3.5"/></svg>';
/* A page with a line of writing on it: a sentence this word is used in. */
var ICON_LINE='<svg class="ic" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" '+
  'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M4 6h16M4 11h16M4 16h9"/></svg>';
/* The row under a post. A speech bubble, two arrows going round, a heart and
   a way out -- the four everybody's thumb already knows where to find. */
var ICON_REPLY='<svg class="ic" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" '+
  'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M20.5 11.5a7.5 7.5 0 0 1-10.9 6.7L4 19.5l1.4-4.6A7.5 7.5 0 1 1 20.5 11.5Z"/></svg>';
var ICON_BOOST='<svg class="ic" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" '+
  'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M4 8.5h11.5a3 3 0 0 1 3 3V13"/><path d="M7 5.5 4 8.5l3 3"/>'+
  '<path d="M20 15.5H8.5a3 3 0 0 1-3-3V11"/><path d="m17 18.5 3-3-3-3"/></svg>';
var ICON_HEART='<svg class="ic" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" '+
  'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M12 20.2 4.9 13.4a4.4 4.4 0 0 1 6.2-6.2l.9.9.9-.9a4.4 4.4 0 1 1 6.2 6.2Z"/></svg>';
/* An actual plus. ICON_PLUS is a four-pointed star -- it means "make me one"
   where the app is asking a model for something, which is not what the button
   that opens a blank page means. */
var ICON_ADD2='<svg class="ic" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" '+
  'stroke-width="2" stroke-linecap="round" aria-hidden="true">'+
  '<path d="M12 5v14M5 12h14"/></svg>';
var ICON_DOTS='<svg class="ic" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" '+
  'aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/>'+
  '<circle cx="19" cy="12" r="1.7"/></svg>';
/* share: the box a thing leaves by, with the thing going up out of it. What
   leaves is the card -- a post, a word or an example as one picture -- which
   is the only way anything in this app gets out of the phone at all.
   A framed rectangle stood on the word page and the example rows, and it said
   nothing: 「その、謎の四角の右上のマーク何？」「それは共有マークにしてよわかりに
   くい」. A card is not a thing anybody wants; getting the thing out is. */
var ICON_SHARE='<svg class="ic" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" '+
  'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M12 15V3"/><path d="M8.5 6.5 12 3l3.5 3.5"/>'+
  '<path d="M20 13v6.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5V13"/></svg>';
/* What a post can be given: the camera, the pictures already on the phone,
   and the microphone. One plus used to stand for all three and only ever
   meant the second. 「photoボタンやめて。📷 ライブラリ マイクボタンにして」 */
var ICON_CAM='<svg class="ic" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" '+
  'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/>'+
  '<circle cx="12" cy="13" r="3.4"/></svg>';
var ICON_LIB='<svg class="ic" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" '+
  'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<rect x="7" y="3" width="14" height="14" rx="2"/>'+
  '<path d="m10 12 2.5-3 3 3.5 2-2L21 14"/>'+
  '<path d="M17 21H5a2 2 0 0 1-2-2V7"/></svg>';
/* A draft: a sheet with its corner turned. It sits in the row the camera, the
   library and the microphone are in, and those are marks -- a word among them
   is a word that has to be read while everything beside it is looked at.
   「下書きマーク作ったのにないけど？文字で書けなんか言ってねえよ」OWNER
   2026-08-26. How many there are goes BESIDE it, because a count is a state
   and not an explanation; what the press does is on the button as its label. */
var ICON_DRAFT='<svg class="ic" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" '+
  'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>'+
  '<path d="M14 3v5h5"/></svg>';
var ICON_MIC='<svg class="ic" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" '+
  'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<rect x="9" y="3" width="6" height="11" rx="3"/>'+
  '<path d="M5.5 12a6.5 6.5 0 0 0 13 0"/><path d="M12 18.5V21"/></svg>';
/* What money buys that anybody can SEE. The four-pointed star is already this
   app's own mark -- ICON_PLUS above, the avatar on the cover -- so the badge
   is that star rather than a tick borrowed from a bird.

   ONE mark, filled, and it is gold: it says the person is on Pro.
   「企業バッジ一旦廃止して、青バッジをそのまま金にして欲しい。プロプラン」
   OWNER 2026-09-01. There were two -- blue for somebody who pays, gold for an
   official account -- and the official one had nowhere on the server to come
   from, so a rule nothing ever wore sat in the stylesheet beside the one that
   did.

   FILLED and not drawn: at 15px a 1.7px outline is mostly the hole in the
   middle, and the colour is what the mark is for.

   No colour is written here. `currentColor` means index.html says which gold
   it is -- act-check refuses a colour written into markup and is right to. */
var MARK_PLUS='<svg class="bdg" viewBox="0 0 24 24" width="15" height="15" '+
  'fill="currentColor" stroke="none" aria-hidden="true">'+
  '<path d="M12 3.4c.9 4.6 4.1 7.8 8.6 8.6-4.5.9-7.7 4.1-8.6 8.6-.9-4.5-4.1-7.7-8.6-8.6 4.5-.8 7.7-4 8.6-8.6Z"/></svg>';
/* A post kept to yourself. 「非公開の時はポストに🔓マークつけよ」
   The shackle is DOWN. It was opened once, on the emoji in that sentence, and
   an open padlock is the mark for a thing that is not locked -- which is the
   opposite of what this says. 🔓 there was the word "lock". */
var ICON_LOCK='<svg class="ic" viewBox="0 0 24 24" width="14" height="14" fill="none" '+
  'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '+
  'stroke-linejoin="round" aria-hidden="true">'+
  '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/>'+
  '<path d="M8.2 10.5V7.6a3.8 3.8 0 0 1 7.6 0v2.9"/></svg>';
/* Not seeing somebody: a circle with a line through it, which is the mark
   every phone already uses for "no". */
var ICON_BLOCK='<svg class="ic" viewBox="0 0 24 24" width="14" height="14" fill="none" '+
  'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">'+
  '<circle cx="12" cy="12" r="8"/><path d="M6.3 6.3l11.4 11.4"/></svg>';
/* Saying something is wrong: a flag on a pole. */
var ICON_FLAG='<svg class="ic" viewBox="0 0 24 24" width="14" height="14" fill="none" '+
  'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '+
  'stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M6 21V4"/><path d="M6 4h11l-2.2 3.6L17 11H6"/></svg>';
/* pinned: a post its author put at the top of their own page */
var ICON_PIN='<svg class="ic" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" '+
  'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M9 3h6l-1 6 3 3v2H7v-2l3-3z"/><path d="M12 14v7"/></svg>';
function geIcon(n){ return '<svg viewBox="0 0 24 24" aria-hidden="true">'+GICON[n]+'</svg>'; }
function geBtn(fn,n,key,en,on){
  var lb=t(key), cl=on?'on':'', act=DO(fn), off;
  /* A button that can demonstrate itself stays tappable when it is unavailable
     — it goes dim and does nothing, but it still answers "what is this". The
     two history buttons have nothing to show, so those are plainly disabled.

     Which is the whole of the difference: how it says it is unavailable, and
     whether the demonstration is hung off the press. The button itself was
     written out twice, once on each side of that, and the two copies were
     identical.  */
  if(GE_HINT_DEMO[n]){
    if(!en) cl=cl?cl+' off':'off';
    /* the demonstration comes after, because acting redraws the view */
    act=act+AFTER('geHintShow',[n]);
    off=en? '' : ' aria-disabled="true"';
  }else{
    off=en? '' : ' disabled';
  }
  /* The mark, and nothing under it. 「2は文字なくそう」 OWNER 2026-08-27.
     The word was a caption in a font small enough to need it, and in French
     and German it did not fit -- ANNULER and ZURUCKSETZEN under a 23px icon
     came back cut off with an ellipsis, which says less than no word at all.

     The label is NOT gone. It is the aria-label, which is what a screen
     reader says and what press-check reads, and it still goes through t() in
     all ten languages -- so nothing was taken out of the translations. */
  return '<button data-g="'+n+'"'+act+off+
         (cl?' class="'+cl+'"':'')+' aria-label="'+esc(lb)+'">'+
         geIcon(n)+'</button>';
}
function vGlyph(){
  /* GE is always set by editGlyph before this is routed to; the fallback is
     for the release check, which walks every view cold. */
  if(!GE) GE=newGE('a');
  var st=GE.st[GE.si], p=(st && GE.pi>=0)? st.pts[GE.pi] : null;
  var pts=0;
  GE.st.forEach(function(s){ pts+=s.pts.length; });
  /* The square, the tools, and the shape they make. Nothing else.

     This screen used to carry what the letter is as well -- sound or mark,
     what it reads, the character it borrows, and a way to delete it -- and it
     came to 1207 px on a 844 px phone, so drawing a line meant scrolling to
     find the square again. Those four are what a letter IS, not how it is
     drawn, and vLetter is the screen about that. The canvas, the rail and the
     preview come to 844 exactly. */
  /* Save is at the top, at the far end of the bar the back arrow is on, and
     there is no Cancel anywhere. 「この画面キャンセルと保存下にあるけど保存は
     右上にしてキャンセルは消して。戻るがキャンセルだから。」 OWNER 2026-08-27.

     Two buttons at the foot said the screen had two ways out, and one of them
     was the arrow's job -- so the arrow and Cancel were the same press, drawn
     twice, in two places. What the arrow does is no longer cancelling either:
     see geLeft(). Leaving with the drawing kept is what both of them do now,
     and Save is the one that also finishes the letter and puts you back with
     the others.

     navTop's `right` is the slot for exactly this -- "one control pinned to
     the far end of the bar, the place every phone puts the thing that
     finishes what you are doing" -- and it already carries the ? on four
     screens and the AI mark on one. `navsave` is beside `navq` so that the
     bar keeps working with the CSS that is there today; the rule that makes
     it read as the primary action rather than as a muted mark is one line and
     it is `www/index.html`'s, which is not this session's to write. It is
     measured in the commit body. */
  return '<div class="view">'+
    navTop('', '<button class="navq navsave"' + DO('geSave') + '>'+
                 esc(t('glyph.save'))+'</button>')+
    /* Nothing is pinned over the foot of this screen any more, so the room
       that was left for it is not left. What is under the page is the tab
       bar, which is what .body's own padding is already about. */
    '<div class="body" style="padding-bottom:calc(env(safe-area-inset-bottom,0) + var(--tabh) + 24px)">'+
    '<div class="gcanvwrap"><canvas id="gcanv" class="gcanv"></canvas></div>'+
    /* The ? belongs to the band, not to the bar: what it explains is the five
       marks above it. 「帯の下にしよう」 OWNER 2026-08-28.
       Here and not in geRail(), because geRail() is also the onboarding's
       first step and that step is being walked, not read. */
    geRail(st, pts)+
    '<div style="display:flex">'+helpQ('glyph')+'</div>'+
    '<div class="ghintwrap"><canvas id="ghint" class="ghint"></canvas></div>'+
    '</div></div>';
}
function geCur(){
  if(GE.si<0 || !GE.st[GE.si]){ GE.st.push({pts:[]}); GE.si=GE.st.length-1; }
  return GE.st[GE.si];
}
/* A stroke is one line, or one corner. Nothing longer: past three dots there
   is nothing left to decide about it, and every extra dot is one more thing
   that has to be true at once. Full is the moment it is settled — and the
   canvas moves on by itself rather than making you say so. */
/* A shape you can carry on from has an end to carry on from. A circle and a
   joined line do not, so the next mark starts on its own. */
/* Round does not add or remove anything — it makes the line you already drew
   bow through the dots that are already on it. Two dots are the two ends of a
   circle; three are a curve that has to pass through the middle one. So you
   place the shape first and round it after, and once it is round it is
   settled: the next tap is the next stroke. */
/* Distance from a point to the line through a and b. Used to find the far
   point of a curve: the one the arc has to pass through. */
function geOff(a,b,q){
  var vx=b[0]-a[0], vy=b[1]-a[1], L=Math.sqrt(vx*vx+vy*vy);
  if(L<1e-6) return Math.sqrt((q[0]-a[0])*(q[0]-a[0])+(q[1]-a[1])*(q[1]-a[1]));
  return Math.abs(vx*(a[1]-q[1]) - vy*(a[0]-q[0]))/L;
}
/* Ramer-Douglas-Peucker. Keeps the points that carry the shape and drops the
   ones that only carry the lattice: the staircase a snapped diagonal leaves
   behind, and the handful of dots a slow finger deposits in one place. */
function geSimplify(p, tol){
  var n=p.length, i, j;
  if(n<3) return p.slice();
  var mark=[]; for(i=0;i<n;i++) mark[i]=false;
  mark[0]=true; mark[n-1]=true;
  var stack=[[0,n-1]];
  while(stack.length){
    var seg=stack.pop(), s=seg[0], e=seg[1], far=-1, fd=-1, d;
    for(j=s+1;j<e;j++){ d=geOff(p[s],p[e],p[j]); if(d>fd){ fd=d; far=j; } }
    if(far>0 && fd>tol){ mark[far]=true; stack.push([s,far]); stack.push([far,e]); }
  }
  var out=[];
  for(i=0;i<n;i++) if(mark[i]) out.push([p[i][0],p[i][1]]);
  return out;
}

/* A moving average, run a couple of times. Endpoints stay put. */
function geSmooth(p, passes){
  var q=p.slice(), i, j, out;
  for(j=0;j<passes;j++){
    out=[q[0]];
    for(i=1;i<q.length-1;i++){
      out.push([(q[i-1][0]+2*q[i][0]+q[i+1][0])/4, (q[i-1][1]+2*q[i][1]+q[i+1][1])/4]);
    }
    out.push(q[q.length-1]);
    q=out;
  }
  return q;
}

/* Both ends of a stroke go back onto the lattice so strokes can meet; every
   point between them stays where the finger put it. */
/* What a finished gesture becomes.

   The first attempt reduced a whole gesture to one arc: start, end, and the
   point furthest off the line between them. That can draw a bow and nothing
   else, and almost no letter is one bow -- the second stroke of me curves,
   loops and leaves; a has a bowl that is not a circle and a stem that is not
   a curve. One arc per gesture was the wrong unit.

   So the path is kept, not replaced. It is thinned to the points that carry
   the shape, and then each interior point is marked as a bend, which the
   font writer draws as a curve passing through it. Any number of them, in
   any direction: a half circle, an S, a bowl with a tail. A gesture that
   ends where it began closes into a ring instead, and there every point
   bends, including the one it starts on.

   Three points left after thinning is the one case worth special-casing --
   a single clean bow -- and that is what the round primitive is for, so it
   gets used: a true arc through the middle point rather than a corner
   rounded off. */
/* Every point on one line, within half a lattice step of it. A stroke like
   that has nothing to bend: ROUND leaves it exactly as it was drawn.
   「縦線はラウンド押してもラウンドになるわけがない」 Without this the ring
   guess below could take a straight stroke, keep three of its points and
   close them into a true circle -- a line drawn straight down coming back as
   a ring. 「縦線引いただけで円になるんだって」 */
function geStraight(p){
  if(p.length<3) return true;
  var a=p[0], b=p[p.length-1], vx=b[0]-a[0], vy=b[1]-a[1];
  var L=Math.sqrt(vx*vx+vy*vy), tol=geStep()*0.5, i, d;
  if(L<1e-6) return false;
  for(i=1;i<p.length-1;i++){
    d=Math.abs(vx*(a[1]-p[i][1]) - vy*(a[0]-p[i][0]))/L;
    if(d>tol) return false;
  }
  return true;
}
function geShape(st){
  /* ROUND off: the stroke IS the dots the finger went over, and nothing
     downstream gets to disagree with them.
     「点線上にそのまま引いた一筆書きが勝手に補正されるのをやめて欲しい」

     Everything below this line reads the finger's own path instead -- it is
     smoothed, thinned to four or five points, and only then put on the
     lattice. That is right for a curve and wrong for a line: smoothing pulls
     a corner inwards, the thinning then keeps a point NEAR the corner rather
     than the corner, and the snap lands it on the wrong dot. A U traced down
     column 2, along row 8 and up column 7 -- twenty dots, every one of them
     exactly where it was meant to be -- came back as (2,1) (2,7) (6,8)
     (7,1): both corners moved a dot, so one arm was short and the other
     leaned. Nothing here needed guessing at; the dots were already right.

     What is still done to them is not a correction and cannot move one: a
     point is dropped when it lies within one dot of the line it is on, and
     no point is ever moved. That is what takes the stairs off a diagonal --
     「階段になるの腹立つんよな。斜めに引きたいのに」 -- because a finger
     crossing between two dots is snapped to whichever it passed nearer, and
     those are the ones within a dot of the line. A corner is four dots off
     the line between its neighbours and survives untouched.

     Both passes are needed and they are not the same statement. geLattice
     asks of each point in turn whether its own two neighbours have it, which
     is local and gets stuck: a diagonal that jogs twice ends up with each
     jog holding the other one out. geSimplify asks it of the whole stroke at
     once, so it flattens the pair. Run alone it is the one that is not
     enough either -- it never collapses two names for one dot. */
  if(!GE.round){
    delete st.k; delete st.closed;
    st.pts=geLattice(geSimplify(st.pts, geStep()*0.9));
    return;
  }
  /* Prefer what the finger actually did. The snapped copy is a staircase
     wherever the gesture was not straight, and no amount of corner-rounding
     turns a staircase into a curve. Only the two ends go back onto the
     lattice, because that is what lets one stroke meet another. */
  /* The raw path, always -- it used to be read only when the curve tool was
     on, so an ordinary stroke was thinned from the SNAPPED copy, which is a
     staircase before the thinning ever sees it. Nothing downstream can undo
     that: the stairs are already the input. It is collected on every stroke
     either way, so this is the one condition that was keeping it unused. */
  var raw = (GE.raw && GE.rawFor===GE.si && GE.raw.length>3) ? GE.raw : null;
  var p = raw || st.pts, n = p.length;
  if(n<3){ delete st.k; delete st.closed; return; }
  /* Straight is straight, whichever button is pressed. */
  if(geStraight(p)){ delete st.k; delete st.closed; return; }
  var step=geStep(), i;
  var a=p[0], b=p[n-1];
  var span=Math.sqrt((b[0]-a[0])*(b[0]-a[0])+(b[1]-a[1])*(b[1]-a[1]));
  /* Whether the gesture came back to where it started, judged against how
     big the loop is rather than against a fixed distance. Nobody closes a
     circle exactly: a bowl drawn by hand stops twenty or thirty degrees
     short, which at this size is nearly two lattice steps of gap and read as
     an open curve under a fixed threshold. Measured against the loop's own
     span it is unambiguous -- a bowl left open by a third of a turn still
     closes, a half circle never does. */
  var lo0=p[0][0], hi0=p[0][0], lo1=p[0][1], hi1=p[0][1];
  for(i=1;i<n;i++){
    if(p[i][0]<lo0) lo0=p[i][0]; if(p[i][0]>hi0) hi0=p[i][0];
    if(p[i][1]<lo1) lo1=p[i][1]; if(p[i][1]>hi1) hi1=p[i][1];
  }
  var diag=Math.sqrt((hi0-lo0)*(hi0-lo0)+(hi1-lo1)*(hi1-lo1));
  var ring=(n>6 && span<=Math.max(step*1.2, diag*0.45));
  /* Two passes. The first is coarse enough to throw away the staircase a
     snapped diagonal leaves; if what survives is still four points or more
     the gesture really was curved, and it is thinned again from the original
     path at a finer tolerance. A bend is only rounded off by a fraction of
     its shorter arm, so widely spaced points leave straight stretches between
     the corners and a bowl comes out as a rounded box. Closer points, shorter
     arms, and the straight stretches disappear. */
  /* A hand shakes. Averaging each raw point with its neighbours takes the
     tremor out without taking the curve out, which a coarse thinning alone
     cannot do -- it would have to throw away real bends to reach the same
     smoothness. Then thin what is left. */
  if(raw) p=geSmooth(p, 2);
  var s = raw ? geSimplify(p, step*0.18) : geSimplify(p, step*0.45);
  if(!raw && s.length>=4) s=geSimplify(p, step*0.3);
  delete st.k; delete st.closed;
  /* Onto the lattice in all three branches below. It used to be possible to
     leave here with the thinned path exactly where the finger left it, so
     ROUND was the only thing that put a stroke on the dots, and a plain line
     drawn with nothing pressed passed through no dot at all.
     「点線通らなくなってる。直線も斜め線も」 The lattice is what makes one
     stroke meet another, and rounding is about what happens BETWEEN the
     points, not about where they sit. */
  /* A ring is the one shape a chain of rounded corners cannot tell: eight
     lattice points with their corners filleted still reads as an octagon,
     because a corner is only ever rounded by a fraction of its shorter arm
     and the straight run between two corners survives. Three points spread
     around the loop, closed and marked round, is a real circle through them
     -- measured at 220-230 against a drawn radius of 216, where the same
     loop kept as eight filleted corners wobbles by a tenth of its width. */
  if(ring && s.length>=3){
    st.closed=true; st.k='o';
    st.pts=geLattice([p[0].slice(0,2), p[Math.floor(n/3)].slice(0,2), p[Math.floor(2*n/3)].slice(0,2)]);
    if(st.pts.length<3){ st.pts=[p[0].slice(0,2), p[Math.floor(n/3)].slice(0,2), p[Math.floor(2*n/3)].slice(0,2)]; }
    return;
  }
  /* One clean bow, and the round primitive draws a true arc through it. */
  if(s.length===3){ st.pts=geLattice(s); st.k='o'; return; }
  /* The lattice first, the curve flags after. It was the other way round, so
     every interior point of a traced stroke was marked as a curve BEFORE the
     staircase pass ran -- and that pass will not drop a point somebody meant
     as a curve, so it dropped nothing at all and a dragged diagonal came back
     as stairs however carefully it was drawn. Flatten it, then say which of
     what is left bends. */
  var lat=geLattice(s);
  for(i=1;i<lat.length-1;i++) lat[i][2]='c';
  st.pts=lat;
}
/* Every point onto the lattice, not just the two ends.
   The old rule was that a snapped path is a staircase, so the traced shape
   was kept where the finger put it. That is true of a path snapped BEFORE it
   is thinned -- a hundred points snapped to eleven columns is a staircase.
   Thinned first, what is left is four or five points, and putting those on
   the lattice is not a staircase, it is the drawing lining up: a traced curve
   passes through the dots it was traced over instead of a hand's-width to one
   side of them. The corners between them are still rounded, so it stays a
   curve; it just stops being a wobbly one.

   Points that land on the same dot collapse into one -- two names for one
   place is not a bend. */
function geLattice(p){
  var out=[], i, x, y, last=null;
  for(i=0;i<p.length;i++){
    x=geSnap(p[i][0]); y=geSnap(p[i][1]);
    if(last && last[0]===x && last[1]===y){
      /* keep the roundness if either copy had it */
      if(p[i][2]==='c') last[2]='c';
      continue;
    }
    last = (p[i][2]==='c') ? [x,y,'c'] : [x,y];
    out.push(last);
  }
  /* A point that was straight before it was snapped, and is a bend only
     because it got rounded, is the staircase. Thinning first is not enough:
     three points along one diagonal round to three dots that are not on one
     line, and every one of those roundings is a step. 「階段になるの腹立つ
     んよな。斜めに引きたいのに」

     So a point is dropped when it sits within half a step of the line
     between its neighbours -- half a step being exactly how far rounding can
     move it. What was straight stays straight, and what was drawn as a bend
     is further out than that and survives. A point the person marked as a
     curve is theirs and is never dropped. */
  var tol=geStep()*0.9, k, a2, b2, c2, vx, vy, L, d, worst, at;
  /* Drop the flattest point, then look again, until the flattest one left is
     a real bend. One at a time and always the flattest, because a staircase
     step deviates by exactly half a lattice step and dropping the wrong one
     first turns two steps into one big kink. The tolerance is nearly a whole
     step -- that is how far rounding alone can move a point off a straight
     line -- and a bend somebody actually drew is further out than that over
     the same span, so it survives. A point marked as a curve is theirs. */
  for(;;){
    worst=tol; at=-1;
    for(k=1;k<out.length-1;k++){
      if(out[k][2]==='c') continue;
      a2=out[k-1]; b2=out[k]; c2=out[k+1];
      vx=c2[0]-a2[0]; vy=c2[1]-a2[1];
      L=Math.sqrt(vx*vx+vy*vy);
      if(L<1e-6) continue;
      d=Math.abs(vx*(a2[1]-b2[1]) - vy*(a2[0]-b2[0]))/L;
      if(d<worst){ worst=d; at=k; }
    }
    if(at<0) break;
    out.splice(at,1);
  }
  /* a shape that collapsed to one dot is not a shape */
  if(out.length<2) return p;
  /* the ends are never rounded: a corner needs something on both sides */
  if(out[0][2]) out[0]=[out[0][0], out[0][1]];
  if(out[out.length-1][2]) out[out.length-1]=[out[out.length-1][0], out[out.length-1][1]];
  return out;
}
/* Bend the stroke you have just drawn, or straighten it again.
   ROUND used to be armed BEFORE drawing: the button turned a mode on and the
   next stroke came out bent. 「線は先に引いてその後にそれをラウンドにするか
   どうか選べる仕様にしない？」 So it is a thing done to a stroke now -- draw
   it, look at it, then decide -- and a new stroke always starts straight.
   Until one has been drawn there is nothing for it to be done to, which is
   what geBendable() puts the button down for.

   Both ways, and from the same starting point every time: the stroke as it
   was drawn is kept in GE.flat, so bending is always applied to the straight
   one rather than to whatever the last press left behind. Pressing twice
   gives back exactly what was drawn, which the old one could not do -- it
   turned the mode off and left the stroke bent.

   How it bends depends on how it was made, because those are not the same
   drawing. A dragged stroke goes back through geShape, which reads the
   finger's own path where it still has it. A tapped one only has its interior
   points marked as bends: geShape would thin it, and thinning something
   somebody placed dot by dot is dropping what they placed. A stroke restored
   by undo has neither a straight copy behind it nor a raw path, so it is
   taken as it stands and treated as a tapped one -- that never drops a point.

   A straight stroke is left alone either way. 「縦線はラウンド押してもラウンド
   になるわけがない」 */
function geCircle(){
  var i=GE.st.length-1, st=GE.st[i];
  if(!st || !st.pts.length) return;
  geMark();
  if(!GE.flat){ GE.flat=JSON.stringify(st); GE.flatBy='tap'; }
  GE.round=!GE.round;
  GE.st[i]=JSON.parse(GE.flat); st=GE.st[i];
  if(GE.round){
    if(GE.flatBy==='drag' && st.pts.length>=2) geShape(st);
    else if(st.pts.length>=3 && !geStraight(st.pts)){
      delete st.k;
      for(var j=1; j<st.pts.length-1; j++) st.pts[j][2]='c';
    }
  }
  GE.pi=-1; render();
}
/* Blacken the inside of what was drawn round. A mode, like ROUND was: while
   it is on the stroke being drawn is a filled one and shows green on the
   canvas, so which of your strokes are areas is visible while you work.
   Pressing it also settles the stroke you have just drawn, which is the only
   way it could be used on a line already finished.

   Three points is the least that has an inside; below that the flag sits on
   the stroke and does nothing, because a filled line is still a line. */
function geFill(){
  geMark();
  GE.fill=!GE.fill;
  var st=GE.st[GE.st.length-1];
  if(st && st.pts.length){ if(GE.fill) st.fill=true; else delete st.fill; }
  GE.pi=-1; render();
}
/* Both steps are the same move in opposite directions, so they are one
   function told which way -- kbStep()'s own sentence. What comes off one
   stack goes onto the other, and the drawing put back is a copy, JSON out
   and JSON in, so nothing on either stack is the live object.

   It goes onto the other stack BEFORE the drawing is replaced, because the
   thing a step forward gives back is the drawing you were standing on when
   you pressed back. */
/* geHist and not geStep: geStep() is the lattice's spacing, ten lines from
   the top of this file, and a second `function geStep` would simply have
   replaced it -- every dot, every letter and every font measured off
   undefined, with nothing thrown. */
function geHist(fwd){
  if(!GE) return;
  var from=fwd? GE.redo : GE.undo, to=fwd? GE.undo : GE.redo, str;
  if(!from.length) return;
  str=from.pop();
  to.push(JSON.stringify(GE.st));
  if(to.length>GE_STEPS) to.shift();
  GE.st=JSON.parse(str);
  GE.si=GE.st.length-1; GE.pi=-1;
  /* What comes back from a step is a finished drawing, not a stroke still
     under the finger, so it is sealed like one. Left open, the last stroke's
     dots stayed live and the next press -- meant to begin a new line --
     landed on one of them and dragged the old line out of shape instead. */
  GE.seal=!!(GE.st.length && GE.st[GE.st.length-1].pts.length);
  /* What came back is a drawing, not the stroke the rail was pointing at:
     the straight copy behind it belonged to a stroke that may no longer be
     the last one. 「一つ戻るボタン押したらそれを丸められなくなるって話？」
     It can still be bent -- it is taken as it stands from here. */
  GE.round=false; GE.flat=null; GE.flatBy='';
  render();
}
function geUndo(){ geHist(false); }
function geRedo(){ geHist(true); }
function geClear(){ geMark(); GE.st=[]; GE.si=-1; GE.pi=-1; GE.seal=false;
  GE.round=false; GE.flat=null; GE.flatBy=''; render(); }
/* Putting the drawing where the letter keeps it, and nothing else -- no
   toast, no going anywhere, no saying the sound. Both ways out of this screen
   need this half and only one of them needs the rest. */
function geKeep(){
  var keep=GE.st.filter(function(s){ return s.pts.length>0; });
  ltSetStrokes(GE.lid, keep);
  /* Drawing a letter is asking for your own writing. Only onboarding ever set
     this, so every letter drawn in the letters chapter went into a font that
     nothing had been told to use -- which is 「単語に自作文字出てこない」. */
  if(keep.length) SET.myfont=true;
  save();
  installScriptFont();
  return keep;
}
/* ---- leaving the drawing screen keeps the drawing ----------------------
   「書いている途中で戻ったらそれはそこの文字として保存していちいち消える
   のやめて。」 OWNER 2026-08-27.

   It used to be thrown away. GE held every stroke until something wrote it
   down, and the only thing that did was the Save button -- so the back arrow,
   the tab bar, and anything else that moved the screen took the drawing with
   it without a word. Nothing was warned about and nothing was recoverable:
   `docs/DATA_SAFETY.md` is 「人が作ったものは消さない」 and this was the app
   quietly doing the opposite, on the one screen whose entire purpose is
   making something by hand.

   So there is no such thing as an unsaved drawing here any more. Leaving the
   screen writes what is on it to the letter it was opened for. That is the
   whole of it -- no question hanging off the arrow, because there is nothing
   to ask: nothing is being lost either way.

   Called from render(), on the one line that knows the screen changed. GE is
   already null by the time geSave() gets here, so the two never both run. */
function geLeft(from, to){
  if(from!=='glyph' || to==='glyph' || !GE) return;
  /* Opening a letter and leaving it alone is not a change to it. Without
     this, walking past this screen rewrote the letter, saved the language and
     rebuilt the whole font every time -- and rebuilding the font is not
     cheap. What is compared is what would be WRITTEN against what is already
     there, so a letter nobody drew on is left exactly as it was found,
     borrowed character and all. */
  var l=ltById(GE.lid), was=(l && l.st)? l.st : [],
      now=GE.st.filter(function(s){ return s.pts.length>0; });
  if(JSON.stringify(was)!==JSON.stringify(now)) geKeep();
  GE=null;
}
function geSave(){
  /* A dot is a mark. It used to be thrown away here on the grounds that a
     stroke with one point is a line half-drawn -- which is true of a line and
     is the app deciding that a language cannot have a dot in it. A letter that
     IS a dot, or a line with a dot beside it, could not be saved: the dot came
     back as nothing every time. 「点一つで点で。だって線にするには2で繋ぐ
     必要あるでしょ」 What is still dropped is a stroke with NO points, which
     is the empty one geCur() opens and nobody drew on.

     The pen already lays a dot down -- one point gives one square of ink, the
     nib itself -- so nothing else had to change for this to be drawable. */
  var keep=geKeep();
  var r=GE.r, l=ltById(GE.lid), snd=(l||{}).snd||[], k=ltKindOf(l);
  GE=null;
  /* Saving a letter finishes the letter, so it puts you back with the others
     rather than on the page about the one you just drew -- which is where
     back() landed, one press short of the list you came from.
     「保存したら勝手にアルファベット一覧のとこに戻って欲しいかも」

     Only when that list is the way you came in. The abugida bench opens this
     screen too, and from there the letters list is not behind you: going to
     it would be going somewhere new, with the drawing screen left in front
     of the back button. */
  if(k && navHas('ltset', k)) go('ltset', k);
  else back();
  /* The shape and the sound are the same thing seen twice. Drawing one in
     silence leaves them unconnected, so the letter says itself as it is put
     away -- and only if there is a letter, since deleting one should not. */
  if(keep.length && snd.length===1 && snd[0].length===1) sayOne(snd[0]);
  toast(t('glyph.saved', r||t('lt.untitled')));
}

/* Taking the letter off a sound entirely -- the drawing and the borrowed
   character both. The sound stays in the language; only its letter goes. */
/* Deleting the letter, shape and sounds and all. The sounds it read stay in
   the language -- they are not the letter's to take with it. */
/* ---- canvas ------------------------------------------------------------- */
/* A variable off the page, with what to use when there is none. The fallback
   is a colour by default because every caller but the card and the onboarding
   preview wants one; those two ask for a face and pass a generic family, so a
   missing variable degrades to serif instead of to the string "#888" inside a
   ctx.font. */
function cssVar(n, fb){
  return (getComputedStyle(document.documentElement).getPropertyValue(n)||'').trim()||
         (fb===undefined? '#888' : fb);
}
/* The canvas is sized in device pixels, which is something no markup can say,
   so it has to be measured after the layout exists. If it is measured before
   the layout exists the answer is zero, and a canvas sized from zero shows
   nothing at all -- no lattice, no frame, no letter. That is not reproducible
   here in any browser, and it is exactly what an unlucky phone would look
   like, so this stops trusting the first measurement: a zero is tried again on
   the next frame, and a change of size afterwards (a rotation, a keyboard
   opening, a late font) is redrawn rather than left stretched. */
var GEFIT=0;
function geMount(){
  var c=document.getElementById('gcanv');
  if(!c||!GE) return;
  var dpr=window.devicePixelRatio||1;
  var box=c.getBoundingClientRect();
  var w=box.width || c.offsetWidth || 0;
  if(!w){
    if(GEFIT<10 && window.requestAnimationFrame){
      GEFIT++; requestAnimationFrame(function(){ geMount(); });
      return;
    }
    w=300;
  }
  GEFIT=0;
  var s=Math.round(w*dpr);
  c.width=s; c.height=s;
  /* gePtDown and not geDown: those three count the fingers and hand a single
     one straight through. The drawing handlers are not told about any of it. */
  gePinReset();
  c.onpointerdown=gePtDown; c.onpointermove=gePtMove;
  c.onpointerup=gePtUp; c.onpointercancel=gePtUp;
  /* Said again in an inline style so no later rule, and no page that embeds
     this canvas somewhere new, can quietly hand these gestures back to the
     browser. */
  c.style.touchAction='none';
  c.style.webkitUserSelect='none';
  c.style.userSelect='none';
  c.style.webkitTouchCallout='none';
  geDraw();
  geWatch();
}
/* One listener for the life of the page, not one per mount. */
var GEWATCH=false;
function geWatch(){
  if(GEWATCH || !window.addEventListener) return;
  GEWATCH=true;
  var pending=false;
  function again(){
    if(pending) return;
    pending=true;
    setTimeout(function(){
      pending=false;
      var c=document.getElementById('gcanv');
      if(!c || !GE) return;
      var w=Math.round((c.getBoundingClientRect().width||0)*(window.devicePixelRatio||1));
      if(w && w!==c.width) geMount();
    }, 120);
  }
  window.addEventListener('resize', again);
  window.addEventListener('orientationchange', again);
  /* a web font arriving reflows the column the canvas sits in */
  try{ if(document.fonts && document.fonts.ready && document.fonts.ready.then) document.fonts.ready.then(again); }catch(e){}
}
/* ---- the hint ------------------------------------------------------------
   This used to be a paragraph. Nobody reads a paragraph with a thumb already
   on the canvas, and it had to be right in ten languages to be right at all.
   It is a small silent loop instead: an arrow taps three dots — one corner,
   which is all one stroke ever holds — and then taps the first dot again, and
   the shape shuts. Same lattice, same pen, same glyphContours() as the editor
   above it: a demonstration, not a picture of one. Wordless, so it says the
   same thing in every language. */
var GE_HINT={raf:0, t0:0, mode:''};
var GE_HINT_P=[[400,184],[616,544],[184,544]];
var GE_HINT_TAP=[0.9,1.7,2.5,3.5];
var GE_HINT_CYC=5.2;
/* ---- and what each button does -------------------------------------------
   A name only helps if you already know the thing it names, and both of these
   are dim until the drawing is far enough along to allow them — which is
   exactly when you most want to know. So the square below the rail answers
   instead: touch either button and it shows that button's before and after,
   drawn with the same lattice, pen and glyphContours() as the canvas above. A
   dim button still answers; it just does not act. Nothing to read, so it is
   the same answer in every language. */
var GE_HINT_DCYC=3.4;
var GE_HINT_DEMO={
  'circle': { a:[{pts:[[184,616],[400,184],[616,616]]}],
              b:[{pts:[[184,616],[400,184],[616,616]], k:'o'}], m:[400,184] },
  'fill'  : { a:[{pts:[[184,616],[400,184],[616,616],[184,616]]}],
              b:[{pts:[[184,616],[400,184],[616,616],[184,616]], fill:true}], m:[400,400] },
  'new'   : { a:[{pts:[[256,256],[256,544]]}],
              b:[{pts:[[256,256],[256,544]]},{pts:[[472,256],[616,256],[616,544]]}], m:[472,256] }
  /* 'new' is kept only so the hint reel still has its demonstration; no
     button calls it any more -- lifting the finger starts the next stroke. */
};
function geHintShow(k){
  if(!GE_HINT_DEMO[k]) return;
  GE_HINT.mode=k; GE_HINT.t0=0;
  if(!GE_HINT.raf && document.getElementById('ghint'))
    GE_HINT.raf=requestAnimationFrame(geHintTick);
}
function geHintMount(){
  var c=document.getElementById('ghint');
  if(GE_HINT.raf){ cancelAnimationFrame(GE_HINT.raf); GE_HINT.raf=0; }
  if(!c) return;
  var dpr=window.devicePixelRatio||1, box=c.getBoundingClientRect();
  var s=Math.round((box.width||190)*dpr);
  c.width=s; c.height=s;
  GE_HINT.t0=0; GE_HINT.mode='';
  GE_HINT.raf=requestAnimationFrame(geHintTick);
}
function geHintTick(ts){
  var c=document.getElementById('ghint');
  if(!c){ GE_HINT.raf=0; return; }     /* the view moved on; stop by itself */
  if(!GE_HINT.t0) GE_HINT.t0=ts;
  var t=(ts-GE_HINT.t0)/1000;
  if(GE_HINT.mode) geHintDemo(c, t%GE_HINT_DCYC, GE_HINT.mode);
  else geHintDraw(c, t%GE_HINT_CYC);
  GE_HINT.raf=requestAnimationFrame(geHintTick);
}
/* the square and its dots: a picture of the canvas above, drawn in the plain
   rule rather than the gold one so it does not read as a second canvas to tap */
function geHintField(x,S,k){
  var i,j;
  x.strokeStyle=cssVar('--line'); x.lineWidth=Math.max(1,k*2.5);
  x.strokeRect(k*10,k*10,S-k*20,S-k*20);
  var gs=geStep();
  x.fillStyle=cssVar('--line2');
  for(i=0;i<GGRID.n;i++) for(j=0;j<GGRID.n;j++){
    x.beginPath();
    x.arc(k*(GGRID.inset+i*gs), k*(GGRID.inset+j*gs), Math.max(1,k*gs*0.075),0,Math.PI*2);
    x.fill();
  }
}
/* the ink, through the font's own outliner, and the points still on top of it */
function geHintInk(x,k,strokes){
  inkStrokes(x, strokes, k, 0, 0, cssVar('--tx'));
  x.fillStyle=cssVar('--gold');
  strokes.forEach(function(s){
    s.pts.forEach(function(q){
      x.beginPath(); x.arc(q[0]*k,q[1]*k,k*16,0,Math.PI*2); x.fill();
    });
  });
}
function geHintDemo(c,t,k){
  var d=GE_HINT_DEMO[k];
  if(!d) return;
  var x=c.getContext('2d'), S=c.width, u=S/800;
  x.clearRect(0,0,S,S);
  x.globalAlpha = t>GE_HINT_DCYC-0.45 ? Math.max(0,(GE_HINT_DCYC-t)/0.45) : 1;
  geHintField(x,S,u);
  var done = t>=1.35;
  geHintInk(x,u, done ? d.b : d.a);
  /* the spot the button acts on: a ring that closes in while it is still the
     before, and opens out at the moment it becomes the after */
  var mx=d.m[0]*u, my=d.m[1]*u, was=x.globalAlpha;
  x.strokeStyle=cssVar('--gold'); x.lineWidth=u*6;
  if(!done){
    var p=(t%0.7)/0.7;
    x.globalAlpha=was*(0.15+0.55*p);
    x.beginPath(); x.arc(mx,my,u*(64-40*p),0,Math.PI*2); x.stroke();
  } else if(t<1.85){
    var q=(t-1.35)/0.5;
    x.globalAlpha=was*(1-q);
    x.beginPath(); x.arc(mx,my,u*(22+56*q),0,Math.PI*2); x.stroke();
  }
  x.globalAlpha=1;
}
function geHintEase(u){
  if(u<0) u=0; if(u>1) u=1;
  return u<0.5 ? 2*u*u : 1-2*(1-u)*(1-u);
}
function geHintSeg(t,t0,t1,a,b){
  var u=geHintEase((t-t0)/(t1-t0));
  return [a[0]+(b[0]-a[0])*u, a[1]+(b[1]-a[1])*u];
}
/* four taps round a square, then a fifth back on the dot it started from —
   which is the whole of "join", shown rather than named */
/* three dots and then back to the first one, which is the whole of "join",
   shown rather than named */
function geHintPos(t){
  var A=GE_HINT_P[0], B=GE_HINT_P[1], C=GE_HINT_P[2];
  if(t<0.9) return geHintSeg(t,0,0.9,[80,740],A);
  if(t<1.1) return A;
  if(t<1.7) return geHintSeg(t,1.1,1.7,A,B);
  if(t<1.9) return B;
  if(t<2.5) return geHintSeg(t,1.9,2.5,B,C);
  if(t<2.7) return C;
  if(t<3.5) return geHintSeg(t,2.7,3.5,C,A);
  return A;
}
function geHintDraw(c,t){
  var x=c.getContext('2d'), S=c.width, k=S/800, i, j;
  x.clearRect(0,0,S,S);
  x.globalAlpha = t>GE_HINT_CYC-0.6 ? Math.max(0,(GE_HINT_CYC-t)/0.6) : 1;

  geHintField(x,S,k);

  var n=0;
  for(i=0;i<3;i++) if(t>=GE_HINT_TAP[i]) n=i+1;
  var pts=[];
  for(i=0;i<n;i++) pts.push([GE_HINT_P[i][0],GE_HINT_P[i][1]]);
  geHintInk(x,k,[{pts:pts, closed:(t>=GE_HINT_TAP[3])}]);

  /* the tap itself: a ring that opens where the finger landed. The last one
     lands back on the first dot, and the shape shuts. */
  for(i=0;i<GE_HINT_TAP.length;i++){
    var d=t-GE_HINT_TAP[i], hp=GE_HINT_P[i===3?0:i];
    if(d<0 || d>0.45) continue;
    x.beginPath();
    x.arc(hp[0]*k, hp[1]*k, k*(16+d/0.45*46), 0, Math.PI*2);
    x.strokeStyle=cssVar('--gold'); x.lineWidth=k*5;
    var was=x.globalAlpha; x.globalAlpha=was*(1-d/0.45);
    x.stroke(); x.globalAlpha=was;
  }

  var pos=geHintPos(t), ahead=geHintPos(t+0.06), ang;
  if(ahead[0]===pos[0] && ahead[1]===pos[1]){
    var back=geHintPos(t-0.06);
    ang=Math.atan2(pos[1]-back[1], pos[0]-back[0]);
  } else ang=Math.atan2(ahead[1]-pos[1], ahead[0]-pos[0]);
  x.save();
  x.translate(pos[0]*k, pos[1]*k); x.rotate(ang);
  x.fillStyle=cssVar('--gold');
  x.beginPath();
  x.moveTo(k*52,0); x.lineTo(k*-20,k*30); x.lineTo(k*-4,0); x.lineTo(k*-20,k*-30);
  x.closePath(); x.fill();
  x.restore();
  x.globalAlpha=1;
}
/* How much of the canvas is margin at each edge, so the pen has somewhere to
   go at the outermost lattice points. Applied by geDraw, undone here. */
var GEPAD=0.055;
/* The same mapping as geAt, without the snap. A curve drawn through an 11x11
   lattice can only ever be a staircase -- every point of it lands on an
   intersection, so an arc came out as alternating one-step jogs and marking
   those corners as bends only rounded the jogs off. The lattice is what makes
   straight strokes agree with each other; a curve between two of its points
   does not have to touch it on the way. Clamped to the inset so the pen still
   has room, which is what keeps ink inside the square. */
/* Where the thumb is, in the square's own 0-800. The canvas is laid out in
   CSS pixels with a padding round it, and the drawing is not; this is the one
   place that knows the difference. Both of the two below started with the
   same four lines. */
/* ---- where the square sits inside its canvas, at whatever zoom ---------
   「文字書くページのときズームできるようにできない？じゃないと細かすぎて
   描きにくいわ。」「虫眼鏡マークタップして大きくしたり小さくしたりしたい。」
   OWNER 2026-08-27.

   The lattice is 21x21 in a square that is at most 340px wide, so the dots
   are about 17px apart and about 6px across -- against a fingertip that is
   reckoned at 44. The owner is aiming at something two and a half times
   finer than a thumb can hit, which is what 「細かすぎて」 measures out as.

   THE FORMULA IS WRITTEN ONCE. It used to be written twice -- here, undoing
   the padding to find where the thumb is, and again in geDraw() applying it
   -- and two copies of a mapping that MUST agree is exactly the place a zoom
   goes wrong: the moment they disagree by a hair the dot stops appearing
   under the finger, and it does it silently, on a device, in a way no check
   here would see. So both go through geTo/geFrom and neither knows anything
   about zoom beyond asking these.

   `z` is how much bigger, and the window on the square is the middle 800/z
   of it, clamped so it never shows past the edge.

   It is not stored. Zoom is where you are standing, not part of the letter,
   so it goes when the screen does and nothing new is written to a language.
   (`docs/DATA_MODEL.md` stays as it is.) */
function geZ(){ return (GE && GE.z)? GE.z : 1; }
/* The top-left corner of what is visible, in the square's own 0-800. */
function geOrg(){
  var z=geZ(), span=800/z, hi=800-span,
      cx=(GE && GE.cx!==undefined)? GE.cx : 400,
      cy=(GE && GE.cy!==undefined)? GE.cy : 400,
      ox=cx-span/2, oy=cy-span/2;
  if(ox<0) ox=0; if(ox>hi) ox=hi;
  if(oy<0) oy=0; if(oy>hi) oy=hi;
  return [ox, oy];
}
/* Canvas pixels per unit of the square, and the margin the pen needs at the
   outermost lattice points. geMar is the UNZOOMED one: the frame drawn round
   the canvas is the canvas's own edge, not part of the drawing, so it must
   not grow when the drawing does. */
function geMar(S){ return S*GEPAD; }
function geK0(S){ return (S-2*geMar(S))/800; }
function geK(S){ return geK0(S)*geZ(); }
/* the square's 0-800 -> a pixel on the canvas, and back. ax 0 is x, 1 is y */
function geTo(S, v, ax){ return geMar(S) + (v-geOrg()[ax])*geK(S); }
function geFrom(S, px, ax){ return (px-geMar(S))/geK(S) + geOrg()[ax]; }
function geXY(c,ev){
  var b=c.getBoundingClientRect(), w=b.width||1, h=b.height||1;
  return [geFrom(w, ev.clientX-b.left, 0), geFrom(h, ev.clientY-b.top, 1)];
}
function geAtRaw(c,ev){
  var p=geXY(c,ev), lo=GGRID.inset, hi=800-GGRID.inset;
  return [Math.max(lo,Math.min(hi,p[0])), Math.max(lo,Math.min(hi,p[1]))];
}
function geAt(c,ev){
  var p=geXY(c,ev);
  return [geSnap(p[0]), geSnap(p[1])];
}
/* Tapping is the whole language of this editor, so the two actions that used
   to be buttons are answers the canvas gives instead:
     tap the point you just placed   -> it goes away   (was "delete point")
     tap the point you started from  -> the line joins (was "join")
   Both are on the dot your thumb is already over, both are reversible by
   doing them again, and neither needs a word in ten languages. */
function geDown(ev){
  /* First, before anything else can decide this gesture is a selection or a
     zoom. Doing it at the end of the handler was too late on iOS: the browser
     had already begun its own interpretation of the touch. */
  if(ev.preventDefault) ev.preventDefault();
  var c=ev.currentTarget, p=geAt(c,ev);
  /* Both the tap and the existing points are on the lattice, so "did you mean
     this point or a new one" is an equality test, not a distance guess. No
     grab radius to tune, and no dead zone around a point where a new one
     cannot be placed. */
  /* Only the stroke still being drawn can be grabbed. Once a stroke is
     finished its dots are inert, so pressing near a letter you have already
     drawn starts the next stroke instead of quietly dragging the last one
     out of shape -- which is what a finger on a 25px lattice kept doing. */
  var best=null;
  if(!GE.seal && GE.si>=0 && GE.st[GE.si]){
    GE.st[GE.si].pts.forEach(function(q,qi){
      if(best===null && q[0]===p[0] && q[1]===p[1]) best=[GE.si,qi];
    });
  }
  GE.pre=JSON.stringify(GE.st);
  GE.moved=false;
  if(best){
    /* Whether this is a move, a deletion or a join is not decided yet: pressing
       a dot always just picks it up, and what the finger does next decides. */
    GE.again=(best[0]===GE.si && best[1]===GE.pi);
    GE.si=best[0]; GE.pi=best[1]; GE.hit=true;
  }else{
    var st=geCur();
    /* A new stroke starts where the finger lands and is joined to nothing.
       It used to begin at the end of the stroke before it, so every line
       after the first came out welded to the last whether that was wanted or
       not. Two strokes that share a dot still meet -- the drawing decides
       that, by where it is drawn, and not the editor. */
    /* A stroke ends when the finger lifts from a drag, or when the dot just
       placed is tapped again. Not at three points -- taps go on adding to the
       same curve for as long as they are wanted. */
    if(GE.seal || (st && (st.closed || st.k==='o'))){
      GE.st.push({pts:[]}); GE.si=GE.st.length-1; st=GE.st[GE.si]; GE.seal=false;
      /* ROUND is not armed for what comes next -- it is a thing done to the
         stroke you have just drawn. A new one starts straight. */
      GE.round=false; GE.flat=null; GE.flatBy='';
    }
    st.pts.push([p[0],p[1]]); GE.pi=st.pts.length-1;
    /* The stroke under the finger follows the mode both ways, so turning the
       fill off while building one takes it back off that stroke. */
    if(GE.fill) st.fill=true; else if(st.fill) delete st.fill;
    GE.again=false; GE.hit=false;
    /* A point placed on empty lattice is the start of a line if the finger
       keeps going. geMove turns it into one. Before this, pressing and
       dragging moved the point you had just put down, so a line took two
       separate taps and nobody found that out by trying. */
    GE.fresh=true; GE.free=true;
    GE.raw=[geAtRaw(c,ev)]; GE.rawFor=GE.si;
  }
  GE.drag=true;
  if(c.setPointerCapture) try{ c.setPointerCapture(ev.pointerId); }catch(e){}
  geDraw(); geTools();
}
function geMove(ev){
  /* First, unconditionally, before any of the returns below.
     This was at the foot of the function, after four early returns -- and one
     of those fires on almost every event a real finger sends. The lattice is
     about 25px apart and a fingertip travels less than that between frames,
     so most moves land on the point they are already on and returned early.
     iOS reads a move it was not asked to keep as the start of a scroll,
     cancels the pointer stream, and the stroke ends before it exists. On a
     mouse none of this happens, which is why it looked fine here and could
     not be drawn on a phone. */
  if(ev && ev.preventDefault) ev.preventDefault();
  if(!GE||!GE.drag||GE.pi<0) return;
  var c=ev.currentTarget, p=geAt(c,ev), st=GE.st[GE.si];
  if(!st) return;
  if(st.pts[GE.pi][0]===p[0] && st.pts[GE.pi][1]===p[1]) return;
  /* The finger has left the dot it just placed: that dot is the beginning of
     the line, and what is being dragged is its other end. Only once, and only
     while there is room in this stroke — after that the drag goes back to
     moving the end it is holding. */
  if(GE.free){
    /* Drawing, not nudging: the line follows the finger across the lattice and
       every new dot it reaches becomes part of the stroke. Doubling back onto
       the dot before it takes that one off again, so a wobble does not leave
       a spur behind. */
    var n=st.pts.length, prev=n>=2? st.pts[n-2] : null;
    if(prev && prev[0]===p[0] && prev[1]===p[1]){ st.pts.pop(); }
    else if(n < GE_MAXPTS){ st.pts.push([p[0],p[1]]); }
    else { st.pts[n-1][0]=p[0]; st.pts[n-1][1]=p[1]; }
    GE.pi=st.pts.length-1; GE.fresh=false; GE.moved=true;
    /* the finger's own path, kept beside the snapped one */
    if(GE.raw){
      var rp=geAtRaw(c,ev), lastr=GE.raw[GE.raw.length-1];
      if(Math.abs(rp[0]-lastr[0])+Math.abs(rp[1]-lastr[1]) > 6) GE.raw.push(rp);
    }
    geDraw();
    return;
  }
  st.pts[GE.pi][0]=p[0];
  st.pts[GE.pi][1]=p[1];
  GE.moved=true;
  geDraw();
}
/* The undo entry is stamped at the end of the gesture, not the start, and only
   if the letter actually changed. Otherwise merely choosing a point would fill
   the stack with steps that undo to the same drawing, and the one recovery the
   editor has would look broken. */
function geUp(ev){
  if(ev && ev.preventDefault) ev.preventDefault();
  if(!GE) return;
  GE.drag=false; GE.fresh=false;
  /* Lifting the finger after drawing ends that stroke. Lifting it after a
     tap does not, so points can still be placed one at a time when a shape
     wants to be exact rather than quick. */
  if(GE.free && GE.moved){
    GE.seal=true;
    var rst=GE.st[GE.si];
    if(rst){
      geShape(rst);
      /* The stroke as drawn, kept so that pressing ROUND a second time gives
         it back exactly. Only while it is straight: once bent, the straight
         one behind it is the thing being kept. */
      if(!GE.round){ GE.flat=JSON.stringify(rst); GE.flatBy='drag'; }
    }
  }
  GE.free=false;
  /* A dot that was pressed and let go without travelling is a tap, and a tap
     on a dot that is already there is one of the two answers. Dragging the
     same dot is a move — so the finger, not a mode, tells them apart. */
  if(GE.hit && !GE.moved){
    var st=GE.st[GE.si];
    if(st && GE.again){
      /* handled after this block: it finishes the stroke */
    }else if(st && GE.pi===0 && st.pts.length>2){
      if(st.closed) delete st.closed; else st.closed=true;
      GE.pi=-1;
    }
  }
  /* Tapping is the other way to build, and on a lattice this fine it is the
     easier one: two dots and a line between them, no dragging a fingertip
     along a path a quarter its width.

     Off: two taps make a straight line and that line is finished.
     On:  two taps set the ends, and a third says where the line passes --
          the arc bows through it, as deep or as shallow as it was put.

     Two taps cannot make a curve on their own. A two-point round is read as
     the ends of a circle, so it is always a half circle bowing the same way
     whichever end was tapped first -- measured, both directions, 50% of the
     chord every time. The third tap is what makes it a curve anyone chose. */
  /* Tapping builds too. Two dots are a line; a third and any after it are
     places the line has to pass through, and ROUND says whether it passes
     through them or turns at them.

     It used to bend at every one of them whatever the button said -- the
     comment above it read "Round is for the finger, not for this", which was
     a decision, and it was the wrong one: it meant nobody could tap out a
     corner. Three dots for an L came back as a bow, with the round button
     sitting there unpressed. 「ラウンドボタン押してない時も丸くなる」

     Off, the flag is taken back off, not merely left unset: round can be
     turned off part-way through a stroke, and a stroke half bent and half
     angled is not something anybody asked for. */
  if(!GE.moved && !GE.hit){
    var tst=GE.st[GE.si];
    if(tst && tst.pts.length>=3){
      delete tst.k;
      var bend=GE.round && !geStraight(tst.pts);
      for(var ti=1; ti<tst.pts.length-1; ti++){
        if(bend) tst.pts[ti][2]='c';
        else tst.pts[ti]=[tst.pts[ti][0], tst.pts[ti][1]];
      }
    }
    if(tst && tst.pts.length && !GE.round){
      GE.flat=JSON.stringify(tst); GE.flatBy='tap';
    }
  }
  /* Tapping the dot just placed says the stroke is finished. It used to
     delete that dot; undo does that now, and a whole stroke at a time. */
  if(GE.hit && !GE.moved && GE.again){ GE.seal=true; GE.pi=-1; }
  GE.hit=false; GE.again=false;
  /* One press of undo takes back one stroke, not one tap. A stroke being
     built by tapping is one thing to the person building it, so only its
     first tap files a snapshot; the taps that extend it do not. */
  if(GE.pre && GE.pre!==JSON.stringify(GE.st)){
    var only=GE.st[GE.si], fresh=!!(only && only.pts.length<=1);
    if(fresh || GE.moved || GE.hit) gePush(GE.pre);
  }
  GE.pre=null;
  geDraw(); geTools();
}
/* ---- two fingers -------------------------------------------------------
   「2本指を上下に開いたらズーム、スライドさせたら移動」
   「指でやるならボタンなし」 OWNER 2026-08-27.

   The two magnifiers are gone, so this is the only way to get closer, and
   the ladder went with them: the gap between the fingers says how much
   bigger, continuously, between 1 and 3. There is nothing to step through
   when there is no button to press.

   A SEPARATE ENTRANCE, and that is the load-bearing part. geDown, geMove and
   geUp are not touched -- not one `if`, not one early return -- because they
   are the drawing, and drawing is the thing this app is. The canvas is wired
   to gePtDown/gePtMove/gePtUp instead: those count the fingers on the glass
   and hand a single one straight through, unchanged. 「描く手つきは一ミリも
   変えないでください」 and `docs/BACKLOG.md` has the list of places that said
   "this is the one place" and were two.

   Three things it must get right, and not one of them throws when it does
   not:

   ONE OR THE OTHER, DECIDED ONCE. 「どちらかに決めたら、指を離すまで変え
   ない。」 Asking every frame whether this is a zoom or a move means a hand
   that drifts a little off straight flips between them several times a
   second, and the paper judders. So nothing happens at all until the fingers
   have moved enough to mean something, and what they meant then is what they
   go on meaning until the glass is clear.

   WHAT IS UNDER THE FINGERS STAYS UNDER THE FINGERS. Both modes are the
   same sentence -- one paper point pinned to one place on the glass -- so
   they are one function, gePinTo(). What differs is which place: a move pins
   it under the fingers as they travel, and a zoom pins it where the fingers
   started, so that growing the paper does not also slide it.

   THE STROKE UNDER THE FIRST FINGER IS THROWN AWAY. Without it every pinch
   leaves a dot or a short line behind, because the first finger down went
   through geDown and started one. It is thrown away by putting back GE.pre
   -- the copy geDown itself took before it touched anything -- which is
   exactly this gesture and cannot reach anything else. A stroke that was
   FINISHED, by a finger lifting, has no GE.pre and is not touched:
   「人が作ったものを消さない」.

   Nothing here is stored. Zoom is where you are standing, not part of the
   letter, and geOrg() already refuses to show past the paper's edge. */
var GEZMIN=1, GEZMAX=3;
/* how far the fingers have to travel before this is a gesture at all */
var GEPINGO=8;
var GEPIN={ on:false, pts:[], mode:'', d0:0, z0:1, anchor:null, mid0:null };
function gePinAt(id){
  var i;
  for(i=0;i<GEPIN.pts.length;i++) if(GEPIN.pts[i].id===id) return i;
  return -1;
}
/* the two fingers, as the canvas's own pixels */
function gePinXY(c, ev){
  var b=c.getBoundingClientRect();
  return [ev.clientX-b.left, ev.clientY-b.top];
}
function gePinGap(){
  var a=GEPIN.pts[0], b=GEPIN.pts[1];
  if(!a||!b) return 0;
  return Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));
}
function gePinMid(){
  var a=GEPIN.pts[0], b=GEPIN.pts[1];
  if(!a||!b) return [0,0];
  return [(a.x+b.x)/2, (a.y+b.y)/2];
}
/* Put paper point `pp` under glass point `px`, at zoom `z`. The window on
   the square is what GE.cx/GE.cy name the middle of, so this is geTo/geFrom's
   own formula turned round -- and it is written ONCE, because a mapping that
   must agree with the one in geDraw is exactly the place a zoom goes wrong.
   geOrg() does the clamping, so nothing here has to know where the edge is. */
function gePinTo(c, pp, px, z){
  var b=c.getBoundingClientRect(), S=[b.width||1, b.height||1], span=800/z, i, org;
  GE.z=z;
  for(i=0;i<2;i++){
    org=pp[i] - (px[i]-geMar(S[i]))/(geK0(S[i])*z);
    if(i===0) GE.cx=org+span/2; else GE.cy=org+span/2;
  }
}
/* the stroke still under a finger, and only that one */
function gePinDrop(){
  if(!GE || !GE.pre) return;
  GE.st=JSON.parse(GE.pre);
  GE.pre=null;
  GE.si=GE.st.length-1; GE.pi=-1;
  GE.drag=false; GE.free=false; GE.fresh=false; GE.hit=false;
  GE.again=false; GE.moved=false; GE.raw=null; GE.rawFor=-1;
  GE.seal=!!(GE.st.length && GE.st[GE.st.length-1].pts.length);
}
function gePinStart(c){
  var b=c.getBoundingClientRect(), w=b.width||1, h=b.height||1, m=gePinMid(), i;
  gePinDrop();
  /* the gesture starts HERE, so where each finger is now is where it landed.
     The first finger has usually been drawing a line for a second by the
     time the second one arrives, and none of that travel is part of this. */
  for(i=0;i<GEPIN.pts.length;i++){
    GEPIN.pts[i].x0=GEPIN.pts[i].x; GEPIN.pts[i].y0=GEPIN.pts[i].y;
  }
  GEPIN.on=true; GEPIN.mode='';
  GEPIN.d0=gePinGap();
  GEPIN.z0=geZ();
  GEPIN.anchor=m;
  /* the paper under the middle of the two, read BEFORE anything moves */
  GEPIN.mid0=[geFrom(w, m[0], 0), geFrom(h, m[1], 1)];
  /* AND PAINT IT. gePinDrop() has just taken a stroke out of GE.st and
     nothing else here draws: gePinMove() returns before geDraw() until the
     fingers have moved enough to mean something, and a pinch that never
     decides never draws at all. So the line the second finger threw away sat
     on the paper for the whole gesture -- gone from the drawing, still in
     front of the person doing it, and coming back off only when they lifted.
     Photographed before and after the second finger, the two pictures were
     the same picture. Nothing threw; the data was right the whole time. */
  geDraw(); geTools();
}
/* how far each finger has come from where it landed */
function gePinRun(i){
  var q=GEPIN.pts[i];
  if(!q) return 0;
  return Math.sqrt((q.x-q.x0)*(q.x-q.x0)+(q.y-q.y0)*(q.y-q.y0));
}
/* Which of the two this is, decided ONCE and then not asked again.
   「どちらかに決めたら、指を離すまで変えない。」

   WAIT FOR BOTH FINGERS, and that is the part that is easy to get wrong. A
   phone sends one pointermove per finger, so the two never move in the same
   event: half way through a slide, one finger has travelled the whole way
   and the other has not moved at all -- and at that instant the gap between
   them has changed by the whole of it while the middle has moved by half.
   Read then, every slide is a pinch, and it was: two fingers dragged across
   the paper magnified instead of moving it, and what was under them ended up
   56px from under them.

   AND NO ARITHMETIC ON ONE FINGER CAN TELL THEM APART. "The right-hand
   finger went right" is exactly as much a slide beginning as a pinch
   opening -- the two are the same numbers, so any threshold that answers is
   guessing, and it will guess wrong on somebody's hand. The only thing that
   separates them is the other finger, so this waits for it: neither is
   answered until BOTH have gone somewhere. Once they have, a slide has the
   two travelling together (the gap held, the middle moved) and a pinch has
   them travelling apart (the gap moved, the middle held), and one comparison
   settles it for the rest of the gesture.

   The cost is a finger planted while the other opens: that waits, and does
   nothing, until the planted one moves its eight pixels too. It is the right
   side to be wrong on -- a gesture that has not started yet is a paper that
   has not moved, and the other way round is a paper that jumps. */
function gePinMove(c){
  var m=gePinMid(), d=gePinGap(), dd, dm, r0, r1, z;
  if(!GEPIN.d0) return;
  dd=Math.abs(d-GEPIN.d0);
  dm=Math.sqrt((m[0]-GEPIN.anchor[0])*(m[0]-GEPIN.anchor[0])+
               (m[1]-GEPIN.anchor[1])*(m[1]-GEPIN.anchor[1]));
  if(!GEPIN.mode){
    r0=gePinRun(0); r1=gePinRun(1);
    if(r0<GEPINGO || r1<GEPINGO) return;      /* the other one has not moved */
    if(dd<GEPINGO && dm<GEPINGO) return;
    GEPIN.mode=(dd>=dm)? 'z' : 'm';
  }
  if(GEPIN.mode==='z'){
    z=GEPIN.z0*(d/GEPIN.d0);
    if(z<GEZMIN) z=GEZMIN;
    if(z>GEZMAX) z=GEZMAX;
    /* pinned where the fingers STARTED: a pinch that also slid the paper
       would be both things at once, which is the thing decided against */
    gePinTo(c, GEPIN.mid0, GEPIN.anchor, z);
  }else{
    gePinTo(c, GEPIN.mid0, m, GEPIN.z0);
  }
  geDraw();
}
/* The canvas's own handlers. One finger is handed straight through; two are
   this. It stays this until the glass is clear -- a pinch that became a
   stroke the moment one finger came up would draw a line nobody asked for
   with the other. */
function gePtDown(ev){
  if(ev.preventDefault) ev.preventDefault();
  var c=ev.currentTarget, p=gePinXY(c, ev);
  if(gePinAt(ev.pointerId)<0)
    GEPIN.pts.push({id:ev.pointerId, x:p[0], y:p[1], x0:p[0], y0:p[1]});
  if(GEPIN.pts.length>=2){
    if(!GEPIN.on) gePinStart(c);
    if(c.setPointerCapture) try{ c.setPointerCapture(ev.pointerId); }catch(e){}
    return;
  }
  geDown(ev);
}
function gePtMove(ev){
  var c=ev.currentTarget, i=gePinAt(ev.pointerId), p;
  if(i>=0){
    p=gePinXY(c, ev);
    GEPIN.pts[i].x=p[0]; GEPIN.pts[i].y=p[1];
  }
  if(GEPIN.on){
    if(ev.preventDefault) ev.preventDefault();
    if(GEPIN.pts.length>=2) gePinMove(c);
    return;
  }
  geMove(ev);
}
function gePtUp(ev){
  var i=gePinAt(ev.pointerId), was=GEPIN.on;
  if(i>=0) GEPIN.pts.splice(i, 1);
  if(was){
    if(ev.preventDefault) ev.preventDefault();
    if(GEPIN.pts.length) return;          /* still a finger down: still a pinch */
    GEPIN.on=false; GEPIN.mode=''; GEPIN.anchor=null; GEPIN.mid0=null;
    /* the rail, because throwing the half-drawn stroke away may have taken
       the last dot off the paper */
    geDraw(); geTools();
    return;
  }
  geUp(ev);
}
/* Leaving the screen leaves no fingers on it. Without this a pinch
   interrupted by the app going somewhere else comes back still on, and the
   next single finger draws nothing. */
function gePinReset(){
  GEPIN.on=false; GEPIN.pts=[]; GEPIN.mode='';
  GEPIN.d0=0; GEPIN.anchor=null; GEPIN.mid0=null;
}
/* The toolbar's enabled/disabled state depends on the selection, and the
   selection changes on every tap — but re-rendering the whole view would tear
   the canvas down mid-gesture. So only the toolbar is redrawn. */
/* Round, undo, clear. NEW used to sit here and is gone: a stroke ends when
   the finger lifts, so there was nothing left for it to start. Undo and clear
   were words in a corner underneath; they are marks on the rail now, at the
   same size as everything else a thumb has to hit. */
/* ROUND is done TO a stroke, so until one has been drawn there is nothing
   for it to be done to and the button is down. */
function geBendable(){
  var st=GE && GE.st[GE.st.length-1];
  return !!(st && st.pts.length>=3);
}
/* ---- one rail, under the paper -----------------------------------------
   「名前無くしたなら1列でいいよ全部」 OWNER 2026-08-28.

       paper's foot   undo   redo   fill   round   clear

   It was two for a day, over the paper and under it, and that was the right
   answer to a rail that had seven things on it with a word printed under
   each. Taking the words away took the reason with it: five marks across a
   390px phone are 78px apart, which is more room than any of them had when
   there were four with captions. A second rail bought nothing and cost a
   band of the screen on a page whose whole subject is the square in the
   middle of it.

   The two magnifiers are not here either. 「指でやるならボタンなし」 -- two
   fingers do that now, so a button would be a second way to say the same
   thing.

   ONE call, and the onboarding's first step makes the same one: the drawing
   surface is the same surface there, and after this it is the same rail
   under it. It was briefly not -- five in one row there and two rows here --
   which is the shape this file warns about everywhere else. */
function geRail(st, pts){
  return '<div class="gtools">'+
    geBtn('geUndo','undo','glyph.undo', !!GE.undo.length, false)+
    geBtn('geRedo','redo','glyph.redo', !!GE.redo.length, false)+
    geBtn('geFill','fill','glyph.fill', true, !!GE.fill)+
    geBtn('geCircle','circle','glyph.circle', geBendable(), !!GE.round)+
    geBtn('geClear','clear','glyph.clear', !!pts, false)+
  '</div>';
}

/* What the five marks under the square are, and the two fingers -- behind the
   `?` in the bar rather than as a caption under each one. Captions under the
   rail were taken off it on purpose; this is where the words went.

   The mark itself is drawn beside its name, because the name on its own is
   the half a person already has: what they are looking at is the shape. */
function geHelpIcon(n){
  return '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" '+
    'stroke="currentColor" stroke-width="1.25" stroke-linecap="round" '+
    'stroke-linejoin="round" aria-hidden="true" '+
    'style="vertical-align:-5px;margin-right:9px">'+GICON[n]+'</svg>';
}
function geHelpRow(n, name, desc){
  return '<div class="sec">'+geHelpIcon(n)+esc(name)+'</div>'+
    '<div class="note">'+esc(desc)+'</div>';
}
HELP.glyph=function(){
  return {t:t('glyph.help.t'), h:
    '<div class="note">'+esc(t('glyph.help.draw'))+'</div>'+
    '<div class="note">'+esc(t('glyph.help.zoom'))+'</div>'+
    geHelpRow('undo',   t('glyph.undo'),   t('glyph.undo.d'))+
    geHelpRow('redo',   t('glyph.redo'),   t('glyph.redo.d'))+
    geHelpRow('fill',   t('glyph.fill'),   t('glyph.fill.d'))+
    geHelpRow('circle', t('glyph.circle'), t('glyph.circle.d'))+
    geHelpRow('clear',  t('glyph.clear'),  t('glyph.clear.d'))};
};
function geTools(){
  /* querySelectorAll and not querySelector, though there is one rail again.
     For a day there were two and this answered only the first of them, so
     fill, round and clear stayed frozen at whatever they were when the
     screen was drawn -- the bin down over a drawing that had just been made.
     Asking for all of them is right either way and cannot go back to being
     wrong. */
  var boxes=document.querySelectorAll('.gtools');
  if(!boxes.length) return;
  var st=GE.st[GE.si], pts=0;
  GE.st.forEach(function(s){ pts+=s.pts.length; });
  /* Keyed by name, not by position: the row can be reordered or added to
     without this quietly disabling the wrong button. */
  var S={ 'circle':[geBendable(), !!GE.round],
          'fill'  :[true, !!GE.fill],
          'undo'  :[!!GE.undo.length, false],
          'redo'  :[!!GE.redo.length, false],
          'clear' :[!!pts, false] };
  var bi, b, i, s, g, cl;
  for(bi=0;bi<boxes.length;bi++){
    b=boxes[bi].getElementsByTagName('button');
    for(i=0;i<b.length;i++){
      g=b[i].getAttribute('data-g'); s=S[g];
      if(!s) continue;
      if(GE_HINT_DEMO[g]){
        cl=s[1]?'on':'';
        if(!s[0]) cl=cl?cl+' off':'off';
        b[i].className=cl;
        if(s[0]) b[i].removeAttribute('aria-disabled');
        else b[i].setAttribute('aria-disabled','true');
      } else {
        b[i].disabled=!s[0];
        b[i].className=s[1]?'on':'';
      }
    }
  }
  /* the onboarding's own step, which is the other thing on this screen that
     has to answer the hand: the line over the canvas and the button that ends
     the step. It knows whether it is on. */
  obDrawTick();
}
/* One draw call, three layers: the cell you are drawing inside, the ink the
   font will actually contain, and the points you can still move. The ink is
   not an approximation of the font — it is glyphContours(), the same function
   the font writer calls. */
function geDraw(){
  var c=document.getElementById('gcanv');
  if(!c||!GE) return;
  var x=c.getContext('2d'), S=c.width;
  /* The pen is 60 wide in an 800 cell, so ink reaches 30 past whatever point
     it is drawn through, and the outermost lattice points sit 40 from the
     edge. Drawn straight at S/800 a stroke along the edge of the lattice came
     right up against the frame, and at the corners went outside it. The
     drawing is put into an inset square instead: the frame is the canvas, the
     lattice lives within it with room for the pen. geAt undoes exactly this,
     so where the finger is and where the dot appears stay the same place. */
  /* k0 is the canvas's own scale and k is the drawing's -- the same number
     until somebody presses the magnifier. The frame belongs to the canvas. */
  var pad=geMar(S), k0=geK0(S), k=geK(S);
  var X=function(v){ return geTo(S,v,0); }, Y=function(v){ return geTo(S,v,1); };
  x.clearRect(0,0,S,S);
  x.strokeStyle=cssVar('--goldln'); x.lineWidth=Math.max(1,k0*2.5);
  x.strokeRect(k0*3,k0*3,S-k0*6,S-k0*6);
  /* The lattice is drawn as dots, not as ruled lines: a line says "anywhere
     along here", and that is the thing being taken away. */
  var gs=geStep(), gi, gj;
  /* A lattice you cannot see is a lattice that is not there, and this surface
     has one job: to show where a point may land. It has been too faint twice.
     First at 5% white, which reads on a desk and vanishes on a phone. Then at
     18%, which measures 1.7:1 against the panel behind it -- barely half of
     the 3:1 that anything non-text needs to be reliably seen, and less than
     that on a bright screen out of doors. The measurement is the rule now:
     tools/mock/contrast reads the composited dot against the gap beside it and
     both themes clear 3:1. The dot is also a little larger, because 1.6 points
     across is under what a thumb can aim at even when it can be seen. */
  x.fillStyle=cssVar('--dot');
  for(gi=0; gi<GGRID.n; gi++){
    for(gj=0; gj<GGRID.n; gj++){
      x.beginPath();
      /* the dot scales with the step, so 100 dots do not read as a grey wash */
      x.arc(X(GGRID.inset+gi*gs), Y(GGRID.inset+gj*gs), Math.max(2,k*gs*0.115), 0, Math.PI*2);
      x.fill();
    }
  }

  /* The ink, through the one function that lays ink down. X(v) is pad+v*k,
     which is exactly what inkStrokes does with an origin -- so the letter you
     are drawing is drawn by the same code as the letter on the key, the tile
     and the card. It was not, and a letter could have looked like one thing
     under your finger and another everywhere else. */
  /* Everything in the letter's own colour first, areas included -- what is
     on the canvas is what the letter will look like, not a marked-up copy of
     it. Then the outline of each area again in green, over its own ink.

     The green is the LINE and only the line. Painting the inside green too
     made the area and its edge one colour and the whole shape one green mass,
     which is the difference this is here to draw. 「緑は線で塗りつぶしは線と
     同じ色でしょ。差をつけないといけないやん」 */
  var area=[];
  GE.st.forEach(function(s0){ if(s0.fill) area.push({pts:s0.pts, closed:s0.closed, k:s0.k}); });
  /* inkStrokes lays down ox + v*k, which is geTo() written out, so the
     origin it is handed is where 0 of the square falls once the window has
     been scrolled to geOrg(). At z=1 that is pad, as it always was. */
  var org=geOrg(), ix=pad-org[0]*k, iy=pad-org[1]*k;
  inkStrokes(x, GE.st, k, ix, iy, cssVar('--tx'));
  if(area.length) inkStrokes(x, area, k, ix, iy, cssVar('--fill'));

  x.strokeStyle=cssVar('--goldln'); x.lineWidth=Math.max(1,k*2);
  GE.st.forEach(function(s){
    if(s.pts.length<2) return;
    var poly=LinguaFont.toPolyline(s);
    x.beginPath();
    poly.forEach(function(p,i){ if(i) x.lineTo(X(p[0]),Y(p[1])); else x.moveTo(X(p[0]),Y(p[1])); });
    x.stroke();
  });
  GE.st.forEach(function(s,si){
    s.pts.forEach(function(p,pi){
      var sel=(si===GE.si && pi===GE.pi);
      /* Smaller than the step, or the handle covers the lattice dot it is
         sitting on and the thing you are aiming at is under the thing you
         placed. 「⚪︎がでかいのもあるわ。そのせいで点がわからん」 */
      x.beginPath(); x.arc(X(p[0]),Y(p[1]),k*(sel?16:11),0,Math.PI*2);
      x.fillStyle = (p[2]==='c') ? cssVar('--pur') : cssVar('--gold');
      x.fill();
      if(sel){
        x.beginPath(); x.arc(X(p[0]),Y(p[1]),k*32,0,Math.PI*2);
        x.strokeStyle=cssVar('--gold'); x.lineWidth=k*4; x.stroke();
      }
    });
  });
}
/* ---- the keyboard a word is typed on ----------------------------------
   It used to be a row of IPA symbols, which is the right thing to store and
   the wrong thing to look at: by the time somebody is writing words they have
   drawn letters, and the letter is what they think in. So a key shows the
   letter -- the one drawn, or the one borrowed -- with the symbol small
   underneath, because the symbol is still what the sound IS.

   A syllabary and a logography have no letter for a single sound, so their
   keys stay symbols. There is nothing else they could honestly show. */
/* Taking a borrowed character off a letter: forget the character, rebuild the
   font without it, redraw. It was three statements inside a button. */
function ltDropChar(lid){ ltSetChar(lid, ''); installScriptFont(); render(); }
/* `call` is what pressing this key does, already written as attributes by
   DO(). It used to be a line of JavaScript handed across as text. */
function phkHTML(sym, call){
  var st=wsStrokes(sym), ch=chOf(sym), face='';
  if(st && st.length) face='<canvas class="pkc" data-r="'+esc(sym)+'"></canvas>';
  else if(ch) face='<span class="pkb">'+esc(ch)+'</span>';
  return '<button class="phk'+(face?' hasg':'')+'"'+call+'>'+face+
    '<span class="pks">'+esc(sym)+'</span></button>';
}
/* A letter's strokes as filled ink: scaled by k, laid down at (ox,oy).
   The one place that turns strokes into a shape on a canvas. The keyboard,
   the tiles, the card, the glyph preview and the editor's own canvas all come
   through here, so a letter cannot look like one thing on a key and another
   on a picture somebody posts. The last two did not, and the letter under
   your finger was drawn by different code from the letter everywhere else. */
/* `mid` stands the shape in the middle of the square it is being drawn in,
   rather than where it sits in the lattice. It is done HERE, on the contours,
   because the contours are the only honest answer to "where is the ink".

   The points are not that answer, and the difference is not small: a stroke
   of three points marked round and CLOSED is a full circle through them, and
   it bulges a seventh of the square outside the box those three points make.
   Measured on a key: dead centre by the contours, 13.5% out by the points.
   Round, filled, capped -- every one of them puts ink where no point is. */
function inkStrokes(x, st, k, ox, oy, col, mid){
  var cont=[];
  try{ cont=LinguaFont.glyphContours(inkDef(st), GPEN); }catch(e){ return; }
  if(mid){
    var mnx=1e9, mxx=-1e9, mny=1e9, mxy=-1e9;
    cont.forEach(function(poly){
      poly.forEach(function(p){
        if(p[0]<mnx) mnx=p[0];
        if(p[0]>mxx) mxx=p[0];
        if(p[1]<mny) mny=p[1];
        if(p[1]>mxy) mxy=p[1];
      });
    });
    if(mnx<=mxx){
      ox+=(800-(mnx+mxx))/2*k;
      oy+=(800-(mny+mxy))/2*k;
    }
  }
  /* One path, filled once. Each contour used to be its own fill, which is
     invisible while every contour is a nib laid along a line and overlapping
     its neighbour squarely -- and not invisible at all once a filled area
     arrives, because that is cut into triangles and every cut came back as a
     pale hairline where two edges antialiased against each other. Non-zero
     winding joins them into one shape instead, which is what glyphContours
     winds them all the same way for. */
  x.fillStyle=col;
  x.beginPath();
  cont.forEach(function(poly){
    if(poly.length<3) return;
    poly.forEach(function(p,j){
      if(j) x.lineTo(ox+p[0]*k, oy+p[1]*k); else x.moveTo(ox+p[0]*k, oy+p[1]*k);
    });
    x.closePath();
  });
  x.fill();
}
/* What a canvas is a picture of: a letter named by its id in data-l, or
   whatever writes the sound named in data-r. Null when there is nothing
   drawn to show. */
function inkOf(lid, sym){
  var st = lid? inkGeo(ltById(lid)) : wsStrokes(sym);
  return (st && st.length)? st : null;
}
/* Every canvas matching `sel`, filled with the letter it names. Sized in
   device pixels, which is something no markup can say, so it has to happen
   after the layout exists.

   phkMount and geTiles were this function written out twice -- the same
   fourteen lines, differing only in the selector and the floor under the
   size. A change to how a letter is inked reached the keyboard and left the
   tiles as they were, and nothing anywhere could see the two had come
   apart.

   A post's face comes through here too, and it is the one caller whose
   strokes are NOT read out of LETTERS -- they travel on the post, because
   whoever is reading it does not have that language. Hence stOf: what a
   canvas is a picture of is the caller's to say. */
function inkCanvases(sel, floor, dflt, stOf){
  var els=document.querySelectorAll(sel), i;
  for(i=0;i<els.length;i++){
    var c=els[i];
    var st=stOf? stOf(c) : inkOf(c.getAttribute('data-l'), c.getAttribute('data-r'));
    if(!st || !st.length) continue;
    var dpr=window.devicePixelRatio||1, box=c.getBoundingClientRect();
    var S=Math.max(floor, Math.round((box.width||dflt)*dpr));
    c.width=S; c.height=S;
    /* and, where the caller asked for it, standing in the middle of the
       square rather than where it was drawn in the lattice */
    inkStrokes(c.getContext('2d'), st, S/800, 0, 0, cssVar('--tx'),
               (' '+c.className+' ').indexOf(' midink ')>=0);
  }
}
/* What a letter takes up standing beside the next one, and where its ink sits
   inside that -- in cell units, for one letter at a time.

   It is the font's rule and nothing else: a letter's width is its own ink
   plus one step, half a step at each end, so the gap between any two letters
   is one step whichever two meet.
   「どこから並んでも1点線分の隙間があるからバランス崩れない」
   `reach` is otf5's, not a copy of it, and the step is the same geSide()
   that installScriptFont hands the font as `side`.

   A square cell per letter is a DIFFERENT rule and a worse one: there the gap
   is cell - inkA/2 - inkB/2, so no two pairs are alike and a narrow letter
   floats in the middle of nothing. A line of ink was drawn that way for one
   day and it showed. 「文字間おかしくね」

   `h` and `dy` are the same answer asked downward, which is what a script
   that runs down the page needs and what a vmtx would be written from. otf5
   says so itself: one formula, whichever axis it is asked about. The card
   asks for both; a line of ink only ever asks for the first two.

   `x0`/`x1`/`y0`/`y1` are the ink's own corners, for a caller placing several
   letters against one shared edge rather than each against its own.

   Null when the strokes ink nothing, which is a letter with no shape. */
function inkAdv(st){
  var cs, p, e, side=geSide();
  try{ cs=LinguaFont.glyphContours(inkDef(st), GPEN); }catch(err){ return null; }
  p=LinguaFont.profile(cs);
  if(!(p.xMax>p.xMin)) return null;
  e=LinguaFont.extent(cs);
  return {w:LinguaFont.reach(p.xMin, p.xMax, side), dx:Math.round(side-p.xMin),
          x0:p.xMin, x1:p.xMax,
          h:LinguaFont.reach(e[0], e[1], side), dy:Math.round(side-e[0]),
          y0:e[0], y1:e[1]};
}
/* A line of ink: letters standing beside each other. Not the same thing as a
   tile or a key, which are square cells and rightly so -- those go through
   inkCanvases, and a square is the whole point of them.

   Each canvas is given its letter's advance as the canvas's own width, which
   is what a canvas's intrinsic ratio means, so CSS hangs the width off the
   height and the line spaces itself exactly as the font would space it. */
function inkLine(sel, stOf){
  var els=document.querySelectorAll(sel), i, c, st, a, dpr, H, k;
  for(i=0;i<els.length;i++){
    c=els[i];
    st=stOf(c);
    if(!st || !st.length) continue;
    a=inkAdv(st);
    if(!a) continue;
    dpr=window.devicePixelRatio||1;
    H=Math.max(24, Math.round((c.getBoundingClientRect().height||18)*dpr));
    k=H/800;
    c.height=H; c.width=Math.max(1, Math.round(a.w*k));
    /* The colour the canvas is standing in, not --tx.
       A letter drawn on a canvas took the ink colour straight from the token,
       so it was the same black wherever it stood -- and a calendar's Sunday
       is red. Everywhere else the computed colour IS --tx, because that is
       what the surrounding CSS sets, so nothing that was right changes.
       「日曜🟥土曜🟦 カレンダーって数字だけがあればいいわけじゃねえぞ？」 */
    inkStrokes(c.getContext('2d'), st, k, a.dx*k, 0,
               (window.getComputedStyle? getComputedStyle(c).color : '') || cssVar('--tx'));
  }
}
function phkMount(){ inkCanvases('canvas.pkc', 40, 34); }
/* The tiles on the letter grid are the same ink again, scaled down. */
function geTiles(){ inkCanvases('canvas.tc', 48, 72); }

/* =========================================================================
   14. Drawing
   ========================================================================= */

/* AI_SEAM — where the hosted model plugs in.
   A browser cannot hold an API key, so the request must go through your own
   endpoint, which then calls Claude (model "claude-opus-5") server-side and
   returns the text. Until that endpoint exists, the advice below is computed
   here from the language itself, which is why it still says something true. */



/* Which screen the markup on the page belongs to, so the next render can tell
   a redraw of this one from a move to another. */
var RENDERED=null;
function render(){
  /* Any navigation takes the popup with it. */
  if(typeof popOff==='function') popOff();
  /* the document's own language, so the browser picks the right font and
     line-breaking for it — and so the CSS above can drop Latin tracking */
  document.documentElement.setAttribute('lang', uiLang());
  /* the bar at the foot of the screen, which is not part of any screen */
  tabPaint();
  /* Onboarding returns before the mount hooks at the foot of this function,
     so the editor it embeds has to be mounted here or its canvas stays blank.
     Every editor action ends in render(), which lands back on this line. */
  /* The tour is the one part of the onboarding that is not a face of vOb():
     it is the app, dimmed, with one thing lit. So it falls through to the
     ordinary render below and puts the grey on at the end of it. */
  /* What the app IS is appIs()'s to say, in www/shell.js, and this is the one
     line that used to hold a second copy of it -- `!SET.done && !obTourOn()`,
     which had nothing to say about being signed out. */
  if(appIs()!=='app'){
    /* onboarding is one screen with several faces; moving between them
       animates, tapping something on one of them does not */
    app.setAttribute('data-fresh', (RENDERED==='ob:'+ob.step) ? '0' : '1');
    RENDERED='ob:'+ob.step;
    app.innerHTML=vOb();
    /* The drawing step needs its canvas filled. This asked for step 4 and
       mode 'draw', which is where drawing was when the onboarding had five
       steps and the mode was named -- both moved, and the square went blank
       with nothing to say so. What it means is "there is a canvas on screen",
       so that is what it asks. */
    if(document.getElementById('gcanv')) geMount();
    /* And the same for a letter that has already been drawn: the step that
       asks which letter of the alphabet the shape is shows the shape, and a
       tile is filled after the HTML exists or it is an empty box. geTiles
       asks the document what is on it, so on the steps with no tile it finds
       nothing and does nothing. */
    geTiles();
    return; }
  /* a word written since the font was built can need a letter it does not have */
  if(SFONT.sig!==null && SFONT.sig!==scriptSig()) installScriptFont();
  /* and the system keyboard, which is a second program and holds its own copy
     of the letters, is told the same way and for the same reason */
  sharePush();
  /* and the copy on disk, which is the one that is still there when the
     storage this is all read from is not */
  bkPush();
  /* Which screen this route shows is written on the page itself, in
     www/route-map.js, with the view function rather than its name. This used
     to be twenty-two conditions here -- a second copy of PAGES that nothing
     could check against the first. */
  var pg = PAGES[route], v = (pg && pg.view)? pg.view() : vProfile();
  /* one attribute decides whether words are shown in roman letters or in the
     ones you drew — the text itself never changes, only the family it is set in */
  document.documentElement.setAttribute('data-script', myFontOn()? 'on':'off');
  /* Replacing the view resets the scroll, which threw you to the top on every
     edit, so the old offset is put back. Only within one screen, though: a
     chapter opened from the contents was being handed the offset of whatever
     you were looking at before, drawn at the top and then dropped to it a
     frame later. That fall is what made every chapter open on its middle.
     A different screen starts where a page starts. */
  var same = (RENDERED===route);
  /* and what the screen being left forgets, which is viewLeft()'s in
     www/shell.js -- this is the one line that knows a screen changed. */
  /* The drawing screen writes what is on it down as it is left. It is here
     rather than in viewLeft() because viewLeft is www/shell.js's and this is
     the glyph editor's own business -- and because it has to run BEFORE the
     next screen is built out of the letters it just changed. */
  if(!same) geLeft(RENDERED, route);
  if(!same) viewLeft(RENDERED, route);
  var y = same ? (window.scrollY || window.pageYOffset || 0) : 0;
  /* THE SCREEN BEING LEFT, KEPT. Not to redraw it -- to show it behind the
     current one while a thumb drags that one off, which is what iOS does and
     what was asked for: 「iPhone標準みたいに左側になんかふわってやつ出てきて
     ほしい」 OWNER 2026-09-02.

     Kept rather than rebuilt, and that is the whole reason it is here rather
     than in the gesture: building a view again RUNS it. vNotif() marks the
     notices read, three screens pull from the network, and a swipe that was
     abandoned would have done all of it. What is stashed is the page as it
     was actually left. www/shell.js § swStart is what shows it. */
  if(!same) navKeep(RENDERED, app.innerHTML);
  RENDERED=route;
  /* the entrance animation belongs to arriving, not to redrawing */
  app.setAttribute('data-fresh', same ? '0' : '1');
  app.innerHTML=v;
  window.scrollTo(0, y);
  /* the canvases have to be filled after the HTML exists, and sized in device
     pixels, which is something no markup can say */
  if(route==='glyph'){ geMount(); geHintMount(); }
  /* Which screens have canvases on them was a list of route names here, and
     a list of route names is a thing that goes out of date the moment a screen
     is split in two -- the letters chapter became three pages and every digit
     on them was an empty box. Both of these ask the document what is on it
     instead, which is the same fix the onboarding's canvas got above: they
     find nothing and do nothing on a screen that has none. */
  geTiles(); phkMount(); postFaces(); postLines(); pwHoldMount(); numWidMount();
  /* and a line field is made as tall as what is in it, which no markup can
     say -- the same reason the canvases are sized here */
  lnGrowAll();
  /* and the alphabet, if that is what is on the page, can have a letter held
     and carried to where it belongs */
  ltDragMount();
  /* and a key of the keyboard being built can be held and carried the same
     way -- the same gesture, on the other thing in this app that is a grid
     somebody arranges */
  kbDragMount();
  /* and a key, wherever the keyboard is, can be flicked off */
  if(route==='form') formMount();
  /* and, if the walk through the app is on, everything but one thing goes
     grey. Last, because it MEASURES something the lines above have just
     drawn: the hole in the grey is cut around the lit thing, so the screen
     has to be on the page before this line runs.
     obTourAt() reads where the app landed, so pressing the lit thing is what
     moves the tour on -- it does what it really does. */
  if(!SET.done){
    obTourAt();
    app.insertAdjacentHTML('beforeend', obTourHTML());
  }
}
