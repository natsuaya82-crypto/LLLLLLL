/* Lingua — what a letter is a letter OF
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   The app could only make one kind of writing system, and never said so. You
   drew a shape and were asked, immediately, which single sound it was for --
   which is not a question every writing system has an answer to. It assumed
   an alphabet, and then hid the assumption inside a screen that looked like
   it was asking something open.

   There are six kinds, and every one of them is in use by somebody today:

     alphabet    one letter, one sound            a  k
     syllabary   one letter, one syllable         か = ka, き = ki
     abjad       consonants written, vowels not   Arabic, Hebrew
     abugida     a consonant letter with a vowel mark added
                                                  क = ka, कि = ki
     block       a syllable's letters put together in one square
                                                  ㅎ + ㅏ + ㄴ = 한
     logography  one letter, one word             Han characters

   None of this needs a new idea underneath, because a word here has been a
   sequence of sounds since the phoneme rework. All that changes is where the
   sequence is cut before each piece is given a shape. An alphabet cuts at
   every sound; a syllabary at every syllable; an abjad throws the vowels away;
   a logography does not cut at all. An abugida cuts at every syllable too, but
   its shape is made rather than drawn: the consonant's letter and the vowel's
   mark are two stroke lists, and a letter is a stroke list, so the two are
   simply added together.

   The font writer needed nothing new either. A unit longer than one character
   has no code point of its own, so it becomes an OpenType ligature over the
   characters it is made of -- exactly the mechanism the two-letter digraphs
   used before any of this. You type the sounds and the font draws the letter. */

var WSYS=['alpha','syll','abjad','abugida','block','logo'];

/* ---- which of the six this is ----------------------------------------
   Asking somebody to choose between an abjad and an abugida before they have
   drawn anything is asking them to know the answer to a question they came
   here to find out. So it is worked out from what they made, and the letters
   are the evidence: what a letter reads is exactly where the language is
   being cut, which is the only thing that separates them.

     a letter reads a whole word           logography
     a letter reads more than one sound    syllabary
     letters read single sounds, and the
       language has vowels that none of
       them reads                          abjad
     otherwise                             alphabet

   An abugida is not in that list because it cannot be. Its letters read
   single sounds like an alphabet's; what makes it an abugida is that the
   vowel is a mark added to the consonant rather than a letter beside it, and
   that is a fact about how the two are drawn together, not about what any one
   of them reads. It stays a thing you say, and saying it is what SET.wsys is
   for.

   Which is also why nothing anybody already has moves: SET.wsys is set for
   everyone who was asked during onboarding, and a stored answer wins. The
   guess is for the people who are never going to be asked. */
function wsGuess(){
  var read = [], i, j, u;
  for(i=0;i<LETTERS.length;i++){
    if(typeof ltIsMark==='function' && ltIsMark(LETTERS[i])) continue;
    var sn=LETTERS[i].snd;
    if(!sn) continue;
    for(j=0;j<sn.length;j++) if(sn[j] && read.indexOf(sn[j])<0) read.push(sn[j]);
  }
  if(!read.length) return 'alpha';       /* nothing to go on yet */

  /* a letter that reads a whole word */
  for(i=0;i<WORDS.length;i++){
    u=wsKey(wPh(WORDS[i]));
    if(u && read.indexOf(u)>=0) return 'logo';
  }
  /* a letter that reads more than one sound. A unit that is one of the
     language's sounds is one sound; anything else is several joined
     together, which is what wsKey does to make a unit in the first place. */
  var snds=addedSnd();
  for(i=0;i<read.length;i++){
    if(snds.indexOf(read[i])<0) return 'syll';
  }
  /* single sounds only: is any vowel written? */
  var vows=snds.filter(function(p){ return ipaIsVowel(p); });
  if(vows.length){
    for(i=0;i<vows.length;i++) if(read.indexOf(vows[i])>=0) return 'alpha';
    return 'abjad';
  }
  return 'alpha';
}
/* A stored answer wins, always. Otherwise the guess. */
/* An alphabet, and nothing to guess, on the free plan: the other five are
   paid, and the free alphabet is a-z with the sounds those letters are
   normally read with -- most of which the language has not taken up on the
   chart, which is exactly what wsGuess reads as a syllabary. So the guess
   was answering a question that only has one answer here. */
