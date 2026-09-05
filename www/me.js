/* Lingua — who you are (chapter 20)
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   Until now the language was the author. That was true while there was one of
   each and nothing outside the phone, and it stopped being true the moment a
   post had a name on it: a person has one name and may write in three
   languages, and the reader needs to know both -- who wrote it, and what it
   is written in. 「しかも言語名とユーザー名並べろよ」

   So an account: a name, a handle, and nothing else yet. It belongs to the
   person rather than to any language, so it is filed beside the posts and not
   under langKey().

   A post does NOT keep a copy of the name. The language's name it does keep,
   because that is what the post is written in and renaming a language later
   would rewrite what old posts say they are. A person's name is not part of
   what they said; change it and every post of yours shows the new one, which
   is what every timeline does.
   ========================================================================= */

/* =========================================================================
   20. Who you are
   ========================================================================= */

var LS_ME='lingua.me';
/* `avSent` is not part of who somebody is. It is the copy of the face that
   the profile row on the server was last given, kept so netAvSync() can tell
   "the face has moved" from "the face has never been sent" without asking the
   server every launch. It is written by netAvSync() and read by nothing else.
   It is here rather than in SET because it belongs to the account, and SET is
   the person's settings and travels between them. */
/* 何文字まで入るか。一箇所 ── OWNER DECISION, 2026-08-25。

   `handle` の 24 はこちらが選んだ数ではなく、サーバが持っている天井を
   写したもの: `supabase/schema.sql` の
     check (handle ~ '^[a-z0-9_]{2,24}$')
   これより長い ID はアプリを通ってもサーバに弾かれる。**下限の 2 は
   まだ効いていない** ── 一文字の ID はここを素通りして、サーバで黙って
   失敗する。断るには断る言葉が要り、www/i18n/*.js はこの枝の持ち物では
   ないので、そこは残してある。

   残りの四つはこちら側だけの数で、測った上で選んである（390pt の画面で
   タイムラインの名前は かな19文字ぶん、@ の行は かな10文字ぶん）。

   maxlength は「これから打つもの」にしか効かない。既に長いものが入って
   いる欄は縮まない ── ブラウザは value を切らない。リリース前で誰も
   持っていないので今は関係ないが、性質として書いておく。 */
var ME_MAX={ name:30, handle:24, bio:160, link:100, loc:30 };
/* `uid` is the account this copy belongs to -- the server's own name for it,
   which is `profile.id` and `SESS.uid` and nothing a person types. It is here
   because signing out used to leave everything else in this object exactly
   where it was, and the next person to sign in got it.

   OWNER 2026-08-27, on a phone, with a photograph: 「Appleでログインしたあと
   前のアカウントが出てくるんだけどなんで？」 The 「ユーザー名とID」 screen
   was offering `Lingua` and `@lingua2` to an account that had just been made.

   It could not be fixed by emptying this on the way out, and that is the
   whole reason `uid` exists rather than a line in netOut(). Two things are
   true at once and only the uid can tell them apart:

     a different person signs in    the previous person must not be here
     the same person signs back in  their name must still be theirs

   A handle cannot do it (it is chosen, and it changes), an address cannot do
   it (an Apple account may not have one -- netMail() says so), and the door
   they came in by cannot do it. The uid is what the server means by "this
   account".

   Copies written before this field existed have no uid. They are treated as
   nobody's rather than as everybody's: the first account to sign in adopts
   one, which is right on the phone this was actually about -- a person who
   made an account, then signed in again as themselves -- and on any phone
   where it is wrong, the wrong thing is an empty name rather than somebody
   else's. */
var ME={name:'', handle:'', bio:'', pic:'', link:'', loc:'', avSent:'', uid:''};
function meBlank(){ return {name:'', handle:'', bio:'', pic:'', link:'', loc:'', avSent:'', uid:''}; }
function meFrom(m){
  var o=meBlank();
  if(m){ o.name=String(m.name||''); o.handle=String(m.handle||'');
         o.bio=String(m.bio||''); o.pic=String(m.pic||'');
         o.link=String(m.link||''); o.loc=String(m.loc||'');
         o.avSent=String(m.avSent||''); o.uid=String(m.uid||'');
         /* Two lists, and absent is not empty -- meFollowing() and
            meFollowers() are written against that and would answer [] for a
            list that had been turned into one. */
         if(m.fo && m.fo.length) o.fo=m.fo;
         if(m.fr && m.fr.length) o.fr=m.fr; }
  return o;
}
/* Whether this copy has anything in it. Used before parking one: a blank
   copy is not worth a key, and writing one would matter -- wipeHere() blanks
   ME and then calls netOut(), so a park that did not ask this would write the
   deleted person straight back out of memory, one line after lsWipeAcct() had
   removed every trace of them. 「アカウント削除で残るものねえ」 */
function meHas(m){
  return !!(m && (m.name || m.handle || m.bio || m.pic || m.link || m.loc ||
                  (m.fo && m.fo.length) || (m.fr && m.fr.length)));
}
function meRead(){
  ME=meBlank();
  try{ ME=meFrom(JSON.parse(localStorage.getItem(LS_ME)||'null')); }catch(e){}
}
meRead();
function saveMe(){
  try{ localStorage.setItem(LS_ME, JSON.stringify(ME)); }catch(e){}
}
/* ---- whose phone this is, right now ------------------------------------
   Called when the session's identity changes -- signing in, signing out, and
   a refresh that comes back naming somebody else. net.js's netTook() and
   netOut() are the two places that know, and they are the only callers.

   NOTHING IS DELETED HERE. `bio`, `link` and `loc` exist on this phone and
   nowhere else -- netMakeProfile() sends `handle`, `display` and `av`, and
   that is all of it -- so a sign-out that emptied them would be a loss with
   no way back, which is the one thing `CLAUDE.md` does not allow: 「人が
   作ったものは消さない」.

   So the copy is PARKED, under this key plus the uid that owns it, and
   handed back when that account returns. It stops being visible; it does not
   stop existing.

   lsWipeAcct(uid) removes the parked copy filed under that uid, so a parked
   copy goes with the account when the account goes -- and only that account's.
   bkPack() walks SLICES under langKey() and has never carried lingua.me at
   all, so parking takes nothing out of a backup that was in one. */
function meParkKey(uid){ return LS_ME + '.' + uid; }
function meFor(uid){
  var want=String(uid||''), had=String(ME.uid||''), park, got=null;
  if(want===had) return;
  /* Out of the way first, so nothing below can write over it. A copy with no
     owner is not parked anywhere: there is no key to park it under, and it
     is the one this phone has been using. */
  if(had && meHas(ME)){
    try{ localStorage.setItem(meParkKey(had), JSON.stringify(ME)); }catch(e){}
  }
  /* An unclaimed copy is adopted rather than thrown away -- see `uid` above.
     Only when somebody is actually arriving: signing OUT of an unclaimed copy
     leaves it unclaimed and leaves it where it is. */
  if(!had && want && meHas(ME)){ ME.uid=want; saveMe(); return; }
  if(want){
    try{ park=localStorage.getItem(meParkKey(want)); }catch(e){ park=null; }
    if(park){ try{ got=JSON.parse(park); }catch(e){ got=null; } }
  }
  ME=meFrom(got);
  ME.uid=want;
  saveMe();
}
/* And once at load, because the two keys are read by two files that do not
   know about each other: net.js reads lingua.sess when it loads and this file
   reads lingua.me when it loads, and nothing between them ever compared the
   two. A phone that was signed in as somebody while carrying somebody else's
   copy stayed that way until the next sign-in.

   net.js is loaded before this file (www/index.html), so SESS is here to be
   asked. Signed out, this parks whatever the phone was holding, which is the
   same thing netOut() does and is right for the same reason. */
meFor(SESS && SESS.uid);
/* Nobody is made to fill this in before they can post. With no name the
   language's name stands in, which is what it did before there were accounts
   at all -- so the screen never shows an empty space or a word invented to
   fill one. */
/* ---- FOLLOW_SEAM ---------------------------------------------------------
   Who this person follows, and who follows them. Two lists of handles, and
   they are asked for through these two rather than read out of ME wherever
   somebody happens to want them -- so the day they come from somewhere else,
   they come from somewhere else here and in no other place.

   `fo` is writable from this phone: following somebody is something you do.
   `fr` is not -- being followed is something that happens to you, and this
   phone is not where it happens. Both are absent on an account that has
   neither, and absent is not empty. */
