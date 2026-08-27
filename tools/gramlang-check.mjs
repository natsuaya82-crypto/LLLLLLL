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

/* ---- 32-40: the word order is arranged, not chosen from six -------------
   docs/GRAMMAR-V2-SPEC.md §3: 「ユーザーに最初から SOV/SVO などを選ばせるのでは
   ない。まず実際に自分の言語で文章を作ってみるところから始める」

   So the thing to hold is that MOVING A WORD IS WHAT SAYS THE ORDER -- and
   that the words drawn are this language's own, arranged by the real engine,
   so what is on screen is what a sentence would come out as.

   Nothing here throws either. A swap that wrote the wrong order still redraws
   three words in some order, and the page looks exactly as convincing. Every
   claim below is about WHICH word ended up where.

   Pressed for real through the app's own action table, because a check that
   calls g2Move() directly would be a copy of the button rather than the
   button -- the same reason card-check drives cardPaint(). */
const g2 = await pg.evaluate(() => {
  const was = STG.order, wasSet = !!STG.set.order, wl = WORDS.length;
  /* This chapter needs a pronoun, a noun and a verb, and the open language of
     this check has ONE word. Seeded here and taken away again, the way the two
     blocks above do it -- and worth saying why: the first version of this
     block assumed the dictionary was full, and the check DIED on
     `undefined.click` instead of failing. It looked green, because the command
     that ran it grepped for FAILED and a crash prints no such line. */
  WORDS.push({ hw:'zke',  pos:'pro', mns:['the one speaking'], at:1 });
  WORDS.push({ hw:'zkano', pos:'n',  mns:['a thing'], at:1 });
  WORDS.push({ hw:'ztir', pos:'v',   mns:['does'], at:1 });
  const show = () => { window.route = 'gram'; NAV = [{ r:'gram', a:'v2:order' }]; render(); };
  const words = () => Array.prototype.map.call(
    document.querySelectorAll('#app .segs .seg'), (b) => b.textContent);
  /* Says what it found rather than throwing on `undefined.click`. A check
     that dies with a TypeError names the wrong thing: the fault is "the row
     has n buttons", and a stack trace about `click` sends the next reader to
     the wrong file. */
  const press = (i) => {
    const b = document.querySelectorAll('#app .segs .seg');
    if (!b[i]) throw new Error('no word ' + i + ' to press: the row has ' + b.length);
    b[i].click();
  };
  const lit = () => Array.prototype.map.call(
    document.querySelectorAll('#app .segs .seg'), (b) => b.className.indexOf('on') >= 0)
    .indexOf(true);

  /* Nobody has chosen anything yet. A block above this one presses the old
     六択, so the mark is already standing when this starts -- and an assertion
     about "has decided nothing yet" would pass on any code at all. Cleared
     here and put back at the end. */
  delete STG.set.order;
  g2Lift = ''; STG.order = 'SOV'; show();
  const start = words();
  /* one press lifts and writes nothing */
  press(0);
  const afterOne = { lit: lit(), order: STG.order, words: words(),
                     /* and, the half a same-value write hides: lifting a word
                        is not DECIDING anything. STG.set.order is what says
                        somebody chose -- 「a default nobody chose is not a
                        decision」 -- and a first press that called setOrder()
                        with the order unchanged would write the same string
                        and mark it chosen, which no assertion about the string
                        can see. */
                     set: !!STG.set.order };
  /* pressing the same one puts it down again */
  press(0);
  const putDown = { lit: lit(), order: STG.order };
  /* lift the first and drop it on the last: S and V change places */
  press(0); press(2);
  const swapped = { order: STG.order, words: words(), lit: lit() };
  /* and the words on screen followed, because they are laid by the engine */
  const moved = swapped.words[0] === start[2] && swapped.words[2] === start[0];

  WORDS.length = wl;
  STG.order = was;
  if (wasSet) STG.set.order = 1; else delete STG.set.order;
  g2Lift = '';
  return { start: start.join(' '), n: start.length,
           afterOneLit: afterOne.lit, afterOneOrder: afterOne.order,
           afterOneWords: afterOne.words.join(' '), afterOneSet: afterOne.set,
           putDownLit: putDown.lit, putDownOrder: putDown.order,
           order: swapped.order, moved: moved, litAfter: swapped.lit,
           words: swapped.words.join(' ') };
});

