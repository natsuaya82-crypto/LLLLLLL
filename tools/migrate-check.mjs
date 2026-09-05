/* ---------------------------------------------------------------------------
   tools/migrate-check.mjs — the language somebody already has still opens.

   Run it:   node tools/migrate-check.mjs

   Every other check in this repo opens the app in an empty browser, which is
   the one kind of phone that does not exist: nobody installs this and has
   nothing. So this one seeds storage first, then loads the app, and asks what
   the app made of what it found.

   THE EIGHT FLAT KEYS ARE NOT READ ANY MORE. A language made before this app
   could hold more than one sat under lingua.words through lingua.talk, and
   there used to be a road that copied them into a language on the first
   launch. 「もうまっさら昔のいらない。今の状態の話平キーなんかいらない」
   OWNER 2026-09-03 — that road is DELETED, not switched off. What this check
   holds about them now is case 8, and it is a different sentence in three
   parts: nothing is read, nothing is copied, and NOTHING IS DELETED. A phone
   carrying those eight keeps them exactly where they are; the app simply
   never looks at them again. The road went; the data did not.

   What it checks
     8. the flat keys      a phone carrying all eight comes up with one EMPTY
                           language of its own — not Vaska and not half of
                           Vaska — nothing is filed under the new id, no row
                           waits for an account, and all eight keys are still
                           there byte for byte, signed in or out
     4. a fresh install    nothing to read, so one empty language of their
                           own, not zero and not a broken half-language
     6. the plan moved     it leaves the settings file for the Keychain, and
                           the file stops deciding. This is the one case where
                           the migration is the point rather than the risk:
                           the file is what a PC backup lets somebody edit
     7. the session        the app does NOT sign itself in (OWNER 2026-08-26,
                           「言語はアカウントないと作れないです」). A phone with
                           nothing stored makes no account and comes up signed
                           out; a refused token is cleared and nothing stands
                           in for it; and a session already on a phone from
                           before any of this is still somebody. This is
                           stored data too -- lingua.sess grew a key -- and
                           getting it wrong signs a paying customer out
     5. switching          opening a second language puts the first one away
                           and brings the second one out -- all of it, and
                           nothing of the first. This is the one that can lose
                           somebody's dictionary rather than fail to show it:
                           write A's words while B is open and they are B's
                           words now, under B's key, and A's copy is gone the
                           next time A is saved. Nothing on screen would look
                           wrong at any point

     3. what was read      a migration COPIES and never removes what it read,
                           and it does not turn ABSENT into empty either. An
                           imported pronunciation is not replaced by a guess
                           off the headword; an old letter's `key` is not
                           thrown away for not being moved; and a language
                           with nothing to copy onto it is left with no
                           grammar slice at all, so the backup file and the
                           other phone can still fill it in

   Exit code is 0 only when all of them hold.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { chromium, LAUNCH } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WWW = path.join(HERE, '..', 'www');
const PORT = 8123;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const srv = http.createServer((q, r) => {
  const f = path.join(WWW, q.url === '/' ? 'index.html' : q.url.split('?')[0]);
  let body;
  try { body = fs.readFileSync(f); } catch (e) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain',
                     'Cache-Control': 'no-store' });
  r.end(body);
}).listen(PORT);

/* Exactly what a shipped version wrote: eight flat keys, no id anywhere. */
const OLD = {
  'lingua.words':   JSON.stringify([{ hw: 'tuf', gl: 'hello' }, { hw: 'ark', gl: 'fish' }]),
  'lingua.lang':    'Vaska',
  'lingua.lines':   JSON.stringify([{ a: 'tuf ark' }]),
  'lingua.letters': JSON.stringify([{ id: 'lA', sym: 't' }, { id: 'lB', sym: 'u' },
                                    { id: 'lC', sym: 'f' }]),
  'lingua.notes':   JSON.stringify([{ t: 'a note' }]),
  'lingua.phases':  JSON.stringify({ done: { sound: true }, notes: {}, set: {}, extra: [] }),
  'lingua.talk':    JSON.stringify([{ q: 'hi' }]),
  'lingua.script':  JSON.stringify({ g: { t: [[1, 2]] }, extra: [] }),
  'lingua.set':     JSON.stringify({ theme: 'dark', plan: 'free', done: true,
                                     snd: ['k', 't', 'a'] })
};

/* Everything a screen would read, plus what the storage layer thinks it did.
   These report what a thing IS, not how many of them there are. A count is
   reproducible by accident -- the first version of this fixture stored one
   letter and one drawn glyph, the app rebuilds letters it cannot find from
   the glyphs, and "1 letter" came out true whether the letters had been
   migrated or silently reconstructed. An id cannot be arrived at twice. */
const REPORT = () => ({
  words: WORDS.length, word0: WORDS[0] && WORDS[0].hw,
  name: langName, lines: LINES.length,
  letters: LETTERS.length, letterIds: LETTERS.map(function(x){ return x.id; }).join(','),
  notes: NOTES.length, note0: NOTES[0] && NOTES[0].t,
  /* Read out of the storage rather than off a global. The conversation's
     screen was lifted out with Studio -- see the note on PLANS in
     www/core.js -- so there is no TALK to ask, and asking one would have
     turned "the screen is not loaded" into "the conversation is gone". What
     has to survive a migration is the bytes, and the bytes are here. */
  talk: (function(){ try{ var a=JSON.parse(slRd(langKey('talk'))||'[]');
                          return a.length; }catch(e){ return 0; } })(),
  talk0: (function(){ try{ var a=JSON.parse(slRd(langKey('talk'))||'[]');
                           return a[0] && a[0].q; }catch(e){ return undefined; } })(),
  sound: !!STG.done.sound,
  snd: addedSnd().join(','),
  script: Object.keys(SCRIPT.g).join(','),
  theme: SET.theme, done: SET.done, plan: SET.plan,
  langs: Object.keys(LANGS).length, id: langId,
  mine: !!(LANGS[langId] && LANGS[langId].mine),
  indexName: LANGS[langId] && LANGS[langId].name,
  cur: localStorage.getItem('lingua.cur')
});

