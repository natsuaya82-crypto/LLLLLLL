/* Lingua — the other side of a report
   Loaded by www/index.html after post.js, which is where postWhen() is.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   Reporting a post has worked since the sns chapter went in. Nothing read the
   reports. They went into a table with no select policy on it, which meant
   the only way to see one was to open the Supabase dashboard on a computer —
   and "we act on reports within 24 hours" is something Apple asks about and
   something a person with a phone in their hand has to be able to do.

   So: one screen, for one account, showing what was reported and letting the
   post come down. It is not a moderation queue. There is no assigning, no
   resolving and no history — a report stays in the list after it is answered,
   because the post it points at says whether it was, and a second state to
   keep in step with the first is a second thing that can be wrong.

   Who may open it is `profile.staff`, which is set by hand in the dashboard
   and by nothing anywhere in this app. netStaff() in www/net.js asks once. */

/* What was read, and what went wrong reading it. Null and not [] before the
   first answer: "nothing has been asked yet" and "there are no reports" are
   different sentences and the screen says a different one for each. */
var MODS=null, MODBUSY=false, MODERR='';

/* Going there and reading are one press. A view that fetched what it needed
   while it was being drawn would fetch it again every time anything on the
   screen changed, and act-check draws every screen many times over.

   The press is on the admin screen now and not in settings.
   「設定の通報ボタン消せ」OWNER 2026-08-26 -- see vSettings() in
   www/settings.js for what went, and adminRow() below for where it went. */
function goMod(){ go('mod'); pullGo('mod'); }
/* AND THE ASKING IS THE PULL'S. 「読み直すってなに？」 OWNER 2026-08-26 took
   that button off the admin screen and left this one standing; a screen is
   asked again by pulling it down now, which is the one road every other
   screen answers on -- www/sns.js § WHICH SCREENS ANSWER A PULL. So there is
   no modLoad(): the flag, the mark, the failed pop and the retry are
   pullRun()'s, and what is left here is the question itself.

   `ok(1)` -- the answer is what the screen draws, so it is always redrawn. */
function modAsk(ok, bad){
  MODBUSY=true; MODERR=''; render();
  netReports(function(rows){ MODS=rows; MODBUSY=false; ok(1); },
             function(d, st){ MODBUSY=false; MODERR=netWhy(d, st); bad(d, st); });
}
/* Two reports about one post are two rows and one post, so answering either
   of them answers both. Marking every row that points at it is what stops the
   second row offering to take down something that is already down. */
function modMark(pid, down){
  var i;
  for(i=0;i<((MODS||[]).length);i++) if(MODS[i].pid===pid) MODS[i].down=down;
}
/* And the same for the person, who can be behind any number of the rows. */
function modMarkOut(uid, out){
  var i;
  for(i=0;i<((MODS||[]).length);i++) if(MODS[i].uid===uid) MODS[i].out=out;
}
function modWhy(pid){
  var i;
  for(i=0;i<((MODS||[]).length);i++) if(MODS[i].pid===pid) return MODS[i].why;
  return 'other';
}
function modDown(pid){
  netHide(pid, modWhy(pid), function(){ modMark(pid, true); render(); },
          function(d, st){ toast(netWhy(d, st)); });
}
function modUp(pid){
  netShow(pid, function(){ modMark(pid, false); render(); },
          function(d, st){ toast(netWhy(d, st)); });
}
/* Ejecting somebody is the one thing on this screen that is about a person
   rather than about a post, so it is the one thing that asks first. The
   question is the question and nothing else -- that it can be undone is said
   by the button turning into the one that undoes it, which is where a person
   will look for it. */