want('three words of this language are on the page', g2.n, 3);
want('one press lifts that word and no other', g2.afterOneLit, 0);
want('and writes nothing yet', g2.afterOneOrder, 'SOV');
want('and moves nothing yet', g2.afterOneWords, g2.start);
want('and has decided nothing yet', g2.afterOneSet, false);
want('pressing it again puts it down', g2.putDownLit, -1);
want('still writing nothing', g2.putDownOrder, 'SOV');

want('first and last change places, and THAT is what says the order',
     g2.order, 'VOS');
want('the words on screen followed', g2.moved, true);
want('and nothing is left lifted afterwards', g2.litAfter, -1);

/* ---- 41-48: the noun chapter shows what this language really does --------
   docs/GRAMMAR-V2-SPEC.md §14 Nouns: 「ユーザーが『りんご』『りんごたち』などを
   実際の言語で作る。例えば poko / poko-mi」

   So the row is a REAL pair, worked out by the engine -- the same road a
   translation takes. A row that showed the rule and not what it makes of this
   word would look identical and say nothing, which is why every claim below is
   about the surface that came out.

   And it must not build a second rule editor: the rules live on the word side
   and the marks are words made in the 助詞 stage, so a row goes back to
   whichever of the two it came from. That is what the last two hold. */
const g2n = await pg.evaluate(() => {
  const sp = (w) => w.split('').map((u) => ({ l:'', u:u }));
  const wasFm = JSON.stringify(STG.fm || []), wasPart = !!STG.set.part;
  const wl = WORDS.length;
  WORDS.push({ hw:'zpoko', pos:'n', mns:['fish'], at:1 });
  WORDS.push({ hw:'ga', pos:'part', mns:['subject mark'], at:1, slot:'part.subj' });
  stMarkSet('part');
  STG.fm = [
    { id:'p1', pos:'n', fm:'pl', at:'end', drop:0, add:sp('mi'), when:'' },
    /* A SECOND way of making a plural, for nouns ending in a letter this one
       does not end in. Two things at once, and both silent:

       it must draw NO row, because an unchanged row is the app claiming a
       form the language has not got -- and this is the shape that tests it,
       since a rule of some OTHER feature would be filtered out by the chapter
       before the question was ever asked;

       and the row that IS drawn must be the plain rule's. A feature is spent
       on the first rule that matches it, so asking the engine for
       NUMBER=PLURAL rather than for THIS RULE hands both rows the same answer
       -- the same word, under two different names, both looking right. */
    { id:'p2', pos:'n', fm:'pl', at:'end', drop:0, add:sp('zz'), when:'x',
      wend:sp('q') },
    /* and a rule about VERBS, which is the verbs chapter's and must not be
       shown here as well */
    { id:'p3', pos:'v', fm:'pst', at:'end', drop:0, add:sp('ka'), when:'' }
  ];
  window.route = 'gram'; NAV = [{ r:'gram', a:'v2:n' }]; render();
  const rows = Array.prototype.map.call(
    document.querySelectorAll('#app .stslot'), (b) => ({
      lab: b.querySelector('.psm').textContent,
      from: b.querySelector('.psw').textContent,
      to: b.querySelector('.psi').textContent,
      go: b.getAttribute('data-do'), a: b.getAttribute('data-a') }));
  WORDS.length = wl;
  STG.fm = JSON.parse(wasFm);
  if (!wasPart) delete STG.set.part;
  return { n: rows.length, rows: rows,
           pl: rows.filter((r) => r.to.indexOf('mi') >= 0)[0] || null,
           mark: rows.filter((r) => r.to.indexOf(' ') >= 0)[0] || null,
           tense: rows.filter((r) => r.to.indexOf('ka') >= 0).length };
});

want('the noun has exactly the forms this language can make of it', g2n.n, 2);
want('a rule that says nothing about this word draws no row',
     g2n.rows.filter((r) => r.from === r.to).length, 0);
