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
/* A word and an example are pages, and a page has one shape. Only a post is
   offered the three: a post is a picture somebody puts on a timeline, and
   which timeline decides what it is cropped to. A dictionary page asked
   "sixteen by nine or square?" is a dictionary page that does not know what
   it is. 1080 by 1350 is the tallest a picture goes in the body of a post on
   the two timelines this will be put on. */
var CARD_PAGE={w:1080, h:1350};
/* The font's cell, in the units strokes are drawn in. */
var CARD_CELL=800;

/* Three things carry a share mark and they are not the same thing, so they do
   not come out as the same picture.

     w  a word          a specimen. The script as large as the card allows,
                        and under it what a dictionary entry carries: the
                        spelling, the reading, the part of speech, the meaning
     x  an example      a LINE, not a letterform. Set smaller, because a
                        sentence is read rather than looked at, and headed by
                        the word it is an example of -- which is the word
                        whose page the share mark was pressed on
     p  a post          somebody's published line. It already says whose and
                        in what, in the foot, and it needs nothing else

   `cap` is how big one cell may get, as a fraction of the short side. It is
   the only number that separates a word from a sentence, and it is the whole
   of why they stop looking alike. */
var CARD_KINDS={
  w:{cap:0.60, of:false, sub:true},
  x:{cap:0.40, of:true,  sub:false},
  p:{cap:0.58, of:false, sub:false}
};

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
  if(cardSrc().kind!=='p') return '';
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
  var k, i;
  if(cardSrc().kind!=='p') return CARD_PAGE;
  k=cardShape();
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
    /* `of` is the word this is an example OF, and it is the whole difference
       between a sentence card and a word card. The share mark on an example
       sits on a word's page, under that word, and what came out of it was a
       short line with nothing on it to say what it was an example of -- the
       one thing the person pressing it was looking at. */
    if(ex) return {kind:'x', of:String(w.hw||''),
                   line:String(ex.ln||''), mn:String(ex.gl || exGloss(ex.ln) || ''),
                   hd:hd, nm:nm, dir:scriptDir()};
  }
  w=findWord(v) || WORDS[WORDS.length-1];
  if(!w) return {kind:'w', line:'', mn:'', hd:hd, nm:nm, dir:scriptDir()};
  /* A word and an example are things in the language that is OPEN, so they
     run the way it runs. Only a post carries a direction of its own.

     A word card carries what a dictionary entry carries. The reading and the
     part of speech are on the word's own page and were not on the picture of
     it, so a card of a word said less about that word than the screen it was
     shared from. */
  return {kind:'w', line:String(w.hw), mn:String(wMns(w)[0]||''),
          mns:wMns(w), ex:(w.ex||[])[0]||null, from:String(w.from||''),
          rd:phIpa(wPh(w)), pos:posLabel(w.pos), posk:String(w.pos||''),
          ety:String(w.ety||''), fam:cardFam(w),
          hd:hd, nm:nm, dir:scriptDir()};
}

/* The words this one is family to, for the page: what each is called, what it
   is, and what it means. A word that has a past tense and a progressive has
   them in the dictionary as words of their own, and a picture of the entry
   that left them off would be a picture of the smaller half of it.

   Four at most. A page is a page and a verb with nine forms on it is a table.
   The root first when this word has one, because that is where the family
   starts and it is the row a stranger needs to be told about. */
