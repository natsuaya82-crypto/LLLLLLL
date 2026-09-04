/* ---------------------------------------------------------------------------
   tools/push-alone.mjs — a push is written on a line of its own, or not at all.

   Wired in .claude/settings.json as a PreToolUse hook on Bash. It reads the
   command the model is about to run, and refuses to let it run at all if a
   `git push` is sharing that command with anything else.

   2026-09-04. The leader typed `npm test && git push`, and master went red.
   `tools/pre-push` catches that -- but it catches it AFTER the line has been
   typed and run, on the way out, and only for master. This is the same
   accident stopped one step earlier: at the moment it is WRITTEN, before the
   gate has even started.

   Why the shape of the line matters and not just its result: `&&` runs the
   second half on an exit code, which is not the same thing as somebody having
   READ the first half. The gate prints numbers that moved, a check that
   passed for the wrong reason, a count that fell -- none of which is the exit
   code. Sixteen minutes of output nobody looked at is the same as no gate.
   So the rule is not "run the gate first", which is a rule written as if
   something were stopping it. The rule is: the push is its own command, typed
   after reading what came back.

       npm test          <- and read it
       git push          <- a command of its own

   What it refuses: a command containing a `git push` that also contains
   `npm test`, `npm run`, `&&`, `;`, `|`, or a second line. What it lets
   through: `git push` on its own, with whatever flags it likes --
   `git push -u origin claude/force`, `git push --force-with-lease`,
   `git push 2>&1 > log`. The flags are not the disease.

   WHAT IT IS ASKED ABOUT: the command, with every heredoc BODY taken out
   first.

   That is the whole of the 2026-09-04 fix, and it is a change to what the
   question is asked of, not a second question asked afterwards. The first
   version was asked about the raw bytes of the command, and a heredoc body
   is not a command -- it is the file being written. So writing a handover
   that said, in prose, "read the gate, then git push" was refused, with a
   message about `npm test` and a second line that were both sentences in a
   document. A hook that stands in the way of ordinary work is a hook
   somebody removes tomorrow, and removing this one takes the gate-before-push
   check with it.

   A heredoc is the one construct where data and command can be told apart
   without writing a shell parser: the shell itself says where the body ends,
   because the delimiter is named on the line that opens it. Quotes and
   comments are NOT that, and are still not read -- `echo "then git push" &&
   ls` is still refused. Telling a quoted push from a real one is a parser,
   and a gate that is nearly a parser is a gate with a hole in it.

   Three things it deliberately does NOT do:

     * It does not look at what the other half of the command IS. `cd x &&
       git push` is refused too, and that is not a mistake: a rule with a list
       of allowed neighbours is a rule that grows a way round itself. There is
       one shape and it is the push alone.
     * It does not read quotes or comments. Over-refusing there costs one
       retyped line; under-refusing costs a red master.
     * It does not close any door the shell has. Two Bash calls in a row do
       exactly what the joined line did, minus the joining -- which is the
       whole point: the second one is typed by somebody who has seen the first
       one's output.

   AND THE LIMIT, SAID OUT LOUD so silence is not read as a check. Taking the
   bodies out means a body FED TO A SHELL is not read either: `bash <<EOF`
   with a gate and a push inside it goes through. That is accepted, because
   this hook stops an ACCIDENT and not somebody determined -- `git 'p'ush`
   and `eval` were always through it, and `npm test && git push` typed in one
   line is the thing that actually happened and is still caught. Nobody
   reaches for a heredoc into bash by accident.

   Malformed input fails OPEN. This hook sits in front of every Bash command
   in the session, and a hook that dies on an unexpected payload takes the
   whole session's shell with it. It refuses what it can positively see.
   --------------------------------------------------------------------------- */

/* `git push`, with any flags between the two words: `git -C dir push`,
   `git --no-pager push`. Not `git pushx`, not a word ending in git. */
const PUSH = /(^|[^\w-])git(\s+-{1,2}[^\s]+)*\s+push([^\w-]|$)/;

/* What may not share a command with it. `||` and `|&` are caught by `|`. */
const NEIGHBOURS = [
  { re: /&&/,            name: '&&' },
  { re: /;/,             name: ';' },
  { re: /\|/,            name: '|' },
  { re: /(^|[^\w-])npm\s+test([^\w-]|$)/,  name: 'npm test' },
  { re: /(^|[^\w-])npm\s+run([^\w-]|$)/,   name: 'npm run' }
];

/* A heredoc opener: `<<WORD`, `<<-WORD`, `<<'WORD'`, `<<"WORD"`, `<<\WORD`.
   Not `<<<` (a herestring, which has no body) and not the tail of one. */
const OPEN = /(?<!<)<<(?!<)-?\s*(?:(['"])([^'"]*)\1|\\?([A-Za-z_][A-Za-z0-9_]*))/g;

/* The command with every heredoc body removed. The bodies are what is being
   WRITTEN; only what is left is what runs. `<<-` strips leading tabs from the
   terminator, which is the one difference between the two forms that matters
   here. An opener with no terminator eats the rest: an unterminated heredoc
   is all body. */
function ran(cmd) {
  const lines = cmd.split('\n');
  const out = [];
  let want = null;      /* the delimiter being waited for, or null */
  let dash = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (want !== null) {
      const end = dash ? line.replace(/^\t+/, '') : line;
      if (end.trim() === want && end === end.trimEnd()) want = null;
      continue;                       /* body and terminator: both dropped */
    }

    out.push(line);

    OPEN.lastIndex = 0;
    const m = OPEN.exec(line);
    if (m) {
      want = m[2] !== undefined ? m[2] : m[3];
      dash = line.slice(m.index, m.index + 3).indexOf('-') >= 0;
    }
  }
  return out.join('\n');
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  let cmd = '';
  try {
    const inp = JSON.parse(raw);
    if (inp && inp.tool_name && inp.tool_name !== 'Bash') process.exit(0);
    cmd = (inp && inp.tool_input && inp.tool_input.command) || '';
  } catch (e) {
    /* Fails open: see the header. */
    process.exit(0);
  }
  if (typeof cmd !== 'string' || !cmd) process.exit(0);

  cmd = ran(cmd);
  if (!PUSH.test(cmd)) process.exit(0);

  const found = [];
  for (const n of NEIGHBOURS) if (n.re.test(cmd)) found.push(n.name);

  /* A newline joins two commands as surely as `;` does. One command, even
     wrapped over lines by a trailing backslash, is one line by this count. */
  const lines = cmd.replace(/\\\n/g, ' ').split('\n').filter((l) => l.trim() !== '');
  if (lines.length > 1) found.push('a second line');

  if (!found.length) process.exit(0);

  console.error('');
  console.error('  This command has a `git push` in it and ' + found.join(', ') + '.');
  console.error('');
  console.error('  A push is a command of its own. Joined to anything else it runs on an');
  console.error('  exit code, and an exit code is not somebody having read the gate. That');
  console.error('  is the line that put a red master up on 2026-09-04.');
  console.error('');
  console.error('  Split it. Run the first half, READ what it says, then:');
  console.error('');
  console.error('      git push');
  console.error('');
  console.error('  (tools/push-alone.mjs — .claude/settings.json, PreToolUse on Bash)');
  console.error('');
  process.exit(2);
});