want('and the verbs chapter is not shown here as well', g2n.tense, 0);

/* `tuf` is the first noun of the language this check opens -- g2Nouns() shows
   the language's own word, not one the check invented, which is the point. */
want('the plural is the word this language really makes',
     g2n.pl && g2n.pl.to, 'tufmi');
want('from the word it is a form of', g2n.pl && g2n.pl.from, 'tuf');
want('and pressing it goes to where that rule is written',
     g2n.pl && g2n.pl.go, 'openFmr');

want('the mark stands apart, which is how this app writes one',
     g2n.mark && g2n.mark.to, 'tuf ga');
want('and pressing it goes to the word it is', g2n.mark && g2n.mark.go, 'openSlot');

/* ---- 49-56: the verbs chapter, and the line between it and the nouns -----
   docs/GRAMMAR-V2-SPEC.md §14 Verbs. Same walk as the nouns, a different word
   and a different set of features -- so what is worth holding is not that it
   draws rows (the nouns already proved that) but that **each chapter draws its
   own and only its own**. A feature landing in two chapters, or in none, is
   silent: the page looks complete either way.

   And a rule that goes on the FRONT has to come out on the front. The app's
   own editor has had that switch since before this page existed, and nothing
   until now put what it produces on a screen. */
const g2v = await pg.evaluate(() => {
  const sp = (w) => w.split('').map((u) => ({ l:'', u:u }));
  const wasFm = JSON.stringify(STG.fm || []), wl = WORDS.length;
  /* This check's language has nouns and no verb, so the verbs chapter would
     draw "make some words first" and every claim below would be about an
     empty section. Seeded and taken away again. */
  WORDS.push({ hw:'zluma', pos:'v', mns:['eat'], at:1 });
  STG.fm = [
    { id:'v1', pos:'v', fm:'pst', at:'end',   drop:0, add:sp('ka'), when:'' },
    { id:'v2', pos:'v', fm:'pas', at:'start', drop:0, add:sp('e'),  when:'' },
    /* the negation is the next chapter's and must not be drawn here */
    { id:'v3', pos:'v', fm:'neg', at:'end',   drop:0, add:sp('nn'), when:'' },
    /* and a plural is the nouns' */
    { id:'n1', pos:'n', fm:'pl',  at:'end',   drop:0, add:sp('mi'), when:'' }
  ];
  /* A chapter is a PAGE now, so this walks the pages rather than reading
     headings down one screen. That is the claim it always meant: what a
     chapter draws is its own, and what it does not draw is somewhere else. */
  const on = (id) => {
    window.route = 'gram'; NAV = [{ r:'gram', a:'v2:' + id }]; render();
    return Array.prototype.map.call(document.querySelectorAll('#app .stslot'),
      (b) => b.querySelector('.psm').textContent + ':' +
             b.querySelector('.psi').textContent);
  };
  const chaps = {};
  g2Chaps().forEach((c) => { chaps[c.id] = on(c.id); });
  WORDS.length = wl;
  STG.fm = JSON.parse(wasFm);
  return { chaps: chaps, ids: g2Chaps().map((c) => c.id) };
});

want('the page is a list of chapters, each one its own', g2v.ids.length, 8);
want('the nouns chapter holds only what a noun does',
     g2v.chaps.n.join(' '), 'Plural:tufmi');
/* Past and passive, and NOT the negation -- which is the next chapter's. */
want('a verb shows the endings this language gives it',
     g2v.chaps.v.indexOf('Past:zlumaka') >= 0, true);
want('a rule that goes on the front comes out on the front',
     g2v.chaps.v.indexOf('Passive:ezluma') >= 0, true);
want('and the negation is not drawn there',
     g2v.chaps.v.join(' ').indexOf('nn'), -1);
want('so the verbs chapter has exactly two rows', g2v.chaps.v.length, 2);

