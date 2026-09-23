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
const PAST = (rel) => isRecord(rel) || rel === 'docs/CHANGELOG.md' || /^docs\/(?:HANDOVER[^/]*|CHECK-\d{4})\.md$/.test(rel)

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
collect(walkFiles('supabase', /\.(m?js|ts)$/),
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

// ------------------------------------------------ what the map names

/* The calls above were the first half of the surface and the half that was
   easy to see. r73 (docs/scope/r73-audit.md § 2-17) measured the rest: a
   name written WITHOUT the brackets -- `setPlan`, `PLAN_NATIVE`, `ME.fo`,
   `obBackTo` -- a check named by name -- `backup-check` -- and a number
   written into a sentence -- "the fast nine", "39 checks", 「全ゲート28本」
   -- all went through, and every one of them was a sentence about the app
   that had stopped being true. A number of checks went stale in the brief
   the leader hands every session, which is how it kept coming back.

   So this counts every one of those, in every live document:

     name   every name in backticks, bare or dotted, is a word the code has
            -- www/ ios/ tools/ supabase/ .github/ and package.json, with
            the COMMENTS TAKEN OUT, because a comment remembering a gone
            name (`mkPos` in shell.js's opening comment) is the same kind of
            sentence as the document's and cannot vouch for it. Dotted names
            are asked one segment at a time: `post.ink` is a field of a row,
            not a global, and a field is found as a word.
     file   every code file named in backticks is a file git has
     check  every `x-check` named is a tool under tools/
     npm    every `npm run x` is a script in package.json
     count  no sentence says how many checks the gate has. The gate prints
            it on its last line (tools/gate.mjs), and a number copied from
            there is a number that has already moved -- CLAUDE.md says so
            and this is what holds it
     owner  every OWNER date a comment in the code gives is a date the
            decision log has an entry for. A decision a comment quotes and
            the log never heard of is a decision a later session cannot find
     gone   an entry of the decision log whose heading opens 【差し替え済み
            keeps one line saying what replaced it, and nothing else. The
            owner decided that on 2026-09-03 (decision log, 「古い規則は残さ
            ない」): 印を付けて本文を残すのも残したことになる。消す。

   Struck through -- ~~`name`~~ -- is a sentence about something that went,
   and is held the other way: a struck name the code DECLARES is standing
   right there.

   A commit is written in hex and is left alone: a checkout in CI is shallow,
   so "git does not have it" would be a lie about somebody's history. */

const CODE_ROOTS = ['www', 'ios', 'tools', 'supabase', '.github']
const CODE_FILE = /\.(js|mjs|ts|html|swift|sql|yml|yaml|plist|json|entitlements|pbxproj|sh|txt|xcconfig|strings|storyboard|xml)$/
const AS_IS = /\.(json|plist|pbxproj|entitlements|txt|strings|storyboard|xml|xcconfig)$/
const codeFiles = [
  ...CODE_ROOTS.flatMap((d) => walkFiles(d, CODE_FILE)),
  'package.json', 'capacitor.config.json', 'vercel.json', 'tools/pre-commit', 'tools/commit-msg',
].filter((f) => existsSync(join(ROOT, f)))
  /* Not this check and its baseline: they name every word they hold, and a
     word vouched for by the thing checking it is a copy that always agrees. */
  .filter((f) => f !== 'tools/docs-check.mjs' && f !== 'tools/docs-baseline.txt')

/* Comments out, strings kept: a name in a string is a name the code uses
   (`'lingua.sess'`, an i18n key, a column in a query). */
function uncomment(src, f) {
  if (AS_IS.test(f)) return src
  const sh = /(\.sh|\.ya?ml|pre-commit|commit-msg)$/.test(f)
  const sql = /\.sql$/.test(f)
  const html = /\.html$/.test(f)
  let out = ''
  for (let i = 0, n = src.length; i < n;) {
    const c = src[i], d = src[i + 1]
    if (sh && c === '#' && (i === 0 || /\s/.test(src[i - 1]))) { while (i < n && src[i] !== '\n') i++; continue }
    if (sql && c === '-' && d === '-') { while (i < n && src[i] !== '\n') i++; continue }
    if (html && src.startsWith('<!--', i)) { const e = src.indexOf('-->', i); i = e < 0 ? n : e + 3; continue }
    if (!sh && c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; out += ' '; continue }
    if (!sh && !sql && c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue }
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1
      while (j < n && src[j] !== c && !(src[j] === '\n' && c !== '`')) { if (src[j] === '\\') j++; j++ }
      out += src.slice(i, j + 1); i = j + 1; continue
    }
    out += c; i++
  }
  return out
}
const words = new Set()
const declared = new Set()
let codeText = ''
for (const f of codeFiles) {
  const src = uncomment(read(f), f)
  codeText += src + '\n'
  for (const w of src.match(/[A-Za-z_$][\w$]*/g) || []) words.add(w)
  for (const m of src.matchAll(/(?:\b(?:var|let|const|function|func|class|struct|enum)\s+|window\.)([A-Za-z_$][\w$]*)/g)) declared.add(m[1])
}
for (const n of defined) declared.add(n)

