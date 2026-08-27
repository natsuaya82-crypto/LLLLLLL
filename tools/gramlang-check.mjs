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
    10. the line's words     a stage's example line is drawn one word at a
                            time, and a word this dictionary does not have is
                            marked as one. docs/FEATURES.md: it "stays in the
                            natural language" and is shown in red. The colour
                            is www/index.html's and is not here yet; what is
                            held here is that there is something to colour,
                            and that the line still reads exactly as typed

   Exit code is 0 only when all ten hold.
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
/* A phone with somebody on it. Every screen in this file is one you have to
   be signed in to see -- OWNER 2026-08-26, 「言語はアカウントないと作れない
   です」-- and appIs() in www/shell.js sends a phone with no session to the
   door instead of to the route it was asked for. Without this, go('gram','neg')
   renders the sign-in screen, `.segs .seg.on` matches nothing, and four of the
   claims below read "" for the wrong reason while a fifth PASSES for the wrong
   reason: "a stage nobody has touched lights nothing" is also true of a door.

   In storage rather than on the globals, because this file reloads the page
   between claims and a session in memory does not survive that. `rt` is what
   netSignedIn() reads and `anon:false` is what netMember() reads; the token is
   the same shape tools/fixture.mjs builds. */
const SESSION = JSON.stringify({
  at: 'h.' + Buffer.from(JSON.stringify({ sub:'u', email:'aya@example.com',
        app_metadata:{ provider:'email' } })).toString('base64')
        .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'') + '.s',
  rt: 'r', uid: 'u', anon: false });

const OLD = {
  'lingua.sess': SESSION,
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
  /* How many there are at all. "Nothing is lit" is also true of a screen with
     no buttons on it -- the door is one -- so the claim below is two claims
     and used to be one: the stage is on the page, AND none of its answers is
     lit. It passed through a whole run where every other claim here was
     rendering the sign-in screen. */
  const segs = () => document.querySelectorAll('.segs .seg').length;
  go('gram', 'desc');
  const untouched = lit(), untouchedOf = segs();
  go('gram', 'neg');
  const touched = lit();
  /* And pressing one is what turns it on, with nothing else changing. */
  go('gram', 'desc');
  setGPos('adj', 'after');
  return { untouched: untouched, untouchedOf: untouchedOf,
           touched: touched, pressed: lit(),
           /* What the button SAYS is the interface language's and is asked of
              the page rather than written out here -- a check that spells the
              label itself is a second copy of it. */
           saysBefore: gPosLab('negp', 'before'), saysAfter: gPosLab('adj', 'after'),
           /* the value was 'after' before the press as well -- what moved is
              that somebody said so */
           was: STG.set.adj ? 'marked' : 'not marked' };
});
want('a stage nobody has touched is on the page', g.untouchedOf > 0, true);
want('and lights nothing', g.untouched, '');
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

/* ---- 10: a word the dictionary does not have ----------------------------
   The row is exRowHTML() in www/wordsheet.js and a stage's Lines are one of
   the two places it is drawn -- STG.ex, which is this chapter's. `tuf` is in
   the seeded dictionary and `rice` is not. */
const k = await pg.evaluate(() => {
  stEx('neg').length = 0;
  stEx('neg').push({ lb: 'a', ln: 'tuf rice', gl: 'b' });
  saveStg();
  go('gram', 'neg');
  const line = document.querySelector('.exl');
  return {
    reads: line && line.textContent,
    marked: Array.prototype.map.call(
      document.querySelectorAll('.exl .exnew'), (x) => x.textContent).join(',')
  };
});
want('the line reads exactly as it was typed', k.reads, 'tuf rice');
want('and the word this dictionary does not have is the one marked', k.marked, 'rice');

