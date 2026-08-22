/* Lingua — what gets stored, the plans, the theme, the phonology, and the
   registry every language file reports into
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   0. What gets stored
      words / lines / language name / writing system, per language
      settings (theme, plan, onboarded) once, for the person
      Everything in here is something the person wrote themselves.
      There is no starter dictionary, on purpose.

      A language used to be the only thing there was, so it was stored under
      eight flat keys -- lingua.words, lingua.letters and so on. You can make
      one language and read any number of other people's, so those eight keys
      belong to a language rather than to the app, and they carry its id:

        lingua.<id>.words          the dictionary of that language
        lingua.<id>.letters        its alphabet
        lingua.langs               which languages exist here, and whose
        lingua.cur                 which one is open
        lingua.set                 the person's settings -- not a language's

      Everything a screen reads is still a single global: WORDS is the open
      language's dictionary, not a table of every language's. The app shows
      one language at a time, because you are either writing yours or reading
      somebody else's, and 290-odd places say WORDS meaning "the one in front
      of me". They still do.
   ========================================================================= */
var LS_LANGS='lingua.langs', LS_CUR='lingua.cur', LS_S='lingua.set';
/* The eleven slices a language is filed under. One list, because emptying a
   language, reading one and writing one out all have to name every slice, and
   a wipe that named ten would leave a slice of the old language inside the
   new one.

   Two were missing from it and had been for as long as they existed, which
   is the whole reason the list is a list. The KEYBOARD is the language's --
   it is built in the app, it is filed under langKey('kb') beside the words
   and the letters -- and it was in no backup and survived a wipe. And what
   the language is FOR (`wld`) sat in SET, the person's settings, under a
   comment saying it travels with the language: per device, not per language,
   and in no backup either.

   Neither was reachable from anything that would have thrown. A backup was
   written, it restored, every check was green, and the keyboard somebody
   built was simply not in the file. */
var SLICES=['words','lines','lang','script','letters','notes','phases','talk','snd','kb','wld'];
/* id -> { name, mine } and nothing more: the index says which languages are
   here, and the language's own keys hold what it is. */
var LANGS={}, langId='';
var WORDS=[], LINES=[], langName='', SET=setDefaults();
/* What a person's settings are before they touch anything. A function rather
   than a literal because it is needed twice -- here, and when everything is
   wiped -- and the second copy was written out by hand and did not have the
   same keys in it. */
function setDefaults(){
  return {theme:'system', plan:'free', done:false, order:'SOV', read:'both',
          voice:'', ui:'', script:false};
}
/* The writing system. `g` maps a romanisation to the strokes drawn for it;
   `extra` holds letters the person added by hand that no word uses yet, so a
   script can be built before the dictionary is. Nothing here is ever what gets
   stored as text — a word is roman letters in WORDS and stays that way. */
var SCRIPT={g:{}, extra:[]};

/* The key a slice of the open language is stored under. Called by every file
   that keeps a slice of its own -- letters, notes, phases, talk -- so that
   there is one place that knows how a language is filed. */
function langKey(slice){ return 'lingua.' + langId + '.' + slice; }

/* Which languages are here, and which one is open. Read before anything else
   in this file, because every other key is built out of langId. */
try{
  var lx=JSON.parse(localStorage.getItem(LS_LANGS)||'null');
  if(lx && typeof lx==='object') LANGS=lx;
}catch(e){}
try{ langId=localStorage.getItem(LS_CUR)||''; }catch(e){}

/* A language made before this app could hold more than one is sitting under
   the eight flat keys. It becomes the person's own language, and its old keys
   are left exactly where they are: this runs once, on a phone, against the
   only copy of something somebody spent months on. Copying costs a few
   hundred kilobytes and cannot lose anything. Moving could. */