/* Not ours, and not in the code: Apple's, the browser's, the tools a
   session is driven by, and the files that live somewhere other than this
   repository. Held both ways, like PLATFORM: an entry no document names, or
   one the code now has, is taken off. */
const NOT_OURS = [
  // Apple
  'UserDefaults', 'URLSession', 'UIPasteboard', 'openURL', 'PortraitUpsideDown', 'GADAdLoader',
  'CLLocation', 'SecAddSharedWebCredential', 'decidePolicyFor', 'createWebViewWith',
  'URLRequest', 'CGContext', 'CALayer', 'setMarkedText', 'UITextInputMode', 'attributesOfItem',
  'resourceValues', 'NSPrivacyAccessedAPITypes',
  // what apple.md's privacy section says is NOT in the app (the absence is the sentence)
  'IDFA', 'advertisingIdentifier', 'ASIdentifierManager', 'AdSupport', 'Firebase', 'GoogleAnalytics',
  'FBSDK', 'amplitude', 'mixpanel', 'Sentry', 'appsflyer',
  // the browser
  'DecompressionStream', 'geolocation', 'getCurrentPosition',
  // Capacitor's configuration and bridge, Supabase's verify parameter
  'server.hostname', 'notifyListeners', 'token_hash',
  // what drives a session (docs/SESSIONS.md, docs/LEADER.md)
  'create_session', 'send_message', 'archive_session', 'unarchive_session', 'get_session',
  'create_trigger', 'fire_trigger', 'cron_expression', 'run_once_at', 'source_url', 'source_revision',
  'add_repo', 'ListAgents', 'SendMessage', 'REQUIRES_ACTION', 'IDLE', 'SESSION_STATUS_RUNNING',
  'mcp__Claude_Code_Remote__',
  // Capacitor's native bridge, injected into the page (CLAUDE.md § Layout, keyboard-extension.md)
  'toNative', 'nativeCallback', 'isPluginAvailable', 'withPlugin', 'registerPlugin',
  'Capacitor.registerPlugin', 'core.registerPlugin', 'plugin.js',
  // git
  'rebase',
  // the documents' own words for a state (CLAUDE.md § Five states)
  'IMPLEMENTED', 'SPEC', 'VERIFIED', 'CONNECT',
  // files that live outside this repository: in the App Group, on the web site
  'keyboard.json', 'widget.json', 'terms.html', 'privacy.html', 'app-ads.txt',
]
const notOursSeen = new Set()
const ENGLISH_CHECK = ['re-check'] // the verb, not a tool

/* The keys a global is DECLARED with -- `var CAN={ kb:'plus', ... }` -- which
   is how a table like CAN is read everywhere (`can('kb')`) and never written
   as `CAN.kb`. Brace-counted from the declaration, top level only. */
