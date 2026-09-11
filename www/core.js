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

      You can make one language and read any number of other people's, so a
      language's keys belong to the language rather than to the app, and they
      carry its id:

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
   name and face, and the index of languages. Nothing threw. Somebody deleted
   their account and the app still greeted them by name.

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
  var me=String(uid||''), ids=[], doomed=[], keys, id, i, k, j;
  /* WHOSE, AND IT IS TWO QUESTIONS. A language this account WROTE is
     `language.owner` (langOwnOf), and one it TOOK is a `language_take` row
     (langTookHas) -- two facts that `LANGS[id].uid` used to answer with one
     field, which is what came apart the day a language moved between people.
     Both go: the account is being deleted, and its copies of what it pulled
     down are as much its own as what it wrote. */
  for(id in LANGS)
    if(Object.prototype.hasOwnProperty.call(LANGS, id) && LANGS[id] &&
       (langOwnOf(id)===me || langTookHas(id))) ids.push(id);
  /* The slices are in MEMORY now (LSL above), so they are dropped rather than
     removed from storage -- and the record of what was last agreed with them,
     which is filed beside each one. */
  for(i=0;i<ids.length;i++){
    for(j=0;j<SLICES.length;j++){
      slRm(langKeyOf(ids[i], SLICES[j]));
      slRm(langWasKey(ids[i], SLICES[j]));
    }
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
  /* the live copies, which are this account's while it is signed in */
  doomed.push('lingua.me'); doomed.push('lingua.posts'); doomed.push('lingua.drafts');
  try{ for(i=0;i<doomed.length;i++) localStorage.removeItem(doomed[i]); }catch(e){}
  /* AND WHAT IS THEIRS INSIDE `lingua.set`, which is a key this account
     SHARES rather than one it owns -- so it is emptied of them instead of
     removed. 「アカウント消したのに検索履歴残ってたんだけどなんで？」 OWNER
     2026-09-04: the history was here, in the live settings, and nothing in
     this function had ever looked inside the key.

     Here and not at the call site, because this is 「one account's things,
     gone」 and the words somebody searched for are one of their things. The
     caller wiped the parked copy and then signed out, and signing out PARKS
     -- so the fields were written straight back under the name of the account
     that had just been deleted. Cleared here, there is nothing left to park:
     setFor('') finds no owner and returns having written nothing. */
  if(String(SET.planUid||'')===me){
    keys=setAcctKeys(null);
    for(i=0;i<keys.length;i++) delete SET[keys[i]];
    /* AND THE PLAN, WHICH `setAcctKeys()` DOES NOT ANSWER FOR. It is not one
       of the settings -- SET_PLAN below says why -- so the two words are
       here, and free is a value rather than an absence. Without this line a
       deleted account's rung would still be on the screen. */
    SET.plan='free'; SET.planWas='free';
    delete SET.planUid;
    setKeep();
  }
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
   time it has been the answer here. The keyboard was in no backup for as long
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
     gram2   read and written BY LANGUAGE ID, on demand, in
             www/grammar-engine/adapter.js. There is no global copy to go
             stale, which is why it never belonged in the sequences above

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
  gram2:  { why:'read by language id on demand in www/grammar-engine/adapter.js; there is no global copy' }
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
/* id -> { mine, uid }: the index says which languages are here, and the
   language's own keys hold what it is.

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
   is never called on this key, so slMine() cannot see it and netSaveUpGo(),
   netSlice1() and both 「fills in and stops」 reads never find it. */
var LNAME={};
function langNameKey(id){ return langKeyOf(String(id||''), 'name'); }
function langNameGot(id, nm){
  var k=String(id||''), v=String(nm||'');
  if(!k) return;
  LNAME[k]=v;
  slGot(langNameKey(k), v);
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
  slGot(langWsysKey(k), v);
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
  var k=String(id||''), v=String(uid||'');
  if(!k) return;
  LOWN[k]=v;
  slGot(langOwnKey(k), v);
}
function langOwnOf(id){
  var k=String(id||''), p;
  if(!k) return '';
  if(Object.prototype.hasOwnProperty.call(LOWN, k)) return LOWN[k];
  p=slRd(langOwnKey(k));
  return p===null? '' : String(p);
}
function langOwnKnown(id){ return !!langOwnOf(id); }
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
function langTookGot(ids){ LTAKE=(ids && typeof ids.length==='number')? ids : null; }
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
/* What a person's settings are before they touch anything. A function rather
   than a literal because it is needed twice -- here, and when everything is
   wiped -- and the second copy was written out by hand and did not have the
   same keys in it. */
function setDefaults(){
  return {theme:'system', plan:'free', planUid:'', walked:false, order:'SOV', read:'both',
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
/* WHAT THIS PHONE AND THE SERVER LAST AGREED THIS SLICE WAS.
   Not a copy of somebody's work and not a backup: it is the only way the
   merge can tell 「I removed this」 from 「I have not been told about this
   yet」, which are the same thing to look at and opposite things to do.
   Written by netLangSync1() the moment the two sides hold the same string,
   read by nothing else, and filed beside the slice so deleting a language
   takes it with everything else. */
function langWasKey(id, slice){ return langKeyOf(id, slice) + '.was'; }

/* AND WHERE A SLICE ACTUALLY SITS, WHICH IS MEMORY AND NOT THIS PHONE'S DISK.
   -------------------------------------------------------------------------
   「オンラインは一本化ね？」「簡単よ」「保存としたらオンラインおしまい」
   「今ファイルもいらん。オンラインのみで行こうってことになってる今後オフライン
     たいおする時にまた考えることにした」 OWNER 2026-09-04.

   Every one of the twelve used to be a `localStorage` key. **The server is
   the only place a language is kept now**, and what is here is the value the
   running app is holding -- the same kind of thing `WORDS` and `LETTERS`
   already were, one step further out. Close the app and it is gone; open it
   signed in and netLangsDown() brings it back.

   IT IS NOT A CACHE AND MUST NOT BECOME ONE. A copy that survives the app is
   a second answer to 「what is this language」, and the whole of this change
   is that there is one. With no signal there is nothing to read, and that is
   the decision rather than a gap: 「電波が無いときはログインできない」.

   KEYED BY langKeyOf() STILL, and that is not leftovers. It is the one place
   that knows how a language is filed (CLAUDE.md rule 6), the keys are what
   `SLICES` and `wipeLangsGo()` and `lsWipeAcct()` already walk, and a second
   naming scheme here would be exactly the fault that comment is about.

   `lingua.langs` and `lingua.cur` are NOT this. They are the index -- which
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

   Written in one place (netAgreed in www/net.js, the moment both sides hold
   the same string) and removed in one place (slRm below, which is only ever a
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
function slGot(k, body){
  try{
    if(body===null || body==='') localStorage.removeItem(slGotKey(k));
    else localStorage.setItem(slGotKey(k), String(body));
  }catch(e){}
}
function slWr(k, v){ LSL[k]=String(v); }
/* Gone from memory, and both disk keys with it -- what an older version wrote
   and the picture slGot() keeps. This is the one place that REMOVES, and it is
   only ever a person deleting a language or an account (wipeLangsGo,
   lsWipeAcct). Leaving either one behind would be the slice coming back
   through a fallback above on the next launch, which is 「消したものが戻って
   くる」 wearing the migration's clothes. */
function slRm(k){
  delete LSL[k];
  try{ localStorage.removeItem(k); localStorage.removeItem(slGotKey(k)); }catch(e){}
}

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
   planMigrate() below runs while core.js is still being read. It is asked for
   rather than assumed because the alternative is core.js stopping on that
   line with everything under it -- CAN among them -- never defined, which is
   a white screen from a message about a full disk. If toast() is there then
   so is t(), for the same reason. And the toast is one line on the screen
   that rewrites itself, so a burst that fails twice says it once. */
function saveTry(put){
  try{ put(); }
  catch(e){ if(typeof toast==='function') toast(t('save.no')); }
}

/* Which languages are here, and which one is open. Read before anything else
   in this file, because every other key is built out of langId. */
try{
  var lx=JSON.parse(localStorage.getItem(LS_LANGS)||'null');
  if(lx && typeof lx==='object') LANGS=lx;
}catch(e){}
try{ langId=localStorage.getItem(LS_CUR)||''; }catch(e){}

function langStore(){
  saveTry(function(){
    localStorage.setItem(LS_LANGS, JSON.stringify(LANGS));
    localStorage.setItem(LS_CUR, langId);
  });
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
  LANGS[id]={ mine:true };
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
/* AND IT CARRIES WHOEVER TOOK IT. A downloaded language is somebody else's
   language sitting in YOUR index -- `mine` false -- and dlCount() asks
   langOwned() to know whose index it is sitting in. Without the stamp it
   belongs to nobody, so it counts against no ceiling: a free plan could take
   as many chapters as it liked and the number at the foot of the list would
   go on saying nought. langNew() puts the same three lines on a language
   somebody MAKES; this is the reading side of it. */
function langSeenAdd(sid, name, owner){
  var id=String(sid||'');
  if(!id) return '';
  if(!LANGS[id]) LANGS[id]={ mine:false };
  /* and what the server said it is called. It used to be filled in only when
     the index had nothing, so a second download could not rename a language
     somebody was reading; the name is the server's answer now and a fresher
     one of those is not a rename. */
  if(name) langNameGot(id, name);
  /* AND WHO WROTE IT. It used to stamp whoever was signed in -- 「whoever
     took it」 -- into the same field a language's own maker went into, so one
     word answered two questions and the two came apart exactly here. Who
     wrote it is `language_seen.owner` and comes in with the row; that this
     account TOOK it is a `language_take` row and netTakePut() writes it. */
  if(owner) langOwnGot(id, owner);
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
  var k=String(id||''), L=LANGS[k], me, own;
  if(!L) return true;
  me=(typeof SESS!=='undefined' && SESS && SESS.uid)? String(SESS.uid) : '';
  /* NOBODY SIGNED IN IS THE WALK, and it is the one answer that needs no
     server: there is nobody to compare with, the phone is holding one
     language, and it is the one being made. This is the branch `SET.done`
     used to be asked for -- it asks the SESSION now, which is what the door
     being last makes true. */
  if(!me) return true;
  own=langOwnOf(k);
  if(own) return own===me;
  /* NOT ASKED YET, AND WHAT ANSWERS IS WHAT AN OLDER VERSION WROTE. `mine` on
     the index is that: this app has written it since there were downloads,
     and it is read HERE ONLY -- until the server says who wrote the language,
     and never after. It is the migration reading, the same shape slMine()
     falls back to the disk with: a phone that has this app on it today is
     full of languages whose owner no road has ever asked about, and refusing
     them all would stop netLangSync() ever asking. The screens do not draw an
     unanswered language (www/home.js § vLangs); this is what keeps the road
     to the answer open.

     A SECOND BRANCH STOOD IN FRONT OF THIS AND IT WAS `sid` (2026-09-10).
     `if(!L.sid) return false` -- 「never been up, so this phone cannot say
     whose it is」 -- and there is no `sid` to ask any more: under one number
     a language has its id from the moment it is minted, whether or not a row
     was ever made. What refuses A's language on B's phone is the owner stamp
     above, which every road that makes a language now writes (langNew,
     langForAcct, langSeenAdd, obFinish at the door, netLangsWalk) --
     acct-check 10 and 35 are stamped and stay refused. What is left
     unstamped is what an older version left in the index, which is exactly
     the migration reading this line is about. */
  return L.mine!==false;
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
/* Nothing here at all: a first run. The person gets one empty language of
   their own. */
function langFirst(){
  langId=langMint();
  langStore();
}
try{
  if(!langId || !LANGS[langId]) langFirst();
}catch(e){ langFirst(); }

/* Read the open language into the globals the screens use.
   Called once here, and again every time a different language is opened, so
   it puts back what an empty language looks like before it reads anything. A
   version of this that only overwrote what the incoming language happens to
   have would leave the last one's words sitting behind it -- you would open
   somebody else's language and find your own dictionary in it. */
function langRead(){
  WORDS=[]; LINES=[]; langName=''; SCRIPT={g:{}, extra:[]};
  try{ var a=JSON.parse(slRd(langKey('words'))||'[]'); if(Array.isArray(a)) WORDS=a; }catch(e){}
  try{ var l=JSON.parse(slRd(langKey('lines'))||'[]'); if(Array.isArray(l)) LINES=l; }catch(e){}
  langName=langNameOf(langId);
  try{
    var gg=JSON.parse(slRd(langKey('script'))||'null');
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
/* AND THE FLAG THAT USED TO ANSWER TWO QUESTIONS, MOVED TO THE ONE IT KEEPS.
   -------------------------------------------------------------------------
   OWNER 2026-09-09 (choice A). `SET.done` was 「the onboarding is finished」
   and it was read as both 「this ACCOUNT has been through」 -- which is the
   `profile` row on the server, and is asked there now -- and 「this HANDSET
   has been past the walk」, which is the only half nothing on a server can
   answer: signed out there is nobody to ask, and after an account is deleted
   the row is gone.

   So the flag keeps the second question and is named for it. This copies the
   old value across ONCE, on the launch after the update, and takes the old
   name away so nothing can read it again -- what is copied is the same fact
   under the name that says which fact it is. A phone that has never had the
   old field is untouched: absent is not false, it is 「there was nothing to
   move」, and setDefaults() answers for a fresh install.

   Beside planMigrate() and in its shape, for the same reason: a settings
   field that changed meaning is moved once, on this phone, before anything
   reads it. */
function walkedMigrate(){
  if(SET.done===undefined) return;
  if(SET.walked===undefined || SET.walked===false) SET.walked=!!SET.done;
  delete SET.done;
  setKeep();
}
walkedMigrate();
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
  saveTry(function(){ localStorage.setItem(LS_S, JSON.stringify(setOnDisk())); });
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
  langSaveAll();
  langId=id; langStore();
  /* LANG_IO is the list; ltStart(), migrateKbFree() and migratePostInk() are
     not reads and stay -- one tops a free language up, two bring an older
     shape forward. */
  langLoad(); ltStart(); migrateKbFree(); migratePostInk();
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
  /* AND WHO WROTE IT, which is not a guess: `language_make` in
     supabase/schema.sql is `owner = auth.uid()`, so the row this language
     gets can say nothing else. It is written where the language is MADE
     rather than where the row is, because between the two is a phone that may
     be in a tunnel for a week -- and an un-uploaded language with nobody on
     it is the one A made and B signs in and takes (acct-check 10).

     langFirst() and langMint() do not: they run before there is an account,
     which is the walk, and the door is where what it made gets one. */
  var id=langMint();
  if(typeof SESS!=='undefined' && SESS && SESS.uid) langOwnGot(id, SESS.uid);
  langStore();
  langOpen(id);
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

function save(){
  if(langLocked()) return;   /* somebody else's language: nothing is written to it */
  bkTouch();
  saveTry(function(){
    slWr(langKey('words'),JSON.stringify(WORDS));
    slWr(langKey('lines'),JSON.stringify(LINES));
    slWr(langKey('script'),JSON.stringify(SCRIPT));
    localStorage.setItem(LS_S,JSON.stringify(setOnDisk()));
    langStore();
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
   lines:['plan.plus.1','plan.plus.2','plan.plus.3','plan.plus.4','plan.plus.5',
          'plan.plus.6']},
  /* Pro opens with "everything in Plus, and:" rather than repeating the lines
     above it. Three pages that each list everything are three pages somebody
     has to compare word by word; the ladder is the thing being sold and it
     should be readable by scrolling.

     THE CEILINGS ARE ON THE CARDS, and that is 「何で入ってないの？」 OWNER
     2026-09-03. langCap() and dlCap() sell three languages and three
     downloads on Pro, and one download on Plus, and not one of those numbers
     was anywhere on the screen a person pays from -- so the app was charging
     for something it never said it had. Each is a NAME and not a sentence
     (「アプリ内に説明書くの禁止」): plan.pro.6 / plan.pro.7 / plan.plus.6.
     Plus's own languages are Free's one, so there is no line for them. */
  {id:'pro',  name:'Pro',  mo:'plan.price.pro', yr:'plan.price.pro.yr', off:'17',
   lines:['plan.pro.1','plan.pro.2','plan.pro.3','plan.pro.4','plan.pro.5',
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

   `mine` and not the length of LANGS, because LANGS holds both kinds:
   langSeenAdd() above writes `mine:false` for a language taken off somebody
   else's page, and vLangs() (www/home.js) draws the two lists that answers.

   A language somebody else made is not one this person made, and a ceiling
   that filled up because you looked at somebody's work would be a punishment
   for using the app. So they are TWO NUMBERS and not one --
   「自分の言語+DL言語1個」 (OWNER DECISION 2026-08-25, docs/FEATURE_RULES.md),
   「別に数える」 (OWNER 2026-09-01). dlCount() against dlCap() is the other
   one, below; this one counts `mine`.

   docs/DATA_MODEL.md § a language that is only read. */
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
   account to make it for, and the door is on the way out of it: netTook()
   (www/net.js) sends what the walk made the moment the session arrives, and
   the row it makes is where the account goes on. So the walk is the only moment a session may adopt what
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
     langNew(), langForAcct(), langSeenAdd(), netLangsDown() and bkRestore().
     langFirst() is the one that cannot, because it runs before there is an
     account, and the door stamps what the walk made on the way out.

     So the only unstamped language is one being made in the walk right now,
     and `SET.done` is what says so -- the same question makeNeed() asks in
     www/onboard.js. Nothing here remembers the phone: 「端末ごとにやること
     なんてねえよ」 OWNER 2026-09-03, and a phone-shaped answer here is what
     put one person's language in another person's list.

     An unstamped language after the door is not this person's, and it is not
     deleted either -- it stays in the index, in
     storage and in the backup, and www/home.js counts it among the ones it is
     not showing. */
  /* WHO WROTE IT, and the three states langMine() above sets out. It was
     `!SET.done` -- a fact about the handset -- which is what handed one
     person's language to the next one; it asks the language now. */
  var own=langOwnOf(id);
  if(own) return own===me;
  /* Nobody claimed it: not this account's. The walk's own language is
     stamped at the door before anything asks, and a language that HAS been
     up and has not been asked about yet is not drawn on either side either
     -- www/home.js § vLangs leaves it out and says how many it is not
     showing. Both of those used to be written out, either side of
     `if(!L.sid)`, and both answered false; with one number there is no `sid`
     to tell them apart and there never was a difference to tell. */
  return false;
}
function langAcct(id){
  return langMine(id) && langOwned(id);
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
/* AND IT IS THE SERVER'S COUNT. It walked this phone's index -- entries with
   `mine` false carrying this account's stamp -- and that stamp was 「who took
   it」 kept on one handset, so the same account on a second phone counted
   nought and the ceiling was one ceiling per handset rather than per account.
   `language_take` is the table and netTakes() (www/net.js) is what asks.
   `null` is 「not asked」 and dlStop() is what waits for it. */
function dlCount(){ return langTook(); }
/* The ceiling on downloads, met. langStop()'s shape exactly, and the same
   sentence: 「全部確認して飛ぶ」. Somebody already holding the biggest ceiling
   there is gets one line and no dialog, because there is nothing to fly to. */
function dlStop(){
  var n=dlCount();
  /* NOT ASKED YET IS NOT NOUGHT AND IS NOT FULL. Nothing is refused and
     nothing is let through on a number nobody has given: the button waits,
     and netTakes() puts one there. The screen that presses this has already
     asked (www/home.js § wldGet). */
  if(n===null){ toast(t('net.offline')); return true; }
  if(n<dlCap()) return false;
  if(dlCap()<PRO_DL) popAsk(t('up.need'), function(){ go('plans'); });
  /* toast() and not alert(): iOS's own box is banned outright
     （「標準は使わねえって言ってるだろこれも禁止や」OWNER 2026-09-01）and
     there is nothing to ASK here -- somebody already on the top rung cannot
     be offered a bigger one, so what is left is the sentence. */
  else toast(t('up.need'));
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
  var id, nid, me=(typeof SESS!=='undefined' && SESS && SESS.uid)? String(SESS.uid) : '';
  LANG_WAIT=false;
  /* Nobody signed in: there is no account to be standing in a language of. */
  if(!me) return false;
  if(langOwnOf(langId)===me) return false;
  for(id in LANGS)
    if(Object.prototype.hasOwnProperty.call(LANGS, id) && langOwnOf(id)===me){
      langOpen(id); return true;
    }
  /* AND 「THE SERVER HAS NOT ANSWERED」 IS NOT 「THE ACCOUNT HAS NONE」.
     `pullHad('mylangs')` (www/sns.js) is true only when the list actually
     came down. With no signal it is false, and nothing is made: the screen
     waits, which is what an online app does -- 「電波が無ければ接続できません」
     (docs/FEATURE_RULES.md § 端末は何も決めない). Minting on a send that did
     not land is the same second language this whole change is about, in a
     different coat. */
  if(typeof pullHad!=='function' || !pullHad('mylangs')){ LANG_WAIT=true; return true; }
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
  if(langCount()<langCap()) return false;
  if(langCap()<PRO_LANGS){
    popAsk(t('up.need'), function(){ go('plans'); });
  }
  /* toast() and not alert(), for the reason written over dlStop() above. */
  else toast(t('up.need'));
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
   language. `SET.planUid` is which account the plan on this handset belongs
   to, and losing it because somebody happened to be reading a published
   language when they signed in is losing the only record there is.

   planMigrate() above already writes this key straight, for its own reason,
   so this is that line with a name on it rather than a new road. */
function setKeep(){
  saveTry(function(){ localStorage.setItem(LS_S, JSON.stringify(setOnDisk())); });
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

   TWO ANSWERS, AND THERE WERE THREE UNTIL 2026-09-11.
   「1アカウントに1課金ですけど。他のアカウントについてくるわけねえだろ」
   OWNER 2026-09-11 -- and that is the whole specification, with no exception
   in it.

   THE SAME PERSON -- nothing to do. This is every ordinary launch and every
   token refresh.

   ANYBODY ELSE -- start from free and let the account answer. storeSync()
   sends this device's receipts a moment later and the server answers with
   whatever THIS account holds. Nothing is taken away from the person who DID
   buy it: the Keychain is not written here, so their plan and their name are
   still in it, and the launch they come back on reads them out again; mid
   session, with no relaunch to read the Keychain, the server is what answers
   for them, which is the same road and the only record there is.

   THE THIRD WAS 「NOBODY WRITTEN DOWN YET -- record the name and MOVE
   NOTHING」, and it was an exception for a phone with no owner on its plan.
   It read an empty `SET.planUid` as 「the plan of whoever is holding this
   handset」, which is the sentence the owner has just refused: a plan nobody
   can name a buyer for is not that person's purchase. Measured before it was
   deleted -- a phone with no stamp and `pro` on it handed `pro` to the next
   account to sign in, with `planWas` moving too, so capLapse() said nothing
   and the screen simply had somebody else's subscription on it.

   An empty stamp is now the ordinary mismatch and takes the ordinary road:
   free, and the server is asked.

   SET.planWas MOVES WITH IT, and that is load-bearing rather than tidy.
   capLapse() runs at the foot of www/boot.js, synchronously, and compares the
   plan against the last one this phone saw. Left where it was, it would read
   pro -> free as 「the subscription ended」 and do the two things that answer
   is for: show the sheet that says so, against a plan this person never had.
   Moved together,
   there is nothing for it to notice.

   setKeep() and not save(): save() opens with bkTouch(), and netRead() runs
   at the moment www/net.js loads, which is three script tags before
   www/backup.js exists. It is also the right call on its own terms -- save()
   declines while the language on screen is somebody else's, and none of these
   three fields is anybody's language. */
/* THE FIELDS OF `SET` THAT ARE AN ACCOUNT'S AND NOT THIS HANDSET'S.
   「端末ごとにやることなんてねえよ」「アカウントごとってずっと言ってるよな？」
   OWNER 2026-09-03.

   THIS WAS A LIST OF WHAT IS AN ACCOUNT'S AND IT IS NOW A LIST OF WHAT IS
   NOT. 「アカウント消したのに検索履歴残ってたんだけどなんで？アカウント単位
   なのにそれが残るの？全部アカウントだって言ってるやん おかしいだろお前
   一本化しろって。」 OWNER 2026-09-04.

   It named six -- plan, planWas, saved, savedUp, notAt and one more -- and
   `recent`, the words somebody typed into the search field, was added to SET
   on 2026-09-03 and never added here. So a person deleted their account and
   the next screen still showed what they had searched for. That is the same
   fault, in the same month, as the one lsWipeAcct() above was rewritten for:
   **a list of keys, written by hand, that nobody remembered to add to.**
   Adding `recent` to the six would fix that one field and leave the seventh
   waiting, which is what 「一本化しろ」 refuses.

   So the question is asked the other way round, and the default answer is the
   owner's own: **EVERYTHING IN `SET` IS AN ACCOUNT'S UNLESS IT IS NAMED HERE.**
   「全部アカウントだって言ってるやん」. What is named is how this HANDSET is
   set up and nothing a person made: the theme and the interface language, the
   marks that say a migration has run on this install, the measurement of this
   handset's own keyboard, and `planUid`, which is not a setting at all -- it
   is which account the fields beside it belong to, so it can never be one of
   them.

   A field added tomorrow is that account's the day it is added, and there is
   nothing to keep in step. It fails toward 「this is somebody's」, which is the
   side that loses nothing: a handset setting wrongly parked comes back the
   moment that account signs in again, and a person's belongings wrongly left
   behind are handed to a stranger. tools/store-check.mjs holds the two halves
   against each other -- a name here has to be one it calls the handset's, and
   a field it puts on a road to the server may not appear here at all. */
/* HOW THIS ACCOUNT HAS THE APP SET UP, and it goes with the account.
   -------------------------------------------------------------------------
   「端末ごとにやることなんてねえよ」「アカウントごとってずっと言ってるよな？」
   OWNER 2026-09-03, and 「端末に残すものないんですけど。サーバーで同じ機能に
   なるように代替して」 OWNER 2026-09-08.

   These five sat in SET_PHONE as 「how this handset is set up」, beside the
   theme, and that sentence was wrong about all of them: signing in on a
   second phone gave somebody the app arranged the way that PHONE happened to
   be. `profile.prefs` is one jsonb column carrying exactly this list --
   netPrefsPut() sends it, netPrefsPull() brings it back at a sign-in, and
   adding a sixth setting is a name here and nothing else.

   THE COPY IS STILL ON THE PHONE and is filed under the account by setFor(),
   the way `lingua.me` is: with no signal the app is arranged the way it was
   last seen, which is what a copy is for. What changed is which of the two is
   the RECORD. */
var SET_PREFS=['theme','ui','myfont','showScript','kbrom'];
/* WHAT IS LEFT IS THIS HANDSET'S SETUP, AND THERE IS VERY LITTLE OF IT.
   `planUid` says which account's things are live here -- the settings that
   setFor() parks and hands back, and the plan copy beside them, which is the
   one question a handset can be asked and an account cannot; `wldMoved` is a
   migration mark; `vvkb` is a MEASUREMENT of this screen and is meaningless
   on another phone. `done` and `obback` are the onboarding's, and they are
   here under protest -- 「セッションが無い」 cannot tell a phone out of the box
   from one somebody signed out of, and after an account is deleted there is no
   server left to ask (docs/reports/r8-item2-2026-09-08.md). The owner is
   deciding that one.

   `walked` is the ONE thing about the onboarding that is left here, and it is
   here because the OWNER put it here (2026-09-09, choice A). `SET.done`
   answered two questions with one flag: 「has this ACCOUNT been through the
   walk」, which is the `profile` row on the server and is asked there now, and
   「which screen does a phone with NO SESSION open on」, which nothing can
   answer -- signed out there is nobody to ask, and after an account is
   deleted the row is gone. Two written decisions turn on that second one
   (「ログアウトしたら普通にログイン画面だけ出せばいいやろ」 OWNER 2026-08-26,
   「アカウント削除した後オンボーディングから始まるのはなぜ？」 OWNER
   2026-09-03), so it stays -- named for what it actually says, read by ONE
   line (appIs in www/shell.js) and written by two (the door, and wipeHere).

   `planV`, `order`, `read`, `voice` and `script` are NOT in this list and are
   not settled either: they are the plan's and the language-making side's, and
   moving them is a different question from this one. docs/BACKLOG.md. */
var SET_PHONE=['planUid','planV','walked','obback','vvkb','wldMoved',
               'order','read','voice','script'];
/* AND THE PLAN IS NEITHER OF THE TWO, WHICH IS WHY IT IS NAMED HERE.
   「1アカウントに1課金ですけど。他のアカウントについてくるわけねえだろ」
   OWNER 2026-09-11.

   `SET.plan` is not how this handset is set up, so it is not in the list
   above; and it is not one of the person's belongings that the settings park
   and hand back, though it sat in that bag until 2026-09-11. It is the COPY
   OF THE SERVER'S LAST ANSWER about this account -- supabase/functions/
   verify-plan decides it, `planTook()` writes it down, and on a phone the
   Keychain holds it (ios/App/App/LinguaPlan.swift). A copy has one road home
   and the parked settings file was a second one.

   That second road decided. `planFor()` below starts a mismatched session
   from `free` and asks the server; `setFor()` ran a moment later and put the
   plan back out of `lingua.set.<uid>` -- so the answer to 「what does this
   person pay」 was whichever of the two ran last. On a phone it is worse than
   a duplicate: `setOnDisk()` keeps the plan out of the settings file
   precisely because that file is in the backup a PC makes, and the parked
   copy was written from `SET` directly, past that line.

   `planWas` goes with it and is not tidiness. It is what capLapse() compares
   the plan against, so a `planWas` that comes back from a file while the plan
   comes back from the Keychain is 「your subscription ended」 said to somebody
   who never subscribed. The two move together or neither moves.

   TWO NAMES AND NOT A LIST THAT GROWS. `SET_ACCT` was six names that had to
   be added to whenever a setting was invented, and the seventh was forgotten
   (see the note over SET_PHONE above). This is the plan's own two fields and
   there is no third: a plan is a word and the word this phone last showed.
   A field invented tomorrow is a setting, and settings travel by the road
   above without anybody remembering. */
var SET_PLAN=['plan','planWas'];
/* The fields of `SET` that are a PERSON's, counted rather than named. Asked of
   a parked copy as well as of `SET` itself: a field this account has and this
   handset has not written yet is still theirs, and reading only the live keys
   would leave it in the file when somebody else arrives. */
function setAcctKeys(park){
  var out=[], k;
  for(k in SET)
    if(Object.prototype.hasOwnProperty.call(SET,k) &&
       SET_PHONE.indexOf(k)<0 && SET_PLAN.indexOf(k)<0 && out.indexOf(k)<0) out.push(k);
  for(k in (park||{}))
    if(Object.prototype.hasOwnProperty.call(park,k) &&
       SET_PHONE.indexOf(k)<0 && SET_PLAN.indexOf(k)<0 && out.indexOf(k)<0) out.push(k);
  return out;
}
function setParkKey(uid){ return LS_S + '.' + String(uid||''); }
/* Parked, not cleared -- the same shape as meFor() and postFor(). Signing
   back in brings them all to the screen again. */
function setFor(uid){
  var me=String(uid||''), was=String(SET.planUid||''), park, got=null, keys, i, k, d;
  if(was===me) return false;
  if(was){
    d={}; keys=setAcctKeys(null);
    for(i=0;i<keys.length;i++) d[keys[i]]=SET[keys[i]];
    saveTry(function(){ localStorage.setItem(setParkKey(was), JSON.stringify(d)); });
  }
  if(me){
    try{ park=localStorage.getItem(setParkKey(me)); }catch(e){ park=null; }
    if(park){ try{ got=JSON.parse(park); }catch(e){ got=null; } }
  }
  /* Nobody was written down: what is here is this person's, the way meFor()
     adopts an unclaimed copy. Only on the way IN. */
  if(was){
    keys=setAcctKeys(got);
    for(i=0;i<keys.length;i++){
      k=keys[i];
      if(got && got[k]!==undefined) SET[k]=got[k];
      /* Absent and not undefined: a field this account has never written is a
         field it does not have, and setDefaults() answers for it everywhere
         else.

         `plan` and `planWas` were named here and are gone with the rest of
         the plan: SET_PLAN above takes them out of `keys`, so this function
         no longer says the word 「plan」 anywhere. planFor() answers for them
         and is the only thing that does. */
      else delete SET[k];
    }
  }
  SET.planUid=me;
  setKeep();
  return !!was;
}
function planFor(uid){
  var me=String(uid||'');
  /* Nobody signing in is not a question about a plan. Signing OUT parks
     nothing here either: the settings are parked by the next arrival
     (setFor(), above) and the plan is not parked at all. */
  if(!me) return false;
  /* THE ONE COMPARISON, AND THERE IS NO SECOND BRANCH.
     An empty `SET.planUid` is not a phone whose plan belongs to whoever is
     holding it -- it is a phone where nobody can say who bought this, and
     「nobody can say」 is not a purchase. 「1アカウントに1課金ですけど。」 */
  if(String(SET.planUid||'')!==me){ SET.plan='free'; SET.planWas='free'; }
  /* Before setFor() and not after: setFor() writes `SET.planUid=me` itself,
     so read after it the two would always agree and this would never fire. */
  return setFor(me);
}
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
   A launch with no signal never reaches this at all, and the plan stays what
   it was. 「プランは絶対におかしくしちゃいけないんだって」 OWNER 2026-09-02.

   capLapse() is what says it out loud, and it is called from here because
   here is the one place a plan arrives. */
function planTook(id){
  var p=String(id||'free');
  if(PLAN_ORDER.indexOf(p)<0) p='free';
  SET.plan=p;
  save();
  planKeep(p);
  capLapse();
  render();
  return p;
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

   popAsk() and not iOS's own box: `confirm()` was banned outright on
   2026-09-01 (CLAUDE.md § Shape), and this comment described it as the right
   answer for long enough that the ban had to be read past to believe the
   code. popAsk() draws inside the screen, the plans screen is one tap away,
   and this has to be answerable with "no" -- which is what pressing outside
   it is. It is the same thing wipeAll() asks with.

   Two strings that already exist, in all ten languages, rather than an
   eleventh: the sentence the toast said, and the word on the upgrade button.
   A new key here would have been one sentence in English and nine holes. */
function capStop(add){
  if(capOK(add)) return false;
  popAsk(t('up.need'), function(){ go('plans'); });
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
   name stays where a check can see it. */
function upStop(ok){
  if(ok) return false;
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
  /* NOTHING IS SENT FROM HERE, and that is 2026-09-06. It used to call
     netPlanUp() -- the phone telling the server what it had decided its own
     plan was -- and that is the road that is gone: the server decides.
     「だから端末でやるわけねえだろ」 OWNER 2026-09-03.

     What is left is the sentence. It is said from here because here is the
     one place that knows the plan MOVED, whichever road moved it: the plans
     screen in a browser, a purchase, a restore, or a launch that asked the
     server and was told the subscription has run out. */
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
