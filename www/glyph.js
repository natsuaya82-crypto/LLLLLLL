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
var GPEN={width:60, angleDeg:0, contrast:1.0, curve:72};

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
var GGRID={n:11, inset:40};
/* A stroke drawn in one go can be long, but not unbounded. It used to stop
   at 24, and past that the drag stopped adding points and only dragged the
   last one about -- which is why a long stroke cut off halfway through. The
   thinning afterwards is what decides how many points a shape really keeps,
   so this only has to be higher than any real stroke. */
var GE_MAXPTS=160;
function geStep(){ return (800 - GGRID.inset*2) / (GGRID.n - 1); }
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
function scriptDrawn(L){
  var n=0;
  L.forEach(function(r){ if(wsDrawn(r)) n++; });
  return n;
}

/* One glyph per unit, plus the single characters a longer unit is spelled
   with -- a ligature needs its own components to exist as glyphs even when
   your script never shows them alone. Upper and lower case map to the same
   drawing, because a script you invented has no case unless you draw one.

   A unit of more than one character has no code point of its own, so it is
   reached by an OpenType ligature over the characters it is made of: you type
   the sounds and the font draws the one letter. That is how "ka" becomes a
   single syllabary letter, and how a whole word becomes a single logograph.
   Longer ligatures are offered first, so ka.i does not win over kai. */
/* A letter you have not drawn gets NO glyph. It used to get GPLACE, the dashed
   placeholder box the editor draws on an empty canvas -- so a font built from
   three letters out of eleven put a box where the other eight belonged, and a
   three-letter word came out as one letter and two boxes. 「なんで、1単語に1文字用
   の四角が出てくるの？」 That is what it was.

   With no glyph there is no code point, so the browser falls through to the
   serif underneath and writes that letter in roman. A half-drawn script shows
   the half that exists and the rest legibly, which is the only useful thing to
   do while a script is being drawn -- and it is being drawn for a long time.

   The one place a placeholder is still unavoidable: a syllabary letter for
   "ka" is reached by a ligature over k and a, and an OpenType ligature can
   only fire over glyphs that exist. If "ka" is drawn but "k" alone is not --
   which is normal in a syllabary, where k alone is not a letter -- k needs a
   glyph for the rule to be written against. Those get the placeholder, and
   only those. */
function scriptGlyphDefs(){
  var L=scriptLetters(), have={}, defs=[], ligs=[], need=[], drawn={};
  L.forEach(function(r){ have[r]=1; if(wsHasStrokes(r)) drawn[r]=1; });
  /* components of a drawn multi-character unit, and nothing else */
  L.forEach(function(r){
    if(r.length>1 && drawn[r])
      r.split('').forEach(function(c){ if(!have[c] && !drawn[c]){ have[c]=1; need.push(c); } });
  });
  L.filter(function(r){ return drawn[r]; }).concat(need).sort().forEach(function(r){
    var st=wsStrokes(r), up=r.toUpperCase();
    defs.push({
      name: glyphKey(r),
      /* one code unit, so it has a code point of its own; a script you invented
         has no case unless you draw one, so both cases point at one glyph */
      roman: r.length===1 ? (up!==r ? r+up : r) : null,
      strokes: (st && st.length) ? st : GPLACE
    });
    if(r.length>1) ligs.push({sub:r.split('').map(glyphKey), by:glyphKey(r), n:r.length});
  });
  ligs.sort(function(a,b){ return b.n-a.n; });
  /* The marks. A question mark is not derived from anything -- it is a shape
     somebody drew and a character they said types it -- so it is added here
     rather than found by wsUnits(), which only ever answers with sounds.
     A borrowed mark is already a character and needs no glyph. */
  ltMarks().forEach(function(l){
    if(!l.st || !l.st.length) return;
    defs.push({ name:'mk_'+l.id, roman:l.snd.join(''), strokes:l.st });
  });

  return {defs:defs, ligs:ligs};
}
function wsHasStrokes(r){ var st=wsStrokes(r); return !!(st && st.length); }

/* Build the font and hand it to the browser as a @font-face. This runs on the
   device, in about a millisecond, and touches no network. */