/* WHICH OF THE FIVE THIS LANGUAGE IS WRITTEN AS, AND THE ANSWER IS THE
   LANGUAGE'S -- `language.wsys` (www/core.js § LWSYS).
   「端末に残すものないんですけど。サーバーで同じ機能になるように代替して」
   OWNER 2026-09-08.

   It was `SET.wsys`, a field of the person's settings on this handset, so
   somebody with two languages had ONE answer for both of them and nobody else
   could be told which of the five a published language was --
   tools/store-check.mjs had written GAP against it in exactly those words. */
/* AND IT IS NOT ASKED BEFORE THE SERVER HAS SAID WHAT THIS ACCOUNT PAYS.
   「free is an alphabet; there is nothing to guess」 is written down
   (CLAUDE.md § What the free plan is) and stays: nobody on the free plan can
   choose one of the six, so a guess made off their letters is the app
   telling somebody their alphabet is a syllabary. Measured 2026-09-11 with
   the line taken out: the fixture's free language came back `syll`, and the
   characters borrowed for it stopped being drawn.

   planNo() is the whole of what changed: it is true for 「free」 and not for
   「nobody has asked」 (www/core.js § has), and falling to `alpha` on the
   second is this app telling somebody who
   PAID that their abugida is an alphabet -- on a launch with no signal, and
   on every launch before the answer lands. That is the head of
   docs/PAID_FEATURES.md backwards: 「No byte of anybody's language may depend
   on payment」. Until the answer is in, the language answers for itself: the
   `language.wsys` column the server holds, which is also what anybody reading
   a published language is told.

   Changing it is a different question and is setWsys() below --
   `upStop(can('wsys'))`, its first line, which is the door rather than the
   room, and which says 「接続できません」 rather than a price while nobody
   has asked. */
function wsys(){
  if(planNo(can('wsys'))) return 'alpha';
  var w=langWsysOf(langId);
  return WSYS.indexOf(w)>=0 ? w : wsGuess();
}
function setWsys(k){
  /* The ceiling, met on the press. 「+を押したらそのまま課金のポップが出る
     だけでしょ？」 OWNER 2026-09-01 -- the button is drawn on every plan. */
  if(upStop(can('wsys'))) return;

  if(WSYS.indexOf(k)<0) return;
  /* There is no second guard under this one. It used to read
     `if(!can('wsys') && k!=='alpha'){ go('plans'); return; }` -- the free plan
     carried off to the price list, which is the older sentence
     「無料はタップすると課金ページに飛ばされる」 and 「ポップだって。その
     古いのは消して」 OWNER 2026-09-05 is what replaced it. Said as
     `upStop(can('wsys'))` it is the line at the top of this function, word
     for word, and a route arrived at from anywhere or a plan that ended
     while one of the other five was set meets it there. Written twice, the
     second one can never run. */
  /* THE SERVER FIRST. The screen moves when the column has it -- the same
     sentence the 公開 switch and the heart carry
     （「保存するタイミングでエラーが起きるなら、保存されないし」 OWNER
     2026-09-05）. A choice that did not arrive is a choice that did not
     happen, and ［再接続］ presses it again. */
  netLangWsys(k, function(){
    installScriptFont();
    render();
  });
}
/* An abugida is the only one that builds a letter out of two drawings, so it
   is the only one that has two kinds of thing to draw. */
function wsHasMarks(){ return wsys()==='abugida'; }

/* ---- cutting a word into the pieces its writing has letters for -------- */
function wsCons(){
  return addedSnd().filter(function(p){ return !ipaIsVowel(p); });
}
function wsVows(){
  return addedSnd().filter(function(p){ return ipaIsVowel(p); });
}
/* The key a glyph is stored under. One character for a single sound; the
   sounds run together for anything longer, which is also exactly the string a
   ligature substitutes. */
