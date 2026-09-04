/* ---------------------------------------------------------------------------
   tools/master-hands.mjs — master に立っている間、リーダーの道具を落とす。

   `.claude/settings.json` に PreToolUse として繋がっています。道具が動く前に
   呼ばれ、いま立っているブランチが `master` なら、調べるための道具を落とす。

   なぜ。リーダーは配って、取り込んで、ゲートを回して、ビルドを出す人です。
   調べるのはセッションの仕事で、リーダーの仕事ではない ── これは
   `docs/SESSIONS.md` と CLAUDE.md が何度も書いていることですが、書いてある
   だけで何も止めていませんでした。そして止めていないルールは破られます。
   リーダーは `master` に立ったまま `www/` を grep し、画面のコードを読み、
   一日をそれで潰しました。「書いていて止めないの本当に何？」

   だから、これは文ではなく門です。判断の材料は一つしかありません ──
   **いま HEAD がどのブランチを指しているか。**

     * `master` にいる  → 下に書いた道具を落とす。
     * `claude/*` にいる → 何もしない。働くセッションは今まで通り。

   落とすもの:

     Read Grep Glob Edit Write   ── 全部。読むのも書くのも調べる側の仕事。
     Bash                        ── 許可リストに載っている形だけ通す。

   Bash の許可リストは、リーダーが `master` の上で実際にやることだけです ──
   取り込む（fetch merge push）、今どうなっているかを見る（log status
   rev-list ls-remote show）、ゲートを回す（npm test、npm run <一つ>）。
   それ以外は落ちます。`git checkout` も落ちます: master を離れるのは
   リーダーの仕事ではなく、離れて働くならセッションを立てる、という同じ一つ
   の答えに戻るからです。

   繋ぎ言葉は形ごと落とします。`&&` `;` `|` 改行 バッククォート `$(` の
   どれかが入っていれば、中身を読まずに落とす。`push-alone.mjs` が同じ理由で
   同じことをしています ── 引用符の中の push と本物の push を見分けるには
   シェルの構文解析器を書くことになり、構文解析器もどきの門は穴の開いた門
   です。行を一本打ち直す代償と、master が赤くなる代償は釣り合いません。

   **リダイレクトも同じ扱いです。`>` と `<` は落とす。** これは書き足しでは
   なく、この門を書いた本人が最初の版を抜けてしまったから閉じたものです ──
   `git log` は許可リストに載っているので、`git log -0 > www/core.js` は
   「読むだけの許可リスト」を通り抜けてファイルを空にします。許可するのは
   コマンドの名前であって、コマンドが何をするかではない。だから名前で許して
   いる限り、行き先を書ける記号は閉じるしかありません。

   これは「調べるな」ではなく「**ここでは**調べるな」です。次の手は一つしか
   ないので、落とすときのメッセージはその一行だけを言います。

   壊れた入力は開いて通します。このフックはセッションの道具全部の前に立って
   いるので、想定外の payload で死ぬフックはセッションごと道具を奪います。
   はっきり見えたものだけを落とす。
   --------------------------------------------------------------------------- */

import { execFileSync } from 'node:child_process';

/* 調べるための道具。master の上では一つも通しません。 */
const HANDS = ['Read', 'Grep', 'Glob', 'Edit', 'Write'];

/* master の上で Bash が通す形。ここに無いものは落ちます。 */
const LET = [
  /^git\s+(fetch|merge|push|log|status|rev-list|ls-remote|show)(\s|$)/,
  /^npm\s+test\s*$/,
  /^npm\s+run\s+[A-Za-z0-9:_-]+\s*$/
];

/* 繋ぎ言葉とリダイレクト。一つでもあれば中身を読まずに落とす。 */
const JOINS = /&&|;|\||\n|`|\$\(|>|</;

function branch(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'rev-parse', '--abbrev-ref', 'HEAD'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (e) {
    /* git が答えないなら、ここが master だとは言えません。開いて通す。 */
    return '';
  }
}

function stop(what) {
  console.error('');
  console.error('  ' + what);
  console.error('  リーダーは調べません。セッションを立てて調べさせてください。');
  console.error('');
  console.error('  (tools/master-hands.mjs — .claude/settings.json, PreToolUse)');
  console.error('');
  process.exit(2);
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (c) { raw += c; });
process.stdin.on('end', function () {
  let inp;
  try {
    inp = JSON.parse(raw);
  } catch (e) {
    process.exit(0);            /* 開いて通す。header 参照。 */
  }
  if (!inp || typeof inp.tool_name !== 'string') process.exit(0);

  const dir = process.env.CLAUDE_PROJECT_DIR || inp.cwd || process.cwd();
  if (branch(dir) !== 'master') process.exit(0);

  if (HANDS.indexOf(inp.tool_name) >= 0)
    stop('master に立っています。' + inp.tool_name + ' はここでは動きません。');

  if (inp.tool_name !== 'Bash') process.exit(0);

  const cmd = ((inp.tool_input && inp.tool_input.command) || '').trim();
  if (!cmd) process.exit(0);

  if (JOINS.test(cmd))
    stop('master に立っています。繋いだコマンドはここでは動きません。');

  for (let i = 0; i < LET.length; i++) if (LET[i].test(cmd)) process.exit(0);

  stop('master に立っています。`' + cmd.split(/\s+/).slice(0, 2).join(' ') +
       '` はここでは動きません。');
});