const KEYS = new Map()
function keysOf(g) {
  if (KEYS.has(g)) return KEYS.get(g)
  const out = new Set()
  const m = new RegExp('\\bvar\\s+' + g + '\\s*=\\s*\\{').exec(codeText)
  if (m) {
    let depth = 0, i = m.index + m[0].length - 1, start = i
    for (; i < codeText.length; i++) {
      const c = codeText[i]
      if (c === '{') depth++
      else if (c === '}' && --depth === 0) break
    }
    const body = codeText.slice(start + 1, i)
    let d = 0, top = ''
    for (const c of body) { if (c === '{' || c === '[') d++; else if (c === '}' || c === ']') d--; else if (d === 0) top += c }
    for (const k of top.matchAll(/(?:^|[,\s])['"]?([A-Za-z_$][\w$]*)['"]?\s*:/g)) out.add(k[1])
  }
  KEYS.set(g, out)
  return out
}
const HEX = /^[0-9a-f]{7,40}$/
const allTracked = new Set(execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean))
const baseNames = new Set([...allTracked].map((f) => f.split('/').pop()))
const scripts = Object.keys(JSON.parse(read('package.json') || '{}').scripts || {})
const NUMW = 'six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|(?:twenty|thirty|forty|fifty|sixty)(?:-[a-z]+)?'
const COUNT = [
  new RegExp('\\b(\\d+|' + NUMW + ')\\s+(?:fast |slow |browser )?checks\\b', 'gi'),
  new RegExp('\\bthe (?:fast|slow) (' + NUMW + '|\\d+)\\b', 'gi'),
  /(?:ゲート|検査|チェック)[はがをの]?\s*(\d+)\s*本/g,
  /(\d+)\s*本の(?:検査|チェック)/g,
]
let namesSeen = 0, fileRefs = 0, checkRefs = 0, npmRefs = 0
/* `--keys` prints the baseline line each failure would need, and nothing
   else -- for writing down what was already lost the day a surface is
   counted, never for waving a new one through. */
const KEYS_ONLY = process.argv.indexOf('--keys') >= 0
const say = (key, at, msg) => { if (forgiven(key)) return; if (KEYS_ONLY) console.log(key); else note(`${at} ${msg}`) }
const fileOf = (t) => {
  if (/:\/\/|^[\w-]+\.(?:com|org|net|io)\//.test(t)) return null
  /* A shell script is named with its path (`tools/pre-commit`); a bare `x.sh`
     is a field -- `lt.sh`, a letter's shape -- and not a file. */
  const m = t.match(/^(?:[\w.-]*\/)*([\w.-]+\.(?:js|mjs|swift|sql|json|ya?ml|html|plist|txt))(?:[:#].*)?$/)
  return m ? m[1] : null
}
for (const d of live) {
  const src = read(d)
  const at = (i) => `${d}:${lineOf(src, i)}`
  /* A strike covers everything inside it: ~~`wSetFil` / `wSetSort`~~ is two
     names that went, not one that went and one standing. */
  const strikes = [...src.matchAll(/~~[^~\n]+~~/g)].map((x) => [x.index, x.index + x[0].length])
  const inStrike = (i) => strikes.some(([a, b]) => i > a && i < b)
  for (const m of src.matchAll(/(~~)?`([^`\n]+)`/g)) {
    /* Struck directly is a claim that the name went, and is held both ways.
       Inside a wider strike -- a finished BACKLOG heading -- it is only not
       asked. */
    const direct = !!m[1], gone = direct || inStrike(m.index), t = m[2]
    const f = fileOf(t)
    if (f) {
      fileRefs++
      if (NOT_OURS.indexOf(f) >= 0) { notOursSeen.add(f); continue }
      if (gone) continue
      if (!baseNames.has(f)) say(`file ${d} ${f}`, at(m.index), `names the file ${f} and git has no such file.\n` +
        `      Name what holds that now, or strike it: ~~\`${t}\`~~.`)
      continue
    }
    const nm = t.match(/^\.?([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)$/)
    if (!nm) continue
    // a document is surface 2's; a placeholder is assets-check's
    if (/\.md$/.test(nm[1]) || /^__\w+__$/.test(nm[1]) || /XXXX/.test(nm[1])) continue
    const segs = nm[1].split('.')
    if (HEX.test(segs[0]) && /\d/.test(segs[0])) continue
    namesSeen++
    if (NOT_OURS.indexOf(nm[1]) >= 0 || NOT_OURS.indexOf(segs[0]) >= 0) { notOursSeen.add(NOT_OURS.indexOf(nm[1]) >= 0 ? nm[1] : segs[0]); continue }
    /* A prefix -- `DOC_`, `ICON_` -- names a family, and is there when one of
       the family is. */
    if (/_$/.test(nm[1]) && segs.length === 1) {
      let any = false
      for (const w of words) if (w.startsWith(nm[1]) && w !== nm[1]) { any = true; break }
      if (gone || any) continue
      say(`name ${d} ${nm[1]}`, at(m.index), `names the prefix ${nm[1]} and no name in the code starts with it.`)
      continue
    }
    if (gone) {
      if (direct && segs.length === 1 && declared.has(segs[0])) say(`struck ${d} ${segs[0]}`, at(m.index),
        `strikes ${segs[0]} through as gone, and the code declares it.\n` +
        `      Say what it does now, without the strike.`)
      continue
    }
    /* A field of one of the app's globals -- `SET.wsys`, `CAN.data`, `ME.fo` --
       is asked as it is written: the global, a dot, the field. Every segment
       being a word somewhere is true of `SET.order` long after the order moved
       to `STG`, which is how that sentence stood. A field of a row or an
       object in lower case (`post.ink`) is a word, and asked as one. */
    const G = /^[A-Z][A-Z0-9_]*$/.test(segs[0]) && segs.length > 1
    if (G && keysOf(segs[0]).has(segs[1])) continue
    const esc = (x) => x.replace(/[$]/g, '\\$')
    if (G ? new RegExp('(?:^|[^\\w$])' + esc(segs[0]) + '(?:\\.' + esc(segs[1]) + '(?![\\w$])|\\[\\s*[\'"]' + esc(segs[1]) + '[\'"])').test(codeText)
          : segs.every((x) => words.has(x))) continue
    say(`name ${d} ${nm[1]}`, at(m.index), `names ${nm[1]} and the code (comments taken out) has no such word.\n` +
      `      A name that went is a sentence that stopped being true that day. Say\n` +
      `      what does it now, or strike it: ~~\`${t}\`~~. A word that is not a name\n` +
      `      at all -- an example, a sound -- is not code, and is not in backticks.`)
  }
  for (const m of src.matchAll(/(~~`?)?\b([a-z][a-z0-9]*(?:-[a-z0-9]+)*-check)\b/g)) {
    const c = m[2]
    if (ENGLISH_CHECK.indexOf(c) >= 0) continue
    checkRefs++
    const has = allTracked.has(`tools/${c}.mjs`) || allTracked.has(`tools/${c.replace(/-check$/, '')}.mjs`)
    if (m[1] || inStrike(m.index)) continue
    if (!has) say(`check ${d} ${c}`, at(m.index), `names the check ${c} and tools/ has no such check.\n` +
      `      Name the check that holds it now, or strike it: ~~${c}~~.`)
  }
  for (const m of src.matchAll(/(~~`?)?npm run ([a-z][\w:-]*)/g)) {
    npmRefs++
    if (m[1] || scripts.indexOf(m[2]) >= 0) continue
    say(`npm ${d} ${m[2]}`, at(m.index), `says \`npm run ${m[2]}\` and package.json has no such script.`)
  }
  for (const re of COUNT) {
    for (const m of src.matchAll(re)) {
      if (/^\d+$/.test(m[1]) && +m[1] < 6) continue
      say(`count ${d} ${m[0].replace(/\s+/g, ' ')}`, at(m.index), `says "${m[0]}". How many checks the gate has is\n` +
        `      the last line \`npm test\` prints (FAST.length + SLOW.length in\n` +
        `      tools/gate.mjs). A number copied from there has already moved:\n` +
        `      say where to read it instead.`)
    }
  }
}
for (const n of NOT_OURS) {
  if (!/\./.test(n) && words.has(n)) note(`NOT_OURS in tools/docs-check.mjs names ${n}, and the code has it now --\n` +
    `      take it off the list, so a sentence about it is held.`)
  else if (!notOursSeen.has(n)) note(`NOT_OURS in tools/docs-check.mjs names ${n}, and no document names it any more --\n` +
    `      take it off the list. An exemption nothing uses is a hole.`)
}

/* The decision log's dates. */
const LOG = read('docs/FEATURE_RULES.md')
const logDates = new Set((LOG.match(/^(?:### .*|- Date:.*)$/gm) || []).join('\n').match(/20\d\d-\d\d-\d\d/g) || [])
const ownerDates = new Map()
for (const f of codeFiles.filter((x) => /\.(m?js|swift|sql|html)$/.test(x))) {
  for (const m of read(f).matchAll(/OWNER(?: DECISION)?,? (20\d\d-\d\d-\d\d)/g)) {
    if (!ownerDates.has(m[1])) ownerDates.set(m[1], f + ':' + lineOf(read(f), m.index))
  }
}
for (const [day, where] of ownerDates) {
  if (logDates.has(day)) continue
  say(`owner ${day}`, where, `quotes the owner on ${day}, and docs/FEATURE_RULES.md's decision log\n` +
    `      has no entry of that day. Write the decision down there.`)
}

/* 【差し替え済み】 keeps one line. */
let goneHeads = 0
{
  const lines = LOG.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (!/^### 【差し替え済み/.test(lines[i])) continue
    goneHeads++
    let body = 0, j = i + 1
    for (; j < lines.length && !/^#{1,3} /.test(lines[j]); j++) if (lines[j].trim()) body++
    if (body > 1) say(`gone docs/FEATURE_RULES.md ${lines[i].slice(4, 40)}`, `docs/FEATURE_RULES.md:${i + 1}`,
      `is marked 【差し替え済み】 and still carries ${body} lines under it.\n` +
      `      Keep one line naming what replaced it and delete the rest --\n` +
      `      印を付けて本文を残すのも残したことになる (decision log 2026-09-03).`)
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

if (KEYS_ONLY) process.exit(0)

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
console.log(
  `docs: ${namesSeen} names, ${fileRefs} code files, ${checkRefs} checks and ${npmRefs} npm scripts named, ` +
    `every one the code has; no sentence counts the gate; ${ownerDates.size} OWNER dates in comments, ` +
    `every one in the decision log; ${goneHeads} 【差し替え済み】 entries, one line each; ${NOT_OURS.length} not ours.`
)
