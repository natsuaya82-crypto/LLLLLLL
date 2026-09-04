/* ---------------------------------------------------------------------------
   tools/master-hands.mjs — master に立っている間、書く手を落とす。読む目は
   通す。

   `.claude/settings.json` に PreToolUse として繋がっています。道具が動く前に
   呼ばれ、いま立っているブランチが `master` なら、書く側だけを落とす。

   なぜ。リーダーは配って、取り込んで、ゲートを回して、ビルドを出す人です。
   直すのはセッションの仕事で、リーダーの仕事ではない ── これは
   `docs/SESSIONS.md` と CLAUDE.md が何度も書いていることですが、書いてある
   だけで何も止めていませんでした。そして止めていないルールは破られます。

   判断の材料は一つしかありません ── **いま HEAD がどのブランチを指している
   か。**

     * `master` にいる  → 書く側を落とす。
     * `claude/*` にいる → 何もしない。働くセッションは今まで通り。

   **読むのは通します。**「リーダーは調べません」は原因を追いかけないという
   意味であって、設計書を読まないという意味ではありません
   ──「そもそもオンライン化するためのやつだからお前も読んで適切な指示を
   出さないと」「読むのは許してくれ」オーナー 2026-09-04。

   最初の版は読む側ごと落としていて、リーダーは master に閉じ込められました
   ── ゲートは回せるのに `EXIT=` が読めず、`git checkout` も落ちるので降りる
   こともできない。**働く邪魔をする門は明日誰かに外され、外されるときは
   止めていた分ごと外れます。**だからこの版は問いそのものを取り替えてあり、
   条件を足したのではありません。前の問いは「その道具は許可リストに載って
   いるか」で、いまの問いは「**それは読むだけか**」です。

   落とすもの:

     Edit Write                  ── 書く道具。
     Bash                        ── 読むだけのコマンドで出来ていないもの。
     ファイルへの書き出し          ── `>` `>>`。`2>&1` は書き出しではない。
     ヒアドキュメント              ── 本文はファイルの中身であって、master の
                                    上で書くものは何もありません。

   通すもの:

     Read Grep Glob              ── 読む道具。
     cat tail head ls date       ── 読むコマンド。
     git の読む側                 ── fetch log show status rev-list diff
                                    branch ls-remote
     git checkout                ── master から降りられないのは閉じ込めです。
     git merge / git push        ── 取り込みと押しはリーダーの仕事そのもの。
     npm test / npm run <一つ>    ── ゲート。

   **繋ぐのは通します。ただし繋いだ一つ一つが読む側であること。**
   `git log | head` も `npm test | tail -50` も読むためのもので、これを
   落としていたのが閉じ込めの半分でした。落ちるのは、繋いだうちの一つでも
   読む側でないときです ── 判定はコマンド全体の見た目ではなく、区切った
   一つ一つの先頭の語で行います。

   引用符の中は読みません。`echo "rm -rf" | cat` は落ちます ── 引用符の中の
   コマンドと本物を見分けるにはシェルの構文解析器を書くことになり、構文解析器
   もどきの門は穴の開いた門です。過剰に落とす代償は行を一本打ち直すこと、
   足りない代償は master に置いていった書き換えです。

   AND THE LIMIT, 黙っていると checked と読まれるので書きます。通している
   コマンドのうち二つは書きます ── `git checkout` は作業ツリーを戻せるし、
   `git merge` は当然書きます。どちらもオーナーとリーダーが名指しで通せと
   言ったもので、どちらもリーダーの仕事そのものです。**この門は「master の
   上で www/ と tools/ を書き換えない」を止めるのであって、git がリーダーの
   指示どおりに動くのを止めるものではありません。**

   壊れた入力は開いて通します。このフックはセッションの道具全部の前に立って
   いるので、想定外の payload で死ぬフックはセッションごと道具を奪います。
   はっきり見えたものだけを落とす。
   --------------------------------------------------------------------------- */

import { execFileSync } from 'node:child_process';

/* 書く道具。master の上では通しません。 */
const HANDS = ['Edit', 'Write'];

/* 通す git の副コマンド。checkout merge push は上の「限界」を参照。 */
const GIT = ['fetch', 'log', 'show', 'status', 'rev-list', 'diff', 'branch',
             'ls-remote', 'checkout', 'merge', 'push'];

/* 通す素のコマンド。 */
const PLAIN = ['cat', 'tail', 'head', 'ls', 'date'];

/* コマンドを区切る記号。区切った一つ一つを読む側かどうか見ます。 */
const SPLIT = /&&|\|\||;|\||\n/;

function branch(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'rev-parse', '--abbrev-ref', 'HEAD'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (e) {
    /* git が答えないなら、ここが master だとは言えません。開いて通す。 */
    return '';
  }
}

/* 区切り一つが読む側か。先頭の語で決めます ── `VAR=x cmd` の前置きは飛ばし、
   `git -C dir log` のような git 自身の旗も飛ばして副コマンドを見ます。 */
function reads(seg) {
  const w = seg.trim().split(/\s+/).filter(function (s) { return s !== ''; });
  let i = 0;
  while (i < w.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(w[i])) i++;
  const head = w[i];
  if (!head) return true;                       /* 空の区切り */

  if (head === 'git') {
    let j = i + 1;
    while (j < w.length && w[j].charAt(0) === '-') {
      if (w[j] === '-C' || w[j] === '-c') j++;   /* 値を取る旗 */
      j++;
    }
    return GIT.indexOf(w[j]) >= 0;
  }
  if (head === 'npm') {
    if (w[i + 1] === 'test') return w.length === i + 2;
    if (w[i + 1] === 'run') return w.length === i + 3;
    return false;
  }
  return PLAIN.indexOf(head) >= 0;
}

function stop(what) {
  console.error('');
  console.error('  ' + what);
  console.error('  リーダーは書きません。セッションを立てて直させてください。');
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

  /* ファイルへの書き出し。`2>&1` のような番号の付け替えは書き出しではない
     ので先に外してから見ます。 */
  if (cmd.replace(/\d?>&\d?/g, ' ').indexOf('>') >= 0)
    stop('master に立っています。ファイルへの書き出しはここでは動きません。');

  if (/(?<!<)<<(?!<)/.test(cmd))
    stop('master に立っています。ヒアドキュメントはここでは動きません。');

  const segs = cmd.split(SPLIT);
  for (let i = 0; i < segs.length; i++) {
    if (reads(segs[i])) continue;
    const w = segs[i].trim().split(/\s+/);
    stop('master に立っています。`' + w.slice(0, 2).join(' ') +
         '` は読むだけのコマンドではありません。');
  }
  process.exit(0);
});
