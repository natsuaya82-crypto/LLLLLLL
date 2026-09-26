/* Coming back is coming back to where you were.
   ---------------------------------------------------------------------
   「投稿とか通知とかフォロー欄とかなんでもそうなんだけど、投稿の詳細とか見て
   戻ったら一番上になるのやめて欲しい。その画面のまま止まって欲しい。全部。」
   OWNER 2026-09-26.

   navLand() (www/shell.js) is the one door every move comes through, and it
   put every page at the top -- going deeper and coming back alike. A step of
   the trail carries `y` now, written as it is walked off, and arriving on a
   step that has one puts the page there. Nothing about the wrong answer
   throws: the page is drawn, every screenshot of it is right, and it is found
   by somebody who read forty posts and pressed one.

   Asked of the real app, through the real go() / back() / goTab():

     1-5  a list scrolled down, a post opened, back: the same place -- the
          timeline, the notices, a follows list, a profile, the dictionary
     6    and the list is the list that was left: every row the foot brought
          in is still drawn, and nothing was asked of the server again
     7    going deeper is the top
     8    a tab is the top
     9    two deep and two back: each page where it was
    10    a redraw of the screen you are on does not move it
    11    the composer's 「下書きに？」 answered, and the page under it is
          where it was (backAnswer goes through the door too)

   Run: node tools/scroll-check.mjs
        node tools/scroll-check.mjs --shot r108-after   (also photographs, in
        Japanese, each list as it was left and as it was come back to, into
        shots/<name>-<list>-1-left.png and -2-back.png)                 */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const si = process.argv.indexOf('--shot');
