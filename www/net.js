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

   An anonymous account is one phone's refresh token and nothing else. Lose
   the phone and nobody, including us, can prove it was theirs -- which is
   exactly why buying asks for an identity, and why attaching one later keeps
   the same uid rather than starting again.
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
var GOOGLE_IOS_ID='';

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
  if(method==='POST' && path.indexOf('/rest/v1/')===0)
    x.setRequestHeader('Prefer', 'return=representation');
  x.onreadystatechange=function(){
    if(x.readyState!==4) return;
    var d=null;
    try{ d=JSON.parse(x.responseText||'null'); }catch(e){}
    if(x.status>=200 && x.status<300) ok(d);
    else bad(d, x.status);
  };
  x.onerror=function(){ bad(null, 0); };
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
function netWhy(d, status){
  if(!status) return t('net.offline');
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
}
/* The token in hand lasts an hour. This is what makes the next launch silent:
   nothing is typed, nothing is remembered by the person, and the thing on the
   phone that does it can be taken away from the server's side. */
function netResume(ok, bad){
  if(!netSignedIn()){ bad(null, 0); return; }
  netPost('/auth/v1/token?grant_type=refresh_token',
          {refresh_token:SESS.rt}, null,
          function(d){ if(netTook(d)) ok(d); else bad(d, 0); },
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
          function(d){ if(netTook(d)) ok(d); else bad(d, 0); }, bad);
}
/* The six digits out of the mail. A link would have to land somewhere, and
   there is nowhere for it to land: this is a Capacitor app with no web page
   behind it, so the default confirmation URL opens nothing on the tester's
   phone. A code goes back to the screen that asked for it. */
function netVerify(email, code, ok, bad){
  netPost('/auth/v1/verify', {type:'signup', email:email, token:code}, null,
          function(d){ if(netTook(d)) ok(d); else bad(d, 0); }, bad);
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
          function(d){ if(netTook(d)) ok(d); else bad(d, 0); }, bad);
}
/* Changing the password of whoever is signed in. It is only ever reached
   holding a session the code above bought a moment ago, so nothing here
   knows or asks what the OLD password was -- which is the whole point: the
   person forgot it. */
function netSetPass(pass, ok, bad){
  if(!netSignedIn()){ bad(null, 0); return; }
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
  if(!netSignedIn()){ bad(null, 0); return; }
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
  if(!netMember()){ bad(null, 0); return; }
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
function netIdToken(provider, token, nonce, ok, bad){
  var b={ provider:provider, id_token:token };
  if(nonce) b.nonce=nonce;
  netPost('/auth/v1/token?grant_type=id_token', b, null,
          function(d){ if(netTook(d)) ok(d); else bad(d, 0); }, bad);
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
function netLangRow(ok, bad){
  var L=LANGS[langId];
  if(!netSignedIn() || !L){ bad(null, 0); return; }
  if(L.sid){ ok(L.sid); return; }
  netPost('/rest/v1/language', {owner:SESS.uid, name:langName||''}, SESS.at,
    function(d){
      var sid=(d && d.length)? d[0].id : '';
      if(!sid){ bad(d, 0); return; }
      L.sid=sid; langStore();
      ok(sid);
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
var NET_SYNCING=false;
function netLangSync(then){
  var done=then || function(){};
  if(NET_SYNCING || !netSignedIn() || !langId){ done(false); return; }
  NET_SYNCING=true;
  function stop(moved){ NET_SYNCING=false; done(!!moved); }
  netLangRow(function(sid){
    netSlices(sid, function(there){
      var i=0, moved=false;
      function step(){
        var kind, mine, got, put;
        if(i>=SLICES.length){
          if(moved){
            /* Something came back, so what the screens are holding is older
               than what is in storage. Read it in the way langOpen() does
               rather than patching each global by hand. */
            langRead(); ltRead(); ntRead(); stRead(); sndRead(); kbRead(); wldRead();
            render();
          }
          stop(moved); return;
        }
        kind=SLICES[i]; i++;
        try{ mine=localStorage.getItem(langKey(kind)); }catch(e){ mine=null; }
        got=there[kind];
        put=syMerge(kind, mine===null? '' : mine, got? got.body : '');
        if(put!=='' && put!==mine){
          try{ localStorage.setItem(langKey(kind), put); moved=true; }catch(e){}
        }
        if(put==='' || (got && put===got.body)){ step(); return; }
        netSlicePut(sid, kind, put, got? got.no : 0,
                    function(){ step(); }, function(){ step(); });
      }
      step();
    }, function(){ stop(false); });
  }, function(){ stop(false); });
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
function netFeed(which, ok, bad){
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
  function got(d){
    var out=[], i;
    if(!d || !d.length){ ok([]); return; }
    for(i=0;i<d.length;i++) out.push(netRow(d[i]));
    ok(out);
  }
  /* Whoever you have blocked is asked for FIRST and left out by the server. A
     timeline that downloaded their posts and then hid them would be a block
     the phone knows about and the server does not, which is not a block. */
  function pull(more){
    var q=sel+(more||'');
    netBlocked(function(bl){
      netGet(bl.length? q+'&author=not.in.('+bl.join(',')+')' : q, got, bad);
    });
  }
  if(which!=='fo'){ pull(''); return; }
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
/* People. The language's NAME comes with them where there is one: the embed
   reads `language`, whose policy answers with what has been published and
   with your own, so an unpublished language is nobody's business and simply
   does not arrive. 「lingua マーク」 */
function netFindWho(q, ok, bad){
  var like=netLike(q);
  netGet('/rest/v1/profile?select=id,handle,display,av,language(name)'+
         '&or=(handle.ilike.'+like+',display.ilike.'+like+')'+
         '&limit='+NET_PAGE,
    function(d){
      var out=[], i, r, ls;
      for(i=0;i<(d||[]).length;i++){
        r=d[i]||{};
        ls=r.language||[];
        out.push({who:String(r.display||''), hd:String(r.handle||''),
                  av:r.av||null, lname:(ls.length? String(ls[0].name||'') : ''),
                  mine:!!(SESS && SESS.uid && r.id===SESS.uid)});
      }
      ok(out);
    }, bad);
}
/* Posts, matched on the line as it is spelled, on what it means, and on the
   name of the language it is written in. Not on the shapes: a shape is not
   something anybody can type. `body` is jsonb and `->>` is how PostgREST is
   asked for one of its fields as text. */
function netFindPosts(q, ok, bad){
  var like=netLike(q);
  netGet('/rest/v1/post_seen?select=id,author,created_at,reply_to,body,hidden_at,author_out'+
         '&or=(body->>ln.ilike.'+like+',body->>mn.ilike.'+like+
         ',body->>lname.ilike.'+like+')'+
         '&order=created_at.desc&limit='+NET_PAGE,
    function(d){
      var out=[], i;
      for(i=0;i<(d||[]).length;i++) out.push(netRow(d[i]));
      ok(out);
    }, bad);
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
   { kind, at, hd, who, av, id }. `kind` is 'like' | 'boost' | 'reply' |
   'follow' | 'pick' -- the last being a post worth reading, which is not
   somebody doing something and is the only one of the five this phone could
   never work out on its own. */
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
                  who:r.who||r.hd||'', av:r.av||null, id:r.post||''});
      }
      ok(out);
    }, bad);
}
