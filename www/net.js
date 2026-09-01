/* Lingua — the server, and the one window onto it (chapter 21)
   Loaded by www/index.html as a plain script, in the order listed there.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   Everything that leaves this phone leaves through this file. Not for tidiness
   -- because there are exactly two secrets in this app and one of them must
   never be here, and a single window is the only place that claim can be
   checked by reading.

     the publishable key      is below, in the open, and that is correct.
                              It grants nothing on its own: every table is
                              denied by default and opened one row-level
                              policy at a time in supabase/schema.sql.
     the service role key     bypasses every one of those policies. It does
                              not appear in this repository and must never
                              reach a phone.

   The password is the third thing people expect to find here and it is not
   here either. It goes from the field to Supabase over TLS and is hashed
   there; this app never holds it, never stores it and never logs it. What
   comes back is a pair of tokens, and the refresh one is what signs somebody
   in tomorrow without typing anything -- the same convenience as remembering
   a password, except that it expires, it can be revoked from the server, and
   it is worth nothing to anybody on any other site.

   Reading needs no account at all. post, profile and a published language are
   world-readable, so the timeline works with the key alone.

   There is an account anyway, and nobody typed anything to get it. The first
   launch signs in ANONYMOUSLY: a real row in auth.users, a real uid, a real
   pair of tokens, and no identity on any of it. That is what lets everything
   somebody makes belong to an account from the first minute without a door
   in front of the app. 「サインイン必須にしたいけど、オンボーディングで離脱
   されるのは防ぎたい」

   So "signed in" is two questions here and they are not the same one:

     netSignedIn()   there is a session. Anonymous counts.
     netMember()     the session has somebody's name on it.

   The second is this phone's copy of is_member() in supabase/schema.sql,
   which has refused an anonymous token since the day it was written -- so
   everything other people would see is refused by the server whether or not
   this file remembers to ask. Asking is what makes the refusal a door
   instead of a shrug.

   There is no anonymous account any more. It was one phone's refresh token
   and nothing else -- lose the phone and nobody, including us, could prove it
   was theirs -- and OWNER 2026-08-26 took it out: an account is asked for at
   the door now, before anything can be made.

   This used to end "and attaching one later keeps the same uid rather than
   starting again." That was never true here: netSignUp() below posts to
   /auth/v1/signup with no session token on it, which asks Supabase for a NEW
   user rather than for an identity on the one already signed in. Nothing was
   ever lost by it -- the app has never been released and no anonymous account
   has existed outside a test build -- and there is nothing left to fix now
   that none is made. It is written down rather than deleted because the
   sentence was a description of a mechanism nobody had built, and those are
   the ones that get built on.
   ========================================================================= */

/* =========================================================================
   21. The server
   ========================================================================= */

var SB_URL='https://iimwukyyasbybfrirhsf.supabase.co';
var SB_KEY='sb_publishable_3FTW3G5jfBVPoc8MiXgdNw_OZk2L1-6';

/* The Google client made for THIS iOS app, in the Google Cloud console. It is
   public in the same way SB_KEY is -- it names the app and proves nothing --
   so it sits here rather than in a secret, and an empty string is a real
   answer: it means nobody has made one yet, and the Google button says so
   instead of opening a sheet that cannot finish.

   Two places have to agree, and both are the owner's:
     1. this string, which is `<number>-<hash>.apps.googleusercontent.com`
     2. ios/App/App/Info.plist, whose URL scheme is that string REVERSED
   Supabase also has to be told to accept it -- supabase/setup.md.

   Apple needs nothing here. On iOS the sign-in is the system's own sheet and
   the app is named by its bundle id, which Xcode already knows. */
var GOOGLE_IOS_ID='535150348007-i8roam4vdjjlfql5ktb4mld3v9chb6gr.apps.googleusercontent.com';

/* The session belongs to this phone and to no language, so it is filed beside
   lingua.set and lingua.me rather than under langKey(). */
var LS_SESS='lingua.sess';
var SESS=null;
function netRead(){
  SESS=null;
  try{
    var s=JSON.parse(localStorage.getItem(LS_SESS)||'null');
    if(s && s.rt) SESS=s;
  }catch(e){}
}
netRead();
function netSave(){
  try{
    if(SESS) localStorage.setItem(LS_SESS, JSON.stringify(SESS));
    else localStorage.removeItem(LS_SESS);
  }catch(e){}
}
function netSignedIn(){ return !!(SESS && SESS.rt); }
/* Whether the token in hand is an anonymous one, read off the TOKEN rather
   than off the answer that carried it. `is_anonymous` in the JWT is the exact
   claim is_member() reads in supabase/schema.sql, so the phone and the server
   settle this out of the same sentence rather than out of two that could
   drift. An unreadable token is not anonymous: the server is what decides,
   and a phone guessing "anonymous" would close doors on somebody who has an
   account. */
function netClaims(at){
  var p=String(at||'').split('.')[1], c;
  if(!p) return null;
  p=p.replace(/-/g, '+').replace(/_/g, '/');
  while(p.length % 4) p+='=';
  try{ c=JSON.parse(atob(p)); }catch(e){ return null; }
  return (c && typeof c==='object')? c : null;
}
function netAnonTok(at){
  var c=netClaims(at);
  return !!(c && c.is_anonymous);
}
/* A session with somebody's name on it. Everything other people would see
   asks this and not netSignedIn(): a post, a like, a boost, a follow, a
   block, a report. */
function netMember(){ return !!(SESS && SESS.rt && !SESS.anon); }
/* Which of the three doors somebody came in by, and the address they came in
   with. Both are on the token, which is the only place they are: nothing in
   `profile` holds an address, on purpose -- profile is what other people see
   and an address is not.

     netHow()   'apple' | 'google' | 'email' | ''
     netMail()  the address, or '' -- which is what an Apple account that
                chose to hide it still has, because Apple gives a relay
                address rather than nothing

   `app_metadata.provider` is the door that was used. Somebody who has signed
   in with two of them has `providers` as well; the one asked for here is the
   one this session came through, which is what a screen saying "you are
   signed in with" means. */
function netHow(){
  var c=SESS && netClaims(SESS.at);
  return (c && c.app_metadata && String(c.app_metadata.provider||'')) || '';
}
function netMail(){
  var c=SESS && netClaims(SESS.at);
  return (c && String(c.email||'')) || '';
}

/* ---- the wire ----------------------------------------------------------
   XHR rather than fetch: this has to run on a WKWebView old enough that the
   rest of the file is ES5, and a Promise is banned three lines up. Both
   callbacks are always called, so nothing is left waiting on a spinner. */
function netSend(method, path, body, tok, ok, bad){
  var x=new XMLHttpRequest();
  x.open(method, SB_URL+path, true);
  x.setRequestHeader('apikey', SB_KEY);
  if(body) x.setRequestHeader('Content-Type', 'application/json');
  /* Signed in, this is the person; signed out, it is the key again, which is
     what PostgREST expects and how the anon role is reached. */
  x.setRequestHeader('Authorization', 'Bearer '+(tok || SB_KEY));
  /* PostgREST answers an insert with 201 and an empty body unless it is asked
     not to. Asked here, once, for every write to a table -- rather than at the
     one call site that needs the new row's id today and forgotten at the
     second one tomorrow. The auth endpoints are not PostgREST and ignore it. */
  /* PATCH as well as POST, and for a second reason on top of the first: an
     update that matched NO ROW answers 204 and looks exactly like one that
     matched. netDraftUp() below is built on being able to tell -- that is how
     a draft the server has never seen turns into an insert -- and a write
     that changed nothing must never read as a write that worked. */
  if((method==='POST' || method==='PATCH') && path.indexOf('/rest/v1/')===0)
    x.setRequestHeader('Prefer', 'return=representation');
  x.onreadystatechange=function(){
    if(x.readyState!==4) return;
    var d=null;
    try{ d=JSON.parse(x.responseText||'null'); }catch(e){}
    if(x.status>=200 && x.status<300) ok(d);
    else bad(d, x.status, netTag(path)+' '+x.status);
  };
  x.onerror=function(){ bad(null, 0, netTag(path)+' 0'); };
  x.send(body? JSON.stringify(body) : null);
}
function netPost(path, body, tok, ok, bad){
  netSend('POST', path, body||{}, tok, ok, bad);
}
/* Reading is signed where there is a session and open where there is not:
   profile_read in schema.sql is `using (true)`, because a handle has to be
   checkable by somebody who does not have an account yet. */
function netGet(path, ok, bad){
  netSend('GET', path, null, (SESS && SESS.at) || '', ok, bad);
}

/* What Supabase says when it refuses, in the person's language where we have
   one and in its own words where we do not. A message invented here would be
   a second copy of a rule the server owns -- how long a password has to be,
   what an address may look like -- and it would go out of date silently. */
/* ---- which zero this is -------------------------------------------------
   `status` 0 meant three different things and said one sentence for all
   three, which is what the owner's photograph on 2026-08-27 was:
   「接続できません」 in red, on a screen where nothing could be done about it.

     the request went and nothing came back   netSend()'s x.onerror
     the request was never made at all        netMyProfile / netMakeProfile /
                                              netSetPass / netLangRow /
                                              netResume, each refusing locally
                                              when it sees no session
     the answer was 200 and was not a session netTook(d) false

   The first is a network. The second never touched one. The third means the
   server answered and the app could not use what it said. Three causes and
   three exits, and a phone has no console to tell them apart with.

   So a failure carries a mark, and `bad` takes it as a third argument. Every
   caller that does not want it goes on passing two and gets exactly what it
   got before -- www/sns.js and www/settings.js are untouched by this.

   The mark is a STATE and not a sentence: `CLAUDE.md` -- 「An empty state, a
   count, a state, an error — none of those is an explanation.」 It is not
   translated for the same reason a status code is not. `−` is "never sent",
   `≠` is "not a session", and a bare word plus the real HTTP number is the
   ordinary road. www/backup.js's BK.how and www/share.js's SHARE.how are the
   same instrument, put in for the same reason and on the same day's evidence:
   一枚のスクリーンショットで原因が落ちてくる。 */
function netTag(path){
  var p=String(path||'').split('?')[0].split('/');
  return p[p.length-1] || 'server';
}
function netWhy(d, status, mark){
  if(!status) return t('net.offline') + (mark? ' ('+mark+')' : '');
  var m=(d && (d.msg || d.message || d.error_description || d.error)) || '';
  if(status===400 && /invalid login/i.test(m)) return t('net.badlogin');
  if(status===400 && /already registered/i.test(m)) return t('net.taken');
  if(status===403 || status===401) return t('net.badlogin');
  if(status===422 && /password/i.test(m)) return t('net.weak');
  if(status===429) return t('net.toomany');
  /* profile.handle is unique in the schema, so this is the server settling a
     race the check a moment ago could not see. */
  if(status===409) return t('net.handle.taken');
  return m || t('net.failed');
}

/* ---- coming and going --------------------------------------------------- */
/* A session, put away. Everything that signs somebody in ends here, so there
   is one place that knows what a session is made of. */