const fails = [];
const addedSndLen = (s) => (s ? s.split(',').length : 0);
const want = (label, got, expected) => {
  if (got !== expected) fails.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(expected)}`);
};
/* All of these, still in this order, in a list that may be longer.

   The alphabet is no longer only what somebody made: on the free plan
   ltStart fills it out to a-z and the two marks, so a language that arrives
   with three letters is holding thirty-one a moment later. What has to hold
   is that not one of the three was dropped, reordered or renumbered on the
   way -- which is what a subsequence says, and what a whole-list comparison
   can only say by also forbidding the twenty-eight. */
const keeps = (label, got, expected) => {
  const g = String(got || '').split(',').filter(Boolean);
  const e = String(expected || '').split(',').filter(Boolean);
  let i = 0;
  for (const x of g) if (x === e[i]) i++;
  if (i !== e.length)
    fails.push(`${label}: got ${JSON.stringify(got)}, wanted all of ${JSON.stringify(expected)}, in order`);
};
/* And the other direction, which is the only thing the empty list was ever
   saying: none of these, in a list that is allowed to hold other things. */
const lacks = (label, got, unwanted) => {
  const g = String(got || '').split(',').filter(Boolean);
  const bad = String(unwanted || '').split(',').filter(Boolean).filter((x) => g.indexOf(x) >= 0);
  if (bad.length)
    fails.push(`${label}: got ${JSON.stringify(got)}, which still has ${bad.join(',')}`);
};

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage();
/* The phone, when a case asks for one. ios/App/App/LinguaPlan.swift reads the
   Keychain and injects the plan as a script before anything else runs, so
   there is nothing to await and nothing to stub except the value itself --
   and the one call that writes it back. Asleep unless `__test.keychain` is
   there, so the five cases above run in the browser they always ran in. */
await pg.addInitScript(() => {
  let box = null;
  try { box = JSON.parse(localStorage.getItem('__test.keychain') || 'null'); } catch (e) {}
  if (!box) return;
  window.__plan = box.plan;
  window.__wrote = [];
  window.Capacitor = window.Capacitor || {};
  /* nativePromise, and NOT Capacitor.Plugins.
     This faked Plugins.LinguaPlan.write, which is the door the app used to
     knock on and which does not exist on a phone: Plugins is filled by
     @capacitor/core and there is no bundler here. So the check and the code
     shared one wrong assumption, agreed with each other, and went green while
     the plan was written nowhere at all -- on a real device Plus came back as
     free at the next launch and nothing here could see it.
     What the bridge actually injects is nativePromise(plugin, method, args),
     so that is what is faked. Going back to Plugins now turns this red. */
  window.Capacitor.nativePromise = (plugin, method, args) => {
    if (plugin !== 'LinguaPlan' || method !== 'write') {
      return Promise.reject(new Error('no such method ' + plugin + '.' + method));
    }
    const p = (args || {}).plan;
    window.__wrote.push(p);
    try { localStorage.setItem('__test.keychain', JSON.stringify({ plan: p })); } catch (e) {}
    return Promise.resolve();
  };
});
/* And the server, when a case asks for one. There is no Supabase on a Linux
   runner and there must not be one: what is under test is what the PHONE does
   with an answer, not what the answer is. Asleep unless `__test.net` is there,
   and read on every request rather than once, so a case can change its mind
   half way through -- which is what signing in over an anonymous account is.

     refresh: 'anon'   | 'member'   the token endpoint hands back a session
              'dead'                the token is no longer accepted (400)
              'off'                 no signal at all (status 0), which is not
                                    the same thing and must not be treated as
                                    if it were */
await pg.addInitScript(() => {
  let on = false;
  try { on = localStorage.getItem('__test.net') !== null; } catch (e) {}
  if (!on) return;
  const knob = () => {
    try { return JSON.parse(localStorage.getItem('__test.net') || '{}'); }
    catch (e) { return {}; }
  };
  const b64 = (o) => btoa(JSON.stringify(o))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  /* A real JWT's middle third and nothing else: netAnonTok() reads
     is_anonymous off the token, so a stub that answered `user.is_anonymous`
     and left the token blank would be testing a claim nothing reads. */
  const sess = (anon, uid) => JSON.stringify({
    access_token: 'h.' + b64({ sub: uid, is_anonymous: anon }) + '.s',
    refresh_token: 'r-' + uid,
    user: { id: uid, is_anonymous: anon },
  });
  window.__sent = [];
  function Fake(){ this.readyState = 0; this.status = 0; this.responseText = ''; }
  Fake.prototype.open = function (m, u){ this._m = m; this._u = u; };
  Fake.prototype.setRequestHeader = function (){};
  Fake.prototype.send = function (){
    const self = this, u = String(self._u || '');
    window.__sent.push(u);
    let status = 200, out = '[]';
    if (u.indexOf('/auth/v1/signup') >= 0) out = sess(true, 'u-anon');
    else if (u.indexOf('/auth/v1/token') >= 0) {
      const m = knob().refresh;
      if (m === 'dead') { status = 400; out = '{"error":"invalid_grant"}'; }
      else if (m === 'off') { status = 0; out = ''; }
      else out = sess(m !== 'member', m === 'member' ? 'u-them' : 'u-anon');
    }
    setTimeout(() => {
      self.readyState = 4; self.status = status; self.responseText = out;
      if (status === 0) { if (self.onerror) self.onerror(); return; }
      if (self.onreadystatechange) self.onreadystatechange();
    }, 0);
  };
  window.XMLHttpRequest = Fake;
});
await pg.goto(`http://localhost:${PORT}/`);

