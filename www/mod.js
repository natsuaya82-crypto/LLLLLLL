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
function goMod(){ go('mod'); modLoad(); }
function modLoad(){
  if(MODBUSY) return;
  MODBUSY=true; MODERR=''; render();
  netReports(function(rows){ MODS=rows; MODBUSY=false; render(); },
             function(d, st){ MODBUSY=false; MODERR=netWhy(d, st); render(); });
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
  if(!confirm(t('mod.out.sure'))) return;
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

/* One report. The reason is the heading because it is what the list is sorted
   in the head by; the line under it is what was actually said, which is the
   only thing that decides anything. */
function modRow(r){
  return '<div class="mrep'+(r.down? ' mdown':'')+'">'+
    '<div class="mhead">'+
      '<span class="mwhy">'+esc(t('report.'+r.why))+'</span>'+
      '<span class="mwhen">'+esc(postWhen(r.at))+'</span>'+
    '</div>'+
    '<div class="mline">'+
      esc(r.pid? (r.ln || t('mod.noline')) : ('@'+r.who))+'</div>'+
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
       A report whose author has left carries no uid and offers nothing. */
    (r.uid
      ? '<button class="btn'+(r.out? ' ghost' : ' bad')+'"' +
          DO(r.out? 'modIn' : 'modOut', [r.uid]) + '>'+
          esc(t(r.out? 'mod.in' : 'mod.out', '@'+r.who))+'</button>'
      : '')+
    '</div>';
}
function vMod(){
  var rows=MODS||[];
  return '<div class="view">'+navTop('')+'<div class="body">'+
    '<button class="btn ghost"' + DO('modLoad') + '>'+esc(t('mod.again'))+'</button>'+
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
/* And what App Store Connect said, which is the same sentence as ADMINN one
   line up: null until it has been asked, and never {} standing in for it. */
var ADMIN_ASC=null;

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
/* Apple, last. It is the slowest thing on the screen by a long way -- the
   function signs a token and then asks App Store Connect for up to three
   gzipped reports -- and everything above it is already up, so it is asked
   after the rest rather than in front of it.

   「画面を開いたときに毎回」OWNER 2026-08-26, so it is in adminLoad() and not
   behind a button of its own. Nothing is cached: Apple's day is yesterday's
   and does not move while somebody is looking at it, but neither does asking
   twice cost anything anybody can see.

   A refusal leaves ADMIN_ASC null, which is blanks, and does not become
   ADMIN_ERR: the four numbers above and the reports below arrived, and one
   red line across a screen that is nine tenths right is a screen somebody
   stops reading. Same argument as netStaffList's empty list one line up. */
function adminAsk(){
  netStore(function(d){ ADMIN_ASC=d; ADMIN_BUSY=false; modLoad(); },
           function(){ ADMIN_ASC=null; ADMIN_BUSY=false; modLoad(); });
}
function adminStaffSet(k, v){ if(k==='h') ADMIN_H=String(v||''); }
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
/* ---- what Apple counted, and the line it makes ---------------------------
   「登録ユーザー数とそれぞれのプランの課金数、それで合計の売り上げ」
   「特に売り上げはどのプランかが大事やろ」「あとは継続率」
   「もっと日毎の折れ線グラフとかさ」 OWNER 2026-08-26.

   supabase/functions/appstore/ is what fetches it and
   docs/reports/sales-2026-08-26.md is what was confirmed at Apple first.

   THE TAKINGS ARE ONE ROW PER CURRENCY AND ARE NEVER ADDED UP. Apple pays per
   storefront in that storefront's currency, and turning EUR into JPY needs an
   exchange rate, which is not in this app. www/store.js and LinguaStore.swift
   both carry the sentence this comes from: "Building '$' + a number is how an
   app ends up showing dollars to somebody being charged yen." One currency is
   one row, which is what a total looks like when there is only one -- so
   「合計の売り上げ」 is answered, and answered without inventing a rate.

   A PLAN IS NAMED BY APPLE and not by this app: `Subscription Name` is what
   the product is called in App Store Connect, so a plan added there appears
   here the day it sells one, and nothing in www/ has to be told about it.
   It is not put through t() for the same reason a handle is not.

   THE DAY is a row because Apple's data is next-day: there is no such thing as
   today's takings, and a number here with no date on it is yesterday's being
   read as today's. */
function adminAsc(){ return ADMIN_ASC || {}; }
function adminNow(){ return adminAsc().now || {}; }
/* Two rows and they are two different facts, both asked for by name
   「両方を別の行で出す」OWNER 2026-08-26: what came out of somebody's pocket,
   and what arrives here after Apple's commission and the local tax.

   Each is one row per currency, and one currency is ONE row -- which is what
   a total looks like when everything was sold in one place, so 「合計の売り上げ」
   is answered without an exchange rate being invented. Apple sets the price of
   every storefront off one base price, so ¥800 and $4.99 are the same product;
   what Apple does NOT publish in these reports is what ¥800 of Japanese
   takings and $4.99 of American takings come to together, and neither does
   this app. docs/reports/sales-2026-08-26.md § 10 has the way to collapse them
   when it is wanted -- Apple's own price table, not a rate. */
function adminPurse(k, key){
  var m=adminNow()[k] || [];
  if(!m.length) return adminRow(key, null);
  return m.map(function(row){
    return adminRow(key, row.cur+' '+row.total);
  }).join('');
}

/* Every plan Apple knows about, in its own name, with how many are paying for
   it. Nothing before the first answer: a made-up row here would be a plan
   that does not exist. */
function adminPlans(){
  var p=adminNow().plans || [], i, out='';
  for(i=0;i<p.length;i++)
    out+='<div class="set"><span class="sl">'+esc(p[i].name)+'</span>'+
         '<span class="sv">'+esc(String(p[i].live))+'</span></div>';
  return out;
}
/* A rate is a rate and reads as one. Null is a day on which nothing renewed
   and nothing cancelled, which is not 0% -- 0% is everybody leaving. */
function adminPct(v){
  return (typeof v==='number')? (Math.round(v*100)+'%') : null;
}

/* ---- the line ------------------------------------------------------------
   An SVG built here rather than a class in www/index.html, because that file
   belongs to another session today. It wears no class at all and sets no
   border and no corner -- there is nothing here for tools/box-check.mjs to
   find, and nothing in the stylesheet to keep in step with it. The colour
   NAMES `var(--gold)` rather than being a colour, so the two theme blocks at
   the top of index.html stay the one place a colour lives.

   IT CARRIES ITS NUMBERS AND ITS DATES. The first version was a bare stroke:
   a shape that goes up and down and says neither WHEN nor HOW MUCH.
   「日付もいくら売れたかもわかんねえじゃねえかよ」 OWNER 2026-08-26. A line
   with no scale on it is a decoration -- it cannot be read, only admired, and
   the whole reason it is on this screen is to be read. So: the highest and
   the lowest value down the left, the first and the last day along the
   bottom, and a dot on the newest point with its own value beside it.

   No stretching. `preserveAspectRatio="none"` fits any box and squashes the
   text with it -- the numbers came out narrow and wrong. The viewBox keeps
   its ratio and the whole drawing scales together.

   A day Apple never readied is not in the series at all -- the function
   leaves it out rather than sending a nought, because a nought on a chart is
   a claim that nothing sold. So x is the DAY and not the position in the
   list: two points a week apart sit a week apart, and the gap is visible
   instead of being smoothed into a run of days that never existed. */
function adminDayNo(d){
  var p=String(d||'').split('-');
  if(p.length!==3) return 0;
  return Math.round(Date.UTC(+p[0], +p[1]-1, +p[2])/86400000);
}
/* 2026-08-25 -> 8/25. The year is the same on every point of a month-long
   line, so it is the part that says least and takes the most room. */
function adminMD(d){
  var p=String(d||'').split('-');
  return (p.length===3)? (+p[1])+'/'+(+p[2]) : '';
}
/* A number a person reads at a glance: 6955 rather than 6955.00, and 74%
   rather than 0.74. Money keeps its hundredths only when it has any. */
function adminNum(v, pct){
  if(pct) return Math.round(v*100)+'%';
  return String(Math.round(v*100)/100);
}
function adminTx(x, y, anchor, txt){
  return '<text x="'+x+'" y="'+y+'" font-size="10" fill="var(--txm)" '+
    'text-anchor="'+anchor+'">'+esc(txt)+'</text>';
}
function adminLine(vals, pct){
  /* vals: [{d:'YYYY-MM-DD', v:number}], oldest first, nulls already dropped.
     Two points are the fewest that make a line; one is a dot and no line. */
  if(vals.length<2) return '';
  var W=320, H=132, L=52, R=8, T=16, B=20, i;
  var x0=adminDayNo(vals[0].d);
  var span=adminDayNo(vals[vals.length-1].d)-x0;
  var lo=vals[0].v, hi=vals[0].v;
  for(i=1;i<vals.length;i++){
    if(vals[i].v<lo) lo=vals[i].v;
    if(vals[i].v>hi) hi=vals[i].v;
  }
  /* A flat line sits in the middle rather than dividing by nothing. */
  var rng=(hi-lo) || 1;
  var pts=[], lx=0, ly=0;
  for(i=0;i<vals.length;i++){
    var x=span? ((adminDayNo(vals[i].d)-x0)/span)*(W-L-R)+L : (L+W-R)/2;
    var y=(H-B)-((vals[i].v-lo)/rng)*(H-T-B);
    lx=x; ly=y;
    pts.push(Math.round(x*10)/10+','+Math.round(y*10)/10);
  }
  var last=vals[vals.length-1];
  return '<svg viewBox="0 0 '+W+' '+H+'" '+
    'style="width:100%;height:auto;display:block;margin:4px 0 14px">'+
    '<polyline fill="none" stroke="var(--gold)" stroke-width="1.5" '+
      'stroke-linejoin="round" stroke-linecap="round" points="'+pts.join(' ')+'"/>'+
    /* The newest point, which is the one the rows above are about. */
    '<circle cx="'+(Math.round(lx*10)/10)+'" cy="'+(Math.round(ly*10)/10)+'" '+
      'r="2.5" fill="var(--gold)"/>'+
    /* How much: the top and the bottom of what the line covers. */
    adminTx(L-8, T+4, 'end', adminNum(hi, pct))+
    adminTx(L-8, H-B, 'end', adminNum(lo, pct))+
    /* And when. */
    adminTx(L, H-4, 'start', adminMD(vals[0].d))+
    adminTx(W-R, H-4, 'end', adminMD(last.d))+
    '</svg>';
}
/* The takings, day by day, in ONE currency -- the line cannot mix two for the
   same reason the row cannot add them. The one drawn is the one the newest
   day has most of; the others are in the rows above it.

   It is what ARRIVES and not what was paid, because that is the number this
   line is about; the two move together anyway, being the same sales less a
   fixed share. */
function adminMoneyLine(){
  var ser=adminAsc().series || [], m=adminNow().got || [], i, j, cur='', best=-1;
  for(i=0;i<m.length;i++) if(m[i].total>best){ best=m[i].total; cur=m[i].cur; }
  if(!cur) return '';
  var vals=[];
  for(i=0;i<ser.length;i++){
    var mm=ser[i].got || [];
    for(j=0;j<mm.length;j++) if(mm[j].cur===cur) vals.push({d:ser[i].day, v:mm[j].total});
  }
  return adminLine(vals, false);
}
function adminKeepLine(){
  var ser=adminAsc().series || [], i, vals=[];
  for(i=0;i<ser.length;i++)
    if(typeof ser[i].keep==='number') vals.push({d:ser[i].day, v:ser[i].keep});
  return adminLine(vals, true);
}
function adminDlLine(){
  var ser=adminAsc().series || [], i, vals=[];
  for(i=0;i<ser.length;i++)
    if(typeof ser[i].downloads==='number') vals.push({d:ser[i].day, v:ser[i].downloads});
  return adminLine(vals, false);
}

/* ---- one number, one page -----------------------------------------------
   「項目ごとで分けて別ページにして」「なんで同じページに入れんだよ」
   OWNER 2026-08-26, twice. The first answer was six more rows on the one
   page, which is what was being complained about.

   It is the `admin` route with an ARGUMENT, the way `set` is six rooms on one
   route -- because a new route means a PAGES entry in www/shell.js, and four
   other branches are in that file today (docs/SESSIONS.md rule: one session
   at a time owns a file). Nothing here touches it.

   ONE THING IS STILL MISSING AND IT IS NOT MINE TO ADD: pageName() in
   shell.js decides what the bar says, and with no branch for these it says
   「管理」 on every one of them. The branch is three lines and is written out
   in docs/reports/sales-2026-08-26.md § 11 for whoever owns that file.

   The reports and the staff list stay on the front page. Not taste: their
   buttons exist ONLY where they are drawn, and tools/act-check.mjs walks a
   route with no argument, so a staff button moved onto a page it can only
   reach with one would be reported as a name no screen says -- correctly.
   Adding `walkArg('admin', ...)` there is the other half of the same patch. */
function adminGoTo(k){ go('admin', k); }
function adminAt(){ var h=here(); return String((h && h.a)||''); }
/* A row that opens one of them. The number on it is that page's headline, so
   the front page is still a page of numbers and not a menu of words. */
function adminOpen(k, n, to){
  return '<button class="set"' + DO('adminGoTo', [to]) + '>'+
    '<span class="sl">'+esc(t(k))+'</span>'+
    '<span class="sv">'+esc((n===0 || n)? String(n) : '')+ICON_GO+'</span></button>';
}
/* What the takings row says before you open it: the newest day's proceeds in
   the currency there is most of, with the code beside it. Blank until an
   answer -- adminRow() says why that is not a nought. */
function adminGotTop(){
  var m=adminNow().got || [], i, best=-1, out=null;
  for(i=0;i<m.length;i++) if(m[i].total>best){ best=m[i].total; out=m[i].cur+' '+m[i].total; }
  return out;
}
function adminView(){
  var a=adminAt(), n=ADMINN||{}, now=adminNow(), asc=adminAsc(), body;
  if(a==='money'){
    /* 「特に売り上げはどのプランかが大事やろ」 -- so the plans are here, under
       the two totals they add up to, rather than on the front page. */
    body=adminMoneyLine()+
      adminPurse('paid', 'admin.paid')+
      adminPurse('got', 'admin.got')+
      adminPlans()+
      adminRow('admin.day', asc.day || '');
  } else if(a==='keep'){
    body=adminKeepLine()+
      adminRow('admin.keep', adminPct(now.keep))+
      adminRow('admin.renew', (now.renew===0 || now.renew)? now.renew : null)+
      adminRow('admin.cancel', (now.cancel===0 || now.cancel)? now.cancel : null)+
      adminRow('admin.day', asc.day || '');
  } else if(a==='dl'){
    body=adminDlLine()+
      adminRow('admin.dl', now.downloads)+
      adminRow('admin.day', asc.day || '');
  } else {
    body=null;
  }
  return body;
}
function vAdmin(){
  if(adminLocked()) return adminDoor();
  var inner=adminView();
  if(inner!==null)
    return '<div class="view">'+navTop('')+'<div class="body">'+inner+'</div></div>';

  /* The front page. Every number here is a way IN to the page about it, so
     this is still a page of numbers rather than a menu of words -- what each
     row carries is that page's headline. 「登録ユーザー数とそれぞれのプランの
     課金数、それで合計の売り上げ」「あとは継続率」 OWNER 2026-08-26.

     投稿 and 言語 came off in the same breath -- 「投稿数とかはいいのよ」.
     Nothing was deleted to do it: admin_counts() in supabase/schema.sql still
     counts both and still sends them, so either is one row back. */
  var n=ADMINN||{}, rows=MODS||[], now=adminNow();
  return '<div class="view">'+navTop('')+'<div class="body">'+
    (ADMIN_ERR? '<div class="mnone bad">'+esc(ADMIN_ERR)+'</div>' : '')+
    adminRow('admin.people', n.people)+
    adminOpen('admin.got', adminGotTop(), 'money')+
    adminOpen('admin.keep', adminPct(now.keep), 'keep')+
    adminOpen('admin.dl', now.downloads, 'dl')+
    adminRow('admin.reports', n.reports, 'goMod')+
    /* Who answers them, and the field that adds one. Both stay here: their
       buttons exist only where they are drawn, and act-check walks this route
       with no argument -- see the head of this section. */
    '<div class="set"><span class="sl">'+esc(t('admin.staff'))+'</span></div>'+
    (ADMINS||[]).map(adminStaffRow).join('')+
    '<div class="field"><input id="admin-h" type="text" '+
      'value="'+esc(ADMIN_H)+'" placeholder="'+esc(t('admin.staff.ph'))+'" '+
      'autocapitalize="none" autocorrect="off" spellcheck="false"' +
      IN('adminStaffSet', ['h']) + '></div>'+
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