const shot = si >= 0 ? process.argv[si + 1] : '';

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{ width:390, height:844 } });
const errs = [];
pg.on('pageerror', (e) => errs.push(String(e && e.message || e)));
await pg.goto('file://' + path.join(dir, '..', 'www', 'index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:10000 });

/* Sixty posts -- more than one page (NET_PAGE) -- and forty notices and
   sixty people, so every list is many screens tall. Every question those
   pages read is marked answered, and the server is a counter: a page that
   is arrived at again must not ask for its list again. */
await pg.evaluate(({ s, ja }) => {
  eval('(' + s + ')()');
  SET.walked = true;
  const b = POSTS[0], hs = [];
  let i;
  for (i = 0; i < 60; i++) {
    const p = JSON.parse(JSON.stringify(b));
    p.id = 'X' + i; p.sid = 'X' + i; p.at = Date.now() - (i + 1) * 60000; p.ln = 'line ' + i;
    POSTS.push(p);
    PULL_GOT['thread|X' + i] = 1;
  }
  NOTES_HAVE = [];
  for (i = 0; i < 40; i++)
    NOTES_HAVE.push({ kind:'like', at:Date.now() - i * 60000, hd:'iri', who:'Iri',
                      av:null, id:'X' + i, n:1, more:[] });
  PULL_GOT.notif = 1;
  for (i = 0; i < 60; i++) {
    hs.push('p' + i);
    WHO_HAVE['p' + i] = { hd:'p' + i, nm:'P' + i }; WHO_ASKED['p' + i] = 1;
    REL['p' + i] = { i:false, u:false };
  }
  folPut(false, meHandle(), hs);
  window.__asked = 0;
  const count = (f) => function () { window.__asked++; return f.apply(this, arguments); };
  netFeed = count(netFeed);
  netNotices = count(netNotices);
  if (ja) SET.ui = 'ja';
  NAV = [{ r:'feed' }]; route = 'feed'; render(); window.scrollTo(0, 0);
}, { s: seed.toString(), ja: !!shot });
const snap = (name) => shot ? pg.screenshot({ path: path.join(dir, '..', 'shots', shot + '-' + name + '.png') }) : null;

const settle = () => pg.waitForTimeout(150);
const at = () => pg.evaluate(() => ({
  y: Math.round(window.scrollY),
  nav: NAV.map((e) => e.r + (e.a ? ':' + e.a : '')).join(' > '),
  rows: document.querySelectorAll('#app [data-do]').length,
}));
const act = async (f, arg) => { await pg.evaluate(f, arg); await settle(); return at(); };

let fails = 0, n = 0;
function say(ok, what, got) {
  n++;
  if (!ok) fails++;
  console.log((ok ? '  ok  ' : '  FAIL') + ' ' + n + '. ' + what + (ok ? '' : '  -- ' + JSON.stringify(got)));
}

/* scroll to y, open a post, come back -- from wherever `from` is */
async function round(label, from, y) {
  const want = from.a ? 'feed > ' + from.r + ':' + from.a : from.r;
  await act(({ r, a }) => { if (a) { goTab('feed'); go(r, a); } else goTab(r); }, from);
  const down = await act((yy) => window.scrollTo(0, yy), y);
  await snap(from.r + '-1-left');
  const deep = await act(() => go('thread', 'X3'));
  const backed = await act(() => back());
  await snap(from.r + '-2-back');
  say(down.nav === want && deep.nav === want + ' > thread:X3' && down.y === y && deep.y === 0 && backed.y === y && backed.nav === down.nav,
      label + ': scrolled to ' + y + ', a post opened, back -- ' + backed.y,
      { down, deep, backed });
  return { down, backed };
}

const feed = await round('the timeline', { r:'feed' }, 1600);
await round('the notices', { r:'notif' }, 700);
await round('a follows list', { r:'follows', a:'ing' }, 900);
await round('a profile', { r:'profile' }, 1200);
await round('the dictionary', { r:'words' }, 400);

/* 6: the list that was left */
const asked = await pg.evaluate(() => window.__asked);
say(feed.backed.rows === feed.down.rows && feed.down.rows > 50 && asked === 0,
    'the timeline came back with every row it had (' + feed.backed.rows + ' of ' +
    feed.down.rows + ') and asked the server nothing (' + asked + ')',
    { feed, asked });

/* 7 and 8: forward is the top */
await act(() => goTab('feed'));
await act(() => window.scrollTo(0, 1600));
const deeper = await act(() => go('thread', 'X9'));
say(deeper.y === 0 && deeper.nav === 'feed > thread:X9', 'going deeper is the top -- ' + deeper.y, deeper);
await act(() => goTab('feed'));
await act(() => window.scrollTo(0, 1600));
const tab = await act(() => goTab('notif'));
say(tab.y === 0 && tab.nav === 'notif', 'a tab is the top -- ' + tab.y, tab);

/* 9: two deep, two back */
await act(() => goTab('feed'));
await act(() => window.scrollTo(0, 2000));
await act(() => go('profile', ''));
await act(() => window.scrollTo(0, 800));
await act(() => go('thread', 'X5'));
const b1 = await act(() => back());
const b2 = await act(() => back());
say(b1.y === 800 && b1.nav === 'feed > profile' && b2.y === 2000 && b2.nav === 'feed',
    'two deep and two back: the profile at ' + b1.y + ', the timeline at ' + b2.y, { b1, b2 });

/* 10: a redraw stays put */
await act(() => window.scrollTo(0, 1500));
const redrawn = await act(() => render());
say(redrawn.y === 1500, 'a redraw of the screen you are on stays at ' + redrawn.y, redrawn);

/* 11: the composer's question, answered No */
await act(() => window.scrollTo(0, 1300));
await act(() => openPost());
const inPost = await act(() => { PW.mn = 'x'; return 0; });
const asked2 = await act(() => back());
const dropped = await act(() => backDrop());
say(inPost.nav === 'feed > form:post:' && asked2.nav === 'feed > form:post:' &&
    dropped.nav === 'feed' && dropped.y === 1300,
    "the composer's question answered and back on the timeline at " + dropped.y,
    { inPost, asked2, dropped });

say(errs.length === 0, 'nothing threw', errs);
await br.close();
console.log(fails ? 'scroll-check: ' + fails + ' of ' + n + ' FAILED' : 'scroll-check: ' + n + ' of ' + n + ' held');
process.exit(fails ? 1 : 0);
