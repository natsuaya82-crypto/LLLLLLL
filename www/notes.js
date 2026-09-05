/* Lingua — notes: the part of a language that is not a word, a sound or a rule
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   Everything else in this app is structured: a word has a meaning and a part
   of speech, a sound sits in a cell of the chart, a decision is one of four
   buttons. But most of what somebody knows about a language they are making
   has no shape yet -- who speaks it, why the word for river is also the word
   for road, the thing you thought of on a train and will not remember
   tomorrow. There was nowhere to put any of it, so it went nowhere.

   This is the nowhere. Plain text, a title if you want one, and it is kept on
   the device with everything else. */

var NOTES=[];
/* The open language's notes. Empty first: see langRead() in core.js. */
function ntRead(){
  NOTES=[];
  try{ var nt=JSON.parse(slRd(langKey('notes'))||'[]'); if(Array.isArray(nt)) NOTES=nt; }catch(e){}
  ntSwipeAt=-1;               /* another language's rows are not these rows */
}
ntRead();
function saveNotes(){ if(langLocked()) return; bkTouch(); slWr(langKey('notes'), JSON.stringify(NOTES)); }

/* The first line of a note stands in for a title when there is none, the way
   a paper notebook does. Cut short, because a row is a row. */
function ntCut(s, n){ return s.length>n ? s.slice(0,n)+'\u2026' : s; }
function ntHead(n){
  var s=String(n.t||'').trim();
  if(s) return ntCut(s, 46);
  s=String(n.b||'').split('\n')[0].trim();
  return s ? ntCut(s, 46) : t('notes.untitled');
}
/* With no heading the first line has already been used as one, so what is
   shown underneath is what comes after it -- not the same sentence twice. */
function ntBody(n){
  var b=String(n.b||''), s;
  if(String(n.t||'').trim()) s=b;
  else s=b.split('\n').slice(1).join(' ');
  s=s.replace(/\s+/g,' ').trim();
  return ntCut(s, 90);
}

var ntAt=-1;                        /* which note the sheet is open for, -1 = new */
/* Whether the note:-1 buffer already became a real note. openNote(undefined)
   is the + itself -- keepPaint's own redraw of the same sheet always passes
   a number, never undefined -- so this is the one place that can tell "the
   thing typed here is already on the list" from "still a draft, still worth
   finding again". A draft that was never saved is left exactly as it was:
   that is the rest of the app's own rule (www/shell.js § KEEP). Only a note
   that has already landed makes the NEXT + start empty. */
