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
                                   -- `uid` on the entry, which netLangRow()
                                   writes. `mine` is a different word and is
                                   about this PHONE, not about an account
        lingua.cur                 which one is open
        lingua.set                 the person's settings -- not a language's

      Everything a screen reads is still a single global: WORDS is the open
      language's dictionary, not a table of every language's. The app shows
      one language at a time, because you are either writing yours or reading
      somebody else's, and 290-odd places say WORDS meaning "the one in front
      of me". They still do.
   ========================================================================= */
var LS_LANGS='lingua.langs', LS_CUR='lingua.cur', LS_S='lingua.set';
/* Everything this app has ever written, and it is NOT a list.

   「アカウント削除で残るものねえって言ってんだろ何回言わせんだよ全部消えんだよ。」
   OWNER 2026-08-27 -- and the reason it had to be said again is one bug, not
   several. wipeAll() used to name the keys it removed, so every key added
   after it was written stayed behind: the drafts, the posts, the person's
   name and face, the index of languages, and the eight flat keys from before
   there could be more than one. Nothing threw. Somebody deleted their account
   and the app still greeted them by name.

   So the keys are COUNTED rather than named. A key added tomorrow is gone the
   day it is added, and there is nothing to keep in step. `SLICES` below is no
   longer part of this: it is what a BACKUP is made of and nothing else now.

   The prefix is exact and includes the dot. `lingua` on its own, and anything
   starting `linguaX`, belong to somebody else -- this is a shared storage and
   a wipe that took a neighbour's key would be the one mistake here that
   cannot be undone.

   Two passes, because removeItem() renumbers the keys under localStorage.key()
   and a single loop skips every second one. */
/* ONE ACCOUNT'S THINGS, and nothing else's.
   「別アカウントでログインしてそれのアカウント削除したら、俺の元のアカウントが
   消えてんだよ」 OWNER 2026-09-03.

   Deleting an account emptied the whole `lingua.` namespace and the whole
   backup directory, and that was RIGHT when it was written on 2026-08-27,
   when a phone held one account and 「アカウント削除で残るものねえ」 had no
   other reading. Then everything became the ACCOUNT's -- the plan, the
   languages, the posts, the settings -- and nothing went back to read the one
   function that erases. The app's meaning moved and the deletion's did not.

   Returns the language ids it took,
   so the caller can drop those backups and no others. */
function lsWipeAcct(uid){
  var me=String(uid||''), ids=[], doomed=[], id, i, k, j;
  for(id in LANGS)
    if(Object.prototype.hasOwnProperty.call(LANGS, id) && LANGS[id] &&
       String(LANGS[id].uid||'')===me) ids.push(id);
  for(i=0;i<ids.length;i++){
    for(j=0;j<SLICES.length;j++) doomed.push(langKeyOf(ids[i], SLICES[j]));
    delete LANGS[ids[i]];
  }
  /* and every other key this account put its name on */
  try{
    for(i=0;i<localStorage.length;i++){
      k=localStorage.key(i);
      if(!k) continue;
      if((k.indexOf('lingua.me.')===0 || k.indexOf('lingua.posts.')===0 ||
          k.indexOf('lingua.drafts.')===0) && k.slice(k.lastIndexOf('.')+1)===me)
        doomed.push(k);
    }
  }catch(e){}
  /* the live copies, which are this account's while it is signed in */
  doomed.push('lingua.me'); doomed.push('lingua.posts'); doomed.push('lingua.drafts');
  /* AND THE EIGHT FLAT KEYS. langMigrate() copies them into a language on the
     first launch of a build that has ids -- `lingua.cur` did not exist in the
     one that wrote them, so langId is empty and that migration always runs --
     and netRead() then stamps that language with the account this phone is.
     What is left behind is a second copy of that dictionary answering to
     nobody, and langMigrate() reads it again the moment the index has no
     current language: delete the account, and the next person to sign in on
     this phone is handed the first person's words as their own language.
     That is 2026-09-03 exactly, and it is why there is no such thing here as
     a key that is nobody's.

     A DELETION, and it is on the road a person pressed: 「アカウントを削除」
     takes that account's everything, and these eight are that account's
     dictionary in an older spelling. It is not pruning and nothing here runs
     on its own -- lsWipeAcct() is reached from one button. */
  for(k in LS_FLAT)
    if(Object.prototype.hasOwnProperty.call(LS_FLAT, k)) doomed.push(LS_FLAT[k]);
  try{ for(i=0;i<doomed.length;i++) localStorage.removeItem(doomed[i]); }catch(e){}
  langStore();
  return ids;
}
/* The slices a language is filed under. One list, because reading a language,
   writing one out, and DELETING one all have to name every slice.

   「この言語を削除で言語の制作のものは全部なくなる」 OWNER 2026-09-03 --
   wipeLangsGo() in www/settings.js walks this list for one id through
   langKeyOf(), and a slice that is not in it is a slice that survives a
   delete the person was told took everything. It is the same list bkPack()
   walks, so a slice missing here is missing from the backup too.

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
var SLICES=['words','lines','lang','script','letters','notes','phases','talk','snd','kb','wld','gram2'];
/* id -> { name, mine, sid, uid }: the index says which languages are here, and
   the language's own keys hold what it is.

   It said `{ name, mine } and nothing more`, and there were three. `sid` is
   the server's id for the language, put on by netLangRow() (www/net.js) the
   first time the language goes up and langStore()'d on the spot: an entry
   with no `sid` has never been up.

   `uid` is the ACCOUNT the language belongs to, written by netLangRow() at
   the same moment and for a bug that had no other place to be fixed:
   「違うアカウントでログインしてんのに前のやつ出てくるんだけど？」 OWNER
   2026-08-31. This index is the PHONE's -- it survives signing out, because
   nothing here deletes anything -- so a language sat here with nothing on it
   saying whose it was, and netLangRow() made a server row for whoever was
   signed in. A's language became B's.

   **`mine` is not this and never was.** It is about this phone: whether the
   language is one you are making rather than one you are reading, and
   langCap() counts it. Two words that both sound like ownership, and only
   one of them names an account.

   An entry with no `uid` has never been through a door. That is a real state
   and not a gap -- the onboarding makes a language before there is an account
   and obFinish() puts it up at the door 「オンボーディング→最後にログイン」 --
   so it is answered rather than repaired, in netLangRow(), which is the only
   place a language meets a session. */
var LANGS={}, langId='';
var WORDS=[], LINES=[], langName='', SET=setDefaults();
/* What a person's settings are before they touch anything. A function rather
   than a literal because it is needed twice -- here, and when everything is
   wiped -- and the second copy was written out by hand and did not have the
   same keys in it. */
function setDefaults(){
  return {theme:'system', plan:'free', planUid:'', done:false, order:'SOV', read:'both',
          voice:'', ui:'', script:false};
}
/* The writing system. `g` maps a romanisation to the strokes drawn for it;
   `extra` holds letters the person added by hand that no word uses yet, so a
   script can be built before the dictionary is. Nothing here is ever what gets
   stored as text — a word is roman letters in WORDS and stays that way. */
var SCRIPT={g:{}, extra:[]};

/* How a language is filed, and the only thing that knows it. `langKeyOf`
   names ANY language; `langKey` names the open one, which is what 290-odd call
   sites mean when they say it.

   It took no argument but the slice for as long as every question was about
   the language in front of you. Two questions arrived that are not, on two
   days, from two directions, and both landed on this same pair:

     counting keyboards -- the ceiling is a POOL ACROSS LANGUAGES, so
     somebody's other language has to be read without being opened;
     the grammar engine's adapter -- it saves a model that carries its own
     languageId and cannot say langKey().

   Either one, left to build 'lingua.'+id+'.'+slice where it stood, would have
   been a second thing that knows how a language is filed -- and a key built by
   concatenation somewhere else is a slice bkPack() will not find and wipeAll
   will not clear, which is how one language's leftovers arrive in the next
   under the same id. The keyboard and the world were both that bug once;
   CLAUDE.md names them. */
