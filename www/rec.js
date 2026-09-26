/* Lingua — chapter 25. The voice on a post.
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   「あとポストに声入れれるようにしたい30秒くらい。発音とかやれるやん？」

   A language is a sound before it is a shape, and nothing here could carry
   one. voice.js can SAY a phoneme -- it builds /m/ out of an oscillator and a
   filter -- but that is this app's idea of a sound. What a conlang actually
   sounds like is the person's, and the only way to show somebody is to let
   them hear it.

   WHERE IT GOES is the whole of the design, and it was measured before any of
   it was written. Thirty seconds of AAC is about 240 KB. A photograph on a
   post is about 87 KB once it is text; a free-sized language is 25 KB. So one
   voice is three photographs, or ten languages -- too big to be text in
   anything this app keeps as text.

   So a voice is a FILE, and never text in localStorage -- and the file is
   ON THE SERVER from the moment the recording ends. 「5 サーバーでしょ。
   端末に持たせるものはないって」 OWNER 2026-09-26: voTook() puts the bytes
   in the `post-media` bucket (voKeep()), and the post or the draft being
   written carries the PATH. A draft opened on another phone has its voice,
   and a post that is sent makes that same path its `vu` (netUpVoice() in
   www/net.js) -- the copy everybody plays, through netMedia(), because the
   bucket answers nobody who is not signed in. Nothing is written on this
   phone. What an earlier version wrote into Documents/Voices is still READ
   (voRead) and swept (voSweep); voRemote() tells the two kinds of name
   apart.

   Two halves, and the line between them is the same line post.js has:

     Above -- this file -- is the making side. A microphone, a recorder, and
     thirty seconds. It reads PW, because that is what it is filling in.

     Below is playing one back, and a post being played is somebody else's:
     what it needs is on the post, because a reader has no composer: `vu`,
     the path on the server, for everybody, and `vo` -- `{f, ms: how long}`
     -- while it is being written. voPlay() is handed one name and plays
     whichever it is.

   There is no native side in a browser, so `voRead` answers "no bridge"
   there. On the phone it is ios/App/App/LinguaShare.swift, `voice`. */

/* ---- what a voice is --------------------------------------------------- */

/* Thirty seconds. 「30秒くらい」 It is a ceiling and not a target: a recorder
   that hits it stops itself rather than refusing at the end, because a
   recording that is thrown away for being one second long is a recording
   somebody made. */
var VO_MS=30000;
/* Everything the recorder is doing, which is nothing at all most of the time.
   REC is the recorder while one is running and is what "am I recording"
   means -- there is no second flag to disagree with it. */
var REC=null, RECBITS=null, RECAT=0, RECTIC=null;
/* And the one being played, which is at most one: starting a second stops the
   first. Two voices at once is two people talking. */
var VOEL=null, VOAT='';

/* How long, as a person reads it. Under a minute always, so there is no hour
   to think about. */
function voLen(ms){
  var s=Math.round((parseInt(ms, 10)||0)/1000);
  return Math.floor(s/60)+':'+(s%60<10? '0':'')+(s%60);
}
/* What this webview can record. Safari answers mp4 and Chrome answers webm,
   and the file's name follows whichever it was -- a .m4a holding webm is a
   file nothing will open two years from now. */
