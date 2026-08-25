/* ---------------------------------------------------------------------------
   tools/gramlang-check.mjs — the word order and the three positions belong to
   the language, and the move onto it copies.

   Run it:   node tools/gramlang-check.mjs

   `SET.order` and `SET.gpos.{adj,negp,adp}` were the phone's: one word order
   and three positions for every language on it. Measured on a phone rather
   than read off the code (docs/BACKLOG.md) -- a second language was born
   speaking the first one's grammar, and changing the order in the second
   changed it in the first.

   migrateGramLang() in www/phases.js copies them onto every language the
   person already has. It runs ONCE, on a phone, against the only copy of
   something somebody spent months on, so this is the same argument
   migrate-check makes: every other check in this repo opens the app in an
   empty browser, which is the one kind of phone that does not exist. This
   seeds a phone that has languages on it, loads the app, and asks what came
   through.

   It asserts what a thing IS -- the value, the id, the bytes of a slice --
   and never how many of them there are. A count is arrived at by accident:
   "one language carries an order" is true of a language that was given the
   wrong one.

   What it checks
     1. it arrives          every language the person has carries the word
                            order and the positions that were on the phone,
                            including one that has no stage of its own yet
     2. it copies           SET.order and SET.gpos are still there afterwards,
                            unchanged. A migration never removes what it read
     3. nothing else moves  done / notes / set / extra / rules / ex / fm of a
                            stage come back byte for byte
     4. twice               a second launch changes nothing further
     5. born with none      a language made AFTER the move carries neither
                            key. That is the bug this exists for: a new
                            language is not born wearing somebody else's
                            grammar
     6. wreckage is left    a phases slice that will not parse is not written
                            over -- "empty" and "broken" are different states
                            -- and the other languages still arrive
     7. and it is its own   changing the word order and a position in one
                            language leaves the other one exactly where it
                            was. This is the measurement that started it:
                            B was changed to VOS/after and A came back VOS
                            /after with it
     8. nobody chose it     a stage nobody has touched lights neither of its
                            buttons. A default is not an answer, and the
                            screen was drawing one as if it were
     9. no subtitle, none   a stage whose `.d` key is gone says nothing under
                            its title -- not the key, and not the English of
                            a key the other nine no longer have

   Exit code is 0 only when all nine hold.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium, LAUNCH } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WWW = path.join(HERE, '..', 'www');
const PORT = 8132;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const srv = http.createServer((q, r) => {
  const f = path.join(WWW, q.url === '/' ? 'index.html' : q.url.split('?')[0]);
  let body;
  try { body = fs.readFileSync(f); } catch (e) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain',
                     'Cache-Control': 'no-store' });
  r.end(body);
}).listen(PORT);

/* A phone from before the move. Two languages: one that has been worked on
   and has a stage slice, one that has words and has never had a stage opened
   -- the second is the one a lazier move would miss, because there is nothing
   there to add a key to. `set` inside the stage slice is deliberately filled:
   which decisions were TOUCHED has been the language's all along and must
   come out the other side untouched. */
const LA_PHASES = { done: { greet: true }, notes: { neg: 'a note' },
                    set: { order: 1, negp: 1 }, extra: [],
                    rules: { neg: 'a rule' }, ex: { neg: [{ lb: 'a', ln: 'x', gl: 'b' }] },
                    fm: [] };
const OLD = {
  'lingua.langs': JSON.stringify({ LA: { name: 'Vaska', mine: true },
                                   LB: { name: 'Tosk', mine: true } }),
  'lingua.cur': 'LA',
  'lingua.LA.words': JSON.stringify([{ hw: 'tuf', mns: ['hello'], pos: 'n' }]),
  'lingua.LA.lang': 'Vaska',
  'lingua.LA.phases': JSON.stringify(LA_PHASES),
  'lingua.LB.words': JSON.stringify([{ hw: 'ark', mns: ['fish'], pos: 'n' }]),
  'lingua.LB.lang': 'Tosk',
  'lingua.set': JSON.stringify({ theme: 'dark', plan: 'free', done: true,
                                 order: 'OSV',
                                 gpos: { adj: 'before', negp: 'before', adp: 'after' } })
};

/* Read out of storage rather than off the globals, because that is where a
   language that is not open lives -- and the language that is not open is
   half of what this is about. */