/* AND NEITHER LIST HAS YOU IN IT. `follow` in supabase/schema.sql carries
   `check (follower <> followed)`, so a row saying you follow yourself is a
   row the server cannot hold and the copy must not either -- 「SNSは全部
   サーバー」. It got into the copy anyway: `ME.fo` is written by a press on
   this phone and by meFollowPull(), meFollow() has guarded against your own
   handle since it was written, and meHandle() falls back to the LANGUAGE'S
   name when a profile has no handle on it yet -- so the handle this phone
   answers to today is not always the one it answered to when the row went in.

   What the owner saw was that row: 「フォロー中」 with themselves at the top
   of it, no name, no face, no button, and no 「フォローされています」 -- which
   is what every one of those four is, on a row about yourself.
   「ここにフォローされてますがないよ」 OWNER 2026-09-04, 1-following.png.

   HERE, because these two are already the one place both lists are read
   -- the comment above says so -- and the count under a profile is the length
   of what these answer. Taking it out at the row instead would leave the
   number saying two and the list showing one. */
function meNotMe(hs){
  var out=[], me=meHandle(), i;
  for(i=0;i<hs.length;i++) if(String(hs[i])!==me) out.push(hs[i]);
  return out;
}
function meFollowing(){ return meNotMe((ME.fo && ME.fo.length)? ME.fo : []); }
function meFollowers(){ return meNotMe((ME.fr && ME.fr.length)? ME.fr : []); }
/* HOW MANY, OR NOTHING AT ALL -- AND THE TWO MUST NOT SHARE A BRANCH.
   -------------------------------------------------------------------------
   「サーバーに聞く前にロードを挟み、遅れて数字が動くことを絶対に無くす。0 と
   出て1秒後に1に変わる、をしない。」 OWNER 2026-09-04.

   Both counts were the LENGTH of a list, and a list nobody has answered for
   is empty -- so a profile opened before meFollowPull() lands printed 0 under
   both words and then jumped to the real number when the answer arrived. A
   number that moves under somebody's eye is a number they cannot trust, and
   it is the same 「empty と broken は別」 the timeline already obeys one
   screen over (snsWaitHTML).

   `ME.fo` being an ARRAY is the answer -- meFollowPull() writes one, empty or
   not, and following nobody is a real 0. Absent is 「nobody has asked yet」,
   which is what the comment over the two lines above has always said and what
   the two lines above collapsed. `undefined` carries it out of here, the same
   way whoOf() keeps somebody else's two undefined rather than nailing them to
   0, and meCount() below is the one place either is drawn. */
function meNFollowing(){ return ME.fo? meFollowing().length : undefined; }
function meNFollowers(){ return ME.fr? meFollowers().length : undefined; }
/* A count, or the mark that says it has not arrived. One function, because
   your card and somebody else's ask the same question and used to answer it
   in two places with two different `||0`s on the end. The mark is the
   timeline's own -- `.pullrule` in www/index.html, the thing that turns while
   an answer is out -- at the size of a word rather than of a screen. */
function meCount(n){
  return (typeof n==='number')
    ? '<b>'+esc(String(n))+'</b>'
    : '<span class="numwait"><span class="pullrule go">'+ICON_PLUS+'</span></span>';
}
function meName(){ return ME.name || langName || ''; }
function meHandle(){
  return ME.handle || String(meName()).toLowerCase().replace(/[^a-z0-9]+/g, '');
}
/* ---- the profile is TYPED and then SAVED --------------------------------
   OWNER DECISION 2026-09-03: 「プロフィールも何か変えたら保存ボタン欲しい右上
   ／自分のポップで／入力内容を保存しますか？はいいいえ／ではいなら保存　いいえ
   ならそのまま戻る」

   Until this, every one of these five wrote ME and called saveMe() on every
   keystroke, so a field brushed by a thumb was already the account's name.
   They put what was typed in the buffer instead (www/shell.js § KEEP) and
   meKeepSave() below is the only thing that writes ME.

   The buffer is filed under this screen, and this screen is a form, so the
   key is the one openForm() was given. It is written once here rather than
   guessed at in five places. */
var ME_KEY=keepKeyOf('form', 'me:');
/* What the five fields hold right now, which is what "changed" is measured
   against. Read off ME and not off the page: the page is what is being typed
   into. */
function meWas(){
  return {name:String(ME.name||''), handle:String(ME.handle||''),
          bio:String(ME.bio||''), link:String(ME.link||''), loc:String(ME.loc||'')};
}
/* And what goes in a field when the screen is drawn: what has been typed, or
   what it held when the screen opened. */
function meTyped(f){ return keepVal(ME_KEY, f); }
/* Writing the five down. `v` is only the fields somebody actually touched, so
   a field nobody typed into is not written over -- which matters here because
   netBioSync() can fill the bio in from the account while this screen is
   open. */
function meKeepPut(v){
  if(v.hasOwnProperty('name')) ME.name=String(v.name);
  if(v.hasOwnProperty('handle')) ME.handle=String(v.handle);
  if(v.hasOwnProperty('bio')) ME.bio=String(v.bio);
  if(v.hasOwnProperty('link')) ME.link=String(v.link);
  if(v.hasOwnProperty('loc')) ME.loc=String(v.loc);
  saveMe();
}
/* THE @ IS THE ONE THING ON THIS SCREEN THIS PHONE DOES NOT DECIDE, and that
   is why keepSave() carries an answer back at all.

   `profile.handle` is `unique not null` on the server, so a handle can be
   taken by somebody else between somebody choosing it and pressing Save --
   and on 2026-09-03 the owner decided it may also be refused for a second
   reason, that it was changed less than fourteen days ago (docs/FEATURE_RULES.md
   § 「@ は14日に一度しか変えられない」; the refusing goes in profile_rename()
   in supabase/schema.sql and is not this branch's).

   So: SAVED MEANS SAVED, AND REFUSED MEANS YOU ARE STILL HERE. If the answer
   is no, the refusal is said and the screen stays exactly as it is, with what
   was typed still in the field. A "yes" on the way out that went back anyway
   would take the refusal off the screen before it could be read -- and the
   owner asked for the refusing to be visible on 2026-08-25: 「断る文章と実際に
   断ってほしい」.

   THIS REPLACED THE CHECK THAT RAN WHILE SOMEBODY WAS TYPING. There is a
   moment for it now -- pressing Save -- so the 700ms wait for a thumb to
   stop, the second wait for the field to lose focus, and putting the old
   handle back afterwards are all gone. That timer existed only because the
   screen had no such moment: 「ここに提出ボタンは無く、打つそばから保存される
   画面なので」 was the reason written over it, and it is no longer true.

   Not asked when the handle has not moved: your own handle is taken by you,
   which is the right answer to the wrong question. Not asked with no signal
   either -- the answer that never came is not evidence either way, which is
   the same decision the timer made and the one place it is kept. */
function meKeepSave(v, done){
  var h=v.hasOwnProperty('handle')? String(v.handle) : String(ME.handle||'');
  if(h===String(ME.handle||'')){ meKeepPut(v); done(true); return; }
  if(h.length<2 || h.length>ME_MAX.handle){ toast(t('net.badhandle')); done(false); return; }
  if(typeof netSignedIn!=='function' || !netSignedIn()){ meKeepPut(v); done(true); return; }
  netHandleFree(h, function(free){
    if(!free){ toast(t('net.handle.taken')); done(false); return; }
    meKeepPut(v); done(true);
  }, function(){ meKeepPut(v); done(true); });
}
/* Each of these makes its box as tall as what is in it. Nothing here calls
   render() -- a profile that redrew on every letter would take the keyboard's
   focus off the field being typed into -- so lnGrow() is what says the field
   grew, the same call the composer's line makes. */
function meSetName(v){ keepSet('name', String(v||'')); lnGrow('me-nm'); }
/* A line about yourself, which is the one thing on a profile that is not
   about the language. It is never invented and never stands in for
   anything: with nothing written there is nothing there. */
