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

/* A language holds up to three keyboards, and one of them is the one on the
   phone. 「キーボード3つくらいまで作れるようにして適応推したらlinguaのキーボード
   が入れ替わるとかできるの？ページじゃない」

   They are not layers, and the distinction is the whole of it: a LAYER is a
   face of one keyboard, reached by a key on that keyboard, the way ABC and
   あいう are two faces of one. A KEYBOARD is a different keyboard. Three of
   them sit side by side and exactly one is APPLIED -- which is the one kbOf()
   answers with, so it is the one share.js hands over and the one under
   somebody's thumb in Messages.

   Editing does not move that. You can build the next keyboard without
   disturbing the one you are typing on, and press Apply when it is ready. */
var KB=null, KB_MAX=3;
function kbRead(){
  KB=null;
  try{ KB=kbBoardsOf(JSON.parse(localStorage.getItem(langKey('kb'))||'null')); }
  catch(e){}
}
/* What is on the disk, whichever shape it is in. It was one keyboard --
   `{lay:[...]}` -- and it is now several, so the one becomes the first of the
   several by having its layers COPIED across. Nothing is rewritten and
   nothing is dropped: a backup file written before this restores through the
   same two lines, because the reader takes either shape rather than the
   newer one only. */
function kbBoardsOf(k){
  if(!k) return null;
  if(k.kbs && k.kbs.length) return k;
  if(k.lay && k.lay.length) return {kbs:[{nm:'', pat:'', lay:k.lay}], at:0};
  return null;
}
kbRead();
/* Two layouts, the same or not. JSON, because both sides are built by the
   same functions out of the same key objects -- so a copy nobody touched is
   character for character what kbFixed() makes today, and anything else is a
   difference somebody made on purpose. */
function kbSameLay(a, b){
  try{ return JSON.stringify(a)===JSON.stringify(b); }catch(e){ return false; }
}
/* ---- the free QWERTY comes out of storage ------------------------------
   Board 0 used to be a COPY of the free QWERTY, written into KB.kbs the
   first time anything on this screen was changed, and that copy was
   editable. It is neither now: kbBoards() puts kbFree() in front and storage
   holds only what somebody built.

   So the copy has to leave the array, and the one thing that must not happen
   is that an EDITED board 0 leaves with it. Two cases, told apart by looking
   rather than assumed:

     still the free QWERTY   regenerable, and board 0 is now exactly that, so
                             the copy is redundant. It comes out and nothing
                             is lost.
     edited                  a keyboard somebody made. It stays, as an
                             ordinary board, and every index after it moves
                             by one -- KB.at included, or the keyboard on the
                             phone silently becomes its neighbour.

   `v` says this has run. Without it the next launch would run it again and
   take the person's own first board out of the array as though it were the
   copy. */
function migrateKbFree(){
  if(!KB || (parseInt(KB.v, 10)||0)>=2) return;
  var kbs=KB.kbs||[], at=parseInt(KB.at, 10)||0;
  if(kbs.length && kbSameLay(kbs[0].lay, kbFixed().lay)) kbs.shift();
  else if(kbs.length) at=at+1;
  KB.kbs=kbs; KB.at=at; KB.v=2;
  saveKb();
}
function saveKb(){ kbNoted(); bkTouch(); try{ localStorage.setItem(langKey('kb'), JSON.stringify(KB)); }catch(e){} }

/* The four directions a finger can leave a key by, in the order they are
   stored. Written once because the editor, the renderer and the flick all
   count on the same order. */
var KB_DIRS=['up', 'right', 'down', 'left'];
function kbKey(k, v){ return {w:1, k:k, v:v||'', f:['','','','']}; }
/* Nothing, taking up room. A row is laid out by dividing the width among the
   keys in it, so the only way to inset a row -- which is what the third row
   of every phone keyboard is -- is a key that is not a key. It draws nothing
   and does nothing when pressed, and share.js drops it on the way out rather
   than handing the extension a key with no job. */
function kbGap(w){ var k=kbKey('gap'); k.w=w; return k; }

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
/* ---- the five a keyboard can be made from ------------------------------
   「まずはqwartyかフリックかタップとかキーボードのパターンを選べて」

   The editor had everything except a place to start: a key already opened
   onto what it types, its four flick directions, its width and where it sits,
   and the only layout to start FROM was the letters five to a row. Anybody
   who wanted a QWERTY was moving thirty keys by hand.

   Each of these is built out of THIS language's letters. None of them is a
   picture of a roman keyboard with the letters poured in afterwards -- the
   chart asks the language what consonants and vowels it has, the flick asks
   how many letters there are, and a language with nine letters gets a keyboard
   with nine letters on it.

   A pattern is a starting point and it is meant to be pulled apart, which is
   why the board remembers which one it was made from and nothing reads that
   back except the screen, to say so. */
var KB_PATS=['qwerty', 'flick', 'tap', 'chart', 'abc'];
/* Ten to a row, which is what a row of a phone keyboard holds. */
function kbRowsOf(list, per){
  var rows=[], row=[], i, sp;
  for(i=0;i<list.length;i++){
    row.push(kbKey('lt', list[i].id));
    if(row.length===per){ rows.push(row); row=[]; }
  }
  if(row.length) rows.push(row);
  sp=kbKey('sp'); sp.w=3;
  rows.push([sp, kbKey('del')]);
  return rows;
}
/* Twelve keys, four directions on each. One key holds five letters, so a
   language of sixty is one face -- which is the whole argument for a flick
   keyboard and the reason Japanese phones have one. The letters go on in the
   order the alphabet is in: the fifth of every group is the key itself and
   the four around it are the flicks, so the groups read across. */
function kbFlickLay(){
  var ls=ltOrder(ltOfKind('alpha')), rows=[], row=[], i, j, k, sp;
  for(i=0;i<ls.length;i+=5){
    k=kbKey('lt', ls[i].id);
    for(j=1;j<5;j++) if(ls[i+j]) k.f[j-1]=ls[i+j].id;
    row.push(k);
    if(row.length===3){ rows.push(row); row=[]; }
  }
  if(row.length) rows.push(row);
  if(!rows.length) rows.push([kbKey('lt', '')]);
  sp=kbKey('sp'); sp.w=2;
  rows.push([sp, kbKey('del')]);
  return [{rows:rows}];
}
/* Consonants down the page and vowels across it, which is the shape a
   syllabary is taught in and the reason a kana chart looks like a chart. The
   language is asked what it has rather than told: a row per consonant, a
   column per vowel, and the letter that writes that syllable if one has been
   made. A cell nothing writes yet is an empty key, because the row it is in
   is what says which syllable it is for.

   With no sounds taken up at all there is nothing to lay out, and the answer
   is the plain grid rather than a chart of nothing. */
function kbChartLay(){
  var cs=wsCons(), vs=wsVows(), rows=[], row, i, j, l, sp;
  if(!cs.length || !vs.length) return kbTapLay();
  for(i=0;i<cs.length;i++){
    row=[];
    for(j=0;j<vs.length;j++){
      l=ltMain(wsKey([cs[i], vs[j]]));
      row.push(kbKey('lt', l? l.id : ''));
    }
    rows.push(row);
  }
  sp=kbKey('sp'); sp.w=Math.max(2, vs.length-1);
  rows.push([sp, kbKey('del')]);
  return [{rows:rows}];
}
function kbTapLay(){ return kbDefault().lay; }
function kbAbcLay(){ return [{rows:kbRowsOf(ltOrder(ltOfKind('alpha')), 10)}]; }
/* The free plan's layout, editable. kbFixed() is where it is written down and
   this asks it rather than saying it again -- so the QWERTY somebody starts
   from is the same QWERTY they were typing on, key for key. */
function kbQwertyLay(){ return kbFixed().lay; }
function kbPatLay(pat){
  if(pat==='qwerty') return kbQwertyLay();
  if(pat==='flick')  return kbFlickLay();
  if(pat==='chart')  return kbChartLay();
  if(pat==='abc')    return kbAbcLay();
  return kbTapLay();
}
/* The shape without the letters.
   「それ以外2つ目作るときは形だけ」

   A pattern is an ARRANGEMENT -- how many keys, how wide, WHICH CARRY A
   FLICK, where the space and the delete sit. Which letter goes on which key
   is the other half and it is the person's.

   The flick slots are part of the arrangement and this emptied them, which
   made choosing Flick produce twelve keys with nothing to flick to -- a tap
   keyboard wearing another name. 「フリックにしたのにフリックできない」 A
   slot that the pattern put there stays there and stays EMPTY, which is a
   slot waiting for a letter and is what the editor draws as a dashed square.

   The first board is the exception and is not made here: it is the QWERTY
   they already had, letters and all. Everything after it starts empty.

   The layer keys keep what they do, and the space and the delete keep being
   themselves. Safe to write into: every kbPatLay() builds its rows fresh. */
function kbBlank(lay){
  var i, j, k, key, d;
  for(i=0;i<lay.length;i++)
    for(j=0;j<lay[i].rows.length;j++)
      for(k=0;k<lay[i].rows[j].length;k++){
        key=lay[i].rows[j][k];
        if(key.k!=='lt') continue;
        key.v='';
        key.t='';
        /* Emptied, never removed. `''` is a slot with no letter in it yet;
           taking the array away is a key that can never have one. */
        if(key.f) for(d=0;d<key.f.length;d++) key.f[d]='';
      }
  return lay;
}
/* Whether this board's keys flick at all. A pattern that laid four
   directions on a key means them, and one that did not means that too -- a
   QWERTY has no flick and the editor must not offer four empty squares
   around every one of its thirty keys.
   「qwartyで追加してるのに、行追加後に設定しようとしたらフリックになるのなに？」

   Both what it WAS made from and what it holds NOW. The layout alone cannot
   answer it: a flick board that nobody has put a letter on yet has four empty
   slots on every key, which is indistinguishable from a QWERTY -- and that is
   exactly the board somebody has just made and is looking at. `pat` is the
   intent and the keys are the fact, and either is enough. */