var ntNewSpent=false;
function openNote(i){
  /* A note is the fourth. Editing one is making one -- what comes out is a
     note either way -- so this is asked on the way in, not only on the + . */
  if(!makeNeed()) return;
  if(i===undefined && ntNewSpent){ keepDrop(keepKeyOf('form', 'note:-1')); ntNewSpent=false; }
  var k=(typeof i==='number' && NOTES[i]) ? i : -1;
  ntAt=k;
  var n = k>=0 ? NOTES[k] : {t:'',b:''};
  /* **打った内容はここに憶える。**書くのは右上の保存だけ ── www/shell.js
     § KEEP、OWNER DECISION 2026-09-03。それまでは欄をそのまま読んで保存して
     いたので、保存を押さずに出ると打った文字は黙って消えていた。

     人の言語では登録しない。「押すものが無いのだから、打ったものはどこへも
     行かない」というのがこの画面の元からの一文で、buffer を持たせるとその
     一文が嘘になる ── 保存のボタンが出てしまう。 */
  if(!langLocked()) ntKeepOn(k, n);
  openForm('note:'+k, (k>=0? t('notes.edit') : t('notes.new')),
    /* 「題名／下線／この下は何もなくて下まで行く」 OWNER 2026-09-05。題名は
       一行の欄で、下線はその欄のもの (.lnin)。その下は本文だけで、本文は
       下線を持たず、この画面に残っている高さを全部取る。
       題名が空のときに一行目が題名になるのは ntHead() が元から読んでいる形。

       **まだ画面の下端までは行っていない。** openForm の fit は高さを
       `--vvmin` ── キーボードが上がったときの高さ、390x844 では画面の 55%
       (464px) ── に合わせる箱で、それは投稿画面のための数
       (www/shell.js § vvFit)。メモをそこから外すのは openForm の側の話。 */
    '<div class="field ntform">'+
      lnField('nt-t', t('notes.t'), IN('ntSetT'), ntTyped(k, 't'), 'ntt')+
      '<textarea id="nt-b" class="ntbody" placeholder="'+esc(t('notes.b.ph'))+'"'+
      IN('ntSetB') + '>'+esc(ntTyped(k, 'b'))+'</textarea></div>',
    /* AND NOTHING TO PRESS IN SOMEBODY ELSE'S LANGUAGE. A note opened from a
       row is opened to READ there -- langLocked() (www/core.js). The field is
       not marked readonly: there is nothing to press, so nothing typed into
       it goes anywhere, and a field that refuses the cursor is a second way
       of saying what an absent Save already says.

       Deleting is the list's own, by a left swipe on the row -- 「メモの編集の
       ところに削除ボタンやめて。一覧から右にスワイプして削除。標準アプリと
       同じ作りにして」 OWNER 2026-09-05, `delNoteGo()` below. */
    null, null, true);
}
FORM_OPEN.note=function(i){ openNote(parseInt(i,10)); };
/* ---- what is typed on a note, before it is a note -----------------------
   SAVE AT THE FAR END OF THE BAR 「メモも保存は右上」 OWNER 2026-09-01, and
   since 2026-09-03 it is navTop()'s own: it stands there from the moment the
   note is open and is grey until something is changed. The fields carry names now: they used to be read off the page
   when Save was pressed, which worked exactly as long as Save was the only way
   off the screen -- and the back arrow was the other way, and it threw what
   was typed away without a word.

   The buffer is filed under the form, so the note being edited and the note
   being made are two of them and cannot be confused for each other. */
function ntKeepOn(k, n){
  keepOn(keepKeyOf('form', 'note:'+k),
         {t:String(n.t||''), b:String(n.b||'')},
         function(v, done){ saveNote(v); done(true); });
}
function ntTyped(k, f){ return keepVal(keepKeyOf('form', 'note:'+k), f); }
function ntSetT(v){ keepSet('t', String(v||'')); }
function ntSetB(v){ keepSet('b', String(v||'')); }
/* Writing it down, and STAYING on it -- leaving is what the arrow beside the
   button is for, and after a save there is nothing left to ask about, so the
   button goes. That is the answer to "did it save".

   A note being MADE becomes a note being edited the moment it is written down,
   which is what `ntAt` is: without that line a second press would push a second
   copy of the same note. */
function saveNote(v){
  var ti=String(v.hasOwnProperty('t')? v.t : ntKept('t')).trim(),
      bo=String(v.hasOwnProperty('b')? v.b : ntKept('b')).trim();
  if(!ti && !bo) return;
  if(ntAt>=0 && NOTES[ntAt]){ NOTES[ntAt].t=ti; NOTES[ntAt].b=bo; NOTES[ntAt].ed=Date.now(); }
  else { NOTES.push({t:ti, b:bo, at:Date.now()}); ntAt=NOTES.length-1; ntNewSpent=true; }
  saveNotes(); toast(t('toast.note.kept'));
}
/* What the note holds now, for the half of the pair somebody did not touch. */
function ntKept(f){
  var n=(ntAt>=0 && NOTES[ntAt])? NOTES[ntAt] : null;
  return n? String(n[f]||'') : '';
}
/* By the index itself, and not `ntAt`: this is pressed from the list, where
   no note is "open", so there is nothing for `ntAt` to name. */