const REPORT = () => {
  const slice = (id) => {
    const raw = localStorage.getItem('lingua.' + id + '.phases');
    let o = null;
    try { o = JSON.parse(raw); } catch (e) { o = null; }
    return { raw: raw, o: o };
  };
  const a = slice('LA'), b = slice('LB');
  let set = null;
  try { set = JSON.parse(localStorage.getItem('lingua.set') || 'null'); } catch (e) {}
  return {
    aOrder: a.o && a.o.order, bOrder: b.o && b.o.order,
    aNegp: a.o && a.o.gpos && a.o.gpos.negp,
    bNegp: b.o && b.o.gpos && b.o.gpos.negp,
    aAdp: a.o && a.o.gpos && a.o.gpos.adp,
    aDone: !!(a.o && a.o.done && a.o.done.greet),
    aNote: a.o && a.o.notes && a.o.notes.neg,
    aSetOrder: a.o && a.o.set && a.o.set.order,
    aSetNegp: a.o && a.o.set && a.o.set.negp,
    aRule: a.o && a.o.rules && a.o.rules.neg,
    aEx: a.o && a.o.ex && a.o.ex.neg && a.o.ex.neg[0] && a.o.ex.neg[0].lb,
    /* The person's settings are read and never removed. */
    setOrder: set && set.order,
    setNegp: set && set.gpos && set.gpos.negp,
    mark: set && set.gramLang,
    /* And the open language, in memory, so the screen is reading the same
       answer the file now holds. */
    stgOrder: STG.order, stgNegp: STG.gpos && STG.gpos.negp,
    /* Which decisions were touched is the language's and was already filed
       correctly. Nothing here may mark one. */
    touchedOrder: !!STG.set.order, touchedAdp: !!STG.set.adp,
    open: langId
  };
};

const fails = [];
const want = (label, got, expected) => {
  if (got !== expected) fails.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(expected)}`);
};

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage();
await pg.goto(`http://localhost:${PORT}/`);

/* ---- 1, 2, 3: it arrives, it copies, and nothing else moves ------------- */
await pg.evaluate((old) => {
  localStorage.clear();
  Object.keys(old).forEach((k) => localStorage.setItem(k, old[k]));
}, OLD);
await pg.reload();
const a = await pg.evaluate(REPORT);

want('the worked-on language carries the word order', a.aOrder, 'OSV');
want('and the language with no stage of its own carries it too', a.bOrder, 'OSV');
want('the negation position arrives', a.aNegp, 'before');
want('on the second language as well', a.bNegp, 'before');
want('and so does one that was left at the default', a.aAdp, 'after');
want('the open language reads it in', a.stgOrder, 'OSV');
want('and its positions', a.stgNegp, 'before');

want('the settings still say the word order', a.setOrder, 'OSV');
want('and still say the position', a.setNegp, 'before');

want('what was finished is still finished', a.aDone, true);
want('the note is still there', a.aNote, 'a note');
want('the rule is still there', a.aRule, 'a rule');
want('the example is still there', a.aEx, 'a');
want('what was touched is still touched', a.aSetOrder, 1);
want('all of it', a.aSetNegp, 1);
want('and nothing new was marked as chosen', a.touchedAdp, false);

/* ---- 4: the next launch, and every launch after it ---------------------- */
await pg.reload();
const b = await pg.evaluate(REPORT);
want('a second launch leaves the word order where it is', b.aOrder, 'OSV');
want('and the other language too', b.bOrder, 'OSV');
want('and does not mark a decision as chosen', b.touchedAdp, false);

/* ---- 5: a language made afterwards is born with neither ----------------- */
const c = await pg.evaluate(() => {
  const id = langMint();
  langStore();
  localStorage.setItem('lingua.cur', id);
  return id;
});
await pg.reload();
const d = await pg.evaluate((id) => ({
  phases: localStorage.getItem('lingua.' + id + '.phases'),
  order: STG.order, negp: STG.gpos && STG.gpos.negp, open: langId,
  /* What the screen reads, which is the half that matters: nothing stored is
     one thing, and the buttons answering with somebody else's grammar is the
     other. */
  reads: orderDef().id, negpReads: gPos('negp')
}), c);
want('the new language is the one open', d.open, c);
want('it has no stage slice at all', d.phases, null);
want('so it has no word order of its own', d.order, '');
want('and no position of its own', d.negp, undefined);
want('the screen reads the default rather than the other language', d.reads, 'SOV');
want('and the default position with it', d.negpReads, 'after');

/* ---- 6: wreckage is left exactly as it is ------------------------------- */
const WRECK = '[[[not json';
await pg.evaluate((old) => {
  localStorage.clear();
  Object.keys(old).forEach((k) => localStorage.setItem(k, old[k]));
  const langs = JSON.parse(localStorage.getItem('lingua.langs'));
  langs.LC = { name: 'Broken', mine: true };
  localStorage.setItem('lingua.langs', JSON.stringify(langs));
  localStorage.setItem('lingua.LC.phases', '[[[not json');
}, OLD);
await pg.reload();
const e = await pg.evaluate(() => ({
  wreck: localStorage.getItem('lingua.LC.phases'),
  aOrder: (JSON.parse(localStorage.getItem('lingua.LA.phases') || 'null') || {}).order
}));
want('the unreadable slice is exactly as it was', e.wreck, WRECK);
want('and the languages beside it still arrive', e.aOrder, 'OSV');

