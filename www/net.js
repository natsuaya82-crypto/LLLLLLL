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
     netSignedIn()     the session has somebody's name on it.

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
   starting again." That was never true while the mail door posted to
   /auth/v1/signup, which asks Supabase for a NEW user rather than for a way
   into the one that is already there. It is netMailOtp() below now
   -- 「1アドレス1アカウント」 OWNER 2026-09-02 -- so an address that has an
   account lands on it whichever road it comes by. Nothing was ever lost by
   the old shape: the app has never been released.
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
  /* AND WHOSE SETTINGS ARE LIVE HERE. planFor() in www/core.js has the whole
     of why; what this line is, is the FIRST of the two moments a uid is
     known, and it is the earlier one.

     It used to matter for the PLAN: a word was in `SET` by now -- the
     Keychain injected it ahead of core.js -- and capLapse() compared it
     against the last plan this phone saw, synchronously, long before
     netResume() came back, so a launch by somebody who was not the buyer had
     to be answered here. There is no word: the plan is `verify-plan`'s
     answer, in memory (www/core.js § PLAN), and nobody-has-asked is where a
     launch starts. What is left is the settings, which ARE parked per
     account, and forgetting a plan that belonged to whoever was here
     before. */
  planFor(SESS && SESS.uid);
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

/* ---- the token, kept alive ----------------------------------------------
   THE ACCESS TOKEN LASTS AN HOUR AND THE APP DOES NOT CLOSE.

   netResume() is called from one place -- boot.js, on the launch -- and for
   as long as that was the only place, an app left open for an hour went on
   sending a dead token to everything. Nothing threw. Every write answered
   401 and every 401 went where that write's `bad` went, which for a slice
   (`netSlicePut`), a plan and a draft was nowhere at all. So a
   person who opened Lingua in the morning and saved a word in the afternoon
   saved it to the phone and to nothing else, and was told it had gone up.
   「保存押せば起動されないの？」 OWNER 2026-09-02 -- no, it did not: saving
   sends the token that is in hand and there was nothing that ever replaced it.

   So a 401 refreshes and goes again. Three conditions, and each one is what
   keeps this from becoming its own kind of fault:

   ONLY THE SESSION'S OWN TOKEN. A request sent with the publishable key, or
   with a token a caller chose deliberately, is not this person's session
   expiring -- it is a refusal that means what it says. `mine` is decided at
   SEND time, because SESS.at may be replaced by another request's refresh
   while this one is in the air.

   ONCE. A second 401 after a successful refresh is the server refusing the
   person, not the clock, and going round again would be a loop that never
   reaches the `bad` somebody is waiting on.

   ONE REFRESH AT A TIME. Twenty slices go up together on a launch; twenty
   refreshes would spend the refresh token twenty times over and nineteen of
   them would race. The first one refreshes, the rest wait in RFQ and are all
   told the same answer. ES5, so this is an array and callbacks rather than a
   Promise. */
var RFQ=null;
function netFresh(then){
  if(!netSignedIn()){ then(false); return; }
  if(RFQ){ RFQ[RFQ.length]=then; return; }
  RFQ=[then];
  netResume(function(){ netFreshDone(true); },
            function(){ netFreshDone(false); });
}
function netFreshDone(got){
  var q=RFQ, i;
  /* Emptied BEFORE anybody is told, so a callback that sends again starts a
     new refresh rather than joining one that has already finished. */
  RFQ=null;
  for(i=0;i<q.length;i++) q[i](got);
}

/* ---- the wire ----------------------------------------------------------
   XHR rather than fetch: this has to run on a WKWebView old enough that the
   rest of the file is ES5, and a Promise is banned three lines up. One of the
   two callbacks is always called, so nothing is left waiting on a spinner --
   and that sentence was not true until there was a deadline. A connection
   that is ACCEPTED and never answered is not an error and never becomes one:
   no handler fires, and the phone waits on a spinner until somebody kills the
   app. A dead network is the case everybody thinks of and is the easy one;
   this is the tunnel, the captive portal, the server that took the request
   and stopped.

   Twenty seconds. 「20で」 OWNER 2026-09-04. Written once, here, rather than
   at each of the calls -- and there is no `ontimeout` beside it on purpose: a
   timed-out XHR reaches readyState 4 with status 0, which was MEASURED in
   Chromium rather than read off a specification, and that is the same thing
   the handler below already sees when a request goes and nothing comes back.
   So running out falls into the road that is already there. An `ontimeout`
   would be a SECOND way out of the same event and would call `bad` twice.
   token-check holds both halves.

   `up` asks for an upsert (`resolution=merge-duplicates`): the phone does not
   have to know whether this row has ever been up. It is a header rather than
   a second function because two hand-rolled XHRs down this file were exactly
   netSend() plus that one line, and both of them were therefore outside the
   refresh above -- which is where the fault lived. */
var NET_WAIT=20000;
/* ---- HOW MANY REQUESTS ARE IN THE AIR ------------------------------------
   One number, kept by the two XMLHttpRequests this file owns and by nothing
   else -- netSend1() above and netUp() at the foot of the file are the whole
   of the app's wire, so counting here counts everything.

   It exists for one reason: 「再思考もポップ消えてくるくるみたいな。」OWNER
   2026-09-05. 再接続 puts a mark up, and the mark has to come down when the
   asking is OVER -- not after a fixed sleep, which would leave it turning
   over a screen whose answer landed a second in, and would take it away from
   a screen still waiting.

   ONE REQUEST IS COUNTED ONCE. A dead network reaches readyState 4 AND then
   fires `onerror`, so both roads out call netOff() for the same request; the
   stamp on the request itself is what makes the second call nothing. It is
   put on the XHR rather than kept in a list because the request is the thing
   that is either counted or not.

   AND THE CHECK IS ONE TICK LATE, on purpose. A 401 goes again from inside
   its own handler, so the count drops to zero and comes back up in the same
   turn; asking there would flicker the mark off between a request and its
   own retry. */
var NET_OUT=0;
function netOn(x){ if(x.__net) return; x.__net=1; NET_OUT++; }
function netOff(x){
  if(!x.__net) return;
  x.__net=0;
  if(NET_OUT>0) NET_OUT--;
  setTimeout(netIdle, 0);
}
/* Nothing left in the air. Whatever fell has already put the pop up through
   netPop(); this only stops the mark turning. */
function netIdle(){ if(!NET_OUT) netSpin(false); }
/* ---- AND THE MARK ITSELF -------------------------------------------------
   「エラーになったらエラー用のポップ出して再更新とかおさせればいいやんそれ
   だけで1個作れば全部に使えるやん」OWNER 2026-09-05.

   It is the app's own four-pointed star, the same one the pull turns and the
   same one a timeline shows while its first answer is out -- ICON_PLUS, and
   not a fifth drawing of it. What it looks like is `.netspin` in
   www/index.html; this file turns it on and off and nothing more.

   IT COVERS THE SCREEN AND TAKES THE PRESSES. 「通信エラーなら進むわけねえ
   だろ全部」 -- while the app is finding out whether it can reach the server,
   there is nothing underneath worth pressing, and a press that did something
   would be the app moving on a question it has not answered yet. There is no
   handler on it: pressing it does nothing, which is the whole intention. */