function langMigrate(){
  var FLAT={ words:'lingua.words', lines:'lingua.lines', lang:'lingua.lang',
             script:'lingua.script', letters:'lingua.letters',
             notes:'lingua.notes', phases:'lingua.phases', talk:'lingua.talk' };
  var had=false, k;
  for(k in FLAT) if(localStorage.getItem(FLAT[k])!==null) had=true;
  if(!had) return false;
  var id='L'+(new Date()).getTime().toString(36);
  var prev=langId; langId=id;
  for(k in FLAT){
    var v=localStorage.getItem(FLAT[k]);
    if(v!==null) localStorage.setItem(langKey(k), v);
  }
  langId=prev;
  LANGS[id]={ name: localStorage.getItem('lingua.lang')||'', mine:true };
  langId=id;
  langStore();
  return true;
}
function langStore(){
  try{
    localStorage.setItem(LS_LANGS, JSON.stringify(LANGS));
    localStorage.setItem(LS_CUR, langId);
  }catch(e){}
}
/* Nothing here at all: a first run, or a first run after the migration found
   nothing to move. The person gets one empty language of their own. */
function langFirst(){
  var id='L'+(new Date()).getTime().toString(36);
  LANGS[id]={ name:'', mine:true };
  langId=id;
  langStore();
}
try{
  if(!langId || !LANGS[langId]){ if(!langMigrate()) langFirst(); }
}catch(e){ langFirst(); }

/* Read the open language into the globals the screens use.
   Called once here, and again every time a different language is opened, so
   it puts back what an empty language looks like before it reads anything. A
   version of this that only overwrote what the incoming language happens to
   have would leave the last one's words sitting behind it -- you would open
   somebody else's language and find your own dictionary in it. */
function langRead(){
  WORDS=[]; LINES=[]; langName=''; SCRIPT={g:{}, extra:[]};
  try{ var a=JSON.parse(localStorage.getItem(langKey('words'))||'[]'); if(Array.isArray(a)) WORDS=a; }catch(e){}
  try{ var l=JSON.parse(localStorage.getItem(langKey('lines'))||'[]'); if(Array.isArray(l)) LINES=l; }catch(e){}
  try{ langName=localStorage.getItem(langKey('lang'))||''; }catch(e){}
  try{
    var gg=JSON.parse(localStorage.getItem(langKey('script'))||'null');
    if(gg && gg.g){ SCRIPT.g=gg.g; SCRIPT.extra=gg.extra||[]; }
    /* Which way the language is written. Read on its own rather than inside
       the `gg.g` branch above: a language can have a direction and no glyphs
       drawn yet, and reading it only when there are glyphs would lose it for
       exactly the person who set it first and drew second. */
    if(gg && gg.dir) SCRIPT.dir=gg.dir;
  }catch(e){}
}
langRead();
/* Settings saved by an older version are missing whatever was added since, so
   they are laid over the defaults rather than replacing them. Written out by
   hand because Object.assign is not ES5 and this has to run on an old phone. */
try{
  var s=JSON.parse(localStorage.getItem(LS_S)||'null');
  if(s) for(var sk in s) if(Object.prototype.hasOwnProperty.call(s,sk)) SET[sk]=s[sk];
}catch(e){}
/* Except the plan, on a phone.
   The settings are a file inside the app, and that file is in the backup a
   phone makes onto a PC -- which can be opened, edited and restored with free
   tools and no jailbreak. So the plan is in the Keychain instead, and the
   native side has already put it in `window.__plan`: it is a script injected
   before this one rather than an answer to a plugin call, because what a free
   plan looks like is decided on the first frame and a call comes back after
   it. ios/App/App/LinguaPlan.swift is the other half, and says what this does
   not stop.

   In a browser, and in every check under tools/, there is no native side and
   the settings hold the plan exactly as they always did. */
var PLAN_NATIVE=(typeof window.__plan==='string');
if(PLAN_NATIVE){
  /* Empty means the Keychain has never been written -- a fresh install, or
     one that predates this and still has the plan in its settings. Both are
     answered the same way: take whatever is there and put it where it now
     belongs, once. */
  if(window.__plan) SET.plan=window.__plan;
  else planKeep(SET.plan||'free');
  /* Whatever copy is still in the file goes out with the next save, which
     setOnDisk() below is what makes true. Taking it out here as well was
     written first and did nothing: the save that boot does anyway put it
     straight back, so the one place that decides is the save. */
}

/* Switch which language is open. Order matters: the language that is open
   when this is called has to be written out before langId changes, or its
   words end up saved under the language being switched to. */
