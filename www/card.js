/* Lingua — the card (chapter 15)
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   A picture of one line of the language, in the letters somebody drew, that
   can leave the phone.

   This is the only thing in the app that is meant to be seen by people who do
   not have it. A conlang read as roman letters is a string nobody can care
   about; the same line set in a script its author invented is the one part of
   this work that is legible to a stranger at a glance. So the card is the
   whole of the app's reach outward, and everything on it is there to survive
   being looked at for one second: the script large, the spelling small under
   it, the meaning under that, and nothing else.

   It follows the app's theme rather than carrying a light/dark switch of its
   own. A second palette here would be the two theme blocks in index.html
   written a third time, in JavaScript, where nothing could hold them to each
   other. If you want a card on paper, put the app on paper.
   ========================================================================= */

/* =========================================================================
   15. The card
   ========================================================================= */

/* What the card is of. `w` is a word, `x` is one of the sentences written
   under a word (`kano#0` is that word's first), `p` is a post. `sh` is the
   shape asked for, kept across a redraw so choosing one does not un-choose
   itself. */
var CARD={k:'w', v:'', sh:''};

/* The shapes a card can be made at. Sixteen by nine is what a link preview is
   cropped to on every timeline that is not Lingua's. A square is what a grid
   of pictures is. Nine by sixteen is what a phone held up is.

   There used to be one, and it was the reason a vertical script was laid
   across the card instead of down it: a column has nowhere to go in a band
   1920 wide and 1080 tall. That was true of the shape, not of the writing, so
   the shape is what changed. A language that runs down the page opens on a
   card that runs down the page.

   The picture is made at these sizes whatever the phone is, so a card saved
   on an old small screen is the same file as one saved on a new large one.
   What the preview is shown at is the CSS's business. */
var CARD_SHAPES=[{k:'16:9', w:1920, h:1080},
                 {k:'1:1',  w:1440, h:1440},
                 {k:'9:16', w:1080, h:1920}];
/* The font's cell, in the units strokes are drawn in. */
var CARD_CELL=800;

function cardOpen(kind, key){
  CARD={k:String(kind), v:String(key), sh:CARD.sh};
  openForm('card:'+CARD.k+'/'+CARD.v, t('card.title'),
    '<div class="cardbox"><canvas id="cardc" class="cardc"></canvas></div>'+
    cardShapesHTML()+
    '<button class="btn" style="width:100%;margin-top:18px"' + DO('cardSave') + '>'+
      t('card.save')+'</button>',
    cardMount);
}
function cardShapesHTML(){
  var cur=cardShape(), out='', i, sh;
  for(i=0;i<CARD_SHAPES.length;i++){
    sh=CARD_SHAPES[i];
    out+='<button class="seg'+(sh.k===cur? ' on':'')+'"'+DO('cardSetShape', [sh.k])+'>'+
      esc(sh.k)+'</button>';
  }
  return '<div class="segs" style="margin-top:14px;justify-content:center" role="group"'+
    ' aria-label="'+esc(t('card.shape'))+'">'+out+'</div>';
}
function cardSetShape(k){ CARD.sh=String(k); cardOpen(CARD.k, CARD.v); }
/* The shape it is made at: the one asked for, or -- until one is asked for --
   the one the writing itself wants. */
function cardShape(){
  var i;
  for(i=0;i<CARD_SHAPES.length;i++) if(CARD_SHAPES[i].k===CARD.sh) return CARD.sh;
  return cardSrc().dir.indexOf('ttb')===0? '9:16' : '16:9';
}
function cardSize(){
  var k=cardShape(), i;
  for(i=0;i<CARD_SHAPES.length;i++) if(CARD_SHAPES[i].k===k) return CARD_SHAPES[i];
  return CARD_SHAPES[0];
}
/* Arriving back here by the back button, when the form itself is gone. */
FORM_OPEN.card=function(rest){
  var i=String(rest||'').indexOf('/');
  if(i<0) return;
  cardOpen(rest.slice(0,i), rest.slice(i+1));
};