/* ---- 4: a phone that never had this app --------------------------------- */
await pg.evaluate(() => localStorage.clear());
await pg.reload();
const c = await pg.evaluate(REPORT);
want('a fresh install gets one language', c.langs, 1);
want('and it is theirs to write in', c.mine, true);
want('with nothing in it', c.words, 0);
/* and nothing said about how it sounds. This asked for the opposite -- that a
   fresh language arrive holding sounds -- and sndStart() put twelve in to
   satisfy it, which is the app saying what somebody's language sounds like.
   CLAUDE.md § What the free plan is refuses that in the note under ltStart:
   the inventory is not touched, and a sound goes in when somebody names a
   letter by hand, because they said the word. Nobody has said anything on the
   launch a language is made. */
want('and no sounds, because nobody has said one', addedSndLen(c.snd), 0);
want('and it is the one that is open', c.id, await pg.evaluate(() => langId));

/* ---- 5: two languages, and the door between them ------------------------
   Built straight into storage rather than through the app, because the app
   has no way to make a second language yet and this is what it will have to
   survive when it does. A is somebody's real language; B is the empty one
   they just started, which is the case that matters -- the emptiness has to
   arrive along with it, or A's words are still sitting in WORDS when B is
   saved. */
await pg.evaluate(() => {
  localStorage.clear();
  var A = 'LA', B = 'LB';
  localStorage.setItem('lingua.langs', JSON.stringify({
    LA: { name: 'Vaska', mine: true }, LB: { name: 'Toko', mine: false } }));
  localStorage.setItem('lingua.cur', A);
  localStorage.setItem('lingua.LA.words', JSON.stringify(
    [{ hw: 'tuf' }, { hw: 'ark' }, { hw: 'geb' }]));
  localStorage.setItem('lingua.LA.lang', 'Vaska');
  localStorage.setItem('lingua.LA.letters', JSON.stringify(
    [{ id: 'aA' }, { id: 'aB' }, { id: 'aC' }]));
  localStorage.setItem('lingua.LA.notes', JSON.stringify([{ t: 'A note' }]));
  localStorage.setItem('lingua.LA.talk', JSON.stringify([{ q: 'A talk' }]));
  localStorage.setItem('lingua.LA.phases', JSON.stringify(
    { done: { sound: true }, notes: {}, set: {}, extra: [] }));
  localStorage.setItem('lingua.LA.script', JSON.stringify({ g: { t: [[1, 2]] }, extra: [] }));
  localStorage.setItem('lingua.LA.snd', JSON.stringify(['t', 'u', 'f']));
  /* B has nothing at all: no keys, not empty ones. A language somebody has
     only just made. */
});
await pg.reload();

const A1 = await pg.evaluate(REPORT);
want('A opens as itself', A1.word0, 'tuf');
keeps('with its letters', A1.letterIds, 'aA,aB,aC');

/* over to B */
await pg.evaluate(() => langOpen('LB'));
const B1 = await pg.evaluate(REPORT);
want('B is open now', B1.id, 'LB');
want('and localStorage agrees', B1.cur, 'LB');
want('B has no words of A\'s', B1.words, 0);
lacks('nor A\'s letters', B1.letterIds, 'aA,aB,aC');
want('nor A\'s notes', B1.notes, 0);
want('nor A\'s conversation', B1.talk, 0);
want('nor how far A had got', B1.sound, false);
want('nor A\'s name', B1.name, '');
want('nor A\'s drawn script', B1.script, '');
/* B gets its own set rather than A's -- this is the one that would have been
   invisible: the sounds looked right because they were somebody's. */
want('nor A\'s sounds', B1.snd.indexOf('t,u,f'), -1);

/* saving B is what makes a leak permanent, so do it before going back */
await pg.evaluate(() => { save(); saveLetters(); saveNotes(); saveStg(); });
const leaked = await pg.evaluate(() =>
  (localStorage.getItem('lingua.LB.words') || '').indexOf('tuf') >= 0);
want('and B did not save them under its own id', leaked, false);

/* and back */
await pg.evaluate(() => langOpen('LA'));
const A2 = await pg.evaluate(REPORT);
want('A is still A', A2.word0, 'tuf');
want('with all of its words', A2.words, 3);
keeps('and all of its letters', A2.letterIds, 'aA,aB,aC');
want('and its note', A2.note0, 'A note');
want('and its conversation', A2.talk0, 'A talk');
want('and the stage it had finished', A2.sound, true);
want('and its name', A2.name, 'Vaska');
want('and its drawn script', A2.script, 't');
want('and its sounds', A2.snd, 't,u,f');

/* ---- 6: the plan leaves the file ---------------------------------------
   `lingua.set` is inside the app, and the app is inside the backup a phone
   makes onto a PC. Opening that backup, changing one word and restoring it
   needs no jailbreak, which made it the lowest door in the building. So the
   plan is in the Keychain now, and these are the two things that has to mean:
   what was already bought comes across by itself, and the file stops being
   listened to afterwards. */