function voMime(){
  var M=window.MediaRecorder, i,
      want=['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];
  if(!M || !M.isTypeSupported) return '';
  for(i=0;i<want.length;i++) if(M.isTypeSupported(want[i])) return want[i];
  return '';
}
function voExt(mime){
  return String(mime||'').indexOf('webm')>=0 ? '.webm' : '.m4a';
}
/* Whether a microphone can be reached at all. Asked before the button is
   drawn, so a webview with no recorder in it does not show one. */
function voCan(){
  return !!(window.MediaRecorder && navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia);
}

/* ---- the making side --------------------------------------------------- */

/* iOS asks the person for the microphone the first time this runs, and it
   only asks if ios/App/App/Info.plist says why -- NSMicrophoneUsageDescription.
   Without that line the app is killed rather than refused, which is a crash
   with no message and nothing in it about a microphone. */
/* What the phone's audio is while this is going on.
   「音楽はいつのタイミングでもとめないでほしい」 A microphone needs a different
   category from a speaker, and switching categories is where somebody's music
   goes if the mixing option is not carried across. It is said before the
   microphone is opened and said back the moment the recorder stops -- not when
   the post is sent, because the recorder stopping is when the microphone is
   let go. LinguaShare.swift is the one place either category is written down.

   No bridge -- a browser, which is every check -- and there is nothing to say
   and nothing to fail. */
function voSession(mode){
  var p=sharePlug();
  if(!p) return;
  p('LinguaShare', 'audio', {mode:String(mode)})['catch'](function(){});
}
function voStart(){
  if(REC) return;
  if(!voCan()){ toast(t('post.vo.no')); return; }
  var mime=voMime();
  voSession('record');
  navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
    var r;
    try{ r=mime? new MediaRecorder(stream, {mimeType:mime}) : new MediaRecorder(stream); }
    catch(e){ voStreamOff(stream); toast(t('post.vo.no')); return; }
    RECBITS=[]; REC=r; RECAT=(new Date()).getTime();
    r.ondataavailable=function(ev){ if(ev.data && ev.data.size) RECBITS.push(ev.data); };
    /* The stream is let go the moment the recorder stops, not when the post is
       sent: a microphone left open is the orange dot on somebody's status bar
       for as long as the app is in front of them. */
    r.onstop=function(){ voStreamOff(stream); voTook(r.mimeType||mime); };
    try{ r.start(); }
    catch(e){ REC=null; voStreamOff(stream); toast(t('post.vo.no')); return; }
    RECTIC=setInterval(voTick, 200);
    voPaint();
  /* Refused, so there is no stream and voStreamOff() will never run. The
     category was changed before the asking and has to go back anyway. */
  })['catch'](function(){ voSession('play'); toast(t('post.vo.deny')); });
}
/* Letting the microphone go, which every path out of a recording goes
   through -- the recorder stopping, a recorder that would not start, one
   that would not be built. The category goes back here for that reason:
   it is the one place the microphone stops being needed. */
function voStreamOff(stream){
  var ts=(stream && stream.getTracks)? stream.getTracks() : [], i;
  for(i=0;i<ts.length;i++){ try{ ts[i].stop(); }catch(e){} }
  voSession('play');
}
function voStop(){
  if(RECTIC){ clearInterval(RECTIC); RECTIC=null; }
  if(!REC) return;
  var r=REC;
  REC=null;
  try{ r.stop(); }catch(e){ voPaint(); }
}
/* The count, and the ceiling that stops it. Both here, because the number on
   the screen and the moment it ends have to be the same number. */
function voTick(){
  var e;
  if(!REC) return;
  if(voRecMs()>=VO_MS){ voStop(); return; }
  e=document.getElementById('pw-vo-t');
  if(e) e.innerHTML=esc(voLen(voRecMs()));
}
function voRecMs(){ return RECAT? ((new Date()).getTime()-RECAT) : 0; }
/* What came back, PUT ON THE SERVER HERE and named from here on.
   -------------------------------------------------------------------------
   The recording is never held as base64 past this function, and it is never
   written on this phone: 「端末に持たせるものはないって」 OWNER 2026-09-26.
   It goes up the moment it ends (voKeep()), and `PW.vo` is `{f: the path in the
   bucket, ms}` from then on -- the same thing a draft carries and the same
   thing a post carries until it is sent. A draft kept here and opened on
   another phone has its voice, which the name of a file on this phone never
   gave it (r63-audit R3).

   A send that fails says so HERE rather than at the post. Nothing is kept:
   a recording that is not on the server is not a recording, and 「保存した
   つもり」 is the fault the drafts' rewrite of 2026-09-03 was about. Making
   needs a signal (CLAUDE.md § Online). */
