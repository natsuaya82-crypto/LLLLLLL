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
/* ---- the dictionary as a person may browse it -------------------------
   The free plan holds a hundred words. A language built on a paid plan and
   then brought back down to free shows the first hundred it was given, in the
   order they were made, and the rest are not on screen.
   「無料に戻ったら無料の形に戻る」

   **Nothing is deleted and nothing is unreachable.** `WORDS` is untouched and
   every word in it is written by `save()`, packed by `bkPack()` and in the
   file in Documents; a post still spells out of the whole dictionary, the
   gloss still reads it, and the language comes back whole the moment the plan
   does. What changes is one list on one screen.

   Because that is a difference between what is stored and what is shown --
   the kind of difference somebody reads as "my words are gone" -- the app
   says so twice: a line at the foot of the list, and once, out loud, on the
   day the plan ends (`capLapse()` in boot.js).

   Everything the app reads FOR ITSELF goes through `WORDS` and must keep
   doing so. `findWord()` in particular: a post's gloss, a spelling and an
   example are about words that exist, not about words that are listed, and
   filtering there would quietly change what somebody's own posts say. */
function wordsSeen(){
  if(can('words') || WORDS.length<=FREE_LIMIT) return WORDS;
  return WORDS.slice(0, FREE_LIMIT);
}
function wordsHidden(){ return WORDS.length-wordsSeen().length; }
/* One place decides what is on screen, so the list, the count and the button
   that says them all can never disagree about it. */
function wordsList(){
  var items=wordsSeen().slice(), qq=String(q||'').trim().toLowerCase();
  if(wFil==='nomn') items=items.filter(function(w){ return !wMns(w).length; });
  else if(wFil!==POS_ALL) items=items.filter(function(w){ return w.pos===wFil; });
  if(qq) items=items.filter(function(w){ return srcKey(w).indexOf(qq)>=0; });
  if(wSort==='new') items.sort(function(a,b){ return (b.at||0)-(a.at||0); });
  else items.sort(function(a,b){ return String(a.hw).localeCompare(String(b.hw)); });
  return items;
}
/* Every word is a row of its own. A derived word used to be indented under
   its parent in alphabetical order and listed flat in every other, which is
   two shapes for one list -- and the nesting only ever told the truth in the
   order where the parent happens to be next to it: sorted by when they were
   made, or narrowed to the verbs, the parent may not be on screen at all.

   It is a page now, the same as any other word, and it carries its whole
   family on it. 「派生語もそれだけで単独のページ欲しくない？単独があるならそこに
   出す必要ない」 So the list is one row per word and each one says what it is
   of the word it came from. */
function wordsBodyHTML(items){
  if(!items.length)
    return '<div class="empty"><div class="eb">'+
      ((q||wFil!==POS_ALL)? t('words.nomatch') : t('words.empty'))+'</div></div>';
  if(wSort!=='a') return items.map(entryOneHTML).join('');
  var out='', cur='';
  items.forEach(function(w){
    var L=String(w.hw).charAt(0).toUpperCase();
    if(L!==cur){ cur=L; out+='<div class="gl">'+esc(cur)+'</div>'; }
    out+=entryHTML(w);
  });
  return out;
}
/* map() hands its callback the index as a second argument, which is how a
   two-argument entryHTML() used to give every row after the first the wrong
   one. */
function entryOneHTML(w){ return entryHTML(w); }
/* Which of them, and in what order -- one row, beside each other, because
   they are two halves of the same question. It was a strip under the filter
   holding the count, the order and Play all, and the count is already at the
   top of the screen. 「allの横に⇆並べ替えつけて〇パッチは廃止」
   Play all is gone: a word says itself on its own row now. */
function wSortRow(){
  return '<button class="wsrt"' + DO('wSetSort') + '>'+ICON_SORT+
    esc(t(wSort==='a'? 'words.sort.a' : 'words.sort.new'))+'</button>';
}
/* The words that are not on the list, said where they are missing from.

   A list that is quietly a hundred long when the dictionary is five thousand
   is the app telling somebody their work is gone. It is not gone -- it is in
   `WORDS`, in `save()`, in the backup and in the file in Documents -- and the
   place to say so is the foot of the list it is missing from, not only a
   message they saw once weeks ago. */
function wordsHidHTML(){
  var n=wordsHidden();
  if(!n) return '';
  return '<button class="capwarn" style="margin:14px 0 0"' + DO('goPlans') + '>'+
    t('cap.hid', n)+'<span class="capgo">'+t('up.cta')+ICON_GO+'</span></button>';
}
/* The ... in the dictionary's bar. What is behind it is about the WORDS of
   this language rather than about one of them -- the rules that make a form
   out of a word, which sat at the head of the grammar chapter above the
   fifteen stages and is not a stage. 「規則で作る形はあってもいいけど、ここに
   載せるのは反対」

   It is where a downloaded word list will go too, when there is one to go
   there: both are the dictionary seen from outside a single word. Nothing is
   put here before it exists -- a row that opens nothing is a button that used
   to work. */
