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
   screen changed, and act-check draws every screen many times over. */
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
   rather than about a post, so it is the one thing that asks first. Taking a
   post down can be undone by pressing the same row again; this can too, but
   it is not the same size of mistake. */
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