function modOut(uid){
  /* 確認は自前のポップで。「標準は使わねえって言ってるだろこれも禁止や」
     OWNER 2026-09-01 -- confirm() は使わない。押す側のボタンは「はい」では
     なく、その動作の名前が書いてある -- 何が起きるかはボタンが言う。 */
  popAsk(t('mod.out.sure'), function(){ modOutGo(uid); }, t('mod.out.yes'));
}
function modOutGo(uid){
  netBan(uid, modWhyOf(uid), function(){ modMarkOut(uid, true); render(); },
         function(d, st){ toast(netWhy(d, st)); });
}
function modIn(uid){
  netUnban(uid, function(){ modMarkOut(uid, false); render(); },
           function(d, st){ toast(netWhy(d, st)); });
}
function modWhyOf(uid){
  var i;
  for(i=0;i<((MODS||[]).length);i++) if(MODS[i].uid===uid) return MODS[i].why;
  return 'other';
}

/* ONE REPORT, AND THE TWO QUESTIONS IT HAS TO ANSWER BEFORE ANY OTHER.
   「ツイートがなにで誰から通報されてるのかがわかりにくい」 OWNER 2026-09-05.

   It was the reason, the time, and the words -- and neither person was on it
   anywhere. Whose post this is was in the card only when the report was about
   an ACCOUNT, where it stood in place of the words; who pressed the button
   was on no screen at all. So the two people are the head now and the reason
   goes down beside the time: the person reading these is deciding about two
   accounts, and a card that names neither is a card they have to leave to
   find out.

   TWO grey lines and not one. Four things across 320px in the small grey type
   is the illegibility being complained about; `.mhead` is a flex row with an
   end at each side, so two of them are two pairs and each pair reads.

   A report about an account carries no post, so it has no words to show and
   the `.mline` goes with them -- @who is in the head now and printing it
   again as the body was the same handle twice. */
function modRow(r){
  return '<div class="mrep'+(r.down? ' mdown':'')+'">'+
    '<div class="mhead">'+
      '<span class="mwho">'+esc(t('mod.of', r.who))+'</span>'+
      '<span class="mwhen">'+esc(postWhen(r.at))+'</span>'+
    '</div>'+
    '<div class="mhead">'+
      '<span class="mwhy">'+esc(t('report.'+r.why))+'</span>'+
      /* A report whose author has closed their account carries no handle, and
         a blank space where a name goes says less than nothing. */
      '<span class="mby">'+(r.by? esc(t('mod.by', r.by)) : '')+'</span>'+
    '</div>'+
    (r.pid? '<div class="mline">'+esc(r.ln || t('mod.noline'))+'</div>' : '')+
    (r.note? '<div class="mnote">'+esc(r.note)+'</div>' : '')+
    /* A report about an account and not a post has nothing to take down. It
       is still worth reading, which is why it is in the list at all. */
    (r.pid
      ? '<button class="btn'+(r.down? ' ghost' : ' bad')+'"' +
          DO(r.down? 'modUp' : 'modDown', [r.pid]) + '>'+
          esc(t(r.down? 'mod.up' : 'mod.down'))+'</button>'
      : '')+
    /* And the person behind it, which every report has -- a report about an
       account has no post to take down and is often the one that needs this.
       A report whose author has left carries no uid and offers nothing.

       `r.who` AND NOT `'@'+r.who`: the key already carries the @, so the
       button read 「@@veth を凍結」 on every card. */
    (r.uid
      ? '<button class="btn'+(r.out? ' ghost' : ' bad')+'"' +
          DO(r.out? 'modIn' : 'modOut', [r.uid]) + '>'+
          esc(t(r.out? 'mod.in' : 'mod.out', r.who))+'</button>'
      : '')+
    '</div>';
}
function vMod(){
  var rows=MODS||[];
  return '<div class="view">'+navTop('')+'<div class="body">'+
    (MODERR? '<div class="mnone bad">'+esc(MODERR)+'</div>' : '')+
    ((!MODBUSY && !MODERR && MODS && !rows.length)
      ? '<div class="mnone">'+esc(t('mod.none'))+'</div>' : '')+
    rows.map(modRow).join('')+
    '</div></div>';
}

