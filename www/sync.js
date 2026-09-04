/* Lingua — putting a language and its copy back together (chapter 26)
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   A language belongs to the account now, so it exists twice: on the phone,
   where it is made, and on the server, where it is kept. Two copies of one
   thing is the whole of what this chapter is about.

   The rule is one sentence and it is docs/DATA_SAFETY.md's:

     PUT THE TWO TOGETHER. NEITHER SIDE WINS BY BEING NEWER.

   A word added here and a word added there are BOTH added -- which is what
   anybody would expect and is not what "sync" usually means. The usual thing
   is a save number, and a save number decides which of the two people loses
   an afternoon. 「そりゃあ両方足すだろ」

   What that costs is a duplicate rather than a deletion. Edit the same note
   on two phones and there are two notes afterwards, both of them yours, one
   of them to throw away. That is the trade this chapter makes on purpose: a
   duplicate is on the screen and can be dealt with, and a deletion is not
   there to be noticed.

   Nothing here talks to the server -- net.js does that, and it is the one
   window. What is here is what a slice IS, which is why it can be run in a
   check with no server at all.
   ========================================================================= */

/* =========================================================================
   26. Two copies of one language
   ========================================================================= */

/* What makes two items the same item. Two slices have a real name for their
   rows and the rest do not:

     words     the headword. It is what a word IS here -- findWord() looks a
               word up by it and nothing else does
     letters   the id ltNew() gives them

   For everything else the item is its own name: two notes are the same note
   when they say the same thing. That is coarser than an id would be -- edit
   a note on two phones and there are two of it -- and it is the direction
   this chapter errs in. Giving the keyless ones an id here would be
   inventing a field the rest of the app does not write. */
function syKeyOf(kind, x){
  if(x && typeof x==='object'){
    if(kind==='words'  && x.hw) return 'k'+String(x.hw);
    if(kind==='letters'&& x.id) return 'k'+String(x.id);
  }
  try{ return 'j'+JSON.stringify(x); }catch(e){ return 'j'+String(x); }
}
function syText(x){ try{ return JSON.stringify(x); }catch(e){ return String(x); } }
/* Mine first, then whatever came back that is not already in it. Mine first
   because the order of a dictionary is the order somebody built it in, and a
   phone that reordered itself every time it spoke to the server would be
   answering a question nobody asked.

   AND WHAT SOMEBODY REMOVED STAYS REMOVED. This used to be the whole of the
   function: both sides, added. Two of those sides can only ever grow, so a
   word deleted here came back off the server on the next launch with a signal
   -- at the END of the list rather than where it was -- and was then written
   back UP, so the phone taught the server its own mistake. Measured before it
   was written: delete, sync, and the word is in the dictionary and in the
   slice on the server again. 「消すも保存もそうだけど、そういったものが動く時は
   サーバーに行かないと。オフラインで作業できるのはオンラインに復帰した時に
   それが最新データになるんだから」 OWNER 2026-09-04.

   `base` is what this phone and the server LAST AGREED this slice was. With
   it the two cases stop looking alike: something in the base that is not in
   mine was REMOVED HERE, and something in theirs that is in no base is
   something this phone has not been told about yet. Without a base -- the
   first sync after this shipped, or a language that has never been up --
   nothing is dropped and this is exactly what it always was.

   IT DROPS ONLY WHAT IS UNCHANGED ON THE OTHER SIDE. If what the server is
   holding is not the same thing that was removed, somebody edited it on
   another phone after this one deleted it, and WHICH OF THOSE TWO WINS IS NOT
   DECIDED ANYWHERE YET. So it comes back, which is what happens today and is
   the side that loses nothing. Nothing here quietly answers a question the
   owner has not been asked. */
/* ---- TWO ROWS THAT ARE ONE THING ---------------------------------------
   An id says which ROW this is. It does not always say which THING, and for
   the free plan's thirty-eight it never did: `a` is a slot, the same slot on
   every account and at every launch, and the id it was wearing was minted by
   whichever run of ltStart() happened to make it. Two runs made two ids, this
   function was told they were two letters, and thirty-eight became
   SEVENTY-SIX -- a a, b b, c c, every reading twice.
   「あと、キーボード足したりしてたら文字増殖してるんだけど何で？」OWNER
   2026-09-04.

   The alphabet chapter is asked which slot a letter is rather than this one
   deciding: ltSlotKey() in www/letters.js is where that sentence lives and
   there is no second copy of it here. Everything else -- a letter somebody
   added, a word, a note -- is its own name still, which is syKeyOf(). */
function syOneOf(kind, x){
  if(kind!=='letters' || !x || typeof x!=='object') return '';
  var s=ltSlotKey(x);
  return s? ('s'+s) : '';
}
/* WHETHER ANYBODY HAS MADE ANYTHING OF THIS ROW, and it is a question only the
   alphabet can answer: ltDrawn() -- a drawing, a shape off a written sheet, a
   borrowed character. FALSE everywhere else, and that is not a gap. It is what
   keeps every other slice exactly as it was: a word, a note or a stage that is
   on both sides falls to the last line of syPut(), which is mine. Nothing here
   changes what happens to anything but letters. */
