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
  if(!netSignedIn()){ bad(null, 0); return; }
  netPost('/rest/v1/profile',
          {id:SESS.uid, handle:h, display:name, av:postAvatar()},
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
  netGet('/rest/v1/post?select=id,author,created_at,reply_to,body'+
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
  if(!netSignedIn() || !a){ bad(null, 0); return; }
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
function netUpPics(uid, pid, pics, ok){
  var out=[], i=0;
  function step(){
    var d;
    if(i>=pics.length){ ok(out); return; }
    d=netData(pics[i]);
    if(!d){ i++; step(); return; }
    netUp(uid+'/'+pid+'/'+i+netExt(d.mime), d.b64, d.mime,
      function(path){ out.push(path); i++; step(); },
      function(){ i++; step(); });
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
function netPush(post, ok, bad){
  var row, pid, up;
  if(!netSignedIn() || !post){ bad(null, 0); return; }
  pid=netUUID();
  row={id:pid, author:SESS.uid, body:netBody(post)};
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
  netUpPics(SESS.uid, pid, postPics(post), function(paths){
    if(paths.length) row.body.pu=paths;
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
  if(!netSignedIn() || !sid || (kind!=='like' && kind!=='boost')){ ok(); return; }
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
function netDrop(id, ok, bad){
  var p=postById(id), sid=p && p.sid;
  if(!netSignedIn() || !sid){ ok(); return; }
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
  if(p && p.vu) paths.push(p.vu);
  if(!paths.length){ done(); return; }
  netSend('DELETE', '/storage/v1/object/post-media', {prefixes:paths}, SESS.at,
          function(){ done(); }, function(){ done(); });
}
/* One row in `follow`, or one row gone. `on` is whether you follow them now.
   Not waited on: the button has already changed, the same way a like has.

   A handle and not an id, because a handle is what one person knows another
   by. The id is looked up here, once, in the one place that has to. */
function netFollow(handle, on, ok, bad){
  if(!netSignedIn() || !handle){ ok(); return; }
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
