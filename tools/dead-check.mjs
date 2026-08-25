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

   A top-level var, the same way
     OB_STEPS sat in www/onboard.js saying there were five steps to the
     onboarding while there were four, for as long as nothing read it -- the
     count is not derived from anything, it is a number somebody wrote down
     and then the app changed shape around. Nothing that reads var
     declarations existed to say so. A dead function is a call nobody makes;
     a dead top-level var is exactly the same shape of bug wearing the other
     keyword, and the fix is the same too: it is not read anywhere, so
     whatever it currently says cannot be checked against anything and
     cannot be trusted.

     Only a var at column zero -- one declared inside a function is that
     function's business, reached or not, the moment the function itself is
     reached. A file wrapped in `(function(){ ... })()` for a one-time
     migration is not at column zero either; nothing here walks into it. And
     files matching www/_*.bak do not count as declaring anything: they are
     old drafts index.html does not load, not the app.

     A function is dead when nothing calls it or hands it over as a value;
     a var can also be read, indexed, compared, concatenated -- anything a
     value can be done to -- so this counts any mention of its name at all,
     the same way the declaration line itself is one such mention. A name
     that turns up only where it was declared, and nowhere else in the app,
     index.html, the ten languages, or a tool, is exactly the OB_STEPS bug:
     nobody would notice if it said something else.

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

   And what money buys, which is the same sentence again
     CAN in www/core.js names every capability a plan opens; can('x') is the
     only way to ask, and has() is core.js's alone. A capability nothing asks
     for is a price with nothing behind it, and a can('x') that is in no plan
     answers false on every plan -- a locked door nobody can open, and nothing
     says so. Both are exactly rule 5 in a different shape, which is why they
     are held here rather than in a check of their own.

     They replaced twenty-three has('plus') calls across nine files that all
     looked identical and were asking nine different questions.

   Exit code is 0 only when nothing is unreachable, every name resolves, and
   every capability is both declared and asked for.
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

/* Every .js under a directory, however deep. It read the top level only, and
   `i18n` was added below by name -- so the day a chapter arrived in a folder of
   its own (www/grammar-engine/), this check simply stopped being about it. A
   made-up call put in one of those files exits 0; the same call in
   www/notes.js exits 1. A list of directories rots the same way, so it walks
   instead of naming. */
const jsIn = (dir, skip) => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap(e => e.isDirectory()
    ? ((skip || []).includes(e.name) ? [] : jsIn(path.join(dir, e.name), skip))
    : (e.name.endsWith('.js') && !e.name.startsWith('_') ? [path.join(dir, e.name)] : []));

/* i18n is a mention, not a declaration: those files are ten tables of strings
   and nothing is written in them. */
const appFiles = jsIn(WWW, ['i18n']);
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

/* Top-level vars, the same way: only `var` sitting at column zero, which a
   migration wrapped in `(function(){ ... })()` never reaches — that indents
   everything inside it, `var` included. A declaration can name more than one
   thing (`var LS_LANGS='lingua.langs', LS_CUR='lingua.cur';`) and its value
   can run past the line `var` sits on, so this reads to the closing `;`,
   wherever that is, and splits on the commas between declarators -- the same
   split the call-resolution walk below already does for a `var` anywhere,
   reused rather than written twice. A comma inside one declarator's own
   value (an object literal's fields) splits into pieces that are not bare
   identifiers, and those are dropped the same way there too. */