/* ---- what is on it ------------------------------------------------------
   A line in the language and what it means. A word is its spelling and its
   first meaning; a sentence is the line as written with its gloss under it.
   A card asked for a word that is gone falls back to the newest one, because
   an empty picture is worse than a picture of something else. */
function cardSrc(){
  /* The handle is whose the card is. On a post it is the post's, frozen when
     it was written; on a word or an example it is this person's, because
     those are things in the language that is open. */
  var v=CARD.v, i, w, ex, po, hd=meHandle(), nm=String(langName||'');
  /* A post is already a line with its meaning fixed to it, which is what a
     card is. Nothing to work out. */
  if(CARD.k==='p'){
    po=postById(v);
    if(po) return cardOfPost(po);
  }
  if(CARD.k==='x'){
    i=String(v).indexOf('#');
    w=findWord(i<0? v : v.slice(0,i));
    ex=(w && w.ex)? w.ex[parseInt(i<0? '0' : v.slice(i+1), 10)] : null;
    if(ex) return {line:String(ex.ln||''), mn:String(ex.gl || exGloss(ex.ln) || ''),
                   hd:hd, nm:nm, dir:scriptDir()};
  }
  w=findWord(v) || WORDS[WORDS.length-1];
  if(!w) return {line:'', mn:'', hd:hd, nm:nm, dir:scriptDir()};
  /* A word and an example are things in the language that is OPEN, so they
     run the way it runs. Only a post carries a direction of its own. */
  return {line:String(w.hw), mn:String(wMns(w)[0]||''), hd:hd, nm:nm,
          dir:scriptDir()};
}

/* The line as things to draw, left to right: a letter's strokes, a character
   it borrowed, or the gap between two words.

   A sound with no letter yet comes through as its own symbol rather than as
   nothing. A hole in the writing system is the truth about the language at
   that moment, and a card that quietly closed it would be the one place in
   the app that lies about how far along the work is. */
function cardUnits(line){
  var out=[], words=String(line||'').split(/\s+/), i, j, w, sp;
  for(i=0;i<words.length;i++){
    if(!words[i]) continue;
    if(out.length) out.push({sp:true});
    w=findWord(words[i]);
    sp=w? spOf(w) : null;
    if(sp && sp.length){
      for(j=0;j<sp.length;j++) out.push(cardUnit(sp[j].l, sp[j].u));
    } else {
      for(j=0;j<words[i].length;j++) out.push({tx:words[i].charAt(j)});
    }
  }
  return out;
}
function cardUnit(lid, u){
  var l=lid? ltById(lid) : ltMain(u), st;
  if(l && l.st && l.st.length) return {st:l.st};
  if(l && l.ch) return {tx:l.ch};
  st=wsStrokes(u);
  if(st && st.length) return {st:st};
  return {tx: chOf(u) || u};
}
/* ---- the line, measured the way the font measures it ---------------------
   Each unit gets the box it stands in and where its ink sits inside it, in
   cell units, on both axes: `w`/`dx` across and `h`/`dy` down, plus the ink's
   own corners so a run can be hung off them.

   inkAdv works all six out from the strokes by the one rule the font carries
   -- a letter is its own ink plus one step, half a step at each end -- so the
   gap between any two letters is one step whichever two meet. This screen
   used to set the line in square boxes of its own invention instead, one box
   per letter with a gap between boxes, which is a different rule and a worse
   one: a narrow letter floated in the middle of a box it did not fill, and
   the only picture that ever leaves the phone was the one place in the app
   the language was spaced wrong.

   A space is one whole cell, which is what otf5 gives it.

   A borrowed character has no strokes to measure, so it is measured in the
   face it will be drawn in and then given the same half step each side. Its
   ink is called from 0.185 to 0.85 of the cell so that its capitals stand
   where the drawn letters stand rather than floating above them. */
