/* Lingua — sound (chapter 8)
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   8. Sound
   ========================================================================= */
/* The chart is the picker. Tapping a symbol says this language uses that
   sound; tapping it again says it does not. Nothing is guessed from how a
   word happens to be spelled, because there is nothing left to guess: the
   sounds were chosen here. */
/* One letter of the writing system, with whatever has been given to it.
   What it is a letter OF depends on the kind of writing: a sound, a syllable,
   a consonant, a whole word. Tapping it opens the surface it is drawn on.

   A letter an abugida has worked out for itself -- a consonant with a vowel
   mark on it -- is shown as what it is and cannot be drawn over: the two
   pieces it is made of are what you change. */
/* The five kinds of writing, one to a row, each saying what it is. It was a
   rail of five tabs across the top of the letters chapter, wrapping so that
   Logography sat alone on a second line, on a screen you open every day to
   answer a question you answer once. */
function vWsys(){
  return '<div class="view">'+navTop('')+'<div class="body">'+
    WSYS.map(function(k){
      return '<button class="set"' + DO('setWsys', [k]) + '>'+
        '<span class="sl">'+esc(t('ws.k.'+k))+'</span>'+
        '<span class="sv">'+(wsys()===k? ICON_TICK : '')+'</span></button>';
    }).join('')+
    '<div class="note" style="margin-top:12px">'+t('ws.kind.note')+'</div>'+
    numBaseRows()+
    /* Roman or your own letters is the same kind of decision -- it changes
       every screen in the app and nobody flips it twice a day -- so it sits
       with the others rather than under a specimen box on a chapter. */
    '<div class="sec">'+t('script.show')+'</div>'+
    '<div class="pick">'+
      '<button class="'+(SET.myfont?'':'on')+'"' + DO('setMyFont', [false]) + '>'+t('script.show.roman')+'</button>'+
      '<button class="'+(SET.myfont?'on':'')+'"' + DO('setMyFont', [true]) + '>'+t('script.show.own')+'</button>'+
    '</div>'+
    '</div></div>';
}
/* ---- the abugida bench ------------------------------------------------
   「アブギダの場合は、調整しやすいように別エディターが欲しい。母音+子音を見てチェック
   できるように。」

   An abugida is the one writing system whose letters are not drawn one at a
   time. A consonant letter carries a vowel mark, and the letter you actually
   read is the two together -- so the thing that has to be right is not any
   one drawing, it is how the mark sits on every consonant there is. Drawing
   them one at a time and hoping is not a way to find that out.

   This is a bench: one vowel at a time, every consonant of the language
   wearing it, all at once and at a size you can judge. The mark can be moved
   and resized from here, and every cell changes together, because that is
   what "adjust it" means when the mark is one drawing used thirty times. A
   cell that will not come right whatever the mark does can be opened and
   drawn as itself -- which is how a real abugida works too: a handful of
   combinations are irregular and the rest are the rule. */
var abVow='';
function abVowel(){
  var vs=wsVows();
  if(vs.indexOf(abVow)>=0) return abVow;
  return vs.length? vs[0] : '';
}
function abSetVow(v){ abVow=v; render(); }
/* Moving the mark moves the mark, not this one letter: it is one drawing and
   every combination is made out of it. Whole lattice steps, so what was on a
   dot stays on a dot. */