function wsKey(a){ return a.join(''); }

/* A word, as the units its writing system would write it in. */
function wsSplit(seq){
  var k=wsys(), out=[], i, cut, c, v;
  if(!seq || !seq.length) return [];
  if(k==='logo') return [wsKey(seq)];
  if(k==='alpha') return seq.slice();
  if(k==='abjad'){
    for(i=0;i<seq.length;i++) if(!ipaIsVowel(seq[i])) out.push(seq[i]);
    return out;
  }
  if(k==='abugida'){
    /* every consonant takes the vowel that follows it; a vowel with no
       consonant in front of it stands on its own, as it does in Devanagari */
    i=0;
    while(i<seq.length){
      c=seq[i];
      if(ipaIsVowel(c)){ out.push(c); i++; continue; }
      v=(i+1<seq.length && ipaIsVowel(seq[i+1])) ? seq[i+1] : null;
      if(v){ out.push(wsKey([c,v])); i+=2; }
      else { out.push(c); i++; }
    }
    return out;
  }
  /* a syllabary, and a block: both write a syllable as one unit. What
     differs is only where the unit's shape comes from -- drawn whole, or put
     together out of the letters it is spelt with (wsParts below) */
  cut=phCut(seq);
  for(i=0;i<cut.length;i++) out.push(wsKey(cut[i].on.concat(cut[i].nu).concat(cut[i].co)));
  return out;
}
function wsUnitsOf(w){ return wsSplit(wPh(w)); }

/* ---- what has to be drawn --------------------------------------------
   The list of letters this writing system needs, which is a different list
   for each of the six and is worked out from the language rather than
   guessed. Anything already drawn is kept in the list even if nothing uses
   it any more, so a letter never silently disappears. */
function wsUnits(){
  var k=wsys(), seen={}, out=[], i, j, u, cs, vs;
  function push(x){ if(x && !seen[x]){ seen[x]=1; out.push(x); } }
  if(k==='alpha'){ addedSnd().forEach(push); }
  else if(k==='abjad'){ wsCons().forEach(push); }
  else if(k==='abugida' || k==='block'){
    /* the letters and the marks are what gets drawn, and every consonant with
       a vowel on it that a word actually uses is a letter too -- made out of
       those two, and needing a glyph of its own in the font so that the
       ligature has somewhere to land. A block is the same list: its letters
       are single sounds, and every syllable a word says is a square made out
       of them */
    wsCons().forEach(push); wsVows().forEach(push);
    for(i=0;i<WORDS.length;i++){
      u=wsSplit(wPh(WORDS[i]));
      for(j=0;j<u.length;j++) push(u[j]);
    }
  }
  else if(k==='logo'){ WORDS.forEach(function(w){ push(wsKey(wPh(w))); }); }
  else {
    /* a syllabary writes the syllables the language actually says; every
       consonant against every vowel would be hundreds of letters to draw,
       most of which no word would ever need */
    for(i=0;i<WORDS.length;i++){
      u=wsUnitsOf(WORDS[i]);
      for(j=0;j<u.length;j++) push(u[j]);
    }
    /* with no words yet there is still something to start on: every sound
       against every vowel, so a syllabary can be begun before a dictionary */
    if(!out.length){
      cs=wsCons(); vs=wsVows();
      for(i=0;i<cs.length;i++) for(j=0;j<vs.length;j++) push(wsKey([cs[i],vs[j]]));
      if(!out.length) vs.forEach(push);
    }
  }
  /* and everything a letter already reads, so a unit no word needs any more
     never silently drops off the page it was drawn on */
  LETTERS.forEach(function(l){ (l.snd||[]).forEach(push); });
  return out;
}
/* In an abugida the consonants are letters and the vowels are marks put on
   them, so the screen shows them as two lists and says which is which. */
