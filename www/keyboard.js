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
/* Letters five to a row, with a space and a backspace under them. Used for
   both faces of the first keyboard, so the two cannot drift in how wide a
   row is. */
function kbRows(list){
  var rows=[], row=[], i, sp;
  for(i=0;i<list.length;i++){
    row.push(kbKey('lt', list[i].id));
    if(row.length===5){ rows.push(row); row=[]; }
  }
  if(row.length) rows.push(row);
  sp=kbKey('sp'); sp.w=3;
  rows.push([sp, kbKey('del')]);
  return rows;
}
/* The second face: the digits and the marks.
   「qwertyでも数字で切り替えたりするやん？そう考えると1画面だけってきついかな」

   Layers were always in the keyboard -- a layer is what ABC and あいう are two
   of -- and the editor could always add one. Nothing ever did, so nobody had
   a second face unless they sat down and built it, and the first one had no
   room for a digit. Which meant the default keyboard could not type `!`.

   What goes on it is the language's own: numbers.js says a digit IS a letter,
   one with a value instead of a reading, so the second face is drawn from the
   same LETTERS as the first and needs nothing new to exist. A language with
   no digits and no marks does not get one -- an empty face is worse than no
   face, and the key to reach it would be a key that does nothing. */
function kbSecond(){
  var xs=ltOfKind('num').concat(ltOfKind('mark'));
  return xs.length? {rows:kbRows(xs)} : null;
}
/* The first keyboard, so there is something to type on before anybody has
   built anything: the letters in the order they are already in, and the
   digits and marks behind a switch. It is a starting point and it is meant
   to be pulled apart. Nothing is stored until it is. */