function langOpen(id){
  if(!LANGS[id] || id===langId) return;
  save(); saveLetters(); saveNotes(); saveStg(); saveSnd(); saveKb(); saveWld();
  langId=id; langStore();
  langRead(); ltRead(); noteRead(); stRead(); sndRead(); sndStart(); ltStart(); kbRead(); migrateKbFree(); wldRead(); migratePostInk();
  /* and where you were standing in the old one is not a place in this one:
     a filter left on would hide most of a dictionary you have never seen. */
  viewReset();
  goTab('profile');
}

function save(){
  bkTouch();
  try{
    localStorage.setItem(langKey('words'),JSON.stringify(WORDS));
    localStorage.setItem(langKey('lines'),JSON.stringify(LINES));
    localStorage.setItem(langKey('lang'),langName);
    localStorage.setItem(langKey('script'),JSON.stringify(SCRIPT));
    localStorage.setItem(LS_S,JSON.stringify(setOnDisk()));
    /* the index carries the name so a list of languages can be shown without
       opening each one to find out what it is called */
    if(LANGS[langId]) LANGS[langId].name=langName;
    langStore();
  }catch(e){}
}

/* =========================================================================
   0.5 Language of the interface
       English is the base. Every other locale is a fallback layer on top of
       it, so a missing key degrades to English rather than to a blank.

       The rule this app follows everywhere: the stable machine key is what
       gets stored; the human-readable label is chosen at render time. That
       is why a dictionary written in Japanese can be reopened in English
       without a single stale string surviving inside the saved data.
   ========================================================================= */
/* Every language this app speaks is defined in one file of its own under
   www/i18n/: its name, what it calls the parts of speech, the way it writes a
   foreign word, and every string the interface shows. Each file registers
   itself through defLang() below, which is why this has to load before any of
   them. Nothing about a language lives anywhere else, which is the whole
   point: adding an eleventh language is adding one file and one <script> tag,
   and there is no second place to forget. */
var LANG={};        /* code -> that language, whole */
var UI_LANGS=[];    /* the same codes, in the order they registered */
function defLang(code, def){ LANG[code]=def; UI_LANGS.push(code); return def; }

function autoLang(){
  var l=String((navigator.language||navigator.userLanguage||'en')).toLowerCase().split('-')[0];
  return UI_LANGS.indexOf(l)>=0 ? l : 'en';
}
function uiLang(){ return (UI_LANGS.indexOf(SET.ui)>=0) ? SET.ui : autoLang(); }
function langDef(){ return LANG[uiLang()] || LANG.en || {}; }
function strOf(code){ var d=LANG[code]; return (d && d.str) || {}; }

/* Set T_MISS to an object and every key that falls through to English, or
   past English to the bare key, is recorded in it. The interface never turns
   it on; tools/i18n-check.mjs does, walks every screen in every language and
   then insists it came back empty. A missing translation is a bug that ships
   silently otherwise — this is what makes it fail loudly instead. */
var T_MISS=null;

/* t('key', a, b) — {0} and {1} are filled from the extra arguments.
   The strings may carry markup, so nothing here is escaped; anything that
   comes from the person (a headword, a meaning) is escaped at the call site. */
function t(k){
  var d=strOf(uiLang()), e=strOf('en');
  if(T_MISS && d[k]===undefined) T_MISS[uiLang()+' '+k]=1;
  var s=(d[k]!==undefined) ? d[k] : (e[k]!==undefined ? e[k] : k);
  if(arguments.length>1){
    var args=arguments;
    s=String(s).replace(/\{(\d)\}/g,function(m,i){
      var v=args[(+i)+1];
      return v===undefined ? m : String(v);
    });
  }
  return s;
}
/* tn('key', n, ...) — the same, for strings that carry a count. English
   inflects for number, so a key may also define a ".1" form used when the
   count is exactly one, and Russian a ".few" for 2-4. The variant is looked
   up in the current language only: a language without one simply never sees
   it, instead of falling through to the English singular. */
