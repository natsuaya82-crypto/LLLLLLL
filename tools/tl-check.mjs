/* The timeline, read by somebody who is not the person who wrote it.
   ---------------------------------------------------------------------
   Five things off the owner's own phone on 2026-09-04
   (docs/reports/2026-09-04-owner-shots/). Not one of them throws, and every
   one of them looks perfectly right for as long as the only person in the app
   is you.

   1. A POST HAS TWO NAMES AND EVERY LOOKUP ANSWERS FOR BOTH. `id` is what
      this phone calls a post it wrote; `sid` is where the server keeps it,
      and the two differ for exactly the posts the owner writes. An answer
      that came back from the server points at the SERVER's name, and the
      thread was opened on the LOCAL one -- so postKids() sorted one
      conversation into two halves and the reply appeared on the timeline and
      nowhere else. 「返事したはずなのにスレッドに来ない」 OWNER 2026-09-04:
      4-home.png has the reply that 3-thread.png does not.
      The other way too -- a notice carries the server's name, so opening a
      thread from one about your own post drew 「ありません」 over a post that
      is right there.

   2. YOUR OWN HANDLE IS NOT IN YOUR OWN FOLLOW LISTS. `follow` in
      supabase/schema.sql carries `check (follower <> followed)`, so a row
      saying you follow yourself is one the server cannot hold. The copy on
      the phone held one anyway, and the owner was looking at it:
      「ここも？になるの謎だし、ここにフォローされてますがないよ」 OWNER
      2026-09-04, 1-following.png -- their own handle at the top of 「フォロー
      中」 with no name, no face, no button and no label, because all four of
      those are what a row about yourself is.

   3. AND YOUR OWN ROW DRAWS ITSELF WHEREVER IT LEGITIMATELY APPEARS -- on
      somebody else's followers list, which is the ordinary way to arrive
      there. whoOf() refused to answer for your own handle and said why
      (「that is ME, it is on this phone」) and then nothing read ME, so your
      row was a question mark. It looked right for as long as this phone
      happened to be holding a post of yours to take a name off.

   4. A REPLY IS NOT ON おすすめ. 「リプライはおすすめ並ぶことないでしょ？
      基本」 OWNER 2026-09-04. 「フォロー中」 keeps them: those are the people
      somebody chose to read.

   5. NOTHING TURNS UNDER A COUNT, AND THE CARD ALWAYS SAYS BOTH NUMBERS.
      「プロフィールは、出す物を全部読み込んでから開く」 OWNER 2026-09-07,
      which replaces 「取れなかったら数は出さずに行だけ（空欄ではなく前回の値
      があればそれ）」 of 2026-09-06. Both of those were answers to 「what do I
      put where the count would be」, and a page that is not drawn until every
      answer is in is never asked that: www/me.js § profileOpen waits on
      `mine` before it opens. So a mark under the words is gone, the word on
      its own is gone, and what stands there is the count.

      WHAT IS HELD HERE IS THE CARD, and the waiting is acct-check 59-60's --
      one place each. 「0 と出て1秒後に1に変わる、をしない」 OWNER 2026-09-04
      is kept by the page waiting rather than by the number hiding, and an
      answered 0 is still an answer and is still printed.

   7. 「フォローされています」 IS ON A PERSON'S CARD AND NOT ONLY ON A LIST.
      「フォローされてるのに出ないよ。136で見てる」 OWNER 2026-09-05. The
      badge lived in snsWhoRow() alone, which is a row of the FOLLOW LIST, so
      somebody who follows you wore it where you went looking for a list of
      them and nowhere on their own page. Two halves: it has to be drawn, and
      the phone has to have ASKED who follows it on the road that arrives
      straight at that card. vProfile() asked only on your OWN page, so
      ME.fr stayed absent -- and an absent list draws the same picture as
      「nobody」. 「空」と「まだ誰も訊いていない」は別. No screen asks at all
      now 「画面に入った瞬間にサーバーへ訊きに行くのは無し」 OWNER 2026-09-05:
      the road is the session beginning, and that is what is read here.

   8. AND A FOLLOW PULL THAT FALLS OVER SAYS SO. 「通信エラーなら進むわけ
      ねえだろ全部」「エラーになったらエラー用のポップ出して再更新とかおさせれば
      いい」 OWNER 2026-09-05. There were two functions with a flag each, and
      one of them put its flag back and did nothing else -- no 「接続できま
      せん」, and 再接続 had nowhere to go back to. They are ONE ask now
      (`mine`), so either half falling has to reach the same pop; both are
      read, because 「one of the two is silent」 was the fault.

   Run: node tools/tl-check.mjs                                          */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{width:390,height:844} });