function netTook(d){
  if(!d || !d.access_token) return false;
  SESS={ at:d.access_token, rt:d.refresh_token||'',
         uid:(d.user && d.user.id) || (SESS && SESS.uid) || '',
         /* Whether this one has a name on it, decided here because this is
            the one place that knows what a session is made of. A session
            already stored when this key arrived has no `anon` on it at all,
            which reads as false -- correct, because every account that
            existed before anonymous sign-in did was a real one. */
         anon:netAnonTok(d.access_token) };
  netSave();
  /* And who the phone belongs to now. lingua.me is a separate key from
     lingua.sess and used to survive this entirely, so the account that
     arrived here inherited the last one's name, handle, face, line about
     itself and follow list. meFor() parks the old copy and fetches this
     account's own; it deletes nothing. www/me.js has the whole of why.

     Here rather than at the five call sites because this is the one place
     that knows what a session is made of -- the same reason `anon` is
     decided here. */
  meFor(SESS.uid);
  /* AND THE LANGUAGES THIS ACCOUNT MADE, onto a phone that may never have
     seen them. Here rather than at the five call sites for the same reason
     `anon` and meFor() are here: this is the one place that knows a session
     arrived. It fills in what is missing and stops, so a phone that already
     has everything does one request and writes nothing.
     Guarded to once per account per launch inside netLangBack(), because a
     token refresh comes through here too. */
  if(typeof netLangBack==='function') netLangBack();
  return true;
}
/* There used to be netAnon() here, and boot.js called it before the first
   frame: Supabase's anonymous sign-in, which is the signup endpoint with no
   address and no password on it. Everything somebody made belonged to an
   account from the first minute without anybody being asked anything.
   「オンボーディングで離脱されるのは防ぎたい」

   OWNER DECISION 2026-08-26 took it out: 「言語はアカウントないと作れないです」
   「ログインした人しか書けないけど」「二種類になる意味も分からないけど」.
   supabase/schema.sql says the same thing on the other side -- the policies
   that used to ask has_account() ask is_member() now, so a session with no
   name on it is refused by the server whatever this file does.

   netAnonTok() below and SESS.anon stay, and netSignedIn() and netMember()
   stay two functions. Not for anybody's sake -- there is nobody: the app has
   never been released, so there is no phone anywhere holding an anonymous
   session. 「リリースしてないんだからアカウンとないでしょ」 -- OWNER 2026-08-26.

   They stay because collapsing them is a rename, and it is a rename across
   sns.js, post.js, settings.js and me.js, which this session does not own. A
   rename does not ride along with a feature (CLAUDE.md); it is its own task,
   and it is in the report as one. The claim itself is still real on the
   server -- is_member() in schema.sql reads is_anonymous off the token -- so
   what is here is a true question with nothing left to answer it yes. */
function netOut(){
  SESS=null; netSave();
  /* Signed out is nobody's phone, so the name comes off the screen the same
     moment the session does. Parked, not erased -- signing back in brings it
     back, and wipeAll() has already blanked ME by the time it reaches here,
     so nothing is written back out over a deleted account. */
  meFor('');
}
/* The token in hand lasts an hour. This is what makes the next launch silent:
   nothing is typed, nothing is remembered by the person, and the thing on the
   phone that does it can be taken away from the server's side. */
function netResume(ok, bad){
  if(!netSignedIn()){ bad(null, 0, 'resume −'); return; }
  netPost('/auth/v1/token?grant_type=refresh_token',
          {refresh_token:SESS.rt}, null,
          function(d){ if(netTook(d)) ok(d); else bad(d, 0, 'token ≠'); },
          function(d, s){
            /* A refresh token that is no longer accepted is not an error to
               show anybody: it means the session ended, which is a state, not
               a failure. */
            if(s===400 || s===401) netOut();
            bad(d, s);
          });
}
function netSignUp(email, pass, ok, bad){
  netPost('/auth/v1/signup', {email:email, password:pass}, null, ok, bad);
}
function netSignIn(email, pass, ok, bad){
  netPost('/auth/v1/token?grant_type=password',
          {email:email, password:pass}, null,
          function(d){ if(netTook(d)) ok(d); else bad(d, 0, 'token ≠'); }, bad);
}
/* The six digits out of the mail. A link would have to land somewhere, and
   there is nowhere for it to land: this is a Capacitor app with no web page
   behind it, so the default confirmation URL opens nothing on the tester's
   phone. A code goes back to the screen that asked for it. */
function netVerify(email, code, ok, bad){
  netPost('/auth/v1/verify', {type:'signup', email:email, token:code}, null,
          function(d){ if(netTook(d)) ok(d); else bad(d, 0, 'token ≠'); }, bad);
}
function netRecover(email, ok, bad){
  netPost('/auth/v1/recover', {email:email}, null, ok, bad);
}
/* The six digits out of the reset mail, and then the new password.
   Two calls and not one, because Supabase has no "here is a code and a new
   password" endpoint: the code buys a SESSION, and a signed-in person is
   allowed to change their own password. So the second call is the ordinary
   one and needs no special case anywhere.

   Same shape as the signup code and for the same reason: the default mail
   carries a link, and there is nowhere for a link to land -- this is a
   Capacitor app with no web page behind it, so tapping it opens nothing.
   The Reset Password template says {{ .Token }} for that reason. */
function netRecoverCode(email, code, ok, bad){
  netPost('/auth/v1/verify', {type:'recovery', email:email, token:code}, null,
          function(d){ if(netTook(d)) ok(d); else bad(d, 0, 'token ≠'); }, bad);
}
/* Changing the password of whoever is signed in. It is only ever reached
   holding a session the code above bought a moment ago, so nothing here
   knows or asks what the OLD password was -- which is the whole point: the
   person forgot it. */
function netSetPass(pass, ok, bad){
  if(!netSignedIn()){ bad(null, 0, 'setpass −'); return; }
  netSend('PUT', '/auth/v1/user', {password:pass}, SESS.at, ok, bad);
}
/* A native sign-in hands back an identity token and Supabase gives a session
   for it. Apple and Google are the same call with a different word, and
   neither opens a browser: the app is never left.

   Nothing calls this until the Capacitor plugins are installed and the
   capability is set in Xcode, which is a Mac's work. The door's two buttons
   reach it through obSignInApple and obSignInGoogle. */
/* ---- who the account belongs to ----------------------------------------
   Signing in makes a row in auth.users, which is Supabase's and which
   nothing outside net.js reads. A person exists to the rest of the app when
   there is a row in profile, and that row cannot be written without a
   handle: it is `unique not null` in the schema, so the name after the @ is
   settled before anybody has one, not left to be invented later out of
   whatever they called their language.

   Asked before the person is: somebody signing in on a second phone already
   has a profile and must not be asked to choose a handle they picked a year
   ago. */
function netMyProfile(ok, bad){
  if(!netSignedIn()){ bad(null, 0, 'profile −'); return; }
  netGet('/rest/v1/profile?select=handle,display&limit=1&id=eq.'+
         encodeURIComponent(SESS.uid),
         function(d){ ok(d && d.length? d[0] : null); }, bad);
}
/* The polite half of unique. It answers a moment before the insert does and
   can be wrong by that much; the constraint is what actually decides, and
   netWhy turns its 409 into the same sentence. */
function netHandleFree(h, ok, bad){
  netGet('/rest/v1/profile?select=handle&limit=1&handle=eq.'+encodeURIComponent(h),
         function(d){ ok(!(d && d.length)); }, bad);
}
/* And the face, which is what a notice draws when there is no post to take
   one off -- a follow has none at all. It is the same shape a post carries,
   cut loose from the language so somebody who does not have that language can
   still see it.

   Written here and not kept in step afterwards: drawing a new letter does not
   yet update it. That is docs/BACKLOG.md's, not a silent gap -- a notice with
   no face draws no face and nothing throws. */
function netMakeProfile(h, name, ok, bad){
  if(!netMember()){ bad(null, 0, 'mkprofile −'); return; }
  var av=postAvatar();
  netPost('/rest/v1/profile',
          {id:SESS.uid, handle:h, display:name, av:av},
          SESS.at,
          /* what was sent, so netAvSync() does not send it again on the
             next launch for a face that has not moved */
          function(d){ ME.avSent=JSON.stringify(av||null); saveMe(); ok(d); },
          bad);
}
/* The face on the profile row, kept level with the face on the phone.
   ------------------------------------------------------------------
   netMakeProfile() wrote `av` once, the day the account was made, and nothing
   ever wrote it again -- so drawing a new letter or setting a photograph
   changed what postAvatar() answers everywhere in the app EXCEPT the little
   face beside "somebody liked this". A notice could draw a face somebody had
   not worn for a month.

   Nothing about the timeline was wrong: a post freezes its own face when it
   is written (rule 8), so what a reader sees on a post is right. The notice
   is the one place that reads the profile row.

   Why this is cheap, which was the reason it sat in the backlog: postAvatar()
   answers the photograph if there is one and otherwise the FIRST letter that
   has been drawn. It does not change when a letter is drawn -- it changes
   when the first one is redrawn, or a photograph is set. Twice in a language's
   life, not once per stroke. So "send it when it differs" costs one request
   on the launches where it actually moved and none on the others.

   ME.avSent is the copy that was sent, so the comparison is local. A launch
   where nothing moved asks the server nothing at all.

   Fired and not waited for, like everything else in bootSession(): the little
   face being a launch behind is not worth making the app open slower, and
   there is nothing on screen that depends on the answer. */
function netAvSync(){
  if(!netMember() || !SESS || !SESS.uid) return;
  var av=postAvatar(), now=JSON.stringify(av||null);
  if(now===ME.avSent) return;
  netSend('PATCH', '/rest/v1/profile?id=eq.'+encodeURIComponent(SESS.uid),
          {av:av}, SESS.at,
          function(){ ME.avSent=now; saveMe(); },
          function(){});
}
/* ---- which side of the nonce ------------------------------------------
   Supabase refuses this call when the id_token carries a nonce claim and the
   request does not, or the other way round. Its own words, from the OIDC
   entrance (internal/api/token_oidc.go): 「Passed nonce and nonce in id_token
   should either both exist or not.」 -- and that sentence names neither side,
   so from a phone there is no way to see WHICH of the two is true. It is the
   one thing somebody looking at the screen needs and the only thing the
   sentence leaves out.

   So the two sides go on the end of what the server said. It is a STATE and
   not a sentence and it is not translated, for the same reason netWhy()'s
   mark is not: a status code is not translated either. `y` is "has one", `n`
   is "has none", `?` is a token that could not be read.

   **The nonce itself is never shown.** It is half of a credential, and what
   is being asked here is whether one is THERE, not what it is.

   Only when the server's own words are about the nonce. Every other failure
   of every other call reads exactly as it did before -- this is a state put
   on one sentence, not a mark added to all of them.

   Nothing is invented: the server's words are kept whole and this goes after
   them. netClaims() is the one place a JWT is read and this is not a second. */
function netIdWhy(d, token, nonce){
  var said, c;
  if(!d) return d;
  said=(d.msg || d.message || d.error_description || d.error) || '';
  if(!/nonce/i.test(said)) return d;
  c=netClaims(token);
  d.msg=said+' (nonce id_token:'+(c? (c.nonce? 'y' : 'n') : '?')+
        ' sent:'+(nonce? 'y' : 'n')+')';
  return d;
}
function netIdToken(provider, token, nonce, ok, bad){
  var b={ provider:provider, id_token:token };
  if(nonce) b.nonce=nonce;
  netPost('/auth/v1/token?grant_type=id_token', b, null,
          function(d){ if(netTook(d)) ok(d); else bad(d, 0, 'token ≠'); },
          function(d, s, m){ bad(netIdWhy(d, token, nonce), s, m); });
}

/* ---- a language, which belongs to the account --------------------------
   Everything somebody makes belongs to the account and the server is where
   it is kept -- 「全部アカウントごとでしょ」「クラウドは全員で」. The phone
   goes on being the place it is MADE: nothing here waits for a network, and
   the whole making side works with no signal, because a language is edited
   on a phone that may be in a tunnel.

   Two rows and eleven. `language` is the language -- its name, its licence,
   whether it is published -- and `slice` is what it is made of, one row per
   slice of SLICES, holding exactly the string localStorage holds.

   Per slice and not per language, because of what happens with two phones: a
   word added on one and a letter drawn on the other are two different rows
   and do not touch. Inside one row they are put together by sync.js, which
   adds both rather than choosing. Nothing here decides a winner; the only
   thing this file does is carry the strings.

   `LANGS[id].sid` is the server's name for the language, the same way a post
   carries `sid`. A language with none has never been up. */
