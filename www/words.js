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
/* The orders the list can be in, in the order they are offered.
   「単語だけど並べ替えをもっと充実させたい。最新とかいらんし、グループごととか、
   アルファベットとか。」OWNER 2026-09-01（ビルド #107、実機）

   It was a BUTTON THAT FLIPPED, and two is the only number a flip can hold --
   so "richer" is not a third label on that button, it is the same shape the
   part of speech beside it already has: a list you go to, ticked, and back.
   `openSort` is `openFil` with a different list in it and nothing new was
   invented for either.

   Newest first is gone 「最新とかいらん」. Nothing is lost by it: `at` is still
   on every word, `word.made` still says it on the word's own page, and a
   dictionary is a thing you look a word up in rather than a feed.

   A GROUP is a part of speech. That is what the app itself classes a word by
   -- `POS` is the list, every word carries one, `migratePos()` gives one to a
   word that arrived without, and `wFilters()` is the same thirteen. `tags` is
   what a person writes and most words have none; a family is what a word came
   from and most words have none. */
function wSorts(){
  return [{k:'a', lab:t('words.sort.a')}, {k:'pos', lab:t('words.sort.pos')}];
}
/* Which order it is in, as a word. */
function wSortLab(){
  var ss=wSorts(), i;
  for(i=0;i<ss.length;i++) if(ss[i].k===wSort) return ss[i].lab;
  return ss[0].lab;
}
/* What heading a word sits under -- the one place, so the order and the
   headings above it cannot disagree about where a word goes. Every order
   groups now: the letter it starts with, or the kind of word it is. */
function wGroupLab(w){
  if(wSort==='pos') return posLabel(w.pos);
  return String(w.hw).charAt(0).toUpperCase();
}
/* ---- choosing rows, and doing one thing to all of them -----------------
   「選択ボタン押して一括削除とか一括編集できるようにしたい。」
   OWNER 2026-09-01（ビルド #107、実機）

   `wSel` is null when the list is an ordinary list and a map of headwords
   when it is a list you are choosing from. Null and empty are different
   states: an empty map is "selecting, nothing chosen yet", and a map is
   never read for its size to answer whether choosing is on.

   Neither this nor the undo below is the language's -- nothing here is
   written to `localStorage`, nothing is in `SLICES`, and nothing is in the
   backup. They are forgotten in two different places and that is not an
   oversight: `wSel` is in `viewReset()` beside the search and the order,
   because it is where you are standing in a LANGUAGE, and going to the page
   that edits what was chosen must not throw the choice away. `wUndo` is in
   `viewLeft()`, which is walking off the screen, because it holds words as
   they were at the positions they were in. */
var wSel=null;
/* What a bulk delete can put back, held only while you are standing on the
   list it happened on. */
var wUndo=null;
function wSelList(){
  var out=[], k;
  if(!wSel) return out;
  for(k in wSel) if(wSel.hasOwnProperty(k) && wSel[k]) out.push(k);
  return out;
}
function wSelOn(){ wSel={}; wUndo=null; render(); }
function wSelOff(){ wSel=null; render(); }
/* The whole screen, not the list. Choosing the first row is what turns the far
   end of the bar from Done into Delete -- and that is OUTSIDE `#w-list`, which
   is all `wordsPaint()` redraws. Repainting only the list left the bar saying
   Done with twenty words chosen. */
function wSelTap(hw){
  if(!wSel) return;
  if(wSel[hw]) delete wSel[hw]; else wSel[hw]=1;
  render();
}
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
  var cap=wordCap();
  if(WORDS.length<=cap) return WORDS;
  return WORDS.slice(0, cap);
}
function wordsHidden(){ return WORDS.length-wordsSeen().length; }
/* One place decides what is on screen, so the list, the count and the button
   that says them all can never disagree about it. */
function wordsList(){
  var items=wordsSeen().slice(), qq=String(q||'').trim().toLowerCase();
  if(wFil==='nomn') items=items.filter(function(w){ return !wMns(w).length; });
  else if(wFil!==POS_ALL) items=items.filter(function(w){ return w.pos===wFil; });
  if(qq) items=items.filter(function(w){ return srcKey(w).indexOf(qq)>=0; });
  /* Alphabetically within a group as well as without one, so a part of
     speech holding two hundred words is still a list a word can be found in.
     A word whose part of speech is not one the app knows sorts after the
     thirteen rather than before them -- indexOf answers -1, and -1 sorting
     first would put the one word nobody classed at the head of the whole
     dictionary. */
  items.sort(function(a,b){
    var d;
    if(wSort==='pos'){
      d=wPosAt(a.pos)-wPosAt(b.pos);
      if(d) return d;
    }
    return String(a.hw).localeCompare(String(b.hw));
  });
  return items;
}
/* Where a part of speech comes in the app's own order, and after all of them
   when it is not one of them. */
