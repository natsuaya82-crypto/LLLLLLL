/* Lingua — numbers (chapter 18)
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   A digit is a letter.

   That is the whole design and it is worth saying plainly, because the
   alternative -- a second kind of thing with its own store, its own list, its
   own way of being drawn -- would mean a second copy of the drawing surface,
   the font writer, the borrow-a-character picker and the letters chapter. All
   of that already works and none of it cares whether the shape it is holding
   means a sound or a quantity.

   So a letter carries a value as well as a reading, and a letter that has one
   is a digit. Nothing else is added anywhere.

   The three kinds are exclusive, and none of them is stored as a kind:

     it reads a sound        -> a letter
     it has a value          -> a digit
     it reads something that
     is not a sound          -> a mark

   Which means giving a letter a value takes its reading away and giving it a
   reading takes its value away, rather than leaving a sign that is quietly
   two things at once.

   Whether there is a zero is not a setting. A zero is a digit whose value is
   zero, so a system that has one has that letter and a system that does not,
   does not. 「数字を文字にするなら0があるかないか選べるでしょ」

   The base is the language's, not the person's, so it lives in STG beside the
   grammar -- it decides how many digits there are AND how the number words
   are built, and those are one decision seen from two chapters.
   ========================================================================= */

/* =========================================================================
   18. Numbers
   ========================================================================= */

/* Ten is not special; twelve and twenty are what a made language reaches for
   the moment it stops copying. It was four of them -- 10, 12, 16, 20 -- and
   that list had nothing under ten in it, which is the app deciding a language
   cannot count in six or eight. Both are real, in spoken languages and in
   made ones. Two is the floor because one digit is not a base, and twenty is
   the ceiling because nothing above it is used to count with.
   「2〜20で」 Anything off the list is ten, so a stored base can never be a
   number the rest of this file cannot draw digits for. */
var NUM_BASES=(function(){ var a=[], b; for(b=2;b<=20;b++) a.push(b); return a; }());
function numBase(){
  var b=(typeof STG!=='undefined' && STG)? STG.base : 10;
  return (NUM_BASES.indexOf(b)>=0)? b : 10;
}
function numSetBase(b){
  STG.base=(NUM_BASES.indexOf(b)>=0)? b : 10;
  saveStg(); numTopUp(); numDropBlank(); render();
}
/* A digit nobody has touched: no strokes, no sound, and no name anybody
   typed. The slot itself is the app's -- numTopUp made it -- so it is the one
   thing here that was never anybody's work. Everything else on a digit is.

   Not ltName(): a digit says what it is WORTH, so ltName never comes back
   empty for one and every slot read as somebody's. What a person can put on a
   digit is nm and ab, and those are the two to ask about. */
function numBlank(l){
  return !(l.st && l.st.length) && !(l.snd && l.snd.length) && !l.nm && !l.ab;
}
/* Counting back down. Every digit the new base cannot reach is looked at
   once: an empty slot goes, and one that has been drawn on, named or given a
   sound STAYS and is shown in red by the room.
   「あげた時に文字や音とか設定してたら赤くなって、なにも書いてなかったら勝手に
   減らしていいよ」 DELETE REVIEW is in docs/CHANGELOG.md.

   This is the only automatic deletion in the app and it runs in exactly one
   place: the press that lowers the base. Not on open, not on save, not on a
   timer -- an empty slot sitting above the base is not a reason on its own. */
function numDropBlank(){
  var gone=[], i, l;
  for(i=0;i<LETTERS.length;i++){
    l=LETTERS[i];
    if(numOver(l) && numBlank(l)) gone.push(l.id);
  }
  if(!gone.length) return 0;
  for(i=0;i<gone.length;i++) ltDel(gone[i]);
  return gone.length;
}
/* One slot per value the base has, made for any value that has none. The one
   place digits are brought into being: ltStart calls it when a free language
   opens, and numSetBase calls it the moment somebody counts higher, so the
   slots are there to draw on immediately rather than at the next launch.
   「数字は増やしなさい」

   It only ever ADDS. Counting back down leaves every digit above the new base
   exactly where it is -- somebody drew those. What happens to them is a thing
   the room says, not a thing this removes. */
