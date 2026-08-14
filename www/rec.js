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
   voice is three photographs, or ten languages -- and the dictionary, the
   alphabet, the notes and every post share one small quota in localStorage.
   Four recordings in there and somebody's language has nowhere to be.

   So a voice is a FILE. It goes to Documents, in the folder beside the
   language backups -- the folder iOS puts in the device backup and the Files
   app can show -- and what goes in localStorage is the post, carrying the
   file's NAME. 「ファイルに出す」

   Two halves, and the line between them is the same line post.js has:

     Above -- this file -- is the making side. A microphone, a recorder, and
     thirty seconds. It reads PW, because that is what it is filling in.

     Below is playing one back, and a post being played is somebody else's:
     what it needs is on the post. `p.vo` is `{f: the file's name, ms: how
     long}` and nothing else, because a reader has no composer.

   There is no native side in a browser, so `voKeep` and `voRead` both answer
   "no bridge" there and every check runs against that answer. On the phone it
   is ios/App/App/LinguaShare.swift, `keepVoice` and `voice`. */

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
/* What came back. It is held in memory, as text, until the post is sent --
   nothing is written to the disk by a composer somebody may still close. */
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
    PW.vo={b64:(i>=0? s.slice(i+1) : ''), mime:mime||'audio/mp4', ms:ms};
    openPost();
  };
  r.onerror=function(){ toast(t('post.vo.bad')); };
  r.readAsDataURL(b);
}
/* Taking it off the post being written. Nothing is on the disk yet, so this
   removes a recording and never a file. */
function voDrop(){
  voPlayOff();
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
    return '<button class="pwab"' + DO('voPlayPW') + ' aria-label="'+
        esc(t('post.vo.play'))+'">'+ICON_PLAY+
        '<span class="vot">'+esc(voLen(PW.vo.ms))+'</span></button>'+
      '<button class="pwvox"' + DO('voDrop') + ' aria-label="'+
        esc(t('post.vo.drop'))+'">'+ICON_MINUS+'</button>';
  }
  return '<button class="pwab"' + DO('voStart') + ' aria-label="'+
    esc(t('post.vo'))+'">'+ICON_MIC+'</button>';
}

/* ---- the disk ----------------------------------------------------------
   Two calls and nothing else. The name is made here rather than in Swift so
   that what the post carries and what is on the disk are one string decided
   in one place. */
function voName(mime){
  return 'v'+(new Date()).getTime()+String(Math.floor(Math.random()*1e6))+voExt(mime);
}
function voKeep(vo, done){
  var p=sharePlug(), name;
  if(!p || !vo || !vo.b64){ done(null); return; }
  name=voName(vo.mime);
  p('LinguaShare', 'keepVoice', {name:name, b64:vo.b64})
    .then(function(){ done({f:name, ms:vo.ms}); })
    ['catch'](function(){ done(null); });
}
/* The one file a post being deleted names. 「投稿消した声も消していいよ」
   Given a name and never asked to find one: "which voices does nothing point
   at" is the question that turns a delete into a cleanup, and this cannot be
   asked it. The DELETE REVIEW is in docs/CHANGELOG.md.

   It is not waited on and it cannot fail loudly. The post is already gone by
   the time this runs, which is the right order: a file that will not go must
   not leave the post standing. */
function voDropFile(f){
  var p=sharePlug();
  if(!p || !f) return;
  p('LinguaShare', 'dropVoice', {name:String(f)})['catch'](function(){});
}
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
/* The one being written, which is not on the disk yet and is played out of
   what is in hand. */
function voPlayPW(){
  var vo=PW && PW.vo, a;
  if(!vo || !vo.b64) return;
  if(VOAT==='pw'){ voPlayOff(); return; }
  a=voAudio();
  a.src='data:'+(vo.mime||'audio/mp4')+';base64,'+vo.b64;
  a.onended=function(){ voPlayOff(); };
  VOAT='pw';
  voPaintRows();
  try{ a.play(); }catch(e){ voPlayOff(); }
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
