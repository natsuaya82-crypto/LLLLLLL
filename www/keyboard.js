/* Lingua — the keyboard, which belongs to the language (chapter 22)
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   22. The keyboard
   ========================================================================= */
/* The app has no opinion about what a keyboard looks like, because there is
   no honest one to have. QWERTY is a keyboard. Ten kana keys with a flick on
   each is a keyboard. A language somebody invented last week gets its own,
   and nobody outside it can guess the shape.
   「キーボードはこれだけじゃねえだろqwertyだってあるし、それを作れるようにする
   のをアプリ内でやる」

   Three layouts were built and thrown away before this: a grid of tiles, an
   alphabetical chart of a-z, and a QWERTY with a conversion strip. Each was
   the app deciding, and each was wrong in its own way. What was missing was
   not a better guess. It was the editor.

   So: the app holds an editor, and the layout is the language's, filed under
   langKey('kb') beside its words and its letters.

     a keyboard is layers        the way ABC and あいう are two faces of one
     a layer is rows
     a row is keys
     a key is  how wide it is, what it does pressed, and what it does when
               the finger slides off it in each of four directions

   That last one is the flick, and it is why one key can hold five letters. */

var KB=null;
function kbRead(){
  KB=null;
  try{
    var k=JSON.parse(localStorage.getItem(langKey('kb'))||'null');
    if(k && k.lay && k.lay.length) KB=k;
  }catch(e){}
}
kbRead();
function saveKb(){ try{ localStorage.setItem(langKey('kb'), JSON.stringify(KB)); }catch(e){} }

/* The four directions a finger can leave a key by, in the order they are
   stored. Written once because the editor, the renderer and the flick all
   count on the same order. */
var KB_DIRS=['up', 'right', 'down', 'left'];
function kbKey(k, v){ return {w:1, k:k, v:v||'', f:['','','','']}; }
/* The first keyboard, so there is something to type on before anybody has
   built anything: the letters in the order they are already in, five to a
   row, and a backspace. It is a starting point and it is meant to be pulled
   apart. Nothing is stored until it is. */
function kbDefault(){
  var ls=ltOrder(ltOfKind('alpha')), rows=[], row=[], i;
  for(i=0;i<ls.length;i++){
    row.push(kbKey('lt', ls[i].id));
    if(row.length===5){ rows.push(row); row=[]; }
  }
  if(row.length) rows.push(row);
  var sp=kbKey('sp'); sp.w=3;
  rows.push([sp, kbKey('del')]);
  return {lay:[{rows:rows}]};
}
/* ---- the keyboard the free plan gets ----------------------------------
   QWERTY, with the drawn letters standing in for the roman ones.
   「キーボードもqwerty配列がそのまま自作文字に置き換わるだけ。なんの設定もできない」

   The free alphabet is exactly a-z and the two marks -- ltStart puts them
   there and nothing can add to it -- so the one layout that certainly fits
   is the one everybody's thumbs already know. Nothing is stored and nothing
   is read: this is built from LETTERS every time it is shown, so a letter
   drawn ten seconds ago is on the key.

   A key is found by name, over every letter and not just the alphabet,
   because `!` and `?` read themselves and are therefore marks. A name that
   nothing answers to is simply left out rather than made into an empty key. */
var KB_QWERTY=['qwertyuiop', 'asdfghjkl', 'zxcvbnm!?'];
function kbNamed(c){
  var i, n;
  for(i=0;i<LETTERS.length;i++){
    n=String(ltName(LETTERS[i])||'').toLowerCase();
    if(n===c) return LETTERS[i].id;
  }
  return '';
}
function kbFixed(){
  var rows=[], r, i, j, row, id;
  for(i=0;i<KB_QWERTY.length;i++){
    r=KB_QWERTY[i]; row=[];
    for(j=0;j<r.length;j++){
      id=kbNamed(r.charAt(j));
      if(id) row.push(kbKey('lt', id));
    }
    if(i===KB_QWERTY.length-1) row.push(kbKey('del'));
    if(row.length) rows.push(row);
  }
  /* And the bar along the bottom. A line of the language is more than one
     word -- an example under a word, a post -- and without this there is no
     way to put a gap between two of them. */
  var sp=kbKey('sp'); sp.w=4;
  rows.push([sp]);
  return {lay:[{rows:rows}]};
}
function kbOf(){
  if(!has('plus')) return kbFixed();
  return KB || kbDefault();
}
/* Which layer is showing, and which key is being edited. Both are where you
   are standing rather than anything the language has, so viewReset() drops
   them. */
var kbLay=0, kbSel=null;
function kbLayer(){ var b=kbOf(); return b.lay[Math.min(kbLay, b.lay.length-1)]; }
/* Writing means owning it: the default is a suggestion until the moment
   somebody changes something, and from then on it is theirs and does not
   quietly rearrange itself under them. */