function abNudge(dx, dy){
  var v=abVowel(), l=ltMain(v);
  if(!l || !l.st || !l.st.length){ toast(t('ab.nomark')); return; }
  var s=geStep(), i, j, p;
  for(i=0;i<l.st.length;i++) for(j=0;j<l.st[i].pts.length;j++){
    p=l.st[i].pts[j];
    p[0]=geSnap(p[0]+dx*s); p[1]=geSnap(p[1]+dy*s);
  }
  saveLetters(); installScriptFont(); render();
}
function abScale(f){
  var v=abVowel(), l=ltMain(v);
  if(!l || !l.st || !l.st.length){ toast(t('ab.nomark')); return; }
  var lo=[1e9,1e9], hi=[-1e9,-1e9], i, j, p;
  for(i=0;i<l.st.length;i++) for(j=0;j<l.st[i].pts.length;j++){
    p=l.st[i].pts[j];
    if(p[0]<lo[0]) lo[0]=p[0]; if(p[0]>hi[0]) hi[0]=p[0];
    if(p[1]<lo[1]) lo[1]=p[1]; if(p[1]>hi[1]) hi[1]=p[1];
  }
  var cx=(lo[0]+hi[0])/2, cy=(lo[1]+hi[1])/2;
  for(i=0;i<l.st.length;i++) for(j=0;j<l.st[i].pts.length;j++){
    p=l.st[i].pts[j];
    p[0]=geSnap(cx+(p[0]-cx)*f); p[1]=geSnap(cy+(p[1]-cy)*f);
  }
  saveLetters(); installScriptFont(); render();
}
function vAbugida(){
  var vs=wsVows(), cs=wsCons(), v=abVowel();
  if(!wsHasMarks())
    return '<div class="view">'+navTop('')+'<div class="body">'+
      '<div class="note">'+t('ab.notabugida')+'</div>'+
      '<button class="btn ghost" style="width:100%;margin-top:12px"' + DO('go', ["letters"]) + '>'+
      esc(t('toc.letters'))+'</button></div></div>';
  return '<div class="view">'+navTop(cs.length+' × '+vs.length)+'<div class="body">'+
    '<div class="segs scrollx">'+vs.map(function(x){
      return '<button class="seg'+(x===v?' on':'')+'"' + DO('abSetVow', [x]) + '>'+esc(x)+'</button>';
    }).join('')+'</div>'+
    (v
      ? '<div class="abmark">'+
          '<div class="abmh">'+esc(t('ab.mark', v))+'</div>'+
          '<div class="abctl">'+
            '<button' + DO('abNudge', [-1, 0]) + ' aria-label="'+esc(t('ab.left'))+'">'+ICON_ARR_L+'</button>'+
            '<button' + DO('abNudge', [1, 0]) + ' aria-label="'+esc(t('ab.right'))+'">'+ICON_ARR_R+'</button>'+
            '<button' + DO('abNudge', [0, -1]) + ' aria-label="'+esc(t('ab.up'))+'">'+ICON_ARR_U+'</button>'+
            '<button' + DO('abNudge', [0, 1]) + ' aria-label="'+esc(t('ab.down'))+'">'+ICON_ARR_D+'</button>'+
            '<button' + DO('abScale', [1.25]) + '>'+t('ab.bigger')+'</button>'+
            '<button' + DO('abScale', [0.8]) + '>'+t('ab.smaller')+'</button>'+
            '<button' + DO('editGlyph', [v]) + '>'+ICON_PEN+t('ab.draw')+'</button>'+
          '</div></div>'+
        '<div class="sec">'+t('ab.every', v)+'</div>'+
        (cs.length
          ? '<div class="abgrid">'+cs.map(function(c){
              var u=wsKey([c,v]), own=!!ltStrokes(u);
              return '<button class="abcell'+(own?' own':'')+'"' + DO('editGlyph', [u]) + '>'+
                '<canvas class="tc" data-r="'+esc(u)+'"></canvas>'+
                '<span class="abu">'+esc(u)+'</span></button>';
            }).join('')+'</div>'+
            '<div class="mini" style="margin-top:8px">'+t('ab.cell')+'</div>'
          : '<div class="note">'+t('ab.nocons')+'</div>')
      : '<div class="note">'+t('ab.novow')+'</div>')+
    '</div></div>';
}
/* ---- the language's sounds --------------------------------------------
   Which sounds a language uses is the language's, and it was the person's:
   SET.snd, in lingua.set, beside the theme and the interface language. One
   inventory for every language somebody has. Nothing showed it because there
   was no way to have two languages yet -- open somebody else's and you would
   have found your own sounds in it, and the letters you drew for them.

   It is the ninth slice, filed under langKey('snd') exactly as letters are. */