/* ---- 11, 12, 13: the model comes from the store when there is one --------
   gModel() used to build the model from the stages every time. A language
   with a model of its own under langKey('gram2') is read from it now, and
   this is the road in -- nothing writes that key yet.

   Nothing here can throw. A model read from the wrong place still arranges a
   sentence; it arranges it by somebody else's word order. So all three are
   about WHICH answer came back, never about whether one did.

   The middle one is the load-bearing one: `words` is put back from WORDS on
   every read, so a stored model can never become a second, stale copy of the
   dictionary. Adding a word is how you see that -- a copy would not grow. */
const m = await pg.evaluate(() => {
  /* A model of this language's own: a word order the stages do not say, and
     an inflection, which is the thing that has nowhere else to live. */
  localStorage.setItem('lingua.' + langId + '.gram2', JSON.stringify({
    schema: 'lingua.grammar', version: 2, languageId: langId,
    wordOrder: ['VERB', 'SUBJECT', 'OBJECT'],
    words: [{ id: 'hw:GONE', lemma: 'GONE', meaning: 'not in the dictionary' }],
    inflections: [{ id: 'nom', target: 'NOUN', feature: 'CASE',
                    value: 'NOMINATIVE', operation: 'suffix',
                    form: 'ga', separator: ' ' }],
    grammarRules: []
  }));
  const before = gModel();
  const had = before.words.length;
  /* The dictionary grows. A stored copy would not. */
  WORDS.push({ hw: 'zzznew', pos: 'n', mns: ['new'], at: 1 });
  const after = gModel();
  const stale = after.words.filter((w) => w.lemma === 'GONE').length;
  const grew = after.words.filter((w) => w.lemma === 'zzznew').length;
  WORDS.pop();
  /* And a language with no model of its own is untouched. */
  localStorage.removeItem('lingua.' + langId + '.gram2');
  const none = gModel();
  return {
    order: before.wordOrder.join(','), infl: before.inflections.length,
    storedRules: before.grammarRules.length,
    had: had, dict: WORDS.length, stale: stale, grew: grew,
    afterCount: after.words.length,
    noneOrder: none.wordOrder.join(','), noneInfl: none.inflections.length,
    /* Which words are the negation is put back on every read for the same
       reason the words are: it names them by headword. */
    rules: none.grammarRules.length
  };
});

want('the stored model is the one that answers', m.order, 'VERB,SUBJECT,OBJECT');
want('and it brought the inflection nothing else can hold', m.infl, 1);
want('its words are this dictionary, not the ones it was stored with',
     m.had, m.dict);
want('a word the stored model carried is not in the model that came back',
     m.stale, 0);
want('and a word added to the dictionary afterwards IS', m.grew, 1);
want('so the count followed the dictionary', m.afterCount, m.dict + 1);

want('a language with no model of its own answers from its stages',
     m.noneOrder, 'OBJECT,SUBJECT,VERB');
want('with nothing invented in the slot nobody has filled', m.noneInfl, 0);
want('and the rules that name words are built fresh either way',
     m.rules, 3);
/* The one the objection is about. The stored model above carries an EMPTY
   grammarRules on purpose: a rule there says 'hw:<headword>' and would stop
   matching the day that word was renamed, so it is rebuilt from the stages on
   every read exactly as the words are. Empty in, three out. */
want('a model stored with no rules still comes back with the ones the stages say',
     m.storedRules, 3);

/* ---- 14-19: a mark takes a word out of the queue, wherever it stands -----
   The engine has been able to hear a case mark since the day morphology.js
   got CASE_ROLE, and nothing in www/ could write one. The 助詞 stage's slots
   are that place: a particle is a WORD here, made the way the word for "not"
   is, and gInfl() turns the word somebody made into the rule the engine reads.

   Nothing here throws. A language whose mark never reaches the engine still
   translates -- it translates by position alone, which is exactly what it did
   before anybody wrote a particle, and the sentence still comes out. So every
   one of these is about WHICH word got which role.

   The first three are the claim itself and the last three are its shadow: the
   SAME three words with no mark on them move their roles about when the order
   changes. Without that pair the first three would also pass on a model that
   simply gave the same answer to everything. */