function kbEdit(){ if(!KB) KB=kbDefault(); return KB; }
/* How many keys are set out, over every layer -- what the contents page
   shows beside the chapter, the way it shows a count beside the others. */
function kbKeys(){
  var b=kbOf(), n=0, i, j;
  for(i=0;i<b.lay.length;i++)
    for(j=0;j<b.lay[i].rows.length;j++) n+=b.lay[i].rows[j].length;
  return n;
}
function kbAt(ri, ki){
  var rows=kbLayer().rows;
  return (rows[ri] && rows[ri][ki])? rows[ri][ki] : null;
}

/* ---- what a key shows -------------------------------------------------
   A letter shows the letter -- drawn, borrowed, or its name -- and the same
   ltInk() the alphabet and the tiles use, so a key cannot look like one thing
   here and another there. The keys that are not letters show a mark. */
function kbFace(key){
  if(!key) return '';
  if(key.k==='del') return ICON_BACK;
  /* A space wears nothing. It is the widest key on the board and the only
     one whose shape is the whole of what it says, which is how every phone
     keyboard already draws it. */
  if(key.k==='sp') return '';
  if(key.k==='lay') return '<span class="kbl">'+esc(kbLayName(parseInt(key.v, 10)||0))+'</span>';
  var l=ltById(key.v);
  if(!l) return '<span class="kbl">·</span>';
  return ltInk(l, '<span class="kbl">'+esc(ltName(l)||'·')+'</span>');
}
function kbLayName(i){ return String(i+1); }
/* The letters a key gives on a flick, small, in the corners they come from.
   A key with none shows none: an empty corner is quieter than a dot. */
function kbFlicks(key){
  var out='', i, l;
  if(!key || !key.f) return '';
  for(i=0;i<4;i++){
    l=key.f[i]? ltById(key.f[i]) : null;
    if(!l) continue;
    out+='<span class="kbf kbf'+KB_DIRS[i]+'">'+ltInk(l, esc(ltName(l)||'·'))+'</span>';
  }
  return out;
}
/* What a letter key types. It is the letter's NAME, because the name is the
   code point the font draws -- so what lands in a field, or in Messages, is
   the letter itself and not a transliteration of it. The font unification is
   what makes this one line instead of a conversion table.

   The only caller left is www/share.js, which puts it ON the key before the
   key leaves for the extension. Nothing in the app types on this keyboard
   any more; everything that does is on the other side of the App Group. */
function kbTyped(id){ return String(ltName(ltById(id))||''); }

/* One layer, as it will be pressed -- which now means pressed to be EDITED.
   `act` was here because a key meant two things, typing and editing; it
   means one. */
function kbHTML(sel){
  var lay=kbLayer(), out='', ri, ki, row, key;
  for(ri=0;ri<lay.rows.length;ri++){
    row=lay.rows[ri];
    out+='<div class="kbrow">';
    for(ki=0;ki<row.length;ki++){
      key=row[ki];
      out+='<button class="kbk'+(key.k!=='lt'? ' fn':'')+
        ((sel && sel.r===ri && sel.k===ki)? ' on':'')+
        '" style="flex:'+(key.w||1)+'" data-r="'+ri+'" data-k="'+ki+'"'+
        DO('kbPick', [ri, ki]) + '>'+kbFlicks(key)+
        '<span class="kbc">'+kbFace(key)+'</span></button>';
    }
    out+='</div>';
  }
  return '<div class="kb" id="kb">'+out+'</div>';
}

/* ---- the keyboard is not typed on in here ------------------------------
   It used to be. A word's spelling, an example, a post: each had this
   keyboard under it, with a flick on every key and a tap that put a letter
   in. All of that is gone, and what took it away is that the keyboard is
   real now -- ios/App/LinguaKeyboard, on the phone, in Messages and every
   other app. 「アプリ内キーボードいらないでしょ。アップル拡張だけ。」

   A second keyboard inside the app was a second answer to a question that
   has one. It also could not be the right answer: it only ever worked in
   Lingua, which is the one place a language you invented is least worth
   writing in.

   So this chapter builds the keyboard and no longer offers it. What is left
   below is the editor, and kbTyped() above, which is what share.js puts on
   a key before the key leaves. */

/* ---- building one -----------------------------------------------------
   The keyboard, shown the size it will be, with every key pressable -- and
   pressing one opens what that key is rather than typing with it. There is
   no preview beside an editor, because the editor is the preview. */
