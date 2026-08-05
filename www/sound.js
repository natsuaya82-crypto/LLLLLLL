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
/* The five kinds of writing, as a rail. Changing it changes what there is to
   draw, so the font is rebuilt and the tiles below redrawn. */
function wsysRow(){
  return '<div class="segs">'+WSYS.map(function(k){
    return '<button class="seg'+(wsys()===k?' on':'')+'"' + DO('setWsys', [k]) + '>'+
      esc(t('ws.k.'+k))+'</button>';
  }).join('')+'</div>';
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
function sndHas(sym){
  var a=addedSnd();
  return a.indexOf(sym)>=0;
}
function sndToggle(sym){
  var a=addedSnd(), i=a.indexOf(sym);
  if(i>=0) a.splice(i,1); else a.push(sym);
  save(); render();
}
/* Spoken from the words' own sequences. A spelling is only what those
   sequences look like written down, so it is looked up rather than read. */
/* Tapping a sound plays it, and adds it. Tapping it again plays it and takes
   it back out. It used to be a double-tap to hear, which nobody discovers, so
   in practice the chart made no sound at all -- on the one screen whose whole
   subject is what things sound like. */
function sndTap(sym){ sayOne(sym); sndToggle(sym); }
function ipaBtn(sym){
  return '<button class="ph2'+(sndHas(sym)?' on':'')+'"' + DO('sndTap', [sym]) + '>'+esc(sym)+'</button>';
}
function ipaConsTable(){
  var rows='', mi, pi, m, cell;
  for(mi=0; mi<IPA_MANNERS.length; mi++){
    m=IPA_MANNERS[mi];
    if(!ipaHasManner(m)) continue;
    rows+='<tr><th>'+esc(t('ipa.m.'+m))+'</th>';
    for(pi=0; pi<IPA_PLACES.length; pi++){
      cell=ipaCell(m, IPA_PLACES[pi]);
      rows+='<td>'+cell.map(function(c){ return ipaBtn(c.s); }).join('')+'</td>';
    }
    rows+='</tr>';
  }
  return '<div class="ipascroll"><table class="ipatab">'+rows+'</table></div>';
}
function ipaVowTable(){
  var rows='', hi, bi, cell;
  for(hi=0; hi<IPA_HEIGHTS.length; hi++){
    rows+='<tr><th>'+esc(t('ipa.h.'+IPA_HEIGHTS[hi]))+'</th>';
    for(bi=0; bi<IPA_BACKS.length; bi++){
      cell=ipaVCell(IPA_HEIGHTS[hi], IPA_BACKS[bi]);
      rows+='<td>'+cell.map(function(v){ return ipaBtn(v.s); }).join('')+'</td>';
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
    '<div class="sec">'+t('ipa.cons')+'</div>'+ipaConsTable()+
    '<div class="sec">'+t('ipa.vows')+'</div>'+ipaVowTable()+
    '<div class="sec">'+t('ipa.other')+'</div>'+
    '<div class="ipafree">'+IPA_OTHER.map(function(o){ return ipaBtn(o.s); }).join('')+'</div>'+
    '</div></div>';
}
/* One sound: itself, what it is written with, and the two ways to change
   that -- draw a new letter for it, or hand it to a letter that exists. */
function sndRow(p){
  var ls=ltFor(p), i, faces='';
  for(i=0;i<ls.length;i++) faces+=ltFace(ls[i], DO('editLetter',[ls[i].id]));
  return '<div class="sndrow">'+
    '<button class="sndp"' + DO('sayOne', [p]) + '>'+esc(p)+'</button>'+
    '<div class="sndls">'+faces+
      '<button class="sndadd"' + DO('editGlyph', [p]) + ' aria-label="'+
        esc(t('lt.draw'))+'">'+ICON_ADD+'</button>'+
      (LETTERS.length? '<button class="sndadd"' + DO('go', ["pickltr", p]) + ' aria-label="'+
        esc(t('lt.use'))+'">'+ICON_LINK+'</button>' : '')+
    '</div>'+
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
function vLetters(){
  var loose=ltLoose();
  return '<div class="view">'+
    navTop(ltShaped()+' / '+LETTERS.length)+
    '<div class="body">'+
    '<div class="sec">'+t('ws.kind')+'</div>'+
    wsysRow()+
    (wsHasMarks()
      ? '<button class="trow"' + DO('go', ["abugida"]) + ' style="margin-top:6px">'+
          '<span class="rn"></span><span class="rt">'+esc(t('ab.title'))+'</span>'+
          '<span class="lead"></span><span class="rv">'+wsCons().length+' × '+wsVows().length+'</span>'+ICON_GO+'</button>'
      : '')+
    '<div class="sec">'+t('lt.all')+'</div>'+
    (LETTERS.length
      ? '<div class="ltlist">'+LETTERS.map(ltRow).join('')+'</div>'
      : '<div class="note">'+t('lt.none')+'</div>')+
    '<button class="btn ghost" style="width:100%;margin-top:12px"' + DO('newLetter') + '>'+
      ICON_ADD+t('lt.new')+'</button>'+
    (loose.length? '<div class="mini" style="margin-top:8px">'+tn('lt.loose', loose.length)+'</div>' : '')+
    (ltShaped()
      ? '<div class="sec">'+t('script.preview')+'</div>'+
        /* The Roman / your-letters pair sits directly under this box, so the
           box has to answer it. .sfont is added by myFontOn() in the three
           other places it appears; this one had it unconditionally, which
           made pressing Roman change the whole app and nothing in front of
           you. */
        '<div class="spv"><div class="big'+(myFontOn()?' sfont':'')+'">'+
          esc(WORDS.length?WORDS[0].hw:addedSnd().join(''))+'</div></div>'+
        '<div class="pick">'+
          '<button class="'+(SET.myfont?'':'on')+'"' + DO('setMyFont', [false]) + '>'+t('script.show.roman')+'</button>'+
          '<button class="'+(SET.myfont?'on':'')+'"' + DO('setMyFont', [true]) + '>'+t('script.show.own')+'</button>'+
        '</div>' : '')+
    '<button class="trow"' + DO('go', ["sound"]) + ' style="margin-top:18px">'+
      '<span class="rn"></span><span class="rt">'+esc(t('toc.sound'))+'</span>'+
      '<span class="lead"></span><span class="rv">'+addedSnd().length+'</span>'+ICON_GO+'</button>'+
    '</div></div>';
}
function ltRow(l){
  var snd=(l.snd||[]);
  return '<div class="ltrow">'+
    ltFace(l, DO('editLetter',[l.id]))+
    '<button class="ltmid"' + DO('editLetter', [l.id]) + '>'+
      '<span class="ltnm">'+esc(ltName(l)||t('lt.untitled'))+'</span>'+
      '<span class="ltsn">'+(snd.length? esc(t('lt.reads', snd.join(' / '))) : esc(t('lt.reads.none')))+'</span>'+
    '</button>'+
    '<button class="sndadd"' + DO('go', ["picksnd", l.id]) + ' aria-label="'+
      esc(t('lt.addsnd'))+'">'+ICON_LINK+'</button>'+
    '</div>';
}

/* ---- joining the two, from either end ---------------------------------
   Two pages, one job: put a tick next to the ones that go together. From a
   sound you are choosing letters; from a letter you are choosing sounds. */
function vPickLtr(){
  var unit=here().a, on=ltFor(unit).map(function(l){ return l.id; });
  return '<div class="view">'+navTop('')+'<div class="body">'+
    (LETTERS.length
      ? '<div class="ltlist">'+LETTERS.map(function(l){
          var has=on.indexOf(l.id)>=0;
          return '<div class="ltrow'+(has?' on':'')+'">'+
            ltFace(l, DO('toggleLtr',[unit, l.id]))+
            '<button class="ltmid"' + DO('toggleLtr', [unit, l.id]) + '>'+
              '<span class="ltnm">'+esc(ltName(l)||t('lt.untitled'))+'</span>'+
              '<span class="ltsn">'+((l.snd&&l.snd.length)? esc(t('lt.reads', l.snd.join(' / '))) : esc(t('lt.reads.none')))+'</span>'+
            '</button>'+
            '<span class="ltck">'+(has? ICON_TICK : '')+'</span></div>';
        }).join('')+'</div>'
      : '<div class="note">'+t('lt.none')+'</div>')+
    '<button class="btn ghost" style="width:100%;margin-top:14px"' + DO('editGlyph', [unit]) + '>'+
      ICON_ADD+t('lt.draw')+'</button>'+
    '</div></div>';
}
function toggleLtr(unit, id){
  var l=ltById(id); if(!l) return;
  if((l.snd||[]).indexOf(unit)>=0) ltUnlink(id, unit); else ltLink(id, unit);
  save(); installScriptFont(); render();
}
function vPickSnd(){
  var lid=here().a, l=ltById(lid);
  if(!l) return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="empty"><div class="eb">'+t('form.gone')+'</div></div></div></div>';
  var units=wsUnits(), on=(l.snd||[]);
  return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="field"><label>'+t('lt.name')+'</label>'+
      '<input id="lt-nm" value="'+esc(l.nm||'')+'" placeholder="'+esc(t('lt.name.ph'))+'" '+
      '' + IN('ltSetName', [lid]) + '></div>'+
    '<div class="sec">'+t('lt.reads.h')+'</div>'+
    (units.length
      ? '<div class="phkeys">'+units.map(function(u){
          return '<button class="phk'+(on.indexOf(u)>=0?' on':'')+'"' + DO('toggleLtr', [u, lid]) + '>'+
            '<span class="pks">'+esc(u)+'</span></button>';
        }).join('')+'</div>'
      : '<div class="note">'+t('add.ph.none')+'</div>')+
    '<button class="btn ghost" style="width:100%;margin-top:14px"' + DO('go', ["sound"]) + '>'+
      esc(t('toc.sound'))+'</button>'+
    '</div></div>';
}