function kbDefault(){
  var rows=kbRows(ltOrder(ltOfKind('alpha'))), more=kbSecond();
  if(!more) return {lay:[{rows:rows}]};
  /* The way across, on both faces, at the near end of the bottom row --
     where every phone keeps its 123. */
  rows[rows.length-1].unshift(kbKey('lay', '1'));
  more.rows[more.rows.length-1].unshift(kbKey('lay', '0'));
  return {lay:[{rows:rows}, more]};
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
   nothing answers to is simply left out rather than made into an empty key.

   `!` and `?` used to be the tail of the third row. They are on the bottom
   row now, one at each end of the space bar, because the space bar was the
   whole width of the phone and nothing else was down there.
   「これスペースデカすぎやね。！スペース？みたいにできない？」 It also evens the
   rows out: ten, nine, and seven letters with a delete two keys wide. */
var KB_QWERTY=['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
/* The two that sit beside the space. Marks, so they are found by name over
   every letter exactly as the rows above are. */
var KB_ENDS='!?';
/* The row above it, in the order a phone puts them: one to nine, then zero.
   These are the person's OWN digits now, found by value, because ltStart
   gives a free language a digit for every value its base has and they are
   slots to be drawn on exactly like a to z.
   「数字が設定できないわ。そこ文字から設定できるように頼む」

   They used to be the roman ten, on the grounds that free adds no letters so
   there was nothing of the person's to put here. That was a true sentence
   about a plan with twenty-eight slots, and the answer was to give it ten
   more rather than to leave the row borrowed. The roman digit is the
   fallback and only shows where no letter carries that value -- a language
   counting in a base that has no such digit, which cannot happen under ten
   and can under none of the four bases there are.

   They are here rather than behind a switch because free is one face and
   stays one face. 「2ページ目なしでqwartyの上に1〜0の数字と！？入れてこれで無料版
   1ページに抑えよう」 A second face on free would have held these and nothing
   else, which is a key to reach a row.

   Ten is already the widest row on the board. `!` and `?` are not up here
   with them -- twelve across a phone is narrower than a thumb -- they are
   beside the space, where KB_ENDS puts them. */
var KB_DIGITS='1234567890';
/* A key that types a character rather than a letter. The digits here, and the
   roman face the conversion needs -- neither is one of the person's letters,
   both are something to press that puts a known character in. */
function kbRom(c){ return {w:1, k:'rom', v:c, f:['','','','']}; }
/* A key of the fixed keyboard, carrying what it types.

   kbNamed() finds a letter by its name folded to lower case, so a letter
   somebody's older language calls `O` answers the `o` key -- and then the key
   typed `O`, because what a key types is the letter's name and the name is
   the one with the capital on it. A line came out `hellO`.

   On this keyboard the character that FOUND the letter is the right answer:
   the free rows are a to z by construction and their names cannot be changed,
   so `o` is what the key is and what it must put in. `t` here overrides the
   name for this key only -- share.js reads it, and a keyboard somebody built
   themselves has no such override and still types the names they chose. */
function kbFix(c, id){ var k=kbKey('lt', id); k.t=c; return k; }
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
  row=[];
  for(i=0;i<KB_DIGITS.length;i++){
    var dc=KB_DIGITS.charAt(i), dl=numByVal(parseInt(dc, 10));
    row.push(dl? kbFix(dc, dl.id) : kbRom(dc));
  }
  rows.push(row);
  for(i=0;i<KB_QWERTY.length;i++){
    r=KB_QWERTY[i]; row=[];
    for(j=0;j<r.length;j++){
      id=kbNamed(r.charAt(j));
      if(id) row.push(kbFix(r.charAt(j), id));
    }
    /* Two keys wide. It is the one key you hit without looking, and it was
       the same width as a letter. 「デリートキーは横二つ分欲しいかも」 */
    if(i===KB_QWERTY.length-1){ var d=kbKey('del'); d.w=2; row.push(d); }
    if(row.length) rows.push(row);
  }
  /* And the bar along the bottom. A line of the language is more than one
     word -- an example under a word, a post -- and without this there is no
     way to put a gap between two of them. `!` and `?` stand at its ends. */
  var sp=kbKey('sp'); sp.w=4;
  var bot=[], end0=kbNamed(KB_ENDS.charAt(0)), end1=kbNamed(KB_ENDS.charAt(1));
  if(end0) bot.push(kbFix(KB_ENDS.charAt(0), end0));
  bot.push(sp);
  if(end1) bot.push(kbFix(KB_ENDS.charAt(1), end1));
  rows.push(bot);
  return {lay:[{rows:rows}]};
}
function kbOf(){
  if(!can('kb')) return kbFixed();
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
  if(key.k==='lay') return kbLayFace(parseInt(key.v, 10)||0);
  if(key.k==='rom') return '<span class="kbl">'+esc(key.v)+'</span>';
  var l=ltById(key.v);
  if(!l) return '<span class="kbl">·</span>';
  return ltInk(l, '<span class="kbl">'+esc(ltName(l)||'·')+'</span>');
}
function kbLayName(i){ return String(i+1); }
/* A layer-switch key wears the FIRST LETTER of the layer it goes to, the way
   a phone's 123 key wears a 1 and its ABC key wears an A. Which means the key
   is in the language: press the one showing your 1 and the digits come up.

   No string is invented to do it, which is the other half of why: a name for
   a face would be a name in ten languages for something the person made and
   already named. The number is the fallback, for a layer somebody built with
   no letter on it at all. */
function kbLayLetter(i){
  var b=kbOf(), lay=b.lay[i], ri, ki, k;
  if(!lay) return null;
  for(ri=0;ri<lay.rows.length;ri++)
    for(ki=0;ki<lay.rows[ri].length;ki++){
      k=lay.rows[ri][ki];
      if(k.k==='lt' && k.v && ltById(k.v)) return ltById(k.v);
    }
  return null;
}
function kbLayFace(i){
  var l=kbLayLetter(i);
  return l? ltInk(l, '<span class="kbl">'+esc(ltName(l)||kbLayName(i))+'</span>')
          : '<span class="kbl">'+esc(kbLayName(i))+'</span>';
}
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
/* `ro` is the same keyboard with nothing to press.

   The free plan has a keyboard -- kbFixed(), a QWERTY wearing the letters
   somebody drew -- and it is the whole point of the app. What it does not
   have is an editor. Drawn as buttons it would offer to open a key and then
   refuse, so the keys are plain spans there: nothing to press, because there
   is nothing to press it for. It is one function and not two so that a key
   cannot look like one thing on the paid screen and another on the free
   one, which is the same argument kbFace() is already making one level
   down. */
function kbHTML(sel, ro){
  var lay=kbLayer(), out='', ri, ki, row, key, cls;
  for(ri=0;ri<lay.rows.length;ri++){
    row=lay.rows[ri];
    out+='<div class="kbrow">';
    for(ki=0;ki<row.length;ki++){
      key=row[ki];
      cls='kbk'+(key.k!=='lt'? ' fn':'')+(ro? ' ro':'')+
        ((!ro && sel && sel.r===ri && sel.k===ki)? ' on':'');
      out+= ro
        ? '<span class="'+cls+'" style="flex:'+(key.w||1)+'">'+kbFlicks(key)+
          '<span class="kbc">'+kbFace(key)+'</span></span>'
        : '<button class="'+cls+'" style="flex:'+(key.w||1)+'" data-r="'+ri+'" data-k="'+ki+'"'+
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
  /* The free plan has a keyboard. It was shown a wall.

     This chapter used to answer the free plan with kb.locked and an Upgrade
     button and nothing else -- which said, to somebody who had drawn
     twenty-eight letters, that they had no keyboard. They have exactly the
     one the app is for: kbFixed(), their letters on a QWERTY, and it is what
     goes on the phone. What they do not have is an editor for it, and that
     is the only thing Upgrade buys here.

     Worse, the two things that MATTER on this screen were behind the wall:
     how to switch the keyboard on in iOS, and whether the letters have
     actually been handed over. Those are not a paid feature -- they are the
     instructions for using what is already yours, and without them a free
     account draws an alphabet and has nowhere to go with it.
     「キーボード設定できないならいらんやん」「キーボードの設定方法がわかり
     にくいんだよ。Linguaで先に文字を書いてくださいの画面にどう結びつけるのか
     がわからんて」

     So free gets the steps, the state, and the keyboard itself with nothing
     to press. Upgrade stays, at the foot, saying the one true thing. */
  if(!can('kb'))
    return '<div class="view">'+navTop(String(kbKeys()))+'<div class="body">'+
      kbSysHTML()+
      kbHTML(null, true)+
      '<div class="note" style="margin-top:14px">'+t('kb.locked')+'</div>'+
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
    kbSysHTML()+
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
/* What this chapter IS, which the screen never said.
   「ここの画面どういうこと？」「Linguaで書いてくださいの画面にどう結びつけるのか
   がわからんて」

   The editor below is the layout of a keyboard that goes on the PHONE, and
   nothing anywhere in the app said so -- the steps to install it were written
   in docs/keyboard-extension.md, which two people have read. Somebody who saw
   the keyboard say "draw some letters first" had no way at all to find their
   way back here.

   The app cannot ASK whether the keyboard is installed or has full access:
   iOS gives a containing app no way to find out. So this tells and does not
   check, and it does not draw a tick it would have to invent. */
function kbSysHTML(){
  /* Not `.sec` for the heading: that class upper-cases, and an upper-cased
     iPhone is a word Apple does not spell. The steps are numbered rather than
     bulleted because they are in an order.

     The state goes in a box of its own and last, because it is the only line
     here anybody can act on -- everything above it is instructions and reads
     as instructions; a person whose keyboard is empty needs to find, at a
     glance, whether drawing more letters would help. */
  return '<div class="kbsys">'+
    '<div class="kbsysh">'+t('kb.sys.h')+'</div>'+
    '<ol class="kbsteps"><li>'+t('kb.sys.1')+'</li><li>'+t('kb.sys.2')+'</li></ol>'+
    '<div class="mini">'+t('kb.sys.full')+'</div>'+
    '<div class="note kbout'+(SHARE.how==='sent'? '':' bad')+'">'+esc(kbOutSay())+'</div>'+
    '</div>';
}
/* Whether what this chapter builds ever reached the phone.
   
   sharePush() has recorded the answer since the day it was written and showed
   it to nobody, which is how three builds in a row failed with the same
   symptom and three different causes -- the keyboard saying "draw some
   letters first" while the letters sat drawn on the other side of a wall.
   Each time the answer was already in memory and had no way out.
   
   This is not a debug line. It is the one question a person can act on: if
   nothing was ever handed over, drawing more letters will not help. */
function kbOutSay(){
  if(SHARE.how==='sent') return t('kb.out.ok');
  if(SHARE.how==='no bridge') return t('kb.out.no');
  if(SHARE.how) return t('kb.out.bad', SHARE.how);
  return t('kb.out.none');
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