/* ---- 7: one language's answer is its own -------------------------------
   The measurement this whole thing came out of, run the other way round:
   change the second language and ask the first one what it says. */
await pg.evaluate((old) => {
  localStorage.clear();
  Object.keys(old).forEach((k) => localStorage.setItem(k, old[k]));
}, OLD);
await pg.reload();
const f = await pg.evaluate(() => {
  langOpen('LB');
  setOrder('VOS');
  setGPos('negp', 'after');
  const bReads = orderDef().id, bNegp = gPos('negp');
  langOpen('LA');
  let aSet = null;
  try { aSet = JSON.parse(localStorage.getItem('lingua.LA.phases') || 'null'); } catch (e) {}
  let person = null;
  try { person = JSON.parse(localStorage.getItem('lingua.set') || 'null'); } catch (e) {}
  return {
    bReads: bReads, bNegp: bNegp,
    aReads: orderDef().id, aNegp: gPos('negp'),
    aStored: aSet && aSet.order, aStoredNegp: aSet && aSet.gpos && aSet.gpos.negp,
    bStored: (JSON.parse(localStorage.getItem('lingua.LB.phases') || '{}')).order,
    /* And the person's settings are not written to any more: they still say
       what they said before the move, and nothing goes back through them. */
    personOrder: person && person.order,
    aTouched: !!STG.set.order, aTouchedAdj: !!STG.set.adj
  };
});
want('the language that was changed says the new order', f.bReads, 'VOS');
want('and the new position', f.bNegp, 'after');
want('and it is written down under that language', f.bStored, 'VOS');
want('the other language still says its own order', f.aReads, 'OSV');
want('and its own position', f.aNegp, 'before');
want('which is still what its file says', f.aStored, 'OSV');
want('all of it', f.aStoredNegp, 'before');
want('the settings are left saying what they said', f.personOrder, 'OSV');
want('and what was chosen in one is not chosen in the other', f.aTouchedAdj, false);

/* ---- 8: a default nobody chose is not lit -------------------------------
   The list has counted it correctly from the beginning -- stTouched() -- and
   only the drawing said otherwise. `desc` is a stage the seeded phone has
   never touched; `neg` is one it has. */
await pg.evaluate((old) => {
  localStorage.clear();
  Object.keys(old).forEach((k) => localStorage.setItem(k, old[k]));
}, OLD);
await pg.reload();
const g = await pg.evaluate(() => {
  const lit = () => Array.prototype.map.call(
    document.querySelectorAll('.segs .seg.on'), (b) => b.textContent).join(',');
  go('gram', 'desc');
  const untouched = lit();
  go('gram', 'neg');
  const touched = lit();
  /* And pressing one is what turns it on, with nothing else changing. */
  go('gram', 'desc');
  setGPos('adj', 'after');
  return { untouched: untouched, touched: touched, pressed: lit(),
           /* What the button SAYS is the interface language's and is asked of
              the page rather than written out here -- a check that spells the
              label itself is a second copy of it. */
           saysBefore: gPosLab('negp', 'before'), saysAfter: gPosLab('adj', 'after'),
           /* the value was 'after' before the press as well -- what moved is
              that somebody said so */
           was: STG.set.adj ? 'marked' : 'not marked' };
});
want('a stage nobody has touched lights nothing', g.untouched, '');
want('one that was touched lights the answer it was given', g.touched, g.saysBefore);
want('pressing the button that was already the default lights it', g.pressed, g.saysAfter);
want('and marks it as chosen', g.was, 'marked');

/* ---- 9: a stage with nothing more to say says nothing --------------------
   Four subtitles said the title again and were taken out of all ten files.
   What must not happen is the key arriving on screen instead: t() answers
   with the key itself when nothing defines it, and 「否定」の下に
   「stg.neg.d」 is worse than the sentence that was removed. */
const h = await pg.evaluate(() => ({
  neg: stWhat(stBy('neg')), have: stWhat(stBy('have')),
  when: stWhat(stBy('when')), desc: stWhat(stBy('desc')),
  /* and one that adds something is untouched */
  count: stWhat(stBy('count')), order: stWhat(stBy('order'))
}));
want('the negation stage says nothing under its title', h.neg, '');
want('nor does belonging', h.have, '');
want('nor time', h.when, '');
want('nor describing', h.desc, '');
want('a stage that adds something still says it', h.count !== '', true);
want('and so does the word order', h.order !== '', true);

await br.close();
srv.close();

if (fails.length) {
  console.error('gramlang FAILED');
  fails.forEach((f) => console.error('  ' + f));
  process.exit(1);
}
console.log('gramlang: the word order and the three positions arrive on every language');
console.log('          somebody already has, the settings still hold their copy,');
console.log('          nothing else in a stage moves, an unreadable slice is left');
console.log('          alone, and a language made afterwards is born with none.');
console.log('          Changed in one language, the other one does not move.');