function vKb(){
  /* The chapter shows no door to here on the free plan, but a route can be
     arrived at from anywhere and a plan can end while somebody is standing
     in it -- so the screen says what it is rather than showing an editor
     over a keyboard that does not read what it writes. */
  if(!has('plus'))
    return '<div class="view">'+navTop('')+'<div class="body">'+
      '<div class="note">'+t('kb.locked')+'</div>'+
      '<button class="btn" style="width:100%;margin-top:12px"' + DO('goPlans') + '>'+
        t('up.cta')+'</button>'+
      '</div></div>';
  var b=kbOf(), out='';
  if(b.lay.length>1){
    out+='<div class="segs" style="margin-bottom:8px">'+b.lay.map(function(x, i){
      return '<button class="seg'+(i===Math.min(kbLay, b.lay.length-1)?' on':'')+'"' +
        DO('kbGoLay', [i]) + '>'+esc(kbLayName(i))+'</button>';
    }).join('')+'</div>';
  }
  return '<div class="view">'+navTop('')+'<div class="body">'+
    out+
    kbHTML(kbSel)+
    '<div class="kbadd">'+
      '<button class="btn ghost"' + DO('kbAddRow') + '>'+t('kb.row.add')+'</button>'+
      '<button class="btn ghost"' + DO('kbAddLay') + '>'+t('kb.lay.add')+'</button>'+
    '</div>'+
    '<button class="set" style="margin-top:14px;border-bottom:none"' + DO('kbReset') + '>'+
      '<span class="sl bad">'+t('kb.reset')+'</span></button>'+
    '</div></div>';
}
function kbGoLay(i){ kbLay=i; render(); }
function kbAddRow(){
  kbEdit(); kbLayer().rows.push([kbKey('lt', '')]);
  saveKb(); render();
}
function kbAddLay(){
  var b=kbEdit();
  b.lay.push({rows:[[kbKey('lt', '')]]});
  kbLay=b.lay.length-1;
  saveKb(); render();
}
function kbReset(){
  if(!confirm(t('kb.reset.ask'))) return;
  KB=null; saveKb(); kbLay=0; kbSel=null; render();
  toast(t('kb.reset.done'));
}
/* One key, opened. What it does, how wide it is, what each corner holds, and
   where it sits in its row. */
function kbPick(ri, ki){
  kbSel={r:ri, k:ki};
  openForm('kbkey:'+ri+':'+ki, t('kb.key'), kbKeyHTML(ri, ki), function(){ geTiles(); });
}
FORM_OPEN.kbkey=function(a){
  var p=String(a||'').split(':');
  kbPick(parseInt(p[0], 10)||0, parseInt(p[1], 10)||0);
};
function kbKeyHTML(ri, ki){
  var key=kbAt(ri, ki), i, out;
  if(!key) return '<div class="note">'+t('form.gone')+'</div>';
  out='<div class="sec">'+t('kb.what')+'</div>'+
    '<div class="segs">'+
      '<button class="seg'+(key.k==='lt'?' on':'')+'"' + DO('kbSetKind', [ri, ki, "lt"]) + '>'+t('toc.letters')+'</button>'+
      '<button class="seg'+(key.k==='sp'?' on':'')+'"' + DO('kbSetKind', [ri, ki, "sp"]) + '>'+t('kb.sp')+'</button>'+
      '<button class="seg'+(key.k==='del'?' on':'')+'"' + DO('kbSetKind', [ri, ki, "del"]) + '>'+t('kb.del')+'</button>'+
      '<button class="seg'+(key.k==='lay'?' on':'')+'"' + DO('kbSetKind', [ri, ki, "lay"]) + '>'+t('kb.lay')+'</button>'+
    '</div>';
  if(key.k==='lt')
    out+=kbSlotHTML(t('kb.on'), key.v, ri, ki, -1);
  if(key.k==='lay')
    out+='<div class="segs" style="margin-top:8px">'+kbOf().lay.map(function(x, i){
      return '<button class="seg'+((parseInt(key.v,10)||0)===i?' on':'')+'"' +
        DO('kbSetLay', [ri, ki, i]) + '>'+esc(kbLayName(i))+'</button>';
    }).join('')+'</div>';
  if(key.k==='lt'){
    out+='<div class="sec">'+t('kb.flick')+'</div>';
    for(i=0;i<4;i++) out+=kbSlotHTML(t('kb.dir.'+KB_DIRS[i]), key.f[i], ri, ki, i);
  }
  out+='<div class="sec">'+t('kb.w')+'</div><div class="segs">'+
    [1,2,3,4].map(function(w){
      return '<button class="seg'+((key.w||1)===w?' on':'')+'"' +
        DO('kbSetW', [ri, ki, w]) + '>'+w+'</button>';
    }).join('')+'</div>'+
    '<div class="kbadd" style="margin-top:12px">'+
      '<button class="btn ghost"' + DO('kbMove', [ri, ki, -1]) + '>'+ICON_BACK+'</button>'+
      '<button class="btn ghost"' + DO('kbAddKey', [ri, ki]) + '>'+ICON_ADD+t('kb.key')+'</button>'+
      '<button class="btn ghost"' + DO('kbMove', [ri, ki, 1]) + '>'+ICON_GO+'</button>'+
    '</div>'+
    '<button class="set" style="margin-top:12px;border-bottom:none"' + DO('kbDelKey', [ri, ki]) + '>'+
      '<span class="sl bad">'+t('kb.key.del')+'</span></button>';
  return out;
}
/* One slot -- the key itself or one of its corners -- and the letter in it.
   Pressing it opens the alphabet to choose from, which is why both are the
   same row: they hold the same kind of thing. */
