/* Lingua — letters, which are not sounds
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   「音と文字だけど、音に対して文字入れるのおかしくね？文字と音は別だし、同じ文字でも
   違う音が当てられる時あるやん。そこの認識。使う音と文字とアルファベットは別。」

   He is right, and the old model could not say it. A shape was stored under
   the sound it was for -- SCRIPT.g['k'] -- so a letter had no existence apart
   from its sound. That makes three ordinary things impossible:

     one sound, two letters    c and k both read /k/; s and ß both read /s/
     one letter, two sounds    c reads /k/ and /s/; English g reads two ways
     a letter with no sound    a shape you drew and have not decided about

   A letter is its own thing here. It has an identity, a shape (drawn or
   borrowed), a name of its own, and a list of what it reads as -- which can
   be empty, or long. Sounds are a separate list and always were. The two are
   joined, not nested, so the join can be edited from either end: 「音専用ページと
   文字アルファベットページ別にして。どっちからでもお互い追加できるようにすればいい」

   What a letter reads as is a UNIT, not always a single sound, because that
   was already true: a syllabary letter reads "ka", a logograph reads a whole
   word. wsys.js decides where a word is cut into units; this file decides
   what writes each one.

   Where two letters read the same unit, the first is the one the font uses,
   because a font maps one code point to one glyph and there is nothing else
   it could do. Which of them a particular word uses is the word's business
   and lives on the word. */

var LETTERS=[];
/* The open language's alphabet. Empty first: see langRead() in core.js. */
function ltRead(){
  LETTERS=[];
  try{ var lt=JSON.parse(localStorage.getItem(langKey('letters'))||'null'); if(lt && lt.length) LETTERS=lt; }catch(e){}
}
ltRead();
function saveLetters(){ try{ localStorage.setItem(langKey('letters'), JSON.stringify(LETTERS)); }catch(e){} }

/* ---- moving the old shape of things over ------------------------------
   Everything drawn before this ran was stored under its sound, which is
   exactly a letter that reads one unit. Nothing is lost and nothing has to
   be redrawn. Borrowed characters come across the same way. */
var LT_SEQ=0;
function ltId(){
  LT_SEQ++;
  return 'l'+LT_SEQ+'_'+LETTERS.length+'_'+(LETTERS.length? LETTERS[0].id.length : 0);
}
function migrateLetters(){
  if(LETTERS.length) return;
  var moved=0, k, m;
  for(k in SCRIPT.g){
    if(!SCRIPT.g[k] || !SCRIPT.g[k].length) continue;
    LETTERS.push({id:ltId(), st:SCRIPT.g[k], ch:'', nm:'', snd:[k]});
    moved++;
  }
  m=(SET.script||{});
  for(k in m){
    if(!m[k]) continue;
    LETTERS.push({id:ltId(), st:null, ch:m[k], nm:'', snd:[k]});
    moved++;
  }
  if(moved) saveLetters();
}

/* ---- reading the join ------------------------------------------------- */
function ltById(id){
  var i; for(i=0;i<LETTERS.length;i++) if(LETTERS[i].id===id) return LETTERS[i];
  return null;
}
/* Every letter that reads this unit, in the order they were made. */
function ltFor(unit){
  var out=[], i;
  for(i=0;i<LETTERS.length;i++) if(LETTERS[i].snd && LETTERS[i].snd.indexOf(unit)>=0) out.push(LETTERS[i]);
  return out;
}
/* The one the font uses. */
function ltMain(unit){ var a=ltFor(unit); return a.length? a[0] : null; }
function ltStrokes(unit){ var l=ltMain(unit); return (l && l.st && l.st.length)? l.st : null; }
function ltChar(unit){ var l=ltMain(unit); return (l && l.ch)? l.ch : ''; }
function ltHasShape(l){ return !!(l && ((l.st && l.st.length) || l.ch)); }
/* What a letter is called. Its own name if it was given one, otherwise what
   it reads -- and if it reads nothing yet, nothing. A letter with no name and
   no sound is still a letter; it is drawn and it is on the page. */
function ltName(l){
  if(!l) return '';
  if(l.nm) return l.nm;
  if(l.snd && l.snd.length) return l.snd.join(' ');
  return '';
}
/* Letters with no sound on them yet. The reason the two chapters are two
   chapters: you can draw an alphabet first and decide later. */
/* Letters that read nothing at all, which is a thing to finish. A letter that
   reads `?` reads something and is finished. */
function ltLoose(){
  return LETTERS.filter(function(l){ return !ltUnits(l).length; });
}