/* The letters an abugida works out for itself: a consonant with a vowel on
   it. They are shown but not drawn -- the two pieces are what you change. */
/* ---- a letter that is made, not drawn ---------------------------------
   Two of the six build a unit's shape out of letters somebody drew one at a
   time. An abugida puts a vowel mark on a consonant; a block puts a
   syllable's letters side by side and one over another in one square, the
   way 한 is ㅎ, ㅏ and ㄴ. 「組み合わせてやるのも作ろう」 OWNER 2026-09-26.

   It is ONE mechanism: a unit is a list of PIECES, each a letter and the part
   of the square it stands in (wsParts), and the shape is every piece drawn
   into its part (wsStrokes). An abugida's pieces both stand in the whole
   square -- the mark was drawn where it goes -- so its shape is the two
   stroke lists one after the other, exactly as it always was. A block's
   pieces are shrunk into the parts its square is cut into (wsBlockBoxes).

   The pen is not shrunk with them: the font sweeps every stroke with the one
   pen (GPEN), so a letter drawn into a quarter of the square is the same
   weight as a letter drawn into all of it, which is what a block script
   looks like on paper. */

/* A unit, as the sounds it is spelt with. A unit is those sounds run
   together (wsKey), and a sound can be more than one character -- tʃ -- so it
   is read back off the language's own sounds, the longest first, and a
   character that is none of them stands for itself. */
function wsSeq(unit){
  var snds=addedSnd().slice(), out=[], i=0, j, hit;
  LETTERS.forEach(function(l){ (l.snd||[]).forEach(function(x){ if(x && snds.indexOf(x)<0) snds.push(x); }); });
  snds.sort(function(x, y){ return y.length-x.length; });
  unit=String(unit||'');
  while(i<unit.length){
    hit='';
    for(j=0;j<snds.length;j++)
      if(snds[j].length>1 && unit.substr(i, snds[j].length)===snds[j]){ hit=snds[j]; break; }
    if(!hit) hit=unit.charAt(i);
    out.push(hit); i+=hit.length;
  }
  return out;
}
/* How a vowel's square is cut, one of three: `lr`, the vowel beside what
   comes before it (ㅏ); `tb`, the vowel under it (ㅗ); `q`, the square cut in
   four like 田, the vowel beside and the finals in the two quarters under.
   「4分割までで作れればいいんちゃう？」 OWNER 2026-09-26. The language's, in
   the `script` slice beside the direction and the gap: `SCRIPT.blk` names the
   vowels that are not `lr`, and a vowel it does not name -- or names with a
   value this build does not know -- goes beside. */
var WS_BLK_CUTS=['lr', 'tb', 'q'];
function wsBlkOf(v){
  var k=SCRIPT.blk && SCRIPT.blk[v];
  return (k && WS_BLK_CUTS.indexOf(k)>0)? k : 'lr';
}
function wsBlkSet(v, k){
  var m={}, x;
  for(x in SCRIPT.blk||{}) if(Object.prototype.hasOwnProperty.call(SCRIPT.blk, x)) m[x]=SCRIPT.blk[x];
  if(WS_BLK_CUTS.indexOf(k)>0) m[v]=k; else delete m[v];
  SCRIPT.blk=m;
}
/* The vowel a letter's page chooses the cut for: the first vowel of the
   language the letter reads, while the writing is a block, or ''. */
function wsBlkVowOf(l){
  var vs, i;
  if(!l || wsys()!=='block') return '';
  vs=wsVows();
  for(i=0;i<(l.snd||[]).length;i++) if(vs.indexOf(l.snd[i])>=0) return l.snd[i];
  return '';
}
/* The parts of the square a syllable stands in, in the order of its sounds,
   as [x, y, w, h] in fractions of the lattice, or null when the syllable
   does not fit the cut. Rows down, each row cut across:

     lr    onset and vowel in one row          ㅎㅏ
     tb    onset over vowel                    ㅎ / ㅗ
     and a row underneath for the finals, in either      ㄴ
     q     onset and vowel in one row, and under them two quarters, the
           finals from the left -- one final stands in the left quarter
           alone. With no final it is lr.        ㄷㅏ / ㄹㄱ

   A square is cut into four parts at most, so a syllable of more letters
   than that is not put together (wsParts). The final row of lr and tb is
   lower than the others and there is a gap between two parts; both are a
   look, not a rule anybody has given (docs/scope/r102-block.md). */