var SND=[];
/* The open language's sounds. Empty first: see langRead() in core.js. */
function sndRead(){
  SND=[];
  try{ var s=JSON.parse(localStorage.getItem(langKey('snd'))||'null');
       if(s && s.length) SND=s; }catch(e){}
}
sndRead();
function saveSnd(){ try{ localStorage.setItem(langKey('snd'), JSON.stringify(SND)); }catch(e){} }
/* The one sound inventory anything reads. 35 places say addedSnd() meaning
   "the sounds of the language in front of me", and they still do. */
function addedSnd(){ return SND; }
/* Whatever was in SET.snd belonged to whichever language was open when it was
   written, which is this one. Copied, then taken off the settings so nothing
   can read it again. */
function migrateSnd(){
  if(SND.length || !SET.snd || !SET.snd.length) return;
  SND=SET.snd.slice();
  delete SET.snd;
  saveSnd(); save();
}
/* A language has sounds from the moment it exists: a drawn letter takes the
   next one nothing reads yet, so a language with none is one where every
   letter reads nothing. Called when the app starts and when a different
   language is opened, which are the two moments a language can turn out to
   have none. Never overwrites. */
function sndStart(){
  if(SND.length) return;
  SND=asOrder(asSounds('plain', 12));
  saveSnd();
}
function sndHas(sym){
  var a=addedSnd();
  return a.indexOf(sym)>=0;
}
/* Tapping a symbol the language already has takes it back out, which is the
   same act as the × on its row -- so it is the same function. This spliced the
   list itself and left the letters reading a sound that was gone: the third
   copy of one rule, and the second that got it wrong. */
function sndToggle(sym){
  var a=addedSnd();
  if(a.indexOf(sym)>=0){ dropSnd(sym); return; }
  a.push(sym); saveSnd(); render();
}
/* Spoken from the words' own sequences. A spelling is only what those
   sequences look like written down, so it is looked up rather than read. */
/* Tapping a sound plays it, and adds it. Tapping it again plays it and takes
   it back out. It used to be a double-tap to hear, which nobody discovers, so
   in practice the chart made no sound at all -- on the one screen whose whole
   subject is what things sound like. */
function sndTap(sym){ sayOne(sym); sndToggle(sym); }
/* ---- an inventory to start from ---------------------------------------
   Fourteen buttons and no help is not a question anybody can answer the
   first time. So the app proposes: say what the language should sound like
   -- soft, hard, flowing, breathy, plain -- and it draws an inventory out of
   that region of the chart, says it out loud, and waits. Take it, ask for
   another, or use the chart below and do it yourself.

   This was the third step of onboarding, where it stood between somebody and
   the first thing they came to do. It belongs here, in the chapter about
   sounds, where it can be reached on any day rather than once. */
var sndFeelPick='';
function sndFeel(id){
  sndFeelPick=id;
  SND=asSounds(id, 12);
  saveSnd();
  asSay(SND);
  render();
}
function sndFeelAgain(){ if(sndFeelPick) sndFeel(sndFeelPick); }
function sndHear(p){ sayOne(p); }
/* The proposal, shown in two rows. A flat list of twelve symbols is a wall:
   there is no way to see that the language has five vowels and seven
   consonants, which is the single most useful thing about an inventory and
   the thing that decides what a syllable can look like. Consonants first,
   vowels under them, each row labelled -- the same two words the chart uses,
   so nothing new has to be learned to read it.

   Each row ends with the way to lengthen it: one more consonant, one more
   vowel, drawn from the same character of sound and said as it arrives. And
   each sound carries the way to take it back out, because a proposal you can
   only accept whole is not a proposal. */
/* The same row in two places: in the chapter a sound is tapped to hear it,
   and in onboarding it is tapped to say that the letter just drawn reads it.
   The name the button says is passed in rather than assumed. */
