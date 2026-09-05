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
var KB=null;
/* How many keyboards this person has BUILT, across every language they have.

   KB_MAX was a constant here and a per-language one: three in this language,
   three more in the next, nine on a plan that sells three. The ceiling is on
   the person -- 「1,1+3.無制限って言わなかったっけ？」, counted as a pool
   across languages -- so the count has to leave the open language, and
   kbCap() in core.js is the number it is compared against.

   The open one is read from memory and not from the disk: KB is what the
   editor is working on, and a keyboard made a moment ago may not have been
   written yet. Every other language is read through kbBoardsOf(), so one
   stored in the older single-keyboard shape counts as the one it is rather
   than as nothing. */
function kbCount(){
  var n=0, id, k;
  for(id in LANGS){
    if(!Object.prototype.hasOwnProperty.call(LANGS, id)) continue;
    /* And only this ACCOUNT's. 「じゃないとアカウント変えたら無限に言語作れる
       やん」 OWNER 2026-09-01 -- the same sentence langCount() answers in
       www/core.js, and this counter had the same hole: LANGS is the PHONE's,
       it survives signing out, so somebody else's languages on this phone
       filled up the pool of keyboards this person may build. langOwned() is
       the one place that says whose a language is -- and it is that rather
       than langAcct(), which also asks `mine`: a keyboard in a language this
       phone has never been told is 「mine」 is still a keyboard. */
    if(!langOwned(id)) continue;
    if(id===langId){ n+=kbStored().length; continue; }
    k=null;
    try{ k=kbBoardsOf(JSON.parse(slRd(langKeyOf(id, 'kb'))||'null')); }
    catch(e){}
    if(k && k.kbs) n+=k.kbs.length;
  }
  return n;
}
/* Whether there is room for another. The fixed QWERTY is the 1 in 1 + 3: it
   is one keyboard this person has, it is not stored, and it is not counted
   once per language -- so it is added here, once, to what they built. */
function kbRoomKb(){ return 1 + kbCount() < kbCap(); }
/* THE CEILING OF THIS CHAPTER, MET ON THE PRESS, and it is one place.
   「＋は右下につけて／プラスは5個目以降／無料は1個目以降／ポップが出るように」
   OWNER 2026-09-04.

   It was two questions asked a screen apart. kbNew() asked the DOOR --
   upStop(can('kb')) -- and kbAdd() asked the NUMBER, so Plus at four
   keyboards opened the five patterns, let somebody choose one, and refused
   after the choice: a chooser for a thing that could not be made. Nothing
   threw and nothing was written, which is why it stood.

   Both are here now and both are met at the press. Free stops on the door,
   which is the same pop every other + in this app gives 「音もキーボードも
   単語も+を押したらそのまま課金のポップが出るだけでしょ？増やすを潰す」 OWNER
   2026-09-01. Plus stops on the number, and the number is kbCap() rather than
   one written down here. Pro's ceiling is Infinity, so neither can fire.

   AND NOTHING IS HIDDEN FOR EITHER OF THEM 「課金からフリーの隠すルールも
   全部に適応ささてね」 OWNER 2026-09-04. What a plan cannot do is not drawn as
   an empty frame or a grey row -- it is said on the press. The + is on the
   list on every plan and looks the same on all of them; the only difference
   is what happens after it is pressed.

   popAsk() draws where the finger is and nothing behind it closes or moves,
   which is the shape 「全部1枚目みたいにポップ出して背景変えずに」 asks for. */