function tn(k,n){
  var d=strOf(uiLang()), v=k, m10=n%10, m100=n%100;
  if(n===1 && d[k+'.1']!==undefined) v=k+'.1';
  else if(m10>=2 && m10<=4 && !(m100>=12 && m100<=14) && d[k+'.few']!==undefined) v=k+'.few';
  var args=Array.prototype.slice.call(arguments,1);
  args.unshift(v);
  return t.apply(null,args);
}

/* =========================================================================
   1. Plans
      How much can be done for nothing is the most important decision in
      this app. Analysis, deriving readings, linking, generating words that
      keep the rules — every one of those is plain arithmetic on the device.
      No network, no model. So all of it is free.
      Money buys storage (cloud, CSV, unlimited) and working with an AI.
   ========================================================================= */
/* The three, and what each of them is. `mo` and `yr` are the two ways to buy
   one -- the product ids and the four prices are the owner's decision of
   2026-08-14 and are written out in docs/apple.md; these are the same four
   numbers said where a person can see them. Free has neither, because it is
   not bought.

   `each` is what a year comes to a month, which is the number somebody
   actually compares against the monthly one.

   The lines are what CAN opens, and nothing else. A paid screen that promises
   something the app cannot do is the app lying to somebody who is about to
   pay -- cloud storage is a Plus feature in docs/FEATURES.md, is not built,
   and is therefore not on this list. */
var PLANS=[
  {id:'free',  name:'Free',   mo:'plan.price.free', yr:'plan.price.free', each:'',
   lines:['plan.free.1','plan.free.2','plan.free.3','plan.free.4']},
  {id:'plus',  name:'Plus',   mo:'plan.price.plus', yr:'plan.price.plus.yr',
   each:'plan.each.plus',
   lines:['plan.plus.1','plan.plus.2','plan.plus.3','plan.plus.4','plan.plus.5',
          'plan.plus.6','plan.badge']},
];
/* Studio is not here. What it sold was the hosted model -- the conversation
   and the suggestions -- and the model is the last thing going in. A tier
   whose lines describe a thing the app cannot do yet is the app lying to
   somebody who is about to pay, which the paragraph above forbids, and a
   free allowance of three a day is that same lie with a meter on it.

   It comes back when the seam in www/glyph.js has something behind it, and
   what comes back with it is the chapter and the chips that were lifted out
   with it. Nothing was thrown away: it is in the history under this commit. */
var FREE_LIMIT=100;
function plan(){ return SET.plan||'free'; }
/* What of the settings goes to the file. Everything, except on a phone, where
   the plan is in the Keychain and a second copy in an editable file would be
   the copy that decides: the next save would put it back over the top. */
function setOnDisk(){
  var out={}, k;
  for(k in SET) if(Object.prototype.hasOwnProperty.call(SET,k)) out[k]=SET[k];
  if(PLAN_NATIVE) delete out.plan;
  return out;
}
/* Written down when somebody has just changed it, and not waited for. What
   this session uses is the value in memory; a Keychain that refused the write
   is a phone that answers with the old plan at the next launch, and the old
   plan is the free side of wrong on an upgrade -- which is the side the rule
   in docs/PAID_FEATURES.md asks for, and which StoreKit corrects the moment
   it is asked again. */
function planKeep(id){
  var P=window.Capacitor && Capacitor.Plugins, p=P && P.LinguaPlan;
  if(!p) return;
  try{ p.write({plan:String(id||'free')})['catch'](function(){}); }catch(e){}
}
function has(level){ /* level: 'plus' */
  return (level==='plus')? plan()==='plus' : true;
}
/* What money buys, one capability at a time, and the only place that says so.
   Ten names, each the level it needs.

   has('plus') used to be asked directly, in twenty-three places across nine
   files, and every one of them looked identical to every other. They were not
   asking the same question. Four meant "may this dictionary pass a hundred
   words", five meant "may a letter be added, renamed or deleted", two meant
   "may a keyboard be built", and the rest were four more questions again. The
   plan is the only thing the code said out loud; which capability each site
   was about lived in a comment, or in nothing.

   That is fine while there are two plans and nothing moves between them. It
   stops being fine the first time something does -- open file import on free,
   move the keyboard to a tier above, add a third plan -- because then the work is
   to read twenty-three branches and remember, one at a time, what each was
   ever about. A rule lives in one place: this is that place for this rule,
   and the twenty-three sites now name a capability instead of restating the
   plan. dead-check holds both directions, exactly as act-map's names are
   held: no capability nothing asks for, no name that is no capability.

   'words' and 'tr' are metered rather than shut: free gets FREE_LIMIT of the
   one and TR_FREE_DAILY of the other, so can() answering false there means
   "counted", not "refused". */