function wordsMore(){
  openForm('wmore', t('words.more'),
    '<button class="set" style="border-bottom:none"' + DO('go', ["forms"]) + '>'+
      '<span class="sl">'+esc(t('fmr.title'))+'</span>'+
      '<span class="sv">'+(fmRules().length? String(fmRules().length) : '')+
      ICON_GO+'</span></button>');
}
FORM_OPEN.wmore=function(){ wordsMore(); };
function vWords(){
  var items=wordsList();
  return '<div class="view">'+
    navTop('',
           '<button class="navq"' + DO('wordsMore') + ' aria-label="'+
             esc(t('words.more'))+'">'+ICON_DOTS+'</button>')+
    '<div class="chead">'+
    '<div class="search"><span class="lens">'+ICON_LENS+'</span>'+
    '<input id="w-q" placeholder="'+esc(t('words.search'))+'" value="'+esc(q)+'"' + IN('wordsSetQ') + '>'+
    /* always in the page, shown when there is something to clear -- typing
       repaints the list, not the header, so a button conjured up by the query
       string would never appear until the screen was left and come back to */
    '<button class="sx" id="w-x"' + DO('clearQ') + ''+(q?'':' hidden')+
      ' aria-label="'+esc(t('words.clear'))+'">'+ICON_CROSS+'</button>'+
    '</div>'+
    /* One button, not a row of twelve. A part of speech is a CHOICE and a
       row of them is a scroll: the one you want is off the side about half
       the time, and adding a thirteenth made it worse.
       「品詞スロットも横に並べるのじゃなくてタップしたら品詞を開いて選べるタイプ
       にして」 It says which one is on and opens the list. */
    '<div class="wfilrow">'+
      '<button class="wfil"' + DO('openFil') + '>'+
        '<span class="wfilv">'+esc(wFilLab())+'</span>'+ICON_GO+'</button>'+
      wSortRow()+
    '</div>'+
    '</div><div class="body" id="w-list">'+wordsBodyHTML(items)+wordsHidHTML()+'</div>'+
    /* A round + under the thumb, not a bar across the foot. The bar was as
       wide as the screen and sat on top of the last two words in the list --
       and the timeline has had this exact button since it was written, in
       this exact place, for this exact reason. Same class, same corner.
       Nothing new was invented for it. */
    '<button class="fab"' + DO('openAdd') + ' aria-label="'+esc(t('home.write'))+'">'+
      ICON_ADD2+'</button></div>';
}
/* Typing redraws the list and the count and nothing else, because redrawing
   the screen would take the keyboard's focus off the box being typed into. */
function wordsPaint(){
  var el=document.getElementById('w-list'); if(!el) return;
  var items=wordsList();
  el.innerHTML=wordsBodyHTML(items)+wordsHidHTML();
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
/* What the list is filtered to, as a word. */
function wFilLab(){
  var fs=wFilters(), i;
  for(i=0;i<fs.length;i++) if(fs[i].k===wFil) return fs[i].lab;
  return posLabel(POS_ALL);
}
/* The list, on a sheet. Every kind that has a word in it, and the count
   beside each -- which the row of tabs could not show and is most of what
   somebody is choosing on. */
function openFil(){
  var fs=wFilters();
  openForm('wfil', t('f.pos'), fs.map(function(f){
    return '<button class="set"' + DO('wSetFil', [f.k]) + '>'+
      '<span class="sl'+(wFil===f.k? ' on':'')+'">'+esc(f.lab)+'</span>'+
      (wFil===f.k? '<span class="sv">'+ICON_TICK+'</span>' : '')+'</button>';
  }).join(''));
}
FORM_OPEN.wfil=function(){ openFil(); };
function wSetFil(k){
  wFil=k;
  /* Chosen on a sheet, so the sheet goes and the list is what you land on. */
  if(here().r==='form') back(); else render();
}
function wSetSort(){ wSort=(wSort==='a')?'new':'a'; render(); }
/* One entry. The word says itself when you touch it; the chevron at its edge
   opens it. Listening is what you do dozens of times on this screen and
   editing is what you do once.

   Every sense, numbered, and not only the first: a word with three meanings
   that shows one is lying about the word.

   Nothing about the family. A word is a word on this list; what it is of the
   word it came from, and what has come from it, is on its page. */
function entryHTML(w){
  var mns=wMns(w), mn;
  /* A missing meaning in a dictionary row is something to do, not a fact to
     report -- 「意味のところにまだ決めてないって書くのやめてくんない？」. As the name
     of a filter it stays "no meaning", because there it does describe a set. */
  if(!mns.length) mn='<span class="nomn">'+esc(t('words.addmn'))+'</span>';
  else if(mns.length===1) mn=esc(mns[0]);
  else mn=mns.map(function(m,i){
    return '<span class="sn">'+(i+1)+'</span>'+esc(m); }).join(' ');
  return '<div class="entry">'+
    /* The row opens the word, and it is the whole row. It used to say the word
       aloud, and the only way into the word itself was a chevron at the right
       edge the width of a fingernail -- so everything a word has (its
       meanings, its family, what means the same, what means the opposite, its
       examples, its note) was behind a target nobody would find.
       「類義語とか書いてあったあのページはどこ言ったの？」 It had gone nowhere.

       Nothing on the row plays it. The free plan does not edit sound, so a
       button about sound on every line of the dictionary is a control for a
       thing this plan does not do 「無料版は音の編集できないから」. The word's
       own page has one, which is where somebody asking to hear it is. */
    '<button class="ebody"' + DO('openWord', [w.hw]) + ' aria-label="'+esc(t('words.open'))+'">'+
    '<div class="hwrow"><span class="hw">'+esc(wOut(w.hw))+'</span>'+
    '<span class="rd">'+esc(phIpa(wPh(w)))+'</span>'+
    '<span class="pos">'+esc(posLabel(w.pos))+'</span></div>'+
    '<div class="mn">'+mn+'</div>'+

    '</button>'+
    /* Beside the row rather than at the head of the list. Hearing one word is
       a thing you do to that word, and Play all answered a question nobody
       asked while burying the one they did. */
    '<button class="esay"' + DO('sayPh', [wPh(w)]) + ' aria-label="'+
      esc(t('f.listen'))+'">'+ICON_SPK+'</button>'+
    '</div>';
}