function cardFam(w){
  var par=wParent(w), root=par||w, out=[], kids, i, x;
  if(par) out.push({lb:t('word.root'), hw:String(par.hw), mn:String(wMn(par)||'')});
  kids=wdFamSort(wKids(root).filter(function(k){ return k!==w; }));
  for(i=0;i<kids.length && out.length<4;i++){
    x=kids[i];
    out.push({lb:fmLabel(x.fm||''), hw:String(x.hw), mn:String(wMn(x)||'')});
  }
  return out;
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
  var i, u, a, side=geSide(), sz=Math.round(CARD_CELL*0.95);
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
    x.font=sz+'px '+cardCaps();
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
  var ext=cardExtent(items), side=geSide(), best=null;
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
  var side=geSide(), k=lay.k, i, j, run, list, cur, off, at, u, len;
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
    x.font=Math.round(u.sz*u.k)+'px '+cardCaps();
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

/* The card is set in the app's own two faces: the capitals in the display
   face, the meaning in the italic one.

   Both used to be written out here as family lists, which made this file the
   one place a face was named outside the stylesheet -- and a canvas cannot
   inherit, so nothing would have looked wrong until somebody changed a face in
   index.html and every screen except the card followed. They are asked of the
   page now, exactly as every colour on this card already is. `serif` is the
   fallback rather than a family, because naming one here is the thing this
   stopped doing. */
function cardCaps(){ return cssVar('--face-caps', 'serif'); }
function cardItal(){ return cssVar('--face-ital', 'serif'); }

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

/* ---- a word is a page out of a dictionary ------------------------------
   Not a poster. A word card used to be the specimen the head of this file
   describes -- the script as large as the card allows, the spelling under it,
   the meaning under that -- which is the right picture for a LINE and the
   wrong one for an entry. A word has more than one meaning, it has a sentence
   under it, it came from somewhere, and none of that fits under a letterform
   blown up to fill a square. 「単語は単語専門のかっこいい辞書ページみたいなの」

   So this is a page: a rule at the head with the language on one side and the
   part of speech on the other, the word in its own letters at the margin, the
   spelling and the reading beside each other, a gold rule, the senses
   numbered, an example set smaller with its gloss under it, where the word
   came from, and a rule at the foot. Everything hangs off ONE left margin,
   which is what makes a page read as a page.

   The head runs left to right even for a language that runs down the page. A
   headword is not a quotation: it is the entry's name, and a dictionary sets
   its names the way the dictionary is set. 「流石に横書きでいいでしょ辞書は」 */

/* One block of the language's own letters, laid from the TOP-LEFT of the box
   rather than centred in it, because every other thing on the page starts at
   the margin. The strokes are handed back rather than drawn: cardInk is
   called once for the whole page, so what went onto the picture can be read
   off in one place -- which is the thing tools/card-check.mjs watches. */
function cardBlock(x, line, bx, by, bw, bh, cap){
  var items=cardUnits(line), lay, i, u, minx=null, miny=null, maxy=null, maxx=null, dx, dy;
  cardMeasure(x, items);
  lay=items.length? cardPlace(items, bw, bh, cap, false) : null;
  if(!lay) return {items:[], bot:by};
  cardLayout(items, lay, 'ltr', false, bx, by, bw, bh);
  for(i=0;i<items.length;i++){
    u=items[i];
    if(u.ax===null || u.ax===undefined) continue;
    if(minx===null || u.ax+u.x0*u.k<minx) minx=u.ax+u.x0*u.k;
    if(miny===null || u.ay+u.y0*u.k<miny) miny=u.ay+u.y0*u.k;
    if(maxy===null || u.ay+u.y1*u.k>maxy) maxy=u.ay+u.y1*u.k;
    if(maxx===null || u.ax+u.x1*u.k>maxx) maxx=u.ax+u.x1*u.k;
  }
  if(minx===null) return {items:items, bot:by, right:bx};
  dx=bx-minx; dy=by-miny;
  for(i=0;i<items.length;i++){
    u=items[i];
    if(u.ax===null || u.ax===undefined) continue;
    u.ax+=dx; u.ay+=dy;
  }
  return {items:items, bot:maxy+dy, right:maxx+dx};
}
/* Wrapping for a column whose width is fixed and whose height is not: the
   page grows downward and the foot is drawn from the bottom up, so a long
   sense does not have to be squeezed into a line count the way a card's
   meaning does. */
function cardWrap(x, s, max){
  var words=String(s||'').split(/\s+/), out=[], cur='', i, join;
  for(i=0;i<words.length;i++){
    if(!words[i]) continue;
    join = cur? cur+' '+words[i] : words[i];
    if(x.measureText(join).width<=max){ cur=join; continue; }
    if(cur) out.push(cur);
    cur=words[i];
  }
  if(cur) out.push(cur);
  return out;
}
function cardRule(x, y, x0, x1, col, lw){
  x.beginPath(); x.moveTo(x0, y); x.lineTo(x1, y);
  x.strokeStyle=col; x.lineWidth=lw||1; x.stroke();
}
/* A tracked string set FROM a left margin, and how wide it came out -- the
   reading has to start where the spelling stopped. cardTrack centres, which
   is what a card wants and what a page does not. */
function cardTrackL(x, s, x0, y, tr){
  var w=cardTrackW(x, s, tr);
  cardTrack(x, s, x0+w/2, y, tr);
  return w;
}
/* The page itself. `extra` is the air put into every gap, which is how a word
   with one sense fills the sheet: the entry is not stretched, the spacing is.
   Drawn twice -- once against a scratch canvas to find out where it ends, and
   again for real with the leftover room shared out. */
function cardWordPage(x, W, H, S, src, extra, drop, lim, ink){
  var M=Math.round(S*0.090), RIGHT=W-M, COL=RIGHT-M, IND=Math.round(S*0.040);
  var mns=src.mns && src.mns.length? src.mns : (src.mn? [src.mn] : []);
  var ex=lim.ex? src.ex : null, org=lim.org? (src.ety || (src.from? src.from : '')) : '';
  var y, b, i, j, ln, g;
  var fam=(src.fam && src.fam.length)? src.fam.slice(0, lim.fam) : [], FIND;
  g=x.createLinearGradient(0, 0, W*0.9, H);
  g.addColorStop(0, cssVar('--bg'));
  g.addColorStop(1, cssVar('--sink'));
  x.fillStyle=g; x.fillRect(0, 0, W, H);

  /* The head. The language on the left because the page is a page OF it, the
     part of speech on the right because that is the one fact about the entry
     that is not the entry. */
  x.textBaseline='alphabetic'; x.textAlign='left';
  x.fillStyle=cssVar('--gold'); x.font=Math.round(S*0.016)+'px '+cardCaps();
  cardTrackL(x, String(src.nm||'').toUpperCase(), M, M, S*0.016*0.46);
  /* The part of speech, when there is one. `x` is the entry for "none of
     these", and OTHER printed across the head of a page says nothing about
     the word and takes the place of the thing that would. */
  if(src.pos && src.posk && src.posk!=='x'){
    x.font=Math.round(S*0.016)+'px '+cardCaps();
    x.fillStyle=cssVar('--txm');
    cardTrackL(x, String(src.pos).toUpperCase(),
      RIGHT-cardTrackW(x, String(src.pos).toUpperCase(), S*0.016*0.46), M, S*0.016*0.46);
  }
  cardRule(x, M+Math.round(S*0.017), M, RIGHT, cssVar('--line'), 1);

  /* The word, in the letters somebody drew. Its size is fixed: a short entry
     leaves the foot of the page empty, and a headword grown to fill it stops
     being a headword and becomes a sign. */
  y=M+Math.round(S*0.105)+drop;
  b=cardBlock(x, src.line, M, y, COL, Math.round(S*0.115), Math.round(S*0.150));
  for(i=0;i<b.items.length;i++) ink.push(b.items[i]);
  y=b.bot+Math.round(S*0.052)+extra;

  /* The spelling and the reading, on one line: what it is written as, and
     what it sounds like. */
  x.textAlign='left'; x.fillStyle=cssVar('--txs');
  x.font=Math.round(S*0.024)+'px '+cardCaps();
  i=cardTrackL(x, String(src.line||'').toUpperCase(), M, y, S*0.024*0.34);
  if(src.rd){
    x.fillStyle=cssVar('--txm');
    x.font='italic '+Math.round(S*0.026)+'px '+cardItal();
    x.fillText(src.rd, M+i+Math.round(S*0.030), y);
  }
  y+=Math.round(S*0.026)+extra*0.45;
  cardRule(x, y, M, M+Math.round(S*0.048), cssVar('--gold'), 2);

  /* The senses, numbered. A word that means two things says so here and
     nowhere else on the picture. */
  y+=Math.round(S*0.052)+extra;
  for(i=0;i<mns.length;i++){
    x.fillStyle=cssVar('--gold'); x.font=Math.round(S*0.019)+'px '+cardCaps();
    x.textAlign='left'; x.fillText(String(i+1), M, y);
    x.fillStyle=cssVar('--tx'); x.font=Math.round(S*0.042)+'px '+cardItal();
    ln=cardWrap(x, mns[i], COL-IND);
    for(j=0;j<ln.length;j++){ x.fillText(ln[j], M+IND, y); y+=Math.round(S*0.050); }
    y+=Math.round(S*0.008)+extra*0.55;
  }

  /* The family. Each row is what the form is called, the word itself in the
     letters it is written in, and what it means -- one line each, because a
     row that wraps stops being a row. 「過去形とか登録すると辞書にも追加される」 */
  if(fam.length){
    y+=Math.round(S*0.030)+extra;
    x.fillStyle=cssVar('--gold'); x.font=Math.round(S*0.014)+'px '+cardCaps();
    x.textAlign='left';
    cardTrackL(x, String(t('word.family')).toUpperCase(), M, y, S*0.014*0.46);
    y+=Math.round(S*0.040);
    /* The label has a column of its own. It was set at the margin and the
       word at the senses' indent, which is 43px wide -- PROGRESSIVE runs
       straight under the word and comes out through it. */
    FIND=Math.round(S*0.165);
    for(i=0;i<fam.length;i++){
      b=cardBlock(x, fam[i].hw, M+FIND, y, COL-FIND, Math.round(S*0.036),
                  Math.round(S*0.048));
      for(j=0;j<b.items.length;j++) ink.push(b.items[j]);
      if(fam[i].lb){
        /* Set to the column, not merely started at the margin: PROGRESSIVE is
           three times the width of PAST, and a label that runs on until it
           meets the word is a label written over one. */
        ln=String(fam[i].lb).toUpperCase();
        g=Math.round(S*0.015);
        x.fillStyle=cssVar('--txs');
        while(g>8){
          x.font=g+'px '+cardCaps();
          if(cardTrackW(x, ln, g*0.40) <= FIND-Math.round(S*0.030)) break;
          g-=1;
        }
        cardTrackL(x, ln, M, b.bot, g*0.40);
      }
      if(fam[i].mn){
        x.fillStyle=cssVar('--txm');
        x.font='italic '+Math.round(S*0.026)+'px '+cardItal();
        x.textAlign='left';
        x.fillText(fam[i].mn, Math.max(b.right, M+FIND)+Math.round(S*0.034), b.bot);
      }
      y=b.bot+Math.round(S*0.032);
    }
    y+=extra*0.4;
  }

  /* The sentence written under the word, indented under the senses it belongs
     to, and set small: an example is read, not looked at. */
  if(ex && ex.ln){
    y+=Math.round(S*0.026)+extra;
    b=cardBlock(x, ex.ln, M+IND, y, COL-IND, Math.round(S*0.070), Math.round(S*0.090));
    for(i=0;i<b.items.length;i++) ink.push(b.items[i]);
    y=b.bot+Math.round(S*0.036);
    if(ex.gl){
      x.fillStyle=cssVar('--txm');
      x.font='italic '+Math.round(S*0.029)+'px '+cardItal();
      ln=cardWrap(x, ex.gl, COL-IND);
      for(j=0;j<ln.length;j++){ x.fillText(ln[j], M+IND, y); y+=Math.round(S*0.036); }
    }
  }

  /* Where it came from -- what the person typed, or the word it was made out
     of when they typed nothing. */
  if(org){
    y+=Math.round(S*0.034)+extra;
    x.fillStyle=cssVar('--gold'); x.font=Math.round(S*0.014)+'px '+cardCaps();
    cardTrackL(x, String(t('word.ety')).toUpperCase(), M, y, S*0.014*0.46);
    y+=Math.round(S*0.030);
    x.fillStyle=cssVar('--txm');
    x.font='italic '+Math.round(S*0.027)+'px '+cardItal();
    ln=cardWrap(x, org, COL);
    for(j=0;j<ln.length;j++){ x.fillText(ln[j], M, y); y+=Math.round(S*0.034); }
  }

  /* The foot: the same rule as the head, whose page it is on the left, and
     the app's mark on the right.

     It said LINGUA there, in words, and the head says the language's name --
     so a language somebody has called Lingua came out with LINGUA written
     across the top and the bottom of every page of it. 「カード下がlingua
     Linguaになってる」 A mark cannot collide with a name. */
  b=H-M;
  cardRule(x, b-Math.round(S*0.026), M, RIGHT, cssVar('--line'), 1);
  if(src.hd){
    ln='@'+String(src.hd).toUpperCase();
    x.fillStyle=cssVar('--gold'); x.font=Math.round(S*0.016)+'px '+cardCaps();
    cardTrackL(x, ln, M, b, S*0.016*0.46);
  }
  cardMark(x, RIGHT-Math.round(S*0.010), b-Math.round(S*0.005), Math.round(S*0.010));
  return y;
}
/* Twice: once to a scratch canvas to learn where the entry ends, and once for
   real with the room that was left shared out between the gaps. */
/* What the page will carry. A verb with four relatives, a sentence under it
   and a line about where it came from does not fit on one sheet, and the
   first version of this drew all of it anyway -- straight through the rule at
   the foot and out the bottom of the picture.

   So the page is fitted before it is drawn. What goes first is the row that
   says least about the word: the last of the family, then the next, then
   where it came from, then the sentence. The senses never go: a dictionary
   entry with the meanings left off is not a shorter entry, it is a different
   thing. */
function cardWordFit(pc, W, H, S, src){
  var n=(src.fam && src.fam.length)? Math.min(4, src.fam.length) : 0;
  var has=!!(src.ety || src.from), hasEx=!!(src.ex && src.ex.ln);
  var floor=H-Math.round(S*0.090)-Math.round(S*0.075), tries=[], i, lim;
  for(i=n;i>=0;i--) tries.push({fam:i, ex:hasEx, org:has});
  for(i=n;i>=0;i--) tries.push({fam:i, ex:hasEx, org:false});
  for(i=n;i>=0;i--) tries.push({fam:i, ex:false, org:false});
  for(i=0;i<tries.length;i++){
    lim=tries[i];
    if(cardWordPage(pc, W, H, S, src, 0, 0, lim, []) <= floor) return lim;
  }
  return tries[tries.length-1];
}
function cardWord(x, W, H, S, src){
  var M=Math.round(S*0.090), probe, pc, end, gaps, room, extra, drop, lim, ink=[];
  probe=document.createElement('canvas'); probe.width=W; probe.height=H;
  pc=probe.getContext('2d');
  lim=cardWordFit(pc, W, H, S, src);
  end=cardWordPage(pc, W, H, S, src, 0, 0, lim, []);
  gaps=2.45
    + Math.max(0, ((src.mns && src.mns.length? src.mns.length : 1)-1))*0.55
    + (lim.fam? 1.4 : 0)
    + (lim.ex? 1 : 0)
    + (lim.org? 1 : 0);
  room=H-M-Math.round(S*0.075)-end;
  extra=Math.max(0, Math.min(room/gaps, Math.round(S*0.075)));
  /* A word with one sense, no sentence under it and nothing said about where
     it came from is three lines long, and three lines at the top of a page
     1350 tall is not a page, it is a receipt. The gaps take what they can
     hold and the block rides down on what is left, so a short entry comes out
     as a page set generously rather than as a page with a hole in it. */
  end=cardWordPage(pc, W, H, S, src, extra, 0, lim, []);
  drop=Math.max(0, Math.min((H-M-Math.round(S*0.075)-end)*0.42, Math.round(S*0.150)));
  cardWordPage(x, W, H, S, src, extra, drop, lim, ink);
  x.save();
  x.shadowColor=cssVar('--glassdrop');
  x.shadowBlur=Math.round(S*0.020);
  x.shadowOffsetY=Math.round(S*0.008);
  cardInk(x, ink);
  x.restore();
}

function cardPaint(c){
  var sz=cardSize(), W=sz.w, H=sz.h, S=Math.min(W, H), x=c.getContext('2d');
  /* A word is a page and everything else is a card, and they have almost
     nothing in common but the ground they are drawn on. */
  if(cardSrc().kind==='w'){ c.width=W; c.height=H; cardWord(x, W, H, S, cardSrc()); return; }
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
  var kind=CARD_KINDS[src.kind] || CARD_KINDS.w;
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
  var top=m+Math.round(S*0.072), bot=mkY-Math.round(S*0.045);
  /* The word an example belongs to, over the line, in the room the line gives
     up for it. Small and tracked, the way the app says a heading -- it is a
     label on the picture and not part of what the picture is of. */
  var ofY=0;
  if(kind.of && src.of){ ofY=top+Math.round(S*0.026); top+=Math.round(S*0.062); }
  var ah=bot-top;

  /* The ground: --bg, lifted toward the upper left the way a surface under a
     light is, and falling away at the far corner. A card that was one flat
     rectangle read as a screenshot of a screen rather than as an object. */
  g=x.createLinearGradient(0, 0, W*0.9, H);
  g.addColorStop(0, cssVar('--bg'));
  g.addColorStop(1, cssVar('--sink'));
  x.fillStyle=g; x.fillRect(0,0,W,H);
  cardPlate(x, W, H, S, m);

  if(ofY){
    x.textBaseline='alphabetic';
    x.fillStyle=cssVar('--txm');
    x.font=Math.round(S*0.026)+'px '+cardCaps();
    cardTrack(x, String(src.of).toUpperCase(), W/2, ofY, S*0.026*0.30);
  }

  /* the script, as large as it can be and still stand inside the rules */
  lay=items.length? cardPlace(items, aw, ah, Math.round(S*kind.cap), vert) : null;
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
  var rs=cardFit(x, up, aw*0.86, Math.round(S*0.050), cardCaps(), 0.24);
  cardTrack(x, up, W/2, rsY, rs*0.24);

  /* How it is said and what part of speech it is -- one line, between the
     spelling and the meaning. A word's own page says both and the picture of
     it said neither. Only a word: a sentence has no part of speech, and a
     post is somebody else's and carries neither. */
  var subY=0;
  if(kind.sub && (src.rd || src.pos)){
    subY=rsY+Math.round(S*0.046);
    x.fillStyle=cssVar('--txm');
    x.font='italic '+Math.round(S*0.030)+'px '+cardItal();
    x.textAlign='center';
    x.fillText([src.rd? '/'+src.rd+'/' : '', src.pos].filter(Boolean).join('  \u00b7  '),
               W/2, subY);
  }

  /* what it means, in the italic every meaning in this app is set in, in the
     room there is between the spelling and the foot */
  if(src.mn){
    x.fillStyle=cssVar('--tx');
    var high=(footY-Math.round(S*0.030))-((subY||rsY)+Math.round(S*0.022));
    var mn=cardLines(x, src.mn, aw, high, Math.round(S*0.082), cardItal(), 'italic', 2);
    var lh=cardLead(mn.sz);
    var y0=(subY? Math.max(mnY, subY+Math.round(S*0.058)) : mnY)-(mn.ln.length-1)*lh/2;
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
  x.font=fs+'px '+cardCaps();
  var nw=cardTrackW(x, nm, fs*tr);
  if(hd){
    x.fillStyle=cssVar('--gold');
    hs=cardFit(x, hd, aw-nw-S*0.08, fs, cardCaps(), tr);
    cardTrack(x, hd, pad+cardTrackW(x, hd, hs*tr)/2, footY, hs*tr);
    x.font=fs+'px '+cardCaps();
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
  return {kind:'p', line:String(po.ln||''), mn:String(po.mn||''),
          hd:String(po.hd||''), nm:String(po.lname||''),
          ink:postInkOK(po.ink)? po.ink : null, dir:postDir(po)};
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