var CAN={
  words:   'plus',   /* a dictionary past FREE_LIMIT */
  data:    'plus',   /* CSV out, and the cloud */
  file:    'plus',   /* a list brought in as a file rather than a paste */
  letters: 'plus',   /* adding, naming and deleting a letter */
  wsys:    'plus',   /* a writing system that is not an alphabet */
  kb:      'plus',   /* a keyboard of your own, instead of the fixed QWERTY */
  snd:     'plus',   /* choosing a sound, rather than taking the letter's own */
  gram:    'plus',   /* a grammar stage of your own, past the fifteen there are */
  dir:     'plus'    /* choosing which way the language is written */
};
/* 'dir' is the one capability that gates only half of a thing, and the half it
   does not gate is the important one.

   READING a language written right to left, or in columns, is free and is on
   every plan. A post carries the direction it was written in and is shown that
   way to everybody -- otherwise a timeline would be lying about somebody
   else's language, which is the same bug as drawing their line in my letters.
   CHOOSING one is what this buys. 「無料でも言語の向きは見ることはできる。でも
   設定してsnsとかに登校するのは有料会員のみ」

   So nothing anywhere asks can('dir') before DRAWING. It is asked in exactly
   one place, setScriptDir(), and on the screen that offers the choice. */
/* 'snd' is what free is NOT, said as a capability.

   A word used to be assembled by pressing sounds -- three screens of keys
   laid out as "the sounds of this language", and no way to type one. That is
   a true shape for a language whose inventory you chose before you had an
   alphabet, and it is the wrong way round for the free plan, where the
   alphabet is a to z and every one of them already reads something. There is
   nothing to choose, and being asked to choose was being asked to answer a
   question the letter had already answered.
   「文字ベースに音が付随だからね？音から選択するのは課金機能」
   「音は選択できない。だってアルファベットには既存の音があるんだから」

   So free types, and the letter's own reading stands. Picking a sound for a
   position, or building a word out of sounds instead of letters, is what
   this buys. */
function can(what){
  var lv=CAN[what];
  /* A capability nobody declared is a typo, and a typo here reads as "free",
     which is the quiet way round. dead-check catches it before a phone does;
     this catches it if the check is ever wrong. */
  if(!lv) throw new Error('can: no such capability: '+what);
  return has(lv);
}
function capOK(add){
  add=add||1;
  if(can('words')) return true;
  return WORDS.length+add<=FREE_LIMIT;
}
/* The day a plan ends, said out loud, once.

   A subscription ending puts the app back into the shape the free plan has:
   the dictionary lists a hundred, the writing is an alphabet, the keyboard is
   the fixed QWERTY, the line runs left to right. None of that removes
   anything -- every word, every letter, every layout is where it was, in the
   backup and in the file in Documents -- but somebody opening the app to find
   four thousand nine hundred words missing from a list has no way to know
   that, and the sentence they need is the one this app has the least excuse
   for not saying. 「バックアップには保存されてるよーって一回出せばok」

   It compares the plan with the plan it last saw, so it does not care HOW the
   plan changed: set by hand today, told by StoreKit tomorrow, or found to
   have lapsed at launch. `SET.planWas` is the person's, not a language's --
   it is a fact about the account.

   The first run of all only records where things stand. There is nothing to
   announce to somebody who has never been on another plan. */
function capLapse(){
  var now=plan(), was=SET.planWas;
  if(was===undefined || was===null){ SET.planWas=now; save(); return; }
  if(was===now) return;
  SET.planWas=now; save();
  if(now==='free') openCapLapse();
}

/* =========================================================================
   2. Theme
   ========================================================================= */