function numTopUp(){
  var v, n=numBase(), made=0;
  for(v=0;v<n;v++){
    if(numByVal(v)) continue;
    /* By VALUE, because that is which slot it is -- ltSlotId() in
       www/letters.js, and the reason is written there. */
    ltNew({val:v, id:ltSlotIdFree('#'+v)});
    made++;
  }
  if(made) saveLetters();
  return made;
}
/* A digit the base can no longer reach. Nothing is taken away and nothing is
   hidden -- it is drawn and it is somebody's -- but a language counting in
   ten cannot write an eleven, and the room says so by the cell being red
   rather than by a sentence explaining it. */
function numOver(l){ return numIsDigit(l) && l.val>=numBase(); }
function numIsDigit(l){ return !!(l && typeof l.val==='number'); }
/* Digits and nothing else: what somebody wrote when they meant a NUMBER
   rather than a name -- typed into the box on a letter's page, or written
   over a box on a sheet. -1 is "that is a name".

   It is deliberately NOT "a value this language can write", because the two
   callers want different answers about `12` in base ten. The letter page asks
   only this one: anything a person meant as a number is refused there and the
   app goes to the digits room, whether or not this base could write it. The
   sheet asks numInBase() as well -- a box it cannot file as a digit still has
   a drawing on it that must not be thrown away, so it becomes a letter. */
function numTyped(s){
  var v=String(s==null? '' : s).replace(/^\s+|\s+$/g, '');
  return /^[0-9]+$/.test(v)? parseInt(v, 10) : -1;
}
/* A value this base writes with ONE sign: 0 to base-1, which is what a base
   IS. Anything as big as the base is two signs and has no single one. */
function numInBase(v){ return typeof v==='number' && v>=0 && v<numBase(); }
/* In the order they count in, which is the only order a digit has. */
function numDigits(){
  return LETTERS.filter(numIsDigit).sort(function(a, b){ return a.val-b.val; });
}
function numByVal(v){
  var i;
  for(i=0;i<LETTERS.length;i++) if(LETTERS[i].val===v) return LETTERS[i];
  return null;
}
/* There is no "give this letter a value" any more, and that is the point.
   numSetVal() lived here with ltSetRoman() as its only caller, so the one
   thing it could actually do was turn an ordinary letter into a digit from
   the letters room -- a letter leaving the room somebody made it in.
   「文字か数字か分けてるのに文字に数字が入るの意味わからないだろ」
   OWNER 2026-09-01.

   A value is not a thing a person types. It is what the BASE gives: numTopUp()
   makes one slot per value, and the + in the digits room takes the smallest
   value nothing has (numFree()). That is the whole of how a digit comes to be
   worth what it is worth, and it is why nothing here has to guard against two
   sevens -- no road can ask for one. */
/* A value is written the way everybody reads a number, in the ten they came
   with -- the point of the base is what the language does with it, not making
   somebody count in twelve to find the button. */
function numLabel(v){ return String(v); }

/* The smallest value nothing has yet, for a digit made from the + button. */
function numFree(){
  var i, b=numBase();
  for(i=0;i<b;i++) if(!numByVal(i)) return i;
  return -1;
}
/* The base goes where the kind of writing goes, and for the same reason the
   five kinds moved off the letters chapter: it is answered once and then
   never again, so it does not belong on a page opened every day.
   「10新法とかは決めたら変えねえんだからそこじゃないだろ」 */
/* One number, stepped. It was every value in the range laid out to be tapped
   -- four of them at first, and nineteen once the range opened, which is a
   wall of numbers to say one number. 「そんな並べるバカはどこにいんの？」
   A base is a single value and it is a value on a line, so it is nudged. */