const q = await pg.evaluate(() => {
  /* Say yes to the stage, the way the button at the foot of the list does. */
  stMarkSet('part');
  const seen = go('gram', 'part') === undefined;
  /* The particle, as a word of this language filed in the stage's slot --
     nothing here writes storage of its own. */
  WORDS.push({ hw: 'ga', pos: 'part', mns: ['subject mark'], at: 1,
               slot: 'part.subj' });
  WORDS.push({ hw: 'mi', pos: 'pro', mns: ['I'], at: 1 });
  WORDS.push({ hw: 'poko', pos: 'n', mns: ['fish'], at: 1 });
  WORDS.push({ hw: 'luma', pos: 'v', mns: ['eat'], at: 1 });
  const e = LinguaGrammarEngine, m = gModel();
  const marks = m.inflections.filter((x) => x.feature === 'CASE');
  /* The same sentence three ways round. `poko ga` is the doer every time,
     however far from the front it stands -- that is the whole claim. */
  const read = (text) => {
    const r = e.morphology.parseSentence(m, text);
    return r.ok ? String(r.roles.SUBJECT) : 'BROKEN:' + r.error;
  };
  const marked = [read('poko ga mi luma'), read('mi poko ga luma'),
                  read('luma mi poko ga')];
  /* And with no mark at all, the same three words, so it is visible that
     position is still doing the work when nothing overrides it. This
     language's order is OSV -- the fixture's, seeded above -- so with no mark
     the FIRST word is the one being done to and the second is the doer. That
     is the point of reading it in this language rather than in SOV: an
     expectation written from habit would have been the other way round, and
     was. */
  const bare = [read('poko mi luma'), read('mi poko luma')];
  WORDS.length = WORDS.length - 4;
  return { seen: seen, marks: marks.length, form: marks[0] && marks[0].form,
           value: marks[0] && marks[0].value, sep: marks[0] && marks[0].separator,
           marked: marked, bare: bare,
           /* And with the word gone, the rule goes with it -- it is a view of
              the dictionary, not a copy kept beside it. */
           after: gModel().inflections.filter((x) => x.feature === 'CASE').length };
});

want('the stage the button opens is a stage', q.seen, true);
want('the particle somebody made reached the engine as one rule', q.marks, 1);
want('carrying its spelling', q.form, 'ga');
want('and the role it marks', q.value, 'SUBJECT');
want('standing apart from the word, which is how this app writes one',
     q.sep, ' ');

want('the marked word is the doer at the front', q.marked[0], 'poko');
want('and in the middle', q.marked[1], 'poko');
want('and at the back', q.marked[2], 'poko');

want('with no mark, this OSV language reads the SECOND word as the doer',
     q.bare[0], 'mi');
want('and the doer changes when the order does', q.bare[1], 'poko');

want('the word deleted takes its rule with it', q.after, 0);

/* ---- 20-31: what somebody wrote on the FORMS page reaches the engine -----
   The rules that make a form out of a word live on the word side -- the forms
   page, www/wordsheet.js -- and are kept in STG.fm. gModel() used to hand the
   engine an empty `inflections`, so a language whose past tense somebody had
   defined was translated with no past tense in it. Both ends were built and
   the middle was missing.

   Nothing here throws. A rule that never arrives still leaves a translation --
   the bare lemma, exactly as before anybody wrote the rule -- so every one of
   these is about WHICH letters came out.

   The last two are the ones that would go silently wrong: a rule about words
   ending in one letter must not fire on the others, and a rule whose condition
   is about SOUND cannot cross at all (this engine has no phonology) so it must
   be COUNTED rather than sent without its condition. */