function voTook(mime){
  var bits=RECBITS, ms=Math.min(voRecMs(), VO_MS), b, r;
  RECBITS=null; RECAT=0;
  if(!bits || !bits.length){ voPaint(); return; }
  /* A press that was not a recording. Not an error and not a file: the button
     is simply still a button afterwards. */
  if(ms<400){ voPaint(); return; }
  b=new Blob(bits, {type:mime||'audio/mp4'});
  r=new FileReader();
  r.onload=function(){
    var s=String(r.result||''), i=s.indexOf(',');
    voKeep({b64:(i>=0? s.slice(i+1) : ''), mime:mime||'audio/mp4', ms:ms},
      function(vo){
        if(!vo){ toast(t('post.vo.lost')); voPaint(); return; }
        PW.vo=vo;
        openPost();
      });
  };
  r.onerror=function(){ toast(t('post.vo.bad')); };
  r.readAsDataURL(b);
}
/* Taking it off the post being written, and the file goes with it. It is
   put on the server the moment it is recorded, so this removes both or the
   bucket fills up with recordings nobody kept. */
function voDrop(){
  voPlayOff();
  if(PW && PW.vo && PW.vo.f) voDropFile(PW.vo.f);
  if(PW) delete PW.vo;
  openPost();
}
/* While a recording is running the composer is not rebuilt on every tick --
   the caret would go to the end of the line on each one. Only the button
   changes, and only when it changes state. */
function voPaint(){
  var e=document.getElementById('pw-vo');
  if(e){ e.innerHTML=pwVoRowHTML(); return; }
  openPost();
}
/* The microphone, or the count with a way to stop it, or what was recorded.
   One row, three faces, because they are one thing at three moments. */
function pwVoAddHTML(){
  if(!voCan() && !(PW && PW.vo)) return '';
  return '<span class="pwvo" id="pw-vo">'+pwVoRowHTML()+'</span>';
}
function pwVoRowHTML(){
  if(REC){
    return '<button class="pwab rec"' + DO('voStop') + ' aria-label="'+
      esc(t('post.vo.stop'))+'"><span class="vodot"></span>'+
      '<span class="vot" id="pw-vo-t">'+esc(voLen(voRecMs()))+'</span></button>';
  }
  if(PW && PW.vo){
    return '<button class="pwab"' + DO('voPlay', [String(PW.vo.f||'')]) + ' aria-label="'+
        esc(t('post.vo.play'))+'">'+ICON_SPK+
        '<span class="vot">'+esc(voLen(PW.vo.ms))+'</span></button>'+
      '<button class="pwvox"' + DO('voDrop') + ' aria-label="'+
        esc(t('post.vo.drop'))+'">'+ICON_MINUS+'</button>';
  }
  return '<button class="pwab"' + DO('voStart') + ' aria-label="'+
    esc(t('post.vo'))+'">'+ICON_MIC+'</button>';
}

/* ---- where a voice goes ---------------------------------------------------
   The name is made here, so what the post carries and what is in the bucket
   are one string decided in one place. `<uid>/<name>/vo.<ext>`: the first
   folder is the account, which is the whole of the bucket's write rule
   (supabase/schema.sql § media_make), and the shape is a post's
   (`<author>/<post>/vo.m4a`), so voRemote() reads it as the server's. */