function numStepBase(d){
  /* The ceiling, met on the press. The ± is drawn on every plan and this is
     what answers somebody who has not bought the letters it would make.
     OWNER 2026-09-01「+を押したらそのまま課金のポップが出るだけでしょ？」 */
  if(upStop(can('letters'))) return;
  var b=numBase()+d;
  if(b<NUM_BASES[0] || b>NUM_BASES[NUM_BASES.length-1]) return;
  numSetBase(b);
}
function numBaseRows(){
  /* Drawn on every plan. What the base decides is how many digits there are,
     and adding a letter is the paid plan's -- so the ± is answered on the
     PRESS by numStepBase(), not by taking the row away.
     「無料は0〜9しか書けないんだから±はなし」 was the row being hidden; it is
     replaced by 「無料でもplusでもproでも同じ画面なのよ。でも無料から文字を
     足すところは課金のポップが出ないといけない」 OWNER 2026-09-01. */
  var b=numBase(), lo=NUM_BASES[0], hi=NUM_BASES[NUM_BASES.length-1];
  return '<div class="set numbase">'+
    '<span class="sl">'+esc(t('num.base'))+'</span>'+
    '<span class="nbstep">'+
      '<button class="nbb"' + DO('numStepBase', [-1]) + (b<=lo? ' disabled':'')+
        ' aria-label="'+esc(numLabel(b-1))+'">'+ICON_MINUS+'</button>'+
      '<span class="nbv">'+esc(numLabel(b))+'</span>'+
      '<button class="nbb"' + DO('numStepBase', [1]) + (b>=hi? ' disabled':'')+
        ' aria-label="'+esc(numLabel(b+1))+'">'+ICON_ADD+'</button>'+
    '</span></div>';
}

/* ---- the words, and the signs beside them ------------------------------- */
/* One word for every digit, and one for the base itself: ten of them in base
   ten, twelve in base twelve. Everything above that is those words put
   together, which is what a base IS and is the grammar's business rather than
   this list's. */
function numWordSlots(){
  var out=[], i, b=numBase();
  for(i=1;i<=b;i++) out.push(numLabel(i));
  return out;
}
/* The word the counting stage holds for a value, if it has been made. */
function numWordFor(v){
  var p=stBy('count');
  return p? stWordFor(p, numLabel(v)) : null;
}
/* A digit's sign, small, beside its word on the counting stage. A value as
   big as the base has no single sign -- it is two of them -- so it shows
   nothing rather than something wrong. */
function numFace(k){
  var v=parseInt(k, 10), l;
  if(isNaN(v)) return '';
  l=numByVal(v);
  if(!l) return '';
  /* Same as numSignHTML: the picture may be `sh` or `st`, and inkGeo() is the
     one place that knows. ltHasShape() does not -- it is older than the sheet
     -- so it is not what is asked here. */
  if(inkGeo(l)) return '<canvas class="tc numsm" data-l="'+esc(l.id)+'"></canvas>';
  if(l.ch) return '<span class="bch numsm">'+esc(l.ch)+'</span>';
  return '';
}
/* And the other way round: a digit's word, on the digit, with the way to go
   and make it. The sign and the word are one thing seen from two chapters. */
function numWordRow(l){
  var w=numWordFor(l.val);
  return '<div class="sec">'+esc(t('num.word'))+'</div>'+
    '<button class="trow"' + DO('openSlot', ["count", numLabel(l.val)]) + '>'+
      '<span class="rn"></span><span class="rt">'+esc(w? w.hw : t('stg.make'))+'</span>'+
      '<span class="lead"></span>'+
      '<span class="rv">'+esc(w? phIpa(wPh(w)) : '')+'</span>'+ICON_GO+'</button>';
}

/* ---- what these look like outside the app -------------------------------
   The digits drawn in this room are the only thing of a language that leaves
   it without anybody typing: they are the clock and the date on the home
   screen (ios/App/LinguaWidget/). Nothing in the app said so, and there is no
   way to find out — a widget nobody knows about is a widget nobody adds.

   So the room that makes them shows them, in the person's own signs, at about
   the size they come out. Then one line saying how to put it there.

   One line and not four. Holding the home screen and pressing + is how every
   widget on the phone is added and is not this app's to teach; which of them
   to look for is.

   The app cannot add it. There is no public API and no URL for placing a
   widget, exactly as there is none for adding a keyboard — LinguaShare.swift
   § settings() has that paragraph. So a sentence is the whole of what is
   possible. */

/* One sign: the shape if there is one, the character it borrows, or the roman
   digit that stands in for one nobody drew. The canvas is `tcln`, which is
   what a LINE of letters is drawn on — width from the ink's own advance,
   height from the type — so two signs beside each other sit one step apart
   and not one cell. */
