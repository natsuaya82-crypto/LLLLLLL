/* Every button that deletes, and what it takes.
   ---------------------------------------------------------------------
   `docs/DATA_SAFETY.md` § DELETE REVIEW says what has to be written down
   before anything that removes data is built. It also used to carry the LIST
   -- 「Today the app deletes in exactly these places: delWord, ltDelete,
   delNote, postDel, wipeAll」 -- and that list was five when the app deleted in
   twenty-two places. Nothing held it, so it rotted where nobody was looking,
   and a list of deletions that is wrong is worse than no list: it is read as
   「these are all of them」 by the next person deciding whether a DELETE REVIEW
   is needed.

   So the list lives here, where it is asked of the code.

   THE BOUNDARY IS THE ACT TABLE. `www/act-map.js` is every name a button can
   carry (`tools/act-check.mjs` proves both directions of that), so 「a person
   pressed something and data went」 starts here. A function reached FROM one of
   these -- kbDelRow() out of kbSelDelGo(), meDropPic() out of the picture
   sheet, draftDropGo() out of dfSelDelGo() -- is the responsibility of the
   entry that reaches it, and is described in that entry's sentence.

   Three answers, and every delete-shaped act needs one:

     takes  what is removed from storage, as a sentence. null means nothing
            stored is removed -- a field is cleared, a canvas is emptied, a
            composer that has not been sent is put down
     asks   whether the person is asked first. Checked against the code:
            popAsk() in the function or in its `...Go` companion
     why    REQUIRED when something is taken and nothing is asked. A deletion
            with no confirm is allowed and several are right, but it has to be
            a decision somebody wrote rather than a step nobody noticed

   Run: node tools/del-check.mjs                                          */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WWW = path.join(HERE, '..', 'www');

/* A name is delete-shaped if it reads like one. Deliberately wide: a name that
   sounds like a deletion and is not still has to be answered, because the next
   person reading act-map.js will wonder about it too. */
const SHAPED = /del|drop|wipe|clear|remove|purge/i;

const DELETES = {
  /* ---- the making side: asked first ---------------------------------- */
  delWord:    { takes: 'one word out of WORDS, with its spelling and everything on it', asks: true },
  ltDelete:   { takes: 'one letter out of LETTERS, and the sounds no other letter reads', asks: true },
  ntSelDel:   { takes: 'the notes that are selected, out of NOTES', asks: true },
  wSelDel:    { takes: 'the words that are selected, out of WORDS', asks: true },
  kbDrop:     { takes: 'one keyboard this language built, out of KB', asks: true },
  kbDropLay:  { takes: 'one layout of the keyboard being edited', asks: true },
  kbSelDel:   { takes: 'the keys, rows or columns that are selected, out of the keyboard being edited', asks: true },
  stDelOwn:   { takes: 'one grammar stage somebody wrote, out of STG', asks: true },

  /* ---- the timeline: asked first ------------------------------------- */
  postDel:    { takes: 'one post, its row on the server, its files in post-media, and its voice file in Documents', asks: true },
  dfSelDel:   { takes: 'the drafts that are selected, their rows, and the voice file of each', asks: true },
  modDrop:    { takes: 'one report row on the server, and nothing else -- the post and the account it names are untouched', asks: true },

  /* ---- everything, asked first --------------------------------------- */
  wipeLangs:  { takes: 'the open language: every slice of it, its row in LANGS, its row on the server, and its backup files', asks: true },
  wipeAll:    { takes: 'the account: its row on the server and, on this handset, everything lsWipeAcct() names (docs/DATA_MODEL.md § what an account deletion actually takes)', asks: true },

  /* ---- taken without asking, and each of these is a decision ---------- */
  sndDrop:    { takes: 'one sound out of SND', asks: false,
                why: 'it refuses while any letter still reads that sound and says which letters, so nothing that is in use can go — and a sound nothing reads is a row in a list rather than something somebody made' },
  wldOvDel:   { takes: 'one row of what the language is for, out of WLD', asks: false,
                why: 'a row typed on the page it sits on, taken off with the ✕ beside it — the same press that made it, undone' },
  stDelEx:    { takes: 'one example off a grammar stage', asks: false,
                why: 'the ✕ on the example row. It is one line inside a stage the person is editing, not the stage' },
  wdDelEx:    { takes: 'one example off the word being edited', asks: false,
                why: 'the ✕ on the example row, inside the sheet that is open on that word' },
  fmrAsk:     { takes: 'one form rule out of the stages', asks: true,
                why: 'a rule is a setting the language declares, and the screen it is deleted from is the screen it was made on' },
  ltDropChar: { takes: 'the borrowed character off one letter', asks: false,
                why: 'the letter stays and keeps its name and its sounds. What goes is a face that was chosen rather than drawn, and choosing another one is the same press' },
  snsDropRecent: { takes: 'one word out of the search history, here and in recent_search', asks: false,
                why: '「1件づつ消せるでいいよ」 OWNER 2026-09-03 — the ✕ on the row IS the feature. A history is a record of typing, not something somebody made, and the star beside it is untouched' },
  voDrop:     { takes: 'the voice file in Documents/Voices of the recording being taken off the post that is being written', asks: false,
                why: 'the recording has not been sent. Taking it off is the person deciding not to use it, and leaving the file would be a file nothing points at — which is what nothing may tidy up later' },
  delNoteGo:  { takes: 'one note out of NOTES', asks: false,
                why: '「一覧から右にスワイプして削除。標準アプリと同じ作りにして」 OWNER 2026-09-05 — the swipe is the two-step press this app asks with a popup everywhere else: left to uncover 削除, then press it. A confirm on top of that is not what the standard app does, and the form’s own delete button (which did ask) is gone with it' },

  /* ---- nothing stored is removed ------------------------------------- */
  backDrop:   { takes: null, asks: false },
  clearSearch: { takes: null, asks: false },
  snsClearQ:  { takes: null, asks: false },
  geClear:    { takes: null, asks: false },
  addFmDrop:  { takes: null, asks: false },
  wdDelMn:    { takes: null, asks: false },
  kbDelKey:   { takes: null, asks: false },
  pwDropPic:  { takes: null, asks: false },
  pwMarkDel:  { takes: null, asks: false },
  adminStaffDrop: { takes: null, asks: false }
};

