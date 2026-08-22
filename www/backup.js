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

/* What each slice has to BE, read off the functions that read them:
   langRead, ltRead, noteRead, stRead, sndRead. Nothing here is about
   how much is in one -- an empty language is a language, and `[]` is what a
   new one looks like. It is about the shape.

   The distinction this whole chapter turns on:

     unreadable  -> not data. Refuse to write it, restore over it.
     empty       -> data. A new language, a wiped one, a language somebody
                    just switched away from. Write it, keep it, leave it be.

   Conflating those two is how a save system eats somebody's work while
   believing it is protecting it. 「データ件数が減った」で判定しない。 */
var BK_SHAPE={ words:'array', lines:'array', lang:'text', script:'object',
               letters:'array', notes:'array', phases:'object',
               talk:'array', snd:'array', kb:'object', wld:'object' };
/* Is this stored text a slice, or is it wreckage?

   `lang` is the language's name and is stored as a bare string, not as JSON,
   so it is sound whatever it says -- there is nothing in a name that can be
   malformed. Everything else has to parse AND be the shape its reader
   expects, because JSON.parse is happy with `null` and with a number, and a
   reader handed either of those quietly produces an empty language.

   A slice the app has never written is not unsound. It is absent, and absent
   is what a restore is for. */
function bkSound(k, v){
  var want=BK_SHAPE[k], d;
  if(v===null || v===undefined) return false;
  if(want==='text') return true;
  try{ d=JSON.parse(v); }catch(e){ return false; }
  if(d===null || typeof d!=='object') return false;
  if(want==='array') return Object.prototype.toString.call(d)==='[object Array]';
  return Object.prototype.toString.call(d)!=='[object Array]';
}
/* Whether what is in storage for this language can be written out at all.
   Not whether there is much of it. */
function bkOK(pack){
  var i, k;
  if(!pack || !pack.id || !pack.slice) return false;
  for(i=0;i<SLICES.length;i++){
    k=SLICES[i];
    if(!Object.prototype.hasOwnProperty.call(pack.slice, k)) continue;   /* absent */
    if(!bkSound(k, pack.slice[k])) return false;
  }
  return true;
}

/* The whole of the open language, as one object.

   The slices are SLICES in core.js, so a tenth one added there is written out
   the day it is added. They are copied as text and not parsed: what is in
   storage is what gets written, byte for byte, and nothing here can reshape
   it on the way through. */
/* How many times this language has been written out, counting up and never
   down. It is not a clock.

   A clock is what a sync reaches for to decide which copy is newer, and a
   clock is the wrong instrument: a phone whose date is wrong wins every
   argument forever, and nobody ever finds out why their work keeps going
   backwards. A counter cannot be wrong about which of two writes came
   second, because the second one made it.

   Nothing reads it yet. It is here before the cloud is, because the day the
   cloud arrives is the day it has to already be on every file written before
   then -- a counter added at the same time as the thing that needs it starts
   at zero for everybody. */
function bkNo(){
  var n;
  try{ n=parseInt(localStorage.getItem(langKey('bkn')), 10); }catch(e){ n=0; }
  return (n>0)? n : 0;
}
function bkNoSet(n){
  try{ localStorage.setItem(langKey('bkn'), String(n)); }catch(e){}
}
function bkPack(){
  var out={v:1, n:bkNo()+1, id:langId, name:langName,
           at:(new Date()).getTime(), slice:{}}, i, k, v;
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
  var pack=bkPack();
  /* Wreckage is not written out. A slice that cannot be read is not a
     smaller language, it is a broken one, and writing it would push the last
     readable copy one generation down the pile for nothing.

     This is the safe half of "refuse to save" and the unsafe half is not
     here: nothing is refused for being SMALL. A wipe, a switch and a brand
     new language all produce an empty slice and all of them are written. */
  if(!bkOK(pack)){ BK.how='not written: what is in storage will not read back'; return; }
  out=JSON.stringify(pack);
  p('LinguaShare', 'keep', {name:bkName(), json:out})
    /* counted up only when the file is on the disk, so a refused write does
       not spend a number and leave a gap that looks like a lost generation */
    .then(function(){ bkNoSet(pack.n); BK.how='kept'; BK.at=(new Date()).getTime(); })
    ['catch'](function(e){
      BK.dirty=true;
      BK.how='refused: '+((e && (e.message||e.errorMessage))? (e.message||e.errorMessage) : e);
    });
}

/* ---- what is actually on the disk -------------------------------------
   The settings screen shows this, and the reason it exists is a lesson this
   repository already paid for once: the system keyboard cost four builds,
   three of them spent guessing, and the fourth was solved by one screenshot
   the moment the app was made to say on screen whether the hand-over had
   gone out. docs/keyboard-extension.md ends with "Build the status line
   first."

   Nothing about the file rotation can be seen from a Mac either -- it
   happens in a folder on somebody's phone -- so this is how a person
   confirms it: the generations, newest first, each with the save number it
   carries and how big it is. Rotation is `save 7 / save 6 / save 5` going
   down the list, and a restore from a spare is a gap at the top.

   It reads, and touches nothing. */
