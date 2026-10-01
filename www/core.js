/* Lingua — what gets stored, the plans, the theme, the phonology, and the
   registry every language file reports into
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it. */

/* =========================================================================
   0. What gets stored
      A language lives on the server (CLAUDE.md rule 22): its slices are
      `slice` rows, and on this phone they are in memory -- LSL, keyed
      `lingua.<id>.<slice>` by langKeyOf(), with a read-only picture
      `lingua.<id>.<slice>.got` for a launch with no signal.
      Everything in here is something the person wrote themselves.
      There is no starter dictionary, on purpose.

      What is on the disk is the account's, filed under its uid (§ ACCT):

        lingua.langs.<uid>         which languages this account had when the
                                   server last answered -- a picture, counted
                                   by nothing (langCount asks the server)
        lingua.cur.<uid>           which one is open
        lingua.set.<uid>           this account's settings
        lingua.set                 this handset's own setup (SET_PHONE)
        lingua.sess                which account this phone is

      Everything a screen reads is still a single global: WORDS is the open
      language's dictionary, not a table of every language's. The app shows
      one language at a time, because you are either writing yours or reading
      somebody else's, and 290-odd places say WORDS meaning "the one in front
      of me". They still do.
   ========================================================================= */
var LS_LANGS='lingua.langs', LS_CUR='lingua.cur', LS_S='lingua.set';
/* The session is not something anybody has: it is which account this phone
   is (CLAUDE.md § Online), so it is filed under no uid and no language. */
var LS_SESS='lingua.sess';
var SESS=null;
function sessRead(){
  SESS=null;
  try{
    var s=JSON.parse(localStorage.getItem(LS_SESS)||'null');
    if(s && s.rt) SESS=s;
  }catch(e){}
}
sessRead();
/* WHO THIS IS -- the account's uuid, or '' with nobody signed in. The one
   place anything outside the session's own functions learns it (r73 § 2-5). */
function netUid(){ return (SESS && SESS.uid) || ''; }
/* ---- WHAT AN ACCOUNT HAS ON THIS PHONE, IN ONE PLACE ---------------------
   「端末ごとにやることなんてねえよ」「アカウントごとってずっと言ってるよな？」
   OWNER 2026-09-03, and CLAUDE.md § Online: 「a thing that cannot answer
   『which account』 is a thing that must not be written down」.

   ONE SENTENCE (r73 § 2-7): what is written on this phone carries the uid
   AT THE MOMENT IT IS WRITTEN; what carries none is read by nobody and
   becomes nobody's; and what an account has in memory is in ONE container
   that is swapped by one call.

   It used to be three mechanisms with one hole each. Every thing had a LIVE
   key with no owner on it (`lingua.me`, `lingua.posts`, `lingua.drafts`,
   `lingua.langs`, the account's fields of `lingua.set`) and a PARKED copy
   under `…<uid>`, and a function per thing (meFor, postFor, setFor) moved one
   into the other when the account changed -- and each of those, finding a
   live copy with nobody's name on it, ADOPTED it for whoever was signing in.
   A phone carrying a copy from before the stamp gave it to the first person
   through the door; measured (r73 § 2-7), an old unstamped language went up
   as that person's, published. And signing out was ten lines of 「and forget
   this too」 in netOut(), a list somebody had to remember to add to, and
   one was missed (r73 § 1-3).

   So there is no live key and nothing to move. The key a thing is written
   under IS `lingua.<name>.<uid>` of the account holding it (acctPut), so the
   answer to 「whose」 is on it from the first byte, and switching accounts is
   reading the other account's key (acctFor). With nobody signed in nothing is
   written at all: the only thing in memory with no owner is what the walk
   made before the door, and the door gives it to the account arriving -- the
   one exception CLAUDE.md § Online names -- filling in only what that account
   does not already have.

   ACCT is the container: each file that holds something of an account's
   registers it BESIDE its own global, at load -- acctKeep() for what is
   written down, acctMem() for what is only remembered -- so a thing added
   tomorrow is swapped tomorrow, and netOut() is one line. */
var ACCT_UID=netUid();
var ACCT=[];
function acctKey(name, uid){ return 'lingua.' + name + '.' + String(uid||''); }
function acctRaw(key){
  var r=null;
  try{ r=localStorage.getItem(key); }catch(e){ r=null; }
  if(r===null) return null;
  /* An older version wrote `lingua.cur` bare, not as JSON. */
  try{ return JSON.parse(r); }catch(e){ return r; }
}
/* Written under the account in hand, or not written. A write that does not
   land (a full phone) throws to the caller, whose saveTry() says so -- the
   one place that answers it (§ saveTry). Nobody signed in is not a failure:
   it is the walk, whose things live in memory until the door (CLAUDE.md
   § Online). */
function acctPut(name, v){
  if(ACCT_UID) localStorage.setItem(acctKey(name, ACCT_UID), JSON.stringify(v));
}
/* Something written down. `now()` is what memory holds, `got(v)` puts `v` in
   memory (`null` is 「this account has none」). `old` is the key an older
   version wrote it under with no owner on it, and `pick(v, uid)` is what of
   that belongs to the account the old stamp names -- acctMoved() below. */
function acctKeep(name, now, got, old, pick){
  var e={ name:name, now:now, got:got, old:old||'', pick:pick||null };
  ACCT.push(e);
  acctMoved(e);
  got(ACCT_UID? acctRaw(acctKey(name, ACCT_UID)) : null);
}
/* Something only remembered: an answer the server gave this account. */
function acctMem(forget){ ACCT.push({ forget:forget }); }
/* THE ONE SWITCH. netTook() when a session arrives, netOut() when it goes.

   From nobody to somebody is the door, and what memory holds then is the
   walk's (nothing ownerless is ever read from the disk, so there is nothing
   else it could be): the account's own comes first and what the walk made
   fills what it lacks, and the result is written under the account. Any other
   change reads the arriving account's own and nothing of the last one's. */
function acctFor(uid){
  var me=String(uid||''), door=!ACCT_UID && !!me, i, e, v;
  if(me===ACCT_UID) return false;
  ACCT_UID=me;
  for(i=0;i<ACCT.length;i++){
    e=ACCT[i];
    if(e.forget){ e.forget(); continue; }
    v=me? acctRaw(acctKey(e.name, me)) : null;
    if(door){ v=acctFill(v, e.now()); saveTry(function(){ acctPut(e.name, v); }); }
    e.got(v);
  }
  return true;
}
/* The account's own, with what the walk made where the account has nothing.
   An object is filled key by key and a list is the account's if it has one:
   nothing the account had is written over -- a copy that wins is how a copy
   destroys somebody's work (docs/DATA_SAFETY.md). A single value is not
   something anybody made -- it is WHERE somebody is standing (`cur`) -- and
   the walk's is where they are now: the language they have just made. */
function acctFill(mine, walk){
  var out, k;
  if(walk===null || walk===undefined || walk==='' ||
     (typeof walk.length==='number' && !walk.length)) return mine;
  if(typeof walk!=='object') return walk;
  if(mine===null || mine===undefined || mine==='' ||
     (typeof mine.length==='number' && !mine.length)) return walk;
  if(typeof mine!=='object' || typeof mine.length==='number') return mine;
  out={};
  for(k in walk) if(Object.prototype.hasOwnProperty.call(walk, k)) out[k]=walk[k];
  for(k in mine) if(Object.prototype.hasOwnProperty.call(mine, k)) out[k]=mine[k];
  return out;
}
/* ---- WHAT AN OLDER VERSION LEFT WITH NO OWNER ON IT ----------------------
   The live keys above carried their owner in ONE place: `acct` inside
   `lingua.set` (「which account's things are live on this handset」), and
   what it named was theirs. That is COPIED, once per thing, to that account's
   own key -- and nothing is removed: the old key stays byte for byte and is
   never read again. What no stamp names is nobody's and is neither read nor
   removed (「読まない、消さない」 OWNER 2026-09-03, and 2026-09-23
   「そもそもアプリ公開されたの昨日だから必要ない」).

   The live key is the newest of that account's copies, so it is copied OVER
   the account's parked one: the old switch read a park back when the account
   returned and left it standing, stale, and would itself have written over
   it at the next sign-out. Once per thing, marked in `acctMoved`
   (SET_PHONE), because the second time the account's own key is the newer.
   Deleting that account takes the old keys its stamp names (lsWipeAcct). */
function acctOld(){
  var s=acctRaw(LS_S);
  return (s && typeof s==='object')? String(s.acct||'') : '';
}
function acctMoved(e){
  var raw=acctRaw(LS_S), who, v;
  if(!e.old || !raw || typeof raw!=='object' || !raw.acct) return;
  who=String(raw.acct);
  if(!raw.acctMoved || typeof raw.acctMoved.length!=='number') raw.acctMoved=[];
  if(raw.acctMoved.indexOf(e.name)>=0) return;
  v=acctRaw(e.old);
  if(v!==null && e.pick) v=e.pick(v, who);
  /* saveTry() answers for whether it landed (§ saveTry); a write that did not
     leaves no mark, so the next launch copies it again. */
  saveTry(function(){
    if(v!==null && v!==undefined) localStorage.setItem(acctKey(e.name, who), JSON.stringify(v));
    raw.acctMoved.push(e.name);
    localStorage.setItem(LS_S, JSON.stringify(raw));
  });
  /* and in memory, or the next setKeep() writes the mark from before this */
  SET.acctMoved=raw.acctMoved.slice();
}
/* Everything this app has ever written, and it is NOT a list.

   「アカウント削除で残るものねえって言ってんだろ何回言わせんだよ全部消えんだよ。」
   OWNER 2026-08-27 -- and the reason it had to be said again is one bug, not
   several. wipeAll() used to name the keys it removed, so every key added
   after it was written stayed behind: the drafts, the posts, the person's
   name and face, and the index of languages. Nothing threw. Somebody deleted
   their account and the app still greeted them by name.

   So the keys are COUNTED rather than named. A key added tomorrow is gone the
   day it is added, and there is nothing to keep in step. `SLICES` below is no
   longer part of this: it is what goes UP (netSaveNow, netLangSync) and what
   deleting one language walks (wipeLangsGo).

   The prefix is exact and includes the dot. `lingua` on its own, and anything
   starting `linguaX`, belong to somebody else -- this is a shared storage and
   a wipe that took a neighbour's key would be the one mistake here that
   cannot be undone.

   Two passes, because removeItem() renumbers the keys under localStorage.key()
   and a single loop skips every second one. */
/* ONE ACCOUNT'S THINGS, and nothing else's.
   「別アカウントでログインしてそれのアカウント削除したら、俺の元のアカウントが
   消えてんだよ」 OWNER 2026-09-03.

   Deleting an account emptied the whole `lingua.` namespace, and that was RIGHT when it was written on 2026-08-27,
   when a phone held one account and 「アカウント削除で残るものねえ」 had no
   other reading. Then everything became the ACCOUNT's -- the plan, the
   languages, the posts, the settings -- and nothing went back to read the one
   function that erases. The app's meaning moved and the deletion's did not.

   Returns the language ids it took. */
function lsWipeAcct(uid){
  var me=String(uid||''), ids=[], doomed=[], id, i, k, j, pre, idx, took;
  /* WHOSE, AND IT IS TWO QUESTIONS. A language this account WROTE is
     `language.owner` (langOwnOf), and one it TOOK is a `language_take` row
     (langTookHas) -- two facts that `LANGS[id].uid` used to answer with one
     field, which is what came apart the day a language moved between people.
     Both go: the account is being deleted, and its copies of what it pulled
     down are as much its own as what it wrote. */
  /* WHICH LANGUAGES, ASKED OF THIS ACCOUNT'S OWN INDEX -- `lingua.langs.<uid>`
     and `lingua.take.<uid>` (§ ACCT) -- and not of what memory holds. The
     session has usually ENDED by the time this runs (netEndMe signs out the
     moment the server answers, and signing out empties memory), so reading
     LANGS found nothing and left every language of a deleted account on the
     phone (measured, acct-check 48, r79). */
  idx=acctRaw(acctKey('langs', me)) || {};
  took=acctRaw(acctKey('take', me)) || [];
  if(me && ACCT_UID===me)
    for(id in LANGS) if(Object.prototype.hasOwnProperty.call(LANGS, id)) idx[id]=LANGS[id];
  for(id in idx)
    if(Object.prototype.hasOwnProperty.call(idx, id) &&
       (langOwnOf(id)===me || took.indexOf(id)>=0 ||
        (ACCT_UID===me && langTookHas(id)))) ids.push(id);
  /* EVERYTHING FILED UNDER THIS LANGUAGE, COUNTED RATHER THAN NAMED -- which
     is the same rewrite the uid half of this function was given below, one
     level in.

     It walked `SLICES` and took each slice, its `.was` and its `.got`. Every
     key added after that loop was written therefore stayed on the phone, and
     four of them were: `name`, `wsys`, `owner` and the pictures slGot() keeps
     beside them. Those are COLUMNS OF THE `language` ROW rather than slices
     (§ langNameOf, § langWsysOf, § langOwnOf, 2026-09-08 and 09), so they were
     never in `SLICES` and nobody remembered them here. Measured on 2026-09-11:
     an account deleted with the server left holding `users=0 profile=0
     language=0 slice=0`, and `lingua.<id>.name.got` and two
     `lingua.<id>.owner.got` still on the handset. 「アカウント削除で残るもの
     ねえって言ってんだろ何回言わせんだよ全部消えんだよ。」 OWNER 2026-08-27,
     and it is the same bug that sentence was said about: **a list of keys,
     written by hand, that nobody remembered to add to.**

     So there is no list. `lingua.<id>.` -- the dot included, so one id is
     never the head of another's -- is what a thing of this language's IS, in
     memory and on the disk alike, and a key written under it tomorrow is taken
     the day it is written. The disk ones join `doomed` and go out in the one
     pass below. */
  for(i=0;i<ids.length;i++){
    pre='lingua.'+ids[i]+'.';
    for(k in LSL)
      if(Object.prototype.hasOwnProperty.call(LSL, k) && k.indexOf(pre)===0)
        delete LSL[k];
    try{
      for(j=0;j<localStorage.length;j++){
        k=localStorage.key(j);
        if(k && k.indexOf(pre)===0) doomed.push(k);
      }
    }catch(e){}
    delete LANGS[ids[i]];
  }
  /* AND EVERY OTHER KEY THIS ACCOUNT PUT ITS NAME ON, counted rather than
     listed. This asked for three prefixes by hand -- `lingua.me.`,
     `lingua.posts.`, `lingua.drafts.` -- and `lingua.set.<uid>`, the parked
     settings, was the fourth and was not among them. A key whose last part is
     an account's name IS that account's; there is nothing else it could be,
     and a fifth parked thing is taken the day it is written.

     Only when there is a name to match. With no session the uid is '', and a
     key ending in nothing is not a key of nobody's -- it is every key with a
     trailing dot, which is the sweep that took a neighbour's language. */
  if(me) try{
    for(i=0;i<localStorage.length;i++){
      k=localStorage.key(i);
      if(!k) continue;
      if(k.indexOf('lingua.')===0 && k.slice(k.lastIndexOf('.')+1)===me)
        doomed.push(k);
    }
  }catch(e){}
  /* AND WHAT AN OLDER VERSION LEFT FOR THIS ACCOUNT WITH NO OWNER ON THE KEY
     ITSELF -- the live keys `lingua.set`'s stamp says were theirs (§ acctMoved).
     Counted from the container rather than named: each thing that has one
     says what its old key is, and its `pick` says which part of it was this
     account's. All of it is removed; part of it -- the rows of the one index
     every account shared, the fields of `lingua.set` beside the handset's
     setup -- is taken out and the rest written back as it was. */
  if(me && acctOld()===me) saveTry(function(){
    var e, v, p, k2, raw;
    for(i=0;i<ACCT.length;i++){
      e=ACCT[i];
      if(!e.old || (v=acctRaw(e.old))===null) continue;
      p=e.pick? e.pick(v, me) : v;
      if(p===null || p===undefined) continue;
      if(p===v || typeof p!=='object'){ doomed.push(e.old); continue; }
      for(k2 in p) if(Object.prototype.hasOwnProperty.call(p,k2)) delete v[k2];
      localStorage.setItem(e.old, JSON.stringify(v));
    }
    raw=acctRaw(LS_S);
    if(raw && typeof raw==='object'){ delete raw.acct; localStorage.setItem(LS_S, JSON.stringify(raw)); }
  });
  try{ for(i=0;i<doomed.length;i++) localStorage.removeItem(doomed[i]); }catch(e){}
  if(me && String(SET.acct||'')===me) delete SET.acct;
  /* AND WHAT IS IN MEMORY, which is the container's: the account being
     deleted is nobody's from here, so nothing that is saved between this line
     and the session ending can write its name back onto the disk
     (「アカウント削除で残るものねえ」). The words somebody searched for, the
     settings, the timeline -- all of it goes with this one call. */
  if(me && ACCT_UID===me) acctFor('');
  langStore();
  return ids;
}
/* The slices a language is filed under. One list, because reading a language,
   writing one out, and DELETING one all have to name every slice.

   「この言語を削除で言語の制作のものは全部なくなる」 OWNER 2026-09-03 --
   wipeLangsGo() in www/settings.js walks this list for one id through
   langKeyOf(), and a slice that is not in it is a slice that survives a
   delete the person was told took everything. It is the same list
   netSaveNow() and netLangSync() walk, so a slice missing here never reaches
   the server either.

   Two were missing from it and had been for as long as they existed, which
   is the whole reason the list is a list. The KEYBOARD is the language's --
   it is built in the app, it is filed under langKey('kb') beside the words
   and the letters -- and it never went up and survived a wipe. And what the
   language is FOR (`wld`) sat in SET, the person's settings, under a comment
   saying it travels with the language: per device, not per language.

   Neither was reachable from anything that would have thrown: every check
   was green, and the keyboard somebody built was simply not in the copy that
   outlives the phone. */