function meSetBio(v){ keepSet('bio', String(v||'')); }
/* 居るところは、ただの文字列。検証も、書式も、候補も無い ──
   OWNER DECISION, 2026-08-25:
     「自由入力です。」
     「だって自分の国入れたい人だっているやん」
   国名を入れる人が居る、というのが理由。だから国コードにしない、候補リスト
   にしない、検証しない、地図にしない。端末の位置は使わない ── CoreLocation
   も権限も Info.plist も要らないし、開けてもいけない。

   **リンクは違う。** 「リンクもhttpのリンクの形からじゃないと入力できない
   ようにして欲しい」 OWNER 2026-08-28。この欄はリンクの形からしか打てない。

   2026-08-25 の決定を覆したのではない ── あの日オーナーが答えたのは
   **居るところ**についてで（理由が「自分の国入れたい人」なのがその証拠）、
   リンクについては何も言っていなかった。この欄が自由入力だったのは、
   居るところの答えをリンクに当てはめた**こちらの推測**で、決定ではない。 */
/* 打てるのは、リンクの形になっているものと、そこへ向かって打っている途中の
   ものだけ。`h` `ht` `htt` `http` `http:` `http://` は途中なので通り、`e` は
   通らない ── そこから始まるリンクは無いので。

   空も通る。リンクが無いことは、書式の間違いではない。

   そして**前からあった値を消している最中も通す**。この規則より前に入った
   `example.com` のような値は、一字ずつ消せないと消せなくなる ── 人が入れた
   ものを消せない画面にはしない。 */
function meLinkOK(v, was){
  var s=String(v||''), w=String(was||''), c=s.toLowerCase();
  if(!s) return true;
  /* 大文字小文字は見ない。`HTTPS://` は綴りの間違いではなく、打った字は
     打ったまま残す ── ここで決めているのは形であって、綴りではない。 */
  if(c.indexOf('http://')===0 || c.indexOf('https://')===0) return true;
  if('http://'.indexOf(c)===0 || 'https://'.indexOf(c)===0) return true;
  return w.indexOf(s)===0 && s.length < w.length;
}
/* 通らなかった打鍵は**無かったことにする**。画面には何も出ない ──
   「アプリ内に説明を書くの禁止」。欄が受け付けないことが、それ自体で
   言っていることになる。 */
function meSetLink(v){
  var s=String(v||''), e;
  /* What it is being compared against is the last thing this field ACCEPTED,
     which is now in the buffer rather than in ME -- otherwise a value typed
     and not yet saved could not be deleted one character at a time, which is
     the whole of the third paragraph above. */
  if(!meLinkOK(s, meTyped('link'))){
    e=document.getElementById('me-lk');
    if(e) e.value=meTyped('link');
    lnGrow('me-lk');
    return;
  }
  keepSet('link', s); lnGrow('me-lk');
}
function meSetLoc(v){ keepSet('loc', String(v||'')); lnGrow('me-lc'); }
/* ---- a face of your own ------------------------------------------------
   A file input, because that is the one way a WKWebView opens the camera
   roll without a plugin, and the plugin would have to be installed on a
   Mac before anybody could try it.

   It is kept as a data URL, square, 128 across. Not the picture somebody
   chose: a phone photo is three or four megabytes and localStorage holds a
   few for everything this person owns -- their words, their letters, their
   whole language -- so a face at full size would be the thing that filled
   it. 128 is twice what the largest place it is shown needs.

   The element is reached by id rather than handed in, because a file input
   has no value worth passing: what was chosen is in .files. */
var ME_PIC=128;
function meSetPic(){
  var el=document.getElementById('me-pic'), f=el && el.files && el.files[0];
  if(!f) return;
  var r=new FileReader();
  r.onload=function(){ mePicKeep(String(r.result||'')); };
  r.onerror=function(){ toast(t('me.pic.bad')); };
  r.readAsDataURL(f);
}
/* Cropped to the middle square, then squeezed. Everything that shows a face
   shows a circle, so the sides of a landscape photo were never going to be
   seen and keeping them would only cost room. */
function mePicKeep(url){
  var im=new Image();
  im.onload=function(){
    var side=Math.min(im.width, im.height);
    var c=document.createElement('canvas'), x;
    c.width=ME_PIC; c.height=ME_PIC;
    x=c.getContext('2d');
    x.drawImage(im, (im.width-side)/2, (im.height-side)/2, side, side, 0, 0, ME_PIC, ME_PIC);
    /* The same quality every other photograph in this app is squeezed at.
       It was 0.82 here and POST_PICQ everywhere else, with nothing saying why
       -- one naked number against a named one, which is docs/DUPLICATES.md
       item 6. 「合わせていいよ」 OWNER 2026-09-04. */
    try{ ME.pic=c.toDataURL('image/jpeg', POST_PICQ); saveMe(); }
    catch(e){ toast(t('me.pic.bad')); return; }
    openMe();
  };
  im.onerror=function(){ toast(t('me.pic.bad')); };
  im.src=url;
}
/* ---- 画像をタップしたとき -----------------------------------------------
   「長押しで消えるってわかんないだろ普通に。アイコンをタップした時に
     iPhone標準の写真を選ぶか、削除するか出てくるやつでいいだろ」
   OWNER 2026-09-01。

   THE SYSTEM'S OWN SHEET, and only the system's. 「システム標準を最優先。
   独自実装は『標準では実現できない場合のみ』」 -- so this asks
   LinguaShare.ask(), which puts up a UIAlertController, and there is no
   HTML anywhere in this file pretending to be one. A sheet drawn here to
   look like that one is the thing CLAUDE.md § Shape bans wearing the name of
   the thing it allows.

   ONE LEVEL OF MODAL. 「モーダルは最大1階層」 -- so the picture is chosen
   through the native picker (pickPhoto, PHPicker) rather than by clicking a
   file input, which would put iOS's OWN 「写真を選ぶ / 撮る / ファイル」 sheet
   on top of this one and make it two.

   The file input is still here for a phone with no native side under it --
   the browser the checks run in. It is not a second way of asking: it is the
   same one road in, mePicKeep(), reached from the only door that exists
   there. */
function mePicAsk(){
  var p=sharePlug();
  /* No native side: the ordinary file input, which is what this screen was
     before there was a sheet to put up. */
  if(!p){ mePicFile(); return; }
  p('LinguaShare', 'ask', {
    options:[t('me.pic.pick'), t('me.pic.del')],
    /* The second one is red. It is the one that takes something away. */
    destroy:1,
    cancel:t('me.pic.no')
  }).then(function(r){
    var i=(r && typeof r.i==='number')? r.i : -1;
    if(i===0) mePicPick();
    else if(i===1) meDropPic();
    /* -1 is somebody changing their mind, and nothing is said about it. */
  })['catch'](function(){ mePicFile(); });
}
/* The phone's own library. Same call the composer makes (pwPickLib), same
   answer: `b64` is the picture, without the data URL on the front, and
   mePicKeep() is the one road in for a picture however it arrived.

   ME_PIC*2 across, not ME_PIC: mePicKeep() cuts the middle square out before
   it squeezes, so a picture arriving already at 128 would lose half its
   width to the crop and be scaled back up. */
function mePicPick(){
  var p=sharePlug();
  if(!p){ mePicFile(); return; }
  p('LinguaShare', 'pickPhoto', {max:ME_PIC*2, limit:1}).then(function(r){
    var b=(r && r.b64)? String(r.b64) : '';
    /* An empty answer is somebody backing out of the picker. */
    if(!b) return;
    mePicKeep('data:image/jpeg;base64,'+b);
  })['catch'](function(){ toast(t('me.pic.bad')); });
}
/* The way in where there is no native side. The input is in the page with no
   size, so this is the only thing that ever opens it. */
function mePicFile(){
  var el=document.getElementById('me-pic');
  if(el) el.click();
}
/* Taking it off. Not a button any more -- it is the red row of the sheet --
   so it is not in www/act-map.js: nothing on a screen names it. */
function meDropPic(){ ME.pic=''; saveMe(); openMe(); }
/* ---- what somebody types after an @ ------------------------------------
   「IDは2文字以上で登録してくださいと / このIDはもう使われていますと
     みたいに断る文章と実際に断ってほしい」OWNER, 2026-08-25

   断る言葉は二つとも既にあり、十言語ぶん揃っている ── `net.badhandle` と
   `net.handle.taken`。オンボーディング (`obWhoGo`) が同じ二つで同じことを
   している。新しい鍵は足していない。

   **断るのは保存を押したとき**で、それは meKeepSave() にある。打っている
   途中に待ち構えて見る仕組み（700ms のタイマー、欄から手が離れるのを待つ、
   断ったら元の ID に戻す）は**削った** ── それが存在した理由は「この画面に
   は提出ボタンが無く、打つそばから保存される」ことだけで、それがもう本当ではない。

   欄が受け取るのは「@ の後ろに打って生き残る字」だけで、それは打鍵ごとに行う。
   比べるのはその後の文字列だから、大文字で打って小文字になっただけの人は
   「変えた」ことにならない。 */