function syMade(kind, x){ return (kind==='letters') && ltDrawn(x); }
/* One row, put in -- and what happens when the thing it is, is already here.

   Three answers, and they are docs/DATA_SAFETY.md's order rather than a
   preference:

     what is here has nothing on it and this has something -> this takes its place
     both have something                                   -> BOTH are kept
     otherwise                                             -> what is here stays

   The first is the whole reason this is a join and not a choice. Giving the
   slots steady ids stops the doubling, and ON ITS OWN it turns the doubling
   into a DELETION: an account whose alphabet has not arrived yet builds
   thirty-eight empty slots, they wear the same ids as the drawn ones on the
   server, mine-first hands back thirty-eight blanks, and they are written up
   over the drawings. Measured both ways on the same route -- seventy-six
   letters of which thirty-eight were drawn, against thirty-eight of which NONE
   were. A duplicate is on the screen and can be dealt with. A deletion is not
   there to be noticed. 「そりゃあ両方足すだろ」 */
function syPut(kind, out, at, seen, x){
  var k=syOneOf(kind, x) || syKeyOf(kind, x), j=at[k];
  seen[syKeyOf(kind, x)]=1;
  if(j===undefined){ at[k]=out.length; out.push(x); return; }
  if(!syMade(kind, out[j]) && syMade(kind, x)){ out[j]=x; return; }
  /* BOTH KEPT ONLY WHERE THEY ARE TWO ROWS. One id is one row and always was:
     redraw a letter here and redraw it there, and what comes back is one
     letter -- this phone's -- because that is the same letter twice and not
     two of them. `backup-check` holds that and went red when this line did not
     say so. Two ids under one slot is the other thing, and is the only thing
     this branch is for. */
  if(syKeyOf(kind, out[j])!==syKeyOf(kind, x) &&
     syMade(kind, out[j]) && syMade(kind, x)) out.push(x);
}
function syArr(kind, mine, theirs, base){
  var out=[], seen={}, at={}, was={}, i, k;
  if(base) for(i=0;i<base.length;i++) was[syKeyOf(kind, base[i])]=syText(base[i]);
  for(i=0;i<mine.length;i++) syPut(kind, out, at, seen, mine[i]);
  for(i=0;i<theirs.length;i++){
    k=syKeyOf(kind, theirs[i]);
    /* it was here, it is not here now, and nobody has touched it over there.
       Asked only of what mine does not already hold -- `seen` is every row
       mine put in, which is what "it is not here now" means. */
    if(!seen[k] && Object.prototype.hasOwnProperty.call(was, k) &&
       was[k]===syText(theirs[i])) continue;
    syPut(kind, out, at, seen, theirs[i]);
  }
  return out;
}
function syIsObj(x){
  return !!x && typeof x==='object' && Object.prototype.toString.call(x)!=='[object Array]';
}
function syIsArr(x){ return Object.prototype.toString.call(x)==='[object Array]'; }
/* Every key of both. Where a key is on both sides and both are the same kind
   of thing, they go together too -- SCRIPT is {g:{...}, extra:[...]} and STG
   is seven of these, so a merge that stopped at the top level would take one
   phone's whole grammar over the other's. Where they are two different
   things, or two plain values, the phone's own is kept: this is called with
   what came back from the server as `theirs`, and a language is edited on
   the phone. */
function syObj(kind, mine, theirs, base){
  var out={}, k, b;
  for(k in theirs) if(Object.prototype.hasOwnProperty.call(theirs, k)) out[k]=theirs[k];
  for(k in mine) if(Object.prototype.hasOwnProperty.call(mine, k)){
    if(!Object.prototype.hasOwnProperty.call(out, k)){ out[k]=mine[k]; continue; }
    /* the same key of what the two sides last agreed, so a list nested inside
       a slice -- STG's seven, SCRIPT's `extra` -- knows what was removed too */
    b=(base && Object.prototype.hasOwnProperty.call(base, k))? base[k] : null;
    if(syIsArr(mine[k]) && syIsArr(out[k])){
      out[k]=syArr(kind, mine[k], out[k], syIsArr(b)? b : null); continue; }
    if(syIsObj(mine[k]) && syIsObj(out[k])){
      out[k]=syObj(kind, mine[k], out[k], syIsObj(b)? b : null); continue; }
    out[k]=mine[k];
  }
  return out;
}
/* One slice, as the string localStorage holds -- which is the same string
   bkPack() writes into a backup file, so a slice has one shape and not two.

   Three answers, and the order matters. Nothing on one side is the other
   side whole: that is a phone that has never seen this language, or a
   language that has never been up, and neither is a merge. Only then is
   anything decided.

   `lang` is the one slice that is not JSON -- it is the language's name,
   stored as plain text -- so it falls through to the last line and the
   phone's own is kept. Renaming a language on the other phone is not
   something this chapter can put together, and it is one word to retype. */
function syMerge(kind, mine, theirs, base){
  var a, b, c=null;
  if(typeof mine!=='string' || mine==='') return (typeof theirs==='string')? theirs : '';
  if(typeof theirs!=='string' || theirs==='') return mine;
  if(mine===theirs) return mine;
  try{ a=JSON.parse(mine); b=JSON.parse(theirs); }catch(e){ return mine; }
  /* Unreadable is the same as absent: no base, and then nothing is dropped. */
  if(typeof base==='string' && base!==''){ try{ c=JSON.parse(base); }catch(e){ c=null; } }
  if(syIsArr(a) && syIsArr(b)) return JSON.stringify(syArr(kind, a, b, syIsArr(c)? c : null));
  if(syIsObj(a) && syIsObj(b)) return JSON.stringify(syObj(kind, a, b, syIsObj(c)? c : null));
  return mine;
}
