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
var LS_NT='lingua.notes';
var NOTES=[];
try{ var nt=JSON.parse(localStorage.getItem(LS_NT)||'[]'); if(Array.isArray(nt)) NOTES=nt; }catch(e){}
function saveNotes(){ try{ localStorage.setItem(LS_NT, JSON.stringify(NOTES)); }catch(e){} }

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
  document.getElementById('sheet').innerHTML=
    '<div class="grip"></div><h3>'+(k>=0? t('notes.edit') : t('notes.new'))+'</h3>'+
    '<div class="field"><label>'+t('notes.t')+'</label>'+
      '<input id="nt-t" value="'+esc(n.t||'')+'" placeholder="'+esc(t('notes.t.ph'))+'"></div>'+
    '<div class="field"><label>'+t('notes.b')+'</label>'+
      '<textarea id="nt-b" class="ntbody" placeholder="'+esc(t('notes.b.ph'))+'">'+esc(n.b||'')+'</textarea></div>'+
    '<button class="btn" style="width:100%;margin-top:6px" onclick="saveNote()">'+t('notes.save')+'</button>'+
    (k>=0? '<button class="set" style="margin-top:10px;border-bottom:none" onclick="delNote()">'+
      '<span class="sl" style="color:#c9553f">'+t('notes.del')+'</span></button>' : '');
  document.getElementById('sbg').classList.add('on');
  document.getElementById('sheet').classList.add('on');
}
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

function vNotes(){
  /* Newest first: a notebook is read from the end. */
  var rows='', i;
  for(i=NOTES.length-1;i>=0;i--){
    rows+='<button class="ntrow" onclick="openNote('+i+')">'+
      '<span class="nth">'+esc(noteHead(NOTES[i]))+'</span>'+
      (noteBody(NOTES[i])? '<span class="ntb">'+esc(noteBody(NOTES[i]))+'</span>' : '')+
      '</button>';
  }
  return '<div class="view">'+
    '<div class="navtop">'+'<button class="back nb" onclick="go(\'home\')">'+ICON_BACK+t('nav.contents')+'</button>'+'</div>'+
    '<div class="chead">'+
    '<div class="chap"><span class="rn">V</span><span class="ct">'+esc(t('toc.notes'))+'</span>'+
    '<span class="cn">'+NOTES.length+'</span></div></div>'+
    '<div class="body">'+
    '<div class="note" style="margin-bottom:12px">'+t('notes.note')+'</div>'+
    (NOTES.length
      ? '<div class="ntlist">'+rows+'</div>'
      : '<div class="empty"><div class="eb">'+t('notes.empty.t')+'</div>'+
        '<div class="es">'+t('notes.empty.s')+'</div></div>')+
    '<div class="note" style="margin-top:22px">'+t('notes.footer')+'</div>'+
    '</div>'+
    '<div class="barfix"><button class="btn" onclick="openNote()">'+ICON_NOTE+t('notes.new')+'</button></div>'+
    '</div>';
}