function kbCapStop(){
  if(upStop(can('kb'))) return true;
  if(kbRoomKb()) return false;
  popAsk(t('kb.full', kbCap()), function(){ go('plans'); });
  return true;
}
function kbRead(){
  KB=null;
  try{ KB=kbBoardsOf(JSON.parse(slRd(langKey('kb'))||'null')); }
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
/* NO KEYBOARD AND A BROKEN KEYBOARD ARE DIFFERENT STATES, and this line put
   them in the same one. `JSON.stringify(null)` is the four characters `null`,
   which parse to something that is not an object -- so bkSound() read the
   language as wreckage, bkOK() said no, and bkPush() refused to write its
   backup FILE. Not once: from the first time somebody left that language,
   for good. Everything they made afterwards was in no backup.

   Every free language is that language. Free reads kbFixed(), a QWERTY built
   out of LETTERS on the way to the screen and stored nowhere, so on the free
   plan there is no other state this can be -- and saveKb() runs from
   langSaveAll() every time a language is left, deleted, or swapped.
   「無料の分も全部入らないとダメでしょ」 OWNER 2026-09-04.

   So no keyboard is written as ABSENT rather than as the word null.
   docs/DATA_SAFETY.md already had the sentence: *a slice the app has never
   written is absent, and absent is what a restore is for* -- bkPack() skips
   what is not there, so the file is written; netLangSync1() reads it as ''
   and takes the server's copy down rather than pushing a null up. It reads
   back the same either way: kbRead() turns a missing key and a stored `null`
   into the same empty KB, which is what kbResetGo() means by clearing one.

   Fixed HERE and not in bkSound(). That function is right to refuse a null
   where an object belongs -- one line guards script, kb, wld and gram2
   together -- and loosening it to let this through would let real wreckage
   through for all four. What was wrong was what this wrote. */
function saveKb(){
  if(langLocked()) return;
  kbVFix(); kbWayOff(); kbNoted(); bkTouch();
  if(!KB) slRm(langKey('kb'));
  else slWr(langKey('kb'), JSON.stringify(KB));
  kbKeepLay();
}
/* The layout, said once as a string. Three things ask whether it has moved --
   the step-back, the buffer the editor opened with, and the write below. */
function kbLaySig(b){ return JSON.stringify(b.lay); }
/* AND THE BAR IS TOLD. 「保存する箇所が出たなら金色になって」 OWNER
   2026-09-05. The editor registers its buffer with the layout it arrived with
   (kbKeepOn), so writing the layout here is what makes the Save in the corner
   gold -- one road, www/shell.js § KEEP, and no dirty flag of this chapter's
   own.

   THE KEY IS THE BOARD'S PAGE, AND IT IS THE SAME STRING keepKey() ANSWERS
   WITH while that page is the screen. It has to be the board rather than the
   screen, because saveKb() runs from langSaveAll(), from the slice writer in
   core.js and from the key's own sheet, where the screen in front of somebody
   is not this one -- and a change made on the sheet has to reach the buffer
   the page behind it will read.

   That leaves ONE thing to hold, and it is the whole of rule 20's fault:
   which board is on the screen is written in the route, and `kbShow` is the
   same fact read back. Deleting a keyboard slid `kbShow` and left the route
   naming the one it had, so from then on this wrote `kb|1` while the bar read
   `kb|2` -- a row really came out of the layout and the Save stayed grey, and
   the arrow asked nothing on the way out. Both deletes land on the board they
   end on now (kbDropGo, kbDelSel), so the two cannot come apart. `keep-check`
   holds it.

   Board 0 is asked and answered here rather than at the call: it is the free
   QWERTY, built from LETTERS and stored nowhere, so kbEdit() answers null and
   there is no layout to write down. */
function kbKeepLay(){
  var b=kbEdit();
  if(!b) return;
  keepPut(keepKeyOf('kb', kbShow), 'lay', kbLaySig(b));
}

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
/* How many keys to a row, so that what comes out is the shape of a keyboard.

   Measured on a 390pt phone: every keyboard on a phone is FOUR rows of keys
   and about a third of the screen -- iOS's QWERTY (ten across), its kana
   (five), its ten-key (four) -- and a key is between 0.72:1 and 1.81:1. Our
   own patterns came out at 3 x 3 and 5 x 7: a flick key 130pt wide and 54
   tall, and a tap board taking HALF the screen.
   「qwartyとフリックだとサイズ違うでしょ？そういうのはどうなんの？」
   「フリックだけじゃなくて全部。」 OWNER, 2026-08-26.

   Both ends matter and they pull against each other. FOUR ROWS is the ceiling
   on how tall, so the letters want as many to a row as it takes. FOUR ACROSS
   is the floor on how wide, because a key is width/per wide and one row tall
   -- at three across that is 2.41:1, a letterbox nothing on a phone looks
   like. Ten is the other end and rule 19 already fixes it: the narrowest
   iPhone. */
/* A KEY IS BIG BY SPANNING COLUMNS, so how many to a row has to be a number
   that divides the ten evenly -- otherwise a key lands between two columns
   and the letters across the top stop naming anything.
   「行と列はエクセルのように数字振ったんだから」

   Counted in half columns, that is 20/per being whole: 1, 2, 4, 5, 10. Four
   is a kana keyboard's three letters and a function column, five is a chart,
   ten is a QWERTY -- so the set is not a compromise, it is the three shapes a
   phone keyboard comes in with two ends on it.

   As FEW as will hold the letters in four rows, so the keys come out as big
   as they can: four rows is the ceiling on how tall a keyboard is. */
var KB_PERS=[1, 2, 4, 5, 10];
function kbPer(n){
  var i, want=Math.ceil(n/4);
  for(i=0;i<KB_PERS.length;i++) if(KB_PERS[i]>=want) return KB_PERS[i];
  return 10;
}
/* And what one of them is worth. w is in KEYS, kbU() turns it into the half
   columns the sheet is drawn in, so this is the one place that divides. */
function kbW(per){ return (KB_COLS/per)/2; }
/* A row padded out to the full ten with gaps at both ends -- kbAlign's centre,
   done at the moment a pattern is built. A row that comes to ten is a row the
   phone draws exactly as the sheet does, because the extension divides a row
   by its OWN total and a gap is a key that travels. Without it a short row is
   drawn narrow here and stretched there. */
function kbFillRow(row){
  var tot=kbUsed(row), rem=KB_COLS-tot, lead;
  if(rem<=0) return row;
  lead=kbLead(KB_COLS, tot);
  if(rem-lead>0) row.push(kbGap(kbGapW(rem-lead)));
  if(lead>0) row.unshift(kbGap(kbGapW(lead)));
  return row;
}
/* The bottom bar: the space takes whatever the row has left, which is what
   every phone does with it, so the row comes to ten without a gap in it. */
/* Putting the way-across on a bar that is already ten wide: the space pays
   for it, which is where every phone takes it from. */
function kbBarLay(row, to){
  var i;
  for(i=0;i<row.length;i++) if(row[i].k==='sp' && row[i].w>1){ row[i].w-=1; break; }
  row.unshift(kbKey('lay', to));
  return row;
}
function kbBar(del){
  var sp=kbKey('sp'), d=kbKey('del');
  d.w=del||2;
  sp.w=(KB_COLS/2)-d.w;
  return [sp, d];
}
/* ---- a pattern that does not fit is more FACES, never fewer letters -----
   「パターンから作った盤に、段の上限が効いていない」 LEADER, 2026-08-27.

   kbRowsMax() was asked in two places -- kbRoomRow() and kbIns() -- which is
   the road somebody adds a row by BY HAND. Nothing asked it of the
   patterns, and a pattern is built out of however many letters the language
   has: 105 letters came out seven rows on a flick and twelve on an ABC, 300
   came out twenty and thirty-one. Nothing throws. The board is drawn, saved,
   handed over, and the extension SQUEEZES it into 0.5 of the screen -- every
   row shorter. Which is the failure rule 19 was rewritten around on 2026-08-26
   「八行入っても小さかったら打ちにくいだけだぞ？」, arriving by another road.

   It misses the free plan (38 letters) and lands on exactly the paid one: a
   syllabary, an abugida, a logography -- the languages the paid plan is for.

   Two of the three ways out are already forbidden and it was not a choice:
   CUTTING at the ceiling drops letters somebody made (docs/DATA_SAFETY.md),
   and REFUSING is a sentence explaining itself on a screen. What is left is
   to keep every letter and give it another face -- which is the machinery of
   2026-08-26 already: a page arrives with the way there and the way back, and
   no face is a dead end.

   How many rows of letters one face holds: the ceiling, less the bar it ends
   in. A face with no bar has no space and no delete on it. */
function kbFaceRows(){ return Math.max(1, kbRowsMax()-1); }
/* Cut a list of rows into chunks that fit, as EVENLY as it divides -- filling
   the first faces and leaving the last one with a single row would be the
   same keyboard and a worse-looking one. */
function kbChunk(rows, per){
  var n=Math.max(1, Math.ceil(rows.length/per)), each=Math.ceil(rows.length/n),
      out=[], i;
  for(i=0;i<rows.length;i+=each) out.push(rows.slice(i, i+each));
  return out;
}
/* The letters, in rows, with nothing else on them. `per` for the one pattern
   that says how many across it wants (ABC order is ten, like a QWERTY);
   everything else asks kbPer(). */
function kbLetterRows(list, per){
  var rows=[], row=[], i, k, w;
  per=per||kbPer(list.length); w=kbW(per);
  for(i=0;i<list.length;i++){
    k=kbKey('lt', list[i].id); k.w=w;
    row.push(k);
    if(row.length===per){ rows.push(row); row=[]; }
  }
  if(row.length) rows.push(kbFillRow(row));
  return rows;
}
/* And those rows as faces, each ending in its own bar. Every face can be
   typed on: a face with letters and no space bar is half a keyboard. */
function kbRowFaces(list, per){
  var parts=kbChunk(kbLetterRows(list, per), kbFaceRows()), out=[], i;
  for(i=0;i<parts.length;i++) out.push({rows:parts[i].concat([kbBar(2)])});
  return out;
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
  return xs.length? kbRowFaces(xs) : null;
}
/* The first keyboard, so there is something to type on before anybody has
   built anything: the letters in the order they are already in, and the
   digits and marks behind a switch. It is a starting point and it is meant
   to be pulled apart. Nothing is stored until it is. */
function kbDefault(){
  var lay=kbRowFaces(ltOrder(ltOfKind('alpha'))), more=kbSecond();
  /* The digits and the marks are their own group and split on their own, so
     they never share a face with the letters however many of either there
     are. The keys that go BETWEEN faces are not put on here any more:
     kbPatLay() links every face of every pattern in one place, because with
     the letters alone able to become five faces there is no longer a "first"
     and a "second" to wire to each other. */
  if(more) lay=lay.concat(more);
  return {lay:lay};
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
/* Twelve keys, four directions on each. One key holds five letters, so a
   language of sixty is one face -- which is the whole argument for a flick
   keyboard and the reason Japanese phones have one. The letters go on in the
   order the alphabet is in: the fifth of every group is the key itself and
   the four around it are the flicks, so the groups read across. */
function kbFlickLay(){
  var ls=ltOrder(ltOfKind('alpha')), keys=[], rows=[], row, i, j, k, n;
  for(i=0;i<ls.length;i+=5){
    k=kbKey('lt', ls[i].id);
    for(j=1;j<5;j++) if(ls[i+j]) k.f[j-1]=ls[i+j].id;
    keys.push(k);
  }
  /* THREE letters across and a column of its own for the three keys that are
     not letters -- four across, which is what a phone's ten-key is and what a
     kana keyboard is once its two outer columns are counted. It was three
     across with the space and the delete on a row of their own, which made a
     key 130pt wide and 54 tall on a 390pt phone: 2.41:1, a letterbox.

     A row of its own costs a whole row on a board this short, and a keyboard
     with no return is one nobody can send a message on -- kbFixed() learnt
     that. A column costs a quarter of the width and holds all three.
     「！？スペース　改行」

     Never fewer than three rows, because those three keys are three and each
     wants a cell of its own. */
  /* As many rows as the letters need, cut into faces that fit -- and the
     three that are not letters come round again ON EVERY FACE, because they
     live in the fourth column rather than on a bar of their own. A face after
     the first with nothing but gaps down that column would be letters with no
     space, no delete and no return. */
  var fr=kbFaceRows();
  n=Math.max(3, Math.ceil(keys.length/3));
  if(n>fr) n=Math.ceil(keys.length/3)>fr? Math.ceil(keys.length/3) : n;
  /* Four across, so a key is FIVE columns of the ten -- 97pt on a 390pt
     phone against a QWERTY's 39. That is the whole of why a flick key is big:
     not a bigger grid, a key that spans more of it. And four times five is
     exactly ten, so the row is full and nothing can be added to it that would
     make these smaller. */
  var fw=kbW(4);
  for(i=0;i<n;i++){
    row=[];
    for(j=0;j<3;j++){ k=keys[i*3+j] || kbKey('lt', ''); k.w=fw; row.push(k); }
    var at=i%fr;
    k=(at===0? kbKey('del') : at===1? kbKey('sp') : at===2? kbKey('ret') : kbGap(fw));
    k.w=fw;
    row.push(k);
    rows.push(row);
  }
  var parts=kbChunk(rows, fr), out=[], q;
  for(q=0;q<parts.length;q++) out.push({rows:parts[q]});
  return out;
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
  var cs=wsCons(), vs=wsVows(), rows=[], row, i, j, l;
  if(!cs.length || !vs.length) return kbTapLay();
  /* The chart's columns are the language's -- a column per vowel and one for
     the three that are not letters -- so this is the one pattern whose count
     is not ours to pick from KB_PERS. Each key takes as many whole columns as
     fit, and kbFillRow() puts the remainder at the ends, exactly as the free
     QWERTY's nine-letter row is inset by half a key at each end. */
  var cw=Math.max(1, Math.floor(KB_COLS/(vs.length+1)))/2, kk, fr=kbFaceRows();
  for(i=0;i<cs.length;i++){
    row=[];
    for(j=0;j<vs.length;j++){
      l=ltMain(wsKey([cs[i], vs[j]]));
      kk=kbKey('lt', l? l.id : ''); kk.w=cw;
      row.push(kk);
    }
    /* The three that are not letters, in a column, for kbFlickLay()'s reason
       -- a row of its own is a whole row, and this is the one pattern whose
       row count is the LANGUAGE's rather than ours: a row per consonant. Six
       consonants and five vowels came to 5 x 7 and half the screen; the same
       chart with the column is 6 x 6. The grid itself is untouched, because
       what a chart is is what the language has. */
    /* per FACE, for kbFlickLay()'s reason: a chart of twenty consonants is
       more faces than one, and every one of them needs its own three. */
    var at=i%fr;
    kk=(at===0? kbKey('del') : at===1? kbKey('sp') : at===2? kbKey('ret') : kbGap(cw));
    kk.w=cw;
    row.push(kk);
    rows.push(kbFillRow(row));
  }
  var parts=kbChunk(rows, fr), out=[], q;
  for(q=0;q<parts.length;q++) out.push({rows:parts[q]});
  return out;
}
function kbTapLay(){ return kbDefault().lay; }
/* Ten to a row, and as many faces as that takes. Ten because ABC order is
   the QWERTY's shape with the letters in order; the chunking is what stops it
   being thirty-one rows deep on a language of three hundred letters. */
function kbAbcLay(){ return kbRowFaces(ltOrder(ltOfKind('alpha')), 10); }
/* The free plan's layout, editable. kbFixed() is where it is written down and
   this asks it rather than saying it again -- so the QWERTY somebody starts
   from is the same QWERTY they were typing on, key for key. */
function kbQwertyLay(){ return kbFixed().lay; }
/* Where a key to another face can go on this one, and putting it there.

   A GAP first: a gap is space somebody has not used, and on a flick or a
   chart the fourth column is gaps from the fourth row down -- so the key
   lands in the column the three that are not letters already live in.
   Then the SPACE BAR, which gives up a key's width, which is where every
   phone takes its 123 from. Then a row of its own, which is the last resort
   and the only one that can push a face past the ceiling -- kbFaceRows()
   leaves room for a bar so that it never comes to that, and kb-check counts
   the rows afterwards rather than trusting this sentence. */
function kbFacePut(face, to){
  var rows=face.rows, i, j, k;
  for(i=0;i<rows.length;i++)
    for(j=0;j<rows[i].length;j++)
      /* A WHOLE KEY of gap, and not the half key the QWERTY is inset by.
         A gap of 0.5 is not a slot somebody left empty, it is the third row's
         inset -- and a layer key half a key wide is 14pt on a 390pt phone,
         which is not a thing anybody can press. */
      if(rows[i][j].k==='gap' && rows[i][j].w>=1){
        k=kbKey('lay', String(to)); k.w=rows[i][j].w;
        rows[i][j]=k;
        return true;
      }
  for(i=rows.length-1;i>=0;i--)
    for(j=0;j<rows[i].length;j++)
      if(rows[i][j].k==='sp' && rows[i][j].w>1){ kbBarLay(rows[i], String(to)); return true; }
  /* and a row of its own, which is the last resort and the only one that can
     push a face past the ceiling -- kbFaceRows() leaves a bar's worth of room
     so that it never comes to that, and kb-check counts the rows afterwards
     rather than trusting this sentence. */
  if(!rows.length){ rows.push([kbKey('lay', String(to))]); return true; }
  if(kbUsed(rows[rows.length-1])+2<=KB_COLS){
    rows[rows.length-1].unshift(kbKey('lay', String(to))); return true;
  }
  if(rows.length<kbRowsMax()){ rows.push([kbKey('lay', String(to))]); return true; }
  return false;
}
/* EVERY FACE IS REACHED AND EVERY FACE CAN BE LEFT, whatever a pattern came
   out as. One place, because a pattern is no longer one face and two: the
   letters alone become five of them on a language of three hundred, and
   kbDefault()'s old「first and second, wired to each other」cannot say that.

   The face before and the face after, wrapping -- so from any face you reach
   any other and come back the way you came. Two faces means one key each way,
   because the face before and the face after are the same face and two keys
   to one place is a key that does nothing. */
function kbLinkFaces(lay){
  var n=lay.length, i;
  if(n<2) return lay;
  for(i=0;i<n;i++){
    if(n===2){ kbFacePut(lay[i], 1-i); continue; }
    kbFacePut(lay[i], (i+1)%n);
    kbFacePut(lay[i], (i+n-1)%n);
  }
  return lay;
}
function kbPatLay(pat){
  if(pat==='qwerty') return kbLinkFaces(kbQwertyLay());
  if(pat==='flick')  return kbLinkFaces(kbFlickLay());
  if(pat==='chart')  return kbLinkFaces(kbChartLay());
  if(pat==='abc')    return kbLinkFaces(kbAbcLay());
  return kbLinkFaces(kbTapLay());
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
  /* Asked here as well as on the door. kbNew() is a door and a door is a
     look; the act that WRITES a keyboard has to refuse on its own, the way
     kbEdit() refuses board 0 for all thirty mutators rather than trusting the
     buttons to be down. Both the door and the ceiling are one function
     (kbCapStop above), so the two roads cannot come to answer differently. */
  if(kbCapStop()) return;
  /* Storage holds only the ones the person built. The free QWERTY is board 0
     and is not among them, so the first one made here is the SECOND board. */
  if(!KB) KB={kbs:[], at:0};
  KB.kbs.push({nm:'', pat:pat, lay:kbBlank(kbPatLay(pat))});
  kbShow=kbBoards().length-1; kbLay=0; kbSel=null;
  kbForget();
  saveKb();
  /* And onto it. This is pressed on the sheet that offers the five patterns,
     so render() alone redrew the sheet -- somebody chose a keyboard and was
     left looking at the chooser. 「追加した時に画面動かないまま追加される
     のやめてくれ」 The board is NAMED, because the chapter's own page is the
     chooser as well. */
  kbGo(kbShow);
}
/* The keyboard chapter, from wherever this was pressed. go() lands on a
   screen already behind you by cutting the trail back to it, so pressing
   Apply from a sheet does not push a second copy of the chapter.

   And ONTO A BOARD when one is named, because the chapter's own page is the
   LIST. Cutting back to the chapter was only half of "onto it": the route
   carries which keyboard you are on, and this put nothing there, so a
   keyboard made from the sheet of patterns landed on the chooser it was
   chosen from -- 「追加した時に画面動かないまま追加されるのやめてくれ」 is
   what that was written to answer and is not what it got. Changing an
   existing keyboard's pattern landed there too, one screen away from the
   keyboard it had just changed.

   That is also what took the ⋯ off the screen. kbMoreQ() is drawn on a
   BOARD's page and the list carries helpQ() instead, so the road that
   changes a keyboard's arrangement -- ⋯ then kbRepat() then kbSetPat() --
   had no first step from the one screen somebody arrives on after making a
   keyboard. Nothing was wrong with any of the three: kbSetPat('flick')
   turned 1x10 into 2.5x4 and sent the 2.5 to the phone the whole time. It
   was the way there that was missing.

   The board goes on TOP of the chapter, so the back arrow still walks to the
   list rather than out of the chapter altogether. Pressed with nothing named
   -- which is what deleting a keyboard does -- it is the list, because the
   board it was pressed on is gone. */
function kbGo(i){
  var to = (i===undefined || i===null)? undefined
         : String(kbClamp(i, Math.max(1, kbBoards().length)));
  var h = here();
  /* Already the screen being asked for. go() returns without drawing in that
     case, which is right for a press that is going somewhere and wrong for
     one that has just changed what is on the screen. */
  if(h.r==='kb' && h.a===to){ render(); return; }
  if(h.r!=='kb') go('kb');
  if(to!==undefined) go('kb', to);
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
  /* One place says what landing on a board's page is. This said it a second
     time, which is how the other two roads onto a board came to say
     something else. */
  kbGo(kbShow);
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
  /* 確認は自前のポップで。「標準は使わねえって言ってるだろこれも禁止や」
     OWNER 2026-09-01 -- confirm() は使わない。はいの側がこの下。 */
  popAsk(t('kb.rm.q'), function(){ kbDropGo(i); }, t('pop.yes'));
}
function kbDropGo(i){
  var b=kbBoards();
  if(!b.length) return;
  KB.kbs.splice(i-1, 1);
  b=kbBoards();
  KB.at=kbClamp(KB.at>i? KB.at-1 : KB.at, b.length);
  kbShow=kbClamp(kbShow>=b.length? b.length-1 : kbShow, b.length);
  kbLay=0; kbSel=null;
  kbForget();
  saveKb();
  /* Deleting is pressed on the ⋯ sheet, so the same thing was true of it:
     the keyboard was gone and the screen was still the sheet about it.
     ONTO THE BOARD IT ENDS ON, and that is the whole of rule 20's fault: the
     boards below the deleted one slide down, so `kbShow` moved and the route
     went on naming the one it had. Which board is on the screen is one thing
     and the route is where it is written -- a second answer to it is what
     put the layout in one buffer and the Save in the bar on another
     (www/keyboard.js § kbKeepLay). */
  kbGo(kbShow);
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
/* Renaming one, and it is TYPED before it is written. Board 0 is the free
   QWERTY, is not in storage and has nothing to write a name on -- kbEdit()
   says so and this obeys it.

   OWNER DECISION 2026-09-03 -- www/shell.js § KEEP. It used to call saveKb()
   on every keystroke, and saveKb() is what every change to a keyboard ends in:
   it fixes the layout, pushes the board to the system keyboard, touches the
   backup and takes a reading for the step-back. None of that is a name being
   typed. The step-back itself was never wrong here -- kbNoted() compares
   JSON.stringify(b.lay) and a name is not in the layout, so no keystroke ever
   stacked a step -- and now the save happens once, so one save is one write.

   `kbKeepOn()` is what registers the buffer, and it is called from the editor
   face in vKb() rather than from here: a name is typed on a screen, and the
   screen is what knows which board is in front of somebody. */
function kbKeepOn(){
  var b=kbEdit();
  /* Not in somebody else's language: saveKb() refuses one (langLocked, in
     www/core.js), so a buffer here would put a Save in the bar that could not
     write. */
  if(!b || langLocked()) return;
  /* The name AND the layout. What the screen opened with is what changed is
     measured against, so a keyboard arrived at and left alone shows a grey
     Save and asks nothing on the way out. */
  keepOn(keepKey(), {nm:String(b.nm||''), lay:kbLaySig(b)}, kbKeepSave);
}
/* `lay` is not written here and must not be: the layout is already on this
   phone by the time the button is gold -- every mutator on the sheet ends in
   saveKb(). What the press is FOR is the wire, and keepSave() is what puts it
   there (netSaveNow, which cancels bkTouch()'s burst so one press is one
   send). Writing it again here would be a second answer to where a layout is
   written down. */
function kbKeepSave(v, done){
  var b=kbEdit();
  if(b && v.hasOwnProperty('nm')){ b.nm=String(v.nm).slice(0, 24); saveKb(); }
  done(true);
}
function kbSetNm(v){ keepSet('nm', String(v||'').slice(0, 24)); }
function kbNameHTML(i){
  if(kbIsFree(i)) return '';
  return '<input class="lnin kbnm" value="'+esc(keepVal(keepKey(), 'nm'))+'" '+
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
      /* THE KEY GOES DOWN WHETHER OR NOT THE LETTER IS FOUND. A row used to
         push only the letters kbNamed() answered for, so a language missing
         one by name came out a key short -- and one missing all of them came
         out with no letter rows at all. The screen was then a digit row and a
         space bar, which is the free plan's keyboard GONE: 「無料のキーボード
         はqwartyに書いた文字が置き換わるだけなのにキーボード自体消えてる」
         OWNER 2026-09-01, build #106.

         Free is a QWERTY with the drawn letters substituted IN, so the QWERTY
         is the fixed part and a letter is what gets substituted -- a letter
         that is not there yet may leave its key wearing the roman character,
         and may not take the key away with it. kbRom() is that key and this
         is not a new idea here: the digit row above has fallen back to it
         from the day it was written, for exactly this reason.

         It also keeps the ROW's arithmetic true. Ten, ten, nine and seven is
         what the inset half keys, the three-wide delete and 「キーボードずれ
         た。文字サイズとか小さくしていいからずらさないで」 are all counted
         against; a short row silently re-runs that sum on a different number
         and the columns stop lining up.

         ltStart() is still what puts the letters there, and nothing here is a
         second way to make one -- a fallback key is not a letter and is not
         written to LETTERS. This is the keyboard refusing to vanish while it
         waits. */
      id=kbNamed(r.charAt(j));
      row.push(id? kbFix(r.charAt(j), id) : kbRom(r.charAt(j)));
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
  /* The same, and the sum is the reason it matters here too: the bar is 1 + 1
     + 6 + 2, so a missing `!` makes it nine and the bar stops agreeing with
     the rows above it. */
  bot.push(end0? kbFix(KB_ENDS.charAt(0), end0) : kbRom(KB_ENDS.charAt(0)));
  bot.push(end1? kbFix(KB_ENDS.charAt(1), end1) : kbRom(KB_ENDS.charAt(1)));
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
   and coming back down to free changes nothing at all.

   AND THE FREE PLAN HAS IT TOO, which is what makes this screen one screen.
   「キーボードの画面無料だと何で1個なの？一覧が並ばないの？無料も有料も同じ
   画面っちうルールは？」 OWNER 2026-09-03. It answered [] on free, so there
   were no rows to draw and the chapter had a keyboard where a list belongs --
   against 「無料でもplusでもproでも同じ画面なのよ」 OWNER 2026-09-01, which
   HELP.kb's own comment quotes.

   `kbStored()` is NOT concatenated on free, and that is not tidiness: it is
   what `kbOf()`'s own `!can('kb')` guard is for. Somebody who built three
   keyboards on Plus and let the plan lapse types on the free QWERTY again --
   「plusから無料に戻った時にキーボードなくなるやろ」 -- so listing those three
   here would put a board on the screen that the phone is not typing on, one
   press from an editor this plan does not have. They are still in storage and
   nothing is deleted; they come back with the plan. */
function kbBoards(){
  if(!can('kb')) return [kbFree()];
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
   A letter shows the letter -- drawn, borrowed, or its name -- through the
   same ltInk() the alphabet and the tiles use, so a key cannot look like one
   thing here and another there. The keys that are not letters show a mark.

   With ONE difference, and it is asked for by name: everything drawn on a key
   asks for `midink`, which stands the shape in the middle of its square
   instead of where it sits in the lattice.
   「キーボードに配置するときは中央に文字くるようにしてね？」 A key is a square
   hit with a thumb; where a letter sits in its own em is the font's business,
   and that is what the alphabet's tile goes on showing. The picker at the
   foot of the key sheet is the ALPHABET's tile and not a key, so it is not
   one of these. */
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
/* One letter out of a language that is NOT the open one.
   `src` is {lts: their letters, lay: their layout} and is how a keyboard gets
   drawn on somebody else's article. Everything below reaches for the open
   language otherwise -- ltById() and kbOf() both -- which is rule 8, and is
   why that picture used to be drawn for your own language only. */
function kbSrcLt(src, id){
  var a=(src && src.lts)? src.lts : [], i;
  for(i=0;i<a.length;i++) if(a[i] && a[i].id===id) return a[i];
  return null;
}
function kbFace(key, src){
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
  if(key.k==='lay') return kbLayFace(parseInt(key.v, 10)||0, src);
  if(key.k==='rom') return '<span class="kbl">'+esc(key.v)+'</span>';
  var l=src? kbSrcLt(src, key.v) : ltById(key.v);
  if(!l) return '<span class="kbl">·</span>';
  /* midink: on a key the shape stands in the middle of the square rather
     than where it was drawn in the lattice. A key is a square somebody hits
     with a thumb, not a place in a line of writing -- where a letter sits in
     its own em is the FONT's business, and that is what the tile in the
     alphabet goes on showing. 「キーボードに配置するときは中央に文字くるように
     してね？」 */
  return ltInk(l, '<span class="kbl">'+esc(ltName(l)||'·')+'</span>', 'midink');
}
function kbLayName(i){ return String(i+1); }
/* A layer-switch key wears the FIRST LETTER of the layer it goes to, the way
   a phone's 123 key wears a 1 and its ABC key wears an A. Which means the key
   is in the language: press the one showing your 1 and the digits come up.

   No string is invented to do it, which is the other half of why: a name for
   a face would be a name in ten languages for something the person made and
   already named. The number is the fallback, for a layer somebody built with
   no letter on it at all. */
function kbLayLetter(i, src){
  var b=(src && src.lay)? {lay:src.lay} : kbOf(), lay=b.lay[i], ri, ki, k;
  if(!lay) return null;
  for(ri=0;ri<lay.rows.length;ri++)
    for(ki=0;ki<lay.rows[ri].length;ki++){
      k=lay.rows[ri][ki];
      if(k.k==='lt' && k.v){
        var lt=src? kbSrcLt(src, k.v) : ltById(k.v);
        if(lt) return lt;
      }
    }
  return null;
}
function kbLayFace(i, src){
  var l=kbLayLetter(i, src);
  return l? ltInk(l, '<span class="kbl">'+esc(ltName(l)||kbLayName(i))+'</span>', 'midink')
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
    if(l) out+='<span class="kbf kbf'+KB_DIRS[i]+'">'+ltInk(l, esc(ltName(l)||'·'), 'midink')+'</span>';
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
/* ---- how big a keyboard is allowed to get ------------------------------
   「キーボード縦横って最大を決めてそれ以上は列も行も追加できないようにしよう」

   TEN ACROSS is the phone's number rather than a taste. The narrowest iPhone
   is 320 across, so ten keys are 32 each, which is what every phone keyboard
   on earth is; eleven would be 29. Every pattern this app builds already
   comes to ten or fewer, and the free QWERTY is exactly ten -- so this
   forbids nothing that exists.

   HOW MANY DOWN is the phone's number too, and it is not a number written
   here. 「キーボードの高さ制限を決めたやん。キーの高さじゃなくてキーボード
   そのもの。だから行の列はそのキーボードの制限の範囲内で追加できるって話
   だけど？」 OWNER, 2026-08-26.

   It was `8`, and eight was invented here: the comment said "nothing on the
   phone sets it" and that was wrong when it was written. The extension has
   capped the whole keyboard's height since the day it stopped taking a
   multiplier -- 「高さやめて、フリックなら日本語のサイズ、qwartyなら無料版の
   サイズくらいまでにしないとキツくない？」 -- and past the cap it SQUEEZES the
   rows rather than growing. So a ninth row was never a ninth row; it was
   every row getting shorter.

   Two places deciding how tall a keyboard may be, and only one of them
   enforcing it. The number of rows is the consequence, so it is divided out
   of the cap rather than said again:

     KB_MOST  the most of the screen a keyboard may take        0.5
     KB_ROWW  one row, as a share of the phone's short side   0.1385
     KB_BARS  the two edges, and the candidate bar above     8 + 44

   All three are ios/App/LinguaKeyboard/KeyboardViewController.swift's, and
   kb-check reads them OUT of that file and fails if these disagree -- the one
   thing that could go wrong here is the two sides drifting, and a comment
   naming the Swift file does not hold that. The bar is assumed to be there
   because it nearly always is (shareConv() answers for an alphabet too) and
   because assuming it is the stricter of the two answers.

   A ROW IS A KEY TALL. 「キーのサイズはiPhoneのサイズによって変わるんじゃない
   の？八行入っても小さかったら打ちにくいだけだぞ？」 OWNER DECISION 2026-08-26.
   The extension's row was a flat 54, so a key was the same height on every
   phone and the only thing a bigger phone bought was MORE ROWS -- backwards
   from what a bigger phone is for. Width always scaled, because ten keys
   divide whatever the phone is across; the height now follows it, so a key
   keeps its shape: 44pt on the narrowest iPhone, 54 on a 390, 61 on a Pro
   Max. 0.1385 is that same 54 at the 390 it was chosen on.

   Both ceilings are held on ADDING only. A layout that is already over -- a
   pattern built from a very large alphabet, a keyboard built on a bigger
   phone than the one in your hand, a keyboard made before this existed -- is
   left exactly as it is and simply cannot be added to. Nothing is ever cut
   down to fit: that would be the app deleting somebody's keys. */
var KB_COLS=20;                 /* columns are half keys -- kbU() below */
var KB_MOST=0.5, KB_ROWW=0.1385, KB_BARS=8+44;
/* A REFERENCE screen, and not the phone in your hand. That was the first
   version of this and it was wrong in the way the ceiling itself was wrong.
   「八行入っても小さかったら打ちにくいだけだぞ？」 OWNER, 2026-08-26.

   A keyboard belongs to a LANGUAGE, and a language moves between phones. So
   "as many rows as fit on this phone" builds eight rows on a Pro Max, where
   they fit at 54pt each, and hands them to an SE -- where place() squeezes
   the same eight into 39pt each, because it caps and squeezes rather than
   growing. Eight rows that fit is not the same as eight rows anybody can
   type on.

   It is the WIDTH rule one axis over, and rule 19 has always said the width
   this way: 「TEN ACROSS is the phone's number -- the narrowest iPhone is
   320」. Not the phone in your hand. The narrowest one.

   The reference is a 390 x 844 phone -- the one most people are holding, and
   the one the 0.1385 above was measured at, so this is the phone where the
   keyboard is exactly what it always was. Every other phone gets a key of its
   own size and, because the bars do not scale, within a row of the same
   answer: seven from the 13 mini up, six on an SE 2, five on an SE 1. The
   ceiling is one number rather than each of those, for the reason above.

   kb-check prints what every phone comes to, so a change to any of the three
   numbers shows its whole shape rather than one number moving. */
/* THE SMALLEST PHONE THE APP RUNS ON, and not the one most people hold.
   「キーボードの高さは画面の半分までってルールあるのになんで七も足したら7割
   埋まるけど」 OWNER 2026-08-27.

   It was 390 x 844, and that is the error. Referenced to a big phone, seven
   rows come to 51% there and 63.8% on an iPhone SE 1 -- the cap broken on the
   two phones with the least room, which is the opposite of what a ceiling is
   for. Measured, all eight: 63.8% / 62.3% / 51.2% / 51.0% / 50.8% / 50.5% /
   50.3% / 50.1%.

   The WIDTH rule has always done this correctly and says so in rule 19:
   「TEN ACROSS is the phone's number -- the narrowest iPhone is 320」. Not the
   phone in your hand, and not the roomiest one. The narrowest. 320 x 568 is
   that phone -- iOS 15 runs on an iPhone SE 1 -- so it is the one the height
   is divided out of too, and the answer holds everywhere above it.

   FIVE. Which is the free QWERTY's own row count (digits, q, a, z, the bar)
   and what a real phone keyboard is: four rows, five with a number row.

   HALF IS THE LIMIT, and five did not move when it became half.
   「0.5が限界」 OWNER 2026-08-27. KB_MOST was 0.55 and is 0.5, and the number
   of rows is DIVIDED out of it, so the obvious reading is that fewer fit.
   Measured on the phone it is divided on: (568 x 0.55 - 52) / 44.32 = 5.875,
   and (568 x 0.5 - 52) / 44.32 = 5.235. Both floor to five. What the ceiling
   lost is the SLACK -- 0.875 of a row became 0.235, which on an SE 1 is 38pt
   of room becoming 10pt -- and a sixth row was never within reach of either.

   So no board anybody has can stop fitting because of this, and none needs
   to be cut. The three numbers still come out of the Swift; only this one
   moved. */
var KB_REF_W=320, KB_REF_H=568;
function kbRowH(w){ return (w||KB_REF_W)*KB_ROWW; }
function kbRowsMax(){
  return Math.max(1, Math.floor((KB_REF_H*KB_MOST - KB_BARS) / kbRowH(KB_REF_W)));
}
/* Is there room for another row, and is there room in this one for a key of
   that width. Asked in one place each so a way in that forgets cannot exist:
   the dashed row at the foot, a width dropped on a cell, a width tapped into
   place, and a key made wider all come through these two. */
function kbRoomRow(){ return kbLayer().rows.length<kbRowsMax(); }
function kbUsed(row){
  var n=0, i;
  for(i=0;i<row.length;i++) n+=kbU(row[i].w);
  return n;
}
/* Is there room in THIS row for a key of that width -- the rule itself, given
   a row rather than a place to find one. Split out because the second road
   into it has no row NUMBER to offer: a key being carried is somewhere in the
   page and nowhere in the layout until the finger comes up, so kbDragTo() can
   only hand over the row it built out of what is on screen. Two roads, one
   sentence about ten columns. */
function kbRoomFor(row, w){
  return !!row && kbUsed(row)+kbU(w)<=KB_COLS;
}
function kbRoomIn(ri, w){
  return kbRoomFor(kbLayer().rows[ri], w);
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
/* Whether a key COVERS a column, which is the question a lit column asks of
   every key on the sheet. 「半キーにしよう。その代わり縦列の選択の時では
   選ばれない。例えばaが半きーのばあい。aを選択したら他の124列目だけ選ばれて
   削除して中央揃えした場合全部がハンキーになる感じ。」
   OWNER DECISION 2026-08-26.

   It used to ask whether the key OVERLAPPED the column at all, and that is a
   different question on the one row that is inset by half a key. The free
   QWERTY's third row is `gap 0.5 / nine letters / gap 0.5`, so every key on
   it straddles two columns and every key on it therefore answered yes to two
   of them: pressing any letter across the top lit TWO of the nine, on that
   row alone, on the keyboard both plans type on.

   Both halves of the decision are kept and they pull the same way. The half
   key stays -- that inset is what a QWERTY looks like. And a column takes
   only what it is entirely made of, so on that row it takes nothing at all.
   **A row where the band comes down and no key lights is the right answer
   and not a bug**: it is the row saying it does not line up with the columns,
   which is exactly what somebody needs to know before they cut one.

   In half columns, because a key can be half of one -- kbU() says why. */
function kbColHas(at, w, ci){
  return at<=ci*2 && at+kbU(w)>=ci*2+2;
}
/* The key being held, or null. */
var KBD=null;
/* A key can still be held and carried -- the same gesture as the alphabet's
   tiles, on the other thing in this app that is a grid somebody arranges.
   What went is the OTHER half of what this used to mount: the three widths
   under the sheet, which were dragged onto a cell. A cell is pressed now.
   www/glyph.js calls this after every render and does not need to know. */
function kbDragMount(){
  var g=document.getElementById('kb');
  if(!g) return;
  g.addEventListener('touchstart', kbDown, false);
  g.addEventListener('touchmove', kbDragTo, false);
  g.addEventListener('touchend', kbUp, false);
  g.addEventListener('touchcancel', kbUp, false);
}
/* ---- a sheet is worked by touching it -----------------------------------
   「下のキーを動かして入れるのやめない？ a1とかタップしたらキーを追加とか、
   a1a2触ってキーをくっつける」「タップしたらそのキーが選ばれて上のゴミ箱ボタン
   とかくっつけるボタンとか押してその作業がされるようにしようよ」
   OWNER DECISION 2026-08-27.

   A key used to be placed by picking one of three widths from a palette under
   the sheet and carrying it onto a cell with a finger. Two things were wrong
   with that and only one of them was the finger. The palette's widths were
   1, 2 and 3 in a unit of their own, while a key on the sheet is however many
   of the ten columns it spans -- so on a flick board the thing you picked up
   and the thing that landed were different sizes, and nothing could say so
   because there was nothing to compare them to.

   Touching the sheet has neither problem. An empty cell IS a key's worth of
   room, so pressing one puts a key exactly there and exactly that wide. And a
   key is made wider by joining it to the one beside it, which cannot come out
   at a width the row has no room for because both were already in the row.

   It is also the shape the sheet already had: a row is worked by pressing its
   number, a column by pressing its letter, and now a key by pressing the key.
   Press to select, and the buttons over the sheet act on whatever is selected.
   Three things, one habit -- and no exception:
   「なんで？ 結合ボタン作れよ。編集も含め全部ボタンで作業だから」 OWNER
   2026-08-27. Pressing the key BESIDE a selected one used to join the two,
   which was the one place on this sheet where a press did something rather
   than choosing something -- and it was standing exactly where a second key
   would have to be chosen 「あと複数キー選べないから」. */
/* An empty frame of the sheet, and every one of them is one.
   「エクセルと同じだって。点線キーが入ってんの。追加するならタップまで追加ボタン。
   キーガーないところがあるのがおかしい」 OWNER DECISION 2026-08-28.

   The sheet is a grid of frames and a frame with no key in it is a DOTTED
   KEY -- there is no such state as a blank. A leftover of one column is half
   a frame and is a frame all the same: pressing it puts in a key half a key
   wide, which is a width this keyboard has had since it had a QWERTY (the
   third row is inset by exactly that at each end).

   It was drawn as SPACE for a day, with `can` false on the half, on the
   grounds that a key is one key wide. That was the app deciding a frame was
   not one because what goes in it is small, and the owner said no:
   「半キーも左に寄せたら右に1枠開くでしょ？そういう話」

   `span` is the frame's width in COLUMNS and a column is half a key, so the
   key that goes in is span/2 wide. One number, carried from the drawing to
   the press, so the two cannot disagree about how wide the frame was. */
function kbCellHTML(ri, at, span, ki){
  return '<button class="kbk'+(ki===undefined? '' : ' gap')+' cell'+
    (kbCellIs(ri, at)? ' pick':'')+'"' +
    DO('kbCellAdd', [ri, at, span]) +
    /* The paint, because a selection nobody can see is not one. There is no
       `.kbk.pick` rule in the stylesheet -- a chosen key is painted from
       here, inline -- so a frame that wore only the class was chosen and
       looked exactly like the frame beside it. */
    ' style="grid-column:span '+span+(kbCellIs(ri, at)? kbPickPaint() : '')+'"' +
    /* A frame drawn over a gap the row WRITES DOWN says which key it is,
       once, on the first of them. kbReadRows() builds a row back out of the
       page after a carry -- it is the layout, briefly, and a gap that named
       itself nowhere would be dropped from it, which is a row losing the
       alignment somebody gave it the next time any key on the board is
       carried. Once and not on each, because that walk pushes a key per
       element it can name and four frames naming one gap would be four gaps.
       Slack the row does not write down names nothing, which is what it has
       always done. */
    (ki===undefined? '' : ' data-r="'+ri+'" data-k="'+ki+'"') +
    ' aria-label="'+esc(t('kb.cell.add'))+'"></button>';
}
/* Which frame is being worked on. KBH's fourth kind, beside the row, the
   column and the key, and it is held by WHERE it is -- the row and the column
   it starts at -- because a frame is not written down anywhere to have an
   index. */
function kbCellIs(ri, at){
  return !!KBH && KBH.k==='f' && KBH.r===ri && KBH.at===at;
}
/* PRESSING A FRAME SELECTS IT. 「全部のます触ったら選択で」 OWNER 2026-08-28.

   It used to put a key in on the press, and that was the one exception left
   on this sheet: two kinds of empty frame were drawn identically and did
   different things -- the slack a row has never had written down added a key,
   and the gap an alignment wrote down selected itself, because a gap is a key
   and a key is pressed to be selected. One habit and no exceptions now: press
   to select, and the buttons over the sheet act on what is selected, which is
   the sentence at the head of CLAUDE.md § 19 and is how the row's number and
   the column's letter have always worked.

   Called with NO ARGUMENTS it is the button over the sheet, acting on the
   selection the way kbCut(), kbAlign(), kbOpenSel() and kbJoinSel() do. Two
   controls, one act, and the arguments say which is asking -- the same shape
   as kbIns(down) and kbInsCol(right). */
function kbCellAdd(ri, at, span){
  if(ri===undefined){ kbCellPut(); return; }
  if(kbIsFree(kbShow)) return;
  if(!kbEdit()) return;
  KBH={k:'f', r:ri, at:at, span:span};
  kbSel=null;
  render();
}
/* And what the button over the sheet does: a key goes into the selected
   frame, THE WIDTH OF THAT FRAME. A frame is at most one key wide wherever
   the sheet draws one, and one narrower than a key is refused above, so the
   key that goes in is exactly one.

   Two places a frame can be, and the difference is whether the row writes it
   down. Slack it does not write down is beyond the keys, so the key is spliced
   in and the row gets WIDER -- ten across is asked about there. A gap key is
   room the row already holds, so the key takes that frame's share of it and
   what is left stays a gap on either side; the row's total does not move and
   there is nothing to ask. */
/* A KEY IS A KEY WIDE, and a frame narrower than one takes none.
   「半キーを追加できるのやめてほしい」 OWNER 2026-09-05.

   A frame is drawn over whatever room the sheet has, counted in COLUMNS, and
   a column is half a key -- so a row pushed to one end leaves half a column
   at the other and the sheet offers a frame half a key wide. Putting a key in
   one made a half key, which is a key nobody chose the width of: the width
   picker on a key's own page offers 1, 2, 3 and 4 and has never offered a
   half.

   The frame is still PRESSED to be selected -- that is what pressing a frame
   is on this sheet, and every frame answers to it (「全部のます触ったら選択で」
   OWNER 2026-08-28). What it cannot do is take a key, and the + over the
   sheet is down while it is the one selected.

   The inset that makes a QWERTY's third row a QWERTY is a GAP and not a key,
   and nothing here touches it. */
function kbCellFits(){
  return !!KBH && KBH.k==='f' && (KBH.span||2)>=2;
}
function kbCellPut(){
  var b=kbEdit(), rows, row, w, i, at, u, k, put;
  if(!b || !kbCellFits()) return;
  rows=kbLayer().rows;
  row=rows[KBH.r];
  if(!row) return;
  w=(KBH.span||2)/2;
  k=kbKey('lt', '');
  k.w=w;
  /* the gap this frame is drawn over, if there is one */
  at=0;
  for(i=0;i<row.length;i++){
    u=kbU(row[i].w);
    if(row[i].k==='gap' && !kbShadow(row[i]) &&
       KBH.at>=at && KBH.at+KBH.span<=at+u) break;
    at+=u;
  }
  if(i<row.length){
    put=[];
    if(KBH.at-at>0) put.push(kbGap(kbGapW(KBH.at-at)));
    put.push(k);
    if((at+u)-(KBH.at+KBH.span)>0)
      put.push(kbGap(kbGapW((at+u)-(KBH.at+KBH.span))));
    row.splice.apply(row, [i, 1].concat(put));
  }else{
    if(!kbRoomFor(row, w)) return;
    row.splice(kbColAt(row, KBH.at), 0, k);
  }
  KBH=null; kbSel=null;
  saveKb(); render();
}
/* Which key is being worked on. It is KBH's third kind, beside the row and
   the column, so that one thing is selected at a time and the buttons over
   the sheet have one question to ask. */
/* ---- more than one key, and only ever a straight run --------------------
   「あと複数キー選べないから」「タップしたら上に削除とか出るとこに編集、色んな
   キー触ったら一気に動かせたりしようよ。横と縦に限定だけど。」
   「選ぶとこはバラバラは選べないから、バラバラ押した時は選択が解除されるように
   してほしい。」 OWNER 2026-08-27.

   A key selection is a START and how many follow it, across or down:
   {k:'k', r, i, n, d}. `r` and `i` stay the FIRST key, so everything that was
   written when only one could be chosen -- the bin, the edit button, the join
   -- still reads the same two fields and still means the same key.

   ACROSS is the next index in the row. DOWN is the key whose start column is
   this one's, in the row below -- the sheet's own idea of "under", the one
   kbVJoin() uses, and not "index i of the next row", which on a row inset by
   half a key is a different key entirely. */
function kbSelD(){ return (KBH && KBH.d) || 'x'; }
function kbSelN(){ return (KBH && KBH.n) || 1; }
function kbUnderOf(ri, ki){
  var rows=kbLayer().rows, di;
  if(!rows[ri] || !rows[ri][ki] || !rows[ri+1]) return null;
  di=kbAtKey(rows[ri+1], kbAtOf(rows[ri], ki));
  return di<0? null : {r:ri+1, i:di};
}
/* Every key of the selection, first to last. One list, so nothing has to work
   the run out again -- the bin, the carry and the drawing all walk this. */
function kbSelKeys(){
  var out=[], n, j, u;
  if(!KBH || KBH.k!=='k') return out;
  out.push({r:KBH.r, i:KBH.i});
  n=kbSelN();
  for(j=1;j<n;j++){
    if(kbSelD()==='y'){
      u=kbUnderOf(out[j-1].r, out[j-1].i);
      if(!u) break;
      out.push(u);
    }else out.push({r:KBH.r, i:KBH.i+j});
  }
  return out;
}
function kbKeyIs(ri, ki){
  var ms=kbSelKeys(), j;
  for(j=0;j<ms.length;j++) if(ms[j].r===ri && ms[j].i===ki) return true;
  return false;
}
function kbTapKey(ri, ki){
  var rows, ui;
  if(kbIsFree(kbShow)) return;
  if(!kbEdit()) return;
  /* The lower half of a merged key IS that key. One redirect here rather than
     a second name in the markup, so everything below -- selecting, joining,
     the bin -- is about the key somebody pressed. */
  rows=kbLayer().rows;
  if(rows[ri] && kbShadow(rows[ri][ki])){
    ui=kbAtKey(rows[ri-1], kbAtOf(rows[ri], ki));
    if(ui<0) return;
    ri=ri-1; ki=ui;
  }
  kbSelTo(kbSelSpread(ri, ki));
}
/* What the selection BECOMES when this key is pressed. Three answers and no
   fourth: it is already in the run and the run stands; it lengthens the run at
   one end; or it is somewhere the run cannot reach and the selection is
   RELEASED. 「バラバラ押した時は選択が解除されるようにしてほしい」

   Released and not moved-to. That is the half that reads like a detail and is
   not: with "the pressed key becomes the selection" there is no press left
   that means "nothing", so the only way back to nothing would be pressing the
   selected key again -- which is exactly the toggle the owner asked to be rid
   of 「同じとこ触ると選択解除されるからわかりにくい」. Releasing costs a second
   press to choose a far key; keeping it would cost the owner the thing they
   asked for. So: press once to let go, press again to choose. */
function kbSelSpread(ri, ki){
  var one={k:'k', r:ri, i:ki, n:1, d:'x'}, n, d, u, last;
  if(!KBH) return one;
  /* a ROW or a COLUMN is chosen and this is a key: it cannot lengthen that,
     so it releases it. 「今列選択してる時も適当に触ったら選択解除されるように
     して欲しい」 -- a key is one of the arbitrary things being touched. */
  if(KBH.k!=='k') return null;
  if(kbKeyIs(ri, ki)) return KBH;          /* already chosen: it stands */
  n=kbSelN(); d=kbSelD();
  /* one key so far: the run has no direction yet, so any of the four says it */
  if(n===1){
    if(ri===KBH.r && ki===KBH.i+1) return {k:'k', r:KBH.r, i:KBH.i, n:2, d:'x'};
    if(ri===KBH.r && ki===KBH.i-1) return {k:'k', r:ri, i:ki, n:2, d:'x'};
    u=kbUnderOf(KBH.r, KBH.i);
    if(u && u.r===ri && u.i===ki) return {k:'k', r:KBH.r, i:KBH.i, n:2, d:'y'};
    u=kbUnderOf(ri, ki);
    if(u && u.r===KBH.r && u.i===KBH.i) return {k:'k', r:ri, i:ki, n:2, d:'y'};
    return null;
  }
  if(d==='x'){
    if(ri===KBH.r && ki===KBH.i+n) return {k:'k', r:KBH.r, i:KBH.i, n:n+1, d:'x'};
    if(ri===KBH.r && ki===KBH.i-1) return {k:'k', r:ri, i:ki, n:n+1, d:'x'};
    return null;
  }
  last=kbSelKeys()[n-1];
  u=last && kbUnderOf(last.r, last.i);
  if(u && u.r===ri && u.i===ki) return {k:'k', r:KBH.r, i:KBH.i, n:n+1, d:'y'};
  u=kbUnderOf(ri, ki);
  if(u && u.r===KBH.r && u.i===KBH.i) return {k:'k', r:ri, i:ki, n:n+1, d:'y'};
  return null;
}
/* Two keys, side by side, becoming one as wide as the two of them were.

   WHAT IT KEEPS is the left one -- its letter, its four flick slots, what it
   does when pressed. The right one's width is all that is taken, because a
   key can only carry one letter and choosing which of the two survives is not
   something a person pressing two keys has said anything about. The step back
   is what stands behind it, the same as the row and the column deletes. */
function kbJoin(ri, ki){
  var b=kbEdit(), row, a, c;
  if(!b) return;
  row=kbLayer().rows[ri];
  if(!row || !row[ki] || !row[ki+1]) return;
  a=row[ki]; c=row[ki+1];
  a.w=(kbU(a.w)+kbU(c.w))/2;
  row.splice(ki+1, 1);
  KBH={k:'k', r:ri, i:ki};
  kbSel=null;
  saveKb(); render();
}
/* Whether the selected key has one beside it to join to. */
/* Whether the selected key has one to join to -- the one beside it, or the one
   under it. Both, because the button is ONE button: 「なんで？ 結合ボタン
   作れよ。編集も含め全部ボタンで作業だから」 OWNER 2026-08-27.

   The pair under it is only offered where the two line up, which is kbVJoin()'s
   own rule; asking it here rather than restating it means the button is down
   exactly when the join would be refused. */
/* WHAT IS JOINED IS WHAT IS CHOSEN -- the two keys selected, and not "the one
   selected and whatever happens to sit beside it". 「なんで？ 結合ボタン作れよ。
   編集も含め全部ボタンで作業だから」 OWNER 2026-08-27: choosing is the tap and
   doing is the button, so the button acts on the choice.

   Exactly two. Three keys becoming one is not a thing this sheet has, and
   picking two out of three would be the button choosing what the person did
   not -- so it is drawn over any run of two or more and is DOWN on anything
   it cannot do, which is what every other button here does. */
function kbJoinRight(){
  var row;
  if(!KBH || KBH.k!=='k' || kbSelN()!==2 || kbSelD()!=='x') return false;
  row=kbLayer().rows[KBH.r];
  return !!(row && row[KBH.i] && row[KBH.i+1]);
}
function kbJoinDown(){
  var rows, up, dn, di;
  if(!KBH || KBH.k!=='k' || kbSelN()!==2 || kbSelD()!=='y') return false;
  rows=kbLayer().rows;
  up=rows[KBH.r]; dn=rows[KBH.r+1];
  if(!up || !dn || !up[KBH.i]) return false;
  if(kbTall(up[KBH.i]) || kbShadow(up[KBH.i])) return false;
  di=kbAtKey(dn, kbAtOf(up, KBH.i));
  if(di<0 || kbU(dn[di].w)!==kbU(up[KBH.i].w)) return false;
  return !kbTall(dn[di]) && !kbShadow(dn[di]);
}
function kbJoinable(){ return kbJoinRight() || kbJoinDown(); }

/* ---- a key that covers the row below it too -----------------------------
   「縦はリーダーに確認して許可降りたらやって欲しい」OWNER 2026-08-27, and the
   leader gave it the same day.

   A merged cell is two things stored: `h` on the key that covers, and a GAP
   carrying `up` standing in the same columns of the row below. The gap is
   what keeps that row the width it was -- the keys beside it do not slide
   under the merged key, and every total this file counts still adds up,
   because a gap has always been a key with a width and no job.

   It is a GAP and not a kind of its own, and that is the whole of why this
   shape rather than a tidier one. KeyBoardView.swift switches on `k` and
   falls to `default:` for anything it has never heard of -- which draws an
   ordinary grey key and inserts nothing when pressed. A `gap` is drawn clear
   and does nothing. So a board carrying a merge, read by a build from before
   merges existed, is a keyboard with a hole where the lower half is and a key
   of one row above it: the merge is missing and NOTHING ELSE IS. A keyboard
   belongs to a language and a language moves between phones, so that is the
   case that decides the shape. `h` and `up` are both unknown keys to an older
   Decodable and are ignored rather than refused. */
function kbTall(k){ return !!k && (k.h||1)>1; }
/* How many rows a key stands in, as the variable .kbk already reads. It is
   --rh and not a new class because .kbk's own min-height is written in terms
   of it and has been since the sheet had two boards -- there is one rule
   saying how tall a key is, and this is the number it was always given. */
function kbRhCSS(k){ return kbTall(k)? ';--rh:'+(k.h||1) : ''; }
/* What a SELECTED key looks like. 「選んだキーは色変えないと選んでるかわかん
   ないくない？」OWNER 2026-08-27 -- it wore --goldsf, a tint at 7%, on a key
   28px across, and nobody could see which one they had chosen.

   It is purple because that is what "selected on this sheet" already is: the
   row's band, the column's band and a key standing in a chosen column are all
   --pur. Gold means OPEN in this app and is what `.kbk.on` still is -- the key
   whose page you are looking at -- and the two had been sharing one class.

   Written here rather than in the stylesheet, and that is the one thing about
   it worth arguing with. index.html belongs to another session today, and a
   class with no rule behind it is a selection nobody can see -- which is the
   bug being fixed. It NAMES THE VARIABLE and does not spell a colour, so the
   colour itself still lives in the two theme blocks and nowhere else, which is
   what that rule asks for. If it should be a stylesheet rule, it is one line
   -- `.kbk.pick{background:var(--pur);color:var(--bg)}` -- and this goes. */
/* What a chosen thing on the sheet is painted. One place, so a frame and a
   key cannot come to wear two different purples -- and it is the purple the
   sheet already uses, not a new one: 「選んだキーは色変えないと選んでるか
   わかんなくない？」OWNER 2026-08-27 is answered once for everything the sheet
   can choose. */
function kbPickPaint(){ return ';background:var(--pur);color:var(--bg)'; }
function kbPickCSS(ri, ki){
  return kbKeyIs(ri, ki)? kbPickPaint() : '';
}
function kbShadow(k){ return !!k && k.k==='gap' && !!k.up; }
/* Where a key starts, in columns, and which key stands at a column. A merge
   is only ever between a key and the one directly under it -- same column,
   same width -- because anything else is a ragged cell and there is no such
   thing on a sheet. */
function kbAtOf(row, ki){
  var at=0, i;
  for(i=0;i<ki && i<row.length;i++) at+=kbU(row[i].w);
  return at;
}
function kbAtKey(row, at){
  var n=0, i;
  if(!row) return -1;
  for(i=0;i<row.length;i++){
    if(n===at) return i;
    if(n>at) return -1;
    n+=kbU(row[i].w);
  }
  return -1;
}
/* Whether anything in this row is half of a merge. The three alignments are
   down on such a row: where a merged pair goes when the row it is in is
   pushed left or right is the OWNER's, and has not been asked. Moving one
   half and not the other is not an answer to it. */
function kbRowTied(ri){
  var row=kbLayer().rows[ri], i;
  if(!row) return false;
  for(i=0;i<row.length;i++) if(kbTall(row[i]) || kbShadow(row[i])) return true;
  return false;
}
/* The two, becoming one that is two rows tall. What it keeps is the UPPER
   one -- its letter, its four flick slots, what it does when pressed -- for
   kbJoin()'s reason: a key carries one letter, and somebody pressing two
   keys has said nothing about which. The step back is what stands behind it.

   It answers whether it happened, so kbTapKey() can fall through to plain
   selection when the two do not line up. Refused rather than repaired: a
   merge of a wide key and a narrow one is a cell this sheet cannot draw. */
function kbVJoin(ri, ki){
  var b=kbEdit(), rows, up, dn, di;
  if(!b) return false;
  rows=kbLayer().rows;
  up=rows[ri]; dn=rows[ri+1];
  if(!up || !dn || !up[ki]) return false;
  if(kbTall(up[ki]) || kbShadow(up[ki])) return false;
  di=kbAtKey(dn, kbAtOf(up, ki));
  if(di<0 || kbU(dn[di].w)!==kbU(up[ki].w)) return false;
  if(kbTall(dn[di]) || kbShadow(dn[di])) return false;
  up[ki].h=2;
  dn[di]=kbGap(dn[di].w); dn[di].up=1;
  KBH={k:'k', r:ri, i:ki};
  kbSel=null;
  saveKb(); render();
  return true;
}
/* Merges, kept honest, in one place. A row can be deleted, a column taken
   out, a key put in beside one -- and any of those can leave a key covering
   a row with no hole under it, or a hole under nothing. Neither throws and
   both draw: what comes out is a keyboard that is not the one somebody built.

   It runs from saveKb(), which is what every change to a keyboard ends in,
   and BEFORE kbNoted() inside it, so what the step back holds is the repaired
   layout rather than a state the app never showed. Rows are walked downwards,
   so a key whose `h` is dropped here is dropped before the gap under it is
   asked about. */
function kbVFix(){
  var i, j, rows, k, ri, ki, at, di;
  if(!KB || !KB.kbs) return;
  for(i=0;i<KB.kbs.length;i++){
    if(!KB.kbs[i] || !KB.kbs[i].lay) continue;
    for(j=0;j<KB.kbs[i].lay.length;j++){
      rows=KB.kbs[i].lay[j].rows;
      if(!rows) continue;
      for(ri=0;ri<rows.length;ri++){
        for(ki=0;ki<rows[ri].length;ki++){
          k=rows[ri][ki];
          at=kbAtOf(rows[ri], ki);
          if(kbTall(k)){
            di=kbAtKey(rows[ri+1], at);
            if(di<0 || !kbShadow(rows[ri+1][di]) ||
               kbU(rows[ri+1][di].w)!==kbU(k.w)) delete k.h;
          }else if(kbShadow(k)){
            di=kbAtKey(rows[ri-1], at);
            if(di<0 || !kbTall(rows[ri-1][di]) ||
               kbU(rows[ri-1][di].w)!==kbU(k.w)) delete k.up;
          }
        }
      }
    }
  }
}
/* The letters across the top, one to a whole key and not one to a column --
   nobody insets a row by half a letter. Inside #kb so it shares the grid's
   width and its columns; it holds no key, so kbReadRows() walks straight past
   it and a key being dragged cannot land in it. */
function kbHdrHTML(cols){
  var out='', i=0, n=0;
  while(i<cols){
    out+='<button class="kbcl'+(kbHeadIs('c', n)? ' on':'')+'" '+
      'style="grid-column:span '+Math.min(2, cols-i)+'"'+
      DO('kbHeadCol', [n]) + ' aria-label="'+esc(t('kb.col.sel'))+'">'+
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
  return '<button class="kbn'+(kbHeadIs('r', ri)? ' on':'')+'"' + DO('kbHeadRow', [ri]) +
    ' aria-label="'+esc(t('kb.row.sel'))+'">'+(ri+1)+'</button>';
}
/* ---- what is being worked on ------------------------------------------
   Pressing a row's number or a column's letter used to take that row or that
   column away on the spot. 「今即削除なの危なすぎだろ」 It does what the same
   press does on a spreadsheet now: it SELECTS, the thing selected lights up
   so it is clear what is being worked on, and the buttons over the sheet act
   on it. 「削除は削除ボタン寄せは寄せボタンでしょ」

   Where you are standing rather than anything the language has, so
   viewReset() drops it. Pressing the same head again puts it down. */
var KBH=null;
/* ---- A HEAD SELECTION IS A RUN -----------------------------------------
   「キーボードaおしたら縦列選択できるけどさ、そこからabcdみたいに引っ張っても
   選択ができない。…エクセルとかなら真ん中に丸ポチがあって引っ張れるでしょ？」
   OWNER 2026-09-05.

   `i` is the head that was pressed and `j` is the one the finger reached, so
   a run of one is `j` absent -- which is every selection this sheet had until
   now, and is why nothing stored or drawn needed a second field. Which end
   was pressed first matters to nobody below, so the run is said in order HERE
   and read from nowhere else. */
function kbHeadRun(){
  var j;
  if(!KBH || (KBH.k!=='r' && KBH.k!=='c')) return null;
  j=(KBH.j===undefined)? KBH.i : KBH.j;
  return {a:Math.min(KBH.i, j), b:Math.max(KBH.i, j)};
}
function kbHeadJ(){ var r=kbHeadRun(); return r? (KBH.j===undefined? KBH.i : KBH.j) : 0; }
/* Every head in the run is lit, not just the one under the finger. */
function kbHeadIs(k, i){
  var r=kbHeadRun();
  return !!r && KBH.k===k && i>=r.a && i<=r.b;
}
/* Whether this key stands inside the columns being worked on -- ANY of them,
   because the selection is a run. Entirely inside one, which is kbColHas()'s
   sentence and is not restated here. */
function kbColSel(at, w){
  var r=kbHeadRun(), i;
  if(!r || KBH.k!=='c') return false;
  for(i=r.a;i<=r.b;i++) if(kbColHas(at, w, i)) return true;
  return false;
}
/* Whether anything in the run is half of a merge. The three alignments are
   down on such a row -- where a merged pair goes when its row is pushed is
   the OWNER's and has not been asked -- and a run is down when ANY row in it
   is: pushing three rows and silently leaving the fourth is not an answer
   either. */
function kbRunTied(){
  var r=kbHeadRun(), i;
  if(!r || KBH.k!=='r') return false;
  for(i=r.a;i<=r.b;i++) if(kbRowTied(i)) return true;
  return false;
}
/* ---- WHAT IS SELECTED CHANGES IN ONE PLACE ------------------------------
   A row, a column and a key are three things to select and there were three
   places deciding it, each toggling on its own. That is one rule written out
   three times, and the owner is reading it as one:
   「今列選択してる時も適当に触ったら選択解除されるようにして欲しい。同じとこ
   触ると選択解除されるからわかりにくい」 OWNER 2026-08-27.

   This does not change what happens yet -- it is the same three answers, in
   one place, so that the sentence the owner asked for is one line to write
   and not three to find. What the sentence IS is still being asked: press
   something unrelated and the selection is released, but whether the thing
   just pressed then becomes the selection is the half that was not said, and
   is a judgement about how the screen feels rather than a bug. It is in
   docs/reports/kb6-tools-2026-08-27.md with the button table.

   Everything that selects goes through here: the row's number, the column's
   letter, and a key. */
function kbSelTo(next){
  KBH=next || null;
  kbSel=null;
  render();
}
/* A head answers the same sentence a key does, because it is the same
   sentence: pressed with nothing chosen it chooses; pressed again it STANDS
   (the toggle is gone -- 「同じとこ触ると選択解除されるからわかりにくい」); and
   pressed while something else is chosen it releases 「今列選択してる時も適当に
   触ったら選択解除されるようにして欲しい」. A row and a column cannot be run
   together the way keys can, so "lengthens the run" has no case here. */
function kbHeadTo(k, i){
  if(!KBH) return {k:k, i:i, ins:false};
  if(kbHeadIs(k, i)) return KBH;
  return null;
}
function kbHeadRow(ri){
  ri=parseInt(ri, 10)||0;
  kbSelTo(kbHeadTo('r', ri));
}
function kbHeadCol(ci){
  ci=parseInt(ci, 10)||0;
  kbSelTo(kbHeadTo('c', ci));
}
/* ---- a row going in where you are, and it is the only road there is ----
   There was a dashed key under the bottom row that added one AFTER the last,
   with no way to put one in the middle -- which on a sheet is the ordinary
   thing to want. 「行を選択して+ボタン押したら上か下に追加するが出て押したら
   追加されるとかは？」 That key is gone as of 2026-09-04
   （「キーボードのこの下の+もいらない。誤タッチが多いから」), so this is
   where a row comes from.

   The + does not add. It ASKS -- and the two answers take the place of the
   three alignments and the bin while it is asking, because those are about
   the row that is there and this is about one that is not. Pressing the +
   again puts the question away. */
/* Whether the + can offer anything, for whichever of the two is selected.
   A column is a different question from a row: a row is one row against the
   ceiling, and a column is a key's worth added to EVERY row that reaches it,
   so it is refused when any one of those rows is already ten across. */
function kbInsRoom(){
  if(!KBH) return false;
  /* A key and a frame are both places IN the sheet rather than a whole row or
     a whole column, so there is no side for a new one to go on. Said here as
     well as on the button: a button being down is a look, and the act has to
     refuse on its own. */
  if(KBH.k==='k' || KBH.k==='f') return false;
  var run=kbHeadRun();
  /* As many as are chosen: four columns selected is four going in, so the
     room asked for is the room for four. */
  return KBH.k==='r'? kbRoomRow() : kbRoomCol(run.a, run.b-run.a+1);
}
function kbInsAsk(){
  if(!KBH || !kbInsRoom()) return;
  KBH.ins=!KBH.ins;
  render();
}
/* ---- putting a column in -----------------------------------------------
   「これって列とか行とかはたせないの？」「いいよー 最大になったら+はなし」
   OWNER DECISION 2026-08-26.

   Rows could be added two ways and a column could only be TAKEN AWAY. On a
   sheet that is one thing missing rather than a small one: the letters across
   the top and the numbers down the side are the same kind of handle, both
   select, both delete -- and only one of them could put anything back except
   through the step back.

   It is only safe to offer BECAUSE the grid is ten fixed columns. On a sheet
   that was as wide as its widest row, adding a column made every key on the
   board thinner, which is the thing the owner ruled out in the same breath as
   asking for this 「小さくなったら意味ないやん」. On ten fixed columns a new
   key fills slack that is already there, and when there is no slack the + is
   not drawn at all 「最大になったら+はなし」 -- kbRoomCol() below, and
   kbInsRoom() above it, are the one place that says so.

   It is kbDelCol() turned around, and it is deliberately NOT "every row gets
   wider". A column comes out of the rows that REACH it and leaves the rest
   alone, so a column goes into those same rows and no others. A short row is
   short because somebody made it short.

   What goes in is an empty letter slot -- what the dashed row at the foot
   puts in, and what a pattern leaves for somebody to fill. Not a gap: a gap
   is space, and what was asked for is a key. */
function kbColAt(row, half){
  var at=0, i;
  for(i=0;i<row.length;i++){
    if(at>=half) return i;
    at+=kbU(row[i].w);
  }
  return row.length;
}
function kbColRows(ci){
  var rows=kbLayer().rows, out=[], i;
  for(i=0;i<rows.length;i++) if(kbUsed(rows[i])>ci*2) out.push(i);
  return out;
}
/* `n` columns, because a head selection is a RUN and four chosen means four
   going in. Every row that reaches the run has to hold all of them or none:
   half a run put in is a keyboard nobody asked for. */
function kbRoomCol(ci, n){
  var rows=kbLayer().rows, at=kbColRows(ci), i;
  n=n||1;
  if(!at.length) return false;
  for(i=0;i<at.length;i++) if(kbUsed(rows[at[i]])+2*n>KB_COLS) return false;
  return true;
}
function kbInsCol(right){
  var b=kbEdit(), rows, at, i, j, half, run=kbHeadRun(), n;
  if(!b || !run || KBH.k!=='c') return;
  n=run.b-run.a+1;
  if(!kbRoomCol(run.a, n)) return;
  rows=kbLayer().rows;
  half=run.a*2 + (right? n*2 : 0);
  at=kbColRows(run.a);
  for(i=0;i<at.length;i++)
    for(j=0;j<n;j++)
      rows[at[i]].splice(kbColAt(rows[at[i]], half), 0, kbKey('lt', ''));
  /* and the selection follows the columns it was on, which have moved right
     by as many as went in on their left -- kbIns() does the same thing one
     axis over */
  KBH={k:'c', i:right? run.a : run.a+n, j:right? run.b : run.b+n};
  kbSel=null;
  saveKb(); render();
}
function kbIns(down){
  var b=kbEdit(), rows, at;
  if(!b || !KBH || KBH.k!=='r' || !kbRoomRow()) return;
  rows=kbLayer().rows;
  at=Math.max(0, Math.min(KBH.i+(down? 1 : 0), rows.length));
  rows.splice(at, 0, [kbKey('lt', '')]);
  /* and the selection follows the row it was on, which has moved down by one
     if the new one went in above it */
  KBH={k:'r', i:down? KBH.i : KBH.i+1};
  kbSel=null;
  saveKb(); render();
}
/* And the one button that takes it away, whichever of the two it is. */
/* The bin takes WHAT IS SELECTED, and once a run can be selected that is every
   key of it. It took `KBH.r, KBH.i` -- the first -- which was the whole of a
   selection until keys came in runs, and would now quietly leave three of four
   behind: the board still draws, the press still looks like it worked, and the
   keys somebody meant to be rid of are still there. Right to left, so the
   indexes of the ones not yet taken do not move under it.

   DELETE REVIEW is in docs/CHANGELOG.md and is unchanged: this takes keys and
   nothing else -- not the letters they point at, not another face, not another
   keyboard -- it is asked for by pressing the bin, and the step back holds it. */
function kbCut(){
  if(!KBH) return;
  var h=KBH, ms, j, run, i;
  /* An empty frame holds nothing to take. Without this the bin would ask
     kbDelCol() for column `undefined`, which is a keyboard that still renders
     and is not the one somebody built. */
  if(h.k==='f') return;
  if(h.k==='k'){
    ms=kbSelKeys();
    KBH=null;
    kbDelKeys(ms);
    return;
  }
  run=kbHeadRun();
  KBH=null;
  /* From the far end back, so that taking one out does not move the ones
     still to go. ONE save and therefore ONE step back for one press --
     kbDelRow() and kbDelCol() write nothing themselves for exactly this
     reason: four columns taken by one press is one thing that happened. */
  for(i=run.b;i>=run.a;i--){
    if(h.k==='r') kbDelRow(i);
    else kbDelCol(i);
  }
  kbSel=null;
  saveKb(); render();
}
/* The two the toolbar does to a key. They take what is selected rather than
   arguments, because a button over the sheet acts on the selection -- the bin
   and the three alignments have always worked that way. */
/* The button. Beside first, then under -- a row is read across, so "join" with
   nothing else said means the one next to it, and the one below is what is
   left when there is nothing beside it. */
function kbJoinSel(){
  if(!KBH || KBH.k!=='k') return;
  if(kbJoinRight()) kbJoin(KBH.r, KBH.i);
  else if(kbJoinDown()) kbVJoin(KBH.r, KBH.i);
}
function kbOpenSel(){ if(KBH && KBH.k==='k') kbPick(KBH.r, KBH.i); }
/* ---- where the slack in a row goes -------------------------------------
   「エクセルみたいに中央寄せとかのボタン置けば？行とか列選択して中央寄せ
   すればそこだけ中央寄せになるとか。」

   It is written in gap keys, which this keyboard has had since it had a
   QWERTY: the third row is inset by a gap of half a key at each end. A row
   that comes to less than the sheet is short by a whole number of half
   columns, and putting that number into gaps at one end, both ends or the
   other end IS left, centre and right.

   Nothing new is stored for it, and that is not only tidiness. A row is an
   ARRAY of keys, and JSON.stringify drops anything on an array that is not an
   index -- so an 'al' property would vanish on the way into localStorage and
   out of the undo stack, silently, and the row would come back the way it
   was. And gaps already travel to the phone: the extension divides a row's
   width by the keys w and a gap is a key, so a row aligned here is a row
   aligned there, which the drawing alone would not have been.

   Only the gaps at the ENDS are touched. A gap in the middle of a row is a
   space somebody put between two keys and is none of this function's
   business. */
function kbGapW(half){ return half/2; }
/* Every row of the run, and ONE save for the press that did them --
   kbCut()'s reason. A run with half a merge anywhere in it is refused whole:
   the button is down for one, and pushing three rows while silently leaving
   the fourth is not an answer to what the OWNER has not been asked. */
function kbAlign(how){
  var b=kbEdit(), run=kbHeadRun(), i;
  if(!b || !run || KBH.k!=='r' || kbRunTied()) return;
  for(i=run.a;i<=run.b;i++) kbAlign1(i, how);
  saveKb(); render();
}
function kbAlign1(ri, how){
  var rows=kbLayer().rows, row=rows[ri], tot, rem, lead, tail;
  if(!row) return;
  /* off with the old ends */
  while(row.length && row[0].k==='gap') row.shift();
  while(row.length && row[row.length-1].k==='gap') row.pop();
  if(!row.length) return;
  tot=kbUsed(row);
  rem=kbCols(rows)-tot;
  if(rem>0){
    /* LEFT and RIGHT put the whole leftover at one end; CENTRE splits it
       between the two. None of the three rounds anything.
       「キーボードも左右寄せにするなら、ハンキーとか関係なく寄せて。」
       OWNER DECISION 2026-08-27, and
       「中心に寄せたら半キーが二つできるけど寄せたら1つになるの」
       OWNER DECISION 2026-08-28.

       Right used to send the odd half to the other end, so that the row's
       first key landed on a whole column -- which is what centring is FOR
       (a row nobody aligned sits in the middle and has to be pointed at), and
       is not what an end is for. Pushing a row to the right means putting it
       against the right, and if half a key is left over it stays left over.

       Centre used to round its half away for the same reason and no longer
       does: a row of nine keys on a sheet of ten has one key left over, and
       what the owner asked for is half a frame at EACH end -- two of them --
       rather than a whole frame at one end and nothing at the other. Pushed
       to an end, that same leftover is one whole frame.

       A row that ends up half a key out lines up with no column and lights
       for none. That is not a fault to round away: it is the same answer the
       free QWERTY's inset third row has always given, and the sheet saying a
       row does not line up with it is what somebody needs to know before they
       cut a column. */
    lead = how==='r'? rem : (how==='c'? kbLead(rem+tot, tot) : 0);
    tail = rem-lead;
    if(tail>0) row.push(kbGap(kbGapW(tail)));
    if(lead>0) row.unshift(kbGap(kbGapW(lead)));
  }
}
/* How much empty goes BEFORE the keys of a short row, so they sit in the
   middle of the sheet rather than piled at its left. 「揃えて欲しい」

     ・・・・・
     　・・・

   Half of what is left over, in columns, and NOT rounded to a whole key.
   「中心に寄せたら半キーが二つできるけど寄せたら1つになるの」 OWNER DECISION
   2026-08-28. A column is half a key, so a row one key short of the sheet has
   two columns left over and centring gives half a frame at each end -- two of
   them, which is what the owner counted. Pushed to one end the same leftover
   is one whole frame.

   It DID round down to a whole key, and the reason it did is still true and
   is no longer a reason: a row off by half a key lines up with no column, so
   pressing a column's letter lights nothing on it. That is now simply what
   such a row says. The free QWERTY's inset third row has said it from the
   first day, and CLAUDE.md § 19 calls it the right answer -- the row telling
   somebody it does not line up with the columns, before they cut one.

   One place, because the drawing of a short row and the button that aligns
   one have to agree -- kbAlign() asks here too. */
function kbLead(cols, tot){
  return Math.floor((cols-tot)/2);
}
function kbHTML(sel, ro){
  var lay=kbLayer(), out='', ri, ki, row, key, cls, slots=!ro && kbHasFlick(),
      /* TEN KEYS, ALWAYS -- not this face's widest row.
         「行と列はエクセルのように数字振ったんだから、小さくなったら意味ない
         やん」「エクセルは足しても小さくならんやろ」 OWNER DECISION 2026-08-26.

         The grid used to be kbCols(lay.rows) wide, so the widest row exactly
         filled it -- and a column was therefore a different width on every
         board and got NARROWER every time anything was added. That is not a
         spreadsheet: a column in one is a fixed width and adding one makes
         the sheet longer, never the columns thinner. Numbering them a b c is
         what says they are fixed, and the numbering is what made it wrong.

         Fixed at KB_COLS, a column is width/10 on every board and never
         moves. A KEY is big by SPANNING columns -- a flick key is five of
         them (w 2.5), which is why it comes out 97pt where a QWERTY's is 39.
         And the limit does the rest: a row that already comes to ten refuses
         another key, so nothing is ever made smaller to fit something in.
         kbRoomIn() has always said that; what was missing was the fixed
         width for it to be true against. */
      cols=ro? 0 : KB_COLS, at, b, lead, tot, ki2, hrun;
  if(!ro){ kbNoted(); out+=kbHdrHTML(cols); }
  for(ri=0;ri<lay.rows.length;ri++){
    row=lay.rows[ri];
    /* The row's number: the editor is a sheet you point at, and 3b is what
       somebody says about the key they are looking at. The read-only board is
       the keyboard itself and wears neither number nor letter -- a row number
       down the side of the thing on your phone is the editor leaking into it. */
    out+='<div class="kbrow'+((!ro && kbHeadIs('r', ri))? ' sel':'')+'">'+
      (ro? '' : kbNHTML(ri));
    at=0;
    /* the empty half of a short row, before the keys */
    if(!ro){
      tot=0;
      for(ki=0;ki<row.length;ki++) tot+=kbU(row[ki].w);
      lead=kbLead(cols, tot);
      while(at<lead){
        b=Math.min(2, lead-at);
        out+=kbCellHTML(ri, at, b);
        at+=b;
      }
    }
    for(ki=0;ki<row.length;ki++){
      key=row[ki];
      /* A gap is an empty frame that happens to be written down -- the slack
         an alignment put at the end of a row, or the half key that insets a
         QWERTY's third row -- so it is drawn as one. 「キーガーないところが
         あるのがおかしい」 OWNER 2026-08-28. Not the lower half of a merged
         key: there is a key standing in that one. Not on the read-only board
         either -- on a phone a gap is genuinely nothing.

         As MANY frames as it covers, which is what makes "the width of that
         frame" a width. A row of three keys centred on a sheet of ten leaves
         seven columns at each end, and CLAUDE.md § 19 counts those as three
         frames and a half -- 「中心に寄せたら半キーが二つできるけど寄せたら
         1つになるの」 -- every one of them a key you can press. It was drawn
         as ONE dashed key three and a half wide, so pressing it could only
         have meant a key three and a half wide, and the sheet said the
         leftover was one thing when the owner had counted four. Same
         arithmetic as the slack outside the keys, in the same function, so
         the two cannot disagree about where a frame starts or how wide it
         is. */
      if(!ro && key.k==='gap' && !kbShadow(key)){
        b=kbU(key.w); tot=at; at+=b;
        while(tot<at){
          ki2=Math.min(2, at-tot);
          out+=kbCellHTML(ri, tot, ki2, tot===at-b? ki : undefined);
          tot+=ki2;
        }
        continue;
      }
      cls='kbk'+(key.k!=='lt'? ' fn':'')+(key.k==='gap'? ' gap':'')+(ro? ' ro':'')+
        ((!ro && sel && sel.r===ri && sel.k===ki)? ' on':'')+
        /* the key being worked on, and a key standing in the column that is.
           `pick` and not `on`: those are two different states that had been
           wearing one class. `on` is the key whose PAGE is open, and it is
           gold because gold is what open means everywhere in this app; this
           is the key SELECTED on the sheet, which is the same state the row's
           number and the column's letter go into, and that is purple. Sharing
           the class made them one look, and the look was --goldsf -- a tint at
           7% on a 28px key. 「選んだキーは色変えないと選んでるかわかんなく
           ない？」OWNER 2026-08-27. */
        ((!ro && kbKeyIs(ri, ki))? ' pick':'')+
        ((!ro && kbColSel(at, key.w))? ' sel':'');
      /* Two columns wide, or as many as it is: a key of three IS six columns
         joined, which is where a wide key comes from on a sheet. */
      at+=kbU(key.w);
      /* A letter key says which letter it is. Nothing on the keyboard needed
         that until the onboarding had to point at one and say the letter
         just drawn went there -- and a key is drawn from a shape, so there
         was no other way to tell one from another. */
      out+= ro
        ? '<span class="'+cls+'"'+(key.k==='lt'? ' data-lt="'+esc(key.v)+'"' : '')+
          ' style="flex:'+(key.w||1)+kbRhCSS(key)+'">'+kbFlicks(key, false)+
          '<span class="kbc">'+kbFace(key)+'</span>'+kbMark(key)+'</span>'
        : '<button class="'+cls+(kbWob? ' wob':'')+'" '+
          'style="grid-column:span '+kbU(key.w)+kbRhCSS(key)+
            (ro? '' : kbPickCSS(ri, ki))+'" '+
          'data-r="'+ri+'" data-k="'+ki+'"'+
          DO('kbTapKey', [ri, ki]) + '>'+kbFlicks(key, slots)+
          '<span class="kbc">'+kbFace(key)+'</span>'+kbMark(key)+'</button>';
    }
    /* and the other half, after them. A row of a keyboard built from a
       pattern comes to the same total as the widest and has neither. */
    if(!ro) while(at<cols){
      b=Math.min(2, cols-at);
      out+=kbCellHTML(ri, at, b);
      at+=b;
    }
    out+='</div>';
  }
  /* THERE IS NO + UNDER THE KEYBOARD. 「キーボードのこの下の+もいらない。
     誤タッチが多いから」 OWNER 2026-09-04.

     A dashed key the width of the sheet used to sit here, directly under the
     bottom row, and pressing it added a row. That is where a thumb comes to
     rest coming off the space bar, so it was being pressed by people who were
     not adding anything.

     Adding a row is unchanged and is the OTHER of the two roads this screen
     has always had: press a row's number to select it, then the + over the
     sheet, which asks 上 or 下 -- kbInsAsk() and kbIns(). That road says which
     side the row goes on, which this one never could, and it is reached from
     the band of buttons rather than from the keyboard itself. */
  /* the band down the column being worked on, if one is */
  hrun=kbHeadRun();
  if(!ro && hrun && KBH.k==='c' && hrun.a*2<cols)
    out='<span class="kbband" style="left:calc(100% / '+cols+' * '+(hrun.a*2)+');'+
      'width:calc(100% / '+cols+' * '+
        Math.min((hrun.b-hrun.a+1)*2, cols-hrun.a*2)+')"></span>'+out;
  return '<div class="kb'+(ro? '' : ' kbsheet')+'" id="kb"'+
    (ro? '' : ' style="--kc:'+cols+';width:'+kbSheetW()+';--kh:'+kbSheetH()+'"')+'>'+out+'</div>';
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
/* ---- choosing several keyboards, and taking them away -------------------
   「キーボードも選択削除したいから、？の位置を キーボード 選択 にしたい。
   選択削除できるように。追加は◉+にしてね」 OWNER 2026-09-01 -- the same
   shape the dictionary has: Select at the far end of the bar, a ◉ at the
   front of each row, Delete beside Done, and the round + to add.

   `KBSEL` is null when the list is an ordinary list and a map of indexes when
   it is being chosen from -- where you are standing on this screen, so
   viewReset() drops it. Board 0 is the free QWERTY: it is not in storage and
   cannot go, so it gets no mark. */
var KBSEL=null;
function kbSelOn(){ KBSEL={}; render(); }
function kbSelOff(){ KBSEL=null; render(); }
function kbSelList(){
  var out=[], k;
  if(!KBSEL) return out;
  for(k in KBSEL) if(KBSEL.hasOwnProperty(k) && KBSEL[k]) out.push(Number(k));
  return out;
}
function kbSelTap(i){
  if(!KBSEL) return;
  if(kbIsFree(i)) return;
  if(KBSEL[i]) delete KBSEL[i]; else KBSEL[i]=1;
  render();
}
function kbSelDel(){
  var n=kbSelList().length;
  if(!n) return;
  popAsk(tn('kb.rm.n', n), function(){ kbSelDelGo(); }, t('pop.yes'));
}
/* Highest index first, so removing one does not move the next one under the
   knife -- the same reason a list is walked backwards anywhere else. */
function kbSelDelGo(){
  var ids=kbSelList().sort(function(a, b){ return b-a; }), i;
  for(i=0;i<ids.length;i++){
    if(kbIsFree(ids[i])) continue;
    KB.kbs.splice(ids[i]-1, 1);
  }
  KBSEL=null;
  var b=kbBoards();
  KB.at=kbClamp(KB.at, b.length);
  kbShow=kbClamp(kbShow, b.length);
  kbLay=0; kbSel=null;
  kbForget();
  saveKb();
  /* Onto the board it ends on, for kbDropGo()'s reason above -- this is the
     same delete done to several at once. */
  kbGo(kbShow);
}
function kbRowHTML(x, i, at){
  var sel=!!KBSEL, on=!!(sel && KBSEL[i]);
  /* AND NOT A DOOR ON THE FREE PLAN. 「編集ボタンも無料はいらんやろ」 OWNER
     2026-09-04. Board 0 is the QWERTY itself -- kbEdit() refuses it, its page
     has no editor on it, and the steps for switching it on in iOS are behind
     the ? in this screen's own bar -- so the arrow opened a page with nothing
     on it to do, and an arrow that opens nothing is the app saying there is
     more.

     The paid list keeps it, because there the board's page is where Apply is
     and choosing which keyboard goes on the phone is the one thing anybody
     does to board 0. */
  if(!can('kb'))
    return '<div class="kbrow">'+
      '<span class="kbrowk">'+kbShotHTML(x.lay)+'</span>'+
      '<span class="kbrown">'+esc(kbName(i))+'</span></div>';
  if(sel && kbIsFree(i))
    return '<div class="kbrow kbrowq">'+
      '<span class="ltck" data-sel="0"></span>'+
      '<span class="kbrowk">'+kbShotHTML(x.lay)+'</span>'+
      '<span class="kbrown">'+esc(kbName(i))+'</span></div>';
  if(sel)
    return '<div class="kbrow kbrowq">'+
      '<span class="ltck'+(on? ' on':'')+'" data-sel="1"'+DO('kbSelTap', [i])+
        ' role="button" aria-label="'+esc(t('kb.sel.row'))+'">'+
        (on? ICON_DOT : ICON_RING)+'</span>'+
      '<button class="kbrowb"' + DO('kbSelTap', [i]) + '>'+
        '<span class="kbrowk">'+kbShotHTML(x.lay)+'</span>'+
        '<span class="kbrown">'+esc(kbName(i))+'</span></button></div>';
  return '<button class="kbrow"' + DO('kbGoBoard', [i]) + '>'+
    '<span class="kbrowk">'+kbShotHTML(x.lay)+'</span>'+
    '<span class="kbrown">'+esc(kbName(i))+'</span>'+
    (i===at? '<span class="kbon">'+ICON_TICK+'</span>' : '')+
    ICON_GO+'</button>';
}
/* The keyboards there ARE, one row each, and nothing standing in for one
   there is not. 「無料に空の枠は並べない」 OWNER 2026-09-04.

   It drew a fixed number of rows for a day and filled the tail with empty
   frames, which put three keyboards on the free screen that do not exist --
   while the paid list drew only what was built, so the plan that may have one
   was shown the most rows of anybody. */
function kbListHTML(){
  var bs=kbBoards(), at=kbApplied(bs.length), rows=[], i;
  for(i=0;i<bs.length;i++) rows.push(kbRowHTML(bs[i], i, at));
  return '<div class="kblist">'+
    rows.join('')+
    '</div>'+
    /* THE SAME ROUND + AS EVERYWHERE ELSE 「追加は◉+にしてね」 -- the
       dictionary, the alphabet, the composer and the notebook all add with
       it. While choosing, the thumb is for the marks and it is not there. */
    /* And not at all in somebody else's language. langLocked() (www/core.js)
       -- 「編集不可でそのアカウントに切り替えたらダウンロードした人の言語が
       使える」 OWNER 2026-09-02. */
    /* ON EVERY PLAN, and at the bottom right where every other + is
       「＋は右下につけて」 OWNER 2026-09-04. It used to be drawn only while
       kbRoomKb() was true -- never on free -- so the one thing both lists were
       meant to share was the one thing free did not have. The ceiling is met
       on the press instead (kbCapStop), which is where this app already meets
       every other one. */
    ((!KBSEL && !langLocked())
      ? '<button class="fab"' + DO('kbNew') + ' aria-label="'+esc(t('kb.new'))+'">'+
          ICON_ADD2+'</button>'
      : '');
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
     to press.

     AND NO UPGRADE. 「upgradeはそこにはいらんくね。追加するときに出てくるよう
     にして欲しい」 OWNER 2026-09-01. It stood at the foot of this screen saying
     the one true thing, and the one true thing is about ADDING a keyboard --
     so it belongs where somebody adds one, not under a keyboard they already
     have. Under the keyboard it reads as a price on the thing above it, which
     is the free QWERTY and is not for sale.

     kbNew() and kbAdd() ask instead, which is where the app already asks
     every other question of this shape -- ltKind() on a letter, wsysSet() on
     a writing system, phGo() on a grammar stage all send somebody to the
     plans screen at the moment the act is pressed rather than standing a
     button beside it.

     AND THE FREE PLAN'S OWN FACE IS GONE, which is the whole of this change.
     「キーボードの画面無料だと何で1個なの？一覧が並ばないの？無料も有料も同じ
     画面っちうルールは？」 OWNER 2026-09-03. It returned here, above the
     list, so free never saw a list at all: one keyboard, no rows, and the
     rule 「無料でもplusでもproでも同じ画面なのよ」 broken on the screen whose
     own help sheet quotes it. There is one road down this function now and
     both plans walk it -- the list, and one keyboard's page under it.

     THE LIST HOLDS WHAT THERE IS, and the + is the one door on every plan
     「＋は右下につけて」 OWNER 2026-09-04. A free list is one row, because
     that is one keyboard; the ceiling is met when the + is pressed. */
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
    /* SELECT AT THE FAR END OF THE BAR, where the ? was 「？の位置を
       キーボード 選択 にしたい」 OWNER 2026-09-01.

       And the ? where there is nothing to select. The free plan's one board
       is board 0, which kbSelTap() refuses and which cannot be deleted, so
       Select there is a word that puts marks on nothing. What that plan needs
       in the corner is the steps -- how to switch the keyboard on in iOS --
       and this is the screen it arrives on. */
    return '<div class="view">'+navTop('', KBSEL
        ? ((kbSelList().length
              ? navDel(t('kb.sel.del'), 'kbSelDel')
              : '')+
           navDo(t('kb.sel.done'), 'kbSelOff', null, true))
        : (!can('kb')? helpQ('kb')
            : (langLocked()? ''
                : navDo(t('kb.sel'), 'kbSelOn', null, true))))+
      '<div class="body">'+
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
      kbSysHTML()+
      kbApplyHTML()+
      '</div></div>';
  /* The name on this board is typed into a buffer, so the buffer has to exist
     before the field is drawn out of it. www/shell.js § KEEP. */
  kbKeepOn();
  return '<div class="view">'+navTop('', kbMoreQ())+'<div class="body">'+
    kbNameHTML(now)+
    kbToolHTML()+
    kbHTML(kbSel)+
    kbLaysHTML()+
    /* The one control whose whole job is to change how a key LOOKS, on the
       screen the keys are on. It was on the free plan's face and on the list
       and nowhere else, so the board somebody was actually building was the
       one board you could not turn it off over -- and kbMark() draws that
       small letter on the editor's keys exactly as it draws it on the
       others. 「a lettar on each keyが2個目のキーボード作るときにないよ？」 */
    kbSysHTML()+
    kbApplyHTML()+
    '</div></div>';
}
/* The ⋯ in the bar of one keyboard's page: deleting it, and starting the
   chapter over. It was at the end of the row of tabs, which is a row that no
   longer exists. */
/* The ⋯ in the bar of one keyboard's page: deleting it, and starting the
   chapter over.

   NOT on board 0. Board 0 is the free QWERTY: it is not stored, it cannot be
   deleted, and it has no editor -- so the two things behind the ⋯ are a
   delete that refuses and a reset of a chapter this board is not part of.
   With it gone there is nothing on that page that changes anything, which is
   what makes the keyboard safe to leave open to everybody.
   「キーボード1の右上の・・・いらないから消して。そうしたら、そもそも
   キーボードはいじれないから、防げる。」 */
function kbMoreQ(){
  /* The ? in its place. There is nothing behind the ⋯ on board 0 -- so the
     corner was empty, and on the free plan that was the corner the steps used
     to be in: its one screen carried helpQ('kb') until this board became a
     page of its own. The board is the same board on both plans, so the corner
     is the same corner. 「無料でもplusでもproでも同じ画面なのよ」 */
  if(kbIsFree(kbShow)) return helpQ('kb');
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
    /* and no + when there is nowhere on this face to put the key that would
       reach the new one. A page nothing can get to is a page that does
       nothing, which is the same thing as a button that does nothing. */
    (kbLayRoom(b.lay[Math.min(kbLay, n-1)])
      ? '<button class="seg add"' + DO('kbAddLay') + ' aria-label="'+esc(t('kb.lay.add'))+'">'+
        ICON_ADD+'</button>'
      : '')+
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
function kbShotHTML(lay, src){
  var rows=(lay && lay[0] && lay[0].rows)? lay[0].rows : [], out='', i, j, k;
  for(i=0;i<rows.length;i++){
    out+='<span class="kbsr">';
    for(j=0;j<rows[i].length;j++){
      k=rows[i][j];
      out+='<span class="kbsk'+(k.k==='lt'? '' : ' fn')+(k.k==='gap'? ' gap':'')+
        '" style="flex:'+(k.w||1)+'">'+kbFace(k, src)+'</span>';
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
  /* A word in the colour everything pressable is, not a gold pill. It is a
     button drawn round a word, which is the shape the rule is about -- the
     KEYS keep their corners, because a key is the shape of the thing itself.
     「角丸とってって言ったけどキーボードは角丸でしょ？そこはいいのよ。下の
     updateとかの話。」 CLAUDE.md § NO ROUNDED BOX: what is left is the words,
     in .btn.ghost where a button is wanted. */
  return '<div class="kbapply">'+
    '<button class="btn ghost" style="width:100%"' + DO('kbApply', [now]) + '>'+
      esc(t('kb.apply'))+'</button>'+
    '</div>';
}
/* The key a touch landed on. What is under a finger is the canvas or one of
   the four flick marks as often as it is the button. */
function kbKeyAt(el){
  while(el && el.classList && !el.classList.contains('kbk')) el=el.parentNode;
  return (el && el.classList && el.classList.contains('kbk'))? el : null;
}
/* ---- a merged pair is carried as ONE thing ------------------------------
   「長押しの時は動くよ？ iPhoneのホーム画面と同じ ウェジットも2*2とかあるけど
   その分みんな動くでしょ？それと同じ」 OWNER 2026-08-27.

   A key merged with the one under it is two cells -- the tall key and the gap
   holding its room in the next row -- and the carry moved only the one under
   the finger. kbVFix() then found a tall key with no hole under it, and did
   what it is for: it took the merge apart. Nothing threw, the board drew, and
   the pair somebody made was gone.

   That is not kbVFix()'s to fix. It is the ONE place that says what a valid
   pair is, and giving it an exception would be a hole opened from a side that
   does not know the rule. What was wrong is that the carry left half behind.
   So the carry takes both, and by the time kbVFix() looks, the pair lines up
   and there is nothing to undo.

   The OTHER half, as the element standing for it. Asked once, while the
   finger goes down and the layout still says what the page says -- the model
   does not move again until the finger comes up, and data-r/data-k never
   change, so the two elements found here stay the two halves for the whole
   carry. */
function kbMateEl(el){
  var g=document.getElementById('kb'), rows=kbLayer().rows, ri, ki, k, at, di, wr;
  if(!g || !rows) return null;
  ri=parseInt(el.getAttribute('data-r'), 10);
  ki=parseInt(el.getAttribute('data-k'), 10);
  k=kbAt(ri, ki);
  if(!k || !rows[ri]) return null;
  at=kbAtOf(rows[ri], ki);
  if(kbTall(k)) wr=ri+1;
  else if(kbShadow(k)) wr=ri-1;
  else return null;
  if(!rows[wr]) return null;
  di=kbAtKey(rows[wr], at);
  if(di<0) return null;
  return g.querySelector('.kbk[data-r="'+wr+'"][data-k="'+di+'"]');
}
/* ---- A HEAD, HELD AND DRAWN ALONG ---------------------------------------
   「そこからabcdみたいに引っ張っても選択ができない。…エクセルとかなら真ん中に
   丸ポチがあって引っ張れるでしょ？」 OWNER 2026-09-05.

   The same touch road the sheet already had -- one listener on #kb, mounted
   by kbDragMount() -- because dragging a head and carrying a key are the same
   gesture asked of two things, and two roads over one sheet is two answers to
   what a finger is doing.

   The PRESS is untouched: act.js's one listener still calls kbHeadRow() or
   kbHeadCol() on the click, so a tap chooses, stands and releases exactly as
   it did. What is added is the far end, and it is only ever written by a
   finger that has MOVED -- which is what makes a drag a drag rather than a
   press that happened to wander. */
var KBHD=null;
function kbHeadAt(el){
  var c;
  while(el && el.getAttribute){
    c=' '+(el.className||'')+' ';
    if(c.indexOf(' kbcl ')!==-1) return {k:'c', el:el};
    if(c.indexOf(' kbn ')!==-1) return {k:'r', el:el};
    el=el.parentNode;
  }
  return null;
}
/* Which head it is, read off the argument the button already carries -- the
   number is written down once, in kbHdrHTML() and kbNHTML(), and this reads
   the same one rather than counting the elements again. */
function kbHeadN(el){
  var a;
  try{ a=JSON.parse(el.getAttribute('data-a')||'[]'); }catch(x){ return null; }
  return (a.length && typeof a[0]==='number')? a[0] : null;
}
function kbHeadDrag(e, p){
  var over=kbHeadAt(document.elementFromPoint(p.clientX, p.clientY)), n;
  if(!over || over.k!==KBHD.k) return;
  n=kbHeadN(over.el);
  if(n===null) return;
  if(e.preventDefault) e.preventDefault();
  /* The first move is what makes it a drag: the head it started on becomes
     the selection, exactly as a press on it would, and the one under the
     finger becomes the far end. */
  if(!KBH || KBH.k!==KBHD.k || KBH.i!==KBHD.i) KBH={k:KBHD.k, i:KBHD.i, ins:false};
  if(kbHeadJ()===n) return;
  KBH.j=n;
  kbSel=null;
  render();
}
function kbDown(e){
  var b=kbKeyAt(e.target), p=e.touches? e.touches[0] : e, mate, k, h, n;
  if(!p) return;
  h=kbHeadAt(e.target);
  if(h){
    n=kbHeadN(h.el);
    KBHD=(n===null)? null : {k:h.k, i:n};
    return;
  }
  if(!b || b.getAttribute('data-r')===null) return;
  mate=kbMateEl(b);
  /* The pair is carried by its TOP half whichever half was touched -- the top
     is the key, and the one under it is the room it takes. kbVJoin() keeps
     the upper one for the same reason. */
  if(mate){
    k=kbAt(parseInt(b.getAttribute('data-r'), 10),
           parseInt(b.getAttribute('data-k'), 10));
    if(kbShadow(k)){ var t=b; b=mate; mate=t; }
  }
  KBD={el:b, mate:mate||null, x:p.clientX, y:p.clientY, on:false, timer:0};
  /* A RUN that is being carried goes as one. 「色んなキー触ったら一気に動かせ
     たりしようよ。横と縦に限定だけど。」「縦でタップしたらそのままその2キーを
     持っていける」 OWNER 2026-08-27 -- the keys are already chosen, so what a
     hold on one of them means is "carry these", not "carry this one out of
     them". Asked once, here, while the layout still says what the page says. */
  if(!mate && kbSelN()>1 &&
     kbKeyIs(parseInt(b.getAttribute('data-r'), 10),
             parseInt(b.getAttribute('data-k'), 10))){
    KBD.run=kbSelKeys();
    KBD.runEls=kbRunEls(KBD.run);
  }
  KBD.timer=setTimeout(kbLift, 380);
}
/* ---- everything the finger is carrying ----------------------------------
   「5個とか選択したら選択したのが持ち上がって動くようにしてよ」 OWNER
   2026-08-28. Lifting, following the finger, coming out of the hit test and
   being put back down are four things done to the SAME set, and that set is
   the run when there is one and the single key otherwise. Said once here, so
   the four cannot drift apart -- the way they had, with the lift on one key
   and the landing on all of them.

   A merged pair is not in it. kbPairMove() carries the two together already,
   and the bottom half is a shadow -- the ROOM the tall key takes, drawn
   clear -- so there is nothing there to raise. */
function kbRunEls(ms){
  var g=document.getElementById('kb'), out=[], e, i;
  if(!g || !ms) return out;
  for(i=0;i<ms.length;i++){
    e=g.querySelector('.kbk[data-r="'+ms[i].r+'"][data-k="'+ms[i].i+'"]');
    if(e) out.push(e);
  }
  return out;
}
function kbCarried(){
  if(!KBD) return [];
  return (KBD.runEls && KBD.runEls.length)? KBD.runEls : [KBD.el];
}
/* dx null puts them back where the layout says they are */
function kbCarryAt(dx, dy){
  var c=kbCarried(), v=(dx===null)? '' : 'translate('+dx+'px,'+dy+'px)', i;
  for(i=0;i<c.length;i++) c[i].style.transform=v;
}
/* Out of the way of "what is under the finger", and straight back. A carried
   key is directly under the finger and lifted above the others, so it is the
   topmost thing at that point and answers the question itself. One key was
   taken out while one key moved; a run has to take out all of them, or the
   second key of it answers instead and the carry is silently refused. */
function kbCarryHit(off){
  var c=kbCarried(), i;
  for(i=0;i<c.length;i++) c[i].style.pointerEvents=off? 'none' : '';
}
function kbLift(){
  if(!KBD) return;
  KBD.on=true;
  var c=kbCarried(), i;
  for(i=0;i<c.length;i++) c[i].classList.add('lift');
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
  var p=e.touches? e.touches[0] : e;
  if(!p) return;
  if(KBHD){ kbHeadDrag(e, p); return; }
  if(!KBD) return;
  var dx=p.clientX-KBD.x, dy=p.clientY-KBD.y;
  if(!KBD.on){
    if(dx*dx+dy*dy>144){ clearTimeout(KBD.timer); KBD=null; }
    return;
  }
  e.preventDefault();
  kbCarryAt(dx, dy);
  /* The key being carried is directly under the finger -- that is what
     carrying it means -- and it is lifted above the others, so it is the
     topmost thing at that point and elementFromPoint answered with IT every
     single time. `over===KBD.el` then sent the drag home, and a key held and
     dragged across the whole keyboard never swapped with anything.
     「長押しして持っていきたいのに動かない」

     So it is taken out of the hit test for the length of the question and put
     straight back. Nothing else can be asked instead: what is wanted is the
     key UNDER the one being carried. */
  kbCarryHit(true);
  var over=kbKeyAt(document.elementFromPoint(p.clientX, p.clientY));
  kbCarryHit(false);
  if(!over || over===KBD.el) return;
  /* Into the row the finger is over, beside the key it is over -- which is
     what moving across rows means and is the half a one-dimensional grid
     never has to answer. */
  var row=over.parentNode, mine=KBD.el.parentNode, kids=row.children, a=-1, b=-1, i;
  /* AND THE ROW HAS TO HAVE ROOM. 「満杯だと追加できないから」 OWNER 2026-08-27.
     This asked nothing, so a key carried into a row that was already ten wide
     went in beside the others and made it eleven -- measured, on a qwerty
     board: [20,20,20,20,20] half columns became [22,18,20,20,20]. Rule 19 is
     what forbids it ("TEN ACROSS is the phone's number... eleven would be
     29"), and nothing throws: the board draws, saves, and reaches the phone
     as eleven keys each a little narrower.

     The gate was already here and this was the one road not through it --
     kbCellAdd(), which is the same act done with a press instead of a finger,
     has always asked kbRoomIn(). So this asks the same sentence rather than a
     new one, and somebody carrying a key into a full row now finds what
     somebody pressing an empty cell in one has always found.

     Only across rows. Inside one row nothing about the width changes, and
     asking there would count the key twice and freeze the ordering of every
     full row -- which is most of them. */
  var carried=kbKeyOfEl(KBD.el);
  if(!carried) return;
  if(mine!==row && !kbRoomFor(kbRowOf(row), carried.w)) return;
  /* A MERGED PAIR needs the row under the one it lands in, and room in both.
     「その分みんな動くでしょ？」 -- the same gate as above, asked twice, and
     no new judgement anywhere. Nothing lands in the last row, because there
     would be no row to hold the bottom half. */
  if(KBD.mate){
    if(over===KBD.mate) return;
    if(!kbPairMove(row, over, carried.w)) return;
    KBD.x=p.clientX; KBD.y=p.clientY;
    kbCarryAt(null);
    return;
  }
  if(KBD.run){
    if(!kbRunMove(row, over)) return;
    KBD.x=p.clientX; KBD.y=p.clientY;
    kbCarryAt(null);
    return;
  }
  for(i=0;i<kids.length;i++){ if(kids[i]===KBD.el) a=i; if(kids[i]===over) b=i; }
  row.insertBefore(KBD.el, (a>=0 && b>a)? over.nextSibling : over);
  /* A row emptied by the last key leaving it is a row of nothing, which is a
     gap in the keyboard that nothing can be put back into. */
  if(mine!==row && !mine.children.length) mine.parentNode.removeChild(mine);
  KBD.x=p.clientX; KBD.y=p.clientY;
  kbCarryAt(null);
}
/* ---- a RUN of chosen keys, carried as one -------------------------------
   「色んなキー触ったら一気に動かせたりしようよ。横と縦に限定だけど。」
   「縦でタップしたらそのままその2キーを持っていける」 OWNER 2026-08-27.

   ALL of them land or NONE of them do, and that is the whole of the care here.
   One key of four arriving and three staying behind is the shape that loses
   somebody's work: the board draws, the press felt like it worked, and the run
   somebody built is scattered. So every one of them comes out of the page
   first, each is asked for room in the row it is going to, and anything that
   says no puts every one of them back exactly where it was.

   ROOM IS ASKED ONE KEY AT A TIME, through the same kbRoomFor() a single carry
   asks -- and asked AFTER each one goes in, so that a run going across a row
   is counted against a row that already holds the ones before it. Asking all
   of them against the row as it was would let four keys into a row with space
   for one, four times over. */
function kbRunMove(row, over){
  var ms=KBD.run, g=document.getElementById('kb'),
      els=[], back=[], tgt=[], i, e, k, at, di, ref, r0, dir=kbSelD();
  if(!g || !ms || !ms.length) return false;
  for(i=0;i<ms.length;i++){
    e=g.querySelector('.kbk[data-r="'+ms[i].r+'"][data-k="'+ms[i].i+'"]');
    k=kbAt(ms[i].r, ms[i].i);
    if(!e || !k) return false;
    if(e===over) return false;
    els.push(e); back.push({p:e.parentNode, n:e.nextSibling, w:k.w});
  }
  /* the rows they are going to: one row for a run across, and the row under
     the last for each further key of a run down */
  if(dir==='y'){
    r0=row;
    for(i=0;i<els.length;i++){ if(!r0) return false; tgt.push(r0); r0=r0.nextSibling; }
  }else for(i=0;i<els.length;i++) tgt.push(row);
  function putBack(){
    for(i=els.length-1;i>=0;i--) back[i].p.insertBefore(els[i], back[i].n);
    return false;
  }
  for(i=0;i<els.length;i++) els[i].parentNode.removeChild(els[i]);
  for(i=0;i<els.length;i++){
    if(!kbRoomFor(kbRowOf(tgt[i]), back[i].w)) return putBack();
    if(i===0){
      if(over.parentNode!==tgt[0]) return putBack();
      tgt[0].insertBefore(els[0], over);
    }else if(dir==='x'){
      tgt[i].insertBefore(els[i], els[i-1].nextSibling);
    }else{
      /* the same column as the one above it, which is what a run DOWN is */
      at=0;
      for(var j=0;j<tgt[0].children.length;j++){
        if(tgt[0].children[j]===els[0]) break;
        k=kbKeyOfEl(tgt[0].children[j]);
        if(k) at+=kbU(k.w);
      }
      di=(at===kbUsed(kbRowOf(tgt[i])))? tgt[i].children.length : kbAtKey(kbRowOf(tgt[i]), at);
      if(di<0) return putBack();
      ref=tgt[i].children[di] || null;
      tgt[i].insertBefore(els[i], ref);
    }
  }
  /* a row emptied by the last key leaving it is a row of nothing */
  for(i=0;i<back.length;i++)
    if(back[i].p.parentNode && tgt.indexOf(back[i].p)<0 && !back[i].p.children.length)
      back[i].p.parentNode.removeChild(back[i].p);
  return true;
}
/* Both halves, or neither. It answers whether it happened, so a drop the
   sheet cannot hold leaves the pair exactly where it was rather than half
   moved -- which is the state kbVFix() would take apart.

   The bottom half comes OUT of the page first, so the columns of the row it
   is going into are counted without it; everything is put back untouched if
   any of the three questions says no. */
function kbPairMove(row, over, w){
  var tall=KBD.el, mate=KBD.mate,
      tallRow=tall.parentNode, tallNext=tall.nextSibling,
      mateRow=mate.parentNode, mateNext=mate.nextSibling,
      under, kids, a=-1, b=-1, i, at, below, di, ref, kk;
  function putBack(){
    tallRow.insertBefore(tall, tallNext);
    mateRow.insertBefore(mate, mateNext);
    return false;
  }
  mateRow.removeChild(mate);
  /* the row that will hold the bottom half: the one under where the top half
     is going. `over` may be in the row the pair already stands in. */
  under=row.nextSibling;
  if(!under || under===row){ return putBack(); }
  if(under!==mateRow && !kbRoomFor(kbRowOf(under), w)) return putBack();
  kids=row.children;
  for(i=0;i<kids.length;i++){ if(kids[i]===tall) a=i; if(kids[i]===over) b=i; }
  if(b<0) return putBack();
  row.insertBefore(tall, (a>=0 && b>a)? over.nextSibling : over);
  /* where the top half now starts, and the same column in the row below. A
     row whose keys do not break there cannot hold the other half -- which is
     kbVJoin()'s own rule ("same column, same width"), asked before the move
     rather than repaired after it. */
  /* asked of each ELEMENT and not of kbRowOf(row)[i] -- that list leaves out
     anything standing for nothing, so its i stops matching the page's i the
     moment a row holds an empty cell. Watched: it threw. */
  at=0;
  for(i=0;i<row.children.length;i++){
    if(row.children[i]===tall) break;
    kk=kbKeyOfEl(row.children[i]);
    if(kk) at+=kbU(kk.w);
  }
  below=kbRowOf(under);
  di=(at===kbUsed(below))? below.length : kbAtKey(below, at);
  if(di<0) return putBack();
  ref=under.children[di] || null;
  under.insertBefore(mate, ref);
  /* A row emptied by the last key leaving it is a row of nothing. Both rows
     the pair came out of are asked, and never the ones it went into. */
  if(tallRow!==row && tallRow!==under && !tallRow.children.length)
    tallRow.parentNode.removeChild(tallRow);
  if(mateRow!==row && mateRow!==under && !mateRow.children.length)
    mateRow.parentNode.removeChild(mateRow);
  return true;
}
function kbUp(e){
  if(KBHD){ KBHD=null; return; }
  if(!KBD) return;
  clearTimeout(KBD.timer);
  var d=KBD, g=document.getElementById('kb'), c=kbCarried(), i;
  KBD=null;
  for(i=0;i<c.length;i++){ c[i].style.transform=''; c[i].classList.remove('lift'); }
  if(g) g.classList.remove('moving');
  if(!d.on){
    /* Held long enough to wobble but let go without moving anything: still a
       hold, so the keys are drawn wobbling. */
    if(kbWob) render();
    return;
  }
  /* and the press does not also open the key it was moving */
  if(e && e.preventDefault) e.preventDefault();
  kbReadRows();
}
/* ---- the state a home screen is in while an icon is held ---------------
   Every key wobbling, and nothing in the bar.

   THERE IS NO DONE. 「並べ替え中の完了ボタンはいらない」 OWNER
   2026-09-05. A Done was a third way off a screen that already has two --
   the Save in the corner and the arrow beside it -- and it did nothing
   either of those does not do. The wobbling ends where the screen does:
   backGo() (www/shell.js) is the one road off, and a save that landed goes
   down it too.

   A press still SELECTS while it lasts, and that is a fix rather than a
   choice. This state used to strip `kbTapKey` off every key, and the reason
   written here was that a press was for the ⊖ on the key's corner -- so a key
   that also opened its own sheet would have been two answers to one press.
   The ⊖ came off. Nothing took its place, and the sentence justifying the
   strip stayed, so what was left was a keyboard where **no key answered a
   finger at all**: not to select, not to let go of a selection, and with no
   way out but Done in the bar.
   「キー触っても反応ないし、選択しているところと違うとこさわれば選択解除される
   はずなのにそれもない」 OWNER 2026-08-28.

   With no ⊖ there is no second answer to compete with, so a press means here
   what it means everywhere else on this sheet: press to select, press
   somewhere the run cannot reach to let go. A press that ENDED a carry is
   already stopped in kbUp() -- it calls preventDefault(), which is what keeps
   a key from being selected by the finger that just put it down.

   Where you are standing, so backGo() and viewReset() drop it. */
var kbWob=false;
/* The layout, read back off the screen. The keys moved in the page while the
   finger was down and the language is told once, here -- the same way the
   alphabet is told its order once, on the way up. */
/* The keys a row of the PAGE is standing for. A key being carried has moved in
   the page and not in the layout, so this is the only way to ask what a row
   holds while a finger is still down -- and it is what kbReadRows() below has
   always done to every row at once. Said once, because kbDragTo() has to ask
   it of one row before the finger comes up. */
/* The key one element on the page is standing for, or null. An empty CELL is
   a .kbk with no data-r at all -- it stands for nothing yet -- so this answers
   null for it rather than throwing, and every caller skips it. */
function kbKeyOfEl(el){
  if(!el || !el.getAttribute) return null;
  return kbAt(parseInt(el.getAttribute('data-r'), 10),
              parseInt(el.getAttribute('data-k'), 10));
}
function kbRowOf(el){
  var out=[], ks=el.children, j, k;
  for(j=0;j<ks.length;j++){
    k=kbKeyOfEl(ks[j]);
    if(k) out.push(k);
  }
  return out;
}
function kbReadRows(){
  var g=document.getElementById('kb'), lay=kbEdit(), rows=[], i, row;
  if(!g || !lay) return;
  for(i=0;i<g.children.length;i++){
    row=kbRowOf(g.children[i]);
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
/* THE MUTATING HALF, and it writes nothing. A head selection is a RUN, so one
   press of the bin can be four rows or four columns -- and four saves is four
   steps back for one press, which is not what the step back is. kbCut() loops
   these and saves once. */
function kbDelRow(ri){
  var lay=kbEdit();
  if(!lay) return;
  var rows=kbLayer().rows;
  ri=parseInt(ri, 10)||0;
  if(ri<0 || ri>=rows.length) return;
  /* Never the last row of a face, which is kbDrop()'s "never the last one"
     about the thing one size down. A face with no rows is not a face: it
     renders as nothing here, goes to the phone as a keyboard with no keys on
     it, and the only way off it would be a key that no longer exists. The
     way to be rid of a face is the x beside the tabs. */
  if(rows.length<2) return;
  rows.splice(ri, 1);
}
/* A column, in whole keys, taken out of every row -- and a key that is wider
   than one column loses a column and stays. That is the half of this the word
   "delete" does not say: on a sheet, taking column c out of a row where one
   cell spans b to d leaves that cell spanning b to c. A key of three becomes
   a key of two.

   Counted in half columns, because a key can be half of one -- kbU() above
   says why. What is left is rounded back to keys, and anything that comes out
   at nothing goes.

   The mutating half, writing nothing, for kbDelRow()'s reason above. */
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
}
/* ---- the step back, and the step forward again -------------------------
   Where the editor has been, as whole layouts. It is in memory and in memory
   only: what is stored is the keyboard, and this is the last forty things the
   keyboard was on this visit.

   ONE PLACE records it -- kbNoted() -- rather than the thirty mutators:
   kbDelRow, kbDelCol, kbDelKey, kbAddKey, kbSetW, kbSetKind, kbLtPut, the drag.
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
  str=kbLaySig(b);
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
   keyboard arriving. So making one and deleting one both forget.

   The SELECTION goes with it for the same reason and it is the same sentence:
   "row 3" means row 3 of a board, and the board is gone. Leaving it behind
   lights up a row of the new keyboard that nobody pressed, with the bin above
   it up and ready. viewReset() clears it on the way to another screen; this
   is the other way to arrive somewhere else without leaving the screen.

   AND THE BUFFER THE SAVE READS, for the same sentence a third time. It is
   filed under the board's PAGE (kbKeepLay above), so a board deleted out from
   under a page leaves what it opened with sitting there as what the next
   board's change is measured against -- and the Save came up gold on a
   keyboard nobody had touched. Every one of them goes, not the page you are
   standing on: the boards below a deleted one all slide, so every page from
   there down is now about a different keyboard. */
function kbForget(){
  KBU={id:'', cur:'', u:[], r:[]}; KBH=null;
  var k;
  for(k in KEEP) if(KEEP.hasOwnProperty(k) && k.indexOf('kb|')===0) keepDrop(k);
}
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
/* The buttons over the sheet. The two steps are always there and are down
   when there is nowhere to go; the three that say where a row's slack goes
   and the one that takes a thing away are down until something is selected,
   because that is what they act ON. A button that can be pressed and does
   nothing is the app saying it did something.

   Aligning is a ROW's question and only a row's: a column has no slack across
   it to put anywhere. Selecting a column leaves those three down and the bin
   up, which is the whole of what a column selection is for. */
function kbTb(name, icon, label, off){
  return '<button class="kbtb'+(name==='kbCut'? ' bad':'')+'"' + DO(name) +
    (off? ' disabled' : '') + ' aria-label="'+esc(label)+'">'+icon+'</button>';
}
/* The arrow-into-a-line of ICON_INUP / ICON_INDN, turned a quarter: which
   SIDE of the line the new column lands on. They are here rather than beside
   their two siblings in glyph.js because glyph.js is being changed on three
   other branches today -- docs/BACKLOG.md carries the move. www/home.js
   already draws an icon of its own, so this is not a new kind of thing. */
var ICON_INLF='<svg class="ic" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" '+
  'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M19 4v16"/><path d="M15 12H5"/><path d="M9 8l-4 4 4 4"/></svg>';
var ICON_INRT='<svg class="ic" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" '+
  'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M5 4v16"/><path d="M9 12h10"/><path d="M15 8l4 4-4 4"/></svg>';
/* Two keys becoming one, and the key's own sheet. They are here rather than
   in glyph.js for ICON_INLF's reason -- that file is held elsewhere today,
   and www/home.js already draws one of its own. */
var ICON_JOIN='<svg class="ic" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" '+
  'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M4 6v12"/><path d="M20 6v12"/><path d="M9 12h6"/>'+
  '<path d="M11 9l-2 3 2 3"/><path d="M13 9l2 3-2 3"/></svg>';
/* OPENING THE KEY THAT IS SELECTED, and it is a PENCIL.
   「編集のマークもなんか削除っぽいから編集っぽいマークにして欲しい」 OWNER
   2026-08-28. It was a rectangle with a bar across the middle of it, which is
   a key with a MINUS on it -- the same shape as taking something away, one
   button along from the bin, on the one screen where a wrong press deletes a
   row of somebody's keyboard. Nothing about that could throw: the button
   worked, and the picture said the opposite of what it did.

   The same drawing as ICON_PEN in glyph.js, at the size and the weight the
   rest of this toolbar is (19px, 1.7). It is written out here rather than
   shared for the reason ICON_INLF gives above -- glyph.js is being changed on
   other branches today -- and docs/BACKLOG.md carries the move. */
var ICON_KEYSET='<svg class="ic" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" '+
  'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M4 20h4L19.2 8.8a2 2 0 0 0-2.8-2.8L5 17.2V20Z"/>'+
  '<path d="M15.2 7.2 18 10"/></svg>';
function kbToolHTML(){
  var row=!!KBH && KBH.k==='r', col=!!KBH && KBH.k==='c',
      key=!!KBH && KBH.k==='k', ask=!!KBH && !!KBH.ins,
      /* An empty frame of the sheet. What acts on it is the one button that
         puts a key in -- of that frame's width -- because that is what there
         is to do to a frame. 「キーを入れるのはシートの上の帯のボタン」 */
      cell=!!KBH && KBH.k==='f',
      /* and whether that row may be pushed left or right at all. A row with
         half a merge in it may not: where a merged pair goes when its row is
         pushed is the OWNER's and has not been asked, and moving one half
         and not the other is not an answer to it. */
      al=row && !kbRunTied();
  return '<div class="kbtool">'+
    kbTb('kbUndo', ICON_UNDO, t('kb.undo'), !KBU.u.length)+
    kbTb('kbRedo', ICON_REDO, t('kb.redo'), !KBU.r.length)+
    '<span class="kbtgap"></span>'+
    (ask
      ? (col
          ? '<button class="kbtb"' + DO('kbInsCol', [false]) +
              ' aria-label="'+esc(t('kb.col.l'))+'">'+ICON_INLF+'</button>'+
            '<button class="kbtb"' + DO('kbInsCol', [true]) +
              ' aria-label="'+esc(t('kb.col.r'))+'">'+ICON_INRT+'</button>'
          : '<button class="kbtb"' + DO('kbIns', [false]) +
              ' aria-label="'+esc(t('kb.row.up'))+'">'+ICON_INUP+'</button>'+
            '<button class="kbtb"' + DO('kbIns', [true]) +
              ' aria-label="'+esc(t('kb.row.down'))+'">'+ICON_INDN+'</button>')
      : cell
        ? '<button class="kbtb"' + DO('kbCellAdd') +
            (kbCellFits()? '' : ' disabled') +
            ' aria-label="'+esc(t('kb.cell.add'))+'">'+ICON_ADD+'</button>'
      : key
        /* KEYS are selected, and WHICH buttons is how many.
           「編集ボタンは1キー選択時のみ」 OWNER 2026-08-27 -- a key's page is
           about one key, and offering it over four would have to pick one.
           Joining is the other way round: it is about two, so it stands where
           the edit button does when there is only one. */
        ? (kbSelN()===1
            ? '<button class="kbtb"' + DO('kbOpenSel') +
                ' aria-label="'+esc(t('kb.key.open'))+'">'+ICON_KEYSET+'</button>'
            : '<button class="kbtb"' + DO('kbJoinSel') + (kbJoinable()? '' : ' disabled') +
                ' aria-label="'+esc(t('kb.key.join'))+'">'+ICON_JOIN+'</button>')
        : '<button class="kbtb"' + DO('kbAlign', ["l"]) + (al? '' : ' disabled') +
            ' aria-label="'+esc(t('kb.al.l'))+'">'+ICON_ALL+'</button>'+
          '<button class="kbtb"' + DO('kbAlign', ["c"]) + (al? '' : ' disabled') +
            ' aria-label="'+esc(t('kb.al.c'))+'">'+ICON_ALC+'</button>'+
          '<button class="kbtb"' + DO('kbAlign', ["r"]) + (al? '' : ' disabled') +
            ' aria-label="'+esc(t('kb.al.r'))+'">'+ICON_ALR+'</button>')+
    /* 「最大になったら+はなし」 -- down, which is what this button has always
       done when a row is as tall as it may get, and what the three beside it
       do when nothing is selected. The toolbar keeps its shape; the dashed row
       at the FOOT of the sheet is the one that goes away entirely, because
       that one is drawn where a row would go rather than sitting in a row of
       buttons. */
    (key || cell? ''
      : '<button class="kbtb'+(ask? ' on':'')+'"' + DO('kbInsAsk') +
        (kbInsRoom()? '' : ' disabled') +
        ' aria-label="'+esc(t(col? 'kb.col.ins' : 'kb.row.ins'))+'">'+ICON_ADD+'</button>')+
    /* and the bin is DOWN on a frame. There is nothing in it to take away,
       and a button that can be pressed and does nothing is the app saying it
       did something. */
    (ask? '' : kbTb('kbCut', ICON_BIN, t('kb.cut'), !KBH || cell))+
    '</div>';
}
/* Making another is choosing a pattern again, on a screen of its own rather
   than a row that pushes the keyboard off the page. */
function kbNew(){
  /* The ceiling, met on the press, and it is the SAME answer every other +
     in the app gives. It used to open a screen of its own -- the five
     arrangements drawn, each a way to the plans page -- and that is a
     different screen for the free plan, which is the thing being taken out
     everywhere else: 「なんでプロの画面から使えって言ってんのに別の画面が
     出るの？」 OWNER 2026-09-01. */
  if(kbCapStop()) return;
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
  /* 確認は自前のポップで。「標準は使わねえって言ってるだろこれも禁止や」
     OWNER 2026-09-01 -- confirm() は使わない。はいの側がこの下。 */
  popAsk(t('kb.pat.q'), function(){ kbSetPatGo(pat); }, t('pop.yes'));
}
/* The yes side of the one ask above. It looks the board up again rather than
   closing over it: the ask is a screen the person stands in front of, and the
   board can have gone by the time they answer. */
function kbSetPatGo(pat){
  var x=KB.kbs[kbShow-1];
  if(!x) return;
  x.pat=pat; x.lay=kbBlank(kbPatLay(pat));
  kbLay=0; kbSel=null;
  saveKb();
  /* Back onto the keyboard whose arrangement this just changed, which is the
     one screen that shows the change. */
  kbGo(kbShow);
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
  /* The four steps are the same on every plan, because the KEYBOARD is on
     every plan: free types on the QWERTY of drawn letters and has to turn it
     on in iOS exactly as anybody else does. It used to REPLACE them with
     three lines about upgrading, which left a free phone with the keyboard
     and no way to be told how to switch it on -- and it is what put
     kbSettings() where the free walk could never reach it.

     The upgrade lines are kept and moved to the FOOT, after the steps:
     「無料プランのキーボードは編集ができません。／自作キーボードを作りたい
     場合はアップグレードしてください。／アップグレードする。」 OWNER
     2026-08-28 is answered, and 「無料でもplusでもproでも同じ画面なのよ」
     OWNER 2026-09-01 decides which way round the two go. */
  return {t:t('kb.sys.h'), h:
    /* AND THE WAY INTO SETTINGS IS ON THE FIRST STEP TOO.
       「後これも、この画面まで飛ぶリンクあったはずなのに無くなった？」then
       「１にもほしくない？」 OWNER 2026-09-03. It was on step 3 only, which is
       three steps in -- and step 1 is where somebody is being sent to
       Settings for the first time.

       The SAME kbSettings(), the same t('kb.sys.go'): one function and one
       string named from two places. What it opens is Settings → Lingua
       (openSettingsURLString is Apple's only public door -- LinguaShare.swift
       says so), which is not step 1's own row; Settings → General → Keyboard
       has no public URL. So this is the door into Settings, and the path
       under it is what says where to walk from there. */
    kbStepHTML(1, t('kb.step1'), '<div class="mini">'+t('kb.step1.d')+'</div>'+
      '<button class="btn" style="width:100%;margin-top:10px"' + DO('kbSettings') + '>'+
        esc(t('kb.sys.go'))+'</button>'+
      kbShot('kb-list.jpg'))+
    kbStepHTML(2, t('kb.step2'), kbShot('kb-add.jpg'))+
    kbStepHTML(3, t('kb.step3'),
      '<button class="btn" style="width:100%;margin-top:10px"' + DO('kbSettings') + '>'+
        esc(t('kb.sys.go'))+'</button>'+
      kbShot('kb-app.jpg'))+
    kbStepHTML(4, t('kb.step4'), kbShot('kb-full.jpg'))+
    (can('kb') ? '' :
      '<div class="note" style="margin-top:16px">'+esc(t('kb.free.no'))+'</div>'+
      '<div class="note">'+esc(t('kb.free.up'))+'</div>'+
      '<button class="btn ghost" style="width:100%;margin:12px 0 4px"' + DO('goPlans') + '>'+
        esc(t('kb.up.go'))+'</button>')};
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
/* Is there anywhere on this face to put a key that goes to another one, and
   putting it there. At the front of the last row, which is where every phone
   keeps its 123 and where kbDefault() has always put it; failing that, a row
   of its own. Failing both, the face is as big as a face may get and the
   answer is no -- which is why the + is not drawn.  */
/* Whether a key to another face can go on this one. THREE places it can go,
   and they are kbFacePut()'s three -- a gap that is already there, a space
   bar that can give up a key's width, or a row of its own.

   It used to know only the last two, and the day the ceiling came down to
   five that stopped being enough: the free QWERTY is exactly five rows and
   every one of them comes to ten, so a board shaped like it could take no
   new row AND no new face. kbAddLay() simply did nothing, which is a + that
   can be pressed and does not work.

   So the two of them are one question with one answer now. kbFacePut() is
   where it lives, because it is the one that knows about gaps -- a flick
   board's fourth column is gaps from its fourth row down, and that is a slot
   sitting there on a board every one of whose rows is full. */
function kbLayRoom(face){
  var rows=face && face.rows, i, j;
  if(!rows || !rows.length) return true;
  for(i=0;i<rows.length;i++)
    for(j=0;j<rows[i].length;j++){
      if(rows[i][j].k==='gap' && rows[i][j].w>=1) return true;
      if(rows[i][j].k==='sp' && rows[i][j].w>1) return true;
    }
  if(kbUsed(rows[rows.length-1])+2<=KB_COLS) return true;
  return rows.length<kbRowsMax();
}
function kbLayPut(face, v){ return kbFacePut(face, v); }
/* NO FACE IS A DEAD END, and that is the sentence above one step further out.
   「2ページ目から戻るボタンがない」 OWNER, build #92.

   kbAddLay() puts the way there and the way back on at the moment a page is
   made, and it does that correctly. What nothing held is that they STAY: the
   two deletes on the sheet take keys away by the row and by the column, and
   the back key is a key. Standing on page 2 of a page somebody has just made
   -- one row, the back key and one empty slot -- and pressing the row's
   number leaves that face with NO ROWS AT ALL, which on the phone is a blank
   keyboard nobody can get off. The column does it too, from the other side.

   Neither throws. The editor draws a face with nothing on it perfectly
   happily, the tab bar still says 2, and every check was green -- the trap is
   only ever reached by somebody typing on a real phone, which is where it was
   found.

   ONE PLACE, and it is saveKb(), for kbNoted()'s own reason one line up:
   saveKb() is what every change to a keyboard ends in, so it cannot be
   forgotten. The alternative was the same three lines in kbDelRow, kbDelCol
   and kbDelKey, which is three places each remembering a rule.

   It only ever ADDS, and only where there is nothing: a face that already
   carries a way off keeps exactly the keys it has, in the order it has them.
   To be rid of a face there is the x beside the tabs -- kbDropLay() -- which
   is the thing the row delete was being used as and is not.

   It repairs as well as prevents. A keyboard whose page 2 lost its way back
   on an earlier build gets it again the first time anything on that keyboard
   is changed. Nothing walks the boards nobody is editing: kbEdit() is the one
   in front of somebody, and rearranging a keyboard they are not looking at is
   the thing this rule exists to stop. */
function kbWayOff(){
  var b=kbEdit(), i, j, k, rows, has;
  if(!b || !b.lay || b.lay.length<2) return;
  for(i=0;i<b.lay.length;i++){
    has=false;
    rows=b.lay[i].rows;
    for(j=0;j<rows.length && !has;j++)
      for(k=0;k<rows[j].length;k++)
        if(rows[j][k].k==='lay'){ has=true; break; }
    /* Face 0 is the way IN to the rest, so its missing key is the same hole
       seen from the other end: with nothing on it pointing anywhere, every
       page after it is unreachable rather than inescapable. */
    if(!has) kbLayPut(b.lay[i], i===0? 1 : 0);
  }
}
/* A page arrives with the way THERE and the way BACK already on it.
   「2ページ目作ったときの切り替えボタンは？」「ページを作るなら切り替えボタン
   は必須ね？」

   It used to arrive as one empty key and nothing else, and the keys that
   reach a face have always had to be placed by hand -- so the ordinary way to
   use this was to add a face, put letters on it, and find there was no way to
   it and no way off it. docs/keyboard.md said so in four steps, which is a
   manual page standing in for the thing working.

   kbDefault() has done this from the beginning for the digits face it builds:
   a key to 1 on the first, a key to 0 on the second. This is that, for a face
   somebody adds. Nothing is overwritten -- the key goes IN at the front of a
   row, or into a row of its own. */
function kbAddLay(){
  var b=kbEdit(), from;
  if(!b) return;
  from=kbClamp(kbLay, b.lay.length);
  if(!kbLayRoom(b.lay[from])) return;
  b.lay.push({rows:[[kbKey('lay', String(from)), kbKey('lt', '')]]});
  kbLayPut(b.lay[from], b.lay.length-1);
  kbLay=b.lay.length-1;
  kbSel=null;
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
  /* 確認は自前のポップで。「標準は使わねえって言ってるだろこれも禁止や」
     OWNER 2026-09-01 -- confirm() は使わない。はいの側がこの下。 */
  popAsk(t('kb.lay.rm.q'), function(){ kbDropLayGo(i); }, t('pop.yes'));
}
function kbDropLayGo(i){
  var b=kbEdit(), j, k, r, key, n;
  if(!b) return;
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
  /* 確認は自前のポップで。「標準は使わねえって言ってるだろこれも禁止や」
     OWNER 2026-09-01 -- confirm() は使わない。はいの側がこの下。 */
  popAsk(t('kb.reset.ask'), function(){ kbResetGo(); }, t('pop.yes'));
}
function kbResetGo(){
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
  kbSel={r:ri, k:ki};
  /* ARRIVING IS ARRIVING: nothing is chosen on a screen you have just opened.
     「終わって戻ったら選択が解除されてる状態にして欲しい」OWNER 2026-09-03.
     This is the whole of that face of it -- there is no "on the way out" to
     write, because coming back and opening the key again comes through here.
     kbLtDraw() is what paints this screen WITHOUT arriving on it. */
  kbLtPick=null;
  kbKeyForm(ri, ki);
}
/* The key's screen, drawn. Separated from kbPick() above for one reason: the
   bar's confirm is part of what openForm() opens, so choosing a letter has to
   rebuild the whole form -- and doing that through kbPick() would forget the
   choice that had just been made. */
function kbKeyForm(ri, ki){
  openForm('kbkey:'+ri+':'+ki, t('kb.key'), kbKeyHTML(ri, ki), function(){ geTiles(); },
           kbLtPutBtn());
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
    [1,2,3,4].filter(function(w){
      return (key.w||1)===w || kbFitsW(ri, ki, w);
    }).map(function(w){
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
/* THE SHAPE, WITH THE NAME SMALL UNDER IT. 「選んだ文字の形を上の四角に」
   OWNER 2026-09-05. It was the name and nothing else -- ltInk()'s fallback,
   reached because a letter's shape and its name were two answers to the
   square and only one of them fitted. The square is what says WHAT IS ON THIS
   KEY, and what is on a key of this app is a letter somebody drew: answering
   with the roman it happens to be filed under is the app showing its own
   filing rather than the alphabet.

   A letter with nothing drawn on it has only its name, and keeps it -- that
   is ltInk() answering empty, not a second branch of this. The name goes
   small only when there is a shape over it to be small under. */
function kbSlotFace(lid){
  var l=lid? ltById(lid) : null, ink;
  if(!l) return '<span class="kbsx">'+ICON_ADD+'</span>';
  ink=ltInk(l, '', 'midink');
  if(!ink) return '<span class="kbl">'+esc(ltName(l)||'·')+'</span>';
  /* Written here rather than in www/index.html because that file is another
     session's this week. Nothing here is a border or a corner (CLAUDE.md
     § 18) -- it is a stack and a type size. */
  return '<span style="display:flex;flex-direction:column;align-items:center;'+
    'justify-content:center;gap:2px">'+ink+
    '<span class="kbl" style="font-size:.6rem;line-height:1">'+
    esc(ltName(l)||'·')+'</span></span>';
}
/* WHAT THE SQUARE SHOWS IS WHAT HAS BEEN CHOSEN, when something has.
   Choosing writes nothing until the confirm (kbLtPut below), so the square
   read the key and the key still held what it held -- press a letter and the
   cell went purple while the square over it went on saying the old thing, or
   nothing at all. The purple and the square are one answer to one question
   and it is asked in one place, kbLtAt(). */
function kbSlotBtn(cls, lid, ri, ki, dir, label){
  var p=kbLtAt(ri, ki, dir);
  if(p) lid=p.v;
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
/* And the board: the full width, always, however few keys are on this face.

   It used to be `--kbw / KB_COLS * cols`, which drew a face of two keys a
   FIFTH of the phone across -- and everything standing on it with it. That is
   both of build #92's width reports in one line: a flick board's keys came
   out the size of a QWERTY's, and the dashed + that adds a row to a page
   somebody had just made came out 60px wide against 320 on page one, which
   reads as「行は2ページ目から追加できない」.

   The stylesheet still owns every NUMBER -- --kbw and --kbgap are its. */
function kbSheetW(){
  return 'var(--kbw)';
}
/* And how tall a row of it is, which is the same statement one axis over and
   was the only thing left saying a number of its own.
   「キーボードの高さは画面の半分までってルールあるのになんで七も足したら7割
   埋まるけど」 OWNER 2026-08-27.

   `.kb.kbsheet` said `--kh:44px`, a FIXED pixel height, while the phone's row
   is the short side x KB_ROWW -- 44.3pt on the narrowest iPhone and 60.9 on a
   Pro Max. So the sheet was 388px tall whatever phone it was drawn on: 40.6%
   of a Pro Max and 68.3% of an SE. The seven tenths the owner was looking at.

   The sheet is --kbw across, so a row of it is --kbw x KB_ROWW: the whole
   board at the same scale, down as well as across. The stylesheet's 44px
   stays as what it always was -- the value for a phone this was measured on
   -- and this overrides it, the way kbSheetW() overrides the width. */
function kbSheetH(){
  return 'calc(var(--kbw) * '+KB_ROWW+')';
}
/* Which slot the alphabet is being opened for. */
var kbSlotFor=null;
function kbSlot(ri, ki, dir){
  kbSlotFor={r:ri, k:ki, d:dir};
  /* Arriving, the same as kbPick() above and for the same sentence. */
  kbLtPick=null;
  kbSlotForm(ri, ki, dir);
}
/* And the sheet, drawn -- kbKeyForm()'s twin, for kbKeyForm()'s reason. */
function kbSlotForm(ri, ki, dir){
  openForm('kbslot:'+ri+':'+ki+':'+dir, t('toc.letters'), kbLtHTML(), function(){ geTiles(); },
           kbLtPutBtn());
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
   same slot.

   NARROWED THE WAY THE ALPHABET'S OWN PAGE IS NARROWED.
   「絞り込みと検索が欲しいね。」 OWNER 2026-08-27, on 「レター多くなったら
   選ぶのキツくね？」.

   This laid the whole alphabet out, every letter, always. Thirty-eight is a
   glance and the free plan never reaches this screen at all -- board 0 has no
   editor -- so the list this actually draws is the PAID one, which is the
   only one that grows: three hundred letters is three hundred tiles to find
   one in with your eyes.

   The same list is already drawn one chapter over, on vLtset, and that page
   has had an order and a filter since 「これ並び替え、絞り込み追加しよう。
   アルファベット順、作成順とか」. So this is not a second set of tools; it is
   the same expression vLtset builds its list with, asked from here --
   ltPickList() over ltOfKind('alpha'), and ltViewRow() for the box and the
   two buttons that drive it. Nothing new is stored.

   Which also means the DEFAULTS are not decided here -- they are ltSort,
   ltFil and ltQ in sound.js, and where somebody left them on one screen is
   where they are on the other. viewReset() forgets all three, so arriving in
   another language does not arrive with a search on.

   The ltOrder() that used to wrap this was a second sort over a sorted list:
   ltOfKind('alpha') ends in ltOrder() itself. */
function kbLtGrid(ri, ki, dir){
  /* The cells alone, so typing in the search repaints them without rebuilding
     the field being typed into -- ltPaint() calls this, and vLtset leaves the
     same kind of function behind. Both screens put them in #lt-list. */
  function cells(){
    var ls=ltPickList(ltOfKind('alpha'));
    if(!ls.length) return '<div class="note">'+t('lt.none')+'</div>';
    return '<div class="ltgrid">'+ls.map(function(l){
      return '<button class="ltc"'+kbLtOnCSS(ri, ki, dir, l.id) +
        DO('kbLtTap', [ri, ki, dir, l.id]) + ' aria-label="'+
        esc(ltName(l)||t('lt.reads.none'))+'">'+
        '<span class="ltcf">'+ltInk(l, '<span class="nol"'+
          kbLtOnInk(ri, ki, dir, l.id)+'>'+ICON_PEN+'</span>')+'</span>'+
        '<span class="ltcn"'+kbLtOnInk(ri, ki, dir, l.id)+'>'+
        esc(ltName(l)||t('lt.reads.none'))+'</span></button>';
    }).join('')+'</div>';
  }
  ltReList=cells;
  return ltViewRow()+
    /* "Nothing in this slot" is a choice like any other, so it is CHOSEN like
       any other and waits for the same confirm. Leaving it applying on the
       press would be the thing that must not happen -- two mechanisms writing
       one field, one of them still 「触ったら効く」. */
    '<button class="btn ghost" style="width:100%;margin:10px 0'+
      kbLtOnPaint(ri, ki, dir, "")+'"' +
      DO('kbLtTap', [ri, ki, dir, ""]) + '>'+t('kb.empty')+'</button>'+
    '<div id="lt-list">'+cells()+'</div>';
}
function kbLtHTML(){
  var s=kbSlotFor;
  if(!s) return '<div class="note">'+t('form.gone')+'</div>';
  return kbLtGrid(s.r, s.k, s.d);
}
/* ---- what has been CHOSEN on the alphabet, and the confirm over it -------
   「ここに右上に選択したら適用ボタンが確定ボタン欲しい。終わって戻ったら選択が
   解除されてる状態にして欲しい。後選択してる紫はもう一度同じ場所触れたら解除
   して欲しい」 OWNER 2026-09-03.

   Three sentences and ONE shape. A letter used to go onto the key the instant
   it was touched -- kbPut() wrote it, saved, and redrew. That is gone rather
   than fenced off: a confirm added beside a press that still wrote would be
   two mechanisms deciding one field, and CLAUDE.md's 「修正ではなく書き換え」
   is exactly about the moment you reach to add the second one. So the press
   REMEMBERS and nothing else, and one road writes -- kbLtPut() below, the
   button in the bar.

   The three sentences fall out of that one shape:
     the confirm is here only while something is chosen  -> kbLtPutBtn()
     touching the chosen one again puts it down          -> kbLtTap()
     the screen opens with nothing chosen                -> kbPick(), kbSlot()

   And what is chosen is WHERE YOU ARE STANDING, not anything the language
   has: no slice, no key, no property on a row -- JSON.stringify drops those
   in silence (CLAUDE.md § 19). It is one variable, and viewReset() drops it
   with kbSel and kbSlotFor.

   {r, k, d, v} and not just the letter, because the same grid is drawn for
   the key itself (d = -1) and for each of a flick key's four corners: a
   choice made for one corner is not a choice made for the next. */
var kbLtPick=null;
/* What has been chosen FOR THIS SLOT, or null. One place, because two things
   ask it: the purple on the cell, and the square over the alphabet that says
   what is on the key. */
function kbLtAt(ri, ki, dir){
  return (kbLtPick && kbLtPick.r===ri && kbLtPick.k===ki && kbLtPick.d===dir)
    ? kbLtPick : null;
}
function kbLtIs(ri, ki, dir, lid){
  var p=kbLtAt(ri, ki, dir);
  return !!p && p.v===lid;
}
/* Painted the purple this chapter already paints a chosen thing -- the row's
   band, the column's band, a chosen key. kbPickPaint() is the one place that
   says what that purple is, so a cell and a key cannot come to wear two.
   The name under the letter, and the pen a letter with nothing drawn on it
   wears, carry their own greys -- so they are told to take the cell's. What
   IS drawn stays its own ink, because that is the letter. Nothing here is a
   border or a corner (CLAUDE.md § 18). */
function kbLtOnPaint(ri, ki, dir, lid){
  return kbLtIs(ri, ki, dir, lid)? kbPickPaint() : '';
}
function kbLtOnCSS(ri, ki, dir, lid){
  return kbLtIs(ri, ki, dir, lid)? ' style="'+kbPickPaint().slice(1)+'"' : '';
}
function kbLtOnInk(ri, ki, dir, lid){
  return kbLtIs(ri, ki, dir, lid)? ' style="color:inherit"' : '';
}
/* The confirm, in the bar, top right, where openForm() puts one. Nothing is
   chosen -> there is no button, which is 「何も選んでいなければ出ない」. */
function kbLtPutBtn(){
  return kbLtPick? navDo(t('kb.lt.ok'), 'kbLtPut', null, true) : '';
}
/* A cell pressed. It is chosen, or -- if it is the one already chosen -- it
   is put down again. 「もう一度同じ場所触れたら解除」 */
function kbLtTap(ri, ki, dir, lid){
  kbLtPick=kbLtIs(ri, ki, dir, lid)? null : {r:ri, k:ki, d:dir, v:lid};
  kbLtDraw(ri, ki, dir);
}
/* WHICH OF THE TWO SCREENS THE ALPHABET IS ON, asked once, and asked of the
   ROUTE. kbSlotFor is a note the sheet leaves for itself, and backing out of
   the sheet without choosing leaves it lying there -- so a letter chosen
   afterwards on the key's own screen read that note, believed it was on the
   sheet, and went back one screen too far. That was already true of the
   press that wrote (kbPut() read the same note); deferring the write to a
   confirm only made it easier to reach. One question, one place. */
function kbLtWhere(){ return formArg(here().a).kind; }
/* Painting the screen again, which is not arriving on it. The two openers
   above forget the choice; this one keeps it. */
function kbLtDraw(ri, ki, dir){
  var w=kbLtWhere();
  if(w==='kbslot') kbSlotForm(ri, ki, dir);
  else if(w==='kbkey') kbKeyForm(ri, ki);
}
/* And the one road that WRITES. One letter into one slot, from either screen:
   the sheet that only holds the alphabet, and the key's own screen where it
   sits under the key.

   ONE saveKb(), so the confirm is ONE step back -- 「確定を押した一回が、戻る
   一歩」. Choosing writes nothing and saves nothing, so no history is piled up
   by a finger moving over the alphabet. */
function kbLtPut(){
  var p=kbLtPick, key;
  if(!p) return;
  if(!kbEdit()) return;
  key=kbAt(p.r, p.k);
  if(!key) return;
  if(p.d<0) key.v=p.v; else key.f[p.d]=p.v;
  saveKb();
  /* THE CONFIRM IS ONE STEP BACK, from wherever it was pressed.
     「キー選んで確定押したらキーボード編集画面に戻ってくれ」 OWNER 2026-09-05,
     and 「確定を押した一回が、戻る一歩」 before it -- one sentence said of both
     screens now. From the sheet for one corner, the step back is the key it
     belongs to; from the key's own screen it is the sheet the key is on.

     It used to END on the key's own screen -- kbPick() again, which is
     arriving on it a second time. The letter was on the key and the screen
     was still the one it had been chosen on, so getting out of a key was the
     arrow: once for the key, and once more for the grid under it. */
  kbLtPick=null;
  if(kbLtWhere()==='kbslot'){ kbSlotFor=null; back(); kbPick(p.r, p.k); return; }
  back();
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
/* Making a key wider is adding columns to its row, so it is the same
   question. A width that will not fit is not offered -- kbKeyHTML() takes the
   four buttons from here -- and this refuses it as well, because a route can
   be come back to. */
function kbFitsW(ri, ki, w){
  var row=kbLayer().rows[ri], key=kbAt(ri, ki);
  if(!row || !key) return false;
  return kbUsed(row)-kbU(key.w)+kbU(w)<=KB_COLS;
}
function kbSetW(ri, ki, w){
  if(!kbEdit()) return;
  var key=kbAt(ri, ki); if(!key) return;
  if(!kbFitsW(ri, ki, w)) return;
  key.w=w; saveKb(); kbPick(ri, ki);
}
function kbAddKey(ri, ki, w){
  if(!kbEdit()) return;
  var rows=kbLayer().rows, k;
  if(!rows[ri]) return;
  if(!kbRoomIn(ri, w)) return;
  k=kbKey('lt', '');
  if(w>1) k.w=w;
  rows[ri].splice(ki+1, 0, k);
  saveKb();
  /* Placed from the keyboard, the key is opened so the letter can go on it --
     which is the next thing anybody does. Placed from the key's own sheet,
     that sheet is closed first. */
  if(here().r==='form') back();
  kbPick(ri, ki+1);
}
/* The row that is not there yet. Pressing it with a width chosen puts that
   key in a new row; pressing it with none adds the empty row it always did. */
/* A row with nothing left in it is not a row. */
/* KEYS, and ONE step back for the press that took them. Each of these used to
   be its own kbDelKey() and so its own saveKb(), which is its own entry in the
   history -- so the bin taking four keys took four presses of the step back to
   put right. One press, one step: that is what the step back is FOR, and it is
   the same sentence as「巻き戻しボタンと進むボタンも入れよう」.

   Right to left, so the indexes of the keys not yet taken do not move under
   it. A vertical run is in different rows, where they never would. */
function kbDelKeys(ms){
  if(!kbEdit()) return;
  var rows=kbLayer().rows, j, row;
  for(j=ms.length-1;j>=0;j--){
    row=rows[ms[j].r];
    if(row) row.splice(ms[j].i, 1);
  }
  for(j=rows.length-1;j>=0;j--) if(!rows[j].length) rows.splice(j, 1);
  if(!rows.length) rows.push([kbKey('lt', '')]);
  saveKb(); kbSel=null;
  /* From the ⊖ the keyboard is already on screen and the wobble stays on --
     somebody taking one key off is usually taking two. From the key's own
     sheet there is a sheet to close. */
  if(here().r==='form'){ back(); return; }
  render();
}
function kbDelKey(ri, ki){ kbDelKeys([{r:ri, i:ki}]); }