function cardMeasure(x, items){
  var i, u, a, side=geStep()/2, sz=Math.round(CARD_CELL*0.95);
  for(i=0;i<items.length;i++){
    u=items[i];
    u.ax=null;
    if(u.sp){ u.w=CARD_CELL; u.h=CARD_CELL; continue; }
    if(u.st){
      a=inkAdv(u.st);
      if(a){
        u.w=a.w; u.dx=a.dx; u.x0=a.x0; u.x1=a.x1;
        u.h=a.h; u.dy=a.dy; u.y0=a.y0; u.y1=a.y1;
        continue;
      }
      u.st=null; u.tx=u.tx||'';      /* strokes that ink nothing */
    }
    x.font=sz+'px '+CARD_CAPS;
    u.sz=sz;
    u.x0=0; u.x1=x.measureText(String(u.tx).toUpperCase()).width;
    u.y1=Math.round(CARD_CELL*0.85); u.y0=Math.round(u.y1-sz*0.70);
    u.w=Math.round((u.x1-u.x0)+side*2); u.dx=side;
    u.h=Math.round((u.y1-u.y0)+side*2); u.dy=Math.round(side-u.y0);
  }
  return items;
}
/* The corners of all the ink on the card at once. Along the run each letter is
   hung off its own edge -- that is the advance -- but across it they are hung
   off this one, which is what makes a line of them sit level instead of each
   letter sliding to wherever it happened to be drawn in its square. */
function cardExtent(items){
  var e={x0:Infinity, x1:-Infinity, y0:Infinity, y1:-Infinity}, i, u, any=false;
  for(i=0;i<items.length;i++){
    u=items[i];
    if(u.sp) continue;
    any=true;
    if(u.x0<e.x0) e.x0=u.x0;
    if(u.x1>e.x1) e.x1=u.x1;
    if(u.y0<e.y0) e.y0=u.y0;
    if(u.y1>e.y1) e.y1=u.y1;
  }
  return any? e : {x0:0, x1:CARD_CELL, y0:0, y1:CARD_CELL};
}
/* How long a run is, along the way it runs. */
function cardRun(run, vert){
  var i, n=0;
  for(i=0;i<run.length;i++) n += vert? run[i].h : run[i].w;
  return n;
}
/* The units broken into `n` runs -- lines across the card, or columns down it
   -- as evenly as the words allow. Only a space may be broken at: a word cut
   in half is not a shorter card, it is a wrong one. Null when there are not
   that many places to break. */
function cardBreak(items, n, vert){
  var runs=[[]], tot=0, acc=0, i, u, cut, left=0, need;
  for(i=0;i<items.length;i++){
    tot += vert? items[i].h : items[i].w;
    if(items[i].sp) left++;
  }
  cut = tot/n;
  for(i=0;i<items.length;i++){
    u=items[i];
    if(u.sp){
      left--;
      need = n - runs.length;
      /* Break here if the run has had its share, or if every space still to
         come is needed to make the count. Without the second half, walking on
         past a short run spent the last space it had and the layout could not
         be built at all -- and it was then silently passed over in favour of
         a worse one that could. */
      if(need>0 && runs[runs.length-1].length && (acc>=cut*0.75 || left<need)){
        runs.push([]); acc=0; continue;
      }
      if(!runs[runs.length-1].length) continue;   /* never at a run's head */
    }
    runs[runs.length-1].push(u);
    acc += vert? u.h : u.w;
  }
  if(runs.length<n || !runs[runs.length-1].length) return null;
  return runs;
}
/* The whole line placed inside the box it is given: how many runs to break it
   into, and how big the letters can be once it is.

   Every count from one run up to one per word is tried and the biggest
   letters win. A single long line shrunk to a thread across the middle was
   the old behaviour and it wasted the card twice over -- the letters too
   small to read and the space above and below them empty. Two lines of a
   sentence, or five columns of one, is the same ink at twice the size. */
