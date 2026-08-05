/* ---------------------------------------------------------------------------
   tools/dead-check.mjs — a function nothing reaches, and a name nothing is.

   Run it:   node tools/dead-check.mjs

   tools/act-check.mjs already refuses an entry in the action table that no
   screen ever names, on the grounds that it is a button which used to exist.
   This is the same rule one step further out: a *function* nothing calls.

   The two are not the same check, and the gap between them is where 26 of
   these were found. clearCh(lid) was the clearest of them — it cleared the
   character on a letter, it read exactly like a working feature, and the
   button that used to press it had been replaced by setCh(lid, ""). It was
   not in the action table, so act-check could not see it. Nothing called it,
   so nothing failed. It would have sat there being read, maintained, and
   translated around forever.

   What it checks
     every function declared in www/ is named somewhere other than its own
     declaration — by the app, by index.html, by one of the ten languages, or
     by a tool. Anything else is deleted, not kept "just in case": git has it.

   Comments and the insides of strings do not count as a mention. A name that
   survives only in a comment describing what used to happen is precisely the
   thing being looked for, and a name that survives only inside a string is
   not a call — www/act-map.js binds the function itself, `act('go', go)`, so
   every live name is there as an identifier too.

   What it cannot see, so that nobody mistakes silence for safety:
     - a function called only through a computed name, window[x](). The tools
       reach the views that way, but render() also calls each by name, so
       they are covered. Something reached ONLY that way would look dead here
     - a function that is called, from another function that is itself dead.
       Delete the outer one and the inner turns up on the next run
     - anything outside www/. The tools are read for mentions, never judged
     - a file with its own variable or parameter of that name is skipped for
       that name, so a genuine call sitting in the same file as an unrelated
       thing of that name is not counted. It errs towards calling something
       dead, which is the way round that gets looked at

   The other direction
     A name that is called has to be something. This check proved that every
     function declared is reached and said nothing at all about whether a name
     being called exists, which is how wsGuess() shipped a call to wsCut() --
     a function that was never written. Nothing caught it: act-check proves
     both directions for the names a button says, but a plain call is not a
     button, and press-check only runs the paths it walks. That one ran when
     SET.wsys was empty, and the fixture fills it in, so the single path that
     would have thrown was the single path nothing took.

     Every name called in www/ must be a function declared in www/, a variable
     or parameter bound there, something index.html defines, or one of the
     browser's, which are listed below by name. There were fourteen such names
     when this was written and thirteen were the browser's, so the list stays
     short enough to read.

   Exit code is 0 only when nothing is unreachable and every name resolves.
   --------------------------------------------------------------------------- */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const WWW = path.join(ROOT, 'www');

/* Blank out comments and the insides of strings, keeping the newlines so a
   line number still means what it says. */