function netLangRow(id, ok, bad){
  /* WHICH language, and it used to be whichever was open. That was the whole
     of why a second language never reached the server: everything above this
     asked about `langId`, so a person's other languages had no row and no
     `sid` and were never sent. The name comes off the index for a language
     that is not open -- `langName` is the open one's. */
  var L=LANGS[String(id||'')], nm;
  if(!netSignedIn() || !L || L.mine===false){ bad(null, 0, 'langrow −'); return; }
  if(L.sid){ ok(L.sid); return; }
  nm=(id===langId)? (langName||'') : (L.name||'');
  netPost('/rest/v1/language', {owner:SESS.uid, name:nm}, SESS.at,
    function(d){
      var sid=(d && d.length)? d[0].id : '';
      if(!sid){ bad(d, 0); return; }
      L.sid=sid; langStore();
      ok(sid);
    }, bad);
}
/* WHETHER THIS LANGUAGE'S PAGE MAY BE READ BY ANYBODY ELSE.
   -------------------------------------------------------------------------
   「この言語については公開したら公開、非公開にしたら非公開だけどそれ以外に
     あんのか？」 OWNER 2026-08-28.

   `language.published_at` is what `slice_read` in supabase/schema.sql opens
   the article on, and until now **nothing in www/ ever wrote it** -- the
   column was read by one policy, indexed, and set by nobody, so no language
   had ever been published and the switch on the About page was a fact this
   phone kept to itself.

   The switch is the one the owner already operates -- setWldHide() in
   www/home.js, the 「一番上のトグル」 on the article's writing face. There is
   one question and so there is one flag; this is that flag reaching the
   server.

   A time and not a boolean, because that is the column: it is `published_at`,
   and when it was published is worth more than that it was. Turning the
   switch back writes null and the door shuts -- nothing is destroyed, and the
   page comes back exactly as it was left.

   Fired and not waited on, like netFollow(): the switch has already moved on
   the screen. netLangSync() sends it again on the next launch, which is what
   makes a request that never arrived correct itself. */
function netLangPublic(on){
  if(!netSignedIn()) return;
  /* The switch is on the OPEN language's page, so that is the one it is about. */
  netLangRow(langId, function(sid){
    netSend('PATCH', '/rest/v1/language?id=eq.'+encodeURIComponent(sid),
            {published_at: on? new Date().toISOString() : null},
            SESS.at, function(){}, function(){});
  }, function(){});
}
/* EVERY LANGUAGE THIS PERSON MADE, BACK ONTO A PHONE THAT HAS NONE.
   -------------------------------------------------------------------------
   `netOut()` drops the session and nothing else, so on the SAME phone signing
   back in finds every slice still in localStorage and the app looks whole.
   On a NEW phone it was not: nothing in `www/` had ever read a `language` row
   back, `LANGS` came up empty, and `netLangRow()` therefore made a SECOND row
   on the server for a language that already had one. The first stayed there
   with nothing pointing at it.
   「基本は全部サーバー管理」「アカウント消したら残るわけがない」 OWNER 2026-08-26.

   `language_read` in supabase/schema.sql is `published_at is not null or
   owner = auth.uid()`, so a person can ask for their own by owner and nothing
   on the server had to change.

   IT FILLS IN WHAT IS MISSING AND STOPS. That is `docs/DATA_SAFETY.md`'s rule
   for a restore and it is the whole shape of this: a language already in the
   index is left exactly as it is -- name, `sid`, slices, every byte -- and a
   slice already in storage is not written over. **The way a backup destroys
   somebody's work is by winning.** What comes down is what this phone does
   not have.

   A SERVER THAT DOES NOT ANSWER CHANGES NOTHING. 「it did not answer」 and
   「there is nothing there」 are different states and never share a branch: a
   refusal ends this function and leaves the phone as it was.

   Fired and never waited for, the way netLangSync() is. Nothing on screen
   depends on it -- a phone with no languages is on the onboarding, and one
   with languages is already drawing them. */
var NET_BACK='';
function netLangBack(then){
  var done=then || function(){};
  if(!netSignedIn() || !SESS.uid){ done(false); return; }
  /* Once per account per launch. netTook() runs on every token refresh as
     well as on a sign-in, and this is a whole account's languages. */
  if(NET_BACK===SESS.uid){ done(false); return; }
  NET_BACK=SESS.uid;
  netGet('/rest/v1/language?select=id,name,published_at&order=created_at.asc'+
         '&owner=eq.'+encodeURIComponent(SESS.uid),
    function(d){
      /* AN ANSWER THAT IS NOT A LIST IS NOT A LIST OF NO LANGUAGES. PostgREST
         answers a select with an array; anything else -- an error object, a
         session, a body this code has never seen -- is a request that did not
         mean what this one asked, and walking it as rows reads `undefined` as
         a length and never stops. Same sentence as everywhere else in this
         file: 「it did not answer」 and 「there is nothing there」 are two
         states and must not share a branch. */
      var rows=(d && typeof d.length==='number')? d : [], at=0, got=false;
      /* Which of them this phone has never heard of. A language is known by
         its `sid` -- the server's name for it -- and NOT by its local id: the
         same language has a different local id on a phone it was made on and
         on one it came back to, and matching on the local id would make a
         second copy of every language on the second phone. */
      function knows(sid){
        var id;
        for(id in LANGS){
          if(!Object.prototype.hasOwnProperty.call(LANGS, id)) continue;
          if(LANGS[id].sid===sid) return true;
        }
        return false;
      }
      function next(){
        if(at>=rows.length){ done(got); return; }
        var r=rows[at]||{}; at++;
        var sid=String(r.id||'');
        if(!sid || knows(sid)){ next(); return; }
        netLangBack1(sid, String(r.name||''), function(m){ if(m) got=true; next(); });
      }
      next();
    },
    /* No answer is not an empty account. */
    function(){ NET_BACK=''; done(false); });
}
/* One language, down. The index row is written FIRST and the slices under it,
   so a language can never have keys in storage that the index does not know
   about -- that is a set of keys nothing can find, which is the leftovers bug
   langKeyOf() exists to prevent.

   The local id IS the server's, the same as a language that is only read:
   this phone has never named this language, and the server already has. It
   also makes `knows()` above exact rather than a guess. */
function netLangBack1(sid, name, done){
  netSlices(sid, function(there){
    var i, kind, o, wrote=false;
    if(!LANGS[sid]){ LANGS[sid]={ name:name, mine:true, sid:sid }; wrote=true; }
    for(i=0;i<SLICES.length;i++){
      kind=SLICES[i];
      o=there[kind];
      if(!o || !o.body) continue;
      /* FILLS IN AND STOPS. A slice this phone already has is left alone --
         netLangSync() is what puts the two together, and it MERGES; this one
         only ever adds what is not here. */
      try{
        if(localStorage.getItem(langKeyOf(sid, kind))!==null) continue;
        localStorage.setItem(langKeyOf(sid, kind), o.body);
        wrote=true;
      }catch(e){}
    }
    if(wrote) langStore();
    done(wrote);
  }, function(){ done(false); });
}
/* SOMEBODY ELSE'S LANGUAGE, ASKED ABOUT.
   「言語の詳細は？」 OWNER 2026-09-01. `language_seen` in supabase/schema.sql
   answers with a published language or one of your own, and with nothing at
   all for anybody else's private one -- so the refusal is the view's and this
   file does not decide who may see what.

   `nwords` and `nletters` are counted ON THE SERVER and are numbers. **The
   dictionary does not move** -- `slice_read` keeps `words` shut to everybody
   exactly as before 「言語ページ公開と単語や文字のdl可能は別だし」 -- so what
   crosses here is how many, and never which.

   NO ROW IS NOT AN EMPTY LANGUAGE. It is one that is not published, or one
   that is not there; `ok(null)` says so, and the screen says nothing rather
   than drawing a language with no words in it.

   Written to `docs/scope/claude-acct2-lang.md` by claude/acct2 and put in
   here with the screen that calls it, because dead-check refuses a function
   nobody names. */
function netLangSeen(lid, ok, bad){
  var id=String(lid||'');
  if(!id){ bad(null, 0, 'lang \u2212'); return; }
  netGet('/rest/v1/language_seen?select=id,name,license,published_at,nwords,nletters'+
         '&limit=1&id=eq.'+encodeURIComponent(id),
    function(d){
      var r;
      if(!d || !d.length){ ok(null); return; }
      r=d[0]||{};
      ok({ id:String(r.id||''), name:String(r.name||''),
           license:String(r.license||''),
           pub:r.published_at? String(r.published_at) : '',
           nwords:Number(r.nwords)||0, nletters:Number(r.nletters)||0 });
    }, bad);
}
/* Every slice of one language, as {kind: {body, no}}. */
function netSlices(sid, ok, bad){
  netGet('/rest/v1/slice?select=kind,body,no&language=eq.'+encodeURIComponent(sid),
    function(d){
      var out={}, i;
      for(i=0;i<(d||[]).length;i++) out[d[i].kind]={body:String(d[i].body||''), no:d[i].no||0};
      ok(out);
    }, bad);
}
/* One slice, written. `Prefer: resolution=merge-duplicates` is what makes an
   insert into a table with a two-column primary key an upsert -- the phone
   does not have to know whether this slice has ever been up. */
function netSlicePut(sid, kind, body, no, ok, bad){
  var x=new XMLHttpRequest();
  x.open('POST', SB_URL+'/rest/v1/slice', true);
  x.setRequestHeader('apikey', SB_KEY);
  x.setRequestHeader('Content-Type', 'application/json');
  x.setRequestHeader('Authorization', 'Bearer '+SESS.at);
  x.setRequestHeader('Prefer', 'resolution=merge-duplicates');
  x.onreadystatechange=function(){
    if(x.readyState!==4) return;
    if(x.status>=200 && x.status<300) ok();
    else bad(null, x.status);
  };
  x.onerror=function(){ bad(null, 0); };
  x.send(JSON.stringify({language:sid, kind:kind, body:String(body||''),
                         no:(no||0)+1, at:(new Date()).toISOString()}));
}
/* The open language and its copy, put together. Read, merge, write back
   whatever moved -- in that order, so a phone that has been offline for a
   week arrives holding the week rather than replacing it.

   Fired and never waited for. Nothing on screen depends on it: the language
   is already on the phone and already drawn, and what this does is make the
   two copies the same. A failure is silence, because a phone with no signal
   is a phone somebody is still writing a language on. */
/* NEVER LESS THAN WHAT IS THERE.
   -------------------------------------------------------------------------
   The condition this piece of work is written under, and it is structural
   rather than careful: 「この変更で localStorage からキーを一本も消さないこと。
   同じキーを、今より少ない中身で書かない」 OWNER 2026-09-01, asked of a change
   that touches people's languages a day before a release.

   Two things may happen to a key and no third: something that is not there is
   PLACED, and something that is there is replaced by something that CONTAINS
   it. Anything else is skipped and said out loud, so the worst outcome of a
   wrong merge is a duplicate or a no-op. A duplicate can be fixed. What is
   gone cannot.

   `syMerge()` in www/sync.js already adds both sides and falls back to what is
   on the phone whenever it cannot read either half, so this should never fire.
   That is exactly why it is here: it costs one comparison, and the day it
   fires is the day something upstream changed. */
