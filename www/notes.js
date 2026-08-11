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
function noteRead(){
  NOTES=[];
  try{ var nt=JSON.parse(localStorage.getItem(langKey('notes'))||'[]'); if(Array.isArray(nt)) NOTES=nt; }catch(e){}
}
noteRead();
function saveNotes(){ bkTouch(); try{ localStorage.setItem(langKey('notes'), JSON.stringify(NOTES)); }catch(e){} }

/* The first line of a note stands in for a title when there is none, the way
   a paper notebook does. Cut short, because a row is a row. */
function noteCut(s, n){ return s.length>n ? s.slice(0,n)+'\u2026' : s; }
function noteHead(n){
  var s=String(n.t||'').trim();
  if(s) return noteCut(s, 46);
  s=String(n.b||'').split('\n')[0].trim();
  return s ? noteCut(s, 46) : t('notes.untitled');
}
/* With no heading the first line has already been used as one, so what is
   shown underneath is what comes after it -- not the same sentence twice. */
function noteBody(n){
  var b=String(n.b||''), s;
  if(String(n.t||'').trim()) s=b;
  else s=b.split('\n').slice(1).join(' ');
  s=s.replace(/\s+/g,' ').trim();
  return noteCut(s, 90);
}

var noteAt=-1;                        /* which note the sheet is open for, -1 = new */
function openNote(i){
  var k=(typeof i==='number' && NOTES[i]) ? i : -1;
  noteAt=k;
  var n = k>=0 ? NOTES[k] : {t:'',b:''};
  openForm('note:'+k, (k>=0? t('notes.edit') : t('notes.new')),
    '<div class="field"><label>'+t('notes.t')+'</label>'+
      '<input id="nt-t" value="'+esc(n.t||'')+'" placeholder="'+esc(t('notes.t.ph'))+'"></div>'+
    '<div class="field"><label>'+t('notes.b')+'</label>'+
      '<textarea id="nt-b" class="ntbody" placeholder="'+esc(t('notes.b.ph'))+'">'+esc(n.b||'')+'</textarea></div>'+
    '<button class="btn" style="width:100%;margin-top:6px"' + DO('saveNote') + '>'+t('notes.save')+'</button>'+
    (k>=0? '<button class="set" style="margin-top:10px;border-bottom:none"' + DO('delNote') + '>'+
      '<span class="sl bad">'+t('notes.del')+'</span></button>' : ''));
}
FORM_OPEN.note=function(i){ openNote(parseInt(i,10)); };
function saveNote(){
  var a=document.getElementById('nt-t'), b=document.getElementById('nt-b');
  if(!a||!b) return;
  var ti=String(a.value||'').trim(), bo=String(b.value||'').trim();
  if(!ti && !bo){ closeSheet({target:{id:'sbg'}}); return; }
  if(noteAt>=0 && NOTES[noteAt]){ NOTES[noteAt].t=ti; NOTES[noteAt].b=bo; NOTES[noteAt].ed=Date.now(); }
  else NOTES.push({t:ti, b:bo, at:Date.now()});
  saveNotes(); closeSheet({target:{id:'sbg'}}); render(); toast(t('toast.note.kept'));
}
function delNote(){
  if(noteAt<0 || !NOTES[noteAt]) return;
  if(!confirm(t('confirm.note.del'))) return;
  NOTES.splice(noteAt,1); noteAt=-1;
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
function notesFound(){
  var qq=String(ntQ||'').trim().toLowerCase(), out=[], i;
  for(i=NOTES.length-1;i>=0;i--){
    if(qq && (String(noteHead(NOTES[i])||'')+' '+String(noteBody(NOTES[i])||''))
             .toLowerCase().indexOf(qq)<0) continue;
    out.push(i);
  }
  return out;
}
function vNotes(){
  /* Newest first: a notebook is read from the end. */
  var found=notesFound(), rows='';
  found.forEach(function(i){
    rows+='<button class="ntrow"' + DO('openNote', [i]) + '>'+
      '<span class="nth">'+esc(noteHead(NOTES[i]))+'</span>'+
      (noteBody(NOTES[i])? '<span class="ntb">'+esc(noteBody(NOTES[i]))+'</span>' : '')+
      '</button>';
  });
  return '<div class="view">'+
    navTop(NOTES.length,
      '<button class="iconb'+(ntFind?' on':'')+'"' + DO('ntSearch') + ' aria-label="'+
        esc(t('notes.search'))+'">'+ICON_LENS+'</button>')+
    '<div class="body">'+
    (ntFind
      ? '<div class="search"><span class="lens">'+ICON_LENS+'</span>'+
        '<input id="nt-q" placeholder="'+esc(t('notes.search'))+'" value="'+esc(ntQ)+'"' +
        IN('ntSetQ') + '></div>'
      : '<div class="note" style="margin-bottom:12px">'+t('notes.note')+'</div>')+
    (found.length
      ? '<div class="ntlist">'+rows+'</div>'
      : ntQ
        ? '<div class="empty"><div class="eb">'+t('words.nomatch')+'</div></div>'
        : '<div class="empty"><div class="eb">'+t('notes.empty.t')+'</div>'+
          '<div class="es">'+t('notes.empty.s')+'</div></div>')+
    '</div>'+
    '<div class="barfix"><button class="btn"' + DO('openNote') + '>'+ICON_NOTE+t('notes.new')+'</button></div>'+
    '</div>';
}