function sndFeelRow(lab, list, kind, act){
  return '<div class="obhr"><span class="obhk">'+esc(lab)+'</span>'+
    '<div class="obhs">'+list.map(function(p){
      return '<span class="obhp"><button class="obhb"' + DO(act||'sndHear', [p]) + '>'+esc(p)+'</button>'+
        '<button class="obhx"' + DO('dropSnd', [p]) + ' aria-label="'+esc(t('as.drop'))+'">'+ICON_CROSS+'</button></span>';
    }).join('')+
    '<button class="obhadd"' + DO('sndFeelMore', [kind]) + '>'+ICON_ADD+esc(t('as.more.'+kind))+'</button>'+
    '</div></div>';
}
/* One more sound of the kind asked for. It is said on arrival -- an inventory
   is a set of sounds, so a sound that joins it silently has not really been
   heard about. */
function sndFeelMore(kind){
  var have=addedSnd(), s=asMore(sndFeelPick||AS_CHARS[0].id, kind, have);
  if(!s){ toast(t('as.more.none')); return; }
  SND=asOrder(have.concat([s]));
  saveSnd(); sayOne(s); render();
}
function sndFeelHTML(act){
  var have=addedSnd(), cs=[], vs=[], i;
  for(i=0;i<have.length;i++){
    if(ipaIsVowel(have[i])) vs.push(have[i]); else cs.push(have[i]);
  }
  /* No line of its own above this. Every screen it appears on says what it is
     asking; a second sentence here was emptied to an ideographic space to
     keep i18n-check quiet and left a blank paragraph's worth of gap. */
  return '<div class="obscripts one">'+AS_CHARS.map(function(c){
      return '<button class="obsrow'+(sndFeelPick===c.id?' on':'')+'"' + DO('sndFeel', [c.id]) + '>'+
        '<span class="obnm">'+esc(t('as.'+c.id))+'</span>'+
        '<span class="obws">'+esc(t('as.'+c.id+'.d'))+'</span></button>';
    }).join('')+'</div>'+
    /* the panel stays once a character has been chosen, even if every sound
       in it has been taken back out -- otherwise dropping the last one takes
       away the buttons that would put another back */
    ((have.length || sndFeelPick)
      ? '<div class="obheard"><div class="obhl">'+tn('ob.snds.n', have.length)+'</div>'+
        sndFeelRow(t('ipa.cons'), cs, 'c', act)+sndFeelRow(t('ipa.vows'), vs, 'v', act)+
        '<div class="wctl2"><button' + DO('asSay', [addedSnd()]) + '>'+ICON_PLAY+t('as.hear')+'</button>'+
        (sndFeelPick? '<button' + DO('sndFeelAgain') + '>'+t('as.again')+'</button>':'')+'</div></div>'
      : '');
}

/* The chart is also how a letter is told what it reads, and that is a
   different thing to do with the same button, so the name it says is passed
   in rather than assumed. Nothing else about the chart changes. */
function ipaBtn(sym, act){
  return '<button class="ph2'+(sndHas(sym)?' on':'')+'"' + DO(act||'sndTap', [sym]) + '>'+esc(sym)+'</button>';
}
function ipaConsTable(act){
  var rows='', mi, pi, m, cell;
  for(mi=0; mi<IPA_MANNERS.length; mi++){
    m=IPA_MANNERS[mi];
    if(!ipaHasManner(m)) continue;
    rows+='<tr><th>'+esc(t('ipa.m.'+m))+'</th>';
    for(pi=0; pi<IPA_PLACES.length; pi++){
      cell=ipaCell(m, IPA_PLACES[pi]);
      rows+='<td>'+cell.map(function(c){ return ipaBtn(c.s, act); }).join('')+'</td>';
    }
    rows+='</tr>';
  }
  return '<div class="ipascroll"><table class="ipatab">'+rows+'</table></div>';
}
function ipaVowTable(act){
  var rows='', hi, bi, cell;
  for(hi=0; hi<IPA_HEIGHTS.length; hi++){
    rows+='<tr><th>'+esc(t('ipa.h.'+IPA_HEIGHTS[hi]))+'</th>';
    for(bi=0; bi<IPA_BACKS.length; bi++){
      cell=ipaVCell(IPA_HEIGHTS[hi], IPA_BACKS[bi]);
      rows+='<td>'+cell.map(function(v){ return ipaBtn(v.s, act); }).join('')+'</td>';
    }
    rows+='</tr>';
  }
  return '<table class="ipatab">'+rows+'</table>';
}