var BKLIST=null;
function bkList(){
  var p=sharePlug();
  if(!p) return;
  p('LinguaShare', 'kept', {}).then(function(r){
    var xs=(r && r.langs)||[], out=[], i, j, d;
    for(i=0;i<xs.length;i++){
      for(j=0;j<(xs[i]||[]).length;j++){
        try{ d=JSON.parse(String(xs[i][j]||'')); }catch(e){ d=null; }
        out.push({gen:j, ok:!!(d && bkOK(d)), no:(d && d.n)||0,
                  name:(d && d.name)||'', kb:Math.round(String(xs[i][j]||'').length/102.4)/10});
      }
    }
    BKLIST=out; render();
  })['catch'](function(){ BKLIST=[]; render(); });
}
/* One line per file. Numbers and a name -- there is no sentence in it to
   translate beyond which generation it is. */
function bkListHTML(){
  var i, f, out='';
  if(!BKLIST) return '<div class="note">'+esc(bkSay())+'</div>';
  if(!BKLIST.length) return '<div class="note">'+t('bk.none')+'</div>';
  for(i=0;i<BKLIST.length;i++){
    f=BKLIST[i];
    out+='<div class="set"><span class="sl'+(f.ok? '':' bad')+'">'+
      esc(f.name || t('lt.untitled'))+' · '+esc(f.gen? t('bk.gen', f.gen) : t('bk.no', f.no))+
      '</span><span class="sv">'+f.kb+' KB</span></div>';
  }
  return out;
}
/* Whether the last hand-over went. BK.how holds what the native side said,
   which is a sentence nobody wrote for a person to read -- so it goes inside
   one that was, the way kbOutSay() already does it for the keyboard. */
function bkSay(){
  if(BK.how==='kept') return t('bk.no', bkNo());
  if(BK.how==='no bridge') return t('bk.off');
  if(BK.how) return t('bk.bad', BK.how);
  return t('bk.none');
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
  if(!bkOK(d)) return 0;
  var prev=langId;
  langId=d.id;
  for(i=0;i<SLICES.length;i++){
    k=SLICES[i];
    if(!bkSound(k, d.slice[k])) continue;      /* the FILE's copy is no better */
    try{
      /* "Is there one" was the question and it was the wrong one. A slice
         holding `[[[not json` is present, so the file was skipped, the
         wreckage was kept, and the next save wrote the wreckage over the
         last good copy. Soundness is the question. */
      if(bkSound(k, localStorage.getItem(langKey(k)))) continue;
      localStorage.setItem(langKey(k), d.slice[k]);
      put++;
    }catch(e){}
  }
  /* The counter goes forward to whatever the file reached, never back. A
     restored language must write its NEXT save with a bigger number than
     anything already out there, or the copy that was restored from would
     look newer than the one being used. */
  langId=d.id;
  if(typeof d.n==='number' && d.n>bkNo()) bkNoSet(d.n);
  langId=prev;
  if(!LANGS[d.id]){ LANGS[d.id]={name:String(d.name||''), mine:true}; put++; }
  return put;
}
/* One language, as its generations, newest first. The first that reads back
   as a language is the one, and the rest are not looked at.

   Not a choice between them -- the absence of one. A generation that cannot
   be read is not a candidate that lost, it is not a candidate. */
function bkTakeGen(gens){
  var i, put;
  for(i=0;i<gens.length;i++){
    put=bkTake(String(gens[i]||''));
    if(put){
      if(i>0) BK.how='restored from spare '+i;
      return put;
    }
  }
  return 0;
}
/* Every backup file, gone. Called by one thing -- wipeAll() -- and it is the
   only place in this app that destroys a copy on purpose. The rule it looks
   like it breaks is docs/DATA_SAFETY.md's "no automatic deletion", and it
   does not: this is not automatic, it is somebody pressing the one button
   that says everything goes. Leaving the files would make that button a lie,
   because they are the copy that survives the app itself.

   No native side means nothing to remove, which is a browser and every check
   under tools/. */
function bkDropAll(then){
  var p=sharePlug();
  if(!p){ if(then) then(); return; }
  p('LinguaShare', 'dropKept', {})
    .then(function(){ if(then) then(); })
    ['catch'](function(){ if(then) then(); });
}
function bkRestore(then){
  var p=sharePlug();
  if(!p){ if(then) then(0); return; }
  p('LinguaShare', 'kept', {})
    .then(function(r){
      var xs=(r && r.langs)||[], i, put=0;
      for(i=0;i<xs.length;i++) put+=bkTakeGen(xs[i]||[]);
      if(put){
        langStore();
        /* Something was put back, so what the screens are holding is a
           language that did not exist a moment ago. Read it in rather than
           patching each global by hand. */
        if(!langId || !LANGS[langId]){
          for(var id in LANGS){ if(Object.prototype.hasOwnProperty.call(LANGS, id)){ langId=id; break; } }
          langStore();
        }
        langRead(); ltRead(); noteRead(); stRead(); sndRead(); kbRead(); wldRead();
        /* Something came back, so write it out again as soon as anything is
           drawn. If it came from a spare, the unreadable newest file is
           still the newest file, and one good save puts a readable one in
           front of it.

           The broken one is not deleted. It ages down through the
           generations on the next two saves and falls off the end, which is
           the app not deleting anything and the shelf simply being three
           deep. Deleting it on purpose would be this chapter breaking its
           own rule to tidy up. */
        bkTouch();
      }
      if(then) then(put);
    })
    ['catch'](function(){ if(then) then(0); });
}
