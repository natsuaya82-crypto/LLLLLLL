/* Lingua — the sound of a phoneme, made rather than borrowed.
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   A device's speech synthesiser cannot say a sound. It can only say a
   language: hand it a word and it reads that word the way English, or
   Japanese, or Italian reads it. MMM came out as the names of three letters
   because the voice was English and that is how English reads three Ms. No
   respelling fixes it -- respelling only chooses whose accent to be wrong in.

   So the sound is built here. /m/ is /m/: a voiced buzz through a low filter
   with a nasal resonance on it. Nothing in this file knows what language the
   person speaks, or what language the voice on their phone speaks, because
   nothing here needs to.

   Nothing is stored either. Every parameter is read off the chart -- where in
   the mouth, in what manner, voiced or not -- so a sound added to the chart
   tomorrow already has a voice. */

var VX=null;
function vxCtx(){
  if(VX) return VX;
  try{
    var C=window.AudioContext||window.webkitAudioContext;
    if(!C) return null;
    VX=new C();
  }catch(e){ VX=null; }
  return VX;
}
/* iOS starts every audio context asleep and will only wake one inside a real
   gesture. Waking it on the first touch anywhere means the first sound the
   person asks for is the first sound they hear, instead of the second.

   The other half of this is not in the web layer at all: a web view's audio
   belongs to the app's audio session, and the default session obeys the
   ring/silent switch on the side of the phone. On a phone with that switch
   flipped every sound here played into nothing, silently. ios/App/App/
   AppDelegate.swift sets the session to playback, the way a music app does. */
var VXWOKE=false;
function vxWake(){
  if(VXWOKE) return;
  VXWOKE=true;
  var x=vxCtx();
  if(!x) return;
  try{ if(x.state==='suspended' && x.resume) x.resume(); }catch(e){}
}
if(document.addEventListener){
  document.addEventListener('pointerdown', vxWake, true);
  document.addEventListener('touchstart', vxWake, true);
}

/* Where in the mouth the noise of a consonant lives, in hertz. Front of the
   mouth is a short tube and rings high; the back is a long one and rings low. */
var VX_PLACE={ bilabial:700, labiodental:1400, dental:2000, alveolar:2600,
               postalveolar:2400, retroflex:1900, palatal:2700, velar:1500,
               uvular:1100, pharyngeal:800, glottal:600 };

/* A vowel is two resonances. The first goes with how open the mouth is, the
   second with how far forward the tongue is -- and rounding the lips
   lengthens the tube, which pulls the second one down. */
var VX_F1={ close:300, nearclose:370, closemid:420, mid:500,
            openmid:620, nearopen:720, open:820 };
var VX_F2={ front:2200, central:1500, back:940 };

function vxVowel(sym){
  var i;
  for(i=0;i<IPA_VOWS.length;i++) if(IPA_VOWS[i].s===sym) return IPA_VOWS[i];
  return null;
}
function vxCons(sym){
  var i;
  for(i=0;i<IPA_CONS.length;i++) if(IPA_CONS[i].s===sym) return IPA_CONS[i];
  return null;
}

/* One formant: a narrow band picked out of whatever is fed into it. */
function vxFormant(x, src, hz, q, gain, t0, dur){
  var f=x.createBiquadFilter(), g=x.createGain();
  f.type='bandpass'; f.frequency.value=hz; f.Q.value=q;
  g.gain.value=gain;
  src.connect(f); f.connect(g);
  return g;
}
/* The buzz of the vocal folds: a sawtooth is close enough, and cheap. */
function vxVoiced(x, t0, dur, f0){
  var o=x.createOscillator();
  o.type='sawtooth';
  o.frequency.setValueAtTime(f0, t0);
  o.frequency.linearRampToValueAtTime(f0*0.93, t0+dur);
  o.start(t0); o.stop(t0+dur+0.02);
  return o;
}
/* Breath: white noise, made once and reused. */
var VX_NOISE=null;
function vxNoise(x, t0, dur){
  if(!VX_NOISE || VX_NOISE.sampleRate!==x.sampleRate){
    var n=Math.floor(x.sampleRate*0.5), b=x.createBuffer(1,n,x.sampleRate), d=b.getChannelData(0), i;
    for(i=0;i<n;i++) d[i]=Math.random()*2-1;
    VX_NOISE=b;
  }
  var s=x.createBufferSource();
  s.buffer=VX_NOISE; s.loop=true;
  s.start(t0); s.stop(t0+dur+0.02);
  return s;
}
/* Nothing starts or stops instantly; a step is a click. */
function vxEnv(x, node, t0, dur, peak, rise, fall){
  var g=x.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0+rise);
  g.gain.setValueAtTime(peak, t0+Math.max(rise, dur-fall));
  g.gain.linearRampToValueAtTime(0, t0+dur);
  node.connect(g);
  return g;
}

