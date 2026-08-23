// Refuse a commit that would ship an index.html pointing at files that are
// not there.
//
// This check exists because of a real blank screen. www/index.html was split
// into seventeen <script src> files, and the commit that landed the split was
// made with `git commit -a`. That stages tracked files only, so index.html
// went up gutted while the seventeen files it now depends on stayed behind as
// untracked files on one machine. Every script tag 404'd. The app opened to
// white. es5-check passed, i18n-check passed, the build was green, and none of
// it meant anything, because all three ran against a working directory that
// had the files.
//
// So this does not ask "is the file on disk". It asks "is the file in the
// commit". Those are the same question everywhere except the one place it
// matters.
//
//   node tools/assets-check.mjs
//
// Three things are checked:
//
//   1. Every local file index.html references exists AND is tracked by git.
//   2. Every file under www/ is referenced by index.html. A script file nobody
//      loads is a feature that silently does nothing — the same blank screen,
//      one screen down. It asked that of .js only, and www/ is not a source
//      directory: `npx cap copy` puts the whole of it inside the app, so two
//      old versions kept as _v1-notebook.html.bak and _v2-paper.html.bak — 52
//      KB of a program nothing runs — were being carried onto every phone.
//   3. The load order still holds. core.js defines defLang() so it precedes
//      the ten languages; otf5.js defines LinguaFont so it precedes glyph.js;
//      glyph.js ends with installScriptFont() and render(), so the app starts
//      on its last two lines and it goes last.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, relative, posix } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '')
const WWW = join(ROOT, 'www')
const INDEX = join(WWW, 'index.html')

const problems = []
let swiftCount = 0
const note = (m) => problems.push(m)

// ---------------------------------------------------------------- git index