function meSetHandle(v){
  keepSet('handle', String(v||'').toLowerCase().replace(/[^a-z0-9_]+/g, ''));
  lnGrow('me-hd');
}

/* ---- the block at the top of the profile ------------------------------- */
/* Who you are, in one block: the face, the name, the handle, the line about
   yourself, and who follows whom. The two counts used to be a row of their
   own under this, in the same small grey type as the language's counts under
   THAT -- three strips of the same thing, none of which was a heading for the
   others. They are part of who somebody is, so they are in here. */
/* Beside the face: the name, the handle and the language, which is the same
   three things a post says about whoever wrote it and in the same order.
   Under them, at the left margin and across the whole phone, the line
   somebody writes about themselves.

   All of it used to be one row -- face, a column of words, the button -- so
   that line read in a column two thirds of the phone wide, indented from both
   sides. 「なんでそんな中央に寄ってるの？相手のページに飛んだらbioすらまとも
   に読めないやんけ」 On somebody else's page it is most of what there is to
   read. 「アイコンの横に名前と@と言語つければいいんじゃない」

   The language wears the same gold tag it wears on a post, and pressing it
   opens what the language is for -- which is what the tag is asking about.
   Renaming a language is in the settings, where the rest of naming it is. */
function meCard(){
  return '<div class="mecard">'+
    '<div class="metop">'+
    '<div class="pav">'+
      postFace({who:meName(), lname:langName, av:postAvatar()})+'</div>'+
    '<div class="mewho">'+
      /* ONE PLACE SAYS WHETHER A NAME WEARS THE MARK, and it is postBadge()
         -- the same function every post and every other person's card asks.
         It said planBadge(plan()) here, which is a second answer to one
         question and is the half that only ever worked on your own phone. */
      '<div class="pname">'+esc(meName())+postBadge(whoOf(meHandle()))+'</div>'+
      '<div class="mehr">'+
        '<span class="phandle">@'+esc(meHandle())+'</span>'+
      '</div>'+
    '</div>'+
    '<button class="meedit"' + DO('openMe') + '>'+esc(t('me.edit'))+'</button>'+
    '</div>'+
    (ME.bio? '<div class="pbio">'+esc(ME.bio)+'</div>' : '')+
    /* The language, between what somebody says about themselves and how many
       people are reading them. It was a small tag beside the handle, which is
       where a timeline puts an affiliation and is exactly the wrong size for
       the thing this whole app is about.
       「フォローと自己紹介の間に」「linguaパッチの代わり」 */
    wldRow()+
    /* There is no way in on the profile any more. 「get a バッチ消していいよ。
       なんか品がないそこに並ぶと」 OWNER 2026-09-01. It sat between what
       somebody says about themselves and how many people read them, which is
       a row of facts about the person -- an advertisement standing in that
       line is what the owner is looking at. The plans are still reached from
       the settings; nothing about what a plan does has changed. */
    /* FOLLOW_SEAM: the two numbers are asked for rather than read, so the day
       they come from somewhere else they come from somewhere else HERE and
       nowhere else. */
    '<div class="pfstats">'+
      '<button class="pfst"' + DO('go', ["follows", "ing"]) + '>'+
        meCount(meNFollowing())+' '+esc(t('me.following'))+'</button>'+
      '<button class="pfst"' + DO('go', ["follows", "ers"]) + '>'+
        meCount(meNFollowers())+' '+esc(t('me.followers'))+'</button>'+
    '</div>'+
    '</div>';
}
/* ---- somebody else's card ----------------------------------------------
   Everything on it comes off a post they wrote, which is where their name,
   their handle, their face and their language's name already are -- the whole
   reason a post carries them. FOLLOW_SEAM: whether you follow them is the
   only thing here that is about you.

   No bio and no counts: neither is on a post, and inventing them out of
   nothing is how a profile starts lying. They arrive with the person when
   there is a server, and they arrive HERE. */
/* THE PEOPLE THIS PHONE HAS ASKED ABOUT, by handle -- the server's answer,
   kept for as long as the app is open.

   Everything on a person's page used to come off a POST of theirs, and a
   person found in the search has written nothing this phone is holding: the
   loop below fell out of its end, postFace() got a person with no name and
   drew '?' out of it, and the page was a question mark with a Follow button.
   「人のプロフィールが？」

   WHO_ASKED is separate from WHO_HAVE because "asked, and there is nobody by
   that name" is an answer and has to stop the asking. Only a request that
   could not be MADE clears it, so a phone that went through a tunnel tries
   again and a handle that has been deleted is asked about once. */
var WHO_HAVE={}, WHO_ASKED={};
/* Asked for by the page that draws them, the way the timeline and the notices
   ask for theirs. Never for your own: that is ME, it is on this phone, and a
   request for it would be the app asking somebody else who you are. */