function kbHasFlick(){
  var b=kbBoard(), i, j, k, key, d;
  if(b.pat==='flick') return true;
  for(i=0;i<b.lay.length;i++)
    for(j=0;j<b.lay[i].rows.length;j++)
      for(k=0;k<b.lay[i].rows[j].length;k++){
        key=b.lay[i].rows[j][k];
        if(key.k!=='lt' || !key.f) continue;
        for(d=0;d<4;d++) if(key.f[d]) return true;
      }
  return false;
}
/* Made, kept, and shown -- but not applied. Building a keyboard must not take
   the one under somebody's thumb away from them mid-sentence. */
function kbAdd(pat){
  if(KB_PATS.indexOf(pat)<0) return;
  /* Storage holds only the ones the person built. The free QWERTY is board 0
     and is not among them, so the first one made here is the SECOND board. */
  if(!KB) KB={kbs:[], at:0};
  if(kbBoards().length>=KB_MAX){ toast(t('kb.full', KB_MAX)); return; }
  KB.kbs.push({nm:'', pat:pat, lay:kbBlank(kbPatLay(pat))});
  kbShow=kbBoards().length-1; kbLay=0; kbSel=null;
  kbForget();
  saveKb();
  /* And onto it. This is pressed on the sheet that offers the five patterns,
     so render() alone redrew the sheet -- somebody chose a keyboard and was
     left looking at the chooser. 「追加した時に画面動かないまま追加される
     のやめてくれ」 */
  kbGo();
}
/* The keyboard chapter, from wherever this was pressed. go() lands on a
   screen already behind you by cutting the trail back to it, so pressing
   Apply from a sheet does not push a second copy of the chapter. */
function kbGo(){
  if(here().r==='kb') render();
  else go('kb');
}
/* Which one goes to the phone. The only thing on this screen that changes
   what somebody types with. */
function kbApply(i){
  var bs=kbBoards();
  if(!bs.length) return;
  /* KB is null until something is built, and board 0 is appliable before
     then -- it is the keyboard already on the phone. */
  if(!KB) KB={kbs:[], at:0};
  KB.at=kbClamp(i, bs.length);
  saveKb(); render();
}
function kbGoBoard(i){
  kbShow=kbClamp(i, Math.max(1, kbBoards().length));
  kbLay=0; kbSel=null;
  go('kb', String(kbShow));
}
/* A keyboard goes only when somebody says so, and never the last one: with
   none left there is nothing to apply, and the app would be quietly back to
   the default while the screen said three. */
function kbDrop(i){
  var b=kbBoards();
  if(!b.length) return;
  i=kbClamp(i, b.length);
  /* Board 0 is not one of these. There is no "never the last one" test any
     more, because it is always there and there is always one to apply. */
  if(kbIsFree(i)) return;
  if(!confirm(t('kb.rm.q'))) return;
  KB.kbs.splice(i-1, 1);
  b=kbBoards();
  KB.at=kbClamp(KB.at>i? KB.at-1 : KB.at, b.length);
  kbShow=kbClamp(kbShow>=b.length? b.length-1 : kbShow, b.length);
  kbLay=0; kbSel=null;
  kbForget();
  saveKb();
  /* Deleting is pressed on the ⋯ sheet, so the same thing was true of it:
     the keyboard was gone and the screen was still the sheet about it. */
  kbGo();
}
/* What a keyboard is called: whatever somebody called it, and otherwise
   Keyboard 1, 2, 3. 「キーボード1、キーボード2、キーボード3って名前が初期」

   A bare number was what this used to be, and a number is not a name -- it is
   a position, and it changes when one in front of it is deleted. */
function kbName(i){
  var b=kbBoards(), x;
  if(!b.length) return t('kb.n', i+1);
  x=b[kbClamp(i, b.length)];
  return x.nm || t('kb.n', i+1);
}
/* Renaming one. Board 0 is the free QWERTY, is not in storage and has nothing
   to write a name on -- kbEdit() says so and this obeys it. */
function kbSetNm(v){
  var b=kbEdit();
  if(!b) return;
  b.nm=String(v||'').slice(0, 24);
  saveKb();
}
function kbNameHTML(i){
  if(kbIsFree(i)) return '';
  var b=kbBoards()[kbClamp(i, kbBoards().length)];
  return '<input class="lnin kbnm" value="'+esc((b && b.nm)||'')+'" '+
    'placeholder="'+esc(t('kb.n', i+1))+'" maxlength="24" autocomplete="off"'+
    IN('kbSetNm') + ' aria-label="'+esc(t('kb.n', i+1))+'">';
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

   On this keyboard the character that FOUND the letter is the right answer
   for WHICH letter the key is: the free rows are a to z by construction and
   their names cannot be changed, so `o` finds the letter the `o` key wears.

   What it PUTS IN is a different question and used to have the same answer.
   `c` is roman, so the free QWERTY typed roman while a keyboard somebody
   built typed the private use area -- one feature working on one plan and
   not on the other, split by nothing. sharePua() answers both now. `c` is
   still what finds the letter; it is no longer what the key types. */
function kbFix(c, id){ var k=kbKey('lt', id); k.t=sharePua(id)||c; return k; }
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
       the same width as a letter. 「デリートキーは横二つ分欲しいかも」

       And a gap before it, so the row comes to TEN like the two above it.
       Every row divides the whole width among its own keys, so a row that
       adds up to nine has keys a ninth wider than a row that adds up to ten
       -- and the columns stop lining up. 「キーボードずれた。文字サイズとか
       小さくしていいからずらさないで」 The nine-letter row does the same
       thing with half a key at each end, which is where a phone puts it. */
    /* The delete takes the slack instead of an empty slot taking it. The row
       was [nothing(1), z..m(7), delete(2)] -- ten across, so the columns
       lined up with the two rows above, at the price of a key-wide hole at
       the left of the third row. With the layer key gone from the bottom row
       that hole is the only empty space on the keyboard and it reads as a
       mistake. 「2があった分謎に隙間できたから無くして」

       Three wide and hard against the right edge: still ten across, still
       lined up, and the one key you hit without looking is now the easiest
       one to hit. 「デリートキーは横二つ分欲しいかも」 */
    if(i===KB_QWERTY.length-1){
      var d=kbKey('del'); d.w=3;
      row.push(d);
    }
    if(row.length===9) row.unshift(kbGap(0.5)), row.push(kbGap(0.5));
    if(row.length) rows.push(row);
  }
  /* And the bar along the bottom. A line of the language is more than one
     word -- an example under a word, a post -- and without this there is no
     way to put a gap between two of them.

     `! ? space return`. It was `! space ?`, the two marks standing at the
     ends of the bar, and it had no return at all: a keyboard that cannot
     start a new line is a keyboard nobody can send a message on, and free is
     the plan most people will ever have. The marks moved together to the
     near end to make room. 「！？スペース　改行」 */
  var sp=kbKey('sp'), ret=kbKey('ret'), bot=[];
  var end0=kbNamed(KB_ENDS.charAt(0)), end1=kbNamed(KB_ENDS.charAt(1));
  /* 1 + 1 + 6 + 2 = ten, the same as every row above. */
  sp.w=6; ret.w=2;
  if(end0) bot.push(kbFix(KB_ENDS.charAt(0), end0));
  if(end1) bot.push(kbFix(KB_ENDS.charAt(1), end1));
  bot.push(sp);
  bot.push(ret);
  rows.push(bot);
  return {lay:[{rows:rows}]};
}
/* The keyboards the person BUILT, which is what is on the disk. The free
   QWERTY is not among them and never was written there. Nothing else asks
   this: the screen, the count and the editor all want kbBoards(), which is
   this with that one in front. */
function kbStored(){ return (KB && KB.kbs)? KB.kbs : []; }
/* The keyboard somebody already had, as a board. kbFixed() is the free
   plan's QWERTY wearing their drawn letters, built from LETTERS every time
   it is shown -- so this is not a copy that can go stale, it is that. */
function kbFree(){ return {nm:'', pat:'qwerty', lay:kbFixed().lay}; }
/* The keyboards there are, and the first one is not nothing.
   「qwertyは無料版で組んだやつが1としてもう保存されてる状況だって」

   The chapter used to answer "nothing built yet" with the five patterns and
   no list, no apply and no tick -- so somebody who had just paid was shown a
   blank chooser for a keyboard they had been typing on for a week, and
   nowhere on the screen said that keyboard existed. It did: kbOf() has
   answered kbFixed() all along. What was missing was it being ON the list.

   The free QWERTY is ALWAYS the first of them, and it is not in storage --
   kbFree() rebuilds it from kbFixed() every time it is asked for, so it
   cannot go stale and cannot be edited into something else.

   It used to be a copy written into KB.kbs the first time anybody changed
   anything, and that copy was editable. Editing it is how the keyboard
   somebody types on disappears: the edited board 0 is what is applied on
   Plus, and the day the plan lapses kbOf() answers kbFixed() again -- a
   different keyboard, under the thumb of somebody who changed nothing.
   「1つ目の無料のqwartyは編集できないようにしてくれ。plusから無料に戻った時に
   キーボードなくなるやろ」

   So board 0 is the one thing on this screen that is the same on both plans,
   and coming back down to free changes nothing at all. */