// Paths git has in the index, as posix paths relative to the repo root. When
// this is not a git checkout (a tarball, a sandbox) the tracked check is
// skipped rather than failed — the on-disk check still runs.
let tracked = null
try {
  const out = execFileSync('git', ['ls-files', '-z', '--', 'www'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  tracked = new Set(out.split('\0').filter(Boolean))
} catch {
  tracked = null
}

// ------------------------------------------------------- what index.html asks for

const html = readFileSync(INDEX, 'utf8')

const referenced = []
const RE = /<(?:script[^>]*?\ssrc|link[^>]*?\shref)\s*=\s*["']([^"']+)["']/gi
let m
while ((m = RE.exec(html)) !== null) {
  const href = m[1].trim()
  // Anything not served out of www/ is somebody else's problem.
  if (/^(?:[a-z]+:)?\/\//i.test(href)) continue
  if (/^(?:data|mailto|tel|blob):/i.test(href)) continue
  if (href.startsWith('#')) continue
  referenced.push(href.replace(/^\.\//, '').split(/[?#]/)[0])
}

if (referenced.length === 0) {
  note('index.html references no local files at all. That cannot be right.')
}

for (const href of referenced) {
  const abs = join(WWW, href)
  const rel = posix.join('www', href)

  if (!existsSync(abs)) {
    note(`index.html loads "${href}" and there is no such file.`)
    continue
  }
  if (tracked && !tracked.has(rel)) {
    note(
      `index.html loads "${href}". The file is on this machine but it is NOT\n` +
        `      in git. It will 404 for everyone else and the app will open to a\n` +
        `      white screen. Run:  git add ${rel}`
    )
  }
}

// ------------------------------------------------- what www/ has that nobody loads

const walk = (dir) => {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

const refSet = new Set(referenced)
/* A script is loaded by index.html and nothing else can load one, which is
   why the list above is that file alone. Everything ELSE -- a photograph in
   the keyboard's help sheet -- is named by the code that shows it, so the
   text of every .js counts as a reference too.

   Still one rule and not two: a file in www/ that nothing anywhere names is a
   file nobody can see, and that is the thing being checked. What changed is
   where the naming may be. */
const src = referenced
  .filter((r) => r.endsWith('.js'))
  .map((r) => { try { return readFileSync(join(WWW, r), 'utf8') } catch (e) { return '' } })
  .join('\n')
const named = (rel) => {
  const leaf = rel.split('/').pop()
  return src.indexOf(rel) >= 0 || src.indexOf(leaf) >= 0
}
for (const abs of walk(WWW)) {
  const rel = relative(WWW, abs).split('\\').join('/')
  if (rel === 'index.html') continue
  if (!refSet.has(rel) && !named(rel)) {
    note(
      `www/${rel} exists but nothing in index.html or www/*.js names it.\n` +
        `      Either reference it, or delete the file.`
    )
  }
}

// ------------------------------------------------------------- the load order

const at = (name) => referenced.indexOf(name)
const LANGS = ['en', 'es', 'pt', 'fr', 'de', 'it', 'ru', 'zh', 'ko', 'ja']

const core = at('core.js')
const otf5 = at('otf5.js')
const glyph = at('glyph.js')
const actjs = at('act.js')
const actmap = at('act-map.js')
const boot = at('boot.js')

if (core === -1) note('core.js is not loaded. It defines defLang().')
if (otf5 === -1) note('otf5.js is not loaded. It defines LinguaFont.')
if (glyph === -1) note('glyph.js is not loaded. Nothing can be drawn.')
if (actjs === -1) note('act.js is not loaded. No button would do anything.')
if (actmap === -1) note('act-map.js is not loaded. Every button would be a name with nothing behind it.')
if (boot === -1) note('boot.js is not loaded. The app never starts.')

for (const code of LANGS) {
  const i = at(`i18n/${code}.js`)
  if (i === -1) {
    note(`i18n/${code}.js is not loaded. The language picker will be missing it.`)
  } else if (core !== -1 && i < core) {
    note(`i18n/${code}.js loads before core.js, which defines the defLang() it calls.`)
  }
}

if (otf5 !== -1 && glyph !== -1 && otf5 > glyph) {
  note('otf5.js loads after glyph.js. glyph.js needs LinguaFont at load time.')
}

/* The app starts on the last line of boot.js, so boot.js goes last and the
   table of what buttons do goes immediately before it: act-map.js names every
   function directly, so every one of them has to exist by the time it runs. */
if (boot !== -1 && boot !== referenced.length - 1) {
  note(
    `boot.js is not the last script. It is what starts the app, so anything\n` +
      `      loaded after it has not registered itself yet when the first screen\n` +
      `      is drawn.`
  )
}
if (actmap !== -1 && boot !== -1 && actmap > boot) {
  note('act-map.js loads after boot.js, so the first screen would be drawn with no buttons wired.')
}
if (actmap !== -1 && glyph !== -1 && actmap < glyph) {
  note('act-map.js loads before glyph.js, which defines some of the functions it names.')
}
if (actjs !== -1 && actmap !== -1 && actjs > actmap) {
  note('act.js loads after act-map.js, which calls the act() it defines.')
}

// ---------------------------------------------------------------- the Swift
// Same statement, on the other side of the wall. Every .swift under ios/App/
// must be in the Xcode project's Sources phase, because Xcode compiles what
// the project file lists and NOTHING ELSE -- a file that is on disk, tracked
// by git, imported by name and simply not listed is invisible to the
// compiler, and the error it produces names the type that could not be found
// rather than the file that was never built.
//
// Compose.swift and CandidateBar.swift shipped that way once. Two files
// written, committed, pushed, and left out of the pbxproj; the build failed
// on `cannot find 'Compose' in scope` and said nothing about why. index.html
// has been held to this rule from the beginning and the project file had
// nobody holding it.

const IOS = join(ROOT, 'ios', 'App')
const PBX = join(IOS, 'App.xcodeproj', 'project.pbxproj')
if (existsSync(PBX)) {
  // Only the Sources PHASE counts. A file can have a PBXBuildFile line and
  // still not be in any target's phase, which is a real state and looks
  // identical to being wired up if you grep the whole file -- the first
  // version of this check did exactly that and passed while the file was
  // unbuilt.
  const all = readFileSync(PBX, 'utf8')
  const a = all.indexOf('/* Begin PBXSourcesBuildPhase section */')
  const b = all.indexOf('/* End PBXSourcesBuildPhase section */')
  const pbx = (a >= 0 && b > a) ? all.slice(a, b) : ''
  const swift = []
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'Pods' || e.name === 'public' || e.name === 'build') continue
      const f = join(dir, e.name)
      if (e.isDirectory()) walk(f)
      else if (e.name.endsWith('.swift')) swift.push(e.name)
    }
  }
  walk(IOS)
  for (const f of swift) {
    if (pbx.indexOf(`${f} in Sources`) === -1) {
      problems.push(`${f} is not in the Xcode project's Sources phase — Xcode will not compile it, and the error will name a missing type rather than this file.`)
    }
  }
  if (!problems.length) swiftCount = swift.length
}

// -------------------------------------------------- a placeholder nobody fills
// A third statement of the same shape: something is written down as a stand-in
// and the thing that was supposed to replace it does not exist.
//
// `__APPLE_TEAM_ID__` sits in project.pbxproj on purpose -- the deploy
// workflow substitutes it before the build, so the repo never holds the team
// id. `__GOOGLE_REVERSED_CLIENT_ID__` sat in Info.plist looking exactly the
// same and NOTHING substituted it: Google's client had not been made yet, and
// the placeholder was standing in for a value that did not exist rather than
// for one the workflow would supply.
//
// Nothing on this side can tell those two apart by looking, and nothing threw.
// The app compiled, archived, exported, uploaded, and Apple refused the
// delivery by mail an hour later:
//
//   ITMS-90158: The following URL schemes found in your app are not in the
//   correct format: [__GOOGLE_REVERSED_CLIENT_ID__].
//
// That was build 86, and it is the only kind of failure in this repo that
// arrives as an email instead of a red tick.
//
// So: every `__NAME__` under ios/App/ must be a name the deploy workflow
// actually substitutes. The list is not restated here -- it is read off the
// workflow, so adding an injection there is the whole of adding one.
const WF = join(ROOT, '.github', 'workflows', 'ios-deploy.yml')
const wf = existsSync(WF) ? readFileSync(WF, 'utf8') : ''
let holes = 0
if (existsSync(IOS)) {
  const look = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'Pods' || e.name === 'public' || e.name === 'build') continue
      const f = join(dir, e.name)
      if (e.isDirectory()) { look(f); continue }
      if (!/\.(plist|entitlements|swift|pbxproj|xml|json)$/.test(e.name)) continue
      const txt = readFileSync(f, 'utf8')
      const seen = new Set()
      for (const m of txt.matchAll(/__[A-Z][A-Z0-9_]*__/g)) {
        if (seen.has(m[0])) continue
        seen.add(m[0])
        if (wf.indexOf(m[0]) === -1) {
          problems.push(`${f.slice(ROOT.length + 1)} carries ${m[0]}, and .github/workflows/ios-deploy.yml never substitutes it. A placeholder nobody fills ships as its own text — build 86 was refused by Apple for exactly this (ITMS-90158). Either wire the substitution into the workflow, or take the key out: an absent key is the honest shape of "not configured".`)
        } else holes++
      }
    }
  }
  look(IOS)
}

// ------------------------------------------------------------------- verdict

if (problems.length) {
  console.error('')
  for (const p of problems) console.error(`  ${p}`)
  console.error('')
  console.error(`assets: ${problems.length} problem${problems.length === 1 ? '' : 's'}.`)
  process.exit(1)
}

console.log(`assets: ${referenced.length} files loaded by index.html, all present and tracked.`)
if (swiftCount) console.log(`swift: ${swiftCount} files under ios/App/, every one of them in the project's Sources phase.`)
console.log(`placeholders: ${holes} under ios/App/, every one of them substituted by the deploy workflow.`)
console.log(`load order: core.js -> ${LANGS.length} languages -> ... -> otf5.js -> glyph.js (last)`)