/* Asked of the parsed file rather than of its text: lacks() above splits on
   commas, which is right for a list of letter ids and finds nothing at all in
   a line of JSON. */
const planInFile = () => pg.evaluate(() => {
  try {
    const f = JSON.parse(localStorage.getItem('lingua.set') || 'null');
    return !!(f && Object.prototype.hasOwnProperty.call(f, 'plan'));
  } catch (e) { return false; }
});
const nativeIs = (plan, settings) => pg.evaluate(([p, st]) => {
  localStorage.setItem('__test.keychain', JSON.stringify({ plan: p }));
  if (st !== null) localStorage.setItem('lingua.set', st);
}, [plan, settings === undefined ? null : settings]);

/* 6a. somebody who is already paying, on the launch after the update: the
   Keychain has never been written, and the settings still hold the plan. */
await pg.evaluate(() => localStorage.clear());
await nativeIs('', '{"theme":"dark","plan":"plus"}');
await pg.reload();
/* 'pro' and not 'plus', and that is the tier RENAME rather than a mistake:
   Free / Basic / Plus became Free / Plus / Pro on 2026-08-23, so a file
   written before that day says `plus` and means the top tier. planMigrate()
   moves the word up a rung, once. A settings file this old cannot have said
   `basic` -- there was never a way to set it. */
want('a plan already bought comes across',
     await pg.evaluate(() => plan()), 'pro');
want('and is written where it now lives',
     await pg.evaluate(() => (window.__wrote || []).join(',').indexOf('pro') >= 0), true);
want('and is taken out of the file it came from', await planInFile(), false);

/* 6a2. and the rename moves it ONCE. After it has run, `plus` is a real
   middle tier: a file that already carries planV must be left exactly where
   it is, or everybody on the middle rung is promoted at every launch. */
await pg.evaluate(() => localStorage.clear());
await nativeIs('', '{"theme":"dark","plan":"plus","planV":2}');
await pg.reload();
want('a plan written AFTER the rename is left where it is',
     await pg.evaluate(() => plan()), 'plus');

/* 6b. the same phone, with the file edited the way a restored backup would
   edit it. This is the whole reason for the move: the answer is the Keychain's
   'free', not the file's 'plus'. */
await nativeIs('free', '{"theme":"dark","plan":"plus"}');
await pg.reload();
want('the file no longer decides what the plan is',
     await pg.evaluate(() => plan()), 'free');

/* 6c. and nothing puts it back. A save writes the settings whole, and a save
   that carried the plan would hand the file its say again on the next load. */
await pg.evaluate(() => { SET.theme = 'light'; save(); });
want('and a save does not write it back into the file', await planInFile(), false);
want('while the app still knows what it is',
     await pg.evaluate(() => plan()), 'free');

/* ---- 7: the app does NOT sign itself in --------------------------------
   It used to. boot.js called netAnon() before the first frame, so everything
   somebody made belonged to an account before they had decided to be
   anybody, and this section held that: signed in, and NOT somebody, were two
   answers where they used to be one.

   OWNER DECISION 2026-08-26 took it out -- 「言語はアカウントないと作れない
   です」「匿名アカウントはねえよ」 -- so what is held here is the opposite,
   and it is held rather than deleted because "nothing happens on first
   launch" is a claim that breaks silently: a netAnon() put back by anybody
   would make an account on every phone again with no screen looking wrong.
   The signup COUNT is the assertion, not the session, for the same reason --
   an account made and then dropped is still an account made.

   The danger this section holds is still the third case, and that one has
   not moved: `lingua.sess` grew a key, and a phone that has been signed in
   for months does not have it; reading its absence as "anonymous" would take
   the timeline away from every account that exists.

   `netMember()` is gone -- it and netSignedIn() asked one question and the
   decision said 一本になる (2026-09-03). `member` here is netSignedIn(), which
   is what the app asks everywhere now, and `anon` is still read off the
   stored session because that is the field an old phone may not carry. */
const SESSION = () => ({
  inn: netSignedIn(), member: netSignedIn(), uid: (SESS && SESS.uid) || '',
  anon: !!(SESS && SESS.anon),
  signup: (window.__sent || []).filter((u) => u.indexOf('/auth/v1/signup') >= 0).length,
});
const netIs = (refresh, sess) => pg.evaluate(([r, sv]) => {
  localStorage.clear();
  localStorage.setItem('__test.net', JSON.stringify({ refresh: r }));
  if (sv !== null) localStorage.setItem('lingua.sess', sv);
}, [refresh, sess === undefined ? null : sess]);
/* Fired and not waited for -- boot.js does not hold the app up for a network
   -- so the answer lands a beat after the page is up. */
const settle = () => pg.waitForTimeout(120);

/* 7a. a phone with nothing on it at all. Nothing is asked of the server and
   nobody is signed in: the app opens on the door, which is onboard.js's. */
await netIs('dead', undefined);
await pg.reload();
await settle();
const s1 = await pg.evaluate(SESSION);
want('a first launch makes no account', s1.signup, 0);
want('and comes up signed out', s1.inn, false);
want('so nobody is anybody yet', s1.member, false);

/* 7b. the same phone opened again. It was "one account, not one per launch";
   with none being made it is the launch AFTER the one that made none, which
   is the launch a loop would show up on. */
await pg.evaluate(() => localStorage.setItem('__test.net', JSON.stringify({ refresh: 'dead' })));
await pg.reload();
await settle();
const s2 = await pg.evaluate(SESSION);
want('the next launch makes none either', s2.signup, 0);
want('and is still signed out', s2.inn, false);
want('and still nobody', s2.member, false);