function kbBoards(){
  if(!can('kb')) return [];
  return [kbFree()].concat(kbStored());
}
/* Board 0 and no other. Everything that writes asks this first. */
function kbIsFree(i){ return (parseInt(i, 10)||0)===0; }
function kbClamp(i, n){ return Math.max(0, Math.min(parseInt(i, 10)||0, n-1)); }
/* THE ONE ON THE PHONE. share.js reads this and nothing else, so what this
   answers is what somebody types with.

   Nothing built yet means the keyboard they already had -- kbFixed(), the
   QWERTY wearing their drawn letters. It used to mean kbDefault(), the
   letters five to a row, which is a DIFFERENT layout: paying changed the
   keyboard on the phone out from under somebody who had not asked for
   anything and had not touched this chapter.
   「plusにした瞬間にこれだわ。何も設定してないならqwartyの作ったやつ引き継いで、
   設定したらそれになるようにしてよ！」

   Which is the money rule said one more way. A plan decides what a person may
   DO. Buying one may add a keyboard; it may not take away the one they were
   typing on. */
/* Which of them is applied. KB is null until something is written, and
   kbBoards() answers with the free QWERTY before then -- so there is nothing
   to read it off and the answer is 0, which is that one. */
function kbApplied(n){ return kbClamp(KB? KB.at : 0, n); }
function kbOf(){
  var b=kbBoards();
  if(!can('kb') || !b.length) return kbFixed();
  return b[kbApplied(b.length)];
}
/* And the one on the SCREEN, which is a different question the moment there
   is more than one. The editor works on this; Apply is what makes it the
   other. */
function kbBoard(){
  var b=kbBoards();
  if(!can('kb') || !b.length) return kbFixed();
  return b[kbClamp(kbShow, b.length)];
}
/* Which layer is showing, which keyboard is showing, and which key is being
   edited. All three are where you are standing rather than anything the
   language has, so viewReset() drops them -- and which keyboard is APPLIED is
   not among them, because that one is the language's. */
var kbLay=0, kbSel=null, kbShow=0;
function kbLayer(){ var b=kbBoard(); return b.lay[Math.min(kbLay, b.lay.length-1)]; }
/* Writing means owning it: the default is a suggestion until the moment
   somebody changes something, and from then on it is theirs and does not
   quietly rearrange itself under them.

   It returns the board being SHOWN, because that is the one every mutator
   below is about. */
function kbEdit(){
  /* Nothing on board 0. It is the free QWERTY, it belongs to both plans, and
     the whole of why it is not stored is that it may not be changed. Every
     mutator below asks here and stops on null -- one place saying no, rather
     than thirty places each remembering to. */
  if(kbIsFree(kbShow)) return null;
  if(!KB) KB={kbs:[], at:0};
  kbShow=kbClamp(kbShow, kbBoards().length);
  if(kbIsFree(kbShow)) return null;
  return KB.kbs[kbShow-1] || null;
}
function kbAt(ri, ki){
  var rows=kbLayer().rows;
  return (rows[ri] && rows[ri][ki])? rows[ri][ki] : null;
}

/* ---- what a key shows -------------------------------------------------
   A letter shows the letter -- drawn, borrowed, or its name -- and the same
   ltInk() the alphabet and the tiles use, so a key cannot look like one thing
   here and another there. The keys that are not letters show a mark. */
/* The letter a key types, small in its corner -- the same thing the system
   keyboard draws (KeyBoardView.swift, `mark`), under the same switch and the
   same three conditions: a LETTER key, whose face is a shape or a BORROWED
   CHARACTER, that has a name to say.

   A borrowed character counts. What the mark answers is "which key is this",
   and a character taken from another script is no more readable as a position
   on QWERTY than a drawing is. The one key that must not have it is the one
   already wearing its own roman name -- ltInk's fallback, when a letter has
   neither a shape nor a character -- which would then be saying the same
   thing twice.

   It is here because the keyboard in this chapter is the only picture of that
   keyboard anybody can see without building the app. The switch sat directly
   above thirty keys that ignored it, so the one control whose whole job is to
   change how a key looks changed nothing on screen -- and the Swift that does
   obey it cannot be run on anything but a phone. */