function kbSlotHTML(label, lid, ri, ki, dir){
  var l=lid? ltById(lid) : null;
  return '<button class="kbslot"' + DO('kbSlot', [ri, ki, dir]) + '>'+
    '<span class="sl">'+esc(label)+'</span>'+
    '<span class="kbsv">'+(l? ltInk(l, esc(ltName(l)||'·')) : esc(t('kb.empty')))+'</span>'+
    ICON_GO+'</button>';
}
/* Which slot the alphabet is being opened for. */
var kbSlotFor=null;
function kbSlot(ri, ki, dir){
  kbSlotFor={r:ri, k:ki, d:dir};
  openForm('kbslot:'+ri+':'+ki+':'+dir, t('toc.letters'), kbLtHTML(), function(){ geTiles(); });
}
FORM_OPEN.kbslot=function(a){
  var p=String(a||'').split(':');
  kbSlot(parseInt(p[0],10)||0, parseInt(p[1],10)||0, parseInt(p[2],10));
};
function kbLtHTML(){
  var ls=ltOrder(ltOfKind('alpha'));
  return '<button class="btn ghost" style="width:100%;margin-bottom:10px"' + DO('kbTake', [""]) + '>'+
      t('kb.empty')+'</button>'+
    (ls.length
      ? '<div class="ltgrid">'+ls.map(function(l){
          return '<button class="ltc"' + DO('kbTake', [l.id]) + ' aria-label="'+
            esc(ltName(l)||t('lt.reads.none'))+'">'+
            '<span class="ltcf">'+ltInk(l, '<span class="nol">'+ICON_PEN+'</span>')+'</span>'+
            '<span class="ltcn">'+esc(ltName(l)||t('lt.reads.none'))+'</span></button>';
        }).join('')+'</div>'
      : '<div class="note">'+t('lt.none')+'</div>');
}
function kbTake(lid){
  var s=kbSlotFor;
  if(!s) return;
  kbEdit();
  var key=kbAt(s.r, s.k);
  if(!key) return;
  if(s.d<0) key.v=lid; else key.f[s.d]=lid;
  saveKb();
  back();
  kbPick(s.r, s.k);
}
function kbSetKind(ri, ki, kind){
  kbEdit();
  var key=kbAt(ri, ki); if(!key) return;
  key.k=kind;
  if(kind!=='lt') key.f=['','','',''];
  if(kind==='lay' && !/^[0-9]+$/.test(String(key.v))) key.v='0';
  if(kind==='del' || kind==='sp') key.v='';
  saveKb(); kbPick(ri, ki);
}
function kbSetLay(ri, ki, i){
  kbEdit();
  var key=kbAt(ri, ki); if(!key) return;
  key.v=String(i); saveKb(); kbPick(ri, ki);
}
function kbSetW(ri, ki, w){
  kbEdit();
  var key=kbAt(ri, ki); if(!key) return;
  key.w=w; saveKb(); kbPick(ri, ki);
}
function kbAddKey(ri, ki){
  kbEdit();
  var rows=kbLayer().rows;
  if(!rows[ri]) return;
  rows[ri].splice(ki+1, 0, kbKey('lt', ''));
  saveKb(); back(); kbPick(ri, ki+1);
}
function kbMove(ri, ki, by){
  kbEdit();
  var rows=kbLayer().rows, to=ki+by;
  if(!rows[ri] || to<0 || to>=rows[ri].length) return;
  rows[ri].splice(to, 0, rows[ri].splice(ki, 1)[0]);
  saveKb(); kbPick(ri, to);
}
/* A row with nothing left in it is not a row. */
function kbDelKey(ri, ki){
  kbEdit();
  var rows=kbLayer().rows;
  if(!rows[ri]) return;
  rows[ri].splice(ki, 1);
  if(!rows[ri].length) rows.splice(ri, 1);
  if(!rows.length) rows.push([kbKey('lt', '')]);
  saveKb(); kbSel=null; back();
}