function delNoteGo(i){
  if(!NOTES[i]) return;
  NOTES.splice(i,1);
  if(ntAt===i) ntAt=-1; else if(ntAt>i) ntAt--;
  ntSwipeAt=-1;
  saveNotes(); render(); toast(t('toast.note.gone'));
}
/* ---- deleting a row by swiping it, the way the standard app does it ------
   「メモの編集のところに削除ボタンやめて。一覧から右にスワイプして削除。
   標準アプリと同じ作りにして」 OWNER 2026-09-05. Left on the row uncovers
   `.ntdel` sitting under it; past halfway it stays open for a press, short
   of that it springs back -- the same two-state shape www/shell.js's own
   back-swipe (`swMove`/`swEnd`) already uses for the same reason: a real
   thumb does not aim for a pixel.

   `ntSwipeAt` is which row is open, so opening a second one closes the
   first the way it does in every app that has ever done this. Nothing
   round or bordered or filled -- .ntdel is red text and nothing else
   (CLAUDE.md § NO ROUNDED BOX). */
var NTDEL_W=76;
var ntSwOn=false, ntSwLive=false, ntSwX=0, ntSwY=0, ntSwI=-1, ntSwEl=null;
var ntSwipeAt=-1;
function ntSwStart(e){
  if(here().r!=='notes' || NTSEL || langLocked()) return;
  /* The screen's own edge is the back gesture's (www/shell.js § swStart) --
     a swipe starting there is never this one. */
  var w=window.innerWidth||375;
  if(e.clientX<=30 || e.clientX>=w-30) return;
  var row=actOf(e.target, 'data-nti');
  if(!row) return;
  ntSwX=e.clientX; ntSwY=e.clientY; ntSwOn=true; ntSwLive=false;
  ntSwI=parseInt(row.getAttribute('data-nti'),10);
  ntSwEl=row;
}
function ntSwMove(e){
  if(!ntSwOn) return;
  var dx=e.clientX-ntSwX, dy=e.clientY-ntSwY, d;
  if(!ntSwLive){
    /* A thumb heading down the page is the list scrolling, and a small
       wobble either way is still a tap on the row -- neither is this. */
    if(Math.abs(dy)>Math.abs(dx)) { ntSwOn=false; return; }
    /* 左で出したものは右で戻る ── 開いている行を右に払えば閉じる。
       閉じるのは一瞬で、指について動くのは開く側だけ ── render() で行は
       作り直されるので ntSwEl はもうその行ではない。だからここで終わる。 */
    if(dx>=12 && ntSwipeAt>=0 && ntSwipeAt===ntSwI){
      ntSwOn=false; ntSwipeAt=-1; render(); return;
    }
    if(dx>-12) return;
    ntSwLive=true;
    if(ntSwipeAt>=0 && ntSwipeAt!==ntSwI){ ntSwipeAt=-1; render(); }
  }
  if(e.cancelable) e.preventDefault();
  d=Math.max(0, Math.min(NTDEL_W, -dx));
  if(ntSwEl) ntSwEl.style.transform='translateX(-'+d+'px)';
}
function ntSwEnd(e){
  if(!ntSwOn) return;
  ntSwOn=false;
  if(!ntSwLive) return;
  ntSwLive=false;
  var dx=e.clientX-ntSwX, d=Math.max(0, Math.min(NTDEL_W, -dx));
  if(ntSwEl) ntSwEl.style.transform='';
  ntSwipeAt=(d>NTDEL_W/2)? ntSwI : -1;
  render();
}
document.addEventListener('pointerdown', ntSwStart, {passive:true});
document.addEventListener('pointermove', ntSwMove, {passive:false});
document.addEventListener('pointerup', ntSwEnd, {passive:true});
document.addEventListener('pointercancel', ntSwEnd, {passive:true});
/* Pressing the row itself while its delete is showing closes it, the way the
   standard app does -- it is not a second way to open the note. */
function ntSwTapClose(){ ntSwipeAt=-1; render(); }

/* Newest first, which is the order a notebook is read in. There was a search
   over this -- a lens in the corner that opened a box -- and it is gone:
   「メモの検索ボタンは一旦消そう」 OWNER 2026-09-04. 「一旦」, so it may be
   asked for again; git is what remembers it, not a branch left standing here.
   NOTHING SOMEBODY WROTE IS TOUCHED -- what went is the way of looking, and
   every note is still in NOTES and still on this list. */