function cardPlace(items, aw, ah, cap, vert){
  var ext=cardExtent(items), side=geStep()/2, best=null;
  var across=vert? LinguaFont.reach(ext.x0, ext.x1, side)
                 : LinguaFont.reach(ext.y0, ext.y1, side);
  var along=vert? ah : aw, cross=vert? aw : ah;
  var most=1, i, j, n, runs, len, k, held, score;
  for(i=0;i<items.length;i++) if(items[i].sp) most++;
  for(n=1;n<=most;n++){
    runs=cardBreak(items, n, vert);
    if(!runs) continue;
    len=0; held=0;
    for(i=0;i<runs.length;i++){
      len=Math.max(len, cardRun(runs[i], vert));
      for(j=0;j<runs[i].length;j++) if(runs[i][j].sp) held++;
    }
    if(!len || !across) continue;
    k=Math.min(along/len, cross/(runs.length*across), cap/CARD_CELL);
    /* Across a line, a space left standing is just a word space and there is
       nothing wrong with it. Down a column it is a whole cell of nothing
       between two words -- more than a letter's height in most alphabets --
       and it reads as the end of the column rather than as a gap inside it.
       One card came out as five columns with the first carrying two words:
       four letters, a hole, four letters hanging on their own below where the
       other four columns had ended. So a vertical layout is judged harder for
       every space it keeps, and only wins on size if it is a third bigger. */
    score=k*(vert? Math.pow(0.75, held) : 1);
    if(!best || score>best.score)
      best={score:score, k:k, runs:runs, ext:ext, across:across, len:len};
  }
  return best;
}
/* Where every unit goes, worked out before anything is drawn. Each drawable
   one is given the point its own square's origin lands on, so that drawing is
   the same two lines whichever way the writing runs.

   Right to left is the same run walked with the units handed over backwards,
   which puts the first letter of the line at the right-hand end of it. */
function cardLayout(items, lay, dir, vert, pad, top, aw, ah){
  var side=geStep()/2, k=lay.k, i, j, run, list, cur, off, at, u, len;
  var block=lay.runs.length*lay.across*k;
  var c0=vert? (pad+(aw-block)/2) : (top+(ah-block)/2);
  /* Lines are centred the way a title on a card is. Columns are not: they
     hang from the top of the block, all from the same one. Writing that runs
     down the page is read from the top down, and columns of unequal length
     each floated to the middle would give the eye no height to start at. */
  var head=vert? (top+(ah-lay.len*k)/2) : 0;
  for(i=0;i<lay.runs.length;i++){
    run=lay.runs[i];
    len=cardRun(run, vert)*k;
    /* Columns are read from the right on a ttb-rl script, so the first one is
       the last one across the card. */
    at=(vert && dir==='ttb-rl')? (lay.runs.length-1-i) : i;
    off=(vert? (c0+at*lay.across*k) + (side-lay.ext.x0)*k
             : (c0+at*lay.across*k) + (side-lay.ext.y0)*k);
    cur=vert? head : (pad+(aw-len)/2);
    list=(dir==='rtl')? run.slice().reverse() : run;
    for(j=0;j<list.length;j++){
      u=list[j];
      if(!u.sp){
        u.ax = vert? off : (cur + u.dx*k);
        u.ay = vert? (cur + u.dy*k) : off;
        u.k  = k;
      }
      cur += (vert? u.h : u.w)*k;
    }
  }
}
/* The ink, put on the canvas. Everything is decided by the time this runs --
   it is the last thing between the items and the picture, which is what
   tools/card-check.mjs watches, so the whole line comes through here once and
   in the order it is read. */
function cardInk(x, items){
  var i, u;
  for(i=0;i<items.length;i++){
    u=items[i];
    if(u.sp || u.ax===null || u.ax===undefined) continue;
    if(u.st){ inkStrokes(x, u.st, u.k, u.ax, u.ay, cssVar('--tx')); continue; }
    /* A sound with no letter stands in capitals at nearly the height of a
       drawn one. In lower case it came out half the size of the letters
       beside it, which reads as a small letter rather than as a gap. */
    x.fillStyle=cssVar('--tx');
    x.textAlign='left'; x.textBaseline='alphabetic';
    x.font=Math.round(u.sz*u.k)+'px '+CARD_CAPS;
    x.fillText(String(u.tx).toUpperCase(), u.ax+u.x0*u.k, u.ay+u.y1*u.k);
  }
}
/* The largest size at which a tracked string still fits the width it is given,
   with the canvas left set to it. `track` is a fraction of the size, the way
   tracking is written everywhere else.

   Tracking is measured rather than added on afterwards. Fitting the plain
   string and then letterspacing it is how the spelling under a long sentence
   came to run off the side of a narrow card: thirty letters of tracking is a
   fifth of the line again, and the fit had never heard of it. */