/* How long each manner takes to say. */
var VX_DUR={ vowel:0.20, plosive:0.11, nasal:0.13, trill:0.16, tap:0.05,
             fricative:0.14, latfric:0.14, approx:0.11, latapprox:0.11, other:0.13 };

/* Lay one phoneme onto the timeline, and say how long it took. */
function vxOne(x, out, sym, t0, f0){
  var v=vxVowel(sym), c=vxCons(sym), dur, src, i, hz, F1, F2, F3;
  if(v){
    dur=VX_DUR.vowel;
    F1=VX_F1[v.h]||500;
    F2=(VX_F2[v.b]||1500) - (v.r? 260:0);
    F3=v.r? 2400:2800;
    src=vxVoiced(x, t0, dur, f0);
    var mix=x.createGain(); mix.gain.value=1;
    vxFormant(x, src, F1, 9, 1.0).connect(mix);
    vxFormant(x, src, F2, 11, 0.6).connect(mix);
    vxFormant(x, src, F3, 12, 0.25).connect(mix);
    vxEnv(x, mix, t0, dur, 0.5, 0.03, 0.05).connect(out);
    return dur;
  }
  if(!c){
    /* a click, an implosive, or one of the odd approximants: a short voiced
       burst shaped by the middle of the mouth is closer than silence */
    dur=VX_DUR.other;
    src=vxVoiced(x, t0, dur, f0);
    var m2=x.createGain();
    vxFormant(x, src, 1200, 6, 1.0).connect(m2);
    vxEnv(x, m2, t0, dur, 0.35, 0.02, 0.04).connect(out);
    return dur;
  }
  hz=VX_PLACE[c.p]||1500;
  dur=VX_DUR[c.m]||0.12;

  if(c.m==='plosive'){
    /* the hold is silence; the sound is the release */
    var hold=0.045, burst=dur-hold;
    if(c.v){
      var vb=vxVoiced(x, t0, hold, f0*0.85);
      var lb=x.createBiquadFilter(); lb.type='lowpass'; lb.frequency.value=280;
      vb.connect(lb);
      vxEnv(x, lb, t0, hold, 0.22, 0.01, 0.01).connect(out);
    }
    var nb=vxNoise(x, t0+hold, burst);
    var bf=x.createBiquadFilter(); bf.type='bandpass'; bf.frequency.value=hz; bf.Q.value=1.6;
    nb.connect(bf);
    vxEnv(x, bf, t0+hold, burst, 0.5, 0.004, burst*0.8).connect(out);
    return dur;
  }
  if(c.m==='nasal'){
    src=vxVoiced(x, t0, dur, f0);
    var nm=x.createGain();
    vxFormant(x, src, 260, 10, 1.0).connect(nm);
    vxFormant(x, src, Math.min(hz,1600), 8, 0.3).connect(nm);
    var lp=x.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1800;
    nm.connect(lp);
    vxEnv(x, lp, t0, dur, 0.42, 0.02, 0.04).connect(out);
    return dur;
  }
  if(c.m==='trill' || c.m==='tap'){
    src=vxVoiced(x, t0, dur, f0);
    var tm=x.createGain();
    vxFormant(x, src, Math.min(hz,1400), 7, 1.0).connect(tm);
    var beat=x.createGain(); beat.gain.value=1;
    tm.connect(beat);
    if(c.m==='trill'){
      /* the tongue bouncing: the loudness itself is the flutter */
      var lfo=x.createOscillator(), la=x.createGain();
      lfo.type='sine'; lfo.frequency.value=27; la.gain.value=0.5;
      lfo.connect(la); la.connect(beat.gain);
      lfo.start(t0); lfo.stop(t0+dur+0.02);
    }
    vxEnv(x, beat, t0, dur, 0.4, 0.015, 0.03).connect(out);
    return dur;
  }
  if(c.m==='fricative' || c.m==='latfric'){
    var nf=vxNoise(x, t0, dur);
    var ff=x.createBiquadFilter(); ff.type='bandpass';
    ff.frequency.value=hz; ff.Q.value=(c.m==='latfric')?1.4:3.2;
    nf.connect(ff);
    var fm=x.createGain(); fm.gain.value=1;
    ff.connect(fm);
    if(c.v){
      var fv=vxVoiced(x, t0, dur, f0);
      var fl=x.createBiquadFilter(); fl.type='lowpass'; fl.frequency.value=400;
      fv.connect(fl);
      vxEnv(x, fl, t0, dur, 0.22, 0.02, 0.03).connect(out);
    }
    vxEnv(x, fm, t0, dur, 0.34, 0.02, 0.04).connect(out);
    return dur;
  }
  /* approximants, lateral and otherwise: a vowel with the tongue in the way */
  src=vxVoiced(x, t0, dur, f0);
  var am=x.createGain();
  vxFormant(x, src, (c.m==='latapprox')?360:420, 9, 1.0).connect(am);
  vxFormant(x, src, Math.min(hz,2200), 9, 0.5).connect(am);
  vxEnv(x, am, t0, dur, 0.4, 0.025, 0.05).connect(out);
  return dur;
}