var SLICES=['words','lines','lang','script','letters','notes','phases','talk','snd','kb','wld','gram2'];
/* AND THE ONE PLACE THAT SAYS WHO READS AND WRITES EACH OF THEM.
   「同じボタンは共有して使用すればいいのに直書きで書いてるだろだからこう言う
   ことが起きてる」「こう言うのもルールで禁止してるから無くすように」 OWNER
   2026-09-03.

   The list above says what a language is MADE of. This says how each part of
   it gets into the globals a screen draws from, and back out. It used to be
   said nowhere: **the sequence of reads was written out by hand in five
   places and the sequence of writes in three**, and the counts were five,
   seven, nine and ten. No two of them agreed.

   The keyboard and the world were added to `SLICES` and to `www/core.js`'s
   copy, and to none of `www/settings.js`'s three. So deleting an account read
   five of the ten back -- `KB` and `WLD` kept the deleted person's keyboard
   and their land, `wipeHere()` minted a fresh language a few lines later, and
   the next save wrote them into it. **Not left in memory: written to disk,
   under the next language.** 「アカウント削除で残るものねえ」.

   This is the shape CLAUDE.md rule 6 names by itself -- 「a list of keys,
   written by hand, that nobody remembered to add to」 -- and it is the third
   time it has been the answer here. The keyboard went up nowhere for as long
   as it existed; what a language is FOR sat in the person's settings. Both
   were the same bug and both were fixed one site at a time.

   So there is one list and it is asked of `SLICES` itself: a slice with no
   line here is red (tools/acct-check.mjs § 54), and a line here for a slice
   that is gone is red the same way. **Adding a slice means adding its line,
   and nothing else anywhere.**

   THREE OF THE TWELVE HAVE NO GLOBAL, and saying so is the point of writing
   them down rather than leaving them out:

     lang    the language's NAME, which is the `language.name` column now
             (2026-09-08, www/core.js § LNAME). Nothing writes it. It is READ
             in one place -- langNameOld(), where the column has said nothing
             yet and what an older version of this app wrote is the only name
             this phone has -- and it is NOT deleted
     talk    a chapter that closed. Nothing in www/ reads or writes it, and it
             is NOT deleted -- somebody's may be in it and that is the owner's
             to decide (docs/DATA_SAFETY.md § 4)
     gram2   a grammar model an older version kept. Nothing in www/ reads or
             writes it any more (the adapter's load and save went on
             2026-09-23, www/grammar.js § gModel) and it is NOT deleted --
             what somebody has in it is theirs, and the article still offers
             it for download beside `phases` (www/home.js § WLD_DL_KIND)

   The functions are named inside a function body rather than beside the key,
   because www/core.js is the FIRST script index.html loads: `ltRead` and
   `saveKb` do not exist yet when this object is built, and they do by the
   time anything calls it. */
var LANG_IO={
  /* three slices, one pair -- the dictionary, the lines and the writing are
     read and written together and always have been. `lang` was the fourth
     and is below with the two that have no global */
  words:  { rd:function(){ langRead(); }, wr:function(){ save(); } },
  lines:  { rd:function(){ langRead(); }, wr:function(){ save(); } },
  script: { rd:function(){ langRead(); }, wr:function(){ save(); } },
  letters:{ rd:function(){ ltRead(); },   wr:function(){ saveLetters(); } },
  notes:  { rd:function(){ ntRead(); },   wr:function(){ saveNotes(); } },
  phases: { rd:function(){ stRead(); },   wr:function(){ saveStg(); } },
  snd:    { rd:function(){ sndRead(); },  wr:function(){ saveSnd(); } },
  kb:     { rd:function(){ kbRead(); },   wr:function(){ saveKb(); } },
  wld:    { rd:function(){ wldRead(); },  wr:function(){ saveWld(); } },
  lang:   { why:'the name, and it is the `language.name` column now (www/core.js § LNAME). Nothing writes it; langNameOld() reads it where the column has said nothing yet, and it is not deleted -- what is in it is what an older version of this app put there' },
  talk:   { why:'a chapter that closed. Nothing reads or writes it, and it is not deleted' },
  gram2:  { why:'a grammar model an older version kept. Nothing reads or writes it (the adapter\'s load and save are gone, 2026-09-23), and it is not deleted' }
};
/* Everything this language is, into the globals. One pass, and a function
   named by four slices is called once -- the dictionary and the lines come
   out of one read and calling it four times would be four reads of the same
   key. */
function langLoad(){
  var did=[], i, io;
  for(i=0;i<SLICES.length;i++){
    io=LANG_IO[SLICES[i]];
    if(!io || !io.rd || did.indexOf(io.rd)>=0) continue;
    did.push(io.rd); io.rd();
  }
}
/* And out. The same list, the other way, so a slice cannot be written by one
   road and forgotten by the other. */
function langSaveAll(){
  var did=[], i, io;
  for(i=0;i<SLICES.length;i++){
    io=LANG_IO[SLICES[i]];
    if(!io || !io.wr || did.indexOf(io.wr)>=0) continue;
    did.push(io.wr); io.wr();
  }
}
/* id -> {}: the index says which languages are HERE, and nothing else. The
   language's own keys hold what it is, and the server holds whose it is.

   THE ID IS THE SERVER'S ID AND THERE IS NO OTHER NUMBER (2026-09-10).
   「スパゲッティみたいにするのやめて欲しい」「太い幹を分岐させて欲しい」 OWNER.
   A language used to have two numbers: `L<ms36>`, minted here, and the uuid
   the `language` row was given by `gen_random_uuid()`, kept beside it as
   `sid`. Everything that had to put the two side by side -- nidFor(),
   nidHolds(), nidDrop() in www/net.js, all deleted with this -- was a bridge
   between them, and 148 is what happens when a bridge comes loose: the same
   language stood twice in the switcher and the row somebody was standing in
   was the empty one. langMint() below writes a uuid now and netLangRow()
   sends it, so the phone and the server say the same number from the moment
   the language exists. A language somebody TOOK has been this shape from the
   day downloads were built -- langSeenAdd() keys it by the server's id --
   and this is the making side arriving where the reading side already was.

   `name` STOOD HERE AND IS GONE (2026-09-08). What a language is called is
   `language.name` on the server and langNameOf() is how it is asked -- the
   index carrying a second copy is what let a rename move one and not the
   other. Nothing removed what is already written down: an entry made by an
   older version still carries the field, and langNameOld() READS it, where
   the column has said nothing yet and this is the only name the phone has.

   `mine` AND `uid` STOOD HERE AND BOTH ARE GONE (2026-09-11).
   「誰の物か・あるか無いか・名前・公開か・段 ── 答えは全部サーバー」 OWNER,
   docs/FEATURE_RULES.md § 端末は何も決めない. `uid` was 「which account」 and
   `mine` was 「making or reading」 -- two words that both sound like ownership
   and neither of which was an account the server had named. Four functions
   read them and did not agree, and langForAcct() read the disagreement as
   「this account has no language」 and made another one.

   Whose a language is, is `language.owner`; whether this account is reading
   one of somebody else's is a `language_take` row. langWhose() (§ langWhose)
   is the one place both are asked, and an entry here says nothing but 「this
   language is in this phone's list」. Nothing removes what an older version
   wrote: an entry that carries the two fields keeps them, byte for byte
   (docs/DATA_SAFETY.md rule 2), and nothing reads either one. */
var LANGS={}, langId='';
var WORDS=[], LINES=[], langName='', SET=setDefaults();
/* WHAT A LANGUAGE IS CALLED WHEN IT IS CALLED NOTHING, in one place.
   An empty name is 未設定 -- OWNER 2026-09-06 -- and that sentence was written
   out at four sites in home.js and answered with '—' at two more in
   settings.js, which is six places agreeing about one word. The name itself
   stays empty: this says how it is SAID, and nothing here writes it.

   It takes the name rather than reading `langName`, because a post carries the
   name it was written with and the reader is the one who has to say it. */
function langNameSaid(nm){ return String(nm||'') || t('langs.untitled'); }
/* AND WHAT IT IS CALLED, WHICH IS THE SERVER'S ANSWER AND NOTHING ELSE.
   -------------------------------------------------------------------------
   「言語の名前もサーバーでしょ。wiki もそうなんだから」 OWNER 2026-09-08.

   There is one answer and it is the `language.name` column. There were three:
   the `lang` slice, `LANGS[id].name` in the index, and the column -- and the
   column is the only one anybody ELSE can see, while it was the only one a
   rename never reached. `netLangRow()` wrote it once, when the row was made;
   `PATCH /rest/v1/language` wrote `published_at` and nothing else. So renaming
   a language moved what this phone said and left the column holding the name
   the language was made with, and the article somebody else opened said the
   old one. Nothing threw.

   IT IS IN MEMORY, the same as a slice (CLAUDE.md rule 22): it is what the
   server has said this session, not an opinion this phone holds.
   netLangRow(), netLangBack1(), netLangsDown() and netLangRename() are the
   four that write it -- as a row goes up, or comes down, or a rename lands --
   and nothing else may.

   AND WHAT REACHES THE DISK IS A PICTURE, on no road up.
   「前に読み込んだ分は出て欲しい」 OWNER 2026-09-05: with no signal the languages
   never come down, so a list with no picture behind it is a list of 未設定.
   It goes through slGot(), the one writer of `lingua.<id>.<...>.got`, and it
   is kept out of every road up by the same mechanism the slices are: slWr()
   is never called on this key, so slMine() cannot see it and netSaveNow(),
   netSliceUp() and both 「fills in and stops」 reads never find it. */
var LNAME={};
function langNameKey(id){ return langKeyOf(String(id||''), 'name'); }
function langNameGot(id, nm){
  var k=String(id||''), v=String(nm||'');
  if(!k) return;
  LNAME[k]=v;
  slGot(k, 'name', v);
  /* the open language's name is a global the screens read, exactly the way
     WORDS is: one thing seen from many places, not a second answer */
  if(k===langId) langName=v;
}
/* AND WHAT AN OLDER VERSION OF THIS APP LEFT ON THIS PHONE, which is READ and
   never written, never merged and never sent -- CLAUDE.md rule 22's migration,
   the same shape slRd() falls back to the disk with.

   Before the column there were two: the `lang` slice and `LANGS[id].name`,
   and every phone carrying this app has one or both of them. Reading neither
   is a phone whose own languages are a list of 未設定 -- the language opens,
   the words are all there, and nothing on the screen says what it is.
   「前に読み込んだ分は出て欲しい」 OWNER 2026-09-05.

   IT RUNS ONLY WHERE THERE IS NO ANSWER. 「答えが無い」 and 「空」 are not the
   same state and do not share a branch: a column the server has said is empty
   is LNAME's own answer and is returned above, and this is reached only when
   nobody has said anything at all. The moment the row comes down,
   langNameGot() writes the answer and the picture, and this is never asked
   again. Nothing here writes either one, so a name shown from an older
   version's key cannot become the language's answer. */
function langNameOld(id){
  var s=slRd(langKeyOf(id, 'lang')), L=LANGS[id];
  if(s!==null && String(s)!=='') return String(s);
  return (L && L.name)? String(L.name) : '';
}
function langNameOf(id){
  var k=String(id||''), p;
  if(!k) return '';
  if(Object.prototype.hasOwnProperty.call(LNAME, k)) return LNAME[k];
  p=slRd(langNameKey(k));
  if(p!==null) return String(p);
  return langNameOld(k);
}
/* AND HOW IT IS WRITTEN, WHICH IS THE LANGUAGE'S AND NOT THE PERSON'S.
   -------------------------------------------------------------------------
   「端末に残すものないんですけど。サーバーで同じ機能になるように代替して」
   OWNER 2026-09-08.

   This was `SET.wsys`, a field of the PERSON's settings on this handset --
   and tools/store-check.mjs had written GAP against it in its own words:
   「言語のものなのに人の設定に入っているので、公開した言語は書記体系を
   見せられない」. Somebody with two languages had one answer for both, and
   nobody else could ever be told which of the five a published language was.

   `language.wsys` is the answer, and this is the same shape LNAME above is:
   memory for what the server has said this session, a picture on the disk so
   a launch with no signal draws something, and no road up at all -- slWr() is
   never called on the key, so slMine() cannot see it.

   EMPTY IS NOT A FIFTH KIND. It means nobody has said, and www/wsys.js
   answers for that by looking at the language. */
var LWSYS={};
function langWsysKey(id){ return langKeyOf(String(id||''), 'wsys'); }
function langWsysGot(id, w){
  var k=String(id||''), v=String(w||'');
  if(!k) return;
  LWSYS[k]=v;
  slGot(k, 'wsys', v);
}
function langWsysOf(id){
  var k=String(id||''), p;
  if(!k) return '';
  if(Object.prototype.hasOwnProperty.call(LWSYS, k)) return LWSYS[k];
  p=slRd(langWsysKey(k));
  return p===null? '' : String(p);
}
/* AND WHO WROTE IT, WHICH IS `language.owner` AND NOTHING THIS PHONE DECIDES.
   -------------------------------------------------------------------------
   「端末に残すものないんですけど。サーバーで同じ機能になるように代替して」
   OWNER 2026-09-08.

   `LANGS[id].uid` used to answer this and it was TWO facts in one field: on a
   language somebody made it was who made it, and on a downloaded one it was
   who TOOK it -- langSeenAdd()'s own comment said 「AND IT CARRIES WHOEVER
   TOOK IT」. The two come apart the moment a language moves between people,
   which is the only time either matters.

   They are two questions now and both are the server's. This is the first:
   who WROTE it, `language.owner`, which comes down with the row (owner=eq.me
   for your own) or off `language_seen.owner` for somebody else's. The second
   -- who took it -- is the `language_take` table and langTook() below.

   THREE STATES AND NOT TWO, the same as wldPubGot(): known to be mine, known
   to be somebody else's, and NOT ASKED YET. The third is not drawn -- the
   list waits, exactly as the article and the profile wait
   （「全部読み込んでから開く」 OWNER 2026-09-07）-- because falling to either
   side is wrong: to 「mine」 lets a save reach somebody else's language, and
   to 「theirs」 hides a language from the person who made it. */
var LOWN={};
function langOwnKey(id){ return langKeyOf(String(id||''), 'owner'); }
function langOwnGot(id, uid){
  var k=String(id||''), v=String(uid||''),
      was=Object.prototype.hasOwnProperty.call(LOWN, k)? LOWN[k] : '';
  if(!k) return;
  LOWN[k]=v;
  slGot(k, 'owner', v);
  /* AND THE OPEN LANGUAGE HAS JUST BECOME WRITABLE (§ langLocked), so what
     could not be written while nobody had answered goes in now rather than on
     the next launch -- migrateAll() below, the old shapes brought forward
     and the free alphabet topped up (ltStart, www/letters.js). Each of them
     refuses a language that is not writable -- which on a launch is every language until its answer is in,
     and at the door is the walk's own language until its row is made.

     Not a second mechanism: it is the same call, made at the moment the fact
     it waited on becomes true, and it tops up only what is missing. Only on
     the OPEN language, because they work on its globals; and only where the
     answer is new in this run of the app, so a walk over every row does not
     run it once per row. `was` is LOWN and never the picture: the picture is
     not an answer, and comparing against it is what kept this from running
     on a launch. */
  if(k===langId && v && v!==was && typeof migrateAll==='function') slAsApp(migrateAll, []);
}
function langOwnOf(id){
  var k=String(id||''), p;
  if(!k) return '';
  if(Object.prototype.hasOwnProperty.call(LOWN, k)) return LOWN[k];
  p=slRd(langOwnKey(k));
  return p===null? '' : String(p);
}
/* AND WHEN IT WAS MADE, WHICH IS `language.created_at` AND DECIDES WHICH ONE
   IS THE MAIN ONE.
   -------------------------------------------------------------------------
   「そもそも最初に作った言語を主言語にして、フリーにした時に最初に表示される
   ようにしないとダメでは？」 OWNER 2026-09-12.

   THE SERVER ALREADY ANSWERS THIS QUESTION AND THIS IS THE SAME COLUMN.
   `profile_seen.lang_id` (supabase/schema.sql) is `language_seen` ordered
   `created_at asc limit 1` -- the language on somebody's profile is already
   「the first one they made」. A second rule here, worked out from anything
   else, would be the app and the server each answering 「which is the main
   one」 and drifting apart the first time they disagreed. So the phone reads
   the same column in the same direction and nothing here computes a date.

   Same shape as LNAME, LWSYS and LOWN above: memory for what the server has
   said this session (CLAUDE.md rule 22), a picture on the disk so a launch
   with no signal can still put the list in order, and NO ROAD UP -- slGot()
   is the one writer, so slMine() cannot see it and netSliceUp(),
   netSaveNow() and both 「fills in and stops」 reads never find it.

   EMPTY IS 「NOBODY HAS SAID」 AND NOT 「OLDEST」. A language minted on this
   phone has no row yet, so it has no date -- and it is the NEWEST thing here,
   not the oldest. langsByAge() below puts an unanswered one last for that
   reason, and it is the one place that decides it. */
var LMADE={};
function langMadeKey(id){ return langKeyOf(String(id||''), 'made'); }
function langMadeGot(id, at){
  var k=String(id||''), v=String(at||'');
  if(!k) return;
  LMADE[k]=v;
  slGot(k, 'made', v);
}
function langMadeOf(id){
  var k=String(id||''), p;
  if(!k) return '';
  if(Object.prototype.hasOwnProperty.call(LMADE, k)) return LMADE[k];
  p=slRd(langMadeKey(k));
  return p===null? '' : String(p);
}
/* ---- LROW: WHETHER THE SERVER HAS A ROW FOR THIS LANGUAGE ---------------
   `LANGS[id].sid` answered two questions with one field, and only one of them
   was a number. The number is the id now (§ langMint); this is the other
   half -- 「has the `language` row been made」 -- which netLangRow() has to
   know or it cannot tell a language of yours that has never been up from one
   that is already there.

   IN MEMORY, like everything else the server has said this session (rule 22).
   A launch fills it from netLangsWalk(), which only ever walks rows that
   exist; a language minted with no signal is not in it, and the insert is
   what finds out -- a 409 is the server saying 「it is already here」.

   langsOneId() below writes it too, and that is the migration reading rather
   than the server speaking: an entry an older version left carrying a `sid`
   is an entry whose row was made, because `sid` was written at the moment
   netLangRow() made it and at no other moment. */