function voName(mime){
  return 'v'+(new Date()).getTime()+String(Math.floor(Math.random()*1e6));
}
function voKeep(vo, done){
  if(!vo || !vo.b64 || !netSignedIn()){ done(null); return; }
  netUp(netUid()+'/'+voName(vo.mime)+'/vo'+voExt(vo.mime), vo.b64, vo.mime,
    function(path){ done({f:path, ms:vo.ms}); },
    function(){ done(null); });
}
/* The one voice something being thrown away names -- a draft, a post, the
   one in the composer. 「投稿消した声も消していいよ」「声は投稿上で再生
   できるよね？下書き消した時にはいらなくない？」 Given a name and never asked
   to find one: "which voices does nothing point at" is the question that
   turns a delete into a cleanup, and this cannot be asked it. The DELETE
   REVIEWs are in docs/CHANGELOG.md.

   A path on the server goes from the bucket; a name on this phone (what an
   earlier version wrote) goes from Documents/Voices. A post that has gone up
   no longer names its voice here -- netUpVoice() moved it to `vu` -- so a
   post's own recording is never taken by this after it is sent.

   It is not waited on and it cannot fail loudly. The thing is already gone by
   the time this runs, which is the right order: a file that will not go must
   not leave the post standing. */
function voDropFile(f){
  var p;
  if(!f) return;
  if(voRemote(f)){
    if(netSignedIn()) netDropMine([String(f)], function(){});
    return;
  }
  p=sharePlug();
  if(!p) return;
  p('LinguaShare', 'dropVoice', {name:String(f)})['catch'](function(){});
}
/* WHAT AN EARLIER VERSION LEFT IN Documents/Voices GOES, AND NOTHING ELSE.
   「前の版でスマホに残った用紙と声のファイル → 消す」 OWNER 2026-09-25, and
   the leader's reading of it: every file there that no draft and no post
   whose voice has not gone up names. Until 2026-09-24 a post that went up
   kept its recording on the phone; those are the files this takes.

   WHAT IS KEPT IS ASKED OF EVERY COPY ON THIS PHONE, not of the account
   signed in: a draft of another account on this handset, and a post of
   theirs that could not send, are that person's voice and are waiting for
   them. So every key under `lingua.drafts` and `lingua.posts` is read -- for
   the names on it and nothing else -- the ones with no owner on them
   included, which are not read for anything else and must not have their
   voice taken from under them (CLAUDE.md § the flat keys). The live copies
   are asked too (DRAFTS, POSTS, the composer).

   A COPY THAT CANNOT BE READ STOPS THE WHOLE OF IT. What a broken draft
   names cannot be known, and 「names nothing」 is the answer that deletes --
   so `null`, and voSweep() sends nothing (docs/DATA_SAFETY.md: empty and
   broken are different states).

   The Swift side is LinguaShare.swift `sweepVoices`, and it also leaves any
   file newer than the moment this was asked -- one recorded in the second
   between the ask and the answer. The DELETE REVIEW is in docs/CHANGELOG.md
   2026-09-25. */
function voSweepKeep(){
  var keep=[], i, k, l, bad=false;
  function name(p, isDraft){
    var f=p && p.vo && p.vo.f;
    if(!f || voRemote(f)) return;
    /* A post whose voice is on the server (`vu`) has nothing waiting on its
       file. A draft always has: it has not been sent. */
    if(!isDraft && p.vu) return;
    if(keep.indexOf(String(f))<0) keep.push(String(f));
  }
  function list(v, isDraft){
    var j;
    if(!v) return;
    if(typeof v.length!=='number'){ bad=true; return; }
    for(j=0;j<v.length;j++) name(v[j], isDraft);
  }
  try{
    for(i=0;i<localStorage.length;i++){
      k=String(localStorage.key(i)||'');
      var d=(k==='lingua.drafts' || k.indexOf('lingua.drafts.')===0),
          q=(k==='lingua.posts'  || k.indexOf('lingua.posts.')===0);
      if(!d && !q) continue;
      try{ l=JSON.parse(localStorage.getItem(k)); }catch(e){ bad=true; continue; }
      list(l, d);
    }
  }catch(e){ return null; }
  list(typeof DRAFTS!=='undefined'? DRAFTS : null, true);
  list(typeof POSTS!=='undefined'? POSTS : null, false);
  if(typeof PW!=='undefined' && PW) name(PW, true);
  return bad? null : keep;
}
function voSweep(){
  var p=sharePlug(), keep;
  if(!p) return;
  keep=voSweepKeep();
  if(keep===null) return;
  p('LinguaShare', 'sweepVoices', {keep:keep, before:Date.now()})['catch'](function(){});
}
/* Whether this voice is on the disk or on the server. A name made by voName()
   is `v` and digits and an extension and never holds a slash; a path in
   Storage is `<author>/<post>/vo.m4a` and always does. One character tells
   them apart, which is why the name was made in one place. */
