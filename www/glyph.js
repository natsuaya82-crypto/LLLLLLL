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
var GPEN={width:60, angleDeg:0, contrast:1.0};

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
/* A stroke drawn in one go can be long, but not unbounded: past this it is
   a scribble, and every point is a corner the font writer has to round. */
var GE_MAXPTS=24;
function gstep(){ return (800 - GGRID.inset*2) / (GGRID.n - 1); }
function gsnap(v){
  var s=gstep(), i=Math.round((v - GGRID.inset) / s);
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

/* 'sh' cannot be a glyph name with a codepoint, so it becomes s_h and is
   reached by a ligature. Same rule as the spike, same names. */
function glyphKey(r){ return r.length>1 ? r.split('').join('_') : r; }

/* The alphabet the script has to cover: every sound your words already use,
   plus anything you added by hand, plus anything you have already drawn. It
   grows on its own as the dictionary does. */
function scriptLetters(){
  var A=analyze(), seen={}, out=[];
  function push(c){ if(c && /^[a-z]{1,3}$/.test(c) && !seen[c]){ seen[c]=1; out.push(c); } }
  A.used.forEach(push);
  (A.vowels||[]).forEach(push);
  SCRIPT.extra.forEach(push);
  Object.keys(SCRIPT.g).forEach(push);
  out.sort();
  return out;
}
function scriptDrawn(L){
  var n=0;
  L.forEach(function(r){ if(SCRIPT.g[r] && SCRIPT.g[r].length) n++; });
  return n;
}

/* One glyph per letter, plus the single letters a digraph is spelled with —
   a ligature needs its own components to exist as glyphs even when your script
   never shows them alone. Upper and lower case map to the same drawing,
   because a script you invented has no case unless you draw one. */
function scriptGlyphDefs(){
  var L=scriptLetters(), have={}, defs=[], ligs=[], need=[];
  L.forEach(function(r){ have[r]=1; });
  L.forEach(function(r){
    if(r.length>1) r.split('').forEach(function(c){ if(!have[c]){ have[c]=1; need.push(c); } });
  });
  L.concat(need).sort().forEach(function(r){
    var st=SCRIPT.g[r];
    defs.push({
      name: glyphKey(r),
      roman: r.length===1 ? r+r.toUpperCase() : null,
      strokes: (st && st.length) ? st : GPLACE
    });
    if(r.length>1) ligs.push({sub:r.split(''), by:glyphKey(r)});
  });
  return {defs:defs, ligs:ligs};
}

/* Build the font and hand it to the browser as a @font-face. This runs on the
   device, in about a millisecond, and touches no network. */
var SFONT={built:false, sig:null};
/* What the font is made of, in one string. The alphabet grows on its own as
   the dictionary does, so a word written today can need a letter the font was
   not built with — this is how the page notices without rebuilding on every
   render. Building costs about a millisecond, so it is cheap to be right. */
function scriptSig(){
  var L=scriptLetters(), s=[];
  L.forEach(function(r){
    var g=SCRIPT.g[r];
    s.push(r+':'+(g? JSON.stringify(g).length : 0));
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
    var f=LinguaFont.build(d.defs, {mode:'center', pen:GPEN, ligatures:d.ligs,
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

/* ---- the letter grid ---------------------------------------------------- */
function vScript(){
  var L=scriptLetters(), drawn=scriptDrawn(L);
  var sample = WORDS.length ? WORDS[0].hw : (langName || L.slice(0,5).join(''));
  var line = LINES.length ? LINES[LINES.length-1].ws.join(' ')
           : WORDS.slice(0,4).map(function(w){return w.hw;}).join(' ');
  return '<div class="view"><div class="chead">'+
    '<button class="back nb" onclick="go(\'home\')">'+ICON_BACK+t('nav.contents')+'</button>'+
    '<div class="chap"><span class="rn">VI</span><span class="ct">'+esc(t('toc.script'))+'</span>'+
    '<span class="cn">'+drawn+' / '+L.length+'</span></div></div>'+
    '<div class="body">'+
    (drawn
      ? '<div class="sec">'+t('script.preview')+'</div>'+
        '<div class="spv">'+
          '<div class="big sfont">'+esc(sample)+'</div>'+
          (line? '<div class="sm sfont">'+esc(line)+'</div>':'')+
          '<div class="rom">'+esc(sample)+'</div>'+
        '</div>'+
        '<div class="sec">'+t('script.show')+'</div>'+
        '<div class="pick">'+
          '<button class="'+(SET.myfont?'':'on')+'" onclick="setMyFont(false)">'+t('script.show.roman')+'</button>'+
          '<button class="'+(SET.myfont?'on':'')+'" onclick="setMyFont(true)">'+t('script.show.own')+'</button>'+
        '</div>'+
        '<div class="note">'+t('script.show.note')+'</div>'
      : '<div class="note">'+t('script.needs')+'</div>')+
    '<div class="sec">'+t('script.letters')+'</div>'+
    (L.length
      ? '<div class="gtiles">'+L.map(function(r,i){
          var has=SCRIPT.g[r] && SCRIPT.g[r].length;
          return '<button class="gtile'+(has?'':' empty')+'" onclick="editGlyph(\''+r+'\')">'+
            (has? '<canvas class="tc" data-r="'+r+'"></canvas>' : '<span>'+r+'</span>')+
            '<span class="rl">'+r+'</span></button>';
        }).join('')+
        '<button class="gtile add" onclick="addLetter()">+</button></div>'
      : '<div class="empty"><div class="eb">'+t('script.empty.t')+'</div>'+
        '<div class="es">'+t('script.empty.s')+'</div></div>'+
        '<button class="btn" onclick="addLetter()" style="margin-top:6px">'+t('script.add')+'</button>')+
    '<div class="note" style="margin-top:18px">'+t('script.note')+'</div>'+
    '</div></div>';
}
function addLetter(){
  var v=prompt(t('script.add.prompt'),'');
  if(v===null) return;
  v=String(v).toLowerCase().replace(/[^a-z]/g,'');
  if(!v || v.length>3){ toast(t('script.add.bad')); return; }
  if(SCRIPT.extra.indexOf(v)<0) SCRIPT.extra.push(v);
  save(); editGlyph(v);
}

/* ---- the editor --------------------------------------------------------- */
/* GE is the letter being drawn. st is the same stroke list the font writer
   eats, so what you see on the canvas and what ends up in the font are the
   same numbers going through the same code — not two drawings that agree. */
var GE=null;
function newGE(r){
  var src=SCRIPT.g[r]||[];
  /* A letter opened for editing is finished work, the same as a drawing
     handed back by undo, so it opens sealed: the first press starts a new
     stroke instead of picking up the last one you drew last time. Only what
     is drawn in this sitting, before the finger comes up, can be grabbed. */
  return { r:r, st:JSON.parse(JSON.stringify(src)),
           si:src.length?src.length-1:-1, pi:-1, undo:[], pre:null,
           drag:false, hit:false, again:false, moved:false, fresh:false,
           free:false, round:false,
           seal:!!(src.length && src[src.length-1].pts.length) };
}
function editGlyph(r){ GE=newGE(r); go('glyph'); }
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
function gicon(n){ return '<svg viewBox="0 0 24 24" aria-hidden="true">'+GICON[n]+'</svg>'; }
function gbtn(fn,n,key,en,on){
  var lb=t(key), cl=on?'on':'', act=fn+'()';
  /* A button that can demonstrate itself stays tappable when it is unavailable
     — it goes dim and does nothing, but it still answers "what is this". The
     two history buttons have nothing to show, so those are plainly disabled. */
  if(GHDEMO[n]){
    if(!en) cl=cl?cl+' off':'off';
    act=act+";ghShow('"+n+"')";   /* after, because acting redraws the view */
    return '<button data-g="'+n+'" onclick="'+act+'"'+(en?'':' aria-disabled="true"')+
           (cl?' class="'+cl+'"':'')+' aria-label="'+esc(lb)+'">'+
           gicon(n)+'<span class="gcap">'+esc(lb)+'</span></button>';
  }
  return '<button data-g="'+n+'" onclick="'+act+'"'+(en?'':' disabled')+
         (cl?' class="'+cl+'"':'')+' aria-label="'+esc(lb)+'">'+
         gicon(n)+'<span class="gcap">'+esc(lb)+'</span></button>';
}
function vGlyph(){
  /* GE is always set by editGlyph before this is routed to; the fallback is
     for the release check, which walks every view cold. */
  if(!GE) GE=newGE('a');
  var st=GE.st[GE.si], p=(st && GE.pi>=0)? st.pts[GE.pi] : null;
  var pts=0;
  GE.st.forEach(function(s){ pts+=s.pts.length; });
  return '<div class="view"><div class="chead">'+
    '<button class="back nb" onclick="go(\'script\')">'+ICON_BACK+esc(t('toc.script'))+'</button>'+
    '<div class="chap"><span class="rn">VI</span><span class="ct">'+esc(GE.r)+'</span>'+
    '<span class="cn">'+pts+'</span></div></div>'+
    '<div class="body" style="padding-bottom:calc(env(safe-area-inset-bottom,0) + 120px)">'+
    '<div class="gcanvwrap"><canvas id="gcanv" class="gcanv"></canvas></div>'+
    geRail(st, pts)+
    '<div class="ghintwrap"><canvas id="ghint" class="ghint"></canvas></div>'+
    '</div>'+
    '<div class="barfix">'+
      '<button class="btn ghost" onclick="go(\'script\')">'+t('glyph.cancel')+'</button>'+
      '<button class="btn" onclick="geSave()">'+t('glyph.save')+'</button>'+
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
function geFull(st){
  return !!st && (!!st.closed || st.k==='o' || st.pts.length>=3);
}
/* A shape you can carry on from has an end to carry on from. A circle and a
   joined line do not, so the next mark starts on its own. */
function geTail(st){
  if(!geFull(st) || st.closed || (st.k==='o' && st.pts.length<3)) return null;
  return st.pts[st.pts.length-1];
}
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
/* Take the path a finger actually drew and say what curve it meant.

   Three points is all the format needs for an arc: where it started, where it
   ended, and the one place in between that is furthest off the straight line
   between them. Everything else in the path is hand tremor. Drawing a curve
   by hand and then placing exactly three points on it was the hard part --
   this does the placing.

   Two things it refuses to do. A path that never leaves its own chord was a
   straight line and stays one, because two points marked round are read as
   the ends of a circle and would balloon into a half-circle nobody drew. And
   a path that comes back to where it started is a ring, so it closes. */
function geRoundify(st){
  var p=st.pts, n=p.length, i, d;
  if(n<2) return;
  var a=p[0], b=p[n-1], step=gstep();
  var far=null, fd=-1;
  for(i=1;i<n-1;i++){ d=geOff(a,b,p[i]); if(d>fd){ fd=d; far=p[i]; } }
  var span=Math.sqrt((b[0]-a[0])*(b[0]-a[0])+(b[1]-a[1])*(b[1]-a[1]));
  if(n>4 && span<=step*1.2){
    /* back where it began: keep three points spread around the loop */
    st.pts=[p[0], p[Math.floor(n/3)], p[Math.floor(2*n/3)]];
    st.k='o'; st.closed=true; return;
  }
  /* How far the path has to bow before it counts as a curve. Snapping a
     drag to the lattice turns even a ruler-straight diagonal into a
     staircase, and the corners of that staircase stand up to three quarters
     of a step off the line -- so anything under that is the lattice talking,
     not the hand. Long strokes need proportionally more, or a slight lean
     across the whole width reads as a bow. */
  if(far && fd>Math.max(step*0.75, span*0.08)){ st.pts=[a,far,b]; st.k='o'; delete st.closed; }
  else { st.pts=[a,b]; delete st.k; delete st.closed; }
}
/* Round is a mode, not an operation. Switched on, every stroke drawn from
   then on is read as a curve -- which is the only way a curve drawn at an
   angle was ever going to come out as one. It also rounds the stroke just
   drawn, so pressing it straight after a line does what it looks like it
   does. */
function geCircle(){
  geMark();
  GE.round=!GE.round;
  if(GE.round){
    var st=GE.st[GE.st.length-1];
    if(st && st.pts.length>=2 && st.k!=='o') geRoundify(st);
  }
  GE.pi=-1; render();
}
function geNew(){
  var st=GE.st[GE.si];
  if(!st || !st.pts.length) return;
  geMark(); GE.st.push({pts:[]}); GE.si=GE.st.length-1; GE.pi=-1; GE.seal=false; render();
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
  var keep=GE.st.filter(function(s){ return s.pts.length>0; });
  if(keep.length) SCRIPT.g[GE.r]=keep; else delete SCRIPT.g[GE.r];
  var i=SCRIPT.extra.indexOf(GE.r);
  if(i>=0 && keep.length) SCRIPT.extra.splice(i,1);   /* it is a real letter now */
  save();
  installScriptFont();
  var r=GE.r; GE=null;
  go('script');
  toast(t('glyph.saved', r));
}

/* ---- canvas ------------------------------------------------------------- */
function cssVar(n){
  return (getComputedStyle(document.documentElement).getPropertyValue(n)||'').trim()||'#888';
}
function geMount(){
  var c=document.getElementById('gcanv');
  if(!c||!GE) return;
  var dpr=window.devicePixelRatio||1;
  var box=c.getBoundingClientRect();
  var s=Math.round((box.width||300)*dpr);
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
  var gs=gstep();
  x.fillStyle=cssVar('--line2');
  for(i=0;i<GGRID.n;i++) for(j=0;j<GGRID.n;j++){
    x.beginPath();
    x.arc(k*(GGRID.inset+i*gs), k*(GGRID.inset+j*gs), Math.max(1,k*gs*0.075),0,Math.PI*2);
    x.fill();
  }
}
/* the ink, through the font's own outliner, and the points still on top of it */
function ghInk(x,k,strokes){
  var cont=[];
  try{ cont=LinguaFont.glyphContours({strokes:strokes}, GPEN); }catch(e){}
  x.fillStyle=cssVar('--tx');
  cont.forEach(function(poly){
    if(poly.length<3) return;
    x.beginPath();
    poly.forEach(function(q,qi){ if(qi) x.lineTo(q[0]*k,q[1]*k); else x.moveTo(q[0]*k,q[1]*k); });
    x.closePath(); x.fill();
  });
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
function geAt(c,ev){
  var b=c.getBoundingClientRect();
  var w=b.width||1, h=b.height||1, px=w*GEPAD, py=h*GEPAD;
  var x=((ev.clientX-b.left)-px)/(w-2*px)*800;
  var y=((ev.clientY-b.top)-py)/(h-2*py)*800;
  return [gsnap(x), gsnap(y)];
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
    if(GE.seal || geFull(st)){
      GE.st.push({pts:[]}); GE.si=GE.st.length-1; st=GE.st[GE.si]; GE.seal=false;
    }
    st.pts.push([p[0],p[1]]); GE.pi=st.pts.length-1;
    GE.again=false; GE.hit=false;
    /* A point placed on empty lattice is the start of a line if the finger
       keeps going. geMove turns it into one. Before this, pressing and
       dragging moved the point you had just put down, so a line took two
       separate taps and nobody found that out by trying. */
    GE.fresh=true; GE.free=true;
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
    if(GE.round){ var rst=GE.st[GE.si]; if(rst) geRoundify(rst); }
  }
  GE.free=false;
  /* A dot that was pressed and let go without travelling is a tap, and a tap
     on a dot that is already there is one of the two answers. Dragging the
     same dot is a move — so the finger, not a mode, tells them apart. */
  if(GE.hit && !GE.moved){
    var st=GE.st[GE.si];
    if(st && GE.again){
      st.pts.splice(GE.pi,1);
      if(st.k==='o' && st.pts.length<2) delete st.k;
      if(!st.pts.length){ GE.st.splice(GE.si,1); GE.si=GE.st.length-1; }
      GE.pi=-1;
    }else if(st && GE.pi===0 && st.pts.length>2){
      if(st.closed) delete st.closed; else st.closed=true;
      GE.pi=-1;
    }
  }
  GE.hit=false; GE.again=false;
  if(GE.pre && GE.pre!==JSON.stringify(GE.st)){
    GE.undo.push(GE.pre);
    if(GE.undo.length>60) GE.undo.shift();
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
    gbtn('geCircle','circle','glyph.circle', true, !!GE.round)+
    gbtn('geUndo','undo','glyph.undo', !!GE.undo.length, false)+
    gbtn('geClear','clear','glyph.clear', !!pts, false)+
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
  var gs=gstep(), gi, gj;
  /* --line2 is 5% white. On a desk that reads as a lattice; on a phone in
     daylight it reads as nothing, and a lattice you cannot see is a lattice
     that is not there -- which is the one thing this surface has to show. */
  x.fillStyle=cssVar('--dot');
  for(gi=0; gi<GGRID.n; gi++){
    for(gj=0; gj<GGRID.n; gj++){
      x.beginPath();
      /* the dot scales with the step, so 100 dots do not read as a grey wash */
      x.arc(X(GGRID.inset+gi*gs), X(GGRID.inset+gj*gs), Math.max(1.5,k*gs*0.095), 0, Math.PI*2);
      x.fill();
    }
  }

  var cont=[];
  try{ cont=LinguaFont.glyphContours({strokes:GE.st}, GPEN); }catch(e){}
  x.fillStyle=cssVar('--tx');
  cont.forEach(function(poly){
    if(poly.length<3) return;
    x.beginPath();
    poly.forEach(function(p,i){ if(i) x.lineTo(X(p[0]),X(p[1])); else x.moveTo(X(p[0]),X(p[1])); });
    x.closePath(); x.fill();
  });

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
/* The tiles on the letter grid are the same ink again, scaled down. */
function geTiles(){
  var els=document.querySelectorAll('.gtile canvas.tc');
  for(var i=0;i<els.length;i++){
    var c=els[i], r=c.getAttribute('data-r'), st=SCRIPT.g[r];
    if(!st) continue;
    var dpr=window.devicePixelRatio||1, box=c.getBoundingClientRect();
    var S=Math.max(48,Math.round((box.width||72)*dpr));
    c.width=S; c.height=S;
    var x=c.getContext('2d'), k=S/800, cont=[];
    try{ cont=LinguaFont.glyphContours({strokes:st}, GPEN); }catch(e){}
    x.fillStyle=cssVar('--tx');
    cont.forEach(function(poly){
      if(poly.length<3) return;
      x.beginPath();
      poly.forEach(function(p,j){ if(j) x.lineTo(p[0]*k,p[1]*k); else x.moveTo(p[0]*k,p[1]*k); });
      x.closePath(); x.fill();
    });
  }
}

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
function aiLeft(){ return has('plus') ? Infinity : Math.max(0, AI_FREE_DAILY-aiUsed()); }
function aiSpend(){ if(has('plus')) return; SET.aiDate=aiToday(); SET.aiN=aiUsed()+1; save(); }

/* AI_SEAM — where the hosted model plugs in.
   A browser cannot hold an API key, so the request must go through your own
   endpoint, which then calls Claude (model "claude-opus-5") server-side and
   returns the text. Until that endpoint exists, the advice below is computed
   here from the language itself, which is why it still says something true. */



function render(){
  /* the document's own language, so the browser picks the right font and
     line-breaking for it — and so the CSS above can drop Latin tracking */
  document.documentElement.setAttribute('lang', uiLang());
  /* Onboarding returns before the mount hooks at the foot of this function,
     so the editor it embeds has to be mounted here or its canvas stays blank.
     Every editor action ends in render(), which lands back on this line. */
  if(!SET.done){ app.innerHTML=vOb();
    if(ob.step===1 && ob.mode==='draw') geMount();
    return; }
  /* a word written since the font was built can need a letter it does not have */
  if(SFONT.sig!==null && SFONT.sig!==scriptSig()) installScriptFont();
  var v = route==='words'? vWords()
        : route==='sound'? vSound()
        : route==='rules'? vRules()
        : route==='sent' ? vSent()
        : route==='make' ? vMake()
        : route==='settings'? vSettings()
        : route==='plans'? vPlans()
        : route==='script'? vScript()
        : route==='glyph'? vGlyph()
        : vHome();
  /* one attribute decides whether words are shown in roman letters or in the
     ones you drew — the text itself never changes, only the family it is set in */
  document.documentElement.setAttribute('data-script', myFontOn()? 'on':'off');
  /* Replacing the view resets the scroll, which threw you to the top on every
     edit. Put it back; go() is what deliberately returns to the top. */
  var y = window.scrollY || window.pageYOffset || 0;
  app.innerHTML=v;
  if(y) window.scrollTo(0, y);
  /* the canvases have to be filled after the HTML exists, and sized in device
     pixels, which is something no markup can say */
  if(route==='glyph'){ geMount(); ghMount(); }
  if(route==='script') geTiles();
}
installScriptFont();
render();