/* ---- 57-64: negation, and the three ways a language may write one --------
   docs/GRAMMAR-V2-SPEC.md §4: 「ただし『必ず PREFIX になる』と決めつけない」.
   An ending, a beginning, or A WORD OF ITS OWN -- and the last is not a
   setting of the first two: it changes the SENTENCE, not the verb.

   So the row is a pair of LINES, and the same row reads for all three. What
   is held here is that each way produces the line that way really makes, and
   that where a negation WORD lands is the ENGINE's answer -- this language's
   chosen position -- and not a guess made while drawing.

   Nothing throws in any of it. A negation that never arrives leaves the
   positive line printed twice, which looks like a language that does not
   negate rather than like a fault. */
const neg = (fm, opts) => pg.evaluate(({ fm, o }) => {
  const sp = (w) => w.split('').map((u) => ({ l:'', u:u }));
  const wasFm = JSON.stringify(STG.fm || []), wl = WORDS.length;
  const hidden = [];
  WORDS.push({ hw:'zluma', pos:'v', mns:['eat'], at:1 });
  /* The word this language says no with. It lives in the 否定 stage's slot,
     which is where it has always lived; this check's language has a dictionary
     of one word, so it is seeded here and taken away again. */
  if (!o.noWord)
    WORDS.push({ hw:'znak', pos:'part', mns:['not'], at:1, slot:'neg.not' });
  if (o.noWord)
    for (let i = WORDS.length - 1; i >= 0; i--)
      if (WORDS[i].slot === 'neg.not') hidden.push(WORDS.splice(i, 1)[0]);
  if (o.negp) { if (!STG.gpos) STG.gpos = {}; STG.gpos.negp = o.negp; }
  const wasNegp = STG.gpos && STG.gpos.negp;
  STG.fm = fm.map((r) => ({ id:r.id, pos:r.pos, fm:r.fm, at:r.at, drop:0,
                            add:sp(r.add), when:r.when || '',
                            wend:r.wend? sp(r.wend) : [] }));
  window.route = 'gram'; NAV = [{ r:'gram', a:'v2:neg' }]; render();
  const rows = Array.prototype.map.call(
    document.querySelectorAll('#app .stslot'), (b) => ({
      lab: b.querySelector('.psm').textContent,
      from: b.querySelector('.psw').textContent,
      to: b.querySelector('.psi').textContent,
      go: b.getAttribute('data-do') }));
  WORDS.length = wl;
  hidden.forEach((w) => WORDS.push(w));
  STG.fm = JSON.parse(wasFm);
  return { rows: rows, negp: wasNegp };
}, { fm, o: opts || {} });

/* 1. a word of its own. Where it goes is what this language answered, so the
   same word is asked for twice -- after the verb and before it -- and the two
   lines have to differ. A drawing that put it in a fixed place would give the
   same answer to both. */
const nAfter = await neg([], { negp:'after' });
const nBefore = await neg([], { negp:'before' });
const rowOf = (r) => r.rows.filter((x) => x.from !== x.to && x.to.indexOf(' ') >= 0)
                           .filter((x) => x.go === 'openSlot')[0] || null;

want('a negation written as a word makes a longer line',
     rowOf(nAfter) && rowOf(nAfter).to, 'tuf zluma znak');
want('and the language decides which side it lands',
     rowOf(nBefore) && rowOf(nBefore).to, 'tuf znak zluma');
want('the positive line is the same either way',
     rowOf(nAfter) && rowOf(nAfter).from, 'tuf zluma');
want('and pressing it goes to the word it is',
     rowOf(nAfter) && rowOf(nAfter).go, 'openSlot');

/* 2. an ending, and a beginning. The verb changes and the rest of the line
   does not -- which is the half a rebuilt line would get wrong. */
const nEnd = await neg([{ id:'n1', pos:'v', fm:'neg', at:'end', add:'nn' }],
                       { noWord:true });
const nPre = await neg([{ id:'n2', pos:'v', fm:'neg', at:'start', add:'un' }],
                       { noWord:true });
const ruleRow = (r) => r.rows.filter((x) => x.go === 'openFmr' &&
                                            x.from.indexOf(' ') >= 0)[0] || null;

want('a negation written as an ending goes on the verb',
     ruleRow(nEnd) && ruleRow(nEnd).to, 'tuf zlumann');
want('one written as a beginning goes in front of the verb',
     ruleRow(nPre) && ruleRow(nPre).to, 'tuf unzluma');
