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
//      act-map.js names glyph.js's functions directly so it follows glyph.js;
//      and boot.js STARTS the app, so boot.js goes last. That last one is
//      what this file has always enforced -- the line below it used to say
//      glyph.js goes last, which stopped being true when boot.js was split
//      out, and the check went on testing boot.js while its own comment and
//      its own final line said something else.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, relative, posix } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '')
const WWW = join(ROOT, 'www')
const INDEX = join(WWW, 'index.html')

const problems = []
let swiftCount = 0
let privCount = 0
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
  /* A SCRIPT is not "named". The paragraph above says so already -- a script
     is loaded by index.html and nothing else can load one -- and for a long
     time the code below did not do what that paragraph said: it matched the
     file name anywhere in the concatenated source of every .js, COMMENTS
     INCLUDED. So `www/foo.js` passed on the strength of another file's
     comment mentioning it, while no <script> tag loaded it. That is the exact
     blank screen this whole check was written after, arriving through the
     check instead of past it, and it was found for real: `lexicon.js` was
     hidden by the words "lexicon.js が..." in `model.js`'s comment.

     A comment is not a loader. For a .js the only reference that counts is a
     tag in index.html, which is what `refSet` holds. `named()` is for
     everything ELSE -- the photograph in the keyboard's help sheet -- which
     genuinely is reached by the code that shows it. */
  if (rel.endsWith('.js')) return false
  const leaf = rel.split('/').pop()
  return src.indexOf(rel) >= 0 || src.indexOf(leaf) >= 0
}
for (const abs of walk(WWW)) {
  const rel = relative(WWW, abs).split('\\').join('/')
  if (rel === 'index.html') continue
  if (!refSet.has(rel) && !named(rel)) {
    note(
      rel.endsWith('.js')
        ? `www/${rel} exists and no <script> in index.html loads it.\n` +
            `      A .js is loaded by index.html or it does not run at all --\n` +
            `      being mentioned in another file's comment is not loading it.\n` +
            `      Either add the tag, or delete the file.`
        : `www/${rel} exists but nothing in index.html or www/*.js names it.\n` +
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

/* Every script under grammar-engine/ except model.js reads LinguaGrammarEngine
   at load time and throws without it, so model.js goes before all of them. A
   throw in one script does not stop the ones after it, so the app opens, every
   screen is right, every other check is green, and the engine is simply half
   there. Nothing would say so. */
const gmodel = at('grammar-engine/model.js')
for (const rel of referenced) {
  if (rel.indexOf('grammar-engine/') !== 0 || rel === 'grammar-engine/model.js') continue
  if (gmodel !== -1 && at(rel) < gmodel) {
    note(
      rel + ' loads before grammar-engine/model.js.\n' +
        '      It reads LinguaGrammarEngine at load time and throws without it, and\n' +
        '      a throw there stops nothing else: the app opens with half an engine.'
    )
  }
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

  // -------------------------------------------- the one Apple asks for by email
  // A privacy manifest is a RESOURCE, not a source file, so it goes in the
  // Resources phase and the rule above cannot see it. Both halves are asked,
  // because each fails on its own:
  //
  //   THERE IS ONE. Without it the upload SUCCEEDS, the workflow goes green,
  //   and an hour later Apple sends ITMS-91053 -- the same shape as build 86's
  //   ITMS-90158, and the only class of failure that never arrives as a red
  //   tick. It is needed because @capgo/capacitor-social-login is compiled in,
  //   its AppleProvider.swift uses UserDefaults.standard, and that pod ships
  //   no manifest of its own for the declaration to live in.
  //
  //   AND IT IS IN THE PHASE. A file on disk, tracked by git, and in no
  //   target's Resources phase is not in the app -- and nothing says so. That
  //   is exactly what happened to Compose.swift on the Sources side.
  const priv = []
  const walkPriv = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'Pods' || e.name === 'public' || e.name === 'build') continue
      const f = join(dir, e.name)
      if (e.isDirectory()) walkPriv(f)
      else if (e.name.endsWith('.xcprivacy')) priv.push(e.name)
    }
  }
  walkPriv(IOS)
  if (!priv.length) {
    problems.push('there is no .xcprivacy anywhere under ios/App/. The app links a pod that uses UserDefaults and ships no manifest of its own, so the declaration has to be the app\u2019s: Apple refuses the delivery by EMAIL (ITMS-91053) after the upload has already gone green.')
  }
  const ra = all.indexOf('/* Begin PBXResourcesBuildPhase section */')
  const rb = all.indexOf('/* End PBXResourcesBuildPhase section */')
  const res = (ra >= 0 && rb > ra) ? all.slice(ra, rb) : ''
  for (const f of priv) {
    if (res.indexOf(`${f} in Resources`) === -1) {
      problems.push(`${f} is not in any target\u2019s Resources phase \u2014 it is on disk and not in the app, and nothing about the build will say so.`)
    }
  }
  if (!problems.length) privCount = priv.length
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

// AND EVERY NATIVE METHOD IS ONE THE APP ACTUALLY CALLS.
//
// dead-check asks this of every function in www/ and nothing had ever asked it
// of the other side of the bridge. Three were sitting in LinguaShare.swift on
// 2026-09-03 that no line of www/ names -- `dropKept` and `dropAll`, both left
// behind when deleting stopped taking the whole phone, and `registerFont`.
//
// A native method nobody calls is worse than a dead JavaScript function: it is
// compiled, it is in the plugin's table, and it does the thing it was written
// to do the moment anybody names it -- and two of these three EMPTY DIRECTORIES.
// 「古いものは消す新しいものにする」 OWNER 2026-09-03.
//
// The bridge is one shape and only one: Capacitor.nativePromise('Plugin',
// 'method', …) -- www/ has no bundler, so `Capacitor.Plugins` is undefined and
// there is no second way to reach these (docs/keyboard-extension.md). So the
// method name appears in www/ as a quoted string, and that is what is counted.
const NATIVE = /CAPPluginMethod\(name:\s*"([A-Za-z0-9_]+)"/g
const wwwSrc = referenced
  .filter((r) => r.endsWith('.js'))
  .map((r) => { try { return readFileSync(join(WWW, r), 'utf8') } catch (e) { return '' } })
  .join('\n')
let nm, natives = 0
for (const e of readdirSync(join(IOS, "App"), { withFileTypes: true })) {
  if (!e.isFile() || !e.name.endsWith('.swift')) continue
  const sw = readFileSync(join(IOS, "App", e.name), "utf8")
  NATIVE.lastIndex = 0
  while ((nm = NATIVE.exec(sw))) {
    natives++
    const q = nm[1]
    if (wwwSrc.indexOf(`'${q}'`) < 0 && wwwSrc.indexOf(`"${q}"`) < 0)
      note(`ios/App/App/${e.name}: the native method \`${q}\` is in the plugin's ` +
           `table and no line of www/ names it. Delete it -- git remembers, and ` +
           `a method that is still compiled is one anybody can call.`)
  }
}

/* ---------------------------------------------------- the checks are wired up
   Same statement as the two above, one wall further out: a name that points
   at a file which is not there. `npm run ask` named tools/ask-check.mjs for
   the whole of the time between the AI chapter being taken out (b800697,
   which deleted the file) and this line -- and CLAUDE.md listed it among the
   checks a session may run, so the one thing that would have caught it was
   somebody typing it. Nothing throws until then: `npm run ask` fails with
   MODULE_NOT_FOUND, which reads exactly like a broken machine.

   Both directions, because both have already happened: a script naming a
   tool that is gone, and a tool in the gate that has no way to be run on its
   own -- which is what CLAUDE.md tells a session to do after a change. */
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
const scripts = pkg.scripts || {}
let wired = 0
for (const [name, cmd] of Object.entries(scripts)) {
  const m = /tools\/([\w.-]+\.mjs)/.exec(cmd)
  if (!m) continue
  wired++
  if (!existsSync(join(ROOT, 'tools', m[1])))
    note(`package.json: \`npm run ${name}\` runs tools/${m[1]}, which is not there. ` +
         `Take the script out -- git remembers, and a name pointing at nothing ` +
         `is read as a check somebody could run.`)
}
const gateSrc = readFileSync(join(ROOT, 'tools', 'gate.mjs'), 'utf8')
const gateNames = [...gateSrc.matchAll(/const (?:FAST|SLOW) = \[([\s\S]*?)\]/g)]
  .flatMap((g) => [...g[1].matchAll(/'([\w.-]+)'/g)].map((x) => x[1]))
for (const n of gateNames) {
  if (!existsSync(join(ROOT, 'tools', n + '.mjs')))
    note(`tools/gate.mjs runs \`${n}\`, and tools/${n}.mjs is not there.`)
  else if (!Object.values(scripts).some((c) => c.indexOf('tools/' + n + '.mjs') >= 0))
    note(`tools/${n}.mjs is in the gate and no npm script runs it on its own. ` +
         `CLAUDE.md tells a session to run the ONE check that holds a change; ` +
         `this one has no name to run it by.`)
}

if (problems.length) {
  console.error('')
  for (const p of problems) console.error(`  ${p}`)
  console.error('')
  console.error(`assets: ${problems.length} problem${problems.length === 1 ? '' : 's'}.`)
  process.exit(1)
}

console.log(`assets: ${referenced.length} files loaded by index.html, all present and tracked.`)
if (swiftCount) console.log(`swift: ${swiftCount} files under ios/App/, every one of them in the project's Sources phase.`)
if (privCount) console.log(`privacy: ${privCount} manifest${privCount === 1 ? '' : 's'} under ios/App/, every one of them in a Resources phase.`)
console.log(`placeholders: ${holes} under ios/App/, every one of them substituted by the deploy workflow.`)
console.log(`the bridge: ${natives} native methods, every one of them named by www/.`)
console.log(`load order: core.js -> ${LANGS.length} languages -> ... -> otf5.js -> glyph.js -> act-map.js -> boot.js (last)`)