function voRemote(f){ return String(f||'').indexOf('/')>=0; }
function voRead(f, done){
  var p=sharePlug();
  if(!p || !f){ done(''); return; }
  p('LinguaShare', 'voice', {name:String(f)})
    .then(function(r){ done((r && r.b64)? String(r.b64) : ''); })
    ['catch'](function(){ done(''); });
}

/* ---- playing one back --------------------------------------------------
   At most one at a time, and pressing the one that is playing stops it. The
   element is made once and kept: iOS will only play audio inside a gesture,
   and one made fresh on every press is one that has never been allowed. */
function voAudio(){
  if(!VOEL) VOEL=new Audio();
  return VOEL;
}
function voPlayOff(){
  if(VOEL){ try{ VOEL.pause(); }catch(e){} }
  VOAT='';
  voPaintRows();
}
/* A voice on a post, played from the post: the file's name is all this is
   given and all it needs. */
function voPlay(f){
  f=String(f||'');
  if(!f) return;
  if(VOAT===f){ voPlayOff(); return; }
  /* Somebody else's voice is on the server, and it is FETCHED WHOLE before it
     plays. This said the opposite until 2026-09-22 -- 「downloading it whole
     before starting would be a wait where every other app starts playing」 --
     and that sentence was about a public bucket. It is private now
     (「サーバーは、サインインしていない人には何も返さない」 OWNER
     2026-09-22), and **an <audio src> carries no headers**, so streaming from
     a URL is not a road any more: the bytes come through netMedia()
     (www/net.js), signed, and what plays is a blob: of what came back.

     What it costs is bounded and small: a voice is thirty seconds
     (「30秒くらい」) and it is fetched once -- pressing it again plays what
     this phone is already holding.

     Playing from a callback rather than on the line the press arrived on is
     not new here: the road just below, for a voice this phone recorded, has
     always gone through voRead() and the plugin, which is the same shape.
     The element is made once and kept for exactly that reason. */
  if(voRemote(f)){
    netMedia(f, function(u){
      var ra;
      if(!u){ toast(t('post.vo.gone')); return; }
      ra=voAudio();
      ra.src=u;
      ra.onended=function(){ voPlayOff(); };
      VOAT=f;
      voPaintRows();
      try{ ra.play(); }catch(e){ voPlayOff(); }
    });
    return;
  }
  voRead(f, function(b64){
    if(!b64){ toast(t('post.vo.gone')); return; }
    var a=voAudio();
    a.src='data:audio/mp4;base64,'+b64;
    a.onended=function(){ voPlayOff(); };
    VOAT=f;
    voPaintRows();
    try{ a.play(); }catch(e){ voPlayOff(); }
  });
}
/* Which button says "playing" is a thing about the screen and not about any
   post, so a rebuild of the whole timeline for it would be the wrong size of
   answer. The rows are asked to look at themselves again. */
function voPaintRows(){
  var es=document.querySelectorAll('.povo'), i, f;
  for(i=0;i<es.length;i++){
    f=es[i].getAttribute('data-f')||'';
    if(f===VOAT) es[i].className='povo on';
    else es[i].className='povo';
  }
  var e=document.getElementById('pw-vo');
  if(e) e.innerHTML=pwVoRowHTML();
}
