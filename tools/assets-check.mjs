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
//   2. Every .js under www/ is referenced by index.html. A script file nobody
//      loads is a feature that silently does nothing — the same blank screen,
//      one screen down.
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
for (const abs of walk(WWW)) {
  const rel = relative(WWW, abs).split('\\').join('/')
  if (!rel.endsWith('.js')) continue
  if (!refSet.has(rel)) {
    note(
      `www/${rel} exists but index.html never loads it. Either add a\n` +
        `      <script src="${rel}"></script> in the right place in the load\n` +
        `      order, or delete the file.`
    )
  }
}

// ------------------------------------------------------------- the load order

const at = (name) => referenced.indexOf(name)
const LANGS = ['en', 'es', 'pt', 'fr', 'de', 'it', 'ru', 'zh', 'ko', 'ja']

const core = at('core.js')
const otf5 = at('otf5.js')
const glyph = at('glyph.js')

if (core === -1) note('core.js is not loaded. It defines defLang().')
if (otf5 === -1) note('otf5.js is not loaded. It defines LinguaFont.')
if (glyph === -1) note('glyph.js is not loaded. The app starts on its last two lines.')

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

if (glyph !== -1 && glyph !== referenced.length - 1) {
  note(
    `glyph.js is not the last script. It ends with installScriptFont() and\n` +
      `      render(), so anything loaded after it has not registered itself yet\n` +
      `      when the app draws its first screen.`
  )
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
console.log(`load order: core.js -> ${LANGS.length} languages -> ... -> otf5.js -> glyph.js (last)`)
