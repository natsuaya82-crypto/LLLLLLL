/* Lingua — the dictionary (chapter 7)
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   7. Words (the dictionary)
   ========================================================================= */
/* The dictionary is one screen, and it was one list. A box that filtered as
   you typed, entries sorted one way, and the first of a word's meanings. That
   is a word list; a dictionary is a thing you go into looking for something.
   So: search that says what it found and can be cleared, a rail that narrows
   by part of speech and can show the words still waiting for a meaning, a
   choice of order, every sense on the entry rather than the first, and where
   a word came from written on it rather than implied by an indent. */
var q='', wFil='*', wSort='a';
function wFilters(){
  var out=[{k:POS_ALL, lab:posLabel(POS_ALL)}], i;
  for(i=0;i<POS.length;i++) out.push({k:POS[i], lab:posLabel(POS[i])});
  out.push({k:'nomn', lab:t('sent.nomean')});
  return out;
}
/* One place decides what is on screen, so the list, the count and the button
   that says them all can never disagree about it. */
function wordsList(){
  var items=WORDS.slice(), qq=String(q||'').trim().toLowerCase();
  if(wFil==='nomn') items=items.filter(function(w){ return !wMns(w).length; });
  else if(wFil!==POS_ALL) items=items.filter(function(w){ return w.pos===wFil; });
  if(qq) items=items.filter(function(w){ return srcKey(w).indexOf(qq)>=0; });
  if(wSort==='new') items.sort(function(a,b){ return (b.at||0)-(a.at||0); });
  else items.sort(function(a,b){ return String(a.hw).localeCompare(String(b.hw)); });
  return items;
}
/* Nesting a derived word under its parent only tells the truth in the order
   where the parent is next to it. Sorted by when they were made, or narrowed
   to the verbs, the parent may not be on screen at all -- so that order lists
   every word flat, and each one says where it came from itself. */
function wordsBodyHTML(items){
  if(!items.length)
    return '<div class="empty"><div class="eb">'+
      ((q||wFil!==POS_ALL)? t('words.nomatch') : t('words.empty'))+'</div></div>';
  if(wSort!=='a'){
    return items.map(function(w){ return entryHTML(w, false); }).join('');
  }
  var out='', cur='', shown={};
  items.forEach(function(w){ shown[String(w.hw)]=1; });
  items.forEach(function(w){
    if(w.from && shown[w.from]) return;      /* listed under its parent, not twice */
    var L=String(w.hw).charAt(0).toUpperCase();
    if(L!==cur){ cur=L; out+='<div class="gl">'+esc(cur)+'</div>'; }
    out+=entryHTML(w, false);
    wKids(w).forEach(function(k){ if(shown[String(k.hw)]) out+=entryHTML(k, true); });
  });
  return out;
}
function wMetaHTML(items){
  return '<span class="wct">'+tn('words.n', items.length)+'</span>'+
    '<button class="wsrt"' + DO('wSetSort') + '>'+ICON_SORT+
      esc(t(wSort==='a'? 'words.sort.a' : 'words.sort.new'))+'</button>'+
    (items.length>1
      ? '<button class="wsay'+(vxRunning()?' on':'')+'"' + DO('wordsSay') + '>'+
        (vxRunning()? ICON_CROSS+t('words.stop') : ICON_PLAY+t('words.sayall'))+'</button>'
      : '');
}
function vWords(){
  var items=wordsList();
  return '<div class="view">'+
    navTop(WORDS.length+(can('words')?'':' / '+FREE_LIMIT))+
    '<div class="chead">'+
    '<div class="search"><span class="lens">'+ICON_LENS+'</span>'+
    '<input id="w-q" placeholder="'+esc(t('words.search'))+'" value="'+esc(q)+'"' + IN('wordsSetQ') + '>'+
    /* always in the page, shown when there is something to clear -- typing
       repaints the list, not the header, so a button conjured up by the query
       string would never appear until the screen was left and come back to */
    '<button class="sx" id="w-x"' + DO('clearQ') + ''+(q?'':' hidden')+
      ' aria-label="'+esc(t('words.clear'))+'">'+ICON_CROSS+'</button>'+
    '</div>'+
    '<div class="segs scrollx">'+wFilters().map(function(f){
      return '<button class="seg'+(wFil===f.k?' on':'')+'"' + DO('wSetFil', [f.k]) + '>'+esc(f.lab)+'</button>';
    }).join('')+'</div>'+
    '<div class="wmeta" id="w-meta">'+wMetaHTML(items)+'</div>'+
    '</div><div class="body" id="w-list">'+wordsBodyHTML(items)+'</div>'+
    '<div class="barfix"><button class="btn"' + DO('openAdd') + '>'+t('home.write')+'</button></div></div>';
}
/* Typing redraws the list and the count and nothing else, because redrawing
   the screen would take the keyboard's focus off the box being typed into. */