function numSignHTML(v){
  var l=numByVal(v);
  /* inkGeo() and not `st`: a digit drawn on a SHEET carries its picture as
     `sh` (www/sheet.js), and asking for strokes here put a roman 7 on the
     clock beside somebody's own six. */
  if(l && inkGeo(l))
    return '<canvas class="tcln" data-l="'+esc(l.id)+'"></canvas>';
  if(l && l.ch) return '<span class="numrm">'+esc(l.ch)+'</span>';
  return '<span class="numrm">'+esc(v.toString(36))+'</span>';
}
/* A whole number, in this language's base. */
function numLineHTML(n){
  var b=numBase(), left=(n>0? n : 0), out=[], i;
  if(!left) out.push(0);
  while(left>0){ out.unshift(left%b); left=Math.floor(left/b); }
  for(i=0;i<out.length;i++) out[i]=numSignHTML(out[i]);
  return out.join('');
}
/* How many signs a number takes in this language's base. */
function numSigns(n){
  var b=numBase(), left=(n>0? n : 0), c=0;
  if(!left) return 1;
  while(left>0){ c++; left=Math.floor(left/b); }
  return c;
}
/* How wide the widest hour is decides whether a face wears twelve numerals or
   four. Same rule as ClockWidget.swift: more than two signs is a smudge
   however narrow they are. */
function numWidHours(){
  var most=1, h, c;
  for(h=1;h<=12;h++){ c=numSigns(h); if(c>most) most=c; }
  return (most<=2)? [1,2,3,4,5,6,7,8,9,10,11,12] : [12,3,6,9];
}
/* The side of one preview, in px. Both are the same square, because on a home
   screen they are the same square. */
var NUM_WID=118;
/* The face. No frame around it: iOS draws the widget's own ground, and a box
   with rounded corners is the one shape this app does not make. */
function numClockHTML(){
  var hrs=numWidHours(), out='', dots='', i, a, x, y,
      W=NUM_WID, R=W/2,
      /* how much of the ring one numeral has, the way ClockWidget.swift
         works it out -- and then the em that fits the widest one in it */
      room=2*(R*0.78)*Math.sin(Math.PI/hrs.length)*0.82,
      em=Math.min(W*0.19, room/(numSigns(hrs[hrs.length-1])*0.55)),
      /* 0.85, the same as ClockWidget.swift's. 0.62 pushed the numerals
         further out than the widget puts them and left the hands looking
         short in the middle of an empty face. */
      ring=R-em*0.85;
  for(i=1;i<=12;i++){
    a=(i/12)*2*Math.PI-Math.PI/2;
    x=R+ring*Math.cos(a); y=R+ring*Math.sin(a);
    /* The ticks are circles in the SVG below and not divs with a radius on
       them. A round div is a border-radius, box-check cannot tell a circle
       from a rounded box, and it is right not to try: the rule is that this
       app does not draw one. An <svg><circle> is a circle and nothing else. */
    if(hrs.indexOf(i)>=0)
      out+='<span class="numwn" style="left:'+x.toFixed(1)+'px;top:'+y.toFixed(1)+'px;'+
           'font-size:'+em.toFixed(1)+'px">'+numLineHTML(i)+'</span>';
    else
      dots+='<circle class="numwt" cx="'+(x/W*100).toFixed(1)+'" cy="'+(y/W*100).toFixed(1)+
            '" r="1.3"/>';
  }
  /* Ten past ten, which is where every clock in every photograph of a clock
     is: the hands are apart, they point up, and they cover nothing. */
  return '<div class="numwf">'+out+
    '<svg class="numwh" viewBox="0 0 100 100" aria-hidden="true">'+dots+
      '<line x1="50" y1="50" x2="61.2" y2="30.6" stroke-width="3.2"/>'+
      '<line x1="50" y1="50" x2="21.5" y2="33.5" stroke-width="2.1"/>'+
      '<circle class="numwc" cx="50" cy="50" r="2.4"/></svg></div>';
}
/* And the date: the day large, the month under it. Same square as the face,
   and the same rule about a number that takes more signs than it has room
   for -- 23 counted in two is five signs, and five at 0.44 of the square is
   three times its width. */