/* ---- writing the join -------------------------------------------------- */
/* ---- a mark is a letter with no sound in it ----------------------------
   A letter used to be one thing: the shape for a sound. Everything the
   writing system draws was worked out from the phonology, so a shape that
   reads nothing had no way to exist -- a question mark was a letter you had
   not finished yet, and the app said so, forever.

   The fix for that was a switch on every letter: reads a sound, or is a mark.
   Two more fields, a segmented control on a screen, and a question nobody
   wanted answered -- a question mark IS a question mark, and it has no sound
   because it has no sound. Saying so twice is what made the screen ugly.

   So there is one field, and it is what the letter reads. Roman letters are a
   sound. A character that is not a roman letter is itself: `?` reads `?`. The
   font takes its code point from the same place either way. */
function ltIsMark(l){
  var u=ltUnits(l);
  return u.length>0 && !ltHasSound(l);
}
/* Whether any part of what this reads is on the chart. A unit is one or more
   sounds run together, so `ka` counts and `?` does not. */
function ltHasSound(l){
  var u=ltUnits(l), all=ipaAll(), i, j, p;
  for(i=0;i<u.length;i++){
    p=uSplit(u[i]);
    for(j=0;j<p.length;j++) if(all.indexOf(p[j])>=0) return true;
  }
  return false;
}
function ltMarks(){ return LETTERS.filter(ltIsMark); }
/* Letters that had the switch: role 'mark' with the character in `key`. The
   character is what it reads now. Runs once, on a phone, and touches only the
   letters that carry the old shape. */
function migrateMarks(){
  var moved=0, i, l;
  for(i=0;i<LETTERS.length;i++){
    l=LETTERS[i];
    if(l.role===undefined && l.key===undefined) continue;
    if(l.role==='mark' && l.key && (!l.snd || !l.snd.length)) l.snd=[l.key];
    delete l.role; delete l.key;
    moved++;
  }
  if(moved) saveLetters();
}

/* The first sound in the inventory that nothing reads yet, in the chart's
   order. Empty when every one of them is spoken for.

   This is what a newly drawn letter is given. Making a script is a
   substitution: you are saying "my K looks like this", and the sound was
   already there -- ohayo, annyon, ni hao all spell out in an alphabet
   somebody already has. So the sound is carried over rather than asked for,
   and what a letter reads is corrected on the letter, not decided before it
   exists. */
function ltNextFree(){
  var have=addedSnd(), i;
  for(i=0;i<have.length;i++) if(!ltFor(have[i]).length) return have[i];
  return '';
}
function ltNew(o){
  var l={id:ltId(), st:(o&&o.st)||null, ch:(o&&o.ch)||'', nm:(o&&o.nm)||'',
         snd:(o&&o.snd)? o.snd.slice() : []};
  /* A letter made with nothing said about what it reads takes the next free
     sound. One made FOR something (ltForUnit) already carries it. */
  if(!l.snd.length){
    var u=ltNextFree();
    if(u) l.snd=[u];
  }
  LETTERS.push(l); saveLetters();
  return l;
}
/* What this letter reads, spelled the way a person would write it. One word
   per unit, separated by spaces, because a letter may read more than one
   thing -- c reads /k/ and /s/. The field on the letter screen shows this and
   ltSetRoman reads it back. */
function ltRoman(l){
  var u=ltUnits(l), all=ipaAll(), out=[], i, j, p, w;
  for(i=0;i<u.length;i++){
    p=uSplit(u[i]); w='';
    for(j=0;j<p.length;j++) w+=(all.indexOf(p[j])>=0)? ipaRoman(p[j]) : p[j];
    out.push(w);
  }
  return out.join(' ');
}
/* Correcting what a letter reads -- the only time anybody says anything about
   a sound, because the letter was given one when it was drawn. Emptying the
   field takes the reading off; a letter that reads nothing is a letter, and
   the letters chapter lists it as one still to finish.

   A sound somebody says their letter reads is a sound their language has, so
   it joins the inventory rather than being refused for not being in it.

   Nothing is written if any part of what was typed cannot be read: half a
   correction applied silently is worse than none. */