/* ---- I. sounds --------------------------------------------------------
   The inventory, and nothing about shapes except which letters read each
   sound and the way to reach them. What a sound is written with is a fact
   about the letter, so it is shown here as a reference and edited there --
   but making one from here is one tap, because that is the moment you want
   it. 「音専用ページと文字アルファベットページ別にして。どっちからでもお互い追加でき
   るようにすればいいから」 */
function vSound(){
  var mine=addedSnd();
  return '<div class="view">'+
    navTop(mine.length)+
    '<div class="body">'+
    '<div class="sec">'+t('ipa.mine')+'</div>'+
    (mine.length
      ? '<div class="sndlist">'+mine.map(sndRow).join('')+'</div>'+
        '<button class="trow"' + DO('go', ["letters"]) + ' style="margin-top:14px">'+
          '<span class="rn"></span><span class="rt">'+esc(t('toc.letters'))+'</span>'+
          '<span class="lead"></span><span class="rv">'+ltShaped()+'</span>'+ICON_GO+'</button>'
      : '<div class="ipamine"><span class="none">'+t('ipa.mine.none')+'</span></div>')+
    /* The heading is the chapter's, not the chooser's: the onboarding step
       that borrows the same chooser already asks its own question above it. */
    '<div class="sec">'+t('ipa.feel')+'</div>'+sndFeelHTML()+
    '<div class="sec">'+t('ipa.cons')+'</div>'+ipaConsTable()+
    '<div class="sec">'+t('ipa.vows')+'</div>'+ipaVowTable()+
    '<div class="sec">'+t('ipa.other')+'</div>'+
    '<div class="ipafree">'+IPA_OTHER.map(function(o){ return ipaBtn(o.s); }).join('')+'</div>'+
    '</div></div>';
}
/* One sound: itself, what it is written with, and the two ways to change
   that -- draw a new letter for it, or hand it to a letter that exists. */
/* A sound, what writes it, and a way to be rid of it. It used to carry two
   more buttons -- draw a letter for this sound, hand this sound to a letter
   that exists -- both unlabelled icons, and both the same move: start at a
   sound and give it a letter. That is the direction this app stopped working
   in. The chapter about letters is where a letter is made. */
function sndRow(p){
  var ls=ltFor(p), i, faces='';
  for(i=0;i<ls.length;i++) faces+=ltFace(ls[i], DO('go',["letter", ls[i].id]));
  return '<div class="sndrow">'+
    '<button class="sndp"' + DO('sayOne', [p]) + '>'+esc(p)+'</button>'+
    '<div class="sndls">'+faces+'</div>'+
    '<button class="sndx"' + DO('dropSnd', [p]) + ' aria-label="'+esc(t('as.drop'))+'">'+ICON_CROSS+'</button>'+
    '</div>';
}
/* A letter's face, wherever one is shown: what was drawn, or the character it
   borrows, or -- for a letter with neither yet -- its name. */
function ltFace(l, call){
  var face;
  if(l.st && l.st.length) face='<canvas class="tc" data-l="'+esc(l.id)+'"></canvas>';
  else if(l.ch) face='<span class="bch">'+esc(l.ch)+'</span>';
  else face='<span class="nol">'+ICON_PEN+'</span>';
  /* The face is a drawing, a borrowed character, or a pen. Only the middle
     one is text, so the other two announce as nothing to somebody using
     VoiceOver -- and a letter tile is the whole point of these screens.
     ltName falls back to what the letter reads, and to nothing at all for one
     that is neither named nor sounded, which t('lt.untitled') covers. */
  return '<button class="ltf" aria-label="'+esc(ltName(l)||t('lt.untitled'))+'"'+
         call+'>'+face+'</button>';
}

