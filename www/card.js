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
/* The picture is made at this many pixels square whatever the phone is, so a
   card saved on an old small screen is the same file as one saved on a new
   large one. What the preview is shown at is the CSS's business. */
var CARD_S=1080;

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
  var v=CARD.v, i, w, ex;
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
      x.fillStyle=cssVar('--tx');
      x.textAlign='left'; x.textBaseline='alphabetic';
      x.font=Math.round(box*0.80)+'px Georgia, serif';
      x.fillText(items[i].tx, cur, oy+box*0.82);
    }
    cur+=box;
  }
}
/* The largest size at which a string still fits the width it is given. A
   sentence is longer than a word and there is no wrapping on a canvas. */
function cardFit(x, s, max, size, fam){
  var sz=size;
  x.font=sz+'px '+fam;
  while(sz>10 && x.measureText(s).width>max){ sz-=2; x.font=sz+'px '+fam; }
  return sz;
}

var CARD_FAM='-apple-system, Georgia, serif';
function cardPaint(c){
  var S=CARD_S, x=c.getContext('2d'), src=cardSrc(), items=cardUnits(src.line);
  var pad=Math.round(S*0.12), avail=S-pad*2;
  c.width=S; c.height=S;
  x.fillStyle=cssVar('--bg'); x.fillRect(0,0,S,S);

  /* the script, as large as it can be and still stand inside the margins */
  var box=Math.round(S*0.21), gap=Math.round(box*0.17), wgap=Math.round(box*0.55);
  var wide=cardWidth(items, box, gap, wgap), f;
  if(wide>avail && wide>0){
    f=avail/wide;
    box=Math.round(box*f); gap=Math.round(gap*f); wgap=Math.round(wgap*f);
    wide=cardWidth(items, box, gap, wgap);
  }
  cardInk(x, items, Math.round((S-wide)/2), Math.round(S*0.30), box, gap, wgap);

  /* the spelling, the rule, the meaning */
  x.textAlign='center'; x.textBaseline='alphabetic';
  x.fillStyle=cssVar('--txs');
  cardFit(x, src.line, avail, Math.round(S*0.044), CARD_FAM);
  x.fillText(src.line, S/2, Math.round(S*0.625));

  x.fillStyle=cssVar('--goldln');
  x.fillRect(Math.round(S/2-S*0.055), Math.round(S*0.672),
             Math.round(S*0.11), Math.max(1, Math.round(S*0.0016)));

  if(src.mn){
    x.fillStyle=cssVar('--tx');
    cardFit(x, src.mn, avail, Math.round(S*0.052), CARD_FAM);
    x.fillText(src.mn, S/2, Math.round(S*0.745));
  }

  /* whose language it is, and what made it. "Lingua" is never translated. */
  x.font=Math.round(S*0.027)+'px Georgia, serif';
  x.textAlign='left';  x.fillStyle=cssVar('--gold');
  x.fillText(String(langName||'').toUpperCase(), pad, Math.round(S*0.905));
  x.textAlign='right'; x.fillStyle=cssVar('--txm');
  x.fillText('LINGUA', S-pad, Math.round(S*0.905));
}
function cardMount(){
  var c=document.getElementById('cardc');
  if(c) cardPaint(c);
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