var WS_BLK={gap:0.06, low:0.7};
function wsBlockBoxes(on, nu, co, type){
  var q=(type==='q'), rows=(type==='tb')? [on, nu, co] : [on.concat(nu), co],
      use=[], i, j, n, sum=0, y=0, h, w, out=[], g=WS_BLK.gap;
  if(q && (rows[0].length>2 || co.length>2)) return null;
  for(i=0;i<rows.length;i++){
    if(!rows[i].length) continue;
    n=(q && i>0)? 2 : rows[i].length;
    use.push({n:n, k:rows[i].length, wt:(!q && i===rows.length-1 && co.length && i>0)? WS_BLK.low : 1});
  }
  for(i=0;i<use.length;i++) sum+=use[i].wt;
  for(i=0;i<use.length;i++){
    h=(1-g*(use.length-1))*use[i].wt/sum;
    w=(1-g*(use[i].n-1))/use[i].n;
    for(j=0;j<use[i].k;j++) out.push([j*(w+g), y, w, h]);
    y+=h+g;
  }
  return out;
}
/* What a unit is put together from: [{s: sound, box}], or null when this
   writing system does not put this unit together. `type` is for a preview
   of a cut the language has not been given yet; nothing else passes it. */
function wsParts(unit, type){
  var k=wsys(), seq=wsSeq(unit), on=[], nu=[], co=[], i, box, out=[];
  if(seq.length<2) return null;
  if(k==='abugida'){
    if(seq.length!==2 || ipaIsVowel(seq[0]) || !ipaIsVowel(seq[1])) return null;
    return [{s:seq[0], box:null}, {s:seq[1], box:null}];
  }
  if(k!=='block') return null;
  for(i=0;i<seq.length;i++){
    if(ipaIsVowel(seq[i])){ if(co.length) return null; nu.push(seq[i]); }
    else if(nu.length) co.push(seq[i]);
    else on.push(seq[i]);
  }
  if(!nu.length || seq.length>4) return null;
  box=wsBlockBoxes(on, nu, co, type || wsBlkOf(nu[0]));
  if(!box) return null;
  seq=on.concat(nu).concat(co);
  for(i=0;i<seq.length;i++) out.push({s:seq[i], box:box[i]});
  return out;
}
/* A shape drawn into a part of the square. A box of null is the whole
   square, and the shape is handed back as it is -- the same objects, so an
   abugida's letter is byte for byte what it was. */
function wsInto(g, box){
  var a=GGRID.inset, S=800-2*a;
  function at(p){ return [Math.round(a+(box[0]+(p[0]-a)/S*box[2])*S), Math.round(a+(box[1]+(p[1]-a)/S*box[3])*S)]; }
  if(!box) return g;
  return g.map(function(x){
    if(inkRings(g)) return x.map(at);
    var c={}, f;
    for(f in x) if(Object.prototype.hasOwnProperty.call(x, f)) c[f]=x[f];
    c.pts=x.pts.map(at);
    return c;
  });
}
/* The shape of a unit: the letter drawn for it, or the pieces put together.
   Every piece that has a shape of the first piece's kind is drawn -- two
   kinds are not one shape (inkRings) -- and a unit whose first piece has no
   shape has none. A mark with no drawing, or a vowel of a block nobody drew
   yet, leaves the rest standing, as it always did for an abugida. */
