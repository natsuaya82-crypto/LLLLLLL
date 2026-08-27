/* The page a language has, and the one place each of its two switches lives.
   ---------------------------------------------------------------------
   Two things about `www/home.js`'s article that nothing held, and neither of
   them can throw. A section that arrives open renders perfectly; a switch
   that exists in two places writes the same field from both and every
   screenshot is right.

   1. THE ARTICLE ARRIVES SHUT. 「この言語については初手は全部閉じて」
      OWNER 2026-08-26. It arrived open, and the argument for open was that
      nothing somebody has never touched should be folded away from them --
      true of one section and wrong of five. `ABOPEN` records what is OPEN, so
      the empty map is the arriving state; the way this regresses is somebody
      flipping the sense back to "what is shut", which reads identically and
      is the opposite page.

   2. EACH SWITCH HAS ONE PLACE. 「ここの言語ページを公開すると単語と文字 dl
      できるようにするはいらない。wiki でできるから。」OWNER 2026-08-26. The
      settings room and the article's editing face both offered 公開, writing
      the same `world().hide`; the room also offered a whole-page DL where the
      article asks it of each section. The room's two rows went.

   3. AND NOTHING WAS TAKEN OUT OF ANYBODY'S FILE. `world().dl` is still
      stored and still read -- it is what a section nobody has answered for
      falls back to. Removing the row that WROTE it must not have orphaned the
      value: a person who turned it on keeps every untouched section
      downloadable. docs/DATA_SAFETY.md -- what is stored is not removed
      because the current shape stopped needing it.

   Run: node tools/world-check.mjs                                        */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{width:390,height:844} });
await pg.goto('file://' + path.join(dir,'..','www','index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:10000 });

const r = await pg.evaluate(({s}) => {
  eval('(' + s + ')()');
  SET.done = true; SET.plan = 'pro';
  var out = {};

  /* Every heading that CAN fold, and whether it arrived shut. A heading with
     nothing under it draws no marker and is not asked about -- that is
     abHead()'s own rule and not this check's to restate. */
  function heads(){
    var o = [], i, n = document.querySelectorAll('#app .abshd');
    for(i = 0; i < n.length; i++){
      var b = n[i].querySelector('[data-do="abToggle"]');
      if(!b) continue;
      o.push({ r: JSON.parse(b.getAttribute('data-a'))[0],
               shut: n[i].className.indexOf('shut') !== -1 });
    }
    return o;
  }
  /* A screen is a route AND its argument: vSet() takes none and reads
     here().a, so calling it with 'lang' asks about whatever screen you were
     already standing on. The first version of this check did exactly that and
     stayed green with the row put back. */
  function stand(rt, a){
    window.route = rt; NAV = [{ r: rt, a: a }]; render();
    return document.getElementById('app').innerHTML;
  }

  /* ---- 1. the article arrives shut ------------------------------------- */
  stand('about');
  out.arrive = heads();
  out.arriveOpen = out.arrive.filter(function(h){ return !h.shut; })
                             .map(function(h){ return h.r; });

  /* and one press opens exactly that one */
  if(out.arrive.length){
    var first = out.arrive[0].r;
    abToggle(first);
    var after = heads();
    out.opened = after.filter(function(h){ return !h.shut; })
                      .map(function(h){ return h.r; });
    out.pressed = first;
    abToggle(first);
    out.backShut = heads().filter(function(h){ return !h.shut; }).length === 0;
  }

  /* the writing face arrives shut too -- it is the same page */
  stand('world');
  out.edOpen = heads().filter(function(h){ return !h.shut; })
                      .map(function(h){ return h.r; });

  /* ---- 2. one place each ----------------------------------------------- */
  function names(html){
    var o = {}, m = String(html).match(/data-do="([a-zA-Z0-9_]+)"/g) || [], i;
    for(i = 0; i < m.length; i++) o[m[i].slice(9, -1)] = 1;
    return o;
  }
  out.room    = names(stand('set', 'lang'));
  out.roomEmpty = !out.room || !Object.keys(out.room).length;
  out.article = names(stand('world'));

  /* ---- 3. what is stored is still read --------------------------------- */
  WLD.dl = true; WLD.secs = {};
  out.fallbackOn  = wldSecDl('letters');
  WLD.dl = false;
  out.fallbackOff = wldSecDl('letters');
  WLD.dl = true; WLD.secs = { letters: { dl: false } };
  out.sectionWins = wldSecDl('letters') === false && wldSecDl('words') === true;

  return out;
}, { s: seed.toString() });

const fails = [];
const say = (m) => fails.push(m);

if (!r.arrive || !r.arrive.length)
  say('no foldable heading was found on the article at all — the fixture no ' +
      'longer reaches this page, so nothing below was actually asked.');
else {
  if (r.arriveOpen.length)
    say('the article arrived with ' + r.arriveOpen.length + ' section(s) already ' +
        'open: ' + r.arriveOpen.join(' ') + '. 「この言語については初手は全部閉じて」 ' +
        '— ABOPEN records what is OPEN, so the empty map has to be every ' +
        'section shut.');
  if (r.opened && (r.opened.length !== 1 || r.opened[0] !== r.pressed))
    say('pressing "' + r.pressed + '" left these open: ' +
        (r.opened.join(' ') || '(none)') + '. One press opens one section.');
  if (r.backShut === false)
    say('pressing the same heading twice did not shut it again.');
  if (r.edOpen && r.edOpen.length)
    say('the WRITING face arrived with ' + r.edOpen.join(' ') + ' open. It is ' +
        'the same page and arrives the same way.');
}

if (r.roomEmpty)
  say('the language settings room rendered nothing at all, so the two ' +
      'assertions under it asked about an empty string. A screen is a route ' +
      'AND its argument — vSet() reads here().a.');
if (r.room && r.room.setWldHide)
  say('the language settings room still offers 公開 (setWldHide). It is the ' +
      'article\'s, and two places writing world().hide is what went on ' +
      '2026-08-26.');
if (r.room && r.room.setWldDl)
  say('the language settings room still offers a whole-page DL (setWldDl). ' +
      'The article asks it of each SECTION (setWldSecDl).');
if (r.article && !r.article.setWldHide)
  say('the article\'s writing face no longer offers 公開 (setWldHide). The ' +
      'switch was to MOVE, not to go: taking it off both screens leaves a ' +
      'state nobody can change.');
if (r.article && !r.article.setWldSecDl)
  say('the article no longer offers a section its DL switch (setWldSecDl).');

if (r.fallbackOn !== true || r.fallbackOff !== false)
  say('a section nobody has answered for no longer follows world().dl ' +
      '(on: ' + r.fallbackOn + ', off: ' + r.fallbackOff + '). That value is ' +
      'still in people\'s files and is the only thing that still reads it — ' +
      'orphaning it turns somebody\'s answer off without asking.');
if (r.sectionWins !== true)
  say('a section that HAS an answer no longer beats the page\'s default.');

console.log('the article: ' + ((r.arrive || []).length) + ' foldable sections, ' +
            'every one shut on arrival, on both faces');
console.log('one place each: 公開 is the article\'s, DL is asked of a section');
console.log('world().dl: still stored, still read as what an unanswered ' +
            'section falls back to');

await br.close();
if (fails.length) {
  console.error('\nFAILED (' + fails.length + '):');
  fails.forEach((m) => console.error('  ' + m));
  process.exit(1);
}
console.log('\nthe language page arrives closed, and each of its two switches ' +
            'has one place.');