function netKeeps(mine, put){
  var a, b, k;
  if(mine===null || mine==='') return true;      /* placing, not replacing */
  if(put===mine) return true;
  try{ a=JSON.parse(mine); b=JSON.parse(put); }
  catch(e){ return String(put).length>=String(mine).length; }
  if(a instanceof Array)
    return (b instanceof Array) && b.length>=a.length;
  if(a && typeof a==='object'){
    if(!b || typeof b!=='object' || (b instanceof Array)) return false;
    for(k in a)
      if(Object.prototype.hasOwnProperty.call(a, k) &&
         !Object.prototype.hasOwnProperty.call(b, k)) return false;
    return true;
  }
  return String(put).length>=String(mine).length;
}
var NET_SHRANK=[];
var NET_SYNCING=false;
/* EVERY LANGUAGE THIS PERSON MADE, and it used to be the one that happened to
   be open. That is not a smaller version of the same thing: a second language
   had no row on the server, so it had no `sid`, so nothing of it was ever
   sent -- and on a new phone there was nothing to come back. It is the same
   root as the restore below.
   「基本は全部サーバー管理」「アカウント消したら残るわけがない」 OWNER 2026-08-26.

   THE OPEN ONE FIRST, and then the rest. Sync is fired at launch and never
   waited for, so the order decides which language is right first on a phone
   that has just been opened -- and that is the one in front of the person.
   One at a time rather than all at once: they share NET_SYNCING, the merge
   writes localStorage, and a launch that fires eleven requests at once on a
   bad connection is a launch that finishes none of them.

   A language that is only READ is not in this list at all. `syMerge` adds
   both sides, so one pass would put something into a language somebody else
   wrote -- 「トキポナに文字足したらトキポナじゃないです」 OWNER 2026-08-25 --
   and the write half would be this phone trying to edit their rows. */
function langMineIds(){
  var out=[], id;
  if(langId && langMine(langId)) out.push(langId);
  for(id in LANGS){
    if(!Object.prototype.hasOwnProperty.call(LANGS, id)) continue;
    if(id===langId || !langMine(id)) continue;
    out.push(id);
  }
  return out;
}
function netLangSync(then){
  var done=then || function(){}, ids, at=0, moved=false;
  if(NET_SYNCING || !netSignedIn()){ done(false); return; }
  ids=langMineIds();
  if(!ids.length){ done(false); return; }
  NET_SYNCING=true;
  function next(){
    if(at>=ids.length){ NET_SYNCING=false; done(moved); return; }
    var id=ids[at]; at++;
    netLangSync1(id, function(m){ if(m) moved=true; next(); });
  }
  next();
}
/* One language, both ways. Read, merge, write back whatever moved.
   `langKeyOf(id, …)` and not `langKey(…)`: this is asked about a language
   that may not be the open one, which is the whole of the change. */
function netLangSync1(id, done){
  netLangRow(id, function(sid){
    netSlices(sid, function(there){
      var i=0, moved=false;
      function step(){
        var kind, mine, got, put;
        if(i>=SLICES.length){
          if(moved && id===langId){
            /* Something came back, so what the screens are holding is older
               than what is in storage. Read it in the way langOpen() does
               rather than patching each global by hand.
               ONLY for the open one: the globals are 「the language in front
               of me」, and filling them from another language is that language
               appearing on the screen somebody is standing on. */
            langRead(); ltRead(); ntRead(); stRead(); sndRead(); kbRead(); wldRead();
            render();
          }
          /* And the one fact about this language that is a COLUMN rather than
             a slice: whether its page may be read by anybody else. Sent here,
             once a launch, after the slices have been merged -- so it is the
             switch as it stands after the sync rather than before it.

             This is what makes a failed toggle correct itself. setWldHide()
             sends it on the press and does not wait; if that request never
             arrived, the phone would say private while the server went on
             saying published, and THAT direction is a leak rather than a
             nuisance. One small write on the next launch closes it.
             Asked of the open language only, because wldHidden() reads WLD --
             the open one's -- and sending it for another language would be
             this language's switch written onto that one. */
          if(id===langId) netLangPublic(!wldHidden());
          done(moved); return;
        }
        kind=SLICES[i]; i++;
        try{ mine=localStorage.getItem(langKeyOf(id, kind)); }catch(e){ mine=null; }
        got=there[kind];
        put=syMerge(kind, mine===null? '' : mine, got? got.body : '');
        if(put!=='' && put!==mine){
          /* and only where it keeps everything that is already there */
          if(netKeeps(mine, put)){
            try{ localStorage.setItem(langKeyOf(id, kind), put); moved=true; }catch(e){}
          } else {
            /* Skipped, and remembered rather than swallowed: a merge that came
               back smaller is a thing somebody has to be told about, and the
               phone keeps what it had in the meantime. */
            NET_SHRANK.push(id+'.'+kind);
            step(); return;
          }
        }
        if(put==='' || (got && put===got.body)){ step(); return; }
        netSlicePut(sid, kind, put, got? got.no : 0,
                    function(){ step(); }, function(){ step(); });
      }
      step();
    }, function(){ done(false); });
  }, function(){ done(false); });
}

/* ---- the timeline, when there is one -----------------------------------
   Everything below this line is the SHAPE of a request and nothing else. The
   account half above is real -- it talks to Supabase today -- and this half
   is the same four functions the timeline will need, written now, in the
   place they will live, called from where they will be called from.

   They are written first on purpose. A seam cannot be retrofitted: a screen
   built around a function that RETURNS cannot later be handed one that
   answers, because every caller has to change and the ones that quietly do
   not are the bugs. So the timeline already draws what it has and takes an
   answer when one arrives, which is what a timeline does; today the answer is
   "nothing new", which is true and is not a failure.

   `supabase/schema.sql` already holds the tables -- post, follow, quote --
   with the row level security written and held by `npm run rls`. What is
   missing is these four bodies and nothing else.

   The shape, and it is the same as everything else in this file:

     netFeed(which, ok, bad)       ok(posts | null)  'rec' or 'fo'
     netPush(post, ok, bad)        ok()              this post is now public
     netMark(id, kind, on, ok, bad) ok()             liked / boosted, or not
     netDrop(post, ok, bad)        ok()              gone from the server too

   Every one of them is FIRE AND FORGET on the phone's side. A post is on this
   phone the moment it is written, a like is counted the moment it is pressed,
   and a post is deleted the moment somebody says so. The server is told
   afterwards. Nothing a person does waits for a network, because a person
   holding a phone in a tunnel is still using this app. */
/* How many come back at once. A timeline is read from the top and stops when
   somebody stops scrolling, so this is "enough to fill a screen and then
   some" rather than a number anybody has to be right about. */
var NET_PAGE=50;
/* What a row is, on the way out. `body` holds everything a reader needs and
   nothing this phone knows about itself: `mine` is a fact about the READER,
   `sid` is where the row lives, and `id` is this phone's name for it. A row
   that carried them would be answering questions on the other phone's behalf.

   The photographs and the voice are not here yet. They are bytes and they go
   to Storage, which is the next thing; until they do, a post with a
   photograph goes up as the post without it rather than as most of a megabyte
   of base64 in a jsonb column. */
function netBody(p){
  var o={}, k, skip={id:1, sid:1, mine:1, at:1, to:1, pics:1, vo:1, li:1, bo:1, re:1,
                     down:1, out:1};
  for(k in p) if(Object.prototype.hasOwnProperty.call(p, k) && !skip[k]) o[k]=p[k];
  return o;
}
/* And what a row is on the way back. The server's uuid becomes the post's id,
   because that is the name every phone knows it by; `sid` carries it too, so
   a post this phone WROTE can be recognised when it comes home and postTake()
   does not add a second copy of it.

   `at` comes off created_at, which is the server's clock. The phone's own
   clock wrote the local copy; a timeline sorted by two clocks is a timeline
   that jumps, so the row's time wins for anything that arrived. */
function netRow(r){
  var p={}, k, b=(r && r.body) || {};
  for(k in b) if(Object.prototype.hasOwnProperty.call(b, k)) p[k]=b[k];
  p.id=r.id;
  p.sid=r.id;
  p.at=Date.parse(r.created_at) || Date.now();
  if(r.reply_to) p.to=r.reply_to;
  /* Taken down. Only the author and staff are ever handed one -- post_read in
     schema.sql -- so this arrives on nobody else's phone, and the author is
     told by the post rather than by the post quietly not being anywhere. */
  if(r.hidden_at) p.down=true;
  /* And whether the account that wrote it is frozen. It comes off the ROW --
     post_seen in schema.sql -- rather than being asked about every author a
     timeline shows, and it is what takes the post off the timeline while
     leaving it on that account's own page. */
  if(r.author_out) p.out=true;
  p.mine=!!(SESS && SESS.uid && r.author===SESS.uid);
  return p;
}
function netFeed(which, ok, bad, more){
  /* `which` is 'rec' or 'fo' — everything, or the people this account
     follows. Two questions and not one list filtered twice: a phone that
     asked for everything and then hid most of it would be downloading a
     timeline in order to throw it away.
     「ツイートはフォロー中とおススメみたいに分けたいよね」

     Reading needs no account. post_read in schema.sql is `using (true)`, so
     the recommended timeline works with the publishable key alone and
     somebody who has not decided yet is not asked to decide. The FOLLOWED one
     cannot: there is nobody to have followed anybody. */
  var sel='/rest/v1/post_seen?select=id,author,created_at,reply_to,body,hidden_at,author_out'+
          '&order=created_at.desc&limit='+NET_PAGE;
  /* `more` is where to carry on from, and it is a different thing on the two
     sides because the two lists are in different orders.

     'fo' is in time order, so it is the `created_at` of the last row already
     held -- keyset and not an offset, because a timeline gains rows at the
     top while somebody is reading it and an offset would hand them the same
     post twice, or step over one.

     'rec' is in SCORE order, and "the ones after a score" is not a question
     anybody can ask: two posts on the same score have no order between them
     to continue from. So it is a count. That is honest rather than ideal, and
     it is the reason the owner's twelve-hourly turn helps -- a list that
     stands still between turns is a list a count can walk without repeating.

     Left out entirely, both sides behave exactly as they did. */
  function got(d){
    var out=[], i;
    if(!d || !d.length){ ok([]); return; }
    for(i=0;i<d.length;i++) out.push(netRow(d[i]));
    ok(out);
  }
  /* Whoever you have blocked is asked for FIRST and left out by the server. A
     timeline that downloaded their posts and then hid them would be a block
     the phone knows about and the server does not, which is not a block. */
  function pull(who){
    var q=sel+(who||'');
    if(more) q+='&created_at=lt.'+encodeURIComponent(String(more));
    netBlocked(function(bl){
      netGet(bl.length? q+'&author=not.in.('+bl.join(',')+')' : q, got, bad);
    });
  }
  /* What is going round, which is one question the server answers -- the
     weights, the window and the tie are supabase/schema.sql's feed_hot() and
     not this file's. A phone that scored posts itself would be scoring the
     fifty it had rather than the ones there are.
     「12時間ごとにバズった順」「検索の話題はTwitterと同じアルゴリズムで」 */
  if(which!=='fo'){
    netSend('POST', '/rest/v1/rpc/feed_hot',
            {lim:NET_PAGE, off:(parseInt(more, 10) || 0)},
            (SESS && SESS.at) || '',
      function(d){
        /* Blocked accounts are taken out here and not by the server, which is
           the one place this list differs from the other: feed_hot() is asked
           with the publishable key by somebody who may have no account, and
           there is no block list to ask about when there is nobody to have
           made one. */
        netBlocked(function(bl){
          var out=[], i, j, skip={};
          for(i=0;i<bl.length;i++) skip[bl[i]]=1;
          for(i=0;i<(d||[]).length;i++)
            if(!skip[d[i].author]) out.push(netRow(d[i]));
          ok(out);
        });
      }, bad);
    return;
  }
  if(!netSignedIn()){ ok(null); return; }
  /* Two requests and not a join, because there is no foreign key from a post
     to a follow and PostgREST will not invent one. The follow list is small
     -- it is people, not posts -- and it is asked for first. */
  netGet('/rest/v1/follow?select=followed&follower=eq.'+encodeURIComponent(SESS.uid),
    function(d){
      var ids=[], i;
      for(i=0;i<(d||[]).length;i++) if(d[i] && d[i].followed) ids.push(d[i].followed);
      /* Following nobody is an answer, not a failure: an empty timeline is
         what "you follow nobody" looks like, and snsNoneFo() says so. */
      if(!ids.length){ ok([]); return; }
      pull('&author=in.('+ids.join(',')+')');
    }, bad);
}
/* WHO THIS ACCOUNT FOLLOWS, as handles.
   -------------------------------------------------------------------------
   netFollow() has told the server about every press since follows existed,
   and nothing ever read the list back. So `ME.fo` in www/me.js was written
   only by a press ON THIS PHONE: the same account on a second phone followed
   the same people and knew none of it -- every Follow button said Follow, and
   the followed timeline filtered the server's own answer away to nothing.
   That last part is fixed at the sieve (www/sns.js); this is the list itself.

   BY HANDLE, because a handle is what one person knows another by and what
   ME.fo has always held. The uuid is turned back here, where the request
   already is, rather than by every screen that draws a button.

   `followed(handle)` names the COLUMN and not the table on purpose: `follow`
   has two foreign keys into `profile` -- follower and followed -- so asking
   for `profile(handle)` is ambiguous and asking for the column is not.

   Reading a follow needs no account (`follow_read` is `using (true)`): who
   follows whom is public, the way it is in every timeline. Signed out there
   is nobody to have followed anybody, and the answer is `null` -- could not
   ask -- rather than an empty list. */