function ltSetRoman(id, sp){
  var l=ltById(id); if(!l) return;
  var words=String(sp||'').split(/\s+/), units=[], seen=[], i, j, parts;
  for(i=0;i<words.length;i++){
    if(!words[i].length) continue;
    /* Not roman letters: it is itself. `?` reads `?`, and joins no inventory
       because it is not a sound. */
    if(!/^[A-Za-z]+$/.test(words[i])){ units.push(words[i]); continue; }
    parts=ipaFromRoman(words[i]);
    if(!parts){ toast(t('lt.reads.no')); return; }
    units.push(parts.join(''));
    for(j=0;j<parts.length;j++) if(seen.indexOf(parts[j])<0) seen.push(parts[j]);
  }
  if(seen.length){
    var have=addedSnd();
    for(i=0;i<seen.length;i++) if(have.indexOf(seen[i])<0) have.push(seen[i]);
    SET.snd=asOrder(have);
    save();
  }
  l.snd=units;
  saveLetters(); installScriptFont(); render();
}
function ltSetStrokes(id, st){
  var l=ltById(id); if(!l) return null;
  if(st && st.length){ l.st=st; l.ch=''; } else l.st=null;
  saveLetters(); return l;
}
function ltSetChar(id, ch){
  var l=ltById(id); if(!l) return null;
  ch=String(ch||'').trim();
  if(ch){ l.ch=ch; l.st=null; } else l.ch='';
  saveLetters(); return l;
}
function ltSetName(id, nm){
  var l=ltById(id); if(!l) return null;
  l.nm=String(nm||'').trim(); saveLetters(); return l;
}
function ltLink(id, unit){
  var l=ltById(id); if(!l || !unit) return null;
  if(!l.snd) l.snd=[];
  if(l.snd.indexOf(unit)<0) l.snd.push(unit);
  saveLetters(); return l;
}
function ltUnlink(id, unit){
  var l=ltById(id); if(!l || !l.snd) return null;
  var i=l.snd.indexOf(unit);
  if(i>=0) l.snd.splice(i,1);
  saveLetters(); return l;
}
/* Deleting a letter: asked for, confirmed, and left behind. ltDel() below is
   the storage half and says nothing to anybody. This was geDelete() on the
   drawing screen, which is why it read the editor's state instead of an id --
   and why deleting a letter meant opening the surface it was drawn on. */
function ltDelete(id){
  var l=ltById(id); if(!l) return;
  var nm=ltName(l)||t('lt.untitled');
  if(!confirm(t('glyph.del.ask'))) return;
  ltDel(id);
  if(GE && GE.lid===id) GE=null;
  save(); installScriptFont();
  back();
  toast(t('glyph.deleted', nm));
}
function ltDel(id){
  LETTERS=LETTERS.filter(function(l){ return l.id!==id; });
  saveLetters();
}
/* Making a letter for a unit that has none, in one step, because that is what
   the sound chapter's "draw one" button means. */
function ltForUnit(unit){
  var l=ltMain(unit);
  if(l) return l;
  return ltNew({snd:[unit]});
}
/* Everything the two chapters count. */
function ltShaped(){ return LETTERS.filter(ltHasShape).length; }

/* ---- spelling a word with letters -------------------------------------
   「単語も音単位で決めるやついねえだろ。アルファベットに決まった音があるならそのまま、
   漣音化とか音が変わるならそこの単語から変更できるようにして。」

   Nobody spells by phoneme. You press the letters, the letters have sounds,
   and where a sound changes -- a consonant softening before a vowel, a
   syllable running into the next -- you change it on that word and nowhere
   else. A sound change is a fact about a word, not about the alphabet.

   So a word carries a spelling: a list of {l, u}. l is which letter was
   pressed; u is what it says HERE, which is normally the letter's own first
   reading and occasionally something else. The sounds of the word are those
   readings run together, which is what everything else in the app has always
   read, so nothing downstream changes.

   A word made before this, or typed on the sound keyboard, has no spelling
   and does not need one: one is worked out from its sounds when it is
   opened, by asking which letter writes each piece. */
function ltUnits(l){ return (l && l.snd)? l.snd : []; }
function ltFirstUnit(l){ var u=ltUnits(l); return u.length? u[0] : ''; }
/* A unit is one or more sounds run together. Splitting it back is asking the
   inventory which of its sounds the unit starts with, longest first, so "tʃa"
   comes apart as tʃ + a and not as t + ʃ + a. */
function uSplit(u){
  var out=[], s=String(u||''), snd=addedSnd().slice(), i, hit;
  snd.sort(function(a,b){ return b.length-a.length; });
  while(s.length){
    hit=null;
    for(i=0;i<snd.length;i++) if(snd[i] && s.indexOf(snd[i])===0){ hit=snd[i]; break; }
    if(!hit){ out.push(s.charAt(0)); s=s.slice(1); }
    else { out.push(hit); s=s.slice(hit.length); }
  }
  return out;
}
function spPh(sp){
  var out=[], i;
  for(i=0;i<sp.length;i++) out=out.concat(uSplit(sp[i].u));
  return out;
}
/* The spelling of a word that has none: cut it the way its writing system
   would, and ask which letter writes each piece. */
function spOf(w){
  if(w && w.sp && w.sp.length) return w.sp;
  var u=wsSplit(wPh(w||{ph:[]})), out=[], i, l;
  for(i=0;i<u.length;i++){
    l=ltMain(u[i]);
    out.push({l:l? l.id : '', u:u[i]});
  }
  return out;
}
/* Every letter that can be pressed: the ones that read something. A letter
   with no sound cannot spell anything yet. */
function ltTypable(){
  return LETTERS.filter(function(l){ return ltUnits(l).length>0; });
}