function kbMark(key){
  var l;
  if(!kbRomOn() || !key || key.k!=='lt') return '';
  l=ltById(key.v);
  if(!l || !((l.st && l.st.length) || l.ch)) return '';
  var t=kbTyped(key.v);
  return t? '<span class="kbrm">'+esc(t)+'</span>' : '';
}
function kbFace(key){
  if(!key) return '';
  if(key.k==='del') return ICON_BACK;
  /* 「改行もいるだろ」 A keyboard that cannot start a new line is a keyboard
     nobody can write a message on. It was not among the kinds a key could be
     -- letter, space, delete, layer -- and the omission was invisible,
     because none of the five patterns puts one there either. */
  if(key.k==='ret') return ICON_RET;
  /* A space wears nothing. It is the widest key on the board and the only
     one whose shape is the whole of what it says, which is how every phone
     keyboard already draws it. */
  if(key.k==='sp') return '';
  /* Nothing at all, and it is not a mistake: kbGap() is the half key that
     insets a row so the columns line up. */
  if(key.k==='gap') return '';
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
/* The letters a key gives on a flick, small, at the edges they come from.

   An empty direction shows a faint dot ON A BOARD THAT FLICKS, and nothing at
   all on one that does not. A flick keyboard nobody has filled in yet looked
   exactly like a tap keyboard -- twelve blank keys -- so choosing Flick
   appeared to have done nothing. 「フリックにしたのにフリックできない」

   `slots` is false where a key is being SHOWN rather than built: the free
   keyboard has no flicks and the four dots would be four promises it does not
   keep. */
function kbFlicks(key, slots){
  var out='', i, l;
  if(!key || !key.f || key.k!=='lt') return '';
  for(i=0;i<4;i++){
    l=key.f[i]? ltById(key.f[i]) : null;
    if(l) out+='<span class="kbf kbf'+KB_DIRS[i]+'">'+ltInk(l, esc(ltName(l)||'·'))+'</span>';
    else if(slots) out+='<span class="kbf kbfx kbf'+KB_DIRS[i]+'">·</span>';
  }
  return out;
}
/* What a letter key types. It is the letter's NAME, because the name is the
   code point Lingua's own font draws -- so inside Lingua, in a field wearing
   .sfont, what lands there is the letter as it was drawn.

   OUTSIDE Lingua it is the name and nothing more. Messages has no font of
   anybody's alphabet and cannot be given one from a keyboard extension, so a
   letter called `a` arrives in a message as the system's `a`, at both ends.
   This comment used to say the opposite -- "so what lands in a field, or in
   Messages, is the letter itself" -- and that half was never true. What
   crosses is the shape ON A KEY and on the bar; what crosses in the message
   is the name.

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
/* A column, as a letter: a, b, ... z, aa. The other half of the address, and
   it means the same thing on every row because the editor's rows are a grid.
   「エクセルみたいに123abcみたいに振ればどこのどこをいじってるか分かりやすく
   ならない？」 */
function kbCol(i){
  var s='', n=parseInt(i, 10)||0;
  for(;;){
    s=String.fromCharCode(97+(n%26))+s;
    n=Math.floor(n/26)-1;
    if(n<0) return s;
  }
}
/* A key's width in COLUMNS, and a column is half a key -- because half a key
   is a thing this keyboard has. kbFixed() insets its third row with a gap key
   of w 0.5 at each end, and "grid-column: span 0.5" is not a thing: the
   browser drops the declaration, auto-places the item, and the row quietly
   grows a second line. That is a row twice as tall with two keys sitting off
   the end of it, and nothing throws. Counting in halves says exactly the same
   layout in whole numbers. */
function kbU(w){ return Math.max(1, Math.round((w||1)*2)); }
/* How wide the sheet is, in those columns: the widest row. Derived every time
   and stored nowhere -- a keyboard made before this existed has the same
   answer as one made after, because the answer was always in the widths. */
function kbCols(rows){
  var n=0, w, i, j;
  for(i=0;i<rows.length;i++){
    w=0;
    for(j=0;j<rows[i].length;j++) w+=kbU(rows[i][j].w);
    if(w>n) n=w;
  }
  return n||2;
}
/* The letters across the top, one to a whole key and not one to a column --
   nobody insets a row by half a letter. Inside #kb so it shares the grid's
   width and its columns; it holds no key, so kbReadRows() walks straight past
   it and a key being dragged cannot land in it. */
function kbHdrHTML(cols){
  var out='', i=0, n=0;
  while(i<cols){
    out+='<button class="kbcl" style="grid-column:span '+Math.min(2, cols-i)+'"'+
      DO('kbDelCol', [n]) + ' aria-label="'+esc(t('kb.col.del'))+'">'+
      kbCol(n)+'</button>';
    i+=2; n++;
  }
  return '<div class="kbhdr">'+out+'</div>';
}
/* The row's number, which is also how the row goes. 「1触ったら1が全部消える
   a触ったらa列全部消える」 A sheet is pointed at by its edges, and on a sheet
   the edge is where you take a whole row or a whole column away from.

   It asks nothing first, and that is deliberate: what stands behind it is the
   step back, not a dialog. A dialog on every row would make building a
   keyboard a conversation. */
function kbNHTML(ri){
  return '<button class="kbn"' + DO('kbDelRow', [ri]) +
    ' aria-label="'+esc(t('kb.row.del'))+'">'+(ri+1)+'</button>';
}
function kbHTML(sel, ro){
  var lay=kbLayer(), out='', ri, ki, row, key, cls, slots=!ro && kbHasFlick(),
      cols=ro? 0 : kbCols(lay.rows), at, b;
  if(!ro){ kbNoted(); out+=kbHdrHTML(cols); }
  for(ri=0;ri<lay.rows.length;ri++){
    row=lay.rows[ri];
    /* The row's number: the editor is a sheet you point at, and 3b is what
       somebody says about the key they are looking at. The read-only board is
       the keyboard itself and wears neither number nor letter -- a row number
       down the side of the thing on your phone is the editor leaking into it. */
    out+='<div class="kbrow">'+(ro? '' : kbNHTML(ri));
    at=0;
    for(ki=0;ki<row.length;ki++){
      key=row[ki];
      cls='kbk'+(key.k!=='lt'? ' fn':'')+(key.k==='gap'? ' gap':'')+(ro? ' ro':'')+
        ((!ro && sel && sel.r===ri && sel.k===ki)? ' on':'');
      /* Two columns wide, or as many as it is: a key of three IS six columns
         joined, which is where a wide key comes from on a sheet. */
      at+=kbU(key.w);
      out+= ro
        ? '<span class="'+cls+'" style="flex:'+(key.w||1)+'">'+kbFlicks(key, false)+
          '<span class="kbc">'+kbFace(key)+'</span>'+kbMark(key)+'</span>'
        : '<button class="'+cls+(kbWob? ' wob':'')+'" '+
          'style="grid-column:span '+kbU(key.w)+'" '+
          'data-r="'+ri+'" data-k="'+ki+'"'+
          (kbWob? '' : DO('kbPick', [ri, ki])) + '>'+kbFlicks(key, slots)+
          '<span class="kbc">'+kbFace(key)+'</span>'+kbMark(key)+'</button>';
    }
    /* The rest of the row, as empty cells, a key wide each. A row that comes
       to less than the widest one has them; every row of a keyboard built from
       a pattern comes to the same total and has none. */
    if(!ro) while(at<cols){
      b=Math.min(2, cols-at);
      out+='<span class="kbk cell" style="grid-column:span '+b+'"></span>';
      at+=b;
    }
    out+='</div>';
  }
  /* A row is added where a row would go: under the last one, the width of
     one, looking like the empty row it is about to be. It was a button at the
     foot of the screen. 「行を出す層を足すも使いづらすぎる」 */
  if(!ro)
    out+='<div class="kbrow"><button class="kbk addrow"' + DO('kbAddRowNew') +
      ' aria-label="'+esc(t('kb.row.add'))+'">'+ICON_ADD+'</button></div>';
  return '<div class="kb'+(ro? '' : ' kbsheet')+'" id="kb"'+
    (ro? '' : ' style="--kc:'+cols+'"')+'>'+out+'</div>';
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
/* One keyboard, as a row on the list: the thing itself, shrunk, and the tick
   if it is the one on the phone. Pressing it opens that keyboard.

   A LIST and not a row of tabs above an editor. The tabs sat at the top of
   the screen the editor was already filling, so the thing you were choosing
   and the thing you were changing were both on the page at once and neither
   had room. 「キーボード一覧→編集の形のほうがいい。上にあるとすんごい見にくい」 */
function kbRowHTML(x, i, at){
  return '<button class="kbrow"' + DO('kbGoBoard', [i]) + '>'+
    '<span class="kbrowk">'+kbShotHTML(x.lay)+'</span>'+
    '<span class="kbrown">'+esc(kbName(i))+'</span>'+
    (i===at? '<span class="kbon">'+ICON_TICK+'</span>' : '')+
    ICON_GO+'</button>';
}
function kbListHTML(){
  var bs=kbBoards(), at=kbApplied(bs.length);
  return '<div class="kblist">'+
    bs.map(function(x, i){ return kbRowHTML(x, i, at); }).join('')+
    (bs.length<KB_MAX
      ? '<button class="kbadd"' + DO('kbNew') + '>'+ICON_ADD+
        '<span>'+esc(t('kb.new'))+'</span></button>'
      : '')+
    '</div>';
}
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
    return '<div class="view">'+navTop('', helpQ('kb'))+'<div class="body">'+
      kbHTML(null, true)+
      kbSysHTML()+
      '<button class="btn" style="width:100%;margin-top:12px"' + DO('goPlans') + '>'+
        t('up.cta')+'</button>'+
      '</div></div>';
  /* The keyboard, and the row of the ones there are above it. There is no
     "nothing built yet" face any more: kbBoards() answers with the one
     already on the phone, so the first thing on this screen is always a
     keyboard rather than a chooser for one.
     「しかもキーボード保存もないし、保存先から選べるとこもないし」 */
  /* The chapter is a LIST. One keyboard is a page of its own, reached by
     pressing it -- so the screen you are choosing on and the screen you are
     changing on are two screens. */
  var bs=kbBoards(), a=here().a;
  if(a===null || a===undefined || a==='')
    return '<div class="view">'+navTop('', helpQ('kb'))+'<div class="body">'+
      kbListHTML()+
      kbSysHTML()+
      '</div></div>';
  var now=kbClamp(a, bs.length);
  kbShow=now;
  /* Board 0 is the free QWERTY and has no editor -- the same face the free
     plan gets, on the paid screen, because it is the same keyboard. What goes
     with the editor goes with it: the row of faces (it has one), the height
     (it is the height free types at), and the row of keys as buttons. What
     stays is Apply, because choosing it is the one thing anybody does to it. */
  if(kbIsFree(now))
    return '<div class="view">'+navTop('', kbMoreQ())+'<div class="body">'+
      kbHTML(null, true)+
      kbApplyHTML()+
      '</div></div>';
  return '<div class="view">'+navTop('', kbMoreQ())+'<div class="body">'+
    kbNameHTML(now)+
    kbToolHTML()+
    kbHTML(kbSel)+
    kbLaysHTML()+
    kbNewHTML()+
    kbApplyHTML()+
    '</div></div>';
}
/* The ⋯ in the bar of one keyboard's page: deleting it, and starting the
   chapter over. It was at the end of the row of tabs, which is a row that no
   longer exists. */
function kbMoreQ(){
  if(kbWob)
    return '<button class="navq navdone"' + DO('kbWobEnd') + '>'+esc(t('kb.done'))+'</button>';
  return '<button class="navq"' + DO('kbMore') + ' aria-label="'+esc(t('kb.more'))+'">'+
    ICON_DOTS+'</button>';
}
/* The pages of THIS keyboard, at the FOOT of the sheet, which is where a
   spreadsheet keeps them. 「＋が上にあるけどプラスは下に」

   Every page is named, including the first, and including when it is the only
   one. It used to appear at two pages and up, on the argument that a switch
   between one thing is a label -- but this is the sheet's tab bar now, and
   the tab bar saying "1" is what tells you which page the thing above it is.
   The + then reads as what it is: the next page.
   「いま1ページ目なんだから1ページ目の記載+は2層目から」
   「ページを作るなら切り替えボタンは必須ね？」 */
function kbLaysHTML(){
  var b=kbBoard(), n=b.lay.length, at=Math.min(kbLay, n-1);
  return '<div class="segs kbsegs">'+
    b.lay.map(function(x, i){
      return '<button class="seg'+(i===at? ' on':'')+'"' +
        DO('kbGoLay', [i]) + '>'+esc(kbLayName(i))+'</button>';
    }).join('')+
    '<button class="seg add"' + DO('kbAddLay') + ' aria-label="'+esc(t('kb.lay.add'))+'">'+
      ICON_ADD+'</button>'+
    /* Beside the faces, and only when there is more than one -- the way to be
       rid of the only face is to delete the keyboard. It takes the face being
       SHOWN, which is the one the rest of this screen is about. */
    (n>1
      ? '<button class="seg drop"' + DO('kbDropLay', [at]) +
        ' aria-label="'+esc(t('kb.lay.rm'))+'">'+ICON_CROSS+'</button>'
      : '')+
    '</div>';
}
/* The five, offered as SHAPES. 「説明ちっくすぎて嫌だ。かっこよさも何もない」

   They were five rows of prose -- "twelve keys, four directions on each" --
   which is a manual page, and a manual page is the one thing this screen must
   not be: the difference between these five is entirely a difference of
   shape, and a shape is the thing a sentence is worst at. So each one draws
   itself, out of its own real layout, and the only words left are its name.

   Keys and not letters. At this size a drawn glyph is a smudge, and a smudge
   of somebody's alphabet is worse than an honest block -- what is being
   chosen here is the arrangement, and the arrangement is what is shown. A key
   that carries a flick wears the four marks, because that is the whole of
   what makes a flick keyboard one. */
function kbPatsHTML(act){
  return '<div class="kbpats">'+KB_PATS.map(function(p){
    return '<button class="kbpat"' + DO(act, [p]) + '>'+
      kbMiniHTML(kbPatLay(p))+
      '<span class="kbpn">'+esc(t('kb.pat.'+p))+'</span>'+
      '</button>';
  }).join('')+'</div>';
}
/* A keyboard at a glance: its first face, as blocks. Width is the key's own,
   so a space bar reads as a space bar and a delete two wide reads as one.

   BLOCKS and not the letters, and that is the point rather than a shortcut.
   This is what the five patterns are chosen by on the sheet that makes
   another, and what is being chosen there is the arrangement -- twelve big
   keys or thirty small ones. At that size a drawn glyph is a smudge, and a
   smudge of somebody's alphabet is worse than an honest block. */
function kbMiniHTML(lay){
  var rows=(lay && lay[0] && lay[0].rows)? lay[0].rows : [], out='', i, j, k, fl;
  for(i=0;i<rows.length;i++){
    out+='<span class="kbmr">';
    for(j=0;j<rows[i].length;j++){
      k=rows[i][j];
      fl=(k.f && (k.f[0]||k.f[1]||k.f[2]||k.f[3]))? ' fl' : '';
      out+='<span class="kbmk'+(k.k==='lt'? '' : ' fn')+fl+'" style="flex:'+(k.w||1)+'"></span>';
    }
    out+='</span>';
  }
  return '<span class="kbmini">'+out+'</span>';
}
/* The keyboard itself, small. 「リアルなキーボードを縮小して見せれないの？」

   Not blocks: the real keys, wearing the real letters, drawn by the same
   kbFace() the keyboard below is drawn by -- so what you are choosing between
   is what you will be typing on rather than a diagram of it. One face, the
   first, because that is the one a keyboard opens on.

   It is a picture and nothing in it is pressable: the tile is the button. */
function kbShotHTML(lay){
  var rows=(lay && lay[0] && lay[0].rows)? lay[0].rows : [], out='', i, j, k;
  for(i=0;i<rows.length;i++){
    out+='<span class="kbsr">';
    for(j=0;j<rows[i].length;j++){
      k=rows[i][j];
      out+='<span class="kbsk'+(k.k==='lt'? '' : ' fn')+(k.k==='gap'? ' gap':'')+
        '" style="flex:'+(k.w||1)+'">'+kbFace(k)+'</span>';
    }
    out+='</span>';
  }
  return '<span class="kbshot2">'+out+'</span>';
}
/* Apply, and it is the only control on this screen that changes what somebody
   types with. On the one already applied it says so instead, because a button
   that does nothing is worse than a line that explains. */
function kbApplyHTML(){
  var bs=kbBoards(), at=kbApplied(bs.length), now=kbClamp(kbShow, bs.length);
  /* Nothing at all when this IS the one on the phone. It said so in a line of
     grey text, which is a sentence to read where the tick on its tab has
     already answered. 「今これが端末に入ってますとかいらねえって言ってんだろ」 */
  if(now===at) return '';
  return '<div class="kbapply">'+
    '<button class="btn" style="width:100%"' + DO('kbApply', [now]) + '>'+
      esc(t('kb.apply'))+'</button>'+
    '</div>';
}
/* ---- holding a key and moving it ---------------------------------------
   「pcみたいなuiも嫌だ長押しで編集とかスマホの編集にしてくれよ」

   A key used to be moved with a ◀ and a ▶ at the bottom of a sheet, which is
   a PC's answer: pick the thing, then find the control that acts on it. On a
   phone the thing IS the control. Hold a key and it lifts; carry it and the
   others move aside; let go and it is where you left it.

   The gesture is the alphabet's, key for key -- 380ms to lift, twelve pixels
   of travel to be a scroll instead, the order written on the way up and not
   on every swap. What differs is only where a thing can land: a letter lives
   in one grid and a key lives in a row among rows, so this carries across
   rows as well as along them.

   Tapping still opens the key. The hold is the second thing a press can be,
   which is the whole reason a delay is there. */
var KBD=null;
function kbDragMount(){
  var g=document.getElementById('kb');
  if(!g) return;
  g.addEventListener('touchstart', kbDown, false);
  g.addEventListener('touchmove', kbDragTo, false);
  g.addEventListener('touchend', kbUp, false);
  g.addEventListener('touchcancel', kbUp, false);
}
/* The key a touch landed on. What is under a finger is the canvas or one of
   the four flick marks as often as it is the button. */
function kbKeyAt(el){
  while(el && el.classList && !el.classList.contains('kbk')) el=el.parentNode;
  return (el && el.classList && el.classList.contains('kbk'))? el : null;
}
function kbDown(e){
  var b=kbKeyAt(e.target), p=e.touches? e.touches[0] : e;
  if(!b || !p || b.getAttribute('data-r')===null) return;
  KBD={el:b, x:p.clientX, y:p.clientY, on:false, timer:0};
  KBD.timer=setTimeout(kbLift, 380);
}
function kbLift(){
  if(!KBD) return;
  KBD.on=true;
  KBD.el.classList.add('lift');
  var g=document.getElementById('kb');
  if(g) g.classList.add('moving');
  /* And the keyboard goes into the state a phone's home screen goes into
     when an icon is held: every key wobbling with a ⊖ on its corner. It is
     not drawn until the finger comes up -- a render() in the middle of a drag
     takes the element being dragged out from under it.
     「長押ししたら右上に➖出てきて消える。iPhoneのホーム画面と同じ挙動」 */
  kbWob=true;
}
function kbDragTo(e){
  if(!KBD) return;
  var p=e.touches? e.touches[0] : e;
  if(!p) return;
  var dx=p.clientX-KBD.x, dy=p.clientY-KBD.y;
  if(!KBD.on){
    if(dx*dx+dy*dy>144){ clearTimeout(KBD.timer); KBD=null; }
    return;
  }
  e.preventDefault();
  KBD.el.style.transform='translate('+dx+'px,'+dy+'px)';
  /* The key being carried is directly under the finger -- that is what
     carrying it means -- and it is lifted above the others, so it is the
     topmost thing at that point and elementFromPoint answered with IT every
     single time. `over===KBD.el` then sent the drag home, and a key held and
     dragged across the whole keyboard never swapped with anything.
     「長押しして持っていきたいのに動かない」

     So it is taken out of the hit test for the length of the question and put
     straight back. Nothing else can be asked instead: what is wanted is the
     key UNDER the one being carried. */
  KBD.el.style.pointerEvents='none';
  var over=kbKeyAt(document.elementFromPoint(p.clientX, p.clientY));
  KBD.el.style.pointerEvents='';
  if(!over || over===KBD.el) return;
  /* Into the row the finger is over, beside the key it is over -- which is
     what moving across rows means and is the half a one-dimensional grid
     never has to answer. */
  var row=over.parentNode, mine=KBD.el.parentNode, kids=row.children, a=-1, b=-1, i;
  for(i=0;i<kids.length;i++){ if(kids[i]===KBD.el) a=i; if(kids[i]===over) b=i; }
  row.insertBefore(KBD.el, (a>=0 && b>a)? over.nextSibling : over);
  /* A row emptied by the last key leaving it is a row of nothing, which is a
     gap in the keyboard that nothing can be put back into. */
  if(mine!==row && !mine.children.length) mine.parentNode.removeChild(mine);
  KBD.x=p.clientX; KBD.y=p.clientY;
  KBD.el.style.transform='';
}
function kbUp(e){
  if(!KBD) return;
  clearTimeout(KBD.timer);
  var d=KBD, g=document.getElementById('kb');
  KBD=null;
  d.el.style.transform='';
  d.el.classList.remove('lift');
  if(g) g.classList.remove('moving');
  if(!d.on){
    /* Held long enough to wobble but let go without moving anything: still a
       hold, so the ⊖ appear. */
    if(kbWob) render();
    return;
  }
  /* and the press does not also open the key it was moving */
  if(e && e.preventDefault) e.preventDefault();
  kbReadRows();
}
/* ---- the state a home screen is in while an icon is held ---------------
   Every key wobbling, a ⊖ on each one, and Done in the bar. Pressing a key
   does nothing while it lasts -- what a press is FOR in this state is the ⊖,
   and a key that opened its own sheet from under a wobble would be two
   answers to one press.

   Where you are standing, so viewReset() drops it. */
var kbWob=false;
function kbWobEnd(){ kbWob=false; kbSel=null; render(); }
/* The layout, read back off the screen. The keys moved in the page while the
   finger was down and the language is told once, here -- the same way the
   alphabet is told its order once, on the way up. */
function kbReadRows(){
  var g=document.getElementById('kb'), lay=kbEdit(), rows=[], i, j, r, ks, row, k;
  if(!g || !lay) return;
  for(i=0;i<g.children.length;i++){
    r=g.children[i]; ks=r.children; row=[];
    for(j=0;j<ks.length;j++){
      k=kbAt(parseInt(ks[j].getAttribute('data-r'), 10), parseInt(ks[j].getAttribute('data-k'), 10));
      if(k) row.push(k);
    }
    if(row.length) rows.push(row);
  }
  if(!rows.length) return;
  lay.lay[Math.min(kbLay, lay.lay.length-1)].rows=rows;
  kbSel=null;
  saveKb(); render();
}
/* ---- a whole row, a whole column, and the step back ---------------------
   A sheet is worked from its edges: the number takes the row, the letter
   takes the column. 「1触ったら1が全部消える a触ったらa列全部消える」

   DELETE REVIEW. Both of these throw away keys somebody placed -- what each
   key types, its four flick slots, its width. Nothing else goes: not the
   letters those keys pointed at, not the other faces of this keyboard, not
   the other keyboards, not a word. It is asked for by name, by pressing the
   number or the letter of the thing being removed, and it is never automatic.

   Neither asks first, and what stands behind them instead is the step back.
   A keyboard is built by taking rows out and putting them back; a dialog on
   every one of those would make it a conversation. 「巻き戻しボタンと進む
   ボタンも入れよう」 */
function kbDelRow(ri){
  var lay=kbEdit();
  if(!lay) return;
  var rows=kbLayer().rows;
  ri=parseInt(ri, 10)||0;
  if(ri<0 || ri>=rows.length) return;
  rows.splice(ri, 1);
  kbSel=null; saveKb(); render();
}
/* A column, in whole keys, taken out of every row -- and a key that is wider
   than one column loses a column and stays. That is the half of this the word
   "delete" does not say: on a sheet, taking column c out of a row where one
   cell spans b to d leaves that cell spanning b to c. A key of three becomes
   a key of two.

   Counted in half columns, because a key can be half of one -- kbU() above
   says why. What is left is rounded back to keys, and anything that comes out
   at nothing goes. */
function kbDelCol(ci){
  var lay=kbEdit();
  if(!lay) return;
  var rows=kbLayer().rows, a=(parseInt(ci, 10)||0)*2, b=a+2, i, j, row, at, u, cut, out;
  for(i=0;i<rows.length;i++){
    row=rows[i]; at=0; out=[];
    for(j=0;j<row.length;j++){
      u=kbU(row[j].w);
      cut=Math.min(at+u, b)-Math.max(at, a);
      at+=u;
      if(cut>0) u-=cut;
      if(u>0){ row[j].w=u/2; out.push(row[j]); }
    }
    rows[i]=out;
  }
  kbSel=null; saveKb(); render();
}
/* ---- the step back, and the step forward again -------------------------
   Where the editor has been, as whole layouts. It is in memory and in memory
   only: what is stored is the keyboard, and this is the last forty things the
   keyboard was on this visit.

   ONE PLACE records it -- kbNoted() -- rather than the thirty mutators:
   kbDelRow, kbDelCol, kbDelKey, kbAddKey, kbSetW, kbSetKind, kbPut, the drag.
   A list that has to be added to by hand is a list with a hole in it, and the
   hole is a change that cannot be taken back with no way of knowing which one.

   Two things call it, and they are two because one of them is not enough.
   saveKb() is what every change to a keyboard ends in, so it cannot be
   forgotten; and the editor's own render, so that ARRIVING on a board is what
   sets the mark the first change is measured from. saveKb() alone would take
   its first reading after the first change had already happened, and the
   thing somebody wants back is the state before it.

   `cur` is what the board is as far as this has seen; `u` holds only states
   it USED to be in, so "is there anywhere to go back to" is u.length and
   nothing else. */
var KBU={id:'', cur:'', u:[], r:[]};
function kbNoted(){
  var b=kbEdit(), id, str;
  if(!b) return;
  id=String(kbShow);
  str=JSON.stringify(b.lay);
  /* Another board is another history. Nothing is carried across: undoing onto
     a keyboard the layout never belonged to is not a step back, it is a
     different keyboard arriving. */
  if(KBU.id!==id){ kbForget(); KBU.id=id; KBU.cur=str; return; }
  if(KBU.cur===str) return;
  KBU.u.push(KBU.cur);
  if(KBU.u.length>40) KBU.u.shift();
  KBU.cur=str;
  KBU.r=[];
}
/* A board is identified here by WHERE it is in the list, because that is all
   a board has -- and a position is not an identity. Delete board 1 and make
   another, and the new one is board 1 too, wearing the old one's history:
   the step back would put a layout that belongs to a deleted keyboard onto a
   keyboard that never had it. That is not a step back, it is a different
   keyboard arriving. So making one and deleting one both forget. */
function kbForget(){ KBU={id:'', cur:'', u:[], r:[]}; }
/* Both steps are the same move in opposite directions, so they are one
   function told which way. What comes off one stack goes onto the other, and
   the layout put back is a copy -- JSON out and JSON in -- so nothing on
   either stack is the live object. */
function kbStep(fwd){
  var b=kbEdit(), from=fwd? KBU.r : KBU.u, to=fwd? KBU.u : KBU.r, str;
  if(!b || !from.length) return;
  str=from.pop();
  to.push(KBU.cur);
  KBU.cur=str;
  b.lay=JSON.parse(str);
  kbLay=kbClamp(kbLay, b.lay.length);
  kbSel=null;
  saveKb(); render();
}
function kbUndo(){ kbStep(false); }
function kbRedo(){ kbStep(true); }
/* And the two of them, over the sheet, where the toolbar of anything that has
   an undo puts them. Down when there is nowhere to go: a button that can be
   pressed and does nothing is the app saying it did something. */
function kbToolHTML(){
  return '<div class="kbtool">'+
    '<button class="kbtb"' + DO('kbUndo') + (KBU.u.length? '' : ' disabled') +
      ' aria-label="'+esc(t('kb.undo'))+'">'+ICON_UNDO+'</button>'+
    '<button class="kbtb"' + DO('kbRedo') + (KBU.r.length? '' : ' disabled') +
      ' aria-label="'+esc(t('kb.redo'))+'">'+ICON_REDO+'</button>'+
    '</div>';
}
/* Making another is choosing a pattern again, on a screen of its own rather
   than a row that pushes the keyboard off the page. */
function kbNew(){
  openForm('kbnew', t('kb.new'), kbPatsHTML('kbAdd'), function(){ geTiles(); });
}
FORM_OPEN.kbnew=function(){ kbNew(); };
/* The pattern of a keyboard that already exists. It could only be chosen when
   the keyboard was made, so somebody who wanted flick after building a QWERTY
   had to delete the whole thing and start again 「途中でフリックにしたい！って
   とき変えられないよ？」

   DELETE REVIEW. Twelve keys and thirty keys are not the same set of places,
   so there is nowhere to put what was on the old ones and the layout is
   rebuilt empty: everything assigned to a key on this keyboard goes. Nothing
   ELSE goes -- not the letters, not the other keyboards, not the name. It is
   asked for by name, it asks before it does it, and it is not automatic.

   The same five patterns, from the same list, drawn by the same function: the
   only difference between choosing one here and choosing one for a new
   keyboard is which name the press carries. */
function kbRepat(i){
  var b=kbBoards();
  if(!b.length) return;
  kbShow=kbClamp(i, b.length);
  if(kbIsFree(kbShow)) return;
  openForm('kbpat:'+kbShow, t('kb.pat.set'), kbPatsHTML('kbSetPat'),
           function(){ geTiles(); });
}
FORM_OPEN.kbpat=function(a){ kbRepat(parseInt(a,10)||0); };
function kbSetPat(pat){
  var b=kbBoards(), x;
  if(KB_PATS.indexOf(pat)<0 || !b.length) return;
  if(kbIsFree(kbShow)) return;
  x=KB.kbs[kbShow-1];
  if(!x) return;
  if(x.pat===pat){ back(); return; }
  if(!confirm(t('kb.pat.q'))) return;
  x.pat=pat; x.lay=kbBlank(kbPatLay(pat));
  kbLay=0; kbSel=null;
  saveKb();
  kbGo();
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
/* Whether a key wears, small in its corner, the letter it types.

   A key with a drawn shape on it says nothing about WHICH key it is, and
   QWERTY is muscle memory rather than something readable off a keyboard --
   so somebody who has not learnt the layout is looking at thirty shapes.
   「qwarty暗記してない人は自作文字でどのアルファベットかわからなくなるやん？」

   And it is a crutch you stop wanting: once the layout is in the fingers the
   mark is thirty small letters printed over thirty drawings somebody made on
   purpose. So it is a switch rather than a decision.
   「オンオフできるようにしてね。キーボード設定で」

   The person's, not the language's: it is about reading a keyboard rather
   than about what the keyboard IS. On by default, because the day it matters
   is the first one. */
function kbRomOn(){ return SET.kbrom!==false; }
function setKbRom(){ SET.kbrom=!kbRomOn(); save(); render(); }
/* How the keyboard gets onto the phone, behind the `?` in the bar.
   「ここの説明とボタンも嫌だ」

   All of this was on the chapter itself: a heading, a filled gold button, two
   grey sentences and a state line, above the keyboard they were about. It is
   four fifths of the screen and it is read once. Here it is the whole of the
   sheet, which is what it is -- and the Open Settings button finally sits
   beside the sentence that says what Settings is for, instead of alone under
   a heading with nothing to explain it.
   「設定を開くボタン意味わからんから」

   Not `.sec` for the heading: that class upper-cases, and an upper-cased
   iPhone is a word Apple does not spell. */
/* A photograph of the screen a step lands on, with the row to press ringed
   ON it. A picture of iOS's own settings is the one kind of instruction that
   cannot go stale in translation and cannot be read wrong -- somebody looks
   at it and looks at their phone.

   A picture on its own is not an instruction, and both of these were in a
   pile under one step: a page of seven rows with nothing saying which of the
   seven, then a second page nothing said you had to be on.
   「なんで写真も渡したのに並べるだけなの？」

   So the mark travels WITH the photograph rather than living somewhere else:
   `t` and `h` are where that row sits in that file, as a percentage of its
   height, and a photograph taken again is one entry to change. A name that
   is not here draws nothing -- a step whose picture has not been taken is a
   step with no picture rather than a broken image. */
var KB_SHOTS={
  /* Add New Keyboard, at the foot of iOS's own list of keyboards */
  'kb-list.jpg': {t:87.0, h:10.2},
  /* Lingua, under Third-Party Keyboards and below everything Apple suggests */
  /* Measured off the file rather than eyeballed: the Lingua card runs from
     89.9% to 98.1% of its height, and the ring was set 1.1% below it.
     「キーボード設定の黄色い囲むやつLinguaのやつだけずれてる」 */
  'kb-add.jpg':  {t:89.6, h:8.8},
  /* the Keyboards row, at the foot of Lingua's own page in Settings */
  'kb-app.jpg':  {t:88.6, h:11.0},
  /* Allow Full Access, one page further in */
  'kb-full.jpg': {t:50.2, h:18.4}
};
function kbShot(name){
  if(!Object.prototype.hasOwnProperty.call(KB_SHOTS, name)) return '';
  var m=KB_SHOTS[name];
  return '<div class="kbshot"><img src="img/'+name+'" alt="">'+
    '<span class="kbring" style="top:'+m.t+'%;height:'+m.h+'%"></span></div>';
}
/* One step: its number, what to do, and the one thing that gets it done --
   the path, the button, or the photograph. Written once because the three
   steps differ only in that last part. */
function kbStepHTML(n, title, body){
  return '<div class="kbstep"><div class="kbstepn">'+n+'</div>'+
    '<div class="kbstept">'+esc(title)+'</div>'+body+'</div>';
}
HELP.kb=function(){
  return {t:t('kb.sys.h'), h:
    /* One step is one tap, and one tap is one photograph. It was two steps
       with both photographs stacked under the second -- so the step reading
       "turn on Full Access" carried a picture of a DIFFERENT page, the one
       you have to go through to reach it, and neither picture said which of
       its rows was the one to press.

       Step 1 carries the path and no button. It is the only one of the four
       that has to be walked to, because Apple gives no public door to that
       page -- a path and a button printed together were directions to two
       different screens. 「端末の設定を開くボタンあるのになんで設定→一般
       みたいな順序で説明すんの？」 The button is on step 3, which is the page
       it actually lands on. */
    kbStepHTML(1, t('kb.step1'), '<div class="mini">'+t('kb.step1.d')+'</div>'+
      kbShot('kb-list.jpg'))+
    kbStepHTML(2, t('kb.step2'), kbShot('kb-add.jpg'))+
    kbStepHTML(3, t('kb.step3'),
      '<button class="btn" style="width:100%;margin-top:10px"' + DO('kbSettings') + '>'+
        esc(t('kb.sys.go'))+'</button>'+
      kbShot('kb-app.jpg'))+
    kbStepHTML(4, t('kb.step4'), kbShot('kb-full.jpg'))};
};
/* What is left on the screen: the one line that is a setting rather than an
   explanation. Free has it too, and free is exactly the case it is for -- a
   QWERTY of drawn letters and no way to tell which is which. */
function kbSysHTML(){
  return '<button class="set" aria-pressed="'+(kbRomOn()? 'true':'false')+'"' +
    DO('setKbRom') + '>'+
    '<span class="sl">'+esc(t('kb.rom'))+'</span>'+
    swtHTML(kbRomOn())+'</button>';
}
/* The two that undo things, off the screen and behind the ⋯ at the end of
   the row of keyboards -- the same place a post keeps its three.
   「文字だけで縦に4つ並んでるのも嫌」

   A chapter whose foot is four lines of text, two of them red, is a list of
   words where a keyboard should be. What is left on the screen is the
   keyboard, one switch and one button; deleting and starting over are things
   you go looking for. */
function kbMore(){
  var bs=kbBoards(), now=kbClamp(kbShow, bs.length);
  openForm('kbmore', t('kb.more'),
    /* Not board 0. It is the free QWERTY, it is not in storage, and there is
       nothing there to delete. */
    (!kbIsFree(now)
      ? '<button class="set"' + DO('kbRepat', [now]) + '>'+
        '<span class="sl">'+esc(t('kb.pat.set'))+'</span>'+
        '<span class="sv">'+esc(t('kb.pat.'+kbBoard().pat))+ICON_GO+'</span></button>'+
        '<button class="set"' + DO('kbDrop', [now]) + '>'+
        '<span class="sl bad">'+esc(t('kb.rm'))+'</span></button>'
      : '')+
    '<button class="set" style="border-bottom:none"' + DO('kbReset') + '>'+
      '<span class="sl bad">'+esc(t('kb.reset'))+'</span></button>');
}
FORM_OPEN.kbmore=function(){ kbMore(); };
/* Whether what this chapter builds ever reached the phone.
   
   sharePush() has recorded the answer since the day it was written and showed
   it to nobody, which is how three builds in a row failed with the same
   symptom and three different causes -- the keyboard saying "draw some
   letters first" while the letters sat drawn on the other side of a wall.
   Each time the answer was already in memory and had no way out.
   
   This is not a debug line. It is the one question a person can act on: if
   nothing was ever handed over, drawing more letters will not help. */
/* No bridge means a browser, which is every check and no phone: there is no
   Settings to open and nothing to say about it. */
function kbSettings(){
  var p=sharePlug();
  if(!p) return;
  p('LinguaShare', 'settings', {})['catch'](function(){ toast(t('kb.sys.no')); });
}
function kbGoLay(i){ kbLay=i; render(); }
function kbAddLay(){
  var b=kbEdit();
  if(!b) return;
  b.lay.push({rows:[[kbKey('lt', '')]]});
  kbLay=b.lay.length-1;
  saveKb(); render();
}
/* And taking one away, which could be added and never removed -- a face built
   by accident stayed for the life of the keyboard.
   「キーボードの2層目作ったあといらなくなっても消せない」

   Never the last one: a keyboard with no face is not a keyboard, and the way
   to be rid of the only one is to delete the keyboard.

   A key that WENT to the face being removed is left pointing at a number that
   is now something else, so every one of them is walked and pointed back at
   the first face. Silently rewriting them to the wrong face is how somebody
   presses 2 and gets 3; there is no such thing as "the face it meant" once
   the face is gone. */
function kbDropLay(i){
  var b=kbEdit(), j, k, r, key, n;
  if(!b) return;
  if(b.lay.length<2) return;
  i=kbClamp(i, b.lay.length);
  if(!confirm(t('kb.lay.rm.q'))) return;
  b.lay.splice(i, 1);
  for(j=0;j<b.lay.length;j++)
    for(r=0;r<b.lay[j].rows.length;r++)
      for(k=0;k<b.lay[j].rows[r].length;k++){
        key=b.lay[j].rows[r][k];
        if(key.k!=='lay') continue;
        n=parseInt(key.v, 10)||0;
        key.v=(n===i)? '0' : String(n>i? n-1 : n);
      }
  kbLay=kbClamp(kbLay>=b.lay.length? b.lay.length-1 : kbLay, b.lay.length);
  kbSel=null;
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
  /* The free QWERTY has no editor, so it has no key sheet either. Its keys
     are drawn as plain spans and nothing on the screen opens this -- but a
     route can be come back to, and `form:kbkey:0:0` is a route. */
  if(kbIsFree(kbShow)) return;
  /* A width is waiting to be placed, so this press is where it goes. */
  if(kbNew1){ kbAddKey(ri, ki, kbNew1); return; }
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
  out=(key.k==='lt'? kbEditHTML(ri, ki, key) : kbEditFnHTML(key))+
    /* And the alphabet, HERE, when there is one slot to fill. Choosing which
       letter goes on a key is what somebody is doing nearly every time they
       open this, and it was three screens down: press the key, press the
       middle square, then the letters. On a board that flicks the five slots
       have to be chosen between first, so there it stays where it was.
       「キーボード設定まじでやりにくい」 */
    ((key.k==='lt' && !kbSlotsShown(key))
      ? '<div class="kbltin">'+kbLtGrid(ri, ki, -1)+'</div>' : '')+
    '<div class="sec">'+t('kb.what')+'</div>'+
    '<div class="segs">'+
      '<button class="seg'+(key.k==='lt'?' on':'')+'"' + DO('kbSetKind', [ri, ki, "lt"]) + '>'+t('toc.letters')+'</button>'+
      '<button class="seg'+(key.k==='sp'?' on':'')+'"' + DO('kbSetKind', [ri, ki, "sp"]) + '>'+t('kb.sp')+'</button>'+
      '<button class="seg'+(key.k==='del'?' on':'')+'"' + DO('kbSetKind', [ri, ki, "del"]) + '>'+t('kb.del')+'</button>'+
      '<button class="seg'+(key.k==='ret'?' on':'')+'"' + DO('kbSetKind', [ri, ki, "ret"]) + '>'+t('kb.ret')+'</button>'+
      '<button class="seg'+(key.k==='lay'?' on':'')+'"' + DO('kbSetKind', [ri, ki, "lay"]) + '>'+t('kb.lay')+'</button>'+
    '</div>';
  if(key.k==='lay')
    out+='<div class="segs" style="margin-top:8px">'+kbOf().lay.map(function(x, i){
      return '<button class="seg'+((parseInt(key.v,10)||0)===i?' on':'')+'"' +
        DO('kbSetLay', [ri, ki, i]) + '>'+esc(kbLayName(i))+'</button>';
    }).join('')+'</div>';
  out+='<div class="sec">'+t('kb.w')+'</div><div class="segs">'+
    [1,2,3,4].map(function(w){
      return '<button class="seg'+((key.w||1)===w?' on':'')+'"' +
        DO('kbSetW', [ri, ki, w]) + '>'+w+'</button>';
    }).join('')+'</div>'+
    /* The ◀ and ▶ that used to be here are gone: a key is moved by holding it
       on the keyboard itself. 「長押しで編集とかスマホの編集にしてくれよ」 What
       is left is the thing a sheet is for -- what this key IS -- and the one
       thing a hold cannot do, which is make a key that is not there yet. */
    '<button class="set" style="margin-top:12px;border-bottom:none"' + DO('kbDelKey', [ri, ki]) + '>'+
      '<span class="sl bad">'+t('kb.key.del')+'</span></button>';
  return out;
}
/* One slot -- the key itself or one of its corners -- and the letter in it.
   Pressing it opens the alphabet to choose from, which is why both are the
   same row: they hold the same kind of thing. */
/* THE KEY, drawn the size of a hand, with its five slots where they actually
   are on it. 「だからキーボードをカスタマイズする画面がゴミだって言ってんだろ」

   It was a form: a row saying "Press", then four rows saying Up, Right, Down,
   Left, each with the word "none" beside it. Five lines of text about a
   square with five places on it -- so the one thing a person has to hold in
   their head, WHERE each letter is, was the one thing the screen would not
   show them. The words Up and Right are not needed once the up slot is up.

   The middle is what the key types; the four edges are what it gives when a
   finger slides off it. Which is exactly how the key is drawn on the
   keyboard itself, one screen back -- kbFlicks() puts the four at the
   middles of the edges, and this is that, big enough to press. */
function kbSlotFace(lid){
  var l=lid? ltById(lid) : null;
  return l? ltInk(l, '<span class="kbl">'+esc(ltName(l)||'·')+'</span>')
          : '<span class="kbsx">'+ICON_ADD+'</span>';
}
function kbSlotBtn(cls, lid, ri, ki, dir, label){
  return '<button class="kbe '+cls+(lid && ltById(lid)? '' : ' non')+'"' +
    DO('kbSlot', [ri, ki, dir]) +
    ' aria-label="'+esc(label)+'">'+kbSlotFace(lid)+'</button>';
}
function kbEditHTML(ri, ki, key){
  /* A keyboard with no flick anywhere gets one square. Four empty squares
     around every key of a QWERTY is the editor telling somebody they have
     built something they have not. A key that ALREADY holds a flick keeps
     its four whatever the rest of the board does -- it has one, so it is
     one. 「qwartyで追加してるのに行追加後にフリックになるのなに？」 */
  var four=kbSlotsShown(key);
  if(!four)
    return '<div class="kbedit fn">'+
      kbSlotBtn('kbec', key.v, ri, ki, -1, t('kb.on'))+'</div>';
  return '<div class="kbedit">'+
    kbSlotBtn('kbeu', key.f[0], ri, ki, 0, t('kb.dir.up'))+
    kbSlotBtn('kbel', key.f[3], ri, ki, 3, t('kb.dir.left'))+
    kbSlotBtn('kbec', key.v,    ri, ki, -1, t('kb.on'))+
    kbSlotBtn('kber', key.f[1], ri, ki, 1, t('kb.dir.right'))+
    kbSlotBtn('kbed', key.f[2], ri, ki, 2, t('kb.dir.down'))+
    '</div>';
}
/* A key that is not a letter has nothing to choose and nothing to flick, so
   it is drawn once, in the middle, wearing what it will wear on the
   keyboard. */
function kbEditFnHTML(key){
  return '<div class="kbedit fn"><span class="kbe kbec">'+kbFace(key)+'</span></div>';
}
/* ---- putting a key where you want it ----------------------------------
   A width, chosen, and then the place it goes. It was: add a key (one, at the
   end, one wide), then open it, then choose a width in a row of numbers --
   three screens for one tile. 「1×1,1×2,1×3とかでいいんちゃう」

   `kbNew1` is the width waiting to be placed, or 0. It is where you are
   standing rather than anything the language has, so viewReset() drops it.
   While it is set, pressing a key puts the new one after that key rather than
   opening it -- one mode, one press to leave it. */
var kbNew1=0;
function kbSetNew(w){ kbNew1=(kbNew1===w)? 0 : w; render(); }
function kbNewHTML(){
  return '<div class="kbnew">'+[1,2,3].map(function(w){
    return '<button class="kbnewt'+(kbNew1===w? ' on':'')+'"' + DO('kbSetNew', [w]) +
      ' aria-label="'+esc(t('kb.w'))+' '+w+'"><span class="kbnewb" style="flex:'+w+'"></span>'+
      '</button>';
  }).join('')+'</div>';
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
/* Whether this key is drawn with its four corners, which is the question of
   whether there is one slot to fill or five. Said once because two screens
   ask it now -- kbEditHTML draws them and kbKeyHTML decides whether it can
   put the alphabet underneath. */
function kbSlotsShown(key){
  return kbHasFlick() || !!(key && key.f && (key.f[0]||key.f[1]||key.f[2]||key.f[3]));
}
/* The alphabet, as a grid, for one slot. `dir` is -1 for the key itself and
   0..3 for a corner -- the same numbering kbSlot() uses, because it is the
   same slot. */
function kbLtGrid(ri, ki, dir){
  var ls=ltOrder(ltOfKind('alpha'));
  return '<button class="btn ghost" style="width:100%;margin-bottom:10px"' +
      DO('kbPut', [ri, ki, dir, ""]) + '>'+t('kb.empty')+'</button>'+
    (ls.length
      ? '<div class="ltgrid">'+ls.map(function(l){
          return '<button class="ltc"' + DO('kbPut', [ri, ki, dir, l.id]) + ' aria-label="'+
            esc(ltName(l)||t('lt.reads.none'))+'">'+
            '<span class="ltcf">'+ltInk(l, '<span class="nol">'+ICON_PEN+'</span>')+'</span>'+
            '<span class="ltcn">'+esc(ltName(l)||t('lt.reads.none'))+'</span></button>';
        }).join('')+'</div>'
      : '<div class="note">'+t('lt.none')+'</div>');
}
function kbLtHTML(){
  var s=kbSlotFor;
  if(!s) return '<div class="note">'+t('form.gone')+'</div>';
  return kbLtGrid(s.r, s.k, s.d);
}
/* One letter into one slot, from either screen: the sheet that only holds the
   alphabet, and the key's own screen where it sits under the key. kbTake()
   was the first and read kbSlotFor to know where it was going; this is told,
   because the key's screen knows and has no reason to leave a note first. */
function kbPut(ri, ki, dir, lid){
  if(!kbEdit()) return;
  var key=kbAt(ri, ki);
  if(!key) return;
  if(dir<0) key.v=lid; else key.f[dir]=lid;
  saveKb();
  /* From the sheet, back to the key; from the key's own screen, stay on it. */
  if(kbSlotFor){ kbSlotFor=null; back(); kbPick(ri, ki); return; }
  kbPick(ri, ki);
}
function kbSetKind(ri, ki, kind){
  if(!kbEdit()) return;
  var key=kbAt(ri, ki); if(!key) return;
  key.k=kind;
  if(kind!=='lt') key.f=['','','',''];
  if(kind==='lay' && !/^[0-9]+$/.test(String(key.v))) key.v='0';
  if(kind==='del' || kind==='sp' || kind==='ret') key.v='';
  saveKb(); kbPick(ri, ki);
}
function kbSetLay(ri, ki, i){
  if(!kbEdit()) return;
  var key=kbAt(ri, ki); if(!key) return;
  key.v=String(i); saveKb(); kbPick(ri, ki);
}
function kbSetW(ri, ki, w){
  if(!kbEdit()) return;
  var key=kbAt(ri, ki); if(!key) return;
  key.w=w; saveKb(); kbPick(ri, ki);
}
function kbAddKey(ri, ki, w){
  if(!kbEdit()) return;
  var rows=kbLayer().rows, k;
  if(!rows[ri]) return;
  k=kbKey('lt', '');
  if(w>1) k.w=w;
  rows[ri].splice(ki+1, 0, k);
  kbNew1=0;
  saveKb();
  /* Placed from the keyboard, the key is opened so the letter can go on it --
     which is the next thing anybody does. Placed from the key's own sheet,
     that sheet is closed first. */
  if(here().r==='form') back();
  kbPick(ri, ki+1);
}
/* The row that is not there yet. Pressing it with a width chosen puts that
   key in a new row; pressing it with none adds the empty row it always did. */
function kbAddRowNew(){
  if(!kbEdit()) return;
  var w=kbNew1, k=kbKey('lt', '');
  if(w>1) k.w=w;
  kbLayer().rows.push([k]);
  kbNew1=0;
  saveKb(); render();
}
/* A row with nothing left in it is not a row. */
function kbDelKey(ri, ki){
  if(!kbEdit()) return;
  var rows=kbLayer().rows;
  if(!rows[ri]) return;
  rows[ri].splice(ki, 1);
  if(!rows[ri].length) rows.splice(ri, 1);
  if(!rows.length) rows.push([kbKey('lt', '')]);
  saveKb(); kbSel=null;
  /* From the ⊖ the keyboard is already on screen and the wobble stays on --
     somebody taking one key off is usually taking two. From the key's own
     sheet there is a sheet to close. */
  if(here().r==='form'){ back(); return; }
  render();
}