/* ---- the one screen with everything on it -------------------------------
   「通報の確認とかアナリティクスとか売り上げとか含めて全部見れる新ページ」

   Its own page rather than more of the one above it, which is the owner's
   call: the reports screen stays what it is and this one carries it. What is
   on it today is the four numbers and the reports; there is no analytics
   section and no takings section, because there is nothing recorded to put in
   one and a heading over an empty box explaining that is the app explaining
   itself. When there is something, it goes here.

   ── The door ────────────────────────────────────────────────────────────
   Two things stand in it and only one of them is a wall.

   The wall is is_staff(), in supabase/schema.sql, and it is the server's. Every
   number here comes back from admin_counts(), which asks it; every report
   comes through report_read, which IS it. A phone that lies about who it is
   gets handed nothing, and that is true whatever this file does -- CLAUDE.md:
   the app is a suggestion, and schema.sql is the security.

   The other is this password, and it is worth what a screen lock is worth: it
   is for a phone handed to somebody with the app already signed in. So it is
   not written as though it were more. Nothing is compared in here -- www/*.js
   goes to the phone as it is and anybody who downloads the app can read every
   string in it. The password goes to Supabase, on the same endpoint the door
   uses, and the answer is the server's. netSignIn() is what settings.js
   already asks with before changing a password, which makes this the second
   caller of a thing that works rather than a second way of doing it.

   Nothing is kept: not the password, and not the fact that it was right.
   ADMIN_OK is a variable in memory. Closing the app forgets it, which is the
   behaviour somebody who locked their admin screen would expect and is also
   the only behaviour that does not put the answer somewhere it can be found.

   An account that came in through Apple or Google has no password to be asked
   for -- netHow() says which door was used -- and asking one of them for a
   password it does not have would lock the owner out of their own screen. So
   the lock is only there where there is something to unlock it with. */
var ADMIN_OK=false, ADMIN_PW='', ADMIN_BUSY=false, ADMIN_ERR='', ADMINN=null;
var ADMINS=null, ADMIN_H='';

function adminLocked(){ return !ADMIN_OK && netHow()==='email'; }
/* Going there and reading are one press, for the same reason goMod() is. */
function goAdmin(){ go('admin'); if(!adminLocked()) adminLoad(); }
/* And how anybody gets here at all. 「どっか7回タップとパスワード要求で」
   OWNER 2026-08-26, on the settings heading, which is where navTop() in
   www/shell.js puts the count.

   There is no button anywhere. A visible way in beside a hidden one is not a
   hidden one, and the reports screen carried a button here for about an hour
   before the owner chose this instead.

   It does nothing at all for anybody but the one account above staff -- not a
   refusal, not a wrong-password screen, nothing. A door that says "wrong
   password" is a door somebody now knows is there, and the whole of what this
   is worth is that a phone somebody was handed does not look like it has one.
   What it is NOT worth is anything at all against somebody sending their own
   requests: admin_counts(), staff_add() and staff_drop() each ask is_admin()
   on the server, and that is the wall. This is the curtain in front of it.

   Nothing resets the count, which is deliberate: seven presses spread over a
   week still open it, and there is nothing to be gained by making the owner
   hurry. tools/press.mjs rebuilds the screen before every press but not the
   app's variables, so its walk does reach seven -- and arrives at the same
   nothing, because NET_ADMIN is false everywhere in the fixture except the
   one face that sets it. */
var ADMIN_TAPS=0;
function adminTap(){
  ADMIN_TAPS++;
  if(ADMIN_TAPS<7) return;
  ADMIN_TAPS=0;
  if(!NET_ADMIN) return;
  goAdmin();
}
/* Stored and not rendered back: render() here would rebuild the field under
   whoever is typing into it. settings.js's setPwSet() is the same line. */
function adminSet(k, v){ if(k==='pw') ADMIN_PW=String(v||''); }
function adminGo(){
  if(ADMIN_BUSY) return;
  /* A button that does nothing when the field is empty is a button somebody
     presses twice and then puts the phone down. settings.js says the same
     sentence with the same key. */
  if(!ADMIN_PW){ ADMIN_ERR=t('net.needpw'); render(); return; }
  ADMIN_BUSY=true; ADMIN_ERR=''; render();
  netSignIn(netMail(), ADMIN_PW, function(){
    /* Gone the moment it has been answered, right or wrong. */
    ADMIN_PW=''; ADMIN_OK=true; ADMIN_BUSY=false; adminLoad();
  }, function(d, st){
    ADMIN_PW=''; ADMIN_BUSY=false; ADMIN_ERR=netWhy(d, st); render();
  });
}
/* The numbers, and then the reports under them -- one press asks for both,
   because a screen with a button for each half is a screen where half of it
   is out of date and nothing says so. */