function whoPull(h){
  h=String(h||'');
  if(!h || h===meHandle() || WHO_ASKED[h]) return;
  WHO_ASKED[h]=1;
  netWho(h, function(p){
    /* Nobody by that name. It stays asked -- there is nothing to ask again. */
    if(!p) return;
    WHO_HAVE[h]=p;
    render();
  }, function(){ WHO_ASKED[h]=0; });
}
function whoOf(h){
  var i, p, got;
  h=String(h||'');
  /* YOU ARE THE ONE PERSON THIS PHONE ALREADY KNOWS, AND NOTHING READ IT.
     ---------------------------------------------------------------------
     whoPull() refuses to ask the server for your own handle and says why in
     as many words -- 「that is ME, it is on this phone」. It was right and it
     was only half a sentence: nothing here ever went and got ME, so your own
     handle fell past WHO_HAVE, past the POSTS below, and out of the end as
     `{who:'', av:null}`. postFace() draws '?' out of that and postWho() draws
     nothing, so YOUR OWN ROW was a question mark with no name on it.
     「ここも？になるの謎だし」 OWNER 2026-09-04, 1-following.png.

     It looked right for as long as this phone happened to be holding a post
     of yours -- the loop below found one and took the name off it -- which is
     every screenshot anybody had taken. A phone that has not pulled a
     timeline yet has none, and the row is the question mark.

     Your own row is on this screen legitimately: somebody else's followers
     list has you in it whenever you follow them, which is the ordinary way to
     arrive there. So this is the first answer and not an exception -- ME is
     what you look like NOW, which is exactly what the server's row is for
     everybody else and is fresher than any of them. */
  if(h===meHandle())
    return {who:meName(), hd:h, av:postAvatar(), lname:langName||'', id:'me',
            bio:String(ME.bio||''), fo:meFollowing().length,
            fr:meFollowers().length, out:false,
            /* AND IT SAYS SO. `mine` means 「this is the reader's own」 and it
               is what postBadge() asks -- so leaving it off took the mark off
               your own card the moment meCard() started asking this instead
               of plan(). Measured, not read: `bdgw` was in the card and then
               was not. */
            mine:true, pro:can('badge')};
  /* THE SERVER IS THE RECORD. What it sent is what the person looks like NOW,
     which is the right answer for a page about them; a post's copy is frozen
     at the moment it was written (rule 8) and is right for the post. */
  got=WHO_HAVE[h];
  if(got)
    return {who:got.who||'', hd:h, av:got.av, lname:got.lname||'',
            /* THE FACE'S KEY, and it is the person. postFace() caches a drawn
               face under `id` and falls back to 'me' when there is none -- so
               a person wearing letters they drew was filed under MY key, and
               the one face on a page is only why it did not show yet. A page
               about somebody else is the last place to key anything as mine. */
            id:'w:'+h,
            /* WHAT THEY WROTE ABOUT THEMSELVES, passed through rather than
               blanked. 「自己紹介を見せないって選択肢を俺はいつ与えた？」
               OWNER 2026-09-01 -- it is a thing a person wrote and it is
               shown.

               It was `bio:''` outright, which is not the same as absent: the
               day netWho() starts answering with one, a hard-coded '' here
               would throw it away and the screen would go on looking exactly
               as wrong. `claude/acct2` is adding the column and the read; the
               drawing is already here, on both screens that show a person
               (whoCard below and snsWhoRow in www/sns.js), and both already
               draw nothing when there is nothing. So this needs no second
               change when the column lands.

               The two counts stay 0 and stay a lie waiting to be told: no
               request in www/net.js asks for anybody's follow counts but your
               own -- every `follow` query there is keyed on SESS.uid. That is
               net.js's and is in the report. */
            /* THE ADDRESS OF THEIR LANGUAGE, and whether its page is open.
               `claude/acct2`'s ccf439d made netWho() answer with both --
               `lid` is the `language` row's id, which is what netSlices()
               needs, and `lpub` is whether `published_at` is set. Without the
               first there is nowhere for a door to go; without the second the
               app would offer one that `slice_read` refuses.

               Passed through with `||''` and `!!` so this reads the same on a
               phone whose net.js does not answer with them yet: no address,
               no door, and the name stays a plain row exactly as it is now. */
            lid:got.lid||'', lpub:!!got.lpub,
            /* AND WHETHER THEY WEAR THE MARK. Passed through with `!!` for
               the reason `lid` and `lpub` above are: a phone whose net.js
               does not answer with it yet draws a name with nothing beside
               it, exactly as it does today. `profile_seen` carrying it, and
               netWho() answering with it, are the other half and are in the
               report -- www/net.js and supabase/schema.sql are not this
               session's files. */
            pro:!!got.pro,
            /* HOW MANY THEY FOLLOW AND HOW MANY FOLLOW THEM, passed through
               rather than nailed to 0. Both were `0` here because no request
               in www/net.js had ever asked for anybody's but your own --
               every `follow` query was keyed on SESS.uid, which is why the
               two numbers on somebody else's page were not wrong numbers but
               numbers nobody had ever taken. `claude/acct2`'s eb68639 reads
               them off `profile_seen` and netWho() answers with them.

               Undefined where the server said nothing, which is not 0 and is
               the same distinction postNLike() makes in www/post.js. */
            bio:got.bio||'', fo:got.fo, fr:got.fr, out:!!got.out};
  /* And until it answers, the copy: a post of theirs, if this phone has one.
     Better than an empty page for the moment the request is out, and it is
     where the whole page came from before there was anywhere else. */
  for(i=0;i<POSTS.length;i++){
    p=POSTS[i];
    /* No `lid` on this road even though a post carries `lang`: that is the
       id of the language the POST was written in, which is the same language
       only until somebody makes a second one. A door built on it would open
       the wrong article for anybody who has two, and 「持っている人には出て、
       持っていない人には出ない」 is the half-working screen CLAUDE.md bans.
       The address comes from netWho() or not at all. */
    if(String(p.hd||'')===h)
      /* `id` is the FACE'S key here and not the post's -- the same reason as
         above. Taking p.id would file this person's face under one of their
         posts, which is a key that means something else. */
      /* AND THE TWO COUNTS ARE LEFT ALONE, which is not the same as 0. A
         post carries neither and never did -- they were `p.fo||0`, so a
         person this phone knows only from something they wrote printed 0
         under both words and jumped to the real number when netWho() landed.
         「0 と出て1秒後に1に変わる、をしない」 OWNER 2026-09-04. */
      return {who:p.who||'', hd:h, av:p.av, lname:p.lname||'', id:'w:'+h,
              bio:p.bio||'', fo:p.fo, fr:p.fr, out:!!p.out,
              /* Off the POST, which is where the mark lives (postBadge in
                 www/post.js) -- so a person this phone knows only from
                 something they wrote wears it on their page too. */
              pro:!!p.pro};
  }
  /* Nobody by that name, here or anywhere yet: no name, no face, and no
     count -- an unanswered number is not a zero, one line up. */
  return {who:'', hd:h, av:null, lname:'', bio:'', out:false, pro:false};
}
function meFollows(h){ return meFollowing().indexOf(String(h||''))>=0; }
/* AND WHERE THAT LIST COMES FROM WHEN IT IS NOT THIS PHONE THAT MADE IT.
   -------------------------------------------------------------------------
   ME.fo was written by meFollow() and by nothing else -- a press on THIS
   handset -- while netFollow() had been telling the server about every press
   since follows existed. Nothing ever read it back. So the same account on a
   second phone followed the same people and knew none of it.

   The owner has an SE2 and a 17, which is exactly the two phones that makes
   it: every Follow button said Follow for somebody already followed, and the
   followed timeline threw the server's own answer away against an empty list.

   Once a session, and the copy is replaced rather than merged: an unfollow
   made on the other phone is a row that is GONE, and there is no way to tell
   a missing row from one this phone has not heard of yet by merging. The
   server is the record -- 「SNSは全部サーバー」 -- and this is the copy
   catching up with it.

   Only a request that could not be MADE is asked again. `null` is that;
   an empty list is an answer and means this account follows nobody. */
var FO_ASKED=false;
function meFollowPull(){
  var was;
  if(FO_ASKED || !netSignedIn()) return;
  FO_ASKED=true;
  was=meFollowing().join(',');
  netFollowing(function(hs){
    if(!hs) return;
    /* Somebody pressed Follow while this was in the air. That press is newer
       than this answer and netFollow() has already carried it to the server,
       so writing the older list over it would take it off the screen and
       leave the server holding the right one. */
    if(meFollowing().join(',')!==was) return;
    ME.fo=hs;
    saveMe();
    render();
  }, function(d, s, m){
    FO_ASKED=false;
    /* 通信が落ちたら何も進まない ── netPop() (www/net.js)。この画面が
       サーバーにしか無いものを取りに行く道の一本で、［再接続］はここも
       もう一度行く。 */
    netPop(d, s, m, meFollowPull);
  });
}
/* AND WHO FOLLOWS YOU, which nothing had ever asked for.
   -------------------------------------------------------------------------
   「フォローされてもフォロワー1って増えないのはなぜ？」 OWNER 2026-08-28.

   `ME.fr` was read by meFollowers() and filled in from localStorage by
   meFrom() -- and written by NOTHING. The number under a profile was the
   length of a list that started empty and had no way to stop being empty, so
   it was not a wrong count: it was a count nobody had ever taken.

   No press can move this one, which is the difference from the list above:
   being followed is something somebody ELSE does, so there is no local change
   to protect and the answer is simply written down. Asked once a session,
   and only a request that could not be MADE is asked again. */
var FR_ASKED=false;
function meFollowerPull(){
  if(FR_ASKED || !netSignedIn()) return;
  FR_ASKED=true;
  netFollowers(function(hs){
    if(!hs) return;
    ME.fr=hs;
    saveMe();
    render();
  }, function(){ FR_ASKED=false; });
}
/* Who you have blocked, as handles, beside who you follow -- both are the
   account's and neither is a language's. The uuids the timeline needs are the
   server's answer (netBlocked); this is what a screen asks so a button can
   say which state it is in without a request. */
function meBlocking(){ return (ME.bl && ME.bl.length)? ME.bl : []; }
function meBlocks(h){ return meBlocking().indexOf(String(h||''))>=0; }
/* Blocking somebody stops following them. Keeping a follow to somebody you
   have blocked is a list that says two opposite things, and the one the
   timeline reads would decide which is true. */
function meBlock(h){
  var bl=meBlocking(), i;
  h=String(h||'');
  if(!h || h===meHandle()) return;
  /* Blocking is a row on the server with your uid on it, so it asks who you
     are first. Kept on this phone as well and shown as blocked either way --
     but a block the server has never heard of is not a block, and a list
     that filled up before anybody signed in would be a promise the timeline
     could not keep. */
  if(!obNeed()) return;
  i=bl.indexOf(h);
  if(i>=0) bl.splice(i, 1);
  else {
    bl.push(h);
    if(meFollows(h)) meFollow(h);
  }
  ME.bl=bl;
  /* And the menu this was pressed from, closed the way every other row that
     ENDS a menu closes it -- postPin(), postDel() and openReport() each do it
     in their own first lines. Blocking takes every post of theirs out of the
     timeline (postBlocked() in www/post.js is what filters them), so the menu
     that was hanging off one of them is gone from the screen while `PMENU`
     still names the post -- and postMenuTook() then reads the next press
     anywhere as "close the menu", swallows it, and somebody has pressed
     something and had nothing happen.

     It could not be reached until today: the ... on somebody else's post did
     not open, so this row had never once been pressed from a timeline.

     Both, and one press came from one of them. A post's menu is open on a
     timeline and a person's on their page, never both, and postMenuTook()
     already closes the two as one pair. */
  PMENU=''; WMENU=false;
  saveMe();
  render();
  netBlock(h, i<0, function(){}, function(){});
}
/* Following and unfollowing, in one place. The list is what this phone knows
   and netFollow() is what the server is told -- not waited on, the way a like
   is not waited on: the button has already changed. */
