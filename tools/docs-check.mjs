// Refuse a second box: a document under docs/ that no map points at -- and
// a document pointing at a page or a function that is not there.
//
//   node tools/docs-check.mjs      # npm run docs
//
// 2026-09-04. `docs/OWNER-TODO.md` was created for "the things only the owner
// can do" — which had been written down since August, in `docs/STATE.md` § 4,
// with a table naming each one and who does it. Two boxes for one thing, and
// the older one is the one every session is told to read, so the new one was
// lost the moment it was written and the old one silently became half true.
//
// Nothing said a word. A `.md` costs nothing to add and answers to nothing:
// git takes it, the gate never looks at it, and it sits there being read by
// nobody while the reader who needed it is looking at the other file.
//
// This is `assets-check` pointed at the reading map instead of the app.
// There, `index.html` is the only thing that can load a script, so a `.js`
// nothing loads is a file nobody runs. Here, a session is handed `CLAUDE.md`,
// `README.md` and `docs/STATE.md` and reads outward from them, so a document
// none of the three reaches — directly or through a document they do reach —
// is a document nobody opens.
//
// Three directions:
//
//   1. Every document under docs/ is reachable from one of the three
//      entrances. An unreachable one is a second box.
//   2. Every `docs/….md` a reachable document NAMES exists and is in git. A
//      table row pointing at a file that is not there sends a session looking
//      for a page that was never written — the same wrong turn, taken from
//      the other end.
//
//      Writing the path out is what makes it a pointer, so a sentence ABOUT a
//      document that is gone says its bare file name and not its path. That
//      is the whole of the workaround, and it is the honest shape: a page is
//      being remembered, not linked to.
//
//   3. Every function a document NAMES -- written as a call in backticks,
//      `langKey()` or `can('kb')` -- is defined in the code: `www/`, the
//      Swift under `ios/`, a check under `tools/`, or `supabase/`. 2026-09-23
//      counted seventy-six names in these documents that nothing defines any
//      more, each one a sentence telling a session how the app works that
//      stopped being true the day the function went. A stale fact is simply
//      believed (CLAUDE.md, "a change lands with every sentence it
//      falsifies"), and a name is the one part of that sentence a machine can
//      read. So this counts the surface -- every call in every live document
//      -- rather than listing the names that were found, and a function
//      deleted tomorrow fails here tomorrow.
//
//      A sentence ABOUT a function that is gone strikes it through:
//      ~~`wldSeenHTML()`~~. Same shape as a gone document's bare file name --
//      the thing is being remembered, not pointed at -- and it is held in
//      both directions: a struck name that the code DOES define is a sentence
//      saying something is gone that is standing right there.
//
//      What the platform provides -- `confirm()`, `layoutSubviews()`,
//      `to_jsonb()` -- is not ours to define, and is named in PLATFORM below.
//      An entry nothing mentions any more, or that the code now defines as
//      its own, fails like a baseline line that outlived what it allowed.
//
// One difference from `assets-check`, and it is deliberate. There, a mention
// in another file's COMMENT does not count, because a comment cannot load a
// script and one that seemed to hid a blank screen for weeks. Here a mention
// is exactly what a reference is: documents are reached by a person reading
// one and following the name to the next. So any naming, in any reachable
// document, counts.
//
// `docs/reports/` and `docs/scope/` are not in this at all. They are what a
// session said on a day — a record like `docs/CHANGELOG.md`, written once and
// never revisited — and nothing is meant to point at them afterwards. Holding
// them to a map they were never on would make this check noise, and a noisy
// check gets skipped.
//
// `tools/docs-baseline.txt` holds what was ALREADY lost the day this was
// written. A NEW one fails. Taking a line out is progress and needs nobody.

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '')

/* The three a session is handed. `CLAUDE.md` says how the code has to be
   written, `docs/STATE.md` says where the project stands, and `README.md` is
   the front page a person arrives on. Everything else in docs/ is downstream
   of one of them or it is not read. */
const ENTRANCES = ['CLAUDE.md', 'README.md', 'docs/STATE.md']

