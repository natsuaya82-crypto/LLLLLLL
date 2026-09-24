/* ---------------------------------------------------------------------------
   tools/acct-check.mjs — the phone stops answering with the last person's name.

   Run it:   node tools/acct-check.mjs

   OWNER 2026-08-27, on a real phone, with a photograph:
     「Appleでログインしたあと前のアカウントが出てくるんだけどなんで？
       あとこのあと接続できませんって出るけど？」

   The photograph is the 「ユーザー名とID」 screen carrying `Lingua` and
   `@lingua2` -- the account that was signed out of, offered to the account
   that just signed in -- and 「接続できません」 in red under it.

   Two separate things, and this file holds both.

   ---- the first: whose name is on this phone -----------------------------

   `lingua.me` is the person, not the language and not the session: a name, a
   handle, a line about themselves, a face, a link, where they are, and the
   list of who they follow. `lingua.sess` is the session. They are two keys
   and `netOut()` only ever removed the second, so everything in the first
   survived signing out and was still there when somebody else signed in.

   What made it visible is `obIn()`: when the server has NO profile row for
   the account that just arrived -- which is what a brand new account is --
   it filled the two fields from the copy on the phone. That copy belonged to
   whoever was here before.

   The rule this check holds is BOTH halves of it, and the second half is the
   one that is easy to break while fixing the first:

     a different person signs in   -> the previous person's name is not shown,
                                      not sent, and not offered
     the same person signs back in -> their name is still theirs

   `CLAUDE.md`「人が作ったものは消さない」. So the copy is not deleted when
   somebody else arrives: it is PARKED, under `lingua.me.<their uid>`, and
   handed back if they return. `ME.bio`, `ME.link` and `ME.loc` have no copy
   on the server at all -- `netMakeProfile()` sends only `handle`, `display`
   and `av` -- so deleting them on sign-out would be the one kind of loss this
   repository does not accept. Nothing here deletes; the cases below prove it
   by signing the first person back in and finding their line about themselves
   where they left it.

   The thing that tells the two halves apart is the server's own name for the
   account, `SESS.uid`. Not the handle, not the address, not what door they
   came in by -- those are things a person can change or share. The uid is
   what the server means by "this account", and it is what `profile.id` is.

   ---- the second: what 「接続できません」 was covering up ------------------

   `netWhy()` answers `t('net.offline')` for HTTP status 0, and three quite
   different things were arriving as 0:

     the request never left the phone   netSend()'s x.onerror
     the request was never made         netMyProfile / netMakeProfile /
                                        netSetPass / netLangRow / netResume,
                                        each of which refuses locally with
                                        bad(null, 0) when it sees no session
     the answer was 200 and not a session  netTook(d) false -> bad(d, 0)

   One sentence for three states, one of which never touched the network at
   all. On a phone, with no console, they are indistinguishable -- and the
   owner's photograph is exactly that: a red line that cannot be acted on.

   So each kind of zero now carries a mark, and this check holds that the
   three marks differ. It does NOT hold what the marks say: the words are the
   app's and `t()` owns them. What it holds is that they are three and not
   one, because that is the property the photograph needed and did not have.

   Exit code is 0 only when every case holds.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const PORT = 8151;

const mime = (f) => f.endsWith('.html') ? 'text/html; charset=utf-8'
  : f.endsWith('.js') ? 'application/javascript; charset=utf-8'
  : 'text/plain; charset=utf-8';
const srv = http.createServer((rq, rs) => {
  const f = path.join(ROOT, rq.url === '/' ? 'index.html' : rq.url.split('?')[0]);
  let d = null;
  try { d = fs.readFileSync(f); } catch (e) { d = null; }
  if (d === null) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': mime(f) });
  rs.end(d);
});
await new Promise(r => srv.listen(PORT, r));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage();
await pg.goto(`http://127.0.0.1:${PORT}/`);
await pg.waitForTimeout(300);
await pg.evaluate('window.__seed = ' + seed.toString());

const R = await pg.evaluate(async () => {
  const out = { fails: [], said: [] };
  const A = '11111111-1111-4111-8111-111111111111';   /* the person who was here */
  const B = '22222222-2222-4222-8222-222222222222';   /* the person who arrives */
  const PIC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  const no = (m) => out.fails.push(m);
  const say = (m) => out.said.push(m);

  /* A session the way netTook() makes one. The access token is not a real
     JWT and does not need to be: netClaims() cannot read it, netAnonTok()
     answers false for what it cannot read, and false is what a real account
     is. The uid is the whole point of the fixture. */
  /* この検査にサーバーはありません。`netTook()` は 2026-09-11 から
     「送ってから訊く」road を始めます（www/net.js）── 送信の答えが来ない
     ので、そこで止まると `LANG_WAIT` が立ったままになり、どの画面も
     「待っています」の丸になります。**答えが来なかった時と同じ所まで**
     進めるのが `langForAcct()` の一行で、それは `netLangSync()` の失敗が
     `done(false)` を呼び、`pullWait()` が待っている人を起こして通る道その
     ものです。近道ではなく、電波の無い端末が実際に通る終わりです。 */
  const arrive = (uid) => {
    const r = netTook({
      access_token: 'not a jwt', refresh_token: 'a refresh token', user: { id: uid }
    });
    /* そして一覧が降りてきた所まで。`PULL_GOT` は「サーバーが答えた」で、
       この検査ではその答えが `start()` の `langOwnGot()` です。立てないと
       `langForAcct()` は（正しく）何も作らずに待ちます。 */
    PULL_GOT['mylangs'] = 1;
    /* 「この account の言語は何か」にサーバーが答えた、という所まで
       （www/core.js § LMINE、2026-09-15）。`langForAcct()` はこれが無いと
       （正しく）何も作らずに待ちます ── 電波の無い端末と同じ所で。 */
    langMineGot();
    langForAcct();
    return r;
  };

  /* Somebody with a whole account on this phone: the two things the
     photograph showed, and the four that do not show but travel further --
     the face goes to the server as the new account's `av`, and the follow
     list is what the owner is on two phones to test. */
  const beA = () => {
    ME.name = 'Lingua'; ME.handle = 'lingua2';
    ME.bio = 'a line only this phone has'; ME.pic = PIC;
    ME.link = 'example.com'; ME.loc = 'どこか';
    saveMe();
    /* フォローはサーバーの答えで、`follow` 表から降りてくる場所に置きます
       （www/me.js § folPull、2026-09-09）。`ME.fo` は書きません ──
       もう誰も読みません。 */
    folPut(false, 'lingua2', ['someone', 'someone-else']);
  };

  const wipeParked = () => {
    let i, k, doomed = [];
    for (i = 0; i < localStorage.length; i++) {
      k = localStorage.key(i);
      if (k && k.indexOf('lingua.me.') === 0) doomed.push(k);
    }
    for (i = 0; i < doomed.length; i++) localStorage.removeItem(doomed[i]);
  };

  const start = () => {
    window.__seed(); SET.walked = true;
    wipeParked();
    /* THE FIXTURE'S LANGUAGE IS WHAT THE WALK MADE, and the door hands it to
       A. Signing out empties the account's index in memory (www/core.js
       § ACCT, r79) -- the index is the account's now, not the phone's -- so
       the fixture's language is put back as what nobody's memory holds, which
       is exactly the walk: made before there was an account, given to the one
       that arrives. Before r79 it simply survived the sign-out and the door
       ADOPTED it, which is the road r79 took out. */
    const seedL = LANGS, seedId = langId;
    netOut();
    LANGS = seedL; langId = seedId;
    /* サーバーが「この言語はこの人が書いた」と答えた所から始めます ──
       セッションが着く前に。2026-09-11 から `langForAcct()` はサーバーの
       答え（`langOwnOf()`）だけを読むので、答えが入っていない状態で
       セッションが着くと、この端末には何も無いことになります。 */
    langOwnGot(langId, A);
    arrive(A); beA();
    /* そして fixture の言語は、いまサインインしている人が書いたもの ──
       どの案件もそこから始まります。「誰が書いたか」はサーバーの答えで
       （www/core.js § LOWN）、案件をまたいで残る写しなので、案件のほうで
       「まだ聞いていない」を測りたいときは、そこで一行落とします（12番）。 */
    langOwnGot(langId, A);
  };

  /* ---- 1. somebody else signs in ---------------------------------------
     The photograph. Signing out and signing in as another account must not
     leave one scrap of the first account on the screen or in what gets
     sent. */
  start();
  netOut();
  arrive(B);
  if (ME.name) no('1: 前の人の名前が残っている — ME.name=' + JSON.stringify(ME.name));
  if (ME.handle) no('1: 前の人のハンドルが残っている — ME.handle=' + JSON.stringify(ME.handle));
  if (ME.bio) no('1: 前の人の自己紹介が残っている');
  if (ME.pic) no('1: 前の人の顔が残っている — netMakeProfile() が av として送る');
  if (ME.link) no('1: 前の人のリンクが残っている');
  if (ME.loc) no('1: 前の人の居るところが残っている');
  if (folOf(false, meHandle()).length)
    no('1: 前の人のフォローが残っている — ' + folOf(false, meHandle()).length + '人' +
       '（一覧は FOL_HAVE。lingua.me の ME.fo・ME.fr は読みも書きもしない）');
  say('1: 別のアカウントが入ったとき、前の人は一つも残らない');

  /* ---- 2. and nothing was destroyed to do it ---------------------------
     The half that is easy to lose while fixing the half above. `link` and
     `loc` exist nowhere but this phone, so if signing somebody else in threw
     them away, they are gone for good.

     `bio` is on the server as of 2026-09-01 -- 「自己紹介を見せないって選択肢を
     俺はいつ与えた？」 -- and it stays in this list anyway. Being recoverable
     is not the claim: what is held here is that signing somebody else in and
     back does not TOUCH it, and a bio that had to be fetched again to come
     back would already have been lost by the parking. */
  netOut();
  arrive(A);
  if (ME.name !== 'Lingua') no('2: 入り直した本人の名前が消えている — ME.name=' + JSON.stringify(ME.name));
  if (ME.handle !== 'lingua2') no('2: 入り直した本人のハンドルが消えている');
  if (ME.bio !== 'a line only this phone has') no('2: 自己紹介が消えている — サーバに写しが無いので取り返せない');
  if (ME.pic !== PIC) no('2: 顔が消えている');
  if (ME.link !== 'example.com') no('2: リンクが消えている');
  if (ME.loc !== 'どこか') no('2: 居るところが消えている');
  /* フォローはこの一覧に入りません。2026-09-09 から `follow` 表が唯一の
     答えで、入り直せばサーバーに訊き直します ── 「この端末にしか無い」の
     反対側に移りました。1 番（前の人が一人も残らない）が押さえているのは
     そちらで、そこは folForget() が持っています。 */
  say('2: 同じ人が入り直すと、書いたものは全部そこにある');

  /* ---- 3. the two of them do not become one ----------------------------
     Going A -> B -> A -> B: the second person must still be empty, which is
     what says the parking is per account and not one drawer everybody shares. */
  netOut(); arrive(B);
  if (ME.name || ME.bio || folOf(false, meHandle()).length)
    no('3: 二人分が混ざっている — B に A のものが出た');
  ME.name = 'Two'; ME.handle = 'two'; saveMe();
  netOut(); arrive(A);
  if (ME.name !== 'Lingua') no('3: A に B の名前が出た — ME.name=' + JSON.stringify(ME.name));
  netOut(); arrive(B);
  if (ME.name !== 'Two') no('3: B の名前が保たれていない — ME.name=' + JSON.stringify(ME.name));
  say('3: 二人が同じ端末を使っても、互いのものは見えない');

  /* ---- 4. the field the photograph showed ------------------------------
     obIn() itself, with the server answering the way it answers for a brand
     new account: no profile row. The two inputs must come up empty. This is
     the case the owner photographed, and it is walked through the real
     function rather than asserted about ME, because the bug was in what
     obIn() DID with ME rather than in ME.

     netMyProfile is replaced for the length of the case: this check owns no
     server, and what is being held is obIn()'s choice, not the request. */
  const realProfile = netMyProfile;
  start();
  netOut(); arrive(B);
  OBM.nm = 'left over in memory'; OBM.hd = 'leftover';
  netMyProfile = (ok) => ok(null);          /* the server has never heard of B */
  obIn();
  netMyProfile = realProfile;
  if (OBM.nm) no('4: 新しいアカウントの登録欄に名前が入っている — OBM.nm=' + JSON.stringify(OBM.nm));
  if (OBM.hd) no('4: 新しいアカウントの登録欄にハンドルが入っている — OBM.hd=' + JSON.stringify(OBM.hd));
  say('4: サーバに profile が無いとき、ユーザー名とID の欄は空で出る');

  /* ---- 5. and the person who DOES have a row is not asked again --------
     The other side of obIn(), which must keep working: an account the server
     knows is not sent to the naming screen at all. */
  start();
  netOut(); arrive(A);
  netMyProfile = (ok) => ok({ handle: 'lingua2', display: 'Lingua' });
  obIn();
  netMyProfile = realProfile;
  if (OBM.mode === 'who') no('5: profile がある人が、名前を決めさせられている');
  if (ME.handle !== 'lingua2') no('5: サーバの言ったハンドルが入っていない');
  say('5: profile がある人は、名前を決める画面を通らない');

  /* ---- 6. 「接続できません」 says which zero it is ----------------------
     Three states, three marks. The words are the app's -- what is held here
     is only that the three differ, because one sentence for three states is
     what made the photograph unactionable.

     netWhy() is asked directly. The three arguments are the three shapes the
     three roads actually hand it. */
  let unsent = '';
  netOut();                                   /* so the refusal is the real one */
  netMakeProfile('h', 'n', () => no('6: 署名が無いのに profile を作りに行った'),
                 (d, st, m) => { unsent = netWhy(d, st, m); });
  const gone    = netWhy(null, 0, netTag('/rest/v1/profile?select=handle') + ' 0');
  const notSess = netWhy({}, 0, 'token ≠');
  const plain   = netWhy(null, 0);
  if (!unsent) no('6: 送らなかった失敗が、何も答えなかった');
  if (gone === unsent)
    no('6: 「届かなかった」と「送っていない」が同じ文言 — ' + JSON.stringify(gone));
  if (gone === notSess || unsent === notSess)
    no('6: 「セッションではなかった」が他と同じ文言 — ' + JSON.stringify(notSess));
  if (plain === gone)
    no('6: 印の無い 0 と、印のある 0 が同じ文言 — ' + JSON.stringify(plain));
  say('6: status 0 の三つの道が、画面で見分けられる');
  say('   届かない  : ' + gone);
  say('   送ってない: ' + unsent);
  say('   session≠ : ' + notSess);

  /* ---- 7. a real status is still a real status -------------------------
     The marks must not have eaten the ordinary answers. */
  if (netWhy({ msg: 'Invalid login credentials' }, 400) === gone)
    no('7: 400 が offline の文言になっている');
  say('7: 0 でない status は、これまでどおりの文言');

  /* ---- 8. 立っていないのに立ったように見えない --------------------------
     OWNER 2026-08-31: 「Googleボタン押しただけでログインできるけど？」

     SESS is written in exactly one place -- netTook() -- so what a session
     is, is whatever that function accepts. It accepted a reply carrying an
     access token and NO refresh token, and then three things that all read
     `rt` disagreed with it: netSignedIn() said no, and
     netRead() dropped the stored session at the next launch. The app had
     already said 「ログインしました」 and gone to fetch the profile.

     Held here rather than in the door, because the door is not where it was
     decided. Both directions: a whole reply is still a session, so this
     cannot be passed by refusing everything. */
  netOut();
  const half = netTook({ access_token: 'not a jwt', user: { id: B } });
  if (half) no('8: refresh token の無い返事が、セッションとして取られた');
  if (netSignedIn())
    no('8: refresh token が無いのに netSignedIn() が真 — 41箇所が食い違う');
  if (SESS) no('8: セッションでない返事が SESS に書かれた');
  netOut();
  if (!arrive(B)) no('8: 揃った返事がセッションとして取られなくなった');
  if (!netSignedIn()) no('8: 揃った返事のあとで netSignedIn() が偽');
  say('8: access token だけの返事はセッションではない（両方向）');

  /* ---- 9-11. 言語は、持ち主のアカウントのものである --------------------
     OWNER 2026-08-31:
       「違うアカウントでログインしてんのに前のやつ出てくるんだけど？
         前のアカウント消えたんだが？」

     3 番の上の claim は「二人が同じ端末を使っても、互いのものは見えない」と
     言っていて、**ME しか見ていませんでした。** `lingua.langs` と
     `lingua.<id>.*` は端末のもので、持ち主を一人も持っていません。だから
     3 番は緑のまま、言語のほうは素通しでした。

     ここで押さえるのは、そのうち **失われうる半分だけ** です ── B が入った
     ときに、A の言語が B のアカウントへ上がってしまうこと。netLangRow() が
     `owner: SESS.uid` で行を作るので、A が一度も上げていない言語は B のものに
     なります。

     一覧から隠すかどうかは別の話で、それは www/home.js の vLangs() ──
     このセッションは持っていません。報告に書いてあります。

     netPost / netGet を差し替えて、出ていくものを数えます。 */
  const realPost = netPost, realGet = netGet;
  let posted = [], getted = [];
  const wire = () => {
    netPost = (path, body, tok, ok, bad) => { posted.push({ path, body }); ok([{ id: 'server-side-id' }]); };
    netGet  = (path, ok, bad) => { getted.push(path); ok([]); };
  };
  const unwire = () => { netPost = realPost; netGet = realGet; };
  /* THE ROWS THAT WERE ABOUT THIS LANGUAGE, by its number. 「B のセッションで
     language に POST した」 was counted as ANY row posted while B arrived --
     and B arriving to an account the server says has no language is given one
     at the door, whose row the door makes (www/net.js § netTook, 2026-09-23;
     77 below is that). That row is B's own and carries B's own number; the
     claim is about A's. */
  const postedFor = (id) => posted.filter(p => p.body && String(p.body.id) === String(id));
  const askRow = (id) => {
    let got = '', refused = false;
    /* netLangRow() takes the id now: it used to ask about whichever language
       was OPEN, which is why a second language never reached the server.

       AND THE ID IS NAMED, not read off `langId`. Signing in re-points the
       open language at the arriving account's own (langForAcct, www/core.js),
       so 「the open one」 is no longer the language these claims are about --
       they are about the one the PREVIOUS account left behind, which is
       exactly the language that must not go up. Passing langId here asked
       about B's own new language and got the answer for it. */
    netLangRow(id || langId, (sid) => { got = sid; }, () => { refused = true; });
    return { got, refused };
  };

  /* 9. A が上げた言語に、B が触れない。 */
  start();
  wire(); posted = []; getted = [];
  LANGS[langId] = { name: 'A の言語', mine: true };
  langOwnGot(langId, A);
  const id9 = langId;
  langStore();
  netOut(); arrive(B);
  let r9 = askRow(id9);
  unwire();
  if (!r9.refused) no('9: B が A の言語の行を受け取った — 番号=' + JSON.stringify(r9.got));
  if (postedFor(id9).length)
    no('9: B のセッションで A の言語を language に POST した — owner=' +
       JSON.stringify(postedFor(id9)[0].body.owner));
  say('9: 別のアカウントは、前の人の言語をサーバへ上げない');

  /* 10. 一度も上がっていない言語も、前の人のものなら上げない。
     これが本当に失われる形です ── 行がまだ無いので netLangRow() は
     `owner: SESS.uid` で行を作り、A の中身が B のものになります。 */
  start();
  wire(); posted = []; getted = [];
  LANGS[langId] = { name: 'A の言語', mine: true };
  langOwnGot(langId, A);
  const id10 = langId;
  langStore();
  netOut(); arrive(B);
  let r10 = askRow(id10);
  unwire();
  if (postedFor(id10).length)
    no('10: A の言語が B のアカウントに作られた — owner=' +
       JSON.stringify(postedFor(id10)[0].body.owner) +
       ' name=' + JSON.stringify(postedFor(id10)[0].body.name));
  if (!r10.refused) no('10: 上がっていない他人の言語の行が受け取られた');
  say('10: 一度も上がっていない他人の言語も、上げない');

  /* 11. そして本人は今までどおり通る。片側だけ閉じても通ってしまうので、
     両方向を見ます ── 閉じすぎると自分の言語が上がらなくなります。 */
  start();
  wire(); posted = []; getted = [];
  LANGS[langId] = { name: '自分の言語', mine: true };
  langOwnGot(langId, A);
  langStore();
  netOut(); arrive(A);
  /* 行はまだ無い所から訊きます。`LROW` はこの実行の記憶で、前の案件が
     この言語の行を立てたまま残っています ── それがあると netLangRow() は
     何も送らずに「ある」と答えます。2026-09-23 まではそれでも緑でした:
     start() の ltStart() がアプリ自身の書き込みなのに「人が触った」と数え
     られ、arrive() の扉がその言語を上げていたからです。その道は r60 が
     閉じた道で（docs/scope/r60-up.md）、ここが測りたいのは扉ではなく
     netLangRow() そのものです。 */
  delete LROW[langId];
  let r11 = askRow();
  unwire();
  if (r11.refused) no('11: 本人が自分の言語の行を断られた');
  if (!posted.length) no('11: 本人の言語がサーバに作られなかった');
  /* そして行の番号は**送った番号**です（2026-09-10、幹一本）。端末が uuid を
     打ち、insert に id を入れて送るので、扉の前後で番号は変わりません ──
     `sid` を貼り直す行はもうありません。 */
  if (!posted.length || String((posted[0].body || {}).id) !== String(langId))
    no('11: 作った行に、この言語の番号が入っていない — ' +
       JSON.stringify(posted.length && posted[0].body && posted[0].body.id) +
       ' / ' + JSON.stringify(langId));
  if (r11.got !== langId) no('11: 返ってきた番号がこの言語の番号でない');
  say('11: 本人の言語は、今までどおり上がる ── 送った番号のまま');

  /* 12. uid の無い、しかし一度は上がった言語 ── 今日どの端末にもあるやつ。
     ここは端末の中に答えが無いので、**サーバに訊きます。**
     `language_read` は持ち主にしか行を返さないので、空の返事は
     「あなたのではない」というサーバの言葉です。憶測は一つもありません。 */
  start();
  wire(); posted = []; getted = [];
  /* 鍵はその言語の番号そのものです（2026-09-10、幹一本）。「一度は上がった」
     と言うのは `LROW`（www/core.js）── `sid` の欄がそれを言っていました。 */
  langId = 'old-lang';
  LANGS[langId] = { name: '前からある言語', mine: true };
  langRowGot(langId);
  langStore();
  /* 名指しします ── `langId` ではなく。印の無い言語は 35 番のとおり次に入った
     人のものにならないので、B が入った瞬間 langForAcct() が B のために別の
     言語を開きます。`askRow()` を素で呼ぶと、その B の新しい言語について
     訊くことになる ── 9 番と 10 番が前から名指ししているのと同じ理由です。 */
  const id12 = langId;
  /* まだ誰も聞いていない状態にします ── start() のサインインで
     netLangsDown() が答えを書いているので、それを落としてから。 */
  langOwnGot(id12, '');
  netOut(); arrive(B);
  netGet = (path, ok) => { getted.push(path); ok([]); };     /* 持ち主ではない */
  let r12 = askRow(id12);
  unwire();
  if (!getted.length) no('12: uid が無いのにサーバへ訊かなかった');
  if (!r12.refused) no('12: サーバが行を返さないのに通した');
  if (postedFor(id12).length) no('12: 断ったあとで行を作りに行った');
  if (langOwnOf(id12)) no('12: 持ち主でないのに書いた人を書いた');
  say('12: uid の無い言語は、サーバが持ち主を答える（他人なら断る）');

  /* そして持ち主なら通り、そのとき uid が端末に残る ── 次からは訊かない。 */
  start();
  wire(); posted = []; getted = [];
  langId = 'old-lang';
  LANGS[langId] = { name: '前からある言語', mine: true };
  langRowGot(langId);
  langStore();
  const id12b = langId;
  langOwnGot(id12b, '');
  netOut(); arrive(A);
  netGet = (path, ok) => { getted.push(path); ok([{ id: 'old-lang' }]); };
  let r12b = askRow(id12b);
  unwire();
  if (r12b.refused) no('12: 持ち主が自分の言語を断られた');
  if (r12b.got !== 'old-lang') no('12: 持ち主にその言語の番号が渡らなかった');
  if (langOwnOf(id12b) !== A) no('12: 通ったのに書いた人が残っていない');
  say('12: 持ち主なら通り、uid が残るので次からは訊かない');

  /* ---- 13-14. 自分の言語が、サーバから降りてくる ------------------------
     「前のアカウント消えたんだが？」── 消えてはいなくて、戻る道が一本も
     ありませんでした。netLangSync() は **開いている** 言語しか見ず、それを
     索引（端末のもの）から見つけるので、端末に項目の無い言語は
     どうやっても届きませんでした。

     docs/DATA_SAFETY.md 第2則 ── 無いものを埋めて、止まる。ここで押さえるのは
     その「止まる」ほうです。埋めるだけなら簡単で、危ないのは勝つほうなので。 */
  start();
  netOut(); arrive(A);
  /* 端末には一つ、A の言語がある（番号はサーバーのもの、幹一本）。サーバは
     それと、もう一つ返す。 */
  langId = 'here-already';
  LANGS[langId] = { mine: true };
  langRowGot(langId);
  langOwnGot(langId, A);
  langStore();
  const keepId = langId;
  /* THIS LANGUAGE ALREADY HAS ITS WORDS AND HAS NO NAME SLICE, which is the
     pair the claim is about. Until 2026-09-04 a slice lived in localStorage
     and survived a launch, so netLangsDown() skipped a language whose id was
     already in the index and there was nothing to ask. **A slice is in memory
     now** (LSL in www/core.js): every launch starts with an index full of
     languages and not one word in any of them, so skipping by id would be the
     app showing somebody an empty dictionary and calling it theirs. What must
     still not happen is the server's copy landing ON a slice this phone is
     holding -- that is docs/DATA_SAFETY.md rule 2, and it is the half that
     loses somebody's afternoon. */
  slWr(langKeyOf(keepId, 'words'), '[{"hw":"うわがきされてはいけない"}]');
  slRm(langKeyOf(keepId, 'lang'));
  const keepWords = slRd(langKeyOf(keepId, 'words'));
  netGet = (path, ok) => {
    if (path.indexOf('/rest/v1/language?select=id,name') === 0)
      return ok([{ id: 'here-already', name: '上書きされてはいけない' },
                 { id: 'far-lang',      name: 'むこうの言語' }]);
    if (path.indexOf('/rest/v1/slice') === 0)
      return ok([{ kind: 'words', body: '[{"hw":"むこうの単語"}]', no: 3 },
                 { kind: 'lang',  body: 'むこうの言語', no: 3 }]);
    return ok([]);
  };
  let made = 0;
  netLangsDown((n) => { made = n; });
  /* The rows come down with the list; each language's slices when a page
     drawn from it is arrived at (www/net.js § netLangFill, `lang` in
     www/sns.js § WHAT EACH PAGE READS) -- so both are asked here, on the
     same stubs, the way arriving at each would ask them. */
  netLangFill(keepId, () => {}, () => {});
  netLangFill('far-lang', () => {}, () => {});
  netGet = realGet;

  if (made !== 1) no('13: 降ろした数が 1 でない — ' + made + '（既にある言語まで作った？）');
  if (langId !== keepId) no('13: 開いている言語が動いた — 立っていた場所が変わる');
  /* 名前は列の答えなので、降りてきた行が言うとおりになります（www/core.js
     § LNAME）── ここで「埋めて止まる」のはスライス、つまり人の仕事のほう。
     名前は人の仕事ではなく、サーバーが一つ持っている値です。 */
  if (langNameOf(keepId) !== '上書きされてはいけない')
    no('13: 既にある言語の名前が、降りてきた行のとおりになっていない — ' +
       JSON.stringify(langNameOf(keepId)));
  if (slRd(langKeyOf(keepId, 'words')) !== keepWords)
    no('13: 既にある言語の単語が上書きされた ── これが「勝つ」ほう。前 ' +
       JSON.stringify(String(keepWords).slice(0,40)) + ' → 後 ' +
       JSON.stringify(String(slRd(langKeyOf(keepId, 'words'))).slice(0,40)));
  /* AND THE OTHER HALF, which is the one 2026-09-04 added. A slice this phone
     does NOT have comes down, on a language it already knows about. Without
     it every launch is an empty dictionary. */
  if (slRd(langKeyOf(keepId, 'lang')) !== 'むこうの言語')
    no('13: 既にある言語の、欠けていたスライスが降りてこない ── ' +
       JSON.stringify(slRd(langKeyOf(keepId, 'lang'))) +
       '。写しがメモリになったので、その言語の画面に進むたびにこれが要る');
  say('13: 既にある言語は、持っているスライスを上書きされず、欠けているスライスが埋まる');

  /* 降りてきた言語の鍵は、その行の id そのものです（幹一本）。 */
  const far = LANGS['far-lang'] ? 'far-lang' : '';
  if (!far) no('14: サーバにあった言語が端末に作られなかった');
  else {
    if (langOwnOf(far) !== A) no('14: 降ろした言語に書いた人が付いていない');
    if (langWhose(far) !== LW_MINE) no('14: 降ろした言語が自分のものになっていない');
    if (slRd(langKeyOf(far, 'words')) !== '[{"hw":"むこうの単語"}]')
      no('14: 降ろした言語の単語が入っていない');
    if (slRd(langKeyOf(far, 'lang')) !== 'むこうの言語')
      no('14: 降ろした言語の名前スライスが入っていない');
  }
  say('14: 端末に無い自分の言語は、スライスごと降りてくる');

  /* 15. そして、降ろす先に既にスライスがあったら書かない。
     **索引には無いのに、その番号のスライスだけ残っている**端末 ── 索引を
     失った、あるいは古い版が残した鍵だけが在る（規則 22 の fallback が
     読むほう）。そこへ書けば、それは誰かの言語を消したことになります。

     2026-09-10 まで、ここは `langMint()` を握って「新しい言語はこの id に
     なる」と決めていました。番号が一本になったので握るものがありません ──
     降りてきた行の id がそのまま鍵で、その鍵の下に既に何かが在る、という
     のがこの形そのものです。検査が試験対象を作り直さなくなったぶん、問いは
     素直になりました。 */
  start();
  netOut(); arrive(A);
  const ORPH = 'far-2';
  slWr(langKeyOf(ORPH, 'words'), '[{"hw":"残っていた単語"}]');
  netGet = (path, ok) => {
    if (path.indexOf('/rest/v1/language?select=id,name') === 0)
      return ok([{ id: 'far-2', name: 'むこうの言語' }]);
    if (path.indexOf('/rest/v1/slice') === 0)
      return ok([{ kind: 'words', body: '[{"hw":"降りてきた単語"}]', no: 9 },
                 { kind: 'lang',  body: 'むこうの言語', no: 9 }]);
    return ok([]);
  };
  netLangsDown(() => {});
  netLangFill(ORPH, () => {}, () => {});
  netGet = realGet;

  if (slRd(langKeyOf(ORPH, 'words')) !== '[{"hw":"残っていた単語"}]')
    no('15: 端末に既にあったスライスが降りてきたもので上書きされた ── 「勝つ」ほう');
  if (slRd(langKeyOf(ORPH, 'lang')) !== 'むこうの言語')
    no('15: 無かったスライスが埋められていない ── 埋めて止まる、の埋めるほう');
  say('15: 降ろす先に既にあるスライスは書かない。無いものだけ埋める');

  /* ---- 16-18. プランはアカウントのもの --------------------------------
     「課金とアカウントとキーボードはアカウントに結びつく。
       じゃないとアカウント変えたら無限に言語作れるやん」OWNER 2026-09-01

     プランは plan() ── lingua.set、端末の設定 ── にあり、アカウントにも
     サーバーにも紐づいていませんでした。二台目で入れば無料から始まります。 */

  /* 16. 段はサーバーが答え、その答えがそのまま段になる。
     OWNER 2026-09-06「アカウントごとなんだから、違うアカウントで復元できるの
     おかしいだろ。検証して」、OWNER 2026-09-03「だから端末でやるわけねえだろ」。

     ここは 2026-09-06 まで「高いほうの段を採る」でした。端末とサーバーが
     食い違いうる前提の規則で、食い違えたのは端末が自分の段を書けたから
     です。書けなくなったので、食い違うものがありません ── 端末は署名付きの
     取引を送り、段は supabase/functions/verify-plan が決めます。 */
  start();
  netOut(); arrive(A);
  planGot('free');
  let sentP = null;
  const realSendP = netSend;
  netSend = (m, path, body, tok, ok) => {
    sentP = { path, body };
    if (path.indexOf('/functions/v1/verify-plan') === 0) return ok({ plan: 'pro' });
    return ok(null);
  };
  netPlanVerify(['J1'], () => {});
  netSend = realSendP;
  if (plan() !== 'pro') no('16: サーバーの答えが段にならない — ' + plan());
  if (!sentP || sentP.path.indexOf('/functions/v1/verify-plan') !== 0)
    no('16: 段を訊く先が函数ではない — ' + (sentP && sentP.path));
  if (!sentP || !sentP.body || (sentP.body.jws || []).join(',') !== 'J1')
    no('16: 上がっていくのが領収書ではない — ' + JSON.stringify(sentP && sentP.body));
  say('16: 段はサーバーが答え、上がるのは署名付きの取引だけ');

  /* 17. **失効も同じ一本の道で降りてくる。**ここは 2026-09-06 まで逆でした
     ── 「端末のほうが上なら取り上げない」。それは段を端末が決めていたから
     必要だった規則で、端末の `free` は「持っていない」と「読めなかった」の
     両方だったからです。サーバーの `free` は、検証できた取引が一つも生きて
     いないという意味しかありません。 */
  start();
  netOut(); arrive(A);
  planGot('pro');
  netSend = (m, path, body, tok, ok) => ok({ plan: 'free' });
  netPlanVerify([], () => {});
  netSend = realSendP;
  if (plan() !== 'free') no('17: 失効が降りてこない — ' + plan());
  say('17: 失効も同じ道で降りてくる');

  /* 18. そして**届かなかった答えは何も書かない。**これが 17 の裏で、
     取り違えると金を払った直後に free になります。
     「今課金したのに（仮）フリーになりましたって出たんだけど」OWNER
     2026-09-01。 */
  start();
  netOut(); arrive(A);
  planGot('pro');
  netSend = (m, path, body, tok, ok, bad) => bad(null, 0, 'no signal');
  netPlanVerify(['J1'], () => {});
  netSend = realSendP;
  if (plan() !== 'pro') no('18: 届かなかった答えが段を書き換えた — ' + plan());
  say('18: 届かなかった答えは何も書かない');

  /* ---- 19. 言語の数は、そのアカウントの言語を数える -------------------
     「じゃないとアカウント変えたら無限に言語作れるやん」 */
  start();
  netOut(); arrive(A);
  LANGS = {};
  LANGS['La'] = { name: 'A の1', mine: true };
  langOwnGot('La', A);
  LANGS['Lb'] = { name: 'A の2', mine: true };
  langOwnGot('Lb', A);
  LANGS['Lc'] = { name: 'B の1', mine: true };
  langOwnGot('Lc', B);
  LANGS['Ld'] = { name: '印の無い言語', mine: true };
  langStore();
  const asA = langCount();
  netOut(); arrive(B);
  const asB = langCount();
  /* 印の無い `Ld` は誰の数にも入りません。オンボーディングの歩きの途中
     （`SET.walked` が偽）だけが印の無い言語を自分のものと答える場所で、ここは
     アプリの中です ── 案件 35 がその両側を押さえます。 */
  if (asA !== 2) no('19: A から見た数が 2 でない（A の2つ）— ' + asA);
  if (asB !== 1) no('19: B から見た数が 1 でない（B の1つだけ）— ' + asB);
  if (asA === asB && asA === 4)
    no('19: 端末にある全部を数えている ── 他人の言語で上限が埋まる');
  say('19: 言語の数は、そのアカウントのものを数える（印の無いものは誰の数にも入らない）');

  /* ---- 20-21. 自己紹介はアカウントのもので、出すもの -------------------
     「自己紹介を見せないって選択肢を俺はいつ与えた？」OWNER 2026-09-01

     ME.bio は端末にしか無く、netMakeProfile() は handle と display と av
     だけを送っていました。だから人のページは、相手がどれだけ書いていても
     空の自己紹介を描いていました ── www/me.js が `bio:''` と書き込んで
     いたのは、列が無かったからです。 */

  /* 20. 人のページに、その人の自己紹介が載る。 */
  start();
  netOut(); arrive(A);
  let asked = '';
  netGet = (path, ok) => {
    asked += path + '\n';
    if (path.indexOf('/rest/v1/profile_seen') === 0)
      return ok([{ id: B, handle: 'iri', display: 'Iri',
                   av: null, bio: 'むこうの人が書いた一行' }]);
    return ok([]);
  };
  let who = null;
  netWho('iri', (w) => { who = w; }, () => {});
  netGet = realGet;
  if (asked.indexOf('bio') < 0) no('20: 人のプロフィールを bio 抜きで訊いている');
  if (!who) no('20: 人が返ってこなかった');
  else if (who.bio !== 'むこうの人が書いた一行')
    no('20: 人のページに自己紹介が載らない — ' + JSON.stringify(who && who.bio));
  say('20: 人のページに、その人の自己紹介が載る');

  /* 21. 自己紹介・リンク・場所は `profile` の三列だけが答え。
     「端末に残すものないんですけど。サーバーで同じ機能になるように代替して」
     OWNER 2026-09-08。

     ~~`netProfSync()`~~ は欄ごとに両側を訊いて、**食い違えば端末を上げて**いま
     した。だから二台が別々の一行を持ち、あとで起動したほうが相手のを黙って
     上書きし、どちらが勝ったかは誰にも言えませんでした ── 規則 22 の例外が
     一つ、木に立っていた形です。

     **列は五つで、名前と @ もその一つ**（2026-09-11）。ここは「三列」と
     書いてありましたが、名前と @ は保存でサーバーへ行かず端末に書かれて
     終わっていました（hunt 道7、67番）。上がる以上は降りてもきます ──
     一方通行が二台のあいだで食い違う、というのがこの節そのものの話なので。

     四本訊きます:
     1. 行が言うとおりになる ── 端末が違うことを持っていても
     2. この道は一本も送らない（PATCH ゼロ）
     3. 行が無ければ何も書き換えない（「行が無い」は「空の自己紹介」ではない）
     4. 編集は PATCH が通ってから ME に入り、落ちれば一字も入らない */
  start();
  netOut(); arrive(A);
  /* 列は `PROF_MINE` が名乗ります（www/net.js）── ここで書き下すと、欄が
     一つ増えた日にこの stub が黙って外れて、代わりに `ok([])` が返り、
     「行が無い」の枝を測ってしまいます。 */
  const PROF_SEL = '/rest/v1/profile?select=' + profCols();
  ME.bio = ''; ME.link = ''; ME.loc = ''; saveMe();
  netGet = (path, ok) => {
    if (path.indexOf(PROF_SEL) === 0)
      return ok([{ bio: 'アカウントに書いてあった一行',
                   link: 'tokinets.com', loc: '谷' }]);
    return ok([]);
  };
  netMyProfile(function () {}, function () {});
  netGet = realGet;
  if (ME.bio !== 'アカウントに書いてあった一行')
    no('21: アカウントの自己紹介を取っていない — ' + JSON.stringify(ME.bio));
  if (ME.link !== 'tokinets.com')
    no('21: アカウントのリンクを取っていない — ' + JSON.stringify(ME.link));
  if (ME.loc !== '谷')
    no('21: アカウントの場所を取っていない — ' + JSON.stringify(ME.loc));

  /* 端末が違うことを持っていても、行が勝つ。そして一本も送らない。 */
  ME.bio = 'この端末で書いた一行'; ME.link = 'lingua.example'; ME.loc = '';
  saveMe();
  let patched21 = null;
  const realSend21 = netSend;
  netGet = (path, ok) => {
    if (path.indexOf(PROF_SEL) === 0)
      return ok([{ bio: 'サーバーの一行', link: '', loc: 'サーバーの場所' }]);
    return ok([]);
  };
  netSend = (method, path, body) => { if (method === 'PATCH') patched21 = body || {}; };
  netMyProfile(function () {}, function () {});
  netGet = realGet; netSend = realSend21;
  if (patched21)
    no('21: 起動の読み込みが端末のものを上げにいった — ' + JSON.stringify(patched21));
  if (ME.bio !== 'サーバーの一行' || ME.loc !== 'サーバーの場所' || ME.link !== '')
    no('21: 行の言うとおりになっていない — ' +
       JSON.stringify([ME.bio, ME.link, ME.loc]));

  /* 行が無い ── まだ扉の最後の一段の前。空の自己紹介ではないので、
     写しは一字も触らない。 */
  ME.bio = '前からある一行'; ME.link = 'a.example'; ME.loc = 'どこか'; saveMe();
  netGet = (path, ok) => ok([]);
  netMyProfile(function () {}, function () {});
  netGet = realGet;
  if (ME.bio !== '前からある一行' || ME.link !== 'a.example' || ME.loc !== 'どこか')
    no('21: 行が無いのを「空の自己紹介」と読んで、写しを消した — ' +
       JSON.stringify([ME.bio, ME.link, ME.loc]));

  /* 編集。通ってから入り、落ちれば一字も入らない。 */
  let sent21 = null, letGo21 = null;
  netSend = (method, path, body, tok, ok2) => {
    if (method === 'PATCH'){ sent21 = body || {}; letGo21 = () => ok2([]); }
  };
  let saved21 = 'まだ';
  meKeepSave({ bio: '打った一行' }, (okk) => { saved21 = okk; });
  if (!sent21 || sent21.bio !== '打った一行')
    no('21: 編集が PATCH を出していない — ' + JSON.stringify(sent21));
  if (ME.bio !== '前からある一行')
    no('21: 答えが戻る前に写しへ入った — ' + JSON.stringify(ME.bio));
  if (letGo21) letGo21();
  if (ME.bio !== '打った一行')
    no('21: 通ったのに写しへ入っていない — ' + JSON.stringify(ME.bio));
  if (saved21 !== true) no('21: 通ったのに保存が済んだと言っていない');

  netSend = (method, path, body, tok, ok2, bad2) => {
    if (method === 'PATCH') bad2(null, 0, 'down');
  };
  saved21 = 'まだ';
  meKeepSave({ bio: '落ちる一行', name: 'この名前も入らない' },
             (okk) => { saved21 = okk; });
  if (ME.bio !== '打った一行')
    no('21: 落ちたのに自己紹介が入った — ' + JSON.stringify(ME.bio));
  if (ME.name === 'この名前も入らない')
    no('21: 落ちたのに隣の名前だけ入った ── 保存は一回の押下で、半分の保存は保存ではない');
  if (saved21 !== false) no('21: 落ちたのに保存が済んだと言っている');
  netSend = realSend21;
  say('21: 名前・@・自己紹介・リンク・場所は profile の五列だけ ── 起動の読み込みは' +
      '一本も送らず、行が無ければ写しを触らず、編集は通ってから入る');

  /* ---- 21b. そしてそれが画面に出る --------------------------------------
     「プロフィールにリンクと場所が出ない」OWNER 2026-09-08、実機 143。

     打つ欄はあり、`ME.link`/`ME.loc` に入り、端末に残っていました。**描く所が
     無かった**だけです ── 自分の頁も他人の頁も `bio` までしか描いていません
     でした。上の 21 は「サーバーへ行くか」で、これは「見えるか」。二つは別の
     主張で、片方が緑でももう片方は赤になり得ます（実機がそうでした）。

     空なら行ごと出ないことも一緒に訊きます ── 「何も無い」に空の行を描くのは
     アプリが言われていないことを言うことなので。 */
  start();
  netOut(); arrive(A);
  ME.link = ''; ME.loc = ''; saveMe();
  const bare = meCard();
  /* 空の `<div class="pbio"></div>` を探します ── 「行が出ていない」は
     `<span>` や `<a>` が無いことではなく、**行そのものが無い**ことなので。
     中身で訊くと、空の行が出ていても緑になります（赤を見て直しました）。 */
  const bareHit = /<div class="pbio">\s*<\/div>/.exec(bare);
  if (bareHit)
    no('21b: 空なのに場所とリンクの行が出ている — ' +
       JSON.stringify(bare.slice(Math.max(0, bareHit.index - 30),
                                 bareHit.index + bareHit[0].length + 10)));
  ME.link = 'tokinets.com'; ME.loc = '谷の上'; saveMe();
  const mine21 = meCard();
  if (mine21.indexOf('谷の上') < 0)
    no('21b: 自分の頁に場所が出ない');
  if (mine21.indexOf('tokinets.com') < 0)
    no('21b: 自分の頁にリンクが出ない');
  if (mine21.indexOf('href="https://tokinets.com"') < 0)
    no('21b: 自分の頁のリンクが押せない（Safari へ渡す href が無い）');
  if (mine21.indexOf('border-radius') >= 0)
    no('21b: 角丸を足している');

  /* 他人の頁。netWhoRow() が降ろした二つを whoCard() が描くか。 */
  WHO_HAVE['むこう'] = netWhoRow({ display: 'むこうの人', handle: 'むこう',
                                   bio: 'あちらの一行',
                                   link: 'https://elsewhere.example',
                                   loc: '海のそば' });
  const theirs21 = whoCard('むこう');
  if (theirs21.indexOf('海のそば') < 0)
    no('21b: 人の頁に場所が出ない');
  if (theirs21.indexOf('elsewhere.example') < 0)
    no('21b: 人の頁にリンクが出ない');
  if (netWhoRow({ link: 'x' }).link !== 'x')
    no('21b: netWhoRow がリンクを落としている');
  if (NET_WHO_SEL.indexOf('link') < 0 || NET_WHO_SEL.indexOf('loc') < 0)
    no('21b: 人を訊く select に link と loc が無い — ' + NET_WHO_SEL);
  delete WHO_HAVE['むこう'];
  say('21b: リンクと場所が、自分の頁にも人の頁にも出る（空なら行ごと出ない）');

  /* ---- 22. 人の言語に、住所と、扉が開いているかが付く ------------------
     「当たり前だけどsnsとして機能してない」OWNER 2026-09-01

     netLangNames() は `{持ち主: 名前}` を返していました。名前は、他人の言語に
     ついて**唯一なにも出来ないもの**です ── そこからページへ行けないし、
     公開されている言語とされていない言語の区別も付きません。どちらも
     `language` の列（`id` と `published_at`）で、訊いていなかっただけです。 */
  start();
  netOut(); arrive(A);
  let who22Path = '';
  let langAsked = 0;
  netGet = (path, ok) => {
    if (path.indexOf('/rest/v1/language') === 0) langAsked++;
    if (path.indexOf('/rest/v1/profile_seen') === 0) {
      who22Path = path;
      return ok([{ id: B, handle: 'iri', display: 'Iri', av: null, bio: '',
                   lang_id: 'lang-id-1', lang_name: 'むこうの言語',
                   lang_pub: true }]);
    }
    return ok([]);
  };
  let w2 = null;
  netWho('iri', (w) => { w2 = w; }, () => {});
  netGet = realGet;
  /* 同じ行で来る ── 言語のために二本目を出さない。
     「なんか全体的に遅くない？」OWNER 2026-09-08、supabase/schema.sql の
     profile_seen が繋いでいます。 */
  if (who22Path.indexOf('lang_pub') < 0)
    no('22: 人の行に扉の印を訊いていない — ' + who22Path);
  if (langAsked)
    no('22: 言語をもう一往復して訊いている — ' + langAsked + ' 本');
  if (!w2) no('22: 人が返ってこなかった');
  else {
    if (w2.lname !== 'むこうの言語') no('22: 言語の名前が壊れた — ' + JSON.stringify(w2.lname));
    if (w2.lid !== 'lang-id-1') no('22: 言語の住所が付いていない — 行き先が無い');
    if (w2.lpub !== true) no('22: 扉が開いている印が付いていない');
  }
  say('22: 人の言語に、名前と住所と、扉が開いているかが付く');

  /* そして公開されていない言語は、開いていないと言う。 */
  start();
  netOut(); arrive(A);
  netGet = (path, ok) => {
    if (path.indexOf('/rest/v1/profile_seen') === 0)
      return ok([{ id: B, handle: 'iri', display: 'Iri', av: null, bio: '',
                   lang_id: 'lang-id-2', lang_name: '非公開',
                   lang_pub: false }]);
    return ok([]);
  };
  let w3 = null;
  netWho('iri', (w) => { w3 = w; }, () => {});
  netGet = realGet;
  if (w3 && w3.lpub !== false)
    no('22: 非公開の言語が開いていることになっている — slice_read が断る扉を出す');
  say('22: 非公開の言語は、開いていないと言う');

  /* ---- 23. いいね・リポスト・返信の数が、読み戻ってくる ----------------
     「当たり前だけどsnsとして機能してない」OWNER 2026-09-01

     netMark() は react に行を入れて消していましたが、react を読む GET は
     アプリのどこにも一本もありませんでした。押した端末の中だけで数が
     増え、他の端末は何も見ず、押した端末も忘れたら終わりでした。
     feed_hot() は並べるために数えていて、その数を捨てていました。 */
  start();
  netOut(); arrive(A);
  const realSend2 = netSend;
  let feedCall = '';
  /* ブロックの一覧は、セッションが始まった一回で手元に来ています
     （www/net.js § netBlocked、2026-09-05）── タイムラインを引くたびに
     訊いていたのをやめ、一本先に出しておく形にしました。ここで空にして
     おくのは、タイムラインが訊かれる時の実際の状態がこれだからです。
     置かないと、arrive() が出した本物の問い合わせが空中にある間に
     netFeed() の返事が待ち行列に入り、この検査は同期で読みます。 */
  NET_BL = [];
  netGet = (path, ok) => ok([]);
  netSend = (method, path, body, tok, ok2) => {
    feedCall = path;
    ok2([{ id: 'p1', author: B, created_at: '2026-08-30T00:00:00Z',
           body: { ln: 'むこうの投稿' }, likes: 7, boosts: 2,
           replies: 3, i_like: true, i_boost: false }]);
  };
  let feed = null;
  netFeed('fo', (rows) => { feed = rows; }, () => {});
  netGet = realGet; netSend = realSend2;

  if (feedCall.indexOf('feed_fo') < 0)
    no('23: フォロー中を feed_fo に訊いていない — ' + feedCall);
  if (!feed || !feed.length) no('23: 投稿が返ってこなかった');
  else {
    const p1 = feed[0];
    if (p1.nlike !== 7)  no('23: いいねの数が載らない — ' + p1.nlike);
    if (p1.nboost !== 2) no('23: リポストの数が載らない — ' + p1.nboost);
    if (p1.nreply !== 3) no('23: 返信の数が載らない — ' + p1.nreply);
    if (p1.ilike !== true)   no('23: 自分がいいねしたことが載らない');
    if (p1.iboost !== false) no('23: 自分がリポストしていないことが載らない');
  }
  say('23: いいね・リポスト・返信の数と、自分がしたかが読み戻る');

  /* そして「言われていない」と「0」は別。古い行、数を持たない一覧から来た
     投稿が「0 いいね」を名乗ると、それは言われていないことを言っています。 */
  start();
  netOut(); arrive(A);
  netGet = (path, ok) => ok([]);
  netSend = (method, path, body, tok, ok2) => {
    ok2([{ id: 'p2', author: B, created_at: '2026-08-30T00:00:00Z',
           body: { ln: '数の無い行' } }]);
  };
  let feed2 = null;
  netFeed('fo', (rows) => { feed2 = rows; }, () => {});
  netGet = realGet; netSend = realSend2;
  if (feed2 && feed2.length && feed2[0].nlike !== undefined)
    no('23: サーバが言っていないのに数を名乗っている — ' + feed2[0].nlike);
  say('23: 言われていない数は、0 ではなく無い');

  /* ---- 24. 人のページのフォロー数・フォロワー数 -------------------------
     どちらも、誰のページでも、いつも 0 でした。www/me.js のコメントが
     そう書いています ──「Neither is on `profile` at all -- see netWho()」。
     本当でした: follow は netFollow() が書き、読み戻すのは**自分について
     だけ**（follower=eq.自分 / followed=eq.自分）だったので、他人の二つの
     数には出どころがありませんでした。 */
  start();
  netOut(); arrive(A);
  let whoPath = '';
  netGet = (path, ok) => {
    if (path.indexOf('/rest/v1/profile_seen') === 0) {
      whoPath = path;
      return ok([{ id: B, handle: 'iri', display: 'Iri', av: null,
                   bio: '一行', fo: 12, fr: 34 }]);
    }
    return ok([]);
  };
  let w4 = null;
  netWho('iri', (w) => { w4 = w; }, () => {});
  netGet = realGet;
  if (!whoPath) no('24: profile_seen を訊いていない — 数の出どころが無い');
  if (whoPath.indexOf('fo') < 0 || whoPath.indexOf('fr') < 0)
    no('24: 二つの数を訊いていない — ' + whoPath);
  if (!w4) no('24: 人が返ってこなかった');
  else {
    if (w4.fo !== 12) no('24: フォロー数が載らない — ' + w4.fo);
    if (w4.fr !== 34) no('24: フォロワー数が載らない — ' + w4.fr);
  }
  say('24: 人のページに、フォロー数とフォロワー数が載る');

  /* そしてここでも、言われていないことは 0 ではありません。 */
  start();
  netOut(); arrive(A);
  netGet = (path, ok) => {
    if (path.indexOf('/rest/v1/profile_seen') === 0)
      return ok([{ id: B, handle: 'iri', display: 'Iri', av: null, bio: '' }]);
    return ok([]);
  };
  let w5 = null;
  netWho('iri', (w) => { w5 = w; }, () => {});
  netGet = realGet;
  if (w5 && w5.fo !== undefined)
    no('24: サーバが言っていないのにフォロー数を名乗っている — ' + w5.fo);
  say('24: 言われていないフォロー数は、0 ではなく無い');

  /* ---- 25. 人がリポストしたものが、タイムラインに出る ------------------
     リポストは react の行で、投稿ではありません。フォロー中のタイムラインは
     `author = フォローしている人`だったので、**リポストは誰のタイムラインにも
     何もしていませんでした** ── 行は入り、数は増え、指している投稿は、
     もともと見る人以外の誰にも届かない。それはリポストではありません。 */
  start();
  netOut(); arrive(A);
  let sentBody = null, sentPath = '';
  /* 23 と同じ理由 ── ブロックの一覧は起動の一回で手元にあります。 */
  NET_BL = [];
  netGet = (path, ok) => ok([]);
  netSend = (method, path, body, tok, ok2) => {
    sentPath = path; sentBody = body;
    ok2([{ id: 'p9', author: 'someone-else', created_at: '2021-01-01T00:00:00Z',
           body: { ln: '五年前の投稿' }, likes: 0, boosts: 1, replies: 0,
           i_like: false, i_boost: false,
           by: B, at_key: '2026-09-01T06:00:00Z' }]);
  };
  let feed3 = null;
  netFeed('fo', (rows) => { feed3 = rows; }, () => {});
  netGet = realGet; netSend = realSend2;

  if (sentPath.indexOf('feed_fo') < 0) no('25: feed_fo を呼んでいない');
  if (!feed3 || !feed3.length) no('25: 投稿が返ってこなかった');
  else {
    const p9 = feed3[0];
    if (p9.by !== B) no('25: 誰がリポストしたかが載らない — ' + p9.by);
    if (!p9.arrived) no('25: 届いた時刻が載らない');
    if (p9.arrived <= p9.at)
      no('25: 五年前の投稿が、書かれた時刻で並ぶ ── 誰もそこまでスクロールしない');
  }
  say('25: 人がリポストしたものが、届いた時刻で、誰が回したか付きで出る');

  /* そして自分で書いた投稿には by が付きません ── 「誰も回していない」と
     「この一覧はその問いに答えない」は別で、null を名乗ると発明になります。 */
  start();
  netOut(); arrive(A);
  netGet = (path, ok) => ok([]);
  netSend = (method, path, body, tok, ok2) => {
    ok2([{ id: 'p10', author: B, created_at: '2026-09-01T00:00:00Z',
           body: { ln: '本人が書いた' }, by: null }]);
  };
  let feed4 = null;
  netFeed('fo', (rows) => { feed4 = rows; }, () => {});
  netGet = realGet; netSend = realSend2;
  if (feed4 && feed4.length && feed4[0].by !== undefined)
    no('25: 本人が書いた投稿に by が付いている — ' + JSON.stringify(feed4[0].by));
  say('25: 本人が書いた投稿には、回した人が付かない');

  /* ---- 26. Google の nonce ── 両側揃うか、両側無いか --------------------
     「Passed nonce and nonce in id_token should either both exist or not」
     オーナーの端末、Google を押して、ビルド #106。

     Supabase は provider で分岐せず（token_oidc.go:294-306）、**送られた
     nonce を SHA-256 して id_token の nonce クレームと比べ**、片側だけ在る
     ときは断ります。このアプリは両側とも送っていなかったので、それはそれで
     揃っていました ── **Apple がいま通っているのがその証明です。**
     Google のトークンにだけ、誰かが nonce クレームを付けていました。

     こちらが握れば、誰が付けていようと中身はこちらのものになります。
     ここで押さえるのは、その**二つが一つの組であること**です ── 別々に
     引かれたら、直したはずの不具合そのものになります。 */
  const realSha = netSha256;
  start();
  netOut();
  const seen = { apple:null, google:null };
  const fakePlugin = {
    initialize: (o) => ({ then: (f) => { f(); return { catch: () => {} }; } }),
    login: (arg) => {
      seen[arg.provider] = { opts: arg.options };
      return { then: (f) => { f({ result: { idToken: 'h.e.s' } });
                              return { catch: () => {} }; } };
    }
  };
  window.Capacitor = { Plugins: { SocialLogin: fakePlugin } };
  OB_SL = false;
  const realId = netIdToken;
  netIdToken = (provider, token, nonce) => { seen[provider].sent = nonce; };

  obSignInGoogle();
  obSignInApple();
  netIdToken = realId;
  delete window.Capacitor;

  /* Google: 両側在って、送るのは生、渡すのはその sha256。 */
  const G = seen.google;
  if (!G) no('26: Google の login が呼ばれていない');
  else {
    if (!G.opts || !G.opts.nonce) no('26: Google に nonce を渡していない');
    if (!G.sent) no('26: Supabase に nonce を送っていない ── 片側だけになる');
    if (G.opts && G.sent && G.opts.nonce !== realSha(G.sent))
      no('26: 渡した hash が、送った raw の sha256 ではない ── 二つが別の組');
  }
  say('26: Google は両側に nonce があり、渡す hash は送る raw の sha256');

  /* Apple: 一行も変わっていない。片側だけ足すのがこの不具合そのものなので、
     いま通っている道に足していないことを押さえます。 */
  const AP = seen.apple;
  if (!AP) no('26: Apple の login が呼ばれていない');
  else {
    if (AP.opts && AP.opts.nonce) no('26: Apple に nonce を渡している ── いま通っている道を壊す');
    if (AP.sent) no('26: Apple の nonce を Supabase に送っている ── 片側だけになる');
  }
  say('26: Apple は両側とも無いまま ── 通っている道は触っていない');

  /* そして毎回ちがう。使い回した nonce は nonce ではありません。 */
  const n1 = netNonce(), n2 = netNonce();
  if (n1.raw === n2.raw) no('26: nonce が使い回されている');
  if (n1.hash !== realSha(n1.raw)) no('26: netNonce() の二つが組になっていない');
  if (!/^[0-9a-f]{64}$/.test(n1.hash)) no('26: hash が sha256 の形をしていない — ' + n1.hash);
  /* NIST の公表値。書き出した SHA-256 が SHA-256 であること。 */
  if (realSha('') !== 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    no('26: sha256("") が NIST の値と違う');
  if (realSha('abc') !== 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    no('26: sha256("abc") が NIST の値と違う');
  say('26: nonce は毎回ちがい、SHA-256 は NIST の値と一致する');

  /* ---- 27. 入り直したその場で、自分の言語が降りてくる ------------------
     boot.js も netLangsDown() を呼びますが、それは**起動時**です。人が
     サインインするのは起動のあとなので、扉を抜けた画面には**その端末が
     持っている言語**が出たまま、アプリを閉じて開き直すまで自分のものは
     一つも出ませんでした。 */
  start();
  netOut();
  let camedown = 0;
  const realDown = netLangsDown;
  netLangsDown = () => { camedown++; };
  const realProf = netMyProfile;
  netMyProfile = (ok2) => ok2({ handle: 'lingua2', display: 'Lingua' });
  arrive(A);
  obIn();
  netMyProfile = realProf; netLangsDown = realDown;
  if (!camedown) no('27: 入り直しても、アカウントの言語を降ろしに行かない');
  say('27: 入り直したその場で、アカウントの言語が降りてくる');

  /* ---- 28. サインアウトは、provider にも伝わる ------------------------
     「あと違うアカウントでログインしてんのに前のやつ出てくるんだけど？」
     OWNER 2026-08-31 ── 言語はその半分（端末のものなので、net.js が持ち主を
     訊くようにしました）。これがもう半分です。

     netOut() が外すのは Lingua のトークン二つだけで、**social provider 自身の
     セッションはプラグインのもので、生き残ります。**だから次に Google を
     押すと、誰にも何も訊かずに同じアカウントが返ってきて、
     「サインアウトして別のアカウントで入る」という道が存在しませんでした。
     www/ 全体で SocialLogin は obSocial() の一箇所だけに現れ、logout は
     どこからも呼ばれていませんでした。 */
  /* 押す道を通します。setSignOut() はポップを開くだけになりました ──
     「ログアウトしますか？みたいなポップつけてほしい」OWNER 2026-09-02 ──
     ので、はいを押すところまでが「サインアウトする」です。ここを
     setSignOutGo() の直呼びにすると、ポップが壊れても緑のままになります。 */
  const signOutNow = () => {
    setSignOut();
    let yes = null;
    Array.prototype.slice.call(document.querySelectorAll('#pop button'))
      .forEach((b) => { if (b.getAttribute('data-do') === 'popYes') yes = b; });
    if (!yes) { no('28: ログアウトの問いが出ない'); return; }
    yes.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  };
  start();
  const told = [];
  window.Capacitor = { Plugins: { SocialLogin: {
    logout: (arg) => { told.push(arg && arg.provider); return { catch: () => {} }; }
  } } };
  OB_SL = true;
  signOutNow();
  delete window.Capacitor;
  if (told.indexOf('google') < 0) no('28: サインアウトが Google に伝わっていない');
  if (told.indexOf('apple') < 0) no('28: サインアウトが Apple に伝わっていない');
  if (OB_SL) no('28: 次の押下で configure し直さない ── 忘れろと言った相手を信じている');
  if (netSignedIn()) no('28: そもそもサインアウトできていない');
  say('28: サインアウトは provider にも伝わる（両方）');

  /* そして、伝えられなくてもサインアウトは止まりません。人は出ていくところで、
     プラグインが無いことも、logout が無いことも、拒まれることも、
     引き止める理由にはなりません。 */
  start();
  window.Capacitor = { Plugins: { SocialLogin: {
    logout: () => { throw new Error('nope'); }
  } } };
  let threw = false;
  try { signOutNow(); } catch (e) { threw = true; }
  delete window.Capacitor;
  if (threw) no('28: provider が拒んだらサインアウトが落ちる');
  if (netSignedIn()) no('28: provider が拒んだらサインアウトできない');

  start();
  window.Capacitor = { Plugins: {} };          /* プラグインが無いビルド */
  let threw2 = false;
  try { signOutNow(); } catch (e) { threw2 = true; }
  delete window.Capacitor;
  if (threw2) no('28: プラグインが無いとサインアウトが落ちる');
  if (netSignedIn()) no('28: プラグインが無いとサインアウトできない');
  say('28: 伝えられなくても、サインアウトは止まらない');

  /* ---- 29. 通知のまとめは二通りあり、両方が届く ------------------------
     オーナーが見せてきた形は二つで、サーバーは片方しか作っていませんでした:

       同じ投稿に何人か  → 一行（「A と B がいいねしました」）  ← 前から在った
       同じ人が何件かに  → 一行（「A が2件にいいねしました」）  ← 無かった

     何人か（n）と何件か（np）は別の数で、片方からもう片方は出ません。
     画面が文を選ぶのに両方要ります。 */
  start();
  netOut(); arrive(A);
  netSend = (method, path, body, tok, ok2) => {
    if (path.indexOf('/rest/v1/rpc/notices') === 0)
      return ok2([
        { kind:'like', at:'2026-08-30T00:00:00Z', hd:'iri', who:'Iri',
          av:null, post:'p1', n:2, np:1,
          more:[{ hd:'veth', who:'Veth', av:null }] },
        { kind:'like', at:'2026-08-29T00:00:00Z', hd:'kai', who:'Kai',
          av:null, post:'p9', n:1, np:3, more:[] },
        { kind:'follow', at:'2026-08-28T00:00:00Z', hd:'one', who:'One',
          av:null, post:null }        /* np を言わない古いサーバー */
      ]);
    return ok2([]);
  };
  let notes = null;
  netNotices((rows) => { notes = rows; }, () => {});
  netSend = realSend2;

  if (!notes || notes.length !== 3) no('29: 通知が三行返ってこなかった');
  else {
    if (notes[0].n !== 2)  no('29: 何人かが載らない — ' + notes[0].n);
    if (notes[0].np !== 1) no('29: 一つの投稿の行が np=1 になっていない — ' + notes[0].np);
    if (notes[0].more.length !== 1) no('29: もう一人が落ちている');
    if (notes[1].np !== 3) no('29: 何件かが載らない — ' + notes[1].np);
    if (notes[1].n !== 1)  no('29: 一人の行が n=1 になっていない — ' + notes[1].n);
    /* np を言わないサーバーからの行は 1。0 ではなく、欠けてもいない ──
       そのサーバーが作れる行はどれも一つの投稿についてのもの。 */
    if (notes[2].np !== 1) no('29: np を言わないサーバーの行が 1 になっていない — ' + notes[2].np);
  }
  say('29: 通知は「何人か」と「何件か」を別々に持って届く');

  /* ---- 30. フォロー中／フォロワーの一覧が、人のぶんも訊ける -------------
     follow は誰についても書かれるのに、読み戻すのは**自分のぶんだけ**でした
     ── どの要求も follower=eq.<自分> か followed=eq.<自分> です。だから
     人のページは**何人か**は言えるようになっても（profile_seen が数える）、
     **誰か**を訊く道がまだ無く、数を押しても行き先がありませんでした。 */
  start();
  netOut(); arrive(A);
  let asked2 = [];
  netGet = (path, ok) => {
    asked2.push(path);
    if (path.indexOf('/rest/v1/profile?select=id') === 0)
      return ok([{ id: B }]);
    if (path.indexOf('/rest/v1/follow_seen?select=followed_handle') === 0)
      return ok([{ followed_handle: 'kai' }]);
    if (path.indexOf('/rest/v1/follow_seen?select=follower_handle') === 0)
      return ok([{ follower_handle: 'veth' }]);
    return ok([]);
  };

  /* 自分のぶん ── 今までどおり、引数を足しても呼び出し側は変わらない。 */
  asked2 = [];
  let mineFo = null;
  netFollowing((r) => { mineFo = r; }, () => {});
  if (!mineFo || mineFo[0] !== 'kai') no('30: 自分のフォロー中が返らなくなった');
  if (asked2.join('\n').indexOf('follower=eq.' + A) < 0)
    no('30: 自分のぶんが自分の uid で訊かれていない');

  /* 人のぶん ── ハンドルから uid を引いて、その人について訊く。 */
  asked2 = [];
  let hisFo = null;
  netFollowing((r) => { hisFo = r; }, () => {}, 'iri');
  const j2 = asked2.join('\n');
  /* ハンドルのまま訊く ── uuid を引き当てる一往復が先にあったのを、
     `follow_seen`（supabase/schema.sql）で消しました。
     「なんか全体的に遅くない？」OWNER 2026-09-08。 */
  if (j2.indexOf('follower_handle=eq.iri') < 0)
    no('30: 人のフォロー中を、その人のハンドルで訊いていない — ' + j2);
  if (j2.indexOf('/rest/v1/follow_seen?select=followed_handle') < 0)
    no('30: フォロー中が follow_seen から来ていない — ' + j2);
  if (!hisFo || hisFo[0] !== 'kai') no('30: 人のフォロー中が返らない');

  asked2 = [];
  let hisFr = null;
  netFollowers((r) => { hisFr = r; }, () => {}, 'iri');
  if (asked2.join('\n').indexOf('followed_handle=eq.iri') < 0)
    no('30: 人のフォロワーを、その人のハンドルで訊いていない');
  if (!hisFr || hisFr[0] !== 'veth') no('30: 人のフォロワーが返らない');
  /* 一本 ── 一覧そのものだけ。「その人は居るのか」を別に訊いていたのを
     やめました（30e）。 */
  if (asked2.length !== 1)
    no('30: 人のフォロワーが一本で訊かれていない — ' + asked2.length + ' 本');

  /* 答えは二つしかありません ── 一覧か、落ちたか。「居ない人」に三つ目を
     割り当てていたのが、永遠にくるくるの元でした（30e）。居ないハンドルを
     フォローしている人は居ないので、空の一覧は正しい答えです。 */
  netGet = (path, ok) => ok([]);
  let gone2 = 'untouched';
  netFollowers((r) => { gone2 = r; }, () => {}, 'nobody');
  if (!gone2 || gone2.length !== 0)
    no('30: 居ないハンドルのフォロワーが空の一覧で返らない — ' + JSON.stringify(gone2));
  netGet = realGet;
  say('30: フォロー中／フォロワーは、人のぶんも訊ける（自分のぶんは今までどおり）');

  /* ---- 30b. 押した瞬間に、その人のフォロワーが動く ----------------------
     「フォローしたのにその人のフォロワーにすぐ出ないよ？」OWNER 2026-09-02。

     ボタンは押した瞬間に変わる（いいねと同じで、サーバーは待たない）。その
     下の数字は変わらなかった ── あれは `profile_seen` の `fr` で、netWho()
     が持ってきたきりだから。一度の押下で、同じことについての二つが画面に
     あって、片方だけ動いていた。

     数えていない数は 0 ではない。誰も取っていない数に 1 を足すと、取った
     ことになる ── whoOf() が undefined を undefined のまま残すのと同じ話。 */
  const realFollow = netFollow, realWho30 = netWho;
  /* 返事は握っておきます ── 押した「瞬間」の画面はここでしか読めません。 */
  let letGo = null, askedWho = 0;
  netFollow = (h, on, ok2) => { letGo = () => ok2(); };
  netWho = (h, ok2) => { askedWho++;
    ok2({ who:'Iri', hd:h, av:null, lname:'Vethi', bio:'', fo:0, fr:4, out:false }); };
  WHO_HAVE['iri'] = { who:'Iri', hd:'iri', av:null, lname:'Vethi', bio:'',
                      fo:0, fr:3, out:false };
  folPut(false, meHandle(), []);
  meFollow('iri');
  if (meFollows('iri'))
    no('30b: 答えが戻る前にフォローしたことになっている');
  if (WHO_HAVE['iri'].fr !== 3)
    no('30b: 答えが戻る前に相手のフォロワーが動いた — ' + WHO_HAVE['iri'].fr);
  if (letGo) letGo();
  if (!meFollows('iri'))
    no('30b: 答えが戻ってもフォローになっていない');
  if (!askedWho)
    no('30b: 答えのあとに相手を訊き直していない ── 数はサーバーが数える');
  if (WHO_HAVE['iri'].fr !== 4)
    no('30b: 相手のフォロワーがサーバーの答えになっていない — ' + WHO_HAVE['iri'].fr);
  /* 外す。同じ形で、戻ってから外れる。 */
  letGo = null;
  meFollow('iri');
  if (!meFollows('iri')) no('30b: 答えが戻る前に外れた');
  if (letGo) letGo();
  if (meFollows('iri')) no('30b: 答えが戻っても外れていない');
  /* 落ちたら何も動かない。 */
  netFollow = (h, on, ok2, bad2) => { bad2(null, 0, 'down'); };
  const wasFo30 = meFollows('kai');
  meFollow('kai');
  if (meFollows('kai') !== wasFo30)
    no('30b: 落ちたのにフォローが動いた — ' + meFollows('kai'));
  netFollow = realFollow; netWho = realWho30;
  say('30b: Follow は答えが戻ってから動き、相手の数はサーバーに訊き直す ── ' +
      '落ちれば何も動かない');

  /* ---- 30c. その画面が、人のぶんを出す ----------------------------------
     「フォロワーとかタップしても見れないし」OWNER 2026-09-03。

     30 はサーバーへの道を持っています ── `netFollowing()` と
     `netFollowers()` はハンドルを最後の引数に取り、その道を書いた
     セッションは「これを渡す画面は www/me.js のもので、うちの領域では
     ない」と自分のコメントに書いて置いていきました。**誰も渡して
     いませんでした。**だから人のページの二つの数は「何人か」だけを言う
     `<span>` で、押せず、行き先も無かった。

     ここで押さえるのは三つです。画面が人のぶんを訊くこと、出したものが
     **自分の** `ME.fo` / `ME.fr` を一行も書き換えないこと（あれは
     アカウントのもので、saveMe() がサーバーへ「あなたは誰か」として
     送るもの）、そして答えが来る前に「まだ誰もいない」と言わないこと。 */
  start();
  netOut(); arrive(A);
  folPut(false, meHandle(), ['kai']); folPut(true, meHandle(), ['veth']);
  const foSeen = [];
  netGet = (path, ok) => {
    foSeen.push(path);
    if (path.indexOf('/rest/v1/profile?select=id') === 0)
      return ok([{ id: B }]);
    if (path.indexOf('/rest/v1/follow_seen?select=follower_handle') === 0)
      return ok([{ follower_handle: 'noor' }, { follower_handle: 'sela' }]);
    if (path.indexOf('/rest/v1/follow_seen?select=followed_handle') === 0)
      return ok([{ followed_handle: 'tavi' }]);
    return ok([]);
  };

  /* 人のフォロワー。**扉から入ります** ── 一覧も人も、画面が開く前に
     取りに行く道になったので（www/shell.js § navLand、OWNER 2026-09-07
     「全部読み込んでから開く」）、vFollows() を直に呼ぶのは押した人が
     通らない道を測ることになります。 */
  NAV = [{ r: 'feed' }]; window.route = 'feed';
  go('follows', 'ers:iri');
  let seenHtml = document.getElementById('app').innerHTML;
  if (foSeen.join('\n').indexOf('handle=eq.iri') < 0)
    no('30c: 画面が、その人のハンドルで訊いていない');
  if (seenHtml.indexOf('noor') < 0 || seenHtml.indexOf('sela') < 0)
    no('30c: その人のフォロワーが画面に出ない');
  if (seenHtml.indexOf('veth') >= 0)
    no('30c: 人の画面に自分のフォロワーが出ている');
  if (folOf(false, meHandle()).join(',') !== 'kai' || folOf(true, meHandle()).join(',') !== 'veth')
    no('30c: 人の一覧が自分の一覧を書き換えた ── ' +
       JSON.stringify([folOf(false, meHandle()), folOf(true, meHandle())]));

  /* 人のフォロー中 ── 同じ画面、引数のもう半分。 */
  NAV = [{ r: 'feed' }]; window.route = 'feed';
  go('follows', 'ing:iri');
  seenHtml = document.getElementById('app').innerHTML;
  if (seenHtml.indexOf('tavi') < 0) no('30c: その人のフォロー中が出ない');
  if (seenHtml.indexOf('kai') >= 0)
    no('30c: 人の画面に自分のフォロー中が出ている');

  /* 引数にハンドルが無ければ自分のぶん ── ただし、この一覧も
     「サーバーが今回答えたか」を待ちます。
     「フォローとか0って出て1秒後に1とか数字が変わる」OWNER 2026-09-04、
     「アイコンも1秒遅れ表示」OWNER 2026-09-05。ME.fo はこの端末が前回
     もらったもので、それを先に描いて答えが来たら差し替えるのは、すぐ上の
     二つの数がもう止めた動きと同じです。答えが来るまでは印、来てからが
     一覧 ── 扉が待つ `fols` の答えがその一つの記録（www/sns.js § WHAT EACH
     PAGE READS）。 */
  NAV = [{ r: 'follows', a: 'ing' }];
  if (vFollows().indexOf('kai') < 0) no('30c: 自分のフォロー中が出なくなった');

  /* 答えが来る前にこの画面は無い ── 描き分けではなく、扉が開かないこと。
     「押してから読み込みが終わるまで前の画面のままで、揃った瞬間に出る」
     OWNER 2026-09-07。前は vFollows() が「まだ来ていない」用の印を描いて
     いて、それが 30e のくるくるの正体でした。 */
  folDrop(false, meHandle());
  netGet = () => {};
  NAV = [{ r: 'feed' }]; window.route = 'feed';
  go('follows', 'ing');
  if (here().r === 'follows')
    no('30c: 自分のぶんの答えが来ていないのに一覧が開いた');
  pullForget();
  say('30c: 人のフォロー中／フォロワーの一覧が画面に出る ── 自分のぶんは一行も動かない');

  /* ---- 30e. 人のフォロワーが、永遠にくるくるしない --------------------
     「人のプロフィールからフォロワー見ようとするとずっとくるくるするんだって」
     OWNER 2026-09-08。

     訊く道には答えが**三つ**ありました ── 一覧、空、そして `null`。
     ~~`netWhoseId()`~~ がハンドルを uuid に直せなかったとき、要求が落ちたのも
     「そんな人は居ない」のも同じ `ok(null)` になり、folPull() は何も書かず、
     訊いたという印だけを残しました。だから画面は開いて、印が回り続け、
     入り直しても folWait() が即答するので**一本も訊きません**。
     測りました（2026-09-08、本物の道を通して）：開いた、回った、ポップ無し、
     二度目の要求は 0 本。

     答えは二つです。一覧（空を含む）か、落ちたか。 */
  start();
  netOut(); arrive(A);
  const seen30e = [];
  const goFol = (h) => {
    WHO_HAVE = {}; WHO_ASKED = {}; FOL_HAVE = {}; FOL_ASKED = {};
    popOff(); NET_AGAIN = [];
    /* 立っているのは読み終わったタイムライン。タイムラインの待ちの印は
       タイムライン自身のもので（読む前は待つ、r71）、ここで測るのはフォロワー
       の一覧のくるくる。A の投稿は A の鍵にあり（www/core.js § ACCT）、この
       案件の A は投稿を持たないので、読み終わったと言っておかないとタイムライン
       の待ちがそのまま映ります（測った、r79）。 */
    PULL_GOT[pullKey('feed', snsTab)] = 1; PULL_OUT[pullKey('feed', snsTab)] = 0;
    NAV = [{ r: 'feed' }]; window.route = 'feed'; render();
    go('follows', 'ers:' + h);
    return document.getElementById('app').innerHTML;
  };

  /* 落ちたとき ── 印ではなくポップ。そしてもう一度訊ける。 */
  netGet = (p, ok, bad) => { seen30e.push(p); bad(null, 0, 'follow_seen 0'); };
  goFol('iri');
  if (here().r === 'follows') no('30e: 落ちたのに一覧が開いた');
  if (document.getElementById('app').innerHTML.indexOf('snswait') >= 0)
    no('30e: 落ちたのにくるくるが出ている');
  if (!popOn()) no('30e: 落ちたのにポップが出ない ──「もう一度」の行き先が無い');
  {
    const was = seen30e.length;
    popOff();
    NAV = [{ r: 'feed' }]; window.route = 'feed';
    go('follows', 'ers:iri');
    if (seen30e.length === was)
      no('30e: 落ちたあと、入り直しても一本も訊いていない ── 永遠にくるくる');
  }

  /* 答えて 0 人 ── 空の一覧が開く。「空」と「壊れた」は別。 */
  netGet = (p, ok) => { seen30e.push(p); return ok([]); };
  {
    const h0 = goFol('iri');
    if (here().r !== 'follows') no('30e: 0 人の一覧が開かない');
    if (h0.indexOf('snswait') >= 0) no('30e: 0 人でくるくるが出ている');
    if (h0.indexOf(t('me.followers.none')) < 0)
      no('30e: 0 人なのに「まだ誰もいない」と言わない');
  }

  /* 2 人 ── 二行、印なし。 */
  netGet = (p, ok) => {
    seen30e.push(p);
    if (p.indexOf('/rest/v1/follow_seen') === 0)
      return ok([{ follower_handle: 'noor' }, { follower_handle: 'sela' }]);
    if (p.indexOf('/rest/v1/profile_seen') === 0)
      return ok([{ id: 'x1', handle: 'noor', display: 'Noor', av: null, bio: '', fo: 1, fr: 1 },
                 { id: 'x2', handle: 'sela', display: 'Sela', av: null, bio: '', fo: 1, fr: 1 }]);
    return ok([]);
  };
  {
    const h2 = goFol('iri');
    if (here().r !== 'follows') no('30e: 2 人の一覧が開かない');
    if (h2.indexOf('snswait') >= 0) no('30e: 2 人でくるくるが出ている');
    if (h2.indexOf('noor') < 0 || h2.indexOf('sela') < 0)
      no('30e: 2 人が一覧に出ない');
  }
  netGet = realGet;
  say('30e: 人のフォロワー ── 落ちたらポップ（もう一度訊ける）、0 人なら空の一覧、2 人なら二行。くるくるは無い');

  /* ---- 30d. 言語を一つ消すのは、その一つだけ ----------------------------
     「この言語を削除で言語の制作のものは全部なくなるってずっと言ってんだろ」
     OWNER 2026-09-03。

     ここに在ったのは「端末のデータを消す」で、**この端末の全言語**を消して
     いました。誰のものでも。オーナーが頼んだ三本は ログアウト／言語を削除／
     アカウントを削除 の三つで、真ん中はこれです。

     押さえるのは二つ。**その言語の作ったものが全部消えること**と、**それ以外
     が一つも動かないこと** ── 同じアカウントの別の言語も、他人の言語も、投稿も
     下書きも。後者が、2026-09-03 にオーナーの言語を消した形そのものです。 */
  start();
  netOut(); arrive(A);
  const keepL30d = LANGS, keepId30d = langId, keepNm30d = langName;
  const drops = [];
  const realSend30d = netSend;
  /* 行が返る答え。netLangDrop() は消えた行を数えるので、`{}` は「答えは来た
     が一行も消えていない」── 本物のサーバーが返さない形でした。 */
  netSend = (m, path, body, tok, ok) => {
    if (m === 'DELETE') drops.push(path);
    if (ok) ok([{ id: 'srv' }]);
  };
  /* 鍵はその言語の番号そのもの（2026-09-10、幹一本）。三つとも一度は
     上がっているので、行が在ることを `LROW` に言っておきます ──
     netLangDrop() がそれを読んで、行の無い言語には何も送りません。 */
  LANGS = { 'srv-go': {}, 'srv-stay': {}, 'srv-b': {} };
  /* 誰の物かはサーバーの `language.owner` です（2026-09-11）── 索引の
     `mine` ではありません。三本とも一度は上がっているので、行が在ることも
     `LROW` に言っておきます ── netLangDrop() がそれを読んで、行の無い言語に
     は何も送りません。 */
  langOwnGot('srv-go', A); langOwnGot('srv-stay', A); langOwnGot('srv-b', B);
  langTookGot([]);
  langRowGot('srv-go'); langRowGot('srv-stay'); langRowGot('srv-b');
  langStore();
  const w30d = [{ hw: 'kano', ph: ['k'], mn: 'hill', mns: ['hill'], pos: 'n' }];
  try {
    slWr(langKeyOf('srv-go', 'words'), JSON.stringify(w30d));
    slWr(langKeyOf('srv-go', 'kb'), '{"lay":[]}');
    slWr(langKeyOf('srv-stay', 'words'), JSON.stringify(w30d));
    slWr(langKeyOf('srv-b', 'words'), JSON.stringify(w30d));
  } catch (e) {}
  POSTS = [{ id: 'p30d', ln: 'kano', at: 1 }]; savePosts();
  DRAFTS = [{ at: 1, ln: 'a draft', mn: '', to: '', pr: 0, pics: [], vo: null, pv: false }];
  draftsSave();
  langId = 'srv-go'; langName = '消すほう';

  wipeLangs();
  if (typeof popOn === 'function' && popOn()) popYes();
  else no('30d: 言語の削除が何も訊かずに消した ── ポップが出ていない');

  /* 消した言語の作ったものは、一つも残らない。 */
  for (const sl of SLICES)
    if (slRd(langKeyOf('srv-go', sl)))
      no('30d: 消した言語の ' + sl + ' が残っている');
  if (LANGS['srv-go']) no('30d: 消した言語が索引に残っている');
  /* そして、それ以外は一つも動かない。 */
  if (!LANGS['srv-stay']) no('30d: 同じアカウントの別の言語まで消えた');
  if (!LANGS['srv-b']) no('30d: 別のアカウントの言語まで消えた');
  if (!slRd(langKeyOf('srv-stay', 'words')))
    no('30d: 同じアカウントの別の言語の単語が消えた');
  if (!slRd(langKeyOf('srv-b', 'words')))
    no('30d: 別のアカウントの言語の単語が消えた ── 2026-09-03 の形');
  if (!POSTS.length) no('30d: 投稿が消えた');
  if (!DRAFTS.length) no('30d: 下書きが消えた');
  /* サーバーからも消える。端末だけだと次の同期で戻る。 */
  if (drops.join('\n').indexOf('srv-go') < 0)
    no('30d: サーバーの行が消えていない ── 次の同期で戻ってくる（' +
       (drops.join(' ') || '一件も送っていない') + '）');
  if (drops.join('\n').indexOf('srv-stay') >= 0 ||
      drops.join('\n').indexOf('srv-b') >= 0)
    no('30d: 消していない言語をサーバーから消した ── ' + drops.join(' '));
  /* 消したあと、立っているのはこのアカウントの言語。 */
  if (!langId) no('30d: 消したあと、どの言語にも立っていない');
  if (langId === 'srv-go') no('30d: 消した言語に立ったままになっている');
  if (langWhose(langId) !== LW_MINE) no('30d: 消したあと、他人の言語に立っている');

  netSend = realSend30d;
  LANGS = keepL30d; langId = keepId30d; langName = keepNm30d; langStore();
  say('30d: 言語を一つ消すのは、その一つだけ ── ほかの言語も投稿も下書きも動かず、サーバーからも消える');

  /* ---- 31. キーボードのプールも、そのアカウントのぶん -------------------
     「じゃないとアカウント変えたら無限に言語作れるやん」OWNER 2026-09-01。
     langCount() と同じ穴が kbCount() にもありました ── LANGS は端末のもので
     サインアウトしても残るので、**他人の言語のキーボードで、この人が作れる
     プールが埋まります。**

     訊くのは `langWhose()` 一箇所です（2026-09-11）── `langMine()`
     `langOwned()` `langAcct()` の三つが同じ問いに三通りに落ちていたのを
     一本にしました。まだ誰のものとも言われていない言語のキーボードは
     数えません ── 答えの無い数で天井を測ると、次の一枚を断ります。 */
  start();
  netOut(); arrive(A);
  const keepKbLangs = LANGS, keepKbId = langId;
  LANGS = {};
  LANGS['Lmine']  = { name: '自分', mine: true };
  LANGS['Ltheirs']= { name: '他人', mine: true };
  langOwnGot('Lmine', A); langOwnGot('Ltheirs', B);
  langId = 'Lmine';
  slWr(langKeyOf('Lmine', 'kb'),
    JSON.stringify({ kbs: [{ rows: [] }] }));
  slWr(langKeyOf('Ltheirs', 'kb'),
    JSON.stringify({ kbs: [{ rows: [] }, { rows: [] }] }));
  kbRead();
  const mineOnly = kbCount();
  LANGS = keepKbLangs; langId = keepKbId; kbRead();
  if (mineOnly !== 1)
    no('31: 他人の言語のキーボードが数に入っている — ' + mineOnly + '（自分のは1つ）');
  say('31: キーボードのプールは、そのアカウントの言語のぶんだけ');

  /* ---- 32. 言語の一覧に、他人のアカウントの言語が出ない ----------------
     「あと違うアカウントでログインしてんのに前のやつ出てくるんだけど？」
     LANGS は端末のもので、サインアウトしても残っていました。だからこの一覧は
     **前のアカウントの言語を、次に入った人に見せていました。**今は索引そのものが
     アカウントの物（`lingua.langs.<uid>`）で、B の手元に A の行はありません。

     **消してはいません。**入り直せば元どおり出ます ── ここで押さえるのは
     その両方です。そして `docs/DATA_SAFETY.md`「短い一覧は削除ではない」に
     従って、**出していない件数を必ず言います。** */
  start();
  netOut(); arrive(A);
  const keepL2 = LANGS, keepId2 = langId, keepNm2 = langName;
  LANGS = {};
  LANGS['La'] = { mine: true };
  langOwnGot('La', A);
  LANGS['Lb'] = { mine: true };
  langOwnGot('Lb', B);
  LANGS['Lc'] = { mine: true };
  langOwnGot('Lc', B);
  langId = 'La';
  /* 名前は `language.name` です（www/core.js § LNAME）── 開いている一つも、
     開いていない二つも、langRow() は同じ langNameOf() で訊きます。索引に
     `name` を書いても、もう誰も読みません。 */
  langNameGot('La', '自分の');
  langNameGot('Lb', '他人の1');
  langNameGot('Lc', '他人の2');
  langStore();
  const asA2 = vLangs();
  /* B ARRIVES TO B'S OWN INDEX (www/core.js § ACCT, r79). The index was one
     key for every account on the phone, so B used to be handed A's rows and
     this list filtered them out; it is `lingua.langs.<uid>` now, and A's rows
     are not in B's hands at all. B's own come from B's key. */
  netOut(); arrive(B);
  const leakB = !!(LANGS['La'] || LANGS['Lb'] || LANGS['Lc']);
  LANGS = { 'Lb': { mine: true }, 'Lc': { mine: true } };
  langId = 'Lb'; langStore();
  const asB2 = vLangs();
  /* and A's come back when A does -- nothing was removed */
  netOut(); arrive(A);
  const backA = !!(LANGS['La'] && LANGS['Lb'] && LANGS['Lc']);
  LANGS = keepL2; langId = keepId2; langName = keepNm2;
  if (leakB) no('32: B が入った時、A の索引が B の手元にある');
  if (!backA) no('32: A が戻った時、A の索引が戻らない');

  if (asA2.indexOf('自分の') < 0) no('32: 自分の言語が一覧から消えた');
  if (asA2.indexOf('他人の1') >= 0) no('32: A の一覧に B の言語が出ている');
  if (asB2.indexOf('他人の1') < 0) no('32: B の一覧に B 自身の言語が出ていない');
  if (asB2.indexOf('自分の') >= 0) no('32: B の一覧に A の言語が出ている');
  /* 出していない件数を言うこと。A から見て隠れているのは 2 件。
     **数字を探すのではなく、その文そのものを探します** ── '2' は class 名にも
     他人の言語の名前にも出るので、それを見るのは「よく一緒に真になること」を
     見ているだけで、当たっているようで当たっていません。 */
  const hidSay = t('cap.hid', 2);
  if (asA2.indexOf(hidSay) < 0)
    no('32: 出していない件数を言っていない（' + JSON.stringify(hidSay) +
       '）── 消えたのと見分けが付かない');
  /* そして隠すものが無いときは言わない。数えていない一覧は、0 件を
     「0 件かくしています」と言い出します。 */
  netOut(); arrive(A);
  LANGS = { 'La': { mine: true } }; langOwnGot('La', A);
  langId = 'La'; langNameGot('La', '自分の');
  const noneHidden = vLangs();
  if (noneHidden.indexOf(t('cap.hid', 0)) >= 0)
    no('32: 隠すものが無いのに件数を言っている');
  /* そして何も消えていない: LANGS には三つとも在る。 */
  if (!LANGS || Object.keys({La:1,Lb:1,Lc:1}).length !== 3) no('32: 内部で数が変わった');
  say('32: 言語の一覧はそのアカウントのぶんだけ ── 消さず、隠した件数を言う');

  /* ---- 33. アカウントが違えば、開いている言語も違う --------------------
     「ログアウトして違うアカウントでログインしても前のアカウント残ってるん
     だけどなんで？」「アカウントが違うんだから、そもそも残るのがおかしい
     だろって」OWNER 2026-09-02.

     サインインは、アカウントで引くもの（名前・顔・ハンドル・一覧）を全部
     入れ替えていて、変数に入っている `langId` だけ触っていなかった。だから
     自分でサインインしたのに、画面に出ている辞書も文字もキーボードも前の人の
     ものだった ── 一覧には「N 件表示していません」と出ているのに。何も throw
     しない。

     消さないことも一緒に見る: 前のアカウントの言語も、その単語も、その場に
     残っていて、戻れば戻る。 */
  netOut();
  LANGS = { 'La': { name: 'A の言語', mine: true },
            'Lb': { name: 'B の言語', mine: true } };
  langOwnGot('La', A); langOwnGot('Lb', B);
  langId = 'La'; langName = 'A の言語';
  try { slWr(langKeyOf('La', 'words'),
    JSON.stringify([{ hw: 'aaa', ph: ['a'], mn: 'A のことば', mns: ['A のことば'], pos: 'n' }])); } catch (e) {}
  arrive(B);
  langForAcct();
  if (langId === 'La') no('33: B でサインインしたのに A の言語が開いたまま');
  if (langWhose(langId) !== LW_MINE) no('33: 開いた言語が B のものではない（' + langId + '）');
  if (!LANGS.La) no('33: A の言語が索引から消えた');
  if (!slRd(langKeyOf('La', 'words')))
    no('33: A の単語が消えた ── 隠すのであって消すのではない');
  /* そして A に戻ると、A の言語がそのまま返る。 */
  netOut(); arrive(A);
  langForAcct();
  if (langId !== 'La') no('33: A に戻ったのに A の言語が開かない（' + langId + '）');
  /* そして B がこの端末に一つも持っていない場合。作られる新しい言語には
     そのアカウントの印が要ります ── langMint() は印を付けず、印の無い言語は
     「訊いた人のもの」と読まれるので（langOwned）、A が戻ったときに A 自身の
     言語より先にそれが見つかります。 */
  netOut();
  LANGS = { 'La': { name: 'A の言語', mine: true } }; langOwnGot('La', A);
  langId = 'La'; langName = 'A の言語';
  arrive(B);
  langForAcct();
  const madeForB = langId;
  if (madeForB === 'La') no('33: 何も持っていない B に A の言語が開いたまま');
  if (!LANGS[madeForB] || langOwnOf(madeForB) !== B)
    no('33: B のために作った言語に B の印が無い（uid=' +
       JSON.stringify(langOwnOf(madeForB)) + '）');
  netOut(); arrive(A); langForAcct();
  if (langId !== 'La')
    no('33: A が戻ったのに、B のために作った言語のほうが開いた（' + langId + '）');
  say('33: 開いている言語はサインインした人のもの ── 前の人のは消えず、戻れば返る');

  /* ---- 73. そして開くのは、そのアカウントの「主言語」 ------------------
     「そもそも最初に作った言語を主言語にして、フリーにした時に最初に表示
     されるようにしないとダメでは？」OWNER 2026-09-12。

     `langForAcct()` は `LANGS` を舐めて、**そのアカウントの印が付いた最初の
     一本**を開いていました ── 索引の並びは「この端末がその言語の行をいつ
     受け取ったか」の順であって、作った順ではありません。無料では一覧に出る
     のは一本（主言語）だけなので、それは**一覧に行が無い言語に人を立たせる**
     ということでした：画面に押すものが無く、戻る道もない。

     索引の並びと作った順をわざと食い違わせてあります ── 索引の先頭は `Lx` で、
     一番古いのは二番目の `Ly`。並びで開く版なら `Lx` が開いて緑になります。
     日付は `langMadeGot()` で入れます。`netLangsWalk()` が行を降ろすときに
     通る道そのもので、検査が自分で並べ直しているのではありません。 */
  /* 一度も入ったことの無いアカウント（'u73'）で。B は 33 番で自分の言語に
     立ったので、B が戻れば B の立っていた所に戻ります（`lingua.cur.<B>`） ──
     それは正しく、ここで測りたい「その人の物が開いていない時」ではない。
     三本はサーバーが降ろしたその人の索引（`lingua.langs.<uid>`）に置きます。 */
  netOut();
  localStorage.setItem(acctKey('langs', 'u73'),
    JSON.stringify({ 'Lx': {}, 'Ly': {}, 'Lz': {} }));
  langOwnGot('Lx', 'u73'); langOwnGot('Ly', 'u73'); langOwnGot('Lz', 'u73');
  langOwnGot('La', A);
  langMadeGot('Lx', '2026-06-06T00:00:00Z');
  langMadeGot('Ly', '2026-01-01T00:00:00Z');   /* 一番古い ＝ 主言語 */
  langMadeGot('Lz', '2026-09-09T00:00:00Z');
  arrive('u73');
  langForAcct();
  if (langId !== 'Ly')
    no('73: サインイン直後に開いたのが主言語ではない（' + langId + ' ≠ Ly）');
  if (langMainId() !== 'Ly')
    no('73: langMainId() が別の答えを出している（' + langMainId() + '）');
  /* そして何も消えていない ── 開かなかった二本も索引にそのまま。 */
  if (!LANGS.Lx || !LANGS.Lz) no('73: 開かなかった言語が索引から消えた');
  say('73: サインイン直後に開くのは、そのアカウントが一番古く作った言語');

  /* ---- 34. ＋ で作った言語にも、そのアカウントの印が付く ----------------
     「1アドレス1アカウント」「これは絶対課金もアカウントごと言語もそう」
     OWNER 2026-09-02。言語はアカウントのものです。

     `langMint()` を呼ぶ場所は四つあって、印を押していたのは二つだけでした
     ── `langForAcct()`（別のアカウントが入ってきたとき）と
     `netLangsDown()`（サーバーから降りてきたとき）。**言語一覧の＋は
     押していませんでした。**

     印はそれまで `netLangRow()` が上げ切った時に初めて付いていたので、
     **圏外で作った言語と、送信が落ちた言語は印無しのまま**残ります。そして
     印の無い言語は次の 35 番のとおり誰のものでもないので、＋ で作った言語が
     次にサインインした人から見えなくなる ── 作った本人からも。

     これは langFirst()（オンボーディング）とは違います。あちらは口座が
     できる前なので押す印がありません。ここには押す印があります。 */
  /* AND IT GOES UP AS IT IS MADE（2026-09-11、hunt #12）。言語はサーバーに
     住んでいて（CLAUDE.md § Online）、スライスはメモリです（規則 22）──
     だから「作って送らない」は「アプリを閉じたら消える」と同じことです。
     測った形: ＋ を押した言語の行は**次の起動**（www/boot.js）まで出来ず、
     その間に閉じれば無くなり、画面は何も言いません。 */
  start();
  planGot('pro');
  const keepL34 = LANGS, keepId34 = langId, keepNm34 = langName;
  const keepSync34 = netLangSync;
  const sent34 = [];
  netLangSync = (then) => { sent34.push(langId); if (then) then(false); };
  LANGS = { 'La': { name: '自分の', mine: true } }; langOwnGot('La', A);
  langId = 'La'; langName = '自分の';
  langNew();
  netLangSync = keepSync34;
  const made34 = langId;
  if (sent34.indexOf(made34) < 0)
    no('34: ＋ で作った言語が、その場でサーバーへ行っていない — 送った先 ' +
       JSON.stringify(sent34));
  if (made34 === 'La') no('34: ＋ を押したのに新しい言語が開いていない');
  else if (langOwnOf(made34) !== A)
    no('34: ＋ で作った言語に、押した人の印が無い（uid=' +
       JSON.stringify(langOwnOf(made34)) + '）');
  /* そして印が付いたぶん、その言語はちゃんとその人のものとして数えられる。
     印の無い言語は 35 番で「誰のものでもない」になるので、この二つは
     同じ一つの穴の両側です。 */
  else if (langWhose(made34) !== LW_MINE)
    no('34: ＋ で作った言語が、作った人自身の一覧に出ない');
  LANGS = keepL34; langId = keepId34; langName = keepNm34;
  planGot('free');
  say('34: ＋ で作った言語は、押した人のアカウントのもの ── そしてその場で' +
      'サーバーへ行く（次の起動を待たない）');

  /* ---- 35. 印の無い言語を拾うのは、オンボーディングの歩きだけ -----------
     「1アドレス1アカウント」「これは絶対課金もアカウントごと言語もそう」
     OWNER 2026-09-02。
     「アカウントごとに言語情報も違うんだって」 OWNER 2026-09-03。

     `langOwned()` は印の無い言語を「訊いた人のもの」と答えていました
     （2026-09-11 に `langWhose()` 一本へ ── 印が無ければ `LW_WAIT`）。
     だから **A がこの端末で作って一度も上げていない言語が、B がサインイン
     した瞬間に B のものになります。**辞書も文字もキーボードも、B の一覧に
     B の言語として並ぶ。何も throw しません。

     **言語はその印が指すアカウントのものです。**印の無い言語を自分のものと
     答える場所は一つだけ ── オンボーディングの歩きの途中、まだ `SET.walked` が
     偽のあいだ。そこは、アカウントができる前に物を作る唯一の場所だからです。
     扉を出た `obFinish()` が `netLangSync()` を呼び、そこで印が付きます。

     端末を憶える仕掛けはありません。「この端末の一人目」は端末ごとの事実で、
     それを持ち込んだ日に A の言語が B の一覧に出ました。

     消しません。印の無い言語は索引に残り、保存に残り、
     単語も一つも減りません ── ここで押さえるのはその両方です
     （`docs/DATA_SAFETY.md`「短い一覧は削除ではない」）。 */
  start();
  const keepL35 = LANGS, keepId35 = langId, keepNm35 = langName;
  const w35 = [{ hw: 'aaa', ph: ['a'], mn: 'A のことば', mns: ['A のことば'], pos: 'n' }];

  /* 歩きの途中 ── まだ誰もサインインしていない。訊く相手がいないので、
     作ったものはその場の人のもの。歩きはサインインの前なので、言語もその時に
     作る（メモリの中、誰の鍵にも書かれない ── www/core.js § ACCT）。 */
  netOut(); SET.walked = false;
  LANGS = { 'Lu': { name: 'A が圏外で作った', mine: true } };   /* 印が無い */
  langId = 'Lu'; langName = 'A が圏外で作った';
  try { slWr(langKeyOf('Lu', 'words'), JSON.stringify(w35)); } catch (e) {}
  if (langWhose('Lu') !== LW_MINE) no('35: 歩きの途中で、作ったものが自分のでない');

  /* 扉。サインインは済んで、まだ何も送っていない ── ここで印の無い言語は
     **誰のものでもありません**。**端末は誰のものかを決めません**
     （`docs/FEATURE_RULES.md` § 端末は何も決めない、OWNER 2026-09-11）。

     では歩きの言語はいつその人のものになるのか ── **サーバーに行が出来た
     とき**です。`netTook()` が `netLangSync()` を先に走らせ、
     `netLangRow()` が `language` の行を作り、その ok が `langOwnGot()` を
     書く（`www/net.js`）。書いているのはサーバーが答えた `owner` であって、
     端末の判断ではありません。66番がその road を歩きます。 */
  arrive(B);
  if (langWhose('Lu') !== LW_WAIT)
    no('35: サインインしただけで、印の無い言語が拾われた ── まだ訊けていない、ではない');
  /* そしてサーバーに行が出来れば、その人のものになる。 */
  langOwnGot('Lu', B);
  if (langWhose('Lu') !== LW_MINE) no('35: サーバーが答えても、その人のものにならない');
  langOwnGot('Lu', '');

  /* 印の付いていない言語はもう誰のものでもない ── 端末の一人目という
     覚え方はしません。 */
  SET.walked = true;
  if (langWhose('Lu') === LW_MINE) no('35: 印の無い言語が、アプリの中で訊いた人のものになっている');
  if (langWhose('Lu') !== LW_WAIT) no('35: 印の無い言語が、まだ訊けていない扱いになっていない');
  if (vLangs().indexOf('A が圏外で作った') >= 0)
    no('35: 印の無い言語が、訊いた人の言語一覧に並んでいる');
  netOut(); arrive(A);
  if (langWhose('Lu') === LW_MINE) no('35: 印の無い言語が、次に入った人のものになっている');

  /* そして何も消えていない ── 歩きの言語は扉を通った B の索引にある
     （`lingua.langs.<B>`）。A の手元には無い（A の扉ではない）。 */
  if (!(acctRaw(acctKey('langs', B)) || {}).Lu) no('35: 印の無い言語が索引から消えた');
  if (LANGS.Lu) no('35: 歩きの言語が、扉を通っていない A の索引にある');
  if (!slRd(langKeyOf('Lu', 'words')))
    no('35: 印の無い言語の単語が消えた ── 隠すのであって消すのではない');

  /* 印のある言語は持ち主には見え、他人には見えない。 */
  LANGS['Lb'] = { name: 'A の言語', mine: true };
  langOwnGot('Lb', A);
  if (langWhose('Lb') !== LW_MINE) no('35: 自分の印が付いた言語が自分のものでない');
  netOut(); arrive(B);
  if (langWhose('Lb') === LW_MINE) no('35: 他人の印が付いた言語が自分のものになっている');

  LANGS = keepL35; langId = keepId35; langName = keepNm35;
  say('35: 印の無い言語を拾うのはオンボーディングの歩きだけ ── 消さず、そこに残る');

  /* ---- 36. ＋ はアカウントを訊く ----------------------------------------
     「言語はアカウントないと作れないです」「ログインした人しか書けないけど」
     ── CLAUDE.md にずっと書いてあって、止めているものがありませんでした。

     `langNew()` の前に立っていたのは `langStop()`（言語数の上限）だけです。
     `makeNeed()` は文字・単語・文法・メモの四つに掛かっていて、**言語を作る
     ことには掛かっていませんでした。**だからサインアウトした人が＋を押せて、
     出来た言語には印が無く（34番）、次に入った人のものになる（35番）。

     上限で止まることが多いので目立ちませんでした ── 無料は言語一つなので。
     段が端末に付いているぶん、Pro の端末では素通りします。だからここは
     **Pro で、上限に余裕がある状態**で訊きます。止めているのが上限では
     ないことを見るためです。

     `makeNeed()` はオンボーディングの最中は素通りします（`SET.walked`）。
     歩きは口座ができる前で、そこで訊くのはサインインする理由ができる前に
     訊くことなので ── 扉は歩きの最後です。 */
  start();
  planGot('pro');
  const keepL36 = LANGS, keepId36 = langId, keepNm36 = langName;
  LANGS = { 'La': { name: '自分の', mine: true } }; langOwnGot('La', A);
  langId = 'La'; langName = '自分の'; langStore();
  netOut();                                   /* サインアウトした人 */
  planGot('pro');
  /* サインアウトした手元は誰のものでもない（A の索引は A の鍵に残る）──
     ここで見るのは「＋ を押しても、その手元が何も変わらない」。 */
  const before36 = Object.keys(LANGS).length, id36 = langId;
  langNew();
  if (Object.keys(LANGS).length !== before36)
    no('36: サインアウトしているのに ＋ で言語ができた');
  if (langId !== id36) no('36: サインアウトしているのに ＋ で言語が切り替わった');
  /* 断るだけではなく、扉へ送ること。断って何も起きない＋は、原因も出口も
     無い画面です。`obDoor()` は戻り先を憶え、**それが扉が開いている印**
     です ── 2026-09-09（オーナーの A）まで `SET.done` を下ろして扉を出して
     いましたが、`SET.walked` はこの端末が歩きを済ませたかで、下ろすと
     文字を描く画面へ送ることになります。印は一つになりました。 */
  if (!SET.obback) no('36: 扉から戻る先を憶えていない');
  if (!obPending()) no('36: ＋ が断っただけで、扉を開いていない');
  if (appIs() !== 'door') no('36: 扉が開いていない — appIs()=' + appIs());
  if (!SET.walked) no('36: 扉を出すために、この端末の「歩きを済ませた」を下ろした');
  SET.obback = null; save();
  /* そしてサインインしていれば、＋ は今までどおり通る（34番の裏返し）。

     段と、「この account の言語は何か」の答えを置きます ── どちらもサイン
     アウトで忘れられ（37-43 番、www/core.js § LMINE）、天井はそこで
     「接続できません」と断ります。この検査が測りたいのはそこではないので、
     二つとも答えのある所から始めます。`arrive()` が § LMINE のほうを置き、
     `pro` なのは言語の天井を三本にするためです ── 一本だと ＋ が天井の側で
     断られ、測りたい「アカウントを訊く」に届きません。 */
  arrive(A);
  planGot('pro');
  if (langStop()) no('36: 上限のほうで止まっている ── この検査が測りたいものではない');
  const in36 = Object.keys(LANGS).length;
  langNew();
  if (Object.keys(LANGS).length !== in36 + 1)
    no('36: サインインしているのに ＋ で言語ができない');
  LANGS = keepL36; langId = keepId36; langName = keepNm36;
  planGot('free');
  say('36: ＋ はアカウントを訊く ── 断らずに扉へ送る。サインインしていれば通る');


  /* ---- 37-43. 段は買ったアカウントのもので、端末に一言も無い -----------
     「1アドレス1アカウント」「これは絶対課金もアカウントごと言語もそう」
     「Xは違うアカウントだと課金も引き継がれない」 OWNER 2026-09-02。
     「オンラインで 1 端末に 1 アカウント…段 ── 答えは全部サーバー」 OWNER
     2026-09-11。

     16-18 番は段がアカウントに **紐づく** ことを持っています。ここが持つのは
     その裏 ── 同じ端末で別のアカウントに入った人は、その端末で買った購読を
     **引き継がない**。

     起きていたのはこれです:

       A（Pro）がサインアウト → B がサインイン
       端末の plan() はまだ pro（Keychain は誰のものでもない）
       次の起動 → 端末が自分の段をサーバーに書く → B のアカウントに Pro が付く

     書く道は 2026-09-06 に無くなり、**端末に残った段そのもの**も 2026-09-11 に
     無くなりました（`www/core.js` § PLAN）。段は `verify-plan` の答えで、
     メモリにあり、セッションが行けば消えます。だから「引き継ぐ」形が存在
     しません ── ここが持つのは、それが本当に存在しないことです。

     **`free` ではなく「まだ訊けていない」**が、入った直後の答えです。
     free に倒すのが、実機でオーナーの段を消した形そのもの
     （「アップデートしたら勝手に無料プランになったんだけど？」 2026-09-02）。 */

  /* 37. 別の人が買ったものは引き継がない ── そして free でもない。 */
  start();
  planGot('pro');
  netOut();
  arrive(B);
  if (planKnown())
    no('37: 別のアカウントが入った直後に、段の答えがある — ' + plan());
  if (has('pro') || has('plus'))
    no('37: 別のアカウントが、この端末で買われた段を引き継いだ — ' + plan());
  say('37: 別のアカウントは、この端末で買われた購読を引き継がない ── ' +
      '答えは free ではなく「まだ訊けていない」');

  /* 38. **そして B のアカウントに pro が付かない。**2026-09-06 まで、これは
     「端末が送るものが pro でないこと」でした。送る道が無くなったので、主張は
     一段強くなります ── **端末は段を一言も言わない。**上がるのは署名付きの
     取引だけで、それは A の appAccountToken を持っているので B には付きません
     （拒むのはサーバー、tools/verify-check.mjs）。 */
  start();
  planGot('pro');
  netOut();
  const sent38 = [];
  const realSend38 = netSend;
  netSend = (m, path, body, tok, ok) => {
    sent38.push({ path, body });
    if (path.indexOf('/functions/v1/verify-plan') === 0) return ok({ plan: 'free' });
    return ok(null);
  };
  arrive(B);
  netPlanVerify([], () => {});
  netSend = realSend38;
  if (sent38.some((r) => r.path.indexOf('/rest/v1/plan') === 0))
    no('38: 段の表に書きにいった — ' + JSON.stringify(sent38.map((r) => r.path)));
  if (sent38.some((r) => r.body && r.body.plan))
    no('38: 端末が段を送った — ' + JSON.stringify(sent38.map((r) => r.body)));
  if (plan() !== 'free')
    no('38: B の段がサーバーの答えになっていない — ' + plan());
  say('38: B のアカウントに、A が買った段は送られない ── 端末は段を言わない');

  /* 39. **買った本人からも取り上げない ── 答えるのはサーバー。**
     ここは 2026-09-11 まで「Keychain に書き戻さないので A の段はそこに残り、
     A が戻ってきた起動で読み直される」でした。Keychain は読みません。A が
     戻れば、段は「まだ訊けていない」から始まり、**サーバーが答えます** ──
     取り上げているのではなく、訊きに行く先が一つになっただけです。 */
  start();
  arrive(A);
  planGot('pro');
  netOut();
  arrive(B);
  netOut();
  arrive(A);
  if (planKnown())
    no('39: 端末の写しが答えた — サーバーに訊く前に ' + plan());
  const realSend39 = netSend;
  netSend = (m, path, body, tok, ok) => ok({ plan: 'pro' });
  netPlanVerify([], () => {});
  netSend = realSend39;
  if (plan() !== 'pro')
    no('39: 買った本人の段がサーバーから戻ってこない — ' + plan());
  say('39: 買った本人の段は、戻ってきたときサーバーが答える ── 取り上げない');

  /* 40. **持ち主が書かれていない端末も、例外ではない。**
     「1アカウントに1課金ですけど。他のアカウントについてくるわけねえだろ」
     OWNER 2026-09-11。

     ここは 2026-09-11 の朝まで `SET.planUid` の比較でした ── 空の印を
     「この端末を持っている人の段」と読む枝があり、それがオーナーの断った
     一文です。比較そのものが無くなりました: 段は端末に無いので、入った人は
     **誰の段も引き継ぎようがありません。** */
  start();
  netOut();
  planGot('pro');
  arrive(B);
  if (planKnown())
    no('40: 印の無い端末の段が、入った人に付いてきた — ' + plan());
  say('40: 持ち主の書かれていない端末も例外ではない ── 段は付いてこない');

  /* 40b. **段は設定の預け写しに乗らない。**アカウントの設定は書く時に
     `lingua.set.<uid>` に書かれます（`www/core.js` § ACCT）。段がそこに入る
     ことは、もう仕組みとして起こりません（`SET` に段が無い）── **この主張は
     それが本当にそうであることの歯止め**で、段を `SET` に戻した日に赤に
     なります。 */
  start();
  arrive(A);
  planGot('pro');
  netOut();
  arrive(B);
  let park40 = null;
  try { park40 = JSON.parse(localStorage.getItem('lingua.set.' + A) || 'null'); } catch (e) { park40 = null; }
  if (!park40) no('40b: A の設定が A の鍵に無い — 書く時に uid を持っていない');
  else {
    const money40 = Object.keys(park40).filter((k) => /^plan/.test(k));
    if (money40.length)
      no('40b: 預け写しが段のものを運んでいる — ' + money40.join(' '));
  }
  say('40b: 段は設定の預け写しに乗らない ── 端末に段の欄が一つも無い');

  /* 41. **起動して憶えているセッションを読んだ瞬間に、前の人の段を忘れる。**
     セッションを読むのは `www/core.js` の頭の `sessRead()` で、そのアカウントの
     物は入れ物（`ACCT`）が読む ── 起動はその二つ。ここで忘れないと、B の起動が
     A の段のまま最初の一枚を描きます。 */
  start();
  netOut();
  planGot('pro');
  localStorage.setItem('lingua.sess', JSON.stringify(
    { at: 'not a jwt', rt: 'a refresh token', uid: B }));
  sessRead(); acctFor(netUid());
  if (planKnown())
    no('41: 憶えているセッションを読んでも、前の人の段が残っている — ' + plan());
  netOut();
  say('41: 起動して憶えているセッションを読んだ瞬間に、前の人の段を忘れる');

  /* 42. **サインアウトでも忘れる。**段はアカウントの物なので、誰もいない端末
     が段を持っているのは「端末の物」そのものです。 */
  start();
  arrive(A);
  planGot('pro');
  netOut();
  if (planKnown())
    no('42: サインアウトしても段が残っている — ' + plan());
  say('42: サインアウトで段を忘れる ── 誰もいない端末は段を持たない');

  /* 43. **訊けていないうちは「接続できません」で、値段の話をしない。**
     「電波が無ければ接続できません」（`docs/FEATURE_RULES.md` § 端末は何も
     決めない）。`upStop()` と `capStop()` がその一箇所です ── 倒して free に
     するのではなく、待つ。値段の頁へ送るのは、**訊けた上で足りないとき**
     だけです。 */
  start();
  netOut(); arrive(A);
  planForget();
  const said43 = [];
  const realAsk43 = window.popAsk, realToast43 = window.toast;
  window.popAsk = (msg) => { said43.push('ask'); };
  window.toast = (msg) => { said43.push('toast:' + msg); };
  const stopped43 = upStop(can('kb'));
  window.popAsk = realAsk43; window.toast = realToast43;
  if (!stopped43) no('43: 訊けていないのに通した');
  if (said43.filter((x) => x === 'ask').length)
    no('43: 訊けていないのに値段の頁を出した — ' + JSON.stringify(said43));
  if (!said43.filter((x) => x.indexOf('toast:') === 0).length)
    no('43: 何も言わずに止めた — ' + JSON.stringify(said43));
  /* そして訊けた上で足りなければ、今までどおり値段の頁へ。 */
  planGot('free');
  const said43b = [];
  window.popAsk = (msg) => { said43b.push('ask'); };
  upStop(can('kb'));
  window.popAsk = realAsk43;
  if (!said43b.length)
    no('43: 訊けていて足りないのに、値段の頁へ送らない');
  say('43: 訊けていないうちは「接続できません」── 値段の話は、訊けた上で' +
      '足りないときだけ');


  /* ---- 44. 投稿と下書きもアカウントのもの -------------------------------
     「アカウント新規作成してんのにまた前のアカウント残ってんだけど」 OWNER
     2026-09-03。新しいアカウントの自分のページが、前のアカウントの投稿で
     埋まっていた写真つき。

     `lingua.posts` は端末に一つの鍵で、`pfList()` は `p.mine`（投稿した時に
     サインインしていた人が書いた印）で自分のページを拾う。だから二人目が
     一人目の印を自分のものとして読む。サーバーは正しい ── 間違っていたのは
     「電波が無くても動くための写し」に持ち主が書いていないこと。

     www/me.js § meFor() が同じ欠陥を直しており、これはその答えを残り二つの
     鍵に当てたもの。**消さずに預ける** ── 入り直せば返る。 */
  /* この主張だけ別の二人を使う ── A と B は上の主張で何度も出入りしていて、
     その時に fixture の四つが預けられている。持ち込みたいのは「まだ何も
     預けていない二人」で、それは新しい uid のことです。 */
  start();
  netOut(); arrive('p44a');
  POSTS = [{ id:'pa', mine:true, tx:'A', at:1 }];
  DRAFTS = [{ id:'da', ln:'A' }];
  savePosts(); draftsSave();
  arrive('p44b');
  if (POSTS.length) no('44: 新しいアカウントに前の人の投稿が残っている — ' + POSTS.length);
  if (DRAFTS.length) no('44: 新しいアカウントに前の人の下書きが残っている — ' + DRAFTS.length);
  POSTS = [{ id:'pb', mine:true, tx:'B', at:2 }]; savePosts();
  arrive('p44a');
  if (POSTS.map(function(p){ return p.id; }).join(',') !== 'pa')
    no('44: A が入り直しても自分の投稿が返ってこない');
  if (DRAFTS.map(function(d){ return d.id; }).join(',') !== 'da')
    no('44: A の下書きが返ってこない');
  arrive('p44b');
  if (POSTS.map(function(p){ return p.id; }).join(',') !== 'pb')
    no('44: B が入り直しても自分の投稿が返ってこない');
  if (Object.keys(localStorage).filter(function(k){
        return k.indexOf('lingua.posts.') === 0; }).length < 2)
    no('44: 預けが残っていない ── 消すのではなく預ける');
  say('44: 投稿と下書きはアカウントのもの ── 二人目に一人目のは見えず、両方とも入り直せば返る');

  /* ---- 45. 赤い印は名前が重なった時だけ ---------------------------------
     「何で音で決めんの？文字の名前で決めろよ」 OWNER 2026-09-03。
     読みで見ていたので、ローマ字の既定が c k q x を全部 /k/ にするぶん、
     新品の言語が最初から三つ赤くなっていた。 */
  start();
  ltStart();
  if (LETTERS.filter(function(l){ return !!ltTaken(l); }).length)
    no('45: 新品のアルファベットに赤い印が付いている ── 誰も何もしていない');
  var l45a = LETTERS[0], l45b = LETTERS[1], was45 = l45b.nm;
  l45b.nm = ltName(l45a);
  if (LETTERS.filter(function(l){ return !!ltTaken(l); }).length !== 2)
    no('45: 名前が重なっても赤くならない');
  l45b.nm = was45;
  say('45: 赤い印は名前が重なった時だけ ── 音が同じでも印は付かない');

  /* ---- 46. アカウント削除は、そのアカウントのものだけを消す -------------
     「別アカウントでログインしてそれのアカウント削除したら、俺の元のアカウントが
     消えてんだよ」 OWNER 2026-09-03。**この検査が無かったから起きました。**
     act-check は削除の後どの画面に着くかしか訊いていません。

     サーバーは正しく、消えたのは端末です ── wipeHere() が lingua. を全部消し、
     bkDropAll() がバックアップのファイルも全部落としていた（そのファイルは
     2026-09-04 に無くなりました ── CLAUDE.md 規則 11）。2026-08-27 に「端末は一人の
     もの」だった頃の姿のままで、アプリの意味が「アカウントごと」に変わった
     あとも読み直されていなかった。 */
  start();
  netOut(); arrive('d46a');
  /* B の言語は B の索引にある（`lingua.langs.<uid>`、www/core.js § ACCT）。 */
  LANGS = { La46: { name:'A の言語', mine:true } };
  langOwnGot('La46', 'd46a'); langOwnGot('Lb46', 'd46b');
  langId = 'La46'; langStore();
  try{
    localStorage.setItem(acctKey('langs', 'd46b'), JSON.stringify({ Lb46: { name:'B の言語', mine:true } }));
    slWr(langKeyOf('La46','words'), '[{"hw":"a"}]');
    slWr(langKeyOf('Lb46','words'), '[{"hw":"b"}]');
    localStorage.setItem('lingua.me.d46b', '{"name":"B"}');
    localStorage.setItem('lingua.posts.d46b', '[{"id":"pb"}]');
  }catch(e){}
  SET.theme = 'dark'; SET.ui = 'ja'; SET.doneMoved = 1; save();
  var wasConfirm = window.confirm; window.confirm = function(){ return true; };
  try{ wipeHere(); }catch(e){ no('46: 削除が投げた ── ' + e.message); }
  window.confirm = wasConfirm;

  if (LANGS.La46) no('46: 消したアカウントの言語が索引に残っている');
  if (slRd(langKeyOf('La46','words'))) no('46: 消したアカウントの単語が残っている');
  if (!(acctRaw(acctKey('langs', 'd46b')) || {}).Lb46)
    no('46: **別のアカウントの言語が消えた** ── これが起きたことです');
  if (!slRd(langKeyOf('Lb46','words'))) no('46: 別のアカウントの単語が消えた');
  if (!localStorage.getItem('lingua.me.d46b')) no('46: 別のアカウントのプロフィールが消えた');
  if (!localStorage.getItem('lingua.posts.d46b')) no('46: 別のアカウントの投稿が消えた');
  /* テーマと表示言語はアカウントのものになりました（2026-09-09、
     www/core.js § SET_PREFS）。だから消したアカウントと一緒に落ちるのが
     正しい ── ここで見るのは、**この端末の設え**として残るもののほうです。
     `doneMoved` は移行の印で、印を付けた物（`walked`）がこの端末のものなので、
     印もこの端末のもの。`wldMoved` はそうではありません ── 移す物
     （`SET.world`）がアカウントのものなので、印もアカウントのもの（64 番、
     r73 § 2-7）。 */
  if (SET.doneMoved !== 1) no('46: この端末の移行の印まで消した');
  if (planKnown()) no('46: 消したアカウントの段が残っている — ' + plan());
  say('46: アカウント削除は、そのアカウントの言語・単語・投稿・段だけ ── '
    + '別のアカウントのものは一つも動かず、端末の設えも残る');

  /* ---- 47-49. 消し切るまで消えていない、そして消えた側は本当に出される ----
     OWNER 2026-09-03:
       「アカウント削除した場合は制作やSNS含め全てが消える。なにも残ってない。」
       「そもそもこのアプリはオンラインが基本なんだからね？SNSなんだから、
         削除し切ってないと消えない。」
       「2端末で同じアカウントにログインしてても、片方が消したら、もう片方も
         確実に消えるように。ログアウトさせて、新しいアカウント作ったら、
         もうひと端末も勝手にろぐいんされていたから。」

     46 番は「消したとき、消えるものが正しい」を押さえていて、**消えたかどうか
     を一度も訊いていません。** wipeHere() を直に呼んでいるからです。実際の
     ボタンは wipeAllGo() で、そこはサーバに訊きに行きます ── そして訊いた
     答えがどうであれ、成功の側と失敗の側の両方が wipeHere() を呼んでいました。
     だから電波の無いところで押すと、アカウントはサーバに残ったまま、端末の
     ほうだけが空になります。**サーバが記録なので、これは作ったものが消える
     向きの取り違えです。**

     49 番は別の端末の側です。account_delete() が auth.users の行を消すと、
     もう一方の端末が持っている refresh token は死にます。netResume() はそれを
     受けて netOut() し、セッションは確かに消えます ── **が、画面は描き直され
     ません。** boot.js の netResume() の失敗側は空の関数で、netOut() 自身は
     何も描かない。だから前のアカウントのアプリがそのまま映り続けます。

     ここで測るのは「描き直したか」ではなく **「画面が、今描いたらこうなる、
     というものになっているか」** です。render() を呼んだ結果と突き合わせます。 */
  const rXHR49 = window.XMLHttpRequest;
  const unwire49 = () => { window.XMLHttpRequest = rXHR49; };
  /* サーバを一つの関数に。answer(path) が数字を返し、0 は「届かなかった」。
     **線（XMLHttpRequest）の所に置きます** ── 窓（netSend1）の上に置くと、
     誰もサインインしていない要求を窓が断る所を飛ばしてしまい、サーバの代わり
     が答えてしまいます（「サインインしているかは窓だけが決める」r73 § 2-5）。 */
  const srv49 = (answer) => {
    window.XMLHttpRequest = function () {
      const self = this;
      this.readyState = 0; this.status = 0; this.responseText = '';
      this.open = function (m, u) { self.__p = String(u).replace(/^[a-z]+:\/\/[^/]*/, ''); };
      this.setRequestHeader = function () {};
      this.send = function () {
        const st = answer(self.__p);
        setTimeout(() => {
          self.readyState = 4; self.status = st; self.responseText = 'null';
          if (!st) { if (self.onerror) self.onerror(); return; }
          if (self.onreadystatechange) self.onreadystatechange();
        }, 0);
      };
    };
  };
  const settle49 = () => new Promise(r => setTimeout(r, 30));

  const D = '44444444-4444-4444-8444-444444444444';
  const seedD49 = () => {
    start();
    netOut(); arrive(D);
    LANGS.Ld47 = { name: 'D の言語', mine: true }; langOwnGot('Ld47', D);
    langId = 'Ld47'; langStore();
    try{ slWr(langKeyOf('Ld47','words'), '[{"hw":"d"}]'); }catch(e){}
  };

  /* 47. サーバが答えないとき、端末は空にならない。 */
  seedD49();
  srv49(() => 0);
  wipeAllGo();
  await settle49();
  unwire49();
  if (!LANGS.Ld47)
    no('47: **サーバが消していないのに端末の言語が消えた** ── 記録はサーバで、'
     + 'これは作ったものが消える向きの取り違えです');
  if (!slRd(langKeyOf('Ld47','words')))
    no('47: **サーバが消していないのに端末の単語が消えた**');
  if (!netSignedIn())
    no('47: 消えていないのにログアウトした ── アカウントはまだそこにあります');
  if (netEnded())
    no('47: **サーバへ行かなかったのに削除の印が付いた** ── 端末だけが終わった'
     + 'ことにしています。「通信エラーなら進むわけねえだろ全部」OWNER 2026-09-05');
  say('47: サーバが消し切っていないあいだは、端末のものは一つも消えず、印も付かない');

  /* 48. そして繋がったとき、続きから消える。
     47 番がそのまま続きです ── サインインしたまま、言語もそこにあり、印は
     付いていない。ポップの［再更新］が押した時と同じ wipeAllGo() を呼ぶので、
     二度目のための二本目の道はありません。

     印はここで初めて付きます ── netEndMe() がサーバの答えを持って返った瞬間、
     wipeHere() が端末を通り抜ける前。そこでアプリが閉じられた場合が
     www/boot.js の bootSession() が読む道で、要求が届かなかった場合ではない。 */
  srv49(() => 200);
  wipeAllGo();
  await settle49();
  await settle49();
  unwire49();
  if (LANGS.Ld47) no('48: 続きの削除で、その言語が消えていない');
  if (slRd(langKeyOf('Ld47','words')))
    no('48: 続きの削除で、その単語が消えていない');
  if (netSignedIn()) no('48: 消え切ったのにセッションが残っている');
  say('48: 途中で切れた削除は、次に開いたときサーバが答えて消し切られる');

  /* 49. 消された側の端末は、画面ごと出される。 */
  start();
  netOut(); arrive(D);
  /* 名前と @ が要ります。appIs() は「アカウントに名前が無ければまだ扉」と答える
     ので（www/shell.js）、名前を入れないとサインイン中も画面が扉のままで、この
     あとの引き比べが**扉と扉**になります。最初に書いたときそれで、印を外しても
     緑のままでした ── 検査が何も測っていませんでした。 */
  ME.name = 'D'; ME.handle = 'dee'; saveMe();
  render();
  const signedInScreen = document.getElementById('app').innerHTML;
  srv49(() => 400);
  await new Promise(r => netResume(r, r));
  await settle49();
  unwire49();
  const held = document.getElementById('app').innerHTML;
  if (netSignedIn()) no('49: セッションが終わったのに残っている');
  if (held === signedInScreen)
    no('49: **画面が前のアカウントのまま** ── セッションは終わったのに描き直されて'
     + 'いないので、消されたはずの端末がログインしたままに見えます');
  /* そして、映っているものが「今描いたらこうなる」ものであること。 */
  render();
  if (held !== document.getElementById('app').innerHTML)
    no('49: 画面が、今の状態を描いたものになっていない');
  say('49: セッションが終わった端末は、その場で画面ごと出される');

  /* 50. サインアウトしているときに削除を押しても、何も消えない。
     「アカウントを削除」の行はサインインしていてもいなくても出ます。セッション
     が無ければ「誰を消すのか」を証すものが無く、消せるアカウントもありません。
     それでも押せば端末だけが空になっていました ── uid が空文字で lsWipeAcct()
     に入るので、**印の付いていない言語**、つまりオンボーディングで作ってまだ
     一度も上がっていないものが、そこで消えていました。 */
  start();
  netOut();
  LANGS.Lx50 = { name: '印の無い言語', mine: true };
  langId = 'Lx50'; langStore();
  try{ slWr(langKeyOf('Lx50','words'), '[{"hw":"x"}]'); }catch(e){}
  srv49(() => 200);
  wipeAllGo();
  await settle49();
  unwire49();
  if (!LANGS.Lx50)
    no('50: **サインアウト中に削除を押したら、印の無い言語が消えた** ── '
     + 'サーバには何も頼んでいません');
  if (!slRd(langKeyOf('Lx50','words')))
    no('50: **サインアウト中に削除を押したら、印の無い言語の単語が消えた**');
  say('50: サインアウト中に削除を押しても、頼む相手がいないので何も消えない');

  /* ---- 51-52. 扉。六十秒と、コードの画面が一枚であること ----------------
     「8桁で60秒再送信」 OWNER 2026-09-03。

     52 のほうが根っこです。**コードを打つ画面は二枚ありました** ── 登録の道が
     着く一枚と、再設定の道が着く一枚。見出しも、下の一行も、欄も、確認も、
     再送信も同じで、押したときに呼ぶものだけが違いました。だから六十秒を
     足すと、片方にだけ入って、入らなかったほうは誰も見ません。扉が一日で
     四回形を変えて、そのたびに前の道が残った、その残りです。 */
  start(); SET.walked = true;
  obDoor('set', 'acct');

  /* 51. 送った直後は断り、残りが出て、六十秒経てば押せる。
     順は本物どおり ── コードが出て行ってから画面に来ます（obMailUpGo /
     obMailForgotGo / obMailAgain の三つとも obAgainSent() の次が描画です）。 */
  OBM.em = 'a@example.com';
  obAgainSent();
  obMailGo('code');
  let btn = document.getElementById('ob-again');
  if (!btn) no('51: コードの画面に再送信のボタンが無い');
  else {
    if (!btn.hasAttribute('disabled'))
      no('51: 送った直後なのに再送信が押せる ── 六十秒が効いていない');
    if (!/[0-9]/.test(btn.textContent || ''))
      no('51: 残りの秒が出ていない ── 押せない理由が画面のどこにも無い');
  }
  /* 押しても出て行かないこと。描き方ではなく、断るところで断っているか。 */
  {
    const rSend51 = netSend;
    let went = 0;
    netSend = function(){ went++; };
    obMailAgain();
    netSend = rSend51;
    if (went) no('51: 六十秒のあいだに押したら、本当に送りに行った');
  }
  /* 六十秒後。 */
  obAgainAt = (new Date()).getTime() - (OB_AGAIN_S + 1) * 1000;
  if (obAgainLeft()) no('51: 六十秒経っても残りが 0 にならない');
  obMailGo('code');
  btn = document.getElementById('ob-again');
  if (btn && btn.hasAttribute('disabled'))
    no('51: 六十秒経ったのに再送信がまだ押せない');
  obAgainTicOff(); obAgainAt = 0;
  say('51: コードを送ってから六十秒は送り直せず、残りの秒が画面に出る');

  /* 52. 二つの道が、同じ一枚に来る。押したときに呼ぶものだけが違う。 */
  {
    /* 扉の入口から訊きます。obCodeHTML() を二回呼んで引き比べても、一つの関数を
       自分と比べるだけで**絶対に赤くなりません** ── 押さえたいのは「二つの道が
       そこに来ているか」で、それを知っているのは obDoorHTML() です。 */
    const was = OBM.mode;
    OBM.mode = 'code';  const up = obDoorHTML();
    OBM.mode = 'reset'; const rs = obDoorHTML();
    OBM.mode = was;
    if (up.split('obMailCode').join('X') !== rs.split('obResetGo').join('X'))
      no('52: **コードの画面がまた二枚になっている** ── 押したときに呼ぶもの以外が'
       + '違います。片方だけに入った直しは、もう片方では誰も見ません');
    if (up.indexOf('ob-again') < 0 || rs.indexOf('ob-again') < 0)
      no('52: どちらかの道に再送信のボタンが無い');
  }
  say('52: コードを打つ画面は一枚 ── 登録の道も再設定の道も、そこに来る');

  SET.walked = true; SET.obback = null;

  /* ---- 53. 消したアカウントのキーボードと世界が、次の言語に書き込まれる ----
     「アカウント削除で残るものねえって言ってんだろ何回言わせんだよ全部消えんだよ。」
     OWNER 2026-08-27。「アカウント削除した場合は制作やSNS含め全てが消える。
     なにも残ってない。」 OWNER 2026-09-03。

     言語が持つものは SLICES に 12 並んでいます。そのうち大域に載るのは 10 で、
     それを読み直す並びが**五箇所に手で書いて**ありました。数は 5 / 7 / 9 / 10 で
     全部ちがい、**アカウント削除だけが 5 でした。**

     だから消したあと `KB` と `WLD` がメモリに残り、wipeHere() が新しい言語を
     一つ作って保存を呼ぶので、**消した人のキーボードと土地が、次の言語の鍵に
     書き込まれます。**メモリに残るだけではありません。ディスクに落ちます。

     CLAUDE.md 規則6 が名指ししている形です ──「a list of keys, written by hand,
     that nobody remembered to add to」。キーボードと世界は後から足されたスライス
     で、足した人は core.js の並びには入れ、settings.js の三箇所には入れなかった。 */
  start();
  const U53 = '66666666-6666-4666-8666-666666666666';
  netOut(); arrive(U53);
  LANGS[langId] = LANGS[langId] || { name: '消される言語', mine: true };
  LANGS[langId].mine = true; langOwnGot(langId, U53); langStore();
  KB = kbBoardsOf({ kbs:[{ nm:'消される人のキーボード', pat:'qwerty',
                           lay:[{ rows:[['a']] }] }], at:0 });
  saveKb();
  WLD = { where:'消される人の土地', who:'消される人' };
  saveWld();
  wipeHere(U53);
  if (KB && KB.kbs && KB.kbs.length)
    no('53: **消したアカウントのキーボードがメモリに残っている** ── 次の保存で'
     + '新しい言語に書き込まれます');
  if (WLD && WLD.where)
    no('53: **消したアカウントの世界（土地・人）がメモリに残っている**');
  saveKb(); saveWld();
  let k53 = null, w53 = null;
  try{ k53 = slRd(langKey('kb')); }catch(e){}
  try{ w53 = slRd(langKey('wld')); }catch(e){}
  if (k53 && k53.indexOf('消される人') >= 0)
    no('53: **消したアカウントのキーボードが、次の言語に書き込まれた**');
  if (w53 && w53.indexOf('消される人') >= 0)
    no('53: **消したアカウントの土地が、次の言語に書き込まれた**');
  say('53: アカウントを消したら、キーボードも世界も残らず、次の言語にも移らない');

  /* ---- 54. 言語のものを読み書きする一覧は一つで、SLICES と合っている ------
     53 が起きた形そのものを押さえます。手書きの一覧が八つある限り、次に
     スライスが一つ足されたとき、また同じことが起きます ── 過去に二回。
     キーボードはどこにも上がっておらず、世界は設定の中に居ました。

     `LANG_IO` が唯一の一覧で、ここが訊くのは「SLICES に一つ残らず答えているか」
     です。答えは読む関数・書く関数のどちらか、または「大域に写しを持たない」と
     いう一言。**黙って抜けているものが無いこと**が全部です。 */
  {
    let miss = [];
    for (let i = 0; i < SLICES.length; i++)
      if (!LANG_IO[SLICES[i]]) miss.push(SLICES[i]);
    if (miss.length)
      no('54: LANG_IO が答えていないスライスがある ── ' + miss.join(' ') +
         '。足したなら、読む関数・書く関数か、大域に持たない理由を一行で書く');
    let extra = [];
    for (const k of Object.keys(LANG_IO))
      if (SLICES.indexOf(k) < 0) extra.push(k);
    if (extra.length)
      no('54: LANG_IO に SLICES に無いものがある ── ' + extra.join(' ') +
         '。無くなったスライスの説明が残っています');
  }
  say('54: 言語のものを読み書きする一覧は一つで、SLICES の ' + SLICES.length +
      ' 個に一つ残らず答えている');

  /* ---- 55-57. 検索履歴はアカウントのもの ────────────────────────────────
     「アカウント消したのに検索履歴残ってたんだけどなんで？アカウント単位なのに
       それが残るの？全部アカウントだって言ってるやん おかしいだろお前
       一本化しろって。」 OWNER 2026-09-04。

     サーバーは正しく、残っていたのは端末の写しです。`recent_search` は
     `profile` から、`profile` は `auth.users` から cascade で落ちるので
     `account_delete()` が行を取ります。落ちなかったのは `SET.recent` ──
     2026-09-03 に足された欄で、`SET_ACCT` という**手で書いた六つの一覧**に
     入っていませんでした。46 が押さえたのは言語と投稿と段で、設定の中の
     欄は一つも押さえていません。

     一本化とは、`recent` を六つに足すことではありません。**訊き方を逆に
     する**ことです ── この端末の設えとして名前が書いてあるものだけが端末の
     もので、`SET` の残り全部はその人のもの。57 がそこを押さえます。 */

  /* 55. 消したら、その場で無くなる。画面の中にも、ファイルの中にも、
     預けた先にも。**預けた先が要ります** ── 削除は「預ける」道（setFor）を
     通るので、消してから預け直す順になっていました。 */
  start();
  netOut(); arrive('d55a');
  LANGS = { La55: { name:'A の言語', mine:true, uid:'d55a' } };
  langId = 'La55'; langStore();
  SET.recent = ['ねこ', 'いぬ']; SET.saved = ['とり']; save();
  var cf55 = window.confirm; window.confirm = function(){ return true; };
  try{ wipeHere(); }catch(e){ no('55: 削除が投げた ── ' + e.message); }
  window.confirm = cf55;

  if (snsRecent().length)
    no('55: **消したアカウントの検索履歴が画面に残っている** ── これが起きたことです ── ' +
       JSON.stringify(snsRecent()));
  {
    let f55 = {};
    try{ f55 = JSON.parse(localStorage.getItem('lingua.set') || '{}'); }catch(e){}
    if (f55.recent) no('55: 検索履歴が lingua.set に書き戻されている ── ' + JSON.stringify(f55.recent));
    if (f55.saved) no('55: 保存した検索が lingua.set に書き戻されている');
  }
  if (localStorage.getItem('lingua.set.d55a'))
    no('55: 消したアカウントの設定が lingua.set.<uid> に預け直されている ── ' +
       localStorage.getItem('lingua.set.d55a'));
  say('55: アカウントを消したら検索履歴も消える ── 画面にも、設定のファイルにも、預けた先にも残らない');

  /* 56. そして消さずに入れ替わるときは、**預けて返す。**履歴は人が作った
     ものなので、別の人が来ても消えません ── 脇に置いて、戻れば返る。
     meFor() と postFor() と同じ形です。 */
  start();
  netOut(); arrive(A);
  SET.recent = ['あさ', 'ひる']; save();
  netOut(); arrive(B);
  if (snsRecent().length)
    no('56: 別のアカウントに前の人の検索履歴が見えている ── ' + JSON.stringify(snsRecent()));
  SET.recent = ['よる']; save();
  netOut(); arrive(A);
  if (snsRecent().join(',') !== 'あさ,ひる')
    no('56: 戻ってきた人の検索履歴が返ってこない ── ' + JSON.stringify(snsRecent()));
  netOut(); arrive(B);
  if (snsRecent().join(',') !== 'よる')
    no('56: 二人目の検索履歴が返ってこない ── ' + JSON.stringify(snsRecent()));
  say('56: 検索履歴はアカウントごと ── 別の人には見えず、戻れば返る');

  /* 57. **数えていて、並べていない。**56 が通っても、明日足される欄はまた
     置いていかれます ── それが `recent` に起きたことです。ここが訊くのは
     一つだけ:「`SET` に名前を足したら、それはその人のものになるか」。

     `SET_PHONE` はこの端末の設えの一覧で、そこに無いものは全部その人のもの。
     だから知らない欄で押します ── 一覧に足していない、この検査が今作った
     名前で。並べる形に戻したら、ここが赤くなります。 */
  start();
  netOut(); arrive(A);
  SET.__later57 = 'この端末で作られた、明日の欄';
  save();
  netOut(); arrive(B);
  if (SET.__later57 !== undefined)
    no('57: **`SET` に足したばかりの欄が、次の人にそのまま渡っている** ── ' +
       JSON.stringify(SET.__later57) + '。SET_PHONE に無い欄はその人のもので、' +
       '預けて消えるはず。並べる一覧に戻っていませんか');
  netOut(); arrive(A);
  if (SET.__later57 !== 'この端末で作られた、明日の欄')
    no('57: 足したばかりの欄が、本人が戻っても返ってこない ── ' + JSON.stringify(SET.__later57));
  delete SET.__later57;
  /* そして逆向き ── **この端末の**設えは、誰が来ても動かない。テーマと
     表示言語は 2026-09-09 からアカウントのものなので、ここではない
     （64 番がそちらを持っています）。残っているのはこの端末の物の移行の印
     （`doneMoved`）とこの画面の測りです。 */
  SET.doneMoved = 1; SET.vvkb = 260; save();
  netOut(); arrive(B);
  if (SET.doneMoved !== 1 || SET.vvkb !== 260)
    no('57: この端末の設え（移行の印・この画面の測り）が、人が変わって動いた ── ' +
       SET.doneMoved + ' / ' + SET.vvkb);
  say('57: 一覧は数えていて並べていない ── 明日足す欄もその人のもの、端末の設えだけが残る');

  /* ---- 58. スタッフの @ を打って押すと、呼び出しが一回出る ---------------
     「スタッフ＠追加を押しても何も出ない」 OWNER 2026-09-06。押しても何も
     起きず、文言も出ない ── つまり画面が黙って戻っている線が疑われた。

     黙って戻る所は www/mod.js § adminStaffAdd の頭の二つだけです：
     ADMIN_BUSY が立っている（前の要求が返っていない）か、ADMIN_H が空
     （打った字が届いていない）。だから訊くのはその二つと、実際に出た要求の
     数の三つ。

     欄からは本物の input で読みます ── ADMIN_H に直に代入したら、届いて
     いるかどうかというこの問いを飛ばすことになる。act.js の一つの listener
     が `data-in` を読み、IN('adminStaffSet', ['h']) の引数の後ろに打った字を
     足して呼ぶ（www/act.js § actRun）ので、adminStaffSet(k, v) の順は
     ここで確かめられます。押す方も本物の click で、名前で関数を呼ばない。

     そして **一回**。二回出れば同じ人が二度書かれ、零回はこの一件そのもの。 */
  start();
  {
    const realSendSt = netSend, realGetSt = netGet;
    const rpc = [];
    netSend = (method, path, body, tok, ok2, bad2) => {
      rpc.push(String(path) + ' ' + JSON.stringify(body || null));
      /* 何も答えない ── 答えの側は rls-check が持っている。ここは
         「出たか」だけの話で、ok を呼べば adminLoad() が続けて別の要求を
         出すので、数えている物が二つになる。 */
    };
    netGet = () => {};
    ADMIN_OK = true; ADMIN_H = ''; ADMIN_BUSY = false; ADMIN_ERR = '';
    NAV = [{ r: 'admin' }]; route = 'admin';
    render();
    const fld = document.getElementById('admin-h');
    let busyAt = null, hAt = null, sent = [];
    if (fld) {
      /* 全角の＠ ── オーナーが打つのはこれ（www/net.js § netHandleOf）。 */
      fld.value = '＠iri';
      fld.dispatchEvent(new Event('input', { bubbles: true }));
      hAt = ADMIN_H;
      const btn = document.querySelector('#app [data-do="adminStaffAdd"]');
      busyAt = ADMIN_BUSY;
      if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      sent = rpc.slice();
    }
    netSend = realSendSt; netGet = realGetSt;
    ADMIN_OK = false; ADMIN_H = ''; ADMIN_BUSY = false; ADMIN_ERR = '';
    if (!fld)
      no('58: 管理の画面に @ を打つ欄が無い');
    else {
      if (hAt !== '＠iri')
        no('58: 欄に打った字が ADMIN_H に届いていない ── ' + JSON.stringify(hAt) +
           '。届かなければ adminStaffAdd() は頭で黙って戻り、画面には何も出ない');
      if (busyAt)
        no('58: 押す前から ADMIN_BUSY が立っている ── ' +
           'adminStaffAdd() は頭で黙って戻る');
      const adds = sent.filter((x) => x.indexOf('/rest/v1/rpc/staff_add') === 0);
      if (adds.length !== 1)
        no('58: 押して staff_add が ' + adds.length + ' 回 ── 出た要求は ' +
           JSON.stringify(sent) + '。零回なら「押しても何も出ない」そのもの、' +
           '二回なら同じ人が二度書かれる');
      else if (adds[0].indexOf('"h":"iri"') < 0)
        no('58: 送っている @ が違う ── ' + adds[0] +
           '（全角の＠を外して小文字にするのは www/net.js § netHandleOf）');
    }
  }
  say('58: 管理の欄に＠を打って押すと、staff_add の呼び出しが一回だけ出る');

  /* ---- 59-60. プロフィールは、出す物を全部読み込んでから開く --------------
     「開いた時フォロー中の横に数字でない。非公開の文字も出ない。全部読み込ん
     でから開くんじゃないの？」 OWNER 2026-09-07、実機 142。

     測った形がそのまま主張になっています。答えを全部わざと遅らせ、
     profileOpen('') を呼び、**最初にプロフィールが描かれた瞬間**の DOM を
     見る。そこにフォロー数と非公開の印が既に無ければ赤 ── 後から差し替えて
     いるということだからです。

     描画を数えるのではなく最初の一枚を捕まえるのは、後から入れる作りでも
     「最後には在る」は真になるからで、それは直る前の姿でもあります。
     直る前はここが空でした: 数字は 172ms、非公開は 330ms、画面は 164ms。

     `render` を包んで最初の一回を控えます。押した側が go() を呼ぶまで
     render は走らないので、これは「開いた時」そのものです。 */
  {
    const realSend59 = netSend, realGet59 = netGet, realSend159 = netSend1;
    /* どれ一つ答えないまま溜める ── 待っているのに開いたなら、それが赤です。
       一本ずつではなく列で持つのは、一つの答えが次の問いを出すからです
       （whose id を訊いてからフォローを訊く、など）。 */
    const waiting = [];
    netSend1 = function (m, p, b, t, ok) { waiting.push(function () { ok(fed(p), 200); }); };
    netSend = function (m, p, b, t, ok, bad, up) { netSend1(m, p, b, t, ok, bad, up, true); };
    netGet = function (p, ok, bad) { netSend('GET', p, null, '', ok, bad); };
    const SID59 = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
    const fed = (p) => {
      p = String(p);
      if (p.indexOf('/rest/v1/follow_seen?select=followed') === 0) return [{ followed_handle: 'iri' }];
      if (p.indexOf('/rest/v1/follow_seen?select=follower') === 0) return [{ follower_handle: 'veth' }];
      if (p.indexOf('/rest/v1/profile?select=id') === 0) return [{ id: SESS.uid }];
      /* the two counts are this account's own `profile_seen` row -- the same
         row somebody else's page is drawn from (www/me.js § whoOf) */
      if (p.indexOf('/rest/v1/profile_seen?') === 0)
        return [{ id: SESS.uid, handle: meHandle(), display: 'A', fo: 1, fr: 1 }];
      /* 非公開は **サーバーから来る** ── ここで直に代入したら、「印が描ける
         か」を訊くだけの検査になり、印が出なかった本当の理由（答えがまだ来て
         いない）を跨いでしまう。2026-09-08 まではその答えが `wld` スライスの
         `hide` で、今は `language` の行の `published_at` です
         （OWNER「端末に hide の存在があるわけないやろ」）。null が非公開。 */
      if (p.indexOf('/rest/v1/language?select=id,name,published_at&owner=') === 0)
        return [{ id: SID59, name: 'Shango', published_at: null }];
      if (p.indexOf('/rest/v1/slice?select=') === 0) return [];
      return [];
    };
    /* 何も答えていない状態に戻す ── PULL の表も、言語も、印も。
       この言語はサーバーに在る（sid）が、この端末はスライスを一つも
       持っていない ── 起動直後そのもの（規則 22、スライスは記憶の中）。 */
    PULL_GOT = {}; PULL_OUT = {}; PULL_WAIT = {};
    WHO_HAVE = {}; WHO_ASKED = {}; REL = {};
    langId = SID59;
    LANGS[langId] = { name: 'Shango', mine: true, uid: SESS.uid };
    langRowGot(langId);
    slRm(langKey('wld'));
    WLD = {};
    /* 何も聞いていない状態。LPUB は記憶の中の答えで、この端末が持つ意見では
       ありません（www/home.js § wldPubGot）。 */
    LPUB = {};
    NAV = [{ r: 'feed' }]; window.route = 'feed'; render();
    const wasFeed = document.getElementById('app').innerHTML;

    let first = null;
    const realRender59 = render;
    render = function () {
      const r = realRender59.apply(this, arguments);
      if (first === null && here().r === 'profile')
        first = document.getElementById('app').innerHTML;
      return r;
    };
    profileOpen('');
    const movedEarly = (document.getElementById('app').innerHTML !== wasFeed);
    /* 揃うまで画面は動かない。答えは一本も返していないので、ここで
       プロフィールに変わっていたら「読み込む前に開いた」ということ。 */
    if (movedEarly || first !== null)
      no('59: 答えが一本も返っていないのにプロフィールが開いた ── ' +
         '「押してから読み込みが終わるまで前の画面のまま」OWNER 2026-09-07');
    else say('59: 答えが返るまで、押した画面のまま動かない');

    /* そして揃った瞬間。溜めた答えを順に解く ── 解いた先で新しい問いが
       出れば、それも列の後ろに付く。 */
    for (let n = 0; n < 60 && first === null && waiting.length; n++) waiting.shift()();
    if (first === null)
      no('60: 答えが全部返ってもプロフィールが開かない');
    else {
      /* 「フォロー中」の横の数字と、言語の行の「非公開」の印。どちらも
         最初の一枚に在ること ── そして数字は **落ち着いたあとと同じ** で
         あること。「在る」だけを訊くと 0 が通ってしまい、0 と出て 1 に
         変わるのがこの一件そのものです。 */
      const nums = (h) => (String(h).match(/<b>\d+<\/b>/g) || []).join(',');
      const settled = nums(document.getElementById('app').innerHTML);
      if (!nums(first))
        no('60: 最初に描かれたプロフィールにフォローの数字が無い ── ' +
           '後から差し替えている。「開いた時フォロー中の横に数字でない」');
      else if (nums(first) !== settled)
        no('60: 最初の数字が落ち着いたあとと違う ── ' + nums(first) + ' → ' +
           settled + '。「0 と出て1秒後に1に変わる、をしない」');
      else if (settled !== '<b>1</b>,<b>1</b>')
        no('60: サーバーが答えた数（1 と 1）になっていない ── ' + settled +
           '（前回の値がそのまま出ていれば、この頁は自分の行を待っていない）');
      else if (first.indexOf('wldoff') < 0)
        no('60: 最初に描かれたプロフィールに非公開の印が無い ── ' +
           'wld のスライスがまだ来ていない。「非公開の文字も出ない」');
      else say('60: 最初に描かれた一枚に、フォローの数字も非公開の印も既に在る');
    }
    render = realRender59;
    netSend = realSend59; netGet = realGet59; netSend1 = realSend159;
    wldPubGot(langId, true);
    NAV = [{ r: 'profile' }]; window.route = 'profile';
  }

  /* ---- 61. 設定の見出しを七回叩く扉は、ログインし直しても開く -------------
     「設定7回タップしても管理画面開かんくなった」OWNER 2026-09-08、実機 143。
     @lingua でログイン中、その日にログアウト→ログインをしている。

     扉が見ているのは `NET_ADMIN`（www/mod.js § adminTap）で、それを立てていたのは
     ~~`netStaff()`~~ ただ一つ（今はこのアカウントの行を読む一つ、`netMyProfile()`）。
     呼んでいたのは **www/boot.js の起動一回だけ**でした。
     だからサインアウトのまま立ち上げた起動は一度も訊かず、そのあとドアから
     入っても誰も訊き直さない ── @lingua で入っているのに七回叩いても設定の
     ままです。測ってから直しました（起動から入れば `admin`、ドアから入れば
     `settings`）。

     訊くのは三つ。**七回叩いて着いた所**で訊きます ── `NET_ADMIN` を読むのは
     扉が見ているものを読み直すことで、扉そのものを通っていない。 */
  start();
  {
    const realGetAd = netGet, realSendAd = netSend;
    let handle = 'lingua';
    netGet = (path, ok) => {
      if (String(path).indexOf('/rest/v1/profile?select=' + profCols()) === 0)
        /* `admin` is the server's answer (profile_admin(), supabase/schema.sql):
           the handle, asked once there. */
        return ok([{ staff: true, handle: handle, banned_at: null, banned_why: null,
                     admin: handle === 'lingua' }]);
      return ok([]);
    };
    netSend = () => {};
    const tap7 = () => {
      window.route = 'settings'; NAV = [{ r: 'settings' }];
      ADMIN_TAPS = 0;
      for (let i = 0; i < 7; i++) adminTap();
      return String(window.route);
    };

    /* 入るのは B です。start() が A で入ったあと ── stub を置く前、本物の
       netGet が答えないまま ── なので、A で入り直すと「この人はもう訊いた」の
       印に当たり、どのバグを戻しても最初の主張が赤くなって**どれが原因かを
       言えなくなる**。別の人で入れば印は当たらず、下の三つはそれぞれ別の穴を
       指します（戻して確かめました）。 */
    netOut(); arrive(B);
    const fromBoot = tap7();
    if (fromBoot !== 'admin')
      no('61: @lingua で入って七回叩いても管理画面に立たない — ' + fromBoot);

    /* ログアウト。三つの答えは前のアカウントのものなので、置いていかない。 */
    netOut();
    if (NET_ADMIN || NET_STAFF || NET_BANNED)
      no('61: ログアウトしても管理の答えが残っている — NET_ADMIN=' + NET_ADMIN +
         ' NET_STAFF=' + NET_STAFF + ' NET_BANNED=' + JSON.stringify(NET_BANNED));
    const afterOut = tap7();
    if (afterOut === 'admin')
      no('61: サインアウトしているのに七回で管理画面が開く');

    /* そして入り直す ── 同じアカウントで。ここが実機の道で、ここが赤でした。 */
    arrive(B);
    const again61 = tap7();
    if (again61 !== 'admin')
      no('61: ログアウトして入り直すと七回叩いても開かない — ' + again61);

    /* 別の人。同じ七回で何も起きない。 */
    netOut();
    handle = 'aya';
    arrive(A);
    const other = tap7();
    if (other === 'admin')
      no('61: @lingua でない人が七回で管理画面に入れる');
    if (NET_ADMIN)
      no('61: @lingua でない人に NET_ADMIN が立っている');

    netGet = realGetAd; netSend = realSendAd;
    netOut(); arrive(A);
    say('61: 七回叩く扉は、起動から入っても、ログアウトして入り直しても開き、' +
        'サインアウト中と別の人には開かない');
  }

  /* ---- 62. 投稿の数と、自分が押したかは、サーバーのもの ------------------
     「端末に残すものないんですけど。サーバーで同じ機能になるように代替して」
     OWNER 2026-09-08。

     答えは `post_seen` の五つの列です。2026-09-08 まで二つありました ──
     端末が `li`/`bo`/`re` と `lime`/`bome` を持っていて、サーバーが何も
     言っていない投稿ではそちらを読んでいました。だから**この端末が自分で
     出した数が、直しようもなく画面に残り**、別の端末は違う数を出します。

     **2 は 2026-09-09 に上書きされました。**「Twitter もその仕様なはず。
     ハート押して 1 つくやん？サーバー飛んでないならハートが消えるでいいん
     じゃない？」OWNER。♡ は**押した瞬間に点いて数が 1 動き**、届かなければ
     消えて数が戻ります。何も言いません。動くのは**画面だけ**で、端末の写し
     には一バイトも書きません ── そこが 1 と喧嘩しない所です：写しは今も
     読まれず、書かれず、「押したか」の二つ目の答えは端末に無い（`PMARK` は
     走っているあいだのメモリで、答えが来た瞬間に消えます）。

     五本訊きます:
     1. 写しの中の数は読まない ── `li:99 lime:true` を持つ投稿が 0 と空の心
     2. 押した瞬間に♡が点いて数が 1 動く
     3. 戻ってきたら、サーバーが数えた数になる（自分で足したままにしない）
     4. 落ちたら押す前に戻る。そして写しの欄は書き換えも削除もされない
     5. 押しているあいだも、端末の写しには何も書かれていない

     赤を見た形（2026-09-09）: `postNLike()` に `: ((p && p.li)||0)` を戻すと
     1 が赤（99 が出る）。`postLike()` を答え待ちの形に戻すと 2 が赤。 */
  start();
  netOut(); arrive(A);
  {
    const realSend62 = netSend, realGet62 = netGet;
    /* 古い版がこの端末に残した数。人の仕事ではなく、この端末の足し算です。 */
    POSTS = [{ id:'q1', sid:'S1', at:1, who:'B', hd:'b', ln:'むこうの投稿',
               li:99, bo:88, re:77, lime:true, bome:true }];
    savePosts();

    let p62 = postById('q1');
    if (postNLike(p62) !== 0)
      no('62: 写しの中の数を読んでいる — いいね ' + postNLike(p62));
    if (postNBoost(p62) !== 0 || postNReply(p62) !== 0)
      no('62: 写しの中の数を読んでいる — リポスト ' + postNBoost(p62) +
         '、返信 ' + postNReply(p62));
    if (postILike(p62) || postIBoost(p62))
      no('62: 写しの中の「押した」を読んでいる');

    /* 押す。返事は握っておいて、押した瞬間の画面を読みます。 */
    let sent = [], asked = '', release = null;
    netSend = (m, path, body, tok, ok2, bad2) => {
      sent.push(m + ' ' + path);
      release = () => ok2([]);
    };
    netGet = (path, ok2) => {
      asked = path;
      ok2([{ id:'S1', author:B, created_at:'2026-08-30T00:00:00Z',
             body:{ ln:'むこうの投稿' }, likes:12, boosts:0, replies:0,
             i_like:true, i_boost:false }]);
    };
    postLike('q1');
    const atOnceN = postNLike(postById('q1')), atOnceI = postILike(postById('q1'));
    if (!sent.length || sent[0].indexOf('/rest/v1/react') < 0)
      no('62: 押しても react に行が出ていない — ' + JSON.stringify(sent));
    if (atOnceN !== 1 || !atOnceI)
      no('62: 押した瞬間に♡が点かず数も動かない — ' + atOnceN + '、' + atOnceI +
         '（「ハート押して 1 つくやん？」OWNER 2026-09-09）');
    /* 押しているあいだも、端末の写しは触られていない。動くのは画面だけ。 */
    {
      const mid = postById('q1');
      if (mid.nlike !== undefined || mid.ilike !== undefined)
        no('62: 押した瞬間に写しへ書いた — ' +
           JSON.stringify({ nlike:mid.nlike, ilike:mid.ilike }));
    }
    if (release) release();
    const nowN = postNLike(postById('q1')), nowI = postILike(postById('q1'));
    if (asked.indexOf('post_seen') < 0 || asked.indexOf('likes') < 0)
      no('62: 答えのあとに post_seen を訊いていない — ' + asked);
    if (nowN !== 12 || !nowI)
      no('62: サーバーが数えた数になっていない — ' + nowN + '、' + nowI +
         '（自分で 1 足していないか）');

    /* 落ちたとき。何も動かず、写しの欄も触られない。 */
    netSend = (m, path, body, tok, ok2, bad2) => { bad2(null, 0, 'down'); };
    netGet = (path, ok2) => ok2([]);
    /* 落ちた♡は、押す前に戻る ── 数もサーバーの 12 のまま。 */
    postLike('q1');
    {
      const f62 = postById('q1');
      if (postNLike(f62) !== 12 || !postILike(f62))
        no('62: 落ちた♡が押す前に戻っていない — ' + postNLike(f62) + '、' +
           postILike(f62));
    }
    postBoost('q1');
    const q62 = postById('q1');
    if (postNBoost(q62) !== 0 || postIBoost(q62))
      no('62: 落ちたのにリポストが動いた — ' + postNBoost(q62));
    if (q62.li !== 99 || q62.lime !== true || q62.bo !== 88 || q62.re !== 77)
      no('62: 写しの中の欄が書き換えられた（消しも書き換えもしない） — ' +
         JSON.stringify({ li:q62.li, lime:q62.lime, bo:q62.bo, re:q62.re }));

    netSend = realSend62; netGet = realGet62;
    say('62: 投稿の数と自分が押したかはサーバーのもの ── 写しの数は読まず、' +
        '♡は押した瞬間に点いて数が動き、戻ってきたらサーバーが数えた数になり、' +
        '落ちれば押す前に戻る（写しには一バイトも書かない）');
  }

  /* ---- 63. 書記体系は言語のもの ------------------------------------------
     「端末に残すものないんですけど。サーバーで同じ機能になるように代替して」
     OWNER 2026-09-08。

     `SET.wsys` は**人の設定**の一欄でした。`tools/store-check.mjs` が自分の
     言葉で GAP と書いていたとおり ──「言語のものなのに人の設定に入っている
     ので、公開した言語は書記体系を見せられない」。二つ言語を持っている人は、
     **両方に一つの答え**しか持てませんでした。

     四本訊きます:
     1. 選んだら列へ PATCH が飛び、**答えが戻ってから**画面が動く
     2. 言語ごとに違う ── 別の言語を開けば別の答え
     3. 落ちれば何も動かない
     4. `SET.wsys` には一字も書かない

     赤を見た形（2026-09-09）: `setWsys()` を `SET.wsys=k; save();` に戻すと
     1・2・4 が赤。 */
  start();
  netOut(); arrive(A);
  {
    planGot('pro');
    const realSend63 = netSend;
    const keepL63 = LANGS, keepId63 = langId;
    LANGS = { 'Lw': { mine:true }, 'Lx': { mine:true } };
    langRowGot('Lw'); langRowGot('Lx');
    langOwnGot('Lw', A); langOwnGot('Lx', A);
    langId = 'Lw';
    langWsysGot('Lw', ''); langWsysGot('Lx', 'logo');
    delete SET.wsys;
    let sent63 = null, letGo63 = null;
    netSend = (method, path, body, tok, ok2) => {
      if (method === 'PATCH'){ sent63 = body || {}; letGo63 = () => ok2([]); }
    };
    setWsys('syll');
    if (!sent63 || sent63.wsys !== 'syll')
      no('63: 選んでも列へ PATCH が出ていない — ' + JSON.stringify(sent63));
    if (langWsysOf('Lw') === 'syll')
      no('63: 答えが戻る前に決まったことになっている');
    if (letGo63) letGo63();
    if (langWsysOf('Lw') !== 'syll')
      no('63: 答えが戻っても決まっていない — ' + JSON.stringify(langWsysOf('Lw')));
    if (wsys() !== 'syll')
      no('63: 開いている言語の書記体系がその答えになっていない — ' + wsys());
    /* 言語ごとに違う。 */
    if (langWsysOf('Lx') !== 'logo')
      no('63: もう一つの言語の書記体系まで動いた — ' + JSON.stringify(langWsysOf('Lx')));
    langId = 'Lx';
    if (wsys() !== 'logo')
      no('63: 言語を開き替えても前の言語の答えが出ている — ' + wsys());
    langId = 'Lw';
    /* 落ちれば何も動かない。 */
    netSend = (method, path, body, tok, ok2, bad2) => {
      if (method === 'PATCH') bad2(null, 0, 'down');
    };
    setWsys('abugida');
    if (langWsysOf('Lw') !== 'syll')
      no('63: 落ちたのに書記体系が動いた — ' + JSON.stringify(langWsysOf('Lw')));
    /* 人の設定には一字も入らない。 */
    if (SET.wsys !== undefined)
      no('63: 人の設定に書記体系を書いた — ' + JSON.stringify(SET.wsys));
    if (SET_PHONE.indexOf('wsys') >= 0)
      no('63: SET_PHONE がまだ書記体系をこの端末の設えだと言っている');
    netSend = realSend63;
    LANGS = keepL63; langId = keepId63;
    planGot('free');
    say('63: 書記体系は言語のもの ── 列へ書き、答えが戻ってから動き、' +
        '言語ごとに違い、人の設定には入らない');
  }

  /* ---- 64. アプリの設えはアカウントのもの --------------------------------
     「端末ごとにやることなんてねえよ」「アカウントごとってずっと言ってるよな？」
     OWNER 2026-09-03、そして「端末に残すものないんですけど。サーバーで同じ
     機能になるように代替して」 OWNER 2026-09-08。

     テーマ・表示言語・自作フォントを使うか・自作文字を出すか・キーボードの
     ローマ字面。五つとも `SET_PHONE` に「この端末の設え」として入っていて、
     その一文が五つとも間違いでした ── **二台目にサインインすると、その端末が
     たまたまなっている形**でアプリが開きます。

     四本訊きます:
     1. 一つ変えると `prefs_put()` へ、変えた一つだけが載る（2026-09-23 から。
        前は PATCH で持っている欄を全部載せ、列を丸ごと置き換えていた ──
        r63-audit SQ1・L2）。まだ一度も聞いていない時は持っている欄を載せ、
        どちらでも誰も触っていない欄は作らない
     2. サインインで行が降りてきて、画面がその形になる
     3. 行が無ければ写しを触らない（「行が無い」は「何も選んでいない」ではない）
     4. `SET_PHONE` はもうこの五つを「この端末の設え」と言っていない

     赤を見た形（2026-09-09）: `SET_PREFS` を空にすると 1 と 2 が赤、
     五つを `SET_PHONE` へ戻すと 4 が赤。 */
  start();
  netOut(); arrive(A);
  {
    const realSend64 = netSend, realGet64 = netGet;
    let put64 = null;
    /* 答えも返す ── 送ったものが着いた、という形で。着かないままの押しは
       「まだ出ている押し」で、降りてきた値より新しい限り画面に残ります
       （www/net.js § netPrefsGot）。 */
    netSend = (method, path, body, tok, ok) => {
      if (method === 'POST' && path.indexOf('/rest/v1/rpc/prefs_put') === 0 &&
          body && body.p){ put64 = body.p; if (ok) ok(null); }
    };
    SET.theme = 'dark'; SET.myfont = false; SET.showScript = false;
    SET.kbrom = true;
    /* 両側が合意した形がある時: 変えた一つだけ。 */
    netPrefsSaw();
    setUi('ja');
    if (!put64) no('64: 設えを変えても prefs_put へ出ていない');
    else if (JSON.stringify(put64) !== JSON.stringify({ ui:'ja' }))
      no('64: 変えたのは ui 一つなのに、載ったのは ' + JSON.stringify(put64) +
         ' ── 変えていない欄を送ると、別の端末で変えた値を上書きする');
    /* まだ聞いていない時: 持っている欄を載せ、無い欄は作らない。 */
    put64 = null; NET_PREFS = null;
    netPrefsPut();
    if (!put64) no('64: まだ聞いていない時に、設えが出ていない');
    else {
      if (put64.ui !== 'ja') no('64: 変えた欄が載っていない — ' + JSON.stringify(put64));
      /* **持っている物は全部載る。**「五つとも載る」でした ── 2026-09-22 に
         通知の四つが `SET_PREFS` に入り、その一文が嘘になりました：四つは
         **触るまで `SET` に無く**、無いことがそのまま「オン」です（サーバーも
         同じ読み方をします ── www/push.js § pushWants）。触っていない欄を
         載せろと言うのは、既定を発明して上げろと言うのと同じです。

         なので訊き方を二方向にします。持っている欄が落ちていないこと ──
         これが `SET_PREFS` を空にすると赤になる半分 ── と、持っていない欄を
         勝手に作っていないこと。 */
      for (let z = 0; z < SET_PREFS.length; z++) {
        const k64 = SET_PREFS[z];
        const has64 = SET[k64] !== undefined;
        if (has64 && !Object.prototype.hasOwnProperty.call(put64, k64))
          no('64: この人が選んでいる ' + k64 + ' が載っていない — ' +
             JSON.stringify(put64));
        if (!has64 && Object.prototype.hasOwnProperty.call(put64, k64))
          no('64: **誰も触っていない ' + k64 + ' を作って上げている** — ' +
             JSON.stringify(put64[k64]) +
             '。無いことが答えです（既定を書き込むと、あとで既定を変えられません）');
      }
    }
    /* 降りてくる。 */
    SET.theme = 'system'; SET.ui = 'en'; SET.myfont = false;
    SET.showScript = false; SET.kbrom = true; setKeep();
    netGet = (path, ok) => {
      if (path.indexOf('/rest/v1/profile?select=' + profCols()) === 0)
        return ok([{ prefs: { theme:'dark', ui:'ja', myfont:true,
                              showScript:true, kbrom:false } }]);
      return ok([]);
    };
    netMyProfile(function () {}, function () {});
    if (SET.theme !== 'dark' || SET.ui !== 'ja' || SET.myfont !== true ||
        SET.showScript !== true || SET.kbrom !== false)
      no('64: サインインで降りてきた設えが画面に入っていない — ' +
         JSON.stringify([SET.theme, SET.ui, SET.myfont, SET.showScript, SET.kbrom]));
    /* 行が無ければ触らない。 */
    netGet = (path, ok) => ok([]);
    netMyProfile(function () {}, function () {});
    if (SET.theme !== 'dark' || SET.ui !== 'ja')
      no('64: 行が無いのを「何も選んでいない」と読んで、写しを消した — ' +
         JSON.stringify([SET.theme, SET.ui]));
    /* この端末の設えの一覧から外れている。 */
    for (let z = 0; z < SET_PREFS.length; z++)
      if (SET_PHONE.indexOf(SET_PREFS[z]) >= 0)
        no('64: SET_PHONE がまだ ' + SET_PREFS[z] + ' をこの端末の設えだと言っている');
    /* AND THE LATER PRESS STANDS (supabase/schema.sql § keep_newer,
       「普通後から変えたほうになる？」 OWNER 2026-09-04). A press carries when
       it happened; what prefs_put() hands back is what stands, and a phone
       whose press was older takes it. A press that has not landed gives way
       on the way down only to a LATER time. */
    {
      let e64 = null;
      const t64 = Date.now();
      netPrefsSaw();
      netSend = (method, path, body, tok, ok) => {
        if (path.indexOf('/rest/v1/rpc/prefs_put') === 0){
          e64 = body.e;
          /* the other phone chose dusk after this press */
          if (ok) ok({ theme:'dusk', ui:SET.ui });
        }
      };
      setTheme('light');
      if (!e64 || !(e64.theme >= t64))
        no('64: 押した時刻が設えと一緒に出ていない — ' + JSON.stringify(e64));
      if (SET.theme !== 'dusk')
        no('64: **後から押された別の端末の設えが画面に来ない** — ' + SET.theme);
      /* a press still out, and a read coming down: older gives way to it,
         later takes it */
      netSend = () => {};
      setTheme('light');
      netGet = (path, ok) => ok([{ prefs:{ theme:'noon' }, ed:{ 'prefs.theme':1000 } }]);
      netMyProfile(function () {}, function () {});
      if (SET.theme !== 'light')
        no('64: まだ着いていない押しが、それより古いサーバーの値に上書きされた — ' + SET.theme);
      netGet = (path, ok) => ok([{ prefs:{ theme:'night' }, ed:{ 'prefs.theme':Date.now() + 60000 } }]);
      netMyProfile(function () {}, function () {});
      if (SET.theme !== 'night')
        no('64: 後から押されたサーバーの値が、着いていない古い押しに負けた — ' + SET.theme);
      say('64: 設えは後から押したほうが残る ── 押した時刻が出て行き、答えと降りてきた値のうち後のものが画面に来る');
    }
    /* AND A MIGRATION'S MARK IS WHOEVER OWNS WHAT IT MARKS (r73 § 2-7).
       `wldMoved` says SET.world has been moved into the language, and
       SET.world is the account's -- so the mark is kept under it. As the
       handset's it stayed behind for the next account, whose own `world`
       was then never moved. */
    {
      SET.wldMoved = 1; setKeep();
      acctFor('uB-wld');
      const other = SET.wldMoved;
      acctFor(A);
      if (other)
        no('64: 前のアカウントの「移した」印が、次に入った人にも立っている ── ' +
           'その人の SET.world は言語へ移されない');
      if (!SET.wldMoved)
        no('64: 戻ってきた人の「移した」印が消えた');
      say('64: 移行の印は、移した物と同じくアカウントの物 ── 別の人には立たず、戻れば戻る');
    }
    netSend = realSend64; netGet = realGet64;
    SET.theme = 'system'; SET.ui = 'en'; setKeep();
    say('64: アプリの設えはアカウントのもの ── profile.prefs へ上がり、' +
        'サインインで降り、行が無ければ触らない');
  }

  /* ---- 65. 誰の言語かはサーバーの二つの列 --------------------------------
     「端末に残すものないんですけど。サーバーで同じ機能になるように代替して」
     OWNER 2026-09-08。

     `LANGS[id].uid` は**二つの事実を一つの欄で**答えていました ── 作った
     言語では書いた人、ダウンロードした言語では**取った人**（langSeenAdd
     自身のコメントが「AND IT CARRIES WHOEVER TOOK IT」と言っていた）。
     二つは、言語が人の間を移った瞬間にだけ食い違い、そこだけが問題になる
     ところです。`dlCount()` は後者を数えていたので、**上限は端末ごと**でした
     ── 同じアカウントの二台目は 0 から数え直します。

     いまは二つの問いで、どちらもサーバーのものです:
     書いた人は `language.owner`（`language_seen.owner`）、取ったことは
     `language_take` の行。

     四本訊きます:
     1. 索引に `uid` を書かない（もう二つの事実を一つの欄に入れない）
     2. ダウンロードの上限は `language_take` の行数（端末の索引ではない）
     3. まだ訊いていない言語は、どちらの側にも落とさず**描かない**
     4. アカウントを消すと、書いた言語も**取った言語**も端末から消える

     赤を見た形（2026-09-09）: `dlCount()` を索引を歩く形に戻すと 2 が赤、
     `langWhose()` の `LW_WAIT` を `LW_MINE` に倒すと 3 が赤。 */
  start();
  netOut(); arrive(A);
  {
    const keepL65 = LANGS, keepId65 = langId;
    /* 鍵はその言語の番号そのもの（2026-09-10、幹一本）── `language_take` が
       答えるのもこの番号で、突き合わせるものはありません。 */
    LANGS = { 'srv-made':  { mine:true },
              'srv-took':  { mine:false },
              'srv-asked': { mine:true } };
    langId = 'srv-made';
    langOwnGot('srv-made', A);       /* A が書いた */
    langOwnGot('srv-took', B);       /* B が書いたものを A が取った */
    langOwnGot('srv-asked', '');     /* まだ聞いていない */
    /* 「一度は上がった、しかし持ち主を誰も訊いていない」── 描かない側に
       落ちる一つで、それを言うのは `LROW` です（www/core.js）。 */
    langRowGot('srv-asked');
    langTookGot(['srv-took']);
    langStore();

    if (LANGS['srv-made'].uid || LANGS['srv-took'].uid)
      no('65: 索引にまだ uid を書いている ── ' +
         JSON.stringify([LANGS['srv-made'].uid, LANGS['srv-took'].uid]));
    if (dlCount() !== 1)
      no('65: 取った数がサーバーの行数になっていない — ' + dlCount());
    if (!langMine('srv-made')) no('65: 自分が書いた言語が自分のものでない');
    if (langMine('srv-took'))  no('65: 他人が書いた言語が自分のものになっている');
    if (langWhose('srv-asked') === LW_MINE)
      no('65: まだ聞いていない言語を「自分の」に倒した');
    if (vLangs().indexOf('srv-asked') >= 0)
      no('65: まだ聞いていない言語を画面に描いた ── 揃ってから開く');
    /* 訊いていない数は 0 ではない。 */
    langTookGot(null);
    if (dlCount() !== null)
      no('65: 訊いていない取得数が 0 になっている — ' + dlCount());
    langTookGot(['srv-took']);

    /* アカウントを消すと、書いた言語も取った言語も端末から消える。 */
    try{ slWr(langKeyOf('srv-made','words'), '[{"hw":"m"}]'); }catch(e){}
    try{ slWr(langKeyOf('srv-took','words'), '[{"hw":"t"}]'); }catch(e){}
    lsWipeAcct(A);
    if (LANGS['srv-made'])  no('65: 消したアカウントが書いた言語が残っている');
    if (LANGS['srv-took'])  no('65: 消したアカウントが取った言語が残っている ── ' +
                          '書いたのは他人なので「誰の」では見つからない');
    if (slRd(langKeyOf('srv-made','words')) || slRd(langKeyOf('srv-took','words')))
      no('65: 消したアカウントの単語が残っている');

    LANGS = keepL65; langId = keepId65; langStore();
    say('65: 誰の言語かは language.owner と language_take の二つ ── ' +
        '索引に uid は書かず、上限はサーバーの行を数え、聞いていない言語は描かない');
  }


  /* ---- 66. 登録の最後に、言語は一本 -------------------------------------
     hunt 道1（2026-09-11）: 門をくぐると `language` が**二本** POST される。
     一つは打った名前が付いていて中身が空、もう一つは名前が無くて歩きで描いた
     字が入っている方。道10 の「一アカウントで三本」も道11 の「名前の無い空の
     言語が開く」も、この一本目が割れたことの続きでした。

     測った原因（docs/scope/r24-lang.md）。セッションが着いたとき**二つの
     別の問い**が並んで走っていました ── 「この端末にある物をサーバーへ」と
     「このアカウントは何を持っているか」。後者が先に答えを出し、歩きの言語は
     まだ送られていないので「持っていない」と読まれ、扉が二本目を作りました。

     直った形は**送ってから訊く**です（`www/net.js` § netTook）。ここで歩くのは
     その road そのもの: まだ扉を通っていない端末に歩きの言語が一本、
     `netTook()`、そして答え。

     サーバーの代わりは `netPost`／`netGet`／`netSend` の三つを置き換えて
     その場で答えさせます ── この検査に本物のサーバーはなく、答えの**来ない**
     road は別の claim（電波なし）だからです。`netPost` は行った body を
     控えます: 道1 が見たのは「別々の uuid の body が二つ、一つは名前つき、
     一つは空」で、それはここにしか出ません。

     赤を見た形（2026-09-11、直す前）:
       「66: language の行が 2 本 POST された」
       「66: 上がった行が歩きの言語と打った名前になっていない」
       「66: 索引の言語が 2 本になった」「66: 開いているのが歩きの言語ではない」 */
  {
    window.__seed();
    wipeParked();
    netOut();
    /* まだ扉を通っていない端末。歩きが作った言語が一本あり、誰のものとも
       まだ言われていない ── 言うのはサーバーで、まだ何も送っていません。 */
    SET.walked = false; save();
    const keepL66 = LANGS, keepId66 = langId, keepNm66 = langName;
    const keepOb66 = ob.name, keepLid66 = ob.lid;
    LANGS = { 'walk-lang': { mine: true } };
    langId = 'walk-lang'; langName = 'シャンゴ';   /* obName() が打った瞬間に置く */
    langStore();
    /* 歩きで描いた字。これが最後にどの言語の中に居るかが、この案件の芯です。 */
    try { slWr(langKeyOf('walk-lang', 'letters'),
                JSON.stringify([{ id: 'l1', ab: 'a', name: 'a' }])); } catch (e) {}
    ob.name = 'シャンゴ'; ob.lid = '';
    PULL_GOT['mylangs'] = 0;
    /* 前の案件の `arrive()` が本物の XHR を出していて、答えが来ないまま
       `NET_SYNCING` が立っています ── 立っていると `netLangSync()` は
       何もせずに戻るので、この案件が測りたい road に入れません。 */
    NET_SYNCING = false;

    const rows66 = [];
    const keepPost66 = netPost, keepGet66 = netGet, keepSend66 = netSend;
    netPost = (path, body, tok, ok) => {
      if (String(path).indexOf('/rest/v1/language') === 0) rows66.push(body);
      ok([body]);
    };
    netGet = (path, ok) => ok([]);
    netSend = (m, path, body, tok, ok) => ok([]);
    /* サーバーが一覧を返す ── 歩きの言語は今まさに上がったところなので、
       一覧に何が居るかは `langOwnOf()` が既に持っています。 */
    PULL_GOT['mylangs'] = 1;

    netTook({ access_token: 'not a jwt', refresh_token: 'a refresh token',
              user: { id: A } });
    obFinish();
    netPost = keepPost66; netGet = keepGet66; netSend = keepSend66;

    if (rows66.length !== 1)
      no('66: language の行が ' + rows66.length + ' 本 POST された — ' +
         JSON.stringify(rows66.map(r => [String(r.id).slice(0, 9), r.name])));
    if (rows66.length && (rows66[0].id !== 'walk-lang' || rows66[0].name !== 'シャンゴ'))
      no('66: 上がった行が歩きの言語と打った名前になっていない — ' +
         JSON.stringify([rows66[0].id, rows66[0].name]));
    /* 行を**写しから作らない**（2026-09-11）。`wsys` は
       `langWsysOf()` ＝ サーバーが最後に言ったことの写し（メモリ →
       ディスクの `.got`）を送っていました ── 行の写しで行を作る形です。
       `language.wsys` は `default ''`「誰も言っていない」で、埋めるのは
       `setWsys()` → `netLangWsys()` の一本だけ。作られる行はその問いに
       答えません。 */
    if (rows66.length && rows66[0].hasOwnProperty('wsys'))
      no('66: 作る行が書記体系を持っている ── 写しで行を作っている — ' +
         JSON.stringify(rows66[0].wsys));
    /* 本数は索引で数えます ── 「このアカウントのもの」で数えると、扉で
       生えた方にだけ印が付いた状態が 1 本と出て、割れているのが見えません。 */
    const n66 = Object.keys(LANGS).length;
    if (n66 !== 1)
      no('66: 索引の言語が ' + n66 + ' 本になった ── 歩きは一本しか作っていない');
    if (langId !== 'walk-lang')
      no('66: 開いているのが歩きの言語ではない — langId=' + langId);
    if (langName !== 'シャンゴ')
      no('66: 打った名前が、開いている言語のものになっていない — ' +
         JSON.stringify(langName));
    if (String(slRd(langKey('letters')) || '').indexOf('l1') < 0)
      no('66: 歩きで描いた字が、開いている言語の中に無い');
    /* そして誰のものかを答えたのはサーバーです ── 行が出来た ok が書いた
       `owner`（www/net.js § netLangRow）。 */
    if (langOwnOf('walk-lang') !== A)
      no('66: 上がったのに、サーバーの答えが書かれていない — ' +
         JSON.stringify(langOwnOf('walk-lang')));

    LANGS = keepL66; langId = keepId66; langName = keepNm66;
    ob.name = keepOb66; ob.lid = keepLid66;
    SET.walked = true; save(); langStore();
    say('66: 登録の最後に言語は一本 ── 送ってから訊くので、打った名前も描いた字も' +
        'その一本の中、開いているのもそれ');
  }


  /* ---- 67. 名前と @ も、同じ保存でサーバーへ行く -------------------------
     hunt 道7（2026-09-11）: 名前と handle を変えて保存しても、サーバーの
     `profile` 行は前のまま。bio・link・loc は同じ保存でちゃんと上がり、
     断りのトーストも出ない。

     測った（docs/scope/r24-lang.md）:
       PATCH /rest/v1/profile  {"bio":"ここに一行"}
     `meProfPut()`（www/me.js）が `PROF_MINE` **だけ**を歩いて送る物を組んで
     いて、その一覧は bio・link・loc の三つでした。名前と @ はそこに無いので
     送られる先が無く、`meKeepPut()` が端末に書いて終わり。空の送信では
     ないので（bio が入っている）、断りも出ません。

     ここで押さえるのは「保存は一本の道で全項目を送る」ことだけです。列の名前
     （名前は `display`）も一緒に押さえます ── 端末の欄名で PATCH しても
     サーバーは黙って無視するので、何も throw せずに同じ所へ戻ります。

     赤を見た形（2026-09-11、直す前）:
       「67: 保存で name が送られていない」「67: 保存で handle が送られていない」 */
  start();
  {
    const sentAt = [];
    const keepPut = netProfPut, keepFree = netHandleFree;
    let at67 = null;
    netProfPut = (fields, at, ok) => { sentAt.push(fields); at67 = at; ok(fields); };
    netHandleFree = (h, ok) => ok(true);
    ME.name = 'アヤ'; ME.handle = 'aya'; ME.bio = ''; saveMe();
    meKeepSave({ name: 'アヤ改', handle: 'ayaka', bio: 'ここに一行' }, () => {});
    const sent = sentAt.length ? sentAt[0] : {};
    if (sentAt.length !== 1)
      no('67: 保存が一本の道で送っていない ── 送信 ' + sentAt.length + ' 回');
    if (sent.display !== 'アヤ改')
      no('67: 保存で name が送られていない — ' + JSON.stringify(sent));
    if (sent.handle !== 'ayaka')
      no('67: 保存で handle が送られていない — ' + JSON.stringify(sent));
    if (sent.bio !== 'ここに一行')
      no('67: 保存で bio が送られていない — ' + JSON.stringify(sent));
    /* 動いていない欄は送らない ── PATCH は動いた分だけ。 */
    sentAt.length = 0;
    meKeepSave({ name: 'アヤ改', handle: 'ayaka', bio: '二行目' }, () => {});
    const sent2 = sentAt.length ? sentAt[0] : {};
    if (sent2.hasOwnProperty('display') || sent2.hasOwnProperty('handle'))
      no('67: 動いていない名前と @ まで送っている — ' + JSON.stringify(sent2));
    /* 保存を押した時刻が、送る欄と一緒に出る（後から直したほうが残る、
       supabase/schema.sql § keep_newer）。 */
    if (!(at67 > 0))
      no('67: 保存を押した時刻が一緒に出ていない — ' + JSON.stringify(at67));
    /* そして返ってきた行が ME になる ── 別の端末が後から直した名前なら、
       それが名前。 */
    netProfPut = (fields, at, ok) => ok(Object.assign({}, fields, { display:'後から直した名' }));
    meKeepSave({ name: 'さきの名' }, () => {});
    if (ME.name !== '後から直した名')
      no('67: **後から別の端末で直した名前が、古い保存に負けた** — ' + ME.name);
    /* 送れなかったら端末にも書かない ── 保存は半分では済まない。 */
    netProfPut = (fields, at, ok, bad) => bad(null, 0, 'prof −');
    ME.name = 'アヤ改'; ME.handle = 'ayaka'; saveMe();
    meKeepSave({ name: 'もどらない', handle: 'nope' }, () => {});
    if (ME.name !== 'アヤ改' || ME.handle !== 'ayaka')
      no('67: 送れなかったのに端末の名前と @ が書き換わった — ' +
         ME.name + ' / ' + ME.handle);
    netProfPut = keepPut; netHandleFree = keepFree;
    /* そして行を**作る**所も同じ一覧を読みます。`netMakeProfile()` は列を
       一つずつ書き下していたので、「人の profile はどの列か」に**二つの
       答え**がありました ── 保存の road が名前と @ を持った日に、片方だけが
       持っている形です。

       **訊き方が要点です。**「五つ載っているか」を訊いても、書き下した方も
       同じ五つを載せるので緑のまま ── 二つの一覧が今日たまたま一致している
       ことしか言えません。だから**一覧に六つ目を足して**訊きます: 一覧を
       読んでいるなら六つ目も載り、書き下しているなら載りません。それが
       「一箇所」の中身そのものです。 */
    const keepCols67 = PROF_MINE;
    PROF_MINE = PROF_MINE.concat([['loc', 'a_sixth_column']]);
    let made67 = null;
    const keepPost67 = netPost;
    netPost = (path, body, tok, ok) => { made67 = body; ok([body]); };
    ME.bio = 'ここに一行'; ME.link = 'a.example'; ME.loc = 'どこか'; saveMe();
    netMakeProfile('ayaka', 'アヤ改', () => {}, () => {});
    netPost = keepPost67;
    PROF_MINE = keepCols67;
    for (const [f, c, want] of [['name', 'display', 'アヤ改'], ['handle', 'handle', 'ayaka'],
                                ['bio', 'bio', 'ここに一行'], ['link', 'link', 'a.example'],
                                ['loc', 'loc', 'どこか'],
                                ['六つ目', 'a_sixth_column', 'どこか']])
      if (!made67 || made67[c] !== want)
        no('67: 作る行が一覧を読んでいない ── ' + f + '（列 ' + c + '）が無い — ' +
           JSON.stringify(made67));
    say('67: 名前と @ も同じ保存でサーバーへ行く ── 列は display と handle、' +
        '動いた分だけ送り、送れなければ端末にも書かない。行を作る所も同じ一覧');
  }


  /* ---- 68. 行を作った瞬間に「行がある」になる ---------------------------
     hunt #1（2026-09-11）: 門の最後の「次へ」を押すと、トーストは
     「ログインしました」なのに**ログイン画面が出ます**。読み込み直すと普通に
     アプリが開くので、一度きり、アカウントを作った直後にだけ出る。

     測った値: `SET.walked=true`、`route='profile'`、`netSignedIn()=true`、
     そして **`meRowHas()=false`**。`appIs()`（www/shell.js）は行が無ければ
     'door' と答えるので、アカウントも profile 行も出来ているのに扉が描かれて
     いました。

     原因は一行の不在です。`meRowGot()` を書いていたのは `netMyProfile()` と
     `netProfSync()` の二つだけで、**どちらも「訊く」側**。行を**作る**
     `netMakeProfile()` は、作ったことを誰にも言っていませんでした。

     赤を見た形（2026-09-11、直す前）:
       「68: 行を作ったのに『行がある』になっていない」
       「68: 行を作ったのに画面が扉のまま — appIs()=door」 */
  start();
  {
    const keepPost68 = netPost;
    netPost = (path, body, tok, ok) => ok([body]);
    /* 扉の最後の一段: 歩きは済み、セッションは着いた、行はまだ無い。 */
    SET.walked = true; SET.obback = null; save();
    meRowForget();
    meRowGot(false);
    ME.handle = ''; ME.name = ''; saveMe();
    if (appIs() !== 'door')
      no('68: 行の無いアカウントで扉が出ていない — appIs()=' + appIs());
    netMakeProfile('aya', 'アヤ', () => {}, () => {});
    netPost = keepPost68;
    if (!meRowHas())
      no('68: 行を作ったのに「行がある」になっていない');
    if (appIs() !== 'app')
      no('68: 行を作ったのに画面が扉のまま — appIs()=' + appIs());
    say('68: 行を作った瞬間に「行がある」になる ── 扉の最後の「次へ」で' +
        'アプリが開く（訊きに行くのを待たない）');
  }

  /* ---- 69. 入り直したら、この端末の印ではなくサーバーの答えで進む -------
     「端末の物で分岐して、作る・消す・送る・見せる／見せない・数える を
     決める行は全部消す」OWNER 2026-09-11。

     `profile` の行が返ってきた**直後**に、`obIn()` は `SET.walked` を読んで
     行き先を選んでいました ── サーバーの答えが手元にあるその瞬間に、端末の
     印で分岐している唯一の場所です（`docs/reports/mixed-2026-09-11.md` #51）。

     行があるなら、この端末の印が何と言おうと歩きは終わっています。腕は一本
     です ── 歩きを済みにして、プロフィールを開く
     （「開く画面はプロフィール画面であって設定画面じゃない」OWNER
     2026-09-06）。

     **`obFinish()` ではありません。**あれは歩きの終いで、歩きで打った名前と
     描いた字の顔を取り、`netPrefsPut()` でこの端末の設えを上げます ── 入り
     直した人のものではなく、最後のは `meFor()` が降ろしたばかりのアカウント
     の設えを、この端末の物で上書きします。

     赤を見た形（2026-09-11）: `SET.walked=true; save(); goTab('profile');`
     を `if(SET.walked){ goTab('profile'); return; } obFinish();` に戻すと
     「入り直しでこの端末の設えを上げた（1 回）」が赤。印の方は
     `obFinish()` 自身が立てるので緑のまま ── 二本の腕が同じ所へ着くので、
     **違いが出るのは道中に何をしたか**です。 */
  start();
  {
    netOut(); arrive(A);
    const keepProf69 = netMyProfile, keepPrefs69 = netPrefsPut, keepWait69 = pageWait;
    let prefsUp69 = 0;
    netMyProfile = (ok2) => ok2({ handle: 'lingua9', display: 'Lingua' });
    netPrefsPut = () => { prefsUp69++; };
    /* 問うのは「どの画面へ行くか」で、行った先が何を読むかではありません ──
       その画面の読みは答えたことにして（www/shell.js § navLand が待つもの）、
       サーバーの無いこの頁で行き先そのものを見ます。 */
    pageWait = (r, a, done) => done(true);
    /* この端末は歩いていない ── 二台目、あるいはサインアウトしたあと。 */
    SET.walked = false; SET.obback = null; save();
    window.route = 'ob'; NAV = [{ r: 'ob' }];
    obIn();
    netMyProfile = keepProf69; netPrefsPut = keepPrefs69; pageWait = keepWait69;
    if (!SET.walked)
      no('69: 行のあるアカウントで入り直したのに、歩きが済みになっていない');
    if (window.route !== 'profile')
      no('69: 入り直した先がプロフィールでない — route=' + window.route);
    if (prefsUp69)
      no('69: 入り直しでこの端末の設えを上げた ── アカウントの設えを上書きする（' +
         prefsUp69 + ' 回）');
    say('69: 入り直しは profile の行で決まる ── 端末の印を読まず、歩きは済みに' +
        'なり、プロフィールが開き、この端末の設えは上がらない');
  }

  /* ---- 70. 名前も @ も profile の行から。作り出さない ------------------
     「誰の物か・あるか無いか・名前・公開か・段 ── 答えは全部サーバー」
     OWNER 2026-09-11。

     `meName()` は名前が無ければ **`langName`** ── 言語の名前、作る側の
     グローバル ── を返し、`meHandle()` はそれを小文字にして英数以外を
     落とし、**誰も選んでいない @ を作り出して**いました。その作られた @ が
     「この行は自分か」（`www/sns.js`）「このプロフィール頁は自分のか」
     （`www/home.js` § pfMine）「自分のフォロー一覧の鍵」の三つを決めます。

     CLAUDE.md 規則 8 の線を越えた形です ── 作る側のグローバルが読む側の
     答えになっている。**同じ言語名の二人は、その三つにとって同じ人**でした。

     行が無ければ空。当てずっぽうも、代わりの字も置きません
     （`appIs()` が扉を出すので、画面が困ることはありません）。 */
  start();
  {
    netOut(); arrive(A);
    const keepNm70 = langName;
    langName = 'Shango';
    ME.name = ''; ME.handle = ''; saveMe();
    if (meName() !== '')
      no('70: 名前が無いのに、言語の名前が自分の名前として返る — ' +
         JSON.stringify(meName()));
    if (meHandle() !== '')
      no('70: @ が無いのに、@ が作り出されている — ' +
         JSON.stringify(meHandle()));
    /* そして行が答えたら、その通りに返る。 */
    ME.name = 'アヤ'; ME.handle = 'aya'; saveMe();
    if (meName() !== 'アヤ' || meHandle() !== 'aya')
      no('70: 行が答えても、その名前と @ にならない — ' +
         JSON.stringify([meName(), meHandle()]));
    /* 作り出した @ で「自分か」を決めていた三つのうち、一つを押さえます ──
       他人のプロフィール頁が、言語名から作った @ と同じだと自分の頁に
       見えていました。

       赤を見た形（2026-09-11）: `ME.name || langName` と
       `String(meName()).toLowerCase().replace(/[^a-z0-9]+/g,'')` を戻すと
       三つとも赤。 */
    ME.name = ''; ME.handle = ''; saveMe();
    window.route = 'profile'; NAV = [{ r: 'profile', a: 'shango' }];
    if (pfMine())
      no('70: 他人のプロフィール頁が自分の頁と読まれた ── 言語名から @ を作っている');
    NAV = [{ r: 'profile' }];
    langName = keepNm70;
    say('70: 名前も @ も profile の行から ── 言語の名前から作り出さない');
  }

  /* ---- 71. ブロックした一覧はサーバーの `block` 一本 --------------------
     「NOTHING IS THE PHONE'S. EVERYTHING IS THE ACCOUNT'S.」

     `ME.bl` は**押した時にしか書かれず**、サーバーから埋め直す道がありません
     でした。二台目では空です ── タイムラインは `block` を訊くので正しく
     除きますが、… の menu は「ブロックする」と出ます。同じ問いに二つの答えが
     あって、画面が見せていたのは間違っている方でした。`ME.fo` / `ME.fr` は
     2026-09-09 に同じ理由で外れ、これだけ残っていました。

     押さえるのは三つ：**一つの road で降りること**、**handle と uuid が同じ
     答えの二つの形であること**、そして **`lingua.me` の `ME.bl` を一バイトも
     読まないこと**。

     赤を見た形（2026-09-11）: `meBlocking()` を `ME.bl` に戻すと三つ赤。 */
  start();
  {
    netOut(); arrive(A);
    /* 前の案件の `arrive()` が本物の XHR を出していて、答えが来ないまま
       `NET_BL_WAIT` が立っています ── 立っていると netBlockedRead() は列に
       並ぶだけで戻るので、この案件が測りたい road に入れません（30d と
       `NET_SYNCING` の同じ形）。 */
    netBlockedDrop(); NET_BL_WAIT = null;
    const keepGet71 = netGet;
    const asked71 = [];
    netGet = (path, ok2) => {
      asked71.push(String(path));
      if (String(path).indexOf('/rest/v1/block_seen') === 0)
        return ok2([{ id: 'uid-of-iri', handle: 'iri', display: 'Iri', av: null }]);
      return ok2([]);
    };
    /* 端末の古い写しは、読まれてはいけない方に置きます。 */
    ME.bl = ['nokori']; saveMe();
    let got71 = null;
    netBlockedRead((ids) => { got71 = ids; }, () => { got71 = 'FAILED'; });
    netGet = keepGet71;
    if (!got71 || got71 === 'FAILED' || got71.indexOf('uid-of-iri') < 0)
      no('71: block の行が降りてこない — ' + JSON.stringify(got71));
    /* 一本で、名前ごと（2026-09-24）。`profile_seen` はブロックの間に立つ人を
       もう返さないので（block_hides、両向き）、そこへ訊きに行く二本目は無い。 */
    if (asked71.length !== 1 || asked71[0].indexOf('/rest/v1/block_seen') !== 0)
      no('71: ブロックした人を一本の block_seen で訊いていない — ' + JSON.stringify(asked71));
    if (!netBlockedPeople().length || netBlockedPeople()[0].who !== 'Iri')
      no('71: 降りた行に名前が無い ── 設定の一覧はこの行から描く — ' +
         JSON.stringify(netBlockedPeople()));
    if (!meBlocks('iri'))
      no('71: サーバーがブロックと言っているのに、画面が知らない');
    if (meBlocks('nokori'))
      no('71: 端末の古い写し（ME.bl）をまだ読んでいる');
    if (meBlocking().indexOf('nokori') >= 0)
      no('71: 一覧に端末の古い写しが混ざっている — ' + JSON.stringify(meBlocking()));
    /* 訊いていないうちは「ブロックしていない」── この端末が、サーバーの
       言っていないことを言わない。 */
    netBlockedDrop();
    if (meBlocks('iri'))
      no('71: まだ訊いていないのに、ブロックしていると言っている');
    ME.bl = []; saveMe();
    say('71: ブロックした一覧はサーバーの block 一本 ── uuid と handle は同じ' +
        '答えの二つの形で、端末の写しは一バイトも読まない');
  }

  /* ---- 72. アカウントを消したら、その言語の鍵は一つも残らない -------------
     「アカウント削除で残るものねえって言ってんだろ何回言わせんだよ全部消えん
       だよ。」 OWNER 2026-08-27。

     2026-09-11 に測ったら残っていました ── サーバーが `users=0 profile=0
     language=0 slice=0` になったあとの端末に
     `lingua.<id>.name.got` と `lingua.<id>.owner.got` が二つ。
     `lsWipeAcct()` がその言語の鍵を **`SLICES` を歩いて**消していたからで、
     `name`・`wsys`・`owner` は `language` 行の**列**であってスライスではなく、
     このループより後に生まれました。CLAUDE.md がこの形を名前で呼んでいます
     ── **「a list of keys, written by hand, that nobody remembered to add
     to」**。

     だからこの claim も**名前を挙げません**。訊くのは一つだけ ──
     消したあと、`lingua.<その言語の番号>.` で始まる鍵が、ディスクにも記憶
     （`LSL`）にも**一つも無い**こと。明日足される鍵も、書いた日から
     この claim が見ます。

     赤を見た形（2026-09-11）: `lsWipeAcct()` の一掃を `SLICES` 歩きに戻すと
     `name.got` `wsys.got` `owner.got` `.was` の四つを挙げて赤。 */
  start();
  netOut(); arrive(A);
  {
    const keepL66 = LANGS, keepId66 = langId;
    const ID66 = 'lang-66';
    /* 索引の entry は「ここに在る」だけ（2026-09-11）── 誰の物かは
       下の `langOwnGot()`、`language.owner` です。 */
    LANGS = { [ID66]: {} };
    langId = ID66;
    /* スライスと、サーバーと合意した印。 */
    slWr(langKeyOf(ID66, 'words'), '[{"hw":"nokori"}]');
    slWr(langWasKey(ID66, 'words'), '[{"hw":"nokori"}]');
    slGot(langKeyOf(ID66, 'words'), '[{"hw":"nokori"}]');
    /* そして `language` 行の列 ── 名前・書記体系・書いた人。スライスでは
       ないので `SLICES` には居ません。 */
    langNameGot(ID66, '消される言語');
    langWsysGot(ID66, 'abugida');
    langOwnGot(ID66, A);

    lsWipeAcct(A);

    const pre66 = 'lingua.' + ID66 + '.';
    const left66 = [];
    try{
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf(pre66) === 0) left66.push(k);
      }
    }catch(e){}
    for (const k of Object.keys(LSL)) if (k.indexOf(pre66) === 0) left66.push(k + ' (LSL)');
    if (left66.length)
      no('72: **消したアカウントの言語の鍵が端末に残っている** ── ' +
         left66.sort().join(' ') +
         '。名前を挙げて消しているので、挙げ忘れたものが残ります');
    if (LANGS[ID66]) no('72: 消したアカウントの言語が索引に残っている');

    LANGS = keepL66; langId = keepId66; langStore();
    say('72: アカウントを消したら lingua.<言語の番号>. で始まる鍵は一つも' +
        '残らない ── 挙げるのではなく数えている（列も、明日足す鍵も）');
  }

  /* ---- 74. ログアウト→ログインで、空の言語がサーバーにできない ---------
     「そもそも端末を使用するところがないんだから直すじゃないでしょ設計ミス
     なんだから作り直しでしょ」 OWNER 2026-09-15。

     オーナーが実機（158）で見たもの: サーバー上の名前の無い空の `language`
     行を二本消した。そのあと 09:09:57 UTC、ログアウト→ログインした直後に、
     また名前の無い行（slice 0）が一本できた。

     読んで当てずに押して測る。端末の形は写真そのまま ── **索引にだけ在る
     言語**。行はサーバーで消されていて、`LROW`（「行がある」）は記憶だけ
     なので起動し直した端末では立っていない。`langMineIds()` はその言語を
     索引から拾って `netLangSync()` に渡し、`netLangRow()` が行を作り直す。

     赤を見た形（2026-09-15）: `POST /rest/v1/language` を数えて **1**。
     消された行が、名前の無い空の行として戻ってくる。

     `NET_SYNCING` を落としてから測るのは検査の都合です ── この検査には
     サーバーが無いので、前の案件が始めた送信が終わっておらず、`netLangSync()`
     が入口で帰ってしまう。アプリの話ではありません。 */
  {
    start();
    NET_SYNCING = false;
    /* 索引にだけ在る言語。中身は一つも持っていない ── サーバーで消された
       行の写しが端末に残るとこの形になる（列の写し `owner.got` は残るが、
       スライスは記憶と一緒に消えている）。 */
    LANGS['ghost-74'] = {};
    langOwnGot('ghost-74', A);
    /* そして、この端末が中身を持っている言語 ── fixture の言語そのもの。
       両側を訊くのは、片側だけだと「何も送らない」で緑になるからです：
       持っている物が上がらなくなったら、それは人の仕事が端末に閉じ込められた
       ということで、この直しが起こしてはいけない方の壊れ方です。 */
    const held74 = langId;
    const keep74 = netSend;
    const rows74 = [];
    netSend = function(method, path, body, tok, ok, bad, up){
      if (String(method) === 'POST' &&
          String(path).split('?')[0] === '/rest/v1/language') {
        let b = body;
        try{ b = (typeof body === 'string') ? JSON.parse(body) : body; }catch(e){}
        const one = (b && b.length) ? b[0] : b;
        rows74.push(String((one && one.id) || '?'));
      }
      return keep74(method, path, body, tok, ok, bad, up);
    };
    netOut();
    arrive(A);
    netSend = keep74;
    if (rows74.indexOf('ghost-74') >= 0)
      no('74: **サインインが空の言語をサーバーに作った** ── ' +
         'POST /rest/v1/language に ghost-74 が入っています。索引にしか無い' +
         '言語の行を作り直しました（送った id: ' + JSON.stringify(rows74) + '）');
    if (rows74.indexOf(held74) < 0)
      no('74: 中身を持っている言語が上がらなくなった ── ' + held74 +
         '（送った id: ' + JSON.stringify(rows74) + '）。' +
         '人の仕事が端末に閉じ込められます');
    delete LANGS['ghost-74'];
    langStore();
    say('74: ログアウト→ログインで作られる language の行は、この端末が中身を' +
        '持っている言語のぶんだけ ── 索引にしか無い行は上りに乗らない');
  }

  /* ---- 75. サーバーの答えに無い言語は、端末の写しから落ちる -------------
     「端末で使うものなんかないだろ」 OWNER 2026-09-15。

     消えるのは**端末の写しだけ**で、サーバーの行は一バイトも動きません
     （`netLangDrop()` は呼ばない ── 落ちる理由が「もう無い」ことなので、
     消す物が無い）。docs/CHANGELOG.md 2026-09-15 の DELETE REVIEW。

     四つを一度に訊きます:
       落ちる   ── 答えに無く、中身も持っていない索引の行
       落ちない ── 中身を持っているもの（まだ上がっていないだけかもしれない）
       落ちない ── 持ち主の答えが無いもの（答えと突き合わせようがない）
       サーバー ── DELETE は一本も出ない

     赤を見た形（2026-09-15）: `netLangsWalk()` は足りない物を埋めるだけ
     だったので、`gone-75` が `LANGS` にも `langsList()` にも残り、
     `langCount()` が 4 を答えた。 */
  {
    start();
    NET_SYNCING = false;
    planGot('pro');
    const keepL75 = LANGS, keepId75 = langId;
    LANGS = {
      'stay-75': {},   /* 答えに在る ── のこる */
      'gone-75': {},   /* 答えに無く、中身も無い ── 落ちる */
      'held-75': {},   /* 答えに無いが、中身を持っている ── のこる */
      'mute-75': {},   /* 持ち主の答えが無く、中身は持っている ── のこる */
      'stub-75': {}    /* 持ち主の答えも中身も行も無い ── 落ちる（空の枠） */
    };
    langId = 'stay-75';
    langOwnGot('stay-75', A); langNameGot('stay-75', 'のこる');
    langOwnGot('gone-75', A); langNameGot('gone-75', '消された');
    langOwnGot('held-75', A);
    /* 中身 ── まだサーバーへ行っていない誰かの仕事。持ち主の答えが有るものと
       無いもの、両方で訊きます：圏外で作った言語は答えが無いままなので、
       そこを落とすと一番失いたくないものを落とすことになります。 */
    slWr(langKeyOf('held-75', 'words'), '[{"hw":"mada"}]');
    slWr(langKeyOf('mute-75', 'words'), '[{"hw":"tunnel"}]');
    /* `stub-75` は www/core.js が読み込みで打つ最初の言語そのもの ──
       誰も署名しておらず、一文字も描かれておらず、行も無い。 */
    langStore();

    const keepGet75 = netGet, keepDrop75 = netLangDrop;
    const drops75 = [];
    netLangDrop = function(id, ok, bad){ drops75.push(String(id)); if (ok) ok(); };
    netGet = function(path, ok, bad){
      const p = String(path);
      if (p.indexOf('/rest/v1/language?') === 0)
        ok([{ id: 'stay-75', owner: A, name: 'のこる', wsys: '',
              published_at: null, created_at: '2026-01-01T00:00:00Z' }]);
      else if (p.indexOf('/rest/v1/slice?') === 0) ok([]);
      else ok([]);
    };
    let done75 = false;
    netLangsDown(function(){ done75 = true; });
    netGet = keepGet75; netLangDrop = keepDrop75;

    if (!done75) no('75: 答えを渡したのに netLangsDown() が終わっていない');
    if (LANGS['gone-75'])
      no('75: **サーバーの答えに無い言語が索引に残っている** ── gone-75。' +
         '消した行が「未設定」として一覧に並び続けます');
    if (!LANGS['stay-75']) no('75: 答えに在る言語が落ちた ── stay-75');
    if (!LANGS['held-75'])
      no('75: **中身を持っている言語が落ちた** ── held-75。' +
         'まだ上がっていない仕事が消えます');
    if (!LANGS['mute-75'])
      no('75: **持ち主の答えが無く、中身を持っている言語が落ちた** ── ' +
         'mute-75。圏外で作った言語はこの形です');
    if (LANGS['stub-75'])
      no('75: 空の枠が索引に残っている ── stub-75。持ち主の答えも中身も行も' +
         '無いものは言語ではなく、「未設定」として一覧に並び続けます');
    {
      const left75 = [];
      try{
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.indexOf('lingua.gone-75.') === 0) left75.push(k);
        }
      }catch(e){}
      for (const k of Object.keys(LSL))
        if (k.indexOf('lingua.gone-75.') === 0) left75.push(k + ' (LSL)');
      if (left75.length)
        no('75: 落ちた言語の鍵が端末に残っている ── ' + left75.sort().join(' ') +
           '。名前を挙げず、頭文字で数えて消します');
    }
    if (drops75.length)
      no('75: **サーバーの行を消しに行った** ── netLangDrop(' +
         drops75.join(', ') + ')。落ちるのは端末の写しだけです');
    {
      const seen75 = langsList();
      if (seen75.mine.indexOf('gone-75') >= 0)
        no('75: 落ちたはずの言語が一覧に出ている ── gone-75');
      /* stay と held の二本。mute は持ち主の答えが無いので LW_WAIT で、
         どの数にも入りません（www/core.js § langWhose）。 */
      if (langCount() !== 2)
        no('75: langCount() が ' + langCount() + ' ── 2（stay と held）ではない');
      if (seen75.mine.indexOf('stub-75') >= 0)
        no('75: 空の枠が一覧に出ている ── stub-75');
    }
    LANGS = keepL75; langId = keepId75; langStore(); planGot('free');
    say('75: サーバーの答えに無い言語は端末の写しから落ちる ── ' +
        '中身を持つものと持ち主の答えの無いものは残り、サーバーの行は動かない');
  }

  /* ---- 76. 答えが来ていないうちは「まだ訊けていない」 -------------------
     「電波が無いときは端末の写しは眺めるためだけ。数えない・決めない」
     OWNER 2026-09-15 の決定（`langStop()` が段を訊けていない時に断るのと
     同じ形）。

     索引はディスクに残るので、電波の無い起動には「言語が三本ある」ように
     見えます。それを数えると、天井に当たって**自分の次の言語を断られる**
     ── オーナーが実機で見た「アップグレードが必要です」がそれです。

     赤を見た形（2026-09-15）: `langCount()` が 2 を答え、`langStop()` が
     `up.need` のポップを出した。 */
  {
    start();
    planGot('pro');
    const keepL76 = LANGS, keepId76 = langId;
    LANGS = { 'a-76': {}, 'b-76': {} };
    langId = 'a-76';
    langOwnGot('a-76', A); langOwnGot('b-76', A);
    /* そして「この account の言語は何か」をサーバーはまだ答えていない。 */
    langMineForget();
    if (langCount() !== null)
      no('76: **訊けていないのに数えている** ── langCount()=' + langCount() +
         '。端末の索引を数えると、電波の無い起動が次の言語を断ります');
    if (langMainId() !== null)
      no('76: 訊けていないのに主言語を答えている ── ' + langMainId());
    {
      const said76 = [];
      const keepToast76 = toast, keepPop76 = popAsk;
      toast = function(m){ said76.push('toast:' + m); };
      popAsk = function(m){ said76.push('pop:' + m); };
      const stopped76 = langStop();
      toast = keepToast76; popAsk = keepPop76;
      if (!stopped76) no('76: 訊けていないのに言語を足させた');
      if (said76.join(' ').indexOf(t('net.offline')) < 0)
        no('76: 断り方が「接続できません」ではない ── ' +
           JSON.stringify(said76) + '。段を訊けていない時と同じ文言です');
    }
    /* 一覧は写しを描いてよい ── 眺めるためだけ（「前に読み込んだの出して
       いいよ」OWNER 2026-09-12）。畳まず、数も作らない。 */
    {
      const seen76 = langsList();
      if (seen76.mine.length !== 2)
        no('76: 訊けていない時に一覧が畳まれた ── ' +
           JSON.stringify(seen76.mine) + '。眺めるぶんは出します');
      if (seen76.hid) no('76: 訊けていないのに「非表示 n」を写しから作った');
    }
    LANGS = keepL76; langId = keepId76; langStore(); planGot('free');
    say('76: 答えが来ていないうちは数えない・決めない ── ' +
        '足すのは「接続できません」、一覧は写しを畳まずに出す');
  }


  /* ---- 77. 「この言語について」は、答えが着いた時に描かれる -------------
     オーナー、実機 159（2026-09-15 21:33 JST）:
       「設定→言語 の自分の言語 → この言語について が一生「通信中」で進まない」

     読まずに押して測った（docs/scope/r38-about.md に probe の出力）。この画面は
     `wldOpen().here()` = `wldPubKnown(langId)` を待つ ── 「この言語のページは
     公開か」にサーバーが答えたか、です（www/home.js § LPUB）。答えは三つの道が
     書きます。二つは書いたあとに画面へ知らせ、**行を作る道（netLangRow）だけが
     知らせません**。だから新しい account が最初の言語を作った直後にこの画面を
     開くと、答えが着いても丸は回ったままです。

     押して測った形（バグを入れたまま）:
       PROBE +6.2s   {"waiting":true, "LPUB":1, "known":true}
       PROBE +11.2s  {"waiting":true, "LPUB":1, "known":true}
     ── 答えは手元にあるのに、画面は待ちの丸。

     ここは行の答えを**手で握って**離します。時間ではなく順番で測るためです。 */
  {
    start();
    netOut();
    const keepL77 = LANGS, keepId77 = langId, keepNAV77 = NAV;
    /* 新規登録した account は、この端末が一度も持ったことの無い uid ──
       索引はアカウントの物（www/core.js § ACCT）なので、A を使うと前の
       案件の A の索引が扉で戻ってきます（測った、r79）。 */
    const U77 = '77777777-7777-4777-8777-777777777777';
    LANGS = {}; langId = '';
    NET_SYNCING = false;
    for (const k of Object.keys(LPUB)) delete LPUB[k];

    const nap = (ms) => new Promise(r => setTimeout(r, ms));
    const appIs77 = () => document.getElementById('app').innerHTML;
    const waiting77 = () => appIs77().indexOf('snswait') >= 0;

    const keep77 = netSend;
    let rowOk77 = null;      /* POST /rest/v1/language の答え ── 手で離す */
    netSend = function (method, p, body, tok, ok, bad) {
      const url = String(p).split('?')[0];
      /* 新規登録した account。サーバーに language の行は一本も無い ──
         端末が一本 mint して、行を POST する。 */
      if (url === '/rest/v1/language' && method === 'POST') { rowOk77 = ok; return; }
      if (url === '/rest/v1/language') { setTimeout(() => ok([]), 0); return; }
      if (url === '/rest/v1/slice') { setTimeout(() => ok(method === 'GET' ? [] : {}), 0); return; }
      if (url === '/rest/v1/profile') {
        setTimeout(() => ok([{ id: U77, handle: 'aya77', display: 'Aya' }]), 0); return;
      }
      setTimeout(() => ok([]), 0);
    };
    netTook({ access_token: 'not a jwt', refresh_token: 'a refresh token', user: { id: U77 } });
    /* 行の POST が出るまで ── ここまでで言語は mint されて開いています。 */
    for (let i = 0; i < 120 && !rowOk77; i++) await nap(25);

    go('about'); await nap(40);
    /* 前提。ここが偽なら下の claim は何も言っていないので、そう言います。 */
    const wasWaiting77 = waiting77();
    if (!wasWaiting77)
      no('77: (前提) 答えが出ている間にこの画面が待っていない ── ' +
         '測りたい状態に立てていません。fixture か偽サーバーの側の話です');
    if (!rowOk77)
      no('77: (前提) language の行の POST が出ていない ── ' +
         '端末は自分の最初の言語をサーバーへ出していません');

    /* サーバーが「行を作った」と答える。 */
    if (rowOk77) rowOk77({});
    await nap(60);

    if (!wldPubKnown(langId))
      no('77: 行の答えが着いても「この言語のページは公開か」が記録されない ── ' +
         'LPUB に ' + String(langId).slice(0, 8) + ' が入っていません');
    else if (waiting77())
      no('77: **答えが着いたのに「この言語について」が待ちの丸のまま** ── ' +
         'wldPubKnown() は真、画面は snswait。答えを書いた道が画面に' +
         '知らせていません（www/home.js § wldPubGot）');
    if (!waiting77() && appIs77().indexOf('abth') < 0)
      no('77: 待ちは解けたのに記事の見出しが無い ── ' +
         appIs77().replace(/\s+/g, ' ').slice(0, 120));

    netSend = keep77;
    LANGS = keepL77; langId = keepId77; NAV = keepNAV77; langStore();
    render();
    say('77: 「この言語について」は答えが着いた時に描かれる ── 答えを記録する' +
        '一箇所が画面に知らせる（道ごとに憶えているのではなく）');
  }


  /* ---- 78. Apple がくれた名前は、名前欄に入って出る ---------------------
     Apple の審査（ビルド 161、2026-09-18、Guideline 4）:
       「Sign in with Apple のあとに、名前かメールを入力させている。
         Authentication Services が既に渡している。」

     plugin は名前を渡していました ── `r.result.profile` の `givenName` /
     `familyName`（@capgo/capacitor-social-login の definitions.d.ts:688、
     Google は `name` も）。`obSocial()` は `idToken` だけ取って profile を
     捨てていたので、行の無い新しい account は「名前と @」の顔に名前の欄まで
     空で立たされていました。

     本物の `obSocial()` を押して測ります ── 偽の plugin と偽の netSend で、
     `obSignInApple()` から `OBM.nm` まで、途中を一つも飛ばさずに。

     四つの面。名前が来た時は **姓→名** で入っていること（`ja` なら
     「山田太郎」── 間の空白なし、`en` なら「Smith John」── 空白一つ、
     OWNER 2026-09-18）、Google が `name` を丸ごと渡した時はそのままで
     あること、そして **来なかった時は空のまま** であること ── Apple が名前を
     返すのは初回の認可だけで、二度目は null で来ます。そこに何かを入れるのは、
     名前を発明することです。 */
  {
    const nap78 = (ms) => new Promise(r => setTimeout(r, ms));
    const keepSend78 = netSend;
    const keepCap78 = window.Capacitor;
    netSend = function (method, p, body, tok, ok, bad) {
      const url = String(p).split('?')[0];
      if (url === '/auth/v1/token') {
        setTimeout(() => ok({ access_token: 'not a jwt', refresh_token: 'a refresh token',
                              user: { id: B } }), 0);
        return;
      }
      /* サーバーはこの account を知らない ── 新しい account とはそれです。 */
      setTimeout(() => ok([]), 0);
    };
    /* 一度押す。plugin が返す profile と、表示言語だけが面ごとに違います
       ── 姓と名の間の空白は表示言語で決まるので（OWNER 2026-09-18
       「山田太郎」）、両方の面を押します。`start()` が fixture を撒き直して
       `SET.ui` を `en` に戻すので、ここは start() の後です。 */
    const press78 = async (profile, ui) => {
      start();
      netOut();
      /* **表示言語は B の鍵に置きます。**`SET.ui` は account のもの
         （`SET_PREFS`）で、入ってくる B の `lingua.set.<B>` が先に来ます
         （`www/core.js` § acctFor ── 扉では B の物が勝ち、歩きの物は B に無い
         所だけを埋める）。ここで B の鍵に `ui` だけを置くのは、面ごとの表示
         言語を B の物として持たせるため。 */
      localStorage.setItem(acctKey('set', B), JSON.stringify({ ui: ui || 'en' }));
      OBM.nm = 'left over in memory'; OBM.hd = 'leftover'; OBM.mode = 'in';
      window.Capacitor = { Plugins: { SocialLogin: {
        initialize: () => Promise.resolve(),
        login: () => Promise.resolve({ provider: 'apple',
                                       result: { idToken: 'an id token', profile: profile } })
      } } };
      OB_SL = false;                       /* initialize をこの面でも通す */
      obSignInApple();
      for (let i = 0; i < 300 && OBM.busy; i++) await nap78(10);
      await nap78(30);

    };

    /* 一つ目 ── Apple が初回の認可で名前を渡してきた。日本語で。
       **姓→名で、間に空白なし**：「山田太郎」OWNER 2026-09-18。 */
    await press78({ user: 'apple-sub', email: 'relay@privaterelay.appleid.com',
                    givenName: '太郎', familyName: '山田' }, 'ja');
    if (OBM.mode !== 'who')
      no('78: (前提) Apple で入ったのに「名前と @」の顔に立っていない ── ' +
         'OBM.mode=' + JSON.stringify(OBM.mode) + '。測りたい状態に立てていません');
    if (OBM.nm !== '山田太郎')
      no('78: **Apple が渡した名前が「山田太郎」になっていない** ── ' +
         'OBM.nm=' + JSON.stringify(OBM.nm) + '、plugin は givenName「太郎」' +
         'familyName「山田」を渡しています。姓→名で、ja なら間の空白なし' +
         '（OWNER 2026-09-18「山田太郎」、Apple の審査 4、ビルド 161）');
    if (OBM.hd)
      no('78: @ に何か入っている ── OBM.hd=' + JSON.stringify(OBM.hd) +
         '。Apple は handle を持っていないので、ここは人が打ちます');

    /* 同じ名前を、表示言語が英語の面で ── **姓→名のまま、間に空白一つ**。
       「Smith John」を「SmithJohn」にはしません。順番は言語で変わりません
       （変わるのは空白だけ）。 */
    await press78({ user: 'apple-sub', email: 'relay@privaterelay.appleid.com',
                    givenName: 'John', familyName: 'Smith' }, 'en');
    if (OBM.nm !== 'Smith John')
      no('78: 英語の面で「Smith John」になっていない ── ' +
         'OBM.nm=' + JSON.stringify(OBM.nm) + '。姓→名は言語で変わらず、' +
         '変わるのは間の空白だけです（ja／zh／ko は無し、他は一つ）');

    /* Google は `name` を丸ごと渡してきます。**その時はそのまま** ──
       並べ替える材料が無く、並べ替えるのは名前を書き換えることです。 */
    await press78({ user: 'google-sub', email: 'somebody@example.com',
                    name: 'Ada Lovelace', givenName: 'Ada',
                    familyName: 'Lovelace' }, 'ja');
    if (OBM.nm !== 'Ada Lovelace')
      no('78: Google が丸ごと渡した name が書き換えられている ── ' +
         'OBM.nm=' + JSON.stringify(OBM.nm) + '。`name` がある時はそのままです');

    /* 二つ目 ── 二度目のサインイン。Apple は名前を返しません。 */
    await press78({ user: 'apple-sub', email: 'relay@privaterelay.appleid.com',
                    givenName: null, familyName: null }, 'ja');
    if (OBM.nm)
      no('78: 名前が来ていないのに名前欄に何か出ている ── ' +
         'OBM.nm=' + JSON.stringify(OBM.nm) + '。Apple が名前を返すのは初回の' +
         '認可だけで、埋めるのは名前を発明することです');
    if (OBM.hd) no('78: 名前が来ていない面で @ に何か入っている');

    window.Capacitor = keepCap78;
    netSend = keepSend78;
    OB_SL = false;
    start();
    say('78: Apple／Google が渡した名前は「名前と @」の名前欄に**姓→名**で ' +
        '入って出る ── ja／zh／ko は間の空白なし「山田太郎」、他は空白一つ' +
        '「Smith John」、Google の name は丸ごとそのまま、' +
        '来なかった時は空のまま（OWNER 2026-09-18、Apple の審査 4）');
  }


  /* ---- 79. お問い合わせは、押した人の名前で、打った物だけを送る ---------
     「設定にお問合せを足して欲しい。フォームみたいなの作ってみんなからの意見
     要望バグとかあればそれを見たい。」 OWNER 2026-09-22。

     **本物のボタンを押して測ります。**種類は行を押して選び、本文は欄に打ち、
     送るは送るボタンを押す ── どれも `data-do` を持った本物の要素への本物の
     click／input で、act.js の一本の listener を通ります。contactGo() を
     直接呼ぶと、ボタンとこの関数を結んでいる act-map.js の行が外れても緑の
     ままになります。それは「押せる」を測っていない検査です。

     四つ。空では送らないこと、空白だけでも送らないこと、送る時は
     `author = SESS.uid`・押した `kind`・打った `body` が載ること、そして
     届いたら欄が空になってこの画面を出ること。

     `author` はサーバーの policy も同じことを言います（`npm run rls`
     「B cannot write in A's name」）。ここで測るのは**アプリが自分の uid を
     押しているか**で、嘘が通らないことはあちらです。 */
  {
    start();
    netOut(); arrive(A);
    const keep79 = netSend;
    let sent79 = null, calls79 = 0;
    netSend = (method, path, body, tok, ok2) => {
      if (String(path).indexOf('/rest/v1/feedback') === 0) {
        calls79++; sent79 = { method: method, path: path, body: body };
      }
      if (ok2) ok2([]);
    };
    const open79 = () => {
      window.route = 'contact'; NAV = [{ r: 'settings' }, { r: 'contact' }];
      render();
    };
    const go79 = () => {
      const b = document.querySelector('[data-do="contactGo"]');
      if (!b) { no('79: 送るボタンが画面に無い'); return false; }
      b.click(); return true;
    };

    /* 空。押しても何も出ない。 */
    CONT = { kind: 'opinion', body: '', busy: false };
    open79(); go79();
    if (calls79 !== 0)
      no('79: **空で押したのに送っている** ── ' + JSON.stringify(sent79) +
         '。空は toast で断って送らない（何も書いていない物が運営の列に並ぶ）');

    /* 空白だけ。人から見れば空です。 */
    CONT = { kind: 'bug', body: '   \n  ', busy: false };
    open79(); go79();
    if (calls79 !== 0)
      no('79: **空白だけで押したのに送っている** ── ' + JSON.stringify(sent79));

    /* そして本物の道。行を押して種類を選び、欄に打ち、送るを押す。 */
    CONT = { kind: 'opinion', body: '', busy: false };
    open79();
    /* 種類は wheel です。「お問い合わせの意見とか縦に並べるのきもいから
       やめてくれ。選択肢気にしてくれ」 OWNER 2026-09-22 -- 三行ではありません。
       本物の `<select>` に本物の change を投げます。 */
    const sel79 = document.querySelector('[data-ch="contactKind"]');
    if (!sel79)
      no('79: **種類が wheel ではない** ── `<select data-ch="contactKind">` が' +
         '画面に無い（三行に戻っていないか）');
    else {
      const opts79 = sel79.querySelectorAll('option');
      if (opts79.length !== 3)
        no('79: 選択肢が三つではない ── ' + opts79.length + '（意見・要望・バグ）');
      /* 開いた時に一つ目が選ばれていること。「最初につけていいよ」 OWNER。 */
      if (sel79.value !== 'opinion')
        no('79: 開いた時に一つ目が選ばれていない ── ' +
           JSON.stringify(sel79.value));
      sel79.value = 'bug';
      sel79.dispatchEvent(new Event('change', { bubbles: true }));
      if (CONT.kind !== 'bug')
        no('79: wheel を回しても種類が変わらない ── CONT.kind=' +
           JSON.stringify(CONT.kind));
    }
    const ta79 = document.getElementById('cont-b');
    if (!ta79) no('79: 本文の欄が画面に無い');
    else {
      ta79.value = 'キーボードの3行目がずれます';
      ta79.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (CONT.body !== 'キーボードの3行目がずれます')
      no('79: 打った物が入っていない ── CONT.body=' + JSON.stringify(CONT.body));
    go79();

    if (calls79 !== 1)
      no('79: **送るボタンを押しても feedback へ POST が出ない** ── ' +
         calls79 + ' 回。設定→お問い合わせで書いた物がどこにも行きません');
    else {
      if (sent79.method !== 'POST')
        no('79: POST ではない ── ' + sent79.method);
      if (!sent79.body || sent79.body.author !== SESS.uid)
        no('79: **author が押した人の uid ではない** ── ' +
           JSON.stringify(sent79.body && sent79.body.author) + '、SESS.uid は ' +
           JSON.stringify(SESS.uid));
      if (!sent79.body || sent79.body.kind !== 'bug')
        no('79: 押した種類が載っていない ── ' +
           JSON.stringify(sent79.body && sent79.body.kind) + '（バグを押した）');
      if (!sent79.body || sent79.body.body !== 'キーボードの3行目がずれます')
        no('79: 打った本文が載っていない ── ' +
           JSON.stringify(sent79.body && sent79.body.body));
    }
    /* 届いたら欄は空になり、この画面を出ます。残っていると、次に開いた人が
       前の人の文を見て、二度送ります。 */
    if (CONT.body !== '')
      no('79: 送れたのに本文が残っている ── ' + JSON.stringify(CONT.body));
    if (here() && here().r === 'contact')
      no('79: 送れたのにお問い合わせの画面に立ったまま');

    /* そして 2000 字で打ち止め。「2000文字以降は勝手に文字消えるようにして
       いいよ」 OWNER 2026-09-22 -- 2001 字目からは入りません。本物の欄に
       本物の input を投げて測ります（`maxlength` は付けていないので、
       止めているのは contactSet() です）。 */
    CONT = { kind: 'opinion', body: '', busy: false };
    open79();
    const long79 = document.getElementById('cont-b');
    if (long79) {
      long79.value = 'あ'.repeat(2500);
      long79.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (CONT.body.length !== 2000)
      no('79: **2000 字で止まっていない** ── ' + CONT.body.length +
         ' 字入った。2001 字目からは入らない（サーバーの床は ' +
         'length(body) between 1 and 2000）');
    if (long79 && long79.value.length !== 2000)
      no('79: 欄の中が切られていない ── ' + long79.value.length +
         ' 字。打っている物と送る物が違うのは、画面が嘘をついている');

    netSend = keep79;
    CONT = { kind: 'opinion', body: '', busy: false };
    start();
    say('79: お問い合わせは本物のボタンを押して feedback へ ── ' +
        'author は押した人の uid、kind は押した行、body は打った物。' +
        '空でも空白だけでも送らない（OWNER 2026-09-22）');
  }


  /* ---- 80. 運営はお問い合わせを一件消せる、消えるのはその一件だけ --------
     「運営は消せるように。」 OWNER 2026-09-22。

     削除は必ず回帰テストを持つ（`CLAUDE.md` § Tests）。サーバーの側は
     `npm run rls` が持っています ── 本人も、アカウント無しも `feedback_drop()`
     を通れず、staff だけが通り、隣の行は残る。ここが持つのはアプリの側で、
     **本物の「消す」ボタンを押します**：popAsk の「消す」まで押して、
     `feedback_drop` に**その行の id** が行くこと、そして**押した一件だけ**が
     画面の一覧から消えること。

     隣の行が消えないことを別に問うのは、行き過ぎた削除が正しく見える唯一の
     形だからです ── 一件消えた画面と、全部消えた画面は、一件しか無ければ
     同じ絵です。だから二件置きます。 */
  {
    start();
    netOut(); arrive(A);
    const keep80 = netSend;
    let drop80 = null, calls80 = 0;
    netSend = (method, path, body, tok, ok2) => {
      if (String(path).indexOf('/rest/v1/rpc/feedback_drop') === 0) {
        calls80++; drop80 = body;
      }
      if (ok2) ok2([]);
    };
    const keepF80 = FBK, keepE80 = FBK_ERR, keepOK80 = ADMIN_OK;
    ADMIN_OK = true; FBK_ERR = '';
    FBK = [{ id: 22, kind: 'bug',     by: 'veth', at: Date.now(),
             body: 'キーボードの3行目がずれます' },
           { id: 11, kind: 'request', by: '',     at: Date.now() - 86400000,
             body: '文字を並べ替えられるようにしてほしい。' }];
    window.route = 'admin'; NAV = [{ r: 'admin' }, { r: 'admin', a: 'fb' }];
    render();

    const drops80 = document.querySelectorAll('[data-do="fbkDrop"]');
    if (drops80.length !== 2)
      no('80: 消すボタンが二つではない ── ' + drops80.length +
         '（一件に一つ。運営が消せるのは一件ずつ）');
    if (drops80.length) {
      drops80[0].click();
      /* 一度訊きます（通報を消すのと同じ形）。訊かずに消えるのは、戻せない
         物を押し間違いで消せるということ。 */
      /* `#pop.on` で、`#pop` ではありません。popOff() は `.on` を外すだけで
         markup を残すので、`#pop button` は**前の claim が閉じたポップの
         ボタン**を拾います ── 最初そう書いて、popAsk を外しても緑のままでした。
         生きているポップだけを指すのが `.on` です。 */
      const yes80 = document.querySelector('#pop.on [data-do="popYes"]');
      if (!yes80)
        no('80: **押しても何も訊かずに消えた** ── 戻せないので一度訊く' +
           '（通報を消すのと同じ形）');
      else yes80.click();
    }

    if (calls80 !== 1)
      no('80: **消すボタンを押しても feedback_drop が呼ばれない** ── ' +
         calls80 + ' 回');
    else if (!drop80 || drop80.f !== 22)
      no('80: **違う行の id が行っている** ── ' + JSON.stringify(drop80) +
         '、押したのは id 22。`f` という名前なのは feedback_drop(f bigint) で、' +
         'report_drop(r bigint) とは別の函数です');

    if (!FBK || FBK.length !== 1)
      no('80: **消した後に残っているのが一件ではない** ── ' +
         ((FBK || []).length) + ' 件。行き過ぎた削除は、一件しか無ければ' +
         '正しく見えます');
    else if (FBK[0].id !== 11)
      no('80: **残ったのが押していない方ではない** ── 残ったのは id ' +
         FBK[0].id + '、押したのは 22');

    netSend = keep80;
    FBK = keepF80; FBK_ERR = keepE80; ADMIN_OK = keepOK80;
    start();
    say('80: 運営は一件消せる ── 本物の消すボタン→一度訊く→feedback_drop に' +
        'その行の id、消えるのは押した一件だけ（OWNER 2026-09-22）');
  }


  /* ---- 81. 送信は右上、本文は画面全部、送ったら「送信しました」が出る -----
     「本文が増えたらこれ見えなくなるやろ送信右上にして本文は画面全部に広がる
     ようにして。送信したら送信しました。って出るようにして。」 OWNER
     2026-09-22。三つとも、**書いてある**ことと**出る**ことは別なので測ります。

     三つ目がこの claim の理由です。`contactGo()` には 2026-09-22 から
     `back(); toast(t('contact.sent'))` と書いてありましたが、**書いてある
     だけでは出ているとは言えません** ── `back()` は `render()` を呼びます。
     `#toast` は `#app` の外にある（www/shell.js § toast）ので消えない、
     というのがコードを読んだ答えで、読んだ答えは推測です
     （CLAUDE.md「原因は憶測ではなく確かめる」）。ここでは本物のボタンを
     押して、本物の返事を返して、**画面から読み返します**。

     一つ目（右上）は `.navtop` の中に居ることで測ります ── 本文の下の
     `.btn.ghost` に戻ると、そこには居ません。二つ目（画面全部）は欄が
     `fitin` を着ていること、つまり lnFit() が高さを触らない欄であること：
     伸びる欄に戻ると、長い本文でまた下へ伸びて送信を押し出します。 */
  {
    start();
    netOut(); arrive(A);
    const keep81 = netSend;
    /* 届いた、という返事。`netFeedbackSend()` の ok がこれで呼ばれます。 */
    netSend = (method, path, body, tok, ok2) => {
      if (ok2) ok2([]);
    };
    const open81 = () => {
      window.route = 'contact'; NAV = [{ r: 'settings' }, { r: 'contact' }];
      render();
    };

    /* ── 一つ目。送るはバーの隅に立っていて、本文の下には居ない。 */
    CONT = { kind: 'opinion', body: '', busy: false };
    open81();
    const bar81 = document.querySelector('.navtop [data-do="contactGo"]');
    if (!bar81)
      no('81: **送るがバーの右上に居ない** ── `.navtop` の中に ' +
         '`[data-do="contactGo"]` が無い。本文の下に置くと、長く書いたぶん' +
         'だけ下へ押し出されて画面から消えます（OWNER 2026-09-22）');
    const body81 = document.querySelector('.body [data-do="contactGo"]');
    if (body81)
      no('81: **送るが本文の下にも居る** ── 二つあると、どちらが押された' +
         'のか誰にも言えません');
    /* 空のあいだは消えている。navDo() の二つの状態（www/shell.js）。 */
    if (bar81 && bar81.className.indexOf('navon') >= 0)
      no('81: 本文が空なのに送るが光っている ── 押しても断られる物が' +
         '押せる色をしています');

    /* ── 二つ目。本文は残りを取る欄で、伸びる欄ではない。 */
    const ta81 = document.getElementById('cont-b');
    if (!ta81) no('81: 本文の欄が画面に無い');
    else if (String(ta81.className || '').indexOf('fitin') < 0)
      no('81: **本文が伸びる欄のまま** ── `fitin` が付いていないので ' +
         'lnFit() が中身のぶんだけ高さを付けます。「本文は画面全部に広がる' +
         'ようにして」は、残りを取って**中でスクロール**する欄のこと');
    else if (ta81.parentNode &&
             String(ta81.parentNode.className || '').indexOf('ctbody') < 0)
      no('81: 本文の欄が `.ctbody` の中に居ない ── 残りを取る形は' +
         'その二行（www/index.html）が付けています');

    /* 打つ。画面は描き直されない（指の下の欄が作り直されるので）ので、
       バーのボタンは手で塗り直されているはず ── それを読みます。 */
    if (ta81) {
      ta81.value = '三行目のキーがずれます';
      ta81.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const bar81b = document.querySelector('.navtop [data-do="contactGo"]');
    if (!bar81b || bar81b.className.indexOf('navon') < 0)
      no('81: **打っても送るが光らない** ── 打っている間この画面は描き直され' +
         'ないので、navDoPaint() で塗る一箇所が要ります（www/post.js の' +
         ' pwSetLn と同じ）。光らないボタンは押せるのかわかりません');
    /* そして欄そのものが作り直されていないこと ── render() を呼ぶと、
       打っている人の下から欄が消えます。 */
    if (document.getElementById('cont-b') !== ta81)
      no('81: **打つたびに画面を描き直している** ── 欄が別物になりました。' +
         '実機ではキーボードが下りてカーソルが飛びます');

    /* ── 三つ目。押す。「送信しました」が画面に出ていること。 */
    const toastEl = document.getElementById('toast');
    if (toastEl) { toastEl.textContent = ''; toastEl.className = ''; }
    const want81 = t('contact.sent');
    /* 隅のを押します。隅に無い時 ── それは上で赤くなっている ── でも、
       三つ目は別の主張なので、居る方を押して最後まで測ります。押す物が
       一つも無いのは赤一本で、そこで止まります。 */
    const go81 = bar81b || document.querySelector('[data-do="contactGo"]');
    if (!go81) no('81: 送るボタンが画面のどこにも無い');
    else go81.click();

    const tEl = go81 ? document.getElementById('toast') : null;
    if (go81 && !tEl)
      no('81: 画面に toast が無い');
    else if (tEl) {
      if (String(tEl.textContent || '') !== want81)
        no('81: **送ったのに「送信しました」が出ていない** ── toast に出て' +
           'いるのは ' + JSON.stringify(String(tEl.textContent || '')) +
           '、出るはずなのは ' + JSON.stringify(want81) +
           '（`contact.sent`）。「送信したら送信しました。って出るように' +
           'して」 OWNER 2026-09-22');
      if (String(tEl.className || '').indexOf('on') < 0)
        no('81: **「送信しました」が画面に出ていない** ── 字は入っているのに' +
           ' `.on` が付いていないので、透明なまま。back() の render() が' +
           '消しているなら、順を書き換える（toast は #app の外に居る）');
    }
    /* 出た画面は設定。お問い合わせに立ったままだと、同じ物を二度送ります。 */
    if (go81 && here() && here().r === 'contact')
      no('81: 送れたのにお問い合わせの画面に立ったまま');
    if (go81 && (!here() || here().r !== 'settings'))
      no('81: 送ったあとに立っているのが設定の画面ではない ── ' +
         JSON.stringify(here() && here().r));
    /* そして欄は空。次に開いた人が前の文を見ることはありません。 */
    if (go81 && CONT.body !== '')
      no('81: 送れたのに本文が残っている ── ' + JSON.stringify(CONT.body));

    netSend = keep81;
    CONT = { kind: 'opinion', body: '', busy: false };
    start();
    say('81: 送るはバーの右上（打つと光る、画面は描き直さない）、本文は残りを' +
        '取る欄（`fitin`）、送ったら画面に「送信しました」が出て設定へ戻り' +
        '欄は空（OWNER 2026-09-22）');
  }

  /* ---- 82. 通知のスイッチは四つとも動いて、prefs に上がる -------------
     「それに加えて設定で個別通知のオンオフできるように。」 OWNER 2026-09-22。

     **本物のスイッチを押します。**部屋を描いて、`data-do="pushSw"` を持った
     本物の行に本物の click を投げ、act.js の一本の listener を通します。
     pushSw() を直に呼ぶと、行とこの関数を結んでいる act-map.js が外れても緑の
     ままになります ── それは「押せる」を測っていない検査です。

     **四つとも押すのが要ります。**www/push.js の pushSw() は四つを名前で
     書き出します（`lingua.set` の中は名前で読めなければならない ──
     tools/store-check.mjs）。一つ書き忘れても、行は描かれ、押しても何も起きず、
     何も投げません。数えるのではなく四つ別々に押して、押した一つだけが動いた
     ことを見ます。 */
  {
    start();
    netOut(); arrive(A);
    const keep82 = netSend;
    let last82 = null, calls82 = 0;
    /* The settings go up through prefs_put() (supabase/schema.sql,
       2026-09-23) -- one key laid over the row, not the column replaced. */
    netSend = (method, path, body, tok, ok2) => {
      if (String(path).indexOf('/rest/v1/rpc/prefs_put') === 0) {
        calls82++; last82 = { method: method, body: body };
      }
      if (ok2) ok2([]);
    };
    const open82 = () => {
      window.route = 'set'; NAV = [{ r: 'settings' }, { r: 'set', a: 'push' }];
      render();
      return document.querySelectorAll('[data-do="pushSw"]');
    };
    const rows82 = open82();
    if (rows82.length !== PUSH_KINDS.length)
      no('82: 通知の部屋のスイッチが ' + PUSH_KINDS.length + ' 行ではない ── ' +
         rows82.length + ' 行');

    /* まだ誰も触っていない ── 四つとも「オン」で、SET には一つも無い。 */
    for (let i = 0; i < PUSH_KINDS.length; i++) {
      const k = PUSH_KINDS[i];
      if (SET['push_' + k] !== undefined)
        no('82: 何も押していないのに SET.push_' + k + ' がある ── ' +
           JSON.stringify(SET['push_' + k]) +
           '。既定はサーバーと同じ「無い＝オン」で、書き込みはしません');
      if (!pushWants(k))
        no('82: 何も押していないのに ' + k + ' がオフ');
    }

    /* 一つずつ押して、押した一つだけが動いて、その形で上がる。 */
    for (let i = 0; i < PUSH_KINDS.length; i++) {
      const k = PUSH_KINDS[i];
      const was = calls82;
      const r = open82()[i];
      if (!r) { no('82: ' + k + ' の行が画面に無い'); continue; }
      r.click();
      if (SET['push_' + k] !== false)
        no('82: **' + k + ' のスイッチを押しても SET.push_' + k + ' が動かない** ── ' +
           JSON.stringify(SET['push_' + k]) +
           '。pushSw() にその名前の行がありません（www/push.js）');
      for (let j = 0; j < PUSH_KINDS.length; j++) {
        if (j === i) continue;
        const o = PUSH_KINDS[j];
        if (SET['push_' + o] === false && j > i)
          no('82: ' + k + ' を押したら ' + o + ' まで動いた');
      }
      if (calls82 !== was + 1)
        no('82: ' + k + ' を押しても prefs が上がっていない ── ' +
           (calls82 - was) + ' 回');
      else {
        if (last82.method !== 'POST')
          no('82: prefs_put への POST ではない ── ' + last82.method);
        const pr = last82.body && last82.body.p;
        if (!pr || pr['push_' + k] !== false)
          no('82: **上がった prefs に push_' + k + ':false が無い** ── ' +
             JSON.stringify(pr) +
             '。サーバーはこの名前で読みます（`SET_PREFS`、www/core.js）');
      }
    }

    /* そしてもう一度押せば戻る ── スイッチであって、一度きりの宣言ではない。 */
    {
      const r = open82()[2];                       /* いいね */
      if (r) r.click();
      if (SET.push_like !== true)
        no('82: もう一度押しても戻らない ── SET.push_like=' +
           JSON.stringify(SET.push_like));
    }

    netSend = keep82;
    for (let i = 0; i < PUSH_KINDS.length; i++) delete SET['push_' + PUSH_KINDS[i]];
    start();
    say('82: 通知の四つは本物のスイッチを押して動く ── 押した一つだけが動き、' +
        '`prefs` に `push_<kind>:false` で上がり、もう一度押せば戻る。' +
        '何も押していない端末は四つとも「無い＝オン」（OWNER 2026-09-22）');
  }

  /* ---- 83. 扉を通ると、この端末の住所がこの account の名前で上がる -----
     「アップルのネイティブ通知で」 OWNER 2026-09-22。

     `LinguaPush` を偽物に差し替えて pushAsk() を通します。本物の Swift は
     Linux にありません ── ここで測るのは**アプリが自分の uid と Apple の
     token を組にして `device` へ出すか**で、Apple が token をくれるかは実機の
     話です（docs/CHECK-0907.md）。

     三つ。組の両方が載ること、許可が下りなければ一行も出ないこと、そして
     ネイティブが無い端末（＝ブラウザ）では何も起きないこと。 */
  {
    start();
    netOut(); arrive(A);
    const keep83 = netSend, cap83 = window.Capacitor;
    let sent83 = null, calls83 = 0;
    netSend = (method, path, body, tok, ok2) => {
      if (String(path).indexOf('/rest/v1/device') === 0) {
        calls83++; sent83 = { method: method, path: path, body: body };
      }
      if (ok2) ok2([]);
    };
    const fake83 = (answer) => {
      window.Capacitor = { nativePromise: (plug, m) => {
        if (plug !== 'LinguaPush') return Promise.reject('wrong plugin');
        if (m === 'status') return Promise.resolve({ status: 'denied' });
        return answer();
      } };
    };
    const settle = () => new Promise(r => setTimeout(r, 0));

    /* ネイティブが無い ── ブラウザ。何も起きない。 */
    window.Capacitor = undefined;
    pushAsk(); await settle();
    if (calls83 !== 0)
      no('83: ネイティブが無いのに device へ出している ── ' + JSON.stringify(sent83));

    /* 断られた。住所は無いので一行も出ない。 */
    fake83(() => Promise.reject('denied'));
    pushAsk(); await settle(); await settle();
    if (calls83 !== 0)
      no('83: **許可が無いのに device へ出している** ── ' + JSON.stringify(sent83) +
         '。断られた端末には届ける先がありません');

    /* 通った。 */
    fake83(() => Promise.resolve({ token: 'abc123' }));
    pushAsk(); await settle(); await settle();
    if (calls83 !== 1)
      no('83: **許可が下りたのに device へ POST が出ない** ── ' + calls83 +
         ' 回。通知の届く先がどこにも登録されません');
    else {
      if (sent83.method !== 'POST')
        no('83: POST ではない ── ' + sent83.method);
      if (!sent83.body || sent83.body.uid !== SESS.uid)
        no('83: **uid が今サインインしている人ではない** ── ' +
           JSON.stringify(sent83.body && sent83.body.uid) + '、SESS.uid は ' + SESS.uid);
      if (!sent83.body || sent83.body.token !== 'abc123')
        no('83: Apple がくれた token が載っていない ── ' +
           JSON.stringify(sent83.body && sent83.body.token));
    }

    /* サインアウトしていれば、誰の名前でも出さない。 */
    netOut();
    calls83 = 0;
    pushAsk(); await settle(); await settle();
    if (calls83 !== 0)
      no('83: サインアウトしているのに device へ出している ── ' + JSON.stringify(sent83));

    window.Capacitor = cap83; netSend = keep83;
    start();
    say('83: 扉を通ると端末の token が `device` へ ── uid は今サインインして' +
        'いる人、token は Apple がくれた物。断られた端末とブラウザと' +
        'サインアウトの三つからは一行も出ない（OWNER 2026-09-22）');
  }

  /* ---- 84. サインアウトは、この端末のこの人の行だけを落とす -----------
     出ていく人あての通知が、この iPhone に届き続けてはいけません。
     落とすのは**組の両方で絞った一行**で、その人の他の端末の行にも、この端末の
     他の account の行にも触りません（docs/CHANGELOG.md 2026-09-22 の
     DELETE REVIEW）。

     **本物の行を押します** ── 設定→アカウントの「サインアウト」を押し、出てきた
     popAsk の「はい」を押す。popAsk が無ければ即座に消える道になっていた、と
     いうことがここで分かります。

     そして DELETE は netOut() より**前**でなければ出せません ── 署名する token
     が netOut() で消えるからです。順番が逆になったら、この claim は
     「DELETE が出ない」で赤くなります。 */
  {
    start();
    netOut(); arrive(A);
    const keep84 = netSend, cap84 = window.Capacitor;
    let del84 = null, dels84 = 0;
    netSend = (method, path, body, tok, ok2) => {
      if (String(path).indexOf('/rest/v1/device') === 0 && method === 'DELETE') {
        dels84++; del84 = { path: path, tok: tok };
      }
      if (ok2) ok2([]);
    };
    /* まず住所を上げた端末にする ── 上げていない端末は落とす物がありません。 */
    window.Capacitor = { nativePromise: (plug, m) =>
      m === 'status' ? Promise.resolve({ status: 'authorized' })
                     : Promise.resolve({ token: 'tok-this-phone' }) };
    pushAsk();
    await new Promise(r => setTimeout(r, 0)); await new Promise(r => setTimeout(r, 0));
    const me84 = SESS && SESS.uid;

    window.route = 'set'; NAV = [{ r: 'settings' }, { r: 'set', a: 'acct' }];
    render();
    const out84 = document.querySelector('[data-do="setSignOut"]');
    if (!out84) no('84: サインアウトの行が画面に無い');
    else {
      out84.click();
      const yes84 = document.querySelector('[data-do="popYes"]');
      if (!yes84) no('84: サインアウトが訊かずに実行されている ── popAsk が出ていない');
      else yes84.click();
    }

    if (dels84 !== 1)
      no('84: **サインアウトしても device の行が落ちない** ── ' + dels84 +
         ' 回。出ていった人あての通知がこの端末に届き続けます。' +
         'netDeviceDrop() は netOut() より前でなければ token がありません');
    else {
      if (del84.path.indexOf('uid=eq.' + me84) < 0)
        no('84: **uid で絞っていない** ── ' + del84.path +
           '。この端末の他の account の行まで落ちます');
      if (del84.path.indexOf('token=eq.tok-this-phone') < 0)
        no('84: **token で絞っていない** ── ' + del84.path +
           '。その人の他の端末の行まで落ちます');
    }
    /* そして二度目は出ない ── 落とす物はもう無い。 */
    setSignOutGo();
    if (dels84 !== 1)
      no('84: もう一度サインアウトしたら二度落とした ── ' + dels84 + ' 回');

    /* そして**押していない道でも**落ちる（r65 S4、r79）── サーバーが refresh
       token を断った時（別の端末でアカウントが消された、など）も netOut() を
       通るので、同じ一本が出る。前はサインアウトを押した道だけだった。 */
    arrive(A); pushAsk();
    await new Promise(r => setTimeout(r, 0)); await new Promise(r => setTimeout(r, 0));
    const before84 = dels84, keepPost84 = window.netPost;
    window.netPost = (path, body, tok, ok3, bad3) => { bad3(null, 401); };
    netResume(function () {}, function () {});
    window.netPost = keepPost84;
    if (dels84 !== before84 + 1)
      no('84: **refresh を断られて出た道で device の行が落ちない** ── 通知が、誰も' +
         'サインインしていない端末に届き続けます');

    window.Capacitor = cap84; netSend = keep84;
    start();
    say('84: サインアウトはこの端末のこの人の `device` の行だけを落とす ── ' +
        'uid と token の両方で絞り、netOut() の頭で出す ── 押した道も断られた道も。' +
        '落とす物が無ければ何も出さない（DELETE REVIEW、2026-09-22）');
  }

  /* ---- 85. サインインしていない人の分は、一本も線に乗らない -------------
     「サーバーは、サインインしていない人には何も返さない」 OWNER 2026-09-22。

     **`netSend` を偽物にしません。**ここで測るのは「アプリが何を送ったか」では
     なく「**そもそも送ったか**」で、偽の netSend はまさにその一段を飛ばします。
     なので `XMLHttpRequest.prototype.open` を包んで、実際に開かれた URL を
     数えます ── netSend1() が握りつぶしたなら、ここには一本も来ません。

     三つ。サインアウトしていれば `/rest/v1/*` は一本も開かれず、断り方は
     アプリの持っている文（401 →「サインインし直してください」）であること。
     扉（`email_taken` と `/auth/v1/*`）はサインアウトでも通ること。そして
     サインインしていれば、どの一本も `Bearer <SESS.at>` を持ち、
     Authorization に**匿名キーが載らない**こと。

     赤を見た形：`netGet()` の `|| ''` を戻す（サインアウトで GET が出る）。 */
  {
    start();
    const openWas = XMLHttpRequest.prototype.open;
    const hdrWas = XMLHttpRequest.prototype.setRequestHeader;
    let opened = [], auth = [];
    XMLHttpRequest.prototype.open = function (m, u) {
      opened.push({ m: m, u: String(u) });
      return openWas.apply(this, arguments);
    };
    XMLHttpRequest.prototype.setRequestHeader = function (k, v) {
      if (String(k).toLowerCase() === 'authorization')
        auth.push({ u: (opened.length ? opened[opened.length - 1].u : ''), v: String(v) });
      /* 実際には送りません ── この検査にサーバーは無く、開いたことと、どの
         鍵で署名しようとしたかだけが要ります。 */
      return hdrWas.apply(this, arguments);
    };
    const rest = () => opened.filter(o => o.u.indexOf('/rest/v1/') >= 0);

    /* サインアウト。読みにいく道を何本か、実際に呼ぶ。 */
    netOut();
    opened = []; auth = [];
    let why85 = null;
    netGet('/rest/v1/profile?select=prefs&limit=1&id=eq.x',
           function () { no('85: サインアウトなのに profile が答えた'); },
           function (d, st, mk) { why85 = netWhy(d, st, mk); });
    netMyProfile(function () {}, function () {});
    netDevicePut('tok');
    if (rest().length !== 0)
      no('85: **サインアウトなのに ' + rest().length + ' 本が線に乗った** ── ' +
         JSON.stringify(rest().map(o => o.u.split('/rest/v1/')[1]).slice(0, 6)) +
         '。サーバーは断りますが、断られるまで行くこと自体が間違いです');
    if (why85 !== t('net.session'))
      no('85: 断り方がアプリの文になっていない ── ' + JSON.stringify(why85) +
         '（欲しいのは `net.session`「' + t('net.session') + '」。' +
         '0 は「線が落ちた」で、これは「誰もサインインしていない」）');

    /* 扉は通る ── ここが閉まると、誰も入れなくなります。 */
    opened = [];
    netMailTaken('aexample.com', function () {}, function () {});
    netSignIn('aexample.com', 'pw', function () {}, function () {});
    if (!opened.some(o => o.u.indexOf('email_taken') >= 0))
      no('85: **扉が閉まっている** ── email_taken が出ていません。' +
         '「サインイン」と「新規作成」を出し分けられなくなります');
    if (!opened.some(o => o.u.indexOf('/auth/v1/') >= 0))
      no('85: **サインインそのものが出ていない** ── /auth/v1/ が一本も無い');

    /* サインインしていれば、どれも本人の token で。 */
    arrive(A);
    opened = []; auth = [];
    netGet('/rest/v1/profile?select=prefs&limit=1&id=eq.' + A,
           function () {}, function () {});
    netDevicePut('tok-84');
    if (rest().length < 2)
      no('85: サインインしているのに出ていない ── ' + rest().length + ' 本');
    const restAuth = auth.filter(a => a.u.indexOf('/rest/v1/') >= 0);
    for (let i = 0; i < restAuth.length; i++) {
      if (restAuth[i].v !== 'Bearer ' + SESS.at)
        no('85: **本人の token で署名していない** ── ' +
           restAuth[i].u.split('/rest/v1/')[1] + ' が ' +
           JSON.stringify(restAuth[i].v.slice(0, 24) + '…') +
           '。匿名キーで行くと、その人の物ではなく誰の物でもない物を訊いたことに' +
           'なります');
    }
    if (restAuth.length !== rest().length)
      no('85: Authorization の付いていない道がある ── ' + rest().length +
         ' 本のうち ' + restAuth.length + ' 本にしか付いていない');

    XMLHttpRequest.prototype.open = openWas;
    XMLHttpRequest.prototype.setRequestHeader = hdrWas;
    start();
    say('85: サインインしていなければ `/rest/v1/*` は一本も線に乗らない ── ' +
        '断りはアプリの文（`net.session`）、扉（`email_taken` と `/auth/v1/*`）は' +
        '通る、そしてサインインしていればどの一本も `Bearer <SESS.at>` で、' +
        '匿名キーは Authorization に載らない（OWNER 2026-09-22）');
  }

  /* ---- 89. 通知をどこまで読んだかはアカウントの物（r79） ----------------
     「最後に通知の画面を開いた時刻より新しいものを未読とする」 OWNER 2026-09-01
     ── その Reason は「時刻一つなら、どの端末で開いても同じ答え」。端末に
     しか無ければそうならない。`profile.prefs` で上がり、次の端末で降り、
     別のアカウントには付いていかない。 */
  {
    start();
    netOut(); arrive(A);
    const sent89 = [], keep89 = netSend;
    netSend = function (method, p, body, tok, ok, bad) {
      if (String(p).indexOf('/rest/v1/rpc/prefs_put') === 0) sent89.push(body);
      ok(body && body.p ? body.p : []);
    };
    SET.notAt = 1000;
    NOTES_HAVE = [{ kind: 'like', at: 5000, hd: 'x' }];
    notSeen();
    netSend = keep89;
    const up89 = sent89.filter(b => b && b.p && typeof b.p.notAt === 'number');
    if (!up89.length)
      no('89: 通知を読んでも notAt がサーバーへ上がらない ── 端末ごとの答えのまま');
    netPrefsGot({ notAt: 777777 });
    if (SET.notAt !== 777777) no('89: サーバーの notAt が手元に来ない ── ' + SET.notAt);
    netOut(); arrive(B);
    if (SET.notAt === 777777) no('89: 前のアカウントの既読位置が次の人に付いてきた');
    NOTES_HAVE = null;
    say('89: 通知をどこまで読んだかはアカウントの物 ── 読んだら profile.prefs で上がり、' +
        '降りてきた値が手元に来て、別の人には付いていかない');
  }

  /* ---- 90. ☆ は一度も渡さない ── 答えがその一覧、前の ☆ は写して残す（r79）
     「オンラインのみで行こう」（2026-09-04）とルール 22 が「次つながった時に
     更新される」より新しい。表より前から端末にあった ☆ を一度だけ上げる道を
     消した。上げない、そして消さない。 */
  {
    start();
    netOut(); arrive(A);
    const wr90 = [], keep90 = netSend;
    netSend = function (method, p, body, tok, ok, bad) {
      if (String(p).indexOf('/rest/v1/saved_search') === 0 && method !== 'GET') wr90.push(method);
      ok(method === 'GET' ? [] : {});
    };
    SET.saved = ['まえの星']; delete SET.savedUp; delete SET.savedWas;
    let ok90 = false;
    askSaved(function () { ok90 = true; }, function () {});
    netSend = keep90;
    if (wr90.length) no('90: 端末の ☆ をサーバーへ上げた ── ' + wr90.join(' '));
    if (!ok90) no('90: 答えが来たのに一覧が答えにならない');
    if (snsSaved().length) no('90: 画面の ☆ がサーバーの答えではない ── ' + JSON.stringify(snsSaved()));
    if (JSON.stringify(SET.savedWas) !== JSON.stringify(['まえの星']))
      no('90: 上げなかった ☆ が残っていない（読まない、消さない）── ' + JSON.stringify(SET.savedWas));
    say('90: ☆ は一度も渡さない ── 上がった要求 ' + wr90.length + '、画面はサーバーの答え、' +
        '前の ☆ は savedWas に写して残る');
  }

  /* ---- 91. 書けない保存は黙らない（規則 11、r79） ---------------------
     「保存しないのは仕様、黙って保存しないのは違う」。サーバーがまだ持ち主を
     言っていない言語で一語足して保存 ── 書かれない、そして「保存できません
     でした」。同じ時に設定だけを変えた保存は、ちゃんと書けたので何も言わない。 */
  {
    start();
    const said91 = [], realToast91 = window.toast;
    window.toast = (m) => { said91.push(String(m)); };
    delete LOWN[langId];                           /* 答えがまだ来ていない */
    if (!langLocked()) no('91: (前提) 言語が書ける ── 測りたい状態ではない');
    SET.theme = 'dark'; save();
    const quiet91 = said91.slice();
    WORDS.push({ hw: 'unsaved91', mns: ['x'], pos: 'n', at: 1 });
    save();
    window.toast = realToast91;
    WORDS.pop();
    langOwnGot(langId, A);
    if (quiet91.length) no('91: 設定だけの保存が「保存できませんでした」と言った ── ' + quiet91.join(' / '));
    if (said91.indexOf(t('save.no')) < 0)
      no('91: **書けない保存が黙って戻った** ── 打った語は画面にしか無い');
    say('91: 書けない保存は「' + t('save.no') + '」と言う ── 設定だけの保存は言わない');
  }

  /* ---- 93. 顔は描いて書かない（r79、r73 § 2-2） -----------------------
     postAvatar() は投稿の行を描くたびに、顔の無いアカウントへ開いている言語の
     字から顔を書いていた。描くのは読むだけ、書くのは移行（migrateAv）で、
     自分の書ける言語でだけ。 */
  {
    start();
    ME.av = null; ME.pic = '';
    const disk93 = localStorage.getItem(acctKey('me', ACCT_UID));
    postRow({ id: 'p93', at: 1, mine: true, who: meName(), hd: meHandle(), ln: 'ka' });
    postAvatar();
    if (ME.av) no('93: **行を描いただけで顔が書かれた** ── ' + JSON.stringify(ME.av).slice(0, 60));
    if (localStorage.getItem(acctKey('me', ACCT_UID)) !== disk93)
      no('93: 行を描いただけで lingua.me.<uid> が書き換わった');
    if (meRowHas() && LETTERS.some(function (l) { return !!meAvOf(l); })) {
      slAsApp(migrateAll, []);
      if (!ME.av) no('93: 顔の無い古いアカウントに、移行が顔を付けない');
    }
    say('93: 顔は描いて書かない ── 行を描いても ME.av もディスクも動かず、付けるのは移行（自分の言語）');
  }

  return out;
});

/* ---- 86-89. 端末に書く物は書く時に uid を持つ（r79、r73 § 2-7） ----------
   覆う一文: 端末に書く物は書く時に uid を持つ。持ち主の無い物を読んだら
   それは誰の物にもならない。アカウントが変わる時に忘れる物は、アカウントで
   引ける一つの入れ物（`ACCT`、www/core.js）にあり、`netOut` はそれを一行で
   捨てる。

   印の無い写しは起動の時に読まれる（ページが読み込まれた時）ので、ここは
   本物の読み込みで測ります ── 種を撒いてページを読み直し、サーバーへ出た
   要求を**線の所（ページの外、`pg.route`）で全部**数えます。窓（netSend1・
   netUp・netMedia）の上に置くと、明日足された窓が数えられないので。 */
const phone = async (disk, quiet) => {
  const sent = [];
  await pg.route('https://iimwukyyasbybfrirhsf.supabase.co/**', (route) => {
    const rq = route.request(), u = new URL(rq.url());
    sent.push(rq.method() + ' ' + u.pathname + u.search + ' ' + (rq.postData() || ''));
    if (u.pathname === '/auth/v1/token')
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ access_token: 'h.e30.s', refresh_token: 'r2', user: { id: 'me1' } }) });
    /* 電波の無い所で開いた端末 ── 言語の一覧に答えが無ければ、写しを片付けない
       （www/net.js § netLangsGone）ので、写った索引がそのまま見える。 */
    if (quiet && u.pathname.indexOf('/rest/v1/language') === 0) return route.abort();
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await pg.evaluate((d) => { localStorage.clear(); for (const k in d) localStorage.setItem(k, d[k]); }, disk);
  await pg.reload();
  await pg.waitForTimeout(1500);
  const got = await pg.evaluate((keys) => {
    const now = {}; for (const k of keys) now[k] = localStorage.getItem(k);
    return { me: ME.name + '|' + ME.handle, posts: POSTS.map(p => p.id),
             langs: Object.keys(LANGS), cur: langId, acct: ACCT_UID, now: now,
             moved: localStorage.getItem('lingua.me.me1'),
             screen: document.getElementById('app').innerText };
  }, Object.keys(disk));
  await pg.unroute('https://iimwukyyasbybfrirhsf.supabase.co/**');
  return { sent, got };
};
const OLD = {
  'lingua.sess': JSON.stringify({ at: 'h.e30.s', rt: 'r', uid: 'me1' }),
  'lingua.me': JSON.stringify({ name: 'Oldname', handle: 'oldhandle' }),
  'lingua.posts': JSON.stringify([{ id: 'p-old-86', ln: 'an old line', mine: true, at: 1 }]),
  'lingua.drafts': JSON.stringify([{ id: 'd-old-86', ln: 'an old draft' }]),
  'lingua.langs': JSON.stringify({ '86868686-8686-4686-8686-868686868686': { name: 'Oldtongue' } }),
  'lingua.cur': '86868686-8686-4686-8686-868686868686',
  'lingua.86868686-8686-4686-8686-868686868686.words': JSON.stringify([{ hw: 'oldword', mns: ['old'] }]),
  'lingua.86868686-8686-4686-8686-868686868686.owner.got': 'me1'
};
const R2 = { said: [], fails: [] };
{
  /* 86. 印の無い写し（`lingua.set` に `acct` が無い）がある端末で me1 が起動 ──
     何も読まれず、何も送られず、何も消されない。 */
  const ph = await phone(Object.assign({}, OLD, { 'lingua.set': JSON.stringify({ walked: true }) }));
  const leak = ph.sent.filter(x => /86868686-8686-4686-8686-868686868686|p-old-86|d-old-86|Oldname|oldhandle|oldword/.test(x));
  if (leak.length)
    R2.fails.push('86: **印の無い写しがサーバーへ出た** ── ' + leak.join(' / '));
  if (ph.got.me.indexOf('oldhandle') >= 0 || ph.got.posts.indexOf('p-old-86') >= 0 ||
      ph.got.langs.indexOf('86868686-8686-4686-8686-868686868686') >= 0)
    R2.fails.push('86: 印の無い写しが入ってきた人の物になった ── ' + JSON.stringify(ph.got));
  if (/Oldname|oldhandle|an old line|Oldtongue/.test(ph.got.screen))
    R2.fails.push('86: 印の無い写しが画面に出ている');
  for (const k of Object.keys(OLD))
    if (ph.got.now[k] !== OLD[k] && k !== 'lingua.sess')
      R2.fails.push('86: 印の無い写しが書き換えられた（読まない、消さない）── ' + k);
  R2.said.push('86: 印の無い写しは誰の物にもならない ── 送った要求 ' + ph.sent.length +
               ' 本のうち、その写しを運んだもの ' + leak.length + ' 本、画面に出た物 0、書き換えた鍵 0');

  /* 87. 同じ写しで、`lingua.set` の印が me1 を名指している端末 ── それは me1 の物
     なので、me1 の鍵へ写る（元の鍵は一文字も動かない）。 */
  const ph2 = await phone(Object.assign({}, OLD, { 'lingua.set': JSON.stringify({ walked: true, acct: 'me1', theme: 'dark' }) }), true);
  if (ph2.got.me.indexOf('oldhandle') < 0) R2.fails.push('87: 印の付いた写しが、印の人に写らない（me）── ' + ph2.got.me);
  if (ph2.got.posts.indexOf('p-old-86') < 0) R2.fails.push('87: 印の付いた写しが、印の人に写らない（posts）');
  if (ph2.got.langs.indexOf('86868686-8686-4686-8686-868686868686') < 0) R2.fails.push('87: 印の人が書いた言語が、その人の索引に写らない ── ' + JSON.stringify(ph2.got.langs));
  for (const k of Object.keys(OLD))
    if (k !== 'lingua.sess' && ph2.got.now[k] !== OLD[k])
      R2.fails.push('87: 写したのに元の鍵が変わった ── ' + k);
  R2.said.push('87: 印の付いた写しはその人の鍵へ写る ── 元の鍵は一文字も動かない');
}
/* 88. `netOut` の「忘れる」は一行 ── 本文からコメントを外して、`…Forget(`・
   `…For(`・`…Drop(` の呼び出しを数える。`acctFor('')` 一つだけ。 */
{
  const net = fs.readFileSync(path.join(ROOT, 'net.js'), 'utf8');
  const a = net.indexOf('function netOut(){'), b = net.indexOf('\n}\n', a);
  const body = net.slice(a, b).replace(/\/\*[\s\S]*?\*\//g, '');
  /* `netDeviceDrop(` is the server's `device` row for the account leaving,
     not something this phone remembers -- it is not a forget and is not
     counted (r65 S4: every road out sends it). */
  const calls = (body.match(/[A-Za-z_]+(Forget|For|Drop)\(/g) || []).filter(c => c !== 'netDeviceDrop(');
  if (calls.length !== 1 || calls[0] !== 'acctFor(')
    R2.fails.push('88: netOut() が「忘れる」を ' + calls.length + ' 行並べている ── ' + calls.join(' '));
  R2.said.push('88: netOut() の「忘れる」は ' + calls.length + ' 行（' + calls.join(' ') + '）── 入れ物を一行で捨てる');
}

/* 92. 起動の移行は一つの一覧（`migrateAll`）だけが呼ぶ ── 書けるかを一度訊く所
   （www/core.js § migrateAll、r73 § 2-2）。`function migrate…` を www/ の全部から
   数え、それぞれが migrateAll の本文から呼ばれていて、どのファイルの一番上からも
   呼ばれていないこと。明日足された移行も明日数えられる。 */
{
  const strip = (x) => x.replace(/\/\*[\s\S]*?\*\//g, '');
  const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.js'));
  const defs = [], top = [];
  let all = '';
  for (const f of files) {
    const src = strip(fs.readFileSync(path.join(ROOT, f), 'utf8'));
    let m; const re = /^function (migrate[A-Za-z]+)\(/gm;
    while ((m = re.exec(src))) if (m[1] !== 'migrateAll') defs.push(m[1]);
    const rt = /^(migrate[A-Za-z]*)\(\);/gm;
    while ((m = rt.exec(src))) top.push(f + ':' + m[1]);
    if (f === 'core.js') {
      const a = src.indexOf('function migrateAll(){'), b = src.indexOf('\n}\n', a);
      all = src.slice(a, b);
    }
  }
  const outside = defs.filter(d => all.indexOf(d + '(') < 0);
  if (outside.length) R2.fails.push('92: migrateAll() の外の移行 ── ' + outside.join(' '));
  if (top.length) R2.fails.push('92: ファイルの一番上から呼ばれる移行 ── ' + top.join(' '));
  R2.said.push('92: 起動の移行 ' + defs.length + ' 本は全部 migrateAll() から ── 一番上から呼ぶもの ' + top.length);
}

await br.close();
srv.close();

R.said = R.said.concat(R2.said); R.fails = R.fails.concat(R2.fails);
for (const s of R.said) console.log('  ' + s);
if (R.fails.length) {
  console.error('');
  for (const f of R.fails) console.error('  ✗ ' + f);
  console.error('\nacct-check: ' + R.fails.length + ' 件。');
  process.exit(1);
}
console.log('\nacct-check: 全部通った。');