want('and the rest of the line is untouched',
     ruleRow(nPre) && ruleRow(nPre).from, 'tuf zluma');
want('pressing it goes to where that rule is written',
     ruleRow(nEnd) && ruleRow(nEnd).go, 'openFmr');

/* 3. two ways of saying no, which a language may have: one for verbs ending
   in a letter, one for the rest. Both rows are drawn -- showing only the
   first would be this page choosing which of somebody's rules counts -- and
   each row has to be about the rule it names.

   That last half is the one that goes silently wrong. A feature is spent on
   the first rule that matches it, so asking the engine for NEGATION rather
   than for THIS RULE gives both rows the same word, under two different
   names, both looking perfectly right. */
const nTwo = await neg([{ id:'n3', pos:'v', fm:'neg', at:'end', add:'xx',
                          when:'x', wend:'a' },
                        { id:'n4', pos:'v', fm:'neg', at:'end', add:'yy' }],
                       { noWord:true });
const twoRows = nTwo.rows.filter((x) => x.go === 'openFmr' &&
                                        x.from.indexOf(' ') >= 0);
want('both ways of saying no are drawn', twoRows.length, 2);
want('the one for verbs ending in a is the one that ends in a',
     twoRows.filter((x) => x.to === 'tuf zlumaxx').length, 1);
want('and the other row is the OTHER rule, not the same word twice',
     twoRows.filter((x) => x.to === 'tuf zlumayy').length, 1);

/* ---- 65-70: one rule, one chapter ----------------------------------------
   The general form of a bug that shipped. An interrogative is a MOOD, and the
   verbs chapter took every MOOD, so the same rule was drawn under 動詞 and
   under 疑問 -- one screen apart, both rows correct, nothing thrown. The
   opposite is just as silent: a rule that no chapter claims is a rule nobody
   can see.

   So this does not ask about questions. It puts one rule of EVERY kind this
   app can write into a language and counts, for each, how many chapters drew
   it. The answer has to be one, every time -- and a kind added later is
   walked the day it is added, because the list comes from the app's own
   labels rather than from anything written here. */
const chap = await pg.evaluate(() => {
  const sp = (w) => w.split('').map((u) => ({ l:'', u:u }));
  const wasFm = JSON.stringify(STG.fm || []), wl = WORDS.length;
  WORDS.push({ hw:'zluma', pos:'v', mns:['eat'], at:1 });
  /* Every inflection label the app offers, each with an ending of its own so
     the rows can be told apart. FM_INF is www/wordsheet.js's list and is
     asked for rather than copied. */
  /* Two digits, not one. With `q1`..`q11` the ending of the eleventh CONTAINS
     the ending of the second, so a row drawn once was counted twice and this
     check reported a rule in two chapters that was only ever in one. It was
     the check's own arithmetic, not the page's -- and it read exactly like a
     real finding, which is why it is written down here. */
  const kinds = FM_INF.map((f, i) => ({ fm:f, add:'q' + (i < 10 ? '0' : '') + i }));
  STG.fm = kinds.map((k, i) => ({ id:'k' + i, pos:'', fm:k.fm, at:'end',
                                  drop:0, add:sp(k.add), when:'' }));
  /* Each chapter is a page, so this opens every one of them and asks which
     ones drew each ending. The answer has to be one, every time. */
  const seen = {};
  g2Chaps().forEach((c) => {
    window.route = 'gram'; NAV = [{ r:'gram', a:'v2:' + c.id }]; render();
    Array.prototype.forEach.call(document.querySelectorAll('#app .stslot'), (el) => {
      const to = el.querySelector('.psi').textContent;
      kinds.forEach((k) => {
        if (to.indexOf(k.add) < 0) return;
        if (!seen[k.fm]) seen[k.fm] = [];
        if (seen[k.fm].indexOf(c.id) < 0) seen[k.fm].push(c.id);
      });
    });
  });
  WORDS.length = wl;
  STG.fm = JSON.parse(wasFm);
  return { kinds: kinds.map((k) => k.fm),
           twice: kinds.filter((k) => (seen[k.fm] || []).length > 1)
                       .map((k) => k.fm + ' in ' + (seen[k.fm] || []).join('+')),
           none: kinds.filter((k) => !(seen[k.fm] || []).length).map((k) => k.fm),
           once: kinds.filter((k) => (seen[k.fm] || []).length === 1).length };
});