function netFollowing(ok, bad){
  if(!netSignedIn()){ ok(null); return; }
  netGet('/rest/v1/follow?select=followed(handle)&follower=eq.'+
         encodeURIComponent(SESS.uid),
    function(d){
      var out=[], i, r;
      for(i=0;i<(d||[]).length;i++){
        r=(d[i] && d[i].followed) || null;
        if(r && r.handle) out.push(String(r.handle));
      }
      ok(out);
    }, bad);
}
/* AND THE OTHER DIRECTION, WHICH NOTHING HAD EVER ASKED.
   -------------------------------------------------------------------------
   「フォローされてもフォロワー1って増えないのはなぜ？」 OWNER 2026-08-28.

   Because nobody was counting. `ME.fr` in www/me.js is READ by meFollowers()
   and filled in from localStorage by meFrom(), and **no line in www/ has ever
   written it** -- so the number under a profile was the length of a list that
   started empty and stayed empty. Every `follow` request in this file asked
   `follower=eq.<me>` ("who I follow"); not one asked the reverse.

   It is the same row read the other way round, and the same policy allows it:
   `follow_read` is `using (true)`, because who follows whom is public the way
   it is in every timeline.

   `follower(handle)` names the COLUMN and not the table, for netFollowing()'s
   reason: `follow` has two foreign keys into `profile` and asking for
   `profile(handle)` is ambiguous. */
function netFollowers(ok, bad){
  if(!netSignedIn()){ ok(null); return; }
  netGet('/rest/v1/follow?select=follower(handle)&followed=eq.'+
         encodeURIComponent(SESS.uid),
    function(d){
      var out=[], i, r;
      for(i=0;i<(d||[]).length;i++){
        r=(d[i] && d[i].follower) || null;
        if(r && r.handle) out.push(String(r.handle));
      }
      ok(out);
    }, bad);
}
/* ---- keeping somebody away from you ------------------------------------
   A block one phone knows about is not a block: the other person's posts have
   to stop arriving, so it is a row on the server and the timeline asks about
   it. `block_read` in schema.sql answers with YOUR rows only -- being blocked
   is not something a person is told.

   By handle, because a handle is what one person knows another by; the uuid
   is looked up here exactly as netFollow() does. */
function netBlock(handle, on, ok, bad){
  if(!netMember() || !handle){ ok(); return; }
  netGet('/rest/v1/profile?select=id&limit=1&handle=eq.'+encodeURIComponent(handle),
    function(d){
      var who=(d && d.length)? d[0].id : '';
      if(!who){ ok(); return; }
      if(on){
        netSend('POST', '/rest/v1/block', {actor:SESS.uid, blocked:who},
                SESS.at, function(){ ok(); }, bad);
        return;
      }
      netSend('DELETE', '/rest/v1/block?actor=eq.'+encodeURIComponent(SESS.uid)+
              '&blocked=eq.'+encodeURIComponent(who), null, SESS.at,
              function(){ ok(); }, bad);
    }, bad);
}
/* The uuids you have blocked, for the one thing that needs uuids: keeping
   their posts out of a timeline. Signed out there is nobody to have blocked
   and the answer is none, which is not a failure. */
function netBlocked(ok){
  if(!netSignedIn()){ ok([]); return; }
  netGet('/rest/v1/block?select=blocked&actor=eq.'+encodeURIComponent(SESS.uid),
    function(d){
      var out=[], i;
      for(i=0;i<(d||[]).length;i++) if(d[i] && d[i].blocked) out.push(d[i].blocked);
      ok(out);
    }, function(){ ok([]); });
}
/* Something is wrong with this post, or with this person. Written and never
   read back: there is no select policy on `report` at all, so nobody using
   the app can read one -- not the person who wrote it and not the person it
   is about. It goes to whoever is looking at the dashboard.

   `why` is one of the five the schema allows. A reason invented here would be
   refused by the check constraint, which is the right way round: the list of
   reasons is the server's. */
function netReport(what, why, note, ok, bad){
  if(!netMember()){ bad(null, 0); return; }
  var row={actor:SESS.uid, why:String(why||'other')};
  if(note) row.note=String(note);
  if(what && what.post){ row.post=what.post; }
  if(what && what.handle){
    netGet('/rest/v1/profile?select=id&limit=1&handle='+
           'eq.'+encodeURIComponent(what.handle),
      function(d){
        if(d && d.length) row.who=d[0].id;
        if(!row.post && !row.who){ bad(null, 0); return; }
        netSend('POST', '/rest/v1/report', row, SESS.at, function(){ ok(); }, bad);
      }, bad);
    return;
  }
  if(!row.post){ bad(null, 0); return; }
  netSend('POST', '/rest/v1/report', row, SESS.at, function(){ ok(); }, bad);
}
/* ---- the other side of a report ----------------------------------------
   Somebody has to read them, and until now nobody could: `report` had no
   select policy at all, so the only way to see one was the Supabase dashboard.
   Acting on a report within a day is a condition of being in the App Store,
   and it is not a condition anybody meets from a laptop they are not sitting
   at.

   Who may is one column, `profile.staff`, set by hand in the dashboard and
   revoked from every role the app signs in as. There is no screen that grants
   it and there is not meant to be one. */
/* And the one above it, which is a different question: not "may this account
   answer a report" but "may this account decide who answers reports".
   「俺は権限者で他はスタッフみたいな感じで」 One account holds it -- whoever
   is called `lingua` -- and schema.sql is where that is written down, not
   here: what this variable is is the answer to a question already asked and
   already settled by the server. Every door it opens is bolted on that side
   too, so a phone that lied about this would get a screen and no data. */
var NET_STAFF=false, NET_ADMIN=false, NET_BANNED='';
/* Asked once, at launch, and remembered. A screen that asked every time it
   was drawn would put a request behind every render. */
/* One request, because it is one row and the app wants three things off it:
   whether this account answers the reports, whether it decides who does, and
   whether it has been ejected. The last is not something the app could work
   out otherwise -- every write would simply be refused, and "the server said
   no" is not a sentence anybody can act on. */
function netStaff(ok){
  ok=ok||function(){};
  if(!netSignedIn()){ NET_STAFF=false; NET_ADMIN=false; NET_BANNED=''; ok(false); return; }
  netGet('/rest/v1/profile?select=staff,admin,banned_at,banned_why&limit=1&id=eq.'+
         encodeURIComponent(SESS.uid),
    function(d){
      var r=(d && d.length)? d[0] : null;
      NET_STAFF=!!(r && r.staff);
      NET_ADMIN=!!(r && r.admin);
      /* The reason if there is one, and a space if there is not, so that the
         string is true-y whenever the account is banned and the screens can
         ask one question instead of two. */
      NET_BANNED=(r && r.banned_at)? (String(r.banned_why||'') || ' ') : '';
      ok(NET_STAFF);
    },
    function(){ NET_STAFF=false; NET_ADMIN=false; NET_BANNED=''; ok(false); });
}
/* Making somebody staff, and unmaking them. By handle, because a handle is
   the only name this app has for a person: an address lives in auth.users,
   which is Supabase's and is not read from here.
   「staffアカウントはスタッフページから追加できるようにしよう」

   staff_add() and staff_drop() in schema.sql ask is_admin() inside
   themselves, so these two are a screen for a door rather than the door. The
   `@` a person types is taken off here -- it is how the app says "a person"
   and is not part of what a handle IS. */
function netStaffAdd(handle, ok, bad){
  if(!netSignedIn() || !handle){ bad(null, 0); return; }
  netSend('POST', '/rest/v1/rpc/staff_add', {h:netHandleOf(handle)},
          SESS.at, function(){ ok(); }, bad);
}
function netStaffDrop(handle, ok, bad){
  if(!netSignedIn() || !handle){ bad(null, 0); return; }
  netSend('POST', '/rest/v1/rpc/staff_drop', {h:netHandleOf(handle)},
          SESS.at, function(){ ok(); }, bad);
}
/* One place, because both of the above and the screen that lists them would
   each have written it out. A handle is lower case in the schema's own check
   constraint, so typing one with a capital in it is a person typing a name
   rather than a person getting it wrong. */
function netHandleOf(s){
  return String(s||'').replace(/^@+/, '').toLowerCase().replace(/\s+/g, '');
}
/* Who answers the reports today. profile_read is `using (true)`, so this
   needs no policy of its own -- what it lists is public, and what it is FOR
   is not. */
function netStaffList(ok, bad){
  if(!netSignedIn()){ bad(null, 0); return; }
  netGet('/rest/v1/profile?select=id,handle,admin&staff=is.true&order=handle.asc',
    function(d){ ok(d || []); }, bad);
}
/* The reports, newest first, each carrying the thing it is about -- because a
   list of reasons with no posts under them is a list nobody can act on, and
   asking for the posts one at a time is one request per row.

   `post(...)` is the row the report points at and not the column of the same
   name; PostgREST reads the brackets as "follow the foreign key". A report
   about an account carries no post at all, and `who(handle)` is what it is
   about instead. */
function netReports(ok, bad){
  if(!netSignedIn()){ bad(null, 0); return; }
  netGet('/rest/v1/report?select=id,why,note,created_at,'+
         'post(id,body,hidden_at,author(id,handle,banned_at)),'+
         'who(id,handle,banned_at)'+
         '&order=created_at.desc&limit='+NET_PAGE,
    function(d){
      var out=[], i, r, po, au;
      for(i=0;i<(d||[]).length;i++){
        r=d[i]||{}; po=r.post||null;
        /* Whoever it is about: the author of the post, or -- when the report
           is about an account and carries no post -- the account itself. Both
           are the same embed of the same table, so both answer the same two
           questions and the screen does not care which kind it is holding. */
        au=(po && po.author) || r.who || null;
        out.push({ id:r.id,
                   why:String(r.why||'other'),
                   note:String(r.note||''),
                   at:Date.parse(r.created_at) || 0,
                   who:(au && au.handle) || '',
                   uid:(au && au.id) || '',
                   out:!!(au && au.banned_at),
                   pid:po? po.id : '',
                   ln:(po && po.body && po.body.ln) || '',
                   down:!!(po && po.hidden_at) });
      }
      ok(out);
    }, bad);
}
/* Down, and back up. Two functions on the server and not an update, so that
   whoever answers the reports cannot rewrite what somebody said -- see the
   foot of supabase/schema.sql. The reason is kept beside the post: a decision
   with no reason on it is one nobody can look at again, including whoever
   made it. */