function adminLoad(){
  if(ADMIN_BUSY) return;
  ADMIN_BUSY=true; ADMIN_ERR=''; render();
  netCounts(function(n){
    ADMINN=n;
    /* Who answers the reports is the third thing on this screen and the only
       one that can be changed from it, so it is asked for in the same press.
       A list that failed to arrive is an empty list and not an error: the
       numbers above it are already up, and one refusal that stops the whole
       screen is a screen that is blank for the wrong reason. */
    netStaffList(function(rows){ ADMINS=rows; adminAsk(); },
                 function(){ ADMINS=[]; adminAsk(); });
  },        function(d, st){ ADMIN_BUSY=false; ADMIN_ERR=netWhy(d, st); render(); });
}
/* ---- who answers the reports -------------------------------------------
   「staffアカウントはスタッフページから追加できるようにしよう」
   「そしたら@でいいよ」 -- by handle, because the app has no other name for a
   person: an address is in auth.users and this app does not read it.

   Adding is not confirmed and neither is taking away, which is the opposite
   of modOut() one chapter up, and deliberately: ejecting somebody is done TO
   them and cannot be taken back by typing their name again. This can, by the
   same person, on the same screen, in one press. */
/* Apple used to be asked here, last, because it was the slowest thing on the
   screen. It is not asked at all now -- 「lingua内ではみないって言ってるだろ」
   OWNER 2026-09-02 -- so what is left is the reports, which is what this
   screen is for. */
function adminAsk(){
  ADMIN_BUSY=false;
  pullGo('mod');
}
function adminStaffSet(k, v){ if(k==='h'){ ADMIN_H=String(v||''); lnGrow('admin-h'); } }
function adminStaffAdd(){
  if(ADMIN_BUSY || !ADMIN_H) return;
  ADMIN_BUSY=true; ADMIN_ERR=''; render();
  netStaffAdd(ADMIN_H, function(){ ADMIN_H=''; ADMIN_BUSY=false; adminLoad(); },
              function(d, st){ ADMIN_BUSY=false; ADMIN_ERR=netWhy(d, st); render(); });
}
function adminStaffDrop(h){
  if(ADMIN_BUSY) return;
  ADMIN_BUSY=true; ADMIN_ERR=''; render();
  netStaffDrop(h, function(){ ADMIN_BUSY=false; adminLoad(); },
               function(d, st){ ADMIN_BUSY=false; ADMIN_ERR=netWhy(d, st); render(); });
}
/* One of them. The account above staff is in the list and is not a button --
   staff_drop() in schema.sql refuses to take it off, so a button there would
   be one that does nothing. Same class either way, so the rows are one
   height; what differs is whether it is pressable, which is what the rule
   about rows is not about. */
function adminStaffRow(r){
  return r.admin
    ? '<div class="set"><span class="sl">@'+esc(r.handle)+'</span></div>'
    : '<button class="set"' + DO('adminStaffDrop', [r.handle]) + '>'+
        '<span class="sl">@'+esc(r.handle)+'</span></button>';
}
/* One number. The same row the settings list is made of, so the rows on this
   screen are the height the rows everywhere else in the app are. A number
   that has not come back yet is a blank and not a nought: nought is a fact
   about the app and this is a fact about the request. */
function adminRow(k, n, go){
  var body='<span class="sl">'+esc(t(k))+'</span>'+
    '<span class="sv">'+esc((n===0 || n)? String(n) : '')+
    (go? ICON_GO : '')+'</span>';
  return go? '<button class="set"' + DO(go) + '>'+body+'</button>'
           : '<div class="set">'+body+'</div>';
}
/* ---- what Apple counted -- GONE 2026-09-02 -------------------------------
   「lingua内ではみないって言ってるだろ」「RevenueCatで見るって話してるんだけど」
   OWNER. The takings, the months, the plans, the retention and the downloads
   were five pages hanging off this screen, all of them fed by
   supabase/functions/appstore/. They are read in RevenueCat now, so none of it
   is here: not the pages, not the rows that opened them, not the request.

   `docs/FEATURE_RULES.md` carries the decision and marks the 2026-08-26 one
   superseded. git remembers the code. */