want('every kind of form the app can write was tried', chap.kinds.length, 12);
want('no rule is drawn in two chapters', chap.twice.join(', '), '');
want('and none is drawn in no chapter', chap.none.join(', '), '');
want('so every one of them landed in exactly one', chap.once, chap.kinds.length);

/* ---- 71-78: adjectives -- where one stands, and how one changes ----------
   docs/GRAMMAR-V2-SPEC.md §6: 「単に before / after だけにしない」

   Two claims. WHERE a describing word stands is arranged the way the sentence
   is in the first chapter, so the two words swap and the language records it;
   the old screen asked it with a pair of labelled buttons and this asks it by
   being the phrase. And a describing word may itself CHANGE, which is the
   half the old screen had nowhere to show at all.

   The second is the one that was invisible before this chapter existed. A
   rule about adjectives carrying feature NUMBER was read by its FEATURE and
   handed to the nouns chapter -- which draws a NOUN, so the rule applied to
   nothing and no row was ever drawn. Not wrong: absent. */
const adj = await pg.evaluate(() => {
  const sp = (w) => w.split('').map((u) => ({ l:'', u:u }));
  const wasFm = JSON.stringify(STG.fm || []), wl = WORDS.length;
  const wasPos = STG.gpos && STG.gpos.adj, wasSet = !!STG.set.adj;
  WORDS.push({ hw:'zrua', pos:'adj', mns:['red'], at:1 });
  /* The sentence chapter needs a subject, a verb and a second noun, and this
     check's language has one noun. Without them that chapter draws "make some
     words first" and has no row -- so "two rows, and one does not disturb the
     other" would be asked of a page with one row on it. */
  WORDS.push({ hw:'zluma', pos:'v', mns:['eat'], at:1 });
  WORDS.push({ hw:'zpoko', pos:'n', mns:['fish'], at:1 });
  STG.fm = [{ id:'a1', pos:'adj', fm:'pl', at:'end', drop:0, add:sp('si'),
              when:'' }];
  if (!STG.gpos) STG.gpos = {};
  STG.gpos.adj = 'before';
  const show = (id) => { window.route = 'gram';
    NAV = [{ r:'gram', a:'v2:' + id }]; render(); };
  const segs = () => document.querySelectorAll('#app .segs .seg');
  const say = () => Array.prototype.map.call(segs(), (b) => b.textContent).join(' ');
  const press = (i) => { const b = segs();
    if (!b[i]) throw new Error('no word ' + i + ': the row has ' + b.length);
    b[i].click(); };
  g2Lift = ''; show('adj');
  const nSegs = document.querySelectorAll('#app .segs').length;
  const before = say(), wasOrder = STG.order;
  press(0); press(1);
  const after = say(), side = STG.gpos.adj;
  const order = STG.order;
  const form = Array.prototype.map.call(
    document.querySelectorAll('#app .stslot'), (b) =>
      b.querySelector('.psm').textContent + ':' + b.querySelector('.psi').textContent)
    .filter((x) => x.indexOf('si') >= 0).join(',');

  /* ACROSS THE PAGES. The two rows that arrange a pair are on different
     chapters now, and what is lifted survives going from one to the other --
     so this is the same claim it always was and a longer road to it: lift a
     word in the sentence, walk to the phrase, press. Carrying a role into a
     phrase means nothing, so that press lifts instead and neither answer
     moves. */
  g2Lift = ''; STG.order = wasOrder; STG.gpos.adj = 'before';
  show('order'); press(0);
  const cross = { order:STG.order, side:STG.gpos.adj };
  show('adj'); press(1);
  cross.afterOrder = STG.order;
  cross.afterSide = STG.gpos.adj;
  cross.lit = document.querySelectorAll('#app .segs .seg.on').length;

  WORDS.length = wl;
  STG.fm = JSON.parse(wasFm);
  if (wasPos) STG.gpos.adj = wasPos; else delete STG.gpos.adj;
  if (!wasSet) delete STG.set.adj;
  g2Lift = '';
  return { nSegs: nSegs, before: before, after: after, side: side,
           order: order, wasOrder: wasOrder, form: form, cross: cross };
});