function cardFit(x, s, max, size, fam, track){
  var sz=size;
  x.font=sz+'px '+fam;
  while(sz>10 && cardTrackW(x, s, sz*track)>max){ sz-=2; x.font=sz+'px '+fam; }
  return sz;
}
/* A string allowed to spill onto a second line rather than shrink to nothing,
   inside a box `max` wide and `high` tall. A gloss is a sentence often enough
   that "shrink until it fits" put six point type under a foot of empty card.
   Broken between words only, and the size is the largest that fits in the
   lines allowed and in the room there is for them.

   `style` goes in front of the size, not after it: a canvas font is the CSS
   shorthand, so "64px italic Cormorant" is not a slower way of saying
   "italic 64px Cormorant" -- it is nothing at all, and the line silently
   keeps whatever font was set before it. */
function cardLines(x, s, max, high, size, fam, style, lines){
  var pre=style? style+' ' : '', sz=size, out;
  while(sz>10){
    x.font=pre+sz+'px '+fam;
    out=cardSplit(x, s, max, lines);
    if(out && out.length*cardLead(sz)<=high) return {sz:sz, ln:out};
    sz-=2;
  }
  x.font=pre+sz+'px '+fam;
  return {sz:sz, ln:[String(s)]};
}
function cardLead(sz){ return Math.round(sz*1.10); }
function cardSplit(x, s, max, lines){
  var words=String(s).split(/\s+/), out=[], cur='', i, join;
  for(i=0;i<words.length;i++){
    if(!words[i]) continue;
    join = cur? cur+' '+words[i] : words[i];
    if(x.measureText(join).width<=max){ cur=join; continue; }
    if(!cur) return null;                       /* one word wider than the line */
    out.push(cur); cur=words[i];
    if(out.length>=lines) return null;
  }
  if(cur) out.push(cur);
  return out.length? out : null;
}

/* The card is set in the app's own two faces: the capitals in Cinzel, the
   meaning in Cormorant italic, both already loaded by index.html. Georgia is
   behind each of them for the moment before a webfont arrives, and a fallback
   nobody sees is still the difference between a card and a blank square. */
var CARD_CAPS="'Cinzel', Georgia, serif";
var CARD_ITAL="'Cormorant Garamond', Georgia, serif";

/* Letterspaced, centred on cx. Canvas has no tracking on the webviews this
   has to run in, and every small capital in the app is tracked, so without
   this the card would be the one place the type looked like somebody else's. */
function cardTrack(x, s, cx, y, track){
  var i, cur = cx - cardTrackW(x, s, track)/2;
  x.textAlign='left';
  for(i=0;i<s.length;i++){
    x.fillText(s.charAt(i), cur, y);
    cur += x.measureText(s.charAt(i)).width + track;
  }
}
/* How wide a tracked string comes out, in the font already set. Asked before
   it is drawn, so that the fit can take the tracking into account and so that
   the two ends of the foot can be hung off the edges rather than guessed at. */
function cardTrackW(x, s, track){
  var i, w=0;
  for(i=0;i<s.length;i++) w += x.measureText(s.charAt(i)).width + track;
  return s.length? w-track : 0;
}
/* A rounded rectangle. Old WKWebViews have no roundRect, and a plate with
   square corners is a box rather than an object lying on something. */
function cardRR(x, l, t, w, h, r){
  x.beginPath();
  x.moveTo(l+r, t);
  x.arcTo(l+w, t,   l+w, t+h, r);
  x.arcTo(l+w, t+h, l,   t+h, r);
  x.arcTo(l,   t+h, l,   t,   r);
  x.arcTo(l,   t,   l+w, t,   r);
  x.closePath();
}
/* The plate the specimen is printed on, raised off the ground: --pane over
   --bg, a shadow beneath it and a hairline of --glassspec along its top edge
   where the light would catch. Those two are the same pair the tab bar's
   glass is made of, so the card is lit the way the app is lit, in both
   themes, without a colour of its own.

   Inside it the double rule a book frames a specimen with -- the heavier
   line and a hairline within it -- and the hairline gets --glassspec a pixel
   under it, which is what makes a rule look cut into the surface rather than
   drawn on top of it.

   Everything here is a fraction of `S`, the short side, and not of the
   height: a border a tenth of the height deep is a border on a wide card and
   a picture frame on a tall one. On the sixteen by nine this was drawn for,
   S is the height and nothing moved. */