const files = fs.readdirSync(WWW).filter(f => f.endsWith('.js'));
const src = new Map(files.map(f => [f, fs.readFileSync(path.join(WWW, f), 'utf8')]));

/* The whole of one function, from its `function name(` at the left margin to
   the `}` at the left margin that closes it. www/ is written that way -- one
   level of nesting is indented -- so this is exact rather than a guess. */
function bodyOf(name) {
  for (const [f, s] of src) {
    const m = new RegExp('^function ' + name + '\\(', 'm').exec(s);
    if (!m) continue;
    const end = s.indexOf('\n}\n', m.index);
    return { file: f, text: s.slice(m.index, end < 0 ? s.length : end + 2) };
  }
  return null;
}

const map = fs.readFileSync(path.join(WWW, 'act-map.js'), 'utf8');
const bound = [];
{
  const re = /act\('([A-Za-z0-9_]+)'/g;
  let m;
  while ((m = re.exec(map))) bound.push(m[1]);
}

const bad = [];

for (const name of bound) {
  if (!SHAPED.test(name)) continue;
  const said = DELETES[name];
  if (!said) {
    bad.push('`' + name + '` is bound in www/act-map.js and reads like a ' +
      'deletion, and tools/del-check.mjs does not say what it takes. Add it: ' +
      '`takes` is what leaves storage (null if nothing does), `asks` is ' +
      'whether the person is asked first. docs/DATA_SAFETY.md § DELETE REVIEW ' +
      'is what the answer has to have been written against.');
    continue;
  }
  if (said.takes && !said.asks && !said.why)
    bad.push('`' + name + '` takes something and asks nobody, and no reason is ' +
      'written. That is allowed and several of these are right — but it has to ' +
      'be a decision somebody made, not a confirm nobody noticed was missing. ' +
      'Add `why`.');

  const fn = bodyOf(name);
  if (!fn) {
    bad.push('`' + name + '` is named here and www/ has no `function ' + name +
      '(` at the left margin. Either it moved or it is gone — if it is gone, ' +
      'take the line out.');
    continue;
  }
  const go = bodyOf(name + 'Go');
  const asks = /popAsk\(/.test(fn.text) || (go ? /popAsk\(/.test(go.text) : false);
  if (asks !== said.asks)
    bad.push('`' + name + '` (' + fn.file + ') ' + (asks ? 'asks' : 'does not ask') +
      ' and tools/del-check.mjs says it ' + (said.asks ? 'does' : 'does not') +
      '. A confirm that went away is the half of a deletion a person never ' +
      'sees until it has happened.');
}

/* And the other way: a name written down here that no button carries any more
   is a deletion nobody can reach, described as though somebody could. */
for (const name of Object.keys(DELETES))
  if (bound.indexOf(name) < 0)
    bad.push('tools/del-check.mjs names `' + name + '` and www/act-map.js does ' +
      'not bind it any more — delete the line.');

/* ---- AND ONE OF THEM IS RUN --------------------------------------------
   「投稿削除ボタン押しても消えないけど？」 A DELETE that matched NO ROW --
   the row policy in supabase/schema.sql refusing it -- answers exactly like
   one that matched, so the post went off the phone, the person was told it
   was gone, and the next pull brought it back. Nothing threw and no screen
   looked wrong: 「消えたつもり」 is a state with no error in it.

   The list above is read off the source. This is not: netDrop() and
   postDelGo() are taken out of www/ and RUN, against a netSend() that answers
   the way the server does, because 「the post is still on the screen」 is a
   thing the code does rather than a thing it says. No browser -- neither
   function touches the DOM, the way www/import.js's reader does not.       */
const evalled = (names) => {
  const bodies = names.map(n => {
    const fn = bodyOf(n);
    if (!fn) throw new Error('del: www/ has no `function ' + n + '(` any more');
    return fn.text;
  });
  return bodies.join('\n');
};

{
  const world = {
    POSTS: [], POST_GONE: {}, PMENU: 'x', SESS: { uid: 'u', at: 'tok' },
    said: [], sent: null, answer: null,
    netSignedIn: () => true,
    netDropFiles: (p, done) => done(),
    netSend: (m, path, body, tok, ok, bad) => { world.sent = m + ' ' + path; world.answer(ok, bad); },
    netPop: (d, s, mk) => { world.said.push('pop'); },
    netWhy: () => 'no',
    toast: (x) => { world.said.push('say:' + x); },
    t: (k) => k,
    postById: () => null,
    savePosts: () => {}, render: () => {}, back: () => {},
    here: () => ({ r: 'feed' }), voDropFile: () => {}
  };
  const src2 = evalled(['netDrop', 'postDelGo', 'postDelDone']);
  const keys = Object.keys(world);
  /* eslint-disable no-new-func */
  const make = new Function(keys.join(','), src2 + '\nreturn {postDelGo:postDelGo};');
  const app = make.apply(null, keys.map(k => world[k]));

  const run = (post, answer) => {
    world.POSTS.length = 0; world.POSTS.push(post);
    world.said.length = 0; world.sent = null; world.answer = answer;
    app.postDelGo(post.id);
    return { left: world.POSTS.indexOf(post) >= 0, said: world.said.slice() };
  };

  /* 0 行。The server answered, and it removed nothing. */
  const none = run({ id: 'p1', sid: 's1', mine: 1 }, (ok, bad) => ok([]));
  if (!none.left)
    bad.push('a DELETE that removed NO ROW took the post off the screen. ' +
      'PostgREST answers 204 for a delete the row policy refused, exactly as ' +
      'it does for one that worked — netDrop() has to count the rows that came ' +
      'back. 「投稿削除ボタン押しても消えないけど？」');
  if (none.said.indexOf('say:no') < 0)
    bad.push('a DELETE that removed NO ROW said nothing. The post staying put ' +
      'with no sentence is the same silence in a different place — and it is ' +
      'not 通信エラー either, so it is not the pop: the server answered.');

  /* And a post whose own send never came back. There is no row to delete and
     no way to say there is not one. */
  const nosid = run({ id: 'p2', mine: 1 }, (ok, bad) => ok([]));
  if (!nosid.left || nosid.said.indexOf('say:no') < 0)
    bad.push('a post with no `sid` was taken off the screen as though the ' +
      'server had agreed. Nothing was ever sent — that is not a deletion.');
  if (nosid.said.indexOf('say:no') >= 0 && world.sent)
    bad.push('a post with no `sid` still sent a DELETE. There is no row to name.');

  /* The other way, or the check above is green on a delete that never works. */
  const gone = run({ id: 'p3', sid: 's3', mine: 1 }, (ok) => ok([{ id: 's3' }]));
  if (gone.left)
    bad.push('a DELETE that removed the row left the post on the screen.');
}

if (bad.length) {
  console.error('del: what deletes, and what it takes\n');
  for (const b of bad) console.error('  - ' + b + '\n');
  process.exit(1);
}

const takes = Object.values(DELETES).filter(d => d.takes);
const asked = takes.filter(d => d.asks);
console.log('del: ' + Object.keys(DELETES).length + ' delete-shaped buttons — ' +
  takes.length + ' take something out of storage, ' + asked.length + ' of those ' +
  'ask first and ' + (takes.length - asked.length) + ' say in writing why they do not');
console.log('     nothing deletes that is not written down, and nothing written ' +
  'down has lost its confirm');
console.log('     and one of them was run: a DELETE that removed no row leaves the ' +
  'post on the screen and says so, a post with no sid sends nothing, and a ' +
  'DELETE that removed the row takes it off');
