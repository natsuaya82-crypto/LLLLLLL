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
  try{ var nt=JSON.parse(localStorage.getItem(langKey('notes'))||'[]'); if(Array.isArray(nt)) NOTES=nt; }catch(e){}
}
ntRead();
function saveNotes(){ if(langLocked()) return; bkTouch(); try{ localStorage.setItem(langKey('notes'), JSON.stringify(NOTES)); }catch(e){} }

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
function openNote(i){
  /* A note is the fourth. Editing one is making one -- what comes out is a
     note either way -- so this is asked on the way in, not only on the + . */
  if(!makeNeed()) return;
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
    /* THE SAME FIELD AS EVERYWHERE ELSE, and it was an <input>.
       「全部改行して画面内に文字が収まるようにして欲しい」 OWNER 2026-08-27.
       An <input> is one row that scrolls sideways forever and no CSS makes it
       wrap. This field carries no name of its own -- it is read when the form
       is saved -- so what makes it grow is the line in www/act.js. */
    '<div class="field"><label>'+t('notes.t')+'</label>'+
      lnField('nt-t', t('notes.t.ph'), IN('ntSetT'), ntTyped(k, 't'))+'</div>'+
    '<div class="field"><label>'+t('notes.b')+'</label>'+
      '<textarea id="nt-b" class="ntbody" placeholder="'+esc(t('notes.b.ph'))+'"'+
      IN('ntSetB') + '>'+esc(ntTyped(k, 'b'))+'</textarea></div>'+
    /* AND NOTHING TO PRESS IN SOMEBODY ELSE'S LANGUAGE. A note opened from a
       row is opened to READ there -- langLocked() (www/core.js) -- so the
       delete goes with the save below, and what is left is the note. The
       fields are not marked readonly: there is nothing to press, so nothing
       typed into them goes anywhere, and a field that refuses the cursor is a
       second way of saying what an absent Save already says. */
    (k>=0 && !langLocked()
      ? '<button class="set" style="margin-top:10px;border-bottom:none"' + DO('delNote') + '>'+
        '<span class="sl bad">'+t('notes.del')+'</span></button>' : ''),
    null);
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
  else { NOTES.push({t:ti, b:bo, at:Date.now()}); ntAt=NOTES.length-1; }
  saveNotes(); toast(t('toast.note.kept'));
}
/* What the note holds now, for the half of the pair somebody did not touch. */
function ntKept(f){
  var n=(ntAt>=0 && NOTES[ntAt])? NOTES[ntAt] : null;
  return n? String(n[f]||'') : '';
}
function delNote(){
  if(ntAt<0 || !NOTES[ntAt]) return;
  /* 確認は自前のポップで。「標準は使わねえって言ってるだろこれも禁止や」
     OWNER 2026-09-01 -- confirm() は使わない。はいの側がこの下。 */
  popAsk(t('confirm.note.del'), function(){ delNoteGo(); }, t('pop.yes'));
}
function delNoteGo(){
  NOTES.splice(ntAt,1); ntAt=-1;
  saveNotes(); closeSheet({target:{id:'sbg'}}); render(); toast(t('toast.note.gone'));
}

/* Searching the notebook. The lens in the corner rather than a box always
   across the top: a note is read far more often than it is looked for, and
   the box would push the first note off the screen every day to serve the
   day it is wanted. 「メモの右上に🔍ボタン置いて、メモ内検索できるように」

   It looks in both halves of a note -- the heading and the body -- because
   what somebody remembers about a note they wrote is as often a word
   inside it as the line at the top. */
var ntQ='', ntFind=false;
function ntSearch(){
  ntFind=!ntFind; if(!ntFind) ntQ='';
  render();
  var e=document.getElementById('nt-q'); if(e) e.focus();
}
function ntSetQ(v){ ntQ=v; render(); }
function ntFound(){
  var qq=String(ntQ||'').trim().toLowerCase(), out=[], i;
  for(i=NOTES.length-1;i>=0;i--){
    if(qq && (String(ntHead(NOTES[i])||'')+' '+String(ntBody(NOTES[i])||''))
             .toLowerCase().indexOf(qq)<0) continue;
    out.push(i);
  }
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
    rows+='<button class="ntrow"' + DO('openNote', [i]) + '>'+
      '<span class="nth">'+esc(ntHead(NOTES[i]))+'</span>'+
      (ntBody(NOTES[i])? '<span class="ntb">'+esc(ntBody(NOTES[i]))+'</span>' : '')+
      '</button>';
  });
  return '<div class="view">'+
    navTop('', NTSEL
      ? ((ntSelList().length
            ? navDel(t('notes.sel.del'), 'ntSelDel')
            : '')+
         navDo(t('notes.sel.done'), 'ntSelOff', null, true))
      : ('<button class="iconb'+(ntFind?' on':'')+'"' + DO('ntSearch') + ' aria-label="'+
          esc(t('notes.search'))+'">'+ICON_LENS+'</button>'+
         (langLocked()? ''
           : navDo(t('notes.sel'), 'ntSelOn', null, true))))+
    '<div class="body">'+
    (ntFind
      /* ntSetQ() calls render(), and lnGrowAll() runs there, so this one needs
         no lnGrow of its own. No cross today: it is the shape this screen was
         drawn with, and searchBox() is where one would be given. */
      ? searchBox('nt', t('notes.search'), IN('ntSetQ'), ntQ)
      : '<div class="note" style="margin-bottom:12px">'+t('notes.note')+'</div>')+
    (found.length
      ? '<div class="ntlist">'+rows+'</div>'
      : ntQ
        ? '<div class="empty"><div class="eb">'+t('words.nomatch')+'</div></div>'
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