function bare(s){
  let out = '', i = 0, prev = '';
  const AFTER_VALUE = /[A-Za-z0-9_$)\]]$/;
  while (i < s.length){
    const c = s[i], d = s[i + 1];
    if (c === '/' && d === '/'){ while (i < s.length && s[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*'){
      i += 2;
      while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')){ if (s[i] === '\n') out += '\n'; i++; }
      i += 2; continue;
    }
    if (c === '"' || c === "'" || c === '`'){
      i++;
      while (i < s.length && s[i] !== c){
        if (s[i] === '\\'){ i += 2; continue; }
        if (s[i] === '\n') out += '\n';
        i++;
      }
      i++; out += '""'; prev = '"'; continue;
    }
    /* a regex literal can hold anything at all; skip its body */
    if (c === '/' && !AFTER_VALUE.test(prev.replace(/\s+$/, ''))){
      i++;
      let cls = false;
      while (i < s.length){
        if (s[i] === '\\'){ i += 2; continue; }
        if (s[i] === '[') cls = true;
        else if (s[i] === ']') cls = false;
        else if (s[i] === '/' && !cls) break;
        else if (s[i] === '\n') break;
        i++;
      }
      /* Consume the closing slash, never the newline: a division mistaken for
         a regex would otherwise swallow the line break and every declaration
         below it would stop being at the start of a line. */
      if (s[i] === '/') i++;
      out += ' '; continue;
    }
    out += c;
    if (c.trim() !== '') prev += c;
    if (c === '\n') prev = '';
    i++;
  }
  return out;
}

const jsIn = (dir) => fs.readdirSync(dir)
  .filter(f => f.endsWith('.js') && !f.startsWith('_'))
  .map(f => path.join(dir, f));

const appFiles = jsIn(WWW);
/* Everywhere a mention counts from: the app itself, the page that loads it,
   the ten languages, and every tool. */
const mentionFiles = appFiles
  .concat(jsIn(path.join(WWW, 'i18n')))
  .concat([path.join(WWW, 'index.html')])
  .concat(fs.readdirSync(path.join(ROOT, 'tools'))
    .filter(f => f.endsWith('.mjs'))
    .map(f => path.join(ROOT, 'tools', f)));

const decls = [];
appFiles.forEach(f => {
  const src = bare(fs.readFileSync(f, 'utf8'));
  src.split('\n').forEach((line, i) => {
    const m = /^function\s+([A-Za-z_$][\w$]*)\s*\(/.exec(line);
    if (m) decls.push({ name: m[1], file: path.relative(ROOT, f), line: i + 1 });
  });
});

/* What follows the name decides whether it is a mention of the function or a
   different thing wearing the same word. `pv:` is a key in a table of scripts;
   `pv=prevPage()` is somebody's local variable in another file. Neither reaches
   function pv(), and counting them kept a dead one alive through the first
   version of this check. Ruling out what cannot be a mention was not enough:
   the same local variable is also read as `pv?` and `pv.r`, and neither of
   those is a `:` or an `=`.

   So this asks what a function is actually used as, rather than what it is
   not. A function is called -- `pv(` -- or handed over as a value, which in
   this app means `act('go', go)` and `gbtn(geUndo, …)`: the name against a
   bracket, a comma or a semicolon. A local variable being read for one of its
   fields never looks like that.

   That still leaves esc(pv), where somebody's local variable is handed to a
   function and looks exactly like a function handed to a function. Nothing in
   the shape of the text can tell those apart, so the last rule is about scope
   rather than shape: a file with its own thing of that name -- assigned to, or
   taken as an argument -- is not talking about the global one in any of its
   mentions. A parameter list is what caught the last of these: the Portuguese
   respelling engine takes `function sylp_pt(p, pv, st)`, and `pv,` in a list
   of parameters is the same handful of characters as `pv,` in a list of
   arguments. */
const USE = '(?![\\w$])\\s*[(),;]';
const bared = new Map(mentionFiles.map(f => [path.relative(ROOT, f), bare(fs.readFileSync(f, 'utf8'))]));
/* Everything here shares one global scope, so two files may not declare the
   same function: the one loaded later silently replaces the other, and the
   replaced one goes on sitting in its file looking like the code that runs.
   ltkHTML was declared in home.js and in wordsheet.js. wordsheet.js loads
   second, so the find screen -- which home.js builds -- had been drawing its
   letters with the word sheet's version for as long as both existed: the
   caption showed what a letter reads instead of what it is called, letters
   with no drawn shape got the class that means "has one", and a letter that
   reads nothing yet came out as a button with no text in it at all, which a
   screen reader announces as nothing.

   Nothing could see it. Both were reached, so this check was happy; both were
   in no action table, so act-check was happy; the screen rendered and its
   buttons worked, so press-check was happy. */
const byName = new Map();
decls.forEach(d => {
  if (!byName.has(d.name)) byName.set(d.name, []);
  byName.get(d.name).push(d);
});
const twice = [...byName.values()].filter(v => v.length > 1);
if (twice.length){
  console.error(twice.length + ' function' + (twice.length === 1 ? ' is' : 's are') +
                ' declared in more than one file:\n');
  twice.forEach(v => {
    console.error('  ' + v[0].name);
    v.forEach(d => console.error('      ' + d.file + ':' + d.line));
    console.error('      the last one loaded is the one that runs; the rest are ' +
                  'read as if they were.\n');
  });
  process.exit(1);
}

/* ---- the other direction: a name that is called has to be something -----
   The browser's, named rather than pattern-matched, because a pattern would
   quietly forgive a typo that happens to look like a global. */
const BROWSER = ['Date','String','Number','Boolean','Object','Array','Math','JSON',
  'RegExp','Error','Function','Uint8Array','Blob','Image','Path2D',
  'parseInt','parseFloat','isNaN','isFinite','encodeURIComponent','decodeURIComponent',
  'setTimeout','clearTimeout','setInterval','clearInterval',
  'requestAnimationFrame','cancelAnimationFrame',
  'getComputedStyle','confirm','alert','prompt','eval'];

const bindings = new Set(decls.map(d => d.name));
const calls = new Map();
appFiles.concat([path.join(WWW, 'index.html')]).forEach(f => {
  const src = bare(fs.readFileSync(f, 'utf8'));
  const rel = path.relative(ROOT, f);
  /* A function declared anywhere, not only at the start of a line. The dead
     check above deliberately looks only at column zero -- a nested helper is
     reached by the function around it and is not the thing it is hunting --
     but for resolving a call, an inner function is a perfectly good answer.
     Reading only the outer ones made otf5.js look like thirty missing
     names. */
  [...src.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].forEach(m =>
    bindings.add(m[1]));
  /* everything else a name can be */
  [...src.matchAll(/\bvar\s+([^;]+)/g)].forEach(m =>
    m[1].split(',').forEach(part => {
      const n = part.trim().split(/[=\s[(]/)[0];
      if (/^[A-Za-z_$][\w$]*$/.test(n)) bindings.add(n);
    }));
  [...src.matchAll(/\bfunction\s*[\w$]*\s*\(([^)]*)\)/g)].forEach(m =>
    m[1].split(',').forEach(pp => {
      const n = pp.trim();
      if (/^[A-Za-z_$][\w$]*$/.test(n)) bindings.add(n);
    }));
  [...src.matchAll(/\bcatch\s*\(\s*([\w$]+)/g)].forEach(m => bindings.add(m[1]));
  /* a global put on window by hand. index.html defines splashDone that way,
     and boot.js calls it: the two files are one program even though only one
     of them is JavaScript as far as this walk is concerned. */
  [...src.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=/g)].forEach(m => bindings.add(m[1]));
  if (f.endsWith('.js'))
    [...src.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(/g)].forEach(m => {
      if (!calls.has(m[1])) calls.set(m[1], rel);
    });
});
const KEYWORD = new Set(['if','for','while','switch','catch','function','return','typeof',
  'new','delete','void','do','else','in','of','instanceof','var','try','throw','case']);
const unresolved = [...calls].filter(([n]) =>
  !bindings.has(n) && !KEYWORD.has(n) && BROWSER.indexOf(n) < 0);

const dead = decls.filter(d => {
  const use = new RegExp('(?<![\\w$.])' + d.name + USE, 'g');
  const own = new RegExp('(?<![\\w$.])' + d.name + '\\s*=(?!=)');
  const arg = new RegExp('function\\s*[\\w$]*\\s*\\([^)]*(?<![\\w$.])' + d.name + '(?![\\w$])[^)]*\\)');
  let n = 0;
  bared.forEach((src, rel) => {
    if (rel !== d.file && (own.test(src) || arg.test(src))) return;   /* shadowed there */
    n += (src.match(use) || []).length;
  });
  return n <= 1;   /* its own declaration */
});

if (unresolved.length){
  console.error(unresolved.length + ' name' + (unresolved.length === 1 ? ' is' : 's are') +
                ' called and never defined:\n');
  unresolved.forEach(([n, f]) => console.error('  ' + f + '  ' + n + '()'));
  console.error('\nEither it was never written, or it is the browser\'s and belongs in\n' +
                'BROWSER at the top of this file, by name, with the others.');
  process.exit(1);
}
if (dead.length){
  console.error(dead.length + ' function' + (dead.length === 1 ? '' : 's') +
                ' nothing reaches:\n');
  dead.forEach(d => console.error('  ' + d.file + ':' + d.line + '  ' + d.name));
  console.error('\nDelete them. git remembers, and a reader of this code cannot ' +
                'tell\nthem apart from the ones that still do something.');
  process.exit(1);
}
console.log('dead code: ' + decls.length + ' functions in www/, every one of them reached,');
console.log('           and every name called is one of them, a binding, or the browser\'s.');