function netSpin(on){
  var el=document.getElementById('netspin');
  if(!el) return;
  if(on && !el.firstChild) el.innerHTML='<div class="mk">'+ICON_PLUS+'</div>';
  if(on) el.className='netspin on'; else el.className='netspin';
}
function netSend(method, path, body, tok, ok, bad, up){
  netSend1(method, path, body, tok, ok, bad, up, true);
}
function netSend1(method, path, body, tok, ok, bad, up, may){
  /* Whether this went out as the person, asked now rather than when the
     answer comes back. */
  var mine=!!(tok && SESS && tok===SESS.at);
  var x=new XMLHttpRequest();
  x.open(method, SB_URL+path, true);
  /* After open(), which is where a deadline may be set. */
  x.timeout=NET_WAIT;
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
  /* AND DELETE, for that second reason and nothing else. A DELETE that matched
     NO ROW answers 204 exactly like one that matched -- so a post the row
     policy refused to remove came back 「消えました」, went off the phone, and
     was there again on the next pull. 「投稿削除ボタン押しても消えないけど？」
     Asked for here rather than at netDrop(), because it is the same sentence
     the two lines above are: a write that changed nothing must never read as
     a write that worked. */
  /* EXCEPT THE SLICE, WHICH IS SOMEBODY'S DICTIONARY COMING STRAIGHT BACK.
     A slice write is a POST that upserts, so there is no 「matched no row」
     to tell apart -- that is what the three paragraphs above are about and
     none of them is about this one. 2xx IS 「the server took it」, which is
     the whole of what netSlicePut()'s `ok` has ever read: it takes no
     argument and never has. Asking for the row back doubles every save --
     872 KB up and the same 872 KB down again on a 5,000-word language, a
     quarter of everything that account sends in a month.
     docs/reports/cost-2026-09-09.md 一. */
  if((method==='POST' || method==='PATCH' || method==='DELETE') &&
     path.indexOf('/rest/v1/')===0)
    x.setRequestHeader('Prefer',
      (path.indexOf('/rest/v1/slice')===0
         ? 'return=minimal' : 'return=representation')+
      (up? ', resolution=merge-duplicates' : ''));
  else if(up) x.setRequestHeader('Prefer', 'resolution=merge-duplicates');
  x.onreadystatechange=function(){
    if(x.readyState!==4) return;
    var d=null;
    netOff(x);
    try{ d=JSON.parse(x.responseText||'null'); }catch(e){}
    if(x.status>=200 && x.status<300){ ok(d); return; }
    /* An hour has gone by with the app open. Everything about this request is
       still right except the token on it, so it goes again with a live one.
       netFresh() answers false for a refresh token the server no longer
       accepts -- and netResume() has already signed the phone out by then, so
       what reaches `bad` is a 401 on a session that has really ended. */
    if(x.status===401 && may && mine){
      if(netSignedIn() && SESS.at!==tok){
        /* Somebody else's refresh landed while this was in the air. There is
           nothing to ask for; go again with what is already in hand. */
        netSend1(method, path, body, SESS.at, ok, bad, up, false);
        return;
      }
      netFresh(function(got){
        if(!got){ bad(d, 401, netTag(path)+' 401'); return; }
        netSend1(method, path, body, SESS.at, ok, bad, up, false);
      });
      return;
    }
    bad(d, x.status, netTag(path)+' '+x.status);
  };
  x.onerror=function(){ netOff(x); bad(null, 0, netTag(path)+' 0'); };
  netOn(x);
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
   ordinary road. `∅` is the fourth: the request went, the server answered,
   and it took nothing away -- netDrop() below is the one thing that says it.
   www/backup.js's BK.how and www/share.js's SHARE.how are the
   same instrument, put in for the same reason and on the same day's evidence:
   一枚のスクリーンショットで原因が落ちてくる。 */
function netTag(path){
  var p=String(path||'').split('?')[0].split('/');
  return p[p.length-1] || 'server';
}
function netWhy(d, status, mark){
  /* 消せなかった。答えは返ってきていて、行は一つも消えていない ── 通信が
     落ちた話ではないので `net.offline` ではないし、状態のどれでもない。
     `−` や `≠` と同じく印で分ける。出すのは netDrop() と netLangDrop() で、
     どちらの話かは印の頭に書いてある ── 「投稿」と「言語」は別の文。 */
  if(String(mark||'').indexOf('∅')>=0)
    return String(mark).indexOf('language')===0? t('lang.del.no') : t('post.del.no');
  if(!status) return t('net.offline') + (mark? ' ('+mark+')' : '');
  var m=(d && (d.msg || d.message || d.error_description || d.error)) || '';
  if(status===400 && /invalid login/i.test(m)) return t('net.badlogin');
  if(status===400 && /already registered/i.test(m)) return t('net.taken');
  /* 401 and 403 were one sentence, and it was the login screen's -- wrong
     address or password -- said to somebody who has typed neither. They are
     two different things and neither of them is a typo.

     401 is the session. Every request sent with this person's own token
     refreshes and goes again on a 401 (netSend1 above), so what reaches here
     is a 401 the refresh could not mend -- signed out on another device, the
     account deleted, the account frozen. There is nothing to correct; there
     is only signing in again, and that is what it says now.

     403 is permission, and it is not about the session at all: a row policy
     in schema.sql refusing a write that the token is perfectly good for.
     Telling somebody their password is wrong for that is the same fault one
     line down. It falls to the general sentence rather than to a new one --
     a wording of its own is the owner's and has not been asked for. */
  if(status===401) return t('net.session');
  if(status===403) return t('net.failed');
  if(status===422 && /password/i.test(m)) return t('net.weak');
  if(status===429) return t('net.toomany');
  /* profile.handle is unique in the schema, so this is the server settling a
     race the check a moment ago could not see. */
  if(status===409) return t('net.handle.taken');
  /* staff_add() in supabase/schema.sql, asked for somebody nobody is. It used
     to change no row and say so to nobody, so the screen emptied its field on
     a name that had gone nowhere -- 「勝手に＠の中が消える。追加されてない」
     OWNER 2026-09-05. The message is the schema's own words and is matched the
     way the two above are matched. */
  if(status===400 && /no such handle/i.test(m)) return t('net.nohandle');
  return m || t('net.failed');
}
/* ---- 通信が落ちたら、何も進まない --------------------------------------------
   「通信エラーなら進むわけねえだろ全部」
   「そもそも通信は最初に一回とかプルトゥーリフレッシュした時でしょ？
     保存とか違う画面いく時にエラーが起きたらその画面表示ってわかる？」
   「そもそも通信エラーならそこにはいけないはずでしょ。
     途中でエラーになった場合は全部ポップで良くない？
     いちいち直書きするからまた面倒なんだろエラーになったらエラー用のポップ出して再更新とかおさせればいいやんそれだけで1個作れば全部に使えるやん」
   OWNER 2026-09-05.

   ONE POPUP, AND IT IS THE ONLY THING A FAILED REQUEST DOES. Nothing is
   written to the phone, nothing on the screen advances, and the person is
   given the one way out there is: ask again.

   IT IS 四箇所 AND NOT 四十三画面. The server is reached at a launch, at a
   pull, at a save (a DELETE is a save -- there is no second kind), and on
   the way into a screen that has to fetch something only the server has.
   Walking the app touches nothing. So this is called from those roads and
   from nowhere else, and a screen has no sentence of its own about the
   signal.

   THE DECISION IS HERE AND IS NOT COPIED INTO THE FOUR. A pop is for a
   request that WENT OUT AND GOT NO ANSWER, which is what 通信エラー is.

     `−`  never sent at all -- netResume() on a phone with no session, and
        its siblings. There is nothing to ask again for.
     `≠`  the server answered 200 and it was not a session. It answered.
     any status  the server answered. A refresh token it no longer accepts
        is the session ENDING (netResume() above signs the phone out and
        draws), not a network that is down.

   THE PERSON SEES TWO THINGS AND NO THIRD. 「feed0ってなに？ 再接続か閉じる
   でしょ？」 OWNER 2026-09-05. netWhy() は印（`feed 0`）を付ける ── あれは
   スクリーンショット一枚で原因が落ちてくるための状態で、人に読ませるもので
   はない。ポップは `net.offline` の一文だけ。

   ONE POP, AND 再接続 ASKS AGAIN FOR EVERY ONE OF THEM. 「再接続したらどう
   なるの？」 OWNER 2026-09-05. ホームに入ると要求は四件出る。ポップを一つに
   するのは正しいが、最初の一件の道だけを覚えていたので、再接続で出て行くのは
   その一件だけだった ── 測ると `rpc/notices` が出て、その人が見ている
   タイムラインは取りに行かなかった。**どれが最初に落ちたかは、その人が何を
   見ているかと関係がない。**

   だから落ちた道はためる。ポップは一つ、再接続はためた全部。NET_AGAIN が
   その置き場で、押した瞬間に空になる ── 押していないものが次のポップに
   混ざらないように。

   閉じるは何もしない。要求は出ず、端末には何も書かれず、画面も動かない ──
   決定の一行がそれ。 */
var NET_AGAIN=[];
function netPop(d, s, m, again){
  var mark=String(m||''), i;
  if(s) return;
  if(mark.indexOf('−')>=0 || mark.indexOf('≠')>=0) return;
  if(again){
    for(i=0;i<NET_AGAIN.length;i++) if(NET_AGAIN[i]===again) break;
    if(i===NET_AGAIN.length) NET_AGAIN.push(again);
  }
  /* 落ちた。回っていたものは止まり、ポップが出る ── 二つが同時に出ている
     状態は無い。 */
  netSpin(false);
  if(popOn()) return;
  popAsk(t('net.offline'), netPopAgain, t('net.again'), t('pop.no'));
}
/* 再接続。ためた道を空にしてから走らせる ── 走らせている最中にまた落ちると
   netPop() がここへ積み直すので、先に空にしないと同じ道が二重になる。 */
function netPopAgain(){
  var go=NET_AGAIN, i;
  NET_AGAIN=[];
  /* ポップは popYes() が消してある。ここからは、答えが来るまでマークが回る
     ── 押した人が見ているのは「押したのに何も起きない画面」ではなく、
     「今きいているところ」。通らなければ netPop() がまたポップを出す。 */
  netSpin(true);
  for(i=0;i<go.length;i++) go[i]();
  /* 一件も出て行かなかったとき。ためた道が全部「送るものが無い」だったなら
     待つものは無いので、その場で止める ── 回り続ける方が嘘になる。 */
  if(!NET_OUT) netSpin(false);
}

/* ---- coming and going --------------------------------------------------- */
/* A session, put away. Everything that signs somebody in ends here, so there
   is one place that knows what a session is made of. */
function netTook(d){
  /* Both halves, because a session is both. netRead() two functions up has
     always refused a stored session with no refresh token (`if(s && s.rt)`),
     and netSignedIn() has always answered on `rt` -- so a reply carrying an
     access token and no refresh token was taken, stored, and then read as
     signed OUT by all 41 places that ask. The app said 「ログインしました」,
     obIn() went and fetched the profile with SESS.at in hand, and the next
     launch dropped the session without a word.

     That is the one shape of 「立っていないのに立ったように見えている」 this
     file can produce, and it produced it here rather than anywhere else
     because this is the only place SESS is ever written. A reply that is not
     a session is not a session: it is refused here, once, and every road in
     -- the mail door, the code, Apple and Google -- reports it the way
     it already reports a reply with no access token at all. */
  if(!d || !d.access_token || !d.refresh_token) return false;
  /* WHETHER THIS IS A SESSION ARRIVING OR THE ONE THAT IS ALREADY HERE.
     Read before SESS is written over, because that is the only moment it can
     be. Nothing is stored: it is a fact about the reply in hand. */
  var netCame=!(SESS && SESS.rt);
  SESS={ at:d.access_token, rt:d.refresh_token,
         uid:(d.user && d.user.id) || (SESS && SESS.uid) || '',
         /* Whether this one has a name on it, decided here because this is
            the one place that knows what a session is made of. A session
            already stored when this key arrived has no `anon` on it at all,
            which reads as false -- correct, because every account that
            existed before anonymous sign-in did was a real one. */
         anon:false };
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
  /* AND THE POSTS AND THE DRAFTS, for the same reason and by the same road.
     「アカウント新規作成してんのにまた前のアカウント残ってんだけど」 OWNER
     2026-09-03: a new account's own page was full of the last one's timeline,
     because `lingua.posts` is one key for the phone and `pfList()` picks your
     page out of it by a `mine` flag written by whoever was signed in then.
     www/post.js § postFor() parks and reads back; nothing is deleted. */
  if(typeof postFor==='function') postFor(SESS.uid);
  /* AND WHAT THIS ACCOUNT PAID FOR, which is not what the PHONE paid for.
     「Xは違うアカウントだと課金も引き継がれない」 OWNER 2026-09-02. Here for
     the same reason meFor() is here: this is the one place that knows a
     session arrived, and netRead() above is the other moment a uid becomes
     known. planFor() in www/core.js says what the three answers are.

     No render() of its own, the same as meFor(): every road into this
     function draws afterwards -- obIn() on the way in, bootSession() on a
     refresh -- and netPlanSync(), a moment later, renders when the account's
     answer moves the plan again. */
  planFor(SESS.uid);
  /* AND THE LANGUAGE ON SCREEN. `meFor()` above swapped who the phone says
     it is; this swaps what it is showing. Twice, and the two are different
     moments -- see langForAcct() in www/core.js. Now, without minting,
     because this account's languages may be on their way down; and again
     when they have arrived or failed to, where a phone holding nothing of
     theirs gets a fresh language.

     AND THE SECOND MOMENT WAITS ON THE ONE ROAD THAT BRINGS THEM DOWN.
     There were TWO, and they raced: netLangBack() straight from here, and
     netLangsDown() through pullBoot() below -- the same question
     (`language?owner=eq.<me>`), and both of them MAKING the index row.
     netLangBack1() asked for the slices first and made its entry inside the
     answer, keyed by the `sid`; netLangsWalk() makes its entry first, keyed
     by a fresh langMint() id -- so `LANGS[sid]` was still undefined when the
     first answer came back and the same language got a SECOND row. Nothing
     threw; it was found by somebody opening the switcher and seeing their
     language twice. 「起動で同じ言語が切り替えに 2 行並ぶ」「ならばないように
     して」 OWNER 2026-09-09.

     The second road is DELETED rather than stopped by a condition (CLAUDE.md
     § Simple), so `mylangs` is the whole of it -- www/sns.js § askLangs, on
     PULL_OPEN, fired by pullBoot() at the foot of this function. pullWait()
     is www/boot.js's own idiom for 「when the languages have come down」 and
     it runs its waiter whether the answer arrived or was refused, which is
     exactly what netLangBack() did with `done(false)`. */
  /* SEND WHAT IS ON THIS PHONE, AND ONLY THEN ASK WHAT THERE IS.
     -------------------------------------------------------------------------
     「印も何も全部保存とかサーバーでやってるんじゃないの？ 全部サーバーで
     やってんじゃねえの？」 OWNER 2026-09-11, and the decision it settled --
     docs/FEATURE_RULES.md § 端末は何も決めない.

     TWO THINGS HAPPEN WHEN A SESSION ARRIVES and they are not the same
     question: what is on this phone has to reach the server, and what the
     account HAS has to come down. They used to run side by side, and the
     order they came out in decided the answer: measured on 2026-09-11
     (docs/scope/r24-lang.md) the walk's language had not been sent when the
     coming-down road asked whether this account had one, the answer was no,
     and the door made a SECOND language -- the typed name on the empty one
     and the drawn letters on the nameless one. hunt 道1・道10・道11 are all
     that one split.

     So it is one road with the sending first. Nothing is stopped by a
     condition and nothing is asked twice: netLangSync() sends what is here,
     and only when it has answered does `mylangs` get asked and langForAcct()
     decide where to stand. By then the walk's language is a row with this
     account's name on it, and the server's list has it.

     netLangSync() decides everything itself -- nothing without a session,
     nothing without a language, safe to call twice -- so this is a call and
     not a condition. www/onboard.js § obFinish used to make the same call one
     step later; that one is gone, because this is the same road and it is
     the earlier of the two.

     THERE IS NO 「WHILE WE WAIT」 BRANCH ANY MORE. `langForAcct(false)` stood
     here to point the screen away from the last account's language before the
     list arrived, and it was the phone deciding: with the sending first, the
     only thing between a session arriving and the list coming down is the
     round mark www/glyph.js already draws for LANG_WAIT.

     AND IT IS THE DOOR AND ONLY THE DOOR. `netCame` above is 「there was no
     session here a moment ago」, which is what coming through the door IS: a
     launch resumes a session this phone already had (netRead() put it back
     before this), and the hour running out renews the one that is running. A
     launch sends on its own road, after the list -- www/boot.js § bootSession,
     `pullWait('mylangs', netLangSync)` -- and what moves while the app is open
     goes up on netSaveUp()'s. This is the moment neither of those covers, and
     it is the one the walk needs.

     Without it the hour running out re-sent all twelve slices of every
     language: tools/token-check.mjs counted 7 writes where the claim is 2. */
  /* AND WHAT THIS ACCOUNT PAYS, ASKED HERE TOO. The launch asks
     (storeSync(), www/boot.js § bootSession) and that used to be enough,
     because the plan was a word on the handset and whoever signed in
     inherited it. It is not: the plan is `verify-plan`'s answer about the
     account that is signed in, held in memory (www/core.js § PLAN), and
     planFor() above has just forgotten the one before it. Without this,
     somebody signing in mid-session has no plan until they close the app --
     every ceiling says 「接続できません」 and the free alphabet is not topped
     up. 「段は起動とサインインで訊く」 OWNER 2026-09-11.

     storeSync() and not a call of its own: it is the one road that sends this
     device's receipts and takes the plan back, and a second way to ask would
     be a second answer. It decides everything itself -- no App Store is an
     empty list, which asks the server exactly what a browser asks. */
  if(netCame && typeof storeSync==='function') storeSync();
  if(netCame){
    LANG_WAIT=true;
    netLangSync(function(){
      if(typeof pullWait==='function') pullWait('mylangs', function(){
        langForAcct(); render();
      });
    });
  }
  /* AND EVERYTHING THE APP READS OFF THE SERVER, ASKED HERE, ONCE.
     「最初の起動の一回の更新で全部取得してその後それぞれをプルトゥーリフレッシュ
     とかで更新して取得するじゃダメなの？」 OWNER 2026-09-05.

     The day's sentence, both timelines, the notices, your two follow lists,
     the block list, the words you keep, the words you have typed and the
     drafts. WHAT is asked for is www/sns.js § WHAT AN OPEN ASKS FOR and is
     not listed twice; this is the moment.

     Here for the reason meFor(), planFor() and langForAcct() are here: this
     is the one place that knows a session ARRIVED, and every one of these is
     asked as somebody. A launch comes through netResume(); somebody signing
     in an hour later comes through the door; both are a session beginning and
     both fill the app in the same breath.

     A token refresh comes through here too and asks for nothing: pullNeed()
     is refused the moment a thing has its answer, which is the same guard
     netLangBack() keeps for itself one line up. */
  /* AND WHETHER THIS ACCOUNT ANSWERS THE REPORTS, AND WHETHER IT DECIDES WHO
     DOES. Here for the reason meFor(), planFor() and langForAcct() are here:
     this is the one place that knows a session ARRIVED.

     IT WAS IN www/boot.js AND ONLY THERE -- one call, on the launch, inside
     netResume()'s answer. So a launch made SIGNED OUT never asked, and the
     door a person then came in through never asked either: signing in as
     @lingua after that left NET_ADMIN false, and seven taps on the settings
     heading opened nothing at all. 「設定7回タップしても管理画面開かんくなった」
     OWNER 2026-09-08, 実機 143, having signed out and back in that day.

     Measured before it was believed: signed in through the launch it answered
     `admin`; signed out, relaunched, then in through the door it stayed on
     `settings`.

     A token refresh comes through here too and asks for nothing -- netStaff()
     keeps the same guard netLangBack() one line up does, and netOut() is what
     clears it, which is the half that was missing. */
  netStaff(function(yes){ if(yes) render(); });
  if(typeof pullBoot==='function') pullBoot();
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

   AND THE TWO QUESTIONS ARE ONE NOW. 「二種類になる意味も分からないけど」 --
   the decision said 「一本になる」 and the phone kept two: netSignedIn() and a
   netMember() that also asked whether the token was anonymous. With no
   anonymous accounts the second half could never be true, so it was a true
   question with nothing left to answer it yes, asked in twenty-eight places.

   netMember() and netAnonTok() are deleted and every caller asks
   netSignedIn(). `SESS.anon` is written `false` and read by nothing here --
   it stays in the stored session because a phone holding one from before
   today would otherwise come back with a field missing, and because the
   server is still what decides: is_member() in supabase/schema.sql reads
   `is_anonymous` off the token, whatever this file believes. */
function netOut(){
  SESS=null; netSave();
  /* Signed out is nobody's phone, so the name comes off the screen the same
     moment the session does. Parked, not erased -- signing back in brings it
     back, and wipeAll() has already blanked ME by the time it reaches here,
     so nothing is written back out over a deleted account. */
  meFor('');
  /* And the timeline this phone was holding goes with the name. Parked under
     the account that had it, not thrown away. */
  if(typeof postFor==='function') postFor('');
  /* And every answer the server gave this account (www/sns.js § pullForget),
     including the block list above -- they are that account's, and the next
     person to sign in on this phone must ask for their own. */
  netBlockedDrop();
  if(typeof pullForget==='function') pullForget();
  /* AND WHO FOLLOWS WHOM, WHICH SINCE 2026-09-09 INCLUDES THIS ACCOUNT'S OWN
     TWO LISTS (www/me.js § folForget). They are keyed by handle and a handle
     is not an account, so leaving them would draw the last person's following
     list under the next person's name. */
  if(typeof folForget==='function') folForget();
  /* And whether the account that has just gone had a profile row. It is that
     account's answer and the next person must not be read by it. */
  if(typeof meRowForget==='function') meRowForget();
  /* AND WHAT THAT ACCOUNT PAID. `verify-plan` answered it about them, and a
     phone with nobody on it holding a plan is 「the plan is the handset's」
     said in one line (www/core.js § PLAN). 「まだ訊けていない」 is what a
     signed-out phone knows, and the next person asks for their own. */
  planForget();
  /* AND WHETHER THIS ACCOUNT ANSWERS THE REPORTS, WHICH IS THE SAME SENTENCE.
     NET_STAFF, NET_ADMIN and NET_BANNED are three facts about the account that
     has just gone, and nothing here put them down -- so the seven taps on the
     settings heading stayed armed for whoever signed in next.
     netStaffForget() is the one place that says so. */
  netStaffForget();
  /* THE LANGUAGE IS NOT TOUCHED HERE, AND THAT IS THE SAFE DIRECTION.
     A slice is in memory now (CLAUDE.md rule 22), so it was tempting to empty
     the store on the way out -- 「what this phone is holding is the signed-in
     account's」. It would destroy a language that has never reached the
     server: somebody who made one with no signal and signed out would have
     nothing left anywhere, and 「人が作ったものは消さない」 is the rule that
     outranks tidiness. Nothing leaks by leaving it: `LANGS[id].uid` is what
     every list asks, so another account's language is filtered out of the
     next person's screens exactly as it was before today. */
  /* AND THE SCREEN, HERE, BECAUSE THIS IS WHERE A SESSION ENDS.
     「2端末で同じアカウントにログインしてても、片方が消したら、もう片方も確実に
     消えるように。ログアウトさせて、新しいアカウント作ったら、もうひと端末も
     勝手にろぐいんされていたから。」 OWNER 2026-09-03.

     Deleting an account on one phone kills the refresh token the other one is
     holding, netResume() answers that by calling this -- and the other phone
     went on showing the account's app, because nothing here drew and the
     failing half of netResume() in www/boot.js is an empty function. The
     session was gone and the screen said otherwise, which is what the owner
     was looking at.

     It used to be 「every road into this function draws afterwards」, and that
     was true of the two roads a person takes and of neither of the two the
     server takes -- the launch that finds a dead token, and the 401 that the
     refresh could not mend, both of which end in a `bad` that does nothing.
     A rule kept by four callers remembering is not one mechanism, so the draw
     is here: signing out draws BECAUSE the session ended, whichever of the
     four ended it. setSignOutGo() in www/settings.js had the only other copy
     and it is gone.

     netTook() on the way in is deliberately not the mirror of this: arriving
     is followed by a screen that is chosen -- obIn() picks it -- and leaving
     is not, because there is only one thing to show somebody who is not
     signed in.

     AND THE DOOR OPENS ON ITS OWN FACE. OBM is what the door is showing --
     the address, the six digits, the new password -- and it is a buffer that
     outlives the screen, so a session ending in the middle of one of those
     roads left the next door standing on it. Pressing 「パスワードを忘れた」
     and then backing out and signing out drew the door in its `forgot` face:
     appIs() answered 'door' correctly and the door drew what OBM still said.

     Here, because this is where a session ends -- the same sentence the
     render() above is: it is the four roads out, not the one a person takes.
     obDoor() writes these three on the way IN to the door and that is the
     other end of the same walk; what was missing is the way out. */
  OBM.mode='in'; OBM.msg=''; OBM.busy=false;
  render();
}
/* AN ACCOUNT ON ITS WAY OUT, WRITTEN ON THE SESSION.
   「そもそもこのアプリはオンラインが基本なんだからね？SNSなんだから、削除し
   切ってないと消えない。」 OWNER 2026-09-03.

   Deleting an account is one thing that happens in two places -- the server's
   row and this phone's copy -- and the server is the record, so the copy goes
   only after the row has. **This is written after the row is gone, never
   before the ask** 「通信エラーなら進むわけねえだろ全部」 OWNER 2026-09-05: it
   is what stands between `account_delete()` answering and wipeHere() getting
   through the phone, so an app closed in that moment comes back and finishes.
   A request that fell over leaves nothing here at all -- the account is still
   there and there is nothing to finish. www/settings.js § wipeAllGo() is the
   press and www/boot.js § bootSession() is the launch.

   It is a field of `lingua.sess` rather than a key of its own, and that is
   the whole answer to 「which account is this」 (CLAUDE.md rule 22): the mark
   is about the account this phone is signed in as, it is worth nothing
   without the token that proves who that is, and it goes when the token does.
   A key beside the session would be a mark that could outlive the account it
   names and be read against the next one. */
function netEnding(){
  if(!SESS) return false;
  SESS.end=1; netSave();
  return true;
}
function netEnded(){ return !!(SESS && SESS.end); }
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
/* SIX DIGITS TO AN ADDRESS, AND THE ADDRESS IS THE ACCOUNT.
   -------------------------------------------------------------------------
   「1アドレス1アカウント」「Googleでも同じアカウントならメアドで入っても同じ
   アカウントでログインさせればいいやろ」 OWNER 2026-09-02.

   This replaces /auth/v1/signup on the account-making face. The two are not
   two ways of doing one thing:

     signup  makes a NEW user. Always. Supabase has no switch that says 「and
             if this address already has an account, use that one」, so
             somebody who came in with Google and later typed the same address
             here got a second account, a code and all -- which the owner
             found by doing it.
     otp     looks the address up. There already, and this signs them into it;
             not there, and `create_user` makes it. One road, one account,
             whichever way they first came in.

   OAuth to OAuth was never the broken direction: Supabase links a Google and
   an Apple identity carrying the same VERIFIED address by itself. The mail
   road was the one that could not, and this is it.

   It is also what the owner asked for on the same day in a different sentence
   -- 「メアドだけ、アカウント作成で」 -- and the two turn out to be one
   change: with no password to set, there is nothing for signup to be for. */
/* WHETHER AN ADDRESS ALREADY HAS AN ACCOUNT.
   「アカウントのあるアドレスで新規作成はいらんやろ」 OWNER 2026-09-03.

   Neither /auth/v1/otp nor /auth/v1/recover will say -- both answer 200
   whichever it is, so that nobody can stand outside and ask which addresses
   are registered. So the door could not tell, and both screens walked on: the
   making face made a second way into an account that already existed, and the
   reset face sent somebody to wait for a code that was never sent.

   supabase/schema.sql § email_taken() is what answers, and the comment there
   says what it costs. Signed out, so the publishable key is what carries it. */
function netMailTaken(email, ok, bad){
  netSend('POST', '/rest/v1/rpc/email_taken', {p:String(email||'')}, '',
          function(d){ ok(d===true || d==='true'); }, bad);
}
function netMailOtp(email, ok, bad){
  netPost('/auth/v1/otp', {email:email, create_user:true}, null, ok, bad);
}
function netSignIn(email, pass, ok, bad){
  netPost('/auth/v1/token?grant_type=password',
          {email:email, password:pass}, null,
          function(d){ if(netTook(d)) ok(d); else bad(d, 0, 'token ≠'); }, bad);
}
/* The code out of the mail. A link would have to land somewhere, and
   there is nowhere for it to land: this is a Capacitor app with no web page
   behind it, so the default confirmation URL opens nothing on the tester's
   phone. A code goes back to the screen that asked for it.

   HOW MANY DIGITS IS NOT ASKED HERE AND IS NOT ASKED ANYWHERE IN www/.
   「8桁で60秒再送信」 OWNER 2026-09-03. Whatever was typed goes up as it was
   typed, and Supabase's own OTP Length setting is what decides -- one place,
   and the app follows it without being told. Counting here as well would be
   the same question answered twice, and the day the setting moved the app
   would be the half that refused. supabase/setup.md § 桁数は 8 is the
   setting; www/onboard.js holds the sixty seconds, which IS the app's. */
/* `email` rather than `signup`, because the digits come out of netMailOtp()
   now and not out of a signup. It is the type that covers both, so a code
   already in somebody's mail from the old road still works. */
function netVerify(email, code, ok, bad){
  netPost('/auth/v1/verify', {type:'email', email:email, token:code}, null,
          function(d){ if(netTook(d)) ok(d); else bad(d, 0, 'token ≠'); }, bad);
}
function netRecover(email, ok, bad){
  netPost('/auth/v1/recover', {email:email}, null, ok, bad);
}
/* The code out of the reset mail, and then the new password.
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
  netGet('/rest/v1/profile?select=handle,display,bio,link,loc,av&limit=1&id=eq.'+
         encodeURIComponent(SESS.uid),
         function(d){
           var p=d && d.length? d[0] : null;
           /* AND WHETHER THIS ACCOUNT HAS BEEN HERE AT ALL, which is what a
              row IS (www/me.js § ME_ROW). It was `SET.done` on the handset
              until 2026-09-09, and a flag about the phone cannot answer a
              question about the account. */
           meRowGot(!!p);
           /* The face, read back same as the name and the handle -- signing
              in on a second phone used to leave ME.av empty until a letter
              was drawn or redrawn here, so the account's own icon never
              followed it over. avSent is set to match so netAvSync() does
              not turn straight round and PATCH back what it was just given. */
           if(p && p.av!==undefined){
             ME.av=p.av; ME.avSent=JSON.stringify(p.av||null); saveMe();
           }
           ok(p);
         }, bad);
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
  if(!netSignedIn()){ bad(null, 0, 'mkprofile −'); return; }
  var av=postAvatar(), row={id:SESS.uid, av:av},
      typed={name:String(name||''), handle:String(h||'')}, i, k;
  /* THE ROW IS MADE OF WHAT § PROF_MINE SAYS A PROFILE IS, and that list is
     read here rather than written out again. It was written out -- handle,
     display, bio, link, loc, one literal each -- so 「which columns is a
     person's profile」 had two answers, and the day the save road grew the
     name and the @ (2026-09-11) only one of the two had them. `av` is not on
     it: nobody types a face, and the road that keeps it level is netAvSync()
     below. */
  for(i=0;i<PROF_MINE.length;i++){
    k=PROF_MINE[i][0];
    row[PROF_MINE[i][1]]=Object.prototype.hasOwnProperty.call(typed, k)?
      typed[k] : String(ME[k]||'');
  }
  netPost('/rest/v1/profile', row, SESS.at,
          /* what was sent, so netAvSync() does not send it again on the
             next launch for a face that has not moved */
          function(d){
            ME.avSent=JSON.stringify(av||null); saveMe();
            /* AND THE ROW EXISTS NOW, WHICH NOTHING WROTE DOWN.
               `meRowHas()` (www/me.js § ME_ROW) is 「does this account have a
               profile row」 and appIs() (www/shell.js) answers 'door' while it
               is false -- so the last 「次へ」 of the walk made the account,
               made the row, said 「ログインしました」 and then drew the
               sign-in screen over the app. Measured 2026-09-11 (hunt #1):
               SET.walked true, route 'profile', netSignedIn() true,
               meRowHas() FALSE. It came right on the next launch, which is
               why it happened once and looked like a flicker.
               Only netMyProfile() and netProfSync() ever wrote that answer,
               and both of them ASK; this is the one place that MAKES the row,
               so it is the one place that knows without asking. */
            if(typeof meRowGot==='function') meRowGot(true);
            ok(d);
          },
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
/* What a person writes about themselves, kept the same on both sides.
   「そもそも端末に保存するもんはないぞほとんど」 OWNER 2026-09-01 -- the
   server is the record and the phone is the copy that works with no signal.

   THREE FIELDS AND NOT ONE, and that is the whole of the change here. This
   was netBioSync() and carried `bio` alone, so the line somebody wrote about
   themselves travelled and the two beside it -- where they are and their
   address on the rest of the internet -- were written on the phone, kept on
   the phone, and gone the day the phone was. 「プロフィールにリンクと場所が
   出ない」 OWNER 2026-09-08, 実機 143.

   PROF_MINE names them, once, and the walk below is the same walk `bio` was
   already getting. A fourth field is a name on that list and nothing else --
   which is the half that was missing: the old function said `bio` in five
   places, so adding a field meant finding all five.

   AND IT IS FIVE, AND IT NAMES THE COLUMN AS WELL AS THE FIELD.
   -------------------------------------------------------------------------
   The list held three and the editor walked it to decide what to send, so a
   name and a handle somebody typed reached this phone and stopped there:
   measured on 2026-09-11 (docs/scope/r24-lang.md, hunt 道7) the whole of a
   save was `PATCH /rest/v1/profile {"bio":"..."}` while the screen said the
   new name and the new @. Nothing threw, because the send was not empty.

   The two that were missing are the two whose column is NOT called what the
   phone calls them -- `name` is `profile.display` -- and that is why they
   could not simply be added: a list of field names cannot say that. So each
   entry is a pair, `[what ME calls it, what the column is called]`, and both
   the road up (www/me.js § meProfPut) and the road down below read the same
   pair. A sixth field is one line here and nothing else, still.

   `handle` travels like the rest and the server is what refuses it: the
   fortnight and @lingua are `profile_rename()` in supabase/schema.sql, which
   answers with an exception, which arrives here as a refusal like any other.

   It ASKS before it writes, where netAvSync() below compares against a mark
   it keeps locally (`ME.avSent`). Two reasons, and the second is the one that
   decided it: a mark would be a new field on ME, and the shape of ME is
   www/me.js's -- meBlank() and meFrom() build it column by column, so a key
   this file invented would be dropped on the next read and the mark would
   never match. Asking the server costs one small request on a launch and
   cannot go stale.

   THERE IS NO SIDE THAT WINS ANY MORE, BECAUSE THERE IS ONE SIDE.
   「端末に残すものないんですけど。サーバーで同じ機能になるように代替して」
   OWNER 2026-09-08.

   This asked each field of both and, where the two differed, **sent the
   phone's up** -- 「the phone's own is kept」. Two phones with two different
   lines about the same person meant the one that launched last wrote over
   the other, silently, with nobody able to say which had won. It was rule
   22's own exception standing in the tree.

   `profile.bio`, `profile.link` and `profile.loc` are the answer. This road
   is one way now: what the row says is what ME holds. Nothing is destroyed by
   that -- the editor (www/me.js § meProfPut) does not write ME until the
   server has taken the change, so there is never a line here that the server
   has not got.

   Fired and not waited for. Nothing on screen depends on it. */
var PROF_MINE=[['name','display'], ['handle','handle'], ['bio','bio'],
               ['link','link'], ['loc','loc']];
/* The columns, for a `select` and for nothing else. */
function profCols(){
  var out=[], i;
  for(i=0;i<PROF_MINE.length;i++) out.push(PROF_MINE[i][1]);
  return out.join(',');
}
function netProfSync(){
  if(!netSignedIn() || !SESS || !SESS.uid) return;
  netGet('/rest/v1/profile?select='+profCols()+'&limit=1&id=eq.'+
         encodeURIComponent(SESS.uid),
    function(d){
      var row=(d && d.length)? (d[0]||{}) : {}, drew=false, i, k, there;
      /* AND THE SAME ANSWER THIS ASK ALREADY CARRIES: a row means this
         account has been through the walk (www/me.js § ME_ROW). */
      meRowGot(!!(d && d.length));
      /* NO ROW IS NOT AN EMPTY PROFILE. An account whose row has not been
         made yet -- the door's last step is still in front of them -- is not
         somebody whose line about themselves is blank, and writing three
         empty strings over the copy would be this road taking something away
         rather than bringing it. */
      if(!(d && d.length)) return;
      for(i=0;i<PROF_MINE.length;i++){
        k=PROF_MINE[i][0];
        there=String(row[PROF_MINE[i][1]]||'');
        if(there===String(ME[k]||'')) continue;
        ME[k]=there; drew=true;
      }
      if(drew){ saveMe(); render(); }
    }, function(){});
}
/* AND THE ONE PLACE THOSE THREE ARE WRITTEN. The editor waits for it: what
   somebody typed reaches ME when the server has taken it and not before
   (www/me.js § meProfPut), which is the same sentence as the 公開 switch and
   the heart. 「保存するタイミングでエラーが起きるなら、保存されないし」
   OWNER 2026-09-05. */
function netProfPut(fields, ok, bad){
  if(!netSignedIn() || !SESS || !SESS.uid){ bad(null, 0, 'prof \u2212'); return; }
  netSend('PATCH', '/rest/v1/profile?id=eq.'+encodeURIComponent(SESS.uid),
          fields, SESS.at, ok, bad);
}
/* HOW THIS ACCOUNT HAS THE APP SET UP, BOTH WAYS.
   -------------------------------------------------------------------------
   「端末ごとにやることなんてねえよ」「アカウントごとってずっと言ってるよな？」
   OWNER 2026-09-03.

   `SET_PREFS` in www/core.js is the list -- the theme, the interface
   language, and the three switches about the drawn letters -- and
   `profile.prefs` is one jsonb column holding exactly it. This file carries
   the object and looks inside it for nothing.

   DOWN AT A SIGN-IN AND UP WHEN ONE MOVES. A setting has to move on the
   screen the moment it is pressed -- a theme that waits for a server is a
   screen somebody presses twice -- so the press writes the copy and sends,
   and the ROW is what the next sign-in reads. That is netAvSync()'s shape and
   not the 公開 switch's, and the difference is what is at stake: nothing
   anybody made is here, and the worst a send that did not land can cost is
   the theme being what it was on the phone that last spoke.

   NO ROW IS NOT AN EMPTY SETUP -- the same sentence netProfSync() carries one
   function up. An account whose row has not been made yet has not chosen
   anything, and writing five defaults over the copy would be this road taking
   something away rather than bringing it. */
function netPrefsPull(){
  if(!netSignedIn() || !SESS || !SESS.uid) return;
  netGet('/rest/v1/profile?select=prefs&limit=1&id=eq.'+
         encodeURIComponent(SESS.uid),
    function(d){
      var row=(d && d.length)? (d[0]||{}) : null, p, i, k, drew=false;
      if(!row) return;
      p=row.prefs;
      if(!p || typeof p!=='object') return;
      for(i=0;i<SET_PREFS.length;i++){
        k=SET_PREFS[i];
        if(!Object.prototype.hasOwnProperty.call(p, k)) continue;
        if(SET[k]===p[k]) continue;
        SET[k]=p[k]; drew=true;
      }
      if(drew){
        setKeep();
        /* The theme is painted rather than drawn: applyTheme() writes the
           attribute the stylesheet's two blocks hang off, and render() alone
           would leave the page in the last one. */
        if(typeof applyTheme==='function') applyTheme();
        if(typeof installScriptFont==='function') installScriptFont();
        render();
      }
    }, function(){});
}
function netPrefsPut(){
  if(!netSignedIn() || !SESS || !SESS.uid) return;
  var o={}, i, k;
  for(i=0;i<SET_PREFS.length;i++){
    k=SET_PREFS[i];
    if(SET[k]!==undefined) o[k]=SET[k];
  }
  netSend('PATCH', '/rest/v1/profile?id=eq.'+encodeURIComponent(SESS.uid),
          {prefs:o}, SESS.at, function(){}, function(){});
}
function netAvSync(){
  if(!netSignedIn() || !SESS || !SESS.uid) return;
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

/* ---- what this account has paid for -------------------------------------
   「課金とアカウントとキーボードはアカウントに結びつく。じゃないとアカウント
     変えたら無限に言語作れるやん」 OWNER 2026-09-01.
   「アカウントごとなんだから、違うアカウントで復元できるのおかしいだろ。
     検証して」 OWNER 2026-09-06.
   「だから端末でやるわけねえだろ」 OWNER 2026-09-03.

   ONE ROAD, AND IT GOES THE OTHER WAY NOW.

   There were two functions here until 2026-09-06. `netPlanUp()` POSTed this
   phone's idea of its own plan into `/rest/v1/plan`, and `netPlanSync()` read
   the row back and took the higher of the two rungs. Both are gone, and the
   table they wrote is read-only through the API (supabase/schema.sql).

   The reason is one line of that file's own comment: 「anybody who can send
   this database a request can set their OWN plan to 'pro'」. The phone wrote
   the row and the phone is the person.

   What goes up now is not a plan. It is the **signed transactions** the App
   Store gave this device -- `jwsRepresentation`, exactly as Apple wrote them
   -- and what comes back is the plan, worked out by
   supabase/functions/verify-plan: it reads the signature against Apple's
   root, refuses a purchase whose `appAccountToken` is another account's, and
   decides the rung from every transaction it has ever verified for this uid.

   THE READ IS THE SAME ROAD. There is no second call that just asks what the
   account pays: sending an empty list is that question, because the answer is
   worked out from what the server holds rather than from what arrived. That
   is what a launch in a browser does, and what a launch does when the App
   Store could not be asked. One mechanism, and the lapse comes down it too.

   A failure says nothing and changes nothing. A phone with no signal has the
   plan it had, which is the one direction it is safe to be wrong in
   (docs/PAID_FEATURES.md), and the next launch asks again. */
function netPlanVerify(list, then){
  var done=then || function(){};
  if(!netSignedIn()){ done('', null); return; }
  netSend('POST', '/functions/v1/verify-plan', {jws:(list || [])}, SESS.at,
    function(d){
      var p=(d && d.plan)? String(d.plan) : '';
      /* An answer with no plan word in it is an answer that was not
         understood, and that is not the same state as `free`. Nothing is
         written for it. */
      if(!p){ done('', null); return; }
      /* The whole answer as well as the word: what the server REFUSED is a
         count this phone cannot work out for itself -- a receipt Apple signed
         for another account is refused there and nowhere else -- and 「復元
         するものはありません」 has four causes now. www/store.js § storeWhyNone
         is what puts it where a person can photograph it. */
      done(planTook(p), d);
    },
    function(){ done('', null); });
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

   THE LANGUAGE'S ID IS THE SERVER'S ID (www/core.js § langMint). There is no
   second number and nothing to hold two of them together. */
/* WHOSE LANGUAGE THIS IS, ASKED BEFORE IT IS PUT ANYWHERE -- AND WHICH ONE.
   -------------------------------------------------------------------------
   Two bugs meet in this one function and both fixes are here, because they
   are about the same line: the row a language gets on the server.

   **Whose.** 「違うアカウントでログインしてんのに前のやつ出てくるんだけど？
   前のアカウント消えたんだが？」 OWNER 2026-08-31. `lingua.langs` and
   `lingua.<id>.*` are the PHONE's -- `LANGS[id]` was `{name, mine, sid}` and
   `mine` is about this phone, not about an account. So this took the language
   in front of it and made a row for whoever happened to be signed in. A signs
   out, B signs in, and the language A made -- still on the phone, because
   nothing here deletes -- went up as B's. Not a copy of it: the id the phone
   then remembers is B's row, so from that moment on it was B's. Nothing
   threw, and A's own copy on the server was untouched and unreachable.

   `uid` on the entry is the account it belongs to, and it is asked here
   because here is the only place a language meets a session. Four states,
   answered separately, because guessing at the fourth is what the bug was:

     it is this account's         -> go
     it is another account's      -> refused, and nothing is sent
     nothing said, been up        -> ASK THE SERVER. `language_read` in
                                     supabase/schema.sql answers with the row
                                     only for its owner (or if it is
                                     published), so an empty answer is the
                                     server saying it is not yours. Nothing
                                     is guessed and nothing written until it
                                     has answered.
     nothing said, never been up  -> nothing on this phone says whose it is.
                                     It is adopted, which is what www/me.js
                                     does with an unclaimed copy and for the
                                     same reason -- and it is what the
                                     ONBOARDING needs: the walk makes a
                                     language before there is an account and
                                     obFinish() puts it up at the door.
                                     「オンボーディング→最後にログイン」

   THE FOURTH IS THE ONE THE OWNER HAS TO DECIDE, and it is in the report
   rather than settled here. A language made by A, never once uploaded, on a
   phone B then signs in to, is adopted by B -- because from storage alone
   there is nothing that tells it from the onboarding's. Every language made
   from today carries its `uid`, so the hole is exactly the languages that
   already exist on a phone today and have never been up.

   **Which.** It used to be whichever was OPEN. That was the whole of why a
   second language never reached the server: everything here asked about
   `langId`, so a person's other languages had no row, no `sid`, and were
   never sent. It takes the id now. The name comes off the index for a
   language that is not open -- `langName` is the open one's.

   And `mine===false` is refused outright: a language taken from somebody else
   is not this account's to put anywhere. `syMerge` adds both sides, so one
   trip through here would add something to a トキポナ nobody may edit
   (OWNER 2026-09-01, and docs/DATA_MODEL.md § A language that is only read).

   Nothing here deletes, hides or rewrites a language. A refusal leaves it
   exactly where it is, on the phone, whole. */
function netLangRow(id, ok, bad){
  var key=String(id||''), L=LANGS[key], own, me, nm;
  /* A language this account is only READING has a row already and it is
     somebody else's -- langWhose() (www/core.js) is what says so, off
     `language.owner` and `language_take` rather than off `LANGS[id].mine`, a
     boolean this phone wrote. LW_WAIT refuses for the same reason every writer does:
     nobody has said whose it is, and an insert would be this phone deciding. */
  if(!netSignedIn() || !L || langWhose(key)===LW_READ){ bad(null, 0, 'langrow −'); return; }
  /* WHO WROTE IT, off `language.owner` and not off this phone's index
     (www/core.js § LOWN). `LANGS[id].uid` answered two questions with one
     field -- who made it, and on a downloaded language who TOOK it -- and the
     two come apart exactly where a language moves between people. */
  own=langOwnOf(key);
  me=String(SESS.uid||'');
  /* Somebody else's. Not sent, not read, not minted -- and said with its own
     mark, so 「接続できません」 does not stand in for it (case 6 of
     tools/acct-check.mjs is the whole argument for marks). */
  if(own && own!==me){ bad(null, 0, 'langrow ≠'); return; }
  /* THE ROW IS ALREADY THERE -- www/core.js § LROW, which is what is left of
     `sid` once the number goes. */
  if(langRowUp(key)){
    if(own){ ok(key); return; }
    /* Up before a language recorded whose it was. The server settles it. */
    netGet('/rest/v1/language?select=id&id=eq.'+encodeURIComponent(key),
      function(d){
        if(!(d && d.length)){ bad(null, 0, 'langrow ≠'); return; }
        langOwnGot(key, me);
        ok(key);
      }, bad);
    return;
  }
  /* WHAT THIS PHONE MADE, AND NEVER THE COPY IT WAS SENT. `langNameOf()`
     starts from the server's own answer -- LNAME in memory, then the picture
     of it on the disk -- and a row built out of that is the read-only copy
     travelling back up, which CLAUDE.md rule 22 says is the one road that
     does not exist. The open language answers with `langName`, the value in
     front of the person; any other answers with what this phone WROTE and
     has never sent: the `lang` slice, and the name an older version left in
     the index (langNameOld(), www/core.js). Neither is a `.got`. */
  nm=(key===langId)? String(langName||'') : langNameOld(key);
  /* AND ITS PAGE IS OPEN FROM THE MOMENT IT EXISTS, which is the default the
     owner chose. 「非公開の印」 was a flag whose ABSENCE meant public
     (www/home.js, until 2026-09-08), and every language made so far has been
     public because the phone sent 「公開」 up on its first launch.

     That send is gone -- the phone holds no opinion about this any more
     (「端末に hide の存在があるわけないやろ」 OWNER 2026-09-08) -- so the
     default has to be said where the row is MADE, or every language made from
     today would arrive private, which is a different decision from the one the
     owner made. Here and not as the column's default in supabase/schema.sql:
     six claims of `npm run rls` are built on 「a row inserted without a date is
     private」, and moving the default under them would be widening what
     publishing means in order to say what a new language is. */
  /* AND THE ID GOES IN THE INSERT. `language.id` is
     `default gen_random_uuid()`, and a default only fires where nothing was
     sent -- so the row is given the number the phone already calls this
     language by, and the two sides say the same number from here on. The
     insert policy is `is_member() and owner = auth.uid()` and does not look
     at the id, so supabase/schema.sql is untouched. */
  /* AND NOTHING IS SAID ABOUT HOW IT IS WRITTEN. This sent
     `langWsysOf(key)`, which is `language.wsys` as the server last said it --
     memory, then the picture on the disk -- so a row was being MADE out of
     the copy of a row. `language.wsys` is `default ''`
     (supabase/schema.sql), 「empty means nobody has said」, and setWsys() ->
     netLangWsys() is the one road that ever fills it: a language being made
     has had nobody say. */
  netPost('/rest/v1/language',
          {id:key, owner:me, name:nm,
           published_at:(new Date()).toISOString()}, SESS.at,
    function(){
      langRowGot(key);
      langOwnGot(key, me);
      /* AND WHAT IT IS CALLED, from the row that has just been made. This is
         the walk's one window closing: the name was typed before there was an
         account to send it to, and here is where it becomes the column
         (www/core.js § LNAME). */
      langNameGot(key, nm);
      /* The row is here and it says so -- www/home.js § wldPubGot. Without
         this the article of a language just made is a page waiting for an
         answer that has already arrived. */
      wldPubGot(key, true);
      ok(key);
    },
    function(d, st, m){
      /* 409 IS 「IT IS ALREADY HERE」 and nothing else: the id is the primary
         key, so the only thing that can collide is this same language, put up
         by another phone of this account while this one had no signal. The
         mark goes on and the question is asked again from the top -- the road
         above, which either answers straight away or asks the server whose it
         is. One road, walked twice, rather than a second copy of it here. */
      if(st===409){ langRowGot(key); netLangRow(key, ok, bad); return; }
      bad(d, st, m);
    });
}
/* AND THE ONE THING THAT TAKES A LANGUAGE OFF THE SERVER.
   -------------------------------------------------------------------------
   「この言語を削除で言語の制作のものは全部なくなるってずっと言ってんだろ」
   OWNER 2026-09-03.

   A language LIVES on the server (CLAUDE.md § Online). Deleting only the copy
   on the phone is not deleting it: the next netLangsDown() brings it back,
   and 「gone, then back」 is not gone.

   `language_drop` in supabase/schema.sql is `owner = auth.uid()`, so a
   language somebody else wrote cannot be reached from here whatever this
   phone sends. The slices go with it -- every table naming `language` says
   `on delete cascade` -- so this one row is the whole of it.

   A language that has never been up has no row, and there is nothing on the
   server to take away: that is `ok()` and not a failure. That used to be
   read off `LANGS[id].sid` and SKIP the request, and with one number there is
   nothing on the phone that durably says a row was made -- www/core.js § LROW
   is a memory of what the server has said THIS session. So the request goes
   either way and the mark only decides how to read 「it took nothing away」:
   a row we were told about and cannot delete is `∅`, and one we were never
   told about was never there. Skipping on the mark alone would leave the row
   on the server on any launch whose walk had not run -- and 「gone, then
   back」 is what the paragraph below is about.

   AND WHAT CAME BACK IS COUNTED, which is netDrop()'s other sentence. A DELETE
   that matched NO ROW answers exactly like one that matched -- so a row
   `language_drop` refused, or a row this phone has the wrong id for, read as
   `消えました`: the language went off the phone, stayed on the server, and the
   next netLangsDown() brought it back. Measured on 2026-09-06: with the DELETE
   answered 200 `[]`, both LANGS and `lingua.langs` lost the language and the
   person was told nothing. netSend() asks for the rows (the Prefer header
   above), so this reads them: no row means the language is still there, and
   the person is told so rather than watching it go and come back.

   `∅` is the mark and it is a STATE, the way netWhy()'s others are: the
   request was answered and took nothing away, which is not 通信エラー and must
   not raise its pop. Signed out with a row standing is the same answer -- there
   is nobody to ask, so nothing can be said about the row, and a language that
   is still on the server must not leave this phone.

   The name is not read and the row is not looked up first. Which language is
   going was decided by the person pressing; asking the server to confirm it
   would be a second answer to a question that has one. */
function netLangDrop(id, ok, bad){
  var sid=String(id||''), knew=langRowUp(sid);
  ok=ok||function(){}; bad=bad||function(){};
  if(!sid){ ok(); return; }
  /* Nobody to ask, and the same fact answers it: a row this session was told
     about is still standing, which is `∅`; one nobody ever mentioned was
     never there, and a language that has never been up is not a failure. */
  if(!netSignedIn()){ if(knew) bad(null, 200, 'language ∅'); else ok(); return; }
  netSend('DELETE', '/rest/v1/language?id=eq.'+encodeURIComponent(sid),
          null, SESS.at, function(d){
            if(!d || !d.length){
              if(!knew){ ok(d); return; }
              bad(d, 200, 'language ∅'); return;
            }
            ok(d);
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

   AND IT IS WAITED ON. It used to be fired and forgotten, like netFollow(),
   because the switch had already moved on the screen -- the phone kept its own
   `hide` and this was the phone telling the server about it. There is no
   phone's answer any more (www/home.js § wldPubGot), so this IS the switch:
   nothing moves until the server has taken it, and a request that did not
   arrive leaves the page saying what is true.
   「保存するタイミングでエラーが起きるなら、保存されないし」 OWNER 2026-09-05.

   `netLangSync()` used to send this again on every launch to mend a toggle
   that never arrived. It does not any more and there is nothing to mend: the
   launch READS the row now, so a press that failed is simply a press that did
   not happen. */
function netLangPublic(on){
  if(!netSignedIn()) return;
  var at=on? new Date().toISOString() : null;
  /* The switch is on the OPEN language's page, so that is the one it is about. */
  netLangRow(langId, function(sid){
    netSend('PATCH', '/rest/v1/language?id=eq.'+encodeURIComponent(sid),
            {published_at: at}, SESS.at,
            function(){ wldPubGot(langId, at); render(); },
            function(d, st, m){ netPop(d, st, m, function(){ netLangPublic(on); }); });
  }, function(d, st, m){ netPop(d, st, m, function(){ netLangPublic(on); }); });
}
/* AND WHAT THIS LANGUAGE IS CALLED.
   -------------------------------------------------------------------------
   「言語の名前もサーバーでしょ。wiki もそうなんだから」 OWNER 2026-09-08.

   The rename, and until today there was no such request in this file: the
   name went into the `lang` slice and into the index, both of which are this
   phone's, and `language.name` -- the one thing anybody else reads -- was
   written once when the row was made and never again.

   IT IS THE SAME SHAPE AS netLangPublic() ABOVE and for the same sentence:
   nothing moves on the screen until the server has taken it.
   「保存するタイミングでエラーが起きるなら、保存されないし」 OWNER 2026-09-05.
   A rename that did not arrive is a rename that did not happen, the box stays
   open with what was typed in it, and ［再接続］ sends the same one again.

   Signed out is netLangRow()'s answer and not a branch here: it says
   `langrow −`, which netPop() shows, so 「電波が無い」 does not arrive as
   silence. */
function netLangNamePut(sid, nm, ok, bad){
  netSend('PATCH', '/rest/v1/language?id=eq.'+encodeURIComponent(sid),
          {name:String(nm||'')}, SESS && SESS.at, ok, bad);
}
function netLangRename(nm, then){
  var v=String(nm||'');
  netLangRow(langId, function(sid){
    netLangNamePut(sid, v,
      function(){ langNameGot(langId, v); if(then) then(); },
      function(d, st, m){ netPop(d, st, m, function(){ netLangRename(v, then); }); });
  }, function(d, st, m){ netPop(d, st, m, function(){ netLangRename(v, then); }); });
}
/* WHICH OF SOMEBODY ELSE'S LANGUAGES THIS ACCOUNT HAS TAKEN.
   -------------------------------------------------------------------------
   「端末に残すものないんですけど。サーバーで同じ機能になるように代替して」
   OWNER 2026-09-08.

   `language_take` in supabase/schema.sql -- one row per (account, language),
   readable and writable by that account and by nobody else. It was
   `LANGS[id].uid` on a downloaded language, which is the PHONE's index, so
   the ceiling on downloads (「plusは1つproは3つ」 OWNER 2026-09-02) counted
   per handset: the same account on a second phone started at nought.

   THE IDS AND NOT A COUNT. dlCount() wants the number and lsWipeAcct()
   (www/core.js) wants to know whether a given language is one of them --
   deleting an account has to take the copies it pulled down, and those are
   written by somebody else, so 「whose is it」 cannot find them.

   Asked once a session, on the road that already knows a session arrived.
   A refusal leaves the answer at `null`, which is 「not asked」 and is what
   dlStop() waits for -- it is not nought, and a ceiling measured against a
   number nobody gave refuses the first download or lets through the fourth. */
function netTakes(ok, bad){
  if(!netSignedIn() || !SESS || !SESS.uid){ if(bad) bad(null, 0, 'take −'); return; }
  netGet('/rest/v1/language_take?select=language&uid=eq.'+
         encodeURIComponent(SESS.uid),
    function(d){
      var rows=(d && typeof d.length==='number')? d : [], out=[], i;
      for(i=0;i<rows.length;i++) if(rows[i] && rows[i].language)
        out.push(String(rows[i].language));
      langTookGot(out);
      /* AND THE LANGUAGES THEMSELVES, off this answer rather than off an ask
         of its own (§ netTakenDown below). This is the road that already
         knows which of somebody else's this account has, so the rows and
         their slices come down from here -- 「待つのではなく、来た時に」 --
         and the launch does not grow a stage in front of it. */
      netTakenDown(out);
      if(ok) ok(out);
    }, function(d, st, m){ if(bad) bad(d, st, m); });
}
/* Taking one. The row goes up and the count moves when it has -- a ceiling
   that moved on the press would be this phone doing the server's arithmetic,
   which is what it was doing. `on conflict` is not needed: taking a second
   chapter of a language already taken is the same (uid, language), and the
   primary key refuses it -- which is the right answer, because it is not
   another language. That refusal must not read as a failure, so a 409 is
   taken as 「already there」 and the count is asked for again either way. */
function netTakePut(sid, ok, bad){
  var id=String(sid||'');
  if(!netSignedIn() || !SESS || !SESS.uid || !id){ if(bad) bad(null, 0, 'take −'); return; }
  netSend('POST', '/rest/v1/language_take', {uid:SESS.uid, language:id}, SESS.at,
    function(){ netTakes(ok, bad); },
    function(d, st, m){
      if(st===409){ netTakes(ok, bad); return; }
      if(bad) bad(d, st, m);
    });
}
/* GIVING ONE BACK. 「言語変更画面をスライドで消せる、メモしといて」 OWNER
   2026-09-09, and 「はい」 to the question the next day.
   -------------------------------------------------------------------------
   There was no road out for two weeks and the CEILING is why one had to be
   built: plus holds one downloaded language and pro three, so a ↓ pressed by
   mistake filled the only slot there was for ever. The row goes in with
   netTakePut() above and comes out here -- the same table, and `take_drop` in
   supabase/schema.sql (`is_member() and uid = auth.uid()`) is what keeps it
   to this account's own rows, which npm run rls holds against B.

   THE SERVER IS FIRST, AND WHAT THIS PHONE DROPS IS READ BACK OFF IT. The
   DELETE lands; then the takes are ASKED FOR AGAIN and that answer is handed
   to netTakeGone() -- the one place that takes a downloaded language off this
   phone. Nothing here works out what to drop. 「the row is gone」 is the
   server's sentence, and it is the same sentence netTakenDown() hears on a
   launch, so a person pressing 削除 and a source deleting their language are
   one road and not two (CLAUDE.md § Simple -- a second function that deleted
   by id would be a second answer to 「which languages has this account
   taken」). The DELETE REVIEW is in docs/CHANGELOG.md under the same date.

   A REFUSAL DROPS NOTHING AND SAYS SO. The row stays, the slices stay, the
   ceiling stays where it was, and the caller puts the pop up -- the shape
   rule 11 asks for on the other direction: 「保存できなければ保存しない、
   そしてそう言う」. Pressing again is a delete that can land.

   AND NOTHING GOES TO THE LANGUAGE ITSELF. netLangDrop() is not called and
   must not be: the language is somebody else's and this phone has no business
   writing to it. What comes off is the mark. */
function netTakeDrop(sid, ok, bad){
  var id=String(sid||'');
  if(!netSignedIn() || !SESS || !SESS.uid || !id){ if(bad) bad(null, 0, 'take \u2212'); return; }
  netSend('DELETE', '/rest/v1/language_take?uid=eq.'+encodeURIComponent(SESS.uid)+
          '&language=eq.'+encodeURIComponent(id), null, SESS.at,
    function(){
      netTakes(function(left){ netTakeGone(left); if(ok) ok(left); }, bad);
    },
    function(d, st, m){ if(bad) bad(d, st, m); });
}
/* AND HOW THIS LANGUAGE IS WRITTEN.
   -------------------------------------------------------------------------
   「端末に残すものないんですけど」 OWNER 2026-09-08. The same shape as
   netLangRename() above and for the same sentence: nothing moves on the
   screen until the server has taken it. The five kinds are www/wsys.js's
   list; this only carries the word. */
function netLangWsys(k, then){
  var v=String(k||'');
  netLangRow(langId, function(sid){
    netSend('PATCH', '/rest/v1/language?id=eq.'+encodeURIComponent(sid),
            {wsys:v}, SESS.at,
            function(){ langWsysGot(langId, v); if(then) then(); },
            function(d, st, m){ netPop(d, st, m, function(){ netLangWsys(v, then); }); });
  }, function(d, st, m){ netPop(d, st, m, function(){ netLangWsys(v, then); }); });
}
/* THIS ACCOUNT'S OWN LANGUAGES COME DOWN ONE ROAD, AND IT IS netLangsDown().
   -------------------------------------------------------------------------
   `netLangBack()` and `netLangBack1()` stood here and asked the same question
   netLangsDown() below asks -- `language?owner=eq.<me>`, the row, and the
   slices this phone does not have -- and BOTH of them made the index row. The
   launch fired both at once (netTook() straight to this one, pullBoot() to
   the other), so they raced: this one asked for the slices FIRST and made its
   entry inside the answer keyed by the `sid`, while netLangsWalk() makes its
   entry FIRST keyed by a fresh langMint() id. By the time this one's answer
   came back `LANGS[sid]` was still undefined, and the same language got a
   SECOND row -- 「起動で同じ言語が切り替えに 2 行並ぶ」 OWNER 2026-09-09.

   Deleted rather than guarded (CLAUDE.md § Simple -- 「直すじゃなくて書き換え」):
   a second mechanism covering the first one's gap is the thing that must not
   happen, because from then on nobody can say which of the two is deciding.
   netLangsWalk() is the wider of the two anyway -- it writes the writing
   system and the owner columns, calls netAgreed(), fills an empty name column
   out of the `lang` slice, and walks the languages this account TOOK as well.

   What this one carried that the other did not is the moment AFTER: 「the
   languages have come down, so a phone holding nothing of this account's may
   have one made for it」. That is `pullWait('mylangs', ...)` in netTook()
   above, which is the same idiom www/boot.js already waits on and runs its
   waiter on a refusal exactly as `done(false)` did here. */
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
  netGet('/rest/v1/language_seen?select=id,owner,name,license,published_at,nwords,nletters,wsys'+
         '&limit=1&id=eq.'+encodeURIComponent(id),
    function(d){
      var r;
      if(!d || !d.length){ ok(null); return; }
      r=d[0]||{};
      ok({ id:String(r.id||''), owner:String(r.owner||''),
           name:String(r.name||''),
           license:String(r.license||''), wsys:String(r.wsys||''),
           pub:r.published_at? String(r.published_at) : '',
           nwords:Number(r.nwords)||0, nletters:Number(r.nletters)||0 });
    }, bad);
}
/* Every slice of one language, as {kind: {body, no}}. */
/* A PostgREST `in.(...)` list. The slice kinds are the twelve names in
   SLICES and nothing a person types, so there is nothing to escape -- and
   that is exactly why it is written down: the day this is handed something
   else, the encoding is here rather than remembered. */
function netInList(xs){
  var out=[], i;
  for(i=0;i<xs.length;i++) out.push(encodeURIComponent(String(xs[i])));
  return out.join(',');
}
/* `kinds` is which of the twelve to ask for, and leaving it out is all of
   them -- which is what a launch wants and what this asked for always. A SAVE
   wants the one or two that moved: the whole language is 685 KB on a big one,
   and reading it back on every save is a copy of somebody's dictionary over
   the network each time they add a word. Written here rather than as a second
   function, because 「どのスライスを訊くか」 is this question with an answer,
   not a different question. */
/* AND `cols` IS WHICH COLUMNS, which is the same question one step in: a save
   asks 「いつ最後に書かれたか」 and does not want the dictionary to answer it.
   Leaving it out is all four, which is what a launch wants and what this asked
   for always. The body is put on the answer ONLY where it was asked for --
   「訊かなかった中身」 and 「空の中身」 are two states and must not share a
   branch (docs/DATA_SAFETY.md rule 3). */
function netSlices(sid, ok, bad, kinds, cols){
  netGet('/rest/v1/slice?select='+(cols || 'kind,body,no,at')+
         '&language=eq.'+encodeURIComponent(sid)+
         ((kinds && kinds.length)
            ? '&kind=in.('+netInList(kinds)+')' : ''),
    function(d){
      var out={}, i, r;
      for(i=0;i<(d||[]).length;i++){
        r=d[i];
        out[r.kind]={no:r.no||0, at:String(r.at||'')};
        if(r.body!==undefined && r.body!==null) out[r.kind].body=String(r.body);
      }
      ok(out);
    }, bad);
}
/* One slice, written. `Prefer: resolution=merge-duplicates` is what makes an
   insert into a table with a two-column primary key an upsert -- the phone
   does not have to know whether this slice has ever been up. */
function netSlicePut(sid, kind, body, no, ok, bad){
  /* Through netSend(), like everything else here: this is the write a
     person's work actually goes up in, and it used to open its own
     XMLHttpRequest, outside the token renewal. 「保存押せば起動されないの？」
     -- it did not, and this is the line that answers it. */
  /* THE STAMP IS BUILT HERE AND HANDED BACK, because there is nowhere else it
     could come from: the row does not return any more (`return=minimal`
     above), so what the server holds for this slice is exactly the string
     this line sent. netSlice1() gives it to netAgreed(), and the next save
     compares against it rather than reading the dictionary back. */
  var at=(new Date()).toISOString();
  netSend('POST', '/rest/v1/slice',
          {language:sid, kind:kind, body:String(body||''),
           no:(no||0)+1, at:at},
          SESS && SESS.at, function(){ ok(at); },
          function(d, st){ bad(null, st||0); }, true);
}
/* EVERY LANGUAGE THIS ACCOUNT HAS, BROUGHT DOWN TO THE PHONE.
   -------------------------------------------------------------------------
   「前のアカウント消えたんだが？」 OWNER 2026-08-31 -- and nothing had been
   deleted. There was simply no way back to it.

   netLangSync() below syncs the language that is OPEN, and it finds it
   through the index, which is on the PHONE. So everything the server holds
   for an account that this phone has not got an entry for was unreachable: no GET of `/rest/v1/language` anywhere in www/ asked for the
   ones this phone has no entry for. Signing in on a second
   phone, or on a phone that had been somebody else's, showed whatever that
   phone was already carrying and nothing of yours. 「全部アカウントごとで
   しょ」「基本は全部サーバー管理」

   IT FILLS IN WHAT IS MISSING AND STOPS -- docs/DATA_SAFETY.md rule 2, the
   one that matters, and the reason a restore is written this way rather than
   the obvious way: **the way a copy destroys somebody's work is by winning.**
   So:

     a language already here (its `sid` is on an entry)  -> not touched at all
     a slice already on the phone                        -> not touched at all
     anything else                                       -> written

   Nothing is removed, nothing is overwritten, and the open language does not
   change -- langMint() makes an entry without moving langId, so somebody is
   left standing exactly where they were.

   The ceiling is not asked and must not be: langCount() gates ADDING one, and
   docs/PAID_FEATURES.md is explicit that somebody holding more than their
   plan allows keeps every one of them. A language that is already yours
   arriving on your own phone is not somebody making a new one.

   Fired and not waited for, like everything else here. A phone with no signal
   is a phone somebody is still writing a language on. */
/* THE ENTRY FOR A SERVER ROW IS THE ONE UNDER THE SERVER'S ID, AND THERE IS
   NOTHING TO LOOK IT UP BY (2026-09-10).

   nidFor(), nidHolds() and nidDrop() stood here and are deleted. All three
   were the bridge between a language's two numbers: the row came back under
   its uuid and the index was keyed by `L<ms36>`, so finding the entry meant
   searching every row of the index for one carrying that uuid as `sid` --
   and 148 is what happens when that search misses. A second entry was minted
   for a language that was already here, the switcher showed it twice, and the
   row somebody stood in was the empty one; 150 answered by DROPPING the row
   that held nothing, which is a second mechanism laid on the first.

   There is one number now (www/core.js § langMint), so the question is the
   one the reading side has always asked: **is `row.id` in `LANGS`?** No
   search, nothing to drop, and no way for one language to have two rows.

   `own` is who WROTE this row, and it is what decides which kind of entry
   gets made -- one of this account's own, or langSeenAdd() for one it TOOK.
   There is no third kind and no new one here: those two are the only ways an
   entry has ever been made, and a taken language arriving on the launch road
   is the same entry the article's ↓ makes. */
/* ONE WALK, AND WHAT COMES OFF THE WIRE IS THE ONLY THING THAT DIFFERS.
   -------------------------------------------------------------------------
   A row is a row: the entry, the four columns, and the slices this phone does
   not have. Whether it arrived because this account WROTE the language or
   because it TOOK it is a question about the ask, not about the row -- so it
   is asked once, above, and this is walked by both. */
function netLangsWalk(d, done){
  /* WHAT CAME BACK IS A LIST OR IT IS NOT AN ANSWER. netLangBack() above has
     said so since it was written -- 「it did not answer」 and 「there is
     nothing there」 are two states and must not share a branch -- and this one
     read `d` as rows without asking. Anything without a length (an error body,
     a single row, `null`) left `i >= undefined` false for ever: step() called
     itself until the stack ran out. Nothing on a phone would say why -- the
     languages simply never arrived. Measured 2026-09-07, act-check:
     `Maximum call stack size exceeded`, every frame `step`. */
  /* WHAT IS ALREADY HERE IS `LANGS` ITSELF, ASKED EVERY TIME. A picture of
     the index taken before the walk started was kept beside it once, and that
     made two answers to 「is this language already here」 -- LANGS, and the
     picture. A language added between one walk and the next was in one and
     not the other, so the walk made a SECOND entry for a language that was
     already there (acct-check 13, measured 2026-09-09: 「降ろした数が 1 で
     ない ── 2」). The picture is gone with the search that needed it: the
     index is keyed by the server's own id now, so 「already here」 is
     `LANGS[row.id]` and two walks running at once see each other's entries
     through it. */
  var rows=(d && typeof d.length==='number')? d : [],
      i=0, made=0, filled=false;
  function step(){
    var row, nid, own;
    if(i>=rows.length){
      if(made) langStore();
      /* The OPEN language's slices came down, so what the screens are holding
         is older than what is in the store. Read it in the way langOpen() does
         rather than patching each global by hand. */
      if(filled) langLoad();
      if(made || filled) render();
      done(made); return;
    }
    row=rows[i]; i++;
    if(!row || !row.id){ step(); return; }
    /* THE ENTRY MAY ALREADY BE HERE, AND ITS SLICES ARE NOT.
       This skipped a language whose id was already in the index, and that was
       right for as long as a slice survived a launch: the copy was on the
       phone, so there was nothing to fetch. **The slices are in memory now**
       (LSL in www/core.js), so on every launch there is an index full of
       languages and not one word in any of them -- and skipping by id would be
       the app showing somebody an empty dictionary and calling it theirs.

       So the entry is made only when it is new, and the slices are asked for
       either way. */
    /* WHO WROTE IT, off the row's own column and not off who is asking. One of
       the two asks is this account's by construction and the other is not, so
       the column is the only thing that can say which of the two a row came
       from. A row with no `owner` at all came back from `owner=eq.me`, so it
       is this account's. */
    own=String(row.owner||SESS.uid||'');
    nid=String(row.id);
    if(!LANGS[nid]){
      /* SOMEBODY ELSE'S, AND `language.owner` IS WHAT SAYS SO. langSeenAdd()
         stamps the owner the row carried, and langWhose() (www/core.js) reads
         that -- it is what keeps every write road off a taken language: one
         made as this account's own would be saved back up under somebody
         else's row. */
      if(own!==String(SESS.uid||'')) langSeenAdd(nid, String(row.name||''), own);
      /* The entry first, so a sync that fails halfway leaves a language that
         is HERE and empty rather than slices under an id nothing names. Empty
         and broken are different states -- docs/DATA_SAFETY.md rule 3 -- and
         an empty language is a legitimate one. The entry says the language is
         here; whose it is is the owner column, written below. */
      else LANGS[nid]={};
      made++;
    }
    /* AND THE ROW EXISTS, WHICH IS WHAT `sid` USED TO SAY BY BEING THERE.
       www/core.js § LROW -- this walk only ever carries rows the server has. */
    langRowGot(nid);
    langStore();
    /* AND WHETHER ITS PAGE IS OPEN, which is the one fact about a language
       that is a COLUMN rather than a slice. This is the road that answers it
       (www/home.js § wldPubGot): until it has, the article does not draw,
       because 「まだ聞いていない」 is not 「公開」. */
    wldPubGot(nid, row.published_at);
    /* AND WHAT IT IS CALLED, which is the other column (www/core.js § LNAME).
       Same road, same reason: 「まだ聞いていない」 is not 未設定. */
    langNameGot(nid, row.name);
    /* AND HOW IT IS WRITTEN, which is the third column (www/core.js § LWSYS).
       It was `SET.wsys` -- one answer for all of somebody's languages, on this
       handset, invisible to everybody else. */
    langWsysGot(nid, row.wsys);
    /* AND WHO WROTE IT -- www/core.js § LOWN, where 「not asked」 is neither
       side and is what langMine() waits for. */
    langOwnGot(nid, own);
    /* ---- THE MARKS FIRST, AND THEN ONLY THE BODIES THIS PHONE LACKS ----
       This read all twelve bodies and then threw most of them away: the loop
       below fills in what is MISSING and stops (docs/DATA_SAFETY.md rule 2),
       so every slice this phone was already holding came down the wire to be
       skipped on the next line. On a launch where the phone has just minted
       its own language that is nearly all of them -- 898 KB carried and
       discarded, and then the launch's own sync read the same 898 KB again
       to merge it. That is 「起動一回で言語ぜんぶを二度読む」,
       docs/reports/cost-2026-09-09.md 二.

       WHICH ONES ARE MISSING IS KNOWN BEFORE THE BODIES ARE ASKED FOR --
       `slMine()` is a question about this phone. So the marks come first
       (`kind,no,at`), and the ask is narrowed to the kinds that will
       actually be written. Nothing about WHAT is written changes: the guard
       below still stands, and a kind the server has that this app has never
       heard of is still walked, because the list comes off the server's own
       answer and not off SLICES.

       The `lang` slice is asked for as well where the name column is empty,
       because the column is filled from the SERVER's copy whether or not
       this phone is holding one of its own. */
    netSlices(row.id, function(st){
      var want=[], has={}, k;
      for(k in st){
        if(!Object.prototype.hasOwnProperty.call(st, k)) continue;
        if(slMine(langKeyOf(nid, k))!==null) continue;
        want.push(k); has[k]=1;
      }
      if(own===String(SESS.uid||'') && !String(row.name||'') &&
         st.lang && !has.lang) want.push('lang');
      if(!want.length){ fill({}); return; }
      netSlices(row.id, fill, step, want);
    }, step, null, 'kind,no,at');
    function fill(there){
      var k;
      for(k in there){
        if(!Object.prototype.hasOwnProperty.call(there, k)) continue;
        if(!there[k] || there[k].body==='') continue;
        /* FILLS IN AND STOPS -- docs/DATA_SAFETY.md rule 2. A slice this phone
           is already holding is left exactly as it is, because it may be a
           minute of somebody's typing that has not gone up yet. slMine() and
           not slRd(): the picture kept for a launch with no signal is not
           somebody's typing, and asking about it here is what would let the
           picture win over the answer that has just come back.
           「サーバーの答えが来たら、そちらが勝ちます」 */
        if(slMine(langKeyOf(nid, k))!==null) continue;
        slWr(langKeyOf(nid, k), there[k].body);
        /* and what the two sides agree it is, so the first thing removed after
           this is understood as a removal */
        /* AND THE MARK ON THAT AGREEMENT. Without it the launch's own sync,
           a moment later, reads all twelve bodies back to merge them against
           what it has just written -- netGotFor() above. */
        netAgreed(nid, k, there[k].body, there[k].at);
        if(nid===langId) filled=true;
      }
      /* AND A COLUMN THAT NOBODY EVER WROTE IS FILLED FROM THE SLICE. Every
         language made before today has its name in the `lang` slice, and a
         language made before netLangRow() sent one has an EMPTY column -- so
         the name is on the server twice over and the half everybody else reads
         says nothing.

         IT FILLS IN WHAT IS MISSING AND STOPS -- docs/DATA_SAFETY.md rule 2. A
         column that already says something is left exactly as it is, even
         where the slice says otherwise: the two disagreeing is a rename that
         never reached the column, and which of the two wins is a conflict,
         which is the owner's (docs/FEATURE_RULES.md § Deciding).
         docs/BACKLOG.md carries it.

         AND ONLY ON A LANGUAGE THIS ACCOUNT WROTE. `language_edit` is
         `owner = auth.uid()`, so this PATCH on somebody else's is a request
         the server refuses -- and what it would be asking for is the app
         writing a column of a language it does not own. */
      if(own===String(SESS.uid||'') &&
         !String(row.name||'') && there.lang && there.lang.body)
        netLangNamePut(row.id, there.lang.body, function(){
          langNameGot(nid, there.lang.body); render();
        }, function(){});
      step();
    }
  }
  step();
}
/* `bad` is for a caller that puts its own pop up, whose ［再接続］ has to run
   that caller's own question again rather than this function on its own.
   Where none is handed in this behaves exactly as it did: the pop is put up
   here and the caller is told nothing came. */
/* `bad` is for a caller that puts its own pop up, whose ［再接続］ has to run
   that caller's own question again rather than this function on its own.
   Where none is handed in this behaves exactly as it did: the pop is put up
   here and the caller is told nothing came. */
function netLangsDown(then, bad){
  var done=then || function(){};
  if(!netSignedIn()){ done(0); return; }
  netGet('/rest/v1/language?select=id,name,published_at,wsys,owner&owner=eq.'+
         encodeURIComponent(SESS.uid),
    function(d){ netLangsWalk(d, done); },
    function(d, s, m){
      /* 起動の道の二つ目で、人が気づくのはこちら ── この人の言語は一本も
         来ていない。［再接続］はこの道をもう一度。 */
      if(bad){ bad(d, s, m); return; }
      netPop(d, s, m, function(){ netLangsDown(then); });
      done(0);
    });
}
/* AND THE ONES THIS ACCOUNT TOOK, WHEN THE TAKES COME -- NOT BY WAITING.
   -------------------------------------------------------------------------
   「DLしたやつがなくなるって意味がわからん」 OWNER 2026-09-09. The launch
   asked `language?owner=eq.<me>` and nothing else, so a language taken off
   somebody's article came back as the index row and NOTHING IN IT: the slices
   are in memory (rule 22), the take is a `language_take` row, and no road
   brought the second one's slices down. Opening it showed an empty language.

   IT IS THE SAME WALK, and that is the whole of the change: netLangsWalk()
   above, the same entry, the same four columns, the same 「fill in what is
   missing and stop」. What differs is which rows are asked for.

   AND IT IS NOT A STAGE ON THE FRONT OF THE LAUNCH. This was written as
   netTakes() first and the row ask second, and that put every language --
   including this account's own -- one round trip further out: six in a row
   where five are allowed (slow-check, 2026-09-09). The takes are already
   asked for at the top of the launch, by the road that knows a session
   arrived; this runs off THAT answer, so the ask for this account's own rows
   goes out at once and these go out the moment the takes land.

   Once per account per launch. netTakes() runs again after a download, and a
   language just taken has its slices in memory already (www/home.js §
   wldGet), so there is nothing for this to fill and no reason to ask.
   `language_read` is 「published or mine」, so a taken language is readable
   through the `language` table exactly as it is through `language_seen`. */
var NET_TAKEN='';
function netTakenDown(took){
  var ids=(took && typeof took.length==='number')? took : [];
  if(!netSignedIn() || !SESS || !SESS.uid) return;
  if(NET_TAKEN===String(SESS.uid)) return;
  NET_TAKEN=String(SESS.uid);
  /* AND THE ONES THAT ARE NOT IN THE ANSWER ANY MORE ARE GONE FROM HERE TOO.
     Before the ask and before the line below, because 「nothing taken」 is the
     answer that takes everything: an early return there is what left them
     standing. netTakeGone() is the whole of it. */
  netTakeGone(ids);
  /* Nothing taken is an answer and not a reason to ask. */
  if(!ids.length) return;
  netGet('/rest/v1/language?select=id,name,published_at,wsys,owner&id=in.('+
         netInList(ids)+')',
    function(d){ netLangsWalk(d, function(){}); },
    /* A refusal changes nothing and is silent: this account's own languages
       came down on the road above, and a phone that did not hear about the
       ones it took is a phone that hears about them on the next launch. */
    function(){ NET_TAKEN=''; });
}
/* AND A TAKEN LANGUAGE THAT IS NOT IN THE ANSWER IS GONE FROM THIS PHONE.
   -------------------------------------------------------------------------
   「空で残さないで。消えたら消えるのよ。」 OWNER 2026-09-09
   (docs/FEATURE_RULES.md § DL 言語の四つ, decision 1; the DELETE REVIEW is in
   docs/CHANGELOG.md under the same date).

   A DOWNLOAD IS A MARK AND NOT A COPY, so when the person who wrote the
   language deletes it -- or deletes their account -- the `language_take` row
   goes with it (`on delete cascade`, supabase/schema.sql). The walk above
   fills in what the answer HAS; nothing looked at what the answer no longer
   has, so a row for somebody else's language sat in the switcher for a
   language nobody can open, with the picture kept for a launch with no signal
   still on the disk beside it. Pressing it opened a language of somebody else's that does not
   exist any more.

   FOUR THINGS ARE NOT DROPPED, and each of them is a state rather than a gap:

     the answer never came -- netTakes() failed, so this is not called at all
       and LTAKE stays `null` (www/core.js § LTAKE). 「無い」 and 「not asked」
       are different states and must not share a branch: a launch with no
       signal would otherwise delete every language this account had taken.
     a language of this person's OWN -- `language.owner` is this account, and
       not one byte of one is touched here. It is the other ask's to fill and
       nobody's to remove.
     a language nobody has answered for -- `language.owner` is empty, so the
       server has not said it came from a take and it cannot be matched
       against the answer. What cannot be matched is left alone.
     the server -- netLangDrop() is NOT called. The row is somebody else's
       language and this phone has no business writing to it; and there is
       nothing to drop, because the reason it is not in the answer is that it
       is already gone.

   The road back is the road in: if it is published again, the ↓ on the
   article takes it again. */
function netTakeGone(ids){
  var list=(ids && typeof ids.length==='number')? ids : [], gone=[],
      id, own, me=String((SESS && SESS.uid)||''), i, j, k, moved=false;
  for(id in LANGS){
    if(!Object.prototype.hasOwnProperty.call(LANGS, id)) continue;
    /* WROTE BY SOMEBODY ELSE, which is the only way an entry got here that
       this account did not make. It was `LANGS[id].mine`, a boolean this
       phone wrote;
       `language.owner` (www/core.js § LOWN) is the server's answer to the
       same question. langWhose() is not asked here on purpose: it says
       whether the take is STILL there, and what this loop is looking for is
       exactly the entries whose take has just gone. */
    own=langOwnOf(id);
    if(!own || own===me) continue;
    for(i=0;i<list.length;i++) if(String(list[i])===String(id)) break;
    if(i<list.length) continue;
    gone.push(id);
  }
  if(!gone.length) return;
  for(k=0;k<gone.length;k++){
    id=gone[k];
    /* SLICES and the same pair of keys wipeLangsHere() takes for one language
       (www/settings.js): the slice, and what this phone and the server last
       agreed it was. Walked rather than listed -- a slice added tomorrow goes
       the day it is added. slRm() takes the memory, what an older version
       wrote to the disk, and the picture kept for a launch with no signal. */
    for(j=0;j<SLICES.length;j++){
      slRm(langKeyOf(id, SLICES[j]));
      slRm(langWasKey(id, SLICES[j]));
    }
    delete LANGS[id];
    if(langId===id){ langId=''; moved=true; }
  }
  langStore();
  /* And where you are standing, if you were standing in one of them.
     langForAcct() is the one place that answers 「which language is this
     account's to be in」 -- wipeLangsHere() reaches it the same way, with the
     same two lines in front of it. It draws; nothing else does. */
  if(moved) langForAcct();
  else render();
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
/* WHAT THE TWO SIDES NOW HOLD, written down so the next merge can tell a
   removal from a thing this phone has not heard about. It is not anybody's
   work and it is not a backup -- it is a copy of what BOTH sides already
   have, and losing it costs one sync's worth of forgetting rather than any
   data. Filed beside the slice (langWasKey in core.js), so deleting the
   language takes it and lsWipeAcct, which counts the namespace rather than a
   list, takes it when an account goes. */
/* AND THE PICTURE THE SCREENS FALL BACK TO WITH NO SIGNAL, written from the
   same moment and for the same reason: this is the one place in this file that
   knows what the SERVER is holding for a slice. 「前に読み込んだ分は出て欲しい」
   OWNER 2026-09-05. slGot() in www/core.js says what it may and may not be
   read for -- it is on no road back up, and slMine() below is what keeps it
   off one. */
function netAgreed(id, kind, body, at){
  try{
    if(body==='') slRm(langWasKey(id, kind));
    else slWr(langWasKey(id, kind), body);
    slGot(langKeyOf(id, kind), body);
  }catch(e){}
  netAtSet(id, kind, at);
}
/* ---- AND WHICH VERSION OF THE SERVER'S THAT AGREEMENT WAS ----------------
   `langWasKey` is the body the two sides last agreed on. This is the
   SERVER'S mark on that same moment -- `slice.at` -- and it exists so that a
   save does not have to read the dictionary back to find out whether anybody
   else has written since. Mark unmoved means the server is still holding
   `langWasKey`, and this phone already has that.

   IT IS IN MEMORY AND IT IS NOBODY'S BELONGINGS. Losing it costs one read:
   a fresh launch starts empty and the first save reads bodies exactly as it
   always did. It is not written to localStorage, because a key there is a
   thing store-check rightly asks 「which account is this」 of, and this is
   not a thing that should have to answer (rule 22).

   「知らない」 is not 「同じ」. No record means read. */
var NET_AT={};
function netAtKey(id, kind){ return String(id)+'.'+kind; }
function netAtSet(id, kind, at){
  var k=netAtKey(id, kind);
  if(at) NET_AT[k]=String(at); else delete NET_AT[k];
}
function netAtHas(id, kind){ return !!NET_AT[netAtKey(id, kind)]; }
function netAtSame(id, kind, row){
  var k=netAtKey(id, kind);
  return !!(row && row.at && NET_AT[k] && String(row.at)===NET_AT[k]);
}
/* ---- WHAT THE SERVER IS HOLDING FOR THESE SLICES, WITHOUT CARRYING BACK
   THE ONES IT ALREADY AGREES WITH -----------------------------------------
   Both roads that put a slice up -- a save (netSaveUpGo) and a launch
   (netLangSync1) -- have to hand netSlice1() what the server has, and both
   read every BODY to do it. That is 877 KB to add one word of 0.14 KB, and
   at a launch it is the whole language read a SECOND time, right behind
   netLangsWalk() reading it once. docs/reports/cost-2026-09-09.md 一・二.

   WHAT THE READ IS FOR IS syMerge() AND THAT STAYS. It is the only thing
   that keeps what a SECOND PHONE added when this one writes --
   「そりゃあ両方足すだろ」 -- because `slice`'s primary key is
   (language, kind) and an unmerged write simply wins. What changes is WHICH
   BODIES are read, and nothing else.

   The marks come first (`kind,no,at`, about a tenth of a kilobyte), and a
   body only where its mark has MOVED since this phone last agreed. Where it
   has not moved AND this phone still holds `langWasKey`, that is what the
   server is holding -- it is already here, so there is nothing to fetch. Both
   halves, because the mark says WHEN the two sides agreed and the record says
   WHAT they agreed on; a mark with no record behind it answers nothing.

   SO A SECOND PHONE IS ALWAYS READ. Two phones writing send two different
   marks, so whichever landed second leaves a mark the other does not know,
   and the loser reads and merges on its next save. A phone with no record
   reads -- 「知らない」 is not 「同じ」.

   ONE FUNCTION BECAUSE IT IS ONE QUESTION. Two copies of this would be two
   answers to 「サーバーは今なにを持っているか」, and the wrong one would be
   the one nobody is reading. */
function netGotFor(id, sid, kinds, ok, bad){
  var know=[], dunno=[], got={}, st={}, left=0, fell=false, i, k;
  /* A MARK THIS PHONE HAS NEVER RECORDED ANSWERS NOTHING, so its body is
     asked for outright -- and the two asks go out TOGETHER, because neither
     needs the other's answer. One stage, whatever the mixture is. Sending
     everything down the body road because one slice's mark is unknown would
     drag the dictionary along for company; asking the marks first for a
     slice with no record would be a round trip spent to learn nothing.
     tools/slow-check.mjs holds the depth and the bytes. */
  for(i=0;i<kinds.length;i++){
    k=kinds[i];
    if(netAtHas(id, k)) know.push(k); else dunno.push(k);
  }
  if(!know.length && !dunno.length){ ok({}); return; }
  function bail(d, s2){ if(fell) return; fell=true; bad(d, s2); }
  function step(){
    if(fell || --left) return;
    /* Of the ones this phone has a record for, the bodies of any whose mark
       has MOVED -- somebody else has written those and they have to be
       merged. The rest are `langWasKey`, which is here. */
    var need=[], j, kk, was;
    for(j=0;j<know.length;j++){
      kk=know[j];
      was=slMine(langWasKey(id, kk));
      /* THE MARK ALONE DOES NOT ANSWER IT. 「サーバーは何を持っているか」 is
         answered without a read only when BOTH halves are here: the mark has
         not moved, AND this phone still holds the body the two sides agreed
         on. A missing `langWasKey` is 「知らない」 and it was written down as
         `''`, which is the string syMerge() reads as 「サーバーは何も持って
         いない」 -- the same 「空」と「知らない」を同じ枝に入れる fault
         CLAUDE.md 規則 11 is about. Where either half is missing this reads
         the body, which is what it did before any of this existed. */
      if(was===null || !netAtSame(id, kk, st[kk])){ need.push(kk); continue; }
      got[kk]={body:was, no:st[kk].no, at:st[kk].at};
    }
    if(!need.length){ ok(got); return; }
    netSlices(sid, function(there){
      var n;
      for(n=0;n<need.length;n++) got[need[n]]=there[need[n]];
      ok(got);
    }, bail, need);
  }
  if(dunno.length) left++;
  if(know.length) left++;
  if(dunno.length)
    netSlices(sid, function(there){
      var n;
      for(n=0;n<dunno.length;n++) got[dunno[n]]=there[dunno[n]];
      step();
    }, bail, dunno);
  if(know.length)
    netSlices(sid, function(rows){ st=rows; step(); }, bail, know, 'kind,no,at');
}
var NET_SHRANK=[];
var NET_SYNCING=false;
/* ONE SLICE, BOTH WAYS, AND IT IS THE ONLY PLACE A SLICE GOES UP.
   -------------------------------------------------------------------------
   This was the body of the loop inside netLangSync1() and nothing else could
   reach it, so the only moment a person's work went up was a LAUNCH -- twice
   a session, from www/boot.js and from the door. 「保存としたらオンライン
   おしまい」 OWNER 2026-09-04: a save has to arrive, and it could not,
   because the road was written inside a walk over all twelve.

   It is lifted out rather than copied. netLangSync1() below calls it twelve
   times and netSaveUp() calls it for the slices that moved, and there is ONE
   road: merge, keep, write, agree. A second function that only wrote would be
   the phone overwriting whatever another one had added -- `slice`'s primary
   key is (language, kind) and `no` is a counter that guards nothing, so an
   unmerged write wins and 「そりゃあ両方足すだろ」 loses.

   `got` is what the server is holding for this slice, or nothing.

   AND A WRITE THAT DID NOT LAND IS SAID OUT LOUD. Both of the netSlicePut()
   failures below used to call done(), exactly as a success does, so the one
   request that carries a person's work could fail with nothing told to
   anybody -- pressed on 2026-09-05: Save on the drawing screen, five POSTs of
   /rest/v1/slice refused, no pop, the screen moved on and the toast said
   saved. 「通信エラーなら進むわけねえだろ全部」 OWNER 2026-09-05. `bad` is
   that answer, and it is the file's own `ok, bad` shape rather than a new
   one. Which of the two a caller wants is the CALLER's, so both call sites
   pass one and neither can inherit a swallow it did not ask for. */
function netSlice1(id, sid, kind, got, done, bad){
  var mine, was, put;
  /* WHAT THIS PHONE HAS THAT THE SERVER MAY NOT KNOW ABOUT, and never the
     picture kept for a launch with no signal -- slGot() in www/core.js says
     why. This is the only function that puts a slice up, so slMine() here is
     the whole of 「写しは絶対にサーバーへ戻らない」. */
  mine=slMine(langKeyOf(id, kind));
  /* What the two sides last agreed this slice was. It is the only thing
     that tells 「somebody removed this here」 from 「this phone has not
     been told about it yet」 -- the two look identical from here and
     want opposite answers. No record means no dropping, which is what
     this did before there was one. */
  was=slMine(langWasKey(id, kind));
  put=syMerge(kind, mine===null? '' : mine, got? got.body : '',
              was===null? '' : was);
  if(put!=='' && put!==mine){
    /* and only where it keeps everything that is already there */
    if(netKeeps(mine, put)){
      slWr(langKeyOf(id, kind), put);
      /* Something came back, so say so: the caller reads the screens again. */
      if(put===''){ done(true); return; }
    } else {
      /* Skipped, and remembered rather than swallowed: a merge that came
         back smaller is a thing somebody has to be told about, and the
         phone keeps what it had in the meantime. */
      NET_SHRANK.push(id+'.'+kind);
      done(false); return;
    }
    /* Both sides are holding the same string now, so that is what they
       agreed. Recorded here rather than after the write, because there is
       nothing to write. */
    if(got && put===got.body){ netAgreed(id, kind, put, got.at); done(true); return; }
    netSlicePut(sid, kind, put, got? got.no : 0,
                function(at){ netAgreed(id, kind, put, at); done(true); },
                /* A write that did not land agreed nothing, and the record
                   stays as it was. What happens next is the caller's. */
                function(d, st){ bad(d, st); });
    return;
  }
  /* The stamp only where the server is KNOWN to be holding `put`. An empty
     merge over a server that holds something is not an agreement about that
     something, and recording a mark there would tell the next save to skip a
     read it needs. */
  if(put==='' || (got && put===got.body)){
    netAgreed(id, kind, put, (got && put===got.body)? got.at : '');
    done(false); return;
  }
  netSlicePut(sid, kind, put, got? got.no : 0,
              function(at){ netAgreed(id, kind, put, at); done(false); },
              function(d, st){ bad(d, st); });
}
/* ---- and the moment a save reaches the server --------------------------
   「保存としたらオンラインおしまい」「オンラインは一本化ね？」 OWNER 2026-09-04.

   WHICH SLICES MOVED IS ASKED OF WHAT IS ALREADY WRITTEN DOWN, and not of the
   caller. bkTouch() is called by seven save functions with no argument -- it
   has always been 「something changed」 and nothing more -- so this compares
   each slice against `langWasKey`, which is what this phone and the server
   last agreed it was. A slice equal to that has nothing to say. That record
   is kept for the merge above and is exactly the question being asked here,
   so nothing new is stored to answer it.

   ONE BURST IS ONE SEND. Every letter drawn and every word added calls a
   save, and NET_UPMS of quiet is what separates 「still typing」 from
   「stopped」. Not zero: a person adding ten words would otherwise open ten
   requests, and the tenth would be racing the first.

   Fired and never waited for, like everything else here. Nobody is shown a
   spinner for a save -- the language is on this phone the moment it is
   written, and this is the copy that outlives the phone catching up. */
var NET_UPMS=1200, NET_UPT=null;
function netSaveUp(){
  if(NET_UPT){ clearTimeout(NET_UPT); NET_UPT=null; }
  if(!netSignedIn() || !langId || !langMine(langId)) return;
  NET_UPT=setTimeout(netSaveUpGo, NET_UPMS);
}
/* ---- AND WHEN A PERSON PRESSED THE BUTTON, THE BUTTON WAITS ---------------
   「後通信なくても文字書いて保存できたけど、これって消えない？
     普通ボタン押したら通信できませんになるはずだよね？」 OWNER 2026-09-05.

   They are right, and it is the same road with the wait taken off it. Above
   is the burst: every letter drawn and every word typed calls save(), and
   NET_UPMS of quiet is what separates 「still typing」 from 「stopped」.
   Nobody presses anything for those and nobody is waiting for an answer.

   A SAVE BUTTON IS NOT A BURST. Somebody pressed it and is standing there.
   Pressed on 2026-09-05: Save on the drawing screen moved the screen and said
   「保存しました」 with not one request yet sent -- the send was 1.2 seconds
   behind a person who had already left, and the pop, when it came, was over a
   screen they were no longer on. 「通信エラーなら進むわけねえだろ全部」.

   So this is the same netSaveUpGo() and NOT a second road up: the timer is
   dropped, the send happens now, and `done` is told whether it landed. There
   is one place a slice goes up and this does not become the second one. */
function netSaveNow(done){
  if(NET_UPT){ clearTimeout(NET_UPT); NET_UPT=null; }
  netSaveUpGo(done);
}
/* `done(ok)` when anybody asked for one, and `done` is also how this function
   tells the two callers apart: the burst above passes none and is nobody's
   question, netSaveNow() passes one and is a person standing in front of a
   button they have just pressed.

   THE ANSWER TO A PRESS IS THE WIRE AND NOTHING ELSE.
   「保存ボタン押して保存ができるかできないかは通信の有無だけだからな？」
   OWNER 2026-09-05.

   Every way out of here used to say `done(true)` -- a slice that had not
   moved, a language that is not this account's to write -- on the grounds
   that those are not a network being down. That reasoning is right about the
   burst and wrong about a press: it is the difference between 「there was
   nothing to send」 and 「it is saved」, and the button says the second one.
   With the phone in flight mode the profile screen therefore saved, said so,
   and went back, having touched nothing.

   So there are two exits and no third. Signed OUT is the one road that is
   still true without asking: there is no server for this phone yet, the
   language lives here, and nothing was ever going to go up. Everything else
   asks -- either by sending what moved, or, when nothing moved, by putting
   the smallest question this account has to the server through none() below
   and letting the answer stand for the press. */
function netSaveUpGo(done){
  var id=langId, kinds=[], i, k, mine, was;
  NET_UPT=null;
  function no(d, s, m){
    NET_SYNCING=false;
    netPop(d, s, m, netSaveUpGo);
    if(done) done(false);
  }
  /* Nothing to send, and somebody pressed. The wire is the question, so the
     wire is asked: one row of one column, the cheapest thing this account can
     ask for, and its content is not read. A failure lands in `no` and is
     therefore the same pop and the same 再接続 as every other failed save. */
  function none(){
    if(!done) return;
    netGet('/rest/v1/language?select=id&limit=1', function(){ done(true); }, no);
  }
  /* Already going up. A second send on top of the first would race it. */
  if(NET_SYNCING){ if(done) done(true); return; }
  /* No account: the language is on the phone and has nowhere else to be. */
  if(!netSignedIn()){ if(done) done(true); return; }
  if(!id || !langMine(id)){ none(); return; }
  for(i=0;i<SLICES.length;i++){
    k=SLICES[i];
    mine=slMine(langKeyOf(id, k));
    was=slMine(langWasKey(id, k));
    if((mine===null? '' : mine)!==(was===null? '' : was)) kinds.push(k);
  }
  if(!kinds.length){ none(); return; }
  NET_SYNCING=true;
  netLangRow(id, function(sid){
    /* Only the slices that moved, and of those only the bodies the server
       has changed since this phone last agreed -- netGotFor() above is the
       one place that decides which those are, and the launch road asks it
       the same question. */
    netGotFor(id, sid, kinds, send, no);

    /* ---- THE SLICES THAT MOVED GO TOGETHER --------------------------
       「なんか全体的に遅くない？」 OWNER 2026-09-08 (143). This was a walk
       too: one slice up, wait, the next. A save that touched three of them
       was three round trips one after another and measured four deep with
       the read in front of it (tools/slow-check.mjs). None of the three
       needed either of the others' answers -- netLangSync1() above has the
       whole of why.

       A SLICE THAT DID NOT LAND STILL DOES NOT AGREE. It used to stop the
       ones behind it as well; they are already in the air now, and each
       still records its own agreement or does not -- so pressing save again
       sends what is still missing, exactly as before. What a PERSON is told
       is one pop and not three: the first fall is the answer and the rest
       are the same network. */
    function send(there){
      var left=kinds.length, fell=false, i;
      function one(){
        if(fell || --left) return;
        NET_SYNCING=false;
        if(done) done(true);
      }
      function stop(d, s2){
        if(fell) return;
        fell=true;
        no(d, s2, '');
      }
      for(i=0;i<kinds.length;i++)
        netSlice1(id, sid, kinds[i], there[kinds[i]], one, stop);
    }
  }, no);
}
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
/* NOT 「WHOSE IS IT」 BUT 「MAY THIS PHONE PUT IT UP」, and they are different
   questions on exactly one language: the one the walk made.

   `language.owner` naming SOMEBODY ELSE is the whole of the refusal, and it is
   asked directly rather than through langWhose(): that one also answers
   「has this account taken it」, off `language_take`, and at the door
   netLangSync() runs before netTakes() has answered -- so a language of
   somebody else's would be 「nobody has said」 for the length of one round
   trip, which is exactly the round trip this walks in.

   A language with NO owner at all IS sent, and that is the road to the answer
   rather than a hole in it: it has never been anywhere, and the insert is what
   finds out. netLangRow() above refuses one the server already holds for
   somebody else (`own && own!==me`, and the row ask that settles it), so what
   this cannot do is hand A's language to B.

   The walk is why. A language is made before there is an account
   「オンボーディング→最後にログイン」, so at the door the thing that has to go
   up is precisely the one nobody has said whose it is. Asking 「is it mine」
   here closed the only road out of that: nothing was sent, so no row was
   made, so no owner came back, so nothing was ever sent. */
function langMineIds(){
  var out=[], id, own, me=String((SESS && SESS.uid)||'');
  if(langId && !(langOwnOf(langId) && langOwnOf(langId)!==me)) out.push(langId);
  for(id in LANGS){
    if(!Object.prototype.hasOwnProperty.call(LANGS, id)) continue;
    if(id===langId) continue;
    own=langOwnOf(id);
    if(own && own!==me) continue;
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
    /* THE SECOND READ OF THE WHOLE LANGUAGE, and it is on every launch.
       netLangsWalk() has just brought this language down and recorded what
       the two sides agreed; this then read all twelve bodies again to merge
       them against themselves -- 1.75 MB of a 1.87 MB launch on a 5,000-word
       language, half of it for nothing. docs/reports/cost-2026-09-09.md 二.
       netGotFor() asks the marks first, so a slice the two sides already
       agree on costs nothing here. */
    netGotFor(id, sid, SLICES, function(there){
      /* ---- ALL TWELVE AT ONCE, NOT ONE AFTER ANOTHER --------------------
         「なんか全体的に遅くない？」 OWNER 2026-09-08 (143). This was a walk:
         slice one went up, and only when its answer came back did slice two
         go. Measured with tools/slow-check.mjs, that made a launch EIGHT
         round trips deep and a save four -- and not one of the twelve
         questions needed any of the others' answers.

         They are independent by construction. Each one merges what this
         phone has against what the server has for THAT kind, writes its own
         key, and records its own agreement; nothing in netSlice1() reads
         another slice. So the order was never load-bearing -- it was a `for`
         loop that happened to be written with a callback in it.

         WHAT A FAILURE MEANS IS UNCHANGED. It stopped the walk before, so
         the ones already up stayed up and the rest were not sent; now the
         rest are already in the air, and each one still records its own
         agreement or does not. Either way the next save sends what is still
         missing, which is what netAgreed() is for. */
      var left=SLICES.length, moved=false, i;
      function step(){
        /* The last one in is the one that goes on. Each of the twelve calls
           this exactly once, whichever way it went. */
        if(--left) return;
        if(moved && id===langId){
          /* Something came back, so what the screens are holding is older
             than what is in storage. Read it in the way langOpen() does
             rather than patching each global by hand.
             ONLY for the open one: the globals are 「the language in front
             of me」, and filling them from another language is that language
             appearing on the screen somebody is standing on. */
          langLoad();
          render();
        }
        /* Whether this language's page may be read by anybody else USED TO
           BE SENT FROM HERE, once a launch, out of the phone's own `hide`.
           It is not sent at all any more: the answer is the server's column
           and this road only ever READS it (netLangsDown, netLangBack).
           「端末に hide の存在があるわけないやろ」 OWNER 2026-09-08. */
        done(moved);
      }
      for(i=0;i<SLICES.length;i++)
        netSlice1(id, sid, SLICES[i], there[SLICES[i]], function(m){
          if(m) moved=true;
          step();
        }, /* A LAUNCH WALKS ON, and it did before `bad` existed too -- this
              is that same behaviour, written where it is chosen rather than
              buried in netSlice1(). The launch is its own one of the four
              places a pop comes from and www/boot.js already holds it; what
              this line has not been pressed about is a launch where the
              slices are the only thing that fails. Whoever presses that
              decides it. */
           function(){ step(); });
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
  /* WHAT OTHER PEOPLE DID TO IT, which is the half that never came back.
     「当たり前だけどsnsとして機能してない」 OWNER 2026-09-01.

     netMark() has posted into `react` and deleted out of it since there were
     reactions, and there was NO GET OF /rest/v1/react ANYWHERE. So a like
     went up on the phone that pressed it and nowhere else: another phone
     opening the same timeline saw nothing, and the phone that pressed it saw
     its own number only until it forgot. feed_hot() in supabase/schema.sql
     was already counting these to ORDER by them and throwing the numbers
     away, which is the whole shape of it -- the data, the query and the
     answer all existed and nobody asked.

     They are on `post_seen` now, so BOTH lists carry them and this one
     function puts them on a post whichever list it came from.

     `n` and `i` and not one number each: how many is a fact about the post,
     and whether YOU are one of them is a fact about the reader, and a phone
     that worked the second out of the first would be guessing. Absent rather
     than zero where the server did not say -- an old row, a list that has
     not got them -- because `0 likes` and `nobody has said` are different
     things and a post claiming the first is a post saying something it was
     never told. */
  if(r.likes!==undefined && r.likes!==null)     p.nlike=Number(r.likes)||0;
  if(r.boosts!==undefined && r.boosts!==null)   p.nboost=Number(r.boosts)||0;
  if(r.replies!==undefined && r.replies!==null) p.nreply=Number(r.replies)||0;
  if(r.i_like!==undefined)  p.ilike=!!r.i_like;
  if(r.i_boost!==undefined) p.iboost=!!r.i_boost;
  /* WHO PASSED IT ON, and when it reached you. Only feed_fo() says either --
     a post from any other list has no `by` and is not a boost, which is why
     this is absent rather than null: 「nobody passed this on」 and 「this list
     does not answer that question」 are different, and a row claiming the
     first when it means the second is the app inventing a fact. */
  if(r.by) p.by=String(r.by);
  if(r.at_key) p.arrived=Date.parse(r.at_key) || p.at;
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
          /* And what other people did to it. Written since there were
             reactions and read back by nobody -- see netRow(). */
          ',likes,boosts,replies,i_like,i_boost'+
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
  /* THE DAY'S ANSWERS. 「絞り込みに「#今日のお題」を足す。その行を選ぶと、
     その日のお題に答えた投稿だけ」 OWNER 2026-09-06.

     `prompt` is a column on the post with a key behind it and an index over
     it (`post_prompt_idx` in supabase/schema.sql), so this is the plain row
     question the other two lists are not: no score, no follow list, just the
     posts carrying today's id, newest first.

     A request that asked for one day's answers by the prompt's id was here
     until 2026-09-04 and was taken out with the tag mechanism it belonged to
     -- 「しかも何で検索が今日しか出ないの？」: it was answering a SEARCH,
     which has to reach every day there is, and a search is netFindPosts()'s.
     This one is not a search. It is a timeline of one day, chosen by name on
     the filter page, and the id it needs is the row this phone already holds.

     No prompt in hand is 「could not ask」 and not an empty day: `null` leaves
     the road askable, the way the followed timeline does signed out. */
  if(which==='day'){
    var pid=(typeof dayId==='function')? dayId() : 0;
    if(!pid){ ok(null); return; }
    pull('&prompt=eq.'+encodeURIComponent(String(pid)));
    return;
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
  /* WHAT THEY WROTE AND WHAT THEY PASSED ON, which is one list and is now one
     question -- feed_fo() in supabase/schema.sql.

     It was `author=in.(the people you follow)`: posts they WROTE and nothing
     else. A boost is a row in `react` and not a post, so **boosting did
     nothing to anybody's timeline** -- the row went in, the number went up,
     and the post it pointed at reached nobody who was not already going to
     see it. That is not a boost.

     The follow list is no longer asked for here: the server has it and
     auth.uid() is who this is, so a phone that fetched its own follow list in
     order to hand it back to the same server was a round trip saying nothing.

     `more` is still a keyset and is now `at_key` -- WHEN IT REACHED YOU,
     which is the boost's time for a boost. Sorting a passed-on post by when
     it was written would file a five year old thing where nobody will scroll. */
  netSend('POST', '/rest/v1/rpc/feed_fo',
          {lim:NET_PAGE, before:more? String(more) : null}, SESS.at,
    function(d){
      /* Blocked accounts come out here rather than in the question, the same
         way feed_hot()'s do: one place that knows what a block does to a
         list. A boost BY somebody blocked goes too, not only a post by them
         -- being passed something on by somebody you blocked is still hearing
         from them. */
      netBlocked(function(bl){
        var out=[], i, skip={}, r;
        for(i=0;i<bl.length;i++) skip[bl[i]]=1;
        for(i=0;i<(d||[]).length;i++){
          r=d[i]||{};
          if(skip[r.author] || (r.by && skip[r.by])) continue;
          out.push(netRow(r));
        }
        ok(out);
      });
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

   Reading a follow needs no account (`follow_read` is `using (true)`): who
   follows whom is public, the way it is in every timeline. Signed out there
   is nobody to have followed anybody, and the answer is `null` -- could not
   ask -- rather than an empty list. */
/* WHOSE LISTS THESE ARE, which was always「mine」and could not be anything
   else. 「当たり前だけどsnsとして機能してない」 OWNER 2026-09-01.

   `follow` was written for anybody and read back only about YOURSELF: every
   request said `follower=eq.<me>` or `followed=eq.<me>`. So a person's page
   can now say HOW MANY (profile_seen counts them) and there was still no way
   to ask WHO -- tapping the number had nowhere to go.

   ---- AND IT IS ONE REQUEST NOW, NOT TWO ---------------------------------
   「他人のフォロー／フォロワーとか見る時すんごいくるくる回ってる」 OWNER
   2026-09-08 (143). The list was asked in two round trips: netWhoseId() took
   the handle to the server and brought back a uuid, and only then could the
   rows be asked for. The first one carried nothing anybody wanted -- it
   existed because `follow` is keyed by uuid and this app speaks handles.

   `follow_seen` (supabase/schema.sql) is that row with both names on it, so
   the question goes in the words the phone already has. It is a view and not
   an embed for the reason the language beside a person is: what a screen may
   ask for should not depend on which foreign key PostgREST can walk today.

   TWO KEYS AND ONE QUESTION. Somebody else's list is asked by handle, which
   is the only thing one person knows another by; YOUR own is asked by the
   uuid in the session, because that is what a session carries and a phone
   whose handle has not come down yet still has one. Neither is a second
   road: it is the same view, the same filter, and the identifier that is in
   hand.

   Reading needs no account -- `follow_read` is `using (true)`, who follows
   whom is public the way it is in every timeline -- and signed out, with no
   handle to ask about, there is nobody to have followed anybody: the answer
   is `null`, 「could not ask」, rather than an empty list. */
/* A HANDLE TURNED INTO THE ACCOUNT'S UUID, and one thing still needs it:
   somebody's own posts (netWhoPosts below), because `post.author` is keyed by
   uuid and there is no view standing between them. The follow lists used to
   come through here and do not any more -- `follow_seen` is asked by handle,
   which is one round trip fewer on the screen the owner was looking at. */
function netWhoseId(handle, ok, bad){
  var h=String(handle||'');
  if(!h){
    if(!netSignedIn()){ bad(null, 0, 'whose −'); return; }
    ok(SESS.uid); return;
  }
  netGet('/rest/v1/profile?select=id&limit=1&handle=eq.'+encodeURIComponent(h),
    function(d){
      if(!d || !d.length){ bad(null, 0, 'whose −'); return; }
      ok(String(d[0].id||''));
    }, bad);
}
function netFollowRows(want, by, ok, bad, handle){
  var h=String(handle||''), q;
  /* WHOSE, and it is the identifier that is in hand. Somebody else's list is
     asked by handle -- the only thing one person knows another by; your own
     by the uuid in the session, because that is what a session carries and a
     phone whose handle has not come down yet still has one. Neither is a
     second road: the same view, the same filter. */
  if(h) q='&'+by+'_handle=eq.'+encodeURIComponent(h);
  else if(netSignedIn()) q='&'+by+'=eq.'+encodeURIComponent(SESS.uid);
  else { bad(null, 0, 'whose −'); return; }
  /* ---- AND THERE ARE TWO ANSWERS, NOT THREE -----------------------------
     「人のプロフィールからフォロワー見ようとするとずっとくるくるするんだって」
     OWNER 2026-09-08.

     There was a third. `netWhoseId()` turned the handle into a uuid before
     this could be asked at all, and when it could not, BOTH its failures --
     the request falling over, and the handle having no row -- came back here
     as `ok(null)`: neither an answer nor a fall. folPull() (www/me.js) wrote
     nothing down for it and left the ask marked as MADE, so the screen opened
     on a mark that turned for ever and never asked again. Measured
     2026-09-08 through the real road: the screen opened, the mark turned, no
     pop, and walking back into it made ZERO requests.

     A list is `[]` or longer, and anything else falls -- which is the pop
     with ［再更新］ behind it, and folPull() unmarks the ask so it CAN be
     asked again. THE EMPTY LIST IS AN ANSWER AND IS DRAWN AS ONE: nobody
     follows a handle that has no account, which is also true and is what the
     row of the list already says. Nothing here asks whether that person
     exists -- it is a second request for a sentence this app does not have,
     and the screen was reached by pressing their name. */
  netGet('/rest/v1/follow_seen?select='+want+'_handle'+q,
    function(d){
      var out=[], i, hd;
      for(i=0;i<(d||[]).length;i++){
        hd=(d[i] && d[i][want+'_handle']) || '';
        if(hd) out.push(String(hd));
      }
      ok(out);
    }, bad);
}
function netFollowing(ok, bad, handle){
  netFollowRows('followed', 'follower', ok, bad, handle);
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
   it is in every timeline. */
function netFollowers(ok, bad, handle){
  netFollowRows('follower', 'followed', ok, bad, handle);
}
/* ---- ONE ROW JOINING YOU TO SOMEBODY, BY HANDLE -------------------------
   A follow and a block are the same shape and were written out twice, 1100
   lines apart, with the second of them carrying the comment 「the uuid is
   looked up here exactly as netFollow() does」 -- which is the duplication
   naming itself.

   A handle and not an id, because a handle is what one person knows another
   by. The table and its two columns are the argument: `follow` is
   (follower, followed), `block` is (actor, blocked). `on` is whether the row
   is there afterwards.

   Not waited on: the button has already changed, the same way a like has.

   A handle with no account behind it is `ok()` and not a fall -- there is no
   row to make and nothing went wrong -- while a request that FELL falls, so
   the screen can say so. That is why netWhoseId() above is not asked for the
   uuid even though it sends this very query: it answers both of those with
   the same `bad`, so a follow whose request fell over would come back here
   as a handle nobody has, and the button would report a success that never
   happened. Three places send `profile?select=id&handle=eq.` and this is
   two of them; docs/DUPLICATES.md 14 says so rather than leaving it here. */
function netPairRow(tab, mine, theirs, handle, on, ok, bad){
  if(!netSignedIn() || !handle){ ok(); return; }
  netGet('/rest/v1/profile?select=id&limit=1&handle=eq.'+encodeURIComponent(handle),
    function(d){
      var who=(d && d.length)? d[0].id : '', row;
      if(!who){ ok(); return; }
      if(on){
        row={};
        row[mine]=SESS.uid; row[theirs]=who;
        netSend('POST', '/rest/v1/'+tab, row, SESS.at, function(){ ok(); }, bad);
        return;
      }
      netSend('DELETE', '/rest/v1/'+tab+'?'+mine+'=eq.'+encodeURIComponent(SESS.uid)+
              '&'+theirs+'=eq.'+encodeURIComponent(who), null, SESS.at,
              function(){ ok(); }, bad);
    }, bad);
}
/* ---- keeping somebody away from you ------------------------------------
   A block one phone knows about is not a block: the other person's posts have
   to stop arriving, so it is a row on the server and the timeline asks about
   it. `block_read` in schema.sql answers with YOUR rows only -- being blocked
   is not something a person is told. */
function netBlock(handle, on, ok, bad){
  /* The copy above is now wrong whichever way this goes. */
  netBlockedDrop();
  netPairRow('block', 'actor', 'blocked', handle, on, ok, bad);
}
/* The uuids you have blocked, for the one thing that needs uuids: keeping
   their posts out of a timeline. Signed out there is nobody to have blocked
   and the answer is none, which is not a failure.

   ---- AND IT IS ASKED ONCE, AT THE OPEN ------------------------------------
   「アプリ開くタイミングで通信入るなら全部一気に入るやろ」 OWNER 2026-09-05.

   It was asked EVERY TIME a timeline was, and asked FIRST -- netFeed() above
   waits for this answer before it puts its own question, so every page of
   every timeline cost two round trips end to end and the posts could not
   arrive until both had. Measured on a launch: feed_hot went out, and the
   block list went out 1.2 seconds later, off the back of it.

   So the list is fetched like everything else the app needs -- once, when it
   opens, through the pull table (`blocks`, www/sns.js) -- and this answers
   out of `NET_BL` when it is held. A timeline is one question again.

   `NET_BL` is null for 「nobody has asked」 and an ARRAY for 「asked」, empty
   or not, which is the same distinction everything else on this branch makes.
   Not asked yet, this falls back to asking -- so a timeline reached before
   the open's answer lands is still right, it is only slower. */
/* AND THE SAME ANSWER IN THE FORM A SCREEN ASKS IN. `block` is keyed by uuid
   -- that is what a row about an account IS -- and the timeline needs uuids,
   because a post carries its author's id. A SCREEN knows a person by their
   HANDLE: 「this person, blocked or not」 is what the ... menu asks to decide
   which word goes on the row.

   It was `ME.bl` on the phone, written only when somebody pressed the row and
   with no road to fill it from the server -- so on a second phone it was
   empty, and the menu offered to block somebody who was already blocked while
   the timeline correctly kept them out. 「NOTHING IS THE PHONE'S. EVERYTHING
   IS THE ACCOUNT'S.」

   The handles come off `profile_seen`, asked for the ids that just came back,
   and the two are set TOGETHER in netBlockedRead() below: one road, one
   answer, two forms of it. `null` is 「not asked」 for both. */
var NET_BL=null, NET_BL_HD=null, NET_BL_WAIT=null;
function netBlockedGot(){ return !!NET_BL; }
/* The handles, for a screen. `null` (not asked) answers as none: a button
   that said 「blocked」 before the list came down would be this phone saying
   something the server has not said. */
function netBlockedHandles(){ return NET_BL_HD || []; }
/* ONE REQUEST, HOWEVER MANY ARE WAITING ON IT. The open asks for this list
   and the timeline asks for it in the same moment -- feed_hot and this go out
   together -- so without somewhere to wait, the second caller found `NET_BL`
   still empty and put the identical question a second time. Measured on a
   launch: two block requests, and the timeline waiting on the later one.

   `NET_BL_WAIT` is that somewhere. It exists only while a request is out, and
   everybody holding a place in it is answered from the one reply. */
function netBlockedRead(ok, bad){
  var i, who;
  if(!netSignedIn()){ NET_BL=[]; NET_BL_HD=[]; ok([]); return; }
  if(NET_BL_WAIT){ NET_BL_WAIT.push({ok:ok, bad:bad}); return; }
  NET_BL_WAIT=[{ok:ok, bad:bad}];
  /* WHO IT WAS ASKED FOR, held while the answer is out. Signing out with this
     in the air would otherwise let the old account's list land afterwards and
     be kept as the new one's -- the same shape netTook() guards meFor() and
     postFor() against, one file over. The waiters are still answered, with
     none, because a caller left hanging is worse than a caller told nothing. */
  who=SESS.uid;
  /* Both forms land in one place, so 「asked」 is one fact rather than two
     that can come apart. */
  function done(ids, hd){
    var w=NET_BL_WAIT, j;
    NET_BL_WAIT=null;
    if(netSignedIn() && SESS.uid===who){ NET_BL=ids; NET_BL_HD=hd; }
    else ids=[];
    for(j=0;j<w.length;j++) w[j].ok(ids);
  }
  netGet('/rest/v1/block?select=blocked&actor=eq.'+encodeURIComponent(who),
    function(d){
      var out=[];
      for(i=0;i<(d||[]).length;i++) if(d[i] && d[i].blocked) out.push(d[i].blocked);
      /* AND WHAT THOSE IDS ARE CALLED. The uuid is what the timeline filters
         on and the handle is what a screen knows a person by, and asking the
         server for both is what makes the second one the account's rather
         than this handset's. `profile_seen` is the row a person is drawn
         from everywhere else in this file.

         The waiters are answered either way. A handle that does not come back
         -- a deleted account, a row a policy refuses -- is one this app
         cannot name, and the block is still a block: the uuid is in the list
         and the posts stay out. */
      if(!out.length){ done(out, []); return; }
      netGet('/rest/v1/profile_seen?select=id,handle&id=in.('+netInList(out)+')',
        function(pd){
          var hd=[], j;
          for(j=0;j<(pd||[]).length;j++)
            if(pd[j] && pd[j].handle) hd.push(String(pd[j].handle));
          done(out, hd);
        },
        function(){ done(out, []); });
    },
    function(d, s, m){
      var w=NET_BL_WAIT;
      NET_BL_WAIT=null;
      for(i=0;i<w.length;i++) w[i].bad(d, s, m);
    });
}
/* Blocking or unblocking somebody makes the copy wrong, and it is the one
   thing that can. Dropped rather than re-asked: netBlock() below already
   renders when the row lands, and the next timeline fetches it. */
function netBlockedDrop(){ NET_BL=null; NET_BL_HD=null; }
function netBlocked(ok){
  if(NET_BL){ ok(NET_BL); return; }
  netBlockedRead(ok, function(){ ok([]); });
}
/* Something is wrong with this post, or with this person. Written and never
   read back: there is no select policy on `report` at all, so nobody using
   the app can read one -- not the person who wrote it and not the person it
   is about. It goes to whoever is looking at the dashboard.

   `why` is one of the five the schema allows. A reason invented here would be
   refused by the check constraint, which is the right way round: the list of
   reasons is the server's. */
function netReport(what, why, note, ok, bad){
  if(!netSignedIn()){ bad(null, 0); return; }
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
/* The one account above staff, by name. The same word supabase/schema.sql
   says in is_admin() and profile_first(), and the same one www/onboard.js
   follows every new account to (OB_LINGUA) -- it is the account's NAME, so it
   is written out rather than asked for. */
var ADMIN_HANDLE='lingua';
/* WHICH ACCOUNT THE THREE ABOVE ARE ABOUT, so that asking again costs
   nothing and signing in as somebody else does not.

   The comment below has said 「asked once and remembered」 since it was
   written and there was nothing keeping either half of it: the once was one
   call site in www/boot.js, and the remembering was three variables nobody
   ever put down. netOut() clears this, so the same account signing back in
   ASKS AGAIN -- which is what a guard keyed on the uid alone would refuse,
   and refusing it is the bug this was written for. */
var NET_STAFF_UID='';
function netStaffForget(){
  NET_STAFF=false; NET_ADMIN=false; NET_BANNED=''; NET_STAFF_UID='';
}
/* Asked once a session, and remembered. A screen that asked every time it
   was drawn would put a request behind every render. */
/* One request, because it is one row and the app wants three things off it:
   whether this account answers the reports, whether it decides who does, and
   whether it has been ejected. The last is not something the app could work
   out otherwise -- every write would simply be refused, and "the server said
   no" is not a sentence anybody can act on. */
function netStaff(ok){
  ok=ok||function(){};
  if(!netSignedIn()){ netStaffForget(); ok(false); return; }
  /* Already answered for this account, this session. */
  if(NET_STAFF_UID===String(SESS.uid)){ ok(NET_STAFF); return; }
  NET_STAFF_UID=String(SESS.uid);
  netGet('/rest/v1/profile?select=staff,handle,banned_at,banned_why&limit=1&id=eq.'+
         encodeURIComponent(SESS.uid),
    function(d){
      var r=(d && d.length)? d[0] : null;
      NET_STAFF=!!(r && r.staff);
      /* THE ONE ABOVE STAFF IS THE @ AND NOT A COLUMN.
         「＠linguaのアカウントだけ管理者ページには入れる」 OWNER 2026-08-26,
         「@で決めたんじゃないの？」 OWNER 2026-09-03.

         It read a `admin` column, which a trigger set at the instant a row
         with the handle `lingua` was inserted -- so it followed the @ once and
         was a separate fact afterwards. is_admin() in supabase/schema.sql asks
         the handle now and this is the same question asked from here, off the
         row this account already fetches. Nothing to set, nothing to forge:
         `handle` is unique and is not in the UPDATE grant.

         The curtain and the wall are still two things. This decides whether
         seven taps open anything; admin_counts(), staff_add() and staff_drop()
         each ask is_admin() on the server, and that is what actually stops
         somebody sending their own requests. */
      NET_ADMIN=!!(r && String(r.handle||'')===ADMIN_HANDLE);
      /* The reason if there is one, and a space if there is not, so that the
         string is true-y whenever the account is banned and the screens can
         ask one question instead of two. */
      NET_BANNED=(r && r.banned_at)? (String(r.banned_why||'') || ' ') : '';
      ok(NET_STAFF);
    },
    /* No answer is not 「this account is nobody」. The mark goes with it, so
       the next thing that asks asks the server rather than reading a false
       this call never got. */
    function(){ netStaffForget(); ok(false); });
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
/* THE `@` A PERSON TYPES, AND IT HAS TWO SPELLINGS ON A PHONE.
   -------------------------------------------------------------------------
   `@` is how somebody says "this is a person" out loud. It is not part of
   what a handle IS -- `profile.handle` in supabase/schema.sql is
   `^[a-z0-9_]{2,24}$`, so no handle has ever held one -- and it comes off
   before anything is asked of the server.

   It used to ask whether the first character was U+0040, and that is the
   wrong question rather than half of the right one. The `@` on a Japanese
   keyboard is U+FF20, the full-width one, and it is what the owner types:
   `＠aya` went out as `handle.ilike.*＠aya*`, which `^[a-z0-9_]{2,24}$` can
   never match, so the answer was nobody -- on the same field, with the same
   complaint, that the half-width one was fixed for on 2026-08-25.
   「@で検索しても出てこない」 OWNER 2026-09-03.

   Off the FRONT only. An `@` in the middle of what somebody typed is a
   character they typed.

   THIS IS THE ONE PLACE, and it is one because netHandleOf() below and
   snsFind() in www/sns.js had each written the rule out for itself -- the
   shape CLAUDE.md § One place, not fifteen is about, where a comment claims
   to be the one place and a second copy is living somewhere else. Mending
   only the copy here would have left the search still reading the front of a
   query its own way. */
function netAtOff(s){
  return String(s||'').replace(/^[@＠]+/, '');
}
/* One place, because both of the above and the screen that lists them would
   each have written it out. A handle is lower case in the schema's own check
   constraint, so typing one with a capital in it is a person typing a name
   rather than a person getting it wrong.

   Lower case and no spaces are what a HANDLE is, which is a different
   sentence from what the `@` is -- so they stay here and the `@` is
   netAtOff()'s. The search is why the two are apart rather than one call:
   netFindWho() matches `display` as well, and a display name is somebody's
   spaces and somebody's capitals.  */
function netHandleOf(s){
  return netAtOff(s).toLowerCase().replace(/\s+/g, '');
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
   about instead.

   `actor(handle)` is who WROTE it, read the same way -- the column is
   `report_actor_fkey` to profile, and a report whose author has deleted their
   account carries a null there (schema.sql says `on delete set null`), which
   comes back as an empty handle rather than as a row that cannot be drawn. */
function netReports(ok, bad){
  if(!netSignedIn()){ bad(null, 0); return; }
  netGet('/rest/v1/report?select=id,why,note,created_at,'+
         'post(id,body,hidden_at,author(id,handle,banned_at)),'+
         'who(id,handle,banned_at),'+
         'actor(handle)'+
         '&order=created_at.desc&limit='+NET_PAGE,
    function(d){
      var out=[], i, r, po, au, by;
      for(i=0;i<(d||[]).length;i++){
        r=d[i]||{}; po=r.post||null; by=r.actor||null;
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
                   by:(by && by.handle) || '',
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
/* AND THE REPORT ITSELF, WHICH IS THE ONE THING HERE THAT REALLY DELETES.
   「通報で問題なかったらその通報が消せるようにしてほしい」 OWNER 2026-09-05.

   The two above take a post down and put it back, and both are reversible
   because a report is about somebody and a decision about somebody has to be
   one you can look at again. This is the other answer: there was nothing
   wrong, so there is nothing left to keep, and the row goes.

   `r` and not `p`, and a number and not a uuid: report.id is `generated
   always as identity` where post and profile are uuid, so the two do not take
   the same kind of name however alike they read -- supabase/schema.sql at
   report_drop(). is_staff() is asked there and not here: this file is a
   suggestion and the function is the wall. */
function netReportDrop(id, ok, bad){
  if(!netSignedIn() || !id){ bad(null, 0); return; }
  netSend('POST', '/rest/v1/rpc/report_drop', {r:id},
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
/* WHAT COLUMNS A PERSON IS, and one place says so, because two requests ask
   for them: one person by handle, and many people at once. A `select=` written
   out twice is two lists that come to differ, and the one that differs is the
   one nobody is looking at. */
var NET_WHO_SEL='/rest/v1/profile_seen?select=id,handle,display,av,bio,link,loc,banned_at,fo,fr,lang_id,lang_name,lang_pub';
/* And one place turns a row into a person, for the same reason. */
/* THE LANGUAGE IS ON THE ROW AND IS NOT A SECOND REQUEST.
   「なんか全体的に遅くない？」 OWNER 2026-09-08 (143). It used to be
   netLangNames(): `language` asked by owner AFTER the people had come back,
   which is a second round trip that every screen showing a list of people
   paid. supabase/schema.sql § profile_seen holds the join now and says why it
   could not be a PostgREST embed.

   `lname` is still '' where the row says nothing, which is what a person with
   no language -- or none anybody else may see -- has always looked like. */
function netWhoRow(r){
  r=r||{};
  return {who:String(r.display||''), hd:String(r.handle||''),
          av:r.av||null,
          lname:String(r.lang_name||''),
          lid:String(r.lang_id||''), lpub:!!r.lang_pub,
          bio:String(r.bio||''),
          /* And the two beside it. A phone whose server does not answer with
             them yet gets '' and draws no row, exactly as it does today. */
          link:String(r.link||''), loc:String(r.loc||''),
          fo:(r.fo===undefined || r.fo===null)? undefined : (Number(r.fo)||0),
          fr:(r.fr===undefined || r.fr===null)? undefined : (Number(r.fr)||0),
          out:!!r.banned_at};
}
/* MANY PEOPLE, IN ONE REQUEST.
   -------------------------------------------------------------------------
   「ユーザーもアイコンとか？になってあとで表示されるけど、なんで？毎回1読み込み
   だろ？」 OWNER 2026-09-07, on a phone.

   Measured the same day: a follow list of two people put out TWO requests,
   one per person, and drew two '?' faces until they came back. A list of
   twenty is twenty requests. It was netWho() called once per row from inside
   a RENDER, which is the only shape that was ever available -- there was no
   way to ask about more than one person.

   `handle=in.(...)` is that way. A handle is [a-z0-9_] (supabase/schema.sql),
   so a comma is a safe join and nothing has to be escaped back out; the
   encode is here anyway, because 「it cannot contain one」 is a fact about the
   server that this file should not be built on.

   ONE REQUEST AND NOT TWO. The language beside each person used to be a
   second one -- `language` asked by owner once the people had come back --
   so a screenful of people cost two round trips one after the other. It is
   a column of `profile_seen` now (supabase/schema.sql), which says why the
   join has to be made there rather than asked for as an embed. So a
   screenful of people is ONE request whatever the screenful is.

   It answers with a map from handle to person, and a handle nobody has a row
   for is simply not in it -- 「nobody by that name」 is an answer and it is
   the same one netWho() gives. */
function netWhoMany(handles, ok, bad){
  var want=[], seen={}, i, h;
  for(i=0;i<(handles||[]).length;i++){
    h=String(handles[i]||'');
    if(h && !seen[h]){ seen[h]=1; want.push(encodeURIComponent(h)); }
  }
  if(!want.length){ ok({}); return; }
  netGet(NET_WHO_SEL+'&handle=in.('+want.join(',')+')&limit='+want.length,
    function(d){
      var by={}, j, who;
      for(j=0;j<(d||[]).length;j++){
        who=netWhoRow(d[j]);
        if(!who.hd) continue;
        by[who.hd]=who;
      }
      ok(by);
    }, bad);
}
function netWho(handle, ok, bad){
  var h=String(handle||'');
  if(!h){ bad(null, 0); return; }
  /* `profile_seen` and not `profile`: it is the same row with the two numbers
     a page is made of counted beside it -- see supabase/schema.sql. */
  netGet(NET_WHO_SEL+'&limit=1&handle=eq.'+encodeURIComponent(h),
    function(d){
      var r, who;
      if(!d || !d.length){ ok(null); return; }
      r=d[0]||{};
      /* WHAT A PERSON IS, out of the one place that says so -- netWhoRow()
         above. The line they wrote about themselves is SHOWN and there is no
         switch (「自己紹介を見せないって選択肢を俺はいつ与えた？」 OWNER
         2026-09-01); the two counts are `undefined` rather than 0 where the
         server did not say, because 「0 followers」 and 「nobody has said」 are
         different things; and `out` is `banned_at`, the same fact
         `author_out` carries onto a post. */
      /* The address of their language and whether its page is open come off
         this same row: a page a reader can go to needs both, and neither is
         worth a second round trip. */
      ok(netWhoRow(r));
    }, bad);
}
/* People. The language's name is a column of `profile_seen` and comes back
   on the same row -- supabase/schema.sql says why the join is made there. */
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
  netGet('/rest/v1/profile_seen?select=id,handle,display,av,lang_id,lang_name,lang_pub'+
         '&or=(handle.ilike.'+like+',display.ilike.'+like+')'+
         '&order=handle.asc'+
         (more? '&handle=gt.'+encodeURIComponent(String(more)) : '')+
         '&limit='+NET_PAGE,
    function(d){
      var out=[], i, r;
      for(i=0;i<(d||[]).length;i++){
        r=d[i]||{};
        /* The language comes off this same row -- supabase/schema.sql §
           profile_seen. The account's uuid does not travel with the answer:
           the shape a person comes back in is what every screen already
           draws, and an `id` on it would be a uuid reaching places that read
           a handle. */
        out.push({who:String(r.display||''), hd:String(r.handle||''),
                  av:r.av||null,
                  lname:String(r.lang_name||''),
                  lid:String(r.lang_id||''), lpub:!!r.lang_pub,
                  mine:!!(SESS && SESS.uid && r.id===SESS.uid)});
      }
      ok(out);
    }, bad);
}
/* Posts, matched on the line as it is spelled, on what it means, and on the
   name of the language it is written in. Not on the shapes: a shape is not
   something anybody can type. `body` is jsonb and `->>` is how PostgREST is
   asked for one of its fields as text. */
/* ONE POST, BY ITS SERVER ID. A notice carries the id of the post it is about
   and nothing else -- `notices()` in supabase/schema.sql sends `post`, not the
   post -- so a notice about somebody else's reply pointed at a post this phone
   had never pulled. postOpen() checked and, finding nothing, did nothing:
   pressing the row was silence. 「通知タップしても反応が悪い」 OWNER 2026-09-02.

   `post_seen` and netRow() are the same view and the same reader the timeline
   and the search already use, so what comes back is a post like any other and
   nothing here decides what one looks like. Reading needs no account --
   `post_read` in schema.sql is `using (true)`. */
/* HOW MANY, AND WHETHER YOU ARE ONE OF THEM -- ONE POST, ASKED AGAIN.
   -------------------------------------------------------------------------
   「端末に残すものないんですけど。サーバーで同じ機能になるように代替して」
   OWNER 2026-09-08.

   The numbers under a post are the server's arithmetic and nothing else
   (www/post.js § postNLike). Pressing the heart used to move a number this
   phone was keeping and send the flag afterwards; there is no number here any
   more, so the press sends and then ASKS -- and what comes back is what the
   thumb moves to.

   It is the five columns and nothing else: the body, the author and the rest
   of the post are already on the phone and are not the server's to change
   (netRow's own sentence). One small row, on a press somebody made.

   `post_seen` and netRow() again, so what a count means is written in one
   place and this is not a second reader of the same view. */
function netPostCounts(sid, ok, bad){
  var id=String(sid||'');
  if(!id){ bad(null, 0, 'post \u2212'); return; }
  netGet('/rest/v1/post_seen?select=id,author,created_at,reply_to,body,hidden_at,author_out'+
         ',likes,boosts,replies,i_like,i_boost'+
         '&id=eq.'+encodeURIComponent(id)+'&limit=1',
    function(d){ ok((d && d.length)? netRow(d[0]) : null); }, bad);
}
function netPostById(id, ok, bad){
  netGet('/rest/v1/post_seen?select=id,author,created_at,reply_to,body,hidden_at,author_out'+
         '&id=eq.'+encodeURIComponent(String(id||''))+'&limit=1',
    function(d){ ok((d && d.length)? netRow(d[0]) : null); }, bad);
}
/* THE ANSWERS TO POSTS THAT ARE ON THE SCREEN.
   -------------------------------------------------------------------------
   「ここ更新ないから見れないし」「他の人の画面でも更新できるようにしたい」
   OWNER 2026-09-04. A thread had no way to ask again: the pull answered on
   three routes and this was not one of them, and there was nothing here for
   it to have asked.

   IT TAKES THE POSTS THAT ARE DRAWN, not one. A thread shows a post and
   everything under it, so asking about the top one alone would refresh one
   level of a page that draws all of them. `reply_to=in.(...)` is one request
   for the whole of what is on the screen.

   BY THE SERVER'S NAME FOR EACH. `reply_to` holds where a post lives on the
   server, which is `sid` for something this account wrote here and the id
   itself for anything that arrived (netRow sets both) -- www/post.js
   § postIs. A post that has never gone up has no name there to be answered
   under, and the caller leaves it out rather than sending a local uuid the
   server has never seen.

   Oldest first, because a conversation reads down. `post_read` is
   `using (true)`, so this needs no account. */
function netReplies(ids, ok, bad){
  var list=[], i, s;
  for(i=0;i<(ids||[]).length;i++){
    s=String(ids[i]||'');
    if(s && list.indexOf(s)<0) list.push(s);
  }
  if(!list.length){ ok([]); return; }
  netGet('/rest/v1/post_seen?select=id,author,created_at,reply_to,body,hidden_at,author_out'+
         ',likes,boosts,replies,i_like,i_boost'+
         '&reply_to=in.('+list.join(',')+')'+
         '&order=created_at.asc&limit='+NET_PAGE,
    function(d){
      var out=[], j;
      for(j=0;j<(d||[]).length;j++) out.push(netRow(d[j]));
      ok(out);
    }, bad);
}
/* WHAT ONE PERSON HAS WRITTEN. The other half of the same sentence: their
   page drew whatever this account happened to be holding of theirs, which is
   whatever the timeline had swept up, and there was no way to ask for the
   rest or for anything newer. 「他の人の画面でも更新できるようにしたい」

   By HANDLE, because that is what a page is reached by and what every other
   request here takes; netWhoseId() turns it into the uuid `author` is keyed
   on, once, rather than in the screen. Your own handle answers with your own
   uid without a request, which is what that function already does for
   netFollowing().

   Newest first and keyset on `created_at`, the same as netFindPosts(): a
   page gains rows while somebody is reading it, and an offset would hand
   them a post twice or step over one. */
function netPostsBy(handle, ok, bad, more){
  netWhoseId(handle, function(uid){
    netGet('/rest/v1/post_seen?select=id,author,created_at,reply_to,body,hidden_at,author_out'+
           ',likes,boosts,replies,i_like,i_boost'+
           '&author=eq.'+encodeURIComponent(uid)+
           '&order=created_at.desc'+
           (more? '&created_at=lt.'+encodeURIComponent(String(more)) : '')+
           '&limit='+NET_PAGE,
      function(d){
        var out=[], i;
        for(i=0;i<(d||[]).length;i++) out.push(netRow(d[i]));
        ok(out);
      }, bad);
  }, function(){ ok(null); });
}
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
/* The request that asked for one day's answers by the prompt's id is GONE.
   「しかも何で検索が今日しか出ないの？ありえないだろ」 OWNER 2026-09-04.

   It was the second half of a tag mechanism that could only ever name
   TODAY'S prompt -- the phone holds one row, the newest -- so a tag search
   found what had been written since midnight and nothing before it.
   A tag is characters in what somebody wrote now (www/sns.js § tagHTML), and
   netFindPosts() above already matches `body->>ln` and `body->>mn` on every
   day there is. One question, one request. */
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
/* A PAGE OF WORDS SOMEBODY LOOKED FOR, AND WHICH TABLE IS THE ARGUMENT.
   The star and the history are two tables on purpose (the note under
   netRecent() below says why, and supabase/schema.sql says it again), and
   the READING of them was written out twice with nothing between them but
   the table's name and which column says when. Both answer the same three
   fields, because both lists are drawn by the same rows on the same screen.

   `when` is a column name and goes into the path, so it is this file's own
   literal at each call and never anything a person typed.

   Signed out is `[]` and not a fall: there is no account to have starred or
   typed anything, which is an answer. */
function netWordRows(tab, when, ok, bad){
  if(!netSignedIn()){ ok([]); return; }
  netGet('/rest/v1/'+tab+'?select=id,q,'+when+'&order='+when+'.desc'+
         '&limit='+NET_PAGE,
    function(d){
      var out=[], i, r;
      for(i=0;i<(d||[]).length;i++){
        r=d[i]||{};
        out.push({id:r.id||'', q:String(r.q||''), at:Date.parse(r[when])||0});
      }
      ok(out);
    }, bad || function(){});
}
function netSearchSaved(ok, bad){
  netWordRows('saved_search', 'created_at', ok, bad);
}
function netSearchSave(q, ok, bad){
  var w=String(q||'').replace(/^\s+|\s+$/g, '');
  if(!netSignedIn() || !w){ ok && ok(); return; }
  netSend('POST', '/rest/v1/saved_search', {author:SESS.uid, q:w}, SESS.at,
          function(){ ok && ok(); }, bad || function(){});
}
function netSearchDrop(q, ok, bad){
  var w=String(q||'').replace(/^\s+|\s+$/g, '');
  if(!netSignedIn() || !w){ ok && ok(); return; }
  netSend('DELETE', '/rest/v1/saved_search?author=eq.'+
          encodeURIComponent(SESS.uid)+'&q=eq.'+encodeURIComponent(w),
          null, SESS.at, function(){ ok && ok(); }, bad || function(){});
}
/* ---- and what somebody merely typed -------------------------------------

   「検索した履歴もユーザーはいらんから5個くらい検索履歴出るようにしたい」
   「1件づつ消せるでいいよ」 OWNER 2026-09-03.

   A DIFFERENT TABLE FROM THE STAR ABOVE, and the three functions here are a
   different set from the three there on purpose. A star is a word somebody
   CHOSE; a recent is a word they TYPED. `supabase/schema.sql` says why they
   are never one row -- and the same sentence applies to the road: giving
   `saved_search` a 「this one is history」 column would make one mechanism of
   two things, and un-starring a word would take the history with it.

   Ordered by `at` and not `created_at`, because typing the same words again
   MOVES the row rather than making a second one. `at` is when it was last
   searched for, which is the thing the list is in the order of. */
function netRecent(ok, bad){
  netWordRows('recent_search', 'at', ok, bad);
}
/* ONE WRITE, AND THERE IS NO MIDDLE OF IT.
   `unique (author, q)` refuses a second row for words that are already there,
   so an insert alone fails and the word keeps whatever place it had -- and a
   PATCH alone does nothing at all for a word that is not there yet. This used
   to answer both by DROPPING and then INSERTING, which is two requests with a
   gap between them: **the delete landed, the phone lost its signal, and the
   insert never went.** The word was gone from the server with the screen
   still showing it, because the copy on the phone is written whatever the
   network does -- and the next launch read the server's answer over it, so a
   history one item shorter arrived on a morning when nobody had pressed
   anything. A silent delete is docs/DATA_SAFETY.md's own sentence: what is
   gone cannot be fixed.

   `resolution=merge-duplicates` is one request that both inserts and updates
   -- PostgREST's ON CONFLICT DO UPDATE -- so there is no moment at which the
   row does not exist. `recent_edit` in supabase/schema.sql has been the
   policy for that update since the table was written; nothing in www/ had
   ever used it.

   `at` is IN the body because the merge writes the columns it is given and
   nothing else: without it the row would stay where it was and the words
   somebody just searched for again would not move to the top, which is the
   whole of what this call is for. A new row would have taken it from the
   column's own default.

   The words are the name of the row, exactly as the star's are, so nothing
   here has to ask what an id was first. */
function netRecentAdd(q, ok, bad){
  var w=String(q||'').replace(/^\s+|\s+$/g, '');
  if(!netSignedIn() || !w){ ok && ok(); return; }
  netSend('POST', '/rest/v1/recent_search',
          {author:SESS.uid, q:w, at:(new Date()).toISOString()}, SESS.at,
          function(){ ok && ok(); }, bad || function(){}, true);
}
function netRecentDrop(q, ok, bad){
  var w=String(q||'').replace(/^\s+|\s+$/g, '');
  if(!netSignedIn() || !w){ ok && ok(); return; }
  netSend('DELETE', '/rest/v1/recent_search?author=eq.'+
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

   THE MAKING OF IT MOVED (2026-09-10). A language is named the same way now
   -- langMint() in www/core.js writes the id the `language` row is given --
   and core.js is read before this file exists, so the one place a uuid is
   made is uuid4() there. This is the name www/post.js calls it by. */
function netUUID(){ return uuid4(); }
/* ---- the nonce, which both sides have to agree about --------------------
   「Passed nonce and nonce in id_token should either both exist or not」 --
   the sentence on the owner's phone, pressing Google, on build #106.

   Supabase does NOT branch on the provider (`internal/api/token_oidc.go`
   294-306). It hashes whatever nonce it was SENT and compares that against
   the `nonce` claim on the id_token, and it refuses outright when one side
   has one and the other does not. The shape it wants is the ordinary OIDC
   one, and it is the same for Apple and for Google:

       P = a fresh random string
       to the provider goes    sha256(P)
       to Supabase goes        P

   This app sent neither, and `www/onboard.js` asked for neither -- so on
   this code the two are both absent, which is the other half of the
   condition and is why Apple goes through. Something on the way put a nonce
   claim on the Google token anyway. `docs/scope/claude-nonce.md` searched
   for it and did not find it: not in the plugin at any version in range, not
   in GoogleSignIn-iOS, not in any Swift here, and `git log -S nonce -- www/`
   is empty.

   SO THE FIX DOES NOT DEPEND ON FINDING IT. Holding the nonce ourselves
   makes the claim ours whoever was putting one there: we hand `sha256(P)` to
   Google, Google puts it on the token, and Supabase hashes the `P` we send
   and gets the same thing. Both sides exist and they match.

   Written out rather than `crypto.subtle.digest()`, and the reason is not
   taste. That call returns a Promise -- banned three lines up by rule 1 and,
   worse, it would put another level of nesting inside obSocial() -- and it
   exists only in a secure context, which `capacitor://localhost` is supposed
   to be and which nothing here has ever tested: `grep -rn "subtle" www/` is
   empty, so this app has no evidence at all that it works on a phone. The
   randomness is a different matter and is NOT rewritten: netUUID() above
   already uses crypto.getRandomValues with a fallback, so netNonce() calls
   it and there stays one place that knows how a random string is made. */
function netRotr(x, n){ return (x>>>n)|(x<<(32-n)); }
function netSha256(str){
  var K=[
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  var H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  var b=[], w=[], i, j, c, d, n, hi, lo, s0, s1, t1, t2, a, bb, cc, dd, e, f, g, h, out='';
  for(i=0;i<str.length;i++){
    c=str.charCodeAt(i);
    /* A code point above the BMP arrives as two halves and has to be put back
       together before it is encoded: UTF-8 says four bytes for one character,
       and hashing the two halves as three bytes each gives an answer that
       agrees with no other SHA-256 anywhere. Nothing here feeds it one today
       -- netNonce() hashes a UUID, which is hex and dashes -- and that is
       exactly why it would have sat here being wrong. */
    if(c>=0xd800 && c<0xdc00 && i+1<str.length){
      d=str.charCodeAt(i+1);
      if(d>=0xdc00 && d<0xe000){ c=0x10000+((c-0xd800)<<10)+(d-0xdc00); i++; }
    }
    if(c<0x80) b.push(c);
    else if(c<0x800) b.push(0xc0|(c>>6), 0x80|(c&63));
    else if(c<0x10000) b.push(0xe0|(c>>12), 0x80|((c>>6)&63), 0x80|(c&63));
    else b.push(0xf0|(c>>18), 0x80|((c>>12)&63), 0x80|((c>>6)&63), 0x80|(c&63));
  }
  n=b.length;
  b.push(0x80);
  while(b.length%64!==56) b.push(0);
  hi=Math.floor(n/536870912); lo=(n<<3)>>>0;
  b.push((hi>>>24)&255,(hi>>>16)&255,(hi>>>8)&255,hi&255);
  b.push((lo>>>24)&255,(lo>>>16)&255,(lo>>>8)&255,lo&255);
  for(i=0;i<b.length;i+=64){
    for(j=0;j<16;j++)
      w[j]=(b[i+j*4]<<24)|(b[i+j*4+1]<<16)|(b[i+j*4+2]<<8)|b[i+j*4+3];
    for(j=16;j<64;j++){
      s0=netRotr(w[j-15],7)^netRotr(w[j-15],18)^(w[j-15]>>>3);
      s1=netRotr(w[j-2],17)^netRotr(w[j-2],19)^(w[j-2]>>>10);
      w[j]=(w[j-16]+s0+w[j-7]+s1)|0;
    }
    a=H[0];bb=H[1];cc=H[2];dd=H[3];e=H[4];f=H[5];g=H[6];h=H[7];
    for(j=0;j<64;j++){
      s1=netRotr(e,6)^netRotr(e,11)^netRotr(e,25);
      t1=(h+s1+((e&f)^(~e&g))+K[j]+w[j])|0;
      s0=netRotr(a,2)^netRotr(a,13)^netRotr(a,22);
      t2=(s0+((a&bb)^(a&cc)^(bb&cc)))|0;
      h=g;g=f;f=e;e=(dd+t1)|0;dd=cc;cc=bb;bb=a;a=(t1+t2)|0;
    }
    H[0]=(H[0]+a)|0;H[1]=(H[1]+bb)|0;H[2]=(H[2]+cc)|0;H[3]=(H[3]+dd)|0;
    H[4]=(H[4]+e)|0;H[5]=(H[5]+f)|0;H[6]=(H[6]+g)|0;H[7]=(H[7]+h)|0;
  }
  for(i=0;i<8;i++){
    c=H[i]>>>0;
    for(j=28;j>=0;j-=4) out+=((c>>>j)&15).toString(16);
  }
  return out;
}
/* The pair, made together so the two can never be about different strings:
   `hash` is what the provider is asked to put on the token, `raw` is what
   Supabase is sent. */
function netNonce(){
  var p=netUUID();
  return { raw:p, hash:netSha256(p) };
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
   rather than as a picture.

   It carries THE SAME NET_WAIT as everything else. A post's photographs go up
   one after another and never at once, so one file that is accepted and never
   answered holds the whole post open with nothing said -- the fault netSend()
   had, on the wire that carries the biggest thing this app sends. How long to
   wait is ONE decision; this is a second place obeying it, not a second
   number. Running out lands where a dead network already lands, by the same
   readyState-4-status-0 the handler below reads, so there is no `ontimeout`
   here either. */
function netUp(path, b64, mime, ok, bad){
  var x, a=netBytes(b64);
  if(!netSignedIn() || !a){ bad(null, 0); return; }
  x=new XMLHttpRequest();
  x.open('POST', SB_URL+'/storage/v1/object/post-media/'+path, true);
  x.timeout=NET_WAIT;
  x.setRequestHeader('apikey', SB_KEY);
  x.setRequestHeader('Authorization', 'Bearer '+SESS.at);
  x.setRequestHeader('Content-Type', mime || 'application/octet-stream');
  x.onreadystatechange=function(){
    if(x.readyState!==4) return;
    netOff(x);
    if(x.status>=200 && x.status<300) ok(path);
    else bad(null, x.status);
  };
  x.onerror=function(){ netOff(x); bad(null, 0); };
  netOn(x);
  x.send(a);
}
/* Every picture on a post, one after the other, and then the caller.
   One at a time and not all at once: a phone on a train has one usable
   connection, and four uploads racing each other is four that are slow.

   WHAT WENT UP IS WRITTEN ON THE POST, and that one sentence is what makes a
   second attempt both cheap and safe. `pu[i]` is where photograph i is and
   `pt[i]` is where its small copy is; a photograph that is already up is not
   sent a second time, and the one that would not go leaves a HOLE at its own
   index rather than closing the list -- closing it would put picture two's
   small copy under picture one.

   A picture that would not go used to be DROPPED FROM THIS POST'S LIST and
   the post went up without it, for good: the row was inserted, `sid` was
   written onto the post, and postCatchUp() never looks again at a post that
   has one. The bytes stayed on the phone that wrote it, so the writer went on
   seeing four photographs while everybody else saw three, and nothing
   anywhere said so. 「他の人の画面には三枚しか出ないことがあります」
   docs/RISK.md § 6.

   It cannot be sent to the SAME path on a second attempt: supabase/schema.sql
   § the bucket has no update policy on purpose -- 「an overwrite is how
   somebody else's post quietly changes under them」 -- so a retry writes the
   missing ones under that attempt's own folder, and the paths on the post are
   what joins the two. Nothing is left behind either way, because netDropFiles()
   deletes by the paths the post carries and not by the folder.

   ok() is handed how many photographs are still not up, and the status of the
   last refusal. What to DO about that is netPush()'s and is written there. */
function netUpPics(uid, pid, p, pics, ok){
  var i=0, st=0;
  function next(){ i++; step(); }
  function step(){
    var d, at;
    if(i>=pics.length){ ok(netPicsLeft(p, pics), st); return; }
    /* Already on the server. Nothing to send, and re-sending it is the one
       thing the bucket will refuse. */
    if(p.pu && p.pu[i]){ next(); return; }
    d=netData(pics[i]);
    /* Not something this phone can read as bytes -- a path from a post that
       came down, or a picture that never was one. There is nothing to send
       and nothing to wait for, which is not the same as a send that failed. */
    if(!d){ next(); return; }
    at=i;
    netUp(uid+'/'+pid+'/'+at+netExt(d.mime), d.b64, d.mime,
      function(path){
        if(!p.pu) p.pu=[];
        p.pu[at]=path;
        postThumb(pics[at], function(small){
          var td=small && netData(small);
          if(!td){ next(); return; }
          netUp(uid+'/'+pid+'/'+at+'.t'+netExt(td.mime), td.b64, td.mime,
            function(tp){ if(!p.pt) p.pt=[]; p.pt[at]=tp; next(); },
            /* A small copy that will not go costs bytes and never
               correctness: postThumbs() reads a hole as 「draw the
               photograph for this one」, which is what every post written
               before there were small copies does anyway. So it is not
               counted as missing. */
            function(){ next(); });
        });
      },
      function(d2, s){ st=s||st; next(); });
  }
  step();
}
/* How many of a post's photographs the server does not have. Asked of the
   post rather than counted as it goes, so it is the same answer on the first
   attempt and on the fourth. */
function netPicsLeft(p, pics){
  var n=0, i;
  for(i=0;i<pics.length;i++) if(!(p.pu && p.pu[i]) && netData(pics[i])) n++;
  return n;
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
/* One prompt, by its id. The timeline shows answers written on other days,
   and the phone only ever pulled TODAY's -- so a post from last week had a
   number and nothing to look it up with. 「今日のお題は全員共通なんだからそんな
   難しいこと考えないでいいじゃん」 OWNER 2026-09-01: it is one shared row, so
   it is asked for rather than copied onto every post that answers it. */
function netPrompt(id, ok){
  netGet('/rest/v1/prompt?select=id,text,says&id=eq.'+encodeURIComponent(String(id||'')),
    function(d){ ok(d && d.length? d[0] : null); },
    function(){ ok(null); });
}
/* A FALL IS HANDED BACK NOW, and it used to be swallowed: `bad` answered
   `ok(null)`, so 「the server has no sentence today」 and 「this phone could
   not reach the server」 arrived at the caller wearing the same face. The
   caller is askDay() (www/sns.js), which is a pull like every other one, and
   a pull that cannot tell those apart is a pull that writes 「no sentence」
   down as an answer and never asks again. */
function netDay(ok, bad){
  netGet('/rest/v1/prompt?select=id,on_day,text,says&order=on_day.desc&limit=1',
    function(d){ ok(d && d.length? d[0] : null); }, bad);
}
function netPush(post, ok, bad){
  var row, pid, up;
  if(!netSignedIn() || !post){ bad(null, 0); return; }
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
     that can fail.

     AND THE ROW GOES ONLY WHEN THE BYTES ARE ALL THERE. It used to go
     whatever happened above it: a photograph that would not upload was
     dropped from the list and the voice fell through to ok(''), the row was
     inserted, and `sid` came back and was written onto the post -- which is
     the one thing that makes postCatchUp() stop looking at it. The post was
     finished, missing what somebody had put on it, silently and for ever.
     docs/RISK.md § 6.

     A refusal here is the same state as a post written in a tunnel: no row,
     no `sid`, the post sitting in POSTS with its bytes in hand, and
     postCatchUp() trying it again off the back of the next timeline answer.
     The second attempt sends only what is still missing -- netUpPics() writes
     the paths onto the post as they land -- so the retry is one file, not
     four. NOTHING IS DROPPED and nothing is deleted; what is refused is the
     ROW, and the row is the only thing here that can be sent again.

     The person who pressed the button is told, because pwSendWith() already
     says a failed push out loud (netWhy) and this is now one of the ways a
     push fails. The retries behind a timeline stay quiet, which is what
     postCatchUp() passes an empty handler for. */
  netUpPics(SESS.uid, pid, post, postPics(post), function(left, st){
    if(left){ bad(null, st); return; }
    netUpVoice(SESS.uid, pid, post, function(vleft, vst){
      if(vleft){ bad(null, vst); return; }
      /* The paths are ON the post now, so netBody() carries them up with
         everything else it carries. They were written onto the row here, and
         that was a second place holding what a post is made of. */
      row.body=netBody(post);
      netSend('POST', '/rest/v1/post?select=id', row, SESS.at,
        function(d){ ok((d && d.length? d[0].id : pid)); }, bad);
    });
  });
}
/* And the voice, which is a file on the disk rather than a string in hand --
   so it is read back out before it can go.

   Three answers used to be one. A post with no voice, a post whose file has
   gone off the disk, and a post whose voice WOULD NOT UPLOAD all came back as
   ok('') -- so the row went up saying nothing about a recording, and a post
   somebody spoke on arrived on everybody else's phone as a post that had
   never been recorded on. 「自分の iPhone では再生でき、他の人には何も付いて
   いない投稿に見えます」 docs/RISK.md § 6.

   The first two are still 「on you go」: there is nothing to send and nothing
   to wait for. The third is a refusal and says so, and netPush() holds the
   row back for it. `vu` is written onto the post the moment it lands, so a
   second attempt does not send thirty seconds of audio again. */
function netUpVoice(uid, pid, post, ok){
  var vo=post && post.vo;
  if(post && post.vu){ ok(0, 0); return; }
  if(!vo || !vo.f){ ok(0, 0); return; }
  voRead(vo.f, function(b64){
    if(!b64){ ok(0, 0); return; }
    netUp(uid+'/'+pid+'/vo.m4a', b64, 'audio/mp4',
      function(path){ post.vu=path; ok(0, 0); },
      function(d, s){ ok(1, s||0); });
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
  if(!netSignedIn() || !d || !d.id){ bad && bad(null, 0); return; }
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
  if(!netSignedIn()){ bad && bad(null, 0); return; }
  netGet('/rest/v1/draft?select=id,body,updated_at&order=updated_at.desc',
         function(d){ ok(d || []); }, bad || function(){});
}
/* And taking one off. Called when a draft is thrown away, and when it stops
   being a draft by being posted -- www/post.js does the second one AFTER the
   post is up, never before: a delete that ran first would be somebody's
   writing gone on the day the post itself would not go. */
function netDraftDrop(id, ok, bad){
  if(!netSignedIn() || !id){ bad && bad(null, 0); return; }
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
/* The POST, not its id. It is called from postDel, which has already taken
   the post out of POSTS -- so postById() answered null here, sid was
   undefined, and this returned as though there had been nothing on the
   server. The post went off the phone, stayed on the server, and came back
   with the next feed. 「投稿削除ボタン押しても消えないけど？」 Nothing threw and
   nothing could: the one branch that means "there is no server copy" is the
   same branch as "I cannot find this post". */
/* AND WHAT CAME BACK IS COUNTED. 204 is not 「消えました」 -- it is 「the
   server has nothing to say」, and a row policy that refused the delete
   answers with it. netSend() asks for the rows now (see the Prefer header
   there), so this is the one place that reads them: no row means the post is
   still on the server, and the person is told so rather than watching it go
   and come back.

   SIGNED OUT IS NOT THE SAME ANSWER AS NO `sid`, and they were one branch.
   Signed out there is nobody to ask, so nothing can be said about the row:
   that is the `∅` below. **A post with no `sid` has no row** -- it was never
   on the server, so there is nothing there to take away and the deletion is
   done the moment the phone lets go of it. Refusing it left somebody unable
   to delete a post that had never left this handset.

   ITS FILES STILL GO. A post's send can come apart in the middle: the
   photographs and the voice reach the bucket and the row that would name
   them does not. So there is no row and there ARE files, and leaving them is
   a file nothing points at in a PUBLIC bucket -- which is voDrop()'s reason
   said about a post instead of a recording, and docs/RISK.md § 9. The same
   netDropFiles() road, named by the post being deleted and nothing else.

   `∅` is the mark, and it is a STATE the way netWhy()'s others are: the
   request was answered and took nothing away, which is not 通信エラー and
   must not raise its pop. */
function netDrop(p, ok, bad){
  var sid=p && p.sid;
  if(!netSignedIn()){ bad(null, 0, 'post ∅'); return; }
  if(!sid){ netDropFiles(p, ok); return; }
  netDropFiles(p, function(){
    netSend('DELETE', '/rest/v1/post?id=eq.'+encodeURIComponent(sid),
            null, SESS.at, function(d){
              if(!d || !d.length){ bad(d, 200, 'post ∅'); return; }
              ok();
            }, bad);
  });
}
/* Everything of this post's that is in the bucket. Named rather than searched
   for: the paths are on the post, and asking the bucket what is under a folder
   is a listing this does not need and a permission it does not have. */
function netDropFiles(p, done){
  var paths=[], i;
  for(i=0;i<((p && p.pu) || []).length;i++) if(p.pu[i]) paths.push(p.pu[i]);
  /* The small copies too. A picture is two files now, and a deletion that
     took one of them would leave the other in a public bucket with nothing
     pointing at it -- which is the exact thing the paragraph above is about.
     Walked with a hole in it, because `pt` is allowed to have one. */
  for(i=0;i<((p && p.pt) || []).length;i++) if(p.pt[i]) paths.push(p.pt[i]);
  if(p && p.vu) paths.push(p.vu);
  if(!paths.length){ done(); return; }
  netSend('DELETE', '/storage/v1/object/post-media', {prefixes:paths}, SESS.at,
          function(){ done(); },
          /* The row still goes -- the paragraph above says why and it stands.
             What used to happen next is that the paths went with it. The
             bucket is PUBLIC (netMediaURL() builds
             /storage/v1/object/public/post-media/), so what was left was not
             litter: anybody holding the URL went on seeing the photograph of
             a post its author had deleted, and nothing pointed at the file
             any more, so there was nothing left to delete it with.
             docs/RISK.md § 9.

             So the paths are kept and asked for again. Not a cleanup and not
             a sweep -- these are the files of a post somebody asked to be
             gone, named by that post, which is exactly what the DELETE REVIEW
             in docs/CHANGELOG.md allows and nothing more. */
          function(){ netDropKeep(paths); done(); });
}
/* ---- what the bucket would not take -------------------------------------
   The paths of files a person has already asked to be deleted and the wire
   refused. One list, no duplicates, and it goes out whole on the next moment
   the network is known to be working -- which is the same moment
   postCatchUp() uses and for the same reason.

   IT IS IN MEMORY AND IT DOES NOT SURVIVE THE APP BEING KILLED. That is a
   hole and it is written here rather than left to be discovered: an app
   closed between the refusal and the next timeline is an app that has
   forgotten which files to chase, and they stay in a public bucket with
   nothing pointing at them. Closing it needs somewhere durable to put them --
   a key on the phone (tools/store-check.mjs) or a row on the server
   (supabase/schema.sql) -- and how long they may sit there before somebody
   sweeps them is a retention question, which is the owner's. */
var NET_DROPLEFT=[], NET_DROPPING=false;
function netDropKeep(paths){
  var i;
  for(i=0;i<paths.length;i++)
    if(NET_DROPLEFT.indexOf(paths[i])<0) NET_DROPLEFT.push(paths[i]);
}
function netDropAgain(){
  var lot;
  if(NET_DROPPING || !NET_DROPLEFT.length || !netSignedIn()) return;
  lot=NET_DROPLEFT.slice(0, 100);
  NET_DROPPING=true;
  netSend('DELETE', '/storage/v1/object/post-media', {prefixes:lot}, SESS.at,
    function(){
      var i;
      NET_DROPPING=false;
      for(i=0;i<lot.length;i++) NET_DROPLEFT.splice(NET_DROPLEFT.indexOf(lot[i]), 1);
    },
    /* Still refused. The list is left exactly as it is and the next timeline
       tries it again; nothing here gives up on a file somebody asked to have
       deleted. */
    function(){ NET_DROPPING=false; });
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
  /* No session is not 「done」. It said `ok()` here, so a press with nothing to
     prove who was being deleted reported success and the caller went on to
     empty the phone -- an account nobody asked the server about, and the only
     copy of it gone. The token is what says whose account this is; without one
     there is nothing to delete and nothing to claim. The mark is the same
     shape as netSetPass()'s a few hundred lines up. */
  if(!netSignedIn()){ bad(null, 0, 'drop −'); return; }
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
   The row and the handle it is looked up by are netPairRow() above, which the
   block is drawn by too. */
function netFollow(handle, on, ok, bad){
  netPairRow('follow', 'follower', 'followed', handle, on, ok, bad);
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
                  n:r.n||1,
                  /* And how many POSTS the row is about, which is a
                     different question from how many people and cannot be
                     worked out from it. 1 is 「this one post」; more than 1
                     is 「A が n 件に…」. A server that has not been updated
                     sends nothing at all and 1 is right for it -- every row
                     it can produce is about one post. */
                  np:r.np||1, more:r.more||[]});
      }
      ok(out);
    }, bad);
}
/* ---- the operator putting somebody's language back ----------------------
   「運営が治せる仕様は欲しい。ユーザーが問い合わせてきた時に、アカウントの
   復旧ができるようにしたい、管理画面で」「3 で実装して」 OWNER 2026-09-09.

   Two calls and they are the whole of it, in the shape netStaffAdd() and
   netStaffDrop() above are: the door is admin_hist() and admin_restore() in
   supabase/schema.sql, which ask is_staff() inside themselves, and these are
   a screen for that door rather than the door.

   NO BODY EVER COMES DOWN. A version of a 5000-word dictionary is 685 KB and
   the screen shows a part's name and a date -- the operator is restoring on
   what the person told them, not reading their language. So what comes back
   is (language, kind, at), and a restore is told which of those to put back.

   AND THERE IS NO NEW ROAD DOWN TO THE PERSON'S PHONE. A restore lands on
   `slice` and reaches them the way everything on `slice` reaches them:
   netLangsWalk() on their next launch, which fills in what this phone is not
   holding. The slices are in memory (rule 22), so an app that has been closed
   is holding nothing and the restored version is simply what comes down. An
   app left OPEN is holding the old one and will not take it -- 「アプリを
   一度閉じて開き直してください」 is what the operator says, and it is one
   road rather than two. */
function netHist(handle, ok, bad){
  ok=ok||function(){}; bad=bad||function(){};
  if(!netSignedIn() || !handle){ bad(null, 0); return; }
  netSend('POST', '/rest/v1/rpc/admin_hist', {handle:netHandleOf(handle)},
    SESS.at,
    function(d){
      var i, r, langs=[], hist=[],
          ls=(d && d.langs)? d.langs : [], hs=(d && d.hist)? d.hist : [];
      for(i=0;i<ls.length;i++){
        r=ls[i];
        if(r && r.id) langs.push({id:String(r.id), name:String(r.name||'')});
      }
      for(i=0;i<hs.length;i++){
        r=hs[i];
        if(r && r.language && r.kind)
          hist.push({sid:String(r.language), kind:String(r.kind),
                     at:String(r.at||''), ms:Date.parse(r.at)||0});
      }
      /* 「そんな人はいません」 and 「その人には版がありません」 are two
         states and do not share a branch: `who` is null only for the first. */
      ok({who:(d && d.who)? String(d.who) : '', langs:langs, hist:hist});
    }, bad);
}
function netRestore(sid, kind, at, ok, bad){
  ok=ok||function(){}; bad=bad||function(){};
  if(!netSignedIn() || !sid || !kind || !at){ bad(null, 0); return; }
  netSend('POST', '/rest/v1/rpc/admin_restore',
          {language:sid, kind:kind, at:at}, SESS.at,
          function(){ ok(); }, bad);
}