var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
function applyTheme(){
  var t2=SET.theme;
  if(t2==='system') t2 = (mq && mq.matches) ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t2);
  /* The bar above the app is the app's background. It was two hex values
     written out here, which is the same colour said twice -- change --bg and
     the top of the screen would stay the old one. Asked of the page. */
  var m=document.getElementById('tcolor');
  if(m) m.setAttribute('content',
    (getComputedStyle(document.documentElement).getPropertyValue('--bg')||'').trim() ||
    (t2==='light' ? '#faf8f3' : '#0a0a0e'));
}
if(mq && mq.addEventListener) mq.addEventListener('change', function(){ if(SET.theme==='system') applyTheme(); });
applyTheme();

/* =========================================================================
   3. The phonology core. Runs on the device. Nothing leaves it.
   ========================================================================= */
var VOW='aeiouy';
function isV(c){return VOW.indexOf(c)>=0;}
/* Consonant clusters that can stand at the head of a syllable.
   This is what makes "silva" break as sil-va rather than si-lva. Only the
   orderings every language agrees on are allowed: an onset gets louder as
   it approaches the vowel. */
var LIQ={l:1,r:1,w:1,y:1,j:1};
function onsetOK(u){
  if(u.length<=1) return true;
  if(u.length===2){
    if(LIQ[u[1]] && !LIQ[u[0]] && u[0]!=='m' && u[0]!=='n' && u[0]!==u[1]) return true;   /* pr, tr, kl, thr ... */
    if(u[0]==='s' && 'ptkmnlw'.indexOf(u[1])>=0) return true;                              /* sp, st, sk, sl ... */
    return false;
  }
  if(u.length===3 && u[0]==='s') return onsetOK(u.slice(1));                               /* spr, str ... */
  return false;
}
function syl(word){
  var s=String(word).toLowerCase().replace(/[^a-z]/g,''), out=[], i=0;
  while(i<s.length){
    var c=''; while(i<s.length && !isV(s[i])){c+=s[i];i++;}
    var v=''; while(i<s.length &&  isV(s[i])){v+=s[i];i++;}
    if(v===''){ if(out.length) out[out.length-1]+=c; else if(c) out.push(c); }
    else {
      /* A cluster in the middle of a word keeps only as much as can stand as
         an onset; whatever is left over sticks to the end of the syllable before. */
      if(out.length && c){
        var u=splitC(c), k=0;
        while(k<u.length && !onsetOK(u.slice(k))) k++;
        if(k>0){ out[out.length-1]+=u.slice(0,k).join(''); c=u.slice(k).join(''); }
      }
      out.push(c+v);
    }
  }
  return out;
}
var PART=/^([^aeiouy]*)([aeiouy]+)([^aeiouy]*)$/;
/* y is a vowel when it stands alone and a glide when it leans on the vowel
   after it (ya = /ja/, not /i.a/). The syllabifier counts it as a vowel so
   that it can carry a syllable by itself; here, if it turns out to have a
   vowel behind it, it is handed back to the onset where it belongs. Every
   reading and the IPA then treat it as the consonant it is being. */
function parts(sy){
  var m=sy.match(PART); if(!m) return null;
  var on=m[1], nu=m[2];
  if(nu.length>1 && nu.charAt(0)==='y'){ on+='y'; nu=nu.slice(1); }
  return {on:on, nu:nu, co:m[3]};
}
function splitC(str){
  var out=[], i=0;
  while(i<str.length){
    var two=str.substr(i,2);
    if(two==='th'||two==='sh'||two==='ch'){out.push(two);i+=2;}
    else {out.push(str[i]);i++;}
  }
  return out;
}
/* ---- A word is the sounds it is made of --------------------------------
   It used to be a Latin string that everything else guessed at: th was read
   as one sound because English reads it as one, x became ks, a doubled vowel
   became a long one. Every one of those is a rule from somebody else's
   language, applied to a language that is not theirs.

   A word carries its sounds now. They were chosen from the chart, so there
   is nothing to work out -- the spelling is what those symbols look like
   written down, and nothing is read back out of it.

   Words written before this carry no sequence, so they are given one once,
   by the old guess, and never guessed at again. */