function meFollow(h){
  var fo=meFollowing(), i;
  h=String(h||'');
  if(!h || h===meHandle()) return;
  if(!obNeed()) return;
  i=fo.indexOf(h);
  if(i>=0) fo.splice(i, 1); else fo.push(h);
  ME.fo=fo;
  /* AND THEIR COUNT MOVES WITH THE BUTTON. 「フォローしたのにその人のフォロワー
     にすぐ出ないよ？」 OWNER 2026-09-02. The button changed on the press, the
     way a like does -- and the number under it did not, because it comes off
     `profile_seen` and nothing asks again until the page is opened afresh.
     One press, two things on screen, and only one of them moved.

     The same shape as postNLike() in www/post.js: the count this phone shows
     is what it knows, moved by what this person just did, and the server's own
     answer replaces it whole the next time netWho() lands. Undefined stays
     undefined -- a number nobody has taken is not a 0 to add to. */
  meFollowCount(h, i<0? 1 : -1);
  saveMe();
  render();
  netFollow(h, i<0, function(){}, function(){});
}
/* Their follower count, moved by one. The copy only -- nothing is stored: it
   is replaced whole by the server's next answer, which is the one that
   counts. */
function meFollowCount(h, d){
  var p=WHO_HAVE[String(h||'')];
  if(!p || typeof p.fr!=='number') return;
  p.fr=Math.max(0, p.fr+d);
}
/* The same card as your own, in the same order, with Follow where Edit is.
   「他人のプロフィールは基本自分が見えてるのと同じ感じ」

   What is not known is simply absent -- no bio and no counts until they
   arrive with the person. Neither is on a post, and a profile that fills them
   in with a zero is a profile saying something it was never told. */
/* Whether the ... on a person's page is open. A boolean and not an id: a
   page is about one person, so there is nothing to tell two of them apart
   with. It is closed by the same press-anywhere rule PMENU is
   (postMenuTook), and by the rows that end it -- meBlock() here and
   openReport() in www/post.js.

   IT IS NOT CLOSED BY LEAVING THE PAGE, and this said it was. `viewReset()`
   in www/shell.js is where a screen forgets, and it names `PMENU` and not
   this -- measured 2026-09-01: open it, go() to the timeline and on to
   somebody ELSE's page, and their menu is already standing open on a page
   nothing has touched. Every press-driven road out is swallowed by the rule
   above and closes it first, which is why nobody has seen it; it is one line
   in a file this branch does not own. */
var WMENU=false;
function whoMore(h){
  if(!h || h===meHandle()) return;
  WMENU=!WMENU;
  render();
}
function whoCard(h){
  var p=whoOf(h), on=meFollows(h);
  /* Frozen, and then nothing else about them. No face, no name, no follow
     button -- following an account that cannot post is a button with nothing
     behind it. What is still under this is their posts, which stay readable
     on their own page and come off the timeline.
     「タイムラインから外す、プロフィールからは凍結してますの表示」

     A freeze can be lifted, so nothing here is destroyed and the page comes
     back by itself. */
  if(p.out)
    return '<div class="empty"><div class="eb">'+esc(t('who.out'))+'</div></div>';
  return '<div class="mecard">'+
    '<div class="metop">'+
    '<div class="pav">'+postFace(p)+'</div>'+
    '<div class="mewho">'+
      /* AND THE MARK, in the slot your own card puts it in. It was on your
         own name and on nobody else's, which is the same fault postBadge()
         is about one screen over: 「相手の画面にパッチ映らない」. */
      '<div class="pname">'+esc(postWho(p))+postBadge(p)+'</div>'+
      '<div class="mehr"><span class="phandle">@'+esc(h)+'</span></div>'+
    '</div>'+
    /* FOLLOW, IN THE SLOT ON THE NAME ROW -- the same slot your own card
       puts Edit in, because it is the same thing: the one action this page
       is about. 「フォローの位置キモいな...のとこにフォロー」OWNER
       2026-09-02.

       It was beside the name with the ... next to it, four things across one
       phone-width line, and the name was the one that gave way. Then it went
       to a line of its own under the ..., which put the thing you came here
       to press below a menu you did not. Now the row reads the same way on
       both cards, and the ... is off it entirely -- see the counts below. */
    '<button class="meedit'+(on?' on':'')+'"' +
      DO('meFollow', [String(h)]) + '>'+
      esc(t(on? 'me.unfollow' : 'me.follow'))+'</button>'+
    '</div>'+
    (p.bio? '<div class="pbio">'+esc(p.bio)+'</div>' : '')+
    /* THE NAME, AND NOT A WAY THROUGH.
       「この言語についてで人のをタップしても自分のが出る」 OWNER.

       It was a button, and it called go("about") without saying WHOSE. The
       page it opens -- vAbout() -> wldPage() in www/home.js -- draws world(),
       LETTERS and langName: the OPEN language, every one of them. So pressing
       somebody else's language name showed them mine, with their name at the
       head of it. Rule 8 exactly, on the one screen a language is read on.

       IT CANNOT BE MADE TRUE YET, AND NOT FOR WANT OF THE CALL. The article
       is a `wld` slice, and `slice_read` in supabase/schema.sql is
       `l.owner = auth.uid()` -- ANOTHER PERSON'S LANGUAGE IS NOT READABLE AT
       ALL, published or not. There is nothing to fetch and so nothing to
       draw, and a door that opens on nothing is what this already was.

       So the door closes and the name stays: the language a person writes is
       a fact of their profile, which is what 「lingua マーク」 asked for. The
       same shape wldRow() takes when a language is private --
       「そもそも非公開ならプロフィールから飛べないんだって」 -- a row, no arrow,
       nothing to press.

       What reopens it is one line here, the day slice_read lets a published
       language be read and there is something to put on the page. */
    /* AND THE DOOR IS OPEN AGAIN, where the language is published. The note
       above says what closes it -- there was nothing to fetch. There is now:
       `language_seen` answers for a published language, `netWho()` carries its
       address as `lid` and whether it is open as `lpub`, and vAbout() draws it
       from that and from nothing of this phone's.

       Still a plain row where `lpub` is false: an unpublished language is one
       `language_seen` and `slice_read` both refuse, so a door would open on a
       refusal. 「そもそも非公開ならプロフィールから飛べないんだって」

       `.wldrow` was written as a button and has said `background:none;
       border:0; font-family:inherit; text-align:left` since then, so the two
       faces are one rule and the row does not move when it becomes pressable. */
    (p.lname
      ? ((p.lpub && p.lid)
          ? '<button class="wldrow"' + DO('go', ["about", String(p.lid)]) + '>'+
              '<span class="wldnm">'+esc(p.lname)+'</span></button>'
          : '<div class="wldrow">'+
              '<span class="wldnm">'+esc(p.lname)+'</span></div>')
      : '')+
    /* The counts, in the same place and the same shape as your own. They come
       off the person -- FOLLOW_SEAM -- and they are the SERVER's now:
       `profile_seen` counts the `follow` rows both ways and netWho() answers
       with them (claude/acct2's eb68639). Before that nothing had ever asked
       for anybody's but your own, so these two were a pair of zeroes with no
       road to any other number.

       AND `undefined` REACHES THE SCREEN, which it did not: it was `||0`
       here, so a person whose row has not landed printed 0 under both words
       and then jumped. 「0 と出て1秒後に1に変わる、をしない」 OWNER
       2026-09-04. whoOf() has always kept the two apart in the data --
       「not answered」 and 「nobody」 -- and this was the line that put them
       back together on the way out. meCount() draws the mark instead, which
       is what SOMETHING under the word Followers is when nobody has counted
       yet.
       AND THEY ARE PRESSABLE. 「フォロワーとかタップしても見れないし」
       OWNER 2026-09-03. They were two `<span>`s under a comment saying the
       two lists behind them were yours -- which was true of the SCREEN and
       not of the question: `netFollowing()` and `netFollowers()` have taken
       an optional handle since claude/acct2 wrote them, and the comment over
       them says in as many words that the screen which would pass it is this
       file's. Nobody had passed it. So the number said how many and there was
       nowhere to go, which is a fact printed as a button-shaped dead end. */
    /* AND THE ... AT THE RIGHT END OF THIS ROW.
       「フォロワーとかの横の一番右に...で」OWNER 2026-09-02.

       The two things it holds -- block and report -- are about a PERSON
       rather than about one line they wrote, and this row is the row of
       facts about that person. They were on a post's ... and nowhere else,
       so blocking somebody meant finding something of theirs to block them
       from. 「ブロックも通報はその人の画面でもよろしい」

       The same menu as a post's, in the same shape and closed the same way --
       WMENU beside PMENU, because a page holds one person and a timeline
       holds many posts, and one of them needs an id. `.pfstats` carries the
       `position:relative` the box hangs off now; it was `.metop`. */
    '<div class="pfstats">'+
      '<button class="pfst"' + DO('go', ["follows", 'ing:'+String(h)]) + '>'+
        meCount(p.fo)+' '+esc(t('me.following'))+'</button>'+
      '<button class="pfst"' + DO('go', ["follows", 'ers:'+String(h)]) + '>'+
        meCount(p.fr)+' '+esc(t('me.followers'))+'</button>'+
      '<button class="pmore"' + DO('whoMore', [String(h)]) + ' aria-label="'+
        esc(t('post.more'))+'">'+ICON_DOTS+'</button>'+
      (WMENU
        ? '<span class="pmenu" data-pm="1">'+
          '<button class="pmi"' + DO('meBlock', [String(h)]) + '>'+ICON_BLOCK+
            '<span>'+esc(t(meBlocks(h)? 'post.unblock' : 'post.block'))+'</span></button>'+
          '<button class="pmi bad"' + DO('openReport', ["", String(h)]) + '>'+ICON_FLAG+
            '<span>'+esc(t('post.report'))+'</span></button>'+
          '</span>'
        : '')+
    '</div>'+
    '</div>';
}
/* Who you are on the timeline: the name, the handle, the face, the line about
   yourself. All four are what OTHER PEOPLE see -- netAvSync() sends the face
   and the profile row carries the rest -- so this is one of the things that
   needs a name on the account, and it was the one that was not asked.

   obNeed() guarded the six: a post, a like, a boost, a follow, a block, a
   report. This is the seventh and was missed. Signed out, the sheet opened,
   the fields took what was typed and saveMe() wrote it to the phone -- so
   somebody who had signed out could still set the name and the face that
   the timeline shows for them. 「ログアウトしてんのにプロフィール設定とか
   できるのどこがログアウトなんだよ」

   The SCREEN stays open, which is deliberate and is the rest of the same
   sentence: every screen can be looked at, and it is DOING something that
   asks who you are. 「全部の画面一通り見れるけど制作しようとするとログイン
   求められる」

   Nothing of ME is deleted by signing out. What somebody wrote about
   themselves is theirs, and a sign-out that erased it would be the app
   throwing away something a person made to prove a point about sessions. */
