/* AI に相談する — the four claims www/assist.js makes about the link it builds
   ---------------------------------------------------------------------
   Nothing in this chapter can throw, and that is the whole reason it needs a
   check. A URL that is too long is not REFUSED by anybody -- it is silently
   TRUNCATED, and a shortened prompt appears in somebody's input box with
   nothing anywhere to say it was cut. `UIApplication.shared.open()` returns
   no value, no callback and no error about what the other app received, so
   once the link has left the phone the app can never learn what happened.
   The only place it can be caught is before it is sent.

   So a wrong byte in the arithmetic gives a link that opens, a screen that is
   right, a gate that is green, and half of somebody's dictionary. It is the
   same shape as `fill`, `round` and `card`: a picture that renders and is not
   the one that was asked for.

   What is held, and each was watched going red with the bug put back:

   1. NEVER OVER THE CEILING. Ten interface languages against a dictionary far
      bigger than the budget. Loosening the comparison to `room*3` builds
      11,931 bytes against a 4,000 ceiling in every one of the ten.
   2. NOTHING IS TRUNCATED. Every line askHead() produced, and the ask itself,
      survives the round trip through encodeURIComponent. Filling to a budget
      is how it shortens; cutting a string in half is not, and the difference
      is invisible in a URL.
   3. A SCAFFOLD THAT DOES NOT FIT DOES NOT OPEN. There is nothing left to
      shorten, so `url` comes back empty and the screen says so. Deleting that
      guard opens a 12,278-byte link.
   4. WHO IT OPENS, AND WHERE AN UNKNOWN NAME GOES. All four of ASK_TO route,
      and a value naming somebody who is not in the table falls to ChatGPT --
      the owner's default (2026-08-27). Softening that test to `w ? w :
      'chatgpt'` does not fall back at all: ASK_TO[w] is undefined and the
      builder throws on `base.length`.

   Japanese is nine URL bytes a character (あ -> %E3%81%82) where English is
   one, so the ten languages are not ten spellings of one test: at the same
   ceiling they carry three times less material, and a budget counted in
   characters instead of bytes would be exactly three times too generous for
   the people hardest to notice it for.

   Run: node tools/ask-check.mjs                                          */
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
  SET.done = true;
  const fails = [], seen = [];
  /* Far more dictionary than the budget can hold, with meanings written in
     Japanese -- the expensive end, so the ceiling is what stops it and never
     the dictionary running out. */
  for (let i = 0; i < 500; i++)
    WORDS.push({ hw: 'kana' + i, mns: ['大きい石'], pos: 'noun', ph: ['k','a'] });
  /* Asked of the page rather than written out here, so a language added
     later is walked the day it is added. */
  const langs = UI_LANGS.slice();

  langs.forEach(lg => {
    SET.ui = lg;
    const head = askHead(null), L = askLink(t('ask.word.ask'), null);

    /* 1 */
    if (L.url.length > ASK_MAX)
      fails.push('1: ' + lg + ' built ' + L.url.length + ' bytes against a ceiling of ' + ASK_MAX);
    seen.push({ lg, bytes: L.url.length, put: L.put, all: L.all });

    /* 2 -- what went in came out, line for line */
    const back = decodeURIComponent(L.url.slice(L.url.indexOf('?q=') + 3));
    head.split('\n').forEach(line => {
      if (line && back.indexOf(line) < 0)
        fails.push('2: ' + lg + ' lost a line of what the language IS: ' + line);
    });
    if (back.indexOf(t('ask.word.ask')) < 0)
      fails.push('2: ' + lg + ' lost the ask itself');
    /* and every word it claims to have sent is really on it */
    if (L.put > 0) {
      const rows = askWords();
      for (let i = 0; i < L.put; i++)
        if (back.indexOf(rows[i]) < 0)
          fails.push('2: ' + lg + ' counted ' + L.put + ' words and one of them is not there: ' + rows[i]);
    }
  });

  /* 3 -- a scaffold that cannot fit opens nothing */
  SET.ui = 'ja';
  const was = langName;
  langName = new Array(1200).join('あ');
  const over = askLink(t('ask.word.ask'), null);
  langName = was;
  if (over.url !== '')
    fails.push('3: a scaffold too big for the ceiling opened anyway (' + over.url.length + ' bytes)');
  if (over.put !== 0)
    fails.push('3: it opened nothing and still claimed ' + over.put + ' words went');

  /* 4 -- who, and where an unknown name goes */
  Object.keys(ASK_TO).forEach(w => {
    SET.askTo = w;
    if (askLink('x', null).url.indexOf(ASK_TO[w]) !== 0)
      fails.push('4: SET.askTo = ' + w + ' did not open ' + w);
  });
  SET.askTo = 'nobody';
  if (askLink('x', null).url.indexOf(ASK_TO.chatgpt) !== 0)
    fails.push('4: a name that is not in ASK_TO did not fall back to ChatGPT');
  SET.askTo = '';
  if (askLink('x', null).url.indexOf(ASK_TO.chatgpt) !== 0)
    fails.push('4: nothing set did not fall back to ChatGPT');

  return { fails, seen, max: ASK_MAX, who: Object.keys(ASK_TO).length };
}, { s: seed.toString() });

await br.close();

console.log('ceiling: ' + r.max + ' bytes of URL, not characters of prompt');
console.log('who it can open: ' + r.who + ', and an unknown name is ChatGPT');
console.log('languages: ' + r.seen.length + ', against ' + r.seen[0].all + ' words of dictionary');
r.seen.forEach(o => console.log('  ' + o.lg + '  ' + String(o.bytes).padStart(4) +
  ' bytes   ' + String(o.put).padStart(3) + ' words sent'));

if (r.fails.length) {
  console.log('\nFAILED (' + r.fails.length + '):');
  r.fails.forEach(f => console.log('  ' + f));
  process.exit(1);
}
console.log('\nnever over the ceiling, nothing truncated, a scaffold that does not\n' +
            'fit does not open, and every name routes.');