function langKeyOf(id, slice){ return 'lingua.' + id + '.' + slice; }
function langKey(slice){ return langKeyOf(langId, slice); }

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
/* The eight keys a single-language build wrote, before a language had an id.
   Two things read this and they are the two ends of one life: langMigrate()
   copies them into a language, and lsWipeAcct() takes them with the account
   they were handed to. Written out once so those two cannot drift apart. */
var LS_FLAT={ words:'lingua.words', lines:'lingua.lines', lang:'lingua.lang',
              script:'lingua.script', letters:'lingua.letters',
              notes:'lingua.notes', phases:'lingua.phases', talk:'lingua.talk' };
function langMigrate(){
  var FLAT=LS_FLAT;
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
  /* `mig` is the mark that says WHO to ask later. This function runs while
     core.js is still loading -- www/index.html has core.js at 3578 and net.js
     at 3595 -- so `SESS` is not merely empty here, it is not declared. There
     is nothing to stamp with.

     And the stamp matters: a language with no `uid` belongs to nobody once
     SET.done is true (langOwned), and a phone reaching this line has finished
     the onboarding by definition -- the old flat keys are what it made before
     there were several languages. Left unstamped it would be in no list and
     in no count, with every word of it still in storage. That is the shape of
     the fault, and it is the one that reads as 「my language is gone」.

     So it is recorded rather than guessed at, and netRead() in www/net.js
     puts the account on it the moment there is one to put -- eighteen lines
     later, in the one place that knows what a session is. `mig` comes off
     with it, so this happens once.

     NOT langForAcct()'s adoption: this is not 「whoever is asking」. It is
     one language, made on THIS phone, in a format that predates accounts,
     handed to the account this phone was already signed in as. */
  LANGS[id]={ name: localStorage.getItem('lingua.lang')||'', mine:true, mig:true };
  langId=id;
  langStore();
  return true;
}
/* The mark above, spent. Called from netRead() with the session in hand --
   www/net.js is the one place that knows where a session is kept, and this is
   the one place that knows what `mig` means. */
function langMigStamp(uid){
  var id, did=false;
  if(!uid) return false;
  for(id in LANGS)
    if(Object.prototype.hasOwnProperty.call(LANGS, id) && LANGS[id] && LANGS[id].mig){
      if(!LANGS[id].uid) LANGS[id].uid=String(uid);
      delete LANGS[id].mig;
      did=true;
    }
  if(did) langStore();
  return did;
}
function langStore(){
  try{
    localStorage.setItem(LS_LANGS, JSON.stringify(LANGS));
    localStorage.setItem(LS_CUR, langId);
  }catch(e){}
}
/* A new language of this person's, in the index and nowhere else yet. Its
   slices do not exist until something writes one, which is what an empty
   language IS -- langRead() below puts the globals back to empty when it
   cannot find any.

   One place, because there are two callers and they arrive from opposite
   ends: langFirst() is the first run, where there is no language to leave,
   and langNew() is the button, where there is one and it has to be written
   out first. Minting the id twice would be two answers to what a language id
   looks like. The loop is not superstition -- getTime() is a millisecond and
   a check can press a button twice inside one. */
function langMint(){
  var id='L'+(new Date()).getTime().toString(36), n=0;
  while(LANGS[id]){ n++; id='L'+(new Date()).getTime().toString(36)+n.toString(36); }
  LANGS[id]={ name:'', mine:true };
  return id;
}
/* A LANGUAGE THAT IS ONLY READ, in the index and nowhere else yet.
   ------------------------------------------------------------------
   The third place that writes to LANGS, and the first that has ever written
   `mine` false. The other two -- langMigrate() above and langMint() -- write
   true, which is why docs/DATA_MODEL.md said this state 「does not exist」:
   the switch that says a chapter may be taken away has been built more than
   once and the taking never was.
   「ダウンロードボタン押しても言語追加されないけど？」 OWNER 2026-09-01.

   ITS ID IS THE SERVER'S. Every other language is minted here and has no id
   anywhere else; this one already has one, and using it is what makes a
   second download of the same language ARRIVE IN THE SAME PLACE rather than
   making a second copy. That matters because a download is one chapter at a
   time -- 「いや一つづつdlでいいよ」 OWNER 2026-09-01 -- so the letters today
   and the keyboard tomorrow have to land in one language.

   `sid` is put on for the same reason it is put on a language of the
   person's own: it is the server's name for this thing. Nothing ever sends
   this one up -- netLangSync() refuses a language that is not yours -- so it
   is there to say where it came from.

   The NAME is only filled in if there is not one already: the row is made
   the first time a chapter is taken and a later download must not rename a
   language somebody is reading. */
/* AND IT CARRIES WHOEVER TOOK IT. A downloaded language is somebody else's
   language sitting in YOUR index -- `mine` false -- and dlCount() asks
   langOwned() to know whose index it is sitting in. Without the stamp it
   belongs to nobody, so it counts against no ceiling: a free plan could take
   as many chapters as it liked and the number at the foot of the list would
   go on saying nought. langNew() puts the same three lines on a language
   somebody MAKES; this is the reading side of it. */
function langSeenAdd(sid, name){
  var id=String(sid||'');
  if(!id) return '';
  if(!LANGS[id]) LANGS[id]={ name:String(name||''), mine:false, sid:id };
  else if(name && !LANGS[id].name) LANGS[id].name=String(name);
  if(!LANGS[id].uid && typeof SESS!=='undefined' && SESS && SESS.uid)
    LANGS[id].uid=String(SESS.uid);
  langStore();
  return id;
}
/* Whether a language is this person's OWN, asked of the index and answered
   for anything the index does not know as yes.

   Unknown is yes on purpose. Every language this app has ever made is in the
   index with `mine:true`, and the one thing that must never happen is a
   person's own language being treated as somebody else's -- that would take
   it out of their backup and out of sync, quietly, which is data loss wearing
   the shape of a plan check. The other way round is a copy of a published
   language not being backed up, which is what the owner asked for anyway
   (「入らん」). So the doubt falls toward yours. */
function langMine(id){
  var L=LANGS[String(id||'')];
  return !L || L.mine!==false;
}
/* AND THE OPEN LANGUAGE, ASKED BY EVERY WRITER OF ONE. True means the caller
   must stop -- upStop()'s shape, and for the same reason: a rule that lives in
   one place and is ASKED at each road that could break it.

   「dl言語はへんしゅうはできないってなんかいもいわせんなよ」 OWNER 2026-09-01,
   and 「編集不可でそのアカウントに切り替えたらダウンロードした人の言語が使える」
   OWNER 2026-09-02 -- a downloaded language is one you switch to and USE, and
   nothing in it is yours to change.

   langOpen()'s own comment has said since it was written that what protects a
   downloaded language is not a locked door but the WRITERS, and it named four.
   Three of those asked (ltStart, bkPush, netLangSync); the fourth was 「the row
   in the language list is not a button」, which is not a writer at all -- it is
   the door being shut. So SEVEN savers wrote somebody else's language without
   asking anything, and the only reason nothing was lost is that there was no
   way in. Opening the door is what made this line necessary.

   It asks the OPEN language and takes no argument on purpose: every one of
   those savers writes langKey(), which is the open language and nothing else.
   A saver given an id would be a second question. */