const varDecls = [];
appFiles.forEach(f => {
  const src = bare(fs.readFileSync(f, 'utf8'));
  const rel = path.relative(ROOT, f);
  [...src.matchAll(/^var\s+([^;]+);/gm)].forEach(m => {
    const line = src.slice(0, m.index).split('\n').length;
    m[1].split(',').forEach(part => {
      const n = part.trim().split(/[=\s[(]/)[0];
      if (/^[A-Za-z_$][\w$]*$/.test(n)) varDecls.push({ name: n, file: rel, line });
    });
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
  'RegExp','Error','Function','Uint8Array','Blob','File','FileReader','Image','Path2D',
  'parseInt','parseFloat','isNaN','isFinite','encodeURIComponent','decodeURIComponent',
  'setTimeout','clearTimeout','setInterval','clearInterval',
  'requestAnimationFrame','cancelAnimationFrame',
  /* The one way anything leaves this phone. fetch is newer and returns a
     Promise, which es5-check bans and an old WKWebView may not have. */
  'XMLHttpRequest',
  /* The voice on a post (rec.js). MediaRecorder is what records it and Audio
     is what plays one back -- and both are asked for by name before they are
     used, because an old WKWebView has neither. */
  'MediaRecorder','Audio',
  /* base64 to bytes, and back. Everything the phone holds a picture or a
     voice as is base64 -- a canvas gives a data URL and the recorder gives
     one -- and what goes to Storage is the bytes. */
  'atob','btoa',
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

/* A var is not called, so the call-shaped USE pattern above is the wrong
   question for one -- OB_STEPS is read as OB_STEPS.length, not OB_STEPS(.
   What counts here is any mention of the name at all, which is exactly what
   the declaration line itself is one of, so the same n<=1 threshold still
   means "nowhere but its own declaration". own/arg are reused unchanged: a
   file with its own local of that name, assigned or taken as a parameter,
   is talking about that local in every mention it makes, not about the
   global sitting in www/, the same shadowing rule the function check
   already answers to. */
const deadVars = varDecls.filter(d => {
  const use = new RegExp('(?<![\\w$.])' + d.name + '(?![\\w$])', 'g');
  const own = new RegExp('(?<![\\w$.])' + d.name + '\\s*=(?!=)');
  const arg = new RegExp('function\\s*[\\w$]*\\s*\\([^)]*(?<![\\w$.])' + d.name + '(?![\\w$])[^)]*\\)');
  let n = 0;
  bared.forEach((src, rel) => {
    if (rel !== d.file && (own.test(src) || arg.test(src))) return;   /* shadowed there */
    n += (src.match(use) || []).length;
  });
  return n <= 1;   /* its own declaration */
});

/* ---- and a var that is only ever written -------------------------------
   The check above asks whether a name is MENTIONED anywhere but its own
   declaration. An assignment is a mention, so a var written in six places and
   read in none passes it. A write-only global is usually not spare code -- it
   is a wire with one end unattached, and the missing end is the half a person
   would have noticed.

   A read is any mention that is not a write. `x.f=1` and `x[i]=1` are writes
   to something x holds and so are reads of x; `x+=1` reads it too, and none of
   the three look like `x =` with nothing between. A declaration carrying no
   value (`var tt;`) is neither, and is discounted. Shadowing is the same rule
   the two checks above answer to. */
const writeOnly = [];
varDecls.forEach(d => {
  if (deadVars.some(x => x.name === d.name && x.file === d.file)) return;   /* already reported */
  const esc = d.name.replace(/\$/g, '\\$');
  const use   = new RegExp('(?<![\\w$.])' + esc + '(?![\\w$])', 'g');
  const write = new RegExp('(?<![\\w$.])' + esc + '\\s*=(?!=)', 'g');
  const empty = new RegExp('\\bvar\\s+' + esc + '\\s*[;,]', 'g');
  const own = new RegExp('(?<![\\w$.])' + esc + '\\s*=(?!=)');
  const arg = new RegExp('function\\s*[\\w$]*\\s*\\([^)]*(?<![\\w$.])' + esc + '(?![\\w$])[^)]*\\)');
  let mentions = 0, writes = 0, bareDecls = 0;
  bared.forEach((src, rel) => {
    if (rel !== d.file && (own.test(src) || arg.test(src))) return;   /* shadowed there */
    mentions  += (src.match(use)   || []).length;
    writes    += (src.match(write) || []).length;
    bareDecls += (src.match(empty) || []).length;
  });
  if (mentions - writes - bareDecls <= 0) writeOnly.push(d);
});

/* ---- and a name that is assigned and was never declared ----------------
   The same sentence again, for the case where there is no declaration to
   find. `mkPos='n'` sat in viewReset() in www/shell.js with no `var` anywhere
   and nothing reading it: what was left of the make screen after the screen
   was deleted. Assigning to an undeclared name makes a global, silently, so
   nothing throws -- and with no declaration there was no row for either check
   above to be about. It catches a typo the same way: `wSrot='a'` would make a
   second global and leave the sort where it was.

   `bindings` above is built for resolving calls and is not enough to say a
   name was never declared: it reads a var statement as `\bvar\s+([^;]+)`, so a
   statement whose own line carries no semicolon runs into the next and
   swallows it -- `var setBlobs = firsts.map(function (f) {` reaches the `;` at
   the end of a `var set = ...` inside it, and `set` is never counted. Harmless
   for a call; a false accusation here. So the name after every `var` is
   collected too. */
const declared = new Set(bindings);
appFiles.concat([path.join(WWW, 'index.html')]).forEach(f => {
  const src = bare(fs.readFileSync(f, 'utf8'));
  [...src.matchAll(/\bvar\s+([A-Za-z_$][\w$]*)/g)].forEach(m => declared.add(m[1]));
  [...src.matchAll(/\bfor\s*\(\s*var\s+([A-Za-z_$][\w$]*)/g)].forEach(m => declared.add(m[1]));
});
const assigned = new Map();
appFiles.forEach(f => {
  const src = bare(fs.readFileSync(f, 'utf8'));
  const rel = path.relative(ROOT, f);
  [...src.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*=(?!=)/g)].forEach(m => {
    if (assigned.has(m[1])) return;
    assigned.set(m[1], rel + ':' + src.slice(0, m.index).split('\n').length);
  });
});
const undeclared = [...assigned].filter(([n]) =>
  !declared.has(n) && !KEYWORD.has(n) && BROWSER.indexOf(n) < 0);

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
if (deadVars.length){
  console.error(deadVars.length + ' top-level var' + (deadVars.length === 1 ? '' : 's') +
                ' nothing reaches:\n');
  deadVars.forEach(d => console.error('  ' + d.file + ':' + d.line + '  ' + d.name));
  console.error('\nDelete them. Whatever they currently say cannot be checked against\n' +
                'anything nothing reads -- that is how OB_STEPS said five for as long\n' +
                'as it said anything at all.');
  process.exit(1);
}
if (undeclared.length){
  console.error(undeclared.length + ' name' + (undeclared.length === 1 ? ' is' : 's are') +
                ' assigned and never declared:\n');
  undeclared.forEach(([n, where]) => console.error('  ' + where + '  ' + n));
  console.error('\nAssigning to a name nothing declares makes a global, silently. It is\n' +
                'either a typo -- in which case the thing you meant to set is still\n' +
                'sitting at its old value -- or what is left of something that was\n' +
                'deleted, which is how mkPos outlived the screen it belonged to.');
  process.exit(1);
}
if (writeOnly.length){
  console.error(writeOnly.length + ' top-level var' + (writeOnly.length === 1 ? ' is' : 's are') +
                ' written and never read:\n');
  writeOnly.forEach(d => console.error('  ' + d.file + ':' + d.line + '  ' + d.name));
  console.error('\nA write-only global is usually not spare code -- it is a wire with one\n' +
                'end unattached, and the missing half is the half somebody would have\n' +
                'noticed. Attach the other end, or delete it; git remembers.');
  process.exit(1);
}
/* ---- the same sentence about what money buys --------------------------
   CAN in www/core.js names every capability a plan opens, and can('x') is
   the only way to ask. A capability nothing asks for is a line in a price
   list nothing charges; a can('x') that is no capability reads as free,
   which is the quiet way round -- nothing throws on a phone until somebody
   on Plus finds the door shut.

   Both are read from the source rather than from a running app, because
   this check has no browser and does not want one. That means the literal
   has to be a literal: can(someVariable) is refused outright, on the same
   ground act-map binds the function and not its name.

   has() is core.js's own, now that can() is the question everywhere else.
   A new has('plus') anywhere else is the twenty-three coming back. */
const CORE = fs.readFileSync(path.join(WWW, 'core.js'), 'utf8');
const tbl = CORE.match(/\bvar\s+CAN\s*=\s*\{([\s\S]*?)\n\}/);
if (!tbl){
  console.error('www/core.js has no `var CAN={...}` table. It is the one place\n' +
                'that says what each plan opens, and nothing else may say it.');
  process.exit(1);
}
const caps = [...tbl[1].matchAll(/^\s*([A-Za-z_$][\w$]*)\s*:/gm)].map(m => m[1]);
const asked = new Map();      /* capability -> where it is asked */
const loose = [];             /* can(...) with something that is not a literal */
const stray = [];             /* has(...) outside core.js */
appFiles.forEach(f => {
  const rel = path.relative(ROOT, f);
  /* Comments are dropped, strings are not: the argument IS a string here.
     bare() would blank exactly the thing being read. */
  const src = fs.readFileSync(f, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  /* `function can(what)` is the declaration, not an ask. */
  [...src.matchAll(/(?<![\w$.])(?<!function\s{1,8})can\s*\(([^)]*)\)/g)].forEach(m => {
    const a = m[1].trim(), lit = a.match(/^'([\w$]+)'$/);
    if (!lit){ loose.push(rel + '  can(' + a + ')'); return; }
    if (!asked.has(lit[1])) asked.set(lit[1], rel);
  });
  if (rel !== 'www/core.js' && /(?<![\w$.])has\s*\(/.test(src)) stray.push(rel);
});
const unknown = [...asked].filter(([c]) => caps.indexOf(c) < 0);
const unasked = caps.filter(c => !asked.has(c));
if (loose.length){
  console.error(loose.length + ' can() ' + (loose.length === 1 ? 'is' : 'are') +
                ' asked with something that is not a literal:\n');
  loose.forEach(l => console.error('  ' + l));
  console.error('\nNothing can hold a capability read from a variable, and a wrong\n' +
                'one reads as free rather than throwing. Write the name out.');
  process.exit(1);
}
/* Before the two below, because replacing a can('x') with has('plus') makes
   all three true at once and only this one names what was actually done. */
if (stray.length){
  console.error('has() is called outside www/core.js, in ' + stray.length + ' file' +
                (stray.length === 1 ? '' : 's') + ':\n');
  stray.forEach(f => console.error('  ' + f));
  console.error('\nhas() names a plan; can() names a capability. Twenty-three sites\n' +
                'asked has(\'plus\') and meant nine different questions, and the\n' +
                'answer to "which" was in a comment or in nothing. Ask can().');
  process.exit(1);
}
if (unknown.length){
  console.error(unknown.length + ' capabilit' + (unknown.length === 1 ? 'y is' : 'ies are') +
                ' asked for and ' + (unknown.length === 1 ? 'is' : 'are') + ' in no plan:\n');
  unknown.forEach(([c, f]) => console.error('  ' + f + '  can(\'' + c + '\')'));
  console.error('\nCAN in www/core.js is the whole of what money buys. A name that is\n' +
                'not in it answers false on every plan, so it is a locked door\n' +
                'nobody can ever open, and nothing says so.');
  process.exit(1);
}
if (unasked.length){
  console.error(unasked.length + ' capabilit' + (unasked.length === 1 ? 'y' : 'ies') +
                ' nothing asks for:\n');
  unasked.forEach(c => console.error('  CAN.' + c));
  console.error('\nDelete the line. A plan that charges for something no screen ever\n' +
                'checks is a promise the app does not keep, and the price list is\n' +
                'the only place it exists.');
  process.exit(1);
}
console.log('dead code: ' + decls.length + ' functions and ' + varDecls.length +
            ' top-level vars in www/, every one of them reached,');
console.log('           and every name called is one of them, a binding, or the browser\'s.');
console.log('what money buys: ' + caps.length + ' capabilities in CAN, every one asked for by ' +
            'name,\n                 and nothing asked for that is not one of them.');