/* ---- II. letters ------------------------------------------------------
   The alphabet, as a thing in itself. Every letter you have, what it reads,
   and the letters that read nothing yet -- which is the case the old model
   could not hold at all, and the reason the two are two chapters. */
/* The three kinds a letter can be, as the chapter's contents. They were one
   page with three lists on it, which is fine at three letters each and
   unreadable at forty. 「文字の一覧をアルファベット>記号>数字>とかにして中で
   見れるようにして」 */
var LT_KINDS=['alpha', 'mark', 'num'];
var LT_KIND={alpha:'lt.all', mark:'lt.marks', num:'num.h'};
function ltOfKind(k){
  if(k==='num') return numDigits();
  if(k==='mark') return ltMarks();
  return ltOrder(LETTERS.filter(function(l){
    return !ltIsMark(l) && !numIsDigit(l); }));
}
function ltKindRow(k){
  return '<button class="trow"' + DO('go', ["ltset", k]) + '>'+
    '<span class="rn"></span><span class="rt">'+esc(t(LT_KIND[k]))+'</span>'+
    '<span class="lead"></span><span class="rv">'+ltOfKind(k).length+'</span>'+ICON_GO+'</button>';
}
function vLetters(){
  return '<div class="view">'+
    navTop(ltShaped()+' / '+LETTERS.length)+
    '<div class="body">'+
    (wsHasMarks()
      ? '<button class="trow"' + DO('go', ["abugida"]) + ' style="margin-top:6px">'+
          '<span class="rn"></span><span class="rt">'+esc(t('ab.title'))+'</span>'+
          '<span class="lead"></span><span class="rv">'+wsCons().length+' × '+wsVows().length+'</span>'+ICON_GO+'</button>'
      : '')+
    '<div class="toc">'+LT_KINDS.map(ltKindRow).join('')+'</div>'+
    '<button class="trow"' + DO('go', ["sound"]) + ' style="margin-top:18px">'+
      '<span class="rn"></span><span class="rt">'+esc(t('toc.sound'))+'</span>'+
      '<span class="lead"></span><span class="rv">'+addedSnd().length+'</span>'+ICON_GO+'</button>'+
    '</div></div>';
}
/* One of the three. The base belongs on the digits page and nowhere else,
   because that is the page it decides the shape of. */
/* This page's signs, side by side, at a size you can judge -- which is the
   only thing a specimen is for. It used to be one word set in the font, on
   the chapter's front page, answering nothing. 「この文字で書くといらん。せめ
   てアルファベットの下とか数字並べて表示するとかそう言う使い方しろよ」 */
function ltStrip(list){
  var shown=list.filter(ltHasShape);
  if(!shown.length) return '';
  /* No heading: it is the same letters as the list under it, so a line
     saying so would be a line saying so. */
  return '<div class="spv"><div class="ltstrip">'+shown.map(function(l){
      return (l.st && l.st.length)
        ? '<canvas class="tc" data-l="'+esc(l.id)+'"></canvas>'
        : '<span class="bch">'+esc(l.ch)+'</span>';
    }).join('')+'</div></div>';
}
function vLtset(){
  var k=here().a;
  if(LT_KINDS.indexOf(k)<0) k='alpha';
  var list=ltOfKind(k), loose=ltLoose();
  return '<div class="view">'+
    navTop(list.length)+
    '<div class="body">'+
    ltStrip(list)+
    (list.length
      ? '<div class="ltlist">'+list.map(ltRow).join('')+'</div>'
      : '<div class="note">'+t('lt.none')+'</div>')+
    '<button class="btn ghost" style="width:100%;margin-top:12px"' + DO('newLetter', [k]) + '>'+
      ICON_ADD+t('lt.new')+'</button>'+
    ((k==='alpha' && loose.length)
      ? '<div class="mini" style="margin-top:8px">'+tn('lt.loose', loose.length)+'</div>' : '')+
    '</div></div>';
}
/* One line, not two. The second said "reads k" under a first line that said
   "k", because a letter with no name of its own is called by what it reads --
   so it was the same fact twice, in a sentence.

   Red when another letter already reads the same thing. A font maps one code
   point to one glyph, so the first of them wins and the rest are invisible
   without being wrong; nothing said so. */