function wPosAt(k){
  var i=POS.indexOf(String(k||''));
  return (i<0)? POS.length : i;
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
  var out='', cur=null;
  items.forEach(function(w){
    var g=wGroupLab(w);
    if(g!==cur){ cur=g; out+='<div class="gl">'+esc(cur)+'</div>'; }
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
  return '<button class="wsrt"' + DO('openSort') + '>'+ICON_SORT+
    esc(wSortLab())+'</button>';
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
function vWords(){
  var items=wordsList();
  return '<div class="view">'+
    /* One mark, so .navq's own margin-left:auto is the whole of the push and
       the .bkw wrapper is not needed. The ⋯ that stood beside it is gone: two
       sessions each took a row out of the sheet it opened -- the word ask
       moved to this bar, and the rules moved into the grammar page's chapters
       -- and neither saw that the last row had gone with the other's. A ⋯
       that opens nothing is a button that used to work. */
    /* Choosing is what the far end of the bar is for -- 「その場で終わらせる
       もの」 -- and it is where an iPhone puts Select. Two controls sit there
       and neither is placed by hand: `.navq` and `.navdo` both carry
       margin-left:auto, so the first takes the free space and the second
       lands against it. */
    /* WHILE CHOOSING, THE FAR END OF THE BAR IS THE DELETE.
       「右上に選択したら削除できるみたいな感じに」 OWNER 2026-09-01. It is
       one control and it always says the thing there is to do: nothing chosen
       yet, so it says Done and leaves; something chosen, so it deletes it. It
       was at the foot of the screen in a bar of its own, which is a second
       bar for one button. */
    navTop('', wSel
      ? ((wSelList().length
            ? '<button class="navdo navdel"' + DO('wSelDel') + '>'+
                esc(t('words.sel.del'))+'</button>'
            : '')+
         /* AND THE WAY OUT, ALWAYS. Delete replaced it for a moment and that
            left a screen you could only leave by deleting something or by
            going back a page. 「それって完了消したの？」OWNER 2026-09-01.
            Two controls, and neither is placed by hand: both carry
            margin-left:auto, so the first takes the free space and the
            second lands against it -- Done at the far end, where an iPhone
            puts it. */
         '<button class="navdo"' + DO('wSelOff') + '>'+esc(t('words.sel.done'))+'</button>')
      : '<button class="navdo"' + DO('wSelOn') + '>'+esc(t('words.sel'))+'</button>')+
    '<div class="chead">'+
    /* THE SAME FIELD AS EVERYWHERE ELSE, and it was an <input>.
       「全部改行して画面内に文字が収まるようにして欲しい」 OWNER 2026-08-27,
       and 「全部なくせ」 when asked what was left -- the search box included.
       An <input> is one row that scrolls sideways forever: past the width of
       the phone what was typed first simply left the screen. There is no CSS
       for it; the element has to change. lnField() is the one place that
       shape lives -- no new mechanism here, and nothing else about this row
       moves. It grows with what is in it (lnGrow, below). */
    '<div class="search"><span class="lens">'+ICON_LENS+'</span>'+
    lnField('w-q', t('words.search'), IN('wordsSetQ'), q)+
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
    /* The same row, saying the same two things, plus the one thing that only
       exists while you are choosing. The filter and the order stay up: what
       somebody is about to select twenty of is nearly always what they have
       just narrowed the list down to. */
    '<div class="wfilrow">'+
      '<button class="wfil"' + DO('openFil') + '>'+
        '<span class="wfilv">'+esc(wFilLab())+'</span>'+ICON_GO+'</button>'+
      /* SELECT ALL / DESELECT ALL IS GONE. 「全て選択ってボタン出さないで
         欲しい。なくていいよ。その代わりスライドで下ビューで選択できるように
         したい」 OWNER 2026-09-01 -- a button that acts on rows you cannot
         see, next to a filter and a sort that decide which rows those are, is
         a button whose meaning changes under it. The thumb slid down the
         marks is what chooses a run of them now. */
      wSortRow()+
    '</div>'+
    '</div><div class="body" id="w-list">'+wordsBodyHTML(items)+wordsUndoHTML()+wordsHidHTML()+'</div>'+
    /* A round + under the thumb, not a bar across the foot. The bar was as
       wide as the screen and sat on top of the last two words in the list --
       and the timeline has had this exact button since it was written, in
       this exact place, for this exact reason. Same class, same corner.
       Nothing new was invented for it. */
    /* While choosing, the round + is not what the thumb is for. What is under
       it is the two things being done to what was chosen, in the bar across
       the foot the app already has (`.barfix`, worn by www/sheet.js and
       www/sound.js). Both are down until something is chosen: a button that
       does nothing is a button that is broken. */
    /* Delete and nothing else. 「複数選択のedit今実装しないでいいやdeleteだけ
       にしよう。」OWNER 2026-09-01 -- so the page that wrote one part of
       speech over everything chosen is not in the app, and neither is the
       button that opened it. It is in the BAR now and not in a strip across
       the foot; while choosing, the round + is simply not there. */
    (wSel? ''
      : '<button class="fab"' + DO('openAdd') + ' aria-label="'+esc(t('home.write'))+'">'+
          ICON_ADD2+'</button>')+
    '</div>';
}
/* Typing redraws the list and the count and nothing else, because redrawing
   the screen would take the keyboard's focus off the box being typed into. */
function wordsPaint(){
  var el=document.getElementById('w-list'); if(!el) return;
  var items=wordsList();
  el.innerHTML=wordsBodyHTML(items)+wordsUndoHTML()+wordsHidHTML();
  var x=document.getElementById('w-x'); if(x){ if(q) x.removeAttribute('hidden'); else x.setAttribute('hidden',''); }
}
/* The box is as tall as what is in it, and only render() does that on its
   own -- typing repaints the list rather than the screen, so the field would
   stay one row while the text wrapped out of sight underneath. */
function wordsSetQ(v){ q=v; lnGrow('w-q'); wordsPaint(); }
/* Clearing leaves the cursor where it was, because clearing a search is
   nearly always the first half of typing a different one. */
function clearQ(){
  var e=document.getElementById('w-q');
  q=''; if(e){ e.value=''; e.focus(); }
  lnGrow('w-q');
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
    return '<button class="set"' + DO('wordsSetFil', [f.k]) + '>'+
      '<span class="sl'+(wFil===f.k? ' on':'')+'">'+esc(f.lab)+'</span>'+
      (wFil===f.k? '<span class="sv">'+ICON_TICK+'</span>' : '')+'</button>';
  }).join(''));
}
FORM_OPEN.wfil=function(){ openFil(); };
function wordsSetFil(k){
  wFil=k;
  /* Chosen on a sheet, so the sheet goes and the list is what you land on. */
  if(here().r==='form') back(); else render();
}
/* The orders, on a page. The same list, the same rows and the same tick as
   the part of speech beside it -- see openFil above; the only difference is
   what is in it. */