function netHide(pid, why, ok, bad){
  if(!netSignedIn() || !pid){ bad(null, 0); return; }
  netSend('POST', '/rest/v1/rpc/post_hide', {p:pid, reason:String(why||'')},
          SESS.at, function(){ ok(); }, bad);
}
function netShow(pid, ok, bad){
  if(!netSignedIn() || !pid){ bad(null, 0); return; }
  netSend('POST', '/rest/v1/rpc/post_show', {p:pid},
          SESS.at, function(){ ok(); }, bad);
}
/* And the person, which is the other half of answering a report: taking the
   post down leaves whoever wrote it free to write it again. Nothing of theirs
   is deleted and they are not signed out -- is_member() in schema.sql stops
   what they would write and nothing they can read. */
function netBan(uid, why, ok, bad){
  if(!netSignedIn() || !uid){ bad(null, 0); return; }
  netSend('POST', '/rest/v1/rpc/account_ban', {p:uid, reason:String(why||'')},
          SESS.at, function(){ ok(); }, bad);
}
function netUnban(uid, ok, bad){
  if(!netSignedIn() || !uid){ bad(null, 0); return; }
  netSend('POST', '/rest/v1/rpc/account_unban', {p:uid},
          SESS.at, function(){ ok(); }, bad);
}
/* How many of everything there is: people, posts, languages, reports.

   One request and not four, and a function and not four counts off four
   tables. PostgREST answers a count in a Content-Range HEADER and netSend()
   above reads bodies -- but that is the small reason. The real one is in
   supabase/schema.sql over admin_counts(): counting the languages off the
   table would mean widening `language_read`, and widening it would hand staff
   the contents of every language nobody has published. A number is not worth
   somebody's unfinished work, so the number comes back on its own.

   is_staff() is asked inside the function, so this is the same door the
   reports come through and not a second one to keep in step with it. */
function netCounts(ok, bad){
  if(!netSignedIn()){ bad(null, 0); return; }
  netSend('POST', '/rest/v1/rpc/admin_counts', {}, SESS.at,
          function(d){ ok(d || {}); }, bad);
}
/* What App Store Connect says: the takings, the downloads and the
   subscriptions. 「売り上げもアナリティクスも見れるようにしたい」
   「アプリの中で見たい」「画面を開いたときに毎回」OWNER 2026-08-26.

   An Edge Function and not a table, because Apple answers this one
   synchronously -- `GET /v1/salesReports` hands back the report in the body,
   so there is nothing to keep a copy of. What is stored anywhere is nothing;
   what arrives is what Apple counted yesterday.
   docs/reports/sales-2026-08-26.md has what was confirmed at Apple and where.

   /functions/v1/ and not /rest/v1/, which is why this says netSend() with the
   path written out rather than going through one of the rpc helpers above:
   the same host, a different half of it. netSend() puts SB_KEY in `apikey`
   and the session in `Authorization`, which is exactly what the function
   reads -- it asks is_admin() with the token it was handed, so the door is
   the server's here as well.

   The key is Apple's and lives in the function's environment. Nothing about
   it is in this file, and there is nowhere in this app it could be: SB_KEY's
   comment at the top says why -- everything the phone holds is public.

   A refusal is a refusal like any other and goes to `bad`. What is NOT an
   error is the function answering `{ready:false}`: that is the owner not
   having put the keys in yet, which is where this starts on the first day,
   and `ok` gets it. The screen shows blanks either way; what it must not do
   is show a red line to somebody who has not done anything wrong. */
function netStore(ok, bad){
  if(!netSignedIn()){ bad(null, 0); return; }
  netSend('POST', '/functions/v1/appstore', {}, SESS.at,
          function(d){ ok(d || {}); }, bad);
}
/* ---- searching, which is the server's ----------------------------------
   A search over what is on THIS phone is a search of the people you already
   know and the posts you already have, which is the one search nobody needs.
   Both of these ask the server. 「必要なものは全部オンラインまとめてやる」

   Reading needs no account -- `profile_read` and `post_read` in schema.sql
   are both `using (true)` -- so nothing here is gated, and the timeline's own
   door is what decides whether somebody gets this far.

   `*` either side is PostgREST's `ilike`, which is case-insensitive and is
   the only kind of matching a person typing a name expects. The three
   characters PostgREST reads as syntax inside `or=(...)` are taken out rather
   than escaped: a comma or a bracket in a query is somebody looking for a
   comma, and there is nothing on the other side to find. */
function netLike(q){
  return encodeURIComponent('*'+String(q||'').replace(/[*,()]/g, ' ')+'*');
}
/* The names of the languages these accounts have, by owner -- the second half
   of looking people up.
   -------------------------------------------------------------------------
   TWO REQUESTS AND NOT A JOIN, for the same reason netFeed() asks for the
   follow list separately: there is no foreign key for PostgREST to travel.

   It USED to be a join. netFindWho() asked for `language(name)` as an embed,
   and on 2026-08-19 that worked, because `language.owner` was
   `references profile(id)` and an embed is a foreign key being walked. On
   2026-08-22 the column was repointed to `auth.users(id)` so that an
   anonymous account with no profile row could own a language -- which is
   right, and which quietly took the embed's road away. Both tables point at
   `auth.users` now and neither points at the other, and PostgREST does not
   join two tables through a third they happen to share. It answers PGRST200
   and the WHOLE request fails: not "somebody with no language", but nobody at
   all, for every search anybody made. 「新しいアカウントが検索に出てこない」
   was that, seen from the one account the owner was looking for.

   `profile.id` and `language.owner` are still the same uuid -- both are the
   account -- so the second question can be asked by hand. That is all this is.

   THE NAME IS DECORATION AND THE PEOPLE ARE THE ANSWER, so a failure here
   comes back as no names rather than as no people. A search that lost every
   result because a tag beside a handle could not be fetched would be this
   same bug in a smaller costume.

   Which one, when somebody has several: the OLDEST, and it is ordered so that
   it is the same one twice. netFindWho() argues that for its own paging --
   「it just has to be the SAME answer twice」 -- and an unordered pick would
   give a person a different tag every time somebody searched. It is not a
   decision about which language represents somebody; nothing has asked that
   yet, and the embed did not answer it either.

   Unpublished languages do not arrive and are not meant to: `language_read`
   in supabase/schema.sql is `published_at is not null or owner = auth.uid()`,
   so this asks with the same policy the embed asked with. 「lingua マーク」 */
function netLangNames(ids, done){
  var want=[], seen={}, i, id;
  for(i=0;i<(ids||[]).length;i++){
    id=String(ids[i]||'');
    if(id && !seen[id]){ seen[id]=1; want.push(id); }
  }
  if(!want.length){ done({}); return; }
  netGet('/rest/v1/language?select=owner,name&order=created_at.asc'+
         '&owner=in.('+want.join(',')+')',
    function(d){
      var by={}, j, r, o;
      for(j=0;j<(d||[]).length;j++){
        r=d[j]||{};
        o=String(r.owner||'');
        /* The first row for an owner wins, and the order above is what makes
           "first" mean the oldest rather than whichever the server reached
           for. */
        if(o && !(o in by)) by[o]=String(r.name||'');
      }
      done(by);
    }, function(){ done({}); });
}
/* ONE person, by the name one person knows another by.
   -------------------------------------------------------------------------
   Everything a profile page draws about somebody else used to come off a POST
   of theirs -- whoOf() in www/me.js walks POSTS looking for one. That is the
   right place for a post's name and face, and the wrong place for a page
   about a person: somebody found in the search has never written anything
   this phone is holding, so the page drew the empty shape and postFace() fell
   through to '?'. 「人のプロフィールが？」

   What arrives here is what the person looks like NOW, which is what a page
   about them should say -- supabase/schema.sql makes exactly that distinction
   over `profile.av`: a post freezes its own face when it is written (rule 8)
   and this one does not.

   NOBODY IS AN ANSWER. A handle with no row is `null` and not an error: the
   search can hand over a name that has since been deleted, and a page saying
   so is not the same as a page that could not ask.

   No bio and no counts, and that is not an omission here: there is no `bio`
   column and no follower count on `profile` at all -- what somebody writes
   about themselves lives on their own phone (www/me.js). whoCard() already
   draws neither rather than drawing a zero. */
function netWho(handle, ok, bad){
  var h=String(handle||'');
  if(!h){ bad(null, 0); return; }
  netGet('/rest/v1/profile?select=id,handle,display,av,banned_at'+
         '&limit=1&handle=eq.'+encodeURIComponent(h),
    function(d){
      var r, who;
      if(!d || !d.length){ ok(null); return; }
      r=d[0]||{};
      who={who:String(r.display||''), hd:String(r.handle||''),
           av:r.av||null, lname:'',
           /* Frozen. Off `banned_at`, which is the same fact `author_out`
              carries onto a post -- one column, asked of the person here and
              answered about the writer there. */
           out:!!r.banned_at};
      netLangNames([r.id], function(by){
        var id=String(r.id||'');
        if(id && by[id]) who.lname=by[id];
        ok(who);
      });
    }, bad);
}
/* People. The language's name is asked for separately and pasted on --
   netLangNames() above says why it cannot be an embed any more. */
function netFindWho(q, ok, bad, more){
  var like=netLike(q);
  /* Ordered by handle, which it was not until there was a second page to
     ask for. A list with no order is a list the server may hand back in a
     different arrangement each time, and "the ones after the last one" is
     not a question anybody can ask of that -- the same person would arrive
     twice and somebody else never. A handle is unique (schema.sql § who), so
     it is a place to carry on from and there is no page that can miss one.

     People have no `created_at` worth sorting by here: a search is not a
     timeline, and whoever matched first alphabetically is as good an answer
     as whoever signed up first -- it just has to be the SAME answer twice. */
  netGet('/rest/v1/profile?select=id,handle,display,av'+
         '&or=(handle.ilike.'+like+',display.ilike.'+like+')'+
         '&order=handle.asc'+
         (more? '&handle=gt.'+encodeURIComponent(String(more)) : '')+
         '&limit='+NET_PAGE,
    function(d){
      var out=[], ids=[], i, r;
      for(i=0;i<(d||[]).length;i++){
        r=d[i]||{};
        out.push({who:String(r.display||''), hd:String(r.handle||''),
                  av:r.av||null, lname:'',
                  mine:!!(SESS && SESS.uid && r.id===SESS.uid)});
        /* Beside the answer rather than on it: the shape a person comes back
           in is what every screen already draws, and an `id` added to it
           would be an account's uuid travelling to places that read a handle. */
        ids.push(String(r.id||''));
      }
      if(!out.length){ ok(out); return; }
      netLangNames(ids, function(by){
        var j, id;
        for(j=0;j<out.length;j++){
          id=ids[j];
          if(id && by[id]) out[j].lname=by[id];
        }
        ok(out);
      });
    }, bad);
}
/* Posts, matched on the line as it is spelled, on what it means, and on the
   name of the language it is written in. Not on the shapes: a shape is not
   something anybody can type. `body` is jsonb and `->>` is how PostgREST is
   asked for one of its fields as text. */