var LROW={};
function langRowGot(id){ LROW[String(id||'')]=1; }
function langRowUp(id){ return LROW[String(id||'')]===1; }
/* AND HOW MANY OF SOMEBODY ELSE'S THIS ACCOUNT HAS TAKEN -- the `language_take`
   table, counted on the server and kept here as the number it answered with.
   `null` is 「not asked」 and is not nought: a ceiling measured against a
   number nobody has given is a ceiling that refuses the first download of the
   session or lets through the fourth. netTakes() (www/net.js) is what fills
   it and dlStop() is what waits for it. */
var LTAKE=null;
/* AND IT IS IN MEMORY ONLY. 「だから端末に置くのもng」 OWNER 2026-09-30.

   This used to be written to the disk as `lingua.take.<uid>` so a launch
   with no signal could draw the languages somebody had taken
   （「前に読み込んだの出していいよ」 OWNER 2026-09-12). Somebody else's
   language is the server's and not this phone's now (§ langOut), and with no
   signal it is not shown: `null` is 「not asked」, langWhose() answers
   LW_WAIT for it, and it waits for the answer rather than being drawn from a
   copy. An account's OWN languages are not this and still come back with no
   signal off their pictures (§ langOwnOf).

   A key an older version wrote is not read and not removed
   (docs/CHANGELOG.md 2026-09-30); deleting the account takes it with the
   namespace (§ lsWipeAcct). */
function langTookGot(ids){
  LTAKE=(ids && typeof ids.length==='number')? ids : null;
}
/* FORGOTTEN WHERE THE ACCOUNT CHANGES (§ ACCT), and a phone with nobody on
   it has been told nothing. */
acctMem(function(){ LTAKE=null; });
function langTook(){ return LTAKE? LTAKE.length : null; }
/* Whether THIS account took this language, asked by the server's id for it.
   lsWipeAcct() is what wants it: a downloaded language is written by somebody
   else, so 「whose is it」 cannot find it, and deleting an account has to take
   the copies that account pulled down. */
function langTookHas(sid){
  var k=String(sid||''), i;
  if(!k || !LTAKE) return false;
  for(i=0;i<LTAKE.length;i++) if(String(LTAKE[i])===k) return true;
  return false;
}
/* ---- LMINE: WHETHER THE SERVER HAS SAID WHICH LANGUAGES THIS ACCOUNT WROTE
   -------------------------------------------------------------------------
   「端末で使うものなんかないだろ」「そもそも端末を使用するところがないんだから
   直すじゃないでしょ設計ミスなんだから作り直しでしょ」 OWNER 2026-09-15.

   THE INDEX SAYS WHICH LANGUAGES THIS PHONE HAS HEARD OF. IT DOES NOT SAY
   WHICH ONES THE ACCOUNT HAS. `lingua.langs` is on the disk and outlives
   every launch, every sign-out and every row the server drops -- so counting
   it is the phone answering a question only the server can answer. Measured
   on a real phone (158, 2026-09-15): two `language` rows were deleted on the
   server and 設定→言語 went on drawing them as 「未設定」, while
   「言語を追加」 was refused with 「アップグレードが必要です」 -- a person
   held off their own next language by rows that do not exist.

   SO IT IS THREE STATES AND NOT TWO, exactly as LOWN, LTAKE and PLAN are.
   `language?owner=eq.<me>` has answered, or it has not, and 「it has not」 is
   not 「this account has none」 and not 「this account has these」.

   FORGOTTEN WHERE THE ACCOUNT CHANGES, which is PLAN's shape exactly
   (§ planForget, § planFor) and for PLAN's reason: a session ARRIVING is a
   different person, and nobody has asked about their languages yet. netTook()
   forgets on `netCame` -- the one fact in that file that means 「there was no
   session here a moment ago」 -- and netOut() forgets because a phone with
   nobody on it has been told nothing. A token being REFRESHED is not either
   of those and does not forget, or an hour passing would blank the answer in
   the middle of somebody's afternoon (§ planFor was measured going wrong that
   exact way). netLangsDown() (www/net.js) is the one road that writes it,
   because it is the one road that asks.

   NOTHING ON THE DISK. A picture of this would be the phone remembering an
   answer about an account across launches and then COUNTING it, which is the
   bug above wearing a newer coat. The list itself may be drawn from the copy
   with no signal -- 「前に読み込んだの出していいよ」 OWNER 2026-09-12 -- and
   langsList() (www/home.js) is where that is said. Drawing and counting are
   different acts and this is only ever about counting. */
var LMINE=null;
function langMineGot(){ LMINE=1; }
function langMineForget(){ LMINE=null; }
acctMem(langMineForget);
function langMineKnown(){ return LMINE!==null; }
/* ---- AND WHETHER THIS PHONE IS HOLDING ANYTHING OF A LANGUAGE -----------
   「オンラインは一本化ね？」 OWNER 2026-09-04, and rule 22: the copy on this
   phone is READ-ONLY and the road is one way.

   AN INDEX ENTRY IS NOT A THING SOMEBODY MADE. The index says WHICH; the
   slices are WHAT. A language whose row the server no longer has, whose
   slices died with the last run, is a line in a list and nothing else -- and
   `langMineIds()` (www/net.js) was handing exactly those to the road that
   goes UP, so `netLangRow()` made the row again. That is the nameless empty
   `language` row the owner found at 09:09:57 on 2026-09-15, one second after
   signing in.

   slMine() AND NOT slRd(). slRd() falls back to the picture slGot() keeps
   for a launch with no signal, and a picture is not a holding -- reading it
   here is what would put the copy back on the road up. slMine() is the
   memory (LSL) and what an older version wrote to the disk, which is
   precisely what this phone HAS and is the only thing that may travel.

   IT IS THE SAFE DIRECTION IN BOTH USES. What is held goes up, so nothing
   somebody typed is stranded; and what is held is never dropped by
   netLangsGone() (www/net.js), because 「the server does not have it」 and
   「it has not been sent yet」 look identical from here and only one of them
   may be acted on. */
function langHeld(id){
  var k=String(id||''), i;
  if(!k) return false;
  for(i=0;i<SLICES.length;i++)
    if(slMine(langKeyOf(k, SLICES[i]))!==null) return true;
  return false;
}
/* ---- AND EVERYTHING THIS PHONE HAS FILED UNDER ONE LANGUAGE, TAKEN ------
   The copy goes and nothing else does. The `language` row is not touched
   here and is not this function's business -- netLangsGone() (www/net.js)
   says why at length.

   COUNTED AND NOT NAMED. This was a walk over `SLICES`, and every key added
   after that loop was written stayed behind: `name`, `wsys`, `owner` and
   `made` are COLUMNS of the row rather than slices, so a dropped language
   left `lingua.<id>.name.got` and `lingua.<id>.owner.got` on the disk and
   the next launch read them back. CLAUDE.md calls that shape by name --
   「a list of keys, written by hand, that nobody remembered to add to」 --
   and lsWipeAcct() above was rewritten out of it a week earlier. So there is
   no list: `lingua.<id>.` -- the dot included, so one id is never the head of
   another's -- is what a thing of this language IS, and a key written under
   it tomorrow goes the day it is written. */
function langDropHere(id){
  var k=String(id||''), pre, key, j, doomed=[];
  if(!k || !LANGS[k]) return false;
  pre='lingua.'+k+'.';
  for(key in LSL)
    if(Object.prototype.hasOwnProperty.call(LSL, key) && key.indexOf(pre)===0)
      delete LSL[key];
  try{
    for(j=0;j<localStorage.length;j++){
      key=localStorage.key(j);
      if(key && key.indexOf(pre)===0) doomed.push(key);
    }
    for(j=0;j<doomed.length;j++) localStorage.removeItem(doomed[j]);
  }catch(e){}
  delete LANGS[k];
  return true;
}
/* What a person's settings are before they touch anything. A function rather
   than a literal because it is needed twice -- here, and when everything is
   wiped -- and the second copy was written out by hand and did not have the
   same keys in it. */