/* 7c. somebody who has been signed in since before any of this. Their stored
   session has no `anon` key at all, and the phone has no signal, so nothing
   comes back to say what it is: the answer has to come from what is stored,
   and it has to be "a member". */
await netIs('off', JSON.stringify({ at: 'old-at', rt: 'old-rt', uid: 'u-them' }));
await pg.reload();
await settle();
const s3 = await pg.evaluate(SESSION);
want('a session from before this key is still somebody', s3.member, true);
want('and is left alone', s3.uid, 'u-them');
want('and no account is made behind their back', s3.signup, 0);

/* 7d. and the same session, refused. It is gone, which is a state and not a
   failure. Nothing is put in its place any more -- and the pair with 7c is
   the whole of it: REFUSED and NO SIGNAL both answer netResume's `bad` half,
   and only one of them may clear the session. 7c is the phone in a tunnel
   and keeps its account; this one is the token the server will not take. */
await netIs('dead', JSON.stringify({ at: 'old-at', rt: 'old-rt', uid: 'u-them' }));
await pg.reload();
await settle();
const s4 = await pg.evaluate(SESSION);
want('a refused token is cleared', s4.inn, false);
want('and nothing is made to stand in for it', s4.signup, 0);
want('so nobody is signed in', s4.member, false);

/* 7e. and somebody arriving at the door and signing in. The moment a token
   with a name on it arrives, this is a member -- which is now the only way
   to become one. */
const s5 = await pg.evaluate(() => new Promise((res) => {
  localStorage.setItem('__test.net', JSON.stringify({ refresh: 'member' }));
  netSignIn('a@b.c', 'pw',
    () => res({ member: netSignedIn(), anon: !!(SESS && SESS.anon) }),
    () => res({ member: null, anon: null }));
}));
want('signing in at the door makes somebody', s5.member, true);
want('and the session is not an anonymous one', s5.anon, false);
/* ---- the twenty-eight slots a free language is given ---------------------
   ltStart names them a to z, ! and ?, and gives each one what its name reads.
   Every one of those readings has to be a sound the chart actually has: a
   letter carrying the character "c" as its sound is in no inventory, cannot
   be said by voice.js, and cannot be found on the page where a sound is
   picked -- and nothing throws, so it sat there. 「無料版のa-zの音もipa準拠に
   なってるの？ただa-z当てただけになってない？」

   Asked of the app, not written out here, so a twenty-ninth slot is checked
   the day it is added. */
const AZ = await pg.evaluate(() => {
  const chart = ipaAll(), bad = [], seen = {};
  LT_START.split('').forEach((c) => {
    if (!/^[a-z]$/.test(c)) return;              /* ! and ? are not sounds */
    const l = LETTERS.filter((x) => (x.ab || '') === c)[0];
    if (!l) { bad.push(c + ': no letter'); return; }
    const snd = l.snd || [];
    if (!snd.length) { bad.push(c + ': no sound'); return; }
    snd.forEach((u) => { if (chart.indexOf(u) < 0) bad.push(c + ' reads ' + u); });
    seen[c] = snd.join('');
  });
  return { bad: bad, g: seen.g || '', c: seen.c || '', q: seen.q || '',
           x: seen.x || '', y: seen.y || '' };
});
want('every letter of a free alphabet reads a sound the chart has', AZ.bad.join(' / '), '');
/* The five that do not say themselves, by name, because "all of them are on
   the chart" is also true of the wrong sound. */
want('g is the velar and not the palatal', AZ.g, '\u0261');
want('c is k', AZ.c, 'k');
want('q is k', AZ.q, 'k');
want('x is k', AZ.x, 'k');
want('y is j', AZ.y, 'j');

/* ---- 8: a phone with the eight flat keys on it, and nothing happens ------
   A language made before this app could hold more than one sat under eight
   flat keys -- lingua.words through lingua.talk. **The app does not read
   them.** 「もうまっさら昔のいらない。今の状態の話平キーなんかいらない」
   OWNER 2026-09-03: the road that copied them into a language is deleted
   rather than switched off, so there is nothing here to return false.

   What is asserted is three separate things, and the third is the one that
   is easy to get backwards:

     1. nothing is READ -- the phone comes up with one EMPTY language of its
        own, the way any other phone with no language does. Not Vaska, not a
        half of Vaska
     2. nothing is COPIED -- no slice is filed under the new language's id,
        and the index does not grow a second row
     3. nothing is DELETED -- all eight keys are still there, byte for byte.
        This is a deletion of a ROAD and not of anybody's data. The owner said
        the flat keys are not wanted; they did not say to erase them, and
        docs/DATA_SAFETY.md is why the difference is written down. A phone
        that has them keeps them; they are simply never read again.

   The signed-in half is asked as well, because the account stamp is where
   the old road ended: with a session on the phone there is still nothing to
   stamp, so the language that is minted is the ordinary unstamped first one
   and no row anywhere carries a `mig` mark. */