function wsStrokes(unit, type){
  var own=inkGeo(ltMain(unit)), parts, i, g, out=null, rings;
  if(own && !type) return own;
  parts=wsParts(unit, type);
  if(!parts) return own || null;
  for(i=0;i<parts.length;i++){
    g=inkGeo(ltMain(parts[i].s));
    if(!i){ if(!g) return null; rings=inkRings(g); out=[]; }
    if(!g || inkRings(g)!==rings) continue;
    out=out.concat(wsInto(g, parts[i].box));
  }
  return out;
}
/* A word in the letters chosen for it. Used for borrowed characters; drawn
   letters are a font and need no substitution. */
function wsInScript(hw){
  var u=wsSplit(seqOf(hw)), out=[], i, c;
  for(i=0;i<u.length;i++){ c=ltChar(u[i]); out.push(c || u[i]); }
  return out.join('');
}

/* ---- which way the language is written --------------------------------
   「縦書き、右→左 左→右の投稿」「言語の設定でしょ右左とかは」

   Four, and the two vertical ones differ only in which side the first column
   is on: 「右から左と左から右の両方」.

     ltr      left to right
     rtl      right to left
     ttb-rl   in columns, top to bottom, the first column at the right
     ttb-lr   in columns, top to bottom, the first column at the left

   It belongs to the LANGUAGE, not to the person and not to the post, so it is
   in the `script` slice beside the glyphs -- which means it is in the backup,
   it travels when a language is opened, and there is one answer per language
   rather than one per phone. SET.wsys is the other way round and is the older
   mistake; what the language is for was in SET too, until it was moved out.

   Reading one is free, on every plan. Setting one is `dir`, at Plus. Nothing
   in the app asks can('dir') before drawing anything -- see the note on CAN
   in core.js. */
var DIRS=['ltr', 'rtl', 'ttb-rl', 'ttb-lr'];
/* Left to right on the free plan, and the stored answer is kept untouched
   underneath -- exactly as wsys() returns 'alpha' without clearing SET.wsys.

   A language that came down from a paid plan runs the free way while it is
   there, and runs its own way again the moment the plan comes back. Nothing
   is rewritten and nothing is lost: SCRIPT.dir is in the `script` slice and
   in the backup, and it is one string.

   This is the whole plan speaking with one voice -- 「無料に戻ったら無料の形
   に戻る、作ったものは全部残る」 -- rather than this one capability being
   the exception that keeps working after the money stops.

   And 「nobody has asked」 is not free (www/core.js § has): the language is
   written the way it is written until the answer says otherwise, so a post
   sent before verify-plan lands does not carry `ltr` for a language written
   right to left -- pwSend() puts scriptDir() ON the post (The past). */
function scriptDir(){
  if(planNo(can('dir'))) return 'ltr';
  return DIRS.indexOf(SCRIPT.dir)>=0 ? SCRIPT.dir : 'ltr';
}
/* What a direction is called in CSS. `writing-mode` is the whole of it for
   the two vertical ones -- vertical-rl and vertical-lr say which side the
   first column is on -- and `direction` is the whole of it for the two
   horizontal ones. The class carries it rather than a style attribute so
   there is one place it is written down. */
function dirClass(d){
  return 'dir-'+(DIRS.indexOf(d)>=0 ? d : 'ltr');
}
function setScriptDir(k){
  if(DIRS.indexOf(k)<0) return;
  /* The screen only offers this on a paid plan; this is the same sentence
     said where it can be relied on, since a route can be arrived at from
     anywhere and a plan can end while one of the four is set. Exactly as
     setWsys() does it. */
  if(upStop(can('dir'))) return;
  SCRIPT.dir=k; save();
  render();
}
/* 字間, in steps of the lattice (glyph.js § geSide), and the one place its
   three numbers are written. 「あの文字間は規定を1としてスライドで文字間が見える
   ように … 最大0と2くらいでいいと思う。開けすぎると投稿が大変」 OWNER
   2026-09-23. `def` is what inkSteps() gives a language that was never set,
   and the slider's rest. The step is not the owner's number: a tenth. */
var SP_RANGE={min:0, max:2, def:1, step:0.1};
/* A value off the slider, held to the range and to the step -- a range input
   hands back a string, and 0.30000000000000004 is not a tenth. */
