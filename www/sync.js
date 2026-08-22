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
/* Mine first, then whatever came back that is not already in it. Mine first
   because the order of a dictionary is the order somebody built it in, and a
   phone that reordered itself every time it spoke to the server would be
   answering a question nobody asked. */
function syArr(kind, mine, theirs){
  var out=[], seen={}, i, k;
  for(i=0;i<mine.length;i++){
    k=syKeyOf(kind, mine[i]);
    if(seen[k]) continue;
    seen[k]=1; out.push(mine[i]);
  }
  for(i=0;i<theirs.length;i++){
    k=syKeyOf(kind, theirs[i]);
    if(seen[k]) continue;
    seen[k]=1; out.push(theirs[i]);
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
function syObj(kind, mine, theirs){
  var out={}, k;
  for(k in theirs) if(Object.prototype.hasOwnProperty.call(theirs, k)) out[k]=theirs[k];
  for(k in mine) if(Object.prototype.hasOwnProperty.call(mine, k)){
    if(!Object.prototype.hasOwnProperty.call(out, k)){ out[k]=mine[k]; continue; }
    if(syIsArr(mine[k]) && syIsArr(out[k])){ out[k]=syArr(kind, mine[k], out[k]); continue; }
    if(syIsObj(mine[k]) && syIsObj(out[k])){ out[k]=syObj(kind, mine[k], out[k]); continue; }
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
function syMerge(kind, mine, theirs){
  var a, b;
  if(typeof mine!=='string' || mine==='') return (typeof theirs==='string')? theirs : '';
  if(typeof theirs!=='string' || theirs==='') return mine;
  if(mine===theirs) return mine;
  try{ a=JSON.parse(mine); b=JSON.parse(theirs); }catch(e){ return mine; }
  if(syIsArr(a) && syIsArr(b)) return JSON.stringify(syArr(kind, a, b));
  if(syIsObj(a) && syIsObj(b)) return JSON.stringify(syObj(kind, a, b));
  return mine;
}