function openMe(){
  if(!obNeed()) return;
  /* **打った内容はここに憶える。**書くのは右上の保存だけ ── www/shell.js
     § KEEP、OWNER DECISION 2026-09-03。この画面に着くたびに通るので、
     打ちかけを持ったまま出て戻ってきたら、その打ちかけが基準ごと残る
     （keepOn は既に在る buffer に触らない）。 */
  keepOn(ME_KEY, meWas(), meKeepSave);
  /* Named after the page it is the settings for, through the one function
     that names a page. */
  /* The picture first, then the name, the handle and the bio -- OWNER
     DECISION, 2026-08-25. It is the order somebody fills a profile in: the
     face is the thing they came to change, and it used to be at the bottom
     under three text fields.

     画像を外す行はここに無い。**触ったらカメラロールが直接開く。** ──
     「写真をタップしたら変えたいのよ」 OWNER 2026-08-28。 */
  openForm('me:', pageName('profile'),
    /* The face is the label, and the input lives inside it -- so the thing
       somebody reaches for is the thing that opens the camera roll, in one
       tap. The trick came from `.picpick`, which was the separate "choose a
       picture" button: an invisible input stretched across the label, so the
       tap lands on the input. That button is gone -- it was the thing that
       made this screen look untouched -- and `.picpick`'s rule went with it
       in the same commit that took its last wearer away, along with its two
       lines in tools/box-baseline.txt. Two corners fewer.
       The style is written here rather than in a class because `.pav` is worn
       by eight other screens. */
    /* 見出しは無し ── 「アイコンって文字いらない」(OWNER, 2026-08-25)。
       それは顔の話で、下の四つの欄の話ではない。名札は欄の**左**、`.field.at`
       ── 「アイコンだけ上にして。あとはリンクと同じ並びにして欲しい。」
       OWNER 2026-08-28。リンクと場所の行が既にその形で、名前と ID をそれに
       揃える。

       **顔は単独で上に立つ。** 96px の顔が名前と ID の左に居たので、その二つ
       だけ欄が 80px しか無く、320px の端末で日本語 4字で二行になっていた
       ──「場所も名前も二行にしないで。はみ出さない、二行にしない範囲の名前
       しか設定できない。これだとなん文字？」OWNER 2026-08-28。顔を外に出すと
       四つとも同じ幅の行になる。

       欄そのものは `lnField()`（www/shell.js の一箇所）。`<input>` は
       折り返せないので、書いた字が横に消えていた。 */
    /* 触ったら写真を選ぶところが直接開く。それだけです。
       「ちがう。写真をタップしたら変えたいのよ。104の前のやつは写真を変更
         するの文字が出てきてたやんそれをやめろって言ってるのよ」
       「プロフィールの写真変更画面はタップしたら変更して、変更するとかの
         ページに飛ばないで。」 OWNER 2026-08-28。

       画像が在るときだけ「変える／外す を選ぶ画面」へ行く形でした。文字の
       行も、その画面も、無くなります ── 在るときと無いときで触った先が
       違うこと自体が、この画面が説明を挟んでいたということなので、分岐ごと
       落としました。

       **外す道はこれで一つも無くなります。**外す行は #104 の前に顔の下に
       在ってオーナーに断られ（「なんでアイコンの下に画像消すみたいな垢文字
       でんの？」）、選ぶ画面のほうも今日断られた。二つとも断られたので、
       どこに置くかは決めごと ── 私は決めません。報告に書いてあります。

       **顔が在るか無いかで触った先が変わりません。**変わっていた形が
       「後プロフィールファイルから選択なくして欲しい」「画像ね」
       OWNER 2026-09-03 の原因です ── 顔がまだ無い人は `<label>` の下の
       file input を直に踏んでいて、それは iOS 自身の「写真を選ぶ／撮る／
       ファイル」を出します。**写真だけを出す道は `mePicAsk()` の一本**
       （PHPicker）なので、両方ともそこを通します。

       下の file input は二本目の道ではありません。`mePicAsk()` の註が
       元からそう書いています ── **ネイティブが無い端末（検査のブラウザ）
       のための、同じ一本道の入口**で、`mePicFile()` だけが開けます。
       だから踏めない場所に置くだけで、消しません。 */
    '<div class="picrow">'+
      '<button class="pav pavb" style="width:96px;height:96px;margin:0"' +
        DO('mePicAsk') + '>'+
        postFace({who:meName(), lname:langName, av:postAvatar()})+'</button>'+
      /* The way in with no native side under the page. No size and no place
         in the row -- mePicFile() is the only thing that opens it. */
      '<input type="file" id="me-pic" accept="image/*" '+
        'style="display:none"' + CH('meSetPic') + '>'+
    '</div>'+
    '<div class="field at" style="gap:14px;margin-bottom:20px">'+
      '<span style="flex:0 0 auto;white-space:nowrap;min-width:4.5em">'+esc(t('me.name'))+'</span>'+
      lnField('me-nm', langName||'',
        ' maxlength="'+ME_MAX.name+'"' + IN('meSetName'), meTyped('name'))+'</div>'+
    '<div class="field at" style="gap:14px;margin-bottom:20px">'+
      '<span style="flex:0 0 auto;white-space:nowrap;min-width:4.5em">'+esc(t('me.handle'))+'</span>'+
      lnField('me-hd', meHandle(),
        ' maxlength="'+ME_MAX.handle+'" autocapitalize="none"' + IN('meSetHandle'),
        meTyped('handle'))+'</div>'+
    '<div class="sec">'+esc(t('me.bio'))+'</div>'+
    '<div class="field"><textarea id="me-bio" maxlength="'+ME_MAX.bio+'" '+
      'placeholder="'+esc(t('me.bio.ph'))+'"' +
      IN('meSetBio') + '>'+esc(meTyped('bio'))+'</textarea></div>'+
    /* リンクと場所。**両方とも自由入力**で、書式を決めない ──
       「自由入力です。」「だって自分の国入れたい人だっているやん」
       OWNER DECISION 2026-08-25。端末の位置ではなく、国コードでもなく、
       候補の一覧も出さない。人が打った文字がそのまま入る。**2026-08-28 に
       リンクの形を検査する話が出たが、この決定のままにしてある** ── 書式を
       決めないのが決定で、検査を足すのはそれに反する。

       この枝が書けたのは欄と関数までで、`meSetLink`/`meSetLoc` の登録
       （www/act-map.js）と `me.link` `me.loc` の鍵（www/i18n）は他の
       セッションの持ち物だった。取り込みと同じコミットで揃えた ──
       act-map は名前ではなく関数そのものを登録するので、関数より先に行を
       書くとアプリが読み込みで止まる。**分けられない。** */
    '<div class="field at" style="gap:14px;margin-bottom:20px">'+
      '<span style="flex:0 0 auto;white-space:nowrap;min-width:4.5em">'+esc(t('me.link'))+'</span>'+
      lnField('me-lk', t('me.link.ph')||'',
        ' maxlength="'+ME_MAX.link+'" autocapitalize="none"' + IN('meSetLink'),
        meTyped('link'))+'</div>'+
    '<div class="field at" style="gap:14px;margin-bottom:20px">'+
      '<span style="flex:0 0 auto;white-space:nowrap;min-width:4.5em">'+esc(t('me.loc'))+'</span>'+
      lnField('me-lc', t('me.loc.ph')||'',
        ' maxlength="'+ME_MAX.loc+'"' + IN('meSetLoc'), meTyped('loc'))+'</div>');
}
FORM_OPEN.me=function(){ openMe(); };
/* The two lists behind the two numbers. One screen, and which one it is is the
   route's argument -- they differ in the list and in what to say when it is
   empty, and in nothing else.

   IT WAS A HANDLE AND A DEAD END. Every row drew `@name` with no face and no
   name on it, and the only thing pressing one did was `go('find')` -- the
   search screen, empty, about nobody. 「フォロー中からユーザー飛びたいのに
   飛べないけど？」 OWNER. The row is snsWhoRow() now, which has opened a
   person's page since the day it was written. */