want('the chapter has the one row it is about', adj.nSegs, 1);

want('the describing word stands where this language put it',
     adj.before, 'zrua tuf');
want('moving it says the other side', adj.after, 'tuf zrua');
want('and that is what the language now holds', adj.side, 'after');
/* Against what it WAS, not against a word order written here: this check's
   language has one of its own and an expectation typed in would be about the
   fixture rather than about the two rows being separate. */
want('the sentence above it did not move', adj.order, adj.wasOrder);

want('a describing word that changes is drawn', adj.form, 'Plural:zruasi');

want('a word lifted in the sentence does not move the phrase',
     adj.cross.afterSide, adj.cross.side);
want('nor the other way about', adj.cross.afterOrder, adj.cross.order);
want('and exactly one word is lifted afterwards -- the one just pressed',
     adj.cross.lit, 1);

/* ---- 79-84: where a place word stands ------------------------------------
   docs/GRAMMAR-V2-SPEC.md §7: 「現在の adp の位置設定だけではなく、場所を
   どう表現するかを定義できるようにする」

   `house in` and `in house`, arranged rather than chosen from a labelled
   pair. Same claim as the adjectives and a different answer, which is the
   point: the two are separate rows writing separate values, and a page that
   moved both at once would look right in a picture of either one. */
const adp = await pg.evaluate(() => {
  const wasFm = JSON.stringify(STG.fm || []), wl = WORDS.length;
  const wasAdp = STG.gpos && STG.gpos.adp, wasAdj = STG.gpos && STG.gpos.adj;
  const wasSet = !!STG.set.adp;
  WORDS.push({ hw:'zrua', pos:'adj', mns:['red'], at:1 });
  WORDS.push({ hw:'zni', pos:'part', mns:['in'], at:1, slot:'where.in' });
  STG.fm = [];
  if (!STG.gpos) STG.gpos = {};
  STG.gpos.adp = 'before'; STG.gpos.adj = 'before';
  window.route = 'gram'; NAV = [{ r:'gram', a:'v2:adp' }]; g2Lift = ''; render();
  /* The rows, by the name they carry, rather than by where they sit: an
     index would follow whichever chapter happened to draw one. */
  /* data-a is a JSON array -- ["adp",0] -- so the row's name is the FIRST
     item, read by parsing rather than by where the letters fall in the
     string. Asking for indexOf(...) === 0 matched nothing, every row came
     back empty, and the first .click() on an empty list threw: the check
     DIED rather than failing, and the command watching for the word FAILED
     printed nothing at all. Twice now. Read the tail. */
  const row = (key) => {
    const b = document.querySelectorAll('#app .segs .seg');
    return Array.prototype.filter.call(b, (x) => {
      let a = null;
      try { a = JSON.parse(x.getAttribute('data-a') || '[]'); } catch (e) {}
      return !!a && a[0] === key;
    });
  };
  const say = (key) => row(key).map((x) => x.textContent).join(' ');
  const before = say('adp'), n = row('adp').length;
  /* Says what it found rather than dying on `undefined.click`. The fault when
     this chapter draws the wrong row is "the place row has 0 words", and a
     stack trace about click() sends the next reader to the wrong file. */
  if (n >= 2) { row('adp')[0].click(); row('adp')[1].click(); }
  const after = say('adp'), side = STG.gpos.adp, adjSide = STG.gpos.adj;
  /* The other pair-arranging row is on its OWN page now, so it is opened to
     be looked at rather than read off this one -- and while the words are
     still here: the tidying below takes them away again. Same claim as
     before: moving the place word wrote the place answer and left the
     describing word's alone. */
  window.route = 'gram'; NAV = [{ r:'gram', a:'v2:adj' }]; render();
  const adjN = document.querySelectorAll('#app .segs .seg').length;
  WORDS.length = wl;
  STG.fm = JSON.parse(wasFm);
  if (wasAdp) STG.gpos.adp = wasAdp; else delete STG.gpos.adp;
  if (wasAdj) STG.gpos.adj = wasAdj; else delete STG.gpos.adj;
  if (!wasSet) delete STG.set.adp;
  g2Lift = '';
  return { n: n, before: before, after: after,
           side: side, adjSide: adjSide, adjN: adjN };
});