function langLocked(){ return !langMine(langId); }
/* Nothing here at all: a first run, or a first run after the migration found
   nothing to move. The person gets one empty language of their own. */
function langFirst(){
  langId=langMint();
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
/* Whether the Keychain ANSWERED, as against what it said. See the note under
   the branch below: this is what keeps a read that failed from being written
   down as `free`. A build with no native side, and every check under tools/,
   has no such thing and is not in this branch at all. */
var PLAN_READ_OK=(window.__planok!==0 && window.__planok!=='0');
if(PLAN_NATIVE){
  /* Empty means the Keychain has never been written -- a fresh install, or
     one that predates this and still has the plan in its settings. Both are
     answered the same way: take whatever is there and put it where it now
     belongs, once.

     AND EMPTY IS NOT THE ONLY WAY TO GET NOTHING. A read that FAILED came
     back as the same empty string, and this line answered it by writing
     `free` into the Keychain -- over a plan somebody had paid for, in the one
     place the plan lives. 「アップデートしたら勝手に無料プランになったんだけど？」
     OWNER 2026-09-02. CLAUDE.md's first page says it: 「Empty」 and 「broken」
     are different states and must not share a branch.

     `window.__planok` is the native side saying which it was --
     ios/App/App/LinguaPlan.swift § readPlan(). 0 is a read that failed, and
     the answer to that is to write NOTHING and leave what is there. The plan
     on screen falls back to the copy in the settings, which is the last one
     this phone knew; the Keychain keeps whatever it has.

     PLAN_READ_OK is the one place that answers it. Two roads write the plan
     down at boot -- this one and planMigrate() below -- and both have to ask,
     or the guard is on one door of two. */
  if(window.__plan) SET.plan=window.__plan;
  else if(PLAN_READ_OK) planKeep(SET.plan||'free');
  /* AND WHOSE IT IS, out of the same read. `window.__planuid` is the account
     that bought what `window.__plan` holds -- ios/App/App/LinguaPlan.swift --
     and it is seeded here for the same reason the plan is: planFor() is asked
     the moment net.js knows who is signed in, and that is one script tag
     later. An empty one is a phone that has never written an owner down, and
     planFor() answers that by changing nothing.

     Only when the Keychain ANSWERED. A read that failed says nothing about
     who owns this, and taking silence for 「nobody」 is how a plan gets handed
     to whoever signs in next. */
  if(PLAN_READ_OK) SET.planUid=String(window.__planuid||'');
  /* Whatever copy is still in the file goes out with the next save, which
     setOnDisk() below is what makes true. Taking it out here as well was
     written first and did nothing: the save that boot does anyway put it
     straight back, so the one place that decides is the save. */
}
/* ---- the tiers were renamed, and a saved word moved a rung ---------------
   Free / Basic / Plus until 2026-08-23, Free / Plus / Pro since.
   「ベーシック、プラスって名前どう思う？なんかどっちが上かわかりにくくない？」
   Basic reads as the name of a FREE tier in most apps, so Free and Basic were
   the confusable pair rather than Basic and Plus.

   The words moved: what was called Plus is Pro, and what was called Basic is
   Plus. A phone that already holds `plan: 'plus'` wrote it while Plus was the
   TOP tier, and reading it now would put somebody who had everything on the
   middle rung.

   So it is moved up, ONCE -- and once is the whole difficulty, because after
   this `plus` is a real middle tier and must be left exactly where it is.
   `SET.planV` says which of the two worlds a value was written in; nothing
   else can tell them apart, since both worlds spell it the same.

   Nobody had bought anything -- no product existed in App Store Connect on
   the day this ran -- so the only value this can find is one somebody set by
   hand on the plans screen, and moving it up gives them back what they had
   rather than more than they had.

   The Keychain holds the same word on a phone and is written again here, or
   the next launch would read the old one and this would have to run twice. */
/* NOT in setDefaults(). The defaults are laid down first and the saved file
   is laid over them, so a `planV` in the defaults is a `planV` every old
   install appears to have -- and an old install is exactly what this has to
   be able to recognise. Absent means "written before the rename", which is
   the only signal there is. A fresh install runs this once over `free`,
   changes nothing, and writes the mark. */
var PLAN_V=2;
function planMigrate(){
  if(SET.planV===PLAN_V) return;
  if(SET.plan==='plus') SET.plan='pro';
  if(SET.planWas==='plus') SET.planWas='pro';
  SET.planV=PLAN_V;
  /* The settings file, written straight, and NOT through save(). This runs
     while core.js is still loading -- it has to, because what a free plan
     looks like is decided on the first frame -- and save() opens with
     bkTouch(), which lives in backup.js and is not there yet. Calling it here
     throws, core.js stops at that line, and everything below it (CAN among
     them) is never defined: a white screen from a migration that was only
     ever meant to move one word. Found by migrate-check, which is the only
     check that reloads the page with an old file under it. */
  try{ localStorage.setItem(LS_S, JSON.stringify(setOnDisk())); }catch(e){}
  /* PLAN_READ_OK for the same reason the branch above asks it: on a launch
     that could not read the Keychain, `SET.plan` is the settings' copy, and
     writing that down would put a stale word over whatever the Keychain
     actually holds. The migration is not urgent -- it runs on the next launch
     that can read. */
  if(PLAN_NATIVE && PLAN_READ_OK) planKeep(SET.plan);
}
planMigrate();

/* Switch which language is open. Order matters: the language that is open
   when this is called has to be written out before langId changes, or its
   words end up saved under the language being switched to. */
function langOpen(id){
  if(!LANGS[id] || id===langId) return;
  /* AND IT DOES NOT REFUSE A LANGUAGE THAT IS ONLY READ, though the first
     version of this did. `tools/migrate-check.mjs` holds CLAUDE.md's rule 6 --
     「a language somebody already has still opens」 -- with a fixture whose
     second language is written `mine:false`, and a refusal here turned that
     check red on the one thing it says may never be shipped red.

     So what a downloaded language is protected by is not a locked door here.
     It is the WRITERS: ltStart() does not top one up, bkPush() does not put
     one in a backup file, netLangSync() does not sync one, and the row in the
     language list is not a button. Each of those is at the place that does
     the thing. docs/DATA_MODEL.md § A language that is only read. */
  save(); saveLetters(); saveNotes(); saveStg(); saveSnd(); saveKb(); saveWld();
  langId=id; langStore();
  langRead(); ltRead(); ntRead(); stRead(); sndRead(); ltStart(); kbRead(); migrateKbFree(); wldRead(); migratePostInk();
  /* and where you were standing in the old one is not a place in this one:
     a filter left on would hide most of a dictionary you have never seen. */
  viewReset();
  goTab('profile');
}
/* Another language, made and opened. 「アカウントが変わるイメージ。実際の sns
   はアカウント切り替えボタンあるやん？あれが言語切り替えになるって感じ」
   OWNER DECISION 2026-08-25: a language is an account and the list is the
   account switcher, so this sits at the foot of that list and nothing is
   asked first -- langFirst() already makes a nameless one and the onboarding
   already asks the name, so the second arrives the way the first did.

   The ceiling is asked HERE and not on the screen that draws the button,
   because the button is drawn on every plan: 「だいたい無料で使えないやつは
   表示させていいよ」 OWNER DECISION 2026-08-25. A door that is shown and a
   door that is open are two different sentences, and this is where the second
   one is answered.

   langOpen() does the rest and is untouched: it writes out the language being
   left, switches, reads the new one in and calls viewReset().

   AND IT IS STAMPED WITH WHOEVER IS PRESSING IT. 「1アドレス1アカウント」
   「これは絶対課金もアカウントごと言語もそう」 OWNER 2026-09-02: a language
   is the ACCOUNT's, so the account it is for goes on at the moment it is
   made. langForAcct() below does the same three lines for the same reason.

   Without them the stamp arrived only when netLangRow() had finished putting
   the language up, so a language made in a tunnel -- or one whose upload
   failed -- stayed account-less, and langOwned() reads an account-less
   language as belonging to NOBODY once the onboarding is over. The person who
   made it would not find it in their own list.

   langFirst() above is the one caller that stamps nothing, and that is not
   this hole: it runs before there is an account to name. The door is where
   what it made gets its account.

   AND THE ACCOUNT IS ASKED FOR BEFORE ANY OF IT. 「言語はアカウントないと
   作れないです」「ログインした人しか書けないけど」 has been in CLAUDE.md
   since 2026-08-26 with nothing standing in front of this button: the only
   thing here was the ceiling. makeNeed() (www/onboard.js) is the question the
   other four makers already ask -- a letter, a word, a grammar stage, a note
   -- and making a language is the fifth. It is asked FIRST, before the
   ceiling: what a ceiling is depends on the plan, and the plan is the
   account's.

   It answers true through the whole of the onboarding, where the walk makes
   a language before there is an account to make it for and the door is the
   step after. So this is one call and not a condition -- that file already
   holds which of the two moments this is, and re-stating it here would be
   the same sentence in two places. */
function langNew(){
  if(!makeNeed()) return;
  if(langStop()) return;
  var id=langMint();
  if(typeof SESS!=='undefined' && SESS && SESS.uid)
    LANGS[id].uid=String(SESS.uid);
  langStore();
  langOpen(id);
}

function save(){
  if(langLocked()) return;   /* somebody else's language: nothing is written to it */
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
/* What a plan is CALLED, for a sentence about it. `plan()` answers an id --
   `plus`, `pro` -- and an id is a name in a table, not a word to show
   somebody: the toast after a purchase said 「pro になりました」.
   The id where there is no such plan, which cannot happen and is not worth
   a second sentence. */
function planName(id){
  var i, k=String(id||'');
  for(i=0;i<PLANS.length;i++) if(PLANS[i].id===k) return PLANS[i].name;
  return k;
}
var PLANS=[
  {id:'free', name:'Free', mo:'plan.price.free', yr:'plan.price.free', off:'',
   lines:['plan.free.1','plan.free.2','plan.free.3','plan.free.4']},
  /* The middle rung. Its price is here and its subscription is not in App
     Store Connect yet, which is not a hole: StoreKit returns nothing for a
     product that does not exist, so the card is on the screen and the button
     does nothing until the product is made. What is NOT allowed is the other
     way round -- a product on sale that the app does not name. */
  {id:'plus', name:'Plus', mo:'plan.price.plus', yr:'plan.price.plus.yr', off:'17',
   lines:['plan.plus.1','plan.plus.2','plan.plus.3','plan.plus.4','plan.plus.5']},
  /* Pro opens with "everything in Plus, and:" rather than repeating the five
     lines above it. Three pages that each list everything are three pages
     somebody has to compare word by word; the ladder is the thing being sold
     and it should be readable by scrolling. */
  {id:'pro',  name:'Pro',  mo:'plan.price.pro', yr:'plan.price.pro.yr', off:'17',
   lines:['plan.pro.1','plan.pro.2','plan.pro.3','plan.pro.4','plan.pro.5',
          'plan.badge']},
];
/* Studio is not here. What it sold was the hosted model -- the conversation
   and the suggestions -- and the model is the last thing going in. A tier
   whose lines describe a thing the app cannot do yet is the app lying to
   somebody who is about to pay, which the paragraph above forbids, and a
   free allowance of three a day is that same lie with a meter on it.

   It comes back when the seam in www/glyph.js has something behind it, and
   what comes back with it is the chapter and the chips that were lifted out
   with it. Nothing was thrown away: it is in the history under this commit. */
/* How many words this plan may hold. A constant until today: free's hundred
   was the only ceiling there was, so the number and the plan were the same
   fact and FREE_LIMIT could be both. Plus has a thousand and Pro has none,
   which makes them three facts, and a number that is three facts is a
   function.
   「単語1000までとか」 -- OWNER DECISION, 2026-08-23.

   Infinity and not a big number: a ceiling nobody can reach is still a
   ceiling, and the arithmetic below is the same either way.

   FREE_LIMIT keeps its name. It is still exactly what it always was -- the
   free plan's hundred -- and renaming it to match its new neighbour would be
   a rename riding along inside a change of behaviour, which is the one thing
   a commit may not be two of. tools/fixture.mjs and tools/backup-check.mjs
   both name it, and neither is this session's file today. */
var FREE_LIMIT=100, PLUS_LIMIT=1000;
function wordCap(){
  if(can('words')) return Infinity;
  return has('plus')? PLUS_LIMIT : FREE_LIMIT;
}
/* How many keyboards this person may have, counting the fixed QWERTY as one
   of them. 「1,1+3.無制限って言わなかったっけ？」 -- OWNER DECISION,
   2026-08-23: free 1, plus 1 + 3, pro no ceiling.

   The same shape as wordCap() above and for the same reason: it was KB_MAX,
   a constant, which was one fact while there was one paid tier and is three
   facts now. A number that is three facts is a function.

   **It is a pool across languages**, and that is not this function's half of
   it -- kbCount() in www/keyboard.js is what counts, and it counts every
   language rather than the open one. The ceiling is on the person, not on
   each language: three languages would otherwise be nine keyboards on a plan
   that sells three.

   No capability is added for the ceiling. `CAN.kb` is the DOOR -- may this
   person lay a keyboard out at all -- and it opens at plus; how many is a
   number, and a capability that is really a number is a price with nothing
   behind it. Infinity and not a big number, exactly as wordCap(). */
var FREE_KB=1, PLUS_KB=4;
function kbCap(){
  if(has('pro')) return Infinity;
  return has('plus')? PLUS_KB : FREE_KB;
}
/* How many languages of their own this person may have. Free 1, Plus 1,
   Pro 3 -- OWNER DECISION 2026-08-23, restated 2026-08-25「言語数はプラスは1、
   プロは3」.

   Plus and Free are the same number and that is the decision, not an
   oversight: this app is for making ONE language deeply, and the three are
   for the person who wants a second and a third rather than the thing being
   sold. Written as two names anyway, because they are two facts that happen
   to be equal today and a number that is two facts is not a constant.

   Not Infinity anywhere: three is a real ceiling on every plan there is. */
var FREE_LANGS=1, PRO_LANGS=3;
function langCap(){
  return has('pro')? PRO_LANGS : FREE_LANGS;
}
/* And what it is compared against: the languages that are THIS PERSON'S.

   `mine` and not the length of LANGS, and the reason is about what is COMING
   rather than what is here. This comment used to say LANGS "also holds every
   language being read from somebody else", and it does not: the three places
   that write to LANGS -- langMigrate() and langMint() above, bkRestore() in
   backup.js -- every one of them writes `mine:true`, and nothing anywhere
   writes it false. There is no language in this app that is not the person's
   own, and there never has been. vLangs() draws a 「読んでいる」 list that is
   always the empty note, for the same reason.

   Counting `mine` is still right, and is right for the reason the old comment
   was reaching for: a language somebody else made is not one this person
   made, and a ceiling that filled up because you looked at somebody's work
   would be a punishment for using the app. That is also the shape the owner
   counted the downloads in -- 「自分の言語+DL言語1個」, two numbers and not one
   (OWNER DECISION 2026-08-25, docs/FEATURE_RULES.md). Whatever counts those is
   a second function beside this one; this one goes on counting `mine`.

   docs/DATA_MODEL.md § a language that is only read says what would have to
   exist first. */
/* Whether a language counts towards the ceiling of the account that is here
   NOW. 「じゃないとアカウント変えたら無限に言語作れるやん」 OWNER 2026-09-01.

   `mine` is about this PHONE -- a language you are making rather than one you
   are reading -- and it was the whole of the question while a phone was one
   person. `uid` is the account, and this is where the two are told apart.

   Signed out, nothing has an account to be compared with, so the count is
   what it always was. That is not a hole: a language cannot be made without
   one 「言語はアカウントないと作れないです」, and the onboarding's language
   is made before there is a door to have come through.

   An entry with NO `uid` counts for whoever is asking, which is the STRICTER
   of the two answers, and the direction is chosen rather than fallen into:
   the loose one is what the owner named, and a count that is too strict only
   ever refuses a NEW language. **It never REMOVES one.**

   A ceiling now shortens the LIST as well: 「減った時は隠すだけね」「だって
   単語でも文法でも同じようにやったじゃん」OWNER 2026-09-02, which replaces
   「never hides one, never shortens a list」 that stood here. It is
   wordsSeen()'s shape and always was for words -- the dictionary has listed
   the first hundred on the free plan since it had a free plan -- and
   langsSeen() in www/home.js is the same function for languages, with the
   open one always on it. NOTHING IS DELETED by any of it: `LANGS` is
   untouched, not one key under `lingua.` goes, the backup is the same file,
   and paying again lists every one of them exactly as they were. `dl-check`
   holds all of that. docs/DATA_SAFETY.md § a shorter list is not a deletion
   is what says it has to be SAID, and the count at the foot of the list is
   where it is said. */
/* WHOSE ACCOUNT a language is, and nothing else. Two questions used to be
   one function and they are not the same question: `mine` is about this
   PHONE -- a language you are making rather than one you are reading -- and
   `uid` is about the account. The keyboard pool asks only the second, and
   folding `mine` into it silently stopped counting a language that had never
   been given one. plan-check caught it: 「two more in ANOTHER language fill
   the plan up」 went green-to-red because the fixture's other language is
   `{nm:'Other'}` and says nothing about `mine`.

   AND A LANGUAGE WITH NO `uid` IS PICKED UP AT THE ONBOARDING DOOR AND
   NOWHERE ELSE. 「1アドレス1アカウント」「これは絶対課金もアカウントごと
   言語もそう」 OWNER 2026-09-02. It used to be read as belonging to whoever
   was asking, and that handed the last person's work to the next one: a
   language A made on this phone and never once put up became B's the moment
   B signed in -- the dictionary, the letters and the keyboard in it, listed
   as B's own, with nothing thrown.

   The onboarding is the one place something is made before there is an
   account to make it for, and the door is on the way out of it: obFinish()
   calls netLangSync() the moment somebody is through, which is where the
   account goes on. So the walk is the only moment a session may adopt what
   it finds, and `SET.done` is what tells the walk from the app -- the same
   question makeNeed() asks in www/onboard.js, in the same words, for the
   same reason.

   Everywhere else an unstamped language is NOBODY's. It is not deleted, not
   hidden from its own storage, not taken out of the backup file and not
   emptied: it stays in the index and in `lingua.<id>.*` exactly as it was,
   and the list at www/home.js counts it among the ones it is not showing.
   What changes is only that it is not offered to a person who did not make
   it. Languages made from 2026-09-02 all carry their account, so what this
   can reach is the ones already sitting on a phone that have never been up
   -- and handing those to the wrong person is the failure this exists to
   stop. `tools/acct-check.mjs` case 35 holds both halves. */
function langOwned(id){
  var L=LANGS[id], me;
  if(!L) return false;
  me=(typeof SESS!=='undefined' && SESS && SESS.uid)? String(SESS.uid) : '';
  if(!me) return true;
  /* A LANGUAGE BELONGS TO THE ACCOUNT ITS STAMP NAMES, and every language has
     one. 「アカウントごとに言語情報も違うんだって」 OWNER 2026-09-03.

     Every road that makes a language stamps it --
     langNew(), langForAcct(), langSeenAdd(), netLangsDown(), bkRestore(), and
     langMigrate() through `mig`. langFirst() is the one that cannot, because
     it runs before there is an account, and the door stamps what the walk
     made on the way out.

     So the only unstamped language is one being made in the walk right now,
     and `SET.done` is what says so -- the same question makeNeed() asks in
     www/onboard.js. Nothing here remembers the phone: 「端末ごとにやること
     なんてねえよ」 OWNER 2026-09-03, and a phone-shaped answer here is what
     put one person's language in another person's list.

     An unstamped language after the door is not this person's, and it is not
     deleted either -- it stays in the index, in
     storage and in the backup, and www/home.js counts it among the ones it is
     not showing. */
  if(!L.uid) return !SET.done;
  return String(L.uid)===me;
}
function langAcct(id){
  var L=LANGS[id];
  return !!(L && L.mine) && langOwned(id);
}
function langCount(){
  var n=0, id;
  for(id in LANGS)
    if(Object.prototype.hasOwnProperty.call(LANGS, id) && langAcct(id)) n++;
  return n;
}
/* The ceiling on languages, met. True means the caller must stop.

   capStop()'s shape, exactly, and that is an owner decision rather than a
   tidiness: 「全部確認して飛ぶ」 OWNER DECISION 2026-08-25. There are three
   ceilings in this app -- words, keyboards, languages -- and they now say the
   same thing the same way. This one was the odd one out for half a day: it
   went straight to the plans screen, which was the earlier decision of the
   same day read as being about this
   （「無料はタップすると課金ページに飛ばされる」）, and that decision is
   about a closed DOOR. A ceiling asks first.

   iOS's own dialog, and the reason is capStop()'s: it has to be answerable
   with "no", and a box of our own would be a shape this app chose for a
   question the phone already has a shape for. Nobody is moved unless they
   say yes.

   Except where there is nothing to fly to. Somebody already holding the
   biggest ceiling there is cannot be offered a bigger one, and a dialog whose
   yes leads to a price list that answers nothing is worse than a sentence --
   it is a screen with no cause and no way out, which is the ONE case
   CLAUDE.md's 2026-08-22 narrowing says gets words. It gets one sentence and
   nothing beyond it. `langCap() < PRO_LANGS` and not a plan name: the
   question is whether a bigger ceiling exists to buy, and that stays true the
   day the numbers move.

   Nothing here removes, hides or counts down anything. Somebody who already
   has more than this -- a plan that ended, a number that moved -- keeps every
   one of them, sees every one of them and backs every one of them up. Only
   the next one is refused. */
/* ---- and how many you may have DOWNLOADED, which is a second number ------
   「dlはしかもplusは1つproは3つ DL言語とmake言語でそれぞれ別の最大値ね？」
   OWNER 2026-09-02.

   TWO CEILINGS AND NOT ONE. A language somebody else made is not one this
   person made, and langCount() above says so already -- it counts `mine`, so
   a download has never touched the ceiling on making. This is the other side
   of that sentence: downloads have a ceiling of their own, and filling it
   leaves the making one exactly where it was.

   Free is ZERO, which is the same decision said a second way: 「plusからです」.
   Whether a download may happen AT ALL is `can('dl')`; this is how many. Both
   land together on purpose -- a door opened with no number behind it hands
   Plus whatever the code happened to allow, which is neither number the owner
   said, and that has happened here once already (the keyboard's).

   Nothing here removes, hides or counts down anything. Somebody who already
   has more than this -- a plan that ended, a number that moved -- keeps every
   one of them and reads every one of them. Only the next one is refused. */
var PLUS_DL=1, PRO_DL=3;
function dlCap(){
  if(has('pro')) return PRO_DL;
  return has('plus')? PLUS_DL : 0;
}
/* The languages this person is READING: in the index, not theirs, and on this
   account. langAcct() is the making side's question and this is its opposite
   half -- `mine` false rather than true, with the same account test, so
   signing in as somebody else does not hand you their downloads either. */
function dlCount(){
  var n=0, id;
  for(id in LANGS)
    if(Object.prototype.hasOwnProperty.call(LANGS, id) &&
       LANGS[id] && !LANGS[id].mine && langOwned(id)) n++;
  return n;
}
/* The ceiling on downloads, met. langStop()'s shape exactly, and the same
   sentence: 「全部確認して飛ぶ」. Somebody already holding the biggest ceiling
   there is gets one line and no dialog, because there is nothing to fly to. */
function dlStop(){
  if(dlCount()<dlCap()) return false;
  if(dlCap()<PRO_DL) popAsk(t('langs.full', dlCap()), function(){ go('plans'); });
  /* toast() and not alert(): iOS's own box is banned outright
     （「標準は使わねえって言ってるだろこれも禁止や」OWNER 2026-09-01）and
     there is nothing to ASK here -- somebody already on the top rung cannot
     be offered a bigger one, so what is left is the sentence. */
  else toast(t('langs.full', dlCap()));
  return true;
}
/* THE OPEN LANGUAGE BELONGS TO WHOEVER IS SIGNED IN.
   「ログアウトして違うアカウントでログインしても前のアカウント残ってるんだけど
   なんで？」「アカウントが違うんだから、そもそも残るのがおかしいだろって」
   OWNER 2026-09-02.

   Signing in swapped everything that is asked BY account and nothing that is
   held in a variable. `meFor()` parked the name, the face and the handle;
   `langAcct()` took the other account's languages off the list; `langId` was
   never touched. So somebody signed in as themselves and was standing in a
   language belonging to whoever used the phone before -- the dictionary, the
   letters and the keyboard on screen were that person's, while the switcher
   said 「N 件表示していません」 about them. Nothing threw.

   `mayMint` is the difference between the two moments this is asked. At the
   sign-in it is false: this account's languages may still be on their way
   down (netLangBack), and minting one there would leave an empty language
   beside the three that arrive a second later. When the fetch has finished it
   is true, and a phone with nothing of this account's on it gets a fresh
   language -- which is what a new account on a new phone gets anyway.

   It never deletes and never renames. The other account's language stays in
   the index, in storage, in its backup, and comes back the moment they sign
   in again -- which is `langAcct()`'s whole shape (docs/DATA_SAFETY.md). */
/* WHILE THIS ACCOUNT'S LANGUAGES ARE STILL COMING DOWN.
   「前の人の言語が出るくらいならローディング入れればいいやん」OWNER
   2026-09-02, and it is the right answer to the hole I left: the alternative
   was minting a language on the spot, which leaves an empty one beside the
   three that arrive a second later. Nothing is made and nothing of the
   previous account is shown -- the screen says it is waiting, and render()
   is what draws that (www/glyph.js). */
var LANG_WAIT=false;
function langForAcct(mayMint){
  var id;
  if(langAcct(langId)){ LANG_WAIT=false; return false; }
  for(id in LANGS)
    if(Object.prototype.hasOwnProperty.call(LANGS, id) && langAcct(id)){
      LANG_WAIT=false; langOpen(id); return true;
    }
  if(!mayMint){ LANG_WAIT=true; return true; }
  LANG_WAIT=false;
  /* AND IT IS STAMPED WITH WHOEVER IT IS FOR. langMint() leaves `uid` off,
     because it is also the onboarding's road and there is nobody to name
     there yet. Here there is: this language is being made because the phone
     held nothing of this account's, so it is that account's from the moment
     it exists. Unstamped it would be nobody's the instant `SET.done` is
     true -- the person would watch the language they were just given
     disappear. */
  var nid=langMint();
  if(typeof SESS!=='undefined' && SESS && SESS.uid)
    LANGS[nid].uid=String(SESS.uid);
  langStore();
  langOpen(nid);
  return true;
}
function langStop(){
  if(langCount()<langCap()) return false;
  if(langCap()<PRO_LANGS){
    popAsk(t('langs.full', langCap()), function(){ go('plans'); });
  }
  /* toast() and not alert(), for the reason written over dlStop() above. */
  else toast(t('langs.full', langCap()));
  return true;
}
function plan(){ return SET.plan||'free'; }
/* What of the settings goes to the file. Everything, except on a phone, where
   the plan is in the Keychain and a second copy in an editable file would be
   the copy that decides: the next save would put it back over the top. */
function setOnDisk(){
  var out={}, k;
  for(k in SET) if(Object.prototype.hasOwnProperty.call(SET,k)) out[k]=SET[k];
  if(PLAN_NATIVE) delete out.plan;
  /* AND WHO OWNS IT, for the same reason and it is the stronger one. The
     settings file is in the backup a phone makes onto a PC, so an owner
     written there is an owner anybody with a cable can put their own name in
     -- which is not a way to raise your own plan, it is a way to take
     somebody else's. On a phone the Keychain is the only copy; in a browser
     and in every check under tools/ there is no Keychain and this stays in
     the settings, exactly as the plan does. */
  if(PLAN_NATIVE) delete out.planUid;
  return out;
}
/* The settings, written on their own.

   save() is the LANGUAGE and the settings in one call, and it declines
   entirely when the language on screen is somebody else's -- langLocked() is
   its first line, and that is right: nothing may be written into a language
   this phone is only reading. It is wrong for a field that is nobody's
   language. SET.planPend is what the SERVER has not been told about the plan,
   and losing it because somebody happened to be reading a published language
   when their subscription ended is losing the only record there is.

   planMigrate() above already writes this key straight, for its own reason,
   so this is that line with a name on it rather than a new road. */
function setKeep(){
  try{ localStorage.setItem(LS_S, JSON.stringify(setOnDisk())); }catch(e){}
}
/* Written down when somebody has just changed it, and not waited for. What
   this session uses is the value in memory; a Keychain that refused the write
   is a phone that answers with the old plan at the next launch, and the old
   plan is the free side of wrong on an upgrade -- which is the side the rule
   in docs/PAID_FEATURES.md asks for, and which StoreKit corrects the moment
   it is asked again. */
/* Capacitor.nativePromise, and not Capacitor.Plugins.

   This asked Capacitor.Plugins for LinguaPlan and returned quietly when it
   was not there, and it was never there: Plugins is filled by @capacitor/core,
   which is an npm package an app with a bundler imports, and there is no
   bundler here. www/share.js says the same thing at length and cost four
   builds to learn. So every write was the `if(!p) return` and the Keychain
   was never written.

   That was not a quiet failure. setOnDisk() takes the plan OUT of the
   settings file on a phone, precisely because the Keychain is meant to be
   holding it -- so on a real device nothing held it at all and Plus came back
   as free at the next launch. In a browser PLAN_NATIVE is false, the plan
   stays in the file, and none of this is visible, which is why every check
   passed.

   Not waited for, as before: what this session uses is the value in memory. */
/* AND WHOSE IT IS GOES WITH IT, when there is somebody to name. 「1アドレス
   1アカウント」「これは絶対課金もアカウントごと言語もそう」 OWNER 2026-09-02.

   Here rather than at the four call sites because this is the one place a
   plan is written down on a phone -- the plans screen, a receipt, the boot
   migration, and the account's own answer coming back all end here -- so the
   owner is recorded wherever the plan moves and nowhere else.

   With no session the uid is left OUT of the message rather than sent empty,
   and LinguaPlan.swift then leaves the owner it already has alone. The two
   callers with nobody signed in are both at boot, and neither of them knows
   anything about an account: writing '' there would erase the owner on every
   launch, which is the failure this whole chapter is about arriving through
   the door built to stop it. */
function planKeep(id){
  var np=window.Capacitor && Capacitor.nativePromise,
      me=(typeof SESS!=='undefined' && SESS && SESS.uid)? String(SESS.uid) : '',
      msg={plan:String(id||'free')};
  if(me) msg.uid=me;
  if(!np) return;
  try{ np('LinguaPlan', 'write', msg)['catch'](function(){}); }catch(e){}
}
/* WHOSE PURCHASE THE PLAN ON THIS PHONE IS, asked the moment there is an
   account to ask about. 「Xは違うアカウントだと課金も引き継がれない」 OWNER
   2026-09-02.

   The plan arrives before the account does and it has to: window.__plan is a
   script injected ahead of this file, because what a free plan looks like is
   decided on the first frame, and there is no session at that point -- net.js
   is four script tags later. So the two are put together HERE instead, from
   www/net.js, at the two moments a uid becomes known: netRead(), which is the
   session this phone was already holding, and netTook(), which is one
   arriving. meFor() and langForAcct() are in netTook() for the same reason.

   Three answers, and the middle one is the one to read twice.

   THE SAME PERSON -- nothing to do. This is every ordinary launch and every
   token refresh.

   NOBODY WRITTEN DOWN YET -- record the name and MOVE NOTHING. An empty
   SET.planUid is a phone from before the Keychain held an owner, and what
   that plan is today is what this app has always said it is: the plan of
   whoever is on this handset. Writing that answer down changes nobody's plan
   and takes nothing from anybody; it only means tomorrow's question has an
   answer. **What to do with an unstamped PAID phone is not settled and is
   not decided here** -- docs/scope/claude-planacct.md lays out the two
   directions and what each costs. This is the direction that changes nothing,
   which is the one a session may take on its own. CLAUDE.md § Deciding.

   SOMEBODY ELSE BOUGHT IT -- start from free and let the account answer.
   netPlanSync() reads this account's own row a moment later and raises it to
   whatever they hold. Nothing is taken away from the person who DID buy it:
   the Keychain is not written here, so their plan and their name are still in
   it, and the launch they come back on reads them out again.

   SET.planWas MOVES WITH IT, and that is load-bearing rather than tidy.
   capLapse() runs at the foot of www/boot.js, synchronously, and compares the
   plan against the last one this phone saw. Left where it was, it would read
   pro -> free as 「the subscription ended」 and do the two things that answer
   is for: show the sheet that says so, against a plan this person never had,
   and send `free` to THEIR row on the server -- writing somebody else's
   cancellation onto an account that never bought anything. Moved together,
   there is nothing for it to notice.

   setKeep() and not save(): save() opens with bkTouch(), and netRead() runs
   at the moment www/net.js loads, which is three script tags before
   www/backup.js exists. It is also the right call on its own terms -- save()
   declines while the language on screen is somebody else's, and none of these
   three fields is anybody's language. */
/* THE FIELDS OF `SET` THAT ARE AN ACCOUNT'S AND NOT THIS HANDSET'S.
   「端末ごとにやることなんてねえよ」「アカウントごとってずっと言ってるよな？」
   OWNER 2026-09-03.

   The theme and the interface language are how this phone is set up. These
   six are what a PERSON has: what they pay, what the plan was last time so a
   lapse can be noticed, a plan the server has not been told about yet, the
   searches they starred, whether those have gone up, and how far down their
   notices they have read. Signing in as somebody else and finding any of them
   is finding somebody else's belongings. */
var SET_ACCT=['plan','planWas','planPend','saved','savedUp','notAt'];
function setParkKey(uid){ return LS_S + '.' + String(uid||''); }
/* Parked, not cleared -- the same shape as meFor() and postFor(). Signing
   back in brings them all to the screen again. */
function setFor(uid){
  var me=String(uid||''), was=String(SET.planUid||''), park, got=null, i, d;
  if(was===me) return false;
  if(was){
    d={};
    for(i=0;i<SET_ACCT.length;i++) d[SET_ACCT[i]]=SET[SET_ACCT[i]];
    try{ localStorage.setItem(setParkKey(was), JSON.stringify(d)); }catch(e){}
  }
  if(me){
    try{ park=localStorage.getItem(setParkKey(me)); }catch(e){ park=null; }
    if(park){ try{ got=JSON.parse(park); }catch(e){ got=null; } }
  }
  /* Nobody was written down: what is here is this person's, the way meFor()
     adopts an unclaimed copy. Only on the way IN. */
  if(was){
    for(i=0;i<SET_ACCT.length;i++){
      if(got && got[SET_ACCT[i]]!==undefined) SET[SET_ACCT[i]]=got[SET_ACCT[i]];
      /* Absent and not undefined: a field this account has never written is a
         field it does not have, and setDefaults() answers for it everywhere
         else. `plan` is named because free is a value and not an absence. */
      else if(SET_ACCT[i]==='plan') SET.plan='free';
      else if(SET_ACCT[i]==='planWas') SET.planWas='free';
      else delete SET[SET_ACCT[i]];
    }
  }
  SET.planUid=me;
  setKeep();
  return !!was;
}
function planFor(uid){
  if(!String(uid||'')) return false;
  return setFor(uid);
}
/* The plans, cheapest first. The ORDER is what makes a ladder a ladder, and
   it is written down once: a level is met by the plan that names it and by
   every plan above it. 「ベーシックは自分の文字と自分のキーボード、プラスは
   全部と広告なし」 -- OWNER DECISION, 2026-08-23, docs/FEATURE_RULES.md.

   The middle rung is DECIDED and is not on sale: the plans screen sells Free
   and Pro, because Plus's price is in no language file yet and no
   subscription for it exists in App Store Connect. What is here is the rung
   -- so the day a receipt says `plus`, every door in the table below is
   already the right way round.

   The names were Basic and Plus until 2026-08-23. 「ベーシック、プラスって
   名前どう思う？なんかどっちが上かわかりにくくない？」 -- Basic reads as the
   name of a FREE tier in most apps, so Free and Basic were the confusable
   pair rather than Basic and Plus. Free < Plus < Pro needs nobody told. */
var PLAN_ORDER=['free', 'plus', 'pro'];
/* The better of two plans, and the same sentence LinguaStore.swift's best()
   is -- 「段が二つ見えたときの答えは上の段」. Two copies of a ladder is how
   the two sides of a bridge come to disagree about which plan is better, so
   the rule is written the same way on both.

   It is asked when the phone and the SERVER disagree, which they can: a
   purchase made on another device, a phone that has been offline, a plan
   written before it belonged to an account. A plan nobody has heard of is
   not a plan and reads as free -- a Keychain that answered nothing, a row
   somebody edited. */
function planBest(a, b){
  var ia=PLAN_ORDER.indexOf(a), ib=PLAN_ORDER.indexOf(b);
  if(ia<0) ia=0;
  if(ib<0) ib=0;
  return (ia>=ib)? PLAN_ORDER[ia] : PLAN_ORDER[ib];
}
function has(level){ /* level: 'plus' | 'pro' */
  var want=PLAN_ORDER.indexOf(level), got=PLAN_ORDER.indexOf(plan());
  /* A plan nobody has heard of is not a plan. It is a Keychain that answered
     nothing, a receipt that would not validate, a settings file somebody
     edited -- and the free side is the side to be wrong on. */
  if(got<0) return false;
  /* And a level nobody has heard of is a typo in CAN. can() has already
     thrown on the capability by the time this runs; this is the second wall
     and it stands the same way round. */
  if(want<0) return false;
  return got>=want;
}
/* What money buys, one capability at a time, and the only place that says so.
   Eleven names, each the level it needs.

   It said ten. A count written into a comment goes stale the next time the
   list below it grows, so do not trust this one either -- `npm run dead`
   prints the number it actually counted on every run ("what money buys: N
   capabilities in CAN"), and that is where this eleven came from rather than
   from counting by eye.

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

   'words' is metered rather than shut, and what it names is the ceiling being
   LIFTED: free counts to a hundred, basic to a thousand, and only plus has no
   number at all. wordCap() below is the number and asks this once. */
var CAN={
  words:   'pro',    /* no ceiling on the dictionary at all -- see wordCap() */
  /* CSV out. It said "CSV out, and the cloud", and the cloud half was never
     true here: can('data') is asked twice, both in settings.js and both about
     the CSV. The cloud is on EVERY plan -- 「クラウドは全員で」 2026-08-22,
     「基本は全部サーバー管理」 2026-08-26 -- and netLangSync() asks nothing
     about a plan before it runs, which is the head of docs/PAID_FEATURES.md:
     a plan decides what may be DONE, and a language existing is not something
     anybody does. Do not turn this comment back into a gate. */
  data:    'pro',
  file:    'pro',    /* a list brought in as a file rather than a paste */
  letters: 'plus',   /* adding, naming and deleting a letter */
  wsys:    'plus',   /* a writing system that is not an alphabet */
  /* A keyboard of your own, laid out key by key, instead of the fixed QWERTY.
     The DOOR only: how many is kbCap() above, and the two landed together on
     purpose -- a door opened without its number would have handed plus the
     three the old KB_MAX gave out, which is neither number the owner said.
     「1,1+3.無制限って言わなかったっけ？」 */
  kb:      'plus',
  /* Taking a chapter of somebody else's language. 「plusからです」OWNER
     2026-09-02, which replaces 「Downloading a keyboard or an alphabet is
     free」 (docs/FEATURES.md § 4, 2026-08-19). How many is dlCap() above, and
     the two landed together -- see the comment there for why. */
  dl:      'plus',
  snd:     'plus',   /* choosing a sound, rather than taking the letter's own */
  /* Editing a post you have already sent. 「ツイートの編集も課金から」
     「課金からはベーシックからってことね プラスならプラスっていうから」
     OWNER DECISION 2026-08-23. postEdit() asked nothing about a plan until
     this landed -- anybody could edit their own post -- so this is the one
     capability here that TAKES something away rather than opening a door
     nobody had. Nothing edited is un-edited by it: the refusal is on the
     press, and every post already changed stays changed. */
  edit:    'plus',
  /* The mark beside your name. 「バッチはplusから」 -- Plus in the old three
     names, which is Pro in these. postBadge() already showed it only there
     and read plan() to find out, which is the one thing this table is here
     to prevent -- a plan name written into a screen is a question nobody can
     move between rungs without finding every place that asked it. */
  badge:   'pro',
  gram:    'pro',    /* a grammar stage of your own, past the fifteen there are */
  dir:     'pro'     /* choosing which way the language is written */
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
  return WORDS.length+(add||1)<=wordCap();
}
/* The ceiling, met. True means the caller must stop.

   This used to be `go('plans'); toast(...)` written out at each of the four
   places that add a word, and the go() was the problem: somebody halfway
   through typing a word had the screen taken off them and was put on a price
   list. The ceiling is the app taking something away, so it is one of the
   places that has to say so in words -- but it can say so without moving
   anybody.

   confirm() and not a box of our own: the plans screen is one tap away and
   this has to be answerable with "no". It is the same dialog wipeAll() asks
   with, it is drawn by iOS, and it is therefore not a shape this app chose.

   Two strings that already exist, in all ten languages, rather than an
   eleventh: the sentence the toast said, and the word on the upgrade button.
   A new key here would have been one sentence in English and nine holes. */
function capStop(add){
  if(capOK(add)) return false;
  popAsk(t('toast.cap', wordCap()), function(){ go('plans'); });
  return true;
}
/* THE SAME THING FOR A CAPABILITY, AND IT IS WHY EVERY PLAN SEES ONE SCREEN.
   「無料でもplusでもproでも同じ画面なのよ。でも無料から文字を足すところは
     課金のポップが出ないといけない、画面は変わらないプランで押す場所に
     よっては課金を促すって話なの」
   「音もキーボードも単語も+を押したらそのまま課金のポップが出るだけでしょ？
     増やすを潰す」 OWNER 2026-09-01.

   The screens used to DROP what a plan could not use -- `can('letters')` sat
   in the markup and the + was simply not drawn. That is the app hiding what
   it sells from the person it is selling to, and it made the free screen a
   different screen rather than the same screen with a door on it.

   So: the fullest face is always drawn, and the ceiling is met on the PRESS.
   Same shape as capStop() above and for the same reasons -- confirm() rather
   than a box of our own, because the plans screen is one tap away and this
   has to be answerable with "no"; and nobody is moved off the screen they
   are standing on unless they say yes.

   ONE sentence and not one per capability. Twelve keys in ten languages is
   a hundred and twenty strings saying the same thing, and 「アプリ内に説明
   書くの禁止」 is the other half of the argument: what somebody needs at the
   moment they press is that this is on a paid plan and where to go, which is
   two facts and not a paragraph about letters.

   THE APP'S OWN SHEET AND NOT iOS's DIALOG. 「正直自前のpopがいいんだけどな。
   iPhoneのやつ使ってるsnsないしな」 OWNER 2026-09-01. openForm() is a SCREEN
   (`go('form', key)`), not a thing that slides up in place of one, so it is
   not the shape CLAUDE.md § Shape forbids -- and the keyboard's + already
   opens exactly this, so the other doors are being brought to it rather than
   a second thing being invented.

   No corner, no border, no panel: the title is the form's own and the body is
   one line of text and one `.btn.ghost`, which is what CLAUDE.md § 18 leaves
   when a box is not allowed. Pressing the back arrow is the "no".

   IT TAKES THE ANSWER AND NOT THE NAME. `can()` may only be given a literal
   (CLAUDE.md § 5, and dead-check refuses anything else) -- a capability read
   from a variable cannot be held by any check and a wrong one reads as free
   rather than throwing. So the caller writes `upStop(can('letters'))` and the
   name stays where a check can see it. */
function upStop(ok){
  if(ok) return false;
  popAsk(t('up.need'), function(){ go('plans'); });
  return true;
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
  /* AND THE ACCOUNT IS TOLD, from here, because here is the one place that
     knows the plan MOVED. 「課金とアカウントとキーボードはアカウントに
     結びつく」 OWNER 2026-09-01.

     This function's own comment in www/store.js already says why it is the
     one: 「capLapse() compares against the plan it last saw, so it does not
     care whether the change came from a button, a receipt or a lapse.」
     Every road that changes a plan ends here -- setPlan() on the plans
     screen, storeTook() with Apple's answer in hand, and a lapse noticed on
     launch -- so putting the send anywhere else would be putting it in two
     or three places and missing the fourth.

     Fired and not waited for. A phone with no signal has still changed
     plan, and netPlanSync() on the next launch is what makes a send that
     never arrived correct itself. */
  netPlanUp(now);
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
