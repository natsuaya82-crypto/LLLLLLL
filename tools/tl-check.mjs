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

await br.close();
if (fails.length) {
  console.error('\ntl: ' + fails.length + ' thing' + (fails.length > 1 ? 's' : '') +
                ' about the timeline read by somebody else do not hold:\n');
  fails.forEach((m) => console.error('  ' + m + '\n'));
  process.exit(1);
}
console.log('\nthe timeline reads the same on the phone that did not write it.');