/* Written on a day, never pointed at again. */
const RECORDS = ['docs/reports/', 'docs/scope/']

const problems = []
const note = (m) => problems.push(m)

// ---------------------------------------------------------------- git index

// Every .md git has, as posix paths from the repo root. This asks git rather
// than the disk for the same reason `assets-check` does: a document that is
// on this machine and not in the commit is a document nobody else has, and
// "it is right here" is exactly how that goes unnoticed.
let files
try {
  const out = execFileSync('git', ['ls-files', '-z', '--', '*.md'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  files = out.split('\0').filter(Boolean)
} catch {
  console.log('docs: not a git checkout, nothing to check.')
  process.exit(0)
}

const tracked = new Set(files)
const text = {}
const read = (rel) => {
  if (text[rel] === undefined) {
    try { text[rel] = readFileSync(join(ROOT, rel), 'utf8') } catch { text[rel] = '' }
  }
  return text[rel]
}

const isRecord = (rel) => RECORDS.some((d) => rel.startsWith(d))
const docs = files.filter((f) => f.startsWith('docs/') && !isRecord(f) && ENTRANCES.indexOf(f) === -1)

// ------------------------------------------------------------ the baseline

const BASELINE = join(ROOT, 'tools', 'docs-baseline.txt')
const allowed = new Set()
if (existsSync(BASELINE)) {
  for (const line of readFileSync(BASELINE, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    allowed.add(t)
  }
}
const used = new Set()
const forgiven = (key) => {
  if (!allowed.has(key)) return false
  used.add(key)
  return true
}

// -------------------------------------------------------- what reaches what

/* A document is reached when a document that is itself reached names it —
   by its path from the repo root, or by its own file name. The file name
   alone counts because that is how these files refer to each other: the table
   at the head of `docs/STATE.md` is a column of bare `FEATURES.md`. */
const names = (container, target) => {
  const src = read(container)
  const leaf = target.split('/').pop()
  return src.indexOf(target) >= 0 || src.indexOf(leaf) >= 0
}

const reached = new Set(ENTRANCES.filter((e) => tracked.has(e)))
let grew = true
while (grew) {
  grew = false
  for (const d of docs) {
    if (reached.has(d)) continue
    for (const c of reached) {
      if (names(c, d)) { reached.add(d); grew = true; break }
    }
  }
}

for (const d of docs) {
  if (reached.has(d)) continue
  if (forgiven('orphan ' + d)) continue
  note(
    `${d} exists and nothing reaches it.\n` +
      `      Not ${ENTRANCES.join(', ')}, and not any document those reach.\n` +
      `      A page nobody is sent to is a second box: the reader who needed it\n` +
      `      is looking at the file that was already there. Name it from the map\n` +
      `      it belongs to, fold it into the document that already holds this,\n` +
      `      or delete it.`
  )
}

// ------------------------------------------------ what the map points at

/* The other direction. A row naming a page that does not exist sends a
   session looking for it, and "I could not find it" is a thing a session
   works around rather than reports.

   Names under docs/reports/ and docs/scope/ are left out here for the same
   reason they are left out above: a session's scope declaration is a note
   from one day, and a sentence recalling one that has since been deleted is
   not a wrong turn — it is a record reading like a record. Holding those
   would make this check fire on every tidy-up, and a check that fires on
   nothing anybody must act on is a check that gets skipped. */
const dangling = new Set()
for (const c of reached) {
  for (const m of read(c).matchAll(/docs\/[A-Za-z0-9._/-]*\.md/g)) {
    const target = m[0]
    if (isRecord(target)) continue
    if (existsSync(join(ROOT, target)) && tracked.has(target)) continue
    dangling.add(c + ' -> ' + target)
  }
}
for (const key of dangling) {
  if (forgiven('dangling ' + key)) continue
  const [c, target] = key.split(' -> ')
  note(
    existsSync(join(ROOT, target))
      ? `${c} names ${target}. The file is on this machine but it is NOT in\n` +
          `      git, so it does not exist for anybody else. Run:  git add ${target}`
      : `${c} names ${target} and there is no such file.\n` +
          `      Either write it, or take the sentence out. A page somebody is sent\n` +
          `      to and cannot find is worse than no page.`
  )
}

// ------------------------------------------------ what the map calls

/* Written on a day and never revisited, so a function it names may have gone
   since and the sentence is still true of that day. `docs/CHANGELOG.md` and
   the handovers are this, as well as the two record folders above. */
const PAST = (rel) => isRecord(rel) || rel === 'docs/CHANGELOG.md' || /^docs\/HANDOVER[^/]*\.md$/.test(rel)

/* Not ours. The browser's, JavaScript's, UIKit's and Core Graphics', and
   PostgreSQL's -- named in these documents as what they are. And `actor(...)`,
   which is a column of `report` that PostgREST follows to `profile` in a
   select (www/net.js § netReports) rather than a function anybody defines. */
const PLATFORM = [
  // JavaScript and the browser
  'confirm', 'alert', 'prompt', 'String', 'Symbol', 'indexOf', 'function', 'var', 'for', 'min',
  'getBoundingClientRect', 'decode',
  // UIKit, Core Graphics, Core Text
  'advanceToNextInputMode', 'deleteBackward', 'fillPath', 'UILayoutPriority',
  // PostgreSQL, and PostgREST following a foreign key: `actor(handle)`
  'to_jsonb', 'actor',
]

/* What the code defines. Read loosely on purpose: a false "it is there" costs
   one stale sentence staying unnoticed, a false "it is gone" costs a red on a
   true document, and the second is the one that teaches people to skip. */
const walkFiles = (dir, keep) => {
  const out = []
  const go = (d) => {
    let ents
    try { ents = readdirSync(join(ROOT, d), { withFileTypes: true }) } catch { return }
    for (const e of ents) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue
      const rel = d + '/' + e.name
      if (e.isDirectory()) go(rel)
      else if (keep.test(e.name)) out.push(rel)
    }
  }
  go(dir)
  return out
}
const defined = new Set()
const collect = (files, re) => {
  for (const f of files) {
    for (const m of read(f).matchAll(re)) {
      const n = m.slice(1).find(Boolean)
      if (n) defined.add(n)
    }
  }
}
collect(walkFiles('www', /\.(js|html)$/),
  /function\s+([A-Za-z_$][\w$]*)\s*\(|(?:var|window\.)\s*([A-Za-z_$][\w$]*)\s*=\s*function|([A-Za-z_$][\w$]*)\s*:\s*function/g)
collect(walkFiles('ios', /\.swift$/), /func\s+([A-Za-z_]\w*)/g)
collect(walkFiles('tools', /\.m?js$/),
  /function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)\s*=>|function|[A-Za-z_$]\w*\s*=>)/g)
collect(walkFiles('supabase', /\.sql$/),
  /create\s+(?:or\s+replace\s+)?function\s+(?:public\.|storage\.)?([a-z_]\w*)/gi)
/* A table is written `device(uid, token)` when a document gives its columns,
   and that is a real thing being pointed at. It is not a function, so it may
   share a name with the platform's -- the table `prompt` is not `prompt()`. */
const fns = new Set(defined)
collect(walkFiles('supabase', /\.sql$/),
  /create\s+(?:table|view)\s+(?:if\s+not\s+exists\s+)?(?:public\.|storage\.)?([a-z_]\w*)/gi)

const live = files.filter((f) => f.endsWith('.md') && (f.startsWith('docs/') || ENTRANCES.indexOf(f) >= 0) && !PAST(f))
const lineOf = (src, i) => src.slice(0, i).split('\n').length
const platformSeen = new Set()
let calls = 0
let struck = 0
for (const d of live) {
  const src = read(d)
  for (const m of src.matchAll(/(~~)?`([A-Za-z_$][\w$]*)\(/g)) {
    const gone = !!m[1]
    const n = m[2]
    const at = `${d}:${lineOf(src, m.index)}`
    if (PLATFORM.indexOf(n) >= 0) { platformSeen.add(n); continue }
    if (gone) {
      struck++
      if (!defined.has(n)) continue
      if (forgiven(`struck ${d} ${n}`)) continue
      note(
        `${at} strikes ${n}() through as gone, and the code defines it.\n` +
          `      Either the sentence is about something else of that name, or it\n` +
          `      is not gone: say what it does now, without the strike.`
      )
      continue
    }
    calls++
    if (defined.has(n)) continue
    if (forgiven(`call ${d} ${n}`)) continue
    note(
      `${at} names ${n}() and nothing in www/, ios/, tools/ or supabase/\n` +
        `      defines it. A sentence naming a function that went is a sentence\n` +
        `      about the app that stopped being true that day. Say what does\n` +
        `      that job now -- read the code for its name -- or, if the sentence\n` +
        `      is about the going, strike it: ~~\`${n}()\`~~.`
    )
  }
}
for (const n of PLATFORM) {
  if (fns.has(n)) {
    note(`PLATFORM in tools/docs-check.mjs names ${n}, and the code defines a ${n} of its own --\n` +
      `      take it off the list, so a sentence about ours is held.`)
  } else if (!platformSeen.has(n)) {
    note(`PLATFORM in tools/docs-check.mjs names ${n}, and no document calls it any more --\n` +
      `      take it off the list. An exemption nothing uses is a hole.`)
  }
}

// ------------------------------------------------- a baseline that outlived

/* Same as `box-check`: a line allowing something that no longer happens is a
   hole nobody can see. Taking it out is the progress.

   And it SAYS WHICH of the two happened. "That is not true any more" is true
   of a document that got put on the map and equally of one that was deleted,
   and those want opposite things done next: the first is finished, the second
   may be a page somebody wanted. The first version of this said only the
   sentence, and the first time it fired it was read as the first case when it
   could as easily have been the second. A check that leaves the reader to
   guess the cause is a check that gets guessed at. */
for (const key of allowed) {
  if (used.has(key)) continue
  let why = 'and that is not true any more'
  if (key.startsWith('orphan ')) {
    const path = key.slice(7).trim()
    if (!tracked.has(path)) why = 'and THE DOCUMENT IS GONE -- nothing to be lost any more'
    else if (isRecord(path)) why = 'and the document has moved into a record folder, which this check does not hold'
    else why = 'and SOMETHING REACHES IT NOW -- it is on the map'
  } else if (key.startsWith('call ') || key.startsWith('struck ')) {
    const [, c, n] = key.split(/\s+/)
    if (!tracked.has(c)) why = `and ${c} IS GONE`
    else if (key.startsWith('call ') && defined.has(n)) why = `and ${n}() IS DEFINED NOW`
    else why = `and ${c} no longer names ${n}() that way`
  } else if (key.startsWith('dangling ')) {
    const [c, target] = key.slice(9).split(' -> ').map((x) => x.trim())
    if (!tracked.has(c)) why = `and ${c} IS GONE, so it names nothing`
    else if (!reached.has(c)) why = `and ${c} is no longer reachable itself, so what it names is nobody's wrong turn`
    else if (tracked.has(target)) why = `and ${target} EXISTS NOW`
    else why = `and ${c} no longer names ${target}`
  }
  note(
    `tools/docs-baseline.txt allows "${key}" ${why} —\n` +
      `      delete the line. A baseline that outlives what it allowed is a hole\n` +
      `      the next one falls through.`
  )
}

// ------------------------------------------------------------------- verdict

if (problems.length) {
  console.error('')
  for (const p of problems) console.error(`  ${p}`)
  console.error('')
  console.error(`docs: ${problems.length} problem${problems.length === 1 ? '' : 's'}.`)
  process.exit(1)
}

const records = files.filter(isRecord).length
console.log(
  `docs: ${docs.length} documents under docs/, every one reachable from ` +
    `${ENTRANCES.join(' / ')}${allowed.size ? ` (baseline ${allowed.size})` : ''}.`
)
console.log(`docs: ${records} under docs/reports/ and docs/scope/ — a day's record, not on the map.`)
console.log(
  `docs: ${calls} function calls named in ${live.length} live documents, every one defined in ` +
    `www/ ios/ tools/ supabase/; ${struck} struck through as gone; ${PLATFORM.length} the platform's.`
)
