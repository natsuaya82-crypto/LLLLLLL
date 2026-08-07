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
   under a word (`kano#0` is that word's first). */
var CARD={k:'w', v:''};
/* The picture is made at this size whatever the phone is, so a card saved on
   an old small screen is the same file as one saved on a new large one.
   Sixteen by nine: it is the shape a link preview is cropped to on every
   timeline that is not Lingua's, and a square posted there loses its sides.
   What the preview is shown at is the CSS's business. */
var CARD_W=1920, CARD_H=1080;

function cardOpen(kind, key){
  CARD={k:String(kind), v:String(key)};
  openForm('card:'+CARD.k+'/'+CARD.v, t('card.title'),
    '<div class="cardbox"><canvas id="cardc" class="cardc"></canvas></div>'+
    '<button class="btn" style="width:100%;margin-top:18px"' + DO('cardSave') + '>'+
      t('card.save')+'</button>',
    cardMount);
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
  var v=CARD.v, i, w, ex, po;
  /* A post is already a line with its meaning fixed to it, which is what a
     card is. Nothing to work out. */
  if(CARD.k==='p'){
    po=postById(v);
    if(po) return {line:String(po.ln||''), mn:String(po.mn||'')};
  }
  if(CARD.k==='x'){
    i=String(v).indexOf('#');
    w=findWord(i<0? v : v.slice(0,i));
    ex=(w && w.ex)? w.ex[parseInt(i<0? '0' : v.slice(i+1), 10)] : null;
    if(ex) return {line:String(ex.ln||''), mn:String(ex.gl || exGloss(ex.ln) || '')};
  }
  w=findWord(v) || WORDS[WORDS.length-1];
  if(!w) return {line:'', mn:''};
  return {line:String(w.hw), mn:String(wMns(w)[0]||'')};
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
/* How wide the line comes out at a given size, so it can be measured before
   it is drawn and shrunk if it does not fit. */
function cardWidth(items, box, gap, wgap){
  var w=0, i;
  for(i=0;i<items.length;i++){
    if(i) w+=gap;
    w += items[i].sp? wgap : box;
  }
  return w;
}
function cardInk(x, items, ox, oy, box, gap, wgap){
  var i, cur=ox;
  for(i=0;i<items.length;i++){
    if(i) cur+=gap;
    if(items[i].sp){ cur+=wgap; continue; }
    if(items[i].st){ inkStrokes(x, items[i].st, box/800, cur, oy, cssVar('--tx')); }
    else {
      /* A sound with no letter stands in capitals at nearly the height of a
         drawn one. In lower case it came out half the size of the letters
         beside it, which reads as a small letter rather than as a gap. */
      x.fillStyle=cssVar('--tx');
      x.textAlign='left'; x.textBaseline='alphabetic';
      x.font=Math.round(box*0.95)+'px '+CARD_CAPS;
      x.fillText(String(items[i].tx).toUpperCase(), cur, oy+box*0.85);
    }
    cur+=box;
  }
}
/* The largest size at which a string still fits the width it is given, with
   the canvas left set to it. A sentence is longer than a word and there is no
   wrapping on a canvas.

   `style` goes in front of the size, not after it: a canvas font is the CSS
   shorthand, so "64px italic Cormorant" is not a slower way of saying
   "italic 64px Cormorant" -- it is nothing at all, and the line silently
   keeps whatever font was set before it. */
function cardFit(x, s, max, size, fam, style){
  var pre=style? style+' ' : '', sz=size;
  x.font=pre+sz+'px '+fam;
  while(sz>10 && x.measureText(s).width>max){ sz-=2; x.font=pre+sz+'px '+fam; }
  return sz;
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
  var i, w=0, cur;
  for(i=0;i<s.length;i++) w += x.measureText(s.charAt(i)).width + track;
  w -= track;
  cur = cx - w/2;
  x.textAlign='left';
  for(i=0;i<s.length;i++){
    x.fillText(s.charAt(i), cur, y);
    cur += x.measureText(s.charAt(i)).width + track;
  }
  return w;
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
   drawn on top of it. */
function cardPlate(x, W, H, m){
  var r=Math.round(H*0.048), i=Math.round(H*0.028), o;

  x.save();
  x.shadowColor=cssVar('--glassdrop');
  x.shadowBlur=Math.round(H*0.045);
  x.shadowOffsetY=Math.round(H*0.016);
  x.fillStyle=cssVar('--raise');
  cardRR(x, m, m, W-m*2, H-m*2, r); x.fill();
  x.restore();

  /* the lit edge along the top */
  x.save();
  cardRR(x, m, m, W-m*2, H-m*2, r); x.clip();
  x.strokeStyle=cssVar('--glassspec');
  x.lineWidth=Math.max(1, Math.round(H*0.0022));
  x.beginPath(); x.moveTo(m, m+x.lineWidth/2); x.lineTo(W-m, m+x.lineWidth/2); x.stroke();
  x.restore();

  o=m+i;
  x.strokeStyle=cssVar('--goldln');
  x.lineWidth=Math.max(1, Math.round(H*0.0030));
  cardRR(x, o, o, W-o*2, H-o*2, Math.max(0, r-i)); x.stroke();
  o=m+Math.round(i*1.5);
  x.strokeStyle=cssVar('--glassspec');
  x.lineWidth=Math.max(1, Math.round(H*0.0013));
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
  var W=CARD_W, H=CARD_H, x=c.getContext('2d');
  var src=cardSrc(), items=cardUnits(src.line);
  var m=Math.round(H*0.072), pad=m+Math.round(H*0.10), avail=W-pad*2, g;
  c.width=W; c.height=H;

  /* The ground: --bg, lifted toward the upper left the way a surface under a
     light is, and falling away at the far corner. A card that was one flat
     rectangle read as a screenshot of a screen rather than as an object. */
  g=x.createLinearGradient(0, 0, W*0.9, H);
  g.addColorStop(0, cssVar('--bg'));
  g.addColorStop(1, cssVar('--sink'));
  x.fillStyle=g; x.fillRect(0,0,W,H);
  cardPlate(x, W, H, m);

  /* the script, as large as it can be and still stand inside the rules, hung
     above the middle so the reading has room under it */
  var box=Math.round(H*0.285), gap=Math.round(box*0.16), wgap=Math.round(box*0.55);
  var wide=cardWidth(items, box, gap, wgap), f;
  if(wide>avail && wide>0){
    f=avail/wide;
    box=Math.round(box*f); gap=Math.round(gap*f); wgap=Math.round(wgap*f);
    wide=cardWidth(items, box, gap, wgap);
  }
  /* The writing sits on the plate rather than in it: a soft shadow under the
     ink is the whole difference between a letter and a hole. */
  x.save();
  x.shadowColor=cssVar('--glassdrop');
  x.shadowBlur=Math.round(H*0.026);
  x.shadowOffsetY=Math.round(H*0.010);
  cardInk(x, items, Math.round((W-wide)/2), Math.round(H*0.345-box/2), box, gap, wgap);
  x.restore();

  cardMark(x, W/2, Math.round(H*0.562), Math.round(H*0.0125));

  /* the spelling, in capitals and tracked, the way the app says a small
     heading everywhere else */
  x.textBaseline='alphabetic';
  x.fillStyle=cssVar('--txs');
  var rs=cardFit(x, src.line.toUpperCase(), avail*0.80, Math.round(H*0.050), CARD_CAPS, '');
  cardTrack(x, src.line.toUpperCase(), W/2, Math.round(H*0.639), rs*0.24);

  /* what it means, in the italic every meaning in this app is set in */
  if(src.mn){
    x.fillStyle=cssVar('--tx');
    cardFit(x, src.mn, avail, Math.round(H*0.082), CARD_ITAL, 'italic');
    x.textAlign='center';
    x.fillText(src.mn, W/2, Math.round(H*0.747));
  }

  /* whose language it is, and what made it. "Lingua" is never translated. */
  x.fillStyle=cssVar('--gold');
  x.font=Math.round(H*0.030)+'px '+CARD_CAPS;
  cardTrack(x, String(langName||'').toUpperCase(), W*0.22, Math.round(H*0.852), H*0.0068);
  x.fillStyle=cssVar('--txm');
  cardTrack(x, 'LINGUA', W*0.78, Math.round(H*0.852), H*0.0068);
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
  var name=(langName||'lingua')+'.png';
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