function vAdmin(){
  if(adminLocked()) return adminDoor();
  /* THE NUMBERS ARE NOT HERE ANY MORE.
     「lingua内ではみないって言ってるだろ」「RevenueCatで見るって話してるんだけど」
     OWNER 2026-09-02. Sales and analytics are read in RevenueCat, so this
     screen carries none of them -- not the takings, not the downloads, not the
     retention, and not the account count either: the sentence is about Lingua,
     not about which of them came from Apple.

     The 2026-08-26 decision that put them here is superseded
     (`docs/FEATURE_RULES.md`). What is left is the thing this screen is for
     that nothing else does: the reports, and who answers them.

     admin_counts() in supabase/schema.sql still counts and still sends; only
     the reports count is read off it now. Nothing was deleted on the server. */
  var n=ADMINN||{}, rows=MODS||[];
  return '<div class="view">'+navTop('')+'<div class="body">'+
    (ADMIN_ERR? '<div class="mnone bad">'+esc(ADMIN_ERR)+'</div>' : '')+
    adminRow('admin.reports', n.reports, 'goMod')+
    /* Who answers them, and the field that adds one. Both stay here: their
       buttons exist only where they are drawn, and act-check walks this route
       with no argument -- see the head of this section. */
    '<div class="set"><span class="sl">'+esc(t('admin.staff'))+'</span></div>'+
    (ADMINS||[]).map(adminStaffRow).join('')+
    /* A handle is short, but nothing stops a long one being pasted here.
       The password on the door above is NOT this -- it stays an
       <input type="password">, because a textarea has no such type and would
       print somebody's word on the screen. */
    '<div class="field">'+
      lnField('admin-h', t('admin.staff.ph'), ' autocapitalize="none"' +
        IN('adminStaffSet', ['h']), ADMIN_H)+'</div>'+
    '<button class="btn ghost"' + DO('adminStaffAdd') +
      (ADMIN_BUSY? ' disabled':'') + '>'+esc(t('admin.staff.add'))+'</button>'+
    /* And the reports themselves, drawn by the row the reports screen draws
       them with. Two lists of the same thing that could disagree about what a
       report looks like is the second state this chapter refuses to keep. */
    (MODERR? '<div class="mnone bad">'+esc(MODERR)+'</div>' : '')+
    ((!MODBUSY && !MODERR && MODS && !rows.length)
      ? '<div class="mnone">'+esc(t('mod.none'))+'</div>' : '')+
    rows.map(modRow).join('')+
    '</div></div>';
}
/* Not named vSomething: tools/act-check.mjs reads every `v[A-Z]` in the app
   as a PAGE and asks which route shows it. This is not a page -- it is what
   the admin page IS until it has been opened -- and the one hand-written
   exception to that rule already in the checker is one more than it wants. */
function adminDoor(){
  return '<div class="view">'+navTop('')+'<div class="body">'+
    '<div class="field"><input id="admin-pw" type="password" '+
      'value="'+esc(ADMIN_PW)+'" placeholder="'+esc(t('admin.pw'))+'" '+
      'autocomplete="current-password" autocapitalize="none" autocorrect="off" '+
      'spellcheck="false"' + IN('adminSet', ['pw']) + '></div>'+
    (ADMIN_ERR? '<div class="obmsg">'+esc(ADMIN_ERR)+'</div>' : '')+
    '<button class="btn ghost" style="margin-top:18px"' + DO('adminGo') +
      (ADMIN_BUSY? ' disabled':'') + '>'+
      esc(t(ADMIN_BUSY? 'ob.mail.wait' : 'admin.go'))+'</button>'+
    '</div></div>';
}
