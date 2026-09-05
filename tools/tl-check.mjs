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

   5. A COUNT NOBODY HAS TAKEN IS NOT A ZERO. 「サーバーに聞く前にロードを
      挟み、遅れて数字が動くことを絶対に無くす。0 と出て1秒後に1に変わる、を
      しない。」 OWNER 2026-09-04. Both counts were the length of a list, and
      an unanswered list is empty -- so every profile printed 0 and then
      jumped.

   7. 「フォローされています」 IS ON A PERSON'S CARD AND NOT ONLY ON A LIST.
      「フォローされてるのに出ないよ。136で見てる」 OWNER 2026-09-05. The
      badge lived in snsWhoRow() alone, which is a row of the FOLLOW LIST, so
      somebody who follows you wore it where you went looking for a list of
      them and nowhere on their own page. Two halves: it has to be drawn, and
      the phone has to have ASKED who follows it on the road that arrives
      straight at that card. vProfile() asked only on your OWN page, so
      ME.fr stayed absent -- and an absent list draws the same picture as
      「nobody」. 「空」と「まだ誰も訊いていない」は別.

   8. AND A FOLLOW PULL THAT FALLS OVER SAYS SO. 「通信エラーなら進むわけ
      ねえだろ全部」「エラーになったらエラー用のポップ出して再更新とかおさせれば
      いい」 OWNER 2026-09-05. meFollowerPull() put FR_ASKED back and did
      nothing else -- no 「接続できません」, and 再接続 had nowhere to go back
      to -- while meFollowPull() beside it has put one up since it was
      written. The pair is read side by side, because 「one of the two is
      silent」 is the fault.

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
  SET.done = true;
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
  ME.fo = ['iri'];
  out.foReplies = snsList().filter((p) => !!p.to).length;
  snsTab = 'rec';
  /* a person's own page still shows their answers -- the 返信 tab is what it
     is for, and taking replies off ONE list must not take them off that */
  NAV = [{ r:'profile', a:'' }];
  pfTab = 're';
  out.profileReplies = pfList().filter((p) => !!p.to).length;
  pfTab = 'posts';

  /* ---- 2: yourself, out of your own two lists -------------------------- */
  ME.fo = [meHandle(), 'iri'];
  ME.fr = [meHandle(), 'veth'];
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

    /* And your own two lists, which are asked ONCE a session. A pull is a
       person saying 「もう一度聞け」. 「なんか3フォロワーなのに2人しかいない」 */
    FR_ASKED = true;
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

  /* ---- 5: a count that has not arrived --------------------------------- */
  const wasFo = ME.fo, wasFr = ME.fr;
  delete ME.fo; delete ME.fr;
  NAV = [{ r:'profile', a:'' }];
  out.meWaits = (meCard().match(/numwait/g) || []).length;
  ME.fo = []; ME.fr = [];
  out.meZeroIsZero = meCard().indexOf('<b>0</b>') >= 0;
  ME.fo = wasFo; ME.fr = wasFr;
  /* somebody known only from a post carries no counts and must not print 0 */
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
  const heldFr = ME.fr;
  WHO_HAVE.veth = { who:'Veth', hd:'veth', fo:1, fr:1 };
  ME.fr = ['iri'];
  out.backOnCard  = whoCard('iri').indexOf('whyou') >= 0;
  out.backOnOther = whoCard('veth').indexOf('whyou') >= 0;
  /* and never on your own name -- meFollowers() is the list with you taken
     out of it, and this is the screen that would say 「you follow you」 */
  ME.fr = [meHandle(), 'iri'];
  out.backOnSelf = whoCard(meHandle()).indexOf('whyou') >= 0;

  const wasFollowers = netFollowers;
  let followerAsks = 0;
  netFollowers = function () { followerAsks++; };
  delete ME.fr;
  FR_ASKED = false;
  NAV = [{ r:'profile', a:'iri' }];
  vProfile();
  out.askedOnTheirs = followerAsks;
  netFollowers = wasFollowers;
  FR_ASKED = false;
  ME.fr = heldFr;

  /* ---- 8: a request that falls over says so, and 再接続 goes back for it -
     「通信エラーなら進むわけねえだろ全部」「エラーになったらエラー用のポップ
     出して再更新とかおさせればいい」 OWNER 2026-09-05.

     meFollowerPull() swallowed the failure -- FR_ASKED went back to false and
     nothing else happened: no pop, and 再接続 had nowhere to go back to. Its
     neighbour meFollowPull() has put one up since the day it was written.

     THE PAIR IS READ SIDE BY SIDE, because the fault is that ONE of two
     answers and the other is silent, and a check that watched one alone
     could not see that. Silence is the worse half here: with no ME.fr the
     screen draws 「nobody follows you」 and the person is shown nothing at
     all about what happened. */
  const heldPair = { fr:ME.fr, fo:ME.fo, ers:netFollowers, ing:netFollowing };
  const fell = (pull, fn) => {
    popOff();
    NET_AGAIN = [];
    FR_ASKED = false; FO_ASKED = false;
    pull();
    return { pop:popOn(), again:NET_AGAIN.indexOf(fn) >= 0 };
  };
  netFollowers = function (ok, bad) { bad(null, 0, 'follow 0'); };
  netFollowing = function (ok, bad) { bad(null, 0, 'follow 0'); };
  out.ersFell = fell(meFollowerPull, meFollowerPull);
  out.ingFell = fell(meFollowPull, meFollowPull);
  popOff();
  NET_AGAIN = [];
  netFollowers = heldPair.ers; netFollowing = heldPair.ing;
  FR_ASKED = false; FO_ASKED = false;
  ME.fr = heldPair.fr; ME.fo = heldPair.fo;

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
if (r.meWaits !== 2)
  say('your own profile prints ' + (2 - r.meWaits) + ' count(s) nobody has ' +
      'answered for. 「0 と出て1秒後に1に変わる、をしない」');