var SFONT={built:false, sig:null};
/* What the font is made of, in one string. The alphabet grows on its own as
   the dictionary does, so a word written today can need a letter the font was
   not built with — this is how the page notices without rebuilding on every
   render. Building costs about a millisecond, so it is cheap to be right. */
function scriptSig(){
  var L=scriptLetters(), s=[wsys()];
  L.forEach(function(r){
    var g=wsStrokes(r);
    s.push(r+':'+(g? JSON.stringify(g).length : 0));
  });
  /* the marks too, or drawing one would never rebuild the font: they are not
     in scriptLetters(), which is the whole point of them */
  ltMarks().forEach(function(l){
    s.push('mk'+l.id+':'+l.snd.join('')+':'+(l.st? JSON.stringify(l.st).length : 0));
  });
  return s.join(',');
}
function installScriptFont(){
  var el=document.getElementById('sfontcss');
  if(el) el.parentNode.removeChild(el);
  SFONT.built=false;
  SFONT.sig=scriptSig();
  var L=scriptLetters();
  if(!L.length || !scriptDrawn(L)) return;
  try{
    var d=scriptGlyphDefs();
    var f=LinguaFont.build(d.defs, {mode:'center', pen:GPEN, side:geStep()/2,
                       asc:geInkTop(), desc:geInkTop()-geInkSpan()-geStep(), ligatures:d.ligs,
                                    family:'LinguaScript', style:'Regular'});
    el=document.createElement('style');
    el.id='sfontcss';
    el.appendChild(document.createTextNode(
      "@font-face{font-family:'LinguaScript';src:url("+f.dataUrl()+") format('opentype');}"));
    document.head.appendChild(el);
    SFONT.built=true;
  }catch(e){ SFONT.built=false; }
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
           si:src.length?src.length-1:-1, pi:-1, undo:[], pre:null,
           drag:false, hit:false, again:false, moved:false, fresh:false,
           free:false, round:false, raw:null, rawFor:-1,
           seal:!!(src.length && src[src.length-1].pts.length) };
}
/* From the sound chapter: draw the letter this unit is written with, making
   one if it has none. */