function netFindPosts(q, ok, bad, more){
  var like=netLike(q);
  /* `more` is the `at` of the last post already held. Keyset and not an
     offset for the reason netFeed()'s is: posts are written while somebody
     is reading, and an offset walked over a list that has grown hands back
     one they have already read, or steps over one they have not. */
  netGet('/rest/v1/post_seen?select=id,author,created_at,reply_to,body,hidden_at,author_out'+
         '&or=(body->>ln.ilike.'+like+',body->>mn.ilike.'+like+
         ',body->>lname.ilike.'+like+')'+
         '&order=created_at.desc'+
         (more? '&created_at=lt.'+encodeURIComponent(String(more)) : '')+
         '&limit='+NET_PAGE,
    function(d){
      var out=[], i;
      for(i=0;i<(d||[]).length;i++) out.push(netRow(d[i]));
      ok(out);
    }, bad);
}
/* ---- what somebody looks for, kept -------------------------------------

   A starred search. 「SNSは全部サーバー」 OWNER -- what a person keeps is
   theirs, so it is a row and not a habit one phone remembers.

   The WORDS and not the results: a saved search means "ask this again", and
   a list of ids frozen on the day it was starred would be a search that had
   stopped searching. netFindPosts() and netFindWho() are what it is handed to.

   `saved_search` in supabase/schema.sql is unique on (author, q), so the
   words ARE the name of the row -- which is why dropping one takes the words
   and not an id. The phone has the words in its hand; asking what their id
   was first would be a request to find out something it already knows. */
function netSearchSaved(ok, bad){
  if(!netMember()){ ok([]); return; }
  netGet('/rest/v1/saved_search?select=id,q,created_at&order=created_at.desc'+
         '&limit='+NET_PAGE,
    function(d){
      var out=[], i, r;
      for(i=0;i<(d||[]).length;i++){
        r=d[i]||{};
        out.push({id:r.id||'', q:String(r.q||''),
                  at:Date.parse(r.created_at)||0});
      }
      ok(out);
    }, bad || function(){});
}
function netSearchSave(q, ok, bad){
  var w=String(q||'').replace(/^\s+|\s+$/g, '');
  if(!netMember() || !w){ ok && ok(); return; }
  netSend('POST', '/rest/v1/saved_search', {author:SESS.uid, q:w}, SESS.at,
          function(){ ok && ok(); }, bad || function(){});
}
function netSearchDrop(q, ok, bad){
  var w=String(q||'').replace(/^\s+|\s+$/g, '');
  if(!netMember() || !w){ ok && ok(); return; }
  netSend('DELETE', '/rest/v1/saved_search?author=eq.'+
          encodeURIComponent(SESS.uid)+'&q=eq.'+encodeURIComponent(w),
          null, SESS.at, function(){ ok && ok(); }, bad || function(){});
}
/* ---- the bytes ---------------------------------------------------------
   A photograph is not a field of a post. It is half a megabyte, and a
   timeline of fifty posts carrying their own pictures is forty megabytes
   downloaded to draw six of them -- which is not a timeline, it is a wait.
   「Xとかインスタとかと同じ動きにしてね」

   So the picture goes to Storage and the post carries its PATH. The reader
   gets the text at once and the pictures fill in as they arrive, which is
   what X does and is the whole of why it feels like X.

   The path is the write rule: `<author uuid>/<post uuid>/0.jpg`, and
   supabase/schema.sql lets somebody write under their own uuid and nowhere
   else. Nothing here decides that; it obeys it.

   A path and not a URL, because the URL is where the bucket happens to live
   and the path is what the post is about. netMediaURL() is the one place the
   two are joined. */
function netMediaURL(path){
  return SB_URL+'/storage/v1/object/public/post-media/'+String(path||'');
}
/* A post's name before the post exists. The row's id is made HERE rather than
   by the server, because the pictures have to be uploaded under it and an id
   that arrives after the upload would mean uploading twice or moving files.
   One insert, one path, no second thought.

   crypto.getRandomValues where there is one, which is every WKWebView this
   app runs in. The fallback is not a security decision -- nothing is guarded
   by this number; it is a name that must not collide with another name made
   on another phone in the same second. */