function cardPlate(x, W, H, S, m){
  var r=Math.round(S*0.048), i=Math.round(S*0.028), o;

  x.save();
  x.shadowColor=cssVar('--glassdrop');
  x.shadowBlur=Math.round(S*0.045);
  x.shadowOffsetY=Math.round(S*0.016);
  x.fillStyle=cssVar('--raise');
  cardRR(x, m, m, W-m*2, H-m*2, r); x.fill();
  x.restore();

  /* the lit edge along the top */
  x.save();
  cardRR(x, m, m, W-m*2, H-m*2, r); x.clip();
  x.strokeStyle=cssVar('--glassspec');
  x.lineWidth=Math.max(1, Math.round(S*0.0022));
  x.beginPath(); x.moveTo(m, m+x.lineWidth/2); x.lineTo(W-m, m+x.lineWidth/2); x.stroke();
  x.restore();

  o=m+i;
  x.strokeStyle=cssVar('--goldln');
  x.lineWidth=Math.max(1, Math.round(S*0.0030));
  cardRR(x, o, o, W-o*2, H-o*2, Math.max(0, r-i)); x.stroke();
  o=m+Math.round(i*1.5);
  x.strokeStyle=cssVar('--glassspec');
  x.lineWidth=Math.max(1, Math.round(S*0.0013));
  cardRR(x, o, o+x.lineWidth, W-o*2, H-o*2, Math.max(0, r-i*1.5)); x.stroke();
  x.strokeStyle=cssVar('--goldln');
  cardRR(x, o, o, W-o*2, H-o*2, Math.max(0, r-i*1.5)); x.stroke();
}
/* A lozenge between the writing and the reading of it, where a book would
   put a fleuron. It is the only ornament on the card and it is four lines. */
function cardMark(x, cx, cy, r){
  x.fillStyle=cssVar('--gold');
  x.beginPath();
  x.moveTo(cx, cy-r); x.lineTo(cx+r, cy); x.lineTo(cx, cy+r); x.lineTo(cx-r, cy);
  x.closePath(); x.fill();
}