/* Under the day, the month -- as a WORD when the calendar chapter has made
   one for it, and as its number when it has not. Exactly what DateWidget.swift
   does, because this is a picture of that.

   The word is set in the person's letters by setting its ROMAN spelling in
   LinguaScript: that font maps the characters that type each sign, so the
   spelling is the drawing. `.sfont` is the class that asks for it, and it is
   the same class every other word in the app is shown through.

   All or nothing. One undrawn letter is one character falling through to the
   serif in the middle of a word, so a word the font cannot carry whole is set
   plainly instead. shareWordAll() is the one place that answers that, and the
   widget asks it too. */
/* The first n of a word, for a place that is n wide. */
function numCut(s, n){
  s=String(s||'');
  return (s.length<=n)? s : s.slice(0, n);
}
/* The month over the grid: its name when the calendar chapter has made one,
   and its number when it has not. Bigger than a day and not dimmed -- it is
   the heading of the thing, not a footnote to it. */
function numMonthHTML(){
  var m=calMonthOf(new Date()), w=shareSlotWord('month.'+numLabel(m));
  if(!w || !w.hw) return '<span class="numcm">'+numLineHTML(m)+'</span>';
  return '<span class="numcm'+(shareWordAll(w)? ' sfont':'')+'">'+esc(w.hw)+'</span>';
}
/* The name a day of the week already has, for the days the language has not
   named yet. 「ない分の言葉はmondayとかで代用しよう」
   Nobody wrote these down: the widget asks iOS for its weekday symbols and
   this asks the browser for the same thing. It is the DEVICE's language that
   answers, not the app's -- because it is the device that will answer on the
   home screen, and a preview that used a different one would be showing a
   widget nobody is going to get.
   Day one is a Sunday, because that is where a calendar starts and where
   calDayOf() counts from. */
function numWdayName(i){
  /* 1970-01-04 was a Sunday, and calDayOf() counts day one from there. */
  var d=new Date(Date.UTC(1970, 0, 4+(i-1)));
  try{ return d.toLocaleDateString(undefined, {weekday:'short', timeZone:'UTC'}); }
  catch(e){ return numLabel(i); }
}
/* Twelve or twenty-four is the PHONE's answer, and every clock on the device
   obeys it. 「端末設置に合わせよう」 */
function numIs24(){
  try{ return Intl.DateTimeFormat(undefined, {hour:'numeric'})
              .resolvedOptions().hour12===false; }
  catch(e){ return true; }
}
/* 8:25, which is the clock most people actually read a phone for. */
function numTimeHTML(){
  var d=new Date(), W=NUM_WID, h=d.getHours(), m=d.getMinutes(),
      b=numBase(), mm=[], left=m, em;
  if(!numIs24()){ h=h%12; if(!h) h=12; }
  if(!left) mm=[0];
  while(left>0){ mm.unshift(left%b); left=Math.floor(left/b); }
  /* A minute is written with two signs, so 8:05 and not 8:5. */
  while(mm.length<2) mm.unshift(0);
  /* Decided off the whole line at once -- hour, mark and minute -- or the
     size would jump at ten o'clock, when the hour gains a sign.
     A sign is about 0.55 of the em across, and 0.42 is the mark. Estimates,
     and estimates are all this needs: it is choosing a size, not placing
     anything -- the placing is inkLine's, off the ink's own advance. The
     Swift asks the real widths because it has them; here the shapes are
     canvases the browser has not laid out yet when this runs. */
  em=Math.min(W*0.40, W*0.92/((numSigns(h)+mm.length)*0.55+0.42));
  return '<div class="numwd"><span class="numwbig" style="font-size:'+em.toFixed(1)+'px">'+
    numLineHTML(h)+'<span class="numsep">'+esc(numSepText())+'</span>'+
    mm.map(numSignHTML).join('')+'</span></div>';
}
/* A colon, unless somebody drew one. `:` is not a letter a language starts
   with, so a language that has one went and made it. */
function numSepText(){
  var i;
  for(i=0;i<LETTERS.length;i++) if(String(ltName(LETTERS[i])||'')===':') return ':';
  return ':';
}

/* The month, as a grid. The widest of the five and the one where the most of
   a language stands at once: the month's name, the names of the days of the
   week, and every day of the month.
   Seven columns, Sunday first, the month the phone is in -- a calendar is the
   world's shape, and what the language supplies is the names written into it.
   「言語内で週の概念作ろうがウィジェットに表示するなら世界の概念でやるだろ」 */