/* Say a sequence of phonemes. No language is consulted, because none is
   involved: the sounds were chosen, and this is what they sound like.

   Two things made a tap go silent, both of them about time.

   iOS suspends an audio context whenever it feels like it -- after a pause,
   after a phone call, after the app goes to the background. Resuming is
   asynchronous: the clock is not running yet when resume() returns. Everything
   scheduled in that moment was scheduled into the past, and the past does not
   play. So a resume now waits for the context to actually be running before
   anything is laid onto its timeline.

   And two taps close together were writing over each other, because both
   started from the same "now". Each utterance now begins after the last one
   has finished, so pressing twice quickly says the sound twice instead of
   once and a half. */
var VXEND=0;
function vxPlay(x, seq, f0){
  var out=x.createGain();
  out.gain.value=0.9;
  out.connect(x.destination);
  var now=(x.currentTime||0);
  var t=Math.max(now+0.03, VXEND), i, d, base=f0||118;
  for(i=0;i<seq.length;i++){
    d=vxOne(x, out, seq[i], t, base);
    /* sounds run into each other rather than sitting in a row */
    t += d*0.86;
  }
  if(!x.startRendering) VXEND=t+0.04;
  return t-now;
}
/* ---- what you press now beats what is already queued -------------------
   Every sound is scheduled on the clock, each one starting where the last
   one ended, so that two sounds asked for in the same instant do not play
   on top of each other. That is right for two taps a moment apart and wrong
   the moment a whole dictionary is playing: thirty words is half a minute
   of queue, and a key pressed during it was scheduled after all of it. The
   key made no sound for thirty seconds, which is not a queue, it is a
   broken app -- 「あと音声流れない」.

   So anything asked for while a long queue is still ahead throws the queue
   away first. Throwing it away means closing the context, because every
   sound in it is already scheduled and nothing else stops a sound the
   browser has been told to make twenty seconds from now. */
function vxCut(x){
  var now=(x.currentTime||0);
  if(VXEND <= now+1.2) return x;
  if(VXRUN){ clearTimeout(VXRUN); VXRUN=0; }
  try{ x.close(); }catch(e){}
  VX=null; VXEND=0;
  /* the button that said "stop" has nothing left to stop */
  if(typeof render==='function') setTimeout(render, 0);
  return vxCtx();
}
function sayPh(seq, ctx, f0){
  var x=ctx||vxCtx();
  /* A tap that makes no sound and says nothing is indistinguishable from a
     broken app, so the one case where sound is genuinely impossible says so. */
  if(!x){ if(!ctx && typeof toast==='function') toast(t('voice.none')); return 0; }
  if(!seq || !seq.length) return 0;
  if(!ctx){ x=vxCut(x); if(!x) return 0; }
  /* An offline context is rendering rather than playing and must not be
     woken -- asking throws. */
  if(!ctx && x.state==='suspended' && x.resume){
    try{
      var pr=x.resume();
      if(pr && pr.then){ pr.then(function(){ VXEND=0; vxPlay(x, seq, f0); }); return 0; }
    }catch(e){}
    /* an old WebKit resumes without a promise; give the clock a moment */
    if(x.state==='suspended'){
      setTimeout(function(){ VXEND=0; vxPlay(x, seq, f0); }, 60);
      return 0;
    }
  }
  return vxPlay(x, seq, f0);
}
/* One sound on its own, for the chart. */
function sayOne(sym){ return sayPh([sym]); }

/* ---- a run of words, one after another --------------------------------
   Hearing a language is not hearing a word. Until now the only way to hear
   what you had built was to open one word, listen, go back, open the next --
   which tells you about a word and nothing about a language. This says a
   list straight through, with a breath between each one so they stay
   separate words rather than becoming one long one.

   It stops by throwing the audio context away, because every sound in the
   run has already been scheduled on it and there is nothing else that stops
   a sound the browser has been told to make in four seconds' time. */
var VXRUN=0;