function openSort(){
  openForm('wsort', t('sort.title'), wSorts().map(function(s){
    return '<button class="set"' + DO('wordsSetSort', [s.k]) + '>'+
      '<span class="sl'+(wSort===s.k? ' on':'')+'">'+esc(s.lab)+'</span>'+
      (wSort===s.k? '<span class="sv">'+ICON_TICK+'</span>' : '')+'</button>';
  }).join(''));
}
FORM_OPEN.wsort=function(){ openSort(); };
function wordsSetSort(k){
  wSort=k;
  /* Chosen on a page, so the page goes and the list is what you land on. */
  if(here().r==='form') back(); else render();
}
/* ---- doing it, and being able to not have done it ----------------------
   「重要な操作は取り消せること」 -- the owner's, and the DELETE REVIEW for this
   is in docs/CHANGELOG.md. Deleting twenty words at once is the most
   dangerous thing this app can do, so it is asked AND it can be put back:
   not one or the other. The keyboard's bin gets away with only the step back
   because it takes one row and the step back is exactly one row
   (CLAUDE.md § 19); this takes as many as were ticked.

   What is kept is what WAS THERE, copied whole and before anything is cut --
   the words with the positions they were at, every word left standing that
   pointed at one of them, and the lines. Remembering what you meant to change
   is how an undo puts back a state the app was never in.

   Position matters and is not tidiness: WORDS' order is the order a free
   language's hundred are counted off in (`wordsSeen`), so putting a word back
   at the end would move somebody else's word off the list. */