function ltRow(l){
  var snd=(l.snd||[]), dup=ltTaken(l);
  return '<div class="ltrow">'+
    ltFace(l, DO('editLetter',[l.id]))+
    '<button class="ltmid"' + DO('go', ["letter", l.id]) + '>'+
      '<span class="ltnm">'+esc(ltName(l)||t('lt.reads.none'))+'</span>'+
      (dup? '<span class="ltdup">'+esc(t('lt.dup', dup))+'</span>' : '')+
    '</button>'+
    (ltHasSound(l)? '<button class="ltsay"' + DO('sayPh', [snd]) + ' aria-label="'+
      esc(t('f.listen'))+'">'+ICON_SPK+'</button>' : '')+
    '</div>';
}

/* One letter: its name, whether it reads a sound or is a mark, what it reads,
   the character it borrows instead of a drawing, and a way to be rid of it.

   It used to be a grid of every unit in the writing system with ticks on the
   ones this letter reads, which asks somebody to work in IPA to say a thing
   they already know how to spell. The field takes what they would write --
   k, sh, ng, ka -- and more than one, separated by spaces, for a letter that
   reads more than one thing. The IPA under it is what the app made of that,
   shown rather than chosen.

   The rest of this was on the drawing screen, which made that screen scroll
   and made this one a second place to say the same thing. Drawing is drawing;
   this is the letter. */
function vLetter(){
  var lid=here().a, l=ltById(lid);
  if(!l) return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="empty"><div class="eb">'+t('form.gone')+'</div></div></div></div>';
  return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="field"><label>'+t('lt.name')+'</label>'+
      '<input id="lt-nm" value="'+esc(l.nm||'')+'" placeholder="'+esc(t('lt.name.ph'))+'" '+
      '' + IN('ltSetName', [lid]) + '></div>'+
    '<div class="sec">'+t('lt.reads.h')+'</div>'+
    '<div class="field"><input id="lt-rom" value="'+esc(ltBoxed(l))+'" '+
      'placeholder="'+esc(t('lt.reads.ph'))+'" autocapitalize="none" '+
      'autocorrect="off" spellcheck="false"' + CH('ltSetRoman', [lid]) + '></div>'+
    (numIsDigit(l)? numWordRow(l) : '')+
    '<div class="note">'+(numIsDigit(l)
      ? esc(t('num.h'))
      : ltUnits(l).length
        ? (ltHasSound(l)? '/'+esc(l.snd.join(' '))+'/' : esc(l.snd.join(' ')))
        : t('lt.reads.none'))+'</div>'+
    '<div class="sec">'+t('glyph.other')+'</div>'+
    '<button class="btn ghost" style="width:100%"' + DO('editLetter', [lid]) + '>'+t('lt.draw')+'</button>'+
    (l.ch
      ? '<div class="gborrow" style="margin-top:8px"><span class="gbch">'+esc(l.ch)+'</span>'+
        '<span class="gbl">'+t('glyph.borrowed')+'</span>'+
        '<button class="gbx"' + DO('ltDropChar', [lid]) + '>'+t('ch.clear')+'</button></div>'
      : '<button class="btn ghost" style="width:100%;margin-top:8px"' + DO('openPick', [lid]) + '>'+
        t('glyph.borrow')+'</button>')+
    '<button class="set" style="margin-top:14px;border-bottom:none"' + DO('ltDelete', [lid]) + '>'+
      '<span class="sl bad">'+t('glyph.del')+'</span></button>'+
    '</div></div>';
}
