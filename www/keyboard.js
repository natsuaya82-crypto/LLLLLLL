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
/* One layer, as it will be pressed. `act` is what a key press is called --
   which differs between the keyboard being used and the keyboard being
   built, and is the only thing that does. */
function kbHTML(act, sel){
  var lay=kbLayer(), out='', ri, ki, row, key;
  for(ri=0;ri<lay.rows.length;ri++){
    row=lay.rows[ri];
    out+='<div class="kbrow">';
    for(ki=0;ki<row.length;ki++){
      key=row[ki];
      out+='<button class="kbk'+(key.k!=='lt'? ' fn':'')+
        ((sel && sel.r===ri && sel.k===ki)? ' on':'')+
        '" style="flex:'+(key.w||1)+'" data-r="'+ri+'" data-k="'+ki+'"'+
        DO(act, [ri, ki]) + '>'+kbFlicks(key)+
        '<span class="kbc">'+kbFace(key)+'</span></button>';
    }
    out+='</div>';
  }
  return '<div class="kb" id="kb">'+out+'</div>';
}

/* ---- the flick --------------------------------------------------------
   A press that leaves the key it started on takes what that corner holds.
   Under the threshold it is a tap, and a tap is left to the click that
   follows it, so a key still works with a mouse and under tools/press.mjs.

   The handlers hang off the keyboard rather than the keys, the same way the
   whole app has one listener rather than one per button. */
var KBD=null;
function kbMount(){
  var g=document.getElementById('kb');
  if(!g) return;
  g.addEventListener('touchstart', kbDown, false);
  g.addEventListener('touchend', kbUp, false);
  g.addEventListener('touchcancel', kbOff, false);
}
function kbKeyAt(el){
  while(el && el.classList && !el.classList.contains('kbk')) el=el.parentNode;
  return (el && el.classList && el.classList.contains('kbk'))? el : null;
}
function kbDown(e){
  var b=kbKeyAt(e.target), p=e.touches? e.touches[0] : e;
  if(!b || !p) return;
  KBD={el:b, x:p.clientX, y:p.clientY};
}
function kbOff(){ KBD=null; }
function kbUp(e){
  if(!KBD) return;
  var p=(e.changedTouches && e.changedTouches[0]) || e, d=KBD;
  KBD=null;
  if(!p) return;
  var dx=p.clientX-d.x, dy=p.clientY-d.y;
  if(dx*dx+dy*dy < 324) return;                  /* a tap: the click has it */
  /* whichever axis moved further, and which way along it */
  var i = (Math.abs(dx)>Math.abs(dy)) ? (dx>0? 1 : 3) : (dy>0? 2 : 0);
  e.preventDefault();                            /* and no click after this */
  kbFlick(parseInt(d.el.getAttribute('data-r'), 10),
          parseInt(d.el.getAttribute('data-k'), 10), i);
}
/* What a flick does is what a press does, with a different letter -- so it
   goes through the same door rather than a second one beside it. */
var KB_TAP=null;
function kbFlick(ri, ki, dir){
  var key=kbAt(ri, ki);
  if(!key || !key.f || !key.f[dir] || !KB_TAP) return;
  KB_TAP(key.f[dir]);
}
/* Who a keypress belongs to. The new-word sheet and the word being edited
   both type on the same keyboard and put the letter in different places, so
   the sheet says which before it draws one. */
function kbUse(fn){ KB_TAP=fn; }
function kbTap(ri, ki){
  var key=kbAt(ri, ki);
  if(!key) return;
  if(key.k==='lay'){ kbLay=parseInt(key.v, 10)||0; render(); return; }
  if(key.k==='del'){ if(KB_TAP) KB_TAP(''); return; }
  /* The gap between two words. It is not a letter -- there is no letter for
     it and there never will be -- so it cannot travel as an id, and it must
     not arrive as an empty one either, which is what backspace is. It is the
     second argument, and every taker that spells a single word ignores it. */
  if(key.k==='sp'){ if(KB_TAP) KB_TAP('', 'sp'); return; }
  if(key.v && KB_TAP) KB_TAP(key.v);
}

/* ---- a line of the language, typed into a plain field -------------------
   Three places hold one: a word's example, a grammar stage's example, and a
   post. All three are shown in the font somebody drew, and all three were
   typed on the phone's keyboard, in roman, and only LOOKED like the language
   afterwards.

   A key puts the letter's NAME into the field, because the name is the code
   point the font draws -- so what lands in the box is the letter itself. The
   font unification is what makes this one line instead of a conversion table.

   One function, three callers. It was going to be three. */
function kbField(id){
  return function(v, sp){
    var e=document.getElementById(id);
    if(!e) return;
    if(sp){ e.value=String(e.value||'')+' '; }
    else if(!v){ e.value=String(e.value||'').slice(0, -1); }
    else { e.value=String(e.value||'')+String(ltName(ltById(v))||''); }
    if(e.oninput) e.oninput();
  };
}
/* The field, and the keyboard under it. `attrs` is whatever that caller's
   field already carried -- the name it types into, the Enter it answers. */
function kbFieldHTML(id, ph, attrs){
  if(!ltOfKind('alpha').length)
    return '<input id="'+id+'" placeholder="'+esc(ph)+'" autocomplete="off" '+
      'autocorrect="off" spellcheck="false"'+(attrs||'')+'>';
  kbUse(kbField(id));
  /* Wrapped, because two of the three callers put their field in a flex row
     beside a gloss and an add button -- and a keyboard is not something that
     shares a row. */
  return '<div class="kbwrap"><input id="'+id+'" class="kbin'+(myFontOn()? ' sfont':'')+'" '+
    'placeholder="'+esc(ph)+'" autocomplete="off" autocorrect="off" '+
    'spellcheck="false" readonly'+(attrs||'')+'>'+
    kbHTML('kbTap', null)+'</div>';
}

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
    kbHTML('kbPick', kbSel)+
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