/* ---- somebody else's two lists ------------------------------------------
   Your own are ME.fo and ME.fr -- on this phone, written by meFollowPull()
   and meFollowerPull(), and shown the moment the screen opens because the
   copy is already here. Nobody else's is, so theirs is asked for and kept
   the way WHO_HAVE keeps a person: once per handle, per direction, for as
   long as the app is open.

   Not merged into ME.fo/ME.fr and not written to storage. Those two are the
   ACCOUNT's, ME is what saveMe() sends to the server as who you are, and a
   list of whoever you happened to look at would be this app telling the
   server you follow them.

   `netFollowing()` and `netFollowers()` take the handle as an optional last
   argument, and `follow_read` in supabase/schema.sql is `using (true)` --
   who follows whom is public the way it is in every timeline -- so this
   needs no account. */
var FOL_HAVE={}, FOL_ASKED={};
function folKey(ers, h){ return (ers? 'ers:' : 'ing:') + String(h||''); }
function folPull(ers, h){
  var k=folKey(ers, h);
  h=String(h||'');
  if(!h || FOL_ASKED[k]) return;
  FOL_ASKED[k]=1;
  (ers? netFollowers : netFollowing)(function(hs){
    /* Nobody by that name. It stays asked -- there is nothing to ask again,
       which is whoPull()'s rule and the same reason. */
    if(!hs) return;
    FOL_HAVE[k]=hs;
    render();
  }, function(){ FOL_ASKED[k]=0; }, h);
}
function folGot(ers, h){ return !!FOL_HAVE[folKey(ers, h)]; }
function folOf(ers, h){ return FOL_HAVE[folKey(ers, h)] || []; }
/* WHOSE LIST THIS SCREEN IS SHOWING, AND WHICH DIRECTION -- read off the
   route's argument, in one place. 「フォロワーとかタップしても見れないし」
   OWNER 2026-09-03 put the handle on the end of it: `ing` and `ers` alone are
   yours, `ing:<handle>` and `ers:<handle>` are somebody's, split on the same
   colon `relate` and `gram` already split theirs on (www/shell.js).

   It was worked out inside vFollows() and nowhere else, which was right until
   the pull needed the same answer -- and a second reading of one argument is
   two answers waiting to disagree. */
function folWho(){
  var a=String(here().a||''), c=a.indexOf(':');
  return (c<0)? '' : a.slice(c+1);
}
function folErs(){
  var a=String(here().a||''), c=a.indexOf(':');
  return a.slice(0, c<0? a.length : c)==='ers';
}
/* ASK AGAIN. Everything about a person is asked ONCE -- whoPull() keeps
   WHO_ASKED per handle so a name that has been deleted is not asked about
   for ever, and the two follow pulls keep one flag each for the whole
   session. That is right for a render, which happens constantly, and wrong
   for a PULL, which is a person saying 「もう一度聞け」.

   「他の人の画面でも更新できるようにしたい」 OWNER 2026-09-04. It is the same
   sentence as the counts one screen up: somebody who followed you while the
   app was open was in neither the number nor the list until it was killed and
   opened again 「なんか3フォロワーなのに2人しかいない」.

   THE FLAG IS CLEARED AND THE PULL IS ASKED -- nothing here talks to the
   server itself, so there is still one place each request is made from. */
function meAgain(h){
  h=String(h||'');
  if(!h || h===meHandle()){
    FO_ASKED=false;
    FR_ASKED=false;
    meFollowPull();
    meFollowerPull();
    return;
  }
  WHO_ASKED[h]=0;
  whoPull(h);
}
function folAgain(ers, h){
  h=String(h||'');
  if(!h) return;
  FOL_ASKED[folKey(ers, h)]=0;
  folPull(ers, h);
}
function vFollows(){
  /* WHOSE, and it is the argument's second half. 「フォロワーとかタップしても
     見れないし」 OWNER 2026-09-03. `ing` and `ers` alone are yours; `ing:<handle>`
     and `ers:<handle>` are somebody's -- the same colon `relate` and `gram`
     already split an argument on, because a screen is a route and at most one
     argument (www/shell.js). */
  var ers=folErs();
  var who=folWho();
  var mine=(!who || who===meHandle());
  var list, got;
  if(mine){
    /* Both lists are asked for here, because this screen is the only place
       either is shown in full and the two numbers that lead to it are drawn
       on a page that may never have been opened this session. */
    meFollowPull();
    meFollowerPull();
    list=ers? meFollowers() : meFollowing();
    /* Yours is on this phone, so there is always an answer to draw. */
    got=true;
  }
  else {
    folPull(ers, who);
    list=folOf(ers, who);
    got=folGot(ers, who);
  }
  return '<div class="view">'+navTop()+'<div class="body">'+
    /* WAITING IS NOT EMPTY. 「snsで一瞬何も出ないとかあり得んやろ」 OWNER
       2026-09-02 -- and 「まだ誰もいない」 said before the server has answered
       is a statement about the server made before it spoke. One place draws
       it (www/sns.js). */
    (!got? snsWaitHTML()
      : list.length
      ? list.map(function(h){
          /* Who this handle IS. The list is handles and nothing else, so
             every row was `@name` and no face, no name and nothing to press.
             whoPull() asks the server once per handle and renders again when
             it answers; whoOf() hands back the copy in the meantime. */
          var p;
          h=String(h);
          whoPull(h);
          p=whoOf(h);
          /* Your own row would otherwise offer to follow yourself, and on
             somebody else's list that is not a spare comparison: you are in
             their followers if you follow them, which is the ordinary case
             for a page you reached by following somebody. */
          p.mine=(h===meHandle());
          /* THE SAME ROW AS THE SEARCH'S, and one function draws it. The two
             lists show the same thing -- a person -- and drawing them twice
             is how they drift apart. `true` is the follows list's half: the
             label and the line about themselves. */
          return snsWhoRow(p, true);
        }).join('')
      : '<div class="note">'+esc(t(ers? 'me.followers.none' : 'me.following.none'))+'</div>')+
    '</div></div>';
}