function editGlyph(unit){
  var l=ltForUnit(unit);
  GE=newGE(l.id, unit); go('glyph', l.id);
}
/* From the letters chapter: draw this letter, whatever it reads. */
function editLetter(id){
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
function newLetter(kind){
  var v=(kind==='num')? numFree() : -1;
  var l=ltNew(v>=0? {val:v} : {});
  go('letter', l.id);
}
/* Every change stamps a copy of the whole letter — it is a few hundred bytes,
   so there is no reason to be clever about it. */
function geMark(){
  if(!GE) return;
  GE.undo.push(JSON.stringify(GE.st));
  if(GE.undo.length>60) GE.undo.shift();
}
/* ---- the toolbar ---------------------------------------------------------
   Two marks, because two is what a hand actually makes: a stroke and a ring.
   Everything else that used to sit here was a mechanic pretending to be a
   tool — closing a contour, deleting a point — and each of those is now the
   canvas answering a tap instead of a word asking to be understood. One
   24-unit box each, stroked not filled, so they inherit the caption's colour
   and go gold with it. */
var GICON={
  /* Each mark is the thing it does. Bowed line through a dot that sits on it;
     one arrow turning back on itself; a ring drawn in dots, which is the shape
     of something that is no longer there. */
  'circle': '<path d="M4.5 17.5Q12 3.5 19.5 17.5"/><circle cx="12" cy="10.5" r="1.6"/>',
  'undo'  : '<path d="M4.5 9.5h10a5 5 0 0 1 0 10h-6"/><path d="M8 5.5 4 9.5l4 4"/>',
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
/* A speaker. The play triangle is for a whole word or a list; one letter gets
   this, because it is a sound and not a track. */
var ICON_SPK='<svg class="ic" viewBox="0 0 24 24" width="17" height="17" fill="none" '+
  'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" '+
  'aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9.5a4 4 0 0 1 0 5"/></svg>';
var ICON_PLAY='<svg class="ic" viewBox="0 0 24 24" width="13" height="13" fill="currentColor" '+
  'aria-hidden="true"><path d="M7.5 5.2 19 12 7.5 18.8Z"/></svg>';
var ICON_BACK='<svg class="ic" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" '+
  'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M20 12H4.6"/><path d="M10.5 5.5 4 12l6.5 6.5"/></svg>';
var ICON_PEN='<svg class="ic" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" '+
  'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M4 20h4L19.2 8.8a2 2 0 0 0-2.8-2.8L5 17.2V20Z"/><path d="M15.2 7.2 18 10"/></svg>';
var ICON_PLUS='<svg class="ic" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" '+
  'stroke-width="1.5" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M12 3.4c.9 4.6 4.1 7.8 8.6 8.6-4.5.9-7.7 4.1-8.6 8.6-.9-4.5-4.1-7.7-8.6-8.6 4.5-.8 7.7-4 8.6-8.6Z"/></svg>';
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
var ICON_NOTE='<svg class="ic" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" '+
  'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M6 3.5h12v17l-6-3.4-6 3.4Z"/><path d="M9 8h6M9 11.5h4"/></svg>';
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
/* An actual plus. ICON_PLUS above is a four-pointed star and always was: it
   marks what the paid plan adds. Putting it on "one more consonant" would say
   the sound costs money. */
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
/* the card: a framed picture with a line written across it */
var ICON_CARD='<svg class="ic" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" '+
  'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 11h10M7 15h6"/></svg>';
function geIcon(n){ return '<svg viewBox="0 0 24 24" aria-hidden="true">'+GICON[n]+'</svg>'; }
function geBtn(fn,n,key,en,on){
  var lb=t(key), cl=on?'on':'', act=DO(fn);
  /* A button that can demonstrate itself stays tappable when it is unavailable
     — it goes dim and does nothing, but it still answers "what is this". The
     two history buttons have nothing to show, so those are plainly disabled. */
  if(GHDEMO[n]){
    if(!en) cl=cl?cl+' off':'off';
    /* the demonstration comes after, because acting redraws the view */
    act=act+AFTER('ghShow',[n]);
    return '<button data-g="'+n+'"'+act+(en?'':' aria-disabled="true"')+
           (cl?' class="'+cl+'"':'')+' aria-label="'+esc(lb)+'">'+
           geIcon(n)+'<span class="gcap">'+esc(lb)+'</span></button>';
  }
  return '<button data-g="'+n+'"'+act+(en?'':' disabled')+
         (cl?' class="'+cl+'"':'')+' aria-label="'+esc(lb)+'">'+
         geIcon(n)+'<span class="gcap">'+esc(lb)+'</span></button>';
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
  return '<div class="view">'+
    navTop(pts)+
    '<div class="body" style="padding-bottom:calc(env(safe-area-inset-bottom,0) + 120px)">'+
    '<div class="gcanvwrap"><canvas id="gcanv" class="gcanv"></canvas></div>'+
    geRail(st, pts)+
    '<div class="ghintwrap"><canvas id="ghint" class="ghint"></canvas></div>'+
    '</div>'+
    '<div class="barfix">'+
      '<button class="btn ghost"' + DO('back') + '>'+t('glyph.cancel')+'</button>'+
      '<button class="btn"' + DO('geSave') + '>'+t('glyph.save')+'</button>'+
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
function geShape(st){
  /* Prefer what the finger actually did. The snapped copy is a staircase
     wherever the gesture was not straight, and no amount of corner-rounding
     turns a staircase into a curve. Only the two ends go back onto the
     lattice, because that is what lets one stroke meet another. */
  var raw = (GE.round && GE.raw && GE.rawFor===GE.si && GE.raw.length>3) ? GE.raw : null;
  var p = raw || st.pts, n = p.length;
  if(n<3){ delete st.k; delete st.closed; return; }
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
  if(!GE.round){ st.pts=s; return; }
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
  for(i=1;i<s.length-1;i++) s[i][2]='c';
  st.pts=geLattice(s);
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
  /* a shape that collapsed to one dot is not a shape */
  if(out.length<2) return p;
  /* the ends are never rounded: a corner needs something on both sides */
  if(out[0][2]) out[0]=[out[0][0], out[0][1]];
  if(out[out.length-1][2]) out[out.length-1]=[out[out.length-1][0], out[out.length-1][1]];
  return out;
}
function geCircle(){
  geMark();
  GE.round=!GE.round;
  if(GE.round){
    var st=GE.st[GE.st.length-1];
    if(st && st.pts.length>=2) geShape(st);
  }
  GE.pi=-1; render();
}
function geUndo(){
  if(!GE.undo.length) return;
  GE.st=JSON.parse(GE.undo.pop());
  GE.si=GE.st.length-1; GE.pi=-1;
  /* What comes back from undo is a finished drawing, not a stroke still under
     the finger, so it is sealed like one. Left open, the last stroke's dots
     stayed live and the next press -- meant to begin a new line -- landed on
     one of them and dragged the old line out of shape instead. */
  GE.seal=!!(GE.st.length && GE.st[GE.st.length-1].pts.length);
  render();
}
function geClear(){ geMark(); GE.st=[]; GE.si=-1; GE.pi=-1; GE.seal=false; render(); }
function geSave(){
  /* A single dot is a stroke half-placed, not a shape. It does not get
     saved, and it does not get left behind for the next press to trip on. */
  var keep=GE.st.filter(function(s){ return s.pts.length>1; });
  ltSetStrokes(GE.lid, keep);
  /* Drawing a letter is asking for your own writing. Only onboarding ever set
     this, so every letter drawn in the letters chapter went into a font that
     nothing had been told to use -- which is 「単語に自作文字出てこない」. */
  if(keep.length) SET.myfont=true;
  save();
  installScriptFont();
  var r=GE.r, snd=(ltById(GE.lid)||{}).snd||[];
  GE=null;
  back();
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
function cssVar(n){
  return (getComputedStyle(document.documentElement).getPropertyValue(n)||'').trim()||'#888';
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
  c.onpointerdown=geDown; c.onpointermove=geMove;
  c.onpointerup=geUp; c.onpointercancel=geUp;
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
var GHINT={raf:0, t0:0, mode:''};
var GHP=[[400,184],[616,544],[184,544]];
var GHTAP=[0.9,1.7,2.5,3.5];
var GHCYC=5.2;
/* ---- and what each button does -------------------------------------------
   A name only helps if you already know the thing it names, and both of these
   are dim until the drawing is far enough along to allow them — which is
   exactly when you most want to know. So the square below the rail answers
   instead: touch either button and it shows that button's before and after,
   drawn with the same lattice, pen and glyphContours() as the canvas above. A
   dim button still answers; it just does not act. Nothing to read, so it is
   the same answer in every language. */
var GHDCYC=3.4;
var GHDEMO={
  'circle': { a:[{pts:[[184,616],[400,184],[616,616]]}],
              b:[{pts:[[184,616],[400,184],[616,616]], k:'o'}], m:[400,184] },
  'new'   : { a:[{pts:[[256,256],[256,544]]}],
              b:[{pts:[[256,256],[256,544]]},{pts:[[472,256],[616,256],[616,544]]}], m:[472,256] }
  /* 'new' is kept only so the hint reel still has its demonstration; no
     button calls it any more -- lifting the finger starts the next stroke. */
};
function ghShow(k){
  if(!GHDEMO[k]) return;
  GHINT.mode=k; GHINT.t0=0;
  if(!GHINT.raf && document.getElementById('ghint'))
    GHINT.raf=requestAnimationFrame(ghTick);
}
function ghMount(){
  var c=document.getElementById('ghint');
  if(GHINT.raf){ cancelAnimationFrame(GHINT.raf); GHINT.raf=0; }
  if(!c) return;
  var dpr=window.devicePixelRatio||1, box=c.getBoundingClientRect();
  var s=Math.round((box.width||190)*dpr);
  c.width=s; c.height=s;
  GHINT.t0=0; GHINT.mode='';
  GHINT.raf=requestAnimationFrame(ghTick);
}
function ghTick(ts){
  var c=document.getElementById('ghint');
  if(!c){ GHINT.raf=0; return; }     /* the view moved on; stop by itself */
  if(!GHINT.t0) GHINT.t0=ts;
  var t=(ts-GHINT.t0)/1000;
  if(GHINT.mode) ghDemo(c, t%GHDCYC, GHINT.mode);
  else ghDraw(c, t%GHCYC);
  GHINT.raf=requestAnimationFrame(ghTick);
}
/* the square and its dots: a picture of the canvas above, drawn in the plain
   rule rather than the gold one so it does not read as a second canvas to tap */
function ghField(x,S,k){
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
function ghInk(x,k,strokes){
  inkStrokes(x, strokes, k, 0, 0, cssVar('--tx'));
  x.fillStyle=cssVar('--gold');
  strokes.forEach(function(s){
    s.pts.forEach(function(q){
      x.beginPath(); x.arc(q[0]*k,q[1]*k,k*16,0,Math.PI*2); x.fill();
    });
  });
}
function ghDemo(c,t,k){
  var d=GHDEMO[k];
  if(!d) return;
  var x=c.getContext('2d'), S=c.width, u=S/800;
  x.clearRect(0,0,S,S);
  x.globalAlpha = t>GHDCYC-0.45 ? Math.max(0,(GHDCYC-t)/0.45) : 1;
  ghField(x,S,u);
  var done = t>=1.35;
  ghInk(x,u, done ? d.b : d.a);
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
function ghEase(u){
  if(u<0) u=0; if(u>1) u=1;
  return u<0.5 ? 2*u*u : 1-2*(1-u)*(1-u);
}
function ghSeg(t,t0,t1,a,b){
  var u=ghEase((t-t0)/(t1-t0));
  return [a[0]+(b[0]-a[0])*u, a[1]+(b[1]-a[1])*u];
}
/* four taps round a square, then a fifth back on the dot it started from —
   which is the whole of "join", shown rather than named */
/* three dots and then back to the first one, which is the whole of "join",
   shown rather than named */
function ghPos(t){
  var A=GHP[0], B=GHP[1], C=GHP[2];
  if(t<0.9) return ghSeg(t,0,0.9,[80,740],A);
  if(t<1.1) return A;
  if(t<1.7) return ghSeg(t,1.1,1.7,A,B);
  if(t<1.9) return B;
  if(t<2.5) return ghSeg(t,1.9,2.5,B,C);
  if(t<2.7) return C;
  if(t<3.5) return ghSeg(t,2.7,3.5,C,A);
  return A;
}
function ghDraw(c,t){
  var x=c.getContext('2d'), S=c.width, k=S/800, i, j;
  x.clearRect(0,0,S,S);
  x.globalAlpha = t>GHCYC-0.6 ? Math.max(0,(GHCYC-t)/0.6) : 1;

  ghField(x,S,k);

  var n=0;
  for(i=0;i<3;i++) if(t>=GHTAP[i]) n=i+1;
  var pts=[];
  for(i=0;i<n;i++) pts.push([GHP[i][0],GHP[i][1]]);
  ghInk(x,k,[{pts:pts, closed:(t>=GHTAP[3])}]);

  /* the tap itself: a ring that opens where the finger landed. The last one
     lands back on the first dot, and the shape shuts. */
  for(i=0;i<GHTAP.length;i++){
    var d=t-GHTAP[i], hp=GHP[i===3?0:i];
    if(d<0 || d>0.45) continue;
    x.beginPath();
    x.arc(hp[0]*k, hp[1]*k, k*(16+d/0.45*46), 0, Math.PI*2);
    x.strokeStyle=cssVar('--gold'); x.lineWidth=k*5;
    var was=x.globalAlpha; x.globalAlpha=was*(1-d/0.45);
    x.stroke(); x.globalAlpha=was;
  }

  var pos=ghPos(t), ahead=ghPos(t+0.06), ang;
  if(ahead[0]===pos[0] && ahead[1]===pos[1]){
    var back=ghPos(t-0.06);
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
function geXY(c,ev){
  var b=c.getBoundingClientRect();
  var w=b.width||1, h=b.height||1, px=w*GEPAD, py=h*GEPAD;
  return [((ev.clientX-b.left)-px)/(w-2*px)*800,
          ((ev.clientY-b.top)-py)/(h-2*py)*800];
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
    }
    st.pts.push([p[0],p[1]]); GE.pi=st.pts.length-1;
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
    var rst=GE.st[GE.si]; if(rst) geShape(rst);
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
  /* Tapping builds too, and needs no mode. Two dots are a line. A third and
     any after it bend that line through themselves, in the order they were
     put. Round is for the finger, not for this. */
  if(!GE.moved && !GE.hit){
    var tst=GE.st[GE.si];
    if(tst && tst.pts.length>=3){
      delete tst.k;
      for(var ti=1; ti<tst.pts.length-1; ti++) tst.pts[ti][2]='c';
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
    if(fresh || GE.moved || GE.hit){
      GE.undo.push(GE.pre);
      if(GE.undo.length>60) GE.undo.shift();
    }
  }
  GE.pre=null;
  geDraw(); geTools();
}
/* The toolbar's enabled/disabled state depends on the selection, and the
   selection changes on every tap — but re-rendering the whole view would tear
   the canvas down mid-gesture. So only the toolbar is redrawn. */
/* Round, undo, clear. NEW used to sit here and is gone: a stroke ends when
   the finger lifts, so there was nothing left for it to start. Undo and clear
   were words in a corner underneath; they are marks on the rail now, at the
   same size as everything else a thumb has to hit. */
function geRail(st, pts){
  return '<div class="gtools">'+
    geBtn('geCircle','circle','glyph.circle', true, !!GE.round)+
    geBtn('geUndo','undo','glyph.undo', !!GE.undo.length, false)+
    geBtn('geClear','clear','glyph.clear', !!pts, false)+
  '</div>';
}

function geTools(){
  var box=document.querySelector('.gtools');
  if(!box) return;
  var st=GE.st[GE.si], pts=0;
  GE.st.forEach(function(s){ pts+=s.pts.length; });
  /* Keyed by name, not by position: the row can be reordered or added to
     without this quietly disabling the wrong button. */
  var S={ 'circle':[true, !!GE.round],
          'undo'  :[!!GE.undo.length, false],
          'clear' :[!!pts, false] };
  var b=box.getElementsByTagName('button'), i, s, g, cl;
  for(i=0;i<b.length;i++){
    g=b[i].getAttribute('data-g'); s=S[g];
    if(!s) continue;
    if(GHDEMO[g]){
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
  var cn=document.querySelector('.chap .cn');
  if(cn) cn.textContent=String(pts);
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
  var pad=S*GEPAD, k=(S-2*pad)/800;
  var X=function(v){ return pad+v*k; };
  x.clearRect(0,0,S,S);
  x.strokeStyle=cssVar('--goldln'); x.lineWidth=Math.max(1,k*2.5);
  x.strokeRect(k*3,k*3,S-k*6,S-k*6);
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
      x.arc(X(GGRID.inset+gi*gs), X(GGRID.inset+gj*gs), Math.max(2,k*gs*0.115), 0, Math.PI*2);
      x.fill();
    }
  }

  /* The ink, through the one function that lays ink down. X(v) is pad+v*k,
     which is exactly what inkStrokes does with an origin -- so the letter you
     are drawing is drawn by the same code as the letter on the key, the tile
     and the card. It was not, and a letter could have looked like one thing
     under your finger and another everywhere else. */
  inkStrokes(x, GE.st, k, pad, pad, cssVar('--tx'));

  x.strokeStyle=cssVar('--goldln'); x.lineWidth=Math.max(1,k*2);
  GE.st.forEach(function(s){
    if(s.pts.length<2) return;
    var poly=LinguaFont.toPolyline(s);
    x.beginPath();
    poly.forEach(function(p,i){ if(i) x.lineTo(X(p[0]),X(p[1])); else x.moveTo(X(p[0]),X(p[1])); });
    x.stroke();
  });
  GE.st.forEach(function(s,si){
    s.pts.forEach(function(p,pi){
      var sel=(si===GE.si && pi===GE.pi);
      x.beginPath(); x.arc(X(p[0]),X(p[1]),k*(sel?24:16),0,Math.PI*2);
      x.fillStyle = (p[2]==='c') ? cssVar('--pur') : cssVar('--gold');
      x.fill();
      if(sel){
        x.beginPath(); x.arc(X(p[0]),X(p[1]),k*40,0,Math.PI*2);
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
function inkStrokes(x, st, k, ox, oy, col){
  var cont=[];
  try{ cont=LinguaFont.glyphContours({strokes:st}, GPEN); }catch(e){ return; }
  x.fillStyle=col;
  cont.forEach(function(poly){
    if(poly.length<3) return;
    x.beginPath();
    poly.forEach(function(p,j){
      if(j) x.lineTo(ox+p[0]*k, oy+p[1]*k); else x.moveTo(ox+p[0]*k, oy+p[1]*k);
    });
    x.closePath(); x.fill();
  });
}
/* What a canvas is a picture of: a letter named by its id in data-l, or
   whatever writes the sound named in data-r. Null when there is nothing
   drawn to show. */
function inkOf(lid, sym){
  var st = lid? ((ltById(lid)||{}).st||null) : wsStrokes(sym);
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
    inkStrokes(c.getContext('2d'), st, S/800, 0, 0, cssVar('--tx'));
  }
}
function phkMount(){ inkCanvases('canvas.pkc', 40, 34); }
/* The tiles on the letter grid are the same ink again, scaled down. */
function geTiles(){ inkCanvases('canvas.tc', 48, 72); }

/* =========================================================================
   14. Drawing
   ========================================================================= */

/* =========================================================================
   Advisor — the companion that walks alongside the language.
   Free accounts get a small daily allowance; Plus removes the ceiling, which
   is what makes the advisor the main reason to upgrade.
   ========================================================================= */
var AI_FREE_DAILY = 3;
function aiToday(){ var d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function aiUsed(){ if(SET.aiDate!==aiToday()){ SET.aiDate=aiToday(); SET.aiN=0; save(); } return SET.aiN||0; }
function aiSpend(){ if(has('plus')) return; SET.aiDate=aiToday(); SET.aiN=aiUsed()+1; save(); }

/* AI_SEAM — where the hosted model plugs in.
   A browser cannot hold an API key, so the request must go through your own
   endpoint, which then calls Claude (model "claude-opus-5") server-side and
   returns the text. Until that endpoint exists, the advice below is computed
   here from the language itself, which is why it still says something true. */



/* Which screen the markup on the page belongs to, so the next render can tell
   a redraw of this one from a move to another. */
var RENDERED=null;
function render(){
  /* the document's own language, so the browser picks the right font and
     line-breaking for it — and so the CSS above can drop Latin tracking */
  document.documentElement.setAttribute('lang', uiLang());
  /* Onboarding returns before the mount hooks at the foot of this function,
     so the editor it embeds has to be mounted here or its canvas stays blank.
     Every editor action ends in render(), which lands back on this line. */
  if(!SET.done){
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
  var y = same ? (window.scrollY || window.pageYOffset || 0) : 0;
  RENDERED=route;
  /* the entrance animation belongs to arriving, not to redrawing */
  app.setAttribute('data-fresh', same ? '0' : '1');
  app.innerHTML=v;
  window.scrollTo(0, y);
  /* the canvases have to be filled after the HTML exists, and sized in device
     pixels, which is something no markup can say */
  if(route==='glyph'){ geMount(); ghMount(); }
  /* Which screens have canvases on them was a list of route names here, and
     a list of route names is a thing that goes out of date the moment a screen
     is split in two -- the letters chapter became three pages and every digit
     on them was an empty box. Both of these ask the document what is on it
     instead, which is the same fix the onboarding's canvas got above: they
     find nothing and do nothing on a screen that has none. */
  geTiles(); phkMount(); postFaces();
  if(route==='form') formMount();
}
