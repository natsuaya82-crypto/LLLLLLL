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
   world-readable, so the timeline works with the key alone and somebody who
   has not decided yet is not asked to. Anonymous sign-in would create an
   account that exists only as a token on one phone -- lose the phone and
   nobody, including us, can prove it was theirs. So there is none.
   ========================================================================= */

/* =========================================================================
   21. The server
   ========================================================================= */

var SB_URL='https://iimwukyyasbybfrirhsf.supabase.co';
var SB_KEY='sb_publishable_3FTW3G5jfBVPoc8MiXgdNw_OZk2L1-6';

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
         uid:(d.user && d.user.id) || (SESS && SESS.uid) || '' };
  netSave();
  return true;
}
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
function netMakeProfile(h, name, ok, bad){
  if(!netSignedIn()){ bad(null, 0); return; }
  netPost('/rest/v1/profile', {id:SESS.uid, handle:h, display:name},
          SESS.at, ok, bad);
}
function netIdToken(provider, token, nonce, ok, bad){
  var b={ provider:provider, id_token:token };
  if(nonce) b.nonce=nonce;
  netPost('/auth/v1/token?grant_type=id_token', b, null,
          function(d){ if(netTook(d)) ok(d); else bad(d, 0); }, bad);
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
     netDrop(id, ok, bad)          ok()              gone from the server too

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
  var o={}, k, skip={id:1, sid:1, mine:1, at:1, to:1, pics:1, vo:1, li:1, bo:1, re:1};
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
  var sel='/rest/v1/post?select=id,author,created_at,reply_to,body'+
          '&order=created_at.desc&limit='+NET_PAGE;
  function got(d){
    var out=[], i;
    if(!d || !d.length){ ok([]); return; }
    for(i=0;i<d.length;i++) out.push(netRow(d[i]));
    ok(out);
  }
  if(which!=='fo'){ netGet(sel, got, bad); return; }
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
      netGet(sel+'&author=in.('+ids.join(',')+')', got, bad);
    }, bad);
}
/* One row in `post`. Everything a reader needs is already ON it (rule 8): who
   wrote it, what they are called, the language's name, the shapes, which way
   the line runs. There is nothing to look up.

   ok() is called with the server's id for it, and the caller writes that onto
   the post -- which is what stops the same post coming back down the timeline
   as somebody else's. A push that fails leaves no `sid`, and a post with no
   `sid` is one that has not gone up yet, which is the whole of the retry. */
function netPush(post, ok, bad){
  var row;
  if(!netSignedIn() || !post){ bad(null, 0); return; }
  row={author:SESS.uid, body:netBody(post)};
  /* What it answers, by the name the SERVER knows -- the local id means
     nothing there. A reply to a post that never went up carries no reply_to
     and is still a post: it already holds the handle it answered (rule 13),
     so it goes on saying who it was for. */
  if(post.to){
    var up=postById(post.to);
    if(up && up.sid) row.reply_to=up.sid;
  }
  netSend('POST', '/rest/v1/post?select=id', row, SESS.at,
    function(d){ ok(d && d.length? d[0].id : ''); }, bad);
}
function netMark(id, kind, on, ok, bad){
  /* NET_SEAM — `kind` is 'like' or 'boost', `on` is whether it now is. Not a
     count: a count is what the server adds up, and two phones sending counts
     is how a number goes backwards. */
  ok();
}
function netDrop(id, ok, bad){
  /* NET_SEAM — the row goes. The phone has already forgotten it, and the
     voice file with it (docs/CHANGELOG.md § DELETE REVIEW). */
  ok();
}
/* FOLLOW_SEAM — one row in `follow`, or one row gone. `on` is whether you
   follow them now. Not waited on: the button has already changed, the same
   way a like has. */
function netFollow(handle, on, ok, bad){
  ok();
}
/* NOTIF_SEAM — who liked, answered, boosted or followed, newest first, as
   { kind, at, hd, who, av, id }. `kind` is 'like' | 'boost' | 'reply' |
   'follow' | 'pick' -- the last being a post worth reading, which is not
   somebody doing something and is the only one of the five this phone could
   never work out on its own. */
function netNotices(ok, bad){
  if(!netSignedIn()){ ok(null); return; }
  ok(null);
}