const flatSeen = async () => pg.evaluate((old) => {
  const eight = Object.keys(old).filter((k) => k !== 'lingua.set');
  return {
    langs:   Object.keys(LANGS).length,
    words:   WORDS.length,
    name:    langName,
    notes:   NOTES.length,
    script:  Object.keys(SCRIPT.g).join(','),
    indexName: LANGS[langId] && LANGS[langId].name,
    /* The new language writes its own EMPTY slices on the first launch, the
       way any first run does, so "is there a key under this id" is the wrong
       question and was the first thing this check got wrong. What is asked is
       whether any of the OLD language is in them: its headword, its line, its
       note, and the ids of the three letters somebody drew. `letters` is the
       one that could pass by accident -- ltStart() fills a free alphabet out
       to thirty-eight slots, so the slice is far from empty; what may not be
       in it is lA, lB, lC. */
    carried: Object.keys(localStorage).filter(function(k){
               return k.indexOf('lingua.' + langId + '.') === 0 &&
                      /tuf|ark|a note|Vaska|"lA"|"lB"|"lC"/.test(
                        String(localStorage.getItem(k))); }).join(' '),
    /* and no row is waiting to be stamped by a road that no longer exists */
    marks:   Object.keys(LANGS).filter((id) => LANGS[id] && LANGS[id].mig).length,
    /* all eight, exactly as they were put down */
    kept:    eight.filter((k) => localStorage.getItem(k) === old[k]).length,
    eight:   eight.length,
    gone:    eight.filter((k) => localStorage.getItem(k) === null).join(' ')
  };
}, OLD);

/* signed out */
await pg.evaluate((old) => {
  localStorage.clear();
  Object.keys(old).forEach((k) => localStorage.setItem(k, old[k]));
}, OLD);
await pg.reload();
await settle();
const f1 = await flatSeen();
want('a phone carrying the eight flat keys gets one language', f1.langs, 1);
want('and it is EMPTY -- the flat keys were not read', f1.words, 0);
want('it is not the old language by name', f1.name, '');
want('nor in the index', f1.indexName, '');
want('nothing of the notes came across', f1.notes, 0);
want('nor the drawn script', f1.script, '');
want('and not one word of the old language is under its id', f1.carried, '');
want('no language is waiting for an account it will never be given', f1.marks, 0);
/* THE DELETION THAT DOES NOT HAPPEN. The road is gone; the data is not. */
want('all eight flat keys are still on the phone', f1.kept, f1.eight);
want('and not one of them was removed', f1.gone, '');

/* and signed in, which is where the old road put the account on */
await pg.evaluate((old) => {
  localStorage.clear();
  Object.keys(old).forEach((k) => localStorage.setItem(k, old[k]));
  localStorage.setItem('lingua.sess', JSON.stringify(
    { at: 'not a jwt', rt: 'a refresh token', uid: 'acct-1', anon: false }));
}, OLD);
await pg.reload();
await settle();
const f2 = await flatSeen();
want('signed in, the flat keys are still not read', f2.words, 0);
want('and still not copied', f2.carried, '');
want('and no mark is left for anybody to spend', f2.marks, 0);
want('and the eight are still all there', f2.kept, f2.eight);

/* ---- a pronunciation somebody brought in is not replaced by a guess -----
   CLAUDE.md § Data: *a migration COPIES and never removes what it read*.
   migrateSp() took a word from when a word was its sounds and, along with the
   copies it was right to drop, deleted `w.ph` -- the pronunciation. A word
   imported from a spreadsheet carries one, and it is not a copy of anything:
   it is a column the person filled in (www/import.js reads it).

   It needs TWO launches to show, which is why this reloads twice. boot.js
   runs migratePh() FIRST and migrateSp() LAST, so launch one deletes the
   pronunciation and launch two finds it missing and writes phGuess(hw) --
   a guess made from the spelling of the HEADWORD -- in its place. One launch
   and the word merely has nothing; two and it has somebody else's answer.
   「2発音は消えないでくい」 OWNER 2026-09-04. */
const PH = ['t', 'sʰ', 'ɑ', 'ŋ'];          /* nothing phGuess('kano') would say */
await pg.evaluate((ph) => {
  localStorage.clear();
  localStorage.setItem('lingua.langs', JSON.stringify({ LP: { name: 'Imported', mine: true } }));
  localStorage.setItem('lingua.cur', 'LP');
  localStorage.setItem('lingua.LP.lang', 'Imported');
  localStorage.setItem('lingua.LP.letters', JSON.stringify(
    [{ id: 'pk', nm: 'k', snd: 'k' }, { id: 'pa', nm: 'a', snd: 'a' },
     { id: 'pn', nm: 'n', snd: 'n' }, { id: 'po', nm: 'o', snd: 'o' }]));
  /* The old shape: a spelling of letters, no `spv`, and a pronunciation that
     came in with the word rather than out of the letters. */
  localStorage.setItem('lingua.LP.words', JSON.stringify([
    { hw: 'kano', mn: 'mountain', mns: ['mountain'], pos: 'n',
      sp: [{ l: 'pk', u: 'k' }, { l: 'pa', u: 'a' },
           { l: 'pn', u: 'n' }, { l: 'po', u: 'o' }],
      ph: ph }]));
}, PH);

const phOf = () => pg.evaluate(() => {
  const w = WORDS[0] || {};
  return { hw: String(w.hw || ''), ph: (w.ph || []).join(' '), spv: !!w.spv };
});

await pg.reload(); await settle();
const p1 = await phOf();
want('after one launch the imported pronunciation is still there', p1.ph, PH.join(' '));

await pg.reload(); await settle();
const p2 = await phOf();
want('and after the second launch too -- not a guess off the headword', p2.ph, PH.join(' '));
if (p2.ph !== PH.join(' ') && p2.ph)
  fails.push('the pronunciation that came in with the word was replaced by ' +
             JSON.stringify(p2.ph) + ', which phGuess() made up out of the spelling of ' +
             JSON.stringify(p2.hw) + '. A migration copies and never removes what it read.');