function spClamp(v){
  v=parseFloat(v);
  if(!(v===v)) return SP_RANGE.def;
  v=Math.max(SP_RANGE.min, Math.min(SP_RANGE.max, v));
  return parseFloat((Math.round(v/SP_RANGE.step)*SP_RANGE.step).toFixed(6));
}
/* 字間's own page: the slider, and under it the language's letters at that
   gap written across and written down. 「字間> スライダーと下に横と縦それぞれ
   スライドしてどう動くかで別ページにした方が見やすい。」 OWNER 2026-09-23.
   Both are a post's line -- `.pline` and dirClass(), the element a post is
   set in (www/post.js § postLnHTML) -- so what moves here is what a post
   will look like, because it is the same thing. Across is the language's own
   way across and down its own way down, where it has one; otherwise left to
   right, and the first column on the right. */
/* The spacing's `?` (OWNER 2026-09-26 「？の中に描きまくろう」). */
HELP.sp=function(){
  return {t:t('set.sp'), h:
    helpPara(t('hp.sp.p'))+
    helpStep(1, t('hp.sp.1'), t('hp.sp.1.d'))+
    helpStep(2, t('hp.sp.2'), t('hp.sp.2.d'))+
    helpPara(t('hp.sp.p2'))};
};
function vSp(){
  var v=inkSteps(SCRIPT.sp), d=SCRIPT.dir,
      hz=(d==='rtl')? 'rtl' : 'ltr', vt=(d==='ttb-lr')? 'ttb-lr' : 'ttb-rl';
  return '<div class="view">'+navTop('', helpQ('sp'))+'<div class="body">'+
    /* Styled here rather than in index.html, which is not this page's to
       touch. The slider is the 44pt a thumb needs. */
    '<div class="set" style="padding:2px 2px 3px">'+
      '<input type="range" style="flex:1 1 auto;min-width:0;height:44px;margin:0;accent-color:var(--gold)" min="'+SP_RANGE.min+'" max="'+SP_RANGE.max+'" step="'+SP_RANGE.step+'" '+
        'value="'+v+'" aria-label="'+esc(t('set.sp'))+'"' + IN('spFeel') + CH('setScriptSp') + '></div>'+
    '<div class="pline sppv '+dirClass(hz)+'">'+spPv(v)+'</div>'+
    '<div class="pline sppv '+dirClass(vt)+'">'+spPv(v)+'</div>'+
    '</div></div>';
}
/* Up to three letters that have a shape, the first ones drawn; a language
   with one draws it three times, and a language with none shows their names
   as text, which is what a post line shows. */
function spPvLts(){
  var lts=ltPuaOrder().filter(ltHasShape).slice(0,3);
  while(lts.length && lts.length<3) lts.push(lts[0]);
  return lts;
}
/* The preview's letters at gap `v`, as the characters a post's line is made
   of (www/glyph.js § A LINE OF THE LANGUAGE IS TEXT) -- so what stands here
   is what a post will look like, because it is the same thing. */
function spPv(v){
  var lts=spPvLts(), out='', i;
  for(i=0;i<lts.length;i++) out+=inkChar(inkGeo(lts[i]), inkSide(v));
  return out || esc(ltPuaOrder().slice(0,3).map(ltName).join(''));
}
/* The thumb moving: the two lines and nothing else. A render here would
   rebuild the slider under the finger. */
function spFeel(v){
  var els=document.querySelectorAll('.sppv'), h=spPv(spClamp(v)), i;
  for(i=0;i<els.length;i++) els[i].innerHTML=h;
  inkFaces();
}
/* The thumb let go: the language's, saved the way every row of 設定 → 言語
   saves -- save(), then render(), which also rebuilds the font. No plan is
   asked. A plan decides what somebody may DO, and this is how the letters
   they drew stand beside each other; it is not in CAN. */
function setScriptSp(v){
  SCRIPT.sp=spClamp(v); save();
  render();
}
