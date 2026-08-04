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

var LS_LT='lingua.letters';
var LETTERS=[];
try{ var lt=JSON.parse(localStorage.getItem(LS_LT)||'null'); if(lt && lt.length) LETTERS=lt; }catch(e){}
function saveLetters(){ try{ localStorage.setItem(LS_LT, JSON.stringify(LETTERS)); }catch(e){} }

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
function ltAll(){ return LETTERS; }
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
function ltLoose(){
  return LETTERS.filter(function(l){ return !l.snd || !l.snd.length; });
}

/* ---- writing the join -------------------------------------------------- */
function ltNew(o){
  var l={id:ltId(), st:(o&&o.st)||null, ch:(o&&o.ch)||'', nm:(o&&o.nm)||'',
         snd:(o&&o.snd)? o.snd.slice() : []};
  LETTERS.push(l); saveLetters();
  return l;
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