function wordsPaint(){
  var el=document.getElementById('w-list'); if(!el) return;
  var items=wordsList();
  el.innerHTML=wordsBodyHTML(items);
  var m=document.getElementById('w-meta'); if(m) m.innerHTML=wMetaHTML(items);
  var x=document.getElementById('w-x'); if(x){ if(q) x.removeAttribute('hidden'); else x.setAttribute('hidden',''); }
}
function wordsSetQ(v){ q=v; wordsPaint(); }
/* Clearing leaves the cursor where it was, because clearing a search is
   nearly always the first half of typing a different one. */
function clearQ(){
  var e=document.getElementById('w-q');
  q=''; if(e){ e.value=''; e.focus(); }
  wordsPaint();
}
function wSetFil(k){ wFil=k; render(); }
function wSetSort(){ wSort=(wSort==='a')?'new':'a'; render(); }
/* One entry. The word says itself when you touch it; the chevron at its edge
   opens it. Listening is what you do dozens of times on this screen and
   editing is what you do once.

   Every sense, numbered, and not only the first: a word with three meanings
   that shows one is lying about the word. Where it came from is written on
   it, and how many words have come from it, because that is the shape of a
   dictionary and an indent alone cannot say it. */
function entryHTML(w, kid){
  var mns=wMns(w), kids=wKids(w), par=wParent(w), mn;
  /* A missing meaning in a dictionary row is something to do, not a fact to
     report -- 「意味のところにまだ決めてないって書くのやめてくんない？」. As the name
     of a filter it stays "no meaning", because there it does describe a set. */
  if(!mns.length) mn='<span class="nomn">'+esc(t('words.addmn'))+'</span>';
  else if(mns.length===1) mn=esc(mns[0]);
  else mn=mns.map(function(m,i){
    return '<span class="sn">'+(i+1)+'</span>'+esc(m); }).join(' ');
  var line='';
  if(par) line+='<span class="efrom">'+esc(t('word.from', par.hw))+'</span>';
  if(kids.length && !(wSort==='a' && !q && wFil===POS_ALL))
    line+='<span class="ekids">'+esc(tn('words.kids', kids.length))+'</span>';
  return '<div class="entry'+(kid?' kid':'')+'">'+
    '<button class="ebody"' + DO('sayPh', [wPh(w)]) + ' aria-label="'+esc(t('f.listen'))+'">'+
    '<div class="hwrow"><span class="hw">'+esc(wOut(w.hw))+'</span>'+
    '<span class="rd">'+esc(phIpa(wPh(w)))+'</span>'+
    '<span class="pos">'+esc(posLabel(w.pos))+'</span></div>'+
    '<div class="mn">'+mn+'</div>'+
    (line? '<div class="erel">'+line+'</div>' : '')+
    '</button>'+
    '<button class="eopen"' + DO('openWord', [w.hw]) + ' aria-label="'+esc(t('words.open'))+'">'+ICON_GO+'</button></div>';
}
/* Every word on screen, said straight through -- on screen and not in the
   dictionary, so a search narrowed to the verbs says the verbs. */
function wordsSay(){
  saySeqs(wordsList().map(function(w){ return wPh(w); }));
}