const fmr = await pg.evaluate(() => {
  /* The letters to add, written as themselves. Going through spOf() looked
     tidier and was wrong: it maps each sound to whichever letter of THIS
     language reads it, so `ka` came back as `ca` -- the fixture's letter for
     /k/ is named c. A rule's `add` may hold a bare unit with no letter, which
     spWord() renders as itself, and that is what a check about the RULE
     should say. The app's own editor writes letters there; that is the app's
     business and not what is under test here. */
  const sp = (w) => w.split('').map((u) => ({ l:'', u:u }));
  const was = JSON.stringify(STG.fm || []);
  const wl = WORDS.length;
  WORDS.push({ hw:'zmi',  pos:'pro', mns:['the one speaking'], at:1 });
  WORDS.push({ hw:'luma', pos:'v', mns:['eat'], at:1 });
  WORDS.push({ hw:'carry', pos:'v', mns:['carry'], at:1 });
  WORDS.push({ hw:'beauty', pos:'n', mns:['beauty'], at:1 });
  STG.fm = [
    /* 「過去形は動詞の後ろに -ka を付けます」 */
    { id:'r1', pos:'v', fm:'pst', at:'end', drop:0, add:sp('ka'), when:'' },
    /* 「y で終わるのは i に変えて ed」 */
    { id:'r2', pos:'v', fm:'pst', at:'end', drop:1, add:sp('ied'), when:'x',
      wend:sp('y') },
    /* a derivation: a noun becomes an adjective */
    { id:'r3', pos:'n', fm:'adj', at:'end', drop:0, add:sp('li'), when:'' },
    /* and one this side cannot say: only after a vowel. It is about sound. */
    { id:'r4', pos:'v', fm:'pl', at:'end', drop:0, add:sp('zz'), when:'v' }
  ];
  const e = LinguaGrammarEngine, m = gModel();
  const w = (lemma) => m.words.filter((x) => x.lemma === lemma)[0];
  const past = (lemma) => e.morphology.inflect(m, w(lemma), { TENSE:'PAST' }).surface;
  const out = {
    inf: m.inflections.filter((x) => x.feature === 'TENSE').length,
    der: m.derivations.length,
    left: m.metadata && m.metadata.fmLeft,
    /* the plain rule */
    luma: past('luma'),
    /* the choosier one, on the word it is about */
    carry: past('carry'),
    /* the derivation */
    beauty: e.morphology.derive(m, w('beauty'), 'ADJECTIVE').surface,
    beautyPos: e.morphology.derive(m, w('beauty'), 'ADJECTIVE').partOfSpeech,
    /* and the whole point: a sentence of this language comes out with the
       tense on it, through the same road a translation takes */
    line: e.translate.fromSemantic(m, e.semanticIR({
            roles:{ SUBJECT:'the one speaking', PREDICATE:'eat' },
            features:{ TENSE:'PAST' } })).text
  };
  WORDS.length = wl;
  STG.fm = JSON.parse(was);
  return out;
});

want('both past-tense rules reached the engine', fmr.inf, 2);
want('and the derivation did too', fmr.der, 1);
want('the rule whose condition is about sound was counted, not sent',
     fmr.left, 1);

want('a verb takes the ending somebody wrote', fmr.luma, 'lumaka');
want('and a word the choosier rule is about takes THAT one', fmr.carry, 'carried');
want('a noun becomes an adjective the way somebody wrote it', fmr.beauty, 'beautyli');
want('and it is an adjective afterwards', fmr.beautyPos, 'ADJECTIVE');

/* The sentence is the reason for all of it: two words of this language, in
   this language's order, with the ending somebody wrote on the verb. That
   ending is what was missing before this. */
want('and a sentence comes out with the tense on it', fmr.line, 'zmi lumaka');

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
console.log('          A language with a model of its own is read from it, and its');
console.log('          words are this dictionary every time rather than a copy.');
console.log('          A particle somebody made is a word, and a word carrying one');
console.log('          is the doer wherever it stands.');
console.log('          What somebody wrote on the forms page reaches the engine,');
console.log('          and a rule this side cannot say is counted, not sent.');