function cardPaint(c){
  var sz=cardSize(), W=sz.w, H=sz.h, S=Math.min(W, H), x=c.getContext('2d');
  /* Two sources, and which one is not this function's to decide twice:
     cardSrc() hands back ink or it does not, and it does not exactly when
     there is nothing drawable on the post.

       ink present   cardInkUnits()  the shapes frozen onto the post. It may
                                     NOT name the open dictionary, the drawn
                                     letters or the writing system, and
                                     sides-check holds that
       no ink        cardUnits()     a word, an example, or a post written
                                     before a post carried its ink. These are
                                     the open language and are supposed to be

     cardUnits() asks findWord() for the spelling, ltById() for the letter and
     wsStrokes() for a shape the writing system composes -- all three mine --
     so a card of somebody else's post built that way is that post in MY
     alphabet. Correct only for as long as every post is mine. */
  var src=cardSrc(), items=src.ink? cardInkUnits(src.ink) : cardUnits(src.line);
  var dir=src.dir, vert=dir.indexOf('ttb')===0, lay, g, i;
  c.width=W; c.height=H;
  cardMeasure(x, items);

  /* Where the reading sits, measured up from the foot of the plate, and where
     the writing therefore has room to be. Fractions of the short side for the
     same reason the plate is. */
  var m=Math.round(S*0.072);
  var pad=m+Math.round(S*0.100), aw=W-pad*2;
  var footY=H-m-Math.round(S*0.076);
  var mnY=footY-Math.round(S*0.105);
  var rsY=footY-Math.round(S*0.213);
  var mkY=footY-Math.round(S*0.290);
  var top=m+Math.round(S*0.072), bot=mkY-Math.round(S*0.045), ah=bot-top;

  /* The ground: --bg, lifted toward the upper left the way a surface under a
     light is, and falling away at the far corner. A card that was one flat
     rectangle read as a screenshot of a screen rather than as an object. */
  g=x.createLinearGradient(0, 0, W*0.9, H);
  g.addColorStop(0, cssVar('--bg'));
  g.addColorStop(1, cssVar('--sink'));
  x.fillStyle=g; x.fillRect(0,0,W,H);
  cardPlate(x, W, H, S, m);

  /* the script, as large as it can be and still stand inside the rules */
  lay=items.length? cardPlace(items, aw, ah, Math.round(S*0.60), vert) : null;
  if(lay) cardLayout(items, lay, dir, vert, pad, top, aw, ah);
  /* The writing sits on the plate rather than in it: a soft shadow under the
     ink is the whole difference between a letter and a hole. */
  x.save();
  x.shadowColor=cssVar('--glassdrop');
  x.shadowBlur=Math.round(S*0.026);
  x.shadowOffsetY=Math.round(S*0.010);
  cardInk(x, items);
  x.restore();

  cardMark(x, W/2, mkY, Math.round(S*0.0125));

  /* the spelling, in capitals and tracked, the way the app says a small
     heading everywhere else */
  x.textBaseline='alphabetic';
  x.fillStyle=cssVar('--txs');
  var up=String(src.line||'').toUpperCase();
  var rs=cardFit(x, up, aw*0.86, Math.round(S*0.050), CARD_CAPS, 0.24);
  cardTrack(x, up, W/2, rsY, rs*0.24);

  /* what it means, in the italic every meaning in this app is set in, in the
     room there is between the spelling and the foot */
  if(src.mn){
    x.fillStyle=cssVar('--tx');
    var high=(footY-Math.round(S*0.030))-(rsY+Math.round(S*0.022));
    var mn=cardLines(x, src.mn, aw, high, Math.round(S*0.082), CARD_ITAL, 'italic', 2);
    var lh=cardLead(mn.sz), y0=mnY-(mn.ln.length-1)*lh/2;
    x.textAlign='center';
    for(i=0;i<mn.ln.length;i++) x.fillText(mn.ln[i], W/2, Math.round(y0+i*lh));
  }

  /* Whose it is, and what language it is in. 「@〇〇と言語名にしよう」

     It used to be the language's name on the left and the word LINGUA on the
     right, so a card of a language somebody had called Lingua read LINGUA on
     one side and LINGUA on the other. 「カード下がlingua Linguaになってる」
     A handle cannot collide with a language's name, and between them they say
     the two things a person looking at a picture on somebody else's timeline
     wants to know.

     Hung off the edges of the writing above rather than off two fractions of
     the width, so a long name runs in toward the middle instead of out of
     the card. */
  var fs=Math.round(S*0.030), tr=0.227;
  var hd=(src.hd? '@'+String(src.hd) : '').toUpperCase();
  var nm=String(src.nm||'').toUpperCase(), hs;
  x.font=fs+'px '+CARD_CAPS;
  var nw=cardTrackW(x, nm, fs*tr);
  if(hd){
    x.fillStyle=cssVar('--gold');
    hs=cardFit(x, hd, aw-nw-S*0.08, fs, CARD_CAPS, tr);
    cardTrack(x, hd, pad+cardTrackW(x, hd, hs*tr)/2, footY, hs*tr);
    x.font=fs+'px '+CARD_CAPS;
  }
  x.fillStyle=cssVar('--txm');
  cardTrack(x, nm, W-pad-nw/2, footY, fs*tr);
}
function cardMount(){
  var c=document.getElementById('cardc');
  if(!c) return;
  cardPaint(c);
  /* Cinzel and Cormorant arrive after the first frame on a cold start, and a
     card drawn in Georgia and left there is the whole point missed. */
  if(document.fonts && document.fonts.ready)
    document.fonts.ready.then(function(){
      var el=document.getElementById('cardc');
      if(el) cardPaint(el);
    });
}