/* ---- an old letter's `key` is not thrown away ---------------------------
   CLAUDE.md § Data: *a migration COPIES and never removes what it read*, and
   this is the second place that read something and then removed it.

   A letter used to be two fields: `role`, which was 'mark' or 'snd', and
   `key`, the character that types it -- a mark cannot borrow its code point
   from the roman spelling of a sound it has not got. One field answers both
   now, which is what the letter READS: `?` reads `?`.

   migrateMarks() moves `key` into `snd`, and only when the letter said 'mark'
   AND reads nothing yet. Then it deleted both fields on EVERY letter it
   touched -- including the ones it had just decided not to move. So a mark
   that already read something lost the character that typed it, and there is
   nowhere left to read it back from: nothing else in www/ names `role` or
   `key`, so once the delete has run the value is gone from this phone, from
   the backup file and from the slice row on the server, all three.

   Nothing forbids the old shape's fields from staying where they are. They
   are inert -- no screen and no check reads them -- and inert is what a
   migration leaves behind when it has nowhere to put a value.

   Two launches, the way the pronunciation case above needs two: the first
   runs the migration and saves, and the second is the phone that reads back
   what the first one wrote. A delete that only lives in memory would pass a
   single launch. */
await pg.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('lingua.langs', JSON.stringify({ LM: { name: 'Marks', mine: true } }));
  localStorage.setItem('lingua.cur', 'LM');
  localStorage.setItem('lingua.LM.lang', 'Marks');
  localStorage.setItem('lingua.LM.letters', JSON.stringify([
    /* the shape the migration is FOR: a mark that reads nothing, with the
       character that types it in `key` */
    { id: 'mQ', role: 'mark', key: '?', snd: [] },
    /* and the one it is not for. It says 'mark' and already reads something,
       so `key` is not moved -- and today it is deleted anyway. The character
       is deliberately one no roman spelling and no ltStart slot would put
       back, so a green here cannot be something else arriving. */
    { id: 'mB', role: 'mark', key: '\u00b6', snd: ['b'] }
  ]));
});

const marksOf = () => pg.evaluate(() => {
  const at = (id) => {
    const l = LETTERS.filter((x) => x.id === id)[0];
    if (!l) return { snd: '(the letter is gone)', key: '(the letter is gone)',
                     role: '(the letter is gone)' };
    return { snd: (l.snd || []).join(' '),
             key: l.key === undefined ? '(deleted)' : l.key,
             role: l.role === undefined ? '(deleted)' : l.role };
  };
  return { q: at('mQ'), b: at('mB'),
           /* and off STORAGE, not off the global -- the delete has to survive
              a write and a read to be the thing that loses somebody's data */
           stored: slRd(langKey('letters')) || '',
           ids: LETTERS.map((x) => x.id).join(',') };
});

await pg.reload(); await settle();
await pg.reload(); await settle();
const mk = await marksOf();

/* ltStart() tops a free language up to its twenty-eight slots, so the two
   seeded letters are a subsequence of a longer alphabet. keeps, never a
   count -- the app rebuilds letters it cannot find, so a dropped one comes
   back plausible and the number is the same either way. */
keeps('the letters that were on the phone are still on it', mk.ids, 'mQ,mB');
want('the mark that read nothing now reads the character that typed it', mk.q.snd, '?');
want('and the character it was typed by is still on the letter', mk.q.key, '?');
want('and what it said it was is still on it too', mk.q.role, 'mark');
want('a mark that already read something keeps its reading', mk.b.snd, 'b');
want('and its character is not thrown away for not being moved', mk.b.key, '\u00b6');
want('nor is what it said it was', mk.b.role, 'mark');
if (mk.stored.indexOf('\u00b6') < 0)
  fails.push('the character that typed a mark is not in the letters slice on disk any more. ' +
             'Nothing else in www/ names `key`, so it is gone from this phone, from the ' +
             'backup file and from the slice row on the server. A migration copies and ' +
             'never removes what it read.');

/* ---- a language with no grammar of its own is left with none ------------
   CLAUDE.md § Data: *"empty" and "broken" are different states and must not
   share a branch* -- and so are "empty" and ABSENT. www/backup.js says the
   third one out loud: *a slice the app has never written is absent, and
   absent is what a restore is for*.

   migrateGramLang() copies the person's word order and the places their
   modifiers sit out of the settings and onto every language, once. What it
   copies is only ever an answer this app could have given: an order that is
   one of the six, and a modifier position that is 'before' or 'after'. When
   the settings hold neither -- an `order` outside ORDERS, which is what a
   settings file edited out of a PC backup can say, and www/core.js names
   that file as editable in as many words -- it copied nothing and then wrote
   the nothing down: `{}`, on a language that had never had a phases slice.

   Nothing throws and no screen changes. What changes is that the slice is
   PRESENT from then on, and present is what both roads home step over:
   bkTake() (www/backup.js) skips a slice that is already sound on the phone,
   and netLangBack1() (www/net.js) does the same. So the language's grammar
   can never be filled in from the backup file or from another phone again.
   With a signal syMerge() adds both sides and it comes back; a phone with no
   signal and no account is where it does not.

   Two languages, because the migration walks LANGS and the open one is not a
   special case. Two launches, so what is asked is what was WRITTEN rather
   than what one launch happened to hold in memory. */
const GLANGS = (setJson, phasesA) => pg.evaluate(([sj, pa]) => {
  localStorage.clear();
  localStorage.setItem('lingua.langs', JSON.stringify(
    { LA: { name: 'Aya', mine: true }, LG: { name: 'Gora', mine: true } }));
  localStorage.setItem('lingua.cur', 'LA');
  localStorage.setItem('lingua.LA.lang', 'Aya');
  localStorage.setItem('lingua.LG.lang', 'Gora');
  if (pa !== null) localStorage.setItem('lingua.LA.phases', pa);
  localStorage.setItem('lingua.set', sj);
}, [setJson, phasesA === undefined ? null : phasesA]);

