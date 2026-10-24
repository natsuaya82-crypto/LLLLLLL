/* tools/copy-check.mjs — the timeline's copy on this phone is the newest fifty.
   ---------------------------------------------------------------------------
   「控えは最新の50とかでいいやん」 OWNER 2026-10-24.

   `lingua.posts.<uid>` is what the timeline shows with no signal. It was every
   post this phone had ever read: postTake() adds to POSTS and never cuts, and
   savePosts() wrote all of it. So it grew with every pull until the phone's
   allowance was full, and then 「The timeline is full, so nothing was saved」
   came up on the timeline, on the owner's phone, on 2026-10-24 -- with nothing
   lost, because every post lives on the server.

   The server is faked at netFeed() and nothing else: the pull is the real
   askFeed1() → postTake() → savePosts(), sixty times over, each answering
   fifty posts this phone has not seen, each post as heavy as one carrying its
   author's face (production, 2026-10-24: 6,661 characters of face on average).

   THE CLAIMS.
     1. Sixty pulls never say the timeline is full.
     2. What is written is POST_KEEP posts, and they are the newest.
     3. What is in memory is not cut -- the screen still has every post it read.
     4. A post that has not reached the server is written whatever its age:
        this phone is the only place it is.

   走らせ方: node tools/copy-check.mjs                                        */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

const bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{ width:390, height:844 } });
await pg.goto('file://' + path.join(dir, '..', 'www', 'index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });
await pg.evaluate(seed);

const r = await pg.evaluate(() => {
  var said = [], n = 0, k, read = 0, now = Date.now(), face = new Array(6662).join('x');
  var real = toast;
  toast = function(s){ said.push(s); return real.apply(this, arguments); };
  /* A post this phone wrote and could not send, older than everything. */
  POSTS.push({ id:'p-unsent', mine:true, at:1, ln:'ka', mn:'ka' });
  netFeed = function(which, ok){
    var ps = [], i;
    for (i = 0; i < 50; i++){
      n++;
      ps.push({ id:'srv' + n, sid:'srv' + n, at:now + n * 1000,
                ln:'post ' + n, av:{ pic:face } });
    }
    ok(ps, null);
  };
  for (k = 0; k < 60; k++) askFeed1('rec', function(){}, function(){});
  for (k = 0; k < POSTS.length; k++) if (POSTS[k].sid) read++;
  var disk = JSON.parse(localStorage.getItem(acctKey('posts', ACCT_UID)) || '[]');
  var ids = disk.map(function(p){ return p.id; });
  var newest = [];
  for (k = n; k > n - POST_KEEP; k--) newest.push('srv' + k);
  var fromServer = disk.filter(function(p){ return p.sid; }).map(function(p){ return p.id; });
  return { full:said.filter(function(s){ return s === t('post.full'); }).length,
           pulled:n, read:read, keep:POST_KEEP,
           onDisk:fromServer.length, newest:newest.every(function(id){ return fromServer.indexOf(id) >= 0; }),
           unsent:ids.indexOf('p-unsent') >= 0 };
});

say(r.full === 0, '1. sixty pulls of fifty never say the timeline is full (said ' + r.full + ' times)');
say(r.onDisk === r.keep && r.newest,
    '2. the copy holds the newest ' + r.keep + ' of ' + r.pulled + ' (holds ' + r.onDisk + (r.newest ? ', the newest' : ', NOT the newest') + ')');
say(r.read === r.pulled, '3. memory still has every post it read (' + r.read + ' of ' + r.pulled + ')');
say(r.unsent, '4. the post that never reached the server is still in the copy');

await br.close();
if (bad.length){ console.log('\ncopy-check: ' + bad.length + ' FAILED'); process.exit(1); }
console.log('\ncopy-check: the timeline’s copy is the newest ' + r.keep +
            ', and a post only this phone has is kept whatever its age.');