function wRelHit(x, k, set){
  var a=x[k]||[], i;
  for(i=0;i<a.length;i++) if(set[a[i]]) return true;
  return false;
}
function wKeepDel(hws){
  var set={}, keep={n:hws.length, w:[], other:[],
                    lines:JSON.parse(JSON.stringify(LINES))}, i;
  for(i=0;i<hws.length;i++) set[hws[i]]=1;
  WORDS.forEach(function(x, ix){
    if(set[x.hw]){ keep.w.push({at:ix, w:JSON.parse(JSON.stringify(x))}); return; }
    if((x.from && set[x.from]) || wRelHit(x,'syn',set) || wRelHit(x,'ant',set))
      keep.other.push({hw:String(x.hw), w:JSON.parse(JSON.stringify(x))});
  });
  return keep;
}
function wSelDel(){
  var hws=wSelList(), keep, i;
  if(!hws.length) return;
  /* 確認は自前のポップで。「標準は使わねえって言ってるだろこれも禁止や」
     OWNER 2026-09-01 -- confirm() は使わない。はいの側がこの下。 */
  popAsk(t('confirm.delmany', hws.length), function(){ wSelDelGo(); }, t('pop.yes'));
}
function wSelDelGo(){
  var hws=wSelList(), keep, i;
  if(!hws.length) return;
  keep=wKeepDel(hws);
  for(i=0;i<hws.length;i++) wDrop(hws[i]);
  save();
  /* The trail names words, and every one of these is gone from it -- the same
     two screens `delWord` drops for the one word it takes. */
  for(i=0;i<hws.length;i++){ navDrop('edit:'+hws[i]); navDrop('word:'+hws[i]); }
  wUndo=keep; wSel=null;
  render();
}
/* Putting it back. The words that were taken out go in at the index they came
   out of, in the order they were in, so each splice lands where it was; the
   words that were only pointed AT are written back whole, which is what
   `impUndo` does with what an import overwrote. */
function wSelUndo(){
  var u=wUndo, i, k;
  if(!u) return;
  for(i=0;i<u.w.length;i++) WORDS.splice(u.w[i].at, 0, u.w[i].w);
  for(i=0;i<u.other.length;i++){
    k=WORDS.indexOf(findWord(u.other[i].hw));
    if(k>=0) WORDS[k]=u.other[i].w;
  }
  LINES=u.lines;
  save();
  wUndo=null;
  render();
  toast(t('words.sel.back', u.n));
}
/* What just happened, at the foot of the list it happened to, with the way to
   make it not have happened. `impUndo`'s row, in the place this one's is
   missing from -- and it lasts exactly as long as you are looking at the list,
   because it holds words as they were at the positions they were in and
   writing those over whatever came later is a restore WINNING
   (docs/DATA_SAFETY.md § 2). viewLeft() in www/shell.js drops it. */
function wordsUndoHTML(){
  if(!wUndo) return '';
  return '<div class="wsub2" style="margin-top:18px">'+
      esc(t('words.sel.gone', wUndo.n))+'</div>'+
    '<button class="set" style="border-bottom:none"' + DO('wSelUndo') + '>'+
      '<span class="sl">'+esc(t('imp.undo'))+'</span></button>';
}
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
  /* While the list is one you are choosing from, the row IS the choice: it
     puts a tick on and takes it off, and it does not open the word. Nothing
     is drawn beside it either -- a play button under a thumb that is picking
     rows is a word said by mistake, twenty times. */
  /* THE MARK IS AT THE FRONT, and it is a ring with the middle filled once
     the row is in. 「選択た時ケツにチェックじゃなくて前に◉が入るようにして
     欲しい」 OWNER 2026-09-01. It was a tick off the right-hand end, which
     is where iOS puts a setting's answer and not where a list says what is
     chosen -- and a column of ticks that is empty until something is chosen
     reads as nothing at all until you have already worked out how the screen
     works.

     `data-sel` is what makes the column a HANDLE: a thumb put on it and slid
     down chooses every row it crosses (www/shell.js § sliding down a list).
     Everywhere else on the row still scrolls, because a list being chosen
     from is still a list you have to get to the bottom of. */
  if(wSel) return '<div class="entry">'+
    '<span class="ltck'+(wSel[w.hw]? ' on':'')+'" data-sel="1"'+DO('wSelTap', [w.hw])+
      ' role="button" aria-label="'+esc(t('words.sel.row'))+'">'+
      (wSel[w.hw]? ICON_DOT : ICON_RING)+'</span>'+
    '<button class="ebody"' + DO('wSelTap', [w.hw]) + ' aria-label="'+esc(t('words.sel.row'))+'">'+
    '<div class="hwrow"><span class="hw">'+esc(wOut(w.hw))+'</span>'+
    '<span class="rd">'+esc(phIpa(wPh(w)))+'</span>'+
    '<span class="pos">'+esc(posLabel(w.pos))+'</span></div>'+
    '<div class="mn">'+mn+'</div>'+
    '</button>'+
    '</div>';
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