function ntFound(){
  var out=[], i;
  for(i=NOTES.length-1;i>=0;i--) out.push(i);
  return out;
}
/* ---- choosing several notes, and taking them away ----------------------
   「メモも選択右上におきたい」 OWNER 2026-09-01 -- the same shape the
   dictionary and the keyboards have. `NTSEL` is where you are standing on
   this screen, so viewReset() drops it. */
var NTSEL=null;
function ntSelOn(){ NTSEL={}; render(); }
function ntSelOff(){ NTSEL=null; render(); }
function ntSelList(){
  var out=[], k;
  if(!NTSEL) return out;
  for(k in NTSEL) if(NTSEL.hasOwnProperty(k) && NTSEL[k]) out.push(Number(k));
  return out;
}
function ntSelTap(i){
  if(!NTSEL) return;
  if(NTSEL[i]) delete NTSEL[i]; else NTSEL[i]=1;
  render();
}
function ntSelDel(){
  var n=ntSelList().length;
  if(!n) return;
  popAsk(tn('notes.sel.ask', n), function(){ ntSelDelGo(); }, t('pop.yes'));
}
/* Highest index first, so removing one does not move the next one under the
   knife. */
function ntSelDelGo(){
  var ids=ntSelList().sort(function(a, b){ return b-a; }), i;
  for(i=0;i<ids.length;i++) NOTES.splice(ids[i], 1);
  NTSEL=null;
  saveNotes();
  render();
}
function vNotes(){
  /* Newest first: a notebook is read from the end. */
  var found=ntFound(), rows='';
  found.forEach(function(i){
    var on=!!(NTSEL && NTSEL[i]);
    if(NTSEL){
      rows+='<div class="ntrow ntrowq">'+
        '<span class="ltck'+(on? ' on':'')+'" data-sel="1"'+DO('ntSelTap', [i])+
          ' role="button" aria-label="'+esc(t('notes.sel.row'))+'">'+
          (on? ICON_DOT : ICON_RING)+'</span>'+
        '<button class="ntrowb"' + DO('ntSelTap', [i]) + '>'+
          '<span class="nth">'+esc(ntHead(NOTES[i]))+'</span>'+
          (ntBody(NOTES[i])? '<span class="ntb">'+esc(ntBody(NOTES[i]))+'</span>' : '')+
          '</button></div>';
      return;
    }
    var swOpen=(ntSwipeAt===i);
    rows+='<div class="ntswipe">'+
      (langLocked()? '' : '<span class="ntdel"'+DO('delNoteGo', [i])+'>'+esc(t('notes.del'))+'</span>')+
      '<button class="ntrow'+(swOpen? ' swopen':'')+'" data-nti="'+i+'"'+
        (swOpen? DO('ntSwTapClose', [i]) : DO('openNote', [i]))+'>'+
        '<span class="nth">'+esc(ntHead(NOTES[i]))+'</span>'+
        (ntBody(NOTES[i])? '<span class="ntb">'+esc(ntBody(NOTES[i]))+'</span>' : '')+
        '</button></div>';
  });
  return '<div class="view">'+
    navTop('', NTSEL
      ? ((ntSelList().length
            ? navDel(t('notes.sel.del'), 'ntSelDel')
            : '')+
         navDo(t('notes.sel.done'), 'ntSelOff', null, true))
      : (langLocked()? ''
           : navDo(t('notes.sel'), 'ntSelOn', null, true)))+
    '<div class="body">'+
    '<div class="note" style="margin-bottom:12px">'+t('notes.note')+'</div>'+
    (found.length
      ? '<div class="ntlist">'+rows+'</div>'
      : '<div class="empty"><div class="eb">'+t('notes.empty.t')+'</div>'+
        '<div class="es">'+t('notes.empty.s')+'</div></div>')+
    '</div>'+
    /* The round ＋ in the bottom right corner, which is where this app puts
       "make one" -- the timeline's post and the dictionary's word are both
       already there and this was the odd one out, a full-width bar across the
       foot. 「なんでここだけ右下＋になってないの？」 */
    (NTSEL? ''
      : (langLocked()? '' :
         '<button class="fab"' + DO('openNote') + ' aria-label="'+esc(t('notes.new'))+'">'+
          ICON_ADD+'</button>'))+
    '</div>';
}