want('the place word stands beside its noun', adp.n, 2);
want('on the side this language put it', adp.before, 'zni tuf');
want('moving it says the other side', adp.after, 'tuf zni');
want('and that is what the language now holds', adp.side, 'after');

/* The other two-word row is on the same page and must not have moved. */
want('the describing word is still where it was', adp.adjSide, 'before');
want('and its row is still drawn on its own page', adp.adjN, 2);

/* ---- 85-90: what this language has -------------------------------------
   docs/GRAMMAR-V2-SPEC.md §14's last block, and §24's argument for the whole
   page: 「作り込むほど Words + Inflections + Derivations が蓄積され、その結果
   精度が上がる」. So the numbers have to be the ones the ENGINE was handed --
   a panel counting what somebody typed, rather than what crossed over, would
   say the language is fuller than the translation can see.

   Which is exactly the failure this page was built to end. A rule this side
   cannot express is COUNTED and not sent (the sound conditions), so a panel
   reading STG.fm would say 3 where the engine has 2. */
const stat = await pg.evaluate(() => {
  const sp = (w) => w.split('').map((u) => ({ l:'', u:u }));
  const wasFm = JSON.stringify(STG.fm || []), wl = WORDS.length;
  const wasPart = !!STG.set.part;
  WORDS.push({ hw:'zluma', pos:'v', mns:['eat'], at:1 });
  WORDS.push({ hw:'ga', pos:'part', mns:['subject'], at:1, slot:'part.subj' });
  stMarkSet('part');
  STG.fm = [
    { id:'v1', pos:'v', fm:'pst', at:'end', drop:0, add:sp('ka'), when:'' },
    { id:'d1', pos:'n', fm:'adj', at:'end', drop:0, add:sp('li'), when:'' },
    /* about SOUND, so it cannot cross and must not be counted as if it had */
    { id:'v2', pos:'v', fm:'pl', at:'end', drop:0, add:sp('zz'), when:'v' }
  ];
  window.route = 'gram'; NAV = [{ r:'gram', a:'v2:st' }]; render();
  const rows = {}, secs = document.querySelectorAll('#app .gside');
  Array.prototype.forEach.call(secs, (el) => {
    rows[el.querySelector('.gsl').textContent] = el.querySelector('.gsw').textContent;
  });
  const words = WORDS.length;
  WORDS.length = wl;
  STG.fm = JSON.parse(wasFm);
  if (!wasPart) delete STG.set.part;
  return { rows: rows, n: secs.length, words: words };
});

want('the panel has a row for each thing that can be counted', stat.n, 3);
want('the words are this dictionary', stat.rows['Words'], String(stat.words));
/* One inflection wrote a tense, one wrote a mark, and the third is about
   sound and did not cross. */
want('the forms are the ones the engine was handed', stat.rows['Forms'], '2');
want('and the word formation is too', stat.rows['Word formation'], '1');

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
console.log('          The word order is arranged by moving a word, and the six');
console.log('          are not what anybody is asked.');
console.log('          A noun shows the forms this language really makes of it,');
console.log('          and a row goes back to where its rule is written.');
console.log('          Each chapter draws its own forms and only its own, and a');
console.log('          rule that goes on the front comes out on the front.');
console.log('          A negation reads the same whether it is an ending, a');
console.log('          beginning, or a word of its own.');
console.log('          Every kind of form the app can write lands in exactly one');
console.log('          chapter -- not two, and not none.');
console.log('          A describing word is put on the side this language puts it,');
console.log('          and one that changes is drawn where it can be seen.');
console.log('          A place word stands where this language puts it, and the');
console.log('          two rows that arrange a pair do not move each other.');
console.log('          What this language HAS is counted off what the engine was');
console.log('          handed, not off what somebody typed.');