function wPh(w){
  /* The spelling is the word, so what it sounds like is asked of the letters
     it is spelled with -- every time, so a letter that changes its sound
     changes the words it is in. `ph` is what a word carries when it has no
     spelling: an import, or a word from before this. */
  if(w && w.sp && w.sp.length) return spPh(w.sp);
  if(w && w.ph && w.ph.length) return w.ph;
  return phGuess(w? w.hw : '');
}
/* The old reading of a Latin spelling, kept for exactly one job: giving the
   words that predate the chart a sequence to carry from now on. */
function phGuess(hw){
  var s=String(hw||'').toLowerCase().replace(/[^a-z]/g,''), out=[], i=0, two;
  while(i<s.length){
    two=s.substr(i,2);
    /* Every value in IPA_WAS is a LIST, because a digraph is not always one
       sound -- ch is t then \u0283. concat and not push: a sequence is a list
       of symbols the chart has, and a list inside it is not a symbol. */
    if(IPA_WAS[two]){ out=out.concat(IPA_WAS[two]); i+=2; }
    else if(IPA_WAS[s.charAt(i)]){ out=out.concat(IPA_WAS[s.charAt(i)]); i++; }
    else { out.push(s.charAt(i)); i++; }
  }
  return out;
}
/* ---- A word can mean more than one thing ------------------------------
   It carried a single string, so the second meaning of a word had nowhere to
   go and people wrote "river; road" into the one box, which no screen can
   read back. It carries a list now. Words written before this are given a
   list of one, once. */
function wMns(w){
  if(w && w.mns && w.mns.length) return w.mns;
  return (w && w.mn) ? [w.mn] : [];
}
function wMn(w){ return wMns(w).join(' / '); }
function migrateMn(){
  var changed=false;
  WORDS.forEach(function(w){
    if(!w.mns){ w.mns = w.mn? [String(w.mn)] : []; changed=true; }
  });
  if(changed) save();
}
/* ---- and a word can come from another word ----------------------------
   A derived word is a word in its own right -- it has its own sounds, its own
   meanings, its own part of speech -- that remembers what it was built from.
   The dictionary shows it under its parent instead of filed away from it. */
function wKids(w){
  var out=[], i, k=String(w.hw);
  for(i=0;i<WORDS.length;i++) if(WORDS[i].from===k) out.push(WORDS[i]);
  return out;
}
function wParent(w){
  if(!w || !w.from) return null;
  var i;
  for(i=0;i<WORDS.length;i++) if(String(WORDS[i].hw)===w.from) return WORDS[i];
  return null;
}
function migratePh(){
  var changed=false;
  WORDS.forEach(function(w){
    if(!w.ph || !w.ph.length){ w.ph=phGuess(w.hw); changed=true; }
  });
  if(changed) save();
}
/* Syllables, cut out of the sounds rather than out of the letters.
   A run of consonants, then the vowels. Then the run of consonants before the
   next vowel is split: the last one starts the next syllable and whatever is
   left closes this one, which is the rule every language agrees on and needs
   no table of clusters to apply. */
function phCut(seq){
  var out=[], i=0, on, nu, k, run;
  while(i<seq.length){
    on=[]; while(i<seq.length && !ipaIsVowel(seq[i])){ on.push(seq[i]); i++; }
    nu=[]; while(i<seq.length &&  ipaIsVowel(seq[i])){ nu.push(seq[i]); i++; }
    if(!nu.length){
      if(out.length) out[out.length-1].co=out[out.length-1].co.concat(on);
      else if(on.length) out.push({on:on, nu:[], co:[]});
      break;
    }
    out.push({on:on, nu:nu, co:[]});
  }
  for(k=1;k<out.length;k++){
    run=out[k].on;
    if(run.length>1){
      out[k-1].co=out[k-1].co.concat(run.slice(0, run.length-1));
      out[k].on=run.slice(run.length-1);
    }
  }
  return out;
}
/* A run of symbols as one key, and back again. Some symbols are two code
   units (a letter and a diacritic), so they cannot be joined and then split
   on characters -- a space between them is a separator no symbol contains. */
function phKey(a){ return a.join(' '); }
function phUnkey(k){ return k? String(k).split(' ') : []; }
/* The Latin approximation of a whole sequence, for the respelling engines,
   which read Latin and nothing else. */
