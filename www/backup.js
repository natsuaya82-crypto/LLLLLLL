/* Lingua — the copy that survives the app (chapter 24)
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   24. The copy that survives the app

   Everything a person makes lives in localStorage, under lingua.<id>.<slice>.
   That is one copy, in a place with four ways to lose it: the app is deleted,
   the phone is replaced without a backup, WKWebView's storage is reclaimed by
   the system, or a migration goes wrong. Three of those four are ordinary
   events, not accidents. 「データ消えるのだけはありえない」

   So a language is also written out as a file, in the app's Documents folder,
   where iOS puts it in the device backup and the Files app can show it. It
   was measured before it was built: a free language -- thirty-eight drawn
   letters and a hundred words -- is 25 KB, and one with five thousand words
   is 697 KB. Writing that whole thing out on every change costs nothing worth
   counting, so it is written whole and there is no partial state to reason
   about.

   This is NOT the cloud. The server copy is a later chapter and a different
   argument; this one needs no account, works with no network, and is the
   thing that is still there when a sync goes wrong. A second copy that can
   only be reached by being online is not a second copy on the day you need
   it.

   Two rules hold the whole design:

     A write never destroys the last good file. The previous one is rotated
     to .1 and .2 first, so a bug that writes rubbish costs a generation
     rather than everything.

     A restore never overwrites a slice that is there. It only fills in one
     that is missing, which is langMigrate's argument -- copying cannot lose
     anything, and this runs on a phone against the only copy of something
     somebody spent months on.
   ========================================================================= */

/* What was handed over, and whether it went. Read by the settings screen so
   somebody can see that their language is on disk rather than being told it
   is. Same shape as SHARE in share.js, for the same reason. */
var BK={dirty:false, at:0, how:''};
/* Something changed. Called by every save* function rather than worked out
   from the storage, because working it out means reading every slice back on
   every render, and at 697 KB that is a copy of the whole language a frame. */
function bkTouch(){ BK.dirty=true; }

/* The whole of the open language, as one object.

   The slices are SLICES in core.js, so a tenth one added there is written out
   the day it is added. They are copied as text and not parsed: what is in
   storage is what gets written, byte for byte, and nothing here can reshape
   it on the way through. */
function bkPack(){
  var out={v:1, id:langId, name:langName, at:(new Date()).getTime(), slice:{}}, i, k, v;
  for(i=0;i<SLICES.length;i++){
    k=SLICES[i];
    try{ v=localStorage.getItem(langKey(k)); }catch(e){ v=null; }
    if(v!==null) out.slice[k]=v;
  }
  return out;
}
/* A name a person will recognise in the Files app, with the id on it because
   two languages may be called the same thing and one of them would otherwise
   overwrite the other. Anything a file name cannot hold is dropped rather
   than escaped -- it is a label, and the id underneath it is what identifies
   the file. */
function bkName(){
  var n=String(langName||'').replace(/[^\w \-]/g, '').replace(/\s+/g, ' ');
  n=n.slice(0, 40);
  return (n? n+' ' : '')+langId;
}
/* Whether there is a native side at all. share.js's sharePlug() with a
   different name would be two functions answering one question, so this is
   that one asked again. */
function bkPush(){
  var p, out;
  if(!BK.dirty || !langId) return;
  p=sharePlug();
  if(!p){ BK.how='no bridge'; return; }
  BK.dirty=false;
  out=JSON.stringify(bkPack());
  p('LinguaShare', 'keep', {name:bkName(), json:out})
    .then(function(){ BK.how='kept'; BK.at=(new Date()).getTime(); })
    ['catch'](function(e){
      BK.dirty=true;
      BK.how='refused: '+((e && (e.message||e.errorMessage))? (e.message||e.errorMessage) : e);
    });
}

/* ---- coming back ------------------------------------------------------
   Read on the way in, once, before anything is shown. What it does is narrow
   on purpose: it puts back a language the app has no trace of, and it fills
   in a slice that is missing from one it does have. It never touches a slice
   that is present, and it never decides that a file is newer than what is in
   storage -- deciding that is how the cloud loses a month of work, and this
   chapter exists to be the thing that did not.

   So a phone whose storage was reclaimed comes back whole, and a phone that
   is simply working sees nothing happen. */
function bkTake(file){
  var d, k, i, put=0;
  try{ d=JSON.parse(file); }catch(e){ return 0; }
  if(!d || !d.id || !d.slice) return 0;
  var prev=langId;
  langId=d.id;
  for(i=0;i<SLICES.length;i++){
    k=SLICES[i];
    if(typeof d.slice[k]!=='string') continue;
    try{
      if(localStorage.getItem(langKey(k))!==null) continue;
      localStorage.setItem(langKey(k), d.slice[k]);
      put++;
    }catch(e){}
  }
  langId=prev;
  if(!LANGS[d.id]){ LANGS[d.id]={name:String(d.name||''), mine:true}; put++; }
  return put;
}
function bkRestore(then){
  var p=sharePlug();
  if(!p){ if(then) then(0); return; }
  p('LinguaShare', 'kept', {})
    .then(function(r){
      var xs=(r && r.files)||[], i, put=0;
      for(i=0;i<xs.length;i++) put+=bkTake(String(xs[i]||''));
      if(put){
        langStore();
        /* Something was put back, so what the screens are holding is a
           language that did not exist a moment ago. Read it in rather than
           patching each global by hand. */
        if(!langId || !LANGS[langId]){
          for(var id in LANGS){ if(Object.prototype.hasOwnProperty.call(LANGS, id)){ langId=id; break; } }
          langStore();
        }
        langRead(); ltRead(); noteRead(); stRead(); tkRead(); sndRead(); kbRead();
      }
      if(then) then(put);
    })
    ['catch'](function(){ if(then) then(0); });
}