function netUUID(){
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
/* A data URL, taken apart. Everything the phone holds a picture as is one of
   these; what goes on the wire is the bytes. */
function netData(u){
  u=String(u||'');
  var c=u.indexOf(','), sc=u.indexOf(';');
  if(u.indexOf('data:')!==0 || c<0 || sc<0 || u.indexOf('base64')<0) return null;
  return {mime:u.slice(5, sc), b64:u.slice(c+1)};
}
function netBytes(b64){
  var bin, n, a, i;
  try{ bin=atob(String(b64||'')); }catch(e){ return null; }
  n=bin.length;
  a=new Uint8Array(n);
  for(i=0;i<n;i++) a[i]=bin.charCodeAt(i);
  return a;
}
/* One file up. Not netSend(): this is a different service on the same host,
   the body is bytes rather than JSON, and the one header that matters is the
   content type -- a jpeg uploaded as octet-stream comes back as a download
   rather than as a picture. */
function netUp(path, b64, mime, ok, bad){
  var x, a=netBytes(b64);
  if(!netMember() || !a){ bad(null, 0); return; }
  x=new XMLHttpRequest();
  x.open('POST', SB_URL+'/storage/v1/object/post-media/'+path, true);
  x.setRequestHeader('apikey', SB_KEY);
  x.setRequestHeader('Authorization', 'Bearer '+SESS.at);
  x.setRequestHeader('Content-Type', mime || 'application/octet-stream');
  x.onreadystatechange=function(){
    if(x.readyState!==4) return;
    if(x.status>=200 && x.status<300) ok(path);
    else bad(null, x.status);
  };
  x.onerror=function(){ bad(null, 0); };
  x.send(a);
}
/* Every picture on a post, one after the other, and then the caller.
   One at a time and not all at once: a phone on a train has one usable
   connection, and four uploads racing each other is four that are slow.

   A picture that will not go is DROPPED FROM THIS POST'S LIST and does not
   stop the post. It is still on the phone -- nothing here removes anything --
   and the post goes up carrying the pictures that made it. A post that
   refused to exist because a photograph failed would be a post lost to a
   tunnel. */
/* Two files per picture: the photograph, and a small copy of it for the
   timeline. `th` is indexed to match `out` rather than pushed onto, because a
   small copy that fails to go leaves a HOLE and a list that closed the hole
   would put picture two's thumbnail under picture one. A hole is read by
   postThumbs() as "draw the photograph for this one", which is what every
   post written before this does anyway -- so a thumbnail that does not go up
   costs bytes and never correctness. */
function netUpPics(uid, pid, pics, ok){
  var out=[], th=[], i=0;
  function next(){ i++; step(); }
  function step(){
    var d;
    if(i>=pics.length){ ok(out, th); return; }
    d=netData(pics[i]);
    if(!d){ next(); return; }
    netUp(uid+'/'+pid+'/'+i+netExt(d.mime), d.b64, d.mime,
      function(path){
        var k=out.length;
        out.push(path);
        postThumb(pics[i], function(small){
          var td=small && netData(small);
          if(!td){ next(); return; }
          netUp(uid+'/'+pid+'/'+k+'.t'+netExt(td.mime), td.b64, td.mime,
            function(tp){ th[k]=tp; next(); },
            function(){ next(); });
        });
      },
      function(){ next(); });
  }
  step();
}
/* What a file is called at the end. The mime is what the phone said it made,
   and these three are what it can make. */
function netExt(mime){
  mime=String(mime||'');
  if(mime.indexOf('png')>=0) return '.png';
  if(mime.indexOf('webp')>=0) return '.webp';
  if(mime.indexOf('mp4')>=0 || mime.indexOf('m4a')>=0) return '.m4a';
  return '.jpg';
}
/* One row in `post`. Everything a reader needs is already ON it (rule 8): who
   wrote it, what they are called, the language's name, the shapes, which way
   the line runs. There is nothing to look up.

   ok() is called with the server's id for it, and the caller writes that onto
   the post -- which is what stops the same post coming back down the timeline
   as somebody else's. A push that fails leaves no `sid`, and a post with no
   `sid` is one that has not gone up yet, which is the whole of the retry. */
/* ---- the day's sentence ------------------------------------------------
   One row, the newest there is. Not "today's": the app does not work out what
   day it is in California -- the function that writes the row does that, and
   asking the server for the newest one is the same answer with no second copy
   of a timezone rule to get wrong. A day the writer missed shows yesterday's
   sentence, which is what is true.

   `says` is the ten languages and `text` is the English one under it, so a row
   written before the column existed still shows something. schema.sql § asked. */
function netDay(ok){
  netGet('/rest/v1/prompt?select=id,on_day,text,says&order=on_day.desc&limit=1',
    function(d){ ok(d && d.length? d[0] : null); },
    function(){ ok(null); });
}
function netPush(post, ok, bad){
  var row, pid, up;
  if(!netMember() || !post){ bad(null, 0); return; }
  pid=netUUID();
  row={id:pid, author:SESS.uid, body:netBody(post)};
  /* Which day's sentence this answers, if it answers one. It is a column and
     not a word in the text: post.prompt is a foreign key with an index behind
     it (schema.sql § asked), so every answer to one day is one query -- and
     nobody can delete the link by editing their own line, which is what a
     hashtag in the body would have been. */
  if(post.pr) row.prompt=post.pr;
  /* What it answers, by the name the SERVER knows -- the local id means
     nothing there. A reply to a post that never went up carries no reply_to
     and is still a post: it already holds the handle it answered (rule 13),
     so it goes on saying who it was for. */
  if(post.to){
    up=postById(post.to);
    if(up && up.sid) row.reply_to=up.sid;
  }
  /* The bytes first, the row after, because the row carries where the bytes
     went. The other order is a post that exists with pictures it cannot name
     until a second request lands -- and a second request is a second thing
     that can fail. */
  netUpPics(SESS.uid, pid, postPics(post), function(paths, small){
    if(paths.length) row.body.pu=paths;
    /* The small copies, and only when there are any. A post whose pictures
       were all smaller than POST_THUMB already carries no `pt` at all rather
       than a list of empty strings. */
    if(small.length) row.body.pt=small;
    netUpVoice(SESS.uid, pid, post, function(vpath){
      if(vpath) row.body.vu=vpath;
      netSend('POST', '/rest/v1/post?select=id', row, SESS.at,
        function(d){ ok((d && d.length? d[0].id : pid)); }, bad);
    });
  });
}
/* And the voice, which is a file on the disk rather than a string in hand --
   so it is read back out before it can go. A post with no voice, or one whose
   file has gone, is a post: ok('') and on. */
function netUpVoice(uid, pid, post, ok){
  var vo=post && post.vo;
  if(!vo || !vo.f){ ok(''); return; }
  voRead(vo.f, function(b64){
    if(!b64){ ok(''); return; }
    netUp(uid+'/'+pid+'/vo.m4a', b64, 'audio/mp4',
      function(path){ ok(path); }, function(){ ok(''); });
  });
}
/* ---- what was written and not sent -------------------------------------

   A draft is the timeline's, so it lives on the server. 「SNSは全部サーバー」
   OWNER, said again on 2026-08-27; CLAUDE.md § Online is where it is written
   down, and `draft` in supabase/schema.sql is the table. The phone keeps the
   copy that works with no signal -- www/post.js's DRAFTS -- and that copy is
   never the place a draft lives.

   The whole of a draft goes in `body`, pictures and recording included, as
   the composer holds them: base64 in hand. Not in the media bucket, and that
   is not a shortcut -- `post-media` is PUBLIC (schema.sql § the bucket, and
   media_read is `using (bucket_id = 'post-media')`), so a draft's photographs
   put there would be readable by anybody with the publishable key while the
   draft itself was not. The bytes go up when the post does, through
   netUpPics() and netUpVoice(), exactly as they do today.

   It also means account deletion has nothing extra to reach: netMyFiles()
   below collects what to remove out of `post.body`, and a draft that owned
   files in the bucket would be files nothing pointed at.

   The id is the phone's -- netUUID(), the way netPush() names a post -- so a
   draft written with no signal already has the name it will go up under. */
function netDraftUp(d, ok, bad){
  if(!netMember() || !d || !d.id){ bad && bad(null, 0); return; }
  var row={id:d.id, author:SESS.uid, body:netDraftBody(d)};
  /* The update first and the insert only if it matched nothing. The other
     order is an insert that fails on the primary key every time after the
     first, and a refusal that is expected is a refusal nobody reads. Two
     requests happen once per draft; every save after it is one. */
  netSend('PATCH', '/rest/v1/draft?id=eq.'+encodeURIComponent(d.id),
          {body:row.body, updated_at:(new Date()).toISOString()}, SESS.at,
    function(r){
      if(r && r.length){ ok && ok(); return; }
      netSend('POST', '/rest/v1/draft', row, SESS.at,
              function(){ ok && ok(); }, bad || function(){});
    },
    bad || function(){});
}
/* Everything of a draft except its name, which is the column and not a field
   of the body. The same shape as netBody() above and for the same reason. */
function netDraftBody(d){
  var o={}, k, skip={id:1};
  for(k in d) if(Object.prototype.hasOwnProperty.call(d, k) && !skip[k]) o[k]=d[k];
  return o;
}
/* Everything this account has written and not sent. draft_read in schema.sql
   is `is_member() and author = auth.uid()`, so the filter here is what the
   app asks for and not what makes it safe -- the server would hand over
   nothing else if this asked for everything. */
function netDrafts(ok, bad){
  if(!netMember()){ bad && bad(null, 0); return; }
  netGet('/rest/v1/draft?select=id,body,updated_at&order=updated_at.desc',
         function(d){ ok(d || []); }, bad || function(){});
}
/* And taking one off. Called when a draft is thrown away, and when it stops
   being a draft by being posted -- www/post.js does the second one AFTER the
   post is up, never before: a delete that ran first would be somebody's
   writing gone on the day the post itself would not go. */
function netDraftDrop(id, ok, bad){
  if(!netMember() || !id){ bad && bad(null, 0); return; }
  netSend('DELETE', '/rest/v1/draft?id=eq.'+encodeURIComponent(id), null,
          SESS.at, function(){ ok && ok(); }, bad || function(){});
}
/* `kind` is 'like' or 'boost', `on` is whether it now is. NOT a count: a count
   is what the server adds up, and two phones sending counts is how a number
   goes backwards. One row that exists, or one row that does not.

   `id` is this phone's name for the post, so the row it points at has to be
   looked up -- a post that never went up cannot be liked on a server that has
   never heard of it, and that is not an error worth showing anybody. */
function netMark(id, kind, on, ok, bad){
  var p=postById(id), sid=p && p.sid;
  if(!netMember() || !sid || (kind!=='like' && kind!=='boost')){ ok(); return; }
  if(on){
    netSend('POST', '/rest/v1/react', {post:sid, actor:SESS.uid, kind:kind},
            SESS.at, function(){ ok(); }, bad);
    return;
  }
  netSend('DELETE', '/rest/v1/react?post=eq.'+encodeURIComponent(sid)+
          '&actor=eq.'+encodeURIComponent(SESS.uid)+
          '&kind=eq.'+encodeURIComponent(kind),
          null, SESS.at, function(){ ok(); }, bad);
}
/* The row goes. The phone has already forgotten it, and the voice file with it
   (docs/CHANGELOG.md § DELETE REVIEW).

   The pictures and the voice in Storage go too, and they go FIRST -- a row
   deleted before its files leaves files nothing points at, and "which files
   does nothing point at" is a question with no cheap answer. If the files will
   not go the row still does: a post somebody asked to be gone must go. */
/* The POST, not its id. It is called from postDel, which has already taken
   the post out of POSTS -- so postById() answered null here, sid was
   undefined, and this returned as though there had been nothing on the
   server. The post went off the phone, stayed on the server, and came back
   with the next feed. 「投稿削除ボタン押しても消えないけど？」 Nothing threw and
   nothing could: the one branch that means "there is no server copy" is the
   same branch as "I cannot find this post". */
function netDrop(p, ok, bad){
  var sid=p && p.sid;
  if(!netMember() || !sid){ ok(); return; }
  netDropFiles(p, function(){
    netSend('DELETE', '/rest/v1/post?id=eq.'+encodeURIComponent(sid),
            null, SESS.at, function(){ ok(); }, bad);
  });
}
/* Everything of this post's that is in the bucket. Named rather than searched
   for: the paths are on the post, and asking the bucket what is under a folder
   is a listing this does not need and a permission it does not have. */
function netDropFiles(p, done){
  var paths=[], i;
  for(i=0;i<((p && p.pu) || []).length;i++) paths.push(p.pu[i]);
  /* The small copies too. A picture is two files now, and a deletion that
     took one of them would leave the other in a public bucket with nothing
     pointing at it -- which is the exact thing the paragraph above is about.
     Walked with a hole in it, because `pt` is allowed to have one. */
  for(i=0;i<((p && p.pt) || []).length;i++) if(p.pt[i]) paths.push(p.pt[i]);
  if(p && p.vu) paths.push(p.vu);
  if(!paths.length){ done(); return; }
  netSend('DELETE', '/storage/v1/object/post-media', {prefixes:paths}, SESS.at,
          function(){ done(); }, function(){ done(); });
}
/* ---- being deleted -----------------------------------------------------
   The one thing signing out is not. `account_delete()` in supabase/schema.sql
   reaches auth.users, which no policy in that file can, and everything of
   this person's cascades off the profile behind it: the languages, the posts,
   the follows, the blocks, the publication records.

   What does NOT cascade is Storage. A photograph is bytes in a bucket and a
   bucket has no foreign keys, so a deletion that only called the function
   would leave every picture anybody had ever posted sitting in a PUBLIC
   bucket with nothing pointing at it and nobody able to find it to remove it.
   So the files go first and they go from here.

   Which files is asked of the SERVER and not of this phone. The phone holds
   the posts it has seen, and "the posts it has seen" stops being "the posts I
   wrote" the moment there has been a second phone or a storage wipe -- and
   the whole point of a deletion is that there is no second chance to notice.

   Nothing about the language on this phone is touched. Somebody deleting an
   account has not asked to lose four months of their own writing, and
   docs/DATA_SAFETY.md says that in general terms. Erasing the phone is the
   other button, and it says which it is. */
function netDropMe(ok, bad){
  if(!netSignedIn()){ ok(); return; }
  netGet('/rest/v1/post?select=body&author=eq.'+encodeURIComponent(SESS.uid),
    function(d){ netDropMine(netMyFiles(d), function(){ netEndMe(ok, bad); }); },
    /* The listing failed, and the account still goes. Somebody who asked to
       be deleted must be deleted; a photograph left behind is a smaller wrong
       than an account that would not die because the network was bad. */
    function(){ netEndMe(ok, bad); });
}
/* Every path a post of mine put in the bucket. The paths are ON the post --
   netBody() sends them up with it -- so this reads them back rather than
   asking the bucket what is under a folder, which is a listing that does not
   recurse and would have to be walked a level at a time. */
function netMyFiles(rows){
  var out=[], i, j, b, pu;
  for(i=0;i<((rows||[]).length);i++){
    b=(rows[i] && rows[i].body) || {};
    pu=b.pu || [];
    for(j=0;j<pu.length;j++) if(pu[j]) out.push(String(pu[j]));
    if(b.vu) out.push(String(b.vu));
  }
  return out;
}
/* A hundred at a time, and a refusal is not a stop. Storage takes a list, and
   a person with three hundred pictures is one request in this shape and three
   in the other. Whichever lot fails is left behind and the rest still go: the
   next line is the account itself and it must be reached. */
function netDropMine(paths, done){
  var i=0;
  function step(){
    var lot;
    if(i>=paths.length){ done(); return; }
    lot=paths.slice(i, i+100); i+=100;
    netSend('DELETE', '/storage/v1/object/post-media', {prefixes:lot}, SESS.at,
            step, step);
  }
  step();
}
/* And the account. netOut() after it and not before: the token is what proves
   who is being deleted, and throwing it away first would be asking the server
   to delete nobody. A failure here leaves the person signed in, which is the
   honest state -- the account is still there. */
function netEndMe(ok, bad){
  netSend('POST', '/rest/v1/rpc/account_delete', {}, SESS.at,
          function(){ netOut(); ok(); }, bad);
}

/* One row in `follow`, or one row gone. `on` is whether you follow them now.
   Not waited on: the button has already changed, the same way a like has.

   A handle and not an id, because a handle is what one person knows another
   by. The id is looked up here, once, in the one place that has to. */
function netFollow(handle, on, ok, bad){
  if(!netMember() || !handle){ ok(); return; }
  netGet('/rest/v1/profile?select=id&limit=1&handle=eq.'+encodeURIComponent(handle),
    function(d){
      var who=(d && d.length)? d[0].id : '';
      if(!who){ ok(); return; }
      if(on){
        netSend('POST', '/rest/v1/follow', {follower:SESS.uid, followed:who},
                SESS.at, function(){ ok(); }, bad);
        return;
      }
      netSend('DELETE', '/rest/v1/follow?follower=eq.'+encodeURIComponent(SESS.uid)+
              '&followed=eq.'+encodeURIComponent(who),
              null, SESS.at, function(){ ok(); }, bad);
    }, bad);
}
/* NOTIF_SEAM — who liked, answered, boosted or followed, newest first, as
   { kind, at, hd, who, av, id, n, more }. `kind` is 'like' | 'boost' |
   'reply' | 'follow' | 'pick' -- the last being a post worth reading, which
   is not somebody doing something and is the only one of the five this phone
   could never work out on its own.

   ONE ROW PER THING and not per person. 「同じ投稿のいいねとかは X みたいに
   まとめていい」 OWNER 2026-08-28. `hd`, `who` and `av` are whoever did it
   LAST, which is what they have always been; `n` is how many people, 1 for a
   thing one person did; `more` is the next few after that one, newest first,
   as [{hd, who, av}].

   The folding is the server's (supabase/schema.sql § what happened to you)
   and NOT this function's. Fifty rows folded here would be fifty rows that
   became twenty, and somebody would see less than they did; folded there,
   fifty rows are fifty things that happened. */
function netNotices(ok, bad){
  if(!netSignedIn()){ ok(null); return; }
  /* One request and not four. A notice list is ONE list in time order, and a
     phone asking separately about likes, boosts, replies and follows would be
     sorting a page it does not have all of. supabase/schema.sql's notices()
     is the four, merged and ordered, and it runs as whoever calls it. */
  netSend('POST', '/rest/v1/rpc/notices', {lim:NET_PAGE}, SESS.at,
    function(d){
      var out=[], i, r;
      for(i=0;i<(d||[]).length;i++){
        r=d[i];
        out.push({kind:r.kind, at:Date.parse(r.at)||0, hd:r.hd||'',
                  who:r.who||r.hd||'', av:r.av||null, id:r.post||'',
                  /* A row that says nothing about how many is one person --
                     the server sends 1, and a server that has not been
                     updated sends nothing at all. */
                  n:r.n||1, more:r.more||[]});
      }
      ok(out);
    }, bad);
}