function numCalHTML(){
  var n=calWeek(), d=new Date(), y=d.getFullYear(), mo=d.getMonth(),
      last=new Date(y, mo+1, 0).getDate(), today=d.getDate(),
      heads='', cells='', i, day, col, prev=-1;
  for(i=1;i<=n;i++){
    var w=shareSlotWord('wday.'+numLabel(i)), nm;
    /* The head of a column is as wide as a column. A calendar has always cut
       the day's name down -- Mon, 月, M -- because seven of them share the
       width of the grid, and a word somebody made is no different. Two signs,
       which is what the phone's own short names come to. */
    nm=(w && w.hw)? esc(numCut(w.hw, 2)) : esc(numCut(numWdayName(i), 3));
    heads+='<span class="numch'+((w && w.hw && shareWordAll(w))? ' sfont':'')+
      (calRed(i)? ' sun':'')+(calBlue(i)? ' sat':'')+'">'+nm+'</span>';
  }
  for(day=1;day<=last;day++){
    col=calDayOf(new Date(y, mo, day))-1;
    /* A row ends where the week wraps, and the first row is padded to put
       the first of the month under its own column. */
    if(day===1) for(i=0;i<col;i++) cells+='<span class="numcc"></span>';
    else if(col<=prev) { /* the wrap is the grid's own, nothing to pad */ }
    prev=col;
    /* Today is a filled disc with the number knocked out of it, which is what
       every calendar on the phone does and is the only mark that reads at this
       size. The disc is an <svg><circle> and not a radius on the span: a round
       div is a border-radius, box-check cannot tell a circle from a rounded
       box, and it is right not to try. 「今日がわかるようにして」 */
    cells+='<span class="numcc'+(day===today? ' on':'')+
      (calRed(col+1)? ' sun':'')+(calBlue(col+1)? ' sat':'')+'">'+
      (day===today? '<svg class="numdot" viewBox="0 0 24 24" aria-hidden="true">'+
        '<circle cx="12" cy="12" r="11"/></svg>' : '')+
      '<span class="numcn">'+numLineHTML(day)+'</span></span>';
  }
  return '<div class="numcal" style="--numcols:'+n+'">'+
    numMonthHTML()+
    '<div class="numcg">'+heads+cells+'</div></div>';
}
function numWidHTML(){
  return '<div class="sec">'+esc(t('num.wid'))+'</div>'+
    '<div class="numwrow">'+numClockHTML()+numTimeHTML()+'</div>'+
    numCalHTML()+
    /* The four steps iOS actually asks for. 「ウェジットはホーム長押し編集
       ウェジット追加linguaね？」 OWNER 2026-08-27 -- it said 「→ + →」 before,
       which is one step short AND names a button iOS does not have on that
       screen: the + adds a widget once you are already editing. A手順 that
       does not work is worse than none, because somebody follows it. */
    '<div class="mini numwhow">'+esc(t('num.wid.how'))+'</div>'+
    numWidOut();
}
/* WHAT WAS ACTUALLY HANDED OVER, said on the screen.
   「そもそもウェジット追加のボタンすら消えてるけど？」「なんで元々できてたやつが
   消えんの？」 OWNER 2026-09-02, with three Lingua widgets on the home screen
   drawing roman numerals. Every road on this side measured correct -- the
   payload is built, ten digits with their strokes in it, and handed to the
   bridge -- so what cannot be seen from here is whether it LANDED.

   This is the same medicine docs/keyboard-extension.md records: three builds
   were spent guessing at the keyboard's hand-over, and one line on the screen
   answered it on the next one. 「Build the status line first.」

   A STATE and not an explanation: how many signs went, and what the native
   side said back. www/share.js § SHARE.how is where the answer is kept. */
function numWidOut(){
  var n=0, k, dg;
  try{ dg=shareWidget().dg||{}; }catch(e){ dg={}; }
  for(k in dg) if(dg.hasOwnProperty(k)) n++;
  return '<div class="mini numwout">'+esc(n+' · '+(SHARE.how||'-'))+'</div>';
}
/* The canvases, once the HTML they are in exists. inkLine gives each one the
   width its own ink asks for, which is what makes this a line. */
function numWidMount(){
  inkLine('canvas.tcln', function(c){
    return inkGeo(ltById(c.getAttribute('data-l')));
  });
}