function setDefaults(){
  return {theme:'system', acct:'', walked:false, ui:''};
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
   concatenation somewhere else is a slice netSaveNow() will not send and
   wipeLangsGo() will not clear, which is how one language's leftovers arrive in the next
   under the same id. The keyboard and the world were both that bug once;
   CLAUDE.md names them. */
function langKeyOf(id, slice){ return 'lingua.' + id + '.' + slice; }
function langKey(slice){ return langKeyOf(langId, slice); }

/* AND WHERE A SLICE ACTUALLY SITS, WHICH IS MEMORY AND NOT THIS PHONE'S DISK.
   -------------------------------------------------------------------------
   「オンラインは一本化ね？」「簡単よ」「保存としたらオンラインおしまい」
   「今ファイルもいらん。オンラインのみで行こうってことになってる今後オフライン
     対応する時にまた考えることにした」 OWNER 2026-09-04.

   Every one of the twelve used to be a `localStorage` key. **The server is
   the only place a language is kept now**, and what is here is the value the
   running app is holding -- the same kind of thing `WORDS` and `LETTERS`
   already were, one step further out. Close the app and it is gone; open it
   signed in, arrive at a screen drawn from it, and netLangFill() brings it
   back.

   IT IS NOT A SECOND ANSWER. What survives the app is the read-only picture
   slGot() keeps (`.got`, below) -- 「前に読み込んだ分は出て欲しい」 OWNER
   2026-09-04 -- and nothing on it ever goes back up: slMine() never reads
   it, so the up road cannot.

   KEYED BY langKeyOf() STILL, and that is not leftovers. It is the one place
   that knows how a language is filed (CLAUDE.md rule 6), the keys are what
   `SLICES` and `wipeLangsGo()` and `lsWipeAcct()` already walk, and a second
   naming scheme here would be exactly the fault that comment is about.

   `lingua.langs.<uid>` and `lingua.cur.<uid>` are NOT this. They are the index -- which
   languages this account has and where somebody is standing -- and they stay
   on disk, because they are what the app asks the server WITH. */
var LSL={};
/* AND WHAT AN OLDER VERSION OF THIS APP LEFT ON THE DISK IS STILL READ.
   -------------------------------------------------------------------------
   Every phone that has this app on it today has `lingua.<id>.<slice>` in
   `localStorage`, written by every version before 2026-09-04. Reading only
   LSL means every one of those people opens the app to an EMPTY language --
   the words are on the disk, in the same keys, and nothing looks at them.
   `migrate-check` said so in twenty-five lines before this existed.

   So this is a MIGRATION and it obeys the rule migrations obey: **it copies
   and never removes what it read** (docs/DATA_SAFETY.md rule 2, langMigrate's
   own argument). The disk is the fallback and never the destination: `slWr`
   goes to memory alone, so what is there is exactly what an older version
   wrote and it stops changing from today. Once a slice has been through the
   server and back it is in LSL, which is asked first.

   **WHEN THOSE KEYS STOP BEING READ IS THE OWNER'S**, and it is not answered
   here: doing it on a launch with no signal would take a language nobody had
   managed to send. docs/BACKLOG.md carries it. */
function slMine(k){
  if(Object.prototype.hasOwnProperty.call(LSL, k)) return LSL[k];
  try{ return localStorage.getItem(k); }catch(e){ return null; }
}
/* AND WHAT CAME DOWN FROM THE SERVER LAST TIME, WHICH IS A PICTURE AND NOT A
   COPY OF ANYBODY'S WORK.
   -------------------------------------------------------------------------
   「Twitterとかは電波がないと開かないでしょ？」「前に読み込んだ分は出て欲しい。
     制作も眺めたい人はいるだろうし、」
   「スタンダードに合わせて作りたいから間違ってることあったら言って。」
   OWNER 2026-09-05.

   The slices are in memory, so an app that has been closed holds nothing --
   and with no signal netResume() never comes back, netLangsDown() never runs,
   and somebody opens their own language to find it empty. That is what this
   answers and the whole of what it answers: **the language that was last
   brought down is on the screen.** Nothing can be made and nothing can be
   saved -- a save is the send, and with no signal it does not land.

   IT NEVER GOES BACK UP, AND THAT IS HELD BY THERE BEING TWO QUESTIONS RATHER
   THAN BY ANYBODY REMEMBERING:

     slRd(k)    「what IS this part of the language」 -- what the SCREENS ask.
                Memory, then what an older version left on the disk, then this
                picture.
     slMine(k)  「what is this phone holding that the server may not have been
                told about」 -- what the UP ROAD asks. Memory, then what an
                older version left on the disk. **The picture is not in it.**

   So the picture is drawn and is never sent, never merged, and never wins:
   every 「fills in what is missing and stops」 in www/net.js asks slMine(),
   finds nothing, and writes the server's answer straight over it.

   The other direction is the disk key an older version wrote, and it is a
   different thing wearing a similar shape -- that one IS somebody's own work,
   it has never been up, and the migration exists to send it. It is in
   slMine() for exactly that reason and stays ahead of the picture here.

   Written where the server has said what it holds (netSliceUp and
   netLangFill in www/net.js) and removed in one place (slRm below, which is only ever a
   person deleting a language or an account). */
function slGotKey(k){ return k + '.got'; }
function slRd(k){
  var v=slMine(k);
  if(v!==null) return v;
  try{ return localStorage.getItem(slGotKey(k)); }catch(e){ return null; }
}
/* A picture that did not land says NOTHING, and that is a decision rather
   than the empty catch saveTry() was written to end. Nothing of anybody's is
   lost by it -- the language is on the server and on the screen -- so
   「保存できませんでした」 here would be a sentence that is not true. What is
   lost is the picture on the next launch with no signal. */
/* `null` is 「there is nothing」 and takes the picture away; '' is the
   server saying EMPTY, which is an answer and is kept -- 「空」と「無い」は
   別の枝 (CLAUDE.md § Data). It took '' as nothing, so a name the server had
   emptied came back with no signal as whatever an older version called the
   language (state-check G, rule-audit-2026-09-27-core C1). */
function slGot(id, kind, body){
  var k=langKeyOf(String(id||''), kind);
  /* NOTHING OF SOMEBODY ELSE'S LANGUAGE IS WRITTEN TO THIS PHONE'S DISK, AND
     NOTHING OF ONE NOBODY HAS ANSWERED FOR -- langOut() below, the one
     question every way out of memory asks (OWNER 2026-09-30). The picture is
     for looking at your OWN language with no signal; somebody else's is on
     the server and in memory while the app runs, and nowhere else.

     WHO WROTE IT does not ask, and it is not the language: it is an account's
     id, the answer langOut() itself reads (langOwnOf). Asked first it would
     be 「nobody has said」 and nothing of your own would ever be kept. And an
     index row of somebody else's language with no answer about its owner is
     indistinguishable from core.js's own empty stub, which netLangsGone()
     (www/net.js) drops on a launch whose take answer did not arrive --
     measured (again-check, 「答えが来ていない起動では何も落ちない」). */
  if(kind!=='owner' && !langOut(id)) return;
  try{
    if(body===null) localStorage.removeItem(slGotKey(k));
    else localStorage.setItem(slGotKey(k), String(body));
  }catch(e){}
}
/* AND WHICH OF THEM A PERSON WROTE. 「上がるのは変わった所だけで、端末にある
   ものを丸ごと送らない」 (docs/scope/brief-r60-up.md). The up road used to
   send every slice that differed from what the two sides last agreed, and a
   slice differs for reasons nobody pressed: the free alphabet topped up, a
   migration bringing an old shape forward. Those are worked out again on
   every load and never need to travel by themselves -- they go with the slice
   the next time a PERSON writes it.

   A write is a PERSON's when it CHANGES what this phone holds and it is not
   made inside slAsApp(). slAsApp() is the app writing for itself: every
   answer from the server (www/net.js hands each one over through it -- the
   one window every answer comes through), the launch's migrations
   (www/boot.js), and what langOpen() writes out and works over when a
   language is opened. A depth rather than a flag, because an answer can start
   a request whose answer lands inside it. A write of the same string is
   nobody changing anything -- a settings save() writes the dictionary back
   exactly as it was, and that is not a person writing the dictionary
   (r63-audit 0-1). netSaveNow() and netLangSync() send a slice that is
   marked here; netSliceUp() takes the mark off when the server has it.

   AND WHEN. The mark is the moment the person last wrote that slice, by this
   phone's clock, because that is what goes up with it: two phones that
   changed the same thing keep the later change (supabase/schema.sql §
   slice_in, which decides it -- the phone only says when). */
var LTOUCH={}, SL_APP=0;
function slAsApp(fn, args){
  SL_APP++;
  try{ fn.apply(null, args); }
  finally{ SL_APP--; }
}
/* ---- WHAT A SLICE IS: FOUR ANSWERS, AND THIS IS WHERE THEY ARE MADE -----
   「"Empty" and "broken" are different states and must not share a branch」
   (CLAUDE.md § Data). Every reader of a slice on this phone asks here; the
   server asks the same four of what it is sent (supabase/schema.sql §
   slice_state), because putting two copies together is the server's:

     none    no string, or an empty one: there is nothing
     plain   a slice that is not JSON and never was -- `lang`, the name
     read    a slice this app understands, in the SHAPE its readers take
     wreck   one it does not: not JSON, or JSON of a shape this slice never
             has -- a dictionary that is `{}`, an alphabet that is `5`

   It was ten readers each doing `try{JSON.parse(slRd(k)||'[]')}catch(e){}`,
   so a wreck read as the empty default and the next save wrote the default
   in its place (docs/scope/r73-audit.md § 2-4), and a merge that told the
   two apart while nothing else did. `plain` and `wreck` look alike from the
   string -- JSON.parse throws on `Shango` as on `[[[not json` -- so which one
   it is, is a question about the SLICE and is asked of `kind`. */
var SL_SHAPE={words:'a', lines:'a', letters:'a', notes:'a', snd:'a',
              script:'o', phases:'o', wld:'o', kb:'o'};
function slState(kind, s){
  var v, want=SL_SHAPE[kind];
  if(typeof s!=='string' || s==='') return {is:'none', v:null};
  if(kind==='lang') return {is:'plain', v:s};
  try{ v=JSON.parse(s); }catch(e){ return {is:'wreck', v:null}; }
  if(v!==null && ((want==='a' && !(v instanceof Array)) ||
                  (want==='o' && (typeof v!=='object' || v instanceof Array))))
    return {is:'wreck', v:null};
  return {is:'read', v:v};
}
/* THE OPEN LANGUAGE'S SLICE, as its readers want it: what was read, or null
   for nothing and for a wreck alike -- the screen draws the empty language
   either way. What is NOT alike is what happens next: a slice that could not
   be read is marked, and slWr() will not write the default over it. */
var LWRECK={};
function slOpen(kind){
  var k=langKey(kind), d=slState(kind, slRd(k));
  if(d.is==='wreck') LWRECK[k]=1;
  else delete LWRECK[k];
  return d.v;
}
/* And the one write that may go over a wreck: the SERVER's readable answer
   to a send (www/net.js § netSliceUp) -- 「a copy it cannot parse takes the
   server's」 (CLAUDE.md rule 22). */
function slMend(k){ delete LWRECK[k]; }
function slWr(k, v){
  var s=String(v);
  /* NOTHING IS WRITTEN OVER A SLICE THAT COULD NOT BE READ. What is in
     memory is the empty default the reader fell to, and writing it would be
     the app deciding that what it cannot read is nothing -- and the next
     person's save would carry it up. It is not saved, and it says so
     (rule 11: 「NOT SAVING IS THE SPEC. SAVING AND SAYING NOTHING IS NOT」). */
  if(LWRECK[k]){ saveNo(); return; }
  /* NOTHING, written by a writer -- the keyboard reset, a slice whose last
     thing went -- is the slice taken away, and it passes the line above
     first: kbWrite() called slRm() itself, so a keyboard that could not be
     read was REMOVED, disk copy and all, by every langSaveAll()
     (tools/state-check.mjs E, measured). */
  if(v===null){ slRm(k); return; }
  if(!SL_APP && slMine(k)!==s) LTOUCH[k]=Date.now();
  LSL[k]=s;
}
function slTouched(k){ return !!LTOUCH[k]; }
function slTouchedAt(k){ return LTOUCH[k] || 0; }
function slSettled(k){ delete LTOUCH[k]; }
/* Gone from memory, and both disk keys with it -- what an older version wrote
   and the picture slGot() keeps. This is the one place that REMOVES, and it is
   only ever a person deleting a language or an account (wipeLangsGo,
   lsWipeAcct). Leaving either one behind would be the slice coming back
   through a fallback above on the next launch, which is 「消したものが戻って
   くる」 wearing the migration's clothes. */
function slRm(k){
  delete LSL[k];
  slSettled(k);
  try{
    localStorage.removeItem(k); localStorage.removeItem(slGotKey(k));
    /* and `<k>.was`, what an older version kept of what it and the server
       last agreed -- the merge was the phone's until 2026-09-27 and nothing
       reads it now, but it is filed under this slice and goes with it. */
    localStorage.removeItem(k + '.was');
  }catch(e){}
}
/* Which slices could not be read is about the account that read them. */
acctMem(function(){ LWRECK={}; });

/* ---- AND A SAVE THAT DID NOT LAND SAYS SO -------------------------------
   「なら失敗して残るにするべき。」
   「スタンダードに合わせて作りたいから間違ってることあったら言って。」
   OWNER 2026-09-05.

   Four writes to this phone's disk sat in this file behind a catch with
   nothing in it -- the settings, the settings again from the plan migration,
   the index of languages, and the settings of an account parked on its way
   out. A phone with no room left wrote none of them and said nothing.
   「保存が失敗しても何も言いません」 was how the leader wrote it down, and
   the owner's answer is that a save FAILING is what an online app does and a
   save failing QUIETLY is not: what somebody made stays in front of them, and
   the app says it did not get written down.

   ONE PLACE ANSWERS IT, and this is the place. What is written and under
   which key stays at the call site -- that is what tools/store-check.mjs
   reads, and 「which account is this」 is asked of each key there. What was
   in four places is the other question, 「did it land」, and it is here.

   NOTHING IS THROWN AWAY BY A FAILURE. The language is in LSL above before
   any of this runs, WORDS and LETTERS are what the screens draw, and the send
   is bkTouch()'s -- so what a person made is still on the screen and pressing
   save again is a save that can land. 「失敗して残る」.

   toast() is www/shell.js's, and index.html loads that file after the whole
   of this one, so a failure DURING THE LOAD has nobody to say it to:
   walkedMigrate() below runs while core.js is still being read. It is asked for
   rather than assumed because the alternative is core.js stopping on that
   line with everything under it -- CAN among them -- never defined, which is
   a white screen from a message about a full disk. If toast() is there then
   so is t(), for the same reason. And the toast is one line on the screen
   that rewrites itself, so a burst that fails twice says it once. */
function saveTry(put){
  try{ put(); }
  catch(e){ saveNo(); }
}
function saveNo(){ if(typeof toast==='function') toast(t('save.no')); }

/* Which languages are here, and which one is open. Read before anything else
   in this file, because every other key is built out of langId.

   THEY ARE THE ACCOUNT'S (§ ACCT). `lingua.langs` and `lingua.cur` were one
   key each for every account that ever signed in on this phone (r63 L4), so
   the next person's switcher started from the last one's list. They are
   `lingua.langs.<uid>` and `lingua.cur.<uid>` now, written under the account
   holding them; the old two are read once, for the account their stamp names
   and only its own rows (langsOld), and are never written again. */
acctKeep('langs', function(){ return LANGS; },
         function(v){ LANGS=(v && typeof v==='object' && typeof v.length!=='number')? v : {}; },
         LS_LANGS, langsOld);
acctKeep('cur', function(){ return langId; },
         function(v){ langId=(typeof v==='string')? v : ''; },
         LS_CUR, function(v, who){
           var l=acctRaw(acctKey('langs', who));
           return (typeof v==='string' && l && l[v])? v : null;
         });
/* Of the old shared index, the rows that are the stamped account's: the ones
   it WROTE (the `owner` picture, § langOwnOf) and the ones it TOOK (its own
   `take` picture). Anybody else's row stays in the old key, read by nobody. */
function langsOld(v, who){
  var out={}, id, took=acctRaw(acctKey('take', who)) || [];
  if(!v || typeof v!=='object') return null;
  for(id in v)
    if(Object.prototype.hasOwnProperty.call(v, id) &&
       (langOwnOf(id)===who || took.indexOf(id)>=0)) out[id]=v[id];
  return out;
}
function langStore(){
  saveTry(function(){ acctPut('langs', LANGS); acctPut('cur', langId); });
}
/* ---- THE ONE NUMBER, ON A PHONE THAT WAS HERE BEFORE IT ------------------
   2026-09-10. Until today a language had two numbers -- `L<ms36>`, minted on
   the phone and used as the key of this index and of every key under it, and
   the uuid the `language` row was given, kept beside it as `sid`. The id is
   the row's id now (§ langMint), so every index an older version wrote is in
   a shape nothing reads.

   IT COPIES AND IT REMOVES NOTHING -- docs/DATA_SAFETY.md rule 2. What is
   filed under the old number stays exactly where it is, byte for byte; what
   the new number needs is written beside it. The index row is the one thing
   that MOVES, and it has to: two rows for one language is the switcher
   showing it twice, which is the fault of 148 arriving after it was fixed.
   Nothing about it is a judgement -- the row is the same row under the
   language's real number, and every field it carried goes with it.

   Three shapes arrive here and the third is not touched:

     { 'L…': { sid: U } }  it has been up. The row's number is U, so that is
                           where it goes, and § LROW is told the row exists --
                           `sid` was written at the moment netLangRow() made
                           the row and at no other moment.
     { 'L…': { } }         it has never been up. It gets a number now, and
                           the row is made with that number the first time it
                           goes. Nothing is told about a row, because there
                           is none.
     { U: { } }            already one number. Left alone.

   WHERE THE FIRST AND THE THIRD ARE THE SAME LANGUAGE -- the two rows 150
   was written for -- they land on one row here, because they land on the
   same number. The index row is one; a key under it is whichever of the two
   is not empty, and where both are empty it is empty. Nothing is chosen
   between two things somebody made: a key already holding something is never
   written over.

   It runs on every launch and there is nothing to remember: after it, every
   number in the index is the language's own, so the next launch finds nothing
   to do. */
function langsOneId(){
  var ids=[], id, L, to, i, moved=false;
  for(id in LANGS)
    if(Object.prototype.hasOwnProperty.call(LANGS, id)) ids.push(id);
  for(i=0;i<ids.length;i++){
    id=ids[i]; L=LANGS[id];
    if(!L || typeof L!=='object') continue;
    /* THE OTHER NUMBER, WHERE THE ENTRY CARRIES ONE. That field was written
       at the moment the row was made and at no other moment, so it says both
       which number the row has and that the row EXISTS. */
    to=String((L.sid===undefined? '' : L.sid) || '');
    if(to) langRowGot(to);
    /* and the second number itself goes, wherever the row ends up */
    if(L.sid!==undefined){ delete L.sid; moved=true; }
    /* NO ROW YET, AND A NUMBER THE OLD MINT WROTE: it gets one now, and the
       row is made with it the first time it goes. Which numbers those are is
       langsOldId() below and nowhere else. */
    if(!to && langsOldId(id)) to=uuid4();
    /* already where it belongs, or nothing this app minted */
    if(!to || to===id) continue;
    langsCarry(id, to, L);
    delete LANGS[id];
    moved=true;
  }
  if(moved) langStore();
}
/* WHETHER THIS NUMBER WAS MINTED BY THE OLD APP, and it is asked of the one
   thing that separates the two beyond doubt: A NUMBER THE SERVER WROTE HAS
   DASHES IN IT. `gen_random_uuid()` writes 8-4-4-4-12 and cannot write
   anything else; the old langMint() wrote `L` and a base-36 millisecond and
   never wrote a dash. So a key with no dash is one this app minted, and one
   with a dash is a language's own number -- a language somebody TOOK is keyed
   by the server's id and has been since downloads were built, and nothing
   here may rename that.

   Asked this way round rather than as 「does this look like a uuid」 because
   the two are not the same question at the edges, and the edge is the one
   that matters: a shape test that says 「not a uuid, so rename it」 renames
   anything the server calls a language by some other name. */
function langsOldId(id){ return String(id||'').indexOf('-') < 0; }
/* ONE LANGUAGE, FROM THE NUMBER IT WAS FILED UNDER TO ITS OWN.
   The keys are COUNTED and not listed: `lingua.<id>.` is the whole prefix,
   so the slices, what this phone and the server last agreed each of them was
   (`.was`), and the pictures of the three columns all go, and so does a key
   added tomorrow. lsWipeAcct() above counts the namespace for the same
   reason -- 「a list of keys, written by hand, that nobody remembered to add
   to」 is one bug this file has had more than once. */
function langsCarry(from, to, L){
  var T, k, pre='lingua.'+from+'.', keys=[], i, kk, dst, v, w;
  if(!LANGS[to]) LANGS[to]={};
  T=LANGS[to];
  /* every field the old row carried, where the new one has nothing to say.
     The second number is already off it -- langsOneId() takes that field
     before it gets here, which is the one place that says it does not
     travel. */
  for(k in L){
    if(!Object.prototype.hasOwnProperty.call(L, k)) continue;
    if(!Object.prototype.hasOwnProperty.call(T, k)) T[k]=L[k];
  }
  try{
    for(i=0;i<localStorage.length;i++){
      kk=localStorage.key(i);
      if(kk && kk.indexOf(pre)===0) keys.push(kk);
    }
  }catch(e){}
  for(i=0;i<keys.length;i++){
    kk=keys[i];
    dst='lingua.'+to+'.'+kk.slice(pre.length);
    v=null; w=null;
    try{ v=localStorage.getItem(kk); }catch(e){}
    try{ w=localStorage.getItem(dst); }catch(e){}
    /* nothing to carry, or the new number is already holding something --
       and what it is holding is never written over */
    if(v===null || v==='' || (w!==null && w!=='')) continue;
    saveTry(function(){ localStorage.setItem(dst, v); });
  }
  /* and where somebody is standing */
  if(langId===from) langId=to;
}
langsOneId();
/* A new language of this person's, in the index and nowhere else yet. Its
   slices do not exist until something writes one, which is what an empty
   language IS -- langRead() below puts the globals back to empty when it
   cannot find any.

   One place, because there are two callers and they arrive from opposite
   ends: langFirst() is the first run, where there is no language to leave,
   and langNew() is the button, where there is one and it has to be written
   out first. Minting the id twice would be two answers to what a language id
   looks like.

   IT IS THE SERVER'S NUMBER AND THE PHONE IS THE ONE THAT WRITES IT DOWN.
   This used to mint `L<ms36>` and the `language` row got a uuid of its own
   from `gen_random_uuid()`, so one language had two numbers and something
   had to hold them together. A uuid minted here IS the row's id --
   netLangRow() sends it in the insert, and the column's default only fires
   where nothing was sent. Nothing else changes: the id is still made before
   there is an account, which is what the onboarding needs, and the number
   the walk makes is the number the row is given at the door. */
function langMint(){
  var id=uuid4();
  while(LANGS[id]) id=uuid4();
  /* THE ENTRY SAYS THE LANGUAGE IS HERE AND NOTHING ELSE. It carried
     `mine:true` -- 「this phone made it」 -- and that boolean is what four
     functions read to decide whose a language was. Whose it is is
     `language.owner` (§ langWhose); an entry is a place in the index.
     Nothing removes the field from an entry an older version wrote
     (docs/DATA_SAFETY.md rule 2); it is simply never written again and never
     read. */
  LANGS[id]={};
  return id;
}
/* A UUID V4, AND THIS IS THE ONE PLACE ONE IS MADE.
   crypto.getRandomValues where there is one, which is every WKWebView this
   app runs in. The fallback is not a security decision -- nothing is guarded
   by this number; it is a name that must not collide with another name made
   on another phone in the same second.

   It is HERE and not in www/net.js, where netUUID() used to hold it, because
   a language is named before net.js has been loaded: langsOneId() below runs
   while this file is still being read. netUUID() is this function under the
   name www/post.js calls it by. */
function uuid4(){
  var b, i, h='', c=window.crypto || window.msCrypto;
  b=new Uint8Array(16);
  if(c && c.getRandomValues) c.getRandomValues(b);
  else for(i=0;i<16;i++) b[i]=Math.floor(Math.random()*256);
  b[6]=(b[6] & 0x0f) | 0x40;      /* version 4 */
  b[8]=(b[8] & 0x3f) | 0x80;      /* variant   */
  for(i=0;i<16;i++){
    h+=(b[i]<16? '0':'')+b[i].toString(16);
    if(i===3 || i===5 || i===7 || i===9) h+='-';
  }
  return h;
}
/* A LANGUAGE THAT IS ONLY READ, in the index and nowhere else yet.
   ------------------------------------------------------------------
   The third place that writes to LANGS, and the first that has ever written
   `mine` false. langMint() above writes true, which is why
   docs/DATA_MODEL.md said this state 「does not exist」:
   the switch that says a chapter may be taken away has been built more than
   once and the taking never was.
   「ダウンロードボタン押しても言語追加されないけど？」 OWNER 2026-09-01.

   ITS ID IS THE SERVER'S. Every other language is minted here and has no id
   anywhere else; this one already has one, and using it is what makes a
   second download of the same language ARRIVE IN THE SAME PLACE rather than
   making a second copy. That matters because a download is one chapter at a
   time -- 「いや一つづつdlでいいよ」 OWNER 2026-09-01 -- so the letters today
   and the keyboard tomorrow have to land in one language.

   The NAME is only filled in if there is not one already: the row is made
   the first time a chapter is taken and a later download must not rename a
   language somebody is reading. */
/* AND IT CARRIES WHOEVER WROTE IT. A downloaded language is somebody else's
   language sitting in YOUR index, and `language.owner` is what says so --
   langWhose() (§ langWhose) reads it and nothing else. Without the stamp the
   language belongs to nobody and is drawn on neither side of the list.
   langNew() puts the same lines on a language somebody MAKES; this is the
   reading side of it. */
function langSeenAdd(sid, name, owner){
  var id=String(sid||'');
  if(!id) return '';
  if(!LANGS[id]) LANGS[id]={};
  /* and what the server said it is called. It used to be filled in only when
     the index had nothing, so a second download could not rename a language
     somebody was reading; the name is the server's answer now and a fresher
     one of those is not a rename. */
  /* WHO WROTE IT FIRST. It used to stamp whoever was signed in -- 「whoever
     took it」 -- into the same field a language's own maker went into, so one
     word answered two questions and the two came apart exactly here. Who
     wrote it is `language_seen.owner` and comes in with the row; that this
     account TOOK it is a `language_take` row and netTakePut() writes it.
     First, because every picture after it asks langOut(), which is this
     answer (§ slGot). */
  if(owner) langOwnGot(id, owner);
  if(name) langNameGot(id, name);
  langStore();
  return id;
}
/* ---- WHOSE A LANGUAGE IS, IN ONE PLACE, AND THE PHONE SAYS NONE OF IT ----
   「誰の物か・あるか無いか・名前・公開か・段 ── 答えは全部サーバー」
   OWNER 2026-09-11 (docs/FEATURE_RULES.md § 端末は何も決めない).

   FOUR FUNCTIONS ASKED THIS AND THEY DID NOT AGREE. langMine() read
   `LANGS[id].mine` -- a boolean this phone wrote -- and fell to 「yes」 where
   the server had not spoken; langOwned() asked the same thing and fell to
   「no」; langAcct() was the two of them multiplied, so it was false whenever
   they disagreed, and langForAcct() read that false as 「this account has no
   language」 and MADE ANOTHER ONE. That is the empty second language of
   2026-09-11, and it is what two answers to one question look like.

   ONE PLACE, AND IT ANSWERS FROM TWO THINGS THE SERVER SAID:
   langOwnOf(id) -- `language.owner`, three states -- and langTookHas(id) --
   a row in `language_take`. Nothing here reads the index for anything but
   whether the entry is here at all.

   FOUR ANSWERS, and the fourth is not a side of the other three:

     LW_MINE  this account wrote it. Writing, counting and saving are this
                and nothing else.
     LW_READ  somebody else wrote it and this account took it -- a language
                you switch to and USE, and nothing in it is yours to change
                （「dl言語はへんしゅうはできない」 OWNER 2026-09-01).
     LW_NONE  not this account's at all -- it did not write it and has
                not taken it. Not drawn, not counted and not written to.
                Nothing is deleted.
     LW_WAIT  NOBODY HAS SAID YET. Not a side to fall to: 「mine」 lets a
                save reach somebody else's language and 「theirs」 hides a
                language from the person who made it. Nothing is made,
                deleted, counted, shown or written while this is the answer,
                and what a screen shows is 「接続できません」 rather than
                「まだ何もない」.

   `LANGS[id].mine` is NOT READ HERE OR ANYWHERE. Nothing removes what an
   older version wrote -- the field stays on every entry that has it
   (docs/DATA_SAFETY.md rule 2) -- it is simply not a thing that decides. */
var LW_MINE='mine', LW_READ='read', LW_NONE='none', LW_WAIT='wait';
function langWhose(id){
  var k=String(id||''), me, own;
  if(!k || !LANGS[k]) return LW_NONE;
  me=netUid();
  /* NOBODY SIGNED IN IS THE WALK, and it is the one answer that needs no
     server: there is nobody to compare with, the phone is holding the
     language it is making, and the door is on the way out
     （「オンボーディング→最後にログイン」). Signed out is the door
     everywhere else -- appIs() (www/shell.js) -- so nothing but the walk
     ever gets this answer. */
  if(!me) return LW_MINE;
  own=langOwnOf(k);
  if(!own) return LW_WAIT;
  if(own===me) return LW_MINE;
  /* Somebody else wrote it. Whether THIS account is one of the people
     reading it is `language_take`, counted on the server -- and `null`
     there is 「not asked」 rather than 「no」 (§ LTAKE). With no signal that
     is what a launch has, so somebody else's language waits rather than
     being drawn under an account that may not have taken it: 「違うアカウント
     でログインしてんのに前のやつ出てくるんだけど？」 OWNER 2026-08-31 is
     what falling to 「read」 here looks like. */
  if(LTAKE===null) return LW_WAIT;
  return langTookHas(k)? LW_READ : LW_NONE;
}
function langMine(id){ return langWhose(id)===LW_MINE; }
/* ---- WHETHER A LANGUAGE MAY LEAVE MEMORY -- THE ONE QUESTION -------------
   「カード投稿はok」「svgやファイル書き出しはng」「だから端末に置くのもng」
   「サーバーであればスクショ以外で持っていけないでしょ？著作権関連するんだから
   そこはしっかりやろう」 OWNER 2026-09-30, on every plan.

   Somebody else's language is USED inside Lingua -- its letters shown and
   typed in this app's own fields, posts written in it, its meanings read --
   and it lives on the server and in memory while the app runs. Nothing of it
   goes anywhere else: not a file (a font, an SVG, a sheet, a word's card),
   not the clipboard, not the system keyboard's App Group, and not this
   phone's disk (slGot). A card of a POST is not the language leaving -- a
   post is already on the timeline, and cardSave() lets it out as a post.

   Every way out asks this and nothing else, and `theirs-check` counts them.
   The answer is langWhose()'s, so 「nobody has answered yet」 is not 「mine」:
   nothing leaves until the server has said whose it is. */
function langOut(id){ return langWhose(id)===LW_MINE; }
/* AND WHETHER IT IS SOMEBODY ELSE'S, which is not 「not mine」.
   langWhose() has a third answer, 「not asked yet」, and a question that
   folds it into either side draws a guess (CLAUDE.md rule 22). langLocked()
   below folds it into 「not mine」 on purpose -- it is the door every WRITE
   passes, and not writing until the answer is in is right there. What a
   screen SHOWS is the other question: only the owner column having answered
   with somebody who is not this account says a language is somebody else's.
   「後人の言語は自分の言語じゃないからwikiページに表示させないように。」
   OWNER 2026-09-23 -- the wiki asks this one (www/home.js § wldPage). */
function langTheirs(id){
  var own=langOwnOf(id),
      me=netUid();
  return !!(own && me && own!==me);
}
/* AND WHETHER THE PLAN SHAPES THE OPEN LANGUAGE -- planNo() (§ has, below)
   asked of a language rather than of a person. 「dl言語は有料無料関係ないって
   何回も言ってるよね？」 OWNER 2026-09-30.

   What a plan does to a language's SHAPE -- the letters past the slots
   folded (ltSeen, www/sound.js), the words past the ceiling (wordsSeen,
   www/words.js), the stages somebody added (stAll, www/phases.js), an
   alphabet and left to right (wsys, scriptDir, www/wsys.js), no roman face
   (shareRoman, www/share.js) -- it does because the person who MADE the
   language stopped paying for making it that way. A language somebody else
   made was not made on this account's plan, so none of that touches it: it
   looks the same on every plan. What the plan decides about DOING -- adding,
   deleting, renaming a letter -- is the making side's and a taken language
   has none (langLocked).

   Every shape of the open language asks this and nothing asks planNo()
   outside this file (tools/taken-check.mjs counts them). It is the DRAWING
   question (langTheirs above), so a language nobody has answered for is
   shaped as it always was. */
function langShaped(ok){ return planNo(ok) && !langTheirs(langId); }
/* AND THE OPEN LANGUAGE, ASKED BY EVERY WRITER OF ONE. True means the caller
   must stop -- upStop()'s shape, and for the same reason: a rule that lives in
   one place and is ASKED at each road that could break it.

   「dl言語はへんしゅうはできないってなんかいもいわせんなよ」 OWNER 2026-09-01,
   and 「編集不可でそのアカウントに切り替えたらダウンロードした人の言語が使える」
   OWNER 2026-09-02 -- a downloaded language is one you switch to and USE, and
   nothing in it is yours to change.

   langOpen()'s own comment has said since it was written that what protects a
   downloaded language is not a locked door but the WRITERS, and it named four.
   Three of those asked (ltStart, a backup writer since deleted, netLangSync);
   the fourth was 「the row
   in the language list is not a button」, which is not a writer at all -- it is
   the door being shut. So SEVEN savers wrote somebody else's language without
   asking anything, and the only reason nothing was lost is that there was no
   way in. Opening the door is what made this line necessary.

   It asks the OPEN language and takes no argument on purpose: every one of
   those savers writes langKey(), which is the open language and nothing else.
   A saver given an id would be a second question.

   AND 「まだ訊けていない」 STOPS IT TOO, AND THE PICTURE IS NOT AN ANSWER.
   langWhose() is the DRAWING question and it reads langOwnOf(), which falls
   back to the picture kept for a launch with no signal -- right for drawing,
   and the reason this was not enough: on every launch, before the server had
   said anything, the picture answered 「mine」, a migration saved, the picture
   became what this phone was HOLDING, and the up road sent it. A word deleted
   on another phone came back from this one (tools/quiet-check.mjs 2,
   measured 2026-09-23).

   So a save asks what the SERVER said, in this run of the app: LOWN, the
   answer itself, and never slRd()'s picture -- the same two questions
   slRd()/slMine() are for a slice. And the launch's walk writes that answer
   only once the language's slices have landed and the open one has been read
   in from them (www/net.js § netLangsWalk), so 「the server has said it is
   mine」 is also 「what is on the screen is the server's」 -- one fact, not
   two. The walk is the one language nobody has to answer for (signed out,
   § langWhose), and one this account has just MADE has its answer written
   the moment it is made (langNew, langForAcct). A
   launch therefore looks at what was last loaded and writes none of it, which
   is the one-way road of CLAUDE.md rule 22 asked at the door every save goes
   through. */
function langLocked(){
  var k=String(langId||''),
      me=netUid();
  if(!k || !LANGS[k]) return true;
  if(!me) return false;
  return !Object.prototype.hasOwnProperty.call(LOWN, k) || LOWN[k]!==me;
}
/* ---- WHETHER THE OPEN LANGUAGE IS WRITTEN NOW -- THE ONE DOOR ------------
   「保存がサーバーに上がる時 →『保存を押したら』」「取ってきた言語を編集できるか
   →『できない』」 OWNER 2026-09-24.

   Every writer of the language asks this and nothing else -- the seven in
   LANG_IO above, and kbWrite() under saveKb(). Two answers are no:

   - langLocked() above: somebody else's language, taken to READ, or one the
     server has not answered about yet. Nothing of this phone's goes into it.
   - keepDrafting() (www/shell.js § KEEP): a screen with a Save is on the
     trail, so what is pressed there is that screen's DRAFT. It stays in the
     globals the screen draws from, the slice is not written, and the Save
     writes it (keepSave) -- 「いいえ」 puts back the language as it was when
     the screen opened (keepNo, langHeldBack below). This was the keyboard's alone (K1,
     r79, kbDrafting()); it is every screen's now, and kbDrafting() is gone.

   typeof, because core.js is read before shell.js and nothing written here
   runs a writer before both are in. */
function langWrites(){
  if(langLocked()) return false;
  return !(typeof keepDrafting==='function' && keepDrafting());
}
/* ---- AND WHAT A DRAFT IS MEASURED FROM ------------------------------------
   The language as the globals hold it, said once as a string, and put back.
   A screen with a Save keeps this when it opens (keepOn, www/shell.js), and
   「いいえ」 puts exactly that back -- not the slices: a screen reached from
   another screen with a Save is standing on that one's draft, and reading
   the slices would take the draft behind it away too. keepSnap() holds it
   for the same reason, so a Save that did not land leaves the draft on the
   screen. The nine globals are the nine the writers in LANG_IO write, and
   the tenth is the keyboards somebody built for a language they took
   (KBT, www/keyboard.js) -- theirs rather than the language's, drafted on
   the same page with the same Save. */
function langHold(){
  return JSON.stringify([WORDS, LINES, SCRIPT, LETTERS, NOTES, STG, SND, KB, WLD, KBT]);
}
function langHeldBack(h){
  var a;
  try{ a=JSON.parse(h); }catch(e){ return; }
  if(!a || a.length!==10) return;
  WORDS=a[0]; LINES=a[1]; SCRIPT=a[2]; LETTERS=a[3]; NOTES=a[4];
  STG=a[5]; SND=a[6]; KB=a[7]; WLD=a[8]; KBT=a[9];
}
/* ---- ONE EMPTY LANGUAGE, MADE WHERE SOMEBODY STARTS MAKING ONE ----------
   「オンラインで 1 端末に 1 アカウント、そのアカウントに結びつけられる言語数が
   決まってるんだから端末でやることねえ」 OWNER 2026-09-11
   (docs/FEATURE_RULES.md § 端末は何も決めない).

   THIS RAN ON EVERY LAUNCH, from this file, three lines below where it is
   declared: 「the index is empty, so mint one」. Nobody had asked for it. A
   phone whose walk was skipped (obSkipAll) then signed in, and that empty
   nameless language went up as the account's SECOND -- measured in
   docs/scope/r24-lang.md 道10.

   Whether this account has a language is the SERVER's answer: netLangsDown()
   brings down what it has, and langForAcct() makes one where it has none --
   which is already how the app behaves for anybody who reaches the door.
   There is nothing left for a launch to decide.

   TWO CALLERS REMAIN AND BOTH ARE SOMEBODY DOING SOMETHING.
   obDrawHTML() (www/onboard.js) is the walk arriving at the screen where a
   letter is drawn, which is the one place something is made before there is
   an account 「オンボーディング→最後にログイン」; and wipeHere()
   (www/settings.js) is an account being deleted, after which this phone is a
   phone with nothing on it. */
function langFirst(){
  langId=langMint();
  langStore();
}

/* Read the open language into the globals the screens use.
   Called once here, and again every time a different language is opened, so
   it puts back what an empty language looks like before it reads anything. A
   version of this that only overwrote what the incoming language happens to
   have would leave the last one's words sitting behind it -- you would open
   somebody else's language and find your own dictionary in it. */
var LSAVED='';
function langRead(){
  var gg, k;
  WORDS=slOpen('words') || []; LINES=slOpen('lines') || [];
  langName=langNameOf(langId); SCRIPT={g:{}, extra:[]};
  gg=slOpen('script');
  /* EVERY FIELD THE SLICE HOLDS IS KEPT. SCRIPT is saved whole, so a field
     this function does not carry over is a field the next save drops -- and
     it used to carry four by name (`g`, `extra`, `dir`, `sp`), a list written
     by hand that each new field had to remember to join. What is checked is
     only what the four have always been checked for: no glyphs is no
     `extra` either, a direction is a string that says something, the gap is
     a number. Absent stays absent. */
  if(gg && typeof gg==='object' && !(gg instanceof Array)){
    for(k in gg) if(Object.prototype.hasOwnProperty.call(gg, k)) SCRIPT[k]=gg[k];
    if(!gg.g){ SCRIPT.g={}; SCRIPT.extra=[]; }
    else SCRIPT.extra=gg.extra||[];
    if(!gg.dir) delete SCRIPT.dir;
    if(typeof gg.sp!=='number') delete SCRIPT.sp;
  }
  /* what the language was when it was read -- save() asks it (§ langMoved) */
  LSAVED=langShape();
}
langRead();
/* HOW THIS ACCOUNT HAS THE APP SET UP, and it goes with the account.
   -------------------------------------------------------------------------
   「端末ごとにやることなんてねえよ」「アカウントごとってずっと言ってるよな？」
   OWNER 2026-09-03, and 「端末に残すものないんですけど。サーバーで同じ機能に
   なるように代替して」 OWNER 2026-09-08.

   These five sat in SET_PHONE as 「how this handset is set up」, beside the
   theme, and that sentence was wrong about all of them: signing in on a
   second phone gave somebody the app arranged the way that PHONE happened to
   be. `profile.prefs` is one jsonb column carrying exactly this list --
   netPrefsPut() sends it, netMyProfile() brings it back once a session, and
   adding a sixth setting is a name here and nothing else.

   THE COPY IS STILL ON THE PHONE and is filed under the account --
   `lingua.set.<uid>`, acctPut() (§ ACCT) -- the way `lingua.me.<uid>` is: with no signal the app is arranged the way it was
   last seen, which is what a copy is for. What changed is which of the two is
   the RECORD. */
/* AND THE NOTIFICATIONS (2026-09-22, and the day's prompt 2026-09-23).
   Which kinds they are is push-send's `PUSH`, and tools/push-check.mjs holds
   the `push_` names here to it. Which kinds somebody wants told
   to them is theirs and not this handset's: a person with an iPhone and an
   iPad wants 「いいね」 off on both, and the permission -- which IS the
   handset's -- is iOS's to hold, not ours.

   THE NAMES ARE THE SERVER'S NAMES. netPrefsPut() writes `SET`'s own
   spelling into `profile.prefs`, so `push_follow` here is `push_follow`
   there, and the function that decides who to send to reads that one
   word. **Absent is ON**, on both sides: nobody who has never opened the
   room has any of these, and no default is minted -- www/push.js
   § pushWants(). */
/* AND HOW FAR DOWN THE NOTICES SOMEBODY HAS READ (`notAt`, r79). One time,
   because 「最後に通知の画面を開いた時刻より新しいものを未読とする」 OWNER
   2026-09-01 -- and its reason was that a time is the same answer whichever
   phone it is opened on, which is only true if the time goes with the account
   (「通知をどこまで読んだか…全部アカウントのもの」 2026-09-03). No table of
   read notices: one number, the same column as everything above. */
var SET_PREFS=['theme','ui','myfont','showScript','kbrom',
               'push_follow','push_reply','push_quote','push_like','push_boost','push_prompt',
               'notAt'];
/* WHAT IS LEFT IS THIS HANDSET'S SETUP, AND THERE IS VERY LITTLE OF IT.
   `acct` is what an older version wrote to say which account's things were
   live here, and it is only READ now -- by the move that copies them under
   that account (§ acctMoved), whose mark is `acctMoved`. `doneMoved` is a
   migration mark of a field that was this handset's. `vvkb` was here -- a
   measurement of this screen's keyboard -- and is not named any more: the
   phone ends the screen at the keyboard itself (2026-09-25, ios/App/App/
   MainViewController.swift § keepStill), and it is taken off the phone at
   launch (§ SET_GONE, OWNER 2026-09-26). `obback` is the onboarding's: where
   a phone with no session was standing when it was sent to the door, which
   no server can be asked (docs/reports/r8-item2-2026-09-08.md).

   `walked` is the ONE thing about the onboarding that is left here, and it is
   here because the OWNER put it here (2026-09-09, choice A). `SET.done`
   answered two questions with one flag: 「has this ACCOUNT been through the
   walk」, which is the `profile` row on the server and is asked there now, and
   「which screen does a phone with NO SESSION open on」, which nothing can
   answer -- signed out there is nobody to ask, and after an account is
   deleted the row is gone. Two written decisions turn on that second one
   (「ログアウトしたら普通にログイン画面だけ出せばいいやろ」 OWNER 2026-08-26,
   「アカウント削除した後オンボーディングから始まるのはなぜ？」 OWNER
   2026-09-03), so it stays -- named for what it actually says, and asked by
   appIs() (www/shell.js) for which screen a phone with no session opens on.

   `planV` was here and is gone with the plan; `order`, `read`, `voice` and
   `script` were here and are taken off the phone (§ SET_GONE). */
var SET_PHONE=['acct','acctMoved','walked','obback','doneMoved'];
/* Settings saved by an older version are missing whatever was added since, so
   they are laid over the defaults rather than replacing them. Written out by
   hand because Object.assign is not ES5 and this has to run on an old phone.

   TWO KEYS, AND ONLY THE HANDSET'S SETUP IS IN `lingua.set` (§ SET_PHONE).
   The rest is the account's and is `lingua.set.<uid>` (§ ACCT) -- read for
   the account in hand, written the moment it is written. What an older
   version put in `lingua.set` beside the setup is left there and not read:
   the stamped account's copy was moved under its name (acctMoved), and
   anything else is nobody's. */
/* WHAT IS TAKEN OFF THE PHONE'S SETTINGS, AND IT IS ONE LIST AND ONE WAY.
   Fields of `SET` that nothing reads any more and that the owner said go:
     vvkb    how much of this screen the keyboard covered -- the phone ends the
             screen at the keyboard itself (2026-09-25, ios/App/App/
             MainViewController.swift § keepStill). 「1 消す」 OWNER 2026-09-26
     order   the word order from before a language had a stage of its own,
     script  roman -> a borrowed character from before LETTERS existed --
             both only ever read to copy an older version's language across,
             and a language lives on the server (CLAUDE.md rule 22)
     read    minted by setDefaults() and read by nobody
     voice   the same
   「消していいよ」 OWNER 2026-09-26 for the last four. The DELETE REVIEWs are
   docs/CHANGELOG.md 2026-09-25 and 2026-09-26. None of them is something
   anybody made. They sit in `lingua.set`, where an older version wrote them,
   and in an account's `lingua.set.<uid>` where acctMoved() copied them; both
   are taken off here, on every launch, BEFORE anything reads the settings,
   and a copy that has none of them is not written at all. Nothing else in
   either copy is touched. A field that is to go is a name added here, and
   nothing else -- there is no second way to take one off. */
var SET_GONE=['vvkb','order','script','read','voice'];
function setGoneDrop(){
  var keys=[], i, j, k, v, hit;
  try{ for(i=0;i<localStorage.length;i++) keys.push(localStorage.key(i)); }catch(e){ return; }
  for(i=0;i<keys.length;i++){
    k=String(keys[i]);
    if(k!==LS_S && k.indexOf(LS_S+'.')!==0) continue;
    v=acctRaw(k);
    if(!v || typeof v!=='object' || typeof v.length==='number') continue;
    hit=false;
    for(j=0;j<SET_GONE.length;j++)
      if(Object.prototype.hasOwnProperty.call(v, SET_GONE[j])){ delete v[SET_GONE[j]]; hit=true; }
    if(!hit) continue;
    saveTry(function(){ localStorage.setItem(k, JSON.stringify(v)); });
  }
}
setGoneDrop();
/* This handset's own setup, off `lingua.set` -- read through acctRaw(), the
   one reader of a disk key, inside a function so the load leaves no `s` and
   `sk` lying about as globals (rule-audit-2026-09-27-core C5). */
function setPhoneRead(){
  var v=acctRaw(LS_S), k;
  if(!v || typeof v!=='object') return;
  for(k in v)
    if(Object.prototype.hasOwnProperty.call(v, k) && SET_PHONE.indexOf(k)>=0) SET[k]=v[k];
}
setPhoneRead();
acctKeep('set', setMine, setGot, LS_S, function(v){
  var out={}, k;
  if(!v || typeof v!=='object') return null;
  for(k in v) if(Object.prototype.hasOwnProperty.call(v,k) && SET_PHONE.indexOf(k)<0) out[k]=v[k];
  return out;
});
/* ---- THE KEYCHAIN IS NOT READ --------------------------------------------
   The plan is `verify-plan`'s answer, held in memory (§ PLAN), in today's
   names. `ios/App/App/LinguaPlan.swift` still writes and reads its own key
   and nothing in `www/` asks it (docs/BACKLOG.md). */
/* AND THE FLAG THAT USED TO ANSWER TWO QUESTIONS, MOVED TO THE ONE IT KEEPS.
   -------------------------------------------------------------------------
   OWNER 2026-09-09 (choice A). `SET.done` was 「the onboarding is finished」
   and it was read as both 「this ACCOUNT has been through」 -- which is the
   `profile` row on the server, and is asked there now -- and 「this HANDSET
   has been past the walk」, which is the only half nothing on a server can
   answer: signed out there is nobody to ask, and after an account is deleted
   the row is gone.

   So the flag keeps the second question and is named for it. This copies the
   old value across ONCE, on the launch after the update -- and COPIES: the old
   field stays exactly where it was (a migration copies and never removes what
   it read, CLAUDE.md § Data; it used to `delete SET.done`, r69-misc 申し送り 2).
   Nothing reads `done` any more, so leaving it costs nothing; what said 「this
   has been moved」 was its absence, and that is `doneMoved` now -- a mark of
   this handset's, because what it marks (`walked`) is this handset's
   (§ SET_PHONE). A mark belongs to whoever owns what it marks. A phone that has never had the
   old field is untouched: absent is not false, it is 「there was nothing to
   move」, and setDefaults() answers for a fresh install. It runs as the file
   is read, so it is moved before anything reads it. */
function walkedMigrate(){
  /* `done` is read off the disk where an older version left it: it is not
     one of this handset's fields (§ SET_PHONE), so the load does not bring it
     into SET (r79). */
  var old=acctRaw(LS_S), done=(old && typeof old==='object')? old.done : undefined;
  if(done===undefined || SET.doneMoved) return;
  if(SET.walked===undefined || SET.walked===false) SET.walked=!!done;
  SET.doneMoved=1;
  setKeep();
}
walkedMigrate();

/* Switch which language is open. Order matters: the language that is open
   when this is called has to be written out before langId changes, or its
   words end up saved under the language being switched to. */
function langOpen(id){
  if(!LANGS[id] || id===langId) return;
  /* AND IT DOES NOT REFUSE A LANGUAGE THAT IS ONLY READ, though the first
     version of this did. `tools/migrate-check.mjs` holds CLAUDE.md's rule 6 --
     「a language somebody already has still opens」 -- with a fixture whose
     second language is somebody else's, and a refusal here turned that
     check red on the one thing it says may never be shipped red.

     So what a downloaded language is protected by is not a locked door here.
     It is the WRITERS, and they ask one question: langWrites() (§ langLocked
     below) says no for somebody else's language, and every saver asks it.
     docs/DATA_MODEL.md § A language that is only read. */
  /* The app's own writes (§ LTOUCH): the old language written out as it
     stands, and the new one's top-ups and migrations. None of it is somebody
     changing their language, so none of it goes up by itself -- it rides the
     next thing a person saves in that slice. */
  slAsApp(langSaveAll, []);
  langId=id; langStore();
  /* LANG_IO is the list; ltStart() and migrateKbFree() are not reads and
     stay -- one tops a free language up, the other brings an older shape
     forward. */
  langLoad();
  slAsApp(migrateAll, []);
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
   failed -- stayed account-less, and langWhose() reads an account-less
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
  /* AND WHO WROTE IT, which is not a guess: `language_make` in
     supabase/schema.sql is `owner = auth.uid()`, so the row this language
     gets can say nothing else. It is written where the language is MADE
     rather than where the row is, because between the two is a phone that may
     be in a tunnel for a week -- and an un-uploaded language with nobody on
     it is the one A made and B signs in and takes (acct-check 10).

     langFirst() and langMint() do not: they run before there is an account,
     which is the walk, and the door is where what it made gets one. */
  var id=langMint();
  if(netUid()) langOwnGot(id, netUid());
  langStore();
  langOpen(id);
  /* AND IT STARTS WITH AN ALPHABET, ON EVERY PLAN.
     「文字0はアルファベットでいいやん」 OWNER 2026-09-12.

     ltSlotsFill() (www/letters.js) is the one place the thirty-eight slots
     are laid down -- a to z, ! ?, and a digit for every value the base can
     write -- and langOpen() above has just run ltStart(), which lays them
     only for a FREE language: a paid plan may delete and rename its letters,
     so a launch that topped one up would put back what somebody took away.
     MAKING a language is the other moment, and it is not a plan question.
     Measured 2026-09-11 (hunt #6): 「言語を追加」 on the paid plan gave a
     language with no letters, and the first word typed into it came back
     「つづりは2文字以上必要です」 with nothing to spell it out of.

     After langOpen(), because LETTERS is the open language and this is the
     one that has just been opened; before netLangSync() below, so the letters
     go up with the language rather than on the next save. */
  if(typeof ltSlotsFill==='function') ltSlotsFill();
  /* AND IT GOES UP AS IT IS MADE. A language LIVES on the server (CLAUDE.md
     § Online) and a slice is in memory (rule 22), so a language that is made
     and not sent is a language that is gone when the app closes. Measured
     2026-09-11 (hunt #12): the row only appeared on the NEXT launch, out of
     www/boot.js -- so 「言語を追加」 and then closing the app lost it, with
     nothing on screen to say so.

     netLangSync() is the one road that puts a language up and it decides
     everything itself -- nothing without a session, nothing without a
     language, safe to call twice -- which is why this is a call and not a
     condition. It is the same line the door runs (www/net.js § netTook), at
     the other moment something is made. */
  if(typeof netLangSync==='function') netLangSync();
}

/* The dictionary, the lines and the writing -- AND the settings, which every
   save has carried since before setKeep() existed, and which forty-odd callers
   in files that are not this one still reach through here. The settings go
   first and always: a language that may not be written (somebody else's, or
   the picture before the server has answered) is no reason to lose the theme
   somebody just chose. It used to decline both at once. */
/* ---- EVERY OLD SHAPE BROUGHT FORWARD, AND ONLY WHERE IT CAN BE WRITTEN ----
   One list, and three moments ask it: the launch (www/boot.js), the open
   language becoming writable (langOwnGot above), and a language being opened
   (langOpen). It was a list at the foot of boot.js and a shorter one here, and
   the boot one ran while the screen was still the picture -- where langLocked()
   refuses every save -- so migrateWorld() raised its mark and wrote nothing,
   and the copy it was moving was never moved again (r69-misc 申し送り 1).

   So the language being writable is asked ONCE, here, before anything moves;
   a migration that cannot write does not run and raises no mark, and runs the
   moment it can. Every one of them fills in what is missing and stops, so a
   second run finds nothing to do. The app's own writes, always: every caller
   wraps it in slAsApp() (§ LTOUCH). */
function migrateAll(){
  if(langLocked()) return;
  /* migratePh() stood first here and is gone (2026-09-23, r73 § 2-8): it
     wrote a guess into every word with no sounds -- a word made today has
     none on purpose (www/wordsheet.js § addOne), and one somebody emptied
     had its guess written back on the next launch. wPh() guesses when it
     reads, so nothing on a screen moves. 「保存を押したときだけ、保存されて
     いるものが変わる」 OWNER 2026-09-04. */
  migrateMn();
  /* and a part of speech saved as its label rather than its key */
  migratePos();
  migrateLetters();
  migrateMarks();
  migrateSndName();
  migrateSnd();
  migratePosts();
  /* and what the language is for, off the phone and into the language */
  migrateWorld();
  /* and the word order and the three positions a person chose when they were
     the person's, into the language (www/phases.js). It stood at the top of
     that file, outside this list -- so it ran before any answer, whether or
     not the language could be written, and nothing held it (r73 § 2-2). Here
     it is asked the one question every migration is. The open language's
     stages are read again after it, because it writes the slice they were
     read from. */
  migrateGramLang();
  stRead();
  /* and the face of an account from before there was one on file (www/me.js) */
  migrateAv();
  /* and the free QWERTY out of the keyboard list, keeping an edited one */
  migrateKbFree();
  /* and a free language gets its thirty-eight slots (ltSlotsFill) */
  ltStart();
}
/* NOT SAVING IS THE SPEC, SAVING AND SAYING NOTHING IS NOT (rule 11).
   A language this phone may not write -- the server has not said it is this
   account's yet, or it is somebody else's -- is not written, and that is
   right. It used to return here in silence, with what was typed still on the
   screen and nowhere else, and a migration saving the language later took it
   in as the app's own write (r60 見つけたこと). So the one sentence a save
   that did not land says -- saveNo(), the same one saveTry() says -- is said
   here too, when something typed is what was not written -- the language
   differs from what it was when it was last read or written (LSAVED) --
   because this is also the call every settings-only change makes, and those
   did save. */
function langShape(){ return JSON.stringify([WORDS, LINES, SCRIPT]); }
function langMoved(){ return langShape()!==LSAVED; }
function save(){
  setKeep();
  if(!langWrites()){ if(langLocked() && langId && langMoved()) saveNo(); return; }
  bkTouch();
  saveTry(function(){
    slWr(langKey('words'),JSON.stringify(WORDS));
    slWr(langKey('lines'),JSON.stringify(LINES));
    slWr(langKey('script'),JSON.stringify(SCRIPT));
    langStore();
    LSAVED=langShape();
  });
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
      Money buys what a person may DO (CAN, below) and never what exists:
      the words past a ceiling are all still there (docs/PAID_FEATURES.md).
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
   lines:['plan.free.1','plan.free.2','plan.free.6','plan.free.3','plan.free.5','plan.free.4']},
  /* The middle rung. Its price is here and its subscription is not in App
     Store Connect yet, which is not a hole: StoreKit returns nothing for a
     product that does not exist, so the card is on the screen and the button
     does nothing until the product is made. What is NOT allowed is the other
     way round -- a product on sale that the app does not name. */
  {id:'plus', name:'Plus', mo:'plan.price.plus', yr:'plan.price.plus.yr', off:'17',
   lines:['plan.plus.1','plan.plus.2','plan.plus.3','plan.plus.4','plan.plus.7','plan.plus.6']},
  /* Pro opens with "everything in Plus, and:" rather than repeating the lines
     above it. Three pages that each list everything are three pages somebody
     has to compare word by word; the ladder is the thing being sold and it
     should be readable by scrolling.

     THE CEILINGS ARE ON THE CARDS, and that is 「何で入ってないの？」 OWNER
     2026-09-03: a number langCap() or dlCap() sells that is on no card is the
     app charging for something it never said it had. Each is a NAME and not
     a sentence (「アプリ内に説明書くの禁止」): free's one download
     (plan.free.6), plus's three and three (plan.plus.7 / plan.plus.6), and
     pro's none (plan.pro.6 / plan.pro.7). Free's one language of its own
     has never had a line, and whether it gets one is the owner's. */
  {id:'pro',  name:'Pro',  mo:'plan.price.pro', yr:'plan.price.pro.yr', off:'17',
   lines:['plan.pro.1','plan.pro.2','plan.pro.4','plan.pro.5',
          'plan.pro.6','plan.pro.7','plan.badge']},
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
   a commit may not be two of. tools/fixture.mjs names it. */
var FREE_LIMIT=100, PLUS_LIMIT=1000;
function wordCap(){
  if(can('words')) return Infinity;
  return planNum(FREE_LIMIT, PLUS_LIMIT, Infinity);
}
/* HOW LONG A POST MAY BE. 「plusプランから無限だけど、もっと読むで開く
   Twitterと同じ方式で頑む。」 OWNER 2026-09-15.

   The same shape as wordCap() above, and NO CAPABILITY IS ADDED: everybody
   may post, and the only thing a plan changes here is a NUMBER, so a
   capability would be a price with nothing behind it.

   It answers for BOTH fields of the composer, the line and what it means.
   「文字数制限つけても翻訳でアホみたいに文字書けばいいわけでしょ？それに困るのよ」
   -- a ceiling on one row with none on the row under it is not a ceiling, and
   that is what this app had: POST_MAX was on the line alone and the meaning
   had no attribute and no line in pwSetMn().

   POST_MAX (www/post.js) is the free number. It is declared there because it
   is the composer's, and this is the only place the PLAN is asked about it.

   Nobody-has-answered-yet is `null` and not the free number (§ planNum): the
   ring is not drawn and the press says 「接続できません」. Nothing of
   anybody's is lost by the ceiling either way -- it refuses a press, it never
   shortens what is already written (docs/PAID_FEATURES.md,
   docs/DATA_SAFETY.md). */
function postCap(){
  return planNum(POST_MAX, Infinity, Infinity);
}
/* How many languages of their own this person may have. Free 1, Plus 3,
   Pro none -- 「作れる言語も1、3、無限にするのはどう思う？」 OWNER 2026-09-30.

   Pro is Infinity, which is what "no ceiling" is everywhere in this file
   (wordCap(), postCap()): the arithmetic is the same, and planFits() never
   says no to it, so there is no rung on which the + goes away. */
var FREE_LANGS=1, PLUS_LANGS=3;
/* THREE STATES AND NOT TWO, and the third is 「nobody has asked」 rather than
   the free number. 「前に読み込んだの出していいよ。何か更新するならクルクルが
   必要」 OWNER 2026-09-12, and 「未回答は free ではない」 OWNER 2026-09-11
   (docs/FEATURE_RULES.md § 端末は何も決めない).

   `has()` answers FALSE while nobody has asked, which is right for a BUTTON
   and wrong for a NUMBER: a launch with no signal worked this out as the free
   ceiling and the language list then folded away everything past it -- a
   person in a tunnel opened the app to one language and 「2 hidden」, which is
   this phone deciding from an answer it has not been given. The plan is in
   memory (rule 22), so a launch with no signal never has one.

   `null` is that state and it is not a number (§ planNum): langsSeen()
   (www/home.js) does not cut on it, so nothing is folded away and no count is
   drawn. It does not loosen the ceiling -- langStop() below hands it to
   upStop(), which says 「接続できません」. */
function langCap(){
  return planNum(FREE_LANGS, PLUS_LANGS, Infinity);
}
/* And what it is compared against: the languages that are THIS PERSON'S.

   LW_MINE and not the length of LANGS, because LANGS holds every kind:
   langSeenAdd() above makes an entry for a language taken off somebody else's
   page, and vLangs() (www/home.js) draws the lists that answers.

   A language somebody else made is not one this person made, and a ceiling
   that filled up because you looked at somebody's work would be a punishment
   for using the app. So they are TWO NUMBERS and not one --
   「自分の言語+DL言語1個」 (OWNER DECISION 2026-08-25, docs/FEATURE_RULES.md),
   「別に数える」 (OWNER 2026-09-01). dlCount() against dlCap() is the other
   one, below.

   docs/DATA_MODEL.md § a language that is only read. */
/* langWhose() (above) is the one place that says which kind an entry is;
   nothing here asks a second time. LW_WAIT is not counted -- a ceiling
   measured against languages nobody has answered for refuses a person their
   own next language, or lets through one too many. */
/* AND `null` WHERE THE SERVER HAS NOT SAID, which is dlCount()'s shape and
   the same sentence. The index is on the disk and outlives the rows it names,
   so counting it with no answer in hand is this phone deciding how many
   languages an account has -- and what that decided, on a real phone on
   2026-09-15, was 「アップグレードが必要です」 about two rows the owner had
   just deleted. § LMINE above. langStop() below refuses with 「接続できません」
   before the number is ever reached. */
function langCount(){
  var n=0, id;
  if(!langMineKnown()) return null;
  for(id in LANGS)
    if(Object.prototype.hasOwnProperty.call(LANGS, id) && langWhose(id)===LW_MINE) n++;
  return n;
}
/* ---- WHICH ONE IS THE MAIN ONE, AND IN WHAT ORDER THE LIST GOES --------
   「無料はそもそも1つの言語しか出ないやろ。一番最初に作ってた作り込んでた言語
   だけ表示であとは隠すだろ」「そもそも最初に作った言語を主言語にして、フリーに
   した時に最初に表示されるようにしないとダメでは？」 OWNER 2026-09-12.

   ONE RULE, AND THE SERVER ALREADY WROTE IT DOWN. `profile_seen.lang_id`
   (supabase/schema.sql) is `language_seen` ordered `created_at asc limit 1`,
   so the language on somebody's profile is the first one they made. This is
   the same column read the same way, off § LMADE above -- not a second
   opinion the phone works out for itself.

   THE NAME IS NOT langsOld(). `langsOldId()` above already means 「an id an
   older version of this app wrote」, and two names one letter apart answering
   about two different kinds of 「old」 is the kind of pair somebody greps for
   and gets wrong. This one is about AGE and says so.

   IT IS THE ORDER AND langMainId() IS ITS FIRST ELEMENT, deliberately: the
   list that gets folded and the language that gets opened when it folds must
   never be able to disagree, and two functions each working it out is exactly
   how they would. langsSeen() (www/home.js) cuts what this returns.

   AN UNANSWERED DATE GOES LAST. A language minted on this phone has no row
   yet and therefore no `created_at`, and it is the NEWEST thing in the index
   rather than the oldest -- 「答えが無い」 and 「古い」 are different states
   and must not share a branch. The sort is otherwise stable: equal keys keep
   the order they were handed in, which is the index's. */
function langsByAge(ids){
  var out=(ids && typeof ids.length==='number')? ids.slice(0) : [], at={}, ord={}, i;
  for(i=0;i<out.length;i++){ at[out[i]]=langMadeOf(out[i]); ord[out[i]]=i; }
  out.sort(function(a, b){
    var x=at[a], y=at[b];
    /* 「nobody has said」 last, and two of them keep the order they came in */
    if(!x !== !y) return x? -1 : 1;
    if(x!==y) return x<y? -1 : 1;
    return ord[a]-ord[b];
  });
  return out;
}
/* THE MAIN LANGUAGE: the oldest one this ACCOUNT wrote, and `null` where it
   has none. LW_MINE and not the length of LANGS, for langCount()'s reason --
   the index holds languages this account took as well, and that is not 「the first language you made」.

   `null` is 「there is no such language」 and callers do nothing on it: it is
   what the walk has before the door (nothing is anybody's yet), and what a
   launch with no signal has while langWhose() is still answering LW_WAIT. */
function langMainId(){
  var mine=[], id;
  /* 「NOBODY HAS ASKED」 IS NOT 「THIS ACCOUNT HAS NONE」, and the two share a
     return value here on purpose: every caller already does nothing on `null`.
     What they must not do is act on a main language worked out from an index
     the server has not confirmed -- langForAcct() below would open a language
     whose row is gone, or mint a second one beside the ones it could not see.
     § LMINE above. */
  if(!langMineKnown()) return null;
  for(id in LANGS)
    if(Object.prototype.hasOwnProperty.call(LANGS, id) && langWhose(id)===LW_MINE) mine.push(id);
  mine=langsByAge(mine);
  return mine.length? mine[0] : null;
}
/* AND WHERE THE CEILING MOVED UNDER SOMEBODY'S FEET, THEY ARE PUT BACK ON THE
   LIST. 「そもそも最初に作った言語を主言語にして、フリーにした時に最初に表示
   されるようにしないとダメでは？」 OWNER 2026-09-12.

   ONE PLACE, AND IT ASKS THE LIST ITSELF. langsSeen() used to swap the open
   language in over the last of the first `cap` so that a switcher always
   held the language you were standing in -- which made the one language a
   free plan shows 「whichever was open」 rather than 「the first one you
   made」. That line is gone (www/home.js), and this is what holds the same
   thing from the other end: the moment the ceiling actually moves, somebody
   standing in a language the list no longer shows is moved to the main one.

   IT DOES NOT WORK THE LISTS OUT AGAIN. langsList() (www/home.js) is what
   vLangs() draws, and this asks that -- two functions each deciding 「is the
   open language on the switcher」 is two answers to one question, and the
   whole of what this does depends on giving the same one the screen does.

   ONLY DOWNWARDS, and that falls out rather than being tested for: a ceiling
   going UP cannot take a language off the list, so the open one is still on
   it and nothing happens. A plan nobody has answered for is langCap() ===
   null, which folds nothing at all, so nothing happens there either.

   `null` from langMainId() is 「this account has no language of its own」 --
   the walk before the door, and a launch where langWhose() is still waiting.
   langOpen() is not called on it: there is nowhere to go, and inventing one
   is what made the second empty language of 2026-09-11. */
function langMainFall(){
  var seen, main;
  if(!langId) return;
  /* AND 「NOBODY HAS SAID WHOSE THIS IS」 IS NOT 「IT IS NOT ON THE LIST」.
     langsList() leaves an LW_WAIT language out of both lists, which is right
     for DRAWING -- this phone is not going to put somebody else's language
     under your name -- and is not an answer to the question here. A launch
     that hears the plan before it hears the rows would otherwise walk the
     person off the language they had open, because the owner column had not
     landed yet. */
  if(langWhose(langId)===LW_WAIT) return;
  seen=langsList();
  if(seen.mine.indexOf(langId)>=0 || seen.reading.indexOf(langId)>=0) return;
  main=langMainId();
  if(main && main!==langId) langOpen(main);
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

   The app's own pop (popAsk, through upStop), answerable with "no" --
   the system's dialog is banned (CLAUDE.md § Shape). Nobody is moved unless
   they say yes.

   There is always somewhere to fly to: the top rung has no ceiling
   (langCap() above), so a ceiling is only ever met on a rung with a bigger
   one above it.

   NOTHING HERE REMOVES OR COUNTS DOWN ANYTHING, AND THE LIST FOLDS.
   「有料が消えて無料に残った後は非表示じゃないの？」 OWNER 2026-09-12.
   Somebody who already has more than this -- a plan that ended, a number that
   moved -- keeps EVERY one of them, byte for byte, on the server and in the
   copy this phone is holding. What the LIST draws is this many, with
   「非表示 n」 under it (langsSeen(), www/home.js) and the one they are standing
   in among them. Paying again draws them all and nothing has to be restored,
   because nothing went. Only the NEXT one is refused.

   A ceiling that is not a number folds nothing: `null` is 「nobody has asked
   what this account pays」 and a launch with no signal shows everything that is
   here rather than a free-sized list. */
/* ---- and how many you may have DOWNLOADED, which is a second number ------
   「dlはしかもplusは1つproは3つ DL言語とmake言語でそれぞれ別の最大値ね？」
   OWNER 2026-09-02 for the two ceilings, and 「DL言語1言語無料、plus、3言語、
   pro無限にしない？」 OWNER 2026-09-30 for the numbers: Free 1, Plus 3, Pro
   none.

   TWO CEILINGS AND NOT ONE. A language somebody else made is not one this
   person made, and langCount() above says so already -- it counts `mine`, so
   a download has never touched the ceiling on making. This is the other side
   of that sentence: downloads have a ceiling of their own, and filling it
   leaves the making one exactly where it was.

   EVERY PLAN MAY TAKE, so there is no door in CAN for it and nothing asks
   whether a download may happen at all -- it was a door in CAN while free
   was nought (「plusからです」 2026-09-02). How many is the one thing a plan
   decides, and it is this.

   NOTHING HERE REMOVES OR COUNTS DOWN ANYTHING, AND THE LIST FOLDS, exactly as
   langCap() above says it: somebody whose plan ended keeps every language they
   took, the list draws this many with 「非表示 n」 under it, and only the NEXT
   download is refused. 「有料が消えて無料に残った後は非表示じゃないの？」 OWNER
   2026-09-12. `null` folds nothing, for the same reason. */
var FREE_DL=1, PLUS_DL=3;
function dlCap(){
  /* 「nobody has asked」 is not the free number, exactly as langCap() above: a
     launch with no signal answered ZERO here and every language somebody had
     taken off another page was folded off the list, with 「1 hidden」 at its
     foot. */
  return planNum(FREE_DL, PLUS_DL, Infinity);
}
/* The languages this person is READING, AND IT IS THE SERVER'S COUNT. It walked this phone's index -- entries with
   `mine` false carrying this account's stamp -- and that stamp was 「who took
   it」 kept on one handset, so the same account on a second phone counted
   nought and the ceiling was one ceiling per handset rather than per account.
   `language_take` is the table and netTakes() (www/net.js) is what asks.
   `null` is 「not asked」 and dlStop() is what waits for it. */
function dlCount(){ return langTook(); }
/* The ceiling on downloads, met. langStop()'s shape exactly, and the same
   sentence: 「全部確認して飛ぶ」. */
function dlStop(){
  /* NOT ASKED YET IS NOT NOUGHT AND IS NOT FULL, and neither is a plan nobody
     has answered for: planFits() hands upStop() `null` for either, and that
     is 「接続できません」. The screen that presses this has already asked
     (www/home.js § wldGet). */
  return upStop(planFits(dlCount(), 1, dlCap()));
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

   IT ASKS THE SERVER AND NOTHING ELSE.
   -------------------------------------------------------------------------
   「印も何も全部保存とかサーバーでやってるんじゃないの？」 OWNER 2026-09-11 --
   docs/FEATURE_RULES.md § 端末は何も決めない.

   It used to ask `langAcct()`, which is `langMine() && langOwned()`, and both
   of those answer out of THIS PHONE when the server has not spoken: `mine` on
   the index, and 「nobody has claimed it, so it is yours」. That is what made
   the door mint a second language -- the walk's language had not been sent
   yet, so nothing on the phone could say whose it was, and the phone answered
   anyway (docs/scope/r24-lang.md).

   `langOwnOf()` is the `language.owner` column and has three states: this
   account's, somebody else's, and NOT ASKED YET (www/core.js § LOWN). Only
   the first is a yes here. The third is not a maybe that this function
   resolves -- it is a language the server has not answered about, and the
   caller's job is to ask before calling: netTook() sends what is here and
   waits for `mylangs` before this runs at all.

   `mayMint` is gone with it. It existed to say 「the list may still be on its
   way」, which is a question about when this is CALLED and not about what it
   answers; netTook() holds the waiting now (LANG_WAIT) and every caller
   reaches this with the server's answer already in.

   It never deletes and never renames. Another account's language stays in the
   index, in storage, and comes back the moment they sign in again. */
var LANG_WAIT=false;
function langForAcct(){
  var main, nid, me=netUid();
  LANG_WAIT=false;
  /* Nobody signed in: there is no account to be standing in a language of. */
  if(!me) return false;
  if(langOwnOf(langId)===me) return false;
  /* WHICH OF THEIRS IT OPENS IS THE MAIN ONE (§ langMainId), and that is one
     rule read from one place rather than a second answer that agrees most of
     the time. This walked `LANGS` and took the FIRST entry whose owner was
     this account -- the order the index happens to be in, which is the order
     this handset heard about them. On free, where the list shows one language
     (§ langsByAge), that put somebody down in a language with no row on the
     switcher: nothing on the screen to press, and no way back to it if they
     left. 「一番最初に作ってた作り込んでた言語だけ表示」 OWNER 2026-09-12.

     `null` is 「this account has no language」, which is the mint below and
     not a language to fall to. */
  /* AND 「THE SERVER HAS NOT ANSWERED」 IS ASKED FIRST, not read off an empty
     list. langMainId() answers `null` for both 「this account has none」 and
     「nobody has said」 (§ LMINE), and only the first of those is a reason to
     mint -- so the two are told apart here, before either is acted on. This
     asked `pullHad('mylangs')` (www/sns.js), which is a second answer to the
     same question kept in a second place; § LMINE is the one place now, and
     netLangsDown() writes it because it is the road that asks. */
  if(!langMineKnown()){ LANG_WAIT=true; return true; }
  main=langMainId();
  if(main){ langOpen(main); return true; }
  /* The server says this account has none. `language_make` in
     supabase/schema.sql is `owner = auth.uid()`, so the row this one gets can
     say nothing else -- which is why the owner is written here rather than
     waited for: it is the server's answer, known before the round trip. */
  nid=langMint();
  langOwnGot(nid, me);
  langStore();
  langOpen(nid);
  return true;
}
function langStop(){
  /* The plan and what this account already has are two unanswered questions
     with one sentence: the ceiling is worked out FROM the plan and measured
     against the server's COUNT (§ LMINE), and with either missing the index
     is a picture of rows that may not exist any more -- measuring against it
     is what refused the owner their own next language on 2026-09-15. Both
     are `null` until answered, and planFits() hands upStop() the `null`. */
  return upStop(planFits(langCount(), 1, langCap()));
}
/* ---- WHAT THIS ACCOUNT HAS PAID FOR, AND IT IS THE SERVER'S ANSWER ------
   「オンラインで 1 端末に 1 アカウント…誰の物か・あるか無いか・名前・公開か・
   段 ── 答えは全部サーバー」 OWNER 2026-09-11
   (docs/FEATURE_RULES.md § 端末は何も決めない).

   ONE WORD ON THIS PHONE DECIDED THE WHOLE OF IT. `SET.plan` was a field of
   `lingua.set`, written from the Keychain on a phone and from the settings
   file everywhere else, and fifteen places read it or the three fields round
   it: every ceiling, every one of the forty-one `can()` calls, which keyboard
   you type on, which writing system a language IS, and whether thirty-eight
   letters get written into somebody's language. A launch that could not read
   it answered `free`, and a person who had paid opened the app to the free
   shape -- 「アップデートしたら勝手に無料プランになったんだけど？」 OWNER
   2026-09-02, on a real phone.

   `supabase/functions/verify-plan` is the only thing that decides a plan, and
   this is the answer it gave, IN MEMORY (rule 22). Asked at the launch
   (storeSync, www/boot.js) and at the door (netPlanSync, www/net.js); gone
   when the session goes.

   THREE STATES AND THE THIRD IS NOT `free`. `null` is 「nobody has asked
   yet」 -- with no signal, or before the first answer lands -- and falling
   from it to free is the fault above, said in code. Nothing is refused on it
   and nothing is written on it: upStop() and capStop() below say
   「接続できません」 instead of offering a price, and ltStart()
   (www/letters.js) does not write. 「電波が無ければ接続できません」.

   NOTHING IS ON THE DISK. `SET.plan`, `SET.planWas`, `SET.planV` and
   `SET.planUid` are gone from `lingua.set`; docs/CHANGELOG.md 2026-09-11
   carries the DELETE REVIEW. A phone that has them keeps them and nothing
   reads them. */
var PLAN=null;
function planKnown(){ return PLAN!==null; }
/* The one writer. verify-plan is the only thing that reaches it -- planTook()
   below is what netPlanVerify() calls with the answer. */
function planGot(p){
  var v=String(p||'');
  PLAN=(PLAN_ORDER.indexOf(v)>=0)? v : 'free';
}
/* And the session going takes it: a plan is an account's, so the next account
   starts at 「nobody has asked」 rather than at the last one's rung.
   「1アカウントに1課金ですけど。他のアカウントについてくるわけねえだろ」
   OWNER 2026-09-11 -- and this is the whole of what planFor() used to do,
   which was a comparison between two words on a handset. */
function planForget(){ PLAN=null; }
acctMem(planForget);
/* '' where nobody has said. Every reader goes through has() below, which is
   where the third state is answered; this is for a screen that shows the word
   and for planName(). */
function plan(){ return PLAN || ''; }
/* What of the settings goes to `lingua.set`: this handset's setup and nothing
   else (§ SET_PHONE). What an older version left beside it there is kept as
   it is -- read by nobody, removed by nobody (§ acctMoved).

   Two lines stood here taking the plan and its owner OUT on a phone, because
   the settings file is in the backup a PC makes. Neither is a setting any
   more: what this account pays is `verify-plan`'s answer, held in memory
   (§ PLAN). */
function setOnDisk(){
  var raw=acctRaw(LS_S), i, k;
  if(!raw || typeof raw!=='object' || typeof raw.length==='number') raw={};
  for(i=0;i<SET_PHONE.length;i++){
    k=SET_PHONE[i];
    if(SET[k]===undefined) delete raw[k]; else raw[k]=SET[k];
  }
  return raw;
}
/* And what of them is the ACCOUNT's -- everything that is not this handset's
   setup, counted rather than named (§ ACCT: `lingua.set.<uid>`). */
function setMine(){
  var out={}, k;
  for(k in SET)
    if(Object.prototype.hasOwnProperty.call(SET,k) && SET_PHONE.indexOf(k)<0) out[k]=SET[k];
  return out;
}
/* An account's settings arriving (§ acctFor), or `null` for nobody: its own
   laid over the defaults, and nothing of the last account's. */
function setGot(v){
  var d=setDefaults(), k;
  for(k in SET)
    if(Object.prototype.hasOwnProperty.call(SET,k) && SET_PHONE.indexOf(k)<0) delete SET[k];
  for(k in d)
    if(Object.prototype.hasOwnProperty.call(d,k) && SET_PHONE.indexOf(k)<0) SET[k]=d[k];
  if(v && typeof v==='object')
    for(k in v)
      if(Object.prototype.hasOwnProperty.call(v,k) && SET_PHONE.indexOf(k)<0) SET[k]=v[k];
}
/* The settings, written on their own -- the handset's to `lingua.set`, the
   account's under the account.

   save() is the LANGUAGE and the settings in one call, and the language half
   declines when the language on screen is somebody else's (langWrites()),
   and that is right: nothing may be written into a language
   this phone is only reading. It is wrong for a field that is nobody's
   language: the theme, the interface language and the mark that this handset
   has been past the walk are nobody's language, and losing one because
   somebody happened to be reading a published language when they changed it
   is losing it for no reason. */
function setKeep(){
  saveTry(function(){
    localStorage.setItem(LS_S, JSON.stringify(setOnDisk()));
    acctPut('set', setMine());
  });
}
/* ---- planKeep() IS GONE, AND SO IS THE KEYCHAIN IT WROTE TO -------------
   It put the plan into the iOS Keychain, because the settings file is in the
   backup a PC makes and a word in an editable file is a word anybody can
   change. There is no word: what this account pays is `verify-plan`'s answer,
   asked at every launch and at every door, held in memory (§ PLAN). Nothing
   to keep safe and nowhere to keep it.

   `ios/App/App/LinguaPlan.swift` still has its own key and nothing in `www/`
   speaks to it. Taking that out is an iOS change and this branch does not
   touch `ios/` -- docs/BACKLOG.md. */
/* The plans, cheapest first. The ORDER is what makes a ladder a ladder, and
   it is written down once: a level is met by the plan that names it and by
   every plan above it. 「ベーシックは自分の文字と自分のキーボード、プラスは
   全部と広告なし」 -- OWNER DECISION, 2026-08-23, docs/FEATURE_RULES.md.

   All three rungs are on the plans screen and all three are on sale: PLANS
   below carries the card, `plan.price.plus` and `plan.price.plus.yr` are in
   all ten language files, and the two Plus products are in docs/apple.md § 4
   beside the two Pro ones. What www/i18n says is the FALLBACK -- storeCost()
   is what the App Store charges, and the typed number only reaches a screen
   in a browser, in a screenshot, or for a product not yet made, which is a
   state storeSay() puts on the screen in words.

   The names were Basic and Plus until 2026-08-23. 「ベーシック、プラスって
   名前どう思う？なんかどっちが上かわかりにくくない？」 -- Basic reads as the
   name of a FREE tier in most apps, so Free and Basic were the confusable
   pair rather than Basic and Plus. Free < Plus < Pro needs nobody told. */
var PLAN_ORDER=['free', 'plus', 'pro'];
/* THE PLAN THE SERVER ANSWERED, put where the app keeps it. The one place.
   「だから端末でやるわけねえだろ」 OWNER 2026-09-03.

   `planBest()` was here until 2026-09-06 -- the higher of two rungs, asked
   whenever the phone and the server disagreed. There is nothing left to
   disagree: the phone holds no opinion about what it has paid for. It sends
   what Apple signed and this is what comes back, from
   supabase/functions/verify-plan, which is the only thing that reads a
   signature and the only thing that writes the `plan` row.

   AND IT MAY GO DOWN, which the old road could not. That is not a loosening:
   the server decides from every transaction it has ever verified for this
   account, so `free` here means every one of them has run out or been
   refunded -- Apple saying so rather than an empty list nobody could read.
   A launch with no signal never reaches this at all, and the plan is then
   NOBODY-HAS-ASKED rather than free (§ PLAN): every screen that would have
   shown less says 「接続できません」 instead.
   「プランは絶対におかしくしちゃいけないんだって」 OWNER 2026-09-02.

   「プランが終了しました」 is NOT said from here any more -- capLapse() is
   gone with the word on the handset it compared against, and the `plan` table
   carries no previous plan for the server to answer with. § below. */
function planTook(id){
  var p=String(id||'free');
  if(PLAN_ORDER.indexOf(p)<0) p='free';
  planGot(p);
  /* AND WHAT COULD NOT BE WRITTEN UNTIL NOW GOES IN. ltStart()
     (www/letters.js) tops a free alphabet up to its slots and it REFUSES a
     plan nobody has answered for -- 「未回答は書かせない」 -- which at every
     launch is the moment before this one. Not a second mechanism: the same
     call, made where the fact it waited on becomes true, and it tops up only
     what is missing. The same shape langOwnGot() has for the language's
     owner. */
  if(typeof ltStart==='function') ltStart();
  /* AND THE LIST MAY HAVE JUST GOT SHORTER UNDER SOMEBODY'S FEET. This is the
     one moment the language ceiling moves -- langCap() is worked out FROM the
     plan -- so it is the one place that has to ask whether the language on the
     screen is still on the switcher (§ langMainFall). Before render(), or the
     screen is drawn once for the language being left. */
  langMainFall();
  render();
  return p;
}
/* THREE ANSWERS, AND THIS IS WHERE THE THIRD ONE IS MADE.
   「未回答は free ではない」 OWNER 2026-09-11 (docs/FEATURE_RULES.md § 端末は
   何も決めない), and CLAUDE.md § Money: 「a failed check means fewer buttons,
   never fewer words」.

   true and false are the server's answer. `null` is 「nobody has asked yet」
   -- a launch with no signal, or the moment before verify-plan lands -- and
   it is not false. It is falsy, so a DOOR drawn on `if(can(x))` stays shut
   while nobody knows, which is the 「fewer buttons」 half and needs nothing
   written anywhere else. Everything that is not a door hands the answer to
   one of four below, and those are the only places the third state is
   decided:

     upStop(ok)          a PRESS: null is 「接続できません」, never a price
     planNo(ok)          a SHAPE -- a list folded, the fixed QWERTY, an
                         alphabet, left to right, no places sold: true only
                         when the answer is in and it is no, so nobody is
                         shown the free shape of what they paid for on an
                         answer nobody gave. Asked of the open language, it
                         is langShaped(ok) above, which a taken language
                         never is
     planSaid(ok)        a WRITE, or something handed off the phone: nothing
                         goes until the answer is in, and planTook() calls
                         the writer again the moment it is
     planNum(f, p, r)    a NUMBER: null, and planFits() passes the null on

   planKnown() is asked here and in planNum() and nowhere else in www/. These
   replaced nine places that each asked it again for themselves (docs/scope/r73-audit.md § 2-3), and the ceilings that forgot
   to: the dictionary folded to a hundred, the alphabet to its slots, the
   grammar lost its own stages and the composer counted to 140 for somebody
   on Pro whose answer had not come in yet. */
function has(level){ /* level: 'plus' | 'pro' */
  var want=PLAN_ORDER.indexOf(level), got=PLAN_ORDER.indexOf(plan());
  if(!planKnown()) return null;
  /* A plan nobody has heard of cannot land: planGot() makes it free. */
  if(got<0) return false;
  /* And a level nobody has heard of is a typo in CAN. can() has already
     thrown on the capability by the time this runs; this is the second wall
     and it stands the same way round. */
  if(want<0) return false;
  return got>=want;
}
/* What money buys, one capability at a time, and the only place that says so.
   Each name carries the level it needs.

   NO COUNT IS WRITTEN HERE, and that is deliberate rather than lazy. This
   line said ten, then eleven, and was twelve both times somebody read it --
   a number in a comment goes stale the next time the list below it grows,
   and a stale count is believed. `npm run dead` prints the number it actually
   counted on every run ("what money buys: N capabilities in CAN"), and
   tools/paid-check.mjs holds this table against the one in
   docs/PAID_FEATURES.md, name by name and level by level.

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
   LIFTED: free counts to a hundred, PLUS to a thousand, and only PRO has no
   number at all -- which is why it sits at 'pro' below and reads backwards to
   anybody expecting a door. wordCap() above is the number and asks this once. */
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
  snd:     'plus',   /* choosing a sound, rather than taking the letter's own */
  /* The mark beside your name. 「バッチはplusから」 -- Plus in the old three
     names, which is Pro in these. Nothing on the phone GATES it: whoever
     wears it is the server's answer about them (badge_of(), which says this
     rung again as badge_rung() -- tools/rls-check.mjs holds the two equal),
     and the plans page asks canRung('badge') for which row carries it. */
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
/* WHICH RUNG OPENS A CAPABILITY -- a fact about the price list, not about
   whoever is holding the phone. can() asks 「may I」; this asks 「which plan
   is it」, which is what a row of the plans page is. The mark is the case:
   whether somebody WEARS it is the server's answer about them
   (supabase/schema.sql § badge_of, www/post.js § postBadge), and the rung
   that wears it is still this table's -- asked here, by name, like can(). */
function canRung(what){
  var lv=CAN[what];
  if(!lv) throw new Error('canRung: no such capability: '+what);
  return lv;
}
/* THE SHAPE, and it takes the ANSWER for upStop()'s reason below: `can()` is
   given a literal where a check can see it. True only when the server has
   answered and the answer is no -- see has() above. */
function planNo(ok){ return ok===false; }
function planSaid(ok){ return ok===true || ok===false; }
/* THE NUMBER: one per rung, and `null` while nobody has asked. Every ceiling
   is this with its three numbers, so no ceiling can answer the free number
   for a plan nobody has heard, which four of them did. */
function planNum(free, plus, pro){
  if(!planKnown()) return null;
  return has('pro')? pro : has('plus')? plus : free;
}
/* WHETHER `add` MORE FIT UNDER A CEILING, from a count and the ceiling --
   `null` when either is missing, which is a count nobody has given
   (langCount(), dlCount()) or a plan nobody has answered for. */
function planFits(n, add, cap){
  if(n===null || n===undefined || cap===null) return null;
  return n+add<=cap;
}
/* WHAT THE CEILING COUNTS, and it is words. 「活用は数えないにしよう。無料で
   なるべく使って欲しい。」 OWNER 2026-09-23 -- an inflection is not a word
   (www/wordsheet.js § the forms of a word), so the only thing left to leave
   out is an inflection stored AS a word before that day, which is still in
   WORDS and is counted by nobody. */
function wCountable(){
  var n=0, i;
  for(i=0;i<WORDS.length;i++) if(!wIsForm(WORDS[i])) n++;
  return n;
}
function capOK(add){
  return planFits(wCountable(), add||1, wordCap());
}
/* The ceiling, met. True means the caller must stop.

   This used to be `go('plans'); toast(...)` written out at each of the four
   places that add a word, and the go() was the problem: somebody halfway
   through typing a word had the screen taken off them and was put on a price
   list. The ceiling is the app taking something away, so it is one of the
   places that has to say so in words -- but it can say so without moving
   anybody.

   popAsk() and not iOS's own box: `confirm()` was banned outright on
   2026-09-01 (CLAUDE.md § Shape), and this comment described it as the right
   answer for long enough that the ban had to be read past to believe the
   code. popAsk() draws inside the screen, the plans screen is one tap away,
   and this has to be answerable with "no" -- which is what pressing outside
   it is. It is the same thing wipeAll() asks with.

   Two strings that already exist, in all ten languages, rather than an
   eleventh: the sentence the toast said, and the word on the upgrade button.
   A new key here would have been one sentence in English and nine holes. */
function capStop(add){ return upStop(capOK(add)); }
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
   Same shape as capStop() above and for the same reasons -- popAsk() rather
   than iOS's own box, because the plans screen is one tap away and this
   has to be answerable with "no"; and nobody is moved off the screen they
   are standing on unless they say yes.

   ONE sentence and not one per capability. Twelve keys in ten languages is
   a hundred and twenty strings saying the same thing, and 「アプリ内に説明
   書くの禁止」 is the other half of the argument: what somebody needs at the
   moment they press is that this is on a paid plan and where to go, which is
   two facts and not a paragraph about letters.

   THE APP'S OWN, AND NOT iOS's DIALOG. 「正直自前のpopがいいんだけどな。
   iPhoneのやつ使ってるsnsないしな」 OWNER 2026-09-01. It is popAsk(), which
   is one of the three shapes CLAUDE.md § Shape leaves standing -- popAsk()
   for a question, toast() for a statement, openForm() for something to type
   into. This comment described openForm() for a while and the code has never
   called it; the question here is a yes/no and openForm() is for typing.

   No corner, no border, no panel, which is what CLAUDE.md § 18 leaves when a
   box is not allowed. Pressing outside it is the "no".

   IT TAKES THE ANSWER AND NOT THE NAME. `can()` may only be given a literal
   (CLAUDE.md § 5, and dead-check refuses anything else) -- a capability read
   from a variable cannot be held by any check and a wrong one reads as free
   rather than throwing. So the caller writes `upStop(can('letters'))` and the
   name stays where a check can see it.

   Every wall says the same sentence, `up.need`. */
function upStop(ok){
  if(ok) return false;
  /* NOBODY HAS ANSWERED -- the plan, or the count a ceiling is measured
     against -- so there is no price to offer: a phone with no signal would be
     told to buy something it may already have. 「電波が無ければ接続できません」
     (docs/FEATURE_RULES.md § 端末は何も決めない). */
  if(ok===null){ toast(t('net.offline')); return true; }
  popAsk(t('up.need'), function(){ go('plans'); });
  return true;
}

/* THE SAME WALL, ON A BUTTON THAT CARRIES NO CODE OF ITS OWN.
   「ポップだって。その古いのは消して」 OWNER 2026-09-05. A door drawn on the
   free plan used to be `DO('go', ["plans"])` -- the press left the screen
   somebody was standing on and landed them on the price list, which is the
   one thing upStop()'s comment above says a wall must not do. Markup holds a
   NAME and not JavaScript (www/act.js), so the name it holds is one of these
   and the pop is what answers the press; the plans screen is where saying yes
   goes, exactly as it is everywhere else.

   One function per capability, and not one that takes the name: `can()` may
   only be given a literal (CLAUDE.md § 5, and dead-check refuses anything
   else), which is the same sentence upStop() is written under. */
function upFile(){ upStop(can('file')); }
function upData(){ upStop(can('data')); }

/* ---- 「プランが終了しました」, AND THE SERVER IS WHO SAYS IT ----------------
   A subscription ending puts the app back into the shape the free plan has:
   the dictionary lists a hundred, the writing is an alphabet. None of that
   removes anything -- every word, every letter and every layout is where it
   was, and the head of docs/PAID_FEATURES.md is why -- but somebody opening
   the app to find four thousand nine hundred words missing from a list has no
   way to know that without being told.

   What it was before is the server's (`plan.was`, and `lapse_seen_at` for
   whether this account has been told), never a word on this phone:
   「端末の物で分岐して…見せる／見せない…を決める行は全部消す」 OWNER
   2026-09-11. capLapseSaw() in www/settings.js reads the plan's answer and
   puts the pop up. */

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

   A word that carries no sequence is read off its letters, every time it is
   asked, and nothing is written back. */
function wPh(w){
  /* The spelling is the word, so what it sounds like is asked of the letters
     it is spelled with -- every time, so a letter that changes its sound
     changes the words it is in. `ph` is what a word carries when it has no
     spelling: an import, or a word from before this. */
  if(w && w.sp && w.sp.length) return spPh(w.sp);
  if(w && w.ph && w.ph.length) return w.ph;
  return phGuess(w? w.hw : '');
}
/* The old reading of a Latin spelling: what a word with no spelling and no
   sounds of its own reads as, worked out when it is read (wPh) and when a
   list is brought in (www/import.js) -- and never written onto a word by
   anything nobody pressed (migratePh is gone, 2026-09-23). */
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
/* An inflection made before 2026-09-23, when one was stored as a word of its
   own: it has a parent and a label that is not a derivation. It stays exactly
   where it is (docs/CHANGELOG.md 2026-09-23); this is how everything that has
   to tell it from a word asks. fmInf() is www/wordsheet.js's -- which labels
   are inflections is said there and nowhere else.

   A form OF a word that is in the dictionary: it is listed on that word's
   page (wForms) and nowhere else. A parent that has been deleted leaves the
   child its `from` (wDrop, CLAUDE.md § The past) and no page to be listed on,
   so the child is a word again, in the list, rather than in nobody's. */
function wIsForm(w){ return !!(w && w.from && fmInf(w.fm) && wParent(w)); }
function wParent(w){
  if(!w || !w.from) return null;
  var i;
  for(i=0;i<WORDS.length;i++) if(String(WORDS[i].hw)===w.from) return WORDS[i];
  return null;
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