const errs = [];
pg.on('pageerror', (e) => errs.push(String(e && e.message || e)));
await pg.goto('file://' + path.join(dir,'..','www','index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:10000 });

const r = await pg.evaluate(({ s }) => {
  eval('(' + s + ')()');
  SET.walked = true;
  const out = {};

  /* ---- 1: the two names ------------------------------------------------
     The owner's own post, gone up, answered by somebody else. The answer
     carries `to` = the SERVER's name for it, which is the only name the
     phone that wrote the answer ever saw. */
  const mine = POSTS[0];
  mine.sid = 'SRV-1';
  POSTS.push({ id:'SRV-9', sid:'SRV-9', at:Date.now(), lang:mine.lang,
               lname:'Vethi', ln:'zzz', mn:'zzz', who:'Iri', hd:'iri',
               mine:false, to:'SRV-1', toh:mine.hd });
  NAV = [{ r:'thread', a:mine.id }];
  out.threadByLocal = vThread().indexOf('zzz') >= 0;
  NAV = [{ r:'thread', a:mine.sid }];
  const bySid = vThread();
  out.threadBySid = bySid.indexOf('zzz') >= 0;
  out.postBySidFound = !!postById(mine.sid);
  /* and the reply is still on the timeline it was already on -- a thread
     that finds it must not be a feed that lost it */
  out.feedHasReply = postAll().some((p) => p.id === 'SRV-9');

  /* ---- 4: おすすめ has no replies, フォロー中 keeps them ----------------- */
  snsTab = 'rec';
  out.recReplies = snsList().filter((p) => !!p.to).length;
  out.recPosts   = snsList().length;
  snsTab = 'fo';
  /* フォローは `follow` 表の答えで、FOL_HAVE がその置き場です
     （www/me.js § meFollowing、2026-09-09）。 */
  folPut(false, meHandle(), ['iri']);
  out.foReplies = snsList().filter((p) => !!p.to).length;
  snsTab = 'rec';
  /* a person's own page still shows their answers -- the 返信 tab is what it
     is for, and taking replies off ONE list must not take them off that */
  NAV = [{ r:'profile', a:'' }];
  pfTab = 're';
  out.profileReplies = pfList().filter((p) => !!p.to).length;
  pfTab = 'posts';

  /* ---- 4c: @名前 で始めた投稿は「返信」の側 ------------------------------
     「返信にだけ出して」 OWNER 2026-09-09.

     本文が `@x ` で始まる投稿は、その人への投稿になりました（2026-09-07）。
     答えている投稿が無いので `to` は空で、持っているのは `toh` だけです。
     「返信」を `!!p.to` で選んでいるあいだ、その投稿は「投稿」の側に並んで
     いました。

     何を「返信」と呼ぶかの答えは一つ ── `postToWho(p)`、返信先の人が
     いるかどうか。二つの欄はその一つの問いの表と裏なので、両方訊きます:
     @ 始まりは返信に在って投稿に無い、ふつうの投稿はその逆。片方だけだと、
     どちらの欄にも出る（あるいは消える）状態が緑のまま通ります。 */
  POSTS.push({ id:'AT-1', at:Date.now()-5, lang:mine.lang, lname:'Vethi',
               ln:'atline', mn:'atline', who:'Aya', hd:meHandle(),
               mine:true, to:'', toh:'iri' });
  POSTS.push({ id:'PL-1', at:Date.now()-4, lang:mine.lang, lname:'Vethi',
               ln:'plain', mn:'plain', who:'Aya', hd:meHandle(),
               mine:true, to:'', toh:'' });
  NAV = [{ r:'profile', a:'' }];
  const ids = (k) => { pfTab = k;
    return pfList().map((p) => p.id); };
  out.atInRe    = ids('re').indexOf('AT-1') >= 0;
  out.atInPosts = ids('posts').indexOf('AT-1') >= 0;
  out.plainInRe    = ids('re').indexOf('PL-1') >= 0;
  out.plainInPosts = ids('posts').indexOf('PL-1') >= 0;
  pfTab = 'posts';

  /* ---- 4b: and the third list is one day's ------------------------------
     「絞り込みに「#今日のお題」を足す。その行を選ぶと、その日のお題に答えた
     投稿だけ」 OWNER 2026-09-06.

     Two halves and each is enough on its own: the row has to BE on the filter
     page, and choosing it has to narrow the timeline to the posts carrying
     today's id. The narrowing is asked of `pr` -- the column, not the
     characters in the body -- so a post somebody deleted the tag from is
     still in the list and a post that merely says 「#今日のお題」 is not. */
  DAY = { id:77, on_day:'2026-09-06', text:'today', says:{} };
  DAY_GOT = true;
  POSTS.push({ id:'pr-yes', at:Date.now()-10, lang:'other', lname:'V', ln:'qel',
               who:'Iri', hd:'iri', mine:false, mn:'answered it', ui:'en', pr:77 },
             { id:'pr-tag', at:Date.now()-20, lang:'other', lname:'V',
               ln:'qel #今日のお題', who:'Iri', hd:'iri', mine:false,
               mn:'says the tag and answers nothing', ui:'en' },
             { id:'pr-old', at:Date.now()-30, lang:'other', lname:'V', ln:'qel',
               who:'Iri', hd:'iri', mine:false, mn:'yesterday', ui:'en', pr:76 });
  NAV = [{ r:'filter', a:'' }];
  out.filRows = (vFilter().match(/data-do="snsSetFil" data-a="\[&quot;(\w+)/g) || [])
                  .map((m) => m.slice(m.lastIndexOf(';') + 1));
  const wasTab = snsTab;
  snsTab = 'day';
  out.dayList = snsList().map((p) => p.id);
  /* and a phone that has not been told today's sentence shows no day at all,
     rather than every post that carries any prompt */
  const wasDay = DAY;
  DAY = null;
  out.dayNoRow = snsList().length;
  DAY = wasDay;
  snsTab = wasTab;

  /* ---- 2: yourself, out of your own two lists -------------------------- */
  folPut(false, meHandle(), [meHandle(), 'iri']);
  folPut(true, meHandle(), [meHandle(), 'veth']);
  out.ownFollowing = meFollowing();
  out.ownFollowers = meFollowers();
  NAV = [{ r:'follows', a:'ing' }];
  out.ownRows = vFollows().split('<div class="whrow">').length - 1;
  /* AND THE COUNT SAYS WHAT THE LIST SHOWS. Taking the row out at the row
     would leave the number saying two over a list of one. */
  NAV = [{ r:'profile', a:'' }];
  out.ownCountShown = (meCard().match(/<b>(\d+)<\/b>/g) || []).join(',');

  /* ---- 3: your own row, drawn, with no post of yours on this phone ------ */
  const wasPosts = POSTS.slice();
  POSTS.length = 0;
  FOL_HAVE['ers:iri'] = [meHandle()];
  FOL_ASKED['ers:iri'] = 1;
  NAV = [{ r:'follows', a:'ers:iri' }];
  const row = vFollows();
  out.ownRowName = (row.match(/class="pname">([^<]*)</) || [])[1] || '';
  out.ownRowQ    = row.indexOf('>?</span>') >= 0;
  out.ownRowFace = row.indexOf('class="pav"') >= 0;
  POSTS.push.apply(POSTS, wasPosts);

  /* ---- 6: a screen that can be asked again ------------------------------
     The pull is driven through pullLet(true), which is what a thumb reaching
     far enough down ends in -- so what is measured is the road a person
     takes, not a function called by name. netReplies() and netPostsBy() are
     wrapped where they are DEFINED, so what is read is the request that
     would have gone out. */
  const asked = { replies:null, by:null };
  const realReplies = netReplies, realBy = netPostsBy, realWho = netWho,
        realFollowers = netFollowers;
  netReplies  = function(ids, k){ asked.replies = ids.slice(); k([]); };
  netPostsBy  = function(h, k){ asked.by = String(h); k([]); };
  netWho      = function(h, k){ asked.who = String(h); k(null); };
  netFollowers = function(k){ asked.fr = (asked.fr || 0) + 1; k(null); };
  try {
    out.pullRoutes = Object.keys(PULL_ON).sort().join(' ');

    /* A thread: every post drawn on it, by the name the server knows it by.
       `p1` has gone up (sid SRV-1); the reply arrived wearing SRV-9; a post
       written here and never sent has no name there and must be left out. */
    POSTS.push({ id:'LOCAL-ONLY', at:Date.now(), lang:mine.lang, lname:'Shango',
                 ln:'zz', mn:'zz', who:'Aya', hd:mine.hd, mine:true, to:'SRV-1' });
    NAV = [{ r:'thread', a:mine.id }];
    pullLet(true);
    out.threadAsked = (asked.replies || []).slice().sort().join(' ');
    POSTS.pop();

    /* A person's page asks for what they have written, and for who they are
       again -- WHO_ASKED is per handle and would otherwise never ask twice. */
    WHO_ASKED['iri'] = 1;
    NAV = [{ r:'profile', a:'iri' }];
    pullLet(true);
    out.whoPullAsked = asked.by === 'iri' && asked.who === 'iri';

    /* And your own two lists, which are asked ONCE a session -- when it
       begins. A pull is a person saying 「もう一度聞け」.
       「なんか3フォロワーなのに2人しかいない」 */
    PULL_GOT.mine = 1;
    asked.fr = 0;
    NAV = [{ r:'follows', a:'ers' }];
    pullLet(true);
    out.followersAskedAgain = asked.fr;
  } finally {
    netReplies = realReplies; netPostsBy = realBy; netWho = realWho;
    netFollowers = realFollowers;
  }

  /* ---- and the mark on your own name stays where it was ----------------
     One place says whether a name wears it (postBadge), and your own card
     started asking it through whoOf() -- so whoOf() has to say the row is
     yours or the mark quietly leaves the one screen it worked on. */
  const wasPlan = SET.plan;
  SET.plan = 'pro';
  NAV = [{ r:'profile', a:'' }];
  out.proMark = meCard().indexOf('bdgw') >= 0;
  SET.plan = 'free';
  out.freeMark = meCard().indexOf('bdgw') >= 0;
  SET.plan = wasPlan;

  /* ---- 5: the two counts on a card -------------------------------------
     THERE ARE NOT THREE STATES ANY MORE. There were: answered, not answered
     but this phone holds last session's lists, and neither -- and the middle
     and last of those were what the card DREW while it waited. The card does
     not wait now (www/me.js § profileOpen; acct-check 59-60 holds the
     waiting), so what is asked here is what it draws: both numbers, no mark,
     and an answered 0 printed as 0.

     PULL_GOT.mine IS PUT BACK TO 0 FOR IT, which is the state 「the server
     has not spoken this session」 -- the one the two deleted faces lived in.
     The card is asked in exactly that state and has to print the numbers
     anyway, because there is no such face any more: it is the page that
     waits, not the card that hides. Without this line the check stands in a
     state where the old road would have been right too, and would go green
     with it put back. */
  const wasFo = folOf(false, meHandle()), wasFr = folOf(true, meHandle()),
        wasGot = PULL_GOT.mine;
  PULL_GOT.mine = 0;
  NAV = [{ r:'profile', a:'' }];
  /* Two names in one list and one in the other, neither of them yours: the
     count is what these say and there is nothing for meNotMe() to take out
     of them, so the number expected here is written down rather than worked
     out again from the lists. */
  folPut(false, meHandle(), ['iri', 'veth']); folPut(true, meHandle(), ['iri']);
  out.meWaits = (meCard().match(/numwait/g) || []).length;
  /* and what stands there is the count */
  out.meHeldLast = meCard().indexOf('<b>2</b>') >= 0 &&
                   meCard().indexOf('<b>1</b>') >= 0;
  folPut(false, meHandle(), []); folPut(true, meHandle(), []);
  out.meZeroIsZero = meCard().indexOf('<b>0</b>') >= 0;
  folPut(false, meHandle(), wasFo); folPut(true, meHandle(), wasFr);
  PULL_GOT.mine = wasGot;
  /* and somebody else's card, whose numbers are the server's */
  delete WHO_HAVE['iri'];
  NAV = [{ r:'profile', a:'iri' }];
  out.whoWaits = (whoCard('iri').match(/numwait/g) || []).length;
  WHO_HAVE['iri'] = { who:'Iri', fo:3, fr:4 };
  const card = whoCard('iri');
  out.whoNums = card.indexOf('<b>3</b>') >= 0 && card.indexOf('<b>4</b>') >= 0;
  out.whoStillWaits = (card.match(/numwait/g) || []).length;

  /* ---- 7: 「フォローされています」 is on the CARD, not only on the list ---
     「フォローされてるのに出ないよ。136で見てる」 OWNER 2026-09-05.

     TWO HALVES, and the second is the one that fails without a mark on the
     screen. The badge has to be DRAWN on somebody's card, and this phone has
     to have ASKED who follows it on the road that goes straight to that card.
     With only the first, ME.fr is ABSENT, meFollowers() answers [], and an
     absent list draws exactly the picture 「nobody follows you」 draws --
     「空」と「まだ誰も訊いていない」は別 (CLAUDE.md § Data). That is the
     half a screenshot cannot tell apart, so it is asked here as a REQUEST:
     what is read is whether the question went out at all. */
  const heldFr = folOf(true, meHandle());
  WHO_HAVE.veth = { who:'Veth', hd:'veth', fo:1, fr:1 };
  folPut(true, meHandle(), ['iri']);
  out.backOnCard  = whoCard('iri').indexOf('whyou') >= 0;
  out.backOnOther = whoCard('veth').indexOf('whyou') >= 0;
  /* and never on your own name -- meFollowers() is the list with you taken
     out of it, and this is the screen that would say 「you follow you」 */
  folPut(true, meHandle(), [meHandle(), 'iri']);
  out.backOnSelf = whoCard(meHandle()).indexOf('whyou') >= 0;

  /* AND THE QUESTION IS PUT, ON A ROAD THAT DOES NOT DEPEND ON WHICH SCREEN
     SOMEBODY OPENED. It used to be asked by vProfile() being drawn, which is
     why it is measured here at all -- somebody who reached a person's page
     from a notice without ever opening their own profile never sent it.

     It is not asked by a screen at all now 「画面に入った瞬間にサーバーへ
     訊きに行くのは無し」 OWNER 2026-09-05: it goes out when the SESSION
     begins, with everything else the app reads (www/sns.js § WHAT AN OPEN
     ASKS FOR). So what is read here is that road -- `mine` is on the open's
     list, and asking it sends the request. */
  const wasFollowers = netFollowers;
  let followerAsks = 0;
  netFollowers = function (ok) { followerAsks++; ok([]); };
  /* 「まだ誰も訊いていない」は、答えが無いこと ── FOL_HAVE にその鍵が
     無いことです（www/me.js § folGot）。 */
  delete FOL_HAVE[folKey(true, meHandle())];
  out.mineOnOpen = PULL_OPEN.indexOf('mine') >= 0;
  PULL_GOT.mine = 0; PULL_OUT.mine = 0;
  pullBoot();
  out.askedOnTheirs = followerAsks;
  netFollowers = wasFollowers;
  PULL_GOT.mine = 1; PULL_OUT.mine = 0;
  folPut(true, meHandle(), heldFr);

  /* ---- 8: a request that falls over says so, and 再接続 goes back for it -
     「通信エラーなら進むわけねえだろ全部」「エラーになったらエラー用のポップ
     出して再更新とかおさせればいい」 OWNER 2026-09-05.

     One of the two swallowed its failure -- the flag went back and nothing
     else happened: no pop, and 再接続 had nowhere to go back to. The other
     had put one up since the day it was written.

     THE PAIR IS READ SIDE BY SIDE, because the fault is that ONE of two
     answers and the other is silent, and a check that watched one alone
     could not see that. Silence is the worse half here: with no ME.fr the
     screen draws 「nobody follows you」 and the person is shown nothing at
     all about what happened. */
  const heldPair = { fr:folOf(true, meHandle()), fo:folOf(false, meHandle()),
                     ers:netFollowers, ing:netFollowing };
  const fell = () => {
    popOff();
    NET_AGAIN = [];
    PULL_GOT.mine = 0; PULL_OUT.mine = 0;
    pullGo('mine');
    return { pop:popOn(), again:NET_AGAIN.length === 1 };
  };
  /* EITHER HALF FALLING IS ONE FALL, because the two lists are one ask now
     (`mine`, www/me.js § meFollowsPull). It was two functions with a flag
     each, and one of them swallowed its failure in silence -- no pop, and
     再接続 with nowhere to go back to. There is one road and it cannot
     differ from itself. */
  netFollowers = function (ok, bad) { bad(null, 0, 'follow 0'); };
  netFollowing = function (ok, bad) { ok([]); };
  out.ersFell = fell();
  netFollowers = function (ok, bad) { ok([]); };
  netFollowing = function (ok, bad) { bad(null, 0, 'follow 0'); };
  out.ingFell = fell();
  popOff();
  NET_AGAIN = [];
  netFollowers = heldPair.ers; netFollowing = heldPair.ing;
  PULL_GOT.mine = 1; PULL_OUT.mine = 0;
  folPut(true, meHandle(), heldPair.fr); folPut(false, meHandle(), heldPair.fo);

  /* ---- 8: NOBODY IS A '?' THAT BECOMES A NAME ---------------------------
     「ユーザーもアイコンとか？になってあとで表示されるけど、なんで？毎回1
     読み込みだろ？」 OWNER 2026-09-07, on a phone.

     Two halves and they are two. postFace() draws the first letter of
     whoever wrote a post and falls through to '?' when it has no name at
     all -- so 「there is a '?' on the first drawing」 is the question, asked
     of what the screen actually rendered. And 「毎回1読み込み」 is the
     other: a list of people used to be one request PER ROW, put from inside
     the render, so twenty people were twenty requests and twenty '?' that
     became names one at a time.

     THE FEED AND THE THREAD WERE ALREADY RIGHT and are held so they stay
     that way: a post carries its writer (rule 8), so those two screens ask
     about nobody at all. The two that were wrong are the lists of people --
     the follow lists, and the people on a grouped notice -- and both go
     through a door that gets the lot in ONE request before the screen opens
     (www/me.js § whoNeed, followsOpen, notfoOpen).

     ONE REQUEST AND NOT TWO. It was two until 2026-09-08: the people, and
     then their languages' names, asked one after the other. The language is
     a column of `profile_seen` now (supabase/schema.sql), so that second
     round trip is gone -- 「なんか全体的に遅くない？」 OWNER 2026-09-08.

     The requests are counted at the WIRE, not at netWhoMany(): what is
     claimed is how many times this phone speaks, and a check that counted
     calls to the function under test would be counting the thing it is
     asking about. The language names are the second request and are one for
     the lot of them too -- so a screenful of people is two, whatever the
     screenful is. */
  {
    const wire = [];
    const held = [];
    const realS1 = netSend1, realS = netSend, realG = netGet;
    netSend1 = function (m, p, b, t, ok) {
      p = String(p); wire.push(p);
      held.push(function () {
        ok(p.indexOf('/rest/v1/profile_seen?') === 0
             ? [{ id:'u1', handle:'kai', display:'Kai', av:null, fo:1, fr:2 },
                { id:'u2', handle:'noa', display:'Noa', av:null, fo:0, fr:0 }]
             : [], 200);
      });
    };
    netSend = function (m, p, b, t, ok, bad, up) { netSend1(m, p, b, t, ok, bad, up, true); };
    netGet = function (p, ok, bad) { netSend('GET', p, null, '', ok, bad); };

    const qOf = (h) => (String(h).match(/class="bch">\?/g) || []).length;
    const app = document.getElementById('app');

    /* the feed, drawn as it stands: a post carries its writer */
    NAV = [{ r:'feed' }]; window.route = 'feed';
    wire.length = 0; render();
    out.feedQ = qOf(app.innerHTML);
    out.feedReq = wire.length;

    /* and a thread */
    NAV = [{ r:'thread', a:'p1' }]; window.route = 'thread';
    wire.length = 0; render();
    out.thrQ = qOf(app.innerHTML);
    out.thrReq = wire.length;

    /* a list of people, entered the way a thumb enters it */
    const walk = (name, fn) => {
      WHO_HAVE = {}; WHO_ASKED = {};
      NAV = [{ r:'feed' }]; window.route = 'feed'; render();
      const wasFeed = app.innerHTML;
      wire.length = 0; held.length = 0;
      let first = null;
      const realRender = window.render;
      window.render = function () {
        const rr = realRender.apply(this, arguments);
        if (first === null && here().r !== 'feed') first = app.innerHTML;
        return rr;
      };
      fn();
      out[name + 'Early'] = app.innerHTML !== wasFeed;
      for (let n = 0; n < 20 && first === null && held.length; n++) held.shift()();
      window.render = realRender;
      out[name + 'Q'] = first === null ? -1 : qOf(first);
      out[name + 'Req'] = wire.length;
    };
    folPut(false, meHandle(), ['kai', 'noa']);
    walk('fol', () => followsOpen('ing'));
    walk('ntf', () => notfoOpen('kai,noa'));
    folPut(false, meHandle(), heldPair.fo);
    WHO_HAVE = {}; WHO_ASKED = {};
    netSend1 = realS1; netSend = realS; netGet = realG;
    NAV = [{ r:'feed' }]; window.route = 'feed';
  }

  /* ---- A FOLLOW AND A BLOCK ARE ONE ROW, AND THE COLUMNS ARE THE ARGUMENT
     netFollow() and netBlock() were written out twice, 1100 lines apart, and
     are netPairRow() once now (docs/DUPLICATES.md 14). Their two columns used
     to be literals AT each site; they are positional arguments, so a swapped
     pair writes 「they follow you」 where 「you follow them」 was meant, with
     nothing thrown, nothing on screen, and no check anywhere the wiser --
     tl-check stubs netFollowers()/netFollowing() and has never driven these
     two at all.

     Asked at the WIRE and per column, because the counts agreeing while the
     pairing is shifted is the only way this breaks. Both directions: the row
     made, and the row taken away by the same two columns in the same roles. */
  {
    const sent = [];
    const realS1 = netSend1, realS = netSend, realG = netGet;
    netSend1 = function (m, p, b, t, ok) {
      p = String(p);
      /* The handle turned into an account. Not counted -- it is the lookup
         the two share and not the row either of them writes. */
      if (p.indexOf('/rest/v1/profile?select=id') === 0) { ok([{ id:'them' }], 200); return; }
      sent.push({ m: m, p: p, b: b });
      ok([], 200);
    };
    netSend = function (m, p, b, t, ok, bad, up) { netSend1(m, p, b, t, ok, bad, up, true); };
    netGet = function (p, ok, bad) { netSend('GET', p, null, '', ok, bad); };
    const one = (fn) => { sent.length = 0; fn(); return sent[0] || {}; };
    const nop = function () {};
    const fOn = one(() => netFollow('iri', true, nop, nop));
    const bOn = one(() => netBlock('iri', true, nop, nop));
    const fOff = one(() => netFollow('iri', false, nop, nop));
    const bOff = one(() => netBlock('iri', false, nop, nop));
    out.pairOn = fOn.m + ' ' + fOn.p + ' ' + JSON.stringify(fOn.b) + ' | ' +
                 bOn.m + ' ' + bOn.p + ' ' + JSON.stringify(bOn.b);
    out.pairOff = fOff.m + ' ' + fOff.p + ' | ' + bOff.m + ' ' + bOff.p;
    netSend1 = realS1; netSend = realS; netGet = realG;
  }

  return out;
}, { s: seed.toString() });

const fails = [];
const say = (m) => fails.push(m);

if (!r.threadByLocal)
  say('the thread of your own post does not carry the answer that came back ' +
      'from the server: postKids() matched a name instead of asking which ' +
      'post. 3-thread.png.');
if (!r.threadBySid)
  say('the same thread, opened by the server’s name for the post — which ' +
      'is the only name a notice carries — does not carry it either.');
if (!r.postBySidFound)
  say('postById() will not answer to a post’s server name, so a notice ' +
      'about your own post opens 「ありません」 over a post that is here.');
if (!r.feedHasReply)
  say('the reply left the timeline. A thread that finds it is not a feed ' +
      'that loses it.');

if (r.recReplies !== 0)
  say('おすすめ carries ' + r.recReplies + ' replies. ' +
      '「リプライはおすすめ並ぶことないでしょ？基本」');
if (!r.recPosts)
  say('おすすめ carries nothing at all — the sieve took the posts too.');
if (!r.foReplies)
  say('フォロー中 lost its replies as well. Those are the people somebody ' +
      'chose to read, and a thread of theirs is theirs to say.');
if (!r.profileReplies)
  say('a person’s 返信 tab lost its replies. One list was asked about, ' +
      'not the post.');

if (!r.atInRe)
  say('a post that begins @x is not in the 返信 tab. 「返信にだけ出して」 ' +
      'OWNER 2026-09-09 — it carries `toh` and no `to`, and 返信 must be ' +
      'one question: postToWho(p).');
if (r.atInPosts)
  say('a post that begins @x is ALSO in the 投稿 tab. 「返信にだけ出して」 ' +
      '— the two lists are one question’s two sides, so taking it into 返信 ' +
      'means taking it out of 投稿.');
if (r.plainInRe)
  say('an ordinary post is in the 返信 tab. The question widened past what ' +
      'a reply is.');
if (!r.plainInPosts)
  say('an ordinary post left the 投稿 tab.');

if (r.ownFollowing.indexOf('aya') >= 0 || r.ownFollowers.indexOf('aya') >= 0)
  say('your own handle is in your own follow lists. `follow` in ' +
      'supabase/schema.sql refuses the row; the copy must too. 1-following.png');
if (r.ownRows !== 1)
  say('your own 「フォロー中」 draws ' + r.ownRows + ' rows where the list ' +
      'has one.');
if (r.ownCountShown !== '<b>1</b>,<b>1</b>')
  say('the count under the profile says ' + r.ownCountShown + ' over a list ' +
      'of one. Taking the row out at the row leaves the number behind.');

if (r.ownRowQ || r.ownRowName !== 'Aya')
  say('your own row on somebody else’s followers list draws ' +
      (r.ownRowQ ? 'a question mark' : '「' + r.ownRowName + '」') +
      ' where your name is. whoOf() would not answer for you and nothing ' +
      'read ME. 「ここも？になるの謎だし」');
if (!r.ownRowFace)
  say('and no face on it either.');

for (const want of ['thread', 'profile', 'follows', 'feed', 'explore', 'notif'])
  if (r.pullRoutes.split(' ').indexOf(want) < 0)
    say('the pull does not answer on `' + want + '`. 「ここ更新ないから見れないし」');
if (r.threadAsked !== 'SRV-1 SRV-9')
  say('pulling a thread asks about 「' + r.threadAsked + '」. It has to be ' +
      'every post drawn on the page, by the name the server knows each by — ' +
      'and never a post written here that has not gone up, which that server ' +
      'has never heard of.');
if (!r.whoPullAsked)
  say('pulling a person’s page does not ask for their posts and for who they ' +
      'are again. 「他の人の画面でも更新できるようにしたい」');
if (r.followersAskedAgain !== 1)
  say('pulling your followers list asks ' + r.followersAskedAgain + ' times. ' +
      'It is asked once a session, so a pull has to clear that or the list ' +
      'stands still until the app is killed.');

if (!r.proMark)
  say('the mark is off your own profile on Pro. One place says whether a ' +
      'name wears it and whoOf() has to say the row is yours.');
if (r.freeMark)
  say('and it is on it on the free plan.');
if (r.filRows.indexOf('day') < 0)
  say('the filter page offers ' + r.filRows.join(' ') + ' — 「#今日のお題」 is ' +
      'one of the answers to 「what am I looking at」 (OWNER 2026-09-06).');
if (r.dayList.join(',') !== 'pr-yes')
  say('choosing 「#今日のお題」 shows ' + (r.dayList.join(',') || 'nothing') +
      '. It is the posts carrying today\u2019s id and nothing else — not the ' +
      'ones that merely type the tag, and not another day\u2019s.');
if (r.dayNoRow)
  say('a phone that has not been told today\u2019s sentence still draws ' +
      r.dayNoRow + ' post(s) under 「#今日のお題」. With no id there is no day.');

if (r.meWaits)
  say('something turns under the two counts on your own profile (' +
      r.meWaits + ' mark(s)). 「くるくる回る → 回さない」 OWNER 2026-09-06.');
if (!r.meHeldLast)
  say('your own card does not print the two counts. The page waits for them ' +
      'before it opens (www/me.js § profileOpen), so there is nothing else ' +
      'for this row to say.');
if (!r.meZeroIsZero)
  say('and following nobody prints nothing — an answered 0 is an answer and ' +
      'has to be printed.');
if (r.whoWaits)
  say('something turns under the two counts on somebody else\u2019s card (' +
      r.whoWaits + ' mark(s)). 「くるくるも出さない」 OWNER 2026-09-07.');
if (!r.whoNums || r.whoStillWaits)
  say('and the numbers do not land when the server answers.');

if (!r.backOnCard)
  say('somebody who follows you wears no 「フォローされています」 on their ' +
      'own page. The badge is in snsWhoRow() and that is a row of the follow ' +
      'LIST — a profile card is not that row. 「フォローされてるのに出ないよ」');
if (r.backOnOther)
  say('and somebody who does NOT follow you wears it.');
if (r.backOnSelf)
  say('and your own name wears it. meFollowers() is the list with you taken ' +
      'out of it and this reads something else.');
if (!r.mineOnOpen)
  say('「who follows me」 is not on the list the app asks for when a session ' +
      'begins, so nothing asks it at all: no screen may ask on the way in. ' +
      '「画面に入った瞬間にサーバーへ訊きに行くのは無し」');
if (r.askedOnTheirs !== 1)
  say('the session beginning sends ' + r.askedOnTheirs + ' request(s) for who ' +
      'follows this account. With none, ME.fr stays ABSENT and an absent list ' +
      'draws the same picture as 「nobody follows you」. ' +
      '「空」と「まだ誰も訊いていない」は別');

if (!r.ersFell.pop)
  say('「who follows me」 falling over puts nothing on the screen. The phone ' +
      'draws 「nobody follows you」 and the person is told nothing. ' +
      '「通信エラーなら進むわけねえだろ全部」');
if (!r.ersFell.again)
  say('and 再接続 does not go back for it, so there is no way to ask again ' +
      'short of killing the app.');
if (!r.ingFell.pop || !r.ingFell.again)
  say('「who I follow」 falling over is silent — the two lists are one ask ' +
      'now, so either half falling has to reach the same pop.');

if (errs.length) say('the page threw: ' + errs[0]);

console.log('a post answers to both its names: the thread carries the reply ' +
            'opened either way');
console.log('絞り込み: ' + r.filRows.join(' ') + ' — 「#今日のお題」 is the ' +
            'posts carrying today’s id, by the column and not by the tag');
console.log('おすすめ: ' + r.recPosts + ' posts, no replies; フォロー中 and the ' +
            '返信 tab keep theirs');
console.log('your own two lists: ' + r.ownFollowing.length + ' / ' +
            r.ownFollowers.length + ', with you in neither, and the counts ' +
            'say the same');
console.log('your own row elsewhere: 「' + r.ownRowName + '」 with a face, on a ' +
            'phone holding no post of yours');
console.log('counts: nothing turns under them — the page waits for both ' +
            'before it opens, so what stands there is the count, and ' +
            '0 is an answer');
console.log('and the Pro mark is on your own name on Pro and off it on free');
console.log('「フォローされています」: on the card of somebody who does, off ' +
            'everybody else’s and off your own, and the session beginning ' +
            'asks who follows this account ' + r.askedOnTheirs + ' time(s) — ' +
            'no screen asks on the way in');
console.log('either half of the one follow ask falling over puts up ' +
            '「接続できません」, and 再接続 goes back for it');
if (r.feedQ || r.thrQ)
  say('a post is drawn with 「?」 where its writer\u2019s name goes (feed ' +
      r.feedQ + ', thread ' + r.thrQ + '). A post carries its writer (rule 8) ' +
      'and there is nothing to wait for.');
if (r.feedReq || r.thrReq)
  say('the feed or the thread asks the server about the people on it (' +
      r.feedReq + ' + ' + r.thrReq + ' request(s)). It has them already.');
if (r.folEarly || r.ntfEarly)
  say('a list of people opened before the people were in. 「全部読み込んで' +
      'から開く」 OWNER 2026-09-07.');
if (r.folQ !== 0 || r.ntfQ !== 0)
  say('the first drawing of a list of people carries 「?」 faces (follows ' +
      r.folQ + ', the people on a notice ' + r.ntfQ + '), which become names ' +
      'a moment later. 「？になってあとで表示される」 OWNER 2026-09-07.');
if (r.folReq !== 1 || r.ntfReq !== 1)
  say('a list of two people costs ' + r.folReq + ' and ' + r.ntfReq +
      ' request(s). It is ONE whoever is on it — the people, with their ' +
      'language on the same row — and never one per row, and never a second ' +
      'round trip for the language. 「毎回1読み込みだろ？」');

const PAIR_ON =
  'POST /rest/v1/follow {"follower":"u","followed":"them"} | ' +
  'POST /rest/v1/block {"actor":"u","blocked":"them"}';
const PAIR_OFF =
  'DELETE /rest/v1/follow?follower=eq.u&followed=eq.them | ' +
  'DELETE /rest/v1/block?actor=eq.u&blocked=eq.them';
if (r.pairOn !== PAIR_ON)
  say('following and blocking somebody by handle writes\n    ' + r.pairOn +
      '\n  and it has to be\n    ' + PAIR_ON +
      '\n  One function writes both rows and the table and its two columns ' +
      'are the argument, so the pairing is what breaks and nothing throws ' +
      'when it does.');
if (r.pairOff !== PAIR_OFF)
  say('unfollowing and unblocking somebody by handle asks\n    ' + r.pairOff +
      '\n  and it has to be\n    ' + PAIR_OFF +
      '\n  The same two columns in the same roles, or the row taken away is ' +
      'somebody else\u2019s.');

console.log('a follow and a block are one row written by one function, and ' +
            'the columns are its argument: ' + r.pairOn);
console.log('nobody is a 「?」 that becomes a name: a post carries its writer ' +
            '(feed and thread ask about nobody), and a list of people is ' +
            'asked for in one request before the screen opens (' +
            r.folReq + ' at the wire for two people, ' + r.ntfReq +
            ' for the people on a notice)');
console.log('the pull answers on: ' + r.pullRoutes + ' — a thread asks about ' +
            'every post drawn on it, a person’s page for what they wrote, ' +
            'and a list that is asked once a session is asked again');

await br.close();
if (fails.length) {
  console.error('\ntl: ' + fails.length + ' thing' + (fails.length > 1 ? 's' : '') +
                ' about the timeline read by somebody else do not hold:\n');
  fails.forEach((m) => console.error('  ' + m + '\n'));
  process.exit(1);
}
console.log('\nthe timeline reads the same on the phone that did not write it.');