if (!r.meZeroIsZero)
  say('and following nobody now draws the mark as well — an answered 0 is an ' +
      'answer and has to be printed.');
if (r.whoWaits !== 2)
  say('somebody known only from a post prints a count off their post, which ' +
      'carries none: 0, and then the real number a moment later.');
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
if (r.askedOnTheirs !== 1)
  say('a person’s profile sends ' + r.askedOnTheirs + ' request(s) for who ' +
      'follows this account. Opened without ever opening your own profile, ' +
      'ME.fr stays ABSENT and an absent list draws the same picture as ' +
      '「nobody follows you」. 「空」と「まだ誰も訊いていない」は別');

if (!r.ersFell.pop)
  say('「who follows me」 falling over puts nothing on the screen. The phone ' +
      'draws 「nobody follows you」 and the person is told nothing. ' +
      '「通信エラーなら進むわけねえだろ全部」');
if (!r.ersFell.again)
  say('and 再接続 does not go back for it, so there is no way to ask again ' +
      'short of killing the app.');
if (!r.ingFell.pop || !r.ingFell.again)
  say('「who I follow」 falling over is silent too — the pair has gone quiet ' +
      'together, which is a change to netPop() rather than to these two.');

if (errs.length) say('the page threw: ' + errs[0]);

console.log('a post answers to both its names: the thread carries the reply ' +
            'opened either way');
console.log('おすすめ: ' + r.recPosts + ' posts, no replies; フォロー中 and the ' +
            '返信 tab keep theirs');
console.log('your own two lists: ' + r.ownFollowing.length + ' / ' +
            r.ownFollowers.length + ', with you in neither, and the counts ' +
            'say the same');
console.log('your own row elsewhere: 「' + r.ownRowName + '」 with a face, on a ' +
            'phone holding no post of yours');
console.log('counts: the mark until the answer comes, the number after it, ' +
            'and 0 is an answer');
console.log('and the Pro mark is on your own name on Pro and off it on free');
console.log('「フォローされています」: on the card of somebody who does, off ' +
            'everybody else’s and off your own, and a person’s page asks who ' +
            'follows this account ' + r.askedOnTheirs + ' time(s)');
console.log('both follow pulls put up 「接続できません」 when they fall over, ' +
            'and 再接続 goes back for both');
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