function phRoman(seq){
  var out='', i;
  for(i=0;i<seq.length;i++) out+=ipaRoman(seq[i]);
  return out || 'a';
}
function phIpa(seq){ return '/'+seq.join('')+'/'; }

/* What the dictionary has quietly settled into. Every count here is over the
   sounds a word is made of. It used to be over the letters it is spelled with,
   which meant reading a Latin spelling by English rules -- one more place a
   language that is not English was being measured as though it were. */
function analyze(){
  var on={},onI={},onM={},nu={},co={},cnt={},fin={},posN={},used={},vset={};
  WORDS.forEach(function(w){
    var seq=wPh(w), ss=phCut(seq), i;
    cnt[ss.length]=(cnt[ss.length]||0)+1;
    ss.forEach(function(p,si){
      var o=phKey(p.on), n=phKey(p.nu), c=phKey(p.co);
      on[o]=(on[o]||0)+1; nu[n]=(nu[n]||0)+1;
      if(si===0) onI[o]=(onI[o]||0)+1; else onM[o]=(onM[o]||0)+1;
      if(p.co.length) co[c]=(co[c]||0)+1;
      p.on.forEach(function(x){ used[x]=1; });
      p.co.forEach(function(x){ used[x]=1; });
      p.nu.forEach(function(x){ vset[x]=1; });
    });
    /* what a word ends on is its last sound */
    var f=seq.length? seq[seq.length-1] : '';
    fin[w.pos]=fin[w.pos]||{}; fin[w.pos][f]=(fin[w.pos][f]||0)+1;
    posN[w.pos]=(posN[w.pos]||0)+1;
  });
  var finalRule={};
  Object.keys(fin).forEach(function(p){
    if(posN[p]<3) return;
    var e=Object.keys(fin[p]).map(function(k){return [k,fin[p][k]];}).sort(function(a,b){return b[1]-a[1];})[0];
    if(e && e[1]/posN[p]>=0.5) finalRule[p]={ch:e[0],hit:e[1],all:posN[p],rate:e[1]/posN[p]};
  });
  var usedA=Object.keys(used).sort();
  /* A sound is unused when the language has chosen it and no word says it.
     Measured against the inventory you picked, not against somebody else's
     twenty-six letters. */
  var mine=(typeof addedSnd==='function')? addedSnd() : [];
  var unused=mine.filter(function(c){ return !used[c] && !vset[c]; });
  var sm=Object.keys(cnt).map(function(k){return [k,cnt[k]];}).sort(function(a,b){return b[1]-a[1];})[0];
  return {on:on,onI:onI,onM:onM,nu:nu,co:co,cnt:cnt,finalRule:finalRule,used:usedA,unused:unused,
          sylMode: sm?{n:+sm[0],hit:sm[1],all:WORDS.length}:null,
          vowels:Object.keys(vset).sort()};
}

/* =========================================================================
   3.6 The languages — www/i18n/en.js and its nine siblings
       One file per interface language, and everything that language needs
       inside it: what it is called, what it calls the parts of speech, how
       it writes a foreign word, and every string the interface shows. Each
       is a closure, so its tables cannot collide with the other nine and
       cannot be reached from the rest of the app. The only way in is
       defLang() above; the only way out is the object it hands back.

       The reading contract every language honours:
         syl_xx(p)    one syllable {on,nu,co}      -> that syllable, written
         word_xx(ps)  every syllable of one word   -> the finished reading
       Both are wrapped by mkApprox() below, so no screen ever learns how a
       word was cut up. Plain ES5 throughout — this runs in WKWebView.

       To add a language: copy a file, translate it, add its <script> tag to
       www/index.html. Nothing else needs to know it happened.
   ========================================================================= */

/* The syllabifier can hand back a run of consonants with no vowel in it (a
   stray tail), which parts() reports as null; every reading treats that as
   an onset with nothing after it. */
function sylParts(sy){ var p=parts(sy); return p || {on:sy, nu:'', co:''}; }
function mkApprox(wordFn, sylFn){
  return {
    word: function(w){ return wordFn(syl(w).map(sylParts)); },
    syl:  function(s){ return sylFn(sylParts(s)); }
  };
}

