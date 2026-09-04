// Refuse a second box: a document under docs/ that no map points at.
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
// Two directions, the same statement:
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

import { readFileSync, existsSync } from 'node:fs'
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