const gramOf = () => pg.evaluate(() => ({
  a: localStorage.getItem('lingua.LA.phases'),
  g: localStorage.getItem('lingua.LG.phases'),
  /* the settings are READ and never removed -- docs/DATA_SAFETY.md rule 2 */
  setOrder: (JSON.parse(localStorage.getItem('lingua.set') || '{}') || {}).order,
  /* and what the open language's screen answers with, off the app's own
     function rather than off the slice: a field left empty has to come out
     the same page it came out before */
  shows: orderDef().id,
  chose: !!STG.set.order,
  /* and what the restore would make of it. It used to ask bkSound() -- the
     backup file's own shape test -- and there is no file (www/backup.js,
     2026-09-04). What is left is the question netLangBack1() actually asks,
     which is PRESENCE and always was: a slice already here is stepped over,
     and one that is not here is filled in from the server. */
  aThere: localStorage.getItem('lingua.LA.phases')!==null,
  name: langName,
  mark: SET.gramLang === 1 ? 'set' : 'unset'
}));

const twice = async () => { await pg.reload(); await settle();
                            await pg.reload(); await settle(); };

/* 1. nothing to copy. The settings say an order no screen in this app could
      have put there, and no modifier position at all. */
await GLANGS(JSON.stringify({ theme: 'dark', order: 'ZZZ' }));
await twice();
const g1 = await gramOf();
want('a language with nothing to copy is left with no phases slice', g1.a, null);
want('and so is the language that is not the open one', g1.g, null);
want('absent is still absent, so a restore can still fill it in', g1.aThere, false);
want('and the language opens exactly as it did', g1.name, 'Aya');

/* 1-b. AND THE ONE NOBODY TYPED. setDefaults() in www/core.js puts
        `order:'SOV'` into the settings of every person alive, so the road
        above copied 'SOV' onto every language of everybody who has never
        once opened the word-order stage -- a value the app itself put there,
        written down as if somebody had answered.
        「普通にアプリが入れる仕様なんて誰も頼んでないけど」OWNER 2026-09-04.
        The field stays empty, and orderDef() answers SOV for an empty field,
        so nothing on any screen moves.

        Asked twice over, because the two ways a phone arrives at that value
        are not the same file: a settings file that says 'SOV' outright, and
        one from before there was an `order` key at all, which setDefaults()
        fills in at load. */
await GLANGS(JSON.stringify({ theme: 'dark', order: 'SOV' }));
await twice();
const g1b = await gramOf();
want('the word order nobody typed is not written onto the language', g1b.a, null);
want('nor onto the other one', g1b.g, null);
want('absent, so a restore can still fill that in too', g1b.aThere, false);
want('and the settings still say what they said', g1b.setOrder, 'SOV');
want('and the screen answers with the same word order it always did', g1b.shows, 'SOV');
want('with nothing marked as chosen', g1b.chose, false);

await GLANGS(JSON.stringify({ theme: 'dark' }));
await twice();
const g1c = await gramOf();
want('a settings file from before there was a word order writes none either', g1c.a, null);
want('nor onto the other one', g1c.g, null);
want('and that screen answers with SOV as well', g1c.shows, 'SOV');

/* 2, 3. the three roads that DO copy something are untouched by that. */
await GLANGS(JSON.stringify({ order: 'VSO' }));
await twice();
const g2 = await gramOf();
want('an order the person chose is still copied onto the language', g2.a, '{"order":"VSO"}');
want('onto every language, not just the open one', g2.g, '{"order":"VSO"}');

await GLANGS(JSON.stringify({ order: 'ZZZ', gpos: { adj: 'before' } }));
await twice();
const g3 = await gramOf();
want('where the modifiers sit is copied on its own', g3.a, '{"gpos":{"adj":"before"}}');

/* 4. a language that already has a phases slice keeps every word of it. */
await GLANGS(JSON.stringify({ order: 'VSO' }), '{"done":{"a":1},"order":"SOV"}');
await twice();
const g4 = await pg.evaluate(() => {
  const o = JSON.parse(localStorage.getItem('lingua.LA.phases') || 'null') || {};
  return { order: o.order, done: o.done && o.done.a };
});
want('a language that already answered keeps its own order', g4.order, 'SOV');
want('and everything else that was in there', g4.done, 1);

/* 5. and wreckage is not "empty" -- it is left exactly where it is, because a
      restore is what answers it. */
await GLANGS(JSON.stringify({ order: 'VSO' }), '[[[not json');
await twice();
const g5 = await gramOf();
want('a phases slice that will not parse is left alone', g5.a, '[[[not json');

await br.close();
srv.close();

if (fails.length) {
  console.error(`the language somebody already has did not survive (${fails.length}):\n`);
  fails.forEach((f) => console.error('  ' + f));
  console.error('\nThis runs once, on a phone, against the only copy. Nothing here is\n' +
                'recoverable afterwards, so none of it may be shipped red.');
  process.exit(1);
}
console.log('migration: a new install starts with a language of its own, and a phone ' +
            'carrying\n           the eight flat keys does too — they are not read, not ' +
            'copied, and\n           not removed. The road is gone; the data is left ' +
            'where it is.\n' +
            '           A plan already bought moves itself out of the settings file ' +
            'and into\n           the Keychain, and the file stops being listened to.\n' +
            '           No account is made on a launch, a refused token is ' +
            'cleared with\n           nothing put in its place, and a session ' +
            'that was somebody before\n           any of this still is.');