/* ---- getting it off the phone -------------------------------------------
   The share sheet is the one that matters: it is what puts the card on
   somebody else's timeline, which is the only reason this screen exists. A
   webview too old for sharing a file falls back to a download, which is what
   a desktop browser does anyway. */
function cardSave(){
  var c=document.getElementById('cardc');
  if(!c) return;
  /* Named after what is ON the card, which for a post is the language it was
     written in and not the one you happen to have open. */
  var name=(cardSrc().hd || 'lingua')+'.png';
  if(c.toBlob){ c.toBlob(function(b){ cardDeliver(b, name); }, 'image/png'); return; }
  cardDeliver(null, name);
}
function cardDeliver(blob, name){
  var c=document.getElementById('cardc'), f, url, a;
  if(blob && navigator.share && window.File){
    f=new File([blob], name, {type:'image/png'});
    if(!navigator.canShare || navigator.canShare({files:[f]})){
      try{ navigator.share({files:[f]})['catch'](function(){}); return; }catch(e){}
    }
  }
  url = blob? URL.createObjectURL(blob) : (c? c.toDataURL('image/png') : '');
  if(!url) return;
  a=document.createElement('a'); a.href=url; a.download=name; a.click();
  if(blob) URL.revokeObjectURL(url);
  toast(t('card.saved'));
}

/* ==== below this line a card of a post renders from the post ==============
   www/post.js has this line and this rule, and the card is the other place a
   post is drawn. It did not have it: cardPaint() called cardUnits(), which
   asks findWord() for the spelling, ltById()/ltMain() for the letter and
   wsStrokes() for a shape the writing system composes -- the open language,
   three times over, for a line somebody else wrote in an alphabet this phone
   has never seen. It tested green, screenshotted right and demoed perfectly,
   because the only posts anybody has made so far are their own.

   Named by the post, not by the open language, for the same reason: stamping
   the language you happen to have open across the foot of somebody else's
   card is the bug the timeline had three times over.

   So the shapes come off the post, already cut, exactly as postLnHTML() takes
   them: `g` is the shapes, `s` is the line, a number is an index into `g` and
   a string is itself. Nothing below here may name the making side, and
   tools/sides-check.mjs holds that -- over this file and post.js, in one
   loop, because it is one statement. */
function cardOfPost(po){
  /* postInkOK() and not "is there ink". A post carrying an ink object that
     holds nothing, or one whose line points at a shape that is not there,
     has ink and cannot be drawn from it -- and the timeline and the card
     asking that question separately is two answers waiting to disagree. It
     is post.js's to answer, once, for both. */
  /* Both off the post. The language's name is the one it was written in, not
     whichever one this phone happens to have open. */
  /* Which way it runs comes off the post too, and for the same reason
     everything else here does: the card must not ask the open language which
     way to set somebody else's line. postDir() is the one place that reads
     it, and what comes back is used whole -- a post written in columns is set
     in columns. It used to be flattened to a side-to-side direction, because
     the only shape a card had was 1920 by 1080 and a column has nowhere to go
     in a band that wide. The card has three shapes now, so it no longer has
     to misspell somebody's writing to fit one of them. */
  return {line:String(po.ln||''), mn:String(po.mn||''), hd:String(po.hd||''),
          nm:String(po.lname||''), ink:postInkOK(po.ink)? po.ink : null,
          dir:postDir(po)};
}
/* The post's line as things to draw, in the shapes cardInk() already knows:
   a shape, a character, or the gap between two words. A text run may be
   several characters long -- postCut() gathers what was never drawn into one
   piece -- so it is spread out one at a time, and whitespace inside it is the
   gap rather than a character that happens to be blank. */
function cardInkUnits(ink){
  var out=[], i, j, x, ch;
  for(i=0;i<ink.s.length;i++){
    x=ink.s[i];
    if(typeof x==='number'){ out.push({st:ink.g[x]}); continue; }
    x=String(x);
    for(j=0;j<x.length;j++){
      ch=x.charAt(j);
      out.push(/\s/.test(ch)? {sp:true} : {tx:ch});
    }
  }
  return out;
}
